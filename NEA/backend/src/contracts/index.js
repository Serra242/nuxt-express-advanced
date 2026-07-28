const {
  errorResponseContract,
} = require('./common.contract')
const {
  taskPublicContract,
  taskListContract,
  taskIdParamsContract,
  createTaskBodyContract,
  updateTaskBodyContract,
  listTasksQueryContract,
} = require('./task.contract')

module.exports = {
  errorResponseContract,
  taskPublicContract,
  taskListContract,
  taskIdParamsContract,
  createTaskBodyContract,
  updateTaskBodyContract,
  listTasksQueryContract,
}