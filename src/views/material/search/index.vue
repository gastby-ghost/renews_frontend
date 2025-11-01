<template>
  <div class="material-search-page">
    <div class="material-search-page__header">
      <h1 class="material-search-page__title">素材检索</h1>
      <p class="material-search-page__description">使用智能搜索工具从多个来源查找高质量素材</p>
    </div>

    <!-- 搜索模式切换 -->
    <div class="material-search-page__mode-switch">
      <el-radio-group v-model="searchMode" @change="handleModeChange">
        <el-radio-button value="simple">普通搜索</el-radio-button>
        <el-radio-button value="agent">Agent检索</el-radio-button>
      </el-radio-group>
    </div>

    <div class="material-search-page__content">
      <MaterialSearch v-if="searchMode === 'simple'" />
      <AgentSearch v-else-if="searchMode === 'agent'" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useMaterialStore } from '@/store/material'
  import MaterialSearch from '@/components/custom/material-search/MaterialSearch.vue'
  import AgentSearch from '@/components/custom/material-search/AgentMaterialSearch.vue'

  const materialStore = useMaterialStore()
  const searchMode = ref<'simple' | 'agent'>('simple')

  // 处理搜索模式切换
  const handleModeChange = (mode: 'simple' | 'agent') => {
    searchMode.value = mode
    materialStore.setSearchMode(mode)
  }

  // 组件挂载时初始化搜索模式
  onMounted(() => {
    searchMode.value = materialStore.searchMode
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

    &__mode-switch {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
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
