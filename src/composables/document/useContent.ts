/**
 * 内容编辑组合式函数
 *
 * 职责：管理内容编辑页面的所有功能和状态
 *
 * 主要功能：
 * 1. 文档内容管理（标题、内容、大纲）
 * 2. 内容统计和分析
 * 3. AI辅助功能（续写、扩写、改写等）
 * 4. 导出功能
 * 5. 保存和自动保存
 */

import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import MarkdownIt from 'markdown-it'
import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
import { useProjectStore } from '@/store/modules/project'
import { bodyService } from '@/services/bodyService'

/**
 * 文档章节接口
 */
export interface DocumentSection {
  id: string
  title: string
  level: number
}

/**
 * 内容状态接口
 */
export interface ContentState {
  // 基础内容
  title: string
  content: string
  outline: DocumentSection[]

  // UI 状态
  currentSection: number
  showOutline: boolean
  showStats: boolean
  showPreview: boolean
  generatingContent: boolean

  // AI 对话框
  aiDialogVisible: boolean
  aiDialogTitle: string
  aiDialogType: string
  aiLoading: boolean

  // 选择和工具栏
  selectedText: string
  showSelectionToolbar: boolean
  toolbarPosition: { top: number; left: number }

  // 加载状态
  loadingProject: boolean
}

/**
 * 内容统计信息接口
 */
export interface ContentStats {
  characters: number
  charactersNoSpaces: number
  words: number
  paragraphs: number
  sentences: number
  headings: number
  headingsByLevel: Record<number, number>
  links: number
  images: number
  codeBlocks: number
  listItems: number
  avgSentenceLength: number
  avgParagraphLength: number
  readabilityScore: number
  readingTime: number
}

/**
 * 内容编辑组合式函数
 */
export function useContent() {
  const route = useRoute()
  const projectId = route.params.projectId as string

  // Store
  const documentStore = useDocumentGenerateStore()
  const projectStore = useProjectStore()
  const { documentState } = storeToRefs(documentStore)

  // Markdown 渲染器
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  })

  // 状态对象
  const state = reactive<ContentState>({
    title: '',
    content: '',
    outline: [],
    currentSection: 0,
    showOutline: false,
    showStats: false,
    showPreview: false,
    generatingContent: false,
    aiDialogVisible: false,
    aiDialogTitle: '',
    aiDialogType: '',
    aiLoading: false,
    selectedText: '',
    showSelectionToolbar: false,
    toolbarPosition: { top: 0, left: 0 },
    loadingProject: false
  })

  // 编辑器引用
  const editorContainer = ref<HTMLElement>()
  const markdownTextarea = ref<HTMLTextAreaElement>()

  // ==================== 计算属性 ====================

  // 文档信息
  const hasContent = computed(() => state.content.trim().length > 0)
  const documentTitle = computed(() => {
    return state.title || documentState.value.selectedTitle?.title || '未命名文档'
  })

  // 渲染后的内容
  const renderedContent = computed(() => {
    return md.render(state.content)
  })

  // 最后保存时间
  const lastSaved = computed(() => {
    const saved = localStorage.getItem(`project_${projectId}_content_saved`)
    return saved ? new Date(saved).toLocaleString('zh-CN') : '未保存'
  })

  // 头部操作按钮
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
  const stats = computed<ContentStats>(() => {
    const content = state.content
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

  // AI 建议
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
      suggestions.push('可以添加相关链接来丰富内容')
    }
    if (s.codeBlocks === 0) {
      suggestions.push('技术文档建议添加代码示例')
    }

    return suggestions
  })

  // 步骤指示器
  const stepList = computed(() => [
    { label: '选题', status: 'completed' as const },
    { label: '大纲', status: 'completed' as const },
    { label: '正文', status: 'active' as const }
  ])

  // ==================== 大纲相关 ====================

  // 动态生成大纲
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

    state.outline = headings
  }

  // 滚动到章节
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // ==================== 内容管理 ====================

  // 保存内容到服务器
  const saveContent = async () => {
    if (!projectId) return

    try {
      const numericProjectId = Number(projectId)

      // 尝试获取活动正文
      let activeBody
      try {
        activeBody = await bodyService.getActiveBody(numericProjectId)
      } catch {
        // 没有活动正文，需要创建新的
        activeBody = null
      }

      if (activeBody) {
        // 更新现有正文
        await bodyService.updateBody(activeBody.id, {
          title: state.title || documentTitle.value,
          content: state.content
        })
      } else {
        // 创建新正文
        await bodyService.createBody(numericProjectId, {
          title: state.title || documentTitle.value,
          content: state.content,
          status: 'active'
        })
      }

      localStorage.setItem(`project_${projectId}_content_saved`, String(Date.now()))
      ElMessage.success('内容已保存到服务器')
    } catch (error) {
      console.error('Save content error:', error)
      // 保存到本地作为备选
      localStorage.setItem(`project_${projectId}_content`, state.content)
      localStorage.setItem(`project_${projectId}_content_saved`, String(Date.now()))
      ElMessage.warning('服务器保存失败，已保存到本地')
    }
  }

  // 自动保存
  let autoSaveTimer: number | null = null
  const autoSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }
    autoSaveTimer = window.setTimeout(async () => {
      if (state.content.trim()) {
        try {
          await saveContent()
        } catch (error) {
          console.error('Auto save error:', error)
        }
      }
    }, 3000)
  }

  // 加载已有数据
  const loadExistingData = () => {
    if (!projectId) return

    // 加载标题
    const titleData = localStorage.getItem(`project_${projectId}_titles`)
    if (titleData) {
      try {
        const { selectedTitle } = JSON.parse(titleData)
        if (selectedTitle) {
          state.title = selectedTitle.title
        }
      } catch (error) {
        console.error('Failed to load title:', error)
      }
    }

    // 加载内容
    const contentData = localStorage.getItem(`project_${projectId}_content`)
    if (contentData) {
      state.content = contentData
      generateOutlineFromContent(state.content)
    }
  }

  // 导出内容
  const exportContent = (format: 'md' | 'html' | 'pdf' = 'md') => {
    if (!state.content.trim()) {
      ElMessage.warning('没有可导出的内容')
      return
    }

    const filename = `${documentTitle.value}.${format}`
    let content = ''
    let mimeType = ''

    switch (format) {
      case 'md':
        content = state.content
        mimeType = 'text/markdown'
        break
      case 'html':
        content = renderedContent.value
        mimeType = 'text/html'
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success(`内容已导出为 ${filename}`)
  }

  // ==================== AI 功能 ====================

  // 打开 AI 对话框
  const openAiDialog = (type: string, title: string) => {
    state.aiDialogType = type
    state.aiDialogTitle = title
    state.aiDialogVisible = true
  }

  // 处理 AI 请求
  const handleAiRequest = async () => {
    state.aiLoading = true
    try {
      // TODO: 实现 AI API 调用
      // const response = await aiService.generateContent(prompt, state.content)

      // 模拟请求
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      ElMessage.error('AI 请求失败')
      console.error('AI request error:', error)
    } finally {
      state.aiLoading = false
    }
  }

  // ==================== 初始化 ====================

  onMounted(async () => {
    documentStore.documentState.currentStep = 'content'
    documentStore.cleanupExpiredTasks()

    await loadProject()

    // ========== 新增：项目级状态管理 ==========
    // 如果有项目ID，尝试恢复项目状态
    if (projectId) {
      console.log(`[DEBUG] 内容页面：检查项目 ${projectId} 的状态`)

      // 检查是否需要设置当前项目
      if (!documentStore.currentProjectId) {
        documentStore.setCurrentProject(projectId)
      }

      // 尝试加载已保存的状态
      const hasSavedState = documentStore.loadFromProjectStorage(projectId)
      if (hasSavedState) {
        console.log('[DEBUG] 内容页面：已恢复项目状态')
      } else {
        console.log('[DEBUG] 内容页面：无已保存状态')
      }
    }
    // ========== 状态管理结束 ==========

    loadExistingData()
  })

  // 监听内容变化，自动生成大纲和自动保存
  watch(
    () => state.content,
    (newContent) => {
      generateOutlineFromContent(newContent)
      autoSave()
    },
    { immediate: true }
  )

  // 加载项目
  const loadProject = async () => {
    try {
      state.loadingProject = true

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

      // 加载项目
      try {
        await projectStore.fetchProjects()
        const project = projectStore.projects.find((p) => Number(p.id) === numericProjectId)
        if (project) {
          projectStore.setCurrentProject(project)
        }
      } catch (error) {
        console.error('Failed to load project:', error)
      }
    } finally {
      state.loadingProject = false
    }
  }

  // ==================== 返回值 ====================

  return {
    // 状态
    state,
    documentState,

    // 编辑器引用
    editorContainer,
    markdownTextarea,

    // 计算属性
    documentTitle,
    hasContent,
    renderedContent,
    lastSaved,
    headerActions,
    stats,
    aiSuggestions,
    stepList,

    // 方法 - 大纲
    generateOutlineFromContent,
    scrollToSection,

    // 方法 - 内容管理
    saveContent,
    exportContent,

    // 方法 - AI
    openAiDialog,
    handleAiRequest,

    // 方法 - 项目
    loadProject
  }
}
