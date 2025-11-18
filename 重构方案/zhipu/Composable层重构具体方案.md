# Composable层重构具体方案

## 重构目标

将现有的复杂Composable结构重构为清晰、模块化的业务逻辑管理模式，确保Composable只负责业务逻辑处理、数据转换和Service调用，为View层提供简洁的业务接口。

## 当前Composable层问题分析

### 现有Composable结构问题

1. **职责混乱**: 单个Composable包含过多职责
2. **代码量过大**: `useTopicSelection.ts`(817行)、`useOutlinePage.ts`(1233行)
3. **业务逻辑分散**: 相关业务逻辑分散在多个Composable中
4. **重复代码**: 相似逻辑在多个Composable中重复
5. **测试困难**: 大型Composable难以进行单元测试
6. **依赖关系复杂**: Composable间存在循环依赖

### 现有Composable文件分析

```
src/composables/document/
├── useContent.ts         # ~600行，中等复杂度
├── useOutlinePage.ts     # ~1233行，过于复杂
├── useTopicSelection.ts  # ~817行，过于复杂
└── index.ts              # 导出文件
```

## 新Composable架构设计

### Composable目录结构

```
src/composables/
├── document/                        # 文档相关业务逻辑
│   ├── project/                     # 项目管理逻辑
│   │   ├── useProjectManagement.ts  # 项目CRUD操作
│   │   ├── useProjectNavigation.ts  # 项目导航逻辑
│   │   └── useProjectFilters.ts     # 项目过滤逻辑
│   ├── requirement/                 # 需求管理逻辑
│   │   ├── useRequirementForm.ts    # 需求表单管理
│   │   ├── useAIBriefing.ts         # AI简报生成
│   │   ├── useTitleGeneration.ts    # 标题生成逻辑
│   │   └── useWorkflowNavigation.ts # 工作流导航
│   ├── outline/                     # 大纲管理逻辑
│   │   ├── useOutlineEditor.ts      # 大纲编辑逻辑
│   │   ├── useAIOutlineGeneration.ts# AI大纲生成
│   │   ├── useChapterManagement.ts  # 章节管理
│   │   └── useMaterialBinding.ts    # 素材绑定逻辑
│   ├── content/                     # 内容创作逻辑
│   │   ├── useMarkdownEditor.ts     # Markdown编辑器
│   │   ├── useContentGeneration.ts  # 内容生成
│   │   ├── useAIAssistant.ts        # AI助手功能
│   │   └── useContentPreview.ts     # 内容预览
│   └── task/                        # 任务管理逻辑
│       ├── useTaskManagement.ts     # 任务创建和管理
│       ├── useTaskPolling.ts        # 任务状态轮询
│       └── useTaskErrorHandler.ts   # 任务错误处理
├── ui/                              # UI相关逻辑
│   ├── useLoading.ts                # 加载状态管理
│   ├── useDialog.ts                 # 对话框管理
│   ├── useNotification.ts           # 通知管理
│   ├── usePagination.ts             # 分页管理
│   └── useForm.ts                   # 表单管理
├── shared/                          # 共享逻辑
│   ├── useApi.ts                    # API调用封装
│   ├── useValidation.ts             # 表单验证
│   ├── useErrorHandler.ts           # 错误处理
│   ├── useDebounce.ts               # 防抖处理
│   └── useLocalStorage.ts           # 本地存储
└── adapters/                        # 适配器
    ├── topicSelectionAdapter.ts     # 选题策划适配器
    ├── outlinePageAdapter.ts        # 大纲页面适配器
    └── contentAdapter.ts            # 内容创作适配器
```

## 具体实现方案

### 1. 基础Composable设计模式

#### Composable接口定义

```typescript
// src/composables/types/base.ts
export interface ComposableResult<T = any> {
  // 状态
  state?: Ref<T> | Reactive<T>

  // 计算属性
  [key: string]: ComputedRef<any> | Ref<any> | ((...args: any[]) => any)
}

export interface AsyncComposableResult<T = any> extends ComposableResult<T> {
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: (...args: any[]) => Promise<any>
  reset: () => void
}

export interface PaginatedComposableResult<T = any> extends ComposableResult<T> {
  pagination: {
    page: Ref<number>
    pageSize: Ref<number>
    total: Ref<number>
    hasNext: ComputedRef<boolean>
    hasPrev: ComputedRef<boolean>
    nextPage: () => void
    prevPage: () => void
    goToPage: (page: number) => void
  }
}
```

#### Composable基类

```typescript
// src/composables/base/BaseComposable.ts
import { ref, computed } from 'vue'
import type { ComposableResult, AsyncComposableResult } from '../types/base'

export abstract class BaseComposable {
  protected loading = ref(false)
  protected error = ref<string | null>(null)

  protected setLoading(isLoading: boolean) {
    this.loading.value = isLoading
  }

  protected setError(error: string | null) {
    this.error.value = error
  }

  protected clearError() {
    this.error.value = null
  }

  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T | null> {
    this.setLoading(true)
    this.clearError()

    try {
      const result = await operation()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `${context}失败`
      this.setError(errorMessage)
      console.error(`[${context}]`, err)
      return null
    } finally {
      this.setLoading(false)
    }
  }

  protected reset() {
    this.loading.value = false
    this.error.value = null
  }
}
```

### 2. 共享Composable实现

#### API调用封装

```typescript
// src/composables/shared/useApi.ts
import { ref } from 'vue'
import type { BaseComposable } from '../base/BaseComposable'

interface ApiOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useApi<T = any>(url: string, options: ApiOptions = {}) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const execute = async (requestOptions?: any) => {
    loading.value = true
    error.value = null

    try {
      // 这里应该调用实际的API服务
      // const response = await apiService.request(url, requestOptions)
      // data.value = response.data

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000))
      data.value = {} as T

      options.onSuccess?.(data.value)
      return data.value
    } catch (err) {
      const apiError = err instanceof Error ? err : new Error('API请求失败')
      error.value = apiError
      options.onError?.(apiError)
      throw apiError
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    data.value = null
    loading.value = false
    error.value = null
  }

  // 立即执行
  if (options.immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}
```

#### 表单验证

```typescript
// src/composables/shared/useValidation.ts
import { ref, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (value: any) => boolean | string
  message?: string
}

interface ValidationRules {
  [key: string]: ValidationRule[]
}

export function useValidation<T extends Record<string, any>>(form: Ref<T>, rules: ValidationRules) {
  const errors = ref<Record<string, string>>({})
  const isValid = computed(() => Object.keys(errors.value).length === 0)

  const validateField = (field: keyof T): boolean => {
    const fieldRules = rules[field as string]
    if (!fieldRules) return true

    const value = form.value[field]
    const fieldErrors: string[] = []

    for (const rule of fieldRules) {
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        fieldErrors.push(rule.message || `${String(field)}是必填项`)
        continue
      }

      if (value && rule.min && typeof value === 'string' && value.length < rule.min) {
        fieldErrors.push(rule.message || `${String(field)}最少需要${rule.min}个字符`)
      }

      if (value && rule.max && typeof value === 'string' && value.length > rule.max) {
        fieldErrors.push(rule.message || `${String(field)}最多${rule.max}个字符`)
      }

      if (value && rule.pattern && !rule.pattern.test(value)) {
        fieldErrors.push(rule.message || `${String(field)}格式不正确`)
      }

      if (value && rule.validator) {
        const result = rule.validator(value)
        if (result !== true) {
          fieldErrors.push(typeof result === 'string' ? result : `${String(field)}验证失败`)
        }
      }
    }

    if (fieldErrors.length > 0) {
      errors.value[field as string] = fieldErrors[0]
      return false
    } else {
      delete errors.value[field as string]
      return true
    }
  }

  const validateAll = (): boolean => {
    let isValidAll = true
    for (const field in rules) {
      if (!validateField(field as keyof T)) {
        isValidAll = false
      }
    }
    return isValidAll
  }

  const validateWithElement = async (formRef: FormInstance | null): Promise<boolean> => {
    if (!formRef) return false

    try {
      await formRef.validate()
      return true
    } catch {
      return false
    }
  }

  const clearErrors = (field?: keyof T) => {
    if (field) {
      delete errors.value[field as string]
    } else {
      errors.value = {}
    }
  }

  const setError = (field: keyof T, message: string) => {
    errors.value[field as string] = message
  }

  return {
    errors,
    isValid,
    validateField,
    validateAll,
    validateWithElement,
    clearErrors,
    setError
  }
}
```

#### 错误处理

```typescript
// src/composables/shared/useErrorHandler.ts
import { ref } from 'vue'
import { useNotificationStore } from '@/store/modules/ui/notificationStore'

interface ErrorInfo {
  code?: string
  message: string
  context?: string
  timestamp: number
}

export function useErrorHandler() {
  const notificationStore = useNotificationStore()
  const lastError = ref<ErrorInfo | null>(null)

  const handleError = (error: Error | string, context?: string) => {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      context,
      timestamp: Date.now()
    }

    if (typeof error !== 'string' && error.name) {
      errorInfo.code = error.name
    }

    lastError.value = errorInfo

    // 显示用户友好的错误消息
    const userMessage = getUserFriendlyMessage(errorInfo.message)
    notificationStore.showError(userMessage)

    // 记录详细错误信息到控制台
    console.error(`[Error] ${context || 'Unknown'}`, error)

    // 发送错误到监控系统
    reportError(errorInfo)
  }

  const clearError = () => {
    lastError.value = null
  }

  const reportError = (errorInfo: ErrorInfo) => {
    // 这里可以集成错误监控服务
    // 例如: Sentry, LogRocket等
    if (process.env.NODE_ENV === 'production') {
      // sendToMonitoringService(errorInfo)
    }
  }

  const getUserFriendlyMessage = (technicalMessage: string): string => {
    // 技术错误消息到用户友好消息的映射
    const messageMap: Record<string, string> = {
      'Network Error': '网络连接失败，请检查网络设置',
      'Request timeout': '请求超时，请稍后重试',
      Unauthorized: '登录已过期，请重新登录',
      Forbidden: '没有权限执行此操作',
      'Not Found': '请求的资源不存在',
      'Internal Server Error': '服务器内部错误，请稍后重试'
    }

    for (const [technical, friendly] of Object.entries(messageMap)) {
      if (technicalMessage.includes(technical)) {
        return friendly
      }
    }

    return '操作失败，请稍后重试'
  }

  return {
    lastError,
    handleError,
    clearError
  }
}
```

### 3. 业务Composable实现

#### 项目管理Composable

```typescript
// src/composables/document/project/useProjectManagement.ts
import { ref, computed } from 'vue'
import { useProjectStore } from '@/store/modules/document/projectStore'
import { useLoadingStore } from '@/store/modules/ui/loadingStore'
import { useNotificationStore } from '@/store/modules/ui/notificationStore'
import { useErrorHandler } from '@/shared/useErrorHandler'
import { useValidation } from '@/shared/useValidation'
import projectService from '@/services/projectService'
import type { Project, ProjectCreateForm, ProjectUpdateForm } from '@/types/project'

const projectCreateRules = {
  name: [
    { required: true, message: '项目名称是必填项' },
    { min: 2, max: 50, message: '项目名称长度在2-50个字符之间' }
  ],
  description: [{ max: 500, message: '项目描述不能超过500个字符' }],
  type: [{ required: true, message: '项目类型是必填项' }]
}

export function useProjectManagement() {
  // Store实例
  const projectStore = useProjectStore()
  const loadingStore = useLoadingStore()
  const notificationStore = useNotificationStore()
  const { handleError } = useErrorHandler()

  // 表单状态
  const createForm = ref<ProjectCreateForm>({
    name: '',
    description: '',
    type: 'article'
  })

  const editForm = ref<ProjectUpdateForm>({
    name: '',
    description: '',
    type: 'article'
  })

  // 表单验证
  const createValidation = useValidation(createForm, projectCreateRules)
  const editValidation = useValidation(editForm, projectCreateRules)

  // 本地状态
  const searchKeyword = ref('')
  const showCreateDialog = ref(false)
  const showEditDialog = ref(false)

  // 计算属性
  const filteredProjects = computed(() => {
    let projects = projectStore.filteredProjects

    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      projects = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(keyword) ||
          project.description.toLowerCase().includes(keyword)
      )
    }

    return projects
  })

  const canCreateProject = computed(() => {
    return createValidation.isValid.value && createForm.value.name.trim().length > 0
  })

  const canUpdateProject = computed(() => {
    return editValidation.isValid.value && editForm.value.name.trim().length > 0
  })

  const isLoading = computed(() => ({
    creating: loadingStore.isLoading('project-create'),
    updating: loadingStore.isLoading('project-update'),
    deleting: loadingStore.isLoading('project-delete'),
    loading: loadingStore.isLoading('projects-load')
  }))

  // 业务方法
  const createProject = async () => {
    if (!createValidation.validateAll()) {
      notificationStore.showWarning('请检查表单填写是否正确')
      return
    }

    const operation = async () => {
      loadingStore.setLoading('project-create', true)
      const newProject = await projectService.createProject(createForm.value)

      // 更新Store状态
      projectStore.addProject(newProject)

      // 清空表单
      createForm.value = {
        name: '',
        description: '',
        type: 'article'
      }
      showCreateDialog.value = false

      notificationStore.showSuccess('项目创建成功')
      return newProject
    }

    try {
      return await operation()
    } catch (error) {
      handleError(error as Error, '创建项目')
      throw error
    } finally {
      loadingStore.setLoading('project-create', false)
    }
  }

  const updateProject = async (projectId: string) => {
    if (!editValidation.validateAll()) {
      notificationStore.showWarning('请检查表单填写是否正确')
      return
    }

    const operation = async () => {
      loadingStore.setLoading('project-update', true)
      const updatedProject = await projectService.updateProject(projectId, editForm.value)

      // 更新Store状态
      projectStore.updateProject(projectId, editForm.value)

      showEditDialog.value = false
      notificationStore.showSuccess('项目更新成功')
      return updatedProject
    }

    try {
      return await operation()
    } catch (error) {
      handleError(error as Error, '更新项目')
      throw error
    } finally {
      loadingStore.setLoading('project-update', false)
    }
  }

  const deleteProject = async (project: Project) => {
    const operation = async () => {
      loadingStore.setLoading(`project-delete-${project.id}`, true)
      await projectService.deleteProject(project.id)

      // 更新Store状态
      projectStore.removeProject(project.id)

      notificationStore.showSuccess('项目删除成功')
    }

    try {
      await operation()
    } catch (error) {
      handleError(error as Error, '删除项目')
      throw error
    } finally {
      loadingStore.setLoading(`project-delete-${project.id}`, false)
    }
  }

  const loadProjects = async () => {
    const operation = async () => {
      loadingStore.setLoading('projects-load', true)
      await projectStore.fetchProjects()
    }

    try {
      await operation()
    } catch (error) {
      handleError(error as Error, '加载项目列表')
      throw error
    } finally {
      loadingStore.setLoading('projects-load', false)
    }
  }

  const setCurrentProject = (project: Project) => {
    projectStore.setCurrentProject(project)
  }

  const openCreateDialog = () => {
    createValidation.clearErrors()
    showCreateDialog.value = true
  }

  const closeCreateDialog = () => {
    showCreateDialog.value = false
    createForm.value = {
      name: '',
      description: '',
      type: 'article'
    }
  }

  const openEditDialog = (project: Project) => {
    editForm.value = {
      name: project.name,
      description: project.description,
      type: project.type
    }
    editValidation.clearErrors()
    showEditDialog.value = true
  }

  const closeEditDialog = () => {
    showEditDialog.value = false
    editForm.value = {
      name: '',
      description: '',
      type: 'article'
    }
  }

  const searchProjects = (keyword: string) => {
    searchKeyword.value = keyword
    // 搜索逻辑通过computed属性自动执行
  }

  return {
    // 状态
    createForm,
    editForm,
    searchKeyword,
    showCreateDialog,
    showEditDialog,

    // 计算属性
    filteredProjects,
    canCreateProject,
    canUpdateProject,
    isLoading,

    // 验证
    createValidation,
    editValidation,

    // 方法
    createProject,
    updateProject,
    deleteProject,
    loadProjects,
    setCurrentProject,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    searchProjects
  }
}
```

#### 选题策划Composable (拆分版本)

```typescript
// src/composables/document/requirement/useRequirementForm.ts
import { ref, reactive } from 'vue'
import { useValidation } from '@/shared/useValidation'
import type { Requirement } from '@/types/document'

const requirementRules = {
  topic: [
    { required: true, message: '文档主题是必填项' },
    { min: 5, max: 100, message: '文档主题长度在5-100个字符之间' }
  ],
  specialRequirements: [{ max: 1000, message: '特殊要求不能超过1000个字符' }]
}

export function useRequirementForm() {
  // 需求表单状态
  const form = reactive<Requirement>({
    topic: '',
    keyPoints: [],
    specialRequirements: ''
  })

  const currentKeyPoint = ref('')

  // 表单验证
  const validation = useValidation(form, requirementRules)

  // 计算属性
  const canGenerateBriefing = computed(() => {
    return validation.isValid.value && form.topic.trim().length > 0
  })

  const keyPointsCount = computed(() => form.keyPoints.length)

  // 方法
  const addKeyPoint = () => {
    const point = currentKeyPoint.value.trim()
    if (point && !form.keyPoints.includes(point)) {
      form.keyPoints.push(point)
      currentKeyPoint.value = ''
    }
  }

  const removeKeyPoint = (index: number) => {
    form.keyPoints.splice(index, 1)
  }

  const updateKeyPoint = (index: number, value: string) => {
    form.keyPoints[index] = value
  }

  const resetForm = () => {
    form.topic = ''
    form.keyPoints = []
    form.specialRequirements = ''
    currentKeyPoint.value = ''
    validation.clearErrors()
  }

  const setRequirement = (requirement: Requirement) => {
    Object.assign(form, requirement)
  }

  const getRequirement = (): Requirement => ({ ...form })

  return {
    // 状态
    form,
    currentKeyPoint,

    // 计算属性
    canGenerateBriefing,
    keyPointsCount,

    // 验证
    validation,

    // 方法
    addKeyPoint,
    removeKeyPoint,
    updateKeyPoint,
    resetForm,
    setRequirement,
    getRequirement
  }
}
```

```typescript
// src/composables/document/requirement/useAIBriefing.ts
import { ref, computed } from 'vue'
import { useRequirementStore } from '@/store/modules/document/requirementStore'
import { useLoadingStore } from '@/store/modules/ui/loadingStore'
import { useNotificationStore } from '@/store/modules/ui/notificationStore'
import { useErrorHandler } from '@/shared/useErrorHandler'
import scopeAgentService from '@/services/ai/scopeAgentService'

export function useAIBriefing() {
  // Store实例
  const requirementStore = useRequirementStore()
  const loadingStore = useLoadingStore()
  const notificationStore = useNotificationStore()
  const { handleError } = useErrorHandler()

  // 本地状态
  const briefingDialogVisible = ref(false)
  const editableBrief = ref('')

  // 计算属性
  const researchBrief = computed(() => requirementStore.researchBrief)
  const hasResearchBrief = computed(() => !!researchBrief.value)
  const isGeneratingBriefing = computed(() => loadingStore.isLoading('briefing-generate'))

  // 方法
  const generateAIBriefing = async (userId: string, projectId: string, requirement: any) => {
    const operation = async () => {
      loadingStore.setLoading('briefing-generate', true)

      const response = await scopeAgentService.executeScopeAgent(
        userId,
        projectId,
        buildResearchQuery(requirement)
      )

      if (response?.success) {
        notificationStore.showSuccess('AI简报生成任务已启动，正在后台处理')
        return response
      } else {
        throw new Error('AI简报生成失败')
      }
    }

    try {
      return await operation()
    } catch (error) {
      handleError(error as Error, '生成AI简报')
      throw error
    } finally {
      loadingStore.setLoading('briefing-generate', false)
    }
  }

  const editBriefing = () => {
    if (researchBrief.value) {
      editableBrief.value = researchBrief.value.content
      briefingDialogVisible.value = true
    }
  }

  const saveBriefing = () => {
    if (editableBrief.value.trim()) {
      requirementStore.updateResearchBrief(editableBrief.value)
      notificationStore.showSuccess('简报已更新')
      briefingDialogVisible.value = false
    }
  }

  const cancelEditBriefing = () => {
    editableBrief.value = ''
    briefingDialogVisible.value = false
  }

  const buildResearchQuery = (requirement: any): string => {
    const keyPointsSection =
      requirement.keyPoints.length > 0
        ? requirement.keyPoints.map((point: string) => `- ${point}`).join('\n')
        : '- 暂无关键要点'

    const specialRequirementsSection = requirement.specialRequirements.trim()
      ? requirement.specialRequirements.trim()
      : '无'

    return `# 文档创作需求

## 基本信息
- **主题**: ${requirement.topic}

## 关键要点
${keyPointsSection}

## 特殊要求
${specialRequirementsSection}

---

请基于以上需求，生成详细的研究简报，包括背景分析、内容结构建议、关键词建议等。
`
  }

  return {
    // 状态
    briefingDialogVisible,
    editableBrief,

    // 计算属性
    researchBrief,
    hasResearchBrief,
    isGeneratingBriefing,

    // 方法
    generateAIBriefing,
    editBriefing,
    saveBriefing,
    cancelEditBriefing
  }
}
```

```typescript
// src/composables/document/requirement/useTitleGeneration.ts
import { ref, computed } from 'vue'
import { useRequirementStore } from '@/store/modules/document/requirementStore'
import { useLoadingStore } from '@/store/modules/ui/loadingStore'
import { useNotificationStore } from '@/store/modules/ui/notificationStore'
import { useErrorHandler } from '@/shared/useErrorHandler'
import titleGenerateService from '@/services/ai/titleGenerateService'
import search2titleAgentService from '@/services/ai/search2titleAgentService'
import type { Title } from '@/types/ai'

export function useTitleGeneration() {
  // Store实例
  const requirementStore = useRequirementStore()
  const loadingStore = useLoadingStore()
  const notificationStore = useNotificationStore()
  const { handleError } = useErrorHandler()

  // 本地状态
  const customKeywords = ref<string[]>([])
  const currentKeyword = ref('')

  // 计算属性
  const generatedTitles = computed(() => requirementStore.generatedTitles)
  const selectedTitle = computed(() => requirementStore.selectedTitle)
  const searchResults = computed(() => requirementStore.searchResults)
  const hasGeneratedTitles = computed(() => generatedTitles.value.length > 0)
  const hasSelectedTitle = computed(() => !!selectedTitle.value)
  const hasSearchResults = computed(() => searchResults.value.length > 0)

  const canGenerateTitles = computed(() => {
    return requirementStore.researchBrief && hasSearchResults.value
  })

  const isGeneratingTitles = computed(() => loadingStore.isLoading('title-generate'))
  const isSearching = computed(() => loadingStore.isLoading('search2title'))

  // 方法
  const generateTitles = async () => {
    if (!canGenerateTitles.value) {
      notificationStore.showWarning('研究简报或搜索数据不完整')
      return
    }

    const operation = async () => {
      loadingStore.setLoading('title-generate', true)

      const response = await titleGenerateService.generateTitles(
        requirementStore.researchBrief!.content,
        searchResults.value
      )

      requirementStore.setGeneratedTitles(response.titles || [])
      notificationStore.showSuccess(`成功生成 ${response.titles?.length || 0} 个标题`)
      return response
    }

    try {
      return await operation()
    } catch (error) {
      handleError(error as Error, '生成标题')
      throw error
    } finally {
      loadingStore.setLoading('title-generate', false)
    }
  }

  const executeSearch2Title = async (userId: string, projectId: string) => {
    if (!requirementStore.researchBrief) {
      notificationStore.showWarning('请先生成研究简报')
      return
    }

    const operation = async () => {
      loadingStore.setLoading('search2title', true)

      const response = await search2titleAgentService.executeSearch2TitleAgent(
        userId,
        projectId,
        requirementStore.researchBrief.content
      )

      if (response?.success) {
        notificationStore.showSuccess('Search2Title任务已启动，正在执行中...')
        return response
      } else {
        throw new Error('Search2Title执行失败')
      }
    }

    try {
      return await operation()
    } catch (error) {
      handleError(error as Error, '执行Search2Title')
      throw error
    } finally {
      loadingStore.setLoading('search2title', false)
    }
  }

  const selectTitle = (title: Title) => {
    requirementStore.selectTitle(title)
    notificationStore.showSuccess('标题已选择')
  }

  const addCustomKeyword = () => {
    const keyword = currentKeyword.value.trim()
    if (keyword && !customKeywords.value.includes(keyword)) {
      customKeywords.value.push(keyword)
      currentKeyword.value = ''
    }
  }

  const removeCustomKeyword = (keyword: string) => {
    const index = customKeywords.value.indexOf(keyword)
    if (index > -1) {
      customKeywords.value.splice(index, 1)
    }
  }

  const extractKeywords = (text: string) => {
    if (!text) return

    // 简单的关键词提取逻辑
    const keywords = text
      .split(/[,，、\s]+/)
      .filter((word) => word.length > 1 && word.length < 10)
      .slice(0, 10)

    customKeywords.value = keywords
  }

  const clearSelectedTitle = () => {
    requirementStore.clearSelectedTitle()
  }

  return {
    // 状态
    customKeywords,
    currentKeyword,

    // 计算属性
    generatedTitles,
    selectedTitle,
    searchResults,
    hasGeneratedTitles,
    hasSelectedTitle,
    hasSearchResults,
    canGenerateTitles,
    isGeneratingTitles,
    isSearching,

    // 方法
    generateTitles,
    executeSearch2Title,
    selectTitle,
    addCustomKeyword,
    removeCustomKeyword,
    extractKeywords,
    clearSelectedTitle
  }
}
```

```typescript
// src/composables/document/requirement/useTopicSelection.ts (组合版本)
import { computed } from 'vue'
import { useRequirementForm } from './useRequirementForm'
import { useAIBriefing } from './useAIBriefing'
import { useTitleGeneration } from './useTitleGeneration'
import { useWorkflowNavigation } from './useWorkflowNavigation'
import { useRequirementStore } from '@/store/modules/document/requirementStore'

export function useTopicSelection() {
  // 子功能Composable
  const requirementForm = useRequirementForm()
  const aiBriefing = useAIBriefing()
  const titleGeneration = useTitleGeneration()
  const workflowNavigation = useWorkflowNavigation()

  // Store实例
  const requirementStore = useRequirementStore()

  // 计算属性
  const canProceedToNextStep = computed(() => {
    switch (workflowNavigation.currentStep.value) {
      case 'requirements':
        return aiBriefing.hasResearchBrief.value && titleGeneration.hasSearchResults.value
      case 'title':
        return titleGeneration.hasSelectedTitle.value
      default:
        return false
    }
  })

  const currentStepTitle = computed(() => {
    const stepTitles = {
      requirements: '需求定义',
      title: '标题选择'
    }
    return stepTitles[workflowNavigation.currentStep.value] || ''
  })

  // 组合方法
  const generateAIBriefing = async (userId: string, projectId: string) => {
    const requirement = requirementForm.getRequirement()
    return aiBriefing.generateAIBriefing(userId, projectId, requirement)
  }

  const proceedToNextStep = () => {
    if (canProceedToNextStep.value) {
      workflowNavigation.goToNextStep()
    } else {
      // 显示警告
      const warningMessage =
        workflowNavigation.currentStep.value === 'requirements'
          ? '请先生成研究简报'
          : '请先选择标题'
      // 这里可以使用通知服务
      console.warn(warningMessage)
    }
  }

  const goToPreviousStep = () => {
    workflowNavigation.goToPreviousStep()
  }

  const resetAll = () => {
    requirementForm.resetForm()
    requirementStore.reset()
  }

  return {
    // 导出所有子功能的属性和方法
    ...requirementForm,
    ...aiBriefing,
    ...titleGeneration,
    ...workflowNavigation,

    // 组合计算属性
    canProceedToNextStep,
    currentStepTitle,

    // 组合方法
    generateAIBriefing,
    proceedToNextStep,
    goToPreviousStep,
    resetAll
  }
}
```

### 4. Composable适配器实现

#### 适配器基类

```typescript
// src/composables/adapters/BaseAdapter.ts
export abstract class BaseComposableAdapter<TNew, TOld> {
  protected newComposable: TNew
  protected oldComposable: TOld
  protected featureFlag: string

  constructor(newComposable: TNew, oldComposable: TOld, featureFlag: string) {
    this.newComposable = newComposable
    this.oldComposable = oldComposable
    this.featureFlag = featureFlag
  }

  protected useNew(): boolean {
    // 这里应该调用功能开关检查
    return false // 暂时返回false，待功能开关实现
  }

  // 抽象方法，子类实现具体的适配逻辑
  abstract adapt(): any
}
```

#### 选题策划适配器

```typescript
// src/composables/adapters/topicSelectionAdapter.ts
import { BaseComposableAdapter } from './BaseAdapter'
import { useTopicSelection } from '../document/requirement/useTopicSelection'
import { useOldTopicSelection } from '../document/useTopicSelection' // 假设的旧Composable

export class TopicSelectionAdapter extends BaseComposableAdapter<any, any> {
  constructor() {
    const newComposable = useTopicSelection()
    const oldComposable = useOldTopicSelection()
    super(newComposable, oldComposable, 'new-topic-selection')
  }

  adapt() {
    if (this.useNew()) {
      // 新Composable接口，保持兼容性
      return {
        // 旧接口兼容
        requirementsState: {
          form: this.newComposable.form,
          isGeneratingBriefing: this.newComposable.isGeneratingBriefing,
          isExecutingScope: this.newComposable.isExecutingScope,
          briefingDialogVisible: this.newComposable.briefingDialogVisible,
          editableBrief: this.newComposable.editableBrief
        },

        titleState: {
          isGenerating: this.newComposable.isGeneratingTitles,
          generatedTitles: this.newComposable.generatedTitles,
          selectedTitle: this.newComposable.selectedTitle,
          customKeywords: this.newComposable.customKeywords
        },

        documentState: {
          researchBrief: this.newComposable.researchBrief,
          generatedTitles: this.newComposable.generatedTitles,
          selectedTitle: this.newComposable.selectedTitle,
          currentStep: this.newComposable.currentStep
        },

        // 方法兼容
        addKeyPoint: this.newComposable.addKeyPoint,
        removeKeyPoint: this.newComposable.removeKeyPoint,
        generateAIBriefing: (userId: string, projectId: string) =>
          this.newComposable.generateAIBriefing(userId, projectId),
        editBriefing: this.newComposable.editBriefing,
        saveBriefing: this.newComposable.saveBriefing,
        selectTitle: this.newComposable.selectTitle,
        generateTitles: this.newComposable.generateTitles,
        executeSearch2Title: this.newComposable.executeSearch2Title,
        proceedToNextStep: this.newComposable.proceedToNextStep,
        goToPreviousStep: this.newComposable.goToPreviousStep,

        // 计算属性兼容
        canGenerateBriefing: this.newComposable.canGenerateBriefing,
        canConfirmRequirements: computed(
          () => this.newComposable.hasResearchBrief && this.newComposable.hasSearchResults
        ),
        hasGeneratedTitles: this.newComposable.hasGeneratedTitles,
        hasSelectedTitle: this.newComposable.hasSelectedTitle,
        canGenerateTitles: this.newComposable.canGenerateTitles,
        canProceedToNextStep: this.newComposable.canProceedToNextStep
      }
    } else {
      // 返回旧Composable
      return this.oldComposable
    }
  }
}

// 导出适配器实例
export function useTopicSelectionAdapter() {
  const adapter = new TopicSelectionAdapter()
  return adapter.adapt()
}
```

## 迁移策略

### 阶段1: 创建共享Composable

1. **实现基础工具Composable**

   - useApi
   - useValidation
   - useErrorHandler
   - useDebounce
   - useLocalStorage

2. **实现UI状态Composable**
   - useLoading
   - useDialog
   - useNotification
   - usePagination

### 阶段2: 拆分大型Composable

1. **分析useTopicSelection**

   - 拆分为useRequirementForm、useAIBriefing、useTitleGeneration、useWorkflowNavigation
   - 创建新的useTopicSelection组合这些子功能

2. **分析useOutlinePage**

   - 拆分为useOutlineEditor、useAIOutlineGeneration、useChapterManagement、useMaterialBinding

3. **分析useContent**
   - 拆分为useMarkdownEditor、useContentGeneration、useAIAssistant、useContentPreview

### 阶段3: 创建适配器

1. **创建适配器基类**
2. **为每个大型Composable创建适配器**
3. **通过功能开关控制新旧代码切换**

### 阶段4: 逐步迁移

1. **按复杂度排序迁移**
2. **每次迁移一个Composable**
3. **测试验证后再进行下一个**

## 测试策略

### 单元测试

```typescript
// tests/composables/useProjectManagement.test.ts
import { ref } from 'vue'
import { useProjectManagement } from '@/composables/document/project/useProjectManagement'

// Mock Store
vi.mock('@/store/modules/document/projectStore')
vi.mock('@/store/modules/ui/loadingStore')
vi.mock('@/store/modules/ui/notificationStore')

describe('useProjectManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { createForm, searchKeyword, showCreateDialog } = useProjectManagement()

    expect(createForm.value).toEqual({
      name: '',
      description: '',
      type: 'article'
    })
    expect(searchKeyword.value).toBe('')
    expect(showCreateDialog.value).toBe(false)
  })

  it('should validate project creation form', async () => {
    const { createForm, createValidation, createProject } = useProjectManagement()

    // 测试空表单验证
    expect(createValidation.isValid.value).toBe(false)

    // 填写有效数据
    createForm.value.name = 'Test Project'
    createForm.value.description = 'Test Description'
    createForm.value.type = 'article'

    expect(createValidation.isValid.value).toBe(true)
  })
})
```

### 集成测试

```typescript
// tests/composables/composableIntegration.test.ts
import { useProjectManagement } from '@/composables/document/project/useProjectManagement'
import { useTopicSelection } from '@/composables/document/requirement/useTopicSelection'

describe('Composable Integration', () => {
  it('should work together across composables', async () => {
    const projectManagement = useProjectManagement()
    const topicSelection = useTopicSelection()

    // 测试跨Composable的协作
    const project = await projectManagement.createProject()
    expect(project).toBeDefined()

    // 使用项目ID进行选题策划
    const result = await topicSelection.generateAIBriefing('user-id', project.id)
    expect(result).toBeDefined()
  })
})
```

## 性能优化

### 计算属性优化

1. **缓存计算结果**: 使用computed缓存复杂计算
2. **避免不必要的依赖**: 精确控制计算属性依赖
3. **使用shallowRef**: 大型对象使用浅层响应式

### 内存优化

1. **及时清理**: 在onUnmounted中清理资源
2. **避免内存泄漏**: 正确处理事件监听和定时器
3. **合理使用watch**: 避免过度监听

### 代码分割

1. **动态导入**: 大型Composable按需加载
2. **Tree Shaking**: 确保未使用代码被移除
3. **模块化**: 合理拆分功能模块

这个Composable层重构方案通过拆分大型Composable、建立清晰的职责边界，为View层提供简洁易用的业务接口，同时保证良好的可测试性和可维护性。
