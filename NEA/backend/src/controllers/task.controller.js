const taskService = require('../services/task.service')
const {
  createTaskDto,
  updateTaskDto,
  taskIdDto,
  listTasksDto,
} = require('../dtos/task.dto')

const {
  taskPublic,
} = require('../serializers/task')

async function getTasks(req, res) {
  const dto = listTasksDto(req.validated)

  try {
    const tasks = await taskService.getTasks(dto)
    const serializedTasks = tasks.map(taskPublic)
    return res.json(serializedTasks)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se han podido obtener las tareas',
    })
  }
}

async function getTaskById(req, res) {
  const dto = taskIdDto(req.validated)

  try {
    const task = await taskService.getTaskById(dto.id)

    if (!task) {
      return res.status(404).json({
        message: 'No se ha encontrado la tarea',
      })
    }

    return res.json(taskPublic(task))
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido obtener la tarea',
    })
  }
}

async function createTask(req, res) {
  const dto = createTaskDto(req.validated)

  try {
    const task = await taskService.createTask(dto)
    return res.status(201).json(taskPublic(task))
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido crear la tarea',
    })
  }
}

async function updateTask(req, res) {
  const dto = updateTaskDto(req.validated)

  try {
    const task = await taskService.updateTask(
      dto.id,
      dto.changes,
    )

    if (!task) {
      return res.status(404).json({
        message: 'No se ha encontrado la tarea',
      })
    }

    return res.json(taskPublic(task))
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido actualizar la tarea',
    })
  }
}

async function deleteTask(req, res) {
  const dto = taskIdDto(req.validated)

  try {
    const deleted = await taskService.deleteTask(dto.id)

    if (!deleted) {
      return res.status(404).json({
        message: 'No se ha encontrado la tarea',
      })
    }

    return res.status(204).send()
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido eliminar la tarea',
    })
  }
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
}