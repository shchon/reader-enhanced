import { onBeforeUnmount, onMounted } from 'vue'

interface SelectionInfo {
  text: string
  context: string
}

function getSentenceAroundSelection(fullText: string, selectedText: string): string {
  const text = fullText.replace(/\s+/g, ' ').trim()
  if (!text) {
    return ''
  }

  const target = selectedText.trim()
  const index = text.indexOf(target)
  if (index === -1) {
    return text
  }

  const isBoundary = (ch: string) => /[.!?。！？]/.test(ch)

  let start = 0
  for (let i = index - 1; i >= 0; i--) {
    if (isBoundary(text[i])) {
      start = i + 1
      break
    }
  }

  let end = text.length
  const afterIndex = index + target.length
  for (let i = afterIndex; i < text.length; i++) {
    if (isBoundary(text[i])) {
      end = i + 1
      break
    }
  }

  const sentence = text.slice(start, end).trim()
  return sentence || text
}

function extractSelection(): SelectionInfo | null {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) {
    return null
  }

  const text = selection.toString().trim()
  if (!text) {
    return null
  }

  let range: Range
  try {
    range = selection.getRangeAt(0)
  }
  catch {
    return null
  }

  let container: Node | null = range.commonAncestorContainer
  if (container.nodeType === Node.TEXT_NODE) {
    container = container.parentNode
  }

  const rawContext = (container && (container as HTMLElement).textContent) || ''
  const context = getSentenceAroundSelection(rawContext, text)

  return {
    text,
    context,
  }
}

export function useSelectionDebug() {
  const handler = (event: MouseEvent | TouchEvent) => {
    // 仅在主按钮松开或触摸结束时处理，减小干扰
    if (event instanceof MouseEvent && event.button !== 0) {
      return
    }

    const info = extractSelection()
    if (!info) {
      return
    }

    console.info('[AI][Selection]', info)
  }

  onMounted(() => {
    document.addEventListener('mouseup', handler)
    document.addEventListener('touchend', handler)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mouseup', handler)
    document.removeEventListener('touchend', handler)
  })
}
