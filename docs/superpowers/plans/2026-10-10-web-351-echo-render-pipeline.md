# WEB-351 TSG-Echo Render Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Editors upload a TSG-Echo PDF in the studio, and a Sanity webhook makes the web app render every page to an image, extract the text and write both back into the document, so that WEB-352 can show the issue as a flipbook.

**Architecture:**

- A new workspace package `@tsgi-web/pdf-pages` turns PDF bytes into one JPEG plus text per page (`pdfjs-dist` + `@napi-rs/canvas`). It knows nothing about Sanity.
- The studio gets the document type `echo.issue`, the singleton `echoOverview`, a desk entry, a document action "Seiten neu erzeugen" and an AI Assist preset "Intro erzeugen".
- The web app gets `POST /api/echo/render`:
  - it verifies the webhook signature and claims the document,
  - it answers `202`, then renders inside `after()`.
- The orchestration (`claimRender`, `runRender`) only talks to a small `EchoRenderStore` interface, so it is tested against an in-memory fake. The Sanity adapter behind that interface is tested against a fake client.

**Tech Stack:** Next.js 16.4 App Router (`after`, route handlers), `next-sanity` 13 (`parseBody`), `@sanity/client` 8, Sanity Studio 6.18, `pdfjs-dist` 6.4, `@napi-rs/canvas` 1.0, `pdf-lib` (test fixtures only), Zod 4, Vitest 5 through Vite+ (`vp test`), GitButler (`but`).

**Spec:**

- Linear [WEB-58](https://linear.app/tsg-irlich/issue/WEB-58/tsg-echo): concept in the description, spike results in the comment of 2026-10-10.
- [WEB-351](https://linear.app/tsg-irlich/issue/WEB-351/tsg-echo-dokumenttyp-render-paket-und-render-route): scope, acceptance criteria, "Erkenntnisse aus dem Spike".

**Branch:** `feat/web-351-echo-render-pipeline`. GitButler creates it on the first `but commit -b`.

## Global Constraints

**Scope and git**

- Commits go through the `create-commit` skill, which resolves to `but commit -b feat/web-351-echo-render-pipeline -m "…" <ids>`. Use Conventional Commits with an English message, and no `Co-Authored-By` or generator trailer. Never run a raw `git` write command.
- Run `pnpm run format:check` from the repository root before every commit, because `but commit` skips lefthook. Format with `pnpm run format`.
- After every task these must be clean: `pnpm run lint`, `pnpm run typecheck` and the tests of the touched workspaces.
- No writes to the Sanity dataset `production`. Writes to `development` need an explicit "yes" from the user in chat right before they happen.
- Out of scope, because they belong to WEB-352: `INTERNAL_LINK_TARGETS`, `getHrefForType`, `REVALIDATION_MAP`, every page and component of the website. If `echoOverview` went into `INTERNAL_LINK_TARGETS` now, editors could link a page that does not exist yet.

**Values (exact)**

- Rendering: longest edge `2000` px, JPEG quality `85`, white page background before rendering.
- Route: `export const maxDuration = 800`, time budget `750_000` ms, at most `3` write attempts, error messages cut to `500` characters.
- Webhook filter: `_type == "echo.issue" && defined(pdf.asset) && (!defined(render.source) || render.source != pdf.asset._ref)`
- Webhook projection: `{ _id, "pdfRef": pdf.asset._ref }`.
  - This deviates from WEB-351, which also projected `pdfUrl`.
  - The spike's SSRF finding means the route builds the URL from the asset reference itself.
- `next.config.ts`: `serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist']`.
- The pdf.js worker is imported statically and handed over as `globalThis.pdfjsWorker`.
- Environment variables (web): `SANITY_API_WRITE_TOKEN`, `SANITY_ECHO_RENDER_SECRET`.
- `render.status` values: `pending`, `done`, `failed`.
- A PDF asset reference matches `^file-([0-9a-f]{40})-pdf$`. Its CDN URL is `https://cdn.sanity.io/files/<projectId>/<dataset>/<hash>.pdf`.

**Copy (German, exact)**

- Studio:
  - type titles `TSG-Echo-Ausgabe` and `TSG-Echo Übersicht`
  - desk entry `TSG-Echo`
  - field group `Seiten (automatisch)`
  - action `Seiten neu erzeugen`
  - AI Assist instruction `Intro erzeugen`
- Render errors stored in `render.error`:
  - `Die PDF enthält keine Seiten.`
  - `Zeitlimit überschritten: Die PDF konnte nicht vollständig verarbeitet werden.`
  - `Die PDF konnte nicht geladen werden (HTTP <status>).`
  - `Ungültige PDF-Referenz <ref>`

**Code style**

- Tabs, single quotes, named exports, interfaces and types at the end of a file, kebab-case file names, JSDoc on every top-level function.
- Outside test files `sort-keys` and `no-magic-numbers` are active. Keep object keys sorted and name numeric constants. The code below already follows both rules. If lint still flags something, name the constant and do not disable the rule.
- No `try`/`catch`/`finally` in React components or hooks; the studio action is one. Library and route code awaits through `settle()` from `@tsgi-web/shared`. A `try`/`finally` inside the render generator is fine, because it is neither a component nor a hook.
- Tests import `describe`/`it`/`expect`/`vi` from `vite-plus/test` and assert behaviour, never class names.

## Review Focus

1. **A corrupt, encrypted or non-PDF file is uploaded.** The run has to end in `failed` with a readable message, never in an endless `pending`. Pinned in Task 1 (the generator rejects) and Task 7 (`failed` with the message).
2. **An upload to Sanity fails after some pages.** The document has to end in `failed`, and no partial `pages` array may be written. Pinned in Task 7.
3. **The document is deleted or gets a new PDF while a run is busy.** The old run has to throw its result away and write nothing. Pinned in Task 7.
4. **Two webhook deliveries arrive at the same time.** Only one run may start; the other gets `409` and Sanity retries it, which then sees `duplicate`. Pinned in Task 6 (store conflict), Task 7 (claim conflict) and Task 8 (route answers 409).
5. **A crafted payload names an image, a path or another host.** It is rejected with `400` before anything is fetched. Pinned in Task 5 (URL helper) and Task 8 (route).

---

### Task 1: Package `@tsgi-web/pdf-pages`

**Files:**

- Create: `packages/pdf-pages/package.json`
- Create: `packages/pdf-pages/tsconfig.json`
- Create: `packages/pdf-pages/vitest.config.ts`
- Create: `packages/pdf-pages/README.md`
- Create: `packages/pdf-pages/src/index.ts`
- Create: `packages/pdf-pages/src/render-pdf-pages.ts`
- Create: `packages/pdf-pages/test-utils/create-fixture-pdf.ts`
- Test: `packages/pdf-pages/src/render-pdf-pages.test.ts`
- Modify: `pnpm-workspace.yaml` (catalog, written by `pnpm add`)

**Interfaces:**

- Produces:
  - `renderPdfPages(bytes: Uint8Array, options?: RenderOptions): AsyncGenerator<RenderedPage>`
  - `RenderOptions { maxEdge?: number; quality?: number }`
  - `RenderedPage { height: number; index: number; jpeg: Uint8Array; text: string; width: number }`, where `index` is 1-based.
  - All three are exported from `@tsgi-web/pdf-pages`.

- [ ] **Step 1: Scaffold the package**

`packages/pdf-pages/package.json`:

```json
{
	"name": "@tsgi-web/pdf-pages",
	"version": "0.1.0",
	"private": true,
	"description": "Renders the pages of a PDF to JPEG images and extracts their text.",
	"type": "module",
	"exports": {
		".": "./src/index.ts"
	},
	"scripts": {
		"lint": "vp lint",
		"lint:fix": "vp lint --fix",
		"lint:github": "vp lint --format=github",
		"test": "vp test run",
		"test:coverage": "vp test run --coverage",
		"test:watch": "vp test",
		"typecheck": "tsc --noEmit"
	}
}
```

`packages/pdf-pages/tsconfig.json`:

```json
{
	"extends": "@mheob/tsconfig/esm",
	"compilerOptions": {
		"noEmit": true,
		"types": ["node"]
	},
	"include": ["src", "test-utils", "vitest.config.ts"]
}
```

`packages/pdf-pages/vitest.config.ts`:

```ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
	test: {
		coverage: {
			exclude: ['**/*.test.ts', '**/test-utils/**', '**/*.config.ts', '**/index.ts'],
			// Vitest 4 replaced `coverage.all` with this: without it only files a test happens to
			// import are scored, so an untested file drops out of the denominator.
			include: ['src/**/*.ts'],
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
			// Fully covered and it stays that way, like `packages/shared` and `packages/email`.
			thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
		},
		environment: 'node',
		include: ['src/**/*.test.ts'],
	},
});
```

`packages/pdf-pages/README.md`:

```markdown
# @tsgi-web/pdf-pages

Renders every page of a PDF to a JPEG and extracts its text layer, one page at a time, so only one canvas is in memory. Used by the TSG-Echo render route (`apps/web/src/app/api/echo/render`) and the archive import (WEB-354).

Built on `pdfjs-dist` and `@napi-rs/canvas`, which ships a native binary. A Next.js app that uses this package has to list both in `serverExternalPackages`.
```

Then install the dependencies. `catalogMode: strict` writes them into the catalog:

```bash
pnpm --filter @tsgi-web/pdf-pages add pdfjs-dist@^6.4.299 @napi-rs/canvas@^1.0.10
pnpm --filter @tsgi-web/pdf-pages add -D pdf-lib@^1.17.1 @mheob/tsconfig @types/node @vitest/coverage-v8 typescript vite-plus vitest
```

Check that `@types/node` resolved to the existing `^24.19.1` catalog entry and not to 26, since Node 26 waits for Vercel.

- [ ] **Step 2: Write the fixture helper**

`packages/pdf-pages/test-utils/create-fixture-pdf.ts`:

```ts
import { PDFDocument, StandardFonts } from 'pdf-lib';

/** A4 in PDF points. */
const A4: [number, number] = [595.28, 841.89];
const FONT_SIZE = 24;
const MARGIN = 72;

/**
 * Builds a PDF with one A4 page per entry, each carrying its entry as a line of real text, so the
 * text layer can be extracted again.
 *
 * @param pages - The text of every page, in order.
 * @returns The PDF's bytes.
 */
export async function createFixturePdf(pages: readonly string[]): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	for (const text of pages) {
		const page = pdf.addPage(A4);
		page.drawText(text, { font, size: FONT_SIZE, x: MARGIN, y: A4[1] - MARGIN });
	}
	return pdf.save();
}
```

- [ ] **Step 3: Write the failing tests**

`packages/pdf-pages/src/render-pdf-pages.test.ts`:

```ts
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { describe, expect, it } from 'vite-plus/test';

import { createFixturePdf } from '../test-utils/create-fixture-pdf';
import { renderPdfPages } from './render-pdf-pages';
import type { RenderedPage } from './render-pdf-pages';

async function collect(pages: AsyncIterable<RenderedPage>): Promise<RenderedPage[]> {
	const result: RenderedPage[] = [];
	for await (const page of pages) {
		result.push(page);
	}
	return result;
}

describe('pdf page rendering', () => {
	it('yields one page per PDF page, in order and numbered from 1', async () => {
		const pdf = await createFixturePdf(['Seite eins', 'Seite zwei']);

		const pages = await collect(renderPdfPages(pdf));

		expect(pages.map((page) => page.index)).toStrictEqual([1, 2]);
	});

	it('scales the longer edge of an A4 page to 2000 px by default', async () => {
		const pdf = await createFixturePdf(['Hochformat']);

		const [page] = await collect(renderPdfPages(pdf));

		expect(page).toMatchObject({ height: 2000, width: 1414 });
	});

	it('honours a custom longest edge', async () => {
		const pdf = await createFixturePdf(['Klein']);

		const [page] = await collect(renderPdfPages(pdf, { maxEdge: 1000 }));

		expect(page).toMatchObject({ height: 1000, width: 707 });
	});

	it('encodes every page as a JPEG', async () => {
		const pdf = await createFixturePdf(['JPEG']);

		const [page] = await collect(renderPdfPages(pdf));

		expect([...(page?.jpeg.subarray(0, 3) ?? [])]).toStrictEqual([0xff, 0xd8, 0xff]);
		expect([...(page?.jpeg.subarray(-2) ?? [])]).toStrictEqual([0xff, 0xd9]);
	});

	it('produces a smaller file at a lower quality', async () => {
		const pdf = await createFixturePdf(['Qualität']);

		const [high] = await collect(renderPdfPages(pdf, { quality: 95 }));
		const [low] = await collect(renderPdfPages(pdf, { quality: 20 }));

		expect(low?.jpeg.length).toBeLessThan(high?.jpeg.length ?? 0);
	});

	// A transparent page area would come out black in a JPEG; the renderer fills it with paper white.
	it('paints the page on a white background', async () => {
		const pdf = await createFixturePdf(['Weiß']);
		const [page] = await collect(renderPdfPages(pdf, { maxEdge: 200 }));
		const image = await loadImage(Buffer.from(page?.jpeg ?? []));
		const canvas = createCanvas(image.width, image.height);
		const context = canvas.getContext('2d');
		context.drawImage(image, 0, 0);

		const [red, green, blue] = context.getImageData(image.width - 2, image.height - 2, 1, 1).data;

		expect(Math.min(red ?? 0, green ?? 0, blue ?? 0)).toBeGreaterThanOrEqual(245);
	});

	it('extracts the text of every page', async () => {
		const pdf = await createFixturePdf(['Seite eins', 'Seite zwei']);

		const pages = await collect(renderPdfPages(pdf));

		expect(pages.map((page) => page.text)).toStrictEqual(['Seite eins', 'Seite zwei']);
	});

	it('rejects bytes that are not a PDF', async () => {
		const bytes = new TextEncoder().encode('Das ist keine PDF.');

		await expect(collect(renderPdfPages(bytes))).rejects.toThrow();
	});

	it('leaves the bytes it was given intact', async () => {
		const pdf = await createFixturePdf(['Unverändert']);
		const length = pdf.byteLength;

		await collect(renderPdfPages(pdf));

		expect(pdf.byteLength).toBe(length);
	});
});
```

- [ ] **Step 4: Run them to see them fail**

Run: `pnpm --filter @tsgi-web/pdf-pages run test` Expected: FAIL, because `./render-pdf-pages` cannot be resolved.

- [ ] **Step 5: Implement**

`packages/pdf-pages/src/render-pdf-pages.ts`:

```ts
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
// @ts-expect-error -- pdf.js ships no declarations for its worker module
import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

// Under Node pdf.js runs its worker in-process and would import this file at runtime, which
// Next.js' output tracing never sees (the spike failed with "Setting up fake worker failed").
// Importing it statically ships the file and pdf.js picks it up from here.
(globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker;

const DEFAULT_MAX_EDGE = 2000;
const DEFAULT_QUALITY = 85;
const FIRST_PAGE = 1;
const ORIGIN = 0;
const PAPER = '#ffffff';
const UNIT_SCALE = 1;

/**
 * Renders every page of a PDF to a JPEG and extracts its text, one page at a time, so that only a
 * single canvas is held in memory however long the PDF is.
 *
 * @param bytes - The PDF. pdf.js gets a copy, so the caller's buffer stays usable.
 * @param options - The longest edge in pixels and the JPEG quality.
 * @yields One rendered page after the other, numbered from 1.
 */
export async function* renderPdfPages(
	bytes: Uint8Array,
	options: RenderOptions = {},
): AsyncGenerator<RenderedPage> {
	const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
	const quality = options.quality ?? DEFAULT_QUALITY;
	const pdf = await getDocument({ data: bytes.slice(), verbosity: 0 }).promise;

	try {
		for (let index = FIRST_PAGE; index <= pdf.numPages; index++) {
			yield await renderPage(pdf, index, maxEdge, quality);
		}
	} finally {
		await pdf.destroy();
	}
}

/**
 * Renders one page and extracts its text.
 *
 * @param pdf - The loaded document.
 * @param index - The 1-based page number.
 * @param maxEdge - The longest edge of the image in pixels.
 * @param quality - The JPEG quality from 0 to 100.
 * @returns The rendered page.
 */
async function renderPage(
	pdf: PDFDocumentProxy,
	index: number,
	maxEdge: number,
	quality: number,
): Promise<RenderedPage> {
	const page = await pdf.getPage(index);
	const base = page.getViewport({ scale: UNIT_SCALE });
	const viewport = page.getViewport({ scale: maxEdge / Math.max(base.width, base.height) });
	const width = Math.round(viewport.width);
	const height = Math.round(viewport.height);
	const canvas = createCanvas(width, height);
	const context = canvas.getContext('2d');
	// A transparent area would turn black in the JPEG, so the page gets paper first.
	context.fillStyle = PAPER;
	context.fillRect(ORIGIN, ORIGIN, width, height);
	await page.render({
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- @napi-rs/canvas implements the subset pdf.js draws with
		canvas: canvas as unknown as HTMLCanvasElement,
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see above
		canvasContext: context as unknown as CanvasRenderingContext2D,
		viewport,
	}).promise;
	const jpeg = await canvas.encode('jpeg', quality);
	const text = await extractText(page);
	page.cleanup();
	return { height, index, jpeg, text, width };
}

/**
 * Joins the text items of a page, keeping its line breaks and collapsing runs of spaces.
 *
 * @param page - The page to read.
 * @returns The page's text, empty for a scan without a text layer.
 */
async function extractText(page: PDFPageProxy): Promise<string> {
	const content = await page.getTextContent();
	return content.items
		.map((item) => ('str' in item ? `${item.str}${item.hasEOL ? '\n' : ' '}` : ''))
		.join('')
		.replaceAll(/[ \t]+/gu, ' ')
		.trim();
}

export interface RenderOptions {
	/** The longest edge of every image in pixels. Default: 2000. */
	maxEdge?: number;
	/** The JPEG quality from 0 to 100. Default: 85. */
	quality?: number;
}

export interface RenderedPage {
	height: number;
	/** The 1-based page number. */
	index: number;
	jpeg: Uint8Array;
	/** The page's text layer; empty for a scan. */
	text: string;
	width: number;
}
```

`packages/pdf-pages/src/index.ts`:

```ts
export { renderPdfPages } from './render-pdf-pages';
export type { RenderOptions, RenderedPage } from './render-pdf-pages';
```

If `tsc` reports that `PDFDocumentProxy`/`PDFPageProxy` are not exported from the legacy entry, import the types from `pdfjs-dist` instead (`import type { … } from 'pdfjs-dist'`). The runtime import stays on the legacy build.

- [ ] **Step 6: Run the tests and the coverage gate**

Run: `pnpm --filter @tsgi-web/pdf-pages run test:coverage` Expected: PASS, 9 tests, 100% on every metric.

Then run: `pnpm --filter @tsgi-web/pdf-pages run typecheck && pnpm --filter @tsgi-web/pdf-pages run lint` Expected: no errors.

- [ ] **Step 7: Commit**

`build(pdf-pages): add the pdf page renderer`, covering the whole `packages/pdf-pages` folder, `pnpm-workspace.yaml` and `pnpm-lock.yaml`.

---

### Task 2: Studio document type `echo.issue`

**Files:**

- Create: `apps/studio/shared/fields/pdf.ts`
- Test: `apps/studio/shared/fields/pdf.test.ts`
- Modify: `apps/studio/schemas/objects/document-download.ts` (use the shared validator)
- Modify: `apps/studio/shared/field-groups.ts` (add `pages`)
- Create: `apps/studio/schemas/documents/echo.issue.ts`
- Test: `apps/studio/schemas/documents/echo.issue.test.ts`
- Modify: `apps/studio/schemas/index.ts` (register)

**Interfaces:**

- Produces:
  - `validatePdfFile(file?: { asset?: unknown }): true | string` from `@/shared/fields/pdf`
  - the field group `pages` from `@/shared/field-groups`
  - the default export of `@/schemas/documents/echo.issue`, which is `echoIssue` with `name: 'echo.issue'`
  - its fields: `title`, `slug`, `releaseDate`, `pdf`, `intro`, `meta`, `pages`, `extractedText`, `render { source, status, pageCount, error, startedAt, finishedAt }`

- [ ] **Step 1: Write the failing tests for the shared PDF validator**

`apps/studio/shared/fields/pdf.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import { validatePdfFile } from './pdf';

describe('pdf file validation', () => {
	it('accepts an empty field, which Rule.required() reports instead', () => {
		expect(validatePdfFile()).toBe(true);
	});

	it('accepts a PDF', () => {
		expect(validatePdfFile({ asset: { mimeType: 'application/pdf' } })).toBe(true);
	});

	it('accepts an asset reference that does not carry a mime type yet', () => {
		expect(validatePdfFile({ asset: { _ref: 'file-abc-pdf' } })).toBe(true);
	});

	it('rejects any other mime type', () => {
		expect(validatePdfFile({ asset: { mimeType: 'image/png' } })).toBe(
			'Nur PDF-Dateien sind erlaubt',
		);
	});
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter studio exec vp test run shared/fields/pdf.test.ts` Expected: FAIL, because `./pdf` cannot be resolved.

- [ ] **Step 3: Extract the validator and reuse it**

`apps/studio/shared/fields/pdf.ts`:

```ts
/**
 * Rejects a file whose asset is not a PDF. An empty field passes, because requiring a file is the
 * job of `Rule.required()`.
 *
 * @param file - The value of a `file` field.
 * @returns `true`, or the German message the studio shows.
 */
function validatePdfFile(file?: { asset?: unknown }): true | string {
	if (!file) {
		return true;
	}
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the upload widget stores the asset with its mime type
	const asset = file.asset as { mimeType?: string } | undefined;
	return asset?.mimeType && asset.mimeType !== 'application/pdf'
		? 'Nur PDF-Dateien sind erlaubt'
		: true;
}

export { validatePdfFile };
```

In `apps/studio/schemas/objects/document-download.ts`, replace the inline `Rule.custom((file) => { … })` with `Rule.custom(validatePdfFile)` and import `validatePdfFile` from `@/shared/fields/pdf`. The existing `document-download.test.ts` has to stay green unchanged.

- [ ] **Step 4: Run both tests**

Run: `pnpm --filter studio exec vp test run shared/fields/pdf.test.ts schemas/objects/document-download.test.ts` Expected: PASS.

- [ ] **Step 5: Add the field group**

In `apps/studio/shared/field-groups.ts`, add the group and export it in alphabetical position:

```ts
const pages = {
	name: 'pages',
	title: 'Seiten (automatisch)',
};
```

```ts
export { additionalInformation, contact, content, excerpt, general, meta, pages, personal };
```

- [ ] **Step 6: Write the failing tests for `echo.issue`**

`apps/studio/schemas/documents/echo.issue.test.ts`:

```ts
import type { PreviewValue } from 'sanity';
import { describe, expect, it } from 'vite-plus/test';

import echoIssue from './echo.issue';

interface EchoIssueSelection {
	readonly media?: PreviewValue['media'];
	readonly releaseDate?: string;
	readonly status?: string;
	readonly title?: string;
}

function prepare(selection: EchoIssueSelection): PreviewValue {
	return (echoIssue.preview.prepare as unknown as (value: EchoIssueSelection) => PreviewValue)(
		selection,
	);
}

function field(name: string): { readOnly?: boolean; group?: string } | undefined {
	return (
		echoIssue.fields as unknown as { group?: string; name: string; readOnly?: boolean }[]
	).find((candidate) => candidate.name === name);
}

describe('echo issue preview', () => {
	it('shows the year and that the pages are ready', () => {
		expect(
			prepare({ releaseDate: '2025-04-01', status: 'done', title: 'TSG ECHO 2025' }),
		).toStrictEqual({
			media: undefined,
			subtitle: '2025 · Seiten fertig',
			title: 'TSG ECHO 2025',
		});
	});

	it('says that pages are being generated while a run is pending', () => {
		expect(prepare({ releaseDate: '2025-04-01', status: 'pending', title: 'X' }).subtitle).toBe(
			'2025 · Seiten werden erzeugt',
		);
	});

	it('flags a failed run', () => {
		expect(prepare({ releaseDate: '2025-04-01', status: 'failed', title: 'X' }).subtitle).toBe(
			'2025 · Fehler beim Erzeugen',
		);
	});

	it('says that there are no pages yet before the first run', () => {
		expect(prepare({ releaseDate: '2025-04-01', title: 'X' }).subtitle).toBe(
			'2025 · Noch keine Seiten',
		);
	});

	it('leaves out a missing release date', () => {
		expect(prepare({ status: 'done', title: 'X' }).subtitle).toBe('Seiten fertig');
	});

	it('passes the cover through as media', () => {
		expect(prepare({ media: 'image-cover', title: 'X' }).media).toBe('image-cover');
	});
});

describe('echo issue fields', () => {
	// Editors must never edit what the render route writes; the route treats these as its own.
	it.each(['pages', 'extractedText', 'render'])('keeps %s read-only in the pages group', (name) => {
		expect(field(name)).toMatchObject({ group: 'pages', readOnly: true });
	});

	it('lets editors write the intro in the general group', () => {
		expect(field('intro')).toMatchObject({ group: 'general' });
		expect(field('intro')?.readOnly).toBeUndefined();
	});
});
```

- [ ] **Step 7: Run them to see them fail**

Run: `pnpm --filter studio exec vp test run schemas/documents/echo.issue.test.ts` Expected: FAIL, because `./echo.issue` cannot be resolved.

- [ ] **Step 8: Implement the type**

`apps/studio/schemas/documents/echo.issue.ts`:

```ts
import { RiBookOpenLine } from 'react-icons/ri';
import type { PreviewValue } from 'sanity';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { general, meta, pages } from '@/shared/field-groups';
import { introField, slugField, titleField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { validatePdfFile } from '@/shared/fields/pdf';

const YEAR_LENGTH = 4;

const STATUS_LABELS: Record<string, string> = {
	done: 'Seiten fertig',
	failed: 'Fehler beim Erzeugen',
	pending: 'Seiten werden erzeugt',
};

/**
 * The subtitle of an issue in lists: its year and where the page generation stands.
 *
 * @param releaseDate - The release date as `YYYY-MM-DD`.
 * @param status - The `render.status`, if any run has started.
 * @returns The subtitle, e.g. `2025 · Seiten fertig`.
 */
function getSubtitle(releaseDate?: string, status?: string): string {
	const state = status ? (STATUS_LABELS[status] ?? status) : 'Noch keine Seiten';
	return [releaseDate?.slice(0, YEAR_LENGTH), state].filter(Boolean).join(' · ');
}

const echoIssue = defineType({
	fields: [
		titleField,
		slugField,
		defineField({
			description: 'Bestimmt die Reihenfolge im Archiv und das angezeigte Jahr.',
			group: 'general',
			name: 'releaseDate',
			title: 'Erscheinungsdatum',
			type: 'date',
			validation: (Rule) => Rule.required().error('Das Erscheinungsdatum ist erforderlich'),
		}),
		defineField({
			description:
				'Die komplette Ausgabe als PDF. Nach dem Hochladen erzeugt die Website die Seiten zum Durchblättern automatisch; das dauert wenige Minuten.',
			group: 'general',
			name: 'pdf',
			options: { accept: 'application/pdf' },
			title: 'PDF',
			type: 'file',
			validation: (Rule) => [
				Rule.required().error('Die PDF ist erforderlich'),
				Rule.custom(validatePdfFile),
			],
		}),
		defineField({
			...introField,
			description:
				'Zwei bis drei Sätze zur Ausgabe. Die KI-Anweisung „Intro erzeugen“ schlägt einen Text aus dem Inhalt der Ausgabe vor.',
			rows: 4,
		}),
		metaField,
		defineField({
			description: 'Wird automatisch aus der PDF erzeugt.',
			group: 'pages',
			name: 'pages',
			of: [defineArrayMember({ type: 'image' })],
			readOnly: true,
			title: 'Seiten',
			type: 'array',
		}),
		defineField({
			description: 'Die Textebene der PDF. Bei eingescannten Ausgaben bleibt sie leer.',
			group: 'pages',
			name: 'extractedText',
			readOnly: true,
			rows: 8,
			title: 'Text der Ausgabe',
			type: 'text',
		}),
		defineField({
			fields: [
				defineField({ name: 'source', title: 'Erzeugt aus', type: 'string' }),
				defineField({
					name: 'status',
					options: {
						list: [
							{ title: 'Wird erzeugt', value: 'pending' },
							{ title: 'Fertig', value: 'done' },
							{ title: 'Fehler', value: 'failed' },
						],
					},
					title: 'Status',
					type: 'string',
				}),
				defineField({ name: 'pageCount', title: 'Seitenzahl', type: 'number' }),
				defineField({ name: 'error', rows: 3, title: 'Fehlermeldung', type: 'text' }),
				defineField({ name: 'startedAt', title: 'Gestartet', type: 'datetime' }),
				defineField({ name: 'finishedAt', title: 'Beendet', type: 'datetime' }),
			],
			group: 'pages',
			name: 'render',
			readOnly: true,
			title: 'Erzeugung',
			type: 'object',
		}),
	],
	groups: [general, meta, pages],
	icon: RiBookOpenLine,
	name: 'echo.issue',
	orderings: [
		{
			by: [{ direction: 'desc', field: 'releaseDate' }],
			name: 'releaseDateDesc',
			title: 'Erscheinungsdatum, neuste zuerst',
		},
	],
	preview: {
		prepare: ({
			media,
			releaseDate,
			status,
			title,
		}: {
			media?: PreviewValue['media'];
			releaseDate?: string;
			status?: string;
			title?: string;
		}) => ({ media, subtitle: getSubtitle(releaseDate, status), title }),
		select: {
			media: 'pages.0.asset',
			releaseDate: 'releaseDate',
			status: 'render.status',
			title: 'title',
		},
	},
	title: 'TSG-Echo-Ausgabe',
	type: 'document',
});

export default echoIssue;
```

Register it in `apps/studio/schemas/index.ts`: `import echoIssue from './documents/echo.issue';` among the document imports, and add `echoIssue,` to `schemaTypes` after `newsCategory,` in the Documents block.

- [ ] **Step 9: Run the studio suite**

Run: `pnpm --filter studio run test` Expected: PASS, including the 10 new cases of `echo.issue.test.ts` and the 4 of `pdf.test.ts`.

- [ ] **Step 10: Commit**

`feat(studio): add the tsg-echo issue document type`.

---

### Task 3: Studio `echoOverview` singleton and desk entry

**Files:**

- Create: `apps/studio/schemas/single-pages/echo-overview.ts`
- Modify: `apps/studio/schemas/index.ts` (register in the Single Pages block)
- Modify: `apps/studio/plugins/index.ts` (both lists)
- Modify: `apps/studio/structure/index.ts` (group `echo`, exclusion)
- Modify: `apps/studio/plugins/singleton.ts` (show the group)
- Test: `apps/studio/structure/index.test.ts`

**Interfaces:**

- Consumes: `echoIssue.name === 'echo.issue'` (Task 2).
- Produces:
  - the default export of `@/schemas/single-pages/echo-overview`, which is `echoOverviewPage` with `name: 'echoOverview'`
  - its fields: hidden `slug` with value `tsg-echo`, `title`, `subtitle`, `intro` (`simpleBlockContent`), `meta`
  - `getGroup(S, 'echo')` in `@/structure`

- [ ] **Step 1: Write the failing structure tests**

Add to `apps/studio/structure/index.test.ts`:

In the `excluded default list items` block:

```ts
it('excludes the echo issue, which has its own desk entry', () => {
	expect(isExcludedDefaultListItem('echo.issue')).toBe(false);
});
```

In the `desk group resolution` block:

```ts
it('resolves the echo group to the issue list, newest release first', () => {
	const { calls, structureBuilder } = createRecordingStructureBuilder();

	getGroup(structureBuilder, 'echo');

	const lists = calls
		.filter((call) => call.method === 'documentTypeList')
		.map((call) => call.args[0]);
	const orderings = calls
		.filter((call) => call.method === 'defaultOrdering')
		.map((call) => call.args[0]);
	const titles = calls.filter((call) => call.method === 'title').map((call) => call.args[0]);

	expect(lists).toStrictEqual(['echo.issue']);
	expect(orderings).toStrictEqual([[{ direction: 'desc', field: 'releaseDate' }]]);
	expect(titles).toContain('TSG-Echo');
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm --filter studio exec vp test run structure/index.test.ts` Expected: FAIL. `echo.issue` is not excluded, and `'echo'` falls back to the settings group.

- [ ] **Step 3: Implement the group**

In `apps/studio/structure/index.ts`:

- add `RiBookOpenLine` to the `react-icons/ri` import
- extend `DocumentGroup` to `'echo' | 'groups' | 'news' | 'persons' | 'settings' | 'single-pages'`
- add the function below
- add `'echo.issue',` to the list in `isExcludedDefaultListItem`, alphabetically after `'author',`
- add the case to `getGroup`

```ts
/**
 * Returns the group for the TSG-Echo issues, newest release first.
 *
 * @param S - The structure builder.
 * @returns The group for the TSG-Echo issues.
 */
function getGroupEcho(S: StructureBuilder): ListItemBuilder[] {
	return [
		S.listItem()
			.title('TSG-Echo')
			.id('echo')
			.icon(RiBookOpenLine)
			.child(
				S.documentTypeList('echo.issue')
					.title('TSG-Echo')
					.defaultOrdering([{ direction: 'desc', field: 'releaseDate' }]),
			),
	];
}
```

```ts
		case 'echo': {
			return getGroupEcho(S);
		}
```

In `apps/studio/plugins/singleton.ts` (`pageStructure`), add `...getGroup(S, 'echo'),` directly after `...getGroup(S, 'news'),`.

- [ ] **Step 4: Implement the singleton**

`apps/studio/schemas/single-pages/echo-overview.ts`:

```ts
import { RiBookOpenLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const echoOverviewPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('tsg-echo'),

		// General
		...defaultHeroFields,
		defineField({
			description: 'Der einleitende Text über dem Archiv aller Ausgaben.',
			group: 'general',
			name: 'intro',
			title: 'Intro',
			type: 'simpleBlockContent',
		}),

		// Meta
		metaField,
	],
	groups: [general, meta],
	icon: RiBookOpenLine,
	name: 'echoOverview',
	preview: {
		prepare: () => ({ title: 'TSG-Echo Übersicht' }),
	},
	title: 'TSG-Echo Übersicht',
	type: 'document',
});

export default echoOverviewPage;
```

Register it:

- in `apps/studio/schemas/index.ts`: `import echoOverviewPage from './single-pages/echo-overview';`, and `echoOverviewPage,` in the Single Pages block after `departmentsPage,`
- in `apps/studio/plugins/index.ts`: `import echoOverviewPage from '@/schemas/single-pages/echo-overview';`, then add `echoOverviewPage` to `pageStructure([...])` after `aboutUsPage` and `echoOverviewPage.name` to `singletonPlugin([...])` after `aboutUsPage.name`

- [ ] **Step 5: Run the studio suite and check the desk**

Run: `pnpm --filter studio run test` Expected: PASS.

Then start the studio through the preview tool (`preview_start` with `studio`) and check that the desk shows "TSG-Echo" below "News" and "TSG-Echo Übersicht" under "Einzelseiten". The local studio runs against `production` (`apps/studio/.env`), so **only look and create nothing.**

- [ ] **Step 6: Commit**

`feat(studio): add the tsg-echo overview page and desk entry`.

---

### Task 4: Studio action "Seiten neu erzeugen" and AI Assist preset

**Files:**

- Create: `apps/studio/actions/regenerate-echo-pages.tsx`
- Test: `apps/studio/actions/regenerate-echo-pages.test.ts`
- Modify: `apps/studio/sanity.config.ts` (`document.actions`)
- Modify: `apps/studio/plugins/assist.ts` (preset)

**Interfaces:**

- Consumes: `echoIssue.name` (Task 2).
- Produces:
  - `RegenerateEchoPagesAction`, a `DocumentActionComponent`
  - `getRegenerateState(document: Record<string, unknown> | null | undefined): { disabled: boolean; title: string }`

- [ ] **Step 1: Write the failing tests**

`apps/studio/actions/regenerate-echo-pages.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import { getRegenerateState } from './regenerate-echo-pages';

describe('regenerate echo pages state', () => {
	it('is disabled without a document', () => {
		expect(getRegenerateState(undefined)).toStrictEqual({
			disabled: true,
			title: 'Zuerst eine PDF hochladen',
		});
	});

	it('is disabled while no PDF is set', () => {
		expect(getRegenerateState({ title: 'TSG ECHO 2025' }).disabled).toBe(true);
	});

	it('is enabled once a PDF is set', () => {
		expect(getRegenerateState({ pdf: { asset: { _ref: 'file-abc-pdf' } } })).toStrictEqual({
			disabled: false,
			title: 'Erzeugt die Seiten zum Durchblättern erneut aus der PDF',
		});
	});
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter studio exec vp test run actions/regenerate-echo-pages.test.ts` Expected: FAIL, because the module does not exist.

- [ ] **Step 3: Implement the action**

`apps/studio/actions/regenerate-echo-pages.tsx`:

```tsx
import { RiRefreshLine } from 'react-icons/ri';
import type { DocumentActionDescription, DocumentActionProps } from 'sanity';
import { useDocumentOperation } from 'sanity';

/**
 * Whether the pages can be generated again, and the tooltip that explains why not.
 *
 * @param document - The draft, or the published document if there is no draft.
 * @returns The `disabled` flag and the tooltip of the action.
 */
function getRegenerateState(document: Record<string, unknown> | null | undefined): {
	disabled: boolean;
	title: string;
} {
	return document?.pdf
		? { disabled: false, title: 'Erzeugt die Seiten zum Durchblättern erneut aus der PDF' }
		: { disabled: true, title: 'Zuerst eine PDF hochladen' };
}

/**
 * Removes `render` from the document. The render webhook only fires while `render.source` differs
 * from the PDF, so this hands the document back to the render route: for a failed run, or one that
 * never finished because the platform cut it off.
 *
 * @param props - The document action props from the studio.
 * @returns The action description.
 */
function RegenerateEchoPagesAction(props: DocumentActionProps): DocumentActionDescription {
	const { patch } = useDocumentOperation(props.id, props.type);
	const { disabled, title } = getRegenerateState(props.draft ?? props.published);

	return {
		disabled: disabled || Boolean(patch.disabled),
		icon: RiRefreshLine,
		label: 'Seiten neu erzeugen',
		onHandle: () => {
			patch.execute([{ unset: ['render'] }]);
			props.onComplete();
		},
		title,
	};
}

export { RegenerateEchoPagesAction, getRegenerateState };
```

In `apps/studio/sanity.config.ts`, import `RegenerateEchoPagesAction` from `./actions/regenerate-echo-pages` and `echoIssue` from `./schemas/documents/echo.issue`, then extend `document.actions`:

```ts
		actions: (input, context) => {
			if (singletonTypes.has(context.schemaType)) {
				return input.filter(({ action }) => action && singletonActions.has(action));
			}
			if (context.schemaType === echoIssue.name) {
				return [...input, RegenerateEchoPagesAction];
			}
			return input;
		},
```

- [ ] **Step 4: Add the AI Assist preset**

In `apps/studio/plugins/assist.ts`, import `echoIssue` from `@/schemas/documents/echo.issue` and add this key to `__presets`, next to `[newsArticle.name]`:

```ts
			[echoIssue.name]: {
				fields: [
					{
						instructions: [
							{
								_key: 'preset-instruction-echo-intro',
								icon: 'sparkles',
								prompt: [
									{
										_key: 'echo-intro-block',
										_type: 'block',
										children: [
											{
												_key: 'echo-intro-1',
												_type: 'span',
												marks: [],
												text: 'Schreibe ein kurzes Intro (2 bis 3 Sätze) für die Ausgabe ',
											},
											{
												_key: 'echo-intro-2',
												_type: 'sanity.assist.instruction.fieldRef',
												path: 'title',
											},
											{
												_key: 'echo-intro-3',
												_type: 'span',
												marks: [],
												text: ' des TSG ECHO, der Vereinszeitschrift der TSG Irlich. Grundlage ist ausschließlich der folgende Text der Ausgabe: ',
											},
											{
												_key: 'echo-intro-4',
												_type: 'sanity.assist.instruction.fieldRef',
												path: 'extractedText',
											},
											{
												_key: 'echo-intro-5',
												_type: 'span',
												marks: [],
												text: ' Fasse die wichtigsten Themen zusammen, ignoriere Anzeigen und Werbung, nenne keine Personennamen und erfinde nichts dazu.',
											},
										],
										markDefs: [],
										style: 'normal',
									},
								],
								title: 'Intro erzeugen',
							},
						],
						/**
						 * Writes a short intro from the extracted text of the issue
						 */
						path: 'intro',
					},
				],
			},
```

The spike tested this prompt word for word on 44,000 and 132,000 characters.

- [ ] **Step 5: Run the studio checks**

Run: `pnpm --filter studio run test && pnpm --filter studio run typecheck && pnpm --filter studio run lint` Expected: PASS and no errors.

- [ ] **Step 6: Commit**

`feat(studio): add the regenerate action and intro preset for echo issues`.

---

### Task 5: Generated types, query, PDF URL and download

**Files:**

- Modify (generated): `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`
- Create: `apps/web/src/lib/sanity/queries/echo.ts`
- Create: `apps/web/src/lib/echo/asset-url.ts`
- Test: `apps/web/src/lib/echo/asset-url.test.ts`
- Create: `apps/web/src/lib/echo/download-pdf.ts`
- Test: `apps/web/src/lib/echo/download-pdf.test.ts`

**Interfaces:**

- Produces:
  - `echoRenderStateQuery`, whose generated result type is `EchoRenderStateQueryResult = { _id: string; _rev: string; pdfRef: string | null; renderSource: string | null } | null`
  - `FILE_ASSET_REF: RegExp`
  - `getPdfUrl(pdfRef: string, location: DatasetLocation): string | undefined`
  - `DatasetLocation { dataset: string; projectId: string }`
  - `downloadPdf(url: string): Promise<Uint8Array>`

- [ ] **Step 1: Add the query and regenerate the types**

`apps/web/src/lib/sanity/queries/echo.ts`:

```ts
import { defineQuery } from 'next-sanity';

/** What the render route needs to claim a document and to check it is still its own. */
export const echoRenderStateQuery = defineQuery(`
	*[_id == $id][0] {
		_id,
		_rev,
		"pdfRef": pdf.asset._ref,
		"renderSource": render.source
	}
`);
```

Run from the repository root: `pnpm run extract-types && pnpm run typegen:sanity && pnpm run format` Expected:

- `apps/studio/schema.json` contains `echo.issue` and `echoOverview`
- `sanity.types.generated.ts` exports `EchoIssue`, `EchoOverview` and `EchoRenderStateQueryResult`

- [ ] **Step 2: Write the failing tests for the URL helper**

`apps/web/src/lib/echo/asset-url.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import { getPdfUrl } from './asset-url';

const LOCATION = { dataset: 'development', projectId: 'j4rxwl5m' };
const HASH = '8c3211369d3d2da0c150d50d7cb5bca911b15f5e';

describe('pdf asset url', () => {
	it('builds the CDN url of a PDF asset reference', () => {
		expect(getPdfUrl(`file-${HASH}-pdf`, LOCATION)).toBe(
			`https://cdn.sanity.io/files/j4rxwl5m/development/${HASH}.pdf`,
		);
	});

	it.each([
		['an image asset', `image-${HASH}-2000x1414-jpg`],
		['a file of another type', `file-${HASH}-zip`],
		['a hash that is too short', 'file-8c32-pdf'],
		['upper-case hex', `file-${HASH.toUpperCase()}-pdf`],
		['a path', `file-${HASH}-pdf/../../secret`],
		['a full url', `https://evil.example/file-${HASH}-pdf`],
		['an empty string', ''],
	])('rejects %s', (_label, ref) => {
		expect(getPdfUrl(ref, LOCATION)).toBeUndefined();
	});

	it('takes project and dataset from the location, never from the reference', () => {
		expect(getPdfUrl(`file-${HASH}-pdf`, { dataset: 'production', projectId: 'abc123' })).toBe(
			`https://cdn.sanity.io/files/abc123/production/${HASH}.pdf`,
		);
	});
});
```

- [ ] **Step 3: Run it to see it fail, then implement**

Run: `pnpm --filter web exec vp test run src/lib/echo/asset-url.test.ts` Expected: FAIL, because the module does not exist.

`apps/web/src/lib/echo/asset-url.ts`:

```ts
/** A Sanity file asset reference of a PDF: `file-<40 hex sha1>-pdf`. */
const FILE_ASSET_REF = /^file-([0-9a-f]{40})-pdf$/u;

/**
 * Builds the CDN url of a PDF from its asset reference. Only the hash comes from the reference;
 * host, project and dataset are fixed, so a crafted reference cannot make the server fetch
 * anything else (the spike's SSRF finding).
 *
 * @param pdfRef - The `_ref` of the PDF asset.
 * @param location - The project and dataset the web app reads from.
 * @returns The url, or `undefined` for anything that is not a PDF asset reference.
 */
function getPdfUrl(pdfRef: string, { dataset, projectId }: DatasetLocation): string | undefined {
	const hash = FILE_ASSET_REF.exec(pdfRef)?.[1];
	return hash ? `https://cdn.sanity.io/files/${projectId}/${dataset}/${hash}.pdf` : undefined;
}

export { FILE_ASSET_REF, getPdfUrl };

export interface DatasetLocation {
	dataset: string;
	projectId: string;
}
```

Run the test again. Expected: PASS.

- [ ] **Step 4: Write the failing tests for the download**

`apps/web/src/lib/echo/download-pdf.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { createFetchMock } from '../../../test-utils/fetch-mock';
import { downloadPdf } from './download-pdf';

describe('pdf download', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
	});

	it('returns the body as bytes', async () => {
		mock = createFetchMock();
		mock.enqueue({ body: '%PDF-1.7', status: 200 });

		const bytes = await downloadPdf('https://cdn.sanity.io/files/p/d/x.pdf');

		expect(new TextDecoder().decode(bytes)).toBe('%PDF-1.7');
		expect(mock.calls[0]?.url).toBe('https://cdn.sanity.io/files/p/d/x.pdf');
	});

	it('names the http status when the CDN refuses', async () => {
		mock = createFetchMock();
		mock.enqueue({ body: 'Not Found', status: 404 });

		await expect(downloadPdf('https://cdn.sanity.io/files/p/d/x.pdf')).rejects.toThrow(
			'Die PDF konnte nicht geladen werden (HTTP 404).',
		);
	});
});
```

Check the import path of `createFetchMock` against an existing test, such as `src/actions/create-linear-issue.test.ts`, and use the same form.

- [ ] **Step 5: Run it to see it fail, then implement**

Run: `pnpm --filter web exec vp test run src/lib/echo/download-pdf.test.ts` Expected: FAIL, because the module does not exist.

`apps/web/src/lib/echo/download-pdf.ts`:

```ts
/**
 * Loads a PDF from the Sanity CDN.
 *
 * @param url - A url built by `getPdfUrl`, never one taken from a request.
 * @returns The PDF's bytes.
 * @throws {Error} With the HTTP status when the CDN does not answer with 2xx.
 */
export async function downloadPdf(url: string): Promise<Uint8Array> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Die PDF konnte nicht geladen werden (HTTP ${response.status}).`);
	}
	return new Uint8Array(await response.arrayBuffer());
}
```

Run both tests again. Expected: PASS.

- [ ] **Step 6: Commit**

`feat(web): add the echo render query, pdf url and download`, including the regenerated `schema.json` and `sanity.types.generated.ts`.

---

### Task 6: Write client, environment and render store

**Files:**

- Modify: `apps/web/src/lib/env.ts`
- Modify: `turbo.json` (`globalEnv`)
- Create: `apps/web/src/lib/sanity/write-client.ts`
- Create: `apps/web/src/lib/echo/render-store.ts`
- Test: `apps/web/src/lib/echo/render-store.test.ts`

**Interfaces:**

- Consumes: `echoRenderStateQuery` and `EchoRenderStateQueryResult` (Task 5).
- Produces:
  - `getWriteClient(): SanityClient`
  - `createRenderStore(client: SanityClient): EchoRenderStore`
  - `EchoRenderStore`:
    - `read(id): Promise<EchoRenderState | null>`
    - `claim(state, startedAt): Promise<WriteOutcome>`
    - `uploadPage(jpeg, filename): Promise<string>`, returning the asset id
    - `finish(state, result): Promise<WriteOutcome>`
    - `fail(state, failure): Promise<WriteOutcome>`
  - `EchoRenderState { id: string; pdfRef: string | null; renderSource: string | null; rev: string }`
  - `EchoPage { _key: string; _type: 'image'; asset: { _ref: string; _type: 'reference' } }`
  - `EchoRenderResult { extractedText: string; finishedAt: string; pageCount: number; pages: EchoPage[]; startedAt: string }`
  - `EchoRenderFailure { error: string; finishedAt: string; startedAt: string }`
  - `WriteOutcome = 'conflict' | 'written'`

- [ ] **Step 1: Register the environment variables**

In `apps/web/src/lib/env.ts`, add both to `schemas`, in alphabetical position:

```ts
	// A robot token with the Editor role. Only the TSG-Echo render route writes with it.
	SANITY_API_WRITE_TOKEN: z.string().min(1, 'Missing SANITY_API_WRITE_TOKEN'),
	SANITY_ECHO_RENDER_SECRET: z.string().min(1, 'Missing SANITY_ECHO_RENDER_SECRET'),
```

In the root `turbo.json`, add `"SANITY_API_WRITE_TOKEN"` and `"SANITY_ECHO_RENDER_SECRET"` to `globalEnv` in alphabetical position. Without that entry Turbo hides them from the build.

- [ ] **Step 2: Add the write client**

`apps/web/src/lib/sanity/write-client.ts`:

```ts
import 'server-only';
import { createClient } from 'next-sanity';
import type { SanityClient } from 'next-sanity';

import { env } from '@/lib/env';
import { apiVersion, dataset, projectId } from '@/lib/sanity/api';

/**
 * A client that writes with the robot token. It is created on demand rather than at import, so
 * a build without the token still succeeds (unlike `live.ts`, which reads its token at import).
 *
 * `perspective: 'raw'` lets it see drafts and release versions: the webhook fires for drafts, and
 * the published-only default would answer "missing" for every one of them.
 *
 * @returns The write client.
 */
export function getWriteClient(): SanityClient {
	return createClient({
		apiVersion,
		dataset,
		perspective: 'raw',
		projectId,
		token: env('SANITY_API_WRITE_TOKEN'),
		useCdn: false,
	});
}
```

The file stays without a test. Like `client.ts`, it only binds configuration (see the coverage note in `AGENTS.md`). Every test that reaches it mocks it.

- [ ] **Step 3: Write the failing tests for the store**

`apps/web/src/lib/echo/render-store.test.ts`:

```ts
import type { SanityClient } from 'next-sanity';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createRenderStore } from './render-store';
import type { EchoRenderState } from './render-store';

const STATE: EchoRenderState = {
	id: 'drafts.echo-2025',
	pdfRef: 'file-8c3211369d3d2da0c150d50d7cb5bca911b15f5e-pdf',
	renderSource: null,
	rev: 'rev-1',
};

/**
 * A client that records the patch chain: `patch(id).ifRevisionId(rev).set(values).commit()`.
 * `commit` resolves unless `commitError` is set.
 */
function createFakeClient(options: { commitError?: unknown; fetchResult?: unknown } = {}) {
	const patches: { id: string; rev?: string; set?: unknown }[] = [];
	const uploads: { body: Buffer; options: unknown; type: string }[] = [];
	const client = {
		assets: {
			upload: vi.fn(async (type: string, body: Buffer, uploadOptions: unknown) => {
				uploads.push({ body, options: uploadOptions, type });
				return { _id: 'image-abc-2000x1414-jpg' };
			}),
		},
		fetch: vi.fn(async () => options.fetchResult ?? null),
		patch: (id: string) => {
			const entry: { id: string; rev?: string; set?: unknown } = { id };
			patches.push(entry);
			const chain = {
				commit: async () => {
					if (options.commitError) {
						throw options.commitError;
					}
					return {};
				},
				ifRevisionId: (rev: string) => {
					entry.rev = rev;
					return chain;
				},
				set: (values: unknown) => {
					entry.set = values;
					return chain;
				},
			};
			return chain;
		},
	};
	return { client: client as unknown as SanityClient, fake: client, patches, uploads };
}

describe('echo render store', () => {
	it('reads the render state of a document', async () => {
		const { client, fake } = createFakeClient({
			fetchResult: { _id: STATE.id, _rev: 'rev-1', pdfRef: STATE.pdfRef, renderSource: null },
		});

		const state = await createRenderStore(client).read(STATE.id);

		expect(state).toStrictEqual(STATE);
		expect(fake.fetch).toHaveBeenCalledWith(expect.any(String), { id: STATE.id });
	});

	it('reads a missing document as null', async () => {
		const { client } = createFakeClient({ fetchResult: null });

		await expect(createRenderStore(client).read('gone')).resolves.toBeNull();
	});

	it('claims a document against its revision with a pending render', async () => {
		const { client, patches } = createFakeClient();

		const outcome = await createRenderStore(client).claim(STATE, '2026-10-10T10:00:00.000Z');

		expect(outcome).toBe('written');
		expect(patches).toStrictEqual([
			{
				id: STATE.id,
				rev: 'rev-1',
				set: {
					render: {
						source: STATE.pdfRef,
						startedAt: '2026-10-10T10:00:00.000Z',
						status: 'pending',
					},
				},
			},
		]);
	});

	it('reports a revision mismatch as a conflict', async () => {
		const { client } = createFakeClient({ commitError: { message: 'Conflict', statusCode: 409 } });

		await expect(createRenderStore(client).claim(STATE, 'now')).resolves.toBe('conflict');
	});

	it('rethrows any other write error', async () => {
		const { client } = createFakeClient({ commitError: new Error('network down') });

		await expect(createRenderStore(client).claim(STATE, 'now')).rejects.toThrow('network down');
	});

	it('uploads a page as a jpeg image asset and returns its id', async () => {
		const { client, uploads } = createFakeClient();

		const assetId = await createRenderStore(client).uploadPage(
			new Uint8Array([1, 2, 3]),
			'echo-8c321136-seite-001.jpg',
		);

		expect(assetId).toBe('image-abc-2000x1414-jpg');
		expect(uploads[0]).toMatchObject({
			options: { contentType: 'image/jpeg', filename: 'echo-8c321136-seite-001.jpg' },
			type: 'image',
		});
		expect([...(uploads[0]?.body ?? [])]).toStrictEqual([1, 2, 3]);
	});

	it('writes the finished pages, text and render state', async () => {
		const { client, patches } = createFakeClient();
		const page = {
			_key: 'seite-1',
			_type: 'image' as const,
			asset: { _ref: 'image-a', _type: 'reference' as const },
		};

		await createRenderStore(client).finish(STATE, {
			extractedText: 'Text',
			finishedAt: 'end',
			pageCount: 1,
			pages: [page],
			startedAt: 'start',
		});

		expect(patches[0]?.set).toStrictEqual({
			extractedText: 'Text',
			pages: [page],
			render: {
				finishedAt: 'end',
				pageCount: 1,
				source: STATE.pdfRef,
				startedAt: 'start',
				status: 'done',
			},
		});
	});

	it('writes a failed render with its message', async () => {
		const { client, patches } = createFakeClient();

		await createRenderStore(client).fail(STATE, {
			error: 'kaputt',
			finishedAt: 'end',
			startedAt: 'start',
		});

		expect(patches[0]?.set).toStrictEqual({
			render: {
				error: 'kaputt',
				finishedAt: 'end',
				source: STATE.pdfRef,
				startedAt: 'start',
				status: 'failed',
			},
		});
	});
});
```

- [ ] **Step 4: Run them to see them fail**

Run: `pnpm --filter web exec vp test run src/lib/echo/render-store.test.ts` Expected: FAIL, because the module does not exist.

- [ ] **Step 5: Implement the store**

`apps/web/src/lib/echo/render-store.ts`:

```ts
import type { SanityClient } from 'next-sanity';

import { settle } from '@tsgi-web/shared';

import { echoRenderStateQuery } from '@/lib/sanity/queries/echo';
import type { EchoRenderStateQueryResult } from '@/types/sanity.types.generated';

const HTTP_CONFLICT = 409;

/**
 * Whether a Sanity client error is a failed `ifRevisionId` check.
 *
 * @param error - The rejection reason of a commit.
 * @returns `true` for an HTTP 409.
 */
function isConflict(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'statusCode' in error &&
		error.statusCode === HTTP_CONFLICT
	);
}

/**
 * Commits a patch and turns a revision mismatch into an outcome instead of an error.
 *
 * @param commit - The pending commit.
 * @returns `written`, or `conflict` when the document changed in between.
 * @throws {unknown} Every error other than a conflict.
 */
async function commitGuarded(commit: Promise<unknown>): Promise<WriteOutcome> {
	const outcome = await settle(commit);
	if (outcome.ok) {
		return 'written';
	}
	if (isConflict(outcome.error)) {
		return 'conflict';
	}
	throw outcome.error;
}

/**
 * The Sanity side of the render pipeline. Every write is guarded by the revision it read, so a
 * document an editor changed in the meantime is never overwritten.
 *
 * @param client - A client with write access that sees drafts (`getWriteClient`).
 * @returns The store.
 */
export function createRenderStore(client: SanityClient): EchoRenderStore {
	return {
		claim: async (state, startedAt) =>
			commitGuarded(
				client
					.patch(state.id)
					.ifRevisionId(state.rev)
					.set({ render: { source: state.pdfRef, startedAt, status: 'pending' } })
					.commit(),
			),
		fail: async (state, failure) =>
			commitGuarded(
				client
					.patch(state.id)
					.ifRevisionId(state.rev)
					.set({ render: { ...failure, source: state.pdfRef, status: 'failed' } })
					.commit(),
			),
		finish: async (state, { extractedText, pages, ...render }) =>
			commitGuarded(
				client
					.patch(state.id)
					.ifRevisionId(state.rev)
					.set({
						extractedText,
						pages,
						render: { ...render, source: state.pdfRef, status: 'done' },
					})
					.commit(),
			),
		read: async (id) => {
			const result: EchoRenderStateQueryResult = await client.fetch(echoRenderStateQuery, { id });
			return result
				? {
						id: result._id,
						pdfRef: result.pdfRef,
						renderSource: result.renderSource,
						rev: result._rev,
					}
				: null;
		},
		uploadPage: async (jpeg, filename) => {
			const asset = await client.assets.upload('image', Buffer.from(jpeg), {
				contentType: 'image/jpeg',
				filename,
			});
			return asset._id;
		},
	};
}

export type WriteOutcome = 'conflict' | 'written';

export interface EchoRenderState {
	id: string;
	pdfRef: string | null;
	renderSource: string | null;
	rev: string;
}

export interface EchoPage {
	_key: string;
	_type: 'image';
	asset: { _ref: string; _type: 'reference' };
}

export interface EchoRenderResult {
	extractedText: string;
	finishedAt: string;
	pageCount: number;
	pages: EchoPage[];
	startedAt: string;
}

export interface EchoRenderFailure {
	error: string;
	finishedAt: string;
	startedAt: string;
}

export interface EchoRenderStore {
	claim: (state: EchoRenderState, startedAt: string) => Promise<WriteOutcome>;
	fail: (state: EchoRenderState, failure: EchoRenderFailure) => Promise<WriteOutcome>;
	finish: (state: EchoRenderState, result: EchoRenderResult) => Promise<WriteOutcome>;
	read: (id: string) => Promise<EchoRenderState | null>;
	uploadPage: (jpeg: Uint8Array, filename: string) => Promise<string>;
}
```

The object keys in `finish` and `fail` spread before they are sorted. If `sort-keys` complains about a spread position, write the keys out explicitly in sorted order rather than disabling the rule. The test pins the exact objects.

- [ ] **Step 6: Run the tests and checks**

Run: `pnpm --filter web exec vp test run src/lib/echo/render-store.test.ts && pnpm --filter web run typecheck` Expected: PASS and no type errors.

- [ ] **Step 7: Commit**

`feat(web): add the sanity write client and echo render store`, including `env.ts` and `turbo.json`.

---

### Task 7: Render orchestration

**Files:**

- Create: `apps/web/src/lib/echo/render-issue.ts`
- Test: `apps/web/src/lib/echo/render-issue.test.ts`

**Interfaces:**

- Consumes: `EchoRenderStore`, `EchoRenderState`, `EchoPage` (Task 6), `getPdfUrl`, `DatasetLocation` (Task 5), and `RenderedPage` from `@tsgi-web/pdf-pages` (Task 1).
- Produces:
  - `claimRender(store, payload: { id: string; pdfRef: string }, startedAt: string): Promise<ClaimOutcome>`
  - `runRender(job: RenderJob, deps: RenderDependencies): Promise<RenderOutcome>`
  - `ClaimOutcome = { job: RenderJob; status: 'claimed' } | { status: 'conflict' | 'duplicate' | 'missing' | 'stale' }`
  - `RenderJob { id: string; pdfRef: string; startedAt: string }`
  - `RenderDependencies { downloadPdf; location; now: () => number; renderPages: (bytes: Uint8Array) => AsyncIterable<RenderedPage>; store }`
  - `RenderOutcome = 'conflict' | 'discarded' | 'done' | 'failed'`

- [ ] **Step 1: Write the failing tests**

`apps/web/src/lib/echo/render-issue.test.ts`:

```ts
import { describe, expect, it, vi } from 'vite-plus/test';

import type { RenderedPage } from '@tsgi-web/pdf-pages';

import { claimRender, runRender } from './render-issue';
import type { RenderDependencies, RenderJob } from './render-issue';
import type {
	EchoRenderFailure,
	EchoRenderResult,
	EchoRenderState,
	EchoRenderStore,
	WriteOutcome,
} from './render-store';

const HASH = '8c3211369d3d2da0c150d50d7cb5bca911b15f5e';
const PDF_REF = `file-${HASH}-pdf`;
const LOCATION = { dataset: 'development', projectId: 'j4rxwl5m' };
const JOB: RenderJob = {
	id: 'drafts.echo-2025',
	pdfRef: PDF_REF,
	startedAt: '2026-10-10T10:00:00.000Z',
};

function state(overrides: Partial<EchoRenderState> = {}): EchoRenderState {
	return { id: JOB.id, pdfRef: PDF_REF, renderSource: PDF_REF, rev: 'rev-1', ...overrides };
}

function page(index: number, text = `Text ${index}`): RenderedPage {
	return { height: 2000, index, jpeg: new Uint8Array([index]), text, width: 1414 };
}

async function* pagesOf(...pages: RenderedPage[]): AsyncGenerator<RenderedPage> {
	for (const item of pages) {
		yield item;
	}
}

/**
 * An in-memory store: `reads` is consumed one entry per `read()` (the last entry repeats), and
 * `writes` is consumed one entry per write (default `written`).
 */
function createStore(reads: (EchoRenderState | null)[], writes: WriteOutcome[] = []) {
	let readIndex = 0;
	// The parameters are typed so that `mock.calls[n][i]` type-checks; `typecheck` covers tests.
	const store = {
		claim: vi.fn(
			async (_state: EchoRenderState, _startedAt: string) => writes.shift() ?? 'written',
		),
		fail: vi.fn(
			async (_state: EchoRenderState, _failure: EchoRenderFailure) => writes.shift() ?? 'written',
		),
		finish: vi.fn(
			async (_state: EchoRenderState, _result: EchoRenderResult) => writes.shift() ?? 'written',
		),
		read: vi.fn(async (_id: string) => reads[Math.min(readIndex++, reads.length - 1)] ?? null),
		uploadPage: vi.fn(async (_jpeg: Uint8Array, filename: string) => `image-${filename}`),
	} satisfies EchoRenderStore;
	return store;
}

function deps(
	store: EchoRenderStore,
	overrides: Partial<RenderDependencies> = {},
): RenderDependencies {
	return {
		downloadPdf: vi.fn(async () => new Uint8Array([0x25])),
		location: LOCATION,
		now: () => 0,
		renderPages: () => pagesOf(page(1), page(2)),
		store,
		...overrides,
	};
}

describe('claiming a render', () => {
	it('reports a document that no longer exists', async () => {
		const store = createStore([null]);

		await expect(
			claimRender(store, { id: JOB.id, pdfRef: PDF_REF }, JOB.startedAt),
		).resolves.toStrictEqual({ status: 'missing' });
		expect(store.claim).not.toHaveBeenCalled();
	});

	it('ignores a delivery whose PDF has been replaced since', async () => {
		const store = createStore([
			state({ pdfRef: 'file-0000000000000000000000000000000000000000-pdf', renderSource: null }),
		]);

		await expect(
			claimRender(store, { id: JOB.id, pdfRef: PDF_REF }, JOB.startedAt),
		).resolves.toStrictEqual({ status: 'stale' });
	});

	it('ignores a second delivery for a PDF that is already claimed', async () => {
		const store = createStore([state()]);

		await expect(
			claimRender(store, { id: JOB.id, pdfRef: PDF_REF }, JOB.startedAt),
		).resolves.toStrictEqual({ status: 'duplicate' });
		expect(store.claim).not.toHaveBeenCalled();
	});

	it('claims a document whose render is missing and returns the job', async () => {
		const unclaimed = state({ renderSource: null });
		const store = createStore([unclaimed]);

		await expect(
			claimRender(store, { id: JOB.id, pdfRef: PDF_REF }, JOB.startedAt),
		).resolves.toStrictEqual({ job: JOB, status: 'claimed' });
		expect(store.claim).toHaveBeenCalledWith(unclaimed, JOB.startedAt);
	});

	// Two deliveries raced; the other one won the revision check and renders.
	it('reports a lost race as a conflict', async () => {
		const store = createStore([state({ renderSource: null })], ['conflict']);

		await expect(
			claimRender(store, { id: JOB.id, pdfRef: PDF_REF }, JOB.startedAt),
		).resolves.toStrictEqual({ status: 'conflict' });
	});
});

describe('running a render', () => {
	it('downloads the PDF from the CDN url of its reference', async () => {
		const store = createStore([state()]);
		const dependencies = deps(store);

		await runRender(JOB, dependencies);

		expect(dependencies.downloadPdf).toHaveBeenCalledWith(
			`https://cdn.sanity.io/files/j4rxwl5m/development/${HASH}.pdf`,
		);
	});

	it('uploads every page and writes pages, text and page count', async () => {
		const store = createStore([state()]);

		const outcome = await runRender(
			JOB,
			deps(store, { now: () => Date.parse('2026-10-10T10:01:00.000Z') }),
		);

		expect(outcome).toBe('done');
		expect(store.uploadPage.mock.calls.map(([, filename]) => filename)).toStrictEqual([
			'echo-8c321136-seite-001.jpg',
			'echo-8c321136-seite-002.jpg',
		]);
		expect(store.finish).toHaveBeenCalledWith(state(), {
			extractedText: '--- Seite 1 ---\nText 1\n\n--- Seite 2 ---\nText 2',
			finishedAt: '2026-10-10T10:01:00.000Z',
			pageCount: 2,
			pages: [
				{
					_key: 'seite-1',
					_type: 'image',
					asset: { _ref: 'image-echo-8c321136-seite-001.jpg', _type: 'reference' },
				},
				{
					_key: 'seite-2',
					_type: 'image',
					asset: { _ref: 'image-echo-8c321136-seite-002.jpg', _type: 'reference' },
				},
			],
			startedAt: JOB.startedAt,
		});
	});

	it('fails with the message of a PDF that cannot be read', async () => {
		const store = createStore([state()]);
		const renderPages = () => {
			throw new Error('Invalid PDF structure.');
		};

		const outcome = await runRender(JOB, deps(store, { renderPages }));

		expect(outcome).toBe('failed');
		expect(store.fail).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({ error: 'Invalid PDF structure.' }),
		);
		expect(store.finish).not.toHaveBeenCalled();
	});

	it('fails when the download fails', async () => {
		const store = createStore([state()]);
		const downloadPdf = vi.fn(async () => {
			throw new Error('Die PDF konnte nicht geladen werden (HTTP 404).');
		});

		await runRender(JOB, deps(store, { downloadPdf }));

		expect(store.fail).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({ error: 'Die PDF konnte nicht geladen werden (HTTP 404).' }),
		);
	});

	// Review focus 2: no partial page list may reach the document.
	it('fails without writing any pages when an upload breaks halfway', async () => {
		const store = createStore([state()]);
		store.uploadPage
			.mockResolvedValueOnce('image-1')
			.mockRejectedValueOnce(new Error('upload failed'));

		const outcome = await runRender(JOB, deps(store));

		expect(outcome).toBe('failed');
		expect(store.finish).not.toHaveBeenCalled();
		expect(store.fail).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({ error: 'upload failed' }),
		);
	});

	it('fails for a PDF without pages', async () => {
		const store = createStore([state()]);

		await runRender(JOB, deps(store, { renderPages: () => pagesOf() }));

		expect(store.fail).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({ error: 'Die PDF enthält keine Seiten.' }),
		);
	});

	it('stops at the time budget', async () => {
		const store = createStore([state()]);
		let clock = 0;
		const now = () => {
			clock += 400_000;
			return clock;
		};

		await runRender(JOB, deps(store, { now }));

		expect(store.fail).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({
				error: 'Zeitlimit überschritten: Die PDF konnte nicht vollständig verarbeitet werden.',
			}),
		);
	});

	it('fails for a reference that is not a PDF asset', async () => {
		const store = createStore([state({ pdfRef: 'image-abc-jpg' })]);

		await runRender({ ...JOB, pdfRef: 'image-abc-jpg' }, deps(store));

		expect(store.fail).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ error: 'Ungültige PDF-Referenz image-abc-jpg' }),
		);
	});

	it('cuts a long error message to 500 characters', async () => {
		const store = createStore([state()]);
		const renderPages = () => {
			throw new Error('x'.repeat(2000));
		};

		await runRender(JOB, deps(store, { renderPages }));

		expect(store.fail.mock.calls[0]?.[1].error).toHaveLength(500);
	});

	// Review focus 3: a newer PDF owns the document now.
	it('discards the result when the PDF was replaced during the run', async () => {
		const store = createStore([
			state({ pdfRef: 'file-0000000000000000000000000000000000000000-pdf' }),
		]);

		await expect(runRender(JOB, deps(store))).resolves.toBe('discarded');
		expect(store.finish).not.toHaveBeenCalled();
	});

	it('discards the result when the document was deleted during the run', async () => {
		const store = createStore([null]);

		await expect(runRender(JOB, deps(store))).resolves.toBe('discarded');
	});

	it('reads again and retries when an editor changed the document meanwhile', async () => {
		const store = createStore(
			[state({ rev: 'rev-1' }), state({ rev: 'rev-2' })],
			['conflict', 'written'],
		);

		await expect(runRender(JOB, deps(store))).resolves.toBe('done');
		expect(store.finish.mock.calls.map(([written]) => written.rev)).toStrictEqual([
			'rev-1',
			'rev-2',
		]);
	});

	it('gives up after three conflicts', async () => {
		const store = createStore([state()], ['conflict', 'conflict', 'conflict']);

		await expect(runRender(JOB, deps(store))).resolves.toBe('conflict');
		expect(store.finish).toHaveBeenCalledTimes(3);
	});
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm --filter web exec vp test run src/lib/echo/render-issue.test.ts` Expected: FAIL, because the module does not exist.

- [ ] **Step 3: Implement**

`apps/web/src/lib/echo/render-issue.ts`:

```ts
import type { RenderedPage } from '@tsgi-web/pdf-pages';
import { settle } from '@tsgi-web/shared';

import { FILE_ASSET_REF, getPdfUrl } from './asset-url';
import type { DatasetLocation } from './asset-url';
import type { EchoPage, EchoRenderState, EchoRenderStore, WriteOutcome } from './render-store';

/** Ends a run before Vercel's `maxDuration` (800 s) cuts it off without a trace. */
const TIME_BUDGET_MS = 750_000;
const MAX_WRITE_ATTEMPTS = 3;
const MAX_ERROR_LENGTH = 500;
const PAGE_NUMBER_DIGITS = 3;
const SHORT_HASH_LENGTH = 8;

/**
 * Claims a document for rendering. A document is only claimed while `render.source` differs from
 * its PDF, and the claim sets it to the PDF, so a second delivery and the write-back of the result
 * both leave it alone.
 *
 * @param store - The Sanity side.
 * @param payload - The document id and PDF reference from the webhook.
 * @param startedAt - The ISO timestamp of the claim.
 * @returns The job to run, or why there is none.
 */
export async function claimRender(
	store: EchoRenderStore,
	payload: { id: string; pdfRef: string },
	startedAt: string,
): Promise<ClaimOutcome> {
	const state = await store.read(payload.id);
	if (!state) {
		return { status: 'missing' };
	}
	if (state.pdfRef !== payload.pdfRef) {
		return { status: 'stale' };
	}
	if (state.renderSource === state.pdfRef) {
		return { status: 'duplicate' };
	}
	const claimed = await store.claim(state, startedAt);
	return claimed === 'written'
		? { job: { id: state.id, pdfRef: payload.pdfRef, startedAt }, status: 'claimed' }
		: { status: 'conflict' };
}

/**
 * Renders a claimed document and writes the result back, or the failure if anything went wrong.
 * Nothing is written for a document that was deleted or got a new PDF while the run was busy.
 *
 * @param job - The job `claimRender` returned.
 * @param deps - Everything the run talks to.
 * @returns How the run ended.
 */
export async function runRender(job: RenderJob, deps: RenderDependencies): Promise<RenderOutcome> {
	const deadline = deps.now() + TIME_BUDGET_MS;
	const rendered = await settle(renderAll(job, deps, deadline));
	const finishedAt = new Date(deps.now()).toISOString();

	if (rendered.ok) {
		return writeResult(job, deps.store, 'done', (state) =>
			deps.store.finish(state, { ...rendered.value, finishedAt, startedAt: job.startedAt }),
		);
	}
	const error = describeError(rendered.error);
	return writeResult(job, deps.store, 'failed', (state) =>
		deps.store.fail(state, { error, finishedAt, startedAt: job.startedAt }),
	);
}

/**
 * Downloads the PDF, uploads every page and collects the text.
 *
 * @param job - The job.
 * @param deps - The dependencies.
 * @param deadline - The `now()` value after which the run gives up.
 * @returns The pages, their text and the page count.
 * @throws {Error} For an invalid reference, an empty PDF, the time budget or any failing step.
 */
async function renderAll(
	job: RenderJob,
	deps: RenderDependencies,
	deadline: number,
): Promise<{ extractedText: string; pageCount: number; pages: EchoPage[] }> {
	const url = getPdfUrl(job.pdfRef, deps.location);
	if (!url) {
		throw new Error(`Ungültige PDF-Referenz ${job.pdfRef}`);
	}
	const bytes = await deps.downloadPdf(url);
	const prefix = `echo-${FILE_ASSET_REF.exec(job.pdfRef)?.[1]?.slice(0, SHORT_HASH_LENGTH) ?? 'pdf'}`;
	const pages: EchoPage[] = [];
	const texts: string[] = [];

	for await (const page of deps.renderPages(bytes)) {
		if (deps.now() > deadline) {
			throw new Error(
				'Zeitlimit überschritten: Die PDF konnte nicht vollständig verarbeitet werden.',
			);
		}
		const number = String(page.index).padStart(PAGE_NUMBER_DIGITS, '0');
		const assetId = await deps.store.uploadPage(page.jpeg, `${prefix}-seite-${number}.jpg`);
		pages.push({
			_key: `seite-${page.index}`,
			_type: 'image',
			asset: { _ref: assetId, _type: 'reference' },
		});
		texts.push(`--- Seite ${page.index} ---\n${page.text}`);
	}

	if (pages.length === 0) {
		throw new Error('Die PDF enthält keine Seiten.');
	}
	return { extractedText: texts.join('\n\n'), pageCount: pages.length, pages };
}

/**
 * Writes a result against a freshly read revision, retrying when an editor saved in between.
 *
 * @param job - The job.
 * @param store - The Sanity side.
 * @param status - The outcome to report once the write went through.
 * @param write - Performs the write for a given state.
 * @returns `status`, `discarded` or `conflict`.
 */
async function writeResult(
	job: RenderJob,
	store: EchoRenderStore,
	status: 'done' | 'failed',
	write: (state: EchoRenderState) => Promise<WriteOutcome>,
): Promise<RenderOutcome> {
	for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
		const state = await store.read(job.id);
		// Deleted, or a new PDF arrived: a newer run owns the document now.
		if (!state || state.pdfRef !== job.pdfRef) {
			return 'discarded';
		}
		if ((await write(state)) === 'written') {
			return status;
		}
	}
	return 'conflict';
}

/**
 * Turns a rejection reason into the message editors see in `render.error`.
 *
 * @param error - Whatever was thrown.
 * @returns The message, at most 500 characters long.
 */
function describeError(error: unknown): string {
	const message = error instanceof Error ? error.message : String(error);
	return message.slice(0, MAX_ERROR_LENGTH);
}

export type ClaimOutcome =
	| { job: RenderJob; status: 'claimed' }
	| { status: 'conflict' | 'duplicate' | 'missing' | 'stale' };

export type RenderOutcome = 'conflict' | 'discarded' | 'done' | 'failed';

export interface RenderJob {
	id: string;
	pdfRef: string;
	startedAt: string;
}

export interface RenderDependencies {
	downloadPdf: (url: string) => Promise<Uint8Array>;
	location: DatasetLocation;
	now: () => number;
	renderPages: (bytes: Uint8Array) => AsyncIterable<RenderedPage>;
	store: EchoRenderStore;
}
```

The time budget test advances the clock by 400,000 ms per `now()` call:

- The first call returns 400,000, so the deadline is 1,150,000.
- The check before page 1 reads 800,000, so page 1 is uploaded.
- The check before page 2 reads 1,200,000, which trips the budget, so the run fails with the time limit message.

If the order of `now()` calls changes during implementation, adjust the step size so that one of the per-page checks still trips.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter web exec vp test run src/lib/echo/render-issue.test.ts` Expected: PASS, 18 tests.

- [ ] **Step 5: Lint, typecheck, commit**

Run: `pnpm --filter web run lint && pnpm --filter web run typecheck` Then commit `feat(web): add the echo render orchestration`.

---

### Task 8: Render route and Next.js config

**Files:**

- Create: `apps/web/src/app/api/echo/render/route.ts`
- Test: `apps/web/src/app/api/echo/render/route.test.ts`
- Modify: `apps/web/next.config.ts`
- Modify: `apps/web/package.json` (add `@tsgi-web/pdf-pages`)

**Interfaces:**

- Consumes:
  - `claimRender`, `runRender` (Task 7)
  - `createRenderStore` (Task 6)
  - `getWriteClient` (Task 6)
  - `downloadPdf`, `FILE_ASSET_REF` (Task 5)
  - `renderPdfPages` (Task 1)
  - `env` (`SANITY_ECHO_RENDER_SECRET`)
- Produces: `POST /api/echo/render`. It answers:
  - `401` for a bad signature
  - `400` for a payload that is not `{ _id, pdfRef }` with a PDF reference
  - `202` for a claimed document
  - `409` for a lost race
  - `200` for `duplicate`, `stale` and `missing`

- [ ] **Step 1: Add the dependency and the config**

Run: `pnpm --filter web add @tsgi-web/pdf-pages@workspace:*`

In `apps/web/next.config.ts`, add:

```ts
	// @napi-rs/canvas ships a native binary that Turbopack cannot bundle ("non-ecmascript
	// placeable asset"); pdfjs-dist stays external with it so its worker resolves next to it.
	serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist'],
```

Add it after `images`. `sort-keys` applies here too, and `serverExternalPackages` sorts after `images`.

- [ ] **Step 2: Write the failing tests**

`apps/web/src/app/api/echo/render/route.test.ts`:

```ts
import { parseBody } from 'next-sanity/webhook';
import { after } from 'next/server';
import type { NextRequest } from 'next/server';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { renderPdfPages } from '@tsgi-web/pdf-pages';

import { POST } from '@/app/api/echo/render/route';
import { claimRender, runRender } from '@/lib/echo/render-issue';

// The signature check belongs to next-sanity; mocking it makes "is the signature valid" an input.
vi.mock(import('next-sanity/webhook'), () => ({ parseBody: vi.fn() }));
// `after` only exists inside a Next.js request; the test collects the callback and runs it.
vi.mock(import('next/server'), async (importOriginal) => ({
	...(await importOriginal()),
	after: vi.fn(),
}));
// The orchestration has its own tests; here it only matters what the route hands it.
vi.mock(import('@/lib/echo/render-issue'), () => ({ claimRender: vi.fn(), runRender: vi.fn() }));
vi.mock(import('@/lib/sanity/write-client'), () => ({ getWriteClient: vi.fn(() => ({})) }));
// `api.ts` reads the project and the dataset at import time, before any `beforeAll` could stub them.
vi.mock(import('@/lib/sanity/api'), () => ({
	apiVersion: '2025-12-15',
	dataset: 'development',
	projectId: 'j4rxwl5m',
	studioUrl: undefined,
}));
// Keeps the native canvas binding out of this test.
vi.mock(import('@tsgi-web/pdf-pages'), () => ({ renderPdfPages: vi.fn() }));

const mockedParseBody = vi.mocked(parseBody);
const mockedAfter = vi.mocked(after);
const mockedClaim = vi.mocked(claimRender);
const mockedRun = vi.mocked(runRender);

const REQUEST = {} as NextRequest;
const PDF_REF = 'file-8c3211369d3d2da0c150d50d7cb5bca911b15f5e-pdf';
const JOB = { id: 'drafts.echo-2025', pdfRef: PDF_REF, startedAt: '2026-10-10T10:00:00.000Z' };

function signed(body: unknown, isValidSignature = true) {
	return { body, isValidSignature } as Awaited<ReturnType<typeof parseBody>>;
}

describe('echo render webhook', () => {
	beforeAll(() => {
		// `env()` reads lazily, at the first request, so stubbing here is early enough.
		vi.stubEnv('SANITY_ECHO_RENDER_SECRET', 'test-secret');
	});

	afterEach(() => {
		mockedParseBody.mockReset();
		mockedAfter.mockReset();
		mockedClaim.mockReset();
		mockedRun.mockReset();
	});

	it('rejects a payload whose signature does not match', async () => {
		mockedParseBody.mockResolvedValue(signed({ _id: JOB.id, pdfRef: PDF_REF }, false));

		const response = await POST(REQUEST);

		expect(response.status).toBe(401);
		expect(mockedClaim).not.toHaveBeenCalled();
	});

	it('verifies the signature with the render secret', async () => {
		mockedParseBody.mockResolvedValue(signed({ _id: JOB.id, pdfRef: PDF_REF }, false));

		await POST(REQUEST);

		expect(mockedParseBody).toHaveBeenCalledWith(REQUEST, 'test-secret');
	});

	it.each([
		['no body', null],
		['a missing id', { pdfRef: PDF_REF }],
		['an image reference', { _id: JOB.id, pdfRef: 'image-abc-2000x1414-jpg' }],
		['a url instead of a reference', { _id: JOB.id, pdfRef: 'https://evil.example/x.pdf' }],
	])('rejects %s with 400 before touching Sanity', async (_label, body) => {
		mockedParseBody.mockResolvedValue(signed(body));

		const response = await POST(REQUEST);

		expect(response.status).toBe(400);
		expect(mockedClaim).not.toHaveBeenCalled();
	});

	it('answers 202 and renders after the response for a claimed document', async () => {
		mockedParseBody.mockResolvedValue(signed({ _id: JOB.id, pdfRef: PDF_REF }));
		mockedClaim.mockResolvedValue({ job: JOB, status: 'claimed' });
		mockedRun.mockResolvedValue('done');

		const response = await POST(REQUEST);

		expect(response.status).toBe(202);
		expect(mockedClaim).toHaveBeenCalledWith(
			expect.anything(),
			{ id: JOB.id, pdfRef: PDF_REF },
			expect.any(String),
		);
		expect(mockedRun).not.toHaveBeenCalled();

		const [task] = mockedAfter.mock.calls[0] ?? [];
		await (task as () => Promise<void>)();

		expect(mockedRun).toHaveBeenCalledWith(
			JOB,
			expect.objectContaining({
				location: { dataset: 'development', projectId: 'j4rxwl5m' },
				renderPages: renderPdfPages,
			}),
		);
	});

	it('answers 409 to a delivery that lost the race, so Sanity retries it', async () => {
		mockedParseBody.mockResolvedValue(signed({ _id: JOB.id, pdfRef: PDF_REF }));
		mockedClaim.mockResolvedValue({ status: 'conflict' });

		const response = await POST(REQUEST);

		expect(response.status).toBe(409);
		expect(mockedAfter).not.toHaveBeenCalled();
	});

	it.each(['duplicate', 'stale', 'missing'] as const)(
		'answers 200 without a run for %s',
		async (status) => {
			mockedParseBody.mockResolvedValue(signed({ _id: JOB.id, pdfRef: PDF_REF }));
			mockedClaim.mockResolvedValue({ status });

			const response = await POST(REQUEST);

			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toStrictEqual({ status });
			expect(mockedAfter).not.toHaveBeenCalled();
		},
	);
});
```

`@/lib/sanity/api` is mocked because it asserts its variables at import time. If the module exports more names than the mock provides and something else imports them, extend the mock rather than stubbing `process.env`.

- [ ] **Step 3: Run them to see them fail**

Run: `pnpm --filter web exec vp test run src/app/api/echo/render/route.test.ts` Expected: FAIL, because the route does not exist.

- [ ] **Step 4: Implement the route**

`apps/web/src/app/api/echo/render/route.ts`:

```ts
import { parseBody } from 'next-sanity/webhook';
import { after } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { renderPdfPages } from '@tsgi-web/pdf-pages';

import { FILE_ASSET_REF } from '@/lib/echo/asset-url';
import { downloadPdf } from '@/lib/echo/download-pdf';
import { claimRender, runRender } from '@/lib/echo/render-issue';
import type { ClaimOutcome } from '@/lib/echo/render-issue';
import { createRenderStore } from '@/lib/echo/render-store';
import { env } from '@/lib/env';
import { dataset, projectId } from '@/lib/sanity/api';
import { getWriteClient } from '@/lib/sanity/write-client';

// Rendering runs after the response. Vercel Pro allows 800 s; the spike rendered 52 pages in 23 s.
export const maxDuration = 800;

const payloadSchema = z.object({
	_id: z.string().min(1),
	pdfRef: z.string().regex(FILE_ASSET_REF),
});

// 409 makes Sanity retry the delivery, which then sees `duplicate`. Every other non-claim has
// nothing left to do, so it must not be retried.
const STATUS_CODES: Record<ClaimOutcome['status'], number> = {
	claimed: 202,
	conflict: 409,
	duplicate: 200,
	missing: 200,
	stale: 200,
};

/**
 * Receives the TSG-Echo webhook, claims the document and renders its PDF after the response.
 *
 * @param request - The signed webhook request.
 * @returns The claim outcome.
 */
export async function POST(request: NextRequest): Promise<Response> {
	const { body, isValidSignature } = await parseBody<unknown>(
		request,
		env('SANITY_ECHO_RENDER_SECRET'),
	);
	if (!isValidSignature) {
		return Response.json({ message: 'Invalid signature' }, { status: 401 });
	}

	const payload = payloadSchema.safeParse(body);
	if (!payload.success) {
		return Response.json({ message: 'Bad Request' }, { status: 400 });
	}

	const store = createRenderStore(getWriteClient());
	const claim = await claimRender(
		store,
		{ id: payload.data._id, pdfRef: payload.data.pdfRef },
		new Date().toISOString(),
	);

	if (claim.status === 'claimed') {
		const { job } = claim;
		after(async () => {
			const outcome = await runRender(job, {
				downloadPdf,
				location: { dataset, projectId },
				now: Date.now,
				renderPages: renderPdfPages,
				store,
			});
			console.info(`[echo/render] ${job.id}: ${outcome}`);
		});
	}

	return Response.json({ status: claim.status }, { status: STATUS_CODES[claim.status] });
}
```

If the `parseBody` call above does not type-check with `unknown`, use `parseBody<Record<string, unknown>>`. Zod does the actual validation either way.

The run logs its outcome with `console.info`, because the end-to-end check in Task 10 looks for that line in the Vercel log. If lint's `no-console` only allows `warn`/`error`, log through `console.warn`, which Vercel shows just the same.

- [ ] **Step 5: Run the tests, the whole web suite and the build**

Run: `pnpm --filter web exec vp test run src/app/api/echo/render/route.test.ts` Expected: PASS.

Run: `pnpm --filter web run test:coverage` Expected: PASS, and every threshold holds.

Run: `pnpm --filter web run build` Expected:

- the build lists `ƒ /api/echo/render`
- `apps/web/.next/server/app/api/echo/render/route.js.nft.json` contains `pdf.worker.mjs`

Check it with:

```bash
grep -c "pdf.worker.mjs" apps/web/.next/server/app/api/echo/render/route.js.nft.json
```

Expected: `1`.

- [ ] **Step 6: Commit**

`feat(web): add the echo render webhook route`, including `next.config.ts`, `apps/web/package.json` and `pnpm-lock.yaml`.

---

### Task 9: Documentation and tickets

**Files:**

- Modify: `docs/SANITY_WEBHOOK_SETUP.md` (new section)
- Modify: `apps/studio/AGENTS.md` (TSG-Echo section)
- Modify: `apps/web/AGENTS.md` (render route section)
- Modify: `AGENTS.md` (env list, content types, workspace list)

- [ ] **Step 1: Document the webhook**

Append to `docs/SANITY_WEBHOOK_SETUP.md`. It is English like the rest of the file:

````markdown
## TSG-Echo page rendering

A second webhook, separate from the revalidation one, makes the web app render the pages of a TSG-Echo issue as soon as an editor uploads its PDF.

1. Create a robot token in sanity.io/manage → **API** → **Tokens** with the **Editor** role and store it in Vercel as `SANITY_API_WRITE_TOKEN` (Production and Preview).
2. Generate a secret (see step 1 above) and store it in Vercel as `SANITY_ECHO_RENDER_SECRET`.
3. Create the webhook, once per environment:
   - **Name**: `TSG-Echo Seiten erzeugen (<environment>)`
   - **URL**: `https://www.tsg-irlich.de/api/echo/render` (production) or the staging domain
   - **Dataset**: `production` (or the dataset of the environment)
   - **Trigger on**: ✅ Create, ✅ Update
   - **Drafts**: ✅ enabled — editors upload the PDF into a draft and generate the intro before they publish
   - **Filter**:

     ```groq
     _type == "echo.issue" && defined(pdf.asset) && (!defined(render.source) || render.source != pdf.asset._ref)
     ```

   - **Projection**:

     ```groq
     { _id, "pdfRef": pdf.asset._ref }
     ```

   - **HTTP method**: `POST`
   - **Secret**: the value of `SANITY_ECHO_RENDER_SECRET`
   - **Staging only**: add the header `x-vercel-protection-bypass` with the project's "Protection Bypass for Automation" secret, because preview deployments sit behind Vercel's SSO.

The filter compares states, not changes: the route sets `render.source` to the PDF when it claims a document, so neither its own write-back nor publishing the draft (which carries `render.source` along) triggers a second run. "Seiten neu erzeugen" in the studio removes `render` and hands the document back to the route.

The projection deliberately carries no URL. The route builds the CDN URL from the asset reference itself, so a crafted payload cannot make it fetch another host.
````

- [ ] **Step 2: Document the pipeline for agents**

In `apps/studio/AGENTS.md`, add a section `## TSG-Echo issues` after "Adding a document type":

```markdown
## TSG-Echo issues

`echo.issue` holds one issue of the club magazine. Editors fill in title, slug, release date, PDF, intro and meta; everything in the group "Seiten (automatisch)" (`pages`, `extractedText`, `render`) is read-only and written by the web app's render route (`apps/web/src/app/api/echo/render`), which a webhook calls (see `docs/SANITY_WEBHOOK_SETUP.md`). `render.status` is `pending`, `done` or `failed`; `render.error` carries the German reason of a failure. The document action "Seiten neu erzeugen" (`actions/regenerate-echo-pages.tsx`) removes `render`, which makes the webhook fire again. The AI Assist preset "Intro erzeugen" in `plugins/assist.ts` reads `extractedText` through a `fieldRef`; scanned issues have no text layer, so it has nothing to work with there.

`echoOverview` is the singleton behind `/verein/tsg-echo`. It is not an internal link target yet — WEB-352 adds it together with the page.
```

In `apps/web/AGENTS.md`, add a section `## TSG-Echo render route` after "Draft mode":

```markdown
## TSG-Echo render route

`POST /api/echo/render` renders the PDF of an `echo.issue` into page images and text. The webhook and its filter are described in `docs/SANITY_WEBHOOK_SETUP.md`.

- `route.ts` checks the signature (`SANITY_ECHO_RENDER_SECRET`), claims the document and answers `202`; the rendering itself runs in `after()` with `maxDuration = 800`. The 52 pages of the largest scan take about 23 s on Vercel.
- `src/lib/echo/render-issue.ts` (`claimRender`, `runRender`) holds the logic and only talks to the `EchoRenderStore` interface; `render-store.ts` is the Sanity adapter. Every write is guarded by `ifRevisionId`, and a result is thrown away when the document was deleted or got a new PDF.
- The PDF URL is built from the asset reference (`src/lib/echo/asset-url.ts`), never taken from the payload — a URL from a request would be an SSRF.
- `@tsgi-web/pdf-pages` needs `serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist']` in `next.config.ts`; Turbopack cannot bundle the native canvas binding. The package imports the pdf.js worker statically, otherwise output tracing would leave it out of the function.
- `src/lib/sanity/write-client.ts` writes with `SANITY_API_WRITE_TOKEN` and `perspective: 'raw'`, because the webhook fires for drafts.
```

In the root `AGENTS.md`:

- "Project Overview": add `- **packages/pdf-pages**: Renders PDF pages to images for the TSG-Echo flipbook` after `packages/email`.
- "Content types": change the line to `Groups (sports departments), News, People, Testimonials, TSG-Echo issues`.
- "Web (.env.local)": add `SANITY_API_WRITE_TOKEN` and `SANITY_ECHO_RENDER_SECRET` in alphabetical position.
- "Vitest": `one vitest.config.ts per workspace (...)` now also names `packages/pdf-pages`.
- "Coverage thresholds": `packages/shared`, `packages/email` and `packages/pdf-pages` are at 100% everywhere.

- [ ] **Step 3: Update the tickets**

Use the Linear tools:

- **WEB-351**: In the description, change the webhook projection to `{ _id, "pdfRef": pdf.asset._ref }` with a note "(ohne `pdfUrl`, siehe Spike: SSRF)". Remove the sentence about `INTERNAL_LINK_TARGETS` with the note "→ WEB-352".
- **WEB-352**: Under "Anbindung", add "`echoOverview` in `INTERNAL_LINK_TARGETS` aufnehmen (aus WEB-351 verschoben, damit kein Link auf eine noch fehlende Seite entsteht)."

- [ ] **Step 4: Commit**

`docs: document the tsg-echo render pipeline`.

---

### Task 10: Final checks and end-to-end run (needs the user)

- [ ] **Step 1: Full local gate**

Run from the repository root:

```bash
pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test:coverage && pnpm run build
```

Expected:

- everything green
- coverage thresholds held in all five workspaces
- `@tsgi-web/pdf-pages` at 100%

Then run `pnpm run test:e2e`. Expected: green. No route that the mocked suite visits changed, and the mocks fail the run on any unhandled outbound request. If the suite fails at build time because the new env variables are missing, add dummies for `SANITY_API_WRITE_TOKEN` and `SANITY_ECHO_RENDER_SECRET` to `apps/web/.env.e2e`, like the other secrets there.

- [ ] **Step 2: Push and open the pull request**

Use the `create-pr` skill for branch `feat/web-351-echo-render-pipeline`, base `next`, with `Closes WEB-351` in the body. Then bind the PR and turn Auto-fix on.

- [ ] **Step 3: Configure the preview (the user does this)**

Ask the user to do these steps; they change Sanity and Vercel settings:

1. Create the Sanity robot token (Editor) and the secret. Store them as `SANITY_API_WRITE_TOKEN` and `SANITY_ECHO_RENDER_SECRET` in the Vercel project `tsg-irlich-web` for **Preview**.
2. Create a webhook on the dataset `development`, as described in `docs/SANITY_WEBHOOK_SETUP.md`. The URL is the branch alias of the PR preview (`https://tsg-irlich-web-git-<branch-slug>-mheobs-projects.vercel.app/api/echo/render`), with the header `x-vercel-protection-bypass`.
3. Redeploy the preview so the new variables apply.

- [ ] **Step 4: End-to-end run on `development` (needs an explicit "yes")**

With the user's "yes" for writes to `development`:

1. Upload a **synthetic** test PDF into a draft `echo.issue` in `development`. Never use a real issue, since WEB-353 has not settled data protection yet.
2. Expected within one to two minutes:
   - the draft shows `render.status = done`
   - `pages` holds one image per page
   - `extractedText` is filled
   - the Vercel runtime log shows `[echo/render] drafts.<id>: done`
3. Publish the draft. Expected: no second run, so no new log line.
4. Click "Seiten neu erzeugen". Expected: a new run that ends in `done`.
5. Replace the PDF with a non-PDF renamed to `.pdf`. Expected: `render.status = failed` with a readable message.
6. Afterwards, list the test document and its assets for the user to delete. Permanent deletion stays with the user.

- [ ] **Step 5: Hand over**

Report the PR link, the results of the gate in Step 1 and of the run in Step 4. Then move WEB-351 to "In Review": attach the PR link first, and set the state in a separate, later call.
