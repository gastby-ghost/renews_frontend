/**
 * 标题候选 Mock 数据
 * 提供标题候选相关的模拟响应数据
 */

/**
 * 创建标题候选的Mock响应
 */
export const createTitleCandidateMock = (url: string, requestData: any) => ({
  success: true,
  message: '标题候选创建成功',
  data: {
    id: Math.floor(Math.random() * 10000) + 1000,
    project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
    user_id: 1,
    content: requestData?.content || '',
    status: 'generated',
    metadata: requestData?.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})

/**
 * 批量创建标题候选的Mock响应
 */
export const bulkCreateTitleCandidatesMock = (url: string, requestData: any) => {
  const projectId = parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0')
  const candidates = requestData?.candidates || []
  return {
    success: true,
    message: '批量创建标题候选成功',
    data: candidates.map((candidate: any, index: number) => ({
      id: Math.floor(Math.random() * 10000) + 1000 + index,
      project_id: projectId,
      user_id: 1,
      content: candidate.content || '',
      status: 'generated',
      metadata: candidate.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })),
    total_count: candidates.length
  }
}

/**
 * 获取项目标题候选列表的Mock响应
 */
export const getProjectTitleCandidatesMock = (url: string) => ({
  success: true,
  message: '获取标题候选列表成功',
  data: [
    {
      id: 1,
      project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
      user_id: 1,
      content: '标题候选示例',
      status: 'generated',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  total_count: 1
})

/**
 * 获取标题候选详情的Mock响应
 */
export const getTitleCandidateDetailMock = (url: string) => ({
  success: true,
  message: '获取标题候选详情成功',
  data: {
    id: parseInt(url.match(/\/title-candidates\/(\d+)$/)?.[1] || '0'),
    project_id: 1,
    user_id: 1,
    content: '标题候选示例',
    status: 'generated',
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})

/**
 * 更新标题候选的Mock响应
 */
export const updateTitleCandidateMock = (url: string, requestData: any) => ({
  success: true,
  message: '标题候选更新成功',
  data: {
    id: parseInt(url.match(/\/title-candidates\/(\d+)$/)?.[1] || '0'),
    project_id: 1,
    user_id: 1,
    content: requestData?.content || '',
    status: 'generated',
    metadata: requestData?.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})

/**
 * 删除标题候选的Mock响应
 */
export const deleteTitleCandidateMock = () => ({
  success: true,
  message: '标题候选删除成功',
  deleted_count: 1
})

/**
 * 选择标题候选的Mock响应
 */
export const selectTitleCandidateMock = (url: string) => ({
  success: true,
  message: '标题候选选择成功',
  data: {
    id: parseInt(url.match(/\/title-candidates\/(\d+)\/select$/)?.[1] || '0'),
    project_id: 1,
    user_id: 1,
    content: '标题候选示例',
    status: 'selected',
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})

/**
 * 拒绝标题候选的Mock响应
 */
export const rejectTitleCandidateMock = (url: string) => ({
  success: true,
  message: '标题候选拒绝成功',
  data: {
    id: parseInt(url.match(/\/title-candidates\/(\d+)\/reject$/)?.[1] || '0'),
    project_id: 1,
    user_id: 1,
    content: '标题候选示例',
    status: 'rejected',
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
})
