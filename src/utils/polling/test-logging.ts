/**
 * 日志记录功能测试
 * 运行方式: 在浏览器控制台中执行或在测试环境中运行
 */

import { AsyncTaskPoller, TaskStatus, LogLevel } from './asyncTaskPoller'

// 测试1: 基本轮询功能
export async function testBasicPolling() {
  console.log('=== 测试1: 基本轮询功能 ===')

  let attempts = 0
  const maxAttempts = 5

  const poller = new AsyncTaskPoller(
    async () => {
      attempts++
      console.log(`状态检查 #${attempts}`)

      if (attempts >= maxAttempts) {
        return {
          status: TaskStatus.COMPLETED,
          data: { result: '任务完成', attempts }
        }
      }

      return { status: TaskStatus.RUNNING }
    },
    {
      interval: 1000,
      timeout: 10000,
      maxAttempts: 10,
      enableLogging: true,
      logLevel: LogLevel.DEBUG
    }
  )

  const task = await poller.start('test-basic')

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (task.isCompleted) {
        clearInterval(checkInterval)
        console.log('测试1完成:', task.result)
        resolve(task.result)
      }
    }, 100)
  })
}

// 测试2: 错误重试功能
export async function testErrorRetry() {
  console.log('\n=== 测试2: 错误重试功能 ===')

  let attempts = 0

  const poller = new AsyncTaskPoller(
    async () => {
      attempts++
      console.log(`状态检查 #${attempts}`)

      if (attempts === 2) {
        throw new Error('模拟网络错误')
      }

      if (attempts >= 4) {
        return {
          status: TaskStatus.COMPLETED,
          data: { result: '重试后完成', attempts }
        }
      }

      return { status: TaskStatus.RUNNING }
    },
    {
      interval: 500,
      timeout: 10000,
      maxAttempts: 10,
      retryAttempts: 3,
      enableLogging: true,
      logLevel: LogLevel.INFO
    }
  )

  const task = await poller.start('test-retry')

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (task.isCompleted) {
        clearInterval(checkInterval)
        console.log('测试2完成:', task.result)
        resolve(task.result)
      }
    }, 100)
  })
}

// 测试3: 超时功能
export async function testTimeout() {
  console.log('\n=== 测试3: 超时功能 ===')

  const poller = new AsyncTaskPoller(
    async () => {
      console.log('状态检查 - 一直返回运行中')
      return { status: TaskStatus.RUNNING }
    },
    {
      interval: 500,
      timeout: 2000,
      maxAttempts: 10,
      enableLogging: true,
      logLevel: LogLevel.WARN
    }
  )

  const task = await poller.start('test-timeout')

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (task.isCompleted) {
        clearInterval(checkInterval)
        console.log('测试3完成:', task.result)
        resolve(task.result)
      }
    }, 100)
  })
}

// 测试4: 自定义日志记录器
export async function testCustomLogger() {
  console.log('\n=== 测试4: 自定义日志记录器 ===')

  const customLogs: any[] = []

  const customLogger = (level: LogLevel, message: string, meta?: any) => {
    const logEntry = {
      level,
      message,
      meta,
      timestamp: new Date().toISOString()
    }
    customLogs.push(logEntry)
    console.log(`[自定义日志][${level}]:`, message, meta || '')
  }

  let attempts = 0

  const poller = new AsyncTaskPoller(
    async () => {
      attempts++
      if (attempts >= 3) {
        return {
          status: TaskStatus.COMPLETED,
          data: { result: '完成' }
        }
      }
      return { status: TaskStatus.RUNNING }
    },
    {
      interval: 500,
      timeout: 5000,
      maxAttempts: 10,
      logger: customLogger,
      enableLogging: true,
      logLevel: LogLevel.DEBUG
    }
  )

  const task = await poller.start('test-custom')

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (task.isCompleted) {
        clearInterval(checkInterval)
        console.log('自定义日志记录:', customLogs)
        resolve({ taskResult: task.result, logs: customLogs })
      }
    }, 100)
  })
}

// 运行所有测试
export async function runAllTests() {
  console.log('开始运行日志记录功能测试...\n')

  try {
    await testBasicPolling()
    await testErrorRetry()
    await testTimeout()
    await testCustomLogger()

    console.log('\n=== 所有测试完成 ===')
  } catch (error) {
    console.error('测试失败:', error)
  }
}

// 如果在浏览器环境中，可以直接运行
if (typeof window !== 'undefined') {
  ;(window as any).testPollingLogging = runAllTests
  console.log('在浏览器控制台中运行: testPollingLogging()')
}
