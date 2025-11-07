/**
 * 大纲模块Mock数据
 * 匹配 OpenAPI 3.1.0 - outlines.json
 */

import type {
  OutlineCreate,
  OutlineCreateResponse,
  OutlineDetailResponse,
  OutlineWithSectionsResponse,
  OutlineUpdateResponse,
  OutlineActivateResponse,
  OutlineDeactivateResponse,
  OutlineHistoryResponse,
  OutlineHistoryItem
} from '@/services/outlineService'

// Mock数据库
const mockOutlines: Map<number, OutlineDetailResponse> = new Map()
const mockOutlineWithSections: Map<number, OutlineWithSectionsResponse> = new Map()

// 生成Mock大纲数据
function generateMockOutline(
  id: number,
  projectId: number,
  titleCandidateId: number,
  version = 1,
  isActive = false
): OutlineDetailResponse {
  const now = new Date().toISOString()
  return {
    id,
    project_id: projectId,
    title_candidate_id: titleCandidateId,
    version,
    is_active: isActive,
    created_at: now,
    updated_at: now
  }
}

// 生成Mock大纲章节数据
function generateMockOutlineWithSections(
  outlineId: number,
  projectId: number,
  titleCandidateId: number
): OutlineWithSectionsResponse {
  const baseOutline = generateMockOutline(outlineId, projectId, titleCandidateId)
  const sections = [
    {
      id: outlineId * 100 + 1,
      outline_id: outlineId,
      title: '引言',
      content_direction: '介绍研究背景，阐述研究意义和目的',
      order_index: 1,
      created_at: baseOutline.created_at,
      updated_at: baseOutline.updated_at
    },
    {
      id: outlineId * 100 + 2,
      outline_id: outlineId,
      title: '相关技术概述',
      content_direction: '分析相关技术的发展现状和趋势',
      order_index: 2,
      created_at: baseOutline.created_at,
      updated_at: baseOutline.updated_at
    },
    {
      id: outlineId * 100 + 3,
      outline_id: outlineId,
      title: '应用案例分析',
      content_direction: '深入分析典型应用案例，总结成功经验',
      order_index: 3,
      created_at: baseOutline.created_at,
      updated_at: baseOutline.updated_at
    },
    {
      id: outlineId * 100 + 4,
      outline_id: outlineId,
      title: '挑战与机遇',
      content_direction: '识别当前面临的主要挑战和发展机遇',
      order_index: 4,
      created_at: baseOutline.created_at,
      updated_at: baseOutline.updated_at
    },
    {
      id: outlineId * 100 + 5,
      outline_id: outlineId,
      title: '结论与展望',
      content_direction: '总结研究结论，展望未来发展方向',
      order_index: 5,
      created_at: baseOutline.created_at,
      updated_at: baseOutline.updated_at
    }
  ]

  return {
    ...baseOutline,
    sections
  }
}

// 初始化一些Mock数据
function initializeMockData() {
  // 为项目1创建活动大纲
  const activeOutline = generateMockOutlineWithSections(1, 1, 1)
  mockOutlines.set(1, activeOutline)
  mockOutlineWithSections.set(1, activeOutline)

  // 为项目1创建历史大纲
  const historyOutline1 = generateMockOutline(2, 1, 1, 1, false)
  const historyOutline2 = generateMockOutline(3, 1, 1, 2, false)
  mockOutlines.set(2, historyOutline1)
  mockOutlines.set(3, historyOutline2)

  // 为项目2创建活动大纲
  const project2Outline = generateMockOutlineWithSections(4, 2, 2)
  mockOutlines.set(4, project2Outline)
  mockOutlineWithSections.set(4, project2Outline)
}

initializeMockData()

/**
 * Mock API: 创建大纲
 */
export function mockCreateOutline(projectId: number, data: OutlineCreate): OutlineCreateResponse {
  console.log('[MOCK] Create Outline', { projectId, data })

  // 查找活动大纲并停用
  for (const [id, outline] of mockOutlines.entries()) {
    if (outline.project_id === projectId && outline.is_active) {
      outline.is_active = false
      mockOutlines.set(id, { ...outline })
      break
    }
  }

  // 创建新大纲
  const outlineCount = mockOutlines.size
  const newId = outlineCount + 1
  const newVersion = 1

  // 检查是否已存在同版本大纲
  for (const outline of mockOutlines.values()) {
    if (
      outline.project_id === projectId &&
      outline.title_candidate_id === data.title_candidate_id
    ) {
      outline.version += 1
      mockOutlines.set(outline.id, { ...outline })
      break
    }
  }

  const newOutline = generateMockOutline(
    newId,
    projectId,
    data.title_candidate_id,
    newVersion,
    true
  )
  const newOutlineWithSections = generateMockOutlineWithSections(
    newId,
    projectId,
    data.title_candidate_id
  )

  mockOutlines.set(newId, newOutline)
  mockOutlineWithSections.set(newId, newOutlineWithSections)

  return newOutline
}

/**
 * Mock API: 获取项目活动大纲
 */
export function mockGetActiveOutline(projectId: number): OutlineDetailResponse | null {
  console.log('[MOCK] Get Active Outline', { projectId })

  for (const outline of mockOutlines.values()) {
    if (outline.project_id === projectId && outline.is_active) {
      return outline
    }
  }

  return null
}

/**
 * Mock API: 获取大纲版本历史
 */
export function mockGetOutlineHistory(
  projectId: number,
  skip = 0,
  limit = 100
): OutlineHistoryResponse {
  console.log('[MOCK] Get Outline History', { projectId, skip, limit })

  const projectOutlines = Array.from(mockOutlines.values())
    .filter((o) => o.project_id === projectId)
    .sort((a, b) => b.id - a.id)

  const items: OutlineHistoryItem[] = projectOutlines.slice(skip, skip + limit).map((o) => ({
    id: o.id,
    project_id: o.project_id,
    title_candidate_id: o.title_candidate_id,
    version: o.version,
    is_active: o.is_active,
    created_at: o.created_at,
    updated_at: o.updated_at
  }))

  return {
    items,
    total: projectOutlines.length,
    skip,
    limit
  }
}

/**
 * Mock API: 获取大纲及所有章节
 */
export function mockGetOutlineWithSections(outlineId: number): OutlineWithSectionsResponse | null {
  console.log('[MOCK] Get Outline With Sections', { outlineId })

  const outline = mockOutlineWithSections.get(outlineId)
  return outline || null
}

/**
 * Mock API: 更新大纲
 */
export function mockUpdateOutline(outlineId: number): OutlineUpdateResponse {
  console.log('[MOCK] Update Outline', { outlineId })

  const outline = mockOutlines.get(outlineId)
  if (!outline) {
    throw new Error('Outline not found')
  }

  const updatedOutline = {
    ...outline,
    updated_at: new Date().toISOString()
  }

  mockOutlines.set(outlineId, updatedOutline)
  mockOutlineWithSections.set(outlineId, {
    ...updatedOutline,
    sections: mockOutlineWithSections.get(outlineId)?.sections || []
  })

  return updatedOutline
}

/**
 * Mock API: 删除大纲
 */
export function mockDeleteOutline(outlineId: number): OutlineDetailResponse {
  console.log('[MOCK] Delete Outline', { outlineId })

  const outline = mockOutlines.get(outlineId)
  if (!outline) {
    throw new Error('Outline not found')
  }

  if (outline.is_active) {
    throw new Error('Cannot delete active outline')
  }

  mockOutlines.delete(outlineId)
  mockOutlineWithSections.delete(outlineId)

  return outline
}

/**
 * Mock API: 激活大纲
 */
export function mockActivateOutline(outlineId: number, reason?: string): OutlineActivateResponse {
  console.log('[MOCK] Activate Outline', { outlineId, reason })

  const outline = mockOutlines.get(outlineId)
  if (!outline) {
    throw new Error('Outline not found')
  }

  // 停用其他版本
  for (const [id, o] of mockOutlines.entries()) {
    if (
      o.project_id === outline.project_id &&
      o.title_candidate_id === outline.title_candidate_id
    ) {
      o.is_active = false
      mockOutlines.set(id, { ...o })
    }
  }

  // 激活当前版本
  const activatedOutline = {
    ...outline,
    is_active: true,
    updated_at: new Date().toISOString()
  }

  mockOutlines.set(outlineId, activatedOutline)
  mockOutlineWithSections.set(outlineId, {
    ...activatedOutline,
    sections: mockOutlineWithSections.get(outlineId)?.sections || []
  })

  return activatedOutline
}

/**
 * Mock API: 停用大纲
 */
export function mockDeactivateOutline(
  outlineId: number,
  reason?: string
): OutlineDeactivateResponse {
  console.log('[MOCK] Deactivate Outline', { outlineId, reason })

  const outline = mockOutlines.get(outlineId)
  if (!outline) {
    throw new Error('Outline not found')
  }

  const deactivatedOutline = {
    ...outline,
    is_active: false,
    updated_at: new Date().toISOString()
  }

  mockOutlines.set(outlineId, deactivatedOutline)
  mockOutlineWithSections.set(outlineId, {
    ...deactivatedOutline,
    sections: mockOutlineWithSections.get(outlineId)?.sections || []
  })

  return deactivatedOutline
}
