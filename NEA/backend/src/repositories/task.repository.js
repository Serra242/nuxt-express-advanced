const Task = require('../models/task.model')

async function findAll(filters = {}) {
  const where = {}

  if (typeof filters.done === 'boolean') {
    where.done = filters.done
  }

  return Task.findAll({
    where,
    order: [['created_at', 'DESC']],
  })
}

async function findById(id) {
  return Task.findByPk(id)
}

async function create(values) {
  return Task.create(values)
}

async function updateById(id, changes) {
  const task = await findById(id)

  if (!task) {
    return null
  }

  await task.update(changes)
  return task
}

async function deleteById(id) {
  const deletedRows = await Task.destroy({
    where: { id },
  })

  return deletedRows > 0
}

async function countPending() {
  return Task.count({
    where: { done: false },
  })
}

module.exports = {
  findAll,
  findById,
  create,
  updateById,
  deleteById,
  countPending,
}