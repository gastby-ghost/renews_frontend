/**
 * 搜索到标题代理服务类型定义
 * 与 search2titleAgentService.ts 对应
 */

// 搜索到标题代理请求类型
export interface Search2titleAgentRequest {
  search_query: string
  title_preferences?: {
    title_types?: Array<'headline' | 'subtitle' | 'seo_title' | 'social_title' | 'academic_title'>
    tone?: 'formal' | 'casual' | 'professional' | 'creative' | 'academic'
    length_preference?: 'short' | 'medium' | 'long'
    include_numbers?: boolean
    include_questions?: boolean
    target_audience?: string
    language?: string
  }
  search_config?: {
    search_depth?: 'basic' | 'detailed' | 'comprehensive'
    sources?: Array<'news' | 'academic' | 'blogs' | 'social_media' | 'official'>
    time_range?: string
    language?: string
    max_results?: number
  }
  analysis_config?: {
    sentiment_analysis?: boolean
    keyword_extraction?: boolean
    trend_analysis?: boolean
    competitor_analysis?: boolean
  }
}

// 搜索到标题代理响应类型
export interface Search2titleAgentResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    search_summary: {
      query: string
      total_results: number
      key_topics: Array<{
        topic: string
        relevance: number
        trend: 'rising' | 'stable' | 'declining'
      }>
      sentiment_distribution: {
        positive: number
        neutral: number
        negative: number
      }
    }
    generated_titles: Array<{
      title: string
      title_type: string
      confidence_score: number
      seo_score?: number
      engagement_prediction?: number
      target_audience_match: number
      uniqueness_score: number
      generated_from: string[]
    }>
    title_analysis: {
      top_keywords: Array<{
        keyword: string
        frequency: number
        importance: number
      }>
      trending_phrases: string[]
      competitor_titles: Array<{
        title: string
        source: string
        similarity_score: number
      }>
      recommended_angles: Array<{
        angle: string
        rationale: string
        opportunity_score: number
      }>
    }
    optimization_suggestions: Array<{
      category: 'seo' | 'engagement' | 'clarity' | 'uniqueness'
      suggestion: string
      impact_level: 'high' | 'medium' | 'low'
      implementation: string
    }>
  }
  error?: string
  created_at: string
  updated_at: string
}

// 搜索到标题代理状态响应类型
export interface Search2titleAgentStatusResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  current_phase?: string
  estimated_completion?: string
  result?: any
  error?: string
}
