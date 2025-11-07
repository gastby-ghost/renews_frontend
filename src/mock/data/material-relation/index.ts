/**
 * 素材关系模块Mock数据
 * 匹配 OpenAPI 3.1.0 - material-relations.json
 */

import type {
  MaterialTitleBindResponse,
  MaterialTitleListResponse,
  MaterialUnbindResponse,
  MaterialUpdateResponse,
  MaterialSectionBindResponse,
  MaterialSectionListResponse,
  MaterialSectionUpdateTypeResponse,
  MaterialRelationsResponse,
  MaterialBatchResponse
} from '@/services/materialRelationService'

// Mock数据库
const mockTitleRelations: Map<number, any[]> = new Map() // titleCandidateId -> relations[]
const mockSectionRelations: Map<number, any[]> = new Map() // outlineSectionId -> relations[]

// 生成Mock素材数据
function generateMockMaterial(materialId: number) {
  return {
    id: materialId,
    title: `素材标题 ${materialId}`,
    summary: `这是素材 ${materialId} 的摘要描述，包含了关键信息和要点。`,
    tags: ['技术', 'AI', '分析'],
    score: 0.8 + Math.random() * 0.2
  }
}

// 生成Mock标题关系数据
function generateMockTitleRelation(
  id: number,
  titleCandidateId: number,
  materialId: number,
  score: number
) {
  return {
    id,
    title_candidate_id: titleCandidateId,
    material_id: materialId,
    score,
    material: generateMockMaterial(materialId),
    created_at: someMinutesAgo(30),
    updated_at: someMinutesAgo(10)
  }
}

// 生成Mock章节关系数据
function generateMockSectionRelation(
  id: number,
  outlineSectionId: number,
  materialId: number,
  bindingType: 'primary' | 'reference' | 'supporting' = 'reference'
) {
  return {
    id,
    outline_section_id: outlineSectionId,
    material_id: materialId,
    binding_type: bindingType,
    material: generateMockMaterial(materialId),
    created_at: someMinutesAgo(25),
    updated_at: someMinutesAgo(5)
  }
}

// 辅助函数：获取几分钟前的时间
function someMinutesAgo(minutes: number): string {
  const date = new Date()
  date.setMinutes(date.getMinutes() - minutes)
  return date.toISOString()
}

// 初始化Mock数据
function initializeMockData() {
  // 标题关系数据
  const title1Relations = [
    generateMockTitleRelation(1, 1, 101, 0.85),
    generateMockTitleRelation(2, 1, 102, 0.92),
    generateMockTitleRelation(3, 1, 103, 0.78)
  ]
  mockTitleRelations.set(1, title1Relations)

  const title2Relations = [
    generateMockTitleRelation(4, 2, 104, 0.88),
    generateMockTitleRelation(5, 2, 105, 0.91)
  ]
  mockTitleRelations.set(2, title2Relations)

  // 章节关系数据
  const section1Relations = [
    generateMockSectionRelation(1, 101, 201, 'primary'),
    generateMockSectionRelation(2, 101, 202, 'reference'),
    generateMockSectionRelation(3, 101, 203, 'supporting')
  ]
  mockSectionRelations.set(101, section1Relations)

  const section2Relations = [
    generateMockSectionRelation(4, 102, 204, 'primary'),
    generateMockSectionRelation(5, 102, 205, 'reference')
  ]
  mockSectionRelations.set(102, section2Relations)
}

initializeMockData()

/**
 * Mock API: 绑定素材到标题候选
 */
export function mockBindMaterialToTitle(
  titleCandidateId: number,
  data: { material_id: number; score?: number }
): MaterialTitleBindResponse {
  console.log('[MOCK] Bind Material To Title', { titleCandidateId, data })

  const relations = mockTitleRelations.get(titleCandidateId) || []
  const newId = relations.length > 0 ? Math.max(...relations.map((r) => r.id)) + 1 : 1

  const newRelation = generateMockTitleRelation(
    newId,
    titleCandidateId,
    data.material_id,
    data.score || 0.8
  )

  relations.push(newRelation)
  mockTitleRelations.set(titleCandidateId, relations)

  return newRelation
}

/**
 * Mock API: 获取标题候选关联的素材列表
 */
export function mockGetTitleMaterials(
  titleCandidateId: number,
  skip = 0,
  limit = 100
): MaterialTitleListResponse {
  console.log('[MOCK] Get Title Materials', { titleCandidateId, skip, limit })

  const relations = mockTitleRelations.get(titleCandidateId) || []
  const sortedRelations = [...relations].sort((a, b) => b.score - a.score)
  const paginatedRelations = sortedRelations.slice(skip, skip + limit)

  return {
    items: paginatedRelations,
    total: relations.length
  }
}

/**
 * Mock API: 解除素材与标题候选的绑定
 */
export function mockUnbindMaterialFromTitle(
  titleCandidateId: number,
  materialId: number
): MaterialUnbindResponse {
  console.log('[MOCK] Unbind Material From Title', { titleCandidateId, materialId })

  const relations = mockTitleRelations.get(titleCandidateId) || []
  const index = relations.findIndex((r) => r.material_id === materialId)

  if (index === -1) {
    throw new Error('Relation not found')
  }

  relations.splice(index, 1)
  mockTitleRelations.set(titleCandidateId, relations)

  return {
    success: true,
    message: '素材解绑成功'
  }
}

/**
 * Mock API: 更新素材-标题关联的相关性评分
 */
export function mockUpdateTitleRelevanceScore(
  relationId: number,
  data: { score: number }
): MaterialUpdateResponse {
  console.log('[MOCK] Update Title Relevance Score', { relationId, data })

  for (const [titleCandidateId, relations] of mockTitleRelations.entries()) {
    const index = relations.findIndex((r) => r.id === relationId)
    if (index !== -1) {
      relations[index] = {
        ...relations[index],
        score: data.score,
        updated_at: new Date().toISOString()
      }
      mockTitleRelations.set(titleCandidateId, relations)
      return {
        id: relationId,
        success: true,
        updated_fields: ['score']
      }
    }
  }

  throw new Error('Relation not found')
}

/**
 * Mock API: 绑定素材到大纲章节
 */
export function mockBindMaterialToSection(
  outlineSectionId: number,
  data: { material_id: number; binding_type?: 'primary' | 'reference' | 'supporting' }
): MaterialSectionBindResponse {
  console.log('[MOCK] Bind Material To Section', { outlineSectionId, data })

  const relations = mockSectionRelations.get(outlineSectionId) || []
  const newId = relations.length > 0 ? Math.max(...relations.map((r) => r.id)) + 1 : 1

  const newRelation = generateMockSectionRelation(
    newId,
    outlineSectionId,
    data.material_id,
    data.binding_type || 'reference'
  )

  relations.push(newRelation)
  mockSectionRelations.set(outlineSectionId, relations)

  return newRelation
}

/**
 * Mock API: 获取大纲章节关联的素材列表
 */
export function mockGetSectionMaterials(
  outlineSectionId: number,
  skip = 0,
  limit = 100
): MaterialSectionListResponse {
  console.log('[MOCK] Get Section Materials', { outlineSectionId, skip, limit })

  const relations = mockSectionRelations.get(outlineSectionId) || []
  const sortedRelations = [...relations].sort((a, b) => a.id - b.id)
  const paginatedRelations = sortedRelations.slice(skip, skip + limit)

  return {
    items: paginatedRelations,
    total: relations.length
  }
}

/**
 * Mock API: 解除素材与大纲章节的绑定
 */
export function mockUnbindMaterialFromSection(
  outlineSectionId: number,
  materialId: number
): MaterialUnbindResponse {
  console.log('[MOCK] Unbind Material From Section', { outlineSectionId, materialId })

  const relations = mockSectionRelations.get(outlineSectionId) || []
  const index = relations.findIndex((r) => r.material_id === materialId)

  if (index === -1) {
    throw new Error('Relation not found')
  }

  relations.splice(index, 1)
  mockSectionRelations.set(outlineSectionId, relations)

  return {
    success: true,
    message: '素材解绑成功'
  }
}

/**
 * Mock API: 更新素材-章节关联的绑定类型
 */
export function mockUpdateSectionBindingType(
  relationId: number,
  data: { binding_type: 'primary' | 'reference' | 'supporting' }
): MaterialSectionUpdateTypeResponse {
  console.log('[MOCK] Update Section Binding Type', { relationId, data })

  for (const [outlineSectionId, relations] of mockSectionRelations.entries()) {
    const index = relations.findIndex((r) => r.id === relationId)
    if (index !== -1) {
      const updatedRelation = {
        ...relations[index],
        binding_type: data.binding_type,
        updated_at: new Date().toISOString()
      }
      relations[index] = updatedRelation
      mockSectionRelations.set(outlineSectionId, relations)
      return updatedRelation
    }
  }

  throw new Error('Relation not found')
}

/**
 * Mock API: 获取素材的所有关联关系
 */
export function mockGetMaterialAllRelations(materialId: number): MaterialRelationsResponse {
  console.log('[MOCK] Get Material All Relations', { materialId })

  const titleRelations = []
  const sectionRelations = []

  for (const [titleCandidateId, relations] of mockTitleRelations.entries()) {
    // DEBUG: titleCandidateId is used for iteration but not directly referenced
    console.log('[DEBUG] Processing titleCandidateId:', titleCandidateId)
    const materialRelations = relations.filter((r) => r.material_id === materialId)
    titleRelations.push(...materialRelations)
  }

  for (const [outlineSectionId, relations] of mockSectionRelations.entries()) {
    // DEBUG: outlineSectionId is used for iteration but not directly referenced
    console.log('[DEBUG] Processing outlineSectionId:', outlineSectionId)
    const materialRelations = relations.filter((r) => r.material_id === materialId)
    sectionRelations.push(...materialRelations)
  }

  return {
    title_relations: titleRelations,
    section_relations: sectionRelations,
    total: titleRelations.length + sectionRelations.length
  }
}

/**
 * Mock API: 批量绑定素材到标题候选
 */
export function mockBatchBindMaterialsToTitle(
  titleCandidateId: number,
  data: { material_ids: number[]; scores?: number[] }
): MaterialBatchResponse {
  console.log('[MOCK] Batch Bind Materials To Title', { titleCandidateId, data })

  const relations = mockTitleRelations.get(titleCandidateId) || []
  const existingMaxId = relations.length > 0 ? Math.max(...relations.map((r) => r.id)) : 0
  let currentId = existingMaxId

  const items = []
  let successCount = 0
  let failedCount = 0

  for (let i = 0; i < data.material_ids.length; i++) {
    const materialId = data.material_ids[i]
    const score = data.scores?.[i] || 0.8

    // 检查是否已存在
    if (relations.some((r) => r.material_id === materialId)) {
      items.push({
        material_id: materialId,
        success: false,
        error: '素材已存在'
      })
      failedCount += 1
      continue
    }

    try {
      currentId += 1
      const newRelation = generateMockTitleRelation(currentId, titleCandidateId, materialId, score)
      relations.push(newRelation)
      items.push({
        material_id: materialId,
        success: true
      })
      successCount += 1
    } catch (error) {
      // DEBUG: error parameter is caught but not used for error details
      console.log('[DEBUG] Error caught during material binding:', error)
      items.push({
        material_id: materialId,
        success: false,
        error: '绑定失败'
      })
      failedCount += 1
    }
  }

  mockTitleRelations.set(titleCandidateId, relations)

  return {
    success_count: successCount,
    failed_count: failedCount,
    total: data.material_ids.length,
    items
  }
}

/**
 * Mock API: 批量绑定素材到大纲章节
 */
export function mockBatchBindMaterialsToSection(
  outlineSectionId: number,
  data: { material_ids: number[]; binding_types?: string[] }
): MaterialBatchResponse {
  console.log('[MOCK] Batch Bind Materials To Section', { outlineSectionId, data })

  const relations = mockSectionRelations.get(outlineSectionId) || []
  const existingMaxId = relations.length > 0 ? Math.max(...relations.map((r) => r.id)) : 0
  let currentId = existingMaxId

  const items = []
  let successCount = 0
  let failedCount = 0

  for (let i = 0; i < data.material_ids.length; i++) {
    const materialId = data.material_ids[i]
    const bindingType =
      (data.binding_types?.[i] as 'primary' | 'reference' | 'supporting') || 'reference'

    // 检查是否已存在
    if (relations.some((r) => r.material_id === materialId)) {
      items.push({
        material_id: materialId,
        success: false,
        error: '素材已存在'
      })
      failedCount += 1
      continue
    }

    try {
      currentId += 1
      const newRelation = generateMockSectionRelation(
        currentId,
        outlineSectionId,
        materialId,
        bindingType
      )
      relations.push(newRelation)
      items.push({
        material_id: materialId,
        success: true
      })
      successCount += 1
    } catch {
      items.push({
        material_id: materialId,
        success: false,
        error: '绑定失败'
      })
      failedCount += 1
    }
  }

  mockSectionRelations.set(outlineSectionId, relations)

  return {
    success_count: successCount,
    failed_count: failedCount,
    total: data.material_ids.length,
    items
  }
}

/**
 * Mock API: 批量解除素材与标题候选的绑定
 */
export function mockBatchUnbindMaterialsFromTitle(
  titleCandidateId: number,
  data: { material_ids: number[] }
): MaterialBatchResponse {
  console.log('[MOCK] Batch Unbind Materials From Title', { titleCandidateId, data })

  const relations = mockTitleRelations.get(titleCandidateId) || []

  const items = []
  let successCount = 0
  let failedCount = 0

  for (const materialId of data.material_ids) {
    const index = relations.findIndex((r) => r.material_id === materialId)

    if (index === -1) {
      items.push({
        material_id: materialId,
        success: false,
        error: '关系不存在'
      })
      failedCount += 1
      continue
    }

    try {
      relations.splice(index, 1)
      items.push({
        material_id: materialId,
        success: true
      })
      successCount += 1
    } catch (error) {
      // DEBUG: error parameter is caught but not used for error details
      console.log('[DEBUG] Error caught during material unbinding:', error)
      items.push({
        material_id: materialId,
        success: false,
        error: '解绑失败'
      })
      failedCount += 1
    }
  }

  mockTitleRelations.set(titleCandidateId, relations)

  return {
    success_count: successCount,
    failed_count: failedCount,
    total: data.material_ids.length,
    items
  }
}

/**
 * Mock API: 批量解除素材与大纲章节的绑定
 */
export function mockBatchUnbindMaterialsFromSection(
  outlineSectionId: number,
  data: { material_ids: number[] }
): MaterialBatchResponse {
  console.log('[MOCK] Batch Unbind Materials From Section', { outlineSectionId, data })

  const relations = mockSectionRelations.get(outlineSectionId) || []

  const items = []
  let successCount = 0
  let failedCount = 0

  for (const materialId of data.material_ids) {
    const index = relations.findIndex((r) => r.material_id === materialId)

    if (index === -1) {
      items.push({
        material_id: materialId,
        success: false,
        error: '关系不存在'
      })
      failedCount += 1
      continue
    }

    try {
      relations.splice(index, 1)
      items.push({
        material_id: materialId,
        success: true
      })
      successCount += 1
    } catch (error) {
      // DEBUG: error parameter is caught but not used for error details
      console.log('[DEBUG] Error caught during section material unbinding:', error)
      items.push({
        material_id: materialId,
        success: false,
        error: '解绑失败'
      })
      failedCount += 1
    }
  }

  mockSectionRelations.set(outlineSectionId, relations)

  return {
    success_count: successCount,
    failed_count: failedCount,
    total: data.material_ids.length,
    items
  }
}
