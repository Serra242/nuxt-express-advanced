import { ref } from 'vue'
import type { Task } from '~/types/task'
import type { TaskService } from '~/services/task.service'


export function useTasks(
  providedService?: TaskService,
) {
  const taskService = providedService ?? (() => {
    const { $api } = useNuxtApp()
    return createTaskService($api)
  })()

  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const errorMessage = ref('')

  async function loadTasks() {
    loading.value = true
    errorMessage.value = ''

    try {
      tasks.value = await taskService.getAll()
    } catch (error) {
      console.error(error)
      errorMessage.value =
        'No se han podido cargar las tareas.'
    } finally {
      loading.value = false
    }
  }

  async function createTask(title: string) {
    saving.value = true
    errorMessage.value = ''

    try {
      const task = await taskService.create({ title })
      tasks.value.push(task)
      return task
    } catch (error) {
      console.error(error)
      errorMessage.value =
        'No se ha podido crear la tarea.'
      return null
    } finally {
      saving.value = false
    }
  }

  async function toggleTask(task: Task) {
    errorMessage.value = ''

    try {
      const updated = await taskService.update(
        task.id,
        {
          done: !task.done,
        },
      )

      const index = tasks.value.findIndex(
        (current) => current.id === task.id,
      )

      if (index !== -1) {
        tasks.value[index] = updated
      }

      return updated
    } catch (error) {
      console.error(error)
      errorMessage.value =
        'No se ha podido actualizar la tarea.'
      return null
    }
  }

  async function deleteTask(id: number) {
    errorMessage.value = ''

    try {
      await taskService.remove(id)
      tasks.value = tasks.value.filter(
        (task) => task.id !== id,
      )
      return true
    } catch (error) {
      console.error(error)
      errorMessage.value =
        'No se ha podido eliminar la tarea.'
      return false
    }
  }

  function clearError() {
    errorMessage.value = ''
  }

  return {
    tasks,
    loading,
    saving,
    errorMessage,
    loadTasks,
    createTask,
    toggleTask,
    deleteTask,
    clearError,
  }
}