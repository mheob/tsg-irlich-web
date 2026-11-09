# FAQ in der Abteilung zuordnen und sortieren Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Abteilung führt ihre FAQ als sortierbare Liste fester Verweise; die Frage verliert `departments` und `sortOrder` und zeigt nur noch, wo sie verwendet wird.

**Architecture:** Neues Feld `department.faqs` (Array aus Verweisen auf `faq`) ist die einzige Quelle für Zuordnung und Reihenfolge. Website, Suche und Vorschau lesen die Zuordnung von dort, die Gegenrichtung (welche Abteilungen führen eine Frage) über `faqs[]._ref`. Zwei Sanity-Migrationen übertragen den Bestand und räumen danach die alten Felder ab.

**Tech Stack:** Sanity Studio 6.22 (`defineIncomingReferenceDecoration`, `sanity/migrate`), GROQ, Next.js 16, Vitest über `vp test`, `groq-js` (neu, nur Tests), Playwright-e2e mit aufgezeichneten Fixtures.

**Spec:** `docs/superpowers/specs/2026-11-09-faq-in-departments-design.md`

## Global Constraints

- Ticket: [WEB-431](https://linear.app/tsg-irlich/issue/WEB-431/faq-in-der-abteilung-zuordnen-und-sortieren). Branch `feat/web-431-faq-in-departments`, PR-Text englisch mit `Closes WEB-431`, Doku deutsch.
- Commits über den Skill `create-commit`, nie von Hand. Vor `but commit` `pnpm run format:check` laufen lassen, weil `but commit` Lefthooks pre-commit überspringt.
- Node und pnpm über die Vite+-Shims: `export PATH="$HOME/.local/share/vite-plus/bin:$PATH"` vor jedem Befehl.
- Studio-Texte deutsch. Feld `faqs`: Titel „FAQ“, Beschreibung „Optional. Die Reihenfolge hier ist die Reihenfolge auf der Abteilungsseite. Eine Frage kann in mehreren Abteilungen stehen und wird nur einmal gepflegt. Eine neue Frage zuerst veröffentlichen, dann die Abteilung.“
- Feste Verweise (kein `weak`) in `department.faqs`.
- Auszeichnung einer geteilten Frage: die Abteilung mit der kleinsten `sortOrder` unter allen, deren `faqs` die Frage enthalten; Gleichstand entscheidet `_id` aufsteigend.
- Gegenrichtung immer über `faqs[]._ref`, nie über `references()`.
- Tests importieren `describe`/`it`/`expect`/`vi` aus `vite-plus/test`. Coverage-Schwellen nur anheben, nie senken.
- Nach jeder Schemaänderung: `pnpm run extract-types && pnpm run typegen:sanity` im Repo-Root.
- Neue Abhängigkeit nur über den Katalog (`catalog:`), `catalogMode: strict`.

## Review Focus

- Ein Verweis in `faqs`, der in der Perspektive der Seite ins Leere zeigt (Frage unveröffentlicht oder gelöscht): Die Seite lässt ihn weg, kein leerer Accordion-Eintrag, kein `null` im Array. → Task 5, Test „drops a FAQ that does not resolve“.
- Eine Frage in zwei Abteilungen an unterschiedlicher Position: Jede Seite behält ihre eigene Reihenfolge. → Task 5, Test „keeps the order of the department“.
- Eine geteilte Frage wird genau einmal ausgezeichnet, auch bei gleicher `sortOrder` zweier Abteilungen. → Task 5, Tests „marks up a shared FAQ on the first department only“ und „breaks a sort order tie by id“.
- Migration einer Abteilung, deren veröffentlichte Fassung und Entwurf verschiedene Fragen bekommen, und einer Abteilung ohne Entwurf. → Task 4, Tests „keeps the published department to published FAQs“ und „creates the missing draft“.
- Eine Frage, die nur ein Abteilungsentwurf führt, gilt als zugeordnet (keine Warnung). → Task 2, Test „counts drafts and versions as an assignment“.

---

### Task 1: Feld `faqs` an der Abteilung

**Files:**

- Modify: `apps/studio/schemas/documents/department.ts` (neues Feld zwischen `stats` und `contactPersons`)
- Test: `apps/studio/schemas/documents/department.test.ts`

**Interfaces:**

- Produces: Feld `department.faqs: Array<{ _key: string; _ref: string; _type: 'reference'; _weak?: boolean; _strengthenOnPublish?: { type: 'faq' } }>`, Schemaname `faqs`, Gruppe `content`.

- [ ] **Step 1: Write the failing tests** in `department.test.ts`

```ts
it('lists its FAQ between the stats and the contact persons', () => {
	const fieldNames = department.fields.map((field) => field.name);

	expect(fieldNames.indexOf('faqs')).toBe(fieldNames.indexOf('stats') + 1);
	expect(fieldNames.indexOf('contactPersons')).toBe(fieldNames.indexOf('faqs') + 1);
});

it('keeps its FAQ as a sortable list of strong references in the content tab', () => {
	expect(department.fields.find((field) => field.name === 'faqs')).toMatchObject({
		group: 'content',
		of: [{ to: [{ type: 'faq' }], type: 'reference' }],
		title: 'FAQ',
		type: 'array',
	});
	expect(department.fields.find((field) => field.name === 'faqs')).not.toHaveProperty('of.0.weak');
});

it('refuses the same FAQ twice', () => {
	// recordValidationChain um `unique` erweitern (wie `required`), dann:
	expect(recordValidationChain('faqs')).toStrictEqual([
		'unique',
		'error: Eine Frage darf nur einmal ausgewählt werden',
	]);
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm --filter studio exec vp test run schemas/documents/department.test.ts` Expected: FAIL, `faqs` fehlt.

- [ ] **Step 3: Feld `faqs` in `department.ts` ergänzen**

`defineField` mit `group: 'content'`, `name: 'faqs'`, `of: [defineArrayMember({ to: [{ type: 'faq' }], type: 'reference' })]`, `title: 'FAQ'`, `type: 'array'`, Beschreibung aus den Global Constraints, `validation: (Rule) => [Rule.unique().error('Eine Frage darf nur einmal ausgewählt werden')]`. Kein `options.disableNew`: „Neu erstellen“ bleibt.

- [ ] **Step 4: Run, expect PASS** (gleicher Befehl). Danach `pnpm --filter studio exec vp test run schemas/groups.test.ts` (Tab-Regeln).

- [ ] **Step 5: Commit** (`create-commit`): `feat(studio): assign faq in the department`

---

### Task 2: Die Frage ohne Zuordnung

**Files:**

- Modify: `apps/studio/schemas/documents/faq.ts`
- Test: `apps/studio/schemas/documents/faq.test.ts`

**Interfaces:**

- Produces:
  - `prepareFaqPreview(selection: { answer?: readonly FaqPreviewBlock[]; title?: string }): { subtitle?: string; title?: string }` mit `interface FaqPreviewBlock { children?: readonly { text?: string }[] }` am Dateiende. Untertitel: Text aller `children` des ersten Blocks, aneinandergehängt und getrimmt; `undefined`, wenn leer.
  - `validateFaqIsAssigned(document: { _id: string } | undefined, context: { getClient: ValidationContext['getClient'] }): Promise<string | true>` mit `FAQ_API_VERSION = '2026-10-01'`. Fragt `count(*[_type == "department" && $id in faqs[]._ref]) > 0` mit `getClient({ apiVersion }).withConfig({ perspective: 'raw' }).fetch<boolean>(…, { id: getPublishedId(document._id) })`. Ohne `document` → `true`. Meldung: „Diese Frage steht in keiner Abteilung und erscheint deshalb nirgends auf der Website. Zuordnen lässt sie sich in der Abteilung, Tab „Inhalt“.“

- [ ] **Step 1: Write the failing tests** in `faq.test.ts` (die alten Preview-Tests und den `departments`-Test ersetzen)

```ts
it('declares only question and answer', () => {
	expect(faq.fields.map((field) => field.name)).toStrictEqual(['question', 'answer']);
});

it('sorts the list by question', () => {
	expect(faq.orderings?.map((ordering) => ordering.by)).toStrictEqual([
		[{ direction: 'asc', field: 'question' }],
		[{ direction: 'desc', field: 'question' }],
	]);
});

it('shows where the question is used, without linking or creating from the FAQ', () => {
	const members = faq.renderMembers?.([]) ?? [];
	expect(members.at(-1)).toMatchObject({ key: 'usedIn', kind: 'decoration' });
});

describe('faq preview', () => {
	it('shows the start of the answer below the question', () => {
		expect(
			prepareFaqPreview({
				answer: [
					{ children: [{ text: 'Der Beitrag ' }, { text: 'kostet 8 €.' }] },
					{ children: [{ text: 'Zweiter Absatz' }] },
				],
				title: 'Was kostet es?',
			}),
		).toStrictEqual({ subtitle: 'Der Beitrag kostet 8 €.', title: 'Was kostet es?' });
	});

	it('leaves the subtitle out without an answer', () => {
		expect(prepareFaqPreview({ title: 'Was kostet es?' })).toStrictEqual({
			subtitle: undefined,
			title: 'Was kostet es?',
		});
	});
});

describe('faq assignment warning', () => {
	// contextAnswering(isAssigned: boolean): { context, fetch, getClient, withConfig },
	// ein Fake nach dem Muster von `contextWith` in `group.test.ts`.
	it('warns while no department lists the question', async () => {
		await expect(
			validateFaqIsAssigned({ _id: 'drafts.faq-a' }, contextAnswering(false)),
		).resolves.toBe(
			'Diese Frage steht in keiner Abteilung und erscheint deshalb nirgends auf der Website. Zuordnen lässt sie sich in der Abteilung, Tab „Inhalt“.',
		);
	});

	it('counts drafts and versions as an assignment', async () => {
		const { context, fetch, withConfig } = contextAnswering(true);
		await expect(validateFaqIsAssigned({ _id: 'drafts.faq-a' }, context)).resolves.toBe(true);
		expect(withConfig).toHaveBeenCalledWith({ perspective: 'raw' });
		expect(fetch).toHaveBeenCalledWith(expect.stringContaining('$id in faqs[]._ref'), {
			id: 'faq-a',
		});
	});

	it('checks nothing without a document', async () => {
		const { context, fetch } = contextAnswering(true);
		await expect(validateFaqIsAssigned(undefined, context)).resolves.toBe(true);
		expect(fetch).not.toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `pnpm --filter studio exec vp test run schemas/documents/faq.test.ts`

- [ ] **Step 3: `faq.ts` umbauen**

`departments`, `sortOrder` und `PREVIEW_DEPARTMENTS` entfernen. Orderings `questionAsc` („nach Frage - aufsteigend“) und `questionDesc` („nach Frage - absteigend“). `preview.select: { answer: 'answer', title: 'question' }`. Dokumentweite Validierung `validation: (Rule) => Rule.custom(validateFaqIsAssigned).warning()`. `renderMembers: (members) => [...members, defineIncomingReferenceDecoration({ creationAllowed: false, name: 'usedIn', title: 'Verwendet in', types: [{ type: 'department' }] })]` aus `sanity/structure`, ohne `onLinkDocument` und ohne `actions`. Exporte: `prepareFaqPreview`, `validateFaqIsAssigned`.

- [ ] **Step 4: Run, expect PASS**, dann `pnpm --filter studio run typecheck`.

Lässt sich `defineIncomingReferenceDecoration` in Vitest nicht importieren oder wirft `renderMembers` dort, ersetzt eine eigene Komponente die Dekoration (Spec: „Dem Builder überlassen“). Sie listet `*[_type == "department" && $id in faqs[]._ref] | order(sortOrder asc) { _id, title }` als Links und liegt unter `apps/studio/components/`. Der Test prüft dann ihre Einbindung statt `key: 'usedIn'`.

- [ ] **Step 5: Commit** (`create-commit`): `feat(studio): show where a faq is used`

---

### Task 3: Desk und Vorschau

**Files:**

- Modify: `apps/studio/structure/index.ts` (`getGroupFaq`), `apps/studio/plugins/presentation.ts` (`LOCATION_QUERIES.faq`)
- Test: `apps/studio/structure/index.test.ts:132-150`, `apps/studio/plugins/presentation.test.ts:74-80`

- [ ] **Step 1: Tests anpassen**
  - `structure/index.test.ts`: Titel „resolves the faq group to one list of the FAQ by question“, erwartete Sortierung `[[{ direction: 'asc', field: 'question' }]]`.
  - `presentation.test.ts`, „shows a FAQ on the page of every department that lists it“:

```ts
expect(query).toContain('_type == "department" && ^._id in faqs[]._ref');
expect(query).not.toContain('departments[]');
expect(query).toContain('defined(slug.current)');
expect(query).toContain('order(sortOrder asc)');
```

- [ ] **Step 2: Run, expect FAIL**: `pnpm --filter studio exec vp test run structure/index.test.ts plugins/presentation.test.ts`
- [ ] **Step 3: Implementieren.** `defaultOrdering([{ direction: 'asc', field: 'question' }])`, JSDoc „Returns the group for the FAQ, alphabetically by question.“ `LOCATION_QUERIES.faq`: Unterabfrage `*[_type == "department" && ^._id in faqs[]._ref && defined(slug.current)] | order(sortOrder asc)`, Rest wie bisher; Kommentar „A FAQ appears on the page of every department that lists it in `faqs`.“
- [ ] **Step 4: Run, expect PASS** (gleicher Befehl).
- [ ] **Step 5: Commit** (`create-commit`): `feat(studio): order faq by question and preview them by department`

---

### Task 4: Migrationen

**Files:**

- Create: `apps/studio/migrations/department-faqs/index.ts`, `apps/studio/migrations/department-faqs/index.test.ts`
- Create: `apps/studio/migrations/faq-drop-assignment/index.ts`, `apps/studio/migrations/faq-drop-assignment/index.test.ts`

**Interfaces:**

- Produces (`department-faqs`):
  - `interface FaqVersion { _id: string; departments?: readonly { _ref?: string }[]; question?: string; sortOrder?: number }`
  - `interface DepartmentFaqReference { _key: string; _ref: string; _type: 'reference'; _strengthenOnPublish?: { type: 'faq' }; _weak?: true }`
  - `buildDepartmentFaqs(input: { departmentId: string; faqs: readonly FaqVersion[]; forDraft: boolean }): DepartmentFaqReference[]`
  - `isSameFaqList(a: readonly DepartmentFaqReference[], b: readonly DepartmentFaqReference[]): boolean` (gleiche `_ref` in gleicher Reihenfolge, gleiche `_weak`)
  - Default-Export `defineMigration({ documentTypes: ['department'], title: 'FAQ-Zuordnung in die Abteilungen übernehmen', migrate: { async document(doc, context) } })`

**Regeln für `buildDepartmentFaqs`** (aus der Spec, Abschnitt „Migration“):

- `departmentId` ist die veröffentlichte ID. IDs mit `versions.` werden ignoriert.
- `forDraft: false`: nur veröffentlichte Fragen (ID ohne `drafts.`), mit deren `departments` und `sortOrder`.
- `forDraft: true`: pro Frage der Entwurf, sonst die veröffentlichte Fassung.
- Filter: `departments[]._ref` enthält `departmentId`. Sortierung: `sortOrder` aufsteigend (fehlend zuletzt), dann `question` nach Codepoint (wie GROQs `order`).
- Verweis: `_ref` und `_key` = veröffentlichte ID der Frage. `forDraft` und keine veröffentlichte Fassung → zusätzlich `_weak: true`, `_strengthenOnPublish: { type: 'faq' }`.

**Ablauf von `document(doc, context)`:**

1. Hat `doc` schon `faqs` → `[]`.
2. Alle Fragen in der Perspektive `raw` lesen (`*[_type == "faq"]{ _id, departments[]{ _ref }, question, sortOrder }`). Die Standardperspektive des Clients ist für neue API-Versionen `published` und würde die Entwürfe verstecken. Ob `context.client` `withConfig` oder eine `perspective`-Option bei `fetch` erlaubt, steht in `AllowedMethods` von `@sanity/migrate`.
3. Liste für die eigene Fassung bauen (`forDraft` = `_id` beginnt mit `drafts.`); nicht leer → `patch(doc._id, at('faqs', setIfMissing(list)))`.
4. Nur für die veröffentlichte Fassung: Entwurfsliste bauen. Weicht sie ab (`!isSameFaqList`) und gibt es `drafts.<id>` nicht (raw `count`) → `createIfNotExists({ ...doc ohne _rev/_createdAt/_updatedAt, _id: 'drafts.' + id, faqs: draftList })`.
5. Rückgabe als `Mutation[]` (`patch`, `createIfNotExists` aus `sanity/migrate`).

`faq-drop-assignment`: `documentTypes: ['faq']`, Titel „Alte FAQ-Zuordnung entfernen“, gibt `at('departments', unset())` und `at('sortOrder', unset())` nur für Felder zurück, die gesetzt sind.

- [ ] **Step 1: Write the failing tests** (`department-faqs/index.test.ts`, Muster wie `news-category-icons/index.test.ts`)

```ts
const faqs: FaqVersion[] = [
	{
		_id: 'faq-shared',
		departments: [{ _ref: 'department-a' }, { _ref: 'department-b' }],
		question: 'Beitrag',
		sortOrder: 900,
	},
	{
		_id: 'drafts.faq-shared',
		departments: [{ _ref: 'department-b' }],
		question: 'Beitrag',
		sortOrder: 900,
	},
	{
		_id: 'drafts.faq-new',
		departments: [{ _ref: 'department-a' }],
		question: 'Alter',
		sortOrder: 110,
	},
	{ _id: 'faq-z', departments: [{ _ref: 'department-a' }], question: 'Zeiten', sortOrder: 110 },
	{
		_id: 'versions.r1.faq-x',
		departments: [{ _ref: 'department-a' }],
		question: 'X',
		sortOrder: 1,
	},
];

it('keeps the published department to published FAQs', () => {
	expect(
		buildDepartmentFaqs({ departmentId: 'department-a', faqs, forDraft: false }).map(
			(ref) => ref._ref,
		),
	).toStrictEqual(['faq-z', 'faq-shared']);
});

it('builds the draft from the newest version of every FAQ', () => {
	expect(buildDepartmentFaqs({ departmentId: 'department-a', faqs, forDraft: true })).toStrictEqual(
		[
			{
				_key: 'faq-new',
				_ref: 'faq-new',
				_strengthenOnPublish: { type: 'faq' },
				_type: 'reference',
				_weak: true,
			},
			{ _key: 'faq-z', _ref: 'faq-z', _type: 'reference' },
		],
	);
});

it('orders by sort order, then by question', () => {
	/* faq-new „Alter“ vor faq-z „Zeiten“ bei gleicher sortOrder 110, siehe oben */
});
it('ignores release versions', () => {
	/* versions.r1.faq-x taucht in keiner Liste auf */
});
it('leaves a department that already has faqs alone', async () => {
	/* document({ ...doc, faqs: [] }, fakeContext) → [] */
});
it('creates the missing draft', async () => {
	/* published department-a ohne Entwurf → enthält createIfNotExists mit _id 'drafts.department-a' */
});
it('creates no draft when both lists match', async () => {
	/* nur Fragen mit veröffentlichter Fassung und gleicher Zuordnung → kein createIfNotExists */
});
```

`faq-drop-assignment/index.test.ts`: „removes the departments and the sort order“, „changes nothing on a FAQ without them“.

- [ ] **Step 2: Run, expect FAIL**: `pnpm --filter studio exec vp test run migrations/department-faqs migrations/faq-drop-assignment`
- [ ] **Step 3: Implementieren** nach den Interfaces und Regeln oben.
- [ ] **Step 4: Run, expect PASS**, dann `pnpm --filter studio run typecheck` und `pnpm --filter studio run lint`.
- [ ] **Step 5: Trockenlauf gegen `production`** (liest nur): `pnpm --filter studio exec sanity migration run department-faqs --project j4rxwl5m --dataset production`. Erwartet: Patches nur auf den sechs `drafts.department-*`, keiner auf veröffentlichten Abteilungen, kein `createIfNotExists`, Reihenfolge wie in der Spec („Erwartetes Ergebnis“). Abweichungen erst klären, dann weiter.
- [ ] **Step 6: Commit** (`create-commit`): `feat(studio): migrate faq assignments into the departments`

---

### Task 5: Website-Abfragen

**Files:**

- Modify: `apps/web/src/lib/sanity/queries/departments.ts` (`departmentPageQuery`, JSDoc), `apps/web/src/lib/sanity/queries/search.ts` (`searchCandidatesQuery`)
- Modify: `pnpm-workspace.yaml`, `apps/web/package.json` (`groq-js` als devDependency über den Katalog)
- Generated: `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`
- Test: `apps/web/src/lib/sanity/queries/departments.test.ts`, `apps/web/src/lib/sanity/queries/search.test.ts`

**Interfaces:**

- Consumes: `department.faqs` (Task 1), `faq` ohne `departments`/`sortOrder` (Task 2).
- Produces: `departmentPageQuery` liefert `faqs: Array<{ _id; question; answer; answerText; isMarkedUp: boolean }>` in der Reihenfolge von `department.faqs`, ohne unaufgelöste Einträge. `searchCandidatesQuery` liefert für eine FAQ `targets` wie bisher, aus den Abteilungen, deren `faqs` sie enthalten, nach `sortOrder`.

- [ ] **Step 1: `groq-js` hinzufügen**: `pnpm --filter web add -D groq-js` (schreibt `catalog:`). `pnpm run knip` muss sauber bleiben.

- [ ] **Step 2: Write the failing tests** in `departments.test.ts`. Die bisherigen String-Tests zu `departments[]._ref`, `order(sortOrder asc, question asc)` und `departments[0]._ref` entfallen. Neu: ein Helfer `runDepartmentPage(slug: string, dataset?: readonly object[]): Promise<{ faqs: { _id: string; answerText?: string; isMarkedUp?: boolean }[] }>`, der `departmentPageQuery` mit `parse`/`evaluate` aus `groq-js` gegen einen kleinen Datensatz ausführt. Datensatz: zwei Abteilungen `department-a` (`sortOrder` 10, Slug `a`, `faqs` = `faq-shared`) und `department-b` (`sortOrder` 20, Slug `b`, `faqs` = `faq-b2`, `faq-shared`, `faq-gone`, `faq-b1`); Fragen `faq-shared`, `faq-b1` und `faq-b2`, deren Antwort ein Block mit dem Text „Dienstags und donnerstags.“ ist. `faq-gone` gibt es nicht.

```ts
it('keeps the order of the department', async () => {
	expect((await runDepartmentPage('b')).faqs.map((faq) => faq._id)).toStrictEqual([
		'faq-b2',
		'faq-shared',
		'faq-b1',
	]);
});

it('drops a FAQ that does not resolve', async () => {
	expect((await runDepartmentPage('b')).faqs).not.toContainEqual(null);
	expect((await runDepartmentPage('b')).faqs.map((faq) => faq._id)).not.toContain('faq-gone');
});

it('marks up a shared FAQ on the first department only', async () => {
	expect(
		(await runDepartmentPage('a')).faqs.find((faq) => faq._id === 'faq-shared')?.isMarkedUp,
	).toBe(true);
	expect(
		(await runDepartmentPage('b')).faqs.find((faq) => faq._id === 'faq-shared')?.isMarkedUp,
	).toBe(false);
	expect((await runDepartmentPage('b')).faqs.find((faq) => faq._id === 'faq-b1')?.isMarkedUp).toBe(
		true,
	);
});

it('breaks a sort order tie by id', async () => {
	/* beide Abteilungen sortOrder 10 → department-a zeichnet faq-shared aus */
});

it('reads the answer as plain text', async () => {
	expect((await runDepartmentPage('b')).faqs[0]?.answerText).toBe('Dienstags und donnerstags.');
});
```

`search.test.ts`: „finds the departments of a FAQ by their faqs field“: enthält `"targets": *[_type == 'department' && ^._id in faqs[]._ref]` und nicht `departments[]->`.

- [ ] **Step 3: Run, expect FAIL**: `pnpm --filter web exec vp test run src/lib/sanity/queries`

- [ ] **Step 4: Abfragen ändern**
  - `departmentPageQuery`: `"faqs": faqs[]-> { _id, question, "answer": …, "answerText": pt::text(answer), "isMarkedUp": *[_type == 'department' && ^._id in faqs[]._ref] | order(sortOrder asc, _id asc)[0]._id == ^._id }` plus ein Filter auf `defined(_id)`. Wirkt der Filter hinter der Projektion pro Element statt auf das Array, die Projektion klammern. Der Test entscheidet.
  - JSDoc neu: Die FAQ kommen in der Reihenfolge von `faqs`; `isMarkedUp` nennt die Abteilung mit der kleinsten `sortOrder` (Gleichstand: `_id`), die die Frage führt; die Gegenrichtung prüft `faqs[]._ref`, nicht `references()`, damit nur `faqs` zählt.
  - `searchCandidatesQuery`: `"targets": *[_type == 'department' && ^._id in faqs[]._ref] | order(sortOrder asc) { ${searchTarget} }`.

- [ ] **Step 5: Typen erzeugen**: `pnpm run extract-types && pnpm run typegen:sanity`

- [ ] **Step 6: Run, expect PASS**: `pnpm --filter web exec vp test run`, dann `pnpm run typecheck` (Root). `page.test.ts`, `structured-data.test.ts`, `merge.test.ts` und `search-site.test.ts` müssen unverändert grün sein, weil die Form der Ergebnisse gleich bleibt.

- [ ] **Step 7: Commit** (`create-commit`): `feat(web): read faq from the department`

---

### Task 6: e2e-Fixtures neu verschlüsseln

**Files:**

- Modify: die 6 Fixtures in `apps/web/e2e/fixtures/sanity/` mit `departments[]._ref` in `body.query` und die 1 Fixture mit `"targets": departments[]->` (Dateinamen ändern sich)

Vorgehen nach `apps/web/AGENTS.md` („Fixtures“) und der Schlüsselfunktion `fixtureKey` in `apps/web/e2e/mocks/preload.ts`: SHA-256 über `pathname?params` ohne `VOLATILE_PARAMS`, sortiert, erste 16 Hex-Zeichen. Nicht neu aufnehmen: `development` hat heute keine FAQ mehr, eine Aufnahme würde die FAQ aus den Fixtures löschen.

- [ ] **Step 1: Skript im Scratchpad schreiben** (nicht im Repo), das für jede betroffene Fixture den `query`-Parameter in `url` und `body.query` durch den neuen Text ersetzt. Der neue Text ist das Query-Literal aus `apps/web/src/types/sanity.types.generated.ts`. Die Datei kommt unter den neuen Schlüssel, die alte wird gelöscht, `body.result` bleibt unverändert.
- [ ] **Step 2: Formatieren**: `pnpm exec vp fmt apps/web/e2e/fixtures/sanity`
- [ ] **Step 3: Verify**: `pnpm run test:e2e`. Erwartet: grün, kein „No Sanity fixture“ im Log, `structured-data.spec.ts` sieht weiter vier ausgezeichnete Fragen auf `/angebot/fussball`. Läuft parallel eine andere Session auf Port 3100 und die Ergebnisse wirken fremd, auf eigenem Port wiederholen.
- [ ] **Step 4: Commit** (`create-commit`): `test(web): rekey the faq fixtures`

---

### Task 7: Doku, Studio-Check, `development`

**Files:**

- Modify: `apps/studio/AGENTS.md` (Abschnitt „Departments and groups“ → „FAQ“, „Preview“ → `LOCATION_QUERIES`, „Content migrations“), `apps/web/AGENTS.md` (`getFaqPageSchema`, Suche „A FAQ leads to the departments it belongs to“)

- [ ] **Step 1: Doku schreiben.** FAQ-Absatz: Zuordnung und Reihenfolge nur in `department.faqs` (feste Verweise, „Neu erstellen“ erlaubt, erst die Frage veröffentlichen); die Frage zeigt „Verwendet in“ und warnt ohne Zuordnung; Auszeichnungsregel (kleinste `sortOrder`, Gleichstand `_id`); Desk alphabetisch; die Migrationen `department-faqs` und dann `faq-drop-assignment`, mit Datum des `development`-Laufs.
- [ ] **Step 2: Studio im Browser prüfen** (`pnpm --filter studio run dev`, Browser-Pane, Dataset `development`). Vor dem Anlegen einer Testfrage den Nutzer fragen; sie wird danach wieder gelöscht (ebenfalls erst nach OK). Geprüft wird: In „Fußball“ › „Inhalt“ eine Frage anlegen, eine zweite auswählen, per Ziehen umsortieren; „Verwendet in“ an der Frage; Warnung an einer Frage ohne Abteilung; die Vorschau zeigt die neue Reihenfolge. Und: Erkennt man in der Abteilung, dass eine neu angelegte Frage noch unveröffentlicht ist? Wenn nicht, `validateDepartmentFaqsPublished(faqs, context): Promise<string | true>` als Warnung an `faqs` ergänzen („Noch nicht veröffentlicht: <Frage>. Erst die Frage veröffentlichen, dann die Abteilung.“), mit Test im Muster von Task 2.
- [ ] **Step 3: Migrationen auf `development`** (nach OK des Nutzers): je ein Trockenlauf, dann `--no-dry-run --no-confirm`, erst `department-faqs`, dann `faq-drop-assignment`. Erwartet: praktisch keine Änderung, weil `development` keine FAQ hat (außer der Testfrage aus Step 2, falls noch vorhanden).
- [ ] **Step 4: Gesamtlauf**: `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:coverage`, `pnpm run knip`, `pnpm run format:check`.
- [ ] **Step 5: Release-Checkliste ergänzen** (work state `release-next-to-main-2026-10`): auf `production` `department-faqs`, dann `faq-drop-assignment` (Trockenlauf, dann echt); danach die WEB-417-Entwürfe veröffentlichen, erst die 22 Fragen, dann die sechs Abteilungen.
- [ ] **Step 6: Commit** (`create-commit`): `docs: describe faq assignment in departments`
