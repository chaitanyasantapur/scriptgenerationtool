---
name: api-test-generator
description: >-
  Generates REST API tests from OpenAPI 3.x specs, GraphQL smoke-test stubs, and
  minimal WebdriverIO Page Object / spec scaffolds using the apitest-gen CLI in this
  repository. Use when the user asks to scaffold API tests, GraphQL stubs, WDIO POM/spec
  starters, or run the api-test-generator workflow.
---

# API test generator (apitest-gen)

Automates **scaffolding** of API tests (Jest or Vitest + `fetch`). Output is **draft code** and must pass human review before merge.

## Prerequisites

- **Node.js 18+** on the machine running the agent.
- This repo root contains **`apitest-gen`** (`package.json` → `node src/cli.mjs` or `npx` after `npm link`).
- From the **repository root**, run `npm install` if `node_modules` is missing.
- **Optional — OpenAI tool agent:** set **`OPENAI_API_KEY`**, then run `node src/cli.mjs agent --prompt "..."` to let the model call validate/generate tools (see `README.md`). Not required for normal CLI use.

## When to use this skill

- User wants **OpenAPI → test file(s)**, a **GraphQL placeholder** test, or **WDIO Page Object / spec** starters (`wdio-page`, `wdio-spec`).
- User says “generate API tests”, “scaffold REST tests”, “tests from swagger/openapi”, “GraphQL smoke test”, “WDIO page object scaffold”, “empty spec file”.

## Critical rules

1. **Do not put secrets in generated files or in chat.** Use `process.env.API_BASE_URL`, `process.env.API_AUTH_HEADER`, `process.env.GRAPHQL_URL` only.
2. **One logical change per branch/PR** when pairing with git: e.g. one OpenAPI spec → one generated file (or one folder if the user asked for multiple services explicitly).
3. **Validate** after generation: run this repo’s `npm test` and, if the user has a target app URL, run the **consumer** project’s test command with env vars — never assume production credentials exist.
4. **Max 3 attempts** per failure loop (install failure, generation error, test run error). After 3 failures: stop, summarize, suggest manual steps.

## Workflow

### 1. Locate inputs

- Search the workspace for `openapi.yaml`, `openapi.yml`, `openapi.json`, or paths the user @-mentioned.
- For GraphQL: look for `schema.graphql`, `*.graphql` documents, or ask the user which endpoint file to target if unclear.

### 2. Validate spec (recommended before generate)

```bash
node src/cli.mjs validate --spec <ABS_PATH_TO_SPEC>
```

### 3. Generate (REST / OpenAPI)

From **this repo root** (`scriptgenerationtool` / wherever `apitest-gen` lives):

```bash
npm install
node src/cli.mjs openapi --spec <ABS_PATH_TO_SPEC> --out <ABS_PATH_TO_OUTPUT_FILE> [--runner jest|vitest]
```

Generated tests include **request body** and **response** assertions when the OpenAPI defines **`example`** / **`examples`** under `requestBody` and 2xx **`responses`**.

Default runner: `jest`. Use `vitest` if the **consumer** project uses Vitest.

Prefer output paths **outside** this tool repo if the user wants tests in **their** app repo, e.g. `../their-service/test/api/generated.test.js` — confirm with the user or use workspace-relative paths they specify.

### 4. Generate (GraphQL stub)

```bash
node src/cli.mjs graphql --out <ABS_PATH_TO_OUTPUT_FILE> [--runner jest|vitest]
```

The GraphQL command emits a **minimal smoke test** (`query { __typename }`). It does **not** read a `schema.graphql` or generate per-field tests. For a **named query** (e.g. BFF `getLearningReinforcement`), use the stub as the **template**: keep the same `fetch` + `GRAPHQL_URL` / `API_BASE_URL` + env-based auth pattern, then replace `query` / `variables` and add assertions against `data` (or the shape your client actually receives).

Remind the user: stub posts to `GRAPHQL_URL` or `API_BASE_URL`; they must set real URLs and auth.

### 5. Generate (WebdriverIO scaffolds)

Deterministic **starter files** for **WebdriverIO** — user must align with their repo’s imports, Chai, and waits.

```bash
node src/cli.mjs wdio-page --out <ABS_OUT.page.js> --name <ClassOrSlug> --url <path>
node src/cli.mjs wdio-spec --out <ABS_OUT.spec.js> --title "<describe>" --url <path>
node src/cli.mjs wdio-spec --out <ABS_OUT.spec.js> --title "<describe>" \
  --page-import <relative/path/to/page.js> --page-class <ClassName>
```

For **rich** POMs from an element table + @reference file, use **`.cursor/skills/page-object-generator/SKILL.md`** instead.

### 6. Run tests and verify

- Run **`npm test`** in **this** repo after changing the generator.
- For **generated files** in another project: `cd` to that project and run its `npm test` / `npx vitest run` with `API_BASE_URL` set to a safe stub (e.g. public `https://httpbin.org` or local mock) **only if** the user provided or approved a URL.

### 7. Documentation for the user

- Tell the user to set **`API_BASE_URL`** (required) and optionally **`API_AUTH_HEADER`** before running generated tests.
- Point to **`README.md`** in this repo for full CLI flags.

### 8. Optional: Pull request

If the user asks to open a PR:

- Create a branch: `feat/api-tests-<short-name>`.
- Commit only generated/test-related files; message: `test(api): scaffold tests from OpenAPI` (or GraphQL).
- Use `gh pr create` only if `gh` is authenticated and the directory is a git repo; otherwise list manual steps.

## Anti-looping

- Do not retry the same failing command more than **3 times** without changing strategy (e.g. different path, ask user for spec location).
- If OpenAPI is invalid or `swagger-parser` throws, report the error and stop — do not invent a spec.

## Out of scope

- Dependency or supply-chain audits (use your org’s security tooling if needed).
- Guaranteed passing tests against **private** APIs without user-supplied credentials.
