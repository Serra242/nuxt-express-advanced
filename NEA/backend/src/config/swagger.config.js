const swaggerUi = require('swagger-ui-express')
const {
  generateOpenApiDocument,
} = require('../openapi/registry')

function registerSwagger(app) {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  const document = generateOpenApiDocument()

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(document),
  )
}

module.exports = {
  registerSwagger,
}