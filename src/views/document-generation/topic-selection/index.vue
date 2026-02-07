<template>
  <div class="topic-selection-container">
    <ArtTableHeader title="选题策划" :actions="headerActions" @back="goBack" />

    <div class="main-wrapper">
      <!-- 项目加载提示 -->
      <div v-if="!projectStore.currentProject && route.params.projectId" class="project-loading">
        <el-empty description="正在加载项目信息..." />
      </div>

      <div v-else class="main-content">
        <StepIndicator :steps="stepList" />

        <!-- 选题策划表单和标题选择 -->
        <el-card class="topic-content-card" shadow="never">
          <div class="content-wrapper">
            <!-- 需求定义区域 -->
            <RequirementsSection
              :form="requirementsState.form"
              :current-key-point="requirementsState.currentKeyPoint"
              :can-generate-briefing="canGenerateBriefing"
              :has-scope-task="hasScopeTask"
              :scope-task-status="scopeTaskStatus"
              :task-progress="getTaskProgress"
              :task-status-text="getTaskStatusText"
              :is-generating-briefing="requirementsState.isGeneratingBriefing"
              :is-executing-scope="requirementsState.isExecutingScope"
              :research-brief="documentState.researchBrief"
              @update:current-key-point="(val) => (requirementsState.currentKeyPoint = val)"
              @update:form="(val) => (requirementsState.form = val)"
              @generate-briefing="generateAIBriefing"
              @cancel-scope-task="cancelScopeTask"
              @edit-briefing="editBriefing"
              @add-key-point="addKeyPoint"
              @remove-key-point="removeKeyPoint"
            />

            <!-- 标题选择区域 - 仅在AI简报生成后显示 -->
            <TitleGenerationSection
              v-if="documentState.researchBrief"
              :is-generating="titleState.isGenerating"
              :progress="titleState.progress"
              :controls="titleControls"
              :custom-keywords="titleState.customKeywords"
              :can-generate-titles="canGenerateTitles"
              :can-generate-search2title="canGenerateSearch2Title"
              :search2title-loading="search2titleLoading"
              :has-generated-titles="hasGeneratedTitles"
              :generated-titles="titleState.generatedTitles"
              :selected-title="titleState.selectedTitle"
              :current-title-materials="currentTitleMaterials"
              @open-material-selection="openMaterialSelection"
              @execute-search2title="handleExecuteSearch2Title"
              @cancel-search2title="handleCancelSearch2Title"
              @select-title="selectTitle"
              @update-title="updateTitle"
              @add-keyword="addKeyword"
              @remove-keyword="removeCustomKeyword"
              @preview-material="handleMaterialPreview"
              @material-click="handleMaterialClick"
            />
          </div>

          <!-- 底部操作按钮 -->
          <div class="footer-actions">
            <el-button @click="goBack" size="large">返回</el-button>
            <el-button
              v-if="!documentState.researchBrief"
              type="primary"
              size="large"
              :disabled="true"
            >
              请先生成AI简报
            </el-button>
            <el-button
              v-else-if="documentState.researchBrief"
              type="success"
              size="large"
              @click="confirmTitle"
              :disabled="!hasSelectedTitle"
            >
              确认标题并继续
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>

  <!-- 编辑简报对话框 -->
  <el-dialog
    v-model="requirementsState.briefingDialogVisible"
    title="编辑AI简报"
    width="900px"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeEditTab" class="briefing-edit-tabs">
      <el-tab-pane label="编辑模式" name="edit">
        <el-form label-width="80px">
          <el-form-item label="简报内容">
            <el-input
              v-model="requirementsState.editableBriefing"
              type="textarea"
              :rows="15"
              placeholder="请输入Markdown格式的简报内容"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="预览模式" name="preview">
        <div
          class="briefing-preview markdown-body"
          v-html="renderedEditableBriefing"
          style="max-height: 500px; padding: 20px; overflow-y: auto"
        ></div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="requirementsState.briefingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBriefing">保存</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 素材选择对话框 -->
  <el-dialog
    v-model="showMaterialSelectionDialog"
    title="标题生成 - 素材选择"
    width="95%"
    :before-close="closeMaterialSelection"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <MaterialSelectionForTitle
      v-if="showMaterialSelectionDialog"
      :research-brief="documentState.researchBrief || ''"
      @close="closeMaterialSelection"
      @materials-selected="handleMaterialsSelected"
    />
  </el-dialog>

  <!-- 素材预览对话框 -->
  <MaterialPreviewDialog
    :material="previewMaterial"
    :visible="showPreviewDialog"
    context="search"
    @update:visible="showPreviewDialog = $event"
  />
</template>

<script setup lang="ts">
  /**
   * 选题策划页面
   * @description 统一的文档生成流程入口，包含需求定义和标题选择两个阶段
   * @since 2024-11-03 优化UI结构，移除el-tabs，使用单页布局
   */

  import { ref, computed, reactive, onMounted, onUnmounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { marked } from 'marked'

  // 组合式函数和状态管理
  import { useTopicSelection } from '@/composables/document/useTopicSelection'
  import { useProjectStore } from '@/store/modules/project'
  import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'

  // 自定义组件
  import MaterialPreviewDialog from '@/components/custom/material-card/MaterialPreviewDialog.vue'
  import MaterialSelectionForTitle from '@/components/custom/material-search/MaterialSelectionForTitle.vue'
  import RequirementsSection from './RequirementsSection.vue'
  import TitleGenerationSection from './TitleGenerationSection.vue'

  // 类型定义
  import type { Title } from '@/types/ai'
  import type { Material } from '@/types/material'
  import StepIndicator, { type Step } from '@/components/custom/StepIndicator.vue'

  // 样式
  import '@/assets/styles/markdown.scss'

  // ====== 工具函数 ======

  /**
   * 获取项目表单状态的存储键
   */
  const getFormStateKey = (projectId: string): string => {
    return `topic-selection-form-${projectId}`
  }

  /**
   * 保存表单状态到localStorage
   */
  const saveFormState = () => {
    const projectId = route.params.projectId as string
    if (!projectId) {
      return
    }

    const key = getFormStateKey(projectId)
    const data = {
      requirementsForm: requirementsState.form,
      titleState: {
        customKeywords: titleState.customKeywords
      },
      timestamp: Date.now()
    }

    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch {
      // 保存失败时不影响主流程
    }

    // 同时保存到文档状态存储
    if (documentStore.currentProjectId !== projectId) {
      documentStore.setCurrentProject(projectId)
    }
    documentStore.updateDocumentState({}, projectId)
  }

  /**
   * 从localStorage恢复表单状态
   */
  const restoreLocalFormState = (projectId: string) => {
    const key = getFormStateKey(projectId)

    try {
      const data = localStorage.getItem(key)

      if (data) {
        const parsed = JSON.parse(data)

        // 检查数据是否过期（7天）
        const isExpired = Date.now() - (parsed.timestamp || 0) > 7 * 24 * 60 * 60 * 1000

        if (isExpired) {
          localStorage.removeItem(key)
          return
        }

        // 恢复需求表单状态
        if (parsed.requirementsForm) {
          requirementsState.form = {
            topic: parsed.requirementsForm.topic || '',
            keyPoints: Array.isArray(parsed.requirementsForm.keyPoints)
              ? parsed.requirementsForm.keyPoints
              : [],
            specialRequirements: parsed.requirementsForm.specialRequirements || ''
          }
        }

        // 恢复标题状态
        if (parsed.titleState?.customKeywords) {
          titleState.customKeywords = parsed.titleState.customKeywords
        }
      }
    } catch {
      // 恢复失败时不影响主流程
    }
  }

  // ====== 路由和状态初始化 ======
  const router = useRouter()
  const route = useRoute()
  const projectStore = useProjectStore()
  const documentStore = useDocumentGenerateStore()

  // ====== 使用组合式函数 ======
  /**
   * 选题页面专用组合式函数
   * 管理需求定义、表单状态、标题生成等所有功能
   */
  const {
    requirementsState,
    titleState,
    documentState,
    canGenerateBriefing,
    hasScopeTask,
    scopeTaskStatus,
    canGenerateSearch2Title,
    getTaskProgress,
    getTaskStatusText,
    hasGeneratedTitles,
    hasSelectedTitle,
    addKeyPoint,
    removeKeyPoint,
    generateAIBriefing,
    editBriefing,
    saveBriefing,
    addCustomKeyword,
    removeCustomKeyword,
    executeSearch2Title,
    cancelSearch2Title,
    cancelScopeTask,
    selectTitle,
    updateTitle
  } = useTopicSelection()

  // ====== UI状态 ======

  /** 步骤指示器数据 */
  const stepList: Step[] = [
    { label: '选题', status: 'active' },
    { label: '大纲', status: 'pending' },
    { label: '正文', status: 'pending' }
  ]

  /** 编辑简报对话框的活跃标签页 */
  const activeEditTab = ref<'edit' | 'preview'>('edit')

  // ====== 对话框状态 ======
  /** 素材选择对话框是否显示 */
  const showMaterialSelectionDialog = ref(false)
  /** 预览的素材对象 */
  const previewMaterial = ref<Material | null>(null)
  /** 素材预览对话框是否显示 */
  const showPreviewDialog = ref(false)

  // ====== 标题生成相关状态 ======
  /** Search2Title任务是否正在执行 */
  const search2titleLoading = ref(false)

  /** 标题生成控制参数 */
  const titleControls = reactive({
    /** 标题数量 */
    count: 5,
    /** 标题长度 */
    length: 'medium' as 'short' | 'medium' | 'long',
    /** 风格偏好 */
    styles: ['professional', 'catchy'] as Array<
      'creative' | 'professional' | 'catchy' | 'descriptive'
    >
  })

  /** 新关键词输入 */
  const newKeyword = ref('')

  // ====== 计算属性和方法 ======

  /**
   * 监听Search2Title任务状态变化
   * @description 更新search2titleLoading状态以响应任务状态变化
   */
  const updateSearch2TitleLoading = () => {
    if (documentState.value.search2titleTask) {
      const task = documentState.value.search2titleTask
      search2titleLoading.value = task.status === 'pending' || task.status === 'running'
    }
  }

  /** 头部操作按钮配置 */
  const headerActions = computed(() => [
    {
      label: '导出',
      type: 'primary' as const,
      icon: 'el-icon-download',
      handler: () => {
        ElMessage.info('导出功能开发中')
      }
    }
  ])

  // ====== 计算属性 ======

  /** 是否可以生成标题（基于是否有研究简报） */
  const canGenerateTitles = computed(() => {
    return Boolean(documentState.value.researchBrief)
  })

  /** 当前选中标题对应的素材列表
   * @description 根据选中标题的sources字段从titleSearchResults中过滤出对应素材
   * @description sources字段中的值直接对应titleSearchResults数组的索引位置
   */
  const currentTitleMaterials = computed(() => {
    if (!titleState.selectedTitle) return []

    const selectedSources = titleState.selectedTitle.sources || []

    if (selectedSources.length > 0 && documentState.value.titleSearchResults) {
      // 防护性检查：确保titleSearchResults是对象数组
      const searchResults = Array.isArray(documentState.value.titleSearchResults)
        ? documentState.value.titleSearchResults.filter(
            (item) => typeof item === 'object' && item !== null
          )
        : []

      if (searchResults.length === 0) {
        return []
      }

      return searchResults
        .filter((_, index) => selectedSources.includes(index.toString()))
        .map((result) => {
          return {
            id: `search-${result.query || 'unknown'}-${Math.random().toString(36).substring(2, 9)}`,
            title: result.aititle || '', // cSpell:ignore aititle
            summary: result.summary || '',
            url: result.url,
            tags: result.tags || [],
            createdAt: result.published_date ? new Date(result.published_date) : new Date(),
            score: result.score,
            key_excerpts: result.key_excerpts || [],
            content: '',
            type: 'article' as const,
            user_id: String(projectStore.currentProject?.user_id || '')
          }
        }) as Material[]
    }

    return []
  })

  /** 渲染可编辑简报内容（Markdown转HTML） */
  const renderedEditableBriefing = computed(() => {
    if (!requirementsState.briefingDialogVisible || !requirementsState.editableBriefing) return ''
    return marked(requirementsState.editableBriefing)
  })

  // ====== 事件处理方法 ======

  /** 添加自定义关键词 */
  const addKeyword = () => {
    const keyword = newKeyword.value.trim()
    if (keyword) {
      addCustomKeyword(keyword)
      newKeyword.value = ''
    }
  }

  /** 获取标题评分（模拟数据）
   * @description 临时实现，返回60-100之间的随机数
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTitleScore = (_title: Title): number => {
    return Math.floor(Math.random() * 40) + 60
  }

  /** 获取标题建议（模拟数据）
   * @description 临时实现，返回预设的建议列表
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTitleSuggestions = (_title: Title): string[] => {
    return ['更具吸引力', '更简洁明了', '更专业', '更具创意性']
  }

  /** 打开素材选择对话框 */
  const openMaterialSelection = () => {
    if (!documentState.value.researchBrief) {
      ElMessage.warning('请先完成需求定义')
      return
    }
    showMaterialSelectionDialog.value = true
  }

  /** 关闭素材选择对话框 */
  const closeMaterialSelection = () => {
    showMaterialSelectionDialog.value = false
  }

  /** 处理素材选择完成
   * @param materials - 选中的素材列表
   */
  const handleMaterialsSelected = (materials: Material[]) => {
    ElMessage.success(`已选择 ${materials.length} 个素材`)
    closeMaterialSelection()
  }

  /** 执行Search2Title流程 */
  const handleExecuteSearch2Title = async () => {
    const projectId = route.params.projectId as string
    await executeSearch2Title(projectId)
  }

  /** 取消Search2Title任务 */
  const handleCancelSearch2Title = async () => {
    const projectId = route.params.projectId as string
    await cancelSearch2Title(projectId)
  }

  // ====== 主要业务逻辑方法 ======

  /** 确认选中的标题并进入下一阶段 */
  const confirmTitle = () => {
    if (!hasSelectedTitle.value) {
      ElMessage.warning('请选择一个标题')
      return
    }

    const currentProject = projectStore.currentProject
    if (currentProject) {
      ElMessage.success('标题已确认，即将进入大纲阶段')

      // 延迟导航到大纲页面，给用户时间看到成功提示
      setTimeout(() => {
        router.push(`/document-generation/outline/${currentProject.id}`)
      }, 1500)
    }
  }

  /** 处理素材预览
   * @param material - 要预览的素材
   */
  const handleMaterialPreview = (material: Material) => {
    previewMaterial.value = material
    showPreviewDialog.value = true
  }

  /** 处理素材点击事件
   * @param material - 被点击的素材
   */
  const handleMaterialClick = () => {
    // TODO: 实现素材点击逻辑
  }

  /** 返回上一页 */
  const goBack = () => {
    router.push('/document-generation/project-list')
  }

  // ====== 监听器 ======

  /** 监听Search2Title任务状态变化 */
  watch(
    () => documentState.value.search2titleTask,
    (task) => {
      if (task) {
        const shouldLoading = task.status === 'pending' || task.status === 'running'
        search2titleLoading.value = shouldLoading
      } else {
        search2titleLoading.value = false
      }
    },
    { immediate: true }
  )

  // ====== 自动保存表单状态 ======

  /** 监听需求表单变化，自动保存 */
  const stopRequirementsWatch = watch(
    () => requirementsState.form,
    () => {
      // 防抖保存，避免频繁写入
      saveFormState()
    },
    { deep: true, immediate: false }
  )

  /** 监听标题状态变化，自动保存 */
  const stopTitleStateWatch = watch(
    () => titleState.customKeywords,
    () => {
      saveFormState()
    },
    { deep: true, immediate: false }
  )

  // ====== 页面生命周期 ======

  /** 页面卸载时保存状态 */
  const beforeUnloadHandler = () => {
    saveFormState()
    const projectId = route.params.projectId as string
    if (projectId) {
      documentStore.updateDocumentState({}, projectId)
    }
  }

  /** 页面初始化
   * @description 加载项目信息并初始化Search2Title loading状态
   * @since 2025-11-08 添加项目切换时的状态重置逻辑
   */
  onMounted(async () => {
    // 加载项目信息
    const projectId = route.params.projectId as string

    if (projectId) {
      try {
        const numericProjectId = Number(projectId)

        // 检查当前项目是否已加载且匹配
        if (
          !projectStore.currentProject ||
          Number(projectStore.currentProject.id) !== numericProjectId
        ) {
          // 先从已加载的项目列表中查找
          if (projectStore.projects.length === 0) {
            await projectStore.fetchProjects()
          }

          const project = projectStore.projects.find((p) => Number(p.id) === numericProjectId)
          if (project) {
            projectStore.setCurrentProject(project)
          } else {
            // 如果未找到，通过API获取项目详情
            const { projectService } = await import('@/services/projectService')
            const response = await projectService.getProjectDetail(numericProjectId)
            if (response.project) {
              projectStore.setCurrentProject(response.project)
            }
          }
        }

        // ========== 项目状态管理 ==========
        // 检查是否为新项目或项目已切换
        const currentPersistedProjectId = sessionStorage.getItem('current-topic-selection-project')

        if (currentPersistedProjectId !== projectId) {
          // 1. 加载项目状态（先尝试恢复，不强制重置）
          documentStore.resetStateForProject(numericProjectId, false)

          // 2. 总是尝试恢复表单状态
          restoreLocalFormState(projectId)

          // 3. 更新当前项目ID记录
          sessionStorage.setItem('current-topic-selection-project', projectId)
        } else {
          // 同一项目，恢复之前的状态
          // 对于同一项目，尝试从存储恢复状态
          if (!documentStore.currentProjectId) {
            documentStore.setCurrentProject(projectId)
          }

          // 尝试加载已保存的状态
          const hasSavedState = documentStore.loadFromProjectStorage(projectId)

          if (hasSavedState) {
            // 已恢复之前的文档状态
          }

          // 总是尝试恢复表单状态（独立于文档状态）
          restoreLocalFormState(projectId)
        }
        // ========== 项目状态管理结束 ==========
      } catch {
        ElMessage.error('加载项目信息失败，请刷新页面重试')
      }
    }

    // 添加按钮状态调试日志（延迟执行，确保状态重置完成）
    setTimeout(() => {
      // 检查并清理无效的任务状态
      const scopeTask = documentState.value.scopeTask
      if (scopeTask) {
        const now = Date.now()
        const taskAge = now - scopeTask.createdAt

        // 如果任务时间戳异常或任务已完成但未清理，手动清理
        if (
          scopeTask.createdAt > now ||
          scopeTask.status === 'completed' ||
          scopeTask.status === 'failed' ||
          taskAge > 30 * 60 * 1000
        ) {
          documentStore.updateDocumentState({ scopeTask: null })
        }
      }

      // 检查search2title任务状态
      const search2titleTask = documentState.value.search2titleTask
      if (search2titleTask) {
        const now = Date.now()
        const taskAge = now - search2titleTask.createdAt

        // 如果任务时间戳异常或任务已完成但未清理，手动清理
        if (
          search2titleTask.createdAt > now ||
          search2titleTask.status === 'completed' ||
          search2titleTask.status === 'failed' ||
          taskAge > 30 * 60 * 1000
        ) {
          documentStore.updateDocumentState({ search2titleTask: null })
        }
      }
    }, 1000)

    // 初始化Search2Title loading状态
    updateSearch2TitleLoading()

    // 添加页面卸载事件监听器
    window.addEventListener('beforeunload', beforeUnloadHandler)
  })

  /**
   * 页面卸载时清理sessionStorage和监听器
   * @description 确保用户关闭页面或离开后，重新进入时会重新检查项目状态
   */
  onUnmounted(() => {
    try {
      // 页面卸载前先保存状态
      saveFormState()
      const projectId = route.params.projectId as string
      if (projectId) {
        documentStore.updateDocumentState({}, projectId)
      }

      // 清理当前项目的sessionStorage记录，让下次进入时重新检查
      sessionStorage.removeItem('current-topic-selection-project')

      // 清理监听器
      stopRequirementsWatch()
      stopTitleStateWatch()
      window.removeEventListener('beforeunload', beforeUnloadHandler)
    } catch {
      // 页面卸载时发生错误，静默处理
    }
  })
</script>

<style scoped lang="scss">
  .topic-selection-container {
    max-width: 1400px;
    padding: 20px;
    margin: 0 auto;
  }

  .main-wrapper {
    width: 100%;
  }

  .topic-content-card {
    margin-bottom: 20px;
  }

  .content-wrapper {
    padding: 30px 20px;
  }

  .section-title {
    padding-left: 12px;
    margin: 0 0 30px;
    font-size: 22px;
    font-weight: 600;
    color: var(--el-color-primary);
    border-left: 4px solid var(--el-color-primary);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }

  .footer-actions {
    display: flex;
    gap: 20px;
    justify-content: center;
    padding: 20px;
    border-top: 1px solid var(--el-border-color);
  }

  .briefing-content {
    ::v-deep(.markdown-body) {
      h1,
      h2,
      h3,
      h4 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
      }

      h1 {
        font-size: 1.5em;
        color: var(--el-color-primary);
      }

      p {
        margin-bottom: 1em;
        line-height: 1.7;
      }

      ul,
      ol {
        padding-left: 2em;
        margin-bottom: 1em;
      }

      li {
        margin-bottom: 0.5em;
        line-height: 1.6;
      }

      strong {
        font-weight: 600;
        color: var(--el-color-warning);
      }
    }
  }

  .briefing-preview {
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
  }

  @media (width <= 768px) {
    .topic-selection-container {
      padding: 15px;
    }

    .step-indicator {
      padding: 15px;
    }

    .step-connector {
      width: 40px;
      margin: 0 10px;
    }

    .content-wrapper {
      padding: 20px 15px;
    }

    .section-title {
      font-size: 18px;
    }

    .footer-actions {
      flex-direction: column;
      align-items: center;
    }
  }
</style>

<style lang="scss">
  .el-slider__input {
    width: 100px;
  }
</style>
