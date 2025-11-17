/**
 * 素材关联服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 * 专门服务于素材关联管理
 */

import BaseApiService from '../base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import { mockDataManager } from '@/mock'
import type {
  MaterialTitleUpdateScoreRequest,
  MaterialSectionUpdateTypeRequest,
  MaterialBatchBindTitleRequest,
  MaterialBatchBindSectionRequest,
  MaterialBatchUnbindRequest,
  MaterialTitleListResponse,
  MaterialSectionListResponse,
  MaterialRelationsResponse,
  MaterialUnbindResponse,
  MaterialUpdateResponse,
  MaterialBatchResponse
} from '@/types/core'

// MaterialRelation 相关类型已移至 @/types/core/materialRelation.ts

class MaterialRelationService extends BaseApiService {
  constructor() {
    super('materialRelations')
  }

  // ============= 素材关联服务 =============

  /**
   * 获取标题候选素材
   * @param titleCandidateId 标题候选ID
   * @param skip 跳过数量（可选）
   * @param limit 返回数量（可选）
   * @param options API请求选项
   * @returns 素材列表
   */
  async getTitleMaterials(
    titleCandidateId: number,
    skip = 0,
    limit = 100,
    options?: ApiRequestConfig
  ) {
    return this.get<MaterialTitleListResponse>(
      `/material-relations/titles/${titleCandidateId}/materials`,
      { skip, limit },
      options
    )
  }

  /**
   * 解除素材与标题的绑定
   * @param titleCandidateId 标题候选ID
   * @param materialId 素材ID
   * @param options API请求选项
   * @returns 解除结果
   */
  async unbindMaterialFromTitle(
    titleCandidateId: number,
    materialId: number,
    options?: ApiRequestConfig
  ) {
    return this.delete<MaterialUnbindResponse>(
      `/material-relations/titles/${titleCandidateId}/materials/${materialId}`,
      undefined,
      options
    )
  }

  /**
   * 更新标题关联评分
   * @param relationId 关联ID
   * @param request 更新请求参数
   * @param options API请求选项
   * @returns 更新结果
   */
  async updateTitleRelevanceScore(
    relationId: number,
    request: MaterialTitleUpdateScoreRequest,
    options?: ApiRequestConfig
  ) {
    return this.put<MaterialUpdateResponse>(
      `/material-relations/titles/relations/${relationId}/score`,
      request,
      options
    )
  }

  /**
   * 获取章节素材
   * @param outlineSectionId 章节ID
   * @param skip 跳过数量（可选）
   * @param limit 返回数量（可选）
   * @param options API请求选项
   * @returns 素材列表
   */
  async getSectionMaterials(
    outlineSectionId: number,
    skip = 0,
    limit = 100,
    options?: ApiRequestConfig
  ) {
    return this.get<MaterialSectionListResponse>(
      `/material-relations/sections/${outlineSectionId}/materials`,
      { skip, limit },
      options
    )
  }

  /**
   * 解除素材与章节的绑定
   * @param outlineSectionId 章节ID
   * @param materialId 素材ID
   * @param options API请求选项
   * @returns 解除结果
   */
  async unbindMaterialFromSection(
    outlineSectionId: number,
    materialId: number,
    options?: ApiRequestConfig
  ) {
    return this.delete<MaterialUnbindResponse>(
      `/material-relations/sections/${outlineSectionId}/materials/${materialId}`,
      undefined,
      options
    )
  }

  /**
   * 更新章节绑定类型
   * @param relationId 关联ID
   * @param request 更新请求参数
   * @param options API请求选项
   * @returns 更新结果
   */
  async updateSectionBindingType(
    relationId: number,
    request: MaterialSectionUpdateTypeRequest,
    options?: ApiRequestConfig
  ) {
    return this.put<MaterialUpdateResponse>(
      `/material-relations/sections/relations/${relationId}/binding-type`,
      request,
      options
    )
  }

  /**
   * 获取素材所有关联
   * @param materialId 素材ID
   * @param options API请求选项
   * @returns 关联列表
   */
  async getMaterialAllRelations(materialId: number, options?: ApiRequestConfig) {
    return this.get<MaterialRelationsResponse>(
      `/material-relations/materials/${materialId}/relations`,
      undefined,
      options
    )
  }

  /**
   * 批量绑定素材到标题
   * @param titleCandidateId 标题候选ID
   * @param request 批量绑定请求参数
   * @param options API请求选项
   * @returns 批量结果
   */
  async batchBindMaterialsToTitle(
    titleCandidateId: number,
    request: MaterialBatchBindTitleRequest,
    options?: ApiRequestConfig
  ) {
    return this.post<MaterialBatchResponse>(
      `/material-relations/titles/${titleCandidateId}/materials/batch`,
      request,
      options
    )
  }

  /**
   * 批量绑定素材到章节
   * @param outlineSectionId 章节ID
   * @param request 批量绑定请求参数
   * @param options API请求选项
   * @returns 批量结果
   */
  async batchBindMaterialsToSection(
    outlineSectionId: number,
    request: MaterialBatchBindSectionRequest,
    options?: ApiRequestConfig
  ) {
    return this.post<MaterialBatchResponse>(
      `/material-relations/sections/${outlineSectionId}/materials/batch`,
      request,
      options
    )
  }

  /**
   * 批量解除素材与标题的绑定
   * @param titleCandidateId 标题候选ID
   * @param request 批量解除请求参数
   * @param options API请求选项
   * @returns 批量结果
   */
  async batchUnbindMaterialsFromTitle(
    titleCandidateId: number,
    request: MaterialBatchUnbindRequest,
    options?: ApiRequestConfig
  ) {
    return this.post<MaterialBatchResponse>(
      `/material-relations/titles/${titleCandidateId}/materials/batch-unbind`,
      request,
      options
    )
  }

  /**
   * 批量解除素材与章节的绑定
   * @param outlineSectionId 章节ID
   * @param request 批量解除请求参数
   * @param options API请求选项
   * @returns 批量结果
   */
  async batchUnbindMaterialsFromSection(
    outlineSectionId: number,
    request: MaterialBatchUnbindRequest,
    options?: ApiRequestConfig
  ) {
    return this.post<MaterialBatchResponse>(
      `/material-relations/sections/${outlineSectionId}/materials/batch-unbind`,
      request,
      options
    )
  }

  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { url, method, data, params } = config

    // 素材关联相关API
    if (
      method === 'GET' &&
      url.includes('/material-relations/titles/') &&
      url.includes('/materials')
    ) {
      const titleCandidateId = url.split('/titles/')[1].split('/')[0]
      const queryParams = params || {}
      return mockDataManager.getMockData(
        'material-title-list',
        titleCandidateId,
        queryParams.skip,
        queryParams.limit
      )
    }

    if (method === 'DELETE' && url.includes('/material-relations/titles/')) {
      const parts = url.split('/')
      const titleIndex = parts.indexOf('titles')
      const materialIndex = parts.indexOf('materials')
      const titleCandidateId = parts[titleIndex + 1]
      const materialId = parts[materialIndex + 1]
      return {
        success: true,
        message: '素材已解除绑定',
        title_candidate_id: titleCandidateId,
        material_id: materialId,
        unbinded_at: new Date().toISOString(),
        mock: true,
        timestamp: Date.now()
      }
    }

    if (
      method === 'PUT' &&
      url.includes('/material-relations/titles/relations/') &&
      url.includes('/score')
    ) {
      const relationId = url.split('/relations/')[1].split('/')[0]
      return mockDataManager.getMockData('material-title-score', relationId, data)
    }

    if (
      method === 'GET' &&
      url.includes('/material-relations/sections/') &&
      url.includes('/materials')
    ) {
      const outlineSectionId = url.split('/sections/')[1].split('/')[0]
      const queryParams = params || {}
      return mockDataManager.getMockData(
        'material-section-list',
        outlineSectionId,
        queryParams.skip,
        queryParams.limit
      )
    }

    if (method === 'DELETE' && url.includes('/material-relations/sections/')) {
      const parts = url.split('/')
      const sectionIndex = parts.indexOf('sections')
      const materialIndex = parts.indexOf('materials')
      const outlineSectionId = parts[sectionIndex + 1]
      const materialId = parts[materialIndex + 1]
      return {
        success: true,
        message: '素材已解除绑定',
        outline_section_id: outlineSectionId,
        material_id: materialId,
        unbinded_at: new Date().toISOString(),
        mock: true,
        timestamp: Date.now()
      }
    }

    if (
      method === 'PUT' &&
      url.includes('/material-relations/sections/relations/') &&
      url.includes('/binding-type')
    ) {
      const relationId = url.split('/relations/')[1].split('/')[0]
      return mockDataManager.getMockData('material-section-type', relationId, data)
    }

    if (
      method === 'GET' &&
      url.includes('/material-relations/materials/') &&
      url.includes('/relations')
    ) {
      const materialId = url.split('/materials/')[1].split('/')[0]
      return mockDataManager.getMockData('material-relations', materialId)
    }

    if (
      method === 'POST' &&
      url.includes('/material-relations/titles/') &&
      url.includes('/materials/batch')
    ) {
      const titleCandidateId = url.split('/titles/')[1].split('/')[0]
      return mockDataManager.getMockData('material-title-batch', titleCandidateId, data)
    }

    if (
      method === 'POST' &&
      url.includes('/material-relations/sections/') &&
      url.includes('/materials/batch')
    ) {
      const outlineSectionId = url.split('/sections/')[1].split('/')[0]
      return mockDataManager.getMockData('material-section-batch', outlineSectionId, data)
    }

    if (
      method === 'POST' &&
      url.includes('/material-relations/titles/') &&
      url.includes('/materials/batch-unbind')
    ) {
      const titleCandidateId = url.split('/titles/')[1].split('/')[0]
      return mockDataManager.getMockData('material-title-batch-unbind', titleCandidateId, data)
    }

    if (
      method === 'POST' &&
      url.includes('/material-relations/sections/') &&
      url.includes('/materials/batch-unbind')
    ) {
      const outlineSectionId = url.split('/sections/')[1].split('/')[0]
      return mockDataManager.getMockData('material-section-batch-unbind', outlineSectionId, data)
    }

    // 默认响应
    return {
      success: true,
      message: `素材关联服务Mock响应 - ${method} ${url}`,
      data: { mock: true, timestamp: Date.now() }
    }
  }
}

// 创建单例实例
export const materialRelationService = new MaterialRelationService()

export default materialRelationService
