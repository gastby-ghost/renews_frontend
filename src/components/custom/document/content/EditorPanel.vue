<template>
  <div class="editor-panel">
    <EditorEmptyState v-if="!hasContent && !showPreview" @generate="generateAIContent" />

    <div v-else class="editor-wrapper">
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

          <!-- AI 工具栏 -->
          <AIToolbar
            v-if="showSelectionToolbar"
            :position="toolbarPosition"
            @polish="polishSelection"
            @expand="expandSelection"
            @summarize="$emit('summarize-selection')"
            @translate="$emit('translate-selection')"
            @rewrite="$emit('rewrite-selection')"
          />
        </div>

        <!-- Markdown 预览 -->
        <div v-show="showPreview" class="markdown-preview" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Edit, View } from '@element-plus/icons-vue'
  import EditorEmptyState from './EditorEmptyState.vue'
  import AIToolbar from './AIToolbar.vue'

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
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .editor-wrapper {
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
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .markdown-editor {
    position: relative;
    display: block;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .markdown-input {
    display: block;
    width: 100%;
    height: 100%;
    padding: 24px;
    overflow: auto;
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
  }

  @media (width <= 600px) {
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
  }
</style>
