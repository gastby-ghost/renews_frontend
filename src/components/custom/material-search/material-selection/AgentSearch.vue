<template>
  <div class="agent-search">
    <el-form :model="form" label-width="100px">
      <el-form-item label="研究简报">
        <el-input
          v-model="form.brief"
          type="textarea"
          :rows="4"
          placeholder="请输入研究简报，描述您想要研究的主题、领域或具体问题"
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch" :loading="loading">
          开始Agent检索
        </el-button>
      </el-form-item>
    </el-form>

    <div v-if="loading" class="agent-progress">
      <el-progress
        :percentage="progressPercentage"
        :status="stage === 'completed' ? 'success' : undefined"
      />
      <p class="progress-text">{{ progressMessage || '正在检索素材，请稍候...' }}</p>
    </div>

    <div v-if="results.length > 0" class="search-results">
      <div class="results-header">
        <span>检索结果 ({{ results.length }})</span>
      </div>
      <div class="materials-grid">
        <el-card
          v-for="material in results"
          :key="material.id"
          class="material-item"
          shadow="hover"
        >
          <div class="material-content">
            <div class="material-header">
              <h4>{{ material.title }}</h4>
              <el-button
                v-if="!isSelected(material.id)"
                text
                type="primary"
                size="small"
                @click="$emit('add', material)"
              >
                <el-icon><Plus /></el-icon>
                添加
              </el-button>
              <el-tag v-else type="success" size="small">已添加</el-tag>
            </div>
            <p class="material-summary">{{ material.summary }}</p>
            <div class="material-tags">
              <el-tag v-for="tag in material.tags.slice(0, 3)" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <div v-if="!loading && results.length === 0 && !hasSearched" class="empty-state">
      <el-empty description="输入研究简报，使用AI智能检索相关素材">
        <template #image>
          <el-icon size="64"><Cpu /></el-icon>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed } from 'vue'
  import { Cpu, Plus } from '@element-plus/icons-vue'
  import type { Material } from '@/types/material'

  interface Props {
    loading: boolean
    results: Material[]
    selectedIds: string[]
    progress: {
      current?: number
      total?: number
      stage?: string
      message?: string
    }
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    search: [brief: string]
    add: [material: Material]
  }>()

  const form = reactive({
    brief: ''
  })

  const hasSearched = ref(false)

  const isSelected = (materialId: string) => {
    return props.selectedIds.includes(materialId)
  }

  const progressPercentage = computed(() => {
    const { current, total } = props.progress
    if (current && total) {
      return Math.round((current / total) * 100)
    }
    return 0
  })

  const progressMessage = computed(() => props.progress.message)

  const handleSearch = () => {
    if (!form.brief.trim()) {
      return
    }
    hasSearched.value = true
    emit('search', form.brief)
  }
</script>

<style scoped lang="scss">
  .agent-search {
    .agent-progress {
      padding: 20px;
      text-align: center;

      .progress-text {
        margin: 12px 0 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    .search-results {
      margin-top: 20px;

      .results-header {
        margin-bottom: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .materials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
    }

    .material-item {
      .material-content {
        .material-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;

          h4 {
            flex: 1;
            margin: 0;
            font-size: 15px;
            font-weight: 600;
            line-height: 1.4;
            color: var(--el-text-color-primary);
          }
        }

        .material-summary {
          display: -webkit-box;
          margin: 0 0 12px;
          overflow: hidden;
          font-size: 13px;
          line-height: 1.5;
          color: var(--el-text-color-regular);
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .material-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
      }
    }

    .empty-state {
      padding: 40px;
      text-align: center;
    }
  }

  @media (width <= 768px) {
    .agent-search {
      .search-results {
        .materials-grid {
          grid-template-columns: 1fr;
        }
      }
    }
  }
</style>
