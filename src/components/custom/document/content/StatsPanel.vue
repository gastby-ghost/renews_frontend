<template>
  <div class="stats-panel art-card" :class="{ 'stats-collapsed': !showStats }">
    <div class="panel-header">
      <el-button @click="toggleStats" size="small" text>
        <el-icon><DataAnalysis /></el-icon>
        <span v-if="showStats">统计</span>
      </el-button>
    </div>

    <el-collapse-transition>
      <div v-show="showStats" class="stats-content">
        <!-- 基础统计 -->
        <div class="stats-section">
          <h4>基础信息</h4>
          <div class="stat-item">
            <span class="stat-label">总字符数</span>
            <span class="stat-value">{{ stats.characters }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">字符数（无空格）</span>
            <span class="stat-value">{{ stats.charactersNoSpaces }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">单词数</span>
            <span class="stat-value">{{ stats.words }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">段落数</span>
            <span class="stat-value">{{ stats.paragraphs }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">句子数</span>
            <span class="stat-value">{{ stats.sentences }}</span>
          </div>
        </div>

        <!-- 结构统计 -->
        <div class="stats-section">
          <h4>文档结构</h4>
          <div class="stat-item">
            <span class="stat-label">标题数量</span>
            <span class="stat-value">{{ stats.headings }}</span>
          </div>
          <div class="stat-item" v-for="(count, level) in stats.headingsByLevel" :key="level">
            <span class="stat-label">H{{ level }}</span>
            <span class="stat-value">{{ count }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">链接数量</span>
            <span class="stat-value">{{ stats.links }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">图片数量</span>
            <span class="stat-value">{{ stats.images }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">代码块</span>
            <span class="stat-value">{{ stats.codeBlocks }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">列表项</span>
            <span class="stat-value">{{ stats.listItems }}</span>
          </div>
        </div>

        <!-- 可读性分析 -->
        <div class="stats-section">
          <h4>可读性分析</h4>
          <div class="stat-item">
            <span class="stat-label">平均句子长度</span>
            <span class="stat-value">{{ stats.avgSentenceLength }} 词</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均段落长度</span>
            <span class="stat-value">{{ stats.avgParagraphLength }} 词</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">可读性分数</span>
            <el-tag :type="getReadabilityTagType(stats.readabilityScore)" size="small">
              {{ stats.readabilityScore }}
            </el-tag>
          </div>
          <div class="readability-desc">
            {{ getReadabilityDesc(stats.readabilityScore) }}
          </div>
        </div>

        <!-- AI 建议 -->
        <div class="stats-section">
          <h4>AI 建议</h4>
          <div v-if="aiSuggestions.length > 0" class="suggestion-list">
            <div v-for="(suggestion, index) in aiSuggestions" :key="index" class="suggestion-item">
              <el-icon><InfoFilled /></el-icon>
              <span>{{ suggestion }}</span>
            </div>
          </div>
          <div v-else class="no-suggestions">
            <el-icon><Check /></el-icon>
            文档质量良好，暂无建议
          </div>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
  import { DataAnalysis, InfoFilled, Check } from '@element-plus/icons-vue'

  interface Stats {
    characters: number
    charactersNoSpaces: number
    words: number
    paragraphs: number
    sentences: number
    headings: number
    headingsByLevel: Record<string, number>
    links: number
    images: number
    codeBlocks: number
    listItems: number
    avgSentenceLength: number
    avgParagraphLength: number
    readabilityScore: number
  }

  interface Props {
    showStats: boolean
    stats: Stats
    aiSuggestions: string[]
  }

  interface Emits {
    (e: 'toggle-stats'): void
  }

  defineProps<Props>()
  defineEmits<Emits>()

  const getReadabilityTagType = (score: number) => {
    if (score >= 70) return 'success'
    if (score >= 50) return 'warning'
    return 'danger'
  }

  const getReadabilityDesc = (score: number) => {
    if (score >= 70) return '优秀 - 易于阅读和理解'
    if (score >= 50) return '良好 - 基本符合阅读习惯'
    return '较差 - 建议优化语言表达'
  }
</script>

<style scoped lang="scss">
  .stats-panel {
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: 6px;
    box-shadow: var(--art-box-shadow-sm);
    transition: all 0.3s ease;

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      background: var(--el-fill-color-light);
      border-bottom: 1px solid var(--art-border-color);
      transition: all 0.3s ease;

      .el-button {
        justify-content: center;
        width: 100%;
        padding: 6px 8px;
        font-size: 12px;

        .el-icon {
          font-size: 14px;
        }
      }
    }

    &.stats-collapsed {
      .panel-header {
        min-height: 40px;
        padding: 8px 6px;

        .el-button {
          width: auto;
          padding: 4px 6px;

          span:not(:first-child) {
            display: none;
          }
        }
      }

      .stats-content {
        padding: 0;
      }
    }
  }

  .stats-content {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    transition: padding 0.3s ease;
  }

  .stats-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    h4 {
      display: flex;
      gap: 8px;
      align-items: center;
      padding-bottom: 8px;
      margin: 0 0 16px;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      border-bottom: 1px solid var(--art-border-dashed-color);

      &::before {
        display: inline-block;
        width: 3px;
        height: 16px;
        content: '';
        background: var(--el-color-primary);
        border-radius: 2px;
      }
    }
  }

  .stat-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--art-border-dashed-color);
    transition: all 0.3s ease;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      padding-right: 8px;
      padding-left: 8px;
      background: var(--el-fill-color-light);
      border-radius: 4px;
    }
  }

  .stat-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-regular);
  }

  .stat-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .readability-desc {
    padding: 12px;
    margin-top: 12px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-left: 3px solid var(--el-color-success);
    border-radius: 6px;
  }

  .suggestion-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .suggestion-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-fill-color);
      border-color: var(--el-color-primary-light-7);
      transform: translateY(-1px);
    }

    .el-icon {
      margin-top: 2px;
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  .no-suggestions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    padding: 24px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    background: var(--el-color-success-light-9);
    border: 1px solid var(--el-color-success-light-7);
    border-radius: 8px;

    .el-icon {
      font-size: 28px;
      color: var(--el-color-success);
    }
  }

  @media (width <= 900px) {
    .stats-panel.stats-collapsed {
      .panel-header {
        justify-content: flex-start;
        padding: 12px;

        .el-button {
          width: 100%;
          padding: 8px 12px;
          font-size: 14px;

          span:not(:first-child) {
            display: inline;
          }
        }
      }
    }
  }

  @media (width <= 600px) {
    .stats-panel .stats-content {
      padding: 8px;
    }

    .stats-section {
      margin-bottom: 16px;
    }

    .stats-section h4 {
      margin-bottom: 12px;
      font-size: 13px;
    }

    .stat-item {
      padding: 6px 0;
      font-size: 12px;
    }

    .stat-label {
      font-size: 11px;
    }

    .stat-value {
      font-size: 12px;
    }
  }
</style>
