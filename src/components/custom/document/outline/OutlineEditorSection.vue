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
      <OutlineEditorHeader
        :generated-outline="generatedOutline"
        :can-generate-from-title="canGenerateFromTitle"
        :generating-outline="generatingOutline"
        :is-binding-materials="isBindingMaterials"
        :binding-result="bindingResult"
        :get-all-materials="getAllMaterials"
        @generate-ai-outline="emit('generateAIOutline')"
        @generate-ai-complete-outline="emit('generateAICompleteOutline')"
        @ai-bind-materials="emit('aiBindMaterials')"
      />

      <!-- 手动编辑区域 -->
      <div class="manual-edit-section">
        <div class="section-title">
          <el-icon><Operation /></el-icon>
          <span>手动编辑</span>
        </div>
        <div class="action-grid">
          <el-button @click="emit('addSection')" :disabled="!canAddSection" class="art-button">
            <el-icon><Plus /></el-icon>
            添加章节
          </el-button>
          <el-button
            @click="emit('clearOutline')"
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
      <!-- 空状态 -->
      <OutlineEditorEmpty
        v-if="generatedOutline.length === 0"
        :can-generate="canGenerateFromTitle"
        :can-add="canAddSection"
        @generate="emit('generateAIOutline')"
        @add-section="emit('addSection')"
      />

      <!-- 大纲列表 -->
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
            <el-button size="small" @click="emit('addSection')" :disabled="!canAddSection">
              <el-icon><Plus /></el-icon>
              添加章节
            </el-button>
          </div>
        </div>

        <div class="outline-list">
          <OutlineSectionItem
            v-for="(section, index) in generatedOutline"
            :key="section.title"
            :section="section"
            :section-index="index"
            :is-last-section="index === generatedOutline.length - 1"
            :available-materials="getAvailableMaterialsForSection(index)"
            :section-bindings="getSectionBindings(index)"
            :average-match-score="getAverageMatchScore(index)"
            :binding-result="bindingResult"
            @update-title="handleEditTitle(section.title, $event)"
            @update-content="handleEditContent(section.title, $event)"
            @move-up="emit('moveSectionUp', $event)"
            @move-down="emit('moveSectionDown', $event)"
            @delete="emit('deleteSection', $event)"
            @bind-material="handleBindMaterial(index, $event)"
            @unbind-material="handleUnbindMaterial(index, $event)"
            @unbind-manual-material="handleUnbindMaterial(index, $event)"
          />
        </div>
      </div>
    </div>

    <div class="outline-actions-bottom">
      <el-button @click="emit('goBack')" size="large" class="art-button art-button--secondary"
        >返回标题</el-button
      >
      <el-button
        type="success"
        size="large"
        @click="emit('confirmOutline')"
        :disabled="generatedOutline.length === 0"
        class="art-button art-button--primary"
      >
        确认大纲并继续
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Material } from '@/types/core/material'
import type { OutlineSection } from '@/types/core/outline'
import type { MaterialBindResult } from './types'

// 子组件
import OutlineEditorHeader from './OutlineEditorHeader.vue'
import OutlineEditorEmpty from './OutlineEditorEmpty.vue'
import OutlineSectionItem from './OutlineSectionItem.vue'

defineOptions({ name: 'OutlineEditorSection' })

// Props
interface Props {
  /** 生成的大纲章节列表 */
  generatedOutline: OutlineSection[]
  /** 是否可以从标题生成大纲 */
  canGenerateFromTitle: boolean
  /** 是否可以添加章节 */
  canAddSection: boolean
  /** 是否正在生成大纲 */
  generatingOutline: boolean
  /** 已选择的素材列表 */
  selectedMaterials: Material[]
  /** 是否正在绑定素材 */
  isBindingMaterials: boolean
  /** 素材绑定结果 */
  bindingResult: MaterialBindResult | null
}

const props = defineProps<Props>()

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
  (e: 'editSection', title: string, data: Partial<OutlineSection>): void
  (e: 'goBack'): void
  (e: 'bindMaterial', sectionIndex: number, material: Material): void
  (e: 'unbindMaterial', sectionIndex: number, materialTitle: string): void
  (e: 'aiBindMaterials'): void
}>()

// 计算属性：获取所有素材
const getAllMaterials = computed(() => props.selectedMaterials)

// 计算属性：获取章节的绑定信息
const getSectionBindings = (sectionIndex: number) => {
  if (!props.bindingResult) return null
  const binding = props.bindingResult.material_section_bindings[sectionIndex]
  return binding || null
}

// 计算属性：获取平均匹配分数
const getAverageMatchScore = (sectionIndex: number): number => {
  const bindings = getSectionBindings(sectionIndex)
  if (!bindings || bindings.match_scores.length === 0) return 0
  const sum = bindings.match_scores.reduce((acc, score) => acc + score, 0)
  return Math.round(sum / bindings.match_scores.length)
}

// 计算属性：获取可用的素材列表
const getAvailableMaterialsForSection = (sectionIndex: number): Material[] => {
  const bindings = getSectionBindings(sectionIndex)
  if (!bindings) return props.selectedMaterials

  const boundTitles = bindings.materials.map(m => m.title)
  return props.selectedMaterials.filter(m => !boundTitles.includes(m.title))
}

// 方法：编辑章节标题
const handleEditTitle = (title: string, newTitle: string) => {
  emit('editSection', title, { title: newTitle })
}

// 方法：编辑章节内容方向
const handleEditContent = (title: string, contentDirection: string) => {
  emit('editSection', title, { content_direction: contentDirection })
}

// 方法：绑定素材
const handleBindMaterial = (sectionIndex: number, material: Material) => {
  emit('bindMaterial', sectionIndex, material)
}

// 方法：解绑素材
const handleUnbindMaterial = (sectionIndex: number, materialTitle: string) => {
  emit('unbindMaterial', sectionIndex, materialTitle)
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
      padding: var(--art-padding-lg, 16px);
    }

    .manual-edit-section {
      .action-grid {
        grid-template-columns: 1fr;
        gap: var(--art-spacing-sm, 8px);
      }
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
  }

  // 平板设备适配
  @media (max-width: $device-ipad) {
    .manual-edit-section {
      .action-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--art-spacing-md, 10px);
      }
    }
  }
</style>
