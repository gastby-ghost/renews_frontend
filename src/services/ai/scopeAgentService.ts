/**
 * AI范围界定代理服务 - 基于OpenAPI配置
 * 专门服务于项目范围界定和边界定义功能
 * 支持Mock/真实API切换
 */

import BaseApiService from '../base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import {
  AsyncTaskPoller,
  type PollingConfig,
  type PollingTask,
  TaskStatus
} from '@/utils/polling/asyncTaskPoller'
import { MockTaskTracker, MockDataManager } from '@/mock'

// 范围界定代理相关类型
interface ScopeDefinitionRequest {
  project_brief: string
  objectives?: string[]
  constraints?: string[]
  assumptions?: string[]
  deliverables?: string[]
  stakeholders?: string[]
  timeline?: {
    start_date?: string
    end_date?: string
    milestones?: string[]
  }
  resources?: {
    budget?: number
    team_size?: number
    skills?: string[]
  }
  scope_level?: 'high' | 'medium' | 'detailed'
  industry_domain?: string
  complexity_level?: 'simple' | 'moderate' | 'complex'
}

interface ScopeDefinitionResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    scope_definition: {
      project_title: string
      core_objectives: Array<{
        objective: string
        priority: 'high' | 'medium' | 'low'
        measurable_outcomes: string[]
      }>
      scope_boundaries: {
        in_scope: string[]
        out_of_scope: string[]
        assumptions: string[]
        constraints: string[]
      }
      deliverables: Array<{
        name: string
        description: string
        acceptance_criteria: string[]
        estimated_effort: string
      }>
      success_metrics: Array<{
        metric: string
        target: string
        measurement_method: string
      }>
    }
    risk_assessment: {
      high_risks: Array<{
        risk: string
        probability: 'high' | 'medium' | 'low'
        impact: 'high' | 'medium' | 'low'
        mitigation_strategy: string
      }>
      medium_risks: string[]
      low_risks: string[]
    }
    timeline_recommendation: {
      phases: Array<{
        phase: string
        duration: string
        key_activities: string[]
        deliverables: string[]
      }>
      total_duration: string
      critical_path: string[]
    }
  }
  error?: string
  created_at: string
  updated_at: string
}

class ScopeAgentService extends BaseApiService {
  private taskTracker = new MockTaskTracker()
  private dataManager = new MockDataManager()

  constructor() {
    super('scopeAgent')
  }

  // ============= 范围界定代理服务 =============

  /**
   * 执行范围界定分析
   * @param request 范围界定请求参数
   * @param options API请求选项
   * @returns 范围界定任务响应
   */
  async defineProjectScope(request: ScopeDefinitionRequest, options?: ApiRequestConfig) {
    return this.post<ScopeDefinitionResponse>('/scope-agent/define', request, options)
  }

  /**
   * 获取范围界定任务状态
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 任务状态
   */
  async getScopeTaskStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get<ScopeDefinitionResponse>(`/scope-agent/tasks/${taskId}`, undefined, options)
  }

  /**
   * 取消范围界定任务
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 取消结果
   */
  async cancelScopeTask(taskId: string, options?: ApiRequestConfig) {
    return this.delete(`/scope-agent/tasks/${taskId}`, undefined, options)
  }

  /**
   * 更新范围定义
   * @param taskId 任务ID
   * @param updateData 更新数据
   * @param options API请求选项
   * @returns 更新结果
   */
  async updateScopeDefinition(
    taskId: string,
    updateData: {
      project_brief?: string
      objectives?: string[]
      constraints?: string[]
      deliverables?: string[]
    },
    options?: ApiRequestConfig
  ) {
    return this.put(`/scope-agent/scopes/${taskId}`, updateData, options)
  }

  /**
   * 验证范围定义
   * @param scopeDefinition 范围定义数据
   * @param options API请求选项
   * @returns 验证结果
   */
  async validateScopeDefinition(scopeDefinition: any, options?: ApiRequestConfig) {
    return this.post('/scope-agent/validate', { scope_definition: scopeDefinition }, options)
  }

  /**
   * 导出范围定义文档
   * @param taskId 任务ID
   * @param format 导出格式
   * @param options API请求选项
   * @returns 导出结果
   */
  async exportScopeDefinition(
    taskId: string,
    format: 'pdf' | 'docx' | 'json' | 'markdown',
    options?: ApiRequestConfig
  ) {
    return this.get(`/scope-agent/export/${taskId}`, { format }, options)
  }

  /**
   * 启动范围界定并轮询完成
   * @param request 范围界定请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务结果
   */
  async defineProjectScopeWithPolling(
    request: ScopeDefinitionRequest,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.defineProjectScope(request)
    const taskId = (response as any).task_id

    if (!taskId) {
      throw new Error('范围界定任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getScopeTaskStatus(taskId).then((result) => ({
          status: (result as any).status || TaskStatus.RUNNING,
          data: result,
          isCompleted: (result as any).status === TaskStatus.COMPLETED
        })),
      {
        interval: 3000,
        timeout: 180000,
        maxAttempts: 60,
        ...pollingConfig
      }
    )

    return poller.start(`scope-agent-${taskId}`)
  }

  /**
   * 启动范围界定并等待完成
   * @param request 范围界定请求参数
   * @param pollingConfig 轮询配置
   * @returns 范围界定结果
   */
  async defineProjectScopeAndWait(
    request: ScopeDefinitionRequest,
    pollingConfig?: PollingConfig
  ): Promise<ScopeDefinitionResponse> {
    const task = await this.defineProjectScopeWithPolling(request, pollingConfig)
    const result = await task.promise

    if (result.status !== TaskStatus.COMPLETED) {
      throw new Error(`范围界定任务失败: ${result.error}`)
    }

    return result.data as ScopeDefinitionResponse
  }

  /**
   * 快速范围界定
   * @param projectBrief 项目简介
   * @param options 界定选项
   * @param pollingConfig 轮询配置
   * @returns 界定结果
   */
  async quickScopeDefinition(
    projectBrief: string,
    options?: {
      scope_level?: 'high' | 'medium' | 'detailed'
      industry_domain?: string
      complexity_level?: 'simple' | 'moderate' | 'complex'
    },
    pollingConfig?: PollingConfig
  ): Promise<ScopeDefinitionResponse> {
    const request: ScopeDefinitionRequest = {
      project_brief: projectBrief,
      scope_level: options?.scope_level || 'medium',
      industry_domain: options?.industry_domain,
      complexity_level: options?.complexity_level || 'moderate'
    }

    return this.defineProjectScopeAndWait(request, pollingConfig)
  }

  /**
   * 生成范围界定代理状态Mock数据
   */
  private generateScopeAgentStatus() {
    return this.dataManager.getMockData('scope-agent-status', () => ({
      service_status: 'available',
      active_tasks: Math.floor(Math.random() * 2) + 1,
      max_concurrent_tasks: 2,
      average_processing_time: Math.floor(Math.random() * 40) + 60,
      supported_scope_levels: ['high', 'medium', 'detailed'],
      supported_complexity_levels: ['simple', 'moderate', 'complex'],
      supported_industries: [
        'technology',
        'healthcare',
        'finance',
        'manufacturing',
        'retail',
        'education',
        'government',
        'energy'
      ],
      performance_metrics: {
        success_rate: Math.random() * 0.1 + 0.9, // 90-100%
        average_scope_score: Math.random() * 0.3 + 0.7, // 70-100%
        daily_scope_definitions: Math.floor(Math.random() * 25) + 10,
        average_definition_quality: Math.random() * 0.2 + 0.8
      },
      agent_features: {
        intelligent_analysis: true,
        risk_assessment: true,
        timeline_planning: true,
        stakeholder_analysis: true,
        resource_estimation: true
      },
      mock: true,
      timestamp: Date.now()
    }))
  }

  /**
   * 生成范围界定响应Mock数据
   */
  private generateScopeDefinitionResponse(requestData: ScopeDefinitionRequest) {
    const taskId = `scope_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // 创建任务记录
    const task = this.taskTracker.createTask(taskId, {
      project_brief: requestData.project_brief,
      scope_level: requestData.scope_level || 'medium',
      complexity_level: requestData.complexity_level || 'moderate',
      industry_domain: requestData.industry_domain
    })

    return {
      task_id: taskId,
      status: task.status,
      created_at: new Date(task.createdAt).toISOString(),
      updated_at: new Date(task.updatedAt).toISOString(),
      estimated_completion_time: this.calculateScopeDefinitionTime(
        requestData.scope_level || 'medium',
        requestData.complexity_level || 'moderate'
      ),
      mock: true,
      request_info: {
        project_brief: requestData.project_brief,
        scope_level: requestData.scope_level || 'medium',
        complexity_level: requestData.complexity_level || 'moderate',
        industry_domain: requestData.industry_domain,
        objectives_count: requestData.objectives?.length || 0,
        deliverables_count: requestData.deliverables?.length || 0
      }
    }
  }

  /**
   * 获取范围界定任务状态Mock数据
   */
  private getScopeTaskStatusMock(taskId: string) {
    let task = this.taskTracker.getTaskStatus(taskId)

    if (!task) {
      // 如果任务不存在，创建一个模拟任务
      task = this.taskTracker.createTask(taskId, {
        project_brief: '示例项目范围界定',
        scope_level: 'medium',
        complexity_level: 'moderate'
      })
    }

    // 基于时间更新任务状态
    const updatedTask = this.taskTracker.updateTaskByTime(taskId, (_elapsed, task) => {
      if (task.status === 'completed') {
        return {
          result: this.generateScopeDefinitionResult(task)
        }
      }
      return {}
    })

    if (!updatedTask) {
      throw new Error(`Failed to update task ${taskId}`)
    }

    return {
      task_id: taskId,
      status: updatedTask.status,
      progress: updatedTask.progress,
      result: updatedTask.result,
      error: updatedTask.error,
      created_at: new Date(updatedTask.createdAt).toISOString(),
      updated_at: new Date(updatedTask.updatedAt).toISOString(),
      mock: true
    }
  }

  /**
   * 生成范围界定结果Mock数据
   */
  private generateScopeDefinitionResult(task: any) {
    const requestData = task.result || {}
    const projectBrief = requestData.project_brief || '示例项目'
    const scopeLevel = requestData.scope_level || 'medium'
    const complexityLevel = requestData.complexity_level || 'moderate'
    const industryDomain = requestData.industry_domain || 'technology'

    return {
      scope_definition: this.generateScopeDefinition(
        projectBrief,
        scopeLevel,
        complexityLevel,
        industryDomain
      ),
      risk_assessment: this.generateRiskAssessment(complexityLevel),
      timeline_recommendation: this.generateTimelineRecommendation(scopeLevel, complexityLevel),
      resource_estimation: this.generateResourceEstimation(scopeLevel, complexityLevel),
      stakeholder_analysis: this.generateStakeholderAnalysis(),
      quality_metrics: {
        clarity_score: Math.random() * 1.5 + 7.5, // 7.5-9分
        completeness_score: Math.random() * 1.5 + 7.5,
        feasibility_score: Math.random() * 2 + 7,
        accuracy_score: Math.random() * 1.5 + 7.5
      },
      improvement_suggestions: this.generateImprovementSuggestions(scopeLevel, complexityLevel)
    }
  }

  /**
   * 生成范围定义内容
   */
  private generateScopeDefinition(
    projectBrief: string,
    scopeLevel: string,
    complexityLevel: string,
    industryDomain: string
  ) {
    const projectTitle = this.generateProjectTitle(projectBrief, industryDomain)

    return {
      project_title: projectTitle,
      core_objectives: this.generateCoreObjectives(scopeLevel),
      scope_boundaries: this.generateScopeBoundaries(scopeLevel, complexityLevel),
      deliverables: this.generateDeliverables(scopeLevel, complexityLevel),
      success_metrics: this.generateSuccessMetrics(scopeLevel),
      assumptions: this.generateAssumptions(complexityLevel),
      constraints: this.generateConstraints(complexityLevel)
    }
  }

  /**
   * 生成核心目标
   */
  private generateCoreObjectives(scopeLevel: string) {
    const baseObjectives = [
      {
        objective: '提升运营效率',
        priority: 'high' as const,
        measurable_outcomes: ['流程效率提升30%', '成本降低20%']
      },
      {
        objective: '增强用户体验',
        priority: 'high' as const,
        measurable_outcomes: ['用户满意度提升25%', '支持响应时间减少50%']
      },
      {
        objective: '实现技术创新',
        priority: 'medium' as const,
        measurable_outcomes: ['技术架构升级', '引入新技术栈']
      },
      {
        objective: '优化资源配置',
        priority: 'medium' as const,
        measurable_outcomes: ['资源利用率提升40%', '减少浪费']
      },
      {
        objective: '建立标准化流程',
        priority: 'low' as const,
        measurable_outcomes: ['流程标准化覆盖率90%', '质量指标建立']
      }
    ]

    const objectiveCount = scopeLevel === 'high' ? 2 : scopeLevel === 'medium' ? 3 : 5
    return baseObjectives.slice(0, objectiveCount)
  }

  /**
   * 生成范围边界
   */
  private generateScopeBoundaries(scopeLevel: string, complexityLevel: string) {
    const inScopeItems = [
      '核心业务流程优化',
      '技术平台开发',
      '用户界面设计',
      '数据迁移',
      '系统测试与验证',
      '用户培训',
      '文档编写',
      '项目管理'
    ]

    const outOfScopeItems = [
      '硬件设备采购',
      '组织架构重组',
      '外部系统集成',
      '市场营销活动',
      '长期运维支持',
      '第三方产品开发',
      '法律合规审查',
      '财务审计'
    ]

    const inScopeCount = scopeLevel === 'high' ? 3 : scopeLevel === 'medium' ? 5 : 8
    const outOfScopeCount = Math.floor(inScopeCount * 0.6)

    return {
      in_scope: inScopeItems.slice(0, inScopeCount),
      out_of_scope: outOfScopeItems.slice(0, outOfScopeCount),
      assumptions: this.generateAssumptions(complexityLevel),
      constraints: this.generateConstraints(complexityLevel)
    }
  }

  /**
   * 生成交付物
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generateDeliverables(scopeLevel: string, _complexityLevel: string) {
    const baseDeliverables = [
      {
        name: '项目规划文档',
        description: '详细的项目实施计划和路线图',
        acceptance_criteria: ['目标明确', '计划可行', '资源合理'],
        estimated_effort: '1人月'
      },
      {
        name: '技术架构设计',
        description: '系统技术架构和设计方案',
        acceptance_criteria: ['架构合理', '可扩展', '安全可靠'],
        estimated_effort: '2人月'
      },
      {
        name: '原型系统',
        description: '功能原型和演示系统',
        acceptance_criteria: ['功能完整', '性能达标', '用户体验良好'],
        estimated_effort: '3人月'
      },
      {
        name: '测试报告',
        description: '全面的系统测试和质量验证报告',
        acceptance_criteria: ['测试覆盖完整', '缺陷修复', '性能达标'],
        estimated_effort: '1人月'
      },
      {
        name: '用户手册',
        description: '详细的用户操作和维护文档',
        acceptance_criteria: ['内容完整', '易于理解', '实用性强'],
        estimated_effort: '0.5人月'
      }
    ]

    const deliverableCount = scopeLevel === 'high' ? 2 : scopeLevel === 'medium' ? 3 : 5
    return baseDeliverables.slice(0, deliverableCount)
  }

  /**
   * 生成成功指标
   */
  private generateSuccessMetrics(scopeLevel: string) {
    const baseMetrics = [
      { metric: '项目完成率', target: '100%', measurement_method: '交付物验收统计' },
      { metric: '成本控制率', target: '不超过预算10%', measurement_method: '财务对比分析' },
      { metric: '时间准时率', target: '95%以上', measurement_method: '里程碑时间统计' },
      { metric: '质量达标率', target: '98%以上', measurement_method: '质量检查结果' },
      { metric: '用户满意度', target: '85分以上', measurement_method: '用户问卷调查' }
    ]

    const metricCount = scopeLevel === 'high' ? 2 : scopeLevel === 'medium' ? 3 : 5
    return baseMetrics.slice(0, metricCount)
  }

  /**
   * 生成假设条件
   */
  private generateAssumptions(complexityLevel: string) {
    const baseAssumptions = [
      '项目预算充足且按计划到位',
      '关键技术人员全程参与',
      '用户需求在项目期间保持相对稳定',
      '外部环境和政策无重大变化',
      '相关方配合和支持',
      '技术方案可行且成熟'
    ]

    const assumptionCount =
      complexityLevel === 'simple' ? 2 : complexityLevel === 'moderate' ? 4 : 6
    return baseAssumptions.slice(0, assumptionCount)
  }

  /**
   * 生成约束条件
   */
  private generateConstraints(complexityLevel: string) {
    const baseConstraints = [
      '项目总预算不超过500万元',
      '项目周期限制在12个月内',
      '不得影响现有业务正常运行',
      '必须符合行业标准和法规要求',
      '团队规模限制在15人以内',
      '技术选型限制在成熟方案'
    ]

    const constraintCount =
      complexityLevel === 'simple' ? 2 : complexityLevel === 'moderate' ? 4 : 6
    return baseConstraints.slice(0, constraintCount)
  }

  /**
   * 生成风险评估
   */
  private generateRiskAssessment(complexityLevel: string) {
    const highRisks = [
      {
        risk: '技术实施难度超出预期',
        probability: 'medium' as const,
        impact: 'high' as const,
        mitigation_strategy: '分阶段实施，增加技术调研'
      },
      {
        risk: '关键人员流失',
        probability: 'low' as const,
        impact: 'high' as const,
        mitigation_strategy: '建立知识管理体系，人员备份'
      },
      {
        risk: '需求变更频繁',
        probability: 'high' as const,
        impact: 'medium' as const,
        mitigation_strategy: '建立变更控制流程'
      }
    ]

    const mediumRisks = [
      '预算超支风险',
      '进度延误风险',
      '质量问题风险',
      '外部依赖风险',
      '团队协作风险'
    ]

    const lowRisks = ['技术更新风险', '环境变化风险', '竞争风险']

    return {
      high_risks: highRisks.slice(
        0,
        complexityLevel === 'simple' ? 1 : complexityLevel === 'moderate' ? 2 : 3
      ),
      medium_risks: mediumRisks.slice(
        0,
        complexityLevel === 'simple' ? 1 : complexityLevel === 'moderate' ? 3 : 5
      ),
      low_risks: lowRisks.slice(0, complexityLevel === 'simple' ? 1 : 3)
    }
  }

  /**
   * 生成时间线建议
   */
  private generateTimelineRecommendation(scopeLevel: string, complexityLevel: string) {
    const basePhases = [
      {
        phase: '需求分析',
        duration: '2周',
        key_activities: ['需求调研', '需求分析', '需求确认'],
        deliverables: ['需求规格说明书']
      },
      {
        phase: '方案设计',
        duration: '3周',
        key_activities: ['架构设计', '详细设计', '方案评审'],
        deliverables: ['设计文档']
      },
      {
        phase: '开发实施',
        duration: '8周',
        key_activities: ['编码开发', '单元测试', '集成测试'],
        deliverables: ['软件系统']
      },
      {
        phase: '测试验证',
        duration: '3周',
        key_activities: ['系统测试', '用户验收测试', '性能测试'],
        deliverables: ['测试报告']
      },
      {
        phase: '部署上线',
        duration: '2周',
        key_activities: ['部署准备', '系统部署', '上线验证'],
        deliverables: ['上线系统']
      }
    ]

    const phaseCount = scopeLevel === 'high' ? 2 : scopeLevel === 'medium' ? 4 : 5
    const phases = basePhases.slice(0, phaseCount)

    // 根据复杂度调整时间
    const complexityMultiplier =
      complexityLevel === 'simple' ? 0.8 : complexityLevel === 'moderate' ? 1.0 : 1.3
    phases.forEach((phase) => {
      const weeks = parseInt(phase.duration)
      phase.duration = `${Math.ceil(weeks * complexityMultiplier)}周`
    })

    const totalWeeks = phases.reduce((sum, phase) => sum + parseInt(phase.duration), 0)

    return {
      phases,
      total_duration: `${totalWeeks}周`,
      critical_path: this.generateCriticalPath(scopeLevel, complexityLevel),
      milestones: this.generateMilestones(scopeLevel)
    }
  }

  /**
   * 生成关键路径
   */
  private generateCriticalPath(scopeLevel: string, complexityLevel: string) {
    const basePaths = [
      ['需求分析', '方案设计', '开发实施', '测试验证'],
      ['方案设计', '开发实施', '部署上线'],
      ['需求分析', '开发实施', '测试验证', '部署上线']
    ]

    const pathLength = scopeLevel === 'high' ? 2 : scopeLevel === 'medium' ? 3 : 4
    return basePaths[
      complexityLevel === 'simple' ? 0 : complexityLevel === 'moderate' ? 1 : 2
    ].slice(0, pathLength)
  }

  /**
   * 生成里程碑
   */
  private generateMilestones(scopeLevel: string) {
    const baseMilestones = [
      { name: '需求确认完成', date: '第2周末', deliverable: '需求规格说明书' },
      { name: '设计方案确定', date: '第5周末', deliverable: '设计文档' },
      { name: '核心功能完成', date: '第10周末', deliverable: '核心功能模块' },
      { name: '系统测试完成', date: '第13周末', deliverable: '测试报告' },
      { name: '项目正式上线', date: '第15周末', deliverable: '生产系统' }
    ]

    const milestoneCount = scopeLevel === 'high' ? 2 : scopeLevel === 'medium' ? 3 : 5
    return baseMilestones.slice(0, milestoneCount)
  }

  /**
   * 生成资源估算
   */
  private generateResourceEstimation(scopeLevel: string, complexityLevel: string) {
    const baseTeam = [
      { role: '项目经理', count: 1, skill_level: 'senior' },
      { role: '业务分析师', count: 1, skill_level: 'senior' },
      { role: '架构师', count: 1, skill_level: 'senior' },
      { role: '开发工程师', count: 3, skill_level: 'middle' },
      { role: '测试工程师', count: 2, skill_level: 'middle' },
      { role: 'UI设计师', count: 1, skill_level: 'middle' }
    ]

    const teamSize = scopeLevel === 'high' ? 3 : scopeLevel === 'medium' ? 4 : 6
    const complexityMultiplier =
      complexityLevel === 'simple' ? 0.8 : complexityLevel === 'moderate' ? 1.0 : 1.2

    const team = baseTeam.slice(0, teamSize)
    team.forEach((member) => {
      member.count = Math.ceil(member.count * complexityMultiplier)
    })

    const totalBudget = Math.ceil(
      team.reduce(
        (sum, member) => sum + member.count * (member.skill_level === 'senior' ? 2 : 1),
        0
      ) *
        50 *
        complexityMultiplier
    )

    return {
      team_composition: team,
      total_team_size: team.reduce((sum, member) => sum + member.count, 0),
      estimated_budget: `${totalBudget}万元`,
      budget_breakdown: {
        personnel: '60%',
        equipment: '15%',
        training: '10%',
        contingency: '15%'
      },
      skill_requirements: this.generateSkillRequirements(complexityLevel)
    }
  }

  /**
   * 生成技能要求
   */
  private generateSkillRequirements(complexityLevel: string) {
    const baseSkills = [
      '项目管理能力',
      '业务分析能力',
      '系统设计能力',
      '编程开发能力',
      '测试验证能力',
      '沟通协调能力'
    ]

    const additionalSkills =
      complexityLevel === 'simple'
        ? []
        : complexityLevel === 'moderate'
          ? ['风险管理', '质量控制']
          : ['架构设计', '性能优化', '安全防护', '数据分析']

    return [...baseSkills, ...additionalSkills]
  }

  /**
   * 生成相关方分析
   */
  private generateStakeholderAnalysis() {
    return {
      primary_stakeholders: [
        { name: '项目发起人', role: '决策者', influence: 'high', interest: 'high' },
        { name: '业务部门', role: '用户', influence: 'high', interest: 'high' },
        { name: '技术部门', role: '执行者', influence: 'medium', interest: 'high' }
      ],
      secondary_stakeholders: [
        { name: '财务部门', role: '支持者', influence: 'medium', interest: 'medium' },
        { name: '法务部门', role: '监督者', influence: 'low', interest: 'medium' },
        { name: '外部供应商', role: '合作者', influence: 'low', interest: 'medium' }
      ],
      engagement_strategy: ['定期项目汇报', '关键决策会议', '用户需求调研', '技术方案评审']
    }
  }

  /**
   * 生成改进建议
   */
  private generateImprovementSuggestions(scopeLevel: string, complexityLevel: string) {
    const suggestions = []

    if (scopeLevel === 'high') {
      suggestions.push('建议进一步细化项目范围，明确具体交付标准')
      suggestions.push('考虑增加详细的风险管理计划')
    }

    if (complexityLevel === 'complex') {
      suggestions.push('建议分阶段实施，降低项目风险')
      suggestions.push('增加技术预研和原型验证环节')
    }

    suggestions.push('建议建立完善的变更管理流程')
    suggestions.push('加强与相关方的沟通和协作')
    suggestions.push('制定详细的质量保证计划')

    return suggestions
  }

  /**
   * 生成项目标题
   */
  private generateProjectTitle(projectBrief: string, industryDomain: string): string {
    const industryPrefixes = {
      technology: '数字化转型升级',
      healthcare: '智慧医疗建设',
      finance: '金融科技创新',
      manufacturing: '智能制造改造',
      retail: '新零售业务发展',
      education: '教育信息化建设',
      government: '政务服务优化',
      energy: '新能源管理系统'
    }

    const prefix =
      industryPrefixes[industryDomain as keyof typeof industryPrefixes] || '业务流程优化'
    return `${prefix}项目`
  }

  /**
   * 计算范围界定时间
   */
  private calculateScopeDefinitionTime(scopeLevel: string, complexityLevel: string): number {
    const baseTime = {
      high: 30,
      medium: 60,
      detailed: 120
    }

    const complexityMultiplier = {
      simple: 0.8,
      moderate: 1.0,
      complex: 1.5
    }

    return (
      (baseTime[scopeLevel as keyof typeof baseTime] || 60) *
      (complexityMultiplier[complexityLevel as keyof typeof complexityMultiplier] || 1.0)
    )
  }

  /**
   * 生成错误场景Mock数据
   */
  private generateErrorScenario(
    errorType: 'network' | 'validation' | 'server' | 'timeout' | 'scope_error'
  ) {
    const errors = {
      network: {
        success: false,
        message: '网络连接失败，请检查网络设置',
        error_code: 'NETWORK_ERROR',
        retry_after: 30
      },
      validation: {
        success: false,
        message: '输入数据验证失败',
        error_code: 'VALIDATION_ERROR',
        details: {
          fields: ['project_brief', 'scope_level'],
          reasons: ['项目描述不能为空', '范围级别不支持']
        }
      },
      server: {
        success: false,
        message: '服务器内部错误，请稍后重试',
        error_code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString()
      },
      timeout: {
        success: false,
        message: '请求超时，请稍后重试',
        error_code: 'TIMEOUT_ERROR',
        timeout_duration: 180000
      },
      scope_error: {
        success: false,
        message: '范围界定失败：项目描述过于模糊',
        error_code: 'SCOPE_DEFINITION_FAILED',
        details: {
          issue: '项目描述缺乏具体目标和约束条件',
          suggestion: '请提供更详细的项目背景、目标和预期成果'
        }
      }
    }

    return errors[errorType]
  }

  /**
   * Mock实现方法
   * 为范围界定代理服务提供Mock数据支持
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    const apiConfig = this.getCurrentConfig()

    if (apiConfig.showDebugInfo) {
      console.log(`[API-${this.serviceName}] 执行Mock实现:`, {
        url: config.url,
        method: config.method,
        data: config.data
      })
    }

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 2000))

    const url = config.url
    const method = config.method

    try {
      // 范围界定代理状态API
      if (method === 'GET' && url.includes('/scope-agent/status')) {
        return this.generateScopeAgentStatus()
      }

      // 范围界定执行API
      if (method === 'POST' && url.includes('/scope-agent/define')) {
        // 模拟错误场景（5%概率）
        if (Math.random() < 0.05) {
          const errorTypes = ['network', 'validation', 'server', 'timeout', 'scope_error']
          const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)] as any
          return this.generateErrorScenario(errorType)
        }
        return this.generateScopeDefinitionResponse(config.data)
      }

      // 范围验证API
      if (method === 'POST' && url.includes('/scope-agent/validate')) {
        const validationScore = Math.random() * 20 + 75 // 75-95分

        const issues = []
        const recommendations = []

        if (validationScore < 80) {
          issues.push('范围边界不够清晰')
          recommendations.push('建议进一步明确项目范围边界')
        }

        if (validationScore < 85) {
          issues.push('成功指标缺乏量化标准')
          recommendations.push('建议增加具体的量化指标')
        }

        return {
          valid: validationScore >= 80,
          validation_score: validationScore,
          issues,
          recommendations:
            recommendations.length > 0
              ? recommendations
              : ['范围定义质量良好，建议按计划执行', '定期回顾和调整范围定义'],
          completeness_score: Math.random() * 15 + 80,
          clarity_score: Math.random() * 15 + 80,
          feasibility_score: Math.random() * 20 + 75,
          mock: true,
          timestamp: Date.now()
        }
      }

      // 任务状态API
      if (method === 'GET' && url.includes('/scope-agent/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]
        return this.getScopeTaskStatusMock(taskId)
      }

      // 更新范围定义API
      if (method === 'PUT' && url.includes('/scope-agent/scopes/')) {
        const parts = url.split('/')
        const scopeId = parts[parts.length - 1]

        return {
          success: true,
          message: '范围定义已更新',
          scope_id: scopeId,
          updated_fields: Object.keys(config.data || {}),
          updated_at: new Date().toISOString(),
          validation_result: {
            updated_score: Math.random() * 15 + 80,
            improvements_made: ['目标更清晰', '边界更明确', '指标更量化']
          },
          mock: true,
          timestamp: Date.now()
        }
      }

      // 导出范围定义API
      if (method === 'GET' && url.includes('/scope-agent/export/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]
        const format = config.params?.format || 'pdf'

        const fileSizes = {
          pdf: 3072,
          docx: 2048,
          json: 1024,
          markdown: 1536
        }

        return {
          task_id: taskId,
          export_format: format,
          download_url: `/api/v1/downloads/scope-definition-${taskId}.${format}`,
          file_size: fileSizes[format as keyof typeof fileSizes] || 2048,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          export_status: 'ready',
          included_sections: [
            'scope_definition',
            'risk_assessment',
            'timeline_recommendation',
            'resource_estimation',
            'stakeholder_analysis'
          ],
          mock: true,
          timestamp: Date.now()
        }
      }

      // 任务取消API
      if (method === 'DELETE' && url.includes('/scope-agent/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]

        // 从任务跟踪器中删除任务
        this.taskTracker.deleteTask(taskId)

        return {
          success: true,
          message: '范围界定任务已取消',
          task_id: taskId,
          cancelled_at: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 默认Mock响应
      return {
        success: true,
        message: `范围界定代理服务Mock响应 - ${method} ${url}`,
        data: {
          mock: true,
          timestamp: Date.now(),
          service_info: {
            name: this.serviceName,
            version: '1.0.0',
            request_info: {
              url,
              method,
              data: config.data
            }
          }
        }
      }
    } catch (error) {
      console.error(`[API-${this.serviceName}] Mock数据获取失败:`, error)

      return {
        success: false,
        message: `Mock数据获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error: error instanceof Error ? error.message : '未知错误',
        error_code: 'MOCK_GENERATION_FAILED',
        mock: true,
        timestamp: Date.now()
      }
    }
  }
}

// 创建单例实例
export const scopeAgentService = new ScopeAgentService()

export default scopeAgentService
