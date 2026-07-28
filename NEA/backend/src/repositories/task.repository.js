const Task = require('../models/task.model')

async function findAll() {
  return Task.findAll({
    order: [['id', 'ASC']],
  })
}

module.exports = {
  findAll,
}