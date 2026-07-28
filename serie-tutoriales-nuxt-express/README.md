# Serie de tutoriales: de Nuxt + Express a una arquitectura full-stack por capas

Esta serie continúa la aplicación de tareas creada en el primer tutorial.

El dominio se mantiene deliberadamente sencillo. El objetivo no es introducir lógica específica de otro proyecto, sino aprender progresivamente los patrones que después aparecerán en una aplicación real.

## Principios de la serie

```text
Cada abstracción aparece cuando existe un problema visible.
Cada operación se construye de extremo a extremo.
La interfaz se prepara visualmente antes de refactorizar su lógica.
Las herramientas se instalan cuando empiezan a ser necesarias.
Los cambios se comprueban con frecuencia.
No se borran capas anteriores sin entender qué responsabilidad se mueve.
```

## Tutorial 1 — Nuxt + Express + Axios

Archivo:

```text
01-nuxt-express-axios.md
```

Objetivos:

```text
Express expone una API en memoria.
Nuxt construye la interfaz paso a paso.
Axios conecta frontend y backend.
GET, POST, PATCH y DELETE funcionan.
CORS se observa y se resuelve.
La depuración comienza por logs, Console y Network.
```

## Tutorial 2 — PostgreSQL + Sequelize + capas básicas

Archivo:

```text
02-postgresql-sequelize-arquitectura-backend.md
```

Objetivos:

```text
La tabla tasks se diseña en DBML.
El SQL se revisa y se guarda en init/.
Docker crea la base y ejecuta el SQL inicial.
PgAdmin permite inspeccionar la estructura.
Sequelize conecta sin sync.
El CRUD recorre controller, service, repository y model.
Los datos sobreviven a los reinicios.
```

## Tutorial 3 — Validación, DTO y serializers

Archivo:

```text
03-validacion-dto-serializadores.md
```

Objetivos:

```text
Zod valida body, params y query.
Los controladores reciben datos interpretados.
Los DTO controlan la entrada al servicio.
Los serializers controlan la salida pública.
El frontend mantiene el mismo contrato.
```

## Tutorial 4 — Contratos, OpenAPI y pruebas

Archivo:

```text
04-contratos-openapi-pruebas-backend.md
```

Objetivos:

```text
Los serializers se verifican mediante contratos Zod.
OpenAPI documenta rutas, cuerpos y estados.
Swagger solo se monta fuera de producción.
Node Test Runner y Supertest introducen pruebas repetibles.
Los cambios incompatibles se detectan antes.
```

## Tutorial 5 — PrimeVue, SCSS y componentes base

Archivo:

```text
05-primevue-scss-componentes-base.md
```

Objetivos:

```text
PrimeVue funciona en modo unstyled.
SCSS sigue una organización ITCSS.
Los tokens centralizan decisiones visuales.
BaseButton, BaseInputText y BaseCard crean una base común.
El playground permite revisar estados visuales.
La aplicación conserva su funcionalidad.
```

## Tutorial 6 — Servicios, composables y componentes

Archivo:

```text
06-servicios-composables-componentes-frontend.md
```

Objetivos:

```text
El servicio concentra las llamadas HTTP.
El composable concentra estado y operaciones.
TaskForm, TaskList y TaskItem separan la interfaz.
La página compone las piezas.
Se añaden pruebas básicas de frontend.
```

## Tutorial 7 — Usuarios, migraciones, JWT y permisos

Archivo:

```text
07-usuarios-jwt-permisos.md
```

Objetivos:

```text
Una migración evoluciona la base existente.
El SQL inicial se mantiene actualizado para instalaciones nuevas.
Las contraseñas se almacenan como hash.
JWT identifica al usuario.
Los permisos protegen operaciones administrativas.
Nuxt restaura la sesión y protege rutas.
```

## Temas aplazados

La serie principal no introduce todavía:

```text
Dominio real de OET.
GIS, PostGIS, GeoServer o GDAL.
Despliegue de producción.
Nginx.
Certificados.
CSP de producción.
CI/CD completo.
Backups y monitorización.
```

Estos temas se comprenden mejor después de disponer de una aplicación funcional, persistente, comprobable y autenticada.
