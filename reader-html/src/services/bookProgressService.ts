import { db } from './db'

export async function updateBookProgress(
  bookId: number,
  chapterIndex: number,
  progress: number,
): Promise<void> {
  if (!Number.isFinite(bookId)) {
    return
  }

  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0))
  const safeChapterIndex = Number.isFinite(chapterIndex) && chapterIndex >= 0 ? Math.floor(chapterIndex) : 0

  try {
    await db.books.update(bookId, {
      progress: clamped,
      currentChapterIndex: safeChapterIndex,
      lastRead: Date.now(),
    })
  }
  catch (error) {
    console.warn('[BookProgress] Failed to update progress for book', { bookId, error })
  }
}
