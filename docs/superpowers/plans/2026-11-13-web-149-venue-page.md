# Sportstättenseite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/verein/sportstaetten`, a page that shows every venue of the club — Pappelstadion and Pappelstübchen as its home, every other hall and field with the groups that train there — with the page texts in a new Sanity singleton `venuePage` and the facts of a venue (type „Vereinsheim“, equipment, opening hours) as new fields of `venue`.

**Architecture:** The pattern of the partner and volunteer pages (WEB-326 #787, WEB-190 #789): a single page in the studio, a server-rendered route that reads it through one `client.fetch` query, a start-content script that only writes a draft, and the usual wiring (desk, internal link target, path resolver, revalidation, sitemap, site search, axe sweep, visual baseline). The layout is variant A of the prototype without the counters; the home block gets the details strip below the image row (mockup option 2). The other venues are not listed in the singleton: the page shows every venue except the two home venues, split into halls and fields.

**Tech Stack:** Sanity Studio 6 (`defineType`/`defineField`), Next.js 16 App Router, Tailwind, Base UI wrappers, Lucide icons, Vitest via `vp test`, Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-11-13-web-149-venue-page-design.md` (German). Read it before Task 1; the decisions there are binding. The prototype lives on `feat/web-149-venues-page-prototype` (`git show feat/web-149-venues-page-prototype:apps/web/src/app/verein/sportstaetten-prototyp/<file>`): `_shared/content.ts` (start texts, equipment and opening hours for seeding `development`), `_shared/data.ts` (query shape, home venue ids, board filter), `_shared/venue-utils.ts` and `_shared/venue-parts.tsx` (building blocks to port), `_variants/variant-a.tsx` (layout). The approved mockup of the home block is `/Users/ab/dev/customer/tsg/tsg-irlich-web/.superpowers/brainstorm/51187-1794562633/content/heimat-layout.html` (gitignored, so only in the main checkout, not in a worktree), option 2 („Details als Leiste darunter“). The volunteer page is the model for every file kind: `apps/studio/schemas/single-pages/volunteer-page/`, `apps/studio/scripts/create-volunteer-page*`, `apps/web/src/app/verein/ehrenamt/`, its plan `docs/superpowers/plans/2026-11-13-web-190-volunteer-page.md`.

**Branch:** `feat/web-149-venue-page` from `next`. The spec and this plan are committed on it with Task 1.

## Global Constraints

- Shell: prefix every `pnpm`/`node`/`vp` command with `export PATH="$HOME/.local/share/vite-plus/bin:$PATH";`.
- Commits go through the `create-commit` skill (Conventional Commits, scope `studio` or `web`), no co-author trailer. Run `pnpm run format:check` before each commit.
- Route `/verein/sportstaetten`. Singleton type and id `venuePage`, hidden fixed slug `sportstaetten`, studio title „Sportstätten“, own icon from `react-icons/ri`.
- New `venue` type value `clubhouse`, titled „Vereinsheim“. Opening hours are only visible in the studio for that type.
- Inquiry e-mail initial value `info@tsg-irlich.de`; subject initial value „Frage zu den Sportstätten der TSG Irlich“. Only the link of the turf box uses it, with the subject as it is.
- Page order: Hero → Unsere Heimat → Weitere Sportanlagen → `ContactPersons` (the usual blue section) → `Newsletter`. No counters, no rent text or button, no „Anfahrt“ section.
- The home venues come from `content.homeSection.venues` (exactly two references). No venue id appears in `apps/web`. The script of Task 3 is the only place that names the ids of Pappelstadion (`2f1440fa-d543-427b-8792-d891e29000d8`) and Pappelstübchen (`968c56f9-7a9c-462f-be2b-8f269075b007`).
- Other venues: every `venue` not among the home venues. Halls are the types `hall-1`, `hall-2`, `hall-3`; fields are `cinder`, `grass`, `hybrid`, `artificial-turf`; a `clubhouse` outside the home block is not shown. Both lists ordered by title.
- A venue without an image file shows the site fallback image (`site-settings.fallbackImage`), never „Noch kein Foto“.
- Fixed labels in code (not in the studio): „Route planen“, „Hier trainieren“, „Das bietet der Platz“ / „Das bietet die Halle“ / „Das bietet das Vereinsheim“, „So findest du hin“, „Öffnungszeiten“, „Hallen“, „Plätze“, „+ n weitere“, the type labels. Every other visible text comes from `venuePage` or a `venue`.
- Type labels: `hall-1` „Einfeldhalle“, `hall-2` „Zweifeldhalle“, `hall-3` „Dreifeldhalle“, `cinder` „Aschenplatz“, `grass` „Rasenplatz“, `hybrid` „Hybridrasenplatz“, `artificial-turf` „Kunstrasenplatz“, `clubhouse` „Vereinsheim“.
- All studio titles, descriptions and validation messages in German. Web code: function declarations, named exports, `Readonly<…>` props, interfaces at file end, no `try`/`catch` in components, test imports from `vite-plus/test`, assertions on role, name, text and href — no class names.
- Coverage thresholds in every `vitest.config.ts` must still pass (`pnpm run test:coverage`); raise none, lower none.
- After any schema change: `pnpm run extract-types && pnpm run typegen:sanity` from the repository root. After adding the route: `pnpm --filter web run typegen:routes`.
- No write to a Sanity dataset without the user's OK on the exact payload. Production is not touched on this branch. The name and phone number of the tenant must never land in a committed fixture or baseline.

## Review Focus

1. A venue without an image file and a site fallback image that is missing too — no `<img>` with an empty `src`, the card title stays readable on the `bg-primary` box, the home row keeps its layout. Tests in Tasks 5 and 7.
2. A home venue reference that no longer resolves (venue deleted or unpublished, `null` from `venues[]->`) — that block is left out; with none left the whole section is left out, never a header above nothing. Tests in Tasks 6 and 8.
3. A venue without `location` (the schema does not require it) — no address and no „Route planen“, the column „So findest du hin“ of the strip is left out, the card has neither. Tests in Tasks 5, 6 and 7.
4. A group that trains at a venue but has no department slug, or whose training times there carry no weekday — no chip without a group page, no weekday row of seven grey days. Tests in Tasks 4 and 5.
5. A home venue without equipment, address and groups, or a clubhouse without opening hours — the strip (and its top border) is left out, the opening-hours box is left out; every venue a home venue so no halls and no fields — the section „Weitere Sportanlagen“ is left out. Tests in Tasks 6 and 7.

---

### Task 1: New fields of `venue` and its place in the desk

**Files:**

- Modify: `apps/studio/schemas/documents/venue.ts`; Create: `apps/studio/schemas/documents/venue.test.ts`
- Modify: `apps/studio/structure/index.ts` (+ `index.test.ts`), `apps/studio/structure/pages.ts` (`DocumentGroup`/`SectionContent`, `PAGE_LAYOUT` club `content`), `apps/studio/structure/sections.test.ts`
- Add: the spec and this plan (`docs/superpowers/…`)
- Modify docs: `apps/studio/AGENTS.md` (document types, desk)
- Regenerate: `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`

**Interfaces:**

- Produces the document shape every later task reads (existing fields unchanged):

```
venue   title „Sportstätte“
  type          + { title: 'Vereinsheim', value: 'clubhouse' } at the end of the list
  description   unchanged; description gains: „Erscheint auf der Sportstättenseite.“
  features      string[] optional  („Ausstattung“, warning above 8 entries and above 48 characters per entry)
  openingHours  array of venueOpeningHours { days string req („Tage“), time string req („Zeit“) } optional
                („Öffnungszeiten“), hidden: ({ document }) => document?.type !== 'clubhouse'
```

- Produces the desk group `venues` (`DocumentGroup`): one list item „Sportstätten“, id `venues`, `S.documentTypeList('venue')` ordered by title. `PAGE_LAYOUT` club: `content: ['echo', 'volunteer', 'venues']`. `'venue'` joins `isExcludedDefaultListItem`'s list.

- [ ] **Step 1: Write the failing tests:** `venue.test.ts` in the style of `faq.test.ts` — the type list ends with `{ title: 'Vereinsheim', value: 'clubhouse' }`; `features` is a `string` array; `openingHours` items have `days` and `time`, both required; `openingHours.hidden` is `true` for `{ document: { type: 'cinder' } }` and `false` for `{ document: { type: 'clubhouse' } }`; the existing required rules of `title`, `description` and `type` still hold. `structure/index.test.ts`: `getGroup(S, 'venues')` returns one item titled „Sportstätten“; `isExcludedDefaultListItem('venue')` is `false`. `sections.test.ts`: the club area lists „TSG-Echo Ausgaben“, „Offene Aufgaben“, „Sportstätten“ below „Inhalte“.
- [ ] **Step 2: Run** `pnpm --filter studio test` → the new cases FAIL.
- [ ] **Step 3: Implement** the fields, the desk group and the layout entry.
- [ ] **Step 4: Run** `pnpm --filter studio test` → PASS. Then `pnpm run extract-types && pnpm run typegen:sanity`, `pnpm run typecheck` → no errors.
- [ ] **Step 5: Document** the new fields and the desk place in `apps/studio/AGENTS.md`.
- [ ] **Step 6: Commit** — `feat(studio): add equipment, opening hours and the clubhouse type to venues`.

---

### Task 2: The `venuePage` singleton and its place in the studio

**Files:**

- Create: `apps/studio/schemas/single-pages/venue-page/index.ts`, `…/sections.ts`, `…/_groups.ts`, `…/index.test.ts`
- Modify: `apps/studio/schemas/single-pages/index.ts`, `apps/studio/structure/pages.ts`, `apps/studio/schemas/objects/internal-link.ts`
- Modify tests: `apps/studio/structure/pages.test.ts`, `apps/studio/structure/sections.test.ts`, `apps/studio/schemas/single-pages/hero-image.test.ts`, `apps/studio/schemas/single-pages/search.test.ts`, `apps/studio/schemas/objects/internal-link.test.ts`
- Modify docs: `apps/studio/AGENTS.md` (new section „Venue page“, desk paragraph)
- Regenerate: `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`

**Interfaces:**

- Consumes: `venue` (Task 1).
- Produces the document shape every later task reads (field names are binding):

```
venuePage
  slug            hidden, initial { current: 'sportstaetten' }, readOnly    (tab general)
  title, subtitle defaultHeroFields                                         (tab general)
  heroImage       getHeroImageField(LANDSCAPE_HERO_DESCRIPTION)              (tab general)
  content         object, required                                          (tab content, sub-tabs below)
    homeSection         group home „Heimat“
      title, subtitle, intro     getDefaultPageSectionFieldsWithGroup()
      venues[]   reference → venue, required, exactly 2, unique
                 („Die erste steht mit Bild links und trägt den Kunstrasen-Kasten.“)
      turfBox    object optional { title string, text text, linkText string }
    othersSection       group others „Weitere Sportanlagen“
      title, subtitle, intro
    contactPersonsSection   contactPersonsSectionField (group contactPersons „Ansprechpartner“)
  inquiry         object, required                                          (tab inquiry „Anfragen“)
    email    type email, required, initial 'info@tsg-irlich.de'
    subject  string, required, initial 'Frage zu den Sportstätten der TSG Irlich'
  meta            metaField                                                 (tab meta)
groups: [general, content, inquiry, meta]; preview getSinglePagePreview('Sportstätten')
```

`venues` errors „Wähle genau zwei Sportstätten.“ for any other length and „Jede Sportstätte nur einmal.“ for a duplicate `_ref`. In `turfBox`, `title` warns above 65 characters, `text` above 240; `linkText` is required once `title` or `text` is set („Der Linktext ist erforderlich, sobald der Kasten einen Titel oder Text hat.“).

- [ ] **Step 1: Write the failing schema test** `venue-page/index.test.ts`, built on the helpers of `volunteer-page/index.test.ts`: slug fixed to `sportstaetten`; tabs `general, content, inquiry, meta`; inquiry presets as above (type `email`); `venues` references `venue`, errors at 1 and 3 entries and for a duplicate, passes at 2 distinct ones; `turfBox.linkText` errors when `title` is set and `linkText` is empty and passes for an empty box; the preview is `{ title: 'Sportstätten' }`.
- [ ] **Step 2: Extend the existing tests:** `pages.test.ts` expects `findSinglePage('venuePage')` to equal `{ parent: 'aboutUs', path: '/verein/sportstaetten' }` and the club pages `['echoOverview', 'partnerPage', 'volunteerPage', 'venuePage']`; add `venuePage` to `sections.test.ts`, `hero-image.test.ts` (`LANDSCAPE_HERO_DESCRIPTION`), `search.test.ts` (`PAGES`) and `internal-link.test.ts` (`toContainEqual({ type: 'venuePage' })`).
- [ ] **Step 3: Run** `pnpm --filter studio test` → the new and extended cases FAIL.
- [ ] **Step 4: Implement** the schema, register it, add `'venuePage'` to `SinglePageType`, `SINGLE_PAGES`, `PAGE_LAYOUT` club `pages` after `volunteerPage`, and `{ type: 'venuePage' }` after `volunteerPage` in `INTERNAL_LINK_TARGETS`.
- [ ] **Step 5: Run** `pnpm --filter studio test` → PASS, including `schemas/groups.test.ts`. Then `pnpm run extract-types && pnpm run typegen:sanity`, `pnpm run typecheck` → no errors.
- [ ] **Step 6: Document** the page in `apps/studio/AGENTS.md`: a section „Venue page“ (what it holds, fixed slug, link target, the two home venues, every other venue appears on its own, the turf box, no preview on purpose) and the club area of the desk paragraph.
- [ ] **Step 7: Commit** — `feat(studio): add the venue page singleton`.

---

### Task 3: Start content script

**Files:**

- Create: `apps/studio/scripts/shared/board.ts` (+ test) — `BOARD_IDS` moves out of `create-volunteer-page/start-content.ts`, which imports it from here
- Create: `apps/studio/scripts/create-venue-page.ts`
- Create: `apps/studio/scripts/create-venue-page/start-content.ts` (+ test)
- Modify docs: `apps/studio/AGENTS.md` (directory map for `scripts`, run instructions in „Venue page“)

**Interfaces:**

- Consumes: the shapes of Tasks 1 and 2, `readDataset` from `scripts/shared/read-dataset`.
- Produces:
  - `BOARD_IDS` (`as const`, the four ids now in the volunteer start content, unchanged order).
  - `VENUE_PAGE_ID = 'drafts.venuePage'`, `HOME_VENUE_IDS = ['2f1440fa-d543-427b-8792-d891e29000d8', '968c56f9-7a9c-462f-be2b-8f269075b007'] as const` (Pappelstadion first).
  - `START_QUERY` — the published home venues (`_id`, `mainImage`) of `HOME_VENUE_IDS`.
  - `buildStartContent(heroImage?: SanityImageObject): VenuePageDraft` — returns `{ _id: VENUE_PAGE_ID, _type: 'venuePage', … }`: every text verbatim from the prototype's `_shared/content.ts` (`HERO`, `HOME`, `ARTIFICIAL_TURF` as `turfBox` with `linkText` „Sprich uns an, wenn du helfen willst“, `OTHERS`, `CONTACT`), the inquiry presets, slug `sportstaetten`, `homeSection.venues` as strong references with `_key` to `HOME_VENUE_IDS` in order, contact persons as strong references with `_key` to `BOARD_IDS` in order, `heroImage` as given (omitted when `undefined`).
- The script: reads `--dataset`; if `venuePage` or `drafts.venuePage` exists, prints „Die Sportstättenseite existiert schon in <dataset>, nichts geschrieben.“ and stops. If a home venue is missing (published), prints „Pappelstadion oder Pappelstübchen fehlt in <dataset>, nichts geschrieben.“ and exits with code 1. Otherwise it creates the draft with the Pappelstadion's `mainImage` as `heroImage`. It never publishes and never writes a venue.

- [ ] **Step 1: Write the failing tests:** `board.test.ts` — four distinct ids; the volunteer start-content test still passes against the moved constant. `start-content.test.ts` — id `drafts.venuePage`; hero title „Sportstätten“, subtitle „Hier spielt die TSG“; `homeSection.title` „Pappelstadion & Pappelstübchen“; `turfBox.title` „Unser Traum: Kunstrasen“; the two venue references in order; the four contact references in order; every array item has a unique `_key`; `inquiry` equals the presets; `heroImage` absent for `undefined` and equal to the given image otherwise; no field holds a rent text.
- [ ] **Step 2: Run** `pnpm --filter studio test -- scripts` → FAIL. **Implement** → PASS (the partner and volunteer script tests still pass).
- [ ] **Step 3: Document** in `apps/studio/AGENTS.md`: `pnpm --filter studio exec sanity exec scripts/create-venue-page.ts --with-user-token -- --dataset <dataset>`.
- [ ] **Step 4: Commit** — `feat(studio): add a script for the venue page start content`.

---

### Task 4: Query, types and venue helpers

**Files:**

- Create: `apps/web/src/lib/sanity/queries/pages/venue.ts`
- Create: `apps/web/src/app/verein/sportstaetten/_shared/types.ts`, `…/_shared/venues.ts` (+ `venues.test.ts`, node project)
- Regenerate: `apps/web/src/types/sanity.types.generated.ts`

**Interfaces:**

- Consumes: the shapes of Tasks 1 and 2.
- Produces `venuePageQuery` (`defineQuery`, result type `VenuePageQueryResult`) with a plain `/* groq */` fragment `venueFields` in the same file:

```groq
_id, title, type, mainImage, location, features, openingHours,
"description": description.text,
"groups": *[_type == 'group' && references(^._id) && defined(slug.current)] | order(title asc) {
	_id, title, "slug": slug.current, "department": department->slug.current,
	"weekdays": training.trainingTimes[venue._ref == ^.^._id].weekday
}
```

```groq
{
	"venuePage": *[_type == 'venuePage'][0] {
		...,
		content {
			...,
			homeSection { ..., venues[]-> { ${venueFields} } },
			contactPersonsSection { ..., contactPersons[]-> { ${contactPersons} } }
		}
	},
	"venues": *[_type == 'venue'] | order(title asc) { ${venueFields} },
	"fallbackImage": *[_type == 'site-settings'][0].fallbackImage
}
```

Before relying on it, run the query once against `development` (Sanity MCP `query_documents`, project `j4rxwl5m`) and check that the Mehrzweckhalle lists its groups with weekdays. If TypeGen cannot type `^.^`, keep the shape and type that one projection by hand in `types.ts`, noting why.

- Produces in `_shared/types.ts`, derived from `VenuePageQueryResult`: `VenuePage`, `HomeSection`, `OthersSection`, `Inquiry`, `TurfBox`, `Venue` (`VenuePageQueryResult['venues'][number]`), `VenueGroup` (`Venue['groups'][number]`), `FallbackImage`.
- Produces in `_shared/venues.ts`:
  - `WEEKDAYS` — the seven `{ key, label, name }` of the prototype (`monday`/`Mo`/`Montag` … `sunday`/`So`/`Sonntag`).
  - `getTypeLabel(type: Venue['type']): string` — the labels of the Global Constraints.
  - `getDetailsTitle(type: Venue['type']): string` — „Das bietet die Halle“ for `hall-*`, „Das bietet das Vereinsheim“ for `clubhouse`, „Das bietet der Platz“ otherwise.
  - `getTrainingDays(venue: Pick<Venue, 'groups'>): Set<string>` — every weekday of every group, `null` entries dropped.
  - `getGroupHref(group: VenueGroup): string | undefined` — `getInternalHref({ _type: 'group', department, slug })`.
  - `getAddressLines(location: Venue['location']): [string, string] | undefined` — `['<street> <houseNumber>', '<zipCode> <city>']`, zip left out when empty, `undefined` without location.
  - `splitOtherVenues(venues: readonly Venue[], homeIds: ReadonlySet<string>): { fields: Venue[]; halls: Venue[] }` — the rule of the Global Constraints, input order kept.

- [ ] **Step 1: Write the failing tests** (`venues.test.ts`):

```ts
it('labels every venue type', …);                                  // eight types, 'clubhouse' → 'Vereinsheim'
it('names the details after the kind of venue', …);                // 'hall-2' → 'Das bietet die Halle', …
it('collects the training days of all groups once', …);            // two groups with 'monday' → Set { 'monday', … }
it('ignores training times without a weekday', …);                 // weekdays: [null] → empty set
it('links a group to its page and nothing without a department', …); // department: null → undefined
it('builds the two address lines and leaves out a missing zip', …);
it('returns no address without a location', …);
it('splits the other venues into halls and fields without the home venues', …);
it('drops a clubhouse that is not a home venue', …);
```

- [ ] **Step 2: Run** `pnpm --filter web test -- src/app/verein/sportstaetten` → FAIL.
- [ ] **Step 3: Write the query, run** `pnpm run typegen:sanity` **and implement** types and helpers.
- [ ] **Step 4: Run the tests** → PASS; `pnpm --filter web run typecheck` → no errors.
- [ ] **Step 5: Commit** — `feat(web): add the venue page query and its helpers`.

---

### Task 5: Shared venue parts

**Files:**

- Create: `apps/web/src/app/verein/sportstaetten/_shared/venue-image.tsx` (+ test), `…/_shared/venue-parts.tsx` (+ test)

**Interfaces:**

- Consumes: Task 4, `GoToGoogleMaps`, `Button`, `urlForImage`, the asset check `getHeroImage` uses (`@/utils/hero-image`).
- Produces `VenueImage({ className, fallbackImage, sizes, venue }: Readonly<{ className?: string; fallbackImage?: FallbackImage; sizes: string; venue: Pick<Venue, 'mainImage' | 'title'> }>)` — a `relative overflow-hidden bg-primary` box; inside, `next/image` `fill` `object-cover` from `urlForImage(image, 900, 1200)` where `image` is `venue.mainImage` when it has an asset, else `fallbackImage` when it has one; `alt` is the image's `alt` or `venue.title`. Without either, the box stays empty (no `<img>`).
- Produces in `venue-parts.tsx` (ported from the prototype, same markup unless stated):
  - `VenueAddress({ className, venue })` — `address` with `MapPin` and the two lines; `null` without location.
  - `VenueRouteButton({ venue, variant })` — `GoToGoogleMaps` with a `Button size="sm"` „Route planen“ inside `render` (server-component rule of the root `AGENTS.md`); `null` without location.
  - `VenueGroups({ className, limit, venue })` — `ul aria-label="Gruppen, die hier trainieren"` of links to `getGroupHref`, groups without href dropped, „+ n weitere“ for the rest beyond `limit`; `null` when no group has an href.
  - `VenueWeekdays({ className, venue })` — `sr-only` „Trainingstage: Montag, …“ and an `aria-hidden` row of the seven labels; `null` without training days.
  - `FeatureList({ className, features })` — `ul` with `CircleCheck`; `null` for an empty or missing list.

- [ ] **Step 1: Write the failing tests** (dom project):

```ts
// venue-image.test.tsx
it('shows the image of the venue with its alt text', …);
it('falls back to the site image when the venue has no image file', …); // mainImage: { _type: 'extendedImage' } → fallback src
it('renders no image when neither has a file', …);                     // no <img>
it('takes the venue title as alt text of the fallback image', …);

// venue-parts.test.tsx
it('shows the address in two lines', …);
it('offers the route only when the venue has a location', …);          // location: null → no 'Route planen'
it('links each group to its page and drops groups without one', …);
it('limits the groups and counts the rest', …);                        // 6 groups, limit 4 → '+ 2 weitere'
it('names the training days for screen readers', …);                  // 'Trainingstage: Montag, Mittwoch'
it('leaves the weekdays out without training days', …);
it('leaves the feature list out when empty', …);
```

- [ ] **Step 2: Run** `pnpm --filter web test -- src/app/verein/sportstaetten/_shared` → FAIL. **Implement** → PASS.
- [ ] **Step 3: Commit** — `feat(web): add the building blocks of the venue page`.

---

### Task 6: The section „Unsere Heimat“

**Files:**

- Create: `apps/web/src/app/verein/sportstaetten/_sections/home-venue.tsx` (+ test), `…/_sections/home.tsx` (+ test)

**Interfaces:**

- Consumes: Tasks 4 and 5, `SectionHeader`, `PortableText`, `getMailHref` (`@/utils/mail`).
- Produces `HomeVenue({ children, fallbackImage, isReversed, venue }: Readonly<{ children?: ReactNode; fallbackImage?: FallbackImage; isReversed?: boolean; venue: Venue }>)` — an `article`:
  - top row (`lg` two columns, `items-center`): `VenueImage` (`aspect-16/10`, rounded, shadow, `sizes="(min-width: 64rem) 50vw, 100vw"`, last on `lg` when `isReversed`), then the type label as kicker, the title as `h3` (`font-serif`, uppercase) and the whole `description` through `PortableText`;
  - the strip, full width with a top border, `md` columns: `getDetailsTitle(venue.type)` (`h4`) with `FeatureList`; „So findest du hin“ (`h4`) with `VenueAddress` and `VenueRouteButton variant="secondary"`; „Hier trainieren“ (`h4`) with `VenueGroups` (no limit). A column without content is left out; without any column the strip and its border are left out;
  - `children` below, full width.
- Produces `Home({ fallbackImage, inquiry, section }: Readonly<{ fallbackImage?: FallbackImage; inquiry: Inquiry; section: HomeSection }>)` — a section with the centered `SectionHeader` and one `HomeVenue` per resolving venue (`null` dropped), the second `isReversed`. The first venue's children hold the turf box when `turfBox.title` or `turfBox.text` is set: `aside` on `bg-primary` with `Sparkles`, title, text and a link `turfBox.linkText` to `getMailHref(inquiry)`. Every venue with at least one `openingHours` row gets the box „Öffnungszeiten“: bordered, `Clock`, a `dl` of `days`/`time`. Returns `null` when no venue resolves.

- [ ] **Step 1: Write the failing tests:**

```ts
// home-venue.test.tsx
it('shows type, name and the whole description', …);               // 'Aschenplatz', h3 'Pappelstadion', both paragraphs
it('names the equipment after the kind of venue', …);              // h4 'Das bietet der Platz'
it('shows address, route and groups in the strip', …);
it('leaves out a strip column without content', …);                // groups: [] → no 'Hier trainieren'
it('leaves the strip out when no column has content', …);          // no features, location, groups → no h4 at all
it('shows the fallback image when the venue has none', …);

// home.test.tsx
it('shows the header and both home venues in order', …);
it('puts the turf box with the mail link to the first venue', …);
	// link 'Sprich uns an, wenn du helfen willst' → 'mailto:info@tsg-irlich.de?subject=Frage%20zu%20den%20Sportst%C3%A4tten%20der%20TSG%20Irlich'
it('leaves the turf box out without title and text', …);
it('shows the opening hours of the clubhouse', …);                 // 'Dienstag bis Freitag', 'ab 17 Uhr'
it('leaves the opening hours out when there are none', …);
it('drops a home venue that no longer resolves', …);               // [venue, null] → one h3
it('leaves the section out when no home venue resolves', …);       // [null, null] → container empty
```

- [ ] **Step 2: Run** `pnpm --filter web test -- src/app/verein/sportstaetten/_sections/home` → FAIL. **Implement** → PASS.
- [ ] **Step 3: Commit** — `feat(web): add the home venues of the venue page`.

---

### Task 7: The section „Weitere Sportanlagen“

**Files:**

- Create: `apps/web/src/app/verein/sportstaetten/_sections/venue-card.tsx` (+ test), `…/_sections/others.tsx` (+ test)

**Interfaces:**

- Consumes: Tasks 4 and 5, `SectionHeader`, `groups.module.css` of `@/app/angebot/[group]/_sections/`.
- Produces `VenueCard({ fallbackImage, venue }: Readonly<{ fallbackImage?: FallbackImage; venue: Venue }>)` — variant A's card: `aspect-video` `VenueImage` with the dark gradient, the type label as yellow badge and the title as `h4` on it; below `VenueAddress`, `VenueWeekdays`, `VenueGroups limit={4}` and `VenueRouteButton variant="secondary"` at the bottom.
- Produces `Others({ fallbackImage, fields, halls, section }: Readonly<{ fallbackImage?: FallbackImage; fields: Venue[]; halls: Venue[]; section: OthersSection }>)` — the section on the background of the group overview, centered `SectionHeader`, then „Hallen (n)“ and „Plätze (n)“ as `h3` (count in `text-primary-light`), each a grid (1 / `md` 2 / `xl` 3 columns) of `VenueCard`. A list without venues is left out; with both empty the section returns `null`.

- [ ] **Step 1: Write the failing tests:**

```ts
// venue-card.test.tsx
it('shows type, name, address, weekdays and up to four groups', …);
it('keeps the title readable without any image', …);                // no <img>, h4 still there
it('leaves address and route out without a location', …);

// others.test.tsx
it('lists halls and fields under their headings with the count', …); // 'Hallen (2)', 'Plätze (1)'
it('leaves a heading out when it has no venue', …);                  // fields: [] → no 'Plätze'
it('leaves the section out without other venues', …);
```

- [ ] **Step 2: Run** `pnpm --filter web test -- src/app/verein/sportstaetten/_sections` → FAIL. **Implement** → PASS.
- [ ] **Step 3: Commit** — `feat(web): add the other venues of the venue page`.

---

### Task 8: The page `/verein/sportstaetten`

**Files:**

- Create: `apps/web/src/app/verein/sportstaetten/page.tsx`, `apps/web/src/app/verein/sportstaetten/page.test.ts`
- Modify: `apps/web/src/utils/links.ts` (only the constant `VENUE_PAGE_PATH = '/verein/sportstaetten'` and its export; the resolver follows in Task 9)

**Interfaces:**

- Consumes: Tasks 4–7.
- Produces: default export `VenuePage()` and `generateMetadata()`. Reads `client.fetch<VenuePageQueryResult>(venuePageQuery)`; without `venuePage` → `notFound()` (page) or `{}` (metadata). Drops `null` from `contactPersons` and `homeSection.venues`, builds `homeIds` from the remaining venues and passes `splitOtherVenues(venues, homeIds)` to `Others`. Renders `Hero` (`getPageHeroImage(heroImage, title)`), `Home`, `Others`, `ContactPersons`, `Newsletter`. Metadata through `getPageMetadata({ description: content.homeSection?.intro, image: heroImage, meta, path: VENUE_PAGE_PATH, title })`.

- [ ] **Step 1: Write the failing test** `page.test.ts` after `apps/web/src/app/verein/ehrenamt/page.test.ts`: `itFollowsTheMetadataContract` with `path: '/verein/sportstaetten'`, `title: 'Sportstätten'`, `missingDocument: { venuePage: null, venues: [], fallbackImage: null }`; „answers 404 without a published page“; „renders the sections in the order of the spec“ (`Hero`, `Home`, `Others`, `ContactPersons`, `Newsletter`); „drops a contact person and a home venue that no longer resolve“; „passes every venue except the home venues to the other venues“ (three venues, one of them a home venue → `Others` gets the two others, split into halls and fields).
- [ ] **Step 2: Run** `pnpm --filter web test -- src/app/verein/sportstaetten/page.test.ts` → FAIL. **Implement**, run `pnpm --filter web run typegen:routes` → PASS.
- [ ] **Step 3: Commit** — `feat(web): add the venue page`.

---

### Task 9: Links, revalidation and sitemap

**Files:**

- Modify: `apps/web/src/utils/links.ts` (+ `links.test.ts`)
- Modify: `apps/web/src/app/api/revalidate/route.ts` (+ `route.test.ts`)
- Modify: `apps/web/src/app/sitemap.ts` (+ `sitemap.test.ts`)
- Modify docs: `apps/web/AGENTS.md` (revalidation paragraph, internal links), `docs/SANITY_WEBHOOK_SETUP.md` (`venuePage` in the type filter of both live webhooks; describe what `venue` and `group` now revalidate)

**Interfaces:**

- Produces: `getInternalHref({ _type: 'venuePage', slug: 'sportstaetten' }) === '/verein/sportstaetten'` through a `VENUE_PAGE_TYPE` entry in `PATH_RESOLVERS`; `REVALIDATION_MAP.venuePage` revalidates `VENUE_PAGE_PATH`; `REVALIDATION_MAP.venue` revalidates `/angebot`, `/angebot/[group]/[singleGroup]` (`page`) and `VENUE_PAGE_PATH`; `REVALIDATION_MAP.group` runs `revalidateOfferRoutes()` and revalidates `VENUE_PAGE_PATH`; the comments say why (groups and training days on the venue page). The sitemap lists `${baseUrl}/verein/sportstaetten` (`changeFrequency: 'monthly'`, `priority: 0.6`) right after the volunteer page.

- [ ] **Step 1: Write the failing tests:** `links.test.ts` — the resolver case above; `route.test.ts` — a `venuePage` case expecting `[['/verein/sportstaetten']]`, the `venue` case gains `['/verein/sportstaetten']`, the group case („revalidates the whole offer for a group, but not the home page“) gains `['/verein/sportstaetten']`; `sitemap.test.ts` — the entry with the values above.
- [ ] **Step 2: Run** `pnpm --filter web test -- src/utils/links.test.ts src/app/api/revalidate src/app/sitemap.test.ts` → FAIL. **Implement** → PASS.
- [ ] **Step 3: Document** in `apps/web/AGENTS.md` and `docs/SANITY_WEBHOOK_SETUP.md`.
- [ ] **Step 4: Commit** — `feat(web): link, revalidate and list the venue page`.

---

### Task 10: Site search

**Files:**

- Modify: `apps/web/src/lib/sanity/queries/search.ts` (+ `search.test.ts`), `apps/web/src/lib/search/merge.ts` (+ `merge.test.ts`)
- Re-key: the e2e fixtures of the changed search queries in `apps/web/e2e/fixtures/sanity/`
- Modify docs: `apps/web/AGENTS.md` (Site search)

**Interfaces:**

- Consumes: `getInternalHref` for `venuePage` (Task 9).
- Produces:
  - `'venuePage'` and `'venue'` appended to `SEARCH_PAGE_TYPES` and `searchPageTypeList` (the cache tags follow, they spread `SEARCH_PAGE_TYPES`); `'venuePage'` appended to `contactPersonPageTypeList`.
  - `pageScore`: the lead term over the section intros gains `content.homeSection.intro` and `content.othersSection.intro`; both join the last catch-all term. A venue already scores through `title` and `description.text[]`. Extend the doc comment: a venue has no page of its own and leads to the venue page, like an open position to the volunteer page.
  - `searchCandidatesQuery`: `_type == 'venue' => { "targets": *[_type == 'venuePage'] { ${searchTarget} } }`.
  - `searchTextsQuery`: `_type == 'venuePage' => coalesce(content.homeSection.intro, '') + ' ' + coalesce(content.othersSection.intro, '')`.
  - `merge.ts`: `'venue'` joins `TYPES_WITHOUT_PAGE`; a venue candidate becomes a hit on the venue page with the venue title as snippet, through the same path the open position takes (generalise it rather than copy it); no hit while the venue page is not published.

- [ ] **Step 1: Write the failing tests:** `search.test.ts` — `SEARCH_PAGE_TYPES` ends with `'venuePage', 'venue'`; `searchCandidatesQuery` contains the two intro paths, the venue branch and `contactPersonPageTypeList` with `'venuePage'`; `searchTextsQuery` contains the `venuePage` branch. `merge.test.ts` — „leads a venue to the venue page with its name as snippet“; „drops a venue while the venue page is not published“ (`targets: []`); a venue page hit and a venue hit merge into one hit.
- [ ] **Step 2: Run** `pnpm --filter web test -- src/lib/sanity/queries/search.test.ts src/lib/search` → FAIL. **Implement**, `pnpm run typegen:sanity` → PASS.
- [ ] **Step 3: Check against `development`** (Sanity MCP `query_documents`, project `j4rxwl5m`, perspective `published`): the candidates query with `$q` = `"Mehrzweckhalle*"` returns the venue with a non-empty score. Record the measurement in the doc comment.
- [ ] **Step 4: Re-key the search fixtures** exactly as Task 8 Step 3 of the partner plan describes (throwaway script in the scratchpad, new key = sha256 of request path plus sorted params without `cacheMode`, `perspective`, `returnQuery`, `tag`, first 16 hex chars; `vp fmt` the new files).
- [ ] **Step 5: Run** `pnpm --filter web run test:e2e -- e2e/specs/search.spec.ts` → PASS and no „No Sanity fixture“ in the server log.
- [ ] **Step 6: Document** the page and the venue names in the Site search section of `apps/web/AGENTS.md`.
- [ ] **Step 7: Commit** — `feat(web): find the venue page in the site search`.

---

### Task 11: End-to-end, accessibility and visual baseline

**Files:**

- Create: `apps/web/e2e/specs/venues.spec.ts`
- Modify: `apps/web/e2e/specs/accessibility.spec.ts`, `apps/web/e2e/specs/visual.spec.ts`
- Add: the recorded fixture of `venuePageQuery`, the baselines `apps/web/e2e/__screenshots__/…/venues*.png`
- Modify docs: `apps/web/AGENTS.md` (Fixtures: how the venue fixture was made; Visual regression: twelve routes), root `AGENTS.md` (content types line if it lists page singletons)

**Interfaces:**

- Consumes: everything above, the script of Task 3.

- [ ] **Step 1: Seed `development` — each write only after the user's OK on the shown payload.** Deploy the schema to `development`. Patch the Pappelstübchen (`968c56f9-…`): `type: 'clubhouse'`, `features` from `CLUBHOUSE.features` of the prototype, `openingHours` from `CLUBHOUSE.hours` (`days`/`time`), and a `description` without the sentence on parties and events and without the tenant's name and phone number. Patch the Pappelstadion (`2f1440fa-…`): `features` from `STADIUM_FEATURES`, `description` cut to its first paragraph. Publish both. Run `pnpm --filter studio exec sanity exec scripts/create-venue-page.ts --with-user-token -- --dataset development`, publish `drafts.venuePage`. Production stays untouched.
- [ ] **Step 2: Record only the venue fixture.** Copy `e2e/fixtures/sanity/` away, run `pnpm --filter web run e2e:record`, keep the new file whose `query` param contains `venuePage`, restore everything else from the copy, including the hand-maintained menu fixture. Search the new fixture for `Kaiser` and `02631` → no match.
- [ ] **Step 3: Write** `venues.spec.ts`: on `/verein/sportstaetten` the `h1` reads „Sportstätten“; the `h3` „Pappelstadion“ and „Vereinsheim Pappelstübchen“ are visible; „Hallen (5)“ and „Plätze (3)“ (or the recorded counts) are visible; the chip „1. Mannschaft“ links to the group page `getInternalHref` would build; the first „Route planen“ opens the Google Maps dialog; the turf box link is `mailto:info@tsg-irlich.de?subject=Frage%20zu%20den%20Sportst%C3%A4tten%20der%20TSG%20Irlich`; the opening hours of the Pappelstübchen are visible; no „Noch kein Foto“ and no „mieten“ anywhere.
- [ ] **Step 4: Add** `'/verein/sportstaetten'` to `STATIC_ROUTES` of `accessibility.spec.ts` (after `/verein/ehrenamt`) and `{ name: 'venues', route: '/verein/sportstaetten' }` to `STATIC_ROUTES` of `visual.spec.ts` (after `volunteer`).
- [ ] **Step 5: Run** `pnpm --filter web run test:e2e` → PASS (the visual specs skip on macOS), no „No Sanity fixture“ in the log, no new axe violation, exactly one `h1`.
- [ ] **Step 6: Generate the baselines** with `pnpm --filter web run test:e2e:visual:update` (Docker). `git status` must show only new `venues` screenshots for both browser projects; restore any other changed baseline and find out why it moved. Look at both new baselines: no large blank area under the home images, the fallback image on the two halls without a photo.
- [ ] **Step 7: Run the whole gate** from the root: `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run knip`, `pnpm run test:coverage` → all pass.
- [ ] **Step 8: Commit** — `test(web): cover the venue page end to end`.

---

## After the merge

The rollout follows „Livegang“ in the spec, steps 2–7: webhook filter (staging and production, each after the user's OK), release, start content as a draft in production (name command and dataset first), content fixes in production (Pappelstübchen type, equipment, opening hours and description; Pappelstadion equipment and description; Feldkirchen street; photos for the two halls), editors review and publish, add the menu entry and fill „SEO & Teilen“, then the German Linear comment with screenshots. Afterwards the prototype branch can go. None of it belongs to this branch.
