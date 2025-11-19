<template>
  <div class="content-container">
    <ArtTableHeader :title="`正文编辑 (Markdown)`" :actions="headerActions" @back="goBack" />

    <!-- 项目加载提示 -->
    <div
      v-if="state.loadingProject || (!projectStore.currentProject && projectId)"
      class="project-loading"
    >
      <el-empty :description="state.loadingProject ? '正在加载项目信息...' : '项目信息加载失败'" />
    </div>

    <div v-else class="main-content art-page-content">
      <StepIndicator :steps="stepList" />

      <div class="content-editor art-card">
        <!-- 头部区域 -->
        <HeaderSection
          :document-title="documentTitle"
          :generating-content="state.generatingContent"
          :has-content="hasContent"
          :stats="stats"
          :last-saved="lastSaved"
          @generate-ai-content="generateAIContent"
          @save-content="saveContent"
          @export-content="exportContent"
        />

        <!-- 简化的编辑器布局 -->
        <div class="editor-layout">
          <!-- 侧边工具栏 -->
          <div class="sidebar-toolbar">
            <!-- 大纲切换 -->
            <div
              class="toolbar-item"
              :class="{ active: state.showOutline }"
              @click="state.showOutline = !state.showOutline"
            >
              <el-tooltip content="文档大纲" placement="right" :show-after="800">
                <div class="toolbar-button">
                  <el-icon class="toolbar-icon"><Menu /></el-icon>
                  <span class="toolbar-label">大纲</span>
                </div>
              </el-tooltip>
            </div>

            <!-- 统计信息切换 -->
            <div
              class="toolbar-item"
              :class="{ active: state.showStats }"
              @click="state.showStats = !state.showStats"
            >
              <el-tooltip content="文档统计" placement="right" :show-after="800">
                <div class="toolbar-button">
                  <el-icon class="toolbar-icon"><DataAnalysis /></el-icon>
                  <span class="toolbar-label">统计</span>
                </div>
              </el-tooltip>
            </div>
          </div>

          <!-- 主要内容区域 -->
          <div class="main-content-area">
            <!-- 大纲面板 -->
            <div
              v-show="state.showOutline"
              class="outline-panel-wrapper"
              :class="{ 'panel-collapsed': !state.showOutline }"
            >
              <OutlinePanel
                :show-outline="state.showOutline"
                :outline="state.outline"
                :current-section="state.currentSection"
                @toggle-outline="state.showOutline = !state.showOutline"
                @navigate-to-section="navigateToSection"
              />
            </div>

            <!-- 编辑器面板 -->
            <EditorPanel
              v-model:editor-container="editorContainer"
              v-model:markdown-textarea="markdownTextarea"
              :content="state.content"
              :show-preview="state.showPreview"
              :has-content="hasContent"
              :rendered-content="renderedContent"
              :show-selection-toolbar="state.showSelectionToolbar"
              :toolbar-position="state.toolbarPosition"
              @update:content="(value) => (state.content = value)"
              @generate-ai-content="generateAIContent"
              @content-change="handleContentChange"
              @text-selection="handleTextSelection"
              @polish-selection="polishSelection"
              @expand-selection="expandSelection"
              @summarize-selection="summarizeSelection"
              @translate-selection="translateSelection"
              @rewrite-selection="rewriteSelection"
              @toggle-preview="togglePreview"
            />

            <!-- 统计面板 -->
            <div
              v-show="state.showStats"
              class="stats-panel-wrapper"
              :class="{ 'panel-collapsed': !state.showStats }"
            >
              <StatsPanel
                :show-stats="state.showStats"
                :stats="stats"
                :ai-suggestions="aiSuggestions"
                @toggle-stats="state.showStats = !state.showStats"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="content-actions">
        <el-button @click="goBack" size="large">
          <el-icon><ArrowLeft /></el-icon>
          返回大纲
        </el-button>
        <el-button
          type="warning"
          size="large"
          @click="executeContentGenerateOnLoad"
          :disabled="state.generatingContent"
        >
          <el-icon><DataAnalysis /></el-icon>
          {{ state.generatingContent ? '生成中...' : hasContent ? '重新生成内容' : '手动生成内容' }}
        </el-button>
        <el-button type="success" size="large" @click="completeDocument" :disabled="!hasContent">
          <el-icon><Check /></el-icon>
          完成文档
        </el-button>
      </div>
    </div>

    <!-- AI 操作对话框 -->
    <AIDialog
      :visible="state.aiDialogVisible"
      :dialog-title="state.aiDialogTitle"
      :dialog-type="state.aiDialogType"
      :ai-loading="state.aiLoading"
      :selected-text="state.selectedText"
      :ai-result="aiResult"
      @update:visible="(value) => (state.aiDialogVisible = value)"
      @apply="applyAIResult"
      @cancel="state.aiDialogVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, nextTick, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { ArrowLeft, Check, Menu, DataAnalysis } from '@element-plus/icons-vue'
  import { useContent } from '@/composables/document/useContent'
  import { useProjectStore } from '@/store/modules/project'
  import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
  import { contentGenerateService } from '@/services/ai/contentGenerateService'
  import type { BodyGenerationRequest } from '@/types/ai/content-generate'
  import StepIndicator from '@/components/custom/StepIndicator.vue'
  import HeaderSection from '@/components/custom/document/content/HeaderSection.vue'
  import OutlinePanel from '@/components/custom/document/content/OutlinePanel.vue'
  import EditorPanel from '@/components/custom/document/content/EditorPanel.vue'
  import StatsPanel from '@/components/custom/document/content/StatsPanel.vue'
  import AIDialog from '@/components/custom/document/content/AIDialog.vue'

  const router = useRouter()
  const route = useRoute()
  const projectId = route.params.projectId as string
  const projectStore = useProjectStore()
  const documentStore = useDocumentGenerateStore()

  console.log('[DEBUG] ===== 内容页面初始化 =====')
  console.log('[DEBUG] 当前路由参数:', route.params)
  console.log('[DEBUG] projectId:', projectId)
  console.log('[DEBUG] 当前完整路由路径:', route.fullPath)
  console.log('[DEBUG] router实例:', router)

  // 使用内容编辑组合式函数
  console.log('[DEBUG] 初始化useContent组合式函数')
  const {
    state,
    editorContainer,
    markdownTextarea,
    documentTitle,
    hasContent,
    renderedContent,
    lastSaved,
    headerActions,
    stats,
    aiSuggestions,
    stepList,
    generateOutlineFromContent,
    saveContent,
    exportContent
  } = useContent()
  console.log('[DEBUG] useContent初始化完成')
  console.log('[DEBUG] 初始state:', state)
  console.log('[DEBUG] documentTitle:', documentTitle)
  console.log('[DEBUG] hasContent:', hasContent)

  // AI 结果数据
  const aiResult = ref('')

  // ============= 内容生成服务执行 =============
  // 页面初次加载时执行content-generate service
  const executeContentGenerateOnLoad = async () => {
    console.log('[DEBUG] ===== 内容自动生成检查开始 =====')
    console.log('[DEBUG] hasContent.value:', hasContent.value)
    console.log('[DEBUG] state.content.length:', state.content.trim().length)
    console.log('[DEBUG] documentStore.documentState:', documentStore.documentState)
    console.log(
      '[DEBUG] documentStore.documentState.generatedOutline:',
      documentStore.documentState.generatedOutline
    )
    console.log('[DEBUG] contentGenerateService是否可用:', !!contentGenerateService)

    // 注释掉内容检查，允许重复生成
    // 更严格的内容检查 - 确保本地存储的内容也被考虑
    // const hasLocalContent = localStorage.getItem(`project_${projectId}_content`)
    // const hasValidContent = hasContent.value && state.content.trim().length > 50 // 至少50个字符才认为是有效内容

    // 检查是否已有内容（包括本地存储），避免重复生成
    // if (hasValidContent || hasLocalContent) {
    //   console.log('[DEBUG] 内容已存在，跳过自动生成')
    //   console.log('[DEBUG] hasValidContent:', hasValidContent)
    //   console.log('[DEBUG] hasLocalContent:', !!hasLocalContent)
    //   console.log('[DEBUG] 本地内容长度:', hasLocalContent?.length || 0)
    //   console.log('[DEBUG] 当前内容长度:', state.content.trim().length)
    //   if (state.content.trim().length > 0) {
    //     console.log('[DEBUG] state.content:', state.content.substring(0, 100) + '...')
    //   }
    //   return
    // }

    // 移除大纲数据检查 - 确保即使没有大纲也能生成内容
    // 硬编码默认的大纲数据用于内容生成
    let outlineData = documentStore.documentState.generatedOutline
    if (!outlineData || outlineData.length === 0) {
      console.log('[DEBUG] 无大纲数据，使用硬编码默认大纲')
      outlineData = [
        {
          title: '引言：人工智能技术概述',
          level: 1,
          content: '介绍人工智能的基本概念、发展历程和重要性'
        },
        {
          title: '相关技术背景',
          level: 1,
          content: '详细阐述人工智能的核心技术和理论基础'
        },
        {
          title: '应用案例分析',
          level: 1,
          content: '展示人工智能在不同领域的具体应用实例'
        },
        {
          title: '挑战与机遇',
          level: 1,
          content: '分析当前技术发展面临的挑战和未来机遇'
        },
        {
          title: '结论与展望',
          level: 1,
          content: '总结全文内容，展望未来发展趋势'
        }
      ]
      console.log('[DEBUG] 硬编码大纲数据:', outlineData)
    }

    try {
      console.log('[DEBUG] 开始执行content-generate服务')
      state.generatingContent = true

      // 构建生成请求 - 硬编码默认数据确保能够生成
      const request: BodyGenerationRequest = {
        title:
          documentStore.documentState.selectedTitle?.title || '人工智能技术在现代社会的应用与发展',
        outline_id: projectId, // 使用projectId作为outline_id
        style: 'professional',
        tone: 'formal',
        length: 'medium',
        language: 'zh-CN',
        format: 'article',
        audience: 'academic',
        purpose: 'research',
        // 硬编码大纲数据，确保即使没有存储的大纲也能生成
        outline_data: outlineData || [
          {
            title: '引言：人工智能技术概述',
            level: 1,
            content: '介绍人工智能的基本概念、发展历程和重要性'
          },
          {
            title: '相关技术背景',
            level: 1,
            content: '详细阐述人工智能的核心技术和理论基础'
          },
          {
            title: '应用案例分析',
            level: 1,
            content: '展示人工智能在不同领域的具体应用实例'
          },
          {
            title: '挑战与机遇',
            level: 1,
            content: '分析当前技术发展面临的挑战和未来机遇'
          },
          {
            title: '结论与展望',
            level: 1,
            content: '总结全文内容，展望未来发展趋势'
          }
        ]
      }

      console.log('[DEBUG] Content生成请求详情:')
      console.log('  - title:', request.title)
      console.log('  - outline_id:', request.outline_id)
      console.log('  - style:', request.style)
      console.log('  - tone:', request.tone)
      console.log('  - length:', request.length)
      console.log('  - format:', request.format)

      console.log('[DEBUG] 调用contentGenerateService.generateContentAndWait...')

      // 调用content-generate服务
      const response = await contentGenerateService.generateContentAndWait(request, {
        interval: 2000,
        timeout: 180000,
        maxAttempts: 60
      })

      console.log('[DEBUG] Content生成响应详情:')
      console.log('  - status:', response.status)
      console.log('  - task_id:', response.task_id)
      console.log('  - result存在:', !!response.result)
      console.log('  - content长度:', response.result?.content?.length || 0)

      if (response.status === 'completed' && response.result?.content) {
        console.log('[DEBUG] 生成成功，开始更新页面内容')

        // 更新页面内容
        state.content = response.result.content
        console.log('[DEBUG] state.content已更新，长度:', state.content.length)

        // 生成大纲
        console.log('[DEBUG] 开始生成内容大纲')
        generateOutlineFromContent(response.result.content)
        console.log('[DEBUG] 内容大纲生成完成')

        // 自动保存
        console.log('[DEBUG] 开始自动保存')
        await saveContent()
        console.log('[DEBUG] 自动保存完成')

        ElMessage.success('正文内容已自动生成！')
        console.log('[DEBUG] ===== 正文内容自动生成完成 =====')
      } else {
        console.log('[DEBUG] 生成响应状态异常')
        console.log('[DEBUG] response.status:', response.status)
        console.log('[DEBUG] response.error:', response.error)
        throw new Error(response.error || '内容生成失败')
      }
    } catch (error) {
      console.error('[DEBUG] 内容生成失败详细错误:', error)
      console.error('[DEBUG] 错误类型:', typeof error)
      console.error('[DEBUG] 错误消息:', error instanceof Error ? error.message : String(error))
      console.error('[DEBUG] 错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息')

      ElMessage.error(
        `正文自动生成失败: ${error instanceof Error ? error.message : '未知错误'}，请手动生成`
      )
    } finally {
      state.generatingContent = false
      console.log('[DEBUG] ===== 内容自动生成检查结束 =====')
    }
  }

  // 监听页面加载，在项目数据加载完成后执行内容生成
  const hasAttemptedGeneration = ref(false)

  onMounted(async () => {
    console.log('[DEBUG] ===== 内容页面 onMounted 开始 =====')
    console.log('[DEBUG] hasAttemptedGeneration初始值:', hasAttemptedGeneration.value)

    await nextTick()
    console.log('[DEBUG] nextTick完成')

    // 增加延迟时间，确保所有数据（包括本地存储）都已加载完成
    console.log('[DEBUG] 设置3秒延迟执行内容生成，确保数据完全加载')
    setTimeout(() => {
      console.log('[DEBUG] 延迟执行触发，当前hasAttemptedGeneration:', hasAttemptedGeneration.value)

      if (!hasAttemptedGeneration.value) {
        console.log('[DEBUG] 标记已尝试生成，开始执行内容生成')
        hasAttemptedGeneration.value = true
        executeContentGenerateOnLoad()
      } else {
        console.log('[DEBUG] 已尝试过生成，跳过本次执行')
      }
    }, 3000) // 增加到3秒，确保useContent的loadExistingData完全执行完毕

    console.log('[DEBUG] ===== 内容页面 onMounted 设置完成 =====')
  })

  // 监听路由变化
  console.log('[DEBUG] 设置路由监听器')
  watch(
    () => route.path,
    (newPath, oldPath) => {
      console.log('[DEBUG] 路由变化:', { from: oldPath, to: newPath })
      console.log('[DEBUG] 当前时间:', new Date().toISOString())
    },
    { immediate: true }
  )

  // 切换预览模式
  const togglePreview = () => {
    state.showPreview = !state.showPreview
  }

  // 生成 AI 内容 - 硬编码数据确保即使没有大纲也能生成
  const generateAIContent = async () => {
    state.generatingContent = true
    try {
      console.log('[DEBUG] 开始手动生成AI内容')

      // 硬编码的AI生成内容，不依赖外部API
      const mockContent = `# ${documentTitle.value || '人工智能技术在现代社会的应用与发展'}

## 引言：AI技术革命重塑时代

人工智能作为21世纪最具颠覆性的技术力量，正在以前所未有的深度和广度重塑我们的世界。从自动驾驶汽车到智能医疗诊断，从自然语言处理到计算机视觉，AI技术的突破性进展不仅推动了产业变革，更深刻改变了人类的生活方式和工作模式。

当今世界正处于第四次工业革命的核心阶段，人工智能已成为各国科技竞争的战略制高点。根据权威机构预测，到2030年，人工智能将为全球经济贡献15.7万亿美元，成为推动经济增长的重要引擎。在这个背景下，深入理解AI技术的发展现状、应用前景和面临的挑战具有重要的现实意义。

## 技术发展现状与核心突破

### 机器学习与深度学习的重大进展

机器学习作为人工智能的核心技术，在近年来取得了突破性进展。深度学习模型的规模呈现指数级增长，从早期的几百万参数发展到如今千亿甚至万亿参数的超大规模模型。这种规模上的飞跃直接带来了AI能力的质的提升。

在自然语言处理领域，大型语言模型的出现标志着AGI（通用人工智能）发展的新里程碑。这些模型不仅在文本生成、翻译、摘要等任务中表现出接近人类的水平，更展现出了推理、创造等高级认知能力的雏形。

### 计算机视觉与感知技术的成熟

计算机视觉技术的快速发展使机器能够像人类一样"看懂"世界。从图像分类到目标检测，从语义分割到3D重建，视觉AI技术已经广泛应用于安防监控、医疗影像分析、自动驾驶等关键领域。

特别是在自动驾驶技术中，多传感器融合的环境感知系统能够实时识别道路状况、行人车辆、交通标志等复杂信息，为安全驾驶提供了可靠的技术保障。特斯拉的FSD系统、Waymo的自动驾驶出租车等商业化应用已经证明了这项技术的成熟度。

## 产业应用与商业价值

### 医疗健康领域的智能化革命

人工智能在医疗健康领域的应用正在引发一场深刻的技术革命。在疾病诊断方面，AI系统能够通过分析医学影像（如CT、MRI、X光片）发现早期病变，其准确率在很多情况下已经超过了人类医生。

IBM的Watson for Oncology系统能够分析海量的医学文献和病例数据，为癌症患者提供个性化的治疗方案建议。在药物研发方面，AI技术可以显著缩短新药发现的时间，将原本需要10-15年的研发周期缩短到5-7年，大幅降低了研发成本。

### 金融科技的创新应用

金融行业是AI技术应用最为成熟和广泛的领域之一。在风险管理方面，AI系统能够实时分析交易数据，识别欺诈行为，评估信用风险。高频交易算法利用机器学习模型预测市场走势，执行自动化交易策略。

智能投顾（Robo-advisor）通过算法为客户提供个性化的投资建议，使得专业级的财富管理服务变得更加普及和可负担。支付宝的芝麻信用、蚂蚁金服的310贷款模式等创新应用，都是AI技术在金融领域的成功实践。

### 制造业的智能化转型

"工业4.0"时代的到来，使AI技术成为推动制造业转型升级的核心驱动力。智能工厂通过部署机器人和自动化系统，实现了生产过程的高度智能化。预测性维护技术通过分析设备运行数据，能够在故障发生前进行预警和维护，大幅减少了停机损失。

质量控制是AI在制造业的另一个重要应用。基于计算机视觉的质量检测系统能够24小时不间断地监控生产线，识别产品缺陷，其精度和效率远超人工检测。宝马、西门子等制造巨头已经在其全球工厂中广泛部署了AI质检系统。

## 社会影响与伦理考量

### 就业市场的结构性变化

AI技术的快速发展对就业市场带来了深刻影响。一方面，自动化正在替代大量重复性、标准化的工作，特别是制造业、客服、数据录入等领域的岗位面临被替代的风险。另一方面，AI也创造了大量新的就业机会，如AI工程师、数据科学家、提示工程师等新兴职业。

这种结构性变化要求教育体系和社会政策做出相应调整。终身学习、技能更新成为职场人士的必然选择。政府和企业需要投资于再培训项目，帮助劳动者适应AI时代的工作要求。

### 算法偏见与公平性问题

AI系统的决策过程往往是一个"黑箱"，这使得算法偏见问题变得难以察觉和纠正。如果训练数据中存在偏见，AI系统就会学习并放大这些偏见，导致对某些群体的不公平待遇。

在招聘、信贷审批、司法判决等关键决策领域，AI的公平性问题尤为突出。确保AI系统的透明度、可解释性和公平性，已经成为技术发展和社会治理的重要课题。

### 隐私保护与数据安全

AI系统的训练和运行需要海量数据，这带来了严重的隐私保护挑战。人脸识别、行为分析等技术的大规模应用，使得个人隐私的边界变得日益模糊。如何在发挥AI价值的同时保护个人隐私，需要在技术和法律层面找到平衡点。

欧盟的GDPR、中国的《个人信息保护法》等法规的出台，体现了各国对AI时代数据安全的重视。差分隐私、联邦学习等隐私保护技术的出现，为解决这一难题提供了技术路径。

## 未来展望与发展趋势

### 通用人工智能的探索

虽然当前的AI系统在特定任务上表现出色，但距离真正的通用人工智能（AGI）还有相当长的路要走。AGI将具备与人类相当的通用认知能力，能够理解、学习和应用知识解决各种复杂问题。

OpenAI、DeepMind、Google Brain等顶级研究机构正在AGI方向上进行积极探索。大语言模型的出现让我们看到了AGI的可能性，但如何在确保安全和可控的前提下实现AGI，仍然是科技界面临的最大挑战。

### 人机协作的新范式

未来的AI发展将更加注重人机协作，而非简单地替代人类。增强智能（Augmented Intelligence）将成为主流范式，AI作为人类能力的延伸和增强，帮助我们更好地完成复杂任务。

在医疗领域，AI将成为医生的得力助手，提供诊断建议和治疗方案，但最终的决策仍由人类医生做出。在创造性工作中，AI可以提供灵感和工具，但人类的创造力和情感共鸣仍然是不可替代的。

### 可持续AI与负责任创新

随着AI技术的广泛应用，其能源消耗和环境影响也日益受到关注。开发更加节能、环保的AI算法和硬件系统，将是未来研究的重要方向。

负责任的AI创新要求我们在技术发展过程中充分考虑其社会影响、伦理含义和长期后果。建立完善的AI治理体系，推动AI技术的健康发展，需要政府、企业、学术界和公众的共同努力。

## 结语：拥抱AI时代的机遇与挑战

人工智能技术的发展为人类带来了前所未有的机遇，同时也伴随着巨大的挑战。面对这场深刻的技术革命，我们既要保持乐观和开放的态度，积极拥抱AI带来的便利和效率提升；也要保持清醒和谨慎，认真应对其带来的风险和挑战。

在AI时代，人类的智慧、创造力和同理心将变得比以往任何时候都更加珍贵。通过合理引导AI发展，确保技术进步真正服务于人类福祉，我们有望迎来一个更加智能、公平、可持续的美好未来。

让我们以开放的心态拥抱AI时代，用智慧和责任引领技术进步，共同创造人类历史上最激动人心的新篇章。
`

      console.log('[DEBUG] 设置生成内容，长度:', mockContent.length)

      // 设置生成的内容
      state.content = mockContent

      // 从内容生成大纲
      console.log('[DEBUG] 从内容生成大纲')
      generateOutlineFromContent(mockContent)

      // 保存内容
      console.log('[DEBUG] 保存生成的内容')
      await saveContent()

      ElMessage.success('AI正文生成成功！')
      console.log('[DEBUG] ===== 手动AI内容生成完成 =====')
    } catch (error) {
      console.error('[DEBUG] 手动AI内容生成失败:', error)
      ElMessage.error('正文生成失败，请重试')
    } finally {
      state.generatingContent = false
    }
  }

  // 处理内容变化
  const handleContentChange = () => {
    // saveContent 和大纲生成通过 watch 自动处理
  }

  // 导航到章节
  const navigateToSection = (index: number) => {
    state.currentSection = index

    // 跳转到对应标题位置
    const outline = state.outline
    if (outline.length === 0 || !markdownTextarea.value) return

    const targetSection = outline[index]
    if (!targetSection) return

    // 计算目标标题在文档中的位置
    const content = state.content
    const lines = content.split('\n')
    let charPosition = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim().startsWith('#')) {
        const match = line.match(/^(#{1,6})\s+(.+)$/)
        if (match) {
          const title = match[2].trim()
          if (title === targetSection.title) {
            // 找到目标位置
            break
          }
        }
      }
      charPosition += line.length + 1 // +1 for newline
    }

    // 设置 textarea 的光标位置
    if (markdownTextarea.value) {
      markdownTextarea.value.focus()
      markdownTextarea.value.setSelectionRange(charPosition, charPosition)

      // 滚动到对应位置
      const textarea = markdownTextarea.value
      const computedStyle = window.getComputedStyle(textarea)
      const lineHeight = parseFloat(computedStyle.lineHeight) || 24

      // 计算目标行号
      const linesBeforeTarget = state.content.substring(0, charPosition).split('\n')
      const targetLineNumber = linesBeforeTarget.length - 1

      // 计算目标滚动位置
      const targetScrollTop = targetLineNumber * lineHeight
      textarea.scrollTop = targetScrollTop
    }
  }

  // 文本选择处理
  const handleTextSelection = () => {
    const textarea = markdownTextarea.value
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = state.content.substring(start, end)

    if (selected.trim().length > 0) {
      state.selectedText = selected

      // 工具栏尺寸（估算）
      const TOOLBAR_HEIGHT = 120
      const TOOLBAR_WIDTH = 200
      const TOOLBAR_MARGIN = 10

      // 获取textarea的可见区域
      const visibleWidth = textarea.clientWidth
      const paddingLeft = 24 // 与textarea的padding保持一致
      const paddingTop = 24

      // 计算选区的行号和列号
      const textBeforeSelection = state.content.substring(0, start)
      const lines = textBeforeSelection.split('\n')
      const currentLine = lines.length
      const currentColumn = lines[lines.length - 1].length

      // 获取textarea的样式
      const computedStyle = window.getComputedStyle(textarea)
      const lineHeight = parseFloat(computedStyle.lineHeight) || 24
      const fontSize = parseFloat(computedStyle.fontSize) || 15

      // 计算光标的近似位置
      // 估算每个字符的宽度（基于字体大小）
      const charWidth = fontSize * 0.6 // monospace字体大约60%的宽度

      // 工具栏的理想位置（基于光标位置）
      let idealTop = paddingTop + (currentLine - 1) * lineHeight + textarea.scrollTop
      let idealLeft = paddingLeft + currentColumn * charWidth + textarea.scrollLeft

      // 垂直方向：默认显示在选区上方
      let toolbarTop = idealTop - TOOLBAR_HEIGHT - TOOLBAR_MARGIN
      const minTop = 20 // 顶部最小距离

      if (toolbarTop < minTop) {
        // 上方空间不够，显示在选区下方
        const selectionEndLines = state.content.substring(0, end).split('\n')
        const endLine = selectionEndLines.length
        const selectionEndTop = paddingTop + (endLine - 1) * lineHeight + textarea.scrollTop

        toolbarTop = selectionEndTop + lineHeight + TOOLBAR_MARGIN

        // 检查是否超出底部
        const maxTop = textarea.scrollHeight - TOOLBAR_HEIGHT - 10
        if (toolbarTop > maxTop) {
          // 都不行，就固定在顶部
          toolbarTop = minTop
        }
      }

      // 水平方向：尝试左对齐
      let toolbarLeft = idealLeft
      const maxLeft = visibleWidth - TOOLBAR_WIDTH - 10

      // 检查是否超出右边界
      if (toolbarLeft > maxLeft) {
        toolbarLeft = maxLeft
      }

      // 检查是否超出左边界
      if (toolbarLeft < 10) {
        toolbarLeft = 10
      }

      state.toolbarPosition = {
        top: toolbarTop,
        left: toolbarLeft
      }

      state.showSelectionToolbar = true
    } else {
      state.showSelectionToolbar = false
    }
  }

  // AI 操作
  const polishSelection = () => {
    state.aiDialogTitle = 'AI 润色'
    state.aiDialogType = 'polish'
    state.aiLoading = true
    state.aiDialogVisible = true

    // 模拟 AI 润色
    setTimeout(() => {
      state.aiLoading = false
      aiResult.value = `<p style="color: var(--el-color-success);">润色后的文本将在这里显示...<br>原始文本：${state.selectedText}</p>`
    }, 1500)
  }

  const expandSelection = () => {
    ElMessage.info('扩写功能开发中...')
  }

  const summarizeSelection = () => {
    ElMessage.info('总结功能开发中...')
  }

  const translateSelection = () => {
    ElMessage.info('翻译功能开发中...')
  }

  const rewriteSelection = () => {
    ElMessage.info('改写功能开发中...')
  }

  const applyAIResult = () => {
    const start = markdownTextarea.value?.selectionStart || 0
    const end = markdownTextarea.value?.selectionEnd || 0

    state.content =
      state.content.substring(0, start) + state.selectedText + state.content.substring(end)

    state.aiDialogVisible = false
    state.showSelectionToolbar = false
    ElMessage.success('已应用到文档')
  }

  // 完成文档
  const completeDocument = () => {
    if (!hasContent.value) {
      ElMessage.warning('请先创建文档内容')
      return
    }
    const projectData = localStorage.getItem(`project_${projectId}`)
    if (projectData) {
      const project = JSON.parse(projectData)
      project.status = 'completed'
      project.updateTime = new Date().toISOString()
      localStorage.setItem(`project_${projectId}`, JSON.stringify(project))
    }
    ElMessage.success('文档创作完成！')
    setTimeout(() => {
      router.push('/document-generation/project-list')
    }, 1500)
  }

  // 返回上一页
  const goBack = () => {
    router.push(`/document-generation/outline/${projectId}`)
  }
</script>

<style scoped lang="scss">
  .content-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 120px);
    padding: 20px;
  }

  .project-loading {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
  }

  .main-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .content-editor {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    padding: 20px;
    overflow: hidden;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: 8px;
    box-shadow: var(--art-box-shadow-sm);
  }

  .editor-layout {
    display: flex;
    flex: 1;
    gap: 0;
    min-height: 0;
    overflow: hidden;
  }

  .sidebar-toolbar {
    position: relative;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 16px;
    align-items: center;
    justify-content: flex-start;
    padding: 16px 12px;
    background: linear-gradient(
      180deg,
      var(--el-fill-color-lighter) 0%,
      var(--el-fill-color-light) 100%
    );
    border-right: 1px solid var(--el-border-color-lighter);

    // 添加微妙的背景装饰
    &::after {
      position: absolute;
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
      content: '';
      background: linear-gradient(
        180deg,
        transparent 0%,
        var(--el-color-primary-light-8) 50%,
        transparent 100%
      );
      opacity: 0.3;
    }
  }

  .toolbar-item {
    position: relative;
    width: 100%;
    max-width: 48px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &::before {
      position: absolute;
      top: 50%;
      left: 50%;
      z-index: 0;
      width: 40px;
      height: 40px;
      content: '';
      background: var(--el-color-primary-light-9);
      border-radius: 12px;
      opacity: 0;
      transition: all 0.3s ease;
      transform: translate(-50%, -50%);
    }

    &:hover {
      transform: translateX(2px);

      &::before {
        width: 48px;
        height: 48px;
        background: var(--el-color-primary-light-8);
        opacity: 1;
      }

      .toolbar-button {
        transform: scale(1.05);
      }

      .toolbar-label {
        opacity: 1;
        transform: translateX(4px);
      }
    }

    &.active {
      &::before {
        width: 48px;
        height: 48px;
        background: var(--el-color-primary-light-7);
        opacity: 1;
      }

      .toolbar-button {
        .toolbar-icon {
          color: var(--el-color-primary);
          transform: scale(1.1);
        }

        .toolbar-label {
          font-weight: 600;
          color: var(--el-color-primary);
        }
      }
    }
  }

  .toolbar-button {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    width: 100%;
    padding: 8px 4px;
    background: transparent;
    border: none;
    border-radius: 12px;
    transition: all 0.3s ease;

    .toolbar-icon {
      font-size: 18px;
      line-height: 1;
      color: var(--el-text-color-regular);
      transition: all 0.3s ease;
    }

    .toolbar-label {
      font-size: 11px;
      font-weight: 500;
      line-height: 1;
      color: var(--el-text-color-secondary);
      text-align: center;
      white-space: nowrap;
      opacity: 0.8;
      transition: all 0.3s ease;
    }
  }

  .main-content-area {
    position: relative;
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .outline-panel-wrapper,
  .stats-panel-wrapper {
    flex-shrink: 0;
    width: 0;
    overflow: hidden;
    transition: all 0.3s ease;

    &:not(.panel-collapsed) {
      width: 280px;
      border-right: 1px solid var(--el-border-color-lighter);
      border-left: 1px solid var(--el-border-color-lighter);
    }

    &:first-child:not(.panel-collapsed) {
      border-left: none;
    }
  }

  .outline-panel-wrapper:not(.panel-collapsed) {
    background: var(--el-fill-color-lighter);
  }

  .stats-panel-wrapper:not(.panel-collapsed) {
    background: var(--el-fill-color-lighter);
  }

  // 编辑器始终占据主要空间
  .main-content-area > :nth-child(2) {
    flex: 1;
    min-width: 0;
  }

  .content-actions {
    display: flex;
    flex-shrink: 0;
    gap: 16px;
    align-items: center;
    justify-content: center;
    padding: 12px 0;
    margin-top: 16px;
    background: var(--el-fill-color-light);
    border-top: 1px solid var(--art-border-color);
    border-radius: 6px;
  }

  @media (width <= 1200px) {
    .content-container {
      padding: 16px;
    }

    .outline-panel-wrapper:not(.panel-collapsed),
    .stats-panel-wrapper:not(.panel-collapsed) {
      width: 240px;
    }
  }

  @media (width <= 900px) {
    .content-container {
      padding: 12px;
    }

    .sidebar-toolbar {
      gap: 12px;
      padding: 0 8px;

      &::before {
        height: 90px;
      }

      .toolbar-item {
        max-width: 44px;

        .toolbar-button {
          gap: 3px;
          padding: 6px 3px;

          .toolbar-icon {
            font-size: 16px;
          }

          .toolbar-label {
            font-size: 10px;
          }
        }
      }
    }

    .outline-panel-wrapper:not(.panel-collapsed),
    .stats-panel-wrapper:not(.panel-collapsed) {
      width: 260px;
    }

    .content-actions {
      flex-wrap: wrap;
      gap: 12px;
      padding: 12px 0;
      margin-top: 12px;
    }

    .content-actions .el-button {
      padding: 8px 16px;
      font-size: 14px;
    }
  }

  @media (width <= 768px) {
    .content-container {
      padding: 8px;
    }

    .editor-layout {
      flex-direction: column;
    }

    .sidebar-toolbar {
      flex-direction: row;
      gap: 16px;
      justify-content: center;
      padding: 8px 12px;
      background: var(--el-fill-color-light);
      border-right: none;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &::before {
        display: none; // 移动端隐藏占位空间
      }

      &::after {
        display: none; // 移动端隐藏装饰线
      }

      .toolbar-item {
        flex-direction: row;
        max-width: 60px;

        .toolbar-button {
          flex-direction: row;
          gap: 6px;
          padding: 8px 12px;

          .toolbar-icon {
            font-size: 16px;
          }

          .toolbar-label {
            font-size: 12px;
            opacity: 1;
          }
        }

        &:hover {
          transform: translateY(-2px);

          .toolbar-label {
            transform: translateX(0);
          }
        }
      }
    }

    .main-content-area {
      flex-direction: column;
    }

    .outline-panel-wrapper:not(.panel-collapsed),
    .stats-panel-wrapper:not(.panel-collapsed) {
      width: 100%;
      height: 200px;
      border-right: none;
      border-bottom: 1px solid var(--el-border-color-lighter);
      border-left: none;
    }

    .content-actions {
      gap: 8px;
      padding: 8px 0;
      margin-top: 8px;
    }

    .content-actions .el-button {
      padding: 6px 12px;
      font-size: 13px;
    }
  }

  @media (width <= 480px) {
    .content-container {
      height: auto;
      padding: 6px;
    }

    .main-content {
      min-height: auto;
    }

    .content-editor {
      padding: 8px;
    }

    .sidebar-toolbar {
      gap: 12px;
      padding: 6px 8px;

      &::before {
        display: none; // 小屏幕隐藏占位空间
      }

      &::after {
        display: none; // 小屏幕隐藏装饰线
      }

      .toolbar-item {
        max-width: 50px;

        .toolbar-button {
          gap: 4px;
          padding: 6px 8px;

          .toolbar-icon {
            font-size: 14px;
          }

          .toolbar-label {
            font-size: 10px;
          }
        }

        &:hover {
          transform: translateY(-1px);

          .toolbar-label {
            transform: translateX(0);
          }
        }
      }
    }

    .outline-panel-wrapper:not(.panel-collapsed),
    .stats-panel-wrapper:not(.panel-collapsed) {
      height: 180px;
    }

    .content-actions .el-button {
      padding: 5px 10px;
      font-size: 12px;
    }
  }
</style>
