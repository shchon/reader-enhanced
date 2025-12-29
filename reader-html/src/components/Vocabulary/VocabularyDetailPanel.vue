<template>
  <div v-if="visible" class="vocab-panel-overlay" :class="positionClass" @click.self="handleClose">
    <div class="vocab-panel">
      <header class="vocab-panel-header">
        <div class="vocab-word-block">
          <h3 class="vocab-word-text">{{ word }}</h3>
          <button
            v-if="vocabId"
            class="vocab-delete-btn"
            type="button"
            @click.stop="handleDelete"
          >
            🗑
          </button>
        </div>
        <button class="vocab-close-btn" type="button" @click="handleClose">
          ×
        </button>
      </header>

      <section v-if="explanation" class="vocab-section">
        <p class="vocab-section-content">
          {{ explanation }}
        </p>
      </section>

      <section v-else class="vocab-section vocab-section-empty">
        <p class="vocab-section-content">
          No AI explanation saved for this word yet.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
  word: string
  context: string
  explanation: string
  vocabId?: string
  position?: 'top' | 'bottom'
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'delete', id?: string): void
}>()

const positionClass = computed(() => {
  return props.position === 'top' ? 'vocab-panel-overlay-top' : 'vocab-panel-overlay-bottom'
})

function handleClose() {
  emit('close')
}

function handleDelete() {
  emit('delete', props.vocabId)
}
</script>

<style scoped>
.vocab-panel-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.35);
  z-index: 30;
}

.vocab-panel-overlay-bottom {
  align-items: flex-end;
  padding-bottom: 32px;
}

.vocab-panel-overlay-top {
  align-items: flex-start;
  padding-top: 96px;
}

.vocab-panel {
  box-sizing: border-box;
  width: 100%;
  max-height: 60vh;
  background-color: #ffffff;
  border-radius: 12px 12px 0 0;
  padding: 12px 16px 16px;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
}

@media (min-width: 768px) {
  .vocab-panel {
    width: 360px;
    max-height: 80vh;
    border-radius: 12px;
    padding: 16px 20px 20px;
  }
}

.vocab-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.vocab-word-block {
  overflow: hidden;
  display: flex;
  align-items: center;
}

.vocab-word-text {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  word-break: break-word;
}

.vocab-delete-btn {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 16px;
  line-height: 1;
  padding: 4px 4px 4px 8px;
  cursor: pointer;
}

.vocab-delete-btn:hover {
  color: #b91c1c;
}

.vocab-close-btn {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 20px;
  line-height: 1;
  padding: 4px 8px;
  cursor: pointer;
}

.vocab-close-btn:hover {
  color: #111827;
}

.vocab-section {
  margin-top: 10px;
}

.vocab-section-title {
  margin: 0 0 4px 0;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
}

.vocab-section-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #111827;
  white-space: pre-wrap;
}

.vocab-section-empty .vocab-section-content {
  color: #6b7280;
}
</style>
