/**
 * AI大纲生成服务 - 基于OpenAPI配置
 * 专门服务于大纲生成相关功能
 * 支持Mock/真实API切换
 */

import BaseApiService from '../base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import {
  AsyncTaskPoller,
  type PollingConfig,
  type PollingTask,
  TaskStatus
} from '@/utils/polling/asyncTaskPoller'
import { MockTaskTracker, MockDataManager } from '@/mock'

// 导入大纲生成相关类型定义
import type {
  OutlineGenerationRequest,
  OutlineGenerationResponse,
  OutlineToolsStatusResponse
} from '@/types/ai/outline-generate'

class OutlineGenerateService extends BaseApiService {
  private taskTracker = new MockTaskTracker()
  private dataManager = new MockDataManager()

  constructor() {
    super('outlineGenerate')
  }

  // ============= 大纲生成服务 =============

  /**
   * 生成大纲内容
   * @param request 大纲生成请求参数
   * @param options API请求选项
   * @returns 生成任务响应
   */
  async generateOutline(request: OutlineGenerationRequest, options?: ApiRequestConfig) {
    return this.post<OutlineGenerationResponse>(
      '/document_generate/outline-agent/generate',
      request,
      options
    )
  }

  /**
   * 获取大纲生成工具状态
   * @param options API请求选项
   * @returns 工具状态信息
   */
  async getOutlineToolsStatus(options?: ApiRequestConfig) {
    return this.get<OutlineToolsStatusResponse>(
      '/document_generate/outline-agent/status',
      undefined,
      options
    )
  }

  /**
   * 获取大纲生成任务状态
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 任务状态
   */
  async getOutlineTaskStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get<OutlineGenerationResponse>(
      `/document_generate/outline-agent/tasks/${taskId}`,
      undefined,
      options
    )
  }

  /**
   * 取消大纲生成任务
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 取消结果
   */
  async cancelOutlineTask(taskId: string, options?: ApiRequestConfig) {
    return this.delete(`/document_generate/outline-agent/tasks/${taskId}`, undefined, options)
  }

  /**
   * 启动大纲生成并轮询完成
   * @param request 大纲生成请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务结果
   */
  async generateOutlineWithPolling(
    request: OutlineGenerationRequest,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.generateOutline(request)
    const taskId = (response as any).task_id

    if (!taskId) {
      throw new Error('大纲生成任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getOutlineTaskStatus(taskId).then((result) => ({
          status: (result as any).status || TaskStatus.RUNNING,
          data: result,
          isCompleted: (result as any).status === TaskStatus.COMPLETED
        })),
      {
        interval: 2000,
        timeout: 180000,
        maxAttempts: 90,
        ...pollingConfig
      }
    )

    return poller.start(`outline-generate-${taskId}`)
  }

  /**
   * 启动大纲生成并等待完成
   * @param request 大纲生成请求参数
   * @param pollingConfig 轮询配置
   * @returns 生成结果
   */
  async generateOutlineAndWait(
    request: OutlineGenerationRequest,
    pollingConfig?: PollingConfig
  ): Promise<OutlineGenerationResponse> {
    const task = await this.generateOutlineWithPolling(request, pollingConfig)
    const result = await task.promise

    if (result.status !== TaskStatus.COMPLETED) {
      throw new Error(`大纲生成任务失败: ${result.error}`)
    }

    return result.data as OutlineGenerationResponse
  }

  /**
   * 基于主题快速生成大纲
   * @param topic 主题
   * @param options 生成选项
   * @param pollingConfig 轮询配置
   * @returns 生成结果
   */
  async quickGenerateOutline(
    topic: string,
    options?: {
      length?: 'brief' | 'detailed' | 'comprehensive'
      sections_count?: number
      language?: string
    },
    pollingConfig?: PollingConfig
  ): Promise<OutlineGenerationResponse> {
    const request: OutlineGenerationRequest = {
      topic,
      length: options?.length || 'detailed',
      sections_count: options?.sections_count || 5,
      language: options?.language || 'zh-CN',
      structure_type: 'hierarchical'
    }

    return this.generateOutlineAndWait(request, pollingConfig)
  }

  /**
   * 生成大纲生成工具状态Mock数据
   */
  private generateOutlineToolsStatus() {
    return this.dataManager.getMockData('outline-tools-status', () => ({
      service_status: 'available',
      active_tasks: Math.floor(Math.random() * 3) + 1,
      max_concurrent_tasks: 3,
      average_processing_time: Math.floor(Math.random() * 20) + 25,
      supported_languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR'],
      supported_structure_types: [
        'linear',
        'hierarchical',
        'mindmap',
        'spiral',
        'compare-contrast'
      ],
      performance_metrics: {
        success_rate: Math.random() * 0.1 + 0.9, // 90-100%
        average_quality_score: Math.random() * 0.3 + 0.7, // 70-100%
        daily_outlines: Math.floor(Math.random() * 150) + 50
      },
      advanced_features: {
        auto_sectioning: true,
        smart_hierarchy: true,
        content_suggestion: true,
        outline_optimization: true
      },
      mock: true,
      timestamp: Date.now()
    }))
  }

  /**
   * 生成大纲生成响应Mock数据
   */
  private generateOutlineResponse(requestData: OutlineGenerationRequest) {
    const taskId = `outline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // 创建任务记录
    const task = this.taskTracker.createTask(taskId, {
      title: requestData.title || requestData.topic || '未命名大纲',
      length: requestData.length || 'detailed',
      structure_type: requestData.structure_type || 'hierarchical',
      sections_count: requestData.sections_count || 5,
      target_audience: requestData.target_audience || 'general'
    })

    return {
      task_id: taskId,
      status: task.status,
      created_at: new Date(task.createdAt).toISOString(),
      updated_at: new Date(task.updatedAt).toISOString(),
      estimated_completion_time: this.calculateOutlineTime(
        requestData.length || 'detailed',
        requestData.sections_count || 5
      ),
      mock: true,
      request_info: {
        title: requestData.title,
        topic: requestData.topic,
        length: requestData.length || 'detailed',
        structure_type: requestData.structure_type || 'hierarchical',
        sections_count: requestData.sections_count || 5,
        target_audience: requestData.target_audience,
        keywords: requestData.keywords || []
      }
    }
  }

  /**
   * 获取任务状态Mock数据
   */
  private getOutlineTaskStatusMock(taskId: string) {
    let task = this.taskTracker.getTaskStatus(taskId)

    if (!task) {
      // 如果任务不存在，创建一个模拟任务
      task = this.taskTracker.createTask(taskId, {
        title: '示例大纲',
        length: 'detailed',
        structure_type: 'hierarchical'
      })
    }

    // 基于时间更新任务状态
    const updatedTask = this.taskTracker.updateTaskByTime(taskId, (_elapsed, task) => {
      if (task.status === 'completed') {
        return {
          result: this.generateOutlineResult(task)
        }
      }
      return {}
    })

    if (!updatedTask) {
      throw new Error(`Failed to update task ${taskId}`)
    }

    return {
      task_id: taskId,
      status: updatedTask.status,
      progress: updatedTask.progress,
      result: updatedTask.result,
      error: updatedTask.error,
      created_at: new Date(updatedTask.createdAt).toISOString(),
      updated_at: new Date(updatedTask.updatedAt).toISOString(),
      mock: true
    }
  }

  /**
   * 生成大纲结果Mock数据
   */
  private generateOutlineResult(task: any) {
    const requestData = task.result || {}
    const title = requestData.title || '示例大纲标题'
    const structureType = requestData.structure_type || 'hierarchical'
    const sectionsCount = requestData.sections_count || 5

    const outlineTemplates = {
      hierarchical: this.generateHierarchicalOutline(title, sectionsCount),
      linear: this.generateLinearOutline(title, sectionsCount),
      mindmap: this.generateMindmapOutline(title, sectionsCount),
      spiral: this.generateSpiralOutline(title, sectionsCount),
      'compare-contrast': this.generateCompareContrastOutline(title, sectionsCount)
    }

    const outline =
      outlineTemplates[structureType as keyof typeof outlineTemplates] ||
      outlineTemplates.hierarchical

    return {
      outline,
      word_count_estimate: this.calculateWordCount(sectionsCount, requestData.length || 'detailed'),
      estimated_read_time: Math.ceil(
        this.calculateWordCount(sectionsCount, requestData.length || 'detailed') / 200
      ),
      key_points: this.generateKeyPoints(title, structureType),
      quality_metrics: {
        structure_score: Math.random() * 2 + 7, // 7-9分
        logic_score: Math.random() * 2 + 7,
        completeness_score: Math.random() * 1.5 + 7.5, // 7.5-9分
        readability_score: Math.random() * 1.5 + 7.5
      },
      optimization_suggestions: [
        '建议在第二章增加更多案例分析',
        '可以考虑添加图表来支持第三章的内容',
        '结论部分可以更具体地总结主要发现'
      ]
    }
  }

  /**
   * 生成层级式大纲
   */
  private generateHierarchicalOutline(title: string, sectionsCount: number) {
    return {
      title,
      sections: Array.from({ length: sectionsCount }, (_, i) => ({
        id: `section_${i + 1}`,
        title: this.generateSectionTitle(i + 1),
        level: 1,
        description: this.generateSectionDescription(i + 1),
        sub_sections: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
          id: `sub_${i + 1}_${j + 1}`,
          title: this.generateSubSectionTitle(i + 1, j + 1),
          description: this.generateSubSectionDescription(i + 1, j + 1)
        }))
      }))
    }
  }

  /**
   * 生成线性大纲
   */
  private generateLinearOutline(title: string, sectionsCount: number) {
    return {
      title,
      sections: Array.from({ length: sectionsCount }, (_, i) => ({
        id: `section_${i + 1}`,
        title: `步骤 ${i + 1}: ${this.generateSectionTitle(i + 1)}`,
        level: 1,
        description: this.generateSectionDescription(i + 1)
      }))
    }
  }

  /**
   * 生成思维导图大纲
   */
  private generateMindmapOutline(title: string, sectionsCount: number) {
    return {
      title,
      sections: [
        {
          id: 'center',
          title: '核心主题',
          level: 0,
          description: `关于${title}的核心分析`,
          sub_sections: Array.from({ length: Math.min(sectionsCount, 4) }, (_, i) => ({
            id: `branch_${i + 1}`,
            title: this.generateMindmapBranchTitle(i + 1),
            description: this.generateMindmapBranchDescription(i + 1)
          }))
        }
      ]
    }
  }

  /**
   * 生成螺旋式大纲
   */
  private generateSpiralOutline(title: string, sectionsCount: number) {
    return {
      title,
      sections: Array.from({ length: sectionsCount }, (_, i) => ({
        id: `spiral_${i + 1}`,
        title: `螺旋 ${i + 1}: ${this.generateSectionTitle(i + 1)} (深化)`,
        level: 1,
        description: `在${this.generateSectionTitle(i + 1)}的基础上进行深入分析和扩展`
      }))
    }
  }

  /**
   * 生成对比式大纲
   */
  private generateCompareContrastOutline(title: string, sectionsCount: number) {
    return {
      title,
      sections: [
        {
          id: 'introduction',
          title: '引言：对比背景',
          level: 1,
          description: '介绍对比的对象和框架'
        },
        ...Array.from({ length: Math.floor((sectionsCount - 2) / 2) }, (_, i) => ({
          id: `compare_${i + 1}`,
          title: `对比维度 ${i + 1}`,
          level: 1,
          sub_sections: [
            {
              id: `aspect_a_${i + 1}`,
              title: '对象A的特点',
              description: '详细分析对象A在该维度的表现'
            },
            {
              id: `aspect_b_${i + 1}`,
              title: '对象B的特点',
              description: '详细分析对象B在该维度的表现'
            }
          ]
        })),
        {
          id: 'conclusion',
          title: '结论：综合对比',
          level: 1,
          description: '总结对比结果和发现'
        }
      ]
    }
  }

  /**
   * 生成章节标题
   */
  private generateSectionTitle(index: number): string {
    const titles = [
      '概述与背景',
      '问题分析',
      '方法论探讨',
      '实证研究',
      '结果与讨论',
      '结论与建议',
      '未来展望',
      '参考文献',
      '附录'
    ]
    return titles[index - 1] || `章节 ${index}`
  }

  /**
   * 生成子章节标题
   */
  private generateSubSectionTitle(sectionIndex: number, subIndex: number): string {
    const baseTitles = ['基础概念', '核心要素', '实践应用', '案例分析', '发展趋势']
    return baseTitles[subIndex - 1] || `子章节 ${subIndex}`
  }

  /**
   * 生成思维导图分支标题
   */
  private generateMindmapBranchTitle(index: number): string {
    const branches = ['主要特征', '关键因素', '影响分析', '实践应用', '发展趋势']
    return branches[index - 1] || `分支 ${index}`
  }

  /**
   * 生成章节描述
   */
  private generateSectionDescription(index: number): string {
    return `第${index}章的详细描述，包含核心概念和关键要素的分析。`
  }

  /**
   * 生成子章节描述
   */
  private generateSubSectionDescription(sectionIndex: number, subIndex: number): string {
    return `第${sectionIndex}章第${subIndex}节的详细说明，提供深入的分析和解释。`
  }

  /**
   * 生成思维导图分支描述
   */
  private generateMindmapBranchDescription(index: number): string {
    return `思维导图分支${index}的详细内容，展示相关要素和关系。`
  }

  /**
   * 生成关键点
   */
  private generateKeyPoints(title: string, structureType: string): string[] {
    const basePoints = [
      '清晰的结构层次安排',
      '逻辑递进的内容组织',
      '理论与实践的有机结合',
      '案例分析的深度和广度'
    ]

    const structureSpecificPoints = {
      hierarchical: ['层级分明的章节结构', '从概括到具体的逻辑递进'],
      linear: ['步骤清晰的线性流程', '循序渐进的内容展开'],
      mindmap: ['发散性的思维结构', '多维度的关联分析'],
      spiral: ['逐步深化的螺旋式学习', '反复强化的核心概念'],
      'compare-contrast': ['明确的对比框架', '深入的差异分析']
    }

    return [
      ...basePoints.slice(0, 2),
      ...(structureSpecificPoints[structureType as keyof typeof structureSpecificPoints] || [])
    ]
  }

  /**
   * 计算预估字数
   */
  private calculateWordCount(sectionsCount: number, length: string): number {
    const baseWordsPerSection = {
      brief: 300,
      detailed: 500,
      comprehensive: 800
    }
    return sectionsCount * (baseWordsPerSection[length as keyof typeof baseWordsPerSection] || 500)
  }

  /**
   * 计算大纲生成时间
   */
  private calculateOutlineTime(length: string, sectionsCount: number): number {
    const baseTime = {
      brief: 20,
      detailed: 45,
      comprehensive: 90
    }
    return (baseTime[length as keyof typeof baseTime] || 45) + sectionsCount * 5
  }

  /**
   * 生成错误场景Mock数据
   */
  private generateErrorScenario(
    errorType: 'network' | 'validation' | 'server' | 'timeout' | 'content_error'
  ) {
    const errors = {
      network: {
        success: false,
        message: '网络连接失败，请检查网络设置',
        error_code: 'NETWORK_ERROR',
        retry_after: 30
      },
      validation: {
        success: false,
        message: '输入数据验证失败',
        error_code: 'VALIDATION_ERROR',
        details: {
          fields: ['topic', 'structure_type'],
          reasons: ['主题不能为空', '结构类型不支持']
        }
      },
      server: {
        success: false,
        message: '服务器内部错误，请稍后重试',
        error_code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString()
      },
      timeout: {
        success: false,
        message: '请求超时，请稍后重试',
        error_code: 'TIMEOUT_ERROR',
        timeout_duration: 180000
      },
      content_error: {
        success: false,
        message: '内容生成失败：主题描述过于模糊',
        error_code: 'CONTENT_GENERATION_FAILED',
        details: {
          issue: 'AI无法基于模糊的主题生成有意义的大纲',
          suggestion: '请提供更具体的主题描述和要求'
        }
      }
    }

    return errors[errorType]
  }

  /**
   * Mock实现方法
   * 为大纲生成服务提供Mock数据支持
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    const apiConfig = this.getCurrentConfig()

    if (apiConfig.showDebugInfo) {
      console.log(`[API-${this.serviceName}] 执行Mock实现:`, {
        url: config.url,
        method: config.method,
        data: config.data
      })
    }

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 1200))

    const url = config.url
    const method = config.method

    try {
      // 大纲生成状态API
      if (method === 'GET' && url.includes('/document_generate/outline-agent/status')) {
        return this.generateOutlineToolsStatus()
      }

      // 大纲生成API
      if (method === 'POST' && url.includes('/document_generate/outline-agent/generate')) {
        // 模拟错误场景（5%概率）
        if (Math.random() < 0.05) {
          const errorTypes = ['network', 'validation', 'server', 'timeout', 'content_error']
          const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)] as any
          return this.generateErrorScenario(errorType)
        }
        return this.generateOutlineResponse(config.data)
      }

      // 任务状态API
      if (method === 'GET' && url.includes('/document_generate/outline-agent/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]
        return this.getOutlineTaskStatusMock(taskId)
      }

      // 任务取消API
      if (method === 'DELETE' && url.includes('/document_generate/outline-agent/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]

        // 从任务跟踪器中删除任务
        this.taskTracker.deleteTask(taskId)

        return {
          success: true,
          message: '大纲生成任务已取消',
          task_id: taskId,
          cancelled_at: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 默认Mock响应
      return {
        success: true,
        message: `大纲生成服务Mock响应 - ${method} ${url}`,
        data: {
          mock: true,
          timestamp: Date.now(),
          service_info: {
            name: this.serviceName,
            version: '1.0.0',
            request_info: {
              url,
              method,
              data: config.data
            }
          }
        }
      }
    } catch (error) {
      console.error(`[API-${this.serviceName}] Mock数据获取失败:`, error)

      return {
        success: false,
        message: `Mock数据获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error: error instanceof Error ? error.message : '未知错误',
        error_code: 'MOCK_GENERATION_FAILED',
        mock: true,
        timestamp: Date.now()
      }
    }
  }
}

// 创建单例实例
export const outlineGenerateService = new OutlineGenerateService()

export default outlineGenerateService
