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
                <el-radio label="short">简短</el-radio>
                <el-radio label="medium">适中</el-radio>
                <el-radio label="long">详细</el-radio>
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
                  v-for="keyword in extractedKeywords"
                  :key="keyword"
                  closable
                  @close="removeKeyword(keyword)"
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

        <div class="material-section">
          <h4>素材选择</h4>
          <div class="material-controls">
            <el-button @click="openMaterialLibrary" type="primary" plain>从素材库选择</el-button>
            <el-button @click="aiSearchMaterials" :loading="aiSearching" plain
              >AI智能检索</el-button
            >
            <el-button
              @click="clearSelectedMaterials"
              :disabled="selectedMaterials.length === 0"
              plain
              >清空选择</el-button
            >
          </div>

          <div class="selected-materials" v-if="selectedMaterials.length > 0">
            <div v-for="material in selectedMaterials" :key="material.id" class="material-card">
              <div class="material-header">
                <h5>{{ material.title }}</h5>
                <el-button type="danger" size="small" @click="removeMaterial(material.id)" link>
                  移除
                </el-button>
              </div>
              <p>{{ material.content.substring(0, 150) }}...</p>
              <div class="material-tags">
                <el-tag v-for="tag in material.tags" :key="tag" size="small" effect="plain">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="generation-actions">
          <el-button
            type="primary"
            size="large"
            @click="generateTitles"
            :loading="generatingTitles"
            :disabled="!canGenerateTitles"
          >
            生成标题
          </el-button>
          <p class="generation-tip" v-if="!canGenerateTitles">
            请至少选择一个素材或添加关键词来生成标题
          </p>
        </div>
      </div>
    </div>

    <div class="titles-display-section" v-if="generatedTitles.length > 0">
      <div class="section-header">
        <h3>生成的标题选项</h3>
        <el-tag type="info">共 {{ generatedTitles.length }} 个标题</el-tag>
      </div>

      <div class="titles-grid">
        <div
          v-for="(title, index) in generatedTitles"
          :key="index"
          class="title-card"
          :class="{ selected: selectedTitleIndex === index }"
          @click="selectTitle(index)"
        >
          <div class="title-header">
            <div class="title-content">
              <h4>{{ title.text }}</h4>
              <div class="title-score">
                <el-rate v-model="title.score" disabled show-score text-color="#ff9900" />
              </div>
            </div>
            <div class="title-selection">
              <el-radio v-model="selectedTitleIndex" :label="index">
                {{ selectedTitleIndex === index ? '已选择' : '选择' }}
              </el-radio>
            </div>
          </div>

          <div class="title-analysis">
            <div class="analysis-item"><strong>吸引力：</strong> {{ title.attractiveness }}</div>
            <div class="analysis-item"><strong>相关性：</strong> {{ title.relevance }}</div>
            <div class="analysis-item"><strong>独特性：</strong> {{ title.uniqueness }}</div>
          </div>

          <div class="title-keywords">
            <span class="keyword-label">关键词：</span>
            <el-tag
              v-for="keyword in title.keywords"
              :key="keyword"
              size="small"
              type="info"
              effect="plain"
            >
              {{ keyword }}
            </el-tag>
          </div>

          <div class="title-advantages">
            <h5>优势分析：</h5>
            <ul>
              <li v-for="advantage in title.advantages" :key="advantage">{{ advantage }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="selected-title-preview" v-if="selectedTitleIndex !== null">
        <div class="preview-header">
          <h4>选中的标题</h4>
          <el-tag type="success" effect="dark">已选择</el-tag>
        </div>
        <div class="preview-content">
          <h3>{{ generatedTitles[selectedTitleIndex].text }}</h3>
          <p class="preview-description">{{ generatedTitles[selectedTitleIndex].description }}</p>
        </div>
      </div>
    </div>

    <div class="navigation-actions">
      <el-button @click="goBack" size="large">返回需求</el-button>
      <el-button
        type="success"
        size="large"
        @click="confirmTitle"
        :disabled="selectedTitleIndex === null"
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

  interface TitleControls {
    count: number
    length: string
    styles: string[]
  }

  interface Material {
    id: string
    title: string
    content: string
    tags: string[]
  }

  interface GeneratedTitle {
    text: string
    score: number
    attractiveness: string
    relevance: string
    uniqueness: string
    keywords: string[]
    advantages: string[]
    description: string
  }

  const router = useRouter()
  const route = useRoute()

  const projectId = route.params.projectId as string

  const titleControls = reactive<TitleControls>({
    count: 5,
    length: 'medium',
    styles: ['professional', 'catchy']
  })

  const extractedKeywords = ref<string[]>([])
  const newKeyword = ref('')
  const selectedMaterials = ref<Material[]>([])
  const generatedTitles = ref<GeneratedTitle[]>([])
  const selectedTitleIndex = ref<number | null>(null)
  const generatingTitles = ref(false)
  const aiSearching = ref(false)

  onMounted(() => {
    loadExistingData()
    extractKeywordsFromRequirements()
  })

  const loadExistingData = () => {
    // Load existing requirements
    const requirementsData = localStorage.getItem(`project_${projectId}_requirements`)
    if (requirementsData) {
      const { requirements } = JSON.parse(requirementsData)
      // Extract keywords from requirements
      const keywords = [
        ...requirements.keyPoints,
        requirements.topic,
        requirements.documentType
      ].filter(Boolean)
      extractedKeywords.value = [...new Set(keywords)]
    }

    // Load existing titles if any
    const titlesData = localStorage.getItem(`project_${projectId}_titles`)
    if (titlesData) {
      const { titles, selectedIndex } = JSON.parse(titlesData)
      generatedTitles.value = titles
      selectedTitleIndex.value = selectedIndex
    }

    // Load selected materials
    const materialsData = localStorage.getItem(`project_${projectId}_materials`)
    if (materialsData) {
      selectedMaterials.value = JSON.parse(materialsData)
    }
  }

  const extractKeywordsFromRequirements = () => {
    // This would typically analyze the requirements and extract relevant keywords
    // For now, we'll use the keywords from requirements
  }

  const canGenerateTitles = computed(() => {
    return selectedMaterials.value.length > 0 || extractedKeywords.value.length > 0
  })

  const addKeyword = () => {
    const keyword = newKeyword.value.trim()
    if (keyword && !extractedKeywords.value.includes(keyword)) {
      extractedKeywords.value.push(keyword)
      newKeyword.value = ''
    }
  }

  const removeKeyword = (keyword: string) => {
    const index = extractedKeywords.value.indexOf(keyword)
    if (index > -1) {
      extractedKeywords.value.splice(index, 1)
    }
  }

  const openMaterialLibrary = () => {
    // TODO: Open material library dialog
    // For now, simulate adding some materials
    const mockMaterials: Material[] = [
      {
        id: '1',
        title: '2024年人工智能发展趋势报告',
        content:
          '人工智能技术在过去一年中取得了显著进展，特别是在大语言模型、计算机视觉和机器学习等领域...',
        tags: ['AI', '技术趋势', '2024']
      },
      {
        id: '2',
        title: 'AI技术在各行业的应用现状',
        content:
          '人工智能已经广泛应用于金融、医疗、教育、制造等多个行业，为这些领域带来了革命性的变化...',
        tags: ['AI应用', '行业分析']
      }
    ]

    // Add materials that aren't already selected
    mockMaterials.forEach((material) => {
      if (!selectedMaterials.value.find((m) => m.id === material.id)) {
        selectedMaterials.value.push(material)
      }
    })

    ElMessage.success('已添加素材到选择列表')
  }

  const aiSearchMaterials = async () => {
    aiSearching.value = true
    try {
      // Simulate AI search
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock AI search results based on keywords
      const mockMaterials: Material[] = [
        {
          id: '3',
          title: '机器学习算法最新进展',
          content:
            '近年来，机器学习算法在各个领域都取得了突破性进展，特别是在深度学习和强化学习方面...',
          tags: ['机器学习', '算法', '深度学习']
        },
        {
          id: '4',
          title: '自然语言处理技术综述',
          content:
            '自然语言处理作为AI的重要分支，在文本理解、情感分析、机器翻译等领域都有重要应用...',
          tags: ['NLP', '文本处理', 'AI技术']
        }
      ]

      // Add materials that aren't already selected
      mockMaterials.forEach((material) => {
        if (!selectedMaterials.value.find((m) => m.id === material.id)) {
          selectedMaterials.value.push(material)
        }
      })

      ElMessage.success('AI检索完成，已添加相关素材')
    } catch {
      ElMessage.error('AI检索失败')
    } finally {
      aiSearching.value = false
    }
  }

  const removeMaterial = (id: string) => {
    const index = selectedMaterials.value.findIndex((m) => m.id === id)
    if (index > -1) {
      selectedMaterials.value.splice(index, 1)
    }
  }

  const clearSelectedMaterials = () => {
    selectedMaterials.value = []
  }

  const generateTitles = async () => {
    if (!canGenerateTitles.value) {
      ElMessage.warning('请至少选择一个素材或添加关键词')
      return
    }

    generatingTitles.value = true
    try {
      // Simulate AI title generation
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Generate mock titles based on materials and keywords
      const baseKeywords = [...extractedKeywords.value]
      const materialTitles = selectedMaterials.value.map((m) => m.title)

      const mockTitles: GeneratedTitle[] = [
        {
          text: `深度解析：${baseKeywords[0] || 'AI技术'}在${titleControls.length === 'short' ? '各行业' : '不同行业领域'}的${titleControls.styles.includes('creative') ? '创新' : '应用'}实践`,
          score: 4.5,
          attractiveness: '高 - 使用"深度解析"吸引眼球',
          relevance: '高 - 直接关联AI技术应用',
          uniqueness: '中 - 类似标题较多但内容深度不同',
          keywords: baseKeywords.slice(0, 3),
          advantages: [
            '使用"深度解析"增强权威性',
            '涵盖多个行业，受众面广',
            '关键词密度适中，有利于SEO'
          ],
          description: '适合专业读者，具有较强的权威性和深度'
        },
        {
          text: `${titleControls.styles.includes('catchy') ? '揭秘' : '分析'}：${baseKeywords[0] || '人工智能'}如何${titleControls.length === 'long' ? '在各个行业领域中发挥重要作用并推动产业变革' : '改变行业格局'}`,
          score: 4.3,
          attractiveness: '高 - "揭秘"引发好奇心',
          relevance: '高 - 聚焦AI的行业影响',
          uniqueness: '高 - 角度新颖，内容独特',
          keywords: [...baseKeywords.slice(0, 2), '行业变革'],
          advantages: ['"揭秘"引发读者好奇心', '强调变革性影响，有冲击力', '适应不同长度需求'],
          description: '适合大众读者，具有较强的吸引力和传播性'
        },
        {
          text: `${materialTitles[0] ? '基于' + materialTitles[0].substring(0, 10) + '的' : ''}${baseKeywords[0] || 'AI技术'}${titleControls.styles.includes('professional') ? '系统性' : ''}研究报告`,
          score: 4.1,
          attractiveness: '中 - 较为正式但内容扎实',
          relevance: '极高 - 基于具体素材内容',
          uniqueness: '高 - 结合具体素材，内容独特',
          keywords: [...baseKeywords, '研究报告'],
          advantages: ['基于实际素材，内容可信度高', '系统性分析，专业性强', '适合学术或专业场景'],
          description: '适合学术和专业研究，内容严谨可信'
        },
        {
          text: `从${selectedMaterials.value[0]?.tags[0] || '技术'}视角看${baseKeywords[0] || 'AI'}：${titleControls.length === 'long' ? '一个全面而深入的技术发展分析' : '技术发展趋势分析'}`,
          score: 3.9,
          attractiveness: '中 - 视角独特但吸引力一般',
          relevance: '高 - 从特定角度分析',
          uniqueness: '极高 - 独特视角',
          keywords: [...baseKeywords, '技术视角'],
          advantages: ['独特视角，差异化明显', '专业性较强，目标明确', '适合特定受众群体'],
          description: '适合专业读者，从特定技术角度深入分析'
        },
        {
          text: `${titleControls.styles.includes('creative') ? '智能未来：' : ''}${baseKeywords[0] || '人工智能'}的${titleControls.length === 'short' ? '现状与展望' : '当前发展现状及未来趋势展望'}`,
          score: 3.7,
          attractiveness: '中 - "智能未来"有前瞻性',
          relevance: '高 - 覆盖现状和趋势',
          uniqueness: '中 - 类似标题较多',
          keywords: [...baseKeywords, '未来趋势'],
          advantages: ['时间维度完整，内容全面', '"智能未来"有前瞻性', '适合趋势分析类内容'],
          description: '适合趋势分析和预测，时间维度完整'
        }
      ]

      generatedTitles.value = mockTitles.slice(0, titleControls.count)

      ElMessage.success(`成功生成 ${generatedTitles.value.length} 个标题`)
    } catch {
      ElMessage.error('标题生成失败')
    } finally {
      generatingTitles.value = false
    }
  }

  const selectTitle = (index: number) => {
    selectedTitleIndex.value = index
  }

  const confirmTitle = () => {
    if (selectedTitleIndex.value === null) {
      ElMessage.warning('请选择一个标题')
      return
    }

    const selectedTitle = generatedTitles.value[selectedTitleIndex.value]

    // Save to localStorage
    const titleData = {
      titles: generatedTitles.value,
      selectedIndex: selectedTitleIndex.value,
      selectedTitle: selectedTitle,
      updatedAt: new Date().toISOString()
    }

    localStorage.setItem(`project_${projectId}_titles`, JSON.stringify(titleData))

    ElMessage.success('标题已确认，即将进入大纲阶段')

    // Navigate to outline
    setTimeout(() => {
      router.push(`/document-generation/outline/${projectId}`)
    }, 1500)
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

  .title-generation-section {
    padding: 30px;
    margin-bottom: 30px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .generation-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 30px;
  }

  .control-group h4,
  .material-section h4 {
    margin: 0 0 20px;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  .material-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .keywords-section {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .selected-materials {
    padding: 15px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
  }

  .material-card {
    padding: 15px;
    margin-bottom: 10px;
    background: white;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    &:last-child {
      margin-bottom: 0;
    }

    .material-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      h5 {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-primary);
      }
    }

    p {
      margin: 0 0 10px;
      font-size: 13px;
      line-height: 1.4;
      color: var(--el-text-color-regular);
    }

    .material-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
  }

  .generation-actions {
    display: flex;
    flex-direction: column;
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

  @media (width <= 1200px) {
    .generation-controls {
      grid-template-columns: 1fr;
    }

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

    .material-controls {
      flex-direction: column;
    }
  }
</style>
