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
              <el-tag
                v-if="documentStore.documentState.selectedTitle"
                type="success"
                size="small"
                effect="light"
              >
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
            :percentage="documentStore.documentState.selectedTitle ? 100 : 0"
            :stroke-width="6"
            :show-text="false"
            status="success"
          />
          <span class="progress-text">{{
            documentStore.documentState.selectedTitle ? '完成' : '待完成'
          }}</span>
        </div>
        <el-button :icon="titleCollapsed ? ArrowDown : ArrowUp" link>
          {{ titleCollapsed ? '展开详情' : '收起详情' }}
        </el-button>
      </div>
    </div>

    <el-collapse-transition>
      <div v-show="!titleCollapsed" class="title-content">
        <!-- 有选定标题时显示 -->
        <div v-if="documentStore.documentState.selectedTitle" class="title-details">
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
                :title="documentStore.documentState.selectedTitle"
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
            <div class="materials-header" @click="materialsCollapsed = !materialsCollapsed">
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
                <div v-if="allMaterials.length === 0" class="empty-materials">
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
                <div v-if="allMaterials.length > displayLimit" class="show-more-section">
                  <el-button @click="showAllMaterials = !showAllMaterials" link>
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
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
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

  // 组合式函数和状态管理
  import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'

  // 自定义组件
  import TitleCard from '@/components/custom/TitleCard.vue'
  import UnifiedMaterialCard from '@/components/custom/material-card/UnifiedMaterialCard.vue'

  // 类型定义
  import type { Title } from '@/types/ai'
  import type { Material } from '@/types/material'

  const router = useRouter()
  const documentStore = useDocumentGenerateStore()

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
  }>()

  // 标题分区状态
  const titleCollapsed = ref(false)
  const materialsCollapsed = ref(false)
  const showAllMaterials = ref(false)
  const displayLimit = 6

  // ====== 计算属性 ======

  /** 当前选中标题对应的素材列表 */
  const titleRelatedMaterials = computed(() => {
    if (!documentStore.documentState.selectedTitle) return []

    const selectedSources = documentStore.documentState.selectedTitle.sources || []

    if (selectedSources.length > 0 && documentStore.documentState.titleSearchResults) {
      const searchResults = Array.isArray(documentStore.documentState.titleSearchResults)
        ? documentStore.documentState.titleSearchResults.filter(
            (item: any) => typeof item === 'object' && item !== null
          )
        : []

      if (searchResults.length === 0) {
        return []
      }

      return searchResults
        .filter((_: any, index: number) => selectedSources.includes(index.toString()))
        .map((result: any) => {
          return {
            id: `search-${result.query || 'unknown'}-${Math.random().toString(36).substring(2, 9)}`,
            title: result.aititle || '',
            summary: result.summary || '',
            url: result.url,
            tags: result.tags || [],
            createdAt: result.published_date ? new Date(result.published_date) : new Date(),
            score: result.score,
            key_excerpts: result.key_excerpts || [],
            content: '',
            type: 'article' as const,
            user_id: ''
          }
        }) as Material[]
    }

    return []
  })

  /** 合并的素材列表（标题相关素材 + 用户选择的素材） */
  const allMaterials = computed(() => {
    const titleMaterials = titleRelatedMaterials.value
    const userSelectedMaterials = props.selectedMaterials || []

    // 去重，基于标题和URL
    const allUniqueMaterials = [...titleMaterials]

    userSelectedMaterials.forEach((userMaterial) => {
      const exists = allUniqueMaterials.some(
        (existing) =>
          existing.title === userMaterial.title ||
          (existing.url && userMaterial.url && existing.url === userMaterial.url)
      )
      if (!exists) {
        allUniqueMaterials.push(userMaterial)
      }
    })

    return allUniqueMaterials
  })

  /** 显示的素材列表（根据showAllMaterials状态控制） */
  const displayMaterials = computed(() => {
    if (showAllMaterials.value) {
      return allMaterials.value
    }
    return allMaterials.value.slice(0, displayLimit)
  })

  // ====== 方法 ======

  /** 获取标题评分 */
  const getTitleScore = (): number => {
    return Math.floor(Math.random() * 40) + 60
  }

  /** 获取标题建议 */
  const getTitleSuggestions = (): string[] => {
    return ['更具吸引力', '更简洁明了', '更专业', '更具创意性']
  }

  /** 处理标题选择事件 */
  const handleTitleSelect = () => {
    ElMessage.info('当前标题已确认，如需更改请重新选择')
  }

  /** 处理标题更新事件 */
  const handleTitleUpdate = (_oldTitle: Title, newTitle: Title) => {
    documentStore.updateDocumentState({
      selectedTitle: newTitle
    })
    ElMessage.success('标题已更新')
  }

  /** 处理素材预览 */
  const handleMaterialPreview = (material: Material) => {
    emit('materialPreview', material)
  }

  /** 处理添加素材 */
  const handleAddMaterial = () => {
    emit('addMaterial')
  }

  const editTitle = () => {
    router.push(`/document-generation/topic-selection/${props.projectId}`)
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
    .selected-title-section {
      margin-bottom: var(--art-spacing-xl, 32px);

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--art-spacing-lg, 20px);

        h4 {
          margin: 0;
          font-size: var(--art-font-size-lg, 20px);
          font-weight: var(--art-font-weight-semibold, 600);
          color: var(--art-text-color-primary);
        }
      }

      .title-card-wrapper {
        overflow: hidden;
        background: var(--art-fill-color-blank);
        border: 1px solid var(--art-border-color);
        border-radius: var(--art-border-radius, 8px);
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--el-color-primary-light-6);
          box-shadow: var(--art-box-shadow-sm);
        }
      }
    }

    .materials-section {
      margin-bottom: var(--art-spacing-xl, 32px);
      overflow: hidden;
      border: 1px solid var(--art-border-color);
      border-radius: var(--art-border-radius, 8px);
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--el-color-primary-light-6);
        box-shadow: var(--art-box-shadow-sm);
      }

      .materials-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--art-padding-lg, 16px) var(--art-padding-xl, 24px);
        cursor: pointer;
        background: linear-gradient(
          135deg,
          var(--art-fill-color-light) 0%,
          var(--art-fill-color) 100%
        );
        border-bottom: 1px solid var(--art-border-color);
        transition: all 0.3s ease;

        &:hover {
          background: linear-gradient(
            135deg,
            var(--art-fill-color) 0%,
            var(--art-fill-color-dark) 100%
          );
        }

        .materials-info {
          flex: 1;

          h4 {
            display: flex;
            gap: var(--art-spacing-sm, 8px);
            align-items: center;
            margin: 0 0 var(--art-spacing-xs, 4px);
            font-size: var(--art-font-size-base, 16px);
            font-weight: var(--art-font-weight-medium, 500);
            color: var(--art-text-color-primary);

            .el-icon {
              color: var(--el-color-primary);
            }
          }

          .materials-subtitle {
            display: flex;
            gap: var(--art-spacing-xs, 4px);
            align-items: center;
            margin: 0;
            font-size: var(--art-font-size-xs, 12px);
            color: var(--art-text-color-secondary);
          }
        }

        .materials-controls {
          display: flex;
          gap: var(--art-spacing-sm, 8px);
          align-items: center;
        }
      }

      .materials-content {
        padding: var(--art-padding-xl, 24px);
        background: var(--art-main-bg-color);

        .materials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--art-spacing-lg, 20px);
          margin-bottom: var(--art-spacing-lg, 20px);
        }

        .show-more-section {
          display: flex;
          justify-content: center;
          padding-top: var(--art-spacing-md, 12px);
          border-top: 1px solid var(--art-border-color-lighter);
        }

        .empty-materials {
          padding: var(--art-padding-2xl, 60px) var(--art-padding-lg, 24px);
          text-align: center;

          .empty-content {
            max-width: 400px;
            margin: 0 auto;

            .empty-visual {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 80px;
              height: 80px;
              margin: 0 auto var(--art-spacing-lg, 20px);
              font-size: 32px;
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
                min-width: 140px;
                font-weight: var(--art-font-weight-medium, 500);
              }
            }
          }
        }
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

    .materials-grid {
      grid-template-columns: 1fr;
      gap: var(--art-spacing-md, 16px);
    }

    .materials-header {
      flex-direction: column;
      gap: var(--art-spacing-sm, 8px);
      align-items: flex-start;
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
