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