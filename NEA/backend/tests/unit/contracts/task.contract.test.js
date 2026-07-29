const test = require('node:test')
const assert = require('node:assert/strict')

const {
  taskPublic,
  taskRef,
} = require('../../../src/serializers/task')
const {
  taskPublicContract,
  taskRefConstract,
} = require('../../../src/contracts')

const {
  taskPublic,
  taskRef,
} = require('../../../src/serializers/task')
const {
  taskPublicContract,
  taskRefContract,
} = require('../../../src/contracts')

test(
  'taskRef produce una vista compatible y reducida',
  () => {
    const modelLike = {
      get() {
        return {
          id: 3,
          title: 'Vista de referencia',
          done: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      },
    }

    const serialized = taskRef(modelLike)
    const parsed = taskRefContract.parse(serialized)

    assert.equal(parsed.id, 3)
    assert.equal(
      Object.hasOwn(parsed, 'done'),
      false,
    )
  },
)

test('taskSummary respeta el contrato', () => {
  const summary = { total: 4, completed: 2, pending: 2 }
  const parsed = taskSummaryContract.parse(summary)
  assert.equal(parsed.total, 4)
})