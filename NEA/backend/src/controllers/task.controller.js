const taskService = require('../services/task.service')

async function getTasks(req, res) {
  const filters = {}

  if (req.query.done === 'true') {
    filters.done = true
  } else if (req.query.done === 'false') {
    filters.done = false
  }

  try {
    const tasks = await taskService.getTasks(filters)
    return res.json(tasks)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se han podido obtener las tareas',
    })
  }
}

async function getTaskById(req, res) {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El identificador no es válido',
    })
  }

  try {
    const task = await taskService.getTaskById(id)

    if (!task) {
      return res.status(404).json({
        message: 'No se ha encontrado la tarea',
      })
    }

    return res.json(task)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido obtener la tarea',
    })
  }
}

async function createTask(req, res) {
  const rawTitle = req.body?.title
  const title =
    typeof rawTitle === 'string'
      ? rawTitle.trim()
      : ''

  if (!title) {
    return res.status(400).json({
      message: 'El título de la tarea es obligatorio',
    })
  }

  if (title.length > 255) {
    return res.status(400).json({
      message: 'El título no puede superar 255 caracteres',
    })
  }

  try {
    const task = await taskService.createTask({ title })
    return res.status(201).json(task)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido crear la tarea',
    })
  }
}

async function updateTask(req, res) {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El identificador no es válido',
    })
  }

  const changes = {}

  if (Object.hasOwn(req.body, 'title')) {
    const title =
      typeof req.body.title === 'string'
        ? req.body.title.trim()
        : ''

    if (!title || title.length > 255) {
      return res.status(400).json({
        message: 'El título no es válido',
      })
    }

    changes.title = title
  }

  if (Object.hasOwn(req.body, 'done')) {
    if (typeof req.body.done !== 'boolean') {
      return res.status(400).json({
        message: 'done debe ser true o false',
      })
    }

    changes.done = req.body.done
  }

  if (Object.keys(changes).length === 0) {
    return res.status(400).json({
      message: 'No se ha enviado ningún cambio válido',
    })
  }

  try {
    const task = await taskService.updateTask(
      id,
      changes,
    )

    if (!task) {
      return res.status(404).json({
        message: 'No se ha encontrado la tarea',
      })
    }

    return res.json(task)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se ha podido actualizar la tarea',
    })
  }
}

async function deleteTask(req, res) {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El identificador no es válido',
    })
  }

  try {
    const deleted = await taskService.deleteTask(id)

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