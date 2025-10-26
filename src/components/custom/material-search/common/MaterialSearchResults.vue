<template>
  <div class="material-search-results">
    <!-- 搜索结果 -->
    <div v-if="searchResults.length > 0" class="material-search-results__container">
      <el-card class="material-search-results__card">
        <template #header>
          <div class="material-search-results__header">
            <h3>
              搜索结果 ({{ searchResults.length }} 个素材)
              <span v-if="paginationState.totalResults > searchResults.length">
                / 共 {{ paginationState.totalResults }} 个
              </span>
            </h3>
            <div class="material-search-results__actions">
              <el-button @click="$emit('selectAll')">全选</el-button>
              <el-button @click="$emit('clearSelection')">取消选择</el-button>
              <el-button
                type="primary"
                @click="$emit('showAddToLibraryDialog')"
                :disabled="selectedMaterials.length === 0"
              >
                添加到素材库 ({{ selectedMaterials.length }})
              </el-button>
              <el-button type="success" @click="$emit('goToLibrary')" v-if="hasLibraryMaterials">
                查看素材库
              </el-button>
            </div>
          </div>
        </template>

        <div class="material-search-results__grid">
          <SearchResultCard
            v-for="material in searchResults"
            :key="material.id"
            :material="material"
            :selected="selectedMaterials.includes(material.id)"
            :loading="loadingMaterials.includes(material.id)"
            :show-selection="showSelection"
            :show-score="showScore"
            :context="context"
            @select="$emit('toggleMaterialSelection', material.id)"
            @preview="$emit('showMaterialPreview', material)"
            @click="$emit('selectMaterial', material)"
          />
        </div>

        <!-- 分页 -->
        <div
          v-if="paginationState.totalResults > searchResults.length"
          class="material-search-results__pagination"
        >
          <el-pagination
            :current-page="paginationState.currentPage"
            :page-size="paginationState.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="paginationState.totalResults"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="$emit('handleSizeChange', $event)"
            @current-change="$emit('handleCurrentChange', $event)"
          />
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <div
      v-if="!searching && hasSearched && searchResults.length === 0"
      class="material-search-results__empty"
    >
      <el-empty description="未找到相关素材">
        <el-button type="primary" @click="$emit('resetSearch')">重新搜索</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { Material, PaginationState } from '@/types/material'
  import SearchResultCard from '@/components/custom/material-card/UnifiedMaterialCard.vue'
  import { useMaterialStore } from '@/store/material'

  interface Props {
    searchResults: Material[]
    selectedMaterials: string[]
    loadingMaterials: string[]
    searching: boolean
    hasSearched: boolean
    paginationState: PaginationState
    showSelection?: boolean
    showScore?: boolean
    context?: 'search' | 'management'
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const props = withDefaults(defineProps<Props>(), {
    showSelection: true,
    showScore: true,
    context: 'search'
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const emit = defineEmits<{
    selectAll: []
    clearSelection: []
    showAddToLibraryDialog: []
    goToLibrary: []
    toggleMaterialSelection: [materialId: string]
    showMaterialPreview: [material: Material]
    selectMaterial: [material: Material]
    handleSizeChange: [size: number]
    handleCurrentChange: [page: number]
    resetSearch: []
  }>()

  const materialStore = useMaterialStore()

  // 检查是否有素材库中的素材
  const hasLibraryMaterials = computed(() => materialStore.materials.length > 0)
</script>

<style scoped lang="scss">
  .material-search-results {
    width: 100%;

    &__container {
      margin-bottom: 20px;
    }

    &__card {
      margin-bottom: 20px;
    }

    &__header {
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

    &__actions {
      display: flex;
      gap: 8px;
    }

    &__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
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
  }

  @media (width <= 768px) {
    .material-search-results {
      &__header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      &__actions {
        width: 100%;

        .el-button {
          flex: 1;
        }
      }

      &__grid {
        grid-template-columns: 1fr;
      }
    }
  }
</style>
