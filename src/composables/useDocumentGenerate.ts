/**
 * 文档生成组合式函数
 * 统一管理文档生成的UI状态和业务逻辑
 * 提供完整的5步文档生成工作流支持
 */

import { reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { documentGenerateService } from '@/services/documentGenerateService'
import type {
  ScopeAgentRequest,
  ScopeAgentResponse,
  ScopeAgentStatusResponse,
  TitleGenerationRequest,
  TitleGenerationResponse,
  OutlineGenerationRequest,
  OutlineGenerationResponse,
  SearchResultItem,
  Title
} from '@/types/ai'

/**
 * 文档生成工作流状态
 */
export interface DocumentWorkflowState {
  // 当前步骤
  currentStep: 'requirements' | 'title' | 'outline' | 'content' | 'complete'

  // 项目信息
  projectId: string
  userId: string

  // 研究简报
  researchBrief: string

  // 搜索数据
  searchResults: SearchResultItem[]

  // 生成的标题
  generatedTitles: Title[]
  selectedTitle: Title | null

  // 生成的大纲
  generatedOutline: any[]

  // 任务状态
  scopeTaskId: string | null
  titleTaskId: string | null
  outlineTaskId: string | null

  // 进度状态
  scopeProgress: number
  titleProgress: number
  outlineProgress: number

  // 加载状态
  isGeneratingScope: boolean
  isGeneratingTitles: boolean
  isGeneratingOutline: boolean

  // 错误状态
  errors: {
    scope?: string
    title?: string
    outline?: string
  }
}

/**
 * 文档生成组合式函数
 */
export function useDocumentGenerate() {
  const router = useRouter()
  // 项目状态管理
  // const projectId = ref('') // 暂时注释，后续使用

  // 工作流状态
  const workflowState = reactive<DocumentWorkflowState>({
    currentStep: 'requirements',
    projectId: '',
    userId: 'user-123', // 应从用户store获取
    researchBrief: '',
    searchResults: [],
    generatedTitles: [],
    selectedTitle: null,
    generatedOutline: [],
    scopeTaskId: null,
    titleTaskId: null,
    outlineTaskId: null,
    scopeProgress: 0,
    titleProgress: 0,
    outlineProgress: 0,
    isGeneratingScope: false,
    isGeneratingTitles: false,
    isGeneratingOutline: false,
    errors: {}
  })

  // 计算属性
  const hasResearchBrief = computed(() => workflowState.researchBrief.length > 10)
  const hasSearchResults = computed(() => workflowState.searchResults.length > 0)
  const hasGeneratedTitles = computed(() => workflowState.generatedTitles.length > 0)
  const hasSelectedTitle = computed(() => workflowState.selectedTitle !== null)
  const hasGeneratedOutline = computed(() => workflowState.generatedOutline.length > 0)

  const canGenerateTitles = computed(() => hasResearchBrief.value && hasSearchResults.value)
  const canGenerateOutline = computed(() => hasSelectedTitle.value && hasSearchResults.value)

  // 当前步骤是否可继续
  const canProceedToNextStep = computed(() => {
    switch (workflowState.currentStep) {
      case 'requirements':
        return hasResearchBrief.value && hasSearchResults.value
      case 'title':
        return hasSelectedTitle.value
      case 'outline':
        return hasGeneratedOutline.value
      case 'content':
        return true
      default:
        return false
    }
  })

  // 设置项目ID
  const setProjectId = (projectId: string) => {
    workflowState.projectId = projectId
  }

  // 设置用户ID
  const setUserId = (userId: string) => {
    workflowState.userId = userId
  }

  // 设置研究简报
  const setResearchBrief = (brief: string) => {
    workflowState.researchBrief = brief
  }

  // 设置搜索数据
  const setSearchResults = (results: SearchResultItem[]) => {
    workflowState.searchResults = results
  }

  // 选择标题
  const selectTitle = (title: Title) => {
    workflowState.selectedTitle = title
  }

  // 执行Scope Agent
  const executeScopeAgent = async (query: string) => {
    if (!workflowState.projectId || !workflowState.userId) {
      ElMessage.error('项目ID或用户ID未设置')
      return
    }

    workflowState.isGeneratingScope = true
    workflowState.errors.scope = undefined
    workflowState.scopeProgress = 0

    try {
      const request: ScopeAgentRequest = { query }
      const response: ScopeAgentResponse = await documentGenerateService.executeScopeAgent(
        workflowState.userId,
        workflowState.projectId,
        request
      )

      workflowState.scopeTaskId = response.task_id

      // 启动状态轮询
      pollScopeAgentStatus()

      ElMessage.success('Scope分析任务已启动，正在后台处理')
      return response
    } catch (error) {
      workflowState.errors.scope = error instanceof Error ? error.message : 'Scope分析失败'
      ElMessage.error(workflowState.errors.scope)
      throw error
    } finally {
      workflowState.isGeneratingScope = false
    }
  }

  // 获取Scope Agent状态
  const getScopeAgentStatus = async () => {
    if (!workflowState.scopeTaskId) {
      return null
    }

    try {
      const status: ScopeAgentStatusResponse = await documentGenerateService.getScopeAgentStatus(
        workflowState.scopeTaskId
      )

      workflowState.scopeProgress = status.progress

      if (status.status === 'completed') {
        ElMessage.success('Scope分析完成')
      } else if (status.status === 'failed') {
        workflowState.errors.scope = status.error || 'Scope分析失败'
        ElMessage.error(workflowState.errors.scope)
      }

      return status
    } catch (error) {
      workflowState.errors.scope = error instanceof Error ? error.message : '获取Scope状态失败'
      ElMessage.error(workflowState.errors.scope)
      throw error
    }
  }

  // 轮询Scope Agent状态
  const pollScopeAgentStatus = async (interval: number = 3000) => {
    if (!workflowState.scopeTaskId) {
      return
    }

    const poll = async () => {
      try {
        const status = await getScopeAgentStatus()

        if (status && (status.status === 'completed' || status.status === 'failed')) {
          // 任务完成或失败，停止轮询
          return
        }

        // 继续轮询
        setTimeout(poll, interval)
      } catch (error) {
        console.error('轮询Scope状态失败:', error)
        setTimeout(poll, interval)
      }
    }

    setTimeout(poll, interval)
  }

  // 生成标题
  const generateTitles = async () => {
    if (!hasResearchBrief.value || !hasSearchResults.value) {
      ElMessage.error('研究简报或搜索数据不完整')
      return
    }

    workflowState.isGeneratingTitles = true
    workflowState.errors.title = undefined
    workflowState.titleProgress = 0

    try {
      const request: TitleGenerationRequest = {
        research_brief: workflowState.researchBrief,
        web_search_data: workflowState.searchResults
      }

      const response: TitleGenerationResponse =
        await documentGenerateService.generateTitles(request)

      workflowState.generatedTitles = response.titles
      workflowState.titleProgress = 100

      ElMessage.success(`成功生成 ${response.title_count} 个标题`)
      return response
    } catch (error) {
      workflowState.errors.title = error instanceof Error ? error.message : '标题生成失败'
      ElMessage.error(workflowState.errors.title)
      throw error
    } finally {
      workflowState.isGeneratingTitles = false
    }
  }

  // 生成大纲
  const generateOutline = async () => {
    if (!hasSelectedTitle.value || !hasSearchResults.value) {
      ElMessage.error('未选择标题或搜索数据不完整')
      return
    }

    workflowState.isGeneratingOutline = true
    workflowState.errors.outline = undefined
    workflowState.outlineProgress = 0

    try {
      const request: OutlineGenerationRequest = {
        title: workflowState.selectedTitle!,
        research_brief: workflowState.researchBrief,
        web_search_data: workflowState.searchResults
      }

      const response: OutlineGenerationResponse =
        await documentGenerateService.generateOutline(request)

      workflowState.generatedOutline = response.outline
      workflowState.outlineProgress = 100

      ElMessage.success('大纲生成成功')
      return response
    } catch (error) {
      workflowState.errors.outline = error instanceof Error ? error.message : '大纲生成失败'
      ElMessage.error(workflowState.errors.outline)
      throw error
    } finally {
      workflowState.isGeneratingOutline = false
    }
  }

  // 检查服务状态
  const checkServiceStatus = async () => {
    try {
      const status = await documentGenerateService.checkServiceStatus()
      return status
    } catch (error) {
      ElMessage.error('服务状态检查失败')
      throw error
    }
  }

  // 执行完整的工作流
  const executeDocumentWorkflow = async () => {
    try {
      // 1. 执行Scope Agent（如果提供了查询）
      if (workflowState.researchBrief) {
        await executeScopeAgent(workflowState.researchBrief)
      }

      // 2. 生成标题
      if (canGenerateTitles.value) {
        await generateTitles()
      }

      // 3. 生成大纲（如果选择了标题）
      if (canGenerateOutline.value) {
        await generateOutline()
      }

      ElMessage.success('文档生成工作流执行成功')
    } catch (error) {
      ElMessage.error('文档生成工作流执行失败')
      throw error
    }
  }

  // 重置工作流状态
  const resetWorkflow = () => {
    Object.assign(workflowState, {
      currentStep: 'requirements',
      researchBrief: '',
      searchResults: [],
      generatedTitles: [],
      selectedTitle: null,
      generatedOutline: [],
      scopeTaskId: null,
      titleTaskId: null,
      outlineTaskId: null,
      scopeProgress: 0,
      titleProgress: 0,
      outlineProgress: 0,
      isGeneratingScope: false,
      isGeneratingTitles: false,
      isGeneratingOutline: false,
      errors: {}
    })
  }

  // 导航到下一步
  const proceedToNextStep = async () => {
    if (!canProceedToNextStep.value) {
      ElMessage.warning('当前步骤未完成')
      return
    }

    const steps = ['requirements', 'title', 'outline', 'content', 'complete']
    const currentIndex = steps.indexOf(workflowState.currentStep)

    if (currentIndex < steps.length - 1) {
      workflowState.currentStep = steps[currentIndex + 1] as any

      // 路由导航
      const routeMap = {
        title: '/document-generation/title',
        outline: '/document-generation/outline',
        content: '/document-generation/content'
      }

      const nextRoute = routeMap[workflowState.currentStep as keyof typeof routeMap]
      if (nextRoute) {
        await router.push(nextRoute + '/' + workflowState.projectId)
      }
    }
  }

  // 返回上一步
  const goToPreviousStep = async () => {
    const steps = ['requirements', 'title', 'outline', 'content', 'complete']
    const currentIndex = steps.indexOf(workflowState.currentStep)

    if (currentIndex > 0) {
      workflowState.currentStep = steps[currentIndex - 1] as any

      // 路由导航
      const routeMap = {
        requirements: '/document-generation/requirements',
        title: '/document-generation/title',
        outline: '/document-generation/outline'
      }

      const prevRoute = routeMap[workflowState.currentStep as keyof typeof routeMap]
      if (prevRoute) {
        await router.push(prevRoute + '/' + workflowState.projectId)
      }
    }
  }

  return {
    // 状态
    workflowState,

    // 计算属性
    hasResearchBrief,
    hasSearchResults,
    hasGeneratedTitles,
    hasSelectedTitle,
    hasGeneratedOutline,
    canGenerateTitles,
    canGenerateOutline,
    canProceedToNextStep,

    // 方法
    setProjectId,
    setUserId,
    setResearchBrief,
    setSearchResults,
    selectTitle,
    executeScopeAgent,
    getScopeAgentStatus,
    pollScopeAgentStatus,
    generateTitles,
    generateOutline,
    checkServiceStatus,
    executeDocumentWorkflow,
    resetWorkflow,
    proceedToNextStep,
    goToPreviousStep
  }
}

// 类型定义已导出，无需重复导出
// export type { DocumentWorkflowState }
