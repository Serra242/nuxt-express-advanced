function requirePermission(permission) {
  return (req, res, next) => {
    const permissions = req.auth?.permissions ?? []

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        message: 'Forbidden',
      })
    }

    return next()
  }
}

module.exports = requirePermission