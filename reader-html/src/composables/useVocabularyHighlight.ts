import { type Ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { getAllVocabularyItems } from '../services/vocabularyService'
import type { VocabularyItem } from '../services/db'

const VOCAB_UPDATE_EVENT = 'lingoReader:vocabularyUpdated'

export function notifyVocabularyUpdated(bookId: number): void {
  if (!bookId)
    return
  window.dispatchEvent(new CustomEvent(VOCAB_UPDATE_EVENT, { detail: { bookId } }))
}

function isWordBoundaryChar(ch: string | undefined): boolean {
  if (!ch)
    return true
  return !/[A-Z0-9]/i.test(ch)
}

function highlightWord(root: HTMLElement, item: VocabularyItem) {
  const word = item.word.trim()
  if (!word)
    return

  const lowerWord = word.toLowerCase()

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []

  let current: Node | null = walker.nextNode()
  while (current) {
    // 不在已有高亮内部进行二次处理
    if (!current.parentElement?.closest('.vocab-word')) {
      textNodes.push(current as Text)
    }
    current = walker.nextNode()
  }

  for (const originalNode of textNodes) {
    let node: Text = originalNode
    let text = node.data
    let lower = text.toLowerCase()

    let index = lower.indexOf(lowerWord)
    while (index !== -1) {
      const before = text[index - 1]
      const after = text[index + word.length]
      if (isWordBoundaryChar(before) && isWordBoundaryChar(after)) {
        const beforeNode = node.splitText(index)
        const afterNode = beforeNode.splitText(word.length)

        const span = document.createElement('span')
        span.className = 'vocab-word'
        span.textContent = beforeNode.data
        span.dataset.vocabId = item.id
        span.dataset.vocabWord = item.word
        span.dataset.vocabContext = item.context
        span.dataset.vocabExplanation = item.aiExplanation

        beforeNode.parentNode?.replaceChild(span, beforeNode)

        node = afterNode
        text = node.data
        lower = text.toLowerCase()
        index = lower.indexOf(lowerWord)
      }
      else {
        index = lower.indexOf(lowerWord, index + word.length)
      }
    }
  }
}

function clearExistingHighlights(root: HTMLElement) {
  const spans = Array.from(root.querySelectorAll('span.vocab-word'))
  for (const span of spans) {
    const parent = span.parentNode
    if (!parent)
      continue
    const textNode = document.createTextNode(span.textContent ?? '')
    parent.replaceChild(textNode, span)
    parent.normalize()
  }
}

async function applyHighlights(root: HTMLElement) {
  const items = await getAllVocabularyItems()
  if (!items.length) {
    clearExistingHighlights(root)
    return
  }

  clearExistingHighlights(root)
  for (const item of items) {
    highlightWord(root, item)
  }
}

export function useVocabularyHighlight(options: {
  rootRef: Ref<HTMLElement | null>
  bookId: Ref<number>
  chapterHtml: Ref<string | undefined> | Ref<string>
}) {
  const { rootRef, bookId, chapterHtml } = options

  const schedule = async () => {
    if (!rootRef.value)
      return
    await nextTick()
    if (!rootRef.value)
      return
    void applyHighlights(rootRef.value)
  }

  watch([bookId, chapterHtml], () => {
    void schedule()
  })

  const handleExternalUpdate = (_event: Event) => {
    void schedule()
  }

  onMounted(() => {
    window.addEventListener(VOCAB_UPDATE_EVENT, handleExternalUpdate)
  })

  onUnmounted(() => {
    window.removeEventListener(VOCAB_UPDATE_EVENT, handleExternalUpdate)
  })
}
