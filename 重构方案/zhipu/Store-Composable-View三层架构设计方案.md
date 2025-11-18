# Store-Composable-View 三层架构设计方案

## 架构概览

本文档设计了一个清晰的 Store-Composable-View 三层架构，确保职责分离、可测试性和可维护性。重构后的架构将遵循以下原则：

- **Store层**: 只负责状态存储和状态变更
- **Composable层**: 处理业务逻辑、数据转换和Service调用
- **View层**: 纯UI组件，只负责渲染和用户交互

## 架构设计原则

### 1. 单一职责原则

- 每个Store只管理特定领域的状态
- 每个Composable只处理特定的业务逻辑
- 每个View组件只负责UI渲染

### 2. 依赖方向

```
View → Composable → Store → Service → API
    ↓      ↓         ↓        ↓
State ← Business ← Storage ← Data
```

### 3. 数据流原则

- **单向数据流**: 数据从Store流向View，用户操作通过Composable更新Store
- **不可变状态**: Store状态只能通过定义的actions/mutations修改
- **响应式更新**: 使用Vue的响应式系统自动更新UI

## 详细架构设计

### Store层设计

#### 1. Store结构组织

```
src/store/modules/
├── document/
│   ├── projectStore.ts          # 项目状态管理
│   ├── requirementStore.ts      # 需求状态管理
│   ├── outlineStore.ts          # 大纲状态管理
│   ├── contentStore.ts          # 内容状态管理
│   ├── materialStore.ts         # 素材状态管理
│   └── taskStore.ts             # 任务状态管理
├── ui/
│   ├── loadingStore.ts          # 加载状态管理
│   ├── dialogStore.ts           # 对话框状态管理
│   └── notificationStore.ts     # 通知状态管理
└── user/
    ├── authStore.ts             # 认证状态管理
    └── preferenceStore.ts       # 用户偏好设置
```

#### 2. Store设计模式

**基础Store接口:**

```typescript
interface BaseStore<T> {
  // State
  state: T

  // Getters (computed properties)
  getters: {
    [key: string]: (state: T) => any
  }

  // Actions (state mutations)
  actions: {
    [key: string]: (payload?: any) => Promise<void> | void
  }
}
```

**示例 - ProjectStore:**

```typescript
// src/store/modules/document/projectStore.ts
interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  error: string | null
  filters: ProjectFilters
}

export const useProjectStore = defineStore('project', {
  state: (): ProjectState => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
    filters: {
      keyword: '',
      status: 'all',
      type: 'all'
    }
  }),

  getters: {
    filteredProjects: (state) => {
      return state.projects.filter(
        (project) =>
          project.name.includes(state.filters.keyword) &&
          (state.filters.status === 'all' || project.status === state.filters.status)
      )
    },

    projectById: (state) => (id: string) => {
      return state.projects.find((p) => p.id === id)
    }
  },

  actions: {
    async fetchProjects() {
      this.loading = true
      this.error = null
      try {
        // 注意：这里不直接调用Service，由Composable层调用
        // Store只负责状态管理
        const projects = await projectService.getProjects()
        this.projects = projects
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    setCurrentProject(project: Project) {
      this.currentProject = project
    },

    updateProject(projectId: string, updates: Partial<Project>) {
      const index = this.projects.findIndex((p) => p.id === projectId)
      if (index !== -1) {
        this.projects[index] = { ...this.projects[index], ...updates }
      }
    },

    addProject(project: Project) {
      this.projects.unshift(project)
    },

    removeProject(projectId: string) {
      this.projects = this.projects.filter((p) => p.id !== projectId)
    }
  }
})
```

#### 3. Store设计规范

**状态设计原则:**

- **扁平化**: 避免深层嵌套的状态结构
- **规范化**: 使用ID引用而不是嵌套对象
- **最小化**: 只存储必要的UI状态，计算属性通过getter实现

**Action设计原则:**

- **异步处理**: 异步操作在action中处理
- **错误处理**: 统一的错误处理机制
- **原子性**: 每个action只执行一个相关的状态变更

### Composable层设计

#### 1. Composable结构组织

```
src/composables/
├── document/
│   ├── useProjectManagement.ts    # 项目管理业务逻辑
│   ├── useTopicSelection.ts       # 选题策划业务逻辑
│   ├── useOutlineGeneration.ts    # 大纲生成业务逻辑
│   ├── useContentCreation.ts      # 内容创作业务逻辑
│   ├── useMaterialBinding.ts      # 素材绑定业务逻辑
│   └── useTaskManagement.ts       # 任务管理业务逻辑
├── ui/
│   ├── useLoading.ts              # 加载状态管理
│   ├── useDialog.ts               # 对话框管理
│   ├── useNotification.ts         # 通知管理
│   └── usePagination.ts           # 分页管理
└── shared/
    ├── useApi.ts                  # API调用封装
    ├── useValidation.ts           # 表单验证
    └── useErrorHandler.ts         # 错误处理
```

#### 2. Composable设计模式

**基础Composable接口:**

```typescript
interface ComposableResult<T = any> {
  // State
  state: Ref<T>

  // Computed Properties
  [key: string]: ComputedRef<any>

  // Methods
  [key: string]: (...args: any[]) => Promise<any> | any
}
```

**示例 - useProjectManagement:**

```typescript
// src/composables/document/useProjectManagement.ts
import { ref, computed } from 'vue'
import { useProjectStore } from '@/store/modules/document/projectStore'
import { useLoadingStore } from '@/store/modules/ui/loadingStore'
import { useNotificationStore } from '@/store/modules/ui/notificationStore'
import projectService from '@/services/projectService'

interface ProjectManagementState {
  createForm: ProjectCreateForm
  editForm: ProjectEditForm
  searchKeyword: string
}

export function useProjectManagement() {
  // Store实例
  const projectStore = useProjectStore()
  const loadingStore = useLoadingStore()
  const notificationStore = useNotificationStore()

  // 本地状态
  const state = ref<ProjectManagementState>({
    createForm: {
      name: '',
      description: '',
      type: 'article'
    },
    editForm: {
      name: '',
      description: '',
      type: 'article'
    },
    searchKeyword: ''
  })

  // 计算属性
  const filteredProjects = computed(() => {
    return projectStore.filteredProjects.filter((project) =>
      project.name.toLowerCase().includes(state.value.searchKeyword.toLowerCase())
    )
  })

  const canCreateProject = computed(() => {
    return state.value.createForm.name.trim().length > 0
  })

  // 业务方法
  const createProject = async () => {
    if (!canCreateProject.value) {
      notificationStore.showError('请填写项目名称')
      return
    }

    try {
      loadingStore.setLoading('project-create', true)

      // 调用Service层
      const newProject = await projectService.createProject(state.value.createForm)

      // 更新Store状态
      projectStore.addProject(newProject)

      // 清空表单
      state.value.createForm = {
        name: '',
        description: '',
        type: 'article'
      }

      notificationStore.showSuccess('项目创建成功')
      return newProject
    } catch (error) {
      notificationStore.showError(`项目创建失败: ${error.message}`)
      throw error
    } finally {
      loadingStore.setLoading('project-create', false)
    }
  }

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      loadingStore.setLoading('project-update', true)

      // 调用Service层
      const updatedProject = await projectService.updateProject(projectId, updates)

      // 更新Store状态
      projectStore.updateProject(projectId, updates)

      notificationStore.showSuccess('项目更新成功')
      return updatedProject
    } catch (error) {
      notificationStore.showError(`项目更新失败: ${error.message}`)
      throw error
    } finally {
      loadingStore.setLoading('project-update', false)
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      loadingStore.setLoading('project-delete', true)

      // 调用Service层
      await projectService.deleteProject(projectId)

      // 更新Store状态
      projectStore.removeProject(projectId)

      notificationStore.showSuccess('项目删除成功')
    } catch (error) {
      notificationStore.showError(`项目删除失败: ${error.message}`)
      throw error
    } finally {
      loadingStore.setLoading('project-delete', false)
    }
  }

  const loadProjects = async () => {
    try {
      loadingStore.setLoading('projects-load', true)
      await projectStore.fetchProjects()
    } catch (error) {
      notificationStore.showError(`加载项目失败: ${error.message}`)
      throw error
    } finally {
      loadingStore.setLoading('projects-load', false)
    }
  }

  const searchProjects = (keyword: string) => {
    state.value.searchKeyword = keyword
    // 搜索逻辑通过computed属性自动执行
  }

  return {
    // 状态
    state,

    // 计算属性
    filteredProjects,
    canCreateProject,

    // 方法
    createProject,
    updateProject,
    deleteProject,
    loadProjects,
    searchProjects
  }
}
```

#### 3. Composable设计规范

**状态管理:**

- **本地状态**: 只在单个Composable内使用的状态
- **Store状态**: 需要跨组件共享的状态通过Store管理
- **响应式**: 使用Vue的ref/reactive确保响应式

**Service调用:**

- **封装调用**: 在Composable中封装Service调用
- **错误处理**: 统一的错误处理机制
- **加载状态**: 管理异步操作的加载状态

**数据转换:**

- **格式转换**: 在Composable中处理数据格式转换
- **验证逻辑**: 表单验证和数据校验
- **计算属性**: 复杂的数据计算逻辑

### View层设计

#### 1. View组件结构

```
src/views/document-generation/
├── project-list/
│   ├── index.vue                 # 项目列表主页面
│   ├── components/
│   │   ├── ProjectCard.vue       # 项目卡片组件
│   │   ├── ProjectForm.vue       # 项目表单组件
│   │   └── SearchBar.vue         # 搜索栏组件
├── topic-selection/
│   ├── index.vue                 # 选题策划主页面
│   ├── components/
│   │   ├── RequirementForm.vue   # 需求表单组件
│   │   ├── AIBriefing.vue        # AI简报组件
│   │   ├── TitleSelection.vue    # 标题选择组件
│   │   └── TaskProgress.vue      # 任务进度组件
├── outline/
│   ├── index.vue                 # 大纲编辑主页面
│   ├── components/
│   │   ├── OutlineEditor.vue     # 大纲编辑器
│   │   ├── MaterialLibrary.vue   # 素材库组件
│   │   └── ChapterBinding.vue    # 章节绑定组件
└── content/
    ├── index.vue                 # 内容创作主页面
    ├── components/
    │   ├── MarkdownEditor.vue    # Markdown编辑器
    │   ├── ContentPreview.vue    # 内容预览组件
    │   └── AIAssistant.vue       # AI助手组件
```

#### 2. View组件设计模式

**基础组件接口:**

```typescript
interface VueComponent {
  // Props
  props?: { [key: string]: any }

  // Emits
  emits?: { [key: string]: (...args: any[]) => void }

  // Composables
  setup(): { [key: string]: any }
}
```

**示例 - ProjectCard组件:**

```vue
<!-- src/views/document-generation/project-list/components/ProjectCard.vue -->
<template>
  <div class="project-card" @click="handleCardClick">
    <div class="project-header">
      <h3 class="project-name">{{ project.name }}</h3>
      <el-tag :type="getStatusType(project.status)" size="small">
        {{ getStatusText(project.status) }}
      </el-tag>
    </div>

    <div class="project-info">
      <p class="project-description">{{ project.description }}</p>
      <div class="project-meta">
        <span class="create-time">创建于: {{ formatDate(project.createTime) }}</span>
        <span class="update-time">更新于: {{ formatDate(project.updateTime) }}</span>
      </div>
    </div>

    <div class="project-progress">
      <StepIndicator :steps="progressSteps" size="small" />
    </div>

    <div class="project-actions">
      <el-button type="primary" size="small" @click.stop="handleContinue" :loading="isLoading">
        {{ getActionText(project.status) }}
      </el-button>
      <el-button size="small" @click.stop="handleEdit"> 编辑 </el-button>
      <el-button size="small" type="danger" @click.stop="handleDelete" :loading="isDeleting">
        删除
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { Project } from '@/types/project'
  import StepIndicator from '@/components/custom/StepIndicator.vue'

  // Props定义
  interface Props {
    project: Project
    isLoading?: boolean
    isDeleting?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    isLoading: false,
    isDeleting: false
  })

  // Emits定义
  interface Emits {
    continue: [project: Project]
    edit: [project: Project]
    delete: [project: Project]
  }

  const emit = defineEmits<Emits>()

  // 计算属性
  const progressSteps = computed(() => [
    { label: '选题', icon: 'el-icon-edit', status: getStepStatus(props.project, 1) },
    { label: '大纲', icon: 'el-icon-tickets', status: getStepStatus(props.project, 2) },
    { label: '正文', icon: 'el-icon-notebook', status: getStepStatus(props.project, 3) }
  ])

  // 方法
  const getStatusType = (status: string) => {
    const statusMap = {
      draft: 'info',
      in_progress: 'warning',
      completed: 'success'
    }
    return statusMap[status] || 'info'
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      draft: '草稿',
      in_progress: '进行中',
      completed: '已完成'
    }
    return statusMap[status] || '未知'
  }

  const getActionText = (status: string) => {
    const actionMap = {
      draft: '开始创作',
      in_progress: '继续创作',
      completed: '查看详情'
    }
    return actionMap[status] || '查看'
  }

  const getStepStatus = (project: Project, step: number) => {
    // 根据项目状态返回步骤状态
    const stepStatus = project.stepStatus || {}
    return stepStatus[step] || 'pending'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  // 事件处理
  const handleCardClick = () => {
    emit('continue', props.project)
  }

  const handleContinue = () => {
    emit('continue', props.project)
  }

  const handleEdit = () => {
    emit('edit', props.project)
  }

  const handleDelete = () => {
    emit('delete', props.project)
  }
</script>

<style scoped lang="scss">
  .project-card {
    padding: 20px;
    cursor: pointer;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
      transform: translateY(-2px);
    }
  }

  .project-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .project-name {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .project-info {
    margin-bottom: 16px;
  }

  .project-description {
    display: -webkit-box;
    overflow: hidden;
    font-size: 14px;
    line-height: 1.5;
    color: var(--el-text-color-regular);
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .project-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 8px;
  }

  .project-progress {
    margin-bottom: 16px;
  }

  .project-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
</style>
```

**示例 - 项目列表主页面:**

```vue
<!-- src/views/document-generation/project-list/index.vue -->
<template>
  <div class="project-list-container">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">AI创作项目列表</h1>
          <p class="page-subtitle">管理和创建您的AI文档创作项目</p>
        </div>
        <div class="header-right">
          <SearchBar v-model="searchKeyword" @search="handleSearch" />
          <el-button type="primary" @click="showCreateDialog = true">
            <i class="iconfont-sys" style="margin-right: 4px">&#xe6e0;</i>
            创建项目
          </el-button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoadingProjects" class="loading-container" v-loading="true">
      <p>正在加载项目列表...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error-container">
      <el-result icon="warning" title="加载失败" :sub-title="errorMessage">
        <template #extra>
          <el-button type="primary" @click="loadProjects"> 重新加载 </el-button>
        </template>
      </el-result>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredProjects.length === 0" class="empty-container">
      <el-result
        icon="info"
        title="暂无项目"
        sub-title="您还没有创建任何项目，点击上方按钮创建第一个项目吧"
      >
        <template #extra>
          <el-button type="primary" @click="showCreateDialog = true"> 创建项目 </el-button>
        </template>
      </el-result>
    </div>

    <!-- 项目列表 -->
    <div v-else class="project-grid">
      <ProjectCard
        v-for="project in filteredProjects"
        :key="project.id"
        :project="project"
        :is-loading="isLoadingProject(project.id)"
        :is-deleting="isDeletingProject(project.id)"
        @continue="handleContinueProject"
        @edit="handleEditProject"
        @delete="handleDeleteProject"
      />
    </div>

    <!-- 创建项目对话框 -->
    <ProjectForm
      v-model="showCreateDialog"
      :form="createForm"
      :loading="isCreatingProject"
      @submit="handleCreateProject"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useProjectManagement } from '@/composables/document/useProjectManagement'
  import { useNotificationStore } from '@/store/modules/ui/notificationStore'
  import ProjectCard from './components/ProjectCard.vue'
  import SearchBar from './components/SearchBar.vue'
  import ProjectForm from './components/ProjectForm.vue'

  const router = useRouter()
  const notificationStore = useNotificationStore()

  // 使用Composable
  const {
    state,
    filteredProjects,
    createProject,
    updateProject,
    deleteProject,
    loadProjects,
    searchProjects
  } = useProjectManagement()

  // 本地状态
  const showCreateDialog = ref(false)
  const searchKeyword = ref('')

  // 计算属性
  const isLoadingProjects = ref(false)
  const hasError = ref(false)
  const errorMessage = ref('')

  const isCreatingProject = computed(() => isLoading.value('project-create'))

  const isLoadingProject = (projectId: string) => {
    return isLoading.value(`project-update-${projectId}`)
  }

  const isDeletingProject = (projectId: string) => {
    return isLoading.value(`project-delete-${projectId}`)
  }

  // 方法
  const handleSearch = (keyword: string) => {
    searchProjects(keyword)
  }

  const handleCreateProject = async (formData: ProjectCreateForm) => {
    try {
      const newProject = await createProject(formData)
      showCreateDialog.value = false
      notificationStore.showSuccess('项目创建成功')

      // 跳转到选题页面
      await router.push(`/document-generation/topic-selection/${newProject.id}`)
    } catch (error) {
      // 错误处理已在Composable中完成
    }
  }

  const handleContinueProject = (project: Project) => {
    // 根据项目状态跳转到相应页面
    const routeMap = {
      draft: '/document-generation/topic-selection',
      topic_selected: '/document-generation/outline',
      outline_completed: '/document-generation/content'
    }

    const route = routeMap[project.status] || '/document-generation/topic-selection'
    router.push(`${route}/${project.id}`)
  }

  const handleEditProject = (project: Project) => {
    // 实现编辑逻辑
    state.value.editForm = {
      name: project.name,
      description: project.description,
      type: project.type
    }
    showEditDialog.value = true
  }

  const handleDeleteProject = async (project: Project) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除项目"${project.name}"吗？此操作不可恢复。`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await deleteProject(project.id)
      notificationStore.showSuccess('项目删除成功')
    } catch (error) {
      if (error !== 'cancel') {
        // 错误处理已在Composable中完成
      }
    }
  }

  // 生命周期
  onMounted(async () => {
    try {
      isLoadingProjects.value = true
      await loadProjects()
    } catch (error) {
      hasError.value = true
      errorMessage.value = error.message
    } finally {
      isLoadingProjects.value = false
    }
  })
</script>

<style scoped lang="scss">
  .project-list-container {
    padding: 20px;
  }

  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    margin-top: 20px;
  }

  .project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .page-header {
    padding: 20px 0;
    margin-bottom: 20px;
    background: var(--el-bg-color);
    border-radius: 8px;

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
    }

    .header-left {
      flex: 1;

      .page-title {
        margin: 0 0 8px;
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .page-subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  @media (width <= 768px) {
    .project-grid {
      grid-template-columns: 1fr;
    }

    .page-header {
      .header-content {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }

      .header-right {
        width: 100%;
      }
    }
  }
</style>
```

#### 3. View组件设计规范

**组件职责:**

- **纯UI组件**: 只负责渲染和用户交互
- **数据接收**: 通过props接收数据
- **事件发送**: 通过emits发送用户操作
- **无业务逻辑**: 不包含复杂的业务逻辑

**Props设计:**

- **类型安全**: 使用TypeScript定义props类型
- **默认值**: 提供合理的默认值
- **验证**: 使用prop验证确保数据正确性

**事件处理:**

- **命名规范**: 使用清晰的事件名称
- **数据传递**: 通过事件参数传递必要数据
- **解耦**: 组件不直接调用业务逻辑

## 层间交互规范

### 1. View ↔ Composable 交互

```typescript
// View组件中
const { state, methods, computed } = useProjectManagement()

// 模板中使用
<template>
  <div @click="methods.createProject">
    {{ computed.projectCount }}
  </div>
</template>
```

### 2. Composable ↔ Store 交互

```typescript
// Composable中
const projectStore = useProjectStore()

// 状态读取
const projects = computed(() => projectStore.projects)

// 状态更新
const createProject = async (data) => {
  projectStore.addProject(data) // 通过action更新
}
```

### 3. Composable ↔ Service 交互

```typescript
// Composable中
import projectService from '@/services/projectService'

const createProject = async (data) => {
  const result = await projectService.createProject(data)
  // 处理结果，更新Store状态
  projectStore.addProject(result)
  return result
}
```

## 重构实施策略

### 阶段1: Store层重构

1. 分析现有Store，拆分大型Store
2. 规范化Store接口和状态结构
3. 统一错误处理和加载状态管理

### 阶段2: Composable层重构

1. 从现有组件中提取业务逻辑到Composable
2. 拆分大型Composable为小型、专一的函数
3. 统一Service调用模式

### 阶段3: View层重构

1. 简化组件，移除业务逻辑
2. 标准化组件接口
3. 优化组件复用性

### 阶段4: 集成测试和优化

1. 端到端测试确保功能正常
2. 性能优化
3. 文档更新

这个架构设计确保了清晰的职责分离、良好的可测试性和可维护性，为后续的渐进式重构提供了详细的指导方案。
