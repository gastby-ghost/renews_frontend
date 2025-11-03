<template>
  <div class="outline-container">
    <ArtTableHeader title="大纲编辑" :actions="headerActions" @back="goBack" />

    <!-- 项目加载提示 -->
    <div
      v-if="loadingProject || (!projectStore.currentProject && projectId)"
      class="project-loading"
    >
      <el-empty :description="loadingProject ? '正在加载项目信息...' : '项目信息加载失败'" />
    </div>

    <div v-else class="main-content">
      <StepIndicator :steps="stepList" />

      <!-- 素材分区 -->
      <div class="materials-section">
        <div class="materials-header" @click="materialsCollapsed = !materialsCollapsed">
          <div class="materials-title">
            <h3>素材管理</h3>
            <p class="materials-subtitle">选择素材用于大纲生成和绑定</p>
          </div>
          <div class="materials-controls">
            <el-tag :type="selectedMaterials.length > 0 ? 'success' : 'info'" size="large">
              已选择 {{ selectedMaterials.length }} 个素材
            </el-tag>
            <el-button :icon="materialsCollapsed ? 'ArrowDown' : 'ArrowUp'" link>
              {{ materialsCollapsed ? '展开' : '收起' }}
            </el-button>
          </div>
        </div>

        <el-collapse-transition>
          <div v-show="!materialsCollapsed" class="materials-content">
            <!-- 生成模式切换 -->
            <div class="generation-mode">
              <div class="mode-selector">
                <el-radio-group v-model="generationMode" size="large">
                  <el-radio-button value="title">
                    <el-icon><Document /></el-icon>
                    基于标题生成
                  </el-radio-button>
                  <el-radio-button value="material">
                    <el-icon><Folder /></el-icon>
                    基于素材生成
                  </el-radio-button>
                </el-radio-group>
              </div>
              <div class="mode-description">
                <p v-if="generationMode === 'title'">
                  根据已选择的标题和研究简报，AI自动生成可能的大纲结构
                </p>
                <p v-else> 根据已选择的素材内容，为每个素材分配对应的章节 </p>
              </div>
            </div>

            <!-- 素材选择区域 -->
            <div class="materials-selection">
              <div class="materials-list">
                <div class="materials-list-header">
                  <h4>选择素材（用于大纲生成和后续绑定）</h4>
                  <div class="materials-actions">
                    <el-button
                      v-if="selectedMaterials.length > 0"
                      @click="selectedMaterials = []"
                      size="small"
                      link
                      type="danger"
                    >
                      清空选择
                    </el-button>
                  </div>
                </div>

                <!-- 模拟素材数据，实际项目中从store或API获取 -->
                <div v-if="selectedMaterials.length === 0" class="empty-materials">
                  <el-empty description="暂无选中的素材">
                    <template #image>
                      <el-icon :size="60"><FolderOpened /></el-icon>
                    </template>
                    <div class="empty-materials-actions">
                      <p>从素材库选择素材，或手动添加章节</p>
                      <el-button type="primary" @click="openMaterialLibrary">
                        <el-icon><FolderOpened /></el-icon>
                        从素材库选择
                      </el-button>
                    </div>
                  </el-empty>
                </div>

                <div v-else class="materials-grid">
                  <UnifiedMaterialCard
                    v-for="material in selectedMaterials"
                    :key="material.id"
                    :material="material"
                    :selected="true"
                    :showSelection="true"
                    :showScore="true"
                    context="management"
                    @select="toggleMaterialSelection"
                    @preview="(m) => console.log('预览素材:', m)"
                  />
                </div>
              </div>
            </div>

            <!-- 素材绑定区域（大纲生成后显示） -->
            <div
              v-if="outlineGeneration.state.generatedOutline.length > 0"
              class="material-binding"
            >
              <div class="binding-header">
                <h4>
                  <el-icon><Link /></el-icon>
                  素材绑定
                </h4>
                <p>将素材绑定到对应章节，便于后续生成内容</p>
              </div>

              <div class="binding-grid">
                <div
                  v-for="(section, sectionIndex) in outlineGeneration.state.generatedOutline"
                  :key="section.title"
                  class="binding-section"
                >
                  <div class="section-title">
                    <span class="section-number">{{ sectionIndex + 1 }}</span>
                    <h5>{{ section.title }}</h5>
                  </div>

                  <div class="bound-materials">
                    <el-tag
                      v-for="materialTitle in section.data_requirements"
                      :key="materialTitle"
                      closable
                      @close="() => unbindMaterialFromSection(sectionIndex, materialTitle)"
                      type="primary"
                    >
                      {{ materialTitle }}
                    </el-tag>
                    <el-tag v-if="section.data_requirements.length === 0" type="info" plain>
                      未绑定素材
                    </el-tag>
                  </div>

                  <el-dropdown v-if="selectedMaterials.length > 0" trigger="click">
                    <el-button size="small" type="primary" plain>
                      <el-icon><Plus /></el-icon>
                      绑定素材
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item
                          v-for="material in selectedMaterials.filter(
                            (m) => !section.data_requirements.includes(m.title)
                          )"
                          :key="material.id"
                          @click="bindMaterialToSection(sectionIndex, material)"
                        >
                          <el-icon><Document /></el-icon>
                          {{ material.title }}
                        </el-dropdown-item>
                        <el-dropdown-item
                          v-if="
                            selectedMaterials.every((m) =>
                              section.data_requirements.includes(m.title)
                            )
                          "
                          disabled
                        >
                          所有素材已绑定
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-transition>
      </div>

      <div class="outline-content">
        <div class="outline-header">
          <div class="selected-title">
            <h3>{{ selectedTitle }}</h3>
            <p class="title-description">{{ titleDescription }}</p>
          </div>
          <div class="outline-actions">
            <el-button
              @click="generateAIOutline"
              :loading="generatingOutline"
              :disabled="
                (generationMode === 'title' && !canGenerateFromTitle) ||
                (generationMode === 'material' && !canGenerateFromMaterials)
              "
              type="primary"
            >
              <el-icon><MagicStick /></el-icon>
              AI生成大纲
              <el-tag
                v-if="generationMode === 'material'"
                size="small"
                type="warning"
                effect="plain"
                style="margin-left: 8px"
              >
                素材模式
              </el-tag>
            </el-button>
            <el-button @click="addSection" :disabled="!canAddSection">
              <el-icon><Plus /></el-icon>
              添加章节
            </el-button>
            <el-button
              @click="clearOutline"
              :disabled="outlineGeneration.state.generatedOutline.length === 0"
              type="danger"
              plain
            >
              <el-icon><Delete /></el-icon>
              清空大纲
            </el-button>
          </div>
        </div>

        <div class="outline-editor">
          <div v-if="outlineGeneration.state.generatedOutline.length === 0" class="empty-outline">
            <div class="empty-icon">📝</div>
            <h4>大纲为空</h4>
            <p>点击"AI生成大纲"让AI为您创建内容大纲，或手动添加章节</p>
          </div>

          <div v-else class="outline-tree">
            <div
              v-for="(section, sectionIndex) in outlineGeneration.state.generatedOutline"
              :key="section.title"
              class="outline-section"
            >
              <div class="section-header">
                <div class="section-info">
                  <span class="section-number">{{ sectionIndex + 1 }}</span>
                  <input
                    v-model="section.title"
                    class="section-title-input"
                    placeholder="章节标题"
                    @blur="outlineGeneration.editSection(section.title, { title: section.title })"
                  />
                </div>
                <div class="section-controls">
                  <el-button
                    @click="moveSectionUp(sectionIndex)"
                    size="small"
                    link
                    :disabled="sectionIndex === 0"
                  >
                    上移
                  </el-button>
                  <el-button
                    @click="moveSectionDown(sectionIndex)"
                    size="small"
                    link
                    :disabled="sectionIndex === outlineGeneration.state.generatedOutline.length - 1"
                  >
                    下移
                  </el-button>
                  <el-button @click="deleteSection(sectionIndex)" size="small" type="danger" link>
                    删除
                  </el-button>
                </div>
              </div>

              <div class="section-content">
                <div class="content-direction">
                  <label>内容方向：</label>
                  <textarea
                    v-model="section.content_direction"
                    class="content-direction-textarea"
                    placeholder="请输入内容方向和写作要点"
                    @blur="
                      outlineGeneration.editSection(section.title, {
                        content_direction: section.content_direction
                      })
                    "
                  />
                </div>
                <div class="data-requirements">
                  <label>数据需求：</label>
                  <el-tag
                    v-for="req in section.data_requirements"
                    :key="req"
                    size="small"
                    effect="plain"
                  >
                    {{ req }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="outline-actions-bottom">
          <el-button @click="goBack" size="large">返回标题</el-button>
          <el-button
            type="success"
            size="large"
            @click="confirmOutline"
            :disabled="outlineGeneration.state.generatedOutline.length === 0"
          >
            确认大纲并继续
          </el-button>
        </div>
      </div>
    </div>

    <!-- 素材库选择对话框 -->
    <MaterialLibraryDialog
      :visible="showMaterialLibraryDialog"
      @update:visible="showMaterialLibraryDialog = $event"
      @confirm="handleMaterialLibraryConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { useOutlineGeneration } from '@/composables/useOutlineGeneration'
  import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
  import { useProjectStore } from '@/store/modules/project'
  import type { Material } from '@/types/material'
  import UnifiedMaterialCard from '@/components/custom/material-card/UnifiedMaterialCard.vue'
  import MaterialLibraryDialog from '@/components/custom/material-card/MaterialLibraryDialog.vue'
  import StepIndicator, { type Step } from '@/components/custom/StepIndicator.vue'
  import {
    Document,
    Folder,
    FolderOpened,
    Link,
    Plus,
    MagicStick,
    Delete
  } from '@element-plus/icons-vue'

  const router = useRouter()
  const route = useRoute()
  const outlineGeneration = useOutlineGeneration()
  const documentStore = useDocumentGenerateStore()
  const projectStore = useProjectStore()

  const projectId = route.params.projectId as string

  // 项目加载状态
  const loadingProject = ref(false)
  const generatingOutline = ref(false)

  // 步骤指示器数据
  const stepList: Step[] = [
    { label: '选题', status: 'completed' },
    { label: '大纲', status: 'active' },
    { label: '正文', status: 'pending' }
  ]

  // 素材相关状态
  const selectedMaterials = ref<Material[]>([])
  const materialsCollapsed = ref(false)
  const generationMode = ref<'material' | 'title'>('title') // 'material': 基于素材生成, 'title': 基于标题生成

  // 素材库对话框相关状态
  const showMaterialLibraryDialog = ref(false)

  // 头部操作按钮
  const headerActions = computed(() => {
    return [
      {
        label: '导出',
        type: 'primary' as const,
        icon: 'el-icon-download',
        handler: () => {
          outlineGeneration.exportOutline('json')
        }
      }
    ]
  })

  onMounted(async () => {
    // 更新当前步骤
    documentStore.documentState.currentStep = 'outline'

    // 清理过期的任务
    documentStore.cleanupExpiredTasks()

    // 加载项目信息
    await loadProject()

    // 加载现有数据
    await loadExistingData()
  })

  // 加载项目信息
  const loadProject = async () => {
    try {
      loadingProject.value = true

      if (!projectId) {
        ElMessage.error('项目ID不存在')
        return
      }

      const numericProjectId = Number(projectId)

      // 如果 store 中已有当前项目且ID匹配，直接返回
      if (
        projectStore.currentProject &&
        Number(projectStore.currentProject.id) === numericProjectId
      ) {
        return
      }

      // 如果项目列表为空，先加载项目列表
      if (projectStore.projects.length === 0) {
        try {
          await projectStore.fetchProjects()
        } catch (error) {
          console.error('加载项目列表失败:', error)
        }
      }

      // 从项目列表中查找
      const project = projectStore.projects.find((p) => Number(p.id) === numericProjectId)
      if (project) {
        projectStore.setCurrentProject(project)
        return
      }

      // 如果项目列表中没有，尝试从API获取
      try {
        const { projectService } = await import('@/services/projectService')
        const response = await projectService.getProjectDetail(numericProjectId)

        if (response.project) {
          projectStore.setCurrentProject(response.project)
        }
      } catch (apiError) {
        console.error('从API获取项目失败:', apiError)
        ElMessage.error('项目不存在或已被删除')
      }
    } catch (error) {
      console.error('加载项目失败:', error)
      ElMessage.error('加载项目信息失败')
    } finally {
      loadingProject.value = false
    }
  }

  const loadExistingData = async () => {
    // 从localStorage加载标题数据
    const titlesData = localStorage.getItem(`project_${projectId}_titles`)
    if (titlesData) {
      const { selectedTitle: title } = JSON.parse(titlesData)
      if (title) {
        // 标题数据已存储到store，无需额外处理
      }
    }

    // 检查服务状态
    try {
      await outlineGeneration.getOutlineToolsStatus()
    } catch {
      ElMessage.warning('大纲生成服务状态检查失败，将使用模拟数据')
    }
  }

  const selectedTitle = computed(() => {
    return documentStore.documentState.selectedTitle?.title || ''
  })

  const titleDescription = computed(() => {
    return documentStore.documentState.selectedTitle?.angle || ''
  })

  const canAddSection = computed(() => {
    return outlineGeneration.state.generatedOutline.length < 10
  })

  // 素材相关计算属性
  const canGenerateFromMaterials = computed(() => {
    return selectedMaterials.value.length > 0
  })

  const canGenerateFromTitle = computed(() => {
    return documentStore.documentState.selectedTitle && documentStore.documentState.researchBrief
  })

  const generateAIOutline = async () => {
    // 检查模式条件
    if (generationMode.value === 'title') {
      if (!canGenerateFromTitle.value) {
        ElMessage.warning('请先选择标题并完善研究简报')
        return
      }
    } else if (generationMode.value === 'material') {
      if (!canGenerateFromMaterials.value) {
        ElMessage.warning('请先选择素材')
        return
      }
    }

    generatingOutline.value = true
    try {
      let response

      if (generationMode.value === 'material') {
        // 基于素材生成大纲
        response = await outlineGeneration.generateOutlineFromMaterials(selectedMaterials.value)
        ElMessage.success('基于素材的AI大纲生成成功！')
      } else {
        // 基于标题生成大纲
        response = await outlineGeneration.generateOutline(
          documentStore.documentState.selectedTitle,
          documentStore.documentState.researchBrief,
          documentStore.documentState.searchResults
        )
        ElMessage.success('基于标题的AI大纲生成成功！')
      }

      // 保存到store
      if (response) {
        documentStore.updateDocumentState({
          generatedOutline: response.outline
        })
      }
    } catch {
      ElMessage.error('大纲生成失败')
    } finally {
      generatingOutline.value = false
    }
  }

  const addSection = () => {
    outlineGeneration.addSection()
  }

  const deleteSection = (index: number) => {
    const sections = outlineGeneration.state.generatedOutline
    if (index >= 0 && index < sections.length) {
      sections.splice(index, 1)
      ElMessage.success('章节已删除')
    }
  }

  const moveSectionUp = (index: number) => {
    const sections = outlineGeneration.state.generatedOutline
    if (index > 0) {
      const temp = sections[index]
      sections[index] = sections[index - 1]
      sections[index - 1] = temp
    }
  }

  const moveSectionDown = (index: number) => {
    const sections = outlineGeneration.state.generatedOutline
    if (index < sections.length - 1) {
      const temp = sections[index]
      sections[index] = sections[index + 1]
      sections[index + 1] = temp
    }
  }

  const clearOutline = () => {
    outlineGeneration.reset()
    ElMessage.success('大纲已清空')
  }

  const confirmOutline = () => {
    if (outlineGeneration.state.generatedOutline.length === 0) {
      ElMessage.warning('请创建大纲')
      return
    }

    // 验证大纲
    if (!outlineGeneration.validateOutline()) {
      return
    }

    // 保存到store
    documentStore.updateDocumentState({
      generatedOutline: outlineGeneration.state.generatedOutline
    })

    ElMessage.success('大纲已确认，即将进入正文阶段')

    // Navigate to content
    setTimeout(() => {
      router.push(`/document-generation/content/${projectId}`)
    }, 1500)
  }

  const goBack = () => {
    router.push(`/document-generation/topic-selection/${projectId}`)
  }

  // 素材相关方法
  const toggleMaterialSelection = (id: string) => {
    const index = selectedMaterials.value.findIndex((m) => m.id === id)
    if (index > -1) {
      selectedMaterials.value.splice(index, 1)
    } else {
      // 这里需要从素材库中查找，实际项目中需要从 store 或 API 获取
      // 临时使用模拟数据
      const mockMaterial: Material = {
        id,
        user_id: 'user1',
        title: `素材 ${id}`,
        summary: '这是一个模拟素材',
        key_excerpts: [],
        tags: [],
        score: 0.8,
        createdAt: new Date()
      }
      selectedMaterials.value.push(mockMaterial)
    }
  }

  // 打开素材库对话框
  const openMaterialLibrary = () => {
    showMaterialLibraryDialog.value = true
  }

  const bindMaterialToSection = (sectionIndex: number, material: Material) => {
    const section = outlineGeneration.state.generatedOutline[sectionIndex]
    if (section) {
      if (!section.data_requirements.includes(material.title)) {
        section.data_requirements.push(material.title)
        outlineGeneration.editSection(section.title, {
          data_requirements: section.data_requirements
        })
        ElMessage.success(`已将素材 "${material.title}" 绑定到章节`)
      } else {
        ElMessage.info('该素材已绑定到此章节')
      }
    }
  }

  const unbindMaterialFromSection = (sectionIndex: number, materialTitle: string) => {
    const section = outlineGeneration.state.generatedOutline[sectionIndex]
    if (section) {
      const index = section.data_requirements.indexOf(materialTitle)
      if (index > -1) {
        section.data_requirements.splice(index, 1)
        outlineGeneration.editSection(section.title, {
          data_requirements: section.data_requirements
        })
        ElMessage.success(`已将素材 "${materialTitle}" 从章节中解绑`)
      }
    }
  }

  // 素材库对话框相关方法
  const handleMaterialLibraryConfirm = (materials: Material[]) => {
    selectedMaterials.value = materials
    ElMessage.success(`已选择 ${selectedMaterials.value.length} 个素材`)
  }
</script>

<style scoped lang="scss">
  .outline-container {
    max-width: 1200px;
    padding: 20px;
    margin: 0 auto;
  }

  .outline-content {
    padding: 30px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .outline-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 20px;
    margin-bottom: 30px;
    border-bottom: 1px solid var(--el-border-color);
  }

  .selected-title {
    flex: 1;

    h3 {
      margin: 0 0 8px;
      font-size: 20px;
      color: var(--el-text-color-primary);
    }

    .title-description {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .outline-actions {
    display: flex;
    gap: 10px;
  }

  // 素材分区样式
  .materials-section {
    margin-bottom: 30px;
    overflow: hidden;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
  }

  .materials-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 30px;
    cursor: pointer;
    background: var(--el-fill-color-light);
    transition: background 0.3s;

    &:hover {
      background: var(--el-fill-color);
    }
  }

  .materials-title {
    flex: 1;

    h3 {
      margin: 0 0 4px;
      font-size: 18px;
      color: var(--el-text-color-primary);
    }

    .materials-subtitle {
      margin: 0;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .materials-controls {
    display: flex;
    gap: 15px;
    align-items: center;
  }

  .materials-content {
    padding: 30px;
    background: var(--el-bg-color);
  }

  .generation-mode {
    padding: 20px;
    margin-bottom: 30px;
    background: var(--el-fill-color-light);
    border-radius: 6px;

    .mode-selector {
      margin-bottom: 15px;

      .el-radio-group {
        display: flex;
        gap: 10px;
      }

      .el-radio-button {
        flex: 1;

        .el-radio-button__content {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
        }
      }
    }

    .mode-description {
      p {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--el-text-color-regular);
      }
    }
  }

  .materials-selection {
    .materials-list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;

      h4 {
        margin: 0;
        font-size: 16px;
        color: var(--el-text-color-primary);
      }
    }

    .empty-materials {
      padding: 40px 20px;
      text-align: center;

      p {
        margin: 10px 0 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    .materials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
  }

  .material-binding {
    padding: 20px;
    margin-top: 30px;
    background: var(--el-fill-color-light);
    border-radius: 6px;

    .binding-header {
      margin-bottom: 20px;

      h4 {
        display: flex;
        gap: 8px;
        align-items: center;
        margin: 0 0 8px;
        font-size: 16px;
        color: var(--el-text-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }

      p {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }

    .binding-grid {
      display: grid;
      gap: 16px;
    }

    .binding-section {
      padding: 16px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color);
      border-radius: 6px;

      .section-title {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 12px;

        .section-number {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          font-size: 12px;
          font-weight: bold;
          color: white;
          background: var(--el-color-primary);
          border-radius: 4px;
        }

        h5 {
          margin: 0;
          font-size: 15px;
          color: var(--el-text-color-primary);
        }
      }

      .bound-materials {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 40px;
        padding: 12px;
        margin-bottom: 12px;
        background: var(--el-fill-color-blank);
        border-radius: 4px;

        .el-tag {
          margin: 0;
        }
      }
    }
  }

  .empty-outline {
    padding: 60px 20px;
    text-align: center;

    .empty-icon {
      margin-bottom: 20px;
      font-size: 48px;
    }

    h4 {
      margin: 0 0 10px;
      font-size: 18px;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .outline-tree {
    margin-bottom: 30px;
  }

  .outline-section {
    padding: 15px;
    margin-bottom: 20px;
    background: var(--el-fill-color-light);
    border-radius: 6px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .section-info {
    display: flex;
    flex: 1;
    gap: 10px;
    align-items: center;
  }

  .section-number {
    min-width: 30px;
    font-weight: bold;
    color: var(--el-color-primary);
  }

  .section-title-input {
    flex: 1;
    padding: 8px 12px;
    font-size: 16px;
    font-weight: 500;
    background: white;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    &:focus {
      border-color: var(--el-color-primary);
      outline: none;
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }
  }

  .section-controls {
    display: flex;
    gap: 5px;
  }

  .section-content {
    padding: 15px;
    margin-top: 15px;
    background: var(--el-fill-color-blank);
    border-radius: 4px;
  }

  .content-direction {
    margin-bottom: 15px;

    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }

  .content-direction-textarea {
    width: 100%;
    min-height: 80px;
    padding: 8px 12px;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    &:focus {
      border-color: var(--el-color-primary);
      outline: none;
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }
  }

  .data-requirements {
    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .el-tag {
      margin-right: 8px;
      margin-bottom: 8px;
    }
  }

  .outline-actions-bottom {
    display: flex;
    gap: 15px;
    justify-content: center;
    padding-top: 20px;
    margin-top: 30px;
    border-top: 1px solid var(--el-border-color);
  }

  @media (width <= 768px) {
    .outline-container {
      padding: 15px;
    }

    .outline-content {
      padding: 20px;
    }

    .outline-header {
      flex-direction: column;
      gap: 20px;
    }

    .outline-actions {
      flex-wrap: wrap;
    }

    .section-header {
      flex-direction: column;
      gap: 10px;
      align-items: flex-start;
    }

    .section-controls {
      flex-wrap: wrap;
    }

    .step-indicator {
      padding: 15px;
    }

    .step-connector {
      width: 40px;
      margin: 0 10px;
    }

    .outline-actions-bottom {
      flex-direction: column;
      align-items: center;
    }

    // 素材分区移动端适配
    .materials-section {
      margin-bottom: 20px;
    }

    .materials-header {
      padding: 15px 20px;
    }

    .materials-title {
      h3 {
        font-size: 16px;
      }

      .materials-subtitle {
        font-size: 12px;
      }
    }

    .materials-controls {
      gap: 10px;
    }

    .materials-content {
      padding: 20px;
    }

    .generation-mode {
      padding: 16px;

      .mode-selector {
        .el-radio-group {
          flex-direction: column;
        }
      }
    }

    .materials-selection {
      .materials-list-header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
      }

      .materials-grid {
        grid-template-columns: 1fr;
      }
    }

    .material-binding {
      padding: 16px;

      .binding-section {
        padding: 12px;
      }
    }
  }

  // 素材库抽屉样式
  .material-library-drawer {
    .el-drawer__header {
      padding: 20px 24px;
      margin-bottom: 0;
      border-bottom: 1px solid var(--el-border-color);

      h3 {
        margin: 0;
        font-size: 18px;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 8px 0 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }

    .el-drawer__body {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 70px);
      padding: 0;
    }

    &__search {
      padding: 20px 24px;
      border-bottom: 1px solid var(--el-border-color);

      .el-input {
        width: 100%;
      }
    }

    &__content {
      flex: 1;
      padding: 20px 24px;
      overflow-y: auto;
    }

    &__selected {
      padding: 16px 24px;
      background: var(--el-fill-color-light);
      border-top: 1px solid var(--el-border-color);

      .selected-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;

        h4 {
          margin: 0;
          font-size: 14px;
          color: var(--el-text-color-primary);
        }

        .el-button {
          padding: 4px 12px;
          font-size: 12px;
        }
      }

      .selected-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .el-tag {
          margin: 0;
        }
      }
    }

    &__footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 16px 24px;
      background: var(--el-bg-color);
      border-top: 1px solid var(--el-border-color);
    }

    .materials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      padding: 0;
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;

      p {
        margin: 12px 0 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }

      .el-button {
        margin-top: 16px;
      }
    }
  }

  .empty-materials-actions {
    p {
      margin: 10px 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  @media (width <= 768px) {
    .material-library-drawer {
      &__content {
        padding: 16px;
      }

      .materials-grid {
        grid-template-columns: 1fr;
      }
    }
  }
</style>
