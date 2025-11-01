<template>
  <div class="content-container">
    <ArtTableHeader title="正文编辑 (Markdown)" :actions="headerActions" @back="goBack" />

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
              <el-space wrap>
                <el-tag size="small" type="info">
                  <el-icon><Document /></el-icon>
                  字数: {{ stats.characters }}
                </el-tag>
                <el-tag size="small" type="success">
                  <el-icon><Clock /></el-icon>
                  阅读时间: {{ stats.readingTime }} 分钟
                </el-tag>
                <el-tag size="small" type="warning">
                  <el-icon><DocumentCopy /></el-icon>
                  段落: {{ stats.paragraphs }}
                </el-tag>
                <el-tag size="small" type="info">
                  <el-icon><Collection /></el-icon>
                  标题: {{ stats.headings }}
                </el-tag>
                <el-tag size="small" type="primary">
                  <el-icon><Link /></el-icon>
                  链接: {{ stats.links }}
                </el-tag>
                <el-tag size="small" type="danger">
                  <el-icon><Star /></el-icon>
                  图片: {{ stats.images }}
                </el-tag>
                <el-tag size="small" type="success">
                  <el-icon><DataAnalysis /></el-icon>
                  可读性: {{ stats.readabilityScore }}
                </el-tag>
              </el-space>
              <div class="last-saved">最后保存: {{ lastSaved }}</div>
            </div>
          </div>
          <div class="editor-actions">
            <el-button-group>
              <el-button @click="togglePreview" :type="showPreview ? 'primary' : 'default'">
                <el-icon><View /></el-icon>
                {{ showPreview ? '编辑' : '预览' }}
              </el-button>
              <el-button @click="generateAIContent" :loading="generatingContent" type="primary">
                <el-icon><MagicStick /></el-icon>
                AI生成
              </el-button>
            </el-button-group>
            <el-button @click="saveContent" type="success">
              <el-icon><Check /></el-icon>
              保存
            </el-button>
            <el-button @click="exportContent" :disabled="!hasContent">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </div>

        <div class="editor-layout">
          <div class="outline-panel">
            <div class="panel-header">
              <h3>
                <el-icon><List /></el-icon>
                文档大纲
              </h3>
              <el-button @click="toggleOutline" size="small" link>
                {{ showOutline ? '隐藏' : '显示' }}
              </el-button>
            </div>

            <div v-if="showOutline" class="outline-content">
              <div
                v-for="(section, index) in documentOutline"
                :key="section.id"
                class="outline-item"
                :class="{ active: currentSection === index }"
                @click="navigateToSection(index)"
                :style="{ paddingLeft: section.level * 20 + 'px' }"
              >
                <span class="outline-number">{{ index + 1 }}</span>
                <span class="outline-title">{{ section.title }}</span>
              </div>
            </div>
          </div>

          <div class="editor-panel">
            <div v-if="!hasContent && !showPreview" class="empty-editor">
              <div class="empty-icon">📝</div>
              <h3>开始创作您的 Markdown 文档</h3>
              <p>点击"AI生成"让AI帮您生成内容，或手动开始写作</p>
              <div class="empty-actions">
                <el-button @click="generateAIContent" type="primary" size="large">
                  AI生成正文
                </el-button>
              </div>
            </div>

            <div v-else class="markdown-container">
              <!-- Markdown 编辑器 -->
              <div v-show="!showPreview" class="markdown-editor" ref="editorContainer">
                <textarea
                  ref="markdownTextarea"
                  v-model="documentContent"
                  class="markdown-input"
                  placeholder="使用 Markdown 语法开始写作..."
                  @input="onContentChange"
                  @mouseup="handleTextSelection"
                  @keyup="handleTextSelection"
                ></textarea>

                <!-- 文本选择浮动工具栏 -->
                <div
                  v-if="showSelectionToolbar"
                  class="selection-toolbar"
                  :style="{
                    top: toolbarPosition.top + 'px',
                    left: toolbarPosition.left + 'px'
                  }"
                >
                  <el-button-group size="small">
                    <el-tooltip content="AI润色" placement="top">
                      <el-button @click="polishSelection">
                        <el-icon><Brush /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="扩写" placement="top">
                      <el-button @click="expandSelection">
                        <el-icon><Expand /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="总结" placement="top">
                      <el-button @click="summarizeSelection">
                        <el-icon><ZoomOut /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="翻译" placement="top">
                      <el-button @click="translateSelection">
                        <el-icon><RefreshRight /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="改写" placement="top">
                      <el-button @click="rewriteSelection">
                        <el-icon><Refresh /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </el-button-group>
                </div>
              </div>

              <!-- Markdown 预览 -->
              <div v-show="showPreview" class="markdown-preview" v-html="renderedContent"></div>
            </div>
          </div>

          <div class="stats-panel">
            <div class="panel-header">
              <h3>
                <el-icon><DataAnalysis /></el-icon>
                内容统计
              </h3>
              <el-button @click="toggleStats" size="small" link>
                {{ showStats ? '隐藏' : '显示' }}
              </el-button>
            </div>

            <div v-if="showStats" class="stats-content">
              <!-- 基础统计 -->
              <div class="stats-section">
                <h4>基础信息</h4>
                <div class="stat-item">
                  <span class="stat-label">总字符数</span>
                  <span class="stat-value">{{ stats.characters }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">字符数（无空格）</span>
                  <span class="stat-value">{{ stats.charactersNoSpaces }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">单词数</span>
                  <span class="stat-value">{{ stats.words }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">段落数</span>
                  <span class="stat-value">{{ stats.paragraphs }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">句子数</span>
                  <span class="stat-value">{{ stats.sentences }}</span>
                </div>
              </div>

              <!-- 结构统计 -->
              <div class="stats-section">
                <h4>文档结构</h4>
                <div class="stat-item">
                  <span class="stat-label">标题数量</span>
                  <span class="stat-value">{{ stats.headings }}</span>
                </div>
                <div class="stat-item" v-for="(count, level) in stats.headingsByLevel" :key="level">
                  <span class="stat-label">H{{ level }}</span>
                  <span class="stat-value">{{ count }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">链接数量</span>
                  <span class="stat-value">{{ stats.links }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">图片数量</span>
                  <span class="stat-value">{{ stats.images }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">代码块</span>
                  <span class="stat-value">{{ stats.codeBlocks }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">列表项</span>
                  <span class="stat-value">{{ stats.listItems }}</span>
                </div>
              </div>

              <!-- 可读性分析 -->
              <div class="stats-section">
                <h4>可读性分析</h4>
                <div class="stat-item">
                  <span class="stat-label">平均句子长度</span>
                  <span class="stat-value">{{ stats.avgSentenceLength }} 词</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">平均段落长度</span>
                  <span class="stat-value">{{ stats.avgParagraphLength }} 词</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">可读性分数</span>
                  <el-tag :type="getReadabilityTagType(stats.readabilityScore)" size="small">
                    {{ stats.readabilityScore }}
                  </el-tag>
                </div>
                <div class="readability-desc">
                  {{ getReadabilityDesc(stats.readabilityScore) }}
                </div>
              </div>

              <!-- AI 建议 -->
              <div class="stats-section">
                <h4>AI 建议</h4>
                <div v-if="aiSuggestions.length > 0" class="suggestion-list">
                  <div
                    v-for="(suggestion, index) in aiSuggestions"
                    :key="index"
                    class="suggestion-item"
                  >
                    <el-icon><InfoFilled /></el-icon>
                    <span>{{ suggestion }}</span>
                  </div>
                </div>
                <div v-else class="no-suggestions">
                  <el-icon><Check /></el-icon>
                  文档质量良好，暂无建议
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="content-actions">
        <el-button @click="goBack" size="large">
          <el-icon><ArrowLeft /></el-icon>
          返回大纲
        </el-button>
        <el-button type="success" size="large" @click="completeDocument" :disabled="!hasContent">
          <el-icon><Check /></el-icon>
          完成文档
        </el-button>
      </div>
    </div>

    <!-- AI 操作对话框 -->
    <el-dialog v-model="aiDialogVisible" :title="aiDialogTitle" width="600px">
      <div class="ai-dialog-content">
        <div v-if="aiLoading" class="ai-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>AI 正在处理中，请稍候...</p>
        </div>
        <div v-else>
          <div v-if="aiDialogType === 'polish'" class="ai-result">
            <h4>原始文本</h4>
            <div class="original-text">{{ selectedText }}</div>
            <h4>润色结果</h4>
            <div class="result-text" v-html="aiResult"></div>
          </div>
          <!-- 其他AI操作结果 -->
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="aiDialogVisible = false">取消</el-button>
          <el-button v-if="!aiLoading" type="primary" @click="applyAIResult">
            应用到文档
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import {
    Document,
    Clock,
    DocumentCopy,
    Collection,
    Link,
    Star,
    DataAnalysis,
    View,
    MagicStick,
    Check,
    Download,
    List,
    Brush,
    Expand,
    ZoomOut,
    RefreshRight,
    Refresh,
    InfoFilled,
    ArrowLeft,
    Loading
  } from '@element-plus/icons-vue'
  import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
  import { useProjectStore } from '@/store/modules/project'
  import MarkdownIt from 'markdown-it'

  interface DocumentSection {
    id: string
    title: string
    level: number
  }

  const router = useRouter()
  const route = useRoute()
  const documentStore = useDocumentGenerateStore()
  const projectStore = useProjectStore()

  const projectId = route.params.projectId as string

  // 项目加载状态
  const loadingProject = ref(false)

  const documentTitle = ref('')
  const documentContent = ref('')
  const documentOutline = ref<DocumentSection[]>([])
  const currentSection = ref(0)
  const showOutline = ref(true)
  const showStats = ref(true)
  const showPreview = ref(false)
  const generatingContent = ref(false)
  const aiDialogVisible = ref(false)
  const aiDialogTitle = ref('')
  const aiDialogType = ref('')
  const aiLoading = ref(false)
  const selectedText = ref('')
  const aiResult = ref('')

  // 文本选择工具栏
  const showSelectionToolbar = ref(false)
  const toolbarPosition = ref({ top: 0, left: 0 })

  // 编辑器引用
  const editorContainer = ref<HTMLElement>()
  const markdownTextarea = ref<HTMLTextAreaElement>()

  // Markdown 渲染器
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  })

  onMounted(async () => {
    documentStore.documentState.currentStep = 'content'
    documentStore.cleanupExpiredTasks()
    await loadProject()
    loadExistingData()
  })

  // 监听内容变化，动态生成大纲
  const generateOutlineFromContent = (content: string) => {
    const headings: DocumentSection[] = []
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const title = match[2].trim()
        const id = `heading-${index}`

        headings.push({
          id,
          title,
          level
        })
      }
    })

    documentOutline.value = headings
  }

  // 计算属性
  const lastSaved = computed(() => {
    const saved = localStorage.getItem(`project_${projectId}_content_saved`)
    return saved ? new Date(saved).toLocaleString('zh-CN') : '未保存'
  })

  const hasContent = computed(() => {
    return documentContent.value.trim().length > 0
  })

  const renderedContent = computed(() => {
    return md.render(documentContent.value)
  })

  const headerActions = computed(() => {
    return [
      {
        label: '导出',
        type: 'primary' as const,
        icon: 'el-icon-download',
        handler: exportContent
      }
    ]
  })

  // 内容统计
  const stats = computed(() => {
    const content = documentContent.value
    const characters = content.length
    const charactersNoSpaces = content.replace(/\s/g, '').length
    const words = content
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
    const sentences = content.split(/[。！？.!?]/).filter((s) => s.trim().length > 0).length

    // 统计标题
    const headings = (content.match(/^#{1,6}\s+.+$/gm) || []).length
    const headingsByLevel: Record<number, number> = {}
    for (let i = 1; i <= 6; i++) {
      const pattern = new RegExp(`^#{${i}}\\s+.+$`, 'gm')
      headingsByLevel[i] = (content.match(pattern) || []).length
    }

    // 统计链接和图片
    const links = (content.match(/\[[^\]]+\]\([^)]+\)/g) || []).length
    const images = (content.match(/!\[.*?\]\([^)]+\)/g) || []).length

    // 统计代码块和列表
    const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length
    const listItems = (content.match(/^\s*[-*+]\s+.+$/gm) || []).length

    // 可读性分析
    const avgSentenceLength = sentences > 0 ? Math.round(words / sentences) : 0
    const avgParagraphLength = paragraphs > 0 ? Math.round(words / paragraphs) : 0

    // 简单的可读性评分（0-100）
    let readabilityScore = 50
    if (avgSentenceLength < 15) readabilityScore += 10
    if (avgSentenceLength > 25) readabilityScore -= 10
    if (avgParagraphLength < 50) readabilityScore += 5
    if (avgParagraphLength > 150) readabilityScore -= 5
    if (headings > 3) readabilityScore += 5
    if (links > 0) readabilityScore += 5
    readabilityScore = Math.max(0, Math.min(100, readabilityScore))

    const readingTime = Math.ceil(words / 500)

    return {
      characters,
      charactersNoSpaces,
      words,
      paragraphs,
      sentences,
      headings,
      headingsByLevel,
      links,
      images,
      codeBlocks,
      listItems,
      avgSentenceLength,
      avgParagraphLength,
      readabilityScore,
      readingTime
    }
  })

  const aiSuggestions = computed(() => {
    const suggestions = []
    const s = stats.value

    if (s.avgSentenceLength > 25) {
      suggestions.push('建议将长句拆分为短句，提高可读性')
    }
    if (s.paragraphs < 3 && s.words > 300) {
      suggestions.push('文档较长，建议增加段落分隔')
    }
    if (s.headings === 0 && s.words > 200) {
      suggestions.push('建议添加标题来组织文档结构')
    }
    if (s.links === 0) {
      suggestions.push('考虑添加相关链接来丰富内容')
    }
    if (s.readabilityScore < 40) {
      suggestions.push('文档可读性偏低，建议简化表达')
    }

    return suggestions
  })

  // 文本选择处理
  const handleTextSelection = () => {
    nextTick(() => {
      const textarea = markdownTextarea.value
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = documentContent.value.substring(start, end)

      if (selected.trim().length > 0) {
        selectedText.value = selected

        // 计算工具栏位置
        const scrollTop = textarea.scrollTop
        const scrollLeft = textarea.scrollLeft

        // 简单计算光标位置（实际项目中可能需要更复杂的计算）
        const lines = documentContent.value.substring(0, start).split('\n')
        const lineHeight = 24
        const top = (lines.length - 1) * lineHeight - scrollTop + 60
        const left = 100 - scrollLeft

        toolbarPosition.value = {
          top: Math.max(top, 60),
          left: Math.max(left, 20)
        }

        showSelectionToolbar.value = true
      } else {
        showSelectionToolbar.value = false
      }
    })
  }

  // AI 操作
  const polishSelection = () => {
    aiDialogTitle.value = 'AI 润色'
    aiDialogType.value = 'polish'
    aiLoading.value = true
    aiDialogVisible.value = true

    // 模拟 AI 润色
    setTimeout(() => {
      aiLoading.value = false
      aiResult.value = `<p style="color: var(--el-color-success);">润色后的文本将在这里显示...<br>原始文本：${selectedText.value}</p>`
    }, 1500)
  }

  const expandSelection = () => {
    ElMessage.info('扩写功能开发中...')
  }

  const summarizeSelection = () => {
    ElMessage.info('总结功能开发中...')
  }

  const translateSelection = () => {
    ElMessage.info('翻译功能开发中...')
  }

  const rewriteSelection = () => {
    ElMessage.info('改写功能开发中...')
  }

  const applyAIResult = () => {
    const start = markdownTextarea.value?.selectionStart || 0
    const end = markdownTextarea.value?.selectionEnd || 0

    documentContent.value =
      documentContent.value.substring(0, start) +
      selectedText.value +
      documentContent.value.substring(end)

    aiDialogVisible.value = false
    showSelectionToolbar.value = false
    ElMessage.success('已应用到文档')
  }

  const getReadabilityTagType = (score: number) => {
    if (score >= 70) return 'success'
    if (score >= 50) return 'warning'
    return 'danger'
  }

  const getReadabilityDesc = (score: number) => {
    if (score >= 70) return '优秀 - 易于阅读和理解'
    if (score >= 50) return '良好 - 基本符合阅读习惯'
    return '较差 - 建议优化语言表达'
  }

  // 其他方法保持不变...
  const loadProject = async () => {
    try {
      loadingProject.value = true
      if (!projectId) {
        ElMessage.error('项目ID不存在')
        return
      }
      const numericProjectId = Number(projectId)
      if (
        projectStore.currentProject &&
        Number(projectStore.currentProject.id) === numericProjectId
      ) {
        return
      }
      if (projectStore.projects.length === 0) {
        try {
          await projectStore.fetchProjects()
        } catch (error) {
          console.error('加载项目列表失败:', error)
        }
      }
      const project = projectStore.projects.find((p) => Number(p.id) === numericProjectId)
      if (project) {
        projectStore.setCurrentProject(project)
        return
      }
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

  const loadExistingData = () => {
    const titlesData = localStorage.getItem(`project_${projectId}_titles`)
    if (titlesData) {
      const { selectedTitle } = JSON.parse(titlesData)
      documentTitle.value = selectedTitle.text
    }

    const contentData = localStorage.getItem(`project_${projectId}_content`)
    if (contentData) {
      documentContent.value = contentData
      // 从内容动态生成大纲
      generateOutlineFromContent(documentContent.value)
    }
  }

  const generateAIContent = async () => {
    generatingContent.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 4000))
      const mockContent = `# ${documentTitle.value}

## 引言

人工智能技术作为21世纪最具革命性的技术之一，正在深刻改变着我们的生活和工作方式...

## 相关技术概述

### 人工智能技术基础
人工智能技术的核心包括机器学习、深度学习、自然语言处理、计算机视觉等多个分支...

### 行业发展现状
当前，AI技术已经广泛应用于金融、医疗、教育、制造、交通等多个行业...

## 应用案例分析

### 金融行业应用
在金融行业，人工智能技术的应用已经相当成熟...

### 医疗健康应用
医疗健康是AI应用最具潜力的领域之一...

## 挑战与机遇

### 技术挑战
尽管AI技术取得了显著进展，但仍面临诸多挑战...

### 伦理考量
随着AI技术的广泛应用，伦理问题日益凸显...

## 结论与展望

展望未来，AI技术将继续快速发展，我们有理由相信...
`
      documentContent.value = mockContent
      // 生成大纲
      generateOutlineFromContent(mockContent)
      saveContent()
      ElMessage.success('AI正文生成成功！')
    } catch {
      ElMessage.error('正文生成失败')
    } finally {
      generatingContent.value = false
    }
  }

  const onContentChange = () => {
    saveContent()
    generateOutlineFromContent(documentContent.value)
  }

  const saveContent = () => {
    localStorage.setItem(`project_${projectId}_content`, documentContent.value)
    localStorage.setItem(`project_${projectId}_content_saved`, new Date().toISOString())
  }

  const toggleOutline = () => {
    showOutline.value = !showOutline.value
  }

  const toggleStats = () => {
    showStats.value = !showStats.value
  }

  const togglePreview = () => {
    showPreview.value = !showPreview.value
  }

  const navigateToSection = (index: number) => {
    currentSection.value = index

    // 跳转到对应标题位置
    const outline = documentOutline.value
    if (outline.length === 0 || !markdownTextarea.value) return

    const targetSection = outline[index]
    if (!targetSection) return

    // 计算目标标题在文档中的位置
    const content = documentContent.value
    const lines = content.split('\n')
    let charPosition = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim().startsWith('#')) {
        const match = line.match(/^(#{1,6})\s+(.+)$/)
        if (match) {
          const title = match[2].trim()
          if (title === targetSection.title) {
            // 找到目标位置
            break
          }
        }
      }
      charPosition += line.length + 1 // +1 for newline
    }

    // 设置 textarea 的光标位置
    nextTick(() => {
      if (markdownTextarea.value) {
        markdownTextarea.value.focus()
        markdownTextarea.value.setSelectionRange(charPosition, charPosition)

        // 滚动到对应位置
        const textarea = markdownTextarea.value
        const lineHeight = 24
        const targetScrollTop = index * lineHeight
        textarea.scrollTop = targetScrollTop
      }
    })
  }

  const exportContent = () => {
    const blob = new Blob([documentContent.value], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentTitle.value}.md`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('文档导出成功')
  }

  const completeDocument = () => {
    if (!hasContent.value) {
      ElMessage.warning('请先创建文档内容')
      return
    }
    const projectData = localStorage.getItem(`project_${projectId}`)
    if (projectData) {
      const project = JSON.parse(projectData)
      project.status = 'completed'
      project.updateTime = new Date().toISOString()
      localStorage.setItem(`project_${projectId}`, JSON.stringify(project))
    }
    ElMessage.success('文档创作完成！')
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

  .main-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .content-editor {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    padding: 20px;
    overflow: hidden;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .editor-header {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 15px;
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
      flex-direction: column;
      gap: 10px;

      .last-saved {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .editor-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .editor-layout {
    display: grid;
    flex: 1;
    grid-template-columns: 250px 1fr 320px;
    gap: 20px;
    overflow: hidden;
  }

  .outline-panel,
  .stats-panel {
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
      display: flex;
      gap: 8px;
      align-items: center;
      margin: 0;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }
  }

  .outline-content {
    flex: 1;
    overflow-y: auto;
  }

  .outline-item {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    margin-bottom: 5px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-fill-color);
    }

    &.active {
      background: var(--el-color-primary-light-9);
      border-left: 3px solid var(--el-color-primary);
    }
  }

  .outline-number {
    min-width: 20px;
    margin-right: 8px;
    font-weight: bold;
    color: var(--el-color-primary);
  }

  .outline-title {
    font-size: 14px;
    color: var(--el-text-color-regular);
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

  .markdown-container {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
  }

  .markdown-editor {
    position: relative;
    flex: 1;
    overflow: hidden;
  }

  .markdown-input {
    width: 100%;
    height: 100%;
    padding: 20px;
    font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
    resize: none;
    background: var(--el-bg-color);
    border: none;
    outline: none;

    &:focus {
      outline: none;
    }
  }

  .selection-toolbar {
    position: absolute;
    z-index: 10;
    padding: 5px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    box-shadow: 0 2px 12px rgb(0 0 0 / 15%);
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .markdown-preview {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    line-height: 1.6;

    :deep(h1) {
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 32px;
      color: var(--el-text-color-primary);
    }

    :deep(h2) {
      margin-top: 24px;
      margin-bottom: 16px;
      font-size: 24px;
      color: var(--el-text-color-primary);
    }

    :deep(h3) {
      margin-top: 20px;
      margin-bottom: 12px;
      font-size: 18px;
      color: var(--el-text-color-primary);
    }

    :deep(p) {
      margin-bottom: 16px;
      color: var(--el-text-color-regular);
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 24px;
      margin-bottom: 16px;
    }

    :deep(li) {
      margin-bottom: 8px;
    }

    :deep(code) {
      padding: 2px 6px;
      font-family: Monaco, Menlo, monospace;
      font-size: 13px;
      background: var(--el-fill-color-light);
      border-radius: 3px;
    }

    :deep(pre) {
      padding: 16px;
      margin-bottom: 16px;
      overflow-x: auto;
      background: var(--el-fill-color-light);
      border-radius: 6px;

      code {
        padding: 0;
        background: none;
      }
    }
  }

  .stats-content {
    flex: 1;
    overflow-y: auto;
  }

  .stats-section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    h4 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .stat-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }
  }

  .stat-label {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  .stat-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .readability-desc {
    padding: 8px;
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-radius: 4px;
  }

  .suggestion-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .suggestion-item {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 10px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    border-radius: 4px;

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .no-suggestions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    padding: 20px;
    font-size: 13px;
    color: var(--el-text-color-secondary);

    .el-icon {
      font-size: 24px;
      color: var(--el-color-success);
    }
  }

  .content-actions {
    display: flex;
    flex-shrink: 0;
    gap: 20px;
    justify-content: center;
    margin-top: 20px;
  }

  .ai-dialog-content {
    min-height: 200px;
  }

  .ai-loading {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    justify-content: center;
    padding: 40px 0;

    p {
      margin: 0;
      color: var(--el-text-color-secondary);
    }
  }

  .ai-result {
    h4 {
      margin: 16px 0 8px;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    .original-text {
      padding: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-light);
      border-radius: 4px;
    }

    .result-text {
      padding: 12px;
      font-size: 13px;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-light);
      border-radius: 4px;
    }
  }

  @media (width <= 1200px) {
    .editor-layout {
      grid-template-columns: 200px 1fr 280px;
    }
  }

  @media (width <= 768px) {
    .content-container {
      height: auto;
      padding: 15px;
    }

    .main-content {
      min-height: auto;
    }

    .editor-layout {
      grid-template-columns: 1fr;
      gap: 15px;
    }

    .outline-panel,
    .stats-panel {
      order: 2;
    }

    .editor-panel {
      order: 1;
      min-height: 400px;
    }

    .editor-actions {
      flex-wrap: wrap;
      justify-content: flex-start;
    }
  }
</style>
