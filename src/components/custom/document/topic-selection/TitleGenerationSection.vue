<template>
  <div class="titles-section">
    <h2 class="section-title">标题选择</h2>

    <!-- 生成进度显示 -->
    <div v-if="isGenerating" class="generation-progress">
      <el-progress
        :percentage="progress"
        :status="progress === 100 ? 'success' : undefined"
        :stroke-width="6"
      />
      <p class="progress-text">正在生成标题，请稍候...</p>
    </div>

    <!-- 标题生成控制 -->
    <div class="generation-controls">
      <div class="control-group">
        <h4>标题生成控制</h4>
        <el-form :model="controls" label-width="100px">
          <el-form-item label="标题数量">
            <el-slider v-model="controlsCount" :min="3" :max="10" :step="1" show-input show-stops />
          </el-form-item>
          <el-form-item label="标题长度">
            <el-radio-group v-model="controlsLength">
              <el-radio value="short">简短</el-radio>
              <el-radio value="medium">适中</el-radio>
              <el-radio value="long">详细</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="风格偏好">
            <el-checkbox-group v-model="controlsStyles">
              <el-checkbox value="creative">创意性</el-checkbox>
              <el-checkbox value="professional">专业性</el-checkbox>
              <el-checkbox value="catchy">吸引力</el-checkbox>
              <el-checkbox value="descriptive">描述性</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="包含关键词">
            <div class="keywords-section">
              <el-tag
                v-for="keyword in customKeywords"
                :key="keyword"
                closable
                @close="$emit('remove-keyword', keyword)"
                type="info"
              >
                {{ keyword }}
              </el-tag>
              <el-input
                v-model="newKeyword"
                placeholder="添加关键词"
                size="small"
                style="width: 120px"
                @keyup.enter="
                  $emit('add-keyword', newKeyword)
                  newKeyword = ''
                "
              />
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="generation-actions">
      <!-- 方式一：检索+生成标题 -->
      <el-button type="primary" size="large" @click="$emit('open-material-selection')">
        <el-icon><Search /></el-icon>
        检索素材后生成标题
      </el-button>

      <!-- 方式二：直接Search2Title -->
      <el-button
        type="success"
        size="large"
        @click="$emit('execute-search2title')"
        :loading="search2titleLoading"
        :disabled="!canGenerateSearch2Title"
      >
        <el-icon><MagicStick /></el-icon>
        一键Search2Title
      </el-button>

      <el-button
        v-if="search2titleLoading"
        @click="$emit('cancel-search2title')"
        type="danger"
        plain
      >
        取消任务
      </el-button>

      <p class="generation-tip" v-if="!canGenerateTitles && !canGenerateSearch2Title">
        请先完成需求定义并生成AI简报
      </p>
    </div>

    <!-- 生成的标题展示 -->
    <div class="titles-display-section" v-if="hasGeneratedTitles">
      <div class="section-header">
        <h3>生成的标题选项</h3>
        <el-tag type="info">共 {{ generatedTitles.length }} 个标题</el-tag>
      </div>

      <div class="titles-grid">
        <TitleCard
          v-for="(title, index) in generatedTitles"
          :key="index"
          :title="title"
          :is-selected="selectedTitle === title"
          :score="getTitleScore(title)"
          :suggestions="getTitleSuggestions(title)"
          @select="$emit('select-title', title)"
          @update="$emit('update-title', index, $event)"
        />
      </div>

      <!-- 当前选中标题对应的素材 -->
      <div v-if="selectedTitle && currentTitleMaterials.length > 0" class="title-materials-section">
        <div class="section-header">
          <h3>「{{ selectedTitle.title }}」对应素材</h3>
          <div class="section-actions">
            <el-tag type="success" size="large">
              共 {{ currentTitleMaterials.length }} 个素材
            </el-tag>
          </div>
        </div>
        <div class="materials-list">
          <UnifiedMaterialCard
            v-for="material in currentTitleMaterials"
            :key="material.id"
            :material="material"
            :context="'search'"
            :show-selection="false"
            :show-score="true"
            @preview="$emit('preview-material', material)"
            @click="$emit('material-click', material)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Search, MagicStick } from '@element-plus/icons-vue'
  import TitleCard from '@/components/custom/TitleCard.vue'
  import UnifiedMaterialCard from '@/components/custom/material-card/UnifiedMaterialCard.vue'
  import type { Title } from '@/types/ai'
  import type { Material } from '@/types/material'

  defineOptions({ name: 'TitleGenerationSection' })

  interface TitleControls {
    count: number
    length: 'short' | 'medium' | 'long'
    styles: Array<'creative' | 'professional' | 'catchy' | 'descriptive'>
  }

  interface Props {
    isGenerating: boolean
    progress: number
    controls: TitleControls
    customKeywords: string[]
    canGenerateTitles: boolean
    canGenerateSearch2Title: boolean
    search2titleLoading: boolean
    hasGeneratedTitles: boolean
    generatedTitles: Title[]
    selectedTitle: Title | null
    currentTitleMaterials: Material[]
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    'update:controls': [value: TitleControls]
    'update:newKeyword': [value: string]
    'add-keyword': [keyword: string]
    'remove-keyword': [keyword: string]
    'open-material-selection': []
    'execute-search2title': []
    'cancel-search2title': []
    'select-title': [title: Title]
    'update-title': [index: number, newTitle: string]
    'preview-material': [material: Material]
    'material-click': [material: Material]
  }>()

  const newKeyword = ref('')

  // Computed properties with setters to avoid prop mutation
  const controlsCount = computed({
    get: () => props.controls.count,
    set: (value: number) => emit('update:controls', { ...props.controls, count: value })
  })

  const controlsLength = computed({
    get: () => props.controls.length,
    set: (value: 'short' | 'medium' | 'long') =>
      emit('update:controls', { ...props.controls, length: value })
  })

  const controlsStyles = computed({
    get: () => props.controls.styles,
    set: (value: Array<'creative' | 'professional' | 'catchy' | 'descriptive'>) =>
      emit('update:controls', { ...props.controls, styles: value })
  })

  // 模拟标题评分
  const getTitleScore = (): number => {
    return Math.floor(Math.random() * 40) + 60
  }

  // 模拟标题建议
  const getTitleSuggestions = (): string[] => {
    return ['更具吸引力', '更简洁明了', '更专业', '更具创意性']
  }
</script>

<style scoped lang="scss">
  .titles-section {
    max-width: 1200px;
    padding: 50px 40px 0;
    margin: 0 auto;
    border-top: 1px solid var(--el-border-color);
  }

  .section-title {
    padding-left: 12px;
    margin: 0 0 30px;
    font-size: 22px;
    font-weight: 600;
    color: var(--el-color-primary);
    border-left: 4px solid var(--el-color-primary);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }

  .generation-progress {
    padding: 20px;
    margin-bottom: 30px;
    text-align: center;
    background: var(--el-bg-color-page);
    border-radius: 8px;

    .progress-text {
      margin: 10px 0 0;
      color: var(--el-text-color-secondary);
    }
  }

  .generation-controls {
    margin: 0 0 30px;

    .control-group h4 {
      margin: 0 0 20px;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }
  }

  .keywords-section {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .generation-actions {
    display: flex;
    gap: 15px;
    align-items: center;
    padding-top: 30px;
    margin-top: 30px;
    border-top: 1px solid var(--el-border-color);
  }

  .generation-tip {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .titles-display-section {
    padding: 30px 0;
    margin-top: 30px;
  }

  .titles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    gap: 20px;
    padding: 4px;
    margin-bottom: 40px;

    @media (width <= 1400px) {
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    }

    @media (width <= 768px) {
      grid-template-columns: 1fr;
      gap: 15px;
    }
  }

  .title-materials-section {
    padding: 24px 0;
    margin-top: 30px;

    .section-header h3 {
      color: var(--el-color-primary);
    }

    .materials-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
  }

  @media (width <= 768px) {
    .titles-section {
      padding: 0;
    }

    .section-title {
      font-size: 18px;
    }

    .titles-grid {
      grid-template-columns: 1fr;
    }

    .generation-actions {
      flex-direction: column;
      align-items: center;
    }
  }
</style>
