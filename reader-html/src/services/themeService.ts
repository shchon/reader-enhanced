const THEME_KEY = 'lingoReader.readerTheme'
export type ReaderTheme = 'light' | 'dark'

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

export function loadReaderTheme(): ReaderTheme {
  const storage = getStorage()
  if (!storage)
    return 'light'

  const raw = storage.getItem(THEME_KEY)
  return raw === 'dark' ? 'dark' : 'light'
}

export function saveReaderTheme(theme: ReaderTheme): void {
  const storage = getStorage()
  if (!storage)
    return
  storage.setItem(THEME_KEY, theme)
}

export function applyReaderTheme(theme: ReaderTheme): void {
  if (typeof document === 'undefined')
    return
  const body = document.body
  if (!body)
    return

  if (theme === 'dark') {
    body.classList.add('reader-theme-dark')
  }
  else {
    body.classList.remove('reader-theme-dark')
  }
}
