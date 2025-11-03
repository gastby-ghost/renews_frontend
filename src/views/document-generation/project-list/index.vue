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
      <el-result icon="warning" title="加载失败" :sub-title="projectStore.error || ''">
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
          <StepIndicator
            :steps="[
              { label: '选题', icon: 'el-icon-edit', status: getStepStatus(project, 1) },
              { label: '大纲', icon: 'el-icon-tickets', status: getStepStatus(project, 2) },
              { label: '正文', icon: 'el-icon-notebook', status: getStepStatus(project, 3) }
            ]"
            size="small"
          >
            <template #icon="{ step }">
              <i :class="step.icon"></i>
            </template>
          </StepIndicator>
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
      <el-form ref="projectFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>
        <el-form-item label="项目类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择项目类型">
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
  import { onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useProjectList } from '@/composables/useProjectList'
  import StepIndicator from '@/components/custom/StepIndicator.vue'

  // 使用项目列表组合式函数
  const {
    projectStore,
    searchKeyword,
    dialogVisible,
    formRef: projectFormRef,
    form,
    rules,
    filteredProjectList,
    handleSearch,
    createProject,
    continueProject,
    editProject,
    deleteProject,
    formatDate,
    getStatusType,
    getStatusText,
    getActionText,
    getStepStatus
  } = useProjectList()

  // 初始化加载项目列表
  onMounted(async () => {
    try {
      await projectStore.fetchProjects()
    } catch (err) {
      console.error('加载项目列表失败:', err)
      ElMessage.error('加载项目列表失败')
    }
  })
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
