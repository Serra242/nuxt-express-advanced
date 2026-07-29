import { mount } from '@vue/test-utils'
import TaskForm from '~/components/tasks/TaskForm.vue'

function mountForm(props = {}) {
  return mount(TaskForm, {
    props,
    global: {
      stubs: {
        BaseInputText: {
          props: ['modelValue'],
          template:
            '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        },
        BaseButton: {
          template:
            '<button type="submit">Añadir</button>',
        },
      },
    },
  })
}

describe('TaskForm', () => {
  it('no emite un título vacío', async () => {
    const wrapper = mountForm()

    await wrapper.get('input').setValue('   ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('create')).toBeUndefined()
  })

  it('elimina espacios externos y emite create', async () => {
    const wrapper = mountForm()

    await wrapper.get('input').setValue('  Aprender Vitest  ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('create')?.[0]).toEqual([
      'Aprender Vitest',
    ])
  })

  it('deshabilita el envío cuando saving es true', async () => {
    const wrapper = mountForm({ saving: true })

    await wrapper.get('input').setValue('Otra tarea')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('create')).toBeUndefined()
  })
})