#!/usr/bin/env node
/**
 * Copies the CLI source and installs production deps into vscode-extension/bundled/
 * so `vsce package` can ship a self-contained extension.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extRoot = path.join(__dirname, '..')
const repoRoot = path.join(extRoot, '..')
const bundled = path.join(extRoot, 'bundled')

if (fs.existsSync(bundled)) {
  fs.rmSync(bundled, { recursive: true })
}

fs.mkdirSync(path.join(bundled, 'src'), { recursive: true })
fs.cpSync(path.join(repoRoot, 'src'), path.join(bundled, 'src'), { recursive: true })
fs.copyFileSync(path.join(repoRoot, 'package.json'), path.join(bundled, 'package.json'))

execSync('npm install --omit=dev', { cwd: bundled, stdio: 'inherit' })
console.log(`Bundled CLI → ${bundled}`)
