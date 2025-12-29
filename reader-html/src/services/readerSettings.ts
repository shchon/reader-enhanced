export interface ColumnReaderSettings {
  fontFamily: string
  columns: number
  columnGap: number
  fontSize: number
  letterSpacing: number
  paddingLeft: number
  paddingRight: number
  paddingTop: number
  paddingBottom: number
  lineHeight: number
  paraSpacing: number
}

export interface ScrollReaderSettings {
  fontFamily: string
  fontSize: number
  letterSpacing: number
  lineHeight: number
  textPaddingLeft: number
  textPaddingRight: number
  textPaddingTop: number
  textPaddingBottom: number
  pSpacing: number
  scrollSidePadding: number
}

const COLUMN_KEY = 'lingoReader.reader.column'
const SCROLL_KEY = 'lingoReader.reader.scroll'

function safeParse<T>(raw: string | null): Partial<T> {
  if (!raw)
    return {}

  try {
    return JSON.parse(raw) as Partial<T>
  }
  catch {
    return {}
  }
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined')
    return null
  try {
    return window.localStorage
  }
  catch {
    return null
  }
}

export function loadColumnReaderSettings(): Partial<ColumnReaderSettings> {
  const storage = getStorage()
  if (!storage)
    return {}
  return safeParse<ColumnReaderSettings>(storage.getItem(COLUMN_KEY))
}

export function saveColumnReaderSettings(settings: Partial<ColumnReaderSettings>): void {
  const storage = getStorage()
  if (!storage)
    return
  const existing = loadColumnReaderSettings()
  const merged: ColumnReaderSettings = {
    fontFamily: settings.fontFamily ?? existing.fontFamily ?? `'Lucida Console', Courier, monospace`,
    columns: settings.columns ?? existing.columns ?? 2,
    columnGap: settings.columnGap ?? existing.columnGap ?? 20,
    fontSize: settings.fontSize ?? existing.fontSize ?? 16,
    letterSpacing: settings.letterSpacing ?? existing.letterSpacing ?? 0,
    paddingLeft: settings.paddingLeft ?? existing.paddingLeft ?? 10,
    paddingRight: settings.paddingRight ?? existing.paddingRight ?? 10,
    paddingTop: settings.paddingTop ?? existing.paddingTop ?? 10,
    paddingBottom: settings.paddingBottom ?? existing.paddingBottom ?? 10,
    lineHeight: settings.lineHeight ?? existing.lineHeight ?? 2,
    paraSpacing: settings.paraSpacing ?? existing.paraSpacing ?? 5,
  }
  storage.setItem(COLUMN_KEY, JSON.stringify(merged))
}

export function loadScrollReaderSettings(): Partial<ScrollReaderSettings> {
  const storage = getStorage()
  if (!storage)
    return {}
  return safeParse<ScrollReaderSettings>(storage.getItem(SCROLL_KEY))
}

export function saveScrollReaderSettings(settings: Partial<ScrollReaderSettings>): void {
  const storage = getStorage()
  if (!storage)
    return
  const existing = loadScrollReaderSettings()
  const merged: ScrollReaderSettings = {
    fontFamily: settings.fontFamily ?? existing.fontFamily ?? `'Lucida Console', Courier, monospace`,
    fontSize: settings.fontSize ?? existing.fontSize ?? 16,
    letterSpacing: settings.letterSpacing ?? existing.letterSpacing ?? 0,
    lineHeight: settings.lineHeight ?? existing.lineHeight ?? 2,
    textPaddingLeft: settings.textPaddingLeft ?? existing.textPaddingLeft ?? 2,
    textPaddingRight: settings.textPaddingRight ?? existing.textPaddingRight ?? 2,
    textPaddingTop: settings.textPaddingTop ?? existing.textPaddingTop ?? 0,
    textPaddingBottom: settings.textPaddingBottom ?? existing.textPaddingBottom ?? 300,
    pSpacing: settings.pSpacing ?? existing.pSpacing ?? 5,
    scrollSidePadding: settings.scrollSidePadding ?? existing.scrollSidePadding ?? 200,
  }
  storage.setItem(SCROLL_KEY, JSON.stringify(merged))
}
