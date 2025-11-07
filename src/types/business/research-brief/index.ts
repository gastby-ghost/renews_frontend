/**
 * 研究简报相关类型定义
 * Research Brief Types
 */

export interface ResearchBriefCreate {
  content: string
  metadata?: Record<string, any>
}

export interface ResearchBriefUpdate {
  content?: string
  metadata?: Record<string, any>
}

export interface ResearchBrief {
  id: number
  project_id: number
  user_id: number
  content: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ResearchBriefCreateResponse {
  success: boolean
  message: string
  data: ResearchBrief
}

export interface ResearchBriefListResponse {
  success: boolean
  message: string
  data: ResearchBrief[]
  total_count: number
}

export interface ResearchBriefDetailResponse {
  success: boolean
  message: string
  data: ResearchBrief
}

export interface ResearchBriefUpdateResponse {
  success: boolean
  message: string
  data: ResearchBrief
}

export interface ResearchBriefDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
}
