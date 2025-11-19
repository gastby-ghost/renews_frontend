/**
 * 文档生成状态管理
 *
 * 核心职责：
 * 1. 统一管理文档生成工作流状态
 * 2. 统一管理异步任务（Scope Agent、Title、Outline）
 * 3. 提供完整的文档生成数据模型
 *
 * 注意：项目相关状态由 projectStore 管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { documentGenerateService } from '@/services/documentGenerateService'
import { AsyncTaskPoller, TaskStatus } from '@/utils/polling/asyncTaskPoller'
import { normalizeSearchData } from '@/utils/dataprocess/array'
import { useOutlineEditorStore } from './outlineEditor'
import type {
  TitleGenerationResponse,
  OutlineGenerationResponse,
  OutlineWithMaterialRequest,
  OutlineWithMaterialResponse,
  MaterialBindRequest,
  MaterialBindResponse
} from '@/types/ai'
import type { ScopeDefinitionResponse } from '@/types/ai/scope-agent'
// 从 Api.Ai 命名空间导入类型
import type { Api } from '@/types/api.d'

type Title = Api.Ai.Title
type SearchResultItem = Api.Ai.SearchResultItem
type OutlineSection = Api.Ai.OutlineSection

/**
 * 异步任务状态
 */
export interface DocumentTask {
  taskId: string
  type: 'scope' | 'title' | 'outline' | 'search2title'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  result?: any
  error?: string
  createdAt: number
  updatedAt: number
}

/**
 * 文档生成状态模型
 * 不包含项目信息，项目状态由 projectStore 管理
 */
export interface DocumentState {
  // 当前研究简报
  researchBrief: string

  // 通用搜索数据（用于其他功能）
  searchResults: SearchResultItem[]

  // 标题生成专用搜索结果（仅用于标题选择阶段）
  titleSearchResults: SearchResultItem[]

  // 生成的内容
  generatedTitles: Title[]
  selectedTitle: Title | null
  generatedOutline: OutlineSection[]

  // 当前工作流步骤
  currentStep: 'requirements' | 'title' | 'outline' | 'content' | 'complete'

  // 任务状态
  scopeTask: DocumentTask | null
  titleTask: DocumentTask | null
  outlineTask: DocumentTask | null
  search2titleTask: DocumentTask | null

  // 统计信息
  generationStats: {
    titleCount: number
    outlineSectionCount: number
    totalWordEstimate: number
  }

  // 时间戳
  createdAt: number
  updatedAt: number
}

/**
 * 异步任务轮询管理器 - 使用新的轮询系统
 */
class TaskPollingManager {
  private pollingTasks = new Map<string, AsyncTaskPoller>()
  public store: any

  constructor(store: any) {
    this.store = store
  }

  /**
   * 开始轮询任务状态
   */
  async startPolling(
    taskId: string,
    type: string,
    userId?: string,
    projectId?: string,
    interval: number = 3000
  ) {
    // 清除之前的轮询
    this.stopPolling(taskId)

    const statusChecker = async () => {
      if (type === 'scope') {
        const status = await this.store.getScopeTaskStatus(taskId)
        if (!status) {
          return {
            status: TaskStatus.FAILED,
            data: null,
            isCompleted: true,
            error: '获取任务状态失败'
          }
        }
        const taskStatus = this.mapToTaskStatus(status.status)
        return {
          status: taskStatus,
          data: status,
          isCompleted: taskStatus === TaskStatus.COMPLETED || taskStatus === TaskStatus.FAILED
        }
      } else if (type === 'search2title') {
        const status = await this.store.getSearch2TitleTaskStatus(taskId, userId, projectId)
        if (!status) {
          return {
            status: TaskStatus.FAILED,
            data: null,
            isCompleted: true,
            error: '获取任务状态失败'
          }
        }
        const taskStatus = this.mapToTaskStatus(status.status)

        // 任务完成时，更新Store中的数据和UI状态
        if (taskStatus === TaskStatus.COMPLETED && status.result) {
          // 更新标题专用搜索结果（使用normalizeSearchData确保数据格式正确）
          if (status.result?.research_data?.web_search_data) {
            const normalizedResults = normalizeSearchData<SearchResultItem>(
              status.result.research_data.web_search_data
            )
            this.store.updateTitleSearchResults?.(normalizedResults)
          }
          // 更新生成的标题
          if (status.result?.title_data?.titles) {
            this.store.updateDocumentState?.({
              generatedTitles: status.result.title_data.titles
            })
          }
        }

        return {
          status: taskStatus,
          data: status,
          isCompleted: taskStatus === TaskStatus.COMPLETED || taskStatus === TaskStatus.FAILED
        }
      }
      return {
        status: TaskStatus.RUNNING,
        data: null,
        isCompleted: false
      }
    }

    const poller = new AsyncTaskPoller(statusChecker, {
      interval,
      timeout: 120000,
      maxAttempts: 40,
      onStatusUpdate: (status: TaskStatus) => {
        // 任务完成时停止loading状态
        if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
          this.store.setLoading?.(false)

          // 任务成功时显示成功消息
          if (status === TaskStatus.COMPLETED) {
            // 可以通过ElNotification或事件总线发送通知
            // console.log('Search2Title任务执行完成')
          }
        }
      }
    })

    const task = await poller.start(`document-${type}-${taskId}`)
    this.pollingTasks.set(taskId, poller)

    return task
  }

  /**
   * 停止轮询任务状态
   */
  stopPolling(taskId: string) {
    const poller = this.pollingTasks.get(taskId)
    if (poller) {
      poller.stop()
      this.pollingTasks.delete(taskId)
    }
  }

  /**
   * 清除所有轮询
   */
  clearAll() {
    this.pollingTasks.forEach((poller) => poller.stop())
    this.pollingTasks.clear()
  }

  /**
   * 映射状态到TaskStatus枚举
   */
  private mapToTaskStatus(status: string): TaskStatus {
    const statusMap: Record<string, TaskStatus> = {
      pending: TaskStatus.PENDING,
      running: TaskStatus.RUNNING,
      completed: TaskStatus.COMPLETED,
      success: TaskStatus.COMPLETED,
      failed: TaskStatus.FAILED,
      failure: TaskStatus.FAILED,
      cancelled: TaskStatus.CANCELLED,
      revoked: TaskStatus.CANCELLED
    }
    return statusMap[status?.toLowerCase?.() || ''] || TaskStatus.RUNNING
  }
}

/**
 * 文档生成状态管理
 *
 * 核心状态：
 * - documentState: 当前文档生成状态
 * - loading/error: 全局加载和错误状态
 * - activeTasks: 活动任务列表
 */
export const useDocumentGenerateStore = defineStore('documentGenerateStore', () => {
  // 当前文档生成状态
  const documentState = ref<DocumentState>({
    researchBrief: '',
    searchResults: [],
    titleSearchResults: [],
    generatedTitles: [],
    selectedTitle: null,
    generatedOutline: [],
    currentStep: 'requirements',
    scopeTask: null,
    titleTask: null,
    outlineTask: null,
    search2titleTask: null,
    generationStats: {
      titleCount: 0,
      outlineSectionCount: 0,
      totalWordEstimate: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  // 全局加载状态
  const loading = ref(false)

  // 全局错误信息
  const error = ref<string | null>(null)

  // 活动任务列表
  const activeTasks = ref<DocumentTask[]>([])

  // 计算属性：是否有活动任务
  const hasActiveTasks = computed(() => activeTasks.value.length > 0)

  // 计算属性：当前工作流进度
  const workflowProgress = computed(() => {
    const steps = ['requirements', 'title', 'outline', 'content', 'complete']
    const currentStepIndex = steps.indexOf(documentState.value.currentStep)
    return (currentStepIndex / (steps.length - 1)) * 100
  })

  // 计算属性：当前工作流状态统计
  const workflowStats = computed(() => {
    const state = documentState.value
    return {
      hasResearchBrief: state.researchBrief.length > 10,
      hasTitleSearchResults: state.titleSearchResults.length > 0,
      hasGeneratedTitles: state.generatedTitles.length > 0,
      hasSelectedTitle: state.selectedTitle !== null,
      hasGeneratedOutline: state.generatedOutline.length > 0,
      titleCount: state.generatedTitles.length,
      outlineSectionCount: state.generatedOutline.length,
      totalWordEstimate: state.generationStats.totalWordEstimate
    }
  })

  // 计算属性：任务状态统计
  const taskStatistics = computed(() => {
    const stats = {
      total: activeTasks.value.length,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0
    }

    activeTasks.value.forEach((task) => {
      stats[task.status]++
    })

    return stats
  })

  // 异步任务轮询管理器 - 延迟初始化以避免循环依赖
  let taskPollingManager: TaskPollingManager | null = null

  /**
   * 获取任务轮询管理器实例
   */
  const getTaskPollingManager = (): TaskPollingManager => {
    if (!taskPollingManager) {
      taskPollingManager = new TaskPollingManager({
        // 修复：添加async/await确保Promise被正确等待
        getScopeTaskStatus: async (taskId: string) => await getScopeTaskStatus(taskId),
        getSearch2TitleTaskStatus: async (taskId: string, userId?: string, projectId?: string) => {
          if (!userId || !projectId) {
            console.error('getSearch2TitleTaskStatus 缺少必要参数: userId 或 projectId')
            return null
          }
          // 修复：添加async/await确保Promise被正确等待
          return await getSearch2TitleTaskStatus(taskId, userId, projectId)
        },
        // 添加缺失的方法
        updateTitleSearchResults: (results: SearchResultItem[]) => {
          updateDocumentState({ titleSearchResults: results })
        },
        updateDocumentState: (updates: Partial<DocumentState>) => {
          updateDocumentState(updates)
        },
        // 添加设置loading状态的方法
        setLoading: (value: boolean) => {
          loading.value = value
        },
        // 获取loading状态
        getLoading: () => loading.value
      })
    }
    return taskPollingManager
  }

  /**
   * 重置文档生成状态
   * @param projectId - 可选的项目ID，如果提供则重置该项目的状态
   * @param clearStorage - 是否同时清理存储（默认true）
   */
  const resetDocumentState = (projectId?: string | number, clearStorage: boolean = true) => {
    console.log(`\n=== [DEBUG] resetDocumentState 被调用 ===`)
    console.log(`[DEBUG] 参数: projectId=${projectId}, clearStorage=${clearStorage}`)
    console.log(`[DEBUG] 调用堆栈:`, new Error().stack?.split('\n').slice(0, 5).join('\n'))
    // 如果提供了项目ID且需要清理，则清理该项目的特定存储
    if (projectId && clearStorage) {
      console.log(`[DEBUG] resetDocumentState: 准备清理项目 ${projectId} 的持久化状态`)
      clearProjectStorage(String(projectId))
    } else if (projectId && !clearStorage) {
      console.log(`[DEBUG] resetDocumentState: 保留项目 ${projectId} 的持久化状态，只重置内存状态`)
    } else {
      console.log(`[DEBUG] resetDocumentState: 无项目ID，仅重置内存状态`)
    }

    // 重置内存中的状态
    documentState.value = {
      researchBrief: '',
      searchResults: [],
      titleSearchResults: [],
      generatedTitles: [],
      selectedTitle: null,
      generatedOutline: [],
      currentStep: 'requirements',
      scopeTask: null,
      titleTask: null,
      outlineTask: null,
      search2titleTask: null,
      generationStats: {
        titleCount: 0,
        outlineSectionCount: 0,
        totalWordEstimate: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    activeTasks.value = []
    getTaskPollingManager().clearAll()
  }

  /**
   * 为指定项目重置状态
   * @param projectId - 项目ID
   * @param forceReset - 是否强制重置（默认false，会先尝试恢复）
   */
  const resetStateForProject = (projectId: string | number, forceReset: boolean = false) => {
    console.log(`[DEBUG] resetStateForProject: ${projectId}, forceReset: ${forceReset}`)

    // 设置当前项目ID
    setCurrentProject(String(projectId))

    // 如果强制重置，则清理状态
    if (forceReset) {
      console.log(`[DEBUG] 强制重置项目 ${projectId} 的状态`)
      resetDocumentState(projectId, true)
      return
    }

    // 尝试从存储加载状态
    const hasSavedState = loadFromProjectStorage(String(projectId))
    console.log(`[DEBUG] 尝试恢复项目 ${projectId} 状态:`, hasSavedState ? '成功' : '无数据')

    if (hasSavedState) {
      console.log(`[DEBUG] 项目 ${projectId} 状态已恢复`)
    } else {
      console.log(`[DEBUG] 项目 ${projectId} 无保存状态，重置为空状态（保留存储）`)
      // 只重置内存状态，保留存储（以便恢复表单状态等）
      resetDocumentState(projectId, false)
    }
  }

  /**
   * 更新文档状态
   * @param updates 要更新的状态
   * @param projectId 可选的项目ID，用于保存状态
   */
  const updateDocumentState = (updates: Partial<DocumentState>, projectId?: string) => {
    console.log(`\n🔄 [UPDATE] updateDocumentState 被调用`)
    console.log(`[UPDATE] 参数 updates:`, updates)
    console.log(`[UPDATE] 参数 projectId:`, projectId)
    console.log(`[UPDATE] 当前 currentProjectId:`, currentProjectId.value)

    // 确保 titleSearchResults 始终是数组
    if (updates.titleSearchResults !== undefined) {
      updates.titleSearchResults = Array.isArray(updates.titleSearchResults)
        ? updates.titleSearchResults
        : []
    }

    // 确保 generatedOutline 始终是数组
    if (updates.generatedOutline !== undefined) {
      console.log('🔧 [UPDATE] 检查 generatedOutline:', {
        value: updates.generatedOutline,
        type: typeof updates.generatedOutline,
        isArray: Array.isArray(updates.generatedOutline),
        length: updates.generatedOutline?.length
      })
      updates.generatedOutline = Array.isArray(updates.generatedOutline)
        ? updates.generatedOutline
        : []
      console.log('🔧 [UPDATE] 修正后的 generatedOutline:', updates.generatedOutline)
    }

    const oldResearchBrief = documentState.value.researchBrief
    Object.assign(documentState.value, {
      ...updates,
      updatedAt: Date.now()
    })

    // 特别关注 researchBrief 的更新
    if (updates.researchBrief !== undefined) {
      console.log(`[UPDATE] researchBrief 更新:`)
      console.log(`  - old value:`, oldResearchBrief?.substring(0, 50) || '(空)')
      console.log(`  - new value:`, updates.researchBrief?.substring(0, 50) || '(空)')
      console.log(`  - new value type:`, typeof updates.researchBrief)
      console.log(`  - new value length:`, updates.researchBrief?.length || 'N/A')
    }

    // 自动保存到项目级存储
    const pid = projectId || currentProjectId.value
    if (pid) {
      console.log(`[UPDATE] 开始保存状态到项目 ${pid}...`)
      saveToProjectStorage(pid)
      console.log(`[UPDATE] 保存完成\n`)
    } else {
      console.log('[UPDATE] ⚠️ 无项目ID，暂不保存\n')
    }
  }

  /**
   * 执行Scope Agent任务
   */
  const executeScopeAgent = async (
    userId: string,
    projectId: string,
    query: string
  ): Promise<ScopeDefinitionResponse | null> => {
    try {
      loading.value = true
      error.value = null

      const response: ScopeDefinitionResponse = (await documentGenerateService.executeScopeAgent(
        userId,
        projectId,
        { query }
      )) as any

      // 创建任务记录
      const task: DocumentTask = {
        taskId: response.task_id,
        type: 'scope',
        status: 'pending',
        progress: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      documentState.value.scopeTask = task
      activeTasks.value.push(task)

      // 开始轮询任务状态
      getTaskPollingManager().startPolling(response.task_id, 'scope')

      return response
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Scope分析任务启动失败'
      error.value = errorMessage
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 生成标题
   */
  const generateTitles = async (
    researchBrief: string,
    webSearchData: SearchResultItem[]
  ): Promise<TitleGenerationResponse | null> => {
    if (!researchBrief || webSearchData.length === 0) {
      error.value = '研究简报或搜索数据不完整'
      return null
    }

    try {
      loading.value = true
      error.value = null

      const response: TitleGenerationResponse = (await documentGenerateService.generateTitles({
        research_brief: researchBrief,
        web_search_data: webSearchData
      })) as any

      // 更新文档状态
      updateDocumentState({
        generatedTitles: response.titles,
        generationStats: {
          ...documentState.value.generationStats,
          titleCount: response.title_count
        }
      })

      // 创建任务记录
      const task: DocumentTask = {
        taskId: `title-${Date.now()}`,
        type: 'title',
        status: 'completed',
        progress: 100,
        result: response,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      documentState.value.titleTask = task
      activeTasks.value.push(task)

      return response
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : '标题生成失败'
      error.value = errorMessage

      // 创建失败任务记录
      const task: DocumentTask = {
        taskId: `title-${Date.now()}`,
        type: 'title',
        status: 'failed',
        progress: 0,
        error: errorMessage,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      documentState.value.titleTask = task
      activeTasks.value.push(task)

      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 生成大纲
   */
  const generateOutline = async (
    title: Title,
    researchBrief: string,
    webSearchData: SearchResultItem[]
  ): Promise<OutlineGenerationResponse | null> => {
    console.log('🎯 [generateOutline] 开始执行')
    if (!title) {
      error.value = '未选择标题'
      return null
    }

    // 允许没有素材的情况，但给出警告
    if (webSearchData.length === 0) {
      console.warn('⚠️ [generateOutline] 没有提供素材数据，将基于标题和研究简报生成大纲')
    }

    try {
      loading.value = true
      error.value = null

      console.log('📋 [generateOutline] 请求参数:', {
        title: title.title,
        researchBrief: researchBrief.substring(0, 100) + '...',
        webSearchDataLength: webSearchData.length
      })

      const response: OutlineGenerationResponse = (await documentGenerateService.generateOutline({
        title,
        research_brief: researchBrief,
        web_search_data: webSearchData
      })) as any

      console.log('✅ [generateOutline] API响应:', response)
      console.log('✅ [generateOutline] 响应数据类型:', typeof response)
      console.log('✅ [generateOutline] 响应数据键值:', Object.keys(response))
      console.log('✅ [generateOutline] response.outline:', response.outline)
      console.log('✅ [generateOutline] response.outline 类型:', typeof response.outline)
      console.log('✅ [generateOutline] response.data:', response.data)

      // 检查响应数据结构 - 根据OutlineGenerationResponse类型定义
      let outlineData = response.result?.sections
      console.log('🔍 [generateOutline] 初始 outlineData:', outlineData)
      console.log('🔍 [generateOutline] outlineData 类型:', typeof outlineData)
      console.log('🔍 [generateOutline] outlineData 是数组吗:', Array.isArray(outlineData))

      if (response.result && response.result.sections) {
        console.log(
          '📝 [generateOutline] 使用 response.result.sections，章节数量:',
          response.result.sections.length
        )
        outlineData = response.result.sections
        console.log('✅ [generateOutline] 设置后的 outlineData:', outlineData)
        console.log('✅ [generateOutline] 设置后的 outlineData 长度:', outlineData?.length)
      } else {
        console.warn('⚠️ [generateOutline] 未找到大纲数据在响应中，检查所有可能的响应结构')
        console.log('🔍 [generateOutline] 完整响应结构:', JSON.stringify(response, null, 2))

        // 尝试从旧的响应结构中获取数据（兼容性处理）
        if (response.data && Array.isArray(response.data.outline)) {
          console.log('📝 [generateOutline] 使用旧的 response.data.outline 结构')
          outlineData = response.data.outline
        } else if (Array.isArray(response.outline)) {
          console.log('📝 [generateOutline] 使用旧的 response.outline 结构')
          outlineData = response.outline
        } else {
          console.log('📝 [generateOutline] 设置为空数组')
          outlineData = []
        }
      }

      // 更新文档状态
      updateDocumentState({
        generatedOutline: outlineData,
        generationStats: {
          ...documentState.value.generationStats,
          outlineSectionCount:
            response.result?.total_sections ||
            (outlineData as any).length ||
            response.section_count ||
            response.data?.total_count ||
            0,
          totalWordEstimate:
            response.result?.estimated_word_count ||
            response.total_word_estimate ||
            response.data?.total_word_estimate ||
            0
        }
      })

      // 同时更新 outlineEditorStore
      const outlineEditorStore = useOutlineEditorStore()
      console.log('🔍 [generateOutline] outlineEditorStore 更新前检查:')
      console.log('  - outlineData 存在:', !!outlineData)
      console.log('  - outlineData 类型:', typeof outlineData)
      console.log('  - outlineData 是数组:', Array.isArray(outlineData))
      console.log('  - outlineData 长度:', outlineData?.length)
      console.log('  - outlineData 内容预览:', outlineData?.slice?.(0, 2))

      if (outlineData && Array.isArray(outlineData) && outlineData.length > 0) {
        console.log('📝 [generateOutline] 转换大纲章节:', outlineData.length, '个章节')
        console.log('📝 [generateOutline] 第一个章节数据:', outlineData[0])

        const outlineSections = outlineData.map((section: any, index: number) => {
          console.log(`📝 [generateOutline] 处理第 ${index + 1} 个章节:`, section)
          return {
            id: parseInt(section.id) || index + 1,
            title: section.title || `章节 ${index + 1}`,
            content_direction: section.content_direction || section.content_summary || '',
            order_index: index,
            outline_id: 0, // 需要从当前项目获取
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            level: section.level || 1,
            parent_section_id:
              section.parent_section_id || section.parent_id
                ? parseInt(section.parent_section_id || section.parent_id)
                : undefined,
            word_count_target: section.word_count_target || section.estimated_word_count || 500,
            estimated_reading_time: section.estimated_word_count
              ? Math.ceil(section.estimated_word_count / 200)
              : undefined
          }
        })

        console.log('📝 [generateOutline] 转换后章节数据预览:', outlineSections.slice(0, 2))
        // 更新到 outlineEditorStore
        outlineEditorStore.setGeneratedOutline(outlineSections)
        console.log('✅ [generateOutline] outlineEditorStore 已更新')
      } else {
        console.warn('⚠️ [generateOutline] 没有有效的大纲数据可以更新到 outlineEditorStore')
        if (outlineData) {
          console.warn(
            '⚠️ [generateOutline] outlineData 存在但不是有效数组:',
            typeof outlineData,
            Array.isArray(outlineData)
          )
        }
      }

      // 创建任务记录
      const task: DocumentTask = {
        taskId: `outline-${Date.now()}`,
        type: 'outline',
        status: 'completed',
        progress: 100,
        result: response,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      documentState.value.outlineTask = task
      activeTasks.value.push(task)

      return response
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : '大纲生成失败'
      error.value = errorMessage

      // 创建失败任务记录
      const task: DocumentTask = {
        taskId: `outline-${Date.now()}`,
        type: 'outline',
        status: 'failed',
        progress: 0,
        error: errorMessage,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      documentState.value.outlineTask = task
      activeTasks.value.push(task)

      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 选择标题
   */
  const selectTitle = (title: Title) => {
    updateDocumentState({ selectedTitle: title })
  }

  /**
   * 更新标题内容
   */
  const updateTitle = (oldTitle: Title, newTitle: Title) => {
    const titles = documentState.value.generatedTitles
    const index = titles.findIndex((t) => t.title === oldTitle.title)

    if (index !== -1) {
      const updatedTitles = [...titles]
      updatedTitles[index] = newTitle
      updateDocumentState({ generatedTitles: updatedTitles })

      // 如果更新的是当前选中的标题，也更新选中状态
      if (
        documentState.value.selectedTitle &&
        documentState.value.selectedTitle.title === oldTitle.title
      ) {
        updateDocumentState({ selectedTitle: newTitle })
      }
    }
  }

  /**
   * 执行Search2Title Agent
   */
  const executeSearch2TitleAgent = async (userId: string, projectId: string, brief: string) => {
    try {
      loading.value = true
      error.value = null

      const response = (await documentGenerateService.executeSearch2TitleAgent(userId, projectId, {
        brief
      })) as any

      if (!response.success) {
        throw new Error(response.message || 'Search2Title执行失败')
      }

      // 创建任务记录
      const task: DocumentTask = {
        taskId: response.task_id,
        type: 'search2title',
        status: 'pending',
        progress: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      documentState.value.search2titleTask = task
      activeTasks.value.push(task)

      // 开始轮询任务状态
      getTaskPollingManager().startPolling(response.task_id, 'search2title', userId, projectId)

      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search2Title任务启动失败'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取Scope任务状态
   */
  const getScopeTaskStatus = async (taskId: string): Promise<any | null> => {
    try {
      console.log(`[DEBUG] getScopeTaskStatus - taskId: ${taskId}`)
      const status = (await documentGenerateService.getScopeAgentStatus(taskId)) as any
      console.log(`[DEBUG] getScopeTaskStatus - status:`, status)

      // 更新本地任务状态
      const task = activeTasks.value.find((t) => t.taskId === taskId)
      if (task) {
        console.log(
          `[DEBUG] getScopeTaskStatus - found task, updating status from ${task.status} to ${status.status}`
        )
        // 更新任务状态
        task.status = status.status as any
        task.progress = status.progress
        task.result = status.result
        task.error = status.error || undefined
        task.updatedAt = Date.now()

        // 替换 documentState 中的 scopeTask 对象以触发响应式更新
        if (documentState.value.scopeTask?.taskId === taskId) {
          console.log(`[DEBUG] getScopeTaskStatus - updating documentState.scopeTask`)
          documentState.value.scopeTask = { ...task }
        }

        // 任务完成时停止轮询并更新研究简报
        if (task.status === 'completed' || task.status === 'failed') {
          console.log(`[DEBUG] getScopeTaskStatus - task ${task.status}, stopping polling`)
          getTaskPollingManager().stopPolling(taskId)

          // 任务完成后更新文档状态
          if (task.status === 'completed') {
            const updates: Partial<DocumentState> = {}

            // 支持多种数据结构：status.data.research_brief 或 status.result.research_brief
            const researchBrief = status.data?.research_brief || status.result?.research_brief

            // 如果有研究简报结果，更新到文档状态
            if (researchBrief) {
              console.log(`[DEBUG] getScopeTaskStatus - found research_brief:`, researchBrief)
              console.log(`[DEBUG] getScopeTaskStatus - research_brief type:`, typeof researchBrief)
              console.log(
                `[DEBUG] getScopeTaskStatus - research_brief length:`,
                researchBrief.length
              )
              updates.researchBrief = researchBrief
            } else {
              console.log(`[DEBUG] getScopeTaskStatus - NO research_brief found in status!`)
              console.log(`[DEBUG] getScopeTaskStatus - status keys:`, Object.keys(status || {}))
              console.log(
                `[DEBUG] getScopeTaskStatus - status.data keys:`,
                Object.keys(status.data || {})
              )
              console.log(
                `[DEBUG] getScopeTaskStatus - status.result keys:`,
                Object.keys(status.result || {})
              )
            }

            if (Object.keys(updates).length > 0) {
              console.log(`[DEBUG] getScopeTaskStatus - updating document state with:`, updates)
              updateDocumentState(updates)
              console.log(
                `[DEBUG] getScopeTaskStatus - documentState.researchBrief after update:`,
                documentState.value.researchBrief
              )
            }
          }
        }
      } else {
        console.log(`[DEBUG] getScopeTaskStatus - task not found in activeTasks`)
      }

      return status
    } catch (error) {
      console.error('获取Scope任务状态失败:', error)
      return null
    }
  }

  /**
   * 获取Search2Title任务状态
   */
  const getSearch2TitleTaskStatus = async (
    taskId: string,
    userId?: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    projectId?: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    try {
      const status = (await documentGenerateService.getSearch2TitleAgentStatus(taskId)) as any

      // 更新本地任务状态
      const task = activeTasks.value.find((t) => t.taskId === taskId)
      if (task) {
        // 更新任务状态
        task.status = status.status as any
        task.progress = status.progress
        task.result = status.result
        task.error = status.error || undefined
        task.updatedAt = Date.now()

        // 替换 documentState 中的 search2titleTask 对象以触发响应式更新
        if (documentState.value.search2titleTask?.taskId === taskId) {
          documentState.value.search2titleTask = { ...task }
        }

        // 任务完成时停止轮询
        if (task.status === 'completed' || task.status === 'failed') {
          getTaskPollingManager().stopPolling(taskId)

          // 任务完成后更新文档状态
          if (task.status === 'completed' && status.result) {
            const updates: Partial<DocumentState> = {}

            if (status.result.title_data?.titles) {
              updates.generatedTitles = status.result.title_data.titles
              updates.generationStats = {
                ...documentState.value.generationStats,
                titleCount: status.result.title_data.titles.length
              }
            }

            if (status.result.research_data?.web_search_data) {
              // 使用 normalizeSearchData 统一处理数据格式
              updates.titleSearchResults = normalizeSearchData<SearchResultItem>(
                status.result.research_data.web_search_data
              )
            }

            if (Object.keys(updates).length > 0) {
              updateDocumentState(updates)
            }
          }
        }
      }

      return status
    } catch (error) {
      console.error('获取Search2Title任务状态失败:', error)
      return null
    }
  }

  /**
   * 取消Search2Title任务
   */
  const cancelSearch2TitleTask = async (
    taskId: string,
    userId: string,
    projectId: string
  ): Promise<boolean> => {
    try {
      await documentGenerateService.cancelSearch2TitleAgentTask(userId, projectId, taskId)

      // 更新本地任务状态
      const task = activeTasks.value.find((t) => t.taskId === taskId)
      if (task) {
        task.status = 'failed'
        task.error = '任务已取消'
        task.updatedAt = Date.now()
        getTaskPollingManager().stopPolling(taskId)

        // 更新documentState中的search2titleTask状态
        if (documentState.value.search2titleTask?.taskId === taskId) {
          documentState.value.search2titleTask = { ...task }
        }
      }

      return true
    } catch (error) {
      console.error('取消Search2Title任务失败:', error)
      return false
    }
  }

  /**
   * 更新工作流步骤
   */
  const updateWorkflowStep = (step: DocumentState['currentStep']) => {
    updateDocumentState({ currentStep: step })
  }

  /**
   * 更新研究简报
   * @param brief 简报内容
   * @param projectId 可选的项目ID
   */
  const updateResearchBrief = (brief: string, projectId?: string) => {
    console.log(
      `[DEBUG] updateResearchBrief called with brief length: ${brief?.length || 0}, projectId: ${projectId}`
    )
    updateDocumentState({ researchBrief: brief }, projectId)
  }

  /**
   * 更新标题专用搜索结果
   * @description 使用normalizeSearchData确保数据始终是对象数组格式
   */
  const updateTitleSearchResults = (results: SearchResultItem[] | string) => {
    const normalizedResults = normalizeSearchData<SearchResultItem>(results)
    updateDocumentState({ titleSearchResults: normalizedResults })
  }

  /**
   * 取消任务
   */
  const cancelTask = async (taskId: string): Promise<boolean> => {
    try {
      await documentGenerateService.cancelScopeAgentTask(taskId)

      // 更新本地任务状态
      const task = activeTasks.value.find((t) => t.taskId === taskId)
      if (task) {
        task.status = 'failed'
        task.error = '任务已取消'
        task.updatedAt = Date.now()
        getTaskPollingManager().stopPolling(taskId)
      }

      return true
    } catch (error) {
      console.error('取消任务失败:', error)
      return false
    }
  }

  /**
   * 检查服务状态
   */
  const checkServiceStatus = async () => {
    try {
      // 暂时返回一个模拟状态，因为服务中没有这个方法
      return {
        status: 'healthy',
        services: {
          scopeAgent: 'available',
          titleAgent: 'available',
          outlineAgent: 'available',
          materialBind: 'available',
          outlineWithMaterial: 'available'
        }
      }
    } catch (error) {
      console.error('服务状态检查失败:', error)
      throw error
    }
  }

  /**
   * 清理完成的任务
   */
  const cleanupCompletedTasks = () => {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    // 移除已完成且超过1小时的任务
    activeTasks.value = activeTasks.value.filter((task) => {
      if (task.status === 'completed' && task.updatedAt < oneHourAgo) {
        return false
      }
      return true
    })
  }

  /**
   * 清理过期的任务
   * 清理条件：
   * 1. 任务创建时间超过30分钟
   * 2. 已完成/失败的任务超过5分钟
   */
  const cleanupExpiredTasks = () => {
    const now = Date.now()
    const EXPIRED_THRESHOLD = 30 * 60 * 1000 // 30分钟
    const COMPLETED_CLEANUP_THRESHOLD = 5 * 60 * 1000 // 5分钟

    const state = documentState.value

    // 检查并清理 scopeTask
    if (state.scopeTask) {
      const taskAge = now - state.scopeTask.createdAt
      if (
        taskAge > EXPIRED_THRESHOLD ||
        (['completed', 'failed'].includes(state.scopeTask.status) &&
          now - state.scopeTask.updatedAt > COMPLETED_CLEANUP_THRESHOLD)
      ) {
        state.scopeTask = null
      }
    }

    // 检查并清理 titleTask
    if (state.titleTask) {
      const taskAge = now - state.titleTask.createdAt
      if (
        taskAge > EXPIRED_THRESHOLD ||
        (['completed', 'failed'].includes(state.titleTask.status) &&
          now - state.titleTask.updatedAt > COMPLETED_CLEANUP_THRESHOLD)
      ) {
        state.titleTask = null
      }
    }

    // 检查并清理 outlineTask
    if (state.outlineTask) {
      const taskAge = now - state.outlineTask.createdAt
      if (
        taskAge > EXPIRED_THRESHOLD ||
        (['completed', 'failed'].includes(state.outlineTask.status) &&
          now - state.outlineTask.updatedAt > COMPLETED_CLEANUP_THRESHOLD)
      ) {
        state.outlineTask = null
      }
    }

    // 检查并清理 search2titleTask
    if (state.search2titleTask) {
      const taskAge = now - state.search2titleTask.createdAt
      if (
        taskAge > EXPIRED_THRESHOLD ||
        (['completed', 'failed'].includes(state.search2titleTask.status) &&
          now - state.search2titleTask.updatedAt > COMPLETED_CLEANUP_THRESHOLD)
      ) {
        state.search2titleTask = null
      }
    }

    // 更新文档状态的更新时间
    updateDocumentState({})
  }

  // ==================== 核心服务API方法实现 ====================

  /**
   * 创建研究简报
   */
  const createResearchBrief = async (projectId: number, content: string) => {
    loading.value = true
    error.value = null
    try {
      // 暂时返回模拟数据，因为服务中没有这个方法
      const response = {
        success: true,
        data: {
          id: Date.now(),
          content,
          project_id: projectId,
          created_at: new Date().toISOString()
        }
      }
      if (response.success) {
        updateDocumentState({ researchBrief: content })
        return response.data
      }
      throw new Error('创建研究简报失败')
    } catch (err: any) {
      error.value = err.message || '创建研究简报失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取项目研究简报列表
   */
  const getProjectBriefs = async (
    _projectId: number /* eslint-disable-line @typescript-eslint/no-unused-vars */
  ) => {
    loading.value = true
    error.value = null
    try {
      // 暂时返回模拟数据，因为服务中没有这个方法
      const response = {
        success: true,
        data: []
      }
      if (response.success) {
        return response.data
      }
      throw new Error('获取研究简报列表失败')
    } catch (err: any) {
      error.value = err.message || '获取研究简报列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建标题候选
   */
  const createTitleCandidate = async (projectId: number, content: string) => {
    loading.value = true
    error.value = null
    try {
      // 暂时返回模拟数据，因为服务中没有这个方法
      const response = {
        success: true,
        data: {
          id: Date.now(),
          content,
          project_id: projectId,
          created_at: new Date().toISOString()
        }
      }
      if (response.success) {
        return response.data
      }
      throw new Error('创建标题候选失败')
    } catch (err: any) {
      error.value = err.message || '创建标题候选失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 批量创建标题候选
   */
  const bulkCreateTitleCandidates = async (projectId: number, candidates: string[]) => {
    loading.value = true
    error.value = null
    try {
      // 暂时返回模拟数据，因为服务中没有这个方法
      const response = {
        success: true,
        data: candidates.map((content, index) => ({
          id: Date.now() + index,
          content,
          project_id: projectId,
          created_at: new Date().toISOString()
        }))
      }
      if (response.success) {
        const newTitles = response.data.map((c: any) => ({
          title: c.content,
          angle: '',
          why_now: '',
          news_values: [],
          verifiability: '',
          sources: [],
          risk_notes: '',
          feasibility: ''
        }))
        updateDocumentState({
          generatedTitles: [...documentState.value.generatedTitles, ...newTitles]
        })
        return response.data
      }
      throw new Error('批量创建标题候选失败')
    } catch (err: any) {
      error.value = err.message || '批量创建标题候选失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 选择标题候选
   */
  const selectTitleCandidate = async (candidateId: number) => {
    loading.value = true
    error.value = null
    try {
      // 暂时返回模拟数据，因为服务中没有这个方法
      const response = {
        success: true,
        data: {
          id: candidateId,
          selected_at: new Date().toISOString()
        }
      }
      if (response.success) {
        return response.data
      }
      throw new Error('选择标题候选失败')
    } catch (err: any) {
      error.value = err.message || '选择标题候选失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建标题版本
   */
  const createTitle = async (projectId: number, content: string) => {
    loading.value = true
    error.value = null
    try {
      // 暂时返回模拟数据，因为服务中没有这个方法
      const response = {
        success: true,
        data: {
          id: Date.now(),
          content,
          project_id: projectId,
          created_at: new Date().toISOString()
        }
      }
      if (response.success) {
        return response.data
      }
      throw new Error('创建标题失败')
    } catch (err: any) {
      error.value = err.message || '创建标题失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取项目活动标题
   */
  const getActiveTitle = async (
    _projectId: number /* eslint-disable-line @typescript-eslint/no-unused-vars */
  ) => {
    loading.value = true
    error.value = null
    try {
      // 暂时返回模拟数据，因为服务中没有这个方法
      const response = {
        success: true,
        data: null
      }
      if (response.success) {
        return response.data
      }
      throw new Error('获取活动标题失败')
    } catch (err: any) {
      error.value = err.message || '获取活动标题失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== 项目级状态管理 ====================

  /**
   * 当前活跃项目ID
   * 用于生成项目特定的存储键
   */
  const currentProjectId = ref<string | null>(null)

  /**
   * 设置当前项目ID并重新加载该项目的状态
   */
  const setCurrentProject = (projectId: string) => {
    console.log(`[DEBUG] DocumentStore 设置当前项目: ${currentProjectId.value} -> ${projectId}`)
    console.log(`[DEBUG] setCurrentProject: 不执行清理操作，仅设置项目ID`)
    currentProjectId.value = projectId
    // 注意：状态会在页面组件中通过 resetStateForProject 加载
  }

  /**
   * 获取项目特定的存储键
   */
  const getProjectStorageKey = (projectId?: string): string => {
    const pid = projectId || currentProjectId.value
    if (!pid) {
      console.warn('[DEBUG] getProjectStorageKey: 未提供项目ID，使用默认键')
      return 'document_generate-store-default'
    }
    return `document_generate-store-${pid}`
  }

  /**
   * 保存当前状态到项目特定的存储
   * @param projectId 可选的项目ID，如果不提供则使用当前项目ID
   */
  const saveToProjectStorage = (projectId?: string) => {
    const pid = projectId || currentProjectId.value
    if (!pid) {
      console.log('[DEBUG] saveToProjectStorage: 当前无项目，跳过保存')
      return
    }

    const key = getProjectStorageKey(pid)
    const data = {
      documentState: documentState.value,
      activeTasks: activeTasks.value,
      timestamp: Date.now()
    }

    try {
      localStorage.setItem(key, JSON.stringify(data))
      console.log(`\n💾 [SAVE] 已保存项目 ${pid} 的状态到 localStorage，键: ${key}`)
      console.log(`💾 [SAVE] 保存时间: ${new Date().toLocaleString()}`)
      console.log(`💾 [SAVE] 保存的数据:`, {
        hasDocumentState: !!data.documentState,
        researchBriefLength: data.documentState.researchBrief?.length || 0,
        generatedTitlesCount: data.documentState.generatedTitles?.length || 0,
        activeTasksCount: data.activeTasks?.length || 0
      })
      console.log(`💾 [SAVE] 保存完成\n`)
    } catch (error) {
      console.error(`[DEBUG] 保存项目 ${pid} 状态失败:`, error)
    }
  }

  /**
   * 从项目特定的存储加载状态
   */
  const loadFromProjectStorage = (projectId: string): boolean => {
    const key = getProjectStorageKey(projectId)
    console.log(`\n🔄 [LOAD] 尝试从 localStorage 加载项目 ${projectId} 的状态，键: ${key}`)
    console.log(`🔄 [LOAD] 加载时间: ${new Date().toLocaleString()}`)

    try {
      const data = localStorage.getItem(key)
      if (data) {
        const parsed = JSON.parse(data)

        // 检查数据是否过期（7天）
        const isExpired = Date.now() - (parsed.timestamp || 0) > 7 * 24 * 60 * 60 * 1000

        if (isExpired) {
          console.log(`⚠️ [LOAD] 项目 ${projectId} 的状态已过期，清理并重新开始`)
          localStorage.removeItem(key)
          return false
        }

        // 恢复状态
        if (parsed.documentState) {
          console.log(`🔄 [LOAD] 正在恢复 documentState...`)
          documentState.value = {
            ...parsed.documentState,
            // 确保时间戳是当前的
            updatedAt: Date.now()
          }
        }

        if (parsed.activeTasks) {
          console.log(`🔄 [LOAD] 正在恢复 activeTasks...`)
          activeTasks.value = parsed.activeTasks
        }

        console.log(`✅ [LOAD] 已从 localStorage 恢复项目 ${projectId} 的状态`)
        console.log(`🔄 [LOAD] 恢复的数据:`, {
          hasDocumentState: !!parsed.documentState,
          researchBriefLength: parsed.documentState?.researchBrief?.length || 0,
          generatedTitlesCount: parsed.documentState?.generatedTitles?.length || 0,
          activeTasksCount: parsed.activeTasks?.length || 0
        })
        console.log(`🔄 [LOAD] 恢复完成\n`)
        return true
      } else {
        console.log(`⚠️ [LOAD] localStorage 中无项目 ${projectId} 的数据`)
      }
    } catch (error) {
      console.error(`[DEBUG] 加载项目 ${projectId} 状态失败:`, error)
    }

    console.log(`🔄 [LOAD] 项目 ${projectId} 无保存的状态，返回 false\n`)
    return false
  }

  /**
   * 清理项目特定的存储
   */
  const clearProjectStorage = (projectId?: string) => {
    const pid = projectId || currentProjectId.value
    if (!pid) {
      console.log(`[DEBUG] clearProjectStorage: 未提供项目ID，跳过清理`)
      return
    }

    const key = getProjectStorageKey(pid)
    console.log(`\n⚠️⚠️⚠️ [CRITICAL] clearProjectStorage 被调用 ⚠️⚠️⚠️`)
    console.log(`[CRITICAL] 调用堆栈:`, new Error().stack?.split('\n').slice(0, 5).join('\n'))
    console.log(`[CRITICAL] 项目ID: ${pid}`)
    console.log(`[CRITICAL] 存储键: ${key}`)
    console.log(`[CRITICAL] 当前时间: ${new Date().toLocaleString()}`)
    try {
      localStorage.removeItem(key)
      console.log(`[CRITICAL] 已清理项目 ${pid} 的持久化状态`)
      console.log(`⚠️⚠️⚠️ 清理完成 ⚠️⚠️⚠️\n`)
    } catch (error) {
      console.error(`[CRITICAL] 清理项目 ${pid} 状态失败:`, error)
    }
  }

  /**
   * 轮询任务状态的辅助函数
   */
  const pollTaskStatus = async (taskId: string): Promise<any> => {
    // 这里应该实现轮询逻辑，暂时简化处理
    // 实际应该根据任务类型调用相应的状态检查方法
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟任务完成
        resolve({
          task_id: taskId,
          status: 'completed',
          result: {
            outline: {
              sections: []
            },
            binding_result: {
              total_materials_found: 0,
              materials_bound: 0,
              binding_efficiency: 0,
              sections_with_materials: 0,
              binding_details: []
            }
          }
        })
      }, 2000)
    })
  }

  /**
   * AI智能素材绑定
   */
  const bindMaterialsWithAI = async (
    request: MaterialBindRequest
  ): Promise<MaterialBindResponse> => {
    try {
      loading.value = true
      error.value = null

      const response = (await documentGenerateService.bindMaterialsWithAI(request)) as any

      if (response.task_id) {
        // 轮询任务状态
        const result = await pollTaskStatus(response.task_id)

        if (result && result.result) {
          // 获取 outlineEditorStore 实例
          const outlineEditorStore = useOutlineEditorStore()

          // 更新素材绑定结果到 outlineEditorStore
          outlineEditorStore.setBindingResult(result.result)

          ElMessage.success('素材绑定完成')
          return result
        } else {
          throw new Error('绑定失败，请重试')
        }
      } else {
        // 直接处理响应结果（非异步任务）
        const outlineEditorStore = useOutlineEditorStore()

        // 如果响应中包含绑定结果，直接更新
        if (response.binding_result) {
          outlineEditorStore.setBindingResult(response.binding_result)
        }

        ElMessage.success('素材绑定完成')
        return response
      }
    } catch (err: any) {
      error.value = err.message || '素材绑定失败'
      ElMessage.error(error.value || '素材绑定失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * AI完整生成大纲（包含素材绑定）
   */
  const generateAICompleteOutline = async (
    request: OutlineWithMaterialRequest
  ): Promise<OutlineWithMaterialResponse> => {
    console.log('🎯 [generateAICompleteOutline] 开始执行')
    try {
      loading.value = true
      error.value = null

      console.log('📋 [generateAICompleteOutline] 请求参数:', request)

      const response = (await documentGenerateService.executeOutlineWithMaterial(
        'user',
        'project',
        request
      )) as any

      console.log('✅ [generateAICompleteOutline] API响应:', response)

      if (response.task_id) {
        // 轮询任务状态
        const result = await pollTaskStatus(response.task_id)

        console.log('✅ [generateAICompleteOutline] 轮询结果:', result)

        if (result && result.result) {
          // 获取 outlineEditorStore 实例
          const outlineEditorStore = useOutlineEditorStore()

          // 更新生成的大纲到 outlineEditorStore
          if (result.result.outline) {
            console.log(
              '📝 [generateAICompleteOutline] 转换大纲章节:',
              result.result.outline.sections?.length,
              '个章节'
            )
            const outlineSections = result.result.outline.sections.map(
              (section: any, index: number) => ({
                id: parseInt(section.id),
                title: section.title,
                content_direction: section.content_summary || '',
                order_index: index,
                outline_id: 0, // 需要从当前项目获取
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                level: section.level,
                parent_section_id: section.parent_id ? parseInt(section.parent_id) : undefined,
                word_count_target: section.estimated_word_count,
                estimated_reading_time: section.estimated_word_count
                  ? Math.ceil(section.estimated_word_count / 200)
                  : undefined
              })
            )

            console.log('📝 [generateAICompleteOutline] 转换后章节数据:', outlineSections)
            // 更新到 outlineEditorStore
            outlineEditorStore.setGeneratedOutline(outlineSections)
            console.log('✅ [generateAICompleteOutline] outlineEditorStore 大纲已更新')
          }

          // 更新素材绑定结果到 outlineEditorStore
          if (result.result.binding_result) {
            console.log(
              '📝 [generateAICompleteOutline] 更新绑定结果:',
              result.result.binding_result
            )
            outlineEditorStore.setBindingResult(result.result.binding_result)
            console.log('✅ [generateAICompleteOutline] outlineEditorStore 绑定结果已更新')
          }

          ElMessage.success('大纲和素材生成完成')
          return result
        } else {
          throw new Error('生成失败，请重试')
        }
      } else {
        // 直接处理响应结果（非异步任务）
        const outlineEditorStore = useOutlineEditorStore()

        // 如果响应中包含大纲，直接更新
        if (response.outline) {
          const outlineSections = response.outline.sections.map((section: any, index: number) => ({
            id: parseInt(section.id),
            title: section.title,
            content_direction: section.content_summary || '',
            order_index: index,
            outline_id: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            level: section.level,
            parent_section_id: section.parent_id ? parseInt(section.parent_id) : undefined,
            word_count_target: section.estimated_word_count,
            estimated_reading_time: section.estimated_word_count
              ? Math.ceil(section.estimated_word_count / 200)
              : undefined
          }))

          outlineEditorStore.setGeneratedOutline(outlineSections)
        }

        // 如果响应中包含绑定结果，直接更新
        if (response.binding_result) {
          outlineEditorStore.setBindingResult(response.binding_result)
        }

        ElMessage.success('大纲和素材生成完成')
        return response
      }
    } catch (err: any) {
      error.value = err.message || '生成大纲和素材失败'
      ElMessage.error(error.value || '生成大纲和素材失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    documentState,
    loading,
    error,
    activeTasks,
    currentProjectId,

    // 计算属性
    hasActiveTasks,
    workflowProgress,
    workflowStats,
    taskStatistics,

    // 方法
    resetDocumentState,
    resetStateForProject,
    updateDocumentState,
    executeScopeAgent,
    generateTitles,
    generateOutline,
    selectTitle,
    updateTitle,
    executeSearch2TitleAgent,
    getSearch2TitleTaskStatus,
    cancelSearch2TitleTask,
    getScopeTaskStatus,
    updateWorkflowStep,
    updateTitleSearchResults,
    updateResearchBrief,
    cancelTask,
    checkServiceStatus,
    cleanupCompletedTasks,
    cleanupExpiredTasks,

    // 项目级状态管理
    setCurrentProject,
    saveToProjectStorage,
    loadFromProjectStorage,
    clearProjectStorage,
    getProjectStorageKey,

    // 核心服务API方法
    createResearchBrief,
    getProjectBriefs,
    createTitleCandidate,
    bulkCreateTitleCandidates,
    selectTitleCandidate,
    createTitle,
    getActiveTitle,

    // 新增的方法
    bindMaterialsWithAI,
    generateAICompleteOutline
  }
})
