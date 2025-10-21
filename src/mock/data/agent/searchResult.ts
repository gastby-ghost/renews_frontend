/**
 * Agent搜索结果Mock数据
 */

import type { AgentSearchResult, Material } from '@/types/material'

// 生成Mock素材数据
const generateMockMaterials = (keywords: string, count: number = 10): Material[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `agent-mock-${Date.now()}-${index}`,
    title: `Agent增强: ${keywords} - 相关素材 ${index + 1}`,
    source: `Agent-Mock`,
    summary: `通过Agent智能分析，这是关于${keywords}的高质量素材。Agent已智能分析内容相关性、质量和适用性，确保素材满足您的需求。`,
    tags: [keywords, 'Agent推荐', '智能分析', '高质量', '专业'],
    type: ['image', 'video', 'text', 'other'][Math.floor(Math.random() * 4)] as Material['type'],
    url: `https://example.com/agent-material-${index + 1}`,
    thumbnail: `https://picsum.photos/300/200?random=agent-${Date.now()}-${index}`,
    content: `Agent分析内容：这是经过Agent智能筛选和优化的素材，具有高度相关性和专业质量。`,
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 30),
    selected: false
  }))
}

// 生成推荐内容
const generateMockRecommendations = (count: number = 3): Material[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `agent-rec-${Date.now()}-${index}`,
    title: `Agent推荐: 相关素材 ${index + 1}`,
    source: 'Agent-Recommendation',
    summary: '基于您的搜索需求，Agent推荐此相关素材。',
    tags: ['Agent推荐', '相关', '智能匹配'],
    type: ['image', 'video', 'text'][Math.floor(Math.random() * 3)] as Material['type'],
    url: `https://example.com/agent-rec-${index + 1}`,
    thumbnail: `https://picsum.photos/300/200?random=rec-${Date.now()}-${index}`,
    createdAt: new Date(),
    selected: false
  }))
}

// 生成相关查询
const generateMockRelatedQueries = (keywords: string): string[] => {
  return [`${keywords} 高级`, `${keywords} 专业版`, `${keywords} 创意设计`, `${keywords} 最佳实践`]
}

// 主要Mock数据生成函数
export const generateMockAgentSearchResult = (
  keywords: string,
  maxResults?: number
): AgentSearchResult => {
  const materials = generateMockMaterials(keywords, maxResults || 10)
  const recommendations = generateMockRecommendations()
  const relatedQueries = generateMockRelatedQueries(keywords)

  return {
    materials,
    total: materials.length,
    page: 1,
    pageSize: maxResults || 10,
    agentInsights: `基于您的搜索"${keywords}"，Agent分析了多个数据源，发现了${materials.length}个高度相关的素材。Agent认为这些素材在质量、相关性和适用性方面都表现出色，特别适合您的需求。`,
    recommendations,
    relatedQueries,
    processingTime: 2.5 + Math.random() * 2
  }
}

// Agent任务Mock数据
export const mockAgentTask = {
  id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type: 'search' as const,
  status: 'pending' as const,
  progress: 0,
  message: '任务已创建，等待执行...',
  config: {
    keywords: '测试关键词',
    providers: ['tavily'],
    searchScope: '',
    agentType: 'search',
    agentConfig: {},
    filters: { type: [] },
    maxResults: 10,
    enableAIEnhancement: true
  },
  createdAt: new Date()
}

// Agent服务列表Mock数据
export const mockAgentServices = [
  {
    id: 'search-agent',
    name: '搜索Agent',
    type: 'search' as const,
    description: '智能搜索和分析素材',
    apiEndpoint: '/api/agent/search',
    config: {},
    capabilities: ['智能搜索', '内容分析', '相关性评估']
  },
  {
    id: 'scope-agent',
    name: '范围Agent',
    type: 'scope' as const,
    description: '深度搜索特定领域素材',
    apiEndpoint: '/api/agent/scope',
    config: {},
    capabilities: ['深度搜索', '领域专业', '精准匹配']
  },
  {
    id: 'custom-agent',
    name: '自定义Agent',
    type: 'custom' as const,
    description: '根据需求自定义搜索策略',
    apiEndpoint: '/api/agent/custom',
    config: {},
    capabilities: ['自定义策略', '灵活配置', '个性化推荐']
  }
]

// Agent能力配置Mock数据
export const mockAgentCapabilities = {
  'search-agent': ['智能搜索', '内容分析', '相关性评估', '快速响应'],
  'scope-agent': ['深度搜索', '领域专业', '精准匹配', '专业分析'],
  'custom-agent': ['自定义策略', '灵活配置', '个性化推荐', '智能适配']
}
