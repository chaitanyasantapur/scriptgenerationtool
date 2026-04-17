# Agent notes (Cursor / IDE)

## API test generation (`apitest-gen` CLI)

This repository ships **`apitest-gen`**, a CLI that generates API test scaffolds from **OpenAPI 3.x** and a **GraphQL** starter file.

### Quick commands (run from repo root)

```bash
npm install
node src/cli.mjs validate --spec ./examples/mini-openapi.json
node src/cli.mjs openapi --spec ./examples/mini-openapi.json --out ./generated/sample.api.test.js
node src/cli.mjs graphql --out ./generated/graphql.generated.test.js
```

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
