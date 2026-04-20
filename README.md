# scriptgenerationtool

This repository is for **two things**:

1. **Backend script generation (REST or GraphQL)** — **`apitest-gen` CLI**: **OpenAPI 3.x** → **Jest** or **Vitest** test scaffolds (`fetch` + env-based URL/auth), plus a **GraphQL** smoke stub.
2. **Page Object builder** — **Cursor skill** for WebdriverIO-style **POMs** from a URL + element table (see `.cursor/skills/page-object-generator/`).

> Generated code is **starter material** — review, harden selectors, and add real assertions before relying on it in CI.

## Requirements

- **Node.js 18+** (global `fetch`)

## Install

```bash
cd scriptgenerationtool
npm install
npm link   # optional: makes `apitest-gen` available globally on this machine
```

Or run without linking:

```bash
node src/cli.mjs --help
```

### Validate OpenAPI (CI-friendly)

Fails with exit code `1` if the spec is invalid or `$ref`s cannot be resolved:

```bash
node src/cli.mjs validate --spec ./path/to/openapi.yaml
```

## Usage

### OpenAPI → test file

```bash
apitest-gen openapi --spec ./path/to/openapi.yaml --out ./generated/api.test.js
apitest-gen openapi --spec ./openapi.json --runner vitest --out ./generated/api.test.mjs
```

Environment variables expected by generated code:

| Variable | Meaning |
|----------|---------|
| `API_BASE_URL` | **Required** at runtime (e.g. `https://api.example.com`) |
| `API_AUTH_HEADER` | Optional full `Authorization` header value (e.g. `Bearer eyJ...`) |

**What gets generated (v0.2+):**

- **Request bodies** — `POST` / `PUT` / `PATCH` (and `DELETE` when `requestBody` is set) use **`example`** or **`examples.*.value`** from `requestBody.content` (prefers `application/json`). If the spec has a body but no example, the test sends `{}` with a `TODO` comment.
- **Assertions** — Expects HTTP **status** from the first **2xx** response in the spec. If that response includes a JSON **`example`**, the test uses **`toMatchObject`** (objects), **`toEqual`** (arrays), or **`toBe`** (primitives). Add or refine examples in OpenAPI to tighten tests.

Run tests:

```bash
export API_BASE_URL=https://httpbin.org
npx jest generated/api.test.js
# or
npx vitest run generated/api.test.mjs
```

### GraphQL stub

```bash
apitest-gen graphql --out ./generated/graphql.test.js --runner vitest
```

Uses `GRAPHQL_URL` or falls back to `API_BASE_URL` for the POST endpoint.

### AI agent (OpenAI tool-calling)

Runs an **LLM loop** that can call the same operations as the CLI (validate, generate OpenAPI tests, GraphQL stub, read files) — **requires `OPENAI_API_KEY`** (never commit it; use `.env` locally).

```bash
export OPENAI_API_KEY=sk-...   # or load from .env in your shell
node src/cli.mjs agent --prompt "Validate examples/mini-openapi.json and generate tests to generated/agent.api.test.js"
```

Options: `--model gpt-4o-mini` (default), `--max-steps 12`, `--cwd /path/to/workspace` (paths in tools stay under this root).

The agent is **optional**; deterministic commands (`openapi`, `validate`, `graphql`) work without any API key.

## Example

```bash
node src/cli.mjs validate --spec examples/mini-openapi.json
node src/cli.mjs openapi --spec examples/mini-openapi.json --out generated/sample.api.test.js
```

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`) runs **`npm test`**, **`apitest-gen validate`**, and a **generate smoke check** on each push/PR.

## VS Code / Cursor extension (optional)

The **`vscode-extension/`** folder is a marketplace-ready wrapper around the same CLI.

**Local development (this repo clone)**

1. `cd vscode-extension && npm install`
2. In VS Code or Cursor: **Run → Start Debugging**, or **F5** with “Launch Extension” (add `.vscode/launch.json` if you want one-click debug).
3. In the Extension Development Host window, open a folder that contains an OpenAPI file, then run **Command Palette → “apitest-gen:”** commands.

**Build a `.vsix` for side-loading or publishing**

Use **Node.js 20+** for the packaging step (`@vscode/vsce` does not run reliably on Node 18).

```bash
cd vscode-extension
npm install
npm run bundle   # copies CLI + production deps into bundled/
npx vsce package --no-dependencies
```

This produces `apitest-gen-0.2.0.vsix`. Install: **Extensions → … → Install from VSIX…**

**Publish to the Marketplace** (one-time: [Azure DevOps publisher](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher), Personal Access Token), then:

```bash
npx vsce login <publisher>
npx vsce publish
```

The **`publisher`** field in `vscode-extension/package.json` must match your Marketplace publisher ID (e.g. `krishnachaitanyasant`).

## Programmatic API

```javascript
import { generateFromOpenapi, runAgent } from 'apitest-gen'

await generateFromOpenapi({
  specPath: './openapi.yaml',
  outFile: './tests/api.generated.test.js',
  runner: 'jest',
})

// Optional: programmatic agent (needs OPENAI_API_KEY)
await runAgent({
  prompt: 'Validate and generate from ./openapi.yaml',
  root: process.cwd(),
  model: 'gpt-4o-mini',
  maxSteps: 12,
})
```

## Cursor agent skills

Project skills live under `.cursor/skills/`. **Agent hints:** see **`AGENTS.md`**.

| Skill | Path | When to use |
|-------|------|-------------|
| **API tests** | `.cursor/skills/api-test-generator/SKILL.md` | OpenAPI / GraphQL HTTP test scaffolds; runs the CLI in this repo |
| **Page objects** | `.cursor/skills/page-object-generator/SKILL.md` | WebdriverIO-style POM from URL + element table; @-mention a reference POM in **your** automation repo |

**Examples**

- *“Run the api-test-generator skill”* — point at an OpenAPI file or `examples/mini-openapi.json`.
- *“Run the page-object-generator skill”* — include page name, URL, element table; attach a reference `*.page.js`.

Copy-paste prompts for POMs: **`examples/page-object-prompt.example.md`**.

You do **not** need a VS Code Marketplace extension for these — Cursor loads project skills from this repo.

## Roadmap (ideas)

- Optional **CLI** for Page Object templates (YAML → `.page.js`) alongside the agent skill
- Split OpenAPI output: one file per tag or operation
- Stronger GraphQL: introspection + operation file → tests

## License

MIT
