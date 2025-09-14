<template>
  <div class="outline-container">
    <ArtTableHeader title="大纲编辑" :actions="headerActions" @back="goBack" />

    <div class="step-indicator">
      <div class="step-item completed">
        <div class="step-number">✓</div>
        <div class="step-label">需求</div>
      </div>
      <div class="step-connector completed"></div>
      <div class="step-item completed">
        <div class="step-number">✓</div>
        <div class="step-label">标题</div>
      </div>
      <div class="step-connector completed"></div>
      <div class="step-item active">
        <div class="step-number">3</div>
        <div class="step-label">大纲</div>
      </div>
      <div class="step-connector"></div>
      <div class="step-item">
        <div class="step-number">4</div>
        <div class="step-label">正文</div>
      </div>
    </div>

    <div class="outline-content">
      <div class="outline-header">
        <div class="selected-title">
          <h3>{{ selectedTitle }}</h3>
          <p class="title-description">{{ titleDescription }}</p>
        </div>
        <div class="outline-actions">
          <el-button @click="generateAIOutline" :loading="generatingOutline" type="primary"
            >AI生成大纲</el-button
          >
          <el-button @click="addSection" :disabled="!canAddSection">添加章节</el-button>
          <el-button @click="clearOutline" :disabled="outline.length === 0" type="danger" plain
            >清空大纲</el-button
          >
        </div>
      </div>

      <div class="outline-editor">
        <div v-if="outline.length === 0" class="empty-outline">
          <div class="empty-icon">📝</div>
          <h4>大纲为空</h4>
          <p>点击"AI生成大纲"让AI为您创建内容大纲，或手动添加章节</p>
        </div>

        <div v-else class="outline-tree">
          <div v-for="(section, sectionIndex) in outline" :key="section.id" class="outline-section">
            <div class="section-header">
              <div class="section-info"
                ><span class="section-number">{{ sectionIndex + 1 }}</span>
                <input
                  v-model="section.title"
                  class="section-title-input"
                  placeholder="章节标题"
                  @blur="saveOutline"
                />
              </div>
              <div class="section-controls">
                <el-button @click="addSubsection(sectionIndex)" size="small" link
                  >添加子节</el-button
                >
                <el-button
                  @click="moveSectionUp(sectionIndex)"
                  size="small"
                  link
                  :disabled="sectionIndex === 0"
                  >上移</el-button
                >
                <el-button
                  @click="moveSectionDown(sectionIndex)"
                  size="small"
                  link
                  :disabled="sectionIndex === outline.length - 1"
                  >下移</el-button
                >
                <el-button @click="deleteSection(sectionIndex)" size="small" type="danger" link
                  >删除</el-button
                >
              </div>
            </div>

            <div v-if="section.subsections.length > 0" class="subsections">
              <div
                v-for="(subsection, subIndex) in section.subsections"
                :key="subsection.id"
                class="outline-subsection"
              >
                <div class="subsection-header"
                  ><span class="subsection-number">{{ sectionIndex + 1 }}.{{ subIndex + 1 }}</span>
                  <input
                    v-model="subsection.title"
                    class="subsection-title-input"
                    placeholder="子节标题"
                    @blur="saveOutline"
                  />
                  <div class="subsection-controls"
                    ><el-button
                      @click="moveSubsectionUp(sectionIndex, subIndex)"
                      size="small"
                      link
                      :disabled="subIndex === 0"
                      >上移</el-button
                    ><el-button
                      @click="moveSubsectionDown(sectionIndex, subIndex)"
                      size="small"
                      link
                      :disabled="subIndex === section.subsections.length - 1"
                      >下移</el-button
                    ><el-button
                      @click="deleteSubsection(sectionIndex, subIndex)"
                      size="small"
                      type="danger"
                      link
                      >删除</el-button
                    >
                  </div>
                </div>

                <div class="subsection-content">
                  <textarea
                    v-model="subsection.content"
                    class="subsection-content-textarea"
                    placeholder="子节内容要点（可选）"
                    @blur="saveOutline"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="outline-actions-bottom">
        <el-button @click="goBack" size="large">返回标题</el-button>
        <el-button
          type="success"
          size="large"
          @click="confirmOutline"
          :disabled="outline.length === 0"
        >
          确认大纲并继续
        </el-button>
      </div>
    </div>

    <!-- 素材抽屉组件 -->
    <MaterialDrawer
      v-model:selected-materials="selectedMaterials"
      @material-selected="handleMaterialSelected"
      @material-dragged="handleMaterialDragged"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import MaterialDrawer from '@/components/custom/material-drawer/MaterialDrawer.vue'
  import type { Material } from '@/types/material'

  interface OutlineSubsection {
    id: string
    title: string
    content: string
  }

  interface OutlineSection {
    id: string
    title: string
    subsections: OutlineSubsection[]
  }

  const router = useRouter()
  const route = useRoute()

  const projectId = route.params.projectId as string

  const selectedTitle = ref('')
  const titleDescription = ref('')
  const outline = ref<OutlineSection[]>([])
  const generatingOutline = ref(false)

  // 素材相关
  const selectedMaterials = ref<Material[]>([])

  onMounted(() => {
    loadExistingData()
  })

  const loadExistingData = () => {
    // Load selected title
    const titlesData = localStorage.getItem(`project_${projectId}_titles`)
    if (titlesData) {
      const { selectedTitle: title } = JSON.parse(titlesData)
      selectedTitle.value = title.text
      titleDescription.value = title.description
    }

    // Load existing outline
    const outlineData = localStorage.getItem(`project_${projectId}_outline`)
    if (outlineData) {
      outline.value = JSON.parse(outlineData)
    }
  }

  const canAddSection = computed(() => {
    return outline.value.length < 10 // Limit to 10 sections
  })

  const generateAIOutline = async () => {
    generatingOutline.value = true
    try {
      // Simulate AI outline generation
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Generate mock outline based on title and requirements
      const mockOutline: OutlineSection[] = [
        {
          id: '1',
          title: '引言',
          subsections: [
            {
              id: '1-1',
              title: '研究背景',
              content: '介绍人工智能技术的发展历程和当前状况'
            },
            {
              id: '1-2',
              title: '研究意义',
              content: '阐述本研究对行业发展的重要性和实际价值'
            },
            {
              id: '1-3',
              title: '研究目标',
              content: '明确本文的研究目标和预期成果'
            }
          ]
        },
        {
          id: '2',
          title: '相关技术概述',
          subsections: [
            {
              id: '2-1',
              title: '人工智能技术基础',
              content: '介绍机器学习、深度学习等核心技术'
            },
            {
              id: '2-2',
              title: '行业发展现状',
              content: '分析当前AI技术在各行业的应用情况'
            },
            {
              id: '2-3',
              title: '技术发展趋势',
              content: '探讨AI技术的未来发展方向和趋势'
            }
          ]
        },
        {
          id: '3',
          title: '应用案例分析',
          subsections: [
            {
              id: '3-1',
              title: '金融行业应用',
              content: '分析AI在风控、客服、投资等方面的应用'
            },
            {
              id: '3-2',
              title: '医疗健康应用',
              content: '探讨AI在诊断、治疗、药物研发中的作用'
            },
            {
              id: '3-3',
              title: '制造业应用',
              content: '研究AI在生产优化、质量控制等方面的应用'
            }
          ]
        },
        {
          id: '4',
          title: '挑战与机遇',
          subsections: [
            {
              id: '4-1',
              title: '技术挑战',
              content: '分析当前AI技术面临的主要技术难题'
            },
            {
              id: '4-2',
              title: '伦理考量',
              content: '探讨AI应用中的伦理问题和解决方案'
            },
            {
              id: '4-3',
              title: '发展机遇',
              content: '分析AI技术发展带来的新机遇和前景'
            }
          ]
        },
        {
          id: '5',
          title: '结论与展望',
          subsections: [
            {
              id: '5-1',
              title: '主要结论',
              content: '总结研究的主要发现和结论'
            },
            {
              id: '5-2',
              title: '未来展望',
              content: '对AI技术未来发展的展望和建议'
            },
            {
              id: '5-3',
              title: '研究局限',
              content: '说明本研究的局限性和改进方向'
            }
          ]
        }
      ]

      outline.value = mockOutline
      saveOutline()

      ElMessage.success('AI大纲生成成功！')
    } catch {
      ElMessage.error('大纲生成失败')
    } finally {
      generatingOutline.value = false
    }
  }

  const addSection = () => {
    const newSection: OutlineSection = {
      id: Date.now().toString(),
      title: '',
      subsections: []
    }
    outline.value.push(newSection)
    saveOutline()
  }

  const addSubsection = (sectionIndex: number) => {
    const newSubsection: OutlineSubsection = {
      id: Date.now().toString(),
      title: '',
      content: ''
    }
    outline.value[sectionIndex].subsections.push(newSubsection)
    saveOutline()
  }

  const deleteSection = (sectionIndex: number) => {
    outline.value.splice(sectionIndex, 1)
    saveOutline()
  }

  const deleteSubsection = (sectionIndex: number, subIndex: number) => {
    outline.value[sectionIndex].subsections.splice(subIndex, 1)
    saveOutline()
  }

  const moveSectionUp = (sectionIndex: number) => {
    if (sectionIndex > 0) {
      const temp = outline.value[sectionIndex]
      outline.value[sectionIndex] = outline.value[sectionIndex - 1]
      outline.value[sectionIndex - 1] = temp
      saveOutline()
    }
  }

  const moveSectionDown = (sectionIndex: number) => {
    if (sectionIndex < outline.value.length - 1) {
      const temp = outline.value[sectionIndex]
      outline.value[sectionIndex] = outline.value[sectionIndex + 1]
      outline.value[sectionIndex + 1] = temp
      saveOutline()
    }
  }

  const moveSubsectionUp = (sectionIndex: number, subIndex: number) => {
    const subsections = outline.value[sectionIndex].subsections
    if (subIndex > 0) {
      const temp = subsections[subIndex]
      subsections[subIndex] = subsections[subIndex - 1]
      subsections[subIndex - 1] = temp
      saveOutline()
    }
  }

  const moveSubsectionDown = (sectionIndex: number, subIndex: number) => {
    const subsections = outline.value[sectionIndex].subsections
    if (subIndex < subsections.length - 1) {
      const temp = subsections[subIndex]
      subsections[subIndex] = subsections[subIndex + 1]
      subsections[subIndex + 1] = temp
      saveOutline()
    }
  }

  const clearOutline = () => {
    outline.value = []
    saveOutline()
    ElMessage.success('大纲已清空')
  }

  const saveOutline = () => {
    localStorage.setItem(`project_${projectId}_outline`, JSON.stringify(outline.value))
  }

  // 素材相关方法
  const handleMaterialSelected = (material: Material) => {
    console.log('素材已选择:', material)
  }

  const handleMaterialDragged = (event: DragEvent, material: Material) => {
    console.log('素材被拖拽:', material)
  }

  const confirmOutline = () => {
    if (outline.value.length === 0) {
      ElMessage.warning('请创建大纲')
      return
    }

    ElMessage.success('大纲已确认，即将进入正文阶段')

    // Navigate to content
    setTimeout(() => {
      router.push(`/document-generation/content/${projectId}`)
    }, 1500)
  }

  const goBack = () => {
    router.push(`/document-generation/title/${projectId}`)
  }
</script>

<style scoped lang="scss">
  .outline-container {
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

  .outline-content {
    padding: 30px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .outline-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 20px;
    margin-bottom: 30px;
    border-bottom: 1px solid var(--el-border-color);
  }

  .selected-title {
    flex: 1;

    h3 {
      margin: 0 0 8px;
      font-size: 20px;
      color: var(--el-text-color-primary);
    }

    .title-description {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .outline-actions {
    display: flex;
    gap: 10px;
  }

  .empty-outline {
    padding: 60px 20px;
    text-align: center;

    .empty-icon {
      margin-bottom: 20px;
      font-size: 48px;
    }

    h4 {
      margin: 0 0 10px;
      font-size: 18px;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .outline-tree {
    margin-bottom: 30px;
  }

  .outline-section {
    padding: 15px;
    margin-bottom: 20px;
    background: var(--el-fill-color-light);
    border-radius: 6px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .section-info {
    display: flex;
    flex: 1;
    gap: 10px;
    align-items: center;
  }

  .section-number {
    min-width: 30px;
    font-weight: bold;
    color: var(--el-color-primary);
  }

  .section-title-input {
    flex: 1;
    padding: 8px 12px;
    font-size: 16px;
    font-weight: 500;
    background: white;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    &:focus {
      border-color: var(--el-color-primary);
      outline: none;
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }
  }

  .section-controls {
    display: flex;
    gap: 5px;
  }

  .subsections {
    padding-left: 20px;
    margin-left: 30px;
    border-left: 2px solid var(--el-border-color);
  }

  .outline-subsection {
    padding: 10px;
    margin-bottom: 15px;
    background: white;
    border-radius: 4px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .subsection-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .subsection-number {
    min-width: 40px;
    font-weight: bold;
    color: var(--el-text-color-secondary);
  }

  .subsection-title-input {
    flex: 1;
    padding: 6px 10px;
    margin: 0 10px;
    font-size: 14px;
    background: white;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    &:focus {
      border-color: var(--el-color-primary);
      outline: none;
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }
  }

  .subsection-controls {
    display: flex;
    gap: 5px;
  }

  .subsection-content {
    margin-left: 50px;
  }

  .subsection-content-textarea {
    width: 100%;
    min-height: 60px;
    padding: 8px 12px;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    &:focus {
      border-color: var(--el-color-primary);
      outline: none;
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }
  }

  .outline-actions-bottom {
    display: flex;
    gap: 15px;
    justify-content: center;
    padding-top: 20px;
    margin-top: 30px;
    border-top: 1px solid var(--el-border-color);
  }

  @media (width <= 768px) {
    .outline-container {
      padding: 15px;
    }

    .outline-content {
      padding: 20px;
    }

    .outline-header {
      flex-direction: column;
      gap: 20px;
    }

    .outline-actions {
      flex-wrap: wrap;
    }

    .section-header {
      flex-direction: column;
      gap: 10px;
      align-items: flex-start;
    }

    .section-controls {
      flex-wrap: wrap;
    }

    .subsection-header {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }

    .subsection-controls {
      flex-wrap: wrap;
    }

    .subsection-content {
      margin-left: 0;
    }

    .subsections {
      padding-left: 15px;
      margin-left: 15px;
    }

    .step-indicator {
      padding: 15px;
    }

    .step-connector {
      width: 40px;
      margin: 0 10px;
    }

    .outline-actions-bottom {
      flex-direction: column;
      align-items: center;
    }
  }
</style>
