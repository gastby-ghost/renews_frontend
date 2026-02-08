<template>
  <div class="material-preview-content">
    <div class="material-preview__content-grid">
      <!-- 左侧主要内容 -->
      <div class="material-preview__main-content">
        <!-- 摘要信息 -->
        <div class="material-preview__section" v-if="material.summary">
          <h3 class="material-preview__section-title">
            <el-icon class="material-preview__section-icon"><Document /></el-icon>
            内容摘要
          </h3>
          <div class="material-preview__summary">
            {{ material.summary }}
          </div>
        </div>

        <!-- 标签信息 -->
        <div class="material-preview__section" v-if="material.tags && material.tags.length > 0">
          <h3 class="material-preview__section-title">
            <el-icon class="material-preview__section-icon"><CollectionTag /></el-icon>
            标签
          </h3>
          <div class="material-preview__tags">
            <el-tag
              v-for="tag in material.tags"
              :key="tag"
              size="default"
              class="material-preview__tag"
              effect="light"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <!-- 搜索结果特有信息 -->
        <template v-if="isSearchResult">
          <!-- 关键摘录 -->
          <div
            class="material-preview__section"
            v-if="material.key_excerpts && material.key_excerpts.length > 0"
          >
            <h3 class="material-preview__section-title">
              <el-icon class="material-preview__section-icon"><Document /></el-icon>
              关键摘录
            </h3>
            <div class="material-preview__excerpts-container">
              <ul class="material-preview__excerpts">
                <li v-for="(excerpt, index) in material.key_excerpts" :key="index">
                  {{ excerpt }}
                </li>
              </ul>
            </div>
          </div>
        </template>
      </div>

      <!-- 右侧信息面板 -->
      <div class="material-preview__side-panel">
        <!-- 基本信息 -->
        <div class="material-preview__info-card">
          <h3 class="material-preview__info-card-title">
            <el-icon class="material-preview__section-icon"><InfoFilled /></el-icon>
            基本信息
          </h3>
          <div class="material-preview__info-list">
            <div class="material-preview__info-item" v-if="material.url">
              <div class="material-preview__info-label">链接</div>
              <div class="material-preview__info-value">
                <a :href="material.url" target="_blank" class="material-preview__link">
                  {{ formatUrl(material.url) }}
                  <el-icon><Link /></el-icon>
                </a>
              </div>
            </div>
            <div class="material-preview__info-item" v-if="material.createdAt">
              <div class="material-preview__info-label">创建时间</div>
              <div class="material-preview__info-value">
                {{ formatDate(material.createdAt) }}
              </div>
            </div>
            <div class="material-preview__info-item" v-if="material.updatedAt">
              <div class="material-preview__info-label">更新时间</div>
              <div class="material-preview__info-value">
                {{ formatDate(material.updatedAt) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 搜索结果特有信息 -->
        <template v-if="isSearchResult">
          <!-- 匹配度评分 -->
          <div class="material-preview__info-card" v-if="hasScore">
            <h3 class="material-preview__info-card-title">
              <el-icon class="material-preview__section-icon"><Star /></el-icon>
              匹配度评分
            </h3>
            <div class="material-preview__score-container">
              <el-rate
                v-model="scoreRating"
                disabled
                show-score
                text-color="#ff9900"
                :max="5"
                size="large"
              />
              <div class="material-preview__score-details">
                <span class="material-preview__score-text">
                  原始评分：{{ (material as Material).score?.toFixed(3) }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Link, Document, CollectionTag, InfoFilled, Star } from '@element-plus/icons-vue'
  import type { Material } from '@/types/material'

  interface Props {
    material: Material
  }

  const props = defineProps<Props>()

  // 判断是否为搜索结果
  const isSearchResult = computed(() => {
    return props.material && 'score' in props.material
  })

  // 判断是否有评分
  const hasScore = computed(() => {
    return isSearchResult.value && typeof props.material.score === 'number'
  })

  // 评分转换
  const scoreRating = computed(() => {
    if (!hasScore.value) return 0
    return Math.max(1, Math.round(props.material.score * 5))
  })

  // 格式化日期
  function formatDate(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return String(date)
    }
  }

  // 格式化URL显示
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
  .material-preview-content {
    padding: 24px;
    overflow-y: auto;
  }

  .material-preview__content-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 32px;
    height: 100%;
  }

  .material-preview__main-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .material-preview__side-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .material-preview__section {
    position: relative;
  }

  .material-preview__section-title {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 16px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .material-preview__section-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }

  .material-preview__summary {
    padding: 20px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-text-color-regular);
    white-space: pre-wrap;
    background: var(--el-fill-color-light);
    border-left: 4px solid var(--el-color-primary);
    border-radius: 8px;
  }

  .material-preview__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .material-preview__tag {
    padding: 4px 12px;
    font-size: 13px;
    border-radius: 16px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
      transform: translateY(-1px);
    }
  }

  .material-preview__excerpts-container {
    padding: 20px;
    background: var(--el-fill-color-light);
    border-left: 4px solid var(--el-color-warning);
    border-radius: 8px;
  }

  .material-preview__excerpts {
    padding-left: 16px;
    margin: 0;

    li {
      position: relative;
      margin-bottom: 12px;
      line-height: 1.6;
      color: var(--el-text-color-regular);

      &:last-child {
        margin-bottom: 0;
      }

      &::marker {
        color: var(--el-color-warning);
      }
    }
  }

  .material-preview__info-card {
    padding: 20px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-border-color);
      box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
    }
  }

  .material-preview__info-card-title {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .material-preview__info-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .material-preview__info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .material-preview__info-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .material-preview__info-value {
    font-size: 14px;
    color: var(--el-text-color-primary);
    word-break: break-word;
  }

  .material-preview__link {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 4px 8px;
    color: var(--el-color-primary);
    text-decoration: none;
    border-radius: 4px;
    transition: all 0.3s ease;

    &:hover {
      color: var(--el-color-primary-light-3);
      text-decoration: none;
      background: var(--el-color-primary-light-9);
    }
  }

  .material-preview__score-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .material-preview__score-details {
    text-align: center;
  }

  .material-preview__score-text {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  @media (width <= 1200px) {
    .material-preview__content-grid {
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .material-preview__side-panel {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
  }

  @media (width <= 768px) {
    .material-preview-content {
      padding: 16px;
    }

    .material-preview__content-grid {
      gap: 20px;
    }

    .material-preview__side-panel {
      grid-template-columns: 1fr;
    }

    .material-preview__summary,
    .material-preview__excerpts-container,
    .material-preview__info-card {
      padding: 16px;
    }

    .material-preview__section-title {
      font-size: 15px;
    }
  }
</style>
