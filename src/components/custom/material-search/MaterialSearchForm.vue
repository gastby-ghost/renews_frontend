<template>
  <div class="art-material-search-form">
    <el-card class="art-material-search-form__card">
      <template #header>
        <div class="art-material-search-form__header">
          <h3 class="art-material-search-form__title">
            <el-icon><Search /></el-icon>
            素材检索
          </h3>
          <div class="art-material-search-form__header-actions">
            <el-button
              v-if="searchHistory.length > 0"
              size="small"
              @click="$emit('toggle-history')"
            >
              搜索历史
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索历史 -->
      <div v-if="showHistory && searchHistory.length > 0" class="art-material-search-form__history">
        <div class="art-material-search-form__history-header">
          <span>最近搜索</span>
          <el-button size="small" text @click="$emit('clear-history')">清空</el-button>
        </div>
        <div class="art-material-search-form__history-list">
          <el-tag
            v-for="(item, index) in searchHistory.slice(0, 5)"
            :key="index"
            class="art-material-search-form__history-item"
            @click="$emit('use-history', item)"
          >
            {{ item.keywords }}
          </el-tag>
        </div>
      </div>

      <!-- 搜索表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        @submit.prevent="$emit('search')"
      >
        <el-form-item label="关键词" prop="keywords">
          <el-input
            v-model="form.keywords"
            placeholder="请输入搜索关键词"
            clearable
            @keyup.enter="$emit('search')"
          >
            <template #append>
              <el-button :icon="Search" @click="$emit('search')" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="搜索源" prop="providers">
          <el-select
            v-model="form.providers"
            multiple
            placeholder="选择搜索提供商"
            style="width: 100%"
          >
            <el-option
              v-for="provider in providers"
              :key="provider.id"
              :label="provider.name"
              :value="provider.id"
            >
              <div class="art-material-search-form__provider-option">
                <span>{{ provider.name }}</span>
                <el-tag size="small" :type="provider.type === 'ai' ? 'warning' : 'success'">
                  {{ provider.type === 'ai' ? 'AI' : 'API' }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="结果数量" prop="maxResults">
          <el-slider v-model="form.maxResults" :min="1" :max="10" :step="1" show-stops show-input />
        </el-form-item>

        <el-form-item>
          <div class="art-material-search-form__actions">
            <el-button type="primary" @click="$emit('search')" :loading="loading">
              开始搜索
            </el-button>
            <el-button @click="$emit('reset')">重置</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import { Search } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import type { SearchConfig, SearchProvider } from '@/types/material'

  defineOptions({ name: 'MaterialSearchForm' })

  interface Props {
    loading: boolean
    showHistory: boolean
    searchHistory: SearchConfig[]
    providers: SearchProvider[]
    initialConfig?: SearchConfig
  }

  const props = defineProps<Props>()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const emit = defineEmits<{
    search: []
    reset: []
    'toggle-history': []
    'clear-history': []
    'use-history': [item: SearchConfig]
  }>()

  const formRef = ref<FormInstance>()

  const form = reactive({
    keywords: '',
    providers: ['tavily'] as ('tavily' | 'bocha')[],
    maxResults: 20
  })

  const rules: FormRules = {
    keywords: [
      { required: true, message: '请输入搜索关键词', trigger: 'blur' },
      { min: 2, max: 100, message: '关键词长度应在 2 到 100 个字符之间', trigger: 'blur' }
    ],
    providers: [{ required: true, message: '请选择至少一个搜索提供商', trigger: 'change' }]
  }

  // Watch for initial config changes
  watch(
    () => props.initialConfig,
    (config) => {
      if (config) {
        form.keywords = config.keywords || ''
        form.providers = (config.providers as ('tavily' | 'bocha')[]) || ['tavily']
      }
    },
    { immediate: true }
  )

  // Expose methods
  const validate = () => formRef.value?.validate()
  const resetFields = () => {
    formRef.value?.resetFields()
    form.providers = ['tavily']
    form.maxResults = 20
  }

  defineExpose({
    validate,
    resetFields,
    form
  })
</script>

<style scoped lang="scss">
  .art-material-search-form {
    width: 100%;
    margin-bottom: 20px;

    &__card {
      margin-bottom: 20px;
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      &-actions {
        display: flex;
        gap: 8px;
      }

      .art-material-search-form__title {
        display: flex;
        gap: 8px;
        align-items: center;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }
    }

    &__history {
      padding: 16px;
      margin-bottom: 20px;
      background: var(--el-fill-color-lighter);
      border-radius: 6px;

      &-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      &-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      &-item {
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
          transform: translateY(-2px);
        }
      }
    }

    &__provider-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    &__actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
  }

  @media (width <= 768px) {
    .art-material-search-form {
      &__actions {
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }
  }
</style>
