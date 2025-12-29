export const API_KEY_STORAGE_KEY = 'lingoReader.apiKey'
export const AI_BASE_URL_STORAGE_KEY = 'lingoReader.aiBaseUrl'
export const AI_MODEL_STORAGE_KEY = 'lingoReader.aiModel'
export const AI_PROMPT_GENERAL_STORAGE_KEY = 'lingoReader.aiPromptGeneral'
export const AI_PROMPT_EN_TRANSLATE_STORAGE_KEY = 'lingoReader.aiPromptEnTranslate'
export const AI_PROMPT_ZH_EXPLAIN_STORAGE_KEY = 'lingoReader.aiPromptZhExplain'
export const AI_PROMPT_MODE_STORAGE_KEY = 'lingoReader.aiPromptMode'

const DEFAULT_AI_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const DEFAULT_AI_MODEL = 'doubao-1.5-lite-32k-250115'

const DEFAULT_ZH_EXPLAIN_PROMPT =
  '根据{context}解释 {word}.注意:请给出在当前句子中词语的拼音;并给出1个包含{word}的例句.'

const DEFAULT_EN_TRANSLATE_PROMPT =
  '根据{context}解释单词 {word} ，如果{word}在{context}中有固定搭配，请提取出英文短语的搭配并解释。\n\n##请按照下面的格式返回信息:\n1. 英标:[]||释义: "at"用来显示多罗茜流泪的原因. \n2. 固定搭配: 。\n3. 例句:\nThe child laughed with joy at the funny puppet show.\n孩子被有趣的木偶戏逗得哈哈大笑。'

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

export type AiPromptMode = 'en' | 'zh'

export function getAiPromptMode(): AiPromptMode {
  const value = getString(AI_PROMPT_MODE_STORAGE_KEY)
  return value === 'en' ? 'en' : 'zh'
}

export function setAiPromptMode(mode: AiPromptMode): void {
  setString(AI_PROMPT_MODE_STORAGE_KEY, mode)
}
