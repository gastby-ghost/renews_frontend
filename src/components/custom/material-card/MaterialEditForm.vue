<template>
  <div class="material-edit-form">
    <el-form
      ref="editFormRef"
      :model="editForm"
      :rules="editRules"
      label-width="100px"
      @submit.prevent="handleSave"
    >
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="editForm.title"
          placeholder="请输入素材标题"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="摘要" prop="summary">
        <el-input
          v-model="editForm.summary"
          type="textarea"
          :rows="4"
          placeholder="请输入素材摘要"
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="链接" prop="url">
        <el-input v-model="editForm.url" placeholder="请输入素材链接" maxlength="500" />
      </el-form-item>

      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="editForm.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="请选择或输入标签"
          style="width: 100%"
        >
          <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import type { Material } from '@/types/material'
  import { materialApiService } from '@/services/core/materialService'

  interface Props {
    material: Material
    availableTags?: string[]
  }

  const props = withDefaults(defineProps<Props>(), {
    availableTags: () => []
  })

  interface Emits {
    (e: 'material-updated', material: Material): void
  }

  const emit = defineEmits<Emits>()

  // 表单引用
  const editFormRef = ref<FormInstance>()

  // 状态
  const saving = ref(false)

  // 编辑表单数据
  const editForm = ref({
    title: '',
    summary: '',
    url: '',
    tags: [] as string[]
  })

  // 表单验证规则
  const editRules: FormRules = {
    title: [
      { required: true, message: '请输入素材标题', trigger: 'blur' },
      { min: 1, max: 255, message: '标题长度应在 1 到 255 个字符之间', trigger: 'blur' }
    ],
    summary: [{ max: 1000, message: '摘要长度不能超过 1000 个字符', trigger: 'blur' }],
    url: [{ type: 'url', message: '请输入有效的链接地址', trigger: 'blur' }]
  }

  // 监听素材变化，更新表单数据
  watch(
    () => props.material,
    (newMaterial) => {
      if (newMaterial) {
        editForm.value = {
          title: newMaterial.title,
          summary: newMaterial.summary,
          url: newMaterial.url || '',
          tags: [...(newMaterial.tags || [])]
        }
      }
    },
    { immediate: true }
  )

  // 保存编辑
  async function handleSave() {
    if (!editFormRef.value || !props.material) return

    try {
      const valid = await editFormRef.value.validate()
      if (!valid) return

      saving.value = true

      // 调用API更新素材
      await materialApiService.updateMaterial(parseInt(props.material.id, 10), {
        title: editForm.value.title,
        summary: editForm.value.summary,
        url: editForm.value.url,
        tags: editForm.value.tags
      })

      // 构建更新后的素材对象
      const updatedMaterial: Material = {
        ...props.material,
        title: editForm.value.title,
        summary: editForm.value.summary,
        url: editForm.value.url,
        tags: editForm.value.tags,
        updatedAt: new Date()
      }

      emit('material-updated', updatedMaterial)
      ElMessage.success('素材更新成功')
    } catch {
      ElMessage.error('更新素材失败')
    } finally {
      saving.value = false
    }
  }

  // 暴露保存方法给父组件
  defineExpose({
    handleSave
  })
</script>

<style scoped lang="scss">
  .material-edit-form {
    max-height: 60vh;
    padding: 24px;
    overflow-y: auto;
  }
</style>
