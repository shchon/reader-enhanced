<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  text: string
}>()

const emit = defineEmits<{
  (e: 'explain'): void
  (e: 'add-vocabulary'): void
  (e: 'close'): void
}>()

const { t } = useI18n()

const style = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}))
</script>

<template>
  <div
    v-if="visible"
    class="selection-menu-root fixed z-20"
    :style="style"
  >
    <div class="selection-menu">
      <div class="selection-menu-text" :title="text">
        {{ text }}
      </div>
      <div class="selection-menu-actions">
        <div class="selection-menu-actions-main">
          <button
            type="button"
            class="selection-menu-button primary"
            @click="emit('explain')"
          >
            {{ t('selectionMenuExplain') }}
          </button>
          <button
            type="button"
            class="selection-menu-button secondary"
            @click="emit('add-vocabulary')"
          >
            {{ t('selectionMenuAddVocabulary') }}
          </button>
        </div>
        <button
          type="button"
          class="selection-menu-button ghost"
          @click="emit('close')"
        >
          {{ t('selectionMenuClose') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.selection-menu-root {
  position: fixed;
  transform: translateX(-50%);
  z-index: 999;
  pointer-events: none;
}

.selection-menu {
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
  max-width: 260px;
  background-color: #111827;
  color: #ffffff;
  padding: 8px 10px;
  border-radius: 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  font-size: 12px;
  pointer-events: auto;
}

.selection-menu-text {
  font-weight: 500;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.9;
}

.selection-menu-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.selection-menu-actions-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.selection-menu-button {
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.selection-menu-button.primary {
  background-color: #2563eb;
  color: #ffffff;
}

.selection-menu-button.primary:hover {
  background-color: #1d4ed8;
}

.selection-menu-button.secondary {
  background-color: #059669;
  color: #ffffff;
}

.selection-menu-button.secondary:hover {
  background-color: #047857;
}

.selection-menu-button.ghost {
  background-color: transparent;
  color: #d1d5db;
}

.selection-menu-button.ghost:hover {
  background-color: #111827;
  color: #ffffff;
}
</style>
