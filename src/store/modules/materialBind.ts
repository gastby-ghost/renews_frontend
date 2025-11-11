/**
 * 素材绑定状态管理
 * 管理AI素材绑定任务的生命周期和状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  MaterialBindRequest,
  MaterialBindStatusResponse,
  MaterialBindResult
} from '@/types/ai'
import { documentGenerateService } from '@/services/documentGenerateService'
import { AsyncTaskPoller, type PollingTask, TaskStatus } from '@/utils/polling/asyncTaskPoller'
import { ElMessage } from 'element-plus'

export const useMaterialBindStore = defineStore(
  'materialBind',
  () => {
    // ========== 状态定义 ==========

    // 当前运行的任务
    const currentTask = ref<PollingTask | null>(null)

    // 任务状态
    const taskStatus = ref<MaterialBindStatusResponse | null>(null)

    // 历史任务记录
    const taskHistory = ref<Map<string, MaterialBindStatusResponse>>(new Map())

    // 加载状态
    const loading = ref(false)

    // 错误信息
    const error = ref<string | null>(null)

    // ========== 计算属性 ==========

    // 是否正在绑定
    const isBinding = computed(() => {
      if (!taskStatus.value) return false
      return taskStatus.value.status === 'running' || taskStatus.value.status === 'pending'
    })

    // 绑定进度
    const bindingProgress = computed(() => {
      return taskStatus.value?.progress || 0
    })

    // 是否已完成
    const isCompleted = computed(() => {
      return taskStatus.value?.status === 'completed'
    })

    // 是否失败
    const isFailed = computed(() => {
      return taskStatus.value?.status === 'failed'
    })

    // 绑定结果
    const bindingResult = computed(() => {
      return taskStatus.value?.result || null
    })

    // 绑定的章节数量
    const boundSectionsCount = computed(() => {
      return bindingResult.value?.total_sections || 0
    })

    // 绑定的素材总数
    const boundMaterialsCount = computed(() => {
      return bindingResult.value?.total_materials_bound || 0
    })

    // ========== 核心方法 ==========

    /**
     * 启动素材绑定任务
     * @param userId 用户ID
     * @param projectId 项目ID
     * @param request 绑定请求参数
     * @returns 轮询任务实例
     */
    const executeMaterialBind = async (
      userId: string,
      projectId: string,
      request: MaterialBindRequest
    ): Promise<PollingTask> => {
      console.log('========================================');
      console.log('[STORE] executeMaterialBind 开始执行');
      console.log('[STORE] userId:', userId);
      console.log('[STORE] projectId:', projectId);
      console.log('[STORE] request.title:', request.title);
      console.log('[STORE] request.outline_sections 数量:', request.outline_sections.length);
      console.log('[STORE] request.materials 数量:', request.materials.length);
      console.log('========================================');

      try {
        console.log('[STORE] 设置 loading = true');
        loading.value = true
        error.value = null

        // 清空之前的任务状态
        if (currentTask.value) {
          console.log('[STORE] 发现已有任务，先取消');
          await cancelCurrentTask()
        }

        // 启动新任务
        console.log('[STORE] 调用 documentGenerateService.executeMaterialBindWithPolling');
        console.log('[STORE] 参数 userId:', userId);
        console.log('[STORE] 参数 projectId:', projectId);
        console.log('[STORE] 参数 request.title:', request.title);

        const poller = await documentGenerateService.executeMaterialBindWithPolling(
          userId,
          projectId,
          {
            title: request.title,
            outline_sections: request.outline_sections,
            materials: request.materials
          }
        )

        console.log('[STORE] documentGenerateService.executeMaterialBindWithPolling 返回:', poller);
        console.log('[STORE] poller.id:', poller.id);
        console.log('[STORE] poller.isPolling:', poller.isPolling);

        // 监听轮询事件
        console.log('[STORE] 设置事件监听器');
        poller.on('progress', (result: any) => {
          console.log('[STORE] 收到 progress 事件:', result);
          if (result.data) {
            taskStatus.value = result.data
          }
        })

        poller.on('completed', (result: any) => {
          console.log('[STORE] 收到 completed 事件:', result);
          if (result.data) {
            taskStatus.value = result.data
          }
          loading.value = false
          ElMessage.success('素材绑定完成！')

          // 保存到历史记录
          if (taskStatus.value?.task_id) {
            taskHistory.value.set(taskStatus.value.task_id, taskStatus.value)
          }
        })

        poller.on('failed', (error: any) => {
          console.error('[STORE] 收到 failed 事件:', error);
          loading.value = false
          error.value = error.message || '素材绑定失败'
          ElMessage.error(error.value)
        })

        poller.on('timeout', () => {
          console.warn('[STORE] 收到 timeout 事件');
          loading.value = false
          error.value = '素材绑定超时'
          ElMessage.error(error.value)
        })

        currentTask.value = poller
        console.log('[STORE] 设置 currentTask = poller');
        console.log('[STORE] executeMaterialBind 执行完成，返回 poller');
        return poller
      } catch (err) {
        console.error('[STORE] 捕获到异常:', err);
        loading.value = false
        error.value = err instanceof Error ? err.message : '启动素材绑定任务失败'
        ElMessage.error(error.value)
        throw err
      }
    }

    /**
     * 查询任务状态
     * @param taskId 任务ID
     */
    const fetchTaskStatus = async (taskId: string) => {
      try {
        const response = await documentGenerateService.getMaterialBindStatus(taskId)
        taskStatus.value = response
        return response
      } catch (err) {
        error.value = err instanceof Error ? err.message : '获取任务状态失败'
        throw err
      }
    }

    /**
     * 取消当前任务
     */
    const cancelCurrentTask = async () => {
      if (currentTask.value) {
        try {
          await currentTask.value.cancel()
          currentTask.value = null
          ElMessage.info('素材绑定任务已取消')
        } catch (err) {
          console.error('取消任务失败:', err)
        }
      }
    }

    /**
     * 清除当前任务状态
     */
    const clearCurrentTask = () => {
      if (currentTask.value) {
        currentTask.value = null
      }
      taskStatus.value = null
      loading.value = false
      error.value = null
    }

    /**
     * 获取历史任务
     * @param taskId 任务ID（可选）
     */
    const getTaskFromHistory = (taskId?: string) => {
      if (taskId) {
        return taskHistory.value.get(taskId) || null
      }
      return Array.from(taskHistory.value.values())
    }

    /**
     * 清除历史记录
     */
    const clearHistory = () => {
      taskHistory.value.clear()
    }

    /**
     * 根据章节ID获取绑定的素材
     * @param sectionId 章节ID
     */
    const getMaterialsBySectionId = (sectionId: number) => {
      return (
        bindingResult.value?.material_section_bindings.find(
          (binding) => binding.section_id === sectionId
        )?.materials || []
      )
    }

    /**
     * 获取章节的匹配分数
     * @param sectionId 章节ID
     */
    const getMatchScoresBySectionId = (sectionId: number) => {
      return (
        bindingResult.value?.material_section_bindings.find(
          (binding) => binding.section_id === sectionId
        )?.match_scores || []
      )
    }

    /**
     * 获取素材的绑定原因
     * @param sectionId 章节ID
     * @param materialId 素材ID
     */
    const getBindingReason = (sectionId: number, materialId: number) => {
      const binding = bindingResult.value?.material_section_bindings.find(
        (b) => b.section_id === sectionId
      )
      const material = binding?.materials.find((m) => m.id === materialId)
      return material?.relevance_explanation || ''
    }

    // ========== 状态重置 ==========

    /**
     * 重置所有状态
     */
    const reset = () => {
      clearCurrentTask()
      clearHistory()
    }

    return {
      // 状态
      currentTask,
      taskStatus,
      taskHistory,
      loading,
      error,

      // 计算属性
      isBinding,
      bindingProgress,
      isCompleted,
      isFailed,
      bindingResult,
      boundSectionsCount,
      boundMaterialsCount,

      // 核心方法
      executeMaterialBind,
      fetchTaskStatus,
      cancelCurrentTask,
      clearCurrentTask,

      // 查询方法
      getTaskFromHistory,
      getMaterialsBySectionId,
      getMatchScoresBySectionId,
      getBindingReason,

      // 工具方法
      clearHistory,
      reset
    }
  },
  {
    persist: {
      key: 'material-bind',
      storage: localStorage,
      paths: ['taskHistory']
    }
  }
)
