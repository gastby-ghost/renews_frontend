/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Title Agent Mock 数据
 * 提供Title Agent相关的模拟响应数据
 */

/**
 * 生成标题的Mock响应
 */
export const generateTitlesMock = (url: string, requestData: any) => {
  const titles = [
    {
      title: '人工智能在医疗领域的革命性突破',
      angle: '',
      why_now: '',
      news_values: [],
      verifiability: '',
      sources: [],
      risk_notes: '',
      feasibility: ''
    },
    {
      title: 'AI医疗技术引领健康新时代',
      angle: '',
      why_now: '',
      news_values: [],
      verifiability: '',
      sources: [],
      risk_notes: '',
      feasibility: ''
    }
  ]

  return {
    success: true,
    message: '标题生成成功',
    titles: titles,
    title_count: titles.length,
    generation_summary: '成功生成2个标题候选'
  }
}

/**
 * 获取标题生成工具状态的Mock响应
 */
export const getTitleToolsStatusMock = (url: string, requestData?: any) => ({
  success: true,
  message: '获取工具状态成功',
  data: {
    status: 'ready',
    tools: [
      {
        name: 'title-generator',
        status: 'ready',
        last_check: new Date().toISOString()
      }
    ],
    model_version: 'v2.1.0',
    capabilities: ['generate-titles', 'optimize-titles', 'validate-titles']
  }
})

/**
 * 验证标题生成请求的Mock响应
 */
export const validateTitleGenerationMock = (url: string, requestData: any) => ({
  success: true,
  message: '请求验证通过',
  data: {
    is_valid: true,
    suggestions: requestData?.research_brief
      ? ['建议标题长度控制在15-25字符', '建议包含核心关键词', '建议体现创新性和时效性']
      : [],
    warnings: [],
    errors: []
  }
})
