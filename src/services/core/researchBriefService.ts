/**
 * 研究简报服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 * 专门服务于研究简报管理
 */

import BaseApiService from '../base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import { mockDataManager } from '@/mock'
import type { ResearchBriefListResponse, ResearchBriefDeleteResponse } from '@/types/core'

// ResearchBrief 相关类型已移至 @/types/core/researchBrief.ts

class ResearchBriefService extends BaseApiService {
  constructor() {
    super('researchBriefs')
  }

  // ============= 研究简报服务 =============

  /**
   * 获取项目简报
   * @param projectId 项目ID
   * @param options API请求选项
   * @returns 简报列表
   */
  async getProjectBriefs(projectId: number, options?: ApiRequestConfig) {
    return this.get<ResearchBriefListResponse>(`/projects/${projectId}/briefs`, undefined, options)
  }

  /**
   * 删除研究简报
   * @param briefId 简报ID
   * @param options API请求选项
   * @returns 删除结果
   */
  async deleteResearchBrief(briefId: number, options?: ApiRequestConfig) {
    return this.delete<ResearchBriefDeleteResponse>(`/briefs/${briefId}`, undefined, options)
  }

  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { url, method } = config

    // 研究简报相关API
    if (method === 'GET' && url.includes('/projects/') && url.includes('/briefs')) {
      const projectId = url.split('/projects/')[1].split('/')[0]
      return mockDataManager.getMockData('research-brief-list', projectId)
    }

    if (method === 'DELETE' && url.includes('/briefs/')) {
      const briefId = url.split('/briefs/')[1]
      return {
        brief_id: briefId,
        success: true,
        message: '研究简报已删除',
        deleted_at: new Date().toISOString(),
        mock: true,
        timestamp: Date.now()
      }
    }

    // 默认响应
    return {
      success: true,
      message: `研究简报服务Mock响应 - ${method} ${url}`,
      data: { mock: true, timestamp: Date.now() }
    }
  }
}

// 创建单例实例
export const researchBriefService = new ResearchBriefService()

export default researchBriefService
