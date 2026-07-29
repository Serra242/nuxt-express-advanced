const {
  verifyAccessToken,
} = require('../utils/jwt')
const userRepository = require(
  '../repositories/user.repository'
)
const {
  getPermissionsForRole,
} = require('../config/permissions.config')

async function authenticate(req, res, next) {
  const authorization = req.get('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authentication required',
    })
  }

  const token = authorization.slice(7)

  try {
    const payload = verifyAccessToken(token)
    const user = await userRepository.findById(
      Number(payload.sub),
    )

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Authentication required',
      })
    }

    req.auth = {
      user,
      permissions: getPermissionsForRole(
        user.role,
      ),
    }

    return next()
  } catch (error) {
    console.error('JWT no válido', error.message)

    return res.status(401).json({
      message: 'Authentication required',
    })
  }
}

module.exports = authenticate