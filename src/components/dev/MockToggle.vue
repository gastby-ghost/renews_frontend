<template>
  <!-- 只在开发模式下显示 -->
  <div v-if="isDev" class="mock-toggle" :class="{ expanded: expanded }">
    <!-- 主按钮 -->
    <div
      class="mock-toggle__button"
      :class="{ 'mock-mode': currentUseMock }"
      :key="forceUpdate"
      @click="toggleMock"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <el-icon class="mock-toggle__icon">
        <component :is="currentUseMock ? DataBoard : Connection" />
      </el-icon>

      <!-- 状态指示器 -->
      <div class="mock-toggle__indicator" :class="{ active: currentUseMock }"></div>

      <!-- 工具提示 -->
      <transition name="fade">
        <div v-if="showTooltip && !expanded" class="mock-toggle__tooltip">
          {{ currentUseMock ? 'Mock模式' : '真实API' }}
        </div>
      </transition>
    </div>

    <!-- 展开面板 -->
    <transition name="slide-up">
      <div v-if="expanded" class="mock-toggle__panel">
        <div class="mock-toggle__panel-header">
          <h4>API配置</h4>
          <el-button size="small" text @click="expanded = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <div class="mock-toggle__panel-content">
          <!-- 当前状态 -->
          <div class="mock-toggle__status">
            <div class="status-item">
              <span class="label">当前模式:</span>
              <el-tag :type="currentUseMock ? 'warning' : 'success'" size="small">
                {{ currentUseMock ? 'Mock数据' : '真实API' }}
              </el-tag>
            </div>
            <div class="status-item">
              <span class="label">调试信息:</span>
              <el-switch v-model="localShowDebugInfo" size="small" @change="updateDebugInfo" />
            </div>
          </div>

          <!-- Mock延迟设置 -->
          <div class="mock-toggle__delay">
            <div class="delay-item">
              <span class="label">Mock延迟:</span>
              <el-input-number
                v-model="localMockDelay"
                :min="0"
                :max="5000"
                :step="100"
                size="small"
                controls-position="right"
                @change="updateMockDelay"
              />
              <span class="unit">ms</span>
            </div>
          </div>

          <!-- 服务状态 -->
          <div class="mock-toggle__services">
            <div class="services-title">服务状态</div>
            <div class="services-list">
              <div v-for="(service, key) in services" :key="key" class="service-item">
                <span class="service-name">{{ service.name }}</span>
                <el-tag :type="service.enableMock ? 'warning' : 'success'" size="small">
                  {{ service.enableMock ? 'Mock' : 'API' }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="mock-toggle__actions">
            <el-button size="small" @click="refreshMockData">
              <el-icon><Refresh /></el-icon>
              刷新Mock
            </el-button>
            <el-button size="small" @click="resetConfig">
              <el-icon><RefreshLeft /></el-icon>
              重置配置
            </el-button>
            <el-button size="small" type="primary" @click="exportConfig">
              <el-icon><Download /></el-icon>
              导出配置
            </el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 拖拽手柄 -->
    <div v-if="expanded" class="mock-toggle__drag-handle" @mousedown="startDrag">
      <el-icon><Rank /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    DataBoard,
    Connection,
    Close,
    Refresh,
    RefreshLeft,
    Download,
    Rank
  } from '@element-plus/icons-vue'
  import { apiConfigManager } from '@/config/api'

  // 响应式数据
  const isDev = import.meta.env.DEV
  const expanded = ref(false)
  const showTooltip = ref(false)
  const isDragging = ref(false)
  const dragStartPos = ref({ x: 0, y: 0 })
  const buttonPos = ref({ x: 24, y: 24 }) // 默认右下角位置

  // 从配置管理器获取状态
  const config = computed(() => apiConfigManager.getConfig())
  const services = computed(() => apiConfigManager.getAllServicesInfo())

  // 本地状态（用于双向绑定）
  const localMockDelay = ref(config.value.mockDelay)
  const localShowDebugInfo = ref(config.value.showDebugInfo)

  // 强制更新按钮状态的响应式变量
  const forceUpdate = ref(0)

  // 当前状态的响应式引用，确保UI能及时更新
  const currentUseMock = ref(config.value.useMock)

  // 监听配置变化
  const updateLocalState = () => {
    const currentConfig = apiConfigManager.getConfig()
    localMockDelay.value = currentConfig.mockDelay
    localShowDebugInfo.value = currentConfig.showDebugInfo

    // 更新当前状态引用
    currentUseMock.value = currentConfig.useMock

    // 强制更新按钮状态
    forceUpdate.value++

    if (currentConfig.showDebugInfo) {
      console.log('[MockToggle] 配置已更新:', currentConfig)
      console.log('[MockToggle] useMock状态:', currentConfig.useMock)
      console.log('[MockToggle] currentUseMock:', currentUseMock.value)
    }
  }

  // 切换Mock模式
  const toggleMock = () => {
    const currentConfig = apiConfigManager.getConfig()
    const oldMode = currentConfig.useMock
    const newMode = !oldMode

    if (currentConfig.showDebugInfo) {
      console.log('[MockToggle] 准备切换Mock模式:', { oldMode, newMode })
    }

    // 立即更新本地状态以提供即时反馈
    currentUseMock.value = newMode
    forceUpdate.value++

    apiConfigManager.setUseMock(newMode)

    // 等待配置更新后再更新本地状态
    nextTick(() => {
      updateLocalState()

      if (currentConfig.showDebugInfo) {
        console.log('[MockToggle] 切换完成，当前配置:', apiConfigManager.getConfig())
        console.log('[MockToggle] 最终currentUseMock:', currentUseMock.value)
      }
    })

    ElMessage.success(`已切换到${newMode ? 'Mock数据' : '真实API'}模式`)
  }

  // 更新Mock延迟
  const updateMockDelay = (value: number | undefined) => {
    if (value !== undefined) {
      apiConfigManager.setMockDelay(value)
      updateLocalState()

      const currentConfig = apiConfigManager.getConfig()
      if (currentConfig.showDebugInfo) {
        console.log('[MockToggle] Mock延迟已更新:', value)
      }

      ElMessage.success(`Mock延迟已更新为 ${value}ms`)
    }
  }

  // 更新调试信息设置
  const updateDebugInfo = (value: boolean | string | number | undefined) => {
    const boolValue = typeof value === 'boolean' ? value : value === 'true'
    apiConfigManager.setShowDebugInfo(boolValue)
    updateLocalState()

    if (boolValue) {
      console.log('[MockToggle] 调试信息已开启')
    }

    ElMessage.success(`调试信息已${boolValue ? '开启' : '关闭'}`)
  }

  // 刷新Mock数据
  const refreshMockData = () => {
    // 这里可以添加刷新Mock数据的逻辑
    ElMessage.success('Mock数据已刷新')
  }

  // 重置配置
  const resetConfig = () => {
    apiConfigManager.resetToDefault()
    updateLocalState()

    const currentConfig = apiConfigManager.getConfig()
    if (currentConfig.showDebugInfo) {
      console.log('[MockToggle] 配置已重置:', currentConfig)
    }

    ElMessage.success('配置已重置为默认值')
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

  // 拖拽功能
  const startDrag = (e: MouseEvent) => {
    isDragging.value = true
    dragStartPos.value = {
      x: e.clientX - buttonPos.value.x,
      y: e.clientY - buttonPos.value.y
    }

    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
    e.preventDefault()
  }

  const onDrag = (e: MouseEvent) => {
    if (!isDragging.value) return

    const newX = e.clientX - dragStartPos.value.x
    const newY = e.clientY - dragStartPos.value.y

    // 限制在窗口范围内
    const maxX = window.innerWidth - 200 // 按钮宽度约200px
    const maxY = window.innerHeight - 200 // 按钮高度约200px

    buttonPos.value = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    }
  }

  const stopDrag = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }

  // 点击外部关闭面板
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as Element
    if (!target.closest('.mock-toggle')) {
      expanded.value = false
    }
  }

  // 键盘快捷键
  const handleKeydown = (e: KeyboardEvent) => {
    // Ctrl/Cmd + Shift + M 切换Mock模式
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
      e.preventDefault()
      toggleMock()
    }
  }

  onMounted(() => {
    apiConfigManager.addChangeListener(updateLocalState)
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    apiConfigManager.removeChangeListener(updateLocalState)
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  })
</script>

<style lang="scss" scoped>
  .mock-toggle {
    position: fixed;
    right: v-bind('buttonPos.x + "px"');
    bottom: v-bind('buttonPos.y + "px"');
    z-index: 9999;

    &__button {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      cursor: pointer;
      background: var(--el-bg-color);
      border: 2px solid var(--el-border-color);
      border-radius: 50%;
      box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 6px 16px rgb(0 0 0 / 20%);
        transform: scale(1.05);
      }

      &.mock-mode {
        color: white;
        background: var(--el-color-warning);
        border-color: var(--el-color-warning);
      }
    }

    &__icon {
      font-size: 24px;
      transition: transform 0.3s ease;
    }

    &__button:hover &__icon {
      transform: rotate(180deg);
    }

    &__indicator {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 12px;
      height: 12px;
      background: var(--el-color-success);
      border: 2px solid var(--el-bg-color);
      border-radius: 50%;
      transition: all 0.3s ease;

      &.active {
        background: var(--el-color-warning);
        animation: pulse 2s infinite;
      }
    }

    &__tooltip {
      position: absolute;
      right: 0;
      bottom: 100%;
      padding: 6px 12px;
      margin-bottom: 8px;
      font-size: 12px;
      white-space: nowrap;
      background: var(--el-bg-color-overlay);
      border: 1px solid var(--el-border-color);
      border-radius: 6px;
      box-shadow: 0 2px 8px rgb(0 0 0 / 15%);

      &::after {
        position: absolute;
        top: 100%;
        right: 20px;
        content: '';
        border: 6px solid transparent;
        border-top-color: var(--el-bg-color-overlay);
      }
    }

    &__panel {
      position: absolute;
      right: 0;
      bottom: 70px;
      width: 320px;
      background: var(--el-bg-color-overlay);
      backdrop-filter: blur(8px);
      border: 1px solid var(--el-border-color);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgb(0 0 0 / 15%);
    }

    &__panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
    }

    &__panel-content {
      padding: 16px;
    }

    &__status {
      margin-bottom: 16px;

      .status-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .label {
          font-size: 14px;
          color: var(--el-text-color-regular);
        }
      }
    }

    &__delay {
      margin-bottom: 16px;

      .delay-item {
        display: flex;
        gap: 8px;
        align-items: center;

        .label {
          min-width: 60px;
          font-size: 14px;
          color: var(--el-text-color-regular);
        }

        .unit {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    &__services {
      margin-bottom: 16px;

      .services-title {
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .services-list {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .service-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          background: var(--el-fill-color-lighter);
          border-radius: 4px;

          .service-name {
            font-size: 12px;
            color: var(--el-text-color-regular);
          }
        }
      }
    }

    &__actions {
      display: flex;
      gap: 8px;

      .el-button {
        flex: 1;
      }
    }

    &__drag-handle {
      position: absolute;
      top: -8px;
      left: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 16px;
      cursor: move;
      background: var(--el-bg-color-overlay);
      border: 1px solid var(--el-border-color);
      border-radius: 8px 8px 0 0;
      transform: translateX(-50%);

      .el-icon {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  // 动画
  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }

    50% {
      opacity: 0.7;
      transform: scale(1.2);
    }

    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 0.3s ease;
    transform-origin: bottom right;
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
</style>
