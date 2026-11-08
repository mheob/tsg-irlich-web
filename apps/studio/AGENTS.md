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
| `schemas/documents` | editable document types (`news.article`, `person`, `department`, `group`, …) |
| `scripts` | one-off scripts run through `sanity exec` (the TSG-Echo archive import and text layer) |
| `schemas/single-pages` | one-off page documents (home, contact, news overview, …) |
| `schemas/singletons` | global documents such as the site settings |
| `schemas/objects` | reusable objects (links, images, stats, …) |
| `schemas/sections` | the building blocks of the rich content array |
| `shared/fields`, `shared/sections` | field and section definitions reused across schemas |
| `shared/field-groups.ts` | the named field groups used in the editor tabs |
| `plugins` | studio plugins: structure, singletons, assist presets, presentation |
| `structure` | the custom desk structure, grouped by topic |
| `components` | custom input and preview components |
| `utils`, `constants` | helpers (`getFieldWithGroup`, date formatting, slug history, …) |

## Schema conventions

- Always `defineType` / `defineField` / `defineArrayMember`, imported from `sanity`.
- One schema per file, `export default` the definition, and register it in `schemas/index.ts`.
- File names follow the type name: `news.article.ts` for `news.article`.
- Icons come from `react-icons/ri` or `@sanity/icons`.
- Give every document type an icon of its own. The desk lists the single pages by their type icon, so pages sharing one look alike (WEB-427). Where the documents of one type need telling apart, a `preview.media` does it: `getPreviewIcon` in `utils/preview-icon.ts` draws a stored DOSB pictogram or club icon one em in size, like the Remix icons next to it.
- Reuse `shared/fields/*` instead of redeclaring title, slug, meta or content fields, and attach them to a group with `getFieldWithGroup` from `utils/fields.ts`.
- Group names come from `shared/field-groups.ts` so the tabs stay consistent across documents. Their titles are German („Allgemein“, „Inhalt“, „Bilder“, „SEO & Teilen“), and a document lists them as Allgemein, Inhalt, its own tabs, SEO & Teilen (WEB-428).
- A document with tabs puts every field into one, leaves no tab empty and has at least two; a small one (up to about six fields, such as author, person or FAQ) has none. A shared field brings its tab along (`group: 'general'`), so a document without tabs strips it with `getFieldWithoutGroup` and one with tabs sets its own with `getFieldWithGroup`. `schemas/groups.test.ts` checks these rules for every document type.

## Adding a document type

1. Create the schema and register it in `schemas/index.ts`.
2. Give it a place in the desk: add a list item in `structure/index.ts` (and keep `isExcludedDefaultListItem` in sync so it does not show up twice).
3. For a singleton or single page, add it to both lists in `plugins/index.ts` (`pageStructure` and `singletonPlugin`) — singleton document actions are additionally restricted through `singletonTypes` in `sanity.config.ts`.
4. If the type is rendered on the website, add a `mainDocuments` route and a `locations` entry in `plugins/presentation.ts`, and a `revalidatePath` entry in the web app's `src/app/api/revalidate/route.ts`.
5. Run `pnpm run extract-types && pnpm run typegen:sanity` from the repository root.

## TSG-Echo issues

`echo.issue` holds one issue of the club magazine. Editors fill in title, slug, release date, PDF, intro and meta; everything in the group "Seiten (automatisch)" (`pages`, `extractedText`, `render`) is read-only and written by the web app's render route (`apps/web/src/app/api/echo/render`), which a webhook calls (see `docs/SANITY_WEBHOOK_SETUP.md`). `render.status` is `pending`, `done` or `failed`; `render.error` carries the German reason of a failure. The document action "Seiten neu erzeugen" (`actions/regenerate-echo-pages.tsx`) removes `render`, which makes the webhook fire again. A run still `pending` 15 minutes after `render.startedAt` was cut off by the platform; the list then shows "Abgebrochen – „Seiten neu erzeugen“". `validatePdfFile` (`shared/fields/pdf.ts`) checks the extension in the asset reference, because the stored value carries no mime type. The AI Assist preset "Intro erzeugen" in `plugins/assist.ts` reads `extractedText` through a `fieldRef`. A PDF without a text layer leaves it nothing to work with; [TSG-Echo text layer](#tsg-echo-text-layer) gives such a PDF one.

`indexable` ("In Suchmaschinen auffindbar", initially on) decides whether search engines may find an issue. Off, the website marks its page `noindex, nofollow`, leaves it out of the sitemap and serves its files through `/echo-archiv` with `X-Robots-Tag: noindex` (WEB-367). The import of the old issues switches it off. It only fully works if it is off before an issue is first published: Sanity serves every asset under a content-hash URL that stays live, so a PDF or a page image that was public once stays reachable at its old CDN address, and uploading the same file again gives the same URL.

`echoOverview` is the singleton behind `/verein/echo`, with the fixed slug `echo`. It is an internal link target, so the "Verein" menu can link the archive; the web app resolves it by type, not by slug (`getHrefForType` in `apps/web/src/utils/links.ts`).

## TSG-Echo archive import

`scripts/import-echo.ts` imports the old issues once into the Content Release "TSG-Echo-Archiv" (id `tsg-echo-archiv`, WEB-354). The modules under `scripts/import-echo/` take their collaborators as arguments and are tested without Sanity, pdf.js or the network.

**Input.** The PDFs live in a folder in the home directory and **outside the repository** (the script refuses anything else), next to a `manifest.json` with one entry per issue. `datei` is relative to the folder, and the list comes from WEB-353:

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

`--no-intro` imports without intros and without a key. `--manifest <file>` reads another `.json` list inside the folder; nothing outside it is read, and a file that is no JSON is not quoted in the error. `--release <id>` fills another release than `tsg-echo-archiv`; a later run needs one once the first release is published or archived. `sanity exec --with-user-token` writes as the logged-in user, so run `pnpm exec sanity login` first. `ANTHROPIC_API_KEY` only ever comes from the shell. It does not belong in `.env`, Vercel or `turbo.json`.

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

## TSG-Echo text layer

`scripts/ocr-echo.ts` gives the PDFs without a text layer one and swaps them into the issues (WEB-402). The render route and the import only read a PDF's text layer, so the 26 scans of 1979–1988 had an empty `extractedText`, and the rasterized web PDFs of 2024 and 2025 only the text of their ads. That left „Intro erzeugen“ and the website search without the club's topics. The script fixes the PDF itself, so nothing that reads it needs to know about OCR. The modules under `scripts/ocr-echo/` take their collaborators as arguments and are tested without Sanity, pdf.js, OCRmyPDF or the network; the folder rules are shared with the import (`scripts/shared/archive-folder.ts`).

**Tools.** OCRmyPDF and Tesseract's German, once per machine:

```bash
brew install ocrmypdf tesseract-lang
```

The script checks both before it touches anything, and only when an entry needs OCR. It runs OCRmyPDF with `--mode skip --language deu --output-type pdf --optimize 0`: only pages without text are recognized, the text sits invisibly on top, and the page images stay byte for byte as they were.

**Input.** The archive folder (the same rules as for the import: in the home directory, outside the repository) holds an `ocr-manifest.json`, which names the issue whose PDF each file replaces. `dokument` is the published id, without `drafts.`:

```json
[
	{ "datei": "1979 Erste Exemplare/1979_01.pdf", "dokument": "echo-archiv-1979-01" },
	{ "datei": "ab 2024 (neues ECHO)/2024_TSG_Echo_45_Jahre_Web_Text.pdf", "dokument": "echo-2024" }
]
```

The ids of the imported scans are `echo-archiv-<file name>`, as the import derives them. `--manifest <file>` reads another `.json` list inside the folder.

**Running it.** A dry run is the default. It already recognizes, but writes nothing to Sanity:

```bash
pnpm --filter studio run ocr:echo --dataset development --folder ~/dev/customer/tsg/echo-archiv
pnpm --filter studio run ocr:echo --dataset development --folder ~/dev/customer/tsg/echo-archiv --no-dry-run
```

`development` comes first, since staging renders its issues; then `production`. Run `pnpm exec sanity login` first, the script writes as the logged-in user.

**What it does per entry.**

- A PDF with text on every page is taken as it is. Any other goes through OCRmyPDF into `mit-textebene/<same path>` inside the folder, through a `.tmp` file that only becomes the result once complete. An earlier result there is reused; delete it to recognize the PDF again.
- It swaps only in the draft. An issue with a draft gets its `pdf.asset` replaced, against the revision it read. An issue that only exists published gets a new draft with the new PDF and stays as it is until an editor publishes the draft: a published issue drops off the website while its pages are rendered again, and stays off when that fails. An issue in a release is refused with the release's name, because publishing the release would bring the old PDF back.
- The upload keeps the old PDF's file name. `render` is not touched: its `source` no longer matches the PDF, so the render webhook fires.
- It waits until the webhook has rebuilt pages and `extractedText`, polling every 5 s, so one render runs on Vercel at a time. A render that does not start within 2 minutes points at the webhook; one not done after 15 minutes fails the entry.
- A rerun skips every issue whose PDF already has the same `sha1hash` and a finished render, and waits for one still rendering. One whose render failed, or has been `pending` for more than 15 minutes because the platform cut it off, asks for „Seiten neu erzeugen“ in the studio and a new run. Only issues of type `echo.issue` are looked up, so a mistyped id cannot swap the PDF of another document.

A failed entry does not stop the others. The run ends with a summary and exits with 1 if an entry failed. The old PDFs and page images stay in the dataset as unused assets, reachable at their CDN addresses; the intros are written afterwards in the studio with „Intro erzeugen“.

## Main menu

`site-settings.mainNavigation` holds two kinds of first-level entries, which "Hinzufügen" offers by name (WEB-371):

- `mainNavigationLink` ("Link"): a title and a target, a page or an external URL, with no children.
- `mainNavigationMenu` ("Menü"): a title, at least one child (`navigationLink`, with an optional sub-text for the desktop dropdown) and "Zweispaltig". A menu has no target of its own; the page belongs into it as a child.

The migration `main-navigation-menus` turned the earlier `mainNavigationItem` entries into these. An entry with children became a menu, and its former target became the first child, titled like the old "Übersicht" link. It is idempotent and runs like every migration here, `development` first.

## Departments and groups

`department` is a document of its own (title, slug, DOSB icon, `sortOrder`, `isTeamSport`, card and hero image, intro, stats, contact persons), and there is exactly one `group` type. Every group has a required `department` reference at the top, and a group sits under one department only. The former `group.*` types and the "Administration" group are gone.

- **Images.** Both types carry a required card image ("Kachelbild") and an optional hero image ("Hero-Bild"); the open graph image sits in `meta`. The website's hero shows the hero image, else the card image, else the shared offer image, and the open graph image falls back to the card image. The card image of a group is still called `featuredImage`, the name of the former background image, so the existing images needed no migration (WEB-385); a department's is `cardImage`.
- **Search terms.** Both types carry `searchTerms` ("Suchbegriffe", `shared/fields/search-terms.ts`), a tag list of extra words the website search finds the page by: spellings and synonyms the title lacks, such as „Fussball“ for „Fußball“ or „Erste Mannschaft“ for „1. Mannschaft“. They never appear on the website. A match counts almost as much as one in the title (weight 8 against 10).
- **FAQ.** A `faq` document (question, answer as rich text with links, `departments`, `sortOrder`) appears on the page of every department in its `departments` field, in one `sortOrder` across all of them (WEB-334). Only `departments` decides: an answer that links to a department does not put the question on its page. The first department carries the question in the page's `FAQPage` JSON-LD, the others only show it, because Google wants a question marked up once per site. The heading of the section is `groupsPage.content.faqSection`, optional; the website falls back to „Häufige Fragen“ / „FAQ“. "FAQ" has its own desk entry, ordered by `sortOrder`.
- **Slugs.** A department slug is unique among the departments (Sanity's default slug check). A group slug is unique only within its department, so two departments may each have a group "herren" (`isGroupSlugUniqueInDepartment` in `schemas/documents/group.ts` checks in the raw perspective, so drafts and release versions of other groups count).
- **Slug history.** `previousSlugs` on a department and `previousPaths` on a group (`<department slug>/<group slug>`) keep the old addresses so the website can redirect them. The publish action (`actions/publish-with-slug-history.tsx`, wired up for both types in `sanity.config.ts`) wraps the default "Veröffentlichen" and adds the previously published value whenever the slug, or the department of a group, has changed. A group moved into a department that only exists as a draft still records its old path, because the new path cannot be built yet. That is the only thing that fills the fields. Publishing through a release, scheduled publishing or the API does not, so the editors enter the old value by hand there; the field description says so. The two fields check what is typed: a `previousSlugs` entry has to be a bare slug (`kurse`), a `previousPaths` entry `<department>/<group>` without `/angebot` (`kurse/yoga`), lowercase, and every entry that does not match is marked, since a value in another shape never matches a URL. The action never stalls publishing: if the lookup of the department slugs fails or takes longer than five seconds, the document is published anyway and a toast names the field to fill in. "Duplizieren" (`actions/duplicate-without-slug-history.tsx`, wired up next to it) hands the studio's own duplicate action a `mapDocument` that leaves both fields out of the copy: the website redirects an old URL to the most recently updated document whose history contains it, so a copy with the original's history would take over its redirects.
- **Desk.** "Abteilungen" lists the departments by `sortOrder`. "Gruppen" lists the same departments, also by `sortOrder` (without an ordering Sanity sorts by last update, so an edited department would jump to the top), and each one opens its groups (`getGroupsOfDepartmentList` in `structure/index.ts`, a filter on `department._ref`, ordered by `sortOrder`). The departments come from the documents, so a new department needs no change in the desk. "Neu" inside a department uses the `group-by-department` template from `structure/templates.ts`, which presets the department. `sanity.config.ts` appends that template to `schema.templates` after the singleton filter.
- **History.** A one-off migration (WEB-384) moved both datasets to this model, `development` on 2026-10-25 and `production` on 2026-11-01, and was deleted afterwards. Sanity never changes the `_type` of an id, not even by deleting and creating it in one transaction, so every former `group.<x>` document `<id>` lives on as the `group` document `group-<id>`, and every reference to it was rewritten. The six departments carry the ids `department-<slug>`. Git history has the script, should a content release from before the switch ever need it.

## News

- **Slugs.** The slug of a `news.article` and of a `news.category` may only hold lowercase letters and digits, joined by single hyphens (`formattedSlugField` and `validateSlugFormat` in `shared/fields/general.ts`, WEB-421). „Generieren“ builds such a slug from the title. Until then nothing checked it, six article slugs went out with capitals, and their lowercase address answered 404. The migration `lowercase-news-article-slugs` lowercases such a slug and records the old one in the history, so a second run changes nothing.
- **Slug history.** Both types carry `previousSlugs` („Frühere Slugs“, in the group "Allgemein") and use the publish and duplicate actions of the departments and groups (see "Slug history" above, `slugHistoryTypes` in `sanity.config.ts`). An entry is the bare slug, without `/news` and without a category. An article entry may hold capitals (`previousArticleSlugsField`), because the old slugs did; a category entry may not. The website finds an article by its slug alone and sends every other category to its first one, so a renamed category needs no entry on its articles.
- **Icon.** A `news.category` carries an optional `icon` („Icon“, `shared/fields/news-category-icon.ts`): a DOSB pictogram, or one of the club icons `Gesamtverein`, `Historie`, `Presse`, `Soziales` and `Veranstaltungen` for news that no sport fits. Only the studio shows it, in the list preview; without one the list shows the type icon, a price tag. The groups show their pictogram the same way (WEB-427). The migration `news-category-icons` gave the 26 categories a first icon by slug. It uses `setIfMissing`, so it keeps what an editor chose and a second run changes nothing. It ran on `development` on 2026-11-08; `production` follows with the next release.

## Page images

The content images of the website live in the studio, not in the web app (WEB-389).

- **Hero image.** Every single page with a banner carries a required `heroImage` (`extendedImage` in the group `general`, built by `getHeroImageField` in `shared/fields/hero-image.ts`): `home`, `departmentsPage`, `aboutUs`, `membership`, `contact`, `newsOverview`, `imprint`, `privacy` and `accessibility`. Home wants a cut-out in portrait format. Every other page wants a landscape picture whose hotspot decides what the banner keeps, and that also serves as preview image when `meta` sets none. The description names where else an image appears: the TSG-Echo pages show the one of `aboutUs`, the feedback page the one of `contact`, the news categories the one of `newsOverview`.
- **Central images.** The group „Bilder“ of `site-settings` holds `visionImages` and `contactFormImages`, exactly three each in the order large, medium, small and cropped round, and `fallbackImage`, which stands in for a department or group with neither hero nor card image.
- **History.** The images the web app carried until then came over with a one-off migration, `development` on 2026-10-26 and `production` on 2026-11-01. It set no hotspot, so a banner shows the middle of its picture until an editor sets one.

## Search page

`searchPage` is the singleton behind `/suche` (`schemas/single-pages/search-page.ts`), with the fixed slug `suche`. It holds the texts of the website search, not its content: what is searched comes from the other documents. Besides the hero (title, subtitle, hero image) and `meta`, its "Inhalte" are four groups:

- **Suchbereich.** The section header of the page and the required "Platzhalter im Suchfeld" (at most 60 characters). The field of the search page and the input of the panel in the navigation both show it; the web app reads it in the root layout, so a change reaches every page.
- **Keine Treffer.** A required heading, a short text and at most six links (`navigationLink`) that the page shows when a term finds nothing.
- **Häufig gesucht.** The heading (initially „Häufig gesucht“) and two tag lists: "Immer anzeigen" pins terms, "Nie anzeigen" blocks them. Until the list is also fed by real searches, which is a follow-up, only the pinned terms appear, at most eight, and a blocked term is left out even when it is pinned. The panel shows the list while its input holds no usable term (empty, or fewer than two letters or digits); a usable term without hits gets „Keine Treffer …“ and a link to the search page there. The page shows it without a usable term and when a term finds nothing.
- **Ansprechpartner.** The contact persons section below the search.

It has no `mainDocuments` route and no `locations` entry in `plugins/presentation.ts`, on purpose. The website reads it as published, like every part of the search, also while draft mode is on, so a preview would show nothing of an edit. The singleton is in both lists in `plugins/index.ts`, and the web app's revalidation route handles it (`searchPage` revalidates the whole layout). Both live webhook filters list the type (`docs/SANITY_WEBHOOK_SETUP.md`).

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

The group route (`/angebot/:group/:singleGroup`) comes before the department route (`/angebot/:group`), and both before the news routes. `LOCATION_QUERIES` has an entry for `department` (its page and `/angebot`), `group` (its page and the page of its department), `faq` (the pages of its departments), `news.article` and `news.category`. A document without a slug, or a group without a department slug, shows no location of its own; a FAQ skips a department without a slug.

The order of the plugins in `plugins/index.ts` is the order of the studio's top navigation (Structure, Media, Presentation, Vision in development, then the built-in Releases).

## Testing

A single `vitest.config.ts` (jsdom, `**/*.test.{ts,tsx}`) covers the whole app — no project split like `apps/web`. Beyond the plain utilities (`utils/`), most schema coverage comes from calling `preview.prepare` and a `Rule.custom(...)` predicate as plain functions directly on the exported definition object — schema definitions are plain objects, so no Sanity runtime is needed. A fake `Rule` object (`{ custom: (fn) => fn }`, plus no-op `.required()/.error()` stubs where a field mixes a builder chain with a custom rule) captures a `Rule.custom` predicate without reimplementing chain semantics. A `Rule.required().assetRequired().error(...)` builder chain has no function to extract and call, so where its order matters a test runs the validation against a rule that only records the calls it receives and pins that list (`recordValidationChain` in `schemas/documents/department.test.ts`); it proves the chain is written down, not that Sanity enforces it. `preview.prepare` itself is only worth pinning when it computes something (concatenation, pluralization, a fallback); a verbatim `({ title }) => ({ title })` passthrough or a no-input literal (`() => ({ title: 'Kontakt' })`) is skipped as not worth a test. The tests hand-build the selection object to match `prepare`'s parameter names, so a renamed `select` path (`firstName: 'firstname'`, `media: 'image.assetRef'`) that makes the real Studio feed `prepare` `undefined` passes them. Where a path is easy to get wrong, a separate case asserts `preview.select` itself (`group.test.ts` for the dereferenced department title, `internal-link.test.ts`, and `search.test.ts`, where the studio search weighs a field by its place in `select`) — "we test `prepare`" is still not "we test the preview pipeline".

Some schemas cannot be imported in a test as-is: `schemas/objects/meta.tsx` (and anything else wired to `components/named-image-input.tsx`) transitively imports `sanity-plugin-media`, which throws under Vitest (`react-dropzone`'s CJS/ESM interop breaks), and `NamedImageInput` also reads Studio-only env vars via `@/env` that assert and throw when unset. Stub the component in the test file — `vi.mock(import('@/components/named-image-input'), () => ({ NamedImageInput: (() => null) as unknown as typeof NamedImageInput }))` — rather than setting Studio env vars or touching production code; see `schemas/objects/meta.test.ts`.

`plugins/presentation.test.ts` mocks `@/env` for the same reason (`vi.mock(import('@/env'), () => ({ previewUrl: 'http://localhost:3000' }))`), since `env.ts` throws without the studio variables. `mainDocuments` and `LOCATION_QUERIES` are exported for it only.

## Environment variables

`env.ts` reads the `SANITY_STUDIO_*` variables and fails fast when a required one is missing; `sanity.cli.ts` reads the `SANITY_API_*` variables. Add new studio variables to `env.ts`, to the `studio#build` task in the root `turbo.json`, and to the list in the root `AGENTS.md`.
