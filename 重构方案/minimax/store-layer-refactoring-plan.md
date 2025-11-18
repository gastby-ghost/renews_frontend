# Store 层重构详细方案

## 重构目标

将现有的 Store 从混合业务逻辑的状态管理转变为**纯状态存储**，确保职责单一、易于测试和维护。

## 现状分析

### 当前 Store 存在的问题

1. **职责混乱**：同时处理状态存储和业务逻辑
2. **依赖关系复杂**：Store 间循环依赖
3. **API 调用混在其中**：违背 Store 纯粹性
4. **副作用处理**：包含异步操作和副作用
5. **难以测试**：业务逻辑与状态管理耦合

### 当前 Store 清单

```
src/store/
├── documentGenerateStore.ts      ❌ 混合业务逻辑
├── outlineStore.ts              ❌ 包含计算逻辑
├── outlineSectionStore.ts       ❌ 章节CRUD逻辑
├── materialRelationStore.ts     ❌ 绑定关系处理
├── materialBindStore.ts         ❌ AI绑定逻辑
├── materialStore.ts             ✅ 较纯粹
├── projectStore.ts              ✅ 较纯粹
└── ...其他Store
```

## 重构策略

### 原则

1. **移除业务逻辑**：仅保留状态声明、Getters 和 Actions
2. **移除 API 调用**：所有 Service 调用移到 Composable
3. **移除计算逻辑**：复杂计算移到 Composable
4. **移除副作用**：异步操作移到 Composable
5. **拆分大型 Store**：按功能边界拆分

### 拆分方案

#### 1. 项目状态 Store

**文件**：`src/store/projectStore.ts`

```typescript
export const useProjectStore = defineStore('project', () => {
  // ===== State =====
  const projectId = ref<string | null>(null)
  const projectName = ref<string>('')
  const projectType = ref<'article' | 'report' | 'proposal'>('article')
  const createdAt = ref<Date | null>(null)
  const updatedAt = ref<Date | null>(null)
  const metadata = ref<Record<string, any>>({})

  // ===== Getters =====
  const isProjectLoaded = computed(() => !!projectId.value)
  const projectAge = computed(() => {
    if (!createdAt.value) return 0
    return Date.now() - createdAt.value.getTime()
  })

  // ===== Actions =====
  const setProjectId = (id: string) => {
    projectId.value = id
  }

  const setProjectInfo = (info: {
    name?: string
    type?: 'article' | 'report' | 'proposal'
    metadata?: Record<string, any>
  }) => {
    if (info.name !== undefined) projectName.value = info.name
    if (info.type !== undefined) projectType.value = info.type
    if (info.metadata !== undefined) metadata.value = info.metadata
    updatedAt.value = new Date()
  }

  const resetProject = () => {
    projectId.value = null
    projectName.value = ''
    projectType.value = 'article'
    createdAt.value = null
    updatedAt.value = null
    metadata.value = {}
  }

  return {
    // State
    projectId,
    projectName,
    projectType,
    createdAt,
    updatedAt,
    metadata,

    // Getters
    isProjectLoaded,
    projectAge,

    // Actions
    setProjectId,
    setProjectInfo,
    resetProject
  }
})
```

#### 2. 文档生成流程状态 Store

**文件**：`src/store/documentGenerateStore.ts`

```typescript
export const useDocumentGenerateStore = defineStore('documentGenerate', () => {
  // ===== State =====
  const currentStage = ref<'topic-selection' | 'outline' | 'content'>('topic-selection')
  const isGenerating = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)
  const lastOperation = ref<string | null>(null)
  const operationTimestamp = ref<number | null>(null)

  // ===== Getters =====
  const isTopicSelectionStage = computed(() => currentStage.value === 'topic-selection')
  const isOutlineStage = computed(() => currentStage.value === 'outline')
  const isContentStage = computed(() => currentStage.value === 'content')

  const canProceedToNext = computed(() => {
    switch (currentStage.value) {
      case 'topic-selection':
        return !!projectStore.projectId
      case 'outline':
        return true
      case 'content':
        return true
      default:
        return false
    }
  })

  // ===== Actions =====
  const setCurrentStage = (stage: 'topic-selection' | 'outline' | 'content') => {
    currentStage.value = stage
  }

  const startOperation = (operation: string) => {
    isGenerating.value = true
    error.value = null
    progress.value = 0
    lastOperation.value = operation
    operationTimestamp.value = Date.now()
  }

  const updateProgress = (value: number) => {
    progress.value = Math.max(0, Math.min(100, value))
  }

  const completeOperation = () => {
    isGenerating.value = false
    progress.value = 100
  }

  const setError = (errorMessage: string) => {
    isGenerating.value = false
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    currentStage.value = 'topic-selection'
    isGenerating.value = false
    progress.value = 0
    error.value = null
    lastOperation.value = null
    operationTimestamp.value = null
  }

  return {
    // State
    currentStage,
    isGenerating,
    progress,
    error,
    lastOperation,
    operationTimestamp,

    // Getters
    isTopicSelectionStage,
    isOutlineStage,
    isContentStage,
    canProceedToNext,

    // Actions
    setCurrentStage,
    startOperation,
    updateProgress,
    completeOperation,
    setError,
    clearError,
    reset
  }
})
```

#### 3. 大纲数据结构 Store

**文件**：`src/store/outlineStore.ts`

```typescript
export const useOutlineStore = defineStore('outline', () => {
  // ===== State =====
  const outlineId = ref<string | null>(null)
  const title = ref<string>('')
  const description = ref<string>('')
  const structureType = ref<'hierarchical' | 'linear' | 'mindmap'>('hierarchical')
  const version = ref<number>(1)
  const isActive = ref<boolean>(false)
  const createdAt = ref<Date | null>(null)
  const updatedAt = ref<Date | null>(null)

  // ===== Getters =====
  const isOutlineLoaded = computed(() => !!outlineId.value)
  const outlineVersion = computed(() => version.value)

  // ===== Actions =====
  const setOutlineId = (id: string) => {
    outlineId.value = id
  }

  const setOutlineInfo = (info: {
    title?: string
    description?: string
    structureType?: 'hierarchical' | 'linear' | 'mindmap'
  }) => {
    if (info.title !== undefined) title.value = info.title
    if (info.description !== undefined) description.value = info.description
    if (info.structureType !== undefined) structureType.value = info.structureType
    updatedAt.value = new Date()
  }

  const incrementVersion = () => {
    version.value++
  }

  const setActive = (active: boolean) => {
    isActive.value = active
  }

  const reset = () => {
    outlineId.value = null
    title.value = ''
    description.value = ''
    structureType.value = 'hierarchical'
    version.value = 1
    isActive.value = false
    createdAt.value = null
    updatedAt.value = null
  }

  return {
    // State
    outlineId,
    title,
    description,
    structureType,
    version,
    isActive,
    createdAt,
    updatedAt,

    // Getters
    isOutlineLoaded,
    outlineVersion,

    // Actions
    setOutlineId,
    setOutlineInfo,
    incrementVersion,
    setActive,
    reset
  }
})
```

#### 4. 章节数据 Store

**文件**：`src/store/outlineSectionStore.ts`

```typescript
export const useOutlineSectionStore = defineStore('outlineSection', () => {
  // ===== State =====
  const sections = ref<Section[]>([])
  const activeSectionId = ref<string | null>(null)
  const expandedSections = ref<Set<string>>(new Set())

  // ===== Getters =====
  const totalSections = computed(() => sections.value.length)
  const rootSections = computed(() => sections.value.filter((s) => s.level === 1))
  const activeSection = computed(() => {
    if (!activeSectionId.value) return null
    return sections.value.find((s) => s.id === activeSectionId.value) || null
  })

  const getSectionById = (id: string) => {
    return sections.value.find((s) => s.id === id) || null
  }

  const getChildSections = (parentId: string) => {
    return sections.value.filter((s) => s.parentId === parentId)
  }

  const isSectionExpanded = (id: string) => {
    return expandedSections.value.has(id)
  }

  // ===== Actions =====
  const setSections = (newSections: Section[]) => {
    sections.value = [...newSections]
  }

  const addSection = (section: Section) => {
    sections.value.push(section)
  }

  const updateSection = (id: string, updates: Partial<Section>) => {
    const index = sections.value.findIndex((s) => s.id === id)
    if (index !== -1) {
      sections.value[index] = { ...sections.value[index], ...updates }
    }
  }

  const removeSection = (id: string) => {
    sections.value = sections.value.filter((s) => s.id !== id)
  }

  const reorderSections = (sectionIds: string[]) => {
    const idToSection = new Map(sections.value.map((s) => [s.id, s]))
    sections.value = sectionIds.map((id) => idToSection.get(id)).filter(Boolean) as Section[]
  }

  const setActiveSection = (id: string | null) => {
    activeSectionId.value = id
  }

  const toggleSectionExpansion = (id: string) => {
    if (expandedSections.value.has(id)) {
      expandedSections.value.delete(id)
    } else {
      expandedSections.value.add(id)
    }
  }

  const expandAll = () => {
    sections.value.forEach((s) => expandedSections.value.add(s.id))
  }

  const collapseAll = () => {
    expandedSections.value.clear()
  }

  const reset = () => {
    sections.value = []
    activeSectionId.value = null
    expandedSections.value.clear()
  }

  return {
    // State
    sections,
    activeSectionId,
    expandedSections,

    // Getters
    totalSections,
    rootSections,
    activeSection,
    getSectionById,
    getChildSections,
    isSectionExpanded,

    // Actions
    setSections,
    addSection,
    updateSection,
    removeSection,
    reorderSections,
    setActiveSection,
    toggleSectionExpansion,
    expandAll,
    collapseAll,
    reset
  }
})
```

#### 5. 素材库 Store

**文件**：`src/store/materialStore.ts`

```typescript
export const useMaterialStore = defineStore('material', () => {
  // ===== State =====
  const materials = ref<Material[]>([])
  const selectedMaterialIds = ref<Set<string>>(new Set())
  const materialFilters = ref({
    category: '',
    tags: [] as string[],
    dateRange: null as { start: Date; end: Date } | null
  })

  // ===== Getters =====
  const selectedMaterials = computed(() => {
    return materials.value.filter((m) => selectedMaterialIds.value.has(m.id))
  })

  const filteredMaterials = computed(() => {
    let result = materials.value

    if (materialFilters.value.category) {
      result = result.filter((m) => m.category === materialFilters.value.category)
    }

    if (materialFilters.value.tags.length > 0) {
      result = result.filter((m) => materialFilters.value.tags.every((tag) => m.tags.includes(tag)))
    }

    if (materialFilters.value.dateRange) {
      const { start, end } = materialFilters.value.dateRange
      result = result.filter((m) => {
        const materialDate = new Date(m.createdAt)
        return materialDate >= start && materialDate <= end
      })
    }

    return result
  })

  const materialCategories = computed(() => {
    return [...new Set(materials.value.map((m) => m.category))]
  })

  const allMaterialTags = computed(() => {
    const tags = new Set<string>()
    materials.value.forEach((m) => m.tags.forEach((tag) => tags.add(tag)))
    return Array.from(tags)
  })

  // ===== Actions =====
  const setMaterials = (newMaterials: Material[]) => {
    materials.value = [...newMaterials]
  }

  const addMaterial = (material: Material) => {
    materials.value.push(material)
  }

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    const index = materials.value.findIndex((m) => m.id === id)
    if (index !== -1) {
      materials.value[index] = { ...materials.value[index], ...updates }
    }
  }

  const removeMaterial = (id: string) => {
    materials.value = materials.value.filter((m) => m.id !== id)
    selectedMaterialIds.value.delete(id)
  }

  const selectMaterial = (id: string) => {
    selectedMaterialIds.value.add(id)
  }

  const deselectMaterial = (id: string) => {
    selectedMaterialIds.value.delete(id)
  }

  const toggleMaterialSelection = (id: string) => {
    if (selectedMaterialIds.value.has(id)) {
      selectedMaterialIds.value.delete(id)
    } else {
      selectedMaterialIds.value.add(id)
    }
  }

  const selectAll = () => {
    filteredMaterials.value.forEach((m) => selectedMaterialIds.value.add(m.id))
  }

  const deselectAll = () => {
    selectedMaterialIds.value.clear()
  }

  const setMaterialFilters = (filters: Partial<typeof materialFilters.value>) => {
    materialFilters.value = { ...materialFilters.value, ...filters }
  }

  const clearFilters = () => {
    materialFilters.value = {
      category: '',
      tags: [],
      dateRange: null
    }
  }

  const reset = () => {
    materials.value = []
    selectedMaterialIds.value.clear()
    clearFilters()
  }

  return {
    // State
    materials,
    selectedMaterialIds,
    materialFilters,

    // Getters
    selectedMaterials,
    filteredMaterials,
    materialCategories,
    allMaterialTags,

    // Actions
    setMaterials,
    addMaterial,
    updateMaterial,
    removeMaterial,
    selectMaterial,
    deselectMaterial,
    toggleMaterialSelection,
    selectAll,
    deselectAll,
    setMaterialFilters,
    clearFilters,
    reset
  }
})
```

#### 6. 素材绑定关系 Store

**文件**：`src/store/materialRelationStore.ts`

```typescript
export const useMaterialRelationStore = defineStore('materialRelation', () => {
  // ===== State =====
  const relations = ref<MaterialRelation[]>([])
  const aiBindingResults = ref<Map<string, AIBindingResult>>(new Map())

  // ===== Getters =====
  const totalRelations = computed(() => relations.value.length)
  const relationsBySection = computed(() => {
    const grouped: Record<string, MaterialRelation[]> = {}
    relations.value.forEach((rel) => {
      if (!grouped[rel.sectionId]) {
        grouped[rel.sectionId] = []
      }
      grouped[rel.sectionId].push(rel)
    })
    return grouped
  })

  const getRelationsBySectionId = (sectionId: string) => {
    return relations.value.filter((r) => r.sectionId === sectionId)
  }

  const getMaterialRelations = (materialId: string) => {
    return relations.value.filter((r) => r.materialId === materialId)
  }

  const getAIBindingResult = (sectionId: string) => {
    return aiBindingResults.value.get(sectionId) || null
  }

  // ===== Actions =====
  const setRelations = (newRelations: MaterialRelation[]) => {
    relations.value = [...newRelations]
  }

  const addRelation = (relation: MaterialRelation) => {
    relations.value.push(relation)
  }

  const removeRelation = (sectionId: string, materialId: string) => {
    relations.value = relations.value.filter(
      (r) => !(r.sectionId === sectionId && r.materialId === materialId)
    )
  }

  const updateRelation = (
    sectionId: string,
    materialId: string,
    updates: Partial<MaterialRelation>
  ) => {
    const index = relations.value.findIndex(
      (r) => r.sectionId === sectionId && r.materialId === materialId
    )
    if (index !== -1) {
      relations.value[index] = { ...relations.value[index], ...updates }
    }
  }

  const clearRelationsBySection = (sectionId: string) => {
    relations.value = relations.value.filter((r) => r.sectionId !== sectionId)
  }

  const setAIBindingResult = (sectionId: string, result: AIBindingResult) => {
    aiBindingResults.value.set(sectionId, result)
  }

  const clearAIBindingResult = (sectionId: string) => {
    aiBindingResults.value.delete(sectionId)
  }

  const clearAllAIBindingResults = () => {
    aiBindingResults.value.clear()
  }

  const reset = () => {
    relations.value = []
    aiBindingResults.value.clear()
  }

  return {
    // State
    relations,
    aiBindingResults,

    // Getters
    totalRelations,
    relationsBySection,
    getRelationsBySectionId,
    getMaterialRelations,
    getAIBindingResult,

    // Actions
    setRelations,
    addRelation,
    removeRelation,
    updateRelation,
    clearRelationsBySection,
    setAIBindingResult,
    clearAIBindingResult,
    clearAllAIBindingResults,
    reset
  }
})
```

#### 7. AI 任务状态 Store

**文件**：`src/store/aiTaskStore.ts`

```typescript
export const useAITaskStore = defineStore('aiTask', () => {
  // ===== State =====
  const tasks = ref<Map<string, AITask>>(new Map())
  const taskHistory = ref<AITask[]>([])

  // ===== Getters =====
  const activeTasks = computed(() => {
    return Array.from(tasks.value.values()).filter((t) => t.status === 'running')
  })

  const completedTasks = computed(() => {
    return Array.from(tasks.value.values()).filter((t) => t.status === 'completed')
  })

  const failedTasks = computed(() => {
    return Array.from(tasks.value.values()).filter((t) => t.status === 'failed')
  })

  const getTaskById = (taskId: string) => {
    return tasks.value.get(taskId) || null
  }

  const getTasksByType = (type: AITaskType) => {
    return Array.from(tasks.value.values()).filter((t) => t.type === type)
  }

  const getTasksByStage = (stage: DocumentStage) => {
    return Array.from(tasks.value.values()).filter((t) => t.stage === stage)
  }

  // ===== Actions =====
  const addTask = (task: AITask) => {
    tasks.value.set(task.id, task)
  }

  const updateTaskStatus = (taskId: string, status: AITaskStatus, data?: any, error?: string) => {
    const task = tasks.value.get(taskId)
    if (task) {
      task.status = status
      task.updatedAt = new Date()
      if (data !== undefined) task.result = data
      if (error !== undefined) task.error = error
      if (status === 'completed' || status === 'failed') {
        taskHistory.value.push({ ...task })
      }
    }
  }

  const updateTaskProgress = (taskId: string, progress: number) => {
    const task = tasks.value.get(taskId)
    if (task) {
      task.progress = Math.max(0, Math.min(100, progress))
      task.updatedAt = new Date()
    }
  }

  const removeTask = (taskId: string) => {
    tasks.value.delete(taskId)
  }

  const clearCompletedTasks = () => {
    Array.from(tasks.value.entries()).forEach(([id, task]) => {
      if (task.status === 'completed' || task.status === 'failed') {
        tasks.value.delete(id)
      }
    })
  }

  const clearAllTasks = () => {
    tasks.value.clear()
    taskHistory.value = []
  }

  return {
    // State
    tasks,
    taskHistory,

    // Getters
    activeTasks,
    completedTasks,
    failedTasks,
    getTaskById,
    getTasksByType,
    getTasksByStage,

    // Actions
    addTask,
    updateTaskStatus,
    updateTaskProgress,
    removeTask,
    clearCompletedTasks,
    clearAllTasks
  }
})
```

#### 8. 编辑器状态 Store

**文件**：`src/store/editorStore.ts`

```typescript
export const useEditorStore = defineStore('editor', () => {
  // ===== State =====
  const content = ref<string>('')
  const cursorPosition = ref<number>(0)
  const selection = ref<{ start: number; end: number } | null>(null)
  const isPreviewMode = ref<boolean>(false)
  const editorConfig = ref({
    fontSize: 14,
    lineHeight: 1.6,
    theme: 'light' as 'light' | 'dark',
    wordWrap: true
  })
  const history = ref<ContentHistory[]>([])
  const historyIndex = ref<number>(-1)

  // ===== Getters =====
  const contentLines = computed(() => content.value.split('\n'))
  const wordCount = computed(() => content.value.trim().split(/\s+/).length)
  const characterCount = computed(() => content.value.length)
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  const selectedText = computed(() => {
    if (!selection.value) return ''
    const { start, end } = selection.value
    return content.value.substring(start, end)
  })

  // ===== Actions =====
  const setContent = (newContent: string) => {
    content.value = newContent
  }

  const updateContent = (updates: { position?: number; length?: number; text?: string }) => {
    if (updates.position !== undefined) {
      cursorPosition.value = updates.position
    }
    if (updates.text !== undefined && updates.length !== undefined) {
      // 实际的内容更新逻辑会在Composable中处理
    }
  }

  const setCursorPosition = (position: number) => {
    cursorPosition.value = Math.max(0, position)
  }

  const setSelection = (start: number, end: number) => {
    selection.value = { start: Math.min(start, end), end: Math.max(start, end) }
  }

  const clearSelection = () => {
    selection.value = null
  }

  const togglePreviewMode = () => {
    isPreviewMode.value = !isPreviewMode.value
  }

  const setEditorConfig = (config: Partial<typeof editorConfig.value>) => {
    editorConfig.value = { ...editorConfig.value, ...config }
  }

  const addToHistory = (snapshot: ContentHistory) => {
    // 截断历史记录（如果当前不在最后）
    history.value = history.value.slice(0, historyIndex.value + 1)
    // 添加新记录
    history.value.push(snapshot)
    historyIndex.value = history.value.length - 1
  }

  const undo = () => {
    if (canUndo.value) {
      historyIndex.value--
      const snapshot = history.value[historyIndex.value]
      content.value = snapshot.content
      cursorPosition.value = snapshot.cursorPosition
    }
  }

  const redo = () => {
    if (canRedo.value) {
      historyIndex.value++
      const snapshot = history.value[historyIndex.value]
      content.value = snapshot.content
      cursorPosition.value = snapshot.cursorPosition
    }
  }

  const clearHistory = () => {
    history.value = []
    historyIndex.value = -1
  }

  const reset = () => {
    content.value = ''
    cursorPosition.value = 0
    selection.value = null
    isPreviewMode.value = false
    clearHistory()
  }

  return {
    // State
    content,
    cursorPosition,
    selection,
    isPreviewMode,
    editorConfig,
    history,
    historyIndex,

    // Getters
    contentLines,
    wordCount,
    characterCount,
    canUndo,
    canRedo,
    selectedText,

    // Actions
    setContent,
    updateContent,
    setCursorPosition,
    setSelection,
    clearSelection,
    togglePreviewMode,
    setEditorConfig,
    addToHistory,
    undo,
    redo,
    clearHistory,
    reset
  }
})
```

#### 9. 内容统计 Store

**文件**：`src/store/contentStatsStore.ts`

```typescript
export const useContentStatsStore = defineStore('contentStats', () => {
  // ===== State =====
  const stats = ref<DocumentStats | null>(null)
  const lastCalculatedAt = ref<Date | null>(null)
  const calculationInProgress = ref<boolean>(false)

  // ===== Getters =====
  const isStatsAvailable = computed(() => !!stats.value)
  const statsAge = computed(() => {
    if (!lastCalculatedAt.value) return Infinity
    return Date.now() - lastCalculatedAt.value.getTime()
  })

  const needsRecalculation = computed(() => {
    // 如果超过5分钟，则需要重新计算
    return statsAge.value > 5 * 60 * 1000
  })

  // ===== Actions =====
  const setStats = (newStats: DocumentStats) => {
    stats.value = { ...newStats }
    lastCalculatedAt.value = new Date()
  }

  const setCalculationInProgress = (inProgress: boolean) => {
    calculationInProgress.value = inProgress
  }

  const clearStats = () => {
    stats.value = null
    lastCalculatedAt.value = null
  }

  const reset = () => {
    clearStats()
    calculationInProgress.value = false
  }

  return {
    // State
    stats,
    lastCalculatedAt,
    calculationInProgress,

    // Getters
    isStatsAvailable,
    statsAge,
    needsRecalculation,

    // Actions
    setStats,
    setCalculationInProgress,
    clearStats,
    reset
  }
})
```

## 重构实施步骤

### 第一阶段：创建新 Store（1天）

1. 创建新的纯状态 Store
2. 实现基础状态管理
3. 添加类型定义

### 第二阶段：并行运行（2天）

1. 保持新旧 Store 并行运行
2. 在 Composable 中逐步切换到新 Store
3. 验证数据一致性

### 第三阶段：迁移完成（1天）

1. 删除旧 Store
2. 优化 Store 性能
3. 更新文档

## 测试策略

### 单元测试示例

```typescript
describe('OutlineStore', () => {
  let store: ReturnType<typeof useOutlineStore>

  beforeEach(() => {
    store = useOutlineStore()
  })

  it('应该正确设置大纲ID', () => {
    store.setOutlineId('outline-123')
    expect(store.outlineId).toBe('outline-123')
  })

  it('应该正确更新大纲信息', () => {
    store.setOutlineInfo({ title: '新标题' })
    expect(store.title).toBe('新标题')
  })

  it('应该正确计算大纲版本', () => {
    expect(store.outlineVersion).toBe(1)
    store.incrementVersion()
    expect(store.outlineVersion).toBe(2)
  })
})
```

### 集成测试

```typescript
describe('Store 集成测试', () => {
  it('Store 间应该正确协作', () => {
    const outlineStore = useOutlineStore()
    const sectionStore = useOutlineSectionStore()

    outlineStore.setOutlineId('outline-123')
    sectionStore.setSections(mockSections)

    expect(sectionStore.sections).toHaveLength(3)
  })
})
```

## 性能优化

### 1. Store 分片

- 按功能拆分大 Store
- 避免单个 Store 超过 500 行

### 2. 计算缓存

- 使用 computed 缓存计算结果
- 避免重复计算

### 3. 响应式优化

- 使用 readonly 暴露只读数据
- 避免不必要的深层响应式

## 验收标准

### 功能验收

- [ ] 所有 Store 职责单一，无业务逻辑
- [ ] 无 API 调用和副作用
- [ ] Store 间无循环依赖

### 代码质量

- [ ] Store 行数 < 200 行
- [ ] 测试覆盖率 > 90%
- [ ] 通过 ESLint 检查

### 性能验收

- [ ] 状态更新延迟 < 16ms
- [ ] 内存使用无明显增长
- [ ] 响应式更新优化

## 风险与应对

### 高风险

1. **数据丢失**

   - 风险：迁移过程中数据不一致
   - 应对：并行运行，验证一致性

2. **性能下降**
   - 风险：拆分后性能受影响
   - 应对：性能测试，优化响应式

### 中风险

1. **依赖破坏**
   - 风险：其他模块依赖旧 Store
   - 应对：全面测试，渐进迁移

## 后续优化

### 短期（1周内）

1. 优化 Store 性能
2. 完善测试用例
3. 添加文档注释

### 中期（1个月内）

1. 实现 Store 热重载
2. 添加性能监控
3. 建立最佳实践

### 长期（3个月内）

1. 自动化 Store 生成
2. 可视化状态管理
3. 状态快照功能
