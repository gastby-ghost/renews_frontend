<template>
  <div class="mainstream-material-fetch">
    <!-- 页面头部 -->
    <div class="mainstream-material-fetch__header">
      <div class="header-content">
        <el-button @click="goBack" size="small">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div class="header-title">
          <h2>主流媒体素材抓取</h2>
          <p>检索主流媒体向量数据库中的权威素材</p>
        </div>
      </div>
    </div>

    <!-- 搜索配置区域 -->
    <el-card class="mainstream-material-fetch__config">
      <template #header>
        <div class="config-header">
          <h3>检索配置</h3>
          <el-tag type="success" size="small">F046 - 主流媒体素材抓取</el-tag>
        </div>
      </template>

      <el-form :model="searchConfig" label-width="140px" :rules="rules" ref="formRef">
        <el-form-item label="检索关键词" prop="keywords" required>
          <el-input
            v-model="searchConfig.keywords"
            placeholder="请输入检索关键词，例如：人工智能发展趋势"
            clearable
          />
        </el-form-item>

        <el-form-item label="与当前内容相关">
          <el-switch
            v-model="searchConfig.relatedToCurrent"
            active-text="开启智能关联"
            inactive-text="仅关键词检索"
          />
          <el-tooltip content="开启后将根据当前编辑内容智能推荐相关素材" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>

        <el-form-item label="媒体来源筛选">
          <el-checkbox-group v-model="searchConfig.mediaSources">
            <el-checkbox v-for="source in mediaSourceOptions" :key="source.id" :label="source.id">
              {{ source.name }}
              <el-tag
                size="small"
                :type="source.reliability >= 90 ? 'success' : 'warning'"
                style="margin-left: 4px"
              >
                可靠性: {{ source.reliability }}%
              </el-tag>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="内容类型">
          <el-checkbox-group v-model="searchConfig.contentTypes">
            <el-checkbox label="news">新闻报道</el-checkbox>
            <el-checkbox label="analysis">深度分析</el-checkbox>
            <el-checkbox label="interview">专访访谈</el-checkbox>
            <el-checkbox label="opinion">观点评论</el-checkbox>
            <el-checkbox label="data">数据报告</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="时间范围">
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
      </el-form>

      <div class="config-actions">
        <el-button @click="resetConfig">重置</el-button>
        <el-button
          type="primary"
          @click="startSearch"
          :loading="isSearching"
          :disabled="!canSearch"
        >
          <el-icon><Search /></el-icon>
          开始检索
        </el-button>
      </div>
    </el-card>

    <!-- 检索进度 -->
    <el-card v-if="isSearching" class="mainstream-material-fetch__progress">
      <div class="progress-content">
        <div class="progress-info">
          <h4>正在检索主流媒体数据库...</h4>
          <p>{{ progressMessage }}</p>
        </div>
        <el-progress
          :percentage="searchProgress"
          :status="searchProgress === 100 ? 'success' : undefined"
        />
        <div class="progress-stats">
          <span>已检索: {{ searchedCount }} 个来源</span>
          <span>找到素材: {{ foundCount }} 个</span>
        </div>
      </div>
    </el-card>

    <!-- 检索结果 -->
    <div class="mainstream-material-fetch__results" v-if="materials.length > 0">
      <div class="results-header">
        <h3>检索结果 ({{ materials.length }} 个素材)</h3>
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
            <el-tag size="small" type="success">主流媒体</el-tag>
            <el-tag size="small" :type="getReliabilityType(material.reliability)">
              可靠性: {{ material.reliability }}%
            </el-tag>
          </div>

          <h4 class="material-title">{{ material.title }}</h4>
          <p class="material-summary">{{ material.summary }}</p>

          <div class="material-meta">
            <span class="meta-item">
              <el-icon><Reading /></el-icon>
              {{ material.source }}
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
          <div class="meta-row"> <strong>来源:</strong> {{ currentPreviewMaterial.source }} </div>
          <div class="meta-row">
            <strong>发布时间:</strong> {{ formatDate(currentPreviewMaterial.publishDate) }}
          </div>
          <div class="meta-row">
            <strong>可靠性评分:</strong>
            <el-tag :type="getReliabilityType(currentPreviewMaterial.reliability)">
              {{ currentPreviewMaterial.reliability }}%
            </el-tag>
          </div>
        </div>

        <div class="preview-content">
          <h4>内容摘要</h4>
          <p>{{ currentPreviewMaterial.summary }}</p>

          <h4>关键信息</h4>
          <div class="key-points">
            <ul>
              <li v-for="point in currentPreviewMaterial.keyPoints" :key="point">{{ point }}</li>
            </ul>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
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
  import { ElMessage } from 'element-plus'
  import {
    ArrowLeft,
    Search,
    QuestionFilled,
    Reading,
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
    mediaSources: [] as string[],
    contentTypes: ['news', 'analysis'] as string[],
    dateRange: null as [string, string] | null
  })

  // 表单验证规则
  const rules = {
    keywords: [{ required: true, message: '请输入检索关键词', trigger: 'blur' }]
  }

  // 媒体来源选项
  const mediaSourceOptions = ref([
    { id: 'xinhua', name: '新华社', reliability: 98 },
    { id: 'rmrb', name: '人民日报', reliability: 97 },
    { id: 'cctv', name: 'CCTV新闻', reliability: 96 },
    { id: 'chinadaily', name: '中国日报', reliability: 94 },
    { id: 'gmw', name: '光明网', reliability: 92 },
    { id: 'cnr', name: '央广网', reliability: 91 }
  ])

  // 状态
  const isSearching = ref(false)
  const searchProgress = ref(0)
  const progressMessage = ref('')
  const searchedCount = ref(0)
  const foundCount = ref(0)

  // 结果数据
  const materials = ref<any[]>([])
  const selectedMaterials = ref<string[]>([])
  const previewVisible = ref(false)
  const currentPreviewMaterial = ref<any>(null)

  // 计算属性
  const canSearch = computed(() => {
    return searchConfig.value.keywords.trim() !== ''
  })

  // 方法
  function goBack() {
    router.go(-1)
  }

  function resetConfig() {
    searchConfig.value = {
      keywords: '',
      relatedToCurrent: false,
      mediaSources: [],
      contentTypes: ['news', 'analysis'],
      dateRange: null
    }
    formRef.value?.clearValidate()
  }

  async function startSearch() {
    // 表单验证
    const isValid = await formRef.value?.validate().catch(() => false)
    if (!isValid) return

    isSearching.value = true
    searchProgress.value = 0
    progressMessage.value = '正在连接主流媒体数据库...'
    searchedCount.value = 0
    foundCount.value = 0
    materials.value = []

    // 模拟检索过程
    const interval = setInterval(() => {
      searchProgress.value += Math.random() * 15
      searchedCount.value += Math.floor(Math.random() * 3) + 1

      if (searchProgress.value < 30) {
        progressMessage.value = '正在分析检索关键词...'
      } else if (searchProgress.value < 60) {
        progressMessage.value = '正在检索主流媒体数据库...'
        foundCount.value += Math.floor(Math.random() * 2)
      } else if (searchProgress.value < 90) {
        progressMessage.value = '正在筛选和排序结果...'
        foundCount.value += Math.floor(Math.random() * 3)
      } else {
        progressMessage.value = '正在整理检索结果...'
      }

      if (searchProgress.value >= 100) {
        clearInterval(interval)
        searchProgress.value = 100
        progressMessage.value = '检索完成'

        setTimeout(() => {
          generateMockResults()
          isSearching.value = false
          ElMessage.success('检索完成！找到 ' + materials.value.length + ' 个相关素材')
        }, 1000)
      }
    }, 300)
  }

  function generateMockResults() {
    // 生成模拟的检索结果
    const mockMaterials = [
      {
        id: '1',
        title: '人工智能技术在新闻传播领域的应用与挑战',
        summary:
          '随着人工智能技术的快速发展，新闻传播行业正在经历深刻变革。本文分析了AI技术在内容生产、分发和用户交互方面的应用现状...',
        source: '人民日报',
        publishDate: new Date('2024-03-15'),
        reliability: 97,
        tags: ['人工智能', '新闻传播', '技术应用'],
        keyPoints: [
          'AI技术在新闻写作中的自动化应用',
          '智能推荐算法改变内容分发模式',
          '人机协作成为新闻生产新趋势',
          '技术伦理和准确性仍是主要挑战'
        ]
      },
      {
        id: '2',
        title: '数字化转型推动传统媒体融合发展',
        summary:
          '在数字化浪潮下，传统媒体积极拥抱新技术，通过媒体融合实现转型升级。多家主流媒体的成功实践为行业发展提供了宝贵经验...',
        source: '新华社',
        publishDate: new Date('2024-03-10'),
        reliability: 98,
        tags: ['数字化转型', '媒体融合', '传统媒体'],
        keyPoints: [
          '全媒体矩阵建设成效显著',
          '技术驱动内容创新',
          '用户体验持续优化',
          '商业模式探索初见成效'
        ]
      },
      {
        id: '3',
        title: '5G技术助力新媒体内容创新',
        summary:
          '5G网络的普及为新媒体内容创作和传播带来了革命性变化。高速率、低延迟的网络环境为沉浸式内容体验创造了条件...',
        source: 'CCTV新闻',
        publishDate: new Date('2024-03-08'),
        reliability: 96,
        tags: ['5G技术', '新媒体', '内容创新'],
        keyPoints: [
          'VR/AR内容制作技术日趋成熟',
          '实时直播质量大幅提升',
          '互动体验更加丰富',
          '内容分发效率显著提高'
        ]
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
        `已成功添加 ${selectedMaterials.value.length} 个素材到项目，并自动添加"主流媒体"标签`
      )
      selectedMaterials.value = []

      // 保存到最近使用
      const recentSources = JSON.parse(localStorage.getItem('recent_material_sources') || '[]')
      const newSource = '主流媒体 - ' + searchConfig.value.keywords
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
      ElMessage.success(`已添加素材"${material.title}"到项目，并自动添加"主流媒体"标签`)

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

  function getReliabilityType(reliability: number) {
    if (reliability >= 95) return 'success'
    if (reliability >= 90) return 'warning'
    return 'danger'
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
    // 默认选择主要媒体来源
    searchConfig.value.mediaSources = ['xinhua', 'rmrb', 'cctv']
  })
</script>

<style scoped lang="scss">
  .mainstream-material-fetch {
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
        .progress-info {
          margin-bottom: 16px;

          h4 {
            margin: 0 0 8px;
            font-size: 16px;
            font-weight: 600;
          }

          p {
            margin: 0;
            font-size: 14px;
            color: var(--el-text-color-regular);
          }
        }

        .progress-stats {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          font-size: 13px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    &__results {
      .results-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;

        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
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

      .key-points ul {
        padding-left: 20px;
        margin: 0;

        li {
          margin-bottom: 8px;
          line-height: 1.5;
        }
      }
    }
  }

  @media (width <= 768px) {
    .mainstream-material-fetch {
      padding: 16px;

      &__header .header-content {
        flex-direction: column;
        gap: 12px;
      }

      .results-grid {
        grid-template-columns: 1fr;
      }
    }

    .material-item {
      .material-actions {
        justify-content: center;
      }
    }
  }
</style>
