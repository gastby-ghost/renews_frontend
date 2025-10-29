<template>
  <div class="title-card" :class="{ selected: isSelected }" @click="$emit('select', title)">
    <div class="title-header">
      <div class="title-content">
        <h4>{{ title.title }}</h4>
        <div class="title-score">
          <span class="score-label">评分: </span>
          <el-rate :value="score" disabled show-score text-color="#ff9900" :max="5" />
        </div>
      </div>
      <div class="title-selection">
        <el-radio :model-value="isSelected" :value="true" @change="$emit('select', title)">
          {{ isSelected ? '已选择' : '选择' }}
        </el-radio>
      </div>
    </div>

    <div class="title-analysis">
      <div class="analysis-item"><strong>角度：</strong> {{ title.angle }}</div>
      <div class="analysis-item"><strong>时效性：</strong> {{ title.why_now }}</div>
      <div class="analysis-item"><strong>可行性：</strong> {{ title.feasibility }}</div>
    </div>

    <div class="title-keywords">
      <span class="keyword-label">新闻价值：</span>
      <el-tag
        v-for="value in title.news_values"
        :key="value"
        size="small"
        type="info"
        effect="plain"
      >
        {{ value }}
      </el-tag>
    </div>

    <div class="title-advantages">
      <h5>优势分析：</h5>
      <ul>
        <li v-for="(advantage, index) in suggestions" :key="index">
          {{ advantage }}
        </li>
      </ul>
    </div>

    <div v-if="materials && materials.length > 0" class="title-materials">
      <h5>相关素材 ({{ materials.length }})：</h5>
      <div class="materials-list">
        <el-tag
          v-for="material in materials.slice(0, 3)"
          :key="material.id"
          size="small"
          type="success"
          effect="plain"
        >
          {{ material.title }}
        </el-tag>
        <el-tag v-if="materials.length > 3" size="small" type="info">
          +{{ materials.length - 3 }} 更多
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Title } from '@/types/ai'
  import type { Material } from '@/types/material'

  interface Props {
    title: Title
    isSelected?: boolean
    score?: number
    suggestions?: string[]
    materials?: Material[]
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _props = withDefaults(defineProps<Props>(), {
    isSelected: false,
    score: 0,
    suggestions: () => [],
    materials: () => []
  })

  defineEmits<{
    select: [title: Title]
  }>()
</script>

<style scoped lang="scss">
  .title-card {
    padding: 20px;
    cursor: pointer;
    border: 2px solid var(--el-border-color);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    }

    &.selected {
      background: var(--el-color-success-light-9);
      border-color: var(--el-color-success);
    }
  }

  .title-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 15px;

    .title-content {
      flex: 1;

      h4 {
        margin: 0 0 8px;
        font-size: 16px;
        line-height: 1.4;
        color: var(--el-text-color-primary);
      }
    }

    .title-selection {
      margin-left: 15px;
    }
  }

  .title-analysis {
    margin-bottom: 15px;

    .analysis-item {
      margin-bottom: 5px;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .title-keywords {
    margin-bottom: 15px;

    .keyword-label {
      margin-right: 8px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .title-advantages {
    h5 {
      margin: 0 0 8px;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    ul {
      padding-left: 20px;
      margin: 0;

      li {
        margin-bottom: 4px;
        font-size: 13px;
        color: var(--el-text-color-regular);

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  .title-materials {
    padding-top: 15px;
    margin-top: 15px;
    border-top: 1px solid var(--el-border-color-lighter);

    h5 {
      margin: 0 0 8px;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    .materials-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }

  .score-label {
    margin-right: 8px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
</style>
