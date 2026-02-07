<template>
  <el-dialog
    v-model="visible"
    title="从素材库选择"
    width="80%"
    :before-close="closeDialog"
    class="material-library-dialog"
    :modal-class="'material-library-modal'"
  >
    <div class="material-library-dialog__content" v-if="visible">
      <!-- 搜索和筛选区域 -->
      <div class="material-library-dialog__filter">
        <el-form :model="filterForm" inline>
          <el-form-item label="搜索">
            <el-input
              v-model="filterForm.search"
              placeholder="搜索素材标题、标签..."
              clearable
              @input="handleSearch"
              style="width: 250px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="标签">
            <el-select
              v-model="filterForm.tags"
              placeholder="选择标签"
              multiple
              collapse-tags
              collapse-tags-tooltip
              clearable
              @change="handleFilterChange"
              style="width: 300px"
            >
              <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
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
      </div>

      <!-- 已选素材显示 -->
      <div v-if="selectedMaterials.length > 0" class="material-library-dialog__selected">
        <div class="selected-header">
          <h4>已选择素材 ({{ selectedMaterials.length }}/20)</h4>
          <el-button link type="danger" @click="resetSelection">清空选择</el-button>
        </div>
        <div class="selected-list">
          <el-tag
            v-for="material in selectedMaterials"
            :key="material.id"
            closable
            @close="removeFromSelection(material)"
            type="primary"
          >
            {{ material.title }}
          </el-tag>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="materialStore.loading" class="material-library-dialog__loading">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 素材网格 -->
      <div v-else-if="filteredMaterials.length > 0" class="material-library-dialog__grid">
        <UnifiedMaterialCard
          v-for="material in filteredMaterials"
          :key="material.id"
          :material="material"
          :selected="isSelected(material.id)"
          :show-selection="true"
          :show-score="true"
          context="management"
          @select="() => toggleMaterial(material)"
        />
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="暂无素材" :image-size="200" />
    </div>

    <template #footer>
      <div class="material-library-dialog__footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button
          type="primary"
          @click="confirmSelection"
          :disabled="selectedMaterials.length === 0"
        >
          确认选择 ({{ selectedMaterials.length }})
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { Search, Refresh } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import { useMaterialStore } from '@/store/material'
  import UnifiedMaterialCard from './UnifiedMaterialCard.vue'
  import type { Material } from '@/types/material'

  interface Props {
    visible: boolean
    maxSelection?: number
  }

  interface Emits {
    (e: 'update:visible', visible: boolean): void
    (e: 'confirm', materials: Material[]): void
  }

  const props = withDefaults(defineProps<Props>(), {
    maxSelection: 20
  })

  const emit = defineEmits<Emits>()

  const materialStore = useMaterialStore()

  // 筛选表单
  const filterForm = ref({
    search: '',
    tags: [] as string[]
  })

  // 选中的素材列表（本地状态）
  const selectedMaterials = ref<Material[]>([])

  // 计算属性
  const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const materials = computed(() => materialStore.materials)

  const filteredMaterials = computed(() => {
    const search = filterForm.value.search.toLowerCase()
    if (!search && filterForm.value.tags.length === 0) {
      return materials.value
    }
    return materials.value.filter((material) => {
      const matchSearch =
        !search ||
        material.title.toLowerCase().includes(search) ||
        material.summary.toLowerCase().includes(search) ||
        material.tags.some((tag) => tag.toLowerCase().includes(search))

      const matchTags =
        filterForm.value.tags.length === 0 ||
        filterForm.value.tags.every((tag) => material.tags.includes(tag))

      return matchSearch && matchTags
    })
  })

  const availableTags = computed(() => {
    const allTags = materials.value.flatMap((m) => m.tags || [])
    const uniqueTags = new Set(allTags)
    return Array.from(uniqueTags).sort()
  })

  // 方法
  function closeDialog() {
    visible.value = false
    // 清空筛选表单
    filterForm.value = {
      search: '',
      tags: []
    }
  }

  function handleSearch() {
    // 实时搜索延迟处理
    // 可以在这里添加防抖处理
  }

  function handleFilterChange() {
    // 标签筛选变化
  }

  async function applyFilters() {
    try {
      await loadMaterials()
      ElMessage.success(`筛选结果：${filteredMaterials.value.length} 个素材`)
    } catch {
      ElMessage.error('筛选失败')
    }
  }

  async function resetFilters() {
    filterForm.value = {
      search: '',
      tags: []
    }
    try {
      await loadMaterials()
      ElMessage.info('已重置筛选条件')
    } catch {
      ElMessage.error('重置失败')
    }
  }

  function isSelected(materialId: string): boolean {
    return selectedMaterials.value.some((m) => m.id === materialId)
  }

  function toggleMaterial(material: Material) {
    const index = selectedMaterials.value.findIndex((m) => m.id === material.id)
    if (index > -1) {
      selectedMaterials.value.splice(index, 1)
    } else {
      if (selectedMaterials.value.length >= props.maxSelection) {
        ElMessage.warning(`最多只能选择 ${props.maxSelection} 个素材`)
        return
      }
      selectedMaterials.value.push(material)
    }
  }

  function removeFromSelection(material: Material) {
    const index = selectedMaterials.value.findIndex((m) => m.id === material.id)
    if (index > -1) {
      selectedMaterials.value.splice(index, 1)
    }
  }

  function resetSelection() {
    selectedMaterials.value = []
  }

  function confirmSelection() {
    emit('confirm', [...selectedMaterials.value])
    ElMessage.success(`已选择 ${selectedMaterials.value.length} 个素材`)
    closeDialog()
  }

  async function loadMaterials() {
    const params = {
      page: 1,
      page_size: 50,
      keywords: filterForm.value.search || undefined,
      tags: filterForm.value.tags.length > 0 ? filterForm.value.tags : undefined
    }

    await materialStore.loadAllMaterialsFromDatabase(params)
  }

  // 监听对话框打开，加载素材
  watch(visible, async (newVisible) => {
    if (newVisible) {
      selectedMaterials.value = []
      await loadMaterials()
    }
  })
</script>

<style scoped lang="scss">
  .material-library-dialog {
    .el-dialog__body {
      padding: 0;
    }

    .el-dialog__header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--el-border-color);
    }

    .el-dialog__footer {
      padding: 16px 24px 20px;
      border-top: 1px solid var(--el-border-color);
    }
  }

  .material-library-dialog__content {
    max-height: 70vh;
    overflow-y: auto;
  }

  .material-library-dialog__filter {
    padding: 20px 24px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color);

    .el-form-item {
      margin-bottom: 0;
    }
  }

  .material-library-dialog__selected {
    padding: 16px 24px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color);

    .selected-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      h4 {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-primary);
      }
    }

    .selected-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .el-tag {
        margin: 0;
      }
    }
  }

  .material-library-dialog__loading {
    padding: 40px 24px;
  }

  .material-library-dialog__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    padding: 24px;
  }

  .material-library-dialog__footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  @media (width <= 768px) {
    .material-library-dialog {
      .el-dialog__header,
      .el-dialog__footer {
        padding-right: 16px;
        padding-left: 16px;
      }
    }

    .material-library-dialog__filter {
      padding: 16px;
    }

    .material-library-dialog__grid {
      grid-template-columns: 1fr;
      padding: 16px;
    }
  }
</style>
