const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const app = require('../../src/app/app')

test(
  'POST /api/tasks rechaza un título vacío',
  async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: '   ' })
      .expect('Content-Type', /json/)
      .expect(400)

    assert.equal(
      response.body.message,
      'Bad request. There is an issue with the provided data.',
    )
  },
)