<template>
  <div class="outline-container">
    <ArtTableHeader title="大纲编辑" :actions="headerActions" @back="goBack" />

    <!-- 项目加载提示 -->
    <div
      v-if="loadingProject || (!projectStore.currentProject && projectId)"
      class="project-loading"
    >
      <el-empty :description="loadingProject ? '正在加载项目信息...' : '项目信息加载失败'" />
    </div>

    <div v-else class="main-content">
      <StepIndicator :steps="stepList" />

      <!-- 标题信息分区 -->
      <TitleSection
        :project-id="projectId"
        :selected-materials="selectedMaterials"
        @edit-title="editTitle"
        @view-search-results="viewSearchResults"
        @material-preview="handleMaterialPreview"
        @add-material="openMaterialLibrary"
        @update:allMaterials="handleAllMaterialsUpdate"
      />

      <!-- 大纲编辑分区 -->
      <OutlineEditorSection
        :generated-outline="outline.state.generatedOutline"
        :can-generate-from-title="canGenerateFromTitle"
        :can-add-section="canAddSection"
        :generating-outline="generatingOutline"
        :selected-materials-count="allTitleMaterials.length"
        :selected-materials="allTitleMaterials"
        :is-binding-materials="outline.state.isBindingMaterials"
        :binding-progress="outline.state.bindingProgress"
        @generate-ai-outline="generateAIOutline"
        @generate-ai-complete-outline="generateAICompleteOutline"
        @add-section="addSection"
        @delete-section="deleteSection"
        @move-section-up="moveSectionUp"
        @move-section-down="moveSectionDown"
        @clear-outline="clearOutline"
        @edit-section="handleEditSection"
        @ai-bind-materials="handleAIBindMaterials"
        @bind-material-to-section="bindMaterialToSection"
        @unbind-material-from-section="unbindMaterialFromSection"
      />

      <!-- 确认大纲操作区域 -->
      <div class="outline-actions-container art-card">
        <div class="actions-content">
          <div class="actions-info">
            <h4>
              <el-icon><Document /></el-icon>
              大纲确认
            </h4>
            <p>确认当前大纲结构并开始正文创作</p>
            <el-tag
              v-if="outline.state.generatedOutline.length > 0"
              type="success"
              effect="light"
              class="chapter-count"
            >
              <el-icon><Check /></el-icon>
              已创建 {{ outline.state.generatedOutline.length }} 个章节
            </el-tag>
          </div>

          <div class="actions-buttons">
            <el-button @click="goBack" size="large" class="action-button secondary">
              <el-icon><ArrowLeft /></el-icon>
              返回标题
            </el-button>
            <el-button
              type="success"
              size="large"
              @click="confirmOutline"
              class="action-button primary"
            >
              <el-icon><Right /></el-icon>
              确认大纲并继续
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 素材库选择对话框 -->
    <MaterialLibraryDialog
      :visible="showMaterialLibraryDialog"
      @update:visible="showMaterialLibraryDialog = $event"
      @confirm="handleMaterialLibraryConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, watch, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { Document, Check, ArrowLeft, Right } from '@element-plus/icons-vue'
  import { useOutlinePage } from '@/composables/document/useOutlinePage'
  import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
  import { useProjectStore } from '@/store/modules/project'
  import type { Material } from '@/types/material'
  import MaterialLibraryDialog from '@/components/custom/material-card/MaterialLibraryDialog.vue'
  import StepIndicator, { type Step } from '@/components/custom/StepIndicator.vue'
  import TitleSection from './TitleSection.vue'
  import OutlineEditorSection from './OutlineEditorSection.vue'

  // 使用composable
  const {
    projectId,
    loadingProject,
    generatingOutline,
    selectedMaterials,
    showMaterialLibraryDialog,
    canAddSection,
    canGenerateFromTitle,
    editTitle,
    viewSearchResults,
    goBack,
    handleAIBindMaterials,
    openMaterialLibrary,
    handleMaterialLibraryConfirm,
    outline
  } = useOutlinePage()

  // 存储标题区域的完整素材列表（包括标题相关素材和用户选择的素材）
  const allTitleMaterials = ref<Material[]>([])

  // 处理标题区域素材更新
  const handleAllMaterialsUpdate = (materials: Material[]) => {
    allTitleMaterials.value = materials
  }

  // 同步 selectedMaterials 到 allTitleMaterials
  watch(
    () => selectedMaterials.value,
    (materials) => {
      if (materials && materials.length > 0) {
        allTitleMaterials.value = materials
        console.log(
          '[DEBUG] 同步 selectedMaterials 到 allTitleMaterials:',
          materials.length,
          '个素材'
        )
      }
    },
    { immediate: true }
  )

  const documentStore = useDocumentGenerateStore()
  const projectStore = useProjectStore()
  const router = useRouter()

  // 步骤指示器数据
  const stepList: Step[] = [
    { label: '选题', status: 'completed' },
    { label: '大纲', status: 'active' },
    { label: '正文', status: 'pending' }
  ]

  // 头部操作按钮
  const headerActions = computed(() => {
    return [
      {
        label: '测试跳转',
        type: 'warning' as const,
        icon: 'el-icon-right',
        handler: () => {
          console.log('[DEBUG] 手动测试跳转按钮点击')
          const targetUrl = `/document-generation/content/${projectId}`
          console.log('[DEBUG] 手动跳转目标:', targetUrl)
          router
            .push(targetUrl)
            .then(() => {
              console.log('[DEBUG] 手动跳转成功')
            })
            .catch((error) => {
              console.error('[DEBUG] 手动跳转失败:', error)
            })
        }
      },
      {
        label: '导出',
        type: 'primary' as const,
        icon: 'el-icon-download',
        handler: () => {
          outline.exportOutline('json')
        }
      }
    ]
  })

  const generateAIOutline = async () => {
    // 检查条件
    if (!canGenerateFromTitle.value) {
      ElMessage.warning('请先选择标题并完善研究简报')
      return
    }

    generatingOutline.value = true
    try {
      // 使用选中的素材生成大纲
      const response = await outline.generateOutline(
        documentStore.documentState.selectedTitle,
        documentStore.documentState.researchBrief,
        selectedMaterials.value // 使用选中的素材而不是 searchResults
      )
      ElMessage.success('AI大纲生成成功！')

      // 保存到本地状态
      if (response) {
        outline.state.generatedOutline = response.outline
        // 同时保存到store
        documentStore.updateDocumentState({
          generatedOutline: response.outline
        })
      }
    } catch (error) {
      console.error('大纲生成失败:', error)
      ElMessage.error('大纲生成失败')
    } finally {
      generatingOutline.value = false
    }
  }

  // AI完整生成（含素材绑定）
  const generateAICompleteOutline = async () => {
    // 检查条件
    if (!canGenerateFromTitle.value) {
      ElMessage.warning('请先选择标题并完善研究简报')
      return
    }

    if (selectedMaterials.value.length === 0) {
      ElMessage.warning('请先从素材库选择素材')
      return
    }

    generatingOutline.value = true
    try {
      // 调用新的API：同时生成大纲并绑定素材
      await outline.generateAICompleteOutline()
    } catch (error) {
      console.error('AI完整生成失败:', error)
      ElMessage.error('AI完整生成失败，请重试')
    } finally {
      generatingOutline.value = false
    }
  }

  const addSection = () => {
    // 优先使用本地操作（AI生成的大纲）
    outline.addLocalSection()
  }

  const deleteSection = (index: number) => {
    const sections = outline.state.generatedOutline
    if (index >= 0 && index < sections.length) {
      sections.splice(index, 1)
      ElMessage.success('章节已删除')
    }
  }

  const moveSectionUp = (index: number) => {
    const sections = outline.state.generatedOutline
    if (index > 0) {
      const temp = sections[index]
      sections[index] = sections[index - 1]
      sections[index - 1] = temp
    }
  }

  const moveSectionDown = (index: number) => {
    const sections = outline.state.generatedOutline
    if (index < sections.length - 1) {
      const temp = sections[index]
      sections[index] = sections[index + 1]
      sections[index + 1] = temp
    }
  }

  const clearOutline = () => {
    outline.resetLocalOutline()
    ElMessage.success('大纲已清空')
  }

  const confirmOutline = async () => {
    console.log('[DEBUG] ===== 大纲确认开始 =====')
    console.log('[DEBUG] projectId:', projectId)
    console.log('[DEBUG] outline.state.generatedOutline:', outline.state.generatedOutline)
    console.log('[DEBUG] outline.state.sections:', outline.state.sections)

    // 保存到store
    console.log('[DEBUG] 保存大纲到store')
    documentStore.updateDocumentState({
      generatedOutline: outline.state.generatedOutline
    })
    console.log('[DEBUG] store更新完成，当前documentState:', documentStore.documentState)

    ElMessage.success('大纲已确认，正在跳转到正文章节...')

    // 构建目标URL
    const targetUrl = `/document-generation/content/${projectId}`
    console.log('[DEBUG] 目标URL:', targetUrl)
    console.log('[DEBUG] 当前router当前路径:', router.currentRoute.value.path)
    console.log('[DEBUG] 准备跳转，延迟800ms')

    // Navigate to content
    setTimeout(() => {
      console.log('[DEBUG] 开始执行路由跳转')
      console.log('[DEBUG] router.push调用前，当前路径:', router.currentRoute.value.path)

      router
        .push(targetUrl)
        .then(() => {
          console.log('[DEBUG] 路由跳转成功')
        })
        .catch((error) => {
          console.error('[DEBUG] 路由跳转失败:', error)
        })

      console.log('[DEBUG] router.push调用完成')
    }, 800)

    console.log('[DEBUG] ===== 大纲确认函数结束 =====')
  }

  const handleEditSection = (title: string, data: any) => {
    outline.editLocalSection(title, data)
  }

  const handleMaterialPreview = (material: Material) => {
    // TODO: 实现素材预览功能
    console.log('Preview material:', material)
    ElMessage.info(`预览素材: ${material.title}`)
  }

  const bindMaterialToSection = (sectionIndex: number, material: Material) => {
    const section = outline.state.generatedOutline[sectionIndex]
    if (section) {
      if (!section.data_requirements.includes(material.title)) {
        section.data_requirements.push(material.title)
        outline.editLocalSection(section.title, {
          data_requirements: section.data_requirements
        })
        ElMessage.success(`已将素材 "${material.title}" 绑定到章节`)
      } else {
        ElMessage.info('该素材已绑定到此章节')
      }
    }
  }

  const unbindMaterialFromSection = (sectionIndex: number, materialTitle: string) => {
    const section = outline.state.generatedOutline[sectionIndex]
    if (section) {
      const index = section.data_requirements.indexOf(materialTitle)
      if (index > -1) {
        section.data_requirements.splice(index, 1)
        outline.editLocalSection(section.title, {
          data_requirements: section.data_requirements
        })
        ElMessage.success(`已将素材 "${materialTitle}" 从章节中解绑`)
      }
    }
  }
</script>

<style scoped lang="scss">
  .outline-container {
    max-width: none;
    padding: var(--art-padding-lg, 24px);
  }

  .main-content {
    width: 100%;
  }

  .project-loading {
    padding: var(--art-padding-2xl, 60px);
    text-align: center;
  }

  .art-card {
    margin-bottom: var(--art-spacing-lg, 24px);
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius, 8px);
    box-shadow: var(--art-box-shadow-sm);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary-light-6);
      box-shadow: var(--art-box-shadow);
    }
  }

  .outline-actions-container {
    padding: var(--art-padding-xl, 32px);
    background: linear-gradient(
      135deg,
      var(--art-fill-color-light) 0%,
      var(--art-main-bg-color) 100%
    );
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius-lg, 12px);
    box-shadow: 0 4px 16px rgb(0 0 0 / 8%);

    .actions-content {
      display: flex;
      gap: var(--art-spacing-lg, 24px);
      align-items: center;
      justify-content: space-between;

      .actions-info {
        flex: 1;

        h4 {
          display: flex;
          gap: var(--art-spacing-sm, 8px);
          align-items: center;
          margin: 0 0 var(--art-spacing-sm, 8px);
          font-size: var(--art-font-size-xl, 20px);
          font-weight: var(--art-font-weight-semibold, 600);
          color: var(--art-text-color-primary);

          .el-icon {
            font-size: 24px;
            color: var(--el-color-primary);
          }
        }

        p {
          margin: 0 0 var(--art-spacing-md, 12px);
          font-size: var(--art-font-size-base, 16px);
          line-height: var(--art-line-height-relaxed, 1.6);
          color: var(--art-text-color-secondary);
        }

        .chapter-count {
          display: inline-flex;
          gap: var(--art-spacing-xs, 4px);
          align-items: center;
          padding: var(--art-spacing-sm, 8px) var(--art-spacing-md, 12px);
          font-weight: var(--art-font-weight-medium, 500);

          .el-icon {
            font-size: 16px;
          }
        }
      }

      .actions-buttons {
        display: flex;
        gap: var(--art-spacing-lg, 20px);
        align-items: center;

        .action-button {
          min-width: 140px;
          height: 48px;
          font-size: var(--art-font-size-base, 16px);
          font-weight: var(--art-font-weight-medium, 500);
          border-radius: var(--art-border-radius-lg, 8px);
          transition: all 0.3s ease;

          &.secondary {
            color: var(--art-text-color-primary);
            background: var(--art-fill-color-light);
            border: 1px solid var(--art-border-color);

            &:hover {
              background: var(--art-fill-color);
              border-color: var(--el-color-primary-light-6);
              box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
              transform: translateY(-1px);
            }
          }

          &.primary {
            background: linear-gradient(
              135deg,
              var(--el-color-success) 0%,
              var(--el-color-success-light-3) 100%
            );
            border: none;
            box-shadow: 0 4px 12px rgba(var(--el-color-success-rgb), 0.3);

            &:hover:not(:disabled) {
              background: linear-gradient(
                135deg,
                var(--el-color-success-light-3) 0%,
                var(--el-color-success-light-5) 100%
              );
              box-shadow: 0 6px 20px rgba(var(--el-color-success-rgb), 0.4);
              transform: translateY(-2px);
            }

            &:disabled {
              cursor: not-allowed;
              box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
              opacity: 0.5;
              transform: none;
            }

            .el-icon {
              margin-left: var(--art-spacing-xs, 4px);
              font-size: 18px;
            }
          }
        }
      }
    }
  }

  // 响应式设计
  @media (width <= 768px) {
    .outline-actions-container {
      padding: var(--art-padding-lg, 20px);

      .actions-content {
        flex-direction: column;
        gap: var(--art-spacing-lg, 20px);
        align-items: flex-start;

        .actions-info {
          width: 100%;
          text-align: center;

          h4 {
            justify-content: center;
            font-size: var(--art-font-size-lg, 18px);
          }

          p {
            font-size: var(--art-font-size-sm, 14px);
          }
        }

        .actions-buttons {
          gap: var(--art-spacing-md, 16px);
          justify-content: center;
          width: 100%;

          .action-button {
            min-width: 120px;
            height: 44px;
            font-size: var(--art-font-size-sm, 14px);
          }
        }
      }
    }
  }
</style>
