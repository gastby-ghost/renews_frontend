/**
 * 大纲与素材生成服务类型定义
 * 与 outlineWithMaterialService.ts 对应
 */

// 大纲与素材生成请求类型
export interface OutlineWithMaterialRequest {
  outline_request: {
    topic: string
    outline_type?: 'mindmap' | 'structured' | 'detailed'
    audience_level?: 'beginner' | 'intermediate' | 'advanced'
    depth?: 'basic' | 'comprehensive' | 'detailed'
    language?: string
    include_sections?: string[]
    exclude_sections?: string[]
    custom_requirements?: string[]
  }
  material_request?: {
    search_keywords?: string[]
    material_types?: Array<'article' | 'research' | 'case_study' | 'report' | 'blog' | 'news'>
    credibility_threshold?: number
    max_materials_per_section?: number
    language?: string
    include_images?: boolean
    include_data?: boolean
  }
  integration_config?: {
    auto_bind_materials?: boolean
    binding_strategy?: 'semantic' | 'keyword' | 'relevance'
    min_relevance_score?: number
    max_materials_per_outline_section?: number
  }
}

// 大纲与素材生成响应类型
export interface OutlineWithMaterialResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    outline: {
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
    materials: Array<{
      id: string
      title: string
      content_type: 'article' | 'research' | 'case_study' | 'report' | 'blog' | 'news'
      summary: string
      key_points: string[]
      credibility_score: number
      relevance_score: number
      url?: string
      source?: string
      publication_date?: string
      author?: string
      word_count?: number
      reading_time?: number
      tags?: string[]
    }>
    binding_result: {
      total_materials_found: number
      materials_bound: number
      binding_efficiency: number
      sections_with_materials: number
      binding_details: Array<{
        section_id: string
        section_title: string
        bound_materials: Array<{
          material_id: string
          material_title: string
          relevance_score: number
          binding_reason: string
        }>
      }>
    }
    quality_metrics: {
      outline_quality_score: number
      material_quality_score: number
      integration_quality_score: number
      completeness_score: number
    }
  }
  error?: string
  created_at: string
  updated_at: string
}

// 大纲生成选项类型
export interface OutlineGenerationOptions {
  outline_type?: 'mindmap' | 'structured' | 'detailed'
  audience_level?: 'beginner' | 'intermediate' | 'advanced'
  depth?: 'basic' | 'comprehensive' | 'detailed'
  language?: string
  include_sections?: string[]
  exclude_sections?: string[]
  custom_requirements?: string[]
}

// 素材生成选项类型
export interface MaterialGenerationOptions {
  search_keywords?: string[]
  material_types?: Array<'article' | 'research' | 'case_study' | 'report' | 'blog' | 'news'>
  credibility_threshold?: number
  max_materials_per_section?: number
  language?: string
  include_images?: boolean
  include_data?: boolean
}

// 集成配置类型
export interface IntegrationConfig {
  auto_bind_materials?: boolean
  binding_strategy?: 'semantic' | 'keyword' | 'relevance'
  min_relevance_score?: number
  max_materials_per_outline_section?: number
}

// 任务状态响应类型
export interface OutlineWithMaterialTaskStatusResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  current_phase?: string
  estimated_completion?: string
  result?: OutlineWithMaterialResponse['result']
  error?: string
  created_at: string
  updated_at: string
}
