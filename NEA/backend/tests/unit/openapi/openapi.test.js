const test = require('node:test')
const assert = require('node:assert/strict')

const {
  generateOpenApiDocument,
} = require('../../../src/openapi/registry')

test('OpenAPI contiene las rutas de tareas', () => {
  const document = generateOpenApiDocument()

  assert.ok(document.paths['/api/tasks'])
  assert.ok(document.paths['/api/tasks/{id}'])
  assert.ok(
    document.paths['/api/tasks'].get,
  )
  assert.ok(
    document.paths['/api/tasks'].post,
  )
})