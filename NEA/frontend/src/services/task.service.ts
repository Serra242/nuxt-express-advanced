import type { AxiosInstance } from 'axios'
import type {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from '~/types/task'

export function createTaskService(
  api: AxiosInstance,
) {
  async function getAll(): Promise<Task[]> {
    const response = await api.get<Task[]>('/tasks')
    return response.data
  }

  async function getById(id: number): Promise<Task> {
    const response = await api.get<Task>(
      `/tasks/${id}`,
    )
    return response.data
  }

  async function create(
    input: CreateTaskInput,
  ): Promise<Task> {
    const response = await api.post<Task>(
      '/tasks',
      input,
    )
    return response.data
  }

  async function update(
    id: number,
    input: UpdateTaskInput,
  ): Promise<Task> {
    const response = await api.patch<Task>(
      `/tasks/${id}`,
      input,
    )
    return response.data
  }

  async function remove(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`)
  }

  return {
    getAll,
    getById,
    create,
    update,
    remove,
  }
}