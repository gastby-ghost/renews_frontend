/**
 * 文档生成状态管理
 * 管理文档生成的工作流状态、生成结果、任务状态等
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { documentGenerateService } from '@/services/documentGenerateService'
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
 * 文档生成任务状态
 */
export interface DocumentTask {
  taskId: string
  type: 'scope' | 'title' | 'outline'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  result?: any
  error?: string
  createdAt: number
  updatedAt: number
}

/**
 * 文档生成项目状态
 */
export interface DocumentProject {
  projectId: string
  userId: string

  // 基本信息
  researchBrief: string
  searchResults: SearchResultItem[]

  // 生成的内容
  generatedTitles: Title[]
  selectedTitle: Title | null
  generatedOutline: OutlineSection[]

  // 任务状态
  scopeTask: DocumentTask | null
  titleTask: DocumentTask | null
  outlineTask: DocumentTask | null

  // 工作流状态
  currentStep: 'requirements' | 'title' | 'outline' | 'content' | 'complete'

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
 * 文档生成状态管理
 */
export const useDocumentGenerateStore = defineStore(
  'documentGenerateStore',
  () => {
    // 当前文档项目
    const currentDocument = ref<DocumentProject | null>(null)

    // 文档项目列表
    const documentProjects = ref<DocumentProject[]>([])

    // 加载状态
    const loading = ref(false)

    // 错误信息
    const error = ref<string | null>(null)

    // 全局任务状态
    const activeTasks = ref<DocumentTask[]>([])

    // 计算属性：是否有活动任务
    const hasActiveTasks = computed(() => activeTasks.value.length > 0)

    // 计算属性：当前项目的进度
    const currentProjectProgress = computed(() => {
      if (!currentDocument.value) return 0

      const steps = ['requirements', 'title', 'outline', 'content', 'complete']
      const currentStepIndex = steps.indexOf(currentDocument.value.currentStep)
      return (currentStepIndex / (steps.length - 1)) * 100
    })

    // 计算属性：当前项目的状态统计
    const currentProjectStats = computed(() => {
      if (!currentDocument.value) return null

      const doc = currentDocument.value
      return {
        hasResearchBrief: doc.researchBrief.length > 10,
        hasSearchResults: doc.searchResults.length > 0,
        hasGeneratedTitles: doc.generatedTitles.length > 0,
        hasSelectedTitle: doc.selectedTitle !== null,
        hasGeneratedOutline: doc.generatedOutline.length > 0,
        titleCount: doc.generatedTitles.length,
        outlineSectionCount: doc.generatedOutline.length,
        totalWordEstimate: doc.generationStats.totalWordEstimate
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

    /**
     * 创建新的文档项目
     */
    const createDocumentProject = async (
      userId: string,
      researchBrief: string = ''
    ): Promise<DocumentProject | null> => {
      try {
        loading.value = true
        error.value = null

        const projectId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const now = Date.now()

        const newProject: DocumentProject = {
          projectId,
          userId,
          researchBrief,
          searchResults: [],
          generatedTitles: [],
          selectedTitle: null,
          generatedOutline: [],
          scopeTask: null,
          titleTask: null,
          outlineTask: null,
          currentStep: 'requirements',
          generationStats: {
            titleCount: 0,
            outlineSectionCount: 0,
            totalWordEstimate: 0
          },
          createdAt: now,
          updatedAt: now
        }

        // 添加到列表
        documentProjects.value.unshift(newProject)

        // 设置为当前项目
        currentDocument.value = newProject

        ElMessage.success('文档项目创建成功')
        return newProject
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '创建文档项目失败'
        ElMessage.error(errorMessage)
        return null
      } finally {
        loading.value = false
      }
    }

    /**
     * 设置当前文档项目
     */
    const setCurrentDocument = (projectId: string) => {
      const project = documentProjects.value.find((p) => p.projectId === projectId)
      if (project) {
        currentDocument.value = project
      } else {
        ElMessage.error('找不到指定的文档项目')
      }
    }

    /**
     * 更新当前文档项目
     */
    const updateCurrentDocument = (updates: Partial<DocumentProject>) => {
      if (!currentDocument.value) return

      Object.assign(currentDocument.value, {
        ...updates,
        updatedAt: Date.now()
      })
    }

    /**
     * 执行Scope Agent任务
     */
    const executeScopeAgent = async (query: string): Promise<ScopeAgentResponse | null> => {
      if (!currentDocument.value) {
        ElMessage.error('没有活动的文档项目')
        return null
      }

      try {
        loading.value = true
        error.value = null

        const response: ScopeAgentResponse = await documentGenerateService.executeScopeAgent(
          currentDocument.value.userId,
          currentDocument.value.projectId,
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

        currentDocument.value.scopeTask = task
        activeTasks.value.push(task)

        ElMessage.success('Scope分析任务已启动')
        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Scope分析任务启动失败'
        ElMessage.error(errorMessage)
        return null
      } finally {
        loading.value = false
      }
    }

    /**
     * 生成标题
     */
    const generateTitles = async (): Promise<TitleGenerationResponse | null> => {
      if (!currentDocument.value) {
        ElMessage.error('没有活动的文档项目')
        return null
      }

      if (
        !currentDocument.value.researchBrief ||
        currentDocument.value.searchResults.length === 0
      ) {
        ElMessage.error('研究简报或搜索数据不完整')
        return null
      }

      try {
        loading.value = true
        error.value = null

        const response: TitleGenerationResponse = await documentGenerateService.generateTitles({
          research_brief: currentDocument.value.researchBrief,
          web_search_data: currentDocument.value.searchResults
        })

        // 更新当前项目
        currentDocument.value.generatedTitles = response.titles
        currentDocument.value.generationStats.titleCount = response.title_count

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

        currentDocument.value.titleTask = task
        activeTasks.value.push(task)

        ElMessage.success(`成功生成 ${response.title_count} 个标题`)
        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '标题生成失败'
        ElMessage.error(errorMessage)
        return null
      } finally {
        loading.value = false
      }
    }

    /**
     * 生成大纲
     */
    const generateOutline = async (): Promise<OutlineGenerationResponse | null> => {
      if (!currentDocument.value) {
        ElMessage.error('没有活动的文档项目')
        return null
      }

      if (
        !currentDocument.value.selectedTitle ||
        currentDocument.value.searchResults.length === 0
      ) {
        ElMessage.error('未选择标题或搜索数据不完整')
        return null
      }

      try {
        loading.value = true
        error.value = null

        const response: OutlineGenerationResponse = await documentGenerateService.generateOutline({
          title: currentDocument.value.selectedTitle,
          research_brief: currentDocument.value.researchBrief,
          web_search_data: currentDocument.value.searchResults
        })

        // 更新当前项目
        currentDocument.value.generatedOutline = response.outline
        currentDocument.value.generationStats.outlineSectionCount = response.section_count
        currentDocument.value.generationStats.totalWordEstimate = response.total_word_estimate || 0

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

        currentDocument.value.outlineTask = task
        activeTasks.value.push(task)

        ElMessage.success(`成功生成 ${response.section_count} 个章节的大纲`)
        return response
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '大纲生成失败'
        ElMessage.error(errorMessage)
        return null
      } finally {
        loading.value = false
      }
    }

    /**
     * 选择标题
     */
    const selectTitle = (title: Title) => {
      if (!currentDocument.value) return

      currentDocument.value.selectedTitle = title
      currentDocument.value.updatedAt = Date.now()

      ElMessage.success('标题已选择')
    }

    /**
     * 更新工作流步骤
     */
    const updateWorkflowStep = (step: DocumentProject['currentStep']) => {
      if (!currentDocument.value) return

      currentDocument.value.currentStep = step
      currentDocument.value.updatedAt = Date.now()
    }

    /**
     * 更新搜索数据
     */
    const updateSearchResults = (results: SearchResultItem[]) => {
      if (!currentDocument.value) return

      currentDocument.value.searchResults = results
      currentDocument.value.updatedAt = Date.now()
    }

    /**
     * 更新研究简报
     */
    const updateResearchBrief = (brief: string) => {
      if (!currentDocument.value) return

      currentDocument.value.researchBrief = brief
      currentDocument.value.updatedAt = Date.now()
    }

    /**
     * 获取任务状态
     */
    const getTaskStatus = async (taskId: string): Promise<ScopeAgentStatusResponse | null> => {
      try {
        const status = await documentGenerateService.getScopeAgentStatus(taskId)

        // 更新本地任务状态
        const task = activeTasks.value.find((t) => t.taskId === taskId)
        if (task) {
          task.status = status.status as any
          task.progress = status.progress
          task.result = status.result
          task.error = status.error || undefined
          task.updatedAt = Date.now()
        }

        return status
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '获取任务状态失败'
        ElMessage.error(errorMessage)
        return null
      }
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
        }

        ElMessage.success('任务已取消')
        return true
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '取消任务失败'
        ElMessage.error(errorMessage)
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
        const errorMessage = error instanceof Error ? error.message : '服务状态检查失败'
        ElMessage.error(errorMessage)
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
     * 重置当前项目
     */
    const resetCurrentDocument = () => {
      currentDocument.value = null
      activeTasks.value = []
    }

    return {
      // 状态
      currentDocument,
      documentProjects,
      loading,
      error,
      activeTasks,

      // 计算属性
      hasActiveTasks,
      currentProjectProgress,
      currentProjectStats,
      taskStatistics,

      // 方法
      createDocumentProject,
      setCurrentDocument,
      updateCurrentDocument,
      executeScopeAgent,
      generateTitles,
      generateOutline,
      selectTitle,
      updateWorkflowStep,
      updateSearchResults,
      updateResearchBrief,
      getTaskStatus,
      cancelTask,
      checkServiceStatus,
      cleanupCompletedTasks,
      resetCurrentDocument
    }
  },
  {
    persist: {
      key: 'document-generate-store',
      paths: ['documentProjects', 'currentDocument']
    }
  }
)
