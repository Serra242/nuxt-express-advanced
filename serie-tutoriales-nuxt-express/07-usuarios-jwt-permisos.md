# Tutorial 7: Usuarios, migraciones, JWT y permisos

La aplicación de tareas ya utiliza una arquitectura por capas en backend y frontend.

Ahora añadiremos un dominio nuevo: usuarios.

Este cambio presenta un problema que todavía no habíamos tenido:

```text
La base de datos ya existe.
-> contiene tareas.
-> no queremos eliminar el volumen.
-> necesitamos añadir una tabla nueva.
```

Ese es el momento adecuado para introducir migraciones.

Después construiremos:

```text
users
-> contraseñas con hash
-> login
-> JWT
-> autenticación
-> permisos
-> sesión en Nuxt
-> rutas protegidas
```

No utilizaremos ningún dominio específico del proyecto de destino.

---

# 1. Cuándo se considera terminado

```text
Una migración añade la tabla users sin borrar tasks.
El SQL de instalación inicial queda actualizado.
Existe un usuario administrador inicial.
Las contraseñas se guardan como hash.
POST /api/auth/login entrega un JWT válido.
GET /api/auth/me restaura la identidad.
GET /api/users requiere autenticación y permiso.
POST /api/users requiere permiso administrativo.
Los serializers nunca devuelven password_hash.
Nuxt dispone de página de login.
La sesión se restaura al recargar.
Una ruta administrativa está protegida.
Cerrar sesión elimina el token local.
```

---

# 2. Alcance de seguridad

Este tutorial enseña el recorrido de JWT y permisos. Para mantener el foco, el token se guardará en `localStorage` y se enviará mediante `Authorization: Bearer`.

Eso permite comprender:

- Emisión del token.
- Verificación.
- Restauración de sesión.
- Protección de rutas.

Pero tiene una limitación importante:

```text
JavaScript puede leer localStorage.
-> una vulnerabilidad XSS podría robar el token.
```

En una aplicación con requisitos elevados se debe valorar una estrategia con cookies `HttpOnly`, protección CSRF, rotación de tokens y políticas de sesión. No presentaremos este ejercicio como una solución completa de producción.

---

# PARTE I — EVOLUCIONAR UNA BASE EXISTENTE

# 3. Por qué `init.sql` ya no es suficiente

Los scripts de inicialización solo se ejecutan cuando el volumen está vacío.

Tenemos dos situaciones:

```text
Instalación nueva
-> init SQL crea toda la estructura actual.

Base existente
-> una migración aplica únicamente el cambio pendiente.
```

Mantendremos ambos caminos:

```text
init/
└── esquema completo para instalaciones nuevas.

migrations/
└── evolución ordenada para bases existentes.
```

---

# 4. Instalar Sequelize CLI

Dentro de `backend`:

```powershell
npm install -D sequelize-cli
```

Añade scripts:

```json
"scripts": {
  "dev": "nodemon --watch src --ext js --exec node src/app/server.js",
  "start": "node src/app/server.js",
  "test": "node --test",
  "migrate": "sequelize-cli db:migrate",
  "migrate:undo": "sequelize-cli db:migrate:undo",
  "seed:admin": "node scripts/seed-admin.js"
}
```

---

# 5. Configurar las rutas de Sequelize CLI

Crea:

```text
backend/.sequelizerc
```

```js
const path = require('node:path')

module.exports = {
  config: path.resolve(
    'src/config/sequelize.config.js',
  ),
  'migrations-path': path.resolve(
    'src/migrations',
  ),
  'models-path': path.resolve('src/models'),
}
```

Crea:

```text
backend/src/config/sequelize.config.js
```

```js
require('dotenv').config()

const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  dialect: 'postgres',
  logging: false,
}

module.exports = {
  development: baseConfig,
  test: {
    ...baseConfig,
    database:
      process.env.DB_TEST_NAME || 'tasks_test',
  },
  production: baseConfig,
}
```

Sequelize CLI utiliza `NODE_ENV` para elegir una configuración.

---

# 6. Generar la migración

```powershell
npx sequelize-cli migration:generate --name create-users
```

Se creará un archivo con marca temporal dentro de:

```text
backend/src/migrations/
```

Abre el archivo generado.

---

# 7. Definir la tabla `users`

Sustituye su contenido por:

```js
module.exports = {
  async up(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT to_regclass('public.users') AS table_name",
    )

    if (rows[0].table_name) {
      return
    }

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'user',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP',
        ),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP',
        ),
      },
    })
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT to_regclass('public.users') AS table_name",
    )

    if (rows[0].table_name) {
      await queryInterface.dropTable('users')
    }
  },
}
```

La migración describe dos direcciones:

```text
up
└── aplicar el cambio.

down
└── revertir el cambio.
```

---

# 8. Ejecutar la migración

Con PostgreSQL levantado:

```powershell
npm run migrate
```

Comprueba en pgAdmin:

```text
public
  -> Tables
    -> tasks
    -> users
    -> SequelizeMeta
```

`SequelizeMeta` registra qué migraciones se han ejecutado.

La tabla `tasks` y sus filas deben seguir existiendo.

---

# 9. Actualizar la instalación inicial

Una base nueva no debería necesitar ejecutar todas las decisiones históricas para conocer el esquema base del ejercicio.

Crea:

```text
init/02_create_users.sql
```

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Ahora:

```text
Base existente
-> migration create-users.

Base nueva
-> 01_create_tasks.sql + 02_create_users.sql.
```

No elimines el volumen solo para comprobar este punto salvo que hayas guardado los datos que quieras conservar.

---

# PARTE II — MODELO Y REPOSITORIO DE USUARIOS

# 10. Instalar hash y JWT cuando aparecen

Dentro de `backend`:

```powershell
npm install bcryptjs jsonwebtoken
```

Responsabilidades:

```text
bcryptjs
└── crea y compara hashes de contraseña.

jsonwebtoken
└── firma y verifica JWT.
```

Nunca guardaremos una contraseña en texto plano.

---

# 11. Añadir variables de autenticación

Amplía `backend/.env.example` y `.env`:

```env
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=2h

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

En un entorno real:

- `JWT_SECRET` debe ser largo, aleatorio y privado.
- La contraseña inicial no debe mantenerse como ejemplo real.
- Los secretos no se suben a Git.

---

# 12. Crear el modelo `User`

```text
backend/src/models/user.model.js
```

```js
const { DataTypes } = require('sequelize')
const {
  sequelize,
} = require('../database/sequelize')

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'user',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
  },
)

module.exports = User
```

---

# 13. Crear el repositorio

```text
backend/src/repositories/user.repository.js
```

```js
const User = require('../models/user.model')

async function findAll() {
  return User.findAll({
    order: [['id', 'ASC']],
  })
}

async function findById(id) {
  return User.findByPk(id)
}

async function findByEmail(email) {
  return User.findOne({
    where: { email },
  })
}

async function create(values) {
  return User.create(values)
}

module.exports = {
  findAll,
  findById,
  findByEmail,
  create,
}
```

---

# PARTE III — CREAR EL ADMINISTRADOR INICIAL

# 14. Por qué necesitamos un seed operativo

La API de usuarios estará protegida. Necesitamos una primera identidad administrativa para iniciar sesión.

No escribiremos un hash a mano dentro del SQL. Crearemos un script que:

```text
lee variables
-> genera hash
-> crea el admin si no existe
```

---

# 15. Crear `seed-admin.js`

Crea:

```text
backend/scripts/seed-admin.js
```

```js
require('dotenv').config()

const bcrypt = require('bcryptjs')
const {
  connectDatabase,
  sequelize,
} = require('../src/database/sequelize')
const User = require('../src/models/user.model')

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL
    ?.trim()
    .toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL y ADMIN_PASSWORD son obligatorios',
    )
  }

  await connectDatabase()

  const existing = await User.findOne({
    where: { email },
  })

  if (existing) {
    console.log('El administrador ya existe')
    return
  }

  const passwordHash = await bcrypt.hash(
    password,
    12,
  )

  await User.create({
    email,
    passwordHash,
    role: 'admin',
    isActive: true,
  })

  console.log('Administrador creado')
}

seedAdmin()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await sequelize.close()
  })
```

Ejecuta:

```powershell
npm run seed:admin
```

En pgAdmin observa que existe `password_hash`, pero no contiene la contraseña original.

---

# PARTE IV — PERMISOS Y SERIALIZERS

# 16. Definir permisos por rol

Crea:

```text
backend/src/config/permissions.config.js
```

```js
const rolePermissions = {
  admin: [
    'users:read',
    'users:create',
    'tasks:read',
    'tasks:write',
  ],
  user: [
    'tasks:read',
    'tasks:write',
    'profile:read',
  ],
}

function getPermissionsForRole(role) {
  return rolePermissions[role] ?? []
}

module.exports = {
  getPermissionsForRole,
}
```

Esta versión didáctica mantiene los permisos en código. Un sistema mayor puede almacenarlos en tablas relacionadas.

---

# 17. Crear serializers seguros

```text
backend/src/serializers/user/user.serializer.js
```

```js
const {
  getPermissionsForRole,
} = require('../../config/permissions.config')

function toPlain(user) {
  if (!user) {
    return undefined
  }

  return user.get
    ? user.get({ plain: true })
    : user
}

function userPublic(user) {
  const value = toPlain(user)

  if (!value) {
    return undefined
  }

  return {
    id: value.id,
    email: value.email,
    role: value.role,
    isActive: value.isActive,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function userSession(user) {
  const value = userPublic(user)

  if (!value) {
    return undefined
  }

  return {
    ...value,
    permissions: getPermissionsForRole(value.role),
  }
}

module.exports = {
  userPublic,
  userSession,
}
```

No aparece:

```text
password
passwordHash
password_hash
JWT secret
```

Crea el `index.js` correspondiente.

---

# PARTE V — VALIDADORES Y DTO

# 18. Crear esquemas de autenticación y usuarios

Crea:

```text
backend/src/validators/auth.schema.js
```

```js
const { z } = require('zod')

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(255)

const passwordSchema = z
  .string()
  .min(10)
  .max(128)

const loginRequestSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      password: z.string().min(1).max(128),
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
})

const createUserRequestSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      password: passwordSchema,
      role: z.enum(['admin', 'user']),
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
})

module.exports = {
  loginRequestSchema,
  createUserRequestSchema,
}
```

---

# 19. Crear DTO

```text
backend/src/dtos/auth.dto.js
```

```js
function loginDto(validated) {
  return Object.freeze({
    email: validated.body.email,
    password: validated.body.password,
  })
}

function createUserDto(validated) {
  return Object.freeze({
    email: validated.body.email,
    password: validated.body.password,
    role: validated.body.role,
  })
}

module.exports = {
  loginDto,
  createUserDto,
}
```

El DTO transporta la contraseña solo durante la operación necesaria. No se registra ni se serializa.

---

# PARTE VI — SERVICIO DE AUTENTICACIÓN

# 20. Crear utilidades JWT

```text
backend/src/utils/jwt.js
```

```js
const jwt = require('jsonwebtoken')

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    },
  )
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
}
```

El token contiene una identidad mínima. No incluyas contraseñas ni datos sensibles.

---

# 21. Crear `auth.service.js`

```text
backend/src/services/auth.service.js
```

```js
const bcrypt = require('bcryptjs')
const userRepository = require(
  '../repositories/user.repository'
)
const {
  signAccessToken,
} = require('../utils/jwt')

async function login(dto) {
  const user = await userRepository.findByEmail(
    dto.email,
  )

  if (!user || !user.isActive) {
    return null
  }

  const matches = await bcrypt.compare(
    dto.password,
    user.passwordHash,
  )

  if (!matches) {
    return null
  }

  return {
    user,
    token: signAccessToken(user),
  }
}

module.exports = {
  login,
}
```

Tanto un correo inexistente como una contraseña incorrecta devolverán el mismo resultado. Esto evita revelar qué cuentas existen.

---

# 22. Crear el servicio de usuarios

```text
backend/src/services/user.service.js
```

```js
const bcrypt = require('bcryptjs')
const userRepository = require(
  '../repositories/user.repository'
)

async function getUsers() {
  return userRepository.findAll()
}

async function createUser(dto) {
  const existing = await userRepository.findByEmail(
    dto.email,
  )

  if (existing) {
    return {
      conflict: true,
      user: null,
    }
  }

  const passwordHash = await bcrypt.hash(
    dto.password,
    12,
  )

  const user = await userRepository.create({
    email: dto.email,
    passwordHash,
    role: dto.role,
    isActive: true,
  })

  return {
    conflict: false,
    user,
  }
}

module.exports = {
  getUsers,
  createUser,
}
```

El repositorio recibe el hash, nunca la contraseña original.

---

# PARTE VII — MIDDLEWARE DE AUTENTICACIÓN Y PERMISOS

# 23. Crear `authenticate`

```text
backend/src/middleware/authenticate.middleware.js
```

```js
const {
  verifyAccessToken,
} = require('../utils/jwt')
const userRepository = require(
  '../repositories/user.repository'
)
const {
  getPermissionsForRole,
} = require('../config/permissions.config')

async function authenticate(req, res, next) {
  const authorization = req.get('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authentication required',
    })
  }

  const token = authorization.slice(7)

  try {
    const payload = verifyAccessToken(token)
    const user = await userRepository.findById(
      Number(payload.sub),
    )

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Authentication required',
      })
    }

    req.auth = {
      user,
      permissions: getPermissionsForRole(
        user.role,
      ),
    }

    return next()
  } catch (error) {
    console.error('JWT no válido', error.message)

    return res.status(401).json({
      message: 'Authentication required',
    })
  }
}

module.exports = authenticate
```

El middleware no confía únicamente en que el token esté bien firmado. También comprueba que el usuario siga existiendo y esté activo.

---

# 24. Crear `requirePermission`

```text
backend/src/middleware/require-permission.middleware.js
```

```js
function requirePermission(permission) {
  return (req, res, next) => {
    const permissions = req.auth?.permissions ?? []

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        message: 'Forbidden',
      })
    }

    return next()
  }
}

module.exports = requirePermission
```

Diferencia:

```text
401 Unauthorized
└── no existe una autenticación válida.

403 Forbidden
└── la identidad es válida, pero no tiene permiso.
```

---

# PARTE VIII — CONTROLADORES Y RUTAS

# 25. Crear el controlador de autenticación

```text
backend/src/controllers/auth.controller.js
```

```js
const authService = require('../services/auth.service')
const {
  loginDto,
} = require('../dtos/auth.dto')
const {
  userSession,
} = require('../serializers/user')

async function login(req, res) {
  const dto = loginDto(req.validated)

  try {
    const result = await authService.login(dto)

    if (!result) {
      return res.status(401).json({
        message: 'Invalid credentials',
      })
    }

    return res.json({
      token: result.token,
      user: userSession(result.user),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Login could not be completed',
    })
  }
}

async function me(req, res) {
  return res.json(userSession(req.auth.user))
}

module.exports = {
  login,
  me,
}
```

---

# 26. Crear el controlador de usuarios

```text
backend/src/controllers/user.controller.js
```

```js
const userService = require('../services/user.service')
const {
  createUserDto,
} = require('../dtos/auth.dto')
const {
  userPublic,
} = require('../serializers/user')

async function getUsers(req, res) {
  try {
    const users = await userService.getUsers()
    return res.json(users.map(userPublic))
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Users could not be loaded',
    })
  }
}

async function createUser(req, res) {
  const dto = createUserDto(req.validated)

  try {
    const result = await userService.createUser(dto)

    if (result.conflict) {
      return res.status(409).json({
        message: 'A user with that email already exists',
      })
    }

    return res
      .status(201)
      .json(userPublic(result.user))
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'User could not be created',
    })
  }
}

module.exports = {
  getUsers,
  createUser,
}
```

---

# 27. Crear las rutas

## Autenticación

```text
backend/src/routes/auth.routes.js
```

```js
const express = require('express')
const validate = require(
  '../middleware/validate.middleware'
)
const authenticate = require(
  '../middleware/authenticate.middleware'
)
const authController = require(
  '../controllers/auth.controller'
)
const {
  loginRequestSchema,
} = require('../validators/auth.schema')

const router = express.Router()

router.post(
  '/login',
  validate(loginRequestSchema),
  authController.login,
)

router.get(
  '/me',
  authenticate,
  authController.me,
)

module.exports = router
```

## Usuarios

```text
backend/src/routes/users.routes.js
```

```js
const express = require('express')
const validate = require(
  '../middleware/validate.middleware'
)
const authenticate = require(
  '../middleware/authenticate.middleware'
)
const requirePermission = require(
  '../middleware/require-permission.middleware'
)
const userController = require(
  '../controllers/user.controller'
)
const {
  createUserRequestSchema,
} = require('../validators/auth.schema')

const router = express.Router()

router.use(authenticate)

router.get(
  '/',
  requirePermission('users:read'),
  userController.getUsers,
)

router.post(
  '/',
  requirePermission('users:create'),
  validate(createUserRequestSchema),
  userController.createUser,
)

module.exports = router
```

---

# 28. Registrar las rutas en Express

En `app.js`:

```js
const authRouter = require('../routes/auth.routes')
const usersRouter = require('../routes/users.routes')
```

Antes del middleware 404:

```js
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
```

---

# 29. Probar el backend con Postman

## Login

```text
POST http://localhost:3001/api/auth/login
```

```json
{
  "email": "admin@example.com",
  "password": "ChangeMe123!"
}
```

Copia el token.

## Identidad actual

```text
GET http://localhost:3001/api/auth/me
Authorization: Bearer <token>
```

## Lista de usuarios

```text
GET http://localhost:3001/api/users
Authorization: Bearer <token>
```

## Sin token

Debe responder `401`.

## Usuario sin permiso

Crea un usuario con rol `user`, inicia sesión y prueba `/api/users`. Debe responder `403`.

---

# PARTE IX — PREPARAR EL FRONTEND PARA JWT

# 30. Añadir tipos de autenticación

```text
frontend/src/types/auth.ts
```

```ts
export interface AuthUser {
  id: number
  email: string
  role: string
  isActive: boolean
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}
```

---

# 31. Añadir el token a Axios

Amplía `src/plugins/axios.ts` después de crear la instancia:

```ts
api.interceptors.request.use((request) => {
  if (import.meta.client) {
    const token = localStorage.getItem(
      'tasks_access_token',
    )

    if (token) {
      request.headers.Authorization =
        `Bearer ${token}`
    }
  }

  return request
})
```

El interceptor consulta el token justo antes de cada petición.

No intentes acceder a `localStorage` durante SSR; por eso comprobamos `import.meta.client`.

---

# 32. Crear el servicio de autenticación

```text
frontend/src/services/auth.service.ts
```

```ts
import type { AxiosInstance } from 'axios'
import type {
  AuthUser,
  LoginInput,
  LoginResponse,
} from '~/types/auth'

export function createAuthService(
  api: AxiosInstance,
) {
  async function login(
    input: LoginInput,
  ): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
      '/auth/login',
      input,
    )

    return response.data
  }

  async function me(): Promise<AuthUser> {
    const response = await api.get<AuthUser>(
      '/auth/me',
    )

    return response.data
  }

  return {
    login,
    me,
  }
}
```

---

# 33. Crear `useAuth`

```text
frontend/src/composables/useAuth.ts
```

```ts
import type { LoginInput } from '~/types/auth'
import { createAuthService } from '~/services/auth.service'

const TOKEN_KEY = 'tasks_access_token'

export function useAuth() {
  const { $api } = useNuxtApp()
  const authService = createAuthService($api)

  const user = useState<
    Awaited<ReturnType<typeof authService.me>> | null
  >('auth-user', () => null)

  const initialized = useState(
    'auth-initialized',
    () => false,
  )

  const loading = useState(
    'auth-loading',
    () => false,
  )

  const isAuthenticated = computed(
    () => Boolean(user.value),
  )

  function hasPermission(permission: string) {
    return Boolean(
      user.value?.permissions.includes(permission),
    )
  }

  async function login(input: LoginInput) {
    loading.value = true

    try {
      const response = await authService.login(input)

      localStorage.setItem(
        TOKEN_KEY,
        response.token,
      )

      user.value = response.user
      initialized.value = true
      return true
    } catch (error) {
      console.error(error)
      return false
    } finally {
      loading.value = false
    }
  }

  async function restore() {
    if (initialized.value || !import.meta.client) {
      return
    }

    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      initialized.value = true
      return
    }

    try {
      user.value = await authService.me()
    } catch (error) {
      console.error(error)
      localStorage.removeItem(TOKEN_KEY)
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  function logout() {
    if (import.meta.client) {
      localStorage.removeItem(TOKEN_KEY)
    }

    user.value = null
    initialized.value = true
  }

  return {
    user,
    initialized,
    loading,
    isAuthenticated,
    hasPermission,
    login,
    restore,
    logout,
  }
}
```

---

# 34. Restaurar la sesión al iniciar el cliente

Crea:

```text
frontend/src/plugins/auth.client.ts
```

```ts
export default defineNuxtPlugin(async () => {
  const auth = useAuth()
  await auth.restore()
})
```

El sufijo `.client.ts` evita ejecutar el plugin en el servidor.

---

# PARTE X — PÁGINA DE LOGIN

# 35. Crear `/login`

```text
frontend/src/pages/login.vue
```

```vue
<script setup lang="ts">
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
```

Si `BaseInputText` todavía no acepta `autocomplete`, amplía sus props y reenvía el atributo al control interno. Es una mejora concreta motivada por el formulario.

---

# PARTE XI — PROTEGER RUTAS

# 36. Crear middleware de autenticación frontend

```text
frontend/src/middleware/auth.ts
```

```ts
export default defineNuxtRouteMiddleware(
  async () => {
    const auth = useAuth()

    if (!auth.initialized.value) {
      await auth.restore()
    }

    if (!auth.isAuthenticated.value) {
      return navigateTo('/login')
    }
  },
)
```

---

# 37. Crear middleware de permisos

```text
frontend/src/middleware/permission.ts
```

```ts
export default defineNuxtRouteMiddleware(
  (to) => {
    const requiredPermission =
      to.meta.permission as string | undefined

    if (!requiredPermission) {
      return
    }

    const auth = useAuth()

    if (!auth.hasPermission(requiredPermission)) {
      return navigateTo('/')
    }
  },
)
```

El frontend oculta o redirige, pero la seguridad real sigue estando en el backend. Nunca confíes únicamente en middleware de Nuxt para proteger datos.

Para que TypeScript reconozca la propiedad personalizada, crea:

```text
frontend/src/types/page-meta.d.ts
```

```ts
declare module '#app' {
  interface PageMeta {
    permission?: string
  }
}

export {}
```

---

# 38. Crear servicio de usuarios

```text
frontend/src/services/user.service.ts
```

```ts
import type { AxiosInstance } from 'axios'
import type { AuthUser } from '~/types/auth'

export function createUserService(
  api: AxiosInstance,
) {
  async function getAll(): Promise<AuthUser[]> {
    const response = await api.get<AuthUser[]>(
      '/users',
    )

    return response.data
  }

  return {
    getAll,
  }
}
```

---

# 39. Crear `/admin/users`

```text
frontend/src/pages/admin/users.vue
```

```vue
<script setup lang="ts">
import type { AuthUser } from '~/types/auth'
import { createUserService } from '~/services/user.service'

definePageMeta({
  middleware: ['auth', 'permission'],
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
```

Después podrá extraerse a servicio, composable y componentes igual que el módulo de tareas.

---

# 40. Comprobar la restauración de sesión

Flujo:

```text
Login correcto
-> token en localStorage
-> user en useState
-> navegación a /admin/users

Recarga del navegador
-> auth.client.ts
-> useAuth.restore
-> GET /api/auth/me
-> user restaurado
-> middleware permite la ruta
```

Prueba también:

- Eliminar manualmente el token.
- Modificar un carácter del token.
- Esperar a que caduque.
- Desactivar el usuario en PostgreSQL.

En todos esos casos `/api/auth/me` debe dejar de aceptar la sesión.

---

# 41. Proteger también acciones visuales

Puedes mostrar enlaces administrativos solo con permiso:

```vue
<NuxtLink
  v-if="auth.hasPermission('users:read')"
  to="/admin/users"
>
  Usuarios
</NuxtLink>
```

Esto mejora la experiencia, pero no sustituye:

```js
authenticate
requirePermission('users:read')
```

El backend es la frontera de seguridad.

---

# 42. Pruebas backend prioritarias

Añade pruebas para:

```text
Login correcto devuelve token y usuario sin passwordHash.
Login incorrecto devuelve 401 genérico.
/auth/me sin token devuelve 401.
/users con usuario normal devuelve 403.
/users con admin devuelve 200.
Serializer de usuario nunca devuelve passwordHash.
```

Utiliza una base de prueba aislada para las operaciones que crean usuarios.

---

# 43. Contratos y OpenAPI del módulo

Repite el patrón del tutorial anterior:

```text
login body contract
login response contract
user public contract
user session contract
users list contract
error contract
security scheme Bearer JWT
```

En OpenAPI registra un esquema de seguridad:

```text
bearerAuth
-> type: http
-> scheme: bearer
-> bearerFormat: JWT
```

Y marca `/api/auth/me` y `/api/users` como protegidos.

El login permanece público.

---

# 44. Qué no debe aparecer nunca en una respuesta

```text
password
passwordHash
password_hash
JWT_SECRET
hash completo en logs
contraseña del seed
```

Revisa Network, Swagger y pruebas de contrato.

Un serializer explícito es la última barrera antes de la respuesta.

---

# 45. Diferencia entre autenticación y autorización

```text
Autenticación
└── ¿quién eres?

Autorización
└── ¿qué puedes hacer?
```

En el recorrido:

```text
authenticate
-> verifica token e identidad.

requirePermission
-> comprueba una capacidad concreta.
```

No utilices solo comprobaciones visuales como:

```ts
user.role === 'admin'
```

cuando la aplicación ya trabaja con permisos. Los permisos expresan mejor la acción protegida.

---

# 46. Estructura añadida

```text
backend/src/
├── config/
│   ├── permissions.config.js
│   └── sequelize.config.js
├── controllers/
│   ├── auth.controller.js
│   └── user.controller.js
├── middleware/
│   ├── authenticate.middleware.js
│   └── require-permission.middleware.js
├── migrations/
├── models/
│   └── user.model.js
├── repositories/
│   └── user.repository.js
├── routes/
│   ├── auth.routes.js
│   └── users.routes.js
├── serializers/
│   └── user/
├── services/
│   ├── auth.service.js
│   └── user.service.js
└── utils/
    └── jwt.js

frontend/src/
├── composables/
│   └── useAuth.ts
├── middleware/
│   ├── auth.ts
│   └── permission.ts
├── pages/
│   ├── login.vue
│   └── admin/users.vue
├── plugins/
│   └── auth.client.ts
├── services/
│   ├── auth.service.ts
│   └── user.service.ts
└── types/
    └── auth.ts
```

---

# 47. Estrategia de depuración de autenticación

```text
1. ¿El login llega al backend?
2. ¿El usuario existe y está activo?
3. ¿bcrypt compara correctamente?
4. ¿JWT_SECRET está cargado?
5. ¿el token se guarda en el navegador?
6. ¿el interceptor añade Authorization?
7. ¿authenticate verifica el token?
8. ¿requirePermission encuentra el permiso?
9. ¿useAuth restaura el usuario?
10. ¿el middleware de Nuxt espera la restauración?
```

Herramientas:

- Terminal de Express.
- Network.
- Application/Local Storage del navegador.
- PgAdmin.
- Postman.
- Pruebas automatizadas.

No pegues tokens reales en capturas o documentación pública.

---

# 48. Ejercicios

1. Añade activación y desactivación de usuarios.
2. Impide que un administrador se desactive a sí mismo.
3. Añade un formulario de creación de usuarios con Zod en frontend.
4. Crea un permiso `users:update` separado.
5. Añade una página de perfil para el usuario actual.
6. Invalida sesiones cuando un usuario queda inactivo.
7. Añade expiración visible y cierre de sesión cuando la API responda `401`.
8. Diseña una futura estrategia con refresh token sin implementarla todavía.

---

# 49. Cierre de la ruta principal

La serie ha construido una aplicación desde un flujo sencillo hasta una arquitectura reutilizable:

```text
Nuxt + Express + Axios
-> PostgreSQL + Sequelize
-> controller/service/repository/model
-> validation + DTO + serializer
-> contracts + OpenAPI + tests
-> PrimeVue + SCSS + base components
-> services + composables + components
-> users + JWT + permissions
```

Los siguientes temas pueden tratarse en una ruta avanzada independiente:

```text
cookies HttpOnly y CSRF
refresh tokens
migraciones complejas
despliegue de producción
Nginx
TLS y certificados
Helmet y CSP
CI/CD
backups
monitorización
```

No son necesarios para comprender el recorrido principal, y se enseñarán mejor cuando exista una aplicación completa que desplegar y proteger.
