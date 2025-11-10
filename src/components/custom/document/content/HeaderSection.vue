<template>
  <div class="editor-header">
    <div class="document-info">
      <div class="document-title-row">
        <h2>{{ documentTitle }}</h2>
        <div class="editor-actions">
          <!-- AI生成按钮 -->
          <el-button
            @click="generateAIContent"
            :loading="generatingContent"
            type="primary"
            size="small"
          >
            <el-icon><MagicStick /></el-icon>
            AI生成
          </el-button>

          <!-- 操作下拉菜单 -->
          <el-dropdown trigger="click">
            <el-button size="small">
              操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="saveContent">
                  <el-icon><Check /></el-icon>
                  保存文档
                </el-dropdown-item>
                <el-dropdown-item @click="exportContent" :disabled="!hasContent">
                  <el-icon><Download /></el-icon>
                  导出文档
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 简化的文档信息 -->
      <div class="document-meta">
        <div class="primary-stats">
          <span class="stat-item">
            <el-icon><Document /></el-icon>
            {{ stats.characters }}字
          </span>
          <span class="stat-item">
            <el-icon><Clock /></el-icon>
            约{{ stats.readingTime }}分钟
          </span>
        </div>
        <div class="secondary-info">
          <span class="auto-save" v-if="lastSaved.includes('自动保存')">
            <el-icon><RefreshRight /></el-icon>
            {{ lastSaved }}
          </span>
          <span class="manual-save" v-else>{{ lastSaved }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    Document,
    Clock,
    MagicStick,
    Check,
    Download,
    ArrowDown,
    RefreshRight
  } from '@element-plus/icons-vue'

  interface Stats {
    characters: number
    readingTime: number
    paragraphs: number
    readabilityScore: number
  }

  defineProps<{
    documentTitle: string
    generatingContent: boolean
    hasContent: boolean
    stats: Stats
    lastSaved: string
  }>()

  const emit = defineEmits<{
    (e: 'generate-ai-content'): void
    (e: 'save-content'): void
    (e: 'export-content'): void
  }>()

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
    gap: 16px;
    padding-bottom: 16px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .document-info {
    flex: 1;
  }

  .document-title-row {
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: space-between;

    h2 {
      flex: 1;
      min-width: 0;
      margin: 0;
      overflow: hidden;
      font-size: 22px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .editor-actions {
    display: flex;
    flex-shrink: 0;
    gap: 12px;
    align-items: center;

    .primary-actions {
      .el-button {
        font-weight: 500;
      }
    }
  }

  .document-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .primary-stats {
      display: flex;
      gap: 20px;

      .stat-item {
        display: flex;
        gap: 6px;
        align-items: center;
        font-size: 13px;
        color: var(--el-text-color-regular);

        .el-icon {
          font-size: 14px;
          color: var(--el-color-primary);
        }
      }
    }

    .secondary-info {
      .auto-save,
      .manual-save {
        display: flex;
        gap: 4px;
        align-items: center;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        .el-icon {
          font-size: 12px;
        }
      }

      .auto-save {
        color: var(--el-color-success);
      }
    }
  }

  @media (width <= 900px) {
    .editor-header {
      gap: 12px;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .document-title-row {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;

      h2 {
        font-size: 20px;
        white-space: normal;
      }
    }

    .editor-actions {
      justify-content: space-between;
      width: 100%;
    }

    .document-meta {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;

      .primary-stats {
        gap: 16px;
      }
    }
  }

  @media (width <= 600px) {
    .document-title-row h2 {
      font-size: 18px;
    }

    .editor-actions {
      gap: 8px;

      .el-button {
        padding: 6px 12px;
        font-size: 12px;
      }
    }

    .document-meta .primary-stats {
      flex-wrap: wrap;
      gap: 12px;

      .stat-item {
        font-size: 12px;
      }
    }
  }
</style>
