/**
 * 大纲章节服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 * 专门服务于大纲章节管理
 */

import BaseApiService from '../base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import { mockDataManager } from '@/mock'
import type {
  OutlineSectionBatchCreateRequest,
  OutlineSectionReorderRequest,
  OutlineSectionListResponse,
  OutlineSectionDeleteResponse,
  OutlineSectionBatchCreateResponse,
  OutlineSectionReorderResponse
} from '@/types/core'

// OutlineSection 相关类型已移至 @/types/core/outlineSection.ts

class OutlineSectionService extends BaseApiService {
  constructor() {
    super('outlineSections')
  }

  // ============= 大纲章节服务 =============

  /**
   * 获取大纲章节
   * @param outlineId 大纲ID
   * @param options API请求选项
   * @returns 章节列表
   */
  async getSectionsByOutline(outlineId: number, options?: ApiRequestConfig) {
    return this.get<OutlineSectionListResponse>(
      `/outlines/${outlineId}/sections`,
      undefined,
      options
    )
  }

  /**
   * 删除章节
   * @param sectionId 章节ID
   * @param options API请求选项
   * @returns 删除结果
   */
  async deleteSection(sectionId: number, options?: ApiRequestConfig) {
    return this.delete<OutlineSectionDeleteResponse>(`/sections/${sectionId}`, undefined, options)
  }

  /**
   * 批量创建章节
   * @param outlineId 大纲ID
   * @param request 批量创建请求参数
   * @param options API请求选项
   * @returns 创建结果
   */
  async batchCreateSections(
    outlineId: number,
    request: OutlineSectionBatchCreateRequest,
    options?: ApiRequestConfig
  ) {
    return this.post<OutlineSectionBatchCreateResponse>(
      `/outlines/${outlineId}/sections/batch`,
      request,
      options
    )
  }

  /**
   * 重新排序章节
   * @param request 重新排序请求参数
   * @param options API请求选项
   * @returns 排序结果
   */
  async reorderSections(request: OutlineSectionReorderRequest, options?: ApiRequestConfig) {
    return this.put<OutlineSectionReorderResponse>(`/sections/reorder`, request, options)
  }

  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { url, method, data } = config

    // 大纲章节相关API
    if (method === 'GET' && url.includes('/outlines/') && url.includes('/sections')) {
      const outlineId = url.split('/outlines/')[1].split('/')[0]
      return mockDataManager.getMockData('outline-section-list', outlineId)
    }

    if (method === 'DELETE' && url.includes('/sections/')) {
      const sectionId = url.split('/sections/')[1]
      return {
        id: sectionId,
        success: true,
        message: '章节已删除',
        deleted_at: new Date().toISOString(),
        mock: true,
        timestamp: Date.now()
      }
    }

    if (method === 'POST' && url.includes('/outlines/') && url.includes('/sections/batch')) {
      const outlineId = url.split('/outlines/')[1].split('/')[0]
      return mockDataManager.getMockData('outline-section-batch', outlineId, data)
    }

    if (method === 'PUT' && url.includes('/sections/reorder')) {
      return mockDataManager.getMockData('outline-section-reorder', data)
    }

    // 默认响应
    return {
      success: true,
      message: `大纲章节服务Mock响应 - ${method} ${url}`,
      data: { mock: true, timestamp: Date.now() }
    }
  }
}

// 创建单例实例
export const outlineSectionService = new OutlineSectionService()

export default outlineSectionService
