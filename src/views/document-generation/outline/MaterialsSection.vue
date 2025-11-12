<template>
  <div class="art-card materials-section">
    <div class="materials-header" @click="materialsCollapsed = !materialsCollapsed">
      <div class="section-indicator">
        <div class="step-number">3</div>
        <div class="step-content">
          <h3>
            <el-icon><FolderOpened /></el-icon>
            素材管理与绑定
          </h3>
          <p class="step-description">选择并管理素材，智能绑定到对应章节</p>
        </div>
        <div class="status-indicator">
          <el-tag v-if="selectedMaterials.length > 0" type="success" effect="light">
            <el-icon><Check /></el-icon>
            已选择 ({{ selectedMaterials.length }})
          </el-tag>
          <el-tag v-else type="info" effect="light">
            <el-icon><FolderOpened /></el-icon>
            未选择
          </el-tag>
        </div>
      </div>
      <div class="materials-controls">
        <div class="completion-progress">
          <el-progress
            :percentage="Math.min((selectedMaterials.length / 5) * 100, 100)"
            :stroke-width="6"
            :show-text="false"
            :status="selectedMaterials.length > 0 ? 'success' : 'exception'"
          />
          <span class="progress-text">
            {{ selectedMaterials.length > 0 ? '进行中' : '待开始' }}
          </span>
        </div>
        <el-button :icon="materialsCollapsed ? ArrowDown : ArrowUp" link>
          {{ materialsCollapsed ? '展开详情' : '收起详情' }}
        </el-button>
      </div>
    </div>

    <el-collapse-transition>
      <div v-show="!materialsCollapsed" class="materials-content">
        <!-- 素材选择区域 -->
        <div class="materials-selection">
          <div class="section-header">
            <div class="header-content">
              <h4>
                <el-icon><Collection /></el-icon>
                素材选择与管理
              </h4>
              <p>选择相关素材，AI将智能匹配到最合适的章节</p>
            </div>
            <div class="header-actions">
              <el-button
                v-if="selectedMaterials.length > 0"
                @click="handleClearSelection"
                size="small"
                type="danger"
                plain
              >
                <el-icon><Delete /></el-icon>
                清空选择
              </el-button>
              <el-button type="primary" @click="$emit('openMaterialLibrary')" size="small">
                <el-icon><Plus /></el-icon>
                添加素材
              </el-button>
            </div>
          </div>

          <div v-if="selectedMaterials.length === 0" class="empty-materials">
            <div class="empty-content">
              <div class="empty-visual">
                <el-icon><FolderOpened /></el-icon>
                <div class="empty-pulse"></div>
              </div>
              <div class="empty-text">
                <h4>还没有选择任何素材</h4>
                <p>从素材库中选择相关资料，AI将智能匹配到最合适的章节</p>
                <div class="benefits-list">
                  <div class="benefit-item">
                    <el-icon><Cpu /></el-icon>
                    <span>AI智能匹配章节</span>
                  </div>
                  <div class="benefit-item">
                    <el-icon><Link /></el-icon>
                    <span>自动关联相关内容</span>
                  </div>
                  <div class="benefit-item">
                    <el-icon><DocumentCopy /></el-icon>
                    <span>提升内容质量</span>
                  </div>
                </div>
              </div>
              <div class="empty-actions">
                <el-button type="primary" @click="$emit('openMaterialLibrary')" size="large">
                  <el-icon><FolderOpened /></el-icon>
                  浏览素材库
                </el-button>
              </div>
            </div>
          </div>

          <div v-else class="materials-grid">
            <div class="materials-overview">
              <div class="overview-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ selectedMaterials.length }}</span>
                  <span class="stat-label">已选素材</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ generatedOutline.length }}</span>
                  <span class="stat-label">可绑章节</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ getBindingProgress() }}%</span>
                  <span class="stat-label">绑定进度</span>
                </div>
              </div>
            </div>

            <div class="materials-list">
              <UnifiedMaterialCard
                v-for="material in selectedMaterials"
                :key="material.id"
                :material="material"
                :selected="true"
                :showSelection="true"
                :showScore="true"
                context="management"
                @select="(id) => $emit('toggleMaterialSelection', id)"
                @preview="(m) => $emit('previewMaterial', m)"
              />
            </div>
          </div>
        </div>

        <!-- 素材绑定区域（大纲生成后显示） -->
        <div v-if="generatedOutline.length > 0" class="material-binding">
          <div class="binding-header">
            <div class="header-info">
              <div class="header-title">
                <h4>
                  <el-icon><Link /></el-icon>
                  智能素材绑定
                </h4>
                <div class="ai-badge">
                  <el-icon><Cpu /></el-icon>
                  <span>AI驱动</span>
                </div>
              </div>
              <p>AI将分析每个章节的内容，自动匹配最相关的素材</p>
            </div>
            <div class="header-actions">
              <div class="binding-controls">
                <el-tooltip
                  :disabled="selectedMaterials.length > 0"
                  content="请先从素材库选择素材"
                  placement="top"
                >
                  <el-button
                    type="primary"
                    :loading="isBindingMaterials"
                    :disabled="isBindingMaterials || selectedMaterials.length === 0"
                    @click="
                      () => {
                        console.log('[UI] 用户点击 AI智能绑定 按钮')
                        console.log('[UI] selectedMaterials:', selectedMaterials)
                        console.log('[UI] isBindingMaterials:', isBindingMaterials)
                        $emit('ai-bind')
                        console.log('[UI] 事件 ai-bind 已触发')
                      }
                    "
                    class="ai-binding-button"
                    size="large"
                  >
                    <el-icon><MagicStick /></el-icon>
                    <span v-if="!isBindingMaterials" class="button-content">
                      <strong>AI智能绑定</strong>
                      <small>自动匹配素材到章节</small>
                    </span>
                    <span v-else class="loading-content">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      AI分析中... {{ bindingProgress }}%
                    </span>
                  </el-button>
                </el-tooltip>

                <div v-if="selectedMaterials.length === 0" class="requirement-alert">
                  <el-icon><WarningFilled /></el-icon>
                  <span>请先选择素材后再进行绑定</span>
                </div>
              </div>

              <div class="binding-stats">
                <div class="stat-item">
                  <span class="stat-label">匹配度</span>
                  <span class="stat-value">
                    {{
                      bindingResult
                        ? `${(bindingResult.total_materials_bound > 0 ? (bindingResult.material_section_bindings.reduce((sum, b) => sum + b.match_scores.reduce((a, c) => a + c, 0) / b.match_scores.length, 0) / bindingResult.total_sections) * 100 : 0).toFixed(0)}%`
                        : '95%+'
                    }}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">章节</span>
                  <span class="stat-value">{{
                    bindingResult ? bindingResult.total_sections : '-'
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">素材</span>
                  <span class="stat-value">{{
                    bindingResult ? bindingResult.total_materials_bound : '-'
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="binding-grid">
            <div
              v-for="(section, sectionIndex) in generatedOutline"
              :key="section.title"
              class="binding-section"
            >
              <div class="section-title">
                <span class="section-number">{{ sectionIndex + 1 }}</span>
                <h5>{{ section.title }}</h5>
              </div>

              <div class="bound-materials">
                <!-- AI绑定结果展示 -->
                <template v-if="bindingResult && getSectionBindings(sectionIndex)">
                  <el-tooltip
                    v-for="(material, materialIndex) in getSectionBindings(sectionIndex)!.materials"
                    :key="material.id"
                    :content="material.relevance_explanation"
                    placement="top"
                  >
                    <el-tag
                      closable
                      @close="
                        () => $emit('unbindMaterialFromSection', sectionIndex, material.title)
                      "
                      type="success"
                    >
                      <div class="tag-content">
                        <span class="material-title">{{ material.title }}</span>
                        <el-tag size="small" type="info" effect="plain" class="match-score">
                          {{ getSectionBindings(sectionIndex)!.match_scores[materialIndex] }}
                        </el-tag>
                      </div>
                    </el-tag>
                  </el-tooltip>
                </template>

                <!-- 手动绑定的素材 -->
                <template v-else>
                  <el-tag
                    v-for="materialTitle in section.data_requirements"
                    :key="materialTitle"
                    closable
                    @close="() => $emit('unbindMaterialFromSection', sectionIndex, materialTitle)"
                    type="primary"
                  >
                    {{ materialTitle }}
                  </el-tag>
                </template>

                <el-tag
                  v-if="section.data_requirements.length === 0 && !bindingResult"
                  type="info"
                  plain
                >
                  未绑定素材
                </el-tag>
              </div>

              <el-dropdown v-if="selectedMaterials.length > 0" trigger="click">
                <el-button size="small" type="primary" plain>
                  <el-icon><Plus /></el-icon>
                  绑定素材
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="material in selectedMaterials.filter(
                        (m) => !section.data_requirements.includes(m.title)
                      )"
                      :key="material.id"
                      @click="$emit('bindMaterialToSection', sectionIndex, material)"
                    >
                      <el-icon><Document /></el-icon>
                      {{ material.title }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="
                        selectedMaterials.every((m) => section.data_requirements.includes(m.title))
                      "
                      disabled
                    >
                      所有素材已绑定
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 绑定结果摘要 -->
          <div v-if="bindingResult" class="binding-summary">
            <el-alert
              :title="bindingResult.final_report"
              type="success"
              :closable="false"
              show-icon
            >
              <div class="summary-content">
                <p>{{ bindingResult.binding_summary }}</p>
                <div class="summary-stats">
                  <div class="stat-item">
                    <el-icon><Document /></el-icon>
                    <span>章节: {{ bindingResult.total_sections }}</span>
                  </div>
                  <div class="stat-item">
                    <el-icon><Collection /></el-icon>
                    <span>素材: {{ bindingResult.total_materials_bound }}</span>
                  </div>
                  <div class="stat-item">
                    <el-icon><InfoFilled /></el-icon>
                    <span
                      >平均匹配度:
                      {{
                        (bindingResult.total_materials_bound > 0
                          ? (bindingResult.material_section_bindings.reduce(
                              (sum, b) =>
                                sum +
                                b.match_scores.reduce((a, c) => a + c, 0) / b.match_scores.length,
                              0
                            ) /
                              bindingResult.total_sections) *
                            100
                          : 0
                        ).toFixed(1)
                      }}%</span
                    >
                  </div>
                </div>
              </div>
            </el-alert>
          </div>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { Material } from '@/types/material'
  import { useMaterialBindStore } from '@/store/modules/materialBind'
  import UnifiedMaterialCard from '@/components/custom/material-card/UnifiedMaterialCard.vue'
  import {
    FolderOpened,
    Link,
    Plus,
    MagicStick,
    Document,
    ArrowDown,
    ArrowUp,
    Check,
    Collection,
    Delete,
    Cpu,
    DocumentCopy,
    Loading,
    WarningFilled,
    InfoFilled
  } from '@element-plus/icons-vue'

  // Props
  const props = defineProps<{
    selectedMaterials: Material[]
    generatedOutline: any[]
    isBindingMaterials: boolean
    bindingProgress: number
  }>()

  // Emits
  const emit = defineEmits<{
    (e: 'openMaterialLibrary'): void
    (e: 'clearSelection'): void
    (e: 'toggleMaterialSelection', id: string): void
    (e: 'previewMaterial', material: Material): void
    (e: 'ai-bind'): void
    (e: 'bindMaterialToSection', sectionIndex: number, material: Material): void
    (e: 'unbindMaterialFromSection', sectionIndex: number, materialTitle: string): void
  }>()

  // Store
  const materialBindStore = useMaterialBindStore()

  // 素材相关状态
  const materialsCollapsed = ref(false)

  // 计算绑定进度
  const getBindingProgress = () => {
    if (props.generatedOutline.length === 0) return 0

    const totalRequirements = props.generatedOutline.reduce(
      (total, section) => total + section.data_requirements.length,
      0
    )

    if (totalRequirements === 0) return 0

    return Math.round((totalRequirements / (props.generatedOutline.length * 2)) * 100)
  }

  const handleClearSelection = () => {
    emit('clearSelection')
  }

  // 计算属性：显示真实的绑定结果
  const bindingResult = computed(() => materialBindStore.bindingResult)

  // 获取章节的绑定素材
  const getSectionBindings = (sectionIndex: number) => {
    if (!bindingResult.value) return undefined
    return bindingResult.value.material_section_bindings.find(
      (binding) => binding.section_id === sectionIndex + 1
    )
  }
</script>

<style scoped lang="scss">
  .materials-section {
    overflow: hidden;
  }

  .materials-header {
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

    .section-indicator {
      display: flex;
      gap: var(--art-spacing-md, 12px);
      align-items: flex-start;

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

    .materials-controls {
      display: flex;
      flex-direction: column;
      gap: var(--art-spacing-sm, 8px);
      align-items: flex-end;

      .completion-progress {
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

  .materials-content {
    padding: var(--art-padding-xl, 32px);
    background: var(--art-main-bg-color);
  }

  .materials-selection {
    .section-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: var(--art-padding-lg, 20px);
      margin-bottom: var(--art-spacing-xl, 32px);
      background: var(--art-fill-color-light);
      border: 1px solid var(--art-border-color);
      border-radius: var(--art-border-radius, 8px);

      .header-content {
        flex: 1;

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

      .header-actions {
        display: flex;
        flex-shrink: 0;
        gap: var(--art-spacing-sm, 8px);
      }
    }

    .empty-materials {
      padding: var(--art-padding-2xl, 60px) var(--art-padding-lg, 24px);
      text-align: center;

      .empty-content {
        max-width: 500px;
        margin: 0 auto;

        .empty-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 120px;
          margin: 0 auto var(--art-spacing-xl, 32px);
          font-size: 48px;
          color: var(--art-text-color-placeholder);
          background: var(--art-fill-color-light);
          border: 2px dashed var(--art-border-dashed-color);
          border-radius: var(--art-border-radius-lg, 12px);

          .empty-pulse {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            background: var(--el-color-primary-light-9);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: pulse 2s infinite;
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
            margin: 0 0 var(--art-spacing-lg, 20px);
            font-size: var(--art-font-size-base, 16px);
            line-height: var(--art-line-height-relaxed, 1.6);
            color: var(--art-text-color-secondary);
          }

          .benefits-list {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--art-spacing-md, 12px);

            .benefit-item {
              display: flex;
              flex-direction: column;
              gap: var(--art-spacing-xs, 4px);
              align-items: center;
              padding: var(--art-spacing-md, 12px);
              background: var(--art-fill-color-blank);
              border: 1px solid var(--art-border-color);
              border-radius: var(--art-border-radius, 6px);

              .el-icon {
                font-size: 20px;
                color: var(--el-color-primary);
              }

              span {
                font-size: var(--art-font-size-xs, 12px);
                color: var(--art-text-color-secondary);
                text-align: center;
              }
            }
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

    .materials-grid {
      .materials-overview {
        padding: var(--art-padding-lg, 20px);
        margin-bottom: var(--art-spacing-xl, 32px);
        background: linear-gradient(
          135deg,
          var(--art-fill-color-light) 0%,
          var(--art-fill-color) 100%
        );
        border: 1px solid var(--art-border-color);
        border-radius: var(--art-border-radius, 8px);

        .overview-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--art-spacing-lg, 20px);
          text-align: center;

          .stat-item {
            display: flex;
            flex-direction: column;
            gap: var(--art-spacing-xs, 4px);

            .stat-value {
              font-size: var(--art-font-size-xl, 24px);
              font-weight: var(--art-font-weight-bold, 700);
              color: var(--el-color-primary);
            }

            .stat-label {
              font-size: var(--art-font-size-sm, 14px);
              color: var(--art-text-color-secondary);
            }
          }
        }
      }

      .materials-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--art-spacing-lg, 16px);
      }
    }
  }

  .material-binding {
    padding: var(--art-padding-lg, 24px);
    margin-top: var(--art-spacing-xl, 32px);
    background: linear-gradient(135deg, var(--art-fill-color-light) 0%, var(--art-fill-color) 100%);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius, 8px);

    .binding-header {
      display: flex;
      gap: var(--art-spacing-xl, 32px);
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: var(--art-spacing-xl, 32px);

      .header-info {
        flex: 1;

        .header-title {
          display: flex;
          gap: var(--art-spacing-md, 12px);
          align-items: center;
          margin-bottom: var(--art-spacing-sm, 8px);

          h4 {
            display: flex;
            gap: var(--art-spacing-sm, 8px);
            align-items: center;
            margin: 0;
            font-size: var(--art-font-size-lg, 20px);
            font-weight: var(--art-font-weight-semibold, 600);
            color: var(--art-text-color-primary);

            .el-icon {
              color: var(--el-color-primary);
            }
          }

          .ai-badge {
            display: flex;
            gap: var(--art-spacing-xs, 4px);
            align-items: center;
            padding: var(--art-spacing-xs, 4px) var(--art-spacing-sm, 8px);
            font-size: var(--art-font-size-xs, 12px);
            font-weight: var(--art-font-weight-medium, 500);
            color: var(--el-color-success);
            background: var(--el-color-success-light-9);
            border: 1px solid var(--el-color-success-light-7);
            border-radius: var(--art-border-radius, 16px);

            .el-icon {
              font-size: 12px;
            }
          }
        }

        p {
          margin: 0;
          font-size: var(--art-font-size-sm, 14px);
          line-height: var(--art-line-height-relaxed, 1.6);
          color: var(--art-text-color-secondary);
        }
      }

      .header-actions {
        display: flex;
        flex-direction: column;
        gap: var(--art-spacing-md, 12px);
        align-items: flex-end;

        .binding-controls {
          display: flex;
          flex-direction: column;
          gap: var(--art-spacing-sm, 8px);
          align-items: flex-end;

          .ai-binding-button {
            min-width: 200px;
            min-height: 64px;
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

            .loading-content {
              display: flex;
              gap: var(--art-spacing-sm, 8px);
              align-items: center;

              .el-icon {
                animation: spin 1s linear infinite;
              }
            }
          }

          .requirement-alert {
            display: flex;
            gap: var(--art-spacing-xs, 4px);
            align-items: center;
            padding: var(--art-spacing-sm, 8px) var(--art-spacing-md, 12px);
            font-size: var(--art-font-size-sm, 14px);
            color: var(--el-color-warning);
            background: var(--el-color-warning-light-9);
            border: 1px solid var(--el-color-warning-light-7);
            border-radius: var(--art-border-radius, 6px);

            .el-icon {
              font-size: 14px;
            }
          }
        }

        .binding-stats {
          display: flex;
          gap: var(--art-spacing-lg, 20px);

          .stat-item {
            display: flex;
            flex-direction: column;
            gap: var(--art-spacing-xs, 4px);
            align-items: center;
            min-width: 60px;
            padding: var(--art-spacing-sm, 8px) var(--art-spacing-md, 12px);
            background: var(--art-main-bg-color);
            border: 1px solid var(--art-border-color);
            border-radius: var(--art-border-radius, 6px);

            .stat-label {
              font-size: var(--art-font-size-xs, 12px);
              color: var(--art-text-color-secondary);
            }

            .stat-value {
              font-size: var(--art-font-size-sm, 14px);
              font-weight: var(--art-font-weight-semibold, 600);
              color: var(--el-color-primary);
            }
          }
        }
      }
    }

    .binding-grid {
      display: grid;
      gap: var(--art-spacing-lg, 16px);
    }

    .binding-section {
      padding: var(--art-padding-lg, 16px);
      background: var(--art-main-bg-color);
      border: 1px solid var(--art-border-color);
      border-radius: var(--art-border-radius, 8px);
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--el-color-primary-light-6);
        box-shadow: var(--art-box-shadow-sm);
      }

      .section-title {
        display: flex;
        gap: var(--art-spacing-md, 12px);
        align-items: center;
        margin-bottom: var(--art-spacing-md, 12px);

        .section-number {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 28px;
          font-size: var(--art-font-size-xs, 12px);
          font-weight: var(--art-font-weight-bold, 700);
          color: white;
          background: var(--el-color-primary);
          border-radius: var(--art-border-radius, 6px);
        }

        h5 {
          margin: 0;
          font-size: var(--art-font-size-base-sm, 15px);
          font-weight: var(--art-font-weight-medium, 500);
          color: var(--art-text-color-primary);
        }
      }

      .bound-materials {
        display: flex;
        flex-wrap: wrap;
        gap: var(--art-spacing-sm, 8px);
        min-height: 48px;
        padding: var(--art-spacing-md, 12px);
        margin-bottom: var(--art-spacing-md, 12px);
        background: var(--art-fill-color-blank);
        border: 1px solid var(--art-border-dashed-color);
        border-radius: var(--art-border-radius-sm, 6px);

        .el-tag {
          margin: 0;

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
              margin-left: var(--art-spacing-xs, 4px);
              font-weight: var(--art-font-weight-bold, 700);
            }
          }
        }
      }

      .binding-summary {
        margin-top: var(--art-spacing-xl, 32px);

        .summary-content {
          p {
            margin: 0 0 var(--art-spacing-md, 12px);
            font-size: var(--art-font-size-sm, 14px);
            line-height: var(--art-line-height-relaxed, 1.6);
            color: var(--art-text-color-secondary);
          }

          .summary-stats {
            display: flex;
            gap: var(--art-spacing-lg, 20px);
            margin-top: var(--art-spacing-md, 12px);

            .stat-item {
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
      }
    }
  }

  .empty-materials-actions {
    p {
      margin: 10px 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  // 移动端适配
  @media (max-width: $device-phone) {
    .materials-header {
      padding: var(--art-padding-md, 16px) var(--art-padding-lg, 20px);
    }

    .materials-title {
      h3 {
        font-size: var(--art-font-size-base, 16px);
      }

      .materials-subtitle {
        font-size: var(--art-font-size-xs, 12px);
      }
    }

    .materials-controls {
      gap: var(--art-spacing-md, 12px);
    }

    .materials-content {
      padding: var(--art-padding-lg, 20px);
    }

    .materials-selection {
      .materials-list-header {
        flex-direction: column;
        gap: var(--art-spacing-md, 12px);
        align-items: flex-start;
      }

      .materials-grid {
        grid-template-columns: 1fr;
        gap: var(--art-spacing-md, 12px);
      }
    }

    .material-binding {
      padding: var(--art-padding-md, 16px);

      .binding-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        flex-direction: column;
        gap: var(--art-spacing-sm, 8px);
        align-items: flex-start;
        width: 100%;

        .material-hint {
          margin-left: auto;
        }

        .el-button {
          width: 100%;
        }
      }

      .binding-section {
        padding: var(--art-padding-md, 12px);
      }
    }
  }

  // 动画定义
  @keyframes pulse {
    0% {
      opacity: 0.8;
      transform: translate(-50%, -50%) scale(0.8);
    }

    50% {
      opacity: 0.4;
      transform: translate(-50%, -50%) scale(1.1);
    }

    100% {
      opacity: 0.8;
      transform: translate(-50%, -50%) scale(0.8);
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  // 移动端适配
  @media (max-width: $device-phone) {
    .materials-header {
      padding: var(--art-padding-md, 16px) var(--art-padding-lg, 20px);

      .section-indicator {
        .step-number {
          width: 32px;
          height: 32px;
          font-size: var(--art-font-size-sm, 14px);
        }

        .step-content {
          h3 {
            font-size: var(--art-font-size-base-lg, 18px);
          }

          .step-description {
            font-size: var(--art-font-size-xs, 12px);
          }
        }
      }

      .materials-controls {
        .completion-progress {
          min-width: 60px;

          .el-progress {
            width: 40px;
          }
        }
      }
    }

    .materials-content {
      padding: var(--art-padding-lg, 20px);
    }

    .materials-selection {
      .section-header {
        flex-direction: column;
        gap: var(--art-spacing-md, 12px);
        align-items: stretch;

        .header-actions {
          justify-content: center;
        }
      }

      .empty-materials {
        padding: var(--art-padding-lg, 20px);

        .empty-content {
          .empty-visual {
            width: 80px;
            height: 80px;
            font-size: 32px;
          }

          .empty-text {
            .benefits-list {
              grid-template-columns: 1fr;
              gap: var(--art-spacing-sm, 8px);
            }
          }
        }
      }

      .materials-grid {
        .materials-overview {
          .overview-stats {
            grid-template-columns: 1fr;
            gap: var(--art-spacing-md, 12px);
          }
        }

        .materials-list {
          grid-template-columns: 1fr;
        }
      }
    }

    .material-binding {
      padding: var(--art-padding-md, 16px);

      .binding-header {
        flex-direction: column;
        gap: var(--art-spacing-lg, 20px);
        align-items: stretch;

        .header-actions {
          align-items: stretch;

          .binding-controls {
            align-items: stretch;

            .ai-binding-button {
              width: 100%;
              min-width: auto;
            }

            .requirement-alert {
              align-self: center;
            }
          }

          .binding-stats {
            justify-content: center;
          }
        }
      }
    }
  }

  // 平板设备适配
  @media (max-width: $device-ipad) {
    .materials-selection {
      .materials-grid {
        .materials-list {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }
      }
    }

    .material-binding {
      .binding-header {
        flex-direction: column;
        gap: var(--art-spacing-lg, 20px);
        align-items: stretch;

        .header-actions {
          align-items: stretch;
        }
      }
    }
  }
</style>
