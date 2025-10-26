<template>
  <div class="art-material-search">
    <!-- 搜索表单区域 -->
    <div class="art-material-search__form">
      <el-card class="art-material-search__card">
        <template #header>
          <div class="art-material-search__header">
            <h3 class="art-material-search__title">
              <el-icon><Search /></el-icon>
              素材检索
            </h3>
            <div class="art-material-search__header-actions">
              <el-button
                v-if="searchHistory.length > 0"
                size="small"
                @click="showHistory = !showHistory"
              >
                搜索历史
              </el-button>
            </div>
          </div>
        </template>

        <!-- 搜索历史 -->
        <div v-if="showHistory && searchHistory.length > 0" class="art-material-search__history">
          <div class="art-material-search__history-header">
            <span>最近搜索</span>
            <el-button size="small" text @click="clearHistory">清空</el-button>
          </div>
          <div class="art-material-search__history-list">
            <el-tag
              v-for="(item, index) in searchHistory.slice(0, 5)"
              :key="index"
              class="art-material-search__history-item"
              @click="useHistoryItemAndSearch(item)"
            >
              {{ item.keywords }}
            </el-tag>
          </div>
        </div>

        <!-- 搜索表单 -->
        <el-form
          ref="searchFormRef"
          :model="searchForm"
          :rules="searchRules"
          label-width="80px"
          @submit.prevent="handleSearch"
        >
          <el-form-item label="关键词" prop="keywords">
            <el-input
              v-model="searchForm.keywords"
              placeholder="请输入搜索关键词"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button :icon="Search" @click="handleSearch" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="搜索源" prop="providers">
            <el-select
              v-model="searchForm.providers"
              multiple
              placeholder="选择搜索提供商"
              style="width: 100%"
            >
              <el-option
                v-for="provider in availableProviders"
                :key="provider.id"
                :label="provider.name"
                :value="provider.id"
              >
                <div class="art-material-search__provider-option">
                  <span>{{ provider.name }}</span>
                  <el-tag size="small" :type="provider.type === 'ai' ? 'warning' : 'success'">
                    {{ provider.type === 'ai' ? 'AI' : 'API' }}
                  </el-tag>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="结果数量" prop="maxResults">
            <el-slider
              v-model="searchForm.maxResults"
              :min="1"
              :max="10"
              :step="1"
              show-stops
              show-input
            />
          </el-form-item>

          <el-form-item>
            <div class="art-material-search__actions">
              <el-button type="primary" @click="handleSearch" :loading="searching">
                开始搜索
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 搜索进度 -->
    <div v-if="searching" class="art-material-search__progress">
      <SearchProgressComponent
        :progress="searchProgress"
        :config="{
          keywords: searchForm.keywords,
          providers: searchForm.providers,
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
  import { ref, reactive, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Search } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useMaterialStore } from '@/store/material'
  import type { Material, SearchConfig } from '@/types/material'
  import SearchProgressComponent from '@/components/custom/search-progress/SearchProgress.vue'
  import MaterialPreviewDialog from '@/components/custom/material-card/MaterialPreviewDialog.vue'
  import MaterialSearchResults from './common/MaterialSearchResults.vue'
  import AddToLibraryDialog from './common/AddToLibraryDialog.vue'
  import { useMaterialSearch } from '@/composables/useMaterialSearch'

  interface SearchForm {
    keywords: string
    providers: ('tavily' | 'bocha')[]
    maxResults: number
  }

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
  const searchFormRef = ref<FormInstance>()
  const materialStore = useMaterialStore()

  // 搜索表单数据
  const searchForm = reactive<SearchForm>({
    keywords: '',
    providers: ['tavily'],
    maxResults: 20
  })

  // 可用的搜索提供商
  const availableProviders = computed(() => materialStore.providers)

  // 表单验证规则
  const searchRules: FormRules = {
    keywords: [
      { required: true, message: '请输入搜索关键词', trigger: 'blur' },
      { min: 2, max: 100, message: '关键词长度应在 2 到 100 个字符之间', trigger: 'blur' }
    ],
    providers: [{ required: true, message: '请选择至少一个搜索提供商', trigger: 'change' }]
  }

  // 处理搜索
  const handleSearch = async () => {
    if (!searchFormRef.value) return

    try {
      const valid = await searchFormRef.value.validate()
      if (!valid) return

      console.log('[MaterialSearch] 开始搜索，关键词:', searchForm.keywords)

      // 使用公共搜索逻辑
      // 构建搜索配置
      const searchConfig: SearchConfig = {
        keywords: searchForm.keywords,
        providers: searchForm.providers,
        searchScope: '',
        filters: { tags: [] }
      }

      await searchWithSearchTools(searchConfig)
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  // 取消搜索
  const cancelSearch = () => {
    searching.value = false
    ElMessage.info('搜索已取消')
  }

  // 重置表单
  const resetForm = () => {
    if (!searchFormRef.value) return

    searchFormRef.value.resetFields()
    searchForm.providers = ['tavily']
    searchForm.maxResults = 20

    // 重置搜索状态
    resetSearchState()
  }

  // 使用历史记录并搜索
  const useHistoryItemAndSearch = (item: SearchConfig) => {
    searchForm.keywords = item.keywords
    searchForm.providers = item.providers as ('tavily' | 'bocha')[]
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
    } catch (error) {
      console.error('添加到数据库失败:', error)
      ElMessage.error('添加到数据库失败')
    }
  }

  // 组件挂载时检查搜索工具状态
  onMounted(async () => {
    try {
      console.log('[MaterialSearch] 组件挂载，开始检查搜索工具状态...')
      console.log('[MaterialSearch] 时间戳:', new Date().toISOString())

      // 检查是否已经有缓存的状态数据
      if (materialStore.searchToolsStatus) {
        console.log('[MaterialSearch] 使用store中的缓存状态数据')
      } else {
        const status = await materialStore.checkSearchToolsStatus()
        console.log('[MaterialSearch] 搜索工具状态检查完成:', status)
      }

      console.log('[MaterialSearch] 完成时间戳:', new Date().toISOString())

      // 检查搜索工具配置状态
      const currentStatus = materialStore.searchToolsStatus
      if (currentStatus && !currentStatus.tavily_configured && !currentStatus.bocha_configured) {
        console.log('[MaterialSearch] 搜索工具未配置，显示警告')
        ElMessage.warning('搜索工具未配置，请联系管理员')
      }
    } catch (error) {
      console.error('[MaterialSearch] Check search tools status error:', error)
      console.error('[MaterialSearch] 错误详情:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : '未知错误',
        errorType: typeof error
      })
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

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      &-actions {
        display: flex;
        gap: 8px;
      }

      .art-material-search__title {
        display: flex;
        gap: 8px;
        align-items: center;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }
    }

    &__history {
      padding: 16px;
      margin-bottom: 20px;
      background: var(--el-fill-color-lighter);
      border-radius: 6px;

      &-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      &-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      &-item {
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
          transform: translateY(-2px);
        }
      }
    }

    &__provider-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
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
