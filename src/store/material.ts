import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { materialSearchService } from '@/services/materialSearch'
import type { Material, SearchConfig, SearchProgress, MaterialLibraryState } from '@/types/material'

export const useMaterialStore = defineStore('material', () => {
  const state = ref<MaterialLibraryState>({
    materials: [],
    selectedMaterials: [],
    searchHistory: [],
    providers: [
      {
        id: 'google',
        name: 'Google Search',
        type: 'api',
        apiEndpoint: '/api/search/google'
      },
      {
        id: 'bing',
        name: 'Bing Search',
        type: 'api',
        apiEndpoint: '/api/search/bing'
      },
      {
        id: 'unsplash',
        name: 'Unsplash',
        type: 'api',
        apiEndpoint: '/api/search/unsplash'
      },
      {
        id: 'openai',
        name: 'OpenAI',
        type: 'ai',
        apiEndpoint: '/api/ai/openai'
      },
      {
        id: 'claude',
        name: 'Claude',
        type: 'ai',
        apiEndpoint: '/api/ai/claude'
      }
    ],
    loading: false,
    error: null
  })

  const materials = computed(() => state.value.materials)
  const selectedMaterials = computed(() => state.value.selectedMaterials)
  const searchHistory = computed(() => state.value.searchHistory)
  const providers = computed(() => state.value.providers)
  const loading = computed(() => state.value.loading)
  const error = computed(() => state.value.error)

  const selectedMaterialList = computed(() =>
    state.value.materials.filter((material) => state.value.selectedMaterials.includes(material.id))
  )

  function addMaterial(material: Material) {
    state.value.materials.unshift(material)
  }

  function addMaterials(materials: Material[]) {
    state.value.materials.unshift(...materials)
  }

  function removeMaterial(id: string) {
    const index = state.value.materials.findIndex((m) => m.id === id)
    if (index > -1) {
      state.value.materials.splice(index, 1)
    }
    state.value.selectedMaterials = state.value.selectedMaterials.filter(
      (selectedId) => selectedId !== id
    )
  }

  function toggleMaterialSelection(id: string) {
    const index = state.value.selectedMaterials.indexOf(id)
    if (index > -1) {
      state.value.selectedMaterials.splice(index, 1)
    } else {
      state.value.selectedMaterials.push(id)
    }
  }

  function clearSelection() {
    state.value.selectedMaterials = []
  }

  function selectAll() {
    state.value.selectedMaterials = state.value.materials.map((m) => m.id)
  }

  function setSearchProgress(progress: SearchProgress) {
    // Implementation for search progress tracking
    console.log('Search progress:', progress)
  }

  async function searchMaterials(config: SearchConfig) {
    state.value.loading = true
    state.value.error = null

    try {
      // Add to search history
      state.value.searchHistory.unshift({
        ...config,
        providers: [...config.providers]
      })

      // Use the search service
      const searchParams = {
        keywords: config.keywords,
        providers: config.providers,
        searchScope: config.searchScope,
        aiProvider: config.aiProvider,
        filters: config.filters,
        page: 1,
        pageSize: 50
      }

      // For now, use mock search service
      const result = await materialSearchService.mockSearch(searchParams)

      addMaterials(result.materials)
      return result.materials
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '搜索失败'
      throw error
    } finally {
      state.value.loading = false
    }
  }

  function updateMaterial(id: string, updates: Partial<Material>) {
    const index = state.value.materials.findIndex((m) => m.id === id)
    if (index > -1) {
      state.value.materials[index] = { ...state.value.materials[index], ...updates }
    }
  }

  function getMaterialsByType(type: Material['type']) {
    return state.value.materials.filter((m) => m.type === type)
  }

  function getMaterialsByTag(tag: string) {
    return state.value.materials.filter((m) => m.tags.includes(tag))
  }

  function clearError() {
    state.value.error = null
  }

  async function addToLibrary(materialIds: string[]) {
    try {
      await materialSearchService.addToLibrary(materialIds)
      // Update local state to mark materials as in library
      materialIds.forEach((id) => {
        updateMaterial(id, { selected: false })
      })
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '添加到素材库失败'
      throw error
    }
  }

  async function removeFromLibrary(materialIds: string[]) {
    try {
      await materialSearchService.removeFromLibrary(materialIds)
      materialIds.forEach((id) => {
        removeMaterial(id)
      })
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '从素材库删除失败'
      throw error
    }
  }

  async function loadLibraryMaterials(params?: {
    type?: Material['type']
    source?: string
    tags?: string[]
    search?: string
    page?: number
    pageSize?: number
  }) {
    state.value.loading = true
    state.value.error = null

    try {
      const result = await materialSearchService.getLibraryMaterials(params)
      state.value.materials = result.materials
      return result.materials
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '加载素材库失败'
      throw error
    } finally {
      state.value.loading = false
    }
  }

  return {
    // State
    materials,
    selectedMaterials,
    searchHistory,
    providers,
    loading,
    error,
    selectedMaterialList,

    // Actions
    addMaterial,
    addMaterials,
    removeMaterial,
    toggleMaterialSelection,
    clearSelection,
    selectAll,
    setSearchProgress,
    searchMaterials,
    updateMaterial,
    getMaterialsByType,
    getMaterialsByTag,
    clearError,
    addToLibrary,
    removeFromLibrary,
    loadLibraryMaterials
  }
})
