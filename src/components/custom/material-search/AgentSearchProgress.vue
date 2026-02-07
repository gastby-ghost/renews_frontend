<template>
  <div class="agent-search-progress">
    <el-card class="agent-search-progress__card">
      <template #header>
        <div class="agent-search-progress__header">
          <h3 class="agent-search-progress__title">
            <el-icon><Loading /></el-icon>
            Agent检索中...
          </h3>
          <el-button size="small" @click="$emit('cancel')" :loading="cancelling"> 取消 </el-button>
        </div>
      </template>

      <div class="agent-search-progress__content">
        <!-- 进度条 -->
        <div class="agent-search-progress__bar">
          <el-progress
            :percentage="progress.current"
            :status="getProgressStatus"
            :stroke-width="8"
            :show-text="true"
          />
          <p class="agent-search-progress__message">{{ progress.message }}</p>
        </div>

        <!-- 任务详情 -->
        <div class="agent-search-progress__details">
          <div class="agent-search-progress__detail-item">
            <span class="detail-label">任务ID:</span>
            <span class="detail-value">{{ taskId || '正在生成...' }}</span>
          </div>
          <div class="agent-search-progress__detail-item">
            <span class="detail-label">当前阶段:</span>
            <span class="detail-value">{{ getStageText(progress.stage) }}</span>
          </div>
          <div class="agent-search-progress__detail-item">
            <span class="detail-label">进度:</span>
            <span class="detail-value">{{ progress.current }}%</span>
          </div>
        </div>

        <!-- 阶段指示器 -->
        <div class="agent-search-progress__stages">
          <div
            v-for="stage in stages"
            :key="stage.key"
            class="agent-search-progress__stage"
            :class="{
              active: isStageActive(stage.key),
              completed: isStageCompleted(stage.key)
            }"
          >
            <div class="agent-search-progress__stage-icon">
              <el-icon v-if="isStageCompleted(stage.key)"><CircleCheck /></el-icon>
              <el-icon v-else-if="isStageActive(stage.key)"><Loading /></el-icon>
              <el-icon v-else><CircleCheck /></el-icon>
            </div>
            <div class="agent-search-progress__stage-info">
              <div class="agent-search-progress__stage-title">{{ stage.title }}</div>
              <div class="agent-search-progress__stage-description">{{ stage.description }}</div>
            </div>
          </div>
        </div>

        <!-- 实时日志 -->
        <div v-if="showLogs" class="agent-search-progress__logs">
          <div class="agent-search-progress__logs-header">
            <span>执行日志</span>
            <el-button size="small" text @click="clearLogs">清空</el-button>
          </div>
          <div class="agent-search-progress__logs-content">
            <div
              v-for="(log, index) in logs"
              :key="index"
              class="agent-search-progress__log-item"
              :class="`log-${log.level}`"
            >
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-level">{{ log.level.toUpperCase() }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { Loading, CircleCheck } from '@element-plus/icons-vue'
  // 使用 CircleCheck 作为 Circle 的替代，因为 Circle 图标在当前版本中不存在

  interface Props {
    taskId?: string
    progress: {
      stage: 'config' | 'searching' | 'processing' | 'completed'
      current: number
      total: number
      message: string
    }
  }

  interface Emits {
    (e: 'cancel'): void
  }

  interface LogEntry {
    timestamp: number
    level: 'info' | 'warning' | 'error' | 'success'
    message: string
  }

  const props = defineProps<Props>()
  defineEmits<Emits>()

  const cancelling = ref(false)
  const showLogs = ref(false)
  const logs = ref<LogEntry[]>([])

  // 定义阶段信息
  const stages = [
    {
      key: 'config',
      title: '配置阶段',
      description: '正在配置Agent参数和搜索策略'
    },
    {
      key: 'searching',
      title: '搜索阶段',
      description: 'Agent正在执行搜索和分析'
    },
    {
      key: 'processing',
      title: '处理阶段',
      description: '正在处理和分析搜索结果'
    },
    {
      key: 'completed',
      title: '完成阶段',
      description: 'Agent检索已完成'
    }
  ]

  // 计算属性
  const getProgressStatus = computed(() => {
    if (props.progress.stage === 'completed') return 'success'
    if (props.progress.current >= 90) return 'warning'
    return undefined
  })

  // 方法
  const getStageText = (stage: string) => {
    const stageMap = {
      config: '配置参数',
      searching: '搜索中',
      processing: '处理结果',
      completed: '已完成'
    }
    return stageMap[stage as keyof typeof stageMap] || stage
  }

  const isStageActive = (stageKey: string) => {
    return props.progress.stage === stageKey
  }

  const isStageCompleted = (stageKey: string) => {
    const stageIndex = stages.findIndex((stage) => stage.key === stageKey)
    const currentIndex = stages.findIndex((stage) => stage.key === props.progress.stage)
    return stageIndex < currentIndex
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const addLog = (level: LogEntry['level'], message: string) => {
    logs.value.push({
      timestamp: Date.now(),
      level,
      message
    })

    // 限制日志数量
    if (logs.value.length > 100) {
      logs.value = logs.value.slice(-50)
    }
  }

  const clearLogs = () => {
    logs.value = []
  }

  // 模拟日志生成
  const startLogSimulation = () => {
    const interval = setInterval(() => {
      if (props.progress.stage === 'completed') {
        clearInterval(interval)
        return
      }

      const logMessages = [
        { level: 'info' as const, message: 'Agent正在分析研究简报...' },
        { level: 'info' as const, message: '生成搜索策略...' },
        { level: 'info' as const, message: '执行第一轮搜索...' },
        { level: 'success' as const, message: '找到相关结果，正在深入分析...' },
        { level: 'info' as const, message: '整合搜索结果...' },
        { level: 'warning' as const, message: '部分搜索结果需要进一步验证...' }
      ]

      const randomLog = logMessages[Math.floor(Math.random() * logMessages.length)]
      addLog(randomLog.level, randomLog.message)
    }, 3000)

    return interval
  }

  // 生命周期
  let logInterval: any = null

  onMounted(async () => {
    // 添加初始日志
    addLog('info', 'Agent检索任务已启动')

    // 开始模拟日志
    logInterval = startLogSimulation()
  })

  onUnmounted(() => {
    if (logInterval) {
      clearInterval(logInterval)
    }
  })
</script>

<style scoped lang="scss">
  .agent-search-progress {
    &__card {
      margin-bottom: 20px;
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .agent-search-progress__title {
        display: flex;
        gap: 8px;
        align-items: center;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }
    }

    &__content {
      padding: 20px 0;
    }

    &__bar {
      margin-bottom: 24px;
      text-align: center;

      .agent-search-progress__message {
        margin: 12px 0 0;
        font-size: 14px;
        color: var(--el-text-color-regular);
      }
    }

    &__details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding: 16px;
      margin-bottom: 24px;
      background: var(--el-fill-color-lighter);
      border-radius: 6px;

      .agent-search-progress__detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .detail-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--el-text-color-secondary);
        }

        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }
    }

    &__stages {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    &__stage {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 6px;
      transition: all 0.3s ease;

      &.active {
        background: var(--el-color-primary-light-9);
        border: 1px solid var(--el-color-primary-light-5);
      }

      &.completed {
        background: var(--el-color-success-light-9);
        border: 1px solid var(--el-color-success-light-5);
      }

      &:not(.active, .completed) {
        background: var(--el-fill-color-lighter);
        border: 1px solid var(--el-border-color-lighter);
      }

      &-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;

        .agent-search-progress__stage.active & {
          color: white;
          background: var(--el-color-primary);
        }

        .agent-search-progress__stage.completed & {
          color: white;
          background: var(--el-color-success);
        }

        .agent-search-progress__stage:not(.active, .completed) & {
          color: var(--el-text-color-secondary);
          background: var(--el-fill-color);
        }
      }

      &-info {
        flex: 1;
      }

      &-title {
        margin-bottom: 4px;
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      &-description {
        font-size: 12px;
        line-height: 1.4;
        color: var(--el-text-color-secondary);
      }
    }

    &__logs {
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 6px;

      &-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        background: var(--el-fill-color-lighter);
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      &-content {
        max-height: 200px;
        padding: 8px 0;
        overflow-y: auto;
      }
    }

    &__log-item {
      display: flex;
      gap: 12px;
      padding: 8px 16px;
      font-size: 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      &.log-info {
        color: var(--el-text-color-regular);
      }

      &.log-success {
        color: var(--el-color-success);
      }

      &.log-warning {
        color: var(--el-color-warning);
      }

      &.log-error {
        color: var(--el-color-error);
      }

      .log-time {
        min-width: 80px;
        color: var(--el-text-color-secondary);
      }

      .log-level {
        min-width: 40px;
        font-weight: 600;
      }

      .log-message {
        flex: 1;
      }
    }
  }

  @media (width <= 768px) {
    .agent-search-progress {
      &__details {
        grid-template-columns: 1fr;
      }

      &__stage {
        padding: 8px;
      }

      &__log-item {
        flex-direction: column;
        gap: 4px;

        .log-time,
        .log-level {
          min-width: auto;
        }
      }
    }
  }
</style>
