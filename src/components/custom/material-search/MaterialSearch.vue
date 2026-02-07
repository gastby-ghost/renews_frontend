<template>
  <div class="art-material-search">
    <!-- 搜索表单区域 -->
    <MaterialSearchForm
      ref="searchFormRef"
      :loading="searching"
      :show-history="showHistory"
      :search-history="searchHistory"
      :providers="availableProviders"
      :initial-config="initialSearchConfig"
      @search="handleSearch"
      @reset="resetForm"
      @toggle-history="showHistory = !showHistory"
      @clear-history="clearHistory"
      @use-history="useHistoryItemAndSearch"
    />

    <!-- 搜索进度 -->
    <div v-if="searching" class="art-material-search__progress">
      <SearchProgressComponent
        :progress="searchProgress"
        :config="{
          keywords: searchFormData.keywords,
          providers: searchFormData.providers,
          searchScope: '',
          filters: { tags: [] }
        }"
        :providers="availableProviders"
        :is-active="searching"
        @cancel="cancelSearch"
      />
    </div>

    <!-- 搜索结果 -->
    <MaterialSearchResults
      :search-results="paginatedSearchResults"
      :selected-materials="selectedMaterials"
      :loading-materials="[]"
      :searching="searching"
      :has-searched="hasSearched"
      :pagination-state="paginationState"
      @select-all="materialStore.selectAll"
      @clear-selection="materialStore.clearSelection"
      @toggle-material-selection="materialStore.toggleMaterialSelection"
      @show-add-to-library-dialog="showAddToLibraryDialog"
      @go-to-library="goToLibrary"
      @show-material-preview="showMaterialPreview"
      @select-material="selectMaterial"
      @handle-size-change="handleSizeChange"
      @handle-current-change="handleCurrentChange"
      @reset-search="resetForm"
    />

    <!-- 添加到素材库对话框 -->
    <AddToLibraryDialog
      ref="addToLibraryDialogRef"
      v-model:visible="addToLibraryDialogVisible"
      :selected-materials="selectedMaterials"
      :materials="searchResults"
      :loading="addingToLibrary"
      @confirm="handleAddToLibraryConfirm"
      @close="closeAddToLibraryDialog"
    />

    <!-- 素材预览对话框 -->
    <MaterialPreviewDialog
      :visible="previewDialogVisible"
      :material="previewMaterial"
      context="search"
      @update:visible="previewDialogVisible = $event"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useMaterialStore } from '@/store/material'
  import type { Material, SearchConfig } from '@/types/material'
  import SearchProgressComponent from '@/components/custom/search-progress/SearchProgress.vue'
  import MaterialPreviewDialog from '@/components/custom/material-card/MaterialPreviewDialog.vue'
  import MaterialSearchResults from './common/MaterialSearchResults.vue'
  import AddToLibraryDialog from './common/AddToLibraryDialog.vue'
  import MaterialSearchForm from './MaterialSearchForm.vue'
  import { useMaterialSearch } from '@/composables/material/useMaterialSearch'

  interface SearchForm {
    keywords: string
    providers: ('tavily' | 'bocha')[]
    maxResults: number
  }

  const initialSearchConfig: SearchConfig = { keywords: '', providers: [], searchScope: '', filters: { tags: [] } }

  // 使用公共搜索逻辑
  const {
    searching,
    hasSearched,
    showHistory,
    searchResults,
    paginatedSearchResults,
    selectedMaterials,
    searchHistory,
    searchProgress,
    paginationState,
    addToLibraryDialogVisible,
    addingToLibrary,
    addToLibraryOptions,
    previewDialogVisible,
    previewMaterial,
    searchWithSearchTools,
    selectMaterial,
    clearHistory,
    showAddToLibraryDialog,
    closeAddToLibraryDialog,
    goToLibrary,
    showMaterialPreview,
    handleSizeChange,
    handleCurrentChange,
    resetSearchState
  } = useMaterialSearch()

  // 响应式数据
  const searchFormRef = ref<{ validate: () => Promise<boolean>; resetFields: () => void; form: SearchForm }>()
  const addToLibraryDialogRef = ref()
  const materialStore = useMaterialStore()

  // 可用的搜索提供商
  const availableProviders = computed(() => materialStore.providers)

  // 获取搜索表单数据
  const searchFormData = computed(() => {
    return searchFormRef.value?.form || { keywords: '', providers: ['tavily'], maxResults: 20 }
  })

  // 处理搜索
  const handleSearch = async () => {
    if (!searchFormRef.value) return

    try {
      const valid = await searchFormRef.value.validate()
      if (!valid) return

      // 构建搜索配置
      const searchConfig: SearchConfig = {
        keywords: searchFormRef.value.form.keywords || '',
        providers: searchFormRef.value.form.providers,
        searchScope: '',
        filters: { tags: [] }
      }

      await searchWithSearchTools(searchConfig)
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '搜索失败，请稍后重试')
    }
  }

  // 取消搜索
  const cancelSearch = () => {
    searching.value = false
    ElMessage.info('搜索已取消')
  }

  // 重置表单
  const resetForm = () => {
    searchFormRef.value?.resetFields()
    resetSearchState()
  }

  // 使用历史记录并搜索
  const useHistoryItemAndSearch = () => {
    handleSearch()
  }

  // 处理添加到素材库确认
  const handleAddToLibraryConfirm = async (options: {
    autoClear: boolean
    goToLibrary: boolean
  }) => {
    try {
      // 更新选项
      addToLibraryOptions.value.autoClear = options.autoClear
      addToLibraryOptions.value.goToLibrary = options.goToLibrary

      // 获取选中的素材对象
      const materialsToAdd = selectedMaterials.value
        .map((id) => searchResults.value.find((material) => material.id === id))
        .filter(Boolean) as Material[]

      // 使用Store方法将搜索结果添加到数据库
      const result = await materialStore.addSearchResultsToDatabase(materialsToAdd)

      // 根据选项执行后续操作
      if (options.autoClear) {
        materialStore.clearSelection()
      }

      if (options.goToLibrary) {
        goToLibrary()
      } else {
        ElMessage.success(`已添加 ${result.addedCount} 个素材到数据库`)
      }

      // 调用子组件的 completeAdd 方法来关闭进度对话框
      if (addToLibraryDialogRef.value && addToLibraryDialogRef.value.completeAdd) {
        addToLibraryDialogRef.value.completeAdd(
          true,
          `成功添加 ${result.addedCount} 个素材到数据库`
        )
      }
    } catch {
      ElMessage.error('添加到数据库失败')

      // 即使出错也要调用 completeAdd 来关闭进度对话框
      if (addToLibraryDialogRef.value && addToLibraryDialogRef.value.completeAdd) {
        addToLibraryDialogRef.value.completeAdd(false, '添加到数据库失败')
      }
    }
  }

  // 组件挂载时检查搜索工具状态
  onMounted(async () => {
    try {
      // 检查是否已经有缓存的状态数据
      if (!materialStore.searchToolsStatus) {
        await materialStore.checkSearchToolsStatus()
      }

      // 检查搜索工具配置状态
      const currentStatus = materialStore.searchToolsStatus
      if (currentStatus && !currentStatus.tavily_configured && !currentStatus.bocha_configured) {
        ElMessage.warning('搜索工具未配置，请联系管理员')
      }
    } catch {
      ElMessage.error('检查搜索工具状态失败')
    }
  })
</script>

<style scoped lang="scss">
  .art-material-search {
    width: 100%;

    &__mode-switch {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    &__card {
      margin-bottom: 20px;
    }

    &__actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    &__progress {
      margin-bottom: 20px;
    }

    &__results {
      &-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);

          span {
            font-size: 14px;
            font-weight: normal;
            color: var(--el-text-color-secondary);
          }
        }
      }

      &-actions {
        display: flex;
        gap: 8px;
      }

      &-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }
    }

    &__pagination {
      display: flex;
      justify-content: center;
      padding-top: 20px;
      border-top: 1px solid var(--el-border-color-lighter);
    }

    &__empty {
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }

    // 添加到素材库对话框样式
    &__add-dialog {
      &-info {
        margin-bottom: 20px;

        p {
          margin: 0 0 16px;
          font-size: 16px;
          line-height: 1.6;
          color: var(--el-text-color-primary);
        }
      }

      &-list {
        margin-bottom: 16px;
      }

      &-item {
        padding: 8px 12px;
        margin-bottom: 8px;
        font-size: 14px;
        color: var(--el-text-color-regular);
        background: var(--el-fill-color-lighter);
        border-radius: 4px;
      }

      &-summary {
        padding: 12px;
        background: var(--el-fill-color-lighter);
        border-radius: 4px;

        p {
          margin: 0;
          font-size: 14px;
          color: var(--el-text-color-regular);
        }
      }

      &-options {
        padding-top: 16px;
        border-top: 1px solid var(--el-border-color-lighter);

        .el-checkbox {
          display: block;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    // 添加进度对话框样式
    &__add-progress {
      text-align: center;

      &-text {
        margin: 16px 0;
        font-size: 16px;
        color: var(--el-text-color-primary);
      }

      &-details {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  @media (width <= 768px) {
    .art-material-search {
      &__results {
        &-header {
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;
        }

        &-actions {
          width: 100%;

          .el-button {
            flex: 1;
          }
        }

        &-grid {
          grid-template-columns: 1fr;
        }
      }

      &__actions {
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }
  }
</style>
