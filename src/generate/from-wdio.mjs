import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * @param {string} name e.g. "CourseNotesPage" or "course-notes"
 * @returns {string} PascalCase class name
 */
export function toPageClassName(name) {
  const trimmed = String(name || 'GeneratedPage').trim()
  if (/^[A-Z][a-zA-Z0-9]*Page$/.test(trimmed)) {
    return trimmed
  }
  const pascal = trimmed
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
  return pascal.endsWith('Page') ? pascal : `${pascal}Page`
}

function escapeSingleQuoted(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/**
 * @param {object} opts
 * @param {string} opts.outFile
 * @param {string} opts.className PascalCase page class
 * @param {string} [opts.urlPath] path only, e.g. /courses/uuid
 */
export async function generateWdioPageObject(opts) {
  const { outFile, className, urlPath = '/' } = opts
  const safePath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`
  const source = `/**
 * WebdriverIO Page Object — scaffold from apitest-gen (replace TODO selectors with real locators).
 * @see https://webdriver.io/docs/pageobjects
 */
export default class ${className} {
  get pagePath() {
    return '${escapeSingleQuoted(safePath)}'
  }

  async open() {
    await browser.url(this.pagePath)
  }

  // TODO: add getters, e.g. get notesTab() { return $('#courseTabNotes') }
}
`
  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, source, 'utf8')
  return { outFile }
}

/**
 * @param {object} opts
 * @param {string} opts.outFile
 * @param {string} opts.suiteTitle top-level describe
 * @param {string} [opts.urlPath] first navigation URL (path)
 * @param {string} [opts.pageImport] optional relative import path for a Page class
 * @param {string} [opts.pageClass] class name if importing a page
 */
export async function generateWdioSpec(opts) {
  const {
    outFile,
    suiteTitle = 'WDIO spec',
    urlPath = '/',
    pageImport,
    pageClass,
  } = opts
  const safePath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`
  const titleEsc = escapeSingleQuoted(suiteTitle)

  let source
  if (pageImport && pageClass) {
    const impEsc = escapeSingleQuoted(pageImport)
    source = `import ${pageClass} from '${impEsc}'

describe('${titleEsc}', () => {
  let page
  before(async () => {
    page = new ${pageClass}()
    await page.open()
  })

  it('placeholder — add steps', async () => {
    // TODO: interact with page
  })
})
`
  } else {
    source = `describe('${titleEsc}', () => {
  it('navigates to starting path', async () => {
    await browser.url('${escapeSingleQuoted(safePath)}')
  })

  it('placeholder — add steps', async () => {
    // TODO:
  })
})
`
  }

  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, source, 'utf8')
  return { outFile }
}
