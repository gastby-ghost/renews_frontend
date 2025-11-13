/**
 * Scope Agent Mock 数据
 * 提供Scope Agent相关的模拟响应数据
 */

/**
 * 执行Scope Agent的Mock响应
 */
export const executeScopeAgentMock = (userId?: string, projectId?: string) => ({
  task_id: `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  status: 'started',
  message: 'Scope Agent任务已启动',
  data: {
    user_id: userId || '1',
    project_id: projectId || '1',
    query: 'AI技术在医疗领域的应用',
    created_at: new Date().toISOString()
  }
})

/**
 * 获取Scope Agent状态的Mock响应
 */
export const getScopeAgentStatusMock = (taskId: string) => {
  const elapsed = Date.now() - parseInt(taskId.split('_')[1] || '0')
  const progress = Math.min(100, Math.floor(elapsed / 100))

  if (progress < 100) {
    return {
      task_id: taskId,
      status: 'running',
      progress,
      data: null,
      error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  return {
    task_id: taskId,
    status: 'completed',
    progress: 100,
    data: {
      research_scope: 'AI技术在医疗诊断、治疗和健康管理中的应用',
      key_topics: ['AI诊断系统', '机器人手术', '健康管理平台', '医疗数据分析'],
      target_audience: '医疗专业人士、技术决策者、患者',
      estimated_word_count: 5000,
      complexity_level: 'medium'
    },
    error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * 获取Scope Agent任务列表的Mock响应
 */
export const getScopeAgentTasksMock = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _projectId?: string
) => ({
  success: true,
  message: '获取任务列表成功',
  data: [
    {
      task_id: `scope_${Date.now()}_task1`,
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      query: 'AI技术在医疗领域的应用'
    }
  ],
  total_count: 1
})

/**
 * 取消Scope Agent任务的Mock响应
 */
export const cancelScopeAgentTaskMock = (taskId: string) => ({
  task_id: taskId,
  status: 'cancelled',
  message: '任务已取消',
  cancelled_at: new Date().toISOString()
})
