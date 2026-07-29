const userService = require('../services/user.service')
const {
  createUserDto,
} = require('../dtos/auth.dto')
const {
  userPublic,
} = require('../serializers/user')

async function getUsers(req, res) {
  try {
    const users = await userService.getUsers()
    return res.json(users.map(userPublic))
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Users could not be loaded',
    })
  }
}

async function createUser(req, res) {
  const dto = createUserDto(req.validated)

  try {
    const result = await userService.createUser(dto)

    if (result.conflict) {
      return res.status(409).json({
        message: 'A user with that email already exists',
      })
    }

    return res
      .status(201)
      .json(userPublic(result.user))
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'User could not be created',
    })
  }
}

module.exports = {
  getUsers,
  createUser,
}