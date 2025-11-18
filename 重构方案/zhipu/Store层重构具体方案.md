# Store层重构具体方案

## 重构目标

将现有的复杂Store结构重构为清晰、模块化的状态管理模式，确保Store只负责状态存储和状态变更，为上层Composable提供稳定的数据基础。

## 当前Store层问题分析

### 现有Store结构问题

1. **职责混乱**: Store中包含业务逻辑和数据转换逻辑
2. **状态冗余**: 多个Store间存在重复状态
3. **复杂度过高**: 单个Store文件过大，逻辑复杂
4. **类型定义不清晰**: 缺乏完整的TypeScript类型定义
5. **错误处理不统一**: 不同Store的错误处理方式不一致

### 现有Store文件分析

```
src/store/modules/
├── documentGenerate.ts    # ~800行，职责过多
├── project.ts            # ~300行，相对简单
├── outline.ts            # ~500行，中等复杂度
├── outlineSection.ts     # ~200行，简单
├── materialRelation.ts   # ~150行，简单
├── materialBind.ts       # ~400行，中等复杂度
└── material/             # 素材相关Store
    ├── index.ts
    ├── types.ts
    └── state.ts
```

## 新Store架构设计

### Store目录结构

```
src/store/modules/
├── document/                    # 文档相关状态管理
│   ├── projectStore.ts          # 项目状态管理
│   ├── requirementStore.ts      # 需求状态管理
│   ├── outlineStore.ts          # 大纲状态管理
│   ├── contentStore.ts          # 内容状态管理
│   ├── materialStore.ts         # 素材状态管理
│   └── taskStore.ts             # 任务状态管理
├── ui/                          # UI状态管理
│   ├── loadingStore.ts          # 加载状态管理
│   ├── dialogStore.ts           # 对话框状态管理
│   ├── notificationStore.ts     # 通知状态管理
│   └── preferenceStore.ts       # 用户偏好设置
├── user/                        # 用户相关状态管理
│   ├── authStore.ts             # 认证状态管理
│   └── profileStore.ts          # 用户资料管理
└── system/                      # 系统级状态管理
    ├── featureFlagStore.ts      # 功能开关管理
    └── configStore.ts           # 系统配置管理
```

## 具体实现方案

### 1. 基础Store设计模式

#### Store接口定义

```typescript
// src/store/types/base.ts
export interface BaseStore<T = any> {
  // 状态
  state: T

  // 计算属性
  getters: {
    [key: string]: (state: T) => any
  }

  // 动作
  actions: {
    [key: string]: (payload?: any) => Promise<void> | void
  }
}

export interface StoreState {
  id?: string
  createdAt?: number
  updatedAt?: number
}

export interface PaginatedState<T> extends StoreState {
  items: T[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  error: string | null
}
```

#### Store基类

```typescript
// src/store/base/BaseStore.ts
import { defineStore } from 'pinia'
import type { BaseStore } from '../types/base'

export abstract class BaseStoreImpl<T extends Record<string, any>> implements BaseStore<T> {
  protected abstract initialState(): T

  // 创建Pinia store
  protected createStore(id: string, options?: any) {
    return defineStore(id, {
      state: () => ({
        ...this.initialState(),
        ...options?.state
      }),
      getters: {
        ...this.getters(),
        ...options?.getters
      },
      actions: {
        ...this.actions(),
        ...options?.actions
      }
    })
  }

  // 抽象方法，子类必须实现
  protected abstract getters(): Record<string, (state: T) => any>
  protected abstract actions(): Record<string, (this: any, ...args: any[]) => any>

  // 通用辅助方法
  protected setLoading(loading: boolean) {
    // 在具体store中实现
  }

  protected setError(error: string | null) {
    // 在具体store中实现
  }

  protected clearError() {
    this.setError(null)
  }
}
```

### 2. UI状态Store实现

#### LoadingStore

```typescript
// src/store/modules/ui/loadingStore.ts
import { defineStore } from 'pinia'

interface LoadingState {
  loadingStates: Map<string, boolean>
  globalLoading: boolean
}

export const useLoadingStore = defineStore('loading', {
  state: (): LoadingState => ({
    loadingStates: new Map(),
    globalLoading: false
  }),

  getters: {
    isLoading: (state) => (key?: string) => {
      if (key) {
        return state.loadingStates.get(key) || false
      }
      return state.globalLoading || state.loadingStates.size > 0
    },

    getLoadingKeys: (state) => () => {
      return Array.from(state.loadingStates.keys()).filter((key) => state.loadingStates.get(key))
    }
  },

  actions: {
    setLoading(key: string, isLoading: boolean) {
      if (isLoading) {
        this.loadingStates.set(key, true)
      } else {
        this.loadingStates.delete(key)
      }
    },

    setGlobalLoading(isLoading: boolean) {
      this.globalLoading = isLoading
    },

    clearAllLoading() {
      this.loadingStates.clear()
      this.globalLoading = false
    },

    hasAnyLoading(): boolean {
      return this.globalLoading || this.loadingStates.size > 0
    }
  }
})
```

#### NotificationStore

```typescript
// src/store/modules/ui/notificationStore.ts
import { defineStore } from 'pinia'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message?: string
  duration?: number
  timestamp: number
}

interface NotificationState {
  notifications: Notification[]
  maxNotifications: number
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    notifications: [],
    maxNotifications: 5
  }),

  getters: {
    recentNotifications: (state) => {
      return state.notifications.slice(0, state.maxNotifications)
    },

    hasUnreadNotifications: (state) => {
      return state.notifications.length > 0
    }
  },

  actions: {
    showNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
      const id = Date.now().toString()
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: Date.now(),
        duration: notification.duration || 5000
      }

      this.notifications.unshift(newNotification)

      // 限制通知数量
      if (this.notifications.length > this.maxNotifications) {
        this.notifications = this.notifications.slice(0, this.maxNotifications)
      }

      // 自动移除通知
      if (newNotification.duration > 0) {
        setTimeout(() => {
          this.removeNotification(id)
        }, newNotification.duration)
      }

      return id
    },

    showSuccess(title: string, message?: string, duration?: number) {
      return this.showNotification({
        type: 'success',
        title,
        message,
        duration
      })
    },

    showError(title: string, message?: string, duration?: number) {
      return this.showNotification({
        type: 'error',
        title,
        message,
        duration: duration || 8000 // 错误通知显示更久
      })
    },

    showWarning(title: string, message?: string, duration?: number) {
      return this.showNotification({
        type: 'warning',
        title,
        message,
        duration
      })
    },

    showInfo(title: string, message?: string, duration?: number) {
      return this.showNotification({
        type: 'info',
        title,
        message,
        duration
      })
    },

    removeNotification(id: string) {
      this.notifications = this.notifications.filter((n) => n.id !== id)
    },

    clearAllNotifications() {
      this.notifications = []
    }
  }
})
```

#### DialogStore

```typescript
// src/store/modules/ui/dialogStore.ts
import { defineStore } from 'pinia'

interface Dialog {
  id: string
  title: string
  component?: any
  props?: Record<string, any>
  visible: boolean
  closable?: boolean
  maskClosable?: boolean
}

interface DialogState {
  dialogs: Map<string, Dialog>
  activeDialogId: string | null
}

export const useDialogStore = defineStore('dialog', {
  state: (): DialogState => ({
    dialogs: new Map(),
    activeDialogId: null
  }),

  getters: {
    activeDialog: (state) => {
      return state.activeDialogId ? state.dialogs.get(state.activeDialogId) : null
    },

    visibleDialogs: (state) => {
      return Array.from(state.dialogs.values()).filter((dialog) => dialog.visible)
    }
  },

  actions: {
    openDialog(options: Omit<Dialog, 'visible'>) {
      const dialog: Dialog = {
        ...options,
        visible: true,
        closable: options.closable ?? true,
        maskClosable: options.maskClosable ?? true
      }

      this.dialogs.set(options.id, dialog)
      this.activeDialogId = options.id

      return options.id
    },

    closeDialog(id: string) {
      const dialog = this.dialogs.get(id)
      if (dialog) {
        dialog.visible = false
      }

      if (this.activeDialogId === id) {
        this.activeDialogId = null
      }
    },

    toggleDialog(id: string) {
      const dialog = this.dialogs.get(id)
      if (dialog) {
        dialog.visible = !dialog.visible
        this.activeDialogId = dialog.visible ? id : null
      }
    },

    updateDialogProps(id: string, props: Record<string, any>) {
      const dialog = this.dialogs.get(id)
      if (dialog) {
        dialog.props = { ...dialog.props, ...props }
      }
    },

    removeDialog(id: string) {
      this.dialogs.delete(id)
      if (this.activeDialogId === id) {
        this.activeDialogId = null
      }
    },

    closeAllDialogs() {
      this.dialogs.forEach((dialog) => {
        dialog.visible = false
      })
      this.activeDialogId = null
    }
  }
})
```

### 3. 文档状态Store实现

#### ProjectStore

```typescript
// src/store/modules/document/projectStore.ts
import { defineStore } from 'pinia'
import type { Project, ProjectFilters } from '@/types/project'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  error: string | null
  filters: ProjectFilters
  lastUpdated: number | null
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
      type: 'all',
      dateRange: null
    },
    lastUpdated: null
  }),

  getters: {
    filteredProjects: (state) => {
      let projects = state.projects

      // 关键词过滤
      if (state.filters.keyword) {
        const keyword = state.filters.keyword.toLowerCase()
        projects = projects.filter(
          (project) =>
            project.name.toLowerCase().includes(keyword) ||
            project.description.toLowerCase().includes(keyword)
        )
      }

      // 状态过滤
      if (state.filters.status !== 'all') {
        projects = projects.filter((project) => project.status === state.filters.status)
      }

      // 类型过滤
      if (state.filters.type !== 'all') {
        projects = projects.filter((project) => project.type === state.filters.type)
      }

      // 日期范围过滤
      if (state.filters.dateRange) {
        const [start, end] = state.filters.dateRange
        projects = projects.filter((project) => {
          const projectDate = new Date(project.createTime)
          return projectDate >= start && projectDate <= end
        })
      }

      return projects
    },

    projectById: (state) => (id: string) => {
      return state.projects.find((project) => project.id === id)
    },

    projectsByStatus: (state) => (status: string) => {
      return state.projects.filter((project) => project.status === status)
    },

    recentProjects: (state) => {
      return [...state.projects]
        .sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime())
        .slice(0, 5)
    },

    isEmpty: (state) => state.projects.length === 0,
    hasError: (state) => !!state.error
  },

  actions: {
    async fetchProjects() {
      this.loading = true
      this.error = null

      try {
        // 注意：这里不直接调用Service，由Composable层调用
        // Store只负责状态管理
        const projects = [] // 这里应该由Composable层传入数据
        this.projects = projects
        this.lastUpdated = Date.now()
      } catch (error) {
        this.error = error instanceof Error ? error.message : '获取项目列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    setCurrentProject(project: Project | null) {
      this.currentProject = project
    },

    updateProject(projectId: string, updates: Partial<Project>) {
      const index = this.projects.findIndex((p) => p.id === projectId)
      if (index !== -1) {
        this.projects[index] = {
          ...this.projects[index],
          ...updates,
          updatedAt: Date.now()
        }

        // 更新当前项目
        if (this.currentProject?.id === projectId) {
          this.currentProject = { ...this.currentProject, ...updates }
        }
      }
    },

    addProject(project: Project) {
      this.projects.unshift(project)
      this.lastUpdated = Date.now()
    },

    removeProject(projectId: string) {
      this.projects = this.projects.filter((p) => p.id !== projectId)

      // 清除当前项目
      if (this.currentProject?.id === projectId) {
        this.currentProject = null
      }

      this.lastUpdated = Date.now()
    },

    updateFilters(filters: Partial<ProjectFilters>) {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters() {
      this.filters = {
        keyword: '',
        status: 'all',
        type: 'all',
        dateRange: null
      }
    },

    clearError() {
      this.error = null
    }
  }
})
```

#### TaskStore

```typescript
// src/store/modules/document/taskStore.ts
import { defineStore } from 'pinia'
import type { AsyncTask } from '@/types/task'

interface TaskState {
  tasks: Map<string, AsyncTask>
  activeTaskIds: Set<string>
  completedTaskIds: Set<string>
  failedTaskIds: Set<string>
}

export const useTaskStore = defineStore('task', {
  state: (): TaskState => ({
    tasks: new Map(),
    activeTaskIds: new Set(),
    completedTaskIds: new Set(),
    failedTaskIds: new Set()
  }),

  getters: {
    getTask: (state) => (taskId: string) => {
      return state.tasks.get(taskId)
    },

    activeTasks: (state) => {
      return Array.from(state.activeTaskIds)
        .map((id) => state.tasks.get(id))
        .filter(Boolean) as AsyncTask[]
    },

    completedTasks: (state) => {
      return Array.from(state.completedTaskIds)
        .map((id) => state.tasks.get(id))
        .filter(Boolean) as AsyncTask[]
    },

    failedTasks: (state) => {
      return Array.from(state.failedTaskIds)
        .map((id) => state.tasks.get(id))
        .filter(Boolean) as AsyncTask[]
    },

    hasActiveTasks: (state) => state.activeTaskIds.size > 0,

    getTasksByType: (state) => (type: string) => {
      return Array.from(state.tasks.values()).filter((task) => task.type === type)
    }
  },

  actions: {
    addTask(task: AsyncTask) {
      this.tasks.set(task.id, task)

      if (task.status === 'pending' || task.status === 'running') {
        this.activeTaskIds.add(task.id)
      }
    },

    updateTask(taskId: string, updates: Partial<AsyncTask>) {
      const task = this.tasks.get(taskId)
      if (!task) return

      const updatedTask = { ...task, ...updates }
      this.tasks.set(taskId, updatedTask)

      // 更新任务状态集合
      this.activeTaskIds.delete(taskId)
      this.completedTaskIds.delete(taskId)
      this.failedTaskIds.delete(taskId)

      switch (updatedTask.status) {
        case 'pending':
        case 'running':
          this.activeTaskIds.add(taskId)
          break
        case 'completed':
          this.completedTaskIds.add(taskId)
          break
        case 'failed':
          this.failedTaskIds.add(taskId)
          break
      }
    },

    removeTask(taskId: string) {
      this.tasks.delete(taskId)
      this.activeTaskIds.delete(taskId)
      this.completedTaskIds.delete(taskId)
      this.failedTaskIds.delete(taskId)
    },

    clearCompletedTasks() {
      this.completedTaskIds.forEach((id) => {
        this.tasks.delete(id)
      })
      this.completedTaskIds.clear()
    },

    clearFailedTasks() {
      this.failedTaskIds.forEach((id) => {
        this.tasks.delete(id)
      })
      this.failedTaskIds.clear()
    },

    clearAllTasks() {
      this.tasks.clear()
      this.activeTaskIds.clear()
      this.completedTaskIds.clear()
      this.failedTaskIds.clear()
    }
  }
})
```

#### RequirementStore

```typescript
// src/store/modules/document/requirementStore.ts
import { defineStore } from 'pinia'
import type { Requirement, ResearchBrief, Title } from '@/types/document'

interface RequirementState {
  requirement: Requirement | null
  researchBrief: ResearchBrief | null
  generatedTitles: Title[]
  selectedTitle: Title | null
  customKeywords: string[]
  searchResults: any[]
  briefDialogVisible: boolean
  editableBrief: string
}

export const useRequirementStore = defineStore('requirement', {
  state: (): RequirementState => ({
    requirement: null,
    researchBrief: null,
    generatedTitles: [],
    selectedTitle: null,
    customKeywords: [],
    searchResults: [],
    briefDialogVisible: false,
    editableBrief: ''
  }),

  getters: {
    hasRequirement: (state) => !!state.requirement,
    hasResearchBrief: (state) => !!state.researchBrief,
    hasGeneratedTitles: (state) => state.generatedTitles.length > 0,
    hasSelectedTitle: (state) => !!state.selectedTitle,
    hasSearchResults: (state) => state.searchResults.length > 0,

    canGenerateBriefing: (state) => {
      return state.requirement?.topic && state.requirement.topic.trim().length > 0
    },

    canGenerateTitles: (state) => {
      return state.researchBrief && state.searchResults.length > 0
    },

    titleOptions: (state) => {
      return [
        ...state.generatedTitles,
        ...state.customKeywords.map(
          (keyword) =>
            ({
              id: `custom-${keyword}`,
              title: keyword,
              angle: '',
              score: 0
            }) as Title
        )
      ]
    }
  },

  actions: {
    setRequirement(requirement: Requirement) {
      this.requirement = requirement
    },

    updateRequirement(updates: Partial<Requirement>) {
      if (this.requirement) {
        this.requirement = { ...this.requirement, ...updates }
      }
    },

    setResearchBrief(brief: ResearchBrief) {
      this.researchBrief = brief
    },

    updateResearchBrief(content: string) {
      if (this.researchBrief) {
        this.researchBrief.content = content
      }
    },

    setGeneratedTitles(titles: Title[]) {
      this.generatedTitles = titles
    },

    addTitle(title: Title) {
      this.generatedTitles.push(title)
    },

    selectTitle(title: Title) {
      this.selectedTitle = title
    },

    clearSelectedTitle() {
      this.selectedTitle = null
    },

    setSearchResults(results: any[]) {
      this.searchResults = results
    },

    addCustomKeyword(keyword: string) {
      if (!this.customKeywords.includes(keyword)) {
        this.customKeywords.push(keyword)
      }
    },

    removeCustomKeyword(keyword: string) {
      const index = this.customKeywords.indexOf(keyword)
      if (index > -1) {
        this.customKeywords.splice(index, 1)
      }
    },

    setBriefDialogVisible(visible: boolean) {
      this.briefDialogVisible = visible
      if (visible && this.researchBrief) {
        this.editableBrief = this.researchBrief.content
      }
    },

    updateEditableBrief(content: string) {
      this.editableBrief = content
    },

    reset() {
      this.requirement = null
      this.researchBrief = null
      this.generatedTitles = []
      this.selectedTitle = null
      this.customKeywords = []
      this.searchResults = []
      this.briefDialogVisible = false
      this.editableBrief = ''
    }
  }
})
```

### 4. Store适配器实现

#### 通用适配器基类

```typescript
// src/store/adapters/BaseAdapter.ts
export abstract class BaseStoreAdapter<TNew, TOld> {
  protected newStore: TNew
  protected oldStore: TOld
  protected featureFlag: string

  constructor(newStore: TNew, oldStore: TOld, featureFlag: string) {
    this.newStore = newStore
    this.oldStore = oldStore
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

#### ProjectStore适配器

```typescript
// src/store/adapters/projectAdapter.ts
import { BaseStoreAdapter } from './BaseAdapter'
import { useProjectStore } from '../modules/document/projectStore'
import { useOldProjectStore } from '../modules/project' // 假设的旧Store

export class ProjectStoreAdapter extends BaseStoreAdapter<any, any> {
  constructor() {
    const newStore = useProjectStore()
    const oldStore = useOldProjectStore()
    super(newStore, oldStore, 'new-project-store')
  }

  adapt() {
    if (this.useNew()) {
      return {
        // 新Store接口
        projects: this.newStore.projects,
        currentProject: this.newStore.currentProject,
        loading: this.newStore.loading,
        error: this.newStore.error,
        filteredProjects: this.newStore.filteredProjects,

        // 方法
        fetchProjects: () => this.newStore.fetchProjects(),
        setCurrentProject: (project: any) => this.newStore.setCurrentProject(project),
        updateProject: (id: string, updates: any) => this.newStore.updateProject(id, updates),
        addProject: (project: any) => this.newStore.addProject(project),
        removeProject: (id: string) => this.newStore.removeProject(id),
        updateFilters: (filters: any) => this.newStore.updateFilters(filters)
      }
    } else {
      return {
        // 旧Store接口
        projects: this.oldStore.projects,
        currentProject: this.oldStore.currentProject,
        loading: this.oldStore.loading,
        error: this.oldStore.error,
        filteredProjects: this.oldStore.filteredProjects,

        // 方法
        fetchProjects: () => this.oldStore.fetchProjects(),
        setCurrentProject: (project: any) => this.oldStore.setCurrentProject(project),
        updateProject: (id: string, updates: any) => this.oldStore.updateProject(id, updates),
        addProject: (project: any) => this.oldStore.addProject(project),
        removeProject: (id: string) => this.oldStore.removeProject(id),
        updateFilters: (filters: any) => this.oldStore.updateFilters(filters)
      }
    }
  }
}

// 导出适配器实例
export function useProjectStoreAdapter() {
  const adapter = new ProjectStoreAdapter()
  return adapter.adapt()
}
```

## 迁移策略

### 阶段1: 创建新Store结构

1. **创建新Store目录结构**

   - 按照设计的目录结构创建新文件夹
   - 创建基础类型定义文件

2. **实现基础Store**
   - 先实现简单的UI状态Store
   - 实现Store基类和通用逻辑

### 阶段2: 逐步迁移现有Store

1. **按复杂度排序迁移**:

   - LoadingStore (最简单)
   - NotificationStore
   - DialogStore
   - ProjectStore
   - TaskStore
   - RequirementStore
   - OutlineStore
   - ContentStore
   - MaterialStore

2. **每个Store迁移流程**:
   - 创建新Store实现
   - 编写单元测试
   - 创建适配器
   - 通过功能开关控制切换
   - 逐步测试和验证

### 阶段3: 清理和优化

1. **移除旧Store代码**
2. **移除适配器代码**
3. **更新导入路径**
4. **性能优化**

## 测试策略

### 单元测试

```typescript
// tests/store/projectStore.test.ts
import { createPinia, setActivePinia } from 'pinia'
import { useProjectStore } from '@/store/modules/document/projectStore'

describe('ProjectStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default state', () => {
    const store = useProjectStore()
    expect(store.projects).toEqual([])
    expect(store.currentProject).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should add project correctly', () => {
    const store = useProjectStore()
    const project = { id: '1', name: 'Test Project' }

    store.addProject(project)

    expect(store.projects).toHaveLength(1)
    expect(store.projects[0]).toEqual(project)
  })

  it('should filter projects by keyword', () => {
    const store = useProjectStore()
    store.projects = [
      { id: '1', name: 'React Project', description: 'React app' },
      { id: '2', name: 'Vue Project', description: 'Vue app' }
    ]

    store.updateFilters({ keyword: 'React' })

    expect(store.filteredProjects).toHaveLength(1)
    expect(store.filteredProjects[0].name).toBe('React Project')
  })
})
```

### 集成测试

```typescript
// tests/store/storeIntegration.test.ts
import { createPinia, setActivePinia } from 'pinia'
import { useProjectStore } from '@/store/modules/document/projectStore'
import { useLoadingStore } from '@/store/modules/ui/loadingStore'

describe('Store Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should work together across stores', async () => {
    const projectStore = useProjectStore()
    const loadingStore = useLoadingStore()

    // 测试Store间的协作
    loadingStore.setLoading('projects', true)
    expect(loadingStore.isLoading('projects')).toBe(true)

    await projectStore.fetchProjects()
    expect(projectStore.loading).toBe(false)
    expect(loadingStore.isLoading('projects')).toBe(false)
  })
})
```

## 性能优化

### 状态优化

1. **使用计算属性缓存**: 避免重复计算
2. **合理使用watch**: 避免不必要的监听
3. **状态扁平化**: 避免深层嵌套
4. **按需加载**: 大型数据分页加载

### 内存优化

1. **及时清理**: 清理不再使用的状态
2. **使用WeakMap**: 临时数据存储
3. **避免内存泄漏**: 正确清理事件监听

## 监控和调试

### 开发工具

```typescript
// src/store/utils/devtools.ts
export function setupStoreDevtools() {
  if (process.env.NODE_ENV === 'development') {
    // 集成Vue DevTools
    // 添加Store状态监控
    // 添加状态变更日志
  }
}

export function logStoreChange(storeName: string, action: string, payload: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Store:${storeName}] ${action}`, payload)
  }
}
```

### 错误监控

```typescript
// src/store/utils/errorHandler.ts
export function handleStoreError(error: Error, context: string) {
  console.error(`[Store Error] ${context}:`, error)
  // 发送错误到监控系统
  // 可选：自动回滚到安全状态
}
```

这个Store层重构方案提供了清晰的实施路径，确保在迁移过程中系统稳定性，同时为上层提供更好的状态管理基础。
