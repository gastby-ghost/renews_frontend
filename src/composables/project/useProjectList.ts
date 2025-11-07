/**
 * 项目列表组合式函数
 *
 * 职责：管理项目列表页面的所有功能和状态
 *
 * 主要功能：
 * 1. 项目列表获取和缓存
 * 2. 项目搜索和过滤
 * 3. 项目创建、编辑、删除
 * 4. 项目状态管理和导航
 */

import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useProjectStore } from '@/store/modules/project'
import type { ProjectCreate, ProjectResponse } from '@/types/api'

/**
 * 项目列表组合式函数
 */
export function useProjectList() {
  const router = useRouter()
  const projectStore = useProjectStore()

  // Store 状态 - 使用 projectsWithUiData 获取格式化后的数据
  const { projectsWithUiData: projectList, loading, error } = storeToRefs(projectStore)

  // 本地状态
  const searchKeyword = ref('')
  const dialogVisible = ref(false)
  const formRef = ref()

  // 项目表单数据
  const form = reactive<ProjectForm>({
    name: '',
    description: '',
    type: 'document'
  })

  // 表单验证规则
  const rules = reactive({
    name: [
      { required: true, message: '请输入项目名称', trigger: 'blur' },
      { min: 2, max: 50, message: '项目名称长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    description: [
      { required: true, message: '请输入项目描述', trigger: 'blur' },
      { min: 10, max: 200, message: '项目描述长度在 10 到 200 个字符', trigger: 'blur' }
    ]
  })

  // ========== 计算属性 ==========

  // 过滤后的项目列表
  const filteredProjectList = computed(() => {
    if (!searchKeyword.value.trim()) {
      return projectList.value
    }

    const keyword = searchKeyword.value.toLowerCase()
    return projectList.value.filter((project: ProjectResponse) =>
      project.name.toLowerCase().includes(keyword)
    )
  })

  // ========== 搜索功能 ==========

  // 防抖搜索
  const handleSearch = useDebounceFn(() => {
    // 搜索逻辑通过 computed 属性自动完成
    // 这里可以添加额外的搜索逻辑
  }, 300)

  // ========== 项目操作 ==========

  // 创建项目
  const createProject = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      const projectData: ProjectCreate = {
        name: form.name.trim(),
        status: 'TITLE_GENERATION',
        current_component: 'topic-selection'
      }

      const newProject = await projectStore.createProject(projectData)

      if (newProject) {
        ElMessage.success('项目创建成功')
        dialogVisible.value = false

        // 重置表单
        form.name = ''
        form.description = ''
        form.type = 'document'

        // 跳转到项目详情或列表
        // 可以根据需要调整跳转逻辑
      }
    } catch (error) {
      if (error !== false) {
        // 验证失败不显示错误，ElMessage 已自动显示
        console.error('Project creation error:', error)
      }
    }
  }

  // 继续项目（根据状态跳转到对应页面）
  const continueProject = (project: ProjectResponse) => {
    // 根据项目状态决定跳转路径（符合新OpenAPI规范）
    const routeMap: Record<string, string> = {
      TITLE_GENERATION: '/document-generation/topic-selection',
      OUTLINE_GENERATION: '/document-generation/outline',
      BODY_GENERATION: '/document-generation/content',
      COMPLETED: '/document-generation/content'
    }

    const route = routeMap[project.status] || '/document-generation/topic-selection'
    router.push(`${route}/${project.id}`)
  }

  // 编辑项目
  const editProject = async (project?: ProjectResponse) => {
    const targetProject = project || projectList.value[0]

    if (!targetProject) {
      ElMessage.warning('请先选择要编辑的项目')
      return
    }

    ElMessage.info('编辑功能开发中...')
    // TODO: 实现编辑功能
  }

  // 删除项目
  const deleteProject = async (project: ProjectResponse) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除项目「${project.name}」吗？此操作不可恢复。`,
        '删除项目',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      await projectStore.deleteProjects([project.id])
      ElMessage.success('项目删除成功')
    } catch (error) {
      if (error !== 'cancel') {
        console.error('Delete project error:', error)
        ElMessage.error('项目删除失败')
      }
    }
  }

  // ========== 状态相关 ==========

  // 获取状态类型
  const getStatusType = (status: string) => {
    const statusMap: Record<string, any> = {
      TITLE_GENERATION: 'info',
      OUTLINE_GENERATION: 'warning',
      BODY_GENERATION: 'warning',
      COMPLETED: 'success'
    }
    return statusMap[status] || 'info'
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      TITLE_GENERATION: '标题生成',
      OUTLINE_GENERATION: '大纲生成',
      BODY_GENERATION: '正文生成',
      COMPLETED: '已完成'
    }
    return statusMap[status] || '未知'
  }

  // 获取按钮文本
  const getActionText = (status: string) => {
    const actionMap: Record<string, string> = {
      TITLE_GENERATION: '开始创作',
      OUTLINE_GENERATION: '继续创作',
      BODY_GENERATION: '继续创作',
      COMPLETED: '查看内容'
    }
    return actionMap[status] || '查看详情'
  }

  // 获取步骤状态
  const getStepStatus = (project: any, stepIndex: number) => {
    // 直接使用 project.currentStep，由 Store 的 projectsWithUiData 计算属性提供
    const currentStep = project.currentStep || 1
    return stepIndex <= currentStep ? 'completed' : 'pending'
  }

  // ========== 工具函数 ==========

  // 格式化日期
  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ========== 返回值 ==========

  return {
    // Store 状态
    projectStore,
    projectList,
    loading,
    error,

    // 本地状态
    searchKeyword,
    dialogVisible,
    formRef,
    form,
    rules,

    // 计算属性
    filteredProjectList,

    // 方法
    handleSearch,
    createProject,
    continueProject,
    editProject,
    deleteProject,
    formatDate,

    // 状态工具
    getStatusType,
    getStatusText,
    getActionText,
    getStepStatus
  }
}

/**
 * 项目表单接口
 */
interface ProjectForm {
  name: string
  description: string
  type: string
}
