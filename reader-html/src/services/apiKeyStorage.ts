import enDefaultPrompt from '../assets/prompts/en-default.txt?raw'
import zhDefaultPrompt from '../assets/prompts/zh-default.txt?raw'
import prepositionDefaultPrompt from '../assets/prompts/preposition-default.txt?raw'

export const API_KEY_STORAGE_KEY = 'lingoReader.apiKey'
export const AI_BASE_URL_STORAGE_KEY = 'lingoReader.aiBaseUrl'
export const AI_MODEL_STORAGE_KEY = 'lingoReader.aiModel'
export const AI_PROMPT_GENERAL_STORAGE_KEY = 'lingoReader.aiPromptGeneral'
export const AI_PROMPT_EN_TRANSLATE_STORAGE_KEY = 'lingoReader.aiPromptEnTranslate'
export const AI_PROMPT_ZH_EXPLAIN_STORAGE_KEY = 'lingoReader.aiPromptZhExplain'
export const AI_PROMPT_PREPOSITION_STORAGE_KEY = 'lingoReader.aiPromptPreposition'
export const AI_PROMPT_MODE_STORAGE_KEY = 'lingoReader.aiPromptMode'

const DEFAULT_AI_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const DEFAULT_AI_MODEL = 'doubao-1.5-lite-32k-250115'

const DEFAULT_ZH_EXPLAIN_PROMPT = zhDefaultPrompt

const DEFAULT_EN_TRANSLATE_PROMPT = enDefaultPrompt

const DEFAULT_PREPOSITION_PROMPT = prepositionDefaultPrompt

export function getDefaultAiBaseUrl(): string {
  return DEFAULT_AI_BASE_URL
}

export function getDefaultAiModel(): string {
  return DEFAULT_AI_MODEL
}

export function getDefaultEnTranslatePrompt(): string {
  return DEFAULT_EN_TRANSLATE_PROMPT
}

export function getDefaultZhExplainPrompt(): string {
  return DEFAULT_ZH_EXPLAIN_PROMPT
}

export function getDefaultPrepositionPrompt(): string {
  return DEFAULT_PREPOSITION_PROMPT
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  }
  catch {
    return null
  }
}

export function getApiKey(): string | null {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  return storage.getItem(API_KEY_STORAGE_KEY)
}

export function setApiKey(key: string): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(API_KEY_STORAGE_KEY, key)
  }
  catch (error) {
    console.warn('[Settings] Failed to save API key to localStorage', error)
  }
}

export function clearApiKey(): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.removeItem(API_KEY_STORAGE_KEY)
  }
  catch (error) {
    console.warn('[Settings] Failed to clear API key from localStorage', error)
  }
}

function getString(key: string): string | null {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  return storage.getItem(key)
}

function setString(key: string, value: string): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(key, value)
  }
  catch (error) {
    console.warn('[Settings] Failed to save setting to localStorage', { key, error })
  }
}

export function getAiBaseUrl(): string {
  return getString(AI_BASE_URL_STORAGE_KEY) || DEFAULT_AI_BASE_URL
}

export function setAiBaseUrl(url: string): void {
  if (!url) {
    setString(AI_BASE_URL_STORAGE_KEY, DEFAULT_AI_BASE_URL)
    return
  }

  setString(AI_BASE_URL_STORAGE_KEY, url)
}

export function getAiModel(): string {
  return getString(AI_MODEL_STORAGE_KEY) || DEFAULT_AI_MODEL
}

export function setAiModel(model: string): void {
  if (!model) {
    setString(AI_MODEL_STORAGE_KEY, DEFAULT_AI_MODEL)
    return
  }

  setString(AI_MODEL_STORAGE_KEY, model)
}

export function getAiGeneralPrompt(): string {
  return getString(AI_PROMPT_GENERAL_STORAGE_KEY) || ''
}

export function setAiGeneralPrompt(prompt: string): void {
  setString(AI_PROMPT_GENERAL_STORAGE_KEY, prompt)
}

export function getAiEnTranslatePrompt(): string {
  return getString(AI_PROMPT_EN_TRANSLATE_STORAGE_KEY) || DEFAULT_EN_TRANSLATE_PROMPT
}

export function setAiEnTranslatePrompt(prompt: string): void {
  setString(AI_PROMPT_EN_TRANSLATE_STORAGE_KEY, prompt)
}

export function getAiZhExplainPrompt(): string {
  return getString(AI_PROMPT_ZH_EXPLAIN_STORAGE_KEY) || DEFAULT_ZH_EXPLAIN_PROMPT
}

export function setAiZhExplainPrompt(prompt: string): void {
  if (!prompt) {
    setString(AI_PROMPT_ZH_EXPLAIN_STORAGE_KEY, DEFAULT_ZH_EXPLAIN_PROMPT)
    return
  }

  setString(AI_PROMPT_ZH_EXPLAIN_STORAGE_KEY, prompt)
}

export function getAiPrepositionPrompt(): string {
  return getString(AI_PROMPT_PREPOSITION_STORAGE_KEY) || DEFAULT_PREPOSITION_PROMPT
}

export function setAiPrepositionPrompt(prompt: string): void {
  if (!prompt) {
    setString(AI_PROMPT_PREPOSITION_STORAGE_KEY, DEFAULT_PREPOSITION_PROMPT)
    return
  }

  setString(AI_PROMPT_PREPOSITION_STORAGE_KEY, prompt)
}

export type AiPromptMode = 'en' | 'zh'

export function getAiPromptMode(): AiPromptMode {
  const value = getString(AI_PROMPT_MODE_STORAGE_KEY)
  return value === 'en' ? 'en' : 'zh'
}

export function setAiPromptMode(mode: AiPromptMode): void {
  setString(AI_PROMPT_MODE_STORAGE_KEY, mode)
}
