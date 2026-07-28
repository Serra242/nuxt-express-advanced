const express = require('express')
const taskController = require(
  '../controllers/task.controller'
)
const validate = require(
  '../middleware/validate.middleware'
)

const {
  listTasksRequestSchema,
  taskIdRequestSchema,
  createTaskRequestSchema,
  updateTaskRequestSchema,
} = require('../validators/task.schema')

const router = express.Router()

router.get(
  '/',
  validate(listTasksRequestSchema),
  taskController.getTasks,
)

router.get(
  '/:id',
  validate(taskIdRequestSchema),
  taskController.getTaskById,
)

router.post(
  '/',
  validate(createTaskRequestSchema),
  taskController.createTask,
)

router.patch(
  '/:id',
  validate(updateTaskRequestSchema),
  taskController.updateTask,
)

router.delete(
  '/:id',
  validate(taskIdRequestSchema),
  taskController.deleteTask,
)

module.exports = router