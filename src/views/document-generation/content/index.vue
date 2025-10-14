<template>
  <div class="content-container">
    <ArtTableHeader title="正文编辑" :actions="headerActions" @back="goBack" />

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
      <div class="step-item completed">
        <div class="step-number">✓</div>
        <div class="step-label">大纲</div>
      </div>
      <div class="step-connector completed"></div>
      <div class="step-item active">
        <div class="step-number">4</div>
        <div class="step-label">正文</div>
      </div>
    </div>

    <div class="content-editor">
      <div class="editor-header">
        <div class="document-info">
          <h2>{{ documentTitle }}</h2>
          <div class="document-meta">
            <span>字数: {{ wordCount }}</span>
            <span>预计阅读时间: {{ estimatedReadTime }} 分钟</span>
            <span>最后保存: {{ lastSaved }}</span>
          </div>
        </div>
        <div class="editor-actions">
          <el-button @click="generateAIContent" :loading="generatingContent" type="primary"
            >AI生成正文</el-button
          >
          <el-button @click="saveContent" type="success">保存内容</el-button>
          <el-button @click="previewContent" :disabled="!hasContent">预览</el-button>
          <el-button @click="exportContent" :disabled="!hasContent">导出</el-button>
        </div>
      </div>

      <div class="editor-layout">
        <div class="outline-panel">
          <div class="panel-header">
            <h3>文档大纲</h3>
            <el-button @click="toggleOutline" size="small" link>{{
              showOutline ? '隐藏' : '显示'
            }}</el-button>
          </div>

          <div v-if="showOutline" class="outline-content">
            <div
              v-for="(section, index) in documentOutline"
              :key="section.id"
              class="outline-item"
              :class="[
                { active: currentSection === index },
                `level-${section.level}`
              ]"
              :style="{ paddingLeft: `${(section.level - 1) * 12 + 12}px` }"
              @click="navigateToSection(index)"
            >
              <span class="outline-number">{{ index + 1 }}</span>
              <span class="outline-title">{{ section.title }}</span>
            </div>
          </div>
        </div>

        <div class="editor-panel">
          <div v-if="!hasContent" class="empty-editor">
            <div class="empty-icon">📝</div>
            <h3>开始创作您的文档</h3>
            <p>点击"AI生成正文"让AI帮您生成内容，或手动开始写作</p>
            <div class="empty-actions">
              <el-button @click="generateAIContent" type="primary" size="large"
                >AI生成正文</el-button
              >
            </div>
          </div>

          <div v-else class="rich-editor" ref="editorContainer">
            <div v-if="isEditMode" class="editor-mode">
              <ArtWangEditor
                v-model="documentContent"
                :height="'600px'"
                placeholder="开始写作您的文档内容..."
                @change="onContentChange"
              />
              <div class="editor-toolbar">
                <el-button @click="saveAndPreview" type="success" size="small">保存并预览</el-button>
                <el-button @click="cancelEdit" size="small">取消</el-button>
              </div>
            </div>
            <div v-else class="preview-mode">
              <div class="editor-content" ref="editorContent">
                <div v-html="documentContent" class="content-display"></div>
              </div>
              <div class="editor-toolbar">
                <el-button @click="enterEditMode" type="primary" size="small">
                  <el-icon style="margin-right: 4px"><Edit /></el-icon>
                  编辑正文
                </el-button>
                <el-button @click="saveContent" type="success" size="small">保存</el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="ai-assistant-panel">
          <div class="panel-header">
            <h3>AI助手</h3>
            <el-button @click="toggleAIAssistant" size="small" link>{{
              showAIAssistant ? '隐藏' : '显示'
            }}</el-button>
          </div>

          <div v-if="showAIAssistant" class="ai-assistant-content">
            <div class="ai-suggestions">
              <h4>AI建议</h4>
              <div v-if="aiSuggestions.length > 0" class="suggestion-list">
                <div
                  v-for="(suggestion, index) in aiSuggestions"
                  :key="index"
                  class="suggestion-item"
                >
                  <p>{{ suggestion.text }}</p>
                  <div class="suggestion-actions">
                    <el-button
                      @click="applySuggestion(suggestion)"
                      size="small"
                      type="primary"
                      plain
                      >应用</el-button
                    >
                    <el-button @click="ignoreSuggestion(index)" size="small" plain>忽略</el-button>
                  </div>
                </div>
              </div>
              <div v-else class="no-suggestions">
                <p>暂无建议</p>
              </div>
            </div>

            <div class="ai-chat">
              <h4>AI对话</h4>
              <div class="chat-messages" ref="chatMessages">
                <div
                  v-for="(message, index) in chatMessages"
                  :key="index"
                  class="chat-message"
                  :class="message.type"
                >
                  <div class="message-content">{{ message.content }}</div>
                  <div class="message-time">{{ message.time }}</div>
                </div>
              </div>
              <div class="chat-input">
                <el-input
                  v-model="chatInput"
                  type="textarea"
                  :rows="3"
                  placeholder="向AI助手提问..."
                  @keyup.enter="sendMessage"
                />
                <el-button @click="sendMessage" :loading="chatLoading" type="primary"
                  >发送</el-button
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-actions">
      <el-button @click="goBack" size="large">返回大纲</el-button>
      <el-button type="success" size="large" @click="completeDocument" :disabled="!hasContent">
        完成文档
      </el-button>
    </div>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="文档预览" width="80%" top="5vh">
      <div class="preview-content" v-html="previewHtml"></div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="previewDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="exportContent">导出</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 素材抽屉组件 -->
    <MaterialDrawer
      v-model:selected-materials="selectedMaterials"
      @material-selected="handleMaterialSelected"
      @material-dragged="handleMaterialDragged"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { Edit } from '@element-plus/icons-vue'
  import { syncProjectToList } from '@/utils/project/projectSync'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'
  import MaterialDrawer from '@/components/custom/material-drawer/MaterialDrawer.vue'
  import type { Material } from '@/types/material'

  interface AISuggestion {
    id: string
    text: string
    type: 'content' | 'structure' | 'style'
  }

  interface ChatMessage {
    id: string
    type: 'user' | 'ai'
    content: string
    time: string
  }

  interface DocumentSection {
    id: string
    title: string
    level: number
  }

  const router = useRouter()
  const route = useRoute()

  const projectId = route.params.projectId as string

  const documentTitle = ref('')
  const documentContent = ref('')
  const documentContentBackup = ref('') // 编辑时的备份
  const documentOutline = ref<DocumentSection[]>([])
  const currentSection = ref(0)
  const showOutline = ref(true)
  const showAIAssistant = ref(true)
  const generatingContent = ref(false)
  const isEditMode = ref(false)

  // 素材相关
  const selectedMaterials = ref<Material[]>([])
  const chatLoading = ref(false)
  const previewDialogVisible = ref(false)
  const chatInput = ref('')
  const chatMessages = ref<ChatMessage[]>([])
  const aiSuggestions = ref<AISuggestion[]>([])

  onMounted(() => {
    loadExistingData()
    loadAIContent()
  })

  const wordCount = computed(() => {
    return documentContent.value.replace(/<[^>]*>/g, '').length
  })

  const estimatedReadTime = computed(() => {
    return Math.ceil(wordCount.value / 500) // 500 words per minute
  })

  const lastSaved = computed(() => {
    const saved = localStorage.getItem(`project_${projectId}_content_saved`)
    return saved ? new Date(saved).toLocaleString('zh-CN') : '未保存'
  })

  const hasContent = computed(() => {
    return documentContent.value.trim().length > 0
  })

  const previewHtml = computed(() => {
    return documentContent.value
  })

  const headerActions = computed(() => {
    return [
      {
        label: '导出',
        type: 'primary',
        icon: 'el-icon-download',
        handler: exportContent
      }
    ]
  })

  const loadExistingData = () => {
    // Load title
    const titlesData = localStorage.getItem(`project_${projectId}_titles`)
    if (titlesData) {
      const { selectedTitle } = JSON.parse(titlesData)
      documentTitle.value = selectedTitle.text
    }

    // Load outline - 支持新的树形结构
    const outlineData = localStorage.getItem(`project_${projectId}_outline`)
    if (outlineData) {
      const outline = JSON.parse(outlineData)
      
      // 将树形结构扁平化为列表用于大纲导航
      const flattenOutline = (nodes: any[], result: DocumentSection[] = []): DocumentSection[] => {
        nodes.forEach(node => {
          result.push({
            id: node.id,
            title: node.title,
            level: node.level
          })
          if (node.children && node.children.length > 0) {
            flattenOutline(node.children, result)
          }
        })
        return result
      }
      
      documentOutline.value = flattenOutline(outline)
    }

    // Load existing content
    const contentData = localStorage.getItem(`project_${projectId}_content`)
    if (contentData) {
      documentContent.value = contentData
    }
  }

  const loadAIContent = () => {
    // Generate some initial AI suggestions
    if (hasContent.value) {
      generateAISuggestions()
    }
  }

  const generateAIContent = async () => {
    generatingContent.value = true
    try {
      // Simulate AI content generation
      await new Promise((resolve) => setTimeout(resolve, 4000))

      // Generate mock content based on outline and title - 添加id属性用于跳转
      const mockContent = `
      <h1>${documentTitle.value}</h1>
      
      <p><strong>摘要：</strong>本文深入分析了人工智能技术的最新发展趋势，探讨了其在各行业中的应用实践，并对未来发展进行了展望。通过系统性的研究和分析，为相关领域的从业者和决策者提供有价值的参考。</p>
      
      <h2 id="section-0">1. 引言</h2>
      <p>人工智能技术作为21世纪最具革命性的技术之一，正在深刻改变着我们的生活和工作方式。随着计算能力的提升、数据量的爆炸式增长以及算法的不断优化，AI技术在各个领域都取得了突破性进展。</p>
      
      <p>本研究旨在全面分析2024年人工智能技术的发展现状，探讨其在不同行业中的应用实践，并预测未来的发展趋势，为相关企业和决策者提供战略参考。</p>
      
      <h2 id="section-1">2. 相关技术概述</h2>
      
      <h3 id="section-2">2.1 人工智能技术基础</h3>
      <p>人工智能技术的核心包括机器学习、深度学习、自然语言处理、计算机视觉等多个分支。机器学习通过算法让计算机从数据中学习规律，深度学习则利用神经网络模拟人脑的工作方式。</p>
      
      <p>近年来，大语言模型（LLM）的发展尤为引人注目。GPT、BERT等模型的出现，标志着自然语言处理技术进入了新的发展阶段。这些模型不仅能够理解和生成人类语言，还能执行各种复杂的认知任务。</p>
      
      <h3 id="section-3">2.2 行业发展现状</h3>
      <p>当前，AI技术已经广泛应用于金融、医疗、教育、制造、交通等多个行业。在金融行业，AI被用于风险评估、欺诈检测、算法交易等；在医疗领域，AI辅助诊断、药物研发、个性化治疗等应用日益成熟。</p>
      
      <h2 id="section-4">3. 应用案例分析</h2>
      
      <h3 id="section-5">3.1 金融行业应用</h3>
      <p>在金融行业，人工智能技术的应用已经相当成熟。机器学习算法被广泛用于信用风险评估，通过分析大量的历史数据，能够更准确地预测借款人的违约风险。</p>
      
      <p>此外，AI在算法交易中的应用也日益普及。高频交易系统利用AI算法分析市场数据，在毫秒级别做出交易决策，大大提高了交易效率和收益率。</p>
      
      <h3 id="section-6">3.2 医疗健康应用</h3>
      <p>医疗健康是AI应用最具潜力的领域之一。在医学影像诊断方面，AI系统已经能够达到甚至超越人类医生的诊断准确率。例如，在皮肤癌检测、眼底疾病诊断等方面，AI系统表现出了优异的性能。</p>
      
      <p>药物研发是另一个重要的应用领域。传统的药物研发周期长、成本高，而AI技术能够通过分析大量的分子数据，快速筛选出有潜力的药物候选物，大大缩短研发周期。</p>
      
      <h2 id="section-7">4. 挑战与机遇</h2>
      
      <h3 id="section-8">4.1 技术挑战</h3>
      <p>尽管AI技术取得了显著进展，但仍面临诸多挑战。首先，数据质量和数量直接影响AI模型的性能。许多应用场景缺乏高质量的训练数据，这限制了AI技术的应用效果。</p>
      
      <p>其次，AI模型的可解释性仍然是一个重要问题。许多深度学习模型被视为"黑盒"，其决策过程难以解释，这在某些关键应用领域（如医疗、金融）构成了障碍。</p>
      
      <h3 id="section-9">4.2 伦理考量</h3>
      <p>随着AI技术的广泛应用，伦理问题日益凸显。隐私保护是其中最重要的议题之一。AI系统通常需要大量的个人数据来进行训练和优化，如何在保护用户隐私的前提下充分利用数据，是一个需要仔细权衡的问题。</p>
      
      <p>算法偏见也是一个严重的伦理问题。如果训练数据存在偏见，AI系统可能会放大这些偏见，导致不公平的决策结果。因此，确保AI系统的公平性和无偏见性至关重要。</p>
      
      <h2 id="section-10">5. 结论与展望</h2>
      
      <p>通过对人工智能技术发展现状和应用实践的深入分析，我们可以看到AI技术正在以前所未有的速度发展，并在各个行业中发挥着越来越重要的作用。</p>
      
      <p>展望未来，AI技术将继续快速发展，我们有理由相信，随着技术的不断进步和应用场景的不断扩展，人工智能将为人类社会带来更多的便利和价值。同时，我们也需要正视技术发展中的挑战，通过技术创新和制度完善，确保AI技术能够健康、可持续地发展。</p>
      
      <p>企业和决策者应该积极拥抱AI技术，同时也要理性看待其局限性，在充分发挥AI技术优势的同时，注意防范潜在的风险，实现技术与社会的和谐发展。</p>
    `

      documentContent.value = mockContent
      saveContent()
      generateAISuggestions()

      ElMessage.success('AI正文生成成功！')
    } catch {
      ElMessage.error('正文生成失败')
    } finally {
      generatingContent.value = false
    }
  }

  const onContentChange = () => {
    saveContent()
    generateAISuggestions()
  }

  const saveContent = () => {
    localStorage.setItem(`project_${projectId}_content`, documentContent.value)
    localStorage.setItem(`project_${projectId}_content_saved`, new Date().toISOString())
    
    // 同步项目状态到列表
    syncProjectToList(projectId)
  }

  const generateAISuggestions = () => {
    // Generate mock AI suggestions based on content
    const suggestions: AISuggestion[] = [
      {
        id: '1',
        text: '建议在引言部分增加更多最新的统计数据来支撑论点',
        type: 'content'
      },
      {
        id: '2',
        text: '考虑在"应用案例分析"部分添加具体的成功案例分析',
        type: 'structure'
      },
      {
        id: '3',
        text: '可以使用更多的图表和数据可视化来增强说服力',
        type: 'style'
      }
    ]

    aiSuggestions.value = suggestions
  }

  const applySuggestion = (suggestion: AISuggestion) => {
    // Apply the suggestion (mock implementation)
    ElMessage.success(`已应用建议: ${suggestion.text}`)

    // Remove the suggestion after applying
    const index = aiSuggestions.value.findIndex((s) => s.id === suggestion.id)
    if (index > -1) {
      aiSuggestions.value.splice(index, 1)
    }
  }

  const ignoreSuggestion = (index: number) => {
    aiSuggestions.value.splice(index, 1)
  }

  const sendMessage = async () => {
    if (!chatInput.value.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput.value,
      time: new Date().toLocaleTimeString('zh-CN')
    }

    chatMessages.value.push(userMessage)
    chatInput.value = ''
    chatLoading.value = true

    // Scroll to bottom
    await nextTick()
    scrollToBottom()

    try {
      // Simulate AI response
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content:
          '我理解您的问题。基于您的文档内容，我建议您考虑以下几点：1）确保内容的逻辑性和连贯性；2）使用具体的数据和案例来支撑观点；3）注意段落之间的过渡和衔接。',
        time: new Date().toLocaleTimeString('zh-CN')
      }

      chatMessages.value.push(aiMessage)

      await nextTick()
      scrollToBottom()
    } catch {
      ElMessage.error('AI响应失败')
    } finally {
      chatLoading.value = false
    }
  }

  const scrollToBottom = () => {
    const chatContainer = document.querySelector('.chat-messages')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }

  const toggleOutline = () => {
    showOutline.value = !showOutline.value
  }

  const toggleAIAssistant = () => {
    showAIAssistant.value = !showAIAssistant.value
  }

  const editorContent = ref<HTMLElement | null>(null)
  const editorContainer = ref<HTMLElement | null>(null)

  const navigateToSection = async (index: number) => {
    currentSection.value = index
    
    // 如果在编辑模式，先退出编辑模式
    if (isEditMode.value) {
      isEditMode.value = false
      await nextTick()
    }
    
    // 等待DOM更新后再滚动
    await nextTick()
    await nextTick() // 多等一帧确保DOM完全渲染
    
    // 使用id进行精确跳转
    const targetId = `section-${index}`
    const targetElement = document.getElementById(targetId)
    
    if (targetElement && editorContent.value) {
      const scrollContainer = editorContent.value
      
      // 计算目标位置 - 章节标题顶格显示
      const containerTop = scrollContainer.getBoundingClientRect().top
      const targetTop = targetElement.getBoundingClientRect().top
      const currentScrollTop = scrollContainer.scrollTop
      
      // 计算需要滚动的距离（章节顶格，预留10px间距）
      const scrollTo = currentScrollTop + (targetTop - containerTop) - 10
      
      // 平滑滚动
      scrollContainer.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      })
      
      console.log('跳转到章节:', index, targetId, '滚动距离:', scrollTo)
    } else {
      console.warn('未找到目标元素:', targetId)
    }
  }

  const enterEditMode = () => {
    documentContentBackup.value = documentContent.value
    isEditMode.value = true
  }

  const saveAndPreview = () => {
    saveContent()
    isEditMode.value = false
    ElMessage.success('保存成功，已切换到预览模式')
  }

  const cancelEdit = () => {
    documentContent.value = documentContentBackup.value
    isEditMode.value = false
    ElMessage.info('已取消编辑')
  }

  const previewContent = () => {
    previewDialogVisible.value = true
  }

  // 素材相关方法
  const handleMaterialSelected = (material: Material) => {
    console.log('素材已选择:', material)
  }

  const handleMaterialDragged = (event: DragEvent, material: Material) => {
    console.log('素材被拖拽:', material)
  }

  const exportContent = () => {
    // Export content as HTML or other format
    const blob = new Blob([documentContent.value], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentTitle.value}.html`
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('文档导出成功')
  }

  const completeDocument = () => {
    if (!hasContent.value) {
      ElMessage.warning('请先创建文档内容')
      return
    }

    // Mark project as completed
    const projectData = localStorage.getItem(`project_${projectId}`)
    if (projectData) {
      const project = JSON.parse(projectData)
      project.status = 'completed'
      project.updateTime = new Date().toISOString()
      localStorage.setItem(`project_${projectId}`, JSON.stringify(project))
    }

    ElMessage.success('文档创作完成！')

    // Navigate back to project list
    setTimeout(() => {
      router.push('/document-generation/project-list')
    }, 1500)
  }

  const goBack = () => {
    router.push(`/document-generation/outline/${projectId}`)
  }
</script>

<style scoped lang="scss">
  .content-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 120px);
    padding: 20px;
  }

  .step-indicator {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    padding: 15px;
    margin-bottom: 20px;
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

  .content-editor {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 20px;
    overflow: hidden;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .editor-header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 15px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color);
  }

  .document-info {
    flex: 1;

    h2 {
      margin: 0 0 8px;
      font-size: 24px;
      color: var(--el-text-color-primary);
    }

    .document-meta {
      display: flex;
      gap: 20px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .editor-actions {
    display: flex;
    gap: 10px;
  }

  .editor-layout {
    display: grid;
    flex: 1;
    grid-template-columns: 250px 1fr 280px;
    gap: 20px;
    overflow: hidden;
  }

  .outline-panel,
  .ai-assistant-panel {
    display: flex;
    flex-direction: column;
    padding: 15px;
    overflow: hidden;
    background: var(--el-fill-color-light);
    border-radius: 6px;
  }

  .panel-header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;

    h3 {
      margin: 0;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }
  }

  .outline-content {
    flex: 1;
    overflow-y: auto;
    
    /* 美化滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: var(--el-fill-color-lighter);
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-darker);
      border-radius: 3px;
      
      &:hover {
        background: var(--el-text-color-secondary);
      }
    }
  }

  .outline-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    margin-bottom: 6px;
    cursor: pointer;
    background: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.25s ease;

    &:hover {
      background: var(--el-color-primary-light-9);
      transform: translateX(2px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    &.active {
      background: var(--el-color-primary-light-9);
      border-left: 4px solid var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      
      .outline-number {
        color: var(--el-color-primary);
        font-weight: 700;
      }
      
      .outline-title {
        color: var(--el-color-primary);
        font-weight: 500;
      }
    }

    // 不同层级的样式
    &.level-1 {
      .outline-title {
        font-weight: 600;
        font-size: 14px;
      }
    }

    &.level-2 {
      .outline-title {
        font-size: 13px;
      }
      .outline-number {
        width: 20px;
        height: 20px;
        font-size: 11px;
      }
    }

    &.level-3,
    &.level-4,
    &.level-5 {
      .outline-title {
        font-size: 12px;
      }
      .outline-number {
        width: 18px;
        height: 18px;
        font-size: 10px;
      }
    }
  }

  .outline-number {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    margin-right: 10px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 50%;
  }

  .outline-title {
    flex: 1;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-regular);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .editor-panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }

  .empty-editor {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;

    .empty-icon {
      margin-bottom: 20px;
      font-size: 64px;
    }

    h3 {
      margin: 0 0 10px;
      font-size: 20px;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0 0 20px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .rich-editor {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
    background: white;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .editor-mode,
  .preview-mode {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }

  // 编辑器模式样式覆盖
  .editor-mode {
    :deep(.w-e-text-container),
    :deep([data-slate-editor]) {
      // 覆盖编辑器内的段落样式
      p {
        margin: 0 0 12px !important;
        line-height: 1.8 !important;
        text-align: justify !important;
        text-indent: 2em !important;
      }

      h1 {
        margin: 0 0 24px !important;
        padding-bottom: 12px !important;
        font-size: 32px !important;
        font-weight: 600 !important;
        border-bottom: 2px solid var(--el-border-color) !important;
      }

      h2 {
        margin: 32px 0 16px !important;
        font-size: 26px !important;
        font-weight: 600 !important;
      }

      h3 {
        margin: 24px 0 12px !important;
        font-size: 20px !important;
        font-weight: 600 !important;
      }

      h4 {
        margin: 20px 0 10px !important;
        font-size: 18px !important;
        font-weight: 600 !important;
      }

      ul, ol {
        margin: 12px 0 !important;
        padding-left: 2em !important;
        
        li {
          margin: 6px 0 !important;
          line-height: 1.8 !important;
        }
      }

      blockquote {
        margin: 16px 0 !important;
        padding: 12px 20px !important;
        background: var(--el-fill-color-lighter) !important;
        border-left: 4px solid var(--el-color-primary) !important;
        border-radius: 4px !important;
      }
    }
  }

  .editor-content {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
    cursor: text;
    
    /* 美化滚动条 */
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: var(--el-fill-color-lighter);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-darker);
      border-radius: 4px;
      
      &:hover {
        background: var(--el-text-color-secondary);
      }
    }
  }

  .content-display {
    max-width: 900px;
    margin: 0 auto;
    font-size: 16px;
    line-height: 1.8;
    color: var(--el-text-color-primary);
    
    /* 标题样式优化 */
    h1 {
      margin: 0 0 24px;
      padding-bottom: 12px;
      font-size: 32px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      border-bottom: 2px solid var(--el-border-color);
    }
    
    h2 {
      margin: 32px 0 16px;
      font-size: 26px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      scroll-margin-top: 20px; /* 为滚动定位留出空间 */
    }
    
    h3 {
      margin: 24px 0 12px;
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      scroll-margin-top: 20px;
    }
    
    h4 {
      margin: 20px 0 10px;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
    
    /* 段落样式优化 - 更紧凑 */
    p {
      margin: 0 0 12px;
      line-height: 1.8;
      text-align: justify;
      color: var(--el-text-color-regular);
      
      /* 首行缩进 */
      text-indent: 2em;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    /* 强调文本 */
    strong {
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
    
    /* 列表样式 */
    ul, ol {
      margin: 12px 0;
      padding-left: 2em;
      
      li {
        margin: 6px 0;
        line-height: 1.8;
      }
    }
    
    /* 引用块 */
    blockquote {
      margin: 16px 0;
      padding: 12px 20px;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color-lighter);
      border-left: 4px solid var(--el-color-primary);
      border-radius: 4px;
    }
    
    /* 代码块 */
    code {
      padding: 2px 6px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      background: var(--el-fill-color-light);
      border-radius: 3px;
    }
    
    pre {
      margin: 16px 0;
      padding: 16px;
      overflow-x: auto;
      background: var(--el-fill-color-darker);
      border-radius: 6px;
      
      code {
        padding: 0;
        background: none;
      }
    }
  }

  .editor-toolbar {
    display: flex;
    flex-shrink: 0;
    gap: 10px;
    align-items: center;
    padding: 12px 20px;
    background: var(--el-fill-color-lighter);
    border-top: 1px solid var(--el-border-color);
  }

  .ai-assistant-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }

  .ai-suggestions {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 10px;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
  }

  .suggestion-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .suggestion-item {
    padding: 10px;
    margin-bottom: 8px;
    background: white;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    p {
      margin: 0 0 8px;
      font-size: 13px;
      line-height: 1.4;
      color: var(--el-text-color-regular);
    }
  }

  .suggestion-actions {
    display: flex;
    gap: 5px;
    justify-content: flex-end;
  }

  .no-suggestions {
    padding: 20px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    text-align: center;
  }

  .ai-chat {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;

    h4 {
      margin: 0 0 10px;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
  }

  .chat-messages {
    flex: 1;
    padding: 10px;
    margin-bottom: 10px;
    overflow-y: auto;
    background: white;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
  }

  .chat-message {
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }

    &.user {
      text-align: right;

      .message-content {
        margin-left: 40px;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
    }

    &.ai {
      text-align: left;

      .message-content {
        margin-right: 40px;
        color: var(--el-text-color-regular);
        background: var(--el-fill-color-light);
      }
    }
  }

  .message-content {
    display: inline-block;
    padding: 8px 12px;
    margin-bottom: 4px;
    font-size: 13px;
    line-height: 1.4;
    text-align: left;
    border-radius: 12px;
  }

  .message-time {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  .chat-input {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .content-actions {
    display: flex;
    flex-shrink: 0;
    gap: 20px;
    justify-content: center;
    margin-top: 20px;
  }

  .preview-content {
    max-height: 70vh;
    padding: 20px;
    overflow-y: auto;
    line-height: 1.6;

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: 20px;
      margin-bottom: 10px;
      color: var(--el-text-color-primary);
    }

    p {
      margin-bottom: 15px;
      color: var(--el-text-color-regular);
    }

    ul,
    ol {
      padding-left: 20px;
      margin-bottom: 15px;
    }

    li {
      margin-bottom: 5px;
    }
  }

  @media (width <= 1200px) {
    .editor-layout {
      grid-template-columns: 200px 1fr 250px;
    }
  }

  @media (width <= 768px) {
    .content-container {
      height: auto;
      padding: 15px;
    }

    .editor-layout {
      grid-template-columns: 1fr;
      gap: 15px;
    }

    .outline-panel,
    .ai-assistant-panel {
      order: 2;
    }

    .editor-panel {
      order: 1;
      min-height: 400px;
    }

    .editor-header {
      flex-direction: column;
      gap: 15px;
      align-items: flex-start;
    }

    .editor-actions {
      flex-wrap: wrap;
    }

    .document-meta {
      flex-direction: column;
      gap: 5px;
    }

    .step-indicator {
      padding: 15px;
    }

    .step-connector {
      width: 40px;
      margin: 0 10px;
    }

    .content-actions {
      flex-direction: column;
      align-items: center;
    }
  }
</style>
