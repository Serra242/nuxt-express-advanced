const {
  getPermissionsForRole,
} = require('../../config/permissions.config')

function toPlain(user) {
  if (!user) {
    return undefined
  }

  return user.get
    ? user.get({ plain: true })
    : user
}

function userPublic(user) {
  const value = toPlain(user)

  if (!value) {
    return undefined
  }

  return {
    id: value.id,
    email: value.email,
    role: value.role,
    isActive: value.isActive,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function userSession(user) {
  const value = userPublic(user)

  if (!value) {
    return undefined
  }

  return {
    ...value,
    permissions: getPermissionsForRole(value.role),
  }
}

module.exports = {
  userPublic,
  userSession,
}