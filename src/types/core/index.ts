/**
 * Core 服务类型定义统一导出文件
 * 集中管理所有 Core API 服务的类型定义
 * 对应 services/core 目录中的各个服务文件
 */

// 认证服务类型
export * from './auth'

// 项目管理服务类型
export * from './project'

// 素材管理服务类型
export * from './material'

// 内容管理服务类型
export * from './body'

// 大纲管理服务类型
export * from './outline'

// 大纲章节服务类型
export * from './outlineSection'

// 素材关联服务类型
export * from './materialRelation'

// 需求管理服务类型
export * from './requirement'

// 研究简报服务类型
export * from './researchBrief'

// 通用Core服务类型
export interface CoreServiceResponse<T = any> {
  success: boolean
  message: string
  data?: T
  timestamp?: string
}

export interface CoreServiceError {
  success: false
  message: string
  error?: string
  code?: string
  timestamp?: string
}

export interface CorePaginationParams {
  page?: number
  page_size?: number
  skip?: number
  limit?: number
}

export interface CorePaginationResponse {
  page: number
  page_size: number
  total: number
  total_pages: number
  has_next?: boolean
  has_prev?: boolean
}

export interface CoreSortParams {
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface CoreSearchParams {
  search?: string
  keywords?: string
  filters?: Record<string, any>
}

// 服务类型映射
export interface CoreServiceTypes {
  auth: import('./auth').AuthServiceType
  project: import('./project').ProjectServiceType
  material: import('./material').MaterialServiceType
  body: import('./body').BodyServiceType
  outline: import('./outline').OutlineServiceType
  outlineSection: import('./outlineSection').OutlineSectionServiceType
  materialRelation: import('./materialRelation').MaterialRelationServiceType
  requirement: import('./requirement').RequirementServiceType
  researchBrief: import('./researchBrief').ResearchBriefServiceType
}
