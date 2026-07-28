const { Op } = require('sequelize')
const Task = require('../models/task.model')

async function findAll(filters = {}) {
  const where = {}

  if (filters.done !== undefined) {
    where.done = filters.done
  }

  if (filters.title !== undefined) {
    where.title = {
      [Op.iLike]: `%${filters.title}%`,
    }
  }

  return Task.findAll({
    where,
    order: [['id', 'ASC']],
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