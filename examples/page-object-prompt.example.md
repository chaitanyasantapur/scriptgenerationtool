# Example prompt: Page Object (WebdriverIO)

Copy the block below into Cursor **Agent** chat. Replace bracketed parts and attach your real reference POM with `@`.

---

```text
Generate a WebdriverIO Page Object for JavaScript.

Conventions:
- One default export class per file.
- File path: pageobjects/[area]/[name].page.js  (adjust to our repo)
- Use getters that return $(selector), matching the style of @[path/to/reference.page.js]
- Prefer data-testid selectors; use role/name only if there is no test id.
- No assertions inside the page object — only navigation + element getters + small user-facing methods.
- Use our custom commands if the reference file uses them (e.g. clickWhenReady).

Page:
- Name: CheckoutShippingPage
- URL path: /checkout/shipping

Element table (logical name | strategy | value):
| emailInput        | data-testid | checkout-shipping-email     |
| countrySelect     | data-testid | checkout-shipping-country   |
| zipInput          | data-testid | checkout-shipping-zip       |
| continueButton    | data-testid | checkout-shipping-continue  |
| errorBanner       | data-testid | checkout-shipping-error     |

Methods:
- open() — navigate using our project’s browser.url / baseUrl pattern from the reference.
- fillShipping({ email, country, zip })
- clickContinue()
- isLoaded() — wait for one stable element from the table.

If anything is unclear, follow the reference POM and leave a short TODO instead of inventing selectors.
```

---

## Shorter variant

```text
Using the same Page Object style as @[path/to/login.page.js], create CheckoutShippingPage for URL /checkout/shipping.

Elements:
- email: [data-testid="checkout-shipping-email"]
- country: [data-testid="checkout-shipping-country"]
- zip: [data-testid="checkout-shipping-zip"]
- continue: [data-testid="checkout-shipping-continue"]

Add: open(), fillShipping({ email, country, zip }), clickContinue(), isLoaded().
```
