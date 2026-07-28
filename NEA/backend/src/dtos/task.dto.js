function createTaskDto(validated) {
  return Object.freeze({
    title: validated.body.title,
  })
}

function updateTaskDto(validated) {
  const changes = {}

  if (validated.body.title !== undefined) {
    changes.title = validated.body.title
  }

  if (validated.body.done !== undefined) {
    changes.done = validated.body.done
  }

  return Object.freeze({
    id: validated.params.id,
    changes: Object.freeze(changes),
  })
}

function taskIdDto(validated) {
  return Object.freeze({
    id: validated.params.id,
  })
}

function listTasksDto(validated) {
  return Object.freeze({                //Object.freeze ayuda a expresar que el DTO no debería modificarse durante el recorrido.
    done: validated.query.done,
  })
}

module.exports = {
  createTaskDto,
  updateTaskDto,
  taskIdDto,
  listTasksDto,
}