<template>
  <div class="external-material-fetch">
    <!-- 页面头部 -->
    <div class="external-material-fetch__header">
      <div class="header-content">
        <el-button @click="goBack" size="small">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div class="header-title">
          <h2>外部素材抓取</h2>
          <p>通过AI检索外部资源，获取多样化参考素材</p>
        </div>
      </div>
    </div>

    <!-- 搜索配置区域 -->
    <el-card class="external-material-fetch__config">
      <template #header>
        <div class="config-header">
          <h3>AI检索配置</h3>
          <el-tag type="info" size="small">F018 - 外部素材抓取</el-tag>
        </div>
      </template>

      <el-form :model="searchConfig" label-width="140px" :rules="rules" ref="formRef">
        <el-form-item label="检索关键词" prop="keywords" required>
          <el-input
            v-model="searchConfig.keywords"
            placeholder="请输入检索关键词，例如：区块链技术应用"
            clearable
          />
        </el-form-item>

        <el-form-item label="与当前内容相关">
          <el-switch
            v-model="searchConfig.relatedToCurrent"
            active-text="智能关联检索"
            inactive-text="通用关键词检索"
          />
          <el-tooltip
            content="开启后将根据当前编辑内容的上下文智能推荐高相关性素材"
            placement="top"
          >
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>

        <el-form-item label="检索平台">
          <el-checkbox-group v-model="searchConfig.platforms">
            <el-checkbox
              v-for="platform in platformOptions"
              :key="platform.id"
              :label="platform.id"
            >
              {{ platform.name }}
              <el-tag size="small" :type="platform.type" style="margin-left: 4px">
                {{ platform.category }}
              </el-tag>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="内容质量要求">
          <el-radio-group v-model="searchConfig.qualityLevel">
            <el-radio label="high">高质量 (严格筛选)</el-radio>
            <el-radio label="medium">中等质量 (平衡数量与质量)</el-radio>
            <el-radio label="all">全部内容 (最大化覆盖)</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="语言偏好">
          <el-checkbox-group v-model="searchConfig.languages">
            <el-checkbox label="zh-CN">中文</el-checkbox>
            <el-checkbox label="en">英文</el-checkbox>
            <el-checkbox label="auto">自动检测</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="AI提供商">
          <el-select v-model="searchConfig.aiProvider" placeholder="选择AI提供商">
            <el-option
              v-for="provider in aiProviders"
              :key="provider.id"
              :label="provider.name"
              :value="provider.id"
            >
              <span>{{ provider.name }}</span>
              <el-tag
                size="small"
                :type="provider.status === 'active' ? 'success' : 'info'"
                style="margin-left: 8px"
              >
                {{ provider.status === 'active' ? '在线' : '离线' }}
              </el-tag>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="高级选项">
          <el-collapse>
            <el-collapse-item title="更多筛选条件" name="advanced">
              <el-form-item label="内容长度">
                <el-slider
                  v-model="searchConfig.contentLength"
                  range
                  :min="100"
                  :max="5000"
                  :step="100"
                  show-stops
                  :marks="{ 500: '短文', 1500: '中篇', 3000: '长文' }"
                />
              </el-form-item>

              <el-form-item label="发布时间">
                <el-date-picker
                  v-model="searchConfig.dateRange as [string, string]"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>

              <el-form-item label="排除关键词">
                <el-input
                  v-model="searchConfig.excludeKeywords"
                  placeholder="用逗号分隔多个关键词"
                />
              </el-form-item>
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
      </el-form>

      <div class="config-actions">
        <el-button @click="resetConfig">重置配置</el-button>
        <el-button @click="saveTemplate">保存为模板</el-button>
        <el-button
          type="primary"
          @click="startSearch"
          :loading="isSearching"
          :disabled="!canSearch"
        >
          <el-icon><Search /></el-icon>
          开始AI检索
        </el-button>
      </div>
    </el-card>

    <!-- 检索进度 -->
    <el-card v-if="isSearching" class="external-material-fetch__progress">
      <div class="progress-content">
        <div class="progress-header">
          <h4>AI正在检索外部素材...</h4>
          <el-button size="small" @click="cancelSearch">取消检索</el-button>
        </div>

        <div class="progress-stages">
          <div
            class="stage-item"
            :class="{ active: currentStage >= 1, completed: currentStage > 1 }"
          >
            <div class="stage-icon">
              <el-icon><MagicStick /></el-icon>
            </div>
            <div class="stage-info">
              <div class="stage-title">AI分析</div>
              <div class="stage-desc">理解检索需求</div>
            </div>
          </div>

          <div
            class="stage-item"
            :class="{ active: currentStage >= 2, completed: currentStage > 2 }"
          >
            <div class="stage-icon">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stage-info">
              <div class="stage-title">多平台检索</div>
              <div class="stage-desc">{{ searchedPlatforms }}/{{ totalPlatforms }} 平台</div>
            </div>
          </div>

          <div
            class="stage-item"
            :class="{ active: currentStage >= 3, completed: currentStage > 3 }"
          >
            <div class="stage-icon">
              <el-icon><Filter /></el-icon>
            </div>
            <div class="stage-info">
              <div class="stage-title">智能筛选</div>
              <div class="stage-desc">质量评估与排序</div>
            </div>
          </div>

          <div class="stage-item" :class="{ active: currentStage >= 4 }">
            <div class="stage-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stage-info">
              <div class="stage-title">完成</div>
              <div class="stage-desc">{{ foundCount }} 个素材</div>
            </div>
          </div>
        </div>

        <el-progress
          :percentage="searchProgress"
          :status="searchProgress === 100 ? 'success' : undefined"
          :stroke-width="8"
        />

        <div class="progress-details">
          <p>{{ progressMessage }}</p>
          <div class="progress-stats">
            <span>检索进度: {{ searchProgress }}%</span>
            <span>已找到: {{ foundCount }} 个素材</span>
            <span>预计剩余: {{ estimatedTime }}s</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 检索结果 -->
    <div class="external-material-fetch__results" v-if="materials.length > 0">
      <div class="results-header">
        <div class="results-title">
          <h3>检索结果 ({{ materials.length }} 个素材)</h3>
          <el-tag size="small" type="info">已自动按相关性排序</el-tag>
        </div>
        <div class="results-actions">
          <el-button @click="selectAll" size="small">全选</el-button>
          <el-button @click="clearSelection" size="small">取消选择</el-button>
          <el-button
            type="primary"
            @click="addToProject"
            :disabled="selectedMaterials.length === 0"
            size="small"
          >
            添加到项目 ({{ selectedMaterials.length }})
          </el-button>
        </div>
      </div>

      <div class="results-grid">
        <div
          v-for="material in materials"
          :key="material.id"
          class="material-item"
          :class="{ selected: selectedMaterials.includes(material.id) }"
          @click="toggleSelection(material.id)"
        >
          <div class="material-header">
            <el-checkbox
              :model-value="selectedMaterials.includes(material.id)"
              @change="toggleSelection(material.id)"
              @click.stop
            />
            <el-tag size="small" type="info">外部</el-tag>
            <el-tag size="small" :type="getRelevanceType(material.relevance)">
              相关性: {{ material.relevance }}%
            </el-tag>
          </div>

          <h4 class="material-title">{{ material.title }}</h4>
          <p class="material-summary">{{ material.summary }}</p>

          <div class="material-meta">
            <span class="meta-item">
              <el-icon><Link /></el-icon>
              {{ material.platform }}
            </span>
            <span class="meta-item">
              <el-icon><User /></el-icon>
              {{ material.author }}
            </span>
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(material.publishDate) }}
            </span>
          </div>

          <div class="material-tags">
            <el-tag v-for="tag in material.tags" :key="tag" size="small" effect="plain">
              {{ tag }}
            </el-tag>
          </div>

          <div class="material-actions">
            <el-button size="small" @click.stop="showPreview(material)">
              <el-icon><View /></el-icon>
              预览
            </el-button>
            <el-button size="small" @click.stop="visitSource(material)">
              <el-icon><Link /></el-icon>
              访问原文
            </el-button>
            <el-button size="small" type="primary" @click.stop="addSingleMaterial(material)">
              <el-icon><Plus /></el-icon>
              添加
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="currentPreviewMaterial?.title"
      width="80%"
      class="material-preview-dialog"
    >
      <div class="material-preview" v-if="currentPreviewMaterial">
        <div class="preview-meta">
          <div class="meta-row"> <strong>平台:</strong> {{ currentPreviewMaterial.platform }} </div>
          <div class="meta-row"> <strong>作者:</strong> {{ currentPreviewMaterial.author }} </div>
          <div class="meta-row">
            <strong>发布时间:</strong> {{ formatDate(currentPreviewMaterial.publishDate) }}
          </div>
          <div class="meta-row">
            <strong>相关性评分:</strong>
            <el-tag :type="getRelevanceType(currentPreviewMaterial.relevance)">
              {{ currentPreviewMaterial.relevance }}%
            </el-tag>
          </div>
          <div class="meta-row">
            <strong>原文链接:</strong>
            <el-link :href="currentPreviewMaterial.url" target="_blank" type="primary">
              {{ currentPreviewMaterial.url }}
            </el-link>
          </div>
        </div>

        <div class="preview-content">
          <h4>内容摘要</h4>
          <p>{{ currentPreviewMaterial.summary }}</p>

          <h4>AI分析要点</h4>
          <div class="ai-insights">
            <ul>
              <li v-for="insight in currentPreviewMaterial.aiInsights" :key="insight">{{
                insight
              }}</li>
            </ul>
          </div>

          <h4>相关性分析</h4>
          <div class="relevance-analysis">
            <p>{{ currentPreviewMaterial.relevanceReason }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button @click="visitSource(currentPreviewMaterial!)">访问原文</el-button>
        <el-button type="primary" @click="addSingleMaterial(currentPreviewMaterial!)">
          添加到项目
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    ArrowLeft,
    Search,
    QuestionFilled,
    MagicStick,
    Connection,
    Filter,
    Check,
    Link,
    User,
    Calendar,
    View,
    Plus
  } from '@element-plus/icons-vue'

  const router = useRouter()

  // 表单引用
  const formRef = ref()

  // 搜索配置
  const searchConfig = ref({
    keywords: '',
    relatedToCurrent: false,
    platforms: [] as string[],
    qualityLevel: 'medium',
    languages: ['zh-CN'] as string[],
    aiProvider: 'deepseek',
    contentLength: [500, 2000] as [number, number],
    dateRange: null as [string, string] | null,
    excludeKeywords: ''
  })

  // 表单验证规则
  const rules = {
    keywords: [{ required: true, message: '请输入检索关键词', trigger: 'blur' }]
  }

  // 平台选项
  const platformOptions = ref([
    { id: 'zhihu', name: '知乎', category: '问答社区', type: 'success' },
    { id: 'weibo', name: '微博', category: '社交媒体', type: 'warning' },
    { id: 'douban', name: '豆瓣', category: '文化社区', type: 'info' },
    { id: 'juejin', name: '掘金', category: '技术社区', type: 'success' },
    { id: 'csdn', name: 'CSDN', category: '技术博客', type: 'success' },
    { id: 'github', name: 'GitHub', category: '代码仓库', type: 'info' },
    { id: 'medium', name: 'Medium', category: '博客平台', type: 'warning' },
    { id: 'reddit', name: 'Reddit', category: '论坛社区', type: 'danger' }
  ])

  // AI提供商选项
  const aiProviders = ref([
    { id: 'deepseek', name: 'DeepSeek', status: 'active' },
    { id: 'openai', name: 'OpenAI GPT', status: 'active' },
    { id: 'claude', name: 'Claude', status: 'active' },
    { id: 'gemini', name: 'Google Gemini', status: 'offline' }
  ])

  // 检索状态
  const isSearching = ref(false)
  const currentStage = ref(0)
  const searchProgress = ref(0)
  const progressMessage = ref('')
  const searchedPlatforms = ref(0)
  const totalPlatforms = ref(0)
  const foundCount = ref(0)
  const estimatedTime = ref(0)

  // 结果数据
  const materials = ref<any[]>([])
  const selectedMaterials = ref<string[]>([])
  const previewVisible = ref(false)
  const currentPreviewMaterial = ref<any>(null)

  // 计算属性
  const canSearch = computed(() => {
    return (
      searchConfig.value.keywords.trim() !== '' &&
      searchConfig.value.platforms.length > 0 &&
      searchConfig.value.aiProvider
    )
  })

  // 方法
  function goBack() {
    router.go(-1)
  }

  function resetConfig() {
    searchConfig.value = {
      keywords: '',
      relatedToCurrent: false,
      platforms: [],
      qualityLevel: 'medium',
      languages: ['zh-CN'],
      aiProvider: 'deepseek',
      contentLength: [500, 2000],
      dateRange: null,
      excludeKeywords: ''
    }
    formRef.value?.clearValidate()
  }

  function saveTemplate() {
    ElMessage.info('模板保存功能开发中...')
  }

  async function startSearch() {
    // 表单验证
    const isValid = await formRef.value?.validate().catch(() => false)
    if (!isValid) return

    isSearching.value = true
    currentStage.value = 1
    searchProgress.value = 0
    progressMessage.value = 'AI正在分析检索需求...'
    searchedPlatforms.value = 0
    totalPlatforms.value = searchConfig.value.platforms.length
    foundCount.value = 0
    estimatedTime.value = 30
    materials.value = []

    // 模拟AI检索过程
    simulateAISearch()
  }

  function simulateAISearch() {
    const stages = [
      { stage: 1, message: 'AI正在分析检索关键词和上下文...', duration: 3000 },
      { stage: 2, message: '正在检索多个外部平台...', duration: 8000 },
      { stage: 3, message: 'AI正在评估内容质量和相关性...', duration: 4000 },
      { stage: 4, message: '整理和排序检索结果...', duration: 2000 }
    ]

    let currentIndex = 0

    function nextStage() {
      if (currentIndex >= stages.length) {
        // 检索完成
        searchProgress.value = 100
        currentStage.value = 4
        progressMessage.value = '检索完成！'
        generateMockResults()

        setTimeout(() => {
          isSearching.value = false
          ElMessage.success(`AI检索完成！找到 ${materials.value.length} 个相关素材`)
        }, 1000)
        return
      }

      const stage = stages[currentIndex]
      currentStage.value = stage.stage
      progressMessage.value = stage.message

      // 模拟进度更新
      const startProgress = currentIndex * 25
      const endProgress = (currentIndex + 1) * 25
      let progress = startProgress

      const interval = setInterval(() => {
        progress += Math.random() * 3
        if (progress >= endProgress) {
          progress = endProgress
          clearInterval(interval)

          // 更新统计数据
          if (stage.stage === 2) {
            searchedPlatforms.value = Math.min(searchedPlatforms.value + 1, totalPlatforms.value)
            foundCount.value += Math.floor(Math.random() * 3) + 1
          }

          estimatedTime.value = Math.max(0, estimatedTime.value - 5)
          currentIndex++

          setTimeout(nextStage, 500)
        } else {
          if (stage.stage === 2) {
            // 在检索阶段随机更新平台数量和找到的素材数
            if (Math.random() < 0.3) {
              searchedPlatforms.value = Math.min(searchedPlatforms.value + 1, totalPlatforms.value)
            }
            if (Math.random() < 0.4) {
              foundCount.value += Math.floor(Math.random() * 2)
            }
          }
          estimatedTime.value = Math.max(0, estimatedTime.value - 1)
        }

        searchProgress.value = Math.min(progress, 100)
      }, 200)
    }

    nextStage()
  }

  function cancelSearch() {
    ElMessageBox.confirm('确定要取消AI检索吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      isSearching.value = false
      currentStage.value = 0
      ElMessage.info('AI检索已取消')
    })
  }

  function generateMockResults() {
    // 生成模拟的AI检索结果
    const mockMaterials = [
      {
        id: '1',
        title: '区块链技术在供应链管理中的创新应用',
        summary:
          '本文深入探讨了区块链技术如何革新传统供应链管理模式，通过去中心化、不可篡改等特性，提高供应链透明度和效率。文章分析了多个实际应用案例...',
        platform: '知乎',
        author: '区块链研究员',
        publishDate: new Date('2024-03-12'),
        relevance: 95,
        url: 'https://zhihu.com/question/example',
        tags: ['区块链', '供应链', '技术应用'],
        aiInsights: [
          '文章提供了区块链在供应链中的具体实施方案',
          '包含多个成功案例的详细分析',
          '对技术挑战和解决方案有深入讨论',
          '适合作为技术应用的参考素材'
        ],
        relevanceReason:
          '该素材与检索关键词高度匹配，内容质量高，包含实用的技术应用案例，非常适合作为区块链技术应用的参考资料。'
      },
      {
        id: '2',
        title: 'DeFi生态系统发展现状与未来趋势',
        summary:
          '去中心化金融(DeFi)作为区块链技术的重要应用领域，正在重塑传统金融服务模式。本文分析了当前DeFi生态的发展现状，主要协议的创新特点...',
        platform: '掘金',
        author: 'DeFi分析师',
        publishDate: new Date('2024-03-08'),
        relevance: 88,
        url: 'https://juejin.cn/post/example',
        tags: ['DeFi', '去中心化金融', '区块链生态'],
        aiInsights: [
          '全面分析了DeFi生态系统的发展现状',
          '对主要DeFi协议进行了详细对比',
          '预测了未来发展趋势和挑战',
          '包含丰富的数据和图表分析'
        ],
        relevanceReason:
          'DeFi作为区块链技术的重要应用，与检索内容相关性较高，文章内容专业且数据详实。'
      },
      {
        id: '3',
        title: 'NFT市场的技术原理与商业模式探析',
        summary:
          '非同质化代币(NFT)基于区块链技术，为数字资产确权和交易提供了新的解决方案。文章从技术原理出发，分析NFT的实现机制，探讨其商业应用前景...',
        platform: 'Medium',
        author: 'Blockchain Developer',
        publishDate: new Date('2024-03-05'),
        relevance: 82,
        url: 'https://medium.com/@example/nft-analysis',
        tags: ['NFT', '数字资产', '区块链应用'],
        aiInsights: [
          '详细解释了NFT的技术实现原理',
          '分析了NFT市场的商业模式',
          '包含对未来发展的深度思考',
          '适合了解NFT技术和应用场景'
        ],
        relevanceReason:
          'NFT作为区块链技术的创新应用，与检索主题相关，内容具有一定的技术深度和商业价值。'
      }
    ]

    materials.value = mockMaterials
    foundCount.value = mockMaterials.length
  }

  function toggleSelection(id: string) {
    const index = selectedMaterials.value.indexOf(id)
    if (index > -1) {
      selectedMaterials.value.splice(index, 1)
    } else {
      selectedMaterials.value.push(id)
    }
  }

  function selectAll() {
    selectedMaterials.value = materials.value.map((m) => m.id)
  }

  function clearSelection() {
    selectedMaterials.value = []
  }

  async function addToProject() {
    if (selectedMaterials.value.length === 0) {
      ElMessage.warning('请先选择要添加的素材')
      return
    }

    try {
      // 这里应该调用API添加素材到项目
      await new Promise((resolve) => setTimeout(resolve, 1000))

      ElMessage.success(
        `已成功添加 ${selectedMaterials.value.length} 个素材到项目，并自动添加"外部"标签`
      )
      selectedMaterials.value = []

      // 保存到最近使用
      const recentSources = JSON.parse(localStorage.getItem('recent_material_sources') || '[]')
      const newSource = '外部素材 - ' + searchConfig.value.keywords
      if (!recentSources.includes(newSource)) {
        recentSources.unshift(newSource)
        recentSources.splice(5)
        localStorage.setItem('recent_material_sources', JSON.stringify(recentSources))
      }
    } catch {
      ElMessage.error('添加素材失败，请重试')
    }
  }

  async function addSingleMaterial(material: any) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      ElMessage.success(`已添加素材"${material.title}"到项目，并自动添加"外部"标签`)

      if (previewVisible.value) {
        previewVisible.value = false
      }
    } catch {
      ElMessage.error('添加素材失败，请重试')
    }
  }

  function showPreview(material: any) {
    currentPreviewMaterial.value = material
    previewVisible.value = true
  }

  function visitSource(material: any) {
    window.open(material.url, '_blank')
  }

  function getRelevanceType(relevance: number) {
    if (relevance >= 90) return 'success'
    if (relevance >= 70) return 'warning'
    return 'info'
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date)
  }

  // 生命周期
  onMounted(() => {
    // 默认选择常用平台
    searchConfig.value.platforms = ['zhihu', 'juejin', 'csdn']
  })
</script>

<style scoped lang="scss">
  .external-material-fetch {
    max-width: 1200px;
    padding: 20px;
    margin: 0 auto;

    &__header {
      margin-bottom: 24px;

      .header-content {
        display: flex;
        gap: 16px;
        align-items: flex-start;

        .header-title {
          h2 {
            margin: 0 0 8px;
            font-size: 24px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }

          p {
            margin: 0;
            font-size: 14px;
            color: var(--el-text-color-regular);
          }
        }
      }
    }

    &__config {
      margin-bottom: 24px;

      .config-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
      }

      .help-icon {
        margin-left: 8px;
        color: var(--el-color-info);
        cursor: help;
      }

      .config-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding-top: 20px;
        margin-top: 20px;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }

    &__progress {
      margin-bottom: 24px;

      .progress-content {
        .progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;

          h4 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
          }
        }

        .progress-stages {
          display: flex;
          justify-content: space-between;
          padding: 0 10px;
          margin-bottom: 20px;

          .stage-item {
            display: flex;
            flex: 1;
            flex-direction: column;
            align-items: center;
            opacity: 0.5;
            transition: opacity 0.3s ease;

            &.active {
              opacity: 1;
            }

            &.completed {
              opacity: 0.8;
            }

            .stage-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              margin-bottom: 8px;
              background: var(--el-color-info-light-9);
              border-radius: 50%;
              transition: all 0.3s ease;

              .el-icon {
                font-size: 18px;
                color: var(--el-color-info);
              }
            }

            &.active .stage-icon {
              background: var(--el-color-primary-light-9);

              .el-icon {
                color: var(--el-color-primary);
              }
            }

            &.completed .stage-icon {
              background: var(--el-color-success-light-9);

              .el-icon {
                color: var(--el-color-success);
              }
            }

            .stage-info {
              text-align: center;

              .stage-title {
                margin-bottom: 2px;
                font-size: 12px;
                font-weight: 600;
              }

              .stage-desc {
                font-size: 11px;
                color: var(--el-text-color-secondary);
              }
            }
          }
        }

        .progress-details {
          margin-top: 16px;

          p {
            margin: 0 0 8px;
            font-size: 14px;
            color: var(--el-text-color-regular);
          }

          .progress-stats {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }

    &__results {
      .results-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;

        .results-title {
          display: flex;
          gap: 12px;
          align-items: center;

          h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
          }
        }

        .results-actions {
          display: flex;
          gap: 8px;
        }
      }

      .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 20px;
      }
    }
  }

  .material-item {
    padding: 16px;
    cursor: pointer;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
    }

    &.selected {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
    }

    .material-header {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
    }

    .material-title {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--el-text-color-primary);
    }

    .material-summary {
      display: -webkit-box;
      margin: 0 0 12px;
      overflow: hidden;
      font-size: 14px;
      line-height: 1.5;
      color: var(--el-text-color-regular);
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .material-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;

      .meta-item {
        display: flex;
        gap: 4px;
        align-items: center;
        font-size: 13px;
        color: var(--el-text-color-secondary);

        .el-icon {
          font-size: 14px;
        }
      }
    }

    .material-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 12px;
    }

    .material-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  }

  .material-preview {
    .preview-meta {
      padding: 16px;
      margin-bottom: 20px;
      background-color: var(--el-fill-color-lighter);
      border-radius: 6px;

      .meta-row {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .preview-content {
      h4 {
        margin: 0 0 12px;
        font-size: 16px;
        font-weight: 600;
      }

      p {
        margin: 0 0 20px;
        line-height: 1.6;
      }

      .ai-insights ul,
      .relevance-analysis {
        margin: 0;
      }

      .ai-insights ul {
        padding-left: 20px;

        li {
          margin-bottom: 8px;
          line-height: 1.5;
        }
      }

      .relevance-analysis p {
        padding: 12px;
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        background-color: var(--el-color-info-light-9);
        border-radius: 6px;
      }
    }
  }

  @media (width <= 768px) {
    .external-material-fetch {
      padding: 16px;

      &__header .header-content {
        flex-direction: column;
        gap: 12px;
      }

      .results-grid {
        grid-template-columns: 1fr;
      }

      .progress-stages {
        flex-wrap: wrap;
        gap: 16px;

        .stage-item {
          flex: 0 0 calc(50% - 8px);
        }
      }
    }

    .material-item {
      .material-actions {
        flex-wrap: wrap;
        justify-content: center;
      }

      .material-meta {
        justify-content: center;
      }
    }
  }
</style>
