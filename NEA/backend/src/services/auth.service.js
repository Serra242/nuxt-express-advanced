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