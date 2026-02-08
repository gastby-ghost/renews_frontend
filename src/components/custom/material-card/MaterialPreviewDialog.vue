<template>
  <el-dialog
    v-model="visible"
    :title="material?.title"
    width="85%"
    :before-close="closeDialog"
    class="material-preview-dialog"
    :modal-class="'material-preview-modal'"
  >
    <div class="material-preview" v-if="material">
      <!-- 预览模式切换 -->
      <div class="material-preview__header">
        <div class="material-preview__title-info">
          <h2 class="material-preview__main-title">{{ displayTitle }}</h2>
        </div>
        <div class="material-preview__mode-switch" v-if="context === 'management'">
          <el-radio-group v-model="previewMode" size="small">
            <el-radio-button value="preview">预览模式</el-radio-button>
            <el-radio-button value="edit">编辑模式</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 预览模式 -->
      <MaterialPreviewContent v-if="previewMode === 'preview'" :material="material" />

      <!-- 编辑模式 -->
      <MaterialEditForm
        v-else-if="previewMode === 'edit'"
        :material="material"
        :available-tags="availableTags"
        @material-updated="handleMaterialUpdated"
        ref="editFormRef"
      />
    </div>

    <template #footer>
      <div class="material-preview__footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button
          v-if="previewMode === 'edit' && context === 'management'"
          type="primary"
          @click="handleSave"
          :loading="saving"
        >
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import type { Material } from '@/types/material'

  // 子组件
  import MaterialPreviewContent from './MaterialPreviewContent.vue'
  import MaterialEditForm from './MaterialEditForm.vue'

  interface Props {
    material: Material | null
    visible: boolean
    context: 'search' | 'management'
    availableTags?: string[]
  }

  const props = withDefaults(defineProps<Props>(), {
    material: null,
    visible: false,
    context: 'search',
    availableTags: () => []
  })

  interface Emits {
    (e: 'update:visible', visible: boolean): void
    (e: 'material-updated', material: Material): void
  }

  const emit = defineEmits<Emits>()

  // 状态
  const previewMode = ref<'preview' | 'edit'>('preview')
  const saving = ref(false)
  const editFormRef = ref<InstanceType<typeof MaterialEditForm> | null>(null)

  // 计算属性
  const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  // 显示标题（优先使用AI标题）
  const displayTitle = computed(() => {
    if (!props.material) return ''
    if ('title' in props.material && props.material.title) {
      return props.material.title
    }
    return props.material.title
  })

  // 监听素材变化，重置预览模式
  watch(
    () => props.material,
    () => {
      previewMode.value = 'preview'
    }
  )

  // 监听对话框显示状态
  watch(visible, (newValue) => {
    if (newValue && props.material) {
      previewMode.value = 'preview'
    }
  })

  // 关闭对话框
  function closeDialog() {
    visible.value = false
  }

  // 素材更新处理
  function handleMaterialUpdated(material: Material) {
    emit('material-updated', material)
    previewMode.value = 'preview'
  }

  // 保存编辑
  async function handleSave() {
    if (editFormRef.value) {
      await editFormRef.value.handleSave()
    }
  }
</script>

<style scoped lang="scss">
  .material-preview-dialog {
    .el-dialog__body {
      padding: 0;
    }

    .el-dialog__header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .el-dialog__footer {
      padding: 16px 24px 20px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }

  .material-preview {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 70vh;

    &__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 20px 24px 16px;
      background: var(--el-bg-color-page);
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    &__title-info {
      flex: 1;
      margin-right: 20px;
    }

    &__main-title {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--el-text-color-primary);
    }

    &__footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
  }

  @media (width <= 768px) {
    .material-preview-dialog {
      .el-dialog__header,
      .el-dialog__footer {
        padding-right: 16px;
        padding-left: 16px;
      }
    }

    .material-preview {
      &__header {
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      &__title-info {
        margin-right: 0;
      }

      &__main-title {
        font-size: 18px;
      }
    }
  }
</style>
