<template>
  <div>
    <!-- 右侧素材抽屉 -->
    <div class="material-drawer" :class="{ 'drawer-open': materialDrawerVisible }">
      <div class="drawer-header">
        <h3>素材管理</h3>
        <div class="drawer-actions">
          <el-button @click="refreshMaterials" size="small" :loading="loadingMaterials">
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button @click="toggleDrawer" size="small">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="drawer-content">
        <!-- 搜索和筛选 -->
        <div class="material-filters">
          <el-input
            v-model="materialSearchKeyword"
            placeholder="搜索素材..."
            size="small"
            clearable
            @input="filterMaterials"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="materialFilterType"
            placeholder="类型"
            size="small"
            clearable
            @change="filterMaterials"
          >
            <el-option label="全部" value="" />
            <el-option label="外部" value="外部" />
            <el-option label="主流媒体" value="主流媒体" />
            <el-option label="本地" value="本地" />
          </el-select>
        </div>

        <!-- 素材列表 -->
        <div class="material-list">
          <div v-if="filteredMaterials.length === 0" class="empty-state">
            <el-icon size="48"><Document /></el-icon>
            <p>暂无素材</p>
            <el-button @click="goToMaterialManagement" type="primary" size="small">
              去素材库添加
            </el-button>
          </div>

          <div
            v-for="material in filteredMaterials"
            :key="material.id"
            class="material-item"
            draggable="true"
            @dragstart="handleDragStart($event, material)"
            @click="selectMaterial(material)"
          >
            <div class="material-header">
              <h4>{{ material.title }}</h4>
              <div class="material-tags">
                <el-tag
                  v-for="tag in material.tags.slice(0, 2)"
                  :key="tag"
                  size="small"
                  :type="getTagType(tag)"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>

            <div class="material-content">
              <p>{{ material.summary || material.content.substring(0, 100) }}...</p>
            </div>

            <div class="material-footer">
              <span class="material-source">{{ material.source }}</span>
              <span class="material-date">{{ formatDate(material.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 抽屉开关按钮 -->
    <div class="drawer-toggle" @click="toggleDrawer">
      <el-icon><Collection /></el-icon>
      <span>素材库</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { Refresh, Close, Search, Document, Collection } from '@element-plus/icons-vue'
  import { useMaterialStore } from '@/store/material'
  import type { Material } from '@/types/material'

  // Props
  interface Props {
    selectedMaterials?: Material[]
  }

  const props = withDefaults(defineProps<Props>(), {
    selectedMaterials: () => []
  })

  // Emits
  const emit = defineEmits<{
    'update:selectedMaterials': [materials: Material[]]
    'material-selected': [material: Material]
    'material-dragged': [event: DragEvent, material: Material]
  }>()

  // Store
  const materialStore = useMaterialStore()
  const router = useRouter()

  // 响应式数据
  const materialDrawerVisible = ref(false)
  const materialSearchKeyword = ref('')
  const materialFilterType = ref('')
  const loadingMaterials = ref(false)

  // 素材相关计算属性
  const allMaterials = computed(() => materialStore.materials)

  const filteredMaterials = computed(() => {
    let materials = allMaterials.value

    // 按搜索关键词过滤
    if (materialSearchKeyword.value) {
      const keyword = materialSearchKeyword.value.toLowerCase()
      materials = materials.filter(
        (material) =>
          material.title.toLowerCase().includes(keyword) ||
          material.summary?.toLowerCase().includes(keyword) ||
          material.content.toLowerCase().includes(keyword) ||
          material.tags.some((tag) => tag.toLowerCase().includes(keyword))
      )
    }

    // 按类型过滤
    if (materialFilterType.value) {
      materials = materials.filter((material) => material.tags.includes(materialFilterType.value))
    }

    return materials
  })

  // 方法
  const toggleDrawer = () => {
    materialDrawerVisible.value = !materialDrawerVisible.value
  }

  const refreshMaterials = async () => {
    try {
      loadingMaterials.value = true
      await materialStore.loadLibraryMaterials()
      ElMessage.success('素材列表已刷新')
    } catch {
      ElMessage.error('刷新素材列表失败')
    } finally {
      loadingMaterials.value = false
    }
  }

  const filterMaterials = () => {
    // 过滤逻辑由计算属性处理
  }

  const selectMaterial = (material: Material) => {
    // 检查是否已经选中
    const existingIndex = props.selectedMaterials.findIndex((m) => m.id === material.id)
    if (existingIndex === -1) {
      const newSelectedMaterials = [...props.selectedMaterials, material]
      emit('update:selectedMaterials', newSelectedMaterials)
      emit('material-selected', material)
      ElMessage.success(`已添加素材：${material.title}`)
    } else {
      ElMessage.warning('该素材已存在')
    }
  }

  const handleDragStart = (event: DragEvent, material: Material) => {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', JSON.stringify(material))
      event.dataTransfer.effectAllowed = 'copy'
    }
    emit('material-dragged', event, material)
  }

  const getTagType = (tag: string) => {
    const tagTypes: Record<string, string> = {
      外部: 'warning',
      主流媒体: 'success',
      本地: 'info'
    }
    return tagTypes[tag] || 'default'
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const goToMaterialManagement = () => {
    router.push('/material/management')
  }

  // 生命周期
  onMounted(async () => {
    try {
      const localMaterials = JSON.parse(localStorage.getItem('materials') || '[]')
      if (localMaterials.length > 0) {
        materialStore.addMaterials(localMaterials)
      }
      await materialStore.loadLibraryMaterials()
    } catch (error) {
      console.error('加载素材库失败:', error)
    }
  })
</script>

<style scoped lang="scss">
  .material-drawer {
    position: fixed;
    top: 0;
    right: -400px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    width: 400px;
    height: 100vh;
    background: var(--el-bg-color);
    border-left: 1px solid var(--el-border-color);
    box-shadow: -2px 0 8px rgb(0 0 0 / 10%);
    transition: right 0.3s ease;

    &.drawer-open {
      right: 0;
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: var(--el-bg-color-page);
      border-bottom: 1px solid var(--el-border-color);

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .drawer-actions {
        display: flex;
        gap: 8px;
      }
    }

    .drawer-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: hidden;

      .material-filters {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid var(--el-border-color);

        .el-input {
          width: 100%;
        }

        .el-select {
          width: 100%;
        }
      }

      .material-list {
        flex: 1;
        padding: 16px 20px;
        overflow-y: auto;

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--el-text-color-secondary);
          text-align: center;

          .el-icon {
            margin-bottom: 16px;
            color: var(--el-text-color-placeholder);
          }

          p {
            margin: 0 0 16px;
            font-size: 14px;
          }
        }

        .material-item {
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          background: var(--el-bg-color);
          border: 1px solid var(--el-border-color);
          border-radius: 8px;
          transition: all 0.2s ease;

          &:hover {
            border-color: var(--el-color-primary);
            box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
          }

          &:active {
            transform: translateY(1px);
          }

          .material-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 8px;

            h4 {
              flex: 1;
              margin: 0;
              font-size: 14px;
              font-weight: 600;
              line-height: 1.4;
              color: var(--el-text-color-primary);
            }

            .material-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
              margin-left: 8px;
            }
          }

          .material-content {
            margin-bottom: 12px;

            p {
              display: -webkit-box;
              margin: 0;
              overflow: hidden;
              font-size: 12px;
              line-height: 1.4;
              color: var(--el-text-color-regular);
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
          }

          .material-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 11px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }

  .drawer-toggle {
    position: fixed;
    top: 50%;
    right: 20px;
    z-index: 999;
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    background: var(--el-color-primary);
    border-radius: 8px 0 0 8px;
    box-shadow: -2px 0 8px rgb(0 0 0 / 10%);
    transition: all 0.3s ease;
    transform: translateY(-50%);

    &:hover {
      right: 25px;
      background: var(--el-color-primary-light-3);
    }
  }

  // 响应式设计
  @media (width <= 768px) {
    .material-drawer {
      right: -100vw;
      width: 100vw;

      &.drawer-open {
        right: 0;
      }
    }

    .drawer-toggle {
      right: 10px;
      padding: 10px 12px;
      font-size: 12px;

      span {
        display: none;
      }
    }
  }
</style>
