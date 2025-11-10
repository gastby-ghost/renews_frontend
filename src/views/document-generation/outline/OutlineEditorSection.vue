<template>
  <div class="art-card outline-content">
    <div class="outline-header">
      <div class="section-indicator">
        <div class="step-number">2</div>
        <div class="step-content">
          <h3>
            <el-icon><EditPen /></el-icon>
            大纲编辑
          </h3>
          <p class="step-description">创建或编辑文档大纲，确定内容结构</p>
        </div>
        <div class="status-indicator">
          <el-tag v-if="generatedOutline.length > 0" type="success" effect="light">
            <el-icon><Check /></el-icon>
            已创建 ({{ generatedOutline.length }} 章节)
          </el-tag>
          <el-tag v-else type="info" effect="light">
            <el-icon><Edit /></el-icon>
            待创建
          </el-tag>
        </div>
      </div>

      <div class="outline-actions">
        <!-- AI生成区域 -->
        <div class="ai-generation-section">
          <div class="section-title">
            <el-icon><MagicStick /></el-icon>
            <span>AI 智能生成</span>
            <el-tooltip
              content="基于选定的标题和研究简报，AI将为您生成专业的大纲结构"
              placement="top"
            >
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="action-grid">
            <el-button
              @click="handleGenerateAIOutline"
              :loading="generatingOutline"
              :disabled="!canGenerateFromTitle"
              type="primary"
              size="large"
              class="art-button ai-button"
            >
              <el-icon><MagicStick /></el-icon>
              <span class="button-content">
                <strong>AI生成大纲</strong>
                <small>基于标题智能创建</small>
              </span>
            </el-button>
            <el-button
              @click="handleGenerateAICompleteOutline"
              :loading="generatingOutline"
              :disabled="!canGenerateFromTitle || selectedMaterialsCount === 0"
              type="success"
              size="large"
              class="art-button ai-button"
            >
              <el-icon><MagicStick /></el-icon>
              <span class="button-content">
                <strong>AI完整生成</strong>
                <small>生成大纲并绑定素材</small>
              </span>
            </el-button>
          </div>
          <div v-if="!canGenerateFromTitle" class="requirement-hint">
            <el-icon><WarningFilled /></el-icon>
            <span>请先在上方选择标题并完善研究简报</span>
          </div>
          <div v-else-if="selectedMaterialsCount === 0" class="requirement-hint info">
            <el-icon><InfoFilled /></el-icon>
            <span>选择素材后可使用"AI完整生成"功能</span>
          </div>
        </div>

        <!-- 手动编辑区域 -->
        <div class="manual-edit-section">
          <div class="section-title">
            <el-icon><Operation /></el-icon>
            <span>手动编辑</span>
          </div>
          <div class="action-grid">
            <el-button @click="handleAddSection" :disabled="!canAddSection" class="art-button">
              <el-icon><Plus /></el-icon>
              添加章节
            </el-button>
            <el-button
              @click="handleClearOutline"
              :disabled="generatedOutline.length === 0"
              type="danger"
              plain
              class="art-button"
            >
              <el-icon><Delete /></el-icon>
              清空大纲
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="outline-editor">
      <div v-if="generatedOutline.length === 0" class="empty-outline">
        <div class="empty-content">
          <div class="empty-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="empty-text">
            <h4>开始创建您的大纲</h4>
            <p>选择AI智能生成或手动创建，构建专业的文档结构</p>
          </div>
          <div class="quick-actions">
            <div
              class="action-card"
              @click="handleGenerateAIOutline"
              :class="{ disabled: !canGenerateFromTitle }"
            >
              <div class="action-icon ai">
                <el-icon><MagicStick /></el-icon>
              </div>
              <div class="action-text">
                <strong>AI智能生成</strong>
                <small>快速生成专业大纲</small>
              </div>
            </div>
            <div
              class="action-card"
              @click="handleAddSection"
              :class="{ disabled: !canAddSection }"
            >
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

      <div v-else class="outline-tree">
        <div class="tree-header">
          <div class="tree-info">
            <h4>
              <el-icon><List /></el-icon>
              大纲章节 ({{ generatedOutline.length }})
            </h4>
            <p>拖拽章节可调整顺序，点击编辑内容</p>
          </div>
          <div class="tree-actions">
            <el-button size="small" @click="handleAddSection" :disabled="!canAddSection">
              <el-icon><Plus /></el-icon>
              添加章节
            </el-button>
          </div>
        </div>

        <div
          v-for="(section, sectionIndex) in generatedOutline"
          :key="section.title"
          class="outline-section"
          :class="{ 'section-hover': true }"
        >
          <div class="section-header">
            <div class="section-drag-handle">
              <el-icon><Rank /></el-icon>
            </div>
            <div class="section-info">
              <div class="section-number">
                {{ sectionIndex + 1 }}
              </div>
              <div class="section-content-wrapper">
                <input
                  v-model="section.title"
                  class="section-title-input"
                  placeholder="章节标题"
                  @blur="handleEditSection(section.title, { title: section.title })"
                />
                <div class="section-summary">
                  {{
                    section.content_direction
                      ? section.content_direction.substring(0, 50) + '...'
                      : '暂无内容方向'
                  }}
                </div>
              </div>
            </div>
            <div class="section-controls">
              <el-dropdown trigger="click">
                <el-button size="small" circle>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      @click="handleMoveSectionUp(sectionIndex)"
                      :disabled="sectionIndex === 0"
                    >
                      <el-icon><ArrowUp /></el-icon>
                      上移章节
                    </el-dropdown-item>
                    <el-dropdown-item
                      @click="handleMoveSectionDown(sectionIndex)"
                      :disabled="sectionIndex === generatedOutline.length - 1"
                    >
                      <el-icon><ArrowDown /></el-icon>
                      下移章节
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleDeleteSection(sectionIndex)">
                      <el-icon><Delete /></el-icon>
                      删除章节
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="section-detail">
            <div class="detail-tabs">
              <div
                class="tab-item"
                :class="{ active: activeDetailTab === `${sectionIndex}-content` }"
                @click="activeDetailTab = `${sectionIndex}-content`"
              >
                <el-icon><EditPen /></el-icon>
                内容方向
              </div>
              <div
                class="tab-item"
                :class="{ active: activeDetailTab === `${sectionIndex}-requirements` }"
                @click="activeDetailTab = `${sectionIndex}-requirements`"
              >
                <el-icon><Link /></el-icon>
                素材需求
              </div>
            </div>

            <div v-show="activeDetailTab === `${sectionIndex}-content`" class="tab-content">
              <div class="content-direction">
                <label>
                  <el-icon><Guide /></el-icon>
                  内容方向和写作要点
                </label>
                <textarea
                  v-model="section.content_direction"
                  class="content-direction-textarea"
                  placeholder="描述本章节的主要内容、写作方向和要点..."
                  @blur="
                    handleEditSection(section.title, {
                      content_direction: section.content_direction
                    })
                  "
                />
                <div class="input-hint"> {{ section.content_direction.length }}/500 字符 </div>
              </div>
            </div>

            <div v-show="activeDetailTab === `${sectionIndex}-requirements`" class="tab-content">
              <div class="data-requirements">
                <label>
                  <el-icon><Document /></el-icon>
                  素材需求
                </label>
                <div v-if="section.data_requirements.length > 0" class="requirements-list">
                  <el-tag
                    v-for="req in section.data_requirements"
                    :key="req"
                    closable
                    @close="() => $emit('unbindMaterial', sectionIndex, req)"
                    class="requirement-tag"
                  >
                    <el-icon><Document /></el-icon>
                    {{ req }}
                  </el-tag>
                </div>
                <div v-else class="empty-requirements">
                  <el-icon><FolderOpened /></el-icon>
                  <span>暂无绑定的素材需求</span>
                  <small>请在下方素材区域进行绑定</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="outline-actions-bottom">
      <el-button @click="$emit('goBack')" size="large" class="art-button art-button--secondary"
        >返回标题</el-button
      >
      <el-button
        type="success"
        size="large"
        @click="handleConfirmOutline"
        :disabled="generatedOutline.length === 0"
        class="art-button art-button--primary"
      >
        确认大纲并继续
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import {
    Plus,
    MagicStick,
    Delete,
    EditPen,
    Check,
    Edit,
    QuestionFilled,
    Operation,
    WarningFilled,
    InfoFilled,
    Document,
    List,
    Rank,
    MoreFilled,
    ArrowUp,
    ArrowDown,
    Link,
    Guide,
    FolderOpened
  } from '@element-plus/icons-vue'

  // 响应式数据
  const activeDetailTab = ref('')

  // Props
  defineProps<{
    generatedOutline: any[]
    canGenerateFromTitle: boolean
    canAddSection: boolean
    generatingOutline: boolean
    selectedMaterialsCount: number
  }>()

  // Emits
  const emit = defineEmits<{
    (e: 'generateAIOutline'): void
    (e: 'generateAICompleteOutline'): void
    (e: 'addSection'): void
    (e: 'deleteSection', index: number): void
    (e: 'moveSectionUp', index: number): void
    (e: 'moveSectionDown', index: number): void
    (e: 'clearOutline'): void
    (e: 'confirmOutline'): void
    (e: 'editSection', title: string, data: any): void
    (e: 'goBack'): void
    (e: 'unbindMaterial', sectionIndex: number, materialTitle: string): void
  }>()

  const handleGenerateAIOutline = () => {
    emit('generateAIOutline')
  }

  const handleGenerateAICompleteOutline = () => {
    emit('generateAICompleteOutline')
  }

  const handleAddSection = () => {
    emit('addSection')
  }

  const handleDeleteSection = (index: number) => {
    emit('deleteSection', index)
  }

  const handleMoveSectionUp = (index: number) => {
    emit('moveSectionUp', index)
  }

  const handleMoveSectionDown = (index: number) => {
    emit('moveSectionDown', index)
  }

  const handleClearOutline = () => {
    emit('clearOutline')
  }

  const handleConfirmOutline = () => {
    emit('confirmOutline')
  }

  const handleEditSection = (title: string, data: any) => {
    emit('editSection', title, data)
  }
</script>

<style scoped lang="scss">
  .outline-content {
    padding: var(--art-padding-xl, 32px);
  }

  .outline-header {
    margin-bottom: var(--art-spacing-xl, 32px);

    .section-indicator {
      display: flex;
      gap: var(--art-spacing-md, 12px);
      align-items: flex-start;
      padding: var(--art-padding-lg, 20px);
      margin-bottom: var(--art-spacing-xl, 32px);
      background: linear-gradient(
        135deg,
        var(--art-fill-color-light) 0%,
        var(--art-fill-color) 100%
      );
      border: 1px solid var(--art-border-color);
      border-radius: var(--art-border-radius, 8px);

      .step-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        font-size: var(--art-font-size-base, 16px);
        font-weight: var(--art-font-weight-bold, 700);
        color: white;
        background: var(--el-color-primary);
        border-radius: var(--art-border-radius, 8px);
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
      }

      .step-content {
        flex: 1;

        h3 {
          display: flex;
          gap: var(--art-spacing-sm, 8px);
          align-items: center;
          margin: 0 0 var(--art-spacing-xs, 4px);
          font-size: var(--art-font-size-xl, 20px);
          font-weight: var(--art-font-weight-semibold, 600);
          color: var(--art-text-color-primary);

          .el-icon {
            color: var(--el-color-primary);
          }
        }

        .step-description {
          margin: 0;
          font-size: var(--art-font-size-sm, 14px);
          color: var(--art-text-color-secondary);
        }
      }

      .status-indicator {
        .el-tag {
          display: flex;
          gap: var(--art-spacing-xs, 4px);
          align-items: center;
        }
      }
    }
  }

  .outline-actions {
    display: flex;
    flex-direction: column;
    gap: var(--art-spacing-xl, 32px);

    .section-title {
      display: flex;
      gap: var(--art-spacing-sm, 8px);
      align-items: center;
      margin-bottom: var(--art-spacing-md, 12px);
      font-size: var(--art-font-size-base-lg, 18px);
      font-weight: var(--art-font-weight-medium, 500);
      color: var(--art-text-color-primary);

      .el-icon {
        color: var(--el-color-primary);
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

    .action-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--art-spacing-md, 12px);

      .el-button {
        width: 100%;
        min-height: 80px;
        text-align: center;

        &.ai-button {
          background: linear-gradient(
            135deg,
            var(--el-color-primary) 0%,
            var(--el-color-primary-light-3) 100%
          );
          border: none;
          box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
          transition: all 0.3s ease;

          &:hover:not(:disabled) {
            box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.4);
            transform: translateY(-2px);
          }

          .button-content {
            display: flex;
            flex-direction: column;
            gap: var(--art-spacing-xs, 4px);
            align-items: center;

            strong {
              font-size: var(--art-font-size-base, 16px);
              font-weight: var(--art-font-weight-semibold, 600);
            }

            small {
              font-size: var(--art-font-size-xs, 12px);
              opacity: 0.9;
            }
          }
        }
      }
    }

    .requirement-hint {
      display: flex;
      gap: var(--art-spacing-xs, 4px);
      align-items: center;
      padding: var(--art-spacing-sm, 8px) var(--art-spacing-md, 12px);
      margin-top: var(--art-spacing-md, 12px);
      font-size: var(--art-font-size-sm, 14px);
      color: var(--el-color-warning);
      background: var(--el-color-warning-light-9);
      border: 1px solid var(--el-color-warning-light-7);
      border-radius: var(--art-border-radius, 6px);

      &.info {
        color: var(--el-color-info);
        background: var(--el-color-info-light-9);
        border-color: var(--el-color-info-light-7);
      }

      .el-icon {
        font-size: 14px;
      }
    }
  }

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

  .outline-tree {
    margin-bottom: var(--art-spacing-xl, 32px);

    .tree-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--art-padding-md, 12px) var(--art-padding-lg, 20px);
      margin-bottom: var(--art-spacing-lg, 20px);
      background: var(--art-fill-color-light);
      border: 1px solid var(--art-border-color);
      border-radius: var(--art-border-radius, 8px);

      .tree-info {
        h4 {
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

        p {
          margin: 0;
          font-size: var(--art-font-size-sm, 14px);
          color: var(--art-text-color-secondary);
        }
      }
    }
  }

  .outline-section {
    box-sizing: border-box;
    margin-bottom: var(--art-spacing-lg, 20px);
    overflow: hidden;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius, 8px);
    transition: all 0.3s ease;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      border-color: var(--el-color-primary-light-6);
      box-shadow: var(--art-box-shadow-sm);
    }

    .section-header {
      display: flex;
      gap: var(--art-spacing-md, 12px);
      align-items: center;
      padding: var(--art-padding-lg, 16px);
      border-bottom: 1px solid var(--art-border-color-lighter);
      transition: all 0.3s ease;

      .section-drag-handle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        color: var(--art-text-color-placeholder);
        cursor: move;
        transition: color 0.3s ease;

        &:hover {
          color: var(--el-color-primary);
        }
      }

      .section-info {
        display: flex;
        flex: 1;
        gap: var(--art-spacing-md, 12px);
        align-items: center;

        .section-number {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
          font-size: var(--art-font-size-sm, 14px);
          font-weight: var(--art-font-weight-bold, 700);
          color: white;
          background: var(--el-color-primary);
          border-radius: var(--art-border-radius, 6px);
        }

        .section-content-wrapper {
          flex: 1;

          .section-title-input {
            width: 100%;
            padding: var(--art-spacing-sm, 8px) var(--art-spacing-md, 12px);
            margin-bottom: var(--art-spacing-xs, 4px);
            font-size: var(--art-font-size-base, 16px);
            font-weight: var(--art-font-weight-medium, 500);
            background: var(--art-main-bg-color);
            border: 1px solid var(--art-border-color);
            border-radius: var(--art-border-radius-sm, 6px);
            transition: all 0.3s ease;

            &:focus {
              background: var(--art-main-bg-color);
              border-color: var(--el-color-primary);
              outline: none;
              box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
            }

            &:hover {
              border-color: var(--el-color-primary-light-6);
            }
          }

          .section-summary {
            font-size: var(--art-font-size-sm, 14px);
            line-height: var(--art-line-height-normal, 1.4);
            color: var(--art-text-color-secondary);
          }
        }
      }

      .section-controls {
        .el-button {
          background: var(--art-fill-color-light);
          border: none;

          &:hover {
            color: var(--el-color-primary);
            background: var(--art-fill-color);
          }
        }
      }
    }

    .section-detail {
      .detail-tabs {
        display: flex;
        background: var(--art-fill-color-light);

        .tab-item {
          display: flex;
          gap: var(--art-spacing-xs, 4px);
          align-items: center;
          padding: var(--art-spacing-md, 12px) var(--art-padding-lg, 20px);
          font-size: var(--art-font-size-sm, 14px);
          color: var(--art-text-color-secondary);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;

          &:hover {
            color: var(--art-text-color-primary);
            background: var(--art-fill-color);
          }

          &.active {
            font-weight: var(--art-font-weight-medium, 500);
            color: var(--el-color-primary);
            background: var(--art-main-bg-color);
            border-bottom-color: var(--el-color-primary);
          }

          .el-icon {
            font-size: 14px;
          }
        }
      }

      .tab-content {
        padding: var(--art-padding-lg, 16px);

        .content-direction {
          label {
            display: flex;
            gap: var(--art-spacing-xs, 4px);
            align-items: center;
            margin-bottom: var(--art-spacing-sm, 8px);
            font-size: var(--art-font-size-sm, 14px);
            font-weight: var(--art-font-weight-medium, 500);
            color: var(--art-text-color-primary);

            .el-icon {
              color: var(--el-color-primary);
            }
          }

          .content-direction-textarea {
            width: 100%;
            min-height: 120px;
            padding: var(--art-spacing-md, 12px);
            font-family: inherit;
            font-size: var(--art-font-size-sm, 14px);
            line-height: var(--art-line-height-relaxed, 1.6);
            resize: vertical;
            background: var(--art-main-bg-color);
            border: 1px solid var(--art-border-color);
            border-radius: var(--art-border-radius-sm, 6px);
            transition: all 0.3s ease;

            &:focus {
              background: var(--art-main-bg-color);
              border-color: var(--el-color-primary);
              outline: none;
              box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
            }

            &:hover {
              border-color: var(--el-color-primary-light-6);
            }
          }

          .input-hint {
            display: flex;
            justify-content: flex-end;
            margin-top: var(--art-spacing-xs, 4px);
            font-size: var(--art-font-size-xs, 12px);
            color: var(--art-text-color-placeholder);
          }
        }

        .data-requirements {
          label {
            display: flex;
            gap: var(--art-spacing-xs, 4px);
            align-items: center;
            margin-bottom: var(--art-spacing-sm, 8px);
            font-size: var(--art-font-size-sm, 14px);
            font-weight: var(--art-font-weight-medium, 500);
            color: var(--art-text-color-primary);

            .el-icon {
              color: var(--el-color-primary);
            }
          }

          .requirements-list {
            display: flex;
            flex-wrap: wrap;
            gap: var(--art-spacing-sm, 8px);

            .requirement-tag {
              display: flex;
              gap: var(--art-spacing-xs, 4px);
              align-items: center;
            }
          }

          .empty-requirements {
            display: flex;
            flex-direction: column;
            gap: var(--art-spacing-sm, 8px);
            align-items: center;
            padding: var(--art-spacing-xl, 32px);
            text-align: center;
            background: var(--art-fill-color-light);
            border: 1px dashed var(--art-border-dashed-color);
            border-radius: var(--art-border-radius, 8px);

            .el-icon {
              font-size: 24px;
              color: var(--art-text-color-placeholder);
            }

            span {
              font-size: var(--art-font-size-sm, 14px);
              color: var(--art-text-color-secondary);
            }

            small {
              font-size: var(--art-font-size-xs, 12px);
              color: var(--art-text-color-placeholder);
            }
          }
        }
      }
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--art-spacing-md, 12px);
  }

  .section-info {
    display: flex;
    flex: 1;
    gap: var(--art-spacing-md, 12px);
    align-items: center;
  }

  .section-number {
    min-width: 32px;
    font-size: var(--art-font-size-lg, 16px);
    font-weight: var(--art-font-weight-bold, 700);
    color: var(--el-color-primary);
  }

  .section-title-input {
    flex: 1;
    padding: var(--art-spacing-sm, 8px) var(--art-spacing-md, 12px);
    font-size: var(--art-font-size-base, 16px);
    font-weight: var(--art-font-weight-medium, 500);
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius-sm, 6px);
    transition: all 0.3s ease;

    &:focus {
      background: var(--art-main-bg-color);
      border-color: var(--el-color-primary);
      outline: none;
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }

    &:hover {
      border-color: var(--el-color-primary-light-6);
    }
  }

  .section-controls {
    display: flex;
    gap: var(--art-spacing-xs, 6px);
  }

  .section-content {
    box-sizing: border-box;
    padding: var(--art-padding-lg, 16px);
    margin-top: var(--art-spacing-lg, 16px);
    overflow: hidden;
    background: var(--art-fill-color-blank);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius-sm, 6px);
  }

  .content-direction {
    margin-bottom: var(--art-spacing-lg, 16px);

    label {
      display: block;
      margin-bottom: var(--art-spacing-sm, 8px);
      font-size: var(--art-font-size-sm, 14px);
      font-weight: var(--art-font-weight-medium, 500);
      color: var(--art-text-color-primary);
    }
  }

  .content-direction-textarea {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-height: 96px;
    padding: var(--art-spacing-md, 12px);
    font-family: inherit;
    font-size: var(--art-font-size-sm, 14px);
    line-height: var(--art-line-height-relaxed, 1.6);
    resize: vertical;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius-sm, 6px);
    transition: all 0.3s ease;

    &:focus {
      background: var(--art-main-bg-color);
      border-color: var(--el-color-primary);
      outline: none;
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }

    &:hover {
      border-color: var(--el-color-primary-light-6);
    }
  }

  .data-requirements {
    label {
      display: block;
      margin-bottom: var(--art-spacing-sm, 8px);
      font-size: var(--art-font-size-sm, 14px);
      font-weight: var(--art-font-weight-medium, 500);
      color: var(--art-text-color-primary);
    }

    .el-tag {
      margin-right: var(--art-spacing-sm, 8px);
      margin-bottom: var(--art-spacing-sm, 8px);
    }
  }

  .outline-actions-bottom {
    display: flex;
    gap: var(--art-spacing-lg, 20px);
    justify-content: center;
    padding-top: var(--art-spacing-lg, 24px);
    margin-top: var(--art-spacing-xl, 32px);
    border-top: 1px solid var(--art-border-color);

    .art-button {
      min-width: 120px;
      font-weight: var(--art-font-weight-medium, 500);

      &--primary {
        background: var(--el-color-primary);
        border-color: var(--el-color-primary);

        &:hover {
          background: var(--el-color-primary-light-3);
          border-color: var(--el-color-primary-light-3);
        }
      }

      &--secondary {
        color: var(--art-text-color-primary);
        background: var(--art-fill-color-light);
        border-color: var(--art-border-color);

        &:hover {
          background: var(--art-fill-color);
          border-color: var(--el-color-primary-light-6);
        }
      }
    }
  }

  // 移动端适配
  @media (max-width: $device-phone) {
    .outline-content {
      padding: var(--art-padding-lg, 20px);
    }

    .outline-header {
      flex-direction: column;
      gap: var(--art-spacing-lg, 20px);
      align-items: stretch;
    }

    .outline-actions {
      .actions-group {
        .action-grid {
          grid-template-columns: 1fr;
          gap: var(--art-spacing-sm, 8px);
        }
      }
    }

    .section-header {
      flex-direction: column;
      gap: var(--art-spacing-md, 12px);
      align-items: flex-start;
    }

    .section-controls {
      flex-wrap: wrap;
      justify-content: flex-start;
    }

    .outline-actions-bottom {
      flex-direction: column;
      gap: var(--art-spacing-md, 16px);
      align-items: center;

      .art-button {
        width: 100%;
        max-width: 200px;
      }
    }

    .outline-section {
      padding: var(--art-padding-md, 12px);
    }

    .section-content {
      padding: var(--art-padding-md, 12px);
    }

    .content-direction-textarea {
      min-height: 80px;
    }
  }

  // 平板设备适配
  @media (max-width: $device-ipad) {
    .outline-actions {
      .actions-group {
        .action-grid {
          grid-template-columns: 1fr;
          gap: var(--art-spacing-sm, 8px);
        }
      }
    }
  }
</style>
