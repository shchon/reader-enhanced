<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  getAiBaseUrl,
  getAiEnTranslatePrompt,
  getAiModel,
  getAiZhExplainPrompt,
  getApiKey,
  setAiBaseUrl,
  setAiEnTranslatePrompt,
  setAiModel,
  setAiZhExplainPrompt,
  getAiPromptMode,
  setAiPromptMode,
  setApiKey,
  getDefaultAiBaseUrl,
  getDefaultAiModel,
  getDefaultEnTranslatePrompt,
  getDefaultZhExplainPrompt,
} from '../services/apiKeyStorage'
import { testAiConnection } from '../services/aiClient'

const { t } = useI18n()
const router = useRouter()

const apiKey = ref('')
const baseUrl = ref('')
const model = ref('')

const activePromptTab = ref<'enTranslate' | 'zhExplain'>('zhExplain')
const promptEnTranslate = ref('')
const promptZhExplain = ref('')

const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')
const isSaving = ref(false)
const isTesting = ref(false)

onMounted(() => {
  const existingKey = getApiKey()
  if (existingKey) {
    apiKey.value = existingKey
  }

  baseUrl.value = getAiBaseUrl()
  model.value = getAiModel()

  promptEnTranslate.value = getAiEnTranslatePrompt()
  promptZhExplain.value = getAiZhExplainPrompt()

  activePromptTab.value = getAiPromptMode() === 'en' ? 'enTranslate' : 'zhExplain'
})

function setStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
  statusMessage.value = message
  statusType.value = type
}

async function handleSave() {
  isSaving.value = true
  try {
    const trimmedKey = apiKey.value.trim()
    setApiKey(trimmedKey)

    setAiBaseUrl(baseUrl.value.trim())
    setAiModel(model.value.trim())

    setAiEnTranslatePrompt(promptEnTranslate.value)
    setAiZhExplainPrompt(promptZhExplain.value)

    setStatus(t('settingsSaved'), 'success')
  }
  finally {
    isSaving.value = false
  }
}

function handleResetToDefaults() {
  // 仅重置当前表单中的 AI 设置字段到内置默认值，不修改 API Key
  baseUrl.value = getDefaultAiBaseUrl()
  model.value = getDefaultAiModel()
  promptEnTranslate.value = getDefaultEnTranslatePrompt()
  promptZhExplain.value = getDefaultZhExplainPrompt()
}

function handleClickEnPromptTab() {
  activePromptTab.value = 'enTranslate'
  setAiPromptMode('en')
  // 点击分页时，将当前编辑内容重置为最近一次保存的值（或系统默认）
  promptEnTranslate.value = getAiEnTranslatePrompt()
}

function handleClickZhPromptTab() {
  activePromptTab.value = 'zhExplain'
  setAiPromptMode('zh')
  // 点击分页时，将当前编辑内容重置为最近一次保存的值（或系统默认）
  promptZhExplain.value = getAiZhExplainPrompt()
}

async function handleTestConnection() {
  isTesting.value = true
  setStatus(t('settingsTesting'), 'info')
  try {
    await testAiConnection()
    setStatus(t('settingsTestSuccess'), 'success')
  }
  catch (error: any) {
    if (error?.message === 'MISSING_API_KEY') {
      setStatus(t('aiPanelNoApiKey'), 'error')
    }
    else {
      setStatus(t('settingsTestFailed', { message: String(error?.message || error) }), 'error')
    }
  }
  finally {
    isTesting.value = false
  }
}

function handleBackToHome() {
  router.push({ name: 'home' })
}
</script>

<template>
  <main class="settings-root">
    <header class="settings-header">
      <button type="button" class="settings-button secondary" @click="handleBackToHome">
        {{ t('settingsBackToHome') }}
      </button>
      <h1 class="settings-title">
        {{ t('settingsTitle') }}
      </h1>
    </header>

    <section class="settings-section">
      <div class="settings-field-group">
        <label class="settings-label" for="settings-base-url">
          {{ t('settingsBaseUrlLabel') }}
        </label>
        <input
          id="settings-base-url"
          v-model="baseUrl"
          class="settings-input"
          type="text"
          :placeholder="t('settingsBaseUrlPlaceholder')"
        >
      </div>

      <div class="settings-field-group">
        <label class="settings-label" for="settings-model">
          {{ t('settingsModelLabel') }}
        </label>
        <input
          id="settings-model"
          v-model="model"
          class="settings-input"
          type="text"
          :placeholder="t('settingsModelPlaceholder')"
        >
      </div>

      <div class="settings-field-group">
        <label class="settings-label" for="settings-api-key">
          {{ t('settingsApiKeyLabel') }}
        </label>
        <input
          id="settings-api-key"
          v-model="apiKey"
          class="settings-input"
          type="text"
          :placeholder="t('settingsApiKeyPlaceholder')"
        >
        <p class="settings-hint">
          {{ t('settingsApiKeyHint') }}
        </p>
      </div>

      <div class="settings-prompts">
        <div class="settings-tab-list">
          <button
            type="button"
            class="settings-tab"
            :class="{ active: activePromptTab === 'enTranslate' }"
            @click="handleClickEnPromptTab"
          >
            {{ t('settingsPromptTabEnTranslate') }}
          </button>
          <button
            type="button"
            class="settings-tab"
            :class="{ active: activePromptTab === 'zhExplain' }"
            @click="handleClickZhPromptTab"
          >
            {{ t('settingsPromptTabZhExplain') }}
          </button>
        </div>
        <textarea
          v-if="activePromptTab === 'enTranslate'"
          v-model="promptEnTranslate"
          class="settings-textarea"
          rows="8"
        />
        <textarea
          v-else
          v-model="promptZhExplain"
          class="settings-textarea"
          rows="8"
        />
      </div>

      <div class="settings-actions">
        <button
          type="button"
          class="settings-button primary"
          :disabled="isSaving"
          @click="handleSave"
        >
          {{ isSaving ? t('settingsSaving') : t('settingsSave') }}
        </button>
        <button
          type="button"
          class="settings-button secondary"
          :disabled="isTesting"
          @click="handleTestConnection"
        >
          {{ isTesting ? t('settingsTesting') : t('settingsTestButton') }}
        </button>
        <button
          type="button"
          class="settings-button secondary"
          :disabled="isSaving || isTesting"
          @click="handleResetToDefaults"
        >
          {{ t('settingsResetDefaults') }}
        </button>
      </div>

      <p v-if="statusMessage" class="settings-status" :class="statusType">
        {{ statusMessage }}
      </p>
    </section>
  </main>
</template>

<style scoped>
.settings-root {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.settings-title {
  font-size: 20px;
  font-weight: 600;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 800px;
}

.settings-section-title {
  font-size: 16px;
  font-weight: 600;
}

.settings-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-label {
  font-size: 14px;
  font-weight: 500;
}

.settings-input {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  font-family: inherit;
  font-size: 14px;
}

.settings-textarea {
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  font-family: inherit;
  font-size: 14px;
}

.settings-hint {
  font-size: 12px;
  color: #6b7280;
}

.settings-prompts {
  margin-top: 8px;
}

.settings-tab-list {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.settings-tab {
  padding: 4px 8px;
  font-size: 13px;
  border-radius: 4px 4px 0 0;
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
  cursor: pointer;
}

.settings-tab.active {
  background-color: #ffffff;
  border-bottom-color: #ffffff;
  font-weight: 600;
}

.settings-prompt-panel {
  border: 1px solid #d1d5db;
  border-radius: 0 4px 4px 4px;
  padding: 8px;
  background-color: #ffffff;
}

.settings-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.settings-button {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
}

.settings-button.primary {
  background-color: #2563eb;
  border-color: #1d4ed8;
  color: #fff;
}

.settings-button.primary:disabled {
  opacity: 0.6;
  cursor: default;
}

.settings-button.secondary {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #111827;
}

.settings-status {
  margin-top: 4px;
  font-size: 12px;
}

.settings-status.success {
  color: #059669;
}

.settings-status.error {
  color: #b91c1c;
}

.settings-status.info {
  color: #6b7280;
}

@media (max-width: 640px) {
  .settings-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .settings-section {
    max-width: 100%;
  }
}
</style>
