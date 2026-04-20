# Agent notes (Cursor / IDE)

Scope of this repo: **(1)** backend test/script generation from **REST (OpenAPI)** or **GraphQL** stubs, **(2)** **page object** scaffolding via the page-object skill.

## API test generation (`apitest-gen` CLI)

This repository ships **`apitest-gen`**, a CLI that generates API test scaffolds from **OpenAPI 3.x** and a **GraphQL** starter file.

### Quick commands (run from repo root)

```bash
npm install
node src/cli.mjs validate --spec ./examples/mini-openapi.json
node src/cli.mjs openapi --spec ./examples/mini-openapi.json --out ./generated/sample.api.test.js
node src/cli.mjs graphql --out ./generated/graphql.generated.test.js
```

### OpenAI tool agent (optional)

Requires **`OPENAI_API_KEY`** (see `.env.example`). Runs an LLM that calls **validate / generate / read_file** tools under `--cwd` (default: current directory):

```bash
export OPENAI_API_KEY=sk-...
node src/cli.mjs agent --prompt "Validate examples/mini-openapi.json and write tests to generated/agent.test.js"
```

Same capabilities as the CLI, orchestrated by the model — use **deterministic** `openapi` / `validate` commands in CI; the **agent** is for interactive use.

### Cursor skill — API tests

`.cursor/skills/api-test-generator/SKILL.md`

Say: **“Run the api-test-generator skill”** or ask to generate tests from an OpenAPI file.

### Environment (consumer API tests)

- `API_BASE_URL` — required to execute requests
- `API_AUTH_HEADER` — optional `Authorization` header value
- GraphQL stub: `GRAPHQL_URL` or fallback to `API_BASE_URL`

Never commit real tokens. Use `.env` / CI secrets.

---

## Page Object generation (agent-only)

There is **no CLI** in this repo for POMs yet — the agent follows:

`.cursor/skills/page-object-generator/SKILL.md`

**Inputs:** page name, URL path, **element table** (logical name + strategy + value), desired methods, and an @-**reference** `*.page.js` from the **automation repo** so style matches.

**Example prompts:** `examples/page-object-prompt.example.md`

Say: **“Run the page-object-generator skill”** and paste the table + attach the reference file.
