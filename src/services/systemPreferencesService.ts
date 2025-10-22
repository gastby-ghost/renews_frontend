/**
 * 系统偏好设置服务 - 基于OpenAPI配置
 * 使用system模块的preferences功能
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'

class SystemPreferencesService extends BaseApiService {
  constructor() {
    super('system')
  }

  /**
   * 获取用户偏好设置
   */
  async getUserPreferences(options?: ApiRequestConfig) {
    return this.get<any>('/preferences', undefined, options)
  }

  /**
   * 更新用户偏好设置
   */
  async updateUserPreferences(
    params: {
      theme?: string
      language?: string
      notifications?: object
      privacy?: object
    },
    options?: ApiRequestConfig
  ) {
    return this.put<any>('/preferences', params, options)
  }

  /**
   * 获取默认偏好设置
   */
  async getDefaultPreferences(options?: ApiRequestConfig) {
    return this.get<any>('/preferences/default', undefined, options)
  }

  /**
   * 重置用户偏好设置为默认值
   */
  async resetUserPreferences(options?: ApiRequestConfig) {
    // 获取默认设置
    const defaultPrefs = await this.getDefaultPreferences(options)
    // 应用默认设置
    return this.updateUserPreferences(defaultPrefs, options)
  }

  /**
   * 更新主题设置
   */
  async updateTheme(theme: string, options?: ApiRequestConfig) {
    const currentPrefs = await this.getUserPreferences(options)
    return this.updateUserPreferences(
      {
        ...currentPrefs,
        theme
      },
      options
    )
  }

  /**
   * 更新语言设置
   */
  async updateLanguage(language: string, options?: ApiRequestConfig) {
    const currentPrefs = await this.getUserPreferences(options)
    return this.updateUserPreferences(
      {
        ...currentPrefs,
        language
      },
      options
    )
  }

  /**
   * 更新通知设置
   */
  async updateNotifications(notifications: object, options?: ApiRequestConfig) {
    const currentPrefs = await this.getUserPreferences(options)
    return this.updateUserPreferences(
      {
        ...currentPrefs,
        notifications
      },
      options
    )
  }

  /**
   * 更新隐私设置
   */
  async updatePrivacy(privacy: object, options?: ApiRequestConfig) {
    const currentPrefs = await this.getUserPreferences(options)
    return this.updateUserPreferences(
      {
        ...currentPrefs,
        privacy
      },
      options
    )
  }

  /**
   * Mock实现方法
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    const apiConfig = this.getCurrentConfig()

    if (apiConfig.showDebugInfo) {
      console.log(`[API-${this.serviceName}] 执行Mock实现:`, {
        url: config.url,
        method: config.method,
        data: config.data
      })
    }

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 1000))

    const url = config.url
    const method = config.method

    try {
      // 获取用户偏好设置
      if (method === 'GET' && url.includes('/preferences') && !url.includes('/default')) {
        return {
          theme: 'light',
          language: 'zh-CN',
          notifications: {
            email: true,
            push: false,
            desktop: true
          },
          privacy: {
            analytics: true,
            marketing: false,
            personalization: true
          }
        }
      }

      // 获取默认偏好设置
      if (method === 'GET' && url.includes('/preferences/default')) {
        return {
          theme: 'light',
          language: 'zh-CN',
          notifications: {
            email: true,
            push: false,
            desktop: true
          },
          privacy: {
            analytics: false,
            marketing: false,
            personalization: false
          }
        }
      }

      // 更新用户偏好设置
      if (method === 'PUT' && url.includes('/preferences')) {
        const requestData = config.data
        return {
          success: true,
          message: '偏好设置更新成功',
          data: {
            ...requestData,
            updated_at: new Date().toISOString()
          }
        }
      }

      // 默认Mock响应
      return {
        success: true,
        message: `系统偏好设置服务Mock响应 - ${method} ${url}`,
        data: {
          mock: true,
          timestamp: Date.now(),
          request_info: {
            url,
            method,
            data: config.data
          }
        }
      }
    } catch (error) {
      console.error(`[API-${this.serviceName}] Mock数据获取失败:`, error)

      return {
        success: false,
        message: `Mock数据获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }
}

// 创建单例实例
export const systemPreferencesService = new SystemPreferencesService()
export { SystemPreferencesService }
export default systemPreferencesService
