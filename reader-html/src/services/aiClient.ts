import { getAiBaseUrl, getAiEnTranslatePrompt, getAiModel, getAiPromptMode, getAiZhExplainPrompt, getApiKey } from './apiKeyStorage'

export interface ExplainSelectionRequest {
  text: string
  context: string
}

export interface StreamHandlers {
  onToken: (token: string) => void
  onDone: () => void
  onError: (error: Error) => void
}

function buildUserPrompt(text: string, context: string): string {
  const mode = getAiPromptMode()
  const template = mode === 'en' ? getAiEnTranslatePrompt() : getAiZhExplainPrompt()

  return template
    .replace(/\{word\}/g, text)
    .replace(/\{context\}/g, context)
}

export async function streamExplainSelection(
  payload: ExplainSelectionRequest,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const apiKey = getApiKey()
  if (!apiKey) {
    handlers.onError(new Error('MISSING_API_KEY'))
    return
  }

  const baseUrl = getAiBaseUrl()
  const model = getAiModel()

  const body = {
    model,
    stream: true,
    messages: [
      {
        role: 'system',
        content:
          'You are an AI assistant helping users read English books and learn vocabulary. Answer in Chinese and explain the target word in clear, concise language.',
      },
      {
        role: 'user',
        content: buildUserPrompt(payload.text, payload.context),
      },
    ],
  }

  let response: Response
  try {
    response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    })
  }
  catch (error: any) {
    if (error?.name === 'AbortError') {
      return
    }
    handlers.onError(error instanceof Error ? error : new Error(String(error)))
    return
  }

  if (!response.ok || !response.body) {
    const message = `AI request failed with status ${response.status}`
    handlers.onError(new Error(message))
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const raw of lines) {
        const line = raw.trim()
        if (!line || !line.startsWith('data:')) {
          continue
        }

        const data = line.slice('data:'.length).trim()
        if (!data || data === '[DONE]') {
          continue
        }

        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta?.content
          if (typeof delta === 'string' && delta.length > 0) {
            handlers.onToken(delta)
          }
        }
        catch {
          // 忽略单个 chunk 的解析错误，继续消费后续流
        }
      }
    }

    handlers.onDone()
  }
  catch (error: any) {
    if (error?.name === 'AbortError') {
      return
    }
    handlers.onError(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function testAiConnection(signal?: AbortSignal): Promise<void> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('MISSING_API_KEY')
  }

  const baseUrl = getAiBaseUrl()
  const model = getAiModel()

  const body = {
    model,
    stream: false,
    messages: [
      {
        role: 'system',
        content:
          'You are an AI assistant helping users read English books and learn vocabulary. Answer in Chinese and explain the target word in clear, concise language.',
      },
      {
        role: 'user',
        content: buildUserPrompt('test', 'This is a short test context.'),
      },
    ],
  }

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`)
  }

  // 尝试读取一次返回体，若返回 JSON 中包含 error 字段则认为失败
  try {
    const data = await response.json()
    if (data && typeof data === 'object' && 'error' in data && data.error) {
      const message = (data.error as any).message ?? 'AI error'
      throw new Error(String(message))
    }
  }
  catch (error: any) {
    // 如果不是 JSON 或者解析失败，则忽略，认为只要 HTTP 200 即可视为连接成功
    if (error?.name === 'AbortError') {
      throw error
    }
  }
}
