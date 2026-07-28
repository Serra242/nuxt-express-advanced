const taskService = require('../services/task.service')

async function getTasks(req, res) {
  try {
    const tasks = await taskService.getTasks()
    return res.json(tasks)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'No se han podido obtener las tareas',
    })
  }
}

module.exports = {
  getTasks,
}