import { ref } from 'vue'
import type { ExplainSelectionRequest } from '../services/aiClient'
import { streamExplainPreposition, streamExplainSelection } from '../services/aiClient'

export function useAiExplainSelection() {
  const isPanelVisible = ref(false)
  const isLoading = ref(false)
  const errorMessage = ref('')
  const output = ref('')
  const currentWord = ref('')

  let abortController: AbortController | null = null

  const reset = () => {
    errorMessage.value = ''
    output.value = ''
  }

  const explainSelection = async (payload: ExplainSelectionRequest) => {
    if (!payload.text?.trim()) {
      return
    }

    // 中断之前的请求
    if (abortController) {
      abortController.abort()
      abortController = null
    }

    abortController = new AbortController()
    const { signal } = abortController

    isPanelVisible.value = true
    isLoading.value = true
    currentWord.value = payload.text
    reset()

    await streamExplainSelection(payload, {
      onToken: (token) => {
        output.value += token
      },
      onDone: () => {
        isLoading.value = false
      },
      onError: (error) => {
        isLoading.value = false
        if (error.message === 'MISSING_API_KEY') {
          errorMessage.value = 'no-api-key'
        }
        else {
          errorMessage.value = error.message || 'unknown-error'
        }
      },
    }, signal)
  }

  const explainPrepositionSelection = async (payload: ExplainSelectionRequest) => {
    if (!payload.text?.trim()) {
      return
    }

    if (abortController) {
      abortController.abort()
      abortController = null
    }

    abortController = new AbortController()
    const { signal } = abortController

    isPanelVisible.value = true
    isLoading.value = true
    currentWord.value = payload.text
    reset()

    await streamExplainPreposition(payload, {
      onToken: (token) => {
        output.value += token
      },
      onDone: () => {
        isLoading.value = false
      },
      onError: (error) => {
        isLoading.value = false
        if (error.message === 'MISSING_API_KEY') {
          errorMessage.value = 'no-api-key'
        }
        else {
          errorMessage.value = error.message || 'unknown-error'
        }
      },
    }, signal)
  }

  const closePanel = () => {
    isPanelVisible.value = false
  }

  return {
    isPanelVisible,
    isLoading,
    errorMessage,
    output,
    currentWord,
    explainSelection,
    explainPrepositionSelection,
    closePanel,
  }
}
