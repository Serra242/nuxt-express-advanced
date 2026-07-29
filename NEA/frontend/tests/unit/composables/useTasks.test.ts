import { useTasks } from '~/composables/useTasks'

function createFakeService() {
  return {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        title: 'Tarea simulada',
        done: false,
        createdAt: '2026-01-10T10:00:00.000Z',
        updatedAt: '2026-01-10T10:00:00.000Z',
      },
    ]),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }
}

test('loadTasks actualiza la lista', async () => {
  const service = createFakeService()
  const { tasks, loadTasks } = useTasks(service)

  await loadTasks()

  expect(tasks.value).toHaveLength(1)
  expect(tasks.value[0].title).toBe(
    'Tarea simulada',
  )
})