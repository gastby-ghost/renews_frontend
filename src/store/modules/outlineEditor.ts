import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { OutlineSection } from '@/types/ai'
import type { Material } from '@/types/material'

/**
 * 素材绑定结果接口
 */
interface MaterialBindResult {
  title: string
  material_section_bindings: Array<{
    section_id: number
    section_title: string
    materials: Array<{
      id: string
      title: string
      summary: string
      score: number
      published_date?: string
      url?: string
      relevance_explanation?: string
    }>
    match_scores: number[]
    relevance_explanation: string
    binding_type?: string
    binding_reason?: string
    material_usage_justification?: string
    section_level?: number
  }>
  binding_summary?: string
  final_report?: string
  total_sections: number
  total_materials_bound: number
}

/**
 * 大纲编辑器状态管理
 * 专门用于 OutlineEditorSection.vue 的状态管理
 */
export const useOutlineEditorStore = defineStore(
  'outlineEditor',
  () => {
    // ========== 状态定义 ==========

    // 生成的大纲章节列表
    const generatedOutline = ref<OutlineSection[]>([])

    // 当前激活的详情标签页
    const activeDetailTab = ref('')

    // 是否正在生成大纲
    const generatingOutline = ref(false)

    // 是否正在绑定素材
    const isBindingMaterials = ref(false)

    // 素材绑定进度
    const bindingProgress = ref(0)

    // 素材绑定结果
    const bindingResult = ref<MaterialBindResult | null>(null)

    // 错误信息
    const error = ref<string | null>(null)

    // 已选择的素材列表
    const selectedMaterials = ref<Material[]>([])

    // ========== 计算属性 ==========

    // 是否可以从标题生成大纲
    const canGenerateFromTitle = computed(() => {
      // 这里需要从其他 store 获取标题和研究简报信息
      // 暂时返回 true，实际使用时需要结合 documentStore
      return true
    })

    // 是否可以添加章节
    const canAddSection = computed(() => {
      return generatedOutline.value.length < 10
    })

    // 章节数量
    const sectionCount = computed(() => generatedOutline.value.length)

    // ========== 核心方法 ==========

    /**
     * 设置生成的大纲
     */
    const setGeneratedOutline = (outline: OutlineSection[]) => {
      console.log('📝 [setGeneratedOutline] 开始设置大纲数据')
      console.log('📝 [setGeneratedOutline] 输入数据类型:', typeof outline)
      console.log('📝 [setGeneratedOutline] 输入数据是否为数组:', Array.isArray(outline))
      console.log('📝 [setGeneratedOutline] 输入数据长度:', outline?.length)

      if (!outline || !Array.isArray(outline)) {
        console.error('❌ [setGeneratedOutline] 无效的大纲数据:', outline)
        return
      }

      if (outline.length === 0) {
        console.warn('⚠️ [setGeneratedOutline] 接收到空的大纲数组')
      } else {
        console.log('📝 [setGeneratedOutline] 第一个章节数据:', outline[0])
        console.log('📝 [setGeneratedOutline] 最后一个章节数据:', outline[outline.length - 1])
      }

      generatedOutline.value = outline
      console.log(
        '✅ [setGeneratedOutline] 大纲设置完成，当前章节数:',
        generatedOutline.value.length
      )

      // 验证数据是否正确设置
      setTimeout(() => {
        console.log('🔍 [setGeneratedOutline] 验证数据设置结果:', {
          length: generatedOutline.value.length,
          firstItem: generatedOutline.value[0],
          lastItem: generatedOutline.value[generatedOutline.value.length - 1]
        })
      }, 100)
    }

    /**
     * 添加章节
     */
    const addSection = (section: OutlineSection) => {
      generatedOutline.value.push(section)
    }

    /**
     * 更新章节
     */
    const updateSection = (sectionTitle: string, updates: Partial<OutlineSection>) => {
      const section = generatedOutline.value.find((s) => s.title === sectionTitle)
      if (section) {
        Object.assign(section, updates)
      }
    }

    /**
     * 删除章节
     */
    const deleteSection = (index: number) => {
      if (index >= 0 && index < generatedOutline.value.length) {
        generatedOutline.value.splice(index, 1)
      }
    }

    /**
     * 上移章节
     */
    const moveSectionUp = (index: number) => {
      if (index > 0 && index < generatedOutline.value.length) {
        const temp = generatedOutline.value[index]
        generatedOutline.value[index] = generatedOutline.value[index - 1]
        generatedOutline.value[index - 1] = temp
      }
    }

    /**
     * 下移章节
     */
    const moveSectionDown = (index: number) => {
      if (index >= 0 && index < generatedOutline.value.length - 1) {
        const temp = generatedOutline.value[index]
        generatedOutline.value[index] = generatedOutline.value[index + 1]
        generatedOutline.value[index + 1] = temp
      }
    }

    /**
     * 清空大纲
     */
    const clearOutline = () => {
      generatedOutline.value = []
    }

    /**
     * 设置激活的详情标签页
     */
    const setActiveDetailTab = (tab: string) => {
      activeDetailTab.value = tab
    }

    /**
     * 设置生成状态
     */
    const setGeneratingOutline = (generating: boolean) => {
      generatingOutline.value = generating
    }

    /**
     * 设置素材绑定状态
     */
    const setIsBindingMaterials = (binding: boolean) => {
      isBindingMaterials.value = binding
    }

    /**
     * 设置素材绑定进度
     */
    const setBindingProgress = (progress: number) => {
      bindingProgress.value = progress
    }

    /**
     * 设置素材绑定结果
     */
    const setBindingResult = (result: MaterialBindResult | null) => {
      console.log('📝 [setBindingResult] 设置绑定结果:', result)
      bindingResult.value = result
      console.log('✅ [setBindingResult] 绑定结果设置完成')
    }

    /**
     * 设置错误信息
     */
    const setError = (errorMessage: string | null) => {
      error.value = errorMessage
    }

    /**
     * 设置已选择的素材
     */
    const setSelectedMaterials = (materials: Material[]) => {
      selectedMaterials.value = materials
    }

    /**
     * 绑定素材到章节
     */
    const bindMaterialToSection = (sectionIndex: number, material: Material) => {
      const section = generatedOutline.value[sectionIndex]
      if (!section) {
        return
      }

      if (!section.data_requirements) {
        section.data_requirements = []
      }

      if (!section.data_requirements.includes(material.title)) {
        section.data_requirements.push(material.title)
        ElMessage.success('素材绑定成功')
      } else {
        ElMessage.warning('素材已绑定')
      }
    }

    /**
     * 解绑素材
     */
    const unbindMaterialFromSection = (sectionIndex: number, materialTitle: string) => {
      const section = generatedOutline.value[sectionIndex]
      if (!section || !section.data_requirements) {
        return
      }

      const index = section.data_requirements.indexOf(materialTitle)
      if (index > -1) {
        section.data_requirements.splice(index, 1)
        ElMessage.success('素材解绑成功')
      }
    }

    /**
     * 获取章节的绑定素材
     */
    const getSectionBindings = (sectionIndex: number) => {
      if (!bindingResult.value) return undefined
      return bindingResult.value.material_section_bindings.find(
        (binding) => binding.section_id === sectionIndex + 1
      )
    }

    /**
     * 获取章节的平均匹配分数
     */
    const getAverageMatchScore = (sectionIndex: number): number => {
      const bindings = getSectionBindings(sectionIndex)
      if (!bindings || bindings.match_scores.length === 0) return 0
      const average =
        bindings.match_scores.reduce((sum, score) => sum + score, 0) / bindings.match_scores.length
      return Math.round(average)
    }

    /**
     * 获取可用于当前章节的素材（排除已绑定的）
     * 注意：此方法可能在模板中频繁调用，建议在组件层面使用 computed 缓存
     */
    const getAvailableMaterialsForSection = (sectionIndex: number): Material[] => {
      const section = generatedOutline.value[sectionIndex]
      if (!section) return []

      // 获取已绑定的素材标题
      const boundMaterials = new Set(section.data_requirements || [])

      // 如果有AI绑定结果，也排除那些
      const aiBindings = getSectionBindings(sectionIndex)
      if (aiBindings) {
        aiBindings.materials.forEach((material) => {
          boundMaterials.add(material.title)
        })
      }

      // 返回所有素材中未绑定的部分
      return selectedMaterials.value.filter((material) => !boundMaterials.has(material.title))
    }

    /**
     * 重置所有状态
     */
    const reset = () => {
      generatedOutline.value = []
      activeDetailTab.value = ''
      generatingOutline.value = false
      isBindingMaterials.value = false
      bindingProgress.value = 0
      bindingResult.value = null
      error.value = null
      selectedMaterials.value = []
    }

    return {
      // 状态
      generatedOutline,
      activeDetailTab,
      generatingOutline,
      isBindingMaterials,
      bindingProgress,
      bindingResult,
      error,
      selectedMaterials,

      // 计算属性
      canGenerateFromTitle,
      canAddSection,
      sectionCount,

      // 设置方法
      setGeneratedOutline,
      setActiveDetailTab,
      setGeneratingOutline,
      setIsBindingMaterials,
      setBindingProgress,
      setBindingResult,
      setError,
      setSelectedMaterials,

      // 章节操作方法
      addSection,
      updateSection,
      deleteSection,
      moveSectionUp,
      moveSectionDown,
      clearOutline,

      // 素材绑定方法
      bindMaterialToSection,
      unbindMaterialFromSection,

      // 查询方法
      getSectionBindings,
      getAverageMatchScore,
      getAvailableMaterialsForSection,

      // 重置方法
      reset
    }
  },
  {
    persist: {
      key: 'outline-editor',
      storage: localStorage,
      paths: ['generatedOutline', 'selectedMaterials']
    }
  }
)
