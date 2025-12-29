import { createRouter, createWebHashHistory } from 'vue-router'
import { useBookStore } from '../store'
import routes from './routes'
import { db } from '../services/db'

const router = createRouter({
  routes,
  // Now /lingo-reader/ is same to base option in vite.config.ts
  history: createWebHashHistory('/lingo-reader/'),
})

// Ensure /book has an initialized book; try to restore from IndexedDB using bookId on refresh.
router.beforeEach(async (to, _from, next) => {
  if (to.path !== '/book') {
    next()
    return
  }

  const bookStore = useBookStore()
  if (bookStore.existBook()) {
    next()
    return
  }

  const rawBookId = to.query.bookId
  const bookId = typeof rawBookId === 'string' ? Number(rawBookId) : NaN
  if (!Number.isFinite(bookId)) {
    next({ name: 'home' })
    return
  }

  const record = await db.books.get(bookId)
  if (!record) {
    next({ name: 'home' })
    return
  }

  const fileName = record.fileName || record.title
  const file = new File([record.data], fileName, {
    type: record.data.type || 'application/octet-stream',
    lastModified: Date.now(),
  })

  await bookStore.initBook(file as File)
  bookStore.chapterIndex = record.currentChapterIndex ?? 0
  bookStore.progressInChapter = record.progress ?? 0

  next()
})

export default router
