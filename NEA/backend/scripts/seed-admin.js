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