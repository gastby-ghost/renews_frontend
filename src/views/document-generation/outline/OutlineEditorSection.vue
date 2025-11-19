<template>
  <div class="art-card outline-content">
    <div class="outline-header">
      <div class="section-indicator">
        <div class="step-number">2</div>
        <div class="step-content">
          <h3>
            <el-icon><EditPen /></el-icon>
            大纲编辑与素材绑定
          </h3>
          <p class="step-description">创建文档大纲，智能匹配素材，确定内容结构</p>
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

      <!-- AI功能按钮组 -->
      <div class="ai-function-section">
        <div class="ai-buttons-container">
          <el-tooltip
            content="基于您的标题和素材，AI将生成结构化的大纲（保留现有内容）"
            placement="top"
            :disabled="!canGenerateFromTitle"
          >
            <el-button
              @click="handleGenerateAIOutline"
              :loading="generatingOutline"
              :disabled="!canGenerateFromTitle"
              type="primary"
              size="large"
              class="ai-function-button outline-button"
            >
              <el-icon class="button-icon"><MagicStick /></el-icon>
              <span class="button-text">智能大纲生成</span>
            </el-button>
          </el-tooltip>

          <el-tooltip
            content="AI将分析章节内容，自动匹配最相关的素材到对应章节"
            placement="top"
            :disabled="getAllMaterials.length > 0 && generatedOutline.length > 0"
          >
            <el-button
              @click="handleAIBindMaterials"
              :loading="isBindingMaterials"
              :disabled="
                isBindingMaterials || getAllMaterials.length === 0 || generatedOutline.length === 0
              "
              type="success"
              size="large"
              class="ai-function-button binding-button"
            >
              <el-icon class="button-icon"><Link /></el-icon>
              <span class="button-text">智能素材绑定</span>
            </el-button>
          </el-tooltip>

          <el-tooltip
            content="一键完成大纲生成、素材检索和智能绑定（将清空当前大纲）"
            placement="top"
            :disabled="!canGenerateFromTitle || getAllMaterials.length === 0"
          >
            <el-button
              @click="handleGenerateAICompleteOutline"
              :loading="generatingOutline"
              :disabled="!canGenerateFromTitle || getAllMaterials.length === 0"
              type="warning"
              size="large"
              class="ai-function-button complete-button"
            >
              <el-icon class="button-icon"><Cpu /></el-icon>
              <span class="button-text">完整智能生成</span>
            </el-button>
          </el-tooltip>
        </div>

        <!-- 状态提示区域 -->
        <div class="status-section">
          <div v-if="!canGenerateFromTitle && getAllMaterials.length === 0" class="status-hint">
            <el-icon><WarningFilled /></el-icon>
            <span>请先选择标题并完善研究简报，然后选择素材</span>
          </div>
          <div v-else-if="!canGenerateFromTitle" class="status-hint">
            <el-icon><WarningFilled /></el-icon>
            <span>请先选择标题并完善研究简报</span>
          </div>
          <div v-else-if="getAllMaterials.length === 0" class="status-hint">
            <el-icon><WarningFilled /></el-icon>
            <span>请先在标题区域选择素材</span>
          </div>
          <div v-else-if="bindingResult" class="status-success">
            <el-icon><Check /></el-icon>
            <span
              >已绑定 {{ bindingResult.binding_summary.total_materials_bound }} 个素材到
              {{ bindingResult.binding_summary.total_sections }} 个章节</span
            >
          </div>
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
                :class="{ active: getActiveDetailTab(sectionIndex) === `${sectionIndex}-content` }"
                @click="setActiveDetailTab(sectionIndex, `${sectionIndex}-content`)"
              >
                <el-icon><EditPen /></el-icon>
                内容方向
              </div>
              <div
                class="tab-item"
                :class="{
                  active: getActiveDetailTab(sectionIndex) === `${sectionIndex}-requirements`
                }"
                @click="setActiveDetailTab(sectionIndex, `${sectionIndex}-requirements`)"
              >
                <el-icon><Link /></el-icon>
                素材需求
              </div>
            </div>

            <div
              v-show="getActiveDetailTab(sectionIndex) === `${sectionIndex}-content`"
              class="tab-content"
            >
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

            <div
              v-show="getActiveDetailTab(sectionIndex) === `${sectionIndex}-requirements`"
              class="tab-content"
            >
              <div class="data-requirements">
                <label>
                  <el-icon><Document /></el-icon>
                  素材需求
                </label>

                <!-- AI绑定结果展示 -->
                <div
                  v-if="bindingResult && getSectionBindings(sectionIndex)"
                  class="ai-bindings-section"
                >
                  <div class="bindings-header">
                    <el-icon><MagicStick /></el-icon>
                    <span>AI智能绑定结果</span>
                    <el-tag type="success" size="small" effect="light">
                      匹配度: {{ getAverageMatchScore(sectionIndex) }}%
                    </el-tag>
                  </div>
                  <div class="bound-materials-list">
                    <el-tooltip
                      v-for="(material, materialIndex) in getSectionBindings(sectionIndex)!
                        .materials"
                      :key="material.id"
                      :content="material.relevance_explanation"
                      placement="top"
                    >
                      <el-tag
                        closable
                        @close="() => handleUnbindMaterial(sectionIndex, material.title)"
                        type="success"
                        class="bound-material-tag"
                      >
                        <div class="tag-content">
                          <span class="material-title">{{ material.title }}</span>
                          <el-tag size="small" type="info" effect="plain" class="match-score">
                            {{ getSectionBindings(sectionIndex)!.match_scores[materialIndex] }}
                          </el-tag>
                        </div>
                      </el-tag>
                    </el-tooltip>
                  </div>
                </div>

                <!-- 手动绑定的素材 -->
                <div
                  v-if="section.data_requirements && section.data_requirements.length > 0"
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
                      @close="() => handleUnbindMaterial(sectionIndex, materialTitle)"
                      type="primary"
                      class="requirement-tag"
                    >
                      {{ materialTitle }}
                    </el-tag>
                  </div>
                </div>

                <!-- 选择并绑定素材 -->
                <div class="material-selection-section">
                  <el-dropdown trigger="click">
                    <el-button
                      size="small"
                      :type="getAllMaterials.length === 0 ? 'info' : 'primary'"
                      :plain="getAllMaterials.length > 0"
                      :disabled="getAllMaterials.length === 0"
                    >
                      <el-icon><Collection /></el-icon>
                      {{ getAllMaterials.length === 0 ? '请先选择素材' : '选择并绑定素材' }}
                      <el-icon v-if="getAllMaterials.length > 0"><CaretBottom /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item
                          v-for="material in getAvailableMaterialsForSectionCached(sectionIndex)"
                          :key="material.id"
                          @click="handleBindMaterial(sectionIndex, material)"
                        >
                          <el-icon><Document /></el-icon>
                          {{ material.title }}
                          <small style="margin-left: 8px; color: var(--art-text-color-secondary)">
                            {{ material.summary?.substring(0, 30) }}...
                          </small>
                        </el-dropdown-item>
                        <el-dropdown-item
                          v-if="
                            getAvailableMaterialsForSectionCached(sectionIndex).length === 0 &&
                            getAllMaterials.length > 0
                          "
                          disabled
                        >
                          <el-icon><Check /></el-icon>
                          所有素材已绑定
                        </el-dropdown-item>
                        <el-dropdown-item v-if="getAllMaterials.length === 0" disabled>
                          <el-icon><WarningFilled /></el-icon>
                          暂无可用素材，请先从其他地方选择素材
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>

                <!-- 空状态 -->
                <div
                  v-if="
                    (!bindingResult || !getSectionBindings(sectionIndex)) &&
                    (!section.data_requirements || section.data_requirements.length === 0)
                  "
                  class="empty-requirements"
                >
                  <el-icon><FolderOpened /></el-icon>
                  <span>暂无绑定的素材</span>
                  <small>点击上面的"选择并绑定素材"按钮或使用"智能素材绑定"功能</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // UI图标导入
  import {
    Plus,
    MagicStick,
    Delete,
    EditPen,
    Check,
    Edit,
    Operation,
    WarningFilled,
    Document,
    List,
    Rank,
    MoreFilled,
    ArrowUp,
    ArrowDown,
    Link,
    Guide,
    FolderOpened,
    Cpu,
    Collection,
    CaretBottom
  } from '@element-plus/icons-vue'

  // 导入 composable
  import { useOutlineEditor } from '@/composables/document/useOutlineEditor'

  // 类型定义
  import type { Material } from '@/types/material'

  // 响应式状态
  import { reactive, computed } from 'vue'

  // ========== Props 定义 ==========
  const props = defineProps<{
    selectedMaterials?: Material[]
  }>()

  // ========== 使用 Composable ==========
  const {
    // 计算属性
    generatedOutline,
    canGenerateFromTitle,
    canAddSection,
    generatingOutline,
    isBindingMaterials,
    bindingResult,
    getAllMaterials,

    // 事件处理方法
    handleGenerateAIOutline,
    handleGenerateAICompleteOutline,
    handleAIBindMaterials,
    handleAddSection,
    handleDeleteSection,
    handleMoveSectionUp,
    handleMoveSectionDown,
    handleClearOutline,
    handleEditSection,
    handleBindMaterial,
    handleUnbindMaterial,

    // 业务逻辑方法
    getSectionBindings,
    getAverageMatchScore
  } = useOutlineEditor(props.selectedMaterials)

  /**
   * 缓存每个章节的可用素材（使用 computed 避免递归更新）
   * 这个 computed 只在 generatedOutline 或 getAllMaterials 变化时重新计算
   */
  const availableMaterialsCache = computed(() => {
    const cache = new Map<number, Material[]>()
    const allMaterials = getAllMaterials.value

    generatedOutline.value.forEach((section: any, index: number) => {
      // 获取当前章节已绑定的素材
      const boundMaterials = new Set(section.data_requirements || [])

      // 过滤出未绑定的素材
      const available = allMaterials.filter((material) => !boundMaterials.has(material.title))
      cache.set(index, available)
    })

    return cache
  })

  // ========== 本地状态 ==========
  // 每个章节的tab状态，使用 reactive 创建响应式对象
  const sectionTabStates = reactive<Record<number, string>>({})

  /**
   * 设置章节的活跃tab
   */
  const setActiveDetailTab = (sectionIndex: number, tab: string) => {
    sectionTabStates[sectionIndex] = tab
  }

  /**
   * 获取章节的活跃tab
   */
  const getActiveDetailTab = (sectionIndex: number) => {
    // 如果没有设置过tab，默认显示 'content'
    if (!sectionTabStates[sectionIndex]) {
      sectionTabStates[sectionIndex] = `${sectionIndex}-content`
    }
    return sectionTabStates[sectionIndex]
  }

  /**
   * 获取指定章节的可用素材（使用缓存）
   */
  const getAvailableMaterialsForSectionCached = (sectionIndex: number): Material[] => {
    const cached = availableMaterialsCache.value.get(sectionIndex)
    if (cached) {
      return cached
    }
    // 如果缓存中没有，直接计算并返回
    if (generatedOutline.value[sectionIndex]) {
      const section = generatedOutline.value[sectionIndex] as any
      const boundMaterials = new Set(section.data_requirements || [])
      return getAllMaterials.value.filter((material) => !boundMaterials.has(material.title))
    }
    return []
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

  .ai-function-section {
    padding: var(--art-spacing-lg, 24px);
    margin-bottom: var(--art-spacing-lg, 24px);
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius-lg, 12px);
    box-shadow: 0 2px 8px rgb(0 0 0 / 4%);

    .ai-buttons-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--art-spacing-md, 16px);
      justify-content: center;
      margin-bottom: var(--art-spacing-md, 16px);

      .ai-function-button {
        display: flex;
        flex: 1;
        gap: var(--art-spacing-sm, 8px);
        align-items: center;
        justify-content: center;
        min-width: 200px;
        max-width: 280px;
        height: 56px;
        font-size: var(--art-font-size-base, 16px);
        font-weight: var(--art-font-weight-medium, 500);
        border: none;
        border-radius: var(--art-border-radius-lg, 12px);
        transition: all 0.3s ease;

        .button-icon {
          margin-right: var(--art-spacing-xs, 4px);
          font-size: 20px;
        }

        .button-text {
          font-size: var(--art-font-size-base, 16px);
        }

        &.outline-button {
          background: linear-gradient(
            135deg,
            var(--el-color-primary) 0%,
            var(--el-color-primary-light-3) 100%
          );
          box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.25);

          &:hover:not(:disabled) {
            box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.35);
            transform: translateY(-2px);
          }
        }

        &.binding-button {
          background: linear-gradient(
            135deg,
            var(--el-color-success) 0%,
            var(--el-color-success-light-3) 100%
          );
          box-shadow: 0 4px 12px rgba(var(--el-color-success-rgb), 0.25);

          &:hover:not(:disabled) {
            box-shadow: 0 6px 20px rgba(var(--el-color-success-rgb), 0.35);
            transform: translateY(-2px);
          }
        }

        &.complete-button {
          background: linear-gradient(
            135deg,
            var(--el-color-warning) 0%,
            var(--el-color-warning-light-3) 100%
          );
          box-shadow: 0 4px 12px rgba(var(--el-color-warning-rgb), 0.25);

          &:hover:not(:disabled) {
            box-shadow: 0 6px 20px rgba(var(--el-color-warning-rgb), 0.35);
            transform: translateY(-2px);
          }
        }
      }
    }

    .status-section {
      .status-hint,
      .status-success {
        display: flex;
        gap: var(--art-spacing-sm, 8px);
        align-items: center;
        justify-content: center;
        padding: var(--art-spacing-sm, 12px) var(--art-spacing-lg, 20px);
        font-size: var(--art-font-size-sm, 14px);
        border-radius: var(--art-border-radius, 8px);

        .el-icon {
          font-size: 16px;
        }
      }

      .status-hint {
        color: var(--el-color-warning);
        background: var(--el-color-warning-light-9);
        border: 1px solid var(--el-color-warning-light-7);
      }

      .status-success {
        color: var(--el-color-success);
        background: var(--el-color-success-light-9);
        border: 1px solid var(--el-color-success-light-7);
      }
    }
  }

  .manual-edit-section {
    margin-bottom: var(--art-spacing-lg, 24px);

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
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--art-spacing-md, 12px);

      .el-button {
        width: 100%;
        min-height: 48px;
        text-align: center;
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

  // 移动端适配
  @media (max-width: $device-phone) {
    .outline-content {
      padding: var(--art-padding-lg, 16px);
    }

    .ai-function-section {
      padding: var(--art-spacing-md, 16px);

      .ai-buttons-container {
        flex-direction: column;
        gap: var(--art-spacing-md, 12px);

        .ai-function-button {
          width: 100%;
          min-width: auto;
          max-width: none;
          height: 48px;
          font-size: var(--art-font-size-sm, 14px);

          .button-icon {
            font-size: 18px;
          }

          .button-text {
            font-size: var(--art-font-size-sm, 14px);
          }
        }
      }

      .status-section {
        .status-hint,
        .status-success {
          padding: var(--art-spacing-sm, 8px) var(--art-spacing-md, 12px);
          font-size: var(--art-font-size-xs, 12px);
          text-align: center;

          .el-icon {
            font-size: 14px;
          }
        }
      }
    }

    .manual-edit-section {
      .action-grid {
        grid-template-columns: 1fr;
        gap: var(--art-spacing-sm, 8px);
      }
    }

    .empty-outline {
      .quick-actions {
        grid-template-columns: 1fr;
        gap: var(--art-spacing-md, 16px);
      }
    }
  }

  // 平板设备适配
  @media (max-width: $device-ipad) {
    .ai-function-section {
      .ai-buttons-container {
        gap: var(--art-spacing-md, 12px);

        .ai-function-button {
          min-width: 180px;
          height: 52px;
          font-size: var(--art-font-size-sm, 15px);

          .button-icon {
            font-size: 19px;
          }

          .button-text {
            font-size: var(--art-font-size-sm, 15px);
          }
        }
      }
    }

    .manual-edit-section {
      .action-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--art-spacing-md, 10px);
      }
    }
  }
</style>
