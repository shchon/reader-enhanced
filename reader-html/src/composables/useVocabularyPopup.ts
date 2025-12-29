import { type Ref, onMounted, onUnmounted, ref } from 'vue'

export interface VocabularyPopupState {
  visible: Ref<boolean>
  word: Ref<string>
  context: Ref<string>
  explanation: Ref<string>
  vocabId: Ref<string>
  position: Ref<'top' | 'bottom'>
  close: () => void
}

export function useVocabularyPopup(rootRef: Ref<HTMLElement | null>): VocabularyPopupState {
  const visible = ref(false)
  const word = ref('')
  const context = ref('')
  const explanation = ref('')
  const vocabId = ref('')
  const position = ref<'top' | 'bottom'>('bottom')

  const handleClick = (event: Event) => {
    const target = event.target as HTMLElement | null
    if (!target)
      return

    const span = target.closest('.vocab-word') as HTMLElement | null
    if (!span)
      return

    const spanWord = span.dataset.vocabWord ?? span.textContent ?? ''
    const spanContext = span.dataset.vocabContext ?? ''
    const spanExplanation = span.dataset.vocabExplanation ?? ''
    const spanId = span.dataset.vocabId ?? ''

    if (!spanWord)
      return

    word.value = spanWord
    context.value = spanContext
    explanation.value = spanExplanation
    vocabId.value = spanId

    // 在桌面端根据点击位置决定卡片显示在上半屏还是下半屏
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    if (viewportWidth >= 768 && viewportHeight) {
      const rect = span.getBoundingClientRect()
      const centerY = rect.top + rect.height / 2
      position.value = centerY > viewportHeight / 2 ? 'top' : 'bottom'
    }
    else {
      // 移动端统一使用底部抽屉
      position.value = 'bottom'
    }

    visible.value = true

    event.stopPropagation()
  }

  onMounted(() => {
    if (!rootRef.value)
      return
    rootRef.value.addEventListener('click', handleClick)
  })

  onUnmounted(() => {
    if (!rootRef.value)
      return
    rootRef.value.removeEventListener('click', handleClick)
  })

  const close = () => {
    visible.value = false
  }

  return {
    visible,
    word,
    context,
    explanation,
    vocabId,
    position,
    close,
  }
}
