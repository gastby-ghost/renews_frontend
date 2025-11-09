<template>
  <div class="art-card title-section">
    <div class="title-header" @click="titleCollapsed = !titleCollapsed">
      <div class="title-info">
        <h3>
          <el-icon><Document /></el-icon>
          当前标题
        </h3>
        <p class="title-subtitle">查看选中标题的详细信息和研究角度</p>
      </div>
      <div class="title-controls">
        <el-tag v-if="selectedTitle" type="primary" size="large"> 已选择标题 </el-tag>
        <el-tag v-else type="info" size="large"> 未选择标题 </el-tag>
        <el-button :icon="titleCollapsed ? ArrowDown : ArrowUp" link>
          {{ titleCollapsed ? '展开' : '收起' }}
        </el-button>
      </div>
    </div>

    <el-collapse-transition>
      <div v-show="!titleCollapsed" class="title-content">
        <div v-if="selectedTitle" class="title-details">
          <!-- 标题主体信息 -->
          <div class="title-main">
            <div class="title-text">
              <h4>{{ selectedTitle }}</h4>
              <div class="title-meta">
                <el-tag type="success" size="small">选题阶段已确认</el-tag>
                <span class="generation-date">
                  生成时间：{{ new Date().toLocaleDateString() }}
                </span>
              </div>
            </div>

            <div v-if="titleDescription" class="title-description-inline">
              <div class="description-icon">
                <el-icon><ChatDotSquare /></el-icon>
              </div>
              <div class="description-content">
                <span class="description-label">研究角度：</span>
                <span class="description-text">{{ titleDescription }}</span>
              </div>
            </div>
          </div>

          <div v-if="researchBrief" class="research-brief">
            <h5>
              <el-icon><Reading /></el-icon>
              研究简报
            </h5>
            <div class="brief-content">
              {{ researchBrief }}
            </div>
          </div>

          <div class="title-actions">
            <el-button size="small" @click="editTitle" class="art-button">
              <el-icon><Edit /></el-icon>
              编辑标题
            </el-button>
            <el-button
              size="small"
              type="primary"
              plain
              @click="viewSearchResults"
              class="art-button"
            >
              <el-icon><Search /></el-icon>
              查看搜索结果
            </el-button>
          </div>
        </div>

        <div v-else class="empty-title">
          <el-empty description="暂未选择标题">
            <template #image>
              <el-icon :size="60"><DocumentAdd /></el-icon>
            </template>
            <div class="empty-title-actions">
              <p>请先返回选题页面选择标题</p>
              <el-button type="primary" @click="goBackToTitleSelection">
                <el-icon><ArrowLeft /></el-icon>
                返回选题
              </el-button>
            </div>
          </el-empty>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import {
    Document,
    DocumentAdd,
    Edit,
    Search,
    ChatDotSquare,
    Reading,
    ArrowLeft,
    ArrowDown,
    ArrowUp
  } from '@element-plus/icons-vue'

  const router = useRouter()

  // Props
  const props = defineProps<{
    selectedTitle?: string
    titleDescription?: string
    researchBrief?: string
    projectId: string
  }>()

  // Emits
  const emit = defineEmits<{
    (e: 'editTitle'): void
    (e: 'viewSearchResults'): void
  }>()

  // 标题分区状态
  const titleCollapsed = ref(false)

  const editTitle = () => {
    ElMessage.info('编辑标题功能开发中...')
    emit('editTitle')
  }

  const viewSearchResults = () => {
    ElMessage.info('查看搜索结果功能开发中...')
    emit('viewSearchResults')
  }

  const goBackToTitleSelection = () => {
    router.push(`/document-generation/topic-selection/${props.projectId}`)
  }
</script>

<style scoped lang="scss">
  .title-section {
    margin-bottom: var(--art-spacing-lg, 24px);
    overflow: hidden;
  }

  .title-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--art-padding-lg, 24px) var(--art-padding-xl, 32px);
    cursor: pointer;
    background: var(--art-fill-color-light);
    border-bottom: 1px solid var(--art-border-color);
    transition: all 0.3s ease;

    &:hover {
      background: var(--art-fill-color);
    }

    .title-info {
      flex: 1;

      h3 {
        display: flex;
        gap: var(--art-spacing-sm, 8px);
        align-items: center;
        margin: 0 0 var(--art-spacing-xs, 4px);
        font-size: var(--art-font-size-base-lg, 18px);
        font-weight: var(--art-font-weight-medium, 500);
        color: var(--art-text-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }

      .title-subtitle {
        margin: 0;
        font-size: var(--art-font-size-xs, 13px);
        line-height: var(--art-line-height-normal, 1.4);
        color: var(--art-text-color-secondary);
      }
    }

    .title-controls {
      display: flex;
      gap: var(--art-spacing-lg, 16px);
      align-items: center;
    }
  }

  .title-content {
    padding: var(--art-padding-xl, 32px);
    background: var(--art-main-bg-color);
  }

  .title-details {
    .title-main {
      margin-bottom: var(--art-spacing-xl, 32px);
    }

    .title-text {
      h4 {
        margin: 0 0 var(--art-spacing-md, 16px);
        font-size: var(--art-font-size-xl, 24px);
        font-weight: var(--art-font-weight-semibold, 600);
        line-height: var(--art-line-height-relaxed, 1.6);
        color: var(--art-text-color-primary);
      }

      .title-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--art-spacing-lg, 20px);
        align-items: center;

        .generation-date {
          font-size: var(--art-font-size-sm, 14px);
          color: var(--art-text-color-secondary);
        }
      }
    }

    .title-description-inline {
      display: flex;
      gap: var(--art-spacing-sm, 8px);
      align-items: flex-start;
      padding: var(--art-spacing-md, 12px);
      margin-top: var(--art-spacing-md, 16px);
      background: var(--art-fill-color-blank);
      border: 1px solid var(--art-border-color);
      border-left: 3px solid var(--el-color-primary);
      border-radius: var(--art-border-radius-sm, 6px);

      .description-icon {
        flex-shrink: 0;
        margin-top: 2px;
        color: var(--el-color-primary);

        .el-icon {
          font-size: var(--art-font-size-base, 16px);
        }
      }

      .description-content {
        display: flex;
        flex: 1;
        gap: var(--art-spacing-xs, 4px);
        align-items: flex-start;

        .description-label {
          flex-shrink: 0;
          font-size: var(--art-font-size-sm, 14px);
          font-weight: var(--art-font-weight-medium, 500);
          color: var(--art-text-color-secondary);
        }

        .description-text {
          flex: 1;
          font-size: var(--art-font-size-sm, 14px);
          line-height: var(--art-line-height-relaxed, 1.6);
          color: var(--art-text-color-primary);
        }
      }
    }

    .research-brief {
      margin-bottom: var(--art-spacing-xl, 32px);

      h5 {
        display: flex;
        gap: var(--art-spacing-sm, 8px);
        align-items: center;
        margin: 0 0 var(--art-spacing-md, 16px);
        font-size: var(--art-font-size-base, 16px);
        font-weight: var(--art-font-weight-medium, 500);
        color: var(--art-text-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }

      .brief-content {
        padding: var(--art-spacing-lg, 20px);
        margin: 0;
        font-size: var(--art-font-size-sm, 14px);
        line-height: var(--art-line-height-relaxed, 1.6);
        color: var(--art-text-color-regular);
        background: var(--art-fill-color-light);
        border: 1px solid var(--art-border-color);
        border-left: 4px solid var(--el-color-primary);
        border-radius: var(--art-border-radius, 8px);
      }
    }

    .title-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--art-spacing-md, 12px);
    }
  }

  .empty-title {
    padding: var(--art-padding-2xl, 60px) var(--art-padding-lg, 24px);
    text-align: center;

    p {
      margin: var(--art-spacing-md, 12px) 0;
      font-size: var(--art-font-size-sm, 14px);
      line-height: var(--art-line-height-relaxed, 1.6);
      color: var(--art-text-color-secondary);
    }

    .el-button {
      margin-top: var(--art-spacing-md, 12px);
    }
  }

  // 移动端适配
  @media (max-width: $device-phone) {
    .title-header {
      padding: var(--art-padding-md, 16px) var(--art-padding-lg, 20px);
    }

    .title-info {
      h3 {
        font-size: var(--art-font-size-base, 16px);
      }

      .title-subtitle {
        font-size: var(--art-font-size-xs, 12px);
      }
    }

    .title-controls {
      gap: var(--art-spacing-md, 12px);
    }

    .title-content {
      padding: var(--art-padding-lg, 20px);
    }

    .title-text {
      h4 {
        font-size: var(--art-font-size-lg, 20px);
      }
    }

    .title-meta {
      flex-direction: column;
      gap: var(--art-spacing-sm, 8px);
      align-items: flex-start;
    }

    .title-description-inline {
      .description-content {
        flex-direction: column;
        gap: var(--art-spacing-xs, 4px);

        .description-label {
          font-size: var(--art-font-size-xs, 12px);
        }

        .description-text {
          font-size: var(--art-font-size-xs, 12px);
        }
      }
    }

    .title-actions {
      flex-direction: column;
      align-items: stretch;

      .el-button {
        width: 100%;
      }
    }
  }
</style>
