<template>
  <el-dialog v-model="dialogVisible" title="编辑AI简报" width="900px" :close-on-click-modal="false">
    <el-tabs v-model="activeEditTab" class="briefing-edit-tabs">
      <el-tab-pane label="编辑模式" name="edit">
        <el-form label-width="80px">
          <el-form-item label="简报内容">
            <el-input
              v-model="editableBriefing"
              type="textarea"
              :rows="15"
              placeholder="请输入Markdown格式的简报内容"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="预览模式" name="preview">
        <div
          class="briefing-preview markdown-body"
          v-html="renderedEditableBriefing"
          style="max-height: 500px; padding: 20px; overflow-y: auto"
        ></div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { marked } from 'marked'

  interface Props {
    visible: boolean
    briefing: string
  }

  const props = defineProps<Props>()

  interface Emits {
    (e: 'update:visible', visible: boolean): void
    (e: 'save', briefing: string): void
  }

  const emit = defineEmits<Emits>()

  // 对话框可见性
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  // 活跃标签页
  const activeEditTab = ref<'edit' | 'preview'>('edit')

  // 可编辑的简报内容
  const editableBriefing = ref('')

  // 监听可见性变化，同步简报内容
  watch(
    () => props.visible,
    (newValue) => {
      if (newValue) {
        editableBriefing.value = props.briefing
        activeEditTab.value = 'edit'
      }
    }
  )

  // 渲染可编辑简报内容（Markdown转HTML）
  const renderedEditableBriefing = computed(() => {
    if (!editableBriefing.value) return ''
    return marked(editableBriefing.value)
  })

  // 关闭对话框
  const closeDialog = () => {
    dialogVisible.value = false
  }

  // 保存简报
  const handleSave = () => {
    emit('save', editableBriefing.value)
    closeDialog()
  }
</script>

<style scoped lang="scss">
  .briefing-preview {
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
  }

  :deep(.briefing-edit-tabs) {
    .el-tabs__content {
      padding: 16px 0;
    }
  }

  :deep(.markdown-body) {
    h1,
    h2,
    h3,
    h4 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
    }

    h1 {
      font-size: 1.5em;
      color: var(--el-color-primary);
    }

    p {
      margin-bottom: 1em;
      line-height: 1.7;
    }

    ul,
    ol {
      padding-left: 2em;
      margin-bottom: 1em;
    }

    li {
      margin-bottom: 0.5em;
      line-height: 1.6;
    }

    strong {
      font-weight: 600;
      color: var(--el-color-warning);
    }
  }
</style>
