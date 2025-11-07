import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  materialRelationService,
  type MaterialTitleRelation,
  type MaterialSectionRelation,
  type MaterialRelationsResponse
} from '@/services/materialRelationService'
import { ElMessage } from 'element-plus'

export const useMaterialRelationStore = defineStore('materialRelation', () => {
  // 状态
  const titleRelations = ref<MaterialTitleRelation[]>([])
  const sectionRelations = ref<MaterialSectionRelation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const titleRelationCount = computed(() => titleRelations.value.length)
  const sectionRelationCount = computed(() => sectionRelations.value.length)
  const allRelations = computed(() => [...titleRelations.value, ...sectionRelations.value])

  // 设置方法
  const setTitleRelations = (relations: MaterialTitleRelation[]) => {
    titleRelations.value = relations
  }

  const addTitleRelation = (relation: MaterialTitleRelation) => {
    titleRelations.value.push(relation)
  }

  const removeTitleRelation = (relationId: number) => {
    const index = titleRelations.value.findIndex((r) => r.id === relationId)
    if (index !== -1) {
      titleRelations.value.splice(index, 1)
    }
  }

  const updateTitleRelation = (relationId: number, updates: Partial<MaterialTitleRelation>) => {
    const relation = titleRelations.value.find((r) => r.id === relationId)
    if (relation) {
      Object.assign(relation, updates)
    }
  }

  const setSectionRelations = (relations: MaterialSectionRelation[]) => {
    sectionRelations.value = relations
  }

  const addSectionRelation = (relation: MaterialSectionRelation) => {
    sectionRelations.value.push(relation)
  }

  const removeSectionRelation = (relationId: number) => {
    const index = sectionRelations.value.findIndex((r) => r.id === relationId)
    if (index !== -1) {
      sectionRelations.value.splice(index, 1)
    }
  }

  const updateSectionRelation = (relationId: number, updates: Partial<MaterialSectionRelation>) => {
    const relation = sectionRelations.value.find((r) => r.id === relationId)
    if (relation) {
      Object.assign(relation, updates)
    }
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  // Title Relations API
  const bindMaterialToTitle = async (
    titleCandidateId: number,
    materialId: number,
    score?: number
  ) => {
    try {
      setLoading(true)
      setError(null)
      const relation = await materialRelationService.bindMaterialToTitle(titleCandidateId, {
        material_id: materialId,
        score
      })
      addTitleRelation(relation)
      ElMessage.success('素材绑定成功')
      return relation
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '绑定素材失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const fetchTitleMaterials = async (titleCandidateId: number, skip = 0, limit = 100) => {
    try {
      setLoading(true)
      setError(null)
      const response = await materialRelationService.getTitleMaterials(
        titleCandidateId,
        skip,
        limit
      )
      setTitleRelations(response.items)
      return response
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '获取标题素材失败'
      setError(message)
      console.error('Fetch title materials error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const unbindMaterialFromTitle = async (titleCandidateId: number, materialId: number) => {
    try {
      setLoading(true)
      setError(null)
      await materialRelationService.unbindMaterialFromTitle(titleCandidateId, materialId)
      // 找到对应的relation并删除
      const relation = titleRelations.value.find(
        (r) => r.material_id === materialId && r.title_candidate_id === titleCandidateId
      )
      if (relation) {
        removeTitleRelation(relation.id)
      }
      ElMessage.success('素材解绑成功')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '解绑素材失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateTitleRelevanceScore = async (relationId: number, score: number) => {
    try {
      setLoading(true)
      setError(null)
      await materialRelationService.updateTitleRelevanceScore(relationId, { score })
      updateTitleRelation(relationId, { score })
      ElMessage.success('评分更新成功')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '更新评分失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Section Relations API
  const bindMaterialToSection = async (
    outlineSectionId: number,
    materialId: number,
    bindingType: 'primary' | 'reference' | 'supporting' = 'reference'
  ) => {
    try {
      setLoading(true)
      setError(null)
      const relation = await materialRelationService.bindMaterialToSection(outlineSectionId, {
        material_id: materialId,
        binding_type: bindingType
      })
      addSectionRelation(relation)
      ElMessage.success('素材绑定成功')
      return relation
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '绑定素材失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const fetchSectionMaterials = async (outlineSectionId: number, skip = 0, limit = 100) => {
    try {
      setLoading(true)
      setError(null)
      const response = await materialRelationService.getSectionMaterials(
        outlineSectionId,
        skip,
        limit
      )
      setSectionRelations(response.items)
      return response
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '获取章节素材失败'
      setError(message)
      console.error('Fetch section materials error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const unbindMaterialFromSection = async (outlineSectionId: number, materialId: number) => {
    try {
      setLoading(true)
      setError(null)
      await materialRelationService.unbindMaterialFromSection(outlineSectionId, materialId)
      // 找到对应的relation并删除
      const relation = sectionRelations.value.find(
        (r) => r.material_id === materialId && r.outline_section_id === outlineSectionId
      )
      if (relation) {
        removeSectionRelation(relation.id)
      }
      ElMessage.success('素材解绑成功')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '解绑素材失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateSectionBindingType = async (
    relationId: number,
    bindingType: 'primary' | 'reference' | 'supporting'
  ) => {
    try {
      setLoading(true)
      setError(null)
      const relation = await materialRelationService.updateSectionBindingType(relationId, {
        binding_type: bindingType
      })
      updateSectionRelation(relationId, { binding_type: bindingType })
      ElMessage.success('绑定类型更新成功')
      return relation
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '更新绑定类型失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Material Relations API
  const fetchMaterialAllRelations = async (materialId: number) => {
    try {
      setLoading(true)
      setError(null)
      const response: MaterialRelationsResponse =
        await materialRelationService.getMaterialAllRelations(materialId)
      setTitleRelations(response.title_relations)
      setSectionRelations(response.section_relations)
      return response
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '获取素材关联失败'
      setError(message)
      console.error('Fetch material relations error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Batch Operations
  const batchBindMaterialsToTitle = async (
    titleCandidateId: number,
    materialIds: number[],
    scores?: number[]
  ) => {
    try {
      setLoading(true)
      setError(null)
      const response = await materialRelationService.batchBindMaterialsToTitle(titleCandidateId, {
        material_ids: materialIds,
        scores
      })
      // 重新获取列表
      await fetchTitleMaterials(titleCandidateId)
      ElMessage.success(`成功绑定 ${response.success_count} 个素材`)
      return response
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '批量绑定失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const batchBindMaterialsToSection = async (
    outlineSectionId: number,
    materialIds: number[],
    bindingTypes?: string[]
  ) => {
    try {
      setLoading(true)
      setError(null)
      const response = await materialRelationService.batchBindMaterialsToSection(outlineSectionId, {
        material_ids: materialIds,
        binding_types: bindingTypes
      })
      // 重新获取列表
      await fetchSectionMaterials(outlineSectionId)
      ElMessage.success(`成功绑定 ${response.success_count} 个素材`)
      return response
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '批量绑定失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const batchUnbindMaterialsFromTitle = async (titleCandidateId: number, materialIds: number[]) => {
    try {
      setLoading(true)
      setError(null)
      const response = await materialRelationService.batchUnbindMaterialsFromTitle(
        titleCandidateId,
        {
          material_ids: materialIds
        }
      )
      // 重新获取列表
      await fetchTitleMaterials(titleCandidateId)
      ElMessage.success(`成功解绑 ${response.success_count} 个素材`)
      return response
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '批量解绑失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const batchUnbindMaterialsFromSection = async (
    outlineSectionId: number,
    materialIds: number[]
  ) => {
    try {
      setLoading(true)
      setError(null)
      const response = await materialRelationService.batchUnbindMaterialsFromSection(
        outlineSectionId,
        {
          material_ids: materialIds
        }
      )
      // 重新获取列表
      await fetchSectionMaterials(outlineSectionId)
      ElMessage.success(`成功解绑 ${response.success_count} 个素材`)
      return response
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '批量解绑失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 辅助方法
  const getRelationsByMaterialId = (materialId: number) => {
    return {
      titleRelations: titleRelations.value.filter((r) => r.material_id === materialId),
      sectionRelations: sectionRelations.value.filter((r) => r.material_id === materialId)
    }
  }

  const getSectionRelationsBySectionId = (sectionId: number) => {
    return sectionRelations.value.filter((r) => r.outline_section_id === sectionId)
  }

  const getTitleRelationsByTitleId = (titleId: number) => {
    return titleRelations.value.filter((r) => r.title_candidate_id === titleId)
  }

  const reset = () => {
    titleRelations.value = []
    sectionRelations.value = []
    error.value = null
  }

  return {
    // 状态
    titleRelations,
    sectionRelations,
    loading,
    error,

    // 计算属性
    titleRelationCount,
    sectionRelationCount,
    allRelations,

    // 设置方法
    setTitleRelations,
    addTitleRelation,
    removeTitleRelation,
    updateTitleRelation,
    setSectionRelations,
    addSectionRelation,
    removeSectionRelation,
    updateSectionRelation,
    setLoading,
    setError,

    // Title Relations API
    bindMaterialToTitle,
    fetchTitleMaterials,
    unbindMaterialFromTitle,
    updateTitleRelevanceScore,

    // Section Relations API
    bindMaterialToSection,
    fetchSectionMaterials,
    unbindMaterialFromSection,
    updateSectionBindingType,

    // Material Relations API
    fetchMaterialAllRelations,

    // Batch Operations
    batchBindMaterialsToTitle,
    batchBindMaterialsToSection,
    batchUnbindMaterialsFromTitle,
    batchUnbindMaterialsFromSection,

    // 辅助方法
    getRelationsByMaterialId,
    getSectionRelationsBySectionId,
    getTitleRelationsByTitleId,
    reset
  }
})
