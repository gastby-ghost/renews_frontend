/**
 * 搜索功能Mock数据
 */

import type {
  SearchToolsResponse,
  SearchResultItem,
  SearchToolsStatusResponse,
  SearchToolsExecuteRequest,
  SearchToolsExecuteResponse,
  SearchToolsTaskStatusResponse,
  SearchAgentResponse,
  SearchAgentStatusResponse,
  SearchAgentListResponse
} from '@/types/ai'
import type { Material } from '@/types/material'

import searchData from '../../json/search.json'
import searchToolData from '../../json/search-tool.json'
import searchAgentData from '../../json/search-agent.json'
/**
 * 生成搜索工具状态的Mock响应
 */
export function generateMockSearchToolsStatus(): SearchToolsStatusResponse {
  return {
    tavily_configured: true,
    bocha_configured: true,
    tavily_api_key_status: 'active',
    bocha_api_key_status: 'active',
    default_provider: 'tavily',
    available_providers: ['tavily', 'bocha']
  }
}

/**
 * 生成AI服务提供商信息的Mock响应
 */
export function generateMockAIProviders() {
  return {
    tavily: {
      name: 'Tavily Search',
      description: 'AI-powered search engine optimized for LLMs',
      capabilities: ['Real-time search', 'Structured summaries', 'Multi-language support'],
      status: 'active'
    },
    bocha: {
      name: 'Bocha Search',
      description: 'Professional search service with advanced filtering',
      capabilities: ['Domain filtering', 'Time-based search', 'Content summarization'],
      status: 'active'
    }
  }
}

/**
 * 生成搜索工具结果的Mock响应
 */
export function generateMockSearchToolsResponse(
  queries: string[],
  provider: string
): SearchToolsResponse {
  // 总是返回search-agent.json中的固定数据
  const webSearchData = (searchAgentData as any).result.web_search_data || []

  // 将web_search_data转换为SearchResultItem格式
  const results = webSearchData.map((item: any) => ({
    url: item.url,
    score: item.score,
    query: item.query,
    aititle: item.aititle,
    summary: item.summary,
    tags: item.tags || [],
    key_excerpts: item.key_excerpts || [],
    published_date: item.published_date
  }))

  return {
    success: true,
    provider: provider,
    results: results,
    total_results: results.length,
    search_queries: queries,
    search_time: 2.5,
    api_execution_time: 1.8,
    query_count: queries.length
  }
}

/**
 * 生成Search Agent执行的Mock响应
 */
export function generateMockSearchAgentResponse(
  userId: string,
  projectId: string,
  brief: string
): SearchAgentResponse {
  return {
    success: true,
    task_id: `search_agent_${Date.now()}`,
    message: `Search Agent任务已启动 - 研究主题: ${brief}`,
    user_id: userId,
    project_id: projectId,
    agent_type: 'search_agent'
  }
}

/**
 * 生成Search Agent任务列表的Mock响应
 */
export function generateMockSearchAgentList(
  userId: string,
  projectId?: string,
  brief?: string
): SearchAgentListResponse {
  console.log('[Mock数据生成器] 生成Search Agent列表:', {
    userId,
    projectId,
    brief
  })

  // 生成模拟的任务列表
  const tasks = Array.from({ length: 5 }, (_, index) => {
    const taskId = `search_agent_${Date.now() - index * 10000}`
    return generateMockSearchAgentStatus(taskId, brief)
  })

  return {
    tasks: tasks,
    total_count: tasks.length,
    user_id: userId,
    project_id: projectId || null
  }
}

/**
 * 生成Search Agent状态的Mock响应
 */
export function generateMockSearchAgentStatus(
  taskId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  brief?: string
): SearchAgentStatusResponse {
  const currentStatus = 'completed'
  const progress = 100

  // 根据状态生成相应的结果
  let result = null
  if (currentStatus === 'completed') {
    result = searchData
  }

  return {
    task_id: taskId,
    status: currentStatus,
    progress: progress,
    result: result,
    error: '',
    user_id: 'user_123',
    project_id: 'project_456',
    agent_type: 'search_agent',
    created_at: Date.now() - 120000,
    updated_at: Date.now()
  }
}

// 生成搜索结果项
const generateSearchResultItem = (keywords: string, index: number): SearchResultItem => {
  const domains = ['example.com', 'test.com', 'demo.com', 'sample.com', 'mock.com']
  const domain = domains[index % domains.length]

  return {
    url: `https://${domain}/article-${index + 1}`,
    score: Math.random() * 0.5 + 0.5, // 0.5-1.0之间
    query: keywords,
    aititle: `AI优化: ${keywords}深度分析 ${index + 1}`,
    summary: `这是关于${keywords}的详细分析文章，包含了丰富的内容和实用的信息。文章从多个角度探讨了${keywords}的相关话题，为读者提供了全面的了解。`,
    tags: [keywords, '分析', '研究', '专业'],
    key_excerpts: [
      `${keywords}是当前研究的热点话题之一`,
      `通过深入分析${keywords}，我们可以发现许多有趣的现象`,
      `专家认为${keywords}在未来会有更大的发展空间`
    ],
    published_date: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
  }
}

// 生成搜索结果
export const generateMockSearchResult = (
  keywords: string,
  page: number = 1,
  pageSize: number = 20
): SearchToolsResponse => {
  const totalCount = 100
  const startIndex = (page - 1) * pageSize

  const results = Array.from({ length: pageSize }, (_, index) =>
    generateSearchResultItem(keywords, startIndex + index)
  )

  return {
    success: true,
    provider: 'tavily',
    results,
    total_results: totalCount,
    search_queries: [keywords],
    search_time: 1.5,
    api_execution_time: 1.2,
    query_count: 1
  }
}

// 转换为Material格式
const transformToMaterial = (item: SearchResultItem, index: number): Material => {
  return {
    id: `search-${Date.now()}-${index}`,
    user_id: 'user_123',
    title: item.aititle || `搜索结果 ${index + 1}`,
    summary: item.summary || '',
    score: item.score,
    tags: item.tags || [],
    url: item.url,
    createdAt: item.published_date ? new Date(item.published_date) : new Date(),
    selected: false,
    key_excerpts: item.key_excerpts || []
  }
}

// 生成SearchTools结果
export const generateMockSearchToolsResult = (
  keywords: string,
  maxResults: number = 20
): { materials: Material[]; total: number; page: number; pageSize: number } => {
  const results = Array.from({ length: maxResults }, (_, index) =>
    generateSearchResultItem(keywords, index)
  )

  return {
    materials: results.map((item, index) => transformToMaterial(item, index)),
    total: results.length,
    page: 1,
    pageSize: maxResults
  }
}

// 生成素材库内容
export const generateMockLibraryMaterials = (
  tags?: string[],
  page: number = 1,
  pageSize: number = 20
): { materials: Material[]; total: number; page: number; pageSize: number } => {
  const totalCount = 50
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalCount)

  let materials = Array.from({ length: totalCount }, (_, index) => {
    const item = generateSearchResultItem('素材', index)
    return transformToMaterial(item, index)
  })

  // 应用过滤条件
  if (tags && tags.length > 0) {
    materials = materials.filter((material) => tags.some((tag) => material.tags.includes(tag)))
  }

  const paginatedMaterials = materials.slice(startIndex, endIndex)

  return {
    materials: paginatedMaterials,
    total: materials.length,
    page,
    pageSize
  }
}

// 生成素材详情
export const generateMockMaterialDetails = (materialId: string): Material => {
  const index = parseInt(materialId.split('-').pop() || '0')
  const item = generateSearchResultItem('详细内容', index)
  const material = transformToMaterial(item, index)

  // 更新摘要以包含更多详细信息
  material.summary = `
# ${material.title}

## 概述
${material.summary}

## 详细内容
这是${material.title}的详细内容。文章从多个角度深入分析了相关主题，提供了丰富的信息和实用的建议。

## 主要观点
1. 第一个主要观点的详细阐述
2. 第二个主要观点的深入分析
3. 第三个主要观点的实践应用

## 结论
通过以上分析，我们可以得出结论：${material.title}是一个值得深入研究的主题。
  `.trim()

  return material
}

// 生成下载链接
export const generateMockDownloadUrl = (materialId: string): string => {
  return `https://example.com/download/${materialId}?token=${Date.now()}`
}

// 生成搜索历史记录
export const generateMockSearchHistory = (limit: number = 10) => {
  const queries = [
    '人工智能发展趋势',
    '机器学习算法研究',
    '深度学习应用案例',
    '自然语言处理技术',
    '计算机视觉发展',
    'AI芯片技术',
    '智能制造创新',
    '大数据分析',
    '云计算平台',
    '物联网应用'
  ]

  return {
    success: true,
    history: Array.from({ length: limit }, (_, index) => ({
      id: `history_${Date.now() - index * 1000}`,
      query: queries[index % queries.length],
      provider: ['tavily', 'bocha'][Math.floor(Math.random() * 2)],
      search_time: Math.random() * 5 + 1,
      results_count: Math.floor(Math.random() * 50) + 10,
      searched_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      user_id: 'user_123'
    })),
    total_count: queries.length,
    has_more: limit < queries.length,
    mock: true,
    timestamp: Date.now()
  }
}

// 生成搜索建议
export const generateMockSearchSuggestions = (query: string) => {
  const suggestions = [
    `${query} 最新发展`,
    `${query} 应用案例`,
    `${query} 技术原理`,
    `${query} 市场前景`,
    `${query} 发展趋势`,
    `${query} 研究现状`,
    `${query} 实践指南`,
    `${query} 最佳实践`
  ].filter((suggestion) => suggestion.toLowerCase().includes(query.toLowerCase()))

  return {
    success: true,
    query: query,
    suggestions: suggestions.slice(0, 8),
    popular_searches: ['人工智能', '机器学习', '深度学习', '自然语言处理', '计算机视觉'],
    provider: 'tavily',
    mock: true,
    timestamp: Date.now()
  }
}

/**
 * 生成搜索工具执行Mock响应
 */
export function generateMockSearchToolsExecute(
  request: SearchToolsExecuteRequest
): SearchToolsExecuteResponse {
  return {
    success: true,
    task_id: `search_tools_${Date.now()}`,
    message: '搜索工具任务已启动',
    user_id: 'user_123',
    project_id: 'project_456',
    provider: request?.provider || 'tavily',
    query_preview: request?.queries?.join(', ') || '默认搜索查询',
    is_default_project: true
  }
}

/**
 * 生成搜索工具任务状态Mock响应
 */
export function generateMockSearchToolsTaskStatus(taskId: string): SearchToolsTaskStatusResponse {
  // 总是返回已完成状态，使用JSON文件中的数据
  return {
    task_id: taskId,
    status: 'completed',
    progress: 100,
    result: (searchToolData as any).result,
    error: null,
    user_id: 'user_123',
    project_id: 'project_456',
    provider: 'tavily',
    query: 'tavily search: 人工智能，医疗',
    created_at: Date.now() - 120000,
    updated_at: Date.now(),
    is_default_project: true
  }
}
