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