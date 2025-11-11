/**
 * 通用异步任务轮询工具 - 带日志记录版本
 * 用于统一管理所有异步任务的轮询状态和进度
 */

// 任务状态枚举
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

// 日志级别
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

// 轮询配置
export interface PollingConfig {
  interval?: number
  timeout?: number
  maxAttempts?: number
  retryAttempts?: number
  immediateFirstCheck?: boolean
  onStatusUpdate?: (status: TaskStatus, data?: any) => void
  onProgress?: (attempts: number, maxAttempts: number) => void
  enableLogging?: boolean
  logLevel?: LogLevel
  logger?: (level: LogLevel, message: string, meta?: any) => void
}

// 轮询任务结果
export interface PollingTaskResult<T = any> {
  status: TaskStatus
  data?: T
  error?: string
  attempts: number
  duration: number
  startTime: number
  endTime?: number
}

// 轮询任务实例
export interface PollingTask {
  id: string
  result: PollingTaskResult
  isPolling: boolean
  isCompleted: boolean
  cancel: () => void
  reset: () => void
  on: (event: string, handler: Function) => void
  off: (event: string, handler: Function) => void
  promise: Promise<PollingTaskResult>
}

// 任务状态检查器函数类型
export type StatusChecker<T = any> = () => Promise<{
  status: TaskStatus
  data?: T
  isCompleted?: boolean
  error?: string
}>

/**
 * 通用异步任务轮询器
 */
export class AsyncTaskPoller {
  private task: PollingTask | null = null
  private timerId: number | null = null
  private startTime = 0
  private config: Required<PollingConfig>
  private statusChecker: StatusChecker
  private retryCount = 0
  private enableLogging: boolean
  private logLevel: LogLevel
  private logger: (level: LogLevel, message: string, meta?: any) => void
  private eventHandlers: Map<string, Function[]> = new Map()
  private resolvePromise: ((value: PollingTaskResult) => void) | null = null
  private rejectPromise: ((reason?: any) => void) | null = null

  constructor(statusChecker: StatusChecker, config: PollingConfig = {}) {
    this.statusChecker = statusChecker
    this.config = {
      interval: config.interval ?? 2000,
      timeout: config.timeout ?? 60000,
      maxAttempts: config.maxAttempts ?? 30,
      retryAttempts: config.retryAttempts ?? 3,
      immediateFirstCheck: config.immediateFirstCheck ?? true,
      onStatusUpdate: config.onStatusUpdate ?? (() => {}),
      onProgress: config.onProgress ?? (() => {}),
      enableLogging: config.enableLogging ?? true,
      logLevel: config.logLevel ?? LogLevel.INFO,
      logger: config.logger ?? this.defaultLogger
    }

    this.enableLogging = this.config.enableLogging
    this.logLevel = this.config.logLevel
    this.logger = this.config.logger
  }

  /**
   * 默认日志记录器 - 输出到控制台
   */
  private defaultLogger(level: LogLevel, message: string, meta?: any): void {
    const timestamp = new Date().toISOString()
    const taskId = this.task?.id || 'N/A'

    const levelName =
      level === LogLevel.ERROR
        ? 'ERROR'
        : level === LogLevel.WARN
          ? 'WARN'
          : level === LogLevel.INFO
            ? 'INFO'
            : level === LogLevel.DEBUG
              ? 'DEBUG'
              : 'UNKNOWN'

    const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''

    const logMessage = `[Polling][${timestamp}][${levelName}][Task: ${taskId}] ${message}${metaStr}`

    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage)
        break
      case LogLevel.WARN:
        console.warn(logMessage)
        break
      case LogLevel.INFO:
        console.info(logMessage)
        break
      case LogLevel.DEBUG:
        console.debug(logMessage)
        break
    }
  }

  /**
   * 内部日志记录方法
   */
  private log(level: LogLevel, message: string, meta?: any): void {
    if (this.enableLogging && level <= this.logLevel) {
      this.logger(level, message, meta)
    }
  }

  async start(taskId?: string): Promise<PollingTask> {
    if (this.task?.isPolling) {
      this.log(LogLevel.WARN, '轮询已在进行中，先停止现有轮询')
      this.stop()
    }

    this.startTime = Date.now()
    const id = taskId || this.generateTaskId()

    // 创建 promise
    const promise = new Promise<PollingTaskResult>((resolve, reject) => {
      this.resolvePromise = resolve
      this.rejectPromise = reject
    })

    this.task = {
      id,
      isPolling: false,
      isCompleted: false,
      result: {
        status: TaskStatus.PENDING,
        attempts: 0,
        duration: 0,
        startTime: this.startTime
      },
      cancel: () => this.stop(),
      reset: () => this.reset(),
      on: (event: string, handler: Function) => {
        if (!this.eventHandlers.has(event)) {
          this.eventHandlers.set(event, [])
        }
        this.eventHandlers.get(event)!.push(handler)
      },
      off: (event: string, handler: Function) => {
        if (this.eventHandlers.has(event)) {
          const handlers = this.eventHandlers.get(event)!
          const index = handlers.indexOf(handler)
          if (index > -1) {
            handlers.splice(index, 1)
          }
        }
      },
      promise
    }

    this.log(LogLevel.INFO, '开始轮询任务', {
      taskId: id,
      config: {
        interval: this.config.interval,
        timeout: this.config.timeout,
        maxAttempts: this.config.maxAttempts,
        retryAttempts: this.config.retryAttempts,
        immediateFirstCheck: this.config.immediateFirstCheck
      }
    })

    if (this.config.immediateFirstCheck) {
      await this.checkStatus()
    } else {
      this.log(LogLevel.DEBUG, '延迟首次检查，等待间隔时间', { delay: this.config.interval })
      this.timerId = window.setTimeout(() => {
        this.checkStatus()
      }, this.config.interval)
    }

    this.task.isPolling = true
    return this.task
  }

  /**
   * 触发事件
   */
  private emit(event: string, ...args: any[]): void {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event)!.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          this.log(LogLevel.ERROR, `事件处理程序错误: ${event}`, { error, args })
        }
      })
    }
  }

  stop(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
      this.log(LogLevel.DEBUG, '清除定时器')
    }

    if (this.task) {
      const wasPolling = this.task.isPolling
      this.task.isPolling = false
      this.task.result.endTime = Date.now()
      this.task.result.duration = this.task.result.endTime - this.task.result.startTime

      if (wasPolling) {
        this.log(LogLevel.INFO, '轮询任务停止', {
          duration: this.task.result.duration,
          totalAttempts: this.task.result.attempts,
          finalStatus: this.task.result.status
        })
      }
    }
  }

  reset(): void {
    this.stop()
    this.retryCount = 0
    this.task = null
  }

  private async checkStatus(): Promise<void> {
    if (!this.task || this.task.isCompleted) {
      return
    }

    try {
      const currentTime = Date.now()
      const elapsedTime = currentTime - this.startTime

      // 检查超时
      if (elapsedTime >= this.config.timeout) {
        this.log(LogLevel.WARN, '轮询超时', {
          elapsedTime,
          timeout: this.config.timeout,
          attempts: this.task.result.attempts
        })
        this.updateTaskStatus(TaskStatus.TIMEOUT, null, '轮询超时')
        return
      }

      // 检查最大轮询次数
      if (this.task.result.attempts >= this.config.maxAttempts) {
        this.log(LogLevel.WARN, '达到最大轮询次数', {
          attempts: this.task.result.attempts,
          maxAttempts: this.config.maxAttempts,
          elapsedTime
        })
        this.updateTaskStatus(TaskStatus.TIMEOUT, null, '达到最大轮询次数')
        return
      }

      const checkResult = await this.statusChecker()
      const attemptNum = ++this.task.result.attempts

      this.log(LogLevel.DEBUG, `第 ${attemptNum} 次状态检查`, {
        attempts: attemptNum,
        maxAttempts: this.config.maxAttempts,
        status: checkResult.status,
        elapsedTime,
        nextCheckIn: this.config.interval
      })

      this.config.onProgress(attemptNum, this.config.maxAttempts)

      // 检查完成状态
      if (checkResult.status === TaskStatus.COMPLETED || checkResult.isCompleted) {
        this.log(LogLevel.INFO, '任务执行完成', {
          attempts: attemptNum,
          duration: currentTime - this.startTime
        })
        this.updateTaskStatus(TaskStatus.COMPLETED, checkResult.data)
        return
      }

      // 检查失败状态
      if (checkResult.status === TaskStatus.FAILED) {
        this.log(LogLevel.ERROR, '任务执行失败', {
          attempts: attemptNum,
          error: checkResult.error
        })
        this.handleFailure(checkResult.error || '任务执行失败')
        return
      }

      // 检查取消状态
      if (checkResult.status === TaskStatus.CANCELLED) {
        this.log(LogLevel.INFO, '任务已取消', {
          attempts: attemptNum
        })
        this.updateTaskStatus(TaskStatus.CANCELLED, null, '任务已取消')
        return
      }

      // 继续轮询
      this.task.result.status = checkResult.status
      this.config.onStatusUpdate(checkResult.status, checkResult.data)

      this.log(LogLevel.DEBUG, '任务仍在执行中，继续轮询', {
        nextCheckIn: this.config.interval,
        status: checkResult.status
      })

      this.timerId = window.setTimeout(() => {
        this.checkStatus()
      }, this.config.interval)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      this.log(LogLevel.ERROR, '状态检查出错', {
        error: errorMessage,
        attempts: this.task?.result.attempts || 0
      })
      this.handleFailure(errorMessage)
    }
  }

  private handleFailure(error: string): void {
    if (this.retryCount < this.config.retryAttempts) {
      this.retryCount++
      const retryDelay = this.config.interval * 2

      this.log(LogLevel.WARN, `执行重试 (${this.retryCount}/${this.config.retryAttempts})`, {
        error,
        retryDelay,
        nextAttemptIn: retryDelay
      })

      this.config.onStatusUpdate(TaskStatus.RUNNING, null)

      this.timerId = window.setTimeout(() => {
        this.checkStatus()
      }, retryDelay)
    } else {
      this.log(LogLevel.ERROR, '重试次数已用完，任务失败', {
        error,
        totalRetries: this.retryCount,
        maxRetries: this.config.retryAttempts
      })
      this.updateTaskStatus(TaskStatus.FAILED, null, error)
    }
  }

  private updateTaskStatus(status: TaskStatus, data?: any, error?: string): void {
    if (!this.task) return

    const previousStatus = this.task.result.status
    this.task.result.status = status
    this.task.result.data = data
    this.task.result.error = error
    this.task.result.endTime = Date.now()
    this.task.result.duration = this.task.result.endTime - this.task.result.startTime

    this.log(LogLevel.DEBUG, `状态更新: ${previousStatus} -> ${status}`, {
      previousStatus,
      newStatus: status,
      error,
      duration: this.task.result.duration,
      attempts: this.task.result.attempts
    })

    this.config.onStatusUpdate(status, data)

    // 触发事件
    if (status === TaskStatus.RUNNING && previousStatus !== TaskStatus.RUNNING) {
      this.emit('progress', {...this.task.result, data})
    } else if (status === TaskStatus.COMPLETED) {
      this.emit('completed', {...this.task.result, data})
    } else if (status === TaskStatus.FAILED) {
      this.emit('failed', new Error(error || '任务失败'))
    } else if (status === TaskStatus.TIMEOUT) {
      this.emit('timeout')
    } else if (status === TaskStatus.CANCELLED) {
      this.emit('cancelled')
    }

    // 任务结束
    if (
      status === TaskStatus.COMPLETED ||
      status === TaskStatus.FAILED ||
      status === TaskStatus.TIMEOUT ||
      status === TaskStatus.CANCELLED
    ) {
      this.task.isCompleted = true
      this.task.isPolling = false

      const logLevel = status === TaskStatus.COMPLETED ? LogLevel.INFO : LogLevel.WARN
      const message =
        status === TaskStatus.COMPLETED
          ? '任务完成'
          : status === TaskStatus.FAILED
            ? '任务失败'
            : status === TaskStatus.TIMEOUT
              ? '任务超时'
              : '任务已取消'

      this.log(logLevel, message, {
        finalStatus: status,
        totalAttempts: this.task.result.attempts,
        totalRetries: this.retryCount,
        totalDuration: this.task.result.duration,
        error: error || null,
        hasData: !!data
      })

      // Resolve or reject promise
      if (this.resolvePromise && this.rejectPromise) {
        if (status === TaskStatus.COMPLETED) {
          this.resolvePromise(this.task.result)
        } else {
          this.rejectPromise(new Error(error || message))
        }
      }

      this.stop()
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }

  getTask(): PollingTask | null {
    return this.task
  }

  /**
   * 启用或禁用日志记录
   */
  setLogging(enabled: boolean): void {
    this.enableLogging = enabled
  }

  /**
   * 设置日志级别
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  /**
   * 设置自定义日志记录器
   */
  setLogger(logger: (level: LogLevel, message: string, meta?: any) => void): void {
    this.logger = logger
  }
}

/**
 * 轮询辅助函数 - 直接返回结果
 */
export async function pollTask<T = any>(
  statusChecker: StatusChecker,
  config: PollingConfig = {}
): Promise<PollingTaskResult<T>> {
  const poller = new AsyncTaskPoller(statusChecker, config)
  const task = await poller.start()

  // 添加启动日志
  poller['log'](LogLevel.INFO, '辅助函数启动轮询', { taskId: task.id })

  return new Promise<PollingTaskResult<T>>((resolve) => {
    const checkInterval = setInterval(() => {
      if (task.isCompleted || !task.isPolling) {
        clearInterval(checkInterval)
        resolve(task.result)
      }
    }, 100)
  })
}
