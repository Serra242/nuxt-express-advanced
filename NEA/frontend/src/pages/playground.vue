<script setup lang="ts">
import type {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from '~/types/task'
import type { TaskService } from '~/services/task.service'

const notification = useNotification()

const scenario = ref<'loaded' | 'empty' | 'error' | 'slow'>('loaded')

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createFakeTasks(): Task[] {
  return [
    {
      id: 1,
      title: 'Tarea de ejemplo (pendiente)',
      done: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Tarea de ejemplo (completada)',
      done: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

function createPlaygroundService(): TaskService {
  return {
    async getAll(): Promise<Task[]> {
      if (scenario.value === 'error') {
        throw new Error('Fallo simulado')
      }

      if (scenario.value === 'slow') {
        await delay(3000)
        return createFakeTasks()
      }

      if (scenario.value === 'empty') {
        return []
      }

      return createFakeTasks()
    },

    async getById(id: number): Promise<Task> {
      const found = createFakeTasks().find(
        (task) => task.id === id,
      )

      if (!found) {
        throw new Error('No encontrada')
      }

      return found
    },

    async create(input: CreateTaskInput): Promise<Task> {
      return {
        id: Math.floor(Math.random() * 1000),
        title: input.title,
        done: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    },

    async update(id: number, input: UpdateTaskInput): Promise<Task> {
      const base = createFakeTasks().find((task) => task.id === id)

      if (!base) {
        throw new Error('No encontrada')
      }

      return {
        ...base,
        ...input,
        updatedAt: new Date().toISOString(),
      }
    },

    async remove(): Promise<void> {
      
    },
  }
}

const fakeService = computed(() => createPlaygroundService())

const {
  tasks,
  loading,
  errorMessage,
  deletingIds,
  loadTasks,
  toggleTask,
  deleteTask,
} = useTasks(fakeService.value)

const { activeFilter, filteredTasks } = useTaskFilters(tasks)

watch(scenario, () => {
  loadTasks()
})

onMounted(loadTasks)
</script>

<template>
  <main class="pg-playground-tpl">
    <h1>Playground visual</h1>

    <BaseButton
      label="Mostrar éxito"
      @click="notification.success('Operación completada')"
    />

    <BaseButton
      label="Mostrar error"
      variant="danger"
      @click="notification.error('No se pudo completar')"
    />

    <BaseCard title="Estados vacíos">
      <div class="pg-playground-tpl__stack">
        <p class="c-feedback-tpl c-feedback-tpl--empty">
          No hay tareas.
        </p>

        <p
          class="c-feedback-tpl c-feedback-tpl--error"
          role="alert"
        >
          No se han podido cargar los datos.
        </p>
      </div>
    </BaseCard>

    <BaseCard
      title="Sección secundaria"
      subtitle="Sin sombra, para contenido de apoyo"
      variant="flat"
    >
      <p>Este contenido es menos prioritario visualmente.</p>
    </BaseCard>

    <BaseCard title="Simulador de useTasks (sin backend)">
      <div class="c-task-toolbar-tpl">
        <BaseButton
          label="Con datos"
          :variant="scenario === 'loaded' ? 'primary' : 'secondary'"
          @click="scenario = 'loaded'"
        />
        <BaseButton
          label="Vacío"
          :variant="scenario === 'empty' ? 'primary' : 'secondary'"
          @click="scenario = 'empty'"
        />
        <BaseButton
          label="Error"
          :variant="scenario === 'error' ? 'primary' : 'secondary'"
          @click="scenario = 'error'"
        />
        <BaseButton
          label="Carga lenta"
          :variant="scenario === 'slow' ? 'primary' : 'secondary'"
          @click="scenario = 'slow'"
        />
      </div>

      <p
        v-if="errorMessage"
        class="c-feedback-tpl c-feedback-tpl--error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <TaskFilter v-model="activeFilter" />

      <TaskList
        :tasks="filteredTasks"
        :loading="loading"
        :deleting-ids="deletingIds"
        @toggle="toggleTask"
        @delete="deleteTask"
      />
    </BaseCard>
  </main>
</template>