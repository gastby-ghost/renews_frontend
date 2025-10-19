<template>
  <div class="art-material-search">
    <!-- 搜索模式切换 -->
    <div class="art-material-search__mode-switch">
      <el-radio-group
        v-model="searchMode"
        @change="(val) => handleModeChange(val as 'simple' | 'agent')"
      >
        <el-radio-button label="simple">简单搜索</el-radio-button>
        <el-radio-button label="agent">Agent搜索</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 搜索表单区域 -->
    <div class="art-material-search__form">
      <el-card class="art-material-search__card">
        <template #header>
          <div class="art-material-search__header">
            <h3 class="art-material-search__title">
              <el-icon><Search /></el-icon>
              {{ searchMode === 'agent' ? 'Agent智能检索' : '素材检索' }}
            </h3>
            <div class="art-material-search__header-actions">
              <el-button
                v-if="searchHistory.length > 0"
                size="small"
                @click="showHistory = !showHistory"
              >
                搜索历史
              </el-button>
              <el-button
                v-if="searchMode === 'agent'"
                size="small"
                type="primary"
                @click="showAgentPanel = !showAgentPanel"
              >
                Agent配置
              </el-button>
            </div>
          </div>
        </template>

        <!-- 搜索历史 -->
        <div v-if="showHistory && searchHistory.length > 0" class="art-material-search__history">
          <div class="art-material-search__history-header">
            <span>最近搜索</span>
            <el-button size="small" text @click="clearHistory">清空</el-button>
          </div>
          <div class="art-material-search__history-list">
            <el-tag
              v-for="(item, index) in searchHistory.slice(0, 5)"
              :key="index"
              class="art-material-search__history-item"
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
          label-width="80px"
          @submit.prevent="handleSearch"
        >
          <el-form-item label="关键词" prop="keywords">
            <el-input
              v-model="searchForm.keywords"
              placeholder="请输入搜索关键词"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button :icon="Search" @click="handleSearch" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="搜索源" prop="providers">
            <el-select
              v-model="searchForm.providers"
              multiple
              placeholder="选择搜索提供商"
              style="width: 100%"
            >
              <el-option
                v-for="provider in availableProviders"
                :key="provider.id"
                :label="provider.name"
                :value="provider.id"
              >
                <div class="art-material-search__provider-option">
                  <span>{{ provider.name }}</span>
                  <el-tag size="small" :type="provider.type === 'ai' ? 'warning' : 'success'">
                    {{ provider.type === 'ai' ? 'AI' : 'API' }}
                  </el-tag>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="结果数量" prop="maxResults">
            <el-slider
              v-model="searchForm.maxResults"
              :min="5"
              :max="50"
              :step="5"
              show-stops
              show-input
            />
          </el-form-item>

          <el-form-item label="高级选项">
            <el-collapse v-model="advancedOptions">
              <el-collapse-item title="搜索范围" name="scope">
                <el-input
                  v-model="searchForm.searchScope"
                  type="textarea"
                  :rows="3"
                  placeholder="描述AI理解的检索范围（可选）"
                />
              </el-collapse-item>

              <el-collapse-item title="内容过滤" name="filters">
                <div class="art-material-search__filters">
                  <el-form-item label="素材类型">
                    <el-checkbox-group v-model="searchForm.filters.type">
                      <el-checkbox label="image">图片</el-checkbox>
                      <el-checkbox label="video">视频</el-checkbox>
                      <el-checkbox label="audio">音频</el-checkbox>
                      <el-checkbox label="text">文本</el-checkbox>
                      <el-checkbox label="other">其他</el-checkbox>
                    </el-checkbox-group>
                  </el-form-item>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-form-item>

          <!-- Agent模式特有选项 -->
          <el-form-item v-if="searchMode === 'agent'" label="Agent类型">
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
                <div class="art-material-search__agent-option">
                  <span>{{ agent.name }}</span>
                  <el-tag size="small" type="warning">{{ agent.type }}</el-tag>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item v-if="searchMode === 'agent'" label="AI增强">
            <el-switch
              v-model="agentForm.enableAIEnhancement"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>

          <el-form-item>
            <div class="art-material-search__actions">
              <el-button type="primary" @click="handleSearch" :loading="searching">
                {{ searchMode === 'agent' ? '开始Agent搜索' : '开始搜索' }}
              </el-button>
              <el-button @click="resetForm">重置</el-button>
              <el-button v-if="searchMode === 'agent'" @click="showAgentPanel = true" type="info">
                高级Agent配置
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- Agent配置面板 -->
    <div v-if="searchMode === 'agent' && showAgentPanel" class="art-material-search__agent-panel">
      <el-card class="art-material-search__card">
        <template #header>
          <div class="art-material-search__header">
            <h3 class="art-material-search__title">
              <el-icon><Setting /></el-icon>
              Agent高级配置
            </h3>
            <el-button size="small" @click="showAgentPanel = false">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </template>

        <!-- AgentPanel组件将在下一步创建 -->
        <div v-if="false" class="art-material-search__agent-placeholder">
          <el-empty description="Agent功能开发中">
            <el-button type="primary">敬请期待</el-button>
          </el-empty>
        </div>
        <!--
        <AgentPanel
          :config="agentForm"
          :available-agents="availableAgents"
          @update:config="updateAgentConfig"
          @search="handleAgentSearch"
        />
        -->
      </el-card>
    </div>

    <!-- 搜索进度 -->
    <div v-if="searching" class="art-material-search__progress">
      <SearchProgressComponent
        :progress="searchProgress"
        :config="searchConfig"
        :providers="availableProviders"
        :is-active="searching"
        @cancel="cancelSearch"
      />
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchResults.length > 0" class="art-material-search__results">
      <el-card class="art-material-search__card">
        <template #header>
          <div class="art-material-search__results-header">
            <h3>
              搜索结果 ({{ searchResults.length }} 个素材)
              <span v-if="totalResults > searchResults.length"> / 共 {{ totalResults }} 个 </span>
            </h3>
            <div class="art-material-search__results-actions">
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

        <div class="art-material-search__results-grid">
          <MaterialCard
            v-for="material in searchResults"
            :key="material.id"
            :material="material"
            :selected="selectedMaterials.includes(material.id)"
            :loading="loadingMaterials.includes(material.id)"
            :show-type="true"
            @select="toggleMaterialSelection"
            @preview="showPreview"
            @download="downloadMaterial"
            @click="selectMaterial(material)"
          />
        </div>

        <!-- 分页 -->
        <div v-if="totalResults > searchResults.length" class="art-material-search__pagination">
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
      <div class="art-material-search__add-dialog">
        <div class="art-material-search__add-info">
          <p>
            您已选择了
            <strong>{{ selectedMaterials.length }}</strong>
            个素材，是否确认添加到素材库？
          </p>
          <div v-if="selectedMaterials.length <= 5" class="art-material-search__add-list">
            <div
              v-for="materialId in selectedMaterials"
              :key="materialId"
              class="art-material-search__add-item"
            >
              {{ getMaterialById(materialId)?.title }}
            </div>
          </div>
          <div v-else class="art-material-search__add-summary">
            <p>选中的素材包括多种类型，将全部添加到素材库中。</p>
          </div>
        </div>

        <div class="art-material-search__add-options">
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
      <div class="art-material-search__add-progress">
        <el-progress
          :percentage="addProgress.percentage"
          :status="addProgress.status"
          :stroke-width="8"
        />
        <p class="art-material-search__add-progress-text">
          {{ addProgress.message }}
        </p>
        <div class="art-material-search__add-progress-details">
          <span>已处理: {{ addProgress.processed }} / {{ addProgress.total }}</span>
        </div>
      </div>
    </el-dialog>

    <!-- 空状态 -->
    <div
      v-if="!searching && hasSearched && searchResults.length === 0"
      class="art-material-search__empty"
    >
      <el-empty description="未找到相关素材">
        <el-button type="primary" @click="resetForm">重新搜索</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Search, Setting, Close } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { materialSearchService } from '@/services/materialSearch'
  import { useMaterialStore } from '@/store/material'
  import type { Material, SearchProgress, AgentSearchConfig, AgentService } from '@/types/material'
  import MaterialCard from '@/components/custom/material-card/MaterialCard.vue'
  import SearchProgressComponent from '@/components/custom/search-progress/SearchProgress.vue'
  // import AgentPanel from './AgentPanel.vue' // 暂时注释，等组件创建后再启用
  import { useRouter } from 'vue-router'
  import { HttpError } from '@/utils/http/error'

  interface SearchForm {
    keywords: string
    providers: string[]
    maxResults: number
    searchScope: string
    filters: {
      type: Material['type'][]
    }
  }

  interface AgentForm {
    agentType: 'search' | 'scope' | 'custom'
    enableAIEnhancement: boolean
    agentConfig: Record<string, any>
  }

  // 响应式数据
  const searchFormRef = ref<FormInstance>()
  const materialStore = useMaterialStore()
  const router = useRouter()

  const searching = ref(false)
  const showHistory = ref(false)
  const hasSearched = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalResults = ref(0)

  const searchResults = ref<Material[]>([])
  const selectedMaterials = ref<string[]>([])
  const loadingMaterials = ref<string[]>([])

  const advancedOptions = ref<string[]>([])
  const showAgentPanel = ref(false)
  const searchMode = ref<'simple' | 'agent'>('simple')
  const availableAgents = ref<AgentService[]>([])

  // 添加到素材库相关状态
  const addToLibraryDialogVisible = ref(false)
  const addProgressDialogVisible = ref(false)
  const addingToLibrary = ref(false)

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

  // 搜索表单数据
  const searchForm = reactive<SearchForm>({
    keywords: '',
    providers: ['tavily'],
    maxResults: 20,
    searchScope: '',
    filters: {
      type: []
    }
  })

  // Agent表单数据
  const agentForm = reactive<AgentForm>({
    agentType: 'search',
    enableAIEnhancement: true,
    agentConfig: {}
  })

  // 搜索进度
  const searchProgress = reactive<SearchProgress>({
    stage: 'config',
    current: 0,
    total: 100,
    message: '准备搜索...'
  })

  // 搜索配置
  const searchConfig = computed(() => ({
    keywords: searchForm.keywords,
    providers: searchForm.providers,
    searchScope: searchForm.searchScope,
    filters: searchForm.filters
  }))

  // 可用的搜索提供商
  const availableProviders = computed(() => materialStore.providers)

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

  // 搜索历史
  const searchHistory = computed(() => materialStore.searchHistory)

  // 表单验证规则
  const searchRules: FormRules = {
    keywords: [
      { required: true, message: '请输入搜索关键词', trigger: 'blur' },
      { min: 2, max: 100, message: '关键词长度应在 2 到 100 个字符之间', trigger: 'blur' }
    ],
    providers: [{ required: true, message: '请选择至少一个搜索提供商', trigger: 'change' }]
  }

  // 处理搜索模式切换
  const handleModeChange = (mode: 'simple' | 'agent') => {
    searchMode.value = mode
    materialStore.setSearchMode(mode)
    if (mode === 'agent' && availableAgents.value.length === 0) {
      fetchAvailableAgents()
    }
  }

  // 更新Agent配置
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateAgentConfig = (config: Partial<AgentForm>) => {
    Object.assign(agentForm, config)
    console.log('Agent配置已更新:', config)
  }

  // 暂时注释未使用的函数，等AgentPanel组件创建后启用
  // const handleAgentSearch = async (config: AgentSearchConfig) => {
  //   console.log('Agent搜索配置:', config)
  // }

  // 处理Agent搜索
  const handleAgentSearch = async (config: AgentSearchConfig) => {
    searching.value = true
    hasSearched.value = true
    currentPage.value = 1

    try {
      // 更新搜索进度
      updateSearchProgress('config', 0, 100, '配置Agent搜索参数...')

      // 更新搜索进度
      updateSearchProgress('searching', 20, 100, 'Agent正在分析需求...')

      // 模拟Agent搜索
      const result = await materialSearchService.mockSearch({
        keywords: config.keywords,
        providers: config.providers,
        searchScope: config.searchScope,
        filters: config.filters,
        page: currentPage.value,
        pageSize: config.maxResults || 20
      })

      // 更新搜索进度
      updateSearchProgress('processing', 80, 100, 'Agent正在处理搜索结果...')

      // 更新结果
      searchResults.value = result.materials
      totalResults.value = result.total

      // 更新搜索进度
      updateSearchProgress('completed', 100, 100, 'Agent搜索完成')

      ElMessage.success(`Agent找到 ${result.total} 个相关素材`)
    } catch (error) {
      console.error('Agent search error:', error)
      ElMessage.error(error instanceof Error ? error.message : 'Agent搜索失败，请稍后重试')
    } finally {
      searching.value = false
    }
  }

  // 处理搜索
  const handleSearch = async () => {
    if (!searchFormRef.value) return

    try {
      const valid = await searchFormRef.value.validate()
      if (!valid) return

      searching.value = true
      hasSearched.value = true
      currentPage.value = 1

      if (searchMode.value === 'agent') {
        // Agent搜索模式
        const agentConfig: AgentSearchConfig = {
          keywords: searchForm.keywords,
          providers: searchForm.providers,
          searchScope: searchForm.searchScope,
          agentType: agentForm.agentType,
          agentConfig: agentForm.agentConfig,
          filters: searchForm.filters,
          maxResults: searchForm.maxResults,
          enableAIEnhancement: agentForm.enableAIEnhancement
        }

        await handleAgentSearch(agentConfig)
      } else {
        // 简单搜索模式
        // 更新搜索进度
        updateSearchProgress('config', 0, 100, '配置搜索参数...')

        // 构建搜索参数
        const searchParams = {
          keywords: searchForm.keywords,
          providers: searchForm.providers,
          searchScope: searchForm.searchScope,
          filters: searchForm.filters,
          page: currentPage.value,
          pageSize: searchForm.maxResults
        }

        // 更新搜索进度
        updateSearchProgress('searching', 20, 100, '正在搜索素材...')

        // 执行搜索
        const result = await materialSearchService.searchWithSearchTools(searchParams)

        // 更新搜索进度
        updateSearchProgress('processing', 80, 100, '处理搜索结果...')

        // 更新结果
        searchResults.value = result.materials
        totalResults.value = result.total

        // 更新搜索进度
        updateSearchProgress('completed', 100, 100, '搜索完成')

        // 添加到搜索历史
        materialStore.searchMaterials(searchConfig.value)

        ElMessage.success(`找到 ${result.total} 个相关素材`)
      }
    } catch (error) {
      console.error('Search error:', error)
      ElMessage.error(error instanceof Error ? error.message : '搜索失败，请稍后重试')
    } finally {
      searching.value = false
    }
  }

  // 更新搜索进度
  const updateSearchProgress = (
    stage: SearchProgress['stage'],
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
  const cancelSearch = () => {
    searching.value = false
    ElMessage.info('搜索已取消')
  }

  // 重置表单
  const resetForm = () => {
    if (!searchFormRef.value) return

    searchFormRef.value.resetFields()
    searchForm.providers = ['tavily']
    searchForm.maxResults = 20
    searchForm.searchScope = ''
    searchForm.filters.type = []
    advancedOptions.value = []

    // 重置Agent表单
    agentForm.agentType = 'search'
    agentForm.enableAIEnhancement = true
    agentForm.agentConfig = {}

    searchResults.value = []
    selectedMaterials.value = []
    hasSearched.value = false
    showAgentPanel.value = false
  }

  // 使用历史记录
  const useHistoryItem = (item: any) => {
    searchForm.keywords = item.keywords
    searchForm.providers = [...item.providers]
    searchForm.searchScope = item.searchScope || ''
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
      message: '准备添加素材...',
      processed: 0,
      total: selectedMaterials.value.length
    }

    try {
      // 获取选中的素材对象
      const materialsToAdd = selectedMaterials.value
        .map((id) => searchResults.value.find((material) => material.id === id))
        .filter(Boolean) as Material[]

      // 分批处理，避免一次性处理太多素材
      const batchSize = 5
      const batches = []

      for (let i = 0; i < materialsToAdd.length; i += batchSize) {
        batches.push(materialsToAdd.slice(i, i + batchSize))
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]

        // 更新进度
        addProgress.value.message = `正在添加第 ${i + 1}/${batches.length} 批素材...`
        addProgress.value.percentage = Math.round((i / batches.length) * 80)

        // 直接添加素材到store
        materialStore.addMaterials(batch)

        // 同时调用API添加到素材库
        await materialStore.addToLibrary(batch.map((m) => m.id))

        // 更新已处理数量
        addProgress.value.processed += batch.length

        // 添加延迟，让用户看到进度
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // 完成添加
      addProgress.value.percentage = 100
      addProgress.value.message = `成功添加 ${selectedMaterials.value.length} 个素材到素材库`

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
          ElMessage.success(`已添加 ${selectedMaterials.value.length} 个素材到素材库`)
        }
      }, 1500)
    } catch (error) {
      console.error('添加到素材库失败:', error)
      addProgress.value.status = 'exception'
      addProgress.value.message = '添加到素材库失败'

      setTimeout(() => {
        addProgressDialogVisible.value = false
        addingToLibrary.value = false
        ElMessage.error('添加到素材库失败')
      }, 2000)
    }
  }

  // 跳转到素材库
  const goToLibrary = () => {
    // 使用路由跳转到素材管理页面
    router.push('/material/management')
  }

  // 根据ID获取素材
  const getMaterialById = (id: string) => {
    return searchResults.value.find((material) => material.id === id)
  }

  // 预览素材
  const showPreview = (material: Material) => {
    // 实现预览功能
    ElMessage.info(`预览素材: ${material.title}`)
  }

  // 下载素材
  const downloadMaterial = async (material: Material) => {
    if (!material.url) {
      ElMessage.warning('该素材没有可下载的链接')
      return
    }

    try {
      loadingMaterials.value.push(material.id)
      const downloadUrl = await materialSearchService.downloadMaterial(material.id)

      // 创建下载链接
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = material.title || 'material'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      ElMessage.success('下载开始')
    } catch {
      ElMessage.error('下载失败')
    } finally {
      loadingMaterials.value = loadingMaterials.value.filter((id) => id !== material.id)
    }
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

  // 组件挂载时检查搜索工具状态
  onMounted(async () => {
    try {
      console.log('[MaterialSearch] 组件挂载，开始检查搜索工具状态...')
      const status = await materialSearchService.checkSearchToolsStatus()
      console.log('[MaterialSearch] 搜索工具状态检查完成:', status)

      if (!status.tavily_configured && !status.bocha_configured) {
        console.log('[MaterialSearch] 搜索工具未配置，显示警告')
        ElMessage.warning('搜索工具未配置，请联系管理员')
      }

      // 初始化搜索模式
      searchMode.value = materialStore.searchMode
      if (searchMode.value === 'agent') {
        await fetchAvailableAgents()
      }
    } catch (error) {
      console.error('[MaterialSearch] Check search tools status error:', error)
      console.error('[MaterialSearch] 错误详情:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : '未知错误',
        errorType: typeof error,
        isHttpError: error instanceof HttpError
      })
    }
  })
</script>

<style scoped lang="scss">
  .art-material-search {
    width: 100%;

    &__mode-switch {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

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

      .art-material-search__title {
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

    &__provider-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    &__filters {
      .el-form-item {
        margin-bottom: 12px;
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
    .art-material-search {
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
