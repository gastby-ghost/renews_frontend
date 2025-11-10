<template>
  <div class="art-card title-section">
    <div class="title-header" @click="titleCollapsed = !titleCollapsed">
      <div class="title-info">
        <div class="section-indicator">
          <div class="step-number">1</div>
          <div class="step-title">
            <h3>
              <el-icon><Document /></el-icon>
              标题与研究简报
            </h3>
            <div class="status-badges">
              <el-tag v-if="selectedTitle" type="success" size="small" effect="light">
                <el-icon><Check /></el-icon>
                已确认
              </el-tag>
              <el-tag v-else type="warning" size="small" effect="light">
                <el-icon><Warning /></el-icon>
                待选择
              </el-tag>
            </div>
          </div>
        </div>
        <p class="title-subtitle">
          <el-icon><InfoFilled /></el-icon>
          核心研究主题和方向，将作为AI生成大纲的基础
        </p>
      </div>
      <div class="title-controls">
        <div class="completion-indicator">
          <el-progress
            :percentage="selectedTitle ? 100 : 0"
            :stroke-width="6"
            :show-text="false"
            status="success"
          />
          <span class="progress-text">{{ selectedTitle ? '完成' : '待完成' }}</span>
        </div>
        <el-button :icon="titleCollapsed ? ArrowDown : ArrowUp" link>
          {{ titleCollapsed ? '展开详情' : '收起详情' }}
        </el-button>
      </div>
    </div>

    <el-collapse-transition>
      <div v-show="!titleCollapsed" class="title-content">
        <div v-if="selectedTitle" class="title-details">
          <!-- 标题主体信息 -->
          <div class="title-main">
            <div class="title-highlight-badge">
              <el-icon><Star /></el-icon>
              当前选定标题
            </div>
            <div class="title-text">
              <h4>{{ selectedTitle }}</h4>
              <div class="title-meta">
                <div class="meta-item">
                  <el-icon><CircleCheck /></el-icon>
                  <span>选题阶段已确认</span>
                </div>
                <div class="meta-item">
                  <el-icon><Clock /></el-icon>
                  <span>{{ new Date().toLocaleDateString() }}</span>
                </div>
              </div>
            </div>

            <div v-if="titleDescription" class="title-description-card">
              <div class="card-header">
                <el-icon><ChatDotSquare /></el-icon>
                <span class="card-title">研究角度</span>
                <el-tag type="primary" size="small" effect="light">核心指导</el-tag>
              </div>
              <div class="card-content">
                {{ titleDescription }}
              </div>
            </div>
          </div>

          <div v-if="researchBrief" class="research-brief-card">
            <div class="brief-header">
              <div class="brief-title">
                <el-icon><Reading /></el-icon>
                <span>研究简报</span>
              </div>
              <el-tooltip content="研究简报为AI生成大纲提供重要背景信息" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
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
          <div class="empty-content">
            <div class="empty-icon">
              <el-icon><DocumentAdd /></el-icon>
            </div>
            <div class="empty-text">
              <h4>尚未选择研究标题</h4>
              <p>选择一个标题作为您的研究主题，这是生成高质量大纲的第一步</p>
            </div>
            <div class="empty-actions">
              <el-button type="primary" @click="goBackToTitleSelection" size="large">
                <el-icon><ArrowLeft /></el-icon>
                返回选题页面
              </el-button>
            </div>
          </div>
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
    ArrowUp,
    Check,
    Warning,
    InfoFilled,
    Star,
    CircleCheck,
    Clock,
    QuestionFilled
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
    background: linear-gradient(135deg, var(--art-fill-color-light) 0%, var(--art-fill-color) 100%);
    border-bottom: 1px solid var(--art-border-color);
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(
        135deg,
        var(--art-fill-color) 0%,
        var(--art-fill-color-dark) 100%
      );
      box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
      transform: translateY(-1px);
    }

    .title-info {
      flex: 1;

      .section-indicator {
        display: flex;
        gap: var(--art-spacing-md, 12px);
        align-items: flex-start;
        margin-bottom: var(--art-spacing-sm, 8px);

        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          font-size: var(--art-font-size-sm, 14px);
          font-weight: var(--art-font-weight-bold, 700);
          color: white;
          background: var(--el-color-primary);
          border-radius: var(--art-border-radius, 8px);
          box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
        }

        .step-title {
          flex: 1;

          h3 {
            display: flex;
            gap: var(--art-spacing-sm, 8px);
            align-items: center;
            margin: 0 0 var(--art-spacing-xs, 4px);
            font-size: var(--art-font-size-base-lg, 18px);
            font-weight: var(--art-font-weight-semibold, 600);
            color: var(--art-text-color-primary);

            .el-icon {
              color: var(--el-color-primary);
            }
          }

          .status-badges {
            display: flex;
            gap: var(--art-spacing-xs, 4px);
            align-items: center;

            .el-tag {
              display: flex;
              gap: var(--art-spacing-xs, 4px);
              align-items: center;
            }
          }
        }
      }

      .title-subtitle {
        display: flex;
        gap: var(--art-spacing-xs, 4px);
        align-items: center;
        margin: 0;
        font-size: var(--art-font-size-sm, 14px);
        line-height: var(--art-line-height-normal, 1.4);
        color: var(--art-text-color-secondary);

        .el-icon {
          font-size: 14px;
          color: var(--el-color-primary);
        }
      }
    }

    .title-controls {
      display: flex;
      flex-direction: column;
      gap: var(--art-spacing-sm, 8px);
      align-items: flex-end;

      .completion-indicator {
        display: flex;
        flex-direction: column;
        gap: var(--art-spacing-xs, 4px);
        align-items: center;
        min-width: 80px;

        .el-progress {
          width: 60px;
        }

        .progress-text {
          font-size: var(--art-font-size-xs, 12px);
          font-weight: var(--art-font-weight-medium, 500);
          color: var(--art-text-color-secondary);
        }
      }
    }
  }

  .title-content {
    padding: var(--art-padding-xl, 32px);
    background: var(--art-main-bg-color);
  }

  .title-details {
    .title-main {
      margin-bottom: var(--art-spacing-xl, 32px);

      .title-highlight-badge {
        display: inline-flex;
        gap: var(--art-spacing-xs, 4px);
        align-items: center;
        padding: var(--art-spacing-xs, 4px) var(--art-spacing-sm, 8px);
        margin-bottom: var(--art-spacing-md, 16px);
        font-size: var(--art-font-size-xs, 12px);
        font-weight: var(--art-font-weight-medium, 500);
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        border: 1px solid var(--el-color-primary-light-7);
        border-radius: var(--art-border-radius, 16px);

        .el-icon {
          font-size: 12px;
        }
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

          .meta-item {
            display: flex;
            gap: var(--art-spacing-xs, 4px);
            align-items: center;
            font-size: var(--art-font-size-sm, 14px);
            color: var(--art-text-color-secondary);

            .el-icon {
              font-size: 14px;
              color: var(--el-color-success);
            }
          }
        }
      }

      .title-description-card {
        padding: var(--art-padding-lg, 16px);
        margin-top: var(--art-spacing-lg, 20px);
        background: var(--art-fill-color-blank);
        border: 1px solid var(--art-border-color);
        border-left: 4px solid var(--el-color-primary);
        border-radius: var(--art-border-radius, 8px);
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--el-color-primary-light-6);
          box-shadow: var(--art-box-shadow-sm);
        }

        .card-header {
          display: flex;
          gap: var(--art-spacing-sm, 8px);
          align-items: center;
          margin-bottom: var(--art-spacing-sm, 8px);

          .el-icon {
            font-size: 16px;
            color: var(--el-color-primary);
          }

          .card-title {
            font-size: var(--art-font-size-base, 16px);
            font-weight: var(--art-font-weight-medium, 500);
            color: var(--art-text-color-primary);
          }
        }

        .card-content {
          font-size: var(--art-font-size-sm, 14px);
          line-height: var(--art-line-height-relaxed, 1.6);
          color: var(--art-text-color-regular);
        }
      }
    }

    .research-brief-card {
      padding: var(--art-padding-lg, 20px);
      margin-bottom: var(--art-spacing-xl, 32px);
      background: linear-gradient(
        135deg,
        var(--art-fill-color-light) 0%,
        var(--art-fill-color) 100%
      );
      border: 1px solid var(--art-border-color);
      border-radius: var(--art-border-radius, 8px);
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--el-color-primary-light-6);
        box-shadow: var(--art-box-shadow-sm);
      }

      .brief-header {
        display: flex;
        gap: var(--art-spacing-sm, 8px);
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--art-spacing-md, 12px);

        .brief-title {
          display: flex;
          gap: var(--art-spacing-sm, 8px);
          align-items: center;
          font-size: var(--art-font-size-base, 16px);
          font-weight: var(--art-font-weight-medium, 500);
          color: var(--art-text-color-primary);

          .el-icon {
            color: var(--el-color-primary);
          }
        }

        .help-icon {
          color: var(--art-text-color-placeholder);
          cursor: help;
          transition: color 0.3s ease;

          &:hover {
            color: var(--el-color-primary);
          }
        }
      }

      .brief-content {
        padding: var(--art-spacing-md, 12px);
        font-size: var(--art-font-size-sm, 14px);
        line-height: var(--art-line-height-relaxed, 1.6);
        color: var(--art-text-color-regular);
        background: var(--art-main-bg-color);
        border: 1px solid var(--art-border-color-lighter);
        border-radius: var(--art-border-radius-sm, 6px);
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

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 400px;
      margin: 0 auto;

      .empty-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        margin-bottom: var(--art-spacing-lg, 20px);
        font-size: 40px;
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
        margin-bottom: var(--art-spacing-xl, 32px);

        h4 {
          margin: 0 0 var(--art-spacing-sm, 8px);
          font-size: var(--art-font-size-lg, 20px);
          font-weight: var(--art-font-weight-medium, 500);
          color: var(--art-text-color-primary);
        }

        p {
          margin: 0;
          font-size: var(--art-font-size-sm, 14px);
          line-height: var(--art-line-height-relaxed, 1.6);
          color: var(--art-text-color-secondary);
        }
      }

      .empty-actions {
        .el-button {
          min-width: 160px;
          font-weight: var(--art-font-weight-medium, 500);
        }
      }
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
