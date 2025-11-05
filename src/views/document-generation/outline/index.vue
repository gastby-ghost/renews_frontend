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

      <!-- 标题信息分区 -->
      <div class="art-card title-section">
        <div class="title-header" @click="titleCollapsed = !titleCollapsed">
          <div class="title-info">
            <h3>
              <el-icon><Document /></el-icon>
              当前标题
            </h3>
            <p class="title-subtitle">查看选中标题的详细信息和研究角度</p>
          </div>
          <div class="title-controls">
            <el-tag v-if="selectedTitle" type="primary" size="large"> 已选择标题 </el-tag>
            <el-tag v-else type="info" size="large"> 未选择标题 </el-tag>
            <el-button :icon="titleCollapsed ? ArrowDown : ArrowUp" link>
              {{ titleCollapsed ? '展开' : '收起' }}
            </el-button>
          </div>
        </div>

        <el-collapse-transition>
          <div v-show="!titleCollapsed" class="title-content">
            <div v-if="selectedTitle" class="title-details">
              <div class="title-main">
                <div class="title-text">
                  <h4>{{ selectedTitle }}</h4>
                  <div class="title-meta">
                    <el-tag type="success" size="small">选题阶段已确认</el-tag>
                    <span class="generation-date">
                      生成时间：{{ new Date().toLocaleDateString() }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="titleDescription" class="title-description">
                <h5>
                  <el-icon><ChatDotSquare /></el-icon>
                  研究角度
                </h5>
                <p>{{ titleDescription }}</p>
              </div>

              <div v-if="documentStore.documentState.researchBrief" class="research-brief">
                <h5>
                  <el-icon><Reading /></el-icon>
                  研究简报
                </h5>
                <div class="brief-content">
                  {{ documentStore.documentState.researchBrief }}
                </div>
              </div>

              <div class="title-actions">
                <el-button size="small" @click="editTitle" class="art-button">
                  <el-icon><Edit /></el-icon>
                  编辑标题
                </el-button>
                <el-button
                  size="small"
                  type="primary"
                  plain
                  @click="viewSearchResults"
                  class="art-button"
                >
                  <el-icon><Search /></el-icon>
                  查看搜索结果
                </el-button>
              </div>
            </div>

            <div v-else class="empty-title">
              <el-empty description="暂未选择标题">
                <template #image>
                  <el-icon :size="60"><DocumentAdd /></el-icon>
                </template>
                <div class="empty-title-actions">
                  <p>请先返回选题页面选择标题</p>
                  <el-button type="primary" @click="goBackToTitleSelection">
                    <el-icon><ArrowLeft /></el-icon>
                    返回选题
                  </el-button>
                </div>
              </el-empty>
            </div>
          </div>
        </el-collapse-transition>
      </div>

      <!-- 素材分区 -->
      <div class="art-card materials-section">
        <div class="materials-header" @click="materialsCollapsed = !materialsCollapsed">
          <div class="materials-title">
            <h3>素材管理</h3>
            <p class="materials-subtitle">选择素材用于后续内容生成和章节绑定</p>
          </div>
          <div class="materials-controls">
            <el-tag :type="selectedMaterials.length > 0 ? 'success' : 'info'" size="large">
              已选择 {{ selectedMaterials.length }} 个素材
            </el-tag>
            <el-button :icon="materialsCollapsed ? ArrowDown : ArrowUp" link>
              {{ materialsCollapsed ? '展开' : '收起' }}
            </el-button>
          </div>
        </div>

        <el-collapse-transition>
          <div v-show="!materialsCollapsed" class="materials-content">
            <!-- 素材选择区域 -->
            <div class="materials-selection">
              <div class="materials-list">
                <div class="materials-list-header">
                  <h4>选择素材（用于后续内容生成和章节绑定）</h4>
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

      <div class="art-card outline-content">
        <div class="outline-header">
          <div class="selected-title">
            <h3>{{ selectedTitle }}</h3>
            <p class="title-description">{{ titleDescription }}</p>
          </div>
          <div class="outline-actions">
            <el-button
              @click="generateAIOutline"
              :loading="generatingOutline"
              :disabled="!canGenerateFromTitle"
              type="primary"
              class="art-button"
            >
              <el-icon><MagicStick /></el-icon>
              AI生成大纲
            </el-button>
            <el-button @click="addSection" :disabled="!canAddSection" class="art-button">
              <el-icon><Plus /></el-icon>
              添加章节
            </el-button>
            <el-button
              @click="clearOutline"
              :disabled="outlineGeneration.state.generatedOutline.length === 0"
              type="danger"
              plain
              class="art-button"
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
          <el-button @click="goBack" size="large" class="art-button art-button--secondary"
            >返回标题</el-button
          >
          <el-button
            type="success"
            size="large"
            @click="confirmOutline"
            :disabled="outlineGeneration.state.generatedOutline.length === 0"
            class="art-button art-button--primary"
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
    FolderOpened,
    Link,
    Plus,
    MagicStick,
    Delete,
    DocumentAdd,
    Edit,
    Search,
    ChatDotSquare,
    Reading,
    ArrowLeft,
    ArrowDown,
    ArrowUp
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

  // 标题分区状态
  const titleCollapsed = ref(false)

  // 素材相关状态
  const selectedMaterials = ref<Material[]>([])
  const materialsCollapsed = ref(false)

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

  const canGenerateFromTitle = computed(() => {
    return documentStore.documentState.selectedTitle && documentStore.documentState.researchBrief
  })

  const generateAIOutline = async () => {
    // 检查条件
    if (!canGenerateFromTitle.value) {
      ElMessage.warning('请先选择标题并完善研究简报')
      return
    }

    generatingOutline.value = true
    try {
      // 基于标题生成大纲
      const response = await outlineGeneration.generateOutline(
        documentStore.documentState.selectedTitle,
        documentStore.documentState.researchBrief,
        documentStore.documentState.searchResults
      )
      ElMessage.success('AI大纲生成成功！')

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

  // 标题相关方法
  const editTitle = () => {
    ElMessage.info('编辑标题功能开发中...')
    // TODO: 跳转到标题编辑页面或打开编辑对话框
  }

  const viewSearchResults = () => {
    ElMessage.info('查看搜索结果功能开发中...')
    // TODO: 显示搜索结果弹窗或跳转到搜索结果页面
  }

  const goBackToTitleSelection = () => {
    router.push(`/document-generation/topic-selection/${projectId}`)
  }

  // 素材库对话框相关方法
  const handleMaterialLibraryConfirm = (materials: Material[]) => {
    selectedMaterials.value = materials
    ElMessage.success(`已选择 ${selectedMaterials.value.length} 个素材`)
  }
</script>

<style scoped lang="scss">
  .outline-container {
    max-width: none; // 覆盖任何可能的最大宽度限制
    // 容器由 ArtPageContent 控制，这里只需要设置合适的内边距
    padding: var(--art-padding-lg, 24px);
  }

  .main-content {
    // 主要内容区域，确保充分利用可用空间
    width: 100%;
  }

  // 标题分区样式
  .title-section {
    margin-bottom: var(--art-spacing-lg, 24px);
    overflow: hidden;
  }

  .title-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--art-padding-lg, 24px) var(--art-padding-xl, 32px);
    cursor: pointer;
    background: var(--art-fill-color-light);
    border-bottom: 1px solid var(--art-border-color);
    transition: all 0.3s ease;

    &:hover {
      background: var(--art-fill-color);
    }

    .title-info {
      flex: 1;

      h3 {
        display: flex;
        gap: var(--art-spacing-sm, 8px);
        align-items: center;
        margin: 0 0 var(--art-spacing-xs, 4px);
        font-size: var(--art-font-size-base-lg, 18px);
        font-weight: var(--art-font-weight-medium, 500);
        color: var(--art-text-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }

      .title-subtitle {
        margin: 0;
        font-size: var(--art-font-size-xs, 13px);
        line-height: var(--art-line-height-normal, 1.4);
        color: var(--art-text-color-secondary);
      }
    }

    .title-controls {
      display: flex;
      gap: var(--art-spacing-lg, 16px);
      align-items: center;
    }
  }

  .title-content {
    padding: var(--art-padding-xl, 32px);
    background: var(--art-main-bg-color);
  }

  .title-details {
    .title-main {
      margin-bottom: var(--art-spacing-xl, 32px);
    }

    .title-text {
      h4 {
        margin: 0 0 var(--art-spacing-md, 16px);
        font-size: var(--art-font-size-xl, 24px);
        font-weight: var(--art-font-weight-semibold, 600);
        line-height: var(--art-line-height-relaxed, 1.6);
        color: var(--art-text-color-primary);
      }

      .title-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--art-spacing-lg, 20px);
        align-items: center;

        .generation-date {
          font-size: var(--art-font-size-sm, 14px);
          color: var(--art-text-color-secondary);
        }
      }
    }

    .title-description,
    .research-brief {
      margin-bottom: var(--art-spacing-xl, 32px);

      h5 {
        display: flex;
        gap: var(--art-spacing-sm, 8px);
        align-items: center;
        margin: 0 0 var(--art-spacing-md, 16px);
        font-size: var(--art-font-size-base, 16px);
        font-weight: var(--art-font-weight-medium, 500);
        color: var(--art-text-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }

      p,
      .brief-content {
        padding: var(--art-spacing-lg, 20px);
        margin: 0;
        font-size: var(--art-font-size-sm, 14px);
        line-height: var(--art-line-height-relaxed, 1.6);
        color: var(--art-text-color-regular);
        background: var(--art-fill-color-light);
        border: 1px solid var(--art-border-color);
        border-left: 4px solid var(--el-color-primary);
        border-radius: var(--art-border-radius, 8px);
      }
    }

    .title-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--art-spacing-md, 12px);
    }
  }

  .empty-title {
    padding: var(--art-padding-2xl, 60px) var(--art-padding-lg, 24px);
    text-align: center;

    p {
      margin: var(--art-spacing-md, 12px) 0;
      font-size: var(--art-font-size-sm, 14px);
      line-height: var(--art-line-height-relaxed, 1.6);
      color: var(--art-text-color-secondary);
    }

    .el-button {
      margin-top: var(--art-spacing-md, 12px);
    }
  }

  // Art Card 样式
  .art-card {
    margin-bottom: var(--art-spacing-lg, 24px);
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius, 8px);
    box-shadow: var(--art-box-shadow-sm);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary-light-6);
      box-shadow: var(--art-box-shadow);
    }
  }

  .outline-content {
    padding: var(--art-padding-xl, 32px);
  }

  .outline-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: var(--art-spacing-lg, 24px);
    margin-bottom: var(--art-spacing-xl, 32px);
    border-bottom: 1px solid var(--art-border-color);
  }

  .selected-title {
    flex: 1;

    h3 {
      margin: 0 0 var(--art-spacing-sm, 8px);
      font-size: var(--art-font-size-lg, 20px);
      font-weight: var(--art-font-weight-semibold, 600);
      color: var(--art-text-color-primary);
    }

    .title-description {
      margin: 0;
      font-size: var(--art-font-size-sm, 14px);
      line-height: var(--art-line-height-relaxed, 1.6);
      color: var(--art-text-color-secondary);
    }
  }

  .outline-actions {
    display: flex;
    gap: var(--art-spacing-md, 12px);
  }

  // 素材分区样式
  .materials-section {
    overflow: hidden;
  }

  .materials-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--art-padding-lg, 24px) var(--art-padding-xl, 32px);
    cursor: pointer;
    background: var(--art-fill-color-light);
    border-bottom: 1px solid var(--art-border-color);
    transition: all 0.3s ease;

    &:hover {
      background: var(--art-fill-color);
    }
  }

  .materials-title {
    flex: 1;

    h3 {
      margin: 0 0 var(--art-spacing-xs, 4px);
      font-size: var(--art-font-size-base-lg, 18px);
      font-weight: var(--art-font-weight-medium, 500);
      color: var(--art-text-color-primary);
    }

    .materials-subtitle {
      margin: 0;
      font-size: var(--art-font-size-xs, 13px);
      line-height: var(--art-line-height-normal, 1.4);
      color: var(--art-text-color-secondary);
    }
  }

  .materials-controls {
    display: flex;
    gap: var(--art-spacing-lg, 16px);
    align-items: center;
  }

  .materials-content {
    padding: var(--art-padding-xl, 32px);
    background: var(--art-main-bg-color);
  }

  .materials-selection {
    .materials-list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--art-spacing-lg, 20px);

      h4 {
        margin: 0;
        font-size: var(--art-font-size-base, 16px);
        font-weight: var(--art-font-weight-medium, 500);
        color: var(--art-text-color-primary);
      }
    }

    .empty-materials {
      padding: var(--art-padding-xl, 40px) var(--art-padding-lg, 24px);
      text-align: center;

      p {
        margin: var(--art-spacing-md, 12px) 0;
        font-size: var(--art-font-size-sm, 14px);
        line-height: var(--art-line-height-relaxed, 1.6);
        color: var(--art-text-color-secondary);
      }

      .el-button {
        margin-top: var(--art-spacing-md, 12px);
      }
    }

    .materials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--art-spacing-lg, 16px);
    }
  }

  .material-binding {
    padding: var(--art-padding-lg, 24px);
    margin-top: var(--art-spacing-xl, 32px);
    background: var(--art-fill-color-light);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius, 8px);

    .binding-header {
      margin-bottom: var(--art-spacing-lg, 20px);

      h4 {
        display: flex;
        gap: var(--art-spacing-sm, 8px);
        align-items: center;
        margin: 0 0 var(--art-spacing-sm, 8px);
        font-size: var(--art-font-size-base, 16px);
        font-weight: var(--art-font-weight-medium, 500);
        color: var(--art-text-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }

      p {
        margin: 0;
        font-size: var(--art-font-size-xs, 13px);
        line-height: var(--art-line-height-normal, 1.4);
        color: var(--art-text-color-secondary);
      }
    }

    .binding-grid {
      display: grid;
      gap: var(--art-spacing-lg, 16px);
    }

    .binding-section {
      padding: var(--art-padding-lg, 16px);
      background: var(--art-main-bg-color);
      border: 1px solid var(--art-border-color);
      border-radius: var(--art-border-radius, 8px);
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--el-color-primary-light-6);
        box-shadow: var(--art-box-shadow-sm);
      }

      .section-title {
        display: flex;
        gap: var(--art-spacing-md, 12px);
        align-items: center;
        margin-bottom: var(--art-spacing-md, 12px);

        .section-number {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 28px;
          font-size: var(--art-font-size-xs, 12px);
          font-weight: var(--art-font-weight-bold, 700);
          color: white;
          background: var(--el-color-primary);
          border-radius: var(--art-border-radius, 6px);
        }

        h5 {
          margin: 0;
          font-size: var(--art-font-size-base-sm, 15px);
          font-weight: var(--art-font-weight-medium, 500);
          color: var(--art-text-color-primary);
        }
      }

      .bound-materials {
        display: flex;
        flex-wrap: wrap;
        gap: var(--art-spacing-sm, 8px);
        min-height: 48px;
        padding: var(--art-spacing-md, 12px);
        margin-bottom: var(--art-spacing-md, 12px);
        background: var(--art-fill-color-blank);
        border: 1px solid var(--art-border-dashed-color);
        border-radius: var(--art-border-radius-sm, 6px);

        .el-tag {
          margin: 0;
        }
      }
    }
  }

  .empty-outline {
    padding: var(--art-padding-2xl, 60px) var(--art-padding-lg, 24px);
    text-align: center;

    .empty-icon {
      margin-bottom: var(--art-spacing-lg, 20px);
      font-size: 48px;
      opacity: 0.7;
    }

    h4 {
      margin: 0 0 var(--art-spacing-md, 12px);
      font-size: var(--art-font-size-base-lg, 18px);
      font-weight: var(--art-font-weight-medium, 500);
      color: var(--art-text-color-primary);
    }

    p {
      margin: 0;
      font-size: var(--art-font-size-sm, 14px);
      line-height: var(--art-line-height-relaxed, 1.6);
      color: var(--art-text-color-secondary);
    }
  }

  .outline-tree {
    margin-bottom: var(--art-spacing-xl, 32px);
  }

  .outline-section {
    box-sizing: border-box;
    padding: var(--art-padding-lg, 16px);
    margin-bottom: var(--art-spacing-lg, 20px);
    overflow: hidden;
    background: var(--art-fill-color-light);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius, 8px);
    transition: all 0.3s ease;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      border-color: var(--el-color-primary-light-6);
      box-shadow: var(--art-box-shadow-sm);
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--art-spacing-md, 12px);
  }

  .section-info {
    display: flex;
    flex: 1;
    gap: var(--art-spacing-md, 12px);
    align-items: center;
  }

  .section-number {
    min-width: 32px;
    font-size: var(--art-font-size-lg, 16px);
    font-weight: var(--art-font-weight-bold, 700);
    color: var(--el-color-primary);
  }

  .section-title-input {
    flex: 1;
    padding: var(--art-spacing-sm, 8px) var(--art-spacing-md, 12px);
    font-size: var(--art-font-size-base, 16px);
    font-weight: var(--art-font-weight-medium, 500);
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius-sm, 6px);
    transition: all 0.3s ease;

    &:focus {
      background: var(--art-main-bg-color);
      border-color: var(--el-color-primary);
      outline: none;
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }

    &:hover {
      border-color: var(--el-color-primary-light-6);
    }
  }

  .section-controls {
    display: flex;
    gap: var(--art-spacing-xs, 6px);
  }

  .section-content {
    box-sizing: border-box;
    padding: var(--art-padding-lg, 16px);
    margin-top: var(--art-spacing-lg, 16px);
    overflow: hidden;
    background: var(--art-fill-color-blank);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius-sm, 6px);
  }

  .content-direction {
    margin-bottom: var(--art-spacing-lg, 16px);

    label {
      display: block;
      margin-bottom: var(--art-spacing-sm, 8px);
      font-size: var(--art-font-size-sm, 14px);
      font-weight: var(--art-font-weight-medium, 500);
      color: var(--art-text-color-primary);
    }
  }

  .content-direction-textarea {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-height: 96px;
    padding: var(--art-spacing-md, 12px);
    font-family: inherit;
    font-size: var(--art-font-size-sm, 14px);
    line-height: var(--art-line-height-relaxed, 1.6);
    resize: vertical;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: var(--art-border-radius-sm, 6px);
    transition: all 0.3s ease;

    &:focus {
      background: var(--art-main-bg-color);
      border-color: var(--el-color-primary);
      outline: none;
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }

    &:hover {
      border-color: var(--el-color-primary-light-6);
    }
  }

  .data-requirements {
    label {
      display: block;
      margin-bottom: var(--art-spacing-sm, 8px);
      font-size: var(--art-font-size-sm, 14px);
      font-weight: var(--art-font-weight-medium, 500);
      color: var(--art-text-color-primary);
    }

    .el-tag {
      margin-right: var(--art-spacing-sm, 8px);
      margin-bottom: var(--art-spacing-sm, 8px);
    }
  }

  .outline-actions-bottom {
    display: flex;
    gap: var(--art-spacing-lg, 20px);
    justify-content: center;
    padding-top: var(--art-spacing-lg, 24px);
    margin-top: var(--art-spacing-xl, 32px);
    border-top: 1px solid var(--art-border-color);

    .art-button {
      min-width: 120px;
      font-weight: var(--art-font-weight-medium, 500);

      &--primary {
        background: var(--el-color-primary);
        border-color: var(--el-color-primary);

        &:hover {
          background: var(--el-color-primary-light-3);
          border-color: var(--el-color-primary-light-3);
        }
      }

      &--secondary {
        color: var(--art-text-color-primary);
        background: var(--art-fill-color-light);
        border-color: var(--art-border-color);

        &:hover {
          background: var(--art-fill-color);
          border-color: var(--el-color-primary-light-6);
        }
      }
    }
  }

  // 响应式设计 - 使用系统标准断点
  @media (max-width: $device-phone) {
    // 标题分区移动端适配
    .title-header {
      padding: var(--art-padding-md, 16px) var(--art-padding-lg, 20px);
    }

    .title-info {
      h3 {
        font-size: var(--art-font-size-base, 16px);
      }

      .title-subtitle {
        font-size: var(--art-font-size-xs, 12px);
      }
    }

    .title-controls {
      gap: var(--art-spacing-md, 12px);
    }

    .title-content {
      padding: var(--art-padding-lg, 20px);
    }

    .title-text {
      h4 {
        font-size: var(--art-font-size-lg, 20px);
      }
    }

    .title-meta {
      flex-direction: column;
      gap: var(--art-spacing-sm, 8px);
      align-items: flex-start;
    }

    .title-actions {
      flex-direction: column;
      align-items: stretch;

      .el-button {
        width: 100%;
      }
    }

    .outline-content {
      padding: var(--art-padding-lg, 20px);
    }

    .outline-header {
      flex-direction: column;
      gap: var(--art-spacing-lg, 20px);
      align-items: stretch;
    }

    .outline-actions {
      flex-wrap: wrap;
      justify-content: center;
    }

    .section-header {
      flex-direction: column;
      gap: var(--art-spacing-md, 12px);
      align-items: flex-start;
    }

    .section-controls {
      flex-wrap: wrap;
      justify-content: flex-start;
    }

    .outline-actions-bottom {
      flex-direction: column;
      gap: var(--art-spacing-md, 16px);
      align-items: center;

      .art-button {
        width: 100%;
        max-width: 200px;
      }
    }

    // 素材分区移动端适配
    .materials-header {
      padding: var(--art-padding-md, 16px) var(--art-padding-lg, 20px);
    }

    .materials-title {
      h3 {
        font-size: var(--art-font-size-base, 16px);
      }

      .materials-subtitle {
        font-size: var(--art-font-size-xs, 12px);
      }
    }

    .materials-controls {
      gap: var(--art-spacing-md, 12px);
    }

    .materials-content {
      padding: var(--art-padding-lg, 20px);
    }

    .materials-selection {
      .materials-list-header {
        flex-direction: column;
        gap: var(--art-spacing-md, 12px);
        align-items: flex-start;
      }

      .materials-grid {
        grid-template-columns: 1fr;
        gap: var(--art-spacing-md, 12px);
      }
    }

    .material-binding {
      padding: var(--art-padding-md, 16px);

      .binding-section {
        padding: var(--art-spacing-md, 12px);
      }
    }

    .outline-section {
      padding: var(--art-spacing-md, 12px);
    }

    .section-content {
      padding: var(--art-spacing-md, 12px);
    }

    .content-direction-textarea {
      min-height: 80px;
    }
  }

  // 平板设备适配
  @media (max-width: $device-ipad) {
    .materials-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }

    .outline-actions {
      flex-wrap: wrap;
      gap: var(--art-spacing-sm, 8px);
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
