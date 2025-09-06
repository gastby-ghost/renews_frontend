# AI文档生成功能实现文档

## 概述

本文档详细描述了在Art Design Pro项目中新增的AI文档生成功能的实现细节。该功能提供了一个完整的AI辅助文档创作工作流，包括项目创建、需求定义、标题选择、大纲编辑和正文创作等步骤。

## 功能架构

### 1. 路由配置

在 `src/router/routes/asyncRoutes.ts` 中添加了AI创作菜单：

```typescript
{
  path: '/document-generation',
  name: 'DocumentGeneration',
  component: RoutesAlias.Layout,
  meta: {
    title: 'menus.documentGeneration.title',
    icon: '&#xe8a8;',
    showTextBadge: 'AI'
  },
  children: [
    {
      path: 'project-list',
      name: 'DocumentProjectList',
      component: RoutesAlias.DocumentGeneration,
      meta: {
        title: 'menus.documentGeneration.projectList',
        keepAlive: true
      }
    },
    {
      path: 'requirements/:projectId',
      name: 'DocumentRequirements',
      component: RoutesAlias.DocumentRequirements,
      meta: {
        title: 'menus.documentGeneration.requirements',
        keepAlive: true,
        isHide: true,
        activePath: '/document-generation/project-list'
      }
    },
    // ... 其他子路由
  ]
}
```

### 2. 路由别名

在 `src/router/routesAlias.ts` 中添加了文档生成相关的路由别名：

```typescript
// 文档生成 - AI创作
;(DocumentGeneration = '/document-generation/project-list'), // 项目列表
  (DocumentRequirements = '/document-generation/requirements'), // 需求表单
  (DocumentTitle = '/document-generation/title'), // 标题选择
  (DocumentOutline = '/document-generation/outline'), // 大纲
  (DocumentContent = '/document-generation/content') // 正文
```

## 页面组件

### 1. 项目列表页面 (`src/views/document-generation/project-list/index.vue`)

**功能特点：**

- 自定义页面头部设计，包含标题、副标题和搜索功能
- 项目卡片式展示，包含进度指示器
- 支持项目创建、编辑、删除
- 四级进度步骤显示（需求、标题、大纲、正文）
- 实时搜索功能，支持按项目名称和描述搜索
- 响应式网格布局

**核心组件：**

- 自定义页面头部：包含页面标题、副标题、搜索框和创建按钮
- 项目卡片：显示项目信息、进度、操作按钮
- 创建项目对话框：表单验证和项目创建

**主要改进：**

- 替换了原有的 `ArtTableHeader` 组件，采用自定义页面头部设计
- 添加了实时搜索功能，支持按项目名称和描述搜索
- 优化了移动端响应式布局

**数据结构：**

```typescript
interface Project {
  id: string
  name: string
  description: string
  type: string
  status: 'draft' | 'in_progress' | 'completed'
  currentStep: number
  createTime: string
  updateTime: string
  requirements?: any
  titles?: any[]
  outline?: any
  content?: any
}
```

### 2. 需求定义页面 (`src/views/document-generation/requirements/index.vue`)

**功能特点：**

- 多步骤表单，包含主题、受众、文档类型等字段
- 关键要点标签输入
- 素材选择和AI智能检索
- AI简报生成和编辑
- 步骤进度指示器

**核心功能：**

- 表单验证和错误提示
- AI简报自动生成（基于表单输入）
- 简报内容可编辑
- 素材库集成（模拟）

**AI简报内容：**

- 文档概述
- 目标受众分析
- 内容结构建议
- 关键词建议
- 注意事项

### 3. 标题选择页面 (`src/views/document-generation/title/index.vue`)

**功能特点：**

- 标题生成控制（数量、长度、风格）
- 关键词管理和提取
- 素材选择和AI检索
- 多标题对比和评分
- 标题优势分析

**核心功能：**

- 标题生成参数控制
- 素材多选和AI检索
- 标题评分系统（吸引力、相关性、独特性）
- 标题优势分析展示
- 标题预览和确认

**标题评分维度：**

- 吸引力：标题的吸引程度
- 相关性：与主题的相关程度
- 独特性：标题的独特程度

### 4. 大纲编辑页面 (`src/views/document-generation/outline/index.vue`)

**功能特点：**

- 树形结构大纲编辑
- 章节和子节管理
- 拖拽排序功能
- AI大纲生成
- 大纲内容编辑

**核心功能：**

- 章节添加、删除、重命名
- 子节管理和内容编辑
- 章节顺序调整
- AI智能大纲生成
- 大纲结构可视化

**大纲结构：**

```typescript
interface OutlineSection {
  id: string
  title: string
  subsections: OutlineSubsection[]
}

interface OutlineSubsection {
  id: string
  title: string
  content: string
}
```

### 5. 正文编辑页面 (`src/views/document-generation/content/index.vue`)

**功能特点：**

- 富文本编辑器集成
- 文档大纲侧边栏
- AI助手和建议
- 实时字数统计
- 文档预览和导出

**核心功能：**

- 富文本编辑（WangEditor）
- 大纲导航和同步
- AI内容生成
- AI建议和对话
- 文档导出（HTML格式）

**AI助手功能：**

- 内容建议
- 结构建议
- 风格建议
- 实时对话
- 智能问答

## 数据存储

### 本地存储方案

项目使用localStorage进行数据持久化：

```typescript
// 项目数据
localStorage.setItem(`project_${projectId}`, JSON.stringify(projectData))

// 需求数据
localStorage.setItem(`project_${projectId}_requirements`, JSON.stringify(requirementsData))

// 标题数据
localStorage.setItem(`project_${projectId}_titles`, JSON.stringify(titlesData))

// 大纲数据
localStorage.setItem(`project_${projectId}_outline`, JSON.stringify(outlineData))

// 正文数据
localStorage.setItem(`project_${projectId}_content`, JSON.stringify(contentData))
```

### 数据结构

**项目基础数据：**

```typescript
{
  id: string
  name: string
  description: string
  type: string
  status: 'draft' | 'in_progress' | 'completed'
  currentStep: number
  createTime: string
  updateTime: string
}
```

**需求数据：**

```typescript
{
  requirements: RequirementsForm
  aiBriefing: AIBriefing
  updatedAt: string
}
```

## AI功能集成

### 1. AI简报生成

基于用户需求自动生成简报，包含：

- 文档概述
- 目标受众分析
- 内容结构建议
- 关键词建议
- 注意事项

### 2. AI标题生成

根据素材和关键词生成多个标题选项，包含：

- 标题评分
- 优势分析
- 关键词匹配
- 风格适配

### 3. AI大纲生成

基于标题和需求自动生成文档大纲：

- 章节结构
- 子节划分
- 内容要点
- 逻辑顺序

### 4. AI正文生成

根据大纲生成完整文档内容：

- 章节内容
- 段落组织
- 语言表达
- 格式排版

### 5. AI助手功能

提供实时的写作辅助：

- 内容建议
- 结构优化
- 风格调整
- 问答对话

## 用户界面设计

### 设计原则

1. **步骤清晰**：四步工作流程清晰展示
2. **操作直观**：界面元素布局合理，操作逻辑清晰
3. **反馈及时**：操作结果及时反馈
4. **响应式设计**：适配不同屏幕尺寸

### 视觉设计

1. **步骤指示器**：显示当前进度和完成状态
2. **卡片布局**：项目展示采用卡片式设计
3. **颜色系统**：使用Element Plus主题色彩
4. **图标系统**：统一的图标风格

## 技术实现

### 前端技术栈

- **Vue 3**：组合式API
- **TypeScript**：类型安全
- **Element Plus**：UI组件库
- **WangEditor**：富文本编辑器
- **SCSS**：样式预处理

### 组件架构

```
src/views/document-generation/
├── project-list/          # 项目列表
│   └── index.vue
├── requirements/          # 需求定义
│   └── index.vue
├── title/                 # 标题选择
│   └── index.vue
├── outline/               # 大纲编辑
│   └── index.vue
└── content/               # 正文编辑
    └── index.vue
```

### 状态管理

使用Vue 3的响应式系统和localStorage进行状态管理：

```typescript
const requirementsForm = reactive<RequirementsForm>({
  topic: '',
  targetAudience: '',
  documentType: '',
  wordCount: 2000,
  tone: 'professional',
  keyPoints: [],
  specialRequirements: '',
  referenceMaterials: []
})
```

## 性能优化

### 1. 延迟加载

组件按需加载，减少初始加载时间：

```typescript
const DocumentGeneration = defineAsyncComponent(
  () => import('@/views/document-generation/project-list/index.vue')
)
```

### 2. 数据缓存

重要数据缓存到localStorage，减少重复请求：

```typescript
localStorage.setItem(`project_${projectId}_content`, documentContent.value)
```

### 3. 防抖处理

输入框等频繁操作使用防抖：

```typescript
const debouncedSave = debounce(saveContent, 500)
```

## 错误处理

### 1. 表单验证

使用Element Plus的表单验证：

```typescript
const requirementsRules: FormRules = {
  topic: [
    { required: true, message: '请输入文档主题', trigger: 'blur' },
    { min: 2, max: 100, message: '主题长度应在2-100个字符之间', trigger: 'blur' }
  ]
}
```

### 2. 操作反馈

所有操作都有相应的反馈：

```typescript
ElMessage.success('AI简报生成成功！')
ElMessage.error('标题生成失败')
```

### 3. 异常捕获

异步操作异常处理：

```typescript
try {
  await generateAIBriefing()
} catch (error) {
  ElMessage.error('操作失败')
}
```

## 扩展性

### 1. 模块化设计

各功能模块独立，便于扩展和维护：

- 项目管理系统
- 需求定义模块
- 标题生成引擎
- 大纲编辑工具
- 内容编辑器

### 2. 插件化架构

AI功能采用插件化设计，便于集成新的AI服务：

```typescript
interface AIService {
  generateBriefing(requirements: RequirementsForm): Promise<AIBriefing>
  generateTitles(params: TitleGenerationParams): Promise<GeneratedTitle[]>
  generateOutline(title: string, requirements: RequirementsForm): Promise<OutlineSection[]>
  generateContent(outline: OutlineSection[]): Promise<string>
}
```

### 3. 配置化

各种参数和规则可配置：

- 标题生成参数
- AI建议规则
- 文档模板
- 导出格式

## 测试

### 1. 单元测试

各功能模块的单元测试：

```typescript
describe('Document Generation', () => {
  test('should generate AI briefing', async () => {
    const requirements = createMockRequirements()
    const briefing = await generateAIBriefing(requirements)
    expect(briefing).toHaveProperty('overview')
    expect(briefing).toHaveProperty('keywords')
  })
})
```

### 2. 集成测试

端到端的功能测试：

```typescript
describe('Document Creation Workflow', () => {
  test('should complete full document creation', async () => {
    // 创建项目
    const project = await createProject(mockProjectData)

    // 定义需求
    await defineRequirements(project.id, mockRequirements)

    // 选择标题
    const title = await selectTitle(project.id, mockTitles)

    // 编辑大纲
    await editOutline(project.id, mockOutline)

    // 生成内容
    const content = await generateContent(project.id)

    expect(content).toBeTruthy()
  })
})
```

## 部署

### 1. 构建配置

在 `vite.config.ts` 中配置构建选项：

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
        // 其他入口点
      }
    }
  }
})
```

### 2. 环境变量

不同环境的配置：

```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:3000

// .env.production
VITE_API_BASE_URL=https://api.example.com
```

### 3. 性能监控

集成性能监控：

```typescript
// 监控页面加载性能
performance.mark('document-generation-start')
// ... 页面加载逻辑
performance.mark('document-generation-end')
performance.measure('document-generation', 'document-generation-start', 'document-generation-end')
```

## 维护

### 1. 代码规范

遵循项目代码规范：

- TypeScript严格模式
- ESLint代码检查
- Prettier代码格式化
- 组件命名规范

### 2. 文档更新

及时更新相关文档：

- API文档
- 组件文档
- 用户手册
- 开发指南

### 3. 版本管理

使用语义化版本控制：

```
v1.0.0 - 初始版本
v1.1.0 - 新增AI助手功能
v1.2.0 - 优化标题生成算法
```

## 总结

AI文档生成功能提供了一个完整的文档创作解决方案，通过人工智能技术辅助用户完成从需求定义到正文创作的全过程。该功能具有以下特点：

1. **完整的创作流程**：覆盖文档创作的各个环节
2. **强大的AI辅助**：提供智能化的内容生成和建议
3. **友好的用户界面**：直观易用的操作界面
4. **灵活的扩展性**：模块化设计，便于功能扩展
5. **良好的用户体验**：响应式设计，操作流畅

该功能将大大提升用户的文档创作效率和质量，为内容创作者提供强有力的技术支持。未来可以进一步扩展AI能力，支持更多文档类型和创作场景。
