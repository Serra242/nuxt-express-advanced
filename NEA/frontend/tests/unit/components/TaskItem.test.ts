import { mount } from '@vue/test-utils'
import TaskItem from '~/components/tasks/TaskItem.vue'

const task = {
  id: 1,
  title: 'Probar componente',
  done: false,
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-10T10:00:00.000Z',
}

describe('TaskItem', () => {
  it('muestra el título', () => {
    const wrapper = mount(TaskItem, {
      props: { task },
      global: {
        stubs: {
          BaseButton: {
            template:
              '<button @click="$emit(\'click\')">Eliminar</button>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain(
      'Probar componente',
    )
  })

  it('emite toggle al cambiar el checkbox', async () => {
    const wrapper = mount(TaskItem, {
      props: { task },
      global: {
        stubs: {
          BaseButton: true,
        },
      },
    })

    await wrapper.get('input').trigger('change')

    expect(wrapper.emitted('toggle')?.[0]).toEqual([
      task,
    ])
  })
})