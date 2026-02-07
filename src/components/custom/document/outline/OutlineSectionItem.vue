<template>
  <div class="outline-section">
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
            :value="section.title"
            class="section-title-input"
            placeholder="章节标题"
            @blur="handleTitleBlur"
          />
          <div class="section-summary">
            {{ section.content_direction?.substring(0, 50) || '暂无内容方向' }}...
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
                @click="$emit('move-up', sectionIndex)"
                :disabled="sectionIndex === 0"
              >
                <el-icon><ArrowUp /></el-icon>
                上移章节
              </el-dropdown-item>
              <el-dropdown-item @click="$emit('move-down', sectionIndex)" :disabled="isLast">
                <el-icon><ArrowDown /></el-icon>
                下移章节
              </el-dropdown-item>
              <el-dropdown-item divided @click="$emit('delete', sectionIndex)">
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
          :class="{ active: activeTab === 'content' }"
          @click="activeTab = 'content'"
        >
          <el-icon><EditPen /></el-icon>
          内容方向
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'requirements' }"
          @click="activeTab = 'requirements'"
        >
          <el-icon><Link /></el-icon>
          素材需求
        </div>
      </div>

      <!-- 内容方向 Tab -->
      <div v-show="activeTab === 'content'" class="tab-content">
        <div class="content-direction">
          <label>
            <el-icon><Guide /></el-icon>
            内容方向和写作要点
          </label>
          <textarea
            :value="section.content_direction"
            class="content-direction-textarea"
            placeholder="描述本章节的主要内容、写作方向和要点..."
            @blur="handleContentBlur"
          />
          <div class="input-hint">{{ section.content_direction?.length || 0 }}/500 字符</div>
        </div>
      </div>

      <!-- 素材需求 Tab -->
      <div v-show="activeTab === 'requirements'" class="tab-content">
        <div class="data-requirements">
          <!-- AI绑定结果展示 -->
          <div v-if="bindingResult && sectionBindings" class="ai-bindings-section">
            <div class="bindings-header">
              <el-icon><MagicStick /></el-icon>
              <span>AI智能绑定结果</span>
              <el-tag type="success" size="small" effect="light">
                匹配度: {{ averageMatchScore }}%
              </el-tag>
            </div>
            <div class="bound-materials-list">
              <el-tooltip
                v-for="(material, materialIndex) in sectionBindings.materials"
                :key="material.id"
                :content="material.relevance_explanation"
                placement="top"
              >
                <el-tag
                  closable
                  @close="handleUnbind(material.title)"
                  type="success"
                  class="bound-material-tag"
                >
                  <div class="tag-content">
                    <span class="material-title">{{ material.title }}</span>
                    <el-tag size="small" type="info" effect="plain" class="match-score">
                      {{ sectionBindings.match_scores[materialIndex] }}
                    </el-tag>
                  </div>
                </el-tag>
              </el-tooltip>
            </div>
          </div>

          <!-- 手动绑定的素材 -->
          <div
            v-else-if="section.data_requirements && section.data_requirements.length > 0"
            class="manual-bindings-section"
          >
            <div class="bindings-header">
              <el-icon><Document /></el-icon>
              <span>手动绑定素材</span>
            </div>
            <div class="requirements-list">
              <el-tag
                v-for="materialTitle in section.data_requirements"
                :key="materialTitle"
                closable
                @close="handleUnbind(materialTitle)"
                type="primary"
                class="requirement-tag"
              >
                {{ materialTitle }}
              </el-tag>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-requirements">
            <el-icon><FolderOpened /></el-icon>
            <span>暂无绑定的素材</span>
            <small v-if="availableMaterials.length > 0">
              使用"智能素材绑定"功能或手动添加素材
            </small>
            <small v-else>请先在标题区域选择素材，然后使用智能绑定功能</small>
          </div>

          <!-- 手动添加素材按钮 -->
          <div v-if="availableMaterials.length > 0" class="manual-add-section">
            <el-dropdown trigger="click">
              <el-button size="small" type="primary" plain>
                <el-icon><Plus /></el-icon>
                手动添加素材
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="material in availableMaterials"
                    :key="material.id"
                    @click="handleBind(material)"
                  >
                    <el-icon><Document /></el-icon>
                    {{ material.title }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="availableMaterials.length === 0" disabled>
                    所有素材已绑定
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import type { Material } from '@/types/core/material'

  interface SectionData {
    title: string
    content_direction?: string
    data_requirements?: string[]
  }

  interface BindingMaterial extends Material {
    relevance_explanation?: string
  }

  interface SectionBindings {
    materials: BindingMaterial[]
    match_scores: number[]
  }

  interface Props {
    section: SectionData
    sectionIndex: number
    isLast: boolean
    availableMaterials: Material[]
    sectionBindings?: SectionBindings | null
    averageMatchScore?: number
  }

  defineProps<Props>()

  const activeTab = ref<'content' | 'requirements'>('content')

  const emit = defineEmits<{
    'update-title': [title: string]
    'update-content': [content: string]
    'move-up': [index: number]
    'move-down': [index: number]
    delete: [index: number]
    bind: [material: Material]
    unbind: [materialTitle: string]
  }>()

  const handleTitleBlur = (event: FocusEvent) => {
    const target = event.target as HTMLInputElement
    emit('update-title', target.value)
  }

  const handleContentBlur = (event: FocusEvent) => {
    const target = event.target as HTMLTextAreaElement
    emit('update-content', target.value)
  }

  const handleBind = (material: Material) => {
    emit('bind', material)
  }

  const handleUnbind = (materialTitle: string) => {
    emit('unbind', materialTitle)
  }
</script>

<style scoped lang="scss">
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
            margin-bottom: var(--art-spacing-md, 12px);
            font-size: var(--art-font-size-sm, 14px);
            font-weight: var(--art-font-weight-medium, 500);
            color: var(--art-text-color-primary);

            .el-icon {
              color: var(--el-color-primary);
            }
          }

          .ai-bindings-section,
          .manual-bindings-section {
            margin-bottom: var(--art-spacing-md, 12px);

            .bindings-header {
              display: flex;
              gap: var(--art-spacing-sm, 8px);
              align-items: center;
              margin-bottom: var(--art-spacing-sm, 8px);
              font-size: var(--art-font-size-sm, 14px);
              font-weight: var(--art-font-weight-medium, 500);
              color: var(--art-text-color-primary);

              .el-icon {
                color: var(--el-color-primary);
              }

              .el-tag {
                margin-left: auto;
              }
            }

            .bound-materials-list {
              display: flex;
              flex-wrap: wrap;
              gap: var(--art-spacing-sm, 8px);

              .bound-material-tag {
                .tag-content {
                  display: flex;
                  gap: var(--art-spacing-xs, 4px);
                  align-items: center;

                  .material-title {
                    max-width: 200px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }

                  .match-score {
                    font-weight: var(--art-font-weight-bold, 700);
                  }
                }
              }
            }
          }

          .requirements-list {
            display: flex;
            flex-wrap: wrap;
            gap: var(--art-spacing-sm, 8px);
            margin-bottom: var(--art-spacing-md, 12px);

            .requirement-tag {
              display: flex;
              gap: var(--art-spacing-xs, 4px);
              align-items: center;
            }
          }

          .manual-add-section {
            padding-top: var(--art-spacing-md, 12px);
            border-top: 1px solid var(--art-border-color-lighter);
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
</style>
