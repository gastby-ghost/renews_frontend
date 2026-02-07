<template>
  <div class="empty-outline">
    <div class="empty-content">
      <div class="empty-icon">
        <el-icon><Document /></el-icon>
      </div>
      <div class="empty-text">
        <h4>开始创建您的大纲</h4>
        <p>选择AI智能生成或手动创建，构建专业的文档结构</p>
      </div>
      <div class="quick-actions">
        <div class="action-card" @click="$emit('generate')" :class="{ disabled: !canGenerate }">
          <div class="action-icon ai">
            <el-icon><MagicStick /></el-icon>
          </div>
          <div class="action-text">
            <strong>AI智能生成</strong>
            <small>快速生成专业大纲</small>
          </div>
        </div>
        <div class="action-card" @click="$emit('add-section')" :class="{ disabled: !canAdd }">
          <div class="action-icon manual">
            <el-icon><Plus /></el-icon>
          </div>
          <div class="action-text">
            <strong>手动创建</strong>
            <small>逐步添加章节</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Document, MagicStick, Plus } from '@element-plus/icons-vue'

  interface Props {
    canGenerate: boolean
    canAdd: boolean
  }

  defineProps<Props>()

  defineEmits<{
    generate: []
    'add-section': []
  }>()
</script>

<style scoped lang="scss">
  .empty-outline {
    padding: var(--art-padding-2xl, 60px) var(--art-padding-lg, 24px);
    text-align: center;

    .empty-content {
      max-width: 600px;
      margin: 0 auto;

      .empty-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100px;
        height: 100px;
        margin: 0 auto var(--art-spacing-xl, 32px);
        font-size: 48px;
        color: var(--art-text-color-placeholder);
        background: var(--art-fill-color-light);
        border: 2px dashed var(--art-border-dashed-color);
        border-radius: var(--art-border-radius-lg, 12px);
        transition: all 0.3s ease;

        &:hover {
          color: var(--el-color-primary);
          background: var(--el-color-primary-light-9);
          border-color: var(--el-color-primary-light-6);
        }
      }

      .empty-text {
        margin-bottom: var(--art-spacing-2xl, 40px);

        h4 {
          margin: 0 0 var(--art-spacing-sm, 8px);
          font-size: var(--art-font-size-xl, 24px);
          font-weight: var(--art-font-weight-semibold, 600);
          color: var(--art-text-color-primary);
        }

        p {
          margin: 0;
          font-size: var(--art-font-size-base, 16px);
          line-height: var(--art-line-height-relaxed, 1.6);
          color: var(--art-text-color-secondary);
        }
      }

      .quick-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--art-spacing-lg, 20px);

        .action-card {
          display: flex;
          gap: var(--art-spacing-md, 12px);
          align-items: center;
          padding: var(--art-padding-lg, 20px);
          cursor: pointer;
          background: var(--art-main-bg-color);
          border: 1px solid var(--art-border-color);
          border-radius: var(--art-border-radius, 8px);
          transition: all 0.3s ease;

          &:hover:not(.disabled) {
            border-color: var(--el-color-primary-light-6);
            box-shadow: var(--art-box-shadow-sm);
            transform: translateY(-2px);
          }

          &.disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          .action-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            font-size: 20px;
            border-radius: var(--art-border-radius, 8px);

            &.ai {
              color: var(--el-color-primary);
              background: var(--el-color-primary-light-9);
            }

            &.manual {
              color: var(--el-color-success);
              background: var(--el-color-success-light-9);
            }
          }

          .action-text {
            text-align: left;

            strong {
              display: block;
              margin-bottom: var(--art-spacing-xs, 4px);
              font-size: var(--art-font-size-base, 16px);
              font-weight: var(--art-font-weight-medium, 500);
              color: var(--art-text-color-primary);
            }

            small {
              font-size: var(--art-font-size-sm, 14px);
              color: var(--art-text-color-secondary);
            }
          }
        }
      }
    }
  }

  @media (max-width: $device-phone) {
    .empty-outline {
      .empty-content {
        .quick-actions {
          grid-template-columns: 1fr;
          gap: var(--art-spacing-md, 16px);
        }
      }
    }
  }
</style>
