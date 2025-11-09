<template>
  <div class="art-card outline-content">
    <div class="outline-header">
      <div class="outline-actions">
        <!-- AI生成区域 -->
        <div class="actions-group">
          <div class="action-grid">
            <el-button
              @click="handleGenerateAIOutline"
              :loading="generatingOutline"
              :disabled="!canGenerateFromTitle"
              type="primary"
              class="art-button"
            >
              <el-icon><MagicStick /></el-icon>
              AI生成大纲
            </el-button>
            <el-button
              @click="handleGenerateAICompleteOutline"
              :loading="generatingOutline"
              :disabled="!canGenerateFromTitle || selectedMaterialsCount === 0"
              type="success"
              class="art-button"
            >
              <el-icon><MagicStick /></el-icon>
              AI完整生成（含素材绑定）
            </el-button>
          </div>
        </div>
        <!-- 其他操作区域 -->
        <div class="actions-group">
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
        <div class="empty-icon">📝</div>
        <h4>大纲为空</h4>
        <p>点击"AI生成大纲"让AI为您创建内容大纲，或手动添加章节</p>
      </div>

      <div v-else class="outline-tree">
        <div
          v-for="(section, sectionIndex) in generatedOutline"
          :key="section.title"
          class="outline-section"
        >
          <div class="section-header">
            <div class="section-info">
              <span class="section-number">{{ sectionIndex + 1 }}</span>
              <input
                v-model="section.title"
                class="section-title-input"
                placeholder="章节标题"
                @blur="handleEditSection(section.title, { title: section.title })"
              />
            </div>
            <div class="section-controls">
              <el-button
                @click="handleMoveSectionUp(sectionIndex)"
                size="small"
                link
                :disabled="sectionIndex === 0"
              >
                上移
              </el-button>
              <el-button
                @click="handleMoveSectionDown(sectionIndex)"
                size="small"
                link
                :disabled="sectionIndex === generatedOutline.length - 1"
              >
                下移
              </el-button>
              <el-button @click="handleDeleteSection(sectionIndex)" size="small" type="danger" link>
                删除
              </el-button>
            </div>
          </div>

          <div class="section-content">
            <div class="content-direction">
              <label>内容方向：</label>
              <textarea
                v-model="section.content_direction"
                class="content-direction-textarea"
                placeholder="请输入内容方向和写作要点"
                @blur="
                  handleEditSection(section.title, {
                    content_direction: section.content_direction
                  })
                "
              />
            </div>
            <div class="data-requirements">
              <label>数据需求：</label>
              <el-tag
                v-for="req in section.data_requirements"
                :key="req"
                size="small"
                effect="plain"
              >
                {{ req }}
              </el-tag>
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
  import { Plus, MagicStick, Delete } from '@element-plus/icons-vue'

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
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: var(--art-spacing-lg, 24px);
    margin-bottom: var(--art-spacing-xl, 32px);
    border-bottom: 1px solid var(--art-border-color);
  }

  .outline-actions {
    display: flex;
    flex-direction: column;
    gap: var(--art-spacing-lg, 20px);
  }

  .actions-group {
    .action-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--art-spacing-md, 12px);

      .el-button {
        width: 100%;
        text-align: center;
      }
    }
  }

  .empty-outline {
    padding: var(--art-padding-2xl, 60px) var(--art-padding-lg, 24px);
    text-align: center;

    .empty-icon {
      margin-bottom: var(--art-spacing-lg, 20px);
      font-size: 48px;
      opacity: 0.7;
    }

    h4 {
      margin: 0 0 var(--art-spacing-md, 12px);
      font-size: var(--art-font-size-base-lg, 18px);
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

  .outline-tree {
    margin-bottom: var(--art-spacing-xl, 32px);
  }

  .outline-section {
    box-sizing: border-box;
    padding: var(--art-padding-lg, 16px);
    margin-bottom: var(--art-spacing-lg, 20px);
    overflow: hidden;
    background: var(--art-fill-color-light);
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
