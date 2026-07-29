const User = require('../models/user.model')

async function findAll() {
  return User.findAll({
    order: [['id', 'ASC']],
  })
}

async function findById(id) {
  return User.findByPk(id)
}

async function findByEmail(email) {
  return User.findOne({
    where: { email },
  })
}

async function create(values) {
  return User.create(values)
}

module.exports = {
  findAll,
  findById,
  findByEmail,
  create,
}