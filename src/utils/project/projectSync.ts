/**
 * 项目数据同步工具
 * 用于在各个创作步骤中同步项目状态到项目列表
 */

/**
 * 同步项目状态到项目列表
 * @param projectId 项目ID
 */
export const syncProjectToList = (projectId: string) => {
  const projectListStr = localStorage.getItem('project_list')
  if (!projectListStr) return

  try {
    const projectList = JSON.parse(projectListStr)
    const project = projectList.find((p: any) => p.id === projectId)

    if (project) {
      // 检查各个步骤的数据
      const hasContent = localStorage.getItem(`project_${projectId}_content`)
      const hasOutline = localStorage.getItem(`project_${projectId}_outline`)
      const hasTitles = localStorage.getItem(`project_${projectId}_titles`)
      const hasRequirements = localStorage.getItem(`project_${projectId}_requirements`)

      // 更新项目进度和状态
      if (hasContent) {
        project.currentStep = 4
        project.status = 'completed'
      } else if (hasOutline) {
        project.currentStep = 3
        project.status = 'in_progress'
      } else if (hasTitles) {
        project.currentStep = 2
        project.status = 'in_progress'
      } else if (hasRequirements) {
        project.currentStep = 1
        project.status = 'in_progress'
      }

      project.updateTime = new Date().toISOString()

      // 保存更新后的项目列表
      localStorage.setItem('project_list', JSON.stringify(projectList))

      // 触发storage事件，通知项目列表页面实时更新
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'project_list',
          newValue: JSON.stringify(projectList)
        })
      )

      console.log(`✅ 项目 ${projectId} 状态已同步到列表`)
    }
  } catch (error) {
    console.error('同步项目状态失败:', error)
  }
}

/**
 * 获取项目信息
 * @param projectId 项目ID
 * @returns 项目信息或null
 */
export const getProjectFromList = (projectId: string) => {
  const projectListStr = localStorage.getItem('project_list')
  if (!projectListStr) return null

  try {
    const projectList = JSON.parse(projectListStr)
    return projectList.find((p: any) => p.id === projectId) || null
  } catch (error) {
    console.error('获取项目信息失败:', error)
    return null
  }
}

/**
 * 更新项目基本信息（名称、描述等）
 * @param projectId 项目ID
 * @param updates 要更新的字段
 */
export const updateProjectInfo = (projectId: string, updates: Record<string, any>) => {
  const projectListStr = localStorage.getItem('project_list')
  if (!projectListStr) return false

  try {
    const projectList = JSON.parse(projectListStr)
    const project = projectList.find((p: any) => p.id === projectId)

    if (project) {
      Object.assign(project, updates)
      project.updateTime = new Date().toISOString()

      localStorage.setItem('project_list', JSON.stringify(projectList))

      // 触发storage事件
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'project_list',
          newValue: JSON.stringify(projectList)
        })
      )

      return true
    }
    return false
  } catch (error) {
    console.error('更新项目信息失败:', error)
    return false
  }
}

