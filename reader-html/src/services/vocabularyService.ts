import { type VocabularyItem, db } from './db'

export interface AddVocabularyInput {
  word: string
  context: string
  aiExplanation: string
  bookId: number
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export async function addVocabularyItem(input: AddVocabularyInput): Promise<boolean> {
  const word = input.word.trim()
  if (!word) {
    return false
  }

  // 去重：全局范围内，完全相同的 word + context 视为同一条生词记录（不再区分 bookId）
  const existing = await db.vocabulary
    .where('word').equals(word)
    .and(item => item.context === input.context)
    .first()

  if (existing) {
    return false
  }

  const now = Date.now()

  await db.vocabulary.add({
    id: createId(),
    word,
    context: input.context,
    aiExplanation: input.aiExplanation,
    bookId: input.bookId,
    createdAt: now,
  })

  return true
}

export async function getVocabularyByBookId(bookId: number): Promise<VocabularyItem[]> {
  if (!bookId)
    return []
  return db.vocabulary.where('bookId').equals(bookId).toArray()
}

export async function getAllVocabularyItems(): Promise<VocabularyItem[]> {
  return db.vocabulary.toArray()
}

export async function deleteVocabularyItem(id: string): Promise<void> {
  if (!id)
    return

  await db.vocabulary.delete(id)
}
