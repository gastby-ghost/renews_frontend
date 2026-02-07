/**
 * AI 对话框组合式函数
 * 处理 AI 润色、扩写、总结等对话框的状态和操作
 */
import type { Ref } from 'vue'

export type AIDialogType = 'polish' | 'expand' | 'summarize' | 'translate' | 'rewrite' | null

export interface UseAIDialogOptions {
  visible: Ref<boolean>
  dialogType: Ref<AIDialogType>
  aiLoading: Ref<boolean>
  selectedText: Ref<string>
  aiResult: Ref<string>
  onApply: () => void
  onCancel: () => void
}

export function useAIDialog(options: UseAIDialogOptions) {
  const { dialogType, selectedText, onApply, onCancel } = options

  // 对话框标题计算
  const dialogTitle = computed(() => {
    const titles: Record<string, string> = {
      polish: 'AI 润色',
      expand: 'AI 扩写',
      summarize: 'AI 总结',
      translate: 'AI 翻译',
      rewrite: 'AI 改写'
    }
    return dialogType.value ? titles[dialogType.value] || 'AI 处理' : 'AI 处理'
  })

  // 判断是否有原始文本需要显示
  const showOriginalText = computed(() => {
    return dialogType.value === 'polish' && selectedText.value
  })

  // 应用处理
  const handleApply = () => {
    onApply()
  }

  // 取消处理
  const handleCancel = () => {
    onCancel()
  }

  return {
    dialogTitle,
    showOriginalText,
    handleApply,
    handleCancel
  }
}
