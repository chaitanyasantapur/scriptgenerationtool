import { describe, it } from 'node:test'
import assert from 'node:assert'
import { resolveUnderRoot } from '../src/agent/safe-path.mjs'

describe('resolveUnderRoot', () => {
  const root = '/project/repo'

  it('allows nested path', () => {
    assert.strictEqual(
      resolveUnderRoot(root, 'examples/a.json'),
      '/project/repo/examples/a.json'
    )
  })

  it('rejects traversal', () => {
    assert.throws(() => resolveUnderRoot(root, '../../../etc/passwd'))
  })
})
