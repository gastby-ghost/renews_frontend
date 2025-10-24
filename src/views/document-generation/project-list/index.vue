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

    <!-- 加载状态 -->
    <div v-if="projectStore.loading" class="loading-container" v-loading="true">
      <p>正在加载项目列表...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="projectStore.hasError" class="error-container">
      <el-result icon="warning" title="加载失败" :sub-title="projectStore.error">
        <template #extra>
          <el-button type="primary" @click="projectStore.fetchProjects()"> 重新加载 </el-button>
        </template>
      </el-result>
    </div>

    <!-- 空状态 -->
    <div v-else-if="projectStore.isEmpty" class="empty-container">
      <el-result
        icon="info"
        title="暂无项目"
        sub-title="您还没有创建任何项目，点击上方按钮创建第一个项目吧"
      >
        <template #extra>
          <el-button type="primary" @click="dialogVisible = true"> 创建项目 </el-button>
        </template>
      </el-result>
    </div>

    <!-- 项目列表 -->
    <div v-else class="project-grid">
      <div
        v-for="project in filteredProjectList"
        :key="project.id"
        class="project-card"
        @click="continueProject(project)"
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
          <el-button size="small" @click.stop="editProject()"> 编辑 </el-button>
          <el-button size="small" type="danger" @click.stop="deleteProject(project)">
            删除
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="创建新项目" width="600px">
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
          <el-select v-model="projectForm.type" placeholder="请选择项目类型">
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
          <el-button type="primary" @click="createProject">创建</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useProjectStore } from '@/store/modules/project'
  import type { Api } from '@/typings/api'
  import { debounce } from 'lodash-es'

  // 从Api.Project命名空间导入类型
  type ProjectCreate = Api.Project.ProjectCreate

  // 项目表单接口
  interface ProjectForm {
    name: string
    description: string
    type: string
  }

  const router = useRouter()
  const projectStore = useProjectStore()
  const dialogVisible = ref(false)
  const projectFormRef = ref<FormInstance>()

  const projectForm = reactive<ProjectForm>({
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

  const searchKeyword = ref('')

  // 计算属性：使用store中的数据转换逻辑
  const projectList = computed(() => {
    return projectStore.projectsWithUiData
  })

  // 计算属性：直接使用项目列表，移除本地过滤逻辑
  const filteredProjectList = computed(() => {
    return projectList.value
  })

  // 防抖搜索函数
  const debouncedSearch = debounce(() => {
    // 统一使用store的搜索功能，移除本地过滤
    if (searchKeyword.value.trim()) {
      projectStore.searchProjects(searchKeyword.value.trim())
    } else {
      projectStore.fetchProjects()
    }
  }, 300)

  const handleSearch = () => {
    debouncedSearch()
  }

  // 初始化加载项目列表
  onMounted(async () => {
    try {
      await projectStore.fetchProjects()
    } catch (error) {
      console.error('加载项目列表失败:', error)
      ElMessage.error('加载项目列表失败')
    }
  })

  const getStatusType = (status: string): 'info' | 'warning' | 'success' => {
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

  const getStatusText = (status: string): string => {
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

  const getActionText = (status: string): string => {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const continueProject = (project: any) => {
    // 直接导航到当前组件对应的页面
    const component = project.current_component
    switch (component) {
      case 'requirements':
        router.push(`/document-generation/requirements/${project.id}`)
        break
      case 'title':
        router.push(`/document-generation/title/${project.id}`)
        break
      case 'outline':
        router.push(`/document-generation/outline/${project.id}`)
        break
      case 'content':
        router.push(`/document-generation/content/${project.id}`)
        break
      default:
        router.push(`/document-generation/requirements/${project.id}`)
    }
  }

  const editProject = () => {
    // TODO: Implement project editing
    ElMessage.info('编辑功能开发中')
  }

  const deleteProject = async (project: any) => {
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

      // 使用store删除项目
      const success = await projectStore.deleteProjects([project.id])
      if (success) {
        ElMessage.success('项目删除成功')
      } else {
        ElMessage.error(projectStore.error || '项目删除失败')
      }
    } catch {
      // User cancelled
    }
  }

  const createProject = async () => {
    if (!projectFormRef.value) return

    try {
      await projectFormRef.value.validate()

      // 准备创建项目的数据 - 只发送API需要的字段
      const projectData: ProjectCreate = {
        name: projectForm.name,
        status: 'draft',
        current_component: 'requirements'
      }

      // 使用store创建项目
      const newProject = await projectStore.createProject(projectData)

      if (newProject) {
        dialogVisible.value = false

        // Reset form
        projectForm.name = ''
        projectForm.description = ''
        projectForm.type = 'article'

        ElMessage.success('项目创建成功')

        // Navigate to requirements page
        router.push(`/document-generation/requirements/${newProject.id}`)
      } else {
        ElMessage.error(projectStore.error || '项目创建失败')
      }
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }
</script>

<style scoped lang="scss">
  .project-list-container {
    padding: 20px;
  }

  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    margin-top: 20px;
  }

  .loading-container {
    p {
      margin-top: 16px;
      color: var(--el-text-color-secondary);
    }
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
