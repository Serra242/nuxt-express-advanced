# Tutorial: Nuxt 4 + Express + Axios desde cero

Vamos a construir una **miniaplicación de tareas** con esta arquitectura:

```text
Navegador
   │
   │ Peticiones HTTP con Axios
   ▼
Frontend Nuxt 4 :3000
   │
   │ GET, POST, PATCH y DELETE
   ▼
Backend Express :3001
   │
   ▼
Datos guardados temporalmente en memoria
```

Aunque Nuxt también permite crear endpoints de backend mediante Nitro, usaremos un servidor Express separado. Así será más sencillo distinguir:

- Qué parte pertenece al frontend.
- Qué parte pertenece al backend.
- Qué información envía cada uno.
- Cómo se conectan mediante HTTP.

El tutorial está pensado para alguien que tiene fundamentos de programación, ha visto conceptos de redes y arquitectura y ha realizado prácticas básicas con Vue o Nuxt, pero todavía no ha desarrollado apenas APIs.

No utilizaremos una base de datos al principio. Las tareas se guardarán en memoria y desaparecerán cuando se reinicie Express. Es una decisión intencionada para estudiar primero la comunicación frontend-backend.

---

# 1. Qué vas a practicar

Al terminar tendrás una aplicación que permite:

- Consultar tareas con `GET`.
- Crear tareas con `POST`.
- Marcar tareas como completadas con `PATCH`.
- Eliminar tareas con `DELETE`.
- Enviar y recibir JSON.
- Probar una API desde el navegador y Postman.
- Reconocer qué representa un comando `curl`.
- Comprender qué hacen Axios, Express y CORS.
- Utilizar variables de entorno.
- Ejecutar opcionalmente todo con Docker Compose.

También practicarás un proceso habitual en desarrollo:

```text
1. Ejecutar el proyecto.
2. Revisar los mensajes de la terminal, la consola y Network.
3. Localizar si el problema está en el frontend, la comunicación o el backend.
4. Entender qué significa el primer error relevante.
5. Instalar, corregir o configurar lo necesario.
6. Comprobar qué archivos han cambiado.
7. Verificar que el problema se ha solucionado.
```

No instalaremos paquetes sin explicar para qué sirven.

---

# 2. Conceptos fundamentales

## Frontend

Es la aplicación que ve y utiliza una persona desde el navegador.

Nuxt se ocupará de:

- Mostrar la interfaz.
- Gestionar formularios y botones.
- Guardar datos reactivos con `ref`.
- Mostrar estados de carga y errores.
- Pedir información al backend.

## Backend

Es una aplicación que recibe peticiones y devuelve respuestas.

Express se ocupará de:

- Definir las rutas de la API.
- Leer los datos recibidos.
- Validarlos.
- Crear, modificar y eliminar tareas.
- Devolver respuestas JSON.

## Axios

Axios es la herramienta que utilizaremos dentro de Nuxt para enviar peticiones HTTP.

Ejemplo:

```ts
const response = await axios.get(
  'http://localhost:3001/api/tasks',
)
```

Axios envía la petición y entrega la respuesta a nuestro código. Los datos enviados por Express estarán normalmente en:

```ts
response.data
```

Una idea esencial:

> Axios no actualiza Vue directamente.

Axios transporta información. Después, nuestro código guarda `response.data` en un `ref`, y Vue actualiza la pantalla.

## API

Una API es la parte del backend que indica qué operaciones pueden solicitar otros programas.

Nuestra API tendrá estas rutas:

| Método | Ruta | Acción |
|---|---|---|
| `GET` | `/api/health` | Comprobar que Express funciona |
| `GET` | `/api/tasks` | Obtener todas las tareas |
| `POST` | `/api/tasks` | Crear una tarea |
| `PATCH` | `/api/tasks/:id` | Modificar una tarea |
| `DELETE` | `/api/tasks/:id` | Eliminar una tarea |

---

# 3. Relación con redes y arquitectura

Tendremos dos procesos:

```text
Nuxt    → puerto 3000
Express → puerto 3001
```

Un puerto ayuda al sistema operativo a entregar cada comunicación al programa correspondiente.

De forma simplificada:

```text
Aplicación: HTTP y JSON
Transporte: TCP
Red:       IP
```

No programaremos sockets directamente. Node.js, Express, Axios y el navegador se encargarán de esa parte.

Nosotros trabajaremos con:

- La dirección a la que se envía una petición.
- La acción que se solicita.
- Los datos que se envían.
- La respuesta que devuelve el servidor.

El navegador, Postman, `curl` y Axios pueden actuar como clientes de la misma API. Express será el servidor.

---

# 4. La idea básica de una petición y una respuesta

Para empezar no necesitas memorizar el formato interno completo de HTTP.

Piensa en una petición como una pregunta que un cliente envía al servidor.

Por ejemplo:

```text
GET http://localhost:3001/api/tasks
```

se puede leer así:

```text
GET
└── Quiero obtener información.

http://localhost:3001
└── Quiero hablar con el programa que escucha en el puerto 3001.

/api/tasks
└── Quiero trabajar con las tareas.
```

El servidor recibe la petición y devuelve una respuesta. Esa respuesta contiene principalmente:

```text
Un resultado
└── Por ejemplo: 200, todo ha ido bien.

Datos opcionales
└── Por ejemplo: una lista de tareas en JSON.
```

Ejemplo de datos devueltos:

```json
[
  {
    "id": 1,
    "title": "Entender qué es una API",
    "done": true
  }
]
```

Para crear una tarea necesitaremos enviar datos:

```text
POST http://localhost:3001/api/tasks
```

Con este JSON:

```json
{
  "title": "Aprender Axios"
}
```

El servidor podrá responder con la tarea creada:

```json
{
  "id": 3,
  "title": "Aprender Axios",
  "done": false
}
```

Los códigos más importantes aparecerán cuando probemos cada ruta. Por ahora basta con recordar:

| Código | Idea principal |
|---|---|
| `200` | La operación ha funcionado |
| `201` | Se ha creado algo |
| `204` | Ha funcionado, pero no hay datos que devolver |
| `400` | Los datos enviados no son válidos |
| `404` | No se ha encontrado lo solicitado |
| `500` | El backend ha producido un error inesperado |

---

# 5. REST explicado de forma sencilla

En este tutorial, REST significa que intentaremos organizar la API de una forma predecible.

Utilizaremos una misma dirección para las tareas:

```text
/api/tasks
```

Y cambiaremos el método según la acción:

```text
GET /api/tasks
└── Dame las tareas.

POST /api/tasks
└── Crea una tarea nueva.

PATCH /api/tasks/2
└── Modifica parte de la tarea 2.

DELETE /api/tasks/2
└── Elimina la tarea 2.
```

No necesitas memorizar una definición académica de REST. Lo importante es observar que:

- La URL identifica aquello con lo que trabajamos.
- El método indica qué queremos hacer.
- El backend devuelve un resultado y, cuando corresponde, datos JSON.

En Express escribiremos `:id` para representar un identificador variable:

```js
'/api/tasks/:id'
```

Si llega `/api/tasks/2`, Express colocará el valor `2` en `req.params.id`.

---

# 6. Requisitos

Utilizaremos:

- Windows.
- Visual Studio Code.
- PowerShell, preferiblemente desde la terminal integrada de VS Code.
- Node.js 22 o posterior.
- npm.
- Postman.
- Docker Desktop únicamente para la parte opcional.

Comprueba Node y npm:

```powershell
node --version
npm --version
```

En VS Code puedes abrir una terminal desde:

```text
Terminal → New Terminal
```

---

# 7. Crear la estructura principal

En PowerShell:

```powershell
mkdir nuxt-express-axios
cd nuxt-express-axios
code .
```

Si el comando `code` no está disponible, abre VS Code y selecciona:

```text
File → Open Folder
```

Crearemos dos proyectos independientes:

```text
nuxt-express-axios/
├── backend/
└── frontend/
```

Cada uno tendrá su propio `package.json`, sus dependencias y su proceso.

---

# PARTE I — BACKEND EXPRESS

# 8. Crear el proyecto backend

En la terminal integrada de VS Code:

```powershell
mkdir backend
cd backend
npm init -y
```

`npm init -y` crea `package.json`.

## Qué es `package.json`

Es un archivo que describe el proyecto Node.js. Contendrá, entre otras cosas:

- El nombre y la versión.
- Los comandos del proyecto.
- Los paquetes instalados.

También aparecerá `package-lock.json` cuando instalemos dependencias. Ese archivo registra las versiones exactas resueltas por npm.

---

# 9. Instalar Express

Ejecuta:

```powershell
npm install express
```

Después de la instalación:

```text
1. npm descarga Express.
2. Crea la carpeta node_modules.
3. Actualiza package-lock.json.
4. Añade Express a package.json.
```

En `package.json` aparecerá una sección parecida a:

```json
"dependencies": {
  "express": "^5.x.x"
}
```

No copies la versión del ejemplo. Conserva la que haya instalado npm.

Express está en `dependencies` porque el backend lo necesita para ejecutarse.

---

# 10. Preparar los scripts del backend

Queremos dos comandos:

```text
npm run dev
└── Desarrollo con reinicio automático.

npm start
└── Ejecución normal con Node.
```

En `package.json`, sustituye la sección `scripts` por:

```json
"scripts": {
  "dev": "nodemon --watch src --ext js --exec node src/server.js",
  "start": "node src/server.js"
}
```

Utilizaremos el sistema CommonJS habitual en muchos proyectos Node:

```js
const express = require('express')
module.exports = app
```

El script de desarrollo dice:

```text
nodemon
└── Ejecuta una herramienta llamada nodemon.

--watch src
└── Vigila los cambios dentro de src.

--ext js
└── Observa archivos JavaScript.

--exec node src/server.js
└── Ejecuta el servidor con Node.
```

---

# 11. Ver el error de `nodemon` e instalarlo

Todavía no hemos instalado `nodemon`.

Ejecuta:

```powershell
npm run dev
```

En Windows aparecerá un mensaje parecido a:

```text
'nodemon' no se reconoce como un comando interno o externo
```

El script existe, pero el paquete que intenta ejecutar no está instalado.

Instálalo como dependencia de desarrollo:

```powershell
npm install --save-dev nodemon
```

La forma abreviada es:

```powershell
npm install -D nodemon
```

Ahora `package.json` tendrá:

```json
"devDependencies": {
  "nodemon": "^3.x.x"
}
```

La diferencia principal es:

```text
dependencies
└── Paquetes que necesita la aplicación para funcionar.

devDependencies
└── Herramientas utilizadas durante el desarrollo.
```

Todavía no vuelvas a ejecutar el script: primero crearemos `src/server.js`.

---

# 12. Crear una estructura backend sencilla

En PowerShell:

```powershell
mkdir src
mkdir src\routes
```

La estructura será:

```text
backend/
├── src/
│   ├── app.js
│   ├── server.js
│   └── routes/
│       └── tasks.routes.js
├── package.json
└── package-lock.json
```

Responsabilidades:

```text
app.js
└── Crea y configura la aplicación Express.

server.js
└── Importa la aplicación y la pone a escuchar en un puerto.

tasks.routes.js
└── Contiene las rutas relacionadas con tareas.
```

Empezaremos solo con `app.js` y `server.js`. El archivo de rutas se añadirá cuando tengamos el servidor mínimo funcionando.

---

# 13. Crear `app.js` paso a paso

Crea:

```text
backend/src/app.js
```

## 13.1 Importar Express

Añade:

```js
const express = require('express')
```

`require` carga un módulo para poder utilizarlo en este archivo.

En este caso, la variable `express` recibe lo que exporta el paquete instalado con:

```powershell
npm install express
```

## 13.2 Crear la aplicación

Debajo añade:

```js
const app = express()
```

`express()` crea nuestra aplicación backend.

La variable `app` será el objeto sobre el que registraremos rutas y middleware.

## 13.3 Crear una ruta de comprobación

Añade:

```js
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'El backend funciona correctamente',
  })
})
```

La estructura general es:

```js
app.get(ruta, funcion)
```

- `get` indica que la ruta responde a peticiones GET.
- `req` representa la petición recibida.
- `res` permite construir la respuesta.
- `res.json(...)` envía datos JSON.

En esta ruta no necesitamos utilizar `req`, pero lo dejamos con ese nombre porque todavía estamos aprendiendo qué representa cada parámetro.

## 13.4 Exportar la aplicación

Al final añade:

```js
module.exports = app
```

Esto permite que otro archivo importe la aplicación.

El archivo completo queda así:

```js
const express = require('express')

const app = express()

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'El backend funciona correctamente',
  })
})

module.exports = app
```

Todavía no hemos abierto ningún puerto. Eso será responsabilidad de `server.js`.

---

# 14. Crear `server.js` paso a paso

Crea:

```text
backend/src/server.js
```

## 14.1 Importar la aplicación

Añade:

```js
const app = require('./app')
```

`./app` significa “el archivo `app.js` que está en esta misma carpeta”.

Como `app.js` termina con:

```js
module.exports = app
```

`server.js` recibe ese mismo objeto en su variable `app`.

## 14.2 Elegir un puerto

Añade:

```js
const PORT = 3001
```

Por ahora escribiremos el puerto directamente. Más adelante lo moveremos a `.env`.

## 14.3 Empezar a escuchar

Añade:

```js
app.listen(PORT, () => {
  console.log(`Backend disponible en http://localhost:${PORT}`)
})
```

`app.listen` indica a Node que acepte conexiones en el puerto seleccionado.

El archivo completo queda así:

```js
const app = require('./app')

const PORT = 3001

app.listen(PORT, () => {
  console.log(`Backend disponible en http://localhost:${PORT}`)
})
```

La separación es sencilla:

```text
app.js
└── Describe la aplicación.

server.js
└── Arranca la aplicación.
```

---

# 15. Ejecutar el backend y probarlo en el navegador

Ejecuta:

```powershell
npm run dev
```

Deberías ver algo parecido a:

```text
[nodemon] starting `node src/server.js`
Backend disponible en http://localhost:3001
```

Abre en el navegador:

```text
http://localhost:3001/api/health
```

Deberías recibir:

```json
{
  "status": "ok",
  "message": "El backend funciona correctamente"
}
```

Al escribir la URL en la barra del navegador ha ocurrido esto:

```text
1. El navegador envía una petición GET.
2. La petición llega al puerto 3001.
3. Express encuentra app.get('/api/health').
4. La función de la ruta se ejecuta.
5. res.json(...) envía la respuesta.
```

Guarda un cambio en `app.js`. `nodemon` debería reiniciar automáticamente el proceso.

---

# 16. Crear el router de tareas y la ruta GET

Crea:

```text
backend/src/routes/tasks.routes.js
```

## 16.1 Cargar Express y crear un router

Añade:

```js
const express = require('express')

const router = express.Router()
```

Un router es una zona de Express donde agrupamos rutas relacionadas.

La aplicación principal utiliza `app`. Este archivo utiliza `router` porque solo se ocupará de tareas.

## 16.2 Crear datos temporales

Añade:

```js
let nextId = 3

let tasks = [
  {
    id: 1,
    title: 'Entender qué es una API',
    done: true,
  },
  {
    id: 2,
    title: 'Hacer mi primera petición HTTP',
    done: false,
  },
]
```

Estas variables actúan como almacenamiento temporal.

```text
nextId
└── Guarda el siguiente identificador disponible.

tasks
└── Guarda las tareas mientras el proceso está ejecutándose.
```

Cuando reinicies el backend, los cambios realizados en las tareas desaparecerán.

## 16.3 Crear la ruta GET

Añade:

```js
router.get('/', (req, res) => {
  res.json(tasks)
})
```

Esta ruta devuelve el array completo.

La ruta aparece como `/` porque añadiremos el prefijo `/api/tasks` desde `app.js`.

## 16.4 Exportar el router

Al final añade:

```js
module.exports = router
```

Por ahora el archivo completo es:

```js
const express = require('express')

const router = express.Router()

let nextId = 3

let tasks = [
  {
    id: 1,
    title: 'Entender qué es una API',
    done: true,
  },
  {
    id: 2,
    title: 'Hacer mi primera petición HTTP',
    done: false,
  },
]

router.get('/', (req, res) => {
  res.json(tasks)
})

module.exports = router
```

`nextId` todavía no se utiliza. Lo necesitaremos en `POST`.

---

# 17. Conectar el router con `app.js`

Abre `src/app.js`.

## 17.1 Importar el router

Debajo de Express añade:

```js
const tasksRouter = require('./routes/tasks.routes')
```

## 17.2 Registrar el router

Después de la ruta de salud añade:

```js
app.use('/api/tasks', tasksRouter)
```

`app.use` registra algo dentro del recorrido de Express.

En este caso registra un router con el prefijo `/api/tasks`.

Express combina:

```text
Prefijo de app.js: /api/tasks
Ruta del router:   /
Resultado:         /api/tasks
```

## 17.3 Añadir una respuesta para rutas inexistentes

Al final, antes de `module.exports`, añade:

```js
app.use((req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
  })
})
```

Esta función se registra al final. Si ninguna ruta anterior ha respondido, Express llega hasta ella y devuelve `404`.

El orden importa.

`app.js` queda así:

```js
const express = require('express')

const tasksRouter = require('./routes/tasks.routes')

const app = express()

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'El backend funciona correctamente',
  })
})

app.use('/api/tasks', tasksRouter)

app.use((req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
  })
})

module.exports = app
```

Abre en el navegador:

```text
http://localhost:3001/api/tasks
```

La barra de direcciones del navegador envía una petición GET, por eso esta prueba funciona bien.

---

# 18. Preparar Express para recibir JSON

Para crear una tarea enviaremos un cuerpo JSON desde Postman y, más adelante, desde Axios.

Express necesita interpretar ese cuerpo.

En `app.js`, antes de las rutas, añade:

```js
app.use(express.json())
```

## Qué es un middleware

Un middleware es una función que participa en el recorrido de una petición antes de llegar a una ruta o antes de terminar la respuesta.

```js
express.json()
```

crea un middleware que:

```text
1. Comprueba si el cuerpo contiene JSON.
2. Lo interpreta.
3. Coloca el resultado en req.body.
```

El orden debe quedar así:

```js
const express = require('express')

const tasksRouter = require('./routes/tasks.routes')

const app = express()

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'El backend funciona correctamente',
  })
})

app.use('/api/tasks', tasksRouter)

app.use((req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
  })
})

module.exports = app
```

Lo colocamos antes del router porque las rutas `POST` y `PATCH` necesitarán acceder a `req.body`.

---

# 19. Añadir `POST` y validar el título

Abre `tasks.routes.js` y añade esta ruta después del `GET`:

```js
router.post('/', (req, res) => {
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

  const newTask = {
    id: nextId,
    title,
    done: false,
  }

  nextId += 1
  tasks.push(newTask)

  return res.status(201).json(newTask)
})
```

Veamos cada parte.

## Leer el dato enviado

```js
const rawTitle = req.body?.title
```

`req.body` contiene el JSON interpretado por `express.json()`.

El operador `?.` evita un error si no existe `req.body`.

## Comprobar que sea texto y limpiar espacios

```js
const title =
  typeof rawTitle === 'string'
    ? rawTitle.trim()
    : ''
```

- `typeof rawTitle === 'string'` comprueba que el valor sea texto.
- `trim()` elimina espacios al principio y al final.
- Si no es texto, utilizamos una cadena vacía.

## Validar

```js
if (!title) {
  return res.status(400).json({
    message: 'El título de la tarea es obligatorio',
  })
}
```

Si el título está vacío, detenemos la función con `return` y respondemos `400`.

La validación pertenece al backend porque no debemos confiar únicamente en lo que compruebe el frontend.

## Crear y guardar la tarea

```js
const newTask = {
  id: nextId,
  title,
  done: false,
}
```

El backend asigna el identificador y el estado inicial.

```js
nextId += 1
```

prepara el siguiente identificador.

```js
tasks.push(newTask)
```

añade la tarea al array en memoria.

## Responder

```js
return res.status(201).json(newTask)
```

`201` indica que se ha creado un recurso.

---

# 20. Añadir `PATCH` para cambiar el estado

Añade después de `POST`:

```js
router.patch('/:id', (req, res) => {
  const id = Number(req.params.id)

  const task = tasks.find((currentTask) => {
    return currentTask.id === id
  })

  if (!task) {
    return res.status(404).json({
      message: 'No se ha encontrado la tarea',
    })
  }

  if (typeof req.body?.done !== 'boolean') {
    return res.status(400).json({
      message: 'La propiedad done debe ser true o false',
    })
  }

  task.done = req.body.done

  return res.json(task)
})
```

## Leer el identificador

En una URL como:

```text
/api/tasks/2
```

Express coloca `2` en:

```js
req.params.id
```

Los parámetros llegan como texto, por eso hacemos:

```js
const id = Number(req.params.id)
```

## Buscar la tarea

```js
const task = tasks.find((currentTask) => {
  return currentTask.id === id
})
```

`find` devuelve la primera tarea cuyo ID coincide.

Si no existe, respondemos `404`.

## Validar `done`

```js
if (typeof req.body?.done !== 'boolean')
```

Solo aceptamos los valores booleanos:

```text
true
false
```

No aceptamos las cadenas `"true"` o `"false"`.

## Actualizar y responder

```js
task.done = req.body.done
```

modifica el objeto guardado en el array.

Después devolvemos la tarea actualizada con estado `200`, que Express utiliza por defecto en `res.json`.

---

# 21. Añadir `DELETE`

Añade después de `PATCH`:

```js
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)

  const taskExists = tasks.some((task) => {
    return task.id === id
  })

  if (!taskExists) {
    return res.status(404).json({
      message: 'No se ha encontrado la tarea',
    })
  }

  tasks = tasks.filter((task) => {
    return task.id !== id
  })

  return res.status(204).send()
})
```

## Comprobar que exista

```js
const taskExists = tasks.some(...)
```

`some` devuelve `true` si alguna tarea coincide.

## Eliminarla del array

```js
tasks = tasks.filter((task) => {
  return task.id !== id
})
```

`filter` crea un nuevo array que contiene todas las tareas excepto la eliminada.

## Responder sin cuerpo

```js
return res.status(204).send()
```

`204` significa que la operación ha funcionado, pero no hay contenido que devolver.

## Comprobar el archivo completo

Antes de empezar con Postman, `src/routes/tasks.routes.js` debe quedar así:

```js
const express = require('express')

const router = express.Router()

let nextId = 3

let tasks = [
  {
    id: 1,
    title: 'Entender qué es una API',
    done: true,
  },
  {
    id: 2,
    title: 'Hacer mi primera petición HTTP',
    done: false,
  },
]

router.get('/', (req, res) => {
  res.json(tasks)
})

router.post('/', (req, res) => {
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

  const newTask = {
    id: nextId,
    title,
    done: false,
  }

  nextId += 1
  tasks.push(newTask)

  return res.status(201).json(newTask)
})

router.patch('/:id', (req, res) => {
  const id = Number(req.params.id)

  const task = tasks.find((currentTask) => {
    return currentTask.id === id
  })

  if (!task) {
    return res.status(404).json({
      message: 'No se ha encontrado la tarea',
    })
  }

  if (typeof req.body?.done !== 'boolean') {
    return res.status(400).json({
      message: 'La propiedad done debe ser true o false',
    })
  }

  task.done = req.body.done

  return res.json(task)
})

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)

  const taskExists = tasks.some((task) => {
    return task.id === id
  })

  if (!taskExists) {
    return res.status(404).json({
      message: 'No se ha encontrado la tarea',
    })
  }

  tasks = tasks.filter((task) => {
    return task.id !== id
  })

  return res.status(204).send()
})

module.exports = router
```

No es código nuevo. Es la unión de los fragmentos que hemos añadido y explicado en orden.

---

# 22. Probar la API con el navegador y Postman

## Por qué utilizar ambas herramientas

La barra del navegador resulta cómoda para una petición GET:

```text
http://localhost:3001/api/tasks
```

Pero no permite preparar fácilmente un `POST`, `PATCH` o `DELETE` con un cuerpo JSON.

Postman es un cliente gráfico diseñado para construir esas peticiones.

Esto permite probar el backend sin depender todavía de Nuxt.

```text
Si Postman falla:
    revisaremos el backend o los datos enviados.

Si Postman funciona y Nuxt falla:
    revisaremos el frontend, su URL o CORS.
```

## Probar `GET /api/tasks`

En Postman:

1. Crea una petición HTTP.
2. Selecciona `GET`.
3. Escribe:

   ```text
   http://localhost:3001/api/tasks
   ```

4. Pulsa **Send**.

Observa:

```text
Status: 200 OK
Body: lista JSON de tareas
```

La petición pide información y no envía un cuerpo.

## Probar `POST /api/tasks`

Configura:

```text
Método: POST
URL: http://localhost:3001/api/tasks
```

En Postman selecciona:

```text
Body → raw → JSON
```

Envía:

```json
{
  "title": "Aprender a probar una API con Postman"
}
```

La respuesta debería ser parecida a:

```json
{
  "id": 3,
  "title": "Aprender a probar una API con Postman",
  "done": false
}
```

Y el estado:

```text
201 Created
```

Ahora envía:

```json
{
  "title": "   "
}
```

La validación eliminará los espacios con `trim()` y responderá:

```text
400 Bad Request
```

```json
{
  "message": "El título de la tarea es obligatorio"
}
```

La red ha funcionado y Express ha respondido. El problema es que los datos no superan la validación.

## Probar `PATCH /api/tasks/2`

Configura:

```text
Método: PATCH
URL: http://localhost:3001/api/tasks/2
```

Body:

```json
{
  "done": true
}
```

La respuesta debe contener la tarea actualizada.

Prueba también un dato incorrecto:

```json
{
  "done": "true"
}
```

Aunque visualmente se parezca, `"true"` es texto. La API espera el booleano `true` y responderá `400`.

## Probar `DELETE /api/tasks/2`

Configura:

```text
Método: DELETE
URL: http://localhost:3001/api/tasks/2
```

La respuesta será:

```text
204 No Content
```

Repite después el `GET` y comprueba que la tarea ya no aparece.

## Una diferencia que será importante para CORS

Estas dos pruebas pueden funcionar:

```text
Abrir la URL del backend directamente en el navegador.
Enviar la petición desde Postman.
```

Más adelante, una aplicación Nuxt cargada en `http://localhost:3000` intentará llamar mediante JavaScript al backend de `http://localhost:3001`.

Esa situación es distinta. Los dos puertos representan orígenes diferentes y el navegador aplicará la política CORS.

---

# 23. Qué es `curl`

`curl` es una herramienta de terminal capaz de enviar peticiones HTTP.

No es otra API ni otro backend. Es otro cliente, igual que Postman o Axios.

En PowerShell conviene escribir `curl.exe` para utilizar explícitamente el programa de Windows.

## GET

```powershell
curl.exe http://localhost:3001/api/tasks
```

## POST

```powershell
curl.exe -X POST http://localhost:3001/api/tasks -H "Content-Type: application/json" -d '{"title":"Probar la API con curl"}'
```

Significado:

```text
-X POST
└── Selecciona el método POST.

-H "Content-Type: application/json"
└── Indica que enviamos JSON.

-d '{...}'
└── Define los datos del cuerpo.
```

No necesitas memorizar el comando. Postman será más cómodo al principio. Lo importante es reconocer que ambos construyen una petición equivalente.

---

# PARTE II — VARIABLES DE ENTORNO EN EL BACKEND

# 24. Crear `.env.example` y copiarlo a `.env`

Algunos valores pueden cambiar según el equipo o el entorno:

- Puerto del backend.
- Dirección del frontend.
- En el futuro, credenciales de base de datos.

Primero crearemos una plantilla.

En la raíz de `backend`, crea:

```text
.env.example
```

Contenido:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Qué debe contener `.env.example`

Debe mostrar:

- Qué variables necesita el proyecto.
- Qué formato tienen.
- Valores de ejemplo seguros cuando resulte útil.

Nunca debe contener secretos reales.

Ejemplo correcto para una futura contraseña:

```env
DB_PASSWORD=replace_with_your_password
```

Ejemplo incorrecto:

```env
DB_PASSWORD=MiContraseñaRealDeProduccion
```

## Crear el archivo local `.env`

En PowerShell:

```powershell
Copy-Item .env.example .env
```

Después abre `.env` en VS Code y ajusta los valores de tu equipo si fuera necesario.

La idea de trabajo será:

```text
.env.example
└── Plantilla compartida con el equipo.

.env
└── Configuración local real de cada persona.
```

---

# 25. Instalar `dotenv` y leer `.env` desde `server.js`

Node no leerá nuestro archivo `.env` por el simple hecho de existir.

Instala `dotenv`:

```powershell
npm install dotenv
```

En `package.json` aparecerá dentro de `dependencies`.

Ahora modifica `src/server.js`:

```js
require('dotenv').config()

const app = require('./app')

const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, () => {
  console.log(`Backend disponible en http://localhost:${PORT}`)
})
```

## Cargar las variables

```js
require('dotenv').config()
```

lee `.env` y añade sus valores a `process.env`.

Esta línea está antes de importar `app`. El orden será útil cuando `app.js` necesite leer `FRONTEND_URL` para configurar CORS.

## Leer el puerto

```js
process.env.PORT
```

obtiene el valor del archivo `.env`.

Como las variables de entorno llegan como texto, utilizamos:

```js
Number(process.env.PORT)
```

## Valor por defecto

```js
Number(process.env.PORT) || 3001
```

significa:

```text
Si PORT contiene un número válido, úsalo.
Si no, utiliza 3001.
```

Reinicia el backend y comprueba que `/api/health` continúa funcionando.

---

# 26. Proteger `.env` y revisar la estructura

Crea o modifica:

```text
backend/.gitignore
```

Contenido:

```gitignore
node_modules/
.env
coverage/
```

`.env` no se sube normalmente a Git porque puede contener configuración privada.

`.env.example` sí se conserva para que otra persona pueda hacer:

```powershell
Copy-Item .env.example .env
```

La estructura del backend en este punto será:

```text
backend/
├── src/
│   ├── app.js
│   ├── server.js
│   └── routes/
│       └── tasks.routes.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json
```

Antes de empezar Nuxt, comprueba:

```text
GET /api/health funciona en el navegador.
GET /api/tasks funciona en el navegador y Postman.
POST crea una tarea desde Postman.
PATCH modifica una tarea.
DELETE elimina una tarea.
La validación devuelve 400 cuando corresponde.
```

---

# PARTE III — FRONTEND NUXT 4

Hasta ahora hemos trabajado únicamente con Express.

Antes de crear la interfaz ya sabemos que el backend funciona porque lo hemos probado de dos maneras:

```text
Navegador
└── Permite comprobar rutas GET sencillas.

Postman
└── Permite probar GET, POST, PATCH y DELETE.
```

Esto es importante. Si después aparece un problema en Nuxt, ya no tendremos que preguntarnos si la API existe o si las rutas básicas funcionan.

---

# 27. Crear el proyecto Nuxt y comprobarlo antes de modificarlo

Vuelve a la carpeta principal del ejercicio:

```powershell
cd ..
```

Debes estar en:

```text
nuxt-express-axios/
```

Crea el frontend:

```powershell
npm create nuxt@latest frontend
```

El asistente puede hacerte varias preguntas. Para este tutorial puedes:

- Utilizar `npm`.
- No añadir módulos opcionales.
- Aceptar la instalación de dependencias.

Entra en el proyecto:

```powershell
cd frontend
```

Si el asistente no instaló las dependencias, ejecuta:

```powershell
npm install
```

## Probar el proyecto recién creado

Antes de cambiar carpetas o configuración, comprueba que Nuxt arranca:

```powershell
npm run dev
```

Abre la dirección que muestre la terminal. Normalmente será:

```text
http://localhost:3000
```

Deberías ver la página inicial de Nuxt.

Esta comprobación nos permite saber que:

```text
Node funciona.
npm ha instalado las dependencias.
El proyecto Nuxt se ha creado correctamente.
El puerto 3000 está disponible.
```

Detén temporalmente Nuxt con:

```text
Ctrl + C
```

Lo volveremos a iniciar después de preparar la estructura.

---

# 28. Entender la estructura creada y cambiarla a `src`

Nuxt 4 crea normalmente una estructura parecida a esta:

```text
frontend/
├── app/
│   └── app.vue
├── nuxt.config.ts
├── package.json
└── package-lock.json
```

## Qué representa cada parte

```text
app/
└── Contiene el código principal de la aplicación Nuxt.

app/app.vue
└── Es el componente raíz que se muestra en la página.

nuxt.config.ts
└── Contiene la configuración principal de Nuxt.

package.json
└── Contiene scripts y dependencias del frontend.
```

La carpeta `app/` es la convención predeterminada de Nuxt 4.

En este tutorial utilizaremos `src/` porque es una organización frecuente en proyectos JavaScript y TypeScript, pero se lo indicaremos expresamente a Nuxt.

## Renombrar la carpeta desde VS Code

En el explorador de archivos de VS Code:

1. Haz clic derecho sobre `app`.
2. Selecciona **Rename** o **Cambiar nombre**.
3. Cambia el nombre a:

   ```text
   src
   ```

La estructura quedará así:

```text
frontend/
├── src/
│   └── app.vue
├── nuxt.config.ts
├── package.json
└── package-lock.json
```

## Informar a Nuxt del cambio

Abre:

```text
frontend/nuxt.config.ts
```

Déjalo así por ahora:

```ts
export default defineNuxtConfig({
  srcDir: 'src/',
})
```

La propiedad:

```ts
srcDir: 'src/'
```

indica que el código fuente de la aplicación se encuentra dentro de `src`.

## Comprobar el cambio

Arranca otra vez Nuxt:

```powershell
npm run dev
```

Abre:

```text
http://localhost:3000
```

La página debe seguir funcionando.

Si funciona, hemos cambiado la organización sin cambiar todavía el comportamiento de la aplicación.

---

# 29. Crear el fondo y el contenedor principal

Empezaremos la interfaz con el elemento más exterior de la página.

Abre:

```text
frontend/src/app.vue
```

Elimina el contenido inicial y añade:

```vue
<template>
  <main class="page">
    <p>Preparando la aplicación de tareas...</p>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.page {
  min-height: 100vh;
  padding: 48px 20px;
  background: #f1f5f9;
  color: #0f172a;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}
</style>
```

## El elemento `main`

```vue
<main class="page">
```

`main` representa el contenido principal de la página.

La clase `page` nos permite aplicarle estilos sin depender directamente del nombre de la etiqueta.

## Ocupar toda la altura visible

```css
min-height: 100vh;
```

`100vh` representa el alto completo de la ventana del navegador.

Utilizamos `min-height` y no `height` para que la página pueda crecer cuando haya muchas tareas.

## Separar el contenido de los bordes

```css
padding: 48px 20px;
```

El primer valor corresponde al espacio superior e inferior. El segundo corresponde a los lados.

## Utilizar `box-sizing`

```css
* {
  box-sizing: border-box;
}
```

Hace que el ancho de un elemento incluya su relleno y su borde. Esto facilita calcular los tamaños de tarjetas, inputs y botones.

Arranca Nuxt si no está ejecutándose:

```powershell
npm run dev
```

Abre:

```text
http://localhost:3000
```

Por ahora solo debes comprobar el fondo, la tipografía y el espacio exterior.

---

# 30. Añadir la tarjeta de la aplicación

Ahora agruparemos el contenido dentro de una tarjeta.

Sustituye el párrafo del template por:

```vue
<section class="card">
  <p>Preparando la aplicación de tareas...</p>
</section>
```

El template queda así:

```vue
<template>
  <main class="page">
    <section class="card">
      <p>Preparando la aplicación de tareas...</p>
    </section>
  </main>
</template>
```

Añade al bloque `<style scoped>`:

```css
.card {
  width: min(720px, 100%);
  margin: 0 auto;
  padding: 32px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgb(15 23 42 / 8%);
}
```

## Limitar el ancho

```css
width: min(720px, 100%);
```

La tarjeta podrá medir como máximo `720px`. En una pantalla más estrecha utilizará el espacio disponible.

## Centrarla

```css
margin: 0 auto;
```

Los márgenes laterales automáticos centran un elemento que tiene un ancho limitado.

## Separar visualmente la tarjeta

El fondo blanco, el borde, las esquinas redondeadas y la sombra permiten distinguir el contenido del fondo general.

Recarga el navegador y comprueba únicamente este cambio antes de continuar.

---

# 31. Construir el encabezado

La aplicación necesita explicar qué estamos practicando.

Sustituye el párrafo temporal por:

```vue
<header class="app-header">
  <p class="eyebrow">
    Comunicación frontend-backend
  </p>

  <h1>Nuxt + Express + Axios</h1>

  <p class="description">
    Nuxt muestra la interfaz, Axios realiza las
    peticiones y Express procesa la API.
  </p>
</header>
```

## Qué aporta cada elemento

```text
header
└── Agrupa el contenido introductorio.

p.eyebrow
└── Presenta una categoría breve sobre el título.

h1
└── Es el título principal de la página.

p.description
└── Resume la responsabilidad de cada tecnología.
```

Añade estos estilos:

```css
.app-header {
  margin-bottom: 32px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #4f46e5;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

h1,
h2,
p {
  margin-top: 0;
}

.description {
  margin-bottom: 0;
  color: #475569;
  line-height: 1.6;
}
```

## Crear jerarquía visual

El título principal conserva el mayor peso visual.

El texto `.eyebrow` utiliza un tamaño menor, mayúsculas y más separación entre letras. La descripción utiliza un color menos intenso porque es información secundaria.

Comprueba el encabezado en el navegador antes de añadir la lista.

---

# 32. Añadir el título y una lista sencilla

Debajo de `</header>`, añade:

```vue
<section class="tasks-section">
  <h2>Tareas</h2>

  <ul class="task-list">
    <li class="task-item">
      Entender qué es una API
    </li>

    <li class="task-item">
      Hacer mi primera petición HTTP
    </li>
  </ul>
</section>
```

Todavía estamos escribiendo las tareas directamente en el HTML. Esto nos permite trabajar primero la estructura visual.

## Por qué utilizamos una lista

Las tareas forman una colección de elementos relacionados. Por eso utilizamos:

```html
<ul>
```

Cada tarea se representa con:

```html
<li>
```

Añade estos estilos:

```css
.tasks-section h2 {
  margin-bottom: 0;
}

.task-list {
  display: grid;
  gap: 12px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.task-item {
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
```

## Utilizar Grid para una lista vertical

```css
display: grid;
gap: 12px;
```

Grid no se utiliza solamente para cuadrículas con varias columnas. También permite crear una lista vertical con una separación constante.

## Eliminar el estilo predeterminado

```css
padding: 0;
list-style: none;
```

El navegador añade normalmente sangría y viñetas a un `<ul>`. Las eliminamos porque cada tarea ya tendrá su propio borde.

---

# 33. Añadir el checkbox de cada tarea

Una tarea necesita mostrar si está pendiente o completada.

Sustituye el contenido de los dos `<li>` por:

```vue
<li class="task-item">
  <label class="task-content">
    <input
      type="checkbox"
      checked
      disabled
    >

    <span>Entender qué es una API</span>
  </label>
</li>

<li class="task-item">
  <label class="task-content">
    <input
      type="checkbox"
      disabled
    >

    <span>Hacer mi primera petición HTTP</span>
  </label>
</li>
```

## Utilizar un `label`

Al colocar el checkbox y el texto dentro de un `<label>`, ambos quedan relacionados.

Más adelante, cuando el control esté activado, también se podrá pulsar sobre el texto para cambiar la casilla.

## Simular los dos estados

```html
checked
```

hace que la primera tarea aparezca marcada.

```html
disabled
```

indica que todavía estamos maquetando el control y no hemos añadido su comportamiento.

Añade:

```css
.task-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-content input {
  width: 18px;
  height: 18px;
  accent-color: #4f46e5;
}
```

Flexbox coloca la casilla y el texto en la misma fila y los alinea verticalmente.

---

# 34. Mostrar visualmente una tarea completada

La primera tarea está marcada, pero su texto todavía se ve igual que el de una tarea pendiente.

Añade la clase `completed` a su `<span>`:

```vue
<span class="completed">
  Entender qué es una API
</span>
```

Añade el estilo:

```css
.completed {
  color: #64748b;
  text-decoration: line-through;
}
```

La línea atravesada y el color menos intenso permiten reconocer rápidamente que la tarea está completada.

Por ahora hemos escrito la clase directamente. Más adelante Vue la añadirá o retirará según el valor de `done` que devuelva Express.

---

# 35. Añadir el botón para eliminar

Cada tarea tendrá también un botón de eliminación.

Añade el botón después de `</label>` en los dos elementos de la lista:

```vue
<button
  class="delete-button"
  type="button"
  disabled
>
  Eliminar
</button>
```

El elemento completo tendrá esta forma:

```vue
<li class="task-item">
  <label class="task-content">
    <!-- Checkbox y texto -->
  </label>

  <button
    class="delete-button"
    type="button"
    disabled
  >
    Eliminar
  </button>
</li>
```

## Por qué indicamos `type="button"`

Un botón puede terminar dentro de un formulario. Al escribir explícitamente:

```html
type="button"
```

evitamos que intente enviar ese formulario.

Modifica `.task-item` para distribuir el contenido y añade los estilos de los botones:

```css
.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

button {
  padding: 11px 16px;
  border: 0;
  border-radius: 8px;
  background: #4f46e5;
  color: white;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.delete-button {
  background: #dc2626;
}
```

`justify-content: space-between` coloca el contenido de la tarea a un lado y el botón al otro.

El botón permanece desactivado porque todavía no existe una función que elimine tareas.

---

# 36. Construir el formulario de creación

Ahora añadiremos el formulario, pero todavía no lo conectaremos con el backend.

Colócalo entre `</header>` y la sección de tareas:

```vue
<form class="task-form">
  <label for="task-title">
    Nueva tarea
  </label>

  <div class="form-row">
    <input
      id="task-title"
      type="text"
      placeholder="Ejemplo: practicar una petición POST"
    >

    <button
      type="submit"
      disabled
    >
      Añadir
    </button>
  </div>
</form>
```

## Relacionar el texto con el input

```html
<label for="task-title">
```

se relaciona con:

```html
<input id="task-title">
```

Al pulsar sobre el texto `Nueva tarea`, el navegador coloca el foco en el input.

## Agrupar input y botón

La clase `.form-row` se utilizará para colocar ambos controles en la misma fila.

Añade:

```css
.task-form {
  margin-bottom: 28px;
}

.task-form > label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
}

.form-row {
  display: flex;
  gap: 12px;
}

input[type='text'] {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font: inherit;
}

input[type='text']:focus {
  border-color: #4f46e5;
  outline: 3px solid rgb(79 70 229 / 15%);
}
```

## Permitir que el input ocupe el espacio disponible

```css
flex: 1;
```

hace que el input crezca dentro de la fila.

```css
min-width: 0;
```

permite que también pueda reducirse en pantallas estrechas sin desbordar la tarjeta.

El botón continúa desactivado. Primero estamos comprobando el HTML y el CSS; más adelante añadiremos `v-model`, el evento del formulario y la petición `POST`.

---

# 37. Adaptar la maqueta a pantallas pequeñas

La distribución horizontal funciona bien en una pantalla amplia, pero puede resultar incómoda en un móvil.

Añade al final de `<style scoped>`:

```css
@media (max-width: 560px) {
  .page {
    padding: 24px 14px;
  }

  .card {
    padding: 22px;
  }

  .form-row {
    flex-direction: column;
  }

  .task-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .delete-button {
    width: 100%;
  }
}
```

## Qué cambia la media query

Cuando la pantalla mide como máximo `560px`:

- Disminuye el espacio exterior.
- La tarjeta utiliza menos relleno.
- El input y el botón se colocan uno debajo del otro.
- El contenido y el botón de cada tarea también pasan a una columna.
- El botón de eliminar ocupa todo el ancho.

Reduce el ancho de la ventana y comprueba el cambio.

En este punto ya tenemos una maqueta cómoda para probar el frontend. Todavía no hemos instalado ningún cliente HTTP porque aún no habíamos necesitado realizar peticiones.

---

# 38. Necesitamos datos reales: instalar Axios

Las tareas actuales están escritas directamente en el template.

El siguiente objetivo es sustituirlas por los datos que devuelve:

```text
GET http://localhost:3001/api/tasks
```

Para realizar esa petición desde Nuxt necesitamos un cliente HTTP. En este tutorial utilizaremos Axios.

Dentro de `frontend`, ejecuta ahora:

```powershell
npm install axios
```

Este es el momento de instalarlo porque acaba de aparecer una necesidad concreta:

```text
Necesitamos pedir datos al backend.
→ Elegimos Axios como cliente HTTP.
→ Instalamos Axios.
→ Lo configuramos antes de la primera petición.
```

Después abre `package.json`.

Axios aparecerá dentro de `dependencies` y también se habrá actualizado `package-lock.json`.

## Qué responsabilidad tendrá Axios

Axios se encargará de:

```text
Construir la petición.
Enviarla al backend.
Esperar la respuesta.
Entregar esa respuesta a nuestro código.
```

Axios no modificará la interfaz por sí solo. Nuestro código tendrá que guardar los datos recibidos en un estado reactivo de Vue.

---

# 39. Preparar la dirección del backend

Axios necesita saber dónde está la API.

En local utilizaremos:

```text
http://localhost:3001/api
```

La llamaremos `apiBase` porque es la parte común de todas las rutas.

```text
apiBase: http://localhost:3001/api
ruta:    /tasks
resultado:
http://localhost:3001/api/tasks
```

## Crear `.env.example`

En la raíz de `frontend`, crea:

```text
frontend/.env.example
```

Contenido:

```env
NUXT_PUBLIC_API_BASE=http://localhost:3001/api
```

## Crear `.env`

En PowerShell:

```powershell
Copy-Item .env.example .env
```

Comprueba también que `frontend/.gitignore` contiene:

```gitignore
.env
```

La plantilla `.env.example` puede compartirse. El archivo `.env` contiene la configuración local de cada persona.

## Por qué la variable es pública

El prefijo `NUXT_PUBLIC_` indica que el valor podrá utilizarse en el código que se ejecuta en el navegador.

Eso es correcto para una URL pública. No debe utilizarse para contraseñas, tokens privados ni credenciales de una base de datos.

## Registrar `apiBase` en Nuxt

Abre `frontend/nuxt.config.ts` y déjalo así:

```ts
export default defineNuxtConfig({
  srcDir: 'src/',

  runtimeConfig: {
    public: {
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE ||
        'http://localhost:3001/api',
    },
  },
})
```

La propiedad pública estará disponible posteriormente en:

```ts
config.public.apiBase
```

Cuando modifiques `.env` o `nuxt.config.ts`, reinicia Nuxt si el cambio no se refleja.

---

# 40. Crear una instancia reutilizable de Axios

Ahora prepararemos Axios una sola vez para no repetir la URL en cada petición.

Crea la carpeta:

```text
frontend/src/plugins/
```

Dentro, crea:

```text
frontend/src/plugins/axios.ts
```

## Paso 1: importar Axios

```ts
import axios from 'axios'
```

## Paso 2: crear el plugin

Añade:

```ts
export default defineNuxtPlugin(() => {
  // Configuraremos Axios aquí.
})
```

Un plugin permite preparar una herramienta cuando Nuxt crea la aplicación.

## Paso 3: leer la configuración

Dentro del plugin añade:

```ts
const config = useRuntimeConfig()
```

## Paso 4: crear la instancia

Añade:

```ts
const api = axios.create({
  baseURL: config.public.apiBase,
  timeout: 5000,
})
```

`baseURL` contiene la parte común de las rutas.

`timeout: 5000` evita que Axios espere indefinidamente. El valor equivale a cinco segundos.

## Paso 5: proporcionar la instancia

Añade:

```ts
return {
  provide: {
    api,
  },
}
```

El archivo completo queda así:

```ts
import axios from 'axios'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = axios.create({
    baseURL: config.public.apiBase,
    timeout: 5000,
  })

  return {
    provide: {
      api,
    },
  }
})
```

Desde un componente podremos recuperar la instancia con:

```ts
const { $api } = useNuxtApp()
```

Nuxt añade el símbolo `$` al nombre proporcionado.

---

# 41. Convertir las tareas escritas en datos reactivos

Antes de realizar la petición, cambiaremos la lista repetida manualmente por datos de Vue.

Añade al principio de `app.vue`, antes del template:

```vue
<script setup lang="ts">
interface Task {
  id: number
  title: string
  done: boolean
}

const tasks = ref<Task[]>([
  {
    id: 1,
    title: 'Entender qué es una API',
    done: true,
  },
  {
    id: 2,
    title: 'Hacer mi primera petición HTTP',
    done: false,
  },
])
</script>
```

## Describir una tarea

La interfaz indica la forma esperada:

```text
id    → número
title → texto
done  → true o false
```

No crea datos ni valida el backend. Ayuda a TypeScript y al editor a detectar usos incorrectos.

## Crear un estado reactivo

```ts
const tasks = ref<Task[]>(...)
```

`ref` crea un estado reactivo. Cuando cambie su valor, Vue actualizará la parte de la interfaz que lo utiliza.

## Sustituir las tareas repetidas por `v-for`

Reemplaza los dos `<li>` por:

```vue
<li
  v-for="task in tasks"
  :key="task.id"
  class="task-item"
>
  <label class="task-content">
    <input
      type="checkbox"
      :checked="task.done"
      disabled
    >

    <span :class="{ completed: task.done }">
      {{ task.title }}
    </span>
  </label>

  <button
    class="delete-button"
    type="button"
    disabled
  >
    Eliminar
  </button>
</li>
```

## Repetir elementos

```vue
v-for="task in tasks"
```

crea un `<li>` por cada tarea del array.

```vue
:key="task.id"
```

proporciona a Vue un identificador estable para cada elemento.

## Enlazar atributos y clases

```vue
:checked="task.done"
```

hace que el checkbox dependa del valor booleano.

```vue
:class="{ completed: task.done }"
```

aplica la clase `completed` únicamente cuando `done` es `true`.

La interfaz debe seguir viéndose igual. La diferencia es que ahora el HTML se genera a partir de datos.

---

# 42. Realizar la primera petición `GET`

Ahora sustituiremos los datos de ejemplo por la respuesta de Express.

En `<script setup>`, recupera Axios y cambia el estado inicial:

```ts
const { $api } = useNuxtApp()

const tasks = ref<Task[]>([])
const loading = ref(false)
const errorMessage = ref('')
```

El array empieza vacío porque sus tareas llegarán desde el backend.

## Crear `loadTasks`

Añade:

```ts
async function loadTasks() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await $api.get<Task[]>('/tasks')

    tasks.value = response.data
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se han podido cargar las tareas.'
  } finally {
    loading.value = false
  }
}
```

## Enviar el GET

```ts
const response = await $api.get<Task[]>('/tasks')
```

Axios combina `baseURL` con `/tasks`.

`<Task[]>` indica que esperamos recibir un array de tareas.

## Guardar la respuesta

```ts
tasks.value = response.data
```

Axios coloca el cuerpo JSON en `response.data`.

Al asignarlo al `ref`, Vue vuelve a generar la lista.

## Ejecutar la función al montar el componente

Añade al final del script:

```ts
onMounted(() => {
  loadTasks()
})
```

`onMounted` se ejecuta cuando el componente ya se ha montado en el navegador.

---

# 43. Añadir carga, error, lista vacía y recarga

Una petición tarda un tiempo y puede fallar. La interfaz debe representar esas situaciones.

## Añadir el mensaje de error

Después del formulario añade:

```vue
<p
  v-if="errorMessage"
  class="error"
  role="alert"
>
  {{ errorMessage }}
</p>
```

`role="alert"` ayuda a que las tecnologías de asistencia anuncien el mensaje.

## Crear una barra para el título y la recarga

Sustituye el `<h2>` de la sección por:

```vue
<div class="toolbar">
  <h2>Tareas</h2>

  <button
    class="secondary-button"
    type="button"
    :disabled="loading"
    @click="loadTasks"
  >
    Recargar
  </button>
</div>
```

El botón utiliza la misma función que se ejecuta al abrir la página.

## Mostrar el estado adecuado

Antes de `<ul>` añade:

```vue
<p
  v-if="loading"
  class="status-message"
>
  Cargando tareas...
</p>

<p
  v-else-if="tasks.length === 0"
  class="status-message"
>
  No hay tareas.
</p>
```

Añade `v-else` a la lista:

```vue
<ul
  v-else
  class="task-list"
>
```

El orden será:

```text
Si loading es true:
    mostrar Cargando tareas...

Si ya no carga y el array está vacío:
    mostrar No hay tareas.

En caso contrario:
    mostrar la lista.
```

## Añadir sus estilos

```css
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar h2 {
  margin-bottom: 0;
}

.secondary-button {
  background: #e2e8f0;
  color: #334155;
}

.error {
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fee2e2;
  color: #991b1b;
}

.status-message {
  margin: 20px 0 0;
  color: #475569;
}
```

Ahora cada nuevo estado visual aparece junto con el código que lo necesita.

---

# 44. Ejecutar el primer GET desde Nuxt

Necesitas dos terminales de VS Code.

## Terminal del backend

```powershell
cd nuxt-express-axios\backend
npm run dev
```

## Terminal del frontend

```powershell
cd nuxt-express-axios\frontend
npm run dev
```

Abre:

```text
http://localhost:3000
```

Es posible que aparezca:

```text
No se han podido cargar las tareas.
```

No significa necesariamente que `loadTasks` esté mal escrita.

Antes de modificar código, observa los mensajes de las dos terminales, la consola del navegador y la pestaña Network. El siguiente bloque utiliza esas pistas para localizar el origen del problema.

---

# PARTE IV — OBSERVAR Y SOLUCIONAR CORS

# 45. Empezar la investigación por los mensajes y los logs

Cuando la primera petición falla, no conviene cambiar código al azar.

Revisa primero estos lugares:

```text
Terminal de Nuxt
└── Errores de compilación, TypeScript, imports o configuración.

Console del navegador
└── Errores JavaScript, Axios y mensajes de CORS.

Network → Fetch/XHR
└── URL, método, estado, cuerpo enviado y respuesta.

Terminal de Express
└── Errores de Node y peticiones que han llegado al backend.
```

## Pregunta inicial

```text
¿Dónde aparece el primer error?
```

Esto permite clasificar el problema.

### Nuxt no arranca

El problema está antes de la petición. Revisa la terminal del frontend, las importaciones y los archivos modificados.

### La página carga, pero Network no muestra una petición

Revisa si `loadTasks` se ejecuta, si `onMounted` está presente y si existe un error JavaScript anterior.

### Network muestra una petición bloqueada

Revisa la URL, el puerto, CORS y si Express está escuchando.

### Express muestra una excepción

La petición ha llegado al backend. Revisa el error de la terminal y la ruta que se estaba ejecutando.

## Registro opcional de peticiones en Express

Para ver inmediatamente si una petición llega al backend, puedes añadir temporalmente en `app.js`, antes de las rutas:

```js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`)
  next()
})
```

Al recargar Nuxt debería aparecer, si la petición alcanza Express:

```text
GET /api/tasks
```

No es obligatorio mantener este middleware. Su objetivo es ayudar durante la depuración.

---

# 46. Comparar navegador, Postman y la aplicación Nuxt

Haz ahora tres pruebas.

## Prueba 1: abrir la API directamente

Visita:

```text
http://localhost:3001/api/tasks
```

La lista debería aparecer.

## Prueba 2: enviar el GET desde Postman

```text
GET http://localhost:3001/api/tasks
```

La respuesta debería ser `200 OK`.

## Prueba 3: cargar la aplicación Nuxt

```text
http://localhost:3000
```

La petición realizada por Axios puede seguir fallando.

## Qué demuestra la comparación

Si la ruta funciona directamente y también desde Postman, Express está respondiendo.

La diferencia es que Axios se ejecuta dentro de una página cargada desde:

```text
http://localhost:3000
```

y quiere leer una respuesta de:

```text
http://localhost:3001
```

Los puertos son diferentes, por lo que el navegador considera que son orígenes distintos.

---

# 47. Identificar el error CORS

En la página de Nuxt abre:

```text
F12
```

Revisa:

```text
Console
Network → Fetch/XHR
```

Puedes encontrar un mensaje parecido a:

```text
Access to XMLHttpRequest at
'http://localhost:3001/api/tasks'
from origin
'http://localhost:3000'
has been blocked by CORS policy
```

La redacción exacta depende del navegador.

CORS es una política aplicada por el navegador.

El backend debe indicar expresamente que permite que la página situada en el puerto `3000` lea sus respuestas.

Postman no ejecuta la petición dentro de una página web, por lo que no aplica esta misma restricción.

---

# 48. Instalar `cors` cuando aparece la necesidad

Abre:

```text
backend/src/app.js
```

Añade temporalmente al principio:

```js
const cors = require('cors')
```

Guarda el archivo.

`nodemon` intentará reiniciar Express y mostrará un error parecido a:

```text
Error: Cannot find module 'cors'
```

El código necesita un paquete que todavía no está instalado.

Desde la terminal del backend ejecuta:

```powershell
npm install cors
```

Comprueba que `cors` aparece en `backend/package.json` dentro de `dependencies`.

La instalación vuelve a responder a una necesidad observada:

```text
El navegador bloquea la respuesta entre dos orígenes.
→ Express necesita enviar cabeceras CORS.
→ Instalamos el middleware cors.
```

---

# 49. Configurar CORS en Express

En `backend/.env` ya tenemos:

```env
FRONTEND_URL=http://localhost:3000
```

`server.js` carga las variables antes de importar `app.js`, por lo que la aplicación puede leer `process.env.FRONTEND_URL`.

Después de crear `app`, añade:

```js
const frontendUrl =
  process.env.FRONTEND_URL ||
  'http://localhost:3000'
```

Antes de `express.json()` y de las rutas, registra el middleware:

```js
app.use(
  cors({
    origin: frontendUrl,
  }),
)
```

El inicio de `app.js` quedará así:

```js
const express = require('express')
const cors = require('cors')

const tasksRouter = require('./routes/tasks.routes')

const app = express()

const frontendUrl =
  process.env.FRONTEND_URL ||
  'http://localhost:3000'

app.use(
  cors({
    origin: frontendUrl,
  }),
)

app.use(express.json())
```

## Por qué se registra antes de las rutas

Express procesa middleware y rutas en orden.

CORS debe participar antes de que una ruta envíe su respuesta para poder añadir una cabecera parecida a:

```text
Access-Control-Allow-Origin: http://localhost:3000
```

CORS no sustituye la validación, la autenticación ni la autorización. En este ejercicio solo permite que el navegador acepte la comunicación entre los dos orígenes locales.

---

# 50. Comprobar que el GET ya funciona

Vuelve a:

```text
http://localhost:3000
```

Recarga la página.

Ahora deberían aparecer las tareas devueltas por Express.

Abre:

```text
F12 → Network → Fetch/XHR
```

Selecciona la petición y comprueba:

```text
Request Method: GET
Status Code: 200
```

También puedes revisar la respuesta JSON.

El recorrido completo ha sido:

```text
Nuxt monta app.vue.
→ onMounted llama a loadTasks.
→ Axios envía GET /api/tasks.
→ Express devuelve un array JSON.
→ response.data contiene el array.
→ tasks.value recibe las tareas.
→ Vue genera un li por cada tarea.
→ El CSS presenta la lista que ya habíamos maquetado.
```

No actives todavía el resto de controles hasta que este GET funcione.

---

# PARTE V — ACTIVAR LA INTERFAZ PASO A PASO

# 51. Activar el formulario con `POST`

El formulario ya existe visualmente. Ahora añadiremos únicamente el estado y el comportamiento que necesita.

## Paso 1: guardar el texto y el estado de envío

En `<script setup>`, añade:

```ts
const newTitle = ref('')
const saving = ref(false)
```

## Paso 2: crear `createTask`

Añade después de `loadTasks`:

```ts
async function createTask() {
  const title = newTitle.value.trim()

  if (!title) {
    errorMessage.value = 'Escribe el título de la tarea.'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    const response = await $api.post<Task>('/tasks', {
      title,
    })

    tasks.value.push(response.data)
    newTitle.value = ''
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se ha podido crear la tarea.'
  } finally {
    saving.value = false
  }
}
```

## Paso 3: conectar el formulario

Sustituye su apertura por:

```vue
<form
  class="task-form"
  @submit.prevent="createTask"
>
```

Modifica el input:

```vue
<input
  id="task-title"
  v-model="newTitle"
  type="text"
  placeholder="Ejemplo: practicar una petición POST"
  :disabled="saving"
>
```

Y sustituye el botón desactivado por:

```vue
<button
  type="submit"
  :disabled="saving || !newTitle.trim()"
>
  {{ saving ? 'Guardando...' : 'Añadir' }}
</button>
```

## Qué hace `v-model`

```vue
v-model="newTitle"
```

mantiene sincronizados el contenido del input y `newTitle.value`.

## Qué hace `@submit.prevent`

Escucha el envío del formulario, evita la recarga completa del navegador y llama a `createTask`.

## Utilizar la respuesta real

```ts
tasks.value.push(response.data)
```

Añade a la interfaz la tarea confirmada por Express. Nuxt no inventa el ID.

Crea una tarea y comprueba en Network:

```text
POST /api/tasks
201 Created
```

El CSS del formulario y de los estados desactivados ya estaba preparado. En esta sección solo hemos añadido el comportamiento.

---

# 52. Activar el checkbox con `PATCH`

Ahora conectaremos el checkbox que habíamos maquetado.

## Paso 1: crear `toggleTask`

Añade:

```ts
async function toggleTask(task: Task) {
  errorMessage.value = ''

  try {
    const response = await $api.patch<Task>(
      `/tasks/${task.id}`,
      {
        done: !task.done,
      },
    )

    const index = tasks.value.findIndex(
      (currentTask) => currentTask.id === task.id,
    )

    if (index !== -1) {
      tasks.value[index] = response.data
    }
  } catch (error) {
    console.error(error)
    errorMessage.value =
      'No se ha podido actualizar la tarea.'
  }
}
```

## Paso 2: activar la casilla

Sustituye el checkbox por:

```vue
<input
  type="checkbox"
  :checked="task.done"
  @change="toggleTask(task)"
>
```

Ya no contiene `disabled`.

## Enviar el valor contrario

```ts
done: !task.done
```

invierte el booleano actual.

## Sustituir la tarea local

La API devuelve la tarea actualizada. Buscamos su posición con `findIndex` y guardamos esa respuesta en el array.

La clase visual que ya habíamos preparado continúa dependiendo de:

```vue
:class="{ completed: task.done }"
```

Marca o desmarca una tarea y comprueba:

```text
PATCH /api/tasks/:id
200 OK
```

---

# 53. Activar el botón de eliminación con `DELETE`

El último control pendiente es el botón rojo de cada tarea.

## Paso 1: crear `deleteTask`

Añade:

```ts
async function deleteTask(id: number) {
  errorMessage.value = ''

  try {
    await $api.delete(`/tasks/${id}`)

    tasks.value = tasks.value.filter((task) => {
      return task.id !== id
    })
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se ha podido eliminar la tarea.'
  }
}
```

## Paso 2: activar el botón

Sustituye el botón desactivado por:

```vue
<button
  class="delete-button"
  type="button"
  @click="deleteTask(task.id)"
>
  Eliminar
</button>
```

## Actualizar el array después de la respuesta

Express responde con:

```text
204 No Content
```

No esperamos datos JSON.

Después creamos un array que conserva todas las tareas excepto la eliminada:

```ts
tasks.value = tasks.value.filter((task) => {
  return task.id !== id
})
```

Pulsa **Eliminar** y comprueba:

```text
DELETE /api/tasks/:id
204 No Content
```

El botón no ha necesitado estilos nuevos porque se diseñó antes de añadir su comportamiento.

---

# 54. Comprobar el `app.vue` completo

Este bloque es un punto de comprobación. No introduce de golpe elementos nuevos: reúne el HTML, la lógica y el CSS construidos en las secciones anteriores.

```vue
<script setup lang="ts">
interface Task {
  id: number
  title: string
  done: boolean
}

const { $api } = useNuxtApp()

const tasks = ref<Task[]>([])
const newTitle = ref('')

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

async function loadTasks() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await $api.get<Task[]>('/tasks')

    tasks.value = response.data
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se han podido cargar las tareas.'
  } finally {
    loading.value = false
  }
}

async function createTask() {
  const title = newTitle.value.trim()

  if (!title) {
    errorMessage.value = 'Escribe el título de la tarea.'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    const response = await $api.post<Task>('/tasks', {
      title,
    })

    tasks.value.push(response.data)
    newTitle.value = ''
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se ha podido crear la tarea.'
  } finally {
    saving.value = false
  }
}

async function toggleTask(task: Task) {
  errorMessage.value = ''

  try {
    const response = await $api.patch<Task>(
      `/tasks/${task.id}`,
      {
        done: !task.done,
      },
    )

    const index = tasks.value.findIndex(
      (currentTask) => currentTask.id === task.id,
    )

    if (index !== -1) {
      tasks.value[index] = response.data
    }
  } catch (error) {
    console.error(error)
    errorMessage.value =
      'No se ha podido actualizar la tarea.'
  }
}

async function deleteTask(id: number) {
  errorMessage.value = ''

  try {
    await $api.delete(`/tasks/${id}`)

    tasks.value = tasks.value.filter((task) => {
      return task.id !== id
    })
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se ha podido eliminar la tarea.'
  }
}

onMounted(() => {
  loadTasks()
})
</script>

<template>
  <main class="page">
    <section class="card">
      <header class="app-header">
        <p class="eyebrow">
          Comunicación frontend-backend
        </p>

        <h1>Nuxt + Express + Axios</h1>

        <p class="description">
          Nuxt muestra la interfaz, Axios realiza las
          peticiones y Express procesa la API.
        </p>
      </header>

      <form
        class="task-form"
        @submit.prevent="createTask"
      >
        <label for="task-title">
          Nueva tarea
        </label>

        <div class="form-row">
          <input
            id="task-title"
            v-model="newTitle"
            type="text"
            placeholder="Ejemplo: practicar una petición POST"
            :disabled="saving"
          >

          <button
            type="submit"
            :disabled="saving || !newTitle.trim()"
          >
            {{ saving ? 'Guardando...' : 'Añadir' }}
          </button>
        </div>
      </form>

      <p
        v-if="errorMessage"
        class="error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <section class="tasks-section">
        <div class="toolbar">
          <h2>Tareas</h2>

          <button
            class="secondary-button"
            type="button"
            :disabled="loading"
            @click="loadTasks"
          >
            Recargar
          </button>
        </div>

        <p
          v-if="loading"
          class="status-message"
        >
          Cargando tareas...
        </p>

        <p
          v-else-if="tasks.length === 0"
          class="status-message"
        >
          No hay tareas.
        </p>

        <ul
          v-else
          class="task-list"
        >
          <li
            v-for="task in tasks"
            :key="task.id"
            class="task-item"
          >
            <label class="task-content">
              <input
                type="checkbox"
                :checked="task.done"
                @change="toggleTask(task)"
              >

              <span :class="{ completed: task.done }">
                {{ task.title }}
              </span>
            </label>

            <button
              class="delete-button"
              type="button"
              @click="deleteTask(task.id)"
            >
              Eliminar
            </button>
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.page {
  min-height: 100vh;
  padding: 48px 20px;
  background: #f1f5f9;
  color: #0f172a;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}

.card {
  width: min(720px, 100%);
  margin: 0 auto;
  padding: 32px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgb(15 23 42 / 8%);
}

.app-header {
  margin-bottom: 32px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #4f46e5;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

h1,
h2,
p {
  margin-top: 0;
}

.description {
  margin-bottom: 0;
  color: #475569;
  line-height: 1.6;
}

.task-form {
  margin-bottom: 28px;
}

.task-form > label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
}

.form-row {
  display: flex;
  gap: 12px;
}

input[type='text'] {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font: inherit;
}

input[type='text']:focus {
  border-color: #4f46e5;
  outline: 3px solid rgb(79 70 229 / 15%);
}

button {
  padding: 11px 16px;
  border: 0;
  border-radius: 8px;
  background: #4f46e5;
  color: white;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar h2 {
  margin-bottom: 0;
}

.secondary-button {
  background: #e2e8f0;
  color: #334155;
}

.error {
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fee2e2;
  color: #991b1b;
}

.status-message {
  margin: 20px 0 0;
  color: #475569;
}

.task-list {
  display: grid;
  gap: 12px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.task-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-content input {
  width: 18px;
  height: 18px;
  accent-color: #4f46e5;
}

.completed {
  color: #64748b;
  text-decoration: line-through;
}

.delete-button {
  background: #dc2626;
}

@media (max-width: 560px) {
  .page {
    padding: 24px 14px;
  }

  .card {
    padding: 22px;
  }

  .form-row {
    flex-direction: column;
  }

  .task-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .delete-button {
    width: 100%;
  }
}
</style>
```

---

# 55. Revisar cómo se ha construido el frontend

La interfaz no apareció completa de una sola vez.

El recorrido ha sido:

```text
main y fondo de página
→ tarjeta
→ encabezado
→ lista sencilla
→ checkbox
→ estado completado
→ botón de eliminación
→ formulario
→ adaptación responsive
→ datos reactivos con ref y v-for
→ instalación de Axios al necesitar una petición
→ GET y estados de carga
→ POST del formulario
→ PATCH del checkbox
→ DELETE del botón
```

Cada capa tiene una responsabilidad distinta.

## HTML

Define la estructura y el significado de la interfaz:

```text
main
section
header
form
label
input
button
ul
li
```

## CSS

Controla la presentación:

```text
Tamaños y espacios.
Colores y bordes.
Distribución con Flexbox y Grid.
Estados desactivados.
Tarea completada.
Adaptación a pantallas pequeñas.
```

## Vue

Relaciona la estructura con los datos y los eventos:

```text
ref
v-for
v-if y v-else-if
v-model
:checked
:class
@click
@change
@submit.prevent
```

## Axios

Realiza las peticiones HTTP, pero no actualiza la página directamente.

```text
Axios obtiene una respuesta.
→ El código modifica un ref.
→ Vue detecta el cambio.
→ Vue vuelve a renderizar el HTML necesario.
→ El CSS presenta el nuevo estado.
```

Esta separación permite identificar mejor qué parte revisar cuando algo no funciona.

---

# PARTE VI — ENTENDER Y DEPURAR LA COMUNICACIÓN

# 56. Resumen de las cuatro operaciones

## Leer

```text
Nuxt ejecuta loadTasks.
→ Axios envía GET /tasks.
→ Express devuelve un array.
→ response.data contiene las tareas.
→ tasks.value recibe el array.
→ Vue muestra la lista.
```

## Crear

```text
La persona envía el formulario.
→ createTask lee newTitle.
→ Axios envía POST /tasks con JSON.
→ Express valida y crea la tarea.
→ Express responde 201 con la tarea creada.
→ Nuxt añade response.data al array.
```

## Actualizar

```text
La persona cambia el checkbox.
→ toggleTask invierte done.
→ Axios envía PATCH /tasks/:id.
→ Express actualiza la tarea.
→ Nuxt sustituye la tarea local.
```

## Eliminar

```text
La persona pulsa Eliminar.
→ Axios envía DELETE /tasks/:id.
→ Express responde 204.
→ Nuxt filtra la tarea del array.
```

---

# 57. Recordar la diferencia entre Axios y Vue

Axios realiza la comunicación:

```ts
const response = await $api.get('/tasks')
```

Pero la interfaz cambia cuando modificamos el estado:

```ts
tasks.value = response.data
```

La secuencia es:

```text
Axios obtiene datos.
→ Nuestro código cambia un ref.
→ Vue detecta el cambio.
→ Vue actualiza el DOM.
```

---

# 58. `async`, `await`, `try`, `catch` y `finally`

## `async`

Una función marcada como `async` puede utilizar `await` y devuelve una promesa.

## `await`

```ts
await $api.get('/tasks')
```

espera a que la petición termine dentro de esa función.

La respuesta puede tardar porque tiene que viajar hasta otro proceso.

## `try`

Contiene la operación que puede fallar.

## `catch`

Se ejecuta si Axios no consigue completar la petición correctamente.

## `finally`

Se ejecuta tanto si la operación funciona como si falla.

Por eso es útil para terminar un estado de carga:

```ts
finally {
  loading.value = false
}
```

---

# 59. Utilizar Network para analizar las peticiones

Network no es el único lugar que debemos revisar, pero es la herramienta principal para estudiar una petición HTTP enviada por Axios.

Abre:

```text
F12 → Network → Fetch/XHR
```

Realiza cada acción y busca su petición.

| Acción | Método esperado | Estado esperado |
|---|---|---|
| Abrir o recargar | `GET` | `200` |
| Crear | `POST` | `201` |
| Cambiar estado | `PATCH` | `200` |
| Eliminar | `DELETE` | `204` |

Para cada petición revisa:

- Request URL.
- Request Method.
- Status Code.
- Payload o cuerpo enviado.
- Response o cuerpo recibido.
- Response Headers.

Network permite responder preguntas concretas:

```text
¿La función del frontend llegó a enviar una petición?
¿La URL utilizada es la esperada?
¿El método es correcto?
¿El JSON enviado es correcto?
¿Express respondió?
¿Qué código y qué datos devolvió?
```

Sin embargo, un error puede aparecer antes de que exista una petición. Por eso la estrategia completa comienza revisando los mensajes de las terminales y de la consola.

---

# 60. Estrategia de depuración: localizar primero dónde falla

Cuando algo no funcione, evita modificar código al azar.

El primer objetivo no es solucionar inmediatamente el error. Primero debemos descubrir en qué parte del recorrido aparece:

```text
Interfaz Vue
→ función del componente
→ Axios
→ navegador y red
→ Express
→ ruta y validación
```

## Paso 1: revisar los mensajes disponibles

Observa primero estos lugares.

### Terminal de Nuxt

Puede mostrar:

- Errores de compilación.
- Errores de TypeScript.
- Importaciones inexistentes.
- Problemas en `nuxt.config.ts`.
- Fallos al cargar un plugin.

Si Nuxt no arranca, todavía no tiene sentido buscar la petición en Network.

### Consola del navegador

Puede mostrar:

- Errores JavaScript.
- Errores producidos dentro de una función Vue.
- Mensajes de Axios.
- Bloqueos CORS.

### Network del navegador

Permite comprobar si la petición salió y qué respuesta recibió.

### Terminal de Express

Puede mostrar:

- Errores al arrancar Node.
- Módulos que no están instalados.
- Excepciones producidas dentro de una ruta.
- Reinicios y cierres de `nodemon`.

Lee el primer error relevante completo. Un mensaje posterior puede ser solamente una consecuencia del error inicial.

## Paso 2: clasificar el problema

Hazte estas preguntas en orden:

```text
¿Nuxt y Express siguen ejecutándose?
¿La acción de la interfaz ejecutó una función?
¿Axios llegó a crear una petición?
¿La petición llegó al backend?
¿Express devolvió una respuesta?
¿Qué código de estado devolvió?
```

### Posible error del frontend

Ejemplos:

- Nuxt no compila.
- Un botón no ejecuta su función.
- Aparece una excepción JavaScript.
- No se crea ninguna petición en Network.

Revisa la terminal de Nuxt, la consola y el código del componente.

### Posible error de comunicación

Ejemplos:

- Axios utiliza una URL incorrecta.
- La petición queda pendiente.
- Aparece un error CORS.
- El backend no está escuchando en el puerto esperado.

Revisa Network, `apiBase`, los procesos y los puertos.

### Posible error del backend

Ejemplos:

- Express muestra una excepción.
- La respuesta es `400`, `404` o `500`.
- La ruta recibe datos diferentes a los esperados.

Revisa la terminal de Express, la ruta, los parámetros y `req.body`.

## Paso 3: comprobar la salud del backend

Abre:

```text
http://localhost:3001/api/health
```

Si no responde, revisa primero el proceso de Express y su terminal.

## Paso 4: probar la misma ruta con Postman

Por ejemplo:

```text
GET http://localhost:3001/api/tasks
```

La comparación permite aislar el problema:

```text
Si Postman también falla:
    revisa el backend, la ruta o los datos enviados.

Si Postman funciona y Nuxt falla:
    revisa Axios, la URL, CORS o el código del frontend.
```

## Paso 5: revisar la petición concreta en Network

Comprueba:

- La URL real utilizada.
- El método.
- El cuerpo enviado.
- El código de estado.
- La respuesta.

No basta con saber que una petición ha fallado. Hay que comprobar qué petición se envió realmente.

## Paso 6: revisar la configuración

Frontend:

```env
NUXT_PUBLIC_API_BASE=http://localhost:3001/api
```

Backend:

```env
FRONTEND_URL=http://localhost:3000
```

Después de modificar `.env` o `nuxt.config.ts`, reinicia el proceso correspondiente si el cambio no se aplica.

## Registro opcional de peticiones en Express

Durante una práctica puede resultar útil comprobar si una petición ha llegado al backend.

Antes de las rutas puedes añadir temporalmente:

```js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`)
  next()
})
```

La terminal mostrará mensajes como:

```text
GET /api/tasks
POST /api/tasks
PATCH /api/tasks/2
DELETE /api/tasks/2
```

Este middleware no sustituye Network. Aporta otra perspectiva:

```text
Network
└── Muestra lo que observa el navegador.

Terminal de Express
└── Confirma lo que ha recibido el backend.
```

Puedes retirarlo cuando ya no lo necesites.

---

# PARTE VII — DOCKER COMPOSE OPCIONAL

# 61. Cuándo añadir Docker

No añadas Docker hasta que funcionen estas pruebas en local:

```text
GET desde el navegador.
GET y POST desde Postman.
Nuxt muestra las tareas.
Nuxt crea tareas.
Nuxt cambia su estado.
Nuxt elimina tareas.
```

Docker cambia el entorno donde se ejecutan los procesos.

No corrige:

- Una ruta incorrecta.
- Un error JavaScript.
- Una variable mal escrita.
- Un paquete ausente.
- Una configuración CORS incorrecta.

---

# 62. Dockerfile del backend

Crea:

```text
backend/Dockerfile
```

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
```

Crea:

```text
backend/.dockerignore
```

```text
node_modules
npm-debug.log
coverage
.env
```

`npm ci` utiliza las versiones registradas en `package-lock.json`.

---

# 63. Dockerfile del frontend

Crea:

```text
frontend/Dockerfile
```

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

Crea:

```text
frontend/.dockerignore
```

```text
node_modules
.nuxt
.output
npm-debug.log
.env
```

`--host 0.0.0.0` permite acceder al servidor de desarrollo desde fuera del contenedor.

---

# 64. Crear `compose.yaml`

En la carpeta principal del ejercicio crea:

```text
compose.yaml
```

```yaml
services:
  backend:
    build:
      context: ./backend
    ports:
      - "3001:3001"
    environment:
      PORT: 3001
      FRONTEND_URL: http://localhost:3000
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    environment:
      NUXT_PUBLIC_API_BASE: http://localhost:3001/api
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
```

Arranca los servicios:

```powershell
docker compose up --build
```

Detén los servicios:

```powershell
docker compose down
```

---

# 65. Mantener la dirección pública de la API

En este ejemplo conserva:

```env
NUXT_PUBLIC_API_BASE=http://localhost:3001/api
```

Es la dirección publicada para acceder a Express desde el navegador del ordenador.

No es necesario profundizar todavía en los nombres internos de la red de Docker Compose. Esa diferencia se explicará en el siguiente tutorial, cuando el backend tenga que comunicarse con un servicio de base de datos dentro de Compose y podamos comparar claramente ambos recorridos.

Por ahora basta con comprobar que, después de ejecutar:

```powershell
docker compose up --build
```

puedes abrir:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:3001/api/health
```

---

# PARTE VIII — EJERCICIOS Y CIERRE

# 66. Ejercicios para consolidar este tutorial

## Ejercicio 1: obtener una sola tarea

Añade al backend:

```text
GET /api/tasks/:id
```

Debe:

- Convertir el ID a número.
- Buscar la tarea.
- Responder `404` si no existe.
- Responder `200` con la tarea si existe.

Prueba primero la ruta en Postman.

## Ejercicio 2: permitir cambiar el título

Amplía `PATCH` para aceptar:

```json
{
  "title": "Nuevo título"
}
```

Valida que sea un texto no vacío.

## Ejercicio 3: filtrar en el frontend

Añade botones para mostrar:

```text
Todas
Pendientes
Completadas
```

Este ejercicio se puede resolver modificando únicamente el array que se muestra, sin cambiar Express.

## Ejercicio 4: provocar errores deliberadamente

Prueba estas situaciones:

- Apagar Express.
- Cambiar el puerto del frontend.
- Eliminar temporalmente CORS.
- Enviar un título vacío desde Postman.
- Eliminar una tarea inexistente.

Para cada error responde:

```text
¿La petición salió?
¿Hubo respuesta HTTP?
¿Qué código apareció?
¿Qué muestra Network?
¿Qué muestra la terminal del backend?
```

---

# 67. Qué se deja para el siguiente tutorial

Este tutorial se concentra en el ciclo completo de una petición y mantiene el código en pocos archivos para que sea fácil seguirlo.

El siguiente tutorial podrá partir de esta aplicación para introducir, de forma progresiva:

- Persistencia en una base de datos.
- Comunicación entre servicios dentro de Docker Compose.
- Diferencia entre direcciones públicas del navegador y nombres internos de Compose.
- Separación del backend en controladores y servicios.
- Organización del frontend en componentes.
- Separación de las llamadas Axios del componente visual.
- Composables para reutilizar estado y comportamiento.

No hemos adelantado esas capas aquí porque primero era necesario comprender qué ocurre dentro de cada operación.

---

# 68. Resumen mental

## Petición

```text
Método
+ URL
+ cabeceras
+ cuerpo opcional
```

## Respuesta

```text
Código de estado
+ cabeceras
+ cuerpo opcional
```

## Flujo completo

```text
Evento de la persona
→ función de Vue
→ petición Axios
→ middleware Express
→ ruta del backend
→ validación y operación
→ respuesta HTTP
→ response.data cuando existe
→ modificación de un ref
→ actualización de la interfaz
```

## Responsabilidades actuales

```text
Nuxt y Vue
└── Interfaz y estado reactivo.

Axios
└── Comunicación HTTP desde el frontend.

Express
└── Rutas, validaciones y respuestas del backend.

Postman
└── Pruebas manuales de la API.

nodemon
└── Reinicio automático del backend en desarrollo.

dotenv
└── Carga de variables del archivo .env.

cors
└── Permiso para que el navegador lea respuestas de otro origen.
```

---

# 69. Fuentes oficiales de consulta

- [Nuxt 4: instalación](https://nuxt.com/docs/4.x/getting-started/installation)
- [Nuxt 4: estructura de directorios](https://nuxt.com/docs/4.x/directory-structure)
- [Nuxt 4: configuración](https://nuxt.com/docs/4.x/getting-started/configuration)
- [Nuxt 4: plugins](https://nuxt.com/docs/4.x/directory-structure/app/plugins)
- [Nuxt 4: runtimeConfig](https://nuxt.com/docs/4.x/guide/going-further/runtime-config)
- [Axios](https://axios-http.com/docs/intro)
- [Express](https://expressjs.com/)
- [Express: middleware CORS](https://expressjs.com/en/resources/middleware/cors.html)
- [Postman: enviar peticiones](https://learning.postman.com/docs/use/send-requests/requests)
- [Docker Compose: redes](https://docs.docker.com/compose/how-tos/networking/)

---

# Conclusión

La idea principal del ejercicio es poder seguir una petición de principio a fin.

```text
La persona pulsa un botón.
→ Vue ejecuta una función.
→ Axios envía una petición.
→ Express procesa una ruta.
→ El backend devuelve una respuesta.
→ Nuxt modifica el estado.
→ Vue actualiza la pantalla.
```

Cuando este recorrido se entiende, resulta mucho más sencillo añadir después una base de datos y separar el código en más capas, porque cada nueva pieza tendrá una responsabilidad concreta dentro de un flujo que ya conocemos.
