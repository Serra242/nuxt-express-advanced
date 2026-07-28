function toPlain(task) {
  if (!task) {
    return undefined
  }

  return task.get
    ? task.get({ plain: true })
    : task
}

function taskPublic(task) {
  const value = toPlain(task)

  if (!value) {
    return undefined
  }

  return {
    id: value.id,
    title: value.title,
    done: value.done,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function taskRef(task) {
  const value = toPlain(task)

  if (!value) {
    return undefined
  }

  return {
    id: value.id,
    title: value.title,
  }
}

module.exports = {
  taskPublic,
  taskRef,
}