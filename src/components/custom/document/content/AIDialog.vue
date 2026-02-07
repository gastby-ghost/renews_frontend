<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="600px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="ai-dialog-content">
      <div v-if="aiLoading" class="ai-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>AI 正在处理中，请稍候...</p>
      </div>
      <div v-else>
        <div v-if="dialogType === 'polish'" class="ai-result">
          <h4>原始文本</h4>
          <div class="original-text">{{ selectedText }}</div>
          <h4>润色结果</h4>
          <div class="result-text" v-html="aiResult"></div>
        </div>
        <div v-else-if="dialogType === 'expand'" class="ai-result">
          <h4>扩写结果</h4>
          <div class="result-text" v-html="aiResult"></div>
        </div>
        <div v-else-if="dialogType === 'summarize'" class="ai-result">
          <h4>总结结果</h4>
          <div class="result-text" v-html="aiResult"></div>
        </div>
        <div v-else-if="dialogType === 'translate'" class="ai-result">
          <h4>翻译结果</h4>
          <div class="result-text" v-html="aiResult"></div>
        </div>
        <div v-else-if="dialogType === 'rewrite'" class="ai-result">
          <h4>改写结果</h4>
          <div class="result-text" v-html="aiResult"></div>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button v-if="!aiLoading" type="primary" @click="handleApply"> 应用到文档 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Loading } from '@element-plus/icons-vue'
  import type { AIDialogType } from '@/composables/document/useAIDialog'
  import { useAIDialog } from '@/composables/document/useAIDialog'

  type DialogType = AIDialogType

  const props = defineProps<{
    visible: boolean
    dialogTitle: string
    dialogType: DialogType
    aiLoading: boolean
    selectedText: string
    aiResult: string
  }>()

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'apply'): void
    (e: 'cancel'): void
  }>()

  // 使用 composable
  const { handleApply, handleCancel } = useAIDialog({
    visible: computed(() => props.visible),
    dialogType: computed(() => props.dialogType),
    aiLoading: computed(() => props.aiLoading),
    selectedText: computed(() => props.selectedText),
    aiResult: computed(() => props.aiResult),
    onApply: () => emit('apply'),
    onCancel: () => emit('cancel')
  })
</script>

<style scoped lang="scss">
  .ai-dialog-content {
    min-height: 200px;
  }

  .ai-loading {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    justify-content: center;
    padding: 40px 0;

    p {
      margin: 0;
      color: var(--el-text-color-secondary);
    }
  }

  .ai-result {
    h4 {
      margin: 16px 0 8px;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    .original-text {
      padding: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-light);
      border-radius: 4px;
    }

    .result-text {
      padding: 12px;
      font-size: 13px;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-light);
      border-radius: 4px;
    }
  }
</style>
