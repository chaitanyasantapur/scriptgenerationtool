---
name: page-object-generator
description: >-
  Generates WebdriverIO (or similar) Page Object modules from a URL, element table,
  and optional reference POM. Use when the user asks for page objects, POM scaffolding,
  selectors from a table, or "generate a page object" for UI automation.
---

# Page Object generator (POM)

Produces **Page Object** class files for **UI automation** (WebdriverIO-style by default). Output must match the **target repo’s** patterns — the agent must **read a reference file** from the user’s automation repo when available.

## Prerequisites

- User should provide or @-mention a **reference Page Object** from their repo (e.g. `login.page.js`) so style matches.
- **Node / CLI is not required** for pure generation — this skill is **agent + template** unless a future CLI exists in this repo.

## Inputs to collect (minimum)

1. **Page name** — e.g. `CheckoutShippingPage`
2. **URL or path** — e.g. `/checkout/shipping`
3. **Element table** — rows: logical name | strategy (`data-testid`, `role`, etc.) | value
4. **Methods** — e.g. `open()`, `fillForm()`, `clickContinue()`, `isLoaded()`
5. **Conventions** — language (JS/TS), file path pattern, default export vs named, assertion library stays **out** of POM unless the team does otherwise

## Critical rules

1. **No secrets** in page objects.
2. **Prefer stable selectors** — `data-testid` when listed; avoid long XPath unless the user allows it.
3. If selectors are missing, emit **`TODO`** comments — do not invent fragile CSS for dynamic apps.
4. **Max 3 revise attempts** if the user says the output doesn’t match their repo; then ask for a clearer @-reference file.

## Workflow

### 1. Resolve target repo context

- If the user works in **another repo** (automation project), ask them to @-mention:
  - one **reference POM**
  - optional **base page** or **wdio config** for URL/baseUrl patterns

### 2. Generate the file

- Match **imports**, **getter style**, **click helpers** (`clickWhenReady`, etc.) from the reference.
- Map each **element table** row to a getter or a small `selectors` object — follow whatever the reference uses.
- Implement **methods** as thin, user-intent actions (not one method per raw click unless trivial).

### 3. Output location

- Prefer the path the user specifies (e.g. `pageobjects/checkout/shipping.page.js`).
- If unspecified, suggest a path consistent with the reference file’s directory layout.

### 4. Handoff

- Remind the user: run the suite locally, add/adjust `data-testid` in the app if selectors were TODO.

## Example prompt template

See **`examples/page-object-prompt.example.md`** in this repository for copy-paste text.

## Out of scope

- Generating **full E2E specs** (only POM unless explicitly asked)
- **API test generation** — use the **api-test-generator** skill instead
