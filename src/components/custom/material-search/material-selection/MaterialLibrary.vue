<template>
  <div class="material-library">
    <div class="library-filters">
      <el-input v-model="keyword" placeholder="搜索素材库..." clearable @input="handleFilter">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="selectedTag" placeholder="选择标签" clearable style="width: 200px">
        <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
      </el-select>
    </div>
    <div class="library-content">
      <div class="materials-grid">
        <el-card
          v-for="material in paginatedMaterials"
          :key="material.id"
          class="material-item library-material"
          shadow="hover"
          :class="{ selected: isSelected(material.id) }"
        >
          <div class="material-content">
            <div class="material-header">
              <h4>{{ material.title }}</h4>
              <el-button
                v-if="!isSelected(material.id)"
                text
                type="primary"
                size="small"
                @click="$emit('add', material)"
              >
                <el-icon><Plus /></el-icon>
                添加
              </el-button>
              <el-tag v-else type="success" size="small">已添加</el-tag>
            </div>
            <p class="material-summary">{{ material.summary }}</p>
            <div class="material-tags">
              <el-tag v-for="tag in material.tags.slice(0, 3)" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </div>

      <div v-if="materials.length === 0" class="empty-state">
        <el-empty description="暂无素材，请先刷新素材库">
          <template #image>
            <el-icon size="64"><Folder /></el-icon>
          </template>
        </el-empty>
      </div>

      <div class="library-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="filteredMaterials.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed } from 'vue'
  import { Search, Plus, Folder } from '@element-plus/icons-vue'
  import type { Material } from '@/types/material'

  interface Props {
    materials: Material[]
    selectedIds: string[]
  }

  const props = defineProps<Props>()

  defineEmits<{
    add: [material: Material]
  }>()

  // 筛选状态
  const keyword = ref('')
  const selectedTag = ref('')
  const pagination = reactive({
    page: 1,
    pageSize: 10
  })

  // 可用标签
  const availableTags = computed(() => {
    const tags = new Set<string>()
    props.materials.forEach((material) => {
      material.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags)
  })

  // 筛选后的素材
  const filteredMaterials = computed(() => {
    let filtered = props.materials

    if (keyword.value) {
      const kw = keyword.value.toLowerCase()
      filtered = filtered.filter(
        (material) =>
          material.title.toLowerCase().includes(kw) || material.summary.toLowerCase().includes(kw)
      )
    }

    if (selectedTag.value) {
      filtered = filtered.filter((material) => material.tags.includes(selectedTag.value))
    }

    return filtered
  })

  // 分页后的素材
  const paginatedMaterials = computed(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredMaterials.value.slice(start, end)
  })

  // 检查素材是否已选中
  const isSelected = (materialId: string) => {
    return props.selectedIds.includes(materialId)
  }

  // 处理筛选
  const handleFilter = () => {
    pagination.page = 1
  }

  // 暴露分页状态给父组件
  const page = computed({
    get: () => pagination.page,
    set: (val) => {
      pagination.page = val
    }
  })

  const pageSize = computed({
    get: () => pagination.pageSize,
    set: (val) => {
      pagination.pageSize = val
      pagination.page = 1
    }
  })
</script>

<style scoped lang="scss">
  .material-library {
    .library-filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .library-content {
      .materials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
      }

      .library-material {
        &.selected {
          background-color: var(--el-color-success-light-9);
          border-color: var(--el-color-success);
        }
      }

      .library-pagination {
        display: flex;
        justify-content: center;
      }

      .empty-state {
        padding: 40px;
        text-align: center;
      }
    }

    .material-item {
      .material-content {
        .material-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;

          h4 {
            flex: 1;
            margin: 0;
            font-size: 15px;
            font-weight: 600;
            line-height: 1.4;
            color: var(--el-text-color-primary);
          }
        }

        .material-summary {
          display: -webkit-box;
          margin: 0 0 12px;
          overflow: hidden;
          font-size: 13px;
          line-height: 1.5;
          color: var(--el-text-color-regular);
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .material-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
      }
    }
  }

  @media (width <= 768px) {
    .material-library {
      .library-filters {
        flex-direction: column;
      }

      .library-content {
        .materials-grid {
          grid-template-columns: 1fr;
        }
      }
    }
  }
</style>
