<script setup lang="ts">
interface Task {
  id: number
  title: string
  done: boolean
}

const { $api } = useNuxtApp()

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
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se ha podido crear la tarea.'
  } finally {
    saving.value = false
  }
}

async function toggleTask(task: Task) {
  errorMessage.value = ''

  try {
    const response = await $api.patch<Task>(
      `/tasks/${task.id}`,
      {
        done: !task.done,
      },
    )

    const index = tasks.value.findIndex(
      (currentTask) => currentTask.id === task.id,
    )

    if (index !== -1) {
      tasks.value[index] = response.data
    }
  } catch (error) {
    console.error(error)
    errorMessage.value =
      'No se ha podido actualizar la tarea.'
  }
}

async function deleteTask(id: number) {
  errorMessage.value = ''

  try {
    await $api.delete(`/tasks/${id}`)

    tasks.value = tasks.value.filter((task) => {
      return task.id !== id
    })
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se ha podido eliminar la tarea.'
  }
}

onMounted(() => {
  loadTasks()
})
</script>

<template>
  <main class="page">
    <section class="card">
      <header class="app-header">
        <p class="eyebrow">
          Comunicación frontend-backend
        </p>

        <h1>Nuxt + Express + Axios</h1>

        <p class="description">
          Nuxt muestra la interfaz, Axios realiza las
          peticiones y Express procesa la API.
        </p>
      </header>

      <form
        class="task-form"
        @submit.prevent="createTask"
      >
        <label for="task-title">
          Nueva tarea
        </label>

        <div class="form-row">
          <input
            id="task-title"
            v-model="newTitle"
            type="text"
            placeholder="Ejemplo: practicar una petición POST"
            :disabled="saving"
          >

          <button
            type="submit"
            :disabled="saving || !newTitle.trim()"
          >
            {{ saving ? 'Guardando...' : 'Añadir' }}
          </button>
        </div>
      </form>

      <p
        v-if="errorMessage"
        class="error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <section class="tasks-section">
        <div class="toolbar">
          <h2>Tareas</h2>

          <button
            class="secondary-button"
            type="button"
            :disabled="loading"
            @click="loadTasks"
          >
            Recargar
          </button>
        </div>

        <div class="filter-bar">
          <button
            type="button"
            class="secondary-button"
            :class="{ active: filter === 'all' }"
            @click="filter = 'all'"
          >
            Todas
          </button>

          <button
            type="button"
            class="secondary-button"
            :class="{ active: filter === 'pending' }"
            @click="filter = 'pending'"
          >
            Pendientes
          </button>

          <button
            type="button"
            class="secondary-button"
            :class="{ active: filter === 'done' }"
            @click="filter = 'done'"
          >
            Completadas
          </button>
        </div>

        <p
          v-if="loading"
          class="status-message"
        >
          Cargando tareas...
        </p>

        <p
          v-else-if="filteredTasks.length === 0"
          class="status-message"
        >
          No hay tareas.
        </p>

        <ul
          v-else
          class="task-list"
        >
          <li
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-item"
          >
            <label class="task-content">
              <input
                type="checkbox"
                :checked="task.done"
                @change="toggleTask(task)"
              >

              <span :class="{ completed: task.done }">
                {{ task.title }}
              </span>
            </label>

            <button
              class="delete-button"
              type="button"
              @click="deleteTask(task.id)"
            >
              Eliminar
            </button>
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.page {
  min-height: 100vh;
  padding: 48px 20px;
  background: #f1f5f9;
  color: #0f172a;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}

.card {
  width: min(720px, 100%);
  margin: 0 auto;
  padding: 32px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgb(15 23 42 / 8%);
}

.app-header {
  margin-bottom: 32px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #4f46e5;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

h1,
h2,
p {
  margin-top: 0;
}

.description {
  margin-bottom: 0;
  color: #475569;
  line-height: 1.6;
}

.task-form {
  margin-bottom: 28px;
}

.task-form > label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
}

.form-row {
  display: flex;
  gap: 12px;
}

input[type='text'] {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font: inherit;
}

input[type='text']:focus {
  border-color: #4f46e5;
  outline: 3px solid rgb(79 70 229 / 15%);
}

button {
  padding: 11px 16px;
  border: 0;
  border-radius: 8px;
  background: #4f46e5;
  color: white;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar h2 {
  margin-bottom: 0;
}

.secondary-button {
  background: #e2e8f0;
  color: #334155;
}

.error {
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fee2e2;
  color: #991b1b;
}

.status-message {
  margin: 20px 0 0;
  color: #475569;
}

.task-list {
  display: grid;
  gap: 12px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.task-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-content input {
  width: 18px;
  height: 18px;
  accent-color: #4f46e5;
}

.completed {
  color: #64748b;
  text-decoration: line-through;
}

.delete-button {
  background: #dc2626;
}

@media (max-width: 560px) {
  .page {
    padding: 24px 14px;
  }

  .card {
    padding: 22px;
  }

  .form-row {
    flex-direction: column;
  }

  .task-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .delete-button {
    width: 100%;
  }
}
</style>