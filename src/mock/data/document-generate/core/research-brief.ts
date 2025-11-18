/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * 研究简报 Mock 数据
 * 提供研究简报相关的模拟响应数据
 */

/**
 * 创建研究简报的Mock响应
 */
export const createResearchBriefMock = (url: string, requestData: any) => ({
  success: true,
  message: '研究简报创建成功',
  data: {
    id: Math.floor(Math.random() * 10000) + 1000,
    project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
    user_id: 1,
    content: requestData?.content || '',
    metadata: requestData?.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})

/**
 * 获取研究简报列表的Mock响应
 */
export const getProjectBriefsMock = (url: string) => ({
  success: true,
  message: '获取研究简报列表成功',
  data: [
    {
      id: 1,
      project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
      user_id: 1,
      content: '研究简报示例内容',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  total_count: 1
})

/**
 * 获取研究简报详情的Mock响应
 */
export const getBriefDetailMock = (url: string) => ({
  success: true,
  message: '获取研究简报详情成功',
  data: {
    id: parseInt(url.match(/\/briefs\/(\d+)$/)?.[1] || '0'),
    project_id: 1,
    user_id: 1,
    content: '研究简报示例内容',
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})

/**
 * 更新研究简报的Mock响应
 */
export const updateResearchBriefMock = (url: string, requestData: any) => ({
  success: true,
  message: '研究简报更新成功',
  data: {
    id: parseInt(url.match(/\/briefs\/(\d+)$/)?.[1] || '0'),
    project_id: 1,
    user_id: 1,
    content: requestData?.content || '',
    metadata: requestData?.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})

/**
 * 删除研究简报的Mock响应
 */
export const deleteResearchBriefMock = (url: string, requestData?: any) => ({
  success: true,
  message: '研究简报删除成功',
  deleted_count: 1
})
