<template>
  <div class="art-card title-section">
    <div class="title-header" @click="titleCollapsed = !titleCollapsed">
      <div class="title-info">
        <div class="section-indicator">
          <div class="step-number">1</div>
          <div class="step-title">
            <h3>
              <el-icon><Document /></el-icon>
              选定标题与相关素材
            </h3>
            <div class="status-badges">
              <el-tag v-if="isTitleCompleted" type="success" size="small" effect="light">
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
          从选题阶段选择的标题和相关素材，将作为AI生成大纲的基础
        </p>
      </div>
      <div class="title-controls">
        <div class="completion-indicator">
          <el-progress
            :percentage="isTitleCompleted ? 100 : 0"
            :stroke-width="6"
            :show-text="false"
            status="success"
          />
          <span class="progress-text">{{ isTitleCompleted ? '完成' : '待完成' }}</span>
        </div>
        <el-button :icon="titleCollapsed ? ArrowDown : ArrowUp" link>
          {{ titleCollapsed ? '展开详情' : '收起详情' }}
        </el-button>
      </div>
    </div>

    <el-collapse-transition>
      <div v-show="!titleCollapsed" class="title-content">
        <!-- 有选定标题时显示 -->
        <div v-if="selectedTitle" class="title-details">
          <!-- 使用TitleCard组件显示选中的标题 -->
          <div class="selected-title-section">
            <div class="section-header">
              <h4>已选中的标题</h4>
              <el-tag type="success" size="small" effect="light">
                <el-icon><Check /></el-icon>
                确认选择
              </el-tag>
            </div>

            <div class="title-card-wrapper">
              <TitleCard
                :title="selectedTitle"
                :is-selected="true"
                :score="getTitleScore()"
                :suggestions="getTitleSuggestions()"
                :materials="titleRelatedMaterials"
                @select="handleTitleSelect"
                @update="handleTitleUpdate"
              />
            </div>
          </div>

          <!-- 相关素材显示区域 -->
          <div class="materials-section">
            <div class="materials-header" @click="toggleMaterialsCollapse">
              <div class="materials-info">
                <h4>
                  <el-icon><FolderOpened /></el-icon>
                  相关素材 ({{ allMaterials.length }})
                </h4>
                <p class="materials-subtitle"> 选中标题的引用素材，可作为大纲生成的重要参考 </p>
              </div>
              <div class="materials-controls">
                <el-button type="primary" @click="handleAddMaterial" size="small">
                  <el-icon><Plus /></el-icon>
                  添加素材
                </el-button>
                <el-tag type="info" size="small" effect="light">
                  {{ materialsCollapsed ? '已收纳' : '展开中' }}
                </el-tag>
                <el-button :icon="materialsCollapsed ? ArrowDown : ArrowUp" link size="small">
                  {{ materialsCollapsed ? '展开' : '收纳' }}
                </el-button>
              </div>
            </div>

            <el-collapse-transition>
              <div v-show="!materialsCollapsed" class="materials-content">
                <!-- 空状态显示 -->
                <div v-if="isEmpty" class="empty-materials">
                  <div class="empty-content">
                    <div class="empty-visual">
                      <el-icon><FolderOpened /></el-icon>
                    </div>
                    <div class="empty-text">
                      <h4>还没有添加相关素材</h4>
                      <p>添加素材将为AI生成大纲提供更多参考信息</p>
                    </div>
                    <div class="empty-actions">
                      <el-button type="primary" @click="handleAddMaterial" size="large">
                        <el-icon><Plus /></el-icon>
                        添加素材
                      </el-button>
                    </div>
                  </div>
                </div>

                <!-- 有素材时显示 -->
                <div v-else class="materials-grid">
                  <UnifiedMaterialCard
                    v-for="material in displayMaterials"
                    :key="material.id"
                    :material="material"
                    :show-selection="false"
                    :show-score="true"
                    context="search"
                    @preview="handleMaterialPreview"
                    @click="handleMaterialPreview"
                  />
                </div>

                <!-- 显示更多按钮 -->
                <div v-if="showMoreButton" class="show-more-section">
                  <el-button @click="toggleShowAllMaterials" link>
                    {{ showAllMaterials ? '收起部分' : `显示全部 ${allMaterials.length} 个素材` }}
                    <el-icon>
                      <component :is="showAllMaterials ? ArrowUp : ArrowDown" />
                    </el-icon>
                  </el-button>
                </div>
              </div>
            </el-collapse-transition>
          </div>

          <!-- 操作按钮 -->
          <div class="title-actions">
            <el-button size="small" @click="editTitle" class="art-button">
              <el-icon><Edit /></el-icon>
              重新选择标题
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

        <!-- 无标题时的空状态 -->
        <div v-else class="empty-title">
          <div class="empty-content">
            <div class="empty-icon">
              <el-icon><DocumentAdd /></el-icon>
            </div>
            <div class="empty-text">
              <h4>尚未选择研究标题</h4>
              <p>请先返回选题页面选择标题并确认，这是生成高质量大纲的第一步</p>
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
  import { ref, watch } from 'vue'
  import {
    Document,
    DocumentAdd,
    Edit,
    Search,
    ArrowLeft,
    ArrowDown,
    ArrowUp,
    Check,
    Warning,
    InfoFilled,
    FolderOpened,
    Plus
  } from '@element-plus/icons-vue'
  import TitleCard from '../TitleCard.vue'
  import UnifiedMaterialCard from '../material-card/UnifiedMaterialCard.vue'
  import type { Material } from '@/types/ai'
  import { useTitleSection } from '@/composables/document/useTitleSection'
  import { useTitleMaterials } from '@/composables/document/useTitleMaterials'

  defineOptions({ name: 'DocumentTitleSection' })

  // Props
  const props = defineProps<{
    projectId: string
    selectedMaterials?: Material[]
  }>()

  // Emits
  const emit = defineEmits<{
    (e: 'editTitle'): void
    (e: 'viewSearchResults'): void
    (e: 'materialPreview', material: Material): void
    (e: 'addMaterial'): void
    (e: 'update:allMaterials', materials: Material[]): void
  }>()

  // ====== 组合式函数 ======

  // 标题分区逻辑
  const titleSection = useTitleSection({
    projectId: props.projectId,
    selectedMaterials: props.selectedMaterials
  })

  // 素材显示逻辑
  const titleMaterials = useTitleMaterials({
    get allMaterials() {
      return titleSection.allMaterials.value
    },
    emit
  })

  // ====== 本地状态 ======
  const titleCollapsed = ref(false)

  // ====== 监听器 ======

  // 监听 allMaterials 变化，通知父组件
  watch(
    () => titleSection.allMaterials.value,
    (newMaterials) => {
      emit('update:allMaterials', newMaterials)
    },
    { immediate: true }
  )

  // ====== 解构以便模板使用 ======
  const {
    selectedTitle,
    titleRelatedMaterials,
    allMaterials,
    isTitleCompleted,
    getTitleScore,
    getTitleSuggestions,
    handleTitleSelect,
    handleTitleUpdate,
    editTitle,
    viewSearchResults,
    goBackToTitleSelection
  } = titleSection

  const {
    materialsCollapsed,
    showAllMaterials,
    displayMaterials,
    showMoreButton,
    isEmpty,
    handleMaterialPreview,
    handleAddMaterial,
    toggleShowAllMaterials,
    toggleMaterialsCollapse
  } = titleMaterials
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
    }
  }

  .title-info {
    flex: 1;
  }

  .section-indicator {
    display: flex;
    gap: var(--art-spacing-md, 16px);
    align-items: center;
    margin-bottom: var(--art-spacing-sm, 12px);
  }

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-weight: bold;
    color: white;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.4);
  }

  .step-title {
    display: flex;
    gap: var(--art-spacing-md, 16px);
    align-items: center;

    h3 {
      display: flex;
      gap: var(--art-spacing-sm, 8px);
      align-items: center;
      margin: 0;
      font-size: var(--art-font-size-lg, 18px);
      font-weight: 600;
      color: var(--art-text-color-primary);
    }
  }

  .status-badges {
    display: flex;
    gap: var(--art-spacing-sm, 8px);
  }

  .title-subtitle {
    display: flex;
    gap: var(--art-spacing-xs, 6px);
    align-items: center;
    padding-left: 48px;
    margin: 0;
    font-size: var(--art-font-size-sm, 14px);
    color: var(--art-text-color-secondary);
  }

  .title-controls {
    display: flex;
    gap: var(--art-spacing-lg, 24px);
    align-items: center;
  }

  .completion-indicator {
    display: flex;
    gap: var(--art-spacing-sm, 12px);
    align-items: center;

    .progress-text {
      font-size: var(--art-font-size-sm, 12px);
      color: var(--art-text-color-secondary);
      white-space: nowrap;
    }
  }

  .title-content {
    padding: var(--art-padding-lg, 24px);
  }

  .title-details {
    display: flex;
    flex-direction: column;
    gap: var(--art-spacing-xl, 32px);
  }

  .selected-title-section,
  .materials-section {
    display: flex;
    flex-direction: column;
    gap: var(--art-spacing-md, 16px);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h4 {
      margin: 0;
      font-size: var(--art-font-size-base, 16px);
      font-weight: 600;
      color: var(--art-text-color-primary);
    }
  }

  .materials-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--art-padding-md, 16px);
    cursor: pointer;
    background: var(--art-fill-color);
    border-radius: var(--art-border-radius, 8px);
    transition: all 0.3s ease;

    &:hover {
      background: var(--art-fill-color-dark);
    }
  }

  .materials-info {
    h4 {
      display: flex;
      gap: var(--art-spacing-sm, 8px);
      align-items: center;
      margin: 0 0 var(--art-spacing-xs, 6px) 0;
      font-size: var(--art-font-size-base, 16px);
      font-weight: 600;
      color: var(--art-text-color-primary);
    }
  }

  .materials-subtitle {
    margin: 0;
    font-size: var(--art-font-size-sm, 14px);
    color: var(--art-text-color-secondary);
  }

  .materials-controls {
    display: flex;
    gap: var(--art-spacing-md, 16px);
    align-items: center;
  }

  .materials-content {
    padding: var(--art-padding-md, 16px) 0;
  }

  .materials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--art-spacing-md, 16px);
  }

  .show-more-section {
    padding: var(--art-padding-md, 16px);
    text-align: center;
  }

  .title-actions {
    display: flex;
    gap: var(--art-spacing-md, 16px);
    padding-top: var(--art-spacing-md, 16px);
    border-top: 1px dashed var(--art-border-color);
  }

  .empty-materials,
  .empty-title {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--art-padding-xl, 48px);
  }

  .empty-content {
    max-width: 400px;
    text-align: center;
  }

  .empty-visual,
  .empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    margin: 0 auto var(--art-spacing-lg, 24px);
    font-size: 32px;
    color: var(--el-color-primary);
    background: linear-gradient(135deg, var(--art-fill-color) 0%, var(--art-fill-color-dark) 100%);
    border-radius: 50%;

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .empty-text {
    h4 {
      margin: 0 0 var(--art-spacing-sm, 12px) 0;
      font-size: var(--art-font-size-lg, 18px);
      font-weight: 600;
      color: var(--art-text-color-primary);
    }

    p {
      margin: 0 0 var(--art-spacing-lg, 24px) 0;
      font-size: var(--art-font-size-sm, 14px);
      line-height: 1.6;
      color: var(--art-text-color-secondary);
    }
  }

  .empty-actions {
    display: flex;
    gap: var(--art-spacing-md, 16px);
    justify-content: center;
  }
</style>
