# Tutorial 2: PostgreSQL + Sequelize + arquitectura backend por capas

Partimos de la aplicación de tareas construida en el tutorial anterior.

Hasta ahora, Express guarda las tareas en un array:

```text
Express
  -> variable tasks
  -> datos en memoria
```

Eso nos permitió aprender HTTP, Axios y CORS sin introducir más piezas. Ahora sustituiremos ese array por PostgreSQL y reorganizaremos el backend progresivamente:

```text
route
  -> controller
    -> service
      -> repository
        -> model
          -> PostgreSQL
```

No añadiremos todavía validadores Zod, DTO, serializers, contratos ni OpenAPI. Primero necesitamos comprender las capas fundamentales y distinguir con claridad qué responsabilidad tiene cada una.

---

# 1. Cuándo se considera terminado

El tutorial estará completado cuando:

```text
La tabla tasks se ha diseñado antes de crearla.
DBML documenta visualmente su estructura.
El SQL de inicialización crea la tabla.
Docker levanta PostgreSQL y crea la base inicial.
El volumen conserva los datos.
PgAdmin permite inspeccionar la estructura y las filas.
Sequelize conecta sin crear ni sincronizar tablas.
El modelo representa la tabla existente.
El repositorio concentra el acceso a PostgreSQL.
El servicio concentra las operaciones de la aplicación.
El controlador gestiona HTTP.
GET, POST, PATCH y DELETE recorren todas las capas.
Los datos sobreviven al reinicio del backend y del contenedor.
El frontend anterior continúa funcionando.
```

---

# 2. Qué dejamos para los siguientes tutoriales

En este tutorial no utilizaremos:

- `sequelize.sync()`.
- Migraciones.
- Validación con Zod.
- DTO.
- Serializers.
- Contratos de API.
- OpenAPI o Swagger.
- Autenticación.

No se omiten porque no sean importantes. Se aplazan para poder observar primero un recorrido más corto:

```text
petición HTTP
  -> controlador
  -> servicio
  -> repositorio
  -> modelo
  -> base de datos
```

---

# PARTE I — ENTENDER LA PERSISTENCIA

# 3. Qué problema tiene el array en memoria

En el backend actual tenemos algo parecido a:

```js
let tasks = [
  {
    id: 1,
    title: 'Entender qué es una API',
    done: true,
  },
]
```

Ese array pertenece al proceso de Node.js.

Cuando el proceso termina:

```text
Se detiene Express.
-> desaparece la memoria del proceso.
-> desaparecen las tareas creadas durante la ejecución.
```

Una base de datos permite separar la vida de los datos de la vida del backend:

```text
Express puede detenerse.
PostgreSQL conserva las filas.
Express vuelve a arrancar.
Sequelize consulta las mismas filas.
```

---

# 4. Base de datos, tabla, fila y columna

Utilizaremos una base de datos llamada:

```text
tasks_db
```

Dentro tendrá una tabla:

```text
tasks
```

Una representación simplificada sería:

| id | title | done |
|---:|---|---|
| 1 | Entender qué es una API | true |
| 2 | Conectar Express con PostgreSQL | false |

Conceptos:

```text
Base de datos
└── Conjunto organizado de objetos y datos.

Tabla
└── Estructura que agrupa filas del mismo tipo.

Fila
└── Un registro concreto; en este caso, una tarea.

Columna
└── Una propiedad del registro: id, title o done.
```

---

# PARTE II — DISEÑAR LA TABLA ANTES DE CREARLA

# 5. Crear el diseño DBML

En la carpeta principal crea:

```text
database.dbml
```

Contenido:

```dbml
Table tasks {
  id integer [pk, increment]
  title varchar(255) [not null]
  done boolean [not null, default: false]
  created_at timestamptz [not null]
  updated_at timestamptz [not null]
}
```

DBML no crea todavía nada en PostgreSQL. Sirve para representar y documentar la estructura.

---

# 6. Interpretar cada decisión del diseño

## `id`

```dbml
id integer [pk, increment]
```

- `integer`: el identificador es numérico.
- `pk`: es la clave primaria.
- `increment`: PostgreSQL generará el siguiente valor.

La clave primaria identifica cada fila de forma única.

## `title`

```dbml
title varchar(255) [not null]
```

- Almacena texto con un máximo de 255 caracteres.
- `not null` impide guardar una tarea sin título.

## `done`

```dbml
done boolean [not null, default: false]
```

- Solo admite `true` o `false`.
- Su valor inicial será `false`.

## Fechas

```dbml
created_at timestamptz [not null]
updated_at timestamptz [not null]
```

- `created_at` registra cuándo se creó la fila.
- `updated_at` registra cuándo se modificó por última vez.
- `timestamptz` permite trabajar con fecha, hora y zona temporal.

---

# 7. Diferenciar DBML, SQL y Sequelize

Durante el tutorial utilizaremos tres representaciones de la misma tabla:

```text
DBML
└── Documenta y permite visualizar el diseño.

SQL
└── Crea realmente la tabla en PostgreSQL.

Modelo Sequelize
└── Mapea la tabla para utilizarla desde JavaScript.
```

No confiaremos ciegamente en una exportación automática. Aunque una herramienta genere SQL desde DBML, revisaremos el resultado línea por línea.

---

# 8. Escribir el SQL equivalente

Crea en la raíz:

```text
init/01_create_tasks.sql
```

Contenido:

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tasks (title, done)
VALUES
  ('Entender qué es una API', TRUE),
  ('Conectar Express con PostgreSQL', FALSE);
```

Las dos filas finales permiten probar el primer `GET` sin tener que insertar datos manualmente.

---

# 9. Revisar el SQL línea por línea

## Crear la tabla solo si no existe

```sql
CREATE TABLE IF NOT EXISTS tasks (
```

`IF NOT EXISTS` evita un error si la tabla ya existe durante una ejecución manual del archivo.

No significa que el script de inicialización se ejecute en todos los arranques. Veremos esa diferencia al estudiar el volumen.

## Identificador automático

```sql
id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
```

PostgreSQL genera el identificador cuando insertamos una tarea sin proporcionar `id`.

## Restricciones

```sql
title VARCHAR(255) NOT NULL,
done BOOLEAN NOT NULL DEFAULT FALSE,
```

La base de datos protege reglas estructurales aunque el frontend o el backend cometan un error.

## Fechas predeterminadas

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
```

PostgreSQL asigna una fecha inicial. Más adelante, Sequelize enviará un nuevo `updated_at` cuando actualicemos un modelo.

## Datos iniciales

```sql
INSERT INTO tasks (title, done)
VALUES ...
```

Estas filas son datos de demostración, no una técnica general de migración.

---

# PARTE III — LEVANTAR POSTGRESQL CON DOCKER

# 10. Crear las variables del contenedor

En la raíz del proyecto crea o amplía:

```text
.env
```

Contenido para PostgreSQL:

```env
POSTGRES_DB=tasks_db
POSTGRES_USER=tasks_user
POSTGRES_PASSWORD=tasks_password
POSTGRES_PORT=5432
```

Crea también:

```text
.env.example
```

con los mismos nombres y valores de aprendizaje.

En un proyecto real, la contraseña no debe conservarse en el repositorio.

---

# 11. Crear `docker-compose.db.yml`

En la raíz crea:

```text
docker-compose.db.yml
```

```yaml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test:
        - CMD-SHELL
        - pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
```

En este tutorial ejecutaremos PostgreSQL en Docker y mantendremos Nuxt y Express mediante `npm run dev`. Así podremos centrarnos en una sola novedad.

---

# 12. Entender qué crea cada elemento

Las variables:

```text
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
```

se utilizan durante la primera inicialización para crear:

- La base `tasks_db`.
- El usuario `tasks_user`.
- Su contraseña.

El montaje:

```yaml
- ./init:/docker-entrypoint-initdb.d:ro
```

hace que PostgreSQL encuentre `01_create_tasks.sql` durante esa primera inicialización.

El volumen:

```yaml
- postgres_data:/var/lib/postgresql/data
```

conserva los archivos reales de PostgreSQL fuera del ciclo de vida del contenedor.

---

# 13. Levantar la base de datos

Ejecuta desde la raíz:

```powershell
docker compose -f docker-compose.db.yml up -d
```

Comprueba el estado:

```powershell
docker compose -f docker-compose.db.yml ps
```

Revisa los logs:

```powershell
docker compose -f docker-compose.db.yml logs --tail=200 db
```

Busca mensajes que indiquen que PostgreSQL está preparado para aceptar conexiones.

---

# 14. Comprender cuándo se ejecuta `init.sql`

Los scripts de `/docker-entrypoint-initdb.d` se ejecutan únicamente cuando el directorio de datos está vacío.

```text
Primer arranque con un volumen nuevo
-> crea la base.
-> crea el usuario.
-> ejecuta 01_create_tasks.sql.

Reinicio normal
-> reutiliza el volumen.
-> no vuelve a ejecutar 01_create_tasks.sql.
```

Prueba:

```powershell
docker compose -f docker-compose.db.yml down
docker compose -f docker-compose.db.yml up -d
```

Los datos siguen existiendo porque no hemos eliminado el volumen.

Para reinicializar completamente el ejercicio:

```powershell
docker compose -f docker-compose.db.yml down -v
docker compose -f docker-compose.db.yml up -d
```

`-v` elimina el volumen y, por tanto, sus datos.

---

# 15. Inspeccionar la base con pgAdmin

PgAdmin será una herramienta de observación. No lo utilizaremos para crear manualmente una estructura distinta a la documentada.

Crea una conexión con:

```text
Host: localhost
Port: 5432
Maintenance database: tasks_db
Username: tasks_user
Password: tasks_password
```

Busca:

```text
Servers
  -> tasks_db
    -> Databases
      -> tasks_db
        -> Schemas
          -> public
            -> Tables
              -> tasks
```

Abre el Query Tool y ejecuta:

```sql
SELECT *
FROM tasks
ORDER BY id;
```

También puedes revisar las columnas:

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
```

Compara el resultado con `database.dbml` y `01_create_tasks.sql`.

---

# PARTE IV — CONECTAR EXPRESS CON POSTGRESQL

# 16. Necesitamos un cliente para PostgreSQL

Express todavía no sabe conectarse a PostgreSQL.

Dentro de `backend` instala Sequelize y el driver:

```powershell
npm install sequelize pg
```

Responsabilidades:

```text
pg
└── Driver que permite a Node comunicarse con PostgreSQL.

Sequelize
└── ORM que representa tablas mediante modelos y construye consultas.
```

No instalamos estos paquetes antes porque todavía no teníamos una base de datos que utilizar.

---

# 17. Añadir las variables del backend

Amplía:

```text
backend/.env.example
```

```env
PORT=3001
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tasks_db
DB_USER=tasks_user
DB_PASSWORD=tasks_password
DB_LOGGING=false
```

Copia los cambios a `backend/.env`.

Como Express se ejecuta directamente en tu ordenador, utiliza:

```env
DB_HOST=localhost
```

El nombre `db` solo sería resoluble desde otro contenedor de la misma red de Compose.

---

# 18. Crear la conexión de Sequelize

Crea:

```text
backend/src/database/sequelize.js
```

```js
const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging:
      process.env.DB_LOGGING === 'true'
        ? console.log
        : false,
  },
)

async function connectDatabase() {
  await sequelize.authenticate()
  console.log('Conexión con PostgreSQL establecida')
}

module.exports = {
  sequelize,
  connectDatabase,
}
```

`authenticate()` comprueba la conexión. No crea ni modifica tablas.

---

# 19. Reorganizar el arranque del backend

Crea la carpeta:

```text
backend/src/app/
```

Mueve:

```text
backend/src/app.js
-> backend/src/app/app.js

backend/src/server.js
-> backend/src/app/server.js
```

Actualiza el script de `package.json`:

```json
"scripts": {
  "dev": "nodemon --watch src --ext js --exec node src/app/server.js",
  "start": "node src/app/server.js"
}
```

En `src/app/app.js`, ajusta la ruta del router:

```js
const tasksRouter = require('../routes/tasks.routes')
```

Ahora modifica `src/app/server.js`:

```js
require('dotenv').config()

const app = require('./app')
const {
  connectDatabase,
} = require('../database/sequelize')

const PORT = Number(process.env.PORT) || 3001

async function startServer() {
  await connectDatabase()

  app.listen(PORT, () => {
    console.log(
      `Backend disponible en http://localhost:${PORT}`,
    )
  })
}

startServer().catch((error) => {
  console.error('No se ha podido iniciar el backend')
  console.error(error)
  process.exit(1)
})
```

El orden es ahora:

```text
Cargar variables.
-> comprobar PostgreSQL.
-> abrir el puerto HTTP.
```

---

# 20. Comprobar la conexión antes de crear el modelo

Con PostgreSQL levantado, ejecuta:

```powershell
cd backend
npm run dev
```

Deberías ver:

```text
Conexión con PostgreSQL establecida
Backend disponible en http://localhost:3001
```

Apaga PostgreSQL y observa el error:

```powershell
docker compose -f docker-compose.db.yml stop db
```

El backend no debe fingir que está preparado si no puede acceder a su dependencia principal.

Vuelve a levantarlo:

```powershell
docker compose -f docker-compose.db.yml start db
```

---

# PARTE V — MODELO, REPOSITORIO, SERVICIO Y CONTROLADOR

# 21. Crear el modelo `Task`

Crea:

```text
backend/src/models/task.model.js
```

```js
const { DataTypes } = require('sequelize')
const {
  sequelize,
} = require('../database/sequelize')

const Task = sequelize.define(
  'Task',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    done: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'tasks',
    timestamps: true,
    underscored: true,
  },
)

module.exports = Task
```

El modelo no crea la tabla. Describe cómo mapearla.

```text
Propiedad JavaScript: createdAt
Columna PostgreSQL:   created_at
```

`underscored: true` realiza ese mapeo.

---

# 22. Diferencia entre modelo y repositorio

El modelo conoce:

- La tabla.
- Las columnas.
- Los tipos.
- El mapeo entre JavaScript y SQL.

El repositorio conocerá:

- Qué consultas necesita la aplicación.
- Cómo buscar una tarea.
- Cómo insertar, actualizar o eliminar filas.

```text
modelo
└── representa la estructura persistente.

repositorio
└── concentra el acceso a esa estructura.
```

---

# 23. Implementar `GET /api/tasks` de extremo a extremo

Empezaremos por una sola operación completa.

## Repositorio

Crea:

```text
backend/src/repositories/task.repository.js
```

```js
const Task = require('../models/task.model')

async function findAll() {
  return Task.findAll({
    order: [['id', 'ASC']],
  })
}

module.exports = {
  findAll,
}
```

## Servicio

Crea:

```text
backend/src/services/task.service.js
```

```js
const taskRepository = require(
  '../repositories/task.repository'
)

async function getTasks() {
  return taskRepository.findAll()
}

module.exports = {
  getTasks,
}
```

Por ahora el servicio es pequeño. Su utilidad aumentará cuando incorporemos reglas y coordinación.

## Controlador

Crea:

```text
backend/src/controllers/task.controller.js
```

```js
const taskService = require('../services/task.service')

async function getTasks(req, res) {
  try {
    const tasks = await taskService.getTasks()
    return res.json(tasks)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se han podido obtener las tareas',
    })
  }
}

module.exports = {
  getTasks,
}
```

El controlador conoce `req`, `res` y los códigos HTTP. El servicio no.

## Ruta

Sustituye temporalmente el contenido de `tasks.routes.js` por:

```js
const express = require('express')
const taskController = require(
  '../controllers/task.controller'
)

const router = express.Router()

router.get('/', taskController.getTasks)

module.exports = router
```

Prueba:

```text
GET http://localhost:3001/api/tasks
```

Después abre el frontend. La lista debería continuar funcionando.

---

# 24. Añadir `GET /api/tasks/:id`

## Repositorio

Añade:

```js
async function findById(id) {
  return Task.findByPk(id)
}
```

Exporta `findById`.

## Servicio

Añade:

```js
async function getTaskById(id) {
  return taskRepository.findById(id)
}
```

Exporta la función.

## Controlador

Añade:

```js
async function getTaskById(req, res) {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El identificador no es válido',
    })
  }

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

Exporta `getTaskById`.

## Ruta

```js
router.get('/:id', taskController.getTaskById)
```

Prueba un identificador existente, uno inexistente y uno no numérico.

La validación sigue dentro del controlador. En el siguiente tutorial la moveremos a middleware especializado.

---

# 25. Añadir `POST /api/tasks`

## Repositorio

```js
async function create(values) {
  return Task.create(values)
}
```

## Servicio

```js
async function createTask(values) {
  return taskRepository.create({
    title: values.title,
    done: false,
  })
}
```

El servicio decide que una tarea nueva comienza pendiente.

## Controlador

```js
async function createTask(req, res) {
  const rawTitle = req.body?.title
  const title =
    typeof rawTitle === 'string'
      ? rawTitle.trim()
      : ''

  if (!title) {
    return res.status(400).json({
      message: 'El título de la tarea es obligatorio',
    })
  }

  if (title.length > 255) {
    return res.status(400).json({
      message: 'El título no puede superar 255 caracteres',
    })
  }

  try {
    const task = await taskService.createTask({ title })
    return res.status(201).json(task)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido crear la tarea',
    })
  }
}
```

## Ruta

```js
router.post('/', taskController.createTask)
```

Prueba desde Postman y desde el formulario del frontend.

Después consulta con pgAdmin:

```sql
SELECT * FROM tasks ORDER BY id;
```

El identificador procede de PostgreSQL, no del frontend.

---

# 26. Añadir `PATCH /api/tasks/:id`

Permitiremos modificar `title`, `done` o ambos.

## Repositorio

```js
async function updateById(id, changes) {
  const task = await findById(id)

  if (!task) {
    return null
  }

  await task.update(changes)
  return task
}
```

## Servicio

```js
async function updateTask(id, changes) {
  return taskRepository.updateById(id, changes)
}
```

## Controlador

```js
async function updateTask(req, res) {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El identificador no es válido',
    })
  }

  const changes = {}

  if (Object.hasOwn(req.body, 'title')) {
    const title =
      typeof req.body.title === 'string'
        ? req.body.title.trim()
        : ''

    if (!title || title.length > 255) {
      return res.status(400).json({
        message: 'El título no es válido',
      })
    }

    changes.title = title
  }

  if (Object.hasOwn(req.body, 'done')) {
    if (typeof req.body.done !== 'boolean') {
      return res.status(400).json({
        message: 'done debe ser true o false',
      })
    }

    changes.done = req.body.done
  }

  if (Object.keys(changes).length === 0) {
    return res.status(400).json({
      message: 'No se ha enviado ningún cambio válido',
    })
  }

  try {
    const task = await taskService.updateTask(
      id,
      changes,
    )

    if (!task) {
      return res.status(404).json({
        message: 'No se ha encontrado la tarea',
      })
    }

    return res.json(task)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido actualizar la tarea',
    })
  }
}
```

## Ruta

```js
router.patch('/:id', taskController.updateTask)
```

El frontend anterior envía únicamente `done`, por lo que seguirá funcionando.

---

# 27. Añadir `DELETE /api/tasks/:id`

## Repositorio

```js
async function deleteById(id) {
  const deletedRows = await Task.destroy({
    where: { id },
  })

  return deletedRows > 0
}
```

## Servicio

```js
async function deleteTask(id) {
  return taskRepository.deleteById(id)
}
```

## Controlador

```js
async function deleteTask(req, res) {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El identificador no es válido',
    })
  }

  try {
    const deleted = await taskService.deleteTask(id)

    if (!deleted) {
      return res.status(404).json({
        message: 'No se ha encontrado la tarea',
      })
    }

    return res.status(204).send()
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido eliminar la tarea',
    })
  }
}
```

## Ruta

```js
router.delete('/:id', taskController.deleteTask)
```

Prueba primero con Postman y después desde el frontend.

---

# 28. Revisar los archivos completos de cada capa

## Repositorio

```js
const Task = require('../models/task.model')

async function findAll() {
  return Task.findAll({
    order: [['id', 'ASC']],
  })
}

async function findById(id) {
  return Task.findByPk(id)
}

async function create(values) {
  return Task.create(values)
}

async function updateById(id, changes) {
  const task = await findById(id)

  if (!task) {
    return null
  }

  await task.update(changes)
  return task
}

async function deleteById(id) {
  const deletedRows = await Task.destroy({
    where: { id },
  })

  return deletedRows > 0
}

module.exports = {
  findAll,
  findById,
  create,
  updateById,
  deleteById,
}
```

## Servicio

```js
const taskRepository = require(
  '../repositories/task.repository'
)

async function getTasks() {
  return taskRepository.findAll()
}

async function getTaskById(id) {
  return taskRepository.findById(id)
}

async function createTask(values) {
  return taskRepository.create({
    title: values.title,
    done: false,
  })
}

async function updateTask(id, changes) {
  return taskRepository.updateById(id, changes)
}

async function deleteTask(id) {
  return taskRepository.deleteById(id)
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
}
```

## Router

```js
const express = require('express')
const taskController = require(
  '../controllers/task.controller'
)

const router = express.Router()

router.get('/', taskController.getTasks)
router.get('/:id', taskController.getTaskById)
router.post('/', taskController.createTask)
router.patch('/:id', taskController.updateTask)
router.delete('/:id', taskController.deleteTask)

module.exports = router
```

El controlador completo puede reconstruirse uniendo las funciones explicadas. Evita copiarlo sin revisar el recorrido de cada operación.

---

# 29. Comprobar la persistencia

Crea una tarea desde el frontend.

Después reinicia Express:

```powershell
Ctrl + C
npm run dev
```

La tarea continúa en PostgreSQL.

Reinicia el contenedor sin borrar el volumen:

```powershell
docker compose -f docker-compose.db.yml restart db
```

Cuando PostgreSQL vuelva a estar disponible, reinicia el backend si fuera necesario. La tarea debe continuar existiendo.

Comprueba también desde pgAdmin.

---

# 30. Estrategia de depuración con base de datos

Cuando una operación falle, revisa en este orden:

```text
1. Terminal de Express.
2. Logs del contenedor PostgreSQL.
3. Network y Console del navegador.
4. Petición equivalente en Postman.
5. Consulta directa en pgAdmin.
```

Preguntas útiles:

```text
¿PostgreSQL está healthy?
¿Sequelize ha mostrado el mensaje de conexión?
¿La petición ha llegado al controlador?
¿El servicio ha llamado al repositorio?
¿La consulta ha modificado alguna fila?
¿El controlador ha enviado la respuesta esperada?
```

Puedes activar temporalmente:

```env
DB_LOGGING=true
```

para observar el SQL generado por Sequelize. No lo mantengas activado sin necesidad porque produce mucho ruido.

---

# 31. Qué limitaciones conserva el módulo

La arquitectura ya está separada, pero todavía existen problemas deliberados:

```text
El controlador valida manualmente body y params.
El controlador construye objetos de entrada a mano.
La API devuelve modelos Sequelize directamente.
Los mensajes de validación no están centralizados.
No existe un contrato comprobable de respuesta.
```

Estas limitaciones motivan el siguiente tutorial.

---

# 32. Resumen de responsabilidades

```text
Route
└── Relaciona método y URL con un controlador.

Controller
└── Conoce HTTP: req, res, estados y respuesta.

Service
└── Coordina las operaciones de la aplicación.

Repository
└── Concentra las consultas y modificaciones persistentes.

Model
└── Mapea la tabla de PostgreSQL a JavaScript.

PostgreSQL
└── Conserva y protege los datos.
```

Flujo de creación:

```text
POST /api/tasks
-> taskController.createTask
-> taskService.createTask
-> taskRepository.create
-> Task.create
-> INSERT en PostgreSQL
-> modelo creado
-> respuesta 201
```

---

# 33. Ejercicios

1. Añade una consulta `GET /api/tasks?done=true` sin cambiar todavía la arquitectura general.
2. Ordena las tareas por fecha de creación descendente.
3. Comprueba qué error aparece si intentas insertar manualmente un título `NULL`.
4. Cambia temporalmente el nombre de la tabla en el modelo y analiza el error.
5. Añade un método del repositorio para contar tareas pendientes.

---

# 34. Siguiente tutorial

En el siguiente tutorial ampliaremos el recorrido:

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

Lo haremos sobre este mismo CRUD, sin añadir todavía contratos ni OpenAPI.
