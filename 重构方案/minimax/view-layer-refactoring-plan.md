# View 层重构详细方案

## 重构目标

将现有的 View 组件从混合业务逻辑和 UI 逻辑转变为**纯 UI 展示和交互**，确保职责单一、易于测试和维护。

## 现状分析

### 当前 View 存在的问题

1. **职责混乱**：同时处理 UI 渲染和业务逻辑
2. **API 调用**：直接在组件中调用 Service
3. **状态管理**：直接操作 Store
4. **耦合度高**：组件与业务逻辑紧密耦合
5. **难以测试**：业务逻辑与 UI 逻辑混合

### 当前 View 清单

```
src/views/document-generation/
├── topic-selection/
│   └── index.vue              ❌ 1462行，职责混乱
├── outline/
│   ├── index.vue              ❌ 312行，有所改善
│   ├── TitleSection.vue       ✅ 职责较清晰
│   ├── OutlineEditorSection.vue ✅ 职责较清晰
│   └── MaterialsSection.vue   ✅ 职责较清晰
└── content/
    ├── index.vue              ❌ 880行，职责混乱
    ├── HeaderSection.vue      ✅ 职责清晰
    ├── EditorPanel.vue        ✅ 职责清晰
    ├── OutlinePanel.vue       ✅ 职责清晰
    ├── StatsPanel.vue         ✅ 职责清晰
    └── AIDialog.vue           ✅ 职责清晰
```

## 重构策略

### 原则

1. **纯 UI 展示**：仅负责渲染 UI，不包含业务逻辑
2. **事件传递**：用户交互事件传递给 Composable
3. **状态订阅**：通过 Composable 获取数据，不直接操作 Store
4. **无副作用**：不包含异步操作和副作用
5. **清晰接口**：明确的 Props 和 Events 定义

### 重构方案

#### 1. Topic Selection 页面

##### 1.1 主页面组件

**文件**：`src/views/document-generation/topic-selection/TopicSelectionView.vue`

```vue
<template>
  <div class="topic-selection-view">
    <!-- 顶部导航 -->
    <TopicSelectionHeader
      :current-step="topicSelection.currentStep"
      :total-steps="topicSelection.totalSteps"
      @step-click="handleStepClick"
    />

    <!-- 主要内容区域 -->
    <div class="topic-selection-content">
      <!-- 步骤1：需求定义 -->
      <RequirementsFormSection
        v-if="topicSelection.currentStep === 1"
        :requirements="topicSelection.requirements"
        :error="topicSelection.error"
        :is-loading="topicSelection.isGeneratingBrief"
        @update="handleUpdateRequirements"
        @next="handleNext"
      />

      <!-- 步骤2：研究简报 -->
      <ResearchBriefSection
        v-else-if="topicSelection.currentStep === 2"
        :brief="topicSelection.researchBrief"
        :error="topicSelection.error"
        :is-loading="topicSelection.isGeneratingBrief"
        @edit="handleEditBrief"
        @regenerate="handleRegenerateBrief"
        @next="handleNext"
        @prev="handlePrev"
      />

      <!-- 步骤3：标题生成 -->
      <TitleGenerationSection
        v-else-if="topicSelection.currentStep === 3"
        :titles="topicSelection.generatedTitles"
        :selected-title="topicSelection.selectedTitle"
        :error="topicSelection.error"
        :is-loading="topicSelection.isGeneratingTitles"
        @select="topicSelection.selectTitle"
        @regenerate="handleRegenerateTitles"
        @next="handleNext"
        @prev="handlePrev"
      />

      <!-- 步骤4：素材搜索 -->
      <MaterialSearchSection
        v-else-if="topicSelection.currentStep === 4"
        :search-results="topicSelection.searchResults"
        :error="topicSelection.error"
        :is-loading="topicSelection.isSearching"
        @search="handleSearchMaterials"
        @next="handleNext"
        @prev="handlePrev"
      />

      <!-- 步骤5：确认和继续 -->
      <ConfirmationSection
        v-else-if="topicSelection.currentStep === 5"
        :requirements="topicSelection.requirements"
        :research-brief="topicSelection.researchBrief"
        :selected-title="topicSelection.selectedTitle"
        @confirm="handleConfirm"
        @prev="handlePrev"
      />
    </div>

    <!-- 底部操作栏 -->
    <TopicSelectionFooter
      :current-step="topicSelection.currentStep"
      :total-steps="topicSelection.totalSteps"
      :can-proceed="canProceedToNext"
      @prev="handlePrev"
      @next="handleNext"
      @reset="handleReset"
    />

    <!-- 错误提示 -->
    <el-alert
      v-if="topicSelection.error"
      :title="topicSelection.error"
      type="error"
      show-icon
      closable
      @close="topicSelection.clearError()"
      class="error-alert"
    />

    <!-- 全局加载遮罩 -->
    <el-overlay v-if="isGlobalLoading" class="global-loading">
      <el-icon class="is-loading" :size="50">
        <Loading />
      </el-icon>
      <p>正在处理，请稍候...</p>
    </el-overlay>
  </div>
</template>

<script setup lang="ts">
  // ===== 导入 Composable =====
  const topicSelection = useTopicSelection()

  // ===== 本地状态 =====
  const isGlobalLoading = computed(() => {
    return (
      topicSelection.isGeneratingBrief.value ||
      topicSelection.isGeneratingTitles.value ||
      topicSelection.isSearching.value
    )
  })

  const canProceedToNext = computed(() => {
    switch (topicSelection.currentStep.value) {
      case 1:
        return topicSelection.requirements.value.topic.trim().length > 0
      case 2:
        return !!topicSelection.researchBrief.value
      case 3:
        return !!topicSelection.selectedTitle.value
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  })

  // ===== 事件处理 =====

  /**
   * 更新需求表单
   */
  const handleUpdateRequirements = (updates: Partial<RequirementsForm>) => {
    topicSelection.updateRequirements(updates)
  }

  /**
   * 进入下一步
   */
  const handleNext = async () => {
    try {
      switch (topicSelection.currentStep.value) {
        case 1:
          await topicSelection.generateResearchBrief()
          break
        case 2:
          // 研究简报生成完成，进入下一步
          break
        case 3:
          await topicSelection.generateTitles()
          break
        case 4:
          // 素材搜索完成，进入下一步
          break
        case 5:
          // 确认并跳转到下一阶段
          await handleConfirm()
          return
      }
      topicSelection.proceedToNextStep()
    } catch (error) {
      console.error('步骤执行失败:', error)
    }
  }

  /**
   * 返回上一步
   */
  const handlePrev = () => {
    if (topicSelection.currentStep.value > 1) {
      topicSelection.currentStep.value--
    }
  }

  /**
   * 点击步骤导航
   */
  const handleStepClick = (step: number) => {
    // 仅允许访问已完成或当前步骤
    if (step <= topicSelection.currentStep.value) {
      topicSelection.currentStep.value = step
    }
  }

  /**
   * 编辑研究简报
   */
  const handleEditBrief = () => {
    // 切换到简报编辑模式
    showBriefEditDialog.value = true
  }

  /**
   * 重新生成研究简报
   */
  const handleRegenerateBrief = async () => {
    try {
      await topicSelection.generateResearchBrief()
    } catch (error) {
      console.error('重新生成简报失败:', error)
    }
  }

  /**
   * 重新生成标题
   */
  const handleRegenerateTitles = async () => {
    try {
      await topicSelection.generateTitles()
    } catch (error) {
      console.error('重新生成标题失败:', error)
    }
  }

  /**
   * 搜索素材
   */
  const handleSearchMaterials = async (query: string) => {
    try {
      await topicSelection.searchMaterials(query)
    } catch (error) {
      console.error('搜索素材失败:', error)
    }
  }

  /**
   * 确认并继续
   */
  const handleConfirm = async () => {
    try {
      // 跳转到大纲编辑阶段
      await router.push('/document-generation/outline')
    } catch (error) {
      console.error('跳转失败:', error)
      ElMessage.error('跳转失败，请重试')
    }
  }

  /**
   * 重置
   */
  const handleReset = () => {
    ElMessageBox.confirm('确定要重置所有内容吗？', '提示', {
      type: 'warning'
    })
      .then(() => {
        topicSelection.reset()
      })
      .catch(() => {
        // 用户取消
      })
  }
</script>

<style scoped>
  .topic-selection-view {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-color);
  }

  .topic-selection-content {
    flex: 1;
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .error-alert {
    position: fixed;
    top: 80px;
    right: 24px;
    max-width: 400px;
    z-index: 1000;
  }

  .global-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: white;
  }
</style>
```

##### 1.2 需求表单区块

**文件**：`src/views/document-generation/topic-selection/components/RequirementsFormSection.vue`

```vue
<template>
  <el-card class="requirements-form-section">
    <template #header>
      <div class="section-header">
        <el-icon><Document /></el-icon>
        <span>需求定义</span>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="localRequirements"
      :rules="validationRules"
      label-width="120px"
      label-position="left"
    >
      <!-- 主题 -->
      <el-form-item label="文档主题" prop="topic">
        <el-input
          v-model="localRequirements.topic"
          type="textarea"
          :rows="3"
          placeholder="请输入文档的主要主题或标题..."
          @input="handleUpdate"
        />
      </el-form-item>

      <!-- 关键要点 -->
      <el-form-item label="关键要点" prop="keyPoints">
        <div class="key-points-input">
          <el-tag
            v-for="(point, index) in localRequirements.keyPoints"
            :key="index"
            closable
            @close="removeKeyPoint(index)"
          >
            {{ point }}
          </el-tag>
          <el-input
            v-if="inputVisible"
            ref="inputRef"
            v-model="inputValue"
            class="input-new-tag"
            size="small"
            @keyup.enter="handleInputConfirm"
            @blur="handleInputConfirm"
          />
          <el-button v-else size="small" @click="showInput"> + 添加要点 </el-button>
        </div>
      </el-form-item>

      <!-- 目标受众 -->
      <el-form-item label="目标受众">
        <el-select
          v-model="localRequirements.targetAudience"
          placeholder="请选择目标受众"
          @change="handleUpdate"
        >
          <el-option label="专业人士" value="professionals" />
          <el-option label="普通大众" value="general-public" />
          <el-option label="学术研究者" value="researchers" />
          <el-option label="企业决策者" value="decision-makers" />
        </el-select>
      </el-form-item>

      <!-- 文档类型 -->
      <el-form-item label="文档类型">
        <el-radio-group v-model="localRequirements.documentType" @change="handleUpdate">
          <el-radio label="article">学术论文</el-radio>
          <el-radio label="report">研究报告</el-radio>
          <el-radio label="proposal">项目提案</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 特殊要求 -->
      <el-form-item label="特殊要求">
        <el-input
          v-model="localRequirements.specialRequirements"
          type="textarea"
          :rows="3"
          placeholder="请输入任何特殊要求或约束条件..."
          @input="handleUpdate"
        />
      </el-form-item>
    </el-form>

    <el-divider />

    <!-- 操作按钮 -->
    <div class="section-actions">
      <el-button type="primary" :loading="isLoading" :disabled="!isFormValid" @click="handleNext">
        生成研究简报
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
  // ===== Props =====
  interface Props {
    requirements: Ref<RequirementsForm>
    error: Ref<string | null>
    isLoading: Ref<boolean>
  }

  const props = defineProps<Props>()

  // ===== Emits =====
  interface Emits {
    (e: 'update', requirements: Partial<RequirementsForm>): void
    (e: 'next'): void
  }

  const emit = defineEmits<Emits>()

  // ===== 本地状态 =====
  const localRequirements = ref<RequirementsForm>({
    topic: '',
    keyPoints: [],
    specialRequirements: '',
    targetAudience: '',
    documentType: 'article'
  })

  // 监听外部 requirements 变化
  watch(
    () => props.requirements.value,
    (newRequirements) => {
      localRequirements.value = { ...newRequirements }
    },
    { immediate: true, deep: true }
  )

  // ===== 关键要点标签输入 =====
  const inputVisible = ref(false)
  const inputValue = ref('')
  const inputRef = ref<HTMLElement>()

  const showInput = () => {
    inputVisible.value = true
    nextTick(() => {
      inputRef.value?.focus()
    })
  }

  const handleInputConfirm = () => {
    if (inputValue.value && !localRequirements.value.keyPoints.includes(inputValue.value)) {
      localRequirements.value.keyPoints.push(inputValue.value)
      emit('update', { keyPoints: localRequirements.value.keyPoints })
    }
    inputVisible.value = false
    inputValue.value = ''
  }

  const removeKeyPoint = (index: number) => {
    localRequirements.value.keyPoints.splice(index, 1)
    emit('update', { keyPoints: localRequirements.value.keyPoints })
  }

  // ===== 表单验证 =====
  const formRef = ref<FormInstance>()
  const validationRules = {
    topic: [
      { required: true, message: '请输入文档主题', trigger: 'blur' },
      { min: 5, message: '主题至少5个字符', trigger: 'blur' }
    ]
  }

  const isFormValid = computed(() => {
    return localRequirements.value.topic.trim().length >= 5
  })

  // ===== 事件处理 =====
  const handleUpdate = () => {
    emit('update', { ...localRequirements.value })
  }

  const handleNext = () => {
    if (isFormValid.value) {
      emit('next')
    }
  }
</script>

<style scoped>
  .requirements-form-section {
    max-width: 800px;
    margin: 0 auto;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
  }

  .key-points-input {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .input-new-tag {
    width: 120px;
  }

  .section-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
</style>
```

##### 1.3 研究简报区块

**文件**：`src/views/document-generation/topic-selection/components/ResearchBriefSection.vue`

```vue
<template>
  <el-card class="research-brief-section">
    <template #header>
      <div class="section-header">
        <el-icon><Reading /></el-icon>
        <span>研究简报</span>
        <el-tag v-if="brief" type="success" size="small">已完成</el-tag>
      </div>
    </template>

    <!-- 简报内容 -->
    <div v-if="brief" class="brief-content">
      <!-- 项目目标 -->
      <div class="brief-section">
        <h3>
          <el-icon><Target /></el-icon>
          项目目标
        </h3>
        <ul class="objectives-list">
          <li v-for="(objective, index) in brief.core_objectives" :key="index">
            <div class="objective-item">
              <span class="objective-text">{{ objective.objective }}</span>
              <el-tag size="small" :type="getPriorityType(objective.priority)">
                {{ objective.priority }}
              </el-tag>
            </div>
            <div class="measurable-outcomes">
              <small>预期成果：</small>
              <ul>
                <li v-for="outcome in objective.measurable_outcomes" :key="outcome">
                  {{ outcome }}
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>

      <!-- 范围边界 -->
      <el-divider content-position="left">范围边界</el-divider>

      <div class="scope-section">
        <div class="scope-column">
          <h4 class="in-scope">
            <el-icon><Check /></el-icon>
            包含范围
          </h4>
          <el-tag
            v-for="item in brief.scope_boundaries.in_scope"
            :key="item"
            type="success"
            class="scope-tag"
          >
            {{ item }}
          </el-tag>
        </div>

        <div class="scope-column">
          <h4 class="out-scope">
            <el-icon><Close /></el-icon>
            排除范围
          </h4>
          <el-tag
            v-for="item in brief.scope_boundaries.out_of_scope"
            :key="item"
            type="info"
            class="scope-tag"
          >
            {{ item }}
          </el-tag>
        </div>
      </div>

      <!-- 交付物 -->
      <el-divider content-position="left">主要交付物</el-divider>

      <div class="deliverables-list">
        <el-card
          v-for="deliverable in brief.deliverables"
          :key="deliverable.name"
          class="deliverable-card"
          shadow="hover"
        >
          <div class="deliverable-header">
            <h4>{{ deliverable.name }}</h4>
            <el-tag size="small">{{ deliverable.estimated_effort }}</el-tag>
          </div>
          <p class="deliverable-desc">{{ deliverable.description }}</p>
          <div class="acceptance-criteria">
            <small>验收标准：</small>
            <ul>
              <li v-for="criteria in deliverable.acceptance_criteria" :key="criteria">
                {{ criteria }}
              </li>
            </ul>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 加载状态 -->
    <el-skeleton v-else-if="isLoading" animated>
      <template #template>
        <el-skeleton-item variant="h3" style="width: 50%" />
        <el-skeleton-item variant="text" style="width: 100%" />
        <el-skeleton-item variant="text" style="width: 100%" />
        <el-skeleton-item variant="text" style="width: 60%" />
      </template>
    </el-skeleton>

    <!-- 空状态 -->
    <el-empty v-else description="尚未生成研究简报" />

    <el-divider />

    <!-- 操作按钮 -->
    <div class="section-actions">
      <el-button @click="$emit('prev')">
        <el-icon><ArrowLeft /></el-icon>
        上一步
      </el-button>
      <el-button :loading="isLoading" @click="$emit('edit')">
        <el-icon><Edit /></el-icon>
        编辑
      </el-button>
      <el-button :loading="isLoading" @click="$emit('regenerate')">
        <el-icon><Refresh /></el-icon>
        重新生成
      </el-button>
      <el-button type="primary" :disabled="!brief || isLoading" @click="$emit('next')">
        下一步：生成标题
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
  // ===== Props =====
  interface Props {
    brief: Ref<ResearchBrief | null>
    error: Ref<string | null>
    isLoading: Ref<boolean>
  }

  const props = defineProps<Props>()

  // ===== Emits =====
  interface Emits {
    (e: 'edit'): void
    (e: 'regenerate'): void
    (e: 'next'): void
    (e: 'prev'): void
  }

  const emit = defineEmits<Emits>()

  // ===== 方法 =====
  const getPriorityType = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger'
      case 'medium':
        return 'warning'
      case 'low':
        return 'info'
      default:
        return ''
    }
  }
</script>

<style scoped>
  .research-brief-section {
    max-width: 1000px;
    margin: 0 auto;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
  }

  .brief-content {
    margin-top: 16px;
  }

  .brief-section {
    margin-bottom: 24px;
  }

  .brief-section h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 16px;
    color: var(--el-color-primary);
  }

  .objectives-list {
    list-style: none;
    padding: 0;
  }

  .objective-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 12px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }

  .objective-text {
    flex: 1;
    font-weight: 500;
  }

  .measurable-outcomes {
    margin-top: 8px;
    margin-left: 24px;
    color: var(--el-text-color-secondary);
  }

  .scope-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .scope-column h4 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    font-size: 14px;
  }

  .scope-tag {
    margin: 4px;
  }

  .deliverables-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  .deliverable-card {
    border: 1px solid var(--el-border-color);
  }

  .deliverable-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .deliverable-desc {
    color: var(--el-text-color-regular);
    margin-bottom: 12px;
  }

  .acceptance-criteria {
    color: var(--el-text-color-secondary);
  }

  .section-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
  }
</style>
```

#### 2. Outline 页面

##### 2.1 主页面组件

**文件**：`src/views/document-generation/outline/OutlineEditorView.vue`

```vue
<template>
  <div class="outline-editor-view">
    <!-- 顶部操作栏 -->
    <OutlineEditorHeader
      :outline="outlinePage.outline"
      :is-generating="outlinePage.isGenerating"
      :has-unsaved-changes="hasUnsavedChanges"
      @generate="handleGenerateOutline"
      @save="handleSaveOutline"
      @export="handleExportOutline"
      @reset="handleReset"
    />

    <!-- 主要内容 -->
    <div class="outline-editor-content">
      <!-- 左侧：大纲结构 -->
      <div class="outline-structure">
        <el-card>
          <template #header>
            <div class="panel-header">
              <el-icon><List /></el-icon>
              <span>大纲结构</span>
              <el-button size="small" type="primary" @click="handleAddSection">
                <el-icon><Plus /></el-icon>
                添加章节
              </el-button>
            </div>
          </template>

          <OutlineStructureTree
            :sections="outlinePage.sections"
            :active-section-id="activeSectionId"
            @select="handleSelectSection"
            @edit="handleEditSection"
            @delete="handleDeleteSection"
            @move="handleMoveSection"
            @reorder="handleReorderSections"
          />
        </el-card>
      </div>

      <!-- 右侧：编辑区 -->
      <div class="outline-editor">
        <el-card v-if="activeSection">
          <template #header>
            <div class="panel-header">
              <el-icon><Edit /></el-icon>
              <span>编辑章节</span>
            </div>
          </template>

          <SectionEditor
            :section="activeSection"
            :materials="outlinePage.selectedMaterials"
            :binding-results="outlinePage.aiBindingResults"
            @update="handleUpdateSection"
            @bind-material="handleBindMaterial"
          />
        </el-card>

        <el-empty v-else description="请选择要编辑的章节" />
      </div>

      <!-- 右侧：素材面板 -->
      <div class="material-panel">
        <el-card>
          <template #header>
            <div class="panel-header">
              <el-icon><Folder /></el-icon>
              <span>素材库</span>
            </div>
          </template>

          <MaterialSelectionPanel
            :selected-materials="outlinePage.selectedMaterials"
            :is-binding="outlinePage.isBinding"
            @select="handleSelectMaterial"
            @deselect="handleDeselectMaterial"
            @bind-ai="handleAIBindMaterials"
          />
        </el-card>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <OutlineEditorStatusBar
      :sections-count="outlinePage.sections.length"
      :materials-count="outlinePage.selectedMaterials.length"
      :last-saved="lastSavedAt"
    />

    <!-- 错误提示 -->
    <el-alert
      v-if="outlinePage.error"
      :title="outlinePage.error"
      type="error"
      show-icon
      closable
      @close="outlinePage.clearError()"
      class="error-alert"
    />
  </div>
</template>

<script setup lang="ts">
  // ===== 导入 Composable =====
  const outlinePage = useOutlinePage()
  const outlineEditing = useOutlineEditing()
  const materialSelection = useMaterialSelection()
  const materialBinding = useMaterialBinding()

  // ===== 本地状态 =====
  const activeSectionId = ref<string | null>(null)
  const hasUnsavedChanges = ref(false)
  const lastSavedAt = ref<Date | null>(null)

  const activeSection = computed(() => {
    if (!activeSectionId.value) return null
    return outlinePage.sections.value.find((s) => s.id === activeSectionId.value)
  })

  // ===== 事件处理 =====

  /**
   * 生成大纲
   */
  const handleGenerateOutline = async () => {
    try {
      const title = outlinePage.outline.value?.title || '未命名大纲'
      await outlinePage.generateOutlineWithMaterials(title, outlinePage.selectedMaterials.value)
      ElMessage.success('大纲生成成功')
    } catch (error) {
      console.error('生成大纲失败:', error)
    }
  }

  /**
   * 保存大纲
   */
  const handleSaveOutline = async () => {
    try {
      await outlinePage.saveOutline()
      hasUnsavedChanges.value = false
      lastSavedAt.value = new Date()
      ElMessage.success('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  /**
   * 导出大纲
   */
  const handleExportOutline = async (format: 'json' | 'markdown' | 'pdf') => {
    try {
      const downloadUrl = await outlinePage.exportOutline(format)
      // 触发下载
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `outline.${format}`
      link.click()
      ElMessage.success('导出成功')
    } catch (error) {
      console.error('导出失败:', error)
    }
  }

  /**
   * 重置
   */
  const handleReset = () => {
    ElMessageBox.confirm('确定要重置所有内容吗？', '提示', {
      type: 'warning'
    })
      .then(() => {
        outlinePage.reset()
        activeSectionId.value = null
        hasUnsavedChanges.value = false
      })
      .catch(() => {})
  }

  /**
   * 选择章节
   */
  const handleSelectSection = (sectionId: string) => {
    activeSectionId.value = sectionId
  }

  /**
   * 编辑章节
   */
  const handleEditSection = (sectionId: string) => {
    activeSectionId.value = sectionId
    outlineEditing.startEditing(sectionId)
  }

  /**
   * 删除章节
   */
  const handleDeleteSection = async (sectionId: string) => {
    try {
      await outlineEditing.deleteSection(sectionId)
      if (activeSectionId.value === sectionId) {
        activeSectionId.value = null
      }
      hasUnsavedChanges.value = true
    } catch (error) {
      console.error('删除章节失败:', error)
    }
  }

  /**
   * 移动章节
   */
  const handleMoveSection = async (
    sectionId: string,
    newParentId: string | null,
    newPosition: number
  ) => {
    try {
      await outlineEditing.moveSection(sectionId, newParentId, newPosition)
      hasUnsavedChanges.value = true
    } catch (error) {
      console.error('移动章节失败:', error)
    }
  }

  /**
   * 重新排序章节
   */
  const handleReorderSections = async (sectionIds: string[]) => {
    try {
      outlineEditing.reorderSections(sectionIds)
      hasUnsavedChanges.value = true
    } catch (error) {
      console.error('重新排序失败:', error)
    }
  }

  /**
   * 添加章节
   */
  const handleAddSection = async () => {
    try {
      const newSection = await outlineEditing.addSection(null, 0)
      activeSectionId.value = newSection.id
      hasUnsavedChanges.value = true
    } catch (error) {
      console.error('添加章节失败:', error)
    }
  }

  /**
   * 更新章节
   */
  const handleUpdateSection = async (sectionId: string, updates: Partial<Section>) => {
    try {
      await outlinePage.updateSection(sectionId, updates)
      hasUnsavedChanges.value = true
    } catch (error) {
      console.error('更新章节失败:', error)
    }
  }

  /**
   * 选择素材
   */
  const handleSelectMaterial = (material: Material) => {
    materialSelection.selectMaterial(material)
  }

  /**
   * 取消选择素材
   */
  const handleDeselectMaterial = (material: Material) => {
    materialSelection.deselectMaterial(material)
  }

  /**
   * AI 绑定素材
   */
  const handleAIBindMaterials = async (sectionId: string) => {
    try {
      await outlinePage.bindMaterialsWithAI(sectionId, outlinePage.selectedMaterials.value)
      ElMessage.success('AI绑定完成')
    } catch (error) {
      console.error('AI绑定失败:', error)
    }
  }
</script>

<style scoped>
  .outline-editor-view {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-color);
  }

  .outline-editor-content {
    flex: 1;
    display: grid;
    grid-template-columns: 300px 1fr 350px;
    gap: 16px;
    padding: 16px;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  .error-alert {
    position: fixed;
    top: 80px;
    right: 24px;
    max-width: 400px;
    z-index: 1000;
  }
</style>
```

##### 2.2 大纲结构树组件

**文件**：`src/views/document-generation/outline/components/OutlineStructureTree.vue`

```vue
<template>
  <div class="outline-structure-tree">
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      :expand-on-click-node="false"
      :default-expand-all="false"
      node-key="id"
      :highlight-current="true"
      @node-click="handleNodeClick"
    >
      <!-- 自定义节点内容 -->
      <template #default="{ node, data }">
        <div
          class="tree-node"
          :class="{ active: data.id === activeSectionId }"
          @click="handleNodeClick(data)"
        >
          <!-- 章节标题 -->
          <span class="node-title">
            <el-icon v-if="data.level === 1"><FolderOpened /></el-icon>
            <el-icon v-else><Document /></el-icon>
            {{ data.title }}
          </span>

          <!-- 操作按钮 -->
          <div class="node-actions" @click.stop>
            <el-dropdown @command="(command) => handleCommand(command, data)">
              <el-icon class="action-icon">
                <More />
              </el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="add-child">
                    <el-icon><Plus /></el-icon>
                    添加子章节
                  </el-dropdown-item>
                  <el-dropdown-item command="duplicate">
                    <el-icon><CopyDocument /></el-icon>
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>
    </el-tree>

    <!-- 拖拽提示 -->
    <div v-if="dragging" class="drag-hint">
      <el-icon><Position /></el-icon>
      拖拽到目标位置释放
    </div>
  </div>
</template>

<script setup lang="ts">
  // ===== Props =====
  interface Props {
    sections: Ref<Section[]>
    activeSectionId: Ref<string | null>
  }

  const props = defineProps<Props>()

  // ===== Emits =====
  interface Emits {
    (e: 'select', sectionId: string): void
    (e: 'edit', sectionId: string): void
    (e: 'delete', sectionId: string): void
    (e: 'move', sectionId: string, newParentId: string | null, newPosition: number): void
    (e: 'reorder', sectionIds: string[]): void
  }

  const emit = defineEmits<Emits>()

  // ===== 响应式数据 =====
  const treeRef = ref<InstanceType<typeof ElTree>>()
  const dragging = ref(false)

  const treeProps = {
    children: 'children',
    label: 'title'
  }

  // 转换为树形数据
  const treeData = computed(() => {
    const sections = props.sections.value
    const nodeMap = new Map<string, any>()

    // 创建节点映射
    sections.forEach((section) => {
      nodeMap.set(section.id, {
        ...section,
        children: []
      })
    })

    // 构建树形结构
    const roots: any[] = []
    sections.forEach((section) => {
      const node = nodeMap.get(section.id)
      if (section.parentId) {
        const parent = nodeMap.get(section.parentId)
        if (parent) {
          parent.children.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  })

  // ===== 事件处理 =====
  const handleNodeClick = (data: Section) => {
    emit('select', data.id)
  }

  const handleCommand = (command: string, data: Section) => {
    switch (command) {
      case 'edit':
        emit('edit', data.id)
        break
      case 'add-child':
        // 添加子章节逻辑
        break
      case 'duplicate':
        // 复制章节逻辑
        break
      case 'delete':
        ElMessageBox.confirm(`确定要删除章节"${data.title}"吗？`, '提示', { type: 'warning' })
          .then(() => {
            emit('delete', data.id)
          })
          .catch(() => {})
        break
    }
  }
</script>

<style scoped>
  .outline-structure-tree {
    position: relative;
  }

  .tree-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 4px;
    transition: background-color 0.2s;
    width: 100%;
  }

  .tree-node:hover {
    background-color: var(--el-fill-color-light);
  }

  .tree-node.active {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  .node-title {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-actions {
    opacity: 0;
    transition: opacity 0.2s;
  }

  .tree-node:hover .node-actions {
    opacity: 1;
  }

  .action-icon {
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .action-icon:hover {
    background-color: var(--el-fill-color);
  }

  .drag-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--el-color-primary);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: var(--el-box-shadow);
    z-index: 1000;
  }
</style>
```

#### 3. Content 页面

##### 3.1 主页面组件

**文件**：`src/views/document-generation/content/ContentEditorView.vue`

```vue
<template>
  <div class="content-editor-view">
    <!-- 顶部操作栏 -->
    <ContentEditorHeader
      :document-title="documentTitle"
      :word-count="content.wordCount"
      :last-saved="content.lastSavedAt"
      :has-unsaved-changes="content.hasUnsavedChanges"
      :is-saving="content.isSaving"
      @save="content.saveContent"
      @export="handleExport"
      @ai-operate="handleAIOperate"
    />

    <!-- 主要内容 -->
    <div class="content-editor-content">
      <!-- 左侧：大纲面板 -->
      <div class="outline-panel">
        <ContentOutlinePanel
          :outline="content.outline"
          :current-position="editorStore.cursorPosition"
          @navigate="handleNavigateTo"
        />
      </div>

      <!-- 中间：编辑区 -->
      <div class="editor-panel">
        <MarkdownEditor
          v-model="editorContent"
          :config="editorStore.editorConfig"
          :read-only="false"
          @update="handleContentUpdate"
          @selection-change="handleSelectionChange"
        />

        <!-- AI 操作对话框 -->
        <AIOperationDialog
          v-model:visible="aiDialogVisible"
          :operation-type="currentAIOperation"
          :selected-text="selectedText"
          @confirm="handleAIConfirm"
        />
      </div>

      <!-- 右侧：统计面板 -->
      <div class="stats-panel">
        <ContentStatsPanel
          :word-count="content.wordCount"
          :character-count="content.characterCount"
          :stats="contentStats.stats"
          :readability-score="contentStats.readabilityScore"
          :quality-score="contentStats.qualityScore"
          @recalculate="handleRecalculateStats"
        />
      </div>
    </div>

    <!-- 底部状态栏 -->
    <ContentEditorStatusBar
      :cursor-position="editorStore.cursorPosition"
      :selection="editorStore.selection"
      :word-count="content.wordCount"
      :last-saved="content.lastSavedAt"
    />
  </div>
</template>

<script setup lang="ts">
  // ===== 导入 Composable =====
  const content = useContent()
  const contentStats = useContentStats()
  const contentAI = useContentAI()
  const documentSync = useDocumentSync()
  const editorStore = useEditorStore()

  // ===== 本地状态 =====
  const documentTitle = computed(() => {
    return content.outline.value?.title || '无标题文档'
  })

  const editorContent = computed({
    get: () => editorStore.content.value,
    set: (value) => content.updateContent(value)
  })

  const selectedText = computed(() => editorStore.selectedText.value)

  const aiDialogVisible = ref(false)
  const currentAIOperation = ref<AiOperationType>('polish')

  // ===== 事件处理 =====

  /**
   * 内容更新
   */
  const handleContentUpdate = (newContent: string) => {
    content.updateContent(newContent)
  }

  /**
   * 选择变化
   */
  const handleSelectionChange = (selection: { start: number; end: number }) => {
    editorStore.setSelection(selection.start, selection.end)
  }

  /**
   * 导出文档
   */
  const handleExport = async (format: 'markdown' | 'pdf' | 'docx') => {
    try {
      const downloadUrl = await content.exportContent(format)
      // 触发下载
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${documentTitle.value}.${format}`
      link.click()
      ElMessage.success('导出成功')
    } catch (error) {
      console.error('导出失败:', error)
      ElMessage.error('导出失败，请重试')
    }
  }

  /**
   * AI 操作
   */
  const handleAIOperate = (operation: AiOperationType) => {
    currentAIOperation.value = operation
    if (!selectedText.value) {
      ElMessage.warning('请先选择要操作的内容')
      return
    }
    aiDialogVisible.value = true
  }

  /**
   * AI 操作确认
   */
  const handleAIConfirm = async (params: any) => {
    try {
      let result = ''
      const text = selectedText.value

      switch (currentAIOperation.value) {
        case 'polish':
          result = await contentAI.polishContent(text)
          break
        case 'expand':
          result = await contentAI.expandContent(text, params.targetLength)
          break
        case 'summarize':
          result = await contentAI.summarizeContent(text)
          break
        case 'translate':
          result = await contentAI.translateContent(text, params.targetLanguage)
          break
        case 'rewrite':
          result = await contentAI.rewriteContent(text, params.style)
          break
      }

      // 替换选中的文本
      const currentContent = editorStore.content.value
      const { start, end } = editorStore.selection.value!
      const newContent = currentContent.substring(0, start) + result + currentContent.substring(end)

      content.updateContent(newContent)

      aiDialogVisible.value = false
      ElMessage.success('AI 操作完成')
    } catch (error) {
      console.error('AI 操作失败:', error)
      ElMessage.error('AI 操作失败，请重试')
    }
  }

  /**
   * 导航到指定位置
   */
  const handleNavigateTo = (position: number) => {
    editorStore.setCursorPosition(position)
  }

  /**
   * 重新计算统计信息
   */
  const handleRecalculateStats = async () => {
    try {
      await contentStats.calculateStats(editorStore.content.value)
      ElMessage.success('统计信息已更新')
    } catch (error) {
      console.error('计算统计信息失败:', error)
      ElMessage.error('计算统计信息失败')
    }
  }
</script>

<style scoped>
  .content-editor-view {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-color);
  }

  .content-editor-content {
    flex: 1;
    display: grid;
    grid-template-columns: 250px 1fr 300px;
    gap: 16px;
    padding: 16px;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
  }
</style>
```

## 重构实施步骤

### 第一阶段：创建新组件（2天）

1. 创建纯 UI 展示组件
2. 定义清晰的 Props 和 Events
3. 移除所有业务逻辑

### 第二阶段：迁移现有页面（2天）

1. 逐步重构现有页面组件
2. 保持 UI 交互逻辑
3. 验证功能完整性

### 第三阶段：清理和优化（1天）

1. 删除旧组件
2. 优化组件性能
3. 完善组件文档

## 测试策略

### 组件测试

```typescript
import { mount } from '@vue/test-utils'
import RequirementsFormSection from '@/views/document-generation/topic-selection/components/RequirementsFormSection.vue'

describe('RequirementsFormSection', () => {
  it('应该正确显示表单', () => {
    const wrapper = mount(RequirementsFormSection, {
      props: {
        requirements: ref({
          topic: '',
          keyPoints: [],
          specialRequirements: '',
          targetAudience: '',
          documentType: 'article'
        }),
        error: ref(null),
        isLoading: ref(false)
      }
    })

    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('应该触发更新事件', async () => {
    const wrapper = mount(RequirementsFormSection, {
      props: {
        requirements: ref({
          topic: '',
          keyPoints: [],
          specialRequirements: '',
          targetAudience: '',
          documentType: 'article'
        }),
        error: ref(null),
        isLoading: ref(false)
      }
    })

    await wrapper.find('textarea').setValue('测试主题')
    expect(wrapper.emitted('update')).toBeTruthy()
  })
})
```

### 页面测试

```typescript
import { mount } from '@vue/test-utils'
import TopicSelectionView from '@/views/document-generation/topic-selection/TopicSelectionView.vue'

describe('TopicSelectionView', () => {
  it('应该正确渲染步骤内容', () => {
    const wrapper = mount(TopicSelectionView)
    expect(wrapper.find('.topic-selection-view').exists()).toBe(true)
  })
})
```

## 性能优化

### 1. 组件懒加载

```typescript
// 路由懒加载
const TopicSelectionView = () =>
  import('@/views/document-generation/topic-selection/TopicSelectionView.vue')
```

### 2. 虚拟滚动

```vue
<template>
  <el-table-v2 :columns="columns" :data="largeData" :height="400" fixed />
</template>
```

### 3. 组件缓存

```typescript
// 使用 KeepAlive 缓存组件
<router-view v-slot="{ Component }">
  <KeepAlive include="TopicSelectionView">
    <component :is="Component" />
  </KeepAlive>
</router-view>
```

## 验收标准

### 功能验收

- [ ] 所有组件仅负责 UI 展示
- [ ] 无业务逻辑和 API 调用
- [ ] 事件正确传递给 Composable

### 代码质量

- [ ] 组件行数 < 300 行
- [ ] 测试覆盖率 > 90%
- [ ] 通过 ESLint 检查

### 性能验收

- [ ] 组件渲染时间 < 100ms
- [ ] 无不必要的重渲染
- [ ] 内存使用优化

## 风险与应对

### 高风险

1. **交互逻辑丢失**

   - 风险：重构过程中交互逻辑丢失
   - 应对：详细测试，逐步迁移

2. **UI 样式错乱**
   - 风险：样式在重构过程中错乱
   - 应对：保持样式独立，逐步调整

### 中风险

1. **组件拆分过度**
   - 风险：过度拆分导致组件碎片化
   - 应对：合理控制组件粒度

## 后续优化

### 短期（1周内）

1. 优化组件性能
2. 完善组件测试
3. 添加组件文档

### 中期（1个月内）

1. 建立组件库
2. 添加组件故事文档
3. 建立设计系统

### 长期（3个月内）

1. 可视化组件配置
2. 自动化组件生成
3. 组件性能监控
