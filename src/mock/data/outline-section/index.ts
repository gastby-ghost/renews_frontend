/**
 * 大纲章节模块Mock数据
 * 匹配 OpenAPI 3.1.0 - outline-sections.json
 */

import type {
  OutlineSectionCreate,
  OutlineSectionCreateResponse,
  OutlineSectionListResponse,
  OutlineSectionDetailResponse,
  OutlineSectionUpdateResponse,
  OutlineSectionDeleteResponse,
  OutlineSectionBatchCreateResponse,
  OutlineSectionReorderResponse
} from '@/services/outlineSectionService'

// Mock数据库
const mockSections: Map<number, any[]> = new Map() // outlineId -> sections[]

// 生成Mock章节数据
function generateMockSection(
  outlineId: number,
  id: number,
  title: string,
  contentDirection: string,
  orderIndex: number
) {
  const now = new Date().toISOString()
  return {
    id,
    outline_id: outlineId,
    title,
    content_direction: contentDirection,
    order_index: orderIndex,
    created_at: now,
    updated_at: now
  }
}

/**
 * Mock API: 创建章节
 */
export function mockCreateSection(
  outlineId: number,
  data: OutlineSectionCreate
): OutlineSectionCreateResponse {
  console.log('[MOCK] Create Section', { outlineId, data })

  const sections = mockSections.get(outlineId) || []
  const newId =
    sections.length > 0 ? Math.max(...sections.map((s) => s.id)) + 1 : outlineId * 100 + 1

  const newSection = generateMockSection(
    outlineId,
    newId,
    data.title,
    data.content_direction || '',
    data.order_index
  )

  sections.push(newSection)
  mockSections.set(outlineId, sections)

  return newSection
}

/**
 * Mock API: 获取大纲的所有章节
 */
export function mockGetSectionsByOutline(outlineId: number): OutlineSectionListResponse {
  console.log('[MOCK] Get Sections By Outline', { outlineId })

  const sections = mockSections.get(outlineId) || []
  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index)

  return {
    items: sortedSections,
    total: sortedSections.length
  }
}

/**
 * Mock API: 获取章节详情
 */
export function mockGetSectionById(sectionId: number): OutlineSectionDetailResponse | null {
  console.log('[MOCK] Get Section By Id', { sectionId })

  for (const sections of mockSections.values()) {
    const section = sections.find((s) => s.id === sectionId)
    if (section) {
      return section
    }
  }

  return null
}

/**
 * Mock API: 更新章节
 */
export function mockUpdateSection(sectionId: number): OutlineSectionUpdateResponse {
  console.log('[MOCK] Update Section', { sectionId })

  for (const [outlineId, sections] of mockSections.entries()) {
    const index = sections.findIndex((s) => s.id === sectionId)
    if (index !== -1) {
      const section = {
        ...sections[index],
        updated_at: new Date().toISOString()
      }
      sections[index] = section
      mockSections.set(outlineId, sections)
      return section
    }
  }

  throw new Error('Section not found')
}

/**
 * Mock API: 删除章节
 */
export function mockDeleteSection(sectionId: number): OutlineSectionDeleteResponse {
  console.log('[MOCK] Delete Section', { sectionId })

  for (const [outlineId, sections] of mockSections.entries()) {
    const index = sections.findIndex((s) => s.id === sectionId)
    if (index !== -1) {
      sections.splice(index, 1)
      mockSections.set(outlineId, sections)
      return {
        id: sectionId,
        success: true
      }
    }
  }

  throw new Error('Section not found')
}

/**
 * Mock API: 批量创建章节
 */
export function mockBatchCreateSections(
  outlineId: number,
  data: { sections: OutlineSectionCreate[] }
): OutlineSectionBatchCreateResponse {
  console.log('[MOCK] Batch Create Sections', { outlineId, data })

  const sections = mockSections.get(outlineId) || []
  const existingMaxId =
    sections.length > 0 ? Math.max(...sections.map((s) => s.id)) : outlineId * 100
  let currentId = existingMaxId

  const createdSections = []
  let created = 0
  let failed = 0

  for (const sectionData of data.sections) {
    try {
      currentId += 1
      const newSection = generateMockSection(
        outlineId,
        currentId,
        sectionData.title,
        sectionData.content_direction || '',
        sectionData.order_index
      )
      sections.push(newSection)
      createdSections.push(newSection)
      created += 1
    } catch {
      failed += 1
    }
  }

  mockSections.set(outlineId, sections)

  return {
    items: createdSections,
    total: data.sections.length,
    created,
    failed
  }
}

/**
 * Mock API: 重新排序章节
 */
export function mockReorderSections(data: {
  section_orders: Array<{ id: number; order_index: number }>
}): OutlineSectionReorderResponse {
  console.log('[MOCK] Reorder Sections', { data })

  const updatedSections: any[] = []
  let found = false

  for (const [outlineId, sections] of mockSections.entries()) {
    let updated = false

    for (const orderData of data.section_orders) {
      const index = sections.findIndex((s) => s.id === orderData.id)
      if (index !== -1) {
        sections[index] = {
          ...sections[index],
          order_index: orderData.order_index,
          updated_at: new Date().toISOString()
        }
        updatedSections.push(sections[index])
        updated = true
        found = true
      }
    }

    if (updated) {
      // 重新排序
      sections.sort((a, b) => a.order_index - b.order_index)
      mockSections.set(outlineId, sections)
    }
  }

  if (!found) {
    throw new Error('No sections found for reordering')
  }

  return {
    items: updatedSections,
    total: updatedSections.length
  }
}
