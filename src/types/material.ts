export interface Material {
  id: string
  user_id: string
  summary: string
  score: number // 相关性评分 (0-1)
  title: string // AI总结标题
  key_excerpts: string[] // 关键摘录
  tags: string[]
  url?: string
  createdAt: Date
  updatedAt?: Date
  selected?: boolean
}

export interface SearchProvider {
  id: string
  name: string
  type: 'api' | 'ai'
  apiEndpoint?: string
  config?: Record<string, any>
}

export interface SearchProgress {
  stage: 'config' | 'searching' | 'processing' | 'completed'
  current: number
  total: number
  message: string
}

export interface SearchConfig {
  keywords: string
  providers: string[]
  aiProvider?: string
  searchScope: string
  filters: {
    type?: Material['type'][]
    source?: string[]
    tags?: string[]
  }
}

export interface MaterialLibraryState {
  materials: Material[]
  selectedMaterials: string[]
  searchHistory: SearchConfig[]
  providers: SearchProvider[]
  loading: boolean
  error: string | null
}

// Agent 相关类型定义
export interface AgentSearchConfig {
  keywords: string
  providers: string[]
  searchScope: string
  agentType: 'search' | 'scope' | 'custom'
  agentConfig?: Record<string, any>
  filters: {
    tags?: string[]
  }
  maxResults?: number
  enableAIEnhancement?: boolean
}

export interface AgentSearchResult {
  materials: Material[]
  total: number
  page: number
  pageSize: number
  agentInsights?: string
  recommendations?: Material[]
  relatedQueries?: string[]
  processingTime?: number
}

export interface AgentService {
  id: string
  name: string
  type: 'search' | 'scope' | 'custom'
  description: string
  apiEndpoint?: string
  config?: Record<string, any>
  capabilities: string[]
}

export interface AgentTask {
  id: string
  type: 'search' | 'analyze' | 'recommend' | 'organize'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  message: string
  config: AgentSearchConfig
  result?: AgentSearchResult
  error?: string
  createdAt: Date
  updatedAt?: Date
}

export interface AgentState {
  activeAgents: AgentService[]
  currentTask: AgentTask | null
  taskHistory: AgentTask[]
  agentCapabilities: Record<string, string[]>
  loading: boolean
  error: string | null
}

// 扩展MaterialLibraryState以包含Agent相关状态
export interface ExtendedMaterialLibraryState extends MaterialLibraryState {
  agentState: AgentState
  searchMode: 'simple' | 'agent'
}
