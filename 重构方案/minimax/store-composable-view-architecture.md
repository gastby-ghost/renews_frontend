# Store-Composable-View 三层架构设计

## 架构概述

本文档定义了 document-generation 系统的三层架构设计方案，确保职责清晰、耦合度低、可维护性强。

## 核心原则

### 1. 单一职责原则（SRP）

- **Store** - 仅负责状态存储和基础状态操作
- **Composable** - 负责业务逻辑和数据处理，调用 Service
- **View** - 负责 UI 展示和用户交互
- **Service** - 负责 API 调用和数据访问（在 Composables 中使用）

### 2. 依赖规则

```
View → Composable → Store
View → Composable → Service
Service → Store （仅在初始化阶段）
```

### 3. 数据流原则

- 数据流必须是单向的
- Store 是数据的唯一真相源（Single Source of Truth）
- Composable 通过订阅 Store 获取数据
- View 仅通过 Composable 操作数据

## 层间交互规范

### Store 层职责

```typescript
// ✅ 正确：仅状态存储和基础操作
interface DocumentStore {
  // State
  currentDocument: Document | null
  documents: Document[]

  // Getters（仅数据转换）
  getDocumentById: (id: string) => Document | undefined
  getActiveDocument: () => Document | null

  // Actions（仅状态更新）
  setCurrentDocument: (document: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
  resetDocument: () => void
}

// ❌ 错误：包含业务逻辑
interface BadStore {
  // 业务逻辑不应该在Store中
  async generateOutline() { /* ... */ }
  calculateStatistics() { /* ... */ }
  validateDocument() { /* ... */ }
}
```

### Composable 层职责

```typescript
// ✅ 正确：业务逻辑和Service调用
export function useDocumentManager() {
  const documentStore = useDocumentStore()
  const outlineService = useOutlineService()
  const aiService = useAIService()

  // 业务逻辑
  const generateDocumentOutline = async (title: string, materials: Material[]) => {
    // 1. 准备请求数据
    const request = prepareOutlineRequest(title, materials)

    // 2. 调用Service
    const result = await outlineService.generateOutline(request)

    // 3. 更新Store
    documentStore.updateDocument(outlineStore.documentId, {
      outline: result.data
    })

    return result
  }

  // UI状态管理
  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  return {
    generateDocumentOutline,
    isGenerating,
    error
  }
}

// ❌ 错误：直接操作DOM或包含UI逻辑
export function useBadComposable() {
  const element = document.getElementById('outline')
  element.style.display = 'none' // 不应该在Composable中
}
```

### View 层职责

```vue
<!-- ✅ 正确：仅UI展示和交互 -->
<template>
  <div class="document-editor">
    <!-- UI渲染 -->
    <HeaderSection :title="document?.title" />

    <!-- 用户交互 -->
    <el-button @click="handleGenerateOutline" :loading="isGenerating"> 生成大纲 </el-button>

    <!-- 错误展示 -->
    <el-alert v-if="error" :title="error" type="error" />
  </div>
</template>

<script setup lang="ts">
  // 仅使用Composable
  const { generateDocumentOutline, isGenerating, error } = useDocumentManager()

  // 仅事件处理
  const handleGenerateOutline = async () => {
    try {
      await generateDocumentOutline(document.value.title, selectedMaterials.value)
    } catch (e) {
      console.error('生成失败:', e)
    }
  }
</script>
```

## 跨层通信规则

### 1. 事件流

```
View (User Action)
  ↓ emit event
Composable (Handle Event)
  ↓ call Service
Service (API Call)
  ↓ update Store via Composable
Store (Update State)
  ↓ notify
Composable (Subscribe)
  ↓ reactive update
View (Re-render)
```

### 2. 错误处理

```typescript
// Composable 内部处理业务错误
const handleError = (error: unknown) => {
  if (error instanceof ServiceError) {
    // 业务错误处理
    errorMessage.value = error.message
    retryCount.value++
  } else if (error instanceof NetworkError) {
    // 网络错误处理
    showNetworkErrorDialog()
  } else {
    // 未知错误
    console.error('未知错误:', error)
  }
}

// View 层仅负责展示错误
<template>
  <el-alert
    v-if="error"
    :title="error"
    type="error"
    show-icon
  />
</template>
```

### 3. 状态同步

```typescript
// 使用Pinia的响应式能力
export function useDocumentSync() {
  const documentStore = useDocumentStore()

  // Composable 订阅Store变化
  const currentDocument = computed(() => documentStore.currentDocument)

  // 监听Store变化并执行业务逻辑
  watch(currentDocument, (newDoc, oldDoc) => {
    if (newDoc?.id !== oldDoc?.id) {
      // 文档ID变化，重新加载相关数据
      loadDocumentRelatedData(newDoc.id)
    }
  })

  return { currentDocument }
}
```

## 依赖注入机制

### Service 注入

```typescript
// Service Factory Pattern
class ServiceContainer {
  private services = new Map<string, any>()

  register<T>(name: string, service: T) {
    this.services.set(name, service)
  }

  get<T>(name: string): T {
    return this.services.get(name)
  }
}

// 全局服务容器
export const serviceContainer = new ServiceContainer()

// 在Composable中使用
export function useOutlineService() {
  return serviceContainer.get<OutlineService>('outline')
}
```

### Store 注入

```typescript
// 自动创建和注入Store
export function useStore<T extends keyof StoreRegistry>(name: T): StoreRegistry[T] {
  const storeName = `${name}Store` as const
  return storeName as any
}

// 使用示例
const documentStore = useStore('document')
const outlineStore = useStore('outline')
```

## 类型安全约束

### 1. Store 类型定义

```typescript
// 严格类型化的Store
interface DocumentStoreState {
  currentDocument: Document | null
  documents: Document[]
  loading: boolean
  error: string | null
}

// 类型化的Actions
interface DocumentStoreActions {
  setCurrentDocument: (document: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
}

// 组合类型
type DocumentStore = DocumentStoreState & DocumentStoreActions
```

### 2. Composable 返回值类型

```typescript
// 明确返回类型
interface UseDocumentManagerReturn {
  // 数据
  currentDocument: Ref<Document | null>
  documents: Ref<Document[]>

  // 方法
  generateOutline: (title: string) => Promise<Outline>
  updateDocument: (id: string, data: Partial<Document>) => Promise<void>

  // 状态
  isLoading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

export function useDocumentManager(): UseDocumentManagerReturn {
  // 实现
}
```

### 3. Service 接口类型

```typescript
// 服务接口定义
interface OutlineService {
  generateOutline(request: OutlineRequest): Promise<OutlineResponse>
  updateOutline(id: string, data: Partial<Outline>): Promise<void>
  deleteOutline(id: string): Promise<void>
}

// 类型化的Composable参数
export function useOutlineManager(service: OutlineService) {
  // 实现
}
```

## 性能优化原则

### 1. Store 分片

```typescript
// 按功能拆分Store，避免单个Store过大
export const useDocumentStore = defineStore('document', () => {
  // 仅文档基础信息
})

export const useDocumentContentStore = defineStore('documentContent', () => {
  // 仅文档内容
})

export const useDocumentMetadataStore = defineStore('documentMetadata', () => {
  // 仅元数据
})
```

### 2. Composable 缓存

```typescript
// 使用Singleton模式避免重复创建
let composableCache: Map<string, any> = new Map()

export function useDocumentManager() {
  const cacheKey = 'documentManager'
  if (composableCache.has(cacheKey)) {
    return composableCache.get(cacheKey)
  }

  // 创建并缓存实例
  const instance = createDocumentManager()
  composableCache.set(cacheKey, instance)
  return instance
}
```

### 3. 响应式优化

```typescript
// 使用computed避免不必要更新
const documentSections = computed(() => {
  return documentStore.currentDocument?.sections || []
})

// 使用readonly暴露只读数据
return {
  readonlyData: readonly(documentSections),
  writableData: documentSections
}
```

## 测试策略

### 1. Store 测试

```typescript
// 仅测试状态更新逻辑
describe('DocumentStore', () => {
  it('应该更新文档信息', () => {
    const store = useDocumentStore()
    store.setCurrentDocument(mockDocument)
    expect(store.currentDocument).toEqual(mockDocument)
  })
})
```

### 2. Composable 测试

```typescript
// 测试业务逻辑和Service调用
describe('useDocumentManager', () => {
  it('应该调用Service并更新Store', async () => {
    const mockOutlineService = { generateOutline: jest.fn() }
    const manager = useDocumentManager(mockOutlineService)

    await manager.generateOutline('测试标题')

    expect(mockOutlineService.generateOutline).toHaveBeenCalled()
  })
})
```

### 3. View 测试

```typescript
// 测试UI交互（使用Vue Test Utils）
describe('DocumentEditor', () => {
  it('应该触发大纲生成', async () => {
    const wrapper = mount(DocumentEditor)
    await wrapper.find('button').trigger('click')
    // 验证UI更新
  })
})
```

## 重构迁移指南

### 阶段一：创建新架构

1. 创建新的Store（仅状态）
2. 创建新的Composable（业务逻辑）
3. 保持旧代码并行运行

### 阶段二：渐进迁移

1. 一个功能一个功能地迁移
2. 验证新旧逻辑输出一致性
3. 逐步移除旧代码

### 阶段三：最终清理

1. 删除遗留Store和Composable
2. 优化性能和类型定义
3. 更新文档和注释

## 监控和验证

### 1. 代码质量指标

- Store 行数 < 200 行
- Composable 行数 < 500 行
- 组件行数 < 300 行
- 循环复杂度 < 10

### 2. 依赖检查

- 不允许跨层直接调用
- 不允许Service直接操作Store
- 不允许View包含业务逻辑

### 3. 测试覆盖率

- Store 测试覆盖率 > 90%
- Composable 测试覆盖率 > 85%
- 集成测试覆盖所有关键流程

## 附录：示例代码

### 完整示例：文档大纲管理

```typescript
// Store层 - 仅状态
export const useOutlineStore = defineStore('outline', () => {
  // State
  const outline = ref<Outline | null>(null)
  const sections = ref<Section[]>([])
  const materials = ref<Material[]>([])
  const isGenerating = ref(false)

  // Getters
  const getSectionById = (id: string) =>
    sections.value.find(s => s.id === id)

  // Actions
  const setOutline = (newOutline: Outline) => {
    outline.value = newOutline
  }

  const addSection = (section: Section) => {
    sections.value.push(section)
  }

  return {
    outline,
    sections,
    materials,
    isGenerating,
    getSectionById,
    setOutline,
    addSection
  }
})

// Composable层 - 业务逻辑
export function useOutlineManager() {
  const outlineStore = useOutlineStore()
  const outlineService = useOutlineService()
  const materialService = useMaterialService()

  const generateOutlineWithMaterials = async (
    title: string,
    materials: Material[]
  ) => {
    try {
      outlineStore.isGenerating = true

      // 1. 调用AI服务生成大纲
      const response = await outlineService.generateOutlineWithMaterials({
        title,
        materials: materials.map(m => m.id)
      })

      // 2. 更新Store
      outlineStore.setOutline(response.outline)
      outlineStore.sections = response.sections
      outlineStore.materials = response.materials

      // 3. 同步到数据库
      await outlineService.saveOutline(response.outline)

      return response
    } catch (error) {
      handleError(error)
      throw error
    } finally {
      outlineStore.isGenerating = false
    }
  }

  const handleError = (error: unknown) => {
    console.error('大纲生成失败:', error)
    // 错误处理逻辑
  }

  return {
    generateOutlineWithMaterials
  }
}

// View层 - UI交互
<template>
  <div class="outline-generator">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>大纲生成</span>
          <el-button
            v-if="!outlineStore.isGenerating"
            type="primary"
            @click="handleGenerate"
          >
            生成大纲
          </el-button>
          <el-button
            v-else
            loading
          >
            生成中...
          </el-button>
        </div>
      </template>

      <div v-if="outlineStore.outline">
        <h3>{{ outlineStore.outline.title }}</h3>
        <el-divider />

        <div v-for="section in outlineStore.sections" :key="section.id">
          <h4>{{ section.title }}</h4>
          <p>{{ section.description }}</p>
        </div>
      </div>

      <el-empty v-else description="请输入标题和素材生成大纲" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
const outlineStore = useOutlineStore()
const { generateOutlineWithMaterials } = useOutlineManager()

const handleGenerate = async () => {
  try {
    await generateOutlineWithMaterials(
      documentTitle.value,
      selectedMaterials.value
    )
  } catch (error) {
    ElMessage.error('生成失败，请重试')
  }
}
</script>
```

这个示例清晰地展示了：

- **Store**：仅管理状态，无业务逻辑
- **Composable**：处理业务逻辑，调用Service，更新Store
- **View**：仅负责UI展示和事件触发

遵循此架构将显著提升代码质量、可维护性和测试能力。
