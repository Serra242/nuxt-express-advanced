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