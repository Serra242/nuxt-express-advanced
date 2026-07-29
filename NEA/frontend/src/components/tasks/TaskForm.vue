<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  saving?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  saving: false,
})

const emit = defineEmits<{
  create: [title: string]
}>()

const title = ref('')

function submit() {
  const normalizedTitle = title.value.trim()

  if (!normalizedTitle || props.saving) {
    return
  }

  emit('create', normalizedTitle)
}

function clear() {
  title.value = ''
}

defineExpose({
  clear,
})
</script>

<template>
  <form
    class="c-task-form-tpl"
    @submit.prevent="submit"
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
        v-model="title"
        placeholder="Ejemplo: separar un componente"
        :disabled="props.saving"
      />

      <BaseButton
        type="submit"
        :label="
          props.saving ? 'Guardando...' : 'Añadir'
        "
        :loading="props.saving"
        :disabled="
          props.saving || !title.trim()
        "
      />
    </div>
  </form>
</template>