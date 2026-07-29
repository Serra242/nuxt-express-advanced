<script setup lang="ts">
import type { Task } from '~/types/task'

interface Props {
  task: Task
}

const props = defineProps<Props>()

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
      label="Eliminar"
      variant="danger"
      @click="emit('delete', props.task.id)"
    />
  </li>
</template>