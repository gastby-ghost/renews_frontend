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
          <el-button @click="generateAIOutline" :loading="generatingOutline" type="primary">
            AI生成大纲
          </el-button>
          <el-button @click="addSection" :disabled="!canAddSection"> 添加章节 </el-button>
          <el-button
            @click="clearOutline"
            :disabled="outlineGeneration.state.generatedOutline.length === 0"
            type="danger"
            plain
          >
            清空大纲
          </el-button>
        </div>
      </div>

      <div class="outline-editor">
        <div v-if="outlineGeneration.state.generatedOutline.length === 0" class="empty-outline">
          <div class="empty-icon">📝</div>
          <h4>大纲为空</h4>
          <p>点击"AI生成大纲"让AI为您创建内容大纲，或手动添加章节</p>
        </div>

        <div v-else class="outline-tree">
          <div
            v-for="(section, sectionIndex) in outlineGeneration.state.generatedOutline"
            :key="section.title"
            class="outline-section"
          >
            <div class="section-header">
              <div class="section-info">
                <span class="section-number">{{ sectionIndex + 1 }}</span>
                <input
                  v-model="section.title"
                  class="section-title-input"
                  placeholder="章节标题"
                  @blur="outlineGeneration.editSection(section.title, { title: section.title })"
                />
              </div>
              <div class="section-controls">
                <el-button
                  @click="moveSectionUp(sectionIndex)"
                  size="small"
                  link
                  :disabled="sectionIndex === 0"
                >
                  上移
                </el-button>
                <el-button
                  @click="moveSectionDown(sectionIndex)"
                  size="small"
                  link
                  :disabled="sectionIndex === outlineGeneration.state.generatedOutline.length - 1"
                >
                  下移
                </el-button>
                <el-button @click="deleteSection(sectionIndex)" size="small" type="danger" link>
                  删除
                </el-button>
              </div>
            </div>

            <div class="section-content">
              <div class="content-direction">
                <label>内容方向：</label>
                <textarea
                  v-model="section.content_direction"
                  class="content-direction-textarea"
                  placeholder="请输入内容方向和写作要点"
                  @blur="
                    outlineGeneration.editSection(section.title, {
                      content_direction: section.content_direction
                    })
                  "
                />
              </div>
              <div class="data-requirements">
                <label>数据需求：</label>
                <el-tag
                  v-for="req in section.data_requirements"
                  :key="req"
                  size="small"
                  effect="plain"
                >
                  {{ req }}
                </el-tag>
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
          :disabled="outlineGeneration.state.generatedOutline.length === 0"
        >
          确认大纲并继续
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { useOutlineGeneration } from '@/composables/useOutlineGeneration'
  import { useDocumentGenerateStore } from '@/store/documentGenerate'

  const router = useRouter()
  const route = useRoute()
  const outlineGeneration = useOutlineGeneration()
  const documentStore = useDocumentGenerateStore()

  const projectId = route.params.projectId as string
  const generatingOutline = ref(false)

  // 头部操作按钮
  const headerActions = computed(() => {
    return [
      {
        label: '导出',
        type: 'primary' as const,
        icon: 'el-icon-download',
        handler: () => {
          outlineGeneration.exportOutline('json')
        }
      }
    ]
  })

  onMounted(async () => {
    // 确保当前文档项目已设置
    if (!documentStore.currentDocument) {
      documentStore.setCurrentDocument(projectId)
    }

    await loadExistingData()
  })

  const loadExistingData = async () => {
    // 从localStorage加载标题数据
    const titlesData = localStorage.getItem(`project_${projectId}_titles`)
    if (titlesData) {
      const { selectedTitle: title } = JSON.parse(titlesData)
      if (title) {
        // 标题数据已存储到store，无需额外处理
      }
    }

    // 检查服务状态
    try {
      await outlineGeneration.getOutlineToolsStatus()
    } catch {
      ElMessage.warning('大纲生成服务状态检查失败，将使用模拟数据')
    }
  }

  const selectedTitle = computed(() => {
    return documentStore.currentDocument?.selectedTitle?.title || ''
  })

  const titleDescription = computed(() => {
    return documentStore.currentDocument?.selectedTitle?.angle || ''
  })

  const canAddSection = computed(() => {
    return outlineGeneration.state.generatedOutline.length < 10
  })

  const generateAIOutline = async () => {
    if (
      !documentStore.currentDocument?.selectedTitle ||
      !documentStore.currentDocument?.researchBrief
    ) {
      ElMessage.warning('请先选择标题并完善研究简报')
      return
    }

    generatingOutline.value = true
    try {
      const response = await outlineGeneration.generateOutline(
        documentStore.currentDocument.selectedTitle,
        documentStore.currentDocument.researchBrief,
        documentStore.currentDocument.searchResults
      )

      // 保存到store
      if (response) {
        documentStore.updateCurrentDocument({
          generatedOutline: response.outline
        })
      }

      ElMessage.success('AI大纲生成成功！')
    } catch {
      ElMessage.error('大纲生成失败')
    } finally {
      generatingOutline.value = false
    }
  }

  const addSection = () => {
    outlineGeneration.addSection()
  }

  const deleteSection = (index: number) => {
    const sections = outlineGeneration.state.generatedOutline
    if (index >= 0 && index < sections.length) {
      sections.splice(index, 1)
      ElMessage.success('章节已删除')
    }
  }

  const moveSectionUp = (index: number) => {
    const sections = outlineGeneration.state.generatedOutline
    if (index > 0) {
      const temp = sections[index]
      sections[index] = sections[index - 1]
      sections[index - 1] = temp
    }
  }

  const moveSectionDown = (index: number) => {
    const sections = outlineGeneration.state.generatedOutline
    if (index < sections.length - 1) {
      const temp = sections[index]
      sections[index] = sections[index + 1]
      sections[index + 1] = temp
    }
  }

  const clearOutline = () => {
    outlineGeneration.reset()
    ElMessage.success('大纲已清空')
  }

  const confirmOutline = () => {
    if (outlineGeneration.state.generatedOutline.length === 0) {
      ElMessage.warning('请创建大纲')
      return
    }

    // 验证大纲
    if (!outlineGeneration.validateOutline()) {
      return
    }

    // 保存到store
    documentStore.updateCurrentDocument({
      generatedOutline: outlineGeneration.state.generatedOutline
    })

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

  .section-content {
    padding: 15px;
    margin-top: 15px;
    background: var(--el-fill-color-blank);
    border-radius: 4px;
  }

  .content-direction {
    margin-bottom: 15px;

    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }

  .content-direction-textarea {
    width: 100%;
    min-height: 80px;
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

  .data-requirements {
    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .el-tag {
      margin-right: 8px;
      margin-bottom: 8px;
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
