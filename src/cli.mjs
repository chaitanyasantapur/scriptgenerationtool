#!/usr/bin/env node
import { Command } from 'commander'
import path from 'node:path'
import { generateFromOpenapi } from './generate/from-openapi.mjs'
import { generateGraphqlStub } from './generate/from-graphql.mjs'
import { validateOpenapi } from './generate/validate-openapi.mjs'
import { runAgent } from './agent/run.mjs'

const program = new Command()

program
  .name('apitest-gen')
  .description(
    'Generate API test scaffolds from OpenAPI (REST). GraphQL: use graphql command for a starter file.'
  )
  .version('0.3.0')

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
  .command('agent')
  .description(
    'Run the OpenAI tool-calling agent (requires OPENAI_API_KEY) to validate/generate tests via natural language'
  )
  .requiredOption('-p, --prompt <text>', 'What you want done (e.g. validate and generate from examples/mini-openapi.json)')
  .option('--model <id>', 'OpenAI model id', process.env.OPENAI_MODEL || 'gpt-4o-mini')
  .option('--max-steps <n>', 'Max LLM rounds (tool use counts as rounds)', '12')
  .option('--cwd <path>', 'Workspace root for allowed file paths', process.cwd())
  .action(async (opts) => {
    const root = path.resolve(opts.cwd || process.cwd())
    const maxSteps = parseInt(String(opts.maxSteps), 10) || 12
    try {
      const result = await runAgent({
        prompt: opts.prompt,
        root,
        model: opts.model,
        maxSteps,
      })
      for (const line of result.assistantMessages) {
        if (line) console.log(line)
      }
      if (result.toolCalls.length) {
        console.error(
          `\n[agent] Used ${result.toolCalls.length} tool call(s):`,
          result.toolCalls.map((t) => t.name).join(', ')
        )
      }
    } catch (e) {
      console.error(e.message || e)
      process.exitCode = 1
    }
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
