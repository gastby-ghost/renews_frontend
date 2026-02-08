<template>
  <div class="requirements-section">
    <div class="section-header">
      <h3>需求定义</h3>
      <div class="section-actions">
        <el-button
          v-if="hasScopeTask"
          type="warning"
          size="small"
          :loading="isExecutingScope"
          @click="$emit('cancel-scope-task')"
        >
          取消搜索任务
        </el-button>
        <el-button
          type="primary"
          size="small"
          :loading="isGeneratingBriefing"
          :disabled="!canGenerateBriefing || isGeneratingBriefing"
          @click="$emit('generate-briefing')"
        >
          <el-icon v-if="!isGeneratingBriefing"><Edit /></el-icon>
          {{ isGeneratingBriefing ? '生成中...' : 'AI生成简报' }}
        </el-button>
      </div>
    </div>

    <!-- 搜索任务进度条 -->
    <div v-if="hasScopeTask && taskProgress" class="task-progress">
      <div class="progress-header">
        <span class="progress-label">{{ taskStatusText }}</span>
        <el-button type="text" size="small" @click="$emit('cancel-scope-task')"> 取消 </el-button>
      </div>
      <el-progress :percentage="taskProgress" :status="scopeTaskStatus" />
      <div class="progress-detail">
        <span v-if="scopeTaskStatus === 'exception'">任务执行失败，请重试</span>
      </div>
    </div>

    <!-- 需求表单 -->
    <el-form :model="localForm" label-position="top" class="requirements-form">
      <el-form-item label="选题" required>
        <el-input
          v-model="localForm.topic"
          type="textarea"
          :rows="2"
          placeholder="请输入您想要撰写的选题方向，如：新能源汽车市场分析"
          maxlength="200"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="关键点">
        <div class="key-points-container">
          <div class="key-points-list">
            <el-tag
              v-for="(point, index) in localForm.keyPoints"
              :key="index"
              closable
              size="large"
              class="key-point-tag"
              @close="$emit('remove-key-point', index)"
            >
              {{ point }}
            </el-tag>
          </div>
          <div class="add-key-point">
            <el-input
              v-model="newKeyPoint"
              placeholder="添加关键点"
              size="default"
              @keyup.enter="handleAddKeyPoint"
              @blur="handleAddKeyPoint"
            />
            <el-button type="primary" size="default" @click="handleAddKeyPoint"> 添加 </el-button>
          </div>
        </div>
        <div class="form-tip">
          <span class="tip-text">输入关键点后按回车或点击添加按钮，每个关键点会被搜索多个素材</span>
        </div>
      </el-form-item>

      <el-form-item label="特殊要求">
        <el-input
          v-model="localForm.specialRequirements"
          type="textarea"
          :rows="3"
          placeholder="请输入对文章的特殊要求，如：需要包含数据对比、注重时效性等"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <!-- 研究简报展示区 -->
    <div v-if="researchBrief" class="research-brief">
      <div class="brief-header">
        <h4>AI生成的研究简报</h4>
        <el-button type="primary" link @click="$emit('edit-briefing')">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
      </div>
      <div class="brief-content">
        <el-input
          v-model="editableBriefing"
          type="textarea"
          :rows="8"
          placeholder="请输入研究简报内容..."
          maxlength="5000"
          show-word-limit
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import { Edit } from '@element-plus/icons-vue'

  /**
   * RequirementsSection Props
   * @description 需求定义区域组件 props
   */
  interface FormData {
    topic: string
    keyPoints: string[]
    specialRequirements: string
  }

  interface Props {
    form: FormData
    currentKeyPoint: string
    canGenerateBriefing: boolean
    hasScopeTask: boolean
    scopeTaskStatus: '' | 'success' | 'exception'
    taskProgress: number
    taskStatusText: string
    isGeneratingBriefing: boolean
    isExecutingScope: boolean
    researchBrief: string
  }

  const props = defineProps<Props>()

  interface Emits {
    (e: 'update:current-key-point', value: string): void
    (e: 'update:form', value: FormData): void
    (e: 'generate-briefing'): void
    (e: 'cancel-scope-task'): void
    (e: 'edit-briefing'): void
    (e: 'add-key-point', value: string): void
    (e: 'remove-key-point', index: number): void
  }

  const emit = defineEmits<Emits>()

  // 新关键点输入
  const newKeyPoint = ref('')

  // 可编辑的研究简报
  const editableBriefing = ref('')

  // 本地表单状态，用于避免直接修改 prop
  const localForm = computed({
    get: () => props.form,
    set: (value: FormData) => emit('update:form', value)
  })

  // 监听 researchBrief 变化，同步更新 editableBriefing
  watch(
    () => props.researchBrief,
    (newVal) => {
      editableBriefing.value = newVal || ''
    },
    { immediate: true }
  )

  // 添加关键点处理
  const handleAddKeyPoint = () => {
    const keyword = newKeyPoint.value.trim()
    if (keyword) {
      emit('add-key-point', keyword)
      newKeyPoint.value = ''
    }
  }
</script>

<style scoped lang="scss">
  .requirements-section {
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;

      h3 {
        margin: 0;
        font-size: 18px;
        color: var(--el-color-primary);
      }
    }

    .section-actions {
      display: flex;
      gap: 12px;
    }
  }

  .task-progress {
    margin-bottom: 20px;
    padding: 16px;
    background: var(--el-bg-color-page);
    border-radius: 8px;

    .progress-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      .progress-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    .progress-detail {
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .requirements-form {
    :deep(.el-form-item__label) {
      font-weight: 500;
    }
  }

  .key-points-container {
    width: 100%;
  }

  .key-points-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;

    .key-point-tag {
      .el-tag__close {
        background-color: transparent;
      }
    }
  }

  .add-key-point {
    display: flex;
    gap: 8px;
    width: 100%;

    .el-input {
      flex: 1;
    }
  }

  .form-tip {
    margin-top: 8px;

    .tip-text {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .research-brief {
    margin-top: 24px;
    padding: 20px;
    background: var(--el-bg-color-page);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);

    .brief-header {
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

    .brief-content {
      :deep(.el-textarea__inner) {
        background: var(--el-bg-color);
      }
    }
  }

  @media (width <= 768px) {
    .requirements-section {
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }

    .key-points-container {
      .add-key-point {
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }
  }
</style>
