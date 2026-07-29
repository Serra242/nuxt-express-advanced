const express = require('express')
const validate = require(
  '../middleware/validate.middleware'
)
const authenticate = require(
  '../middleware/authenticate.middleware'
)
const requirePermission = require(
  '../middleware/require-permission.middleware'
)
const userController = require(
  '../controllers/user.controller'
)
const {
  createUserRequestSchema,
} = require('../validators/auth.schema')

const router = express.Router()

router.use(authenticate)

router.get(
  '/',
  requirePermission('users:read'),
  userController.getUsers,
)

router.post(
  '/',
  requirePermission('users:create'),
  validate(createUserRequestSchema),
  userController.createUser,
)

module.exports = router