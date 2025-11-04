import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { projectService } from '@/services/projectService'
import type { Api } from '@/typings/api'

// 从Api.Project命名空间导入类型
type ProjectResponse = Api.Project.ProjectResponse
// type ProjectDetailResponse = Api.Project.ProjectDetailResponse
// type ProjectListResponse = Api.Project.ProjectListResponse
type ProjectCreate = Api.Project.ProjectCreate
type ProjectUpdate = Api.Project.ProjectUpdate
// type ProjectDeleteResponse = Api.Project.ProjectDeleteResponse
// type ProjectStatisticsResponse = Api.Project.ProjectStatisticsResponse

/**
 * 项目状态管理
 * 管理项目列表、当前项目、加载状态、错误信息等
 */
export const useProjectStore = defineStore('projectStore', () => {
  // 项目列表
  const projects = ref<ProjectResponse[]>([])
  // 当前项目
  const currentProject = ref<ProjectResponse | null>(null)
  // 项目统计信息
  const statistics = ref<Record<string, number>>({})
  // 加载状态
  const loading = ref(false)
  // 错误信息
  const error = ref<string | null>(null)
  // 分页信息
  const pagination = ref({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 0
  })
  // 搜索和过滤条件
  const filters = ref({
    status: null as string | null,
    keywords: null as string | null,
    folder_id: null as number | null
  })

  // 计算属性：获取项目总数
  const totalProjects = computed(() => pagination.value.total_count)

  // 计算属性：获取当前页项目
  const currentPageProjects = computed(() => projects.value)

  // 计算属性：将API数据转换为UI需要的格式
  const projectsWithUiData = computed(() => {
    return projects.value.map((project: ProjectResponse) => {
      // 将current_component转换为currentStep
      let currentStep = 1
      switch (project.current_component) {
        case 'topic-selection':
        case 'requirement':
        case 'title':
          currentStep = 1
          break
        case 'outline':
          currentStep = 2
          break
        case 'content':
          currentStep = 3
          break
        default:
          currentStep = 1
      }

      return {
        ...project,
        // 临时生成描述，后续可以从API获取真实描述
        description: project.name,
        // 默认类型，API中没有这个字段
        type: 'article',
        currentStep,
        createTime: project.created_at,
        updateTime: project.updated_at
      }
    })
  })

  // 计算属性：是否有错误
  const hasError = computed(() => error.value !== null)

  // 计算属性：是否为空列表
  const isEmpty = computed(() => projects.value.length === 0 && !loading.value)

  // 计算属性：获取项目状态统计
  const statusStatistics = computed(() => {
    const stats: Record<string, number> = {}
    projects.value.forEach((project: ProjectResponse) => {
      stats[project.status] = (stats[project.status] || 0) + 1
    })
    return stats
  })

  /**
   * 设置加载状态
   * @param status 加载状态
   */
  const setLoading = (status: boolean) => {
    console.log('[Project Store] setLoading 被调用:', {
      currentLoading: loading.value,
      newStatus: status,
      timestamp: new Date().toISOString()
    })
    loading.value = status
    if (status) {
      error.value = null
    }
    console.log('[Project Store] setLoading 完成:', {
      loading: loading.value,
      error: error.value,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 设置错误信息
   * @param message 错误信息
   */
  const setError = (message: string | null) => {
    console.log('[Project Store] setError 被调用:', {
      currentError: error.value,
      newError: message,
      currentLoading: loading.value,
      timestamp: new Date().toISOString()
    })
    error.value = message
    loading.value = false
    console.log('[Project Store] setError 完成:', {
      error: error.value,
      loading: loading.value,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 清除错误信息
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 设置过滤条件
   * @param newFilters 新的过滤条件
   */
  const setFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  /**
   * 重置过滤条件
   */
  const resetFilters = () => {
    filters.value = {
      status: null,
      keywords: null,
      folder_id: null
    }
    pagination.value.page = 1
  }

  /**
   * 设置分页信息
   * @param page 页码
   * @param pageSize 每页数量
   */
  const setPagination = (page: number, pageSize?: number) => {
    pagination.value.page = page
    if (pageSize) {
      pagination.value.page_size = pageSize
    }
  }

  /**
   * 获取项目列表
   * @param refresh 是否强制刷新
   */
  const fetchProjects = async (refresh = false) => {
    console.log('[Project Store] fetchProjects 开始:', {
      loading: loading.value,
      refresh,
      pagination: pagination.value,
      filters: filters.value
    })

    // 添加强制重置逻辑，防止loading状态卡死
    if (loading.value && !refresh) {
      console.log('[Project Store] fetchProjects 检测到loading卡住，强制重置')
      setLoading(false)
      // 短暂延迟后继续，确保状态重置生效
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    try {
      setLoading(true)
      clearError()

      const params = {
        page: pagination.value.page,
        page_size: pagination.value.page_size,
        status: filters.value.status || undefined,
        keywords: filters.value.keywords || undefined,
        name: filters.value.keywords || undefined
      }

      console.log('[Project Store] fetchProjects 发起请求:', params)
      const response = await projectService.getProjects(params)
      console.log('[Project Store] fetchProjects 收到响应:', response)

      // 响应已经在服务层验证过，直接使用
      projects.value = response.projects || []
      pagination.value = {
        page: response.page || 1,
        page_size: response.page_size || 20,
        total_count: response.total_count || 0,
        total_pages: response.total_pages || 0
      }

      console.log('[Project Store] fetchProjects 更新状态:', {
        projectsCount: projects.value.length,
        pagination: pagination.value
      })
    } catch (err) {
      console.error('[Project Store] fetchProjects 发生错误:', err)
      setError(err instanceof Error ? err.message : '获取项目列表失败')
    } finally {
      console.log('[Project Store] fetchProjects 结束，设置loading为false')
      setLoading(false)
    }
  }

  /**
   * 创建项目
   * @param projectData 项目数据
   * @returns 创建的项目
   */
  const createProject = async (projectData: ProjectCreate): Promise<ProjectResponse | null> => {
    try {
      setLoading(true)
      clearError()

      const response = await projectService.createProject(projectData)

      // 响应已经在服务层验证过，直接使用
      // 如果在第一页，直接添加到列表开头
      if (pagination.value.page === 1) {
        projects.value.unshift(response.project)
      }
      // 更新总数
      pagination.value.total_count += 1

      return response.project
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建项目失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * 获取项目详情
   * @param projectId 项目ID
   * @returns 项目详情
   */
  const fetchProjectDetail = async (projectId: number): Promise<ProjectResponse | null> => {
    try {
      setLoading(true)
      clearError()

      const response = await projectService.getProjectDetail(projectId)

      // 响应已经在服务层验证过，直接使用
      currentProject.value = response.project

      // 更新列表中的项目（如果存在）
      const index = projects.value.findIndex((p: ProjectResponse) => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = response.project
      }

      return response.project
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取项目详情失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * 更新项目
   * @param projectId 项目ID
   * @param projectData 更新数据
   * @returns 更新后的项目
   */
  const updateProject = async (
    projectId: number,
    projectData: ProjectUpdate
  ): Promise<ProjectResponse | null> => {
    try {
      setLoading(true)
      clearError()

      const response = await projectService.updateProject(projectId, projectData)

      // 响应已经在服务层验证过，直接使用
      // 更新当前项目
      if (currentProject.value?.id === projectId) {
        currentProject.value = response.project
      }

      // 更新列表中的项目
      const index = projects.value.findIndex((p: ProjectResponse) => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = response.project
      }

      return response.project
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新项目失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * 删除项目
   * @param projectIds 项目ID列表
   * @returns 是否删除成功
   */
  const deleteProjects = async (projectIds: number[]): Promise<boolean> => {
    try {
      setLoading(true)
      clearError()

      const response = await projectService.batchDeleteProjects(projectIds)

      // 响应已经在服务层验证过，直接使用
      // 从列表中移除已删除的项目
      projects.value = projects.value.filter((p: ProjectResponse) => !projectIds.includes(p.id))

      // 如果当前项目被删除，清空当前项目
      if (currentProject.value && projectIds.includes(currentProject.value.id)) {
        currentProject.value = null
      }

      // 更新总数
      pagination.value.total_count -= response.deleted_count || 0

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除项目失败')
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * 更新项目状态
   * @param projectId 项目ID
   * @param status 新状态
   * @returns 是否更新成功
   */
  const updateProjectStatus = async (projectId: number, status: string): Promise<boolean> => {
    try {
      setLoading(true)
      clearError()

      const response = await projectService.updateProjectStatus(projectId, { status })

      // 响应已经在服务层验证过，直接使用
      // 更新当前项目
      if (currentProject.value?.id === projectId) {
        currentProject.value = response.project
      }

      // 更新列表中的项目
      const index = projects.value.findIndex((p: ProjectResponse) => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = response.project
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新项目状态失败')
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * 更新项目当前组件
   * @param projectId 项目ID
   * @param component 当前组件
   * @returns 是否更新成功
   */
  const updateProjectComponent = async (projectId: number, component: string): Promise<boolean> => {
    try {
      setLoading(true)
      clearError()

      const response = await projectService.updateProjectComponent(projectId, {
        current_component: component
      })

      // 响应已经在服务层验证过，直接使用
      // 更新当前项目
      if (currentProject.value?.id === projectId) {
        currentProject.value = response.project
      }

      // 更新列表中的项目
      const index = projects.value.findIndex((p: ProjectResponse) => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = response.project
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新项目组件失败')
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * 获取项目统计信息
   * @param refresh 是否强制刷新
   */
  const fetchStatistics = async () => {
    try {
      setLoading(true)
      clearError()

      const response = await projectService.getProjectStatistics()

      // 响应已经在服务层验证过，直接使用
      statistics.value = response.data || {}
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取项目统计信息失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 搜索项目
   * @param keywords 关键词
   * @param filters 过滤条件
   */
  const searchProjects = async (
    keywords: string,
    filters?: { status?: string; folder_id?: number }
  ) => {
    try {
      setLoading(true)
      clearError()

      const response = await projectService.searchProjects({
        keywords,
        ...filters,
        page: pagination.value.page,
        page_size: pagination.value.page_size
      })

      // 响应已经在服务层验证过，直接使用
      projects.value = response.projects || []
      pagination.value = {
        page: response.page || 1,
        page_size: response.page_size || 20,
        total_count: response.total_count || 0,
        total_pages: response.total_pages || 0
      }

      // 更新过滤条件
      setFilters({
        keywords,
        ...filters
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索项目失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 复制项目
   * @param projectId 项目ID
   * @param newName 新项目名称
   * @returns 复制的新项目
   */
  const duplicateProject = async (
    projectId: number,
    newName: string
  ): Promise<ProjectResponse | null> => {
    try {
      setLoading(true)
      clearError()

      const response = await projectService.duplicateProject(projectId, newName)

      // 响应已经在服务层验证过，直接使用
      // 如果在第一页，直接添加到列表开头
      if (pagination.value.page === 1) {
        projects.value.unshift(response.project)
      }
      // 更新总数
      pagination.value.total_count += 1

      return response.project
    } catch (err) {
      setError(err instanceof Error ? err.message : '复制项目失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * 设置当前项目
   * @param project 项目对象
   */
  const setCurrentProject = (project: ProjectResponse | null) => {
    // 添加调试日志验证类型不匹配问题
    console.log('[DEBUG] ProjectStore.setCurrentProject 输入:', {
      project,
      projectType: typeof project,
      projectKeys: project ? Object.keys(project) : null,
      statusType: project ? typeof project.status : null,
      statusValue: project ? project.status : null
    })

    currentProject.value = project
  }

  /**
   * 清空项目列表
   */
  const clearProjects = () => {
    projects.value = []
    currentProject.value = null
    statistics.value = {}
    error.value = null
    pagination.value = {
      page: 1,
      page_size: 20,
      total_count: 0,
      total_pages: 0
    }
  }

  /**
   * 初始化项目状态
   * 在应用启动时调用
   */
  const initializeProjects = async () => {
    // 重置状态
    clearProjects()
    resetFilters()

    // 获取项目列表
    await fetchProjects()

    // 获取统计信息
    await fetchStatistics()
  }

  return {
    // 状态
    projects,
    currentProject,
    statistics,
    loading,
    error,
    pagination,
    filters,

    // 计算属性
    totalProjects,
    currentPageProjects,
    projectsWithUiData,
    hasError,
    isEmpty,
    statusStatistics,

    // 方法
    setLoading,
    setError,
    clearError,
    setFilters,
    resetFilters,
    setPagination,
    fetchProjects,
    createProject,
    fetchProjectDetail,
    updateProject,
    deleteProjects,
    updateProjectStatus,
    updateProjectComponent,
    fetchStatistics,
    searchProjects,
    duplicateProject,
    setCurrentProject,
    clearProjects,
    initializeProjects
  }
})
