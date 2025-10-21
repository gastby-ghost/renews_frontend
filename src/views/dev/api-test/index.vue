<template>
  <div class="api-test">
    <el-card class="api-test__card">
      <template #header>
        <h3>API切换功能测试</h3>
      </template>

      <div class="api-test__content">
        <!-- 当前配置信息 -->
        <div class="api-test__config">
          <h4>当前API配置</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="Mock模式">
              <el-tag :type="config.useMock ? 'warning' : 'success'">
                {{ config.useMock ? 'Mock数据' : '真实API' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Mock延迟"> {{ config.mockDelay }}ms </el-descriptions-item>
            <el-descriptions-item label="调试信息">
              <el-tag :type="config.showDebugInfo ? 'info' : 'info'">
                {{ config.showDebugInfo ? '开启' : '关闭' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="开发模式">
              <el-tag type="success">{{ isDev ? '是' : '否' }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 测试按钮 -->
        <div class="api-test__actions">
          <h4>API测试</h4>
          <div class="test-buttons">
            <el-button type="primary" @click="testAgentService" :loading="testing.agent">
              测试Agent服务
            </el-button>
            <el-button type="success" @click="testMaterialService" :loading="testing.material">
              测试素材服务
            </el-button>
            <el-button type="warning" @click="testSearchService" :loading="testing.search">
              测试搜索服务
            </el-button>
            <el-button type="info" @click="testAllServices" :loading="testing.all">
              测试所有服务
            </el-button>
          </div>
        </div>

        <!-- 测试结果 -->
        <div class="api-test__results" v-if="results.length > 0">
          <h4>测试结果</h4>
          <div class="results-list">
            <div
              v-for="(result, index) in results"
              :key="index"
              class="result-item"
              :class="{ success: result.success, error: !result.success }"
            >
              <div class="result-header">
                <span class="result-service">{{ result.service }}</span>
                <span class="result-time">{{ result.timestamp }}</span>
                <el-tag :type="result.success ? 'success' : 'danger'" size="small">
                  {{ result.success ? '成功' : '失败' }}
                </el-tag>
              </div>
              <div class="result-content">
                <p><strong>请求:</strong> {{ result.request }}</p>
                <p><strong>响应:</strong> {{ result.response }}</p>
                <p v-if="result.error"><strong>错误:</strong> {{ result.error }}</p>
                <p><strong>耗时:</strong> {{ result.duration }}ms</p>
              </div>
            </div>
          </div>

          <div class="results-actions">
            <el-button size="small" @click="clearResults">清除结果</el-button>
            <el-button size="small" @click="exportResults">导出结果</el-button>
          </div>
        </div>

        <!-- 开发工具信息 -->
        <div class="api-test__dev-tools" v-if="isDev">
          <h4>开发工具</h4>
          <el-alert title="全局开发工具" type="info" :closable="false" show-icon>
            <p>在浏览器控制台中使用以下命令：</p>
            <code>window.__DEV_TOOLS__.toggleMock()</code> - 切换Mock模式<br />
            <code>window.__DEV_TOOLS__.setMockDelay(2000)</code> - 设置Mock延迟<br />
            <code>window.__DEV_TOOLS__.clearMockCache()</code> - 清除Mock缓存<br />
            <code>window.__DEV_TOOLS__.getConfig()</code> - 获取当前配置<br />
            <code>window.__DEV_TOOLS__.resetConfig()</code> - 重置配置
          </el-alert>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { apiConfigManager } from '@/config/api'
  import { agentService } from '@/services/agentService'
  import { materialApiService } from '@/services/materialApi'
  import { materialSearchService } from '@/services/materialSearch'

  defineOptions({ name: 'ApiTest' })

  // 响应式数据
  const isDev = import.meta.env.DEV
  const config = computed(() => apiConfigManager.getConfig())

  const testing = ref({
    agent: false,
    material: false,
    search: false,
    all: false
  })

  const results = ref<
    Array<{
      service: string
      request: string
      response: string
      error?: string
      success: boolean
      duration: number
      timestamp: string
    }>
  >([])

  // 测试Agent服务
  const testAgentService = async () => {
    testing.value.agent = true
    const startTime = Date.now()

    try {
      const agents = await agentService.getAvailableAgents()
      const duration = Date.now() - startTime

      results.value.unshift({
        service: 'Agent服务',
        request: 'GET /services',
        response: `获取到 ${agents.length} 个Agent服务`,
        success: true,
        duration,
        timestamp: new Date().toLocaleTimeString()
      })

      ElMessage.success('Agent服务测试成功')
    } catch (error) {
      const duration = Date.now() - startTime

      results.value.unshift({
        service: 'Agent服务',
        request: 'GET /services',
        response: '',
        error: error instanceof Error ? error.message : '未知错误',
        success: false,
        duration,
        timestamp: new Date().toLocaleTimeString()
      })

      ElMessage.error('Agent服务测试失败')
    } finally {
      testing.value.agent = false
    }
  }

  // 测试素材服务
  const testMaterialService = async () => {
    testing.value.material = true
    const startTime = Date.now()

    try {
      const materials = await materialApiService.getAllMaterials({ page: 1, page_size: 5 })
      const duration = Date.now() - startTime

      results.value.unshift({
        service: '素材服务',
        request: 'GET /materials?page=1&page_size=5',
        response: `获取到 ${materials.materials?.length || 0} 个素材`,
        success: true,
        duration,
        timestamp: new Date().toLocaleTimeString()
      })

      ElMessage.success('素材服务测试成功')
    } catch (error) {
      const duration = Date.now() - startTime

      results.value.unshift({
        service: '素材服务',
        request: 'GET /materials?page=1&page_size=5',
        response: '',
        error: error instanceof Error ? error.message : '未知错误',
        success: false,
        duration,
        timestamp: new Date().toLocaleTimeString()
      })

      ElMessage.error('素材服务测试失败')
    } finally {
      testing.value.material = false
    }
  }

  // 测试搜索服务
  const testSearchService = async () => {
    testing.value.search = true
    const startTime = Date.now()

    try {
      const providers = await materialSearchService.getProviders()
      const duration = Date.now() - startTime

      results.value.unshift({
        service: '搜索服务',
        request: 'GET /providers',
        response: `获取到 ${providers.length} 个搜索提供商`,
        success: true,
        duration,
        timestamp: new Date().toLocaleTimeString()
      })

      ElMessage.success('搜索服务测试成功')
    } catch (error) {
      const duration = Date.now() - startTime

      results.value.unshift({
        service: '搜索服务',
        request: 'GET /providers',
        response: '',
        error: error instanceof Error ? error.message : '未知错误',
        success: false,
        duration,
        timestamp: new Date().toLocaleTimeString()
      })

      ElMessage.error('搜索服务测试失败')
    } finally {
      testing.value.search = false
    }
  }

  // 测试所有服务
  const testAllServices = async () => {
    testing.value.all = true

    try {
      await testAgentService()
      await new Promise((resolve) => setTimeout(resolve, 500))

      await testMaterialService()
      await new Promise((resolve) => setTimeout(resolve, 500))

      await testSearchService()

      ElMessage.success('所有服务测试完成')
    } catch {
      ElMessage.error('服务测试过程中出现错误')
    } finally {
      testing.value.all = false
    }
  }

  // 清除结果
  const clearResults = () => {
    results.value = []
    ElMessage.success('测试结果已清除')
  }

  // 导出结果
  const exportResults = () => {
    const data = {
      config: config.value,
      results: results.value,
      exportTime: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-test-results-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('测试结果已导出')
  }

  // 监听配置变化
  const handleConfigChange = (newConfig: any) => {
    if (newConfig.showDebugInfo) {
      console.log('[ApiTest] 配置已更新:', newConfig)
    }
  }

  onMounted(() => {
    apiConfigManager.addChangeListener(handleConfigChange)
  })
</script>

<style lang="scss" scoped>
  .api-test {
    max-width: 1200px;
    padding: 20px;
    margin: 0 auto;

    &__card {
      margin-bottom: 20px;
    }

    &__content {
      > div {
        margin-bottom: 24px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    &__config {
      h4 {
        margin-bottom: 16px;
        color: var(--el-text-color-primary);
      }
    }

    &__actions {
      h4 {
        margin-bottom: 16px;
        color: var(--el-text-color-primary);
      }

      .test-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
    }

    &__results {
      h4 {
        margin-bottom: 16px;
        color: var(--el-text-color-primary);
      }

      .results-list {
        max-height: 400px;
        padding: 12px;
        overflow-y: auto;
        background: var(--el-fill-color-lighter);
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 6px;
      }

      .result-item {
        padding: 12px;
        margin-bottom: 12px;
        border-left: 4px solid;
        border-radius: 6px;

        &.success {
          background: var(--el-color-success-light-9);
          border-left-color: var(--el-color-success);
        }

        &.error {
          background: var(--el-color-danger-light-9);
          border-left-color: var(--el-color-danger);
        }

        &:last-child {
          margin-bottom: 0;
        }
      }

      .result-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .result-service {
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .result-time {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }

      .result-content {
        p {
          margin: 4px 0;
          font-size: 14px;
          color: var(--el-text-color-regular);

          strong {
            color: var(--el-text-color-primary);
          }
        }
      }

      .results-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
    }

    &__dev-tools {
      h4 {
        margin-bottom: 16px;
        color: var(--el-text-color-primary);
      }

      code {
        padding: 2px 6px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        background: var(--el-fill-color-light);
        border-radius: 4px;
      }
    }
  }
</style>
