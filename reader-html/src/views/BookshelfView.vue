<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBookshelf } from '../composables/useBookshelf'
import BookCard from '../components/Bookshelf/BookCard.vue'
import { addVocabularyItem, getAllVocabularyItems } from '../services/vocabularyService'
import { saveLocale } from '../i18n'

const router = useRouter()
const { t, locale } = useI18n()
const { isImporting, books, handleFilesSelected, loadBooks, openBookFromId, deleteBook } = useBookshelf()

const vocabularyWords = ref<string[]>([])
const vocabularyTotalCount = ref(0)
const isVocabularyOpen = ref(false)

const vocabularyImportInputRef = ref<HTMLInputElement | null>(null)

const vocabularyCount = computed(() => vocabularyTotalCount.value)

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  handleFilesSelected(target?.files ?? null)
}

async function onBookSelect(bookId: number) {
  await openBookFromId(bookId)
  router.push({ name: 'book', query: { bookId: String(bookId) } })
}

async function onDeleteBook(bookId: number, title: string) {
  const ok = window.confirm(`确定要删除《${title}》吗？\n此操作只会删除书架中的这本书，不会影响生词本。`)
  if (!ok)
    return

  await deleteBook(bookId)
}

async function loadVocabularyOverview() {
  const items = await getAllVocabularyItems()
  vocabularyTotalCount.value = items.length

  const sorted = items
    .slice()
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, 15)

  vocabularyWords.value = sorted.map(item => item.word)
}

function toggleVocabulary() {
  isVocabularyOpen.value = !isVocabularyOpen.value
}

async function exportVocabularyToAnki() {
  const items = await getAllVocabularyItems()
  const header = ['word', 'context', 'aiexplanation']
  const rows = items.map((item) => {
    const word = item.word ?? ''
    const context = item.context ?? ''
    // 在导出的 context 中将生词用 <b> 包裹，方便 Anki 中以粗体显示
    const highlightedContext = word
      ? context.split(word).join(`<b>${word}</b>`)
      : context

    const explanation = (item.aiExplanation ?? '').replace(/\r\n|\r|\n/g, '<br>')

    return [
      word,
      highlightedContext,
      explanation,
    ]
  })

  function escapeCell(value: string): string {
    const safe = (value ?? '').replace(/"/g, '""')
    return `"${safe}"`
  }

  const csvLines = [
    header.join(','),
    ...rows.map(cols => cols.map(escapeCell).join(',')),
  ]

  // UTF-8 BOM 以便在 Excel/Anki 中正常识别中文
  const csvContent = '\uFEFF' + csvLines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `anki-vocabulary-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function parseCsv(content: string): string[][] {
  let text = content
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1)
  }

  const rows: string[][] = []
  let currentRow: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        const next = text[i + 1]
        if (next === '"') {
          field += '"'
          i++
        }
        else {
          inQuotes = false
        }
      }
      else {
        field += char
      }
    }
    else {
      if (char === '"') {
        inQuotes = true
      }
      else if (char === ',') {
        currentRow.push(field)
        field = ''
      }
      else if (char === '\r' || char === '\n') {
        // 处理 CRLF 或单独的 CR/LF
        if (char === '\r' && text[i + 1] === '\n') {
          i++
        }
        currentRow.push(field)
        field = ''
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
          rows.push(currentRow)
        }
        currentRow = []
      }
      else {
        field += char
      }
    }
  }

  if (field.length > 0 || currentRow.length > 0) {
    currentRow.push(field)
    rows.push(currentRow)
  }

  return rows
}

async function importVocabularyFromCsvFile(file: File) {
  const text = await file.text()
  const rows = parseCsv(text)
  if (!rows.length) {
    window.alert('CSV 内容为空')
    return
  }

  const header = rows[0].map(col => col.trim().toLowerCase())
  const wordIndex = header.indexOf('word')
  const contextIndex = header.indexOf('context')
  const explanationIndex = header.indexOf('aiexplanation')

  if (wordIndex === -1 || contextIndex === -1 || explanationIndex === -1) {
    window.alert('CSV 头部格式不符合预期，必须包含列：word, context, aiexplanation')
    return
  }

  let imported = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const rawWord = (row[wordIndex] || '').trim()
    if (!rawWord) {
      continue
    }

    const rawContext = row[contextIndex] || ''
    const rawExplanation = row[explanationIndex] || ''

    const context = rawContext.replace(/<\/?b>/gi, '')
    const aiExplanation = rawExplanation.replace(/<br\s*\/?>(?=\s*\n?)/gi, '\n')

    try {
      const added = await addVocabularyItem({
        word: rawWord,
        context,
        aiExplanation,
        // 重新导入的生词没有明确来源书籍，用 0 作为占位
        bookId: 0,
      })
      if (added)
        imported++
    }
    catch (error) {
      console.warn('[Vocabulary][Import] Failed to import row', { index: i, error })
    }
  }

  await loadVocabularyOverview()

  window.alert(`导入完成，共导入 ${imported} 条生词。`)
}

function onVocabularyImportClick() {
  const el = vocabularyImportInputRef.value
  if (!el)
    return
  el.value = ''
  el.click()
}

function onVocabularyImportChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file)
    return

  void importVocabularyFromCsvFile(file)
}

function toggleLocale() {
	const next = locale.value === 'en' ? 'zh' : 'en'
	locale.value = next
	saveLocale(next as 'en' | 'zh')
}

onMounted(() => {
  loadBooks()
  loadVocabularyOverview()
})
</script>

<template>
  <main class="bookshelf-root">
    <header class="bookshelf-header">
      <h1 class="bookshelf-title">
        {{ t('bookshelfTitle') }}
      </h1>
      <div class="bookshelf-header-actions">
        <button
          type="button"
          class="bookshelf-lang-button"
          @click="toggleLocale"
          :title="locale === 'en' ? '切换到中文' : 'Switch to English'"
        >
          <span class="bookshelf-icon" aria-hidden="true">{{ locale === 'en' ? 'EN' : '中' }}</span>
          <span class="sr-only">Language</span>
        </button>
        <button
          type="button"
          class="bookshelf-vocabulary-button"
          @click="toggleVocabulary"
          :title="t('bookshelfVocabulary')"
        >
          <span class="bookshelf-icon" aria-hidden="true">📚</span>
          <span v-if="vocabularyCount" class="bookshelf-vocabulary-badge">
            {{ vocabularyCount }}
          </span>
          <span class="sr-only">
            {{ t('bookshelfVocabulary') }}
          </span>
        </button>
        <button
          type="button"
          class="bookshelf-settings-button"
          @click="router.push({ name: 'settings' })"
          :title="t('settingsTitle')"
        >
          <span class="bookshelf-icon" aria-hidden="true">⚙</span>
          <span class="sr-only">
            {{ t('settingsTitle') }}
          </span>
        </button>
      </div>
    </header>

    <section v-if="isVocabularyOpen" class="bookshelf-vocabulary-panel">
      <p class="bookshelf-vocabulary-summary">
        {{ t('bookshelfVocabularyCount', { count: vocabularyCount }) }}
      </p>
      <button
        type="button"
        class="bookshelf-anki-export-button bookshelf-anki-export-button--export"
        @click="exportVocabularyToAnki"
      >
        导出生词 CSV
      </button>
      <button
        type="button"
        class="bookshelf-anki-export-button bookshelf-anki-export-button--import"
        @click="onVocabularyImportClick"
      >
        导入生词 CSV
      </button>
      <input
        ref="vocabularyImportInputRef"
        type="file"
        hidden
        accept=".csv,text/csv"
        @change="onVocabularyImportChange"
      >
      <p class="bookshelf-vocabulary-words">
        {{ vocabularyWords.join(' · ') }}
      </p>
    </section>

    <section class="bookshelf-import-section">
      <label
        for="bookshelf-file-input"
        class="bookshelf-import-button"
      >
        <span>{{ t('bookshelfImportButton') }}</span>
      </label>
      <input
        id="bookshelf-file-input"
        type="file"
        hidden
        multiple
        accept=".epub,.mobi,.azw3,.fb2,.txt,application/epub+zip,application/x-mobipocket-ebook"
        @change="onFileChange"
      >

      <p class="bookshelf-import-hint">
        {{ t('bookshelfImportHint') }}
      </p>

      <p v-if="isImporting" class="bookshelf-importing">
        {{ t('bookshelfImporting') }}
      </p>
    </section>

    <section v-if="books.length" class="bookshelf-grid">
      <BookCard
        v-for="book in books"
        :key="book.id"
        :title="book.title"
        :author="book.author"
        @select="onBookSelect(book.id)"
        @delete="onDeleteBook(book.id, book.title)"
      />
    </section>

    <p v-else class="bookshelf-empty-hint">
      {{ t('bookshelfEmptyHint') }}
    </p>
  </main>
</template>

<style scoped>
.bookshelf-root {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bookshelf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bookshelf-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bookshelf-title {
  font-size: 20px;
  font-weight: 600;
}

.bookshelf-settings-button,
.bookshelf-vocabulary-button,
.bookshelf-lang-button {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
}

.bookshelf-lang-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 32px;
}

.bookshelf-settings-button {
  background-color: #f3f4f6;
}

.bookshelf-vocabulary-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #e5f0ff;
}

.bookshelf-icon {
  font-size: 16px;
  line-height: 1;
}

.bookshelf-vocabulary-badge {
  min-width: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background-color: #1d4ed8;
  color: #fff;
  font-size: 11px;
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.bookshelf-import-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.bookshelf-import-button {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border: 1px solid #1d4ed8;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  background-color: #2563eb;
  color: #fff;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.bookshelf-import-button:hover {
  background-color: #1d4ed8;
}

.bookshelf-import-hint,
.bookshelf-importing,
.bookshelf-empty-hint {
  font-size: 12px;
  color: #555;
}

.bookshelf-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 768px) {
  .bookshelf-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.bookshelf-vocabulary-panel {
  margin-top: 12px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.bookshelf-anki-export-button {
  margin-top: 4px;
  margin-bottom: 4px;
  margin-right: 8px;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background-color: #eef2ff;
}

.bookshelf-anki-export-button--export {
  background-color: #eef2ff;
  border-color: #c7d2fe;
  color: #1e40af;
}

.bookshelf-anki-export-button--import {
  background-color: #ecfdf3;
  border-color: #bbf7d0;
  color: #166534;
}

.bookshelf-vocabulary-summary {
  font-size: 13px;
  margin-bottom: 4px;
}

.bookshelf-vocabulary-words {
  font-size: 13px;
  word-break: break-word;
}
</style>
