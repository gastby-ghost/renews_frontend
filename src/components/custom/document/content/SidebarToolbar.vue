<template>
  <div class="sidebar-toolbar">
    <!-- 大纲切换 -->
    <div class="toolbar-item" :class="{ active: showOutline }" @click="$emit('toggle:outline')">
      <el-tooltip content="文档大纲" placement="right" :show-after="800">
        <div class="toolbar-button">
          <el-icon class="toolbar-icon"><Menu /></el-icon>
          <span class="toolbar-label">大纲</span>
        </div>
      </el-tooltip>
    </div>

    <!-- 统计信息切换 -->
    <div class="toolbar-item" :class="{ active: showStats }" @click="$emit('toggle:stats')">
      <el-tooltip content="文档统计" placement="right" :show-after="800">
        <div class="toolbar-button">
          <el-icon class="toolbar-icon"><DataAnalysis /></el-icon>
          <span class="toolbar-label">统计</span>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Menu, DataAnalysis } from '@element-plus/icons-vue'

  defineOptions({ name: 'SidebarToolbar' })

  interface Props {
    showOutline: boolean
    showStats: boolean
  }

  defineProps<Props>()

  defineEmits<{
    'toggle:outline': []
    'toggle:stats': []
  }>()
</script>

<style scoped lang="scss">
  .sidebar-toolbar {
    position: relative;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 16px;
    align-items: center;
    justify-content: flex-start;
    padding: 16px 12px;
    background: linear-gradient(
      180deg,
      var(--el-fill-color-lighter) 0%,
      var(--el-fill-color-light) 100%
    );
    border-right: 1px solid var(--el-border-color-lighter);

    // 添加微妙的背景装饰
    &::after {
      position: absolute;
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
      content: '';
      background: linear-gradient(
        180deg,
        transparent 0%,
        var(--el-color-primary-light-8) 50%,
        transparent 100%
      );
      opacity: 0.3;
    }
  }

  .toolbar-item {
    position: relative;
    width: 100%;
    max-width: 48px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &::before {
      position: absolute;
      top: 50%;
      left: 50%;
      z-index: 0;
      width: 40px;
      height: 40px;
      content: '';
      background: var(--el-color-primary-light-9);
      border-radius: 12px;
      opacity: 0;
      transition: all 0.3s ease;
      transform: translate(-50%, -50%);
    }

    &:hover {
      transform: translateX(2px);

      &::before {
        width: 48px;
        height: 48px;
        background: var(--el-color-primary-light-8);
        opacity: 1;
      }

      .toolbar-button {
        transform: scale(1.05);
      }

      .toolbar-label {
        opacity: 1;
        transform: translateX(4px);
      }
    }

    &.active {
      &::before {
        width: 48px;
        height: 48px;
        background: var(--el-color-primary-light-7);
        opacity: 1;
      }

      .toolbar-button {
        .toolbar-icon {
          color: var(--el-color-primary);
          transform: scale(1.1);
        }

        .toolbar-label {
          font-weight: 600;
          color: var(--el-color-primary);
        }
      }
    }
  }

  .toolbar-button {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    width: 100%;
    padding: 8px 4px;
    background: transparent;
    border: none;
    border-radius: 12px;
    transition: all 0.3s ease;

    .toolbar-icon {
      font-size: 18px;
      line-height: 1;
      color: var(--el-text-color-regular);
      transition: all 0.3s ease;
    }

    .toolbar-label {
      font-size: 11px;
      font-weight: 500;
      line-height: 1;
      color: var(--el-text-color-secondary);
      text-align: center;
      white-space: nowrap;
      opacity: 0.8;
      transition: all 0.3s ease;
    }
  }

  // 平板设备
  @media (width <= 900px) {
    .sidebar-toolbar {
      gap: 12px;
      padding: 0 8px;

      &::before {
        height: 90px;
      }

      .toolbar-item {
        max-width: 44px;

        .toolbar-button {
          gap: 3px;
          padding: 6px 3px;

          .toolbar-icon {
            font-size: 16px;
          }

          .toolbar-label {
            font-size: 10px;
          }
        }
      }
    }
  }

  // 移动端
  @media (width <= 768px) {
    .sidebar-toolbar {
      flex-direction: row;
      gap: 16px;
      justify-content: center;
      padding: 8px 12px;
      background: var(--el-fill-color-light);
      border-right: none;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &::before {
        display: none;
      }

      &::after {
        display: none;
      }

      .toolbar-item {
        flex-direction: row;
        max-width: 60px;

        .toolbar-button {
          flex-direction: row;
          gap: 6px;
          padding: 8px 12px;

          .toolbar-icon {
            font-size: 16px;
          }

          .toolbar-label {
            font-size: 12px;
            opacity: 1;
          }
        }

        &:hover {
          transform: translateY(-2px);

          .toolbar-label {
            transform: translateX(0);
          }
        }
      }
    }
  }

  // 小屏幕手机
  @media (width <= 480px) {
    .sidebar-toolbar {
      gap: 12px;
      padding: 6px 8px;

      &::before,
      &::after {
        display: none;
      }

      .toolbar-item {
        max-width: 50px;

        .toolbar-button {
          gap: 4px;
          padding: 6px 8px;

          .toolbar-icon {
            font-size: 14px;
          }

          .toolbar-label {
            font-size: 10px;
          }
        }

        &:hover {
          transform: translateY(-1px);

          .toolbar-label {
            transform: translateX(0);
          }
        }
      }
    }
  }
</style>
