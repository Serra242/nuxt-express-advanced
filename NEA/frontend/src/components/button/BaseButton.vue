<script setup lang="ts">
import Button from 'primevue/button'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'

interface Props {
  label: string
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  size?: 'md' | 'compact'
  disabled?: boolean
  loading?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  ariaLabel: undefined,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <Button
    :label="props.label"
    :type="props.type"
    :disabled="props.disabled"
    :loading="props.loading"
    :aria-label="props.ariaLabel"
    :class="[
      'c-button-tpl',
      `c-button-tpl--${props.variant}`,
      `c-button-tpl--${props.size}`,
      { 'is-loading': props.loading },
    ]"
    @click="emit('click', $event)"
  />
</template>