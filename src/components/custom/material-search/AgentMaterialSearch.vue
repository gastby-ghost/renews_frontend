<template>
  <div class="agent-search">
    <!-- 搜索表单区域 -->
    <div class="agent-search__form">
      <el-card class="agent-search__card">
        <template #header>
          <div class="agent-search__header">
            <h3 class="agent-search__title">
              <el-icon><Search /></el-icon>
              Agent智能检索
            </h3>
            <div class="agent-search__header-actions">
              <el-button
                v-if="searchHistory.length > 0"
                size="small"
                @click="showHistory = !showHistory"
              >
                搜索历史
              </el-button>
              <el-button size="small" type="primary" @click="showAgentPanel = !showAgentPanel">
                Agent配置
              </el-button>
            </div>
          </div>
        </template>

        <!-- 搜索历史 -->
        <div v-if="showHistory && searchHistory.length > 0" class="agent-search__history">
          <div class="agent-search__history-header">
            <span>最近搜索</span>
            <el-button size="small" text @click="clearHistory">清空</el-button>
          </div>
          <div class="agent-search__history-list">
            <el-tag
              v-for="(item, index) in searchHistory.slice(0, 5)"
              :key="index"
              class="agent-search__history-item"
              @click="useHistoryItemAndSearch(item)"
            >
              {{ item.keywords }}
            </el-tag>
          </div>
        </div>

        <!-- 搜索表单 -->
        <el-form
          ref="searchFormRef"
          :model="searchForm"
          :rules="searchRules"
          label-width="100px"
          @submit.prevent="handleSearch"
        >
          <el-form-item label="研究简报" prop="brief">
            <el-input
              v-model="searchForm.brief"
              type="textarea"
              :rows="3"
              placeholder="请输入研究简报，描述您想要研究的主题、领域或具体问题"
              clearable
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item>
            <div class="agent-search__actions">
              <el-button type="primary" @click="handleSearch" :loading="searching">
                开始Agent检索
              </el-button>
              <el-button @click="resetForm">重置</el-button>
              <el-button @click="showAgentPanel = true" type="info"> 高级Agent配置 </el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- Agent配置面板 -->
    <div v-if="showAgentPanel" class="agent-search__agent-panel">
      <AgentPanel
        @update:config="updateAgentConfig"
        @search="handleAgentSearch"
        @close="showAgentPanel = false"
      />
    </div>

    <!-- 搜索进度 -->
    <div v-if="searching" class="agent-search__progress">
      <AgentSearchProgress
        :task-id="currentTaskId"
        :progress="searchProgress"
        @cancel="cancelSearch"
      />
    </div>

    <!-- 研究路径展示 -->
    <div v-if="researchPath.length > 0" class="agent-search__research-path">
      <el-card class="agent-search__card">
        <template #header>
          <div class="agent-search__research-path-header">
            <h3>
              <el-icon><Connection /></el-icon>
              研究路径
            </h3>
            <el-button size="small" @click="clearResearchPath"> 清空 </el-button>
          </div>
        </template>

        <div class="agent-search__research-path-content">
          <div v-for="(step, index) in researchPath" :key="index" class="research-step">
            <div class="research-step__index">
              {{ index + 1 }}
            </div>
            <div class="research-step__content">
              <MdPreview
                :model-value="step"
                :preview-theme="previewTheme"
                :code-theme="codeTheme"
                class="research-step__markdown"
              />
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索结果 -->
    <MaterialSearchResults
      :search-results="paginatedSearchResults"
      :selected-materials="selectedMaterials"
      :loading-materials="[]"
      :searching="searching"
      :has-searched="hasSearched"
      :pagination-state="paginationState"
      @select-all="materialStore.selectAll"
      @clear-selection="materialStore.clearSelection"
      @toggle-material-selection="materialStore.toggleMaterialSelection"
      @show-add-to-library-dialog="showAddToLibraryDialog"
      @go-to-library="goToLibrary"
      @show-material-preview="showMaterialPreview"
      @select-material="selectMaterial"
      @handle-size-change="handleSizeChange"
      @handle-current-change="handleCurrentChange"
      @reset-search="resetForm"
    />

    <!-- 添加到素材库对话框 -->
    <AddToLibraryDialog
      ref="addToLibraryDialogRef"
      v-model:visible="addToLibraryDialogVisible"
      :selected-materials="selectedMaterials"
      :materials="searchResults"
      :loading="addingToLibrary"
      @confirm="handleAddToLibraryConfirm"
      @close="closeAddToLibraryDialog"
    />

    <!-- 素材预览对话框 -->
    <MaterialPreviewDialog
      :visible="previewDialogVisible"
      :material="previewMaterial"
      context="search"
      @update:visible="previewDialogVisible = $event"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Search, Connection } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useMaterialStore } from '@/store/material'
  import type { Material, AgentSearchConfig } from '@/types/material'
  import MaterialPreviewDialog from '@/components/custom/material-card/MaterialPreviewDialog.vue'
  import AgentSearchProgress from './AgentSearchProgress.vue'
  import MaterialSearchResults from './common/MaterialSearchResults.vue'
  import AddToLibraryDialog from './common/AddToLibraryDialog.vue'
  import { useMaterialSearch } from '@/composables/material/useMaterialSearch'
  import { MdPreview } from 'md-editor-v3'
  import 'md-editor-v3/lib/preview.css'

  // Agent配置面板组件
  const AgentPanel = {
    template: `
      <div class="agent-panel">
        <div class="agent-panel__header">
          <h4>高级Agent配置</h4>
          <el-button size="small" @click="$emit('close')">关闭</el-button>
        </div>
        <div class="agent-panel__content">
          <el-form :model="config" label-width="120px">
            <el-form-item label="最大并发研究单元">
              <el-input-number
                v-model="config.agentConfig.maxConcurrentResearchUnits"
                :min="1"
                :max="10"
                :nullable="true"
                placeholder="默认使用系统配置"
              />
            </el-form-item>
            <el-form-item label="最大研究迭代次数">
              <el-input-number
                v-model="config.agentConfig.maxResearcherIterations"
                :min="1"
                :max="20"
                :nullable="true"
                placeholder="默认使用系统配置"
              />
            </el-form-item>
          </el-form>
          <div class="agent-panel__actions">
            <el-button type="primary" @click="handleSearch">开始Agent搜索</el-button>
            <el-button @click="$emit('close')">取消</el-button>
          </div>
        </div>
      </div>`
  }

  interface SearchForm {
    brief: string
  }

  interface AgentForm {
    agentType: 'search' | 'scope' | 'custom'
    agentConfig: {
      maxConcurrentResearchUnits?: number | null
      maxResearcherIterations?: number | null
      [key: string]: any
    }
  }

  // 使用公共搜索逻辑
  const {
    searching,
    hasSearched,
    showHistory,
    searchResults,
    paginatedSearchResults,
    selectedMaterials,
    searchHistory,
    searchProgress,
    paginationState,
    addToLibraryDialogVisible,
    addingToLibrary,
    addToLibraryOptions,
    previewDialogVisible,
    previewMaterial,
    executeAgentSearch,
    selectMaterial,
    clearHistory,
    showAddToLibraryDialog,
    closeAddToLibraryDialog,
    goToLibrary,
    showMaterialPreview,
    handleSizeChange,
    handleCurrentChange,
    resetSearchState
  } = useMaterialSearch()

  // 响应式数据
  const searchFormRef = ref<FormInstance>()
  const addToLibraryDialogRef = ref()
  const materialStore = useMaterialStore()
  const showAgentPanel = ref(false)
  const currentTaskId = ref<string>('')
  const researchPath = computed(() => materialStore.researchPath)

  // Markdown 预览主题配置
  const previewTheme = ref('default')
  const codeTheme = ref('atom')

  // 搜索表单数据
  const searchForm = reactive<SearchForm>({
    brief: ''
  })

  // Agent表单数据
  const agentForm = reactive<AgentForm>({
    agentType: 'search',
    agentConfig: {
      maxConcurrentResearchUnits: 10,
      maxResearcherIterations: 3
    }
  })

  // 表单验证规则
  const searchRules: FormRules = {
    brief: [
      { required: true, message: '请输入研究简报', trigger: 'blur' },
      { min: 1, max: 1000, message: '研究简报长度应在 1 到 1000 个字符之间', trigger: 'blur' }
    ]
  }

  // 更新Agent配置
  const updateAgentConfig = (config: Partial<AgentForm>) => {
    if (config.agentConfig) {
      // 确保保留原有的默认值
      agentForm.agentConfig = {
        maxConcurrentResearchUnits: agentForm.agentConfig.maxConcurrentResearchUnits,
        maxResearcherIterations: agentForm.agentConfig.maxResearcherIterations,
        ...config.agentConfig
      }
    } else {
      Object.assign(agentForm, config)
    }
  }

  // 处理Agent搜索
  const handleAgentSearch = async (config: AgentSearchConfig) => {
    try {
      await executeAgentSearch(config)
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : 'Agent检索失败，请稍后重试')
    }
  }

  // 处理搜索
  const handleSearch = async () => {
    if (!searchFormRef.value) return

    try {
      const valid = await searchFormRef.value.validate()
      if (!valid) return

      // 构建Agent搜索配置
      const agentConfig: AgentSearchConfig = {
        keywords: searchForm.brief,
        providers: ['tavily'], // Agent搜索通常使用默认提供商
        searchScope: '',
        agentType: 'search',
        agentConfig: agentForm.agentConfig,
        filters: { tags: [] },
        maxResults: 20
      }

      await handleAgentSearch(agentConfig)
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '搜索失败，请稍后重试')
    }
  }

  // 取消搜索
  const cancelSearch = async () => {
    if (currentTaskId.value) {
      try {
        // 调用取消API
        await materialStore.cancelAgentTask(currentTaskId.value)
        ElMessage.success('Agent任务已取消')
      } catch {
        ElMessage.warning('取消任务时发生错误，但搜索已停止')
      }
    }

    searching.value = false
    currentTaskId.value = ''
  }

  // 重置表单
  const resetForm = () => {
    if (!searchFormRef.value) return

    searchFormRef.value.resetFields()

    // 重置Agent表单
    agentForm.agentType = 'search'
    agentForm.agentConfig = {
      maxConcurrentResearchUnits: 5,
      maxResearcherIterations: 10
    }

    // 重置搜索状态
    resetSearchState()
    showAgentPanel.value = false
    currentTaskId.value = ''
  }

  // 使用历史记录并搜索
  const useHistoryItemAndSearch = (item: any) => {
    searchForm.brief = item.keywords
    handleSearch()
  }

  // 清空研究路径
  const clearResearchPath = () => {
    materialStore.researchPath = []
  }

  // 处理添加到素材库确认
  const handleAddToLibraryConfirm = async (options: {
    autoClear: boolean
    goToLibrary: boolean
  }) => {
    try {
      // 更新选项
      addToLibraryOptions.value.autoClear = options.autoClear
      addToLibraryOptions.value.goToLibrary = options.goToLibrary

      // 获取选中的素材对象
      const materialsToAdd = selectedMaterials.value
        .map((id) => searchResults.value.find((material) => material.id === id))
        .filter(Boolean) as Material[]

      // 使用Store方法将搜索结果添加到数据库
      const result = await materialStore.addSearchResultsToDatabase(materialsToAdd)

      // 根据选项执行后续操作
      if (options.autoClear) {
        materialStore.clearSelection()
      }

      if (options.goToLibrary) {
        goToLibrary()
      } else {
        ElMessage.success(`已添加 ${result.addedCount} 个素材到数据库`)
      }

      // 调用子组件的 completeAdd 方法来关闭进度对话框
      if (addToLibraryDialogRef.value && addToLibraryDialogRef.value.completeAdd) {
        addToLibraryDialogRef.value.completeAdd(
          true,
          `成功添加 ${result.addedCount} 个素材到数据库`
        )
      }
    } catch {
      ElMessage.error('添加到数据库失败')

      // 即使出错也要调用 completeAdd 来关闭进度对话框
      if (addToLibraryDialogRef.value && addToLibraryDialogRef.value.completeAdd) {
        addToLibraryDialogRef.value.completeAdd(false, '添加到数据库失败')
      }
    }
  }
</script>

<style scoped lang="scss">
  .agent-search {
    width: 100%;

    &__card {
      margin-bottom: 20px;
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      &-actions {
        display: flex;
        gap: 8px;
      }

      .agent-search__title {
        display: flex;
        gap: 8px;
        align-items: center;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }
    }

    &__agent-panel {
      margin-bottom: 20px;
    }

    &__history {
      padding: 16px;
      margin-bottom: 20px;
      background: var(--el-fill-color-lighter);
      border-radius: 6px;

      &-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      &-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      &-item {
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
          transform: translateY(-2px);
        }
      }
    }

    &__actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    &__progress {
      margin-bottom: 20px;
    }

    &__research-path {
      &-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        h3 {
          display: flex;
          gap: 8px;
          align-items: center;
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);

          .el-icon {
            color: var(--el-color-primary);
          }
        }
      }

      &-content {
        max-height: 400px;
        overflow-y: auto;
      }
    }

    .research-step {
      display: flex;
      gap: 12px;
      padding: 12px;
      margin-bottom: 8px;
      background: var(--el-fill-color-lighter);
      border-left: 4px solid var(--el-color-primary);
      border-radius: 6px;

      &:last-child {
        margin-bottom: 0;
      }

      &__index {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        font-size: 12px;
        font-weight: 600;
        color: white;
        background: var(--el-color-primary);
        border-radius: 50%;
      }

      &__content {
        flex: 1;
      }

      &__text {
        font-size: 14px;
        line-height: 1.5;
        color: var(--el-text-color-regular);
      }

      &__markdown {
        font-size: 14px;
        line-height: 1.6;

        :deep(.md-editor-preview) {
          padding: 0;
          background: transparent;

          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            margin-top: 0.5em;
            margin-bottom: 0.5em;
            color: var(--el-text-color-primary);
          }

          p {
            margin: 0.5em 0;
            color: var(--el-text-color-regular);
          }

          ul,
          ol {
            padding-left: 1.5em;
            margin: 0.5em 0;

            li {
              margin: 0.25em 0;
              color: var(--el-text-color-regular);
            }
          }

          code {
            padding: 0.2em 0.4em;
            font-size: 0.9em;
            background-color: var(--el-fill-color-light);
            border-radius: 3px;
          }

          pre {
            padding: 1em;
            margin: 0.5em 0;
            overflow-x: auto;
            background-color: var(--el-fill-color-light);
            border-radius: 4px;

            code {
              padding: 0;
              background: none;
            }
          }

          blockquote {
            padding: 0.5em 1em;
            margin: 0.5em 0;
            color: var(--el-text-color-regular);
            background-color: var(--el-fill-color-lighter);
            border-left: 4px solid var(--el-color-primary);
          }

          table {
            width: 100%;
            margin: 0.5em 0;
            border-collapse: collapse;

            th,
            td {
              padding: 0.5em;
              text-align: left;
              border: 1px solid var(--el-border-color-lighter);
            }

            th {
              background-color: var(--el-fill-color-light);
            }
          }

          a {
            color: var(--el-color-primary);
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }

          img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
          }
        }
      }
    }
  }

  @media (width <= 768px) {
    .agent-search {
      &__actions {
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }
  }
</style>
