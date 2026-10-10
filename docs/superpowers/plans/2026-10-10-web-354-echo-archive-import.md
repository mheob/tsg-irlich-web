# WEB-354 TSG-Echo Archive Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A script `apps/studio/scripts/import-echo.ts` imports the 40 old TSG-Echo issues from a local folder into the Sanity Content Release "TSG-Echo-Archiv". Each issue arrives rendered and with a drafted intro. No issue is indexable, and nothing goes online until the editors publish the release.

**Architecture:**

- The script runs through `sanity exec --with-user-token`, so it writes as the logged-in editor. No token goes into a file.
- It is split into small modules under `apps/studio/scripts/import-echo/`. Each takes its collaborators as arguments, like the render pipeline in `apps/web/src/lib/echo/render-issue.ts`, so every module is tested without Sanity, pdf.js or the network:
  - `manifest.ts` validates `manifest.json` and turns every entry into an `IssuePlan`, with the document id from the file name and the slug from the title.
  - `issue-document.ts` holds the release values and builds the `echo.issue` document. `render.source` is already set to the uploaded PDF, so the render webhook's filter skips it.
  - `intro.ts` drafts the intro through the Anthropic Messages API, from the cover, the next two pages and the start of the text layer.
  - `archive-store.ts` is the only module that talks to Sanity: release, existence check, uploads, versions, verification query.
  - `run-import.ts` runs the issues one after the other. A dry run is the default: it renders every PDF locally but writes nothing. The run skips every issue that exists in any form, records failures without stopping, and at the end checks that no issue before 2013 is indexable.
  - `options.ts` parses the command line.
- Before the import, `getDownloadFileUrl` in the web app encodes the download name (deferred minor #8 of WEB-367). Editors upload PDFs with any name, and a `&` or `#` in it cuts the URL today.

**Tech Stack:** Sanity CLI 8 (`sanity exec`, which loads the script through Vite's `runnerImport` with `tsconfigPaths`), `@sanity/client` 8.9 (`releases.create`, `releases.get`, `createVersion`, `assets.upload`), `@tsgi-web/pdf-pages`, Zod 4, `node:util` `parseArgs` with `allowNegative` (Node 24), Anthropic Messages API over `fetch`, Vitest through Vite+, GitButler (`but`).

**Spec:**

- Linear [WEB-354](https://linear.app/tsg-irlich/issue/WEB-354/tsg-echo-archiv-der-alten-ausgaben-importieren): scope and acceptance criteria.
- Linear [WEB-58](https://linear.app/tsg-irlich/issue/WEB-58/tsg-echo), section "Import der alten Ausgaben" and "Render-Pipeline".
- Linear [WEB-353](https://linear.app/tsg-irlich/issue/WEB-353/tsg-echo-datenschutz-ausgabenliste-und-hero-foto-klaren), comments of 2026-10-10:
  - "Bestandsaufnahme" with the draft `manifest.json` (40 entries)
  - "Datenschutz: Entscheidungsvorlage", option B
  - the note that option B is implemented in WEB-367
- WEB-367 (merged as #633): `indexable` on `echo.issue`, and the import must switch it off.
- The user's decisions of 2026-10-10:
  - two PRs: WEB-367 first, then this import
  - option B for the old issues

**Branch:** `feat/web-354-echo-archive-import`. GitButler creates it on the first `but commit -b`.

## Global Constraints

**Scope and git**

- Commits go through the `create-commit` skill (`but commit -b feat/web-354-echo-archive-import -m "…" <ids>`).
  - Conventional Commits, English message, subject at most 50 characters, no `Co-Authored-By` or generator trailer.
  - Never a raw `git` write command.
- Run `pnpm run format:check` from the repository root before every commit, because `but commit` skips lefthook.
- After every task these must be clean:
  - `pnpm run lint`, with 0 warnings
  - `pnpm run typecheck`
  - the tests of the touched workspaces
- The PR is opened **ready for review** (the user's standing rule) through the `create-pr` skill, with "Closes WEB-354" in the body. Kodiak merges it on green, so the trial run in Task 8 happens before the PR.

**Data and secrets**

- Claude never writes to the Sanity dataset `production`. The production import is the user's step after the merge.
- Writes to `development` happen only in Task 8. They need the user's explicit yes immediately before.
- No real TSG-Echo content in the repository, in fixtures or in Sanity `development`. An asset is public on `cdn.sanity.io` from the moment it is uploaded, even while its document sits in an unpublished release. The trial run in Task 8 therefore uses synthetic PDFs only.
  - File names and titles from the WEB-353 manifest are metadata and may appear in tests (`1980 - TSG Irlich - 3.Echo.pdf`, `TSG ECHO 1979 Nr. 1`).
- `ANTHROPIC_API_KEY` only ever comes from the shell of whoever runs the script. It never goes into the repository, an `.env` file, Vercel or `turbo.json`. Claude never enters or reads one.
- Deleting data is the user's step, including archiving a release, which deletes its versions.

**Values (exact)**

- Release:
  - id `tsg-echo-archiv`
  - title `TSG-Echo-Archiv`
  - description `Die alten Ausgaben 1979–2012 aus dem Import (WEB-354). Intros prüfen, dann den Release veröffentlichen.`
  - `releaseType: 'undecided'`
- Document id: `echo-archiv-` plus the PDF's file name without `.pdf`. The name is lowercased, every run of characters other than `a-z0-9` becomes `-`, and leading and trailing `-` are dropped. `1980-1989/1980 - TSG Irlich - 3.Echo.pdf` → `echo-archiv-1980-tsg-irlich-3-echo`.
- Slug: `slugify(titel)` from `apps/studio/utils/strings.ts`, the slug field's own function. `TSG ECHO 1979 Nr. 1` → `tsg-echo-1979-nr-1`.
- Uploaded PDF file name: `<slug>.pdf`.
- Page images: `echo-<first 8 hex of the PDF hash>-seite-<3-digit page number>.jpg`, array `_key` `seite-<n>`, the same as the render route.
- `extractedText`: `--- Seite <n> ---\n<text>` for every page with text, joined by a blank line, the same as the render route.
- Every imported document: `indexable: false`, `render: { finishedAt, pageCount, source: <pdf asset id>, startedAt, status: 'done' }`.
- Verification cutoff: `2013-01-01`. In the raw perspective no `echo.issue` with `releaseDate < "2013-01-01"` may have `indexable != false`.
- Intro:
  - model `claude-sonnet-5-5`, `max_tokens: 400`
  - **Amended after the final review:**
    - `max_tokens: 2000`, and any `stop_reason` other than `end_turn` counts as failed.
    - Up to three attempts for 429, 5xx and 529, honouring `retry-after`.
    - A key check through `GET /v1/models/claude-sonnet-5-5` before a real run.
    - A `--release <id>` option (default `tsg-echo-archiv`), named in the refusal message.
  - endpoint `https://api.anthropic.com/v1/messages`, header `anthropic-version: 2023-06-01`
  - at most 3 page images (cover first), each at most 3 750 000 bytes raw
  - at most 6000 characters of text
- `sanity exec` client: `getCliClient({ apiVersion: '2026-10-01' }).withConfig({ dataset, useCdn: false })`.
- Package script in `apps/studio/package.json`: `"import:echo": "sanity exec scripts/import-echo.ts --with-user-token --"`.
- Options:
  - `--dataset` (required)
  - `--folder` (required)
  - `--manifest` (default `<folder>/manifest.json`)
  - `--no-dry-run` to write
  - `--no-intro` to skip the intros

**Code style** (as in WEB-352 and WEB-367)

- Tabs, single quotes, named exports, types at the end of a file, kebab-case names, JSDoc on every top-level function, export block at the end.
- `sort-keys`, `no-magic-numbers` (0 to 9 free), `max-statements` 10 and `max-params` 3 outside tests.
- No `try`/`catch`. Branch on `settle()` from `@tsgi-web/shared`.
- Messages a person reads (errors, log lines) are German. Code, comments and tests are English.
- Tests:
  - import from `vite-plus/test`
  - no conditionals inside `it`
  - the script tests run in Node: `// @vitest-environment node` as the first line (the studio default is jsdom)

## Review Focus

1. **A run that stops halfway.** For example a crash after the PDF and some pages are uploaded but before the version exists, or a rerun after a complete run. The rerun creates no duplicates: it skips every document that exists in any form (published, draft, version in the release). An issue without a version is imported again, and Sanity deduplicates its assets by content hash. Pinned in Task 6.
2. **A manifest entry that points outside the folder or at something that is not a PDF.** For example `../geheim.pdf`, `/etc/passwd`, `1979_01.docx`, or two entries that give the same id or slug. The manifest is rejected before anything is read or written. Pinned in Task 2.
3. **A download name with `&`, `#`, spaces or umlauts.** For example `Jahresrückblick & Termine #1.pdf`. The `?dl=` value is encoded, so the URL stays whole and the browser saves the file under its name. Pinned in Task 1.
4. **The release is already published or archived.** For example a second run after the editors published "TSG-Echo-Archiv". The script refuses before uploading anything instead of writing versions into a release that will never run. Pinned in Task 6.
5. **An issue the intro model cannot read well.** For example a scan without a text layer, a page image above the API's size limit, or an API error. The intro is drafted from what is there, and an API failure leaves the issue imported without an intro and listed in the summary. Pinned in Tasks 4 and 6.

---

### Task 1: Encode the download name

**Files:**

- Modify: `apps/web/src/lib/sanity/utils.ts:21-28`
- Test: `apps/web/src/lib/sanity/utils.test.ts` (block `building a download link for a file asset`)
- Test: `apps/web/src/lib/echo/archive-url.test.ts`

**Interfaces:**

- Produces: `getDownloadFileUrl(asset)` returns `<url>?dl=<encodeURIComponent(originalFilename)>`. The signature is unchanged.

- [ ] **Step 1: Write the failing tests**

Add to the `describe('building a download link for a file asset', …)` block in `apps/web/src/lib/sanity/utils.test.ts`:

```ts
// Review focus 3: editors upload PDFs under any name, and an unencoded `&` or `#` cut the URL.
it('encodes the original filename in the download parameter', async () => {
	const { getDownloadFileUrl } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

	const asset = {
		originalFilename: 'Jahresrückblick & Termine #1.pdf',
		url: 'https://cdn.sanity.io/files/x/y/z.pdf',
	} as SanityFileAsset;

	expect(getDownloadFileUrl(asset)).toBe(
		'https://cdn.sanity.io/files/x/y/z.pdf?dl=Jahresr%C3%BCckblick%20%26%20Termine%20%231.pdf',
	);
});
```

Add to the `describe('archive urls', …)` block in `apps/web/src/lib/echo/archive-url.test.ts`:

```ts
// An encoded download name must survive the move below the archive path unchanged.
it('keeps an already encoded download name as it is', () => {
	expect(
		toArchiveUrl(
			'https://cdn.sanity.io/files/j4rxwl5m/production/9f8e.pdf?dl=a%20%26%20b%20%231.pdf',
		),
	).toBe('/echo-archiv/files/9f8e.pdf?dl=a%20%26%20b%20%231.pdf');
});
```

- [ ] **Step 2: Run them**

Run: `pnpm --filter web exec vp test run src/lib/sanity/utils.test.ts src/lib/echo/archive-url.test.ts` Expected:

- FAIL: `encodes the original filename in the download parameter`, received `…?dl=Jahresrückblick & Termine #1.pdf`
- PASS: the archive test, which pins existing behaviour and becomes the guard for the change

- [ ] **Step 3: Encode the name**

In `apps/web/src/lib/sanity/utils.ts`, replace the return line of `getDownloadFileUrl`:

```ts
return `${downloadAsset.url}?dl=${encodeURIComponent(downloadAsset.originalFilename)}`;
```

- [ ] **Step 4: Run the web tests**

Run: `pnpm --filter web exec vp test run` Expected: PASS. Existing tests only use ASCII names without reserved characters (`tsg-echo-2025.pdf`, `beitritt.pdf`), so their expectations stay.

- [ ] **Step 5: Commit**

```bash
pnpm run format:check
but diff
but commit -b feat/web-354-echo-archive-import -m "fix(web): encode the download name of a file" <ids of the three files>
```

---

### Task 2: Manifest and issue plans

**Files:**

- Create: `apps/studio/scripts/import-echo/manifest.ts`
- Test: `apps/studio/scripts/import-echo/manifest.test.ts`
- Modify: `apps/studio/vitest.config.ts` (coverage `include`)

**Interfaces:**

- Produces:
  - `parseManifest(json: unknown): IssuePlan[]`. It throws an `Error` with a German message for an invalid manifest.
  - `toDocumentId(file: string): string`
  - `interface IssuePlan { documentId: string; file: string; releaseDate: string; slug: string; title: string }`. `file` is relative to the folder, as in the manifest.
- Consumed by Tasks 3, 6 and 7.

- [ ] **Step 1: Write the failing tests**

`apps/studio/scripts/import-echo/manifest.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { parseManifest, toDocumentId } from './manifest';

const ENTRY = {
	datei: '1979 Erste Exemplare/1979_01.pdf',
	erscheinungsdatum: '1979-03-01',
	titel: 'TSG ECHO 1979 Nr. 1',
};

describe('document ids', () => {
	it.each([
		['1979 Erste Exemplare/1979_01.pdf', 'echo-archiv-1979-01'],
		['1980-1989/1980 - TSG Irlich - 3.Echo.pdf', 'echo-archiv-1980-tsg-irlich-3-echo'],
		[
			'1980-1989/1982 - TSG Irlich - 2.Echo - 100 Jahre TSG Irlich.pdf',
			'echo-archiv-1982-tsg-irlich-2-echo-100-jahre-tsg-irlich',
		],
		['2000-2012/2012_03.PDF', 'echo-archiv-2012-03'],
	])('derives the id of %s from its file name', (file, id) => {
		expect(toDocumentId(file)).toBe(id);
	});
});

describe('the manifest', () => {
	it('turns an entry into a plan with id, slug, date and file', () => {
		expect(parseManifest([ENTRY])).toStrictEqual([
			{
				documentId: 'echo-archiv-1979-01',
				file: '1979 Erste Exemplare/1979_01.pdf',
				releaseDate: '1979-03-01',
				slug: 'tsg-echo-1979-nr-1',
				title: 'TSG ECHO 1979 Nr. 1',
			},
		]);
	});

	it('slugs the title of the anniversary issue like the studio does', () => {
		const [plan] = parseManifest([
			{ ...ENTRY, titel: 'TSG ECHO 1982 Nr. 2 – 100 Jahre TSG Irlich' },
		]);

		expect(plan?.slug).toBe('tsg-echo-1982-nr-2-100-jahre-tsg-irlich');
	});

	it('trims the title', () => {
		expect(parseManifest([{ ...ENTRY, titel: '  TSG ECHO 1979 Nr. 1 ' }])[0]?.title).toBe(
			'TSG ECHO 1979 Nr. 1',
		);
	});

	// Review focus 2: nothing outside the folder, nothing that is not a PDF.
	it.each([
		['a path leaving the folder', '../geheim.pdf'],
		['a nested path leaving the folder', '1979/../../geheim.pdf'],
		['an absolute path', '/etc/passwd.pdf'],
		['another file type', '1979_01.docx'],
		['a name without letters or digits', '1979/---.pdf'],
	])('rejects %s', (_label, datei) => {
		expect(() => parseManifest([{ ...ENTRY, datei }])).toThrow('Die manifest.json ist ungültig');
	});

	it.each([
		['an impossible date', { ...ENTRY, erscheinungsdatum: '1979-02-30' }],
		['a date with a time', { ...ENTRY, erscheinungsdatum: '1979-03-01T10:00:00Z' }],
		['an empty title', { ...ENTRY, titel: ' ' }],
	])('rejects %s', (_label, entry) => {
		expect(() => parseManifest([entry])).toThrow('Die manifest.json ist ungültig');
	});

	it('rejects an empty list and anything that is not a list', () => {
		expect(() => parseManifest([])).toThrow('Die manifest.json ist ungültig');
		expect(() => parseManifest({ datei: 'x.pdf' })).toThrow('Die manifest.json ist ungültig');
	});

	// Two files with the same name in different folders would become one document.
	it('rejects two entries that give the same document id', () => {
		expect(() =>
			parseManifest([
				ENTRY,
				{ ...ENTRY, datei: 'Kopie/1979_01.pdf', titel: 'TSG ECHO 1979 Nr. 9' },
			]),
		).toThrow(
			'Doppelte Dokument-IDs (aus dem Dateinamen) in der manifest.json: echo-archiv-1979-01',
		);
	});

	it('rejects two entries that give the same slug', () => {
		expect(() => parseManifest([ENTRY, { ...ENTRY, datei: '1979_02.pdf' }])).toThrow(
			'Doppelte Slugs (aus dem Titel) in der manifest.json: tsg-echo-1979-nr-1',
		);
	});
});
```

- [ ] **Step 2: Run them**

Run: `pnpm --filter studio exec vp test run scripts/import-echo/manifest.test.ts` Expected: FAIL with "Failed to resolve import "./manifest"".

- [ ] **Step 3: Write `manifest.ts`**

```ts
import path from 'node:path';

import { z } from 'zod';

import { slugify } from '@/utils/strings';

const ID_PREFIX = 'echo-archiv-';
const PDF_EXTENSION = /\.pdf$/iu;
const NON_ID_CHARACTERS = /[^a-z0-9]+/gu;
const EDGE_DASHES = /^-+|-+$/gu;

const KEY_LABELS: Record<UniqueKey, string> = {
	documentId: 'Dokument-IDs (aus dem Dateinamen)',
	slug: 'Slugs (aus dem Titel)',
};

/**
 * The id part a file name gives: lowercased, every other run of characters a dash.
 *
 * @param file - The path of the PDF, relative to the folder.
 * @returns The name without `.pdf`, empty when it has no letters or digits.
 */
function toIdPart(file: string): string {
	return path.posix
		.basename(file)
		.replace(PDF_EXTENSION, '')
		.toLowerCase()
		.replaceAll(NON_ID_CHARACTERS, '-')
		.replaceAll(EDGE_DASHES, '');
}

/**
 * The document id of an issue. It comes from the file name, so a rerun finds the same document and
 * a corrected title in the manifest does not create a second one.
 *
 * @param file - The path of the PDF, relative to the folder.
 * @returns The id, e.g. `echo-archiv-1979-01`.
 */
function toDocumentId(file: string): string {
	return `${ID_PREFIX}${toIdPart(file)}`;
}

/**
 * Whether a manifest path names a PDF inside the folder.
 *
 * @param file - The `datei` of an entry.
 * @returns `false` for an absolute path, a `..` segment, another extension or a name without
 *   letters or digits.
 */
function isImportablePdf(file: string): boolean {
	return (
		!path.isAbsolute(file) &&
		!file.split(/[/\\]/u).includes('..') &&
		PDF_EXTENSION.test(file) &&
		toIdPart(file) !== ''
	);
}

const manifestSchema = z
	.array(
		z.object({
			datei: z.string().refine(isImportablePdf, 'muss eine PDF innerhalb des Ordners sein'),
			erscheinungsdatum: z.iso.date(),
			titel: z.string().trim().min(1),
		}),
	)
	.min(1);

/**
 * Throws when two plans share a value that has to be unique.
 *
 * @param plans - The plans of the manifest.
 * @param key - The property to check.
 * @throws {Error} Naming every duplicate value.
 */
function assertUnique(plans: readonly IssuePlan[], key: UniqueKey): void {
	const seen = new Set<string>();
	const duplicates = new Set<string>();
	for (const plan of plans) {
		if (seen.has(plan[key])) {
			duplicates.add(plan[key]);
		}
		seen.add(plan[key]);
	}
	if (duplicates.size > 0) {
		throw new Error(
			`Doppelte ${KEY_LABELS[key]} in der manifest.json: ${[...duplicates].join(', ')}`,
		);
	}
}

/**
 * Validates `manifest.json` and plans one document per entry.
 *
 * @param json - The parsed content of `manifest.json`.
 * @returns The plans, in the order of the manifest.
 * @throws {Error} For an invalid entry or a duplicate id or slug, before anything is written.
 */
function parseManifest(json: unknown): IssuePlan[] {
	const parsed = manifestSchema.safeParse(json);
	if (!parsed.success) {
		throw new Error(`Die manifest.json ist ungültig:\n${z.prettifyError(parsed.error)}`);
	}
	const plans = parsed.data.map((entry) => ({
		documentId: toDocumentId(entry.datei),
		file: entry.datei,
		releaseDate: entry.erscheinungsdatum,
		slug: slugify(entry.titel),
		title: entry.titel,
	}));
	assertUnique(plans, 'documentId');
	assertUnique(plans, 'slug');
	return plans;
}

type UniqueKey = 'documentId' | 'slug';

interface IssuePlan {
	documentId: string;
	/** The path of the PDF, relative to the folder. */
	file: string;
	/** `YYYY-MM-DD`. */
	releaseDate: string;
	slug: string;
	title: string;
}

export { parseManifest, toDocumentId };
export type { IssuePlan };
```

`manifestSchema` uses `isImportablePdf` at module level, so it comes after the function. The code stays in declaration order.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter studio exec vp test run scripts/import-echo/manifest.test.ts` Expected: PASS.

If `z.iso.date()` accepts `1979-02-30`, rule it in the ledger, and add `.refine((date) => !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().startsWith(date))` to the date.

- [ ] **Step 5: Count the scripts in the coverage**

In `apps/studio/vitest.config.ts`, add `scripts` to `coverage.include`:

```ts
			include: ['{actions,lib,plugins,schemas,scripts,structure,utils}/**/*.{ts,tsx}'],
```

Run: `pnpm --filter studio run test:coverage` Expected: PASS, thresholds met.

- [ ] **Step 6: Commit**

```bash
pnpm run lint && pnpm run typecheck && pnpm run format:check
but diff
but commit -b feat/web-354-echo-archive-import -m "feat(studio): validate the tsg-echo import manifest" <ids>
```

---

### Task 3: Release values and the issue document

**Files:**

- Create: `apps/studio/scripts/import-echo/issue-document.ts`
- Test: `apps/studio/scripts/import-echo/issue-document.test.ts`

**Interfaces:**

- Consumes: `IssuePlan` (Task 2)
- Produces:
  - constants `ARCHIVE_CUTOFF = '2013-01-01'`, `RELEASE_ID = 'tsg-echo-archiv'`, `RELEASE_TITLE`, `RELEASE_DESCRIPTION`
  - `toPageFilename(pdfAssetId: string, index: number): string`. It throws for an id that is not a PDF asset.
  - `toPageEntry(assetId: string, index: number): EchoPage`
  - `toPageText(page: { index: number; text: string }): string | undefined`
  - `buildIssueDocument(plan: IssuePlan, content: IssueContent): EchoIssueDocument`
  - types `EchoPage`, `IssueContent`, `EchoIssueDocument`
- Consumed by Tasks 5 and 6.

- [ ] **Step 1: Write the failing tests**

`apps/studio/scripts/import-echo/issue-document.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { buildIssueDocument, toPageEntry, toPageFilename, toPageText } from './issue-document';
import type { IssuePlan } from './manifest';

const PDF = 'file-8c3211369d3d2da0c150d50d7cb5bca911b15f5e-pdf';
const PLAN: IssuePlan = {
	documentId: 'echo-archiv-1984-tsg-irlich-1-echo',
	file: '1980-1989/1984 - TSG Irlich - 1.Echo.pdf',
	releaseDate: '1984-03-01',
	slug: 'tsg-echo-1984-nr-1',
	title: 'TSG ECHO 1984 Nr. 1',
};
const CONTENT = {
	extractedText: '--- Seite 1 ---\nText',
	finishedAt: '2026-10-11T10:05:00.000Z',
	intro: 'Ein Intro.',
	pages: [toPageEntry('image-a-1414x2000-jpg', 1)],
	pdfAssetId: PDF,
	startedAt: '2026-10-11T10:00:00.000Z',
};

describe('page images', () => {
	// The render route names its uploads the same way, so both kinds look alike in the media library.
	it('names a page after the pdf hash and its zero-padded number', () => {
		expect(toPageFilename(PDF, 7)).toBe('echo-8c321136-seite-007.jpg');
	});

	it('refuses an id that is not a pdf asset', () => {
		expect(() => toPageFilename('image-abc-1x1-jpg', 1)).toThrow('Ungültige PDF-Asset-ID');
	});

	it('keys a page entry by its number', () => {
		expect(toPageEntry('image-a-1414x2000-jpg', 3)).toStrictEqual({
			_key: 'seite-3',
			_type: 'image',
			asset: { _ref: 'image-a-1414x2000-jpg', _type: 'reference' },
		});
	});

	it('heads the text of a page like the render route', () => {
		expect(toPageText({ index: 2, text: 'Abteilungen' })).toBe('--- Seite 2 ---\nAbteilungen');
	});

	// A scan has no text layer; its pages add nothing to `extractedText`.
	it('adds nothing for a page without text', () => {
		expect(toPageText({ index: 2, text: '' })).toBeUndefined();
	});
});

describe('the issue document', () => {
	it('builds a finished, hidden issue whose render source is its own pdf', () => {
		expect(buildIssueDocument(PLAN, CONTENT)).toStrictEqual({
			_type: 'echo.issue',
			extractedText: '--- Seite 1 ---\nText',
			indexable: false,
			intro: 'Ein Intro.',
			pages: [toPageEntry('image-a-1414x2000-jpg', 1)],
			pdf: { _type: 'file', asset: { _ref: PDF, _type: 'reference' } },
			releaseDate: '1984-03-01',
			render: {
				finishedAt: '2026-10-11T10:05:00.000Z',
				pageCount: 1,
				source: PDF,
				startedAt: '2026-10-11T10:00:00.000Z',
				status: 'done',
			},
			slug: { _type: 'slug', current: 'tsg-echo-1984-nr-1' },
			title: 'TSG ECHO 1984 Nr. 1',
		});
	});

	// Without a draft the field stays empty for the editors, instead of holding an empty string.
	it('leaves the intro out when there is none', () => {
		expect(buildIssueDocument(PLAN, { ...CONTENT, intro: undefined })).not.toHaveProperty('intro');
	});
});
```

- [ ] **Step 2: Run them**

Run: `pnpm --filter studio exec vp test run scripts/import-echo/issue-document.test.ts` Expected: FAIL with "Failed to resolve import "./issue-document"".

- [ ] **Step 3: Write `issue-document.ts`**

```ts
import type { IssuePlan } from './manifest';

const RELEASE_ID = 'tsg-echo-archiv';
const RELEASE_TITLE = 'TSG-Echo-Archiv';
const RELEASE_DESCRIPTION =
	'Die alten Ausgaben 1979–2012 aus dem Import (WEB-354). Intros prüfen, dann den Release veröffentlichen.';
/** Every issue from before this date is the old archive and must never be indexable. */
const ARCHIVE_CUTOFF = '2013-01-01';

const PDF_ASSET_ID = /^file-(?<hash>[0-9a-f]{40})-pdf$/u;
const PAGE_NUMBER_DIGITS = 3;
const SHORT_HASH_LENGTH = 8;

/**
 * The file name of an uploaded page, the same scheme as the render route's.
 *
 * @param pdfAssetId - The `_id` of the uploaded PDF, `file-<sha1>-pdf`.
 * @param index - The 1-based page number.
 * @returns The name, e.g. `echo-8c321136-seite-007.jpg`.
 * @throws {Error} For an id that is not a PDF asset.
 */
function toPageFilename(pdfAssetId: string, index: number): string {
	const hash = PDF_ASSET_ID.exec(pdfAssetId)?.groups?.hash;
	if (!hash) {
		throw new Error(`Ungültige PDF-Asset-ID ${pdfAssetId}`);
	}
	const number = String(index).padStart(PAGE_NUMBER_DIGITS, '0');
	return `echo-${hash.slice(0, SHORT_HASH_LENGTH)}-seite-${number}.jpg`;
}

/**
 * The entry of the `pages` array that references an uploaded page.
 *
 * @param assetId - The `_id` of the uploaded image.
 * @param index - The 1-based page number.
 * @returns The array item.
 */
function toPageEntry(assetId: string, index: number): EchoPage {
	return {
		_key: `seite-${index}`,
		_type: 'image',
		asset: { _ref: assetId, _type: 'reference' },
	};
}

/**
 * The block a page adds to `extractedText`, the same as the render route's.
 *
 * @param page - The page number and its text layer.
 * @returns The block, or `undefined` for a page without text.
 */
function toPageText(page: { index: number; text: string }): string | undefined {
	return page.text ? `--- Seite ${page.index} ---\n${page.text}` : undefined;
}

/**
 * The `echo.issue` an archive entry becomes. It is hidden from search engines (WEB-367), and its
 * `render.source` already names its PDF, so the render webhook's filter never picks it up.
 *
 * @param plan - The manifest entry.
 * @param content - What the run uploaded and rendered.
 * @returns The document, without `_id`: the release version derives it.
 */
function buildIssueDocument(plan: IssuePlan, content: IssueContent): EchoIssueDocument {
	return {
		_type: 'echo.issue',
		extractedText: content.extractedText,
		indexable: false,
		...(content.intro ? { intro: content.intro } : {}),
		pages: content.pages,
		pdf: { _type: 'file', asset: { _ref: content.pdfAssetId, _type: 'reference' } },
		releaseDate: plan.releaseDate,
		render: {
			finishedAt: content.finishedAt,
			pageCount: content.pages.length,
			source: content.pdfAssetId,
			startedAt: content.startedAt,
			status: 'done',
		},
		slug: { _type: 'slug', current: plan.slug },
		title: plan.title,
	};
}

interface EchoPage {
	_key: string;
	_type: 'image';
	asset: { _ref: string; _type: 'reference' };
}

interface IssueContent {
	extractedText: string;
	finishedAt: string;
	intro: string | undefined;
	pages: EchoPage[];
	pdfAssetId: string;
	startedAt: string;
}

interface EchoIssueDocument {
	_type: 'echo.issue';
	extractedText: string;
	indexable: false;
	intro?: string;
	pages: EchoPage[];
	pdf: { _type: 'file'; asset: { _ref: string; _type: 'reference' } };
	releaseDate: string;
	render: {
		finishedAt: string;
		pageCount: number;
		source: string;
		startedAt: string;
		status: 'done';
	};
	slug: { _type: 'slug'; current: string };
	title: string;
}

export {
	ARCHIVE_CUTOFF,
	RELEASE_DESCRIPTION,
	RELEASE_ID,
	RELEASE_TITLE,
	buildIssueDocument,
	toPageEntry,
	toPageFilename,
	toPageText,
};
export type { EchoIssueDocument, EchoPage, IssueContent };
```

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter studio exec vp test run scripts/import-echo/issue-document.test.ts` Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm run lint && pnpm run typecheck && pnpm run format:check
but diff
but commit -b feat/web-354-echo-archive-import -m "feat(studio): build the imported echo issue" <ids>
```

---

### Task 4: Intro draft

**Files:**

- Create: `apps/studio/scripts/import-echo/intro.ts`
- Test: `apps/studio/scripts/import-echo/intro.test.ts`

**Interfaces:**

- Produces:
  - `INTRO_PAGE_COUNT = 3`
  - `buildIntroRequest(input: IntroInput): IntroRequest`
  - `draftIntro(input: IntroInput, api: IntroApi): Promise<string>`. It throws for an HTTP error, an empty answer, or nothing to read.
  - `interface IntroInput { images: Uint8Array[]; text: string; title: string; year: string }`
  - `interface IntroApi { apiKey: string; fetch: typeof fetch }`
- Consumed by Tasks 6 (`IntroInput`, `INTRO_PAGE_COUNT`) and 7 (`draftIntro`).

- [ ] **Step 1: Write the failing tests**

`apps/studio/scripts/import-echo/intro.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it, vi } from 'vite-plus/test';

import { buildIntroRequest, draftIntro } from './intro';
import type { IntroInput } from './intro';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const INPUT: IntroInput = {
	images: [JPEG, JPEG, JPEG, JPEG],
	text: '--- Seite 1 ---\nJahreshauptversammlung',
	title: 'TSG ECHO 2010 Nr. 2',
	year: '2010',
};

/**
 * A fetch that answers once with the given status and body.
 *
 * @param status - The HTTP status.
 * @param body - The JSON body.
 * @returns The spy.
 */
function answer(status: number, body: unknown) {
	return vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe('the intro request', () => {
	it('shows the model the cover and the next two pages as jpeg images', () => {
		const [message] = buildIntroRequest(INPUT).messages;
		const images = message?.content.filter((block) => block.type === 'image');

		expect(images).toHaveLength(3);
		expect(images?.[0]).toStrictEqual({
			source: { data: '/9j/2Q==', media_type: 'image/jpeg', type: 'base64' },
			type: 'image',
		});
	});

	it('asks for the issue by title and year, with the text layer as context', () => {
		const [message] = buildIntroRequest(INPUT).messages;

		expect(message?.content.at(-1)).toStrictEqual({
			text: 'Schreibe das Intro für „TSG ECHO 2010 Nr. 2“ (2010).\n\nTextebene der Ausgabe (Auszug):\n--- Seite 1 ---\nJahreshauptversammlung',
			type: 'text',
		});
	});

	it('uses the configured model and forbids names and contact data', () => {
		const request = buildIntroRequest(INPUT);

		expect(request).toMatchObject({ max_tokens: 400, model: 'claude-sonnet-5-5' });
		expect(request.system).toContain('Nenne keine Namen von Personen');
		expect(request.system).toContain('Telefonnummern');
	});

	it('cuts the text layer after 6000 characters', () => {
		const text = buildIntroRequest({ ...INPUT, text: 'x'.repeat(7000) }).messages[0]?.content.at(
			-1,
		);

		expect(text).toMatchObject({ text: expect.stringMatching(/x{6000}$/u) });
		expect(text).not.toMatchObject({ text: expect.stringMatching(/x{6001}/u) });
	});

	// Review focus 5: a scan has no text layer.
	it('tells the model to read the pages of a scan', () => {
		const text = buildIntroRequest({ ...INPUT, text: '' }).messages[0]?.content.at(-1);

		expect(text).toStrictEqual({
			text: 'Schreibe das Intro für „TSG ECHO 2010 Nr. 2“ (2010). Die Ausgabe ist ein Scan ohne Textebene, lies die Seitenbilder.',
			type: 'text',
		});
	});

	// Review focus 5: the API takes at most 5 MB per image in base64.
	it('leaves out a page image above the size limit', () => {
		const huge = new Uint8Array(3_750_001);
		const content = buildIntroRequest({ ...INPUT, images: [huge, JPEG] }).messages[0]?.content;

		expect(content?.filter((block) => block.type === 'image')).toHaveLength(1);
	});

	it('refuses an issue with neither images nor text', () => {
		expect(() => buildIntroRequest({ ...INPUT, images: [], text: '' })).toThrow(
			'Für das Intro fehlen Seitenbilder und Text.',
		);
	});
});

describe('drafting an intro', () => {
	it('posts the request with the key and api version and returns the trimmed text', async () => {
		const fetch = answer(200, { content: [{ text: ' Ein Intro. ', type: 'text' }] });

		await expect(draftIntro(INPUT, { apiKey: 'test-key', fetch })).resolves.toBe('Ein Intro.');
		expect(fetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', {
			body: JSON.stringify(buildIntroRequest(INPUT)),
			headers: {
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json',
				'x-api-key': 'test-key',
			},
			method: 'POST',
		});
	});

	it('names the status of a failed request', async () => {
		const fetch = answer(401, { error: { type: 'authentication_error' } });

		await expect(draftIntro(INPUT, { apiKey: 'test-key', fetch })).rejects.toThrow(
			'Die Anthropic-API antwortete mit 401.',
		);
	});

	it('refuses an answer without text', async () => {
		const fetch = answer(200, { content: [{ text: '  ', type: 'text' }] });

		await expect(draftIntro(INPUT, { apiKey: 'test-key', fetch })).rejects.toThrow(
			'Die Anthropic-API lieferte kein Intro.',
		);
	});
});
```

`'/9j/2Q=='` is the base64 of `ff d8 ff d9`.

- [ ] **Step 2: Run them**

Run: `pnpm --filter studio exec vp test run scripts/import-echo/intro.test.ts` Expected: FAIL with "Failed to resolve import "./intro"".

- [ ] **Step 3: Write `intro.ts`**

```ts
import { z } from 'zod';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const INTRO_MODEL = 'claude-sonnet-5-5';
const MAX_TOKENS = 400;
/** The cover and the next two pages show what an issue is about. */
const INTRO_PAGE_COUNT = 3;
/** The start of a digital issue's text layer is context enough and keeps the request small. */
const MAX_TEXT_LENGTH = 6000;
/** The API takes an image of up to 5 MB in base64, which is 4/3 of the raw size. */
const MAX_IMAGE_BYTES = 3_750_000;

const SYSTEM_PROMPT = [
	'Du schreibst Intros für das Online-Archiv des TSG ECHO, des Vereinsmagazins der TSG Irlich.',
	'Ein Intro hat zwei bis drei Sätze und sagt, worum es in der Ausgabe geht: Themen, Abteilungen, Anlässe.',
	'Nenne keine Namen von Personen und keine Adressen, Telefonnummern, E-Mail-Adressen oder Geburtstage.',
	'Schreibe sachlich auf Deutsch, ohne Werbesprache, ohne Anführungszeichen und ohne Überschrift.',
	'Antworte nur mit dem Intro.',
].join(' ');

const responseSchema = z.object({
	content: z.array(z.object({ text: z.string().optional(), type: z.string() })),
});

/**
 * One page image as a content block of the Messages API.
 *
 * @param jpeg - The rendered page.
 * @returns The image block.
 */
function toImageBlock(jpeg: Uint8Array): ImageBlock {
	return {
		source: {
			data: Buffer.from(jpeg).toString('base64'),
			media_type: 'image/jpeg',
			type: 'base64',
		},
		type: 'image',
	};
}

/**
 * What the model is asked, with the text layer when the issue has one.
 *
 * @param input - Title, year and text of the issue.
 * @returns The text block.
 */
function toQuestion(input: IntroInput): TextBlock {
	const ask = `Schreibe das Intro für „${input.title}“ (${input.year}).`;
	const excerpt = input.text.slice(0, MAX_TEXT_LENGTH);
	const text = excerpt
		? `${ask}\n\nTextebene der Ausgabe (Auszug):\n${excerpt}`
		: `${ask} Die Ausgabe ist ein Scan ohne Textebene, lies die Seitenbilder.`;
	return { text, type: 'text' };
}

/**
 * The Messages API request for one intro.
 *
 * @param input - The first page images, the text layer, title and year.
 * @returns The request body.
 * @throws {Error} When the issue offers neither a usable image nor text.
 */
function buildIntroRequest(input: IntroInput): IntroRequest {
	const images = input.images
		.filter((jpeg) => jpeg.byteLength <= MAX_IMAGE_BYTES)
		.slice(0, INTRO_PAGE_COUNT)
		.map((jpeg) => toImageBlock(jpeg));
	if (images.length === 0 && !input.text) {
		throw new Error('Für das Intro fehlen Seitenbilder und Text.');
	}
	return {
		max_tokens: MAX_TOKENS,
		messages: [{ content: [...images, toQuestion(input)], role: 'user' }],
		model: INTRO_MODEL,
		system: SYSTEM_PROMPT,
	};
}

/**
 * Drafts the intro of an issue. The editors review every draft before the release goes online.
 *
 * @param input - The first page images, the text layer, title and year.
 * @param api - The key from the shell and the `fetch` to send with.
 * @returns The intro.
 * @throws {Error} For a failed request, an answer without text or an issue with nothing to read.
 */
async function draftIntro(input: IntroInput, api: IntroApi): Promise<string> {
	const response = await api.fetch(ANTHROPIC_URL, {
		body: JSON.stringify(buildIntroRequest(input)),
		headers: {
			'anthropic-version': ANTHROPIC_VERSION,
			'content-type': 'application/json',
			'x-api-key': api.apiKey,
		},
		method: 'POST',
	});
	if (!response.ok) {
		throw new Error(`Die Anthropic-API antwortete mit ${response.status}.`);
	}
	const { content } = responseSchema.parse(await response.json());
	const intro = content
		.map((block) => block.text ?? '')
		.join('')
		.trim();
	if (!intro) {
		throw new Error('Die Anthropic-API lieferte kein Intro.');
	}
	return intro;
}

interface IntroInput {
	/** The rendered pages, cover first. Only the first three are sent. */
	images: Uint8Array[];
	/** The issue's `extractedText`; empty for a scan. */
	text: string;
	title: string;
	year: string;
}

interface IntroApi {
	apiKey: string;
	fetch: typeof fetch;
}

interface ImageBlock {
	source: { data: string; media_type: 'image/jpeg'; type: 'base64' };
	type: 'image';
}

interface TextBlock {
	text: string;
	type: 'text';
}

interface IntroRequest {
	max_tokens: number;
	messages: { content: (ImageBlock | TextBlock)[]; role: 'user' }[];
	model: string;
	system: string;
}

export { INTRO_PAGE_COUNT, buildIntroRequest, draftIntro };
export type { IntroApi, IntroInput };
```

`oxlint` may flag `max_tokens` and `media_type` under a camel-case rule. If it does, add `// oxlint-disable-next-line <rule> -- the Anthropic API's field names` on the line, not a file-wide disable.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter studio exec vp test run scripts/import-echo/intro.test.ts` Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm run lint && pnpm run typecheck && pnpm run format:check
but diff
but commit -b feat/web-354-echo-archive-import -m "feat(studio): draft echo intros from the first pages" <ids>
```

---

### Task 5: The archive store

**Files:**

- Create: `apps/studio/scripts/import-echo/archive-store.ts`
- Test: `apps/studio/scripts/import-echo/archive-store.test.ts`

**Interfaces:**

- Consumes: `RELEASE_ID`, `RELEASE_TITLE`, `RELEASE_DESCRIPTION`, `EchoIssueDocument` (Task 3)
- Produces: `createArchiveStore(client: SanityClient): ArchiveStore` with

  ```ts
  interface ArchiveStore {
  	createRelease: () => Promise<void>;
  	createVersion: (publishedId: string, document: EchoIssueDocument) => Promise<void>;
  	/** The published ids of the given documents that exist as published, draft or release version. */
  	findExisting: (publishedIds: readonly string[]) => Promise<Set<string>>;
  	/** The raw ids of every `echo.issue` before the cutoff that is not switched off. */
  	findIndexableBefore: (cutoff: string) => Promise<string[]>;
  	/** `undefined` when the release does not exist. */
  	getReleaseState: () => Promise<string | undefined>;
  	uploadPage: (jpeg: Uint8Array, filename: string) => Promise<string>;
  	uploadPdf: (bytes: Uint8Array, filename: string) => Promise<string>;
  }
  ```

- Consumed by Tasks 6 and 7.

- [ ] **Step 1: Write the failing tests**

`apps/studio/scripts/import-echo/archive-store.test.ts`:

```ts
// @vitest-environment node
import type { SanityClient } from 'sanity';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createArchiveStore } from './archive-store';
import type { EchoIssueDocument } from './issue-document';

/**
 * A client with spies for exactly the calls the store makes.
 *
 * @param fetchResult - What `fetch` resolves to.
 * @returns The client and its spies.
 */
function createFakeClient(fetchResult: unknown = []) {
	const fake = {
		assets: { upload: vi.fn().mockResolvedValue({ _id: 'asset-id' }) },
		createVersion: vi.fn().mockResolvedValue({ transactionId: 't' }),
		fetch: vi.fn().mockResolvedValue(fetchResult),
		releases: {
			create: vi.fn().mockResolvedValue({ releaseId: 'tsg-echo-archiv' }),
			get: vi.fn().mockResolvedValue(undefined),
		},
	};
	return { client: fake as unknown as SanityClient, fake };
}

describe('the archive store', () => {
	it('creates the release with its fixed id, title and description', async () => {
		const { client, fake } = createFakeClient();

		await createArchiveStore(client).createRelease();

		expect(fake.releases.create).toHaveBeenCalledWith({
			metadata: {
				description:
					'Die alten Ausgaben 1979–2012 aus dem Import (WEB-354). Intros prüfen, dann den Release veröffentlichen.',
				releaseType: 'undecided',
				title: 'TSG-Echo-Archiv',
			},
			releaseId: 'tsg-echo-archiv',
		});
	});

	it('reads the release state, and nothing for a missing release', async () => {
		const { client, fake } = createFakeClient();
		const store = createArchiveStore(client);

		await expect(store.getReleaseState()).resolves.toBeUndefined();
		fake.releases.get.mockResolvedValue({ state: 'published' });
		await expect(store.getReleaseState()).resolves.toBe('published');
		expect(fake.releases.get).toHaveBeenCalledWith({ releaseId: 'tsg-echo-archiv' });
	});

	// Review focus 1: a rerun must find a document in any form.
	it('looks for the published, draft and release version of every id', async () => {
		const { client, fake } = createFakeClient([
			'drafts.echo-archiv-1979-01',
			'versions.tsg-echo-archiv.echo-archiv-1979-02',
		]);

		const existing = await createArchiveStore(client).findExisting([
			'echo-archiv-1979-01',
			'echo-archiv-1979-02',
			'echo-archiv-1979-03',
		]);

		expect(existing).toStrictEqual(new Set(['echo-archiv-1979-01', 'echo-archiv-1979-02']));
		expect(fake.fetch).toHaveBeenCalledWith(
			'*[_id in $ids]._id',
			{
				ids: [
					'echo-archiv-1979-01',
					'drafts.echo-archiv-1979-01',
					'versions.tsg-echo-archiv.echo-archiv-1979-01',
					'echo-archiv-1979-02',
					'drafts.echo-archiv-1979-02',
					'versions.tsg-echo-archiv.echo-archiv-1979-02',
					'echo-archiv-1979-03',
					'drafts.echo-archiv-1979-03',
					'versions.tsg-echo-archiv.echo-archiv-1979-03',
				],
			},
			{ perspective: 'raw' },
		);
	});

	it('finds every indexable issue before the cutoff in every version', async () => {
		const { client, fake } = createFakeClient(['echo-1984']);

		await expect(
			createArchiveStore(client).findIndexableBefore('2013-01-01'),
		).resolves.toStrictEqual(['echo-1984']);
		expect(fake.fetch).toHaveBeenCalledWith(
			'*[_type == "echo.issue" && releaseDate < $cutoff && indexable != false]._id',
			{ cutoff: '2013-01-01' },
			{ perspective: 'raw' },
		);
	});

	it('puts a document into the release under its published id', async () => {
		const { client, fake } = createFakeClient();
		const document = { _type: 'echo.issue', title: 'X' } as EchoIssueDocument;

		await createArchiveStore(client).createVersion('echo-archiv-1979-01', document);

		expect(fake.createVersion).toHaveBeenCalledWith({
			document,
			publishedId: 'echo-archiv-1979-01',
			releaseId: 'tsg-echo-archiv',
		});
	});

	it('uploads a pdf and a page with their content types and names', async () => {
		const { client, fake } = createFakeClient();
		const store = createArchiveStore(client);

		await expect(store.uploadPdf(new Uint8Array([1]), 'tsg-echo-1979-nr-1.pdf')).resolves.toBe(
			'asset-id',
		);
		await expect(
			store.uploadPage(new Uint8Array([2]), 'echo-8c321136-seite-001.jpg'),
		).resolves.toBe('asset-id');
		expect(fake.assets.upload).toHaveBeenNthCalledWith(1, 'file', Buffer.from([1]), {
			contentType: 'application/pdf',
			filename: 'tsg-echo-1979-nr-1.pdf',
		});
		expect(fake.assets.upload).toHaveBeenNthCalledWith(2, 'image', Buffer.from([2]), {
			contentType: 'image/jpeg',
			filename: 'echo-8c321136-seite-001.jpg',
		});
	});
});
```

- [ ] **Step 2: Run them**

Run: `pnpm --filter studio exec vp test run scripts/import-echo/archive-store.test.ts` Expected: FAIL with "Failed to resolve import "./archive-store"".

- [ ] **Step 3: Write `archive-store.ts`**

```ts
import type { SanityClient } from 'sanity';

import { RELEASE_DESCRIPTION, RELEASE_ID, RELEASE_TITLE } from './issue-document';
import type { EchoIssueDocument } from './issue-document';

const DRAFTS_PREFIX = 'drafts.';
const VERSION_PREFIX = `versions.${RELEASE_ID}.`;

const EXISTING_IDS_QUERY = /* groq */ '*[_id in $ids]._id';
const INDEXABLE_BEFORE_QUERY =
	/* groq */ '*[_type == "echo.issue" && releaseDate < $cutoff && indexable != false]._id';

/**
 * Every id a document can have here: published, draft and its version in the archive release.
 *
 * @param publishedId - The published id.
 * @returns The three ids.
 */
function toAllIds(publishedId: string): string[] {
	return [publishedId, `${DRAFTS_PREFIX}${publishedId}`, `${VERSION_PREFIX}${publishedId}`];
}

/**
 * The published id behind a draft or archive release version id.
 *
 * @param id - Any id `toAllIds` produced.
 * @returns The published id.
 */
function toPublishedId(id: string): string {
	if (id.startsWith(VERSION_PREFIX)) {
		return id.slice(VERSION_PREFIX.length);
	}
	return id.startsWith(DRAFTS_PREFIX) ? id.slice(DRAFTS_PREFIX.length) : id;
}

/**
 * The Sanity side of the archive import. Reads go through the raw perspective, so drafts and
 * release versions count as much as published documents.
 *
 * @param client - The `sanity exec` client, with the user's token and the target dataset.
 * @returns The store.
 */
function createArchiveStore(client: SanityClient): ArchiveStore {
	return {
		createRelease: async () => {
			await client.releases.create({
				metadata: {
					description: RELEASE_DESCRIPTION,
					releaseType: 'undecided',
					title: RELEASE_TITLE,
				},
				releaseId: RELEASE_ID,
			});
		},
		createVersion: async (publishedId, document) => {
			await client.createVersion({ document, publishedId, releaseId: RELEASE_ID });
		},
		findExisting: async (publishedIds) => {
			const ids = await client.fetch<string[]>(
				EXISTING_IDS_QUERY,
				{ ids: publishedIds.flatMap((id) => toAllIds(id)) },
				{ perspective: 'raw' },
			);
			return new Set(ids.map((id) => toPublishedId(id)));
		},
		findIndexableBefore: async (cutoff) =>
			client.fetch<string[]>(INDEXABLE_BEFORE_QUERY, { cutoff }, { perspective: 'raw' }),
		getReleaseState: async () => (await client.releases.get({ releaseId: RELEASE_ID }))?.state,
		uploadPage: async (jpeg, filename) => {
			const asset = await client.assets.upload('image', Buffer.from(jpeg), {
				contentType: 'image/jpeg',
				filename,
			});
			return asset._id;
		},
		uploadPdf: async (bytes, filename) => {
			const asset = await client.assets.upload('file', Buffer.from(bytes), {
				contentType: 'application/pdf',
				filename,
			});
			return asset._id;
		},
	};
}

interface ArchiveStore {
	createRelease: () => Promise<void>;
	createVersion: (publishedId: string, document: EchoIssueDocument) => Promise<void>;
	/** The published ids of the given documents that exist as published, draft or release version. */
	findExisting: (publishedIds: readonly string[]) => Promise<Set<string>>;
	/** The raw ids of every `echo.issue` before the cutoff that is not switched off. */
	findIndexableBefore: (cutoff: string) => Promise<string[]>;
	/** `undefined` when the release does not exist. */
	getReleaseState: () => Promise<string | undefined>;
	uploadPage: (jpeg: Uint8Array, filename: string) => Promise<string>;
	uploadPdf: (bytes: Uint8Array, filename: string) => Promise<string>;
}

export { createArchiveStore };
export type { ArchiveStore };
```

`createVersion` with an inline `document` logs a console warning that recommends `baseId`. The Sanity docs say to disregard it for a document without a published edition, which is the case for every document here.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter studio exec vp test run scripts/import-echo/archive-store.test.ts` Expected: PASS.

If `pnpm run typecheck` rejects `EchoIssueDocument` as the `document` of `createVersion`, rule it. The fix is an explicit `SanityDocumentStub<EchoIssueDocument>` from `sanity` at the call, not a cast to `any`.

- [ ] **Step 5: Commit**

```bash
pnpm run lint && pnpm run typecheck && pnpm run format:check
but diff
but commit -b feat/web-354-echo-archive-import -m "feat(studio): add the echo archive store" <ids>
```

---

### Task 6: The import run

**Files:**

- Create: `apps/studio/scripts/import-echo/run-import.ts`
- Test: `apps/studio/scripts/import-echo/run-import.test.ts`
- Modify: `apps/studio/package.json`, which adds `"@tsgi-web/pdf-pages": "workspace:*"` to `devDependencies` for the `RenderedPage` type and Task 7. Then `pnpm install`.

**Interfaces:**

- Consumes:
  - `IssuePlan` (Task 2)
  - `ARCHIVE_CUTOFF`, `buildIssueDocument`, `toPageEntry`, `toPageFilename`, `toPageText`, `EchoPage` (Task 3)
  - `INTRO_PAGE_COUNT`, `IntroInput` (Task 4)
  - `ArchiveStore` (Task 5)
  - `RenderedPage` from `@tsgi-web/pdf-pages`
- Produces:
  - `runImport(plans: readonly IssuePlan[], deps: ImportDependencies, options: { dryRun: boolean }): Promise<ImportReport>`. It throws only when the release cannot take versions.
  - `isSuccessful(report: ImportReport): boolean`
  - `summarize(report: ImportReport, dryRun: boolean): string[]`
  - types:

    ```ts
    interface ImportDependencies {
    	/** Drafts an intro; left out with `--no-intro` and in a dry run. */
    	draftIntro?: (input: IntroInput) => Promise<string>;
    	log: (line: string) => void;
    	now: () => Date;
    	/** Reads a PDF by its manifest path. */
    	readPdf: (file: string) => Promise<Uint8Array>;
    	renderPages: (bytes: Uint8Array) => AsyncIterable<RenderedPage>;
    	store: ArchiveStore;
    }
    interface ImportReport {
    	checked: string[];
    	created: string[];
    	failed: { documentId: string; error: string }[];
    	indexableBefore: string[];
    	skipped: string[];
    	withoutIntro: string[];
    }
    ```

- Consumed by Task 7.

- [ ] **Step 1: Add the dependency**

In `apps/studio/package.json`, add to `devDependencies`, sorted:

```json
		"@tsgi-web/pdf-pages": "workspace:*",
```

Run: `pnpm install` Expected: the lockfile links `packages/pdf-pages` into `apps/studio` and installs nothing new.

- [ ] **Step 2: Write the failing tests**

`apps/studio/scripts/import-echo/run-import.test.ts`:

```ts
import { describe, expect, it, vi } from 'vite-plus/test';
import type { Mock } from 'vite-plus/test';

// @vitest-environment node
import type { RenderedPage } from '@tsgi-web/pdf-pages';

import type { ArchiveStore } from './archive-store';
import type { IssuePlan } from './manifest';
import { isSuccessful, runImport, summarize } from './run-import';
import type { ImportDependencies } from './run-import';

const PDF_ID = 'file-8c3211369d3d2da0c150d50d7cb5bca911b15f5e-pdf';
const SCAN: IssuePlan = {
	documentId: 'echo-archiv-1984-tsg-irlich-1-echo',
	file: '1980-1989/1984 - TSG Irlich - 1.Echo.pdf',
	releaseDate: '1984-03-01',
	slug: 'tsg-echo-1984-nr-1',
	title: 'TSG ECHO 1984 Nr. 1',
};
const DIGITAL: IssuePlan = {
	documentId: 'echo-archiv-2010-02',
	file: '2000-2012/2010_02.pdf',
	releaseDate: '2010-09-20',
	slug: 'tsg-echo-2010-nr-2',
	title: 'TSG ECHO 2010 Nr. 2',
};

/**
 * Renders the given number of pages, with text on every page when `text` is set.
 *
 * @param count - How many pages.
 * @param text - The text of each page.
 * @returns A `renderPages` replacement.
 */
function pages(count: number, text = '') {
	return async function* render(): AsyncGenerator<RenderedPage> {
		for (let index = 1; index <= count; index++) {
			yield { height: 2000, index, jpeg: new Uint8Array([index]), text, width: 1414 };
		}
	};
}

/** A store whose every method is a typed spy, so a test can read `.mock.calls`. */
type FakeStore = { [Method in keyof ArchiveStore]: Mock<ArchiveStore[Method]> };

type DraftIntro = NonNullable<ImportDependencies['draftIntro']>;

/** The dependencies with spies where a test looks at the calls. */
interface FakeDeps extends ImportDependencies {
	draftIntro?: Mock<DraftIntro>;
	log: Mock<ImportDependencies['log']>;
	readPdf: Mock<ImportDependencies['readPdf']>;
	store: FakeStore;
}

/**
 * An in-memory store: the release is missing and no issue exists yet, unless told otherwise.
 *
 * @param overrides - Replacements for single methods, each a `vi.fn<ArchiveStore['…']>()`.
 * @returns The store.
 */
function createStore(overrides: Partial<FakeStore> = {}): FakeStore {
	let page = 0;
	return {
		createRelease: vi.fn<ArchiveStore['createRelease']>().mockResolvedValue(),
		createVersion: vi.fn<ArchiveStore['createVersion']>().mockResolvedValue(),
		findExisting: vi.fn<ArchiveStore['findExisting']>().mockResolvedValue(new Set()),
		findIndexableBefore: vi.fn<ArchiveStore['findIndexableBefore']>().mockResolvedValue([]),
		getReleaseState: vi.fn<ArchiveStore['getReleaseState']>().mockResolvedValue(undefined),
		uploadPage: vi
			.fn<ArchiveStore['uploadPage']>()
			.mockImplementation(async () => `image-${++page}-1414x2000-jpg`),
		uploadPdf: vi.fn<ArchiveStore['uploadPdf']>().mockResolvedValue(PDF_ID),
		...overrides,
	};
}

/**
 * The dependencies of a run, with a fixed clock and a two-page scan for every PDF.
 *
 * @param overrides - Replacements, for instance another store or `draftIntro`.
 * @returns The dependencies.
 */
function createDeps(overrides: Partial<FakeDeps> = {}): FakeDeps {
	return {
		draftIntro: vi.fn<DraftIntro>().mockResolvedValue('Ein Intro.'),
		log: vi.fn<ImportDependencies['log']>(),
		now: () => new Date('2026-10-11T10:00:00.000Z'),
		readPdf: vi.fn<ImportDependencies['readPdf']>().mockResolvedValue(new Uint8Array([0x25])),
		renderPages: pages(2),
		store: createStore(),
		...overrides,
	};
}

/**
 * A release in the given state.
 *
 * @param state - The release state, e.g. `active`.
 * @returns The `getReleaseState` override.
 */
function releaseIn(state: string): Pick<FakeStore, 'getReleaseState'> {
	return { getReleaseState: vi.fn<ArchiveStore['getReleaseState']>().mockResolvedValue(state) };
}

describe('an import run', () => {
	it('creates the missing release, then one hidden, rendered version per issue', async () => {
		const deps = createDeps();

		const report = await runImport([SCAN], deps, { dryRun: false });

		expect(deps.store.createRelease).toHaveBeenCalledOnce();
		expect(deps.store.uploadPdf).toHaveBeenCalledWith(
			new Uint8Array([0x25]),
			'tsg-echo-1984-nr-1.pdf',
		);
		expect(deps.store.uploadPage).toHaveBeenNthCalledWith(
			2,
			new Uint8Array([2]),
			'echo-8c321136-seite-002.jpg',
		);
		expect(deps.store.createVersion).toHaveBeenCalledWith('echo-archiv-1984-tsg-irlich-1-echo', {
			_type: 'echo.issue',
			extractedText: '',
			indexable: false,
			intro: 'Ein Intro.',
			pages: [
				{
					_key: 'seite-1',
					_type: 'image',
					asset: { _ref: 'image-1-1414x2000-jpg', _type: 'reference' },
				},
				{
					_key: 'seite-2',
					_type: 'image',
					asset: { _ref: 'image-2-1414x2000-jpg', _type: 'reference' },
				},
			],
			pdf: { _type: 'file', asset: { _ref: PDF_ID, _type: 'reference' } },
			releaseDate: '1984-03-01',
			render: {
				finishedAt: '2026-10-11T10:00:00.000Z',
				pageCount: 2,
				source: PDF_ID,
				startedAt: '2026-10-11T10:00:00.000Z',
				status: 'done',
			},
			slug: { _type: 'slug', current: 'tsg-echo-1984-nr-1' },
			title: 'TSG ECHO 1984 Nr. 1',
		});
		expect(report.created).toStrictEqual(['echo-archiv-1984-tsg-irlich-1-echo']);
	});

	it('collects the text layer of a digital issue like the render route', async () => {
		const deps = createDeps({ renderPages: pages(2, 'Abteilungen') });

		await runImport([DIGITAL], deps, { dryRun: false });

		expect(deps.store.createVersion.mock.calls[0]?.[1]).toMatchObject({
			extractedText: '--- Seite 1 ---\nAbteilungen\n\n--- Seite 2 ---\nAbteilungen',
		});
	});

	it('shows the intro model the first three pages, the text, the title and the year', async () => {
		const deps = createDeps({ renderPages: pages(5, 'Abteilungen') });

		await runImport([DIGITAL], deps, { dryRun: false });

		expect(deps.draftIntro).toHaveBeenCalledWith({
			images: [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])],
			text: '--- Seite 1 ---\nAbteilungen\n\n--- Seite 2 ---\nAbteilungen\n\n--- Seite 3 ---\nAbteilungen\n\n--- Seite 4 ---\nAbteilungen\n\n--- Seite 5 ---\nAbteilungen',
			title: 'TSG ECHO 2010 Nr. 2',
			year: '2010',
		});
	});

	it('adds to a release that is still open', async () => {
		const deps = createDeps({ store: createStore(releaseIn('active')) });

		await runImport([SCAN], deps, { dryRun: false });

		expect(deps.store.createRelease).not.toHaveBeenCalled();
		expect(deps.store.createVersion).toHaveBeenCalledOnce();
	});

	// Review focus 4.
	it.each(['published', 'archived', 'scheduled'])(
		'refuses a release that is %s before uploading anything',
		async (state) => {
			const deps = createDeps({ store: createStore(releaseIn(state)) });

			await expect(runImport([SCAN], deps, { dryRun: false })).rejects.toThrow(
				`Der Release „TSG-Echo-Archiv“ ist ${state} und nimmt keine Ausgaben mehr auf.`,
			);
			expect(deps.store.uploadPdf).not.toHaveBeenCalled();
		},
	);

	// Review focus 1: a rerun creates no duplicates.
	it('skips an issue that exists in any form', async () => {
		const deps = createDeps({
			store: createStore({
				findExisting: vi
					.fn<ArchiveStore['findExisting']>()
					.mockResolvedValue(new Set([SCAN.documentId])),
			}),
		});

		const report = await runImport([SCAN, DIGITAL], deps, { dryRun: false });

		expect(deps.store.findExisting).toHaveBeenCalledWith([SCAN.documentId, DIGITAL.documentId]);
		expect(report.skipped).toStrictEqual([SCAN.documentId]);
		expect(report.created).toStrictEqual([DIGITAL.documentId]);
		expect(deps.readPdf).toHaveBeenCalledOnce();
	});

	// Review focus 1: a failure leaves no version behind, so the next run imports the issue again.
	it('records a failing issue and goes on with the next one', async () => {
		const store = createStore({
			createVersion: vi
				.fn<ArchiveStore['createVersion']>()
				.mockRejectedValueOnce(new Error('Netzwerk weg'))
				.mockResolvedValue(),
		});
		const deps = createDeps({ store });

		const report = await runImport([SCAN, DIGITAL], deps, { dryRun: false });

		expect(report.failed).toStrictEqual([{ documentId: SCAN.documentId, error: 'Netzwerk weg' }]);
		expect(report.created).toStrictEqual([DIGITAL.documentId]);
		expect(isSuccessful(report)).toBe(false);
	});

	it('fails an empty pdf without creating a version', async () => {
		const deps = createDeps({ renderPages: pages(0) });

		const report = await runImport([SCAN], deps, { dryRun: false });

		expect(report.failed).toStrictEqual([
			{ documentId: SCAN.documentId, error: 'Die PDF enthält keine Seiten.' },
		]);
		expect(deps.store.createVersion).not.toHaveBeenCalled();
	});

	// Review focus 5: the import does not stand or fall with the intro.
	it('imports an issue without an intro when drafting fails, and lists it', async () => {
		const deps = createDeps({
			draftIntro: vi
				.fn<DraftIntro>()
				.mockRejectedValue(new Error('Die Anthropic-API antwortete mit 529.')),
		});

		const report = await runImport([SCAN], deps, { dryRun: false });

		expect(deps.store.createVersion.mock.calls[0]?.[1]).not.toHaveProperty('intro');
		expect(report.created).toStrictEqual([SCAN.documentId]);
		expect(report.withoutIntro).toStrictEqual([SCAN.documentId]);
		expect(deps.log).toHaveBeenCalledWith('  Kein Intro: Die Anthropic-API antwortete mit 529.');
	});

	it('imports without intros when none are wanted', async () => {
		const deps = createDeps({ draftIntro: undefined });

		const report = await runImport([SCAN], deps, { dryRun: false });

		expect(report.withoutIntro).toStrictEqual([SCAN.documentId]);
	});

	it('reports every indexable issue before 2013', async () => {
		const deps = createDeps({
			store: createStore({
				findIndexableBefore: vi
					.fn<ArchiveStore['findIndexableBefore']>()
					.mockResolvedValue(['echo-1984']),
			}),
		});

		const report = await runImport([SCAN], deps, { dryRun: false });

		expect(deps.store.findIndexableBefore).toHaveBeenCalledWith('2013-01-01');
		expect(report.indexableBefore).toStrictEqual(['echo-1984']);
		expect(isSuccessful(report)).toBe(false);
	});
});

describe('a dry run', () => {
	it('renders every pdf but writes nothing and drafts no intro', async () => {
		const deps = createDeps({ renderPages: pages(3, 'Text') });

		const report = await runImport([SCAN, DIGITAL], deps, { dryRun: true });

		expect(deps.store.createRelease).not.toHaveBeenCalled();
		expect(deps.store.uploadPdf).not.toHaveBeenCalled();
		expect(deps.store.uploadPage).not.toHaveBeenCalled();
		expect(deps.store.createVersion).not.toHaveBeenCalled();
		expect(deps.draftIntro).not.toHaveBeenCalled();
		expect(report.checked).toStrictEqual([SCAN.documentId, DIGITAL.documentId]);
		expect(deps.log).toHaveBeenCalledWith('  3 Seiten, mit Textebene');
		expect(isSuccessful(report)).toBe(true);
	});

	it('says that a scan has no text layer', async () => {
		const deps = createDeps();

		await runImport([SCAN], deps, { dryRun: true });

		expect(deps.log).toHaveBeenCalledWith('  2 Seiten, Scan ohne Textebene');
	});

	it('still refuses a published release', async () => {
		const deps = createDeps({ store: createStore(releaseIn('published')) });

		await expect(runImport([SCAN], deps, { dryRun: true })).rejects.toThrow(
			'nimmt keine Ausgaben mehr auf',
		);
	});
});

describe('the summary', () => {
	it('counts every outcome and names what needs attention', () => {
		const lines = summarize(
			{
				checked: [],
				created: ['a', 'b'],
				failed: [{ documentId: 'c', error: 'kaputt' }],
				indexableBefore: ['d'],
				skipped: ['e'],
				withoutIntro: ['b'],
			},
			false,
		);

		expect(lines).toStrictEqual([
			'Angelegt: 2, übersprungen: 1, fehlgeschlagen: 1',
			'Fehlgeschlagen: c (kaputt)',
			'Ohne Intro: b',
			'Auffindbar trotz Erscheinen vor 2013: d',
		]);
	});

	it('reports a clean dry run in one line', () => {
		const lines = summarize(
			{
				checked: ['a'],
				created: [],
				failed: [],
				indexableBefore: [],
				skipped: [],
				withoutIntro: [],
			},
			true,
		);

		expect(lines).toStrictEqual(['Probelauf: 1 geprüft, übersprungen: 0, fehlgeschlagen: 0']);
	});
});
```

- [ ] **Step 3: Run them**

Run: `pnpm --filter studio exec vp test run scripts/import-echo/run-import.test.ts` Expected: FAIL with "Failed to resolve import "./run-import"".

- [ ] **Step 4: Write `run-import.ts`**

```ts
import type { RenderedPage } from '@tsgi-web/pdf-pages';
import { settle } from '@tsgi-web/shared';

import type { ArchiveStore } from './archive-store';
import { INTRO_PAGE_COUNT } from './intro';
import type { IntroInput } from './intro';
import {
	ARCHIVE_CUTOFF,
	RELEASE_TITLE,
	buildIssueDocument,
	toPageEntry,
	toPageFilename,
	toPageText,
} from './issue-document';
import type { EchoPage } from './issue-document';
import type { IssuePlan } from './manifest';

const YEAR_LENGTH = 4;
const TEXT_SEPARATOR = '\n\n';

/**
 * A rejection reason as text.
 *
 * @param error - Whatever was thrown.
 * @returns The message.
 */
function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Makes sure the release can take versions, and creates it on a real run when it is missing.
 *
 * @param deps - The store and the log.
 * @param dryRun - Whether to only read.
 * @throws {Error} When the release exists but is no longer open.
 */
async function prepareRelease(deps: ImportDependencies, dryRun: boolean): Promise<void> {
	const state = await deps.store.getReleaseState();
	if (state === undefined) {
		deps.log(`Release „${RELEASE_TITLE}“ ${dryRun ? 'würde angelegt' : 'wird angelegt'}.`);
		if (!dryRun) {
			await deps.store.createRelease();
		}
		return;
	}
	if (state !== 'active') {
		throw new Error(
			`Der Release „${RELEASE_TITLE}“ ist ${state} und nimmt keine Ausgaben mehr auf.`,
		);
	}
}

/**
 * Uploads one rendered page and remembers what the document and the intro need of it.
 *
 * @param page - The rendered page.
 * @param target - The PDF the page belongs to and what has been collected so far.
 * @param store - The Sanity side.
 */
async function collectPage(
	page: RenderedPage,
	target: PageTarget,
	store: ArchiveStore,
): Promise<void> {
	const assetId = await store.uploadPage(page.jpeg, toPageFilename(target.pdfAssetId, page.index));
	target.collected.pages.push(toPageEntry(assetId, page.index));
	if (target.collected.introImages.length < INTRO_PAGE_COUNT) {
		target.collected.introImages.push(page.jpeg);
	}
	const text = toPageText(page);
	if (text) {
		target.collected.texts.push(text);
	}
}

/**
 * Renders the PDF and uploads its pages one after the other, so only one page is in memory.
 *
 * @param bytes - The PDF.
 * @param pdfAssetId - The id of the uploaded PDF.
 * @param deps - The renderer and the store.
 * @returns The page entries, the text blocks and the first page images.
 * @throws {Error} For a PDF without pages or a failing step.
 */
async function uploadPages(
	bytes: Uint8Array,
	pdfAssetId: string,
	deps: ImportDependencies,
): Promise<CollectedPages> {
	const collected: CollectedPages = { introImages: [], pages: [], texts: [] };
	for await (const page of deps.renderPages(bytes)) {
		await collectPage(page, { collected, pdfAssetId }, deps.store);
	}
	if (collected.pages.length === 0) {
		throw new Error('Die PDF enthält keine Seiten.');
	}
	return collected;
}

/**
 * Drafts the intro, or explains in the log why there is none.
 *
 * @param plan - The issue.
 * @param collected - Its first page images and its text.
 * @param deps - `draftIntro` and the log.
 * @returns The intro, or `undefined` without one.
 */
async function draftIntroFor(
	plan: IssuePlan,
	collected: CollectedPages,
	deps: ImportDependencies,
): Promise<string | undefined> {
	if (!deps.draftIntro) {
		return undefined;
	}
	const drafted = await settle(
		deps.draftIntro({
			images: collected.introImages,
			text: collected.texts.join(TEXT_SEPARATOR),
			title: plan.title,
			year: plan.releaseDate.slice(0, YEAR_LENGTH),
		}),
	);
	if (drafted.ok) {
		return drafted.value;
	}
	deps.log(`  Kein Intro: ${describeError(drafted.error)}`);
	return undefined;
}

/**
 * Imports one issue: PDF, pages, intro, then the version in the release, which comes last, so an
 * interrupted issue leaves no document behind.
 *
 * @param plan - The issue.
 * @param deps - The dependencies.
 * @returns `created`, or `createdWithoutIntro`.
 */
async function importIssue(plan: IssuePlan, deps: ImportDependencies): Promise<IssueOutcome> {
	const bytes = await deps.readPdf(plan.file);
	const startedAt = deps.now().toISOString();
	const pdfAssetId = await deps.store.uploadPdf(bytes, `${plan.slug}.pdf`);
	const collected = await uploadPages(bytes, pdfAssetId, deps);
	const intro = await draftIntroFor(plan, collected, deps);
	const document = buildIssueDocument(plan, {
		extractedText: collected.texts.join(TEXT_SEPARATOR),
		finishedAt: deps.now().toISOString(),
		intro,
		pages: collected.pages,
		pdfAssetId,
		startedAt,
	});
	await deps.store.createVersion(plan.documentId, document);
	return intro ? 'created' : 'createdWithoutIntro';
}

/**
 * Renders one issue without writing anything, to find broken PDFs before the real run.
 *
 * @param plan - The issue.
 * @param deps - The file reader, the renderer and the log.
 * @returns `checked`.
 * @throws {Error} For a PDF without pages or one pdf.js cannot read.
 */
async function checkIssue(plan: IssuePlan, deps: ImportDependencies): Promise<IssueOutcome> {
	let pageCount = 0;
	let hasText = false;
	for await (const page of deps.renderPages(await deps.readPdf(plan.file))) {
		pageCount += 1;
		hasText ||= page.text !== '';
	}
	if (pageCount === 0) {
		throw new Error('Die PDF enthält keine Seiten.');
	}
	deps.log(`  ${pageCount} Seiten, ${hasText ? 'mit Textebene' : 'Scan ohne Textebene'}`);
	return 'checked';
}

/**
 * Files the outcome of one issue in the report.
 *
 * @param report - The report of the run.
 * @param documentId - The issue.
 * @param outcome - What happened to it.
 */
function record(report: ImportReport, documentId: string, outcome: IssueOutcome): void {
	if (outcome === 'checked') {
		report.checked.push(documentId);
		return;
	}
	report.created.push(documentId);
	if (outcome === 'createdWithoutIntro') {
		report.withoutIntro.push(documentId);
	}
}

/**
 * Logs a failed issue and files it in the report.
 *
 * @param run - The log and the report.
 * @param documentId - The issue.
 * @param error - Whatever was thrown.
 */
function recordFailure(run: ImportRun, documentId: string, error: unknown): void {
	const message = describeError(error);
	run.deps.log(`  Fehler: ${message}`);
	run.report.failed.push({ documentId, error: message });
}

/**
 * Skips, checks or imports one issue. A failure is recorded, never thrown, so one broken PDF does
 * not stop the other issues.
 *
 * @param plan - The issue.
 * @param run - The dependencies, the existing ids, the mode and the report.
 */
async function processIssue(plan: IssuePlan, run: ImportRun): Promise<void> {
	if (run.existing.has(plan.documentId)) {
		run.deps.log(`${plan.title}: schon vorhanden, übersprungen`);
		run.report.skipped.push(plan.documentId);
		return;
	}
	run.deps.log(`${plan.title}: ${run.dryRun ? 'prüfen' : 'importieren'}`);
	const outcome = await settle(
		run.dryRun ? checkIssue(plan, run.deps) : importIssue(plan, run.deps),
	);
	if (outcome.ok) {
		record(run.report, plan.documentId, outcome.value);
		return;
	}
	recordFailure(run, plan.documentId, outcome.error);
}

/**
 * Imports the archive into the release "TSG-Echo-Archiv", or only checks it in a dry run. The
 * issues run one after the other, so only one PDF is in memory at a time.
 *
 * @param plans - The issues of the manifest.
 * @param deps - Everything the run talks to.
 * @param options - Whether this is a dry run.
 * @returns What happened to every issue, and every indexable issue before 2013.
 * @throws {Error} When the release exists but no longer takes versions.
 */
async function runImport(
	plans: readonly IssuePlan[],
	deps: ImportDependencies,
	options: { dryRun: boolean },
): Promise<ImportReport> {
	await prepareRelease(deps, options.dryRun);
	const existing = await deps.store.findExisting(plans.map((plan) => plan.documentId));
	const report: ImportReport = {
		checked: [],
		created: [],
		failed: [],
		indexableBefore: [],
		skipped: [],
		withoutIntro: [],
	};
	for (const plan of plans) {
		// oxlint-disable-next-line no-await-in-loop -- one issue at a time keeps one PDF in memory
		await processIssue(plan, { deps, dryRun: options.dryRun, existing, report });
	}
	report.indexableBefore = await deps.store.findIndexableBefore(ARCHIVE_CUTOFF);
	return report;
}

/**
 * Whether the run left nothing to fix.
 *
 * @param report - The report of the run.
 * @returns `false` for a failed issue or an indexable issue before 2013.
 */
function isSuccessful(report: ImportReport): boolean {
	return report.failed.length === 0 && report.indexableBefore.length === 0;
}

/**
 * The closing lines of a run, in German.
 *
 * @param report - The report of the run.
 * @param dryRun - Whether it was a dry run.
 * @returns The lines, the counts first.
 */
function summarize(report: ImportReport, dryRun: boolean): string[] {
	const done = dryRun
		? `Probelauf: ${report.checked.length} geprüft`
		: `Angelegt: ${report.created.length}`;
	return [
		`${done}, übersprungen: ${report.skipped.length}, fehlgeschlagen: ${report.failed.length}`,
		...report.failed.map((failure) => `Fehlgeschlagen: ${failure.documentId} (${failure.error})`),
		...(report.withoutIntro.length > 0 ? [`Ohne Intro: ${report.withoutIntro.join(', ')}`] : []),
		...(report.indexableBefore.length > 0
			? [`Auffindbar trotz Erscheinen vor 2013: ${report.indexableBefore.join(', ')}`]
			: []),
	];
}

type IssueOutcome = 'checked' | 'created' | 'createdWithoutIntro';

interface CollectedPages {
	/** The first pages, for the intro. */
	introImages: Uint8Array[];
	pages: EchoPage[];
	/** One block per page with text. */
	texts: string[];
}

interface PageTarget {
	collected: CollectedPages;
	pdfAssetId: string;
}

interface ImportDependencies {
	/** Drafts an intro; left out with `--no-intro` and in a dry run. */
	draftIntro?: (input: IntroInput) => Promise<string>;
	log: (line: string) => void;
	now: () => Date;
	/** Reads a PDF by its manifest path. */
	readPdf: (file: string) => Promise<Uint8Array>;
	renderPages: (bytes: Uint8Array) => AsyncIterable<RenderedPage>;
	store: ArchiveStore;
}

interface ImportReport {
	checked: string[];
	created: string[];
	failed: { documentId: string; error: string }[];
	indexableBefore: string[];
	skipped: string[];
	withoutIntro: string[];
}

interface ImportRun {
	deps: ImportDependencies;
	dryRun: boolean;
	existing: Set<string>;
	report: ImportReport;
}

export { isSuccessful, runImport, summarize };
export type { ImportDependencies, ImportReport };
```

A dry run never calls `draftIntro`, because `checkIssue` does not draft. The CLI also leaves it out (Task 7).

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter studio exec vp test run scripts/import-echo/run-import.test.ts` Expected: PASS.

- [ ] **Step 6: Commit**

```bash
pnpm run lint && pnpm run typecheck && pnpm run format:check
but diff
but commit -b feat/web-354-echo-archive-import -m "feat(studio): run the tsg-echo archive import" <ids incl. pnpm-lock.yaml>
```

---

### Task 7: Command line, entry script and a local dry run

**Files:**

- Create: `apps/studio/scripts/import-echo/options.ts`
- Test: `apps/studio/scripts/import-echo/options.test.ts`
- Create: `apps/studio/scripts/import-echo.ts`
- Modify: `apps/studio/package.json` (script `import:echo`)
- Modify: `apps/studio/AGENTS.md` (new section after "TSG-Echo issues")

**Interfaces:**

- Consumes: everything from Tasks 2 to 6, `renderPdfPages` from `@tsgi-web/pdf-pages`, `getCliClient` from `sanity/cli`
- Produces:
  - `parseImportOptions(argv: readonly string[], env: { ANTHROPIC_API_KEY?: string }): ImportOptions`
  - `interface ImportOptions { apiKey: string | undefined; dataset: string; dryRun: boolean; folder: string; manifest: string }`, with absolute paths

- [ ] **Step 1: Write the failing tests**

`apps/studio/scripts/import-echo/options.test.ts`:

```ts
// @vitest-environment node
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { parseImportOptions } from './options';

const BASE = ['--dataset', 'development', '--folder', '/tmp/echo'];

describe('the import options', () => {
	it('defaults to a dry run without a key and finds the manifest in the folder', () => {
		expect(parseImportOptions(BASE, {})).toStrictEqual({
			apiKey: undefined,
			dataset: 'development',
			dryRun: true,
			folder: path.resolve('/tmp/echo'),
			manifest: path.resolve('/tmp/echo/manifest.json'),
		});
	});

	it('writes with --no-dry-run and takes the key from the shell', () => {
		expect(
			parseImportOptions([...BASE, '--no-dry-run'], { ANTHROPIC_API_KEY: 'test-key' }),
		).toMatchObject({
			apiKey: 'test-key',
			dryRun: false,
		});
	});

	it('takes another manifest', () => {
		expect(parseImportOptions([...BASE, '--manifest', '/tmp/liste.json'], {}).manifest).toBe(
			path.resolve('/tmp/liste.json'),
		);
	});

	it('imports without intros and without a key on --no-intro', () => {
		expect(parseImportOptions([...BASE, '--no-dry-run', '--no-intro'], {}).apiKey).toBeUndefined();
	});

	// A dry run drafts nothing, so it never needs the key, even when the shell has one.
	it('leaves the key out of a dry run', () => {
		expect(parseImportOptions(BASE, { ANTHROPIC_API_KEY: 'test-key' }).apiKey).toBeUndefined();
	});

	// pnpm passes a literal `--` on to the script in some versions.
	it('ignores a leading -- separator', () => {
		expect(parseImportOptions(['--', ...BASE], {}).dataset).toBe('development');
	});

	it.each([
		['the dataset', ['--folder', '/tmp/echo'], '--dataset fehlt'],
		['the folder', ['--dataset', 'development'], '--folder fehlt'],
	])('requires %s', (_label, argv, message) => {
		expect(() => parseImportOptions(argv, {})).toThrow(message);
	});

	it('requires a key for a real run with intros', () => {
		expect(() => parseImportOptions([...BASE, '--no-dry-run'], {})).toThrow(
			'ANTHROPIC_API_KEY fehlt. Ohne Intros importieren: --no-intro.',
		);
	});

	it('rejects an unknown option', () => {
		expect(() => parseImportOptions([...BASE, '--force'], {})).toThrow("Unknown option '--force'");
	});
});
```

- [ ] **Step 2: Run them**

Run: `pnpm --filter studio exec vp test run scripts/import-echo/options.test.ts` Expected: FAIL with "Failed to resolve import "./options"".

- [ ] **Step 3: Write `options.ts`**

```ts
import path from 'node:path';
import { parseArgs } from 'node:util';

const SEPARATOR = '--';

/**
 * Reads the command line of the import.
 *
 * @param argv - The arguments after the script path.
 * @param env - The shell's environment, for `ANTHROPIC_API_KEY`.
 * @returns The options with absolute paths. The key is only set for a real run with intros.
 * @throws {Error} For a missing dataset or folder, an unknown option, or a real run with intros
 *   but no key.
 */
function parseImportOptions(
	argv: readonly string[],
	env: { ANTHROPIC_API_KEY?: string },
): ImportOptions {
	const { values } = parseArgs({
		allowNegative: true,
		args: argv[0] === SEPARATOR ? argv.slice(1) : [...argv],
		options: {
			dataset: { type: 'string' },
			'dry-run': { default: true, type: 'boolean' },
			folder: { type: 'string' },
			intro: { default: true, type: 'boolean' },
			manifest: { type: 'string' },
		},
		strict: true,
	});
	if (!values.dataset) {
		throw new Error('--dataset fehlt, z. B. --dataset development.');
	}
	if (!values.folder) {
		throw new Error('--folder fehlt: der Ordner mit den PDFs und der manifest.json.');
	}
	const withIntro = values.intro && !values['dry-run'];
	if (withIntro && !env.ANTHROPIC_API_KEY) {
		throw new Error('ANTHROPIC_API_KEY fehlt. Ohne Intros importieren: --no-intro.');
	}
	return {
		apiKey: withIntro ? env.ANTHROPIC_API_KEY : undefined,
		dataset: values.dataset,
		dryRun: values['dry-run'],
		folder: path.resolve(values.folder),
		manifest: path.resolve(values.manifest ?? path.join(values.folder, 'manifest.json')),
	};
}

interface ImportOptions {
	/** Only set for a real run with intros. */
	apiKey: string | undefined;
	dataset: string;
	dryRun: boolean;
	folder: string;
	manifest: string;
}

export { parseImportOptions };
export type { ImportOptions };
```

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter studio exec vp test run scripts/import-echo/options.test.ts` Expected: PASS. If Node's message for the unknown option differs, adapt the expected string to Node 24's exact text and say so in the ledger. Do not loosen it to `toThrow()`.

- [ ] **Step 5: Write the entry script**

`apps/studio/scripts/import-echo.ts`:

```ts
// oxlint-disable node/no-process-env -- the Anthropic key comes from the shell, nowhere else

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { getCliClient } from 'sanity/cli';

import { renderPdfPages } from '@tsgi-web/pdf-pages';

import { createArchiveStore } from './import-echo/archive-store';
import { draftIntro } from './import-echo/intro';
import { parseManifest } from './import-echo/manifest';
import { parseImportOptions } from './import-echo/options';
import { isSuccessful, runImport, summarize } from './import-echo/run-import';

// The releases API needs 2025-02-19 or later.
const API_VERSION = '2026-10-01';

const options = parseImportOptions(process.argv.slice(2), process.env);
const { apiKey } = options;
const plans = parseManifest(JSON.parse(await readFile(options.manifest, 'utf8')));
const client = getCliClient({ apiVersion: API_VERSION }).withConfig({
	dataset: options.dataset,
	useCdn: false,
});

console.log(
	`Projekt ${client.config().projectId}, Dataset ${options.dataset}, ${options.dryRun ? 'Probelauf ohne Schreiben' : 'Import'}: ${plans.length} Ausgaben`,
);

const report = await runImport(
	plans,
	{
		draftIntro: apiKey ? async (input) => draftIntro(input, { apiKey, fetch }) : undefined,
		log: (line) => console.log(line),
		now: () => new Date(),
		readPdf: async (file) => new Uint8Array(await readFile(path.join(options.folder, file))),
		renderPages: (bytes) => renderPdfPages(bytes),
		store: createArchiveStore(client),
	},
	{ dryRun: options.dryRun },
);

for (const line of summarize(report, options.dryRun)) {
	console.log(line);
}
process.exitCode = isSuccessful(report) ? 0 : 1;
```

Add to `scripts` in `apps/studio/package.json`, sorted:

```json
		"import:echo": "sanity exec scripts/import-echo.ts --with-user-token --",
```

- [ ] **Step 6: Build synthetic PDFs in the scratchpad**

These files never enter the repository. `<scratchpad>` is the session's scratchpad directory, never a folder inside the repository. The script lives there and borrows `pdf-lib` from `packages/pdf-pages`, which has it for its fixtures.

`<scratchpad>/echo-synthetic/make.mjs`:

```js
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire('/Users/ab/dev/customer/tsg/web/packages/pdf-pages/package.json');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const out = path.join(import.meta.dirname, 'folder');

async function make(file, pageCount, withText) {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	for (let index = 1; index <= pageCount; index++) {
		const page = pdf.addPage([595, 842]);
		page.drawRectangle({ color: rgb(0.85, 0.9, 1), height: 300, width: 400, x: 95, y: 400 });
		if (withText) {
			page.drawText(`Synthetische Testausgabe, Seite ${index}`, { font, size: 24, x: 60, y: 760 });
		}
	}
	await mkdir(path.dirname(path.join(out, file)), { recursive: true });
	await writeFile(path.join(out, file), await pdf.save());
}

await make('1980-1989/1985 - TSG Irlich - 9.Echo.pdf', 4, false);
await make('2000-2012/2010_09.pdf', 3, true);
await writeFile(
	path.join(out, 'manifest.json'),
	JSON.stringify(
		[
			{
				datei: '1980-1989/1985 - TSG Irlich - 9.Echo.pdf',
				erscheinungsdatum: '1985-12-01',
				titel: 'TSG ECHO 1985 Testausgabe',
			},
			{
				datei: '2000-2012/2010_09.pdf',
				erscheinungsdatum: '2010-12-01',
				titel: 'TSG ECHO 2010 Testausgabe',
			},
		],
		null,
		'\t',
	),
);
```

Run: `node <scratchpad>/echo-synthetic/make.mjs` Expected: `folder/` with two PDFs and a `manifest.json`.

- [ ] **Step 7: Dry run through `sanity exec` (reads only)**

This step proves that `sanity exec` (Vite's `runnerImport`) can load `@tsgi-web/pdf-pages`, with pdf.js and the native `@napi-rs/canvas`. A dry run reads `development` and writes nothing, so it needs no approval.

Run: `pnpm --filter studio run import:echo --dataset development --folder <scratchpad>/echo-synthetic/folder` Expected:

- `Projekt j4rxwl5m, Dataset development, Probelauf ohne Schreiben: 2 Ausgaben`
- `Release „TSG-Echo-Archiv“ würde angelegt.`
- `TSG ECHO 1985 Testausgabe: prüfen` with `4 Seiten, Scan ohne Textebene`
- `TSG ECHO 2010 Testausgabe: prüfen` with `3 Seiten, mit Textebene`
- `Probelauf: 2 geprüft, übersprungen: 0, fehlgeschlagen: 0`
- An `Auffindbar trotz Erscheinen vor 2013` line is possible only if `development` holds synthetic issues from WEB-352 dated before 2013 that are indexable. That is a correct finding, not a script failure: note the ids in the ledger.

If the project id is `undefined`, `sanity.cli.ts` did not see `SANITY_API_PROJECT_ID`. Rule the smallest fix: either `withConfig({ projectId })` from a `--project` option defaulting to the CLI config, or document that the command reads `apps/studio/.env`. Ledger it.

If loading fails inside `runnerImport` (for example "Cannot find module" for `@napi-rs/canvas` or the pdf.js worker), stop and rule. The candidate is running the entry with Node's own type stripping and a `createClient` fed by `SANITY_AUTH_TOKEN`, which `sanity exec` already sets. That is a plan defect only the spec can settle, so write the ruling down before changing course.

- [ ] **Step 8: Document the import**

Add after the "TSG-Echo issues" section in `apps/studio/AGENTS.md`:

````markdown
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

`--no-intro` imports without intros and without a key. `--manifest <file>` reads another list. `sanity exec --with-user-token` writes as the logged-in user, so run `pnpm exec sanity login` first. `ANTHROPIC_API_KEY` only ever comes from the shell. It does not belong in `.env`, Vercel or `turbo.json`.

**What it writes.** Per issue:

- the PDF as `<slug>.pdf`
- every page as `echo-<hash>-seite-<nnn>.jpg`
- a version `versions.tsg-echo-archiv.echo-archiv-<file name>` with `indexable: false` and a finished `render` whose `source` is the PDF, so the render webhook skips it

The intro is a draft from the cover, the next two pages and the text layer. The prompt forbids names and contact data. An issue whose intro could not be drafted is imported without one and listed at the end.

**Reruns.** The id comes from the file name. A rerun skips every issue that exists as published document, draft or version in the release, and imports an interrupted issue again. Sanity deduplicates its assets by content hash. A release that is no longer open (published, scheduled, archived) is refused before anything is uploaded.

**Before publishing.** Every run ends by checking that no `echo.issue` before 2013 is indexable, in any version. It exits with 1 if one is, or if an issue failed. The same check in Vision, perspective `raw`:

```groq
*[_type == "echo.issue" && releaseDate < "2013-01-01" && indexable != false]._id
```

The editors then review the intros in the release and publish it as a whole. To start over before publishing, archive the release in the studio, which deletes its versions.

**Privacy.** An uploaded asset is public on `cdn.sanity.io` from the moment of the upload, even while its document waits in the release. Its URL is not guessable, but the dataset is no place for test copies of real issues: try the script with synthetic PDFs.
````

- [ ] **Step 9: Run the whole studio suite and commit**

Run: `pnpm --filter studio run test:coverage` Expected: PASS, thresholds met.

```bash
pnpm run lint && pnpm run typecheck && pnpm run format:check
but diff
but commit -b feat/web-354-echo-archive-import -m "feat(studio): add the echo archive import command" <ids>
```

---

### Task 8: Trial run on `development`

This task writes to Sanity `development`. **Ask the user for an explicit yes immediately before Step 1.** Name the dataset and what gets written:

- two synthetic PDFs and seven page images
- the release `tsg-echo-archiv`
- two versions in it

Without the yes, skip the task and say so in the PR body.

**Files:** none in the repository. The ledger records the results.

- [ ] **Step 1: Real run without intros**

Claude has no Anthropic key, so the trial runs with `--no-intro`. The intro path is covered by Task 4's tests. The user can try it themselves with their own key in their own shell.

Run: `pnpm --filter studio run import:echo --dataset development --folder <scratchpad>/echo-synthetic/folder --no-dry-run --no-intro` Expected:

- `Release „TSG-Echo-Archiv“ wird angelegt.`
- two `importieren` lines
- `Angelegt: 2, übersprungen: 0, fehlgeschlagen: 0`
- `Ohne Intro: echo-archiv-1985-tsg-irlich-9-echo, echo-archiv-2010-09`
- exit code 0, unless `development` holds an older indexable issue (see Task 7, Step 7)

- [ ] **Step 2: Check what landed**

Through the Sanity MCP `query_documents` (project `j4rxwl5m`, dataset `development`, perspective `raw`):

```groq
*[_id in path("versions.tsg-echo-archiv.**")]{_id, title, indexable, "status": render.status, "pages": count(pages), "sourceIsPdf": render.source == pdf.asset._ref, "startedAt": render.startedAt}
```

Expected: two documents with:

- `indexable: false`
- `status: "done"`
- `pages` 4 and 3
- `sourceIsPdf: true`

- [ ] **Step 3: No webhook render**

Wait two minutes, then query again. Expected: `startedAt` is unchanged and `status` is still `done`. The render route would have written a new `startedAt` (acceptance criterion "ohne dass ein Webhook-Aufruf rendert").

- [ ] **Step 4: Rerun creates nothing**

Run the command from Step 1 again. Expected:

- two `schon vorhanden, übersprungen` lines
- `Angelegt: 0, übersprungen: 2, fehlgeschlagen: 0`
- the query from Step 2 still returns exactly two documents

- [ ] **Step 5: Hand the clean-up to the user**

Do not archive or delete anything. Tell the user in the final message that they can archive the release "TSG-Echo-Archiv" in the `development` studio to remove the two versions. The assets then stay as orphans, as with every deleted document.

---

## After the plan

- Final whole-branch review (`superpowers:executing-plans`), then the PR through `create-pr`:
  - ready for review
  - "Closes WEB-354"
  - the production steps below in the body
- Bind the PR and turn on Auto-fix.
- **Production, by the user after the merge:**
  1. Run `pnpm exec sanity login` in `apps/studio`.
  2. Run a dry run over the real folder: `pnpm --filter studio run import:echo --dataset production --folder <folder>`.
  3. Run the real run with the key in the shell: `--no-dry-run`.
  4. Check the summary and the GROQ check from `apps/studio/AGENTS.md`.
  5. The editors review the intros in the release "TSG-Echo-Archiv" and publish it.
