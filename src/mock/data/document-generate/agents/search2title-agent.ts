/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Search2Title Agent Mock 数据
 * 提供Search2Title Agent相关的模拟响应数据
 */

/**
 * 执行Search2Title Agent的Mock响应
 */
export const search2TitleMock = (url: string, requestData: any) => {
  const userId = requestData?.params?.user_id || '1'
  const projectId = requestData?.params?.project_id || '1'
  const brief = requestData?.data?.brief || 'AI技术在医疗领域的应用'

  return {
    success: true,
    message: 'Search2Title Agent任务已启动',
    task_id: `search2title_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'started',
    data: {
      user_id: userId,
      project_id: projectId,
      query: brief,
      created_at: new Date().toISOString()
    }
  }
}

// 别名导出，保持向后兼容
export const executeSearch2TitleAgentMock = search2TitleMock

/**
 * 获取Search2Title Agent状态的Mock响应
 */
export const getSearch2TitleAgentStatusMock = (url: string) => {
  // 从URL中提取taskId：/search2title-agent/status/{taskId}
  const taskId =
    url.split('/').pop() || `search2title_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const elapsed = Date.now() - parseInt(taskId.split('_')[1] || '0')
  const progress = Math.min(100, Math.floor(elapsed / 100))

  if (progress < 100) {
    return {
      task_id: taskId,
      status: 'running',
      progress,
      result: null,
      error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  return {
    task_id: taskId,
    status: 'completed',
    progress: 100,
    result: {
      research_data: {
        web_search_data: [
          {
            title: '人工智能在医疗诊断中的最新进展',
            url: 'https://example.com/ai-medical-diagnosis',
            score: 0.95,
            published_date: '2024-11-01'
          },
          {
            title: '机器人手术系统临床应用报告',
            url: 'https://example.com/robot-surgery',
            score: 0.88,
            published_date: '2024-10-15'
          }
        ]
      },
      title_data: {
        titles: [
          {
            title: '人工智能重塑医疗诊断：95%准确率背后的技术突破',
            angle: '',
            why_now: '',
            news_values: [],
            verifiability: '',
            sources: [],
            risk_notes: '',
            feasibility: ''
          }
        ]
      }
    },
    error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * 获取Search2Title Agent任务列表的Mock响应
 */
export const getSearch2TitleAgentTasksMock = (url: string, requestData?: any) => {
  const userId = requestData?.params?.user_id || '1'
  const projectId = requestData?.params?.project_id || '1'

  return {
    success: true,
    message: '获取任务列表成功',
    data: [
      {
        task_id: `search2title_${Date.now()}_task1`,
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
 * 取消Search2Title Agent任务的Mock响应
 */
export const cancelSearch2TitleAgentTaskMock = (url: string) => {
  // 从URL中提取taskId：/search2title-agent/cancel/{taskId}
  const taskId = url.split('/').pop() || 'unknown'
  return {
    task_id: taskId,
    status: 'cancelled',
    message: '任务已取消',
    cancelled_at: new Date().toISOString()
  }
}
