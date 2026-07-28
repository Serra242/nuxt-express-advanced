const test = require('node:test')
const assert = require('node:assert/strict')

const {
  taskPublic,
} = require('../../../src/serializers/task')
const {
  taskPublicContract,
} = require('../../../src/contracts')

test(
  'taskPublic produce una respuesta compatible',
  () => {
    const modelLike = {
      get() {
        return {
          id: 1,
          title: 'Probar contratos',
          done: false,
          createdAt: new Date(
            '2026-01-10T10:00:00.000Z',
          ),
          updatedAt: new Date(
            '2026-01-10T10:00:00.000Z',
          ),
          internalValue: 'no debe salir',
        }
      },
    }

    const serialized = taskPublic(modelLike)
    const parsed = taskPublicContract.parse(serialized)

    assert.equal(parsed.id, 1)
    assert.equal(parsed.title, 'Probar contratos')
    assert.equal(
      Object.hasOwn(parsed, 'internalValue'),
      false,
    )
  },
)

test(
  'TaskPublic no admite campos públicos inesperados',
  () => {
    const result = taskPublicContract.safeParse({
      id: 1,
      title: 'Tarea',
      done: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      password: 'no debería existir',
    })

    assert.equal(result.success, false)
  },
)