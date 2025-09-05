<template>
  <div class="material-edit">
    <div class="material-edit__header">
      <div class="material-edit__header-title">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <h2>编辑素材</h2>
      </div>
      <div class="material-edit__header-actions">
        <el-button @click="goBack">取消</el-button>
        <el-button type="primary" @click="saveMaterial" :loading="saving"> 保存 </el-button>
      </div>
    </div>

    <div class="material-edit__content">
      <div class="material-edit__meta">
        <el-form :model="editForm" :rules="rules" ref="formRef" label-width="80px" inline>
          <el-form-item label="标题" prop="title">
            <el-input
              v-model="editForm.title"
              placeholder="请输入标题"
              maxlength="100"
              show-word-limit
              style="width: 300px"
            />
          </el-form-item>

          <el-form-item label="来源" prop="source">
            <el-input
              v-model="editForm.source"
              placeholder="请输入来源"
              maxlength="100"
              show-word-limit
              style="width: 200px"
            />
          </el-form-item>

          <el-form-item label="类型" prop="type">
            <el-select v-model="editForm.type" placeholder="类型" style="width: 120px">
              <el-option label="图片" value="image" />
              <el-option label="视频" value="video" />
              <el-option label="音频" value="audio" />
              <el-option label="文本" value="text" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>

          <el-form-item label="标签" prop="tags">
            <el-select
              v-model="editForm.tags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="添加标签"
              style="width: 250px"
            >
              <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div class="material-edit__editor">
        <div class="material-edit__editor-header">
          <span>内容编辑</span>
          <el-button size="small" @click="togglePreview" :icon="View">
            {{ previewMode ? '编辑' : '预览' }}
          </el-button>
        </div>

        <div class="material-edit__editor-content">
          <MdEditor
            v-if="!previewMode"
            v-model="editForm.content"
            :toolbars="toolbars"
            :preview="false"
            :html-preview="false"
            :theme="theme"
            @onUploadImg="onUploadImg"
            @onChange="handleContentChange"
          />
          <div v-else class="material-edit__preview">
            <MdPreview v-model="editForm.content" :theme="theme" />
          </div>
        </div>
      </div>

      <div class="material-edit__summary">
        <h4>总结</h4>
        <el-input
          v-model="editForm.summary"
          type="textarea"
          :rows="3"
          placeholder="请输入素材总结"
          maxlength="500"
          show-word-limit
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { ArrowLeft, View } from '@element-plus/icons-vue'
  import { MdEditor, MdPreview } from 'md-editor-v3'
  import 'md-editor-v3/lib/style.css'
  import { useMaterialStore } from '@/store/material'

  const route = useRoute()
  const router = useRouter()
  const materialStore = useMaterialStore()

  // 响应式数据
  const formRef = ref()
  const saving = ref(false)
  const previewMode = ref(false)
  const materialId = computed(() => route.params.id as string)

  // 主题设置
  const theme = computed(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })

  // 编辑表单
  const editForm = reactive({
    title: '',
    source: '',
    type: 'text',
    tags: [] as string[],
    summary: '',
    content: ''
  })

  // 表单验证规则
  const rules = {
    title: [
      { required: true, message: '请输入标题', trigger: 'blur' },
      { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
    ],
    source: [
      { required: true, message: '请输入来源', trigger: 'blur' },
      { min: 1, max: 100, message: '来源长度在 1 到 100 个字符', trigger: 'blur' }
    ],
    type: [{ required: true, message: '请选择类型', trigger: 'change' }],
    tags: [{ required: true, message: '请至少输入一个标签', trigger: 'change' }],
    summary: [
      { required: true, message: '请输入总结', trigger: 'blur' },
      { min: 1, max: 500, message: '总结长度在 1 到 500 个字符', trigger: 'blur' }
    ],
    content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
  }

  // 工具栏配置 (简化版，类似 Typora)
  const toolbars = [
    'bold',
    'italic',
    'strike-through',
    'title',
    'quote',
    'unordered-list',
    'ordered-list',
    'task',
    'code',
    'link',
    'image',
    'table',
    'preview',
    'catalog'
  ]

  // 可用标签列表
  const availableTags = ref<string[]>([])

  // 方法
  async function loadMaterial() {
    try {
      const material = materialStore.materials.find((m) => m.id === materialId.value)
      if (!material) {
        ElMessage.error('素材不存在')
        goBack()
        return
      }

      // 填充表单
      editForm.title = material.title
      editForm.source = material.source
      editForm.type = material.type
      editForm.tags = [...material.tags]
      editForm.summary = material.summary
      editForm.content = material.content || ''
    } catch (err) {
      console.error('加载素材失败:', err)
      ElMessage.error('加载素材失败')
      goBack()
    }
  }

  async function saveMaterial() {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      saving.value = true

      // 构建更新数据
      const updateData = {
        id: materialId.value,
        title: editForm.title,
        source: editForm.source,
        type: editForm.type,
        tags: editForm.tags,
        summary: editForm.summary,
        content: editForm.content,
        updatedAt: new Date()
      }

      // 更新素材
      await materialStore.updateMaterial(updateData)

      ElMessage.success('保存成功')
      goBack()
    } catch (err) {
      console.error('保存失败:', err)
      ElMessage.error('保存失败')
    } finally {
      saving.value = false
    }
  }

  function goBack() {
    router.push('/material/management')
  }

  function togglePreview() {
    previewMode.value = !previewMode.value
  }

  function handleContentChange(value: string) {
    editForm.content = value
  }

  async function onUploadImg(files: File[], callback: (urls: string[]) => void) {
    try {
      const urls = files.map((file) => {
        return URL.createObjectURL(file)
      })

      callback(urls)
    } catch (err) {
      console.error('图片上传失败:', err)
      ElMessage.error('图片上传失败')
    }
  }

  // 加载可用标签
  function loadAvailableTags() {
    const allTags = new Set<string>()
    materialStore.materials.forEach((material) => {
      material.tags.forEach((tag) => {
        allTags.add(tag)
      })
    })
    availableTags.value = Array.from(allTags)
  }

  // 生命周期
  onMounted(async () => {
    try {
      await materialStore.loadLibraryMaterials()
      loadAvailableTags()
      await loadMaterial()
    } catch (err) {
      console.error('初始化失败:', err)
      ElMessage.error('初始化失败')
    }
  })
</script>

<style scoped lang="scss">
  .material-edit {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--el-bg-color);

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--el-border-color-light);

      &-title {
        display: flex;
        gap: 12px;
        align-items: center;

        h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
      }

      &-actions {
        display: flex;
        gap: 8px;
      }
    }

    &__content {
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
    }

    &__meta {
      padding: 16px 20px;
      background: var(--el-bg-color-page);
      border-bottom: 1px solid var(--el-border-color-light);

      .el-form {
        margin: 0;
      }

      .el-form-item {
        margin-right: 16px;
        margin-bottom: 8px;
      }
    }

    &__editor {
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: hidden;

      &-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        background: var(--el-bg-color-page);
        border-bottom: 1px solid var(--el-border-color-light);

        span {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-regular);
        }
      }

      &-content {
        flex: 1;
        overflow: hidden;
        background: var(--el-bg-color);

        :deep(.md-editor) {
          height: 100%;
          border: none;
          border-radius: 0;
        }

        :deep(.md-editor-preview) {
          height: 100%;
          padding: 20px;
          overflow-y: auto;
          border: none;
          border-radius: 0;
        }
      }
    }

    &__preview {
      height: 100%;
      padding: 20px;
      overflow-y: auto;
      background: var(--el-bg-color);
    }

    &__summary {
      padding: 16px 20px;
      background: var(--el-bg-color-page);
      border-top: 1px solid var(--el-border-color-light);

      h4 {
        margin: 0 0 8px;
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-regular);
      }

      .el-textarea {
        .el-textarea__inner {
          background: var(--el-bg-color);
          border-color: var(--el-border-color);
        }
      }
    }
  }

  // 响应式设计
  @media (width <= 768px) {
    .material-edit {
      &__header {
        padding: 12px 16px;

        &-title {
          h2 {
            font-size: 16px;
          }
        }
      }

      &__meta {
        padding: 12px 16px;

        .el-form-item {
          width: 100%;
          margin-right: 0;
          margin-bottom: 8px;

          .el-input,
          .el-select {
            width: 100% !important;
          }
        }
      }

      &__summary {
        padding: 12px 16px;
      }
    }
  }
</style>
