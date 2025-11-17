/**
 * 内容管理服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 * 专门服务于文档正文内容管理
 */

import BaseApiService from '../base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import { mockDataManager } from '@/mock'
import type {
  BodyCreateRequest,
  BodyUpdateRequest,
  BodyActivateRequest,
  BodyDeactivateRequest,
  BodyDetailResponse,
  BodyHistoryResponse,
  BodyCreateResponse,
  BodyUpdateResponse,
  BodyActiveResponse,
  TextStatsResponse,
  ReadabilityAnalysisResponse
} from '@/types/core'

// Body 相关类型已移至 @/types/core/body.ts

class BodyService extends BaseApiService {
  constructor() {
    super('bodies')
  }

  // ============= 正文内容服务 =============

  /**
   * 获取项目的所有正文
   * @param projectId 项目ID
   * @param skip 跳过数量（可选）
   * @param limit 返回数量（可选）
   * @param options API请求选项
   * @returns 正文列表
   */
  async getBodies(projectId: number, skip = 0, limit = 100, options?: ApiRequestConfig) {
    return this.get<BodyHistoryResponse>(
      `/bodies/projects/${projectId}/bodies`,
      { skip, limit },
      options
    )
  }

  /**
   * 获取活动正文
   * @param projectId 项目ID
   * @param options API请求选项
   * @returns 活动正文
   */
  async getActiveBody(projectId: number, options?: ApiRequestConfig) {
    return this.get<BodyActiveResponse>(
      `/bodies/projects/${projectId}/bodies/active`,
      undefined,
      options
    )
  }

  /**
   * 获取正文历史
   * @param projectId 项目ID
   * @param skip 跳过数量（可选）
   * @param limit 返回数量（可选）
   * @param options API请求选项
   * @returns 正文历史
   */
  async getBodyHistory(projectId: number, skip = 0, limit = 100, options?: ApiRequestConfig) {
    return this.get<BodyHistoryResponse>(
      `/bodies/projects/${projectId}/bodies/history`,
      { skip, limit },
      options
    )
  }

  /**
   * 删除正文
   * @param bodyId 正文ID
   * @param options API请求选项
   * @returns 删除结果
   */
  async deleteBody(bodyId: number, options?: ApiRequestConfig) {
    return this.delete(`/bodies/bodies/${bodyId}`, undefined, options)
  }

  /**
   * 创建正文
   * @param request 创建请求参数
   * @param options API请求选项
   * @returns 创建的正文
   */
  async createBody(request: BodyCreateRequest, options?: ApiRequestConfig) {
    return this.post<BodyCreateResponse>(`/bodies/bodies`, request, options)
  }

  /**
   * 更新正文
   * @param bodyId 正文ID
   * @param request 更新请求参数
   * @param options API请求选项
   * @returns 更新后的正文
   */
  async updateBody(bodyId: number, request: BodyUpdateRequest, options?: ApiRequestConfig) {
    return this.put<BodyUpdateResponse>(`/bodies/bodies/${bodyId}`, request, options)
  }

  /**
   * 激活正文
   * @param bodyId 正文ID
   * @param request 激活请求参数
   * @param options API请求选项
   * @returns 激活结果
   */
  async activateBody(bodyId: number, request: BodyActivateRequest, options?: ApiRequestConfig) {
    return this.put<BodyDetailResponse>(`/bodies/bodies/${bodyId}/activate`, request, options)
  }

  /**
   * 停用正文
   * @param bodyId 正文ID
   * @param request 停用请求参数（可选）
   * @param options API请求选项
   * @returns 停用结果
   */
  async deactivateBody(
    bodyId: number,
    request?: BodyDeactivateRequest,
    options?: ApiRequestConfig
  ) {
    return this.put(`/bodies/bodies/${bodyId}/deactivate`, request || {}, options)
  }

  /**
   * 获取文本统计
   * @param bodyId 正文ID
   * @param options API请求选项
   * @returns 文本统计
   */
  async getTextStats(bodyId: number, options?: ApiRequestConfig) {
    return this.get<TextStatsResponse>(`/bodies/bodies/${bodyId}/stats`, undefined, options)
  }

  /**
   * 获取可读性分析
   * @param bodyId 正文ID
   * @param options API请求选项
   * @returns 可读性分析
   */
  async getReadabilityAnalysis(bodyId: number, options?: ApiRequestConfig) {
    return this.get<ReadabilityAnalysisResponse>(
      `/bodies/bodies/${bodyId}/readability`,
      undefined,
      options
    )
  }

  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { url, method, data, params } = config

    // 正文相关API
    if (method === 'GET' && url.includes('/bodies/projects/')) {
      const queryParams = params || {}
      return mockDataManager.getMockData(
        'body-list',
        queryParams.project_id,
        queryParams.skip,
        queryParams.limit
      )
    }

    if (method === 'GET' && url.includes('/bodies/projects/') && url.includes('/active')) {
      const queryParams = params || {}
      return mockDataManager.getMockData('body-active', queryParams.project_id)
    }

    if (method === 'DELETE' && url.includes('/bodies/bodies/')) {
      const bodyId = url.split('/bodies/')[1]
      return {
        success: true,
        message: '正文已删除',
        body_id: bodyId,
        deleted_at: new Date().toISOString(),
        mock: true,
        timestamp: Date.now()
      }
    }

    if (method === 'PUT' && url.includes('/bodies/bodies/') && url.includes('/activate')) {
      const bodyId = url.split('/bodies/')[1].split('/')[0]
      return mockDataManager.getMockData('body-activate', bodyId, data)
    }

    if (method === 'PUT' && url.includes('/bodies/bodies/') && url.includes('/deactivate')) {
      const bodyId = url.split('/bodies/')[1].split('/')[0]
      return {
        success: true,
        message: '正文已停用',
        body_id: bodyId,
        deactivated_at: new Date().toISOString(),
        mock: true,
        timestamp: Date.now()
      }
    }

    if (method === 'GET' && url.includes('/bodies/bodies/') && url.includes('/stats')) {
      const bodyId = url.split('/bodies/')[1].split('/')[0]
      return mockDataManager.getMockData('body-stats', bodyId)
    }

    if (method === 'GET' && url.includes('/bodies/bodies/') && url.includes('/readability')) {
      const bodyId = url.split('/bodies/')[1].split('/')[0]
      return mockDataManager.getMockData('body-readability', bodyId)
    }

    // 默认响应
    return {
      success: true,
      message: `内容管理服务Mock响应 - ${method} ${url}`,
      data: { mock: true, timestamp: Date.now() }
    }
  }
}

// 创建单例实例
export const bodyService = new BodyService()

export default bodyService
