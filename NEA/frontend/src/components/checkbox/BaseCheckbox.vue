<script setup lang="ts">
import Checkbox from 'primevue/checkbox'

interface Props {
  modelValue: boolean
  id?: string
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  label: undefined,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <label class="c-checkbox-tpl">
    <Checkbox
      :input-id="props.id"
      :model-value="props.modelValue"
      binary
      :disabled="props.disabled"
      class="c-checkbox-tpl__control"
      @update:model-value="
        emit('update:modelValue', Boolean($event))
      "
    />

    <span
      v-if="props.label"
      class="c-checkbox-tpl__label"
    >
      {{ props.label }}
    </span>
  </label>
</template>