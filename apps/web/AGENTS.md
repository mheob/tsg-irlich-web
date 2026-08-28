<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# apps/web

The public website (Next.js App Router, Tailwind CSS, Shadcn-style components on Base UI, Sanity as CMS). The monorepo-wide conventions live in the repository root `AGENTS.md` — this file only adds what is specific to this app.

## Commands

```bash
pnpm run dev             # dev server on http://localhost:3000
pnpm run build           # production build
pnpm run lint            # oxlint (use lint:fix to autofix)
pnpm run typecheck       # tsc --noEmit
pnpm run typegen:routes  # regenerate the typed routes after adding or moving a route
pnpm run typegen:sanity  # regenerate src/types/sanity.types.generated.ts from the studio schema
pnpm run test:e2e        # Playwright end-to-end suite (mocked)
pnpm run test:e2e:ui     # the same suite in Playwright's UI mode
pnpm run e2e:record      # refresh the recorded Sanity fixtures from the real dataset
```

## Directory map

| Path | Contains |
| --- | --- |
| `src/app` | routes, colocated `_sections`, `_shared` and `_assets` folders |
| `src/actions` | server actions (`'use server'`) |
| `src/components/layout` | header, footer and other page chrome |
| `src/components/section` | full page sections that are reused across routes |
| `src/components/ui` | Shadcn-style wrappers around Base UI (CVA variants in `variants.ts`) |
| `src/components/with-logic` | components that own state, hooks or browser APIs |
| `src/lib/sanity` | client, live/preview bindings, GROQ queries, image helpers |
| `src/lib/validations` | Zod schemas shared by forms and server actions |
| `src/types` | hand-written types plus the generated Sanity types |

## Fetching content from Sanity

There are two fetchers, and the choice matters:

- **`sanityFetch` from `@/lib/sanity/live`** — used by the news routes. It serves published content normally and switches to drafts with stega encoding while draft mode is on, and `<SanityLive />` in the root layout revalidates it on content changes. Use it for every route that should be previewable in the studio's presentation tool.
- **`client.fetch` from `@/lib/sanity/client`** — used by the remaining routes, the sitemap and the RSS feed. It takes an explicit result type and its own `next.revalidate` options.

Rules for `sanityFetch`:

- Pass `stega: false` in `generateMetadata` and `generateStaticParams`. Invisible stega characters corrupt titles, meta tags and URL segments.
- The result type is inferred from the query, so do not pass a generic — queries have to be written with `defineQuery` and the types regenerated with `pnpm run typegen:sanity`.
- When stega may be active, strings are branded and can no longer be compared to literals or assigned to literal unions. Call `stegaClean()` on exactly the value that needs it (see the grid columns in `src/app/news/[category]/[slug]/page.tsx`) instead of cleaning whole page data, otherwise the click-to-edit overlays disappear.

Adding a previewable route also means adding a `mainDocuments` route and a `locations` entry in `apps/studio/plugins/presentation.ts`, and a `revalidatePath` entry in `src/app/api/revalidate/route.ts` for the affected document type.

## Internal links

A slug in Sanity only holds the **last** segment of the URL, so no link can be built from the slug alone: news articles live below their category, groups below their department (which comes from the document type, not from a field) and the home page at the root. `getInternalHref` in `src/utils/links.ts` is the single place that knows those rules — never assemble a path from a slug by hand, and never render a link when it returns `undefined`.

The GROQ side lives in `src/lib/sanity/queries/index.ts`:

- `internalLinkTarget` projects everything the resolver needs and is used wherever an `internalLink` **object field** is queried (the imprint contact form, the main navigation).
- `blockContent` does the same for the `internalLink` **marks** of a portable text field and has to be applied to every `blockContent` that is rendered, including nested ones (`grid.items[]`, `imageCard.description`).

The resolved target is added as `target` next to the untouched `link` reference, and empty arrays are coalesced, so that the query result still matches the generated schema types.

## Draft mode

`/api/draft-mode/enable` validates the studio's preview secret and turns Next.js draft mode on, `/api/draft-mode/disable` turns it off again. The root layout renders `<VisualEditing />` and the "Vorschau beenden" link only while draft mode is enabled. Draft content needs `SANITY_API_READ_TOKEN`; it is read at import time in `src/lib/sanity/live.ts`, so a missing token fails the build.

## Environment variables

Read them through `env('KEY')` from `@/lib/env` — never `process.env` directly. The helper validates a single variable lazily with Zod and caches it. A new variable has to be added to the schema in `src/lib/env.ts`, to `globalEnv` (or the matching task) in the root `turbo.json`, and to the list in the root `AGENTS.md`.

## Forms and server actions

Forms use react-hook-form with a Zod schema from `src/lib/validations`. The matching server action lives in `src/actions`, is built with `actionClient` from `@/lib/actions/safe-action` (next-safe-action) and validates the same schema via `.inputSchema()`.

## Testing

Vitest splits this app into two projects, defined in `vitest.config.ts`, by file extension: `.test.tsx` anywhere under `src/` runs in the `dom` project (jsdom); `.test.ts` runs in `node`, except under `src/components/**` and `src/hooks/**`, which also run in `dom`.

Static image imports (`.webp` and friends) are resolved by the `assetStub` Vite plugin in `vitest.config.ts` — without it, any module that imports an image fails to load in a test run.

`renderWithUser` (`test-utils/render.tsx`) is the entry point for a `.test.tsx` case — it wraps Testing Library's `render` and returns the usual result plus a `user` (`@testing-library/user-event`) already set up against the same document.

Three more helpers live in `test-utils/`:

- `setup-dom.ts` — stubs `matchMedia`, `ResizeObserver`, `IntersectionObserver`, the pointer-capture API, `scrollIntoView` and `getAnimations` (Base UI's scroll area calls the last one after mount), mocks `next/image`, `next/navigation` and `motion/react`, and registers one central `afterEach` (DOM cleanup plus every mock's state reset) as the `dom` project's `setupFiles` — a test needs neither itself. A consumer's own `afterEach` should still nest inside a `describe` rather than sit at the file's root, matching the existing `vi.fn()`-reset pattern (see `form.test.tsx`).
- `env.ts` — `loadWithEnv` resets the module registry and stubs the environment, because `src/lib/env.ts` caches validated values in a module-level `Map`. A test using it must import the module under test only as `import type` and get its runtime binding from `loadWithEnv`'s return value — see `src/utils/url.test.ts`.
- `fetch-mock.ts` — `createFetchMock` replaces `fetch` with a queue of canned responses and records every call. Recorded headers are normalized through `Headers`, same as the real `fetch`, so they come back lowercased — assert against lowercase header names.

A `vi.fn()` created inside a `vi.mock(import('…'), factory)` is not reset by `vi.resetModules()` or `vi.restoreAllMocks()` — call it explicitly in an `afterEach` (`mockedFn.mockReset()`), or its call history accumulates across cases. See `src/actions/send-contact-form.test.ts` for the pattern.

`@testing-library/jest-dom` is not installed — there is no `toBeInTheDocument()`/`toHaveAttribute()`; use `.toBeNull()`/`.not.toBeNull()` and plain attribute checks instead (see `badge.test.tsx`).

No animation prop (`initial`, `animate`, `transition`, `layoutId`, …) is ever observable through the `motion/react` mock, regardless of what a hook like `useReducedMotion` returns; `next/image`'s Next-only props (`fill`, `preload`, `sizes`, `loader`, `placeholder`, `blurDataURL`) are silently dropped rather than forwarded. Both are real, harness-imposed coverage gaps, not something to work around.

Assert what a user can observe — role, label, text, accessible name, href — never a class name and never a test-only `data-testid`.

A test that pins a known production defect rather than the intended behaviour carries a short comment directly above that `it` explaining the defect (see `src/actions/subscribe-to-newsletter.test.ts`).

## End-to-end tests

Playwright lives in `e2e/`, next to `src/`, and is separated from Vitest by extension: `*.spec.ts` is Playwright, `*.test.ts(x)` is Vitest. Vitest only ever looks below `src/`, so the two never see each other's files.

| Path | Contains |
| --- | --- |
| `e2e/specs` | the mocked suite — the one CI blocks on |
| `e2e/preview` | the smoke suite that runs against a deployed preview with real content |
| `e2e/mocks/preload.ts` | every server-side network mock, preloaded into the Next.js process |
| `e2e/fixtures` | recorded Sanity responses plus the stub image every asset resolves to |
| `e2e/support/test.ts` | the extended `test` — import `test`/`expect` from here, never from `@playwright/test` |
| `e2e/support/axe.ts` | the axe helper the accessibility sweep calls, plus its attachment shape |
| `e2e/support/axe-baseline.ts` | the accepted accessibility violations, keyed by route template |
| `e2e/support/axe-summary-reporter.ts` | renders the axe attachments into GitHub's job summary |

Two projects run every spec: `chromium` on a desktop viewport and `mobile-safari` on an iPhone 14. A spec that only applies to one of them calls `test.skip(isMobile, '…')`.

### How the mocking works

The pages render on the server, so `page.route` cannot see the requests that matter. `e2e/mocks/preload.ts` is preloaded with `NODE_OPTIONS='--import …'` (set by `playwright.config.ts`) before any application module is imported, and installs MSW over Sanity, CleverReach, Resend and Linear. It covers `next build` as well, because `generateStaticParams` queries Sanity while the pages are generated.

- An outbound request nothing handles **fails the run** — deliberately, so a new integration cannot silently reach the real service. Add a branch to the resolver in `preload.ts` instead.
- The newsletter mock decides its answer from the submitted address (`NEWSLETTER_SCENARIOS` in `preload.ts`); that is how a spec reaches the "already subscribed" path.
- Only the browser-side requests are handled in `e2e/support/test.ts`: the `<SanityLive />` event stream and the analytics beacons. That file also turns off `scroll-behavior: smooth`, which otherwise moves elements out from under the pointer mid-click in WebKit.
- `.env.e2e` is committed. Every credential in it is a dummy, because everything it names is intercepted; only the two public Sanity values are real, since the fixtures are keyed by the URLs they appear in.

The preview suite additionally needs `VERCEL_AUTOMATION_BYPASS_SECRET` (Vercel → project → Deployment Protection → "Protection Bypass for Automation", mirrored into a GitHub Actions secret). Preview deployments sit behind Vercel's SSO, so without the token every request is answered by a login page; the suite skips itself when the variable is unset.

Every run builds the app and starts its own server on port 3100. An already running one is only reused with `E2E_REUSE_SERVER=1` — a foreign server on that port cannot be checked for the mock preload, and one without it would answer from the real Sanity API while the suite still passed.

### Accessibility (axe)

`e2e/specs/accessibility.spec.ts` runs `@axe-core/playwright` over fourteen routes — the ten that render without a slug plus one department, one group, one news category and one article — in both browser projects. The rule sets are WCAG 2.1 level A and AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`); `best-practice` and the experimental tags stay out, because a suite that blocks on advice gets muted.

- The dynamic routes are reached by clicking through the overviews, never by a hard-coded slug, and are keyed in the baseline by their route template (`/news/[category]/[slug]`).
- Every scan attaches its full axe result to the test, so the HTML report — and with it the artifact CI uploads — carries the detail. `AxeSummaryReporter` folds those attachments into one markdown table in GitHub's job summary; outside Actions it does nothing.
- `KNOWN_VIOLATIONS` in `e2e/support/axe-baseline.ts` is the only way a violation is tolerated, and it is **currently empty**: the first sweep found four distinct defects and all of them were fixed. An entry is an exception that names its follow-up ticket, never a permission — anything unlisted fails the run. A baseline entry that stops firing is reported as stale in the job summary and belongs in the same commit as its fix.
- `waitForPage` waits for the document title as well as for the chrome: after a client-side navigation the title lands a tick later, and axe reports the gap as `document-title`.

### Fixtures

`pnpm run e2e:record` runs the suite against the real dataset with a real read token from `.env.local` and writes every Sanity response to `e2e/fixtures/sanity/<hash>.json`, keyed by request path plus query string. Assertions may fail during a recording run — the fixtures are still written. Re-record after changing a GROQ query or adding a route, and commit the result.

### Writing a spec

- Import `test` and `expect` from `../support/test`.
- Assert what a user can observe — role, accessible name, text, URL — never a class name, never a `data-testid`, same rule as the unit tests.
- Content assertions are pinned to the recorded fixtures, so prefer stable UI strings (navigation labels, section headings) over an article's title.
- react-hook-form resets its fields when the form hydrates. Interact with a client-only control first (the receiver select does the job), then fill the text fields — otherwise WebKit loses the input.

## Gotchas

- No `try`/`catch`/`finally` in components or hooks — the React Compiler bails out on `finally`. Await with `settle()` from `@tsgi-web/shared` and branch on `outcome.ok`.
- Type route params with the generated `PageProps<'/news/[category]'>` helper and run `pnpm run typegen:routes` after adding a route.
- Sanity images go through `urlForImage` from `@/lib/sanity/utils` into `next/image`; new image hosts need an entry in `next.config.ts`.
- Server components are the default. Add `'use client'` only in `src/components/with-logic` or colocated `_sections`, and keep the client boundary as small as possible.
