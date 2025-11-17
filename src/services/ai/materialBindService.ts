/**
 * AI素材绑定服务 - 基于OpenAPI配置
 * 专门服务于素材绑定和大纲关联功能
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

// 导入素材绑定相关类型定义
import type {
  MaterialBindRequest,
  MaterialBindResponse,
  MaterialBindStatusResponse
} from '@/types/ai/material-bind'

class MaterialBindService extends BaseApiService {
  private taskTracker = new MockTaskTracker()
  private dataManager = new MockDataManager()

  constructor() {
    super('materialBind')
  }

  // ============= 素材绑定服务 =============

  /**
   * 执行素材绑定
   * @param request 素材绑定请求参数
   * @param options API请求选项
   * @returns 绑定任务响应
   */
  async executeMaterialBinding(request: MaterialBindRequest, options?: ApiRequestConfig) {
    return this.post<MaterialBindResponse>('/material-bind/execute', request, options)
  }

  /**
   * 获取素材绑定状态
   * @param options API请求选项
   * @returns 绑定状态信息
   */
  async getMaterialBindingStatus(options?: ApiRequestConfig) {
    return this.get<MaterialBindStatusResponse>('/material-bind/status', undefined, options)
  }

  /**
   * 获取素材绑定任务状态
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 任务状态
   */
  async getBindingTaskStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get<MaterialBindResponse>(`/material-bind/tasks/${taskId}`, undefined, options)
  }

  /**
   * 取消素材绑定任务
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 取消结果
   */
  async cancelBindingTask(taskId: string, options?: ApiRequestConfig) {
    return this.delete(`/material-bind/tasks/${taskId}`, undefined, options)
  }

  /**
   * 获取大纲的素材绑定详情
   * @param outlineId 大纲ID
   * @param options API请求选项
   * @returns 绑定详情
   */
  async getOutlineBindings(outlineId: string, options?: ApiRequestConfig) {
    return this.get<any>(`/material-bind/outlines/${outlineId}/bindings`, undefined, options)
  }

  /**
   * 更新素材绑定
   * @param bindingId 绑定ID
   * @param updateData 更新数据
   * @param options API请求选项
   * @returns 更新结果
   */
  async updateBinding(
    bindingId: string,
    updateData: {
      relevance_score?: number
      binding_type?: string
      suggested_position?: number
    },
    options?: ApiRequestConfig
  ) {
    return this.put(`/material-bind/bindings/${bindingId}`, updateData, options)
  }

  /**
   * 删除素材绑定
   * @param bindingId 绑定ID
   * @param options API请求选项
   * @returns 删除结果
   */
  async removeBinding(bindingId: string, options?: ApiRequestConfig) {
    return this.delete(`/material-bind/bindings/${bindingId}`, undefined, options)
  }

  /**
   * 启动素材绑定并轮询完成
   * @param request 素材绑定请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务结果
   */
  async executeMaterialBindingWithPolling(
    request: MaterialBindRequest,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.executeMaterialBinding(request)
    const taskId = (response as any).task_id

    if (!taskId) {
      throw new Error('素材绑定任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getBindingTaskStatus(taskId).then((result) => ({
          status: (result as any).status || TaskStatus.RUNNING,
          data: result,
          isCompleted: (result as any).status === TaskStatus.COMPLETED
        })),
      {
        interval: 2000,
        timeout: 120000,
        maxAttempts: 60,
        ...pollingConfig
      }
    )

    return poller.start(`material-bind-${taskId}`)
  }

  /**
   * 启动素材绑定并等待完成
   * @param request 素材绑定请求参数
   * @param pollingConfig 轮询配置
   * @returns 绑定结果
   */
  async executeMaterialBindingAndWait(
    request: MaterialBindRequest,
    pollingConfig?: PollingConfig
  ): Promise<MaterialBindResponse> {
    const task = await this.executeMaterialBindingWithPolling(request, pollingConfig)
    const result = await task.promise

    if (result.status !== TaskStatus.COMPLETED) {
      throw new Error(`素材绑定任务失败: ${result.error}`)
    }

    return result.data as MaterialBindResponse
  }

  /**
   * 智能素材绑定
   * @param outlineId 大纲ID
   * @param materialIds 素材ID列表
   * @param options 绑定选项
   * @param pollingConfig 轮询配置
   * @returns 绑定结果
   */
  async smartMaterialBinding(
    outlineId: string,
    materialIds: string[],
    options?: {
      relevance_threshold?: number
      max_materials_per_section?: number
      exclude_duplicates?: boolean
    },
    pollingConfig?: PollingConfig
  ): Promise<MaterialBindResponse> {
    const request: MaterialBindRequest = {
      outline_id: outlineId,
      material_ids: materialIds,
      binding_strategy: 'auto',
      relevance_threshold: options?.relevance_threshold || 0.7,
      max_materials_per_section: options?.max_materials_per_section || 3,
      exclude_duplicates: options?.exclude_duplicates ?? true
    }

    return this.executeMaterialBindingAndWait(request, pollingConfig)
  }

  /**
   * 生成素材绑定服务状态Mock数据
   */
  private generateMaterialBindingStatus() {
    return this.dataManager.getMockData('material-binding-status', () => ({
      service_status: 'available',
      active_tasks: Math.floor(Math.random() * 3) + 1,
      max_concurrent_tasks: 5,
      average_processing_time: Math.floor(Math.random() * 20) + 30,
      supported_binding_strategies: ['auto', 'manual', 'hybrid'],
      max_materials_per_outline: 150,
      performance_metrics: {
        success_rate: Math.random() * 0.1 + 0.9, // 90-100%
        average_relevance_score: Math.random() * 0.3 + 0.6, // 60-90%
        daily_bindings: Math.floor(Math.random() * 200) + 50
      },
      supported_binding_types: ['reference', 'example', 'support', 'counterpoint'],
      mock: true,
      timestamp: Date.now()
    }))
  }

  /**
   * 生成素材绑定执行响应Mock数据
   */
  private generateMaterialBindResponse(requestData: MaterialBindRequest) {
    const taskId = `bind_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // 创建任务记录
    const task = this.taskTracker.createTask(taskId, {
      outline_id: requestData.outline_id,
      material_count: requestData.material_ids?.length || 0,
      strategy: requestData.binding_strategy || 'auto',
      relevance_threshold: requestData.relevance_threshold || 0.7
    })

    return {
      task_id: taskId,
      status: task.status,
      created_at: new Date(task.createdAt).toISOString(),
      updated_at: new Date(task.updatedAt).toISOString(),
      estimated_completion_time: this.calculateBindingTime(requestData.material_ids?.length || 0),
      mock: true,
      request_info: {
        outline_id: requestData.outline_id,
        material_count: requestData.material_ids?.length || 0,
        strategy: requestData.binding_strategy || 'auto',
        relevance_threshold: requestData.relevance_threshold || 0.7,
        max_materials_per_section: requestData.max_materials_per_section || 3
      }
    }
  }

  /**
   * 获取大纲绑定详情Mock数据
   */
  private getOutlineBindingsMock(outlineId: string) {
    return this.dataManager.getMockData(`outline-bindings-${outlineId}`, () => {
      const materialTemplates = [
        {
          material_id: 'mat_001',
          title: '人工智能技术发展趋势分析',
          relevance_score: 0.92,
          binding_type: 'reference',
          suggested_position: 1,
          content_preview: '本文详细分析了AI技术在各个领域的应用现状...'
        },
        {
          material_id: 'mat_002',
          title: '机器学习算法实践案例',
          relevance_score: 0.85,
          binding_type: 'example',
          suggested_position: 2,
          content_preview: '通过实际案例展示机器学习算法在项目中的具体应用...'
        },
        {
          material_id: 'mat_003',
          title: '深度学习框架对比研究',
          relevance_score: 0.78,
          binding_type: 'support',
          suggested_position: 3,
          content_preview: '对比分析TensorFlow、PyTorch等主流深度学习框架的特点...'
        },
        {
          material_id: 'mat_004',
          title: 'AI伦理与安全问题探讨',
          relevance_score: 0.73,
          binding_type: 'counterpoint',
          suggested_position: 4,
          content_preview: '探讨人工智能发展过程中面临的伦理挑战和安全风险...'
        }
      ]

      return {
        outline_id: outlineId,
        outline_title: '人工智能技术发展研究报告',
        bindings: [
          {
            section_id: 'section_1',
            section_title: '引言',
            materials: materialTemplates.slice(0, 2)
          },
          {
            section_id: 'section_2',
            section_title: '技术概述',
            materials: materialTemplates.slice(1, 3)
          },
          {
            section_id: 'section_3',
            section_title: '应用案例',
            materials: materialTemplates.slice(0, 1)
          }
        ],
        total_materials_bound: materialTemplates.length,
        binding_statistics: {
          high_relevance: materialTemplates.filter((m) => m.relevance_score > 0.8).length,
          medium_relevance: materialTemplates.filter(
            (m) => m.relevance_score > 0.6 && m.relevance_score <= 0.8
          ).length,
          low_relevance: materialTemplates.filter((m) => m.relevance_score <= 0.6).length
        },
        mock: true,
        timestamp: Date.now()
      }
    })
  }

  /**
   * 获取任务状态Mock数据
   */
  private getBindingTaskStatusMock(taskId: string) {
    let task = this.taskTracker.getTaskStatus(taskId)

    if (!task) {
      // 如果任务不存在，创建一个模拟任务
      task = this.taskTracker.createTask(taskId, {
        outline_id: 'outline_demo',
        material_count: 5,
        strategy: 'auto'
      })
    }

    // 基于时间更新任务状态
    const updatedTask = this.taskTracker.updateTaskByTime(taskId, (_elapsed, task) => {
      if (task.status === 'completed') {
        return {
          result: this.generateBindingResult(task)
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
   * 生成绑定结果Mock数据
   */
  private generateBindingResult(task: any) {
    const materialCount = task.result?.material_count || 5

    const bindingTypes = ['reference', 'example', 'support', 'counterpoint']
    const sections = [
      { section_id: 'section_1', section_title: '引言部分' },
      { section_id: 'section_2', section_title: '核心内容' },
      { section_id: 'section_3', section_title: '案例分析' },
      { section_id: 'section_4', section_title: '总结展望' }
    ]

    const bindings = sections.map((section, sectionIndex) => {
      const sectionMaterials = Array.from(
        {
          length: Math.min(
            3,
            Math.floor(materialCount / sections.length) + (sectionIndex === 0 ? 1 : 0)
          )
        },
        (_, i) => {
          const materialIndex = sectionIndex * 3 + i
          return {
            material_id: `mat_${String(materialIndex + 1).padStart(3, '0')}`,
            title: `素材标题 ${materialIndex + 1} - ${section.section_title}`,
            relevance_score: Math.random() * 0.4 + 0.6, // 60-100%
            binding_type: bindingTypes[Math.floor(Math.random() * bindingTypes.length)] as any,
            suggested_position: i + 1,
            binding_reason: `该素材与${section.section_title}高度相关，能够有效支撑章节内容`
          }
        }
      )

      return {
        ...section,
        materials: sectionMaterials
      }
    })

    // 获取所有绑定的素材对象（用于统计）
    const boundMaterialObjects = bindings.flatMap((b) => b.materials)
    const boundMaterials = boundMaterialObjects.map((m) => m.material_id)
    const allMaterials = Array.from(
      { length: materialCount },
      (_, i) => `mat_${String(i + 1).padStart(3, '0')}`
    )
    const unboundMaterials = allMaterials.filter((id) => !boundMaterials.includes(id))

    return {
      bindings,
      total_materials_bound: boundMaterials.length,
      unbound_materials: unboundMaterials,
      binding_summary: {
        high_relevance: boundMaterialObjects.filter((m) => m.relevance_score > 0.8).length,
        medium_relevance: boundMaterialObjects.filter(
          (m) => m.relevance_score > 0.6 && m.relevance_score <= 0.8
        ).length,
        low_relevance: boundMaterialObjects.filter((m) => m.relevance_score <= 0.6).length
      },
      binding_statistics: {
        by_type: bindingTypes.reduce(
          (acc, type) => {
            acc[type] = boundMaterialObjects.filter((m) => m.binding_type === type).length
            return acc
          },
          {} as Record<string, number>
        ),
        by_section: sections.reduce(
          (acc, section) => {
            acc[section.section_id] =
              bindings.find((b) => b.section_id === section.section_id)?.materials.length || 0
            return acc
          },
          {} as Record<string, number>
        )
      },
      quality_metrics: {
        overall_relevance_score:
          boundMaterialObjects.reduce((sum, m) => sum + m.relevance_score, 0) /
          boundMaterialObjects.length,
        coverage_score: Math.min(1, boundMaterials.length / materialCount),
        distribution_score: this.calculateDistributionScore(bindings)
      }
    }
  }

  /**
   * 计算素材分布得分
   */
  private calculateDistributionScore(bindings: any[]): number {
    if (bindings.length === 0) return 0

    const materialCounts = bindings.map((b) => b.materials.length)
    const avgCount = materialCounts.reduce((sum, count) => sum + count, 0) / materialCounts.length
    const variance =
      materialCounts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) /
      materialCounts.length
    const standardDeviation = Math.sqrt(variance)

    // 标准差越小，分布越均匀，得分越高
    return Math.max(0, 1 - standardDeviation / avgCount)
  }

  /**
   * 计算绑定预估时间
   */
  private calculateBindingTime(materialCount: number): number {
    const baseTime = 10 // 基础时间10秒
    const perMaterialTime = 3 // 每个素材3秒
    return baseTime + materialCount * perMaterialTime
  }

  /**
   * 生成错误场景Mock数据
   */
  private generateErrorScenario(
    errorType: 'network' | 'validation' | 'server' | 'timeout' | 'binding_failed'
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
          fields: ['outline_id', 'material_ids'],
          reasons: ['大纲ID不能为空', '素材ID列表不能为空']
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
      binding_failed: {
        success: false,
        message: '素材绑定失败：找不到相关的匹配素材',
        error_code: 'BINDING_FAILED',
        details: {
          attempted_materials: 10,
          successful_matches: 0,
          reason: '素材内容与大纲章节相关性过低'
        }
      }
    }

    return errors[errorType]
  }

  /**
   * Mock实现方法
   * 为素材绑定服务提供Mock数据支持
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
      // 素材绑定状态API
      if (method === 'GET' && url.includes('/material-bind/status')) {
        return this.generateMaterialBindingStatus()
      }

      // 素材绑定执行API
      if (method === 'POST' && url.includes('/material-bind/execute')) {
        // 模拟错误场景（5%概率）
        if (Math.random() < 0.05) {
          const errorTypes = ['network', 'validation', 'server', 'timeout', 'binding_failed']
          const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)] as any
          return this.generateErrorScenario(errorType)
        }
        return this.generateMaterialBindResponse(config.data)
      }

      // 获取大纲绑定详情API
      if (
        method === 'GET' &&
        url.includes('/material-bind/outlines/') &&
        url.includes('/bindings')
      ) {
        const parts = url.split('/')
        const outlineId = parts[4]
        return this.getOutlineBindingsMock(outlineId)
      }

      // 任务状态API
      if (method === 'GET' && url.includes('/material-bind/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]
        return this.getBindingTaskStatusMock(taskId)
      }

      // 更新绑定API
      if (method === 'PUT' && url.includes('/material-bind/bindings/')) {
        const bindingId = url.split('/')[4]

        return {
          success: true,
          message: '素材绑定已更新',
          binding_id: bindingId,
          updated_fields: Object.keys(config.data || {}),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 删除绑定API
      if (method === 'DELETE' && url.includes('/material-bind/bindings/')) {
        const bindingId = url.split('/')[4]

        return {
          success: true,
          message: '素材绑定已删除',
          binding_id: bindingId,
          affected_sections: 1,
          mock: true,
          timestamp: Date.now()
        }
      }

      // 任务取消API
      if (method === 'DELETE' && url.includes('/material-bind/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]

        // 从任务跟踪器中删除任务
        this.taskTracker.deleteTask(taskId)

        return {
          success: true,
          message: '素材绑定任务已取消',
          task_id: taskId,
          cancelled_at: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 默认Mock响应
      return {
        success: true,
        message: `素材绑定服务Mock响应 - ${method} ${url}`,
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
export const materialBindService = new MaterialBindService()

export default materialBindService
