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
      <div v-if="previewMode === 'preview'" class="material-preview__content">
        <div class="material-preview__content-grid">
          <!-- 左侧主要内容 -->
          <div class="material-preview__main-content">
            <!-- 摘要信息 -->
            <div class="material-preview__section" v-if="material.summary">
              <h3 class="material-preview__section-title">
                <el-icon class="material-preview__section-icon"><Document /></el-icon>
                内容摘要
              </h3>
              <div class="material-preview__summary">
                {{ material.summary }}
              </div>
            </div>

            <!-- 标签信息 -->
            <div class="material-preview__section" v-if="material.tags && material.tags.length > 0">
              <h3 class="material-preview__section-title">
                <el-icon class="material-preview__section-icon"><CollectionTag /></el-icon>
                标签
              </h3>
              <div class="material-preview__tags">
                <el-tag
                  v-for="tag in material.tags"
                  :key="tag"
                  size="default"
                  class="material-preview__tag"
                  effect="light"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>

            <!-- 搜索结果特有信息 -->
            <template v-if="isSearchResult">
              <!-- 关键摘录 -->
              <div
                class="material-preview__section"
                v-if="material.key_excerpts && material.key_excerpts.length > 0"
              >
                <h3 class="material-preview__section-title">
                  <el-icon class="material-preview__section-icon"><Document /></el-icon>
                  关键摘录
                </h3>
                <div class="material-preview__excerpts-container">
                  <ul class="material-preview__excerpts">
                    <li v-for="(excerpt, index) in material.key_excerpts" :key="index">
                      {{ excerpt }}
                    </li>
                  </ul>
                </div>
              </div>
            </template>
          </div>

          <!-- 右侧信息面板 -->
          <div class="material-preview__side-panel">
            <!-- 基本信息 -->
            <div class="material-preview__info-card">
              <h3 class="material-preview__info-card-title">
                <el-icon class="material-preview__section-icon"><InfoFilled /></el-icon>
                基本信息
              </h3>
              <div class="material-preview__info-list">
                <div class="material-preview__info-item" v-if="material.url">
                  <div class="material-preview__info-label">链接</div>
                  <div class="material-preview__info-value">
                    <a :href="material.url" target="_blank" class="material-preview__link">
                      {{ formatUrl(material.url) }}
                      <el-icon><Link /></el-icon>
                    </a>
                  </div>
                </div>
                <div class="material-preview__info-item" v-if="material.createdAt">
                  <div class="material-preview__info-label">创建时间</div>
                  <div class="material-preview__info-value">
                    {{ formatDate(material.createdAt) }}
                  </div>
                </div>
                <div class="material-preview__info-item" v-if="material.updatedAt">
                  <div class="material-preview__info-label">更新时间</div>
                  <div class="material-preview__info-value">
                    {{ formatDate(material.updatedAt) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 搜索结果特有信息 -->
            <template v-if="isSearchResult">
              <!-- 匹配度评分 -->
              <div class="material-preview__info-card" v-if="hasScore">
                <h3 class="material-preview__info-card-title">
                  <el-icon class="material-preview__section-icon"><Star /></el-icon>
                  匹配度评分
                </h3>
                <div class="material-preview__score-container">
                  <el-rate
                    v-model="scoreRating"
                    disabled
                    show-score
                    text-color="#ff9900"
                    :max="5"
                    size="large"
                  />
                  <div class="material-preview__score-details">
                    <span class="material-preview__score-text">
                      原始评分：{{ (material as Material).score?.toFixed(3) }}
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 编辑模式 -->
      <div v-else-if="previewMode === 'edit'" class="material-preview__edit-form">
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
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { Link, Document, CollectionTag, InfoFilled, Star } from '@element-plus/icons-vue'
  import type { Material } from '@/types/material'
  import { materialApiService } from '@/services/materialService'

  interface Props {
    material: Material | null
    visible: boolean
    context: 'search' | 'management'
    availableTags?: string[]
  }

  interface Emits {
    (e: 'update:visible', visible: boolean): void
    (e: 'material-updated', material: Material): void
  }

  const props = withDefaults(defineProps<Props>(), {
    material: null,
    visible: false,
    context: 'search',
    availableTags: () => []
  })

  const emit = defineEmits<Emits>()

  // 表单引用
  const editFormRef = ref<FormInstance>()

  // 状态
  const previewMode = ref<'preview' | 'edit'>('preview')
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

  // 计算属性
  const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  // 判断是否为搜索结果
  const isSearchResult = computed(() => {
    return props.material && 'score' in props.material
  })

  // 判断是否有评分
  const hasScore = computed(() => {
    return isSearchResult.value && typeof (props.material as Material).score === 'number'
  })

  // 显示标题（优先使用AI标题）
  const displayTitle = computed(() => {
    if (!props.material) return ''
    if ('title' in props.material && props.material.title) {
      return props.material.title
    }
    return props.material.title
  })

  // 评分转换
  const scoreRating = computed(() => {
    if (!hasScore.value) return 0
    return Math.max(1, Math.round((props.material as Material).score * 5))
  })

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
        previewMode.value = 'preview'
      }
    },
    { immediate: true }
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
        ...(props.material as Material),
        title: editForm.value.title,
        summary: editForm.value.summary,
        url: editForm.value.url,
        tags: editForm.value.tags,
        updatedAt: new Date()
      }

      emit('material-updated', updatedMaterial)
      ElMessage.success('素材更新成功')
      previewMode.value = 'preview'
    } catch (error) {
      console.error('更新素材失败:', error)
      ElMessage.error('更新素材失败')
    } finally {
      saving.value = false
    }
  }

  // 格式化日期
  function formatDate(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return String(date)
    }
  }

  // 格式化URL显示
  function formatUrl(url: string): string {
    if (!url) return ''
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
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

    &__meta-info {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    &__source {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }

    &__type-tag {
      font-weight: 500;
    }

    &__content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    &__content-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 32px;
      height: 100%;
    }

    &__main-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    &__side-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    &__section {
      position: relative;
    }

    &__section-title {
      display: flex;
      gap: 8px;
      align-items: center;
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__section-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }

    &__summary {
      padding: 20px;
      font-size: 14px;
      line-height: 1.7;
      color: var(--el-text-color-regular);
      white-space: pre-wrap;
      background: var(--el-fill-color-light);
      border-left: 4px solid var(--el-color-primary);
      border-radius: 8px;
    }

    &__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    &__tag {
      padding: 4px 12px;
      font-size: 13px;
      border-radius: 16px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
        transform: translateY(-1px);
      }
    }

    &__excerpts-container {
      padding: 20px;
      background: var(--el-fill-color-light);
      border-left: 4px solid var(--el-color-warning);
      border-radius: 8px;
    }

    &__excerpts {
      padding-left: 16px;
      margin: 0;

      li {
        position: relative;
        margin-bottom: 12px;
        line-height: 1.6;
        color: var(--el-text-color-regular);

        &:last-child {
          margin-bottom: 0;
        }

        &::marker {
          color: var(--el-color-warning);
        }
      }
    }

    &__info-card {
      padding: 20px;
      background: var(--el-fill-color-light);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--el-border-color);
        box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
      }
    }

    &__info-card-title {
      display: flex;
      gap: 8px;
      align-items: center;
      margin: 0 0 16px;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    &__info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    &__info-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    &__info-value {
      font-size: 14px;
      color: var(--el-text-color-primary);
      word-break: break-word;
    }

    &__link {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      padding: 4px 8px;
      color: var(--el-color-primary);
      text-decoration: none;
      border-radius: 4px;
      transition: all 0.3s ease;

      &:hover {
        color: var(--el-color-primary-light-3);
        text-decoration: none;
        background: var(--el-color-primary-light-9);
      }
    }

    &__score-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    &__score-details {
      text-align: center;
    }

    &__score-text {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    &__edit-form {
      max-height: 60vh;
      padding: 24px;
      overflow-y: auto;
    }

    &__footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
  }

  @media (width <= 1200px) {
    .material-preview {
      &__content-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      &__side-panel {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
      }
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

      &__meta-info {
        flex-wrap: wrap;
        gap: 8px;
      }

      &__content {
        padding: 16px;
      }

      &__content-grid {
        gap: 20px;
      }

      &__side-panel {
        grid-template-columns: 1fr;
      }

      &__section-title {
        font-size: 15px;
      }

      &__summary,
      &__excerpts-container,
      &__info-card {
        padding: 16px;
      }
    }
  }
</style>
