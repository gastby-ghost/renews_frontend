<template>
  <div class="art-card materials-section">
    <div class="materials-header" @click="materialsCollapsed = !materialsCollapsed">
      <div class="materials-title">
        <h3>素材管理</h3>
        <p class="materials-subtitle">选择素材用于后续内容生成和章节绑定</p>
      </div>
      <div class="materials-controls">
        <el-tag :type="selectedMaterials.length > 0 ? 'success' : 'info'" size="large">
          已选择 {{ selectedMaterials.length }} 个素材
        </el-tag>
        <el-button :icon="materialsCollapsed ? ArrowDown : ArrowUp" link>
          {{ materialsCollapsed ? '展开' : '收起' }}
        </el-button>
      </div>
    </div>

    <el-collapse-transition>
      <div v-show="!materialsCollapsed" class="materials-content">
        <!-- 素材选择区域 -->
        <div class="materials-selection">
          <div class="materials-list">
            <div class="materials-list-header">
              <h4>选择素材（用于后续内容生成和章节绑定）</h4>
              <div class="materials-actions">
                <el-button
                  v-if="selectedMaterials.length > 0"
                  @click="handleClearSelection"
                  size="small"
                  link
                  type="danger"
                >
                  清空选择
                </el-button>
              </div>
            </div>

            <!-- 模拟素材数据，实际项目中从store或API获取 -->
            <div v-if="selectedMaterials.length === 0" class="empty-materials">
              <el-empty description="暂无选中的素材">
                <template #image>
                  <el-icon :size="60"><FolderOpened /></el-icon>
                </template>
                <div class="empty-materials-actions">
                  <p>从素材库选择素材，或手动添加章节</p>
                  <el-button type="primary" @click="$emit('openMaterialLibrary')">
                    <el-icon><FolderOpened /></el-icon>
                    从素材库选择
                  </el-button>
                </div>
              </el-empty>
            </div>

            <div v-else class="materials-grid">
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
            <div class="header-left">
              <h4>
                <el-icon><Link /></el-icon>
                素材绑定
              </h4>
              <p>将素材绑定到对应章节，便于后续生成内容</p>
            </div>
            <div class="header-actions">
              <el-tooltip
                :disabled="selectedMaterials.length > 0"
                content="请先从素材库选择素材"
                placement="top"
              >
                <el-button
                  type="primary"
                  :loading="isBindingMaterials"
                  :disabled="isBindingMaterials || selectedMaterials.length === 0"
                  @click="$emit('handleAIBindMaterials')"
                  class="art-button"
                >
                  <el-icon><MagicStick /></el-icon>
                  <span v-if="!isBindingMaterials">AI智能绑定</span>
                  <span v-else>AI绑定中... {{ bindingProgress }}%</span>
                </el-button>
              </el-tooltip>
              <span v-if="selectedMaterials.length === 0" class="material-hint">
                <el-icon><InfoFilled /></el-icon>
                请先选择素材
              </span>
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
                <el-tag
                  v-for="materialTitle in section.data_requirements"
                  :key="materialTitle"
                  closable
                  @close="() => $emit('unbindMaterialFromSection', sectionIndex, materialTitle)"
                  type="primary"
                >
                  {{ materialTitle }}
                </el-tag>
                <el-tag v-if="section.data_requirements.length === 0" type="info" plain>
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
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import type { Material } from '@/types/material'
  import UnifiedMaterialCard from '@/components/custom/material-card/UnifiedMaterialCard.vue'
  import {
    FolderOpened,
    Link,
    Plus,
    MagicStick,
    Document,
    InfoFilled,
    ArrowDown,
    ArrowUp
  } from '@element-plus/icons-vue'

  // Props
  defineProps<{
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
    (e: 'handleAIBindMaterials'): void
    (e: 'bindMaterialToSection', sectionIndex: number, material: Material): void
    (e: 'unbindMaterialFromSection', sectionIndex: number, materialTitle: string): void
  }>()

  // 素材相关状态
  const materialsCollapsed = ref(false)

  const handleClearSelection = () => {
    emit('clearSelection')
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
    background: var(--art-fill-color-light);
    border-bottom: 1px solid var(--art-border-color);
    transition: all 0.3s ease;

    &:hover {
      background: var(--art-fill-color);
    }
  }

  .materials-title {
    flex: 1;

    h3 {
      margin: 0 0 var(--art-spacing-xs, 4px);
      font-size: var(--art-font-size-base-lg, 18px);
      font-weight: var(--art-font-weight-medium, 500);
      color: var(--art-text-color-primary);
    }

    .materials-subtitle {
      margin: 0;
      font-size: var(--art-font-size-xs, 13px);
      line-height: var(--art-line-height-normal, 1.4);
      color: var(--art-text-color-secondary);
    }
  }

  .materials-controls {
    display: flex;
    gap: var(--art-spacing-lg, 16px);
    align-items: center;
  }

  .materials-content {
    padding: var(--art-padding-xl, 32px);
    background: var(--art-main-bg-color);
  }

  .materials-selection {
    .materials-list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--art-spacing-lg, 20px);

      h4 {
        margin: 0;
        font-size: var(--art-font-size-base, 16px);
        font-weight: var(--art-font-weight-medium, 500);
        color: var(--art-text-color-primary);
      }
    }

    .empty-materials {
      padding: var(--art-padding-xl, 40px) var(--art-padding-lg, 24px);
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

    .materials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--art-spacing-lg, 16px);
    }
  }

  .material-binding {
    padding: var(--art-padding-lg, 24px);
    margin-top: var(--art-spacing-xl, 32px);
    background: var(--art-fill-color-light);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius, 8px);

    .binding-header {
      display: flex;
      gap: var(--art-spacing-lg, 16px);
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: var(--art-spacing-lg, 20px);

      .header-left {
        flex: 1;

        h4 {
          display: flex;
          gap: var(--art-spacing-sm, 8px);
          align-items: center;
          margin: 0 0 var(--art-spacing-sm, 8px);
          font-size: var(--art-font-size-base, 16px);
          font-weight: var(--art-font-weight-medium, 500);
          color: var(--art-text-color-primary);

          .el-icon {
            color: var(--el-color-primary);
          }
        }

        p {
          margin: 0;
          font-size: var(--art-font-size-xs, 13px);
          line-height: var(--art-line-height-normal, 1.4);
          color: var(--art-text-color-secondary);
        }
      }

      .header-actions {
        display: flex;
        flex-shrink: 0;
        gap: var(--art-spacing-sm, 8px);
        align-items: center;

        .material-hint {
          display: flex;
          gap: var(--art-spacing-xs, 4px);
          align-items: center;
          font-size: var(--art-font-size-xs, 12px);
          color: var(--art-text-color-secondary, #909399);
          white-space: nowrap;
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

  // 平板设备适配
  @media (max-width: $device-ipad) {
    .materials-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }
</style>
