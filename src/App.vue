<template>
  <ElConfigProvider size="default" :locale="locales[language]" :z-index="3000">
    <RouterView></RouterView>

    <!-- 开发模式Mock切换按钮 -->
    <MockToggle v-if="isDev" />
  </ElConfigProvider>
</template>

<script setup lang="ts">
  import { computed, defineAsyncComponent } from 'vue'
  import { useUserStore } from './store/modules/user'
  import zh from 'element-plus/es/locale/lang/zh-cn'
  import en from 'element-plus/es/locale/lang/en'
  import { systemUpgrade } from './utils/sys'

  import { setThemeTransitionClass } from './utils/theme/animation'
  import { checkStorageCompatibility } from './utils/storage'

  // 开发模式下导入Mock切换组件
  let MockToggle: any = null
  if (import.meta.env.DEV) {
    MockToggle = defineAsyncComponent(() => import('./components/dev/MockToggle.vue'))
  }

  const userStore = useUserStore()
  const { language } = storeToRefs(userStore)

  const locales = {
    zh: zh,
    en: en
  }

  const isDev = computed(() => import.meta.env.DEV)

  onBeforeMount(() => {
    setThemeTransitionClass(true)
  })

  onMounted(() => {
    // 初始化认证状态验证
    userStore.initializeAuthState()
    // 检查存储兼容性
    checkStorageCompatibility()
    // 提升暗黑主题下页面刷新视觉体验
    setThemeTransitionClass(false)
    // 系统升级
    systemUpgrade()
  })
</script>
