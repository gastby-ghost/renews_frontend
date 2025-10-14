<template>
  <div class="title-selection-container">
    <ArtTableHeader title="标题生成模块" :actions="headerActions" @back="goBack" />

    <div class="step-indicator">
      <div class="step-item completed">
        <div class="step-number">✓</div>
        <div class="step-label">需求</div>
      </div>
      <div class="step-connector completed"></div>
      <div class="step-item active">
        <div class="step-number">2</div>
        <div class="step-label">标题</div>
      </div>
      <div class="step-connector"></div>
      <div class="step-item">
        <div class="step-number">3</div>
        <div class="step-label">大纲</div>
      </div>
      <div class="step-connector"></div>
      <div class="step-item">
        <div class="step-number">4</div>
        <div class="step-label">正文</div>
      </div>
    </div>

    <!-- 标题素材区 -->
    <div class="title-material-section">
      <div class="section-header" @click="toggleMaterialsCollapse">
        <h3>
          <el-icon><Document /></el-icon>
          标题素材管理
          <span class="collapse-icon" :class="{ collapsed: isMaterialsCollapsed }">▼</span>
        </h3>
        <el-tag type="info">{{ materials.length }} 个素材</el-tag>
      </div>
      
      <div class="section-content" :class="{ collapsed: isMaterialsCollapsed }">
        <div class="materials-actions">
          <el-button 
            class="ai-retrieve-btn" 
            @click="handleAiRetrieveMaterials" 
            :loading="isRetrieving"
            type="primary"
          >
            <span>{{ isRetrieving ? '正在检索...' : 'AI自动检索' }}</span>
          </el-button>
          <el-button 
            class="manual-select-btn" 
            @click="handleManualSelectMaterials"
            type="success"
            plain
          >
            <el-icon><DocumentAdd /></el-icon>
            手动选择素材
          </el-button>
        </div>
        
        <div v-if="materials.length > 0" class="materials-grid">
          <div v-for="material in materials" :key="material.id" class="material-card">
            <div class="material-card-header">
              <h4 class="material-title">{{ material.title }}</h4>
              <el-button 
                type="danger" 
                size="small" 
                @click="handleRemoveMaterial(material.id)"
                link
              >
                删除
              </el-button>
            </div>
            <p class="material-summary">{{ material.summary || material.content?.substring(0, 100) + '...' }}</p>
            <div class="material-meta">
              <el-tag 
                size="small"
                effect="plain"
              >
                {{ material.source }}
              </el-tag>
              <span class="material-date">{{ formatDate(material.createdAt) }}</span>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-materials">
          <el-icon size="48"><FolderOpened /></el-icon>
          <h3>暂无素材</h3>
          <p>点击"AI自动检索"或"手动选择素材"来添加素材</p>
        </div>
      </div>
    </div>

    <!-- 标题生成区 -->
    <div class="title-generation-section">
      <!-- 素材权重设置区 -->
      <div v-if="boundMaterials.length > 0" class="materials-weight-section">
        <h4 class="section-title">
          <el-icon><Setting /></el-icon>
          素材权重设置
        </h4>
        <div class="materials-list">
          <div v-for="material in boundMaterials" :key="material.id" class="material-item">
            <div class="material-info">
              <span class="material-title">{{ material.title }}</span>
              <el-tag 
                size="small"
                effect="plain"
              >
                {{ material.source }}
              </el-tag>
            </div>
            <div class="weight-control">
              <el-slider
                v-model="material.weight"
                :min="0"
                :max="100"
                :step="10"
                @change="updateMaterialWeight(material.id, material.weight || 0)"
                style="width: 100px"
              />
              <span class="weight-value">{{ material.weight }}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 标题生成设置 -->
      <div class="generation-settings">
        <div class="setting-item">
          <label class="setting-label">标题风格:</label>
          <el-select 
            v-model="titleStyle"
            @change="updateTitleStyle"
            placeholder="选择标题风格"
            style="width: 120px"
          >
            <el-option label="正式" value="正式" />
            <el-option label="轻松" value="轻松" />
            <el-option label="创意" value="创意" />
            <el-option label="专业" value="专业" />
            <el-option label="简洁" value="简洁" />
          </el-select>
        </div>
        
        <el-button 
          class="generate-btn"
          @click="handleGenerateTitles"
          :loading="isGenerating"
          :disabled="boundMaterials.length === 0"
          type="primary"
          size="large"
        >
          <span>{{ isGenerating ? '生成中...' : '生成标题' }}</span>
        </el-button>
      </div>
      
      <!-- 标题展示区 -->
      <div v-if="generatedTitles.length > 0" class="titles-display">
        <h4 class="section-title">
          生成的标题选项
        </h4>
        <div class="titles-grid">
          <div 
            v-for="title in generatedTitles"
            :key="title.id"
            class="title-card"
            :class="{ 'selected': selectedTitle === title.text }"
            @click="handleSelectTitle(title)"
          >
            <div class="title-content">
              <h5 class="title-text">{{ title.text }}</h5>
              <p class="title-meta">基于 {{ title.materialCount }} 个素材生成</p>
            </div>
            <div class="title-actions">
              <el-button 
                type="info"
                size="small"
                @click.stop="handleAnalyzeTitle(title)"
                plain
              >
                <el-icon><DataAnalysis /></el-icon>
                分析
              </el-button>
              <el-button 
                :type="selectedTitle === title.text ? 'success' : 'primary'"
                size="small"
                @click.stop="handleSelectTitle(title)"
                :disabled="selectedTitle === title.text"
              >
                {{ selectedTitle === title.text ? '已选择' : '选择' }}
              </el-button>
            </div>
          </div>
        </div>
        
        <div class="more-options">
          <el-button 
            @click="handleGenerateTitles"
            :loading="isGenerating"
            plain
          >
            生成更多选项
          </el-button>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="boundMaterials.length === 0" class="empty-state">
        <el-icon size="48"><EditPen /></el-icon>
        <h3>请先添加素材</h3>
        <p>添加素材后，AI将基于素材为您生成标题选项</p>
      </div>
    </div>

    <div class="navigation-actions">
      <el-button @click="goBack" size="large">返回需求</el-button>
      <el-button
        type="success"
        size="large"
        @click="confirmTitle"
        :disabled="!selectedTitle"
      >
        确认标题并继续
      </el-button>
    </div>

    <!-- 手动选择素材对话框 -->
    <el-dialog
      v-model="showManualSelectionDialog"
      title="手动选择素材"
      width="90%"
      :before-close="closeManualSelectionDialog"
      class="material-selection-dialog"
    >
      <div class="dialog-content">
        <div class="search-section">
          <div class="search-filters">
            <div class="search-keywords">
              <label>关键词:</label>
              <el-input 
                v-model="searchKeywords"
                placeholder="输入搜索关键词"
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </div>
            <el-button 
              type="primary"
              @click="handleSearch"
              :loading="isSearching"
            >
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </div>
        </div>
        
        <div class="materials-grid-dialog">
          <!-- 主流媒体列 -->
          <div class="material-column">
            <div class="column-header">
              <h4>主流媒体</h4>
              <el-tag type="success">{{ mainstreamMaterials.length }}</el-tag>
            </div>
            <div class="column-content">
              <div 
                v-for="material in mainstreamMaterials"
                :key="material.id"
                class="material-card-dialog"
                :class="{ 'selected': selectedMaterialIds.includes(material.id) }"
                @click="toggleMaterialSelection(material)"
              >
                <div class="material-card-header">
                  <el-checkbox 
                    :model-value="selectedMaterialIds.includes(material.id)"
                    @click.stop
                  />
                  <el-tag type="success" size="small">主流媒体</el-tag>
                </div>
                <h5 class="material-card-title">{{ material.title }}</h5>
                <p class="material-card-summary">{{ material.summary || material.content?.substring(0, 100) + '...' }}</p>
                <div class="material-card-meta">
                  <span class="reliability">可靠性: {{ '★'.repeat(material.reliability || 4) }}</span>
                  <span class="date">{{ formatDate(material.createdAt) }}</span>
                </div>
              </div>
              
              <div v-if="mainstreamMaterials.length === 0" class="column-empty">
                暂无主流媒体素材
              </div>
            </div>
          </div>
          
          <!-- 外部检索列 -->
          <div class="material-column">
            <div class="column-header">
              <h4>外部检索</h4>
              <el-tag type="warning">{{ externalMaterials.length }}</el-tag>
            </div>
            <div class="column-content">
              <div 
                v-for="material in externalMaterials"
                :key="material.id"
                class="material-card-dialog"
                :class="{ 'selected': selectedMaterialIds.includes(material.id) }"
                @click="toggleMaterialSelection(material)"
              >
                <div class="material-card-header">
                  <el-checkbox 
                    :model-value="selectedMaterialIds.includes(material.id)"
                    @click.stop
                  />
                  <el-tag type="warning" size="small">外部</el-tag>
                </div>
                <h5 class="material-card-title">{{ material.title }}</h5>
                <p class="material-card-summary">{{ material.summary || material.content?.substring(0, 100) + '...' }}</p>
                <div class="material-card-meta">
                  <span class="reliability">可靠性: {{ '★'.repeat(material.reliability || 3) }}</span>
                  <span class="date">{{ formatDate(material.createdAt) }}</span>
                </div>
              </div>
              
              <div v-if="externalMaterials.length === 0" class="column-empty">
                暂无外部检索素材
              </div>
            </div>
          </div>
          
          <!-- 本地上传列 -->
          <div class="material-column">
            <div class="column-header">
              <h4>本地上传</h4>
              <el-tag type="info">{{ localMaterials.length }}</el-tag>
              <el-button 
                size="small" 
                type="primary" 
                @click="triggerFileUpload"
              >
                上传
              </el-button>
              <input 
                ref="fileInput"
                type="file" 
                accept=".md,.txt"
                multiple
                @change="handleFileUpload"
                style="display: none;"
              />
            </div>
            <div class="column-content">
              <div 
                v-for="material in localMaterials"
                :key="material.id"
                class="material-card-dialog"
                :class="{ 'selected': selectedMaterialIds.includes(material.id) }"
                @click="toggleMaterialSelection(material)"
              >
                <div class="material-card-header">
                  <el-checkbox 
                    :model-value="selectedMaterialIds.includes(material.id)"
                    @click.stop
                  />
                  <el-tag type="info" size="small">本地</el-tag>
                </div>
                <h5 class="material-card-title">{{ material.title }}</h5>
                <p class="material-card-summary">{{ material.summary || material.content?.substring(0, 100) + '...' }}</p>
                <div class="material-card-meta">
                  <span class="file-size">{{ material.fileSize || '未知大小' }}</span>
                  <span class="date">{{ formatDate(material.createdAt) }}</span>
                </div>
              </div>
              
              <div v-if="localMaterials.length === 0" class="column-empty">
                <div class="upload-area" @drop="handleDrop" @dragover.prevent>
                  <p>拖拽文件到此处</p>
                  <p>或点击"上传"按钮</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <div class="selection-info">
            已选择 {{ selectedMaterialIds.length }} 个素材
          </div>
          <div class="action-buttons">
            <el-button @click="closeManualSelectionDialog">取消</el-button>
            <el-button 
              type="primary"
              @click="handleAddMaterials"
              :disabled="selectedMaterialIds.length === 0"
            >
              添加到标题区
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
    
    <!-- 标题分析面板 -->
    <el-dialog
      v-model="showAnalysisPanel"
      title="标题分析"
      width="80%"
      :before-close="closeAnalysisPanel"
      class="analysis-panel"
    >
      <div v-if="analyzingTitle" class="panel-body">
        <!-- 分析中的标题 -->
        <div class="analyzed-title">
          <h4>{{ analyzingTitle }}</h4>
        </div>
        
        <!-- 关键词提取 -->
        <div class="analysis-section">
          <h5>关键词提取</h5>
          <div class="keywords-cloud">
            <el-tag 
              v-for="keyword in analysisData.keywords"
              :key="keyword"
              type="primary"
              effect="plain"
              @click="highlightKeyword(keyword)"
            >
              {{ keyword }}
            </el-tag>
          </div>
        </div>
        
        <!-- 情感倾向分析 -->
        <div class="analysis-section">
          <h5>情感倾向</h5>
          <div class="sentiment-analysis">
            <el-progress 
              :percentage="analysisData.sentiment.positive" 
              color="#67C23A"
              :show-text="false"
            />
            <div class="sentiment-labels">
              <span>积极 {{ analysisData.sentiment.positive }}%</span>
              <span>中性 {{ analysisData.sentiment.neutral }}%</span>
              <span>消极 {{ analysisData.sentiment.negative }}%</span>
            </div>
          </div>
        </div>
        
        <!-- 吸引力评分 -->
        <div class="analysis-section">
          <h5>吸引力评分</h5>
          <div class="attractiveness-score">
            <div class="score-display">
              <div class="score-number">{{ analysisData.attractiveness }}</div>
              <div class="score-max">/100</div>
            </div>
            <el-rate 
              :model-value="Math.floor(analysisData.attractiveness / 20)" 
              disabled 
              show-score
              text-color="#ff9900"
            />
            <div class="score-description">
              {{ getScoreDescription(analysisData.attractiveness) }}
            </div>
          </div>
        </div>
        
        <!-- SEO优化建议 -->
        <div class="analysis-section">
          <h5>SEO优化建议</h5>
          <div class="seo-suggestions">
            <div 
              v-for="(suggestion, index) in analysisData.seoSuggestions"
              :key="index"
              class="suggestion-item"
            >
              <el-checkbox 
                v-model="selectedSuggestions[index]"
              />
              <label class="suggestion-label">
                {{ suggestion }}
              </label>
              <el-button 
                size="small"
                type="primary"
                @click="applySingleSuggestion(suggestion)"
                plain
              >
                应用
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="panel-footer">
          <el-button 
            type="success"
            @click="applySelectedSuggestions"
            :disabled="!hasSelectedSuggestions"
          >
            应用选中的建议 ({{ selectedCount }})
          </el-button>
          <el-button @click="closeAnalysisPanel">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 素材抽屉组件 -->
    <MaterialDrawer
      v-model:selected-materials="selectedMaterials"
      @material-selected="handleMaterialSelected"
      @material-dragged="handleMaterialDragged"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { syncProjectToList } from '@/utils/project/projectSync'
  import { 
    Document, DocumentAdd, Setting, 
    DataAnalysis, EditPen, FolderOpened, Search 
  } from '@element-plus/icons-vue'
  import MaterialDrawer from '@/components/custom/material-drawer/MaterialDrawer.vue'
  import type { Material } from '@/types/material'

  interface GeneratedTitle {
    id: number
    text: string
    materialCount: number
    score?: number
    attractiveness?: string
    relevance?: string
    uniqueness?: string
    keywords?: string[]
    advantages?: string[]
    description?: string
  }

  interface AnalysisData {
    keywords: string[]
    sentiment: {
      positive: number
      neutral: number
      negative: number
    }
    attractiveness: number
    seoSuggestions: string[]
  }

  const router = useRouter()
  const route = useRoute()

  const projectId = route.params.projectId as string

  // 素材管理相关状态
  const materials = ref<Material[]>([])
  const boundMaterials = ref<Material[]>([])
  const isMaterialsCollapsed = ref(false)
  const isRetrieving = ref(false)

  // 标题生成相关状态
  const generatedTitles = ref<GeneratedTitle[]>([])
  const selectedTitle = ref('')
  const titleStyle = ref('正式')
  const isGenerating = ref(false)

  // 手动选择素材相关状态
  const showManualSelectionDialog = ref(false)
  const searchKeywords = ref('')
  const isSearching = ref(false)
  const selectedMaterialIds = ref<string[]>([])
  const mainstreamMaterials = ref<Material[]>([])
  const externalMaterials = ref<Material[]>([])
  const localMaterials = ref<Material[]>([])
  const fileInput = ref<HTMLInputElement>()

  // 标题分析相关状态
  const showAnalysisPanel = ref(false)
  const analysisData = ref<AnalysisData>({
    keywords: [],
    sentiment: { positive: 0, neutral: 0, negative: 0 },
    attractiveness: 0,
    seoSuggestions: []
  })
  const analyzingTitle = ref('')
  const selectedSuggestions = ref<Record<number, boolean>>({})

  // 兼容旧版本的状态
  const selectedMaterials = ref<Material[]>([])

  // 计算属性
  const selectedCount = computed(() => {
    return Object.values(selectedSuggestions.value).filter(Boolean).length
  })

  const hasSelectedSuggestions = computed(() => {
    return selectedCount.value > 0
  })

  onMounted(() => {
    loadExistingData()
    initializeMockData()
  })

  const loadExistingData = () => {
    // Load existing requirements
    const requirementsData = localStorage.getItem(`project_${projectId}_requirements`)
    if (requirementsData) {
      const { requirements } = JSON.parse(requirementsData)
      // 从需求中提取关键信息用于AI检索
      console.log('加载需求数据:', requirements)
    }

    // Load existing materials
    const materialsData = localStorage.getItem(`project_${projectId}_materials`)
    if (materialsData) {
      materials.value = JSON.parse(materialsData)
      updateBoundMaterials()
    }

    // Load existing titles
    const titlesData = localStorage.getItem(`project_${projectId}_titles`)
    if (titlesData) {
      const { titles, selectedTitle: selected } = JSON.parse(titlesData)
      generatedTitles.value = titles || []
      selectedTitle.value = selected || ''
    }
  }

  const initializeMockData = () => {
    // 初始化模拟数据
    mainstreamMaterials.value = [
      {
        id: 'ms-1',
        title: '人工智能在内容创作中的应用前景',
        content: '探讨AI技术在内容创作领域的应用现状和未来发展趋势...',
        summary: '探讨AI技术在内容创作领域的应用现状和未来发展趋势',
        source: '主流媒体',
        type: 'text' as const,
        reliability: 5,
        tags: ['主流媒体', 'AI', '内容创作'],
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'ms-2',
        title: '智能编辑器的技术架构分析',
        content: '深入分析智能编辑器的系统架构、核心模块和技术实现方案...',
        summary: '深入分析智能编辑器的系统架构、核心模块和技术实现方案',
        source: '主流媒体',
        type: 'text' as const,
        reliability: 4,
        tags: ['主流媒体', '编辑器', '技术架构'],
        createdAt: new Date('2024-01-10')
      }
    ]
    
    externalMaterials.value = [
      {
        id: 'ext-1',
        title: 'AI驱动的创作工具市场调研',
        content: '对当前市场上AI驱动创作工具的调研报告和竞品分析...',
        summary: '对当前市场上AI驱动创作工具的调研报告和竞品分析',
        source: '外部',
        type: 'text' as const,
        reliability: 3,
        tags: ['外部', 'AI工具', '市场调研'],
        createdAt: new Date('2024-01-12')
      }
    ]
  }

  // 素材管理方法
  const toggleMaterialsCollapse = () => {
    isMaterialsCollapsed.value = !isMaterialsCollapsed.value
  }

  const handleAiRetrieveMaterials = async () => {
    isRetrieving.value = true
    
    try {
      // 模拟AI检索过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const aiMaterials: Material[] = [
        {
          id: 'ai-' + Date.now() + '-1',
          title: '人工智能在内容创作中的应用研究',
          content: '探讨AI技术在内容创作领域的应用现状和发展趋势...',
          summary: '探讨AI技术在内容创作领域的应用现状和发展趋势',
          source: '主流媒体',
          type: 'text' as const,
          reliability: 5,
          tags: ['主流媒体', 'AI', '内容创作'],
          createdAt: new Date(),
          weight: 100
        },
        {
          id: 'ai-' + Date.now() + '-2',
          title: '智能编辑器的技术架构设计',
          content: '分析智能编辑器的系统架构和技术实现方案...',
          summary: '分析智能编辑器的系统架构和技术实现方案',
          source: '主流媒体',
          type: 'text' as const,
          reliability: 4,
          tags: ['主流媒体', '编辑器', '技术架构'],
          createdAt: new Date(),
          weight: 100
        }
      ]
      
      addMaterials(aiMaterials)
      ElMessage.success('AI检索成功！已添加 ' + aiMaterials.length + ' 个素材')
      
    } catch (error) {
      console.error('AI检索素材失败:', error)
      ElMessage.error('AI检索素材失败，请重试')
    } finally {
      isRetrieving.value = false
    }
  }

  const handleManualSelectMaterials = () => {
    showManualSelectionDialog.value = true
    selectedMaterialIds.value = []
  }

  const handleRemoveMaterial = (materialId: string) => {
    materials.value = materials.value.filter(m => m.id !== materialId)
    updateBoundMaterials()
    ElMessage.success('素材已删除')
  }

  const addMaterials = (newMaterials: Material[]) => {
    newMaterials.forEach(material => {
      if (!materials.value.find(m => m.id === material.id)) {
        materials.value.push({
          ...material,
          weight: material.weight || 100,
          isBound: true
        })
      }
    })
    updateBoundMaterials()
    // 保存到localStorage
    localStorage.setItem(`project_${projectId}_materials`, JSON.stringify(materials.value))
  }

  const updateBoundMaterials = () => {
    boundMaterials.value = materials.value.filter(m => m.isBound !== false)
  }

  const updateMaterialWeight = (materialId: string, weight: number) => {
    const material = materials.value.find(m => m.id === materialId)
    if (material) {
      material.weight = weight
    }
  }

  const updateTitleStyle = (style: string) => {
    titleStyle.value = style
    ElMessage.success('标题风格已更改为: ' + style)
  }

  // 标题生成方法
  const handleGenerateTitles = async () => {
    if (boundMaterials.value.length === 0) {
      ElMessage.warning('请先添加素材')
      return
    }
    
    isGenerating.value = true
    
    try {
      // 模拟生成过程
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const titles: GeneratedTitle[] = [
        { 
          id: Date.now() + 1, 
          text: 'AI驱动的内容创作编辑器：功能设计与实现', 
          materialCount: boundMaterials.value.length 
        },
        { 
          id: Date.now() + 2, 
          text: '基于AI的内容创作编辑器架构设计', 
          materialCount: boundMaterials.value.length 
        },
        { 
          id: Date.now() + 3, 
          text: '智能内容创作编辑器的核心功能分析', 
          materialCount: boundMaterials.value.length 
        },
        { 
          id: Date.now() + 4, 
          text: 'AI辅助内容创作的技术实现方案', 
          materialCount: boundMaterials.value.length 
        },
        { 
          id: Date.now() + 5, 
          text: '内容创作编辑器的AI功能模块设计', 
          materialCount: boundMaterials.value.length 
        }
      ]
      
      generatedTitles.value = titles
      ElMessage.success('标题生成成功！已生成 ' + titles.length + ' 个标题选项')
      
    } catch (error) {
      console.error('生成标题失败:', error)
      ElMessage.error('生成标题失败，请重试')
    } finally {
      isGenerating.value = false
    }
  }

  const handleSelectTitle = (title: GeneratedTitle) => {
    selectedTitle.value = title.text
    ElMessage.success('已选择标题: ' + title.text)
    
    // 将绑定的素材添加到素材管理区（这里已经在materials中了）
    // 保存选择的标题
    const titleData = {
      titles: generatedTitles.value,
      selectedTitle: title.text,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(`project_${projectId}_titles`, JSON.stringify(titleData))
    
    // 同步项目状态到列表
    syncProjectToList(projectId)
  }

  // 标题分析方法
  const handleAnalyzeTitle = async (title: GeneratedTitle) => {
    analyzingTitle.value = title.text
    showAnalysisPanel.value = true
    
    try {
      // 模拟分析过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      analysisData.value = {
        keywords: ['AI', '内容创作', '编辑器', '功能设计', '技术实现', '智能', '架构', '模块'],
        sentiment: { positive: 75, neutral: 20, negative: 5 },
        attractiveness: 85,
        seoSuggestions: [
          '标题长度适中，适合SEO',
          '包含核心关键词"AI"和"内容创作"',
          '建议在标题开头添加数字吸引注意力',
          '可以考虑加入年份信息增加时效性',
          '标题结构清晰，易于理解'
        ]
      }
      
      selectedSuggestions.value = {}
      
    } catch (error) {
      console.error('分析标题失败:', error)
      ElMessage.error('分析标题失败，请重试')
    }
  }

  const closeAnalysisPanel = () => {
    showAnalysisPanel.value = false
    analysisData.value = {
      keywords: [],
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      attractiveness: 0,
      seoSuggestions: []
    }
    analyzingTitle.value = ''
    selectedSuggestions.value = {}
  }

  const getScoreDescription = (score: number) => {
    if (score >= 80) return '优秀 - 标题具有很强的吸引力'
    if (score >= 60) return '良好 - 标题具有较好的吸引力'
    if (score >= 40) return '一般 - 标题吸引力中等'
    if (score >= 20) return '较差 - 标题吸引力较弱'
    return '很差 - 标题需要大幅改进'
  }

  const highlightKeyword = (keyword: string) => {
    console.log('高亮关键词:', keyword)
  }

  const applySingleSuggestion = (suggestion: string) => {
    ElMessage.success('已应用建议: ' + suggestion)
    closeAnalysisPanel()
  }

  const applySelectedSuggestions = () => {
    const suggestions: string[] = []
    Object.keys(selectedSuggestions.value).forEach(index => {
      if (selectedSuggestions.value[Number(index)]) {
        suggestions.push(analysisData.value.seoSuggestions[Number(index)])
      }
    })
    
    if (suggestions.length > 0) {
      ElMessage.success('已应用 ' + suggestions.length + ' 个建议')
      closeAnalysisPanel()
    }
  }

  // 手动选择素材对话框方法
  const closeManualSelectionDialog = () => {
    showManualSelectionDialog.value = false
    selectedMaterialIds.value = []
  }

  const handleSearch = async () => {
    isSearching.value = true
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('搜索关键词:', searchKeywords.value)
      ElMessage.success('搜索完成')
    } catch (error) {
      console.error('搜索失败:', error)
      ElMessage.error('搜索失败')
    } finally {
      isSearching.value = false
    }
  }

  const toggleMaterialSelection = (material: Material) => {
    const index = selectedMaterialIds.value.indexOf(material.id)
    if (index > -1) {
      selectedMaterialIds.value.splice(index, 1)
    } else {
      selectedMaterialIds.value.push(material.id)
    }
  }

  const handleAddMaterials = () => {
    const allMaterials = [
      ...mainstreamMaterials.value,
      ...externalMaterials.value,
      ...localMaterials.value
    ]
    
    const selectedMaterialObjects = allMaterials.filter(material => 
      selectedMaterialIds.value.includes(material.id)
    )
    
    addMaterials(selectedMaterialObjects)
    closeManualSelectionDialog()
    ElMessage.success('已添加 ' + selectedMaterialObjects.length + ' 个素材')
  }

  const triggerFileUpload = () => {
    fileInput.value?.click()
  }

  const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement
    const files = target.files
    if (files) {
      processFiles(files)
    }
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer?.files
    if (files) {
      processFiles(files)
    }
  }

  const processFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          const material: Material = {
            id: 'local-' + Date.now() + '-' + Math.random(),
            title: file.name.replace(/\.(md|txt)$/, ''),
            content: content,
            summary: content.substring(0, 100) + '...',
            source: '本地',
            type: 'text' as const,
            fileSize: formatFileSize(file.size),
            tags: ['本地'],
            createdAt: new Date()
          }
          localMaterials.value.push(material)
          ElMessage.success('文件上传成功: ' + file.name)
        }
        reader.readAsText(file)
      } else {
        ElMessage.warning('仅支持 .md 和 .txt 文件格式')
      }
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 工具方法
  const getSourceTagType = (source: string) => {
    const sourceMap: Record<string, string> = {
      '主流媒体': 'success',
      '外部': 'warning',
      '本地': 'info'
    }
    return sourceMap[source] || 'default'
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 素材相关方法（兼容旧版本）
  const handleMaterialSelected = (material: Material) => {
    console.log('素材已选择:', material)
  }

  const handleMaterialDragged = (event: DragEvent, material: Material) => {
    console.log('素材被拖拽:', material)
  }

  const confirmTitle = () => {
    if (!selectedTitle.value) {
      ElMessage.warning('请选择一个标题')
      return
    }

    // 保存选择的标题和素材
    const titleData = {
      titles: generatedTitles.value,
      selectedTitle: selectedTitle.value,
      boundMaterials: boundMaterials.value,
      updatedAt: new Date().toISOString()
    }

    localStorage.setItem(`project_${projectId}_titles`, JSON.stringify(titleData))
    
    // 同步项目状态到列表
    syncProjectToList(projectId)

    ElMessage.success('标题已确认，即将进入大纲阶段')

    // Navigate to outline
    setTimeout(() => {
      router.push(`/document-generation/outline/${projectId}`)
    }, 1500)
  }

  const goBack = () => {
    router.push(`/document-generation/requirements/${projectId}`)
  }

  // Header actions
  const headerActions = ref([
    {
      label: '返回',
      type: 'default',
      handler: goBack
    }
  ])
</script>

<style scoped lang="scss">
  .title-selection-container {
    max-width: 1400px;
    padding: 20px;
    margin: 0 auto;
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
    }

    .step-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
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

    &.completed {
      .step-number {
        color: white;
        background: var(--el-color-success);
      }

      .step-label {
        color: var(--el-color-success);
      }
    }
  }

  .step-connector {
    width: 60px;
    height: 2px;
    margin: 0 20px;
    margin-top: -20px;
    background: var(--el-border-color);

    &.completed {
      background: var(--el-color-success);
    }
  }

  /* 标题素材区样式 */
  .title-material-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;
    overflow: hidden;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: #e9ecef;
    }

    h3 {
      margin: 0;
      font-size: 18px;
      color: var(--el-text-color-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .collapse-icon {
    font-size: 12px;
    transition: transform 0.2s;
    margin-left: 8px;

    &.collapsed {
      transform: rotate(-90deg);
    }
  }

  .section-content {
    padding: 20px;

    &.collapsed {
      display: none;
    }
  }

  .materials-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  .materials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  .material-card {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .material-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .material-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0;
      }
    }

    .material-summary {
      font-size: 14px;
      color: var(--el-text-color-regular);
      margin-bottom: 12px;
    }

    .material-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--el-text-color-secondary);

      .material-date {
        font-size: 12px;
      }
    }
  }

  .empty-materials {
    text-align: center;
    padding: 60px 20px;
    color: var(--el-text-color-secondary);

    h3 {
      margin: 16px 0 8px;
      font-size: 20px;
      color: var(--el-text-color-regular);
    }

    p {
      margin: 0;
      font-size: 16px;
      line-height: 1.5;
    }
  }

  /* 标题生成区样式 */
  .title-generation-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 24px;
  }

  .materials-weight-section {
    margin-bottom: 24px;
  }

  .section-title {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .materials-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .material-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
  }

  .material-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;

    .material-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .weight-control {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 160px;

    .weight-value {
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      min-width: 35px;
      text-align: right;
    }
  }

  .generation-settings {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
  }

  .setting-item {
    display: flex;
    align-items: center;
    gap: 12px;

    .setting-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }
  }

  .titles-display {
    margin-bottom: 24px;
  }

  .titles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .title-card {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    &.selected {
      border-color: var(--el-color-warning);
      background: #fef9e7;
    }

    .title-content {
      margin-bottom: 12px;

      .title-text {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        line-height: 1.4;
      }

      .title-meta {
        margin: 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .title-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .more-options {
    text-align: center;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--el-text-color-secondary);

    h3 {
      margin: 16px 0 8px;
      font-size: 20px;
      color: var(--el-text-color-regular);
    }

    p {
      margin: 0;
      font-size: 16px;
      line-height: 1.5;
    }
  }

  /* 手动选择素材对话框样式 */
  :deep(.material-selection-dialog) {
    .el-dialog__body {
      padding: 0;
    }
  }

  .dialog-content {
    display: flex;
    flex-direction: column;
    max-height: 70vh;
  }

  .search-section {
    padding: 20px;
    border-bottom: 1px solid #e9ecef;
    background: #f8f9fa;

    .search-filters {
      display: flex;
      gap: 20px;
      align-items: center;
      flex-wrap: wrap;

      .search-keywords {
        display: flex;
        align-items: center;
        gap: 8px;

        label {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-regular);
        }
      }
    }
  }

  .materials-grid-dialog {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .material-column {
    flex: 1;
    border-right: 1px solid #e9ecef;
    display: flex;
    flex-direction: column;

    &:last-child {
      border-right: none;
    }

    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;

      h4 {
        margin: 0;
        font-size: 16px;
        color: var(--el-text-color-primary);
      }
    }

    .column-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      max-height: 400px;
    }
  }

  .material-card-dialog {
    padding: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &.selected {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    .material-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .material-card-title {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 1.4;
    }

    .material-card-summary {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: var(--el-text-color-regular);
      line-height: 1.4;
    }

    .material-card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: var(--el-text-color-secondary);

      .reliability {
        color: var(--el-color-warning);
      }
    }
  }

  .column-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--el-text-color-secondary);
    text-align: center;

    .upload-area {
      padding: 40px;
      border: 2px dashed var(--el-border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      p {
        margin: 4px 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .selection-info {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }
  }

  /* 标题分析面板样式 */
  :deep(.analysis-panel) {
    .el-dialog__body {
      padding: 0;
    }
  }

  .panel-body {
    padding: 20px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .analyzed-title {
    margin-bottom: 24px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid var(--el-color-primary);

    h4 {
      margin: 0;
      font-size: 18px;
      color: var(--el-text-color-primary);
      line-height: 1.4;
    }
  }

  .analysis-section {
    margin-bottom: 24px;

    h5 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: var(--el-text-color-primary);
      font-weight: 600;
    }
  }

  .keywords-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;

    .el-tag {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: scale(1.05);
      }
    }
  }

  .sentiment-analysis {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;

    .sentiment-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .attractiveness-score {
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;

    .score-display {
      display: flex;
      align-items: baseline;
      justify-content: center;
      margin-bottom: 12px;

      .score-number {
        font-size: 48px;
        font-weight: bold;
        color: var(--el-color-primary);
      }

      .score-max {
        font-size: 24px;
        color: var(--el-text-color-secondary);
        margin-left: 4px;
      }
    }

    .score-description {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      font-style: italic;
      margin-top: 8px;
    }
  }

  .seo-suggestions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    transition: all 0.2s;

    &:hover {
      border-color: var(--el-color-primary);
      background: #f8f9ff;
    }

    .suggestion-label {
      flex: 1;
      font-size: 14px;
      color: var(--el-text-color-regular);
      cursor: pointer;
      line-height: 1.4;
    }
  }

  .panel-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-generation-section {
    padding: 30px;
    margin-bottom: 30px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .generation-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 30px;
  }

  .control-group h4,
  .material-section h4 {
    margin: 0 0 20px;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  .material-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .keywords-section {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .selected-materials {
    padding: 15px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
  }

  .material-card {
    padding: 15px;
    margin-bottom: 10px;
    background: white;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    &:last-child {
      margin-bottom: 0;
    }

    .material-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      h5 {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-primary);
      }
    }

    p {
      margin: 0 0 10px;
      font-size: 13px;
      line-height: 1.4;
      color: var(--el-text-color-regular);
    }

    .material-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
  }

  .generation-actions {
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
    padding-top: 30px;
    margin-top: 30px;
    border-top: 1px solid var(--el-border-color);
  }

  .generation-tip {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .titles-display-section {
    padding: 30px;
    margin-bottom: 30px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 25px;

    h3 {
      margin: 0;
      color: var(--el-text-color-primary);
    }
  }

  .titles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .title-card {
    padding: 20px;
    cursor: pointer;
    border: 2px solid var(--el-border-color);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    }

    &.selected {
      background: var(--el-color-success-light-9);
      border-color: var(--el-color-success);
    }
  }

  .title-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 15px;

    .title-content {
      flex: 1;

      h4 {
        margin: 0 0 8px;
        font-size: 16px;
        line-height: 1.4;
        color: var(--el-text-color-primary);
      }
    }

    .title-selection {
      margin-left: 15px;
    }
  }

  .title-analysis {
    margin-bottom: 15px;

    .analysis-item {
      margin-bottom: 5px;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .title-keywords {
    margin-bottom: 15px;

    .keyword-label {
      margin-right: 8px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .title-advantages {
    h5 {
      margin: 0 0 8px;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    ul {
      padding-left: 20px;
      margin: 0;

      li {
        margin-bottom: 4px;
        font-size: 13px;
        color: var(--el-text-color-regular);

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  .selected-title-preview {
    padding: 25px;
    background: var(--el-color-success-light-9);
    border: 2px solid var(--el-color-success);
    border-radius: 8px;

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;

      h4 {
        margin: 0;
        color: var(--el-text-color-primary);
      }
    }

    .preview-content {
      h3 {
        margin: 0 0 10px;
        font-size: 20px;
        line-height: 1.4;
        color: var(--el-text-color-primary);
      }

      .preview-description {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--el-text-color-regular);
      }
    }
  }

  .navigation-actions {
    display: flex;
    gap: 20px;
    justify-content: center;
  }

  @media (width <= 1200px) {
    .generation-controls {
      grid-template-columns: 1fr;
    }

    .titles-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (width <= 768px) {
    .title-selection-container {
      padding: 15px;
    }

    .title-generation-section,
    .titles-display-section {
      padding: 20px;
    }

    .step-indicator {
      padding: 15px;
    }

    .step-connector {
      width: 40px;
      margin: 0 10px;
    }

    .navigation-actions {
      flex-direction: column;
      align-items: center;
    }

    .material-controls {
      flex-direction: column;
    }
  }
</style>
