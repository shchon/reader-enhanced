<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, toRef, useTemplateRef, watch } from 'vue'
import type { ResolvedHref } from '@lingo-reader/shared'
import { useI18n } from 'vue-i18n'
import { useBookStore } from '../../../store'
import { useDebounce, withPx } from '../../../utils'
import Resizer from '../../Resizer/Resizer.vue'
import {
  type Config,
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
const pSpacing = ref<number>(5)
const textPaddingLeft = ref<number>(5)
const textPaddingRight = ref<number>(1)
const textPaddingTop = ref<number>(0)
const textPaddingBottom = ref<number>(300)
const configList: Config[] = [
  generateThemeConfig(readerTheme),
  generateFontFamilyConfig(fontFamily),
  generateFontSizeConfig(fontSize),
  generateLetterSpacingConfig(letterSpacing),
  generateLineHeightConfig(lineHeight),
  generateParaSpacingConfig(pSpacing),
  generatePaddingLeftConfig(textPaddingLeft),
  generatePaddingRightConfig(textPaddingRight),
  generatePaddingTopConfig(textPaddingTop),
  generatePaddingBottomConfig(textPaddingBottom),
]
onMounted(() => {
  readerTheme.value = loadReaderTheme()
  applyReaderTheme(readerTheme.value as 'light' | 'dark')
  emits('receiveConfig', configList)
})
onBeforeUnmount(() => {
  emits('receiveConfig', [])
})
const articleWrapRef = useTemplateRef('articleWrapRef')
const articleRef = useTemplateRef<HTMLElement>('articleRef')

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
    const scrollHeight = articleWrapRef.value!.scrollHeight
    const targetPosition = bookStore.progressInChapter * scrollHeight
    articleWrapRef.value!.scrollTo({ top: targetPosition })
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
const handleArticleScroll = useDebounce(() => {
  const scrollTop = articleWrapRef.value!.scrollTop
  const scrollHeight = articleWrapRef.value!.scrollHeight || 1
  const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0
  bookStore.progressInChapter = progress
  void updateBookProgress(bookIdRef.value, bookStore.chapterIndex, progress)
}, 500)

async function skipToChapter(newV: ResolvedHref) {
  if (newV.id.length > 0) {
    currentChapterHTML.value = await bookStore.getChapterThroughId(newV.id)
  }
  if (newV.selector.length > 0) {
    nextTick(() => {
      articleWrapRef.value!.querySelector(newV.selector)!.scrollIntoView()
    })
  }
}

// load book when select toc item
watch(() => props.selectedTocItem, skipToChapter)

// handle a tag href, bind to article element
const handleATagHrefScrollNote = handleATagHref(resolveHref, skipToChapter)

// global theme: persist and apply immediately when user toggles theme in config panel
const saveThemeDebounced = useDebounce(() => {
	const theme = (readerTheme.value as 'light' | 'dark') || 'light'
	saveReaderTheme(theme)
	applyReaderTheme(theme)
}, 200)

watch(readerTheme, saveThemeDebounced)

async function prevChapter() {
  if (bookStore.chapterIndex > 0) {
    bookStore.chapterIndex--
    currentChapterHTML.value = await getChapterHTML()
    articleWrapRef.value!.scrollTop = 0
  }
}
async function nextChapter() {
  if (bookStore.chapterIndex < chapterNums - 1) {
    bookStore.chapterIndex++
    currentChapterHTML.value = await getChapterHTML()
    articleWrapRef.value!.scrollTop = 0
  }
}

/**
 * textarea blur
 */
let isBlur = false
function noteBlur() {
  isBlur = true
}
function noteFocus() {
  emits('infoDown')
}

/**
 * resize width of note and article
 */
// swap button
const isReverse = ref<boolean>(false)
function swap() {
  isReverse.value = !isReverse.value
}
// resize
let startX = 0
// ban select chapter content in <article>
const isDragging = ref<boolean>(false)
const noteBasis = ref<number>(0)
const articleBasis = ref<number>(0)

function containerClick(e: MouseEvent) {
  if (isDragging.value || isBlur) {
    e.stopPropagation()
  }
  if (isBlur) {
    isBlur = false
  }
}

function onMouseMove(e: MouseEvent) {
  isDragging.value = true
  const delta = e.clientX - startX
  if (isReverse.value) {
    noteBasis.value -= delta * 2
    articleBasis.value += delta * 2
  }
  else {
    noteBasis.value += delta * 2
    articleBasis.value -= delta * 2
  }
  startX = e.clientX
}
function onMouseUp() {
  setTimeout(() => {
    isDragging.value = false
  }, 0)
}
function onMouseDown(e: MouseEvent) {
  startX = e.clientX
}
</script>

<template>
  <button class="swap-button" @click.stop="swap">
    {{ t("swap") }}
  </button>
  <div
    :style="{ fontSize: withPx(fontSize), letterSpacing: withPx(letterSpacing) }"
    :class="{ 'flex-row-reverse': isReverse }" class="article-container" @click="(e) => containerClick(e)"
  >
    <div :style="{ flexBasis: withPx(noteBasis) }" class="note">
      <textarea name="note" @blur="noteBlur" @focus="noteFocus" @click.stop />
    </div>
    <Resizer @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" />
    <!-- this -->
    <div
      ref="articleWrapRef" :style="{
        fontFamily,
        lineHeight,
        'paddingLeft': withPx(textPaddingLeft),
        'paddingRight': withPx(textPaddingRight),
        'paddingTop': withPx(textPaddingTop),
        'paddingBottom': withPx(textPaddingBottom),
        'flexBasis': withPx(articleBasis),
        '--p-spacing': withPx(pSpacing),
      }" :class="{ 'user-select-none': isDragging }" class="article-wrap"
      @scroll="handleArticleScroll"
    >
      <button class="button prev-chapter" @click.stop="prevChapter">
        {{ t('prevChapter') }}
      </button>
      <button class="button next-chapter" @click.stop="nextChapter">
        {{ t('nextChapter') }}
      </button>
      <article ref="articleRef" class="article-text" @click="handleATagHrefScrollNote" v-html="currentChapterHTML" />
    </div>
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

.flex-row-reverse {
  flex-direction: row-reverse;
}

.swap-button {
  position: fixed;
  padding: 5px;
  font-family: Lucida Console;
  background-color: #f0f0f0;
  border: 1px solid #000;
  border-radius: 5px;
  opacity: 0.2;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;

  &:hover {
    opacity: 1;
  }
}

.article-container {
  width: 100%;
  height: 100vh;
  display: grid;
  grid-template-columns: 2.5fr 1fr;
  margin: 0;
  box-sizing: border-box;
  font-family: Georgia, 'Times New Roman', serif;
  background-color: transparent;
}

.note {
  flex: 1 1;
}

.note textarea {
  display: block;
  box-sizing: border-box;
  height: 100vh;
  width: 100%;
  padding: 2rem;
  border: none;
  outline: none;
  resize: none;
}

.article-wrap {
  box-sizing: border-box;
  min-width: 0;
  max-width: 680px;
  margin: 64px auto 80px;
}

.prev-chapter {
  position: fixed;
  top: 10px;
  right: 10px;
  opacity: 0.2;
}

.next-chapter {
  position: fixed;
  bottom: 10px;
  right: 10px;
  opacity: 0.2;
}

.prev-chapter:hover,
.next-chapter:hover {
  opacity: 1;
  background-color: white;
}

/* To remove default css set by inline style */
.article-text * {
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  letter-spacing: inherit !important;
}

.article-text :deep(img) {
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
</style>
