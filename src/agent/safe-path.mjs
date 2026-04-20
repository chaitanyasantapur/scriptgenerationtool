import path from 'node:path'

/**
 * Resolve `userPath` under `root` and reject path traversal.
 * @param {string} root - Absolute workspace root
 * @param {string} userPath - Relative or absolute path from user
 * @returns {string} Absolute safe path
 */
export function resolveUnderRoot(root, userPath) {
  const absRoot = path.resolve(root)
  const candidate = path.resolve(absRoot, userPath)
  const rel = path.relative(absRoot, candidate)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Path escapes workspace: ${userPath}`)
  }
  return candidate
}
