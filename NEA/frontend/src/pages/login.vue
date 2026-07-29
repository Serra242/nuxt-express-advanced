<script setup lang="ts">
import { useAuth } from "~/composables/useAuth"

const auth = useAuth()
const notification = useNotification()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function submit() {
  errorMessage.value = ''

  const success = await auth.login({
    email: email.value.trim(),
    password: password.value,
  })

  if (!success) {
    errorMessage.value =
      'El correo o la contraseña no son correctos.'
    return
  }

  notification.success('Sesión iniciada')
  await navigateTo('/admin/users')
}
</script>

<template>
  <main class="pg-login-tpl">
    <div class="pg-login-tpl__container">
      <BaseCard
        title="Iniciar sesión"
        subtitle="Accede con el usuario administrador."
      >
        <form
          class="c-login-form-tpl"
          @submit.prevent="submit"
        >
          <label for="login-email">Correo</label>
          <BaseInputText
            id="login-email"
            v-model="email"
            type="email"
            autocomplete="email"
          />

          <label for="login-password">
            Contraseña
          </label>
          <BaseInputText
            id="login-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
          />

          <p
            v-if="errorMessage"
            class="c-feedback-tpl c-feedback-tpl--error"
            role="alert"
          >
            {{ errorMessage }}
          </p>

          <BaseButton
            type="submit"
            label="Entrar"
            :loading="auth.loading.value"
          />
        </form>
      </BaseCard>
    </div>
  </main>
</template>