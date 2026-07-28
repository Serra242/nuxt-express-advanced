# Tutorial 6: Servicios, composables y componentes de frontend

La aplicación ya tiene un sistema visual propio, pero la página de tareas todavía concentra demasiadas responsabilidades:

```text
pages/index.vue
├── estado
├── llamadas Axios
├── tratamiento de errores
├── formulario
├── lista
├── elemento de tarea
└── coordinación de toda la pantalla
```

Ahora aplicaremos el patrón:

```text
page/component
  -> composable
    -> service
      -> axios plugin / $api
```

La refactorización será progresiva. Después de cada movimiento comprobaremos que la aplicación continúa funcionando.

---

# 1. Cuándo se considera terminado

```text
Los tipos del módulo están centralizados.
Las llamadas HTTP están en un servicio.
El composable gestiona estado y operaciones.
TaskForm se ocupa del formulario.
TaskItem representa una tarea.
TaskList representa la colección.
La página compone las piezas.
Los componentes reciben props y emiten eventos.
La página no conoce rutas HTTP.
No se repite lógica Axios.
La aplicación mantiene GET, POST, PATCH y DELETE.
Existen pruebas básicas de componentes y composables.
```

---

# 2. Diferencias principales

```text
Service
└── sabe cómo comunicarse con la API.

Composable
└── gestiona estado reactivo y comportamiento reutilizable.

Component
└── representa una parte de la interfaz.

Page
└── compone la pantalla y conecta sus secciones.
```

Una regla práctica:

```text
URL, método HTTP o response.data
-> service

ref, loading, error y coordinación
-> composable

props, emits y template local
-> component

estructura general de la ruta
-> page
```

---

# PARTE I — CENTRALIZAR LOS TIPOS

# 3. Crear el tipo `Task`

Actualmente la interfaz puede estar declarada dentro de `pages/index.vue`.

Crea:

```text
src/types/task.ts
```

```ts
export interface Task {
  id: number
  title: string
  done: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  title: string
}

export interface UpdateTaskInput {
  title?: string
  done?: boolean
}
```

El frontend no debe importar modelos Sequelize. Define sus propios tipos según la respuesta pública de la API.

---

# 4. Sustituir la interfaz local

En `pages/index.vue` elimina:

```ts
interface Task { ... }
```

E importa:

```ts
import type { Task } from '~/types/task'
```

Comprueba que TypeScript y la aplicación continúan funcionando.

Todavía no hemos cambiado el comportamiento.

---

# PARTE II — EXTRAER EL SERVICIO HTTP

# 5. Identificar el código que pertenece al servicio

En la página aparecen llamadas como:

```ts
$api.get<Task[]>('/tasks')
$api.post<Task>('/tasks', { title })
$api.patch<Task>(`/tasks/${task.id}`, { done })
$api.delete(`/tasks/${id}`)
```

Estas líneas conocen:

- Axios.
- Las rutas.
- Los métodos HTTP.
- La forma de la respuesta.

Por tanto, pertenecen a un servicio.

---

# 6. Crear una factoría de servicio

Crea:

```text
src/services/task.service.ts
```

```ts
import type { AxiosInstance } from 'axios'
import type {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from '~/types/task'

export function createTaskService(
  api: AxiosInstance,
) {
  async function getAll(): Promise<Task[]> {
    const response = await api.get<Task[]>('/tasks')
    return response.data
  }

  async function getById(id: number): Promise<Task> {
    const response = await api.get<Task>(
      `/tasks/${id}`,
    )
    return response.data
  }

  async function create(
    input: CreateTaskInput,
  ): Promise<Task> {
    const response = await api.post<Task>(
      '/tasks',
      input,
    )
    return response.data
  }

  async function update(
    id: number,
    input: UpdateTaskInput,
  ): Promise<Task> {
    const response = await api.patch<Task>(
      `/tasks/${id}`,
      input,
    )
    return response.data
  }

  async function remove(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`)
  }

  return {
    getAll,
    getById,
    create,
    update,
    remove,
  }
}
```

La factoría recibe Axios desde fuera. Esto evita que el servicio dependa directamente del contexto Nuxt y facilita probarlo con una instancia simulada.

---

# 7. Utilizar el servicio desde la página

En `pages/index.vue`:

```ts
import { createTaskService } from '~/services/task.service'

const { $api } = useNuxtApp()
const taskService = createTaskService($api)
```

Cambia temporalmente:

```ts
const response = await $api.get<Task[]>('/tasks')
tasks.value = response.data
```

por:

```ts
tasks.value = await taskService.getAll()
```

Haz lo mismo con `create`, `update` y `remove`.

Después de cada cambio, prueba la operación correspondiente.

---

# 8. Qué ha mejorado

La página ya no conoce:

```text
GET /tasks
POST /tasks
PATCH /tasks/:id
DELETE /tasks/:id
```

Solo conoce operaciones con intención:

```text
getAll
create
update
remove
```

Si la ruta de la API cambia, se modifica un único archivo.

---

# PARTE III — EXTRAER EL ESTADO A UN COMPOSABLE

# 9. Identificar el estado del módulo

El módulo de tareas mantiene:

```text
tasks
loading
saving
errorMessage
```

Y operaciones:

```text
loadTasks
createTask
toggleTask
deleteTask
```

Ese conjunto forma una unidad reutilizable y puede vivir en un composable.

---

# 10. Crear `useTasks`

Crea:

```text
src/composables/useTasks.ts
```

```ts
import { ref } from 'vue'
import type { Task } from '~/types/task'
import { createTaskService } from '~/services/task.service'

export function useTasks() {
  const { $api } = useNuxtApp()
  const taskService = createTaskService($api)

  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const errorMessage = ref('')

  async function loadTasks() {
    loading.value = true
    errorMessage.value = ''

    try {
      tasks.value = await taskService.getAll()
    } catch (error) {
      console.error(error)
      errorMessage.value =
        'No se han podido cargar las tareas.'
    } finally {
      loading.value = false
    }
  }

  async function createTask(title: string) {
    saving.value = true
    errorMessage.value = ''

    try {
      const task = await taskService.create({ title })
      tasks.value.push(task)
      return task
    } catch (error) {
      console.error(error)
      errorMessage.value =
        'No se ha podido crear la tarea.'
      return null
    } finally {
      saving.value = false
    }
  }

  async function toggleTask(task: Task) {
    errorMessage.value = ''

    try {
      const updated = await taskService.update(
        task.id,
        {
          done: !task.done,
        },
      )

      const index = tasks.value.findIndex(
        (current) => current.id === task.id,
      )

      if (index !== -1) {
        tasks.value[index] = updated
      }

      return updated
    } catch (error) {
      console.error(error)
      errorMessage.value =
        'No se ha podido actualizar la tarea.'
      return null
    }
  }

  async function deleteTask(id: number) {
    errorMessage.value = ''

    try {
      await taskService.remove(id)
      tasks.value = tasks.value.filter(
        (task) => task.id !== id,
      )
      return true
    } catch (error) {
      console.error(error)
      errorMessage.value =
        'No se ha podido eliminar la tarea.'
      return false
    }
  }

  return {
    tasks,
    loading,
    saving,
    errorMessage,
    loadTasks,
    createTask,
    toggleTask,
    deleteTask,
  }
}
```

---

# 11. Utilizar el composable en la página

Elimina de `pages/index.vue`:

- La instancia directa del servicio.
- Los `ref` de tareas y carga.
- Las cuatro funciones HTTP.

Añade:

```ts
const {
  tasks,
  loading,
  saving,
  errorMessage,
  loadTasks,
  createTask,
  toggleTask,
  deleteTask,
} = useTasks()
```

Conserva temporalmente `newTitle` en la página:

```ts
const newTitle = ref('')
```

Adapta el submit:

```ts
async function handleCreateTask() {
  const title = newTitle.value.trim()

  if (!title) {
    return
  }

  const created = await createTask(title)

  if (created) {
    newTitle.value = ''
    notification.success('Tarea creada')
  }
}
```

El template usará:

```vue
@submit.prevent="handleCreateTask"
```

---

# 12. Por qué el input todavía pertenece a la página

`newTitle` representa el estado local de un formulario concreto.

El listado de tareas y las operaciones pertenecen al módulo. El texto que una persona está escribiendo puede pertenecer al componente de formulario.

El siguiente paso será moverlo a `TaskForm`.

---

# PARTE IV — EXTRAER `TaskForm`

# 13. Definir la responsabilidad del formulario

`TaskForm` debe:

- Mostrar label, input y botón.
- Guardar el texto mientras se escribe.
- Evitar enviar un texto vacío.
- Emitir el título limpio.
- Mostrar el estado `saving`.

No debe:

- Conocer Axios.
- Conocer `/api/tasks`.
- Modificar la lista directamente.

---

# 14. Crear `TaskForm.vue`

Crea:

```text
src/components/tasks/TaskForm.vue
```

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  saving?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  saving: false,
})

const emit = defineEmits<{
  create: [title: string]
}>()

const title = ref('')

function submit() {
  const normalizedTitle = title.value.trim()

  if (!normalizedTitle || props.saving) {
    return
  }

  emit('create', normalizedTitle)
}

function clear() {
  title.value = ''
}

defineExpose({
  clear,
})
</script>

<template>
  <form
    class="c-task-form-tpl"
    @submit.prevent="submit"
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
        v-model="title"
        placeholder="Ejemplo: separar un componente"
        :disabled="props.saving"
      />

      <BaseButton
        type="submit"
        :label="
          props.saving ? 'Guardando...' : 'Añadir'
        "
        :loading="props.saving"
        :disabled="
          props.saving || !title.trim()
        "
      />
    </div>
  </form>
</template>
```

---

# 15. Coordinar el formulario desde la página

En la página:

```ts
const taskForm = ref<{
  clear: () => void
} | null>(null)

async function handleCreateTask(title: string) {
  const created = await createTask(title)

  if (created) {
    taskForm.value?.clear()
    notification.success('Tarea creada')
  }
}
```

Template:

```vue
<TaskForm
  ref="taskForm"
  :saving="saving"
  @create="handleCreateTask"
/>
```

`TaskForm` emite intención. La página coordina el resultado con el composable y la notificación.

---

# 16. Alternativa sin `defineExpose`

También podríamos pasar una prop para reiniciar o hacer que el formulario se limpie inmediatamente después de emitir.

En este tutorial esperamos a que el backend confirme la creación antes de limpiar. Así el texto se conserva si la petición falla.

Esa decisión pertenece al comportamiento del formulario y debe ser consciente.

---

# PARTE V — EXTRAER `TaskItem`

# 17. Definir props y eventos

Un elemento recibe una tarea:

```ts
props: task
```

Y comunica acciones:

```text
toggle
delete
```

No necesita llamar al composable directamente. Esto mantiene el componente reutilizable y fácil de probar.

---

# 18. Crear `TaskItem.vue`

```text
src/components/tasks/TaskItem.vue
```

```vue
<script setup lang="ts">
import type { Task } from '~/types/task'

interface Props {
  task: Task
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggle: [task: Task]
  delete: [id: number]
}>()
</script>

<template>
  <li class="c-task-list-tpl__item">
    <label class="c-task-list-tpl__content">
      <input
        type="checkbox"
        :checked="props.task.done"
        @change="emit('toggle', props.task)"
      >

      <span
        class="c-task-list-tpl__title"
        :class="{
          'is-completed': props.task.done,
        }"
      >
        {{ props.task.title }}
      </span>
    </label>

    <BaseButton
      label="Eliminar"
      variant="danger"
      @click="emit('delete', props.task.id)"
    />
  </li>
</template>
```

---

# 19. Probar `TaskItem` dentro de la página

Sustituye el contenido del `v-for`:

```vue
<TaskItem
  v-for="task in tasks"
  :key="task.id"
  :task="task"
  @toggle="toggleTask"
  @delete="deleteTask"
/>
```

Todavía mantenemos el `<ul>` en la página.

Comprueba `PATCH` y `DELETE` antes de continuar.

---

# PARTE VI — EXTRAER `TaskList`

# 20. Responsabilidad de la lista

La lista debe decidir cómo representar una colección:

- Estado de carga.
- Estado vacío.
- Elementos.

Puede emitir hacia arriba las acciones de sus elementos.

---

# 21. Crear `TaskList.vue`

```text
src/components/tasks/TaskList.vue
```

```vue
<script setup lang="ts">
import type { Task } from '~/types/task'

interface Props {
  tasks: Task[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  toggle: [task: Task]
  delete: [id: number]
}>()
</script>

<template>
  <p v-if="props.loading">
    Cargando tareas...
  </p>

  <p
    v-else-if="props.tasks.length === 0"
    class="c-feedback-tpl c-feedback-tpl--empty"
  >
    No hay tareas.
  </p>

  <ul
    v-else
    class="c-task-list-tpl"
  >
    <TaskItem
      v-for="task in props.tasks"
      :key="task.id"
      :task="task"
      @toggle="emit('toggle', $event)"
      @delete="emit('delete', $event)"
    />
  </ul>
</template>
```

---

# 22. Sustituir la lista de la página

```vue
<TaskList
  :tasks="tasks"
  :loading="loading"
  @toggle="handleToggleTask"
  @delete="handleDeleteTask"
/>
```

Crea handlers de página para añadir notificaciones:

```ts
async function handleToggleTask(task: Task) {
  const updated = await toggleTask(task)

  if (updated) {
    notification.success('Tarea actualizada')
  }
}

async function handleDeleteTask(id: number) {
  const deleted = await deleteTask(id)

  if (deleted) {
    notification.success('Tarea eliminada')
  }
}
```

La página coordina efectos de pantalla; el composable realiza la operación y actualiza el estado.

---

# PARTE VII — SIMPLIFICAR LA PÁGINA

# 23. Página final

`pages/index.vue` puede quedar aproximadamente así:

```vue
<script setup lang="ts">
import type { Task } from '~/types/task'

const notification = useNotification()
const taskForm = ref<{
  clear: () => void
} | null>(null)

const {
  tasks,
  loading,
  saving,
  errorMessage,
  loadTasks,
  createTask,
  toggleTask,
  deleteTask,
} = useTasks()

async function handleCreateTask(title: string) {
  const created = await createTask(title)

  if (created) {
    taskForm.value?.clear()
    notification.success('Tarea creada')
  }
}

async function handleToggleTask(task: Task) {
  const updated = await toggleTask(task)

  if (updated) {
    notification.success('Tarea actualizada')
  }
}

async function handleDeleteTask(id: number) {
  const deleted = await deleteTask(id)

  if (deleted) {
    notification.success('Tarea eliminada')
  }
}

onMounted(loadTasks)
</script>

<template>
  <main class="pg-tasks-tpl">
    <div class="pg-tasks-tpl__container">
      <BaseCard
        title="Nuxt + Express + PostgreSQL"
        subtitle="Frontend organizado por responsabilidades."
      >
        <TaskForm
          ref="taskForm"
          :saving="saving"
          @create="handleCreateTask"
        />

        <p
          v-if="errorMessage"
          class="c-feedback-tpl c-feedback-tpl--error"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <div class="c-task-toolbar-tpl">
          <h2>Tareas</h2>

          <BaseButton
            label="Recargar"
            variant="secondary"
            :disabled="loading"
            @click="loadTasks"
          />
        </div>

        <TaskList
          :tasks="tasks"
          :loading="loading"
          @toggle="handleToggleTask"
          @delete="handleDeleteTask"
        />
      </BaseCard>
    </div>
  </main>
</template>
```

La página ya no conoce Axios ni las rutas del backend.

---

# 24. Revisar el flujo completo

## Carga

```text
page onMounted
-> useTasks.loadTasks
-> taskService.getAll
-> $api.get
-> API
-> tasks.value
-> TaskList
```

## Creación

```text
TaskForm emite create
-> page handleCreateTask
-> useTasks.createTask
-> taskService.create
-> API
-> tasks.value.push
-> page muestra notificación
-> TaskForm se limpia
```

## Actualización

```text
TaskItem emite toggle
-> TaskList reemite
-> page handler
-> useTasks.toggleTask
-> taskService.update
-> reemplazo en array
```

---

# PARTE VIII — MEJORAR EL TRATAMIENTO DE ERRORES

# 25. No mostrar detalles Axios directamente

El composable registra:

```ts
console.error(error)
```

Y muestra mensajes comprensibles.

No hagas:

```ts
errorMessage.value = String(error)
```

porque podría mostrar al usuario información técnica inestable.

En un proyecto mayor puede crearse una utilidad que interprete respuestas conocidas de la API.

---

# 26. Añadir `clearError`

En `useTasks`:

```ts
function clearError() {
  errorMessage.value = ''
}
```

Exporta la función.

Puede utilizarse al cerrar un aviso o antes de una nueva acción local.

No es necesario crear una abstracción más compleja hasta que existan varios módulos con el mismo patrón.

---

# PARTE IX — PRUEBAS DEL FRONTEND

# 27. Instalar el entorno mínimo de pruebas

Dentro de `frontend`:

```powershell
npm install -D vitest @vue/test-utils happy-dom @vitejs/plugin-vue
```

Añade a `package.json`:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

# 28. Crear `vitest.config.ts`

En la raíz de `frontend`:

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': fileURLToPath(
        new URL('./src', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
})
```

---

# 29. Probar `TaskItem`

Crea:

```text
frontend/tests/unit/components/TaskItem.test.ts
```

```ts
import { mount } from '@vue/test-utils'
import TaskItem from '~/components/tasks/TaskItem.vue'

const task = {
  id: 1,
  title: 'Probar componente',
  done: false,
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-10T10:00:00.000Z',
}

describe('TaskItem', () => {
  it('muestra el título', () => {
    const wrapper = mount(TaskItem, {
      props: { task },
      global: {
        stubs: {
          BaseButton: {
            template:
              '<button @click="$emit(\'click\')">Eliminar</button>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain(
      'Probar componente',
    )
  })

  it('emite toggle al cambiar el checkbox', async () => {
    const wrapper = mount(TaskItem, {
      props: { task },
      global: {
        stubs: {
          BaseButton: true,
        },
      },
    })

    await wrapper.get('input').trigger('change')

    expect(wrapper.emitted('toggle')?.[0]).toEqual([
      task,
    ])
  })
})
```

---

# 30. Probar `TaskForm`

Crea:

```text
frontend/tests/unit/components/TaskForm.test.ts
```

En las pruebas puedes sustituir componentes base por controles sencillos para concentrarte en el contrato de `TaskForm`.

Comprueba:

- No emite un título vacío.
- Elimina espacios externos.
- Emite `create` con el texto correcto.
- Deshabilita el envío cuando `saving` es `true`.

---

# 31. Diseñar `useTasks` para que sea comprobable

Actualmente `useTasks` crea su servicio internamente. Para probarlo sin Nuxt podemos permitir una dependencia opcional.

`ReturnType` es un tipo global de TypeScript, por lo que no necesita importarse.

Crea en el servicio:

```ts
export type TaskService = ReturnType<
  typeof createTaskService
>
```

Y en el composable:

```ts
import type { TaskService } from '~/services/task.service'

export function useTasks(
  providedService?: TaskService,
) {
  const taskService = providedService ?? (() => {
    const { $api } = useNuxtApp()
    return createTaskService($api)
  })()

  // resto igual
}
```

La aplicación no cambia, pero una prueba puede proporcionar un servicio falso.

---

# 32. Probar una operación del composable

Crea:

```text
frontend/tests/unit/composables/useTasks.test.ts
```

```ts
import { useTasks } from '~/composables/useTasks'

function createFakeService() {
  return {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        title: 'Tarea simulada',
        done: false,
        createdAt: '2026-01-10T10:00:00.000Z',
        updatedAt: '2026-01-10T10:00:00.000Z',
      },
    ]),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }
}

test('loadTasks actualiza la lista', async () => {
  const service = createFakeService()
  const { tasks, loadTasks } = useTasks(service)

  await loadTasks()

  expect(tasks.value).toHaveLength(1)
  expect(tasks.value[0].title).toBe(
    'Tarea simulada',
  )
})
```

Esta prueba no inicia Nuxt, Axios ni PostgreSQL. Comprueba únicamente la coordinación del composable.

---

# 33. Qué probar en cada nivel

```text
Service
└── rutas, métodos y transformación de response.data.

Composable
└── estado, loading, errores y actualización de arrays.

Component
└── props, eventos y renderizado.

Page
└── composición principal; pocas pruebas unitarias.
```

No repitas la misma comprobación en todos los niveles.

---

# 34. Estructura resultante

```text
frontend/src/
├── components/
│   └── tasks/
│       ├── TaskForm.vue
│       ├── TaskItem.vue
│       └── TaskList.vue
├── composables/
│   ├── useNotification.ts
│   └── useTasks.ts
├── pages/
│   ├── index.vue
│   └── playground.vue
├── services/
│   └── task.service.ts
└── types/
    └── task.ts

frontend/tests/unit/
├── components/
│   ├── TaskForm.test.ts
│   └── TaskItem.test.ts
└── composables/
    └── useTasks.test.ts
```

---

# 35. Errores de arquitectura frecuentes

## El componente llama directamente a Axios

```text
TaskItem
-> $api.patch
```

Problema: el elemento visual queda acoplado al backend.

## El servicio guarda refs

```text
service
-> const tasks = ref([])
```

Problema: mezcla comunicación y estado de interfaz.

## El composable contiene HTML o clases CSS

Problema: mezcla comportamiento con presentación.

## La página reconstruye URLs

Problema: la separación del servicio queda incompleta.

---

# 36. Estrategia de depuración

Cuando algo falle después de la refactorización:

```text
¿El componente emitió el evento?
¿La página recibió el evento?
¿El composable ejecutó la operación?
¿El servicio envió la petición correcta?
¿La API respondió?
¿El composable actualizó el ref?
¿La prop nueva llegó al componente?
```

Utiliza Vue Devtools para observar props y estado reactivo, y Network para la petición HTTP.

---

# 37. Ejercicios

1. Añade un componente `TaskFilters` con Todas, Pendientes y Completadas.
2. Decide si el filtro pertenece al composable o a un composable independiente.
3. Añade estado de operación por tarea para deshabilitar su botón mientras se elimina.
4. Prueba que `deleteTask` no modifica la lista cuando el servicio falla.
5. Añade un servicio falso al playground para representar estados sin backend.
6. Crea una prueba del servicio con una instancia Axios simulada.

---

# 38. Siguiente tutorial

La aplicación ya tiene patrones backend y frontend reutilizables.

El siguiente módulo será diferente: usuarios y autenticación.

Al añadir una tabla nueva a una base que ya contiene datos aparecerá por primera vez el problema que resuelven las migraciones.

Después construiremos:

```text
usuarios
-> hash de contraseña
-> login
-> JWT
-> middleware de autenticación
-> permisos
-> sesión en Nuxt
-> rutas protegidas
```
