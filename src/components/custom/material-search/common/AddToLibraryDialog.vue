<template>
  <div class="add-to-library-dialog">
    <!-- 添加到素材库确认对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="添加到素材库"
      width="600px"
      :before-close="handleClose"
    >
      <div class="add-to-library-dialog__content">
        <div class="add-to-library-dialog__info">
          <p>
            您已选择了
            <strong>{{ selectedMaterials.length }}</strong>
            个素材，是否确认添加到素材库？
          </p>
          <div v-if="selectedMaterials.length <= 5" class="add-to-library-dialog__list">
            <div
              v-for="materialId in selectedMaterials"
              :key="materialId"
              class="add-to-library-dialog__item"
            >
              {{ getMaterialById(materialId)?.title }}
            </div>
          </div>
          <div v-else class="add-to-library-dialog__summary">
            <p>选中的素材包括多种类型，将全部添加到素材库中。</p>
          </div>
        </div>

        <div class="add-to-library-dialog__options">
          <el-checkbox v-model="options.autoClear">添加后自动清除选择</el-checkbox>
          <el-checkbox v-model="options.goToLibrary">添加后跳转到素材库</el-checkbox>
        </div>
      </div>

      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading"> 确认添加 </el-button>
      </template>
    </el-dialog>

    <!-- 添加进度对话框 -->
    <el-dialog
      v-model="progressVisible"
      title="正在添加到素材库"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="add-to-library-dialog__progress">
        <el-progress
          :percentage="progress.percentage"
          :status="progress.status"
          :stroke-width="8"
        />
        <p class="add-to-library-dialog__progress-text">
          {{ progress.message }}
        </p>
        <div class="add-to-library-dialog__progress-details">
          <span>已处理: {{ progress.processed }} / {{ progress.total }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import type { Material } from '@/types/material'

  interface Props {
    visible: boolean
    selectedMaterials: string[]
    materials: Material[]
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false
  })

  const emit = defineEmits<{
    'update:visible': [visible: boolean]
    confirm: [options: { autoClear: boolean; goToLibrary: boolean }]
    close: []
  }>()

  // 对话框显示状态
  const dialogVisible = ref(false)
  const progressVisible = ref(false)

  // 添加选项
  const options = reactive({
    autoClear: true,
    goToLibrary: false
  })

  // 添加进度
  const progress = reactive({
    percentage: 0,
    status: 'success' as 'success' | 'exception' | 'warning',
    message: '准备添加...',
    processed: 0,
    total: 0
  })

  // 监听外部visible变化
  watch(
    () => props.visible,
    (newVal) => {
      dialogVisible.value = newVal
    }
  )

  // 监听内部visible变化，通知外部
  watch(dialogVisible, (newVal) => {
    emit('update:visible', newVal)
  })

  /**
   * 根据ID获取素材
   */
  const getMaterialById = (id: string) => {
    return props.materials.find((material) => material.id === id)
  }

  /**
   * 关闭对话框
   */
  const handleClose = () => {
    dialogVisible.value = false
    emit('close')
  }

  /**
   * 确认添加
   */
  const handleConfirm = () => {
    if (props.selectedMaterials.length === 0) {
      return
    }

    // 关闭确认对话框，显示进度对话框
    dialogVisible.value = false
    progressVisible.value = true

    // 初始化进度
    Object.assign(progress, {
      percentage: 0,
      status: 'success',
      message: '准备添加素材到数据库...',
      processed: 0,
      total: props.selectedMaterials.length
    })

    // 通知父组件执行添加操作
    emit('confirm', { ...options })
  }

  /**
   * 更新进度
   */
  const updateProgress = (newProgress: Partial<typeof progress>) => {
    Object.assign(progress, newProgress)
  }

  /**
   * 完成添加
   */
  const completeAdd = (success: boolean, message: string) => {
    if (success) {
      progress.percentage = 100
      progress.status = 'success'
      progress.message = message
    } else {
      progress.status = 'exception'
      progress.message = message
    }

    // 延迟关闭进度对话框
    setTimeout(() => {
      progressVisible.value = false
    }, 1500)
  }

  // 暴露方法给父组件
  defineExpose({
    updateProgress,
    completeAdd
  })
</script>

<style scoped lang="scss">
  .add-to-library-dialog {
    &__content {
      padding: 0;
    }

    &__info {
      margin-bottom: 20px;

      p {
        margin: 0 0 16px;
        font-size: 16px;
        line-height: 1.6;
        color: var(--el-text-color-primary);
      }
    }

    &__list {
      margin-bottom: 16px;
    }

    &__item {
      padding: 8px 12px;
      margin-bottom: 8px;
      font-size: 14px;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-lighter);
      border-radius: 4px;
    }

    &__summary {
      padding: 12px;
      background: var(--el-fill-color-lighter);
      border-radius: 4px;

      p {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-regular);
      }
    }

    &__options {
      padding-top: 16px;
      border-top: 1px solid var(--el-border-color-lighter);

      .el-checkbox {
        display: block;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    &__progress {
      text-align: center;

      &-text {
        margin: 16px 0;
        font-size: 16px;
        color: var(--el-text-color-primary);
      }

      &-details {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
</style>
