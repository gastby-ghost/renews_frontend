/**
 * 标题版本 Mock 数据
 * 提供标题版本相关的模拟响应数据
 */

/**
 * 创建标题的Mock响应
 */
export const createTitleMock = (url: string, requestData: any) => ({
  success: true,
  message: '标题创建成功',
  data: {
    id: Math.floor(Math.random() * 10000) + 1000,
    project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
    user_id: 1,
    content: requestData?.content || '',
    version: requestData?.version || 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})

/**
 * 获取项目活动标题的Mock响应
 */
export const getActiveTitleMock = (url: string) => ({
  success: true,
  message: '获取活动标题成功',
  data: {
    id: 1,
    project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
    user_id: 1,
    content: '活动标题示例',
    version: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})

/**
 * 获取项目标题历史的Mock响应
 */
export const getTitleHistoryMock = (url: string) => ({
  success: true,
  message: '获取标题历史成功',
  data: [
    {
      id: 1,
      project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
      user_id: 1,
      content: '标题版本1',
      version: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  total_count: 1
})

/**
 * 获取标题详情的Mock响应
 */
export const getTitleDetailMock = (url: string) => ({
  success: true,
  message: '获取标题详情成功',
  data: {
    id: parseInt(url.match(/\/titles\/(\d+)$/)?.[1] || '0'),
    project_id: 1,
    user_id: 1,
    content: '标题示例',
    version: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})

/**
 * 更新标题的Mock响应
 */
export const updateTitleMock = (url: string, requestData: any) => ({
  success: true,
  message: '标题更新成功',
  data: {
    id: parseInt(url.match(/\/titles\/(\d+)$/)?.[1] || '0'),
    project_id: 1,
    user_id: 1,
    content: requestData?.content || '',
    version: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})

/**
 * 激活标题版本的Mock响应
 */
export const activateTitleMock = (url: string) => ({
  success: true,
  message: '标题激活成功',
  data: {
    id: parseInt(url.match(/\/titles\/(\d+)\/activate$/)?.[1] || '0'),
    project_id: 1,
    user_id: 1,
    content: '标题示例',
    version: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})

/**
 * 停用标题版本的Mock响应
 */
export const deactivateTitleMock = (url: string) => ({
  success: true,
  message: '标题停用成功',
  data: {
    id: parseInt(url.match(/\/titles\/(\d+)\/deactivate$/)?.[1] || '0'),
    project_id: 1,
    user_id: 1,
    content: '标题示例',
    version: 1,
    is_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})
