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
          :generating-content="state.generatingContent"
          :has-content="hasContent"
          :stats="stats"
          :last-saved="lastSaved"
          @generate-ai-content="generateAIContent"
          @save-content="saveContent"
          @export-content="exportContent"
        />

        <!-- 简化的编辑器布局 -->
        <div class="editor-layout">
          <!-- 侧边工具栏 -->
          <div class="sidebar-toolbar">
            <!-- 大纲切换 -->
            <div
              class="toolbar-item"
              :class="{ active: state.showOutline }"
              @click="state.showOutline = !state.showOutline"
            >
              <el-tooltip content="文档大纲" placement="right" :show-after="800">
                <div class="toolbar-button">
                  <el-icon class="toolbar-icon"><Menu /></el-icon>
                  <span class="toolbar-label">大纲</span>
                </div>
              </el-tooltip>
            </div>

            <!-- 统计信息切换 -->
            <div
              class="toolbar-item"
              :class="{ active: state.showStats }"
              @click="state.showStats = !state.showStats"
            >
              <el-tooltip content="文档统计" placement="right" :show-after="800">
                <div class="toolbar-button">
                  <el-icon class="toolbar-icon"><DataAnalysis /></el-icon>
                  <span class="toolbar-label">统计</span>
                </div>
              </el-tooltip>
            </div>
          </div>

          <!-- 主要内容区域 -->
          <div class="main-content-area">
            <!-- 大纲面板 -->
            <div
              v-show="state.showOutline"
              class="outline-panel-wrapper"
              :class="{ 'panel-collapsed': !state.showOutline }"
            >
              <OutlinePanel
                :show-outline="state.showOutline"
                :outline="state.outline"
                :current-section="state.currentSection"
                @toggle-outline="state.showOutline = !state.showOutline"
                @navigate-to-section="navigateToSection"
              />
            </div>

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
              @toggle-preview="togglePreview"
            />

            <!-- 统计面板 -->
            <div
              v-show="state.showStats"
              class="stats-panel-wrapper"
              :class="{ 'panel-collapsed': !state.showStats }"
            >
              <StatsPanel
                :show-stats="state.showStats"
                :stats="stats"
                :ai-suggestions="aiSuggestions"
                @toggle-stats="state.showStats = !state.showStats"
              />
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
  import { ArrowLeft, Check, Menu, DataAnalysis } from '@element-plus/icons-vue'
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
      const computedStyle = window.getComputedStyle(textarea)
      const lineHeight = parseFloat(computedStyle.lineHeight) || 24

      // 计算目标行号
      const linesBeforeTarget = state.content.substring(0, charPosition).split('\n')
      const targetLineNumber = linesBeforeTarget.length - 1

      // 计算目标滚动位置
      const targetScrollTop = targetLineNumber * lineHeight
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

      // 工具栏尺寸（估算）
      const TOOLBAR_HEIGHT = 120
      const TOOLBAR_WIDTH = 200
      const TOOLBAR_MARGIN = 10

      // 获取textarea的可见区域
      const visibleWidth = textarea.clientWidth
      const paddingLeft = 24 // 与textarea的padding保持一致
      const paddingTop = 24

      // 计算选区的行号和列号
      const textBeforeSelection = state.content.substring(0, start)
      const lines = textBeforeSelection.split('\n')
      const currentLine = lines.length
      const currentColumn = lines[lines.length - 1].length

      // 获取textarea的样式
      const computedStyle = window.getComputedStyle(textarea)
      const lineHeight = parseFloat(computedStyle.lineHeight) || 24
      const fontSize = parseFloat(computedStyle.fontSize) || 15

      // 计算光标的近似位置
      // 估算每个字符的宽度（基于字体大小）
      const charWidth = fontSize * 0.6 // monospace字体大约60%的宽度

      // 工具栏的理想位置（基于光标位置）
      let idealTop = paddingTop + (currentLine - 1) * lineHeight + textarea.scrollTop
      let idealLeft = paddingLeft + currentColumn * charWidth + textarea.scrollLeft

      // 垂直方向：默认显示在选区上方
      let toolbarTop = idealTop - TOOLBAR_HEIGHT - TOOLBAR_MARGIN
      const minTop = 20 // 顶部最小距离

      if (toolbarTop < minTop) {
        // 上方空间不够，显示在选区下方
        const selectionEndLines = state.content.substring(0, end).split('\n')
        const endLine = selectionEndLines.length
        const selectionEndTop = paddingTop + (endLine - 1) * lineHeight + textarea.scrollTop

        toolbarTop = selectionEndTop + lineHeight + TOOLBAR_MARGIN

        // 检查是否超出底部
        const maxTop = textarea.scrollHeight - TOOLBAR_HEIGHT - 10
        if (toolbarTop > maxTop) {
          // 都不行，就固定在顶部
          toolbarTop = minTop
        }
      }

      // 水平方向：尝试左对齐
      let toolbarLeft = idealLeft
      const maxLeft = visibleWidth - TOOLBAR_WIDTH - 10

      // 检查是否超出右边界
      if (toolbarLeft > maxLeft) {
        toolbarLeft = maxLeft
      }

      // 检查是否超出左边界
      if (toolbarLeft < 10) {
        toolbarLeft = 10
      }

      state.toolbarPosition = {
        top: toolbarTop,
        left: toolbarLeft
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
    display: flex;
    flex: 1;
    gap: 0;
    min-height: 0;
    overflow: hidden;
  }

  .sidebar-toolbar {
    position: relative;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 16px;
    align-items: center;
    justify-content: flex-start;
    padding: 16px 12px;
    background: linear-gradient(
      180deg,
      var(--el-fill-color-lighter) 0%,
      var(--el-fill-color-light) 100%
    );
    border-right: 1px solid var(--el-border-color-lighter);

    // 添加微妙的背景装饰
    &::after {
      position: absolute;
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
      content: '';
      background: linear-gradient(
        180deg,
        transparent 0%,
        var(--el-color-primary-light-8) 50%,
        transparent 100%
      );
      opacity: 0.3;
    }
  }

  .toolbar-item {
    position: relative;
    width: 100%;
    max-width: 48px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &::before {
      position: absolute;
      top: 50%;
      left: 50%;
      z-index: 0;
      width: 40px;
      height: 40px;
      content: '';
      background: var(--el-color-primary-light-9);
      border-radius: 12px;
      opacity: 0;
      transition: all 0.3s ease;
      transform: translate(-50%, -50%);
    }

    &:hover {
      transform: translateX(2px);

      &::before {
        width: 48px;
        height: 48px;
        background: var(--el-color-primary-light-8);
        opacity: 1;
      }

      .toolbar-button {
        transform: scale(1.05);
      }

      .toolbar-label {
        opacity: 1;
        transform: translateX(4px);
      }
    }

    &.active {
      &::before {
        width: 48px;
        height: 48px;
        background: var(--el-color-primary-light-7);
        opacity: 1;
      }

      .toolbar-button {
        .toolbar-icon {
          color: var(--el-color-primary);
          transform: scale(1.1);
        }

        .toolbar-label {
          font-weight: 600;
          color: var(--el-color-primary);
        }
      }
    }
  }

  .toolbar-button {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    width: 100%;
    padding: 8px 4px;
    background: transparent;
    border: none;
    border-radius: 12px;
    transition: all 0.3s ease;

    .toolbar-icon {
      font-size: 18px;
      line-height: 1;
      color: var(--el-text-color-regular);
      transition: all 0.3s ease;
    }

    .toolbar-label {
      font-size: 11px;
      font-weight: 500;
      line-height: 1;
      color: var(--el-text-color-secondary);
      text-align: center;
      white-space: nowrap;
      opacity: 0.8;
      transition: all 0.3s ease;
    }
  }

  .main-content-area {
    position: relative;
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .outline-panel-wrapper,
  .stats-panel-wrapper {
    flex-shrink: 0;
    width: 0;
    overflow: hidden;
    transition: all 0.3s ease;

    &:not(.panel-collapsed) {
      width: 280px;
      border-right: 1px solid var(--el-border-color-lighter);
      border-left: 1px solid var(--el-border-color-lighter);
    }

    &:first-child:not(.panel-collapsed) {
      border-left: none;
    }
  }

  .outline-panel-wrapper:not(.panel-collapsed) {
    background: var(--el-fill-color-lighter);
  }

  .stats-panel-wrapper:not(.panel-collapsed) {
    background: var(--el-fill-color-lighter);
  }

  // 编辑器始终占据主要空间
  .main-content-area > :nth-child(2) {
    flex: 1;
    min-width: 0;
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

    .outline-panel-wrapper:not(.panel-collapsed),
    .stats-panel-wrapper:not(.panel-collapsed) {
      width: 240px;
    }
  }

  @media (width <= 900px) {
    .content-container {
      padding: 12px;
    }

    .sidebar-toolbar {
      gap: 12px;
      padding: 0 8px;

      &::before {
        height: 90px;
      }

      .toolbar-item {
        max-width: 44px;

        .toolbar-button {
          gap: 3px;
          padding: 6px 3px;

          .toolbar-icon {
            font-size: 16px;
          }

          .toolbar-label {
            font-size: 10px;
          }
        }
      }
    }

    .outline-panel-wrapper:not(.panel-collapsed),
    .stats-panel-wrapper:not(.panel-collapsed) {
      width: 260px;
    }

    .content-actions {
      flex-wrap: wrap;
      gap: 12px;
      padding: 12px 0;
      margin-top: 12px;
    }

    .content-actions .el-button {
      padding: 8px 16px;
      font-size: 14px;
    }
  }

  @media (width <= 768px) {
    .content-container {
      padding: 8px;
    }

    .editor-layout {
      flex-direction: column;
    }

    .sidebar-toolbar {
      flex-direction: row;
      gap: 16px;
      justify-content: center;
      padding: 8px 12px;
      background: var(--el-fill-color-light);
      border-right: none;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &::before {
        display: none; // 移动端隐藏占位空间
      }

      &::after {
        display: none; // 移动端隐藏装饰线
      }

      .toolbar-item {
        flex-direction: row;
        max-width: 60px;

        .toolbar-button {
          flex-direction: row;
          gap: 6px;
          padding: 8px 12px;

          .toolbar-icon {
            font-size: 16px;
          }

          .toolbar-label {
            font-size: 12px;
            opacity: 1;
          }
        }

        &:hover {
          transform: translateY(-2px);

          .toolbar-label {
            transform: translateX(0);
          }
        }
      }
    }

    .main-content-area {
      flex-direction: column;
    }

    .outline-panel-wrapper:not(.panel-collapsed),
    .stats-panel-wrapper:not(.panel-collapsed) {
      width: 100%;
      height: 200px;
      border-right: none;
      border-bottom: 1px solid var(--el-border-color-lighter);
      border-left: none;
    }

    .content-actions {
      gap: 8px;
      padding: 8px 0;
      margin-top: 8px;
    }

    .content-actions .el-button {
      padding: 6px 12px;
      font-size: 13px;
    }
  }

  @media (width <= 480px) {
    .content-container {
      height: auto;
      padding: 6px;
    }

    .main-content {
      min-height: auto;
    }

    .content-editor {
      padding: 8px;
    }

    .sidebar-toolbar {
      gap: 12px;
      padding: 6px 8px;

      &::before {
        display: none; // 小屏幕隐藏占位空间
      }

      &::after {
        display: none; // 小屏幕隐藏装饰线
      }

      .toolbar-item {
        max-width: 50px;

        .toolbar-button {
          gap: 4px;
          padding: 6px 8px;

          .toolbar-icon {
            font-size: 14px;
          }

          .toolbar-label {
            font-size: 10px;
          }
        }

        &:hover {
          transform: translateY(-1px);

          .toolbar-label {
            transform: translateX(0);
          }
        }
      }
    }

    .outline-panel-wrapper:not(.panel-collapsed),
    .stats-panel-wrapper:not(.panel-collapsed) {
      height: 180px;
    }

    .content-actions .el-button {
      padding: 5px 10px;
      font-size: 12px;
    }
  }
</style>
