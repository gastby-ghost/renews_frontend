/**
 * 素材管理Mock数据
 */

import type {
  MaterialResponse,
  MaterialListResponse,
  TagResponse
} from '@/services/materialService'

// 生成Mock素材数据
const generateMockMaterial = (index: number): MaterialResponse => {
  const titles = [
    '设计灵感的来源',
    '创意思维训练方法',
    '色彩搭配技巧',
    '排版设计原则',
    '用户体验设计指南',
    '品牌视觉识别系统',
    '移动端界面设计',
    '网页设计趋势分析',
    '插画创作技巧',
    '摄影构图基础'
  ]

  const summaries = [
    '这是一个关于设计灵感来源的详细分析，包含多个实际案例和实用技巧。',
    '创意思维是设计师必备的能力，本文介绍了几种有效的训练方法。',
    '色彩搭配是设计中的重要环节，本文详细讲解了色彩理论和实际应用。',
    '良好的排版能够提升设计作品的专业度，这里分享了一些排版原则。',
    '用户体验设计是现代设计的核心，本文提供了完整的设计指南。',
    '品牌视觉识别系统是企业形象的重要组成部分，本文介绍了设计要点。',
    '移动端界面设计需要考虑多种因素，本文提供了实用的设计建议。',
    '网页设计趋势不断变化，本文分析了当前的主流设计趋势。',
    '插画创作需要掌握基本技巧，本文介绍了从入门到进阶的创作方法。',
    '摄影构图是拍摄的基础，本文讲解了常用的构图技巧和原则。'
  ]

  const tags = [
    ['设计', '创意', '灵感'],
    ['思维', '训练', '方法'],
    ['色彩', '搭配', '理论'],
    ['排版', '设计', '原则'],
    ['用户体验', '设计', '指南'],
    ['品牌', '视觉', '识别'],
    ['移动端', '界面', '设计'],
    ['网页', '设计', '趋势'],
    ['插画', '创作', '技巧'],
    ['摄影', '构图', '基础']
  ]

  const titleIndex = index % titles.length

  return {
    id: index + 1,
    title: titles[titleIndex],
    summary: summaries[titleIndex],
    url: `https://example.com/material-${index + 1}`,
    score: Math.random() * 5,
    key_excerpts: [
      `关键摘录1 - ${titles[titleIndex]}`,
      `关键摘录2 - ${titles[titleIndex]}`,
      `关键摘录3 - ${titles[titleIndex]}`
    ],
    user_id: 1,
    created_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    tags: tags[titleIndex]
  }
}

// 生成素材列表Mock数据
export const generateMockMaterialList = (
  page: number = 1,
  pageSize: number = 20,
  keywords?: string
): MaterialListResponse => {
  const totalCount = 100 // 总数据量
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalCount)

  let materials = Array.from({ length: totalCount }, (_, index) => generateMockMaterial(index))

  // 如果有关键词过滤
  if (keywords) {
    materials = materials.filter(
      (material) =>
        material.title.includes(keywords) ||
        material.summary.includes(keywords) ||
        material.tags.some((tag) => tag.includes(keywords))
    )
  }

  const paginatedMaterials = materials.slice(startIndex, endIndex)

  return {
    success: true,
    message: '获取成功',
    materials: paginatedMaterials,
    total_count: materials.length,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(materials.length / pageSize)
  }
}

// 生成标签Mock数据
export const generateMockTags = (): TagResponse[] => {
  const tagNames = [
    '设计',
    '创意',
    '灵感',
    '色彩',
    '排版',
    '用户体验',
    '品牌',
    '移动端',
    '网页',
    '插画',
    '摄影',
    '构图',
    '界面',
    '视觉',
    '识别',
    '趋势',
    '技巧',
    '方法',
    '原则',
    '指南',
    '理论',
    '分析',
    '案例',
    '实用'
  ]

  return tagNames.map((name, index) => ({
    id: index + 1,
    name,
    is_system: index < 10, // 前10个为系统标签
    material_count: Math.floor(Math.random() * 50) + 1,
    created_at: new Date(Date.now() - Math.random() * 86400000 * 60).toISOString()
  }))
}

// 创建素材Mock数据
export const mockCreateMaterial = {
  success: true,
  message: '素材创建成功',
  material: generateMockMaterial(101)
}

// 更新素材Mock数据
export const mockUpdateMaterial = {
  success: true,
  message: '素材更新成功',
  material: {
    ...generateMockMaterial(1),
    title: '更新后的标题',
    summary: '更新后的摘要',
    updated_at: new Date().toISOString()
  }
}

// 删除素材Mock数据
export const mockDeleteMaterial = {
  success: true,
  message: '素材删除成功',
  deleted_count: 1,
  failed_count: 0,
  details: []
}

// 批量删除素材Mock数据
export const mockBatchDeleteMaterials = (materialIds: number[]) => {
  const successCount = materialIds.length
  const failCount = 0

  return {
    success: true,
    message: `成功删除 ${successCount} 个素材`,
    deleted_count: successCount,
    failed_count: failCount,
    details: materialIds.map((id) => ({
      id,
      success: true,
      message: '删除成功'
    }))
  }
}

// 创建标签Mock数据
export const mockCreateTag = (name: string): TagResponse => ({
  id: Date.now(),
  name,
  is_system: false,
  material_count: 0,
  created_at: new Date().toISOString()
})
