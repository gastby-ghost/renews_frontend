<template>
  <div class="editor-panel">
    <div v-if="!hasContent && !showPreview" class="empty-editor">
      <div class="empty-icon">📝</div>
      <h3>开始创作您的 Markdown 文档</h3>
      <p>点击"AI生成"让AI帮您生成内容，或手动开始写作</p>
      <div class="empty-actions">
        <el-button @click="generateAIContent" type="primary" size="large"> AI生成正文 </el-button>
      </div>
    </div>

    <div v-else class="markdown-container">
      <!-- 模式切换标签 -->
      <div class="editor-tabs">
        <div class="tab-item" :class="{ active: !showPreview }" @click="switchToEdit">
          <el-icon><Edit /></el-icon>
          编辑
        </div>
        <div class="tab-item" :class="{ active: showPreview }" @click="switchToPreview">
          <el-icon><View /></el-icon>
          预览
        </div>
      </div>

      <!-- 编辑区域 -->
      <div class="editor-content">
        <!-- Markdown 编辑器 -->
        <div v-show="!showPreview" class="markdown-editor" ref="editorContainer">
          <textarea
            ref="markdownTextarea"
            :value="content"
            class="markdown-input"
            placeholder="开始写作，支持 Markdown 语法...

# 标题
## 二级标题

**粗体** 和 *斜体*

- 列表项 1
- 列表项 2

[链接文本](URL)"
            @input="handleContentChange"
            @mouseup="handleTextSelection"
            @keyup="handleTextSelection"
          ></textarea>

          <!-- 简化的AI工具栏 -->
          <div
            v-if="showSelectionToolbar"
            class="ai-toolbar"
            :style="{
              top: toolbarPosition.top + 'px',
              left: toolbarPosition.left + 'px'
            }"
          >
            <div class="ai-toolbar-header">
              <el-icon class="ai-icon"><MagicStick /></el-icon>
              <span>AI 助手</span>
            </div>
            <div class="ai-actions">
              <el-button @click="polishSelection" size="small" text>
                <el-icon><Brush /></el-icon>
                润色
              </el-button>
              <el-button @click="expandSelection" size="small" text>
                <el-icon><Expand /></el-icon>
                扩写
              </el-button>
              <el-button @click="summarizeSelection" size="small" text>
                <el-icon><ZoomOut /></el-icon>
                总结
              </el-button>
            </div>
          </div>
        </div>

        <!-- Markdown 预览 -->
        <div v-show="showPreview" class="markdown-preview" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Brush, Expand, ZoomOut, Edit, View, MagicStick } from '@element-plus/icons-vue'

  interface ToolbarPosition {
    top: number
    left: number
  }

  const props = defineProps<{
    content: string
    showPreview: boolean
    hasContent: boolean
    renderedContent: string
    showSelectionToolbar: boolean
    toolbarPosition: ToolbarPosition
  }>()

  const emit = defineEmits<{
    (e: 'update:content', value: string): void
    (e: 'generate-ai-content'): void
    (e: 'content-change'): void
    (e: 'text-selection'): void
    (e: 'polish-selection'): void
    (e: 'expand-selection'): void
    (e: 'summarize-selection'): void
    (e: 'translate-selection'): void
    (e: 'rewrite-selection'): void
    (e: 'toggle-preview'): void
  }>()

  const editorContainer = defineModel<HTMLElement | null>('editorContainer', { default: null })
  const markdownTextarea = defineModel<HTMLTextAreaElement | null>('markdownTextarea', {
    default: null
  })

  const handleContentChange = (event: Event) => {
    const target = event.target as HTMLTextAreaElement
    emit('update:content', target.value)
    emit('content-change')
  }

  const handleTextSelection = () => {
    emit('text-selection')
  }

  const generateAIContent = () => {
    emit('generate-ai-content')
  }

  const polishSelection = () => {
    emit('polish-selection')
  }

  const expandSelection = () => {
    emit('expand-selection')
  }

  const summarizeSelection = () => {
    emit('summarize-selection')
  }

  const switchToEdit = () => {
    if (props.showPreview) {
      emit('toggle-preview')
    }
  }

  const switchToPreview = () => {
    if (!props.showPreview) {
      emit('toggle-preview')
    }
  }
</script>

<style scoped lang="scss">
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
      margin-bottom: 24px;
      font-size: 72px;
      opacity: 0.8;
    }

    h3 {
      margin: 0 0 12px;
      font-size: 22px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0 0 24px;
      font-size: 15px;
      line-height: 1.5;
      color: var(--el-text-color-secondary);
    }
  }

  .markdown-container {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background: var(--art-main-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: var(--art-box-shadow-sm);
  }

  .editor-tabs {
    display: flex;
    flex-shrink: 0;
    padding: 0 16px;
    background: var(--el-fill-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);
    border-radius: 12px 12px 0 0;

    .tab-item {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;

      &:hover {
        color: var(--el-text-color-primary);
        background: var(--el-fill-color-light);
      }

      &.active {
        color: var(--el-color-primary);
        background: var(--art-main-bg-color);
        border-bottom-color: var(--el-color-primary);
      }

      .el-icon {
        font-size: 16px;
      }
    }
  }

  .editor-content {
    flex: 1;
    overflow: hidden;
  }

  .markdown-editor {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }

  .markdown-input {
    flex: 1;
    width: 100%;
    min-height: 0;
    padding: 24px;
    overflow: hidden auto;
    font-family: 'JetBrains Mono', 'Fira Code', Monaco, Menlo, 'Ubuntu Mono', monospace;
    font-size: 15px;
    line-height: 1.7;
    color: var(--el-text-color-regular);
    resize: none;
    background: var(--art-main-bg-color);
    border: none;
    outline: none;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      box-shadow: none;
    }

    &::placeholder {
      font-family: inherit;
      font-size: 14px;
      line-height: 1.6;
      color: var(--el-text-color-placeholder);
    }

    // 美化滚动条
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
      transition: background 0.3s ease;

      &:hover {
        background: var(--el-border-color-dark);
      }
    }
  }

  .ai-toolbar {
    position: absolute;
    z-index: 100;
    min-width: 180px;
    background: var(--art-main-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgb(0 0 0 / 15%);
    animation: slideIn 0.2s ease;

    .ai-toolbar-header {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 600;
      color: var(--el-color-primary);
      background: var(--el-fill-color-lighter);
      border-bottom: 1px solid var(--el-border-color-lighter);
      border-radius: 8px 8px 0 0;

      .ai-icon {
        font-size: 14px;
      }
    }

    .ai-actions {
      display: flex;
      flex-direction: column;
      padding: 4px;

      .el-button {
        justify-content: flex-start;
        width: 100%;
        padding: 8px 12px;
        font-size: 13px;
        color: var(--el-text-color-regular);
        border-radius: 4px;
        transition: all 0.2s ease;

        &:hover {
          color: var(--el-color-primary);
          background: var(--el-fill-color-light);
        }

        .el-icon {
          margin-right: 8px;
          font-size: 14px;
        }
      }
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.95);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
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

  @media (width <= 900px) {
    .empty-editor {
      h3 {
        font-size: 20px;
      }

      .empty-icon {
        font-size: 64px;
      }
    }

    .editor-tabs {
      padding: 0 12px;

      .tab-item {
        padding: 10px 12px;
        font-size: 13px;
      }
    }

    .markdown-input {
      padding: 16px;
      font-size: 14px;
    }

    .markdown-preview {
      padding: 16px;
    }

    .ai-toolbar {
      min-width: 160px;

      .ai-toolbar-header {
        padding: 8px 10px;
        font-size: 12px;
      }

      .ai-actions .el-button {
        padding: 6px 10px;
        font-size: 12px;
      }
    }
  }

  @media (width <= 600px) {
    .empty-editor {
      h3 {
        font-size: 18px;
      }

      p {
        font-size: 14px;
      }

      .empty-icon {
        font-size: 56px;
      }
    }

    .editor-tabs {
      padding: 0 8px;

      .tab-item {
        padding: 8px 10px;
        font-size: 12px;

        .el-icon {
          font-size: 14px;
        }
      }
    }

    .markdown-input {
      padding: 12px;
      font-size: 13px;
      line-height: 1.6;
    }

    .markdown-preview {
      padding: 12px;

      :deep(h1) {
        font-size: 24px;
      }

      :deep(h2) {
        font-size: 20px;
      }

      :deep(h3) {
        font-size: 16px;
      }
    }

    .ai-toolbar {
      min-width: 140px;

      .ai-toolbar-header {
        padding: 6px 8px;
        font-size: 11px;
      }

      .ai-actions .el-button {
        padding: 5px 8px;
        font-size: 11px;
      }
    }
  }
</style>
