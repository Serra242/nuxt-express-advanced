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