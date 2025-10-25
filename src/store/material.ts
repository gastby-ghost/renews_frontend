import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { aiService } from '@/services/aiService'
import { materialApiService, MaterialApiService } from '@/services/materialService'
import type {
  Material,
  SearchConfig,
  SearchProgress,
  MaterialLibraryState,
  AgentSearchConfig,
  AgentSearchResult,
  AgentService,
  AgentState
} from '@/types/material'
import type { SearchToolsStatusResponse } from '@/types/ai'

export const useMaterialStore = defineStore('material', () => {
  const state = ref<MaterialLibraryState>({
    materials: [],
    selectedMaterials: [],
    searchHistory: [],
    providers: [
      {
        id: 'tavily',
        name: 'Tavily',
        type: 'api',
        apiEndpoint: '/api/search/tavily'
      },
      {
        id: 'bocha',
        name: '博查',
        type: 'api',
        apiEndpoint: '/api/search/bocha'
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        type: 'ai',
        apiEndpoint: '/api/ai/deepseek'
      }
    ],
    loading: false,
    error: null
  })

  // Search-tools 相关状态
  const searchToolsStatus = ref<SearchToolsStatusResponse | null>(null)
  const searchMode = ref<'simple' | 'agent'>('simple')
  const currentSearchResults = ref<Material[]>([])
  const searchProgress = ref<SearchProgress>({
    stage: 'config',
    current: 0,
    total: 100,
    message: '准备搜索...'
  })

  // Agent 相关状态
  const agentState = ref<AgentState>({
    activeAgents: [],
    currentTask: null,
    taskHistory: [],
    agentCapabilities: {},
    loading: false,
    error: null
  })

  const availableAgents = ref<AgentService[]>([])
  const currentAgentSearchResults = ref<AgentSearchResult | null>(null)

  const materials = computed(() => state.value.materials)
  const selectedMaterials = computed(() => state.value.selectedMaterials)
  const searchHistory = computed(() => state.value.searchHistory)
  const providers = computed(() => state.value.providers)
  const loading = computed(() => state.value.loading)
  const error = computed(() => state.value.error)

  const selectedMaterialList = computed(() =>
    state.value.materials.filter((material) => state.value.selectedMaterials.includes(material.id))
  )

  // Agent 计算属性
  const agentLoading = computed(() => agentState.value.loading)
  const agentError = computed(() => agentState.value.error)
  const currentAgentTask = computed(() => agentState.value.currentTask)
  const agentTaskHistory = computed(() => agentState.value.taskHistory)
  const agentCapabilities = computed(() => agentState.value.agentCapabilities)

  function addMaterial(material: Material) {
    state.value.materials.unshift(material)
  }

  function addMaterials(materials: Material[]) {
    state.value.materials.unshift(...materials)
  }

  function removeMaterial(id: string) {
    const index = state.value.materials.findIndex((m) => m.id === id)
    if (index > -1) {
      state.value.materials.splice(index, 1)
    }
    state.value.selectedMaterials = state.value.selectedMaterials.filter(
      (selectedId) => selectedId !== id
    )
  }

  function toggleMaterialSelection(id: string) {
    const index = state.value.selectedMaterials.indexOf(id)
    if (index > -1) {
      state.value.selectedMaterials.splice(index, 1)
    } else {
      state.value.selectedMaterials.push(id)
    }
  }

  function clearSelection() {
    state.value.selectedMaterials = []
  }

  function selectAll() {
    state.value.selectedMaterials = state.value.materials.map((m) => m.id)
  }

  function setSearchProgress(progress: SearchProgress) {
    // Implementation for search progress tracking
    console.log('Search progress:', progress)
  }

  async function searchMaterials(config: SearchConfig) {
    state.value.loading = true
    state.value.error = null

    try {
      // Add to search history
      state.value.searchHistory.unshift({
        ...config,
        providers: [...config.providers]
      })

      // Use the search service
      const searchParams = {
        keywords: config.keywords,
        providers: config.providers,
        searchScope: config.searchScope,
        aiProvider: config.aiProvider,
        filters: config.filters,
        page: 1,
        pageSize: 50
      }

      // Use the search service
      const result = await aiService.searchTools(searchParams)

      addMaterials(result.materials)
      return result.materials
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '搜索失败'
      throw error
    } finally {
      state.value.loading = false
    }
  }

  // 使用 search-tools API 搜索素材
  async function searchWithSearchTools(config: SearchConfig) {
    state.value.loading = true
    state.value.error = null

    // 更新搜索进度
    updateSearchProgress('config', 0, 100, '配置搜索参数...')

    try {
      // Add to search history
      state.value.searchHistory.unshift({
        ...config,
        providers: [...config.providers]
      })

      // Use the search-tools service
      const searchParams = {
        keywords: config.keywords,
        providers: config.providers,
        searchScope: config.searchScope,
        aiProvider: config.aiProvider,
        filters: config.filters,
        page: 1,
        pageSize: 20
      }

      // 更新搜索进度
      updateSearchProgress('searching', 20, 100, '正在搜索素材...')

      const result = await aiService.searchTools(searchParams)

      // 更新搜索进度
      updateSearchProgress('processing', 80, 100, '处理搜索结果...')

      // 保存当前搜索结果
      currentSearchResults.value = result.materials as Material[]

      // 添加到素材库
      addMaterials(result.materials)

      // 更新搜索进度
      updateSearchProgress('completed', 100, 100, '搜索完成')

      return result.materials as Material[]
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '搜索失败'
      throw error
    } finally {
      state.value.loading = false
    }
  }

  // 检查搜索工具状态
  async function checkSearchToolsStatus() {
    try {
      // 如果已经有状态数据且最近更新过，直接返回
      if (searchToolsStatus.value) {
        console.log('[material store] 使用已有的状态数据，跳过API调用')
        return searchToolsStatus.value
      }

      console.log('[material store] checkSearchToolsStatus: 开始检查搜索工具状态')
      console.log('[material store] 时间戳:', new Date().toISOString())
      const status = await aiService.getSearchToolsStatus()
      console.log('[material store] checkSearchToolsStatus: 搜索工具状态检查完成')
      console.log('[material store] 完成时间戳:', new Date().toISOString())
      searchToolsStatus.value = status
      return status
    } catch (error) {
      console.error('[material store] checkSearchToolsStatus error:', error)
      state.value.error = error instanceof Error ? error.message : '检查搜索工具状态失败'
      throw error
    }
  }

  // 更新搜索进度
  function updateSearchProgress(
    stage: SearchProgress['stage'],
    current: number,
    total: number,
    message: string
  ) {
    searchProgress.value = {
      stage,
      current,
      total,
      message
    }
  }

  // 设置搜索模式
  function setSearchMode(mode: 'simple' | 'agent') {
    searchMode.value = mode
  }

  // 清空当前搜索结果
  function clearCurrentSearchResults() {
    currentSearchResults.value = []
  }

  // 清空搜索历史
  function clearSearchHistory() {
    state.value.searchHistory = []
  }

  // 只添加搜索历史，不执行搜索
  function addToSearchHistory(config: SearchConfig) {
    console.log('[MaterialStore] 添加搜索历史记录:', {
      keywords: config.keywords,
      providers: config.providers,
      searchScope: config.searchScope,
      filters: config.filters
    })
    state.value.searchHistory.unshift({
      ...config,
      providers: [...config.providers]
    })
    console.log(
      '[MaterialStore] 搜索历史已更新，当前历史记录数量:',
      state.value.searchHistory.length
    )
  }

  // Agent 相关方法实现

  // 获取可用的Agent服务
  async function fetchAvailableAgents() {
    try {
      agentState.value.loading = true
      agentState.value.error = null

      // 使用AI服务获取Scope Agent任务列表作为替代
      const agents = await aiService.getScopeAgentTasks('system')
      availableAgents.value = agents
      agentState.value.activeAgents = agents

      return agents
    } catch (error) {
      agentState.value.error = error instanceof Error ? error.message : '获取Agent服务失败'
      throw error
    } finally {
      agentState.value.loading = false
    }
  }

  // 使用Agent进行搜索
  async function searchWithAgent(config: AgentSearchConfig) {
    try {
      agentState.value.loading = true
      agentState.value.error = null

      // 更新搜索进度
      updateSearchProgress('config', 0, 100, '配置Agent搜索参数...')

      // 创建Agent任务
      // const task = await createAgentTask(config)

      // 更新搜索进度
      updateSearchProgress('searching', 20, 100, 'Agent正在分析需求...')

      // 执行Agent搜索
      const result = await agentService.searchWithAgent(config)

      // 更新搜索进度
      updateSearchProgress('processing', 80, 100, 'Agent正在处理搜索结果...')

      // 保存结果
      currentAgentSearchResults.value = result

      // 添加素材到本地状态
      addMaterials(result.materials)

      // 更新搜索进度
      updateSearchProgress('completed', 100, 100, 'Agent搜索完成')

      return result
    } catch (error) {
      agentState.value.error = error instanceof Error ? error.message : 'Agent搜索失败'
      throw error
    } finally {
      agentState.value.loading = false
    }
  }

  // 创建Agent任务
  async function createAgentTask(config: AgentSearchConfig) {
    try {
      const task = await agentService.createAgentTask(config)
      agentState.value.currentTask = task
      return task
    } catch (error) {
      agentState.value.error = error instanceof Error ? error.message : '创建Agent任务失败'
      throw error
    }
  }

  // 获取Agent任务状态
  async function getAgentTask(taskId: string) {
    try {
      const task = await agentService.getAgentTask(taskId)

      // 更新当前任务状态
      if (agentState.value.currentTask?.id === taskId) {
        agentState.value.currentTask = task
      }

      // 如果任务完成，添加到历史记录
      if (task.status === 'completed' || task.status === 'failed') {
        const historyIndex = agentState.value.taskHistory.findIndex((t) => t.id === taskId)
        if (historyIndex > -1) {
          agentState.value.taskHistory[historyIndex] = task
        } else {
          agentState.value.taskHistory.unshift(task)
        }
      }

      return task
    } catch (error) {
      agentState.value.error = error instanceof Error ? error.message : '获取Agent任务状态失败'
      throw error
    }
  }

  // 取消Agent任务
  async function cancelAgentTask(taskId: string) {
    try {
      await agentService.cancelAgentTask(taskId)

      // 更新任务状态
      if (agentState.value.currentTask?.id === taskId) {
        agentState.value.currentTask.status = 'failed'
        agentState.value.currentTask.message = '任务已取消'
      }
    } catch (error) {
      agentState.value.error = error instanceof Error ? error.message : '取消Agent任务失败'
      throw error
    }
  }

  // 获取Agent任务历史
  async function getAgentTaskHistory() {
    try {
      const history = await agentService.getAgentTaskHistory()
      agentState.value.taskHistory = history
      return history
    } catch (error) {
      agentState.value.error = error instanceof Error ? error.message : '获取Agent任务历史失败'
      throw error
    }
  }

  // 获取Agent推荐内容
  async function getAgentRecommendations(materialId: string) {
    try {
      const recommendations = await agentService.getAgentRecommendations(materialId)
      return recommendations
    } catch (error) {
      agentState.value.error = error instanceof Error ? error.message : '获取Agent推荐失败'
      throw error
    }
  }

  // 分析素材内容
  async function analyzeMaterial(materialId: string) {
    try {
      const analysis = await agentService.analyzeMaterial(materialId)
      return analysis
    } catch (error) {
      agentState.value.error = error instanceof Error ? error.message : '分析素材内容失败'
      throw error
    }
  }

  // 获取Agent能力配置
  async function getAgentCapabilities() {
    try {
      const capabilities = await agentService.getAgentCapabilities()
      agentState.value.agentCapabilities = capabilities
      return capabilities
    } catch (error) {
      agentState.value.error = error instanceof Error ? error.message : '获取Agent能力配置失败'
      throw error
    }
  }

  // 更新Agent状态
  function updateAgentState(updates: Partial<AgentState>) {
    Object.assign(agentState.value, updates)
  }

  // 清空Agent错误
  function clearAgentError() {
    agentState.value.error = null
  }

  // 清空Agent任务历史
  function clearAgentTaskHistory() {
    agentState.value.taskHistory = []
  }

  async function updateMaterial(updates: Partial<Material> & { id: string }) {
    const index = state.value.materials.findIndex((m) => m.id === updates.id)
    if (index > -1) {
      state.value.materials[index] = {
        ...state.value.materials[index],
        ...updates,
        updatedAt: new Date()
      }
    }
  }

  function getMaterialsByType(type: Material['type']) {
    return state.value.materials.filter((m) => m.type === type)
  }

  function getMaterialsByTag(tag: string) {
    return state.value.materials.filter((m) => m.tags.includes(tag))
  }

  function clearError() {
    state.value.error = null
  }

  async function addToLibrary(materialIds: string[]) {
    try {
      // 使用旧的API作为备用
      // 使用素材API服务添加到素材库
      await materialApiService.createMaterials(
        1,
        materialIds.map((id) => ({
          title: `素材-${id}`,
          summary: '从搜索结果导入的素材',
          url: '',
          tags: []
        }))
      )
      // Update local state to mark materials as in library
      materialIds.forEach((id) => {
        updateMaterial({ id, selected: false })
      })
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '添加到素材库失败'
      throw error
    }
  }

  /**
   * 将搜索结果添加到数据库
   * @param searchResults 搜索结果素材列表
   * @param projectId 项目ID，默认为1
   * @returns 添加结果
   */
  async function addSearchResultsToDatabase(searchResults: Material[], projectId: number = 1) {
    try {
      // 添加调试日志：检查原始搜索结果的tags
      console.log('[MaterialStore] 原始搜索结果的tags情况:', {
        searchResultsCount: searchResults.length,
        searchResultsWithTags: searchResults.map((result) => ({
          title: result.title,
          tags: result.tags,
          tagsLength: result.tags ? result.tags.length : 0
        }))
      })

      // 将搜索结果转换为API所需格式
      const materialsData = searchResults.map((result) =>
        MaterialApiService.convertSearchResultToMaterialData(result)
      )

      // 添加调试日志：检查转换后的materialsData的tags
      console.log('[MaterialStore] 转换后的materialsData的tags情况:', {
        materialsDataCount: materialsData.length,
        materialsDataWithTags: materialsData.map((material) => ({
          title: material.title,
          tags: material.tags,
          tagsLength: material.tags ? material.tags.length : 0
        }))
      })

      // 调用API批量创建素材
      const response = await materialApiService.createMaterials(projectId, materialsData)

      // 将API返回的素材转换为前端格式并添加到本地状态
      const newMaterials = response.materials.map((apiMaterial) =>
        MaterialApiService.convertApiMaterialToMaterial(apiMaterial)
      )

      // 添加到本地状态
      addMaterials(newMaterials)

      return {
        success: response.success,
        message: response.message,
        addedCount: newMaterials.length,
        materials: newMaterials
      }
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '添加素材到数据库失败'
      throw error
    }
  }

  /**
   * 从数据库加载项目素材
   * @param projectId 项目ID，默认为1
   * @param params 查询参数
   * @returns 素材列表
   */
  async function loadProjectMaterialsFromDatabase(
    projectId: number = 1,
    params?: {
      page?: number
      page_size?: number
      keywords?: string
      tags?: string[]
    }
  ) {
    state.value.loading = true
    state.value.error = null

    try {
      const response = await materialApiService.getProjectMaterials(projectId, params)

      // 将API返回的素材转换为前端格式
      const materials = response.materials.map((apiMaterial) =>
        MaterialApiService.convertApiMaterialToMaterial(apiMaterial)
      )

      // 更新本地状态
      state.value.materials = materials

      return {
        materials,
        totalCount: response.total_count,
        page: response.page,
        pageSize: response.page_size,
        totalPages: response.total_pages
      }
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '从数据库加载素材失败'
      throw error
    } finally {
      state.value.loading = false
    }
  }

  /**
   * 从数据库加载所有素材
   * @param params 查询参数
   * @returns 素材列表
   */
  async function loadAllMaterialsFromDatabase(params?: {
    page?: number
    page_size?: number
    keywords?: string
    tags?: string[]
  }) {
    state.value.loading = true
    state.value.error = null

    try {
      const response = await materialApiService.getAllMaterials(params)

      // 将API返回的素材转换为前端格式
      const materials = response.materials.map((apiMaterial) =>
        MaterialApiService.convertApiMaterialToMaterial(apiMaterial)
      )

      // 更新本地状态
      state.value.materials = materials

      return {
        materials,
        totalCount: response.total_count,
        page: response.page,
        pageSize: response.page_size,
        totalPages: response.total_pages
      }
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '从数据库加载素材失败'
      throw error
    } finally {
      state.value.loading = false
    }
  }

  /**
   * 从数据库删除素材
   * @param materialIds 素材ID列表（字符串格式）
   * @returns 删除结果
   */
  async function deleteMaterialsFromDatabase(materialIds: string[]) {
    try {
      console.log('[MaterialStore] 开始删除素材，原始ID列表:', materialIds)

      // 将字符串ID转换为数字ID，并添加验证
      const numericIds: number[] = []
      const invalidIds: string[] = []

      materialIds.forEach((id) => {
        const numId = parseInt(id, 10)
        if (isNaN(numId)) {
          console.error(`[MaterialStore] 无效的素材ID: ${id}`)
          invalidIds.push(id)
        } else {
          numericIds.push(numId)
        }
      })

      if (invalidIds.length > 0) {
        console.warn(`[MaterialStore] 发现 ${invalidIds.length} 个无效ID:`, invalidIds)
        ElMessage.warning(`发现 ${invalidIds.length} 个无效的素材ID，将跳过删除`)
      }

      if (numericIds.length === 0) {
        throw new Error('没有有效的素材ID可以删除')
      }

      console.log('[MaterialStore] 转换后的数字ID列表:', numericIds)

      // 调用API删除素材
      const response = await materialApiService.deleteMaterials(numericIds)
      console.log('[MaterialStore] 删除API响应:', response)

      // 从本地状态中移除已删除的素材（只移除成功删除的）
      const successfullyDeletedIds = materialIds.filter((id) => {
        const numId = parseInt(id, 10)
        return !isNaN(numId) && numericIds.includes(numId)
      })

      successfullyDeletedIds.forEach((id) => {
        removeMaterial(id)
      })

      console.log('[MaterialStore] 从本地状态移除的素材ID:', successfullyDeletedIds)

      return {
        success: response.success,
        message: response.message,
        deletedCount: response.deleted_count,
        failedCount: response.failed_count
      }
    } catch (error) {
      console.error('[MaterialStore] 删除素材失败:', error)
      state.value.error = error instanceof Error ? error.message : '从数据库删除素材失败'
      throw error
    }
  }

  async function removeFromLibrary(materialIds: string[]) {
    try {
      // 由于移除了materialSearchService，这里使用素材API删除功能
      // 需要根据实际的素材ID数组来删除，这里简化处理
      const idsToDelete = materialIds.map((id) => parseInt(id)).filter((id) => !isNaN(id))
      if (idsToDelete.length > 0) {
        await materialApiService.deleteMaterials(idsToDelete)
      }
      materialIds.forEach((id) => {
        removeMaterial(id)
      })
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '从素材库删除失败'
      throw error
    }
  }

  async function loadLibraryMaterials(params?: {
    type?: Material['type']
    source?: string
    tags?: string[]
    search?: string
    page?: number
    pageSize?: number
  }) {
    state.value.loading = true
    state.value.error = null

    try {
      // 由于移除了materialSearchService，这里使用素材API获取项目素材作为替代
      const result = await materialApiService.getProjectMaterials(1, params)
      state.value.materials = result.materials
      return result.materials
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '加载素材库失败'
      throw error
    } finally {
      state.value.loading = false
    }
  }

  return {
    // State
    materials,
    selectedMaterials,
    searchHistory,
    providers,
    loading,
    error,
    selectedMaterialList,

    // Search-tools 相关状态
    searchToolsStatus,
    searchMode,
    currentSearchResults,
    searchProgress,

    // Actions
    addMaterial,
    addMaterials,
    removeMaterial,
    toggleMaterialSelection,
    clearSelection,
    selectAll,
    setSearchProgress,
    searchMaterials,
    searchWithSearchTools,
    updateMaterial,
    getMaterialsByType,
    getMaterialsByTag,
    clearError,
    addToLibrary,
    removeFromLibrary,
    loadLibraryMaterials,
    addSearchResultsToDatabase,
    loadProjectMaterialsFromDatabase,
    loadAllMaterialsFromDatabase,
    deleteMaterialsFromDatabase,

    // Search-tools 相关方法
    checkSearchToolsStatus,
    updateSearchProgress,
    setSearchMode,
    clearCurrentSearchResults,
    clearSearchHistory,
    addToSearchHistory,

    // Agent 相关状态
    agentState,
    availableAgents,
    currentAgentSearchResults,
    agentLoading,
    agentError,
    currentAgentTask,
    agentTaskHistory,
    agentCapabilities,

    // Agent 相关方法
    fetchAvailableAgents,
    searchWithAgent,
    createAgentTask,
    getAgentTask,
    cancelAgentTask,
    getAgentTaskHistory,
    getAgentRecommendations,
    analyzeMaterial,
    getAgentCapabilities,
    updateAgentState,
    clearAgentError,
    clearAgentTaskHistory
  }
})
