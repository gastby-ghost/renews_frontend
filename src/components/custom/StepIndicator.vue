<template>
  <div class="step-indicator" :class="[`size-${size}`, { compact: compact }]">
    <div v-for="(step, index) in steps" :key="index" class="step-wrapper">
      <!-- 步骤项 -->
      <div
        :class="[
          'step-item',
          {
            active: step.status === 'active',
            completed: step.status === 'completed',
            pending: step.status === 'pending' || !step.status
          }
        ]"
      >
        <div class="step-number">
          <!-- 自定义图标插槽 -->
          <slot v-if="$slots.icon" name="icon" :step="step" :index="index" :status="step.status" />

          <!-- 完成状态显示 -->
          <el-icon v-else-if="step.status === 'completed'" color="currentColor">
            <component :is="completedIcon" />
          </el-icon>

          <!-- 数字显示（仅在未提供自定义图标且非完成状态时显示） -->
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="step-label">
          <slot
            v-if="$slots.label"
            name="label"
            :step="step"
            :index="index"
            :status="step.status"
          />
          <span v-else>{{ step.label }}</span>
        </div>
      </div>

      <!-- 连接器（除了最后一个步骤） -->
      <div
        v-if="index < steps.length - 1"
        :class="[
          'step-connector',
          {
            active: step.status === 'active',
            completed: step.status === 'completed'
          }
        ]"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Check } from '@element-plus/icons-vue'

  export interface Step {
    label: string
    status?: 'active' | 'completed' | 'pending'
    icon?: any // 可选：自定义图标组件
  }

  interface Props {
    steps: Step[]
    size?: 'default' | 'small' | 'large'
    compact?: boolean // 是否紧凑模式
    completedIcon?: any // 自定义完成图标
  }

  withDefaults(defineProps<Props>(), {
    size: 'default',
    compact: false,
    completedIcon: Check
  })
</script>

<style scoped lang="scss">
  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: var(--el-bg-color);
    border-radius: 8px;

    // 尺寸变体
    &.size-small {
      padding: 15px;

      .step-item .step-number {
        width: 30px;
        height: 30px;
        margin-bottom: 6px;
        font-size: 12px;

        .el-icon {
          font-size: 16px;
        }
      }

      .step-item .step-label {
        font-size: 12px;
      }

      .step-connector {
        margin-top: -15px;
      }
    }

    &.size-large {
      padding: 24px;

      .step-item .step-number {
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
        font-size: 18px;

        .el-icon {
          font-size: 24px;
        }
      }

      .step-item .step-label {
        font-size: 16px;
      }
    }

    // 紧凑模式
    &.compact {
      padding: 12px;

      .step-item .step-number {
        margin-bottom: 4px;
      }

      .step-connector {
        margin-top: -15px;
      }
    }
  }

  .step-wrapper {
    display: flex;
    align-items: center;
  }

  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .step-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      margin-bottom: 8px;
      font-weight: bold;
      color: var(--el-text-color-secondary);
      background: var(--el-border-color);
      border-radius: 50%;
      transition: all 0.3s;

      .el-icon {
        font-size: 20px;
      }

      // 确保自定义插槽内容也应用样式
      :slotted(*) {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
    }

    .step-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      text-align: center;
      transition: all 0.3s;
    }

    &.active {
      .step-number {
        color: white;
        background: var(--el-color-primary);
      }

      .step-label {
        font-weight: 500;
        color: var(--el-color-primary);
      }
    }

    &.completed {
      .step-number {
        color: white;
        background: var(--el-color-success);
      }

      .step-label {
        color: var(--el-color-success);
      }
    }
  }

  .step-connector {
    width: 60px;
    height: 2px;
    margin: 0 20px;
    margin-top: -20px;
    background: var(--el-border-color);
    transition: background 0.3s;

    &.active {
      background: var(--el-color-primary);
    }

    &.completed {
      background: var(--el-color-success);
    }
  }

  @media (width <= 768px) {
    .step-indicator {
      padding: 12px;
    }

    .step-indicator.size-small {
      padding: 10px;
    }

    .step-indicator.size-large {
      padding: 16px;
    }

    .step-connector {
      width: 40px;
      margin: 0 10px;
    }
  }
</style>
