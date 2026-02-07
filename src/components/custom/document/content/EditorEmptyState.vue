<template>
  <div class="empty-editor">
    <div class="empty-icon">📝</div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <div class="empty-actions">
      <slot name="actions">
        <el-button type="primary" size="large" @click="$emit('generate')">
          {{ buttonText }}
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'EditorEmptyState' })

interface Props {
  title?: string
  description?: string
  buttonText?: string
}

withDefaults(defineProps<Props>(), {
  title: '开始创作您的 Markdown 文档',
  description: '点击"AI生成"让AI帮您生成内容，或手动开始写作',
  buttonText: 'AI生成正文'
})

defineEmits<{
  generate: []
}>()
</script>

<style scoped lang="scss">
.empty-editor {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;

  .empty-icon {
    margin-bottom: 24px;
    font-size: 72px;
    opacity: 0.8;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0 0 24px;
    font-size: 15px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
}

@media (width <= 900px) {
  .empty-editor {
    h3 {
      font-size: 20px;
    }

    .empty-icon {
      font-size: 64px;
    }
  }
}

@media (width <= 600px) {
  .empty-editor {
    h3 {
      font-size: 18px;
    }

    p {
      font-size: 14px;
    }

    .empty-icon {
      font-size: 56px;
    }
  }
}
</style>
