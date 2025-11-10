<template>
  <div class="content-container">
    <ArtTableHeader :title="`正文编辑 (Markdown)`" :actions="headerActions" @back="goBack" />

    <!-- 项目加载提示 -->
    <div
      v-if="state.loadingProject || (!projectStore.currentProject && projectId)"
      class="project-loading"
    >
      <el-empty :description="state.loadingProject ? '正在加载项目信息...' : '项目信息加载失败'" />
    </div>

    <div v-else class="main-content art-page-content">
      <StepIndicator :steps="stepList" />

      <div class="content-editor art-card">
        <!-- 头部区域 -->
        <HeaderSection
          :document-title="documentTitle"
          :show-preview="state.showPreview"
          :generating-content="state.generatingContent"
          :has-content="hasContent"
          :stats="stats"
          :last-saved="lastSaved"
          @toggle-preview="togglePreview"
          @generate-ai-content="generateAIContent"
          @save-content="saveContent"
          @export-content="exportContent"
        />

        <div
          class="editor-layout"
          :class="{
            'layout-collapsed-outline': !state.showOutline,
            'layout-collapsed-stats': !state.showStats
          }"
        >
          <!-- 大纲面板 -->
          <OutlinePanel
            :show-outline="state.showOutline"
            :outline="state.outline"
            :current-section="state.currentSection"
            @toggle-outline="state.showOutline = !state.showOutline"
            @navigate-to-section="navigateToSection"
          />

          <!-- 编辑器面板 -->
          <EditorPanel
            v-model:editor-container="editorContainer"
            v-model:markdown-textarea="markdownTextarea"
            :content="state.content"
            :show-preview="state.showPreview"
            :has-content="hasContent"
            :rendered-content="renderedContent"
            :show-selection-toolbar="state.showSelectionToolbar"
            :toolbar-position="state.toolbarPosition"
            @update:content="(value) => (state.content = value)"
            @generate-ai-content="generateAIContent"
            @content-change="handleContentChange"
            @text-selection="handleTextSelection"
            @polish-selection="polishSelection"
            @expand-selection="expandSelection"
            @summarize-selection="summarizeSelection"
            @translate-selection="translateSelection"
            @rewrite-selection="rewriteSelection"
          />

          <!-- 统计面板 -->
          <StatsPanel
            :show-stats="state.showStats"
            :stats="stats"
            :ai-suggestions="aiSuggestions"
            @toggle-stats="state.showStats = !state.showStats"
          />
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
    <AIDialog
      :visible="state.aiDialogVisible"
      :dialog-title="state.aiDialogTitle"
      :dialog-type="state.aiDialogType"
      :ai-loading="state.aiLoading"
      :selected-text="state.selectedText"
      :ai-result="aiResult"
      @update:visible="(value) => (state.aiDialogVisible = value)"
      @apply="applyAIResult"
      @cancel="state.aiDialogVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { ArrowLeft, Check } from '@element-plus/icons-vue'
  import { useContent } from '@/composables/document/useContent'
  import { useProjectStore } from '@/store/modules/project'
  import StepIndicator from '@/components/custom/StepIndicator.vue'
  import HeaderSection from '@/components/custom/document/content/HeaderSection.vue'
  import OutlinePanel from '@/components/custom/document/content/OutlinePanel.vue'
  import EditorPanel from '@/components/custom/document/content/EditorPanel.vue'
  import StatsPanel from '@/components/custom/document/content/StatsPanel.vue'
  import AIDialog from '@/components/custom/document/content/AIDialog.vue'

  const router = useRouter()
  const route = useRoute()
  const projectId = route.params.projectId as string
  const projectStore = useProjectStore()

  // 使用内容编辑组合式函数
  const {
    state,
    editorContainer,
    markdownTextarea,
    documentTitle,
    hasContent,
    renderedContent,
    lastSaved,
    headerActions,
    stats,
    aiSuggestions,
    stepList,
    generateOutlineFromContent,
    saveContent,
    exportContent
  } = useContent()

  // AI 结果数据
  const aiResult = ref('')

  // 切换预览模式
  const togglePreview = () => {
    state.showPreview = !state.showPreview
  }

  // 生成 AI 内容
  const generateAIContent = async () => {
    state.generatingContent = true
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
      state.content = mockContent
      // 生成大纲
      generateOutlineFromContent(mockContent)
      saveContent()
      ElMessage.success('AI正文生成成功！')
    } catch {
      ElMessage.error('正文生成失败')
    } finally {
      state.generatingContent = false
    }
  }

  // 处理内容变化
  const handleContentChange = () => {
    // saveContent 和大纲生成通过 watch 自动处理
  }

  // 导航到章节
  const navigateToSection = (index: number) => {
    state.currentSection = index

    // 跳转到对应标题位置
    const outline = state.outline
    if (outline.length === 0 || !markdownTextarea.value) return

    const targetSection = outline[index]
    if (!targetSection) return

    // 计算目标标题在文档中的位置
    const content = state.content
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
    if (markdownTextarea.value) {
      markdownTextarea.value.focus()
      markdownTextarea.value.setSelectionRange(charPosition, charPosition)

      // 滚动到对应位置
      const textarea = markdownTextarea.value
      const lineHeight = 24
      const targetScrollTop = index * lineHeight
      textarea.scrollTop = targetScrollTop
    }
  }

  // 文本选择处理
  const handleTextSelection = () => {
    const textarea = markdownTextarea.value
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = state.content.substring(start, end)

    if (selected.trim().length > 0) {
      state.selectedText = selected

      // 计算工具栏位置
      const scrollTop = textarea.scrollTop
      const scrollLeft = textarea.scrollLeft

      // 简单计算光标位置
      const lines = state.content.substring(0, start).split('\n')
      const lineHeight = 24
      const top = (lines.length - 1) * lineHeight - scrollTop + 60
      const left = 100 - scrollLeft

      state.toolbarPosition = {
        top: Math.max(top, 60),
        left: Math.max(left, 20)
      }

      state.showSelectionToolbar = true
    } else {
      state.showSelectionToolbar = false
    }
  }

  // AI 操作
  const polishSelection = () => {
    state.aiDialogTitle = 'AI 润色'
    state.aiDialogType = 'polish'
    state.aiLoading = true
    state.aiDialogVisible = true

    // 模拟 AI 润色
    setTimeout(() => {
      state.aiLoading = false
      aiResult.value = `<p style="color: var(--el-color-success);">润色后的文本将在这里显示...<br>原始文本：${state.selectedText}</p>`
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

    state.content =
      state.content.substring(0, start) + state.selectedText + state.content.substring(end)

    state.aiDialogVisible = false
    state.showSelectionToolbar = false
    ElMessage.success('已应用到文档')
  }

  // 完成文档
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

  // 返回上一页
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

  .project-loading {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
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
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: 8px;
    box-shadow: var(--art-box-shadow-sm);
  }

  .editor-layout {
    display: grid;
    flex: 1;
    grid-template-columns: 50px 1fr 50px;
    gap: 16px;
    overflow: hidden;
    transition: grid-template-columns 0.3s ease;

    &.layout-collapsed-outline {
      grid-template-columns: 50px 1fr 50px;
    }

    &.layout-collapsed-stats {
      grid-template-columns: 50px 1fr 50px;
    }

    &.layout-collapsed-outline.layout-collapsed-stats {
      grid-template-columns: 50px 1fr 50px;
    }

    // 展开状态下的布局
    &:not(.layout-collapsed-outline, .layout-collapsed-stats) {
      grid-template-columns: 180px 1fr 220px;
    }

    &.layout-collapsed-outline:not(.layout-collapsed-stats) {
      grid-template-columns: 50px 1fr 220px;
    }

    &.layout-collapsed-stats:not(.layout-collapsed-outline) {
      grid-template-columns: 180px 1fr 50px;
    }
  }

  .content-actions {
    display: flex;
    flex-shrink: 0;
    gap: 16px;
    align-items: center;
    justify-content: center;
    padding: 12px 0;
    margin-top: 16px;
    background: var(--el-fill-color-light);
    border-top: 1px solid var(--art-border-color);
    border-radius: 6px;
  }

  @media (width <= 1200px) {
    .content-container {
      padding: 16px;
    }

    .editor-layout {
      grid-template-columns: 160px 1fr 200px;
      gap: 12px;

      &:not(.layout-collapsed-outline, .layout-collapsed-stats) {
        grid-template-columns: 160px 1fr 200px;
      }

      &.layout-collapsed-outline:not(.layout-collapsed-stats) {
        grid-template-columns: 50px 1fr 200px;
      }

      &.layout-collapsed-stats:not(.layout-collapsed-outline) {
        grid-template-columns: 160px 1fr 50px;
      }
    }
  }

  @media (width <= 900px) {
    .content-container {
      padding: 12px;
    }

    .editor-layout {
      grid-template-columns: 1fr;
      gap: 12px;

      &.layout-collapsed-outline,
      &.layout-collapsed-stats,
      &.layout-collapsed-outline.layout-collapsed-stats {
        grid-template-columns: 1fr;
      }
    }

    .editor-panel {
      min-height: 400px;
    }

    .content-actions {
      flex-wrap: wrap;
      gap: 12px;
      padding: 12px 0;
      margin-top: 12px;
    }

    .content-actions .el-button {
      padding: 6px 12px;
      font-size: 12px;
    }
  }

  @media (width <= 600px) {
    .content-container {
      height: auto;
      padding: 8px;
    }

    .main-content {
      min-height: auto;
    }

    .content-editor {
      padding: 12px;
    }

    .editor-layout {
      gap: 8px;
    }

    .content-actions {
      gap: 8px;
      padding: 8px 0;
      margin-top: 8px;
    }
  }
</style>
