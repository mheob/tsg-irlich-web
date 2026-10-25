# Abteilungen und Gruppen im Studio pflegbar (WEB-384) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Departments become `department` documents, the six `group.*` types plus `group.admin` become one `group` type referencing its department, and the website reads departments and groups only from Sanity, including redirects after slug changes and preview in the presentation tool.

**Architecture:** Studio code is written first: schemas, slug-history publish action and desk. The web app is rebuilt on the new shape after one typegen. Department and group pages switch to `sanityFetch`, overviews, sitemap and `llms.txt` keep `client.fetch`. A `sanity exec` script migrates each dataset. Runbook tasks at the end migrate `development`, then `production`, around the deployments while the revalidation webhook of that environment is paused.

**Tech Stack:** Sanity Studio v4 (`defineType`, structure builder, document actions, `sanity exec`), Next.js 16 App Router, next-sanity (`defineQuery`, `sanityFetch`), Vitest via `vp test`, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-25-departments-in-studio-design.md` (read it before Task 1; this plan only adds the decisions the spec leaves open).

**Branch:** `feat/web-384-departments-in-studio` (GitButler: `but branch new feat/web-384-departments-in-studio`). Commits go through the `create-commit` skill; run `pnpm run format:check` at the root before every `but commit`.

## Global Constraints

- Every studio `title` and `description` is German; code, comments and test names are English.
- Schemas: `defineType` / `defineField` / `defineArrayMember` from `sanity`, one schema per file, `export default`, registered in `apps/studio/schemas/index.ts`. Icons from `react-icons/ri`.
- Web: function declarations for components, named exports, no `try`/`catch`/`finally` in components or hooks (use `settle()` from `@tsgi-web/shared`).
- Tests import `describe`/`it`/`expect`/`vi` from `vite-plus/test` and assert what a user observes (role, name, text, href), never class names or `data-testid`.
- After any schema change that the web app reads, run `pnpm run extract-types && pnpm run typegen:sanity` from the root. Tasks 1–5 deliberately do **not** run it; Task 6 does, once. From Task 6 to Task 9 the web typecheck may fail in files a later task rewrites; each task runs its own tests and the studio checks. The whole repository has to be green again at the end of Task 10.
- Coverage thresholds in every `vitest.config.ts` stay where they are or go up.
- **Every write to a Sanity dataset and every change to a webhook needs an explicit OK from the user in chat first.** Show the command or payload, wait for the yes.
- Department titles, slugs, icons and order come from today's `groupSections` (`apps/web/src/utils/groups.ts`): Fußball `fussball` `Fussball`, Kinderturnen `kinderturnen` `Turnen`, Kurse `kurse` `StepAerobic`, Taekwondo `taekwondo` `Taekwondo`, Tanzen `tanzen` `Tanzen`, Weitere Sportarten `weitere-sportarten` `Fitness`.
- Field copy fixed by the spec: `previousSlugs` „Frühere Slugs“, `previousPaths` „Frühere Adressen“, both described „Wird beim Veröffentlichen automatisch gefüllt. Nach einer Veröffentlichung über einen Release hier den alten Wert von Hand eintragen.“; `isTeamSport` „Mannschaftssport“ / „Gruppen dieser Abteilung sind Mannschaften (im JSON-LD `SportsTeam`).“; group `department` „Abteilung“ / „Unter welcher Abteilung die Gruppe auf der Website erscheint.“; affiliation warning „Die Gruppe gehört nicht zur gewählten Abteilung.“

## Review Focus

1. **A group whose department has no slug or is unpublished.** `getInternalHref` returns `undefined`, the sitemap and `llms.txt` skip it, its page answers 404. No link to `/angebot/undefined/…` anywhere. Tests: Task 6 (links), Task 10 (sitemap/llms).
2. **A department with no groups, no stats, no contact persons, no intro.** Its page renders without an empty stats band or contact block, and the groups section falls back to the `groupsPage` intro. Test: Task 8.
3. **A slug that is current for one department and historic for another.** The current owner wins and nothing redirects, so no redirect loops. Tests: Task 8 (department), Task 9 (group).
4. **Publishing a never-published document, or one whose slug did not change.** No history entry, no duplicates, the current value never lands in its own history. Test: Task 3.
5. **An image field without an asset** (card image removed in a draft, migrated image missing). The card and hero fall back to the bundled offer image instead of rendering a broken `<img>`. Test: Task 7.

---

### Task 1: `department` document type and shared DOSB icon field

**Files:**

- Create: `apps/studio/shared/fields/dosb-icon.tsx`
- Create: `apps/studio/shared/fields/slug-history.ts`
- Create: `apps/studio/schemas/documents/department.ts`
- Create: `apps/studio/schemas/documents/department.test.ts`
- Modify: `apps/studio/schemas/index.ts` (register `department` next to the groups)
- Modify: `apps/studio/schemas/single-pages/groups/index.ts`, `apps/studio/schemas/single-pages/groups/_groups.ts` (drop `statsField` and the `stats` field group)
- Modify: `AGENTS.md` (root, "Content types": add departments)

**Interfaces:**

- Produces: `dosbIconField` (a `defineField` named `icon`, `type: 'string'`, list from `DOSB_ICONS`, required, field component with the DOSB description copied from `utils/documents/group.tsx`, which Task 2 deletes).
- Produces: `previousSlugsField` (`name: 'previousSlugs'`, array of `string`) and `previousPathsField` (`name: 'previousPaths'`, array of `string`), German copy from Global Constraints.
- Produces: schema type `department` with fields exactly as the spec table ("Dokumenttyp `department`"); `stats` is `array` of `stats` with `Rule.max(4)` and no minimum, `contactPersons` is `array` of `reference` to `person` with `Rule.unique()`.
- Produces: `prepareDepartmentPreview({ media, sortOrder, title }: { media?: unknown; sortOrder?: number; title?: string }): { media?: unknown; subtitle: string; title?: string }` exported from `department.ts`.

- [ ] **Step 1: Write the failing test** `apps/studio/schemas/documents/department.test.ts`

```ts
describe('department document', () => {
	it('names its type department', () => {
		expect(department.name).toBe('department');
	});

	it('requires a card image but leaves hero image and stats optional', () => {
		const fieldNames = department.fields.map((field) => field.name);
		expect(fieldNames).toEqual(
			expect.arrayContaining([
				'title',
				'slug',
				'previousSlugs',
				'icon',
				'sortOrder',
				'isTeamSport',
				'cardImage',
				'heroImage',
				'intro',
				'meta',
				'stats',
				'contactPersons',
			]),
		);
	});

	it('shows the sort order as preview subtitle', () => {
		expect(prepareDepartmentPreview({ sortOrder: 10, title: 'Fußball' })).toEqual({
			media: undefined,
			subtitle: 'Sortierreihenfolge: 10',
			title: 'Fußball',
		});
	});

	it('shows a dash when the sort order is missing', () => {
		expect(prepareDepartmentPreview({ title: 'Neu' }).subtitle).toBe('Sortierreihenfolge: –');
	});
});
```

- [ ] **Step 2: Run** `pnpm --filter studio test schemas/documents/department.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement** `dosb-icon.tsx`, `slug-history.ts`, `department.ts` as listed in Interfaces. `isTeamSport` has `initialValue: false`. The slug uses `slugField` from `shared/fields/general` without its group (`getFieldWithoutGroup`), plus `options.isUnique` left at Sanity's default (unique per type). `meta` is `getFieldWithoutGroup(metaField)`. Orderings as in `group.tsx` (name and sort order, both directions).

- [ ] **Step 4: Remove `stats` from `groupsPage`.** Drop `statsField` from `content.fields` and `stats` from `content.groups` and from `_groups.ts` exports.

- [ ] **Step 5: Run** `pnpm --filter studio test` and `pnpm --filter studio run typecheck`. Expected: PASS.

- [ ] **Step 6: Commit** — `feat(studio): add department document type`

---

### Task 2: One `group` type, person affiliations, internal links

**Files:**

- Create: `apps/studio/schemas/documents/group.ts`
- Create: `apps/studio/schemas/documents/group.test.ts`
- Delete: `apps/studio/schemas/documents/group.{admin,children-gymnastics,courses,dance,other-sports,soccer,taekwondo}.ts`, `apps/studio/constants/departments.ts`
- Delete: `apps/studio/utils/documents/group.tsx`, `apps/studio/utils/documents/group.test.ts`, `apps/studio/utils/documents/index.ts`. The field list moves into `group.ts`, and the assertions of `group.test.ts` that still apply (preview subtitle, the „Schiedsrichter“ rule) move into `schemas/documents/group.test.ts`.
- Modify: `apps/studio/schemas/index.ts`
- Modify: `apps/studio/schemas/documents/person.ts`, `apps/studio/schemas/documents/person.test.ts`
- Modify: `apps/studio/schemas/objects/internal-link.ts`, `apps/studio/schemas/objects/internal-link.test.ts`

**Interfaces:**

- Consumes: `dosbIconField`, `previousPathsField` (Task 1).
- Produces: schema type `group`. Fields are those of today's sport group (`getGroupDocument` with `isSportGroup: true`), without `isSportGroup` and without any `hidden: !isSportGroup`. Added are `department` (first field, required `reference` to `department`) and `previousPathsField`. The slug gets `options.isUnique: isGroupSlugUniqueInDepartment`.
- Produces: `isGroupSlugUniqueInDepartment(slug: string, context: SlugValidationContext): Promise<boolean>` exported from `group.ts`. It runs `count(*[_type == "group" && slug.current == $slug && department._ref == $departmentId && !(_id in [$draftId, $publishedId])]) == 0` with `context.getClient({ apiVersion: '2026-10-01' })`. Without a department it returns `true`, because the required department error already shows.
- Produces: `validateTeamMatchesDepartment(team: Reference | undefined, context: ValidationContext): Promise<true | string>` exported from `person.ts`. It returns the German warning from Global Constraints when the team's `department._ref` differs from the affiliation's `department._ref`, otherwise `true`. It is attached as `Rule.custom(...).warning()`.
- Produces: `getTeamFilter({ parent }): { filter?: string; params?: Record<string, string> }` exported from `person.ts`. With a department it returns `{ filter: 'department._ref == $departmentId', params: { departmentId } }`, otherwise `{}`.
- Produces: affiliation fields `department` (optional reference to `department`), `team` (optional reference to `group`, `options.filter: getTeamFilter`), `role` (unchanged, required).
- Produces: `INTERNAL_LINK_TARGETS` with `{ type: 'department' }` and `{ type: 'group' }` instead of the six `group.*`.

- [ ] **Step 1: Write the failing tests**

`group.test.ts`:

```ts
it('requires a department', () => {
	/* field 'department' exists, type 'reference', to [{ type: 'department' }] */
});
it('accepts a slug no other group of the department uses', async () => {
	await expect(
		isGroupSlugUniqueInDepartment(
			'herren',
			contextWith({ count: 0, departmentId: 'department-fussball' }),
		),
	).resolves.toBe(true);
});
it('rejects a slug another group of the same department uses', async () => {
	await expect(
		isGroupSlugUniqueInDepartment(
			'herren',
			contextWith({ count: 1, departmentId: 'department-fussball' }),
		),
	).resolves.toBe(false);
});
it('passes the department and both ids of the document to the query', async () => {
	/* params: { slug, departmentId, draftId: 'drafts.abc', publishedId: 'abc' } */
});
it('accepts any slug while no department is chosen', async () => {
	/* departmentId undefined → true, fetch not called */
});
```

`contextWith` builds `{ document: { _id: 'drafts.abc', department: { _ref } }, getClient: () => ({ fetch: vi.fn().mockResolvedValue(count === 0) }) }`.

`person.test.ts` (replace the switch-based filter tests):

```ts
it('limits the groups to the chosen department', () => {
	expect(getTeamFilter({ parent: { department: { _ref: 'department-tanzen' } } })).toEqual({
		filter: 'department._ref == $departmentId',
		params: { departmentId: 'department-tanzen' },
	});
});
it('offers every group without a department', () => {
	expect(getTeamFilter({ parent: {} })).toEqual({});
});
it('warns when the group belongs to another department', async () => {
	await expect(
		validateTeamMatchesDepartment(
			{ _ref: 'g1', _type: 'reference' },
			contextFor({
				affiliationDepartment: 'department-kurse',
				teamDepartment: 'department-fussball',
			}),
		),
	).resolves.toBe('Die Gruppe gehört nicht zur gewählten Abteilung.');
});
it('accepts a group of the chosen department', async () => {
	/* same department → true */
});
it('accepts an affiliation with only a role', async () => {
	/* team undefined → true, no fetch */
});
```

`internal-link.test.ts`: the targets contain `department` and `group` and no type starting with `group.`.

- [ ] **Step 2: Run** `pnpm --filter studio test schemas/documents`. Expected: FAIL.

- [ ] **Step 3: Implement** the Interfaces. The `department` and `team` fields of an affiliation lose `Rule.required()`. `validateTeamMatchesDepartment` reads the affiliation from `context.parent` and the team's department with `*[_id == $id][0].department._ref`.

- [ ] **Step 4: Run** `pnpm --filter studio test` and `pnpm --filter studio run typecheck`. Expected: PASS. `structure/index.ts` still names the old types until Task 4 and fails typecheck only if it imported them. It does not: it only uses strings.

- [ ] **Step 5: Commit** — `feat(studio): merge group types into one group with a department`

---

### Task 3: Slug history on publish

**Files:**

- Create: `apps/studio/utils/slug-history.ts`, `apps/studio/utils/slug-history.test.ts`
- Create: `apps/studio/actions/publish-with-slug-history.tsx`
- Modify: `apps/studio/sanity.config.ts` (wrap the publish action for `department` and `group`)

**Interfaces:**

- Produces: `appendToHistory(history: readonly string[] | undefined, publishedValue: string | undefined, nextValue: string | undefined): string[] | undefined`. It returns the new list, or `undefined` when nothing changes.
- Produces: `getSlugHistoryPatch(input: SlugHistoryInput): Record<string, string[]> | undefined`, where `SlugHistoryInput = { type: 'department'; published?: { slug?: string }; draft: { slug?: string; previousSlugs?: string[] } } | { type: 'group'; published?: { departmentSlug?: string; slug?: string }; draft: { departmentSlug?: string; slug?: string; previousPaths?: string[] } }`. It returns `{ previousSlugs: [...] }` or `{ previousPaths: [...] }` (path = `${departmentSlug}/${slug}`, only when both parts exist), or `undefined`.
- Produces: `createPublishWithSlugHistoryAction(publishAction: DocumentActionComponent): DocumentActionComponent`. The wrapped `onHandle`:
  1. reads published and draft from `props`
  2. for `group`, resolves both department slugs with one `client.fetch` (`*[_id in $ids]{ _id, "slug": slug.current }`)
  3. patches the draft with `getSlugHistoryPatch` when it returns something
  4. then calls the original `onHandle` Label, icon, disabled state and shortcut stay the original's.

- [ ] **Step 1: Write the failing test** `slug-history.test.ts`

```ts
it('records the published slug when the slug changes', () => {
	expect(appendToHistory(undefined, 'fussball', 'fussball-und-mehr')).toEqual(['fussball']);
});
it('records nothing for a document that was never published', () => {
	expect(appendToHistory(['alt'], undefined, 'neu')).toBeUndefined();
});
it('records nothing when the slug stays', () => {
	expect(appendToHistory([], 'kurse', 'kurse')).toBeUndefined();
});
it('never records a value twice', () => {
	expect(appendToHistory(['alt'], 'alt', 'neu')).toBeUndefined();
});
it('drops the new slug from the history when an editor switches back', () => {
	expect(appendToHistory(['kurse'], 'fitness', 'kurse')).toEqual(['fitness']);
});
it('records the old path when a group moves to another department', () => {
	expect(
		getSlugHistoryPatch({
			type: 'group',
			published: { departmentSlug: 'kurse', slug: 'yoga' },
			draft: { departmentSlug: 'weitere-sportarten', slug: 'yoga' },
		}),
	).toEqual({ previousPaths: ['kurse/yoga'] });
});
it('records the old slug of a department', () => {
	expect(
		getSlugHistoryPatch({
			type: 'department',
			published: { slug: 'tanz' },
			draft: { slug: 'tanzen' },
		}),
	).toEqual({ previousSlugs: ['tanz'] });
});
it('records no path while the published group has no department slug', () => {
	expect(
		getSlugHistoryPatch({
			type: 'group',
			published: { slug: 'yoga' },
			draft: { departmentSlug: 'kurse', slug: 'yoga' },
		}),
	).toBeUndefined();
});
```

- [ ] **Step 2: Run** `pnpm --filter studio test utils/slug-history.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement** `slug-history.ts`, then the action. The action uses `useClient({ apiVersion: '2026-10-01' })` and `useDocumentOperation(props.id, props.type).patch`, as `actions/regenerate-echo-pages.tsx` does. In `sanity.config.ts`, `document.actions` maps the `publish` action of `department` and `group` through `createPublishWithSlugHistoryAction`. Keep the existing singleton and echo branches.

- [ ] **Step 4: Run** `pnpm --filter studio test` and `pnpm --filter studio run typecheck`. Expected: PASS.

- [ ] **Step 5: Commit** — `feat(studio): remember former slugs and paths on publish`

---

### Task 4: Desk structure

**Files:**

- Create: `apps/studio/structure/templates.ts`
- Modify: `apps/studio/structure/index.ts`, `apps/studio/structure/index.test.ts`
- Modify: `apps/studio/plugins/singleton.ts` (add `...getGroup(S, 'departments')` to the middle block)
- Modify: `apps/studio/sanity.config.ts` (`schema.templates`: append `groupByDepartmentTemplate`)
- Modify: `apps/studio/AGENTS.md` (new section „Abteilungen und Gruppen“: one `group` type, department reference, slug unique per department, slug history and its limits, desk)

**Interfaces:**

- Produces: `DocumentGroup` gains `'departments'`.
- `getGroup(S, 'departments')` returns one list item „Abteilungen“ (`id: 'departments'`): `S.documentTypeList('department')` ordered by `sortOrder` ascending.
- `getGroup(S, 'groups')` returns „Gruppen“: a `S.documentTypeList('department')` titled „Gruppen“ whose `.child(departmentId => getGroupsOfDepartmentList(S, departmentId))`.
- Produces: `getGroupsOfDepartmentList(S: StructureBuilder, departmentId: string)`: `S.documentList().title('Gruppen').schemaType('group').filter('_type == "group" && department._ref == $departmentId').params({ departmentId }).defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]).initialValueTemplates([S.initialValueTemplateItem('group-by-department', { departmentId })])`.
- Produces: `groupByDepartmentTemplate` in `templates.ts`: `{ id: 'group-by-department', parameters: [{ name: 'departmentId', type: 'string' }], schemaType: 'group', title: 'Gruppe in Abteilung', value: ({ departmentId }) => ({ department: { _ref: departmentId, _type: 'reference' } }) }`.
- `isExcludedDefaultListItem` excludes `department` and `group` and no longer names any `group.*`.

- [ ] **Step 1: Write the failing tests** in `structure/index.test.ts` with the existing recording proxy:

```ts
it('excludes department and group from the default list items', () => {
	expect(isExcludedDefaultListItem('department')).toBe(false);
	expect(isExcludedDefaultListItem('group')).toBe(false);
});
it('lists the departments by sort order', () => {
	/* calls include documentTypeList('department') and defaultOrdering([{ direction: 'asc', field: 'sortOrder' }]) */
});
it('filters the groups of a department by its reference', () => {
	const { calls, structureBuilder } = createRecordingStructureBuilder();
	getGroupsOfDepartmentList(structureBuilder, 'department-fussball');
	expect(calls).toContainEqual({
		args: ['_type == "group" && department._ref == $departmentId'],
		method: 'filter',
	});
	expect(calls).toContainEqual({
		args: [{ departmentId: 'department-fussball' }],
		method: 'params',
	});
	expect(calls).toContainEqual({
		args: ['group-by-department', { departmentId: 'department-fussball' }],
		method: 'initialValueTemplateItem',
	});
});
it('presets the department of a new group', () => {
	expect(groupByDepartmentTemplate.value({ departmentId: 'department-kurse' })).toEqual({
		department: { _ref: 'department-kurse', _type: 'reference' },
	});
});
```

Remove the tests that expect `group.admin` or any `group.*` list item.

- [ ] **Step 2: Run** `pnpm --filter studio test structure`. Expected: FAIL.

- [ ] **Step 3: Implement** the Interfaces.

- [ ] **Step 4: Run** `pnpm --filter studio test`, `pnpm --filter studio run typecheck`, `pnpm --filter studio run lint`. Expected: PASS.

- [ ] **Step 5: Commit** — `feat(studio): list groups per department in the desk`

---

### Task 5: Migration script

**Files:**

- Create: `apps/studio/scripts/migrate-departments.ts` (entry, run through `sanity exec --with-user-token`)
- Create: `apps/studio/scripts/migrate-departments/seeds.ts`, `options.ts`, `build.ts`, `run.ts`, `verify.ts`, `probe.ts`, `store.ts` and a `*.test.ts` next to each of `options`, `build`, `run`, `verify`, `probe`
- Create: `apps/studio/scripts/migrate-departments/images/<slug>-card.webp`, `<slug>-hero.webp`, `<slug>-og.webp` (18 files, copied unchanged from `apps/web/src/images/angebot/groups/<slug>.webp`, `apps/web/src/images/angebot/groups/hero/<slug>.webp` and `apps/web/public/og/angebot/groups/<slug>.webp`, because Task 10 deletes those)
- Modify: `apps/studio/package.json` (`"migrate:departments": "sanity exec scripts/migrate-departments.ts --with-user-token --"`)
- Modify: `apps/studio/AGENTS.md` (section „Migration der Abteilungen“ with the commands below)

**Interfaces:**

- `seeds.ts` exports `DEPARTMENT_SEEDS: readonly DepartmentSeed[]`. Each seed has:
  - `id`: `department-<slug>`
  - `title`, `slug`, `icon`, `sortOrder`: 10, 20, … 60 in the order of Global Constraints
  - `isTeamSport`: true only for Fußball
  - `legacyType`: e.g. `group.soccer`
  - `legacyAffiliation`: the old person string, e.g. `soccer`
  - `contactEmail`: `fussball@tsg-irlich.de` for Fußball, `breitensport@tsg-irlich.de` otherwise
  - `images`: `{ card, hero, openGraph }`, file names inside `scripts/migrate-departments/images/`
- `options.ts`: `parseMigrationOptions(argv: string[]): { dataset: string; dryRun: boolean; probe: boolean }`. `--dataset` is required, the dry run is the default (`--no-dry-run` writes), `--probe` only runs the probe. Errors are German, like `import-echo/options.ts`.
- `build.ts`:
  - `buildDepartmentDocument(seed, assetIds: { card: string; hero: string; openGraph: string }, stats: readonly StatsItem[], contactPersonIds: readonly string[]): DepartmentDocument`. Images become `extendedImage` objects with `alt` = title. `meta.openGraphImage` gets the open graph asset. Stats are copied with fresh `_key`s. `contactPersons` are references with `_key` = person id.
  - `toGroupDocument(legacy: LegacyGroupDocument, departmentId: string): GroupDocument`. It keeps `_id` and every content field, drops `_rev`, `_updatedAt` and `isSportGroup`, sets `_type: 'group'` and `department: { _ref, _type: 'reference' }`.
  - `migrateAffiliations(affiliations: readonly LegacyAffiliation[] | undefined, departmentIdByLegacy: ReadonlyMap<string, string>): Affiliation[] | undefined`. `admin` loses `department` and `team`. A known legacy string becomes a department reference. `undefined` means nothing to change.
- `store.ts`: `MigrationStore` interface plus `createSanityMigrationStore(client: SanityClient, imageFolder: string): MigrationStore`. Methods:
  - `fetchLegacyGroups()` (raw perspective, published and drafts)
  - `fetchPersons()`
  - `fetchGroupsPageStats()`
  - `fetchContactPersonIds(email)` (same filter and order as today's `offerGroupsPageContactPersonsQuery`)
  - `uploadImage(path)`
  - `createOrReplace(doc)`
  - `swapType(legacyId, next)`: one transaction, `delete(legacyId)` then `create(next)`
  - `patchAffiliations(id, rev, affiliations)` with `ifRevisionID`
  - `unsetGroupsPageStats()`
  - `deleteDocument(id)`
- `run.ts`: `runMigration(store: MigrationStore, options: { dryRun: boolean }): Promise<MigrationReport>`. Order, each step idempotent:
  1. upload images
  2. createOrReplace the six departments
  3. swap every `group.<x>` except `group.admin` (skip documents already `group`)
  4. patch persons
  5. delete both `group.admin` documents (published and drafts)
  6. unset `groupsPage.content.stats`

  In a dry run every write is counted, not executed. `MigrationReport = { departments: number; groups: number; persons: number; deleted: number; paths: string[]; problems: string[] }`. `paths` lists `/angebot/<abteilung>` and `/angebot/<abteilung>/<gruppe>` for every published department and group after the migration. The rollout checks exactly these URLs.

- `verify.ts`: `verifyMigration(store): Promise<string[]>` lists German problems:
  - any `group.*` document left
  - a `group` without `department`
  - an affiliation whose `department` is still a string
  - fewer than six departments
  - a department without card image asset
- `probe.ts`: `runTypeSwapProbe(store): Promise<'ok' | string>`. It creates `migration-probe-target` (`_type: 'group.soccer'`) and `migration-probe-referrer` (a `person` with `affiliations[0].team` → target). Then it swaps the target to `group`, checks that the referrer's `team._ref` still resolves, and deletes both. It returns the Sanity error message if the swap is rejected.

- [ ] **Step 1: Write the failing tests.** In `build.test.ts`:
  - The Fußball seed yields `isTeamSport: true`, `meta.openGraphImage.asset._ref` equal to the open-graph asset id, and stats copied with new `_key`s and equal `title`/`value`/`suffix`.
  - `toGroupDocument` keeps `_id`, `title`, `slug`, `training`, `newsCategory` and drops `isSportGroup` and `_rev`.
  - `migrateAffiliations` turns `{ department: 'admin', team: {…}, role: {…} }` into `{ role: {…} }` with the same `_key`.
  - `migrateAffiliations` turns `{ department: 'soccer' }` into `{ department: { _ref: 'department-fussball', _type: 'reference' } }`.
  - `migrateAffiliations` returns `undefined` for already migrated affiliations.

  In `run.test.ts` (fake store recording calls):
  - A dry run calls no write method. For the production-shaped fixture it reports:
    - 6 departments
    - 32 groups (11 + 4 + 4 + 3 + 4 + 6) and 2 deletions (`group.admin`)
    - every person with a legacy string department as patched
  - The paths of a dry run list `/angebot/fussball` and `/angebot/fussball/<slug>` for a soccer group.
  - The real run deletes `group.admin` only after every person patch.
  - A second real run on the migrated fake store writes nothing.

  `verify.test.ts` covers each listed problem. `options.test.ts` covers a missing `--dataset` and the dry-run default. `probe.test.ts` covers `'ok'` and a rejected swap.

- [ ] **Step 2: Run** `pnpm --filter studio test scripts/migrate-departments`. Expected: FAIL.

- [ ] **Step 3: Implement.** The entry script mirrors `scripts/import-echo.ts`:
  - `getCliClient({ apiVersion: '2026-10-01' }).withConfig({ dataset, useCdn: false })`
  - prints project, dataset and mode in German
  - runs the probe when `--probe` is given, otherwise `runMigration` followed by `verifyMigration`
  - prints the report and exits with 1 on any problem

- [ ] **Step 4: Run** `pnpm --filter studio test`, `pnpm --filter studio run typecheck`. Expected: PASS.

- [ ] **Step 5: Dry run** against development. It only reads, so it needs no OK: `pnpm --filter studio run migrate:departments --dataset development`. Expected:
  - 6 departments, 32 groups, 2 deletions
  - a person count equal to `count(*[_type == 'person' && count(affiliations[defined(department) && !defined(department._ref)]) > 0])`
  - no problems

  Save the printed paths in the scratchpad for Task 11.

- [ ] **Step 6: Commit** — `feat(studio): add the department migration script`

---

### Task 6: Typegen, internal links, revalidation

**Files:**

- Modify: `apps/web/src/types/sanity.types.generated.ts` (generated)
- Modify: `apps/web/src/lib/sanity/queries/index.ts` (`internalLinkTarget` gains `"department": department->slug.current`)
- Modify: `apps/web/src/utils/links.ts`, `apps/web/src/utils/links.test.ts`
- Modify: `apps/web/src/app/api/revalidate/route.ts`, `apps/web/src/app/api/revalidate/route.test.ts`
- Modify: `docs/SANITY_WEBHOOK_SETUP.md` (filter list: add `department`, `group`, `groupsPage`, drop the six `group.*`; note that the switch happens at the rollout, Tasks 11 and 12)

**Interfaces:**

- `InternalLinkTarget` gains `department?: string | null`.
- `getHrefForType(type, slug, category?, department?)`:
  - `department` → `/angebot/${slug}`
  - `group` → `/angebot/${department}/${slug}` only when `department` is set, otherwise `undefined`
  - The `GROUP_TYPE_PREFIX` branch and the `groupSections` import go away.
- `REVALIDATION_MAP`:
  - `department`: `revalidatePath('/')`, `revalidatePath('/angebot', 'layout')`, `revalidatePath('/sitemap.xml')`, `revalidatePath('/llms.txt')`
  - `group`: the same without `/`
  - `groupsPage`: `revalidatePath('/angebot/[group]', 'page')`
  - `GROUP_REVALIDATION_MAP` and its import go away.

- [ ] **Step 1: Run** `pnpm run extract-types && pnpm run typegen:sanity` from the root. Typecheck errors in files Tasks 7–10 rewrite are expected; note them, do not fix them here beyond what this task's files need.

- [ ] **Step 2: Write the failing tests**

```ts
it('links a department below the offer page', () => {
	expect(getInternalHref({ _type: 'department', slug: 'tanzen' })).toBe('/angebot/tanzen');
});
it('links a group below its department', () => {
	expect(getInternalHref({ _type: 'group', department: 'fussball', slug: 'herren' })).toBe(
		'/angebot/fussball/herren',
	);
});
it('gives a group without department slug no link', () => {
	expect(getInternalHref({ _type: 'group', slug: 'herren' })).toBeUndefined();
});
```

In `route.test.ts`, three cases. A `department` payload revalidates `/` and `/angebot` as layout. A `group` payload revalidates `/angebot` as layout and not `/`. A `groupsPage` payload revalidates `/angebot/[group]` as page. Delete the cases for `group.*`.

- [ ] **Step 3: Run** `pnpm --filter web test src/utils/links.test.ts src/app/api/revalidate`. Expected: FAIL. **Step 4: Implement.** **Step 5: Run** the same. Expected: PASS.

- [ ] **Step 6: Commit** — `feat(web): resolve department and group links from their documents`

---

### Task 7: Overviews read departments (home, `/angebot`, group card)

**Files:**

- Create: `apps/web/src/lib/sanity/queries/departments.ts`
- Create: `apps/web/src/utils/fallback-image.ts` (exports `OFFER_FALLBACK_IMAGE`, the `alt` + `src` of today's `fallbackImage`)
- Modify: `apps/web/src/components/ui/group-card.tsx`, `apps/web/src/components/ui/group-card.test.tsx`
- Modify: `apps/web/src/app/angebot/page.tsx`, `apps/web/src/app/angebot/_sections/groups.tsx`, `apps/web/src/app/angebot/page.test.ts`
- Modify: `apps/web/src/app/page.tsx`, `apps/web/src/app/_home/groups.tsx`

**Interfaces:**

- Produces: `departmentCardsQuery = defineQuery(\`*[_type == 'department' && defined(slug.current)] | order(sortOrder asc) { _id, cardImage, icon, "slug": slug.current, title }\`)`.
- `GroupCard` props become `{ href: string; icon?: string | null; image?: AnyImage | null; overviewTitle?: string | null; title?: string | null }`. Without `title` it renders nothing. The image source is `urlForImage(image, 270, 480) ?? OFFER_FALLBACK_IMAGE.src`.
- `/angebot` `Groups` gets `departments: DepartmentCardsQueryResult` and renders one `GroupCard` per department with `href` from `getInternalHref({ _type: 'department', slug })`.
- Home `Groups` gets the same `departments` prop and keeps rendering icon, digit and title, no image.

- [ ] **Step 1: Write the failing tests.** `group-card.test.tsx`:
  - links to the given `href` with the accessible name `Mehr über "Fußball" erfahren`
  - shows the fallback image when `image` has no asset (Review Focus 5)

  `angebot/page.test.ts`:
  - renders one card per department, in query order
  - a department without slug renders no card

- [ ] **Step 2: Run** `pnpm --filter web test src/components/ui/group-card.test.tsx src/app/angebot/page.test.ts`. Expected: FAIL. **Step 3: Implement.** **Step 4: Run** again. Expected: PASS.

- [ ] **Step 5: Commit** — `feat(web): build the department overviews from Sanity`

---

### Task 8: Department page on `sanityFetch`

**Files:**

- Modify: `apps/web/src/lib/sanity/queries/departments.ts`
- Modify: `apps/web/src/lib/sanity/queries/pages/offer-groups.ts` (keep only `offerGroupsPageQuery`)
- Modify: `apps/web/src/app/angebot/[group]/page.tsx`, `apps/web/src/app/angebot/[group]/page.test.ts`, `apps/web/src/app/angebot/[group]/_sections/groups.tsx`

**Interfaces:**

- Produces:
  - `departmentPageQuery` (`$slug`): `_id`, `title`, `intro`, `cardImage`, `heroImage`, `meta`, `stats`. Plus `"groups": *[_type == 'group' && department._ref == ^._id] | order(sortOrder asc) { featuredImage, icon, overviewTitle, "slug": slug.current, title }` and `"contactPersons": contactPersons[]-> { ${contactPersons} }`.
  - `departmentRedirectQuery` (`$slug`): `*[_type == 'department' && $slug in previousSlugs && !(_id in path('drafts.**'))][0].slug.current`.
  - `departmentSlugsQuery`: `*[_type == 'department' && defined(slug.current)].slug.current`.
- Page:
  - `generateStaticParams` maps `departmentSlugsQuery` (`perspective: 'published'`, `stega: false`) to `{ group }`.
  - `generateMetadata` uses `getPageMetadata`:
    - `title`: `${title} bei der TSG Irlich`
    - `description`: `groupsPage.metaDescription`
    - `image`: `cardImage`
    - `meta`, `path: /angebot/${slug}`
  - No department leads to the redirect lookup, then `permanentRedirect(\`/angebot/${target}\`)`, else `notFound()`.
  - Hero image is `heroImage ?? cardImage` through `urlForImage(…, 600, 1920)`, falling back to `OFFER_FALLBACK_IMAGE`.
  - The `Groups` section intro is `department.intro ?? groupsPage.content.groupsSection.intro`.
  - `Stats` renders only with at least one stat. `ContactPersons` renders only with at least one person.
- `_sections/groups.tsx` props: `departmentSlug: string; departmentTitle: string; groups: …; intro; subtitle; title`. Cards get `href` `/angebot/${departmentSlug}/${slug}`.

- [ ] **Step 1: Write the failing tests** in `page.test.ts`, switching the mock from `client` to `@/lib/sanity/live` like `src/app/news/[category]/[slug]/page.test.ts`:
  - The hero shows the hero image, the card image when no hero image is set, and `OFFER_FALLBACK_IMAGE` when neither has an asset (Review Focus 5).
  - Department intro wins over the shared intro; without one the shared intro shows (Review Focus 2).
  - No stats and no contact persons render no `Stats` and no `ContactPersons` (Review Focus 2).
  - Contact persons render in the order of the department document.
  - An unknown slug found in `previousSlugs` calls `permanentRedirect('/angebot/tanzen')`. An unknown slug found nowhere calls `notFound()`.
  - A slug that is current for one department never reaches the redirect query (Review Focus 3).
  - Metadata: `meta.openGraphImage` wins, otherwise the card image. The description falls back to `groupsPage.metaDescription`.
  - `generateMetadata` and `generateStaticParams` pass `stega: false`.

- [ ] **Step 2: Run** `pnpm --filter web test 'src/app/angebot/\[group\]/page.test.ts'`. Expected: FAIL. **Step 3: Implement.** **Step 4: Run** again. Expected: PASS.

- [ ] **Step 5: Commit** — `feat(web): render department pages from their documents`

---

### Task 9: Group page on `sanityFetch`, redirects, JSON-LD

**Files:**

- Create: `apps/web/src/utils/group-redirect.ts`, `apps/web/src/utils/group-redirect.test.ts`
- Modify: `apps/web/src/lib/sanity/queries/pages/offer-groups-group.ts`
- Modify: `apps/web/src/app/angebot/[group]/[singleGroup]/page.tsx`, `apps/web/src/app/angebot/[group]/[singleGroup]/page.test.ts`

**Interfaces:**

- Queries (`$department`, `$slug` unless noted):
  - `groupPageQuery`: today's projection plus `_id` and `"isTeamSport": department->isTeamSport`. It filters on `_type == 'group' && slug.current == $slug && department->slug.current == $department`.
  - `groupContactPersonsQuery` (`$groupId`): today's projection, with `affiliations[team._ref == $groupId][0]` replacing the slug match. Ordered by `lastName asc` as today.
  - `groupNewsQuery` (`$groupId`): today's news projection, read from `*[_id == $groupId][0].newsCategory->`.
  - `groupRedirectQuery` returns `{ inDepartment, byPreviousPath, byDepartmentHistory }`. Each is `{ "departmentSlug": department->slug.current, "slug": slug.current } | null`, published only:
    - `inDepartment`: a group with slug `$slug` in a department whose `$department in previousSlugs`
    - `byPreviousPath`: a group whose `($department + "/" + $slug) in previousPaths`
    - `byDepartmentHistory`: a group whose `previousPaths` holds `s + "/" + $slug` for some `s` in the `previousSlugs` or slug of the department that owns `$department` (current or historic)
  - `groupStaticParamsQuery`: `*[_type == 'group' && defined(slug.current) && defined(department->slug.current)] { "group": department->slug.current, "singleGroup": slug.current }`.
- Produces: `resolveGroupRedirect(match: GroupRedirectQueryResult | null): string | undefined`. It returns `/angebot/${departmentSlug}/${slug}` for the first non-null candidate in the order above that has both parts.
- Page:
  - `getGroupSchema({ …, isTeam: groupData.isTeamSport === true })`
  - not found → `resolveGroupRedirect` → `permanentRedirect` or `notFound()`
  - `generateStaticParams` from `groupStaticParamsQuery`
  - `stega: false` in metadata and static params

- [ ] **Step 1: Write the failing tests** `group-redirect.test.ts`:

```ts
it('follows a renamed department', () => {
	expect(
		resolveGroupRedirect({
			inDepartment: { departmentSlug: 'tanzen', slug: 'kids' },
			byPreviousPath: null,
			byDepartmentHistory: null,
		}),
	).toBe('/angebot/tanzen/kids');
});
it('follows a group that moved or was renamed', () => {
	/* byPreviousPath only → its path */
});
it('prefers the renamed department over an old path', () => {
	/* inDepartment and byPreviousPath set → inDepartment */
});
it('ignores a candidate without department slug', () => {
	/* { departmentSlug: null, slug: 'x' } only → undefined */
});
it('finds nothing without candidates', () => {
	expect(resolveGroupRedirect(null)).toBeUndefined();
});
```

In `page.test.ts`:

- A Fußball group (`isTeamSport: true`) gets a `SportsTeam` and a Kurse group a `SportsOrganization`.
- The contact persons query receives `groupId`.
- An unknown path with a redirect candidate calls `permanentRedirect`, and without one `notFound()`.
- A path that matches a current group never queries redirects (Review Focus 3).

- [ ] **Step 2: Run** `pnpm --filter web test src/utils/group-redirect.test.ts 'src/app/angebot/\[group\]/\[singleGroup\]'`. Expected: FAIL. **Step 3: Implement.** **Step 4: Run** again. Expected: PASS.

- [ ] **Step 5: Commit** — `feat(web): render group pages from their documents and redirect old paths`

---

### Task 10: Sitemap, `llms.txt`, presentation tool, cleanup

**Files:**

- Modify: `apps/web/src/lib/sanity/queries/sitemap.ts`, `apps/web/src/app/sitemap.ts`, `apps/web/src/app/sitemap.test.ts`
- Modify: `apps/web/src/lib/sanity/queries/llms.ts`, `apps/web/src/app/llms.txt/route.ts`, `apps/web/src/app/llms.txt/route.test.ts`
- Modify: `apps/studio/plugins/presentation.ts`. Also create `apps/studio/plugins/presentation.test.ts` for the location queries and routes. It mocks `@/env` (`vi.mock(import('@/env'), () => ({ previewUrl: 'http://localhost:3000' }))`), because `env.ts` throws without the studio variables. Export `mainDocuments` and `LOCATION_QUERIES` for the test.
- Delete:
  - `apps/web/src/utils/groups.ts`, `apps/web/src/utils/groups.test.ts`
  - `apps/web/src/constants/query-fields.ts`
  - `apps/web/src/lib/sanity/queries/shared/groups.ts`
  - `apps/web/src/images/angebot/groups/` (all), `apps/web/public/og/angebot/groups/` (all). The migration has its own copies since Task 5.
- Modify: `apps/web/AGENTS.md`:
  - „Internal links“: departments and groups
  - „Structured data“: `isTeamSport`
  - „Fetching content from Sanity“: department and group pages now use `sanityFetch`
  - Revalidation map

**Interfaces:**

- `sitemapDepartmentsQuery`: `*[_type == 'department' && defined(slug.current)] { "slug": slug.current, "lastModified": _updatedAt }`
- `sitemapGroupsQuery`: `*[_type == 'group'] { _type, "department": department->slug.current, "slug": slug.current, "lastModified": _updatedAt }`
- `llmsTxtQuery.departments`: `*[_type == 'department' && defined(slug.current)] | order(sortOrder asc) { title, "slug": slug.current, "groups": *[_type == 'group' && department._ref == ^._id] | order(sortOrder asc) { _type, "department": ^.slug.current, "description": meta.metaDescription, "slug": slug.current, title } }`. `buildDepartment` takes one such entry instead of a `groupSections` element.
- Presentation:
  - `mainDocuments` gains, before the news routes:
    - `{ filter: '_type == "group" && slug.current == $singleGroup && department->slug.current == $group', route: '/angebot/:group/:singleGroup' }`
    - `{ filter: '_type == "department" && slug.current == $group', route: '/angebot/:group' }`
  - `LOCATION_QUERIES` gains:
    - `department`: its page plus `/angebot` „Alle Angebote“
    - `group`: its page plus its department page

- [ ] **Step 1: Write the failing tests.**
  - Sitemap: lists every department and group URL, and skips a group without department slug (Review Focus 1).
  - `llms.txt`: lists departments in sort order with their groups, and skips a group without department slug.
  - Presentation: the group route comes before the department route, and both location queries project `href` from `slug.current`.

- [ ] **Step 2: Run** the three test files. Expected: FAIL. **Step 3: Implement and delete.** **Step 4: Run** `pnpm run test`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check` at the root. Expected: all green, no reference to `groupSections`, `getCurrentDepartment`, `EMAIL_SOCCER_DEPARTMENT` or `group.soccer` outside the migration script (`rg "groupSections|getCurrentDepartment|EMAIL_SOCCER|'group\.(soccer|admin)" apps --glob '!**/migrate-departments/**'` prints nothing).

- [ ] **Step 5: Run** `pnpm run test:coverage`. Expected: every workspace meets its thresholds.

- [ ] **Step 6: Commit** — `feat(web): read sitemap and llms.txt departments from Sanity`

---

### Task 11: Rollout on `development`, fixtures, PR

Staging (`next.tsg-irlich.de`) and every preview deployment read `development`. Between the migration and the merge of this branch into `next`, staging serves the pages it has cached. The paused webhook keeps those pages cached. A page first requested in that window can fail until the merge deploys.

- [ ] **Step 1: STOP — ask the user** for the go: pause the „Vercel Staging Revalidation“ webhook, then migrate `development`. Show both commands. Pausing goes through the Webhooks API with a `sanity exec` script, stripping `secret` and `headers` from anything printed (memory „Sanity revalidation webhooks“), or through the Sanity UI by the user.
- [ ] **Step 2: Export the dataset** before anything is deleted: `pnpm --filter studio exec sanity dataset export development <file>.tar.gz`. There is no probe any more: on 2026-10-25 Sanity rejected the same-id type swap (`immutable attribute "_type" may not be modified`), and the user chose the fallback. The migration now moves every group to `group-<old id>`, rewrites every reference to the old ids and then deletes the old documents (spec, „Migration“, step 2).
- [ ] **Step 3: Migrate** `pnpm --filter studio run migrate:departments --dataset development --no-dry-run`. Expected: the same numbers as the dry run in Task 5, Step 5, and a verification without problems.
- [ ] **Step 4: Check by hand in the studio** (`pnpm --filter studio run dev`):
  - „Abteilungen“ lists six departments.
  - „Gruppen › Fußball“ lists 11 groups, and „Neu“ there presets Fußball.
  - Renaming a test department's slug and publishing fills „Frühere Slugs“. Revert it afterwards.
- [ ] **Step 5: Check the website** with the preview server against `development`:
  - every path saved in Task 5, Step 5 answers 200. Those are the URLs that existed before the migration.
  - presentation tool: editing a department's stats shows in the preview before publishing
  - screenshots of `/angebot` and `/angebot/fussball`
- [ ] **Step 6: Record fixtures** `pnpm --filter web run e2e:record`. Then restore the hand-maintained main-menu fixture from git (`apps/web/AGENTS.md`, „Fixtures“). Regenerate the visual baselines in the container: `pnpm --filter web run test:e2e:visual:update`. Expected changes: `offers.png` and `department.png` in both projects, nothing else. Run `pnpm --filter web run test:e2e`. Expected: green, with no new axe baseline entry.
- [ ] **Step 7: Commit** fixtures and baselines, plus both specs and this plan (`docs/superpowers/specs/2026-10-25-*.md`, `docs/superpowers/plans/2026-10-25-web-384-departments-in-studio.md`). Open the PR with the `create-pr` skill against `next`, body `Closes WEB-384`. Bind it and turn on Auto-fix.
- [ ] **Step 8: STOP — ask the user** after the merge into `next` and the staging deployment. Then set the filter of the staging webhook to the list in `docs/SANITY_WEBHOOK_SETUP.md` and re-enable it. Verify with `pnpm exec sanity hook logs "Vercel Staging Revalidation" --detailed` after a test publish.

### Task 12: Rollout on `production`

- [ ] **Step 1: STOP — ask the user** to agree on a time window. The editors must not change groups, persons or the groups page from step 2 until step 6.
- [ ] **Step 2:** Run the dry run with `--dataset production` (read-only) and save its paths for step 6.
- [ ] **Step 3: STOP — ask the user**, then pause „Vercel Production Revalidation“.
- [ ] **Step 4:** Export the dataset (`pnpm --filter studio exec sanity dataset export production <file>.tar.gz`), then run the real migration with `--dataset production --no-dry-run`. There is no probe any more (Task 11, Step 2). Expected: the numbers of the dry run in step 2 (the draft-only group counts as one more new group) and a clean verification.
- [ ] **Step 5:** The user merges `next` into `main`, which deploys web and studio. Wait until both deployments are ready.
- [ ] **Step 6:** Every path from step 2 answers 200 on `https://www.tsg-irlich.de`, and `https://www.tsg-irlich.de/llms.txt` lists six departments. Then **STOP — ask the user**, set the production webhook filter to the documented list and re-enable it. Verify with one publish and the hook logs.
- [ ] **Step 7:** In a follow-up PR, delete `apps/studio/scripts/migrate-departments*` with its images, the `migrate:departments` script and its `AGENTS.md` section. Keep `slug-history` and everything else.
