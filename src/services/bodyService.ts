import http from '@/utils/http'
import { mockDataManager } from '@/mock'

export interface BodyCreate {
  title?: string
  content?: string
  status?: 'draft' | 'active' | 'archived'
  metadata?: Record<string, any>
}

export interface Body {
  id: number
  project_id: number
  title: string
  content: string
  status: 'draft' | 'active' | 'archived'
  version: number
  created_at: string
  updated_at: string
  activated_at?: string
  metadata?: Record<string, any>
}

export interface BodyCreateResponse {
  id: number
  project_id: number
  title: string
  content: string
  status: 'draft' | 'active' | 'archived'
  version: number
  created_at: string
  updated_at: string
  activated_at?: string
  metadata?: Record<string, any>
}

export interface BodyHistoryResponse {
  items: Body[]
  total: number
}

export interface BodyActiveResponse {
  id: number
  project_id: number
  title: string
  content: string
  status: 'draft' | 'active' | 'archived'
  version: number
  created_at: string
  updated_at: string
  activated_at?: string
  metadata?: Record<string, any>
}

export interface BodyDetailResponse {
  id: number
  project_id: number
  title: string
  content: string
  status: 'draft' | 'active' | 'archived'
  version: number
  created_at: string
  updated_at: string
  activated_at?: string
  metadata?: Record<string, any>
}

export interface BodyUpdate {
  title?: string
  content?: string
  status?: 'draft' | 'active' | 'archived'
  metadata?: Record<string, any>
}

export interface BodyUpdateResponse {
  id: number
  project_id: number
  title: string
  content: string
  status: 'draft' | 'active' | 'archived'
  version: number
  created_at: string
  updated_at: string
  activated_at?: string
  metadata?: Record<string, any>
}

export interface BodyDeactivateResponse {
  id: number
  success: boolean
  message: string
}

export interface BodyActivateRequest {
  reason?: string
}

export interface BodyActivateResponse {
  id: number
  project_id: number
  title: string
  content: string
  status: 'draft' | 'active' | 'archived'
  version: number
  created_at: string
  updated_at: string
  activated_at: string
  metadata?: Record<string, any>
}

export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  paragraphs: number
  sentences: number
  readingTime: number
  headings: number
  headingsByLevel: Record<string, number>
  links: number
  images: number
  codeBlocks: number
  listItems: number
  avgSentenceLength: number
  avgParagraphLength: number
}

export interface TextStatsResponse {
  body_id: number
  stats: TextStats
  calculated_at: string
}

export interface ReadabilityScore {
  score: number
  level:
    | 'very_easy'
    | 'easy'
    | 'fairly_easy'
    | 'standard'
    | 'fairly_difficult'
    | 'difficult'
    | 'very_difficult'
  description: string
}

export interface ReadabilityAnalysisResponse {
  body_id: number
  readability: ReadabilityScore
  suggestions: string[]
  analyzed_at: string
}

export const bodyService = {
  /**
   * 创建正文
   */
  async createBody(projectId: number, data: BodyCreate): Promise<BodyCreateResponse> {
    // Mock支持
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      console.log('[MOCK] createBody called:', { projectId, data })
      return mockDataManager.getMockData('body-create', projectId, data)
    }

    const response = await http.post<BodyCreateResponse>(
      `/api/v1/core/bodies/projects/${projectId}/bodies`,
      data
    )
    return response.data
  },

  /**
   * 获取项目的所有正文（分页）
   */
  async getBodies(projectId: number, skip = 0, limit = 100): Promise<BodyHistoryResponse> {
    // Mock支持
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      console.log('[MOCK] getBodies called:', { projectId, skip, limit })
      return mockDataManager.getMockData('bodies-get', projectId, skip, limit)
    }

    const response = await http.get<BodyHistoryResponse>(
      `/api/v1/core/bodies/projects/${projectId}/bodies`,
      { params: { skip, limit } }
    )
    return response.data
  },

  /**
   * 获取活动正文
   */
  async getActiveBody(projectId: number): Promise<BodyActiveResponse> {
    // Mock支持
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      console.log('[MOCK] getActiveBody called:', { projectId })
      return mockDataManager.getMockData('body-active', projectId)
    }

    const response = await http.get<BodyActiveResponse>(
      `/api/v1/core/bodies/projects/${projectId}/bodies/active`
    )
    return response.data
  },

  /**
   * 获取正文历史
   */
  async getBodyHistory(projectId: number, skip = 0, limit = 100): Promise<BodyHistoryResponse> {
    // Mock支持
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      console.log('[MOCK] getBodyHistory called:', { projectId, skip, limit })
      return mockDataManager.getMockData('body-history', projectId, skip, limit)
    }

    const response = await http.get<BodyHistoryResponse>(
      `/api/v1/core/bodies/projects/${projectId}/bodies/history`,
      { params: { skip, limit } }
    )
    return response.data
  },

  /**
   * 获取正文详情
   */
  async getBody(bodyId: number): Promise<BodyDetailResponse> {
    // Mock支持
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      console.log('[MOCK] getBody called:', { bodyId })
      return mockDataManager.getMockData('body-detail', bodyId)
    }

    const response = await http.get<BodyDetailResponse>(`/api/v1/core/bodies/bodies/${bodyId}`)
    return response.data
  },

  /**
   * 更新正文内容
   */
  async updateBody(bodyId: number, data: BodyUpdate): Promise<BodyUpdateResponse> {
    // Mock支持
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      console.log('[MOCK] updateBody called:', { bodyId, data })
      return mockDataManager.getMockData('body-update', bodyId, data)
    }

    const response = await http.put<BodyUpdateResponse>(
      `/api/v1/core/bodies/bodies/${bodyId}`,
      data
    )
    return response.data
  },

  /**
   * 删除正文（停用）
   */
  async deleteBody(bodyId: number): Promise<BodyDeactivateResponse> {
    // Mock支持
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      console.log('[MOCK] deleteBody called:', { bodyId })
      return mockDataManager.getMockData('body-delete', bodyId)
    }

    const response = await http.delete<BodyDeactivateResponse>(
      `/api/v1/core/bodies/bodies/${bodyId}`
    )
    return response.data
  },

  /**
   * 激活正文版本
   */
  async activateBody(bodyId: number, data: BodyActivateRequest): Promise<BodyActivateResponse> {
    // Mock支持
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      console.log('[MOCK] activateBody called:', { bodyId, data })
      return mockDataManager.getMockData('body-activate', bodyId, data)
    }

    const response = await http.put<BodyActivateResponse>(
      `/api/v1/core/bodies/bodies/${bodyId}/activate`,
      data
    )
    return response.data
  },

  /**
   * 停用正文版本
   */
  async deactivateBody(bodyId: number): Promise<BodyDeactivateResponse> {
    // Mock支持
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      console.log('[MOCK] deactivateBody called:', { bodyId })
      return mockDataManager.getMockData('body-deactivate', bodyId)
    }

    const response = await http.put<BodyDeactivateResponse>(
      `/api/v1/core/bodies/bodies/${bodyId}/deactivate`,
      {}
    )
    return response.data
  },

  /**
   * 获取文本统计
   */
  async getTextStats(bodyId: number): Promise<TextStatsResponse> {
    // Mock支持
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      console.log('[MOCK] getTextStats called:', { bodyId })
      return mockDataManager.getMockData('body-text-stats', bodyId)
    }

    const response = await http.get<TextStatsResponse>(`/api/v1/core/bodies/bodies/${bodyId}/stats`)
    return response.data
  },

  /**
   * 获取可读性分析
   */
  async getReadabilityAnalysis(bodyId: number): Promise<ReadabilityAnalysisResponse> {
    // Mock支持
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      console.log('[MOCK] getReadabilityAnalysis called:', { bodyId })
      return mockDataManager.getMockData('body-readability', bodyId)
    }

    const response = await http.get<ReadabilityAnalysisResponse>(
      `/api/v1/core/bodies/bodies/${bodyId}/readability`
    )
    return response.data
  }
}
