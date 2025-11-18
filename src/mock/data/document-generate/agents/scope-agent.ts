/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Scope Agent Mock 数据
 * 提供Scope Agent相关的模拟响应数据
 */

/**
 * 执行Scope Agent的Mock响应
 */
export const executeScopeAgentMock = (url: string, requestData: any) => {
  const userId = requestData?.params?.user_id || '1'
  const projectId = requestData?.params?.project_id || '1'
  const query = requestData?.data?.query || 'AI技术在医疗领域的应用'

  console.log(`[MOCK] executeScopeAgentMock 被调用`, { url, userId, projectId, query })

  return {
    success: true,
    task_id: `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message: 'Scope Agent任务已启动',
    data: {
      user_id: userId,
      project_id: projectId,
      query: query,
      created_at: new Date().toISOString()
    }
  }
}

/**
 * 获取Scope Agent状态的Mock响应
 */
export const getScopeAgentStatusMock = (url: string) => {
  // 从URL中提取taskId：/scope-agent/status/{taskId}
  const taskId =
    url.split('/').pop() || `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const elapsed = Date.now() - parseInt(taskId.split('_')[1] || '0')
  const progress = Math.min(100, Math.floor(elapsed / 100))

  console.log(`[MOCK] getScopeAgentStatusMock 被调用`, { url, taskId, progress })

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
      research_brief:
        'AI技术在医疗诊断、治疗和健康管理中的应用。研究范围包括人工智能在医疗影像诊断、智能手术系统、个性化治疗方案、药物研发、健康数据分析和患者管理等领域的最新进展和未来趋势。重点关注AI技术如何提高医疗效率、降低成本、改善患者体验，并探讨其在实际应用中面临的挑战和解决方案。',
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
export const getScopeAgentTasksMock = (url: string, requestData?: any) => {
  const userId = requestData?.params?.user_id || '1'
  const projectId = requestData?.params?.project_id || '1'

  return {
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
  }
}

/**
 * 取消Scope Agent任务的Mock响应
 */
export const cancelScopeAgentTaskMock = (url: string) => {
  // 从URL中提取taskId：/scope-agent/cancel/{taskId}
  const taskId = url.split('/').pop() || 'unknown'
  return {
    task_id: taskId,
    status: 'cancelled',
    message: '任务已取消',
    cancelled_at: new Date().toISOString()
  }
}
