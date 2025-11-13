/**
 * Search2Title Agent Mock 数据
 * 提供Search2Title Agent相关的模拟响应数据
 */

/**
 * 执行Search2Title Agent的Mock响应
 */
export const executeSearch2TitleAgentMock = (
  userId?: string,
  projectId?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _brief?: string
) => ({
  task_id: `search2title_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  status: 'started',
  message: 'Search2Title Agent任务已启动',
  data: {
    user_id: userId || '1',
    project_id: projectId || '1',
    query: 'AI技术在医疗领域的应用',
    created_at: new Date().toISOString()
  }
})

/**
 * 获取Search2Title Agent状态的Mock响应
 */
export const getSearch2TitleAgentStatusMock = (
  taskId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _brief?: string
) => {
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
      search_results: [
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
      ],
      generated_titles: [
        {
          content: '人工智能重塑医疗诊断：95%准确率背后的技术突破',
          source: '基于搜索结果自动生成',
          score: 0.92
        }
      ],
      summary: '基于搜索结果生成了1个高质量标题'
    },
    error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * 获取Search2Title Agent任务列表的Mock响应
 */
export const getSearch2TitleAgentTasksMock = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _projectId?: string
) => ({
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
})

/**
 * 取消Search2Title Agent任务的Mock响应
 */
export const cancelSearch2TitleAgentTaskMock = (taskId: string) => ({
  task_id: taskId,
  status: 'cancelled',
  message: '任务已取消',
  cancelled_at: new Date().toISOString()
})
