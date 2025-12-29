import { db, type VocabularyItem } from './db'

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

export async function addVocabularyItem(input: AddVocabularyInput): Promise<void> {
  const word = input.word.trim()
  if (!word) {
    return
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
}

export async function getVocabularyByBookId(bookId: number): Promise<VocabularyItem[]> {
  if (!bookId) return []
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
