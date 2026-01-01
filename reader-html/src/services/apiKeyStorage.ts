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

const DEFAULT_ZH_EXPLAIN_PROMPT
  = '根据{context}解释 {word}.注意:请给出在当前句子中词语的拼音;并给出1个包含{word}的例句.'

const DEFAULT_EN_TRANSLATE_PROMPT = `你是一名专业的英语词汇与语境分析助手，面向英语学习者。

请根据以下上下文解释单词{word}：

上下文
{context}

任务要求：
1. 给出{word}的基本信息，英标与词性必须放在同一行。
2. 结合上下文，给出{word}在该语境中的准确中文释义（只给最贴合语境的一种含义）。
3. 如果{word}在该上下文中构成了固定搭配、常见短语或习惯用法：
   - 提取原文中的英文搭配
   - 在同一行给出该搭配及其中文解释
   如果没有明显固定搭配，请在同一行输出：
   固定搭配：本句中未构成固定搭配
4. 提供一个简短、自然的英文例句，体现该词或该搭配的常见用法。
5. 在英文例句下一行直接给出对应的中文翻译，不要添加任何标题。
6. 表达清晰、简洁，适合直接展示给学习者。

输出格式严格如下：
英标｜词性：
语境释义：
固定搭配：
例句：`

const DEFAULT_PREPOSITION_PROMPT = `# Role: 英语语法与语义专家

# Task:
请帮我分析句子中指定介词的用法，并提供可替换的介词或介词短语。

# Input:
- **句子 {context}
- **目标介词 {word}

# Analysis Requirements:
1. **原句分析**: 解释该介词在原句中的具体含义、语法功能以及它所传达的语气。
2. **完美替换 (Direct Replacements)**: 列出意思几乎完全相同、可以直接替换的介词或短语（如有）。
3. **近义替换 (Nuanced Alternatives)**: 列出意思相近但会有细微差别的替换项。请详细说明：
   - **含义变化**: 意思发生了什么改变？
   - **语体变化**: 变得更正式 (Formal) 还是更口语 (Casual)？
   - **侧重点**: 强调了什么不同的方面？
4. **不可替换的情况**: 如果有常见的错误替换（False Friends），请指出来并解释为什么不能用。

# Output Format:
请使用清晰的列表或表格形式展示分析结果。`

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
