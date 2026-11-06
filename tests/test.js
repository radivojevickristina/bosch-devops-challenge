const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const app = require('../src/app')

test("Testing get endpoint '/'" , async () => {
    const response = await request(app).get('/')

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.message, "Hello DevOps")
    assert.equal(typeof response.body.host, "string")
    assert.ok(response.body.host.length > 0)
})