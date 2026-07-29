<script setup lang="ts">
import type { Task } from '~/types/task'

const notification = useNotification()

const {
  tasks,
  loading,
  saving,
  errorMessage,
  loadTasks,
  createTask,
  toggleTask,
  deleteTask,
  clearError,
} = useTasks()

const taskForm = ref<{
  clear: () => void
} | null>(null)

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

async function handleCreateTask(title: string) {
  const created = await createTask(title)

  if (created) {
    taskForm.value?.clear()
    notification.success('Tarea creada')
  } else {
    notification.error('La operación ha fallado')
  }
}

async function handleToggleTask(task: Task) {
  const updated = await toggleTask(task)

  if (!updated) {
    notification.error('La operación ha fallado')
  }
}

async function handleDeleteTask(id: number) {
  const success = await deleteTask(id)

  if (success) {
    notification.success('Tarea eliminada')
  } else {
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
        <TaskForm
          ref="taskForm"
          :saving="saving"
          @create="handleCreateTask"
        />

        <p
          v-if="errorMessage"
          class="c-feedback-tpl c-feedback-tpl--error"
          role="alert"
        >
          {{ errorMessage }}

          <BaseButton
            label="Cerrar"
            variant="ghost"
            size="compact"
            @click="clearError"
          />
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

        <TaskList
          :tasks="tasks"
          :loading="loading"
          @toggle="handleToggleTask"
          @delete="handleDeleteTask"
        />

      </BaseCard>
    </div>
  </main>
</template>