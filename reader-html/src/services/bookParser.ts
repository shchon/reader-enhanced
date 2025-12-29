import { initEpubFile } from '@lingo-reader/epub-parser'
import { initKf8File, initMobiFile } from '@lingo-reader/mobi-parser'
import { initFb2File } from '@lingo-reader/fb2-parser'
import type { EBookParser, FileInfo, Metadata } from '@lingo-reader/shared'

export interface ParsedBookForBookshelf {
  title: string
  author: string
  fileName: string
  /**
   * 原始上传的文件，用于后续写入 IndexedDB `data` 字段。
   */
  file: File
  /**
   * 封面二进制数据占位，当前阶段暂不填充（保持为 null），
   * 后续可通过解析结果或单独策略加载封面并写入。
   */
  cover: Blob | null
}

function stripExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return fileName
  }
  return fileName.slice(0, lastDotIndex)
}

function getSafeFileName(info: FileInfo, fallbackName: string): string {
  if (info.fileName && info.fileName.length > 0) {
    return info.fileName
  }
  return fallbackName
}

function extractTitle(metadata: Metadata, fileName: string): string {
  const fromTitle = metadata.title
  if (typeof fromTitle === 'string' && fromTitle.trim().length > 0) {
    return fromTitle.trim()
  }

  const fromBookName = (metadata as { bookName?: unknown }).bookName
  if (typeof fromBookName === 'string' && fromBookName.trim().length > 0) {
    return fromBookName.trim()
  }

  return stripExtension(fileName)
}

function normaliseAuthorValue(value: unknown): string {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (Array.isArray(value)) {
    const first = value[0]
    if (typeof first === 'string') {
      return first.trim()
    }
    if (first && typeof first === 'object') {
      const maybeName = (first as { name?: unknown; fileAs?: unknown }).name
        ?? (first as { fileAs?: unknown }).fileAs
      if (typeof maybeName === 'string') {
        return maybeName.trim()
      }
    }
  }

  if (typeof value === 'object') {
    const maybeName = (value as { name?: unknown }).name
    if (typeof maybeName === 'string') {
      return maybeName.trim()
    }
  }

  return ''
}

function extractAuthor(metadata: Metadata): string {
  const fromCreator = normaliseAuthorValue((metadata as { creator?: unknown }).creator)
  if (fromCreator.length > 0) {
    return fromCreator
  }

  const fromAuthor = normaliseAuthorValue((metadata as { author?: unknown }).author)
  if (fromAuthor.length > 0) {
    return fromAuthor
  }

  return ''
}

async function initParser(file: File): Promise<EBookParser> {
  const lowerName = file.name.toLowerCase()

  if (lowerName.endsWith('.epub')) {
    return await initEpubFile(file, undefined)
  }

  if (lowerName.endsWith('.mobi')) {
    return await initMobiFile(file)
  }

  if (lowerName.endsWith('.kf8') || lowerName.endsWith('.azw3')) {
    return await initKf8File(file)
  }

  if (lowerName.endsWith('.fb2')) {
    return await initFb2File(file)
  }

  throw new Error('Unsupported file type for bookshelf import')
}

export async function parseBookFileForBookshelf(file: File): Promise<ParsedBookForBookshelf> {
  const parser = await initParser(file)
  const metadata = parser.getMetadata()
  const fileInfo = parser.getFileInfo()

  const safeFileName = getSafeFileName(fileInfo, file.name)
  const title = extractTitle(metadata, safeFileName)
  const author = extractAuthor(metadata)

  return {
    title,
    author,
    fileName: safeFileName,
    file,
    cover: null,
  }
}

export async function parseMultipleFilesForBookshelf(files: readonly File[]): Promise<ParsedBookForBookshelf[]> {
  const results: ParsedBookForBookshelf[] = []

  for (const file of files) {
    // 逐个解析，便于在未来为单个文件增加错误处理与提示
    const parsed = await parseBookFileForBookshelf(file)
    results.push(parsed)
  }

  return results
}
