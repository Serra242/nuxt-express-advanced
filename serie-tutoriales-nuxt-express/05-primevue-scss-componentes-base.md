# Tutorial 5: PrimeVue, SCSS y componentes base

La aplicación ya funciona y el backend ya está organizado. Ahora mejoraremos el frontend sin empezar todavía por servicios, composables o componentes de dominio.

El objetivo de este tutorial es visual:

```text
HTML funcional actual
-> PrimeVue en modo unstyled
-> tokens SCSS
-> estructura ITCSS
-> componentes base
-> página de pruebas visuales
-> aplicación de tareas renovada
```

Primero construiremos y comprobaremos los elementos visuales de forma independiente. Después sustituiremos progresivamente los controles actuales sin cambiar la lógica de Axios.

---

# 1. Cuándo se considera terminado

```text
PrimeVue está instalado y configurado en modo unstyled.
SCSS está disponible en Nuxt.
Los estilos siguen una estructura ITCSS sencilla.
Los colores, radios, sombras y medidas proceden de tokens.
Existe una ruta de playground visual.
BaseButton envuelve PrimeVue Button.
BaseInputText envuelve PrimeVue InputText.
BaseCard proporciona una tarjeta reutilizable.
AppToast centraliza PrimeVue Toast.
Las clases siguen prefijos pg-, c-, l-, o-, u-, is- y has-.
La aplicación de tareas mantiene todo su comportamiento.
La interfaz funciona en escritorio y móvil.
```

---

# 2. Separar presentación y comportamiento durante este tutorial

No moveremos todavía las llamadas Axios fuera de la página.

Eso se hará en el tutorial siguiente.

En este tutorial cambiaremos:

- La estructura visual.
- Los controles.
- Los estados.
- La organización de estilos.

Mantendremos:

- `loadTasks`.
- `createTask`.
- `toggleTask`.
- `deleteTask`.
- Los `ref` actuales.

Esta separación permite detectar con facilidad si un problema nuevo es visual o funcional.

---

# PARTE I — PREPARAR PÁGINAS Y PLAYGROUND

# 3. Activar el sistema de páginas de Nuxt

Hasta ahora toda la interfaz puede estar en:

```text
src/app.vue
```

Crea:

```text
src/pages/index.vue
```

Mueve temporalmente a ese archivo el contenido actual de `app.vue`.

Después deja `src/app.vue` así:

```vue
<template>
  <NuxtPage />
</template>
```

Comprueba:

```text
http://localhost:3000
```

La aplicación debe continuar funcionando.

---

# 4. Crear una página de pruebas visuales

Crea:

```text
src/pages/playground.vue
```

Contenido inicial:

```vue
<template>
  <main class="pg-playground-tpl">
    <h1>Playground visual</h1>

    <p>
      Esta página permitirá comprobar componentes
      sin depender de la API.
    </p>
  </main>
</template>
```

Abre:

```text
http://localhost:3000/playground
```

El prefijo `pg-` identifica una clase de página.

---

# PARTE II — INSTALAR PRIMEVUE CUANDO LO NECESITAMOS

# 5. Instalar PrimeVue

Ahora necesitamos controles accesibles y reutilizables para el sistema visual.

Dentro de `frontend`:

```powershell
npm install primevue
```

No instalaremos un tema porque utilizaremos PrimeVue en modo `unstyled`.

En este modo:

```text
PrimeVue
└── aporta comportamiento y accesibilidad.

Nuestro SCSS
└── aporta la apariencia visual.
```

---

# 6. Crear el plugin de PrimeVue

Crea:

```text
src/plugins/primevue.ts
```

```ts
import PrimeVue from 'primevue/config'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(PrimeVue, {
    unstyled: true,
  })
})
```

Reinicia Nuxt después de crear o modificar plugins si no se cargan automáticamente.

---

# 7. Instalar soporte SCSS

```powershell
npm install -D sass
```

Crea:

```text
src/assets/scss/main.scss
```

Registra el archivo en `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  srcDir: 'src/',

  css: ['~/assets/scss/main.scss'],

  runtimeConfig: {
    public: {
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE ||
        'http://localhost:3001/api',
    },
  },
})
```

---

# PARTE III — CREAR UNA ESTRUCTURA ITCSS MÍNIMA

# 8. Crear las capas

Dentro de:

```text
src/assets/scss/
```

crea:

```text
settings/
tools/
generic/
elements/
objects/
components/
utilities/
```

La estructura será:

```text
scss/
├── settings/
│   └── _variables.scss
├── tools/
│   └── _controls.scss
├── generic/
│   └── _reset.scss
├── elements/
│   └── _base.scss
├── objects/
│   └── _card.scss
├── components/
├── utilities/
│   └── _utilities.scss
└── main.scss
```

No necesitamos llenar todas las capas de golpe. Cada archivo aparecerá cuando exista una necesidad real.

---

# 9. Crear tokens globales

Crea:

```text
settings/_variables.scss
```

```scss
$color-primary-10: #eef2ff;
$color-primary-50: #6366f1;
$color-primary-70: #4338ca;

$color-grey-10: #f8fafc;
$color-grey-20: #e2e8f0;
$color-grey-40: #94a3b8;
$color-grey-70: #334155;
$color-grey-90: #0f172a;

$color-surface: #ffffff;
$color-text: $color-grey-90;
$color-text-muted: #64748b;
$color-border: $color-grey-20;
$color-danger-10: #fee2e2;
$color-danger-50: #dc2626;
$color-success-10: #dcfce7;
$color-success-60: #15803d;

$radius-sm: 0.5rem;
$radius-md: 0.75rem;
$radius-lg: 1rem;

$shadow-sm: 0 0.25rem 0.75rem rgb(15 23 42 / 8%);
$shadow-md: 0 1rem 2.5rem rgb(15 23 42 / 10%);

$font-size-xs: 0.75rem;
$font-size-sm: 0.875rem;
$font-size-md: 1rem;
$font-size-lg: 1.25rem;
$font-size-xl: 2rem;

$control-height-md: 2.75rem;
$focus-ring: 0 0 0 0.2rem rgb(99 102 241 / 20%);

$space-1: 0.25rem;
$space-2: 0.5rem;
$space-3: 0.75rem;
$space-4: 1rem;
$space-5: 1.5rem;
$space-6: 2rem;
$space-7: 3rem;
```

Un token representa una decisión compartida. No crees un color diferente dentro de cada componente sin comprobar primero si ya existe un token adecuado.

---

# 10. Crear un reset mínimo

Crea:

```text
generic/_reset.scss
```

```scss
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  min-height: 100%;
}

body {
  min-height: 100vh;
  margin: 0;
}

button,
input,
textarea,
select {
  font: inherit;
}
```

---

# 11. Crear estilos de elementos

Crea:

```text
elements/_base.scss
```

```scss
@use '../settings/variables' as *;

body {
  background: $color-grey-10;
  color: $color-text;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

button,
a,
input {
  outline: none;
}
```

Los selectores de elementos deben mantenerse pequeños. Las decisiones específicas pertenecen a objetos o componentes.

---

# 12. Crear utilidades pequeñas

Crea:

```text
utilities/_utilities.scss
```

```scss
.u-widthFull {
  width: 100%;
}

.u-srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

Las utilidades hacen una sola cosa y pueden reutilizarse.

Crea también:

```text
objects/_card.scss
```

```scss
@use '../settings/variables' as *;

.o-card {
  width: min(45rem, 100%);
  margin-inline: auto;
}
```

El prefijo `o-` identifica un patrón de composición reutilizable que no pertenece a un componente concreto.

---

# 13. Conectar las capas en `main.scss`

```scss
@use 'generic/reset';
@use 'elements/base';
@use 'objects/card';
@use 'components/button';
@use 'components/input-text';
@use 'components/base-card';
@use 'components/toast';
@use 'components/tasks';
@use 'components/playground';
@use 'utilities/utilities';
```

Algunos archivos todavía no existen. Puedes comentar temporalmente sus líneas y activarlas cuando los creemos.

---

# PARTE IV — CREAR `BaseButton`

# 14. Introducir PrimeVue Button en el playground

Crea temporalmente en `playground.vue`:

```vue
<script setup lang="ts">
import Button from 'primevue/button'
</script>

<template>
  <main class="pg-playground-tpl">
    <h1>Playground visual</h1>

    <Button label="Botón PrimeVue" />
  </main>
</template>
```

El botón funciona, pero en modo `unstyled` apenas tiene apariencia. Eso es lo esperado.

---

# 15. Crear un wrapper propio

Crea:

```text
src/components/button/BaseButton.vue
```

```vue
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
  disabled?: boolean
  loading?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
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
      {
        'is-loading': props.loading,
      },
    ]"
    @click="emit('click', $event)"
  />
</template>
```

La página utilizará `BaseButton` en lugar de importar PrimeVue Button directamente.

---

# 16. Añadir el SCSS del botón

Crea:

```text
components/_button.scss
```

```scss
@use '../settings/variables' as *;

.c-button-tpl {
  display: inline-flex;
  min-height: $control-height-md;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: 0 $space-4;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    color 150ms ease,
    opacity 150ms ease;

  &:focus-visible {
    box-shadow: $focus-ring;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &--primary {
    background: $color-primary-50;
    color: $color-surface;

    &:not(:disabled):hover {
      background: $color-primary-70;
    }
  }

  &--secondary {
    border-color: $color-border;
    background: $color-surface;
    color: $color-grey-70;

    &:not(:disabled):hover {
      background: $color-grey-10;
    }
  }

  &--ghost {
    background: transparent;
    color: $color-primary-70;

    &:not(:disabled):hover {
      background: $color-primary-10;
    }
  }

  &--danger {
    background: $color-danger-50;
    color: $color-surface;

    &:not(:disabled):hover {
      filter: brightness(0.92);
    }
  }
}
```

---

# 17. Probar variantes

En el playground:

```vue
<BaseButton label="Primario" />
<BaseButton
  label="Secundario"
  variant="secondary"
/>
<BaseButton label="Ghost" variant="ghost" />
<BaseButton label="Eliminar" variant="danger" />
<BaseButton label="Deshabilitado" disabled />
<BaseButton label="Cargando" loading />
```

Comprueba estados normal, hover, focus y disabled.

---

# PARTE V — CREAR UN CONTROL DE TEXTO COMPARTIDO

# 18. Crear un mixin para controles

Crea:

```text
tools/_controls.scss
```

```scss
@use '../settings/variables' as *;

@mixin control-shell-tpl(
  $height: $control-height-md
) {
  width: 100%;
  min-height: $height;
  padding: 0 $space-3;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  background: $color-surface;
  color: $color-text;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;

  &:focus {
    border-color: $color-primary-50;
    box-shadow: $focus-ring;
  }

  &:disabled {
    background: $color-grey-10;
    cursor: not-allowed;
  }
}

@mixin control-shell-hover-tpl {
  &:not(:disabled):hover {
    border-color: $color-grey-40;
  }
}
```

Este mixin podrá reutilizarse en input, select y datepicker en el futuro.

---

# 19. Crear `BaseInputText`

Crea:

```text
src/components/form/BaseInputText.vue
```

```vue
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
```

---

# 20. Añadir su SCSS

Crea:

```text
components/_input-text.scss
```

```scss
@use '../settings/variables' as *;
@use '../tools/controls' as controls;

.c-input-text-tpl {
  display: grid;
  gap: $space-2;

  &__control {
    @include controls.control-shell-tpl;
    @include controls.control-shell-hover-tpl;
  }

  &__error {
    color: $color-danger-50;
    font-size: $font-size-sm;
  }

  &.has-error &__control {
    border-color: $color-danger-50;
  }
}
```

Prueba en el playground:

```vue
<script setup lang="ts">
const exampleText = ref('')
</script>

<BaseInputText
  id="example-text"
  v-model="exampleText"
  placeholder="Escribe algo"
/>

<BaseInputText
  id="example-error"
  model-value="Valor incorrecto"
  error="Este campo contiene un error"
/>
```

---

# PARTE VI — CREAR UNA TARJETA REUTILIZABLE

# 21. Crear `BaseCard`

Crea:

```text
src/components/card/BaseCard.vue
```

```vue
<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  variant?: 'default' | 'flat'
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  subtitle: undefined,
  variant: 'default',
})
</script>

<template>
  <section
    :class="[
      'c-base-card-tpl',
      `c-base-card-tpl--${props.variant}`,
    ]"
  >
    <header
      v-if="props.title || props.subtitle"
      class="c-base-card-tpl__header"
    >
      <h2
        v-if="props.title"
        class="c-base-card-tpl__title"
      >
        {{ props.title }}
      </h2>

      <p
        v-if="props.subtitle"
        class="c-base-card-tpl__subtitle"
      >
        {{ props.subtitle }}
      </p>
    </header>

    <div class="c-base-card-tpl__body">
      <slot />
    </div>

    <footer
      v-if="$slots.footer"
      class="c-base-card-tpl__footer"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>
```

---

# 22. Añadir sus estilos

Crea:

```text
components/_base-card.scss
```

```scss
@use '../settings/variables' as *;

.c-base-card-tpl {
  padding: $space-6;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: $color-surface;
  box-shadow: $shadow-md;

  &--flat {
    box-shadow: none;
  }

  &__header {
    margin-bottom: $space-5;
  }

  &__title {
    margin-bottom: $space-2;
    font-size: $font-size-lg;
  }

  &__subtitle {
    margin-bottom: 0;
    color: $color-text-muted;
    line-height: 1.6;
  }

  &__footer {
    margin-top: $space-5;
    padding-top: $space-4;
    border-top: 1px solid $color-border;
  }
}
```

Prueba slots y variantes en el playground.

---

# PARTE VII — NOTIFICACIONES

# 23. Instalar el servicio Toast de PrimeVue

No hace falta instalar otro paquete. Amplía el plugin:

```ts
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(PrimeVue, {
    unstyled: true,
  })

  nuxtApp.vueApp.use(ToastService)
})
```

---

# 24. Crear `AppToast`

Crea:

```text
src/components/utils/AppToast.vue
```

```vue
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
```

Pass Through permite añadir clases a secciones internas sin depender de selectores frágiles.

---

# 25. Crear `useNotification`

Crea:

```text
src/composables/useNotification.ts
```

```ts
import { useToast } from 'primevue/usetoast'

export function useNotification() {
  const toast = useToast()

  function success(summary: string, detail?: string) {
    toast.add({
      severity: 'success',
      summary,
      detail,
      life: 3500,
    })
  }

  function error(summary: string, detail?: string) {
    toast.add({
      severity: 'error',
      summary,
      detail,
      life: 5000,
    })
  }

  function info(summary: string, detail?: string) {
    toast.add({
      severity: 'info',
      summary,
      detail,
      life: 3500,
    })
  }

  return {
    success,
    error,
    info,
  }
}
```

---

# 26. Montar el Toast una sola vez

Modifica `app.vue`:

```vue
<template>
  <AppToast />
  <NuxtPage />
</template>
```

En el playground:

```vue
<script setup lang="ts">
const notification = useNotification()
</script>

<BaseButton
  label="Mostrar éxito"
  @click="notification.success('Operación completada')"
/>

<BaseButton
  label="Mostrar error"
  variant="danger"
  @click="notification.error('No se pudo completar')"
/>
```

---

# 27. Añadir estilos básicos del Toast

Crea:

```text
components/_toast.scss
```

```scss
@use '../settings/variables' as *;

.c-toast-tpl {
  display: grid;
  gap: $space-3;
  width: min(24rem, calc(100vw - 2rem));

  &__message {
    border: 1px solid $color-border;
    border-radius: $radius-md;
    background: $color-surface;
    box-shadow: $shadow-md;
  }

  &__content {
    padding: $space-4;
  }
}
```

PrimeVue puede exponer más secciones mediante `pt`. Añádelas cuando exista una necesidad visual concreta.

---

# PARTE VIII — DAR FORMA AL PLAYGROUND

# 28. Crear los estilos de página

Crea:

```text
components/_playground.scss
```

```scss
@use '../settings/variables' as *;

.pg-playground-tpl {
  width: min(70rem, calc(100% - 2rem));
  margin: 0 auto;
  padding: $space-7 0;

  &__grid {
    display: grid;
    grid-template-columns:
      repeat(auto-fit, minmax(18rem, 1fr));
    gap: $space-5;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
  }

  &__stack {
    display: grid;
    gap: $space-4;
  }
}
```

Organiza el playground mediante `BaseCard` para mostrar:

- Botones.
- Inputs.
- Estados de error.
- Notificaciones.

El playground se convierte en una superficie de regresión visual: cuando cambiemos tokens o componentes, podremos revisar todos sus estados en una sola página.

---

# PARTE IX — APLICAR EL SISTEMA A LA PÁGINA DE TAREAS

# 29. Crear la clase de página

En `pages/index.vue`, sustituye la clase principal por:

```vue
<main class="pg-tasks-tpl">
```

Dentro utilizaremos:

```vue
<BaseCard
  title="Nuxt + Express + PostgreSQL"
  subtitle="Las tareas ya se guardan de forma persistente."
>
  <!-- interfaz -->
</BaseCard>
```

No cambies todavía formulario, lista ni funciones. Comprueba primero el contenedor.

---

# 30. Sustituir el input

Antes:

```vue
<input
  id="task-title"
  v-model="newTitle"
  type="text"
  :disabled="saving"
>
```

Después:

```vue
<BaseInputText
  id="task-title"
  v-model="newTitle"
  placeholder="Ejemplo: aprender PrimeVue"
  :disabled="saving"
/>
```

Comprueba que `v-model` continúa actualizando `newTitle`.

---

# 31. Sustituir los botones uno a uno

## Añadir

```vue
<BaseButton
  type="submit"
  :label="saving ? 'Guardando...' : 'Añadir'"
  :loading="saving"
  :disabled="saving || !newTitle.trim()"
/>
```

## Recargar

```vue
<BaseButton
  label="Recargar"
  variant="secondary"
  :disabled="loading"
  @click="loadTasks"
/>
```

## Eliminar

```vue
<BaseButton
  label="Eliminar"
  variant="danger"
  @click="deleteTask(task.id)"
/>
```

Prueba cada sustitución antes de pasar a la siguiente.

---

# 32. Crear los estilos de la página de tareas

Crea:

```text
components/_tasks.scss
```

```scss
@use '../settings/variables' as *;

.pg-tasks-tpl {
  min-height: 100vh;
  padding: $space-7 $space-4;

  &__container {
    width: min(45rem, 100%);
    margin: 0 auto;
  }
}

.c-task-form-tpl {
  display: grid;
  gap: $space-3;
  margin-bottom: $space-5;

  &__label {
    font-weight: 700;
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: $space-3;
  }
}

.c-task-toolbar-tpl {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  margin-top: $space-6;
}

.c-task-list-tpl {
  display: grid;
  gap: $space-3;
  margin: $space-4 0 0;
  padding: 0;
  list-style: none;

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-4;
    padding: $space-4;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    background: $color-surface;
  }

  &__content {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: $space-3;
  }

  &__title {
    overflow-wrap: anywhere;

    &.is-completed {
      color: $color-text-muted;
      text-decoration: line-through;
    }
  }
}

.c-feedback-tpl {
  padding: $space-3 $space-4;
  border-radius: $radius-sm;

  &--error {
    background: $color-danger-10;
    color: $color-danger-50;
  }

  &--empty {
    border: 1px dashed $color-border;
    color: $color-text-muted;
    text-align: center;
  }
}

@media (max-width: 36rem) {
  .pg-tasks-tpl {
    padding: $space-5 $space-3;
  }

  .c-task-form-tpl__row {
    grid-template-columns: 1fr;
  }

  .c-task-list-tpl__item {
    align-items: stretch;
    flex-direction: column;
  }
}
```

Aquí aparecen varios prefijos:

```text
pg-  página
c-   componente visual
is-  estado
```

---

# 33. Adaptar las clases del template

Ejemplo:

```vue
<main class="pg-tasks-tpl">
  <div class="pg-tasks-tpl__container">
    <BaseCard
      title="Nuxt + Express + PostgreSQL"
      subtitle="Gestiona tareas persistentes."
    >
      <form
        class="c-task-form-tpl"
        @submit.prevent="createTask"
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
            v-model="newTitle"
            :disabled="saving"
          />

          <BaseButton
            type="submit"
            :label="
              saving ? 'Guardando...' : 'Añadir'
            "
            :loading="saving"
            :disabled="saving || !newTitle.trim()"
          />
        </div>
      </form>

      <p
        v-if="errorMessage"
        class="c-feedback-tpl c-feedback-tpl--error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <!-- toolbar y lista -->
    </BaseCard>
  </div>
</main>
```

Adapta la toolbar y la lista utilizando las clases del SCSS anterior.

---

# 34. Añadir notificaciones sin sustituir los mensajes persistentes

Los mensajes cumplen funciones distintas:

```text
Mensaje dentro de la página
└── estado que debe permanecer visible.

Toast
└── confirmación breve de una acción.
```

En la página:

```ts
const notification = useNotification()
```

Después de crear:

```ts
notification.success('Tarea creada')
```

Después de eliminar:

```ts
notification.success('Tarea eliminada')
```

En los `catch` puedes conservar `errorMessage` y añadir:

```ts
notification.error('La operación ha fallado')
```

No conviertas todos los errores en mensajes que desaparecen: un fallo que bloquea la pantalla debe seguir siendo visible en el contenido.

---

# 35. Comprobar accesibilidad básica

Revisa:

- Cada input tiene `label` asociado.
- El error utiliza `role="alert"`.
- Los botones tienen texto comprensible.
- El foco es visible.
- `disabled` refleja operaciones en curso.
- El checkbox conserva un texto asociado.
- No dependemos solo del color para indicar una tarea completada.

PrimeVue aporta comportamiento, pero la composición accesible sigue siendo responsabilidad de la aplicación.

---

# 36. Qué no debemos hacer con PrimeVue unstyled

Evita:

```text
Copiar CSS de un tema styled y esperar el mismo DOM.
Depender de clases internas p- sin necesidad.
Aplicar selectores globales profundamente acoplados.
Importar PrimeVue Button directamente en todas las páginas.
Inventar un radio o color diferente en cada componente.
```

Preferencias:

```text
Wrapper propio
-> clase c-
-> tokens
-> Pass Through para internals
```

---

# 37. Estructura resultante

```text
frontend/src/
├── app.vue
├── assets/
│   └── scss/
│       ├── settings/
│       ├── tools/
│       ├── generic/
│       ├── elements/
│       ├── objects/
│       ├── components/
│       ├── utilities/
│       └── main.scss
├── components/
│   ├── button/
│   │   └── BaseButton.vue
│   ├── card/
│   │   └── BaseCard.vue
│   ├── form/
│   │   └── BaseInputText.vue
│   └── utils/
│       └── AppToast.vue
├── composables/
│   └── useNotification.ts
├── pages/
│   ├── index.vue
│   └── playground.vue
└── plugins/
    ├── axios.ts
    └── primevue.ts
```

---

# 38. Comprobación final

En `/playground`:

```text
Todos los botones muestran sus estados.
Los inputs muestran normal, disabled y error.
Las tarjetas mantienen una estructura coherente.
Las notificaciones funcionan.
```

En `/`:

```text
GET carga tareas.
POST crea.
PATCH cambia done.
DELETE elimina.
Los controles muestran estados de carga.
El diseño se adapta a móvil.
```

---

# 39. Ejercicios

1. Añade un modificador compacto a `BaseButton`.
2. Crea un componente `BaseCheckbox` alrededor de PrimeVue Checkbox.
3. Añade una sección al playground para estados vacíos.
4. Crea un token de ancho máximo y úsalo en las páginas.
5. Añade una variante `flat` de tarjeta en una sección secundaria.
6. Comprueba navegación completa utilizando solo teclado.

---

# 40. Siguiente tutorial

La presentación ya dispone de un sistema propio. En el siguiente tutorial reorganizaremos la funcionalidad:

```text
page
  -> components de tareas
    -> composable
      -> service
        -> $api
```

La página dejará de contener directamente todas las llamadas Axios y todo el estado del módulo.
