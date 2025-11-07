import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  outlineSectionService,
  type OutlineSection,
  type OutlineSectionCreate
} from '@/services/outlineSectionService'
import { ElMessage } from 'element-plus'

export const useOutlineSectionStore = defineStore('outlineSection', () => {
  // 状态
  const sections = ref<OutlineSection[]>([])
  const currentSection = ref<OutlineSection | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const sectionCount = computed(() => sections.value.length)
  const sortedSections = computed(() =>
    [...sections.value].sort((a, b) => a.order_index - b.order_index)
  )

  // 设置方法
  const setSections = (newSections: OutlineSection[]) => {
    sections.value = newSections
  }

  const addSection = (section: OutlineSection) => {
    sections.value.push(section)
  }

  const updateSectionInList = (updatedSection: OutlineSection) => {
    const index = sections.value.findIndex((s) => s.id === updatedSection.id)
    if (index !== -1) {
      sections.value[index] = updatedSection
    }
    if (currentSection.value?.id === updatedSection.id) {
      currentSection.value = updatedSection
    }
  }

  const removeSection = (sectionId: number) => {
    const index = sections.value.findIndex((s) => s.id === sectionId)
    if (index !== -1) {
      sections.value.splice(index, 1)
    }
    if (currentSection.value?.id === sectionId) {
      currentSection.value = null
    }
  }

  const setCurrentSection = (section: OutlineSection | null) => {
    currentSection.value = section
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  // API方法
  const createSection = async (outlineId: number, data: OutlineSectionCreate) => {
    try {
      setLoading(true)
      setError(null)
      const section = await outlineSectionService.createSection(outlineId, data)
      addSection(section)
      ElMessage.success('章节创建成功')
      return section
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '创建章节失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const fetchSectionsByOutline = async (outlineId: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await outlineSectionService.getSectionsByOutline(outlineId)
      setSections(response.items)
      return response
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '获取章节列表失败'
      setError(message)
      console.error('Fetch sections error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchSectionById = async (sectionId: number) => {
    try {
      setLoading(true)
      setError(null)
      const section = await outlineSectionService.getSectionById(sectionId)
      setCurrentSection(section)
      return section
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '获取章节详情失败'
      setError(message)
      console.error('Fetch section error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateSection = async (
    sectionId: number,
    data: { title?: string; content_direction?: string; order_index?: number }
  ) => {
    try {
      setLoading(true)
      setError(null)
      const section = await outlineSectionService.updateSection(sectionId, data)
      updateSectionInList(section)
      ElMessage.success('章节更新成功')
      return section
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '更新章节失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteSection = async (sectionId: number) => {
    try {
      setLoading(true)
      setError(null)
      await outlineSectionService.deleteSection(sectionId)
      removeSection(sectionId)
      ElMessage.success('章节删除成功')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '删除章节失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const batchCreateSections = async (outlineId: number, sectionsData: OutlineSectionCreate[]) => {
    try {
      setLoading(true)
      setError(null)
      const response = await outlineSectionService.batchCreateSections(outlineId, {
        sections: sectionsData
      })
      setSections([...sections.value, ...response.items])
      ElMessage.success(`成功创建 ${response.created} 个章节`)
      return response
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '批量创建章节失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const reorderSections = async (sectionOrders: Array<{ id: number; order_index: number }>) => {
    try {
      setLoading(true)
      setError(null)
      const response = await outlineSectionService.reorderSections({
        section_orders: sectionOrders
      })
      setSections(response.items)
      ElMessage.success('章节排序更新成功')
      return response
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '重新排序章节失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 辅助方法
  const moveSection = (sectionId: number, direction: 'up' | 'down') => {
    const section = sections.value.find((s) => s.id === sectionId)
    if (!section) return

    const currentIndex = sections.value.findIndex((s) => s.id === sectionId)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= sections.value.length) return

    // 交换顺序
    const tempOrder = sections.value[currentIndex].order_index
    sections.value[currentIndex].order_index = sections.value[targetIndex].order_index
    sections.value[targetIndex].order_index = tempOrder

    // 交换位置
    const temp = sections.value[currentIndex]
    sections.value[currentIndex] = sections.value[targetIndex]
    sections.value[targetIndex] = temp
  }

  const getSectionById = (sectionId: number) => {
    return sections.value.find((s) => s.id === sectionId)
  }

  const reset = () => {
    sections.value = []
    currentSection.value = null
    error.value = null
  }

  return {
    // 状态
    sections,
    currentSection,
    loading,
    error,

    // 计算属性
    sectionCount,
    sortedSections,

    // 设置方法
    setSections,
    addSection,
    updateSectionInList,
    removeSection,
    setCurrentSection,
    setLoading,
    setError,

    // API方法
    createSection,
    fetchSectionsByOutline,
    fetchSectionById,
    updateSection,
    deleteSection,
    batchCreateSections,
    reorderSections,

    // 辅助方法
    moveSection,
    getSectionById,
    reset
  }
})
