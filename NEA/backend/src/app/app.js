const cors = require('cors')
const express = require('express')
const tasksRouter = require('../routes/tasks.routes')
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