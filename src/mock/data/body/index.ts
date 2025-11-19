/**
 * 正文模块 Mock 数据
 * 匹配 OpenAPI 3.1.0 - bodies.json
 */

import type {
  BodyCreate,
  BodyCreateResponse,
  BodyHistoryResponse,
  BodyActiveResponse,
  BodyDetailResponse,
  BodyUpdateResponse,
  BodyActivateResponse,
  BodyDeactivateResponse,
  TextStatsResponse,
  ReadabilityAnalysisResponse
} from '@/services/bodyService'
import articleData from '@/mock/json/article.json'

// Mock数据库
const mockBodies: Map<number, any[]> = new Map() // projectId -> bodies[]

// 生成Mock正文数据
function generateMockBody(id: number, projectId: number, content: string) {
  return {
    id,
    project_id: projectId,
    title: `正文版本 ${id}`,
    content,
    status: 'active' as const,
    version: id,
    created_at: new Date(Date.now() - id * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    activated_at: new Date().toISOString()
  }
}

// 初始化Mock数据
function initializeMockData() {
  // 项目1的正文
  const project1Bodies = [
    generateMockBody(1, 1, '# 项目概述\n\n这是一个关于AI技术的研究项目...'),
    generateMockBody(2, 1, '# 项目概述\n\n这是更新后的项目内容，包含更多细节...')
  ]
  mockBodies.set(1, project1Bodies)
}

initializeMockData()

/**
 * Mock API: 创建正文
 */
export function mockCreateBody(projectId: number, data: BodyCreate): BodyCreateResponse {
  console.log('[MOCK] Create Body', { projectId, data })

  const bodies = mockBodies.get(projectId) || []
  const newId = bodies.length > 0 ? Math.max(...bodies.map((b) => b.id)) + 1 : 1

  // 如果没有提供内容，使用文章生成的内容
  let content = data.content || ''
  if (!content && import.meta.env.VITE_USE_MOCK === 'true') {
    // 使用导入的文章mock数据
    content = articleData.data?.content || ''
    if (content) {
      console.log('[MOCK] Using article.json content for body creation')
    } else {
      console.warn('[MOCK] No content found in article.json')
      content = `# ${data.title || '默认标题'}\n\n这是生成的正文内容...`
    }
  }

  const newBody = {
    id: newId,
    project_id: projectId,
    title: data.title || `正文版本 ${newId}`,
    content,
    status: data.status || 'active',
    version: newId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    activated_at: new Date().toISOString()
  }

  bodies.push(newBody)
  mockBodies.set(projectId, bodies)

  return newBody
}

/**
 * Mock API: 获取项目的所有正文（分页）
 */
export function mockGetBodies(projectId: number, skip = 0, limit = 100): BodyHistoryResponse {
  console.log('[MOCK] Get Bodies', { projectId, skip, limit })

  const bodies = mockBodies.get(projectId) || []
  const sortedBodies = [...bodies].sort((a, b) => b.id - a.id)
  const paginatedBodies = sortedBodies.slice(skip, skip + limit)

  return {
    items: paginatedBodies,
    total: bodies.length
  }
}

/**
 * Mock API: 获取活动正文
 */
export function mockGetActiveBody(projectId: number): BodyActiveResponse {
  console.log('[MOCK] Get Active Body', { projectId })

  const bodies = mockBodies.get(projectId) || []
  const activeBody = bodies.find((b) => b.status === 'active')

  if (!activeBody) {
    throw new Error('Active body not found')
  }

  return activeBody
}

/**
 * Mock API: 获取正文历史
 */
export function mockGetBodyHistory(projectId: number, skip = 0, limit = 100): BodyHistoryResponse {
  console.log('[MOCK] Get Body History', { projectId, skip, limit })

  const bodies = mockBodies.get(projectId) || []
  const sortedBodies = [...bodies].sort((a, b) => b.id - a.id)
  const paginatedBodies = sortedBodies.slice(skip, skip + limit)

  return {
    items: paginatedBodies,
    total: bodies.length
  }
}

/**
 * Mock API: 获取正文详情
 */
export function mockGetBody(bodyId: number): BodyDetailResponse {
  console.log('[MOCK] Get Body', { bodyId })

  for (const bodies of mockBodies.values()) {
    const body = bodies.find((b) => b.id === bodyId)
    if (body) {
      return body
    }
  }

  throw new Error('Body not found')
}

/**
 * Mock API: 更新正文
 */
export function mockUpdateBody(bodyId: number, data: BodyUpdate): BodyUpdateResponse {
  console.log('[MOCK] Update Body', { bodyId, data })

  for (const [projectId, bodies] of mockBodies.entries()) {
    const index = bodies.findIndex((b) => b.id === bodyId)
    if (index !== -1) {
      const updatedBody = {
        ...bodies[index],
        ...data,
        updated_at: new Date().toISOString()
      }
      bodies[index] = updatedBody
      mockBodies.set(projectId, bodies)
      return updatedBody
    }
  }

  throw new Error('Body not found')
}

/**
 * Mock API: 删除正文（停用）
 */
export function mockDeleteBody(bodyId: number): BodyDeactivateResponse {
  console.log('[MOCK] Delete Body', { bodyId })

  for (const [projectId, bodies] of mockBodies.entries()) {
    const index = bodies.findIndex((b) => b.id === bodyId)
    if (index !== -1) {
      bodies[index] = {
        ...bodies[index],
        status: 'archived' as const,
        updated_at: new Date().toISOString()
      }
      mockBodies.set(projectId, bodies)
      return {
        id: bodyId,
        success: true,
        message: '正文已停用'
      }
    }
  }

  throw new Error('Body not found')
}

/**
 * Mock API: 激活正文
 */
export function mockActivateBody(bodyId: number, data: { reason?: string }): BodyActivateResponse {
  console.log('[MOCK] Activate Body', { bodyId, data })

  for (const [projectId, bodies] of mockBodies.entries()) {
    const index = bodies.findIndex((b) => b.id === bodyId)
    if (index !== -1) {
      // 先停用所有其他正文
      bodies.forEach((b) => {
        if (b.status === 'active') {
          b.status = 'draft'
        }
      })

      // 激活当前正文
      const activatedBody = {
        ...bodies[index],
        status: 'active' as const,
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      bodies[index] = activatedBody
      mockBodies.set(projectId, bodies)
      return activatedBody
    }
  }

  throw new Error('Body not found')
}

/**
 * Mock API: 停用正文
 */
export function mockDeactivateBody(bodyId: number): BodyDeactivateResponse {
  console.log('[MOCK] Deactivate Body', { bodyId })

  for (const [projectId, bodies] of mockBodies.entries()) {
    const index = bodies.findIndex((b) => b.id === bodyId)
    if (index !== -1) {
      bodies[index] = {
        ...bodies[index],
        status: 'draft' as const,
        updated_at: new Date().toISOString()
      }
      mockBodies.set(projectId, bodies)
      return {
        id: bodyId,
        success: true,
        message: '正文已停用'
      }
    }
  }

  throw new Error('Body not found')
}

/**
 * Mock API: 获取文本统计
 */
export function mockGetTextStats(bodyId: number): TextStatsResponse {
  console.log('[MOCK] Get Text Stats', { bodyId })

  // 获取正文内容
  let content = ''
  for (const bodies of mockBodies.values()) {
    const body = bodies.find((b) => b.id === bodyId)
    if (body) {
      content = body.content
      break
    }
  }

  // 计算统计信息
  const characters = content.length
  const charactersNoSpaces = content.replace(/\s/g, '').length
  const words = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
  const sentences = content.split(/[。！？.!?]/).filter((s) => s.trim().length > 0).length

  // 统计标题
  const headings = (content.match(/^#{1,6}\s+.+$/gm) || []).length
  const headingsByLevel: Record<string, number> = {}
  for (let i = 1; i <= 6; i++) {
    const pattern = new RegExp(`^#{${i}}\\s+.+$`, 'gm')
    headingsByLevel[i] = (content.match(pattern) || []).length
  }

  // 统计链接和图片
  const links = (content.match(/\[[^\]]+\]\([^)]+\)/g) || []).length
  const images = (content.match(/!\[.*?\]\([^)]+\)/g) || []).length

  // 统计代码块和列表
  const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length
  const listItems = (content.match(/^\s*[-*+]\s+.+$/gm) || []).length

  // 平均长度
  const avgSentenceLength = sentences > 0 ? Math.round(words / sentences) : 0
  const avgParagraphLength = paragraphs > 0 ? Math.round(words / paragraphs) : 0

  return {
    body_id: bodyId,
    stats: {
      characters,
      charactersNoSpaces,
      words,
      paragraphs,
      sentences,
      headings,
      headingsByLevel,
      links,
      images,
      codeBlocks,
      listItems,
      avgSentenceLength,
      avgParagraphLength,
      readingTime: Math.ceil(words / 500)
    },
    calculated_at: new Date().toISOString()
  }
}

/**
 * Mock API: 获取可读性分析
 */
export function mockGetReadabilityAnalysis(bodyId: number): ReadabilityAnalysisResponse {
  console.log('[MOCK] Get Readability Analysis', { bodyId })

  // 获取正文内容
  let content = ''
  for (const bodies of mockBodies.values()) {
    const body = bodies.find((b) => b.id === bodyId)
    if (body) {
      content = body.content
      break
    }
  }

  // 计算统计信息用于可读性分析
  const words = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
  const sentences = content.split(/[。！？.!?]/).filter((s) => s.trim().length > 0).length
  const avgSentenceLength = sentences > 0 ? Math.round(words / sentences) : 0

  // 简单的可读性评分
  let score = 50
  if (avgSentenceLength < 15) score += 10
  if (avgSentenceLength > 25) score -= 10
  score = Math.max(0, Math.min(100, score))

  // 确定可读性等级
  let level:
    | 'very_easy'
    | 'easy'
    | 'fairly_easy'
    | 'standard'
    | 'fairly_difficult'
    | 'difficult'
    | 'very_difficult'
  let description: string

  if (score >= 90) {
    level = 'very_easy'
    description = '非常容易阅读'
  } else if (score >= 80) {
    level = 'easy'
    description = '容易阅读'
  } else if (score >= 70) {
    level = 'fairly_easy'
    description = '较为容易阅读'
  } else if (score >= 60) {
    level = 'standard'
    description = '标准难度'
  } else if (score >= 50) {
    level = 'fairly_difficult'
    description = '较为困难'
  } else if (score >= 30) {
    level = 'difficult'
    description = '困难'
  } else {
    level = 'very_difficult'
    description = '非常困难'
  }

  // 生成建议
  const suggestions: string[] = []
  if (avgSentenceLength > 25) {
    suggestions.push('建议将长句拆分为短句')
  }
  if (avgSentenceLength < 10) {
    suggestions.push('可以适当增加句子长度以提高连贯性')
  }
  if (sentences < 5 && words > 100) {
    suggestions.push('建议增加段落分隔')
  }

  return {
    body_id: bodyId,
    readability: {
      score,
      level,
      description
    },
    suggestions,
    analyzed_at: new Date().toISOString()
  }
}
