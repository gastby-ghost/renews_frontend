<template>
  <div
    class="art-material-card"
    :class="{
      'art-material-card--selected': isSelected,
      'art-material-card--loading': loading
    }"
    @click="handleClick"
  >
    <div class="art-material-card__selection" v-if="showSelection">
      <el-checkbox :model-value="isSelected" @change="handleSelectionChange" @click.stop />
    </div>

    <div class="art-material-card__type" v-if="showType">
      <el-tag size="small" :type="getTypeTagType">
        {{ getTypeLabel }}
      </el-tag>
    </div>

    <div class="art-material-card__content">
      <h3 class="art-material-card__title" :title="material.title">
        {{ material.title }}
      </h3>

      <p class="art-material-card__summary">
        {{ material.summary }}
      </p>

      <div class="art-material-card__tags" v-if="material.tags.length > 0">
        <el-tag
          v-for="tag in material.tags.slice(0, 3)"
          :key="tag"
          size="small"
          class="art-material-card__tag"
        >
          {{ tag }}
        </el-tag>
        <el-tag v-if="material.tags.length > 3" size="small" type="info">
          +{{ material.tags.length - 3 }}
        </el-tag>
      </div>

      <div class="art-material-card__footer">
        <div class="art-material-card__source">
          <el-icon><Location /></el-icon>
          <a
            :href="material.url"
            target="_blank"
            rel="noopener noreferrer"
            @click.stop
            class="art-material-card__source-link"
          >
            {{ material.source }}
          </a>
        </div>
        <div class="art-material-card__actions">
          <el-button size="small" type="primary" @click.stop="handlePreview"> 预览 </el-button>
          <el-button size="small" @click.stop="handleEdit"> 编辑 </el-button>
          <el-button size="small" @click.stop="handleDownload" :disabled="!material.url">
            下载
          </el-button>
        </div>
      </div>
    </div>

    <div class="art-material-card__overlay" v-if="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { Material } from '@/types/material'
  import { Location, Loading } from '@element-plus/icons-vue'

  interface Props {
    material: Material
    selected?: boolean
    loading?: boolean
    showSelection?: boolean
    showType?: boolean
  }

  interface Emits {
    (e: 'select', id: string): void
    (e: 'preview', material: Material): void
    (e: 'download', material: Material): void
    (e: 'edit', material: Material): void
    (e: 'click', material: Material): void
  }

  const props = withDefaults(defineProps<Props>(), {
    selected: false,
    loading: false,
    showSelection: true,
    showType: false
  })

  const emit = defineEmits<Emits>()

  const isSelected = computed(() => props.selected)

  const getTypeTagType = computed(() => {
    const typeMap = {
      image: 'success',
      video: 'warning',
      audio: 'info',
      text: '',
      other: 'danger'
    }
    return typeMap[props.material.type] || ''
  })

  const getTypeLabel = computed(() => {
    const typeLabels = {
      image: '图片',
      video: '视频',
      audio: '音频',
      text: '文本',
      other: '其他'
    }
    return typeLabels[props.material.type] || '其他'
  })

  function handleClick() {
    emit('click', props.material)
  }

  function handleSelectionChange(selected: boolean) {
    if (selected) {
      emit('select', props.material.id)
    }
  }

  function handlePreview() {
    emit('preview', props.material)
  }

  function handleDownload() {
    emit('download', props.material)
  }

  function handleEdit() {
    emit('edit', props.material)
  }
</script>

<style scoped lang="scss">
  .art-material-card {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
      transform: translateY(-2px);
    }

    &--selected {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
    }

    &--loading {
      pointer-events: none;
      opacity: 0.7;
    }

    &__selection {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 2;
      padding: 4px;
      background: rgb(255 255 255 / 90%);
      border-radius: 4px;
    }

    &__type {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2;
    }

    &__content {
      padding: 16px;
    }

    &__title {
      margin: 0 0 8px;
      overflow: hidden;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      margin-top: 12px;
      border-top: 1px solid var(--el-border-color-lighter);
    }

    &__source {
      display: flex;
      flex: 1;
      gap: 4px;
      align-items: center;
      min-width: 0;
      font-size: 12px;
      color: var(--el-text-color-secondary);

      .el-icon {
        flex-shrink: 0;
        font-size: 14px;
      }
    }

    &__source-link {
      flex: 1;
      overflow: hidden;
      color: var(--el-color-primary);
      text-decoration: none;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 0.3s ease;

      &:hover {
        color: var(--el-color-primary-light-3);
        text-decoration: underline;
      }
    }

    &__summary {
      display: -webkit-box;
      margin: 0 0 12px;
      overflow: hidden;
      font-size: 14px;
      line-height: 1.5;
      color: var(--el-text-color-regular);
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    &__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 12px;
    }

    &__tag {
      font-size: 11px;
    }

    &__actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    &__overlay {
      position: absolute;
      inset: 0;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgb(255 255 255 / 80%);

      .el-icon {
        font-size: 24px;
        color: var(--el-color-primary);
      }
    }
  }

  @media (width <= 768px) {
    .art-material-card {
      &__content {
        padding: 12px;
      }

      &__title {
        font-size: 14px;
      }

      &__summary {
        font-size: 12px;
        -webkit-line-clamp: 1;
      }

      &__footer {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }

      &__source {
        width: 100%;
      }

      &__actions {
        flex-direction: row;
        gap: 8px;
        width: 100%;

        .el-button {
          flex: 1;
        }
      }
    }
  }
</style>
