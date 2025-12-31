<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  visible: boolean
  loading: boolean
  error: string
  word: string
  content: string
  position?: 'top' | 'bottom'
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()

const displayError = computed(() => {
  if (!props.error) {
    return ''
  }

  if (props.error === 'no-api-key') {
    return t('aiPanelNoApiKey')
  }

  return props.error
})

const positionClass = computed(() => {
  return props.position === 'top' ? 'ai-panel-root-top' : 'ai-panel-root-bottom'
})

function handleRootClick() {
  if (typeof window === 'undefined')
    return

  // 仅在移动端（小屏）启用“点击面板关闭”交互，避免影响桌面端使用
  if (window.innerWidth <= 768) {
    emit('close')
  }
}
</script>

<template>
  <div
    v-if="visible"
    class="ai-panel-root"
    :class="positionClass"
    @click="handleRootClick"
  >
    <div class="ai-panel">
      <header class="ai-panel-header">
        <div class="ai-panel-title">
          {{ t('aiPanelTitle') }}
        </div>
        <button type="button" class="ai-panel-close" @click="emit('close')">
          {{ t('aiPanelClose') }}
        </button>
      </header>
      <main class="ai-panel-body">
        <p v-if="word" class="ai-panel-word">
          {{ word }}
        </p>
        <p v-if="loading && !error" class="ai-panel-status">
          {{ t('aiPanelLoading') }}
        </p>
        <p v-if="displayError" class="ai-panel-error">
          {{ displayError }}
        </p>
        <div v-if="content" class="ai-panel-content">
          {{ content }}
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.ai-panel-root {
  position: fixed;
  right: 16px;
  z-index: 900;
}

.ai-panel-root-bottom {
  bottom: 96px;
}

.ai-panel-root-top {
  top: 96px;
}

.ai-panel {
  width: 320px;
  max-height: 260px;
  background-color: #ffffff;
  color: #2b2b2b;
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  font-size: 13px;
}

body.reader-theme-dark .ai-panel {
  background-color: #2a2a2a;
  color: #dcdcdc;
}

.ai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
}

.ai-panel-title {
  font-weight: 600;
}

.ai-panel-close {
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
}

.ai-panel-close:hover {
  color: #e5e7eb;
}

.ai-panel-body {
  padding: 8px 10px 10px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-panel-word {
  font-weight: 500;
  color: #e5e7eb;
}

.ai-panel-status {
  font-size: 12px;
  color: #9ca3af;
}

.ai-panel-error {
  font-size: 12px;
  color: #f97373;
}

.ai-panel-content {
  white-space: pre-wrap;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .ai-panel-root {
    left: 8px;
    right: 8px;
  }

  .ai-panel {
    width: auto;
    max-width: 100%;
  }
}
</style>
