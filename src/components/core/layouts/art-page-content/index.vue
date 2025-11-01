<!-- 布局内容 -->
<template>
  <div
    class="layout-content abc"
    :class="{ 'no-basic-layout': isFullPage }"
    :style="containerStyle"
  >
    <!-- 节日滚动 -->
    <ArtFestivalTextScroll v-if="!isFullPage" />

    <div v-if="isRefresh" :style="contentStyle">
      <RouterView v-slot="{ Component, route }">
        <!-- 路由信息调试 -->
        <div v-if="isOpenRouteInfo === 'true'" class="route-info">
          router meta：{{ route.meta }}
        </div>

        <!-- 路由内容渲染 -->
        <component :is="Component" :key="route.path" />
      </RouterView>
    </div>
  </div>
</template>
<script setup lang="ts">
  import type { CSSProperties } from 'vue'
  import { useRoute } from 'vue-router'
  import { useCommon } from '@/composables/useCommon'
  import { useSettingStore } from '@/store/modules/setting'

  defineOptions({ name: 'ArtPageContent' })

  const route = useRoute()
  const { containerMinHeight } = useCommon()
  const { containerWidth, refresh } = storeToRefs(useSettingStore())

  const isRefresh = shallowRef(true)
  const isOpenRouteInfo = import.meta.env.VITE_OPEN_ROUTE_INFO

  // 检查当前路由是否需要使用无基础布局模式
  const isFullPage = computed(() => route.matched.some((r) => r.meta?.isFullPage))

  const containerStyle = computed(
    (): CSSProperties =>
      isFullPage.value
        ? {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            zIndex: 2500,
            background: 'var(--art-bg-color)'
          }
        : {
            maxWidth: containerWidth.value
          }
  )

  const contentStyle = computed(
    (): CSSProperties => ({
      minHeight: containerMinHeight.value
    })
  )

  const reload = () => {
    isRefresh.value = false
    nextTick(() => {
      isRefresh.value = true
    })
  }

  watch(refresh, reload, { flush: 'post' })
</script>

<style lang="scss" scoped>
  .layout-content {
    &.no-basic-layout {
      overflow: auto;
    }
  }

  .route-info {
    padding: 6px 8px;
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--art-gray-600);
    background: var(--art-gray-200);
    border: 1px solid var(--art-border-dashed-color);
    border-radius: 6px;
  }
</style>
