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
        <div class="editor-header">
          <div class="document-info">
            <div class="document-title-row">
              <h2>{{ documentTitle }}</h2>
              <div class="editor-actions">
                <el-button
                  @click="state.showPreview = !state.showPreview"
                  :type="state.showPreview ? 'primary' : 'default'"
                  size="small"
                >
                  <el-icon><View /></el-icon>
                  {{ state.showPreview ? '编辑' : '预览' }}
                </el-button>
                <el-button
                  @click="generateAIContent"
                  :loading="state.generatingContent"
                  type="primary"
                  size="small"
                >
                  <el-icon><MagicStick /></el-icon>
                  AI生成
                </el-button>
                <el-button @click="saveContent" type="success" size="small">
                  <el-icon><Check /></el-icon>
                  保存
                </el-button>
                <el-button @click="exportContent()" :disabled="!hasContent" size="small">
                  <el-icon><Download /></el-icon>
                  导出
                </el-button>
              </div>
            </div>
            <div class="document-meta">
              <el-space wrap size="small">
                <el-tag size="small" type="info">
                  <el-icon><Document /></el-icon>
                  {{ stats.characters }}字
                </el-tag>
                <el-tag size="small" type="success">
                  <el-icon><Clock /></el-icon>
                  {{ stats.readingTime }}分钟
                </el-tag>
                <el-tag size="small" type="warning">
                  <el-icon><DocumentCopy /></el-icon>
                  {{ stats.paragraphs }}段
                </el-tag>
                <el-tag size="small" type="primary">
                  <el-icon><DataAnalysis /></el-icon>
                  可读性 {{ stats.readabilityScore }}
                </el-tag>
              </el-space>
              <div class="last-saved">{{ lastSaved }}</div>
            </div>
          </div>
        </div>

        <div
          class="editor-layout"
          :class="{
            'layout-collapsed-outline': !state.showOutline,
            'layout-collapsed-stats': !state.showStats
          }"
        >
          <div class="outline-panel art-card" :class="{ 'outline-collapsed': !state.showOutline }">
            <div class="panel-header">
              <el-button @click="state.showOutline = !state.showOutline" size="small" text>
                <el-icon><List /></el-icon>
                <span v-if="state.showOutline">大纲</span>
              </el-button>
            </div>

            <el-collapse-transition>
              <div v-show="state.showOutline" class="outline-content">
                <div
                  v-for="(section, index) in state.outline"
                  :key="section.id"
                  class="outline-item"
                  :class="{ active: state.currentSection === index }"
                  @click="navigateToSection(index)"
                  :style="{ paddingLeft: section.level * 20 + 'px' }"
                >
                  <span class="outline-number">{{ index + 1 }}</span>
                  <span class="outline-title">{{ section.title }}</span>
                </div>
              </div>
            </el-collapse-transition>
          </div>

          <div class="editor-panel">
            <div v-if="!hasContent && !state.showPreview" class="empty-editor">
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
              <div v-show="!state.showPreview" class="markdown-editor" ref="editorContainer">
                <textarea
                  ref="markdownTextarea"
                  v-model="state.content"
                  class="markdown-input"
                  placeholder="使用 Markdown 语法开始写作..."
                  @input="handleContentChange"
                  @mouseup="handleTextSelection"
                  @keyup="handleTextSelection"
                ></textarea>

                <!-- 文本选择浮动工具栏 -->
                <div
                  v-if="state.showSelectionToolbar"
                  class="selection-toolbar"
                  :style="{
                    top: state.toolbarPosition.top + 'px',
                    left: state.toolbarPosition.left + 'px'
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
              <div
                v-show="state.showPreview"
                class="markdown-preview"
                v-html="renderedContent"
              ></div>
            </div>
          </div>

          <div class="stats-panel art-card" :class="{ 'stats-collapsed': !state.showStats }">
            <div class="panel-header">
              <el-button @click="state.showStats = !state.showStats" size="small" text>
                <el-icon><DataAnalysis /></el-icon>
                <span v-if="state.showStats">统计</span>
              </el-button>
            </div>

            <el-collapse-transition>
              <div v-show="state.showStats" class="stats-content">
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
                  <div
                    class="stat-item"
                    v-for="(count, level) in stats.headingsByLevel"
                    :key="level"
                  >
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
            </el-collapse-transition>
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
  </div>

  <!-- AI 操作对话框 -->
  <el-dialog v-model="state.aiDialogVisible" :title="state.aiDialogTitle" width="600px">
    <div class="ai-dialog-content">
      <div v-if="state.aiLoading" class="ai-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>AI 正在处理中，请稍候...</p>
      </div>
      <div v-else>
        <div v-if="state.aiDialogType === 'polish'" class="ai-result">
          <h4>原始文本</h4>
          <div class="original-text">{{ state.selectedText }}</div>
          <h4>润色结果</h4>
          <div class="result-text" v-html="aiResult"></div>
        </div>
        <!-- 其他AI操作结果 -->
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="state.aiDialogVisible = false">取消</el-button>
        <el-button v-if="!state.aiLoading" type="primary" @click="applyAIResult">
          应用到文档
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, nextTick } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import {
    Document,
    Clock,
    DocumentCopy,
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
  import { useContent } from '@/composables/useContent'
  import { useProjectStore } from '@/store/modules/project'
  import StepIndicator from '@/components/custom/StepIndicator.vue'

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

  // 文本选择处理
  const handleTextSelection = () => {
    nextTick(() => {
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
    })
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

  .editor-header {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 12px;
    padding-bottom: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color);
  }

  .document-title-row {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;

    h2 {
      flex: 1;
      min-width: 0;
      margin: 0;
      overflow: hidden;
      font-size: 20px;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .document-info {
    flex: 1;

    .document-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      justify-content: space-between;

      .last-saved {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        white-space: nowrap;
      }
    }
  }

  .editor-actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
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

  .outline-panel,
  .stats-panel {
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: 6px;
    box-shadow: var(--art-box-shadow-sm);
    transition: all 0.3s ease;

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      background: var(--el-fill-color-light);
      border-bottom: 1px solid var(--art-border-color);
      transition: all 0.3s ease;

      .el-button {
        justify-content: center;
        width: 100%;
        padding: 6px 8px;
        font-size: 12px;

        .el-icon {
          font-size: 14px;
        }
      }
    }

    .outline-content,
    .stats-content {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      transition: padding 0.3s ease;
    }
  }

  .outline-panel {
    &.outline-collapsed {
      .panel-header {
        min-height: 40px;
        padding: 8px 6px;

        .el-button {
          width: auto;
          padding: 4px 6px;

          span:not(:first-child) {
            display: none;
          }
        }
      }

      .outline-content {
        padding: 0;
      }
    }
  }

  .stats-panel {
    &.stats-collapsed {
      .panel-header {
        min-height: 40px;
        padding: 8px 6px;

        .el-button {
          width: auto;
          padding: 4px 6px;

          span:not(:first-child) {
            display: none;
          }
        }
      }

      .stats-content {
        padding: 0;
      }
    }
  }

  .outline-item {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    margin-bottom: 4px;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 4px;
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-fill-color-light);
      border-color: var(--el-color-primary-light-7);
    }

    &.active {
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
      border-left: 3px solid var(--el-color-primary);
    }
  }

  .outline-number {
    min-width: 16px;
    margin-right: 8px;
    font-size: 11px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .outline-title {
    flex: 1;
    overflow: hidden;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-regular);
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

  .markdown-container {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
    background: var(--art-main-bg-color);
    border: 2px solid var(--art-border-color);
    border-radius: 8px;
    box-shadow: var(--art-box-shadow);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary-light-7);
      box-shadow: var(--art-box-shadow-lg);
    }
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
    background: var(--art-main-bg-color);
    border: none;
    outline: none;
    transition: all 0.3s ease;

    &:focus {
      background: var(--art-main-bg-color);
      outline: none;
    }

    &::placeholder {
      font-style: italic;
      color: var(--el-text-color-placeholder);
    }
  }

  .selection-toolbar {
    position: absolute;
    z-index: 10;
    padding: 6px;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: 6px;
    box-shadow: var(--art-box-shadow);
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
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    h4 {
      display: flex;
      gap: 8px;
      align-items: center;
      padding-bottom: 8px;
      margin: 0 0 16px;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      border-bottom: 1px solid var(--art-border-dashed-color);

      &::before {
        display: inline-block;
        width: 3px;
        height: 16px;
        content: '';
        background: var(--el-color-primary);
        border-radius: 2px;
      }
    }
  }

  .stat-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--art-border-dashed-color);
    transition: all 0.3s ease;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      padding-right: 8px;
      padding-left: 8px;
      background: var(--el-fill-color-light);
      border-radius: 4px;
    }
  }

  .stat-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-regular);
  }

  .stat-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .readability-desc {
    padding: 12px;
    margin-top: 12px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-left: 3px solid var(--el-color-success);
    border-radius: 6px;
  }

  .suggestion-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .suggestion-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-fill-color);
      border-color: var(--el-color-primary-light-7);
      transform: translateY(-1px);
    }

    .el-icon {
      margin-top: 2px;
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  .no-suggestions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    padding: 24px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    background: var(--el-color-success-light-9);
    border: 1px solid var(--el-color-success-light-7);
    border-radius: 8px;

    .el-icon {
      font-size: 28px;
      color: var(--el-color-success);
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

    .document-title-row h2 {
      font-size: 18px;
    }

    .editor-actions .el-button {
      padding: 6px 10px;
      font-size: 12px;
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

    .outline-panel,
    .stats-panel {
      order: 2;
      max-height: 240px;

      &.outline-collapsed,
      &.stats-collapsed {
        .panel-header {
          justify-content: flex-start;
          padding: 12px;

          .el-button {
            width: 100%;
            padding: 8px 12px;
            font-size: 14px;

            span:not(:first-child) {
              display: inline;
            }
          }
        }
      }
    }

    .editor-panel {
      order: 1;
      min-height: 400px;
    }

    .editor-header {
      gap: 8px;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .document-title-row {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;

      h2 {
        font-size: 18px;
        white-space: normal;
      }
    }

    .document-meta {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }

    .editor-actions {
      justify-content: flex-start;
      width: 100%;
    }

    .content-actions {
      flex-wrap: wrap;
      gap: 12px;
      padding: 12px 0;
      margin-top: 12px;
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

    .editor-header {
      gap: 8px;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .document-title-row h2 {
      font-size: 16px;
    }

    .document-meta .el-space {
      flex-wrap: wrap;
      gap: 6px !important;
    }

    .document-meta .el-tag {
      padding: 2px 6px;
      font-size: 11px;
    }

    .editor-actions .el-button {
      padding: 4px 8px;
      font-size: 11px;
    }

    .editor-layout {
      gap: 8px;
    }

    .markdown-input {
      padding: 12px;
      font-size: 13px;
    }

    .outline-panel .outline-content,
    .stats-panel .stats-content {
      padding: 8px;
    }

    .outline-item {
      padding: 4px 6px;
      margin-bottom: 2px;
      font-size: 11px;
    }

    .outline-number {
      min-width: 14px;
      margin-right: 6px;
      font-size: 10px;
    }

    .outline-title {
      font-size: 11px;
    }

    .stats-section {
      margin-bottom: 16px;
    }

    .stats-section h4 {
      margin-bottom: 12px;
      font-size: 13px;
    }

    .stat-item {
      padding: 6px 0;
      font-size: 12px;
    }

    .stat-label {
      font-size: 11px;
    }

    .stat-value {
      font-size: 12px;
    }

    .content-actions {
      gap: 8px;
      padding: 8px 0;
      margin-top: 8px;
    }

    .content-actions .el-button {
      padding: 6px 12px;
      font-size: 12px;
    }
  }
</style>
