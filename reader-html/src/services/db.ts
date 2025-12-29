import Dexie, { type Table } from 'dexie'

export interface Book {
  id?: number
  title: string
  author: string
  /**
   * 原始文件名（含扩展名），用于从 IndexedDB 读取 Blob 后重新构造 File
   * 并让解析管线根据扩展名选择正确的解析器。
   */
  fileName: string
  cover: Blob | null
  data: Blob
  lastRead: number | null
  /**
   * 阅读进度，0–1 之间的浮点数
   */
  progress: number
  /**
   * 当前所在章节索引（0-based），用于恢复阅读位置
   */
  currentChapterIndex?: number
}

export interface VocabularyItem {
  id: string
  word: string
  context: string
  aiExplanation: string
  bookId: number
  createdAt: number
}

export class LingoReaderDB extends Dexie {
  books!: Table<Book, number>
  vocabulary!: Table<VocabularyItem, string>

  constructor() {
    super('lingo-reader')

    this.version(1).stores({
      // 只对常用查询字段建立索引，避免对 Blob 建立索引
      books: '++id, title, author, lastRead',
      vocabulary: 'id, word, bookId, createdAt',
    })
  }
}

export const db = new LingoReaderDB()
