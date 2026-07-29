<script setup lang="ts">
import Toast from 'primevue/toast'
</script>

<template>
  <Toast
    position="top-right"
    :pt="{
      root: { class: 'c-toast-tpl' },
      message: {
        class: 'c-toast-tpl__message',
      },
      messageContent: {
        class: 'c-toast-tpl__content',
      },
    }"
  />
</template>