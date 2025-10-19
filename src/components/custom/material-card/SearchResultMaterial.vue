<template>
  <div
    class="search-result-material"
    :class="{
      'search-result-material--selected': isSelected,
      'search-result-material--loading': loading
    }"
    @click="handleClick"
  >
    <!-- 顶部区域：选择框和相关性评分 -->
    <div class="search-result-material__header">
      <div class="search-result-material__selection" v-if="showSelection">
        <el-checkbox
          :model-value="isSelected"
          @change="() => handleSelectionChange()"
          @click.stop
          size="large"
        />
      </div>

      <div class="search-result-material__score">
        <div class="search-result-material__score-label">匹配度</div>
        <div class="search-result-material__score-value">
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
    <div class="search-result-material__content">
      <!-- AI标题 -->
      <h3 class="search-result-material__title" :title="material.aititle || material.title">
        {{ material.aititle || material.title }}
      </h3>

      <!-- AI摘要 -->
      <p class="search-result-material__summary" v-if="material.summary">
        {{ material.summary }}
      </p>

      <!-- URL链接 -->
      <div class="search-result-material__url">
        <el-icon><Link /></el-icon>
        <a
          :href="material.url"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
          class="search-result-material__url-link"
        >
          {{ formatUrl(material.url) }}
        </a>
      </div>
    </div>

    <!-- 底部区域：标签和展开按钮 -->
    <div class="search-result-material__footer">
      <div class="search-result-material__tags" v-if="material.tags && material.tags.length > 0">
        <el-tag
          v-for="tag in material.tags.slice(0, 3)"
          :key="tag"
          size="small"
          class="search-result-material__tag"
        >
          {{ tag }}
        </el-tag>
        <el-tag v-if="material.tags.length > 3" size="small" type="info">
          +{{ material.tags.length - 3 }}
        </el-tag>
      </div>

      <div class="search-result-material__actions">
        <el-button
          size="small"
          text
          @click.stop="toggleDetails"
          class="search-result-material__expand-btn"
        >
          {{ showDetails ? '收起详情' : '展开详情' }}
          <el-icon
            class="search-result-material__expand-icon"
            :class="{ 'is-expanded': showDetails }"
          >
            <ArrowDown />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 可折叠区域 -->
    <el-collapse-transition>
      <div v-show="showDetails" class="search-result-material__details">
        <div
          class="search-result-material__detail-section"
          v-if="material.key_excerpts && material.key_excerpts.length > 0"
        >
          <h4 class="search-result-material__detail-title">关键摘录</h4>
          <ul class="search-result-material__excerpts">
            <li v-for="(excerpt, index) in material.key_excerpts" :key="index">
              {{ excerpt }}
            </li>
          </ul>
        </div>

        <div class="search-result-material__detail-section" v-if="material.published_date">
          <h4 class="search-result-material__detail-title">发布日期</h4>
          <p class="search-result-material__detail-content">{{
            formatDate(material.published_date)
          }}</p>
        </div>

        <div class="search-result-material__detail-section" v-if="material.query">
          <h4 class="search-result-material__detail-title">搜索查询</h4>
          <p class="search-result-material__detail-content">{{ material.query }}</p>
        </div>

        <div
          class="search-result-material__detail-section"
          v-if="material.webtitle && material.webtitle !== material.title"
        >
          <h4 class="search-result-material__detail-title">原始标题</h4>
          <p class="search-result-material__detail-content">{{ material.webtitle }}</p>
        </div>
      </div>
    </el-collapse-transition>

    <!-- 加载遮罩 -->
    <div class="search-result-material__overlay" v-if="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import type { SearchResultMaterial } from '@/types/material'
  import { Link, Loading, ArrowDown } from '@element-plus/icons-vue'

  interface Props {
    material: SearchResultMaterial
    selected?: boolean
    loading?: boolean
    showSelection?: boolean
  }

  interface Emits {
    (e: 'select', id: string): void
    (e: 'click', material: SearchResultMaterial): void
  }

  const props = withDefaults(defineProps<Props>(), {
    selected: false,
    loading: false,
    showSelection: true
  })

  const emit = defineEmits<Emits>()

  const showDetails = ref(false)

  const isSelected = computed(() => props.selected)

  // 将0-1的评分转换为1-5的星级评分
  const scoreRating = computed(() => {
    // 将0-1的评分映射到1-5的星级
    return Math.max(1, Math.round(props.material.score * 5))
  })

  function handleClick() {
    emit('click', props.material)
  }

  function handleSelectionChange() {
    emit('select', props.material.id)
  }

  function toggleDetails() {
    showDetails.value = !showDetails.value
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

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }
</script>

<style scoped lang="scss">
  .search-result-material {
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

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 8px;
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
      flex-shrink: 0;
    }

    &__expand-btn {
      padding: 0;
      font-size: 12px;
    }

    &__expand-icon {
      margin-left: 4px;
      transition: transform 0.3s ease;

      &.is-expanded {
        transform: rotate(180deg);
      }
    }

    &__details {
      padding: 0 16px 16px;
      background: var(--el-fill-color-lighter);
      border-top: 1px solid var(--el-border-color-lighter);
    }

    &__detail-section {
      margin-top: 12px;

      &:first-child {
        margin-top: 12px;
      }
    }

    &__detail-title {
      margin: 0 0 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__detail-content {
      margin: 0;
      font-size: 13px;
      line-height: 1.4;
      color: var(--el-text-color-regular);
    }

    &__excerpts {
      padding-left: 16px;
      margin: 0;
    }

    &__excerpts li {
      margin-bottom: 6px;
      font-size: 13px;
      line-height: 1.4;
      color: var(--el-text-color-regular);

      &:last-child {
        margin-bottom: 0;
      }
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
    .search-result-material {
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
        width: 100%;
        text-align: right;
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
