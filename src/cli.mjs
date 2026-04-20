#!/usr/bin/env node
import { Command } from 'commander'
import path from 'node:path'
import { generateFromOpenapi } from './generate/from-openapi.mjs'
import { generateGraphqlStub } from './generate/from-graphql.mjs'
import { validateOpenapi } from './generate/validate-openapi.mjs'
import { runAgent } from './agent/run.mjs'
import {
  generateWdioPageObject,
  generateWdioSpec,
  toPageClassName,
} from './generate/from-wdio.mjs'

const program = new Command()

program
  .name('apitest-gen')
  .description(
    'Generate API test scaffolds from OpenAPI (REST), GraphQL stubs, and optional WebdriverIO POM/spec scaffolds.'
  )
  .version('0.4.0')

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

program
  .command('wdio-page')
  .description('Generate a minimal WebdriverIO Page Object class (edit selectors to match your app)')
  .requiredOption('-o, --out <path>', 'Output file (e.g. ./test/pageobjects/learner/foo.page.js)')
  .requiredOption('-n, --name <ClassName>', 'Page class name (e.g. CoursePage or course-page)')
  .option('-u, --url <path>', 'URL path after baseUrl', '/')
  .action(async (opts) => {
    const outFile = path.resolve(opts.out)
    const className = toPageClassName(opts.name)
    const urlPath = opts.url || '/'
    const result = await generateWdioPageObject({
      outFile,
      className,
      urlPath,
    })
    console.log(`Wrote WDIO Page Object ${className} → ${result.outFile}`)
  })

program
  .command('wdio-spec')
  .description('Generate a minimal WebdriverIO spec file (describe/it skeleton)')
  .requiredOption('-o, --out <path>', 'Output file (e.g. ./test/specs/learner/foo.spec.js)')
  .option('-t, --title <text>', 'Top-level describe title', 'WDIO spec')
  .option('-u, --url <path>', 'Starting path when not using --page-import', '/')
  .option('--page-import <path>', 'Relative import path to a Page class (e.g. ../../pageobjects/x.page.js)')
  .option('--page-class <name>', 'Imported class name (required with --page-import)')
  .action(async (opts) => {
    const outFile = path.resolve(opts.out)
    const pageImport = opts.pageImport
    const pageClass = opts.pageClass
    if (pageImport && !pageClass) {
      console.error('When using --page-import, also pass --page-class')
      process.exitCode = 1
      return
    }
    if (pageClass && !pageImport) {
      console.error('When using --page-class, also pass --page-import')
      process.exitCode = 1
      return
    }
    const result = await generateWdioSpec({
      outFile,
      suiteTitle: opts.title,
      urlPath: opts.url || '/',
      pageImport,
      pageClass,
    })
    console.log(`Wrote WDIO spec → ${result.outFile}`)
  })

program.parse()
