<template>
  <div class="requirements-container">
    <ArtTableHeader title="需求定义" :actions="headerActions" @back="goBack" />

    <div class="requirements-content">
      <div class="step-indicator">
        <div class="step-item active">
          <div class="step-number">1</div>
          <div class="step-label">需求</div>
        </div>
        <div class="step-connector"></div>
        <div class="step-item">
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

      <div class="requirements-form">
        <el-form
          ref="requirementsFormRef"
          :model="requirementsForm"
          :rules="requirementsRules"
          label-width="120px"
          size="large"
        >
          <el-form-item label="主题/标题" prop="topic">
            <el-input
              v-model="requirementsForm.topic"
              placeholder="请输入文档的主题或标题"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="目标受众" prop="targetAudience">
            <el-select
              v-model="requirementsForm.targetAudience"
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
              v-model="requirementsForm.documentType"
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
              v-model="requirementsForm.wordCount"
              :min="500"
              :max="10000"
              :step="100"
              show-input
              show-stops
            />
          </el-form-item>

          <el-form-item label="语气风格" prop="tone">
            <el-radio-group v-model="requirementsForm.tone">
              <el-radio label="formal">正式</el-radio>
              <el-radio label="casual">轻松</el-radio>
              <el-radio label="professional">专业</el-radio>
              <el-radio label="friendly">友好</el-radio>
              <el-radio label="persuasive">说服性</el-radio>
              <el-radio label="objective">客观</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="关键要点" prop="keyPoints">
            <div class="key-points-input">
              <el-input
                v-model="currentKeyPoint"
                placeholder="输入关键要点后按回车添加"
                @keyup.enter="addKeyPoint"
              />
              <el-button @click="addKeyPoint" :disabled="!currentKeyPoint.trim()">添加</el-button>
            </div>
            <div class="key-points-list" v-if="requirementsForm.keyPoints.length > 0">
              <el-tag
                v-for="(point, index) in requirementsForm.keyPoints"
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
              v-model="requirementsForm.specialRequirements"
              type="textarea"
              :rows="4"
              placeholder="请输入任何特殊要求，如需要包含的特定信息、避免的词汇等"
            />
          </el-form-item>

          <el-form-item label="参考素材" prop="referenceMaterials">
            <div class="reference-section">
              <el-button @click="selectFromMaterialLibrary" type="primary" plain
                >从素材库选择</el-button
              >
              <el-button @click="aiSearchMaterials" :loading="aiSearching" plain
                >AI智能检索</el-button
              >
            </div>
            <div class="selected-materials" v-if="selectedMaterials.length > 0">
              <div v-for="material in selectedMaterials" :key="material.id" class="material-item">
                <div class="material-info">
                  <h4>{{ material.title }}</h4>
                  <p>{{ material.content.substring(0, 100) }}...</p>
                </div>
                <el-button type="danger" size="small" @click="removeMaterial(material.id)" link>
                  移除
                </el-button>
              </div>
            </div>
          </el-form-item>
        </el-form>

        <div class="form-actions">
          <el-button @click="goBack" size="large">返回</el-button>
          <el-button
            type="primary"
            size="large"
            @click="generateAIBriefing"
            :loading="generatingBriefing"
            :disabled="!canGenerateBriefing"
          >
            生成AI简报
          </el-button>
          <el-button
            type="success"
            size="large"
            @click="confirmRequirements"
            :disabled="!aiBriefingGenerated"
          >
            确认需求
          </el-button>
        </div>
      </div>

      <!-- AI简报展示区域 -->
      <div class="ai-briefing-section" v-if="aiBriefingGenerated">
        <div class="section-header">
          <h3>AI创作简报</h3>
          <el-button @click="editBriefing" size="small" type="primary" plain>编辑简报</el-button>
        </div>

        <div class="briefing-content">
          <div class="briefing-section">
            <h4>📋 文档概述</h4>
            <p>{{ aiBriefing.overview }}</p>
          </div>

          <div class="briefing-section">
            <h4>🎯 目标受众分析</h4>
            <p>{{ aiBriefing.audienceAnalysis }}</p>
          </div>

          <div class="briefing-section">
            <h4>📝 内容结构建议</h4>
            <ul>
              <li v-for="suggestion in aiBriefing.structureSuggestions" :key="suggestion">{{
                suggestion
              }}</li>
            </ul>
          </div>

          <div class="briefing-section">
            <h4>🔑 关键词建议</h4>
            <div class="keyword-tags">
              <el-tag
                v-for="keyword in aiBriefing.keywords"
                :key="keyword"
                type="warning"
                effect="plain"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </div>

          <div class="briefing-section">
            <h4>⚠️ 注意事项</h4>
            <ul>
              <li v-for="note in aiBriefing.cautions" :key="note">{{ note }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑简报对话框 -->
    <el-dialog
      v-model="briefingDialogVisible"
      title="编辑AI简报"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="editableBriefing" label-width="120px">
        <el-form-item label="文档概述">
          <el-input v-model="editableBriefing.overview" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="受众分析">
          <el-input v-model="editableBriefing.audienceAnalysis" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="结构建议">
          <el-input
            v-model="structureSuggestionsText"
            type="textarea"
            :rows="4"
            placeholder="每行一个建议"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="keywordsText" placeholder="用逗号分隔关键词" />
        </el-form-item>
        <el-form-item label="注意事项">
          <el-input
            v-model="cautionsText"
            type="textarea"
            :rows="4"
            placeholder="每行一个注意事项"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="briefingDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBriefing">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

  interface RequirementsForm {
    topic: string
    targetAudience: string
    documentType: string
    wordCount: number
    tone: string
    keyPoints: string[]
    specialRequirements: string
    referenceMaterials: any[]
  }

  interface AIBriefing {
    overview: string
    audienceAnalysis: string
    structureSuggestions: string[]
    keywords: string[]
    cautions: string[]
  }

  const router = useRouter()
  const route = useRoute()
  const requirementsFormRef = ref<FormInstance>()

  const projectId = route.params.projectId as string

  const requirementsForm = reactive<RequirementsForm>({
    topic: '',
    targetAudience: '',
    documentType: '',
    wordCount: 2000,
    tone: 'professional',
    keyPoints: [],
    specialRequirements: '',
    referenceMaterials: []
  })

  const currentKeyPoint = ref('')
  const selectedMaterials = ref([])
  const generatingBriefing = ref(false)
  const aiBriefingGenerated = ref(false)
  const aiSearching = ref(false)
  const briefingDialogVisible = ref(false)

  const aiBriefing = reactive<AIBriefing>({
    overview: '',
    audienceAnalysis: '',
    structureSuggestions: [],
    keywords: [],
    cautions: []
  })

  const editableBriefing = reactive({
    overview: '',
    audienceAnalysis: '',
    structureSuggestions: '',
    keywords: '',
    cautions: ''
  })

  const requirementsRules: FormRules = {
    topic: [
      { required: true, message: '请输入文档主题', trigger: 'blur' },
      { min: 2, max: 100, message: '主题长度应在2-100个字符之间', trigger: 'blur' }
    ],
    targetAudience: [{ required: true, message: '请选择目标受众', trigger: 'change' }],
    documentType: [{ required: true, message: '请选择文档类型', trigger: 'change' }],
    wordCount: [{ required: true, message: '请设置预期字数', trigger: 'blur' }],
    tone: [{ required: true, message: '请选择语气风格', trigger: 'change' }]
  }

  const canGenerateBriefing = computed(() => {
    return (
      requirementsForm.topic && requirementsForm.targetAudience && requirementsForm.documentType
    )
  })

  const structureSuggestionsText = computed({
    get: () => editableBriefing.structureSuggestions.join('\n'),
    set: (value: string) => {
      editableBriefing.structureSuggestions = value.split('\n').filter((s) => s.trim())
    }
  })

  const keywordsText = computed({
    get: () => editableBriefing.keywords.join(', '),
    set: (value: string) => {
      editableBriefing.keywords = value
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k)
    }
  })

  const cautionsText = computed({
    get: () => editableBriefing.cautions.join('\n'),
    set: (value: string) => {
      editableBriefing.cautions = value.split('\n').filter((c) => c.trim())
    }
  })

  onMounted(() => {
    // Load existing requirements if available
    loadExistingRequirements()
  })

  const loadExistingRequirements = () => {
    // TODO: Load from API or store
    // For now, load mock data if it exists
    const mockRequirements = localStorage.getItem(`project_${projectId}_requirements`)
    if (mockRequirements) {
      const data = JSON.parse(mockRequirements)
      Object.assign(requirementsForm, data.requirements)
      if (data.aiBriefing) {
        Object.assign(aiBriefing, data.aiBriefing)
        aiBriefingGenerated.value = true
      }
    }
  }

  const addKeyPoint = () => {
    const point = currentKeyPoint.value.trim()
    if (point && !requirementsForm.keyPoints.includes(point)) {
      requirementsForm.keyPoints.push(point)
      currentKeyPoint.value = ''
    }
  }

  const removeKeyPoint = (index: number) => {
    requirementsForm.keyPoints.splice(index, 1)
  }

  const selectFromMaterialLibrary = () => {
    // TODO: Open material library selector
    ElMessage.info('素材库选择功能开发中')
  }

  const aiSearchMaterials = async () => {
    aiSearching.value = true
    try {
      // Simulate AI search
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock AI search results
      const mockMaterials = [
        {
          id: '1',
          title: '2024年AI技术发展趋势',
          content:
            '人工智能技术在过去一年中取得了显著进展，特别是在大语言模型、计算机视觉和机器学习等领域...',
          type: 'article'
        },
        {
          id: '2',
          title: '人工智能应用场景分析',
          content:
            'AI技术已经广泛应用于金融、医疗、教育、制造等多个行业，为这些领域带来了革命性的变化...',
          type: 'analysis'
        }
      ]

      selectedMaterials.value = mockMaterials
      ElMessage.success('AI检索完成，找到相关素材')
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

  const generateAIBriefing = async () => {
    if (!requirementsFormRef.value) return

    try {
      await requirementsFormRef.value.validate()
      generatingBriefing.value = true

      // Simulate AI generation
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Generate mock AI briefing based on form data
      const briefing: AIBriefing = {
        overview: `基于您提供的需求，我们将创作一篇关于"${requirementsForm.topic}"的${getDocumentTypeText(requirementsForm.documentType)}。该文档将针对${getAudienceText(requirementsForm.targetAudience)}，采用${getToneText(requirementsForm.tone)}的语气风格，预期字数约${requirementsForm.wordCount}字。`,
        audienceAnalysis: `${getAudienceText(requirementsForm.targetAudience)}通常对${requirementsForm.topic}相关的信息有较高的关注度，他们期望获得${requirementsForm.keyPoints.length > 0 ? requirementsForm.keyPoints.join('、') : '核心信息'}等方面的深入分析。`,
        structureSuggestions: [
          '开篇引入：通过数据或案例引起读者兴趣',
          '背景介绍：提供必要的背景信息和现状分析',
          '核心内容：围绕关键要点展开详细论述',
          '实例说明：通过具体案例或数据支撑观点',
          '总结展望：总结核心观点并展望未来趋势'
        ],
        keywords: [
          requirementsForm.topic,
          ...requirementsForm.keyPoints.slice(0, 3),
          getDocumentTypeText(requirementsForm.documentType),
          getAudienceText(requirementsForm.targetAudience)
        ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
        cautions: [
          '避免过于技术化的术语，确保内容通俗易懂',
          '注意数据的时效性和准确性',
          '保持客观中立的立场，避免主观臆断',
          '确保逻辑清晰，层次分明'
        ]
      }

      if (requirementsForm.specialRequirements) {
        briefing.cautions.push(`特殊要求：${requirementsForm.specialRequirements}`)
      }

      Object.assign(aiBriefing, briefing)
      aiBriefingGenerated.value = true

      // Save to localStorage for persistence
      saveRequirements()

      ElMessage.success('AI简报生成成功！')
    } catch {
      // Form validation failed
      ElMessage.error('请完善表单信息')
    } finally {
      generatingBriefing.value = false
    }
  }

  const editBriefing = () => {
    Object.assign(editableBriefing, {
      overview: aiBriefing.overview,
      audienceAnalysis: aiBriefing.audienceAnalysis,
      structureSuggestions: aiBriefing.structureSuggestions,
      keywords: aiBriefing.keywords,
      cautions: aiBriefing.cautions
    })
    briefingDialogVisible.value = true
  }

  const saveBriefing = () => {
    Object.assign(aiBriefing, {
      overview: editableBriefing.overview,
      audienceAnalysis: editableBriefing.audienceAnalysis,
      structureSuggestions: editableBriefing.structureSuggestions,
      keywords: editableBriefing.keywords,
      cautions: editableBriefing.cautions
    })
    briefingDialogVisible.value = false
    saveRequirements()
    ElMessage.success('简报已更新')
  }

  const confirmRequirements = async () => {
    if (!aiBriefingGenerated.value) {
      ElMessage.warning('请先生成AI简报')
      return
    }

    try {
      // Save requirements
      saveRequirements()

      ElMessage.success('需求已确认，即将进入标题选择阶段')

      // Navigate to title selection
      setTimeout(() => {
        router.push(`/document-generation/title/${projectId}`)
      }, 1500)
    } catch {
      ElMessage.error('保存失败')
    }
  }

  const saveRequirements = () => {
    const data = {
      requirements: requirementsForm,
      aiBriefing: aiBriefing,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(`project_${projectId}_requirements`, JSON.stringify(data))
  }

  const goBack = () => {
    router.push('/document-generation/project-list')
  }

  // Helper functions
  const getDocumentTypeText = (type: string) => {
    const types = {
      analysis: '分析报告',
      press_release: '新闻稿',
      blog: '博客文章',
      technical_doc: '技术文档',
      marketing: '营销文案',
      product_description: '产品说明'
    }
    return types[type] || type
  }

  const getAudienceText = (audience: string) => {
    const audiences = {
      general: '普通大众',
      professional: '专业人士',
      executive: '企业决策者',
      technical: '技术人员',
      academic: '学术研究者',
      student: '学生群体'
    }
    return audiences[audience] || audience
  }

  const getToneText = (tone: string) => {
    const tones = {
      formal: '正式',
      casual: '轻松',
      professional: '专业',
      friendly: '友好',
      persuasive: '说服性',
      objective: '客观'
    }
    return tones[tone] || tone
  }
</script>

<style scoped lang="scss">
  .requirements-container {
    max-width: 1200px;
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
  }

  .step-connector {
    width: 60px;
    height: 2px;
    margin: 0 20px;
    margin-top: -20px;
    background: var(--el-border-color);
  }

  .requirements-form {
    padding: 30px;
    margin-bottom: 20px;
    background: var(--el-bg-color);
    border-radius: 8px;
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

  .reference-section {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }

  .selected-materials {
    padding: 10px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
  }

  .material-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid var(--el-border-color);

    &:last-child {
      border-bottom: none;
    }

    .material-info {
      flex: 1;

      h4 {
        margin: 0 0 8px;
        font-size: 14px;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 0;
        font-size: 12px;
        line-height: 1.4;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .form-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 30px;
  }

  .ai-briefing-section {
    padding: 30px;
    background: var(--el-bg-color);
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

  .briefing-section {
    margin-bottom: 25px;

    &:last-child {
      margin-bottom: 0;
    }

    h4 {
      margin: 0 0 12px;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }

    p,
    li {
      margin: 0;
      line-height: 1.6;
      color: var(--el-text-color-regular);
    }

    ul {
      padding-left: 20px;
      margin: 0;
    }
  }

  .keyword-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  @media (width <= 768px) {
    .requirements-form {
      padding: 20px;
    }

    .step-indicator {
      padding: 15px;
    }

    .step-connector {
      width: 40px;
      margin: 0 10px;
    }

    .form-actions {
      flex-direction: column;
      align-items: center;
    }

    .reference-section {
      flex-direction: column;
    }

    .key-points-input {
      flex-direction: column;
    }
  }
</style>

<style lang="scss">
  // Global styles for ElSlider input
  .el-slider__input {
    width: 100px;
  }
</style>
