import http from '@/utils/http'
import type {
  AgentSearchConfig,
  AgentSearchResult,
  AgentService,
  AgentTask,
  Material
} from '@/types/material'

/**
 * Agent服务接口
 * 提供Agent搜索、分析和推荐功能
 */
class AgentServiceClass {
  private baseUrl = '/api/agent'

  /**
   * 获取可用的Agent服务列表
   */
  async getAvailableAgents(): Promise<AgentService[]> {
    try {
      const response = await http.get<AgentService[]>({
        url: `${this.baseUrl}/services`
      })
      return response
    } catch (error) {
      console.error('Get available agents error:', error)
      throw new Error('获取Agent服务列表失败')
    }
  }

  /**
   * 使用Agent进行搜索
   */
  async searchWithAgent(config: AgentSearchConfig): Promise<AgentSearchResult> {
    try {
      const response = await http.post<AgentSearchResult>({
        url: `${this.baseUrl}/search`,
        data: config
      })
      return response
    } catch (error) {
      console.error('Agent search error:', error)
      throw new Error('Agent搜索失败')
    }
  }

  /**
   * 创建Agent任务
   */
  async createAgentTask(config: AgentSearchConfig): Promise<AgentTask> {
    try {
      const response = await http.post<AgentTask>({
        url: `${this.baseUrl}/tasks`,
        data: config
      })
      return response
    } catch (error) {
      console.error('Create agent task error:', error)
      throw new Error('创建Agent任务失败')
    }
  }

  /**
   * 获取Agent任务状态
   */
  async getAgentTask(taskId: string): Promise<AgentTask> {
    try {
      const response = await http.get<AgentTask>({
        url: `${this.baseUrl}/tasks/${taskId}`
      })
      return response
    } catch (error) {
      console.error('Get agent task error:', error)
      throw new Error('获取Agent任务状态失败')
    }
  }

  /**
   * 取消Agent任务
   */
  async cancelAgentTask(taskId: string): Promise<void> {
    try {
      await http.post({
        url: `${this.baseUrl}/tasks/${taskId}/cancel`
      })
    } catch (error) {
      console.error('Cancel agent task error:', error)
      throw new Error('取消Agent任务失败')
    }
  }

  /**
   * 获取Agent任务历史
   */
  async getAgentTaskHistory(): Promise<AgentTask[]> {
    try {
      const response = await http.get<AgentTask[]>({
        url: `${this.baseUrl}/tasks/history`
      })
      return response
    } catch (error) {
      console.error('Get agent task history error:', error)
      throw new Error('获取Agent任务历史失败')
    }
  }

  /**
   * 获取Agent推荐内容
   */
  async getAgentRecommendations(materialId: string): Promise<Material[]> {
    try {
      const response = await http.get<Material[]>({
        url: `${this.baseUrl}/recommendations/${materialId}`
      })
      return response
    } catch (error) {
      console.error('Get agent recommendations error:', error)
      throw new Error('获取Agent推荐失败')
    }
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
    try {
      const response = await http.get<{
        insights: string
        tags: string[]
        relatedTopics: string[]
        quality: number
      }>({
        url: `${this.baseUrl}/analyze/${materialId}`
      })
      return response
    } catch (error) {
      console.error('Analyze material error:', error)
      throw new Error('分析素材内容失败')
    }
  }

  /**
   * 获取Agent能力配置
   */
  async getAgentCapabilities(): Promise<Record<string, string[]>> {
    try {
      const response = await http.get<Record<string, string[]>>({
        url: `${this.baseUrl}/capabilities`
      })
      return response
    } catch (error) {
      console.error('Get agent capabilities error:', error)
      throw new Error('获取Agent能力配置失败')
    }
  }

  // Mock方法，用于开发测试
  async mockSearchWithAgent(config: AgentSearchConfig): Promise<AgentSearchResult> {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000))

    // 模拟搜索结果
    const mockMaterials: Material[] = Array.from(
      { length: config.maxResults || 10 },
      (_, index) => ({
        id: `agent-${config.agentType}-${Date.now()}-${index}`,
        title: `Agent增强: ${config.keywords} - 相关素材 ${index + 1}`,
        source: `Agent-${config.agentType}`,
        summary: `通过${config.agentType} Agent分析，这是关于${config.keywords}的高质量素材。Agent已智能分析内容相关性、质量和适用性，确保素材满足您的需求。`,
        tags: [config.keywords, 'Agent推荐', '智能分析', '高质量', '专业'],
        type: ['image', 'video', 'text', 'other'][
          Math.floor(Math.random() * 4)
        ] as Material['type'],
        url: `https://example.com/agent-material-${index + 1}`,
        thumbnail: `https://picsum.photos/300/200?random=agent-${Date.now()}-${index}`,
        content: `Agent分析内容：这是经过${config.agentType} Agent智能筛选和优化的素材，具有高度相关性和专业质量。`,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 30),
        selected: false
      })
    )

    // 模拟推荐内容
    const recommendations: Material[] = Array.from({ length: 3 }, (_, index) => ({
      id: `agent-rec-${Date.now()}-${index}`,
      title: `Agent推荐: 相关素材 ${index + 1}`,
      source: 'Agent-Recommendation',
      summary: `基于您的搜索需求，Agent推荐此相关素材。`,
      tags: ['Agent推荐', '相关', '智能匹配'],
      type: ['image', 'video', 'text'][Math.floor(Math.random() * 3)] as Material['type'],
      url: `https://example.com/agent-rec-${index + 1}`,
      thumbnail: `https://picsum.photos/300/200?random=rec-${Date.now()}-${index}`,
      createdAt: new Date(),
      selected: false
    }))

    // 模拟相关查询
    const relatedQueries = [
      `${config.keywords} 高级`,
      `${config.keywords} 专业版`,
      `${config.keywords} 创意设计`,
      `${config.keywords} 最佳实践`
    ]

    return {
      materials: mockMaterials,
      total: mockMaterials.length,
      page: 1,
      pageSize: config.maxResults || 10,
      agentInsights: `基于您的搜索"${config.keywords}"，${config.agentType} Agent分析了多个数据源，发现了${mockMaterials.length}个高度相关的素材。Agent认为这些素材在质量、相关性和适用性方面都表现出色，特别适合您的需求。`,
      recommendations,
      relatedQueries,
      processingTime: 2.5 + Math.random() * 2
    }
  }

  /**
   * 模拟创建Agent任务
   */
  async mockCreateAgentTask(config: AgentSearchConfig): Promise<AgentTask> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return {
      id: taskId,
      type: 'search',
      status: 'pending',
      progress: 0,
      message: '任务已创建，等待执行...',
      config,
      createdAt: new Date()
    }
  }

  /**
   * 模拟任务执行过程
   */
  async mockExecuteTask(taskId: string, config: AgentSearchConfig): Promise<AgentTask> {
    // 模拟任务执行延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 更新任务状态为运行中
    const runningTask: AgentTask = {
      id: taskId,
      type: 'search',
      status: 'running',
      progress: 25,
      message: '正在分析搜索需求...',
      config,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 继续模拟执行
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 更新进度
    runningTask.progress = 60
    runningTask.message = '正在搜索相关素材...'

    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 完成任务
    runningTask.status = 'completed'
    runningTask.progress = 100
    runningTask.message = '任务完成'
    runningTask.updatedAt = new Date()

    return runningTask
  }
}

export const agentService = new AgentServiceClass()
