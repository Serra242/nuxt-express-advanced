<script setup lang="ts">
interface Task {
  id: number
  title: string
  done: boolean
}

const { $api } = useNuxtApp()
const notification = useNotification()

const tasks = ref<Task[]>([])
const newTitle = ref('')

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const filter = ref<'all' | 'pending' | 'done'>('all')

const filteredTasks = computed(() => {
  if (filter.value === 'pending') {
    return tasks.value.filter((task) => !task.done)
  }

  if (filter.value === 'done') {
    return tasks.value.filter((task) => task.done)
  }

  return tasks.value
})

async function loadTasks() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await $api.get<Task[]>('/tasks')
    tasks.value = response.data
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se han podido cargar las tareas.'
    notification.error('La operación ha fallado')
  } finally {
    loading.value = false
  }
}

async function createTask() {
  const title = newTitle.value.trim()

  if (!title) {
    errorMessage.value = 'Escribe el título de la tarea.'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    const response = await $api.post<Task>('/tasks', {
      title,
    })

    tasks.value.push(response.data)
    newTitle.value = ''
    notification.success('Tarea creada')
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se ha podido crear la tarea.'
    notification.error('La operación ha fallado')
  } finally {
    saving.value = false
  }
}

async function toggleTask(task: Task) {
  errorMessage.value = ''

  try {
    const response = await $api.patch<Task>(
      `/tasks/${task.id}`,
      { done: !task.done },
    )

    const index = tasks.value.findIndex(
      (currentTask) => currentTask.id === task.id,
    )

    if (index !== -1) {
      tasks.value[index] = response.data
    }
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se ha podido actualizar la tarea.'
    notification.error('La operación ha fallado')
  }
}

async function deleteTask(id: number) {
  errorMessage.value = ''

  try {
    await $api.delete(`/tasks/${id}`)

    tasks.value = tasks.value.filter((task) => {
      return task.id !== id
    })
    notification.success('Tarea eliminada')
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se ha podido eliminar la tarea.'
    notification.error('La operación ha fallado')
  }
}

onMounted(() => {
  loadTasks()
})
</script>

<template>
  <main class="pg-tasks-tpl">
    <div class="pg-tasks-tpl__container">
      <BaseCard
        title="Nuxt + Express + PostgreSQL"
        subtitle="Las tareas ya se guardan de forma persistente."
      >
        <form
          class="c-task-form-tpl"
          @submit.prevent="createTask"
        >
          <label
            for="task-title"
            class="c-task-form-tpl__label"
          >
            Nueva tarea
          </label>

          <div class="c-task-form-tpl__row">
            <BaseInputText
              id="task-title"
              v-model="newTitle"
              placeholder="Ejemplo: practicar una petición POST"
              :disabled="saving"
            />

            <BaseButton
              type="submit"
              :label="saving ? 'Guardando...' : 'Añadir'"
              :loading="saving"
              :disabled="saving || !newTitle.trim()"
            />
          </div>
        </form>

        <p
          v-if="errorMessage"
          class="c-feedback-tpl c-feedback-tpl--error"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <div class="c-task-toolbar-tpl">
          <h2>Tareas</h2>

          <BaseButton
            label="Recargar"
            variant="secondary"
            :disabled="loading"
            @click="loadTasks"
          />
        </div>

        <div class="c-task-toolbar-tpl">
          <BaseButton
            label="Todas"
            :variant="filter === 'all' ? 'primary' : 'ghost'"
            @click="filter = 'all'"
          />

          <BaseButton
            label="Pendientes"
            :variant="filter === 'pending' ? 'primary' : 'ghost'"
            @click="filter = 'pending'"
          />

          <BaseButton
            label="Completadas"
            :variant="filter === 'done' ? 'primary' : 'ghost'"
            @click="filter = 'done'"
          />
        </div>

        <p
          v-if="loading"
          class="c-feedback-tpl"
        >
          Cargando tareas...
        </p>

        <p
          v-else-if="filteredTasks.length === 0"
          class="c-feedback-tpl c-feedback-tpl--empty"
        >
          No hay tareas.
        </p>

        <ul
          v-else
          class="c-task-list-tpl"
        >
          <li
            v-for="task in filteredTasks"
            :key="task.id"
            class="c-task-list-tpl__item"
          >
            <label class="c-task-list-tpl__content">
              <input
                type="checkbox"
                :checked="task.done"
                @change="toggleTask(task)"
              >

              <span
                class="c-task-list-tpl__title"
                :class="{ 'is-completed': task.done }"
              >
                {{ task.title }}
              </span>
            </label>

            <BaseButton
              label="Eliminar"
              variant="danger"
              @click="deleteTask(task.id)"
            />
          </li>
        </ul>
      </BaseCard>
    </div>
  </main>
</template>