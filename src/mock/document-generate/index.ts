/**
 * 文档生成 Mock 数据管理器
 *
 * 职责：集中管理文档生成相关的 Mock 数据
 * 解耦业务逻辑与 Mock 数据
 */

/**
 * Scope Agent 任务状态跟踪
 */
class ScopeTaskTracker {
  private tasks = new Map<
    string,
    { status: string; progress: number; result: any; createdAt: number }
  >()

  /**
   * 创建任务
   */
  createTask(taskId: string): { status: string; progress: number; result: any; createdAt: number } {
    const task = {
      status: 'pending',
      progress: 0,
      result: null,
      createdAt: Date.now()
    }
    this.tasks.set(taskId, task)
    return task
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(
    taskId: string
  ): { status: string; progress: number; result: any; createdAt: number } | null {
    const task = this.tasks.get(taskId)
    if (!task) return null

    // 根据任务创建时间计算状态
    const elapsed = Date.now() - task.createdAt
    if (elapsed < 2000) {
      task.status = 'pending'
      task.progress = 10
    } else if (elapsed < 5000) {
      task.status = 'running'
      task.progress = Math.min(90, Math.floor(elapsed / 50))
    } else {
      task.status = 'completed'
      task.progress = 100
      if (!task.result) {
        task.result = {
          research_brief: `# AI简报生成结果\n\n## 任务概述\n本次AI简报生成任务已成功完成，分析了用户提供的需求并生成了详细的研究简报。\n\n## 核心发现\n1. **市场趋势**：当前市场对AI技术需求持续增长\n2. **技术发展**：AI技术不断成熟，应用场景日益丰富\n3. **挑战与机遇**：企业在数字化转型中面临诸多挑战，但也蕴含巨大机遇\n\n## 建议方向\n- 深入研究具体应用场景\n- 关注技术发展趋势\n- 重视数据质量和安全性\n\n## 关键要点\n- 需要大量真实数据支撑\n- 关注用户需求变化\n- 重视技术可行性评估`
        }
      }
    }

    return task
  }
}

/**
 * 文档生成 Mock 数据管理器
 */
class DocumentGenerateMockManager {
  private scopeTaskTracker = new ScopeTaskTracker()

  /**
   * 获取 Scope Agent 执行 Mock 数据
   */
  getScopeAgentExecute(_userId: string, _projectId: string) {
    const taskId = `scope-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    this.scopeTaskTracker.createTask(taskId)

    return {
      success: true,
      task_id: taskId,
      message: 'Scope Agent 执行成功',
      user_id: _userId,
      project_id: _projectId,
      agent_type: 'scope'
    }
  }

  /**
   * 获取 Scope Agent 状态 Mock 数据
   */
  getScopeAgentStatus(taskId: string) {
    const task = this.scopeTaskTracker.getTaskStatus(taskId)

    if (!task) {
      // 如果任务不存在，创建一个
      const newTask = this.scopeTaskTracker.createTask(taskId)
      return this.formatScopeStatusResponse(taskId, newTask)
    }

    return this.formatScopeStatusResponse(taskId, task)
  }

  /**
   * 格式化 Scope Agent 状态响应
   */
  private formatScopeStatusResponse(
    taskId: string,
    task: { status: string; progress: number; result: any; createdAt: number }
  ) {
    const now = Date.now()
    return {
      task_id: taskId,
      status: task.status as 'pending' | 'running' | 'completed' | 'failed',
      progress: task.progress,
      result: task.result,
      error: null,
      user_id: 'mock-user',
      project_id: 'mock-project',
      agent_type: 'scope',
      created_at: task.createdAt,
      updated_at: now
    }
  }

  /**
   * 获取 Scope Agent 任务列表 Mock 数据
   */
  getScopeAgentList(_userId?: string, _projectId?: string) {
    return {
      tasks: [
        {
          task_id: 'scope-001',
          status: 'completed',
          progress: 100,
          user_id: 'mock-user',
          project_id: 'mock-project',
          agent_type: 'scope',
          created_at: Date.now() - 3600000,
          updated_at: Date.now() - 3600000
        }
      ],
      total_count: 1,
      user_id: _userId || 'mock-user',
      project_id: _projectId || 'mock-project'
    }
  }

  /**
   * 获取标题生成 Mock 数据
   */
  getTitleGeneration() {
    return {
      success: true,
      message: '标题生成成功',
      data: {
        titles: [
          {
            title: 'AI技术在现代企业管理中的应用与挑战',
            angle: '技术创新视角',
            why_now: '数字化转型加速',
            news_values: ['时效性', '重要性', '接近性'],
            verifiability: '容易验证',
            sources: ['企业报告', '行业研究'],
            risk_notes: '无重大风险',
            feasibility: '高'
          },
          {
            title: '人工智能重塑商业模式的五大趋势',
            angle: '市场分析视角',
            why_now: '技术成熟度提升',
            news_values: ['新颖性', '影响力', '时效性'],
            verifiability: '中等难度',
            sources: ['市场调研', '专家访谈'],
            risk_notes: '需注意数据准确性',
            feasibility: '中'
          }
        ],
        title_count: 2
      }
    }
  }

  /**
   * 获取标题工具状态 Mock 数据
   */
  getTitleToolsStatus() {
    return {
      success: true,
      message: '工具状态正常',
      data: {
        available: true,
        model_status: 'running',
        queue_size: 0
      }
    }
  }

  /**
   * 获取大纲生成 Mock 数据
   */
  getOutlineGeneration() {
    return {
      success: true,
      message: '大纲生成成功',
      data: {
        outline: [
          {
            level: 1,
            title: '引言',
            content_direction: '介绍AI技术的背景和重要性',
            data_requirements: ['市场数据', '技术发展历程'],
            estimated_word_count: 300,
            priority: 'high',
            sources: ['权威报告']
          },
          {
            level: 1,
            title: 'AI技术在企业管理中的应用现状',
            content_direction: '分析当前AI技术在各业务场景的应用情况',
            data_requirements: ['案例分析', '应用统计'],
            estimated_word_count: 800,
            priority: 'high',
            sources: ['企业调研']
          },
          {
            level: 1,
            title: '面临的挑战与解决方案',
            content_direction: '识别挑战并提出应对策略',
            data_requirements: ['问题分析', '解决方案'],
            estimated_word_count: 600,
            priority: 'medium',
            sources: ['专家观点']
          }
        ],
        section_count: 3,
        total_word_estimate: 1700
      }
    }
  }

  /**
   * 获取大纲工具状态 Mock 数据
   */
  getOutlineToolsStatus() {
    return {
      success: true,
      message: '工具状态正常',
      data: {
        available: true,
        model_status: 'running',
        queue_size: 0
      }
    }
  }

  /**
   * 获取 Search2Title Agent 执行 Mock 数据
   */
  getSearch2TitleAgentExecute(
    _userId: string,
    _projectId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _brief: string
  ) {
    const taskId = `search2title-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

    return {
      success: true,
      task_id: taskId,
      message: 'Search2Title Agent 执行成功',
      user_id: _userId,
      project_id: _projectId,
      agent_type: 'search2title',
      is_default_project: false
    }
  }

  /**
   * 获取 Search2Title Agent 状态 Mock 数据
   */
  getSearch2TitleAgentStatus(taskId: string) {
    // 模拟任务状态变化
    const elapsed = Date.now() - parseInt(taskId.split('-')[1] || Date.now().toString())
    let status: 'pending' | 'running' | 'completed' | 'failed'
    let progress: number

    if (elapsed < 2000) {
      status = 'pending'
      progress = 10
    } else if (elapsed < 8000) {
      status = 'running'
      progress = Math.min(90, Math.floor(elapsed / 80))
    } else {
      status = 'completed'
      progress = 100
    }

    return {
      task_id: taskId,
      status,
      progress,
      result:
        status === 'completed'
          ? {
              title_data: {
                titles: [
                  {
                    title: '基于AI的智能搜索技术发展报告',
                    angle: '技术发展',
                    why_now: '技术突破',
                    news_values: ['创新性', '影响力'],
                    verifiability: '容易验证',
                    sources: ['1', '2'],
                    risk_notes: '无',
                    feasibility: '高'
                  }
                ]
              },
              research_data: {
                web_search_data: [
                  {
                    url: 'https://example.com/article1',
                    score: 0.95,
                    query: 'AI search technology',
                    summary: '文章摘要',
                    tags: ['AI', 'Search'],
                    key_excerpts: ['关键摘要1', '关键摘要2']
                  }
                ]
              }
            }
          : null,
      error: null,
      user_id: 'mock-user',
      project_id: 'mock-project',
      agent_type: 'search2title',
      created_at: Date.now() - elapsed,
      updated_at: Date.now(),
      is_default_project: false,
      research_data: null,
      title_data: null,
      current_phase: status === 'running' ? 'title_generation' : null
    }
  }

  /**
   * 获取 Search2Title Agent 任务列表 Mock 数据
   */
  getSearch2TitleAgentList(_userId?: string, _projectId?: string) {
    return {
      tasks: [
        {
          task_id: 'search2title-001',
          status: 'completed',
          progress: 100,
          user_id: 'mock-user',
          project_id: 'mock-project',
          agent_type: 'search2title',
          created_at: Date.now() - 1800000,
          updated_at: Date.now() - 1800000,
          is_default_project: false,
          research_data: null,
          title_data: null,
          current_phase: null
        }
      ],
      total_count: 1,
      user_id: _userId || 'mock-user',
      project_id: _projectId || 'mock-project'
    }
  }

  /**
   * 获取默认响应
   */
  getDefaultResponse(url: string, method: string) {
    return {
      success: true,
      message: `文档生成服务Mock响应 - ${method} ${url}`,
      data: {
        mock: true,
        timestamp: Date.now(),
        request_info: {
          url,
          method
        }
      }
    }
  }
}

// 导出单例
export const documentGenerateMockManager = new DocumentGenerateMockManager()
export default documentGenerateMockManager
