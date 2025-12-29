<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, onUnmounted, onUpdated, ref, toRef, useTemplateRef, watch } from 'vue'
import type { ResolvedHref } from '@lingo-reader/shared'
import { useI18n } from 'vue-i18n'
import { useBookStore } from '../../../store'
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
import { useDebounce, useThrottle, withPx, withPxImportant } from '../../../utils'
import { notifyVocabularyUpdated, useVocabularyHighlight } from '../../../composables/useVocabularyHighlight'
import { useVocabularyPopup } from '../../../composables/useVocabularyPopup'
import VocabularyDetailPanel from '../../Vocabulary/VocabularyDetailPanel.vue'
import { deleteVocabularyItem } from '../../../services/vocabularyService'
import { updateBookProgress } from '../../../services/bookProgressService'
import { loadColumnReaderSettings, saveColumnReaderSettings } from '../../../services/readerSettings'
import { applyReaderTheme, loadReaderTheme, saveReaderTheme } from '../../../services/themeService'

const props = defineProps<{
  selectedTocItem: { id: string, selector: string }
  bookId: number
}>()

const emits = defineEmits<{
  (event: 'infoDown'): void
  (event: 'receiveConfig', configList: Config[]): void
}>()

/**
 * i18n
 */
const { t } = useI18n()

/**
 * configs
 */
const fontFamily = ref<string>('Georgia, \'Times New Roman\', serif')
const readerTheme = ref<string>('light')
const columns = ref<number>(2)
const columnGap = ref<number>(20)
const fontSize = ref<number>(16)
const letterSpacing = ref<number>(0)
const pSpacing = ref<number>(5)
const paddingLeft = ref<number>(10)
const paddingRight = ref<number>(10)
const paddingTop = ref<number>(10)
const paddingBottom = ref<number>(10)
const lineHeight = ref<number>(2)
const configList: Config[] = [
  generateThemeConfig(readerTheme),
  generateFontFamilyConfig(fontFamily),
  generateAdjusterConfig('columns', 4, 1, 1, columns),
  generateAdjusterConfig('columnGap', Infinity, 0, 2, columnGap),
  generateFontSizeConfig(fontSize),
  generateLetterSpacingConfig(letterSpacing),
  generatePaddingLeftConfig(paddingLeft),
  generatePaddingRightConfig(paddingRight),
  generatePaddingTopConfig(paddingTop),
  generatePaddingBottomConfig(paddingBottom),
  generateLineHeightConfig(lineHeight),
  generateParaSpacingConfig(pSpacing),
]
onMounted(() => {
  const saved = loadColumnReaderSettings()
  readerTheme.value = loadReaderTheme()
  applyReaderTheme(readerTheme.value as 'light' | 'dark')
  if (saved.fontFamily) fontFamily.value = saved.fontFamily
  if (saved.columns != null) columns.value = saved.columns
  if (saved.columnGap != null) columnGap.value = saved.columnGap
  if (saved.fontSize != null) fontSize.value = saved.fontSize
  if (saved.letterSpacing != null) letterSpacing.value = saved.letterSpacing
  if (saved.paddingLeft != null) paddingLeft.value = saved.paddingLeft
  if (saved.paddingRight != null) paddingRight.value = saved.paddingRight
  if (saved.paddingTop != null) paddingTop.value = saved.paddingTop
  if (saved.paddingBottom != null) paddingBottom.value = saved.paddingBottom
  if (saved.lineHeight != null) lineHeight.value = saved.lineHeight
  if (saved.paraSpacing != null) pSpacing.value = saved.paraSpacing

  emits('receiveConfig', configList)
})
onBeforeUnmount(() => {
  emits('receiveConfig', [])
})
/**
 * book
 */
const bookStore = useBookStore()
const { chapterNums, getChapterHTML, resolveHref } = useBookStore()
const currentChapterHTML = ref<string>('')

// template refs
const articleRef = useTemplateRef<HTMLElement>('articleRef')
const delta = ref<number>(0)
const maxPageIndex = ref<number>(0)
const index = ref<number>(0)

// load book
onMounted(async () => {
  currentChapterHTML.value = await getChapterHTML()
  // jump to the last read location
  nextTick(() => {
    index.value = Math.floor(bookStore.progressInChapter * maxPageIndex.value)
  })
})

// vocabulary highlight for current chapter
const bookIdRef = toRef(props, 'bookId')
useVocabularyHighlight({
  rootRef: articleRef,
  bookId: bookIdRef,
  chapterHtml: currentChapterHTML,
})

// vocabulary popup for highlighted words
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

async function skipToChapter(newV: ResolvedHref) {
  if (newV.id.length > 0) {
    currentChapterHTML.value = await bookStore.getChapterThroughId(newV.id)
    index.value = 0
  }
  if (newV.selector.length > 0) {
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      const eleLeft = articleRef.value?.querySelector(newV.selector)?.getBoundingClientRect().left
      if (eleLeft) {
        recaculate()
        index.value = Math.min(Math.floor(eleLeft / delta.value), maxPageIndex.value)
      }
      clearTimeout(timer)
    }, 0)
  }
}

// load book when select toc item
watch(() => props.selectedTocItem, skipToChapter)

// handle a tag href, bind to article element
const handleATagHrefColumn = handleATagHref(resolveHref, skipToChapter)

const saveProgressDebounced = useDebounce((progress: number) => {
  void updateBookProgress(bookIdRef.value, bookStore.chapterIndex, progress)
}, 500)

watch(index, (newValue) => {
  // save the last read location
  // increasing newValue by 0.5 is to avoid progress decay when switching readers
  const progress = (newValue + 0.5) / maxPageIndex.value
  bookStore.progressInChapter = progress
  if (Number.isFinite(progress) && maxPageIndex.value > 0) {
    saveProgressDebounced(progress)
  }
})

function recaculatePage() {
  if (!articleRef.value)
    return

  const pageWidth = Number.parseFloat(
    window.getComputedStyle(articleRef.value!).width,
  ) || 0
  delta.value = pageWidth + columnGap.value

  const articleScrollWidth = articleRef.value.scrollWidth
  maxPageIndex.value = Math.floor(articleScrollWidth / pageWidth) - 1
}
function recaculateScroll() {
  articleRef.value!.scrollTo({
    top: 0,
    left: index.value * delta.value,
  })
}
function recaculate() {
  recaculatePage()
  recaculateScroll()
}
const recaculateWithDebounce = useDebounce(recaculate, 20)
onUpdated(recaculate)
onMounted(() => {
  // the layout of content is not completed in one cycle,
  //  so set 100ms timeout to recaculate some ref
  const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
    recaculate()
    clearTimeout(timer)
  }, 100)
})
window.addEventListener('resize', recaculateWithDebounce)

// page turning
async function nextPage() {
  if (index.value >= maxPageIndex.value) {
    if (bookStore.chapterIndex + 1 < chapterNums) {
      bookStore.chapterIndex++
      currentChapterHTML.value = await getChapterHTML()
      recaculatePage()
      index.value = 0
      recaculateScroll()
    }
  }
  else {
    index.value++
    recaculateScroll()
  }
}
async function prevPage() {
  if (index.value <= 0) {
    if (bookStore.chapterIndex - 1 >= 0) {
      bookStore.chapterIndex--
      currentChapterHTML.value = await getChapterHTML()
      nextTick(() => {
        recaculatePage()
        index.value = Math.max(0, maxPageIndex.value)
        recaculateScroll()
      })
    }
  }
  else {
    index.value--
    recaculateScroll()
  }
}

const saveSettingsDebounced = useDebounce(() => {
  const theme = (readerTheme.value as 'light' | 'dark') || 'light'
  saveReaderTheme(theme)
  applyReaderTheme(theme)
  saveColumnReaderSettings({
    fontFamily: fontFamily.value,
    columns: columns.value,
    columnGap: columnGap.value,
    fontSize: fontSize.value,
    letterSpacing: letterSpacing.value,
    paddingLeft: paddingLeft.value,
    paddingRight: paddingRight.value,
    paddingTop: paddingTop.value,
    paddingBottom: paddingBottom.value,
    lineHeight: lineHeight.value,
    paraSpacing: pSpacing.value,
  })
}, 300)

watch([
  readerTheme,
  fontFamily,
  columns,
  columnGap,
  fontSize,
  letterSpacing,
  paddingLeft,
  paddingRight,
  paddingTop,
  paddingBottom,
  lineHeight,
  pSpacing,
], saveSettingsDebounced)

const wheelEvent = useThrottle((e: WheelEvent) => {
  emits('infoDown')
  if (e.deltaY > 0) {
    nextPage()
  }
  else {
    prevPage()
  }
}, 400)
const keyDownEvent = useDebounce((e: KeyboardEvent) => {
  e.preventDefault()
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    nextPage()
  }
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    prevPage()
  }
  else {
    return
  }
  emits('infoDown')
}, 150)
document.addEventListener('wheel', wheelEvent, { passive: true })
document.addEventListener('keydown', keyDownEvent)

// touch swipe for page turning (mobile)
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1)
    return

  const t = e.touches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
  touchStartTime = Date.now()
}

function handleTouchEnd(e: TouchEvent) {
  if (e.changedTouches.length !== 1)
    return

  const t = e.changedTouches[0]
  const dx = t.clientX - touchStartX
  const dy = t.clientY - touchStartY
  const dt = Date.now() - touchStartTime

  // 如果当前有选中的文本，则认为是选词操作，不触发翻页
  const selection = window.getSelection()
  if (selection && selection.toString().trim().length > 0)
    return

  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  // 只识别短时间、明显水平滑动为翻页手势
  if (dt > 400)
    return
  if (absDx < 40)
    return
  if (absDx <= absDy)
    return

  if (dx < 0) {
    void nextPage()
  }
  else {
    void prevPage()
  }
}

onUnmounted(() => {
  window.removeEventListener('resize', recaculateWithDebounce)
  document.removeEventListener('wheel', wheelEvent)
  document.removeEventListener('keydown', keyDownEvent)
})
</script>

<template>
  <div
    class="container" :style="{
      fontFamily,
      paddingLeft: withPxImportant(paddingLeft),
      paddingRight: withPxImportant(paddingRight),
      paddingTop: withPxImportant(paddingTop),
      paddingBottom: withPxImportant(paddingBottom),
    }"
  >
    <!-- nextPage and prevPage button -->
    <button class="next-page-button" @click.stop="nextPage">
      {{ t('nextPage') }}
    </button>
    <button class="prev-page-button" @click.stop="prevPage">
      {{ t('prevPage') }}
    </button>
    <!-- !!!maybe error -->
    <span class="progress">{{ index + 1 }} / {{ maxPageIndex === -1 ? 1 : maxPageIndex + 1 }}</span>

    <!-- text -->
    <article
      ref="articleRef" class="article" :style="{
        columns,
        lineHeight,
        'fontSize': withPxImportant(fontSize),
        'columnGap': withPx(columnGap),
        'letterSpacing': withPx(letterSpacing),
        '--p-spacing': withPx(pSpacing),
      }"
      @click="handleATagHrefColumn"
      @touchstart.passive="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <div class="article-text" v-html="currentChapterHTML" />

      <!-- placeholder for making sure the scrolling logic working as expected -->
      <div style="width: 100%; height: 100%;" />
    </article>

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
  </div>
</template>

<style scoped>
/* text */
.container {
  margin: 0;
  box-sizing: border-box;
  height: 100vh;
  width: 100vw;
  background-color: #f7f5f2;
  overflow: hidden;
  position: relative;
}

.article {
  box-sizing: border-box;
  column-fill: auto;
  height: 100%;
  width: 100%;
  overflow: hidden;
  overflow-wrap: break-word;
}

/* To remove default css set by inline style */
.article-text * {
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  letter-spacing: inherit !important;
}

.article-text :deep(p) {
  text-indent: 0;
  margin: 0 0 1.2em;
  line-height: 1.75;
}

.article-text :deep(li p) {
  text-indent: 0;
}

.article-text :deep(figure p) {
  text-indent: 0;
}

.article-text :deep(figure) {
  text-align: center;
}

.article-text :deep(img) {
  display: block;
  margin: auto;
  max-width: 100%;
  max-height: 97vh;
  object-fit: contain;
}

.article-text :deep(pre) {
  background-color: rgba(204, 201, 194, 0.3);
  overflow: hidden;
}

/* allow text in code to wrap */
.article-text :deep(code) {
  white-space: pre-wrap;
  /* Keep whitespace, but allow auto wrap */
  word-wrap: break-word;
  /* Wrap lines at long words (old standard) */
  word-break: break-word;
  /* Handling line breaks for long words (better compatibility) */
}

.article-text :deep(a) {
  word-wrap: break-word;
  /* Allow long words to wrap */
  white-space: normal;
  /* Ensure that the text can wrap */
  /* word-break: break-all; */
  /* Force line breaks in words */
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

/* prev and next page button */
.next-page-button,
.prev-page-button {
  position: absolute;
  bottom: 0;
  right: 0;
  margin: 5px;
  padding: 5px;
  background-color: #f0f0f0;
  border: 1px solid #000;
  border-radius: 5px;
  opacity: 0.2;
}

.next-page-button:hover,
.prev-page-button:hover {
  opacity: 1;
}

.prev-page-button {
  right: auto;
  left: 0;
}

.progress {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translate(-50%);
  opacity: 0.5;
}
</style>
