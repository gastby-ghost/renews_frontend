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
        @select="toggleMaterialSelection"
        @preview="showPreview"
        @download="downloadMaterial"
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

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewMaterial?.title"
      width="80%"
      :before-close="closePreview"
    >
      <div class="material-management__preview" v-if="previewMaterial">
        <div class="material-management__preview-media">
          <img
            v-if="previewMaterial.thumbnail"
            :src="previewMaterial.thumbnail"
            :alt="previewMaterial.title"
          />
          <div v-else class="material-management__preview-placeholder">
            <el-icon><Picture /></el-icon>
          </div>
        </div>
        <div class="material-management__preview-info">
          <h4>{{ previewMaterial.title }}</h4>
          <p><strong>来源：</strong>{{ previewMaterial.source }}</p>
          <p><strong>类型：</strong>{{ getTypeLabel(previewMaterial.type) }}</p>
          <p><strong>总结：</strong>{{ previewMaterial.summary }}</p>
          <p
            ><strong>标签：</strong>
            <el-tag
              v-for="tag in previewMaterial.tags"
              :key="tag"
              size="small"
              style="margin-right: 4px"
            >
              {{ tag }}
            </el-tag>
          </p>
          <p><strong>创建时间：</strong>{{ formatDate(previewMaterial.createdAt) }}</p>
        </div>
      </div>
    </el-dialog>

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
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Search, Refresh, Delete, Download, Picture } from '@element-plus/icons-vue'
  import MaterialCard from '@/components/custom/material-card/MaterialCard.vue'
  import { useMaterialStore } from '@/store/material'
  import { materialApiService } from '@/services/materialApi'
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
  const previewVisible = ref(false)
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

  function showPreview(material: Material) {
    previewMaterial.value = material
    previewVisible.value = true
  }

  function closePreview() {
    previewVisible.value = false
    previewMaterial.value = null
  }

  async function downloadMaterial(material: Material) {
    if (!material.url) {
      ElMessage.warning('该素材暂不支持下载')
      return
    }

    loadingMaterials.value.push(material.id)

    try {
      // 模拟下载
      await new Promise((resolve) => setTimeout(resolve, 1000))
      ElMessage.success('下载完成')
    } catch (err) {
      console.error('下载失败:', err)
      ElMessage.error('下载失败')
    } finally {
      loadingMaterials.value = loadingMaterials.value.filter((id) => id !== material.id)
    }
  }

  async function handleEdit(material: Material) {
    try {
      // 使用Element Plus的MessageBox作为简单的编辑对话框
      const { value: newTitle } = await ElMessageBox.prompt('请输入新的素材标题', '编辑素材', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: material.title,
        inputPattern: /^.{1,255}$/,
        inputErrorMessage: '标题长度应在1-255个字符之间'
      })

      if (newTitle && newTitle !== material.title) {
        // 调用API更新素材
        await materialApiService.updateMaterial(parseInt(material.id, 10), {
          title: newTitle
        })

        // 更新本地状态
        materialStore.updateMaterial({
          id: material.id,
          title: newTitle
        })

        ElMessage.success('素材更新成功')
      }
    } catch (err) {
      if (err !== 'cancel') {
        console.error('编辑素材失败:', err)
        ElMessage.error('编辑素材失败')
      }
    }
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

  function getTypeLabel(type: Material['type']) {
    const typeLabels = {
      image: '图片',
      video: '视频',
      audio: '音频',
      text: '文本',
      other: '其他'
    }
    return typeLabels[type] || '其他'
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
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
    } catch (err) {
      console.error('加载素材库失败:', err)
      ElMessage.error('加载素材库失败')
    }

    // 监听路由变化，刷新素材列表
    const unwatch = router.afterEach(async (to) => {
      if (to.path === '/material/management') {
        try {
          await loadMaterials()
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
