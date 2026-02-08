<template>
  <div class="keyword-search">
    <el-form :model="form" label-width="80px">
      <el-form-item label="关键词">
        <el-input
          v-model="form.keywords"
          placeholder="请输入搜索关键词"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch" :loading="loading"> 搜索 </el-button>
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading" size="32"><Loading /></el-icon>
      <p>正在搜索素材...</p>
    </div>

    <div v-else-if="results.length > 0" class="search-results">
      <div class="results-header">
        <span>搜索结果 ({{ results.length }})</span>
      </div>
      <div class="materials-grid">
        <el-card
          v-for="material in results"
          :key="material.id"
          class="material-item"
          shadow="hover"
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
    </div>

    <div v-else class="empty-state">
      <el-empty description="请输入关键词搜索素材">
        <template #image>
          <el-icon size="64"><Search /></el-icon>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive } from 'vue'
  import { Search, Loading, Plus } from '@element-plus/icons-vue'
  import type { Material } from '@/types/material'

  interface Props {
    loading: boolean
    results: Material[]
    selectedIds: string[]
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    search: [keywords: string]
    add: [material: Material]
  }>()

  const form = reactive({
    keywords: ''
  })

  const isSelected = (materialId: string) => {
    return props.selectedIds.includes(materialId)
  }

  const handleSearch = () => {
    if (!form.keywords.trim()) {
      return
    }
    emit('search', form.keywords)
  }
</script>

<style scoped lang="scss">
  .keyword-search {
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--el-text-color-secondary);

      p {
        margin-top: 12px;
        font-size: 14px;
      }
    }

    .search-results {
      margin-top: 20px;

      .results-header {
        margin-bottom: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .materials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
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

    .empty-state {
      padding: 40px;
      text-align: center;
    }
  }

  @media (width <= 768px) {
    .keyword-search {
      .search-results {
        .materials-grid {
          grid-template-columns: 1fr;
        }
      }
    }
  }
</style>
