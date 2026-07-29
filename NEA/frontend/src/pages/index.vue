<script setup lang="ts">
import type { Task } from '~/types/task'

const notification = useNotification()
const taskForm = ref<{
  clear: () => void
} | null>(null)

const {
  tasks,
  loading,
  saving,
  errorMessage,
  deletingIds,
  loadTasks,
  createTask,
  toggleTask,
  deleteTask,
} = useTasks()

const { activeFilter, filteredTasks } = useTaskFilters(tasks)

async function handleCreateTask(title: string) {
  const created = await createTask(title)

  if (created) {
    taskForm.value?.clear()
    notification.success('Tarea creada')
  }
}

async function handleToggleTask(task: Task) {
  const updated = await toggleTask(task)

  if (updated) {
    notification.success('Tarea actualizada')
  }
}

async function handleDeleteTask(id: number) {
  const deleted = await deleteTask(id)

  if (deleted) {
    notification.success('Tarea eliminada')
  }
}

onMounted(loadTasks)
</script>

<template>
  <main class="pg-tasks-tpl">
    <div class="pg-tasks-tpl__container">
      <BaseCard
        title="Nuxt + Express + PostgreSQL"
        subtitle="Frontend organizado por responsabilidades."
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

        <TaskFilter v-model="activeFilter" />
        <TaskList
          :tasks="filteredTasks"
          :loading="loading"
          :deleting-ids="deletingIds"
          @toggle="handleToggleTask"
          @delete="handleDeleteTask"
        />
      </BaseCard>
    </div>
  </main>
</template>