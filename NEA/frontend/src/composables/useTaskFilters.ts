import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import type { Task } from '~/types/task'

export type TaskFilter = 'all' | 'pending' | 'done'

export function useTaskFilters(tasks: Ref<Task[]>) {
  const activeFilter = ref<TaskFilter>('all')

  const filteredTasks = computed(() => {
    if (activeFilter.value === 'pending') {
      return tasks.value.filter((task) => !task.done)
    }

    if (activeFilter.value === 'done') {
      return tasks.value.filter((task) => task.done)
    }

    return tasks.value
  })

  return {
    activeFilter,
    filteredTasks,
  }
}