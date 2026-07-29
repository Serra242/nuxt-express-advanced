<script setup lang="ts">
import type { AuthUser } from '~/types/auth'
import { createUserService } from '~/services/user.service'
import { useAuth } from "~/composables/useAuth"

definePageMeta({
  middleware: ['auth', 'permission'] as any,
  permission: 'users:read',
})

const { $api } = useNuxtApp()
const userService = createUserService($api)
const auth = useAuth()

const users = ref<AuthUser[]>([])
const loading = ref(false)
const errorMessage = ref('')

async function logout() {
  auth.logout()
  await navigateTo('/login')
}

async function loadUsers() {
  loading.value = true
  errorMessage.value = ''

  try {
    users.value = await userService.getAll()
  } catch (error) {
    console.error(error)
    errorMessage.value =
      'No se han podido cargar los usuarios.'
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)
</script>

<template>
  <main class="pg-users-tpl">
    <BaseCard
      title="Usuarios"
      subtitle="Ruta protegida por autenticación y permiso."
    >
      <BaseButton
        label="Cerrar sesión"
        variant="ghost"
        @click="logout"
      />

      <p
        v-if="errorMessage"
        role="alert"
        class="c-feedback-tpl c-feedback-tpl--error"
      >
        {{ errorMessage }}
      </p>

      <p v-if="loading">Cargando usuarios...</p>

      <ul v-else>
        <li
          v-for="user in users"
          :key="user.id"
        >
          {{ user.email }} — {{ user.role }}
        </li>
      </ul>
    </BaseCard>
  </main>
</template>