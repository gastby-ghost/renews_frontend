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
        :selected-title="selectedTitle"
        :title-description="titleDescription"
        :research-brief="documentStore.documentState.researchBrief"
        :project-id="projectId"
        @edit-title="editTitle"
        @view-search-results="viewSearchResults"
      />

      <!-- 大纲编辑分区 -->
      <OutlineEditorSection
        :generated-outline="outline.state.generatedOutline"
        :can-generate-from-title="canGenerateFromTitle"
        :can-add-section="canAddSection"
        :generating-outline="generatingOutline"
        :selected-materials-count="selectedMaterials.length"
        @generate-ai-outline="generateAIOutline"
        @generate-ai-complete-outline="generateAICompleteOutline"
        @add-section="addSection"
        @delete-section="deleteSection"
        @move-section-up="moveSectionUp"
        @move-section-down="moveSectionDown"
        @clear-outline="clearOutline"
        @confirm-outline="confirmOutline"
        @edit-section="handleEditSection"
        @go-back="goBack"
      />

      <!-- 素材分区 -->
      <MaterialsSection
        :selected-materials="selectedMaterials"
        :generated-outline="outline.state.generatedOutline"
        :is-binding-materials="outline.state.isBindingMaterials"
        :binding-progress="outline.state.bindingProgress"
        @open-material-library="openMaterialLibrary"
        @clear-selection="() => (selectedMaterials = [])"
        @toggle-material-selection="toggleMaterialSelection"
        @preview-material="(m) => console.log('预览素材:', m)"
        @ai-bind="() => {
          console.log('[INDEX] 接收到 ai-bind 事件');
          console.log('[INDEX] 调用 handleAIBindMaterials 方法');
          handleAIBindMaterials();
          console.log('[INDEX] handleAIBindMaterials 调用完成');
        }"
        @bind-material-to-section="bindMaterialToSection"
        @unbind-material-from-section="unbindMaterialFromSection"
      />
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
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { useOutlinePage } from '@/composables/document/useOutlinePage'
  import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
  import { useProjectStore } from '@/store/modules/project'
  import type { Material } from '@/types/material'
  import MaterialLibraryDialog from '@/components/custom/material-card/MaterialLibraryDialog.vue'
  import StepIndicator, { type Step } from '@/components/custom/StepIndicator.vue'
  import TitleSection from './TitleSection.vue'
  import OutlineEditorSection from './OutlineEditorSection.vue'
  import MaterialsSection from './MaterialsSection.vue'

  // 使用composable
  const {
    projectId,
    loadingProject,
    generatingOutline,
    selectedMaterials,
    showMaterialLibraryDialog,
    selectedTitle,
    titleDescription,
    canAddSection,
    canGenerateFromTitle,
    editTitle,
    viewSearchResults,
    goBack,
    handleAIBindMaterials,
    toggleMaterialSelection,
    openMaterialLibrary,
    handleMaterialLibraryConfirm,
    outline
  } = useOutlinePage()

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
      // 基于标题生成大纲
      const response = await outline.generateOutline(
        documentStore.documentState.selectedTitle,
        documentStore.documentState.researchBrief,
        documentStore.documentState.searchResults
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
    } catch {
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
      // 第一步：生成大纲
      const response = await outline.generateOutline(
        documentStore.documentState.selectedTitle,
        documentStore.documentState.researchBrief,
        documentStore.documentState.searchResults
      )

      if (response && response.outline) {
        // 保存大纲到本地状态
        outline.state.generatedOutline = response.outline
        // 同时保存到store
        documentStore.updateDocumentState({
          generatedOutline: response.outline
        })

        // 第二步：AI智能绑定素材
        try {
          const bindingResult = await outline.bindMaterialsWithAI(
            selectedMaterials.value,
            selectedTitle.value,
            documentStore.documentState.researchBrief || ''
          )

          if (bindingResult.success) {
            ElMessage.success(`AI完整生成成功！${bindingResult.message}`)
          }
        } catch (bindingError) {
          console.warn('素材绑定失败，但大纲已生成:', bindingError)
          ElMessage.warning('大纲生成成功，但素材绑定失败，请手动进行素材绑定')
        }
      }
    } catch {
      ElMessage.error('AI完整生成失败')
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
    if (outline.state.generatedOutline.length === 0 && outline.state.sections.length === 0) {
      ElMessage.warning('请创建大纲')
      return
    }

    // 验证大纲
    if (!outline.validateOutline()) {
      return
    }

    // 保存到store
    documentStore.updateDocumentState({
      generatedOutline: outline.state.generatedOutline
    })

    ElMessage.success('大纲已确认，正在跳转到正文章节...')

    // Navigate to content
    setTimeout(() => {
      router.push(`/document-generation/content/${projectId}`)
    }, 800)
  }

  const handleEditSection = (title: string, data: any) => {
    outline.editLocalSection(title, data)
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
</style>
