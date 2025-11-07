import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useMaterialStore } from '@/store/material'
import { storeToRefs } from 'pinia'
import type { Material, SearchConfig, AgentSearchConfig } from '@/types/material'

/**
 * 素材搜索组合式函数
 * 专注于UI状态管理和用户交互流程
 * 核心业务逻辑由 material store 处理
 */
export function useMaterialSearch() {
  const materialStore = useMaterialStore()

  // UI状态管理
  const searching = ref(false)
  const hasSearched = ref(false)
  const showHistory = ref(false)

  // 使用storeToRefs获取响应式引用，避免双重响应式包装
  const {
    currentSearchResults: searchResults,
    paginatedSearchResults,
    selectedMaterials,
    searchHistory,
    searchProgress,
    paginationState
  } = storeToRefs(materialStore)

  // 添加到素材库相关UI状态
  const addToLibraryDialogVisible = ref(false)
  const addProgressDialogVisible = ref(false)
  const addingToLibrary = ref(false)

  // 添加到素材库选项
  const addToLibraryOptions = ref({
    autoClear: true,
    goToLibrary: false
  })

  // 添加进度UI状态
  const addProgress = reactive({
    percentage: 0,
    status: 'success' as 'success' | 'exception' | 'warning',
    message: '准备添加...',
    processed: 0,
    total: 0
  })

  // 预览对话框相关UI状态
  const previewDialogVisible = ref(false)
  const previewMaterial = ref<Material | null>(null)

  /**
   * 执行Agent搜索
   * 简化为直接调用store方法，专注于UI状态管理
   */
  const executeAgentSearch = async (config: AgentSearchConfig) => {
    searching.value = true
    hasSearched.value = true

    try {
      await materialStore.searchWithAgent(config)
      ElMessage.success('Agent检索完成')
    } catch (error) {
      console.error('Agent搜索失败:', error)
      ElMessage.error(error instanceof Error ? error.message : 'Agent检索失败，请稍后重试')
    } finally {
      searching.value = false
    }
  }

  /**
   * 执行普通搜索
   * 调用store的searchWithSearchTools方法
   */
  const searchWithSearchTools = async (config: SearchConfig) => {
    searching.value = true
    hasSearched.value = true

    try {
      await materialStore.searchWithSearchTools(config)
      ElMessage.success('搜索完成')
    } catch (error) {
      console.error('搜索失败:', error)
      ElMessage.error(error instanceof Error ? error.message : '搜索失败，请稍后重试')
    } finally {
      searching.value = false
    }
  }

  /**
   * 选择素材
   * 调用store方法
   */
  const selectMaterial = (material: Material) => {
    if (material.id) {
      materialStore.toggleMaterialSelection(material.id)
    }
  }

  /**
   * 使用历史记录
   */
  const useHistoryItem = (item: SearchConfig) => {
    // 返回历史记录项，由组件决定如何处理
    return item
  }

  /**
   * 清空历史记录
   */
  const clearHistory = () => {
    materialStore.clearSearchHistory()
    ElMessage.success('搜索历史已清空')
  }

  /**
   * 显示添加到素材库对话框
   */
  const showAddToLibraryDialog = () => {
    if (selectedMaterials.value.length === 0) {
      ElMessage.warning('请先选择要添加的素材')
      return
    }
    addToLibraryDialogVisible.value = true
  }

  /**
   * 关闭添加到素材库对话框
   */
  const closeAddToLibraryDialog = () => {
    addToLibraryDialogVisible.value = false
  }

  /**
   * 确认添加到素材库
   * 简化逻辑，主要调用store方法
   */
  const confirmAddToLibrary = async () => {
    if (selectedMaterials.value.length === 0) {
      ElMessage.warning('请先选择要添加的素材')
      return
    }

    closeAddToLibraryDialog()
    addProgressDialogVisible.value = true
    addingToLibrary.value = true

    // 初始化进度
    Object.assign(addProgress, {
      percentage: 0,
      status: 'success',
      message: '准备添加素材到数据库...',
      processed: 0,
      total: selectedMaterials.value.length
    })

    try {
      // 获取选中的素材对象
      const materialsToAdd = selectedMaterials.value
        .map((id) => searchResults.value.find((material) => material.id === id))
        .filter(Boolean) as Material[]

      // 更新进度
      addProgress.message = '正在将素材添加到数据库...'
      addProgress.percentage = 30

      const result = await materialStore.addSearchResultsToDatabase(materialsToAdd)

      // 更新进度
      addProgress.percentage = 80
      addProgress.message = `已成功添加 ${result.addedCount} 个素材到数据库`
      addProgress.processed = result.addedCount

      // 添加延迟，让用户看到进度
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 完成添加
      addProgress.percentage = 100
      addProgress.message = `成功添加 ${result.addedCount} 个素材到数据库`

      // 根据选项执行后续操作
      if (addToLibraryOptions.value.autoClear) {
        materialStore.clearSelection()
      }

      // 延迟关闭进度对话框
      setTimeout(() => {
        addProgressDialogVisible.value = false
        addingToLibrary.value = false

        if (addToLibraryOptions.value.goToLibrary) {
          goToLibrary()
        } else {
          ElMessage.success(`已添加 ${result.addedCount} 个素材到数据库`)
        }
      }, 1500)
    } catch (error) {
      console.error('添加到数据库失败:', error)
      addProgress.status = 'exception'
      addProgress.message = '添加到数据库失败'

      setTimeout(() => {
        addProgressDialogVisible.value = false
        addingToLibrary.value = false
        ElMessage.error('添加到数据库失败')
      }, 2000)
    }
  }

  /**
   * 跳转到素材库
   */
  const goToLibrary = () => {
    const router = useRouter()
    router.push('/material/management')
  }

  /**
   * 根据ID获取素材
   */
  const getMaterialById = (id: string) => {
    return searchResults.value.find((material) => material.id === id)
  }

  /**
   * 显示素材预览
   */
  const showMaterialPreview = (material: Material) => {
    if (!material) {
      console.error('showMaterialPreview: material 参数为空')
      return
    }

    previewMaterial.value = material
    previewDialogVisible.value = true
  }

  /**
   * 分页处理
   */
  const handleSizeChange = (size: number) => {
    materialStore.paginationState.pageSize = size
    materialStore.paginationState.currentPage = 1
    console.log('页面大小变更:', size)
    // 注意：由于我们使用的是客户端分页，不需要重新请求数据
    // paginatedSearchResults 会自动根据新的分页状态重新计算
  }

  const handleCurrentChange = (page: number) => {
    materialStore.paginationState.currentPage = page
    console.log('当前页变更:', page)
    // 注意：由于我们使用的是客户端分页，不需要重新请求数据
    // paginatedSearchResults 会自动根据新的分页状态重新计算
  }

  /**
   * 重置搜索状态
   */
  const resetSearchState = () => {
    searching.value = false
    hasSearched.value = false
    showHistory.value = false
    addToLibraryDialogVisible.value = false
    addProgressDialogVisible.value = false
    addingToLibrary.value = false
    previewDialogVisible.value = false
    previewMaterial.value = null
  }

  return {
    // UI状态
    searching,
    hasSearched,
    showHistory,
    addToLibraryDialogVisible,
    addProgressDialogVisible,
    addingToLibrary,
    addToLibraryOptions,
    addProgress,
    previewDialogVisible,
    previewMaterial,

    // Store状态（通过storeToRefs获取）
    searchResults,
    paginatedSearchResults, // 添加分页后的搜索结果
    selectedMaterials,
    searchHistory,
    searchProgress,
    paginationState,

    // 搜索方法
    executeAgentSearch,
    searchWithSearchTools,

    // 素材操作方法（调用store方法）
    selectMaterial,

    // UI交互方法
    useHistoryItem,
    clearHistory,
    showAddToLibraryDialog,
    closeAddToLibraryDialog,
    confirmAddToLibrary,
    goToLibrary,
    getMaterialById,
    showMaterialPreview,
    handleSizeChange,
    handleCurrentChange,
    resetSearchState
  }
}
