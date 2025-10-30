/**
 * 需求页面组合式函数
 *
 * 职责：专注于需求页面的 UI 逻辑和表单管理
 * 状态来源：从 useDocumentGenerateStore 获取
 */

import { reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
import { useProjectStore } from '@/store/modules/project'
import type { FormInstance, FormRules } from 'element-plus'

export interface RequirementsForm {
  topic: string
  targetAudience: string
  documentType: string
  wordCount: number
  tone: string
  keyPoints: string[]
  specialRequirements: string
}

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

  // 验证状态
  isFormValid: boolean
  validationErrors: Record<string, string>
}

export function useRequirements() {
  // 获取 Store 状态
  const documentStore = useDocumentGenerateStore()
  const projectStore = useProjectStore()

  const { documentState, loading } = storeToRefs(documentStore)

  // 状态对象
  const state = reactive<RequirementsState>({
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
    editableBriefing: '',
    isFormValid: false,
    validationErrors: {}
  })

  // 表单验证规则
  const rules: FormRules = {
    topic: [
      { required: true, message: '请输入文档主题', trigger: 'blur' },
      { min: 2, max: 100, message: '主题长度应在2-100个字符之间', trigger: 'blur' }
    ],
    targetAudience: [{ required: true, message: '请选择目标受众', trigger: 'change' }],
    documentType: [{ required: true, message: '请选择文档类型', trigger: 'change' }],
    wordCount: [{ required: true, message: '请设置预期字数', trigger: 'blur' }],
    tone: [{ required: true, message: '请选择语气风格', trigger: 'change' }]
  }

  // 计算属性
  const canGenerateBriefing = computed(() => {
    return !!(
      state.form.topic &&
      state.form.targetAudience &&
      state.form.documentType &&
      state.form.tone
    )
  })

  const canConfirmRequirements = computed(() => {
    return canGenerateBriefing.value && documentState.value.researchBrief.length > 10
  })

  const hasScopeTask = computed(() => {
    const task = documentState.value.scopeTask
    if (!task) return false

    // 检查任务是否有效（未过期且未完成）
    const now = Date.now()
    const taskAge = now - task.createdAt
    const EXPIRED_THRESHOLD = 30 * 60 * 1000 // 30分钟

    // 如果任务过期，直接返回 false
    if (taskAge > EXPIRED_THRESHOLD) {
      return false
    }

    // 只有pending或running状态才认为有有效任务
    return task.status === 'pending' || task.status === 'running'
  })

  const scopeTaskStatus = computed(() => {
    return documentState.value.scopeTask?.status || null
  })

  // 初始化：从路由和store加载数据
  const initializeFromStore = async () => {
    try {
      // 从研究简报中提取需求信息（如果存在）
      if (documentState.value.researchBrief) {
        // 这里可以实现解析逻辑，暂时保持原表单数据
      }
    } catch (error) {
      console.error('初始化数据失败:', error)
    }
  }

  // 加载项目信息
  const loadProject = async (projectId: string) => {
    try {
      if (!projectId) {
        ElMessage.error('项目ID不存在')
        return null
      }

      const numericProjectId = Number(projectId)

      // 如果 store 中已有当前项目且ID匹配，直接返回
      if (
        projectStore.currentProject &&
        Number(projectStore.currentProject.id) === numericProjectId
      ) {
        return projectStore.currentProject
      }

      // 如果项目列表为空，先加载项目列表
      if (projectStore.projects.length === 0) {
        try {
          await projectStore.fetchProjects()
        } catch (error) {
          console.error('加载项目列表失败:', error)
        }
      }

      // 从项目列表中查找
      const project = projectStore.projects.find((p) => Number(p.id) === numericProjectId)
      if (project) {
        projectStore.setCurrentProject(project)
        return project
      }

      // 如果项目列表中没有，尝试从API获取
      try {
        const projectServiceModule = await import('@/services/projectService')
        const projectService = projectServiceModule.projectService
        const response = await projectService.getProjectDetail(numericProjectId)

        if (response.project) {
          projectStore.setCurrentProject(response.project)
          return response.project
        }
      } catch (apiError) {
        console.error('从API获取项目失败:', apiError)
        ElMessage.error('项目不存在或已被删除')
        return null
      }

      ElMessage.error('未找到项目')
      return null
    } catch (error) {
      console.error('加载项目失败:', error)
      ElMessage.error('加载项目信息失败')
      return null
    }
  }

  // 添加关键要点
  const addKeyPoint = () => {
    const point = state.currentKeyPoint.trim()
    if (point && !state.form.keyPoints.includes(point)) {
      state.form.keyPoints.push(point)
      state.currentKeyPoint = ''
    }
  }

  // 移除关键要点
  const removeKeyPoint = (index: number) => {
    state.form.keyPoints.splice(index, 1)
  }

  // 验证表单
  const validateForm = async (formRef?: FormInstance): Promise<boolean> => {
    if (!formRef) return false

    try {
      await formRef.validate()
      state.validationErrors = {}
      state.isFormValid = true
      return true
    } catch (errors) {
      state.isFormValid = false
      state.validationErrors = errors as Record<string, string>
      return false
    }
  }

  // 生成 AI 简报 - 使用 Scope Agent
  const generateAIBriefing = async (formRef?: FormInstance) => {
    const isValid = await validateForm(formRef)
    if (!isValid) {
      ElMessage.error('请完善表单信息')
      return
    }

    const currentProject = projectStore.currentProject
    if (!currentProject) {
      ElMessage.error('项目信息未加载，请刷新页面重试')
      return
    }

    try {
      state.isGeneratingBriefing = true

      // 构建查询内容（用于 Scope Agent 进行范围分析）
      const query = buildResearchQuery(state.form)

      // 调用 Scope Agent
      const response = await documentStore.executeScopeAgent(
        currentProject.user_id,
        currentProject.id,
        query
      )

      if (response.success) {
        ElMessage.success('AI简报生成任务已启动，正在后台处理')
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'AI简报生成失败'
      ElMessage.error(msg)
    } finally {
      state.isGeneratingBriefing = false
    }
  }

  // 构建研究查询（用于 Scope Agent）
  const buildResearchQuery = (form: RequirementsForm): string => {
    const query = `# 文档创作需求

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

    return query
  }

  // 构建研究简报（格式化后的内容）
  const buildResearchBrief = (form: RequirementsForm): string => {
    const brief = `# 文档创作需求

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

    return brief
  }

  // 清理过期的 Scope 任务（使用 Store 的统一清理方法）
  const cleanupExpiredScopeTask = () => {
    documentStore.cleanupExpiredTasks()
  }

  // 监听 Scope 任务状态变化
  watch(
    () => documentState.value.scopeTask,
    (task) => {
      // 立即清理过期的任务
      cleanupExpiredScopeTask()

      if (task) {
        state.isExecutingScope = task.status === 'pending' || task.status === 'running'
      } else {
        state.isExecutingScope = false
      }
    },
    { immediate: true }
  )

  // 监听研究简报变化
  watch(
    () => documentState.value.researchBrief,
    (brief) => {
      // 研究简报更新时，可以同步到表单或其他UI状态
      if (brief && brief.length > 10) {
        // 已生成简报
      }
    },
    { immediate: true }
  )

  // 编辑简报
  const editBriefing = () => {
    state.editableBriefing = documentState.value.researchBrief
    state.briefingDialogVisible = true
  }

  // 保存简报
  const saveBriefing = () => {
    if (state.editableBriefing.trim()) {
      documentStore.updateResearchBrief(state.editableBriefing)
      ElMessage.success('简报已更新')
    }
    state.briefingDialogVisible = false
  }

  // 确认需求
  const confirmRequirements = async (): Promise<boolean> => {
    if (!canConfirmRequirements.value) {
      ElMessage.warning('请先生成AI简报')
      return false
    }

    try {
      // 保存到 store
      documentStore.updateResearchBrief(buildResearchBrief(state.form))
      ElMessage.success('需求已确认')

      // 导航到标题选择页面
      const currentProject = projectStore.currentProject
      if (currentProject) {
        return true
      }
      return false
    } catch {
      ElMessage.error('保存失败')
      return false
    }
  }

  // 保存需求数据
  const saveRequirements = () => {
    const data = {
      form: state.form,
      researchBrief: documentState.value.researchBrief,
      updatedAt: new Date().toISOString()
    }

    const currentProject = projectStore.currentProject
    if (currentProject) {
      localStorage.setItem(`project_${currentProject.id}_requirements`, JSON.stringify(data))
    }
  }

  // 加载需求数据
  const loadRequirements = () => {
    const currentProject = projectStore.currentProject
    if (!currentProject) return

    const saved = localStorage.getItem(`project_${currentProject.id}_requirements`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.form) {
          Object.assign(state.form, data.form)
        }
        if (data.researchBrief) {
          documentStore.updateResearchBrief(data.researchBrief)
        }
      } catch (error) {
        console.error('加载需求数据失败:', error)
      }
    }

    // 清理过期的 Scope 任务
    cleanupExpiredScopeTask()
  }

  // 重置表单
  const resetForm = () => {
    state.form = {
      topic: '',
      targetAudience: '',
      documentType: '',
      wordCount: 2000,
      tone: 'professional',
      keyPoints: [],
      specialRequirements: ''
    }
    state.currentKeyPoint = ''
    state.isFormValid = false
    state.validationErrors = {}
  }

  // 助手函数
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

  // 获取任务进度
  const getTaskProgress = computed(() => {
    const task = documentState.value.scopeTask
    if (!task || !hasScopeTask.value) return 0
    return task.progress || 0
  })

  // 获取任务状态文本
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

  return {
    // 状态
    state,
    documentState,
    loading,

    // 验证规则
    rules,

    // 计算属性
    canGenerateBriefing,
    canConfirmRequirements,
    hasScopeTask,
    scopeTaskStatus,
    getTaskProgress,
    getTaskStatusText,

    // 方法
    initializeFromStore,
    loadProject,
    addKeyPoint,
    removeKeyPoint,
    validateForm,
    generateAIBriefing,
    editBriefing,
    saveBriefing,
    confirmRequirements,
    saveRequirements,
    loadRequirements,
    resetForm,

    // 助手函数
    getDocumentTypeText,
    getAudienceText,
    getToneText
  }
}
