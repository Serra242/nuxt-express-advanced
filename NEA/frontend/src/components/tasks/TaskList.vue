<script setup lang="ts">
import type { Task } from '~/types/task'

interface Props {
  tasks: Task[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  toggle: [task: Task]
  delete: [id: number]
}>()
</script>

<template>
  <p v-if="props.loading">
    Cargando tareas...
  </p>

  <p
    v-else-if="props.tasks.length === 0"
    class="c-feedback-tpl c-feedback-tpl--empty"
  >
    No hay tareas.
  </p>

  <ul
    v-else
    class="c-task-list-tpl"
  >
    <TaskItem
      v-for="task in props.tasks"
      :key="task.id"
      :task="task"
      @toggle="emit('toggle', $event)"
      @delete="emit('delete', $event)"
    />
  </ul>
</template>