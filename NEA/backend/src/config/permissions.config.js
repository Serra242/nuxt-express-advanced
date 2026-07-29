const rolePermissions = {
  admin: [
    'users:read',
    'users:create',
    'tasks:read',
    'tasks:write',
  ],
  user: [
    'tasks:read',
    'tasks:write',
    'profile:read',
  ],
}

function getPermissionsForRole(role) {
  return rolePermissions[role] ?? []
}

module.exports = {
  getPermissionsForRole,
}