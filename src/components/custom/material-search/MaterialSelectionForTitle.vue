<template>
  <div class="material-selection-container">
    <!-- 页面头部 -->
    <div class="material-selection-header">
      <div class="header-info">
        <h2>标题生成 - 素材选择</h2>
        <p>为标题生成选择合适的素材，构建高质量的报道基础</p>
      </div>
      <div class="header-actions">
        <el-button size="small" @click="$emit('close')">返回</el-button>
      </div>
    </div>

    <!-- 核心区域：待选素材展示区 -->
    <SelectedMaterialsSection
      :selected-materials="selectedMaterials"
      :loading="titleGenerating"
      @generate-titles="handleGenerateTitles"
      @clear-all="clearSelectedMaterials"
      @remove-material="removeMaterial"
    />

    <!-- 检索区域 -->
    <div class="search-section">
      <el-card class="search-card">
        <template #header>
          <div class="section-header">
            <div class="section-title">
              <el-icon><Search /></el-icon>
              <span>素材检索</span>
            </div>
            <div class="section-actions">
              <el-button size="small" @click="refreshLibrary">
                <el-icon><Refresh /></el-icon>
                刷新素材库
              </el-button>
            </div>
          </div>
        </template>

        <!-- 检索模式切换 -->
        <div class="search-mode-switch">
          <el-radio-group v-model="searchMode" @change="handleModeChange">
            <el-radio-button value="library">
              <el-icon><Folder /></el-icon>
              素材库
            </el-radio-button>
            <el-radio-button value="keyword">
              <el-icon><EditPen /></el-icon>
              关键词检索
            </el-radio-button>
            <el-radio-button value="agent">
              <el-icon><Cpu /></el-icon>
              Agent检索
            </el-radio-button>
          </el-radio-group>
        </div>

        <!-- 检索内容区域 -->
        <div class="search-content">
          <!-- 素材库模式 -->
          <MaterialLibrary
            v-if="searchMode === 'library'"
            :materials="libraryMaterials"
            :available-tags="availableTags"
            :is-selected="isSelected"
            @add-material="addMaterial"
          />

          <!-- 关键词检索模式 -->
          <KeywordSearch
            v-else-if="searchMode === 'keyword'"
            :results="searchResults"
            :is-selected="isSelected"
            :loading="searching"
            @search="handleKeywordSearch"
            @add-material="addMaterial"
          />

          <!-- Agent检索模式 -->
          <AgentSearch
            v-else-if="searchMode === 'agent'"
            :results="agentSearchResults"
            :is-selected="isSelected"
            :loading="searching"
            :progress="searchProgress"
            @search="handleAgentSearch"
            @add-material="addMaterial"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Search, Refresh, Folder, EditPen, Cpu } from '@element-plus/icons-vue'
  import type { Material } from '@/types/material'
  import { useMaterialStore } from '@/store/material'
  import { useDocumentGenerateStore } from '@/store/documentGenerate'
  import { useMaterialSearch } from '@/composables/material/useMaterialSearch'

  // 子组件
  import SelectedMaterialsSection from './material-selection/SelectedMaterialsSection.vue'
  import MaterialLibrary from './material-selection/MaterialLibrary.vue'
  import KeywordSearch from './material-selection/KeywordSearch.vue'
  import AgentSearch from './material-selection/AgentSearch.vue'

  // Props
  interface Props {
    researchBrief?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    researchBrief: ''
  })

  // Emits
  const emit = defineEmits<{
    close: []
    materialsSelected: [materials: Material[]]
  }>()

  // Store
  const materialStore = useMaterialStore()
  const documentStore = useDocumentGenerateStore()

  // 公共搜索逻辑
  const { searching, searchResults, searchProgress, searchWithSearchTools, executeAgentSearch } =
    useMaterialSearch()

  // 响应式数据
  const selectedMaterials = ref<Material[]>([])
  const searchMode = ref<'library' | 'keyword' | 'agent'>('library')
  const titleGenerating = ref(false)

  // 素材库相关
  const libraryMaterials = ref<Material[]>([])
  const availableTags = computed(() => {
    const tags = new Set<string>()
    libraryMaterials.value.forEach((material) => {
      material.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags)
  })

  // 搜索结果
  const agentSearchResults = ref<Material[]>([])

  // 检查素材是否已选中
  const isSelected = (materialId: string) => {
    return selectedMaterials.value.some((m) => m.id === materialId)
  }

  // 添加素材到待选列表
  const addMaterial = (material: Material) => {
    if (isSelected(material.id)) {
      ElMessage.warning('素材已在待选列表中')
      return
    }

    selectedMaterials.value.push(material)
    ElMessage.success('已添加到待选素材')
  }

  // 从待选列表移除素材
  const removeMaterial = (materialId: string) => {
    const index = selectedMaterials.value.findIndex((m) => m.id === materialId)
    if (index > -1) {
      selectedMaterials.value.splice(index, 1)
      ElMessage.success('已从待选素材中移除')
    }
  }

  // 清空已选素材
  const clearSelectedMaterials = () => {
    selectedMaterials.value = []
    ElMessage.success('已清空所有已选素材')
  }

  // 刷新素材库
  const refreshLibrary = async () => {
    try {
      // 这里应该调用获取素材库的API
      // 暂时使用模拟数据
      const mockMaterials: Material[] = [
        {
          id: 'lib-1',
          user_id: 'system',
          title: 'AI医疗市场研究报告',
          summary: '2025年中国AI+医疗市场正以年复合增长率58.3%的速度爆发式增长',
          url: 'https://example.com/report1',
          tags: ['AI医疗', '市场研究', '技术突破'],
          createdAt: new Date(),
          score: 0.95,
          key_excerpts: ['市场增长率58.3%', '预计2030年市场规模1200亿元']
        },
        {
          id: 'lib-2',
          user_id: 'system',
          title: 'FDA人工智能医疗器械指南',
          summary: 'FDA发布人工智能医疗器械指南草案，提出全生命周期管理框架',
          url: 'https://example.com/guideline',
          tags: ['FDA指南', 'AI医疗器械', '监管政策'],
          createdAt: new Date(),
          score: 0.92,
          key_excerpts: ['生命周期管理', '透明度问题', '偏见风险']
        }
      ]

      libraryMaterials.value = mockMaterials
      ElMessage.success('素材库已刷新')
    } catch {
      ElMessage.error('刷新素材库失败')
    }
  }

  // 处理模式切换
  const handleModeChange = (val: any) => {
    const mode = val as 'library' | 'keyword' | 'agent'
    searchMode.value = mode
    // 重置相关状态
    if (mode === 'keyword') {
      searchResults.value = []
    } else if (mode === 'agent') {
      agentSearchResults.value = []
    }
  }

  // 处理关键词搜索
  const handleKeywordSearch = async (keywords: string) => {
    try {
      const config = {
        keywords,
        providers: ['tavily'] as string[],
        searchScope: '',
        filters: { tags: [] }
      }

      await searchWithSearchTools(config)
      ElMessage.success('搜索完成')
    } catch {
      ElMessage.error('搜索失败')
    }
  }

  // 处理Agent搜索
  const handleAgentSearch = async (brief: string) => {
    try {
      const config = {
        keywords: brief,
        providers: ['tavily'] as string[],
        searchScope: '',
        agentType: 'search' as const,
        agentConfig: {
          maxConcurrentResearchUnits: 5,
          maxResearcherIterations: 3
        },
        filters: { tags: [] },
        maxResults: 20
      }

      await executeAgentSearch(config)

      // 转换搜索结果为Material格式
      agentSearchResults.value = materialStore.transformSearchResultsToMaterials(
        searchResults.value
      )

      ElMessage.success('Agent检索完成')
    } catch {
      ElMessage.error('Agent检索失败')
    }
  }

  // 基于素材生成标题
  const handleGenerateTitles = async () => {
    if (selectedMaterials.value.length === 0) {
      ElMessage.warning('请先选择素材')
      return
    }

    // 检查研究简报
    const researchBrief = props.researchBrief || documentStore.documentState.researchBrief
    if (!researchBrief) {
      ElMessage.warning('缺少研究简报，请先完善需求')
      return
    }

    try {
      titleGenerating.value = true

      // 转换素材为搜索结果格式
      const searchResults = selectedMaterials.value.map((material) => ({
        url: material.url || '',
        score: material.score || 0,
        query: material.title,
        aititle: material.title,
        summary: material.summary,
        tags: material.tags,
        key_excerpts: material.key_excerpts || [],
        published_date: material.createdAt?.toISOString() || null
      }))

      // 更新documentStore的搜索结果
      documentStore.updateSearchResults(searchResults)

      // 调用title API生成标题
      const response = await documentStore.generateTitles(researchBrief, searchResults)

      if (response) {
        ElMessage.success(`成功生成 ${response.title_count} 个标题`)
        // 直接关闭对话框，Store状态变化会自动更新父组件UI
        emit('close')
      }
    } catch (error: any) {
      ElMessage.error(error?.message || '标题生成失败')
    } finally {
      titleGenerating.value = false
    }
  }

  // 组件挂载时加载素材库
  onMounted(() => {
    refreshLibrary()
  })
</script>

<style scoped lang="scss">
  .material-selection-container {
    max-width: 1400px;
    padding: 20px;
    margin: 0 auto;
  }

  .material-selection-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;

    .header-info {
      h2 {
        margin: 0 0 8px;
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .section-title {
      display: flex;
      gap: 8px;
      align-items: center;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .el-icon {
        color: var(--el-color-primary);
      }
    }

    .section-actions {
      display: flex;
      gap: 8px;
    }
  }

  .selected-materials-section {
    margin-bottom: 30px;
  }

  .search-section {
    .search-card {
      .search-mode-switch {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;

        .el-radio-group {
          :deep(.el-radio-button__inner) {
            display: flex;
            gap: 4px;
            align-items: center;
          }
        }
      }

      .search-content {
        min-height: 400px;
      }
    }
  }

  @media (width <= 768px) {
    .material-selection-container {
      padding: 15px;
    }

    .material-selection-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;

      .header-info {
        h2 {
          font-size: 20px;
        }
      }
    }
  }
</style>
