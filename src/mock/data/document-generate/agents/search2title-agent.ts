/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Search2Title Agent Mock 数据
 * 提供Search2Title Agent相关的模拟响应数据
 */

// 使用ES6导入JSON文件
import titleDataJson from '@/mock/json/document-generate-title.json'

// 类型转换
const titleData: TitleData = titleDataJson as unknown as TitleData

// 定义类型接口
interface TitleSource {
  url: string
  webtitle: string
  score: number
  published_date?: string | null
  query?: string
  aititle?: string
  summary?: string
  tags?: string[]
  key_excerpts?: string[]
}

interface Title {
  title: string
  angle: string
  why_now: string
  news_values: string[]
  verifiability: string
  sources: string[]
  risk_notes: string
  feasibility: string
}

interface TitleData {
  titles: Title[]
  generation_summary: string
  total_candidates: number
  final_report: string
  title_sources_details: Record<string, TitleSource[]>
  title_count: number
}

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
    task_id: `search2title_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    status: 'started',
    data: {
      user_id: userId,
      project_id: projectId,
      query: brief,
      expected_title_count: titleData.total_candidates,
      processing_time_estimate: '2-3分钟',
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
    url.split('/').pop() ||
    `search2title_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
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
        web_search_data: Object.values(titleData.title_sources_details)
          .flat()
          .slice(0, 10)
          .map((source: TitleSource) => ({
            title: source.webtitle,
            url: source.url,
            score: source.score,
            published_date: source.published_date || '2024-11-01'
          }))
      },
      title_data: {
        titles: titleData.titles,
        generation_summary: titleData.generation_summary,
        total_candidates: titleData.total_candidates,
        final_report: titleData.final_report
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

  // 基于JSON数据创建多个模拟任务
  const tasks = titleData.titles.map((title: Title, index: number) => ({
    task_id: `search2title_${Date.now() - index * 1000}_task${index}`,
    status: 'completed' as const,
    created_at: new Date(Date.now() - index * 1000 * 60).toISOString(),
    updated_at: new Date(Date.now() - index * 500 * 60).toISOString(),
    query: `AI医疗应用研究 - ${title.title.slice(0, 20)}...`,
    result_count: titleData.total_candidates
  }))

  return {
    success: true,
    message: '获取任务列表成功',
    data: tasks,
    total_count: titleData.title_count
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
