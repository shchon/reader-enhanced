<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBookshelf } from '../composables/useBookshelf'
import BookCard from '../components/Bookshelf/BookCard.vue'
import { getAllVocabularyItems } from '../services/vocabularyService'
import { saveLocale } from '../i18n'

const router = useRouter()
const { t, locale } = useI18n()
const { isImporting, books, handleFilesSelected, loadBooks, openBookFromId, deleteBook } = useBookshelf()

const vocabularyWords = ref<string[]>([])
const isVocabularyOpen = ref(false)

const vocabularyCount = computed(() => vocabularyWords.value.length)

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
        class="bookshelf-anki-export-button"
        @click="exportVocabularyToAnki"
      >
        导出生词到 Anki (JSON)
      </button>
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
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background-color: #eef2ff;
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
