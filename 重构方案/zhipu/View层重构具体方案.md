# View层重构具体方案

## 重构目标

将现有的复杂View组件重构为清晰、模块化的UI组件架构，确保View层只负责渲染和用户交互，为用户提供优秀的界面体验。

## 当前View层问题分析

### 现有View组件问题

1. **职责混乱**: View组件包含大量业务逻辑
2. **组件过大**: 单个组件文件超过1000行代码
3. **重复代码**: 相似UI逻辑在多个组件中重复
4. **耦合度高**: 组件间直接调用，缺乏清晰的接口
5. **可复用性差**: 组件与业务逻辑耦合，难以复用
6. **测试困难**: 大型组件难以进行单元测试

### 现有View文件分析

```
src/views/document-generation/
├── project-list/
│   └── index.vue                 # ~400行，中等复杂度
├── topic-selection/
│   └── index.vue                 # ~600行，较复杂
├── outline/
│   └── index.vue                 # ~800行，复杂
│   ├── TitleSection.vue          # ~200行
│   ├── OutlineEditorSection.vue  # ~400行
│   └── MaterialsSection.vue      # ~300行
└── content/
    └── index.vue                 # ~1200行，过于复杂
```

## 新View架构设计

### View组件目录结构

```
src/views/document-generation/
├── project-list/
│   ├── index.vue                 # 项目列表主页面
│   ├── components/
│   │   ├── ProjectCard.vue       # 项目卡片组件
│   │   ├── ProjectForm.vue       # 项目表单组件
│   │   ├── SearchBar.vue         # 搜索栏组件
│   │   ├── ProjectStatus.vue     # 项目状态组件
│   │   └── EmptyState.vue        # 空状态组件
│   └── composables/
│       └── useProjectListView.ts # 页面级组合逻辑
├── topic-selection/
│   ├── index.vue                 # 选题策划主页面
│   ├── components/
│   │   ├── RequirementForm.vue   # 需求表单组件
│   │   ├── AIBriefing.vue        # AI简报组件
│   │   ├── TitleSelection.vue    # 标题选择组件
│   │   ├── TaskProgress.vue      # 任务进度组件
│   │   ├── WorkflowSteps.vue     # 工作流步骤组件
│   │   └── KeywordManager.vue    # 关键词管理组件
│   └── composables/
│       └── useTopicSelectionView.ts # 页面级组合逻辑
├── outline/
│   ├── index.vue                 # 大纲编辑主页面
│   ├── components/
│   │   ├── OutlineEditor.vue     # 大纲编辑器组件
│   │   ├── ChapterEditor.vue     # 章节编辑组件
│   │   ├── MaterialLibrary.vue   # 素材库组件
│   │   ├── MaterialItem.vue      # 素材项组件
│   │   ├── ChapterBinding.vue    # 章节绑定组件
│   │   ├── OutlineToolbar.vue    # 大纲工具栏
│   │   └── OutlineStats.vue      # 大纲统计组件
│   └── composables/
│       └── useOutlineView.ts     # 页面级组合逻辑
├── content/
│   ├── index.vue                 # 内容创作主页面
│   ├── components/
│   │   ├── MarkdownEditor.vue    # Markdown编辑器组件
│   │   ├── ContentPreview.vue    # 内容预览组件
│   │   ├── EditorToolbar.vue     # 编辑器工具栏
│   │   ├── ChapterNavigation.vue # 章节导航组件
│   │   ├── AIAssistant.vue       # AI助手组件
│   │   ├── ContentStats.vue      # 内容统计组件
│   │   └── SaveStatus.vue        # 保存状态组件
│   └── composables/
│       └── useContentView.ts     # 页面级组合逻辑
└── shared/
    ├── components/
    │   ├── LoadingSpinner.vue    # 加载动画组件
    │   ├── ErrorBoundary.vue     # 错误边界组件
    │   ├── ConfirmDialog.vue     # 确认对话框组件
    │   ├── PageHeader.vue        # 页面头部组件
    │   └── StepIndicator.vue     # 步骤指示器组件
    └── composables/
        ├── usePageState.ts       # 页面状态管理
        ├── useNavigation.ts      # 导航逻辑
        └── useKeyboardShortcuts.ts # 键盘快捷键
```

## 具体实现方案

### 1. 基础组件设计模式

#### 组件接口规范

```typescript
// src/views/types/component.ts
export interface BaseComponentProps {
  class?: string
  style?: string | Record<string, any>
  id?: string
}

export interface LoadingComponentProps extends BaseComponentProps {
  loading: boolean
  size?: 'small' | 'medium' | 'large'
  text?: string
}

export interface ErrorComponentProps extends BaseComponentProps {
  error: Error | string
  retry?: () => void
  showRetry?: boolean
}

export interface ActionComponentProps extends BaseComponentProps {
  disabled?: boolean
  loading?: boolean
  icon?: string
}
```

#### 组件基类

```typescript
// src/views/base/BaseComponent.vue
<template>
  <div
    :class="componentClass"
    :style="componentStyle"
    :id="id"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BaseComponentProps } from '../types/component'

interface Props extends BaseComponentProps {}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  style: () => ({}),
  id: ''
})

const componentClass = computed(() => {
  const baseClass = 'base-component'
  return props.class ? `${baseClass} ${props.class}` : baseClass
})

const componentStyle = computed(() => {
  if (typeof props.style === 'string') {
    return props.style
  }
  return { ...props.style }
})
</script>
```

### 2. 共享组件实现

#### 加载动画组件

```vue
<!-- src/views/document-generation/shared/components/LoadingSpinner.vue -->
<template>
  <div
    v-if="loading"
    :class="[
      'loading-spinner',
      `loading-spinner--${size}`,
      { 'loading-spinner--with-text': !!text }
    ]"
    v-bind="$attrs"
  >
    <div class="loading-spinner__spinner">
      <div class="loading-spinner__dot"></div>
      <div class="loading-spinner__dot"></div>
      <div class="loading-spinner__dot"></div>
    </div>
    <div v-if="text" class="loading-spinner__text">
      {{ text }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { LoadingComponentProps } from '../../types/component'

  interface Props extends LoadingComponentProps {}

  withDefaults(defineProps<Props>(), {
    size: 'medium',
    text: ''
  })
</script>

<style scoped lang="scss">
  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;

    &--small {
      .loading-spinner__spinner {
        width: 24px;
        height: 24px;
      }
    }

    &--medium {
      .loading-spinner__spinner {
        width: 40px;
        height: 40px;
      }
    }

    &--large {
      .loading-spinner__spinner {
        width: 60px;
        height: 60px;
      }
    }

    &__spinner {
      display: flex;
      gap: 4px;
    }

    &__dot {
      width: 8px;
      height: 8px;
      background-color: var(--el-color-primary);
      border-radius: 50%;
      animation: loading-spinner-bounce 1.4s ease-in-out infinite both;

      &:nth-child(1) {
        animation-delay: -0.32s;
      }

      &:nth-child(2) {
        animation-delay: -0.16s;
      }
    }

    &__text {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }

    @keyframes loading-spinner-bounce {
      0%,
      80%,
      100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }
  }
</style>
```

#### 错误边界组件

```vue
<!-- src/views/document-generation/shared/components/ErrorBoundary.vue -->
<template>
  <div class="error-boundary">
    <div class="error-boundary__icon">
      <i class="iconfont-sys">&#xe6a3;</i>
    </div>
    <div class="error-boundary__content">
      <h3 class="error-boundary__title">出现了一些问题</h3>
      <p class="error-boundary__message">
        {{ errorMessage }}
      </p>
    </div>
    <div v-if="showRetry && retry" class="error-boundary__actions">
      <el-button type="primary" @click="retry" :loading="retrying"> 重试 </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { ErrorComponentProps } from '../../types/component'

  interface Props extends ErrorComponentProps {}

  const props = withDefaults(defineProps<Props>(), {
    showRetry: true
  })

  const emit = defineEmits<{
    retry: []
  }>()

  const retrying = ref(false)

  const errorMessage = computed(() => {
    if (typeof props.error === 'string') {
      return props.error
    }
    return props.error?.message || '未知错误'
  })

  const handleRetry = async () => {
    if (props.retry) {
      retrying.value = true
      try {
        await props.retry()
        emit('retry')
      } finally {
        retrying.value = false
      }
    }
  }
</script>

<style scoped lang="scss">
  .error-boundary {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    background-color: var(--el-fill-color-lighter);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-light);

    &__icon {
      font-size: 48px;
      color: var(--el-color-warning);
      margin-bottom: 16px;
    }

    &__title {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__message {
      margin: 0 0 24px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
      line-height: 1.5;
    }

    &__actions {
      display: flex;
      gap: 12px;
    }
  }
</style>
```

#### 确认对话框组件

```vue
<!-- src/views/document-generation/shared/components/ConfirmDialog.vue -->
<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :before-close="handleClose"
    append-to-body
  >
    <div class="confirm-dialog__content">
      <div v-if="icon" class="confirm-dialog__icon" :class="`confirm-dialog__icon--${type}`">
        <i :class="icon"></i>
      </div>
      <div class="confirm-dialog__text">
        <p class="confirm-dialog__message">{{ message }}</p>
        <p v-if="description" class="confirm-dialog__description">
          {{ description }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="confirm-dialog__footer">
        <el-button @click="handleCancel">
          {{ cancelText }}
        </el-button>
        <el-button :type="confirmType" :loading="loading" @click="handleConfirm">
          {{ confirmText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    modelValue: boolean
    title?: string
    message: string
    description?: string
    type?: 'info' | 'success' | 'warning' | 'error'
    confirmText?: string
    cancelText?: string
    width?: string
    loading?: boolean
    icon?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '确认操作',
    type: 'warning',
    confirmText: '确定',
    cancelText: '取消',
    width: '420px',
    loading: false
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    confirm: []
    cancel: []
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const confirmType = computed(() => {
    const typeMap = {
      info: 'primary',
      success: 'success',
      warning: 'warning',
      error: 'danger'
    }
    return typeMap[props.type] || 'primary'
  })

  const defaultIcon = computed(() => {
    const iconMap = {
      info: 'el-icon-info',
      success: 'el-icon-success',
      warning: 'el-icon-warning',
      error: 'el-icon-error'
    }
    return props.icon || iconMap[props.type] || 'el-icon-warning'
  })

  const handleConfirm = () => {
    emit('confirm')
  }

  const handleCancel = () => {
    visible.value = false
    emit('cancel')
  }

  const handleClose = () => {
    if (!props.loading) {
      visible.value = false
    }
  }
</script>

<style scoped lang="scss">
  .confirm-dialog {
    &__content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    &__icon {
      font-size: 24px;
      margin-top: 2px;

      &--info {
        color: var(--el-color-info);
      }

      &--success {
        color: var(--el-color-success);
      }

      &--warning {
        color: var(--el-color-warning);
      }

      &--error {
        color: var(--el-color-error);
      }
    }

    &__text {
      flex: 1;
    }

    &__message {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      line-height: 1.5;
    }

    &__description {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
      line-height: 1.5;
    }

    &__footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }
</style>
```

### 3. 项目列表页面组件

#### 项目卡片组件

```vue
<!-- src/views/document-generation/project-list/components/ProjectCard.vue -->
<template>
  <div
    class="project-card"
    :class="{ 'project-card--loading': isLoading }"
    @click="handleCardClick"
  >
    <div class="project-card__header">
      <div class="project-card__title-section">
        <h3 class="project-card__title">{{ project.name }}</h3>
        <el-tag :type="getStatusType(project.status)" size="small" class="project-card__status">
          {{ getStatusText(project.status) }}
        </el-tag>
      </div>
      <div class="project-card__actions">
        <el-dropdown @command="handleCommand" trigger="click">
          <el-button text :icon="MoreFilled" class="project-card__menu" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">
                <el-icon><Edit /></el-icon>
                编辑
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided>
                <el-icon><Delete /></el-icon>
                删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="project-card__content">
      <p class="project-card__description">{{ project.description }}</p>

      <div class="project-card__meta">
        <div class="project-card__meta-item">
          <el-icon><Calendar /></el-icon>
          <span>创建于 {{ formatDate(project.createTime) }}</span>
        </div>
        <div class="project-card__meta-item">
          <el-icon><Clock /></el-icon>
          <span>更新于 {{ formatDate(project.updateTime) }}</span>
        </div>
      </div>

      <div class="project-card__progress">
        <StepIndicator
          :steps="progressSteps"
          :current-step="getCurrentStep(project)"
          size="small"
        />
      </div>
    </div>

    <div class="project-card__footer">
      <el-button type="primary" size="small" @click.stop="handleContinue" :loading="isLoading">
        {{ getActionText(project.status) }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { MoreFilled, Edit, Delete, Calendar, Clock } from '@element-plus/icons-vue'
  import type { Project } from '@/types/project'
  import StepIndicator from '../../../shared/components/StepIndicator.vue'

  interface Props {
    project: Project
    isLoading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    isLoading: false
  })

  interface Emits {
    continue: [project: Project]
    edit: [project: Project]
    delete: [project: Project]
  }

  const emit = defineEmits<Emits>()

  // 计算属性
  const progressSteps = computed(() => [
    { label: '选题', icon: 'el-icon-edit', status: 'pending' },
    { label: '大纲', icon: 'el-icon-tickets', status: 'pending' },
    { label: '正文', icon: 'el-icon-notebook', status: 'pending' }
  ])

  const getCurrentStep = (project: Project) => {
    const stepMap = {
      draft: 0,
      topic_selected: 1,
      outline_completed: 2,
      content_in_progress: 2,
      completed: 3
    }
    return stepMap[project.status] || 0
  }

  // 方法
  const getStatusType = (status: string) => {
    const typeMap = {
      draft: 'info',
      topic_selected: 'warning',
      outline_completed: 'warning',
      content_in_progress: 'warning',
      completed: 'success'
    }
    return typeMap[status] || 'info'
  }

  const getStatusText = (status: string) => {
    const textMap = {
      draft: '草稿',
      topic_selected: '已选题',
      outline_completed: '大纲完成',
      content_in_progress: '内容创作中',
      completed: '已完成'
    }
    return textMap[status] || '未知'
  }

  const getActionText = (status: string) => {
    const actionMap = {
      draft: '开始创作',
      topic_selected: '继续选题',
      outline_completed: '开始创作',
      content_in_progress: '继续创作',
      completed: '查看详情'
    }
    return actionMap[status] || '查看'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // 事件处理
  const handleCardClick = () => {
    emit('continue', props.project)
  }

  const handleContinue = () => {
    emit('continue', props.project)
  }

  const handleCommand = (command: string) => {
    switch (command) {
      case 'edit':
        emit('edit', props.project)
        break
      case 'delete':
        emit('delete', props.project)
        break
    }
  }
</script>

<style scoped lang="scss">
  .project-card {
    padding: 20px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
      transform: translateY(-2px);
      border-color: var(--el-color-primary-light-7);
    }

    &--loading {
      pointer-events: none;
      opacity: 0.7;
    }

    &__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    &__title-section {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    &__title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 1.4;
    }

    &__status {
      flex-shrink: 0;
    }

    &__actions {
      flex-shrink: 0;
    }

    &__menu {
      padding: 4px;
      color: var(--el-text-color-secondary);

      &:hover {
        color: var(--el-color-primary);
      }
    }

    &__content {
      margin-bottom: 16px;
    }

    &__description {
      margin: 0 0 16px;
      font-size: 14px;
      color: var(--el-text-color-regular);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    &__meta {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }

    &__meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--el-text-color-secondary);

      .el-icon {
        font-size: 14px;
      }
    }

    &__progress {
      margin-bottom: 16px;
    }

    &__footer {
      display: flex;
      justify-content: flex-end;
    }
  }

  @media (width <= 768px) {
    .project-card {
      padding: 16px;

      &__header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }

      &__title-section {
        width: 100%;
        justify-content: space-between;
      }

      &__actions {
        align-self: flex-end;
      }

      &__meta {
        flex-direction: row;
        justify-content: space-between;
      }
    }
  }
</style>
```

#### 项目表单组件

```vue
<!-- src/views/document-generation/project-list/components/ProjectForm.vue -->
<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    size="large"
    @submit.prevent="handleSubmit"
  >
    <el-form-item label="项目名称" prop="name">
      <el-input
        v-model="form.name"
        placeholder="请输入项目名称"
        maxlength="50"
        show-word-limit
        clearable
      />
    </el-form-item>

    <el-form-item label="项目描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        placeholder="请输入项目描述（可选）"
        maxlength="500"
        show-word-limit
        resize="none"
      />
    </el-form-item>

    <el-form-item label="项目类型" prop="type">
      <el-select v-model="form.type" placeholder="请选择项目类型" style="width: 100%">
        <el-option
          v-for="type in projectTypes"
          :key="type.value"
          :label="type.label"
          :value="type.value"
        >
          <div class="project-type-option">
            <el-icon>
              <component :is="type.icon" />
            </el-icon>
            <div class="project-type-option__content">
              <div class="project-type-option__label">{{ type.label }}</div>
              <div class="project-type-option__description">{{ type.description }}</div>
            </div>
          </div>
        </el-option>
      </el-select>
    </el-form-item>

    <div class="project-form__actions">
      <el-button @click="handleCancel"> 取消 </el-button>
      <el-button type="primary" native-type="submit" :loading="loading" :disabled="!canSubmit">
        {{ isEdit ? '更新项目' : '创建项目' }}
      </el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { Document, ChatDotRound, TrendCharts, EditPen } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import type { ProjectCreateForm, ProjectUpdateForm } from '@/types/project'

  interface Props {
    modelValue: boolean
    project?: any // 编辑模式时传入的项目数据
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false
  })

  interface Emits {
    'update:modelValue': [value: boolean]
    submit: [form: ProjectCreateForm | ProjectUpdateForm]
    cancel: []
  }

  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()

  // 表单数据
  const form = ref<ProjectCreateForm & ProjectUpdateForm>({
    name: '',
    description: '',
    type: 'article'
  })

  // 表单验证规则
  const rules: FormRules = {
    name: [
      { required: true, message: '请输入项目名称', trigger: 'blur' },
      { min: 2, max: 50, message: '项目名称长度在2-50个字符之间', trigger: 'blur' }
    ],
    description: [{ max: 500, message: '项目描述不能超过500个字符', trigger: 'blur' }],
    type: [{ required: true, message: '请选择项目类型', trigger: 'change' }]
  }

  // 项目类型选项
  const projectTypes = [
    {
      value: 'article',
      label: '文章创作',
      description: '适合写博客、散文、评论等',
      icon: Document
    },
    {
      value: 'report',
      label: '报告生成',
      description: '适合写分析报告、研究报告等',
      icon: TrendCharts
    },
    {
      value: 'marketing',
      label: '营销文案',
      description: '适合写广告文案、产品介绍等',
      icon: ChatDotRound
    },
    {
      value: 'technical',
      label: '技术文档',
      description: '适合写API文档、技术教程等',
      icon: EditPen
    }
  ]

  // 计算属性
  const isEdit = computed(() => !!props.project)
  const canSubmit = computed(() => {
    return form.value.name.trim().length >= 2 && form.value.type
  })

  // 监听项目数据变化，编辑模式下填充表单
  watch(
    () => props.project,
    (project) => {
      if (project) {
        form.value = {
          name: project.name || '',
          description: project.description || '',
          type: project.type || 'article'
        }
      } else {
        resetForm()
      }
    },
    { immediate: true }
  )

  // 监听对话框显示状态，重置表单
  watch(
    () => props.modelValue,
    (visible) => {
      if (!visible) {
        resetForm()
      }
    }
  )

  // 方法
  const resetForm = () => {
    form.value = {
      name: '',
      description: '',
      type: 'article'
    }
    formRef.value?.clearValidate()
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      emit('submit', { ...form.value })
    } catch (error) {
      // 表单验证失败
      console.warn('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    emit('cancel')
    emit('update:modelValue', false)
  }
</script>

<style scoped lang="scss">
  .project-form {
    &__actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }

  .project-type-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;

    &__content {
      flex: 1;
    }

    &__label {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      line-height: 1.4;
    }

    &__description {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.4;
      margin-top: 2px;
    }
  }

  :deep(.el-select-dropdown__item) {
    height: auto;
    padding: 8px 20px;
  }
</style>
```

#### 项目列表主页面

```vue
<!-- src/views/document-generation/project-list/index.vue -->
<template>
  <div class="project-list-container">
    <!-- 页面头部 -->
    <PageHeader
      title="AI创作项目列表"
      description="管理和创建您的AI文档创作项目"
    >
      <template #actions>
        <div class="page-header__actions">
          <SearchBar
            v-model="searchKeyword"
            placeholder="搜索项目名称或描述"
            @search="handleSearch"
            @clear="handleClearSearch"
          />
          <el-button
            type="primary"
            @click="showCreateDialog = true"
          >
            <el-icon><Plus /></el-icon>
            创建项目
          </el-button>
        </div>
      </template>
    </PageHeader>

    <!-- 主要内容区域 -->
    <div class="project-list__content">
      <!-- 加载状态 -->
      <LoadingSpinner
        v-if="isLoadingProjects"
        text="正在加载项目列表..."
        size="large"
      />

      <!-- 错误状态 -->
      <ErrorBoundary
        v-else-if="hasError"
        :error="errorMessage"
        :retry="loadProjects"
        show-retry
      />

      <!-- 空状态 -->
      <EmptyState
        v-else-if="filteredProjects.length === 0"
        :is-search="!!searchKeyword"
        @create="showCreateDialog = true"
        @clear-search="handleClearSearch"
      />

      <!-- 项目列表 -->
      <div
        v-else
        class="project-grid"
      >
        <ProjectCard
          v-for="project in filteredProjects"
          :key="project.id"
          :project="project"
          :is-loading="isProjectLoading(project.id)"
          @continue="handleContinueProject"
          @edit="handleEditProject"
          @delete="handleDeleteProject"
        />
      </div>
    </div>

    <!-- 创建/编辑项目对话框 -->
    <ProjectForm
      v-model="showCreateDialog"
      :loading="isCreatingProject"
      @submit="handleCreateProject"
      @cancel="handleCancelProjectForm"
    />

    <!-- 编辑项目对话框 -->
    <ProjectForm
      v-model="showEditDialog"
      :project="editingProject"
      :loading="isUpdatingProject"
      @submit="handleUpdateProject"
      @cancel="handleCancelEditForm"
    />

    <!-- 删除确认对话框 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="确认删除项目"
      :message="`确定要删除项目"${deletingProject?.name}"吗？`"
      description="删除后无法恢复，请谨慎操作。"
      type="error"
      confirm-text="删除"
      :loading="isDeletingProject"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useProjectManagement } from './composables/useProjectListView'
import { useErrorHandler } from '../../shared/composables/useErrorHandler'

// 组件导入
import PageHeader from '../../shared/components/PageHeader.vue'
import SearchBar from '../../shared/components/SearchBar.vue'
import LoadingSpinner from '../../shared/components/LoadingSpinner.vue'
import ErrorBoundary from '../../shared/components/ErrorBoundary.vue'
import EmptyState from './components/EmptyState.vue'
import ProjectCard from './components/ProjectCard.vue'
import ProjectForm from './components/ProjectForm.vue'
import ConfirmDialog from '../../shared/components/ConfirmDialog.vue'

// 页面级Composable
const {
  // 状态
  projects,
  loading,
  error,
  searchKeyword,

  // 对话框状态
  showCreateDialog,
  showEditDialog,
  showDeleteDialog,
  editingProject,
  deletingProject,

  // 方法
  loadProjects,
  createProject,
  updateProject,
  deleteProject,
  searchProjects,
  clearSearch,
  openCreateDialog,
  openEditDialog,
  openDeleteDialog,
  closeAllDialogs
} = useProjectManagement()

// 其他工具
const router = useRouter()
const { handleError } = useErrorHandler()

// 计算属性
const isLoadingProjects = computed(() => loading.value.projects)
const hasError = computed(() => !!error.value)
const errorMessage = computed(() => error.value?.message || '加载失败')
const filteredProjects = computed(() => projects.value)

const isCreatingProject = computed(() => loading.value.create)
const isUpdatingProject = computed(() => loading.value.update)
const isDeletingProject = computed(() => loading.value.delete)

const isProjectLoading = (projectId: string) => {
  return loading.value[`project-${projectId}`] || false
}

// 事件处理
const handleSearch = (keyword: string) => {
  searchProjects(keyword)
}

const handleClearSearch = () => {
  clearSearch()
}

const handleContinueProject = (project: any) => {
  // 根据项目状态跳转到相应页面
  const routeMap = {
    'draft': '/document-generation/topic-selection',
    'topic_selected': '/document-generation/outline',
    'outline_completed': '/document-generation/content',
    'content_in_progress': '/document-generation/content',
    'completed': '/document-generation/content'
  }

  const route = routeMap[project.status] || '/document-generation/topic-selection'
  router.push(`${route}/${project.id}`)
}

const handleEditProject = (project: any) => {
  openEditDialog(project)
}

const handleDeleteProject = (project: any) => {
  openDeleteDialog(project)
}

const handleCreateProject = async (formData: any) => {
  try {
    const newProject = await createProject(formData)
    ElMessage.success('项目创建成功')

    // 跳转到选题页面
    router.push(`/document-generation/topic-selection/${newProject.id}`)
  } catch (error) {
    handleError(error as Error, '创建项目')
  }
}

const handleUpdateProject = async (formData: any) => {
  try {
    await updateProject(editingProject.value.id, formData)
    ElMessage.success('项目更新成功')
  } catch (error) {
    handleError(error as Error, '更新项目')
  }
}

const handleConfirmDelete = async () => {
  try {
    await deleteProject(deletingProject.value.id)
    ElMessage.success('项目删除成功')
  } catch (error) {
    handleError(error as Error, '删除项目')
  }
}

const handleCancelProjectForm = () => {
  closeAllDialogs()
}

const handleCancelEditForm = () => {
  showEditDialog.value = false
}

const handleCancelDelete = () => {
  showDeleteDialog.value = false
}

// 生命周期
onMounted(async () => {
  try {
    await loadProjects()
  } catch (error) {
    handleError(error as Error, '加载项目列表')
  }
})
</script>

<style scoped lang="scss">
.project-list-container {
  padding: 20px;
  min-height: 100vh;
}

.page-header {
  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.project-list__content {
  margin-top: 20px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

@media (width <= 768px) {
  .project-list-container {
    padding: 16px;
  }

  .page-header {
    &__actions {
      flex-direction: column;
      width: 100%;
      gap: 12px;

      .el-input {
        width: 100%;
      }

      .el-button {
        width: 100%;
      }
    }
  }

  .project-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (width <= 480px) {
  .project-grid {
    grid-template-columns: 1fr;
  }
}
</style>
```

### 4. 页面级Composable

#### 项目列表页面Composable

```typescript
// src/views/document-generation/project-list/composables/useProjectListView.ts
import { ref, computed } from 'vue'
import { useProjectManagementAdapter } from '@/composables/adapters/projectManagementAdapter'
import { useDialogStore } from '@/store/modules/ui/dialogStore'
import type { Project } from '@/types/project'

export function useProjectListView() {
  // 使用项目管理Composable适配器
  const projectManagement = useProjectManagementAdapter()

  // UI状态Store
  const dialogStore = useDialogStore()

  // 本地UI状态
  const showCreateDialog = ref(false)
  const showEditDialog = ref(false)
  const showDeleteDialog = ref(false)
  const editingProject = ref<Project | null>(null)
  const deletingProject = ref<Project | null>(null)

  // 计算属性
  const projects = computed(() => projectManagement.projects || [])
  const loading = computed(() => projectManagement.isLoading || {})
  const error = computed(() => projectManagement.error)

  // 扩展加载状态，包含具体操作的加载状态
  const extendedLoading = computed(() => ({
    projects: loading.value.projects || false,
    create: loading.value.create || false,
    update: loading.value.update || false,
    delete: loading.value.delete || false,
    ...Object.fromEntries(
      projects.value.map((project) => [
        `project-${project.id}`,
        loading.value[`project-${project.id}`] || false
      ])
    )
  }))

  // 方法
  const loadProjects = async () => {
    return projectManagement.loadProjects()
  }

  const createProject = async (formData: any) => {
    const result = await projectManagement.createProject(formData)
    showCreateDialog.value = false
    return result
  }

  const updateProject = async (projectId: string, formData: any) => {
    const result = await projectManagement.updateProject(projectId, formData)
    showEditDialog.value = false
    editingProject.value = null
    return result
  }

  const deleteProject = async (projectId: string) => {
    const result = await projectManagement.deleteProject({ id: projectId } as Project)
    showDeleteDialog.value = false
    deletingProject.value = null
    return result
  }

  const searchProjects = (keyword: string) => {
    projectManagement.searchProjects(keyword)
  }

  const clearSearch = () => {
    projectManagement.searchProjects('')
  }

  // 对话框管理方法
  const openCreateDialog = () => {
    showCreateDialog.value = true
  }

  const openEditDialog = (project: Project) => {
    editingProject.value = project
    showEditDialog.value = true
  }

  const openDeleteDialog = (project: Project) => {
    deletingProject.value = project
    showDeleteDialog.value = true
  }

  const closeAllDialogs = () => {
    showCreateDialog.value = false
    showEditDialog.value = false
    showDeleteDialog.value = false
    editingProject.value = null
    deletingProject.value = null
  }

  return {
    // 状态
    projects,
    loading: extendedLoading,
    error,
    searchKeyword: projectManagement.searchKeyword,

    // 对话框状态
    showCreateDialog,
    showEditDialog,
    showDeleteDialog,
    editingProject,
    deletingProject,

    // 方法
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    searchProjects,
    clearSearch,

    // 对话框方法
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeAllDialogs
  }
}
```

## 迁移策略

### 阶段1: 创建共享组件库

1. **实现基础UI组件**

   - LoadingSpinner
   - ErrorBoundary
   - ConfirmDialog
   - PageHeader
   - SearchBar

2. **实现业务通用组件**
   - StepIndicator
   - EmptyState
   - StatusTag

### 阶段2: 重构项目列表页面

1. **拆分现有组件**

   - 从index.vue中提取ProjectCard
   - 创建ProjectForm组件
   - 实现页面级Composable

2. **创建适配器**
   - 保持与旧Composable的兼容性
   - 通过功能开关控制切换

### 阶段3: 重构选题策划页面

1. **拆分大型组件**

   - RequirementForm
   - AIBriefing
   - TitleSelection
   - TaskProgress

2. **优化组件结构**
   - 简化主页面组件
   - 提高组件复用性

### 阶段4: 重构大纲和内容页面

1. **大纲页面重构**

   - OutlineEditor
   - MaterialLibrary
   - ChapterBinding

2. **内容页面重构**
   - MarkdownEditor
   - ContentPreview
   - AIAssistant

### 阶段5: 清理和优化

1. **移除旧组件代码**
2. **优化组件性能**
3. **完善组件文档**

## 测试策略

### 组件单元测试

```typescript
// tests/views/components/ProjectCard.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ProjectCard from '@/views/document-generation/project-list/components/ProjectCard.vue'

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    name: 'Test Project',
    description: 'Test Description',
    status: 'draft',
    createTime: '2023-01-01',
    updateTime: '2023-01-02'
  }

  it('should render project information correctly', () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject }
    })

    expect(wrapper.find('.project-card__title').text()).toBe('Test Project')
    expect(wrapper.find('.project-card__description').text()).toBe('Test Description')
  })

  it('should emit continue event when card is clicked', async () => {
    const wrapper = mount(ProjectCard, {
      props: { project: mockProject }
    })

    await wrapper.find('.project-card').trigger('click')
    expect(wrapper.emitted('continue')).toBeTruthy()
    expect(wrapper.emitted('continue')?.[0]).toEqual([mockProject])
  })

  it('should show loading state when loading prop is true', () => {
    const wrapper = mount(ProjectCard, {
      props: {
        project: mockProject,
        isLoading: true
      }
    })

    expect(wrapper.find('.project-card--loading').exists()).toBe(true)
  })
})
```

### 页面集成测试

```typescript
// tests/views/project-list.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import ProjectList from '@/views/document-generation/project-list/index.vue'

// Mock composables
vi.mock('@/composables/adapters/projectManagementAdapter', () => ({
  useProjectManagementAdapter: () => ({
    projects: [],
    isLoading: { projects: false },
    error: null,
    loadProjects: vi.fn(),
    createProject: vi.fn(),
    searchProjects: vi.fn()
  })
}))

describe('ProjectList', () => {
  it('should render page header correctly', () => {
    const wrapper = mount(ProjectList)

    expect(wrapper.find('.page-header').exists()).toBe(true)
    expect(wrapper.find('.page-header__title').text()).toContain('AI创作项目列表')
  })

  it('should show loading spinner when loading', async () => {
    const wrapper = mount(ProjectList)
    // 模拟加载状态
    await wrapper.setData({ isLoadingProjects: true })

    expect(wrapper.findComponent({ name: 'LoadingSpinner' }).exists()).toBe(true)
  })
})
```

## 性能优化

### 组件懒加载

```typescript
// 路由配置中的懒加载
const routes = [
  {
    path: '/document-generation/project-list',
    component: () => import('@/views/document-generation/project-list/index.vue')
  }
]

// 组件内的懒加载
const ProjectForm = defineAsyncComponent(() => import('./components/ProjectForm.vue'))
```

### 虚拟滚动

```vue
<!-- 大量数据列表时使用虚拟滚动 -->
<template>
  <el-virtual-list :data="projects" :height="600" :item-size="120">
    <template #default="{ item }">
      <ProjectCard :project="item" />
    </template>
  </el-virtual-list>
</template>
```

### 组件缓存

```vue
<!-- 使用keep-alive缓存组件状态 -->
<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="ProjectList,TopicSelection">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>
```

这个View层重构方案通过组件化拆分、职责分离和性能优化，为用户提供更好的界面体验，同时保证代码的可维护性和可测试性。
