/**
 * Outline Agent Mock 数据
 * 提供Outline Agent相关的模拟响应数据
 */

/**
 * 生成大纲的Mock响应
 */
export const generateOutlineMock = () => ({
  success: true,
  message: '大纲生成成功',
  data: {
    outline: [
      {
        level: 1,
        title: '导语：AI医疗革命性突破重塑就医体验',
        content_direction: '采用倒金字塔结构，开篇点明AI在医疗领域的革命性影响',
        data_requirements: ['AI诊断准确率对比数据', '手术并发症发生率统计'],
        estimated_word_count: 150,
        priority: 'high',
        sources: ['1', '2']
      },
      {
        level: 1,
        title: 'AI诊断：精准识别微小病灶，癌症筛查准确率达95%',
        content_direction: '详细展开AI在诊断领域的突破，重点介绍深度学习系统识别微小肿瘤的能力',
        data_requirements: ['深度学习系统技术原理简化说明', '不同癌症类型诊断准确率细分'],
        estimated_word_count: 250,
        priority: 'high',
        sources: ['1']
      },
      {
        level: 1,
        title: '机器人手术：并发症降低40%，住院时间缩短30%',
        content_direction: '介绍机器人辅助手术系统的临床应用成效',
        data_requirements: ['机器人手术系统操作原理简化说明', '不同手术类型并发症降低数据'],
        estimated_word_count: 200,
        priority: 'high',
        sources: ['2']
      }
    ],
    total_count: 3,
    total_word_estimate: 600,
    generation_summary: '成功生成包含3个主要章节的大纲'
  }
})

/**
 * 获取大纲生成工具状态的Mock响应
 */
export const getOutlineToolsStatusMock = () => ({
  success: true,
  message: '获取工具状态成功',
  data: {
    status: 'ready',
    tools: [
      {
        name: 'outline-generator',
        status: 'ready',
        last_check: new Date().toISOString()
      },
      {
        name: 'structure-validator',
        status: 'ready',
        last_check: new Date().toISOString()
      }
    ],
    model_version: 'v2.1.0',
    capabilities: ['generate-outline', 'validate-structure', 'optimize-structure']
  }
})

/**
 * 验证大纲生成请求的Mock响应
 */
export const validateOutlineGenerationMock = (request: any) => ({
  success: true,
  message: '请求验证通过',
  data: {
    is_valid: true,
    suggestions: [
      '建议大纲层级不超过3层',
      '建议每个主要章节控制在200-300字',
      '建议包含数据需求说明'
    ],
    warnings: request?.title ? [] : ['缺少标题信息'],
    errors: []
  }
})
