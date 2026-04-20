import * as vscode from 'vscode'
import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

/** @param {string} extensionPath */
function resolveCli(extensionPath) {
  const bundledCli = path.join(extensionPath, 'bundled', 'src', 'cli.mjs')
  const devCli = path.join(extensionPath, '..', 'src', 'cli.mjs')
  if (fs.existsSync(bundledCli)) {
    return { cliPath: bundledCli, moduleRoot: path.join(extensionPath, 'bundled') }
  }
  if (fs.existsSync(devCli)) {
    return { cliPath: devCli, moduleRoot: path.join(extensionPath, '..') }
  }
  throw new Error(
    'apitest-gen CLI not found. From repo root run: npm install. For a packaged build run: npm run bundle in vscode-extension/'
  )
}

/**
 * @param {string} moduleRoot
 * @param {string} cliPath
 * @param {string[]} args
 * @param {string} cwd
 * @param {vscode.OutputChannel} channel
 */
function runCli(moduleRoot, cliPath, args, cwd, channel) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [cliPath, ...args], {
      cwd,
      env: { ...process.env },
    })
    let out = ''
    let err = ''
    proc.stdout?.on('data', (d) => {
      const s = d.toString()
      out += s
      channel.append(s)
    })
    proc.stderr?.on('data', (d) => {
      const s = d.toString()
      err += s
      channel.append(s)
    })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) resolve(out)
      else reject(new Error(err || out || `Exit ${code}`))
    })
  })
}

/** @param {vscode.ExtensionContext} context */
export function activate(context) {
  const channel = vscode.window.createOutputChannel('apitest-gen')
  context.subscriptions.push(channel)

  const workspaceRoot = () =>
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath

  context.subscriptions.push(
    vscode.commands.registerCommand('apitest-gen.openApiValidate', async () => {
      const root = workspaceRoot()
      if (!root) {
        vscode.window.showWarningMessage('Open a folder/workspace first.')
        return
      }
      const spec = await pickOpenApiFile(root)
      if (!spec) return
      const { cliPath, moduleRoot } = resolveCli(context.extensionPath)
      channel.clear()
      channel.show(true)
      try {
        await runCli(moduleRoot, cliPath, ['validate', '--spec', spec], root, channel)
        vscode.window.showInformationMessage(`OpenAPI OK: ${spec}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        vscode.window.showErrorMessage(`Validate failed: ${msg}`)
      }
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('apitest-gen.openApiGenerate', async () => {
      const root = workspaceRoot()
      if (!root) {
        vscode.window.showWarningMessage('Open a folder/workspace first.')
        return
      }
      const spec = await pickOpenApiFile(root)
      if (!spec) return
      const runner = await vscode.window.showQuickPick(
        [
          { label: 'jest', description: 'Jest runner' },
          { label: 'vitest', description: 'Vitest runner' },
        ],
        { placeHolder: 'Test runner' }
      )
      if (!runner) return
      const defaultOut = path.join(root, 'generated', 'api.generated.test.js')
      const out = await vscode.window.showInputBox({
        title: 'Output test file',
        value: defaultOut,
      })
      if (!out) return
      const { cliPath, moduleRoot } = resolveCli(context.extensionPath)
      channel.clear()
      channel.show(true)
      try {
        await runCli(
          moduleRoot,
          cliPath,
          ['openapi', '--spec', spec, '--out', out, '--runner', runner.label],
          root,
          channel
        )
        vscode.window.showInformationMessage(`Generated: ${out}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        vscode.window.showErrorMessage(`Generate failed: ${msg}`)
      }
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('apitest-gen.graphqlStub', async () => {
      const root = workspaceRoot()
      if (!root) {
        vscode.window.showWarningMessage('Open a folder/workspace first.')
        return
      }
      const runner = await vscode.window.showQuickPick(
        [
          { label: 'jest', description: 'Jest runner' },
          { label: 'vitest', description: 'Vitest runner' },
        ],
        { placeHolder: 'Test runner' }
      )
      if (!runner) return
      const defaultOut = path.join(root, 'generated', 'graphql.generated.test.js')
      const out = await vscode.window.showInputBox({
        title: 'Output file',
        value: defaultOut,
      })
      if (!out) return
      const { cliPath, moduleRoot } = resolveCli(context.extensionPath)
      channel.clear()
      channel.show(true)
      try {
        await runCli(
          moduleRoot,
          cliPath,
          ['graphql', '--out', out, '--runner', runner.label],
          root,
          channel
        )
        vscode.window.showInformationMessage(`Wrote GraphQL stub: ${out}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        vscode.window.showErrorMessage(`graphql command failed: ${msg}`)
      }
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('apitest-gen.wdioPageScaffold', async () => {
      const root = workspaceRoot()
      if (!root) {
        vscode.window.showWarningMessage('Open a folder/workspace first.')
        return
      }
      const nameIn = await vscode.window.showInputBox({
        title: 'Page class name',
        placeHolder: 'e.g. CourseNotesPage or course-notes',
        value: 'MyFeaturePage',
      })
      if (!nameIn) return
      const urlPath = await vscode.window.showInputBox({
        title: 'URL path (after baseUrl)',
        value: '/',
      })
      if (urlPath === undefined) return
      const defaultOut = path.join(root, 'generated', 'wdio', 'MyFeature.page.js')
      const out = await vscode.window.showInputBox({
        title: 'Output Page Object file',
        value: defaultOut,
      })
      if (!out) return
      const { cliPath, moduleRoot } = resolveCli(context.extensionPath)
      channel.clear()
      channel.show(true)
      try {
        await runCli(
          moduleRoot,
          cliPath,
          [
            'wdio-page',
            '--out',
            out,
            '--name',
            nameIn,
            '--url',
            urlPath || '/',
          ],
          root,
          channel
        )
        vscode.window.showInformationMessage(`Wrote WDIO Page Object: ${out}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        vscode.window.showErrorMessage(`wdio-page failed: ${msg}`)
      }
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('apitest-gen.wdioSpecScaffold', async () => {
      const root = workspaceRoot()
      if (!root) {
        vscode.window.showWarningMessage('Open a folder/workspace first.')
        return
      }
      const title = await vscode.window.showInputBox({
        title: 'Spec describe() title',
        value: 'Feature flow',
      })
      if (!title) return
      const mode = await vscode.window.showQuickPick(
        ['browser.url skeleton', 'Import Page class'],
        { placeHolder: 'Spec style' }
      )
      if (!mode) return
      const defaultOut = path.join(root, 'generated', 'wdio', 'feature.spec.js')
      if (mode === 'browser.url skeleton') {
        const urlPath = await vscode.window.showInputBox({
          title: 'Starting URL path',
          value: '/',
        })
        if (urlPath === undefined) return
        const out = await vscode.window.showInputBox({
          title: 'Output spec file',
          value: defaultOut,
        })
        if (!out) return
        const args = [
          'wdio-spec',
          '--out',
          out,
          '--title',
          title,
          '--url',
          urlPath || '/',
        ]
        const { cliPath, moduleRoot } = resolveCli(context.extensionPath)
        channel.clear()
        channel.show(true)
        try {
          await runCli(moduleRoot, cliPath, args, root, channel)
          vscode.window.showInformationMessage(`Wrote WDIO spec: ${out}`)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          vscode.window.showErrorMessage(`wdio-spec failed: ${msg}`)
        }
        return
      }
      const pageImport = await vscode.window.showInputBox({
        title: 'Relative import path to Page file',
        value: '../pageobjects/learner/my.page.js',
      })
      if (!pageImport) return
      const pageClass = await vscode.window.showInputBox({
        title: 'Imported class name',
        value: 'MyFeaturePage',
      })
      if (!pageClass) return
      const outPage = await vscode.window.showInputBox({
        title: 'Output spec file',
        value: defaultOut,
      })
      if (!outPage) return
      const argsPage = [
        'wdio-spec',
        '--out',
        outPage,
        '--title',
        title,
        '--page-import',
        pageImport,
        '--page-class',
        pageClass,
      ]
      const { cliPath: cliPath2, moduleRoot: moduleRoot2 } = resolveCli(
        context.extensionPath
      )
      channel.clear()
      channel.show(true)
      try {
        await runCli(moduleRoot2, cliPath2, argsPage, root, channel)
        vscode.window.showInformationMessage(`Wrote WDIO spec: ${outPage}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        vscode.window.showErrorMessage(`wdio-spec failed: ${msg}`)
      }
    })
  )
}

/** @param {string} workspaceRoot */
async function pickOpenApiFile(workspaceRoot) {
  const picked = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: 'Select OpenAPI file',
    filters: {
      'OpenAPI': ['json', 'yaml', 'yml'],
      'All files': ['*'],
    },
    defaultUri: vscode.Uri.file(workspaceRoot),
  })
  if (picked?.[0]) {
    return picked[0].fsPath
  }
  return undefined
}

export function deactivate() {}
