<template>
  <div class="outline-panel art-card" :class="{ 'outline-collapsed': !showOutline }">
    <div class="panel-header">
      <el-button @click="toggleOutline" size="small" text>
        <el-icon><List /></el-icon>
        <span v-if="showOutline">大纲</span>
      </el-button>
    </div>

    <el-collapse-transition>
      <div v-show="showOutline" class="outline-content">
        <div
          v-for="(section, index) in outline"
          :key="section.id"
          class="outline-item"
          :class="{ active: currentSection === index }"
          @click="navigateToSection(index)"
          :style="{ paddingLeft: section.level * 20 + 'px' }"
        >
          <span class="outline-number">{{ index + 1 }}</span>
          <span class="outline-title">{{ section.title }}</span>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
  import { List } from '@element-plus/icons-vue'

  interface OutlineItem {
    id: string
    title: string
    level: number
  }

  interface Props {
    showOutline: boolean
    outline: OutlineItem[]
    currentSection: number
  }

  interface Emits {
    (e: 'toggle-outline'): void
    (e: 'navigate-to-section', index: number): void
  }

  defineProps<Props>()
  defineEmits<Emits>()
</script>

<style scoped lang="scss">
  .outline-panel {
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: 6px;
    box-shadow: var(--art-box-shadow-sm);
    transition: all 0.3s ease;

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      background: var(--el-fill-color-light);
      border-bottom: 1px solid var(--art-border-color);
      transition: all 0.3s ease;

      .el-button {
        justify-content: center;
        width: 100%;
        padding: 6px 8px;
        font-size: 12px;

        .el-icon {
          font-size: 14px;
        }
      }
    }

    &.outline-collapsed {
      .panel-header {
        min-height: 40px;
        padding: 8px 6px;

        .el-button {
          width: auto;
          padding: 4px 6px;

          span:not(:first-child) {
            display: none;
          }
        }
      }

      .outline-content {
        padding: 0;
      }
    }
  }

  .outline-content {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    transition: padding 0.3s ease;
  }

  .outline-item {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    margin-bottom: 4px;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 4px;
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-fill-color-light);
      border-color: var(--el-color-primary-light-7);
    }

    &.active {
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
      border-left: 3px solid var(--el-color-primary);
    }
  }

  .outline-number {
    min-width: 16px;
    margin-right: 8px;
    font-size: 11px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .outline-title {
    flex: 1;
    overflow: hidden;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (width <= 900px) {
    .outline-panel.outline-collapsed {
      .panel-header {
        justify-content: flex-start;
        padding: 12px;

        .el-button {
          width: 100%;
          padding: 8px 12px;
          font-size: 14px;

          span:not(:first-child) {
            display: inline;
          }
        }
      }
    }
  }

  @media (width <= 600px) {
    .outline-panel .outline-content {
      padding: 8px;
    }

    .outline-item {
      padding: 4px 6px;
      margin-bottom: 2px;
      font-size: 11px;
    }

    .outline-number {
      min-width: 14px;
      margin-right: 6px;
      font-size: 10px;
    }

    .outline-title {
      font-size: 11px;
    }
  }
</style>
