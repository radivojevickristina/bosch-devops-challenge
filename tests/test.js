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

test("Testing get endpoint '/visits' with mockRedis" , async () => {
    const mockRedis = {
        incr: async () => 3,
    }

    app.locals.redisClient = mockRedis
    const response = await request(app).get('/visits')

    assert.equal(response.statusCode, 200)
    assert.equal(typeof response.body.visits, "number")
    assert.strictEqual(response.body.visits, 3)
})

test("Testing get endpoint '/visits' with mockRedis that returns error" , async () => {
    const mockRedis = {
        incr: async () => {
            throw new Error('Redis unavailable');
        }
    }

    app.locals.redisClient = mockRedis
    const response = await request(app).get('/visits')

    assert.equal(response.statusCode, 503)
    assert.equal(response.body.error, 'Redis unavailable')
    
})

test("Testing get endpoint '/health' with mockRedis" , async () => {
    const mockRedis = {
        ping: async () => "PONG"
    }

    app.locals.redisClient = mockRedis
    const response = await request(app).get('/health')

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.status, "ok")
})

test("Testing get endpoint '/health' with mockRedis that returns error" , async () => {
    const mockRedis = {
        ping: async () => {
            throw new Error('Redis unavailable');
        }
    }

    app.locals.redisClient = mockRedis
    const response = await request(app).get('/health')

    assert.equal(response.statusCode, 503)
    assert.equal(response.body.status, "error")
})