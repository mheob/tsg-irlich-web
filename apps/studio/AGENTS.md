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
| `scripts` | one-off scripts run through `sanity exec` (the TSG-Echo archive import) |
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

`indexable` ("In Suchmaschinen auffindbar", initially on) decides whether search engines may find an issue. Off, the website marks its page `noindex, nofollow`, leaves it out of the sitemap and serves its files through `/echo-archiv` with `X-Robots-Tag: noindex` (WEB-367). The import of the old issues switches it off. It only fully works if it is off before an issue is first published: Sanity serves every asset under a content-hash URL that stays live, so a PDF or a page image that was public once stays reachable at its old CDN address, and uploading the same file again gives the same URL.

`echoOverview` is the singleton behind `/verein/echo`, with the fixed slug `echo`. It is an internal link target, so the "Verein" menu can link the archive; the web app resolves it by type, not by slug (`getHrefForType` in `apps/web/src/utils/links.ts`).

## TSG-Echo archive import

`scripts/import-echo.ts` imports the old issues once into the Content Release "TSG-Echo-Archiv" (id `tsg-echo-archiv`, WEB-354). The modules under `scripts/import-echo/` take their collaborators as arguments and are tested without Sanity, pdf.js or the network.

**Input.** The PDFs live in a folder **outside the repository**, next to a `manifest.json` with one entry per issue. `datei` is relative to the folder, and the list comes from WEB-353:

```json
[
	{
		"datei": "1979 Erste Exemplare/1979_01.pdf",
		"titel": "TSG ECHO 1979 Nr. 1",
		"erscheinungsdatum": "1979-03-01"
	}
]
```

**Running it.** A dry run is the default. It renders every PDF locally and checks what already exists, but writes nothing and drafts no intro:

```bash
pnpm --filter studio run import:echo --dataset development --folder ~/echo-archiv
ANTHROPIC_API_KEY=… pnpm --filter studio run import:echo --dataset development --folder ~/echo-archiv --no-dry-run
```

`--no-intro` imports without intros and without a key. `--manifest <file>` reads another list. `--release <id>` fills another release than `tsg-echo-archiv`; a later run needs one once the first release is published or archived. `sanity exec --with-user-token` writes as the logged-in user, so run `pnpm exec sanity login` first. `ANTHROPIC_API_KEY` only ever comes from the shell. It does not belong in `.env`, Vercel or `turbo.json`.

**What it writes.** Per issue:

- the PDF as `<slug>.pdf`
- every page as `echo-<hash>-seite-<nnn>.jpg`
- a version `versions.tsg-echo-archiv.echo-archiv-<file name>` with `indexable: false` and a finished `render` whose `source` is the PDF, so the render webhook skips it

The intro is a draft from the cover, the next two pages and the text layer (`claude-sonnet-5-5`). The prompt forbids names and contact data. Before a real run with intros, the script asks the API once whether the key may use the model, and stops before anything is written if it may not. A busy API (429, 5xx, 529) gets two more attempts per issue, as long as `retry-after` asks. An answer that stopped early (`max_tokens`, `refusal`) counts as failed. An issue whose intro still could not be drafted is imported without one and listed at the end. A rerun skips it, so its intro is written in the studio.

**Reruns.** The id comes from the file name. A rerun skips every issue that exists as published document, draft or version in the release, and imports an interrupted issue again. Sanity deduplicates its assets by content hash. A release that is no longer open (published, scheduled, archived) is refused before anything is uploaded; the message names `--release <neue-id>`.

**Before publishing.** Every run ends by checking that no `echo.issue` before 2013 is indexable, in any version. It exits with 1 if one is, or if an issue failed. The same check in Vision, perspective `raw`:

```groq
*[_type == "echo.issue" && releaseDate < "2013-01-01" && indexable != false]._id
```

The editors then review the intros in the release and publish it as a whole. Archiving the release in the studio discards its versions, but the archived release keeps its id. To start over, run again with `--release <neue-id>`.

**Privacy.** An uploaded asset is public on `cdn.sanity.io` from the moment of the upload, even while its document waits in the release. Its URL is not guessable, but the dataset is no place for test copies of real issues: try the script with synthetic PDFs.

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
