/**
 * 标题生成服务类型定义
 * 与 titleGenerateService.ts 对应
 */

// 标题生成请求类型
export interface TitleGenerationRequest {
  content?: string
  topic?: string
  keywords?: string[]
  target_audience?: string
  tone?: 'formal' | 'casual' | 'professional' | 'creative'
  title_type?: 'headline' | 'subtitle' | 'seo_title' | 'social_title'
  count?: number
  language?: string
  length_preference?: 'short' | 'medium' | 'long'
  include_numbers?: boolean
  include_questions?: boolean
}

// 标题生成响应类型
export interface TitleGenerationResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    titles: Array<{
      title: string
      confidence_score: number
      category: string
      seo_score?: number
      engagement_prediction?: number
    }>
    total_generated: number
    recommended_title: string
  }
  error?: string
  created_at: string
  updated_at: string
}

// 标题工具状态响应类型
export interface TitleToolsStatusResponse {
  service_status: 'available' | 'unavailable' | 'maintenance'
  active_tasks: number
  max_concurrent_tasks: number
  average_processing_time: number
  supported_languages: string[]
  supported_title_types: string[]
}
