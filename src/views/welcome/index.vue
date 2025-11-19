<template>
  <div class="welcome-page" ref="pageRef">
    <!-- 导航指示器 -->
    <div class="welcome-page__nav-dots">
      <div
        v-for="(image, index) in architectureImages"
        :key="index"
        class="welcome-page__nav-dot"
        :class="{ active: currentIndex === index }"
        @click="scrollToImage(index)"
      />
    </div>

    <!-- 架构图全屏展示 -->
    <div class="welcome-page__scroll-container">
      <div
        v-for="(image, index) in architectureImages"
        :key="index"
        class="welcome-page__image-section"
        :class="{ active: currentIndex === index }"
      >
        <div class="welcome-page__image-wrapper">
          <img
            :src="image.src"
            :alt="image.title"
            class="welcome-page__full-image"
            @load="handleImageLoad(index)"
          />
        </div>
      </div>
    </div>

    <!-- 滚动提示 -->
    <div v-show="showScrollHint" class="welcome-page__scroll-hint">
      <el-icon class="welcome-page__scroll-icon"><ArrowDown /></el-icon>
      <span>向下滚动查看更多</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { ArrowDown } from '@element-plus/icons-vue'

  interface ArchitectureImage {
    src: string
    title: string
    description: string
  }

  // 架构图片数据
  const architectureImages = ref<ArchitectureImage[]>([
    {
      src: '/images/architecture/01三位一体自主知识体系.png',
      title: '三位一体自主知识体系',
      description: '构建完整的自主知识体系架构，实现知识的系统性管理与应用'
    },
    {
      src: '/images/architecture/02闻曦智能体技术框架图.png',
      title: '闻曦智能体技术框架图',
      description: '展示闻曦智能体的核心技术架构与各模块间的协同关系'
    },
    {
      src: '/images/architecture/03闻曦智能体功能架构图.jpg',
      title: '闻曦智能体功能架构图',
      description: '详细展示系统功能模块划分与层次化设计'
    },
    {
      src: '/images/architecture/04闻曦智能体人机协同流程图.jpg',
      title: '闻曦智能体人机协同流程图',
      description: '阐明人机协作的工作流程与交互机制'
    }
  ])

  // 响应式数据
  const currentIndex = ref(0)
  const showScrollHint = ref(true)
  const pageRef = ref<HTMLElement>()

  // 处理图片加载
  const handleImageLoad = (index: number) => {
    console.log(`图片 ${index + 1} 加载完成`)
  }

  // 滚动到指定图片
  const scrollToImage = (index: number) => {
    const targetY = index * window.innerHeight
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    })
    currentIndex.value = index
    showScrollHint.value = index < architectureImages.value.length - 1
  }

  // 滚动监听
  const handleScroll = () => {
    const scrollY = window.scrollY
    const windowHeight = window.innerHeight
    const newIndex = Math.round(scrollY / windowHeight)

    if (newIndex !== currentIndex.value) {
      currentIndex.value = Math.min(newIndex, architectureImages.value.length - 1)
      showScrollHint.value = currentIndex.value < architectureImages.value.length - 1
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    // 3秒后隐藏滚动提示
    setTimeout(() => {
      showScrollHint.value = false
    }, 3000)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
</script>

<style scoped lang="scss">
  .welcome-page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    overflow-x: hidden;

    // 导航指示器
    &__nav-dots {
      position: fixed;
      top: 50%;
      right: 40px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transform: translateY(-50%);
    }

    &__nav-dot {
      width: 12px;
      height: 12px;
      cursor: pointer;
      background: var(--el-text-color-placeholder);
      border-radius: 50%;
      transition: all 0.3s;

      &:hover {
        background: var(--el-text-color-secondary);
        transform: scale(1.2);
      }

      &.active {
        background: var(--el-color-primary);
        transform: scale(1.5);
      }
    }

    // 滚动容器
    &__scroll-container {
      width: 100%;
    }

    // 图片区域
    &__image-section {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100vh;
      scroll-snap-align: start;

      &:not(.active) {
        .welcome-page__full-image {
          filter: brightness(0.7);
        }
      }
    }

    &__image-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 90%;
      max-width: 1600px;
      height: 90%;
    }

    &__full-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 20px 60px rgb(0 0 0 / 30%);
      transition: filter 0.5s;
    }

    // 滚动提示
    &__scroll-hint {
      position: fixed;
      bottom: 40px;
      left: 50%;
      z-index: 999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      padding: 12px 24px;
      color: var(--el-text-color-secondary);
      background: rgb(255 255 255 / 80%);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      transform: translateX(-50%);
      animation: bounce 2s infinite;
    }

    &__scroll-icon {
      font-size: 24px;
      animation: bounce 1.5s infinite;
    }

    &__scroll-hint span {
      font-size: 14px;
      white-space: nowrap;
    }
  }

  @keyframes bounce {
    0%,
    20%,
    50%,
    80%,
    100% {
      transform: translateX(-50%) translateY(0);
    }

    40% {
      transform: translateX(-50%) translateY(-10px);
    }

    60% {
      transform: translateX(-50%) translateY(-5px);
    }
  }

  // 响应式设计
  @media (width <= 1200px) {
    .welcome-page {
      &__image-wrapper {
        width: 95%;
      }

      &__nav-dots {
        right: 24px;
      }
    }
  }

  @media (width <= 768px) {
    .welcome-page {
      &__image-section {
        height: 100vh;
      }

      &__image-wrapper {
        width: 100%;
        height: 85%;
      }

      &__nav-dots {
        right: 16px;
        gap: 12px;

        div {
          width: 10px;
          height: 10px;
        }
      }

      &__scroll-hint {
        bottom: 20px;
        padding: 8px 16px;

        span {
          font-size: 12px;
        }
      }

      &__scroll-icon {
        font-size: 20px;
      }
    }
  }

  // 滚动行为
  html {
    scroll-behavior: smooth;
    scroll-snap-type: y mandatory;
  }
</style>
