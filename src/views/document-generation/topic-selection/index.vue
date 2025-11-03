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
          <el-tabs v-model="activeTab" class="topic-tabs">
            <!-- 需求定义标签页 -->
            <el-tab-pane label="需求定义" name="requirements">
              <div class="requirements-section">
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

                  <el-form-item label="目标受众" prop="targetAudience">
                    <el-select
                      v-model="requirementsState.form.targetAudience"
                      placeholder="请选择目标受众"
                      style="width: 100%"
                    >
                      <el-option label="普通大众" value="general" />
                      <el-option label="专业人士" value="professional" />
                      <el-option label="企业决策者" value="executive" />
                      <el-option label="技术人员" value="technical" />
                      <el-option label="学术研究者" value="academic" />
                      <el-option label="学生群体" value="student" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="文档类型" prop="documentType">
                    <el-select
                      v-model="requirementsState.form.documentType"
                      placeholder="请选择文档类型"
                      style="width: 100%"
                    >
                      <el-option label="分析报告" value="analysis" />
                      <el-option label="新闻稿" value="press_release" />
                      <el-option label="博客文章" value="blog" />
                      <el-option label="技术文档" value="technical_doc" />
                      <el-option label="营销文案" value="marketing" />
                      <el-option label="产品说明" value="product_description" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="预期字数" prop="wordCount">
                    <el-slider
                      v-model="requirementsState.form.wordCount"
                      :min="500"
                      :max="10000"
                      :step="100"
                      show-input
                      show-stops
                    />
                  </el-form-item>

                  <el-form-item label="语气风格" prop="tone">
                    <el-radio-group v-model="requirementsState.form.tone">
                      <el-radio value="formal">正式</el-radio>
                      <el-radio value="casual">轻松</el-radio>
                      <el-radio value="professional">专业</el-radio>
                      <el-radio value="friendly">友好</el-radio>
                      <el-radio value="persuasive">说服性</el-radio>
                      <el-radio value="objective">客观</el-radio>
                    </el-radio-group>
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
            </el-tab-pane>

            <!-- 标题选择标签页 -->
            <el-tab-pane label="标题选择" name="titles">
              <div class="titles-section">
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

                  <el-button v-if="search2titleLoading" @click="cancelSearch2Title">
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
            </el-tab-pane>
          </el-tabs>

          <!-- 底部操作按钮 -->
          <div class="footer-actions">
            <el-button @click="goBack" size="large">返回</el-button>
            <el-button
              v-if="activeTab === 'requirements'"
              type="primary"
              size="large"
              @click="switchToTitlesTab"
              :disabled="!canConfirmRequirements"
            >
              下一步：标题选择
              <el-icon><ArrowRight /></el-icon>
            </el-button>
            <el-button
              v-if="activeTab === 'titles'"
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
  import { ref, computed, reactive, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { marked } from 'marked'
  import { Check, Close, Loading, Search, MagicStick, ArrowRight } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useTopicSelection } from '@/composables/useTopicSelection'
  import { useProjectStore } from '@/store/modules/project'
  import TitleCard from '@/components/custom/TitleCard.vue'
  import UnifiedMaterialCard from '@/components/custom/material-card/UnifiedMaterialCard.vue'
  import MaterialPreviewDialog from '@/components/custom/material-card/MaterialPreviewDialog.vue'
  import MaterialSelectionForTitle from '@/components/custom/material-search/MaterialSelectionForTitle.vue'
  import type { Title } from '@/types/ai'
  import type { Material } from '@/types/material'
  import StepIndicator, { type Step } from '@/components/core/StepIndicator.vue'
  import '@/assets/styles/markdown.scss'

  const router = useRouter()
  const route = useRoute()
  const projectStore = useProjectStore()

  // 使用组合式函数
  const {
    requirementsState,
    titleState,
    documentState,
    canGenerateBriefing,
    canConfirmRequirements,
    hasScopeTask,
    scopeTaskStatus,
    hasGeneratedTitles,
    hasSelectedTitle,
    canGenerateSearch2Title,
    getTaskProgress,
    getTaskStatusText,
    addKeyPoint,
    removeKeyPoint,
    generateAIBriefing,
    editBriefing,
    saveBriefing,
    selectTitle,
    addCustomKeyword,
    removeCustomKeyword,
    executeSearch2Title
  } = useTopicSelection()

  // 步骤指示器数据
  const stepList: Step[] = [
    { label: '选题', status: 'active' },
    { label: '大纲', status: 'pending' },
    { label: '正文', status: 'pending' }
  ]

  // 标签页状态
  const activeTab = ref('requirements')
  const activeEditTab = ref('edit')
  const requirementsFormRef = ref<FormInstance>()

  // 素材选择对话框状态
  const showMaterialSelectionDialog = ref(false)
  const previewMaterial = ref<Material | null>(null)
  const showPreviewDialog = ref(false)

  // Search2Title状态
  const search2titleLoading = ref(false)

  // 标题生成控制参数
  const titleControls = reactive({
    count: 5,
    length: 'medium',
    styles: ['professional', 'catchy']
  })

  const newKeyword = ref('')

  // 监听Search2Title任务状态变化
  const updateSearch2TitleLoading = () => {
    if (documentState.value.search2titleTask) {
      const task = documentState.value.search2titleTask
      search2titleLoading.value = task.status === 'pending' || task.status === 'running'
    }
  }

  // 头部操作按钮
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

  // 需求表单验证规则
  const requirementsValidationRules: FormRules = {
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
  const canGenerateTitles = computed(() => {
    return Boolean(documentState.value.researchBrief)
  })

  // 当前选中标题对应的素材
  const currentTitleMaterials = computed(() => {
    if (!titleState.selectedTitle) return []

    const selectedSources = titleState.selectedTitle.sources || []
    if (selectedSources.length > 0 && documentState.value.searchResults) {
      return documentState.value.searchResults
        .filter((_, index) => selectedSources.includes((index + 1).toString()))
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

  // 渲染简报内容
  const renderedBriefing = computed(() => {
    if (!documentState.value.researchBrief) return ''
    return marked(documentState.value.researchBrief)
  })

  const renderedEditableBriefing = computed(() => {
    if (!requirementsState.briefingDialogVisible || !requirementsState.editableBriefing) return ''
    return marked(requirementsState.editableBriefing)
  })

  // 切换到标题选择标签页
  const switchToTitlesTab = () => {
    if (!canConfirmRequirements.value) {
      ElMessage.warning('请先生成AI简报')
      return
    }
    activeTab.value = 'titles'
  }

  // 添加自定义关键词
  const addKeyword = () => {
    const keyword = newKeyword.value.trim()
    if (keyword) {
      addCustomKeyword(keyword)
      newKeyword.value = ''
    }
  }

  // 获取标题评分
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTitleScore = (_title: Title): number => {
    return Math.floor(Math.random() * 40) + 60
  }

  // 获取标题建议
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTitleSuggestions = (_title: Title): string[] => {
    return ['更具吸引力', '更简洁明了', '更专业', '更具创意性']
  }

  // 打开素材选择对话框
  const openMaterialSelection = () => {
    if (!documentState.value.researchBrief) {
      ElMessage.warning('请先完成需求定义')
      return
    }
    showMaterialSelectionDialog.value = true
  }

  // 关闭素材选择对话框
  const closeMaterialSelection = () => {
    showMaterialSelectionDialog.value = false
  }

  // 处理素材选择完成
  const handleMaterialsSelected = (materials: Material[]) => {
    ElMessage.success(`已选择 ${materials.length} 个素材`)
    closeMaterialSelection()
  }

  // 执行Search2Title
  const handleExecuteSearch2Title = async () => {
    const projectId = route.params.projectId as string
    await executeSearch2Title(projectId)
  }

  // 取消Search2Title任务
  const cancelSearch2Title = async () => {
    try {
      // 这里需要从组合式函数或 store 中获取取消方法
      // 暂时保持原有逻辑
      search2titleLoading.value = false
    } catch {
      ElMessage.error('取消Search2Title任务失败')
    }
  }

  // 确认标题
  const confirmTitle = () => {
    if (!hasSelectedTitle.value) {
      ElMessage.warning('请选择一个标题')
      return
    }

    const currentProject = projectStore.currentProject
    if (currentProject) {
      ElMessage.success('标题已确认，即将进入大纲阶段')

      // 导航到大纲页面
      setTimeout(() => {
        router.push(`/document-generation/outline/${currentProject.id}`)
      }, 1500)
    }
  }

  // 处理素材预览
  const handleMaterialPreview = (material: Material) => {
    previewMaterial.value = material
    showPreviewDialog.value = true
  }

  // 处理素材点击
  const handleMaterialClick = (material: Material) => {
    console.log('素材被点击:', material)
  }

  // 返回上一页
  const goBack = () => {
    router.push('/document-generation/project-list')
  }

  // 页面生命周期
  onMounted(async () => {
    // 加载项目信息
    const projectId = route.params.projectId as string
    if (projectId) {
      try {
        const numericProjectId = Number(projectId)

        if (
          !projectStore.currentProject ||
          Number(projectStore.currentProject.id) !== numericProjectId
        ) {
          if (projectStore.projects.length === 0) {
            await projectStore.fetchProjects()
          }

          const project = projectStore.projects.find((p) => Number(p.id) === numericProjectId)
          if (project) {
            projectStore.setCurrentProject(project)
          } else {
            const { projectService } = await import('@/services/projectService')
            const response = await projectService.getProjectDetail(numericProjectId)
            if (response.project) {
              projectStore.setCurrentProject(response.project)
            }
          }
        }
      } catch (error) {
        console.error('加载项目失败:', error)
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

  .topic-tabs {
    ::v-deep(.el-tabs__content) {
      padding: 30px 20px;
    }
  }

  .requirements-section {
    max-width: 1000px;
    margin: 0 auto;
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
    margin: 0 auto;
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
    margin-bottom: 30px;

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
    padding: 30px;
    margin-top: 30px;
    background: var(--el-bg-color-page);
    border-radius: 8px;
  }

  .titles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(520px, 1fr));
    gap: 24px;
    padding: 4px;
    margin-bottom: 40px;
  }

  .title-materials-section {
    padding: 24px;
    margin-top: 30px;
    background: linear-gradient(
      135deg,
      var(--el-color-success-light-9) 0%,
      var(--el-color-success-light-8) 100%
    );
    border: 1px solid var(--el-color-success-light-3);
    border-radius: 8px;

    .section-header h3 {
      color: var(--el-color-success-dark-2);
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

  .briefing-edit-tabs {
    ::v-deep(.el-tabs__content) {
      padding: 20px;
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
