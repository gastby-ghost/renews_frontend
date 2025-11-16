/**
 * 通用 Mock 任务跟踪器
 * 提供异步任务的模拟执行、状态跟踪和进度更新
 */

export interface TaskRecord {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  result: any
  createdAt: number
  updatedAt: number
  error?: string | null
}

export class MockTaskTracker {
  private tasks = new Map<string, TaskRecord>()

  /**
   * 创建任务
   */
  createTask(taskId: string, initialResult?: any): TaskRecord {
    const task: TaskRecord = {
      status: 'pending',
      progress: 0,
      result: initialResult || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      error: null
    }
    this.tasks.set(taskId, task)
    return task
  }

  /**
   * 更新任务状态
   */
  updateTask(
    taskId: string,
    updates: Partial<Pick<TaskRecord, 'status' | 'progress' | 'result' | 'error'>>
  ): TaskRecord | null {
    const task = this.tasks.get(taskId)
    if (!task) return null

    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: Date.now()
    }

    this.tasks.set(taskId, updatedTask)
    return updatedTask
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskRecord | null {
    return this.tasks.get(taskId) || null
  }

  /**
   * 删除任务
   */
  deleteTask(taskId: string): boolean {
    return this.tasks.delete(taskId)
  }

  /**
   * 清除所有任务
   */
  clearAllTasks(): void {
    this.tasks.clear()
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): Map<string, TaskRecord> {
    return new Map(this.tasks)
  }

  /**
   * 检查任务是否存在
   */
  hasTask(taskId: string): boolean {
    return this.tasks.has(taskId)
  }

  /**
   * 根据时间自动更新任务状态（可选）
   * 会根据任务创建时间自动推进状态和进度
   */
  updateTaskByTime(
    taskId: string,
    customLogic?: (elapsed: number, task: TaskRecord) => Partial<TaskRecord>
  ): TaskRecord | null {
    const task = this.tasks.get(taskId)
    if (!task) return null

    const elapsed = Date.now() - task.createdAt
    console.log(
      `[DEBUG] updateTaskByTime - taskId: ${taskId}, elapsed: ${elapsed}ms, current status: ${task.status}`
    )

    let updates: Partial<TaskRecord> = {}

    if (customLogic) {
      // 如果提供了自定义逻辑，使用它
      updates = customLogic(elapsed, task)
    } else {
      // 默认逻辑：2秒pending，3秒running，然后completed
      if (elapsed < 2000) {
        updates = {
          status: 'pending',
          progress: Math.min(30, Math.floor(elapsed / 100))
        }
      } else if (elapsed < 5000) {
        updates = {
          status: 'running',
          progress: Math.min(90, 30 + Math.floor((elapsed - 2000) / 50))
        }
      } else {
        updates = {
          status: 'completed',
          progress: 100,
          result: task.result
        }
      }
    }

    console.log(`[DEBUG] updateTaskByTime - taskId: ${taskId}, updates:`, updates)
    return this.updateTask(taskId, updates)
  }

  /**
   * 更新任务状态（简便方法）
   */
  updateTaskStatus(taskId: string, status: TaskRecord['status'], result?: any): TaskRecord | null {
    return this.updateTask(taskId, { status, result })
  }

  /**
   * 为 Search2Title Agent 定制的时间更新逻辑
   */
  updateSearch2TitleTaskByTime(taskId: string): TaskRecord | null {
    return this.updateTaskByTime(taskId, (elapsed, task) => {
      if (elapsed < 2000) {
        return {
          status: 'pending',
          progress: 10
        }
      } else if (elapsed < 8000) {
        return {
          status: 'running',
          progress: Math.min(90, Math.floor(elapsed / 80))
        }
      } else {
        return {
          status: 'completed',
          progress: 100,
          result: task.result || {
            research_data: {
              research_brief: '我需要进行关于人工智能在医疗领域应用的新闻选题调研',
              research_path: ['分析AI医疗市场现状', '调研FDA最新监管政策', '收集技术突破案例'],
              web_search_data: []
            },
            title_data: {
              titles: [],
              generation_summary: '基于AI搜索生成的标题推荐'
            }
          }
        }
      }
    })
  }
}
