import assert from 'node:assert'
import { test } from 'node:test'
import { toPageClassName } from '../src/generate/from-wdio.mjs'
import { generateWdioPageObject, generateWdioSpec } from '../src/generate/from-wdio.mjs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

test('toPageClassName', () => {
  assert.strictEqual(toPageClassName('course-notes'), 'CourseNotesPage')
  assert.strictEqual(toPageClassName('LoginPage'), 'LoginPage')
  assert.strictEqual(toPageClassName('foo'), 'FooPage')
})

test('generateWdioPageObject writes export default class', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-pom-'))
  const out = path.join(dir, 'x.page.js')
  await generateWdioPageObject({
    outFile: out,
    className: 'TestPage',
    urlPath: '/courses/abc',
  })
  const s = await fs.readFile(out, 'utf8')
  assert.ok(s.includes('export default class TestPage'))
  assert.ok(s.includes("/courses/abc"))
})

test('generateWdioSpec without page import', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-spec-'))
  const out = path.join(dir, 'x.spec.js')
  await generateWdioSpec({
    outFile: out,
    suiteTitle: 'My flow',
    urlPath: '/home',
  })
  const s = await fs.readFile(out, 'utf8')
  assert.ok(s.includes("describe('My flow'"))
  assert.ok(s.includes("browser.url('/home')"))
})
