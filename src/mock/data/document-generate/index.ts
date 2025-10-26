/**
 * 文档生成服务Mock数据
 * 包含scope-agent, title-agent, outline-agent的模拟数据
 */

import type {
  ScopeAgentResponse,
  ScopeAgentStatusResponse,
  ScopeAgentListResponse,
  TitleGenerationResponse,
  TitleToolsStatusResponse,
  OutlineGenerationResponse,
  OutlineGenerationStatusResponse,
  Title,
  OutlineSection
} from '@/types/ai'

/**
 * 生成Scope Agent执行响应
 */
export function generateScopeAgentResponse(userId: string, projectId: string): ScopeAgentResponse {
  return {
    success: true,
    task_id: `scope-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message: 'Scope agent execution started successfully',
    user_id: userId,
    project_id: projectId,
    agent_type: 'scope-agent'
  }
}

/**
 * 生成Scope Agent状态响应
 */
export function generateScopeAgentStatusResponse(taskId: string): ScopeAgentStatusResponse {
  const statuses = ['pending', 'running', 'completed', 'failed'] as const
  const currentStatus = statuses[Math.floor(Math.random() * statuses.length)]

  return {
    task_id: taskId,
    status: currentStatus,
    progress: currentStatus === 'completed' ? 100 : Math.floor(Math.random() * 90),
    result:
      currentStatus === 'completed'
        ? {
            scope_analysis: 'Generated comprehensive scope analysis',
            key_topics: ['Topic 1', 'Topic 2', 'Topic 3'],
            research_directions: ['Direction 1', 'Direction 2'],
            estimated_complexity: 'medium',
            suggested_approach: 'Structured research methodology'
          }
        : null,
    error: currentStatus === 'failed' ? 'Scope analysis failed due to insufficient data' : null,
    user_id: 'user-123',
    project_id: 'project-456',
    agent_type: 'scope-agent',
    created_at: Date.now() - 300000,
    updated_at: Date.now()
  }
}

/**
 * 生成Scope Agent任务列表响应
 */
export function generateScopeAgentListResponse(
  userId: string,
  projectId?: string
): ScopeAgentListResponse {
  const tasks = Array.from({ length: 5 }, (_, index) => ({
    task_id: `scope-agent-task-${index}`,
    status: (['completed', 'running', 'pending'] as const)[Math.floor(Math.random() * 3)],
    progress: Math.floor(Math.random() * 100),
    result: Math.random() > 0.5 ? { summary: `Task ${index} result` } : null,
    error: null,
    user_id: userId,
    project_id: projectId || `project-${index}`,
    agent_type: 'scope-agent',
    created_at: Date.now() - index * 60000,
    updated_at: Date.now() - index * 30000
  }))

  return {
    tasks,
    total_count: tasks.length,
    user_id: userId,
    project_id: projectId || null
  }
}

/**
 * 生成标题对象
 */
function generateTitle(index: number): Title {
  const sampleTitles = [
    '人工智能技术在医疗领域的突破性应用',
    '全球气候变化对经济发展的深远影响',
    '新能源汽车产业迎来重大发展机遇',
    '数字化转型推动企业创新升级',
    '区块链技术在金融领域的创新应用'
  ]

  const sampleAngles = [
    '从技术突破到实际应用的转化过程',
    '多维度分析当前形势与未来趋势',
    '深入探讨产业发展的内在逻辑',
    '全面解析创新驱动的核心要素',
    '系统梳理技术变革的演进路径'
  ]

  return {
    title: sampleTitles[index % sampleTitles.length],
    angle: sampleAngles[index % sampleAngles.length],
    why_now: '当前时机具有重要战略意义，各方关注度高涨',
    news_values: ['Timeliness', 'Impact', 'Proximity', 'Human Interest'],
    verifiability: '基于公开数据和权威报告，信息来源可靠',
    sources: ['1', '2', '3'],
    risk_notes: '需要持续关注政策变化和市场动态',
    feasibility: '具备充分的实施条件和资源保障'
  }
}

/**
 * 生成标题生成响应
 */
export function generateTitleGenerationResponse(): TitleGenerationResponse {
  const titles = Array.from({ length: 5 }, (_, index) => generateTitle(index))

  return {
    success: true,
    titles,
    title_sources_details: {
      'title-1': [{ source: 'source-1', relevance: 0.9 }],
      'title-2': [{ source: 'source-2', relevance: 0.8 }]
    },
    generation_time: 15.5,
    title_count: titles.length,
    generation_summary: 'Generated diverse title options based on comprehensive research analysis',
    total_candidates: 12,
    final_report: 'Title generation completed successfully with high-quality candidates'
  }
}

/**
 * 生成标题工具状态响应
 */
export function generateTitleToolsStatusResponse(): TitleToolsStatusResponse {
  return {
    configured: true,
    available_models: ['deepseek-chat', 'gpt-4', 'claude-3'],
    default_model: 'deepseek-chat'
  }
}

/**
 * 生成大纲章节
 */
function generateOutlineSection(level: number, index: number): OutlineSection {
  const sectionTitles = [
    '背景与现状分析',
    '核心问题探讨',
    '解决方案研究',
    '实施路径规划',
    '效果评估与展望'
  ]

  const contentDirections = [
    '深入分析当前发展现状，梳理关键问题和挑战',
    '系统探讨核心问题的本质特征和影响因素',
    '全面研究可行的解决方案及其优劣势比较',
    '详细规划具体的实施步骤和时间安排',
    '科学评估预期效果并提出未来发展展望'
  ]

  return {
    level,
    title: sectionTitles[index % sectionTitles.length],
    content_direction: contentDirections[index % contentDirections.length],
    data_requirements: ['统计数据', '案例分析', '专家观点'],
    estimated_word_count: level === 1 ? 800 : 400,
    priority: (['high', 'medium', 'low'] as const)[index % 3],
    sources: ['1', '2']
  }
}

/**
 * 生成大纲生成响应
 */
export function generateOutlineGenerationResponse(): OutlineGenerationResponse {
  const outline = [
    generateOutlineSection(1, 0),
    generateOutlineSection(2, 1),
    generateOutlineSection(2, 2),
    generateOutlineSection(2, 3),
    generateOutlineSection(1, 4),
    generateOutlineSection(2, 5),
    generateOutlineSection(2, 6)
  ]

  return {
    success: true,
    outline,
    outline_sources_details: {
      'section-1': [{ source: 'research-paper', relevance: 0.9 }],
      'section-2': [{ source: 'industry-report', relevance: 0.8 }]
    },
    generation_time: 25.3,
    section_count: outline.length,
    generation_summary:
      'Generated comprehensive outline with logical structure and detailed content directions',
    total_word_estimate: 2800,
    final_report:
      'Outline generation completed with well-structured sections and clear writing guidance'
  }
}

/**
 * 生成大纲工具状态响应
 */
export function generateOutlineToolsStatusResponse(): OutlineGenerationStatusResponse {
  return {
    configured: true,
    available_models: ['deepseek-chat', 'gpt-4', 'claude-3'],
    default_model: 'deepseek-chat'
  }
}
