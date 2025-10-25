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
              @click="useHistoryItem(item)"
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
            <el-button size="small" @click="researchPath = []"> 清空 </el-button>
          </div>
        </template>

        <div class="agent-search__research-path-content">
          <div v-for="(step, index) in researchPath" :key="index" class="research-step">
            <div class="research-step__index">
              {{ index + 1 }}
            </div>
            <div class="research-step__content">
              <div class="research-step__text">{{ step }}</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchResults.length > 0" class="agent-search__results">
      <el-card class="agent-search__card">
        <template #header>
          <div class="agent-search__results-header">
            <h3>
              搜索结果 ({{ searchResults.length }} 个素材)
              <span v-if="totalResults > searchResults.length"> / 共 {{ totalResults }} 个 </span>
            </h3>
            <div class="agent-search__results-actions">
              <el-button @click="selectAll">全选</el-button>
              <el-button @click="clearSelection">取消选择</el-button>
              <el-button
                type="primary"
                @click="showAddToLibraryDialog"
                :disabled="selectedMaterials.length === 0"
              >
                添加到素材库 ({{ selectedMaterials.length }})
              </el-button>
              <el-button
                type="success"
                @click="goToLibrary"
                v-if="materialStore.materials.length > 0"
              >
                查看素材库
              </el-button>
            </div>
          </div>
        </template>

        <div class="agent-search__results-grid">
          <SearchResultCard
            v-for="material in searchResults"
            :key="material.id"
            :material="material"
            :selected="selectedMaterials.includes(material.id)"
            :loading="loadingMaterials.includes(material.id)"
            :show-selection="true"
            :show-score="true"
            context="search"
            @select="toggleMaterialSelection"
            @preview="showMaterialPreview"
            @click="selectMaterial(material)"
          />
        </div>

        <!-- 分页 -->
        <div v-if="totalResults > searchResults.length" class="agent-search__pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="totalResults"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 添加到素材库确认对话框 -->
    <el-dialog
      v-model="addToLibraryDialogVisible"
      title="添加到素材库"
      width="600px"
      :before-close="closeAddToLibraryDialog"
    >
      <div class="agent-search__add-dialog">
        <div class="agent-search__add-info">
          <p>
            您已选择了
            <strong>{{ selectedMaterials.length }}</strong>
            个素材，是否确认添加到素材库？
          </p>
          <div v-if="selectedMaterials.length <= 5" class="agent-search__add-list">
            <div
              v-for="materialId in selectedMaterials"
              :key="materialId"
              class="agent-search__add-item"
            >
              {{ getMaterialById(materialId)?.title }}
            </div>
          </div>
          <div v-else class="agent-search__add-summary">
            <p>选中的素材包括多种类型，将全部添加到素材库中。</p>
          </div>
        </div>

        <div class="agent-search__add-options">
          <el-checkbox v-model="addToLibraryOptions.autoClear">添加后自动清除选择</el-checkbox>
          <el-checkbox v-model="addToLibraryOptions.goToLibrary">添加后跳转到素材库</el-checkbox>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeAddToLibraryDialog">取消</el-button>
        <el-button type="primary" @click="confirmAddToLibrary" :loading="addingToLibrary">
          确认添加
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加进度对话框 -->
    <el-dialog
      v-model="addProgressDialogVisible"
      title="正在添加到素材库"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="agent-search__add-progress">
        <el-progress
          :percentage="addProgress.percentage"
          :status="addProgress.status"
          :stroke-width="8"
        />
        <p class="agent-search__add-progress-text">
          {{ addProgress.message }}
        </p>
        <div class="agent-search__add-progress-details">
          <span>已处理: {{ addProgress.processed }} / {{ addProgress.total }}</span>
        </div>
      </div>
    </el-dialog>

    <!-- 空状态 -->
    <div v-if="!searching && hasSearched && searchResults.length === 0" class="agent-search__empty">
      <el-empty description="未找到相关素材">
        <el-button type="primary" @click="resetForm">重新搜索</el-button>
      </el-empty>
    </div>

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
  import { useUserStore } from '@/store/modules/user'
  import { useProjectStore } from '@/store/modules/project'
  import { useRouter } from 'vue-router'
  import { aiService } from '@/services/aiService'
  import type { Material } from '@/types/material'
  import SearchResultCard from '@/components/custom/material-card/UnifiedMaterialCard.vue'
  import MaterialPreviewDialog from '@/components/custom/material-card/MaterialPreviewDialog.vue'
  import AgentSearchProgress from './AgentSearchProgress.vue'
  import CryptoJS from 'crypto-js'

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

  interface AgentSearchConfig {
    brief: string
    providers: string[]
    agentConfig: Record<string, any>
    maxResults: number
  }

  // Search Agent API 类型定义 - 根据 ai_openapi.json 更新
  interface SearchAgentRequest {
    brief: string
    max_concurrent_research_units?: number
    max_researcher_iterations?: number
  }

  interface SearchAgentResult {
    research_path?: string[]
    web_search_data?: any[]
  }

  // 响应式数据
  const searchFormRef = ref<FormInstance>()
  const materialStore = useMaterialStore()
  const router = useRouter()

  const searching = ref(false)
  const showHistory = ref(false)
  const showAgentPanel = ref(false)
  const hasSearched = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalResults = ref(0)
  const currentTaskId = ref<string>('')

  const searchResults = ref<Material[]>([])
  const selectedMaterials = ref<string[]>([])
  const loadingMaterials = ref<string[]>([])
  const researchPath = ref<string[]>([])

  // 添加到素材库相关状态
  const addToLibraryDialogVisible = ref(false)
  const addProgressDialogVisible = ref(false)
  const addingToLibrary = ref(false)

  // 预览对话框相关状态
  const previewDialogVisible = ref(false)
  const previewMaterial = ref<Material | null>(null)

  // 添加到素材库选项
  const addToLibraryOptions = ref({
    autoClear: true,
    goToLibrary: false
  })

  // 添加进度
  const addProgress = ref({
    percentage: 0,
    status: 'success' as 'success' | 'exception' | 'warning',
    message: '准备添加...',
    processed: 0,
    total: 0
  })

  // 搜索进度
  const searchProgress = reactive({
    stage: 'config' as 'config' | 'searching' | 'processing' | 'completed',
    current: 0,
    total: 100,
    message: '准备搜索...'
  })

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

  // 搜索历史
  const searchHistory = computed(() => materialStore.searchHistory)

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
    console.log('Agent配置已更新:', config)
  }

  // 处理Agent搜索
  const handleAgentSearch = async (config: AgentSearchConfig) => {
    searching.value = true
    hasSearched.value = true
    currentPage.value = 1

    try {
      // 更新搜索进度
      updateSearchProgress('config', 0, 100, '配置Agent搜索参数...')

      // 构建请求数据
      const requestData: SearchAgentRequest = {
        brief: config.brief
      }

      // 添加可选参数
      if (
        config.agentConfig?.maxConcurrentResearchUnits !== null &&
        config.agentConfig?.maxConcurrentResearchUnits !== undefined
      ) {
        requestData.max_concurrent_research_units = config.agentConfig.maxConcurrentResearchUnits
      }
      if (
        config.agentConfig?.maxResearcherIterations !== null &&
        config.agentConfig?.maxResearcherIterations !== undefined
      ) {
        requestData.max_researcher_iterations = config.agentConfig.maxResearcherIterations
      }

      // 调用Agent搜索API
      const executeResponse = await aiService.executeSearchAgent(
        getCurrentUserId(),
        getCurrentProjectId(),
        requestData
      )

      // 添加调试日志：检查API响应
      console.log('[AgentSearch] API响应:', {
        response: executeResponse,
        isMockResponse:
          executeResponse && typeof executeResponse === 'object' && 'isMock' in executeResponse
      })

      if (!executeResponse.success) {
        throw new Error(executeResponse.message || 'Agent执行失败')
      }

      currentTaskId.value = executeResponse.task_id
      updateSearchProgress('searching', 20, 100, 'Agent正在分析需求...')

      // 轮询任务状态
      const result = await pollAgentStatus(executeResponse.task_id)

      if (result) {
        // 处理成功结果
        await processAgentResult(result)
        updateSearchProgress('completed', 100, 100, 'Agent搜索完成')
        ElMessage.success('Agent检索完成')
      } else {
        throw new Error('Agent任务执行失败')
      }
    } catch (error) {
      console.error('Agent search error:', error)
      ElMessage.error(error instanceof Error ? error.message : 'Agent检索失败，请稍后重试')
    } finally {
      searching.value = false
    }
  }

  // 轮询Agent任务状态
  const pollAgentStatus = async (taskId: string): Promise<SearchAgentResult | null> => {
    const maxAttempts = 60 // 最多轮询60次
    const interval = 20000 // 20秒间隔

    console.log(`[AgentSearch] 开始轮询任务状态:`, {
      taskId,
      maxAttempts,
      interval
    })

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // 添加调试日志：检查状态查询API
        console.log(`[AgentSearch] 第${attempt + 1}次状态查询:`, {
          service: 'aiService',
          taskId,
          attempt: attempt + 1,
          totalAttempts: maxAttempts
        })

        const statusResponse = await aiService.getSearchAgentStatus(
          taskId,
          getCurrentUserId(),
          getCurrentProjectId()
        )

        // 添加调试日志：检查状态查询响应
        console.log(`[AgentSearch] 第${attempt + 1}次状态查询响应:`, {
          response: statusResponse,
          status: statusResponse?.status,
          progress: statusResponse?.progress,
          hasResult: !!statusResponse?.result,
          isMockResponse:
            statusResponse && typeof statusResponse === 'object' && 'isMock' in statusResponse
        })

        // 检查响应结构
        if (!statusResponse) {
          console.error('[AgentSearch] 状态查询返回空响应')
          throw new Error('状态查询返回空响应')
        }

        // 更新进度
        const currentProgress = 20 + (statusResponse.progress || 0) * 0.8
        updateSearchProgress(
          'processing',
          currentProgress,
          100,
          getStatusMessage(statusResponse.status)
        )

        console.log(`[AgentSearch] 状态检查:`, {
          status: statusResponse.status,
          isSuccess: statusResponse.status === 'SUCCESS',
          hasResult: !!statusResponse.result,
          progress: statusResponse.progress
        })

        if (statusResponse.status === 'SUCCESS' && statusResponse.result) {
          console.log('[AgentSearch] 任务成功完成，返回结果:', {
            researchPathLength: statusResponse.result.research_path?.length,
            webSearchDataLength: statusResponse.result.web_search_data?.length
          })
          return statusResponse.result
        } else if (statusResponse.status === 'FAILURE') {
          throw new Error(statusResponse.error || 'Agent任务执行失败')
        } else if (statusResponse.status === 'REVOKED') {
          throw new Error('Agent任务已被取消')
        }

        console.log(
          `[AgentSearch] 任务状态: ${statusResponse.status}, 进度: ${statusResponse.progress}%, 等待下一次轮询...`
        )

        // 任务仍在进行中，等待后继续轮询
        await new Promise((resolve) => setTimeout(resolve, interval))
      } catch (error) {
        console.error(`[AgentSearch] 第${attempt + 1}次轮询失败:`, error)
        throw error
      }
    }

    console.error(`[AgentSearch] 任务超时，已达到最大轮询次数: ${maxAttempts}`)
    throw new Error('Agent任务超时')
  }

  // 获取状态消息
  const getStatusMessage = (status: string): string => {
    const statusMap = {
      PENDING: '任务等待中...',
      STARTED: 'Agent正在执行...',
      SUCCESS: '任务完成',
      FAILURE: '任务失败',
      REVOKED: '任务已取消'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  // 处理Agent结果
  const processAgentResult = async (result: SearchAgentResult) => {
    // 显示研究路径
    if (result.research_path && result.research_path.length > 0) {
      researchPath.value = result.research_path
    }

    // 转换web_search_data为素材格式
    if (result.web_search_data && result.web_search_data.length > 0) {
      // 获取当前用户ID
      const currentUserId = getCurrentUserId()

      searchResults.value = result.web_search_data.map((searchItem, index) => {
        return transformWebSearchDataToMaterial(searchItem, index, currentUserId)
      })
      totalResults.value = searchResults.value.length
    } else {
      searchResults.value = []
      totalResults.value = 0
    }
  }

  // 转换web_search_data为素材格式
  const transformWebSearchDataToMaterial = (
    searchItem: any,
    index: number,
    userId: string
  ): Material => {
    return {
      id: CryptoJS.MD5(searchItem.url).toString(),
      user_id: userId, // 使用传入的用户ID
      title: searchItem.aititle || searchItem.webtitle || '未命名素材',
      summary: searchItem.summary || searchItem.key_excerpts?.join(' ') || '无可用摘要',
      tags: searchItem.tags || [],
      url: searchItem.url,
      createdAt: searchItem.published_date ? new Date(searchItem.published_date) : new Date(),
      selected: false,
      score: searchItem.score || 0,
      key_excerpts: searchItem.key_excerpts || []
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
        brief: searchForm.brief,
        providers: ['tavily'], // Agent搜索通常使用默认提供商
        agentConfig: agentForm.agentConfig,
        maxResults: 20
      }

      await handleAgentSearch(agentConfig)
    } catch (error) {
      console.error('Search error:', error)
      ElMessage.error(error instanceof Error ? error.message : '搜索失败，请稍后重试')
    }
  }

  // 更新搜索进度
  const updateSearchProgress = (
    stage: 'config' | 'searching' | 'processing' | 'completed',
    current: number,
    total: number,
    message: string
  ) => {
    searchProgress.stage = stage
    searchProgress.current = current
    searchProgress.total = total
    searchProgress.message = message
  }

  // 取消搜索
  const cancelSearch = async () => {
    if (currentTaskId.value) {
      try {
        // 调用取消API
        await aiService.cancelSearchAgentTask(
          currentTaskId.value,
          getCurrentUserId(),
          getCurrentProjectId()
        )
        ElMessage.success('Agent任务已取消')
      } catch (error) {
        console.error('Cancel agent task error:', error)
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

    searchResults.value = []
    selectedMaterials.value = []
    researchPath.value = []
    hasSearched.value = false
    showAgentPanel.value = false
    currentTaskId.value = ''
  }

  // 使用历史记录
  const useHistoryItem = (item: any) => {
    searchForm.brief = item.keywords
    handleSearch()
  }

  // 清空历史记录
  const clearHistory = () => {
    materialStore.clearSearchHistory()
    ElMessage.success('搜索历史已清空')
  }

  // 选择/取消选择素材
  const toggleMaterialSelection = (materialId: string) => {
    const index = selectedMaterials.value.indexOf(materialId)
    if (index > -1) {
      selectedMaterials.value.splice(index, 1)
    } else {
      selectedMaterials.value.push(materialId)
    }
  }

  // 选择素材
  const selectMaterial = (material: Material) => {
    if (material.id) {
      toggleMaterialSelection(material.id)
    }
  }

  // 全选
  const selectAll = () => {
    selectedMaterials.value = searchResults.value
      .map((material) => material.id)
      .filter((id): id is string => id !== undefined)
  }

  // 取消选择
  const clearSelection = () => {
    selectedMaterials.value = []
  }

  // 显示添加到素材库对话框
  const showAddToLibraryDialog = () => {
    if (selectedMaterials.value.length === 0) {
      ElMessage.warning('请先选择要添加的素材')
      return
    }
    addToLibraryDialogVisible.value = true
  }

  // 关闭添加到素材库对话框
  const closeAddToLibraryDialog = () => {
    addToLibraryDialogVisible.value = false
  }

  // 确认添加到素材库
  const confirmAddToLibrary = async () => {
    if (selectedMaterials.value.length === 0) {
      ElMessage.warning('请先选择要添加的素材')
      return
    }

    closeAddToLibraryDialog()
    addProgressDialogVisible.value = true
    addingToLibrary.value = true

    // 初始化进度
    addProgress.value = {
      percentage: 0,
      status: 'success',
      message: '准备添加素材到数据库...',
      processed: 0,
      total: selectedMaterials.value.length
    }

    try {
      // 获取选中的素材对象
      const materialsToAdd = selectedMaterials.value
        .map((id) => searchResults.value.find((material) => material.id === id))
        .filter(Boolean) as Material[]

      // 使用新的API将搜索结果添加到数据库
      addProgress.value.message = '正在将素材添加到数据库...'
      addProgress.value.percentage = 30

      const result = await materialStore.addSearchResultsToDatabase(materialsToAdd)

      // 更新进度
      addProgress.value.percentage = 80
      addProgress.value.message = `已成功添加 ${result.addedCount} 个素材到数据库`
      addProgress.value.processed = result.addedCount

      // 添加延迟，让用户看到进度
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 完成添加
      addProgress.value.percentage = 100
      addProgress.value.message = `成功添加 ${result.addedCount} 个素材到数据库`

      // 根据选项执行后续操作
      if (addToLibraryOptions.value.autoClear) {
        clearSelection()
      }

      // 延迟关闭进度对话框
      setTimeout(() => {
        addProgressDialogVisible.value = false
        addingToLibrary.value = false

        if (addToLibraryOptions.value.goToLibrary) {
          goToLibrary()
        } else {
          ElMessage.success(`已添加 ${result.addedCount} 个素材到数据库`)
        }
      }, 1500)
    } catch (error) {
      console.error('添加到数据库失败:', error)
      addProgress.value.status = 'exception'
      addProgress.value.message = '添加到数据库失败'

      setTimeout(() => {
        addProgressDialogVisible.value = false
        addingToLibrary.value = false
        ElMessage.error('添加到数据库失败')
      }, 2000)
    }
  }

  // 跳转到素材库
  const goToLibrary = () => {
    router.push('/material/management')
  }

  // 根据ID获取素材
  const getMaterialById = (id: string) => {
    return searchResults.value.find((material) => material.id === id)
  }

  // 显示素材预览
  const showMaterialPreview = (material: Material) => {
    console.log('[AgentSearch] showMaterialPreview 被调用:', {
      material,
      materialId: material?.id,
      materialType: typeof material,
      isMaterial: 'score' in material
    })

    if (!material) {
      console.error('[AgentSearch] showMaterialPreview: material 参数为空')
      return
    }

    previewMaterial.value = material
    previewDialogVisible.value = true

    console.log('[AgentSearch] showMaterialPreview: 预览对话框已打开:', {
      previewDialogVisible: previewDialogVisible.value,
      previewMaterial: previewMaterial.value
    })
  }

  // 分页处理
  const handleSizeChange = (size: number) => {
    pageSize.value = size
    handleSearch()
  }

  const handleCurrentChange = (page: number) => {
    currentPage.value = page
    handleSearch()
  }

  // 获取当前用户ID
  const getCurrentUserId = (): string => {
    // 添加调试日志：验证用户ID获取逻辑
    const userStore = useUserStore()
    console.log('[AgentMaterialSearch] getCurrentUserId - 用户状态验证:', {
      userStore存在: !!userStore,
      用户信息: userStore.info,
      用户ID: userStore.info?.id,
      用户是否登录: userStore.isLogin,
      用户类型: userStore.userType,
      访问令牌存在: !!userStore.accessToken,
      令牌过期时间: userStore.tokenExpiresAt
    })

    // 从用户状态获取实际用户ID
    // 这里应该从用户store或localStorage获取
    if (userStore && userStore.info?.id) {
      console.log('[AgentMaterialSearch] getCurrentUserId - 返回真实用户ID:', userStore.info.id)
      return userStore.info.id
    }

    // 临时返回默认值
    console.log('[AgentMaterialSearch] getCurrentUserId - 返回默认用户ID: current-user')
    return 'current-user'
  }

  // 获取当前项目ID
  const getCurrentProjectId = (): string => {
    // 从项目状态获取实际项目ID
    // 这里应该从项目store或localStorage获取
    const projectStore = useProjectStore()
    if (projectStore && projectStore.currentProject?.id) {
      return projectStore.currentProject.id.toString()
    }

    // 临时返回默认值
    return 'current-project'
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

    &__agent-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
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
    }

    &__results {
      &-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);

          span {
            font-size: 14px;
            font-weight: normal;
            color: var(--el-text-color-secondary);
          }
        }
      }

      &-actions {
        display: flex;
        gap: 8px;
      }

      &-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }
    }

    &__pagination {
      display: flex;
      justify-content: center;
      padding-top: 20px;
      border-top: 1px solid var(--el-border-color-lighter);
    }

    &__empty {
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }

    // 添加到素材库对话框样式
    &__add-dialog {
      &-info {
        margin-bottom: 20px;

        p {
          margin: 0 0 16px;
          font-size: 16px;
          line-height: 1.6;
          color: var(--el-text-color-primary);
        }
      }

      &-list {
        margin-bottom: 16px;
      }

      &-item {
        padding: 8px 12px;
        margin-bottom: 8px;
        font-size: 14px;
        color: var(--el-text-color-regular);
        background: var(--el-fill-color-lighter);
        border-radius: 4px;
      }

      &-summary {
        padding: 12px;
        background: var(--el-fill-color-lighter);
        border-radius: 4px;

        p {
          margin: 0;
          font-size: 14px;
          color: var(--el-text-color-regular);
        }
      }

      &-options {
        padding-top: 16px;
        border-top: 1px solid var(--el-border-color-lighter);

        .el-checkbox {
          display: block;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    // 添加进度对话框样式
    &__add-progress {
      text-align: center;

      &-text {
        margin: 16px 0;
        font-size: 16px;
        color: var(--el-text-color-primary);
      }

      &-details {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  @media (width <= 768px) {
    .agent-search {
      &__results {
        &-header {
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;
        }

        &-actions {
          width: 100%;

          .el-button {
            flex: 1;
          }
        }

        &-grid {
          grid-template-columns: 1fr;
        }
      }

      &__actions {
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }
  }
</style>
