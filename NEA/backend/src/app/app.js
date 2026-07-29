const cors = require('cors')
const express = require('express')
const authRouter = require('../routes/auth.routes')
const usersRouter = require('../routes/users.routes')
const tasksRouter = require('../routes/tasks.routes')
const {
  registerSwagger,
} = require('../config/swagger.config')
const app = express()

const frontendUrl =
  process.env.FRONTEND_URL ||
  'http://localhost:3000'

app.use(
  cors({
    origin: frontendUrl,
  })
)

app.use(express.json())

registerSwagger(app)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'El backend funciona correctamente',
  })
})

app.use('/api/tasks', tasksRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)

app.use((req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
  })
})

module.exports = app