# 异步任务轮询系统 - 集成总结

## 🎯 核心更改

### 1. 新增文件

#### `src/utils/polling/asyncTaskPoller.ts`

- ✅ 核心轮询工具类
- ✅ 统一的任务状态管理
- ✅ 可配置的轮询参数
- ✅ 自动重试机制
- ✅ 进度跟踪回调

#### `src/store/polling.ts`

- ✅ Pinia Store 管理所有轮询任务
- ✅ 任务分类和统计
- ✅ 实时进度跟踪

#### `src/utils/polling/USAGE.md`

- ✅ 使用指南和示例
- ✅ 配置说明
- ✅ 最佳实践

### 2. 修改的文件

#### `src/services/searchService.ts`

新增方法：

- ✅ `executeSearchAgentWithPolling()` - 启动Search Agent并轮询
- ✅ `executeSearchAgentAndWait()` - 启动并等待完成
- ✅ `createRetrievalAgentWithPolling()` - 创建检索任务并轮询

#### `src/services/documentGenerateService.ts`

新增方法：

- ✅ `executeScopeAgentWithPolling()` - 启动Scope Agent并轮询
- ✅ `executeSearch2TitleAgentWithPolling()` - 启动Search2Title Agent并轮询

## 🚀 使用方法

### 在 SearchService 中使用

```typescript
import searchService from '@/services/searchService'

// 方法1: 获取轮询任务实例（可监控进度）
const task = await searchService.executeSearchAgentWithPolling(
  'userId',
  'projectId',
  { brief: '研究主题' },
  {
    interval: 2000,
    onProgress: (attempts, max) => {
      console.log(`进度: ${attempts}/${max}`)
    }
  }
)

// 等待完成
const result = await searchService.executeSearchAgentAndWait('userId', 'projectId', {
  brief: '研究主题'
})
```

### 在 DocumentGenerateService 中使用

```typescript
import documentGenerateService from '@/services/documentGenerateService'

// 启动Scope Agent并轮询
const task = await documentGenerateService.executeScopeAgentWithPolling('userId', 'projectId', {
  query: '研究主题'
})

// 启动Search2Title Agent并轮询
const task2 = await documentGenerateService.executeSearch2TitleAgentWithPolling(
  'userId',
  'projectId',
  { brief: '研究主题' }
)
```

## ⚙️ 轮询配置

| 参数                  | 类型     | 默认值 | 说明             |
| --------------------- | -------- | ------ | ---------------- |
| `interval`            | number   | 2000   | 轮询间隔（毫秒） |
| `timeout`             | number   | 120000 | 超时时间（毫秒） |
| `maxAttempts`         | number   | 60     | 最大轮询次数     |
| `retryAttempts`       | number   | 3      | 失败重试次数     |
| `immediateFirstCheck` | boolean  | true   | 是否立即检查     |
| `onStatusUpdate`      | function | -      | 状态更新回调     |
| `onProgress`          | function | -      | 进度回调         |

## 📊 任务状态

- `PENDING` - 等待中
- `RUNNING` - 执行中
- `COMPLETED` - 已完成
- `FAILED` - 执行失败
- `CANCELLED` - 已取消
- `TIMEOUT` - 超时

## 📝 轮询任务对象

```typescript
{
  id: string,                    // 任务ID
  result: {                      // 任务结果
    status: TaskStatus,          // 状态
    data?: any,                  // 数据
    error?: string,              // 错误信息
    attempts: number,            // 轮询次数
    duration: number,            // 耗时（毫秒）
    startTime: number,           // 开始时间
    endTime?: number             // 结束时间
  },
  isPolling: boolean,            // 是否正在轮询
  isCompleted: boolean,          // 是否已完成
  cancel: () => void,            // 取消方法
  reset: () => void              // 重置方法
}
```

## 🎨 建议配置

### 短任务 (< 30秒)

```typescript
{ interval: 1000, timeout: 30000 }
```

### 中等任务 (30秒 - 2分钟)

```typescript
{ interval: 2000, timeout: 120000 }
```

### 长任务 (> 2分钟)

```typescript
{ interval: 5000, timeout: 600000 }
```

### 带UI进度更新

```typescript
{
  interval: 2000,
  onProgress: (attempts, max) => {
    const percent = Math.min((attempts / max) * 100, 95)
    updateProgressBar(percent)
  }
}
```

## 🔧 状态管理

```typescript
import { usePollingStore } from '@/store/polling'

const pollingStore = usePollingStore()

// 查看所有任务
console.log('任务列表:', pollingStore.taskList)

// 查看运行中的任务
console.log('运行中:', pollingStore.runningTasks)

// 查看统计信息
console.log('统计:', pollingStore.statistics)

// 清理已完成的任务
pollingStore.clearCompleted()
```

## ✅ 优势

1. **统一接口** - 所有异步任务使用相同的轮询API
2. **开箱即用** - 直接在现有服务中使用，无需额外配置
3. **可配置性** - 灵活设置轮询参数
4. **错误处理** - 自动重试和详细错误信息
5. **进度跟踪** - 实时进度回调
6. **状态管理** - 通过Pinia Store统一管理

## 🎉 总结

系统已完成轮询功能集成，现在可以直接在 `searchService` 和 `documentGenerateService` 中使用轮询功能。所有方法都已添加到现有服务中，无需修改业务逻辑代码。

**使用方法：**

1. 直接调用 `executeXXXWithPolling()` 方法
2. 传入请求参数和可选的轮询配置
3. 获取轮询任务实例或等待结果
4. 通过回调函数更新UI进度

**完整示例请参考：** `src/utils/polling/USAGE.md`
