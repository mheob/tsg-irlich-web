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
pnpm run test:e2e:visual # only the visual regression specs (skipped outside Linux)
pnpm run test:e2e:visual:update  # regenerate the screenshot baselines in the Playwright container
pnpm run e2e:record      # refresh the recorded Sanity fixtures from the real dataset
pnpm run test:lighthouse # Lighthouse CI against LHCI_BASE_URL (a deployed preview in CI)
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
| `e2e/mocks/preload.ts` | every server-side network mock plus the seeded `Math.random`, preloaded into the Next.js process |
| `e2e/fixtures` | recorded Sanity responses plus the stub image every asset resolves to |
| `e2e/__screenshots__` | the committed visual regression baselines, one folder per browser project |
| `e2e/support/test.ts` | the extended `test` — import `test`/`expect` from here, never from `@playwright/test` |
| `e2e/support/navigation.ts` | the shared page helpers (`waitForPage`, the two drill-downs) |
| `e2e/support/visual.ts` | prepares a page for a screenshot and compares it against its baseline |
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
- `preload.ts` also pins `Math.random` to a constant. The home page picks three of its testimonials at random on every render, so without it the markup — and the screenshot — differs from one request to the next. A _seeded sequence_ is not enough and was tried first: it fixes the order of the values but not the position the shuffle draws from, and how many calls come before it depends on how the build parallelized, so a local baseline and a CI run still disagreed. A constant takes the position out of the equation.

The preview suite additionally needs `VERCEL_AUTOMATION_BYPASS_SECRET` (Vercel → project → Deployment Protection → "Protection Bypass for Automation", mirrored into a GitHub Actions secret). Preview deployments sit behind Vercel's SSO, so without the token every request is answered by a login page; the suite skips itself when the variable is unset.

Every run builds the app and starts its own server on port 3100. An already running one is only reused with `E2E_REUSE_SERVER=1` — a foreign server on that port cannot be checked for the mock preload, and one without it would answer from the real Sanity API while the suite still passed.

### Accessibility (axe)

`e2e/specs/accessibility.spec.ts` runs `@axe-core/playwright` over fourteen routes — the ten that render without a slug plus one department, one group, one news category and one article — in both browser projects. The rule sets are WCAG 2.1 level A and AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`); `best-practice` and the experimental tags stay out, because a suite that blocks on advice gets muted.

- The dynamic routes are reached by clicking through the overviews, never by a hard-coded slug, and are keyed in the baseline by their route template (`/news/[category]/[slug]`).
- Every scan attaches its full axe result to the test, so the HTML report — and with it the artifact CI uploads — carries the detail. `AxeSummaryReporter` folds those attachments into one markdown table in GitHub's job summary; outside Actions it does nothing.
- `KNOWN_VIOLATIONS` in `e2e/support/axe-baseline.ts` is the only way a violation is tolerated. The first sweep found four distinct defects and all of them were fixed; the list holds one entry today, `aria-toggle-field-name` on `/`, `/kontakt` and `/kontakt/feedback`, for the unnamed privacy checkbox that WEB-302 removes. That node only enters the accessibility tree after hydration, so the sweep saw it for the first time when the suite moved into the Playwright container — on a fast runner axe still measures before hydration and the entry is reported as stale instead. An entry is an exception that names its follow-up ticket, never a permission — anything unlisted fails the run. A baseline entry that stops firing is reported as stale in the job summary and belongs in the same commit as its fix.
- `waitForPage` waits for the document title as well as for the chrome: after a client-side navigation the title lands a tick later, and axe reports the gap as `document-title`.

### Visual regression

`e2e/specs/visual.spec.ts` takes a full-page screenshot of eight routes — `/`, `/verein`, `/angebot`, `/news`, `/mitgliedschaft`, `/kontakt` plus one department and one news article — in both browser projects, and compares it against the baseline committed under `e2e/__screenshots__/<project>/`. The three legal pages are deliberately left out: they are the same prose layout three times over and would only add baselines to re-approve on every typography change.

The container ships its browsers under `/ms-playwright`, and two things have to name that path for a run to find them: `PLAYWRIGHT_BROWSERS_PATH` in the job's `env` (a container job's steps do not inherit the image's own `ENV`), and the same variable in the `test:e2e` task in the root `turbo.json` — the suite is started through Turbo, which passes on nothing it was not told about.

**Baselines are Linux-only.** A screenshot is comparable against the platform that produced it and nothing else, so both CI and the local update path run inside the pinned container `mcr.microsoft.com/playwright:v1.62.1-noble`. Outside Linux `visual.spec.ts` skips itself, which keeps a macOS `pnpm run test:e2e` from writing baselines nobody can match. The image tag appears in `.github/workflows/e2e.yml` and in `apps/web/scripts/update-screenshots.sh`, and both have to be bumped together with `@playwright/test`.

#### Approving an intended design change

```bash
pnpm --filter web run test:e2e:visual:update   # needs a running Docker daemon
git add apps/web/e2e/__screenshots__
```

The script runs the visual suite with `--update-snapshots` in the container and writes the refreshed PNGs straight into the working tree. It pins everything CI pins — the image tag, `--platform linux/amd64` and the Node version from `.nvmrc` — because a baseline taken on another architecture is not the one CI compares against; on Apple Silicon that means an emulated run, so give it time. The repository is bind-mounted, but the workspace `node_modules` trees and `.next` are named volumes, so the host's macOS install is never overwritten and the second run starts warm. Review the diff before committing — a baseline update is a design change being approved, and it belongs in the same commit as the change that caused it.

When a comparison fails in CI, the `playwright-report` artifact carries the expected, actual and diff PNG of every failure; that is the only way to judge the change from the outside.

#### What keeps the shots stable

- `expectPageToMatchBaseline` in `e2e/support/visual.ts` is the only entry point, and `installScreenshotEnvironment` from the same file belongs in the spec's `beforeEach` — `addInitScript` only reaches navigations that come after it. Together they freeze animation delays and the text caret, load every deferred image, and wait for the fonts and the images before the shot.
- A full-page screenshot in Chromium captures beyond the viewport **without** scrolling, which breaks anything that waits to be scrolled to. `loading="lazy"` is flipped to `eager` on every image so the browser loads them natively rather than through an observer.
- `installScreenshotEnvironment` replaces `IntersectionObserver` with one that **never reports**, which pins the spring-animated counters in the stats section to the value the server rendered. Letting them run and then waiting for them to settle does not work: how far a spring has come depends on when the browser scheduled its animation frames, and under load a page goes a long time between frames while timers keep firing — CI captured `58+` against a baseline holding `60+` that way. `useInView` in `number-ticker.tsx` is the only intersection observer the app uses today; a reveal-on-scroll pattern added later would be captured in its hidden state and needs the stub revisited.
- The stub is deliberately not part of the shared `test` fixture in `e2e/support/test.ts`. The other suites should see the page the way a visitor does, animations included.
- Only one region is masked, the footer's `©<year>`. Every date on a page is content and comes from the recorded fixtures; the copyright year comes from `new Date()` and would turn each New Year's Eve into a red suite.
- `maxDiffPixelRatio` is 0.005 (`playwright.config.ts`). Everything runs in one pinned image, so the only expected difference is font antialiasing on a redrawn glyph — well under half a percent, and far below the footprint of any layout shift.
- Fonts are loaded through `next/font/google`, which self-hosts them at build time. Nothing is fetched from Google at runtime, so a network hiccup cannot change a baseline.

### Fixtures

`pnpm run e2e:record` runs the suite against the real dataset with a real read token from `.env.local` and writes every Sanity response to `e2e/fixtures/sanity/<hash>.json`, keyed by request path plus query string. Assertions may fail during a recording run — the fixtures are still written. Re-record after changing a GROQ query or adding a route, and commit the result.

### Writing a spec

- Import `test` and `expect` from `../support/test`.
- Assert what a user can observe — role, accessible name, text, URL — never a class name, never a `data-testid`, same rule as the unit tests.
- Content assertions are pinned to the recorded fixtures, so prefer stable UI strings (navigation labels, section headings) over an article's title.
- react-hook-form resets its fields when the form hydrates. Interact with a client-only control first (the receiver select does the job), then fill the text fields — otherwise WebKit loses the input.

## Lighthouse and Speed Insights

Two different things measure the same subject. `@vercel/speed-insights` sits in the root layout next to `@vercel/analytics` and reports what real visitors actually experience (field data, Core Web Vitals from their own browsers). Lighthouse CI is the lab counterpart: one throttled synthetic run per pull request, which is what catches a regression before anyone lives through it.

### Lighthouse CI

`lighthouserc.cjs` configures it, `.github/workflows/lighthouse.yml` runs it on `deployment_status` — the same trigger as the preview end-to-end suite, and for the same reason: only a real deployment has the CDN, the image optimizer and the real payloads behind it. A local `next start` would score the runner rather than the site. The job needs `VERCEL_AUTOMATION_BYPASS_SECRET` and skips its run step without it, exactly like the preview suite.

- **Five routes**, three runs each, median reported: `/`, `/verein`, `/angebot`, `/news`, `/kontakt` — the home page with its hero and counters, one prose page, one card overview, the news list and the form page. No dynamic route: a department or an article is only reachable through a slug that lives in the dataset, and Lighthouse takes URLs and nothing else. Those routes stay with Playwright, which clicks its way there.
- **Accessibility, best practices and SEO are hard assertions at a perfect score.** They barely move between runs, so there is no reason to accept less. Best practices only holds because `https://tsg-irlich-*-mheobs-projects.vercel.app` is a CORS origin on the Sanity project: without it the Live Content API stream cannot connect from a preview, and `errors-in-console` catches the CORS failure plus three `<SanityLive> is attempting to reconnect`. A renamed Vercel project breaks that pattern and the assertion with it.
- **Performance is a warning, never a failure**, and so are the LCP / TBT / CLS budgets underneath it. A GitHub runner shares its CPU with whatever else the machine is doing and the score swings about ten points between two identical runs; a gate on that flaps and gets muted.
- `is-crawlable` is in `collect.settings.skipAudits`, not in the assertions: Vercel answers every preview with `X-Robots-Tag: noindex`, and the audit carries a third of the SEO category. An assertion set to `off` would not have helped — it stops the assertion but leaves the failing audit inside the category score, which is exactly how SEO landed at 0.66 on the first real run. What robots.txt serves is covered by `robots.ts` and its test. `aria-toggle-field-name` stays an `off` assertion, the same defect `KNOWN_VIOLATIONS` in `e2e/support/axe-baseline.ts` tolerates; it is deleted together with the baseline entry when WEB-302 lands.
- The reports are written to `apps/web/lighthouse-report` and leave CI as an artifact. Lighthouse CI's `temporary-public-storage` target is deliberately not used — it publishes every report to a bucket anyone with the link can read.
- `@lhci/cli` drags three transitive packages that `pnpm run cve` flags high: `tmp`, `@puppeteer/browsers` and the `proxy-agent` its 3.x line wants. All three are pinned forward in `pnpm-workspace.yaml`, each with its advisory in a comment — the audit and `pnpm peers check` both stay clean.
- The whole job is `continue-on-error: true` for now, like the preview suite. Flip it to blocking once a handful of pull requests have shown the three hard categories holding at 1.

A `deployment_status` run cannot be replayed — GitHub cannot rebuild the event — so the workflow also takes a `workflow_dispatch` with a `url` input. That is how a deployment that is already up gets re-measured, and how production gets scored on demand.

Run it locally against anything reachable:

```bash
LHCI_BASE_URL=http://localhost:3000 pnpm --filter web run test:lighthouse
```

The first real run against a preview scored accessibility 1.0, SEO 0.66 (before `is-crawlable` was skipped), best practices 0.96 and performance 0.77–0.84 with an LCP between 3.8s and 5.0s. A preview deployment is cold, so read the performance numbers as an upper bound on what production costs, not as production itself.

A local run scores best practices at 0.96, and the gap is entirely local: `errors-in-console` picks up the Sanity live stream failing CORS against `localhost` plus the 404s for `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js`, none of which exist outside Vercel. Read a local number as a relative signal, never as the one CI asserts on.

### Speed Insights

`<SpeedInsights />` needs nothing but the Vercel project it is deployed to — no environment variable, no key. It ships a script and a beacon per page view, and the end-to-end suite drops both: `ANALYTICS` in `e2e/support/test.ts` covers `/_vercel/speed-insights/**` alongside the analytics patterns. A unit test that renders the root layout mocks the component away for the same reason the analytics one is mocked — its entry point is Next-internal client code a node test run cannot resolve.

## Gotchas

- No `try`/`catch`/`finally` in components or hooks — the React Compiler bails out on `finally`. Await with `settle()` from `@tsgi-web/shared` and branch on `outcome.ok`.
- Type route params with the generated `PageProps<'/news/[category]'>` helper and run `pnpm run typegen:routes` after adding a route.
- Sanity images go through `urlForImage` from `@/lib/sanity/utils` into `next/image`; new image hosts need an entry in `next.config.ts`.
- Server components are the default. Add `'use client'` only in `src/components/with-logic` or colocated `_sections`, and keep the client boundary as small as possible.
