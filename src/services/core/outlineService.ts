/**
 * 大纲管理服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 * 专门服务于项目大纲管理
 */

import BaseApiService from '../base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import { mockDataManager } from '@/mock'
import type {
  OutlineCreateRequest,
  OutlineActivateRequest,
  OutlineDeactivateRequest,
  OutlineDetailResponse,
  OutlineHistoryResponse
} from '@/types/core'

// Outline 相关类型已移至 @/types/core/outline.ts

class OutlineService extends BaseApiService {
  constructor() {
    super('outlines')
  }

  // ============= 大纲管理服务 =============

  /**
   * 创建大纲
   * @param projectId 项目ID
   * @param request 创建请求参数
   * @param options API请求选项
   * @returns 创建结果
   */
  async createOutline(
    projectId: number,
    request: OutlineCreateRequest,
    options?: ApiRequestConfig
  ) {
    return this.post<OutlineDetailResponse>(`/projects/${projectId}/outlines`, request, options)
  }

  /**
   * 获取活动大纲
   * @param projectId 项目ID
   * @param options API请求选项
   * @returns 活动大纲
   */
  async getActiveOutline(projectId: number, options?: ApiRequestConfig) {
    return this.get<OutlineDetailResponse>(
      `/projects/${projectId}/outlines/active`,
      undefined,
      options
    )
  }

  /**
   * 获取大纲历史
   * @param projectId 项目ID
   * @param skip 跳过数量（可选）
   * @param limit 返回数量（可选）
   * @param options API请求选项
   * @returns 大纲历史
   */
  async getOutlineHistory(projectId: number, skip = 0, limit = 100, options?: ApiRequestConfig) {
    return this.get<OutlineHistoryResponse>(
      `/projects/${projectId}/outlines/history`,
      { skip, limit },
      options
    )
  }

  /**
   * 删除大纲
   * @param outlineId 大纲ID
   * @param options API请求选项
   * @returns 删除结果
   */
  async deleteOutline(outlineId: number, options?: ApiRequestConfig) {
    return this.delete(`/outlines/${outlineId}`, undefined, options)
  }

  /**
   * 激活大纲
   * @param outlineId 大纲ID
   * @param request 激活请求参数
   * @param options API请求选项
   * @returns 激活结果
   */
  async activateOutline(
    outlineId: number,
    request: OutlineActivateRequest,
    options?: ApiRequestConfig
  ) {
    return this.put<OutlineDetailResponse>(`/outlines/${outlineId}/activate`, request, options)
  }

  /**
   * 停用大纲
   * @param outlineId 大纲ID
   * @param request 停用请求参数（可选）
   * @param options API请求选项
   * @returns 停用结果
   */
  async deactivateOutline(
    outlineId: number,
    request?: OutlineDeactivateRequest,
    options?: ApiRequestConfig
  ) {
    return this.put<OutlineDetailResponse>(
      `/outlines/${outlineId}/deactivate`,
      request || {},
      options
    )
  }

  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { url, method, data, params } = config
    const queryParams = params || {}

    // 大纲相关API
    if (method === 'POST' && url.includes('/projects/') && url.includes('/outlines')) {
      const projectId = url.split('/projects/')[1].split('/')[0]
      return mockDataManager.getMockData('outline-create', projectId, data)
    }

    if (method === 'GET' && url.includes('/projects/') && url.includes('/outlines/active')) {
      const projectId = url.split('/projects/')[1].split('/')[0]
      return mockDataManager.getMockData('outline-active', projectId)
    }

    if (method === 'GET' && url.includes('/projects/') && url.includes('/outlines/history')) {
      const projectId = url.split('/projects/')[1].split('/')[0]
      return mockDataManager.getMockData(
        'outline-history',
        projectId,
        queryParams.skip,
        queryParams.limit
      )
    }

    if (method === 'DELETE' && url.includes('/outlines/')) {
      const outlineId = url.split('/outlines/')[1]
      return {
        success: true,
        message: '大纲已删除',
        outline_id: outlineId,
        deleted_at: new Date().toISOString(),
        mock: true,
        timestamp: Date.now()
      }
    }

    if (method === 'PUT' && url.includes('/outlines/') && url.includes('/activate')) {
      const outlineId = url.split('/outlines/')[1].split('/')[0]
      return mockDataManager.getMockData('outline-activate', outlineId, data)
    }

    if (method === 'PUT' && url.includes('/outlines/') && url.includes('/deactivate')) {
      const outlineId = url.split('/outlines/')[1].split('/')[0]
      return {
        id: outlineId,
        success: true,
        message: '大纲已停用',
        deactivated_at: new Date().toISOString(),
        mock: true,
        timestamp: Date.now()
      }
    }

    // 默认响应
    return {
      success: true,
      message: `大纲管理服务Mock响应 - ${method} ${url}`,
      data: { mock: true, timestamp: Date.now() }
    }
  }
}

// 创建单例实例
export const outlineService = new OutlineService()

export default outlineService
