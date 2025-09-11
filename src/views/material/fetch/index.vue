<template>
  <div class="material-fetch-hub">
    <!-- 页面标题 -->
    <div class="material-fetch-hub__header">
      <h2>素材抓取中心</h2>
      <p class="material-fetch-hub__subtitle">选择素材来源类型，开始获取高质量内容素材</p>
    </div>

    <!-- 素材抓取类型选择 -->
    <div class="material-fetch-hub__categories">
      <!-- 主流媒体素材抓取 -->
      <el-card class="material-fetch-hub__category" shadow="hover" @click="goToMainstreamMedia">
        <div class="category-content">
          <div class="category-icon">
            <el-icon size="48" color="#409EFF">
              <Document />
            </el-icon>
          </div>
          <div class="category-info">
            <h3>主流媒体素材抓取</h3>
            <p class="category-description">
              检索主流媒体向量数据库中的权威素材，获取高质量新闻、报道和分析内容
            </p>
            <div class="category-features">
              <el-tag size="small" type="success">权威来源</el-tag>
              <el-tag size="small" type="info">向量检索</el-tag>
              <el-tag size="small" type="warning">AI推荐</el-tag>
            </div>
            <div class="category-stats">
              <span class="stat-item">
                <el-icon><Star /></el-icon>
                高可靠性评分
              </span>
              <span class="stat-item">
                <el-icon><Clock /></el-icon>
                实时更新
              </span>
            </div>
          </div>
          <div class="category-arrow">
            <el-icon size="20" color="#909399">
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </el-card>

      <!-- 外部素材抓取 -->
      <el-card class="material-fetch-hub__category" shadow="hover" @click="goToExternalSearch">
        <div class="category-content">
          <div class="category-icon">
            <el-icon size="48" color="#67C23A">
              <Search />
            </el-icon>
          </div>
          <div class="category-info">
            <h3>外部素材抓取</h3>
            <p class="category-description">
              通过AI检索外部资源，支持关键词搜索和智能内容关联，获取多样化参考素材
            </p>
            <div class="category-features">
              <el-tag size="small" type="success">多源检索</el-tag>
              <el-tag size="small" type="info">智能匹配</el-tag>
              <el-tag size="small" type="warning">内容关联</el-tag>
            </div>
            <div class="category-stats">
              <span class="stat-item">
                <el-icon><Connection /></el-icon>
                多平台支持
              </span>
              <span class="stat-item">
                <el-icon><MagicStick /></el-icon>
                AI智能分析
              </span>
            </div>
          </div>
          <div class="category-arrow">
            <el-icon size="20" color="#909399">
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 功能说明 -->
    <div class="material-fetch-hub__info">
      <el-card>
        <template #header>
          <div class="info-header">
            <el-icon><InfoFilled /></el-icon>
            <span>功能说明</span>
          </div>
        </template>
        <div class="info-content">
          <div class="info-section">
            <h4>主流媒体素材抓取 (F046)</h4>
            <ul>
              <li>检索主流媒体向量数据库中的权威内容</li>
              <li>支持关键词搜索和当前内容相关检索</li>
              <li>自动添加"主流媒体"标签，确保来源可追溯</li>
              <li>提供可靠性评分，帮助判断素材质量</li>
            </ul>
          </div>
          <div class="info-section">
            <h4>外部素材抓取 (F018)</h4>
            <ul>
              <li>通过AI检索外部资源平台的多样化素材</li>
              <li>支持"与当前内容相关"的智能推荐</li>
              <li>自动添加"外部"标签，便于素材分类管理</li>
              <li>多选添加功能，提高工作效率</li>
            </ul>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 最近使用的素材源 -->
    <div class="material-fetch-hub__recent" v-if="recentSources.length > 0">
      <h3>最近使用的素材源</h3>
      <div class="recent-sources">
        <el-tag
          v-for="source in recentSources"
          :key="source"
          size="large"
          effect="plain"
          @click="quickSearch(source)"
        >
          {{ source }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import {
    Document,
    Search,
    ArrowRight,
    InfoFilled,
    Star,
    Clock,
    Connection,
    MagicStick
  } from '@element-plus/icons-vue'

  const router = useRouter()

  // 最近使用的素材源
  const recentSources = ref<string[]>([])

  // 方法
  function goToMainstreamMedia() {
    // 跳转到主流媒体素材抓取页面（F046功能）
    router.push('/material/fetch/mainstream')
    ElMessage.info('进入主流媒体素材抓取')
  }

  function goToExternalSearch() {
    // 跳转到外部素材抓取页面（F018功能）
    router.push('/material/fetch/external')
    ElMessage.info('进入外部素材抓取')
  }

  function quickSearch(source: string) {
    // 快速搜索最近使用的素材源
    ElMessage.info(`快速搜索: ${source}`)
    // 这里可以根据source类型跳转到对应页面并预设搜索条件
    if (source.includes('主流媒体')) {
      goToMainstreamMedia()
    } else {
      goToExternalSearch()
    }
  }

  // 生命周期
  onMounted(() => {
    // 加载最近使用的素材源（从本地存储或API获取）
    loadRecentSources()
  })

  function loadRecentSources() {
    // 模拟加载最近使用的素材源
    const stored = localStorage.getItem('recent_material_sources')
    if (stored) {
      try {
        recentSources.value = JSON.parse(stored)
      } catch (err) {
        console.error('解析最近使用的素材源失败:', err)
      }
    }
  }

  // 保存最近使用的素材源（暂时未使用，但保留以备将来扩展）
  // function saveRecentSource(source: string) {
  //   const sources = [...recentSources.value]
  //   const index = sources.indexOf(source)
  //
  //   if (index > -1) {
  //     sources.splice(index, 1)
  //   }
  //
  //   sources.unshift(source)
  //   sources.splice(5) // 只保留最近5个
  //
  //   recentSources.value = sources
  //   localStorage.setItem('recent_material_sources', JSON.stringify(sources))
  // }
</script>

<style scoped lang="scss">
  .material-fetch-hub {
    max-width: 1200px;
    padding: 24px;
    margin: 0 auto;

    &__header {
      margin-bottom: 40px;
      text-align: center;

      h2 {
        margin: 0 0 12px;
        font-size: 28px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      &__subtitle {
        margin: 0;
        font-size: 16px;
        line-height: 1.5;
        color: var(--el-text-color-regular);
      }
    }

    &__categories {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }

    &__category {
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--el-color-primary);
        box-shadow: 0 8px 24px rgb(0 0 0 / 10%);
        transform: translateY(-4px);
      }

      .category-content {
        display: flex;
        gap: 20px;
        align-items: flex-start;
        padding: 8px;
      }

      .category-icon {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        background: linear-gradient(
          135deg,
          var(--el-color-primary-light-9),
          var(--el-color-primary-light-7)
        );
        border-radius: 12px;
      }

      .category-info {
        flex: 1;
        min-width: 0;

        h3 {
          margin: 0 0 8px;
          font-size: 20px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .category-description {
          margin: 0 0 16px;
          font-size: 14px;
          line-height: 1.5;
          color: var(--el-text-color-regular);
        }

        .category-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .category-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;

          .stat-item {
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
      }

      .category-arrow {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        padding-top: 8px;
      }
    }

    &__info {
      margin-bottom: 32px;

      .info-header {
        display: flex;
        gap: 8px;
        align-items: center;
        font-weight: 600;

        .el-icon {
          font-size: 18px;
          color: var(--el-color-primary);
        }
      }

      .info-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 24px;
        margin-top: 16px;
      }

      .info-section {
        h4 {
          margin: 0 0 12px;
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        ul {
          padding-left: 16px;
          margin: 0;

          li {
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.5;
            color: var(--el-text-color-regular);
          }
        }
      }
    }

    &__recent {
      h3 {
        margin: 0 0 16px;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .recent-sources {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .el-tag {
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            transform: scale(1.05);
          }
        }
      }
    }
  }

  @media (width <= 768px) {
    .material-fetch-hub {
      padding: 16px;

      &__header {
        margin-bottom: 32px;

        h2 {
          font-size: 24px;
        }
      }

      &__categories {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      &__category {
        .category-content {
          flex-direction: column;
          text-align: center;
        }

        .category-icon {
          align-self: center;
        }

        .category-info {
          .category-stats {
            justify-content: center;
          }
        }
      }

      &__info {
        .info-content {
          grid-template-columns: 1fr;
          gap: 16px;
        }
      }
    }
  }
</style>
