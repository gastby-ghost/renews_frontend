/**
 * 搜索功能Mock数据
 */

import type { SearchToolsResponse, SearchResultItem } from '@/types/ai'
import type { SearchProvider } from '@/types/material'
import type { Material } from '@/types/material'

// 生成搜索结果项
const generateSearchResultItem = (keywords: string, index: number): SearchResultItem => {
  const domains = ['example.com', 'test.com', 'demo.com', 'sample.com', 'mock.com']
  const domain = domains[index % domains.length]

  return {
    url: `https://${domain}/article-${index + 1}`,
    webtitle: `${keywords} - 相关文章 ${index + 1}` as any,
    score: Math.random() * 0.5 + 0.5, // 0.5-1.0之间
    query: keywords,
    aititle: `AI优化: ${keywords}深度分析 ${index + 1}`,
    summary: `这是关于${keywords}的详细分析文章，包含了丰富的内容和实用的信息。文章从多个角度探讨了${keywords}的相关话题，为读者提供了全面的了解。`,
    tags: [keywords, '分析', '研究', '专业'],
    key_excerpts: [
      `${keywords}是当前研究的热点话题之一`,
      `通过深入分析${keywords}，我们可以发现许多有趣的现象`,
      `专家认为${keywords}在未来会有更大的发展空间`
    ],
    published_date: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
  }
}

// 生成搜索结果
export const generateMockSearchResult = (
  keywords: string,
  page: number = 1,
  pageSize: number = 20
): SearchToolsResponse => {
  const totalCount = 100
  const startIndex = (page - 1) * pageSize

  const results = Array.from({ length: pageSize }, (_, index) =>
    generateSearchResultItem(keywords, startIndex + index)
  )

  return {
    success: true,
    provider: 'tavily',
    results,
    total_results: totalCount,
    search_queries: [keywords],
    search_time: 1.5,
    api_execution_time: 1.2,
    query_count: 1
  }
}

// 转换为Material格式
const transformToMaterial = (item: SearchResultItem, index: number): Material => {
  const url = new URL(item.url)
  const source = url.hostname

  // 确定素材类型
  const determineType = (): Material['type'] => {
    const lowerUrl = item.url.toLowerCase()
    if (lowerUrl.includes('.jpg') || lowerUrl.includes('.png') || lowerUrl.includes('.gif')) {
      return 'image'
    }
    if (lowerUrl.includes('.mp4') || lowerUrl.includes('.avi') || lowerUrl.includes('.mov')) {
      return 'video'
    }
    if (lowerUrl.includes('.mp3') || lowerUrl.includes('.wav') || lowerUrl.includes('.ogg')) {
      return 'audio'
    }
    return 'text'
  }

  return {
    id: `search-${Date.now()}-${index}`,
    title: item.aititle || (item as any).webtitle,
    source,
    summary: item.summary,
    tags: item.tags || [],
    type: determineType(),
    url: item.url,
    thumbnail: `https://picsum.photos/300/200?random=${Date.now()}-${index}`,
    content: item.key_excerpts.join('\n\n'),
    createdAt: item.published_date ? new Date(item.published_date) : new Date(),
    selected: false,
    // Material特有字段
    score: item.score,
    query: item.query,
    aititle: item.aititle,
    key_excerpts: item.key_excerpts,
    published_date: item.published_date,
    webtitle: (item as any).webtitle
  }
}

// 生成SearchTools结果
export const generateMockSearchToolsResult = (
  keywords: string,
  maxResults: number = 20
): SearchToolsResult => {
  const results = Array.from({ length: maxResults }, (_, index) =>
    generateSearchResultItem(keywords, index)
  )

  return {
    materials: results.map((item, index) => transformToMaterial(item, index)),
    total: results.length,
    page: 1,
    pageSize: maxResults
  }
}

// 生成搜索提供商列表
export const generateMockSearchProviders = (): SearchProvider[] => [
  {
    id: 'tavily',
    name: 'Tavily Search',
    type: 'api',
    apiEndpoint: '/api/v1/ai/search-tools/search',
    config: {
      apiKey: 'mock-api-key',
      maxResults: 20,
      topic: 'general'
    }
  },
  {
    id: 'bocha',
    name: 'Bocha Search',
    type: 'api',
    apiEndpoint: '/api/v1/ai/search-tools/search',
    config: {
      apiKey: 'mock-api-key',
      maxResults: 20,
      freshness: '1d'
    }
  },
  {
    id: 'local-search',
    name: 'Local Search',
    type: 'api',
    apiEndpoint: '/api/materials/search',
    config: {
      timeout: 10000
    }
  }
]

// 生成搜索工具状态
export const generateMockSearchToolsStatus = () => ({
  tavily_configured: true,
  bocha_configured: true,
  tavily_api_key_status: 'valid',
  bocha_api_key_status: 'valid',
  default_provider: 'tavily',
  available_providers: ['tavily', 'bocha']
})

// 生成素材库内容
export const generateMockLibraryMaterials = (
  type?: Material['type'],
  source?: string,
  tags?: string[],
  page: number = 1,
  pageSize: number = 20
): SearchResult => {
  const totalCount = 50
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalCount)

  let materials = Array.from({ length: totalCount }, (_, index) => {
    const item = generateSearchResultItem('素材', index)
    return transformToMaterial(item, index)
  })

  // 应用过滤条件
  if (type) {
    materials = materials.filter((material) => material.type === type)
  }

  if (source) {
    materials = materials.filter((material) => material.source.includes(source))
  }

  if (tags && tags.length > 0) {
    materials = materials.filter((material) => tags.some((tag) => material.tags.includes(tag)))
  }

  const paginatedMaterials = materials.slice(startIndex, endIndex)

  return {
    materials: paginatedMaterials,
    total: materials.length,
    page,
    pageSize
  }
}

// 生成素材详情
export const generateMockMaterialDetails = (materialId: string): Material => {
  const index = parseInt(materialId.split('-').pop() || '0')
  const item = generateSearchResultItem('详细内容', index)
  const material = transformToMaterial(item, index)

  // 添加更多详细信息
  material.content = `
# ${material.title}

## 概述
${material.summary}

## 详细内容
这是${material.title}的详细内容。文章从多个角度深入分析了相关主题，提供了丰富的信息和实用的建议。

## 主要观点
1. 第一个主要观点的详细阐述
2. 第二个主要观点的深入分析
3. 第三个主要观点的实践应用

## 结论
通过以上分析，我们可以得出结论：${material.title}是一个值得深入研究的主题。
  `.trim()

  return material
}

// 生成下载链接
export const generateMockDownloadUrl = (materialId: string): string => {
  return `https://example.com/download/${materialId}?token=${Date.now()}`
}
