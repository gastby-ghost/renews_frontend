<template>
  <div class="optimized-topic-selection">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2>选题策划（优化版）</h2>
          <el-tag v-if="syncState.isSyncing" type="primary">正在同步...</el-tag>
        </div>
      </template>

      <!-- 需求定义阶段 -->
      <div v-if="documentState.currentStep === 'requirements'" class="requirements-section">
        <el-form
          ref="formRef"
          :model="requirementsState.form"
          label-width="120px"
          class="demo-form"
        >
          <el-form-item label="文档主题" prop="topic" required>
            <el-input
              v-model="requirementsState.form.topic"
              placeholder="请输入文档主题或标题"
              clearable
            />
          </el-form-item>

          <el-form-item label="关键要点">
            <div class="key-points-container">
              <div class="key-points-list">
                <el-tag
                  v-for="(point, index) in requirementsState.form.keyPoints"
                  :key="index"
                  closable
                  @close="removeKeyPoint(index)"
                >
                  {{ point }}
                </el-tag>
              </div>
              <el-input
                v-model="requirementsState.currentKeyPoint"
                placeholder="输入关键要点后按回车添加"
                @keyup.enter="addKeyPoint"
                clearable
              />
            </div>
          </el-form-item>

          <el-form-item label="特殊要求">
            <el-input
              v-model="requirementsState.form.specialRequirements"
              type="textarea"
              :rows="3"
              placeholder="请输入特殊要求（可选）"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="requirementsState.isGeneratingBriefing"
              :disabled="!canGenerateBriefing"
              @click="generateAIBriefing(formRef)"
            >
              生成AI简报
            </el-button>
            <el-button v-if="documentState.researchBrief" type="success" @click="editBriefing">
              编辑简报
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 研究简报展示 -->
        <div v-if="documentState.researchBrief" class="briefing-section">
          <h3>研究简报</h3>
          <el-input
            v-model="documentState.researchBrief"
            type="textarea"
            :rows="10"
            readonly
            class="briefing-content"
          />
        </div>

        <!-- 任务进度显示 -->
        <div v-if="hasScopeTask" class="task-progress">
          <h3>任务进度</h3>
          <el-progress
            :percentage="getTaskProgress"
            :status="getTaskStatusClass"
            :text-inside="true"
            :stroke-width="20"
          />
          <p class="task-status-text">{{ getTaskStatusText }}</p>

          <!-- 任务操作按钮 -->
          <div class="task-actions">
            <el-button
              v-if="scopeTaskStatus === 'failed'"
              type="warning"
              @click="retryFailedTask('scope')"
            >
              重试任务
            </el-button>
            <el-button
              v-if="scopeTaskStatus === 'pending' || scopeTaskStatus === 'running'"
              type="danger"
              @click="cancelScopeTask"
            >
              取消任务
            </el-button>
          </div>
        </div>
      </div>

      <!-- 标题选择阶段 -->
      <div v-if="documentState.currentStep === 'title'" class="title-section">
        <div class="title-actions">
          <el-button
            type="primary"
            :loading="requirementsState.isExecutingScope"
            :disabled="!canGenerateSearch2Title"
            @click="executeSearch2Title(currentProject.id)"
          >
            执行Search2Title
          </el-button>
        </div>

        <!-- 标题候选列表 -->
        <div v-if="hasGeneratedTitles" class="titles-list">
          <h3>生成的标题候选</h3>
          <div class="titles-grid">
            <el-card
              v-for="(title, index) in documentState.generatedTitles"
              :key="index"
              class="title-card"
              :class="{ selected: documentState.selectedTitle?.title === title.title }"
              @click="selectTitle(title)"
            >
              <h4>{{ title.title }}</h4>
              <p><strong>角度：</strong>{{ title.angle }}</p>
              <p><strong>时效性：</strong>{{ title.why_now }}</p>
            </el-card>
          </div>
        </div>

        <!-- Search2Title任务进度 -->
        <div v-if="documentState.search2titleTask" class="task-progress">
          <h3>Search2Title任务进度</h3>
          <el-progress
            :percentage="documentState.search2titleTask.progress || 0"
            :status="documentState.search2titleTask.status === 'failed' ? 'exception' : undefined"
            :text-inside="true"
            :stroke-width="20"
          />
          <p class="task-status-text">{{ documentState.search2titleTask.status }}</p>

          <div class="task-actions">
            <el-button
              v-if="documentState.search2titleTask.status === 'failed'"
              type="warning"
              @click="retryFailedTask('search2title')"
            >
              重试任务
            </el-button>
            <el-button
              v-if="
                documentState.search2titleTask.status === 'pending' ||
                documentState.search2titleTask.status === 'running'
              "
              type="danger"
              @click="cancelSearch2Title(currentProject.id)"
            >
              取消任务
            </el-button>
          </div>
        </div>
      </div>

      <!-- 步骤导航 -->
      <div class="step-navigation">
        <el-button @click="goToPreviousStep">上一步</el-button>
        <el-button type="primary" :disabled="!canProceedToNextStep" @click="proceedToNextStep">
          下一步
        </el-button>
      </div>

      <!-- 调试信息 -->
      <div v-if="isDebugMode" class="debug-info">
        <h3>调试信息</h3>
        <pre>{{
          JSON.stringify(
            {
              scopeTask: documentState.scopeTask,
              search2titleTask: documentState.search2titleTask,
              syncState: syncState
            },
            null,
            2
          )
        }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useTopicSelection } from '@/composables/document/useTopicSelection'
  import { useProjectStore } from '@/store/modules/project'
  import { databaseSyncService } from '@/services/databaseSyncService'
  import type { FormInstance } from 'element-plus'

  // 使用优化的组合式函数
  const {
    requirementsState,
    documentState,
    canGenerateBriefing,
    canGenerateSearch2Title,
    hasScopeTask,
    scopeTaskStatus,
    hasGeneratedTitles,
    canProceedToNextStep,
    getTaskProgress,
    getTaskStatusText,
    addKeyPoint,
    removeKeyPoint,
    generateAIBriefing,
    editBriefing,
    selectTitle,
    executeSearch2Title,
    cancelSearch2Title,
    cancelScopeTask,
    proceedToNextStep,
    goToPreviousStep,
    retryFailedTask
  } = useTopicSelection()

  const projectStore = useProjectStore()
  const currentProject = computed(() => projectStore.currentProject)
  const formRef = ref<FormInstance>()

  // 获取数据库同步状态
  const syncState = databaseSyncService.getSyncState()

  // 调试模式
  const isDebugMode = ref(process.env.NODE_ENV === 'development')

  // 任务状态样式类
  const getTaskStatusClass = computed(() => {
    const status = scopeTaskStatus.value
    if (status === 'failed') return 'exception'
    if (status === 'completed') return 'success'
    return undefined
  })
</script>

<style scoped>
  .optimized-topic-selection {
    padding: 20px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-header h2 {
    margin: 0;
    font-size: 20px;
  }

  .requirements-section,
  .title-section {
    margin-bottom: 30px;
  }

  .briefing-section {
    padding: 15px;
    margin-top: 20px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }

  .briefing-section h3 {
    margin-top: 0;
  }

  .briefing-content {
    margin-top: 10px;
  }

  .key-points-container {
    width: 100%;
  }

  .key-points-list {
    margin-bottom: 10px;
  }

  .key-points-list .el-tag {
    margin-right: 5px;
    margin-bottom: 5px;
  }

  .task-progress {
    padding: 15px;
    margin-top: 20px;
    background-color: #f0f9ff;
    border-radius: 4px;
  }

  .task-progress h3 {
    margin-top: 0;
  }

  .task-status-text {
    margin-top: 10px;
    font-size: 14px;
    color: #606266;
  }

  .task-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }

  .titles-list {
    margin-top: 20px;
  }

  .titles-list h3 {
    margin-top: 0;
  }

  .titles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 15px;
    margin-top: 15px;
  }

  .title-card {
    cursor: pointer;
    transition: all 0.3s;
  }

  .title-card:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    transform: translateY(-2px);
  }

  .title-card.selected {
    background-color: #ecf5ff;
    border: 2px solid #409eff;
  }

  .title-card h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #303133;
  }

  .title-card p {
    margin: 5px 0;
    font-size: 14px;
    color: #606266;
  }

  .step-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
  }

  .debug-info {
    padding: 15px;
    margin-top: 30px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }

  .debug-info h3 {
    margin-top: 0;
  }

  .debug-info pre {
    padding: 10px;
    overflow-x: auto;
    background-color: #fff;
    border-radius: 4px;
  }
</style>
