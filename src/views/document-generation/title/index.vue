<template>
  <div class="title-selection-container">
    <ArtTableHeader title="标题选择" :actions="headerActions" @back="goBack" />

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
        <el-button
          type="primary"
          size="large"
          @click="generateTitles"
          :loading="titleGeneration.state.isGenerating"
          :disabled="!canGenerateTitles"
        >
          AI生成待选标题
        </el-button>
        <el-button
          v-if="titleGeneration.hasGeneratedTitles"
          @click="regenerateTitles"
          :loading="titleGeneration.state.isGenerating"
        >
          重新生成
        </el-button>
        <p class="generation-tip" v-if="!canGenerateTitles">
          请确保有研究简报和搜索数据来生成标题
        </p>
      </div>
    </div>

    <div class="titles-display-section" v-if="titleGeneration.hasGeneratedTitles">
      <div class="section-header">
        <h3>生成的标题选项</h3>
        <el-tag type="info">共 {{ titleGeneration.state.generatedTitles.length }} 个标题</el-tag>
      </div>

      <div class="titles-grid">
        <div
          v-for="(title, index) in titleGeneration.state.generatedTitles"
          :key="index"
          class="title-card"
          :class="{ selected: titleGeneration.state.selectedTitle === title }"
          @click="titleGeneration.selectTitle(title)"
        >
          <div class="title-header">
            <div class="title-content">
              <h4>{{ title.title }}</h4>
              <div class="title-score">
                <span class="score-label">评分: </span>
                <el-rate
                  :value="getTitleScore(title)"
                  disabled
                  show-score
                  text-color="#ff9900"
                  :max="5"
                />
              </div>
            </div>
            <div class="title-selection">
              <!-- 修复：使用 model-value 和 value 属性替代即将废弃的 label 属性 -->
              <el-radio
                :model-value="titleGeneration.state.selectedTitle === title"
                :value="true"
                @change="titleGeneration.selectTitle(title)"
              >
                {{ titleGeneration.state.selectedTitle === title ? '已选择' : '选择' }}
              </el-radio>
            </div>
          </div>

          <div class="title-analysis">
            <div class="analysis-item"><strong>角度：</strong> {{ title.angle }}</div>
            <div class="analysis-item"><strong>时效性：</strong> {{ title.why_now }}</div>
            <div class="analysis-item"><strong>可行性：</strong> {{ title.feasibility }}</div>
          </div>

          <div class="title-keywords">
            <span class="keyword-label">新闻价值：</span>
            <el-tag
              v-for="value in title.news_values"
              :key="value"
              size="small"
              type="info"
              effect="plain"
            >
              {{ value }}
            </el-tag>
          </div>

          <div class="title-advantages">
            <h5>优势分析：</h5>
            <ul>
              <li v-for="(advantage, index) in getTitleSuggestions(title)" :key="index">{{
                advantage
              }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="selected-title-preview" v-if="titleGeneration.hasSelectedTitle">
        <div class="preview-header">
          <h4>选中的标题</h4>
          <el-tag type="success" effect="dark">已选择</el-tag>
        </div>
        <div class="preview-content">
          <h3>{{ titleGeneration.state.selectedTitle?.title }}</h3>
          <p class="preview-description">
            <strong>角度：</strong> {{ titleGeneration.state.selectedTitle?.angle }}<br />
            <strong>时效性：</strong> {{ titleGeneration.state.selectedTitle?.why_now }}<br />
            <strong>可行性：</strong> {{ titleGeneration.state.selectedTitle?.feasibility }}
          </p>
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
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { useTitleGeneration } from '@/composables/useTitleGeneration'
  import { useDocumentGenerateStore } from '@/store/documentGenerate'
  import type { Title } from '@/types/ai'

  interface TitleControls {
    count: number
    length: string
    styles: string[]
  }

  const router = useRouter()
  const route = useRoute()
  const titleGeneration = useTitleGeneration()
  const documentStore = useDocumentGenerateStore()

  const projectId = route.params.projectId as string

  const titleControls = reactive<TitleControls>({
    count: 5,
    length: 'medium',
    styles: ['professional', 'catchy']
  })

  const newKeyword = ref('')

  // 头部操作按钮
  const headerActions = computed(() => {
    return [
      {
        label: '导出',
        type: 'primary',
        icon: 'el-icon-download',
        handler: () => {
          // 导出标题数据的处理函数
          ElMessage.info('导出功能开发中')
        }
      }
    ]
  })

  // 计算属性
  const canGenerateTitles = computed(() => {
    return documentStore.currentDocument?.researchBrief && !titleGeneration.state.isGenerating
  })

  onMounted(async () => {
    // 确保当前文档项目已设置
    if (!documentStore.currentDocument) {
      documentStore.setCurrentDocument(projectId)
    }

    // 加载现有数据
    await loadExistingData()

    // 提取关键词
    extractKeywords()
  })

  const loadExistingData = async () => {
    try {
      // 从localStorage加载标题数据
      const titlesData = localStorage.getItem(`project_${projectId}_titles`)
      if (titlesData) {
        const { titles, selectedTitle } = JSON.parse(titlesData)
        if (titles && titles.length > 0) {
          titleGeneration.state.generatedTitles = titles
          if (selectedTitle) {
            titleGeneration.selectTitle(selectedTitle)
          }
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
    if (documentStore.currentDocument?.researchBrief) {
      titleGeneration.extractKeywords(documentStore.currentDocument.researchBrief)
    }
  }

  const addKeyword = () => {
    const keyword = newKeyword.value.trim()
    if (keyword) {
      titleGeneration.addCustomKeyword(keyword)
      newKeyword.value = ''
    }
  }

  const generateTitles = async () => {
    if (!documentStore.currentDocument?.researchBrief) {
      ElMessage.warning('请先完善研究简报')
      return
    }

    try {
      await titleGeneration.generateTitles(documentStore.currentDocument.researchBrief)

      // 保存到localStorage
      saveTitlesData()
    } catch {
      ElMessage.error('标题生成失败')
    }
  }

  const regenerateTitles = async () => {
    await generateTitles()
  }

  const getTitleScore = (title: Title): number => {
    return titleGeneration.getTitleScore(title)
  }

  const getTitleSuggestions = (title: Title): string[] => {
    return titleGeneration.getTitleSuggestions(title)
  }

  const saveTitlesData = () => {
    const titleData = {
      titles: titleGeneration.state.generatedTitles,
      selectedTitle: titleGeneration.state.selectedTitle,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(`project_${projectId}_titles`, JSON.stringify(titleData))
  }

  const confirmTitle = () => {
    if (!titleGeneration.hasSelectedTitle) {
      ElMessage.warning('请选择一个标题')
      return
    }

    // 保存到store
    if (titleGeneration.state.selectedTitle) {
      documentStore.selectTitle(titleGeneration.state.selectedTitle)
      saveTitlesData()

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

  .selected-title-preview {
    padding: 25px;
    background: var(--el-color-success-light-9);
    border: 2px solid var(--el-color-success);
    border-radius: 8px;

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;

      h4 {
        margin: 0;
        color: var(--el-text-color-primary);
      }
    }

    .preview-content {
      h3 {
        margin: 0 0 10px;
        font-size: 20px;
        line-height: 1.4;
        color: var(--el-text-color-primary);
      }

      .preview-description {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--el-text-color-regular);
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
