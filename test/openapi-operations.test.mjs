import { describe, it } from 'node:test'
import assert from 'node:assert'
import { listOperations, resolvePath } from '../src/lib/openapi-operations.mjs'

describe('listOperations', () => {
  it('extracts path and method', () => {
    const api = {
      openapi: '3.0.0',
      paths: {
        '/x': {
          get: { operationId: 'getX', responses: { 200: { description: 'ok' } } },
        },
      },
    }
    const ops = listOperations(api)
    assert.equal(ops.length, 1)
    assert.equal(ops[0].method, 'GET')
    assert.equal(ops[0].pathTemplate, '/x')
    assert.equal(ops[0].operationId, 'getX')
  })
})

describe('resolvePath', () => {
  it('fills path params from examples', () => {
    const pathParams = [
      { name: 'id', example: '42' },
    ]
    assert.equal(resolvePath('/items/{id}', pathParams), '/items/42')
  })
})
