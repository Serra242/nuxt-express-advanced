<script setup lang="ts">
import type { Task } from '~/types/task'

interface Props {
  task: Task
  isDeleting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDeleting: false,
})

const emit = defineEmits<{
  toggle: [task: Task]
  delete: [id: number]
}>()
</script>

<template>
  <li class="c-task-list-tpl__item">
    <label class="c-task-list-tpl__content">
      <input
        type="checkbox"
        :checked="props.task.done"
        :disabled="props.isDeleting"
        @change="emit('toggle', props.task)"
      >

      <span
        class="c-task-list-tpl__title"
        :class="{
          'is-completed': props.task.done,
        }"
      >
        {{ props.task.title }}
      </span>
    </label>

    <BaseButton
      :label="props.isDeleting ? 'Eliminando...' : 'Eliminar'"
      variant="danger"
      :loading="props.isDeleting"
      :disabled="props.isDeleting"
      @click="emit('delete', props.task.id)"
    />
  </li>
</template>