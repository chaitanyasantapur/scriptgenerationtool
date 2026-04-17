/**
 * Extract request body example and response example from OpenAPI 3.x operation parts.
 */

/**
 * @param {Record<string, unknown> | undefined} requestBody
 * @returns {{ payload: object | null, contentType: string | null }}
 */
export function extractRequestBodyExample(requestBody) {
  if (!requestBody || typeof requestBody !== 'object') {
    return { payload: null, contentType: null }
  }

  const content = requestBody.content || {}
  const mediaTypes = Object.keys(content)
  if (mediaTypes.length === 0) {
    return { payload: null, contentType: null }
  }

  const preferred =
    mediaTypes.find((m) => m.includes('json')) ||
    mediaTypes.find((m) => m.includes('xml')) ||
    mediaTypes[0]

  const media = content[preferred]
  if (!media || typeof media !== 'object') {
    return { payload: null, contentType: preferred }
  }

  let payload = media.example
  if (payload === undefined && media.examples && typeof media.examples === 'object') {
    const keys = Object.keys(media.examples)
    const first = keys[0]
    if (first) {
      const ex = media.examples[first]
      payload = ex && typeof ex === 'object' ? ex.value : undefined
    }
  }
  if (payload === undefined && media.schema && typeof media.schema === 'object') {
    const s = media.schema
    if (s.example !== undefined) payload = s.example
  }

  if (payload !== null && payload !== undefined && typeof payload !== 'object') {
    payload = { value: payload }
  }

  return {
    payload: payload !== undefined && payload !== null ? payload : null,
    contentType: preferred,
  }
}

/**
 * First 2xx response with optional JSON example.
 * @param {Record<string, unknown> | undefined} responses
 * @returns {{ status: number, example: unknown | null, hasJsonContent: boolean }}
 */
export function extractResponseExample(responses) {
  if (!responses || typeof responses !== 'object') {
    return { status: 200, example: null, hasJsonContent: false }
  }

  const codes2xx = Object.keys(responses)
    .filter((c) => c === 'default' || /^2\d\d$/.test(c))
    .sort()

  for (const code of codes2xx) {
    const resp = responses[code]
    const parsed = parseResponseForCode(resp, code)
    if (parsed) return parsed
  }

  return { status: 200, example: null, hasJsonContent: false }
}

function parseResponseForCode(resp, code) {
  if (!resp || typeof resp !== 'object') return null

  const status =
    code === 'default' ? 200 : parseInt(String(code).replace(/\D/g, ''), 10) || 200
  const content = resp.content || {}
  const mediaTypes = Object.keys(content)
  if (mediaTypes.length === 0) return null

  const preferred =
    mediaTypes.find((m) => m.includes('json')) || mediaTypes[0]
  const media = content[preferred]
  if (!media || typeof media !== 'object') return null

  let example = media.example
  if (example === undefined && media.examples && typeof media.examples === 'object') {
    const keys = Object.keys(media.examples)
    const first = keys[0]
    if (first) {
      const ex = media.examples[first]
      example = ex && typeof ex === 'object' ? ex.value : undefined
    }
  }
  if (example === undefined && media.schema && typeof media.schema === 'object') {
    const s = media.schema
    if (s.example !== undefined) example = s.example
  }

  return {
    status,
    example: example !== undefined && example !== null ? example : null,
    hasJsonContent: preferred.includes('json'),
  }
}
