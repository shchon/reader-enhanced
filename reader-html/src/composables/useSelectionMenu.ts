import { onBeforeUnmount, onMounted, ref } from 'vue'

interface SelectionMenuState {
  visible: boolean
  x: number
  y: number
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

function resolveSelection(): (SelectionMenuState & { rect: DOMRect }) | null {
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

  const rect = range.getBoundingClientRect()

  return {
    visible: true,
    // 使用视口坐标，匹配浮动菜单的 fixed 定位
    x: rect.left + rect.width / 2,
    y: rect.top,
    text,
    context,
    rect,
  }
}

export function useSelectionMenu() {
  const visible = ref(false)
  const x = ref(0)
  const y = ref(0)
  const text = ref('')
  const context = ref('')

  const hide = () => {
    visible.value = false
  }

  const handleSelectionEvent = (event: MouseEvent | TouchEvent) => {
    // 如果是点击浮动菜单本身，直接忽略，让按钮点击事件自行处理
    const target = event.target as HTMLElement | null
    if (target && target.closest('.selection-menu-root')) {
      return
    }

    const resolved = resolveSelection()
    if (!resolved) {
      // 如果当前没有有效选区，则隐藏菜单
      hide()
      return
    }

    visible.value = true
    text.value = resolved.text
    context.value = resolved.context
    // 根据视口空间决定菜单放在选区的上方还是下方：
    // - 优先选择不会超出视口的一侧
    // - 在两侧空间都足够时优先下方，避免遮挡当前行文字
    // 同时在水平方向做边界收缩，避免靠近左右边缘时菜单被裁切
    const margin = 8
    const estimatedWidth = 260 // 与 SelectionMenu.vue 中的 max-width 保持一致
    const halfWidth = estimatedWidth / 2
    let centerX = resolved.x
    if (centerX - halfWidth < margin) {
      centerX = margin + halfWidth
    }
    else if (centerX + halfWidth > window.innerWidth - margin) {
      centerX = window.innerWidth - margin - halfWidth
    }
    x.value = centerX
    const bottomSpace = window.innerHeight - resolved.rect.bottom
    const menuHeight = 60 // 预估菜单高度（px），略大于实际高度
    const gap = 8 // 选区与菜单之间的最小垂直间距

    if (bottomSpace >= menuHeight + gap) {
      // 底部空间足够：完全放在选区下方，并留出 gap 间距
      y.value = resolved.rect.bottom + gap
    }
    else {
      // 底部空间不足时，一律放在选区上方，尽量避免挡住选中文字
      // 若顶部空间也有限，则贴近视口顶部但仍保留 gap 间距
      y.value = Math.max(8, resolved.rect.top - menuHeight - gap)
    }
  }

  const handleScrollOrResize = () => {
    hide()
  }

  onMounted(() => {
    document.addEventListener('mouseup', handleSelectionEvent)
    document.addEventListener('touchend', handleSelectionEvent)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mouseup', handleSelectionEvent)
    document.removeEventListener('touchend', handleSelectionEvent)
    window.removeEventListener('scroll', handleScrollOrResize, true)
    window.removeEventListener('resize', handleScrollOrResize)
  })

  return {
    visible,
    x,
    y,
    text,
    context,
    hide,
  }
}
