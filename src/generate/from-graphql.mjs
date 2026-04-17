import fs from 'node:fs/promises'
import path from 'node:path'
import { renderGraphqlStub } from '../lib/render-tests.mjs'

/**
 * @param {object} opts
 * @param {string} opts.outFile
 * @param {'jest'|'vitest'} [opts.runner]
 */
export async function generateGraphqlStub(opts) {
  const { outFile, runner = 'jest' } = opts
  const source = renderGraphqlStub({ runner })
  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, source, 'utf8')
  return { outFile }
}
