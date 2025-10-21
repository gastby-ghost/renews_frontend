import BaseApiService from './base/apiService'
import { mockDataManager } from '@/mock'
import type {
  AgentSearchConfig,
  AgentSearchResult,
  AgentService,
  AgentTask,
  Material
} from '@/types/material'
import type { ApiRequestConfig } from '@/config/api/types'

/**
 * Agent服务接口
 * 提供Agent搜索、分析和推荐功能
 */
class AgentServiceClass extends BaseApiService {
  constructor() {
    super('agent')
  }

  /**
   * 获取可用的Agent服务列表
   */
  async getAvailableAgents(): Promise<AgentService[]> {
    return this.get<AgentService[]>('/services')
  }

  /**
   * 使用Agent进行搜索
   */
  async searchWithAgent(config: AgentSearchConfig): Promise<AgentSearchResult> {
    return this.post<AgentSearchResult>('/search', config)
  }

  /**
   * 创建Agent任务
   */
  async createAgentTask(config: AgentSearchConfig): Promise<AgentTask> {
    return this.post<AgentTask>('/tasks', config)
  }

  /**
   * 获取Agent任务状态
   */
  async getAgentTask(taskId: string): Promise<AgentTask> {
    return this.get<AgentTask>(`/tasks/${taskId}`)
  }

  /**
   * 取消Agent任务
   */
  async cancelAgentTask(taskId: string): Promise<void> {
    return this.post(`/tasks/${taskId}/cancel`)
  }

  /**
   * 获取Agent任务历史
   */
  async getAgentTaskHistory(): Promise<AgentTask[]> {
    return this.get<AgentTask[]>('/tasks/history')
  }

  /**
   * 获取Agent推荐内容
   */
  async getAgentRecommendations(materialId: string): Promise<Material[]> {
    return this.get<Material[]>(`/recommendations/${materialId}`)
  }

  /**
   * 分析素材内容
   */
  async analyzeMaterial(materialId: string): Promise<{
    insights: string
    tags: string[]
    relatedTopics: string[]
    quality: number
  }> {
    return this.get<{
      insights: string
      tags: string[]
      relatedTopics: string[]
      quality: number
    }>(`/analyze/${materialId}`)
  }

  /**
   * 获取Agent能力配置
   */
  async getAgentCapabilities(): Promise<Record<string, string[]>> {
    return this.get<Record<string, string[]>>('/capabilities')
  }

  /**
   * Mock实现方法
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    const { url, method, data } = config

    // 根据不同的API端点返回相应的Mock数据
    if (url?.includes('/services') && method === 'GET') {
      return mockDataManager.getMockData('agent-services')
    }

    if (url?.includes('/search') && method === 'POST') {
      return mockDataManager.getMockData('agent-search-result', data.keywords, data.maxResults)
    }

    if (url?.includes('/tasks') && method === 'POST') {
      return mockDataManager.getMockData('agent-task')
    }

    if (url?.includes('/tasks/') && method === 'GET') {
      return mockDataManager.getMockData('agent-task')
    }

    if (url?.includes('/tasks/history') && method === 'GET') {
      return [mockDataManager.getMockData('agent-task')]
    }

    if (url?.includes('/recommendations/') && method === 'GET') {
      return mockDataManager.getMockData('agent-search-result', '推荐', 3).materials
    }

    if (url?.includes('/analyze/') && method === 'GET') {
      return {
        insights: '这是一个高质量的专业素材，具有良好的参考价值。',
        tags: ['专业', '高质量', '推荐'],
        relatedTopics: ['设计', '创意', '灵感'],
        quality: 4.5
      }
    }

    if (url?.includes('/capabilities') && method === 'GET') {
      return mockDataManager.getMockData('agent-capabilities')
    }

    throw new Error(`未实现的Mock API: ${method} ${url}`)
  }
}

export const agentService = new AgentServiceClass()
