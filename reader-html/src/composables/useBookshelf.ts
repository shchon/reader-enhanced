import { ref } from 'vue'
import type { ParsedBookForBookshelf } from '../services/bookParser'
import { parseMultipleFilesForBookshelf } from '../services/bookParser'
import { db } from '../services/db'
import { useBookStore } from '../store'

export function useBookshelf() {
  const isImporting = ref(false)
  const pendingBooks = ref<ParsedBookForBookshelf[]>([])
  const books = ref<Array<{
    id: number
    title: string
    author: string
  }>>([])

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }

    isImporting.value = true
    try {
      const fileArray: File[] = Array.from(files)
      const parsed = await parseMultipleFilesForBookshelf(fileArray)

      pendingBooks.value = parsed

      // 将解析结果写入 IndexedDB 的 books 表，仅在导入时执行，避免后续列表展示时批量读取 data Blob
      await db.books.bulkAdd(
        parsed.map(book => ({
          title: book.title,
          author: book.author,
          fileName: book.fileName,
          cover: book.cover,
          data: book.file,
          lastRead: null,
          progress: 0,
        })),
      )

      console.info('[Bookshelf] Parsed books saved to IndexedDB', parsed)

      // 导入完成后立即刷新内存中的书架列表，避免需要手动刷新页面
      await loadBooks()
    }
    finally {
      isImporting.value = false
    }
  }

  async function loadBooks() {
    const all = await db.books.toArray()
    books.value = all.map((book) => ({
      id: book.id!,
      title: book.title,
      author: book.author,
    }))
  }

  async function openBookFromId(bookId: number) {
    const record = await db.books.get(bookId)
    if (!record) {
      console.warn('[Bookshelf] Book not found in IndexedDB for id', bookId)
      return
    }

    const fileName = record.fileName || record.title
    const file = new File([record.data], fileName, {
      type: record.data.type || 'application/octet-stream',
      lastModified: Date.now(),
    })

    const bookStore = useBookStore()
    await bookStore.initBook(file as File)

    // 恢复章节索引与章节内进度
    bookStore.chapterIndex = record.currentChapterIndex ?? 0
    bookStore.progressInChapter = record.progress ?? 0

    await db.books.update(bookId, { lastRead: Date.now() })
  }

  async function deleteBook(bookId: number) {
    if (!Number.isFinite(bookId as number))
      return

    await db.books.delete(bookId)
    await loadBooks()
  }

  return {
    isImporting,
    pendingBooks,
    books,
    loadBooks,
    openBookFromId,
    handleFilesSelected,
    deleteBook,
  }
}
