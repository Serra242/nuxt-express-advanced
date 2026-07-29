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

    <BaseCard title="Estados vacíos">
      <div class="pg-playground-tpl__stack">
        <p class="c-feedback-tpl c-feedback-tpl--empty">
          No hay tareas.
        </p>

        <p
          class="c-feedback-tpl c-feedback-tpl--error"
          role="alert"
        >
          No se han podido cargar los datos.
        </p>
      </div>
    </BaseCard>

    <BaseCard
      title="Sección secundaria"
      subtitle="Sin sombra, para contenido de apoyo"
      variant="flat"
    >
      <p>Este contenido es menos prioritario visualmente.</p>
    </BaseCard>
  </main>
</template>