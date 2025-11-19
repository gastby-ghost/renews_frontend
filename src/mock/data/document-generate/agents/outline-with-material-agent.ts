/**
 * 大纲与素材集成代理 Mock 数据
 * 直接引用真实 API 响应数据文件
 */
import responseJson from '../../../json/document-generate-title.json'
import outlineWithMaterialJson from '../../../json/outline-with-material.json'
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
  data?: any
  error?: string
  created_at: string
  updated_at: string
  progress?: number
  estimated_completion_time?: number
  mock?: boolean
  request_info?: any
}

/**
 * 生成大纲与素材集成任务响应Mock数据
 */
export function generateOutlineWithMaterialResponse(
  requestData: OutlineWithMaterialRequest
): OutlineWithMaterialResponse {
  const taskId = `agent_${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  const timestamp = new Date().toISOString()

  return {
    task_id: taskId,
    status: 'pending',
    created_at: timestamp,
    updated_at: timestamp,
    estimated_completion_time: calculateEstimatedTime(requestData),
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
 * 生成任务状态Mock数据
 */
export function generateTaskStatusMock(
  taskId: string,
  progress: number = 0
): OutlineWithMaterialResponse {
  const status = progress === 100 ? 'completed' : progress === 0 ? 'pending' : 'processing'
  const timestamp = new Date().toISOString()

  const response: OutlineWithMaterialResponse = {
    task_id: taskId,
    status,
    created_at: timestamp,
    updated_at: timestamp,
    mock: true
  }

  if (progress > 0) {
    response.progress = progress
  }

  if (status === 'completed') {
    response.data = getRealResponseData()
  }

  if (Math.random() < 0.05) {
    // 5% 错误概率
    response.status = 'failed'
    response.error = generateRandomError()
  }

  return response
}

/**
 * 获取真实的API响应数据
 * 使用 outline-with-material.json 作为数据源
 */
function getRealResponseData() {
  // 优先使用 outline-with-material.json 中的完整数据
  if (outlineWithMaterialJson && outlineWithMaterialJson.data) {
    return outlineWithMaterialJson.data
  }
  // 回退到原来的响应数据
  return (responseJson as any).data
}

/**
 * 计算预估完成时间
 */
function calculateEstimatedTime(requestData: OutlineWithMaterialRequest): number {
  const baseTime = {
    brief: 30,
    detailed: 60,
    comprehensive: 120
  }
  const outlineLength = requestData.outline_config?.length || 'detailed'
  const materialCount = requestData.material_config?.material_ids?.length || 0

  return (baseTime[outlineLength as keyof typeof baseTime] || 60) + materialCount * 10
}

/**
 * 生成随机错误信息
 */
function generateRandomError(): string {
  const errors = [
    '网络连接超时，请检查网络设置',
    '请求参数验证失败：标题不能为空',
    '素材相关性分析失败，请重新选择素材',
    'AI服务暂时不可用，请稍后重试',
    '生成内容超出限制，请调整参数后重试'
  ]
  return errors[Math.floor(Math.random() * errors.length)]
}

/**
 * 生成服务状态Mock数据
 */
export function generateServiceStatus() {
  return {
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
  }
}
