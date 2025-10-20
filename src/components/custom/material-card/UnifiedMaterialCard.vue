<template>
  <div
    class="unified-material-card"
    :class="{
      'unified-material-card--selected': isSelected,
      'unified-material-card--loading': loading,
      'unified-material-card--search': context === 'search',
      'unified-material-card--management': context === 'management'
    }"
    @click="handleClick"
  >
    <!-- 顶部区域：选择框和匹配度评分 -->
    <div class="unified-material-card__header">
      <div class="unified-material-card__selection" v-if="showSelection">
        <el-checkbox
          :model-value="isSelected"
          @change="() => handleSelectionChange()"
          @click.stop
          size="large"
        />
      </div>

      <div class="unified-material-card__score" v-if="showScore && hasScore">
        <div class="unified-material-card__score-label">匹配度</div>
        <div class="unified-material-card__score-value">
          <el-rate
            v-model="scoreRating"
            disabled
            show-score
            text-color="#ff9900"
            :max="5"
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="unified-material-card__content">
      <!-- 标题 -->
      <h3 class="unified-material-card__title" :title="displayTitle">
        {{ displayTitle }}
      </h3>

      <!-- 摘要 -->
      <p class="unified-material-card__summary" v-if="material.summary">
        {{ material.summary }}
      </p>

      <!-- URL链接 -->
      <div class="unified-material-card__url" v-if="material.url">
        <el-icon><Link /></el-icon>
        <a
          :href="material.url"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
          class="unified-material-card__url-link"
        >
          {{ formatUrl(material.url) }}
        </a>
      </div>
    </div>

    <!-- 底部区域：标签和操作按钮 -->
    <div class="unified-material-card__footer">
      <div class="unified-material-card__tags" v-if="material.tags && material.tags.length > 0">
        <el-tag
          v-for="tag in material.tags.slice(0, 3)"
          :key="tag"
          size="small"
          class="unified-material-card__tag"
        >
          {{ tag }}
        </el-tag>
        <el-tag v-if="material.tags.length > 3" size="small" type="info">
          +{{ material.tags.length - 3 }}
        </el-tag>
      </div>

      <div class="unified-material-card__actions">
        <el-button size="small" type="primary" @click.stop="handlePreview"> 预览 </el-button>
      </div>
    </div>

    <!-- 加载遮罩 -->
    <div class="unified-material-card__overlay" v-if="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { Material, SearchResultMaterial } from '@/types/material'
  import { Link, Loading } from '@element-plus/icons-vue'

  // 联合类型，支持两种素材类型
  type UnifiedMaterial = Material | SearchResultMaterial

  interface Props {
    material: UnifiedMaterial
    selected?: boolean
    loading?: boolean
    showSelection?: boolean
    showScore?: boolean
    context: 'search' | 'management'
  }

  interface Emits {
    (e: 'select', id: string): void
    (e: 'preview', material: UnifiedMaterial): void
    (e: 'edit', material: UnifiedMaterial): void
    (e: 'click', material: UnifiedMaterial): void
  }

  const props = withDefaults(defineProps<Props>(), {
    selected: false,
    loading: false,
    showSelection: true,
    showScore: false
  })

  const emit = defineEmits<Emits>()

  const isSelected = computed(() => props.selected)

  // 判断是否有评分
  const hasScore = computed(() => {
    return 'score' in props.material && typeof props.material.score === 'number'
  })

  // 将0-1的评分转换为1-5的星级评分
  const scoreRating = computed(() => {
    if (!hasScore.value) return 0
    // 将0-1的评分映射到1-5的星级
    return Math.max(1, Math.round((props.material as SearchResultMaterial).score * 5))
  })

  // 显示标题（优先使用AI标题）
  const displayTitle = computed(() => {
    if ('aititle' in props.material && props.material.aititle) {
      return props.material.aititle
    }
    return props.material.title
  })

  function handleClick() {
    emit('click', props.material)
  }

  function handleSelectionChange() {
    emit('select', props.material.id)
  }

  function handlePreview() {
    emit('preview', props.material)
  }

  function formatUrl(url: string): string {
    if (!url) return ''
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }
</script>

<style scoped lang="scss">
  .unified-material-card {
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

    &--search {
      // 搜索结果界面特有样式
      .unified-material-card__header {
        padding: 12px 16px 8px;
      }
    }

    &--management {
      // 素材管理界面特有样式
      .unified-material-card__header {
        padding: 8px 16px 4px;
      }
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &__selection {
      flex-shrink: 0;
    }

    &__score {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-end;
      min-width: 120px;
    }

    &__score-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    &__score-value {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      width: 100%;
    }

    &__content {
      padding: 0 16px 12px;
    }

    &__title {
      display: -webkit-box;
      margin: 0 0 8px;
      overflow: hidden;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    &__summary {
      display: -webkit-box;
      margin: 0 0 12px;
      overflow: hidden;
      font-size: 14px;
      line-height: 1.5;
      color: var(--el-text-color-regular);
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    &__url {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-bottom: 8px;
    }

    &__url-link {
      flex: 1;
      overflow: hidden;
      font-size: 13px;
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

    &__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px 12px;
    }

    &__tags {
      display: flex;
      flex: 1;
      flex-wrap: wrap;
      gap: 4px;
    }

    &__tag {
      font-size: 11px;
    }

    &__actions {
      display: flex;
      flex-shrink: 0;
      gap: 8px;
      align-items: center;
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
    .unified-material-card {
      &__header {
        padding: 10px 12px 6px;
      }

      &__content {
        padding: 0 12px 10px;
      }

      &__title {
        font-size: 14px;
      }

      &__summary {
        font-size: 13px;
        -webkit-line-clamp: 2;
      }

      &__footer {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
        padding: 6px 12px 10px;
      }

      &__tags {
        width: 100%;
      }

      &__actions {
        justify-content: flex-end;
        width: 100%;
      }

      &__details {
        padding: 0 12px 12px;
      }

      &__score {
        min-width: 100px;
      }
    }
  }
</style>
