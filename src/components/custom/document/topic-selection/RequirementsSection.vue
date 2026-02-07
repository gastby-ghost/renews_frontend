<template>
  <div class="requirements-section">
    <h2 class="section-title">需求定义</h2>
    <el-form
      ref="requirementsFormRef"
      :model="form"
      :rules="validationRules"
      label-width="120px"
      size="large"
    >
      <el-form-item label="主题/标题" prop="topic">
        <el-input
          v-model="formTopic"
          placeholder="请输入文档的主题或标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="关键要点" prop="keyPoints">
        <div class="key-points-input">
          <el-input
            v-model="currentKeyPointModel"
            placeholder="输入关键要点后按回车添加"
            @keyup.enter="addKeyPoint"
          />
          <el-button @click="addKeyPoint" :disabled="!currentKeyPoint.trim()"> 添加 </el-button>
        </div>
        <div class="key-points-list" v-if="form.keyPoints.length > 0">
          <el-tag
            v-for="(point, index) in form.keyPoints"
            :key="index"
            closable
            @close="removeKeyPoint(index)"
            type="info"
          >
            {{ point }}
          </el-tag>
        </div>
      </el-form-item>

      <el-form-item label="特殊要求" prop="specialRequirements">
        <el-input
          v-model="formSpecialRequirements"
          type="textarea"
          :rows="4"
          placeholder="请输入任何特殊要求，如需要包含的特定信息、避免的词汇等"
        />
      </el-form-item>
    </el-form>

    <div class="requirements-actions">
      <el-button
        type="primary"
        size="large"
        @click="$emit('generate-briefing', requirementsFormRef)"
        :loading="isGeneratingBriefing || isExecutingScope"
        :disabled="!canGenerateBriefing || hasScopeTask"
      >
        <template v-if="hasScopeTask"> {{ taskStatusText }} ({{ taskProgress }}%) </template>
        <template v-else>生成AI简报</template>
      </el-button>
      <el-button
        v-if="hasScopeTask"
        @click="$emit('cancel-scope-task')"
        size="large"
        type="danger"
        plain
      >
        取消任务
      </el-button>
    </div>

    <!-- AI简报展示区域 -->
    <div class="ai-briefing-section" v-if="researchBrief">
      <div class="section-header">
        <h3>AI创作简报</h3>
        <el-button @click="$emit('edit-briefing')" size="small" type="primary" plain
          >编辑简报</el-button
        >
      </div>
      <div class="briefing-content markdown-body" v-html="renderedBriefing"></div>
    </div>

    <!-- Scope Agent 任务状态指示器 -->
    <div class="task-status-card" v-if="hasScopeTask">
      <el-card>
        <div class="task-status">
          <div class="status-icon">
            <el-icon v-if="scopeTaskStatus === 'completed'" color="#67C23A">
              <Check />
            </el-icon>
            <el-icon v-else-if="scopeTaskStatus === 'failed'" color="#F56C6C">
              <Close />
            </el-icon>
            <el-icon v-else color="#409EFF" class="is-loading">
              <Loading />
            </el-icon>
          </div>
          <div class="status-content">
            <h4>AI简报生成任务</h4>
            <p>{{ taskStatusText }}</p>
            <el-progress
              v-if="scopeTaskStatus && ['running', 'pending'].includes(scopeTaskStatus)"
              :percentage="taskProgress"
              :status="scopeTaskStatus === 'failed' ? 'exception' : undefined"
            />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { marked } from 'marked'
  import { Check, Close, Loading } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'RequirementsSection' })

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
    scopeTaskStatus: string | null
    taskProgress: number
    taskStatusText: string
    isGeneratingBriefing: boolean
    isExecutingScope: boolean
    researchBrief: string | null
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    'update:currentKeyPoint': [value: string]
    'update:form': [value: FormData]
    'generate-briefing': [formRef: FormInstance | undefined]
    'cancel-scope-task': []
    'edit-briefing': []
    'add-key-point': []
    'remove-key-point': [index: number]
  }>()

  const requirementsFormRef = ref<FormInstance>()

  const validationRules: FormRules = {
    topic: [
      { required: true, message: '请输入文档主题', trigger: 'blur' },
      { min: 2, max: 100, message: '主题长度应在2-100个字符之间', trigger: 'blur' }
    ]
  }

  const renderedBriefing = computed(() => {
    if (!props.researchBrief) return ''
    return marked(props.researchBrief)
  })

  // Computed properties with setters to avoid prop mutation
  const formTopic = computed({
    get: () => props.form.topic,
    set: (value: string) => emit('update:form', { ...props.form, topic: value })
  })

  const formSpecialRequirements = computed({
    get: () => props.form.specialRequirements,
    set: (value: string) => emit('update:form', { ...props.form, specialRequirements: value })
  })

  const currentKeyPointModel = computed({
    get: () => props.currentKeyPoint,
    set: (value: string) => emit('update:currentKeyPoint', value)
  })

  const addKeyPoint = () => {
    emit('update:currentKeyPoint', props.currentKeyPoint)
    emit('add-key-point')
  }

  const removeKeyPoint = (index: number) => {
    emit('remove-key-point', index)
  }
</script>

<style scoped lang="scss">
  .requirements-section {
    max-width: 1200px;
    padding: 0 40px;
    margin: 0 auto;
    margin-bottom: 50px;
  }

  .section-title {
    padding-left: 12px;
    margin: 0 0 30px;
    font-size: 22px;
    font-weight: 600;
    color: var(--el-color-primary);
    border-left: 4px solid var(--el-color-primary);
  }

  .key-points-input {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .key-points-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .requirements-actions {
    display: flex;
    justify-content: center;
    margin-top: 30px;
    margin-bottom: 20px;
  }

  .ai-briefing-section {
    padding: 30px;
    margin-top: 30px;
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 8px;
  }

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

  .task-status-card {
    margin-top: 20px;

    .task-status {
      display: flex;
      gap: 20px;
      align-items: center;

      .status-icon {
        font-size: 32px;

        .is-loading {
          animation: rotating 2s linear infinite;
        }
      }

      .status-content {
        flex: 1;

        h4 {
          margin: 0 0 8px;
          font-size: 16px;
          color: var(--el-text-color-primary);
        }

        p {
          margin: 0 0 12px;
          color: var(--el-text-color-regular);
        }
      }
    }
  }

  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @media (width <= 768px) {
    .requirements-section {
      padding: 0;
    }

    .section-title {
      font-size: 18px;
    }

    .key-points-input {
      flex-direction: column;
    }
  }
</style>
