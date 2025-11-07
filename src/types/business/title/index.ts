/**
 * 标题候选和标题相关类型定义
 * Title and TitleCandidate Types
 */

// 标题候选相关类型
export interface TitleCandidateCreate {
  content: string
  metadata?: Record<string, any>
}

export interface TitleCandidateUpdate {
  content?: string
  metadata?: Record<string, any>
}

export interface TitleCandidateCreateBulk {
  candidates: TitleCandidateCreate[]
}

export interface TitleCandidateSelect {
  reason?: string
}

export interface TitleCandidate {
  id: number
  project_id: number
  user_id: number
  content: string
  status: 'generated' | 'selected' | 'rejected'
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface TitleCandidateCreateResponse {
  success: boolean
  message: string
  data: TitleCandidate
}

export interface TitleCandidateListResponse {
  success: boolean
  message: string
  data: TitleCandidate[]
  total_count: number
}

export interface TitleCandidateDetailResponse {
  success: boolean
  message: string
  data: TitleCandidate
}

export interface TitleCandidateUpdateResponse {
  success: boolean
  message: string
  data: TitleCandidate
}

export interface TitleCandidateDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
}

export interface TitleCandidateSelectResponse {
  success: boolean
  message: string
  data: TitleCandidate
}

// 标题版本相关类型
export interface TitleCreate {
  content: string
  version?: number
}

export interface TitleUpdate {
  content?: string
}

export interface TitleActivateRequest {
  reason?: string
}

export interface TitleDeactivateRequest {
  reason?: string
}

export interface Title {
  id: number
  project_id: number
  user_id: number
  content: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TitleCreateResponse {
  success: boolean
  message: string
  data: Title
}

export interface TitleDetailResponse {
  success: boolean
  message: string
  data: Title
}

export interface TitleHistoryResponse {
  success: boolean
  message: string
  data: Title[]
  total_count: number
}

export interface TitleUpdateResponse {
  success: boolean
  message: string
  data: Title
}

export interface TitleActivateResponse {
  success: boolean
  message: string
  data: Title
}

export interface TitleDeactivateResponse {
  success: boolean
  message: string
  data: Title
}
