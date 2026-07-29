<script setup lang="ts">
interface Props {
  modelValue: 'all' | 'pending' | 'done'
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': ['all' | 'pending' | 'done']
}>()
</script>

<template>
  <div class="c-task-toolbar-tpl">
    <BaseButton
      label="Todas"
      :variant="modelValue === 'all' ? 'primary' : 'ghost'"
      @click="emit('update:modelValue', 'all')"
    />
    <BaseButton
      label="Pendientes"
      :variant="modelValue === 'pending' ? 'primary' : 'ghost'"
      @click="emit('update:modelValue', 'pending')"
    />
    <BaseButton
      label="Completadas"
      :variant="modelValue === 'done' ? 'primary' : 'ghost'"
      @click="emit('update:modelValue', 'done')"
    />
  </div>
</template>