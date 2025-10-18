<template>
  <div class="material-search-page">
    <div class="material-search-page__header">
      <h1 class="material-search-page__title">素材检索</h1>
      <p class="material-search-page__description">使用智能搜索工具从多个来源查找高质量素材</p>
    </div>

    <div class="material-search-page__content">
      <MaterialSearch />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useMaterialStore } from '@/store/material'
  import MaterialSearch from '@/components/custom/material-search/MaterialSearch.vue'

  const materialStore = useMaterialStore()

  // 页面加载时检查搜索工具状态
  onMounted(async () => {
    try {
      await materialStore.checkSearchToolsStatus()
    } catch (error) {
      console.error('Failed to check search tools status:', error)
    }
  })
</script>

<style scoped lang="scss">
  .material-search-page {
    padding: 24px;

    &__header {
      margin-bottom: 24px;
      text-align: center;
    }

    &__title {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__description {
      margin: 0;
      font-size: 16px;
      color: var(--el-text-color-secondary);
    }

    &__content {
      max-width: 1200px;
      margin: 0 auto;
    }
  }

  @media (width <= 768px) {
    .material-search-page {
      padding: 16px;

      &__title {
        font-size: 24px;
      }

      &__description {
        font-size: 14px;
      }
    }
  }
</style>
