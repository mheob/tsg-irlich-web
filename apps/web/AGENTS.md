<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# apps/web

The public website (Next.js App Router, Tailwind CSS, Shadcn UI, Sanity as CMS). The monorepo-wide conventions live in the repository root `AGENTS.md` — this file only adds what is specific to this app.

## Commands

```bash
pnpm run dev             # dev server on http://localhost:3000
pnpm run build           # production build
pnpm run lint            # oxlint (use lint:fix to autofix)
pnpm run typecheck       # tsc --noEmit
pnpm run typegen:routes  # regenerate the typed routes after adding or moving a route
pnpm run typegen:sanity  # regenerate src/types/sanity.types.generated.ts from the studio schema
```

## Directory map

| Path                        | Contains                                                       |
| --------------------------- | -------------------------------------------------------------- |
| `src/app`                   | routes, colocated `_sections`, `_shared` and `_assets` folders |
| `src/actions`               | server actions (`'use server'`)                                |
| `src/components/layout`     | header, footer and other page chrome                           |
| `src/components/section`    | full page sections that are reused across routes               |
| `src/components/ui`         | Shadcn-style primitives (CVA variants in `variants.ts`)        |
| `src/components/with-logic` | components that own state, hooks or browser APIs               |
| `src/lib/sanity`            | client, live/preview bindings, GROQ queries, image helpers     |
| `src/lib/validations`       | Zod schemas shared by forms and server actions                 |
| `src/types`                 | hand-written types plus the generated Sanity types             |

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

Three helpers live in `test-utils/`:

- `setup-dom.ts` — stubs `matchMedia`, `ResizeObserver` and `IntersectionObserver`; wired as the `dom` project's `setupFiles`.
- `env.ts` — `loadWithEnv` resets the module registry and stubs the environment, because `src/lib/env.ts` caches validated values in a module-level `Map`. A test using it must import the module under test only as `import type` and get its runtime binding from `loadWithEnv`'s return value — see `src/utils/url.test.ts`.
- `fetch-mock.ts` — `createFetchMock` replaces `fetch` with a queue of canned responses and records every call. Recorded headers are normalized through `Headers`, same as the real `fetch`, so they come back lowercased — assert against lowercase header names.

## Gotchas

- No `try`/`catch`/`finally` in components or hooks — the React Compiler bails out on `finally`. Await with `settle()` from `@tsgi-web/shared` and branch on `outcome.ok`.
- Type route params with the generated `PageProps<'/news/[category]'>` helper and run `pnpm run typegen:routes` after adding a route.
- Sanity images go through `urlForImage` from `@/lib/sanity/utils` into `next/image`; new image hosts need an entry in `next.config.ts`.
- Server components are the default. Add `'use client'` only in `src/components/with-logic` or colocated `_sections`, and keep the client boundary as small as possible.
