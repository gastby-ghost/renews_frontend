/**
 * AI大纲与素材集成服务 - 基于OpenAPI配置
 * 专门服务于大纲生成与素材绑定的集成功能
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

// 大纲与素材集成相关类型
interface OutlineWithMaterialRequest {
  title?: string
  topic?: string
  keywords?: string[]
  target_audience?: string
  purpose?: string
  outline_config?: {
    length?: 'brief' | 'detailed' | 'comprehensive'
    structure_type?: 'linear' | 'hierarchical' | 'mindmap'
    sections_count?: number
  }
  material_config?: {
    material_ids?: string[]
    binding_strategy?: 'auto' | 'manual' | 'hybrid'
    relevance_threshold?: number
    max_materials_per_section?: number
    exclude_duplicates?: boolean
  }
  content_preferences?: {
    language?: string
    tone?: 'formal' | 'casual' | 'professional' | 'creative'
    style?: string
  }
}

interface OutlineWithMaterialResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    outline: {
      title: string
      sections: Array<{
        id: string
        title: string
        level: number
        description?: string
        sub_sections?: Array<{
          id: string
          title: string
          description?: string
        }>
        bound_materials?: Array<{
          material_id: string
          title: string
          relevance_score: number
          binding_type: 'reference' | 'example' | 'support' | 'counterpoint'
        }>
      }>
    }
    material_bindings: Array<{
      section_id: string
      section_title: string
      materials: Array<{
        material_id: string
        title: string
        relevance_score: number
        binding_type: string
      }>
    }>
    statistics: {
      total_sections: number
      total_materials_bound: number
      materials_per_section: number
      average_relevance_score: number
    }
  }
  error?: string
  created_at: string
  updated_at: string
}

class OutlineWithMaterialService extends BaseApiService {
  private taskTracker = new MockTaskTracker()
  private dataManager = new MockDataManager()

  constructor() {
    super('outlineWithMaterial')
  }

  // ============= 大纲与素材集成服务 =============

  /**
   * 生成大纲并绑定素材
   * @param request 集成请求参数
   * @param options API请求选项
   * @returns 集成任务响应
   */
  async generateOutlineWithMaterial(
    request: OutlineWithMaterialRequest,
    options?: ApiRequestConfig
  ) {
    return this.post<OutlineWithMaterialResponse>(
      '/outline-with-material/generate',
      request,
      options
    )
  }

  /**
   * 获取集成任务状态
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 任务状态
   */
  async getIntegrationTaskStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get<OutlineWithMaterialResponse>(
      `/outline-with-material/tasks/${taskId}`,
      undefined,
      options
    )
  }

  /**
   * 取消集成任务
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 取消结果
   */
  async cancelIntegrationTask(taskId: string, options?: ApiRequestConfig) {
    return this.delete(`/outline-with-material/tasks/${taskId}`, undefined, options)
  }

  /**
   * 获取集成结果详情
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 结果详情
   */
  async getIntegrationResult(taskId: string, options?: ApiRequestConfig) {
    return this.get<any>(`/outline-with-material/results/${taskId}`, undefined, options)
  }

  /**
   * 更新大纲与素材绑定
   * @param taskId 任务ID
   * @param updateData 更新数据
   * @param options API请求选项
   * @returns 更新结果
   */
  async updateIntegration(
    taskId: string,
    updateData: {
      outline_changes?: any
      material_rebindings?: any
      new_materials?: string[]
    },
    options?: ApiRequestConfig
  ) {
    return this.put(`/outline-with-material/integrations/${taskId}`, updateData, options)
  }

  /**
   * 导出集成结果
   * @param taskId 任务ID
   * @param format 导出格式
   * @param options API请求选项
   * @returns 导出结果
   */
  async exportIntegration(
    taskId: string,
    format: 'json' | 'markdown' | 'pdf' | 'docx',
    options?: ApiRequestConfig
  ) {
    return this.get(`/outline-with-material/export/${taskId}`, { format }, options)
  }

  /**
   * 启动集成任务并轮询完成
   * @param request 集成请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务结果
   */
  async generateOutlineWithMaterialWithPolling(
    request: OutlineWithMaterialRequest,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.generateOutlineWithMaterial(request)
    const taskId = (response as any).task_id

    if (!taskId) {
      throw new Error('大纲与素材集成任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getIntegrationTaskStatus(taskId).then((result) => ({
          status: (result as any).status || TaskStatus.RUNNING,
          data: result,
          isCompleted: (result as any).status === TaskStatus.COMPLETED
        })),
      {
        interval: 3000,
        timeout: 300000,
        maxAttempts: 100,
        ...pollingConfig
      }
    )

    return poller.start(`outline-material-${taskId}`)
  }

  /**
   * 启动集成任务并等待完成
   * @param request 集成请求参数
   * @param pollingConfig 轮询配置
   * @returns 集成结果
   */
  async generateOutlineWithMaterialAndWait(
    request: OutlineWithMaterialRequest,
    pollingConfig?: PollingConfig
  ): Promise<OutlineWithMaterialResponse> {
    const task = await this.generateOutlineWithMaterialWithPolling(request, pollingConfig)
    const result = await task.promise

    if (result.status !== TaskStatus.COMPLETED) {
      throw new Error(`大纲与素材集成任务失败: ${result.error}`)
    }

    return result.data as OutlineWithMaterialResponse
  }

  /**
   * 快速集成：基于主题和素材ID列表
   * @param topic 主题
   * @param materialIds 素材ID列表
   * @param options 集成选项
   * @param pollingConfig 轮询配置
   * @returns 集成结果
   */
  async quickIntegration(
    topic: string,
    materialIds: string[],
    options?: {
      outline_length?: 'brief' | 'detailed' | 'comprehensive'
      sections_count?: number
      binding_strategy?: 'auto' | 'manual' | 'hybrid'
      language?: string
    },
    pollingConfig?: PollingConfig
  ): Promise<OutlineWithMaterialResponse> {
    const request: OutlineWithMaterialRequest = {
      topic,
      material_config: {
        material_ids: materialIds,
        binding_strategy: options?.binding_strategy || 'auto',
        relevance_threshold: 0.7,
        max_materials_per_section: 3,
        exclude_duplicates: true
      },
      outline_config: {
        length: options?.outline_length || 'detailed',
        sections_count: options?.sections_count || 5,
        structure_type: 'hierarchical'
      },
      content_preferences: {
        language: options?.language || 'zh-CN',
        tone: 'professional'
      }
    }

    return this.generateOutlineWithMaterialAndWait(request, pollingConfig)
  }

  /**
   * 生成集成服务状态Mock数据
   */
  private generateIntegrationStatus() {
    return this.dataManager.getMockData('outline-material-status', () => ({
      service_status: 'available',
      active_tasks: Math.floor(Math.random() * 3) + 1,
      max_concurrent_tasks: 3,
      average_processing_time: Math.floor(Math.random() * 30) + 45,
      supported_languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR'],
      supported_structure_types: ['linear', 'hierarchical', 'mindmap'],
      supported_binding_strategies: ['auto', 'manual', 'hybrid'],
      performance_metrics: {
        success_rate: Math.random() * 0.1 + 0.9, // 90-100%
        average_quality_score: Math.random() * 0.3 + 0.7, // 70-100%
        daily_integrations: Math.floor(Math.random() * 80) + 20,
        average_materials_per_outline: Math.floor(Math.random() * 5) + 3
      },
      integration_features: {
        smart_binding: true,
        relevance_scoring: true,
        duplicate_detection: true,
        quality_analysis: true
      },
      mock: true,
      timestamp: Date.now()
    }))
  }

  /**
   * 生成大纲与素材集成响应Mock数据
   */
  private generateIntegrationResponse(requestData: OutlineWithMaterialRequest) {
    const taskId = `integration_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // 创建任务记录
    const task = this.taskTracker.createTask(taskId, {
      title: requestData.title || requestData.topic || '未命名集成',
      material_count: requestData.material_config?.material_ids?.length || 0,
      outline_length: requestData.outline_config?.length || 'detailed',
      binding_strategy: requestData.material_config?.binding_strategy || 'auto'
    })

    return {
      task_id: taskId,
      status: task.status,
      created_at: new Date(task.createdAt).toISOString(),
      updated_at: new Date(task.updatedAt).toISOString(),
      estimated_completion_time: this.calculateIntegrationTime(
        requestData.outline_config?.length || 'detailed',
        requestData.material_config?.material_ids?.length || 0
      ),
      mock: true,
      request_info: {
        title: requestData.title,
        topic: requestData.topic,
        outline_config: requestData.outline_config,
        material_config: requestData.material_config,
        content_preferences: requestData.content_preferences
      }
    }
  }

  /**
   * 获取集成任务状态Mock数据
   */
  private getIntegrationTaskStatusMock(taskId: string) {
    let task = this.taskTracker.getTaskStatus(taskId)

    if (!task) {
      // 如果任务不存在，创建一个模拟任务
      task = this.taskTracker.createTask(taskId, {
        title: '示例集成任务',
        material_count: 3,
        outline_length: 'detailed'
      })
    }

    // 基于时间更新任务状态
    const updatedTask = this.taskTracker.updateTaskByTime(taskId, (_elapsed, task) => {
      if (task.status === 'completed') {
        return {
          result: this.generateIntegrationResult(task)
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
   * 生成集成结果Mock数据
   */
  private generateIntegrationResult(task: any) {
    const requestData = task.result || {}
    const title = requestData.title || '示例大纲与素材集成'
    const materialCount = requestData.material_count || 3
    const outlineLength = requestData.outline_length || 'detailed'
    const sectionsCount = this.calculateSectionsCount(outlineLength)

    const outline = this.generateIntegratedOutline(title, sectionsCount, materialCount)
    const materialBindings = this.generateMaterialBindings(outline.sections)
    const statistics = this.calculateIntegrationStatistics(outline, materialBindings)

    return {
      outline,
      material_bindings: materialBindings,
      statistics,
      quality_metrics: {
        structure_score: Math.random() * 2 + 7, // 7-9分
        relevance_score: Math.random() * 2 + 7,
        completeness_score: Math.random() * 1.5 + 7.5, // 7.5-9分
        binding_quality_score: Math.random() * 1.5 + 7.5
      },
      optimization_suggestions: this.generateOptimizationSuggestions(statistics),
      export_info: {
        available_formats: ['json', 'markdown', 'pdf', 'docx'],
        estimated_file_sizes: {
          json: 2048,
          markdown: 4096,
          pdf: 1024,
          docx: 1536
        }
      }
    }
  }

  /**
   * 生成集成大纲（包含素材绑定）
   */
  private generateIntegratedOutline(title: string, sectionsCount: number, materialCount: number) {
    const structureTypes = ['hierarchical', 'linear', 'mindmap']
    const structureType = structureTypes[Math.floor(Math.random() * structureTypes.length)]

    const baseSections = Array.from({ length: sectionsCount }, (_, i) => ({
      id: `section_${i + 1}`,
      title: this.generateSectionTitle(i + 1),
      level: 1,
      description: this.generateSectionDescription(i + 1),
      sub_sections: Array.from({ length: Math.floor(Math.random() * 2) + 1 }, (_, j) => ({
        id: `sub_${i + 1}_${j + 1}`,
        title: this.generateSubSectionTitle(i + 1, j + 1),
        description: this.generateSubSectionDescription(i + 1, j + 1)
      })),
      bound_materials: this.generateBoundMaterials(i + 1, materialCount)
    }))

    return {
      title,
      structure_type: structureType,
      sections: baseSections
    }
  }

  /**
   * 生成章节绑定的素材
   */
  private generateBoundMaterials(sectionIndex: number, totalMaterials: number) {
    const materialsPerSection = Math.ceil(totalMaterials / 5) // 假设5个章节
    const bindingTypes = ['reference', 'example', 'support', 'counterpoint']

    return Array.from({ length: Math.min(materialsPerSection, 3) }, (_, i) => ({
      material_id: `mat_${sectionIndex}_${i + 1}`,
      title: this.generateMaterialTitle(sectionIndex, i + 1),
      relevance_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
      binding_type: bindingTypes[Math.floor(Math.random() * bindingTypes.length)] as any,
      binding_reason: this.generateBindingReason(sectionIndex)
    }))
  }

  /**
   * 生成素材绑定详情
   */
  private generateMaterialBindings(sections: any[]) {
    return sections.map((section) => ({
      section_id: section.id,
      section_title: section.title,
      materials: section.bound_materials.map((material: any) => ({
        material_id: material.material_id,
        title: material.title,
        relevance_score: material.relevance_score,
        binding_type: material.binding_type,
        binding_reason: material.binding_reason
      }))
    }))
  }

  /**
   * 计算集成统计信息
   */
  private calculateIntegrationStatistics(outline: any, materialBindings: any[]) {
    const totalSections = outline.sections.length
    const totalMaterialsBound = materialBindings.reduce(
      (sum, binding) => sum + binding.materials.length,
      0
    )
    const sectionsWithMaterials = materialBindings.filter(
      (binding) => binding.materials.length > 0
    ).length
    const averageRelevanceScore =
      materialBindings.reduce((sum, binding) => {
        const sectionAvg =
          binding.materials.reduce(
            (materialSum: number, material: any) => materialSum + material.relevance_score,
            0
          ) / binding.materials.length
        return sum + sectionAvg
      }, 0) / sectionsWithMaterials

    return {
      total_sections: totalSections,
      total_materials_bound: totalMaterialsBound,
      sections_with_materials: sectionsWithMaterials,
      materials_per_section: totalMaterialsBound / totalSections,
      average_relevance_score: averageRelevanceScore || 0,
      binding_efficiency: sectionsWithMaterials / totalSections,
      material_coverage: totalMaterialsBound / (totalSections * 2) // 假设每章节理想2个素材
    }
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(statistics: any) {
    const suggestions = []

    if (statistics.binding_efficiency < 0.8) {
      suggestions.push('建议增加更多素材覆盖范围，以提高章节的素材支持度')
    }

    if (statistics.average_relevance_score < 0.8) {
      suggestions.push('部分素材相关性较低，建议调整素材筛选标准')
    }

    if (statistics.material_coverage < 1.0) {
      suggestions.push('建议增加素材数量以更好地支持大纲内容')
    }

    if (statistics.materials_per_section > 3) {
      suggestions.push('部分章节素材过多，建议精简以提高内容聚焦度')
    }

    return suggestions
  }

  /**
   * 生成章节标题
   */
  private generateSectionTitle(index: number): string {
    const titles = [
      '概述与背景',
      '核心概念分析',
      '技术应用探讨',
      '案例研究分析',
      '发展趋势预测',
      '挑战与对策',
      '未来展望',
      '总结与建议'
    ]
    return titles[index - 1] || `章节 ${index}`
  }

  /**
   * 生成子章节标题
   */
  private generateSubSectionTitle(_sectionIndex: number, subIndex: number): string {
    const baseTitles = ['基本概念', '核心特征', '实际应用', '发展历程', '影响因素']
    return baseTitles[subIndex - 1] || `子章节 ${subIndex}`
  }

  /**
   * 生成素材标题
   */
  private generateMaterialTitle(sectionIndex: number, materialIndex: number): string {
    const topics = ['人工智能', '技术创新', '应用案例', '发展趋势', '行业分析']
    const topic = topics[sectionIndex - 1] || '通用主题'
    return `${topic}相关素材 ${materialIndex}`
  }

  /**
   * 生成绑定原因
   */
  private generateBindingReason(sectionIndex: number): string {
    const reasons = [
      '与章节主题高度相关，提供理论基础',
      '包含实际案例，支持章节论述',
      '提供数据支撑，增强内容可信度',
      '补充技术细节，丰富章节内容',
      '提供对比分析，深化理解'
    ]
    return reasons[sectionIndex - 1] || '与章节内容相关'
  }

  /**
   * 生成章节描述
   */
  private generateSectionDescription(index: number): string {
    return `第${index}章的详细描述，包含核心概念、关键要素和相关分析。`
  }

  /**
   * 生成子章节描述
   */
  private generateSubSectionDescription(sectionIndex: number, subIndex: number): string {
    return `第${sectionIndex}章第${subIndex}节的详细说明，提供深入的分析和解释。`
  }

  /**
   * 计算章节数量
   */
  private calculateSectionsCount(length: string): number {
    const sectionsMap = {
      brief: 3,
      detailed: 5,
      comprehensive: 8
    }
    return sectionsMap[length as keyof typeof sectionsMap] || 5
  }

  /**
   * 计算集成时间
   */
  private calculateIntegrationTime(outlineLength: string, materialCount: number): number {
    const baseTime = {
      brief: 30,
      detailed: 60,
      comprehensive: 120
    }
    return (baseTime[outlineLength as keyof typeof baseTime] || 60) + materialCount * 10
  }

  /**
   * 生成错误场景Mock数据
   */
  private generateErrorScenario(
    errorType: 'network' | 'validation' | 'server' | 'timeout' | 'binding_error'
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
          fields: ['topic', 'material_ids'],
          reasons: ['主题不能为空', '素材ID列表格式错误']
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
        timeout_duration: 300000
      },
      binding_error: {
        success: false,
        message: '素材绑定失败：素材与大纲主题匹配度过低',
        error_code: 'MATERIAL_BINDING_FAILED',
        details: {
          issue: '提供的素材与大纲主题相关性不足',
          suggestion: '请提供更相关的素材或调整大纲主题'
        }
      }
    }

    return errors[errorType]
  }

  /**
   * Mock实现方法
   * 为大纲与素材集成服务提供Mock数据支持
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
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 2000))

    const url = config.url
    const method = config.method

    try {
      // 集成服务状态API
      if (method === 'GET' && url.includes('/outline-with-material/status')) {
        return this.generateIntegrationStatus()
      }

      // 集成生成API
      if (method === 'POST' && url.includes('/outline-with-material/generate')) {
        // 模拟错误场景（5%概率）
        if (Math.random() < 0.05) {
          const errorTypes = ['network', 'validation', 'server', 'timeout', 'binding_error']
          const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)] as any
          return this.generateErrorScenario(errorType)
        }
        return this.generateIntegrationResponse(config.data)
      }

      // 任务状态API
      if (method === 'GET' && url.includes('/outline-with-material/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]
        return this.getIntegrationTaskStatusMock(taskId)
      }

      // 集成结果详情API
      if (method === 'GET' && url.includes('/outline-with-material/results/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]

        // 获取任务结果
        const task = this.taskTracker.getTaskStatus(taskId)
        if (task && task.status === 'completed' && task.result) {
          return {
            task_id: taskId,
            result: task.result,
            export_info: task.result.export_info,
            quality_metrics: task.result.quality_metrics,
            mock: true,
            timestamp: Date.now()
          }
        }

        // 默认结果响应
        return {
          task_id: taskId,
          result: this.generateIntegrationResult({
            title: '示例集成',
            material_count: 3,
            outline_length: 'detailed'
          }),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 更新集成API
      if (method === 'PUT' && url.includes('/outline-with-material/integrations/')) {
        const parts = url.split('/')
        const integrationId = parts[parts.length - 1]

        return {
          success: true,
          message: '集成内容已更新',
          integration_id: integrationId,
          updated_fields: Object.keys(config.data || {}),
          updated_at: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 导出集成结果API
      if (method === 'GET' && url.includes('/outline-with-material/export/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]
        const format = config.params?.format || 'json'

        const fileSizes = {
          json: 2048,
          markdown: 4096,
          pdf: 1024,
          docx: 1536
        }

        return {
          task_id: taskId,
          export_format: format,
          download_url: `/api/v1/downloads/outline-material-${taskId}.${format}`,
          file_size: fileSizes[format as keyof typeof fileSizes] || 2048,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          export_status: 'ready',
          mock: true,
          timestamp: Date.now()
        }
      }

      // 任务取消API
      if (method === 'DELETE' && url.includes('/outline-with-material/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]

        // 从任务跟踪器中删除任务
        this.taskTracker.deleteTask(taskId)

        return {
          success: true,
          message: '大纲与素材集成任务已取消',
          task_id: taskId,
          cancelled_at: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 默认Mock响应
      return {
        success: true,
        message: `大纲与素材集成服务Mock响应 - ${method} ${url}`,
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
export const outlineWithMaterialService = new OutlineWithMaterialService()

export default outlineWithMaterialService
