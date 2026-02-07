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
      <DocumentTitleSection
        :project-id="projectId"
        :selected-materials="selectedMaterials"
        @edit-title="editTitle"
        @view-search-results="viewSearchResults"
        @material-preview="previewMaterial"
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
        @generate-ai-complete-outline="generateAICompleteOutlineFromUI"
        @add-section="addLocalSectionFromUI"
        @delete-section="deleteSectionFromUI"
        @move-section-up="moveSectionUpFromUI"
        @move-section-down="moveSectionDownFromUI"
        @clear-outline="clearOutline"
        @confirm-outline="confirmOutline"
        @edit-section="editSectionFromUI"
        @go-back="goBack"
        @ai-bind-materials="handleAIBindMaterials"
        @bind-material-to-section="bindMaterialToSectionFromUI"
        @unbind-material-from-section="unbindMaterialFromSectionFromUI"
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
  import { useProjectStore } from '@/store/modules/project'
  import type { Material } from '@/types/material'
  import MaterialLibraryDialog from '@/components/custom/material-card/MaterialLibraryDialog.vue'
  import StepIndicator, { type Step } from '@/components/custom/StepIndicator.vue'
  import { DocumentTitleSection, OutlineEditorSection } from '@/components/custom/document/outline'
  import { useOutlinePage } from '@/composables/document/useOutlinePage'

  // 使用 composable
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
    outline,
    generateAIOutline,
    generateAICompleteOutlineFromUI,
    confirmOutline,
    clearOutline,
    addLocalSectionFromUI,
    deleteSectionFromUI,
    moveSectionUpFromUI,
    moveSectionDownFromUI,
    editSectionFromUI,
    handleAllMaterialsUpdate,
    previewMaterial,
    bindMaterialToSectionFromUI,
    unbindMaterialFromSectionFromUI
  } = useOutlinePage()

  const projectStore = useProjectStore()

  // 存储标题区域的完整素材列表
  const allTitleMaterials = ref<Material[]>([])

  // 步骤指示器数据
  const stepList: Step[] = [
    { label: '选题', status: 'completed' },
    { label: '大纲', status: 'active' },
    { label: '正文', status: 'pending' }
  ]

  // 头部操作按钮
  const headerActions = computed(() => [
    {
      label: '导出',
      type: 'primary' as const,
      icon: 'el-icon-download',
      handler: () => outline.exportOutline('json')
    }
  ])
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
</style>
