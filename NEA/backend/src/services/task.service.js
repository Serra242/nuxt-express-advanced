const taskRepository = require(
  '../repositories/task.repository'
)

async function getTasks() {
  return taskRepository.findAll()
}

module.exports = {
  getTasks,
}