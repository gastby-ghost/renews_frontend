<template>
  <div class="requirements-container">
    <ArtTableHeader title="需求定义" :actions="headerActions" @back="goBack" />

    <div class="main-wrapper">
      <!-- 项目加载提示 -->
      <div v-if="!projectStore.currentProject && route.params.projectId" class="project-loading">
        <el-empty description="正在加载项目信息..." />
      </div>

      <div v-else class="main-content">
        <div class="step-indicator">
          <div class="step-item active">
            <div class="step-number">1</div>
            <div class="step-label">需求</div>
          </div>
          <div class="step-connector"></div>
          <div class="step-item" :class="{ active: documentState.currentStep !== 'requirements' }">
            <div class="step-number">2</div>
            <div class="step-label">标题</div>
          </div>
          <div class="step-connector"></div>
          <div
            class="step-item"
            :class="{
              active: ['outline', 'content', 'complete'].includes(documentState.currentStep)
            }"
          >
            <div class="step-number">3</div>
            <div class="step-label">大纲</div>
          </div>
          <div class="step-connector"></div>
          <div
            class="step-item"
            :class="{
              active: ['content', 'complete'].includes(documentState.currentStep)
            }"
          >
            <div class="step-number">4</div>
            <div class="step-label">正文</div>
          </div>
        </div>

        <div class="requirements-form">
          <el-form
            ref="requirementsFormRef"
            :model="state.form"
            :rules="rules"
            label-width="120px"
            size="large"
          >
            <el-form-item label="主题/标题" prop="topic">
              <el-input
                v-model="state.form.topic"
                placeholder="请输入文档的主题或标题"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="目标受众" prop="targetAudience">
              <el-select
                v-model="state.form.targetAudience"
                placeholder="请选择目标受众"
                style="width: 100%"
              >
                <el-option label="普通大众" value="general" />
                <el-option label="专业人士" value="professional" />
                <el-option label="企业决策者" value="executive" />
                <el-option label="技术人员" value="technical" />
                <el-option label="学术研究者" value="academic" />
                <el-option label="学生群体" value="student" />
              </el-select>
            </el-form-item>

            <el-form-item label="文档类型" prop="documentType">
              <el-select
                v-model="state.form.documentType"
                placeholder="请选择文档类型"
                style="width: 100%"
              >
                <el-option label="分析报告" value="analysis" />
                <el-option label="新闻稿" value="press_release" />
                <el-option label="博客文章" value="blog" />
                <el-option label="技术文档" value="technical_doc" />
                <el-option label="营销文案" value="marketing" />
                <el-option label="产品说明" value="product_description" />
              </el-select>
            </el-form-item>

            <el-form-item label="预期字数" prop="wordCount">
              <el-slider
                v-model="state.form.wordCount"
                :min="500"
                :max="10000"
                :step="100"
                show-input
                show-stops
              />
            </el-form-item>

            <el-form-item label="语气风格" prop="tone">
              <el-radio-group v-model="state.form.tone">
                <el-radio value="formal">正式</el-radio>
                <el-radio value="casual">轻松</el-radio>
                <el-radio value="professional">专业</el-radio>
                <el-radio value="friendly">友好</el-radio>
                <el-radio value="persuasive">说服性</el-radio>
                <el-radio value="objective">客观</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="关键要点" prop="keyPoints">
              <div class="key-points-input">
                <el-input
                  v-model="state.currentKeyPoint"
                  placeholder="输入关键要点后按回车添加"
                  @keyup.enter="addKeyPoint"
                />
                <el-button @click="addKeyPoint" :disabled="!state.currentKeyPoint.trim()">
                  添加
                </el-button>
              </div>
              <div class="key-points-list" v-if="state.form.keyPoints.length > 0">
                <el-tag
                  v-for="(point, index) in state.form.keyPoints"
                  :key="index"
                  closable
                  @close="removeKeyPoint(index)"
                  type="info"
                >
                  {{ point }}
                </el-tag>
              </div>
            </el-form-item>

            <el-form-item label="特殊要求" prop="specialRequirements">
              <el-input
                v-model="state.form.specialRequirements"
                type="textarea"
                :rows="4"
                placeholder="请输入任何特殊要求，如需要包含的特定信息、避免的词汇等"
              />
            </el-form-item>
          </el-form>

          <div class="form-actions">
            <el-button @click="goBack" size="large">返回</el-button>
            <el-button
              type="primary"
              size="large"
              @click="generateAIBriefing(requirementsFormRef)"
              :loading="state.isGeneratingBriefing || state.isExecutingScope"
              :disabled="!canGenerateBriefing || hasScopeTask"
            >
              <template v-if="hasScopeTask">
                {{ getTaskStatusText }} ({{ getTaskProgress }}%)
              </template>
              <template v-else>生成AI简报</template>
            </el-button>
            <el-button
              type="success"
              size="large"
              @click="handleConfirmRequirements"
              :disabled="!canConfirmRequirements"
            >
              确认需求
            </el-button>
          </div>
        </div>

        <!-- AI简报展示区域 -->
        <div class="ai-briefing-section" v-if="documentState.researchBrief">
          <div class="section-header">
            <h3>AI创作简报</h3>
            <el-button @click="editBriefing" size="small" type="primary" plain>编辑简报</el-button>
          </div>

          <div class="briefing-content markdown-body" v-html="renderedBriefing"></div>
        </div>

        <!-- Scope Agent 任务状态指示器 -->
        <div class="task-status-card" v-if="hasScopeTask">
          <el-card>
            <div class="task-status">
              <div class="status-icon">
                <el-icon v-if="scopeTaskStatus === 'completed'" color="#67C23A">
                  <Check />
                </el-icon>
                <el-icon v-else-if="scopeTaskStatus === 'failed'" color="#F56C6C">
                  <Close />
                </el-icon>
                <el-icon v-else color="#409EFF" class="is-loading">
                  <Loading />
                </el-icon>
              </div>
              <div class="status-content">
                <h4>AI简报生成任务</h4>
                <p>{{ getTaskStatusText }}</p>
                <el-progress
                  v-if="scopeTaskStatus && ['running', 'pending'].includes(scopeTaskStatus)"
                  :percentage="getTaskProgress"
                  :status="scopeTaskStatus === 'failed' ? 'exception' : undefined"
                />
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>

  <!-- 编辑简报对话框 -->
  <el-dialog
    v-model="state.briefingDialogVisible"
    title="编辑AI简报"
    width="900px"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeTab" class="briefing-edit-tabs">
      <el-tab-pane label="编辑模式" name="edit">
        <el-form label-width="80px">
          <el-form-item label="简报内容">
            <el-input
              v-model="state.editableBriefing"
              type="textarea"
              :rows="15"
              placeholder="请输入Markdown格式的简报内容"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="预览模式" name="preview">
        <div
          class="briefing-preview markdown-body"
          v-html="renderedEditableBriefing"
          style="max-height: 500px; padding: 20px; overflow-y: auto"
        ></div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="state.briefingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBriefing">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { marked } from 'marked'
  import { Check, Close, Loading } from '@element-plus/icons-vue'
  import type { FormInstance } from 'element-plus'
  import { useRequirements } from '@/composables/useRequirements'
  import { useProjectStore } from '@/store/modules/project'
  import '@/assets/styles/markdown.scss'

  const router = useRouter()
  const route = useRoute()
  const requirementsFormRef = ref<FormInstance>()
  const activeTab = ref('edit')
  const projectStore = useProjectStore()

  const {
    state,
    documentState,
    rules,
    canGenerateBriefing,
    canConfirmRequirements,
    hasScopeTask,
    scopeTaskStatus,
    getTaskProgress,
    getTaskStatusText,
    addKeyPoint,
    removeKeyPoint,
    generateAIBriefing,
    editBriefing,
    saveBriefing,
    confirmRequirements,
    loadRequirements,
    loadProject
  } = useRequirements()

  // 处理确认需求
  const handleConfirmRequirements = async () => {
    const success = await confirmRequirements()
    if (success) {
      const currentProject = projectStore.currentProject
      if (currentProject) {
        // 更新工作流步骤
        documentState.value.currentStep = 'title'

        // 导航到标题页面
        setTimeout(() => {
          router.push(`/document-generation/title/${currentProject.id}`)
        }, 1500)
      }
    }
  }

  // 头部操作按钮
  const headerActions = computed(() => [
    {
      label: '导出',
      type: 'primary' as const,
      icon: 'el-icon-download',
      handler: () => {
        ElMessage.info('导出功能开发中')
      }
    }
  ])

  // 渲染简报内容
  const renderedBriefing = computed(() => {
    if (!documentState.value.researchBrief) return ''
    return marked(documentState.value.researchBrief)
  })

  const renderedEditableBriefing = computed(() => {
    if (!state.briefingDialogVisible || !state.editableBriefing) return ''
    return marked(state.editableBriefing)
  })

  // 页面生命周期
  onMounted(async () => {
    // 更新当前步骤
    documentState.value.currentStep = 'requirements'

    // 加载项目信息
    const projectId = route.params.projectId as string
    if (projectId) {
      await loadProject(projectId)
    }

    // 加载已有需求数据
    loadRequirements()
  })

  // 返回上一页
  const goBack = () => {
    router.push('/document-generation/project-list')
  }
</script>

<style scoped lang="scss">
  .requirements-container {
    max-width: 1200px;
    padding: 20px;
    margin: 0 auto;
  }

  .main-wrapper {
    width: 100%;
  }

  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    margin-bottom: 40px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .step-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      margin-bottom: 8px;
      font-weight: bold;
      color: var(--el-text-color-secondary);
      background: var(--el-border-color);
      border-radius: 50%;
      transition: all 0.3s;
    }

    .step-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      transition: all 0.3s;
    }

    &.active {
      .step-number {
        color: white;
        background: var(--el-color-primary);
      }

      .step-label {
        font-weight: 500;
        color: var(--el-color-primary);
      }
    }
  }

  .step-connector {
    width: 60px;
    height: 2px;
    margin: 0 20px;
    margin-top: -20px;
    background: var(--el-border-color);
    transition: background 0.3s;
  }

  .requirements-form {
    padding: 30px;
    margin-bottom: 20px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .key-points-input {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .key-points-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .form-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 30px;
  }

  .ai-briefing-section {
    padding: 30px;
    margin-bottom: 20px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 8px;
  }

  .task-status-card {
    margin-top: 20px;

    .task-status {
      display: flex;
      gap: 20px;
      align-items: center;

      .status-icon {
        font-size: 32px;

        .is-loading {
          animation: rotating 2s linear infinite;
        }
      }

      .status-content {
        flex: 1;

        h4 {
          margin: 0 0 8px;
          font-size: 16px;
          color: var(--el-text-color-primary);
        }

        p {
          margin: 0 0 12px;
          color: var(--el-text-color-regular);
        }
      }
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }

  .briefing-content {
    ::v-deep(.markdown-body) {
      h1,
      h2,
      h3,
      h4 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
      }

      h1 {
        font-size: 1.5em;
        color: var(--el-color-primary);
      }

      p {
        margin-bottom: 1em;
        line-height: 1.7;
      }

      ul,
      ol {
        padding-left: 2em;
        margin-bottom: 1em;
      }

      li {
        margin-bottom: 0.5em;
        line-height: 1.6;
      }

      strong {
        font-weight: 600;
        color: var(--el-color-warning);
      }
    }
  }

  .briefing-edit-tabs {
    ::v-deep(.el-tabs__content) {
      padding: 20px;
    }
  }

  .briefing-preview {
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
  }

  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @media (width <= 768px) {
    .requirements-form {
      padding: 20px;
    }

    .step-indicator {
      padding: 15px;
    }

    .step-connector {
      width: 40px;
      margin: 0 10px;
    }

    .form-actions {
      flex-direction: column;
      align-items: center;
    }

    .key-points-input {
      flex-direction: column;
    }
  }
</style>

<style lang="scss">
  .el-slider__input {
    width: 100px;
  }
</style>
