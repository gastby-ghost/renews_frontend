/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Scope Agent Mock 数据
 * 提供Scope Agent相关的模拟响应数据
 */

// 导入真实的breif数据
import briefData from '@/mock/json/breif.json'

// 定义类型接口
interface BriefResult {
  brief: string
}

interface BreifData {
  task_id: string
  status: string
  progress: number
  result: BriefResult
  error: null
  user_id: string
  project_id: string
  agent_type: string
  created_at: number
  updated_at: number
}

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
      research_brief: briefData.result.brief,
      research_scope: '人工智能技术在医疗健康领域的应用、发展和影响',
      key_topics: ['疾病诊断', '药物研发', '医疗影像分析', '个性化治疗'],
      target_audience: '医疗专业人士、技术决策者、研究者',
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
