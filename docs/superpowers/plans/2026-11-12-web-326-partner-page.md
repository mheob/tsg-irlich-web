# Sponsoren- und Partnerseite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/verein/partner`, a page that wins and thanks sponsors, with every text maintained in a new Sanity singleton `partnerPage`, and let a sponsor exist without a website.

**Architecture:** A new single page `partnerPage` in the studio (tabs Allgemein, Inhalt with four section sub-tabs, Anfragen, SEO & Teilen) and a server-rendered route `apps/web/src/app/verein/partner` that reads it plus the sponsors through one `client.fetch` query, like `/mitgliedschaft`. The icon choice is a shared value list in `@tsgi-web/shared` that the studio offers and the web maps to Lucide components. The page joins the usual wiring: desk, internal link target, path resolver, revalidation, sitemap, site search, axe sweep, visual baseline.

**Tech Stack:** Sanity Studio 6 (`defineType`/`defineField`), Next.js 16 App Router, Tailwind, Base UI wrappers, Lucide icons, Vitest via `vp test`, Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-11-12-web-326-partner-page-design.md` (German). Read it before Task 1; the decisions there are binding. The prototype it builds on lives on `origin/feat/web-326-sponsor-page-prototype` (`git show origin/feat/web-326-sponsor-page-prototype:apps/web/src/app/verein/sponsoren-prototyp/<file>`), files `_shared/content.ts`, `_shared/data.ts`, `_shared/sponsor-logo.tsx`, `_variants/variant-a.tsx`, `_variants/variant-b.tsx`.

**Branch:** `feat/web-326-partner-page` from `next`.

## Global Constraints

- Shell: prefix every `pnpm`/`node`/`vp` command with `export PATH="$HOME/.local/share/vite-plus/bin:$PATH";`.
- Commits go through the `create-commit` skill (Conventional Commits, scope `studio`, `web` or `shared`), no co-author trailer. Run `pnpm run format:check` before each commit.
- Route `/verein/partner`. Document type and id `partnerPage`, hidden fixed slug `partner`, studio title „Sponsoren & Partner“, icon of its own from `react-icons/ri`.
- Inquiry e-mail initial value `partner@tsg-irlich.de`; subject initial value „Sponsoring bei der TSG Irlich“. A card button under „So kannst du uns unterstützen“ uses the subject `<subject>: <card title>`; every other button uses the subject as it is.
- No prices anywhere.
- Every visible text of the page comes from `partnerPage`, except screen-reader hints such as „(öffnet in neuem Fenster)“ and the shared `Newsletter`.
- Card arrays (reasons, ways) warn, never error, when their length is not 4: „Das Raster ist für 4 Karten gebaut.“
- Sponsors sorted by `name asc`. A sponsor link carries `rel="sponsored"` (through `ExternalLink`, which adds `noopener noreferrer` and `target="_blank"`).
- Logos are grey at rest (`grayscale` plus reduced opacity) and in colour on hover and on keyboard focus. A tile without website also turns colour on hover but neither lifts nor is focusable.
- All studio titles, descriptions and validation messages in German. Web code: function declarations, named exports, `Readonly<…>` props, interfaces at file end, no `try`/`catch` in components, test imports from `vite-plus/test`.
- Coverage thresholds in every `vitest.config.ts` must still pass (`pnpm run test:coverage`); raise none, lower none.
- After any schema change: `pnpm run extract-types && pnpm run typegen:sanity` from the repository root.

## Review Focus

1. A section whose card array is empty (editor removed every card) — the whole section is left out, never an empty grid under a heading. Tests in Task 4.
2. A sponsor whose logo has no asset (document written through the API) — the tile shows the sponsor's name in place of the logo, never an empty box. Test in Task 5.
3. A card title or subject with `&`, `?`, `#` or umlauts — the `mailto:` subject is percent-encoded and the address stays intact. Test in Task 4.
4. A sponsor website with `www.`, capitals or a path — the tile shows the bare lowercase host (`https://www.Example.de/pfad` → `example.de`). Test in Task 5.
5. A contact person reference that no longer resolves (`null` in `contactPersons[]->`) — it is dropped before `ContactPersons` renders. Test in Task 6.

---

### Task 1: Sponsor without website

**Files:**

- Modify: `apps/studio/schemas/documents/sponsors.ts`
- Create: `apps/studio/schemas/documents/sponsors.test.ts`
- Modify: `apps/web/src/components/ui/sponsor-link.tsx` (doc comment only)
- Regenerate: `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`

**Interfaces:**

- Produces: `sponsors.website` is optional (`string | undefined` in the generated types).

- [ ] **Step 1: Write the failing test** `sponsors.test.ts`. Run the `website` validation against a fake rule that records the names and arguments of the calls it receives, the way `recordValidationChain` in `schemas/documents/department.test.ts` does (copy the helper; it is local to that file):

```ts
describe('sponsors', () => {
	it('lets a sponsor go without a website', () => {
		expect(recordedCallNames(field('website'))).not.toContain('required');
	});
	it('still only accepts http and https addresses', () => {
		expect(recordedCalls(field('website'))).toContainEqual({
			args: [{ scheme: ['http', 'https'] }],
			name: 'uri',
		});
	});
	it('says what happens without a website', () => {
		expect(field('website').description).toBe(
			'Die Website des Sponsors. Ohne Website erscheint das Logo ohne Link.',
		);
	});
});
```

- [ ] **Step 2: Run it and see it fail:** `pnpm --filter studio test -- schemas/documents/sponsors.test.ts` → FAIL on the first and third case.
- [ ] **Step 3: Drop the required rule and update the description** in `sponsors.ts`; in `SponsorLink` change „where it is a required field“ to say the website is optional.
- [ ] **Step 4: Run the test** → PASS. Then `pnpm run extract-types && pnpm run typegen:sanity` and `pnpm run typecheck` → no errors (home and article sponsors already handle a missing website).
- [ ] **Step 5: Commit** — `feat(studio): allow a sponsor without website`.

---

### Task 2: The `partnerPage` schema and its place in the studio

**Files:**

- Create: `packages/shared/src/partner-icons.ts`, `packages/shared/src/partner-icons.test.ts`
- Create: `apps/studio/schemas/single-pages/partner-page/index.ts`, `…/partner-page/_groups.ts`, `…/partner-page/sections.ts`, `…/partner-page/index.test.ts`
- Modify: `apps/studio/schemas/single-pages/index.ts`, `apps/studio/structure/pages.ts`, `apps/studio/schemas/objects/internal-link.ts`
- Modify tests: `apps/studio/structure/pages.test.ts`, `apps/studio/structure/sections.test.ts`, `apps/studio/schemas/single-pages/hero-image.test.ts`, `apps/studio/schemas/single-pages/search.test.ts`, `apps/studio/schemas/objects/internal-link.test.ts`
- Modify docs: `apps/studio/AGENTS.md` (new section „Partner page“, desk paragraph)
- Regenerate: `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`

**Interfaces:**

- Produces `@tsgi-web/shared/partner-icons`:
  - `PARTNER_ICONS: readonly { title: string; value: string }[]` (`as const`), values kebab-case Lucide names: `map-pin` Ort, `trending-up` Reichweite, `heart-handshake` Engagement, `handshake` Partnerschaft, `shirt` Trikot, `fence` Bande, `globe` Website, `gift` Geschenk, `trophy` Pokal, `megaphone` Megafon, `users` Gruppe, `heart` Herz, `star` Stern.
  - `type PartnerIconName = (typeof PARTNER_ICONS)[number]['value']`.
- Produces the document shape every later task reads (field names are binding):

```
partnerPage
  slug            hidden, initial { current: 'partner' }, readOnly      (tab general)
  title, subtitle defaultHeroFields                                     (tab general)
  heroImage       getHeroImageField(LANDSCAPE_HERO_DESCRIPTION)          (tab general)
  content         object, required                                      (tab content, sub-tabs below)
    whySection          group why „Gründe“
      title, subtitle, intro         getDefaultPageSectionFieldsWithGroup()
      reasons[]  partnerReason { title string req, text text req, icon string req (options.list PARTNER_ICONS) }
    waysSection         group ways „Unterstützung“
      title, subtitle, intro
      ways[]     partnerWay { title string req, text text req, benefits string[] optional, icon req, cta string req }
      ideaText   string optional („Du hast eine eigene Idee? …“)
      ideaCta    string optional („Jetzt Kontakt aufnehmen“)
    partnersSection     group partners „Partner“
      title, subtitle, intro
      ownLogoText string optional („Dein Logo hier?“)
    contactPersonsSection   contactPersonsSectionField (group contactPersons „Ansprechpartner“)
  inquiry         object, required                                      (tab inquiry „Anfragen“)
    email    type email, required, initial 'partner@tsg-irlich.de'
    subject  string, required, initial 'Sponsoring bei der TSG Irlich'
  meta            metaField                                             (tab meta)
groups: [general, content, inquiry, meta]; preview getSinglePagePreview('Sponsoren & Partner')
```

The text limits of the card fields mirror `featuresField` in `schemas/single-pages/home/features.tsx` (title warning above 65, text warning above 160). `reasons` and `ways` carry `Rule.custom` returning the warning text of the Global Constraints when `length !== 4` (and `true` for a missing array, so required rules decide).

- [ ] **Step 1: Write the failing shared test** `partner-icons.test.ts`: every `value` is unique and matches `/^[a-z]+(?:-[a-z]+)*$/u`; every `title` is non-empty; the list contains the eight prototype icons `map-pin`, `trending-up`, `heart-handshake`, `handshake`, `shirt`, `fence`, `globe`, `gift`.
- [ ] **Step 2: Run** `pnpm --filter @tsgi-web/shared test -- src/partner-icons.test.ts` → FAIL (module missing). **Implement** `partner-icons.ts` → PASS.
- [ ] **Step 3: Write the failing schema test** `partner-page/index.test.ts` in the style of `echo-overview.test.ts`:

```ts
it('fixes its slug to partner', () => {
	expect(field('slug')).toMatchObject({ initialValue: { current: 'partner' }, readOnly: true });
});
it('lists its tabs as Allgemein, Inhalt, Anfragen, SEO & Teilen', () => {
	expect(partnerPage.groups.map(({ name }) => name)).toStrictEqual([
		'general',
		'content',
		'inquiry',
		'meta',
	]);
});
it('presets the inquiry address and subject', () => {
	expect(inquiryField('email')).toMatchObject({
		initialValue: 'partner@tsg-irlich.de',
		type: 'email',
	});
	expect(inquiryField('subject')).toMatchObject({ initialValue: 'Sponsoring bei der TSG Irlich' });
});
it.each(['reasons', 'ways'])('warns when %s does not hold four cards', (name) => {
	const check = cardsValidation(name); // the Rule.custom predicate, captured with a fake rule
	expect(check([{}, {}, {}])).toBe('Das Raster ist für 4 Karten gebaut.');
	expect(check([{}, {}, {}, {}])).toBe(true);
	expect(check(undefined)).toBe(true);
});
it('offers the shared icon list on every card', () => {
	expect(cardField('reasons', 'icon').options.list).toStrictEqual(PARTNER_ICONS);
	expect(cardField('ways', 'icon').options.list).toStrictEqual(PARTNER_ICONS);
});
it('shows a fixed title in lists', () => {
	expect(partnerPage.preview.prepare()).toStrictEqual({ title: 'Sponsoren & Partner' });
});
```

- [ ] **Step 4: Extend the existing tests** so they fail until the page is wired: `pages.test.ts` expects `findSinglePage('partnerPage')` to equal `{ parent: 'aboutUs', path: '/verein/partner' }` and `getPlacedPages().slice(1, 4)` to equal `['aboutUs', 'echoOverview', 'partnerPage']`; add `partnerPage` to the page lists in `sections.test.ts`, `hero-image.test.ts` (`LANDSCAPE_HERO_DESCRIPTION`), `search.test.ts` (`PAGES`) and `internal-link.test.ts` (`toContainEqual({ type: 'partnerPage' })`).
- [ ] **Step 5: Run** `pnpm --filter studio test` → the new and extended cases FAIL.
- [ ] **Step 6: Implement** the schema (`index.ts` assembles, `sections.ts` holds the four section fields, `_groups.ts` the sub-tabs), register it in `schemas/single-pages/index.ts`, add `'partnerPage'` to `SinglePageType`, `SINGLE_PAGES` (`{ parent: 'aboutUs', path: '/verein/partner' }`) and `PAGE_LAYOUT` club `pages: ['echoOverview', 'partnerPage']`, and `{ type: 'partnerPage' }` after `echoOverview` in `INTERNAL_LINK_TARGETS`.
- [ ] **Step 7: Run** `pnpm --filter studio test` → PASS, including `schemas/groups.test.ts`. Then `pnpm run extract-types && pnpm run typegen:sanity` and `pnpm run typecheck` → no errors.
- [ ] **Step 8: Document** the page in `apps/studio/AGENTS.md`: a short section „Partner page“ (what it holds, fixed slug, internal link target, icon list in `@tsgi-web/shared/partner-icons`, warning at ≠ 4 cards, no preview on purpose) and the club area of the desk paragraph.
- [ ] **Step 9: Commit** — `feat(studio): add the partner page singleton`.

---

### Task 3: Start content script

**Files:**

- Create: `apps/studio/scripts/create-partner-page.ts`
- Create: `apps/studio/scripts/create-partner-page/start-content.ts`, `…/start-content.test.ts`
- Modify: `apps/studio/AGENTS.md` (directory map line for `scripts`, run instructions in „Partner page“)

**Interfaces:**

- Consumes: the document shape of Task 2.
- Produces:
  - `buildStartContent(heroImage: SanityImageObject | undefined): PartnerPageDraft` — returns `{ _id: 'drafts.partnerPage', _type: 'partnerPage', … }` with every text copied verbatim from the prototype's `_shared/content.ts` (`HERO`, `WHY`, `REASONS`, `WAYS_SECTION`, `WAYS`, `PARTNERS`, `CONTACT`), `ideaText` „Du hast eine eigene Idee? Wir schnüren gern ein individuelles Paket.“, `ideaCta` „Jetzt Kontakt aufnehmen“, `ownLogoText` „Dein Logo hier?“, card buttons „Anfragen“, the icons as kebab-case values (`MapPin` → `map-pin`, …), the inquiry presets, slug `partner`, contact persons as strong references with `_key` to `b9c684aa-f914-4c32-8619-fde519d41315`, `62de97e4-4c14-4336-89f0-615645b28053`, `7ba77a4c-f4f1-45ca-9b7a-bd8eac97b9e1` in that order, and `heroImage` as given (omitted when `undefined`).
  - `readDataset(argv: readonly string[]): string` — like the one in `create-e2e-form/e2e-form.ts`, but `production` is allowed.
- The script: reads `--dataset`, fetches the ids `partnerPage` and `drafts.partnerPage`; if either exists it prints „Die Partnerseite existiert schon in <dataset>, nichts geschrieben.“ and exits 0; otherwise it reads `*[_id == 'aboutUs'][0].heroImage`, `client.create(buildStartContent(heroImage))` and prints project, dataset, id and revision. It never publishes and never overwrites.

- [ ] **Step 1: Write the failing test** `start-content.test.ts`: the id is `drafts.partnerPage`; four reasons and four ways with the titles of the prototype in order (`Regionale Sichtbarkeit`, `Reichweite online`, `Positives Image`, `Langfristige Partnerschaft` / `Trikotwerbung`, `Bandenwerbung`, `Online-Partner`, `Sachspenden`); every icon value is in `PARTNER_ICONS`; every array item has a unique `_key`; the three contact references in order; `inquiry` equals the presets; `heroImage` is absent when called with `undefined`; `readDataset(['--', '--dataset', 'production'])` returns `'production'` and `readDataset([])` throws „--dataset fehlt, z. B. --dataset development.“.
- [ ] **Step 2: Run** `pnpm --filter studio test -- scripts/create-partner-page` → FAIL. **Implement** → PASS.
- [ ] **Step 3: Document** the command in `apps/studio/AGENTS.md`: `pnpm --filter studio exec sanity exec scripts/create-partner-page.ts --with-user-token -- --dataset <dataset>`.
- [ ] **Step 4: Commit** — `feat(studio): add a script for the partner page start content`.

---

### Task 4: Query, helpers and the sections „Warum“ and „Unterstützung“

**Files:**

- Create: `apps/web/src/lib/sanity/queries/pages/partner.ts`
- Create: `apps/web/src/app/verein/partner/_shared/types.ts`
- Create: `apps/web/src/app/verein/partner/_shared/partner-icon.tsx` (+ test), `…/_shared/mail.ts` (+ test)
- Create: `apps/web/src/app/verein/partner/_sections/reasons.tsx` (+ test), `…/_sections/ways.tsx` (+ test)
- Regenerate: `apps/web/src/types/sanity.types.generated.ts`

**Interfaces:**

- Produces `partnerPageQuery` (`defineQuery`, result type `PartnerPageQueryResult`):

```groq
{
	"partnerPage": *[_type == 'partnerPage'][0] {
		...,
		content {
			...,
			contactPersonsSection { ..., contactPersons[]-> { ${contactPersons} } }
		}
	},
	"sponsors": *[_type == 'sponsors'] { _id, name, website, logo } | order(name asc)
}
```

- Produces in `_shared/types.ts`, all derived from `PartnerPageQueryResult` so they follow the typegen: `PartnerPage = NonNullable<PartnerPageQueryResult['partnerPage']>`, `ReasonsSection = PartnerPage['content']['whySection']`, `WaysSection = PartnerPage['content']['waysSection']`, `PartnersSection = PartnerPage['content']['partnersSection']`, `Inquiry = PartnerPage['inquiry']`, `Sponsor = PartnerPageQueryResult['sponsors'][number]`. Every later task uses these names.
- Produces `PartnerIcon({ icon, ...props }: Readonly<LucideProps & { icon?: null | string }>): ReactElement | null` — maps every `PartnerIconName` to its Lucide component through a `Record<PartnerIconName, LucideIcon>` (so a new list value without a component fails `typecheck`); unknown or missing value → `null`.
- Produces `getMailHref(inquiry: Inquiry, topic?: string): string` → `mailto:<email>?subject=<encodeURIComponent(topic ? `${subject}: ${topic}` : subject)>`.
- Produces `Reasons(props: Readonly<ReasonsSection>)` and `Ways(props: Readonly<WaysSection & { inquiry: Inquiry }>)`. Markup follows the prototype's variant A (reasons: home feature cards; ways: `pricing.module.css` blue band, cards with icon tile, benefits with `CircleCheck`, `ButtonLink fullWidth` to `getMailHref(inquiry, way.title)`, then `ideaText` and a secondary `ButtonLink` to `getMailHref(inquiry)`).

- [ ] **Step 1: Write the failing tests:**

```ts
// mail.test.ts
expect(getMailHref({ email: 'partner@tsg-irlich.de', subject: 'Sponsoring bei der TSG Irlich' }))
	.toBe('mailto:partner@tsg-irlich.de?subject=Sponsoring%20bei%20der%20TSG%20Irlich');
expect(getMailHref({ email: 'partner@tsg-irlich.de', subject: 'Sponsoring bei der TSG Irlich' }, 'Trikot & Bande?'))
	.toBe('mailto:partner@tsg-irlich.de?subject=Sponsoring%20bei%20der%20TSG%20Irlich%3A%20Trikot%20%26%20Bande%3F');

// partner-icon.test.tsx
it.each(PARTNER_ICONS.map(({ value }) => value))('draws an icon for %s', (icon) => { /* renders an <svg> */ });
it('draws nothing for an unknown or missing icon', () => { /* 'unbekannt' and undefined render nothing */ });

// reasons.test.tsx / ways.test.tsx (dom project)
it('shows the section header and one card per entry', …);           // headings from props
it('leaves the whole section out without cards', …);                // reasons: [] → container empty
it('links each card button to a mail with the card title', …);      // ways: href = getMailHref(inquiry, 'Trikotwerbung')
it('lists the benefits of a card and omits the list without any', …);
it('shows the own-idea line and button only when both texts are set', …);
```

- [ ] **Step 2: Run** `pnpm --filter web test -- src/app/verein/partner` → FAIL.
- [ ] **Step 3: Write the query, run** `pnpm run typegen:sanity` **and implement** the helpers and both sections.
- [ ] **Step 4: Run the tests** → PASS; `pnpm --filter web run typecheck` → no errors.
- [ ] **Step 5: Commit** — `feat(web): add the reasons and ways of the partner page`.

---

### Task 5: Partner tiles

**Files:**

- Create: `apps/web/src/app/verein/partner/_shared/sponsor-logo.tsx` (from the prototype, + test), `…/_shared/hostname.ts` (+ test)
- Create: `apps/web/src/app/verein/partner/_sections/sponsor-tile.tsx` (+ test), `…/_sections/partners.tsx` (+ test)

**Interfaces:**

- Consumes: `Sponsor`, `PartnersSection`, `Inquiry` and `getMailHref` (Task 4).
- Produces:
  - `getHostname(url?: null | string): string | undefined` — lowercase host without leading `www.`, `undefined` for a missing or unparseable URL.
  - `SponsorLogo({ className, sponsor })` — the logo `object-contain` in a `fill` box via `urlForImageMax`, or the name in `font-serif` when the logo has no asset.
  - `SponsorTile({ sponsor }: Readonly<{ sponsor: Sponsor }>)` — with a website: `ExternalLink` (`rel="sponsored"`, class `group`, lifts on hover), logo box, name, host, `ExternalLinkIcon`, `sr-only` „(öffnet in neuem Fenster)“; without: a non-interactive `div` with logo box and name only. In both, the logo is `grayscale opacity-70` and turns colour on `group-hover` and (link only) `group-focus-visible`.
  - `Partners({ inquiry, section, sponsors }: Readonly<{ inquiry: Inquiry; section: PartnersSection; sponsors: Sponsor[] }>)` — section header, `ul` of tiles in the light section of variant A (grid as in variant B: `grid-cols-2 … lg:grid-cols-4`), then the dashed „Dein Logo hier?“ tile (`ownLogoText`) linking to `getMailHref(inquiry)`. Left out entirely when there is neither a sponsor nor `ownLogoText`.

- [ ] **Step 1: Write the failing tests:**

```ts
// hostname.test.ts
expect(getHostname('https://www.Example.de/pfad')).toBe('example.de');
expect(getHostname('https://swn-neuwied.de')).toBe('swn-neuwied.de');
expect(getHostname('kein link')).toBeUndefined();
expect(getHostname(null)).toBeUndefined();

// sponsor-tile.test.tsx
it('links a sponsor with a website as sponsored, in a new window', …);   // rel contains 'sponsored', target '_blank', host 'rewe-mueller.de' visible
it('shows a sponsor without a website without a link, host or icon', …); // no <a>, no host text, no svg icon
it('shows the name where the logo has no file', …);                       // logo: { _type: 'image' } → name text in the logo box
it('greys the logo until hover or focus', …);                             // class list contains 'grayscale' and 'group-hover:grayscale-0'

// partners.test.tsx
it('lists the sponsors in the order given and ends with the own-logo tile', …);
it('links the own-logo tile to the inquiry mail', …);                     // href = getMailHref(inquiry)
it('leaves the section out without sponsors and without an own-logo text', …);
```

- [ ] **Step 2: Run** `pnpm --filter web test -- src/app/verein/partner` → new cases FAIL. **Implement** → PASS.
- [ ] **Step 3: Commit** — `feat(web): add the partner tiles`.

---

### Task 6: The page `/verein/partner`

**Files:**

- Create: `apps/web/src/app/verein/partner/page.tsx`, `apps/web/src/app/verein/partner/page.test.ts`

**Interfaces:**

- Consumes: Tasks 4 and 5.
- Produces: default export `PartnerPage()` and `generateMetadata()`. Reads `client.fetch<PartnerPageQueryResult>(partnerPageQuery)`; without `partnerPage` → `notFound()` (page) or `{}` (metadata). Renders `Hero` (`getPageHeroImage(heroImage, title)`, `subTitle`, `title`), `Reasons`, `Ways`, `Partners`, `ContactPersons` (with `contactPersons` filtered of `null`), `Newsletter`. Metadata through `getPageMetadata({ image: heroImage, meta, path: '/verein/partner', title })`.

- [ ] **Step 1: Write the failing test** `page.test.ts` after `apps/web/src/app/mitgliedschaft/page.test.ts`: `itFollowsTheMetadataContract` with `path: '/verein/partner'`, `title: 'Sponsoren & Partner'`, `missingDocument: { partnerPage: null, sponsors: [] }`; „answers 404 without a published page“; „renders the sections in the order of variant A“ (`findElement` for `Hero`, `Reasons`, `Ways`, `Partners`, `ContactPersons`, `Newsletter`, in that order); „drops a contact person that no longer resolves“ (`[person, null]` → `ContactPersons` gets `[person]`).
- [ ] **Step 2: Run** `pnpm --filter web test -- src/app/verein/partner/page.test.ts` → FAIL. **Implement** → PASS.
- [ ] **Step 3: Run** `pnpm --filter web test -- src/instrumentation-client.test.ts` → PASS (`/verein/*` already covers the newsletter).
- [ ] **Step 4: Commit** — `feat(web): add the partner page`.

---

### Task 7: Links, revalidation and sitemap

**Files:**

- Modify: `apps/web/src/utils/links.ts` (+ `links.test.ts`)
- Modify: `apps/web/src/app/api/revalidate/route.ts` (+ `route.test.ts`)
- Modify: `apps/web/src/app/sitemap.ts` (+ `sitemap.test.ts`)
- Modify docs: `apps/web/AGENTS.md` (revalidation paragraph, internal links), `docs/SANITY_WEBHOOK_SETUP.md` (`partnerPage` in the type filter of both live webhooks)

**Interfaces:**

- Produces: `getInternalHref({ _type: 'partnerPage', slug: 'partner' }) === '/verein/partner'` through a `PARTNER_PAGE_TYPE` entry in `PATH_RESOLVERS`; `REVALIDATION_MAP.partnerPage` revalidates `/verein/partner`; `REVALIDATION_MAP.sponsors` additionally revalidates `/verein/partner`; the sitemap lists `${baseUrl}/verein/partner` (`changeFrequency: 'monthly'`, `priority: 0.6`) right after `/verein`, unconditionally.

- [ ] **Step 1: Write the failing tests:** `links.test.ts` — `expect(getInternalHref({ _type: 'partnerPage', slug: 'partner' })).toBe('/verein/partner')`; `route.test.ts` table rows `['partnerPage', ['/verein/partner']]` and the `sponsors` row extended by `'/verein/partner'`; `sitemap.test.ts` — the entry exists with the values above.
- [ ] **Step 2: Run** `pnpm --filter web test -- src/utils/links.test.ts src/app/api/revalidate src/app/sitemap.test.ts` → FAIL. **Implement** → PASS.
- [ ] **Step 3: Document** in `apps/web/AGENTS.md` and `docs/SANITY_WEBHOOK_SETUP.md`.
- [ ] **Step 4: Commit** — `feat(web): link, revalidate and list the partner page`.

---

### Task 8: Site search

**Files:**

- Modify: `apps/web/src/lib/sanity/queries/search.ts` (+ `search.test.ts`)
- Re-key: the e2e fixtures of the changed search queries in `apps/web/e2e/fixtures/sanity/`
- Modify docs: `apps/web/AGENTS.md` (Site search)

**Interfaces:**

- Consumes: `getInternalHref` for `partnerPage` (Task 7).
- Produces: `'partnerPage'` appended to `SEARCH_PAGE_TYPES`, to `searchPageTypeList` and to `contactPersonPageTypeList`. In `pageScore`: a lead term `boost([content.whySection.intro, content.waysSection.intro, content.partnersSection.intro] match text::query($q), ${WEIGHTS.lead})` and a body term over `content.whySection.reasons[].title`, `content.whySection.reasons[].text`, `content.waysSection.ways[].title`, `content.waysSection.ways[].text`, `content.waysSection.ways[].benefits[]`; the same eight paths join the catch-all array of the last term. In `searchTextsQuery`: `_type == 'partnerPage' => coalesce(content.whySection.intro, '') + ' ' + coalesce(content.waysSection.intro, '')`. Sponsor names are not searched.

- [ ] **Step 1: Write the failing tests** in `search.test.ts`: the `SEARCH_PAGE_TYPES` list ends with `'partnerPage'`; `searchCandidatesQuery` contains both new terms (string match like the existing weight table) and `contactPersonPageTypeList` with `'partnerPage'`; `searchTextsQuery` contains the `partnerPage` select branch.
- [ ] **Step 2: Run** `pnpm --filter web test -- src/lib/sanity/queries/search.test.ts src/lib/search` → FAIL. **Implement**, `pnpm run typegen:sanity` → PASS.
- [ ] **Step 3: Re-key the search fixtures.** The query text changed, so every fixture of `searchCandidatesQuery` and `searchTextsQuery` is orphaned. With a throwaway Node script in the scratchpad: find fixtures whose `query` param holds the old text, replace it with the new literal from `sanity.types.generated.ts`, write each under its new key (sha256 of request path plus sorted params without `cacheMode`, `perspective`, `returnQuery`, `tag`, first 16 hex chars), delete the old file, `vp fmt` the new ones. The result bodies stay as recorded: the dataset of the recording held no `partnerPage`.
- [ ] **Step 4: Run** `pnpm --filter web run test:e2e -- e2e/specs/search.spec.ts` → PASS and no „No Sanity fixture“ in the server log.
- [ ] **Step 5: Document** the new page type in the Site search section of `apps/web/AGENTS.md`.
- [ ] **Step 6: Commit** — `feat(web): find the partner page in the site search`.

---

### Task 9: End-to-end, accessibility and visual baseline

**Files:**

- Create: `apps/web/e2e/specs/partner.spec.ts`
- Modify: `apps/web/e2e/specs/accessibility.spec.ts`, `apps/web/e2e/specs/visual.spec.ts`
- Add: the recorded fixtures of `partnerPageQuery`, the baselines `apps/web/e2e/__screenshots__/…/partner*.png`
- Modify docs: `apps/web/AGENTS.md` (Fixtures: how the partner fixtures were made)

**Interfaces:**

- Consumes: everything above, the script of Task 3.

- [ ] **Step 1: Seed `development`.** `pnpm --filter studio exec sanity exec scripts/create-partner-page.ts --with-user-token -- --dataset development`, then publish `drafts.partnerPage` in `development` (studio or Sanity MCP `publish_documents`, project `j4rxwl5m`). In `development` only, give the e2e a sponsor without website: on sponsor „Ingo Jahn“ set `name` to „Ingo Jann“ and unset `website`, published. Production stays untouched.
- [ ] **Step 2: Record only the partner fixtures.** Copy `e2e/fixtures/sanity/` away, run `pnpm --filter web run e2e:record`, keep the new files whose `query` param contains `partnerPage` (and none of the search fixtures, which Task 8 re-keyed), restore everything else from the copy, including the hand-maintained menu fixture.
- [ ] **Step 3: Write** `partner.spec.ts`: on `/verein/partner` the `h1` reads „Sponsoren & Partner“; the four reason and four way headings from the fixture are visible; a tile link of a sponsor with website has `rel` containing `sponsored` and `target="_blank"`; the tile „Ingo Jann“ contains no link; the first „Anfragen“ button's `href` is `mailto:partner@tsg-irlich.de?subject=Sponsoring%20bei%20der%20TSG%20Irlich%3A%20Trikotwerbung`; the own-logo tile links to `mailto:partner@tsg-irlich.de?subject=Sponsoring%20bei%20der%20TSG%20Irlich`.
- [ ] **Step 4: Add** `'/verein/partner'` to `STATIC_ROUTES` of `accessibility.spec.ts` (after `/verein/echo`) and `{ name: 'partner', route: '/verein/partner' }` to `STATIC_ROUTES` of `visual.spec.ts` (after `echo`).
- [ ] **Step 5: Run** `pnpm --filter web run test:e2e` → PASS (the visual specs skip on macOS), no „No Sanity fixture“ in the log, no new axe violation.
- [ ] **Step 6: Generate the baselines** with `pnpm --filter web run test:e2e:visual:update` (Docker). `git status` must show only new `partner` screenshots for both browser projects; restore any other changed baseline and find out why it moved.
- [ ] **Step 7: Run the whole gate** from the root: `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run knip`, `pnpm run test:coverage` → all pass.
- [ ] **Step 8: Commit** — `test(web): cover the partner page end to end`.

---

## After the merge

The rollout follows „Livegang“ in the spec, steps 2–8: webhook filters (staging and production, each after the user's OK), release, start content as a draft in production (name command and dataset first), editors publish and add the menu entry and fix „Ingo Jahn“, the follow-up PR for `/verein/unsere-starken-partner`, the German Linear comment with screenshots. None of it belongs to this branch.
