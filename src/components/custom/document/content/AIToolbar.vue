<template>
  <div class="ai-toolbar" :style="{ top: position.top + 'px', left: position.left + 'px' }">
    <div class="ai-toolbar-header">
      <el-icon class="ai-icon"><MagicStick /></el-icon>
      <span>AI 助手</span>
    </div>
    <div class="ai-actions">
      <div class="ai-action-group">
        <el-button @click="$emit('polish')" class="ai-action-btn" text>
          <el-icon><Brush /></el-icon>
          <span class="btn-text">润色</span>
        </el-button>
        <el-button @click="$emit('expand')" class="ai-action-btn" text>
          <el-icon><Expand /></el-icon>
          <span class="btn-text">扩写</span>
        </el-button>
        <el-button @click="$emit('summarize')" class="ai-action-btn" text>
          <el-icon><Document /></el-icon>
          <span class="btn-text">总结</span>
        </el-button>
        <el-button @click="$emit('translate')" class="ai-action-btn" text>
          <el-icon><Translate /></el-icon>
          <span class="btn-text">翻译</span>
        </el-button>
        <el-button @click="$emit('rewrite')" class="ai-action-btn" text>
          <el-icon><Refresh /></el-icon>
          <span class="btn-text">改写</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { MagicStick, Brush, Expand, Document, Translate, Refresh } from '@element-plus/icons-vue'

  defineOptions({ name: 'AIToolbar' })

  interface ToolbarPosition {
    top: number
    left: number
  }

  interface Props {
    position: ToolbarPosition
  }

  defineProps<Props>()

  defineEmits<{
    polish: []
    expand: []
    summarize: []
    translate: []
    rewrite: []
  }>()
</script>

<style scoped lang="scss">
  .ai-toolbar {
    position: absolute;
    z-index: 100;
    min-width: 200px;
    overflow: hidden;
    background: var(--art-main-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    box-shadow: 0 8px 32px rgb(0 0 0 / 20%);
    animation: slideIn 0.2s ease;

    .ai-toolbar-header {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 600;
      color: var(--el-color-primary);
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-9) 0%,
        var(--el-color-primary-light-8) 100%
      );
      border-bottom: 1px solid var(--el-border-color-lighter);

      .ai-icon {
        font-size: 15px;
      }
    }

    .ai-actions {
      display: flex;
      flex-direction: column;
      padding: 8px 6px;

      .ai-action-group {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .ai-action-btn {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          padding: 8px 10px;
          font-size: 13px;
          color: var(--el-text-color-regular);
          text-align: left;
          border-radius: 6px;
          transition: all 0.15s ease;

          &:hover {
            color: var(--el-color-primary);
            background: var(--el-fill-color-light);
            transform: translateX(2px);
          }

          .el-icon {
            flex-shrink: 0;
            margin-right: 8px;
            font-size: 15px;
            color: var(--el-color-primary);
          }

          .btn-text {
            font-weight: 500;
          }
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

  @media (width <= 900px) {
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
