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