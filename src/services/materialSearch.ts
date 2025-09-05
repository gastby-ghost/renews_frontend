import http from '@/utils/http'
import type { Material, SearchProvider } from '@/types/material'

export interface SearchResult {
  materials: Material[]
  total: number
  page: number
  pageSize: number
}

export interface SearchParams {
  keywords: string
  providers: string[]
  searchScope?: string
  aiProvider?: string
  filters?: {
    type?: Material['type'][]
    source?: string[]
    tags?: string[]
  }
  page?: number
  pageSize?: number
}

class MaterialSearchService {
  private baseUrl = '/api/materials'

  async search(params: SearchParams): Promise<SearchResult> {
    try {
      const response = await http.post(`${this.baseUrl}/search`, params)
      return response.data
    } catch (error) {
      console.error('Search error:', error)
      throw new Error('搜索失败，请稍后重试')
    }
  }

  async searchByProvider(providerId: string, params: SearchParams): Promise<SearchResult> {
    try {
      const response = await http.post(`${this.baseUrl}/search/${providerId}`, params)
      return response.data
    } catch (error) {
      console.error(`Provider ${providerId} search error:`, error)
      throw new Error(`通过 ${providerId} 搜索失败`)
    }
  }

  async getProviders(): Promise<SearchProvider[]> {
    try {
      const response = await http.get(`${this.baseUrl}/providers`)
      return response.data
    } catch (error) {
      console.error('Get providers error:', error)
      throw new Error('获取搜索提供商失败')
    }
  }

  async addToLibrary(materialIds: string[]): Promise<void> {
    try {
      await http.post(`${this.baseUrl}/add-to-library`, { materialIds })
    } catch (error) {
      console.error('Add to library error:', error)
      throw new Error('添加到素材库失败')
    }
  }

  async removeFromLibrary(materialIds: string[]): Promise<void> {
    try {
      await http.delete(`${this.baseUrl}/remove-from-library`, {
        data: { materialIds }
      })
    } catch (error) {
      console.error('Remove from library error:', error)
      throw new Error('从素材库删除失败')
    }
  }

  async getLibraryMaterials(params?: {
    type?: Material['type']
    source?: string
    tags?: string[]
    search?: string
    page?: number
    pageSize?: number
  }): Promise<SearchResult> {
    try {
      const response = await http.get(`${this.baseUrl}/library`, { params })
      return response.data
    } catch (error) {
      console.error('Get library materials error:', error)
      throw new Error('获取素材库失败')
    }
  }

  async downloadMaterial(materialId: string): Promise<string> {
    try {
      const response = await http.get(`${this.baseUrl}/${materialId}/download`)
      return response.data.url
    } catch (error) {
      console.error('Download material error:', error)
      throw new Error('下载素材失败')
    }
  }

  async getMaterialDetails(materialId: string): Promise<Material> {
    try {
      const response = await http.get(`${this.baseUrl}/${materialId}`)
      return response.data
    } catch (error) {
      console.error('Get material details error:', error)
      throw new Error('获取素材详情失败')
    }
  }

  // Mock search for development/testing
  async mockSearch(params: SearchParams): Promise<SearchResult> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    const mockMaterials: Material[] = Array.from({ length: 10 }, (_, index) => ({
      id: `mock-${params.keywords}-${Date.now()}-${index}`,
      title: `${params.keywords} - 相关素材 ${index + 1}`,
      source: params.providers[0] || 'mock',
      summary: `这是关于${params.keywords}的高质量素材，适合多种用途。素材内容丰富，质量优秀，可以满足您的各种需求。`,
      tags: [params.keywords, '素材', '高质量', '专业'],
      type: ['image', 'video', 'text', 'other'][Math.floor(Math.random() * 4)] as Material['type'],
      url: `https://example.com/material-${index + 1}`,
      thumbnail: `https://picsum.photos/300/200?random=${Date.now()}-${index}`,
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30), // Random date within 30 days
      selected: false
    }))

    return {
      materials: mockMaterials,
      total: mockMaterials.length,
      page: params.page || 1,
      pageSize: params.pageSize || 20
    }
  }

  // Provider-specific search implementations
  async searchGoogle(params: SearchParams): Promise<SearchResult> {
    return this.mockSearch(params)
  }

  async searchBing(params: SearchParams): Promise<SearchResult> {
    return this.mockSearch(params)
  }

  async searchUnsplash(params: SearchParams): Promise<SearchResult> {
    const result = await this.mockSearch(params)
    // Unsplash-specific modifications
    result.materials = result.materials.map((material) => ({
      ...material,
      type: 'image' as const,
      source: 'Unsplash',
      tags: [...material.tags, 'photo', 'photography']
    }))
    return result
  }

  async searchWithAI(params: SearchParams): Promise<SearchResult> {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000))

    const result = await this.mockSearch(params)

    // AI-specific enhancements
    result.materials = result.materials.map((material) => ({
      ...material,
      summary: `AI增强：${material.summary}。通过AI技术优化了素材的相关性和质量评分。`,
      tags: [...material.tags, 'AI-enhanced', '智能推荐']
    }))

    return result
  }
}

export const materialSearchService = new MaterialSearchService()
