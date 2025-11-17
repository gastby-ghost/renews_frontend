/**
 * 范围界定代理服务类型定义
 * 与 scopeAgentService.ts 对应
 */

// 范围界定请求类型
export interface ScopeDefinitionRequest {
  project_brief: string
  objectives?: string[]
  constraints?: string[]
  assumptions?: string[]
  deliverables?: string[]
  stakeholders?: string[]
  timeline?: {
    start_date?: string
    end_date?: string
    milestones?: string[]
  }
  resources?: {
    budget?: number
    team_size?: number
    skills?: string[]
  }
  scope_level?: 'high' | 'medium' | 'detailed'
  industry_domain?: string
  complexity_level?: 'simple' | 'moderate' | 'complex'
}

// 范围界定响应类型
export interface ScopeDefinitionResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    scope_definition: {
      project_title: string
      core_objectives: Array<{
        objective: string
        priority: 'high' | 'medium' | 'low'
        measurable_outcomes: string[]
      }>
      scope_boundaries: {
        in_scope: string[]
        out_of_scope: string[]
        assumptions: string[]
        constraints: string[]
      }
      deliverables: Array<{
        name: string
        description: string
        acceptance_criteria: string[]
        estimated_effort: string
      }>
      success_metrics: Array<{
        metric: string
        target: string
        measurement_method: string
      }>
    }
    risk_assessment: {
      high_risks: Array<{
        risk: string
        probability: 'high' | 'medium' | 'low'
        impact: 'high' | 'medium' | 'low'
        mitigation_strategy: string
      }>
      medium_risks: string[]
      low_risks: string[]
    }
    timeline_recommendation: {
      phases: Array<{
        phase: string
        duration: string
        key_activities: string[]
        deliverables: string[]
      }>
      total_duration: string
      critical_path: string[]
    }
  }
  error?: string
  created_at: string
  updated_at: string
}
