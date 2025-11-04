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
            <div class="requirements-section">
              <h2 class="section-title">需求定义</h2>
              <el-form
                ref="requirementsFormRef"
                :model="requirementsState.form"
                :rules="requirementsValidationRules"
                label-width="120px"
                size="large"
              >
                <el-form-item label="主题/标题" prop="topic">
                  <el-input
                    v-model="requirementsState.form.topic"
                    placeholder="请输入文档的主题或标题"
                    maxlength="100"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="关键要点" prop="keyPoints">
                  <div class="key-points-input">
                    <el-input
                      v-model="requirementsState.currentKeyPoint"
                      placeholder="输入关键要点后按回车添加"
                      @keyup.enter="addKeyPoint"
                    />
                    <el-button
                      @click="addKeyPoint"
                      :disabled="!requirementsState.currentKeyPoint.trim()"
                    >
                      添加
                    </el-button>
                  </div>
                  <div class="key-points-list" v-if="requirementsState.form.keyPoints.length > 0">
                    <el-tag
                      v-for="(point, index) in requirementsState.form.keyPoints"
                      :key="index"
                      closable
                      @close="removeKeyPoint(index)"
                      type="info"
                    >
                      {{ point }}
                    </el-tag>
                  </div>
                </el-form-item>

                <el-form-item label="特殊要求" prop="specialRequirements">
                  <el-input
                    v-model="requirementsState.form.specialRequirements"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入任何特殊要求，如需要包含的特定信息、避免的词汇等"
                  />
                </el-form-item>
              </el-form>

              <div class="requirements-actions">
                <el-button
                  ref="generateButtonRef"
                  type="primary"
                  size="large"
                  @click="generateAIBriefing(requirementsFormRef)"
                  :loading="
                    requirementsState.isGeneratingBriefing || requirementsState.isExecutingScope
                  "
                  :disabled="!canGenerateBriefing || hasScopeTask"
                >
                  <template v-if="hasScopeTask">
                    {{ getTaskStatusText }} ({{ getTaskProgress }}%)
                  </template>
                  <template v-else>生成AI简报</template>
                </el-button>
                <el-button
                  v-if="hasScopeTask"
                  @click="cancelScopeTask"
                  size="large"
                  type="danger"
                  plain
                >
                  取消任务
                </el-button>
              </div>

              <!-- AI简报展示区域 -->
              <div class="ai-briefing-section" v-if="documentState.researchBrief">
                <div class="section-header">
                  <h3>AI创作简报</h3>
                  <el-button @click="editBriefing" size="small" type="primary" plain
                    >编辑简报</el-button
                  >
                </div>

                <div class="briefing-content markdown-body" v-html="renderedBriefing"></div>
              </div>

              <!-- Scope Agent 任务状态指示器 -->
              <div class="task-status-card" v-if="hasScopeTask">
                <el-card>
                  <div class="task-status">
                    <div class="status-icon">
                      <el-icon v-if="scopeTaskStatus === 'completed'" color="#67C23A">
                        <Check />
                      </el-icon>
                      <el-icon v-else-if="scopeTaskStatus === 'failed'" color="#F56C6C">
                        <Close />
                      </el-icon>
                      <el-icon v-else color="#409EFF" class="is-loading">
                        <Loading />
                      </el-icon>
                    </div>
                    <div class="status-content">
                      <h4>AI简报生成任务</h4>
                      <p>{{ getTaskStatusText }}</p>
                      <el-progress
                        v-if="scopeTaskStatus && ['running', 'pending'].includes(scopeTaskStatus)"
                        :percentage="getTaskProgress"
                        :status="scopeTaskStatus === 'failed' ? 'exception' : undefined"
                      />
                    </div>
                  </div>
                </el-card>
              </div>
            </div>

            <!-- 标题选择区域 - 仅在AI简报生成后显示 -->
            <div v-if="documentState.researchBrief" class="titles-section">
              <h2 class="section-title">标题选择</h2>

              <!-- 生成进度显示 -->
              <div v-if="titleState.isGenerating" class="generation-progress">
                <el-progress
                  :percentage="titleState.progress"
                  :status="titleState.progress === 100 ? 'success' : undefined"
                  :stroke-width="6"
                />
                <p class="progress-text">正在生成标题，请稍候...</p>
              </div>

              <!-- 标题生成控制 -->
              <div class="generation-controls">
                <div class="control-group">
                  <h4>标题生成控制</h4>
                  <el-form :model="titleControls" label-width="100px">
                    <el-form-item label="标题数量">
                      <el-slider
                        v-model="titleControls.count"
                        :min="3"
                        :max="10"
                        :step="1"
                        show-input
                        show-stops
                      />
                    </el-form-item>
                    <el-form-item label="标题长度">
                      <el-radio-group v-model="titleControls.length">
                        <el-radio value="short">简短</el-radio>
                        <el-radio value="medium">适中</el-radio>
                        <el-radio value="long">详细</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="风格偏好">
                      <el-checkbox-group v-model="titleControls.styles">
                        <el-checkbox value="creative">创意性</el-checkbox>
                        <el-checkbox value="professional">专业性</el-checkbox>
                        <el-checkbox value="catchy">吸引力</el-checkbox>
                        <el-checkbox value="descriptive">描述性</el-checkbox>
                      </el-checkbox-group>
                    </el-form-item>
                    <el-form-item label="包含关键词">
                      <div class="keywords-section">
                        <el-tag
                          v-for="keyword in titleState.customKeywords"
                          :key="keyword"
                          closable
                          @close="removeCustomKeyword(keyword)"
                          type="info"
                        >
                          {{ keyword }}
                        </el-tag>
                        <el-input
                          v-model="newKeyword"
                          placeholder="添加关键词"
                          size="small"
                          style="width: 120px"
                          @keyup.enter="addKeyword"
                        />
                      </div>
                    </el-form-item>
                  </el-form>
                </div>
              </div>

              <div class="generation-actions">
                <!-- 方式一：检索+生成标题 -->
                <el-button type="primary" size="large" @click="openMaterialSelection">
                  <el-icon><Search /></el-icon>
                  检索素材后生成标题
                </el-button>

                <!-- 方式二：直接Search2Title -->
                <el-button
                  type="success"
                  size="large"
                  @click="handleExecuteSearch2Title"
                  :loading="search2titleLoading"
                  :disabled="!canGenerateSearch2Title"
                >
                  <el-icon><MagicStick /></el-icon>
                  一键Search2Title
                </el-button>

                <el-button
                  v-if="search2titleLoading"
                  @click="handleCancelSearch2Title"
                  type="danger"
                  plain
                >
                  取消任务
                </el-button>

                <p class="generation-tip" v-if="!canGenerateTitles && !canGenerateSearch2Title">
                  请先完成需求定义并生成AI简报
                </p>
              </div>

              <!-- 生成的标题展示 -->
              <div class="titles-display-section" v-if="hasGeneratedTitles">
                <div class="section-header">
                  <h3>生成的标题选项</h3>
                  <el-tag type="info">共 {{ titleState.generatedTitles.length }} 个标题</el-tag>
                </div>

                <div class="titles-grid">
                  <TitleCard
                    v-for="(title, index) in titleState.generatedTitles"
                    :key="index"
                    :title="title"
                    :is-selected="titleState.selectedTitle === title"
                    :score="getTitleScore(title)"
                    :suggestions="getTitleSuggestions(title)"
                    @select="selectTitle"
                    @update="updateTitle"
                  />
                </div>

                <!-- 当前选中标题对应的素材 -->
                <div
                  v-if="titleState.selectedTitle && currentTitleMaterials.length > 0"
                  class="title-materials-section"
                >
                  <div class="section-header">
                    <h3>「{{ titleState.selectedTitle.title }}」对应素材</h3>
                    <div class="section-actions">
                      <el-tag type="success" size="large">
                        共 {{ currentTitleMaterials.length }} 个素材
                      </el-tag>
                    </div>
                  </div>
                  <div class="materials-list">
                    <UnifiedMaterialCard
                      v-for="material in currentTitleMaterials"
                      :key="material.id"
                      :material="material"
                      :context="'search'"
                      :show-selection="false"
                      :show-score="true"
                      @preview="handleMaterialPreview"
                      @click="handleMaterialClick"
                    />
                  </div>
                </div>
              </div>
            </div>
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

  import { ref, computed, reactive, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { marked } from 'marked'
  import { Check, Close, Loading, Search, MagicStick } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'

  // 组合式函数和状态管理
  import { useTopicSelection } from '@/composables/useTopicSelection'
  import { useProjectStore } from '@/store/modules/project'
  import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'

  // 自定义组件
  import TitleCard from '@/components/custom/TitleCard.vue'
  import UnifiedMaterialCard from '@/components/custom/material-card/UnifiedMaterialCard.vue'
  import MaterialPreviewDialog from '@/components/custom/material-card/MaterialPreviewDialog.vue'
  import MaterialSelectionForTitle from '@/components/custom/material-search/MaterialSelectionForTitle.vue'

  // 类型定义
  import type { Title } from '@/types/ai'
  import type { Material } from '@/types/material'
  import StepIndicator, { type Step } from '@/components/custom/StepIndicator.vue'

  // 样式
  import '@/assets/styles/markdown.scss'

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
  /** 需求表单引用 */
  const requirementsFormRef = ref<FormInstance>()
  /** 生成按钮引用 */
  const generateButtonRef = ref()

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

  /** 需求表单验证规则
   * @description 简化后的表单验证规则（仅验证主题字段）
   * @since 2024-11-03 移除了目标受众、文档类型等字段的验证
   */
  const requirementsValidationRules: FormRules = {
    topic: [
      { required: true, message: '请输入文档主题', trigger: 'blur' },
      { min: 2, max: 100, message: '主题长度应在2-100个字符之间', trigger: 'blur' }
    ]
  }

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
    if (
      selectedSources.length > 0 &&
      documentState.value.titleSearchResults &&
      Array.isArray(documentState.value.titleSearchResults)
    ) {
      return documentState.value.titleSearchResults
        .filter((_, index) => selectedSources.includes(index.toString()))
        .map((result) => ({
          id: `search-${result.query}-${Math.random().toString(36).substring(2, 9)}`,
          title: result.aititle || '',
          summary: result.summary || '',
          url: result.url,
          tags: result.tags || [],
          createdAt: result.published_date ? new Date(result.published_date) : new Date(),
          score: result.score,
          key_excerpts: result.key_excerpts || [],
          content: '',
          type: 'article' as const,
          user_id: String(projectStore.currentProject?.user_id || '')
        })) as Material[]
    }

    return []
  })

  /** 渲染研究简报内容（Markdown转HTML） */
  const renderedBriefing = computed(() => {
    if (!documentState.value.researchBrief) return ''
    return marked(documentState.value.researchBrief)
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
  const handleMaterialClick = (material: Material) => {
    // TODO: 实现素材点击逻辑
    console.log('素材被点击:', material)
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
      console.log('[DEBUG] search2titleTask watcher - task:', task)
      if (task) {
        const shouldLoading = task.status === 'pending' || task.status === 'running'
        console.log(
          '[DEBUG] search2titleTask watcher - task.status:',
          task.status,
          'shouldLoading:',
          shouldLoading
        )
        search2titleLoading.value = shouldLoading
      } else {
        console.log('[DEBUG] search2titleTask watcher - no task, setting loading to false')
        search2titleLoading.value = false
      }
      console.log(
        '[DEBUG] search2titleTask watcher - final search2titleLoading:',
        search2titleLoading.value
      )
    },
    { immediate: true }
  )

  // ====== 页面生命周期 ======

  /** 页面初始化
   * @description 加载项目信息并初始化Search2Title loading状态
   */
  onMounted(async () => {
    // 添加按钮状态调试日志
    setTimeout(() => {
      console.log('[DEBUG] Button state after mount:')
      console.log('  - isGeneratingBriefing:', requirementsState.isGeneratingBriefing)
      console.log('  - isExecutingScope:', requirementsState.isExecutingScope)
      console.log('  - canGenerateBriefing:', canGenerateBriefing.value)
      console.log('  - hasScopeTask:', hasScopeTask.value)
      console.log('  - scopeTask:', documentState.value.scopeTask)
      console.log('  - search2titleTask:', documentState.value.search2titleTask)
      console.log('  - search2titleLoading:', search2titleLoading.value)

      // 检查并清理无效的任务状态
      const scopeTask = documentState.value.scopeTask
      if (scopeTask) {
        const now = Date.now()
        const taskAge = now - scopeTask.createdAt

        console.log('[DEBUG] Checking task validity on mount:')
        console.log('  - task.createdAt:', scopeTask.createdAt)
        console.log('  - now:', now)
        console.log('  - taskAge:', taskAge)
        console.log('  - task.status:', scopeTask.status)

        // 如果任务时间戳异常或任务已完成但未清理，手动清理
        if (
          scopeTask.createdAt > now ||
          scopeTask.status === 'completed' ||
          scopeTask.status === 'failed' ||
          taskAge > 30 * 60 * 1000
        ) {
          console.log('[DEBUG] Clearing invalid task on mount')
          documentStore.updateDocumentState({ scopeTask: null })
        }
      }

      // 检查search2title任务状态
      const search2titleTask = documentState.value.search2titleTask
      if (search2titleTask) {
        const now = Date.now()
        const taskAge = now - search2titleTask.createdAt

        console.log('[DEBUG] Checking search2title task validity on mount:')
        console.log('  - search2titleTask.createdAt:', search2titleTask.createdAt)
        console.log('  - now:', now)
        console.log('  - taskAge:', taskAge)
        console.log('  - task.status:', search2titleTask.status)

        // 如果任务时间戳异常或任务已完成但未清理，手动清理
        if (
          search2titleTask.createdAt > now ||
          search2titleTask.status === 'completed' ||
          search2titleTask.status === 'failed' ||
          taskAge > 30 * 60 * 1000
        ) {
          console.log('[DEBUG] Clearing invalid search2title task on mount')
          documentStore.updateDocumentState({ search2titleTask: null })
        }
      }

      // 检查localStorage中是否有持久化的任务状态
      const persistedStore = localStorage.getItem('document-generate-store')
      if (persistedStore) {
        try {
          const parsed = JSON.parse(persistedStore)
          console.log('[DEBUG] Persisted store data:', parsed)
          console.log('[DEBUG] Has scopeTask in persisted data:', !!parsed.documentState?.scopeTask)
          console.log(
            '[DEBUG] Has search2titleTask in persisted data:',
            !!parsed.documentState?.search2titleTask
          )
        } catch (e) {
          console.error('[DEBUG] Failed to parse persisted store:', e)
        }
      }
    }, 1000)
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
      } catch (error) {
        console.error('加载项目失败:', error)
        ElMessage.error('加载项目信息失败，请刷新页面重试')
      }
    }

    // 初始化Search2Title loading状态
    updateSearch2TitleLoading()
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

  .requirements-section {
    max-width: 1200px;
    padding: 0 40px;
    margin: 0 auto;
    margin-bottom: 50px;
  }

  .key-points-input {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .key-points-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .requirements-actions {
    display: flex;
    justify-content: center;
    margin-top: 30px;
    margin-bottom: 20px;
  }

  .ai-briefing-section {
    padding: 30px;
    margin-top: 30px;
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 8px;
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

  .titles-section .section-header {
    padding: 0;
  }

  .title-materials-section .section-header {
    padding: 0;
  }

  .task-status-card {
    margin-top: 20px;

    .task-status {
      display: flex;
      gap: 20px;
      align-items: center;

      .status-icon {
        font-size: 32px;

        .is-loading {
          animation: rotating 2s linear infinite;
        }
      }

      .status-content {
        flex: 1;

        h4 {
          margin: 0 0 8px;
          font-size: 16px;
          color: var(--el-text-color-primary);
        }

        p {
          margin: 0 0 12px;
          color: var(--el-text-color-regular);
        }
      }
    }
  }

  .titles-section {
    max-width: 1200px;
    padding: 50px 40px 0;
    margin: 0 auto;
    border-top: 1px solid var(--el-border-color);
  }

  .generation-progress {
    padding: 20px;
    margin-bottom: 30px;
    text-align: center;
    background: var(--el-bg-color-page);
    border-radius: 8px;

    .progress-text {
      margin: 10px 0 0;
      color: var(--el-text-color-secondary);
    }
  }

  .generation-controls {
    margin: 0 0 30px;

    .control-group h4 {
      margin: 0 0 20px;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }
  }

  .keywords-section {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .generation-actions {
    display: flex;
    gap: 15px;
    align-items: center;
    padding-top: 30px;
    margin-top: 30px;
    border-top: 1px solid var(--el-border-color);
  }

  .generation-tip {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .titles-display-section {
    padding: 30px 0;
    margin-top: 30px;
  }

  .titles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    gap: 20px;
    padding: 4px;
    margin-bottom: 40px;

    @media (width <= 1400px) {
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    }

    @media (width <= 768px) {
      grid-template-columns: 1fr;
      gap: 15px;
    }
  }

  .title-materials-section {
    padding: 24px 0;
    margin-top: 30px;

    .section-header h3 {
      color: var(--el-color-primary);
    }

    .materials-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-top: 20px;
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

  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
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

    .requirements-section,
    .titles-section {
      padding: 0;
    }

    .section-title {
      font-size: 18px;
    }

    .titles-grid {
      grid-template-columns: 1fr;
    }

    .footer-actions {
      flex-direction: column;
      align-items: center;
    }

    .key-points-input {
      flex-direction: column;
    }
  }
</style>

<style lang="scss">
  .el-slider__input {
    width: 100px;
  }
</style>
