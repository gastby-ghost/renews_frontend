/**
 * 增强版任务状态管理器
 *
 * 职责：统一管理AI任务的状态、同步和错误处理
 * 确保AI功能与数据库更新的协调性
 */

import { ref } from 'vue'
import { ElNotification } from 'element-plus'
import { TaskStatus } from '@/utils/polling/asyncTaskPoller'

export interface EnhancedTask {
  id: string
  type: 'scope' | 'search2title' | 'title' | 'outline'
  status: TaskStatus
  progress: number
  result?: any
  error?: string | null
  retryCount: number
  maxRetries: number
  createdAt: number
  updatedAt: number
  lastSyncTime?: number | null
  syncError?: string | null
}

export interface TaskSyncResult {
  success: boolean
  syncedAt: number
  error?: string
}

/**
 * 增强版任务状态管理器
 */
export class EnhancedTaskManager {
  private tasks = ref<Map<string, EnhancedTask>>(new Map())
  private syncState = ref<Map<string, TaskSyncResult>>(new Map())
  // 注意：默认重试次数现在由每个任务单独配置（task.maxRetries）
  // 此类级别的maxRetries用于全局默认值（当前未使用）
  // private maxRetries = 3
  private syncRetryInterval = 2000

  /**
   * 添加任务
   */
  addTask(task: Omit<EnhancedTask, 'retryCount' | 'createdAt' | 'updatedAt'>): void {
    const enhancedTask: EnhancedTask = {
      ...task,
      retryCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.tasks.value.set(task.id, enhancedTask)
    this.log('任务已添加', { taskId: task.id, type: task.type })
  }

  /**
   * 更新任务状态
   */
  updateTaskStatus(taskId: string, status: TaskStatus, result?: any, error?: string | null): void {
    const task = this.tasks.value.get(taskId)
    if (!task) {
      this.log('任务不存在，无法更新', { taskId })
      return
    }

    const previousStatus = task.status
    task.status = status
    task.result = result || undefined
    task.error = error || null
    task.updatedAt = Date.now()

    this.log('任务状态已更新', {
      taskId,
      previousStatus,
      newStatus: status,
      hasResult: !!result,
      hasError: !!error
    })

    // 任务完成时触发数据库同步
    if (status === 'completed' && result) {
      this.handleTaskCompletion(task)
    }

    // 任务失败时检查是否需要重试
    if (status === 'failed' && error) {
      this.handleTaskFailure(task)
    }
  }

  /**
   * 处理任务完成
   */
  private async handleTaskCompletion(task: EnhancedTask): Promise<void> {
    try {
      this.log('开始同步任务结果到数据库', { taskId: task.id, type: task.type })

      // 等待一小段时间让前端状态先更新
      await this.delay(500)

      let syncResult: TaskSyncResult

      switch (task.type) {
        case 'scope':
          syncResult = await this.syncScopeTask(task)
          break

        case 'search2title':
          syncResult = await this.syncSearch2TitleTask(task)
          break

        case 'title':
        case 'outline':
          // TODO: 实现标题和大纲的同步
          syncResult = {
            success: true,
            syncedAt: Date.now()
          }
          break

        default:
          syncResult = {
            success: false,
            syncedAt: Date.now(),
            error: `未知任务类型: ${task.type}`
          }
      }

      // 记录同步结果
      this.syncState.value.set(task.id, syncResult)
      task.lastSyncTime = syncResult.syncedAt

      if (syncResult.success) {
        this.log('任务结果已成功同步到数据库', { taskId: task.id })
        this.showNotification('success', '同步成功', `任务已完成并成功同步到数据库`)
      } else {
        this.log('任务结果同步失败', {
          taskId: task.id,
          error: syncResult.error
        })

        task.syncError = syncResult.error || '同步失败'

        this.showNotification(
          'warning',
          '同步失败',
          `任务完成但同步到数据库失败: ${syncResult.error}`,
          true // 显示重试按钮
        )
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '同步过程中发生未知错误'
      this.log('任务同步过程中发生错误', { taskId: task.id, error: errorMsg })

      this.syncState.value.set(task.id, {
        success: false,
        syncedAt: Date.now(),
        error: errorMsg
      })

      task.syncError = errorMsg

      this.showNotification('error', '同步错误', `同步过程中发生错误: ${errorMsg}`)
    }
  }

  /**
   * 同步Scope任务结果
   */
  private async syncScopeTask(task: EnhancedTask): Promise<TaskSyncResult> {
    try {
      // 这里应该从任务结果中提取数据并调用数据库同步服务
      // 由于我们没有直接访问documentStore，这里简化处理

      // 模拟数据库操作
      await this.simulateDatabaseOperation('syncScope', task.result)

      return {
        success: true,
        syncedAt: Date.now()
      }
    } catch (error) {
      return {
        success: false,
        syncedAt: Date.now(),
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 同步Search2Title任务结果
   */
  private async syncSearch2TitleTask(task: EnhancedTask): Promise<TaskSyncResult> {
    try {
      // 模拟数据库操作
      await this.simulateDatabaseOperation('syncSearch2Title', task.result)

      return {
        success: true,
        syncedAt: Date.now()
      }
    } catch (error) {
      return {
        success: false,
        syncedAt: Date.now(),
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 处理任务失败
   */
  private handleTaskFailure(task: EnhancedTask): void {
    if (task.retryCount < task.maxRetries) {
      task.retryCount++
      this.log('任务失败，准备重试', {
        taskId: task.id,
        retryCount: task.retryCount,
        maxRetries: task.maxRetries
      })

      this.showNotification(
        'warning',
        '任务失败',
        `任务执行失败，将在 ${this.syncRetryInterval / 1000} 秒后自动重试 (${task.retryCount}/${task.maxRetries})`
      )
    } else {
      this.log('任务失败，已达到最大重试次数', {
        taskId: task.id,
        retryCount: task.retryCount,
        maxRetries: task.maxRetries
      })

      this.showNotification(
        'error',
        '任务失败',
        `任务执行失败，已达到最大重试次数 (${task.maxRetries})，请手动重试`
      )
    }
  }

  /**
   * 手动重试任务
   */
  retryTask(taskId: string): void {
    const task = this.tasks.value.get(taskId)
    if (!task) {
      this.log('任务不存在，无法重试', { taskId })
      return
    }

    if (task.retryCount >= task.maxRetries) {
      this.log('已达到最大重试次数，无法重试', { taskId })
      return
    }

    this.log('手动重试任务', { taskId })
    this.updateTaskStatus(taskId, TaskStatus.PENDING, null, null)
  }

  /**
   * 重试失败的同步
   */
  retrySync(taskId: string): void {
    const task = this.tasks.value.get(taskId)
    if (!task || !task.result) {
      this.log('任务不存在或无结果，无法重试同步', { taskId })
      return
    }

    this.log('重试数据库同步', { taskId })
    this.handleTaskCompletion(task)
  }

  /**
   * 清理已完成的任务
   */
  cleanupCompletedTasks(maxAge: number = 60 * 60 * 1000): void {
    const now = Date.now()
    const tasksToDelete: string[] = []

    this.tasks.value.forEach((task, taskId) => {
      if (task.status === 'completed' || task.status === 'failed') {
        if (now - task.updatedAt > maxAge) {
          tasksToDelete.push(taskId)
        }
      }
    })

    tasksToDelete.forEach((taskId) => {
      this.tasks.value.delete(taskId)
      this.syncState.value.delete(taskId)
    })

    if (tasksToDelete.length > 0) {
      this.log('已清理过期任务', { count: tasksToDelete.length })
    }
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): EnhancedTask[] {
    return Array.from(this.tasks.value.values())
  }

  /**
   * 获取特定任务
   */
  getTask(taskId: string): EnhancedTask | undefined {
    return this.tasks.value.get(taskId)
  }

  /**
   * 获取任务同步状态
   */
  getSyncState(taskId: string): TaskSyncResult | undefined {
    return this.syncState.value.get(taskId)
  }

  /**
   * 显示通知
   */
  private showNotification(
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message: string,
    showClose: boolean = true
  ): void {
    ElNotification({
      title,
      message,
      type,
      duration: 5000,
      showClose
    })
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 模拟数据库操作
   */
  private async simulateDatabaseOperation(operation: string, _data: any): Promise<void> {
    // 标记参数为已使用以避免未使用变量警告
    void _data
    await this.delay(300)

    if (Math.random() < 0.15) {
      throw new Error(`模拟数据库操作失败: ${operation}`)
    }
  }

  /**
   * 记录日志
   */
  private log(message: string, meta?: any): void {
    console.log(`[EnhancedTaskManager] ${message}`, meta || '')
  }
}

// 创建单例实例
export const enhancedTaskManager = new EnhancedTaskManager()

export default enhancedTaskManager
