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
    <div class="selected-materials-section">
      <el-card class="selected-materials-card">
        <template #header>
          <div class="section-header">
            <div class="section-title">
              <el-icon><Collection /></el-icon>
              <span>已选素材 ({{ selectedMaterials.length }})</span>
            </div>
            <div class="section-actions">
              <el-button
                type="primary"
                size="small"
                :disabled="selectedMaterials.length === 0"
                @click="handleGenerateTitles"
                :loading="titleGenerating"
              >
                <el-icon><MagicStick /></el-icon>
                基于素材生成标题
              </el-button>
              <el-button
                size="small"
                :disabled="selectedMaterials.length === 0"
                @click="clearSelectedMaterials"
              >
                <el-icon><Delete /></el-icon>
                清空
              </el-button>
            </div>
          </div>
        </template>

        <!-- 待选素材列表 -->
        <div v-if="selectedMaterials.length > 0" class="selected-materials-list">
          <div class="materials-grid">
            <el-card
              v-for="material in selectedMaterials"
              :key="material.id"
              class="material-item"
              shadow="hover"
            >
              <div class="material-content">
                <div class="material-header">
                  <h4>{{ material.title }}</h4>
                  <el-button text type="danger" size="small" @click="removeMaterial(material.id)">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <p class="material-summary">{{ material.summary }}</p>
                <div class="material-tags">
                  <el-tag
                    v-for="tag in material.tags.slice(0, 3)"
                    :key="tag"
                    size="small"
                    type="info"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <el-empty description="暂无已选素材，请从下方素材库或检索中添加">
            <template #image>
              <el-icon size="64"><Collection /></el-icon>
            </template>
          </el-empty>
        </div>
      </el-card>
    </div>

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
          <div v-if="searchMode === 'library'" class="library-mode">
            <div class="library-filters">
              <el-input
                v-model="libraryFilter.keyword"
                placeholder="搜索素材库..."
                clearable
                @input="handleLibraryFilter"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-select
                v-model="libraryFilter.tag"
                placeholder="选择标签"
                clearable
                style="width: 200px"
              >
                <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
              </el-select>
            </div>
            <div class="library-content">
              <div class="materials-grid">
                <el-card
                  v-for="material in paginatedLibraryMaterials"
                  :key="material.id"
                  class="material-item library-material"
                  shadow="hover"
                  :class="{ selected: isSelected(material.id) }"
                >
                  <div class="material-content">
                    <div class="material-header">
                      <h4>{{ material.title }}</h4>
                      <el-button
                        v-if="!isSelected(material.id)"
                        text
                        type="primary"
                        size="small"
                        @click="addMaterial(material)"
                      >
                        <el-icon><Plus /></el-icon>
                        添加
                      </el-button>
                      <el-tag v-else type="success" size="small">已添加</el-tag>
                    </div>
                    <p class="material-summary">{{ material.summary }}</p>
                    <div class="material-tags">
                      <el-tag
                        v-for="tag in material.tags.slice(0, 3)"
                        :key="tag"
                        size="small"
                        type="info"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </el-card>
              </div>

              <!-- 分页 -->
              <div class="library-pagination">
                <el-pagination
                  v-model:current-page="libraryPagination.page"
                  v-model:page-size="libraryPagination.pageSize"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next"
                  :total="filteredLibraryMaterials.length"
                />
              </div>
            </div>
          </div>

          <!-- 关键词检索模式 -->
          <div v-else-if="searchMode === 'keyword'" class="keyword-mode">
            <el-form :model="keywordForm" label-width="80px">
              <el-form-item label="关键词">
                <el-input
                  v-model="keywordForm.keywords"
                  placeholder="请输入搜索关键词"
                  clearable
                  @keyup.enter="handleKeywordSearch"
                >
                  <template #append>
                    <el-button :icon="Search" @click="handleKeywordSearch" :loading="searching">
                      搜索
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-form>

            <!-- 搜索结果 -->
            <div v-if="searchResults.length > 0" class="search-results">
              <div class="results-header">
                <span>搜索结果 ({{ searchResults.length }})</span>
              </div>
              <div class="materials-grid">
                <el-card
                  v-for="material in searchResults"
                  :key="material.id"
                  class="material-item"
                  shadow="hover"
                >
                  <div class="material-content">
                    <div class="material-header">
                      <h4>{{ material.title }}</h4>
                      <el-button
                        v-if="!isSelected(material.id)"
                        text
                        type="primary"
                        size="small"
                        @click="addMaterial(material)"
                      >
                        <el-icon><Plus /></el-icon>
                        添加
                      </el-button>
                      <el-tag v-else type="success" size="small">已添加</el-tag>
                    </div>
                    <p class="material-summary">{{ material.summary }}</p>
                    <div class="material-tags">
                      <el-tag
                        v-for="tag in material.tags.slice(0, 3)"
                        :key="tag"
                        size="small"
                        type="info"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
          </div>

          <!-- Agent检索模式 -->
          <div v-else-if="searchMode === 'agent'" class="agent-mode">
            <el-form :model="agentForm" label-width="100px">
              <el-form-item label="研究简报">
                <el-input
                  v-model="agentForm.brief"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入研究简报，描述您想要研究的主题、领域或具体问题"
                  maxlength="1000"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleAgentSearch" :loading="searching">
                  开始Agent检索
                </el-button>
              </el-form-item>
            </el-form>

            <!-- Agent搜索进度 -->
            <div v-if="searching" class="agent-progress">
              <el-progress
                :percentage="searchProgress"
                :status="searchProgress === 100 ? 'success' : undefined"
              />
              <p class="progress-text">正在检索素材，请稍候...</p>
            </div>

            <!-- Agent搜索结果 -->
            <div v-if="agentSearchResults.length > 0" class="search-results">
              <div class="results-header">
                <span>检索结果 ({{ agentSearchResults.length }})</span>
              </div>
              <div class="materials-grid">
                <el-card
                  v-for="material in agentSearchResults"
                  :key="material.id"
                  class="material-item"
                  shadow="hover"
                >
                  <div class="material-content">
                    <div class="material-header">
                      <h4>{{ material.title }}</h4>
                      <el-button
                        v-if="!isSelected(material.id)"
                        text
                        type="primary"
                        size="small"
                        @click="addMaterial(material)"
                      >
                        <el-icon><Plus /></el-icon>
                        添加
                      </el-button>
                      <el-tag v-else type="success" size="small">已添加</el-tag>
                    </div>
                    <p class="material-summary">{{ material.summary }}</p>
                    <div class="material-tags">
                      <el-tag
                        v-for="tag in material.tags.slice(0, 3)"
                        :key="tag"
                        size="small"
                        type="info"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    Collection,
    Search,
    Delete,
    Close,
    Refresh,
    Folder,
    EditPen,
    Cpu,
    Plus,
    MagicStick
  } from '@element-plus/icons-vue'
  import type { Material } from '@/types/material'
  import { useMaterialStore } from '@/store/material'
  import { useDocumentGenerateStore } from '@/store/documentGenerate'
  import { useMaterialSearch } from '@/composables/useMaterialSearch'

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
  const libraryFilter = reactive({
    keyword: '',
    tag: ''
  })
  const libraryPagination = reactive({
    page: 1,
    pageSize: 10
  })

  // 关键词搜索表单
  const keywordForm = reactive({
    keywords: ''
  })

  // Agent搜索表单
  const agentForm = reactive({
    brief: props.researchBrief || ''
  })

  // 搜索结果
  const agentSearchResults = ref<Material[]>([])

  // 可用标签
  const availableTags = computed(() => {
    const tags = new Set<string>()
    libraryMaterials.value.forEach((material) => {
      material.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags)
  })

  // 筛选后的素材库
  const filteredLibraryMaterials = computed(() => {
    let filtered = libraryMaterials.value

    if (libraryFilter.keyword) {
      const keyword = libraryFilter.keyword.toLowerCase()
      filtered = filtered.filter(
        (material) =>
          material.title.toLowerCase().includes(keyword) ||
          material.summary.toLowerCase().includes(keyword)
      )
    }

    if (libraryFilter.tag) {
      filtered = filtered.filter((material) => material.tags.includes(libraryFilter.tag))
    }

    return filtered
  })

  // 分页后的素材库
  const paginatedLibraryMaterials = computed(() => {
    const start = (libraryPagination.page - 1) * libraryPagination.pageSize
    const end = start + libraryPagination.pageSize
    return filteredLibraryMaterials.value.slice(start, end)
  })

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
          title: 'AI医疗市场研究报告',
          summary: '2025年中国AI+医疗市场正以年复合增长率58.3%的速度爆发式增长',
          url: 'https://example.com/report1',
          tags: ['AI医疗', '市场研究', '技术突破'],
          createdAt: new Date(),
          score: 0.95,
          key_excerpts: ['市场增长率58.3%', '预计2030年市场规模1200亿元'],
          content: '',
          type: 'report'
        },
        {
          id: 'lib-2',
          title: 'FDA人工智能医疗器械指南',
          summary: 'FDA发布人工智能医疗器械指南草案，提出全生命周期管理框架',
          url: 'https://example.com/guideline',
          tags: ['FDA指南', 'AI医疗器械', '监管政策'],
          createdAt: new Date(),
          score: 0.92,
          key_excerpts: ['生命周期管理', '透明度问题', '偏见风险'],
          content: '',
          type: 'policy'
        }
      ]

      libraryMaterials.value = mockMaterials
      ElMessage.success('素材库已刷新')
    } catch {
      ElMessage.error('刷新素材库失败')
    }
  }

  // 处理素材库筛选
  const handleLibraryFilter = () => {
    libraryPagination.page = 1
  }

  // 处理模式切换
  const handleModeChange = (mode: 'library' | 'keyword' | 'agent') => {
    searchMode.value = mode
    // 重置相关状态
    if (mode === 'keyword') {
      searchResults.value = []
    } else if (mode === 'agent') {
      agentSearchResults.value = []
    }
  }

  // 处理关键词搜索
  const handleKeywordSearch = async () => {
    if (!keywordForm.keywords.trim()) {
      ElMessage.warning('请输入搜索关键词')
      return
    }

    try {
      const config = {
        keywords: keywordForm.keywords,
        providers: ['tavily'] as const,
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
  const handleAgentSearch = async () => {
    if (!agentForm.brief.trim()) {
      ElMessage.warning('请输入研究简报')
      return
    }

    try {
      const config = {
        keywords: agentForm.brief,
        providers: ['tavily'] as const,
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
        materialStore.searchResults
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
      const response = await documentStore.generateTitles()

      if (response) {
        ElMessage.success(`成功生成 ${response.title_count} 个标题`)
        emit('materialsSelected', selectedMaterials.value)
      }
    } catch {
      ElMessage.error('标题生成失败')
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

    .selected-materials-card {
      min-height: 200px;
    }

    .selected-materials-list {
      .materials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
    }

    .empty-state {
      padding: 40px;
      text-align: center;
    }
  }

  .material-item {
    .material-content {
      .material-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 12px;

        h4 {
          flex: 1;
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.4;
          color: var(--el-text-color-primary);
        }
      }

      .material-summary {
        display: -webkit-box;
        margin: 0 0 12px;
        overflow: hidden;
        font-size: 13px;
        line-height: 1.5;
        color: var(--el-text-color-regular);
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .material-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
    }

    &.library-material {
      &.selected {
        background-color: var(--el-color-success-light-9);
        border-color: var(--el-color-success);
      }
    }
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

    .library-mode {
      .library-filters {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
      }

      .library-content {
        .materials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .library-pagination {
          display: flex;
          justify-content: center;
        }
      }
    }

    .keyword-mode,
    .agent-mode {
      .search-results {
        margin-top: 20px;

        .results-header {
          margin-bottom: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .materials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
      }

      .agent-progress {
        padding: 20px;
        text-align: center;

        .progress-text {
          margin: 12px 0 0;
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  @media (width <= 1200px) {
    .materials-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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

    .materials-grid {
      grid-template-columns: 1fr;
    }

    .library-filters {
      flex-direction: column;
    }
  }
</style>
