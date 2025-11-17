/**
 * 大纲生成服务类型定义
 * 与 outlineGenerateService.ts 对应
 */

// 大纲生成请求类型
export interface OutlineGenerationRequest {
  topic: string
  outline_type?: 'mindmap' | 'structured' | 'detailed'
  audience_level?: 'beginner' | 'intermediate' | 'advanced'
  depth?: 'basic' | 'comprehensive' | 'detailed'
  language?: string
  include_sections?: string[]
  exclude_sections?: string[]
  custom_requirements?: string[]
}

// 大纲生成响应类型
export interface OutlineGenerationResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    title: string
    outline_type: string
    total_sections: number
    estimated_word_count: number
    sections: Array<{
      id: string
      title: string
      level: number
      parent_id?: string
      content_summary?: string
      keywords?: string[]
      estimated_word_count?: number
    }>
    creation_metadata: {
      created_at: string
      processing_time: number
      model_version: string
      quality_score?: number
    }
  }
  error?: string
  created_at: string
  updated_at: string
}

// 大纲工具状态响应类型
export interface OutlineToolsStatusResponse {
  service_status: 'available' | 'unavailable' | 'maintenance'
  active_tasks: number
  max_concurrent_tasks: number
  average_processing_time: number
  supported_languages: string[]
  supported_outline_types: string[]
}
