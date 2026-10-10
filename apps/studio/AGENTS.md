# apps/studio

The Sanity Studio for the TSG Irlich website. Content is authored in German, so every `title` and `description` in a schema is German. The monorepo-wide conventions live in the repository root `AGENTS.md` — this file only adds what is specific to this app.

## Commands

```bash
pnpm run dev             # studio on http://localhost:3333
pnpm run build           # production build
pnpm run deploy          # deploy the studio
pnpm run extract-types   # extract the schema for the web app's typegen
pnpm run typecheck       # tsc --noEmit
pnpm run lint            # oxlint (use lint:fix to autofix)
```

After **every** schema change, run from the repository root:

```bash
pnpm run extract-types && pnpm run typegen:sanity
```

The web app's `src/types/sanity.types.generated.ts` is generated from that extract, so skipping it leaves the frontend types lying.

## Directory map

| Path | Contains |
| --- | --- |
| `schemas/documents` | editable document types (`news.article`, `person`, `group.*`, …) |
| `schemas/single-pages` | one-off page documents (home, contact, news overview, …) |
| `schemas/singletons` | global documents such as the site settings |
| `schemas/objects` | reusable objects (links, images, stats, …) |
| `schemas/sections` | the building blocks of the rich content array |
| `shared/fields`, `shared/sections` | field and section definitions reused across schemas |
| `shared/field-groups.ts` | the named field groups used in the editor tabs |
| `plugins` | studio plugins: structure, singletons, assist presets, presentation |
| `structure` | the custom desk structure, grouped by topic |
| `components` | custom input and preview components |
| `utils`, `constants` | helpers (`getFieldWithGroup`, date formatting, departments, …) |

## Schema conventions

- Always `defineType` / `defineField` / `defineArrayMember`, imported from `sanity`.
- One schema per file, `export default` the definition, and register it in `schemas/index.ts`.
- File names follow the type name: `news.article.ts` for `news.article`.
- Icons come from `react-icons/ri` or `@sanity/icons`.
- Reuse `shared/fields/*` instead of redeclaring title, slug, meta or content fields, and attach them to a group with `getFieldWithGroup` from `utils/fields.ts`.
- Group names come from `shared/field-groups.ts` so the tabs stay consistent across documents.

## Adding a document type

1. Create the schema and register it in `schemas/index.ts`.
2. Give it a place in the desk: add a list item in `structure/index.ts` (and keep `isExcludedDefaultListItem` in sync so it does not show up twice).
3. For a singleton or single page, add it to both lists in `plugins/index.ts` (`pageStructure` and `singletonPlugin`) — singleton document actions are additionally restricted through `singletonTypes` in `sanity.config.ts`.
4. If the type is rendered on the website, add a `mainDocuments` route and a `locations` entry in `plugins/presentation.ts`, and a `revalidatePath` entry in the web app's `src/app/api/revalidate/route.ts`.
5. Run `pnpm run extract-types && pnpm run typegen:sanity` from the repository root.

## TSG-Echo issues

`echo.issue` holds one issue of the club magazine. Editors fill in title, slug, release date, PDF, intro and meta; everything in the group "Seiten (automatisch)" (`pages`, `extractedText`, `render`) is read-only and written by the web app's render route (`apps/web/src/app/api/echo/render`), which a webhook calls (see `docs/SANITY_WEBHOOK_SETUP.md`). `render.status` is `pending`, `done` or `failed`; `render.error` carries the German reason of a failure. The document action "Seiten neu erzeugen" (`actions/regenerate-echo-pages.tsx`) removes `render`, which makes the webhook fire again. A run still `pending` 15 minutes after `render.startedAt` was cut off by the platform; the list then shows "Abgebrochen – „Seiten neu erzeugen“". `validatePdfFile` (`shared/fields/pdf.ts`) checks the extension in the asset reference, because the stored value carries no mime type. The AI Assist preset "Intro erzeugen" in `plugins/assist.ts` reads `extractedText` through a `fieldRef`; scanned issues have no text layer, so it has nothing to work with there.

`echoOverview` is the singleton behind `/verein/tsg-echo`. It is not an internal link target yet — WEB-352 adds it together with the page.

## Content migrations

A schema change that moves existing data comes with a migration in `migrations/<id>/index.ts` (`defineMigration` from `sanity/migrate`), next to a test for its pure parts. `sanity migration run` does a dry run by default and needs both the project and the dataset:

```bash
pnpm exec sanity migration run <id> --project j4rxwl5m --dataset development
pnpm exec sanity migration run <id> --project j4rxwl5m --dataset development --no-dry-run
```

Run it on `development` first (the e2e fixtures are recorded from there), then on `production`, and before the change ships if the website reads the new shape. Without an interactive terminal, for instance from an agent, the real run also needs `--no-confirm`: the CLI refuses to show its confirmation prompt there and aborts.

## Preview (presentation tool)

`plugins/presentation.ts` renders the website in an iframe next to the editor. It calls `/api/draft-mode/enable` on the frontend, so the frontend origin has to be a CORS origin of the Sanity project **with credentials allowed**. The previewed site comes from `SANITY_STUDIO_PREVIEW_URL` (default `http://localhost:3000`), and `allowOrigins` limits which origins may talk to the studio.

`mainDocuments` maps a URL to the document that is edited when the preview navigates there; `locations` powers the "Verwendet auf" links on a document. The `select` of `defineLocations` only understands plain field paths — a dereference such as `categories[0]->slug.current` makes the Content Lake reject the preview query — so the locations are resolved through `documentStore.listenQuery` with a GROQ query that projects the location state itself.

The order of the plugins in `plugins/index.ts` is the order of the studio's top navigation (Structure, Media, Presentation, Vision in development, then the built-in Releases).

## Testing

A single `vitest.config.ts` (jsdom, `**/*.test.{ts,tsx}`) covers the whole app — no project split like `apps/web`. Beyond the plain utilities (`utils/`), most schema coverage comes from calling `preview.prepare` and a `Rule.custom(...)` predicate as plain functions directly on the exported definition object — schema definitions are plain objects, so no Sanity runtime is needed. Only `Rule.custom` predicates are reachable this way; a `Rule.required().min().error(...)` builder chain has no function to extract and call, so those validations are deliberately left untested. A fake `Rule` object (`{ custom: (fn) => fn }`, plus no-op `.required()/.error()` stubs where a field mixes a builder chain with a custom rule) captures the predicate without reimplementing chain semantics. `preview.prepare` itself is only worth pinning when it computes something (concatenation, pluralization, a fallback); a verbatim `({ title }) => ({ title })` passthrough or a no-input literal (`() => ({ title: 'Kontakt' })`) is skipped as not worth a test. Note what this seam does _not_ cover: the tests hand-build the selection object to match `prepare`'s parameter names, so `preview.select` itself is never read or executed. A renamed `select` path (`firstName: 'firstname'`, `media: 'image.assetRef'`) that makes the real Studio feed `prepare` `undefined` would pass every one of these tests — "we test `prepare`" is not "we test the preview pipeline".

Some schemas cannot be imported in a test as-is: `schemas/objects/meta.tsx` (and anything else wired to `components/named-image-input.tsx`) transitively imports `sanity-plugin-media`, which throws under Vitest (`react-dropzone`'s CJS/ESM interop breaks), and `NamedImageInput` also reads Studio-only env vars via `@/env` that assert and throw when unset. Stub the component in the test file — `vi.mock(import('@/components/named-image-input'), () => ({ NamedImageInput: (() => null) as unknown as typeof NamedImageInput }))` — rather than setting Studio env vars or touching production code; see `schemas/objects/meta.test.ts`.

## Environment variables

`env.ts` reads the `SANITY_STUDIO_*` variables and fails fast when a required one is missing; `sanity.cli.ts` reads the `SANITY_API_*` variables. Add new studio variables to `env.ts`, to the `studio#build` task in the root `turbo.json`, and to the list in the root `AGENTS.md`.
