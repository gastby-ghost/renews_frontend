<template>
  <div class="editor-header">
    <div class="document-info">
      <div class="document-title-row">
        <h2>{{ documentTitle }}</h2>
        <div class="editor-actions">
          <el-button
            @click="togglePreview"
            :type="showPreview ? 'primary' : 'default'"
            size="small"
          >
            <el-icon><View /></el-icon>
            {{ showPreview ? '编辑' : '预览' }}
          </el-button>
          <el-button
            @click="generateAIContent"
            :loading="generatingContent"
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
          <el-button @click="exportContent" :disabled="!hasContent" size="small">
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
</template>

<script setup lang="ts">
  import {
    Document,
    Clock,
    DocumentCopy,
    DataAnalysis,
    View,
    MagicStick,
    Check,
    Download
  } from '@element-plus/icons-vue'

  interface Stats {
    characters: number
    readingTime: number
    paragraphs: number
    readabilityScore: number
  }

  defineProps<{
    documentTitle: string
    showPreview: boolean
    generatingContent: boolean
    hasContent: boolean
    stats: Stats
    lastSaved: string
  }>()

  const emit = defineEmits<{
    (e: 'toggle-preview'): void
    (e: 'generate-ai-content'): void
    (e: 'save-content'): void
    (e: 'export-content'): void
  }>()

  const togglePreview = () => {
    emit('toggle-preview')
  }

  const generateAIContent = () => {
    emit('generate-ai-content')
  }

  const saveContent = () => {
    emit('save-content')
  }

  const exportContent = () => {
    emit('export-content')
  }
</script>

<style scoped lang="scss">
  .editor-header {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 12px;
    padding-bottom: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color);
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

  .editor-actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
  }

  @media (width <= 900px) {
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
  }

  @media (width <= 600px) {
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
  }
</style>
