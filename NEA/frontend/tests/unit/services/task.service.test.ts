import { createTaskService } from '~/services/task.service'
import type { AxiosInstance } from 'axios'

function createFakeAxios() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  } as unknown as AxiosInstance
}

describe('task.service', () => {
  it('getAll llama a GET /tasks y devuelve response.data', async () => {
    const api = createFakeAxios()
    const fakeTasks = [
      {
        id: 1,
        title: 'Tarea',
        done: false,
        createdAt: '2026-01-10T10:00:00.000Z',
        updatedAt: '2026-01-10T10:00:00.000Z',
      },
    ]

    ;(api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: fakeTasks,
    })

    const service = createTaskService(api)
    const result = await service.getAll()

    expect(api.get).toHaveBeenCalledWith('/tasks')
    expect(result).toEqual(fakeTasks)
  })

  it('create llama a POST /tasks con el body correcto', async () => {
    const api = createFakeAxios()
    const createdTask = {
      id: 2,
      title: 'Nueva tarea',
      done: false,
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-01-10T10:00:00.000Z',
    }

    ;(api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: createdTask,
    })

    const service = createTaskService(api)
    const result = await service.create({ title: 'Nueva tarea' })

    expect(api.post).toHaveBeenCalledWith('/tasks', {
      title: 'Nueva tarea',
    })
    expect(result).toEqual(createdTask)
  })

  it('update llama a PATCH /tasks/:id con el body correcto', async () => {
    const api = createFakeAxios()
    const updatedTask = {
      id: 1,
      title: 'Tarea',
      done: true,
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-01-10T10:00:00.000Z',
    }

    ;(api.patch as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: updatedTask,
    })

    const service = createTaskService(api)
    const result = await service.update(1, { done: true })

    expect(api.patch).toHaveBeenCalledWith('/tasks/1', {
      done: true,
    })
    expect(result).toEqual(updatedTask)
  })

  it('remove llama a DELETE /tasks/:id', async () => {
    const api = createFakeAxios()

    ;(api.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

    const service = createTaskService(api)
    await service.remove(1)

    expect(api.delete).toHaveBeenCalledWith('/tasks/1')
  })
})