<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Config } from '../../../components/Readers/sharedLogic'
import DropDown from '../../../components/DropDown'
import ValueAdjuster from '../../../components/ValueAdjuster/ValueAdjuster.vue'
import { useClickOutside } from '../../../utils'

const props = defineProps<{
  config: Config[]
}>()

/**
 * i18n
 */
const { t } = useI18n()

const showConfigPannel = ref<boolean>(false)
function tooglePannelShow() {
  showConfigPannel.value = !showConfigPannel.value
}

const configArea = useTemplateRef('configArea')
useClickOutside(configArea, () => {
  showConfigPannel.value = false
})

function toggleTheme(item: Config) {
  if (item.type !== 'selection' || item.name !== 'readerTheme')
    return

  // item.value has been unwrapped by Vue's proxy layer here, so we can
  // safely reassign it directly. If the original value was a Ref, Vue
  // will route this assignment back to ref.value for us.
  // @ts-expect-error runtime unwrapping makes this safe
  item.value = item.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <div ref="configArea" class="config" @click.stop="tooglePannelShow">
    <span class="tag"><img src="/config.svg" alt="config tag"></span>
    <div v-show="showConfigPannel" class="config-pannel" @wheel.stop.passive>
      <div v-if="!props.config.length" class="pannel-item" @click.stop>
        There is no configuration items provided by this reading mode.
      </div>
      <div v-for="item in props.config" :key="item.name" class="pannel-item" @click.stop>
        <!-- theme uses a switch instead of dropdown -->
        <div v-if="item.type === 'selection' && item.name === 'readerTheme'" class="theme-switch-row">
          <span class="label">{{ t(item.name) }}</span>
          <button
            class="theme-switch"
            :class="{ 'theme-switch-on': item.value === 'dark' }"
            @click.stop="toggleTheme(item)"
          >
            <span class="theme-switch-handle" />
          </button>
        </div>
        <!-- @vue-expect-error item.value is a ref, it can be handled by vue -->
        <DropDown
          v-else-if="item.type === 'selection'" v-model:current-mode-name="item.value"
          :label="t(item.name)" :modes="item.selectOptions" :label-width="150"
        />
        <!-- @vue-expect-error item.value is a ref, it can be handled by vue -->
        <ValueAdjuster
          v-else-if="item.type === 'adjuster'" v-model="item.value"
          :label="t(item.name)" :max="item.max" :min="item.min" :delta="item.delta" :label-width="150"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.config {
  flex: 0;
  margin-left: 2rem;
  position: relative;
  height: 37px;
  display: flex;
  align-items: center;
}

.config .tag {
  cursor: pointer;
  width: 25px;
  height: 25px;
}

.config-pannel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 400px;
  max-height: 75vh;
  overflow-y: auto;
  background-color: #fefefe;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-wrap: wrap;
}

.pannel-item {
  flex: 1 1 400px;
  padding: 10px;
}

.theme-switch-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-switch-row .label {
  flex-shrink: 0;
  width: 150px;
  font-size: 14px;
  color: #333;
}

.theme-switch {
  position: relative;
  width: 40px;
  height: 20px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid #ccc;
  background-color: #f0f0f0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.2s ease;
}

.theme-switch-handle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transform: translateX(2px);
  transition: transform 0.2s ease;
}

.theme-switch-on {
  background-color: #333;
}

.theme-switch-on .theme-switch-handle {
  transform: translateX(20px);
}

@media (max-width: 768px) {
  .config {
    margin-left: 0.5rem;
  }

  .config-pannel {
    position: fixed;
    top: 50%;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
    width: min(92vw, 360px);
    max-height: 80vh;
    z-index: 100;
  }

  .pannel-item {
    flex: 1 1 100%;
  }

  /* 缩小设置项标题字体 */
  .config-pannel :deep(.label) {
    font-size: 10px;
  }
}
</style>
