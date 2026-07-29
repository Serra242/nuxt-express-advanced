<script setup lang="ts">
import InputText from 'primevue/inputtext'

interface Props {
  modelValue: string
  id?: string
  type?: 'text' | 'password' | 'email'
  placeholder?: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  type: 'text',
  placeholder: undefined,
  disabled: false,
  error: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div
    class="c-input-text-tpl"
    :class="{
      'has-error': Boolean(props.error),
    }"
  >
    <InputText
      :id="props.id"
      :model-value="props.modelValue"
      :type="props.type"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      class="c-input-text-tpl__control"
      :aria-invalid="Boolean(props.error)"
      :aria-describedby="
        props.error && props.id
          ? `${props.id}-error`
          : undefined
      "
      @update:model-value="
        emit('update:modelValue', String($event))
      "
    />

    <small
      v-if="props.error"
      :id="props.id ? `${props.id}-error` : undefined"
      class="c-input-text-tpl__error"
    >
      {{ props.error }}
    </small>
  </div>
</template>