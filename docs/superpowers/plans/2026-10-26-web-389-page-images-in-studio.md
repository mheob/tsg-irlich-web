# Seitenbilder redaktionell pflegbar (WEB-389) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every content image that lives as a file in the web app today (`src/images`, `public/og`, the news and legal heroes) is maintained in the studio, migrated once into both datasets, and the website reads it from Sanity.

**Architecture:** Studio first: a shared `heroImage` field on nine single pages and three central image fields in `site-settings`, then one typegen. A `sanity exec` script uploads today's files with corrected alt texts, and Task 4 runs it on `development` before any web change ships. The web app gets small image helpers (uncropped page hero with hotspot as `object-position`, square section images, site-wide fallback), then the pages switch over page by page. Runbook tasks at the end open the PR, switch the staging webhook and describe the production rollout that rides with the WEB-384 release.

**Tech Stack:** Sanity Studio (`defineField`, `sanity exec`), Next.js 16 App Router, next-sanity (`defineQuery`, `sanityFetch`), `@sanity/image-url`, Vitest via `vp test`, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-26-web-389-page-images-in-studio-design.md`. Read it before Task 1. This plan only adds the decisions the spec leaves open.

**Branch:** `feat/web-389-page-images-in-studio`. With GitButler: `but branch new feat/web-389-page-images-in-studio`. Commits go through the `create-commit` skill. Run `pnpm run format:check` at the root before every `but commit`.

## Global Constraints

- Every studio `title` and `description` is German. Code, comments and test names are English.
- Schemas use `defineType` / `defineField` / `defineArrayMember` from `sanity`.
- Web components are function declarations with named exports. Wrap props in `Readonly<…>`. No `try`/`catch`/`finally` in components or hooks.
- Tests import `describe`/`it`/`expect`/`vi` from `vite-plus/test` and assert what a user observes (role, name, text, href, an `<img>`'s `src`/`alt`/`style`), never class names or `data-testid`.
- After a schema or query change, run from the root: `pnpm run extract-types && pnpm run typegen:sanity`.
- Coverage thresholds in every `vitest.config.ts` stay where they are or go up.
- **Every write to a Sanity dataset, every webhook change and every Linear write needs an explicit OK from the user in chat first.** Show the command or payload and wait for the yes.
- The field is called `heroImage` on every page document. Type `extendedImage`, group `general`, title „Hero-Bild“, validation `Rule.required().assetRequired().error('Das Hero-Bild ist erforderlich')`.
- Copy fixed by this plan:
  - `LANDSCAPE_HERO_DESCRIPTION` = „Querformat. Das Banner zeigt je nach Bildschirm nur einen Teil des Bildes, der Hotspot bestimmt, welcher Teil sichtbar bleibt. Ohne eigenes Open-Graph-Bild dient es auch als Vorschaubild beim Teilen.“
  - Home: „Freigestelltes Bild mit transparentem Hintergrund (PNG oder WebP) im Hochformat. Es steht unten bündig neben dem Seitentitel.“
  - Suffixes appended to the landscape text: aboutUs „Erscheint auch auf den Seiten des TSG-Echos.“, contact „Erscheint auch auf der Feedback-Seite.“, newsOverview „Erscheint auch auf den Kategorieseiten der News.“

## Review Focus

1. **A section image list that is empty, shorter than three or has an item without a file** (a draft, a half-filled document). Vision and contact form render the images they have, each at its own position, with no broken `<img>` and no shifting. Tests: Task 5 (`resolveSectionImages`), Task 6 (Vision, ContactForm).
2. **A hotspot on a cropped image.** `object-position` is computed inside the crop rectangle and clamped to 0–100 %, so it never points outside the visible picture. Test: Task 5.
3. **The editors set a hotspot on the home hero.** The cut-out must stay bottom-aligned (`object-bottom`) and never get an `object-position`. Test: Task 7.
4. **A published page with an older draft open.** The migration patches both, so publishing the draft keeps the image. Test: Task 3.
5. **An image changed on a page whose hero is shown elsewhere** (contact → feedback, aboutUs → TSG-Echo, newsOverview → categories) and a change on `accessibility`. Every page that shows it is revalidated. Test: Task 9.

---

### Task 0: Ticket and branch (runbook)

- [ ] **Step 1:** Draft a Linear ticket in team WEB: title „Seitenbilder redaktionell im Studio pflegbar“, description linking the spec, labels `frontend 🖥️`, `studio 🗃️`, `enhancement ✨`. Show it to the user, create it on OK, note the id.
- [ ] **Step 2:** Create the branch `feat/web-389-page-images-in-studio`. Rename the plan and spec files to carry `web-<id>` like the earlier ones, and put the ticket link into the spec header.
- [ ] **Step 3:** Commit spec and plan (`docs: add page images spec and plan`).

### Task 1: Studio — `heroImage` on nine single pages

**Files:**

- Create: `apps/studio/shared/fields/hero-image.ts`, `apps/studio/shared/fields/hero-image.test.ts`, `apps/studio/schemas/single-pages/hero-image.test.ts`
- Modify: `apps/studio/schemas/single-pages/{home/index.ts,offer/index.ts,about-us/index.ts,membership.ts,contact.ts,news-overview.ts,imprint.ts,privacy.ts,accessibility.ts}`

**Interfaces:**

- Produces: `getHeroImageField(description: string): ReturnType<typeof defineField>` and `LANDSCAPE_HERO_DESCRIPTION: string` from `@/shared/fields/hero-image`.

- [ ] **Step 1: Write the failing tests.**
  - In `hero-image.test.ts`, test that the field is named `heroImage`, typed `extendedImage`, grouped `general`, carries the given description, and records the chain `['required', 'assetRequired', 'error: Das Hero-Bild ist erforderlich']`. Copy `recordValidationChain` from `schemas/documents/department.test.ts` and adapt it to take a field.
  - In `schemas/single-pages/hero-image.test.ts`, use `it.each` over the nine schemas (`home`, `departmentsPage`, `aboutUs`, `membership`, `contact`, `newsOverview`, `imprint`, `privacy`, `accessibility`) to assert:
    - `heroImage` sits directly after `subtitle` (on `home` after `intro`).
    - Its description starts with `LANDSCAPE_HERO_DESCRIPTION`, except home, which carries the home copy.
    - aboutUs, contact and newsOverview end with their suffix.
  - Stub `@/components/named-image-input` the way `schemas/objects/meta.test.ts` does if an import throws.
- [ ] **Step 2:** `pnpm --filter studio exec vp test run shared/fields/hero-image schemas/single-pages/hero-image`. Expected: FAIL, the module does not exist.
- [ ] **Step 3: Implement.** Create `getHeroImageField` and insert it after `...defaultHeroFields` (or `...defaultPageSectionFields` on home) in the nine schemas. Build the description with the Global Constraints copy, landscape text plus suffix separated by one space.
- [ ] **Step 4:** Run the same tests, then `pnpm --filter studio run typecheck` and `pnpm --filter studio run lint`. Expected: PASS.
- [ ] **Step 5:** Commit (`feat(studio): add hero image to single pages`).

### Task 2: Studio — central images in the site settings, then typegen

**Files:**

- Modify: `apps/studio/schemas/singletons/site-settings.tsx`, `apps/studio/schemas/singletons/site-settings.test.ts`
- Generated: `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`

**Interfaces:**

- Produces, on `site-settings`:
  - `visionImages` and `contactFormImages`: arrays of `extendedImage` with `_key`.
  - `fallbackImage`: `extendedImage`.
  - The new group `{ name: 'images', title: 'Bilder' }`, appended last.

- [ ] **Step 1: Write the failing tests** in `site-settings.test.ts`:
  - The three fields exist, all in group `images`.
  - `visionImages` and `contactFormImages` record `['required', 'length: 3', 'error: …']`. Extend the recording rule with `length`.
  - Their member records `['required', 'assetRequired', 'error: Jedes Bild braucht eine Datei']`.
  - `fallbackImage` records `['required', 'assetRequired', 'error: Das Ersatzbild ist erforderlich']`.
- [ ] **Step 2:** Run the test. Expected: FAIL.
- [ ] **Step 3: Implement** with this copy:
  - `visionImages`: title „Vision-Bilder“, description „Genau drei Bilder für die Vision-Sektion auf Home und Verein, in dieser Reihenfolge: groß, mittel, klein. Sie werden rund beschnitten, der Hotspot bestimmt den Ausschnitt.“, error „Die Vision-Sektion braucht genau drei Bilder“
  - `contactFormImages`: title „Kontaktformular-Bilder“, description „Genau drei Bilder neben dem Kontaktformular auf Home und Kontakt, nur auf großen Bildschirmen sichtbar, in dieser Reihenfolge: groß, mittel, klein. Sie werden rund beschnitten, der Hotspot bestimmt den Ausschnitt.“, error „Das Kontaktformular braucht genau drei Bilder“
  - `fallbackImage`: title „Ersatzbild Angebot“, description „Erscheint im Hero und auf der Kachel einer Abteilung oder Gruppe, die weder Hero- noch Kachelbild hat.“
- [ ] **Step 4:** Run the studio tests, typecheck and lint. Then from the root run `pnpm run extract-types && pnpm run typegen:sanity` and `pnpm run typecheck`. If the web typecheck fails only in test fixtures typed with these documents, add `heroImage` to those fixtures. Expected: PASS.
- [ ] **Step 5:** Commit (`feat(studio): add central page images to site settings`).

### Task 3: Migration script `migrate:page-images`

**Files:**

- Create:
  - `apps/studio/scripts/migrate-page-images.ts` (entry, shaped like `migrate-departments.ts`)
  - `apps/studio/scripts/migrate-page-images/{options,targets,run,store}.ts` with tests
  - `test-utils/fake-store.ts`
  - `images/` (copies)
- Modify: `apps/studio/package.json` (`"migrate:page-images": "sanity exec scripts/migrate-page-images.ts --with-user-token --"`)

**Interfaces:**

```ts
interface ImageFile { alt: string; fileName: string }
interface PageImageTarget { documentType: string; field: string; images: readonly ImageFile[]; isList: boolean }
interface PageImageDocument { _id: string; _rev: string; hasField: boolean }
interface PageImageStore {
	/** Published document and draft of the type, raw perspective, without release versions. */
	fetchDocuments: (documentType: string, field: string) => Promise<PageImageDocument[]>;
	/** Ids of release versions (`versions.**`) of the given types. */
	fetchReleaseVersions: (documentTypes: readonly string[]) => Promise<string[]>;
	hasImage: (fileName: string) => Promise<boolean>;
	/** Uploads a file of the image folder and returns the asset id. */
	uploadImage: (fileName: string) => Promise<string>;
	/** Sets fields unless the document changed since `rev` (`ifRevisionId`). */
	patchDocument: (id: string, rev: string, fields: Record<string, unknown>) => Promise<void>;
}
interface PageImageReport { patched: string[]; problems: string[]; skipped: string[]; uploaded: number }
function runPageImageMigration(store: PageImageStore, options: { dryRun: boolean }): Promise<PageImageReport>;
function summarize(report: PageImageReport, dryRun: boolean): string[];
const PAGE_IMAGE_TARGETS: readonly PageImageTarget[];
```

`options.ts` is its own copy of `migrate-departments/options.ts`. Both scripts are one-offs and get deleted separately.

`PAGE_IMAGE_TARGETS`. Copy existing alt texts verbatim from the named file. The new ones are fixed here.

| type | field | files | alt |
| --- | --- | --- | --- |
| `home` | `heroImage` | `home-hero.webp` ← `apps/web/src/images/home/hero.webp` | `app/_home/hero.tsx` |
| `departmentsPage` | `heroImage` | `angebot-hero.webp` ← `images/angebot/hero.webp` | `utils/fallback-image.ts` |
| `aboutUs` | `heroImage` | `verein-hero.webp` ← `images/verein/hero.webp` | „Luftaufnahme des Vereinsheims „Pappelstübchen“ der TSG Irlich mit Terrasse, Tischen und Sonnenschirmen, dahinter Bäume und der Sportplatz“ |
| `membership` | `heroImage` | `mitgliedschaft-hero.webp` ← `images/mitgliedschaft/hero.webp` | „Zwei Personen geben sich über einem Schreibtisch mit Klemmbrett und Kugelschreiber die Hand“ |
| `contact`, `imprint`, `privacy`, `accessibility` | `heroImage` | `kontakt-hero.webp` ← `images/kontakt/hero.webp` | „Ein MacBook auf einem Schreibtisch zeigt das Kontaktformular der TSG Irlich, daneben ein Festnetztelefon und eine kabellose Maus, im Hintergrund ein unscharfes Büro“ |
| `newsOverview` | `heroImage` | `news-hero.webp` ← `app/news/_assets/news-overview.webp` | `app/news/page.tsx` |
| `site-settings` | `visionImages` (list) | `vision-1/2/3.webp` ← `images/vision/` | `components/section/vision.tsx`, in order |
| `site-settings` | `contactFormImages` (list) | `contact-form-1/2/3.webp` ← `images/contact/contact-1/2/3.webp` | `components/section/contact-form.tsx`, in order |
| `site-settings` | `fallbackImage` | `angebot-hero.webp` | as `departmentsPage` |

Value shapes:

- A single image is `{ _type: 'extendedImage', alt, asset: { _type: 'reference', _ref } }`.
- A list item adds `_key` = the file name without extension (`vision-1`).
- No hotspot or crop is set.

- [ ] **Step 1: Write the failing tests** in `run.test.ts` against the fake store:
  - `sets the field on the published document and on its draft`
  - `leaves a document whose field the editors already set alone` (it goes to `skipped`)
  - `uploads every file once although several fields use it`: `kontakt-hero.webp` is used four times, `angebot-hero.webp` twice, so 12 uploads in total.
  - `writes nothing in a dry run` (no upload, no patch; `patched` lists what a real run would change)
  - `writes nothing at all when an image file is missing`: the problem names the file.
  - `reports a document type without any document`
  - `reports release versions and does not patch them`
  - `gives list items their file name as key and keeps the order`
  - `changes nothing on a second run`

  In `targets.test.ts`:
  - The ten types are covered.
  - Both lists hold exactly three images.
  - No alt text is empty.
  - Every file name exists in `images/`.

  `options.test.ts` mirrors the department one. Add `store.test.ts` like `migrate-departments/store.test.ts`.

- [ ] **Step 2:** `pnpm --filter studio exec vp test run scripts/migrate-page-images`. Expected: FAIL.
- [ ] **Step 3: Implement.** Check every file with `hasImage` before any write. A missing file is a problem and stops all writes, in a dry run as in a real run. Cache asset ids per file name. Write the `summarize` lines in German, following `migrate-departments/run.ts` (counts „Bilder hochgeladen“, „Dokumente geändert“ or „würden geändert“, „Übersprungen“, then the problems). The entry sets `process.exitCode = 1` on any problem. Copy the twelve images into `scripts/migrate-page-images/images/`.
- [ ] **Step 4:** Run the tests, `pnpm --filter studio run typecheck` and lint. Expected: PASS.
- [ ] **Step 5:** Commit (`feat(studio): add page image migration script`).

### Task 4: Migrate `development` (runbook)

- [ ] **Step 1:** `pnpm exec sanity login` in `apps/studio` if needed. Export: `pnpm exec sanity dataset export development ~/sanity-backups/development-<date>-page-images.tar.gz`.
- [ ] **Step 2:** Dry run: `pnpm --filter studio run migrate:page-images --dataset development`. Expected: no problems, „würden geändert“ lists every page document and existing draft.
- [ ] **Step 3:** Show the output and ask the user for the OK. Then run it with `--no-dry-run`. Expected: exit 0, 12 uploads.
- [ ] **Step 4:** Dry run again. Expected: nothing to change. Spot-check in Vision: `*[_type in ["home","contact","site-settings"]]{_id, "hero": heroImage.alt, "vision": count(visionImages)}`.

### Task 5: Web — image helpers and `Hero`

**Files:**

- Modify:
  - `apps/web/src/types/image.types.ts`
  - `apps/web/src/utils/hero-image.ts` and its test
  - `apps/web/src/components/section/hero.tsx`
  - `apps/web/test-utils/setup-dom.ts` (the `next/image` mock forwards `style`)
- Create: `apps/web/src/utils/section-images.ts` and its test, `apps/web/src/components/section/hero.test.tsx`

**Interfaces:**

- Produces:
  - `interface ResolvedImage { alt: string; src: string }` (exported from `@/types/image.types`).
  - `Hero`'s `image` prop becomes `{ alt: string; objectPosition?: string; src: ImageProps['src'] }`, and `Hero` sets `style.objectPosition` when one is given.
  - In `@/utils/hero-image`:
    - `getHeroImage(images, title): HeroImage | undefined`. The static fallback is gone, and callers append the site fallback as the last candidate. It still crops to 1920 × 600 and sets no `objectPosition`.
    - `getPageHeroImage(image: AnyImage | null | undefined, title: string): HeroImage | undefined`: `urlForImageMax(image, PAGE_HERO_MAX_WIDTH)` with `PAGE_HERO_MAX_WIDTH = 3840`, alt `image.alt || title`, `objectPosition: getObjectPosition(image)`.
    - `getObjectPosition(image: Pick<SanityImageReference, 'crop' | 'hotspot'>): string | undefined`. For x: `(hotspot.x - crop.left) / (1 - crop.left - crop.right)`, the same for y with top/bottom. Missing crop counts as 0. Clamp to [0, 1] and format as `${percent}% ${percent}%`, rounded to one decimal. Without a hotspot it returns `undefined`.
  - In `@/utils/section-images`: `SECTION_IMAGE_SIZE = 640` and `resolveSectionImages(images: readonly (AnyImage | null | undefined)[] | null | undefined, fallbackAlt: string): (ResolvedImage | undefined)[]`. It returns a square crop via `urlForImage(image, SECTION_IMAGE_SIZE)`, keeps every position, gives `undefined` for an item without a file, and falls back to `fallbackAlt` for an empty alt.

- [ ] **Step 1: Write the failing tests.**
  - `getObjectPosition`:
    - `{x:.25,y:.75}` without crop → `'25% 75%'`
    - crop left/right .2, hotspot x .3, y .5 → `'16.7% 50%'`
    - a hotspot left of the crop → `'0% …'`
    - no hotspot → `undefined`
  - `getPageHeroImage`:
    - The URL has `w=3840` and `fit=max` and no `h`.
    - The alt falls back to the title.
    - It returns `undefined` without an asset.
  - `getHeroImage` returns `undefined` when no candidate has a file. Drop the `OFFER_FALLBACK_IMAGE` case.
  - `resolveSectionImages`:
    - `[img, noFile, img]` → `[{…}, undefined, {…}]`
    - `null` → `[]`
    - The URL has `w=640&h=640`.
  - `hero.test.tsx`:
    - With `objectPosition` the `<img>` has `style.objectPosition` `'25% 75%'`.
    - Without `image` there is no `<img>`.
- [ ] **Step 2:** `pnpm --filter web exec vp test run src/utils/hero-image src/utils/section-images src/components/section/hero`. Expected: FAIL.
- [ ] **Step 3:** Implement as specified.
- [ ] **Step 4:** Run the tests. Expected: PASS. The two offer pages compile, because `Hero` already accepts an undefined image.
- [ ] **Step 5:** Commit (`feat(web): add helpers for studio page images`).

### Task 6: Web — central images: Vision, contact form, fallback

**Files:**

- Create: `apps/web/src/lib/sanity/queries/shared/site-images.ts`, `apps/web/src/components/section/vision.test.tsx`
- Modify:
  - `components/section/vision.tsx`
  - `components/section/contact-form.tsx` and its test
  - `components/ui/group-card.tsx` and its test
  - `app/angebot/_sections/groups.tsx`, `app/angebot/[group]/_sections/groups.tsx` and its test
  - the pages `app/page.tsx`, `app/verein/page.tsx`, `app/kontakt/page.tsx`, `app/angebot/page.tsx`, `app/angebot/[group]/page.tsx`, `app/angebot/[group]/[singleGroup]/page.tsx` and their tests
- Delete: `apps/web/src/utils/fallback-image.ts`

**Interfaces:**

- Consumes: `resolveSectionImages`, `getHeroImage`, `ResolvedImage` (Task 5).
- Produces:
  - `siteImagesQuery = defineQuery("*[_type == 'site-settings'][0] { visionImages, contactFormImages, fallbackImage }")`, result type `SiteImagesQueryResult`.
  - `Vision` gets the prop `images: readonly (ResolvedImage | undefined)[]`, and `ContactForm` the same.
  - `GroupCard` and both `Groups` sections get `fallbackImage?: AnyImage | null`.

- [ ] **Step 1: Write the failing tests.**
  - `vision.test.tsx`:
    - It shows three images by their alt texts.
    - With `[a, undefined, c]` it shows a and c only.
  - `contact-form.test.tsx`: the same two cases at `lg` (the images are in the DOM regardless of breakpoint).
  - `group-card.test.tsx`:
    - `shows the fallback image when the card has none` (src contains the fallback asset id)
    - `renders no image when neither has a file`
  - Page tests:
    - Home passes `visionImages`/`contactFormImages` from the site settings into `Vision`/`ContactForm`, with the section title as fallback alt for vision and „Kontaktiere uns“ for the form.
    - Verein passes the vision images, Kontakt the contact images.
    - `/angebot` and the department page hand `fallbackImage` to `Groups`.
    - The department and group heroes fall back to the site fallback after hero and card image.
    - Answer several queries with `mockImplementation` keyed by query, as `src/app/page.test.ts` does.
- [ ] **Step 2:** Run those tests. Expected: FAIL.
- [ ] **Step 3: Implement.** Pages on `client.fetch` use `client.fetch<SiteImagesQueryResult>(siteImagesQuery)`. The department and group pages use `sanityFetch({ query: siteImagesQuery })`, with `stega: false` in `generateMetadata`. Run `pnpm run typegen:sanity` after adding the query. Delete `fallback-image.ts`.
- [ ] **Step 4:** Run the tests and `pnpm --filter web run typecheck`. Expected: PASS.
- [ ] **Step 5:** Commit (`feat(web): read vision, contact and fallback images from studio`).

### Task 7: Web — page heroes and open graph fallback

**Files:**

- Modify:
  - `app/_home/hero.tsx` and its test
  - `test-utils/page-contract.ts`
  - the pages and their tests: `app/page.tsx`, `app/angebot/page.tsx`, `app/verein/page.tsx`, `app/mitgliedschaft/page.tsx`, `app/kontakt/page.tsx`, `app/news/page.tsx`, `app/(legal)/{impressum,datenschutz,barrierefreiheit}/page.tsx`

**Interfaces:**

- Consumes: `getPageHeroImage` (Task 5).
- Produces:
  - The home `Hero` gets the prop `image?: { alt: string; src: ImageProps['src'] }`.
  - `itFollowsTheMetadataContract` gets the option `buildWithHeroImage?: (heroImage: unknown) => unknown`. When given, it registers `falls back to the hero image for the open graph image` (images match `{ width: 1200, height: 630 }`, URL with the hero asset id) and `prefers the open graph image over the hero image`.

- [ ] **Step 1: Write the failing tests.**
  - Each of the nine page tests asserts that `Hero` gets the document's hero alt text.
  - All but home pass `buildWithHeroImage` to the contract.
  - Home hero test:
    - It renders the given image by its alt text.
    - It renders no image without one.
    - `does not move the cut-out by a hotspot`: no `style.objectPosition` even when the image carries a hotspot.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Each page passes `getPageHeroImage(page.heroImage, page.title)` (membership: `page.membership.heroImage`) and `image: page.heroImage` to `getPageMetadata`.
  - Home passes no `image` to the metadata, and its hero ignores `objectPosition`.
  - Delete the `HERO_IMAGE` constants and image imports.
- [ ] **Step 4:** Run the tests and typecheck. Expected: PASS.
- [ ] **Step 5:** Commit (`feat(web): read page heroes from studio`).

### Task 8: Web — shared heroes (feedback, TSG-Echo, news categories)

**Files:**

- Modify:
  - `lib/sanity/queries/pages/{contact,about-us,news-overview}.ts`
  - `app/kontakt/feedback/page.tsx`, `app/verein/echo/page.tsx`, `app/verein/echo/[slug]/page.tsx`, `app/news/[category]/page.tsx` and their tests
- Delete: `app/verein/echo/_shared/hero.ts`

**Interfaces:**

- Produces:
  - `contactHeroImageQuery = *[_type == 'contact'][0].heroImage`
  - `aboutUsHeroImageQuery = *[_type == 'aboutUs'][0].heroImage`
  - `newsOverviewHeroImageQuery = *[_type == 'newsOverview'][0].heroImage`
  - Each of the three is exported next to its page query.

- [ ] **Step 1: Write the failing tests.**
  - Feedback:
    - The hero shows the contact hero.
    - `generateMetadata` keeps title and description and uses the contact hero as OG image.
  - Echo overview: hero and OG fallback from the about hero.
  - Echo issue:
    - The hero comes from the about hero.
    - The OG image stays the cover, or none when not indexable. The existing cases stay green.
  - News category: hero and OG fallback from the news overview hero.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Feedback and Echo read through `client.fetch` with the generated result types.
  - The news category reads through `sanityFetch`, with `stega: false` in `generateMetadata`.
  - The alt fallback is the page's own title.
  - Feedback swaps `export const metadata` for `generateMetadata`.
  - Run `pnpm run typegen:sanity`.
- [ ] **Step 4:** Run the tests and typecheck. Expected: PASS.
- [ ] **Step 5:** Commit (`feat(web): read shared heroes from studio`).

### Task 9: Revalidation

**Files:**

- Modify: `apps/web/src/app/api/revalidate/route.ts` and its test, `docs/SANITY_WEBHOOK_SETUP.md`

- [ ] **Step 1: Write the failing tests** in `route.test.ts`:
  - `revalidates the contact page with the feedback page below it` → `revalidatePath('/kontakt', 'layout')`
  - `revalidates the about page with the tsg-echo pages below it` → `('/verein', 'layout')`
  - The news overview case additionally expects `('/news/[category]', 'page')`.
  - `revalidates the accessibility page` → `('/barrierefreiheit')`
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3: Implement** the four entries in `REVALIDATION_MAP`, each with a one-line comment why. In `SANITY_WEBHOOK_SETUP.md`, add `"accessibility"` to the filter list and the type bullets, and update the contact, about and news overview bullets.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit (`fix(web): revalidate every page that shows a changed hero`).

### Task 10: Cleanup and full check

**Files:**

- Delete:
  - `apps/web/src/images/`
  - `apps/web/public/og/`
  - `apps/web/src/app/news/_assets/`
  - `apps/web/src/app/(legal)/_shared/hero.webp`
- Modify: `apps/web/vitest.config.ts` (drop `assetStub`), `apps/web/test-utils/setup-dom.ts` (drop the `StaticImageStub` branch and its comment if nothing uses it)

- [ ] **Step 1:** `grep -rnE "from '[^']+\.(webp|png|jpe?g|avif|gif|svg)'" apps/web/src apps/web/test-utils`. Expected: no hits. Then delete the files and the stub.
- [ ] **Step 2:** From the root run `pnpm run lint`, `pnpm run typecheck` and `pnpm run test:coverage`. Expected: all green, thresholds held.
- [ ] **Step 3:** Commit (`chore(web): remove image files now kept in studio`).

### Task 11: End-to-end fixtures and screenshots

Needs Task 4 done and a running Docker daemon.

- [ ] **Step 1:** `pnpm --filter web run e2e:record`. Then restore the hand-kept main menu fixture (the file whose `body.result` holds `mainNavigation`) with `but discard <file>`, never `git checkout --`.
- [ ] **Step 2:** `pnpm --filter web run test:e2e`. Expected: PASS. Visual specs skip on macOS. The axe sweep stays clean.
- [ ] **Step 3:** `pnpm --filter web run test:e2e:visual:update`. Review the changed PNGs. Only the migrated images may change: they now render as the mock's transparent stubs. No box may move or resize. Anything else is a bug, so fix it before going on.
- [ ] **Step 4:** Commit fixtures and baselines (`test(web): record fixtures and baselines for studio images`).

### Task 12: Documentation

**Files:**

- Modify: `apps/studio/AGENTS.md`, `apps/web/AGENTS.md`

- [ ] **Step 1: Studio guide.** Add a section „Page images“:
  - the `heroImage` field and where each hero also appears
  - the three site settings fields
  - the migration, structured like „Department migration“: commands, what a run does, that it is a one-off removed after `production`
  - the directory map line for `scripts`
- [ ] **Step 2: Web guide.**
  - Page heroes come uncropped with the hotspot as `object-position`, department and group heroes stay cropped.
  - The OG fallback is the hero (not on home).
  - `siteImagesQuery` serves vision, contact and fallback.
  - The new revalidation entries.
  - Replace the `assetStub` paragraph under „Testing“.
- [ ] **Step 3:** Commit (`docs: describe studio page images`).

### Task 13: Pull request and staging (runbook)

- [ ] **Step 1:** Open the PR with the `create-pr` skill (English body, `Closes WEB-389`). Bind it and turn on Auto-fix. Kodiak merges on green.
- [ ] **Step 2:** After the merge, show the user the new staging webhook filter (current list plus `accessibility`). On OK, patch it the way the `sanity-revalidation-webhooks` memory describes.
- [ ] **Step 3:** Check `https://next.tsg-irlich.de` (`/`, `/verein`, `/verein/echo`, `/kontakt/feedback`, `/news/<a category>`, `/barrierefreiheit`): every image is there with its alt text. Then replace one vision image in the `development` studio and see it change on `/` and `/verein`.

### Task 14: Production rollout and follow-up (runbook, at the next release)

- [ ] **Step 1:** Run together with the WEB-384 rollout, before `next` → `main` merges, each write after the user's OK:
  1. export `production`
  2. pause the production webhook
  3. department migration
  4. `migrate:page-images --dataset production` as a dry run, then the real run
- [ ] **Step 2:** Merge the release. Re-enable the production webhook with the documented filter, including `faq` and `accessibility`. Check the pages from Task 13 on `tsg-irlich.de`.
- [ ] **Step 3:** Follow-up PR, once production is migrated: delete `scripts/migrate-page-images*`, the `migrate:page-images` script and the migration part of the studio guide.
