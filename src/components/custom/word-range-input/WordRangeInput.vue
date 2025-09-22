<!-- 字数范围输入组件 -->
<template>
  <div class="word-range-input">
    <div class="range-container">
      <div class="range-item">
        <el-input-number
          :value="minValue"
          :min="minLimit"
          :max="maxLimit"
          :step="step"
          :precision="0"
          :controls="false"
          :placeholder="minPlaceholder"
          @input="handleMinInput"
          @change="handleMinChange"
          @blur="handleBlur"
          class="range-input"
        />
        <span class="range-label">{{ minLabel }}</span>
      </div>

      <div class="range-separator">
        <span class="separator-line"></span>
        <span class="separator-text">至</span>
        <span class="separator-line"></span>
      </div>

      <div class="range-item">
        <el-input-number
          :value="maxValue"
          :min="minLimit"
          :max="maxLimit"
          :step="step"
          :precision="0"
          :controls="false"
          :placeholder="maxPlaceholder"
          @input="handleMaxInput"
          @change="handleMaxChange"
          @blur="handleBlur"
          class="range-input"
        />
        <span class="range-label">{{ maxLabel }}</span>
      </div>
    </div>

    <div class="range-info">
      <span class="range-text">{{ rangeText }}</span>
      <span class="range-help">{{ helpText }}</span>
    </div>

    <!-- 范围预览 -->
    <div v-if="showPreview && minValue && maxValue" class="range-preview">
      <div class="preview-bar">
        <div class="preview-fill" :style="{ width: previewWidth + '%' }"></div>
        <div class="preview-labels">
          <span class="preview-min">{{ minValue }}</span>
          <span class="preview-max">{{ maxValue }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, watch } from 'vue'
  import { ElInputNumber } from 'element-plus'

  defineOptions({ name: 'WordRangeInput' })

  interface WordRangeInputProps {
    /** 最小值 */
    minValue: number
    /** 最大值 */
    maxValue: number
    /** 最小限制 */
    minLimit: number
    /** 最大限制 */
    maxLimit: number
    /** 步长 */
    step?: number
    /** 最小标签 */
    minLabel?: string
    /** 最大标签 */
    maxLabel?: string
    /** 最小占位符 */
    minPlaceholder?: string
    /** 最大占位符 */
    maxPlaceholder?: string
    /** 帮助文本 */
    helpText?: string
    /** 是否显示预览 */
    showPreview?: boolean
    /** 单位 */
    unit?: string
  }

  const props = withDefaults(defineProps<WordRangeInputProps>(), {
    step: 1,
    minLabel: '最小',
    maxLabel: '最大',
    minPlaceholder: '请输入最小值',
    maxPlaceholder: '请输入最大值',
    helpText: '',
    showPreview: true,
    unit: '字'
  })

  interface WordRangeInputEmits {
    'update:minValue': [value: number]
    'update:maxValue': [value: number]
    change: [min: number, max: number]
  }

  const emit = defineEmits<WordRangeInputEmits>()

  // 范围文本
  const rangeText = computed(() => {
    if (!props.minValue || !props.maxValue) return ''
    return `${props.minValue}-${props.maxValue}${props.unit}`
  })

  // 预览宽度
  const previewWidth = computed(() => {
    if (!props.minValue || !props.maxValue) return 0
    const range = props.maxLimit - props.minLimit
    const currentRange = props.maxValue - props.minValue
    return Math.min((currentRange / range) * 100, 100)
  })

  // 处理最小值输入
  const handleMinInput = (value: number | null) => {
    const newMin = value || props.minLimit
    emit('update:minValue', newMin)
  }

  // 处理最大值输入
  const handleMaxInput = (value: number | null) => {
    const newMax = value || props.maxLimit
    emit('update:maxValue', newMax)
  }

  // 处理最小值变化
  const handleMinChange = (value: number | null) => {
    const newMin = value || props.minLimit
    emit('update:minValue', newMin)
    emit('change', newMin, props.maxValue)
  }

  // 处理最大值变化
  const handleMaxChange = (value: number | null) => {
    const newMax = value || props.maxLimit
    emit('update:maxValue', newMax)
    emit('change', props.minValue, newMax)
  }

  // 处理失焦验证
  const handleBlur = () => {
    // 确保最小值不大于最大值
    if (props.minValue > props.maxValue) {
      emit('update:minValue', props.maxValue)
    }
  }

  // 监听外部值变化
  watch(
    () => props.minValue,
    (newVal) => {
      if (newVal > props.maxValue) {
        emit('update:maxValue', newVal)
      }
    }
  )

  watch(
    () => props.maxValue,
    (newVal) => {
      if (newVal < props.minValue) {
        emit('update:minValue', newVal)
      }
    }
  )
</script>

<style scoped lang="scss">
  .word-range-input {
    .range-container {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 8px;
    }

    .range-item {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;

      .range-input {
        width: 100%;
        max-width: 120px;

        :deep(.el-input__inner) {
          font-size: 16px;
          font-weight: 500;
          text-align: center;
        }
      }

      .range-label {
        margin-top: 4px;
        font-size: 12px;
        font-weight: 500;
        color: var(--el-text-color-secondary);
      }
    }

    .range-separator {
      display: flex;
      gap: 8px;
      align-items: center;
      margin: 0 8px;

      .separator-line {
        width: 20px;
        height: 1px;
        background: var(--el-border-color);
      }

      .separator-text {
        font-size: 12px;
        font-weight: 500;
        color: var(--el-text-color-regular);
        white-space: nowrap;
      }
    }

    .range-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      .range-text {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-color-primary);
      }

      .range-help {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .range-preview {
      .preview-bar {
        position: relative;
        height: 6px;
        overflow: hidden;
        background: var(--el-fill-color-light);
        border-radius: 3px;

        .preview-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            var(--el-color-primary-light-5),
            var(--el-color-primary)
          );
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .preview-labels {
          position: absolute;
          top: -20px;
          right: 0;
          left: 0;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  // 响应式设计
  @media (width <= 768px) {
    .word-range-input {
      .range-container {
        flex-direction: column;
        gap: 12px;

        .range-separator {
          order: 2;
          margin: 8px 0;

          .separator-line {
            width: 40px;
          }
        }

        .range-item {
          order: 1;
          width: 100%;

          .range-input {
            max-width: 200px;
          }
        }
      }

      .range-info {
        flex-direction: column;
        gap: 4px;
        align-items: flex-start;
      }
    }
  }
</style>
