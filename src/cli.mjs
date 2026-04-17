#!/usr/bin/env node
import { Command } from 'commander'
import path from 'node:path'
import { generateFromOpenapi } from './generate/from-openapi.mjs'
import { generateGraphqlStub } from './generate/from-graphql.mjs'
import { validateOpenapi } from './generate/validate-openapi.mjs'

const program = new Command()

program
  .name('apitest-gen')
  .description(
    'Generate API test scaffolds from OpenAPI (REST). GraphQL: use graphql command for a starter file.'
  )
  .version('0.2.0')

program
  .command('validate')
  .description('Validate an OpenAPI 3.x JSON or YAML file (parse + resolve $ref)')
  .requiredOption('-s, --spec <path>', 'Path to openapi.yaml / openapi.json')
  .action(async (opts) => {
    const specPath = path.resolve(opts.spec)
    try {
      await validateOpenapi(specPath)
      console.log(`OK: OpenAPI document is valid — ${specPath}`)
      process.exitCode = 0
    } catch (e) {
      console.error(`Invalid OpenAPI: ${specPath}`)
      console.error(e.message || e)
      process.exitCode = 1
    }
  })

program
  .command('openapi')
  .description('Generate tests from an OpenAPI 3.x JSON or YAML file')
  .requiredOption('-s, --spec <path>', 'Path to openapi.yaml / openapi.json')
  .option(
    '-o, --out <path>',
    'Output test file (default: ./generated/api.generated.test.js)'
  )
  .option('--runner <name>', 'jest | vitest', 'jest')
  .action(async (opts) => {
    const outFile = path.resolve(
      opts.out || path.join(process.cwd(), 'generated', 'api.generated.test.js')
    )
    const specPath = path.resolve(opts.spec)
    const runner = opts.runner === 'vitest' ? 'vitest' : 'jest'

    const result = await generateFromOpenapi({
      specPath,
      outFile,
      runner,
    })
    console.log(
      `Wrote ${result.operations} operation(s) → ${result.outFile}`
    )
  })

program
  .command('graphql')
  .description('Generate a minimal GraphQL smoke test placeholder')
  .option(
    '-o, --out <path>',
    'Output file (default: ./generated/graphql.generated.test.js)'
  )
  .option('--runner <name>', 'jest | vitest', 'jest')
  .action(async (opts) => {
    const outFile = path.resolve(
      opts.out ||
        path.join(process.cwd(), 'generated', 'graphql.generated.test.js')
    )
    const runner = opts.runner === 'vitest' ? 'vitest' : 'jest'
    const result = await generateGraphqlStub({ outFile, runner })
    console.log(`Wrote GraphQL stub → ${result.outFile}`)
  })

program.parse()
