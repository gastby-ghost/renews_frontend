/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Material Bind Mock 数据
 * 提供素材绑定相关的模拟响应数据
 */

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

  // 任务完成 - 返回模拟的绑定结果
  const mockResult = {
    title: 'AI技术在2024年的最新发展',
    material_section_bindings: [
      {
        section_id: 1,
        section_title: 'AI技术概述',
        materials: [
          {
            id: 1001,
            title: 'AI技术发展简史',
            summary: '从1950年代开始的人工智能发展历程',
            score: 0.95,
            published_date: '2024-01-15 10:00:00',
            url: 'https://example.com/ai-history',
            relevance_explanation: '直接提供AI发展历程的核心内容，完美匹配章节需求'
          }
        ],
        binding_type: 'required',
        binding_reason: '该章节需要介绍AI技术的基本概念和发展历程',
        match_scores: [0.95],
        material_usage_justification: '素材1001作为核心素材，为章节提供AI发展历程的完整框架',
        section_level: 1
      }
    ],
    binding_summary: '本次绑定成功为1个章节分配了1个素材，匹配度较高',
    final_report: '成功绑定 1 个章节的素材',
    total_sections: 1,
    total_materials_bound: 1
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
