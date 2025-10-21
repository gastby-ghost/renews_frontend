<template>
  <div class="api-config-viewer">
    <el-card class="api-config-viewer__card">
      <template #header>
        <div class="api-config-viewer__header">
          <h3>API配置查看器</h3>
          <div class="header-actions">
            <el-button size="small" @click="refreshConfig">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button size="small" @click="validateConfig">
              <el-icon><CircleCheck /></el-icon>
              验证
            </el-button>
            <el-button size="small" @click="exportConfig">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </div>
      </template>

      <div class="api-config-viewer__content">
        <!-- 配置概览 -->
        <div class="config-overview">
          <h4>配置概览</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="Mock模式">
              <el-tag :type="config.useMock ? 'warning' : 'success'">
                {{ config.useMock ? '开启' : '关闭' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Mock延迟"> {{ config.mockDelay }}ms </el-descriptions-item>
            <el-descriptions-item label="调试信息">
              <el-tag :type="config.showDebugInfo ? 'info' : ''">
                {{ config.showDebugInfo ? '开启' : '关闭' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="服务数量">
              {{ serviceCount }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 服务列表 -->
        <div class="services-list">
          <h4>服务列表</h4>
          <el-collapse v-model="activeServices" accordion>
            <el-collapse-item
              v-for="(service, serviceName) in servicesInfo"
              :key="serviceName"
              :title="service.name"
              :name="serviceName"
            >
              <div class="service-details">
                <!-- 基本信息 -->
                <div class="service-basic">
                  <el-descriptions :column="2" size="small" border>
                    <el-descriptions-item label="服务名称">
                      {{ service.name }}
                    </el-descriptions-item>
                    <el-descriptions-item label="基础URL">
                      <code>{{ service.baseUrl }}</code>
                    </el-descriptions-item>
                    <el-descriptions-item label="支持方法">
                      <el-tag
                        v-for="method in service.methods"
                        :key="method"
                        size="small"
                        class="method-tag"
                      >
                        {{ method }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="Mock状态">
                      <el-tag :type="service.enableMock ? 'warning' : 'success'" size="small">
                        {{ service.enableMock ? '启用' : '禁用' }}
                      </el-tag>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>

                <!-- 路径配置 -->
                <div class="service-paths">
                  <h5>API路径</h5>
                  <el-table :data="getPathTableData(serviceName)" size="small" border>
                    <el-table-column prop="path" label="路径" width="200">
                      <template #default="{ row }">
                        <code>{{ row.path }}</code>
                      </template>
                    </el-table-column>
                    <el-table-column prop="description" label="描述" />
                    <el-table-column prop="methods" label="支持方法" width="150">
                      <template #default="{ row }">
                        <el-tag
                          v-for="method in row.methods"
                          :key="method"
                          size="small"
                          class="method-tag"
                        >
                          {{ method }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="120">
                      <template #default="{ row }">
                        <el-button
                          size="small"
                          text
                          @click="showPathDetails(serviceName, row.path)"
                        >
                          详情
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <!-- 验证结果 -->
        <div v-if="validationResult" class="validation-result">
          <h4>配置验证</h4>
          <el-alert
            :title="validationResult.isValid ? '配置验证通过' : '配置验证失败'"
            :type="validationResult.isValid ? 'success' : 'error'"
            :closable="false"
            show-icon
          >
            <div v-if="!validationResult.isValid">
              <p>发现以下问题：</p>
              <ul>
                <li v-for="error in validationResult.errors" :key="error">
                  {{ error }}
                </li>
              </ul>
            </div>
            <div v-else>
              <p>所有API配置都符合规范要求。</p>
            </div>
          </el-alert>
        </div>
      </div>
    </el-card>

    <!-- 路径详情对话框 -->
    <el-dialog
      v-model="pathDetailsVisible"
      title="API路径详情"
      width="800px"
      :before-close="closePathDetails"
    >
      <div v-if="selectedPathConfig" class="path-details-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="路径">
            <code>{{ selectedPath }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="描述">
            {{ selectedPathConfig.description }}
          </el-descriptions-item>
          <el-descriptions-item label="支持方法">
            <el-tag
              v-for="method in selectedPathConfig.methods"
              :key="method"
              size="small"
              class="method-tag"
            >
              {{ method }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedPathConfig.request" class="path-request">
          <h5>请求配置</h5>
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="请求体类型">
              {{ selectedPathConfig.request.bodyType || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="需要认证">
              <el-tag
                :type="selectedPathConfig.request.requireAuth ? 'warning' : 'success'"
                size="small"
              >
                {{ selectedPathConfig.request.requireAuth ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="selectedPathConfig.request.params" class="request-params">
            <h6>请求参数</h6>
            <el-table
              :data="getParamsTableData(selectedPathConfig.request.params)"
              size="small"
              border
            >
              <el-table-column prop="name" label="参数名" />
              <el-table-column prop="type" label="类型" />
              <el-table-column prop="required" label="必填" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.required ? 'danger' : 'success'" size="small">
                    {{ row.required ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-if="selectedPathConfig.request.headers" class="request-headers">
            <h6>请求头</h6>
            <el-table
              :data="getHeadersTableData(selectedPathConfig.request.headers)"
              size="small"
              border
            >
              <el-table-column prop="name" label="头名称" />
              <el-table-column prop="value" label="值" />
            </el-table>
          </div>
        </div>

        <div v-if="selectedPathConfig.response" class="path-response">
          <h5>响应配置</h5>
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="数据类型">
              {{ selectedPathConfig.response.dataType || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="状态码">
              {{ selectedPathConfig.response.statusCode || '200' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="selectedPathConfig.custom" class="path-custom">
          <h5>自定义配置</h5>
          <pre>{{ JSON.stringify(selectedPathConfig.custom, null, 2) }}</pre>
        </div>
      </div>

      <template #footer>
        <el-button @click="closePathDetails">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Refresh, CircleCheck, Download } from '@element-plus/icons-vue'
  import { apiConfigManager } from '@/config/api'
  import type { ApiPathConfig } from '@/config/api/types'

  defineOptions({ name: 'ApiConfigViewer' })

  // 响应式数据
  const config = computed(() => apiConfigManager.getConfig())
  const servicesInfo = computed(() => apiConfigManager.getAllServicesInfo())
  const serviceCount = computed(() => Object.keys(servicesInfo.value).length)

  const activeServices = ref<string[]>([])
  const validationResult = ref<{
    isValid: boolean
    errors: string[]
  } | null>(null)

  // 路径详情对话框
  const pathDetailsVisible = ref(false)
  const selectedService = ref('')
  const selectedPath = ref('')
  const selectedPathConfig = ref<ApiPathConfig | null>(null)

  // 刷新配置
  const refreshConfig = () => {
    // 强制更新组件
    ElMessage.success('配置已刷新')
  }

  // 验证配置
  const validateConfig = () => {
    const result = apiConfigManager.validateApiConfig()
    validationResult.value = result

    if (result.isValid) {
      ElMessage.success('配置验证通过')
    } else {
      ElMessage.error(`配置验证失败，发现 ${result.errors.length} 个问题`)
    }
  }

  // 导出配置
  const exportConfig = () => {
    const configJson = apiConfigManager.exportConfig()
    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-config-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('配置已导出')
  }

  // 获取路径表格数据
  const getPathTableData = (serviceName: string) => {
    const service = apiConfigManager.getServiceConfig(serviceName)
    if (!service) return []

    return Object.entries(service.paths).map(([path, config]) => ({
      path,
      description: config.description,
      methods: config.methods
    }))
  }

  // 显示路径详情
  const showPathDetails = (serviceName: string, path: string) => {
    selectedService.value = serviceName
    selectedPath.value = path
    selectedPathConfig.value = apiConfigManager.getPathConfig(serviceName, path)
    pathDetailsVisible.value = true
  }

  // 关闭路径详情
  const closePathDetails = () => {
    pathDetailsVisible.value = false
    selectedService.value = ''
    selectedPath.value = ''
    selectedPathConfig.value = null
  }

  // 获取参数表格数据
  const getParamsTableData = (params: Record<string, any>) => {
    return Object.entries(params).map(([name, type]) => ({
      name,
      type: typeof type === 'string' ? type : type.constructor.name,
      required: name.includes('required')
    }))
  }

  // 获取请求头表格数据
  const getHeadersTableData = (headers: Record<string, string>) => {
    return Object.entries(headers).map(([name, value]) => ({
      name,
      value
    }))
  }

  // 组件挂载时初始化
  onMounted(() => {
    // 默认展开第一个服务
    if (serviceCount.value > 0) {
      activeServices.value = [Object.keys(servicesInfo.value)[0]]
    }
  })
</script>

<style lang="scss" scoped>
  .api-config-viewer {
    max-width: 1200px;
    padding: 20px;
    margin: 0 auto;

    &__card {
      margin-bottom: 20px;
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    &__content {
      > div {
        margin-bottom: 24px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .config-overview {
      h4 {
        margin-bottom: 16px;
        color: var(--el-text-color-primary);
      }
    }

    .services-list {
      h4 {
        margin-bottom: 16px;
        color: var(--el-text-color-primary);
      }

      .service-details {
        padding: 16px 0;

        .service-basic {
          margin-bottom: 20px;
        }

        .service-paths {
          h5 {
            margin: 16px 0 12px;
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }

          .method-tag {
            margin-right: 4px;
            margin-bottom: 4px;
          }
        }
      }
    }

    .validation-result {
      h4 {
        margin-bottom: 16px;
        color: var(--el-text-color-primary);
      }

      ul {
        padding-left: 20px;
        margin: 8px 0 0 20px;

        li {
          margin-bottom: 4px;
          color: var(--el-text-color-regular);
        }
      }
    }

    .path-details-content {
      .path-request,
      .path-response,
      .path-custom {
        margin-top: 20px;

        h5,
        h6 {
          margin-bottom: 12px;
          color: var(--el-text-color-primary);
        }

        h5 {
          font-size: 16px;
          font-weight: 600;
        }

        h6 {
          font-size: 14px;
          font-weight: 600;
        }
      }

      .request-params,
      .request-headers {
        margin-top: 12px;
      }

      pre {
        padding: 12px;
        overflow-x: auto;
        font-size: 12px;
        color: var(--el-text-color-regular);
        background: var(--el-fill-color-lighter);
        border-radius: 6px;
      }
    }

    code {
      padding: 2px 6px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: var(--el-color-primary);
      background: var(--el-fill-color-lighter);
      border-radius: 4px;
    }

    .method-tag {
      margin-right: 4px;
      margin-bottom: 4px;
    }
  }
</style>
