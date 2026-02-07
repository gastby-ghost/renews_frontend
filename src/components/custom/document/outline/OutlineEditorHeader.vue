<template>
  <div class="ai-function-section">
    <div class="ai-buttons-container">
      <el-tooltip
        content="基于您的标题和素材，AI将生成结构化的大纲（保留现有内容）"
        placement="top"
        :disabled="canGenerateFromTitle"
      >
        <el-button
          @click="$emit('generate-ai-outline')"
          :loading="generatingOutline"
          :disabled="!canGenerateFromTitle"
          type="primary"
          size="large"
          class="ai-function-button outline-button"
        >
          <el-icon class="button-icon"><MagicStick /></el-icon>
          <span class="button-text">智能大纲生成</span>
        </el-button>
      </el-tooltip>

      <el-tooltip
        content="AI将分析章节内容，自动匹配最相关的素材到对应章节"
        placement="top"
        :disabled="getAllMaterials.length > 0 && generatedOutline.length > 0"
      >
        <el-button
          @click="$emit('ai-bind-materials')"
          :loading="isBindingMaterials"
          :disabled="
            isBindingMaterials || getAllMaterials.length === 0 || generatedOutline.length === 0
          "
          type="success"
          size="large"
          class="ai-function-button binding-button"
        >
          <el-icon class="button-icon"><Link /></el-icon>
          <span class="button-text">智能素材绑定</span>
        </el-button>
      </el-tooltip>

      <el-tooltip
        content="一键完成大纲生成、素材检索和智能绑定（将清空当前大纲）"
        placement="top"
        :disabled="canGenerateFromTitle && getAllMaterials.length > 0"
      >
        <el-button
          @click="$emit('generate-ai-complete-outline')"
          :loading="generatingOutline"
          :disabled="!canGenerateFromTitle || getAllMaterials.length === 0"
          type="warning"
          size="large"
          class="ai-function-button complete-button"
        >
          <el-icon class="button-icon"><Cpu /></el-icon>
          <span class="button-text">完整智能生成</span>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 状态提示区域 -->
    <div class="status-section">
      <div v-if="!canGenerateFromTitle && getAllMaterials.length === 0" class="status-hint">
        <el-icon><WarningFilled /></el-icon>
        <span>请先选择标题并完善研究简报，然后选择素材</span>
      </div>
      <div v-else-if="!canGenerateFromTitle" class="status-hint">
        <el-icon><WarningFilled /></el-icon>
        <span>请先选择标题并完善研究简报</span>
      </div>
      <div v-else-if="getAllMaterials.length === 0" class="status-hint">
        <el-icon><WarningFilled /></el-icon>
        <span>请先在标题区域选择素材</span>
      </div>
      <div v-else-if="bindingResult" class="status-success">
        <el-icon><Check /></el-icon>
        <span
          >已绑定 {{ bindingResult.total_materials_bound }} 个素材到
          {{ bindingResult.total_sections }} 个章节</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { MagicStick, Link, Cpu, WarningFilled, Check } from '@element-plus/icons-vue'
  import type { Material } from '@/types/core/material'
  import type { MaterialBindResult } from './types'

  interface Props {
    generatedOutline: Array<{
      title: string
      content_direction?: string
      data_requirements?: string[]
    }>
    canGenerateFromTitle: boolean
    generatingOutline: boolean
    isBindingMaterials: boolean
    bindingResult: MaterialBindResult | null
    getAllMaterials: Material[]
  }

  defineProps<Props>()

  defineEmits<{
    'generate-ai-outline': []
    'generate-ai-complete-outline': []
    'ai-bind-materials': []
  }>()
</script>

<style scoped lang="scss">
  .ai-function-section {
    padding: var(--art-spacing-lg, 24px);
    margin-bottom: var(--art-spacing-lg, 24px);
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius-lg, 12px);
    box-shadow: 0 2px 8px rgb(0 0 0 / 4%);

    .ai-buttons-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--art-spacing-md, 16px);
      justify-content: center;
      margin-bottom: var(--art-spacing-md, 16px);

      .ai-function-button {
        display: flex;
        flex: 1;
        gap: var(--art-spacing-sm, 8px);
        align-items: center;
        justify-content: center;
        min-width: 200px;
        max-width: 280px;
        height: 56px;
        font-size: var(--art-font-size-base, 16px);
        font-weight: var(--art-font-weight-medium, 500);
        border: none;
        border-radius: var(--art-border-radius-lg, 12px);
        transition: all 0.3s ease;

        .button-icon {
          margin-right: var(--art-spacing-xs, 4px);
          font-size: 20px;
        }

        .button-text {
          font-size: var(--art-font-size-base, 16px);
        }

        &.outline-button {
          background: linear-gradient(
            135deg,
            var(--el-color-primary) 0%,
            var(--el-color-primary-light-3) 100%
          );
          box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.25);

          &:hover:not(:disabled) {
            box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.35);
            transform: translateY(-2px);
          }
        }

        &.binding-button {
          background: linear-gradient(
            135deg,
            var(--el-color-success) 0%,
            var(--el-color-success-light-3) 100%
          );
          box-shadow: 0 4px 12px rgba(var(--el-color-success-rgb), 0.25);

          &:hover:not(:disabled) {
            box-shadow: 0 6px 20px rgba(var(--el-color-success-rgb), 0.35);
            transform: translateY(-2px);
          }
        }

        &.complete-button {
          background: linear-gradient(
            135deg,
            var(--el-color-warning) 0%,
            var(--el-color-warning-light-3) 100%
          );
          box-shadow: 0 4px 12px rgba(var(--el-color-warning-rgb), 0.25);

          &:hover:not(:disabled) {
            box-shadow: 0 6px 20px rgba(var(--el-color-warning-rgb), 0.35);
            transform: translateY(-2px);
          }
        }
      }
    }

    .status-section {
      .status-hint,
      .status-success {
        display: flex;
        gap: var(--art-spacing-sm, 8px);
        align-items: center;
        justify-content: center;
        padding: var(--art-spacing-sm, 12px) var(--art-spacing-lg, 20px);
        font-size: var(--art-font-size-sm, 14px);
        border-radius: var(--art-border-radius, 8px);

        .el-icon {
          font-size: 16px;
        }
      }

      .status-hint {
        color: var(--el-color-warning);
        background: var(--el-color-warning-light-9);
        border: 1px solid var(--el-color-warning-light-7);
      }

      .status-success {
        color: var(--el-color-success);
        background: var(--el-color-success-light-9);
        border: 1px solid var(--el-color-success-light-7);
      }
    }
  }

  @media (max-width: $device-ipad) {
    .ai-function-section {
      padding: var(--art-spacing-md, 16px);

      .ai-buttons-container {
        gap: var(--art-spacing-md, 12px);

        .ai-function-button {
          min-width: 180px;
          height: 52px;
          font-size: var(--art-font-size-sm, 15px);
        }
      }

      .status-section {
        .status-hint,
        .status-success {
          padding: var(--art-spacing-sm, 8px) var(--art-spacing-md, 12px);
          font-size: var(--art-font-size-xs, 12px);
          text-align: center;

          .el-icon {
            font-size: 14px;
          }
        }
      }
    }
  }

  @media (max-width: $device-phone) {
    .ai-function-section {
      .ai-buttons-container {
        flex-direction: column;
        gap: var(--art-spacing-md, 12px);

        .ai-function-button {
          width: 100%;
          min-width: auto;
          max-width: none;
          height: 48px;
          font-size: var(--art-font-size-sm, 14px);

          .button-icon {
            font-size: 18px;
          }

          .button-text {
            font-size: var(--art-font-size-sm, 14px);
          }
        }
      }
    }
  }
</style>
