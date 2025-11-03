<template>
  <div class="step-indicator">
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
          <el-icon v-if="step.status === 'completed'" color="currentColor">
            <Check />
          </el-icon>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="step-label">{{ step.label }}</div>
      </div>

      <!-- 连接器（除了最后一个步骤） -->
      <div
        v-if="index < steps.length - 1"
        :class="[
          'step-connector',
          {
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
  }

  interface Props {
    steps: Step[]
  }

  defineProps<Props>()
</script>

<style scoped lang="scss">
  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: var(--el-bg-color);
    border-radius: 8px;
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
    }

    .step-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
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

    &.completed {
      background: var(--el-color-success);
    }
  }

  @media (width <= 768px) {
    .step-indicator {
      padding: 15px;
    }

    .step-connector {
      width: 40px;
      margin: 0 10px;
    }
  }
</style>
