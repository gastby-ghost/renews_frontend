<template>
  <div class="title-generation-section">
    <div class="section-header">
      <h3>标题生成</h3>
    </div>

    <!-- 标题生成参数配置 -->
    <el-card shadow="never" class="title-controls-card">
      <el-form :model="localControls" label-position="left" label-width="80px" inline>
        <el-form-item label="标题数量">
          <el-input-number
            v-model="localControls.count"
            :min="3"
            :max="20"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="标题长度">
          <el-select v-model="localControls.length" placeholder="选择标题长度">
            <el-option label="短" value="short" />
            <el-option label="中等" value="medium" />
            <el-option label="长" value="long" />
          </el-select>
        </el-form-item>
        <el-form-item label="风格偏好">
          <el-checkbox-group v-model="localControls.styles">
            <el-checkbox label="professional">专业</el-checkbox>
            <el-checkbox label="catchy">吸引眼球</el-checkbox>
            <el-checkbox label="creative">创意</el-checkbox>
            <el-checkbox label="descriptive">描述性</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 关键词管理 -->
    <el-card shadow="never" class="keywords-card">
      <template #header>
        <div class="card-header">
          <span>关键词管理</span>
        </div>
      </template>
      <div class="keywords-container">
        <div class="keywords-list">
          <el-tag
            v-for="keyword in customKeywords"
            :key="keyword"
            closable
            size="large"
            class="keyword-tag"
            @close="$emit('remove-keyword', keyword)"
          >
            {{ keyword }}
          </el-tag>
        </div>
        <div class="add-keyword">
          <el-input
            v-model="newKeyword"
            placeholder="添加关键词（按回车添加）"
            size="default"
            @keyup.enter="handleAddKeyword"
            @blur="handleAddKeyword"
          />
          <el-button
            type="primary"
            size="default"
            :loading="search2titleLoading"
            @click="handleAddKeyword"
          >
            {{ search2titleLoading ? '执行中...' : '搜索生成标题' }}
          </el-button>
          <el-button
            v-if="!search2titleLoading && canGenerateSearch2title"
            type="warning"
            size="default"
            @click="$emit('cancel-search2title')"
          >
            取消搜索
          </el-button>
        </div>
      </div>
      <el-progress
        v-if="search2titleLoading"
        :percentage="progress"
        :status="progress >= 100 ? 'success' : ''"
        :stroke-width="6"
        class="search-progress"
      />
    </el-card>

    <!-- 已生成的标题列表 -->
    <div v-if="hasGeneratedTitles" class="generated-titles">
      <div class="titles-header">
        <h4>已生成的标题</h4>
        <span class="titles-count">共 {{ generatedTitles.length }} 个</span>
      </div>
      <div class="titles-grid">
        <TitleCard
          v-for="(title, index) in generatedTitles"
          :key="index"
          :title="title"
          :selected="selectedTitle?.id === title.id"
          :score="getTitleScore()"
          :suggestions="getTitleSuggestions()"
          :materials="getTitleMaterials(title)"
          @select="$emit('select-title', title)"
          @update="$emit('update-title', $event)"
          @preview-material="$emit('preview-material', $event)"
          @material-click="$emit('material-click')"
        />
      </div>
    </div>

    <!-- 无标题时的提示 -->
    <el-empty v-else-if="!isGenerating" description="请先完成需求定义，然后添加关键词生成标题">
      <template #description>
        <p>1. 完成需求定义并生成AI简报</p>
        <p>2. 添加与选题相关的关键词</p>
        <p>3. 点击"搜索生成标题"按钮</p>
      </template>
    </el-empty>

    <!-- 标题生成中状态 -->
    <div v-if="isGenerating" class="generating-state">
      <el-empty description="标题生成中...">
        <template #image>
          <div class="loading-spinner">
            <el-icon :size="48"><Loading /></el-icon>
          </div>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Loading } from '@element-plus/icons-vue'
  import TitleCard from '@/components/custom/TitleCard.vue'
  import type { Title } from '@/types/ai'
  import type { Material } from '@/types/material'

  /**
   * Controls data interface
   */
  interface ControlsData {
    count: number
    length: 'short' | 'medium' | 'long'
    styles: Array<'creative' | 'professional' | 'catchy' | 'descriptive'>
  }

  /**
   * TitleGenerationSection Props
   * @description 标题生成区域组件 props
   */
  interface Props {
    isGenerating: boolean
    progress: number
    controls: ControlsData
    customKeywords: string[]
    canGenerateTitles: boolean
    canGenerateSearch2title: boolean
    search2titleLoading: boolean
    hasGeneratedTitles: boolean
    generatedTitles: Title[]
    selectedTitle: Title | null
    currentTitleMaterials: Material[]
  }

  const props = defineProps<Props>()

  interface Emits {
    (e: 'open-material-selection'): void
    (e: 'execute-search2title'): void
    (e: 'cancel-search2title'): void
    (e: 'select-title', title: Title): void
    (e: 'update-title', title: Title): void
    (e: 'add-keyword', keyword: string): void
    (e: 'remove-keyword', keyword: string): void
    (e: 'preview-material', material: Material): void
    (e: 'material-click'): void
  }

  const emit = defineEmits<Emits>()

  // 新关键词输入
  const newKeyword = ref('')

  // 本地控制状态，用于避免直接修改 prop
  const localControls = computed({
    get: (): ControlsData => props.controls,
    set: () => {
      // 触发更新事件，由父组件处理实际更新
    }
  })

  /**
   * 添加关键词
   */
  const handleAddKeyword = () => {
    const keyword = newKeyword.value.trim()
    if (keyword) {
      emit('add-keyword', keyword)
      newKeyword.value = ''
    }
  }

  /**
   * 获取标题评分
   */
  const getTitleScore = (): number => {
    return Math.floor(Math.random() * 40) + 60
  }

  /**
   * 获取标题建议
   */
  const getTitleSuggestions = (): string[] => {
    return ['更具吸引力', '更简洁明了', '更专业', '更具创意性']
  }

  /**
   * 获取标题对应的素材
   */
  const getTitleMaterials = (title: Title): Material[] => {
    if (!props.selectedTitle || props.selectedTitle.id !== title.id) {
      return []
    }
    return props.currentTitleMaterials
  }
</script>

<style scoped lang="scss">
  .title-generation-section {
    margin-top: 32px;

    .section-header {
      margin-bottom: 20px;

      h3 {
        margin: 0;
        font-size: 18px;
        color: var(--el-color-primary);
      }
    }
  }

  .title-controls-card {
    margin-bottom: 20px;

    :deep(.el-form-item__label) {
      font-weight: 500;
    }
  }

  .keywords-card {
    margin-bottom: 20px;

    .card-header {
      font-weight: 500;
    }
  }

  .keywords-container {
    .keywords-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    .add-keyword {
      display: flex;
      gap: 12px;
      align-items: center;

      .el-input {
        flex: 1;
        max-width: 300px;
      }
    }
  }

  .search-progress {
    margin-top: 16px;
  }

  .generated-titles {
    .titles-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .titles-count {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    .titles-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  }

  .generating-state {
    padding: 40px;

    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--el-color-primary);
      animation: spin 1.5s linear infinite;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (width <= 768px) {
    .keywords-container {
      .add-keyword {
        flex-wrap: wrap;

        .el-input {
          flex: 1;
          max-width: none;
        }
      }
    }
  }
</style>
