/**
 * 正文生成服务类型定义
 * 与 contentGenerateService.ts 对应
 */

// 正文生成请求类型
export interface BodyGenerationRequest {
  outline_id?: string
  title?: string
  content?: string
  style?: string
  tone?: string
  length?: 'short' | 'medium' | 'long'
  language?: string
  keywords?: string[]
  audience?: string
  purpose?: string
  format?: 'article' | 'blog' | 'report' | 'email' | 'social'
}

// 正文生成响应类型
export interface BodyGenerationResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    content: string
    word_count: number
    estimated_read_time: number
    summary?: string
    key_points?: string[]
  }
  error?: string
  created_at: string
  updated_at: string
}

// 正文工具状态响应类型
export interface BodyToolsStatusResponse {
  service_status: 'available' | 'unavailable' | 'maintenance'
  active_tasks: number
  max_concurrent_tasks: number
  average_processing_time: number
  supported_languages: string[]
  supported_formats: string[]
}
