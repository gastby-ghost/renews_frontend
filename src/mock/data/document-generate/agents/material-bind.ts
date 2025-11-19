/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Material Bind Mock 数据
 * 提供素材绑定相关的模拟响应数据
 * 使用 outline-with-material.json 作为数据源
 */
import outlineWithMaterialData from '../../../json/outline-with-material.json'

/**
 * 执行素材绑定的Mock响应
 */
export const bindMaterialsWithAIMock = (url: string, requestData: any) => {
  const taskId = `material_bind_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 模拟异步任务创建
  setTimeout(() => {
    console.log('[MOCK] 模拟素材绑定任务处理完成:', taskId)
  }, 3000)

  return {
    success: true,
    message: '素材绑定任务已创建',
    task_id: taskId
  }
}

// 别名导出，保持向后兼容
export const executeMaterialBindMock = bindMaterialsWithAIMock

/**
 * 获取素材绑定任务状态的Mock响应
 * 使用 outline-with-material.json 中的绑定数据
 */
export const getMaterialBindStatusMock = (url: string) => {
  // 从URL中提取taskId：/material-bind/status/{taskId}
  const taskId =
    url.split('/').pop() || `material_bind_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  // 模拟进度变化
  const elapsed = Date.now() - parseInt(taskId.split('_')[2] || '0')
  const progress = Math.min(100, Math.floor(elapsed / 30))

  if (progress < 100) {
    // 任务进行中
    return {
      success: true,
      task_id: taskId,
      status: 'running',
      progress,
      result: null,
      error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // 任务完成 - 使用 outline-with-material.json 中的绑定结果
  const bindingData = (outlineWithMaterialData as any).data?.material_bindings || []
  const title = (outlineWithMaterialData as any).data?.title || 'AI医疗革命性突破'

  const mockResult = {
    title: title,
    material_section_bindings: bindingData.map((binding: any) => ({
      section_id: binding.section_id,
      section_title: binding.section_title,
      materials: binding.materials.map((material: any) => ({
        id: material.id,
        title: material.title,
        summary: material.summary,
        score: material.score,
        published_date: material.published_date,
        url: material.url,
        relevance_explanation: material.relevance_explanation
      })),
      binding_type: binding.binding_type || 'required',
      binding_reason: binding.binding_reason || 'AI智能绑定',
      match_scores: binding.match_scores || [],
      material_usage_justification: binding.material_usage_justification || 'AI推荐绑定',
      section_level: binding.section_level || 1
    })),
    binding_summary: `本次绑定成功为${bindingData.length}个章节分配了素材`,
    final_report: `成功绑定 ${bindingData.length} 个章节的素材`,
    total_sections: bindingData.length,
    total_materials_bound: bindingData.reduce(
      (total: number, binding: any) => total + (binding.materials?.length || 0),
      0
    )
  }

  return {
    success: true,
    task_id: taskId,
    status: 'completed',
    progress: 100,
    result: mockResult,
    error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}
