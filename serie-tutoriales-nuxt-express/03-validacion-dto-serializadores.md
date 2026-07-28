# Tutorial 3: Validación, DTO y serializers en Express

Partimos del backend persistente construido en el tutorial anterior.

El CRUD ya funciona mediante:

```text
route
  -> controller
    -> service
      -> repository
        -> model
          -> PostgreSQL
```

Sin embargo, el controlador tiene demasiadas responsabilidades:

- Convierte parámetros.
- Comprueba tipos.
- Limpia cadenas.
- Decide qué propiedades admite.
- Llama al servicio.
- Devuelve directamente modelos Sequelize.

En este tutorial introduciremos tres piezas de forma progresiva:

```text
validation
DTO
serializer
```

El recorrido terminará así:

```text
route
  -> validation
  -> controller
    -> DTO
    -> service
      -> repository
        -> model
    -> serializer
  -> response
```

---

# 1. Cuándo se considera terminado

```text
Body, params y query se validan antes del controlador.
Los datos validados están convertidos y normalizados.
Los controladores dejan de repetir validaciones.
Los DTO limitan lo que entra en el servicio.
Los servicios no conocen req ni res.
Los modelos Sequelize no se envían directamente.
Los serializers seleccionan explícitamente los campos públicos.
GET, POST, PATCH y DELETE mantienen su comportamiento.
El frontend continúa funcionando sin modificar su contrato.
```

---

# 2. Qué no añadiremos todavía

Dejaremos para el tutorial siguiente:

- Contratos públicos de API.
- OpenAPI.
- Swagger.
- Pruebas de contrato.
- Pruebas de integración de la API.

Primero debemos entender las diferencias entre validación, DTO y serializer.

---

# PARTE I — OBSERVAR EL PROBLEMA ACTUAL

# 3. El controlador está haciendo demasiado

En el controlador actual podemos encontrar código como:

```js
const id = Number(req.params.id)

if (!Number.isInteger(id) || id <= 0) {
  return res.status(400).json({
    message: 'El identificador no es válido',
  })
}
```

Y en `POST`:

```js
const rawTitle = req.body?.title
const title =
  typeof rawTitle === 'string'
    ? rawTitle.trim()
    : ''
```

El mismo tipo de comprobación aparece en varias operaciones.

Consecuencias:

```text
Los controladores crecen.
Las reglas se repiten.
Cada ruta puede validar de forma diferente.
El servicio puede recibir datos sin normalizar.
```

---

# 4. Tres fronteras diferentes

Vamos a separar tres preguntas:

```text
¿La petición contiene datos válidos?
-> validation

¿Qué objeto exacto entregamos al servicio?
-> DTO

¿Qué campos exactos devolvemos al cliente?
-> serializer
```

Representación:

```text
Entrada HTTP
-> validation
-> DTO
-> service

Resultado interno
-> serializer
-> salida HTTP
```

---

# PARTE II — VALIDAR ANTES DEL CONTROLADOR

# 5. Instalar Zod cuando aparece la necesidad

Dentro de `backend` ejecuta:

```powershell
npm install zod
```

Zod permite:

- Definir la forma esperada.
- Convertir algunos valores.
- Normalizar cadenas.
- Rechazar propiedades no permitidas.
- Obtener errores estructurados.

---

# 6. Crear un middleware de validación

Crea:

```text
backend/src/middleware/validate.middleware.js
```

```js
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    })

    if (!result.success) {
      console.error(
        'Error de validación',
        result.error.flatten(),
      )

      return res.status(400).json({
        message:
          'Bad request. There is an issue with the provided data.',
      })
    }

    req.validated = result.data
    return next()
  }
}

module.exports = validate
```

En esta aplicación de aprendizaje guardaremos los valores interpretados en:

```js
req.validated
```

Así distinguimos claramente los datos originales de los datos aceptados. Al entrar en otro proyecto, respeta el middleware existente aunque utilice otra convención.

---

# 7. Por qué el cliente recibe un error genérico

El middleware registra internamente el detalle:

```js
console.error(result.error.flatten())
```

Pero devuelve:

```json
{
  "message": "Bad request. There is an issue with the provided data."
}
```

Esto separa:

```text
Detalle técnico
└── logs internos para desarrollar y operar.

Respuesta pública
└── información mínima y estable para el cliente.
```

Durante el desarrollo puedes inspeccionar los logs para conocer el campo exacto que falla.

---

# 8. Crear reglas reutilizables

Crea:

```text
backend/src/validators/task.schema.js
```

Empieza con:

```js
const { z } = require('zod')

const taskIdSchema = z.coerce
  .number()
  .int()
  .positive()

const taskTitleSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)

module.exports = {
  taskIdSchema,
  taskTitleSchema,
}
```

## `z.coerce.number()`

Los parámetros de URL llegan como texto:

```text
/tasks/3
-> req.params.id === "3"
```

Zod convierte el texto a número antes de comprobar que sea un entero positivo.

## `trim()`

```text
"   Aprender Zod   "
-> "Aprender Zod"
```

El controlador ya no tendrá que repetir esa normalización.

---

# 9. Validar `GET /api/tasks/:id`

Añade al archivo de esquemas:

```js
const taskIdRequestSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    id: taskIdSchema,
  }),
  query: z.object({}).passthrough(),
})
```

Exporta `taskIdRequestSchema`.

En el router:

```js
const validate = require(
  '../middleware/validate.middleware'
)
const {
  taskIdRequestSchema,
} = require('../validators/task.schema')
```

Cambia la ruta:

```js
router.get(
  '/:id',
  validate(taskIdRequestSchema),
  taskController.getTaskById,
)
```

El orden es importante:

```text
petición
-> validate
-> controlador
```

Si la validación falla, el controlador no se ejecuta.

---

# 10. Simplificar el controlador de consulta por ID

Antes convertíamos y comprobábamos el parámetro dentro del controlador.

Ahora puede comenzar así:

```js
async function getTaskById(req, res) {
  const { id } = req.validated.params

  try {
    const task = await taskService.getTaskById(id)

    if (!task) {
      return res.status(404).json({
        message: 'No se ha encontrado la tarea',
      })
    }

    return res.json(task)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido obtener la tarea',
    })
  }
}
```

El controlador recibe un número válido.

```text
Antes
-> el controlador interpreta la entrada.

Ahora
-> el controlador utiliza una entrada ya interpretada.
```

---

# 11. Validar `POST /api/tasks`

Añade:

```js
const createTaskRequestSchema = z.object({
  body: z
    .object({
      title: taskTitleSchema,
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
})
```

`.strict()` rechaza propiedades adicionales.

Ejemplo rechazado:

```json
{
  "title": "Tarea válida",
  "isAdmin": true
}
```

Registra el middleware:

```js
router.post(
  '/',
  validate(createTaskRequestSchema),
  taskController.createTask,
)
```

El controlador ya no necesita comprobar ni limpiar `title`.

---

# 12. Validar `PATCH /api/tasks/:id`

Añade:

```js
const updateTaskBodySchema = z
  .object({
    title: taskTitleSchema.optional(),
    done: z.boolean().optional(),
  })
  .strict()
  .refine(
    (body) => Object.keys(body).length > 0,
    {
      message: 'Debe enviarse al menos un cambio',
    },
  )

const updateTaskRequestSchema = z.object({
  body: updateTaskBodySchema,
  params: z.object({
    id: taskIdSchema,
  }),
  query: z.object({}).passthrough(),
})
```

Esto admite:

```json
{ "done": true }
```

```json
{ "title": "Título nuevo" }
```

```json
{
  "title": "Título nuevo",
  "done": false
}
```

Y rechaza:

```json
{}
```

```json
{ "done": "true" }
```

```json
{ "unknown": 10 }
```

Registra:

```js
router.patch(
  '/:id',
  validate(updateTaskRequestSchema),
  taskController.updateTask,
)
```

---

# 13. Validar `DELETE /api/tasks/:id`

Reutiliza el mismo esquema de parámetros:

```js
router.delete(
  '/:id',
  validate(taskIdRequestSchema),
  taskController.deleteTask,
)
```

No necesitamos crear un esquema diferente si la forma de la petición es la misma.

---

# 14. Añadir un filtro opcional en `GET /api/tasks`

Este paso permite practicar `query`.

Añade:

```js
const listTasksRequestSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    done: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  }),
})
```

Rutas válidas:

```text
GET /api/tasks
GET /api/tasks?done=true
GET /api/tasks?done=false
```

`done` llega al controlador como booleano.

Registra:

```js
router.get(
  '/',
  validate(listTasksRequestSchema),
  taskController.getTasks,
)
```

---

# PARTE III — CREAR DTO DESPUÉS DE VALIDAR

# 15. Qué problema resuelve un DTO

Después de validar, podríamos pasar directamente:

```js
req.validated.body
```

al servicio.

Pero eso acopla el servicio a la forma exacta de la petición HTTP.

Un DTO construye un objeto explícito para la aplicación:

```text
Petición validada
-> DTO
-> servicio
```

Diferencia:

```text
Validator
└── decide si la entrada es válida y la normaliza.

DTO
└── decide qué datos exactos recibe el servicio.
```

---

# 16. Crear los DTO de tareas

Crea:

```text
backend/src/dtos/task.dto.js
```

```js
function createTaskDto(validated) {
  return Object.freeze({
    title: validated.body.title,
  })
}

function updateTaskDto(validated) {
  const changes = {}

  if (validated.body.title !== undefined) {
    changes.title = validated.body.title
  }

  if (validated.body.done !== undefined) {
    changes.done = validated.body.done
  }

  return Object.freeze({
    id: validated.params.id,
    changes: Object.freeze(changes),
  })
}

function taskIdDto(validated) {
  return Object.freeze({
    id: validated.params.id,
  })
}

function listTasksDto(validated) {
  return Object.freeze({
    done: validated.query.done,
  })
}

module.exports = {
  createTaskDto,
  updateTaskDto,
  taskIdDto,
  listTasksDto,
}
```

`Object.freeze` no es obligatorio, pero ayuda a expresar que el DTO no debería modificarse durante el recorrido.

---

# 17. Utilizar el DTO en `POST`

Importa:

```js
const {
  createTaskDto,
} = require('../dtos/task.dto')
```

Refactoriza:

```js
async function createTask(req, res) {
  const dto = createTaskDto(req.validated)

  try {
    const task = await taskService.createTask(dto)
    return res.status(201).json(task)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido crear la tarea',
    })
  }
}
```

El servicio recibe:

```js
{
  title: 'Título validado'
}
```

No recibe `req`, `res`, cabeceras ni propiedades desconocidas.

---

# 18. Utilizar DTO en las demás operaciones

## Listado

```js
async function getTasks(req, res) {
  const dto = listTasksDto(req.validated)

  try {
    const tasks = await taskService.getTasks(dto)
    return res.json(tasks)
  } catch (error) {
    // ...
  }
}
```

## Consulta por ID

```js
const dto = taskIdDto(req.validated)
const task = await taskService.getTaskById(dto.id)
```

## Actualización

```js
const dto = updateTaskDto(req.validated)
const task = await taskService.updateTask(
  dto.id,
  dto.changes,
)
```

## Eliminación

```js
const dto = taskIdDto(req.validated)
const deleted = await taskService.deleteTask(dto.id)
```

---

# 19. Adaptar el repositorio al filtro

Modifica `findAll`:

```js
async function findAll(filters = {}) {
  const where = {}

  if (filters.done !== undefined) {
    where.done = filters.done
  }

  return Task.findAll({
    where,
    order: [['id', 'ASC']],
  })
}
```

Y el servicio:

```js
async function getTasks(dto) {
  return taskRepository.findAll({
    done: dto.done,
  })
}
```

El repositorio recibe filtros de persistencia, no el objeto `req.query`.

---

# PARTE IV — CONTROLAR LA SALIDA CON SERIALIZERS

# 20. El problema de devolver un modelo Sequelize

Hasta ahora hacemos:

```js
return res.json(task)
```

`task` puede ser una instancia Sequelize con:

- Datos de la tabla.
- Metadatos internos.
- Métodos.
- Campos que añadamos en el futuro.

Aunque `res.json` suele producir un objeto razonable, la API no debería depender accidentalmente de todo lo que contenga el modelo.

```text
Modelo
└── representación interna de persistencia.

Respuesta pública
└── contrato que ve el cliente.
```

---

# 21. Crear un serializer público

Crea:

```text
backend/src/serializers/task/task.serializer.js
```

```js
function toPlain(task) {
  if (!task) {
    return undefined
  }

  return task.get
    ? task.get({ plain: true })
    : task
}

function taskPublic(task) {
  const value = toPlain(task)

  if (!value) {
    return undefined
  }

  return {
    id: value.id,
    title: value.title,
    done: value.done,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function taskRef(task) {
  const value = toPlain(task)

  if (!value) {
    return undefined
  }

  return {
    id: value.id,
    title: value.title,
  }
}

module.exports = {
  taskPublic,
  taskRef,
}
```

`taskPublic` representa la tarea como respuesta principal.

`taskRef` es una vista pequeña para una futura respuesta anidada.

---

# 22. Crear un archivo de exportación

Crea:

```text
backend/src/serializers/task/index.js
```

```js
const {
  taskPublic,
  taskRef,
} = require('./task.serializer')

module.exports = {
  taskPublic,
  taskRef,
}
```

Así el controlador importa desde la carpeta:

```js
const {
  taskPublic,
} = require('../serializers/task')
```

---

# 23. Aplicar serializers en los controladores

## Listado

```js
const serializedTasks = tasks.map(taskPublic)
return res.json(serializedTasks)
```

## Consulta individual

```js
return res.json(taskPublic(task))
```

## Creación

```js
return res.status(201).json(taskPublic(task))
```

## Actualización

```js
return res.json(taskPublic(task))
```

## Eliminación

No necesita serializer porque devuelve `204 No Content`.

La regla es:

```text
Service
└── devuelve datos internos o resultados de operación.

Controller
└── aplica el serializer antes de responder.
```

El servicio no debe importar serializers.

---

# 24. Diferencia entre DTO y serializer

Es una de las distinciones más importantes del tutorial:

```text
DTO
└── controla la entrada hacia el servicio.

Serializer
└── controla la salida hacia el cliente.
```

Ejemplo:

```text
POST /api/tasks

body HTTP
-> validator
-> createTaskDto
-> service
-> repository
-> model creado
-> taskPublic
-> JSON 201
```

---

# 25. Revisar el router completo

```js
const express = require('express')
const taskController = require(
  '../controllers/task.controller'
)
const validate = require(
  '../middleware/validate.middleware'
)
const {
  listTasksRequestSchema,
  taskIdRequestSchema,
  createTaskRequestSchema,
  updateTaskRequestSchema,
} = require('../validators/task.schema')

const router = express.Router()

router.get(
  '/',
  validate(listTasksRequestSchema),
  taskController.getTasks,
)

router.get(
  '/:id',
  validate(taskIdRequestSchema),
  taskController.getTaskById,
)

router.post(
  '/',
  validate(createTaskRequestSchema),
  taskController.createTask,
)

router.patch(
  '/:id',
  validate(updateTaskRequestSchema),
  taskController.updateTask,
)

router.delete(
  '/:id',
  validate(taskIdRequestSchema),
  taskController.deleteTask,
)

module.exports = router
```

La ruta declara el recorrido, pero no contiene lógica de negocio.

---

# 26. Revisar un controlador completo

Ejemplo de actualización:

```js
const taskService = require('../services/task.service')
const {
  updateTaskDto,
} = require('../dtos/task.dto')
const {
  taskPublic,
} = require('../serializers/task')

async function updateTask(req, res) {
  const dto = updateTaskDto(req.validated)

  try {
    const task = await taskService.updateTask(
      dto.id,
      dto.changes,
    )

    if (!task) {
      return res.status(404).json({
        message: 'No se ha encontrado la tarea',
      })
    }

    return res.json(taskPublic(task))
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido actualizar la tarea',
    })
  }
}
```

El controlador sigue gestionando HTTP, pero ya no interpreta manualmente cada campo ni devuelve el modelo directamente.

---

# 27. Probar las validaciones con Postman

Prueba al menos:

## ID no válido

```text
GET /api/tasks/abc
```

Esperado:

```text
400 Bad Request
```

## Título vacío

```json
{
  "title": "   "
}
```

## Propiedad inesperada

```json
{
  "title": "Tarea",
  "role": "admin"
}
```

## PATCH vacío

```json
{}
```

## Booleano como texto

```json
{
  "done": "true"
}
```

## Query válida

```text
GET /api/tasks?done=false
```

Comprueba también los logs internos del backend.

---

# 28. Comprobar que el frontend no se rompe

El frontend anterior espera:

```ts
interface Task {
  id: number
  title: string
  done: boolean
}
```

El serializer sigue devolviendo esos campos. También añade fechas, que el frontend puede ignorar.

Prueba:

- Cargar tareas.
- Crear una tarea.
- Cambiar `done`.
- Eliminar.
- Recargar la página.

La arquitectura interna ha cambiado sin obligar al cliente a cambiar.

---

# 29. Estructura resultante

```text
backend/src/
├── app/
│   ├── app.js
│   └── server.js
├── controllers/
│   └── task.controller.js
├── database/
│   └── sequelize.js
├── dtos/
│   └── task.dto.js
├── middleware/
│   └── validate.middleware.js
├── models/
│   └── task.model.js
├── repositories/
│   └── task.repository.js
├── routes/
│   └── tasks.routes.js
├── serializers/
│   └── task/
│       ├── index.js
│       └── task.serializer.js
├── services/
│   └── task.service.js
└── validators/
    └── task.schema.js
```

---

# 30. Cómo decidir dónde colocar una regla

Pregunta:

```text
¿Comprueba la forma de una petición?
-> validator

¿Selecciona datos para una operación?
-> DTO

¿Es una regla de la aplicación?
-> service

¿Es una consulta o escritura persistente?
-> repository

¿Describe una tabla?
-> model

¿Selecciona campos de respuesta?
-> serializer

¿Decide un código HTTP?
-> controller
```

Ejemplos:

```text
"title debe ser string"
-> validator

"una tarea nueva empieza pendiente"
-> service

"buscar por clave primaria"
-> repository

"no devolver un futuro campo internalNotes"
-> serializer

"responder 404"
-> controller
```

---

# 31. Estrategia de depuración por capas

Cuando una petición falle:

```text
1. ¿El router ejecutó el middleware correcto?
2. ¿La validación aceptó o rechazó la entrada?
3. ¿El DTO contiene lo esperado?
4. ¿El servicio recibió datos limpios?
5. ¿El repositorio ejecutó la consulta correcta?
6. ¿El serializer devolvió la forma esperada?
7. ¿El controlador utilizó el estado HTTP correcto?
```

Añade temporalmente logs pequeños y concretos. Evita imprimir contraseñas, tokens o información sensible en futuros módulos.

---

# 32. Limitaciones que quedan visibles

Ahora la API está mejor protegida, pero todavía no podemos responder automáticamente a preguntas como:

```text
¿Qué forma pública promete la API?
¿Un serializer sigue cumpliendo esa forma?
¿Qué cuerpos y estados muestra la documentación?
¿Cómo detectamos un cambio incompatible?
```

Estas preguntas justifican contratos, pruebas y OpenAPI.

---

# 33. Ejercicios

1. Añade un filtro `title` que busque una coincidencia parcial.
2. Crea `taskSummary`, que devuelva `total`, `completed` y `pending`.
3. Comprueba que una propiedad no incluida en el DTO nunca llega al servicio.
4. Añade temporalmente un campo al modelo y verifica que el serializer no lo expone.
5. Crea una vista `taskRef` dentro de una respuesta de resumen.

---

# 34. Siguiente tutorial

En el siguiente tutorial añadiremos:

```text
Zod API contracts
-> pruebas de serializer
-> registro OpenAPI
-> Swagger fuera de producción
-> pruebas backend básicas
```

Los contratos verificarán y documentarán la salida que los serializers ya construyen.
