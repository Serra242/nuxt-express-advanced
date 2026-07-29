const express = require('express')
const validate = require(
  '../middleware/validate.middleware'
)
const authenticate = require(
  '../middleware/authenticate.middleware'
)
const authController = require(
  '../controllers/auth.controller'
)
const {
  loginRequestSchema,
} = require('../validators/auth.schema')

const router = express.Router()

router.post(
  '/login',
  validate(loginRequestSchema),
  authController.login,
)

router.get(
  '/me',
  authenticate,
  authController.me,
)

module.exports = router