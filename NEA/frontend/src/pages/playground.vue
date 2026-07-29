<script setup lang="ts">
  const notification = useNotification()
</script>

<template>
  <main class="pg-playground-tpl">
    <h1>Playground visual</h1>

    <BaseButton
      label="Mostrar éxito"
      @click="notification.success('Operación completada')"
    />

    <BaseButton
      label="Mostrar error"
      variant="danger"
      @click="notification.error('No se pudo completar')"
    />
  </main>
</template>