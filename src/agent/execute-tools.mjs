import fs from 'node:fs/promises'
import path from 'node:path'
import { generateFromOpenapi } from '../generate/from-openapi.mjs'
import { generateGraphqlStub } from '../generate/from-graphql.mjs'
import { validateOpenapi } from '../generate/validate-openapi.mjs'
import { resolveUnderRoot } from './safe-path.mjs'

const MAX_READ = 400 * 1024
const MAX_LIST = 80

/**
 * @param {string} name
 * @param {Record<string, unknown>} args
 * @param {{ root: string }} ctx
 * @returns {Promise<string>}
 */
export async function executeTool(name, args, ctx) {
  const { root } = ctx
  try {
    switch (name) {
      case 'validate_openapi': {
        const spec = String(args.spec_path || '')
        const specPath = resolveUnderRoot(root, spec)
        await validateOpenapi(specPath)
        return JSON.stringify({ ok: true, message: `OpenAPI valid: ${specPath}` })
      }
      case 'generate_openapi_tests': {
        const spec = String(args.spec_path || '')
        const out = String(args.out_path || '')
        const runnerRaw = args.runner
        const runner = runnerRaw === 'vitest' ? 'vitest' : 'jest'
        const specPath = resolveUnderRoot(root, spec)
        const outFile = resolveUnderRoot(root, out)
        const result = await generateFromOpenapi({ specPath, outFile, runner })
        return JSON.stringify({
          ok: true,
          operations: result.operations,
          outFile: result.outFile,
        })
      }
      case 'generate_graphql_stub': {
        const out = String(args.out_path || '')
        const runnerRaw = args.runner
        const runner = runnerRaw === 'vitest' ? 'vitest' : 'jest'
        const outFile = resolveUnderRoot(root, out)
        const result = await generateGraphqlStub({ outFile, runner })
        return JSON.stringify({ ok: true, outFile: result.outFile })
      }
      case 'read_text_file': {
        const rel = String(args.path || '')
        const abs = resolveUnderRoot(root, rel)
        const buf = await fs.readFile(abs)
        if (buf.length > MAX_READ) {
          return JSON.stringify({
            ok: false,
            error: `File too large (max ${MAX_READ} bytes): ${rel}`,
          })
        }
        return buf.toString('utf8')
      }
      case 'list_directory': {
        const rel = String(args.directory || '.')
        const abs = resolveUnderRoot(root, rel)
        const entries = await fs.readdir(abs, { withFileTypes: true })
        const names = entries
          .filter((e) => !e.name.startsWith('.'))
          .slice(0, MAX_LIST)
          .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
        return JSON.stringify({ ok: true, path: abs, entries: names })
      }
      default:
        return JSON.stringify({ ok: false, error: `Unknown tool: ${name}` })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return JSON.stringify({ ok: false, error: msg })
  }
}

/** OpenAI Chat Completions `tools` array */
export const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'validate_openapi',
      description:
        'Validate an OpenAPI 3.x JSON/YAML file (parse + resolve $ref). Call before generating tests when unsure if the spec is valid.',
      parameters: {
        type: 'object',
        properties: {
          spec_path: {
            type: 'string',
            description: 'Path to openapi.yaml or openapi.json relative to workspace root',
          },
        },
        required: ['spec_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_openapi_tests',
      description:
        'Generate Jest/Vitest API test file from an OpenAPI spec using apitest-gen (fetch + env API_BASE_URL).',
      parameters: {
        type: 'object',
        properties: {
          spec_path: {
            type: 'string',
            description: 'Path to OpenAPI file relative to workspace root',
          },
          out_path: {
            type: 'string',
            description: 'Output test file path relative to workspace root',
          },
          runner: {
            type: 'string',
            enum: ['jest', 'vitest'],
            description: 'Test runner (default jest)',
          },
        },
        required: ['spec_path', 'out_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_graphql_stub',
      description:
        'Generate a minimal GraphQL HTTP smoke test file (POST JSON with a tiny query).',
      parameters: {
        type: 'object',
        properties: {
          out_path: {
            type: 'string',
            description: 'Output test file path relative to workspace root',
          },
          runner: {
            type: 'string',
            enum: ['jest', 'vitest'],
          },
        },
        required: ['out_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_text_file',
      description:
        'Read a UTF-8 text file from the workspace (for inspecting specs or generated tests). Max ~400KB.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path from workspace root' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_directory',
      description: 'List non-hidden files in a workspace directory (max 80 entries).',
      parameters: {
        type: 'object',
        properties: {
          directory: {
            type: 'string',
            description: 'Relative directory (use "." for root)',
          },
        },
        required: ['directory'],
      },
    },
  },
]
