/**
 * 选题策划组合式函数（优化版）
 *
 * 职责：管理选题页面的所有功能和状态
 *
 * 主要功能：
 * 1. 管理需求定义表单状态（主题、关键要点、特殊要求）
 * 2. 处理 AI 简报生成和编辑
 * 3. 执行 Scope Agent 流程
 * 4. 生成和选择标题
 * 5. 步骤导航控制
 * 6. 管理搜索结果
 * 7. 统一管理AI任务与数据库同步
 *
 * 状态来源：从 useDocumentGenerateStore 获取
 *
 * 优化点：
 * - 集成数据库同步服务，确保AI任务完成后数据正确保存
 * - 改善任务状态管理和错误处理
 * - 简化重复逻辑，提高可维护性
 * - 添加任务重试机制和进度追踪
 *
 * @since 2025-11-08 优化AI功能与数据库更新的融合
 * @since 2024-11-03 简化表单结构，移除目标受众、文档类型等字段
 * @since 2024-11-03 整合所有通用方法，独立使用不依赖其他组合式函数
 */

import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
import { useProjectStore } from '@/store/modules/project'
import type { Title } from '@/types/ai'
import type { FormInstance } from 'element-plus'
import { databaseSyncService } from '@/services/databaseSyncService'

/**
 * 需求表单状态接口
 * @description 简化的需求定义表单状态
 * @since 2024-11-03 移除了目标受众、文档类型、预期字数、语气风格等字段
 */
export interface RequirementsState {
  /** 表单数据 */
  form: {
    /** 文档主题或标题 */
    topic: string
    /** 关键要点列表 */
    keyPoints: string[]
    /** 特殊要求 */
    specialRequirements: string
  }
  /** 当前输入的关键要点 */
  currentKeyPoint: string

  /** 是否正在生成AI简报 */
  isGeneratingBriefing: boolean
  /** 是否正在执行Scope任务 */
  isExecutingScope: boolean

  /** 编辑简报对话框是否可见 */
  briefingDialogVisible: boolean
  /** 可编辑的简报内容 */
  editableBriefing: string
}

/**
 * 标题生成状态接口
 * @description 管理标题生成相关的所有状态
 */
export interface TitleGenerationState {
  /** 是否正在生成标题 */
  isGenerating: boolean
  /** 生成进度百分比 */
  progress: number
  /** 错误信息 */
  error: string | null
  /** 已生成的标题列表 */
  generatedTitles: Title[]
  /** 当前选中的标题 */
  selectedTitle: Title | null
  /** 自定义关键词列表 */
  customKeywords: string[]
}

/**
 * 选题策划组合式函数
 */
export function useTopicSelection() {
  const router = useRouter()

  // 获取 Store 状态
  const documentStore = useDocumentGenerateStore()
  const projectStore = useProjectStore()
  const { documentState, loading } = storeToRefs(documentStore)

  // ==================== 需求定义状态 ====================
  const requirementsState = reactive<RequirementsState>({
    form: {
      topic: '',
      keyPoints: [],
      specialRequirements: ''
    },
    currentKeyPoint: '',
    isGeneratingBriefing: false,
    isExecutingScope: false,
    briefingDialogVisible: false,
    editableBriefing: ''
  })

  // ==================== 标题生成状态 ====================
  const customKeywords = ref<string[]>([])
  const titleState = reactive<TitleGenerationState>({
    isGenerating: false,
    progress: 0,
    error: null,
    generatedTitles: [],
    selectedTitle: null,
    customKeywords: []
  })

  // ==================== 计算属性 ====================

  // 需求相关计算属性
  const canGenerateBriefing = computed(() => {
    return !!requirementsState.form.topic
  })

  const canConfirmRequirements = computed(() => {
    return canGenerateBriefing.value && documentState.value.researchBrief.length > 10
  })

  const hasScopeTask = computed(() => {
    const task = documentState.value.scopeTask
    console.log('[DEBUG] hasScopeTask - task:', task)

    if (!task) {
      console.log('[DEBUG] hasScopeTask - no task found, returning false')
      return false
    }

    const now = Date.now()
    const taskAge = now - task.createdAt
    const EXPIRED_THRESHOLD = 60 * 60 * 1000 // 延长到60分钟

    console.log('[DEBUG] hasScopeTask - taskAge:', taskAge, 'threshold:', EXPIRED_THRESHOLD)
    console.log('[DEBUG] hasScopeTask - now:', now, 'task.createdAt:', task.createdAt)

    // 修复时间戳异常检查 - 如果任务时间戳是未来时间，则认为任务无效
    if (task.createdAt > now) {
      console.log('[DEBUG] hasScopeTask - future timestamp detected, clearing task')
      // 清理无效任务
      documentStore.updateDocumentState({ scopeTask: null })
      return false
    }

    // 放宽过期时间限制，避免过早清理正在执行的任务
    if (taskAge > EXPIRED_THRESHOLD && (task.status === 'completed' || task.status === 'failed')) {
      console.log('[DEBUG] hasScopeTask - task expired and completed/failed, returning false')
      // 只清理已完成的过期任务
      documentStore.updateDocumentState({ scopeTask: null })
      return false
    }

    const isActive = task.status === 'pending' || task.status === 'running'
    console.log('[DEBUG] hasScopeTask - task status:', task.status, 'isActive:', isActive)

    // 如果任务已完成但状态未更新，清理任务
    if (task.status === 'completed' || task.status === 'failed') {
      console.log('[DEBUG] hasScopeTask - task completed/failed but not cleared, clearing task')
      documentStore.updateDocumentState({ scopeTask: null })
      return false
    }

    return isActive
  })

  const scopeTaskStatus = computed(() => {
    return documentState.value.scopeTask?.status || null
  })

  // ====== 标题相关计算属性 ======
  const hasGeneratedTitles = computed(() => documentState.value.generatedTitles.length > 0)
  const hasSelectedTitle = computed(() => documentState.value.selectedTitle !== null)
  const hasTitleSearchResults = computed(() => documentState.value.titleSearchResults.length > 0)

  const canGenerateTitles = computed(() => {
    return hasTitleSearchResults.value && documentState.value.researchBrief.length > 0
  })

  const canGenerateSearch2Title = computed(() => {
    return documentState.value.researchBrief && !titleState.isGenerating
  })

  // ====== 任务进度相关计算属性 ======
  const getTaskProgress = computed(() => {
    const task = documentState.value.scopeTask
    if (!task || !hasScopeTask.value) return 0
    return task.progress || 0
  })

  const getTaskStatusText = computed(() => {
    const task = documentState.value.scopeTask
    if (!task || !hasScopeTask.value) return ''

    const status = task.status
    switch (status) {
      case 'pending':
        return '等待执行'
      case 'running':
        return '正在生成'
      case 'completed':
        return '生成完成'
      case 'failed':
        return '生成失败'
      default:
        return ''
    }
  })

  // ==================== 数据库同步方法 ====================

  /**
   * 处理Scope任务完成后的数据库同步
   */
  const handleScopeTaskCompleted = async (task: any) => {
    try {
      ElMessage.info('正在同步研究简报到数据库...')

      const result = await databaseSyncService.syncScopeAgentResult(task, (updates) =>
        documentStore.updateDocumentState(updates)
      )

      if (result.success) {
        ElMessage.success('研究简报已成功保存到数据库')
      } else {
        const errorMsg = result.errors.join(', ')
        ElMessage.warning(`部分数据同步失败: ${errorMsg}`)
        console.error('Scope任务同步失败:', result.errors)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '同步失败'
      ElMessage.error(`数据同步出错: ${errorMsg}`)
      console.error('Scope任务同步错误:', error)
    }
  }

  /**
   * 处理Search2Title任务完成后的数据库同步
   */
  const handleSearch2TitleTaskCompleted = async (task: any) => {
    try {
      ElMessage.info('正在同步标题和搜索结果到数据库...')

      const result = await databaseSyncService.syncSearch2TitleResult(task, (updates) =>
        documentStore.updateDocumentState(updates)
      )

      if (result.success) {
        const syncedItems = Object.entries(result.synced)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join('、')

        ElMessage.success(`已成功保存到数据库: ${syncedItems}`)
      } else {
        const errorMsg = result.errors.join(', ')
        ElMessage.warning(`部分数据同步失败: ${errorMsg}`)
        console.error('Search2Title任务同步失败:', result.errors)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '同步失败'
      ElMessage.error(`数据同步出错: ${errorMsg}`)
      console.error('Search2Title任务同步错误:', error)
    }
  }

  /**
   * 重试失败的任务
   */
  const retryFailedTask = async (taskType: 'scope' | 'search2title') => {
    try {
      const currentProject = projectStore.currentProject
      if (!currentProject) {
        ElMessage.error('项目信息未加载，请刷新页面重试')
        return
      }

      switch (taskType) {
        case 'scope':
          if (requirementsState.form.topic) {
            await generateAIBriefing()
          }
          break

        case 'search2title':
          if (documentState.value.researchBrief) {
            const currentProject = projectStore.currentProject
            if (currentProject) {
              await executeSearch2Title(String(currentProject.id))
            }
          }
          break
      }

      ElMessage.success('任务已重新启动')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '重试失败'
      ElMessage.error(errorMsg)
      console.error('重试任务失败:', error)
    }
  }

  // ==================== 需求定义方法 ====================

  // 添加关键要点
  const addKeyPoint = () => {
    const point = requirementsState.currentKeyPoint.trim()
    if (point && !requirementsState.form.keyPoints.includes(point)) {
      requirementsState.form.keyPoints.push(point)
      requirementsState.currentKeyPoint = ''
    }
  }

  // 移除关键要点
  const removeKeyPoint = (index: number) => {
    requirementsState.form.keyPoints.splice(index, 1)
  }

  // 生成AI简报
  const generateAIBriefing = async (formRef?: FormInstance) => {
    if (!formRef) return

    try {
      await formRef.validate()
    } catch {
      ElMessage.error('请完善表单信息')
      return
    }

    const currentProject = projectStore.currentProject
    if (!currentProject) {
      ElMessage.error('项目信息未加载，请刷新页面重试')
      return
    }

    try {
      requirementsState.isGeneratingBriefing = true

      const query = buildResearchQuery(requirementsState.form)

      const response = await documentStore.executeScopeAgent(
        String(currentProject.user_id),
        String(currentProject.id),
        query
      )

      if (response?.success) {
        ElMessage.success('AI简报生成任务已启动，正在后台处理')
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'AI简报生成失败'
      ElMessage.error(msg)
    } finally {
      requirementsState.isGeneratingBriefing = false
    }
  }

  /**
   * 构建研究查询字符串
   * @param form - 需求表单数据
   * @returns 格式化的研究查询字符串
   * @description 将表单数据转换为 Markdown 格式的研究简报请求
   */
  const buildResearchQuery = (form: RequirementsState['form']): string => {
    const keyPointsSection =
      form.keyPoints.length > 0
        ? form.keyPoints.map((point) => `- ${point}`).join('\n')
        : '- 暂无关键要点'

    const specialRequirementsSection = form.specialRequirements.trim()
      ? form.specialRequirements.trim()
      : '无'

    return `# 文档创作需求

## 基本信息
- **主题**: ${form.topic}

## 关键要点
${keyPointsSection}

## 特殊要求
${specialRequirementsSection}

---

请基于以上需求，生成详细的研究简报，包括背景分析、内容结构建议、关键词建议等。
`
  }

  // 编辑简报
  const editBriefing = () => {
    requirementsState.editableBriefing = documentState.value.researchBrief
    requirementsState.briefingDialogVisible = true
  }

  // 保存简报
  const saveBriefing = () => {
    if (requirementsState.editableBriefing.trim()) {
      documentStore.updateResearchBrief(requirementsState.editableBriefing)
      ElMessage.success('简报已更新')
    }
    requirementsState.briefingDialogVisible = false
  }

  // ==================== 标题相关方法 ====================

  // 注意：selectTitle 方法已移除，使用 useDocumentGenerate 的 selectTitle

  // 提取关键词
  const extractKeywords = (brief: string) => {
    if (!brief) return

    // 简单的关键词提取逻辑
    const keywords = brief
      .split(/[,，、\s]+/)
      .filter((word) => word.length > 1 && word.length < 10)
      .slice(0, 10)

    customKeywords.value = keywords
  }

  // 添加自定义关键词
  const addCustomKeyword = (keyword: string) => {
    if (keyword && !customKeywords.value.includes(keyword)) {
      customKeywords.value.push(keyword)
    }
  }

  // 移除自定义关键词
  const removeCustomKeyword = (keyword: string) => {
    const index = customKeywords.value.indexOf(keyword)
    if (index > -1) {
      customKeywords.value.splice(index, 1)
    }
  }

  // 执行Search2Title
  const executeSearch2Title = async (projectId: string) => {
    if (!documentState.value.researchBrief) {
      ElMessage.warning('请先完善研究简报')
      return
    }

    try {
      const response = await documentStore.executeSearch2TitleAgent(
        'user-id',
        projectId,
        documentState.value.researchBrief
      )

      if (response) {
        ElMessage.success('Search2Title任务已启动，正在执行中...')
      }
    } catch {
      ElMessage.error('Search2Title执行失败')
    }
  }

  // 取消Search2Title任务
  const cancelSearch2Title = async (projectId: string) => {
    const search2titleTask = documentState.value.search2titleTask
    if (!search2titleTask) {
      ElMessage.warning('没有正在执行的任务')
      return
    }

    try {
      const success = await documentStore.cancelSearch2TitleTask(
        search2titleTask.taskId,
        'user-id',
        projectId
      )

      if (success) {
        ElMessage.success('任务已取消')
        // 不需要手动清理状态，store中的cancelSearch2TitleTask方法会更新状态
      } else {
        ElMessage.error('取消任务失败')
      }
    } catch (error) {
      console.error('取消Search2Title任务失败:', error)
      ElMessage.error('取消任务失败')
    }
  }

  // 取消Scope任务
  const cancelScopeTask = async () => {
    const scopeTask = documentState.value.scopeTask
    if (!scopeTask) {
      ElMessage.warning('没有正在执行的任务')
      return
    }

    try {
      const success = await documentStore.cancelTask(scopeTask.taskId)

      if (success) {
        ElMessage.success('任务已取消')
        // 清理本地任务状态
        documentStore.updateDocumentState({ scopeTask: null })
      } else {
        ElMessage.error('取消任务失败')
      }
    } catch (error) {
      console.error('取消Scope任务失败:', error)
      ElMessage.error('取消任务失败')
    }
  }

  // ==================== 通用标题操作 ====================

  // 选择标题
  const selectTitle = (title: Title) => {
    documentStore.selectTitle(title)
    ElMessage.success('标题已选择')
  }

  // 执行 Scope Agent
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

  // ==================== 步骤导航 ====================

  // 当前步骤是否可继续
  const canProceedToNextStep = computed(() => {
    switch (documentState.value.currentStep) {
      case 'requirements':
        return documentState.value.researchBrief.length > 10 && hasTitleSearchResults.value
      case 'title':
        return hasSelectedTitle.value
      case 'outline':
        return documentState.value.generatedOutline.length > 0
      case 'content':
        return true
      default:
        return false
    }
  })

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
        title: '/document-generation/topic-selection',
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
      const routeMap: Record<string, string> = {
        outline: '/document-generation/outline'
      }

      // requirements和title都使用topic-selection页面
      if (prevStep === 'requirements' || prevStep === 'title') {
        routeMap[prevStep] = '/document-generation/topic-selection'
      }

      const prevRoute = routeMap[prevStep]
      if (prevRoute) {
        const currentProject = projectStore.currentProject
        if (currentProject) {
          await router.push(prevRoute + '/' + currentProject.id)
        }
      }
    }
  }

  // ==================== 状态监听 ====================

  // 监听Scope任务状态变化（优化版）
  watch(
    () => documentState.value.scopeTask,
    async (task, oldTask) => {
      console.log('[DEBUG] scopeTask watcher - task:', task, 'oldTask:', oldTask)

      if (task) {
        const shouldExecute = task.status === 'pending' || task.status === 'running'
        console.log(
          '[DEBUG] scopeTask watcher - task.status:',
          task.status,
          'shouldExecute:',
          shouldExecute
        )
        requirementsState.isExecutingScope = shouldExecute

        // 任务完成时更新研究简报并同步到数据库
        if (task.status === 'completed' && task.result?.research_brief) {
          console.log('[DEBUG] scopeTask watcher - task completed, updating and syncing')

          // 更新前端状态
          documentStore.updateResearchBrief(task.result.research_brief)

          // 同步到数据库
          await handleScopeTaskCompleted(task)
        }

        // 任务失败时提示用户可以重试
        if (task.status === 'failed') {
          ElMessage.error('Scope分析任务失败，您可以点击重试按钮重新开始')
          console.log('[DEBUG] scopeTask watcher - task failed')
        }
      } else {
        console.log('[DEBUG] scopeTask watcher - no task, setting isExecutingScope to false')
        requirementsState.isExecutingScope = false
      }

      console.log(
        '[DEBUG] scopeTask watcher - final isExecutingScope:',
        requirementsState.isExecutingScope
      )
    },
    { immediate: true, deep: true }
  )

  // 监听Search2Title任务状态（优化版）
  watch(
    () => documentState.value.search2titleTask,
    async (task, oldTask) => {
      console.log('[DEBUG] search2titleTask watcher - task:', task, 'oldTask:', oldTask)

      if (task) {
        const isRunning = task.status === 'pending' || task.status === 'running'
        console.log(
          '[DEBUG] search2titleTask watcher - task.status:',
          task.status,
          'isRunning:',
          isRunning
        )

        // 任务完成时同步到数据库
        if (task.status === 'completed' && task.result) {
          console.log('[DEBUG] search2titleTask watcher - task completed, syncing to database')

          // 同步到数据库
          await handleSearch2TitleTaskCompleted(task)
        }

        // 任务失败时提示用户可以重试
        if (task.status === 'failed') {
          ElMessage.error('Search2Title任务失败，您可以点击重试按钮重新开始')
          console.log('[DEBUG] search2titleTask watcher - task failed')
        }
      } else {
        console.log('[DEBUG] search2titleTask watcher - no task')
      }
    },
    { immediate: true, deep: true }
  )

  // 监听标题生成状态
  watch(
    () => [documentState.value.generatedTitles, documentState.value.selectedTitle],
    () => {
      titleState.isGenerating = loading.value && documentState.value.titleTask?.status === 'running'
      titleState.progress = documentState.value.titleTask?.progress || 0
      titleState.error = documentState.value.titleTask?.error || null
      titleState.generatedTitles = documentState.value.generatedTitles || []
      titleState.selectedTitle = documentState.value.selectedTitle
    },
    { immediate: true }
  )

  // 同步自定义关键词
  watch(
    customKeywords,
    (newKeywords) => {
      titleState.customKeywords = newKeywords
    },
    { immediate: true }
  )

  // ==================== 返回值 ====================

  return {
    // 状态
    requirementsState,
    titleState,
    documentState,

    // 本地计算属性
    canGenerateBriefing,
    canConfirmRequirements,
    hasScopeTask,
    scopeTaskStatus,
    canGenerateSearch2Title,
    getTaskProgress,
    getTaskStatusText,

    // 标题相关计算属性
    hasGeneratedTitles,
    hasSelectedTitle,
    hasTitleSearchResults,
    canGenerateTitles,

    // 步骤导航
    canProceedToNextStep,

    // 方法 - 需求定义
    addKeyPoint,
    removeKeyPoint,
    generateAIBriefing,
    editBriefing,
    saveBriefing,

    // 方法 - 关键词管理
    extractKeywords,
    addCustomKeyword,
    removeCustomKeyword,

    // 方法 - 标题操作
    selectTitle,
    updateTitle: (oldTitle: Title, newTitle: Title) =>
      documentStore.updateTitle(oldTitle, newTitle),
    executeScopeAgent,
    generateTitles,
    executeSearch2Title,
    cancelSearch2Title,
    cancelScopeTask,

    // 方法 - 步骤导航
    proceedToNextStep,
    goToPreviousStep,

    // 新增：数据库同步相关方法
    handleScopeTaskCompleted,
    handleSearch2TitleTaskCompleted,
    retryFailedTask
  }
}
