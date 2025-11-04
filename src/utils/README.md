# src/utils 工具模块索引

> 快速查找所需功能的主要入口文档

## 📁 功能模块索引

| 类别 | 目录 | 主要功能 | 快速定位 |
| --- | --- | --- | --- |
| 🔐 认证授权 | `auth/` | 令牌解析、权限验证 | `auth/index.ts:parseToken()`, `auth/index.ts:hasPermission()` |
| 🌐 浏览器 | `browser/` | Cookie、URL参数、设备检测 | `browser/cookie.ts:setCookie()`, `browser/bom.ts:getURLParameters()` |
| 🔗 常量 | `constants/` | 外部链接、图标字体 | `constants/links.ts:WEB_LINKS` |
| 📊 数据处理 | `dataprocess/` | 数组操作、格式化 | `dataprocess/array.ts:noRepeat()`, `dataprocess/format.ts:timestampToTime()` |
| 🛠️ 开发工具 | `dev/` | 调试工具、DevTools | `dev/index.ts:initDevTools()` |
| 🌐 HTTP请求 | `http/` | API封装、错误处理 | `http/index.ts:api.get()`, `http/error.ts:handleError()` |
| 🧭 路由导航 | `navigation/` | 菜单跳转、worktab | `navigation/jump.ts:handleMenuJump()`, `navigation/worktab.ts:setWorktab()` |
| 🔄 任务轮询 | `polling/` | 异步任务跟踪 | `polling/asyncTaskPoller.ts:AsyncTaskPoller` |
| 💾 数据存储 | `storage/` | 存储管理、版本控制 | `storage/storage.ts`, `storage/storage-key-manager.ts:StorageKeyManager` |
| ⚙️ 系统管理 | `sys/` | 事件总线、系统升级 | `sys/mittBus.ts:mittBus`, `sys/console.ts` |
| 📋 表格工具 | `table/` | 缓存、防抖、适配器 | `table/tableCache.ts:TableCache`, `table/tableUtils.ts:createSmartDebounce()` |
| 🎨 主题动画 | `theme/` | 主题切换、动画效果 | `theme/animation.ts:themeAnimation()` |
| 🖼️ UI工具 | `ui/` | 颜色、加载、标签页 | `ui/colors.ts:hexToRgba()`, `ui/loading.ts:loadingService` |
| ✅ 数据验证 | `validation/` | 表单验证、密码强度 | `validation/formValidator.ts:validatePhone()`, `validation/formValidator.ts:getPasswordStrength()` |
| 📊 其他 | 根目录 | API日志、响应处理、Mock | `apiLogger.ts`, `apiResponseHandler.ts`, `mockTaskTracker.ts` |

---

## 🚀 常用场景快速定位

### HTTP 请求相关

```typescript
// 基本API调用
import { api } from '@/utils/http'

// 错误处理
import { handleError, showError } from '@/utils/http/error'
```

### 数据存储

```typescript
// 获取存储键名
import { StorageKeyManager } from '@/utils/storage/storage-key-manager'

// 验证存储数据
import { validateStoredAuthState } from '@/utils/storage/storage'
```

### 认证授权

```typescript
// 检查令牌是否过期
import { isTokenExpired } from '@/utils/auth'

// 检查用户权限
import { hasPermission } from '@/utils/auth'
```

### 表格缓存

```typescript
// 创建表格缓存
import { TableCache } from '@/utils/table/tableCache'

// 智能防抖
import { createSmartDebounce } from '@/utils/table/tableUtils'
```

### 数据验证

```typescript
// 验证手机号
import { validatePhone } from '@/utils/validation/formValidator'

// 验证密码强度
import { getPasswordStrength } from '@/utils/validation/formValidator'
```

### 事件通信

```typescript
// 全局事件总线
import { mittBus } from '@/utils/sys/mittBus'
mittBus.emit('event-name', data)
```

### 任务轮询

```typescript
// 创建轮询器
import { AsyncTaskPoller } from '@/utils/polling/asyncTaskPoller'
const poller = new AsyncTaskPoller({
  /* options */
})
```

### 主题切换

```typescript
// 主题动画
import { themeAnimation } from '@/utils/theme/animation'
```

### 浏览器操作

```typescript
// 复制到剪贴板
import { copy } from '@/utils/browser/bom'

// Cookie操作
import { setCookie, getCookie } from '@/utils/browser/cookie'
```

### 数据格式化

```typescript
// 时间格式化
import { timestampToTime } from '@/utils/dataprocess/format'

// 数组去重
import { noRepeat } from '@/utils/dataprocess/array'
```

### 颜色处理

```typescript
// 颜色格式转换
import { hexToRgba, rgbToHex } from '@/utils/ui/colors'
```

---

## 📋 核心类与对象

| 类/对象                       | 文件路径                         | 用途             |
| ----------------------------- | -------------------------------- | ---------------- |
| `HttpError`                   | `http/error.ts`                  | HTTP错误处理类   |
| `ApiStatus`                   | `http/status.ts`                 | HTTP状态码枚举   |
| `StorageKeyManager`           | `storage/storage-key-manager.ts` | 存储键名管理     |
| `TableCache<T>`               | `table/tableCache.ts`            | 表格缓存管理     |
| `AsyncTaskPoller`             | `polling/asyncTaskPoller.ts`     | 异步任务轮询器   |
| `ApiResponseValidator`        | `apiResponseHandler.ts`          | API响应验证器    |
| `StorageCompatibilityManager` | `storage/storage-config.ts`      | 存储兼容性管理   |
| `console`                     | `sys/console.ts`                 | 增强的控制台输出 |
| `mittBus`                     | `sys/mittBus.ts`                 | 全局事件总线     |
| `loadingService`              | `ui/loading.ts`                  | 全局加载服务     |
| `api`                         | `http/index.ts`                  | HTTP客户端实例   |

---

## ⚠️ 注意事项

1. **统一导出** - 所有工具通过 `src/utils/index.ts` 统一导出，可直接从 `@/utils` 导入
2. **类型安全** - 所有工具都经过 TypeScript 类型检查，使用前请确保类型定义正确
3. **错误处理** - HTTP、存储、验证等模块提供完善的错误处理机制
4. **开发模式** - `dev/index.ts` 提供开发环境下的调试工具，部署时自动禁用
5. **版本兼容** - 存储模块支持版本升级和自动数据迁移

---

## 🔗 相关文档

- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Pinia 状态管理](https://pinia.vuejs.org/)
- [Element Plus 组件库](https://element-plus.org/)
- [Axios HTTP 客户端](https://axios-http.com/)
