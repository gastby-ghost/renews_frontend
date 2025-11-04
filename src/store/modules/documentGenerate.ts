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
import { documentGenerateService } from '@/services/documentGenerateService'
import { AsyncTaskPoller, TaskStatus } from '@/utils/polling/asyncTaskPoller'
import type {
  ScopeAgentResponse,
  ScopeAgentStatusResponse,
  TitleGenerationResponse,
  OutlineGenerationResponse,
  Title,
  SearchResultItem,
  OutlineSection
} from '@/types/ai'

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
          // 更新标题专用搜索结果
          if (status.result?.research_data?.web_search_data) {
            this.store.updateTitleSearchResults?.(status.result.research_data.web_search_data)
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
    return statusMap[status.toLowerCase()] || TaskStatus.RUNNING
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
export const useDocumentGenerateStore = defineStore(
  'documentGenerateStore',
  () => {
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
        hasSearchResults: state.searchResults.length > 0,
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
          getSearch2TitleTaskStatus: async (
            taskId: string,
            userId?: string,
            projectId?: string
          ) => {
            if (!userId || !projectId) {
              console.error('getSearch2TitleTaskStatus 缺少必要参数: userId 或 projectId')
              return null
            }
            // 修复：添加async/await确保Promise被正确等待
            return await getSearch2TitleTaskStatus(taskId, userId, projectId)
          },
          // 添加缺失的方法
          updateSearchResults: (results: SearchResultItem[]) => {
            updateDocumentState({ searchResults: results })
          },
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
     */
    const resetDocumentState = () => {
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
     * 更新文档状态
     */
    const updateDocumentState = (updates: Partial<DocumentState>) => {
      // 确保 titleSearchResults 始终是数组
      if (updates.titleSearchResults !== undefined) {
        updates.titleSearchResults = Array.isArray(updates.titleSearchResults)
          ? updates.titleSearchResults
          : []
      }

      Object.assign(documentState.value, {
        ...updates,
        updatedAt: Date.now()
      })
    }

    /**
     * 执行Scope Agent任务
     */
    const executeScopeAgent = async (
      userId: string,
      projectId: string,
      query: string
    ): Promise<ScopeAgentResponse | null> => {
      try {
        loading.value = true
        error.value = null

        const response: ScopeAgentResponse = await documentGenerateService.executeScopeAgent(
          userId,
          projectId,
          { query }
        )

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

        const response: TitleGenerationResponse = await documentGenerateService.generateTitles({
          research_brief: researchBrief,
          web_search_data: webSearchData
        })

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
      if (!title || webSearchData.length === 0) {
        error.value = '未选择标题或搜索数据不完整'
        return null
      }

      try {
        loading.value = true
        error.value = null

        const response: OutlineGenerationResponse = await documentGenerateService.generateOutline({
          title,
          research_brief: researchBrief,
          web_search_data: webSearchData
        })

        // 更新文档状态
        updateDocumentState({
          generatedOutline: response.outline,
          generationStats: {
            ...documentState.value.generationStats,
            outlineSectionCount: response.section_count,
            totalWordEstimate: response.total_word_estimate || 0
          }
        })

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

        const response = await documentGenerateService.executeSearch2TitleAgent(userId, projectId, {
          brief
        })

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
    const getScopeTaskStatus = async (taskId: string): Promise<ScopeAgentStatusResponse | null> => {
      try {
        console.log(`[DEBUG] getScopeTaskStatus - taskId: ${taskId}`)
        const status = await documentGenerateService.getScopeAgentStatus(taskId)
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
            if (task.status === 'completed' && status.result) {
              const updates: Partial<DocumentState> = {}

              // 如果有研究简报结果，更新到文档状态
              if (status.result.research_brief) {
                updates.researchBrief = status.result.research_brief
              }

              if (Object.keys(updates).length > 0) {
                updateDocumentState(updates)
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
    const getSearch2TitleTaskStatus = async (taskId: string, userId: string, projectId: string) => {
      try {
        const status = await documentGenerateService.getSearch2TitleAgentStatus(
          taskId,
          userId,
          projectId
        )

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
                updates.titleSearchResults = status.result.research_data.web_search_data
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
        await documentGenerateService.cancelSearch2TitleAgentTask(taskId, userId, projectId)

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
     * 更新搜索数据
     */
    const updateSearchResults = (results: SearchResultItem[]) => {
      updateDocumentState({ searchResults: results })
    }

    /**
     * 更新研究简报
     */
    const updateResearchBrief = (brief: string) => {
      updateDocumentState({ researchBrief: brief })
    }

    /**
     * 更新标题专用搜索结果
     */
    const updateTitleSearchResults = (results: SearchResultItem[]) => {
      updateDocumentState({ titleSearchResults: results })
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
        const status = await documentGenerateService.checkServiceStatus()
        return status
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

    return {
      // 状态
      documentState,
      loading,
      error,
      activeTasks,

      // 计算属性
      hasActiveTasks,
      workflowProgress,
      workflowStats,
      taskStatistics,

      // 方法
      resetDocumentState,
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
      updateSearchResults,
      updateTitleSearchResults,
      updateResearchBrief,
      cancelTask,
      checkServiceStatus,
      cleanupCompletedTasks,
      cleanupExpiredTasks
    }
  },
  {
    persist: {
      key: 'document-generate-store',
      storage: localStorage
    }
  }
)
