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

          <el-form-item label="Agent类型">
            <el-select
              v-model="agentForm.agentType"
              placeholder="选择Agent类型"
              style="width: 100%"
            >
              <el-option
                v-for="agent in availableAgents"
                :key="agent.id"
                :label="agent.name"
                :value="agent.type"
              >
                <div class="agent-search__agent-option">
                  <span>{{ agent.name }}</span>
                  <el-tag size="small" type="warning">{{ agent.type }}</el-tag>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="AI增强">
            <el-switch
              v-model="agentForm.enableAIEnhancement"
              active-text="启用"
              inactive-text="禁用"
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
        :config="agentForm"
        :available-agents="availableAgents"
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
  import { ref, reactive, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Search, Connection } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useMaterialStore } from '@/store/material'
  import { useUserStore } from '@/store/modules/user'
  import { useProjectStore } from '@/store/modules/project'
  import { useRouter } from 'vue-router'
  import http from '@/utils/http'
  import type { Material, SearchResultMaterial } from '@/types/material'
  import SearchResultCard from '@/components/custom/material-card/UnifiedMaterialCard.vue'
  import MaterialPreviewDialog from '@/components/custom/material-card/MaterialPreviewDialog.vue'
  import AgentSearchProgress from './AgentSearchProgress.vue'

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
                placeholder="默认使用系统配置"
              />
            </el-form-item>
            <el-form-item label="最大研究迭代次数">
              <el-input-number
                v-model="config.agentConfig.maxResearcherIterations"
                :min="1"
                :max="20"
                placeholder="默认使用系统配置"
              />
            </el-form-item>
            <el-form-item label="搜索深度">
              <el-select v-model="config.agentConfig.searchDepth" placeholder="选择搜索深度">
                <el-option label="浅度搜索" value="shallow" />
                <el-option label="标准搜索" value="standard" />
                <el-option label="深度搜索" value="deep" />
              </el-select>
            </el-form-item>
          </el-form>
          <div class="agent-panel__actions">
            <el-button type="primary" @click="handleSearch">开始Agent搜索</el-button>
            <el-button @click="$emit('close')">取消</el-button>
          </div>
        </div>
      </div>
    `,
    props: ['config', 'availableAgents'],
    emits: ['update:config', 'search', 'close'],
    methods: {
      handleSearch() {
        this.$emit('search', this.config)
        this.$emit('close')
      }
    }
  }

  interface SearchForm {
    brief: string
  }

  interface AgentForm {
    agentType: 'search' | 'scope' | 'custom'
    enableAIEnhancement: boolean
    agentConfig: Record<string, any>
  }

  interface AgentService {
    id: string
    name: string
    type: string
    description: string
    capabilities: string[]
  }

  interface AgentSearchConfig {
    keywords: string
    providers: string[]
    searchScope: string
    agentType: string
    agentConfig: Record<string, any>
    filters: Record<string, any>
    maxResults: number
    enableAIEnhancement: boolean
  }

  // Search Agent API 类型定义 - 根据 ai_openapi.json 更新
  interface SearchAgentRequest {
    brief: string
    max_concurrent_research_units?: number | null
    max_researcher_iterations?: number | null
  }

  interface SearchAgentResponse {
    success: boolean
    task_id: string
    message: string
    user_id: string
    project_id: string
    agent_type: string
  }

  interface SearchAgentStatusResponse {
    task_id: string
    status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'REVOKED'
    progress: number
    result?: SearchAgentResult
    error?: string
    user_id: string
    project_id: string
    agent_type: string
    created_at: number
    updated_at: number
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

  const searchResults = ref<SearchResultMaterial[]>([])
  const selectedMaterials = ref<string[]>([])
  const loadingMaterials = ref<string[]>([])
  const researchPath = ref<string[]>([])

  const availableAgents = ref<AgentService[]>([])

  // 添加到素材库相关状态
  const addToLibraryDialogVisible = ref(false)
  const addProgressDialogVisible = ref(false)
  const addingToLibrary = ref(false)

  // 预览对话框相关状态
  const previewDialogVisible = ref(false)
  const previewMaterial = ref<SearchResultMaterial | null>(null)

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
    enableAIEnhancement: true,
    agentConfig: {}
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

  // 获取可用的Agent服务
  const fetchAvailableAgents = async () => {
    try {
      // 模拟Agent服务数据
      availableAgents.value = [
        {
          id: 'search-agent',
          name: '搜索Agent',
          type: 'search',
          description: '智能搜索和分析素材',
          capabilities: ['智能搜索', '内容分析', '相关性评估']
        },
        {
          id: 'scope-agent',
          name: '范围Agent',
          type: 'scope',
          description: '深度搜索特定领域素材',
          capabilities: ['深度搜索', '领域专业', '精准匹配']
        },
        {
          id: 'custom-agent',
          name: '自定义Agent',
          type: 'custom',
          description: '根据需求自定义搜索策略',
          capabilities: ['自定义策略', '灵活配置', '个性化推荐']
        }
      ]
    } catch (error) {
      console.error('获取Agent服务失败:', error)
    }
  }

  // 更新Agent配置
  const updateAgentConfig = (config: Partial<AgentForm>) => {
    Object.assign(agentForm, config)
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
        brief: config.keywords
      }

      // 添加可选参数
      if (config.agentConfig?.maxConcurrentResearchUnits) {
        requestData.max_concurrent_research_units = config.agentConfig.maxConcurrentResearchUnits
      }
      if (config.agentConfig?.maxResearcherIterations) {
        requestData.max_researcher_iterations = config.agentConfig.maxResearcherIterations
      }

      // 调用真实的Agent搜索API
      const executeResponse = await http.post<SearchAgentResponse>({
        url: '/api/v1/ai/search-agent/execute',
        data: requestData,
        params: {
          user_id: getCurrentUserId(),
          project_id: getCurrentProjectId()
        }
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
    const maxAttempts = 60 // 最多轮询60次（5分钟）
    const interval = 5000 // 5秒间隔

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const statusResponse = await http.get<SearchAgentStatusResponse>({
          url: `/api/v1/ai/search-agent/status/${taskId}`,
          params: {
            user_id: getCurrentUserId(),
            project_id: getCurrentProjectId()
          }
        })

        // 更新进度
        updateSearchProgress(
          'processing',
          20 + statusResponse.progress * 0.8,
          100,
          getStatusMessage(statusResponse.status)
        )

        if (statusResponse.status === 'SUCCESS' && statusResponse.result) {
          return statusResponse.result
        } else if (statusResponse.status === 'FAILURE') {
          throw new Error(statusResponse.error || 'Agent任务执行失败')
        } else if (statusResponse.status === 'REVOKED') {
          throw new Error('Agent任务已被取消')
        }

        // 任务仍在进行中，等待后继续轮询
        await new Promise((resolve) => setTimeout(resolve, interval))
      } catch (error) {
        console.error('Poll agent status error:', error)
        throw error
      }
    }

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
      searchResults.value = result.web_search_data.map((searchItem, index) => {
        return transformWebSearchDataToMaterial(searchItem, index)
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
    index: number
  ): SearchResultMaterial => {
    const id = `agent-${currentTaskId.value}-${index}`
    const url = new URL(searchItem.url || '')
    const source = url.hostname

    // 确定素材类型
    const type = determineMaterialType(searchItem.url, searchItem.summary)

    return {
      id,
      title: searchItem.aititle || searchItem.webtitle || '未命名素材',
      source,
      summary: searchItem.summary || searchItem.key_excerpts?.join(' ') || '无可用摘要',
      tags: searchItem.tags || [],
      type,
      url: searchItem.url,
      thumbnail: generateThumbnailUrl(searchItem.url, type),
      content: searchItem.key_excerpts?.join('\n\n') || '',
      createdAt: searchItem.published_date ? new Date(searchItem.published_date) : new Date(),
      selected: false,
      // SearchResultMaterial特有字段
      score: searchItem.score || 0,
      query: searchItem.query || '',
      aititle: searchItem.aititle,
      key_excerpts: searchItem.key_excerpts || [],
      published_date: searchItem.published_date,
      webtitle: searchItem.webtitle
    }
  }

  // 确定素材类型
  const determineMaterialType = (url: string, summary?: string): Material['type'] => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac']

    const lowerUrl = url.toLowerCase()

    if (imageExtensions.some((ext) => lowerUrl.includes(ext))) {
      return 'image'
    }

    if (videoExtensions.some((ext) => lowerUrl.includes(ext))) {
      return 'video'
    }

    if (audioExtensions.some((ext) => lowerUrl.includes(ext))) {
      return 'audio'
    }

    // 基于摘要内容判断
    if (
      summary &&
      (summary.includes('图片') || summary.includes('图像') || summary.includes('照片'))
    ) {
      return 'image'
    }

    if (summary && (summary.includes('视频') || summary.includes('影片'))) {
      return 'video'
    }

    if (
      summary &&
      (summary.includes('音频') || summary.includes('音乐') || summary.includes('声音'))
    ) {
      return 'audio'
    }

    // 默认为文本类型
    return 'text'
  }

  // 生成缩略图URL
  const generateThumbnailUrl = (url: string, type: Material['type']): string | undefined => {
    if (type === 'image') {
      return url // 图片直接使用原URL
    }

    // 对于其他类型，可以生成占位图
    if (type === 'video') {
      return `https://picsum.photos/300/200?random=${encodeURIComponent(url)}&type=video`
    }

    if (type === 'audio') {
      return `https://picsum.photos/300/200?random=${encodeURIComponent(url)}&type=audio`
    }

    return `https://picsum.photos/300/200?random=${encodeURIComponent(url)}`
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
        agentType: agentForm.agentType,
        agentConfig: agentForm.agentConfig,
        filters: { type: [] },
        maxResults: 20,
        enableAIEnhancement: agentForm.enableAIEnhancement
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
        await http.post({
          url: `/api/v1/ai/search-agent/cancel/${currentTaskId.value}`,
          params: {
            user_id: getCurrentUserId(),
            project_id: getCurrentProjectId()
          }
        })
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
    agentForm.enableAIEnhancement = true
    agentForm.agentConfig = {}

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
    toggleMaterialSelection(material.id)
  }

  // 全选
  const selectAll = () => {
    selectedMaterials.value = searchResults.value.map((material) => material.id)
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
        .filter(Boolean) as SearchResultMaterial[]

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
  const showMaterialPreview = (material: SearchResultMaterial) => {
    previewMaterial.value = material
    previewDialogVisible.value = true
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
    // 从用户状态获取实际用户ID
    // 这里应该从用户store或localStorage获取
    const userStore = useUserStore()
    if (userStore && userStore.info?.id) {
      return userStore.info.id
    }

    // 临时返回默认值
    return 'current-user'
  }

  // 获取当前项目ID
  const getCurrentProjectId = (): string => {
    // 从项目状态获取实际项目ID
    // 这里应该从项目store或localStorage获取
    const projectStore = useProjectStore()
    if (projectStore && projectStore.currentProject?.id) {
      return projectStore.currentProject.id
    }

    // 临时返回默认值
    return 'current-project'
  }

  // 组件挂载时初始化
  onMounted(async () => {
    await fetchAvailableAgents()
  })
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
