<script setup lang='ts'>
import { nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, toRef, useTemplateRef, watch } from 'vue'
import type { ResolvedHref } from '@lingo-reader/shared'
import { useI18n } from 'vue-i18n'
import { useBookStore } from '../../../store'
import { useDebounce, useDomSize, withPx } from '../../../utils'
import Resizer from '../../Resizer/Resizer.vue'
import {
  type Config,
  generateAdjusterConfig,
  generateFontFamilyConfig,
  generateFontSizeConfig,
  generateLetterSpacingConfig,
  generateLineHeightConfig,
  generatePaddingBottomConfig,
  generatePaddingLeftConfig,
  generatePaddingRightConfig,
  generatePaddingTopConfig,
  generateParaSpacingConfig,
  generateThemeConfig,
  handleATagHref,
} from '../sharedLogic'
import { notifyVocabularyUpdated, useVocabularyHighlight } from '../../../composables/useVocabularyHighlight'
import { useVocabularyPopup } from '../../../composables/useVocabularyPopup'
import VocabularyDetailPanel from '../../Vocabulary/VocabularyDetailPanel.vue'
import { deleteVocabularyItem } from '../../../services/vocabularyService'
import { updateBookProgress } from '../../../services/bookProgressService'
import { loadScrollReaderSettings, saveScrollReaderSettings } from '../../../services/readerSettings'
import { applyReaderTheme, loadReaderTheme, saveReaderTheme } from '../../../services/themeService'

const props = defineProps<{
  selectedTocItem: { id: string, selector: string }
  bookId: number
}>()

const emits = defineEmits<{
  (e: 'infoDown'): void
  (event: 'receiveConfig', configList: Config[]): void
}>()

/**
 * i18n
 */
const { t } = useI18n()

const fontFamily = ref<string>(`'Lucida Console', Courier, monospace`)
const readerTheme = ref<string>('light')
const fontSize = ref<number>(16)
const letterSpacing = ref<number>(0)
const lineHeight = ref<number>(2)
const textPaddingLeft = ref<number>(2)
const textPaddingRight = ref<number>(2)
const textPaddingTop = ref<number>(0)
const textPaddingBottom = ref<number>(300)
// Another way to implement dynamic paragraph spacing is to use dynamic injection of <style>
const pSpacing = ref<number>(5)
// 控制滚动模式两侧整体留白的设置项（通过 ConfigPannel 调节）
const scrollSidePadding = ref<number>(200)
const configList: Config[] = [
  generateThemeConfig(readerTheme),
  generateFontFamilyConfig(fontFamily),
  generateFontSizeConfig(fontSize),
  generateLetterSpacingConfig(letterSpacing),
  generateLineHeightConfig(lineHeight),
  generateParaSpacingConfig(pSpacing),
  // 滚动模式左右留白（同时作用于容器左右 padding）
  generateAdjusterConfig('scrollSidePadding', Infinity, 0, 10, scrollSidePadding),
  generatePaddingLeftConfig(textPaddingLeft),
  generatePaddingRightConfig(textPaddingRight),
  generatePaddingTopConfig(textPaddingTop),
  generatePaddingBottomConfig(textPaddingBottom),
]
onMounted(() => {
  readerTheme.value = loadReaderTheme()
  applyReaderTheme(readerTheme.value as 'light' | 'dark')
  const saved = loadScrollReaderSettings()
  if (saved.fontFamily) fontFamily.value = saved.fontFamily
  if (saved.fontSize != null) fontSize.value = saved.fontSize
  if (saved.letterSpacing != null) letterSpacing.value = saved.letterSpacing
  if (saved.lineHeight != null) lineHeight.value = saved.lineHeight
  if (saved.textPaddingLeft != null) textPaddingLeft.value = saved.textPaddingLeft
  if (saved.textPaddingRight != null) textPaddingRight.value = saved.textPaddingRight
  if (saved.textPaddingTop != null) textPaddingTop.value = saved.textPaddingTop
  if (saved.textPaddingBottom != null) textPaddingBottom.value = saved.textPaddingBottom
  if (saved.pSpacing != null) pSpacing.value = saved.pSpacing
  if (saved.scrollSidePadding != null) scrollSidePadding.value = saved.scrollSidePadding

  emits('receiveConfig', configList)
})
onBeforeUnmount(() => {
  emits('receiveConfig', [])
})

/**
 * button positioning
 */
const containerRef = useTemplateRef('containerRef')
const articleRef = useTemplateRef<HTMLElement>('articleRef')
const { width: containerWidth } = useDomSize(containerRef)
/**
 * book
 */
const bookStore = useBookStore()
const { chapterNums, getChapterHTML, resolveHref } = useBookStore()
const currentChapterHTML = ref<string>()
onMounted(async () => {
  currentChapterHTML.value = await getChapterHTML()
  nextTick(() => {
    // jump to the last read location
    const scrollHeight = containerRef.value!.scrollHeight
    const targetPosition = bookStore.progressInChapter * scrollHeight
    window.scrollTo({ top: targetPosition })
    // ??? cannot work, why?
    // containerRef.value!.scrollTop = targetPosition
  })
})

const bookIdRef = toRef(props, 'bookId')
useVocabularyHighlight({
  rootRef: articleRef,
  bookId: bookIdRef,
  chapterHtml: currentChapterHTML,
})

const {
  visible: isVocabPanelVisible,
  word: vocabWord,
  context: vocabContext,
  explanation: vocabExplanation,
  vocabId,
  position: vocabPanelPosition,
  close: closeVocabPanel,
} = useVocabularyPopup(articleRef)

async function handleDeleteVocabulary(id?: string) {
  if (!id)
    return

  await deleteVocabularyItem(id)
  notifyVocabularyUpdated(props.bookId)
  closeVocabPanel()
}

// save read position
const saveReadPos = useDebounce(() => {
  const scrollTop = document.documentElement?.scrollTop || window.scrollY || 0
  const scrollHeight = document.documentElement?.scrollHeight || 1
  const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0
  bookStore.progressInChapter = progress
  void updateBookProgress(bookIdRef.value, bookStore.chapterIndex, progress)
}, 500)
window.addEventListener('scroll', saveReadPos)
// if you don't clear the events on the window, there will be strange bug
onUnmounted(() => {
  window.removeEventListener('scroll', saveReadPos)
})

async function skipToChapter(newV: ResolvedHref) {
  if (newV.id.length > 0) {
    currentChapterHTML.value = await bookStore.getChapterThroughId(newV.id)
  }
  if (newV.selector.length > 0) {
    nextTick(() => {
      const targetEle = containerRef.value!.querySelector(newV.selector)
      if (targetEle) {
        targetEle.scrollIntoView()
      }
    })
  }
}

// load book when select toc item
watch(() => props.selectedTocItem, skipToChapter)

// handle a tag href, bind to article element
const handleATagHrefScroll = handleATagHref(resolveHref, skipToChapter)

/**
 * chapter turning
 */
async function prevChapter() {
  if (bookStore.chapterIndex > 0) {
    bookStore.chapterIndex--
    currentChapterHTML.value = await getChapterHTML()
    window.scrollTo({ top: 0 })
  }
}
async function nextChapter() {
  if (bookStore.chapterIndex < chapterNums - 1) {
    bookStore.chapterIndex++
    currentChapterHTML.value = await getChapterHTML()
    window.scrollTo({ top: 0 })
  }
}

/**
 * move drag bar
 */
// 容器左右 padding（两侧留白），默认与 scrollSidePadding 同步
const paddingLeft = ref<number>(200)
const paddingRight = ref<number>(200)
onMounted(() => {
  const base = scrollSidePadding.value || 0.2 * containerWidth.value
  paddingLeft.value = base
  paddingRight.value = base
})

// 当用户在设置面板中调节滚动模式两侧留白时，同步更新左右 padding
watch(scrollSidePadding, (val) => {
  const maxPadding = Math.max(0, containerWidth.value - 400)
  const clamped = Math.min(Math.max(0, val), maxPadding > 0 ? maxPadding / 2 : val)
  paddingLeft.value = clamped
  paddingRight.value = clamped
})
const saveSettingsDebounced = useDebounce(() => {
  const theme = (readerTheme.value as 'light' | 'dark') || 'light'
  saveReaderTheme(theme)
  applyReaderTheme(theme)
  saveScrollReaderSettings({
    fontFamily: fontFamily.value,
    fontSize: fontSize.value,
    letterSpacing: letterSpacing.value,
    lineHeight: lineHeight.value,
    textPaddingLeft: textPaddingLeft.value,
    textPaddingRight: textPaddingRight.value,
    textPaddingTop: textPaddingTop.value,
    textPaddingBottom: textPaddingBottom.value,
    pSpacing: pSpacing.value,
    scrollSidePadding: scrollSidePadding.value,
  })
}, 300)

watch([
  readerTheme,
  fontFamily,
  fontSize,
  letterSpacing,
  lineHeight,
  textPaddingLeft,
  textPaddingRight,
  textPaddingTop,
  textPaddingBottom,
  pSpacing,
  scrollSidePadding,
], saveSettingsDebounced)
const isDragging = ref<boolean>(false)

let startX = 0
let dragType = ''
function barDrag(type: string, e: MouseEvent) {
  startX = e.clientX
  dragType = type
}
function onMouseMove(e: MouseEvent) {
  const delta = e.clientX - startX
  const maxPadding = containerWidth.value - 400
  isDragging.value = true
  emits('infoDown')

  if (dragType === 'left') {
    paddingLeft.value = Math.min(
      Math.max(0, paddingLeft.value + delta),
      maxPadding - paddingRight.value,
    )
  }
  else {
    paddingRight.value = Math.min(
      Math.max(0, paddingRight.value - delta),
      maxPadding - paddingLeft.value,
    )
  }

  startX = e.clientX
}
function onMouseUp() {
  setTimeout(() => {
    isDragging.value = false
  }, 0)
}
// mouseevent will trigger other's element click event,
//  so we need to stop it in this event loop.
function containerClick(e: MouseEvent) {
  if (isDragging.value) {
    e.stopPropagation()
  }
}
</script>

<template>
  <div
    ref="containerRef" :style="{ paddingLeft: withPx(paddingLeft), paddingRight: withPx(paddingRight) }"
    :class="{ 'user-select-none': isDragging }" class="article-container" @click="containerClick"
  >
    <button class="button next-chapter" @click.stop="nextChapter" :title="t('nextChapter')">
      ➜
    </button>
    <button class="button prev-chapter" @click.stop="prevChapter" :title="t('prevChapter')">
      ⇦
    </button>
    <!-- book text -->
    <Resizer @mousedown="(e) => barDrag('left', e)" @mousemove="onMouseMove" @mouseup="onMouseUp" />

    <article
      ref="articleRef"
      :style="{
        fontFamily,
        lineHeight,
        'paddingLeft': withPx(textPaddingLeft),
        'paddingRight': withPx(textPaddingRight),
        'paddingTop': withPx(textPaddingTop),
        'paddingBottom': withPx(textPaddingBottom),
        'fontSize': withPx(fontSize),
        'letterSpacing': withPx(letterSpacing),
        '--p-spacing': withPx(pSpacing),
      }" class="article-text" @click="handleATagHrefScroll" v-html="currentChapterHTML"
    />

    <Resizer @mousedown="(e) => barDrag('right', e)" @mousemove="onMouseMove" @mouseup="onMouseUp" />
  </div>

  <VocabularyDetailPanel
    :visible="isVocabPanelVisible"
    :word="vocabWord"
    :context="vocabContext"
    :explanation="vocabExplanation"
    :vocab-id="vocabId"
    :position="vocabPanelPosition"
    @close="closeVocabPanel"
    @delete="handleDeleteVocabulary"
  />
</template>

<style scoped>
.user-select-none {
  user-select: none;
}

.article-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  margin: 0;
  box-sizing: border-box;
  font-family: Georgia, 'Times New Roman', serif;
  background-color: transparent;
}

.button {
  position: fixed;
  bottom: 10px;
  margin: 5px;
  padding: 5px;
  background-color: #f0f0f0;
  border: 1px solid #000;
  border-radius: 5px;
  opacity: 0.2;
}

.button:hover {
  opacity: 1;
}

.next-chapter {
  right: 10px;
}

.prev-chapter {
  left: 10px;
}

.article-text {
  flex: 1 0;
  box-sizing: border-box;
  min-width: 0;
  max-width: 680px;
  margin: 64px auto 80px;
}

/* To remove default css set by inline style */
.article-text * {
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  letter-spacing: inherit !important;
}

.article-text :deep(img) {
  /* display: block; */
  /* margin: auto; */
  /* make img fit to its parent */
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.article-text :deep(pre) {
  background-color: rgba(204, 201, 194, 0.3);
}

.article-text :deep(p) {
  text-indent: 0;
  margin: 0 0 1.2em;
  line-height: 1.75;
}

.article-text :deep(li p) {
  text-indent: 0;
}

.article-text :deep(ul) {
  padding-left: 2em;
}

.article-text :deep(figure) {
  text-align: center;
}

.article-text :deep(table) {
  table-layout: fixed;
  width: 100%;
  word-wrap: break-word;
}

.article-text :deep(.vocab-word) {
  cursor: pointer;
  padding: 0 2px;
  border-bottom: 1px solid rgba(80, 120, 200, 0.35);
}

.article-text :deep(.vocab-word:hover) {
  background: rgba(80, 120, 200, 0.08);
}

@media (max-width: 768px) {
  .article-container {
    justify-content: center;
  }

  /* 隐藏左右调节条，移动端不需要拖拽调整留白 */
  .article-container :deep(.resizer-container) {
    display: none;
  }

  .article-text {
    min-width: 0;
    max-width: 40rem;
    margin: 0 auto;
  }
}
</style>
