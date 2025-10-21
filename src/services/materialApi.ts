import BaseApiService from './base/apiService'
import { mockDataManager } from '@/mock'
import type { Material, SearchResultMaterial } from '@/types/material'
import type { ApiRequestConfig } from '@/config/api/types'

// 素材API响应类型定义
export interface MaterialResponse {
  id: number
  title: string
  summary: string
  url?: string
  score?: number
  key_excerpts?: string[]
  user_id: number
  created_at: string
  updated_at: string
  tags: string[]
}

export interface MaterialListResponse {
  success: boolean
  message: string
  materials: MaterialResponse[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
}

export interface MaterialCreateRequest {
  title: string
  summary: string
  url?: string
  score?: number
  key_excerpts?: string[]
  tags?: string[]
}

export interface AddCompleteMaterialRequest {
  project_id: number
  materials: CompleteMaterialData[]
}

export interface CompleteMaterialData {
  title: string
  summary: string
  url?: string
  score?: number
  key_excerpts?: string[]
  tags?: string[]
}

export interface MaterialUpdateRequest {
  update_data: Partial<MaterialCreateRequest>
}

export interface MaterialDeleteRequest {
  material_ids: number[]
}

export interface MaterialDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
  failed_count: number
  details?: any[]
}

export interface TagCreateRequest {
  name: string
}

export interface TagResponse {
  id: number
  name: string
  is_system: boolean
  material_count: number
  created_at: string
}

/**
 * 素材API服务类
 * 用于与素材管理后端API交互
 */
class MaterialApiService extends BaseApiService {
  constructor() {
    super('material')
  }

  /**
   * 批量创建素材
   * @param project_id 项目ID
   * @param materials 素材数据列表
   * @returns 创建结果
   */
  async createMaterials(
    projectId: number,
    materials: CompleteMaterialData[]
  ): Promise<MaterialListResponse> {
    const request: AddCompleteMaterialRequest = {
      project_id: projectId,
      materials
    }

    return this.post<MaterialListResponse>('/materials/batch', request)
  }

  /**
   * 获取项目素材列表
   * @param projectId 项目ID
   * @param params 查询参数
   * @returns 素材列表
   */
  async getProjectMaterials(
    projectId: number,
    params?: {
      page?: number
      page_size?: number
      keywords?: string
      tags?: string[]
    }
  ): Promise<MaterialListResponse> {
    return this.get<MaterialListResponse>(`/projects/${projectId}/materials`, params)
  }

  /**
   * 获取所有素材列表
   * @param params 查询参数
   * @returns 素材列表
   */
  async getAllMaterials(params?: {
    page?: number
    page_size?: number
    keywords?: string
    tags?: string[]
  }): Promise<MaterialListResponse> {
    return this.get<MaterialListResponse>('/materials', params)
  }

  /**
   * 更新素材
   * @param materialId 素材ID
   * @param updateData 更新数据
   * @returns 更新后的素材
   */
  async updateMaterial(
    materialId: number,
    updateData: Partial<MaterialCreateRequest>
  ): Promise<MaterialResponse> {
    const request: MaterialUpdateRequest = {
      update_data: updateData
    }

    return this.put<MaterialResponse>(`/materials/${materialId}`, request)
  }

  /**
   * 批量删除素材
   * @param materialIds 素材ID列表
   * @returns 删除结果
   */
  async deleteMaterials(materialIds: number[]): Promise<MaterialDeleteResponse> {
    const request: MaterialDeleteRequest = {
      material_ids: materialIds
    }

    return this.delete<MaterialDeleteResponse>('/materials', request)
  }

  /**
   * 创建标签
   * @param name 标签名称
   * @returns 创建的标签
   */
  async createTag(name: string): Promise<TagResponse> {
    const request: TagCreateRequest = { name }
    return this.post<TagResponse>('/tags', request)
  }

  /**
   * 将搜索结果转换为素材创建数据
   * @param searchResult 搜索结果素材
   * @returns 素材创建数据
   */
  static convertSearchResultToMaterialData(
    searchResult: SearchResultMaterial
  ): CompleteMaterialData {
    // 添加调试日志：检查转换前的tags
    console.log('[MaterialApiService] 转换前的SearchResultMaterial tags:', {
      title: searchResult.title,
      url: searchResult.url,
      tags: searchResult.tags,
      tagsType: typeof searchResult.tags,
      tagsLength: searchResult.tags ? searchResult.tags.length : 'N/A'
    })

    const materialData = {
      title: searchResult.title,
      summary: searchResult.summary,
      url: searchResult.url,
      score: searchResult.score,
      key_excerpts: searchResult.key_excerpts,
      tags: searchResult.tags
    }

    // 添加调试日志：检查转换后的CompleteMaterialData tags
    console.log('[MaterialApiService] 转换后的CompleteMaterialData tags:', {
      title: materialData.title,
      tags: materialData.tags,
      tagsType: typeof materialData.tags,
      tagsLength: materialData.tags ? materialData.tags.length : 'N/A'
    })

    return materialData
  }

  /**
   * 将API响应转换为前端素材格式
   * @param apiMaterial API响应的素材
   * @returns 前端素材格式
   */
  static convertApiMaterialToMaterial(apiMaterial: MaterialResponse): Material {
    return {
      id: apiMaterial.id.toString(),
      title: apiMaterial.title,
      source: '', // API响应中没有source字段，需要从URL提取或设为空
      summary: apiMaterial.summary,
      url: apiMaterial.url,
      tags: apiMaterial.tags,
      type: 'text', // 默认类型，可以根据URL或其他信息判断
      createdAt: new Date(apiMaterial.created_at),
      updatedAt: new Date(apiMaterial.updated_at),
      score: apiMaterial.score,
      key_excerpts: apiMaterial.key_excerpts
    } as Material
  }

  /**
   * Mock实现方法
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    const { url, method, data, params } = config

    // 根据不同的API端点返回相应的Mock数据
    if (url?.includes('/materials/batch') && method === 'POST') {
      return mockDataManager.getMockData('material-list', 1, data.materials.length)
    }

    if (url?.includes('/projects/') && url?.includes('/materials') && method === 'GET') {
      return mockDataManager.getMockData(
        'material-list',
        params?.page || 1,
        params?.page_size || 20,
        params?.keywords
      )
    }

    if (url?.includes('/materials') && method === 'GET' && !url?.includes('/projects/')) {
      return mockDataManager.getMockData(
        'material-list',
        params?.page || 1,
        params?.page_size || 20,
        params?.keywords
      )
    }

    if (url?.includes('/materials/') && method === 'PUT') {
      return mockDataManager.getMockData('material-update')
    }

    if (url?.includes('/materials') && method === 'DELETE') {
      return mockDataManager.getMockData('batch-delete-materials', data.material_ids)
    }

    if (url?.includes('/tags') && method === 'POST') {
      return mockDataManager.getMockData('create-tag', data.name)
    }

    if (url?.includes('/tags') && method === 'GET') {
      return mockDataManager.getMockData('material-tags')
    }

    throw new Error(`未实现的Mock API: ${method} ${url}`)
  }
}

export const materialApiService = new MaterialApiService()
export { MaterialApiService }
