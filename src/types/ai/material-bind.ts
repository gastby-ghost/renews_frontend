/**
 * 素材绑定服务类型定义
 * 与 materialBindService.ts 对应
 */

// 素材绑定请求类型
export interface MaterialBindRequest {
  outline_id: string
  binding_config?: {
    strategy: 'semantic' | 'keyword' | 'relevance'
    min_relevance_score?: number
    max_materials_per_section?: number
    preferred_material_types?: Array<
      'article' | 'research' | 'case_study' | 'report' | 'blog' | 'news'
    >
    language_preference?: string
    credibility_threshold?: number
  }
  material_filters?: {
    source_types?: string[]
    date_range?: {
      start_date?: string
      end_date?: string
    }
    exclude_sources?: string[]
    include_keywords?: string[]
    exclude_keywords?: string[]
  }
}

// 素材绑定响应类型
export interface MaterialBindResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    outline_id: string
    binding_summary: {
      total_sections: number
      sections_with_materials: number
      total_materials_found: number
      total_materials_bound: number
      binding_efficiency: number
    }
    binding_details: Array<{
      section_id: string
      section_title: string
      bound_materials: Array<{
        material_id: string
        title: string
        content_type: 'article' | 'research' | 'case_study' | 'report' | 'blog' | 'news'
        relevance_score: number
        credibility_score: number
        binding_reason: string
        summary: string
        key_points: string[]
        source?: string
        publication_date?: string
        url?: string
      }>
      section_materials_count: number
      average_relevance_score: number
    }>
    quality_metrics: {
      overall_binding_quality: number
      relevance_distribution: {
        high_relevance: number // 0.8-1.0
        medium_relevance: number // 0.6-0.8
        low_relevance: number // 0.4-0.6
      }
      content_type_diversity: {
        research_articles: number
        case_studies: number
        reports: number
        blog_posts: number
        news_articles: number
      }
    }
    unused_materials?: Array<{
      material_id: string
      title: string
      reason: 'low_relevance' | 'duplicate_content' | 'quality_threshold' | 'filter_exclusion'
    }>
  }
  error?: string
  created_at: string
  updated_at: string
}

// 绑定配置类型
export interface BindingConfig {
  strategy: 'semantic' | 'keyword' | 'relevance'
  min_relevance_score?: number
  max_materials_per_section?: number
  preferred_material_types?: Array<
    'article' | 'research' | 'case_study' | 'report' | 'blog' | 'news'
  >
  language_preference?: string
  credibility_threshold?: number
}

// 素材过滤器类型
export interface MaterialFilters {
  source_types?: string[]
  date_range?: {
    start_date?: string
    end_date?: string
  }
  exclude_sources?: string[]
  include_keywords?: string[]
  exclude_keywords?: string[]
}

// 绑定状态响应类型
export interface MaterialBindStatusResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  current_phase?: string
  estimated_completion?: string
  result?: MaterialBindResponse['result']
  error?: string
  created_at: string
  updated_at: string
}
