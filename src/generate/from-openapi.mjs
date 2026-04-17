import fs from 'node:fs/promises'
import path from 'node:path'
import parser from '@apidevtools/swagger-parser'
import { listOperations } from '../lib/openapi-operations.mjs'
import { renderSuite } from '../lib/render-tests.mjs'

/**
 * @param {object} opts
 * @param {string} opts.specPath - Path to openapi.json / yaml
 * @param {string} opts.outFile - Output file path
 * @param {'jest'|'vitest'} [opts.runner]
 */
export async function generateFromOpenapi(opts) {
  const { specPath, outFile, runner = 'jest' } = opts
  const api = await parser.validate(specPath)
  const operations = listOperations(api)
  const title =
    api.info?.title ||
    path.basename(specPath, path.extname(specPath))

  const source = renderSuite({
    operations,
    runner,
    client: 'fetch',
    title: `${title} — API`,
  })

  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, source, 'utf8')
  return { operations: operations.length, outFile }
}
