import OpenAI from 'openai'
import { AGENT_TOOLS, executeTool } from './execute-tools.mjs'

const SYSTEM = `You are an automation assistant for the apitest-gen project.

You can call tools to:
- validate OpenAPI specs before generating
- generate REST API tests from OpenAPI (Jest/Vitest + fetch, uses API_BASE_URL / API_AUTH_HEADER)
- generate a minimal GraphQL smoke test stub
- read files and list directories under the workspace only

Rules:
- Prefer validate_openapi before generate_openapi_tests when the user supplies a new or changed spec.
- Use paths relative to the workspace root (the directory where the CLI was started).
- After generating, summarize what was written and remind the user to set API_BASE_URL for running tests.
- Do not invent file paths; use list_directory or read_text_file if you need to discover layout.
- If a tool returns JSON with ok: false, explain the error and try to fix inputs or stop.
- Keep tool calls minimal; you have a limited step budget.`

/**
 * @param {object} opts
 * @param {string} opts.prompt - User goal
 * @param {string} opts.root - Workspace root (absolute)
 * @param {string} [opts.model]
 * @param {number} [opts.maxSteps] - Max assistant turns with tool rounds
 */
export async function runAgent(opts) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set. Export it or add it to a .env file (never commit secrets).'
    )
  }

  const model =
    opts.model || process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const maxSteps = Math.min(Math.max(opts.maxSteps ?? 12, 1), 32)

  const openai = new OpenAI({ apiKey })
  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: opts.prompt },
  ]

  const out = { assistantMessages: [], toolCalls: [] }

  for (let step = 0; step < maxSteps; step++) {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      tools: AGENT_TOOLS,
      tool_choice: 'auto',
      temperature: 0.2,
    })

    const choice = completion.choices[0]
    if (!choice) {
      out.assistantMessages.push('(no choice in completion)')
      break
    }

    const msg = choice.message
    messages.push(msg)

    if (msg.content) {
      out.assistantMessages.push(msg.content)
    }

    const toolCalls = msg.tool_calls
    if (!toolCalls?.length) {
      break
    }

    for (const tc of toolCalls) {
      const name = tc.function.name
      let args = {}
      try {
        args = JSON.parse(tc.function.arguments || '{}')
      } catch {
        args = {}
      }

      out.toolCalls.push({ name, args })

      const result = await executeTool(name, args, { root: opts.root })
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result,
      })
    }
  }

  return out
}
