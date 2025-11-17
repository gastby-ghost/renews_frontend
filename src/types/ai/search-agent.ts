/**
 * 搜索代理服务类型定义
 * 与 searchAgentService.ts 对应
 */

// 搜索代理请求类型
export interface SearchAgentRequest {
  brief: string
  max_concurrent_research_units?: number
  max_researcher_iterations?: number
  search_depth?: 'shallow' | 'medium' | 'deep'
  focus_areas?: string[]
  exclude_domains?: string[]
  include_domains?: string[]
  language?: string
  timeframe?: string
  result_format?: 'summary' | 'detailed' | 'comprehensive'
  analysis_type?: 'factual' | 'comparative' | 'analytical' | 'predictive'
}

// 搜索代理响应类型
export interface SearchAgentResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    research_summary: {
      executive_summary: string
      key_findings: Array<{
        finding: string
        confidence: number
        sources: string[]
      }>
      research_questions: string[]
      methodology: string
    }
    detailed_analysis: {
      topic_analysis: string
      market_trends: Array<{
        trend: string
        impact: 'high' | 'medium' | 'low'
        timeframe: string
      }>
      expert_opinions: Array<{
        opinion: string
        expert_name: string
        credibility_score: number
        source: string
      }>
      data_insights: Array<{
        insight: string
        supporting_data: string
        interpretation: string
      }>
    }
    sources: Array<{
      title: string
      url: string
      credibility_score: number
      publication_date: string
      relevance_score: number
      content_type: 'article' | 'research_paper' | 'report' | 'blog' | 'news'
    }>
    recommendations: Array<{
      recommendation: string
      priority: 'high' | 'medium' | 'low'
      rationale: string
      implementation_timeline: string
    }>
    research_metadata: {
      total_sources_analyzed: number
      research_duration: number
      confidence_level: number
      research_quality_score: number
      last_updated: string
    }
  }
  error?: string
  created_at: string
  updated_at: string
}

// 搜索代理状态响应类型
export interface SearchAgentStatusResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  current_phase?: string
  estimated_completion?: string
  result?: any
  error?: string
}

// 搜索代理列表响应类型
export interface SearchAgentListResponse {
  tasks: Array<{
    task_id: string
    status: string
    brief: string
    created_at: string
    updated_at: string
    progress?: number
  }>
  total_count: number
  page: number
  per_page: number
}
