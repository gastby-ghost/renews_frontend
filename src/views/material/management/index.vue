<template>
  <div class="material-management">
    <!-- 筛选和搜索区域 -->
    <el-card class="material-management__filter">
      <el-form :model="filterForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.search"
            placeholder="搜索素材标题、标签..."
            clearable
            style="width: 250px"
          />
        </el-form-item>

        <el-form-item label="类型">
          <el-select
            v-model="filterForm.type"
            placeholder="选择类型"
            clearable
            style="width: 120px"
          >
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
            <el-option label="音频" value="audio" />
            <el-option label="文本" value="text" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="来源">
          <el-select
            v-model="filterForm.source"
            placeholder="选择来源"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="source in availableSources"
              :key="source"
              :label="source"
              :value="source"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="applyFilters">
            <el-icon><Search /></el-icon>
            筛选
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <div class="material-management__actions">
      <div class="material-management__actions-left">
        <el-button @click="selectAll" :disabled="filteredMaterials.length === 0"> 全选 </el-button>
        <el-button @click="clearSelection" :disabled="selectedMaterials.length === 0">
          取消选择
        </el-button>
        <el-button type="danger" @click="batchDelete" :disabled="selectedMaterials.length === 0">
          <el-icon><Delete /></el-icon>
          批量删除 ({{ selectedMaterials.length }})
        </el-button>
      </div>

      <div class="material-management__actions-right">
        <el-button @click="exportMaterials">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="materialStore.loading" class="material-management__loading">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 素材网格 -->
    <div v-else-if="filteredMaterials.length > 0" class="material-management__grid">
      <MaterialCard
        v-for="material in filteredMaterials"
        :key="material.id"
        :material="material"
        :selected="selectedMaterials.includes(material.id)"
        :loading="loadingMaterials.includes(material.id)"
        :show-selection="true"
        :show-score="false"
        context="management"
        @select="toggleMaterialSelection"
        @preview="showMaterialPreview"
        @edit="handleEdit"
        @click="selectMaterial(material)"
      />
    </div>

    <!-- 分页 -->
    <div v-if="totalCount > 0 && !materialStore.loading" class="material-management__pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="!materialStore.loading" description="暂无素材" :image-size="200">
    </el-empty>

    <!-- 素材预览对话框 -->
    <MaterialPreviewDialog
      :visible="previewDialogVisible"
      :material="previewMaterial"
      context="management"
      @update:visible="previewDialogVisible = $event"
      @material-updated="handleMaterialUpdated"
    />

    <!-- 批量删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="400px">
      <p>确定要删除选中的 {{ selectedMaterials.length }} 个素材吗？此操作不可恢复。</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmBatchDelete">确定删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { Search, Refresh, Delete, Download } from '@element-plus/icons-vue'
  import MaterialCard from '@/components/custom/material-card/UnifiedMaterialCard.vue'
  import MaterialPreviewDialog from '@/components/custom/material-card/MaterialPreviewDialog.vue'
  import { useMaterialStore } from '@/store/material'
  import type { Material } from '@/types/material'

  const router = useRouter()
  const materialStore = useMaterialStore()

  // 筛选表单
  const filterForm = ref({
    search: '',
    type: '',
    source: ''
  })

  // 状态
  const previewDialogVisible = ref(false)
  const previewMaterial = ref<Material | null>(null)
  const loadingMaterials = ref<string[]>([])
  const deleteDialogVisible = ref(false)

  // 分页状态
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalCount = ref(0)

  // 计算属性
  const materials = computed(() => materialStore.materials)
  const selectedMaterials = computed(() => materialStore.selectedMaterials)

  // 由于现在使用API进行筛选，filteredMaterials 直接返回 materials
  const filteredMaterials = computed(() => materials.value)

  const availableSources = computed(() => {
    const sources = new Set(materials.value.map((m) => m.source))
    return Array.from(sources)
  })

  // 方法
  function applyFilters() {
    currentPage.value = 1
    loadMaterials()
      .then(() => {
        ElMessage.success(`筛选结果：${filteredMaterials.value.length} 个素材`)
      })
      .catch(() => {
        // 错误已在loadMaterials中处理
      })
  }

  function resetFilters() {
    filterForm.value = {
      search: '',
      type: '',
      source: ''
    }
    currentPage.value = 1
    loadMaterials()
      .then(() => {
        ElMessage.info('已重置筛选条件')
      })
      .catch(() => {
        // 错误已在loadMaterials中处理
      })
  }

  function toggleMaterialSelection(id: string) {
    materialStore.toggleMaterialSelection(id)
  }

  function selectMaterial(material: Material) {
    toggleMaterialSelection(material.id)
  }

  function selectAll() {
    materialStore.selectAll()
  }

  function clearSelection() {
    materialStore.clearSelection()
  }

  function batchDelete() {
    if (selectedMaterials.value.length === 0) {
      ElMessage.warning('请先选择要删除的素材')
      return
    }
    deleteDialogVisible.value = true
  }

  async function confirmBatchDelete() {
    try {
      // 使用新的API从数据库删除素材
      await materialStore.deleteMaterialsFromDatabase(selectedMaterials.value)
      ElMessage.success(`已删除 ${selectedMaterials.value.length} 个素材`)
      deleteDialogVisible.value = false
      // 重新加载数据
      await loadMaterials()
    } catch (err) {
      console.error('删除失败:', err)
      ElMessage.error('删除失败')
    }
  }

  function showMaterialPreview(material: Material) {
    previewMaterial.value = material
    previewDialogVisible.value = true
  }

  function handleMaterialUpdated(updatedMaterial: Material) {
    // 更新本地状态中的素材
    materialStore.updateMaterial(updatedMaterial)
  }

  async function handleEdit(material: Material) {
    // 直接打开预览对话框并切换到编辑模式
    showMaterialPreview(material)
  }

  function exportMaterials() {
    if (filteredMaterials.value.length === 0) {
      ElMessage.warning('没有可导出的素材')
      return
    }

    // 模拟导出
    ElMessage.success(`正在导出 ${filteredMaterials.value.length} 个素材...`)

    setTimeout(() => {
      ElMessage.success('导出完成')
    }, 1000)
  }

  // 分页处理方法
  function handleSizeChange(size: number) {
    pageSize.value = size
    currentPage.value = 1
    loadMaterials()
  }

  function handleCurrentChange(page: number) {
    currentPage.value = page
    loadMaterials()
  }

  // 加载素材数据
  async function loadMaterials() {
    try {
      // 构建标签数组，包含类型和来源筛选
      const tags: string[] = []
      if (filterForm.value.type) {
        tags.push(filterForm.value.type)
      }
      if (filterForm.value.source) {
        tags.push(filterForm.value.source)
      }

      const params = {
        page: currentPage.value,
        page_size: pageSize.value,
        keywords: filterForm.value.search || undefined,
        tags: tags.length > 0 ? tags : undefined
      }

      const result = await materialStore.loadAllMaterialsFromDatabase(params)
      totalCount.value = result.totalCount
    } catch (err) {
      console.error('加载素材失败:', err)
      ElMessage.error('加载素材失败')
    }
  }

  // 生命周期
  onMounted(async () => {
    try {
      await loadMaterials()
      // 清空之前的选择状态，确保从搜索页面跳转过来时不会保留之前的选择
      materialStore.clearSelection()
    } catch (err) {
      console.error('加载素材库失败:', err)
      ElMessage.error('加载素材库失败')
    }

    // 监听路由变化，刷新素材列表
    const unwatch = router.afterEach(async (to) => {
      if (to.path === '/material/management') {
        try {
          await loadMaterials()
          // 进入页面时清空选择状态
          materialStore.clearSelection()
        } catch (err) {
          console.error('刷新素材库失败:', err)
        }
      }
    })

    // 组件卸载时取消监听
    onUnmounted(() => {
      unwatch()
    })
  })
</script>

<style scoped lang="scss">
  .material-management {
    padding: 20px;

    &__filter {
      margin-bottom: 20px;
    }

    &__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;

      &-left,
      &-right {
        display: flex;
        gap: 8px;
      }
    }

    &__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    &__preview {
      display: flex;
      gap: 20px;

      &-media {
        flex: 1;
        max-width: 400px;

        img {
          width: 100%;
          height: auto;
          border-radius: 8px;
        }
      }

      &-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 300px;
        font-size: 48px;
        color: var(--el-text-color-secondary);
        background: var(--el-fill-color-light);
        border-radius: 8px;
      }

      &-info {
        flex: 1;

        h4 {
          margin: 0 0 16px;
          font-size: 20px;
          font-weight: 600;
        }

        p {
          margin: 8px 0;
          line-height: 1.6;
        }
      }

      &__pagination {
        display: flex;
        justify-content: center;
        padding-top: 20px;
        margin-top: 20px;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }
  }

  @media (width <= 768px) {
    .material-management {
      padding: 16px;

      &__actions {
        flex-direction: column;
        align-items: stretch;

        &-left,
        &-right {
          justify-content: center;
        }
      }

      &__grid {
        grid-template-columns: 1fr;
      }

      &__preview {
        flex-direction: column;

        &-media {
          max-width: none;
        }
      }
    }
  }
</style>
