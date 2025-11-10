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
      <!-- Markdown 编辑器 -->
      <div v-show="!showPreview" class="markdown-editor" ref="editorContainer">
        <textarea
          ref="markdownTextarea"
          :value="content"
          class="markdown-input"
          placeholder="使用 Markdown 语法开始写作..."
          @input="handleContentChange"
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
</template>

<script setup lang="ts">
  import { Brush, Expand, ZoomOut, RefreshRight, Refresh } from '@element-plus/icons-vue'

  interface ToolbarPosition {
    top: number
    left: number
  }

  defineProps<{
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

  const translateSelection = () => {
    emit('translate-selection')
  }

  const rewriteSelection = () => {
    emit('rewrite-selection')
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

  @media (width <= 900px) {
    .empty-editor {
      h3 {
        font-size: 18px;
      }
    }

    .markdown-input {
      padding: 12px;
      font-size: 13px;
    }

    .markdown-preview {
      padding: 12px;
    }
  }

  @media (width <= 600px) {
    .empty-editor {
      h3 {
        font-size: 16px;
      }

      p {
        font-size: 13px;
      }
    }

    .markdown-input {
      padding: 12px;
      font-size: 13px;
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
  }
</style>
