const taskRepository = require(
  '../repositories/task.repository'
)

async function getTasks(dto) {
  return taskRepository.findAll({
    done: dto.done,
  })
}

async function getTaskById(id) {
  return taskRepository.findById(id)
}

async function createTask(values) {
  return taskRepository.create({
    title: values.title,
    done: false,
  })
}

async function updateTask(id, changes) {
  return taskRepository.updateById(id, changes)
}

async function deleteTask(id) {
  return taskRepository.deleteById(id)
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
}