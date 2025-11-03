/**
 * 选题策划组合式函数
 *
 * 职责：统一管理需求定义和标题选择的 UI 逻辑
 * 将原来的 useRequirements 和 useTitleGeneration 合并为一个
 *
 * 状态来源：从 useDocumentGenerateStore 获取
 */

import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
import { useProjectStore } from '@/store/modules/project'
import type { Title, RequirementsForm } from '@/types/ai'
import type { FormInstance } from 'element-plus'

/**
 * 需求表单状态接口
 */
export interface RequirementsState {
  // 表单数据
  form: RequirementsForm
  currentKeyPoint: string

  // 加载状态
  isGeneratingBriefing: boolean
  isExecutingScope: boolean

  // 编辑状态
  briefingDialogVisible: boolean
  editableBriefing: string
}

/**
 * 标题生成状态接口
 */
export interface TitleGenerationState {
  isGenerating: boolean
  progress: number
  error: string | null
  generatedTitles: Title[]
  selectedTitle: Title | null
  customKeywords: string[]
}

/**
 * 选题策划组合式函数
 */
export function useTopicSelection() {
  // 获取 Store 状态
  const documentStore = useDocumentGenerateStore()
  const projectStore = useProjectStore()
  const { documentState, loading } = storeToRefs(documentStore)

  // ==================== 需求定义状态 ====================
  const requirementsState = reactive<RequirementsState>({
    form: {
      topic: '',
      targetAudience: '',
      documentType: '',
      wordCount: 2000,
      tone: 'professional',
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
    return !!(
      requirementsState.form.topic &&
      requirementsState.form.targetAudience &&
      requirementsState.form.documentType &&
      requirementsState.form.tone
    )
  })

  const canConfirmRequirements = computed(() => {
    return canGenerateBriefing.value && documentState.value.researchBrief.length > 10
  })

  const hasScopeTask = computed(() => {
    const task = documentState.value.scopeTask
    if (!task) return false

    const now = Date.now()
    const taskAge = now - task.createdAt
    const EXPIRED_THRESHOLD = 30 * 60 * 1000

    if (taskAge > EXPIRED_THRESHOLD) {
      return false
    }

    return task.status === 'pending' || task.status === 'running'
  })

  const scopeTaskStatus = computed(() => {
    return documentState.value.scopeTask?.status || null
  })

  // 标题相关计算属性
  const hasGeneratedTitles = computed(() => titleState.generatedTitles.length > 0)
  const hasSelectedTitle = computed(() => titleState.selectedTitle !== null)
  const canGenerateSearch2Title = computed(() => {
    return documentState.value.researchBrief && !titleState.isGenerating
  })

  // 任务进度
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

  // 构建研究查询
  const buildResearchQuery = (form: RequirementsForm): string => {
    return `# 文档创作需求

## 基本信息
- **主题**: ${form.topic}
- **目标受众**: ${getAudienceText(form.targetAudience)}
- **文档类型**: ${getDocumentTypeText(form.documentType)}
- **预期字数**: ${form.wordCount}字
- **语气风格**: ${getToneText(form.tone)}

## 关键要点
${form.keyPoints.map((point) => `- ${point}`).join('\n')}

## 特殊要求
${form.specialRequirements || '无'}

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

  // ==================== 标题生成方法 ====================

  // 选择标题
  const selectTitle = (title: Title) => {
    documentStore.selectTitle(title)
  }

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

  // ==================== 状态监听 ====================

  // 监听Scope任务状态变化
  watch(
    () => documentState.value.scopeTask,
    (task) => {
      if (task) {
        requirementsState.isExecutingScope = task.status === 'pending' || task.status === 'running'
      } else {
        requirementsState.isExecutingScope = false
      }
    },
    { immediate: true }
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

  // ==================== 助手函数 ====================

  const getDocumentTypeText = (type: string) => {
    const types: Record<string, string> = {
      analysis: '分析报告',
      press_release: '新闻稿',
      blog: '博客文章',
      technical_doc: '技术文档',
      marketing: '营销文案',
      product_description: '产品说明'
    }
    return types[type] || type
  }

  const getAudienceText = (audience: string) => {
    const audiences: Record<string, string> = {
      general: '普通大众',
      professional: '专业人士',
      executive: '企业决策者',
      technical: '技术人员',
      academic: '学术研究者',
      student: '学生群体'
    }
    return audiences[audience] || audience
  }

  const getToneText = (tone: string) => {
    const tones: Record<string, string> = {
      formal: '正式',
      casual: '轻松',
      professional: '专业',
      friendly: '友好',
      persuasive: '说服性',
      objective: '客观'
    }
    return tones[tone] || tone
  }

  // ==================== 返回值 ====================

  return {
    // 状态
    requirementsState,
    titleState,
    documentState,

    // 计算属性
    canGenerateBriefing,
    canConfirmRequirements,
    hasScopeTask,
    scopeTaskStatus,
    hasGeneratedTitles,
    hasSelectedTitle,
    canGenerateSearch2Title,
    getTaskProgress,
    getTaskStatusText,

    // 方法
    addKeyPoint,
    removeKeyPoint,
    generateAIBriefing,
    editBriefing,
    saveBriefing,
    selectTitle,
    extractKeywords,
    addCustomKeyword,
    removeCustomKeyword,
    executeSearch2Title,

    // 助手函数
    getDocumentTypeText,
    getAudienceText,
    getToneText
  }
}
