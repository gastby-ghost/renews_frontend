/**
 * AI服务Mock数据
 * 包含网页总结、检索、搜索工具、标题生成、大纲生成等功能的Mock数据
 */

import type {
  WebpageSummaryAsyncResponse,
  WebpageSummaryStatusResponse,
  ScopeAgentResponse,
  ScopeAgentStatusResponse,
  ScopeAgentListResponse,
  SearchAgentResponse,
  SearchAgentStatusResponse,
  SearchAgentListResponse,
  SearchToolsResponse,
  SearchToolsStatusResponse,
  TitleGenerationResponse,
  TitleToolsStatusResponse,
  OutlineGenerationResponse,
  OutlineGenerationStatusResponse
} from '@/types/ai'

/**
 * 生成异步网页总结的Mock响应
 */
export function generateMockWebpageSummaryAsync(url: string): WebpageSummaryAsyncResponse {
  return {
    success: true,
    message: '网页总结任务已创建',
    task_id: `webpage_summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    url: url
  }
}

/**
 * 生成网页总结任务状态的Mock响应
 */
export function generateMockWebpageSummaryStatus(taskId: string): WebpageSummaryStatusResponse {
  const statuses = ['pending', 'processing', 'completed', 'failed']
  const currentStatus = statuses[Math.floor(Math.random() * statuses.length)]
  const progress = currentStatus === 'completed' ? 100 : Math.floor(Math.random() * 90)

  return {
    success: true,
    task_id: taskId,
    status: currentStatus,
    progress: progress,
    result:
      currentStatus === 'completed'
        ? {
            summary:
              '这是一篇关于人工智能技术发展的文章，详细介绍了最新的研究成果和应用前景。文章从机器学习的基础概念开始，逐步深入到深度学习的核心技术，并探讨了在各个行业的实际应用案例。',
            key_excerpts: [
              '人工智能正在改变我们的生活方式和工作模式',
              '深度学习技术在图像识别和自然语言处理方面取得了突破性进展',
              'AI在医疗、金融、教育等领域的应用前景广阔'
            ],
            word_count: 1250,
            reading_time: 5,
            topics: ['人工智能', '机器学习', '深度学习', '技术应用']
          }
        : null,
    error: currentStatus === 'failed' ? '网页抓取失败：目标网站无法访问' : null
  }
}

/**
 * 生成Scope Agent执行的Mock响应
 */
export function generateMockScopeAgentResponse(
  userId: string,
  projectId: string,
  _query: string // eslint-disable-line @typescript-eslint/no-unused-vars
): ScopeAgentResponse {
  return {
    success: true,
    task_id: `scope_agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message: 'Scope Agent任务已启动',
    user_id: userId,
    project_id: projectId,
    agent_type: 'scope_agent'
  }
}

/**
 * 生成Scope Agent状态的Mock响应
 */
export function generateMockScopeAgentStatus(taskId: string): ScopeAgentStatusResponse {
  const statuses = ['pending', 'running', 'completed', 'failed']
  const currentStatus = statuses[Math.floor(Math.random() * statuses.length)]
  const progress = currentStatus === 'completed' ? 100 : Math.floor(Math.random() * 90)

  return {
    task_id: taskId,
    status: currentStatus,
    progress: progress,
    result:
      currentStatus === 'completed'
        ? {
            scope_analysis: '项目范围分析完成',
            key_topics: ['人工智能', '机器学习', '深度学习'],
            research_directions: ['技术发展趋势', '应用场景分析', '市场前景预测'],
            suggested_queries: ['AI技术发展现状', '机器学习应用案例', '深度学习未来趋势']
          }
        : null,
    error: currentStatus === 'failed' ? '任务执行失败：参数验证错误' : null,
    user_id: 'user_123',
    project_id: 'project_456',
    agent_type: 'scope_agent',
    created_at: Date.now() - 60000,
    updated_at: Date.now()
  }
}

/**
 * 生成Scope Agent任务列表的Mock响应
 */
export function generateMockScopeAgentList(
  userId: string,
  projectId?: string
): ScopeAgentListResponse {
  const tasks = Array.from({ length: 5 }, (_, index) =>
    generateMockScopeAgentStatus(`scope_agent_task_${index}`)
  )

  return {
    tasks: tasks,
    total_count: tasks.length,
    user_id: userId,
    project_id: projectId || null
  }
}

/**
 * 生成Search Agent执行的Mock响应
 */
export function generateMockSearchAgentResponse(
  userId: string,
  projectId: string,
  _brief: string // eslint-disable-line @typescript-eslint/no-unused-vars
): SearchAgentResponse {
  return {
    success: true,
    task_id: `search_agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message: 'Search Agent任务已启动',
    user_id: userId,
    project_id: projectId,
    agent_type: 'search_agent'
  }
}

/**
 * 生成Search Agent状态的Mock响应
 */
export function generateMockSearchAgentStatus(taskId: string): SearchAgentStatusResponse {
  const statuses = ['pending', 'running', 'completed', 'failed']
  const currentStatus = statuses[Math.floor(Math.random() * statuses.length)]
  const progress = currentStatus === 'completed' ? 100 : Math.floor(Math.random() * 90)

  return {
    task_id: taskId,
    status: currentStatus,
    progress: progress,
    result:
      currentStatus === 'completed'
        ? {
            search_results: [
              {
                url: 'https://example.com/article1',
                title: '人工智能技术发展报告',
                summary: '详细介绍了2024年人工智能技术的最新发展情况和应用前景',
                score: 0.95
              },
              {
                url: 'https://example.com/article2',
                title: '机器学习在商业中的应用',
                summary: '探讨了机器学习技术如何帮助企业提升效率和创造价值',
                score: 0.88
              }
            ],
            research_summary: '搜索完成，共找到15个相关资源',
            key_insights: ['AI技术正在快速发展', '商业应用前景广阔', '技术挑战依然存在']
          }
        : null,
    error: currentStatus === 'failed' ? '搜索任务失败：网络连接超时' : null,
    user_id: 'user_123',
    project_id: 'project_456',
    agent_type: 'search_agent',
    created_at: Date.now() - 120000,
    updated_at: Date.now()
  }
}

/**
 * 生成Search Agent任务列表的Mock响应
 */
export function generateMockSearchAgentList(
  userId: string,
  projectId?: string
): SearchAgentListResponse {
  const tasks = Array.from({ length: 3 }, (_, index) =>
    generateMockSearchAgentStatus(`search_agent_task_${index}`)
  )

  return {
    tasks: tasks,
    total_count: tasks.length,
    user_id: userId,
    project_id: projectId || null
  }
}

/**
 * 生成搜索工具结果的Mock响应
 */
export function generateMockSearchToolsResponse(
  queries: string[],
  provider: string
): SearchToolsResponse {
  const results = Array.from({ length: 10 }, (_, index) => ({
    url: `https://example${index + 1}.com/article`,
    score: Math.random(),
    query: queries[Math.floor(Math.random() * queries.length)],
    aititle: `AI生成标题 ${index + 1}`,
    summary: `这是第${index + 1}个搜索结果的AI生成摘要，内容相关且信息丰富`,
    tags: ['人工智能', '技术', '创新'],
    key_excerpts: [
      '关键摘录1：人工智能技术正在改变世界',
      '关键摘录2：机器学习应用越来越广泛',
      '关键摘录3：深度学习技术不断突破'
    ],
    published_date: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
  }))

  return {
    success: true,
    provider: provider,
    results: results,
    total_results: results.length,
    search_queries: queries,
    search_time: Math.random() * 5 + 1,
    api_execution_time: Math.random() * 2 + 0.5,
    query_count: queries.length
  }
}

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
 * 生成标题生成的Mock响应
 */
export function generateMockTitleGenerationResponse(
  researchBrief: string,
  webSearchData: any[]
): TitleGenerationResponse {
  const titles = Array.from({ length: 5 }, (_, index) => ({
    title: `新闻标题候选 ${index + 1}: AI技术突破引领未来发展`,
    angle: '从技术突破角度分析AI发展现状和前景',
    why_now: '近期AI技术取得重大突破，引发行业广泛关注',
    news_values: ['Timeliness', 'Impact', 'Novelty'],
    verifiability: '基于多个权威来源，易于核实',
    sources: ['1', '2', '3'],
    risk_notes: '需要注意技术发展的伦理风险',
    feasibility: '具备充分来源支持，可行性高'
  }))

  return {
    success: true,
    titles: titles,
    title_sources_details: {
      标题1: webSearchData.slice(0, 3),
      标题2: webSearchData.slice(1, 4),
      标题3: webSearchData.slice(2, 5)
    },
    generation_time: Math.random() * 10 + 5,
    title_count: titles.length,
    generation_summary: '基于研究简报和网络搜索数据，生成了5个新闻标题候选',
    total_candidates: 8,
    final_report: '标题生成过程完成，建议重点关注标题1和标题3，它们具有较高的新闻价值和可行性'
  }
}

/**
 * 生成标题工具状态的Mock响应
 */
export function generateMockTitleToolsStatus(): TitleToolsStatusResponse {
  return {
    configured: true,
    available_models: ['deepseek-chat', 'gpt-4', 'claude-3'],
    default_model: 'deepseek-chat'
  }
}

/**
 * 生成大纲生成的Mock响应
 */
export function generateMockOutlineGenerationResponse(
  title: any,
  researchBrief: string,
  webSearchData: any[]
): OutlineGenerationResponse {
  const outline = [
    {
      level: 1,
      title: '引言：AI技术发展的新纪元',
      content_direction: '介绍AI技术发展的背景和重要性，引出文章主题',
      data_requirements: ['AI技术发展统计数据', '行业应用案例'],
      estimated_word_count: 300,
      priority: 'high' as const,
      sources: ['1', '2']
    },
    {
      level: 1,
      title: '技术突破：核心创新解析',
      content_direction: '详细分析AI技术的核心突破和创新点',
      data_requirements: ['技术细节说明', '专家观点引用'],
      estimated_word_count: 500,
      priority: 'high' as const,
      sources: ['3', '4', '5']
    },
    {
      level: 2,
      title: '深度学习算法优化',
      content_direction: '具体说明深度学习算法的优化方法和效果',
      data_requirements: ['算法性能对比数据', '实验结果'],
      estimated_word_count: 250,
      priority: 'medium' as const,
      sources: ['4']
    },
    {
      level: 1,
      title: '应用前景：行业影响分析',
      content_direction: '分析AI技术在各行业的应用前景和影响',
      data_requirements: ['行业应用案例', '市场预测数据'],
      estimated_word_count: 400,
      priority: 'high' as const,
      sources: ['6', '7']
    },
    {
      level: 1,
      title: '挑战与风险：理性看待发展',
      content_direction: '客观分析AI技术发展面临的挑战和风险',
      data_requirements: ['技术限制分析', '伦理风险讨论'],
      estimated_word_count: 350,
      priority: 'medium' as const,
      sources: ['8', '9']
    },
    {
      level: 1,
      title: '结论：未来展望',
      content_direction: '总结全文，对AI技术未来发展进行展望',
      data_requirements: ['发展趋势预测', '专家观点'],
      estimated_word_count: 200,
      priority: 'high' as const,
      sources: ['10']
    }
  ]

  return {
    success: true,
    outline: outline,
    outline_sources_details: {
      引言: webSearchData.slice(0, 2),
      技术突破: webSearchData.slice(2, 5),
      应用前景: webSearchData.slice(5, 7),
      挑战与风险: webSearchData.slice(7, 9),
      结论: webSearchData.slice(9, 10)
    },
    generation_time: Math.random() * 15 + 10,
    section_count: outline.length,
    generation_summary: '基于选定标题和研究数据，生成了详细的文章大纲',
    total_word_estimate: 2000,
    final_report: '大纲生成完成，结构清晰，逻辑严密，建议按照大纲逐步展开写作'
  }
}

/**
 * 生成大纲工具状态的Mock响应
 */
export function generateMockOutlineToolsStatus(): OutlineGenerationStatusResponse {
  return {
    configured: true,
    available_models: ['deepseek-chat', 'gpt-4', 'claude-3'],
    default_model: 'deepseek-chat'
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
