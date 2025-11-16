/**
 * 项目模块 Mock 数据生成函数
 * 基于新的 OpenAPI 3.1.0 规范 (core_openapi/project.json)
 * 不考虑向后兼容，完全遵循新规范
 */

/**
 * 生成项目列表响应数据
 */
export function generateProjectListResponse(): any {
  const projects = [
    {
      id: 1,
      user_id: 1,
      name: '人工智能在医疗方面的应用',
      status: 'TITLE_GENERATION',
      current_component: 'topic-selection',
      folder_id: null,
      last_modified: '2024-11-07T09:00:00Z',
      created_at: '2024-11-01T00:00:00Z',
      updated_at: '2024-11-07T09:00:00Z'
    },
    {
      id: 2,
      user_id: 1,
      name: 'Vue3组件库设计',
      status: 'OUTLINE_GENERATION',
      current_component: 'outline',
      folder_id: 1,
      last_modified: '2024-11-06T15:30:00Z',
      created_at: '2024-11-02T00:00:00Z',
      updated_at: '2024-11-06T15:30:00Z'
    },
    {
      id: 3,
      user_id: 1,
      name: 'TypeScript最佳实践',
      status: 'BODY_GENERATION',
      current_component: 'content',
      folder_id: null,
      last_modified: '2024-11-06T10:15:00Z',
      created_at: '2024-11-03T00:00:00Z',
      updated_at: '2024-11-06T10:15:00Z'
    },
    {
      id: 4,
      user_id: 1,
      name: '前端工程化指南',
      status: 'COMPLETED',
      current_component: 'content',
      folder_id: 2,
      last_modified: '2024-11-05T18:45:00Z',
      created_at: '2024-10-15T00:00:00Z',
      updated_at: '2024-11-05T18:45:00Z'
    },
    {
      id: 5,
      user_id: 1,
      name: '微前端架构探索',
      status: 'TITLE_GENERATION',
      current_component: 'topic-selection',
      folder_id: null,
      last_modified: '2024-11-07T08:20:00Z',
      created_at: '2024-11-07T00:00:00Z',
      updated_at: '2024-11-07T08:20:00Z'
    }
  ]

  return {
    success: true,
    message: '获取项目列表成功',
    projects,
    total_count: projects.length,
    page: 1,
    page_size: 20,
    total_pages: 1
  }
}

/**
 * 生成项目详情响应数据
 */
export function generateProjectDetailResponse(projectId: number): any {
  const project = {
    id: projectId,
    user_id: 1,
    name: `项目 ${projectId}`,
    status: 'TITLE_GENERATION',
    current_component: 'topic-selection',
    folder_id: null,
    last_modified: '2024-11-07T09:00:00Z',
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-11-07T09:00:00Z'
  }

  return {
    success: true,
    message: '获取项目详情成功',
    project
  }
}

/**
 * 生成项目创建响应数据
 */
export function generateProjectCreateResponse(projectName: string): any {
  const project = {
    id: Math.floor(Math.random() * 1000) + 100,
    user_id: 1,
    name: projectName,
    status: 'TITLE_GENERATION',
    current_component: 'topic-selection',
    folder_id: null,
    last_modified: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return {
    success: true,
    message: '创建项目成功',
    project
  }
}

/**
 * 生成项目更新响应数据
 */
export function generateProjectUpdateResponse(projectId: number, updateData: any): any {
  const project = {
    id: projectId,
    user_id: 1,
    name: updateData.name || `项目 ${projectId}`,
    status: updateData.status || 'TITLE_GENERATION',
    current_component: updateData.current_component || 'topic-selection',
    folder_id: updateData.folder_id || null,
    last_modified: new Date().toISOString(),
    created_at: '2024-11-01T00:00:00Z',
    updated_at: new Date().toISOString()
  }

  return {
    success: true,
    message: '更新项目成功',
    project
  }
}

/**
 * 生成项目删除响应数据
 */
export function generateProjectDeleteResponse(projectIds: number[]): any {
  return {
    success: true,
    message: '批量删除项目成功',
    deleted_count: projectIds.length,
    failed_count: 0,
    details: projectIds.map((id) => ({ project_id: id, status: 'success' }))
  }
}

/**
 * 生成项目状态更新响应数据
 */
export function generateProjectStatusUpdateResponse(projectId: number, newStatus: string): any {
  const project = {
    id: projectId,
    user_id: 1,
    name: `项目 ${projectId}`,
    status: newStatus,
    current_component: 'topic-selection',
    folder_id: null,
    last_modified: new Date().toISOString(),
    created_at: '2024-11-01T00:00:00Z',
    updated_at: new Date().toISOString()
  }

  return {
    success: true,
    message: '更新项目状态成功',
    project
  }
}

/**
 * 生成项目组件更新响应数据
 */
export function generateProjectComponentUpdateResponse(
  projectId: number,
  newComponent: string
): any {
  const project = {
    id: projectId,
    user_id: 1,
    name: `项目 ${projectId}`,
    status: 'TITLE_GENERATION',
    current_component: newComponent,
    folder_id: null,
    last_modified: new Date().toISOString(),
    created_at: '2024-11-01T00:00:00Z',
    updated_at: new Date().toISOString()
  }

  return {
    success: true,
    message: '更新项目组件成功',
    project
  }
}

/**
 * 生成项目统计响应数据
 */
export function generateProjectStatisticsResponse(): any {
  return {
    success: true,
    message: '获取项目统计信息成功',
    data: {
      TITLE_GENERATION: 2,
      OUTLINE_GENERATION: 1,
      BODY_GENERATION: 1,
      COMPLETED: 1
    }
  }
}

/**
 * 生成项目复制响应数据
 */
export function generateProjectDuplicateResponse(originalProjectId: number, newName: string): any {
  const project = {
    id: Math.floor(Math.random() * 1000) + 100,
    user_id: 1,
    name: newName || `项目 ${originalProjectId} 副本`,
    status: 'TITLE_GENERATION',
    current_component: 'topic-selection',
    folder_id: null,
    last_modified: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return {
    success: true,
    message: '复制项目成功',
    project
  }
}

/**
 * 生成项目搜索响应数据
 */
export function generateProjectSearchResponse(keywords: string): any {
  const projects = [
    {
      id: 1,
      user_id: 1,
      name: `搜索结果：${keywords}`,
      status: 'TITLE_GENERATION',
      current_component: 'topic-selection',
      folder_id: null,
      last_modified: '2024-11-07T09:00:00Z',
      created_at: '2024-11-01T00:00:00Z',
      updated_at: '2024-11-07T09:00:00Z'
    }
  ]

  return {
    success: true,
    message: '搜索项目成功',
    projects,
    total_count: 1,
    page: 1,
    page_size: 10,
    total_pages: 1
  }
}
