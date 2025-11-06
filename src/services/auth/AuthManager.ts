/**
 * 认证管理器 - 独立的认证逻辑管理
 * 避免与 userStore 产生循环依赖
 */

import * as Api from '@/types/api'

export class AuthManager {
  private static instance: AuthManager
  private authService: any = null

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  /**
   * 设置 authService 实例（延迟注入）
   */
  setAuthService(service: any) {
    this.authService = service
  }

  /**
   * 获取 authService 实例
   */
  getAuthService() {
    if (!this.authService) {
      throw new Error('AuthService 尚未初始化，请先调用 setAuthService')
    }
    return this.authService
  }

  /**
   * 处理登录响应
   */
  async handleLoginResponse(authResponse: Api.Auth.AuthResponse): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const service = this.getAuthService()

    if (authResponse.success && authResponse.token) {
      // 这里可以添加登录逻辑，但不直接依赖 userStore
      // 返回处理结果，让调用者决定如何更新状态
      return true
    }

    return false
  }

  /**
   * 处理登出
   */
  async handleLogout(): Promise<void> {
    const service = this.getAuthService()
    try {
      await service.logout()
    } catch (error) {
      console.error('登出API调用失败:', error)
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(refreshToken: string): Promise<boolean> {
    const service = this.getAuthService()
    try {
      const response = await service.refreshToken(refreshToken)

      // 处理刷新令牌响应
      if (response && typeof response === 'object' && Object.keys(response).length === 0) {
        console.log('[AuthManager] 刷新令牌成功')
        return true
      }

      if (response && 'success' in response) {
        const authResponse = response as Api.Auth.AuthResponse
        if (authResponse.success && authResponse.token) {
          return true
        }
      }

      return false
    } catch (error) {
      console.error('刷新令牌失败:', error)
      return false
    }
  }
}

export const authManager = AuthManager.getInstance()
