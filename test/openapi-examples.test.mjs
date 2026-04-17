import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  extractRequestBodyExample,
  extractResponseExample,
} from '../src/lib/openapi-examples.mjs'

describe('extractRequestBodyExample', () => {
  it('reads application/json example', () => {
    const rb = {
      content: {
        'application/json': {
          example: { a: 1 },
        },
      },
    }
    const r = extractRequestBodyExample(rb)
    assert.deepStrictEqual(r.payload, { a: 1 })
    assert.strictEqual(r.contentType, 'application/json')
  })

  it('reads first named examples value', () => {
    const rb = {
      content: {
        'application/json': {
          examples: {
            one: { value: { b: 2 } },
          },
        },
      },
    }
    const r = extractRequestBodyExample(rb)
    assert.deepStrictEqual(r.payload, { b: 2 })
  })
})

describe('extractResponseExample', () => {
  it('returns 200 json example', () => {
    const responses = {
      '200': {
        content: {
          'application/json': {
            example: { ok: true },
          },
        },
      },
    }
    const r = extractResponseExample(responses)
    assert.strictEqual(r.status, 200)
    assert.deepStrictEqual(r.example, { ok: true })
  })
})
