# Tutorial 4: Contratos Zod, OpenAPI y pruebas del backend

En el tutorial anterior construimos respuestas mediante serializers y validamos la entrada antes del controlador.

Ahora aparecen nuevas preguntas:

```text
¿Cómo comprobamos que el serializer sigue devolviendo la forma prometida?
¿Cómo documentamos los cuerpos, parámetros y respuestas?
¿Cómo detectamos cambios incompatibles antes de probar manualmente?
```

Separaremos cuatro responsabilidades:

```text
validator
└── valida una petición real de Express.

serializer
└── construye una respuesta real.

contract
└── define y verifica la forma pública.

OpenAPI registry
└── documenta rutas, estados y esquemas.
```

La implementación didáctica utilizará Zod como fuente de los esquemas y un registro OpenAPI explícito. No inferiremos los estados HTTP ni las reglas de seguridad automáticamente: esas decisiones pertenecen a cada ruta.

---

# 1. Cuándo se considera terminado

```text
Las respuestas públicas tienen contratos Zod.
Los serializers se prueban contra esos contratos.
Las peticiones reutilizan reglas compatibles con los validadores.
Las rutas y estados se registran explícitamente en OpenAPI.
Swagger está disponible fuera de producción.
Swagger no se monta en producción.
Existe un comando npm test.
Los cambios incompatibles en el serializer rompen una prueba.
GET, POST, PATCH y DELETE aparecen documentados.
```

---

# 2. Instalar únicamente las herramientas necesarias

Dentro de `backend`:

```powershell
npm install @asteasolutions/zod-to-openapi swagger-ui-express
npm install -D supertest
```

Utilizaremos el runner de pruebas incorporado en Node.js, por lo que no necesitamos instalar Jest.

Añade a `package.json`:

```json
"scripts": {
  "dev": "nodemon --watch src --ext js --exec node src/app/server.js",
  "start": "node src/app/server.js",
  "test": "node --test"
}
```

---

# PARTE I — CONTRATOS DE RESPUESTA

# 3. Crear una instancia de Zod ampliada para OpenAPI

Crea:

```text
backend/src/openapi/zod.js
```

```js
const { z } = require('zod')
const {
  extendZodWithOpenApi,
} = require('@asteasolutions/zod-to-openapi')

extendZodWithOpenApi(z)

module.exports = {
  z,
}
```

A partir de ahora, los contratos importarán `z` desde este archivo.

Los validadores existentes pueden seguir usando `require('zod')`, aunque en un proyecto mayor conviene centralizar reglas compartidas para evitar diferencias.

---

# 4. Crear contratos comunes

Crea:

```text
backend/src/contracts/common.contract.js
```

```js
const { z } = require('../openapi/zod')

const errorResponseContract = z
  .object({
    message: z.string(),
  })
  .strict()
  .openapi('ErrorResponse')

module.exports = {
  errorResponseContract,
}
```

Este contrato describe la forma mínima utilizada por nuestros errores públicos:

```json
{
  "message": "Descripción pública"
}
```

---

# 5. Crear el contrato público de tarea

Crea:

```text
backend/src/contracts/task.contract.js
```

```js
const { z } = require('../openapi/zod')

const taskPublicContract = z
  .object({
    id: z.number().int().positive(),
    title: z.string().min(1).max(255),
    done: z.boolean(),
    createdAt: z.union([
      z.date(),
      z.string().datetime(),
    ]),
    updatedAt: z.union([
      z.date(),
      z.string().datetime(),
    ]),
  })
  .strict()
  .openapi('TaskPublic')

const taskListContract = z
  .array(taskPublicContract)
  .openapi('TaskList')

module.exports = {
  taskPublicContract,
  taskListContract,
}
```

Aceptamos `Date` o texto ISO porque:

```text
Dentro del backend
-> Sequelize puede entregar Date.

Después de serializar a JSON
-> las fechas se convierten en texto ISO.
```

---

# 6. Crear contratos de petición

Amplía `task.contract.js`:

```js
const taskIdParamsContract = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .openapi('TaskIdParams')

const createTaskBodyContract = z
  .object({
    title: z.string().trim().min(1).max(255),
  })
  .strict()
  .openapi('CreateTaskBody')

const updateTaskBodyContract = z
  .object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .optional(),
    done: z.boolean().optional(),
  })
  .strict()
  .refine(
    (body) => Object.keys(body).length > 0,
    {
      message: 'Debe enviarse al menos un cambio',
    },
  )
  .openapi('UpdateTaskBody')

const listTasksQueryContract = z
  .object({
    done: z.enum(['true', 'false']).optional(),
  })
  .openapi('ListTasksQuery')
```

Exporta todos los contratos.

El contrato OpenAPI describe lo que envía el cliente. El middleware de validación puede transformar esos valores para la aplicación.

---

# 7. Crear un índice de contratos

Crea:

```text
backend/src/contracts/index.js
```

```js
const {
  errorResponseContract,
} = require('./common.contract')
const {
  taskPublicContract,
  taskListContract,
  taskIdParamsContract,
  createTaskBodyContract,
  updateTaskBodyContract,
  listTasksQueryContract,
} = require('./task.contract')

module.exports = {
  errorResponseContract,
  taskPublicContract,
  taskListContract,
  taskIdParamsContract,
  createTaskBodyContract,
  updateTaskBodyContract,
  listTasksQueryContract,
}
```

---

# PARTE II — PROBAR SERIALIZERS CONTRA CONTRATOS

# 8. Crear la estructura de pruebas

```text
backend/tests/
└── unit/
    └── contracts/
        └── task.contract.test.js
```

Crea el archivo:

```js
const test = require('node:test')
const assert = require('node:assert/strict')

const {
  taskPublic,
} = require('../../../src/serializers/task')
const {
  taskPublicContract,
} = require('../../../src/contracts')

test(
  'taskPublic produce una respuesta compatible',
  () => {
    const modelLike = {
      get() {
        return {
          id: 1,
          title: 'Probar contratos',
          done: false,
          createdAt: new Date(
            '2026-01-10T10:00:00.000Z',
          ),
          updatedAt: new Date(
            '2026-01-10T10:00:00.000Z',
          ),
          internalValue: 'no debe salir',
        }
      },
    }

    const serialized = taskPublic(modelLike)
    const parsed = taskPublicContract.parse(serialized)

    assert.equal(parsed.id, 1)
    assert.equal(parsed.title, 'Probar contratos')
    assert.equal(
      Object.hasOwn(parsed, 'internalValue'),
      false,
    )
  },
)
```

Ejecuta:

```powershell
npm test
```

---

# 9. Provocar un fallo útil

Modifica temporalmente el serializer:

```js
return {
  id: value.id,
  title: value.title,
}
```

La prueba debe fallar porque faltan `done`, `createdAt` y `updatedAt`.

Esto convierte un cambio accidental en una señal visible antes de desplegar o probar manualmente.

Restaura el serializer.

---

# 10. Probar que el contrato rechaza campos inesperados

Añade otra prueba:

```js
test(
  'TaskPublic no admite campos públicos inesperados',
  () => {
    const result = taskPublicContract.safeParse({
      id: 1,
      title: 'Tarea',
      done: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      password: 'no debería existir',
    })

    assert.equal(result.success, false)
  },
)
```

El uso de `.strict()` ayuda a detectar ampliaciones accidentales.

Cuando una API necesite realmente un nuevo campo, se actualizarán de forma consciente:

```text
serializer
contract
pruebas
documentación
cliente si corresponde
```

---

# PARTE III — GENERAR EL DOCUMENTO OPENAPI

# 11. Crear el registro

Crea:

```text
backend/src/openapi/registry.js
```

```js
const {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} = require('@asteasolutions/zod-to-openapi')

const {
  errorResponseContract,
  taskPublicContract,
  taskListContract,
  taskIdParamsContract,
  createTaskBodyContract,
  updateTaskBodyContract,
  listTasksQueryContract,
} = require('../contracts')

const registry = new OpenAPIRegistry()

registry.register('ErrorResponse', errorResponseContract)
registry.register('TaskPublic', taskPublicContract)
registry.register('TaskList', taskListContract)
registry.register(
  'TaskIdParams',
  taskIdParamsContract,
)
registry.register(
  'CreateTaskBody',
  createTaskBodyContract,
)
registry.register(
  'UpdateTaskBody',
  updateTaskBodyContract,
)
registry.register(
  'ListTasksQuery',
  listTasksQueryContract,
)
```

Todavía no hemos registrado rutas.

---

# 12. Registrar `GET /api/tasks`

Añade:

```js
registry.registerPath({
  method: 'get',
  path: '/api/tasks',
  tags: ['Tasks'],
  summary: 'Obtener todas las tareas',
  request: {
    query: listTasksQueryContract,
  },
  responses: {
    200: {
      description: 'Lista de tareas',
      content: {
        'application/json': {
          schema: taskListContract,
        },
      },
    },
    400: {
      description: 'Consulta no válida',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    500: {
      description: 'Error interno',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
  },
})
```

Zod define la forma. El registro define el comportamiento HTTP documentado.

---

# 13. Registrar `GET /api/tasks/{id}`

```js
registry.registerPath({
  method: 'get',
  path: '/api/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Obtener una tarea por ID',
  request: {
    params: taskIdParamsContract,
  },
  responses: {
    200: {
      description: 'Tarea encontrada',
      content: {
        'application/json': {
          schema: taskPublicContract,
        },
      },
    },
    400: {
      description: 'Identificador no válido',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    404: {
      description: 'Tarea no encontrada',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    500: {
      description: 'Error interno',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
  },
})
```

En OpenAPI se utiliza `{id}`, aunque Express declare `/:id`.

---

# 14. Registrar `POST /api/tasks`

```js
registry.registerPath({
  method: 'post',
  path: '/api/tasks',
  tags: ['Tasks'],
  summary: 'Crear una tarea',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: createTaskBodyContract,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Tarea creada',
      content: {
        'application/json': {
          schema: taskPublicContract,
        },
      },
    },
    400: {
      description: 'Datos no válidos',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    500: {
      description: 'Error interno',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
  },
})
```

---

# 15. Registrar `PATCH` y `DELETE`

Añade rutas equivalentes:

```js
registry.registerPath({
  method: 'patch',
  path: '/api/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Modificar parcialmente una tarea',
  request: {
    params: taskIdParamsContract,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: updateTaskBodyContract,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Tarea actualizada',
      content: {
        'application/json': {
          schema: taskPublicContract,
        },
      },
    },
    400: {
      description: 'Datos no válidos',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    404: {
      description: 'Tarea no encontrada',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    500: {
      description: 'Error interno',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
  },
})

registry.registerPath({
  method: 'delete',
  path: '/api/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Eliminar una tarea',
  request: {
    params: taskIdParamsContract,
  },
  responses: {
    204: {
      description: 'Tarea eliminada',
    },
    400: {
      description: 'Identificador no válido',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    404: {
      description: 'Tarea no encontrada',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    500: {
      description: 'Error interno',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
  },
})
```

---

# 16. Generar el documento

Al final de `registry.js`:

```js
function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(
    registry.definitions,
  )

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Tasks API',
      version: '1.0.0',
      description:
        'API de aprendizaje para gestionar tareas.',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Desarrollo local',
      },
    ],
  })
}

module.exports = {
  registry,
  generateOpenApiDocument,
}
```

---

# PARTE IV — MOSTRAR SWAGGER FUERA DE PRODUCCIÓN

# 17. Crear la configuración de Swagger

Crea:

```text
backend/src/config/swagger.config.js
```

```js
const swaggerUi = require('swagger-ui-express')
const {
  generateOpenApiDocument,
} = require('../openapi/registry')

function registerSwagger(app) {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  const document = generateOpenApiDocument()

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(document),
  )
}

module.exports = {
  registerSwagger,
}
```

---

# 18. Registrar Swagger en Express

En `src/app/app.js` importa:

```js
const {
  registerSwagger,
} = require('../config/swagger.config')
```

Después del middleware básico y antes de las rutas:

```js
app.use(express.json())

registerSwagger(app)

app.get('/api/health', ...)
app.use('/api/tasks', tasksRouter)
```

Arranca el backend y abre:

```text
http://localhost:3001/api-docs
```

Comprueba que aparecen las cinco operaciones.

---

# 19. Comprobar que no se monta en producción

Ejecuta temporalmente:

```powershell
$env:NODE_ENV="production"
npm start
```

En esa ejecución `/api-docs` no debe estar disponible.

En una nueva terminal, o después de eliminar la variable temporal, vuelve al entorno de desarrollo.

---

# PARTE V — PRUEBAS DE RUTAS

# 20. Por qué utilizar Supertest

Postman permite pruebas manuales. Supertest permite describir expectativas repetibles:

```text
Enviar una petición a Express.
-> comprobar estado.
-> comprobar cabecera.
-> comprobar cuerpo.
```

Para evitar que una prueba borre datos de desarrollo, prepararemos una base de datos de prueba separada antes de ampliar esta parte en un proyecto real.

En este tutorial comenzaremos por rutas que no necesitan modificar PostgreSQL: salud y validación rechazada.

---

# 21. Evitar que `app.js` abra un puerto

La separación existente ya ayuda:

```text
app.js
└── configura Express.

server.js
└── conecta la base y abre el puerto.
```

Supertest puede importar `app` sin ejecutar `listen`.

---

# 22. Probar la ruta de salud

Crea:

```text
backend/tests/integration/health.routes.test.js
```

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const app = require('../../src/app/app')

test('GET /api/health responde 200', async () => {
  const response = await request(app)
    .get('/api/health')
    .expect('Content-Type', /json/)
    .expect(200)

  assert.equal(response.body.status, 'ok')
})
```

---

# 23. Probar validación sin consultar la base

Crea:

```text
backend/tests/integration/task.validation.test.js
```

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const app = require('../../src/app/app')

test(
  'POST /api/tasks rechaza un título vacío',
  async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: '   ' })
      .expect('Content-Type', /json/)
      .expect(400)

    assert.equal(
      response.body.message,
      'Bad request. There is an issue with the provided data.',
    )
  },
)
```

La petición termina en el middleware y no llega al repositorio.

---

# 24. Probar el documento OpenAPI

Crea:

```text
backend/tests/unit/openapi/openapi.test.js
```

```js
const test = require('node:test')
const assert = require('node:assert/strict')

const {
  generateOpenApiDocument,
} = require('../../../src/openapi/registry')

test('OpenAPI contiene las rutas de tareas', () => {
  const document = generateOpenApiDocument()

  assert.ok(document.paths['/api/tasks'])
  assert.ok(document.paths['/api/tasks/{id}'])
  assert.ok(
    document.paths['/api/tasks'].get,
  )
  assert.ok(
    document.paths['/api/tasks'].post,
  )
})
```

---

# 25. Qué falta para pruebas completas con PostgreSQL

Para probar operaciones reales de creación y borrado necesitaremos:

- Una base de datos de prueba.
- Variables de prueba.
- Preparar datos antes de cada grupo.
- Limpiar los cambios después.
- Evitar utilizar la base de desarrollo.

Ese trabajo puede añadirse cuando el proyecto necesite pruebas de integración de base de datos. No es correcto ejecutar pruebas destructivas contra `tasks_db` sin aislamiento.

---

# 26. Flujo completo de responsabilidades

```text
Petición real
-> validator
-> controller
-> DTO
-> service
-> repository
-> model
-> serializer
-> respuesta

Prueba de contrato
-> serializer
-> Zod contract

Documentación
-> Zod contract
-> OpenAPI registry
-> Swagger UI
```

Los contratos no reemplazan serializers:

```text
serializer
└── construye.

contract
└── verifica y documenta.
```

---

# 27. Regla para cambiar una respuesta pública

Cuando quieras añadir un campo:

```text
1. Decide si debe ser público.
2. Actualiza el serializer adecuado.
3. Actualiza el contrato correspondiente.
4. Actualiza las pruebas.
5. Actualiza OpenAPI si cambia el comportamiento.
6. Comprueba el frontend consumidor.
```

Evita cambiar una vista existente si otros endpoints dependen de ella. Puede ser preferible crear otra vista:

```text
taskPublic
taskAdmin
taskRef
```

---

# 28. Estructura añadida

```text
backend/
├── src/
│   ├── config/
│   │   └── swagger.config.js
│   ├── contracts/
│   │   ├── common.contract.js
│   │   ├── index.js
│   │   └── task.contract.js
│   └── openapi/
│       ├── registry.js
│       └── zod.js
└── tests/
    ├── integration/
    │   ├── health.routes.test.js
    │   └── task.validation.test.js
    └── unit/
        ├── contracts/
        │   └── task.contract.test.js
        └── openapi/
            └── openapi.test.js
```

---

# 29. Ejercicios

1. Añade ejemplos OpenAPI a los contratos.
2. Documenta la respuesta `404` de una tarea inexistente.
3. Crea una prueba para `taskRef`.
4. Añade un contrato para un resumen de tareas.
5. Provoca un cambio incompatible en el serializer y observa qué prueba lo detecta.
6. Prepara una base `tasks_test` y una primera prueba de integración aislada.

---

# 30. Siguiente tutorial

El backend de tareas ya tiene una arquitectura completa para su nivel actual.

En el siguiente tutorial volveremos al frontend y mejoraremos primero su sistema visual:

```text
PrimeVue sin estilos
-> componentes base
-> tokens SCSS
-> ITCSS
-> estados visuales
-> playground
-> sustitución progresiva de HTML nativo
```

La lógica seguirá funcionando mientras cambiamos la presentación.
