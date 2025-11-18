# Composables 层重构详细方案

## 重构目标

将现有的 Composable 从混合 UI 逻辑和业务逻辑转变为**纯业务逻辑处理**，确保职责单一、易于测试和复用。

## 现状分析

### 当前 Composable 存在的问题

1. **职责混乱**：同时处理业务逻辑和 UI 状态
2. **Store 操作混乱**：直接操作多个 Store，违反依赖规则
3. **API 调用分散**：Service 调用散布在多个 Composable 中
4. **耦合度高**：Composable 间互相依赖，难以独立测试
5. **副作用处理**：异步操作和副作用处理混在一起

### 当前 Composable 清单

```
src/composables/document/
├── useTopicSelection.ts      ❌ 800+行，职责混乱
├── useOutlinePage.ts         ❌ 1200+行，混合逻辑
└── useContent.ts             ❌ 545行，职责较清晰
```

## 重构策略

### 原则

1. **单一职责**：每个 Composable 只处理一个领域
2. **仅业务逻辑**：不包含 UI 渲染代码
3. **调用 Service**：通过 Service 进行 API 调用
4. **更新 Store**：仅通过 Store Actions 更新状态
5. **清晰接口**：明确的输入输出定义

### 拆分方案

#### 1. Topic Selection 领域

##### 1.1 选题策划主逻辑

**文件**：`src/composables/document/topic/useTopicSelection.ts`

```typescript
export interface UseTopicSelectionReturn {
  // 数据
  requirements: Ref<RequirementsForm>
  researchBrief: Ref<ResearchBrief | null>
  generatedTitles: Ref<Title[]>
  selectedTitle: Ref<Title | null>
  searchResults: Ref<SearchResult[]>
  currentStep: Ref<number>
  totalSteps: Ref<number>

  // 状态
  isGeneratingBrief: Ref<boolean>
  isGeneratingTitles: Ref<boolean>
  isSearching: Ref<boolean>
  error: Ref<string | null>

  // 方法
  updateRequirements: (requirements: Partial<RequirementsForm>) => void
  generateResearchBrief: () => Promise<ResearchBrief>
  generateTitles: () => Promise<Title[]>
  searchMaterials: (query: string) => Promise<SearchResult[]>
  selectTitle: (title: Title) => void
  proceedToNextStep: () => void
  reset: () => void
}

export function useTopicSelection(): UseTopicSelectionReturn {
  // ===== 依赖的 Store =====
  const documentStore = useDocumentGenerateStore()
  const projectStore = useProjectStore()

  // ===== 依赖的 Service =====
  const scopeAgentService = useScopeAgentService()
  const search2TitleAgentService = useSearch2TitleAgentService()
  const searchAgentService = useSearchAgentService()
  const databaseSyncService = useDatabaseSyncService()

  // ===== 响应式数据 =====
  const requirements = ref<RequirementsForm>({
    topic: '',
    keyPoints: [],
    specialRequirements: '',
    targetAudience: '',
    documentType: 'article'
  })

  const researchBrief = ref<ResearchBrief | null>(null)
  const generatedTitles = ref<Title[]>([])
  const selectedTitle = ref<Title | null>(null)
  const searchResults = ref<SearchResult[]>([])
  const currentStep = ref(1)
  const totalSteps = ref(5)

  const isGeneratingBrief = ref(false)
  const isGeneratingTitles = ref(false)
  const isSearching = ref(false)
  const error = ref<string | null>(null)

  // ===== 业务逻辑方法 =====

  /**
   * 更新需求表单
   */
  const updateRequirements = (newRequirements: Partial<RequirementsForm>) => {
    requirements.value = { ...requirements.value, ...newRequirements }
    documentStore.setError(null)
  }

  /**
   * 生成研究简报
   */
  const generateResearchBrief = async (): Promise<ResearchBrief> => {
    if (!projectStore.projectId) {
      throw new Error('项目未初始化')
    }

    try {
      isGeneratingBrief.value = true
      error.value = null
      documentStore.startOperation('generate-research-brief')

      // 1. 调用 Scope Agent Service
      const briefResult = await scopeAgentService.defineProjectScopeAndWait({
        project_brief: requirements.value.topic,
        objectives: requirements.value.keyPoints,
        constraints: requirements.value.specialRequirements
          ? [requirements.value.specialRequirements]
          : [],
        industry_domain: requirements.value.industryDomain,
        complexity_level: requirements.value.complexityLevel || 'moderate'
      })

      // 2. 同步到 Store
      researchBrief.value = briefResult.scope_definition
      documentStore.updateProgress(50)

      // 3. 同步到数据库
      await databaseSyncService.syncScopeAgentResult(projectStore.projectId, briefResult)
      documentStore.updateProgress(100)
      documentStore.completeOperation()

      return briefResult.scope_definition
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成研究简报失败'
      error.value = errorMessage
      documentStore.setError(errorMessage)
      throw err
    } finally {
      isGeneratingBrief.value = false
    }
  }

  /**
   * 生成标题列表
   */
  const generateTitles = async (): Promise<Title[]> => {
    if (!researchBrief.value) {
      throw new Error('请先生成研究简报')
    }

    try {
      isGeneratingTitles.value = true
      error.value = null
      documentStore.startOperation('generate-titles')

      // 调用 Search2Title Agent Service
      const titleResult = await search2TitleAgentService.executeSearch2TitleAndWait(
        projectStore.projectId!,
        researchBrief.value
      )

      // 更新状态
      generatedTitles.value = titleResult.titles
      documentStore.updateProgress(100)
      documentStore.completeOperation()

      // 同步到数据库
      await databaseSyncService.syncTitleGenerationResult(projectStore.projectId!, titleResult)

      return titleResult.titles
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成标题失败'
      error.value = errorMessage
      documentStore.setError(errorMessage)
      throw err
    } finally {
      isGeneratingTitles.value = false
    }
  }

  /**
   * 搜索素材
   */
  const searchMaterials = async (query: string): Promise<SearchResult[]> => {
    try {
      isSearching.value = true
      error.value = null

      const results = await searchAgentService.searchMaterials({
        query,
        maxResults: 10,
        topic: requirements.value.documentType
      })

      searchResults.value = results
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '搜索素材失败'
      error.value = errorMessage
      throw err
    } finally {
      isSearching.value = false
    }
  }

  /**
   * 选择标题
   */
  const selectTitle = (title: Title) => {
    selectedTitle.value = title
    documentStore.setError(null)
  }

  /**
   * 进入下一步
   */
  const proceedToNextStep = () => {
    if (currentStep.value < totalSteps.value) {
      currentStep.value++
    }
  }

  /**
   * 重置
   */
  const reset = () => {
    requirements.value = {
      topic: '',
      keyPoints: [],
      specialRequirements: '',
      targetAudience: '',
      documentType: 'article'
    }
    researchBrief.value = null
    generatedTitles.value = []
    selectedTitle.value = null
    searchResults.value = []
    currentStep.value = 1
    error.value = null
    documentStore.reset()
  }

  return {
    // 数据
    requirements,
    researchBrief,
    generatedTitles,
    selectedTitle,
    searchResults,
    currentStep,
    totalSteps,

    // 状态
    isGeneratingBrief,
    isGeneratingTitles,
    isSearching,
    error,

    // 方法
    updateRequirements,
    generateResearchBrief,
    generateTitles,
    searchMaterials,
    selectTitle,
    proceedToNextStep,
    reset
  }
}
```

##### 1.2 范围界定专用逻辑

**文件**：`src/composables/document/topic/useScopeAgent.ts`

```typescript
export interface UseScopeAgentReturn {
  // 数据
  currentScope: Ref<ScopeDefinition | null>
  taskHistory: Ref<ScopeTask[]>

  // 状态
  isExecuting: Ref<boolean>
  error: Ref<string | null>

  // 方法
  executeScopeAgent: (request: ScopeDefinitionRequest) => Promise<ScopeDefinition>
  getTaskStatus: (taskId: string) => Promise<ScopeTaskStatus>
  updateScope: (taskId: string, updates: Partial<ScopeDefinition>) => Promise<void>
  validateScope: (scope: ScopeDefinition) => Promise<ValidationResult>
  exportScope: (taskId: string, format: 'pdf' | 'docx' | 'json') => Promise<string>
}

export function useScopeAgent(): UseScopeAgentReturn {
  const scopeAgentService = useScopeAgentService()
  const aiTaskStore = useAITaskStore()

  const currentScope = ref<ScopeDefinition | null>(null)
  const taskHistory = ref<ScopeTask[]>([])

  const isExecuting = ref(false)
  const error = ref<string | null>(null)

  const executeScopeAgent = async (request: ScopeDefinitionRequest): Promise<ScopeDefinition> => {
    try {
      isExecuting.value = true
      error.value = null

      // 添加任务到 Store
      const taskId = `scope_${Date.now()}`
      aiTaskStore.addTask({
        id: taskId,
        type: 'scope-definition',
        stage: 'topic-selection',
        status: 'running',
        progress: 0,
        createdAt: new Date()
      })

      // 执行范围界定
      const result = await scopeAgentService.defineProjectScopeAndWait(request)

      // 更新任务状态
      aiTaskStore.updateTaskStatus(taskId, 'completed', result)

      currentScope.value = result.scope_definition
      taskHistory.value.unshift({
        taskId,
        request,
        result: result.scope_definition,
        createdAt: new Date()
      })

      return result.scope_definition
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '范围界定失败'
      error.value = errorMessage
      throw err
    } finally {
      isExecuting.value = false
    }
  }

  const getTaskStatus = async (taskId: string): Promise<ScopeTaskStatus> => {
    return scopeAgentService.getScopeTaskStatus(taskId)
  }

  const updateScope = async (taskId: string, updates: Partial<ScopeDefinition>): Promise<void> => {
    await scopeAgentService.updateScopeDefinition(taskId, updates)
  }

  const validateScope = async (scope: ScopeDefinition): Promise<ValidationResult> => {
    return scopeAgentService.validateScopeDefinition(scope)
  }

  const exportScope = async (taskId: string, format: 'pdf' | 'docx' | 'json'): Promise<string> => {
    const result = await scopeAgentService.exportScopeDefinition(taskId, format)
    return result.download_url
  }

  return {
    currentScope,
    taskHistory,
    isExecuting,
    error,
    executeScopeAgent,
    getTaskStatus,
    updateScope,
    validateScope,
    exportScope
  }
}
```

##### 1.3 搜索代理专用逻辑

**文件**：`src/composables/document/topic/useSearchAgent.ts`

```typescript
export interface UseSearchAgentReturn {
  // 数据
  searchResults: Ref<SearchResult[]>
  selectedResults: Ref<SearchResult[]>

  // 状态
  isSearching: Ref<boolean>
  error: Ref<string | null>

  // 方法
  search: (query: string, filters?: SearchFilters) => Promise<SearchResult[]>
  selectResult: (result: SearchResult) => void
  deselectResult: (result: SearchResult) => void
  clearSelection: () => void
  getSelectedResults: () => SearchResult[]
}

export function useSearchAgent(): UseSearchAgentReturn {
  const searchAgentService = useSearchAgentService()

  const searchResults = ref<SearchResult[]>([])
  const selectedResults = ref<SearchResult[]>([])

  const isSearching = ref(false)
  const error = ref<string | null>(null)

  const search = async (query: string, filters?: SearchFilters): Promise<SearchResult[]> => {
    try {
      isSearching.value = true
      error.value = null

      const results = await searchAgentService.searchMaterials({
        query,
        ...filters
      })

      searchResults.value = results
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '搜索失败'
      error.value = errorMessage
      throw err
    } finally {
      isSearching.value = false
    }
  }

  const selectResult = (result: SearchResult) => {
    if (!selectedResults.value.find((r) => r.id === result.id)) {
      selectedResults.value.push(result)
    }
  }

  const deselectResult = (result: SearchResult) => {
    selectedResults.value = selectedResults.value.filter((r) => r.id !== result.id)
  }

  const clearSelection = () => {
    selectedResults.value = []
  }

  const getSelectedResults = () => selectedResults.value

  return {
    searchResults,
    selectedResults,
    isSearching,
    error,
    search,
    selectResult,
    deselectResult,
    clearSelection,
    getSelectedResults
  }
}
```

##### 1.4 标题生成专用逻辑

**文件**：`src/composables/document/topic/useTitleGeneration.ts`

```typescript
export interface UseTitleGenerationReturn {
  // 数据
  generatedTitles: Ref<Title[]>
  selectedTitle: Ref<Title | null>
  titleVariants: Ref<TitleVariant[]>

  // 状态
  isGenerating: Ref<boolean>
  error: Ref<string | null>

  // 方法
  generateTitles: (brief: ResearchBrief) => Promise<Title[]>
  selectTitle: (title: Title) => void
  regenerateTitle: (titleId: string) => Promise<Title>
  validateTitle: (title: string) => Promise<ValidationResult>
}

export function useTitleGeneration(): UseTitleGenerationReturn {
  const search2TitleAgentService = useSearch2TitleAgentService()
  const titleGenerateService = useTitleGenerateService()

  const generatedTitles = ref<Title[]>([])
  const selectedTitle = ref<Title | null>(null)
  const titleVariants = ref<TitleVariant[]>([])

  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  const generateTitles = async (brief: ResearchBrief): Promise<Title[]> => {
    try {
      isGenerating.value = true
      error.value = null

      const result = await search2TitleAgentService.executeSearch2TitleAndWait(
        '', // projectId
        brief
      )

      generatedTitles.value = result.titles
      return result.titles
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成标题失败'
      error.value = errorMessage
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  const selectTitle = (title: Title) => {
    selectedTitle.value = title
  }

  const regenerateTitle = async (titleId: string): Promise<Title> => {
    const result = await titleGenerateService.regenerateTitle(titleId)
    const index = generatedTitles.value.findIndex((t) => t.id === titleId)
    if (index !== -1) {
      generatedTitles.value[index] = result
    }
    return result
  }

  const validateTitle = async (title: string): Promise<ValidationResult> => {
    return titleGenerateService.validateTitle(title)
  }

  return {
    generatedTitles,
    selectedTitle,
    titleVariants,
    isGenerating,
    error,
    generateTitles,
    selectTitle,
    regenerateTitle,
    validateTitle
  }
}
```

#### 2. Outline 领域

##### 2.1 大纲页面主逻辑

**文件**：`src/composables/document/outline/useOutlinePage.ts`

```typescript
export interface UseOutlinePageReturn {
  // 数据
  outline: Ref<Outline | null>
  sections: Ref<Section[]>
  selectedMaterials: Ref<Material[]>
  aiBindingResults: Ref<Record<string, AIBindingResult>>

  // 状态
  isGenerating: Ref<boolean>
  isBinding: Ref<boolean>
  error: Ref<string | null>

  // 方法
  loadOutline: (projectId: string) => Promise<void>
  generateOutlineWithMaterials: (title: string, materials: Material[]) => Promise<Outline>
  updateSection: (sectionId: string, updates: Partial<Section>) => Promise<void>
  bindMaterialsWithAI: (sectionId: string, materials: Material[]) => Promise<AIBindingResult>
  saveOutline: () => Promise<void>
  exportOutline: (format: 'json' | 'markdown' | 'pdf') => Promise<string>
}

export function useOutlinePage(): UseOutlinePageReturn {
  // ===== 依赖的 Store =====
  const outlineStore = useOutlineStore()
  const sectionStore = useOutlineSectionStore()
  const materialStore = useMaterialStore()
  const relationStore = useMaterialRelationStore()
  const documentStore = useDocumentGenerateStore()
  const projectStore = useProjectStore()

  // ===== 依赖的 Service =====
  const outlineService = useOutlineService()
  const outlineWithMaterialService = useOutlineWithMaterialService()
  const materialBindService = useMaterialBindService()
  const outlineSectionService = useOutlineSectionService()

  // ===== 响应式数据 =====
  const outline = computed(() => outlineStore.outline)
  const sections = computed(() => sectionStore.sections)
  const selectedMaterials = computed(() => materialStore.selectedMaterials)
  const aiBindingResults = computed(() => relationStore.aiBindingResults)

  const isGenerating = ref(false)
  const isBinding = ref(false)
  const error = ref<string | null>(null)

  // ===== 业务逻辑方法 =====

  /**
   * 加载大纲
   */
  const loadOutline = async (projectId: string): Promise<void> => {
    try {
      documentStore.startOperation('load-outline')
      documentStore.updateProgress(20)

      // 1. 获取大纲数据
      const outlineData = await outlineService.getActiveOutline(projectId)
      outlineStore.setOutlineId(outlineData.id)
      outlineStore.setOutlineInfo({
        title: outlineData.title,
        description: outlineData.description,
        structureType: outlineData.structureType
      })
      documentStore.updateProgress(50)

      // 2. 获取章节数据
      const sectionsData = await outlineSectionService.getSectionsByOutlineId(outlineData.id)
      sectionStore.setSections(sectionsData)
      documentStore.updateProgress(70)

      // 3. 获取素材绑定关系
      const relations = await materialRelationService.getRelationsByOutlineId(outlineData.id)
      relationStore.setRelations(relations)
      documentStore.updateProgress(90)

      documentStore.updateProgress(100)
      documentStore.completeOperation()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载大纲失败'
      error.value = errorMessage
      documentStore.setError(errorMessage)
      throw err
    }
  }

  /**
   * 生成大纲并绑定素材
   */
  const generateOutlineWithMaterials = async (
    title: string,
    materials: Material[]
  ): Promise<Outline> => {
    if (!projectStore.projectId) {
      throw new Error('项目未初始化')
    }

    try {
      isGenerating.value = true
      error.value = null
      documentStore.startOperation('generate-outline')

      // 1. 调用 AI 服务
      const result = await outlineWithMaterialService.generateOutlineWithMaterialAndWait({
        title,
        material_config: {
          material_ids: materials.map((m) => m.id),
          binding_strategy: 'auto'
        },
        outline_config: {
          length: 'detailed',
          sections_count: 5
        }
      })

      documentStore.updateProgress(50)

      // 2. 更新 Store
      outlineStore.setOutlineInfo({ title: result.outline.title })
      sectionStore.setSections(result.outline.sections)

      // 3. 保存到数据库
      await outlineService.saveOutline(result.outline)
      await outlineSectionService.batchCreateSections(result.outline.sections)

      // 4. 保存素材绑定关系
      relationStore.setRelations(result.material_bindings)

      documentStore.updateProgress(100)
      documentStore.completeOperation()

      return result.outline
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成大纲失败'
      error.value = errorMessage
      documentStore.setError(errorMessage)
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * 更新章节
   */
  const updateSection = async (sectionId: string, updates: Partial<Section>): Promise<void> => {
    try {
      // 1. 更新本地 Store
      sectionStore.updateSection(sectionId, updates)

      // 2. 同步到数据库
      await outlineSectionService.updateSection(sectionId, updates)

      // 3. 增量版本
      outlineStore.incrementVersion()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新章节失败'
      error.value = errorMessage
      throw err
    }
  }

  /**
   * AI 智能绑定素材
   */
  const bindMaterialsWithAI = async (
    sectionId: string,
    materials: Material[]
  ): Promise<AIBindingResult> => {
    try {
      isBinding.value = true
      error.value = null

      const result = await materialBindService.executeMaterialBind({
        sectionId,
        materialIds: materials.map((m) => m.id),
        relevanceThreshold: 0.7
      })

      // 保存绑定结果
      relationStore.setAIBindingResult(sectionId, result)

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI绑定失败'
      error.value = errorMessage
      throw err
    } finally {
      isBinding.value = false
    }
  }

  /**
   * 保存大纲
   */
  const saveOutline = async (): Promise<void> => {
    if (!outline.value) {
      throw new Error('大纲不存在')
    }

    try {
      documentStore.startOperation('save-outline')

      // 1. 保存大纲信息
      await outlineService.updateOutline(outline.value.id, {
        title: outline.value.title,
        description: outline.value.description,
        structureType: outline.value.structureType
      })
      documentStore.updateProgress(30)

      // 2. 保存章节
      await outlineSectionService.batchUpdateSections(sections.value)
      documentStore.updateProgress(60)

      // 3. 保存素材绑定关系
      await materialRelationService.saveRelations(relationStore.relations)
      documentStore.updateProgress(90)

      documentStore.updateProgress(100)
      documentStore.completeOperation()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存大纲失败'
      error.value = errorMessage
      documentStore.setError(errorMessage)
      throw err
    }
  }

  /**
   * 导出大纲
   */
  const exportOutline = async (format: 'json' | 'markdown' | 'pdf'): Promise<string> => {
    if (!outline.value) {
      throw new Error('大纲不存在')
    }

    const result = await outlineService.exportOutline(outline.value.id, format)
    return result.downloadUrl
  }

  return {
    outline,
    sections,
    selectedMaterials,
    aiBindingResults,
    isGenerating,
    isBinding,
    error,
    loadOutline,
    generateOutlineWithMaterials,
    updateSection,
    bindMaterialsWithAI,
    saveOutline,
    exportOutline
  }
}
```

##### 2.2 AI 大纲生成专用逻辑

**文件**：`src/composables/document/outline/useOutlineGeneration.ts`

```typescript
export interface UseOutlineGenerationReturn {
  // 数据
  generatedOutline: Ref<Outline | null>
  generationHistory: Ref<OutlineGenerationTask[]>

  // 状态
  isGenerating: Ref<boolean>
  progress: Ref<number>
  error: Ref<string | null>

  // 方法
  generateOutline: (request: OutlineGenerationRequest) => Promise<Outline>
  regenerateOutline: (outlineId: string) => Promise<Outline>
  optimizeOutline: (outlineId: string, preferences: OptimizationPreferences) => Promise<Outline>
  validateOutline: (outline: Outline) => Promise<ValidationResult>
}

export function useOutlineGeneration(): UseOutlineGenerationReturn {
  const outlineGenerateService = useOutlineGenerateService()
  const aiTaskStore = useAITaskStore()

  const generatedOutline = ref<Outline | null>(null)
  const generationHistory = ref<OutlineGenerationTask[]>([])

  const isGenerating = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  const generateOutline = async (request: OutlineGenerationRequest): Promise<Outline> => {
    try {
      isGenerating.value = true
      progress.value = 0
      error.value = null

      // 添加任务
      const taskId = `outline_gen_${Date.now()}`
      aiTaskStore.addTask({
        id: taskId,
        type: 'outline-generation',
        stage: 'outline',
        status: 'running',
        progress: 0,
        createdAt: new Date()
      })

      // 执行生成
      const result = await outlineGenerateService.generateOutlineAndWait(request, {
        onProgress: (p) => {
          progress.value = p
          aiTaskStore.updateTaskProgress(taskId, p)
        }
      })

      aiTaskStore.updateTaskStatus(taskId, 'completed', result)

      generatedOutline.value = result
      generationHistory.value.unshift({
        taskId,
        request,
        result,
        createdAt: new Date()
      })

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成大纲失败'
      error.value = errorMessage
      throw err
    } finally {
      isGenerating.value = false
      progress.value = 0
    }
  }

  const regenerateOutline = async (outlineId: string): Promise<Outline> => {
    const outline = generatedOutline.value
    if (!outline) {
      throw new Error('大纲不存在')
    }

    return generateOutline({
      title: outline.title,
      brief: outline.description,
      sectionsCount: outline.sections.length
    })
  }

  const optimizeOutline = async (
    outlineId: string,
    preferences: OptimizationPreferences
  ): Promise<Outline> => {
    return outlineGenerateService.optimizeOutline(outlineId, preferences)
  }

  const validateOutline = async (outline: Outline): Promise<ValidationResult> => {
    return outlineGenerateService.validateOutline(outline)
  }

  return {
    generatedOutline,
    generationHistory,
    isGenerating,
    progress,
    error,
    generateOutline,
    regenerateOutline,
    optimizeOutline,
    validateOutline
  }
}
```

##### 2.3 大纲编辑专用逻辑

**文件**：`src/composables/document/outline/useOutlineEditing.ts`

```typescript
export interface UseOutlineEditingReturn {
  // 数据
  editingSection: Ref<Section | null>
  undoStack: Ref<Section[][]>
  redoStack: Ref<Section[][]>

  // 状态
  isEditing: Ref<boolean>
  hasUnsavedChanges: Ref<boolean>
  error: Ref<string | null>

  // 方法
  startEditing: (sectionId: string) => void
  cancelEditing: () => void
  saveSection: (sectionId: string, updates: Partial<Section>) => Promise<void>
  deleteSection: (sectionId: string) => Promise<void>
  addSection: (parentId: string | null, position: number) => Promise<Section>
  moveSection: (sectionId: string, newParentId: string | null, newPosition: number) => Promise<void>
  duplicateSection: (sectionId: string) => Promise<Section>
  undo: () => void
  redo: () => void
}

export function useOutlineEditing(): UseOutlineEditingReturn {
  const sectionStore = useOutlineSectionStore()
  const outlineSectionService = useOutlineSectionService()

  const editingSection = ref<Section | null>(null)
  const undoStack = ref<Section[][]>([])
  const redoStack = ref<Section[][]>([])

  const isEditing = ref(false)
  const hasUnsavedChanges = ref(false)
  const error = ref<string | null>(null)

  const startEditing = (sectionId: string) => {
    const section = sectionStore.getSectionById(sectionId)
    if (section) {
      editingSection.value = section
      isEditing.value = true
      hasUnsavedChanges.value = false
    }
  }

  const cancelEditing = () => {
    editingSection.value = null
    isEditing.value = false
    hasUnsavedChanges.value = false
  }

  const saveSection = async (sectionId: string, updates: Partial<Section>): Promise<void> => {
    try {
      // 保存到 Store
      sectionStore.updateSection(sectionId, updates)

      // 保存到数据库
      await outlineSectionService.updateSection(sectionId, updates)

      // 更新编辑中的章节
      if (editingSection.value?.id === sectionId) {
        editingSection.value = { ...editingSection.value, ...updates }
      }

      hasUnsavedChanges.value = false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存章节失败'
      error.value = errorMessage
      throw err
    }
  }

  const deleteSection = async (sectionId: string): Promise<void> => {
    try {
      // 添加到撤销栈
      undoStack.value.push([...sectionStore.sections])

      // 从 Store 删除
      sectionStore.removeSection(sectionId)

      // 从数据库删除
      await outlineSectionService.deleteSection(sectionId)

      // 清空撤销栈
      redoStack.value = []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除章节失败'
      error.value = errorMessage
      throw err
    }
  }

  const addSection = async (parentId: string | null, position: number): Promise<Section> => {
    const newSection = await outlineSectionService.createSection({
      parentId,
      position,
      title: '新章节',
      description: ''
    })

    sectionStore.addSection(newSection)
    return newSection
  }

  const moveSection = async (
    sectionId: string,
    newParentId: string | null,
    newPosition: number
  ): Promise<void> => {
    try {
      undoStack.value.push([...sectionStore.sections])

      await outlineSectionService.moveSection(sectionId, newParentId, newPosition)

      // 更新 Store 中的章节
      const sections = [...sectionStore.sections]
      const sectionIndex = sections.findIndex((s) => s.id === sectionId)
      if (sectionIndex !== -1) {
        sections[sectionIndex] = { ...sections[sectionIndex], parentId: newParentId }
        sectionStore.reorderSections(sections.map((s) => s.id))
      }

      redoStack.value = []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '移动章节失败'
      error.value = errorMessage
      throw err
    }
  }

  const duplicateSection = async (sectionId: string): Promise<Section> => {
    const section = sectionStore.getSectionById(sectionId)
    if (!section) {
      throw new Error('章节不存在')
    }

    const duplicated = await outlineSectionService.createSection({
      parentId: section.parentId,
      position: section.position + 1,
      title: `${section.title} (副本)`,
      description: section.description
    })

    sectionStore.addSection(duplicated)
    return duplicated
  }

  const undo = () => {
    if (undoStack.value.length > 0) {
      const previousState = undoStack.value.pop()!
      redoStack.value.push([...sectionStore.sections])
      sectionStore.setSections(previousState)
    }
  }

  const redo = () => {
    if (redoStack.value.length > 0) {
      const nextState = redoStack.value.pop()!
      undoStack.value.push([...sectionStore.sections])
      sectionStore.setSections(nextState)
    }
  }

  return {
    editingSection,
    undoStack,
    redoStack,
    isEditing,
    hasUnsavedChanges,
    error,
    startEditing,
    cancelEditing,
    saveSection,
    deleteSection,
    addSection,
    moveSection,
    duplicateSection,
    undo,
    redo
  }
}
```

##### 2.4 素材绑定专用逻辑

**文件**：`src/composables/document/outline/useMaterialBinding.ts`

```typescript
export interface UseMaterialBindingReturn {
  // 数据
  materialBindings: Ref<MaterialBinding[]>
  aiSuggestions: Ref<Record<string, MaterialSuggestion[]>>

  // 状态
  isBinding: Ref<boolean>
  error: Ref<string | null>

  // 方法
  bindMaterial: (sectionId: string, materialId: string, bindingType: BindingType) => Promise<void>
  unbindMaterial: (sectionId: string, materialId: string) => Promise<void>
  autoBind: (sectionId: string, materials: Material[]) => Promise<AIBindingResult>
  suggestBindings: (sectionId: string) => Promise<MaterialSuggestion[]>
  validateBinding: (binding: MaterialBinding) => Promise<ValidationResult>
  batchBind: (bindings: MaterialBinding[]) => Promise<void>
}

export function useMaterialBinding(): UseMaterialBindingReturn {
  const relationStore = useMaterialRelationStore()
  const materialBindService = useMaterialBindService()
  const materialRelationService = useMaterialRelationService()

  const materialBindings = computed(() => relationStore.relations)
  const aiSuggestions = ref<Record<string, MaterialSuggestion[]>>({})

  const isBinding = ref(false)
  const error = ref<string | null>(null)

  const bindMaterial = async (
    sectionId: string,
    materialId: string,
    bindingType: BindingType
  ): Promise<void> => {
    try {
      const binding: MaterialBinding = {
        sectionId,
        materialId,
        bindingType,
        relevanceScore: 1.0,
        createdAt: new Date()
      }

      relationStore.addRelation(binding)
      await materialRelationService.bindMaterialToSection(binding)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '绑定素材失败'
      error.value = errorMessage
      throw err
    }
  }

  const unbindMaterial = async (sectionId: string, materialId: string): Promise<void> => {
    try {
      relationStore.removeRelation(sectionId, materialId)
      await materialRelationService.unbindMaterialFromSection(sectionId, materialId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '解绑素材失败'
      error.value = errorMessage
      throw err
    }
  }

  const autoBind = async (sectionId: string, materials: Material[]): Promise<AIBindingResult> => {
    try {
      isBinding.value = true
      error.value = null

      const result = await materialBindService.executeMaterialBind({
        sectionId,
        materialIds: materials.map((m) => m.id),
        relevanceThreshold: 0.7
      })

      relationStore.setAIBindingResult(sectionId, result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI绑定失败'
      error.value = errorMessage
      throw err
    } finally {
      isBinding.value = false
    }
  }

  const suggestBindings = async (sectionId: string): Promise<MaterialSuggestion[]> => {
    const suggestions = await materialBindService.suggestBindings(sectionId)
    aiSuggestions.value = {
      ...aiSuggestions.value,
      [sectionId]: suggestions
    }
    return suggestions
  }

  const validateBinding = async (binding: MaterialBinding): Promise<ValidationResult> => {
    return materialBindService.validateBinding(binding)
  }

  const batchBind = async (bindings: MaterialBinding[]): Promise<void> => {
    try {
      await materialRelationService.batchBindMaterials(bindings)
      bindings.forEach((binding) => relationStore.addRelation(binding))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量绑定失败'
      error.value = errorMessage
      throw err
    }
  }

  return {
    materialBindings,
    aiSuggestions,
    isBinding,
    error,
    bindMaterial,
    unbindMaterial,
    autoBind,
    suggestBindings,
    validateBinding,
    batchBind
  }
}
```

##### 2.5 素材选择专用逻辑

**文件**：`src/composables/document/outline/useMaterialSelection.ts`

```typescript
export interface UseMaterialSelectionReturn {
  // 数据
  selectedMaterials: Ref<Material[]>
  selectionMode: Ref<'single' | 'multiple'>
  selectionFilters: Ref<MaterialFilters>

  // 状态
  isSelecting: Ref<boolean>
  error: Ref<string | null>

  // 方法
  selectMaterial: (material: Material) => void
  deselectMaterial: (material: Material) => void
  toggleSelection: (material: Material) => void
  clearSelection: () => void
  selectAll: () => void
  applyFilters: (filters: MaterialFilters) => void
  getSelectedMaterialIds: () => string[]
}

export function useMaterialSelection(): UseMaterialSelectionReturn {
  const materialStore = useMaterialStore()

  const selectedMaterials = computed(() => materialStore.selectedMaterials)
  const selectionMode = ref<'single' | 'multiple'>('multiple')
  const selectionFilters = ref<MaterialFilters>({
    category: '',
    tags: [],
    dateRange: null
  })

  const isSelecting = ref(false)
  const error = ref<string | null>(null)

  const selectMaterial = (material: Material) => {
    materialStore.selectMaterial(material.id)
  }

  const deselectMaterial = (material: Material) => {
    materialStore.deselectMaterial(material.id)
  }

  const toggleSelection = (material: Material) => {
    materialStore.toggleMaterialSelection(material.id)
  }

  const clearSelection = () => {
    materialStore.deselectAll()
  }

  const selectAll = () => {
    materialStore.selectAll()
  }

  const applyFilters = (filters: MaterialFilters) => {
    materialStore.setMaterialFilters(filters)
    selectionFilters.value = filters
  }

  const getSelectedMaterialIds = () => {
    return selectedMaterials.value.map((m) => m.id)
  }

  return {
    selectedMaterials,
    selectionMode,
    selectionFilters,
    isSelecting,
    error,
    selectMaterial,
    deselectMaterial,
    toggleSelection,
    clearSelection,
    selectAll,
    applyFilters,
    getSelectedMaterialIds
  }
}
```

#### 3. Content 领域

##### 3.1 正文编辑主逻辑

**文件**：`src/composables/document/content/useContent.ts`

```typescript
export interface UseContentReturn {
  // 数据
  content: Ref<string>
  outline: Ref<Outline | null>
  wordCount: Ref<number>
  characterCount: Ref<number>

  // 状态
  isSaving: Ref<boolean>
  hasUnsavedChanges: Ref<boolean>
  lastSavedAt: Ref<Date | null>
  error: Ref<string | null>

  // 方法
  updateContent: (newContent: string) => void
  saveContent: () => Promise<void>
  loadContent: (documentId: string) => Promise<void>
  generateOutlineFromContent: () => Promise<Outline>
  exportContent: (format: 'markdown' | 'pdf' | 'docx') => Promise<string>
  reset: () => void
}

export function useContent(): UseContentReturn {
  const editorStore = useEditorStore()
  const outlineStore = useOutlineStore()
  const documentStore = useDocumentGenerateStore()
  const bodyService = useBodyService()

  const content = computed(() => editorStore.content)
  const outline = computed(() => outlineStore.outline)
  const wordCount = computed(() => editorStore.wordCount)
  const characterCount = computed(() => editorStore.characterCount)

  const isSaving = ref(false)
  const hasUnsavedChanges = ref(false)
  const lastSavedAt = ref<Date | null>(null)
  const error = ref<string | null>(null)

  let saveTimeout: NodeJS.Timeout | null = null

  const updateContent = (newContent: string) => {
    editorStore.setContent(newContent)
    hasUnsavedChanges.value = true

    // 防抖自动保存
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = setTimeout(() => {
      saveContent()
    }, 3000)
  }

  const saveContent = async (): Promise<void> => {
    if (!hasUnsavedChanges.value) return

    try {
      isSaving.value = true
      error.value = null
      documentStore.startOperation('save-content')

      await bodyService.updateBody({
        content: content.value,
        wordCount: wordCount.value,
        characterCount: characterCount.value,
        lastModified: new Date()
      })

      hasUnsavedChanges.value = false
      lastSavedAt.value = new Date()
      documentStore.completeOperation()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存内容失败'
      error.value = errorMessage
      documentStore.setError(errorMessage)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const loadContent = async (documentId: string): Promise<void> => {
    try {
      documentStore.startOperation('load-content')
      const body = await bodyService.getActiveBody(documentId)
      editorStore.setContent(body.content)
      documentStore.updateProgress(100)
      documentStore.completeOperation()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载内容失败'
      error.value = errorMessage
      throw err
    }
  }

  const generateOutlineFromContent = async (): Promise<Outline> => {
    const result = await outlineService.generateOutlineFromContent(content.value)
    outlineStore.setOutlineInfo({ title: result.title })
    return result
  }

  const exportContent = async (format: 'markdown' | 'pdf' | 'docx'): Promise<string> => {
    const result = await bodyService.exportContent(content.value, format)
    return result.downloadUrl
  }

  const reset = () => {
    editorStore.reset()
    hasUnsavedChanges.value = false
    lastSavedAt.value = null
    error.value = null
  }

  return {
    content,
    outline,
    wordCount,
    characterCount,
    isSaving,
    hasUnsavedChanges,
    lastSavedAt,
    error,
    updateContent,
    saveContent,
    loadContent,
    generateOutlineFromContent,
    exportContent,
    reset
  }
}
```

##### 3.2 AI 辅助功能专用逻辑

**文件**：`src/composables/document/content/useContentAI.ts`

```typescript
export interface UseContentAIReturn {
  // 数据
  aiOperationResult: Ref<AiOperationResult | null>
  operationHistory: Ref<AiOperation[]>

  // 状态
  isProcessing: Ref<boolean>
  error: Ref<string | null>

  // 方法
  polishContent: (content: string) => Promise<string>
  expandContent: (content: string, targetLength: number) => Promise<string>
  summarizeContent: (content: string) => Promise<string>
  translateContent: (content: string, targetLanguage: string) => Promise<string>
  rewriteContent: (content: string, style: RewriteStyle) => Promise<string>
}

export function useContentAI(): UseContentAIReturn {
  const contentGenerateService = useContentGenerateService()
  const aiTaskStore = useAITaskStore()

  const aiOperationResult = ref<AiOperationResult | null>(null)
  const operationHistory = ref<AiOperation[]>([])

  const isProcessing = ref(false)
  const error = ref<string | null>(null)

  const polishContent = async (content: string): Promise<string> => {
    try {
      isProcessing.value = true
      error.value = null

      const result = await contentGenerateService.polishContent(content)
      aiOperationResult.value = result
      operationHistory.value.unshift({
        type: 'polish',
        content,
        result: result.content,
        createdAt: new Date()
      })

      return result.content
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '润色失败'
      error.value = errorMessage
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  const expandContent = async (content: string, targetLength: number): Promise<string> => {
    try {
      isProcessing.value = true
      error.value = null

      const result = await contentGenerateService.expandContent(content, targetLength)
      aiOperationResult.value = result
      operationHistory.value.unshift({
        type: 'expand',
        content,
        result: result.content,
        createdAt: new Date()
      })

      return result.content
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '扩写失败'
      error.value = errorMessage
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  const summarizeContent = async (content: string): Promise<string> => {
    try {
      isProcessing.value = true
      error.value = null

      const result = await contentGenerateService.summarizeContent(content)
      aiOperationResult.value = result

      return result.content
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '总结失败'
      error.value = errorMessage
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  const translateContent = async (content: string, targetLanguage: string): Promise<string> => {
    try {
      isProcessing.value = true
      error.value = null

      const result = await contentGenerateService.translateContent(content, targetLanguage)
      aiOperationResult.value = result

      return result.content
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '翻译失败'
      error.value = errorMessage
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  const rewriteContent = async (content: string, style: RewriteStyle): Promise<string> => {
    try {
      isProcessing.value = true
      error.value = null

      const result = await contentGenerateService.rewriteContent(content, style)
      aiOperationResult.value = result

      return result.content
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '改写失败'
      error.value = errorMessage
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  return {
    aiOperationResult,
    operationHistory,
    isProcessing,
    error,
    polishContent,
    expandContent,
    summarizeContent,
    translateContent,
    rewriteContent
  }
}
```

##### 3.3 统计功能专用逻辑

**文件**：`src/composables/document/content/useContentStats.ts`

```typescript
export interface UseContentStatsReturn {
  // 数据
  stats: Ref<DocumentStats | null>
  readabilityScore: Ref<number>
  qualityScore: Ref<number>

  // 方法
  calculateStats: (content: string) => Promise<DocumentStats>
  analyzeReadability: (content: string) => Promise<ReadabilityAnalysis>
  analyzeQuality: (content: string) => Promise<QualityAnalysis>
  generateReport: () => Promise<StatsReport>
}

export function useContentStats(): UseContentStatsReturn {
  const statsStore = useContentStatsStore()

  const stats = computed(() => statsStore.stats)
  const readabilityScore = computed(() => stats.value?.readabilityScore || 0)
  const qualityScore = computed(() => stats.value?.qualityScore || 0)

  const calculateStats = async (content: string): Promise<DocumentStats> => {
    try {
      statsStore.setCalculationInProgress(true)

      const stats = await contentStatsService.calculate(content)

      statsStore.setStats(stats)
      return stats
    } finally {
      statsStore.setCalculationInProgress(false)
    }
  }

  const analyzeReadability = async (content: string): Promise<ReadabilityAnalysis> => {
    return contentStatsService.analyzeReadability(content)
  }

  const analyzeQuality = async (content: string): Promise<QualityAnalysis> => {
    return contentStatsService.analyzeQuality(content)
  }

  const generateReport = async (): Promise<StatsReport> => {
    if (!stats.value) {
      throw new Error('请先计算统计信息')
    }

    return contentStatsService.generateReport(stats.value)
  }

  return {
    stats,
    readabilityScore,
    qualityScore,
    calculateStats,
    analyzeReadability,
    analyzeQuality,
    generateReport
  }
}
```

##### 3.4 文档同步专用逻辑

**文件**：`src/composables/document/content/useDocumentSync.ts`

```typescript
export interface UseDocumentSyncReturn {
  // 数据
  lastSyncTime: Ref<Date | null>
  syncStatus: Ref<'idle' | 'syncing' | 'error'>

  // 状态
  isAutoSyncEnabled: Ref<boolean>
  syncInterval: Ref<number>

  // 方法
  syncDocument: () => Promise<void>
  enableAutoSync: (interval?: number) => void
  disableAutoSync: () => void
  resolveConflict: (
    localVersion: DocumentVersion,
    remoteVersion: DocumentVersion
  ) => Promise<DocumentVersion>
}

export function useDocumentSync(): UseDocumentSyncReturn {
  const bodyService = useBodyService()
  const editorStore = useEditorStore()
  const outlineStore = useOutlineStore()

  const lastSyncTime = ref<Date | null>(null)
  const syncStatus = ref<'idle' | 'syncing' | 'error'>('idle')

  const isAutoSyncEnabled = ref(false)
  const syncInterval = ref(30000) // 30秒

  let autoSyncTimer: NodeJS.Timeout | null = null

  const syncDocument = async (): Promise<void> => {
    try {
      syncStatus.value = 'syncing'

      const currentContent = editorStore.content
      const currentOutline = outlineStore.outline

      // 并行同步内容和提纲
      await Promise.all([
        bodyService.syncContent(currentContent),
        outlineService.syncOutline(currentOutline)
      ])

      lastSyncTime.value = new Date()
      syncStatus.value = 'idle'
    } catch (err) {
      syncStatus.value = 'error'
      throw err
    }
  }

  const enableAutoSync = (interval: number = syncInterval.value): void => {
    isAutoSyncEnabled.value = true
    syncInterval.value = interval

    autoSyncTimer = setInterval(() => {
      syncDocument()
    }, interval)
  }

  const disableAutoSync = (): void => {
    isAutoSyncEnabled.value = false
    if (autoSyncTimer) {
      clearInterval(autoSyncTimer)
      autoSyncTimer = null
    }
  }

  const resolveConflict = async (
    localVersion: DocumentVersion,
    remoteVersion: DocumentVersion
  ): Promise<DocumentVersion> => {
    // 简单的冲突解决策略：优先保留修改时间更新的版本
    const localTime = new Date(localVersion.lastModified).getTime()
    const remoteTime = new Date(remoteVersion.lastModified).getTime()

    return localTime > remoteTime ? localVersion : remoteVersion
  }

  return {
    lastSyncTime,
    syncStatus,
    isAutoSyncEnabled,
    syncInterval,
    syncDocument,
    enableAutoSync,
    disableAutoSync,
    resolveConflict
  }
}
```

## 重构实施步骤

### 第一阶段：创建新的 Composable（2天）

1. 创建领域专用的 Composable
2. 实现基础业务逻辑
3. 定义清晰的接口

### 第二阶段：迁移现有逻辑（2天）

1. 逐步迁移现有 Composable 的业务逻辑
2. 保持 UI 相关代码在 View 层
3. 验证功能完整性

### 第三阶段：清理和优化（1天）

1. 删除旧 Composable
2. 优化性能和类型定义
3. 完善测试用例

## 测试策略

### 单元测试示例

```typescript
describe('useTopicSelection', () => {
  it('应该正确生成研究简报', async () => {
    const { generateResearchBrief } = useTopicSelection()

    const result = await generateResearchBrief()

    expect(result).toBeDefined()
    expect(result.objectives).toBeDefined()
  })

  it('应该在失败时设置错误信息', async () => {
    const { generateResearchBrief, error } = useTopicSelection()

    await expect(generateResearchBrief()).rejects.toThrow()
    expect(error.value).toBeDefined()
  })
})
```

### 集成测试

```typescript
describe('Composable 集成测试', () => {
  it('Composable 间应该正确协作', () => {
    const topicSelection = useTopicSelection()
    const scopeAgent = useScopeAgent()

    topicSelection.generateResearchBrief()
    expect(scopeAgent.currentScope.value).toBeDefined()
  })
})
```

## 性能优化

### 1. 依赖注入优化

```typescript
// 使用依赖注入避免重复创建 Service
let serviceCache: Map<string, any> = new Map()

export function useOutlineService() {
  const cacheKey = 'outlineService'
  if (serviceCache.has(cacheKey)) {
    return serviceCache.get(cacheKey)
  }

  const service = new OutlineService()
  serviceCache.set(cacheKey, service)
  return service
}
```

### 2. 计算缓存

```typescript
// 使用 computed 缓存计算结果
const expensiveCalculation = computed(() => {
  return heavyComputation(data.value)
})
```

### 3. 防抖和节流

```typescript
// 使用防抖避免频繁调用
const debouncedSave = debounce(saveContent, 1000)
```

## 验收标准

### 功能验收

- [ ] 所有 Composable 职责单一，无 UI 逻辑
- [ ] 所有 API 调用通过 Service
- [ ] 所有状态更新通过 Store Actions

### 代码质量

- [ ] Composable 行数 < 500 行
- [ ] 测试覆盖率 > 85%
- [ ] 通过 ESLint 检查

### 性能验收

- [ ] 业务逻辑执行时间 < 100ms
- [ ] 无内存泄漏
- [ ] 响应式更新优化

## 风险与应对

### 高风险

1. **业务逻辑丢失**

   - 风险：迁移过程中业务逻辑丢失
   - 应对：详细测试，逐步迁移

2. **性能下降**
   - 风险：拆分后性能受影响
   - 应对：性能测试，优化缓存

### 中风险

1. **接口变更**
   - 风险：Composable 接口变更影响使用
   - 应对：向后兼容，文档更新

## 后续优化

### 短期（1周内）

1. 优化 Composable 性能
2. 完善测试用例
3. 添加文档注释

### 中期（1个月内）

1. 实现 Composable 组合
2. 添加性能监控
3. 建立最佳实践

### 长期（3个月内）

1. 自动化 Composable 生成
2. 可视化业务逻辑
3. 业务逻辑复用机制
