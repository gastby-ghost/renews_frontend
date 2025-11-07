import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  outlineService,
  type OutlineDetailResponse,
  type OutlineWithSectionsResponse
} from '@/services/outlineService'
import { ElMessage } from 'element-plus'

export const useOutlineStore = defineStore('outline', () => {
  // 状态
  const currentOutline = ref<OutlineDetailResponse | null>(null)
  const outlineWithSections = ref<OutlineWithSectionsResponse | null>(null)
  const outlineHistory = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isActive = computed(() => currentOutline.value?.is_active ?? false)
  const outlineId = computed(() => currentOutline.value?.id)
  const version = computed(() => currentOutline.value?.version ?? 0)
  const sections = computed(() => outlineWithSections.value?.sections ?? [])

  // 动作
  const setCurrentOutline = (outline: OutlineDetailResponse | null) => {
    currentOutline.value = outline
  }

  const setOutlineWithSections = (outline: OutlineWithSectionsResponse | null) => {
    outlineWithSections.value = outline
  }

  const setOutlineHistory = (history: any[]) => {
    outlineHistory.value = history
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  // API方法
  const createOutline = async (
    projectId: number,
    data: { title_candidate_id: number; research_brief?: string }
  ) => {
    try {
      setLoading(true)
      setError(null)
      const outline = await outlineService.createOutline(projectId, data)
      setCurrentOutline(outline)
      ElMessage.success('大纲创建成功')
      return outline
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '创建大纲失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveOutline = async (projectId: number) => {
    try {
      setLoading(true)
      setError(null)
      const outline = await outlineService.getActiveOutline(projectId)
      setCurrentOutline(outline)
      return outline
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '获取活动大纲失败'
      setError(message)
      console.error('Fetch active outline error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchOutlineHistory = async (projectId: number, skip = 0, limit = 100) => {
    try {
      setLoading(true)
      setError(null)
      const history = await outlineService.getOutlineHistory(projectId, skip, limit)
      setOutlineHistory(history.items)
      return history
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '获取大纲历史失败'
      setError(message)
      console.error('Fetch outline history error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchOutlineWithSections = async (outlineId: number) => {
    try {
      setLoading(true)
      setError(null)
      const outline = await outlineService.getOutlineWithSections(outlineId)
      setOutlineWithSections(outline)
      return outline
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '获取大纲详情失败'
      setError(message)
      console.error('Fetch outline with sections error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateOutline = async (outlineId: number, data: { research_brief?: string }) => {
    try {
      setLoading(true)
      setError(null)
      const outline = await outlineService.updateOutline(outlineId, data)
      setCurrentOutline(outline)
      ElMessage.success('大纲更新成功')
      return outline
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '更新大纲失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteOutline = async (outlineId: number) => {
    try {
      setLoading(true)
      setError(null)
      await outlineService.deleteOutline(outlineId)
      setCurrentOutline(null)
      ElMessage.success('大纲删除成功')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '删除大纲失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const activateOutline = async (outlineId: number, reason?: string) => {
    try {
      setLoading(true)
      setError(null)
      const outline = await outlineService.activateOutline(outlineId, { reason })
      setCurrentOutline(outline)
      ElMessage.success('大纲激活成功')
      return outline
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '激活大纲失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deactivateOutline = async (outlineId: number, reason?: string) => {
    try {
      setLoading(true)
      setError(null)
      const outline = await outlineService.deactivateOutline(outlineId, { reason })
      setCurrentOutline(outline)
      ElMessage.success('大纲停用成功')
      return outline
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || '停用大纲失败'
      setError(message)
      ElMessage.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    currentOutline.value = null
    outlineWithSections.value = null
    outlineHistory.value = []
    error.value = null
  }

  return {
    // 状态
    currentOutline,
    outlineWithSections,
    outlineHistory,
    loading,
    error,

    // 计算属性
    isActive,
    outlineId,
    version,
    sections,

    // 设置方法
    setCurrentOutline,
    setOutlineWithSections,
    setOutlineHistory,
    setLoading,
    setError,

    // API方法
    createOutline,
    fetchActiveOutline,
    fetchOutlineHistory,
    fetchOutlineWithSections,
    updateOutline,
    deleteOutline,
    activateOutline,
    deactivateOutline,
    reset
  }
})
