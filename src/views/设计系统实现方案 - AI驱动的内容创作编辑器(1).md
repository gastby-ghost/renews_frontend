基于您的UI设计方案和Vitesse模板，我将为您设计一个完整的设计系统实现方案。这个方案将确保前端能够稳定、高效地实现您的AI驱动内容创作编辑器。

## 设计系统架构设计

### 1. 设计令牌系统 (Design Tokens)

首先，我将创建一个全面的设计令牌系统，作为整个设计系统的基础：

```typescript
// tokens/design.tokens.ts
export const colorTokens = {
  // 主色系
  primary: {
    50: '#F0F4F8',
    100: '#D9E2EC',
    200: '#B2C5D7',
    300: '#8BA5C2',
    400: '#6488AD',
    500: '#2C3E50', // 主色
    600: '#1A252F', // 主色深变
    700: '#0F1820',
    800: '#070C11',
    900: '#030608'
  },
  // 辅助色系
  secondary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#3498DB', // 辅助色
    600: '#2874A6', // 辅助色深变
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E'
  },
  // 强调色系
  accent: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#E67E22', // 强调色
    600: '#BA4A00', // 强调色深变
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12'
  },
  // 状态色
  success: '#2ECC71',
  warning: '#F1C40F',
  error: '#E74C3C',
  info: '#3498DB',
  materialEdit: '#E74C3C',
  titleAnalysis: '#9B59B6',
  // 中性色
  background: '#F5F7FA',
  card: '#FFFFFF',
  border: '#E1E8ED',
  text: {
    primary: '#34495E',
    secondary: '#7F8C8D',
    disabled: '#BDC3C7'
  }
}
export const spacingTokens = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  lg: '1rem', // 16px
  xl: '1.5rem', // 24px
  '2xl': '2rem', // 32px
  '3xl': '3rem', // 48px
  '4xl': '4rem', // 64px
  '5xl': '6rem' // 96px
}
export const borderRadiusTokens = {
  none: '0',
  sm: '0.25rem', // 4px
  md: '0.5rem', // 8px
  lg: '1rem', // 16px
  full: '9999px'
}
export const shadowTokens = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 20px rgba(0, 0, 0, 0.1)',
  hover: '0 4px 12px rgba(0, 0, 0, 0.15)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
}

export const typographyTokens = {
  fontFamily: {
    sans: 'system-ui, sans-serif',
    montserrat: 'Montserrat, sans-serif',
    opensans: 'Open Sans, sans-serif',
    sourcecode: 'Source Code Pro, monospace'
  },
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '15px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px'
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  }
}

// 断点令牌
export const breakpointTokens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}
```

### 2. UnoCSS 配置扩展

接下来，我将扩展Vitesse的UnoCSS配置，以支持我们的设计系统：

```typescript
// uno.config.ts
import { defineConfig, presetAttributify, presetUno } from 'unocss'
import {
  colorTokens,
  spacingTokens,
  borderRadiusTokens,
  shadowTokens,
  typographyTokens
} from './tokens/design.tokens'
export default defineConfig({
  presets: [presetAttributify(), presetUno()],
  theme: {
    colors: {
      // 主色系
      primary: colorTokens.primary,
      // 辅助色系
      secondary: colorTokens.secondary,
      // 强调色系
      accent: colorTokens.accent,
      // 状态色
      success: colorTokens.success,
      warning: colorTokens.warning,
      error: colorTokens.error,
      info: colorTokens.info,
      'material-edit': colorTokens.materialEdit,
      'title-analysis': colorTokens.titleAnalysis,
      // 中性色
      bg: colorTokens.background,
      card: colorTokens.card,
      border: colorTokens.border,
      text: colorTokens.text
    },
    spacing: {
      ...spacingTokens
    },
    borderRadius: {
      ...borderRadiusTokens
    },
    boxShadow: {
      ...shadowTokens
    },
    fontFamily: {
      ...typographyTokens.fontFamily
    },
    fontSize: {
      ...typographyTokens.fontSize
    },
    fontWeight: {
      ...typographyTokens.fontWeight
    },
    lineHeight: {
      ...typographyTokens.lineHeight
    },
    // 断点配置
    breakpoints: {
      ...breakpointTokens
    }
  },
  shortcuts: {
    // 布局快捷方式
    'app-layout': 'h-screen flex flex-col',
    'app-header': 'h-15 bg-card border-b border-border',
    'app-body': 'flex flex-1 overflow-hidden',
    'app-sidebar': 'w-70 bg-card border-r border-border overflow-y-auto',
    'app-main': 'flex-1 flex flex-col overflow-hidden',
    'app-sidebar-right': 'w-90 bg-card border-l border-border overflow-y-auto',
    'app-footer': 'h-8 bg-card border-t border-border',

    // 组件快捷方式
    card: 'bg-card rounded-md shadow-sm p-4',
    'card-hover': 'hover:shadow-md transition-shadow',
    btn: 'py-2 px-4 rounded-md font-medium transition-all duration-200',
    'btn-primary': 'bg-primary text-white hover:bg-primary-600 active:scale-95',
    'btn-secondary': 'bg-secondary text-white hover:bg-secondary-600 active:scale-95',
    'btn-accent': 'bg-accent text-white hover:bg-accent-600 active:scale-95',
    'btn-text': 'text-primary hover:text-primary-600',
    input:
      'w-full px-3 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
    tag: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',

    // 新增通用工具类
    truncate: 'overflow-hidden text-ellipsis whitespace-nowrap',
    'flex-center': 'flex items-center justify-center',
    'transition-all': 'transition-all duration-200 ease-in-out'
  }
})
```

### 3. 基础组件库

现在，我将创建一套基础组件库，基于Vitesse的组件结构：

```typescript
// components/base/BaseButton.vue
<template>
  <button
    class="base-button"
    :class="[
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'base-button--disabled': disabled },
      { 'base-button--loading': loading },
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="base-button__spinner" aria-hidden="true">
      <i class="i-carbon-circle-dash animate-spin" />
    </span>
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value: string) => ['primary', 'secondary', 'accent', 'text', 'ghost'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>
<style scoped>
.base-button {
  @apply btn transition-all;
}
.base-button--sm {
  @apply py-1 px-3 text-sm;
}
.base-button--md {
  @apply py-2 px-4;
}
.base-button--lg {
  @apply py-3 px-6 text-lg;
}
.base-button--primary {
  @apply btn-primary;
}
.base-button--secondary {
  @apply btn-secondary;
}
.base-button--accent {
  @apply btn-accent;
}
.base-button--text {
  @apply btn-text;
}
.base-button--ghost {
  @apply border border-border text-text hover:bg-gray-100;
}
.base-button--disabled {
  @apply opacity-50 cursor-not-allowed;
}
.base-button--loading {
  @apply cursor-wait;
}
.base-button__spinner {
  @apply mr-2;
}
</style>
```

```typescript
// components/base/BaseCard.vue
<template>
  <div class="base-card" :class="hoverable ? 'base-card--hoverable' : ''">
    <div v-if="$slots.header" class="base-card__header">
      <slot name="header" />
    </div>
    <div v-if="$slots.default" class="base-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps({
  hoverable: {
    type: Boolean,
    default: false,
  },
})
</script>
<style scoped>
.base-card {
  @apply card;
}
.base-card--hoverable {
  @apply card-hover;
}
.base-card__header {
  @apply pb-4 border-b border-border;
}
.base-card__body {
  @apply py-4;
}
.base-card__footer {
  @apply pt-4 border-t border-border;
}
</style>
```

```typescript
// components/base/BaseInput.vue
<template>
  <div class="base-input">
    <label v-if="label" :for="inputId" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required" aria-hidden="true">*</span>
    </label>
    <div class="base-input__wrapper">
      <div v-if="$slots.prefix" class="base-input__prefix">
        <slot name="prefix" />
      </div>
      <input
        :id="inputId"
        ref="inputRef"
        class="base-input__field"
        :class="[
          `base-input__field--${size}`,
          { 'base-input__field--error': error },
          { 'base-input__field--with-prefix': $slots.prefix },
        ]"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        @input="onInput"
        @blur="onBlur"
        @focus="onFocus"
      />
      <div v-if="$slots.suffix" class="base-input__suffix">
        <slot name="suffix" />
      </div>
    </div>
    <div v-if="error" :id="`${inputId}-error`" class="base-input__error" role="alert">
      {{ error }}
    </div>
    <div v-else-if="helperText" class="base-input__helper">
      {{ helperText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  helperText: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])
const inputRef = ref<HTMLInputElement>()
const inputId = computed(() => `input-${Math.random().toString(36).substring(2, 9)}`)

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

const onFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const onBlur = (event: FocusEvent) => {
  emit('blur', event)
}

// 暴露input ref以便外部访问
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
})
</script>

<style scoped>
.base-input {
  @apply w-full;
}
.base-input__label {
  @apply block text-sm font-medium text-text mb-1;
}
.base-input__required {
  @apply text-error ml-1;
}
.base-input__wrapper {
  @apply relative;
}
.base-input__field {
  @apply input transition-all;
}
.base-input__field--sm {
  @apply py-1 px-2 text-sm;
}
.base-input__field--md {
  @apply py-2 px-3;
}
.base-input__field--lg {
  @apply py-3 px-4 text-lg;
}
.base-input__field--with-prefix {
  @apply pl-10;
}
.base-input__field--error {
  @apply border-error focus:ring-error;
}
.base-input__suffix {
  @apply absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none;
}
.base-input__error {
  @apply mt-1 text-sm text-error;
}
.base-input__helper {
  @apply mt-1 text-sm text-text-secondary;
}
</style>
```

### 5. 布局组件实现

```typescript
// stores/layoutStore.ts
import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    isSidebarCollapsed: false,
    isRightSidebarCollapsed: false,
    activeComponent: 0 // 当前激活的组件索引
  }),
  actions: {
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed
    },
    toggleRightSidebar() {
      this.isRightSidebarCollapsed = !this.isRightSidebarCollapsed
    },
    setActiveComponent(index: number) {
      this.activeComponent = index
    }
  }
})
```

```typescript
// components/layout/AppLayout.vue
<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="app-header__content">
        <div class="app-header__logo">
          <AppLogo />
          <span class="app-header__title">AI内容创作编辑器</span>
        </div>
        <div class="app-header__actions">
          <UserMenu />
          <SettingsButton />
          <HelpButton />
        </div>
      </div>
    </header>

    <div class="app-body">
      <!-- 左侧栏 -->
      <aside
        class="app-sidebar"
        :class="{ 'app-sidebar--collapsed': layoutStore.isSidebarCollapsed }"
        aria-label="项目导航"
      >
        <ProjectManager />
      </aside>

      <!-- 中间栏 -->
      <main class="app-main" aria-label="主内容区">
        <!-- 组件导航区 -->
        <nav class="component-nav" aria-label="组件导航">
          <ComponentNavigation />
        </nav>

        <!-- 编辑区 -->
        <div class="editor-area">
          <router-view />
        </div>
      </main>

      <!-- 右侧栏 -->
      <aside
        class="app-sidebar-right"
        :class="{ 'app-sidebar-right--collapsed': layoutStore.isRightSidebarCollapsed }"
        aria-label="智能助手"
      >
        <SmartAssistant />
      </aside>
    </div>

    <!-- 状态栏 -->
    <footer class="app-footer" aria-label="状态栏">
      <StatusBar />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useLayoutStore } from '@/stores/layoutStore'
import AppLogo from './AppLogo.vue'
import UserMenu from './UserMenu.vue'
import SettingsButton from './SettingsButton.vue'
import HelpButton from './HelpButton.vue'
import ProjectManager from './ProjectManager.vue'
import ComponentNavigation from './ComponentNavigation.vue'
import SmartAssistant from './SmartAssistant.vue'
import StatusBar from './StatusBar.vue'

const layoutStore = useLayoutStore()
</script>

<style scoped>
/* 使用CSS媒体查询处理响应式 */
@media (max-width: 1200px) {
  .app-sidebar {
    @apply w-16;
  }
}

@media (max-width: 1024px) {
  .app-sidebar-right {
    @apply w-0;
  }
}

.app-header {
  @apply app-header;
}

.app-header__content {
  @apply flex items-center justify-between h-full px-6;
}

.app-header__logo {
  @apply flex items-center space-x-3;
}

.app-header__title {
  @apply text-xl font-bold font-montserrat text-primary;
}

.app-header__actions {
  @apply flex items-center space-x-4;
}

.app-body {
  @apply app-body;
}

.app-sidebar {
  @apply app-sidebar transition-all duration-300;
}

.app-sidebar--collapsed {
  @apply w-16;
}

.app-main {
  @apply app-main;
}

.component-nav {
  @apply flex space-x-4 p-4 border-b border-border overflow-x-auto;
}

.editor-area {
  @apply flex-1 overflow-y-auto p-4;
}

.app-sidebar-right {
  @apply app-sidebar-right transition-all duration-300;
}

.app-sidebar-right--collapsed {
  @apply w-0;
}

.app-footer {
  @apply app-footer;
}
</style>
```

### 6. 状态管理

使用Pinia进行状态管理，创建多个store来管理不同组件的状态：

### 7. 响应式设计实现

```typescript
// composables/useResponsive.ts
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { breakpointTokens } from '@/tokens/design.tokens'

export function useResponsive() {
  const windowWidth = ref(window.innerWidth)
  const windowHeight = ref(window.innerHeight)

  // 将断点值转换为数字
  const breakpoints = {
    sm: parseInt(breakpointTokens.sm),
    md: parseInt(breakpointTokens.md),
    lg: parseInt(breakpointTokens.lg),
    xl: parseInt(breakpointTokens.xl),
    '2xl': parseInt(breakpointTokens['2xl'])
  }

  const isMobile = computed(() => windowWidth.value < breakpoints.md)
  const isTablet = computed(
    () => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg
  )
  const isDesktop = computed(() => windowWidth.value >= breakpoints.lg)

  // 新增容器查询支持
  const containerWidth = ref(0)
  const observeContainer = (container: HTMLElement) => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }

  const updateWindowSize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  onMounted(() => {
    window.addEventListener('resize', updateWindowSize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateWindowSize)
  })

  return {
    windowWidth,
    windowHeight,
    containerWidth,
    isMobile,
    isTablet,
    isDesktop,
    observeContainer,
    breakpoints
  }
}
```

### 8. 无障碍设计实现

```typescript
// composables/useKeyboardNavigation.ts
import { ref, onMounted, onUnmounted } from 'vue'
import { useLayoutStore } from '@/stores/layoutStore'
import { keyboardShortcuts } from '@/config/shortcuts'

export function useKeyboardNavigation() {
  const layoutStore = useLayoutStore()
  const focusedElement = ref<HTMLElement | null>(null)

  const handleKeyDown = (event: KeyboardEvent) => {
    // 切换组件 (Alt+数字键)
    if (event.altKey && keyboardShortcuts.toggleComponent.variants.includes(event.key)) {
      event.preventDefault()
      const componentIndex = parseInt(event.key) - 1
      layoutStore.setActiveComponent(componentIndex)
      return
    }

    // 保存 (Ctrl/Cmd + S)
    if ((event.ctrlKey || event.metaKey) && event.key === keyboardShortcuts.save.keys[1]) {
      event.preventDefault()
      // 实现保存逻辑
      console.log('保存内容')
      return
    }

    // 分析标题 (Ctrl/Cmd + Shift + A)
    if (
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      event.key.toLowerCase() === keyboardShortcuts.analyzeTitle.keys[2]
    ) {
      event.preventDefault()
      // 实现标题分析逻辑
      console.log('分析标题')
      return
    }

    // 关闭面板 (Esc)
    if (event.key === keyboardShortcuts.closePanel.keys[0]) {
      // 实现关闭面板逻辑
      console.log('关闭面板')
      return
    }

    // 切换侧边栏 (Ctrl/Cmd + B)
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === keyboardShortcuts.toggleSidebar.keys[1]
    ) {
      event.preventDefault()
      layoutStore.toggleSidebar()
      return
    }
  }

  const handleFocusIn = (event: FocusEvent) => {
    focusedElement.value = event.target as HTMLElement
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('focusin', handleFocusIn)
  })

  return {
    focusedElement
  }
}
```

```typescript
// config/shortcuts.ts
export const keyboardShortcuts = {
  toggleComponent: {
    description: '切换组件',
    keys: ['alt', '1'], // Alt+1 到 Alt+5
    variants: ['1', '2', '3', '4', '5']
  },
  save: {
    description: '保存内容',
    keys: ['ctrl', 's'],
    macKeys: ['cmd', 's']
  },
  analyzeTitle: {
    description: '分析标题',
    keys: ['ctrl', 'shift', 'a'], // 避免与全选冲突
    macKeys: ['cmd', 'shift', 'a']
  },
  closePanel: {
    description: '关闭面板',
    keys: ['escape']
  },
  toggleSidebar: {
    description: '切换侧边栏',
    keys: ['ctrl', 'b'],
    macKeys: ['cmd', 'b']
  }
}
```

### 9. 主题系统实现

```typescript
import { ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export function useTheme() {
  // 使用VueUse的useLocalStorage处理持久化
  const theme = useLocalStorage<'light' | 'dark'>('theme', 'light')

  const applyTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  // 初始化主题
  const initTheme = () => {
    // 检查系统主题偏好
    if (theme.value === 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme.value = 'dark'
    }
    applyTheme(theme.value)
  }

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      theme.value = e.matches ? 'dark' : 'light'
    }
  }

  onMounted(() => {
    initTheme()
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  })

  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  })

  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })

  return {
    theme: readonly(theme),
    toggleTheme
  }
}
```

### 10. 集成到Vitesse模板

最后，我将所有这些组件和功能集成到Vitesse模板中：

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

// 导入样式
import './styles/main.css'
import 'virtual:uno.css'

// 创建应用
const app = createApp(App)

// 创建Pinia实例并添加持久化插件
const pinia = createPinia()
pinia.use(createPersistedState())

// 使用Pinia和路由
app.use(pinia)
app.use(router)

// 挂载应用
app.mount('#app')
```

```typescript
// App.vue
<template>
  <!-- 添加跳过导航链接（无障碍） -->
  <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded">
    跳转到主内容
  </a>

  <AppLayout />

  <!-- 添加主内容锚点 -->
  <div id="main-content" tabindex="-1"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppLayout from './components/layout/AppLayout.vue'
import { useTheme } from './composables/useTheme'

const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>
```

```typescript
// styles/main.css
/* 添加主题切换过渡效果 */
html {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

/* 确保暗色模式样式正确应用 */
.dark {
  color-scheme: dark;
}

/* 焦点样式改进 */
:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* 跳过导航链接（无障碍） */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```
