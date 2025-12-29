<script setup lang="ts">
interface Props {
  title: string
  author: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select'): void
  (e: 'delete'): void
}>()
</script>

<template>
  <article
    class="relative flex flex-col gap-1 rounded border p-3 text-sm"
    @click="emit('select')"
  >
    <button
      type="button"
      class="absolute right-1 top-1 rounded-full bg-white/80 px-1 text-xs text-gray-500 shadow hover:bg-red-50 hover:text-red-600"
      title="删除这本书"
      @click.stop="emit('delete')"
    >
      ×
    </button>
    <h2 class="line-clamp-2 font-semibold">
      {{ props.title }}
    </h2>
    <p v-if="props.author" class="text-xs text-gray-500">
      {{ props.author }}
    </p>
  </article>
</template>
