import parser from '@apidevtools/swagger-parser'

/**
 * Validate OpenAPI document; throws if invalid.
 * @param {string} specPath - Absolute path to openapi json/yaml
 */
export async function validateOpenapi(specPath) {
  await parser.validate(specPath)
}
