/**
 * 开发工具初始化
 * 统一管理开发模式下的功能
 */

import { apiConfigManager } from '@/config/api'
import { mockDataManager } from '@/mock'

/**
 * 初始化开发工具
 */
export function initDevTools(): void {
  // 只在开发模式下执行
  if (!import.meta.env.DEV) {
    return
  }

  console.log('[开发工具] 初始化开发模式功能...')

  // 初始化API配置
  initApiConfig()

  // 验证API配置
  validateApiConfig()

  // 注册全局调试方法
  registerGlobalDebugMethods()

  // 监听开发模式快捷键
  setupDevShortcuts()

  console.log('[开发工具] 开发模式功能初始化完成')
}

/**
 * 初始化API配置
 */
function initApiConfig(): void {
  // 从环境变量读取配置
  const useMock = import.meta.env.VITE_USE_MOCK === 'true'
  const mockDelay = parseInt(import.meta.env.VITE_MOCK_DELAY || '1000')
  const showDebugInfo = import.meta.env.VITE_API_DEBUG === 'true'

  // 更新配置
  apiConfigManager.updateConfig({
    useMock,
    mockDelay,
    showDebugInfo
  })

  console.log('[开发工具] API配置已初始化:', {
    useMock,
    mockDelay,
    showDebugInfo
  })
}

/**
 * 验证API配置
 */
function validateApiConfig(): void {
  const result = apiConfigManager.validateApiConfig()

  if (!result.isValid) {
    console.warn('[开发工具] API配置验证失败:', result.errors)
  } else {
    console.log('[开发工具] API配置验证通过')
  }
}

/**
 * 注册全局调试方法
 */
function registerGlobalDebugMethods(): void {
  // 将API配置管理器暴露到全局
  ;(window as any).__API_CONFIG__ = apiConfigManager
  ;(window as any).__MOCK_DATA__ = mockDataManager

  // 注册便捷方法
  ;(window as any).__DEV_TOOLS__ = {
    // 切换Mock模式
    toggleMock: () => {
      const currentConfig = apiConfigManager.getConfig()
      apiConfigManager.setUseMock(!currentConfig.useMock)
      console.log(`[开发工具] Mock模式已${!currentConfig.useMock ? '开启' : '关闭'}`)
    },

    // 设置Mock延迟
    setMockDelay: (delay: number) => {
      apiConfigManager.setMockDelay(delay)
      console.log(`[开发工具] Mock延迟已设置为 ${delay}ms`)
    },

    // 清除Mock缓存
    clearMockCache: (key?: string) => {
      mockDataManager.clearCache(key)
      console.log(`[开发工具] Mock缓存已清除${key ? ` (${key})` : ''}`)
    },

    // 获取当前配置
    getConfig: () => {
      return apiConfigManager.getConfig()
    },

    // 获取缓存统计
    getCacheStats: () => {
      return mockDataManager.getCacheStats()
    },

    // 重置配置
    resetConfig: () => {
      apiConfigManager.resetToDefault()
      console.log('[开发工具] 配置已重置为默认值')
    },

    // 获取服务信息
    getServiceInfo: (serviceName: string) => {
      return apiConfigManager.getServiceInfo(serviceName)
    },

    // 获取所有服务信息
    getAllServicesInfo: () => {
      return apiConfigManager.getAllServicesInfo()
    },

    // 获取API注册表
    getApiRegistry: () => {
      return apiConfigManager.getApiRegistry()
    },

    // 验证API配置
    validateConfig: () => {
      return apiConfigManager.validateApiConfig()
    },

    // 检查方法支持
    isMethodSupported: (serviceName: string, path: string, method: string) => {
      return apiConfigManager.isMethodSupported(serviceName, path, method as any)
    },

    // 构建API URL
    buildUrl: (serviceName: string, path: string, params?: Record<string, string>) => {
      return apiConfigManager.buildApiUrl(serviceName, path, params)
    },

    // 获取服务列表
    getServices: () => {
      return apiConfigManager.getServices()
    },

    // 获取服务信息
    getServiceInfo: (moduleName: string) => {
      return apiConfigManager.getServiceInfo(moduleName as any)
    },

    // 获取所有服务的详细信息
    getAllServicesDetailedInfo: () => {
      return apiConfigManager.getAllServicesDetailedInfo()
    },

    // 验证模块配置
    validateModules: () => {
      return apiConfigManager.validateModules()
    },

    // 获取开发环境详细信息
    getDevInfo: () => {
      return getDevInfo()
    }
  }

  console.log('[开发工具] 全局调试方法已注册')
  console.log('[开发工具] 使用 window.__DEV_TOOLS__ 访问开发工具')
}

/**
 * 设置开发模式快捷键
 */
function setupDevShortcuts(): void {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + D: 切换调试模式
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault()
      const currentConfig = apiConfigManager.getConfig()
      apiConfigManager.setShowDebugInfo(!currentConfig.showDebugInfo)
      console.log(`[开发工具] 调试信息已${!currentConfig.showDebugInfo ? '开启' : '关闭'}`)
    }

    // Ctrl/Cmd + Shift + C: 清除Mock缓存
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault()
      mockDataManager.clearCache()
      console.log('[开发工具] 所有Mock缓存已清除')
    }

    // Ctrl/Cmd + Shift + R: 重置配置
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
      e.preventDefault()
      apiConfigManager.resetToDefault()
      console.log('[开发工具] API配置已重置')
    }

    // Ctrl/Cmd + Shift + V: 验证配置
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
      e.preventDefault()
      const result = apiConfigManager.validateApiConfig()
      console.log('[开发工具] 配置验证结果:', result)
    }
  })
}

/**
 * 获取开发环境信息
 */
export function getDevInfo(): Record<string, any> {
  return {
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE,
    baseUrl: import.meta.env.BASE_URL,
    apiUrl: import.meta.env.VITE_API_URL,
    useMock: import.meta.env.VITE_USE_MOCK === 'true',
    mockDelay: import.meta.env.VITE_MOCK_DELAY,
    apiDebug: import.meta.env.VITE_API_DEBUG === 'true',
    config: apiConfigManager.getConfig(),
    cacheStats: mockDataManager.getCacheStats(),
    servicesInfo: apiConfigManager.getAllServicesInfo(),
    apiRegistry: apiConfigManager.getApiRegistry(),
    validation: apiConfigManager.validateApiConfig()
  }
}

// 自动初始化（只在开发模式下）
if (import.meta.env.DEV) {
  initDevTools()
}
