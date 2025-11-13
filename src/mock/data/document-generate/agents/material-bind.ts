/**
 * Material Bind Mock 数据
 * 提供素材绑定相关的模拟响应数据
 */

/**
 * 执行素材绑定的Mock响应
 */
export const executeMaterialBindMock = () => {
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

/**
 * 获取素材绑定任务状态的Mock响应
 */
export const getMaterialBindStatusMock = (taskId: string) => {
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

/**
 * AI智能绑定素材的Mock响应（兼容性保留）
 */
export const bindMaterialsWithAIMock = (requestData: any) => {
  const { outline, materials } = requestData || {}
  const bindings: any[] = []

  if (outline && materials) {
    outline.forEach((section: any, sectionIndex: number) => {
      const sectionBindings: any = {
        section_index: sectionIndex,
        section_title: section.title,
        bound_materials: []
      }

      // AI逻辑：根据章节标题和内容方向匹配素材
      materials.forEach((material: any) => {
        // 简单的相关性评分算法
        let relevanceScore = 0

        // 基于关键词匹配评分
        const sectionText = `${section.title} ${section.content_direction || ''}`.toLowerCase()
        const materialText =
          `${material.title} ${material.summary || ''} ${(material.tags || []).join(' ')}`.toLowerCase()

        // 计算共同关键词
        const sectionKeywords = sectionText.split(/\s+/).filter((w: string) => w.length > 1)
        const materialKeywords = materialText.split(/\s+/).filter((w: string) => w.length > 1)

        const commonKeywords = sectionKeywords.filter((kw: string) => materialKeywords.includes(kw))
        relevanceScore = commonKeywords.length / Math.max(sectionKeywords.length, 1)

        // 基于素材分数加权
        relevanceScore = relevanceScore * 0.7 + (material.score || 0) * 0.3

        // 如果相关性超过阈值，则绑定
        if (relevanceScore > 0.3) {
          sectionBindings.bound_materials.push({
            material_id: material.id,
            material_title: material.title,
            relevance_score: Number(relevanceScore.toFixed(2)),
            reason: `基于关键词"${commonKeywords.slice(0, 3).join('、')}"匹配`
          })
        }
      })

      // 按相关性分数排序，只保留前3个
      sectionBindings.bound_materials.sort(
        (a: any, b: any) => b.relevance_score - a.relevance_score
      )
      sectionBindings.bound_materials = sectionBindings.bound_materials.slice(0, 3)

      bindings.push(sectionBindings)
    })
  }

  const totalBindings = bindings.reduce((sum, b) => sum + b.bound_materials.length, 0)
  const averageRelevance =
    totalBindings > 0
      ? Number(
          (
            bindings.reduce(
              (sum, b) =>
                sum + b.bound_materials.reduce((s: number, m: any) => s + m.relevance_score, 0),
              0
            ) / totalBindings
          ).toFixed(2)
        )
      : 0

  return {
    success: true,
    message: 'AI智能绑定完成',
    data: {
      bindings,
      statistics: {
        total_sections: outline?.length || 0,
        total_bindings: totalBindings,
        average_relevance: averageRelevance
      }
    }
  }
}
