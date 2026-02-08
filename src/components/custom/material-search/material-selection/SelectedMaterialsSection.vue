<template>
  <div class="selected-materials-section">
    <el-card class="selected-materials-card">
      <template #header>
        <div class="section-header">
          <div class="section-title">
            <el-icon><Collection /></el-icon>
            <span>已选素材 ({{ materials.length }})</span>
          </div>
          <div class="section-actions">
            <el-button
              type="primary"
              size="small"
              :disabled="materials.length === 0"
              @click="$emit('generate')"
              :loading="loading"
            >
              <el-icon><MagicStick /></el-icon>
              基于素材生成标题
            </el-button>
            <el-button size="small" :disabled="materials.length === 0" @click="$emit('clear')">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="materials.length > 0" class="selected-materials-list">
        <div class="materials-grid">
          <el-card
            v-for="material in materials"
            :key="material.id"
            class="material-item"
            shadow="hover"
          >
            <div class="material-content">
              <div class="material-header">
                <h4>{{ material.title }}</h4>
                <el-button text type="danger" size="small" @click="$emit('remove', material.id)">
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
              <p class="material-summary">{{ material.summary }}</p>
              <div class="material-tags">
                <el-tag
                  v-for="tag in material.tags.slice(0, 3)"
                  :key="tag"
                  size="small"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <div v-else class="empty-state">
        <el-empty description="暂无已选素材，请从下方素材库或检索中添加">
          <template #image>
            <el-icon size="64"><Collection /></el-icon>
          </template>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { Collection, MagicStick, Delete, Close } from '@element-plus/icons-vue'
  import type { Material } from '@/types/material'

  interface Props {
    materials: Material[]
    loading: boolean
  }

  defineProps<Props>()

  defineEmits<{
    remove: [materialId: string]
    clear: []
    generate: []
  }>()
</script>

<style scoped lang="scss">
  .selected-materials-section {
    margin-bottom: 30px;

    .selected-materials-card {
      min-height: 200px;
    }

    .selected-materials-list {
      .materials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
    }

    .empty-state {
      padding: 40px;
      text-align: center;
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .section-title {
      display: flex;
      gap: 8px;
      align-items: center;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .el-icon {
        color: var(--el-color-primary);
      }
    }

    .section-actions {
      display: flex;
      gap: 8px;
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

  @media (width <= 1200px) {
    .materials-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }

  @media (width <= 768px) {
    .materials-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
