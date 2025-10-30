# 轮询系统快速入门（带日志记录）

## 📦 系统已集成

轮询功能已集成到现有服务中，并支持完整的日志记录功能！

## 🚀 立即开始

### SearchAgent 轮询

```typescript
import { AsyncTaskPoller, LogLevel } from '@/utils/polling/asyncTaskPoller'

// 启动并等待完成（最简单）
const result = await searchService.executeSearchAgentAndWait(
  'userId',
  'projectId',
  { brief: '您的研究主题' },
  {
    enableLogging: true, // 启用日志记录 ✨
    logLevel: LogLevel.INFO // 设置日志级别 ✨
  }
)

// 或获取任务实例以监控进度
const task = await searchService.executeSearchAgentWithPolling(
  'userId',
  'projectId',
  { brief: '您的研究主题' },
  {
    onProgress: (attempts, max) => {
      console.log(`进度: ${attempts}/${max}`)
    },
    enableLogging: true,
    logLevel: LogLevel.DEBUG // 开发环境使用DEBUG ✨
  }
)
```

### ScopeAgent 轮询

```typescript
import documentGenerateService from '@/services/documentGenerateService'

const task = await documentGenerateService.executeScopeAgentWithPolling(
  'userId',
  'projectId',
  { query: '研究主题' },
  {
    enableLogging: true,
    logLevel: LogLevel.INFO
  }
)
```

### Search2TitleAgent 轮询

```typescript
const task = await documentGenerateService.executeSearch2TitleAgentWithPolling(
  'userId',
  'projectId',
  { brief: '研究主题' },
  {
    enableLogging: true,
    logLevel: LogLevel.INFO
  }
)
```

## 📝 日志记录功能

### 日志级别

| 级别             | 说明                 | 适用场景              |
| ---------------- | -------------------- | --------------------- |
| `LogLevel.NONE`  | 不记录日志           | 生产环境性能优先      |
| `LogLevel.ERROR` | 只记录错误           | 生产环境关注问题      |
| `LogLevel.WARN`  | 记录错误和警告       | 生产环境推荐          |
| `LogLevel.INFO`  | 记录错误、警告和信息 | 开发/生产通用（推荐） |
| `LogLevel.DEBUG` | 记录所有日志         | 开发环境调试          |

### 日志输出示例

```typescript
// 开发环境配置（详细日志）
{
  enableLogging: true,
  logLevel: LogLevel.DEBUG
}

// 生产环境配置（关键信息）
{
  enableLogging: true,
  logLevel: LogLevel.INFO
}

// 无日志（性能优先）
{
  enableLogging: false
}
```

### 自定义日志记录器

```typescript
const customLogger = (level: LogLevel, message: string, meta?: any) => {
  // 自定义日志处理逻辑
  // 例如：发送到远程服务
  sendToRemoteLogger({ level, message, ...meta })
}

const task = await searchService.executeSearchAgentWithPolling(
  'userId',
  'projectId',
  { brief: '研究主题' },
  {
    enableLogging: true,
    logger: customLogger // 使用自定义日志记录器
  }
)
```

## ⚙️ 配置选项

```typescript
{
  interval: 2000,              // 轮询间隔（毫秒）
  timeout: 120000,             // 超时时间（毫秒）
  maxAttempts: 60,             // 最大轮询次数
  retryAttempts: 3,            // 失败重试次数
  immediateFirstCheck: true,   // 是否立即检查
  onStatusUpdate: (status) => {}, // 状态更新回调
  onProgress: (attempts, max) => {}, // 进度回调
  enableLogging: true,         // ✨ 启用日志记录
  logLevel: LogLevel.INFO,     // ✨ 日志级别
  logger: customLogger         // ✨ 自定义日志记录器
}
```

## 📋 任务状态

- `PENDING` - 等待中
- `RUNNING` - 执行中
- `COMPLETED` - 已完成 ✅
- `FAILED` - 执行失败 ❌
- `CANCELLED` - 已取消
- `TIMEOUT` - 超时 ⏰

## 💡 使用建议

### 短任务 (< 30秒)

```typescript
{
  interval: 1000,
  timeout: 30000,
  enableLogging: true,
  logLevel: LogLevel.DEBUG
}
```

### 长任务 (> 2分钟)

```typescript
{
  interval: 5000,
  timeout: 600000,
  enableLogging: true,
  logLevel: LogLevel.INFO
}
```

### 带UI进度条

```typescript
{
  interval: 2000,
  onProgress: (attempts, max) => {
    const percent = (attempts / max) * 100
    progressBar.value = percent
  },
  enableLogging: true,
  logLevel: LogLevel.INFO
}
```

## 📖 完整文档

- **快速入门**：本文档
- **详细使用指南**：`src/utils/polling/LOGGING_EXAMPLE.md`
- **完整总结**：`src/utils/polling/LOGGING_SUMMARY.md`
- **集成文档**：`src/utils/polling/FINAL_SUMMARY.md`
- **测试文件**：`src/utils/polling/test-logging.ts`

## 🎯 实际使用示例

### 示例 1: 素材搜索

```typescript
// 在组件中使用
const searching = ref(false)

const executeAgentSearch = async (config: AgentSearchConfig) => {
  searching.value = true
  try {
    const task = await searchService.executeSearchAgentWithPolling(
      userStore.info.id,
      projectStore.currentProjectId,
      { brief: config.brief },
      {
        enableLogging: true,
        logLevel: LogLevel.INFO,
        onProgress: (attempts, max) => {
          progress.value = (attempts / max) * 100
        }
      }
    )

    // 查看日志了解执行过程
    console.log('任务完成:', task.result)
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    searching.value = false
  }
}
```

### 示例 2: 文档生成

```typescript
// 在文档生成页面中使用
const generating = ref(false)

const executeScopeAgent = async (query: string) => {
  generating.value = true
  try {
    const task = await documentGenerateService.executeScopeAgentWithPolling(
      userStore.info.id,
      projectStore.currentProjectId,
      { query },
      {
        enableLogging: true,
        logLevel: LogLevel.DEBUG // 详细记录生成过程
      }
    )

    // 任务完成后自动更新研究简报
    if (task.result.status === 'COMPLETED') {
      documentStore.updateResearchBrief(task.result.data.research_brief)
    }
  } catch (error) {
    ElMessage.error('生成失败: ' + error.message)
  } finally {
    generating.value = false
  }
}
```

---

**现在就可以开始使用带日志记录的轮询系统了！** 🎉✨

**调试提示**：在开发环境中记得设置 `logLevel: LogLevel.DEBUG` 来查看详细的执行日志！
