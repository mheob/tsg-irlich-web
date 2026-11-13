# Ehrenamtsseite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/verein/ehrenamt`, a page that wins volunteers, with every text in a new Sanity singleton `volunteerPage` and the open positions as a document type `volunteer.position` that editors publish and withdraw themselves.

**Architecture:** The pattern of the partner page (WEB-326, #787): a single page in the studio, a server-rendered route that reads it through one `client.fetch` query, a start-content script that only writes a draft, and the usual wiring (desk, internal link target, path resolver, revalidation, sitemap, site search, axe sweep, visual baseline). New is a document type whose published documents all appear on the page, newest first. The icon list, the icon component and the `mailto:` helper of the partner page become shared so both pages use them.

**Tech Stack:** Sanity Studio 6 (`defineType`/`defineField`), Next.js 16 App Router, Tailwind, Base UI wrappers (`Accordion`), Lucide icons, Vitest via `vp test`, Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-11-13-web-190-volunteer-page-design.md` (German). Read it before Task 1; the decisions there are binding. The prototype lives on `origin/feat/web-190-volunteer-page-prototype` (`git show origin/feat/web-190-volunteer-page-prototype:apps/web/src/app/verein/engagiere-dich-prototyp/<file>`): `_shared/content.ts` (start texts), `_shared/data.ts` (board ids, group slugs of the images), `_variants/variant-a.tsx` (first section), `_variants/variant-b.tsx` (voices, areas, positions). The partner page is the model for every file kind: `apps/studio/schemas/single-pages/partner-page/`, `apps/studio/scripts/create-partner-page*`, `apps/web/src/app/verein/partner/`, its plan `docs/superpowers/plans/2026-11-12-web-326-partner-page.md`.

**Branch:** `feat/web-190-volunteer-page` from `next`.

## Global Constraints

- Shell: prefix every `pnpm`/`node`/`vp` command with `export PATH="$HOME/.local/share/vite-plus/bin:$PATH";`.
- Commits go through the `create-commit` skill (Conventional Commits, scope `studio`, `web` or `shared`), no co-author trailer. Run `pnpm run format:check` before each commit.
- Route `/verein/ehrenamt`. Singleton type and id `volunteerPage`, hidden fixed slug `ehrenamt`, studio title „Ehrenamt“. Document type `volunteer.position`, studio title „Offene Aufgabe“. Each gets an icon of its own from `react-icons/ri`.
- Inquiry e-mail initial value `info@tsg-irlich.de`; subject initial value „Ehrenamt bei der TSG Irlich“. The „Jetzt melden“ button of a position uses the subject `<subject>: <position title>`; the „Nichts Passendes dabei?“ card uses the subject as it is.
- Page order: Hero → Gründe (variant A, first section) → Stimmen (B) → Bereiche (B) → Aktuell gesucht (B) → `ContactPersons` (the usual blue section) → `Newsletter`. No yellow statement band, no portrait cards on yellow.
- Area numbers: two digits (`01`, `02`, …) in the outlined style of `GroupCard` (`apps/web/src/app/_home/group-card.tsx`: `text-stroke text-white`, `font-serif`).
- The page shows every published `volunteer.position`, ordered `_createdAt desc`. Without one, the accordion and the button „Offene Aufgaben ansehen“ are left out; the section „Aktuell gesucht“ with its steps and the „Nichts Passendes dabei?“ card stays.
- Voices are references to `testimonial` documents; without a resolving one the section is left out.
- Studio warnings (never errors): reasons ≠ 6 → „Das Raster ist für 6 Karten gebaut.“; steps ≠ 3 → „Der Ablauf ist für 3 Schritte gebaut.“ No count warning on areas.
- Every visible text of the page comes from `volunteerPage` or a position, except screen-reader hints and the shared `Newsletter`.
- All studio titles, descriptions and validation messages in German. Web code: function declarations, named exports, `Readonly<…>` props, interfaces at file end, no `try`/`catch` in components, test imports from `vite-plus/test`, assertions on role, name, text and href — no class names except where a test below names one on purpose.
- Coverage thresholds in every `vitest.config.ts` must still pass (`pnpm run test:coverage`); raise none, lower none.
- After any schema change: `pnpm run extract-types && pnpm run typegen:sanity` from the repository root. After adding the route: `pnpm --filter web run typegen:routes`.
- The placeholder positions of the prototype never go to `production`.

## Review Focus

1. No published position (the editors withdrew the last one) — no accordion, no „Offene Aufgaben ansehen“ button, no anchor that leads nowhere; steps and the „Nichts Passendes dabei?“ card still show. Tests in Tasks 5, 7 and 8.
2. A voice whose testimonial was deleted or unpublished (`null` in `testimonials[]->`) — dropped; all of them gone → the whole section is left out, never a header above nothing. Tests in Tasks 5 and 8.
3. A position with an empty list or without `effort` — that list, or the clock badge, is left out; with all three lists empty the list grid is left out. Test in Task 7.
4. A position title with `/`, `&`, `?` or umlauts („Co-Trainer/in F-Jugend“) — the `mailto:` subject is percent-encoded and the address stays intact. Tests in Tasks 1 and 7.
5. An area image without an asset (document written through the API) — the row renders without the image, never a broken `<img>` or an empty box with the icon floating alone. Test in Task 6.

---

### Task 1: Shared icon list, icon component and mail helper

**Files:**

- Rename: `packages/shared/src/partner-icons.ts` → `packages/shared/src/page-icons.ts` (+ test, renamed)
- Create: `apps/web/src/components/ui/page-icon.tsx` (+ test) — from `apps/web/src/app/verein/partner/_shared/partner-icon.tsx` (delete it and its test)
- Create: `apps/web/src/utils/mail.ts` (+ test) — from `apps/web/src/app/verein/partner/_shared/mail.ts` (delete it and its test)
- Modify: the partner page imports (`_sections/reasons.tsx`, `ways.tsx`, `partners.tsx`), `apps/studio/schemas/single-pages/partner-page/sections.ts`, `…/index.test.ts`, `apps/studio/scripts/create-partner-page/start-content.test.ts`
- Modify docs: `apps/studio/AGENTS.md` and `apps/web/AGENTS.md` where they name `partner-icons` or the moved files

**Interfaces:**

- Produces `@tsgi-web/shared/page-icons`: `PAGE_ICONS` (`as const`, `{ title: string; value: string }[]`) holding the 13 existing entries with unchanged values, plus `graduation-cap` Doktorhut, `lightbulb` Glühbirne, `award` Auszeichnung, `dumbbell` Hantel, `flag` Flagge, `building-2` Gebäude, `party-popper` Party; `type PageIconName = (typeof PAGE_ICONS)[number]['value']`. The doc comment says it serves every page with selectable card icons.
- Produces `PageIcon({ icon, ...props }: Readonly<LucideProps & { icon?: null | string }>): ReactElement | null` in `@/components/ui/page-icon` — a `Record<PageIconName, LucideIcon>` map; unknown or missing value → `null`.
- Produces `getMailHref(inquiry: Readonly<{ email: string; subject: string }>, topic?: string): string` in `@/utils/mail` → `mailto:<email>?subject=<encodeURIComponent(topic ? `${subject}: ${topic}` : subject)>`.

- [ ] **Step 1: Move the tests first** (`git mv` the three test files to their new places) and adapt them: `page-icons.test.ts` keeps its checks (unique kebab-case values, non-empty titles) and adds that the list holds the 13 partner values and the 7 new ones; `page-icon.test.tsx` draws an `<svg>` for every `PAGE_ICONS` value and nothing for `'unbekannt'` and `undefined`; `mail.test.ts`:

```ts
const inquiry = { email: 'info@tsg-irlich.de', subject: 'Ehrenamt bei der TSG Irlich' };
expect(getMailHref(inquiry)).toBe(
	'mailto:info@tsg-irlich.de?subject=Ehrenamt%20bei%20der%20TSG%20Irlich',
);
expect(getMailHref(inquiry, 'Co-Trainer/in F-Jugend & mehr?')).toBe(
	'mailto:info@tsg-irlich.de?subject=Ehrenamt%20bei%20der%20TSG%20Irlich%3A%20Co-Trainer%2Fin%20F-Jugend%20%26%20mehr%3F',
);
```

- [ ] **Step 2: Run** `pnpm --filter @tsgi-web/shared test` and `pnpm --filter web test -- src/components/ui/page-icon src/utils/mail` → FAIL (modules missing).
- [ ] **Step 3: Move the code** (`git mv`), rename the exports, add the seven icons, add the `topic` parameter, and update every import listed under Files.
- [ ] **Step 4: Run** `pnpm --filter @tsgi-web/shared test`, `pnpm --filter web test -- src/app/verein/partner src/components/ui/page-icon src/utils/mail`, `pnpm --filter studio test -- partner-page create-partner-page`, `pnpm run typecheck`, `pnpm run knip` → all PASS, no unused export left behind.
- [ ] **Step 5: Commit** — `refactor: share the card icons and the mail helper of the partner page`.

---

### Task 2: The document type `volunteer.position` in the studio

**Files:**

- Create: `apps/studio/schemas/documents/volunteer.position.ts` (+ `volunteer.position.test.ts`)
- Modify: `apps/studio/schemas/index.ts` (register), `apps/studio/structure/index.ts` (+ `index.test.ts`), `apps/studio/structure/pages.ts` (`PAGE_LAYOUT` club `content`), `apps/studio/structure/sections.test.ts`
- Modify docs: `apps/studio/AGENTS.md` (document types, desk), root `AGENTS.md` (content types list)
- Regenerate: `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`

**Interfaces:**

- Produces the document shape every later task reads:

```
volunteer.position   title „Offene Aufgabe“
  title    string, required, warning above 65 characters
  area     string, required, warning above 32 characters   („Bereich“, shown as badge)
  effort   string, optional, warning above 32 characters   („Zeitaufwand“, badge with clock)
  teaser   text, required, warning above 240 characters    („Anreißer“)
  tasks    string[] optional („Deine Aufgaben“)
  profile  string[] optional („Das bringst du mit“)
  offer    string[] optional („Das bieten wir“)
preview: title = title, subtitle = area
orderings: newest first (_createdAt desc), title asc
```

- Produces the desk group `volunteer` (`DocumentGroup`): one list item „Offene Aufgaben“, id `volunteer-positions`, `S.documentTypeList('volunteer.position')` with `defaultOrdering([{ direction: 'desc', field: '_createdAt' }])`. `PAGE_LAYOUT` club: `content: ['echo', 'volunteer']`. `'volunteer.position'` joins `isExcludedDefaultListItem`'s list, so it is not listed twice.

- [ ] **Step 1: Write the failing tests:** `volunteer.position.test.ts` in the style of `faq.test.ts` — the seven fields with their types, `title`, `area` and `teaser` required, the three lists are `string` arrays, the preview maps `{ title: 'Schiedsrichter/in', area: 'Fußball' }` to `{ title: 'Schiedsrichter/in', subtitle: 'Fußball' }`, the first ordering sorts `_createdAt` descending. `structure/index.test.ts`: `getGroup(S, 'volunteer')` returns one item titled „Offene Aufgaben“; `isExcludedDefaultListItem('volunteer.position')` is `false`. `sections.test.ts`: the club area lists „TSG-Echo Ausgaben“ and then „Offene Aufgaben“ below „Inhalte“.
- [ ] **Step 2: Run** `pnpm --filter studio test` → the new cases FAIL.
- [ ] **Step 3: Implement** the schema, register it, add the desk group and the layout entry.
- [ ] **Step 4: Run** `pnpm --filter studio test` → PASS. Then `pnpm run extract-types && pnpm run typegen:sanity`, `pnpm run typecheck` → no errors.
- [ ] **Step 5: Document** the type in `apps/studio/AGENTS.md` (what it holds, that every published one shows on `/verein/ehrenamt` newest first, that withdrawing means unpublishing) and in the content types line of the root `AGENTS.md`.
- [ ] **Step 6: Commit** — `feat(studio): add the open volunteer positions`.

---

### Task 3: The `volunteerPage` singleton and its place in the studio

**Files:**

- Create: `apps/studio/schemas/single-pages/volunteer-page/index.ts`, `…/sections.ts`, `…/_groups.ts`, `…/index.test.ts`
- Modify: `apps/studio/schemas/single-pages/index.ts`, `apps/studio/structure/pages.ts`, `apps/studio/schemas/objects/internal-link.ts`
- Modify tests: `apps/studio/structure/pages.test.ts`, `apps/studio/structure/sections.test.ts`, `apps/studio/schemas/single-pages/hero-image.test.ts`, `apps/studio/schemas/single-pages/search.test.ts`, `apps/studio/schemas/objects/internal-link.test.ts`
- Modify docs: `apps/studio/AGENTS.md` (new section „Volunteer page“, desk paragraph)
- Regenerate: `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`

**Interfaces:**

- Consumes: `PAGE_ICONS` (Task 1), `testimonial` (existing).
- Produces the document shape every later task reads (field names are binding):

```
volunteerPage
  slug            hidden, initial { current: 'ehrenamt' }, readOnly        (tab general)
  title, subtitle defaultHeroFields                                        (tab general)
  heroImage       getHeroImageField(LANDSCAPE_HERO_DESCRIPTION)             (tab general)
  content         object, required                                         (tab content, sub-tabs below)
    whySection          group why „Gründe“
      title, subtitle, intro     getDefaultPageSectionFieldsWithGroup()
      cta        string optional („Offene Aufgaben ansehen“)
      reasons[]  volunteerReason { title string req, text text req, icon string req (options.list PAGE_ICONS) }
    voicesSection       group voices „Stimmen“
      title, subtitle, intro
      testimonials[]  reference → testimonial, optional
    areasSection        group areas „Bereiche“
      title, subtitle, intro
      areas[]    volunteerArea { title string req, text text req, image extendedImage req, icon string req, tasks string[] optional }
    positionsSection    group positions „Aktuell gesucht“
      title, subtitle, intro
      steps[]    volunteerStep { title string req, text text req }
      tasksHeading   string req, initial „Deine Aufgaben“
      profileHeading string req, initial „Das bringst du mit“
      offerHeading   string req, initial „Das bieten wir“
      cta            string req, initial „Jetzt melden“
      otherTitle     string optional („Nichts Passendes dabei?“)
      otherText      string optional
    contactPersonsSection   contactPersonsSectionField (group contactPersons „Ansprechpartner“)
  inquiry         object, required                                         (tab inquiry „Anfragen“)
    email    type email, required, initial 'info@tsg-irlich.de'
    subject  string, required, initial 'Ehrenamt bei der TSG Irlich'
  meta            metaField                                                (tab meta)
groups: [general, content, inquiry, meta]; preview getSinglePagePreview('Ehrenamt')
```

The card text limits mirror the partner page (title warning above 65, text above 160). `reasons` and `steps` carry `Rule.custom(…).warning()` returning the texts of the Global Constraints when the length differs (and `true` for a missing array).

- [ ] **Step 1: Write the failing schema test** `volunteer-page/index.test.ts`, built on the helpers of `partner-page/index.test.ts`: slug fixed to `ehrenamt`; tabs `general, content, inquiry, meta`; inquiry presets `info@tsg-irlich.de` (type `email`) and „Ehrenamt bei der TSG Irlich“; `reasons` warns at 5 and 7 cards and passes at 6 and `undefined`; `steps` warns at 2 and passes at 3; `areas` has no count rule; every `icon` field offers `PAGE_ICONS`; `testimonials` references `testimonial`; the four `positionsSection` headings and the button carry the initial values above; `area.image` is of type `extendedImage`; the preview is `{ title: 'Ehrenamt' }`.
- [ ] **Step 2: Extend the existing tests:** `pages.test.ts` expects `findSinglePage('volunteerPage')` to equal `{ parent: 'aboutUs', path: '/verein/ehrenamt' }` and the club pages `['echoOverview', 'partnerPage', 'volunteerPage']`; add `volunteerPage` to `sections.test.ts`, `hero-image.test.ts` (`LANDSCAPE_HERO_DESCRIPTION`), `search.test.ts` (`PAGES`) and `internal-link.test.ts` (`toContainEqual({ type: 'volunteerPage' })`).
- [ ] **Step 3: Run** `pnpm --filter studio test` → the new and extended cases FAIL.
- [ ] **Step 4: Implement** the schema, register it, add `'volunteerPage'` to `SinglePageType`, `SINGLE_PAGES`, `PAGE_LAYOUT` club `pages` after `partnerPage`, and `{ type: 'volunteerPage' }` after `partnerPage` in `INTERNAL_LINK_TARGETS`.
- [ ] **Step 5: Run** `pnpm --filter studio test` → PASS, including `schemas/groups.test.ts`. Then `pnpm run extract-types && pnpm run typegen:sanity`, `pnpm run typecheck` → no errors.
- [ ] **Step 6: Document** the page in `apps/studio/AGENTS.md`: a section „Volunteer page“ (what it holds, fixed slug, link target, shared icon list, the two count warnings, voices as testimonial references, positions come from `volunteer.position`, no preview on purpose) and the club area of the desk paragraph.
- [ ] **Step 7: Commit** — `feat(studio): add the volunteer page singleton`.

---

### Task 4: Start content script

**Files:**

- Create: `apps/studio/scripts/shared/read-dataset.ts` (+ test) — `readDataset` moves out of `create-partner-page/start-content.ts`, whose test and script import it from here
- Create: `apps/studio/scripts/create-volunteer-page.ts`
- Create: `apps/studio/scripts/create-volunteer-page/start-content.ts` (+ test)
- Modify docs: `apps/studio/AGENTS.md` (directory map for `scripts`, run instructions in „Volunteer page“)

**Interfaces:**

- Consumes: the shapes of Tasks 2 and 3.
- Produces:
  - `readDataset(argv: readonly string[]): string` (unchanged behaviour, `production` allowed).
  - `hasPlaceholderFlag(argv: readonly string[]): boolean` — `true` when `argv` holds `--with-placeholder-positions`.
  - `buildStartContent(images: StartImages): VolunteerPageDraft` with `interface StartImages { heroImage?: SanityImageObject; areaImages: readonly (SanityImageObject | undefined)[] }` — returns `{ _id: 'drafts.volunteerPage', _type: 'volunteerPage', … }`: every text verbatim from the prototype's `_shared/content.ts` (`HERO`, `WHY` with `REASONS`, `VOICES_SECTION` without testimonials, `WAYS_SECTION` with `AREAS`, `OPENINGS_SECTION` with `STEPS`, `CONTACT`), `cta` „Offene Aufgaben ansehen“, the four positions headings and „Jetzt melden“, `otherTitle` „Nichts Passendes dabei?“, `otherText` „Erzähl uns, was du dir vorstellen kannst – wir finden etwas für dich.“, icons as kebab-case values (`GraduationCap` → `graduation-cap`, …), the inquiry presets, slug `ehrenamt`, contact persons as strong references with `_key` to the four `BOARD_IDS` of `_shared/data.ts` in order, each area's `image` from `areaImages[index]` with `alt` set to the area title (the area left without `image` when `undefined`), and `heroImage` as given (omitted when `undefined`).
  - `buildPlaceholderPositions(): VolunteerPositionDraft[]` — the four `OPENINGS` as `drafts.volunteer-position-placeholder-<n>` (`n` = 1…4) with `title`, `area`, `effort`, `teaser`, `tasks`, `profile`, `offer`.
- The script: reads `--dataset`; if `volunteerPage` or `drafts.volunteerPage` exists, prints „Die Ehrenamtsseite existiert schon in <dataset>, nichts geschrieben.“ and writes no page. Otherwise it reads the hero image of `aboutUs`, the `featuredImage` of the groups `1-mannschaft` and `a-jugend` and `fallbackImage` and `visionImages[0]` of the site images, in the order of `AREAS`, and creates the draft. With `--with-placeholder-positions` and a dataset other than `production` it creates the four placeholder positions with `createIfNotExists`; with `production` it refuses that flag with „Platzhalter-Aufgaben gehören nicht nach production.“ before writing anything. It never publishes.

- [ ] **Step 1: Write the failing tests:** `read-dataset.test.ts` (the cases moved from the partner test); `start-content.test.ts` — id `drafts.volunteerPage`; six reasons titled `Gemeinschaft`, `Persönliche Entwicklung`, `Sinn stiften`, `Sport fördern`, `Ideen einbringen`, `Wertschätzung`; four areas titled `Sport & Mannschaften`, `Schiedsrichter & Spielbetrieb`, `Verein & Organisation`, `Veranstaltungen & Helfer`; three steps; every icon value is in `PAGE_ICONS`; every array item has a unique `_key`; the four contact references in order; `inquiry` equals the presets; an area whose image is `undefined` has no `image`; `heroImage` absent for `undefined`; `buildPlaceholderPositions()` returns four drafts with the prototype titles; `hasPlaceholderFlag(['--', '--dataset', 'development', '--with-placeholder-positions'])` is `true`.
- [ ] **Step 2: Run** `pnpm --filter studio test -- scripts` → FAIL. **Implement** → PASS (the partner script tests still pass).
- [ ] **Step 3: Document** in `apps/studio/AGENTS.md`: `pnpm --filter studio exec sanity exec scripts/create-volunteer-page.ts --with-user-token -- --dataset <dataset> [--with-placeholder-positions]`.
- [ ] **Step 4: Commit** — `feat(studio): add a script for the volunteer page start content`.

---

### Task 5: Query, types and the sections „Gründe“ and „Stimmen“

**Files:**

- Create: `apps/web/src/lib/sanity/queries/pages/volunteer.ts`
- Create: `apps/web/src/app/verein/ehrenamt/_shared/types.ts`, `…/_shared/anchors.ts`
- Create: `apps/web/src/app/verein/ehrenamt/_sections/reasons.tsx` (+ test), `…/_sections/voices.tsx` (+ test)
- Regenerate: `apps/web/src/types/sanity.types.generated.ts`

**Interfaces:**

- Consumes: `PageIcon` (Task 1), the shapes of Tasks 2 and 3.
- Produces `volunteerPageQuery` (`defineQuery`, result type `VolunteerPageQueryResult`):

```groq
{
	"volunteerPage": *[_type == 'volunteerPage'][0] {
		...,
		content {
			...,
			voicesSection { ..., testimonials[]-> { _id, firstName, lastName, image, quote, role } },
			contactPersonsSection { ..., contactPersons[]-> { ${contactPersons} } }
		}
	},
	"positions": *[_type == 'volunteer.position'] | order(_createdAt desc) {
		_id, title, area, effort, teaser, tasks, profile, offer
	}
}
```

- Produces in `_shared/types.ts`, derived from `VolunteerPageQueryResult`: `VolunteerPage`, `ReasonsSection`, `VoicesSection`, `AreasSection`, `PositionsSection`, `Inquiry`, `Position = VolunteerPageQueryResult['positions'][number]`, `Testimonial = NonNullable<VoicesSection['testimonials']>[number]` without `null`.
- Produces `POSITIONS_ANCHOR = 'aktuell-gesucht'` in `_shared/anchors.ts`.
- Produces `Reasons({ hasPositions, section }: Readonly<{ hasPositions: boolean; section: ReasonsSection }>)` — variant A's first section: `bg-background-low-contrast`, header and intro left (`SectionHeader`, `isCenteredOnDesktop={false}`), the `cta` as secondary `ButtonLink` to `#${POSITIONS_ANCHOR}` only when `hasPositions` and `cta` are set, the cards right as `ul` (1 / `sm` 2 / `xl` 3 columns) with `PageIcon`, `h3` title and text, turning blue on hover. Left out without reasons.
- Produces `Voices({ section, testimonials }: Readonly<{ section: VoicesSection; testimonials: Testimonial[] }>)` — variant B's blue band (`contact-persons.module.css` `bg`), one card per testimonial with `Quote` icon, `blockquote` „„<quote>““, `Portrait` (first and last name, image) and the name plus role in the `footer`; the middle card of three moves up on `md`. Returns `null` without testimonials.

- [ ] **Step 1: Write the failing tests** (dom project):

```ts
// reasons.test.tsx
it('shows the header and one card per reason', …);                  // h2 from title, h3 per reason
it('links the button to the open positions when there are some', …); // href '#aktuell-gesucht', name 'Offene Aufgaben ansehen'
it('leaves the button out without open positions', …);              // hasPositions: false → no link
it('leaves the whole section out without reasons', …);              // reasons: [] → container empty

// voices.test.tsx
it('shows each quote with name and role', …);                       // „Ich habe als Spieler …“, 'Max Mustermann', 'Schiedsrichter'
it('shows the initials where the testimonial has no portrait', …);  // image: undefined → 'MM'
it('leaves the section out without testimonials', …);               // [] → container empty
```

- [ ] **Step 2: Run** `pnpm --filter web test -- src/app/verein/ehrenamt` → FAIL.
- [ ] **Step 3: Write the query, run** `pnpm run typegen:sanity` **and implement** types, anchor and both sections.
- [ ] **Step 4: Run the tests** → PASS; `pnpm --filter web run typecheck` → no errors.
- [ ] **Step 5: Commit** — `feat(web): add the reasons and voices of the volunteer page`.

---

### Task 6: The section „Bereiche“

**Files:**

- Create: `apps/web/src/app/verein/ehrenamt/_sections/areas.tsx` (+ test)

**Interfaces:**

- Consumes: `AreasSection`, `PageIcon`.
- Produces `Areas({ section }: Readonly<{ section: AreasSection }>)` — variant B's alternating rows: every odd row puts the image right on `md`. The image box (`aspect-4/3`, `next/image` `fill` with `sizes="(min-width: 48rem) 50vw, 100vw"`, `urlForImage` at 1200 × 900) carries the icon plaque; an area whose image has no asset gets no image box and shows the plaque next to its number instead. The number is `String(index + 1).padStart(2, '0')`, `aria-hidden`, in the outlined style of the Global Constraints; then `h3` title, text and the tasks as chips (`ul`, left out when empty). Left out without areas.

- [ ] **Step 1: Write the failing tests:**

```ts
it('numbers the areas with two digits in their order', …);          // '01' … '04' visible, aria-hidden
it('shows title, text and the example tasks of an area', …);
it('leaves the task chips out of an area without tasks', …);
it('shows an area without image file without an image', …);        // image: { _type: 'extendedImage', alt: 'x' } → no <img>, title still there
it('uses the alt text of the image', …);                           // <img alt="Erste Mannschaft">
it('leaves the section out without areas', …);
```

- [ ] **Step 2: Run** `pnpm --filter web test -- src/app/verein/ehrenamt/_sections/areas` → FAIL. **Implement** → PASS.
- [ ] **Step 3: Commit** — `feat(web): add the areas of the volunteer page`.

---

### Task 7: The section „Aktuell gesucht“

**Files:**

- Create: `apps/web/src/app/verein/ehrenamt/_sections/positions.tsx` (+ test), `…/_sections/position-details.tsx` (+ test)

**Interfaces:**

- Consumes: `PositionsSection`, `Position`, `Inquiry`, `POSITIONS_ANCHOR`, `getMailHref` (Task 1), `Accordion*`, `Badge`, `ButtonLink`.
- Produces `PositionDetails({ cta, headings, href, position }: Readonly<{ cta: string; headings: { offer: string; profile: string; tasks: string }; href: string; position: Position }>)` — the open panel: teaser, then a grid of up to three lists (`h4` heading, items with `CircleCheck`), each left out when empty and the grid left out when all three are, then `ButtonLink size="sm"` with `cta` to `href`.
- Produces `Positions({ inquiry, positions, section }: Readonly<{ inquiry: Inquiry; positions: Position[]; section: PositionsSection }>)` — `section id={POSITIONS_ANCHOR}` on the background of the membership downloads (`downloads.module.css`). Left column (sticky on `lg`): header, intro, the steps as `ol` with round numbers. Right column: when `positions` is not empty an `Accordion` (`multiple={false}`, `defaultValue={[positions[0]._id]}`), each item's trigger with the title and the badges (`area`; `effort` with `Clock` only when set) and `PositionDetails` with `href = getMailHref(inquiry, position.title)`; below it, when `otherTitle` is set, the dashed card as a link to `getMailHref(inquiry)` with `otherTitle` and `otherText`.

- [ ] **Step 1: Write the failing tests:**

```ts
// position-details.test.tsx
it('shows the teaser and the three lists under their headings', …);
it('leaves an empty list out', …);                                  // profile: [] → no 'Das bringst du mit'
it('leaves the list grid out when all three lists are empty', …);
it('links the button to the given mail', …);

// positions.test.tsx
it('shows the steps in order', …);                                  // 'Melde dich', 'Lerne uns kennen', 'Leg los'
it('opens the first position and links its button with the title in the subject', …);
	// href 'mailto:info@tsg-irlich.de?subject=Ehrenamt%20bei%20der%20TSG%20Irlich%3A%20Co-Trainer%2Fin%20F-Jugend'
it('shows the effort badge only when a position has one', …);
it('links the other card to the mail without a topic', …);
it('shows steps and the other card but no accordion without positions', …);
it('carries the anchor the reasons button points to', …);           // section id 'aktuell-gesucht'
```

- [ ] **Step 2: Run** `pnpm --filter web test -- src/app/verein/ehrenamt/_sections/position` → FAIL. **Implement** → PASS.
- [ ] **Step 3: Commit** — `feat(web): add the open positions of the volunteer page`.

---

### Task 8: The page `/verein/ehrenamt`

**Files:**

- Create: `apps/web/src/app/verein/ehrenamt/page.tsx`, `apps/web/src/app/verein/ehrenamt/page.test.ts`
- Modify: `apps/web/src/utils/links.ts` (only the constant `VOLUNTEER_PAGE_PATH = '/verein/ehrenamt'` and its export; the resolver follows in Task 9)

**Interfaces:**

- Consumes: Tasks 5–7.
- Produces: default export `VolunteerPage()` and `generateMetadata()`. Reads `client.fetch<VolunteerPageQueryResult>(volunteerPageQuery)`; without `volunteerPage` → `notFound()` (page) or `{}` (metadata). Drops `null` from `contactPersons` and `testimonials` before rendering. Renders `Hero`, `Reasons` (`hasPositions={positions.length > 0}`), `Voices`, `Areas`, `Positions`, `ContactPersons`, `Newsletter`. Metadata through `getPageMetadata({ description: content.whySection?.intro, image: heroImage, meta, path: VOLUNTEER_PAGE_PATH, title })`.

- [ ] **Step 1: Write the failing test** `page.test.ts` after `apps/web/src/app/verein/partner/page.test.ts`: `itFollowsTheMetadataContract` with `path: '/verein/ehrenamt'`, `title: 'Ehrenamt'`, `missingDocument: { volunteerPage: null, positions: [] }`; „answers 404 without a published page“; „renders the sections in the order of the spec“ (`Hero`, `Reasons`, `Voices`, `Areas`, `Positions`, `ContactPersons`, `Newsletter`); „drops a contact person and a testimonial that no longer resolve“; „tells the reasons that there are no positions“ (`positions: []` → `Reasons` gets `hasPositions: false`).
- [ ] **Step 2: Run** `pnpm --filter web test -- src/app/verein/ehrenamt/page.test.ts` → FAIL. **Implement**, run `pnpm --filter web run typegen:routes` → PASS.
- [ ] **Step 3: Run** `pnpm --filter web test -- src/instrumentation-client.test.ts` → PASS (`/verein/*` already covers the newsletter).
- [ ] **Step 4: Commit** — `feat(web): add the volunteer page`.

---

### Task 9: Links, revalidation and sitemap

**Files:**

- Modify: `apps/web/src/utils/links.ts` (+ `links.test.ts`)
- Modify: `apps/web/src/app/api/revalidate/route.ts` (+ `route.test.ts`)
- Modify: `apps/web/src/app/sitemap.ts` (+ `sitemap.test.ts`)
- Modify docs: `apps/web/AGENTS.md` (revalidation paragraph, internal links), `docs/SANITY_WEBHOOK_SETUP.md` (`volunteerPage` and `volunteer.position` in the type filter of both live webhooks)

**Interfaces:**

- Produces: `getInternalHref({ _type: 'volunteerPage', slug: 'ehrenamt' }) === '/verein/ehrenamt'` through a `VOLUNTEER_PAGE_TYPE` entry in `PATH_RESOLVERS`; `REVALIDATION_MAP.volunteerPage` and `REVALIDATION_MAP['volunteer.position']` revalidate `VOLUNTEER_PAGE_PATH`; `REVALIDATION_MAP.testimonial` revalidates `/` and `VOLUNTEER_PAGE_PATH`; the sitemap lists `${baseUrl}/verein/ehrenamt` (`changeFrequency: 'monthly'`, `priority: 0.6`) right after the partner page.

- [ ] **Step 1: Write the failing tests:** `links.test.ts` — the resolver case above; `route.test.ts` rows `['volunteerPage', ['/verein/ehrenamt']]`, `['volunteer.position', ['/verein/ehrenamt']]`, and the `testimonial` row as `['/', '/verein/ehrenamt']`; `sitemap.test.ts` — the entry with the values above.
- [ ] **Step 2: Run** `pnpm --filter web test -- src/utils/links.test.ts src/app/api/revalidate src/app/sitemap.test.ts` → FAIL. **Implement** → PASS.
- [ ] **Step 3: Document** in `apps/web/AGENTS.md` and `docs/SANITY_WEBHOOK_SETUP.md`.
- [ ] **Step 4: Commit** — `feat(web): link, revalidate and list the volunteer page`.

---

### Task 10: Site search

**Files:**

- Modify: `apps/web/src/lib/sanity/queries/search.ts` (+ `search.test.ts`), `apps/web/src/lib/search/search-site.ts` (+ its test)
- Re-key: the e2e fixtures of the changed search queries in `apps/web/e2e/fixtures/sanity/`
- Modify docs: `apps/web/AGENTS.md` (Site search)

**Interfaces:**

- Consumes: `getInternalHref` for `volunteerPage` (Task 9).
- Produces:
  - `'volunteerPage'` appended to `SEARCH_PAGE_TYPES`, `searchPageTypeList` and `contactPersonPageTypeList`.
  - `pageScore`: the existing lead term over the section intros gains `content.areasSection.intro` and `content.positionsSection.intro`; the existing body term over the card paths gains `content.areasSection.areas[].title`, `content.areasSection.areas[].text` and `content.areasSection.areas[].tasks[]`. `content.whySection.intro` and `content.whySection.reasons[].title|text` already match the volunteer page, since it uses the partner page's paths. A new body term `boost(_type == 'volunteerPage', 0) && boost(*[_type == 'volunteer.position'].title match text::query($q), ${WEIGHTS.body})` finds the page by the titles of its published positions. All new paths (not the subquery) join the last catch-all term. Update the doc comment: the partner and the volunteer page share the `whySection` paths, no other type has them.
  - `searchTextsQuery`: `_type == 'volunteerPage' => coalesce(content.whySection.intro, '') + ' ' + coalesce(content.areasSection.intro, '')`.
  - `SEARCH_CACHE_TAGS` gains `'volunteer.position'`, so a published or withdrawn position expires the cached search.
- Before writing the subquery term, run it once against `development` (Sanity MCP `query_documents`, project `j4rxwl5m`, perspective `published`) inside a `score()` with `$q` = `"Schiedsrichter*"` and check that the volunteer page scores and no other type does. Record what was measured in the doc comment, as the existing comments do. If GROQ refuses the subquery inside `score()` or it scores other types, leave the term out, write the measurement into the doc comment and report it: finding the page by position titles is then an open point for the user, not something to work around here.

- [ ] **Step 1: Write the failing tests** in `search.test.ts`: `SEARCH_PAGE_TYPES` ends with `'volunteerPage'`; `searchCandidatesQuery` contains the new paths, the position term and `contactPersonPageTypeList` with `'volunteerPage'`; `searchTextsQuery` contains the `volunteerPage` branch. In the `search-site` test: the cache tags include `'volunteer.position'`.
- [ ] **Step 2: Run** `pnpm --filter web test -- src/lib/sanity/queries/search.test.ts src/lib/search` → FAIL. **Implement**, `pnpm run typegen:sanity` → PASS.
- [ ] **Step 3: Re-key the search fixtures** exactly as Task 8 Step 3 of the partner plan describes (throwaway script in the scratchpad, new key = sha256 of request path plus sorted params without `cacheMode`, `perspective`, `returnQuery`, `tag`, first 16 hex chars; `vp fmt` the new files).
- [ ] **Step 4: Run** `pnpm --filter web run test:e2e -- e2e/specs/search.spec.ts` → PASS and no „No Sanity fixture“ in the server log.
- [ ] **Step 5: Document** the page and the position titles in the Site search section of `apps/web/AGENTS.md`.
- [ ] **Step 6: Commit** — `feat(web): find the volunteer page in the site search`.

---

### Task 11: End-to-end, accessibility and visual baseline

**Files:**

- Create: `apps/web/e2e/specs/volunteer.spec.ts`
- Modify: `apps/web/e2e/specs/accessibility.spec.ts`, `apps/web/e2e/specs/visual.spec.ts`
- Add: the recorded fixture of `volunteerPageQuery`, the baselines `apps/web/e2e/__screenshots__/…/volunteer*.png`
- Modify docs: `apps/web/AGENTS.md` (Fixtures: how the volunteer fixture was made; Visual regression: eleven routes)

**Interfaces:**

- Consumes: everything above, the script of Task 4.

- [ ] **Step 1: Seed `development`.** `pnpm --filter studio exec sanity exec scripts/create-volunteer-page.ts --with-user-token -- --dataset development --with-placeholder-positions`, then publish `drafts.volunteerPage` and the four placeholder positions (studio or Sanity MCP `publish_documents`, project `j4rxwl5m`). Add three existing testimonials of `development` to `content.voicesSection.testimonials` and publish. Production stays untouched.
- [ ] **Step 2: Record only the volunteer fixture.** Copy `e2e/fixtures/sanity/` away, run `pnpm --filter web run e2e:record`, keep the new file whose `query` param contains `volunteerPage` (none of the search fixtures, which Task 10 re-keyed), restore everything else from the copy, including the hand-maintained menu fixture.
- [ ] **Step 3: Write** `volunteer.spec.ts`: on `/verein/ehrenamt` the `h1` reads „Ehrenamt“ (or the recorded title); the six reason headings and the four area headings are visible; „Offene Aufgaben ansehen“ links to `#aktuell-gesucht`; the first position is open and its „Jetzt melden“ `href` is `mailto:info@tsg-irlich.de?subject=Ehrenamt%20bei%20der%20TSG%20Irlich%3A%20<encoded first title>`; clicking the second trigger opens it and closes the first; the „Nichts Passendes dabei?“ link is `mailto:info@tsg-irlich.de?subject=Ehrenamt%20bei%20der%20TSG%20Irlich`.
- [ ] **Step 4: Add** `'/verein/ehrenamt'` to `STATIC_ROUTES` of `accessibility.spec.ts` (after `/verein/partner`) and `{ name: 'volunteer', route: '/verein/ehrenamt' }` to `STATIC_ROUTES` of `visual.spec.ts` (after `partner`).
- [ ] **Step 5: Run** `pnpm --filter web run test:e2e` → PASS (the visual specs skip on macOS), no „No Sanity fixture“ in the log, no new axe violation, exactly one `h1`.
- [ ] **Step 6: Generate the baselines** with `pnpm --filter web run test:e2e:visual:update` (Docker). `git status` must show only new `volunteer` screenshots for both browser projects; restore any other changed baseline and find out why it moved.
- [ ] **Step 7: Run the whole gate** from the root: `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run knip`, `pnpm run test:coverage` → all pass.
- [ ] **Step 8: Commit** — `test(web): cover the volunteer page end to end`.

---

## After the merge

The rollout follows „Livegang“ in the spec, steps 2–7: webhook filters (staging and production, each after the user's OK), release, start content as a draft in production without placeholder positions (name command and dataset first), editors review, add real positions and quotes, publish, add the menu entry and fill „SEO & Teilen“, then the German Linear comment with screenshots. None of it belongs to this branch.
