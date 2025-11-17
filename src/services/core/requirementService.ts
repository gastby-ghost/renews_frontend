/**
 * 需求管理服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 * 专门服务于项目需求管理
 */

import BaseApiService from '../base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import { mockDataManager } from '@/mock'
import type { RequirementListResponse, RequirementDeleteResponse } from '@/types/core'

// Requirement 相关类型已移至 @/types/core/requirement.ts

class RequirementService extends BaseApiService {
  constructor() {
    super('requirements')
  }

  // ============= 需求管理服务 =============

  /**
   * 获取项目需求
   * @param projectId 项目ID
   * @param options API请求选项
   * @returns 需求列表
   */
  async getProjectRequirements(projectId: number, options?: ApiRequestConfig) {
    return this.get<RequirementListResponse>(
      `/projects/${projectId}/requirements`,
      undefined,
      options
    )
  }

  /**
   * 删除需求
   * @param requirementId 需求ID
   * @param options API请求选项
   * @returns 删除结果
   */
  async deleteRequirement(requirementId: number, options?: ApiRequestConfig) {
    return this.delete<RequirementDeleteResponse>(
      `/requirements/${requirementId}`,
      undefined,
      options
    )
  }

  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { url, method } = config

    // 需求相关API
    if (method === 'GET' && url.includes('/projects/') && url.includes('/requirements')) {
      const projectId = url.split('/projects/')[1].split('/')[0]
      return mockDataManager.getMockData('requirement-list', projectId)
    }

    if (method === 'DELETE' && url.includes('/requirements/')) {
      const requirementId = url.split('/requirements/')[1]
      return {
        requirement_id: requirementId,
        success: true,
        message: '需求已删除',
        deleted_at: new Date().toISOString(),
        mock: true,
        timestamp: Date.now()
      }
    }

    // 默认响应
    return {
      success: true,
      message: `需求管理服务Mock响应 - ${method} ${url}`,
      data: { mock: true, timestamp: Date.now() }
    }
  }
}

// 创建单例实例
export const requirementService = new RequirementService()

export default requirementService
