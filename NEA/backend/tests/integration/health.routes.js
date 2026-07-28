const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const app = require('../../src/app/app')

test('GET /api/health responde 200', async () => {
  const response = await request(app)
    .get('/api/health')
    .expect('Content-Type', /json/)
    .expect(200)

  assert.equal(response.body.status, 'ok')
})