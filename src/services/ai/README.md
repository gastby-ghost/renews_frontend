# AI 服务模块

本目录包含了基于 OpenAPI 配置生成的所有 AI 服务，为前端应用提供统一的 AI 功能接口。

## 服务列表

### 核心生成服务

- **contentGenerateService** - AI 正文生成服务
- **outlineGenerateService** - AI 大纲生成服务
- **titleGenerateService** - AI 标题生成服务

### 搜索与分析服务

- **searchToolsService** - AI 搜索工具服务
- **searchAgentService** - AI 搜索代理服务
- **search2titleAgentService** - AI 搜索到标题代理服务

### 素材与集成服务

- **materialBindService** - AI 素材绑定服务
- **outlineWithMaterialService** - AI 大纲与素材集成服务

### 项目管理服务

- **scopeAgentService** - AI 范围界定代理服务

## 快速开始

### 基本使用

```typescript
import { aiServices } from '@/services/ai'

// 使用标题生成服务
const titleService = aiServices.titleGenerate
const result = await titleService.generateTitles({
  content: '人工智能技术的发展',
  title_type: 'headline',
  count: 5
})

// 使用搜索工具服务
const searchService = aiServices.searchTools
const searchResult = await searchService.searchTools({
  queries: ['机器学习算法'],
  provider: 'tavily',
  max_results: 10
})
```

### 轮询任务处理

所有支持异步处理的任务都提供了轮询功能：

```typescript
// 等待任务完成
const result = await outlineGenerateService.generateOutlineAndWait({
  topic: '人工智能应用研究',
  length: 'detailed'
})

// 或者手动处理轮询
const task = await outlineGenerateService.generateOutlineWithPolling(request)
// 轮询进度监听...
const result = await task.promise
```

### 服务状态检查

```typescript
import { getAllAiServiceStatus } from '@/services/ai'

// 获取所有AI服务状态
const status = await getAllAiServiceStatus()
console.log('AI服务状态:', status)
```

## 统一配置

所有服务都继承自 `BaseApiService`，支持：

- **Mock/真实API切换** - 通过配置文件控制
- **统一的错误处理** - 标准化的错误响应格式
- **轮询机制** - 内置异步任务状态轮询
- **TypeScript类型支持** - 完整的类型定义

## Mock 模式

在开发环境中，服务会自动使用 Mock 数据：

```typescript
// Mock 模式下的响应示例
{
  task_id: 'task_123456',
  status: 'completed',
  result: { /* 模拟数据 */ },
  mock: true,
  timestamp: Date.now()
}
```

## 最佳实践

1. **使用类型安全的接口** - 所有服务都提供完整的 TypeScript 类型定义
2. **错误处理** - 建议使用 try-catch 包装服务调用
3. **轮询配置** - 根据任务复杂度调整轮询间隔和超时时间
4. **服务状态监控** - 在生产环境中定期检查服务可用性

## 文件结构

```
src/services/ai/
├── index.ts                      # 统一导出
├── README.md                     # 文档说明
├── contentGenerateService.ts     # 内容生成服务
├── outlineGenerateService.ts     # 大纲生成服务
├── titleGenerateService.ts       # 标题生成服务
├── materialBindService.ts        # 素材绑定服务
├── outlineWithMaterialService.ts # 大纲素材集成服务
├── scopeAgentService.ts          # 范围界定服务
├── searchToolsService.ts         # 搜索工具服务
├── searchAgentService.ts         # 搜索代理服务
└── search2titleAgentService.ts   # 搜索到标题服务
```

## 配置说明

服务配置位于 `@/config/api/modules/ai`，每个服务都有对应的配置文件，支持：

- API 端点配置
- 请求参数验证
- Mock 数据配置
- 服务元数据

## 注意事项

1. **异步任务** - 所有生成任务都是异步处理，需要使用轮询机制
2. **错误重试** - 服务内置重试机制，但建议在业务层也实现适当的重试逻辑
3. **数据缓存** - 某些服务支持结果缓存，可提高响应速度
4. **API限制** - 注意各服务的调用频率限制
