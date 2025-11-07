/**
 * AI服务相关类型定义
 * AI Service Types
 */

export interface AiSearchToolsResponse {
  results: Array<{
    url: string
    score: number
    query: string
  }>
}

export interface AiSearchAgentResponse {
  task_id: string
  status: string
}

export interface AiTitleGenerationResponse {
  titles: Array<{
    title: string
    angle: string
  }>
  generation_summary: string
  success: boolean
}

export interface AiOutlineGenerationResponse {
  outline: Array<{
    id: string
    title: string
    level: number
  }>
  success: boolean
}
