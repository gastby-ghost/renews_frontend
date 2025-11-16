/**
 * 素材管理 Store
 *
 * 该 Store 负责管理应用中的所有素材相关状态和操作，包括：
 * - 素材的增删改查
 * - 素材搜索功能（普通搜索和Agent智能搜索）
 * - 素材库管理
 * - 搜索历史记录
 * - Agent任务管理
 *
 * 注意：此Store专注于核心业务逻辑和状态管理，UI相关状态由 useMaterialSearch composable 处理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { searchToolsService } from '@/services/ai/searchToolsService'
import { searchAgentService } from '@/services/ai/searchAgentService'
import { materialApiService, MaterialApiService } from '@/services/materialService'
import type {
  Material,
  SearchConfig,
  SearchProgress,
  MaterialLibraryState,
  AgentSearchConfig,
  AgentSearchResult,
  AgentState,
  PaginationState
} from '@/types/material'
import type { SearchToolsStatusResponse } from '@/types/ai'
import CryptoJS from 'crypto-js'
import { useUserStore } from '@/store/modules/user'
import { useProjectStore } from '@/store/modules/project'
import { AsyncTaskPoller, TaskStatus } from '@/utils/polling/asyncTaskPoller'

export const useMaterialStore = defineStore('material', () => {
  /**
   * 素材库主状态
   * 包含所有素材相关的核心状态数据
   */
  const state = ref<MaterialLibraryState>({
    materials: [], // 素材列表
    selectedMaterials: [], // 已选中的素材ID列表
    searchHistory: [], // 搜索历史记录
    providers: [
      // 搜索提供商配置
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
    loading: false, // 加载状态
    error: null // 错误信息
  })

  /**
   * Search-tools 相关状态
   * 管理搜索工具的状态和配置
   */
  const searchToolsStatus = ref<SearchToolsStatusResponse | null>(null) // 搜索工具状态
  const searchMode = ref<'simple' | 'agent'>('simple') // 搜索模式：简单搜索或Agent智能搜索
  const currentSearchResults = ref<Material[]>([]) // 当前搜索结果
  const searchProgress = ref<SearchProgress>({
    // 搜索进度状态
    stage: 'config',
    current: 0,
    total: 100,
    message: '准备搜索...'
  })

  /**
   * 分页状态
   * 管理搜索结果的分页信息
   */
  const paginationState = ref<PaginationState>({
    currentPage: 1, // 当前页码
    pageSize: 20, // 每页数量
    totalResults: 0, // 总结果数
    totalPages: 0 // 总页数
  })

  /**
   * Agent 相关状态
   * 管理Agent智能搜索的状态和任务
   */
  const agentState = ref<AgentState>({
    activeAgents: [], // 活跃的Agent列表
    currentTask: null, // 当前任务
    taskHistory: [], // 任务历史
    loading: false, // Agent加载状态
    error: null // Agent错误信息
  })

  const currentAgentSearchResults = ref<AgentSearchResult | null>(null) // 当前Agent搜索结果
  const researchPath = ref<string[]>([]) // 研究路径，记录Agent的搜索过程

  /**
   * 基础计算属性
   * 从主状态中派生的响应式数据
   */
  const materials = computed(() => state.value.materials) // 素材列表
  const selectedMaterials = computed(() => state.value.selectedMaterials) // 已选中的素材ID列表
  const searchHistory = computed(() => state.value.searchHistory) // 搜索历史
  const providers = computed(() => state.value.providers) // 搜索提供商
  const loading = computed(() => state.value.loading) // 加载状态
  const error = computed(() => state.value.error) // 错误信息

  /**
   * 已选中的素材完整对象列表
   * 根据选中的ID列表过滤出完整的素材对象
   */
  const selectedMaterialList = computed(() =>
    state.value.materials.filter((material) => state.value.selectedMaterials.includes(material.id))
  )

  /**
   * Agent 相关计算属性
   * 从Agent状态中派生的响应式数据
   */
  const agentLoading = computed(() => agentState.value.loading) // Agent加载状态
  const agentError = computed(() => agentState.value.error) // Agent错误信息
  const currentAgentTask = computed(() => agentState.value.currentTask) // 当前Agent任务
  const agentTaskHistory = computed(() => agentState.value.taskHistory) // Agent任务历史

  /**
   * 当前页显示的搜索结果
   * 根据分页状态计算当前应该显示的数据
   */
  const paginatedSearchResults = computed(() => {
    const startIndex = (paginationState.value.currentPage - 1) * paginationState.value.pageSize
    const endIndex = startIndex + paginationState.value.pageSize
    return currentSearchResults.value.slice(startIndex, endIndex)
  })

  /**
   * 添加单个素材到素材列表
   * @param material 要添加的素材对象
   */
  function addMaterial(material: Material) {
    state.value.materials.unshift(material)
  }

  /**
   * 批量添加素材到素材列表
   * @param materials 要添加的素材数组
   */
  function addMaterials(materials: Material[]) {
    state.value.materials.unshift(...materials)
  }

  /**
   * 从素材列表中移除指定素材
   * 同时从选中列表中移除该素材
   * @param id 要移除的素材ID
   */
  function removeMaterial(id: string) {
    const index = state.value.materials.findIndex((m) => m.id === id)
    if (index > -1) {
      state.value.materials.splice(index, 1)
    }
    state.value.selectedMaterials = state.value.selectedMaterials.filter(
      (selectedId) => selectedId !== id
    )
  }

  /**
   * 切换素材的选中状态
   * 如果素材已选中则取消选中，否则选中该素材
   * @param id 要切换选中状态的素材ID
   */
  function toggleMaterialSelection(id: string) {
    const index = state.value.selectedMaterials.indexOf(id)
    if (index > -1) {
      state.value.selectedMaterials.splice(index, 1)
    } else {
      state.value.selectedMaterials.push(id)
    }
  }

  /**
   * 清空所有选中的素材
   */
  function clearSelection() {
    state.value.selectedMaterials = []
  }

  /**
   * 选中所有素材
   */
  function selectAll() {
    state.value.selectedMaterials = state.value.materials.map((m) => m.id)
  }

  /**
   * 设置搜索进度
   * @param progress 搜索进度对象
   */
  function setSearchProgress(progress: SearchProgress) {
    searchProgress.value = progress
  }

  /**
   * 使用 search-tools API 搜索素材
   * @param config 搜索配置对象
   * @returns 搜索到的素材列表
   */
  async function searchWithSearchTools(config: SearchConfig) {
    state.value.loading = true
    state.value.error = null
    updateSearchProgress('config', 0, 100, '配置搜索参数...')

    try {
      // 添加到搜索历史
      addToSearchHistory(config)

      // 构建搜索参数
      const searchParams = {
        queries: [config.keywords],
        provider: config.providers[0] as 'tavily' | 'bocha',
        max_results: 20
      }

      updateSearchProgress('searching', 20, 100, '正在搜索素材...')

      // 调用搜索API
      const result = await searchToolsService.searchTools(searchParams)

      updateSearchProgress('processing', 80, 100, '处理搜索结果...')

      // 转换搜索结果
      const materials = transformSearchResultsToMaterials(result.results)

      // 更新当前搜索结果
      currentSearchResults.value = materials

      // 更新分页状态
      paginationState.value = {
        currentPage: 1,
        pageSize: paginationState.value.pageSize, // 使用当前页面大小而不是硬编码
        totalResults: result.total_results,
        totalPages: Math.ceil(result.total_results / paginationState.value.pageSize)
      }

      // 添加到素材库
      addMaterials(materials)

      updateSearchProgress('completed', 100, 100, '搜索完成')

      return materials
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '搜索失败'
      throw error
    } finally {
      state.value.loading = false
    }
  }

  /**
   * 检查搜索工具状态
   * 获取并缓存搜索工具的可用状态
   * @returns 搜索工具状态响应
   */
  async function checkSearchToolsStatus() {
    try {
      // 如果已经有状态数据且最近更新过，直接返回
      if (searchToolsStatus.value) {
        console.log('[material store] 使用已有的状态数据，跳过API调用')
        return searchToolsStatus.value
      }

      console.log('[material store] checkSearchToolsStatus: 开始检查搜索工具状态')
      console.log('[material store] 时间戳:', new Date().toISOString())
      const status = await searchToolsService.getSearchToolsStatus()
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

  /**
   * 更新搜索进度
   * @param stage 搜索阶段
   * @param current 当前进度
   * @param total 总进度
   * @param message 进度消息
   */
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

  /**
   * 设置搜索模式
   * @param mode 搜索模式：'simple' 或 'agent'
   */
  function setSearchMode(mode: 'simple' | 'agent') {
    searchMode.value = mode
  }

  /**
   * 清空当前搜索结果
   */
  function clearCurrentSearchResults() {
    currentSearchResults.value = []
  }

  /**
   * 清空搜索历史
   */
  function clearSearchHistory() {
    state.value.searchHistory = []
  }

  /**
   * 添加搜索历史记录
   * 只添加搜索历史，不执行搜索
   * @param config 搜索配置对象
   */
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

  /**
   * 使用Agent进行智能搜索
   * 通过AI Agent执行更智能的搜索，包括需求分析和结果处理
   * @param config Agent搜索配置
   * @returns Agent搜索结果
   */
  async function searchWithAgent(config: AgentSearchConfig) {
    try {
      agentState.value.loading = true
      agentState.value.error = null
      updateSearchProgress('config', 0, 100, '配置Agent搜索参数...')

      // 构建Agent搜索请求
      const requestData = {
        brief: config.keywords,
        max_concurrent_research_units: config.agentConfig?.maxConcurrentResearchUnits,
        max_researcher_iterations: config.agentConfig?.maxResearcherIterations
      }

      updateSearchProgress('searching', 20, 100, 'Agent正在分析需求...')

      // 执行Agent搜索
      const executeResponse = await searchAgentService.executeSearchAgent(
        getCurrentUserId(),
        getCurrentProjectId(),
        requestData
      )

      if (!executeResponse.success) {
        throw new Error(executeResponse.message || 'Agent执行失败')
      }

      updateSearchProgress('processing', 40, 100, 'Agent正在处理搜索结果...')

      // 轮询任务状态
      const result = await pollAgentStatus(executeResponse.task_id)

      if (result) {
        // 处理成功结果
        await processAgentResult(result)
        updateSearchProgress('completed', 100, 100, 'Agent搜索完成')
        return currentAgentSearchResults.value
      } else {
        throw new Error('Agent任务执行失败')
      }
    } catch (error) {
      agentState.value.error = error instanceof Error ? error.message : 'Agent搜索失败'
      throw error
    } finally {
      agentState.value.loading = false
    }
  }

  /**
   * 取消Agent任务
   * 取消正在执行的Agent任务
   * @param taskId 要取消的任务ID
   */
  async function cancelAgentTask(taskId: string) {
    try {
      // 使用 searchAgentService 替代 agentService，因为 agentService 未定义
      await searchAgentService.cancelSearchAgentTask(
        taskId,
        getCurrentUserId(),
        getCurrentProjectId()
      )

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

  /**
   * 获取Agent任务历史
   * 获取所有Agent任务的历史记录
   * @returns 任务历史列表
   */
  async function getAgentTaskHistory() {
    try {
      // 使用 searchAgentService 替代 agentService，因为 agentService 未定义
      const history = await searchAgentService.getSearchAgentTasks(
        getCurrentUserId(),
        getCurrentProjectId()
      )

      // 转换 SearchAgentListResponse 到 AgentTask 类型
      const convertedTasks = (history.tasks || []).map((task) => ({
        id: task.task_id,
        type: 'search' as const,
        status: task.status as 'pending' | 'running' | 'completed' | 'failed',
        progress: task.progress || 0,
        message: task.status === 'completed' ? '任务完成' : '任务进行中',
        config: {
          keywords: task.brief || '',
          providers: ['tavily'],
          searchScope: '',
          agentType: 'search' as const,
          filters: { tags: [] }
        },
        result:
          task.status === 'completed'
            ? {
                materials: [],
                total: 0,
                page: 1,
                pageSize: 20
              }
            : undefined,
        error: undefined,
        createdAt: new Date(task.created_at), // 直接使用ISO日期字符串
        updatedAt: new Date(task.updated_at)
      }))

      agentState.value.taskHistory = convertedTasks
      return convertedTasks
    } catch (error) {
      agentState.value.error = error instanceof Error ? error.message : '获取Agent任务历史失败'
      throw error
    }
  }

  /**
   * 更新Agent状态
   * 批量更新Agent状态对象
   * @param updates 要更新的状态部分
   */
  function updateAgentState(updates: Partial<AgentState>) {
    Object.assign(agentState.value, updates)
  }

  /**
   * 清空Agent错误信息
   */
  function clearAgentError() {
    agentState.value.error = null
  }

  /**
   * 清空Agent任务历史
   */
  function clearAgentTaskHistory() {
    agentState.value.taskHistory = []
  }

  /**
   * 更新素材信息
   * @param updates 包含ID和要更新字段的素材对象
   */
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

  /**
   * 根据类型获取素材
   * 注意：Material 类型中没有 type 属性，这里使用 tags 来模拟类型过滤
   * @param type 素材类型（实际上是标签）
   * @returns 匹配的素材列表
   */
  function getMaterialsByType(type: string) {
    // Material 类型中没有 type 属性，这里使用 tags 来模拟类型过滤
    return state.value.materials.filter((m) => m.tags.includes(type))
  }

  /**
   * 根据标签获取素材
   * @param tag 标签名称
   * @returns 包含指定标签的素材列表
   */
  function getMaterialsByTag(tag: string) {
    return state.value.materials.filter((m) => m.tags.includes(tag))
  }

  /**
   * 清空错误信息
   */
  function clearError() {
    state.value.error = null
  }

  /**
   * 将素材添加到素材库
   * @param materialIds 要添加的素材ID列表
   */
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

      // 防御性检查：确保 response 和 materials 字段存在
      if (!response) {
        throw new Error('API 返回数据为空')
      }

      if (!response.materials || !Array.isArray(response.materials)) {
        throw new Error('API 返回数据格式错误：缺少 materials 字段或不是数组')
      }

      // 将API返回的素材转换为前端格式
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

      // 防御性检查：确保 response 和 materials 字段存在
      if (!response) {
        throw new Error('API 返回数据为空')
      }

      if (!response.materials || !Array.isArray(response.materials)) {
        throw new Error('API 返回数据格式错误：缺少 materials 字段或不是数组')
      }

      // 将API返回的素材转换为前端格式
      const materials = response.materials.map((apiMaterial) =>
        MaterialApiService.convertApiMaterialToMaterial(apiMaterial)
      )

      // 更新本地状态
      state.value.materials = materials

      return {
        materials,
        totalCount: response.total_count,
        page: response.page || params?.page || 1,
        pageSize: response.page_size || params?.page_size || 20,
        totalPages: response.total_pages
      }
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '从数据库加载素材失败'
      console.error('加载项目素材失败:', error)
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

      // 防御性检查：确保 response 和 materials 字段存在
      if (!response) {
        throw new Error('API 返回数据为空')
      }

      if (!response.materials || !Array.isArray(response.materials)) {
        throw new Error('API 返回数据格式错误：缺少 materials 字段或不是数组')
      }

      // 将API返回的素材转换为前端格式
      const materials = response.materials.map((apiMaterial) =>
        MaterialApiService.convertApiMaterialToMaterial(apiMaterial)
      )

      // 更新本地状态
      state.value.materials = materials

      return {
        materials,
        totalCount: response.total_count,
        page: response.page || params?.page || 1,
        pageSize: response.page_size || params?.page_size || 20,
        totalPages: response.total_pages
      }
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '从数据库加载素材失败'
      console.error('加载素材失败:', error)
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

  /**
   * 从素材库移除素材
   * @param materialIds 要移除的素材ID列表
   */
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

  /**
   * 加载素材库中的素材
   * @param params 查询参数，包括类型、来源、标签、搜索关键词和分页信息
   * @returns 加载的素材列表
   */
  async function loadLibraryMaterials(params?: {
    type?: string
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
      // 将API返回的素材转换为前端格式
      const materials = result.materials.map((apiMaterial) =>
        MaterialApiService.convertApiMaterialToMaterial(apiMaterial)
      )
      state.value.materials = materials
      return materials
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

    // Agent 相关状态
    agentState,
    currentAgentSearchResults,
    agentLoading,
    agentError,
    currentAgentTask,
    agentTaskHistory,

    // Agent 相关方法
    searchWithAgent,
    cancelAgentTask,
    getAgentTaskHistory,
    updateAgentState,
    clearAgentError,
    clearAgentTaskHistory,

    // 新增的分页状态
    paginationState,
    paginatedSearchResults,

    // 新增的研究路径状态
    researchPath,

    // 数据转换方法
    transformSearchResultsToMaterials,

    // Agent搜索辅助方法
    pollAgentStatus,
    processAgentResult,
    getCurrentUserId,
    getCurrentProjectId
  }

  // ========== 辅助函数 ==========

  /**
   * 转换搜索结果为Material格式
   * 将API返回的搜索结果转换为前端使用的Material对象格式
   * @param results API返回的搜索结果数组
   * @returns 转换后的Material对象数组
   */
  function transformSearchResultsToMaterials(results: any[]): Material[] {
    const currentUserId = getCurrentUserId()

    // 添加调试日志：检查输入数据
    console.log('[transformSearchResultsToMaterials] 输入数据检查:', {
      resultsType: typeof results,
      resultsIsArray: Array.isArray(results),
      resultsLength: results?.length,
      firstItemType: results?.[0] ? typeof results[0] : 'undefined',
      firstItemValue: results?.[0],
      fullResults: results
    })

    // 预处理结果：如果元素是字符串，尝试解析为JSON对象
    const processedResults = results.map((item, index) => {
      // 如果item是字符串，尝试解析为JSON
      if (typeof item === 'string') {
        try {
          // console.log(`[transformSearchResultsToMaterials] 解析第${index}个JSON字符串:`, item)
          const parsedItem = JSON.parse(item)
          // console.log(`[transformSearchResultsToMaterials] 解析成功:`, parsedItem)
          return parsedItem
        } catch (error) {
          console.error(`[transformSearchResultsToMaterials] 解析第${index}个JSON字符串失败:`, {
            error,
            stringValue: item
          })
          // 解析失败时返回空对象
          return {}
        }
      }
      // 如果item已经是对象，直接返回
      return item
    })

    return processedResults.map((item, index) => {
      // 添加调试日志：检查每个item的类型
      if (typeof item !== 'object' || item === null) {
        console.error(`[transformSearchResultsToMaterials] 第${index}个元素不是对象类型:`, {
          itemType: typeof item,
          itemValue: item,
          itemIsNull: item === null,
          itemIsUndefined: item === undefined
        })
      }

      // 安全地访问属性，即使item不是对象也不会报错
      const safeItem = typeof item === 'object' && item !== null ? item : {}

      return {
        id: safeItem.url
          ? CryptoJS.MD5(safeItem.url).toString()
          : `fallback-${Date.now()}-${index}`, // 使用URL的MD5值作为唯一ID，如果没有URL则使用fallback ID
        user_id: currentUserId, // 当前用户ID
        title: safeItem.aititle || safeItem.webtitle || '未命名素材', // 优先使用AI生成的标题，其次是网页标题
        summary:
          safeItem.summary ||
          (safeItem.key_excerpts && Array.isArray(safeItem.key_excerpts)
            ? safeItem.key_excerpts.join(' ')
            : '') ||
          '无可用摘要', // 摘要信息
        score: typeof safeItem.score === 'number' ? safeItem.score : 0, // 相关性评分
        key_excerpts:
          safeItem.key_excerpts && Array.isArray(safeItem.key_excerpts)
            ? safeItem.key_excerpts
            : [], // 关键摘录
        tags: safeItem.tags && Array.isArray(safeItem.tags) ? safeItem.tags : [], // 标签
        url: safeItem.url || '', // 原始URL
        createdAt: safeItem.published_date ? new Date(safeItem.published_date) : new Date(), // 创建时间
        selected: false // 默认未选中
      }
    })
  }

  /**
   * 轮询Agent任务状态
   * 使用新的轮询系统定期查询Agent任务的执行状态
   * @param taskId 任务ID
   * @returns 任务结果
   */
  async function pollAgentStatus(taskId: string): Promise<any> {
    const poller = new AsyncTaskPoller(
      () =>
        searchAgentService
          .getSearchAgentStatus(taskId, getCurrentUserId(), getCurrentProjectId())
          .then((response) => {
            const status = (response as any).status || TaskStatus.RUNNING
            const progress = (response as any).progress || 0

            // 更新进度
            const currentProgress = 40 + progress * 0.6
            updateSearchProgress('processing', currentProgress, 100, getAgentStatusMessage(status))

            return {
              status:
                status === 'SUCCESS'
                  ? TaskStatus.COMPLETED
                  : status === 'FAILURE'
                    ? TaskStatus.FAILED
                    : status === 'REVOKED'
                      ? TaskStatus.CANCELLED
                      : TaskStatus.RUNNING,
              data: (response as any).result || response,
              isCompleted: status === 'SUCCESS' || status === 'FAILURE' || status === 'REVOKED'
            }
          }),
      {
        interval: 2000,
        timeout: 120000,
        maxAttempts: 60,
        onStatusUpdate: (status) => {
          console.log('Agent轮询状态:', status)
        },
        onProgress: (attempts, max) => {
          const progress = 40 + (attempts / max) * 60
          updateSearchProgress('processing', progress, 100, `Agent执行中... (${attempts}/${max})`)
        }
      }
    )

    const task = await poller.start(`material-agent-${taskId}`)

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (task.isCompleted) {
          clearInterval(checkInterval)
          if (task.result.status === TaskStatus.COMPLETED) {
            resolve(task.result.data)
          } else {
            reject(new Error(task.result.error || 'Agent任务执行失败'))
          }
        }
      }, 100)
    })
  }

  /**
   * 处理Agent搜索结果
   * 将Agent返回的结果转换为前端可用的格式，并更新相关状态
   * @param result Agent搜索结果
   */
  async function processAgentResult(result: any) {
    // 显示研究路径
    if (result.research_path && result.research_path.length > 0) {
      researchPath.value = result.research_path
    }

    // 转换web_search_data为素材格式
    if (result.web_search_data && result.web_search_data.length > 0) {
      const materials = transformSearchResultsToMaterials(result.web_search_data)

      // 更新当前搜索结果
      currentSearchResults.value = materials

      // 更新分页状态
      paginationState.value = {
        currentPage: 1,
        pageSize: paginationState.value.pageSize, // 使用当前页面大小而不是硬编码
        totalResults: materials.length,
        totalPages: Math.ceil(materials.length / paginationState.value.pageSize)
      }

      // 添加到素材库
      addMaterials(materials)

      // 保存Agent搜索结果
      currentAgentSearchResults.value = {
        materials,
        total: materials.length,
        page: 1,
        pageSize: 20,
        agentInsights: result.agent_insights,
        recommendations: result.recommendations || [],
        relatedQueries: result.related_queries || [],
        processingTime: result.processing_time
      }
    } else {
      currentSearchResults.value = []
      paginationState.value.totalResults = 0
      currentAgentSearchResults.value = {
        materials: [],
        total: 0,
        page: 1,
        pageSize: 20
      }
    }
  }

  /**
   * 获取Agent状态对应的中文消息
   * @param status Agent状态码或TaskStatus枚举
   * @returns 状态对应的中文消息
   */
  function getAgentStatusMessage(status: string | TaskStatus): string {
    const statusMap = {
      PENDING: '任务等待中...',
      RUNNING: 'Agent正在执行...',
      STARTED: 'Agent正在执行...',
      SUCCESS: '任务完成',
      COMPLETED: '任务完成',
      FAILURE: '任务失败',
      FAILED: '任务失败',
      REVOKED: '任务已取消',
      CANCELLED: '任务已取消',
      TIMEOUT: '任务超时'
    }
    return statusMap[status as keyof typeof statusMap] || String(status)
  }

  /**
   * 获取当前用户ID
   * 从用户store中获取当前登录用户的ID，如果获取失败则返回默认值
   * @returns 当前用户ID字符串
   */
  function getCurrentUserId(): string {
    // 这里应该从用户store获取，暂时返回默认值
    try {
      const userStore = useUserStore()
      return userStore.info?.id || 'current-user'
    } catch {
      return 'current-user'
    }
  }

  /**
   * 获取当前项目ID
   * 从项目store中获取当前项目的ID，如果获取失败则返回默认值
   * @returns 当前项目ID字符串
   */
  function getCurrentProjectId(): string {
    // 这里应该从项目store获取，暂时返回默认值
    try {
      const projectStore = useProjectStore()
      return projectStore.currentProject?.id?.toString() || 'current-project'
    } catch {
      return 'current-project'
    }
  }
})
