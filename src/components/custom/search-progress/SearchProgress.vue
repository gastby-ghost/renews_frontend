<template>
  <div class="art-search-progress">
    <div class="art-search-progress__header">
      <h3 class="art-search-progress__title">
        <el-icon><Search /></el-icon>
        素材搜索进度
      </h3>
      <el-button size="small" type="danger" @click="handleCancel" :disabled="!isActive">
        取消搜索
      </el-button>
    </div>

    <div class="art-search-progress__stages">
      <div
        v-for="stage in stages"
        :key="stage.id"
        class="art-search-progress__stage"
        :class="{
          'art-search-progress__stage--active': currentStage?.id === stage.id,
          'art-search-progress__stage--completed': isStageCompleted(stage.id)
        }"
      >
        <div class="art-search-progress__stage-icon">
          <el-icon v-if="isStageCompleted(stage.id)">
            <Check />
          </el-icon>
          <el-icon v-else-if="currentStage?.id === stage.id" class="is-loading">
            <Loading />
          </el-icon>
          <el-icon v-else>
            <Clock />
          </el-icon>
        </div>
        <div class="art-search-progress__stage-content">
          <div class="art-search-progress__stage-title">{{ stage.title }}</div>
          <div class="art-search-progress__stage-description">{{ stage.description }}</div>
        </div>
      </div>
    </div>

    <div class="art-search-progress__progress" v-if="currentStage">
      <div class="art-search-progress__progress-info">
        <span class="art-search-progress__progress-label">
          {{ currentStage.title }}
        </span>
        <span class="art-search-progress__progress-text">
          {{ progressMessage }}
        </span>
      </div>

      <el-progress
        :percentage="progressPercentage"
        :status="progressStatus"
        :stroke-width="8"
        :show-text="false"
      />

      <div class="art-search-progress__progress-details">
        <span>{{ progress.current }} / {{ progress.total }}</span>
        <span>{{ Math.round(progressPercentage) }}%</span>
      </div>
    </div>

    <div class="art-search-progress__config" v-if="showConfig && config">
      <div class="art-search-progress__config-header">
        <h4>搜索配置</h4>
        <el-button
          size="small"
          @click="toggleConfigEdit"
          :icon="isEditingConfig ? 'Check' : 'Edit'"
        >
          {{ isEditingConfig ? '保存' : '编辑' }}
        </el-button>
      </div>

      <div class="art-search-progress__config-content">
        <div class="art-search-progress__config-item">
          <label>关键词：</label>
          <el-input
            v-if="isEditingConfig"
            v-model="editableConfig.keywords"
            placeholder="输入搜索关键词"
            size="small"
          />
          <span v-else>{{ config.keywords }}</span>
        </div>

        <div class="art-search-progress__config-item">
          <label>检索范围：</label>
          <el-input
            v-if="isEditingConfig"
            v-model="editableConfig.searchScope"
            type="textarea"
            :rows="3"
            placeholder="描述AI理解的检索范围"
            size="small"
          />
          <span v-else>{{ config.searchScope }}</span>
        </div>

        <div class="art-search-progress__config-item">
          <label>搜索源：</label>
          <div class="art-search-progress__providers">
            <el-tag
              v-for="provider in selectedProviders"
              :key="provider.id"
              size="small"
              :type="provider.type === 'ai' ? 'warning' : 'success'"
            >
              {{ provider.name }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import type { SearchConfig, SearchProgress, SearchProvider } from '@/types/material'
  import { Search, Check, Loading, Clock } from '@element-plus/icons-vue'

  interface Props {
    progress: SearchProgress
    config?: SearchConfig
    providers: SearchProvider[]
    showConfig?: boolean
    isActive?: boolean
  }

  interface Emits {
    (e: 'cancel'): void
    (e: 'update:config', config: SearchConfig): void
  }

  const props = withDefaults(defineProps<Props>(), {
    showConfig: true,
    isActive: false
  })

  const emit = defineEmits<Emits>()

  const isEditingConfig = ref(false)
  const editableConfig = ref<SearchConfig>({} as SearchConfig)

  const stages = [
    {
      id: 'config',
      title: '配置搜索',
      description: '设置搜索参数和范围'
    },
    {
      id: 'searching',
      title: '搜索素材',
      description: '从多个源检索相关素材'
    },
    {
      id: 'processing',
      title: '处理结果',
      description: '整理和格式化搜索结果'
    },
    {
      id: 'completed',
      title: '搜索完成',
      description: '所有素材已准备就绪'
    }
  ]

  const currentStage = computed(() => {
    return stages.find((stage) => stage.id === props.progress.stage)
  })

  const progressPercentage = computed(() => {
    if (props.progress.total === 0) return 0
    return Math.round((props.progress.current / props.progress.total) * 100)
  })

  const progressStatus = computed(() => {
    if (props.progress.stage === 'completed') return 'success'
    if (props.progress.stage === 'processing') return 'warning'
    return ''
  })

  const progressMessage = computed(() => {
    return props.progress.message || '正在处理...'
  })

  const selectedProviders = computed(() => {
    if (!props.config) return []
    return props.providers.filter((provider) => props.config!.providers.includes(provider.id))
  })

  function isStageCompleted(stageId: string) {
    const currentIndex = stages.findIndex((s) => s.id === props.progress.stage)
    const stageIndex = stages.findIndex((s) => s.id === stageId)
    return stageIndex < currentIndex
  }

  function handleCancel() {
    emit('cancel')
  }

  function toggleConfigEdit() {
    if (isEditingConfig.value) {
      // Save config
      emit('update:config', editableConfig.value)
      isEditingConfig.value = false
    } else {
      // Start editing
      if (props.config) {
        editableConfig.value = { ...props.config }
      }
      isEditingConfig.value = true
    }
  }

  // Watch for config changes
  watch(
    () => props.config,
    (newConfig) => {
      if (newConfig && !isEditingConfig.value) {
        editableConfig.value = { ...newConfig }
      }
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .art-search-progress {
    width: 100%;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    &__title {
      display: flex;
      gap: 8px;
      align-items: center;
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .el-icon {
        font-size: 20px;
        color: var(--el-color-primary);
      }
    }

    &__stages {
      position: relative;
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;

      &::before {
        position: absolute;
        top: 20px;
        right: 20px;
        left: 20px;
        z-index: 1;
        height: 2px;
        content: '';
        background: var(--el-border-color-lighter);
      }
    }

    &__stage {
      position: relative;
      z-index: 2;
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 8px;
      align-items: center;

      &--active {
        .art-search-progress__stage-icon {
          color: white;
          background: var(--el-color-primary);
          border-color: var(--el-color-primary);
        }

        .art-search-progress__stage-title {
          font-weight: 600;
          color: var(--el-color-primary);
        }
      }

      &--completed {
        .art-search-progress__stage-icon {
          color: white;
          background: var(--el-color-success);
          border-color: var(--el-color-success);
        }

        .art-search-progress__stage-title {
          color: var(--el-color-success);
        }
      }
    }

    &__stage-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: white;
      border: 2px solid var(--el-border-color);
      border-radius: 50%;
      transition: all 0.3s ease;

      .el-icon {
        font-size: 16px;
      }
    }

    &__stage-content {
      max-width: 100px;
      text-align: center;
    }

    &__stage-title {
      margin: 0 0 4px;
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }

    &__stage-description {
      margin: 0;
      font-size: 10px;
      line-height: 1.3;
      color: var(--el-text-color-secondary);
    }

    &__progress {
      margin-bottom: 20px;
    }

    &__progress-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    &__progress-label {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    &__progress-text {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    &__progress-details {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    &__config {
      padding-top: 20px;
      border-top: 1px solid var(--el-border-color-lighter);
    }

    &__config-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    &__config-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    &__config-item {
      display: flex;
      gap: 8px;
      align-items: flex-start;

      label {
        min-width: 80px;
        font-weight: 500;
        line-height: 1.5;
        color: var(--el-text-color-regular);
      }

      span {
        flex: 1;
        line-height: 1.5;
        color: var(--el-text-color-primary);
      }

      .el-input {
        flex: 1;
      }
    }

    &__providers {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  }

  @media (width <= 768px) {
    .art-search-progress {
      padding: 16px;

      &__stages {
        flex-direction: column;
        gap: 16px;

        &::before {
          display: none;
        }
      }

      &__stage {
        flex-direction: row;
        align-items: flex-start;
        max-width: none;
        text-align: left;
      }

      &__config-item {
        flex-direction: column;
        align-items: flex-start;

        label {
          min-width: auto;
        }
      }
    }
  }
</style>
