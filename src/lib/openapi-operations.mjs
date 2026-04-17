import {
  extractRequestBodyExample,
  extractResponseExample,
} from './openapi-examples.mjs'

/**
 * Flatten OpenAPI 3.x paths into a list of operations with resolved hints for codegen.
 * @param {Record<string, unknown>} api - Parsed OpenAPI document
 */
export function listOperations(api) {
  const paths = api.paths || {}
  const servers = api.servers || []
  const defaultServer = servers[0]?.url || ''

  const httpMethods = [
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'head',
    'options',
    'trace',
  ]

  const operations = []

  for (const pathTemplate of Object.keys(paths)) {
    const pathItem = paths[pathTemplate]
    if (!pathItem || typeof pathItem !== 'object') continue

    for (const method of httpMethods) {
      const op = pathItem[method]
      if (!op) continue

      const mergedParams = mergeParameters(pathItem.parameters, op.parameters)

      const operationId =
        op.operationId ||
        `${method}_${pathTemplate}`.replace(/[^a-zA-Z0-9]+/g, '_')

      const pathParams = collectParams(mergedParams, 'path')
      const queryParams = collectParams(mergedParams, 'query')
      const headerParams = collectParams(mergedParams, 'header')

      const bodyEx = extractRequestBodyExample(
        /** @type {Record<string, unknown> | undefined} */ (op.requestBody)
      )
      const respEx = extractResponseExample(
        /** @type {Record<string, unknown> | undefined} */ (op.responses)
      )

      operations.push({
        method: method.toUpperCase(),
        pathTemplate,
        resolvedPath: resolvePath(pathTemplate, pathParams),
        operationId: sanitizeId(operationId),
        summary: op.summary || '',
        pathParams,
        queryParams,
        headerParams,
        hasBody: Boolean(op.requestBody),
        bodyExample: bodyEx.payload,
        bodyContentType: bodyEx.contentType,
        expectedStatus: respEx.status,
        responseExample: respEx.example,
        responseHasJson: respEx.hasJsonContent,
        defaultServer,
      })
    }
  }

  return operations
}

/** Path-level params first; operation-level overrides same name+in. */
function mergeParameters(pathLevel, opLevel) {
  const map = new Map()
  for (const p of pathLevel || []) {
    if (p?.name && p?.in) map.set(`${p.in}:${p.name}`, p)
  }
  for (const p of opLevel || []) {
    if (p?.name && p?.in) map.set(`${p.in}:${p.name}`, p)
  }
  return [...map.values()]
}

function collectParams(parameters, location) {
  if (!Array.isArray(parameters)) return []
  return parameters
    .filter((p) => p && p.in === location)
    .map((p) => ({
      name: p.name,
      required: Boolean(p.required),
      example: exampleFromParam(p),
    }))
}

function exampleFromParam(p) {
  const s = p.schema
  if (s?.example !== undefined) return s.example
  if (s?.default !== undefined) return s.default
  if (s?.enum?.length) return s.enum[0]
  if (s?.type === 'integer' || s?.type === 'number') return 1
  if (s?.type === 'boolean') return true
  return 'REPLACE_ME'
}

/** Replace {id} style segments with example or placeholder. */
export function resolvePath(pathTemplate, pathParams) {
  let out = pathTemplate
  const byName = Object.fromEntries(pathParams.map((p) => [p.name, p]))

  const re = /\{([^}]+)\}/g
  out = out.replace(re, (_, name) => {
    const p = byName[name]
    if (p?.example !== undefined) return encodeURIComponent(String(p.example))
    return `{${name}}`
  })

  return out
}

function sanitizeId(id) {
  return String(id).replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1')
}
