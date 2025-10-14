<template>
  <div class="project-list-container">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">AI创作项目列表</h1>
          <p class="page-subtitle">管理和创建您的AI文档创作项目</p>
        </div>
        <div class="header-right">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索项目名称"
            style="width: 250px; margin-right: 12px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <i class="iconfont-sys">&#xe710;</i>
            </template>
          </el-input>
          <el-button type="primary" @click="dialogVisible = true">
            <i class="iconfont-sys" style="margin-right: 4px">&#xe6e0;</i>
            创建项目
          </el-button>
        </div>
      </div>
    </div>

    <div class="project-grid">
      <div
        v-for="project in filteredProjectList"
        :key="project.id"
        class="project-card"
        @click="goToProject(project)"
      >
        <div class="project-header">
          <h3 class="project-name">{{ project.name }}</h3>
          <el-tag :type="getStatusType(project.status)" size="small">
            {{ getStatusText(project.status) }}
          </el-tag>
        </div>

        <div class="project-info">
          <p class="project-description">{{ project.description }}</p>
          <div class="project-meta">
            <span class="create-time">创建于: {{ formatDate(project.createTime) }}</span>
            <span class="update-time">更新于: {{ formatDate(project.updateTime) }}</span>
          </div>
        </div>

        <div class="project-progress">
          <div class="progress-steps">
            <div
              v-for="step in projectSteps"
              :key="step.key"
              class="step-item"
              :class="{
                active: project.currentStep >= step.key,
                completed: project.currentStep > step.key
              }"
            >
              <div class="step-icon">
                <i :class="step.icon"></i>
              </div>
              <div class="step-label">{{ step.label }}</div>
            </div>
          </div>
        </div>

        <div class="project-actions">
          <el-button type="primary" size="small" @click.stop="continueProject(project)">
            {{ getActionText(project.status) }}
          </el-button>
          <el-button size="small" @click.stop="editProject(project)"> 编辑 </el-button>
          <el-button size="small" type="danger" @click.stop="deleteProject(project)">
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑项目对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditMode ? '编辑项目' : '创建新项目'" 
      width="600px"
      @close="resetForm"
    >
      <el-form ref="projectFormRef" :model="projectForm" :rules="projectRules" label-width="100px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="projectForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>
        <el-form-item label="项目类型" prop="type">
          <el-select v-model="projectForm.type" placeholder="请选择项目类型" style="width: 100%">
            <el-option label="文章创作" value="article" />
            <el-option label="报告生成" value="report" />
            <el-option label="营销文案" value="marketing" />
            <el-option label="技术文档" value="technical" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="isEditMode ? updateProject() : createProject()">
            {{ isEditMode ? '保存' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

  interface Project {
    id: string
    name: string
    description: string
    type: string
    status: 'draft' | 'in_progress' | 'completed'
    currentStep: number
    createTime: string
    updateTime: string
    requirements?: any
    titles?: any[]
    outline?: any
    content?: any
  }

  const router = useRouter()
  const dialogVisible = ref(false)
  const isEditMode = ref(false)
  const editingProjectId = ref<string>('')
  const projectFormRef = ref<FormInstance>()

  const projectForm = reactive({
    name: '',
    description: '',
    type: 'article'
  })

  const projectRules: FormRules = {
    name: [
      { required: true, message: '请输入项目名称', trigger: 'blur' },
      { min: 2, max: 50, message: '项目名称长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    description: [
      { required: true, message: '请输入项目描述', trigger: 'blur' },
      { min: 10, max: 500, message: '项目描述长度在 10 到 500 个字符', trigger: 'blur' }
    ],
    type: [{ required: true, message: '请选择项目类型', trigger: 'change' }]
  }

  const projectSteps = [
    { key: 1, label: '需求', icon: 'el-icon-edit' },
    { key: 2, label: '标题', icon: 'el-icon-document' },
    { key: 3, label: '大纲', icon: 'el-icon-tickets' },
    { key: 4, label: '正文', icon: 'el-icon-notebook' }
  ]

  const projectList = ref<Project[]>([])
  const searchKeyword = ref('')
  const filteredProjectList = ref<Project[]>([])

  // Mock data
  const mockProjects: Project[] = [
    {
      id: '1',
      name: '人工智能发展趋势分析报告',
      description:
        '分析2024年人工智能技术的最新发展趋势，包括机器学习、深度学习、自然语言处理等领域的技术突破和应用场景。',
      type: 'report',
      status: 'in_progress',
      currentStep: 2,
      createTime: '2024-01-15T10:30:00Z',
      updateTime: '2024-01-16T14:20:00Z',
      requirements: {
        topic: '人工智能发展趋势分析',
        targetAudience: '企业决策者和技术管理者',
        wordCount: 5000,
        tone: 'professional',
        keyPoints: ['技术突破', '应用场景', '市场前景', '挑战分析']
      },
      titles: [
        { id: 1, text: '2024年人工智能技术发展全景分析报告', selected: true },
        { id: 2, text: 'AI技术革新：从实验室到商业化的跨越', selected: false }
      ]
    },
    {
      id: '2',
      name: '新能源汽车营销策略文案',
      description: '为新能源汽车品牌创作营销推广文案，突出环保理念、科技感和用户体验。',
      type: 'marketing',
      status: 'draft',
      currentStep: 1,
      createTime: '2024-01-14T09:15:00Z',
      updateTime: '2024-01-14T09:15:00Z'
    },
    {
      id: '3',
      name: 'Vue3组件开发最佳实践',
      description:
        '介绍Vue3组件开发的最佳实践，包括Composition API使用、性能优化、代码组织等方面。',
      type: 'technical',
      status: 'completed',
      currentStep: 4,
      createTime: '2024-01-10T16:45:00Z',
      updateTime: '2024-01-12T11:30:00Z'
    }
  ]

  const handleSearch = () => {
    const keyword = searchKeyword.value.toLowerCase().trim()
    if (!keyword) {
      filteredProjectList.value = [...projectList.value]
    } else {
      filteredProjectList.value = projectList.value.filter(
        (project) =>
          project.name.toLowerCase().includes(keyword) ||
          project.description.toLowerCase().includes(keyword)
      )
    }
  }

  // 从localStorage加载项目列表
  const loadProjectsFromStorage = () => {
    const stored = localStorage.getItem('project_list')
    if (stored) {
      try {
        projectList.value = JSON.parse(stored)
      } catch (error) {
        console.error('Failed to parse project list:', error)
        projectList.value = [...mockProjects]
      }
    } else {
      projectList.value = [...mockProjects]
    }
    filteredProjectList.value = [...projectList.value]
  }

  // 保存项目列表到localStorage
  const saveProjectsToStorage = () => {
    localStorage.setItem('project_list', JSON.stringify(projectList.value))
  }

  // 同步项目数据到localStorage (在各个步骤页面调用)
  const syncProjectToList = (projectId: string) => {
    const project = projectList.value.find(p => p.id === projectId)
    if (!project) return

    // 从各个步骤的localStorage读取最新数据
    const requirementsData = localStorage.getItem(`project_${projectId}_requirements`)
    const titlesData = localStorage.getItem(`project_${projectId}_titles`)
    const outlineData = localStorage.getItem(`project_${projectId}_outline`)
    const contentData = localStorage.getItem(`project_${projectId}_content`)

    // 更新项目进度
    let currentStep = 1
    if (contentData) {
      currentStep = 4
      project.status = 'completed'
    } else if (outlineData) {
      currentStep = 3
      project.status = 'in_progress'
    } else if (titlesData) {
      currentStep = 2
      project.status = 'in_progress'
    } else if (requirementsData) {
      currentStep = 1
      project.status = 'in_progress'
    }

    project.currentStep = currentStep
    project.updateTime = new Date().toISOString()

    saveProjectsToStorage()
  }

  onMounted(() => {
    loadProjectsFromStorage()
    
    // 监听storage变化，实时更新项目列表
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('project_')) {
        loadProjectsFromStorage()
      }
    })
  })

  const getStatusType = (status: string) => {
    switch (status) {
      case 'draft':
        return 'info'
      case 'in_progress':
        return 'warning'
      case 'completed':
        return 'success'
      default:
        return 'info'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '草稿'
      case 'in_progress':
        return '进行中'
      case 'completed':
        return '已完成'
      default:
        return '未知'
    }
  }

  const getActionText = (status: string) => {
    switch (status) {
      case 'draft':
        return '开始创作'
      case 'in_progress':
        return '继续创作'
      case 'completed':
        return '查看详情'
      default:
        return '开始创作'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const goToProject = (_project: Project) => {
    continueProject(_project)
  }

  const continueProject = (project: Project) => {
    const nextStep = project.currentStep
    switch (nextStep) {
      case 1:
        router.push(`/document-generation/requirements/${project.id}`)
        break
      case 2:
        router.push(`/document-generation/title/${project.id}`)
        break
      case 3:
        router.push(`/document-generation/outline/${project.id}`)
        break
      case 4:
        router.push(`/document-generation/content/${project.id}`)
        break
      default:
        router.push(`/document-generation/requirements/${project.id}`)
    }
  }

  const editProject = (project: Project) => {
    isEditMode.value = true
    editingProjectId.value = project.id
    projectForm.name = project.name
    projectForm.description = project.description
    projectForm.type = project.type
    dialogVisible.value = true
  }

  const updateProject = async () => {
    if (!projectFormRef.value) return

    try {
      await projectFormRef.value.validate()

      const project = projectList.value.find((p) => p.id === editingProjectId.value)
      if (project) {
        project.name = projectForm.name
        project.description = projectForm.description
        project.type = projectForm.type
        project.updateTime = new Date().toISOString()

        // 保存到localStorage
        saveProjectsToStorage()

        // 同步更新到项目详情的localStorage
        const projectData = localStorage.getItem(`project_${project.id}`)
        if (projectData) {
          const data = JSON.parse(projectData)
          data.name = project.name
          data.description = project.description
          data.type = project.type
          data.updateTime = project.updateTime
          localStorage.setItem(`project_${project.id}`, JSON.stringify(data))
        }

        // 触发storage事件，通知其他页面更新
        window.dispatchEvent(new StorageEvent('storage', {
          key: `project_${project.id}`,
          newValue: JSON.stringify(project)
        }))

        ElMessage.success('项目更新成功')
      }

      dialogVisible.value = false
      resetForm()
      handleSearch() // 重新过滤列表
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  const deleteProject = async (project: Project) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除项目 "${project.name}" 吗？此操作不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      // Remove from list
      const index = projectList.value.findIndex((p) => p.id === project.id)
      if (index > -1) {
        projectList.value.splice(index, 1)
        
        // 保存到localStorage
        saveProjectsToStorage()

        // 删除项目相关的所有localStorage数据
        localStorage.removeItem(`project_${project.id}`)
        localStorage.removeItem(`project_${project.id}_requirements`)
        localStorage.removeItem(`project_${project.id}_titles`)
        localStorage.removeItem(`project_${project.id}_outline`)
        localStorage.removeItem(`project_${project.id}_content`)
        localStorage.removeItem(`project_${project.id}_content_saved`)
        
        // 重新过滤列表
        handleSearch()

        ElMessage.success('项目删除成功')
      }
    } catch {
      // User cancelled
    }
  }

  const createProject = async () => {
    if (!projectFormRef.value) return

    try {
      await projectFormRef.value.validate()

      const newProject: Project = {
        id: Date.now().toString(),
        name: projectForm.name,
        description: projectForm.description,
        type: projectForm.type,
        status: 'draft',
        currentStep: 1,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }

      projectList.value.unshift(newProject)
      
      // 保存到localStorage
      saveProjectsToStorage()
      
      // 创建项目基础数据
      localStorage.setItem(`project_${newProject.id}`, JSON.stringify(newProject))

      dialogVisible.value = false
      resetForm()

      ElMessage.success('项目创建成功')

      // Navigate to requirements page
      router.push(`/document-generation/requirements/${newProject.id}`)
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  const resetForm = () => {
    isEditMode.value = false
    editingProjectId.value = ''
    projectForm.name = ''
    projectForm.description = ''
    projectForm.type = 'article'
    projectFormRef.value?.resetFields()
  }
</script>

<style scoped lang="scss">
  .project-list-container {
    padding: 20px;
  }

  .project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .project-card {
    padding: 20px;
    cursor: pointer;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
      transform: translateY(-2px);
    }
  }

  .project-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .project-name {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .project-info {
    margin-bottom: 16px;
  }

  .project-description {
    display: -webkit-box;
    display: box;
    margin-bottom: 12px;
    overflow: hidden;
    font-size: 14px;
    line-height: 1.5;
    color: var(--el-text-color-regular);
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .project-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .project-progress {
    margin-bottom: 16px;
  }

  .progress-steps {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .step-item {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;

    &:not(:last-child)::after {
      position: absolute;
      top: 15px;
      left: 50%;
      z-index: 1;
      width: 100%;
      height: 2px;
      content: '';
      background: var(--el-border-color);
    }

    &.active:not(:last-child)::after,
    &.completed:not(:last-child)::after {
      background: var(--el-color-primary);
    }
  }

  .step-icon {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    margin-bottom: 8px;
    background: var(--el-border-color);
    border-radius: 50%;

    i {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }

    .step-item.active &,
    .step-item.completed & {
      background: var(--el-color-primary);

      i {
        color: white;
      }
    }
  }

  .step-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;

    .step-item.active & {
      font-weight: 500;
      color: var(--el-color-primary);
    }
  }

  .project-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  @media (width <= 768px) {
    .project-grid {
      grid-template-columns: 1fr;
    }

    .project-meta {
      flex-direction: column;
      gap: 4px;
    }

    .project-actions {
      flex-wrap: wrap;
    }
  }

  .page-header {
    padding: 20px 0;
    margin-bottom: 20px;
    background: var(--el-bg-color);
    border-radius: 8px;

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
    }

    .header-left {
      flex: 1;

      .page-title {
        margin: 0 0 8px;
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .page-subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    .header-right {
      display: flex;
      align-items: center;
    }
  }

  @media (width <= 768px) {
    .page-header {
      .header-content {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }

      .header-right {
        width: 100%;

        .el-input {
          flex: 1;
          margin-right: 8px !important;
        }
      }
    }
  }
</style>
