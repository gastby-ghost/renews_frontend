export interface Material {
  id: string
  title: string
  source: string
  summary: string
  tags: string[]
  type: 'image' | 'video' | 'text' | 'audio' | 'other'
  url?: string
  thumbnail?: string
  createdAt: Date
  selected?: boolean
}

export interface SearchProvider {
  id: string
  name: string
  type: 'api' | 'ai'
  apiEndpoint?: string
  config?: Record<string, any>
}

export interface SearchProgress {
  stage: 'config' | 'searching' | 'processing' | 'completed'
  current: number
  total: number
  message: string
}

export interface SearchConfig {
  keywords: string
  providers: string[]
  aiProvider?: string
  searchScope: string
  filters: {
    type?: Material['type'][]
    source?: string[]
    tags?: string[]
  }
}

export interface MaterialLibraryState {
  materials: Material[]
  selectedMaterials: string[]
  searchHistory: SearchConfig[]
  providers: SearchProvider[]
  loading: boolean
  error: string | null
}
