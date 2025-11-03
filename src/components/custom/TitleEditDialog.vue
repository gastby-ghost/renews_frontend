<template>
  <el-dialog
    :model-value="visible"
    :title="`编辑标题 - ${originalTitle?.title || ''}`"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-tabs v-model="activeTab" class="title-edit-tabs">
      <el-tab-pane label="编辑模式" name="edit">
        <el-form label-width="120px">
          <el-form-item label="标题" required>
            <el-input v-model="editingForm.title" placeholder="请输入标题" size="large" />
          </el-form-item>

          <el-form-item label="角度">
            <el-input
              v-model="editingForm.angle"
              type="textarea"
              :rows="3"
              placeholder="请输入角度分析"
            />
          </el-form-item>

          <el-form-item label="时效性">
            <el-input
              v-model="editingForm.why_now"
              type="textarea"
              :rows="3"
              placeholder="请输入时效性分析"
            />
          </el-form-item>

          <el-form-item label="可行性">
            <el-input
              v-model="editingForm.feasibility"
              type="textarea"
              :rows="3"
              placeholder="请输入可行性分析"
            />
          </el-form-item>

          <el-form-item label="新闻价值">
            <div class="news-values-editor">
              <el-tag
                v-for="(value, index) in editingForm.news_values"
                :key="index"
                closable
                @close="removeNewsValue(index)"
                type="info"
                effect="plain"
              >
                {{ value }}
              </el-tag>
              <div class="add-news-value">
                <el-input
                  v-if="newNewsValue"
                  v-model="newNewsValue"
                  placeholder="添加新闻价值"
                  size="small"
                  @keyup.enter="addNewsValue"
                  @blur="addNewsValue"
                />
                <el-button v-else @click="addNewsValueInput" size="small" plain>
                  添加新闻价值
                </el-button>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="可验证性">
            <el-input
              v-model="editingForm.verifiability"
              type="textarea"
              :rows="3"
              placeholder="请输入可验证性分析"
            />
          </el-form-item>

          <el-form-item label="风险提示">
            <el-input
              v-model="editingForm.risk_notes"
              type="textarea"
              :rows="3"
              placeholder="请输入风险提示"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="预览模式" name="preview">
        <div class="title-preview">
          <div class="preview-section">
            <h3>{{ editingForm.title }}</h3>
          </div>

          <div class="preview-section">
            <h4>角度</h4>
            <p>{{ editingForm.angle || '暂无' }}</p>
          </div>

          <div class="preview-section">
            <h4>时效性</h4>
            <p>{{ editingForm.why_now || '暂无' }}</p>
          </div>

          <div class="preview-section">
            <h4>可行性</h4>
            <p>{{ editingForm.feasibility || '暂无' }}</p>
          </div>

          <div class="preview-section" v-if="editingForm.news_values.length > 0">
            <h4>新闻价值</h4>
            <div class="preview-tags">
              <el-tag
                v-for="(value, index) in editingForm.news_values"
                :key="index"
                type="info"
                effect="plain"
              >
                {{ value }}
              </el-tag>
            </div>
          </div>

          <div class="preview-section">
            <h4>可验证性</h4>
            <p>{{ editingForm.verifiability || '暂无' }}</p>
          </div>

          <div class="preview-section" v-if="editingForm.risk_notes">
            <h4>风险提示</h4>
            <p>{{ editingForm.risk_notes }}</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import type { Title } from '@/types/ai'
  import { ElMessage } from 'element-plus'

  interface Props {
    visible: boolean
    title: Title | null
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    'update:visible': [value: boolean]
    update: [oldTitle: Title, newTitle: Title]
  }>()

  // 标签页状态
  const activeTab = ref<'edit' | 'preview'>('edit')

  // 新新闻价值输入
  const newNewsValue = ref('')

  // 编辑表单数据
  const editingForm = reactive({
    title: '',
    angle: '',
    why_now: '',
    feasibility: '',
    news_values: [] as string[],
    verifiability: '',
    risk_notes: ''
  })

  // 原始标题备份
  const originalTitle = ref<Title | null>(null)

  // 初始化表单数据
  const initForm = (title: Title | null) => {
    if (title) {
      originalTitle.value = { ...title }
      editingForm.title = title.title
      editingForm.angle = title.angle
      editingForm.why_now = title.why_now
      editingForm.feasibility = title.feasibility
      editingForm.news_values = [...title.news_values]
      editingForm.verifiability = title.verifiability
      editingForm.risk_notes = title.risk_notes
      newNewsValue.value = ''
      activeTab.value = 'edit'
    }
  }

  // 监听标题变化
  watch(
    () => props.title,
    (title) => {
      initForm(title)
    },
    { immediate: true }
  )

  // 添加新闻价值输入框
  const addNewsValueInput = () => {
    newNewsValue.value = ''
  }

  // 添加新闻价值
  const addNewsValue = () => {
    const value = newNewsValue.value.trim()
    if (value && !editingForm.news_values.includes(value)) {
      editingForm.news_values.push(value)
      newNewsValue.value = ''
    }
  }

  // 删除新闻价值
  const removeNewsValue = (index: number) => {
    editingForm.news_values.splice(index, 1)
  }

  // 保存
  const handleSave = () => {
    if (!editingForm.title.trim()) {
      ElMessage.warning('请输入标题')
      return
    }

    if (!props.title) {
      ElMessage.error('标题数据异常')
      return
    }

    // 构建新的标题对象
    const updatedTitle: Title = {
      title: editingForm.title,
      angle: editingForm.angle,
      why_now: editingForm.why_now,
      feasibility: editingForm.feasibility,
      news_values: editingForm.news_values,
      verifiability: editingForm.verifiability,
      risk_notes: editingForm.risk_notes,
      sources: props.title.sources
    }

    emit('update', props.title, updatedTitle)
    ElMessage.success('标题已更新')
    handleClose()
  }

  // 关闭对话框
  const handleClose = () => {
    emit('update:visible', false)
  }
</script>

<style scoped lang="scss">
  .title-edit-tabs {
    :deep(.el-tabs__content) {
      padding: 20px 0;
    }
  }

  .news-values-editor {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    .el-tag {
      margin-bottom: 0;
    }

    .add-news-value {
      display: flex;
      gap: 8px;
      align-items: center;

      .el-input {
        width: auto;
        min-width: 150px;
      }
    }
  }

  .title-preview {
    max-height: 600px;
    padding: 20px;
    overflow-y: auto;
    background: var(--el-fill-color-lighter);
    border-radius: 4px;

    .preview-section {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      h3 {
        margin: 0 0 10px;
        font-size: 20px;
        color: var(--el-color-primary);
      }

      h4 {
        margin: 0 0 8px;
        font-size: 16px;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 0;
        line-height: 1.6;
        color: var(--el-text-color-regular);
      }

      .preview-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  }

  .dialog-footer {
    .el-button {
      margin-left: 8px;
    }
  }
</style>
