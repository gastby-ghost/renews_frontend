/**
 * 新的大纲管理组合式函数
 * 基于新的OpenAPI和服务层
 */

import { computed } from 'vue'
import { useOutlineStore } from '@/store/modules/outline'
import { useOutlineSectionStore } from '@/store/modules/outlineSection'
import { useMaterialRelationStore } from '@/store/modules/materialRelation'
import { ElMessage } from 'element-plus'
import type { OutlineSectionCreate } from '@/services/outlineSectionService'

export function useNewOutline() {
  const outlineStore = useOutlineStore()
  const sectionStore = useOutlineSectionStore()
  const materialRelationStore = useMaterialRelationStore()

  const loading = computed(() => outlineStore.loading || sectionStore.loading)
  const error = computed(() => outlineStore.error || sectionStore.error)

  const currentOutline = computed(() => outlineStore.currentOutline)
  const sections = computed(() => sectionStore.sections)
  const isActive = computed(() => outlineStore.isActive)

  /**
   * 加载项目的大纲
   */
  const loadOutline = async (projectId: number) => {
    try {
      // 获取活动大纲
      const outline = await outlineStore.fetchActiveOutline(projectId)
      if (outline) {
        // 加载大纲章节
        await sectionStore.fetchSectionsByOutline(outline.id)
        return outline
      }
      return null
    } catch (err) {
      console.error('Load outline error:', err)
      return null
    }
  }

  /**
   * 创建新大纲
   */
  const createOutline = async (
    projectId: number,
    titleCandidateId: number,
    researchBrief?: string
  ) => {
    try {
      const outline = await outlineStore.createOutline(projectId, {
        title_candidate_id: titleCandidateId,
        research_brief: researchBrief
      })
      return outline
    } catch (err) {
      console.error('Create outline error:', err)
      throw err
    }
  }

  /**
   * 添加章节
   */
  const addSection = async (title: string, contentDirection?: string) => {
    if (!currentOutline.value) {
      ElMessage.warning('请先创建大纲')
      return null
    }

    const newSection: OutlineSectionCreate = {
      title,
      content_direction: contentDirection,
      order_index: sections.value.length + 1
    }

    try {
      const section = await sectionStore.createSection(currentOutline.value.id, newSection)
      return section
    } catch (err) {
      console.error('Add section error:', err)
      throw err
    }
  }

  /**
   * 更新章节
   */
  const updateSection = async (
    sectionId: number,
    updates: { title?: string; content_direction?: string }
  ) => {
    try {
      await sectionStore.updateSection(sectionId, updates)
    } catch (err) {
      console.error('Update section error:', err)
      throw err
    }
  }

  /**
   * 删除章节
   */
  const deleteSection = async (sectionId: number) => {
    try {
      await sectionStore.deleteSection(sectionId)
      ElMessage.success('章节删除成功')
    } catch (err) {
      console.error('Delete section error:', err)
      ElMessage.error('删除章节失败')
      throw err
    }
  }

  /**
   * 移动章节顺序
   */
  const moveSection = (sectionId: number, direction: 'up' | 'down') => {
    sectionStore.moveSection(sectionId, direction)
  }

  /**
   * 批量创建章节
   */
  const batchCreateSections = async (sectionsData: OutlineSectionCreate[]) => {
    if (!currentOutline.value) {
      ElMessage.warning('请先创建大纲')
      return null
    }

    try {
      const result = await sectionStore.batchCreateSections(currentOutline.value.id, sectionsData)
      return result
    } catch (err) {
      console.error('Batch create sections error:', err)
      throw err
    }
  }

  /**
   * 重新排序章节
   */
  const reorderSections = async () => {
    const sectionOrders = sections.value.map((section, index) => ({
      id: section.id,
      order_index: index + 1
    }))

    try {
      await sectionStore.reorderSections(sectionOrders)
      ElMessage.success('章节排序更新成功')
    } catch (err) {
      console.error('Reorder sections error:', err)
      ElMessage.error('重新排序失败')
      throw err
    }
  }

  /**
   * 绑定素材到章节
   */
  const bindMaterialToSection = async (
    sectionId: number,
    materialId: number,
    bindingType: 'primary' | 'reference' | 'supporting' = 'reference'
  ) => {
    try {
      await materialRelationStore.bindMaterialToSection(sectionId, materialId, bindingType)
      ElMessage.success('素材绑定成功')
    } catch (err) {
      console.error('Bind material error:', err)
      ElMessage.error('绑定素材失败')
      throw err
    }
  }

  /**
   * 解绑素材
   */
  const unbindMaterialFromSection = async (sectionId: number, materialId: number) => {
    try {
      await materialRelationStore.unbindMaterialFromSection(sectionId, materialId)
    } catch (err) {
      console.error('Unbind material error:', err)
      ElMessage.error('解绑素材失败')
      throw err
    }
  }

  /**
   * 获取章节的素材
   */
  const loadSectionMaterials = async (sectionId: number) => {
    try {
      await materialRelationStore.fetchSectionMaterials(sectionId)
      return materialRelationStore.getSectionRelationsBySectionId(sectionId)
    } catch (err) {
      console.error('Load section materials error:', err)
      return []
    }
  }

  /**
   * 激活大纲
   */
  const activateOutline = async (outlineId: number, reason?: string) => {
    try {
      await outlineStore.activateOutline(outlineId, reason)
      ElMessage.success('大纲激活成功')
    } catch (err) {
      console.error('Activate outline error:', err)
      ElMessage.error('激活大纲失败')
      throw err
    }
  }

  /**
   * 停用大纲
   */
  const deactivateOutline = async (outlineId: number, reason?: string) => {
    try {
      await outlineStore.deactivateOutline(outlineId, reason)
      ElMessage.success('大纲停用成功')
    } catch (err) {
      console.error('Deactivate outline error:', err)
      ElMessage.error('停用大纲失败')
      throw err
    }
  }

  /**
   * 重置状态
   */
  const reset = () => {
    outlineStore.reset()
    sectionStore.reset()
    materialRelationStore.reset()
  }

  return {
    // 状态
    loading,
    error,
    currentOutline,
    sections,
    isActive,

    // 方法
    loadOutline,
    createOutline,
    addSection,
    updateSection,
    deleteSection,
    moveSection,
    batchCreateSections,
    reorderSections,
    bindMaterialToSection,
    unbindMaterialFromSection,
    loadSectionMaterials,
    activateOutline,
    deactivateOutline,
    reset
  }
}
