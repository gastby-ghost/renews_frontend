/**
 * 文档生成组合式函数
 *
 * 职责：专注于 UI 逻辑和组件交互，不管理业务状态
 *
 * 状态来源：
 * - documentState: 从 useDocumentGenerateStore 获取
 * - projectState: 从 useProjectStore 获取
 */

import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
import { useProjectStore } from '@/store/modules/project'
import type { Title } from '@/types/ai'

/**
 * UI 状态接口
 */
export interface DocumentUIState {
  // 加载状态
  isExecutingScope: boolean
  isGeneratingTitles: boolean
  isGeneratingOutline: boolean

  // 错误状态
  errors: {
    scope?: string
    title?: string
    outline?: string
  }

  // 任务进度
  scopeProgress: number
  titleProgress: number
  outlineProgress: number
}

/**
 * 文档生成组合式函数
 */
export function useDocumentGenerate() {
  const router = useRouter()

  // 获取 Store 状态
  const documentStore = useDocumentGenerateStore()
  const projectStore = useProjectStore()

  const { documentState, loading, error } = storeToRefs(documentStore)

  // 计算属性：基于 Store 状态
  const hasResearchBrief = computed(() => documentState.value.researchBrief.length > 10)
  const hasSearchResults = computed(() => documentState.value.searchResults.length > 0)
  const hasGeneratedTitles = computed(() => documentState.value.generatedTitles.length > 0)
  const hasSelectedTitle = computed(() => documentState.value.selectedTitle !== null)
  const hasGeneratedOutline = computed(() => documentState.value.generatedOutline.length > 0)

  const canGenerateTitles = computed(() => hasResearchBrief.value && hasSearchResults.value)
  const canGenerateOutline = computed(() => hasSelectedTitle.value && hasSearchResults.value)

  // 当前步骤是否可继续
  const canProceedToNextStep = computed(() => {
    switch (documentState.value.currentStep) {
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

  // UI 状态
  const uiState = computed<DocumentUIState>(() => ({
    isExecutingScope: loading.value && documentState.value.scopeTask?.status === 'pending',
    isGeneratingTitles: loading.value && documentState.value.titleTask?.status === 'running',
    isGeneratingOutline: loading.value && documentState.value.outlineTask?.status === 'running',
    errors: {
      scope: error.value || undefined
    },
    scopeProgress: documentState.value.scopeTask?.progress || 0,
    titleProgress: documentState.value.titleTask?.progress || 0,
    outlineProgress: documentState.value.outlineTask?.progress || 0
  }))

  // 包装 Store 方法，提供 UI 反馈
  const executeScopeAgent = async (userId: string, projectId: string, query: string) => {
    try {
      const response = await documentStore.executeScopeAgent(userId, projectId, query)
      ElMessage.success('Scope分析任务已启动，正在后台处理')
      return response
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Scope分析失败'
      ElMessage.error(msg)
      throw error
    }
  }

  // 生成标题
  const generateTitles = async () => {
    if (!canGenerateTitles.value) {
      ElMessage.error('研究简报或搜索数据不完整')
      return
    }

    try {
      const response = await documentStore.generateTitles(
        documentState.value.researchBrief,
        documentState.value.searchResults
      )
      ElMessage.success(`成功生成 ${response?.title_count || 0} 个标题`)
      return response
    } catch (error) {
      const msg = error instanceof Error ? error.message : '标题生成失败'
      ElMessage.error(msg)
      throw error
    }
  }

  // 生成大纲
  const generateOutline = async () => {
    if (!canGenerateOutline.value) {
      ElMessage.error('未选择标题或搜索数据不完整')
      return
    }

    try {
      const response = await documentStore.generateOutline(
        documentState.value.selectedTitle!,
        documentState.value.researchBrief,
        documentState.value.searchResults
      )
      ElMessage.success('大纲生成成功')
      return response
    } catch (error) {
      const msg = error instanceof Error ? error.message : '大纲生成失败'
      ElMessage.error(msg)
      throw error
    }
  }

  // 选择标题
  const selectTitle = (title: Title) => {
    documentStore.selectTitle(title)
    ElMessage.success('标题已选择')
  }

  // 导航到下一步
  const proceedToNextStep = async () => {
    if (!canProceedToNextStep.value) {
      ElMessage.warning('当前步骤未完成')
      return
    }

    const steps = ['requirements', 'title', 'outline', 'content', 'complete']
    const currentIndex = steps.indexOf(documentState.value.currentStep)

    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1] as any
      documentStore.updateWorkflowStep(nextStep)

      // 路由导航
      const routeMap = {
        title: '/document-generation/title',
        outline: '/document-generation/outline',
        content: '/document-generation/content'
      }

      const nextRoute = routeMap[nextStep as keyof typeof routeMap]
      if (nextRoute) {
        const currentProject = projectStore.currentProject
        if (currentProject) {
          await router.push(nextRoute + '/' + currentProject.id)
        }
      }
    }
  }

  // 返回上一步
  const goToPreviousStep = async () => {
    const steps = ['requirements', 'title', 'outline', 'content', 'complete']
    const currentIndex = steps.indexOf(documentState.value.currentStep)

    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1] as any
      documentStore.updateWorkflowStep(prevStep)

      // 路由导航
      const routeMap = {
        requirements: '/document-generation/requirements',
        title: '/document-generation/title',
        outline: '/document-generation/outline'
      }

      const prevRoute = routeMap[prevStep as keyof typeof routeMap]
      if (prevRoute) {
        const currentProject = projectStore.currentProject
        if (currentProject) {
          await router.push(prevRoute + '/' + currentProject.id)
        }
      }
    }
  }

  return {
    // 状态
    documentState,
    uiState,

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
    executeScopeAgent,
    generateTitles,
    generateOutline,
    selectTitle,
    proceedToNextStep,
    goToPreviousStep
  }
}
