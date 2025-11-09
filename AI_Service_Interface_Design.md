# ReNews AI 服务接口设计文档

## 文档信息

- **文档版本**: v1.0
- **创建日期**: 2025-11-09
- **适用范围**: 后端开发团队
- **相关模块**: document-generation（选题策划→大纲编辑→正文编辑）

---

## 目录

1. [系统架构概览](#1-系统架构概览)
2. [现有AI服务](#2-现有ai服务)
3. [缺失AI服务清单](#3-缺失ai服务清单)
4. [详细接口定义](#4-详细接口定义)
5. [实施路线图](#5-实施路线图)
6. [开发指南](#6-开发指南)

---

## 1. 系统架构概览

### 1.1 整体架构

ReNews 采用 **分层 AI 服务架构**：

```
┌─────────────────────────────────────────────────┐
│              前端应用 (Vue 3)                     │
│  ┌──────────────┬──────────────┬──────────────┐ │
│  │ 选题策划      │  大纲编辑     │  正文编辑     │ │
│  │ Topic Sel.   │   Outline    │   Content    │ │
│  └──────┬───────┴──────┬───────┴──────┬───────┘ │
│         │              │              │         │
│         └──────────────┴──────────────┘         │
│                      │                          │
│            DocumentGenerateService               │
│              (统一服务层)                         │
└──────────────────────┼──────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │      AI Agent 服务层        │
         │  ┌─────┐ ┌─────┐ ┌─────┐  │
         │  │Scope│ │Title│ │Outline│  │
         │  │Agent│ │Agent│ │Agent │  │
         │  └─────┘ └─────┘ └─────┘  │
         │  ┌─────┐ ┌─────┐ ┌─────┐  │
         │  │Content│ │Text │ │Material│ │
         │  │Agent  │ │Agent│ │Agent  │ │
         │  └─────┘ └─────┘ └─────┘  │
         └──────────────────────────┘
```

### 1.2 核心特性

- ✅ **异步任务管理**: 所有 AI 服务支持异步执行
- ✅ **状态轮询**: 2秒间隔，120秒超时
- ✅ **任务持久化**: 集成数据库同步服务
- ✅ **Mock/真实切换**: 支持开发阶段 Mock 数据
- ✅ **统一错误处理**: 基于 AiErrorResponse 标准

### 1.3 技术规范

- **基础服务类**: `BaseApiService`
- **任务轮询器**: `AsyncTaskPoller`
- **数据库同步**: `databaseSyncService`
- **类型定义**: `src/types/api.d.ts`

---

## 2. 现有AI服务

### 2.1 已实现服务清单

| Agent                  | 功能         | 端点                          | 状态      | 优先级 |
| ---------------------- | ------------ | ----------------------------- | --------- | ------ |
| **Scope Agent**        | 研究简报生成 | `/scope-agent/execute`        | ✅ 已实现 | 已完成 |
| **Search2Title Agent** | 搜索转标题   | `/search2title-agent/execute` | ✅ 已实现 | 已完成 |
| **Title Agent**        | 标题生成     | `/title-agent/generate`       | ✅ 已实现 | 已完成 |
| **Outline Agent**      | 大纲生成     | `/outline-agent/generate`     | ✅ 已实现 | 已完成 |

### 2.2 服务使用流程

```
1. 选题策划 (topic-selection)
   ↓
   Scope Agent → 研究简报生成
   ↓
   Search2Title Agent → 搜索数据
   ↓
   Title Agent → 标题候选
   ↓
   2. 大纲编辑 (outline)
   ↓
   Outline Agent → 大纲结构
   ↓
   3. 正文编辑 (content)  ← **缺失核心服务**
```

---

## 3. 缺失AI服务清单

### 3.1 关键缺失 (阻塞核心流程)

| 服务                     | 功能描述                  | 优先级  | 依赖模块          |
| ------------------------ | ------------------------- | ------- | ----------------- |
| **Content Agent**        | 基于标题+大纲生成完整正文 | 🔴 最高 | content/index.vue |
| **Text Polish Agent**    | 文本润色                  | 🔴 最高 | content/index.vue |
| **Text Expand Agent**    | 文本扩写                  | 🔴 最高 | content/index.vue |
| **Text Summarize Agent** | 文本总结                  | 🔴 最高 | content/index.vue |
| **Text Translate Agent** | 文本翻译                  | 🔴 最高 | content/index.vue |
| **Text Rewrite Agent**   | 文本改写                  | 🔴 最高 | content/index.vue |

### 3.2 高级功能 (优化体验)

| 服务                  | 功能描述     | 优先级 | 依赖模块          |
| --------------------- | ------------ | ------ | ----------------- |
| **Section Generate**  | 章节内容生成 | 🟡 中  | content/index.vue |
| **Content Continue**  | 内容续写     | 🟡 中  | content/index.vue |
| **Material Agent**    | 素材分析增强 | 🟡 中  | outline/index.vue |
| **Quality Assurance** | 质量检查     | 🟢 低  | content/index.vue |
| **SEO Optimize**      | SEO优化建议  | 🟢 低  | content/index.vue |

---

## 4. 详细接口定义

> ⚠️ **重要提示**: 所有接口必须遵循现有架构模式
>
> - 基于 `BaseApiService` 实现
> - 支持异步任务（>10秒的任务）
> - 返回格式符合 `AiResponse<T>` 标准
> - 错误处理使用 `AiErrorResponse`

---

## 4.1 Content Agent - 核心内容生成

### 接口: `POST /content-agent/generate`

**功能**: 基于选中的标题、大纲结构和研究素材，生成完整的文档正文。

**请求参数**:

```typescript
interface ContentAgentGenerateRequest {
  // 核心输入
  title: {
    id: number
    title: string
    angle: string
    why_now: string
    news_values: string[]
  }

  outline: Array<{
    id: number
    level: number // 1: 一级标题, 2: 二级标题, 3: 三级标题
    title: string
    content_direction?: string
    data_requirements?: string[]
  }>

  research_brief: string // 研究简报内容

  materials: Array<{
    id: number
    title: string
    content: string
    type: 'text' | 'image' | 'video' | 'url'
    source: string
  }>

  // 配置参数
  writing_style: 'professional' | 'casual' | 'academic' | 'journalistic'
  target_length: number // 目标字数
  tone: string // 语调要求
  requirements: string[] // 特殊要求列表
}
```

**响应数据**:

```typescript
interface ContentAgentGenerateResponse {
  success: true
  task_id: string // 异步任务ID
  estimated_time: number // 预估生成时间（秒）

  // 轮询状态查询返回完整内容
  content?: {
    markdown: string // 完整Markdown内容
    sections: Array<{
      outline_id: number
      title: string
      content: string
      word_count: number
      sources: string[] // 引用素材ID列表
    }>
    word_count: number
    generation_time: number // 实际生成时间（毫秒）
    readability_score: number // 可读性评分
  }
}
```

**实现细节**:

- 预估生成时间: `outline_sections * 2秒` (每章节2秒)
- 最大支持: 50个章节
- 超时设置: 180秒
- 缓存策略: 基于 `(title_id + outline_hash)` 缓存24小时

---

## 4.2 Text Processing Agents - 文本选择AI功能

### 4.2.1 文本润色 - `POST /text-agent/polish`

**功能**: 对选中的文本进行润色，提升表达质量。

**请求参数**:

```typescript
interface TextPolishRequest {
  text: string
  style?: 'concise' | 'eloquent' | 'professional' // 润色风格
  level?: 'light' | 'medium' | 'deep' // 润色程度
  preserve_tone?: boolean // 保持原语调
}
```

**响应数据**:

```typescript
interface TextPolishResponse {
  success: true
  original_text: string
  polished_text: string
  changes: Array<{
    type: 'word_choice' | 'structure' | 'tone' | 'grammar'
    description: string
    original_segment: string
    polished_segment: string
  }>
  improvement_score: number // 提升评分 (0-100)
}
```

---

### 4.2.2 文本扩写 - `POST /text-agent/expand`

**功能**: 基于选中的文本进行扩写，增加内容深度。

**请求参数**:

```typescript
interface TextExpandRequest {
  text: string
  target_length: number // 目标字数
  style: string // 扩写风格
  focus_points?: string[] // 重点扩写方向
  maintain_structure: boolean // 保持原有结构
}
```

**响应数据**:

```typescript
interface TextExpandResponse {
  success: true
  original_text: string
  expanded_text: string
  added_words: number
  expansion_ratio: number // 扩写比例
  focus_achievements: Array<{
    focus_point: string
    added_content: string
  }>
}
```

---

### 4.2.3 文本总结 - `POST /text-agent/summarize`

**功能**: 对选中的文本进行总结，提炼核心要点。

**请求参数**:

```typescript
interface TextSummarizeRequest {
  text: string
  target_length?: number | 'short' | 'medium' | 'long'
  focus?: string // 总结重点
  output_format: 'bullet' | 'paragraph' | 'key_points' // 输出格式
}
```

**响应数据**:

```typescript
interface TextSummarizeResponse {
  success: true
  summary: string
  key_points: string[] // 关键要点
  word_reduction: number // 压缩字数
  compression_ratio: number // 压缩比例
  main_topics: string[] // 主要话题
}
```

---

### 4.2.4 文本翻译 - `POST /text-agent/translate`

**功能**: 对选中的文本进行翻译，支持多语言。

**请求参数**:

```typescript
interface TextTranslateRequest {
  text: string
  target_language: string // 'en', 'zh', 'ja', 'ko', 'es', 'fr', 'de'
  preserve_format: boolean // 保持格式
  tone?: string // 翻译语调
  technical_terms?: Array<{
    // 术语翻译对照
    source: string
    target: string
  }>
}
```

**响应数据**:

```typescript
interface TextTranslateResponse {
  success: true
  original_text: string
  translated_text: string
  source_language: string
  target_language: string
  detected_terms: Array<{
    // 检测到的专业术语
    term: string
    translated: string
    confidence: number
  }>
}
```

---

### 4.2.5 文本改写 - `POST /text-agent/rewrite`

**功能**: 改写选中的文本，避免重复，表达多样化。

**请求参数**:

```typescript
interface TextRewriteRequest {
  text: string
  style: 'paraphrase' | 'formal' | 'casual' | 'creative' | 'academic'
  preserve_key_points: boolean // 保持关键观点
  similarity_threshold: number // 相似度阈值 (0.1-0.9)
}
```

**响应数据**:

```typescript
interface TextRewriteResponse {
  success: true
  original_text: string
  rewritten_text: string
  similarity_score: number // 与原文相似度
  word_changes: number // 替换词汇数
  structural_changes: Array<{
    type: 'restructure' | 'vocabulary' | 'syntax'
    description: string
  }>
}
```

---

## 4.3 Content Agent - 高级功能

### 4.3.1 章节内容生成 - `POST /content-agent/generate-section`

**功能**: 生成单个章节的内容，不生成整篇文档。

**请求参数**:

```typescript
interface GenerateSectionRequest {
  section: {
    id: number
    level: number
    title: string
    content_direction: string
    data_requirements: string[]
  }
  title: {
    id: number
    title: string
    angle: string
  }
  research_brief: string
  materials: Material[]
  previous_content?: string // 前一章节内容
  next_section_title?: string // 下一章节标题
}
```

**响应数据**:

```typescript
interface GenerateSectionResponse {
  success: true
  section_id: number
  content: string
  word_count: number
  sources: string[] // 引用素材ID
  key_points: string[] // 本章节核心观点
  connection_to_next?: string // 与下一章节的连接
}
```

---

### 4.3.2 内容续写 - `POST /content-agent/continue`

**功能**: 基于已有内容，智能续写下一段。

**请求参数**:

```typescript
interface ContentContinueRequest {
  content: string // 当前内容
  direction: string // 续写方向指导
  target_length: number // 续写字数
  maintain_style: boolean // 保持写作风格
}
```

**响应数据**:

```typescript
interface ContentContinueResponse {
  success: true
  original_content: string
  continued_content: string
  added_words: number
  flow_score: number // 流畅度评分 (0-100)
  suggestions?: string[] // 后续写作建议
}
```

---

## 4.4 Material Enhancement Agent - 素材增强

### 4.4.1 素材分析 - `POST /material-agent/analyze`

**功能**: 智能分析素材，提取关键信息和适用场景。

**请求参数**:

```typescript
interface MaterialAnalyzeRequest {
  materials: Array<{
    id: number
    title: string
    content: string
    type: 'text' | 'image' | 'video' | 'url'
  }>
  analysis_type: 'summary' | 'key_points' | 'citation' | 'relevance' | 'comprehensive'
}
```

**响应数据**:

```typescript
interface MaterialAnalyzeResponse {
  success: true
  analyzed_materials: Array<{
    id: number
    analysis: string // AI分析结果
    key_points: string[] // 关键要点
    relevance_score: number // 与项目的相关性 (0-100)
    suggested_usage: string[] // 建议使用场景
    extraction_type?: 'facts' | 'quotes' | 'statistics' | 'examples'
    confidence: number // AI置信度 (0-1)
  }>
}
```

---

## 4.5 Quality Assurance Agent - 质量保证

### 4.5.1 内容质量检查 - `POST /qa-agent/check`

**功能**: 全面检查内容质量，包括语法、事实、一致性等。

**请求参数**:

```typescript
interface QualityCheckRequest {
  content: string
  title: {
    id: number
    title: string
    angle: string
  }
  outline: OutlineSection[]
  check_types: Array<'grammar' | 'fact' | 'coherence' | 'style' | 'plagiarism'>
}
```

**响应数据**:

```typescript
interface QualityCheckResponse {
  success: true
  quality_score: number // 整体质量评分 (0-100)
  issues: Array<{
    type: 'grammar' | 'fact' | 'coherence' | 'style' | 'plagiarism'
    severity: 'low' | 'medium' | 'high'
    description: string
    suggestion: string
    location: {
      line: number
      column: number
    }
    auto_fixable: boolean
  }>
  suggestions: string[] // 改进建议
  readability_score: number // 可读性评分
  structure_score: number // 结构评分
}
```

---

## 5. 实施路线图

### Phase 1: 核心内容功能 (立即实施 - Week 1)

**目标**: 打通完整的内容创作工作流

#### 任务清单

| 任务 | 接口                         | 预估工期 | 依赖 | 优先级  |
| ---- | ---------------------------- | -------- | ---- | ------- |
| T1.1 | Content Agent - 完整内容生成 | 3天      | 无   | 🔴 最高 |
| T1.2 | Text Polish Agent            | 2天      | 无   | 🔴 最高 |
| T1.3 | Text Expand Agent            | 2天      | 无   | 🔴 最高 |
| T1.4 | Text Summarize Agent         | 2天      | 无   | 🔴 最高 |
| T1.5 | Text Translate Agent         | 2天      | 无   | 🔴 最高 |
| T1.6 | Text Rewrite Agent           | 2天      | 无   | 🔴 最高 |

**验收标准**:

- [ ] 前端能够调用所有6个接口
- [ ] Mock 数据返回格式正确
- [ ] 异步任务轮询正常工作
- [ ] 错误处理符合标准

---

### Phase 2: 高级内容功能 (Week 2-3)

**目标**: 优化内容生成质量和用户体验

#### 任务清单

| 任务 | 接口                        | 预估工期 | 依赖 | 优先级 |
| ---- | --------------------------- | -------- | ---- | ------ |
| T2.1 | Section Generate - 章节生成 | 3天      | T1.1 | 🟡 中  |
| T2.2 | Content Continue - 续写     | 2天      | T1.1 | 🟡 中  |
| T2.3 | Material Agent - 素材分析   | 3天      | 无   | 🟡 中  |

**验收标准**:

- [ ] 章节生成支持流式输出
- [ ] 续写功能保持内容连贯性
- [ ] 素材分析准确率 > 85%

---

### Phase 3: 质量保证 (Week 4-5)

**目标**: 提供内容质量保障和优化建议

#### 任务清单

| 任务 | 接口                         | 预估工期 | 依赖 | 优先级 |
| ---- | ---------------------------- | -------- | ---- | ------ |
| T3.1 | Quality Assurance - 质量检查 | 4天      | T1.1 | 🟢 低  |
| T3.2 | SEO Optimize - SEO优化       | 3天      | T1.1 | 🟢 低  |

**验收标准**:

- [ ] 质量检查覆盖5个维度
- [ ] 自动修复成功率 > 60%
- [ ] SEO评分算法准确

---

## 6. 开发指南

### 6.1 项目结构建议

```
src/
├── services/
│   ├── modules/
│   │   ├── contentAgent.ts         # 新增: 内容生成服务
│   │   ├── textAgent.ts            # 新增: 文本处理服务
│   │   ├── materialAgent.ts        # 新增: 素材增强服务
│   │   └── qaAgent.ts              # 新增: 质量保证服务
│   └── documentGenerateService.ts  # 已有: 统一服务管理
├── types/
│   └── api.d.ts                    # 已有: 类型定义
└── mock/
    ├── data/
    │   ├── contentAgentMock.ts      # 新增: Mock数据
    │   ├── textAgentMock.ts         # 新增: Mock数据
    │   └── materialAgentMock.ts     # 新增: Mock数据
    └── dataManager.ts               # 已有: Mock管理器
```

### 6.2 编码规范

#### 6.2.1 接口实现模板

```typescript
// services/modules/contentAgent.ts
import { BaseApiService } from '@/services/baseApiService'
import type { ContentAgentGenerateRequest, ContentAgentGenerateResponse } from '@/types/api'

class ContentAgentService extends BaseApiService {
  /**
   * 生成完整内容
   */
  async generateContent(request: ContentAgentGenerateRequest) {
    return this.post<ContentAgentGenerateResponse>('/content-agent/generate', request)
  }

  /**
   * 查询生成状态
   */
  async getGenerationStatus(taskId: string) {
    return this.get<ContentAgentGenerateResponse>(`/content-agent/status/${taskId}`)
  }
}

export const contentAgentService = new ContentAgentService()
```

#### 6.2.2 Mock 数据实现

```typescript
// mock/data/contentAgentMock.ts
import { mockResponse, mockTaskId, mockDelay } from '../utils'

export const contentAgentMock = {
  generateContent: () => {
    return mockDelay(
      () =>
        mockResponse({
          success: true,
          task_id: mockTaskId(),
          estimated_time: 30,
          content: {
            markdown: '# 生成的文档内容...\n\n完整的Markdown格式内容',
            sections: [],
            word_count: 1500,
            generation_time: 28000,
            readability_score: 85
          }
        }),
      1000
    )
  }
}
```

### 6.3 错误处理标准

所有接口必须返回统一错误格式：

```typescript
interface AiErrorResponse {
  success: false
  error: {
    code: string // 错误代码
    message: string // 错误信息
    details?: any // 详细信息
    suggestion?: string // 解决建议
  }
  timestamp: string
  request_id: string
}
```

**标准错误代码**:

| 错误类型   | 错误码                | 说明             | 解决方案             |
| ---------- | --------------------- | ---------------- | -------------------- |
| 参数错误   | `INVALID_PARAM`       | 请求参数不合法   | 检查必填参数和格式   |
| 任务超时   | `TASK_TIMEOUT`        | AI任务执行超时   | 增加超时时间或重试   |
| 服务不可用 | `SERVICE_UNAVAILABLE` | AI服务暂时不可用 | 稍后重试或联系管理员 |
| 内容过长   | `CONTENT_TOO_LONG`    | 请求内容超出限制 | 缩短内容或分段处理   |
| 敏感内容   | `SENSITIVE_CONTENT`   | 检测到敏感内容   | 修改输入内容         |

### 6.4 性能优化建议

1. **缓存策略**:

   - Content Agent: 基于 `(title_id + outline_hash)` 缓存24小时
   - Text Agents: 基于 `(text_hash + params)` 缓存12小时
   - Material Agent: 基于 `(material_id + type)` 缓存48小时

2. **并发控制**:

   - 单个用户并发任务数: 最多3个
   - 任务队列大小: 最多10个
   - 超时设置: 180秒

3. **资源限制**:
   - 文本润色/扩写: 最大5000字符
   - 文本总结: 输入最大10000字符
   - 完整内容生成: 最多50个章节

### 6.5 测试建议

1. **单元测试**:

   - 接口参数验证
   - Mock 数据正确性
   - 错误处理逻辑

2. **集成测试**:

   - 完整工作流测试
   - 异步任务轮询
   - 数据库同步

3. **性能测试**:
   - 并发任务处理
   - 大文本处理能力
   - 缓存命中率

---

## 附录

### A. 术语表

| 术语               | 定义                               |
| ------------------ | ---------------------------------- |
| **Agent**          | AI 智能体，封装特定功能的AI服务    |
| **Task**           | 异步任务，用于处理耗时较长的AI操作 |
| **Poller**         | 轮询器，定期查询任务状态           |
| **Mock**           | 模拟数据，开发阶段替代真实API      |
| **Outline**        | 文档大纲，章节结构                 |
| **Research Brief** | 研究简报，背景信息总结             |

### B. 相关文档

- `src/services/documentGenerateService.ts` - 统一AI服务管理
- `src/types/api.d.ts` - API类型定义
- `src/utils/polling/asyncTaskPoller.ts` - 异步任务轮询器
- `src/utils/dev/testAiApi.ts` - AI服务测试工具

### C. 联系方式

- **架构问题**: 前端负责人
- **API问题**: 后端负责人
- **业务问题**: 产品经理

---

**文档结束**

> 📝 **更新记录**
>
> - v1.0 (2025-11-09): 初始版本，完成核心接口定义
> - 后续更新请在此处记录
