<template>
  <div class="title-selection-container">
    <ArtTableHeader title="标题选择" :actions="headerActions" @back="goBack" />

    <!-- 项目加载提示 -->
    <div
      v-if="loadingProject || (!projectStore.currentProject && projectId)"
      class="project-loading"
    >
      <el-empty :description="loadingProject ? '正在加载项目信息...' : '项目信息加载失败'" />
    </div>

    <div v-else class="main-content">
      <div class="step-indicator">
        <div class="step-item completed">
          <div class="step-number">✓</div>
          <div class="step-label">需求</div>
        </div>
        <div class="step-connector completed"></div>
        <div class="step-item active">
          <div class="step-number">2</div>
          <div class="step-label">标题</div>
        </div>
        <div class="step-connector"></div>
        <div class="step-item">
          <div class="step-number">3</div>
          <div class="step-label">大纲</div>
        </div>
        <div class="step-connector"></div>
        <div class="step-item">
          <div class="step-number">4</div>
          <div class="step-label">正文</div>
        </div>
      </div>

      <!-- 生成进度显示 -->
      <div v-if="titleGeneration.state.isGenerating" class="generation-progress">
        <el-progress
          :percentage="titleGeneration.state.progress"
          :status="titleGeneration.state.progress === 100 ? 'success' : undefined"
          :stroke-width="6"
        />
        <p class="progress-text">正在生成标题，请稍候...</p>
      </div>

      <div class="title-generation-section">
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
                  <!-- 修复：使用 value 属性替代即将废弃的 label 属性 -->
                  <el-radio value="short">简短</el-radio>
                  <el-radio value="medium">适中</el-radio>
                  <el-radio value="long">详细</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="风格偏好">
                <el-checkbox-group v-model="titleControls.styles">
                  <el-checkbox label="creative">创意性</el-checkbox>
                  <el-checkbox label="professional">专业性</el-checkbox>
                  <el-checkbox label="catchy">吸引力</el-checkbox>
                  <el-checkbox label="descriptive">描述性</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="包含关键词">
                <div class="keywords-section">
                  <el-tag
                    v-for="keyword in titleGeneration.state.customKeywords"
                    :key="keyword"
                    closable
                    @close="titleGeneration.removeCustomKeyword(keyword)"
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
            @click="executeSearch2Title"
            :loading="search2titleLoading"
            :disabled="!canGenerateSearch2Title"
          >
            <el-icon><MagicStick /></el-icon>
            一键Search2Title
          </el-button>

          <el-button v-if="search2titleLoading" @click="cancelSearch2Title"> 取消任务 </el-button>

          <p class="generation-tip" v-if="!canGenerateTitles && !canGenerateSearch2Title">
            请确保有研究简报
          </p>
        </div>
      </div>

      <div class="titles-display-section" v-if="titleGeneration.hasGeneratedTitles">
        <div class="section-header">
          <h3>生成的标题选项</h3>
          <el-tag type="info"
            >共 {{ (titleGeneration.state.generatedTitles || []).length }} 个标题</el-tag
          >
        </div>

        <div class="titles-grid">
          <TitleCard
            v-for="(title, index) in titleGeneration.state.generatedTitles"
            :key="index"
            :title="title"
            :is-selected="titleGeneration.state.selectedTitle === title"
            :score="getTitleScore(title)"
            :suggestions="getTitleSuggestions(title)"
            @select="titleGeneration.selectTitle"
          />
        </div>

        <!-- 当前选中标题对应的素材 -->
        <div
          v-if="titleGeneration.state.selectedTitle && currentTitleMaterials.length > 0"
          class="title-materials-section"
        >
          <div class="section-header">
            <h3>「{{ titleGeneration.state.selectedTitle.title }}」对应素材</h3>
          </div>
          <div class="materials-list">
            <el-card
              v-for="material in currentTitleMaterials"
              :key="material.id"
              class="material-card"
              shadow="hover"
            >
              <div class="material-content">
                <h4>{{ material.title }}</h4>
                <p class="material-summary">{{ material.summary }}</p>
              </div>
            </el-card>
          </div>
        </div>
      </div>

      <div class="navigation-actions">
        <el-button @click="goBack" size="large">返回需求</el-button>
        <el-button
          type="success"
          size="large"
          @click="confirmTitle"
          :disabled="!titleGeneration.hasSelectedTitle"
        >
          确认标题并继续
        </el-button>
      </div>
    </div>
  </div>

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
      :research-brief="documentStore.documentState.researchBrief || ''"
      @close="closeMaterialSelection"
      @materials-selected="handleMaterialsSelected"
    />
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { useTitleGeneration } from '@/composables/useTitleGeneration'
  import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
  import { useProjectStore } from '@/store/modules/project'
  import TitleCard from '@/components/custom/TitleCard.vue'
  import MaterialSelectionForTitle from '@/components/custom/material-search/MaterialSelectionForTitle.vue'
  import type { Title } from '@/types/ai'
  import type { Material } from '@/types/material'

  interface TitleControls {
    count: number
    length: string
    styles: string[]
  }

  const router = useRouter()
  const route = useRoute()
  const titleGeneration = useTitleGeneration()
  const documentStore = useDocumentGenerateStore()
  const projectStore = useProjectStore()

  const projectId = route.params.projectId as string

  // 项目加载状态
  const loadingProject = ref(false)

  const titleControls = reactive<TitleControls>({
    count: 5,
    length: 'medium',
    styles: ['professional', 'catchy']
  })

  const newKeyword = ref('')

  // 素材选择对话框状态
  const showMaterialSelectionDialog = ref(false)

  // Search2Title Agent状态
  const search2titleTaskId = ref<string | null>(null)
  const search2titleLoading = ref(false)

  // 头部操作按钮
  const headerActions = computed(() => {
    return [
      {
        label: '导出',
        type: 'primary' as const, // 使用 as const 确保类型为字面量类型而非 string
        icon: 'el-icon-download',
        handler: () => {
          // 导出标题数据的处理函数
          ElMessage.info('导出功能开发中')
        }
      }
    ]
  })

  // 计算属性
  const canGenerateSearch2Title = computed(() => {
    return documentStore.documentState.researchBrief && !search2titleLoading.value
  })

  // 当前选中标题对应的素材
  const currentTitleMaterials = computed(() => {
    if (!titleGeneration.state.selectedTitle) return []

    // 根据selectedTitle的sources字段匹配素材
    const selectedSources = titleGeneration.state.selectedTitle.sources || []
    if (selectedSources.length > 0 && documentStore.documentState.searchResults) {
      return documentStore.documentState.searchResults
        .filter((_, index) => selectedSources.includes((index + 1).toString()))
        .map((result) => ({
          id: `search-${result.query}-${Math.random().toString(36).substr(2, 9)}`,
          title: result.aititle,
          summary: result.summary,
          url: result.url,
          tags: result.tags || [],
          createdAt: result.published_date ? new Date(result.published_date) : new Date(),
          score: result.score,
          key_excerpts: result.key_excerpts || [],
          content: '',
          type: 'article' as const
        }))
    }

    return []
  })

  onMounted(async () => {
    // 更新当前步骤
    documentStore.documentState.currentStep = 'title'

    // 清理过期的任务
    documentStore.cleanupExpiredTasks()

    // 加载项目信息
    await loadProject()

    // 加载现有数据
    await loadExistingData()

    // 提取关键词
    extractKeywords()
  })

  // 加载项目信息
  const loadProject = async () => {
    try {
      loadingProject.value = true

      if (!projectId) {
        ElMessage.error('项目ID不存在')
        return
      }

      const numericProjectId = Number(projectId)

      // 如果 store 中已有当前项目且ID匹配，直接返回
      if (
        projectStore.currentProject &&
        Number(projectStore.currentProject.id) === numericProjectId
      ) {
        return
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
        return
      }

      // 如果项目列表中没有，尝试从API获取
      try {
        const { projectService } = await import('@/services/projectService')
        const response = await projectService.getProjectDetail(numericProjectId)

        if (response.project) {
          projectStore.setCurrentProject(response.project)
        }
      } catch (apiError) {
        console.error('从API获取项目失败:', apiError)
        ElMessage.error('项目不存在或已被删除')
      }
    } catch (error) {
      console.error('加载项目失败:', error)
      ElMessage.error('加载项目信息失败')
    } finally {
      loadingProject.value = false
    }
  }

  const loadExistingData = async () => {
    try {
      // 从localStorage加载标题数据
      const titlesData = localStorage.getItem(`project_${projectId}_titles`)
      if (titlesData) {
        const { titles, selectedTitle } = JSON.parse(titlesData)
        if (titles && titles.length > 0) {
          documentStore.updateDocumentState({
            generatedTitles: titles,
            selectedTitle: selectedTitle || null
          })
        }
      }

      // 检查服务状态
      await checkServiceStatus()
    } catch (error) {
      console.error('加载现有数据失败:', error)
    }
  }

  const checkServiceStatus = async () => {
    try {
      const status = await titleGeneration.getTitleToolsStatus()
      if (!status.configured) {
        ElMessage.warning('标题生成服务未配置，将使用模拟数据')
      }
    } catch {
      ElMessage.warning('标题生成服务状态检查失败，将使用模拟数据')
    }
  }

  const extractKeywords = () => {
    if (documentStore.documentState.researchBrief) {
      titleGeneration.extractKeywords(documentStore.documentState.researchBrief)
    }
  }

  const addKeyword = () => {
    const keyword = newKeyword.value.trim()
    if (keyword) {
      titleGeneration.addCustomKeyword(keyword)
      newKeyword.value = ''
    }
  }

  const getTitleScore = (title: Title): number => {
    return titleGeneration.getTitleScore(title)
  }

  const getTitleSuggestions = (title: Title): string[] => {
    return titleGeneration.getTitleSuggestions(title)
  }

  // 打开素材选择对话框
  const openMaterialSelection = () => {
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
  const executeSearch2Title = async () => {
    if (!documentStore.documentState.researchBrief) {
      ElMessage.warning('请先完善研究简报')
      return
    }

    try {
      search2titleLoading.value = true

      const response = await documentStore.executeSearch2TitleAgent(
        'user-id',
        projectId,
        documentStore.documentState.researchBrief
      )

      if (response) {
        search2titleTaskId.value = response.task_id

        // 开始轮询任务状态
        pollSearch2TitleStatus(response.task_id)
      }
    } catch {
      ElMessage.error('Search2Title执行失败')
      search2titleLoading.value = false
    }
  }

  // 轮询Search2Title任务状态
  const pollSearch2TitleStatus = async (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await documentStore.getSearch2TitleTaskStatus(taskId, 'user-id', projectId)

        if (status) {
          if (status.status === 'SUCCESS') {
            clearInterval(interval)
            search2titleLoading.value = false

            // 更新素材和标题
            if (status.result?.research_data?.web_search_data) {
              // 更新搜索结果到store
              documentStore.updateSearchResults(status.result.research_data.web_search_data)
            }

            if (status.result?.title_data?.titles) {
              documentStore.updateDocumentState({
                generatedTitles: status.result.title_data.titles
              })

              // 保存到localStorage
              const titlesData = {
                titles: status.result.title_data.titles,
                selectedTitle: titleGeneration.state.selectedTitle
              }
              localStorage.setItem(`project_${projectId}_titles`, JSON.stringify(titlesData))
            }

            ElMessage.success('Search2Title执行完成')
          } else if (status.status === 'FAILURE') {
            clearInterval(interval)
            search2titleLoading.value = false
            ElMessage.error(status.error || 'Search2Title执行失败')
          }
        }
      } catch (error) {
        console.error('轮询Search2Title状态失败:', error)
      }
    }, 5000)
  }

  // 取消Search2Title任务
  const cancelSearch2Title = async () => {
    if (!search2titleTaskId.value) return

    try {
      await documentStore.cancelSearch2TitleTask(search2titleTaskId.value, 'user-id', projectId)
      search2titleLoading.value = false
      search2titleTaskId.value = null
    } catch {
      ElMessage.error('取消Search2Title任务失败')
    }
  }

  const confirmTitle = () => {
    if (!titleGeneration.hasSelectedTitle) {
      ElMessage.warning('请选择一个标题')
      return
    }

    // 保存到store
    if (titleGeneration.state.selectedTitle) {
      documentStore.selectTitle(titleGeneration.state.selectedTitle)

      // 保存到localStorage
      const titlesData = {
        titles: titleGeneration.state.generatedTitles,
        selectedTitle: titleGeneration.state.selectedTitle
      }
      localStorage.setItem(`project_${projectId}_titles`, JSON.stringify(titlesData))

      ElMessage.success('标题已确认，即将进入大纲阶段')

      // 导航到大纲页面
      setTimeout(() => {
        router.push(`/document-generation/outline/${projectId}`)
      }, 1500)
    }
  }

  const goBack = () => {
    router.push(`/document-generation/requirements/${projectId}`)
  }
</script>

<style scoped lang="scss">
  .title-selection-container {
    max-width: 1400px;
    padding: 20px;
    margin: 0 auto;
  }

  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    margin-bottom: 40px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .step-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      margin-bottom: 8px;
      font-weight: bold;
      color: var(--el-text-color-secondary);
      background: var(--el-border-color);
      border-radius: 50%;
    }

    .step-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }

    &.active {
      .step-number {
        color: white;
        background: var(--el-color-primary);
      }

      .step-label {
        font-weight: 500;
        color: var(--el-color-primary);
      }
    }

    &.completed {
      .step-number {
        color: white;
        background: var(--el-color-success);
      }

      .step-label {
        color: var(--el-color-success);
      }
    }
  }

  .step-connector {
    width: 60px;
    height: 2px;
    margin: 0 20px;
    margin-top: -20px;
    background: var(--el-border-color);

    &.completed {
      background: var(--el-color-success);
    }
  }

  .generation-progress {
    padding: 20px;
    margin-bottom: 30px;
    text-align: center;
    background: var(--el-bg-color);
    border-radius: 8px;

    .progress-text {
      margin: 10px 0 0;
      color: var(--el-text-color-secondary);
    }
  }

  .title-generation-section {
    padding: 30px;
    margin-bottom: 30px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .generation-controls {
    margin-bottom: 30px;
  }

  .control-group h4 {
    margin: 0 0 20px;
    font-size: 16px;
    color: var(--el-text-color-primary);
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
    margin-bottom: 30px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 25px;

    h3 {
      margin: 0;
      color: var(--el-text-color-primary);
    }

    .actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }

  .titles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .title-card {
    padding: 20px;
    cursor: pointer;
    border: 2px solid var(--el-border-color);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    }

    &.selected {
      background: var(--el-color-success-light-9);
      border-color: var(--el-color-success);
    }
  }

  .title-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 15px;

    .title-content {
      flex: 1;

      h4 {
        margin: 0 0 8px;
        font-size: 16px;
        line-height: 1.4;
        color: var(--el-text-color-primary);
      }
    }

    .title-selection {
      margin-left: 15px;
    }
  }

  .title-analysis {
    margin-bottom: 15px;

    .analysis-item {
      margin-bottom: 5px;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .title-keywords {
    margin-bottom: 15px;

    .keyword-label {
      margin-right: 8px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .title-advantages {
    h5 {
      margin: 0 0 8px;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    ul {
      padding-left: 20px;
      margin: 0;

      li {
        margin-bottom: 4px;
        font-size: 13px;
        color: var(--el-text-color-regular);

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  .navigation-actions {
    display: flex;
    gap: 20px;
    justify-content: center;
  }

  .score-label {
    margin-right: 8px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  // 素材相关样式
  .materials-section,
  .title-materials-section {
    padding: 20px;
    margin-top: 30px;
    background: var(--el-bg-color-page);
    border-radius: 8px;

    .materials-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .material-card {
      .material-content {
        h4 {
          margin: 0 0 8px;
          font-size: 15px;
          color: var(--el-text-color-primary);
        }

        .material-summary {
          display: -webkit-box;
          margin: 0 0 12px;
          overflow: hidden;
          font-size: 13px;
          line-height: 1.5;
          color: var(--el-text-color-regular);
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .material-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
      }
    }
  }

  .title-materials-section {
    background: var(--el-color-success-light-9);
    border: 1px solid var(--el-color-success-light-3);
  }

  @media (width <= 1200px) {
    .titles-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (width <= 768px) {
    .title-selection-container {
      padding: 15px;
    }

    .title-generation-section,
    .titles-display-section {
      padding: 20px;
    }

    .step-indicator {
      padding: 15px;
    }

    .step-connector {
      width: 40px;
      margin: 0 10px;
    }

    .navigation-actions {
      flex-direction: column;
      align-items: center;
    }
  }
</style>
