/**
 * 认证模块初始化文件
 * 负责设置依赖注入，避免循环依赖
 */

import { authManager } from './AuthManager'
import { authService } from '../authService'

/**
 * 初始化认证模块
 * 必须在应用启动时调用，以确保所有依赖关系正确设置
 */
export function initAuthModule() {
  console.log('[AuthInit] 开始初始化认证模块')

  try {
    // 将 authService 注入到 authManager 中
    authManager.setAuthService(authService)
    console.log('[AuthInit] authService 已注入到 authManager')

    console.log('[AuthInit] 认证模块初始化完成')
    return true
  } catch (error) {
    console.error('[AuthInit] 认证模块初始化失败:', error)
    return false
  }
}

/**
 * 获取认证管理器实例
 */
export function getAuthManager() {
  return authManager
}
