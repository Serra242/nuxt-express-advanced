const {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} = require('@asteasolutions/zod-to-openapi')

const {
  errorResponseContract,
  taskPublicContract,
  taskListContract,
  taskIdParamsContract,
  createTaskBodyContract,
  updateTaskBodyContract,
  listTasksQueryContract,
  taskSummaryContract,
} = require('../contracts')

const registry = new OpenAPIRegistry()

registry.register('ErrorResponse', errorResponseContract)
registry.register('TaskPublic', taskPublicContract)
registry.register('TaskList', taskListContract)
registry.register('TaskIdParams', taskIdParamsContract)
registry.register('CreateTaskBody', createTaskBodyContract)
registry.register('UpdateTaskBody', updateTaskBodyContract)
registry.register('ListTasksQuery', listTasksQueryContract)
registry.register('TaskSummary', taskSummaryContract)

registry.registerPath({
  method: 'get',
  path: '/api/tasks',
  tags: ['Tasks'],
  summary: 'Obtener todas las tareas',
  request: {
    query: listTasksQueryContract,
  },
  responses: {
    200: {
      description: 'Lista de tareas',
      content: {
        'application/json': {
          schema: taskListContract,
        },
      },
    },
    400: {
      description: 'Consulta no válida',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    500: {
      description: 'Error interno',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Obtener una tarea por ID',
  request: {
    params: taskIdParamsContract,
  },
  responses: {
    200: {
      description: 'Tarea encontrada',
      content: {
        'application/json': {
          schema: taskPublicContract,
        },
      },
    },
    400: {
      description: 'Identificador no válido',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    404: {
      description: 'Tarea no encontrada',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    500: {
      description: 'Error interno',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/tasks',
  tags: ['Tasks'],
  summary: 'Crear una tarea',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: createTaskBodyContract,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Tarea creada',
      content: {
        'application/json': {
          schema: taskPublicContract,
        },
      },
    },
    400: {
      description: 'Datos no válidos',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    500: {
      description: 'Error interno',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
  },
})

registry.registerPath({
  method: 'patch',
  path: '/api/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Modificar parcialmente una tarea',
  request: {
    params: taskIdParamsContract,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: updateTaskBodyContract,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Tarea actualizada',
      content: {
        'application/json': {
          schema: taskPublicContract,
        },
      },
    },
    400: {
      description: 'Datos no válidos',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    404: {
      description: 'Tarea no encontrada',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    500: {
      description: 'Error interno',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
  },
})

registry.registerPath({
  method: 'delete',
  path: '/api/tasks/{id}',
  tags: ['Tasks'],
  summary: 'Eliminar una tarea',
  request: {
    params: taskIdParamsContract,
  },
  responses: {
    204: {
      description: 'Tarea eliminada',
    },
    400: {
      description: 'Identificador no válido',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    404: {
      description: 'Tarea no encontrada',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
    500: {
      description: 'Error interno',
      content: {
        'application/json': {
          schema: errorResponseContract,
        },
      },
    },
  },
})

function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(
    registry.definitions,
  )

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Tasks API',
      version: '1.0.0',
      description:
        'API de aprendizaje para gestionar tareas.',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Desarrollo local',
      },
    ],
  })
}

module.exports = {
  registry,
  generateOpenApiDocument,
}