/**
 * 轮询任务状态管理 Store
 * 用于集中管理所有异步任务的轮询状态和进度
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PollingTask, TaskStatus } from '@/utils/polling/asyncTaskPoller'

export interface PollingTaskRecord {
  id: string
  type: string
  description: string
  status: TaskStatus
  isPolling: boolean
  isCompleted: boolean
  progress: number
  attempts: number
  maxAttempts: number
  startTime: number
  endTime?: number
  duration: number
  error?: string
  data?: any
}

export const usePollingStore = defineStore('polling', () => {
  const tasks = ref<Map<string, PollingTaskRecord>>(new Map())
  const maxTasks = ref(10)

  // ==================== 计算属性 ====================
  /**
   * 所有任务列表
   */
  const taskList = computed(() => {
    return Array.from(tasks.value.values()).sort((a, b) => b.startTime - a.startTime)
  })

  /**
   * 正在进行的任务
   */
  const runningTasks = computed(() => {
    return taskList.value.filter((task) => task.isPolling)
  })

  /**
   * 已完成的任务
   */
  const completedTasks = computed(() => {
    return taskList.value.filter((task) => task.isCompleted)
  })

  /**
   * 失败的任务
   */
  const failedTasks = computed(() => {
    return taskList.value.filter((task) => task.status === 'failed' || task.status === 'timeout')
  })

  /**
   * 任务统计
   */
  const statistics = computed(() => {
    const list = taskList.value
    return {
      total: list.length,
      running: runningTasks.value.length,
      completed: completedTasks.value.length,
      failed: failedTasks.value.length,
      successRate:
        list.length > 0 ? ((completedTasks.value.length / list.length) * 100).toFixed(2) : '0'
    }
  })

  // ==================== 操作方法 ====================

  function addTask(task: PollingTask, type: string, description: string): void {
    const taskInfo: PollingTaskRecord = {
      id: task.id,
      type,
      description,
      status: task.result.status,
      isPolling: task.isPolling,
      isCompleted: task.isCompleted,
      progress: 0,
      attempts: task.result.attempts,
      maxAttempts: 30, // 默认值，会在更新时覆盖
      startTime: task.result.startTime,
      endTime: task.result.endTime,
      duration: task.result.duration,
      error: task.result.error,
      data: task.result.data
    }

    tasks.value.set(task.id, taskInfo)

    // 如果任务数量超过最大值，删除最旧的任务
    if (tasks.value.size > maxTasks.value) {
      const oldestTask = taskList.value[taskList.value.length - 1]
      if (oldestTask) {
        tasks.value.delete(oldestTask.id)
      }
    }
  }

  function updateTask(taskId: string, updates: Partial<PollingTaskRecord>): void {
    const taskInfo = tasks.value.get(taskId)
    if (taskInfo) {
      Object.assign(taskInfo, updates)

      // 计算进度
      if (taskInfo.maxAttempts > 0) {
        taskInfo.progress = Math.min((taskInfo.attempts / taskInfo.maxAttempts) * 100, 100)
      }

      // 更新结束时间和耗时
      if (taskInfo.isCompleted && taskInfo.endTime) {
        taskInfo.duration = taskInfo.endTime - taskInfo.startTime
      }
    }
  }

  /**
   * 移除任务
   */
  function removeTask(taskId: string): void {
    tasks.value.delete(taskId)
  }

  /**
   * 清空所有任务
   */
  function clearAll(): void {
    tasks.value.clear()
  }

  /**
   * 清空已完成的任务
   */
  function clearCompleted(): void {
    completedTasks.value.forEach((task) => {
      tasks.value.delete(task.id)
    })
  }

  /**
   * 清空失败的任务
   */
  function clearFailed(): void {
    failedTasks.value.forEach((task) => {
      tasks.value.delete(task.id)
    })
  }

  function getTask(taskId: string): PollingTaskRecord | undefined {
    return tasks.value.get(taskId)
  }

  /**
   * 获取任务类型的中文名称
   */
  function getTaskTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'search-agent': 'Search Agent搜索',
      'scope-agent': 'Scope Agent分析',
      'search2title-agent': 'Search2Title Agent',
      retrieval: '检索任务',
      'document-workflow': '文档生成工作流',
      'outline-agent': '大纲生成',
      'title-agent': '标题生成'
    }
    return typeMap[type] || type
  }

  /**
   * 获取状态的中文名称和样式
   */
  function getStatusInfo(status: TaskStatus): {
    name: string
    type: 'success' | 'warning' | 'danger' | 'info'
    icon: string
  } {
    const statusMap: Record<
      TaskStatus,
      {
        name: string
        type: 'success' | 'warning' | 'danger' | 'info'
        icon: string
      }
    > = {
      [TaskStatus.PENDING]: {
        name: '等待中',
        type: 'info',
        icon: 'Clock'
      },
      [TaskStatus.RUNNING]: {
        name: '执行中',
        type: 'info',
        icon: 'Loading'
      },
      [TaskStatus.COMPLETED]: {
        name: '已完成',
        type: 'success',
        icon: 'CircleCheck'
      },
      [TaskStatus.FAILED]: {
        name: '执行失败',
        type: 'danger',
        icon: 'CircleClose'
      },
      [TaskStatus.CANCELLED]: {
        name: '已取消',
        type: 'warning',
        icon: 'Close'
      },
      [TaskStatus.TIMEOUT]: {
        name: '超时',
        type: 'warning',
        icon: 'Timer'
      }
    }

    return (
      statusMap[status] || {
        name: status,
        type: 'info',
        icon: 'QuestionFilled'
      }
    )
  }

  /**
   * 格式化持续时间
   */
  function formatDuration(duration: number): string {
    if (duration < 1000) {
      return `${duration}ms`
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(2)}s`
    } else {
      const minutes = Math.floor(duration / 60000)
      const seconds = ((duration % 60000) / 1000).toFixed(0)
      return `${minutes}m ${seconds}s`
    }
  }

  /**
   * 检查是否有正在运行的任务
   */
  function hasRunningTasks(): boolean {
    return runningTasks.value.length > 0
  }

  return {
    // 状态
    tasks,
    maxTasks,

    // 计算属性
    taskList,
    runningTasks,
    completedTasks,
    failedTasks,
    statistics,

    // 方法
    addTask,
    updateTask,
    removeTask,
    clearAll,
    clearCompleted,
    clearFailed,
    getTask,
    getTaskTypeName,
    getStatusInfo,
    formatDuration,
    hasRunningTasks
  }
})

export function createAndTrackPollingTask() {
  return {}
}
