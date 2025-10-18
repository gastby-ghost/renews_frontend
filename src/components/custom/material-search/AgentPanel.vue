<template>
  <div class="agent-panel">
    <el-alert
      title="功能开发中"
      type="info"
      description="Agent功能正在开发中，敬请期待更强大的智能搜索体验。"
      :closable="false"
      show-icon
      class="agent-panel__alert"
    />

    <div class="agent-panel__content">
      <!-- Agent配置选项 -->
      <el-tabs v-model="activeTab" class="agent-panel__tabs">
        <!-- 基础配置 -->
        <el-tab-pane label="基础配置" name="basic">
          <el-form :model="localConfig" label-width="120px">
            <el-form-item label="Agent类型">
              <el-select
                v-model="localConfig.agentType"
                placeholder="选择Agent类型"
                style="width: 100%"
                @change="handleAgentTypeChange"
              >
                <el-option
                  v-for="agent in availableAgents"
                  :key="agent.id"
                  :label="agent.name"
                  :value="agent.type"
                >
                  <div class="agent-option">
                    <div class="agent-option__info">
                      <span class="agent-option__name">{{ agent.name }}</span>
                      <span class="agent-option__description">{{ agent.description }}</span>
                    </div>
                    <el-tag size="small" :type="getAgentTagType(agent.type)">
                      {{ agent.type }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="AI增强">
              <el-switch
                v-model="localConfig.enableAIEnhancement"
                active-text="启用"
                inactive-text="禁用"
              />
              <div class="form-item-help">启用AI增强可以提高搜索结果的相关性和质量</div>
            </el-form-item>

            <el-form-item label="搜索深度">
              <el-slider
                v-model="localConfig.agentConfig.searchDepth"
                :min="1"
                :max="10"
                :step="1"
                show-stops
                show-input
              />
              <div class="form-item-help">搜索深度越高，结果越精确，但耗时更长</div>
            </el-form-item>

            <el-form-item label="结果过滤">
              <el-checkbox-group v-model="localConfig.agentConfig.filters">
                <el-checkbox label="highQuality">高质量内容</el-checkbox>
                <el-checkbox label="recent">最新内容</el-checkbox>
                <el-checkbox label="popular">热门内容</el-checkbox>
                <el-checkbox label="verified">已验证内容</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 高级配置 -->
        <el-tab-pane label="高级配置" name="advanced">
          <el-form :model="localConfig" label-width="120px">
            <el-form-item label="搜索策略">
              <el-radio-group v-model="localConfig.agentConfig.strategy">
                <el-radio label="comprehensive">全面搜索</el-radio>
                <el-radio label="focused">精准搜索</el-radio>
                <el-radio label="creative">创意搜索</el-radio>
                <el-radio label="custom">自定义</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="语言偏好">
              <el-select
                v-model="localConfig.agentConfig.language"
                placeholder="选择语言"
                style="width: 100%"
              >
                <el-option label="中文" value="zh" />
                <el-option label="英文" value="en" />
                <el-option label="中英混合" value="mixed" />
                <el-option label="自动检测" value="auto" />
              </el-select>
            </el-form-item>

            <el-form-item label="结果数量">
              <el-input-number
                v-model="localConfig.agentConfig.maxResults"
                :min="5"
                :max="100"
                :step="5"
              />
            </el-form-item>

            <el-form-item label="超时时间">
              <el-input-number
                v-model="localConfig.agentConfig.timeout"
                :min="10"
                :max="300"
                :step="10"
              />
              <span class="form-item-suffix">秒</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Agent能力 -->
        <el-tab-pane label="Agent能力" name="capabilities">
          <div class="capabilities-container">
            <div
              v-for="agent in availableAgents"
              :key="agent.id"
              class="capability-card"
              :class="{ active: localConfig.agentType === agent.type }"
            >
              <div class="capability-card__header">
                <h4>{{ agent.name }}</h4>
                <el-tag size="small" :type="getAgentTagType(agent.type)">
                  {{ agent.type }}
                </el-tag>
              </div>
              <p class="capability-card__description">{{ agent.description }}</p>
              <div class="capability-card__abilities">
                <el-tag
                  v-for="ability in agent.capabilities"
                  :key="ability"
                  size="small"
                  class="ability-tag"
                >
                  {{ ability }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 操作按钮 -->
      <div class="agent-panel__actions">
        <el-button @click="resetConfig">重置配置</el-button>
        <el-button type="primary" @click="applyConfig" :loading="applying">应用配置</el-button>
        <el-button
          type="success"
          @click="startSearch"
          :loading="searching"
          :disabled="!canStartSearch"
        >
          开始Agent搜索
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import type { AgentSearchConfig, AgentService } from '@/types/material'

  interface Props {
    config: {
      agentType: 'search' | 'scope' | 'custom'
      enableAIEnhancement: boolean
      agentConfig: Record<string, any>
    }
    availableAgents: AgentService[]
  }

  interface Emits {
    (e: 'update:config', config: Props['config']): void
    (e: 'search', config: AgentSearchConfig): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 响应式数据
  const activeTab = ref('basic')
  const applying = ref(false)
  const searching = ref(false)

  // 本地配置副本
  const localConfig = reactive({
    agentType: props.config.agentType,
    enableAIEnhancement: props.config.enableAIEnhancement,
    agentConfig: {
      searchDepth: 5,
      strategy: 'comprehensive',
      language: 'zh',
      maxResults: 20,
      timeout: 60,
      filters: ['highQuality'],
      ...props.config.agentConfig
    }
  })

  // 计算属性
  const canStartSearch = computed(() => {
    return localConfig.agentType && localConfig.agentConfig.searchDepth
  })

  // 监听props变化
  watch(
    () => props.config,
    (newConfig) => {
      Object.assign(localConfig, {
        agentType: newConfig.agentType,
        enableAIEnhancement: newConfig.enableAIEnhancement,
        agentConfig: {
          searchDepth: 5,
          strategy: 'comprehensive',
          language: 'zh',
          maxResults: 20,
          timeout: 60,
          filters: ['highQuality'],
          ...newConfig.agentConfig
        }
      })
    },
    { deep: true }
  )

  // 方法
  const getAgentTagType = (type: string) => {
    switch (type) {
      case 'search':
        return 'primary'
      case 'scope':
        return 'success'
      case 'custom':
        return 'warning'
      default:
        return 'info'
    }
  }

  const handleAgentTypeChange = (type: string) => {
    // 根据Agent类型调整默认配置
    if (type === 'search') {
      localConfig.agentConfig.strategy = 'comprehensive'
      localConfig.agentConfig.searchDepth = 5
    } else if (type === 'scope') {
      localConfig.agentConfig.strategy = 'focused'
      localConfig.agentConfig.searchDepth = 7
    } else if (type === 'custom') {
      localConfig.agentConfig.strategy = 'custom'
      localConfig.agentConfig.searchDepth = 6
    }
  }

  const resetConfig = () => {
    localConfig.agentType = 'search'
    localConfig.enableAIEnhancement = true
    localConfig.agentConfig = {
      searchDepth: 5,
      strategy: 'comprehensive',
      language: 'zh',
      maxResults: 20,
      timeout: 60,
      filters: ['highQuality']
    }
    ElMessage.success('配置已重置')
  }

  const applyConfig = () => {
    applying.value = true

    setTimeout(() => {
      emit('update:config', {
        agentType: localConfig.agentType,
        enableAIEnhancement: localConfig.enableAIEnhancement,
        agentConfig: { ...localConfig.agentConfig }
      })

      applying.value = false
      ElMessage.success('配置已应用')
    }, 500)
  }

  const startSearch = () => {
    searching.value = true

    // 构建搜索配置
    const searchConfig: AgentSearchConfig = {
      keywords: '', // 将从父组件获取
      providers: [], // 将从父组件获取
      searchScope: '',
      agentType: localConfig.agentType,
      agentConfig: { ...localConfig.agentConfig },
      filters: {},
      maxResults: localConfig.agentConfig.maxResults,
      enableAIEnhancement: localConfig.enableAIEnhancement
    }

    setTimeout(() => {
      emit('search', searchConfig)
      searching.value = false
      ElMessage.success('Agent搜索已启动')
    }, 1000)
  }
</script>

<style scoped lang="scss">
  .agent-panel {
    &__alert {
      margin-bottom: 20px;
    }

    &__content {
      min-height: 400px;
    }

    &__tabs {
      margin-bottom: 20px;
    }

    &__actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 20px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }

  .agent-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    &__info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    &__name {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    &__description {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .form-item-help {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .form-item-suffix {
    margin-left: 8px;
    color: var(--el-text-color-secondary);
  }

  .capabilities-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  .capability-card {
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
    }

    &.active {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    &__description {
      margin: 0 0 12px;
      font-size: 14px;
      line-height: 1.5;
      color: var(--el-text-color-regular);
    }

    &__abilities {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .ability-tag {
    margin-right: 0;
  }
</style>
