<template>
  <div class="material-fetch">
    <!-- 搜索配置区域 -->
    <el-card class="material-fetch__config">
      <template #header>
        <div class="material-fetch__config-header">
          <h3>素材搜索配置</h3>
          <el-button type="primary" @click="startSearch" :disabled="!canStartSearch">
            开始搜索
          </el-button>
        </div>
      </template>

      <el-form :model="searchConfig" label-width="120px">
        <el-form-item label="搜索关键词" required>
          <el-input v-model="searchConfig.keywords" placeholder="请输入搜索关键词" clearable />
        </el-form-item>

        <el-form-item label="检索范围">
          <el-input
            v-model="searchConfig.searchScope"
            type="textarea"
            :rows="3"
            placeholder="描述AI理解的检索范围，例如：寻找关于现代建筑设计的素材"
          />
        </el-form-item>

        <el-form-item label="搜索源">
          <el-checkbox-group v-model="searchConfig.providers">
            <el-checkbox v-for="provider in providers" :key="provider.id" :label="provider.id">
              {{ provider.name }}
              <el-tag
                size="small"
                :type="provider.type === 'ai' ? 'warning' : 'success'"
                style="margin-left: 4px"
              >
                {{ provider.type === 'ai' ? 'AI' : 'API' }}
              </el-tag>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="AI提供商">
          <el-select v-model="searchConfig.aiProvider" placeholder="选择AI提供商" clearable>
            <el-option
              v-for="provider in aiProviders"
              :key="provider.id"
              :label="provider.name"
              :value="provider.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- AI检索需求确认表单 -->
    <el-dialog
      v-model="showConfirmDialog"
      title="AI检索需求确认"
      width="600px"
      :before-close="closeConfirmDialog"
    >
      <el-form :model="confirmForm" label-width="120px">
        <el-form-item label="检索关键词">
          <el-input v-model="confirmForm.keywords" readonly />
        </el-form-item>
        <el-form-item label="检索范围">
          <el-input
            v-model="confirmForm.searchScope"
            type="textarea"
            :rows="4"
            placeholder="请编辑AI理解的检索范围描述"
          />
        </el-form-item>
        <el-form-item label="搜索源">
          <div class="confirm-providers">
            <el-tag
              v-for="provider in selectedProviders"
              :key="provider.id"
              size="small"
              :type="provider.type === 'ai' ? 'warning' : 'success'"
            >
              {{ provider.name }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="AI提供商">
          <el-tag v-if="selectedAIProvider" type="warning" size="small">
            {{ selectedAIProvider?.name }}
          </el-tag>
          <span v-else style="color: var(--el-text-color-secondary)">未选择</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeConfirmDialog">取消</el-button>
        <el-button type="primary" @click="confirmSearch">确认检索</el-button>
      </template>
    </el-dialog>

    <!-- 搜索进度区域 -->
    <el-card class="material-fetch__progress" v-if="isSearching">
      <SearchProgress
        :progress="searchProgress"
        :config="searchConfig"
        :providers="providers"
        :is-active="isSearching"
        @cancel="cancelSearch"
        @update:config="updateSearchConfig"
      />
    </el-card>

    <!-- 搜索结果区域 -->
    <div class="material-fetch__results" v-if="materials.length > 0">
      <div class="material-fetch__results-header">
        <h3>搜索结果 ({{ materials.length }} 个素材)</h3>
        <div class="material-fetch__results-actions">
          <el-button @click="selectAll">全选</el-button>
          <el-button @click="clearSelection">取消选择</el-button>
          <el-button
            type="primary"
            @click="addToLibrary"
            :disabled="selectedMaterials.length === 0"
          >
            添加到素材库 ({{ selectedMaterials.length }})
          </el-button>
        </div>
      </div>

      <div class="material-fetch__grid">
        <MaterialCard
          v-for="material in materials"
          :key="material.id"
          :material="material"
          :selected="selectedMaterials.includes(material.id)"
          :loading="loadingMaterials.includes(material.id)"
          :show-type="false"
          @select="toggleMaterialSelection"
          @preview="showPreview"
          @download="downloadMaterial"
          @click="selectMaterial(material)"
        />
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewMaterial?.title"
      width="80%"
      :before-close="closePreview"
    >
      <div class="material-fetch__preview" v-if="previewMaterial">
        <div class="material-fetch__preview-info">
          <h4>{{ previewMaterial.title }}</h4>
          <p><strong>来源：</strong>{{ previewMaterial.source }}</p>
          <p><strong>总结：</strong>{{ previewMaterial.summary }}</p>
          <p
            ><strong>标签：</strong>
            <el-tag
              v-for="tag in previewMaterial.tags"
              :key="tag"
              size="small"
              style="margin-right: 4px"
            >
              {{ tag }}
            </el-tag>
          </p>
          <p><strong>创建时间：</strong>{{ formatDate(previewMaterial.createdAt) }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import MaterialCard from '@/components/custom/material-card/MaterialCard.vue'
  import SearchProgress from '@/components/custom/search-progress/SearchProgress.vue'
  import { useMaterialStore } from '@/store/material'
  import type { Material, SearchConfig } from '@/types/material'

  const materialStore = useMaterialStore()

  // 搜索配置
  const searchConfig = ref<SearchConfig>({
    keywords: '',
    providers: [],
    searchScope: '',
    filters: {
      type: ['text']
    }
  })

  // 搜索进度
  const searchProgress = ref<SearchProgress>({
    stage: 'config',
    current: 0,
    total: 100,
    message: '准备搜索...'
  })

  // 状态
  const isSearching = ref(false)
  const showConfirmDialog = ref(false)
  const previewVisible = ref(false)
  const previewMaterial = ref<Material | null>(null)
  const loadingMaterials = ref<string[]>([])

  // 确认表单
  const confirmForm = ref({
    keywords: '',
    searchScope: ''
  })

  // 计算属性
  const materials = computed(() => materialStore.materials)
  const selectedMaterials = computed(() => materialStore.selectedMaterials)
  const providers = computed(() => materialStore.providers)

  const aiProviders = computed(() => providers.value.filter((provider) => provider.type === 'ai'))

  const selectedProviders = computed(() => {
    return providers.value.filter((provider) => searchConfig.value.providers.includes(provider.id))
  })

  const selectedAIProvider = computed(() => {
    if (!searchConfig.value.aiProvider) return null
    return providers.value.find((provider) => provider.id === searchConfig.value.aiProvider)
  })

  const canStartSearch = computed(() => {
    return searchConfig.value.keywords.trim() !== '' && searchConfig.value.providers.length > 0
  })

  // 方法
  function startSearch() {
    if (!canStartSearch.value) {
      ElMessage.warning('请输入搜索关键词并选择至少一个搜索源')
      return
    }

    // 设置确认表单数据
    confirmForm.value = {
      keywords: searchConfig.value.keywords,
      searchScope: searchConfig.value.searchScope
    }

    // 显示确认对话框
    showConfirmDialog.value = true
  }

  function closeConfirmDialog() {
    showConfirmDialog.value = false
  }

  function confirmSearch() {
    // 更新搜索配置中的检索范围
    searchConfig.value.searchScope = confirmForm.value.searchScope

    // 关闭确认对话框
    showConfirmDialog.value = false

    // 开始搜索
    isSearching.value = true
    searchProgress.value = {
      stage: 'config',
      current: 0,
      total: 100,
      message: '正在配置搜索...'
    }

    // 模拟搜索过程
    simulateSearch()
  }

  function simulateSearch() {
    // 阶段1: 配置
    setTimeout(() => {
      searchProgress.value = {
        stage: 'searching',
        current: 0,
        total: 100,
        message: '正在搜索素材...'
      }

      // 模拟搜索进度
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)

          // 进入处理阶段
          searchProgress.value = {
            stage: 'processing',
            current: 0,
            total: 100,
            message: '正在处理搜索结果...'
          }

          setTimeout(() => {
            // 完成搜索
            searchProgress.value = {
              stage: 'completed',
              current: 100,
              total: 100,
              message: '搜索完成'
            }

            // 执行实际搜索
            performSearch()
          }, 1000)
        }

        searchProgress.value.current = progress
      }, 500)
    }, 1000)
  }

  async function performSearch() {
    try {
      await materialStore.searchMaterials(searchConfig.value)
      ElMessage.success('搜索完成')
    } catch (err) {
      ElMessage.error('搜索失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      isSearching.value = false
    }
  }

  function cancelSearch() {
    ElMessageBox.confirm('确定要取消搜索吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      isSearching.value = false
      ElMessage.info('搜索已取消')
    })
  }

  function updateSearchConfig(config: SearchConfig) {
    searchConfig.value = config
  }

  function toggleMaterialSelection(id: string) {
    materialStore.toggleMaterialSelection(id)
  }

  function selectMaterial(material: Material) {
    toggleMaterialSelection(material.id)
  }

  function selectAll() {
    materialStore.selectAll()
  }

  function clearSelection() {
    materialStore.clearSelection()
  }

  async function addToLibrary() {
    if (selectedMaterials.value.length === 0) {
      ElMessage.warning('请先选择要添加的素材')
      return
    }

    try {
      await materialStore.addToLibrary(selectedMaterials.value)
      ElMessage.success(`已添加 ${selectedMaterials.value.length} 个素材到素材库`)
      clearSelection()
    } catch (err) {
      console.error('添加到素材库失败:', err)
      ElMessage.error('添加到素材库失败')
    }
  }

  function showPreview(material: Material) {
    previewMaterial.value = material
    previewVisible.value = true
  }

  function closePreview() {
    previewVisible.value = false
    previewMaterial.value = null
  }

  async function downloadMaterial(material: Material) {
    if (!material.url) {
      ElMessage.warning('该素材暂不支持下载')
      return
    }

    loadingMaterials.value.push(material.id)

    try {
      // 模拟下载
      await new Promise((resolve) => setTimeout(resolve, 1000))
      ElMessage.success('下载完成')
    } catch (err) {
      console.error('下载失败:', err)
      ElMessage.error('下载失败')
    } finally {
      loadingMaterials.value = loadingMaterials.value.filter((id) => id !== material.id)
    }
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // 生命周期
  onMounted(() => {
    // 默认选择博查和deepseek
    searchConfig.value.providers = ['bocha']
    searchConfig.value.aiProvider = 'deepseek'
  })
</script>

<style scoped lang="scss">
  .material-fetch {
    padding: 20px;

    &__config {
      margin-bottom: 20px;
    }

    &__progress {
      margin-bottom: 20px;
    }

    &__config-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
    }

    &__results {
      margin-top: 20px;
    }

    &__results-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
    }

    &__results-actions {
      display: flex;
      gap: 8px;
    }

    &__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    &__preview {
      &-info {
        h4 {
          margin: 0 0 16px;
          font-size: 20px;
          font-weight: 600;
        }

        p {
          margin: 8px 0;
          line-height: 1.6;
        }
      }
    }
  }

  @media (width <= 768px) {
    .material-fetch {
      padding: 16px;

      &__grid {
        grid-template-columns: 1fr;
      }
    }
  }

  .confirm-providers {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
</style>
