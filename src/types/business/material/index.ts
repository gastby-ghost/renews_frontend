/**
 * 素材相关类型定义
 * Material Types
 */

export interface MaterialResponse {
  id: number
  title: string
  content: string
  type: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface MaterialListResponse {
  items: MaterialResponse[]
  total: number
  page: number
  per_page: number
}

export interface TagResponse {
  name: string
  count: number
}
