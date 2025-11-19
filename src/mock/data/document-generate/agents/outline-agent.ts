/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Outline Agent Mock 数据
 * 提供Outline Agent相关的模拟响应数据
 * 使用 outline-with-material.json 作为数据源
 */
import outlineWithMaterialData from '../../../json/outline-with-material.json'

/**
 * 生成大纲的Mock响应
 * 使用 outline-with-material.json 中的大纲数据
 */
export const generateOutlineMock = (url: string, requestData: any) => {
  // 从 outline-with-material.json 获取大纲数据
  const outlineData = (outlineWithMaterialData as any).data?.outline || []

  return {
    success: true,
    message: '大纲生成成功',
    data: {
      outline: outlineData.map((section: any, index: number) => ({
        level: section.level || 1,
        title: section.title || `章节 ${index + 1}`,
        content_direction: section.content_direction || '',
        data_requirements: section.data_requirements || [],
        estimated_word_count: section.estimated_word_count || 500,
        priority: section.priority || 'medium',
        sources: section.sources || []
      })),
      total_count: outlineData.length,
      section_count: outlineData.length,
      total_word_estimate: outlineData.reduce(
        (total: number, section: any) => total + (section.estimated_word_count || 500),
        0
      ),
      generation_summary: `成功生成包含${outlineData.length}个主要章节的大纲`
    }
  }
}

/**
 * 获取大纲生成工具状态的Mock响应
 */
export const getOutlineToolsStatusMock = (url: string, requestData?: any) => ({
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
export const validateOutlineGenerationMock = (url: string, requestData: any) => ({
  success: true,
  message: '请求验证通过',
  data: {
    is_valid: true,
    suggestions: [
      '建议大纲层级不超过3层',
      '建议每个主要章节控制在200-300字',
      '建议包含数据需求说明'
    ],
    warnings: requestData?.title ? [] : ['缺少标题信息'],
    errors: []
  }
})
