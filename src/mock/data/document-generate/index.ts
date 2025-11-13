/**
 * 文档生成服务Mock数据统一导出
 * 包含所有AI Agent和核心业务的模拟数据
 */

export * from './agents'
export * from './core'

import type {
  ScopeAgentResponse,
  ScopeAgentStatusResponse,
  ScopeAgentListResponse,
  Search2TitleAgentResponse,
  Search2TitleAgentStatusResponse,
  Search2TitleAgentListResponse,
  TitleGenerationResponse,
  TitleToolsStatusResponse,
  OutlineGenerationResponse,
  OutlineGenerationStatusResponse,
  Title,
  OutlineSection
} from '@/types/ai'

import { MockTaskTracker } from '@/utils/mockTaskTracker'
import documentGenerateTitle from '../../json/document-generate-title.json'
import searchData from '../../json/search.json'

// 任务跟踪器实例
const scopeTaskTracker = new MockTaskTracker()
const search2TitleTaskTracker = new MockTaskTracker()

/**
 * 生成Scope Agent执行响应
 */
export function generateScopeAgentResponse(userId: string, projectId: string): ScopeAgentResponse {
  const now = Date.now()
  console.log(`[DEBUG] generateScopeAgentResponse - creating task at timestamp: ${now}`)
  return {
    success: true,
    task_id: `scope-agent-${now}-${Math.random().toString(36).substr(2, 9)}`,
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
  console.log(`[DEBUG] generateScopeAgentStatusResponse - taskId: ${taskId}`)

  // 使用任务跟踪器更新任务状态
  const taskRecord = scopeTaskTracker.getTaskStatus(taskId)
  console.log(`[DEBUG] generateScopeAgentStatusResponse - taskRecord:`, taskRecord)

  if (!taskRecord) {
    console.log(`[DEBUG] generateScopeAgentStatusResponse - creating new task`)
    // 如果任务不存在，创建一个
    scopeTaskTracker.createTask(taskId, {
      research_brief:
        '我需要进行关于人工智能在医疗领域应用的新闻选题调研。\n\n主题和范围：人工智能技术在医疗健康领域的应用、发展和影响，重点关注诊断辅助、药物研发、医疗影像分析、个性化治疗等具体应用场景。\n\n关键信息维度：\n- 时间：重点关注近期的技术突破和应用案例（近3-6个月）\n- 地点：全球范围，特别关注中国、美国、欧洲等主要医疗科技发展地区\n- 人物：AI医疗领域的领军企业、科研机构、医疗专家\n- 事件：AI医疗产品的获批上市、临床试验结果、技术突破、政策支持\n- 影响：AI医疗对医疗效率、诊断准确性、医疗成本的影响\n- 争议：数据隐私、算法偏见、监管挑战、伦理问题\n- 数据：AI医疗市场规模、应用效果数据、用户接受度统计\n\n语言与地区：中文为主，主要关注中国及全球AI医疗发展动态\n\n时效性要求：重点关注近期（近3个月）的重要进展和突破性成果\n\n期望体裁：深度报道，结合案例分析和技术解读\n\n来源优先级：\n1. 官方监管机构公告（如国家药监局、FDA等）\n2. 权威医学期刊和学术论文\n3. 上市公司公告和财报\n4. 知名医疗科技公司官方发布\n5. 权威医疗媒体和专业机构报告\n6. 学术会议和行业峰会信息'
    })
  }

  // 根据时间更新任务状态
  scopeTaskTracker.updateTaskByTime(taskId)
  const task = scopeTaskTracker.getTaskStatus(taskId)!
  console.log(`[DEBUG] generateScopeAgentStatusResponse - updated task:`, task)

  // 返回一个新的对象，确保Vue能检测到变化
  const response = {
    task_id: taskId,
    status: task.status,
    progress: task.progress,
    result: task.status === 'completed' ? task.result : null,
    error: task.status === 'failed' ? task.error : null,
    user_id: 'user-123',
    project_id: 'project-456',
    agent_type: 'scope-agent',
    created_at: task.createdAt,
    updated_at: task.updatedAt
  }

  console.log(`[DEBUG] generateScopeAgentStatusResponse - returning response:`, response)

  return response
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
 * 生成Search2Title Agent执行响应
 */
export function generateSearch2TitleAgentResponse(
  userId: string,
  projectId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  brief: string
): Search2TitleAgentResponse {
  return {
    success: true,
    task_id: `search2title-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message: 'Search2Title agent execution started successfully',
    user_id: userId,
    project_id: projectId,
    agent_type: 'search2title-agent',
    is_default_project: false
  }
}

/**
 * 生成Search2Title Agent状态响应
 */
export function generateSearch2TitleAgentStatusResponse(
  taskId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  brief?: string
): Search2TitleAgentStatusResponse {
  // 使用任务跟踪器更新任务状态
  const taskRecord = search2TitleTaskTracker.getTaskStatus(taskId)

  if (!taskRecord) {
    // 从JSON文件中获取搜索结果数据
    // 从JSON文件中获取标题数据
    const mockTitles: Title[] = documentGenerateTitle.titles

    // 创建任务，初始化结果数据
    search2TitleTaskTracker.createTask(taskId, {
      research_data: searchData,
      title_data: {
        titles: mockTitles,
        generation_summary: documentGenerateTitle.generation_summary
      }
    })
  }

  // 根据时间更新任务状态
  search2TitleTaskTracker.updateSearch2TitleTaskByTime(taskId)
  const task = search2TitleTaskTracker.getTaskStatus(taskId)!

  return {
    task_id: taskId,
    status: task.status,
    progress: task.progress,
    result: task.status === 'completed' ? task.result : null,
    error: task.status === 'failed' ? task.error : null,
    user_id: 'user-123',
    project_id: 'project-456',
    agent_type: 'search2title-agent',
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    is_default_project: false,
    research_data: task.status === 'completed' ? task.result.research_data.web_search_data : null,
    title_data:
      task.status === 'completed'
        ? {
            titles: documentGenerateTitle.titles,
            generation_summary: documentGenerateTitle.generation_summary
          }
        : null,
    current_phase: task.status === 'running' ? 'title_generation' : null
  }
}

/**
 * 生成Search2Title Agent任务列表响应
 */
export function generateSearch2TitleAgentListResponse(
  userId: string,
  projectId?: string
): Search2TitleAgentListResponse {
  const tasks = Array.from({ length: 3 }, (_, index) => ({
    task_id: `search2title-agent-task-${index}`,
    status: (['completed', 'running', 'pending'] as const)[Math.floor(Math.random() * 3)],
    progress: Math.floor(Math.random() * 100),
    result:
      Math.random() > 0.5
        ? {
            research_data: { research_brief: `Task ${index} research brief` },
            title_data: { titles: [], generation_summary: `Task ${index} summary` }
          }
        : null,
    error: null,
    user_id: userId,
    project_id: projectId || `project-${index}`,
    agent_type: 'search2title-agent',
    created_at: Date.now() - index * 60000,
    updated_at: Date.now() - index * 30000,
    is_default_project: false,
    research_data: null,
    title_data: null,
    current_phase: null
  }))

  return {
    tasks,
    total_count: tasks.length,
    user_id: userId,
    project_id: projectId || null
  }
}

/**
 * 生成标题生成响应
 */
export function generateTitleGenerationResponse(): TitleGenerationResponse {
  return documentGenerateTitle
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
