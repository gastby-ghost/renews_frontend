<!-- 关键词管理组件 -->
<template>
  <div class="keywords-manager">
    <!-- 输入区域 -->
    <div class="input-section">
      <el-input
        v-model="inputValue"
        :placeholder="placeholder"
        :maxlength="maxLength"
        show-word-limit
        @keyup.enter="addKeyword"
        @input="handleInput"
        class="keyword-input"
      >
        <template #suffix>
          <el-button
            @click="addKeyword"
            :disabled="!canAdd"
            type="primary"
            size="small"
            class="add-button"
          >
            添加
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- 关键词列表 -->
    <div v-if="keywords.length > 0" class="keywords-list">
      <div class="list-header">
        <span class="count-text">已添加 {{ keywords.length }}/{{ maxCount }} 个关键词</span>
        <el-button v-if="keywords.length > 0" @click="clearAll" type="danger" size="small" text>
          清空全部
        </el-button>
      </div>

      <div class="tags-container">
        <el-tag
          v-for="(keyword, index) in keywords"
          :key="index"
          :type="getTagType(index)"
          :effect="tagEffect"
          closable
          @close="removeKeyword(index)"
          class="keyword-tag"
        >
          {{ keyword }}
        </el-tag>
      </div>
    </div>

    <!-- 帮助信息 -->
    <div v-if="helpText" class="help-text">
      {{ helpText }}
    </div>

    <!-- 建议关键词 -->
    <div v-if="suggestions.length > 0 && showSuggestions" class="suggestions">
      <div class="suggestions-header">
        <el-icon><Lightbulb /></el-icon>
        <span>建议关键词</span>
      </div>
      <div class="suggestions-list">
        <el-tag
          v-for="suggestion in suggestions"
          :key="suggestion"
          @click="addSuggestion(suggestion)"
          class="suggestion-tag"
        >
          {{ suggestion }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ElInput, ElButton, ElTag, ElIcon } from 'element-plus'
  import { Lightbulb } from '@element-plus/icons-vue'

  defineOptions({ name: 'KeywordsManager' })

  interface KeywordsManagerProps {
    /** 关键词列表 */
    modelValue: string[]
    /** 最大关键词数量 */
    maxCount?: number
    /** 输入框占位符 */
    placeholder?: string
    /** 最大输入长度 */
    maxLength?: number
    /** 帮助文本 */
    helpText?: string
    /** 标签效果 */
    tagEffect?: 'dark' | 'light' | 'plain'
    /** 建议关键词 */
    suggestions?: string[]
    /** 是否显示建议 */
    showSuggestions?: boolean
  }

  interface KeywordsManagerEmits {
    'update:modelValue': [value: string[]]
    change: [keywords: string[]]
    add: [keyword: string]
    remove: [index: number, keyword: string]
    clear: []
  }

  const props = withDefaults(defineProps<KeywordsManagerProps>(), {
    maxCount: 10,
    placeholder: '输入关键词后按回车添加',
    maxLength: 20,
    helpText: '',
    tagEffect: 'light',
    suggestions: () => [],
    showSuggestions: true
  })

  const emit = defineEmits<KeywordsManagerEmits>()

  const inputValue = ref('')
  const keywords = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // 是否可以添加
  const canAdd = computed(() => {
    const trimmed = inputValue.value.trim()
    return (
      trimmed.length > 0 &&
      !keywords.value.includes(trimmed) &&
      keywords.value.length < props.maxCount
    )
  })

  // 获取标签类型
  const getTagType = (index: number) => {
    const types = ['primary', 'success', 'warning', 'danger', 'info']
    return types[index % types.length]
  }

  // 处理输入
  const handleInput = (value: string) => {
    // 可以在这里添加输入验证逻辑
  }

  // 添加关键词
  const addKeyword = () => {
    const keyword = inputValue.value.trim()
    if (!keyword) return

    if (keywords.value.includes(keyword)) {
      ElMessage.warning('关键词已存在')
      return
    }

    if (keywords.value.length >= props.maxCount) {
      ElMessage.warning(`最多只能添加${props.maxCount}个关键词`)
      return
    }

    keywords.value.push(keyword)
    inputValue.value = ''
    emit('add', keyword)
    emit('change', keywords.value)
    ElMessage.success(`已添加关键词: ${keyword}`)
  }

  // 移除关键词
  const removeKeyword = (index: number) => {
    const keyword = keywords.value[index]
    keywords.value.splice(index, 1)
    emit('remove', index, keyword)
    emit('change', keywords.value)
  }

  // 清空全部
  const clearAll = () => {
    keywords.value = []
    emit('clear')
    emit('change', keywords.value)
  }

  // 添加建议关键词
  const addSuggestion = (suggestion: string) => {
    if (keywords.value.includes(suggestion)) {
      ElMessage.warning('关键词已存在')
      return
    }

    if (keywords.value.length >= props.maxCount) {
      ElMessage.warning(`最多只能添加${props.maxCount}个关键词`)
      return
    }

    keywords.value.push(suggestion)
    emit('add', suggestion)
    emit('change', keywords.value)
    ElMessage.success(`已添加关键词: ${suggestion}`)
  }

  // 监听关键词变化
  watch(
    keywords,
    (newKeywords) => {
      emit('change', newKeywords)
    },
    { deep: true }
  )
</script>

<style scoped lang="scss">
  .keywords-manager {
    .input-section {
      margin-bottom: 12px;

      .keyword-input {
        :deep(.el-input-group__append) {
          padding: 0;
          background: transparent;
          border: none;
        }

        .add-button {
          margin-right: 8px;
        }
      }
    }

    .keywords-list {
      .list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .count-text {
          font-size: 12px;
          font-weight: 500;
          color: var(--el-text-color-secondary);
        }
      }

      .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .keyword-tag {
          margin: 0;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
            transform: translateY(-1px);
          }
        }
      }
    }

    .help-text {
      margin-top: 8px;
      font-size: 12px;
      line-height: 1.4;
      color: var(--el-text-color-secondary);
    }

    .suggestions {
      padding: 12px;
      margin-top: 16px;
      background: var(--el-fill-color-lighter);
      border-radius: 6px;

      .suggestions-header {
        display: flex;
        gap: 6px;
        align-items: center;
        margin-bottom: 8px;
        font-size: 13px;
        font-weight: 500;
        color: var(--el-text-color-regular);

        .el-icon {
          font-size: 14px;
          color: var(--el-color-warning);
        }
      }

      .suggestions-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .suggestion-tag {
          cursor: pointer;
          border: 1px dashed var(--el-border-color);
          transition: all 0.2s ease;

          &:hover {
            color: var(--el-color-primary);
            background: var(--el-color-primary-light-9);
            border-color: var(--el-color-primary);
          }
        }
      }
    }
  }

  // 响应式设计
  @media (width <= 768px) {
    .keywords-manager {
      .keywords-list {
        .list-header {
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }
      }

      .suggestions {
        .suggestions-list {
          gap: 4px;
        }
      }
    }
  }
</style>
