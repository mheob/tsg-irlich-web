# WEB-367 Old TSG-Echo Issues Unfindable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An issue whose new field "In Suchmaschinen auffindbar" is off stays readable on the website, but neither its page nor its PDF, page images or cover can be indexed by a search engine.

**Architecture:**

- `echo.issue` gets a boolean `indexable` with the initial value `true`. The queries project it as `coalesce(indexable, true)`, so existing documents stay findable.
- Files of a non-indexable issue are linked through `/echo-archiv/images/…` and `/echo-archiv/files/…` instead of `cdn.sanity.io`.
  - A Next.js external rewrite proxies those paths to the Sanity CDN of the configured project and dataset.
  - `headers()` adds `X-Robots-Tag: noindex, nofollow`.
  - On Vercel this runs in the CDN without a function, so the 4.5 MB response limit of functions does not apply to the up to 20 MB PDFs.
- The issue page of a non-indexable issue sets `robots: noindex, nofollow` and no cover as open graph image. The sitemap leaves it out.
- The archive page shows a takedown hint that links to `/kontakt`.

**Tech Stack:** Next.js 16.4 (`rewrites`, `headers`, `Metadata.robots`), Sanity Studio 6 (`defineField`), GROQ `coalesce`, Vitest through Vite+, Playwright `request` fixture, GitButler (`but`).

**Spec:**

- Linear [WEB-367](https://linear.app/tsg-irlich/issue/WEB-367/tsg-echo-alte-ausgaben-nicht-auffindbar-machen): scope and acceptance criteria.
- Linear [WEB-353](https://linear.app/tsg-irlich/issue/WEB-353/tsg-echo-datenschutz-ausgabenliste-und-hero-foto-klaren), comment of 2026-10-10:
  - "Datenschutz: Entscheidungsvorlage"
  - option B
  - "Mein Vorschlag"
- The user's decisions of 2026-10-10:
  - two PRs, WEB-367 before the import WEB-354
  - PDFs **and** page images through the own paths
  - a studio field, not a date rule
  - the hint links the contact form

**Branch:** `feat/web-367-echo-archive-unfindable`. GitButler creates it on the first `but commit -b`.

## Global Constraints

**Scope and git**

- Commits go through the `create-commit` skill (`but commit -b feat/web-367-echo-archive-unfindable -m "…" <ids>`).
  - Conventional Commits, English message, subject at most 50 characters, no `Co-Authored-By` or generator trailer.
  - Never a raw `git` write command.
- Run `pnpm run format:check` from the repository root before every commit, because `but commit` skips lefthook.
- After every task these must be clean:
  - `pnpm run lint`, with 0 warnings
  - `pnpm run typecheck`
  - the tests of the touched workspaces
- The PR is opened **ready for review** (the user's standing rule) through the `create-pr` skill. Kodiak merges it on green, so every check, including the manual one in Task 5, happens before the PR.
- No writes to the Sanity dataset `production`. This plan needs no write to `development` either. Recording fixtures only reads.
- No real TSG-Echo content in the repository or in fixtures.
- Out of scope:
  - the import (WEB-354)
  - a studio list badge for non-indexable issues
  - `rel="nofollow"` on links to non-indexable issue pages; the page's own `noindex, nofollow` decides

**Values (exact)**

- Field: `name: 'indexable'`, `title: 'In Suchmaschinen auffindbar'`, `type: 'boolean'`, `initialValue: true`, `group: 'general'`.
  - description `Aus: Die Ausgabe bleibt auf der Website lesbar, Suchmaschinen finden aber weder die Seite noch ihre Dateien. Gedacht für ältere Ausgaben mit Namen, Kontaktdaten oder Fotos von Kindern.`
- Projection: `"indexable": coalesce(indexable, true)`. Sitemap filter: `indexable != false`.
- Archive path prefix `/echo-archiv`. Routes:
  - `/echo-archiv/:kind(images|files)/:file` → `https://cdn.sanity.io/:kind/<projectId>/<dataset>/:file`
- Headers for `/echo-archiv/:path*`:
  - `X-Robots-Tag: noindex, nofollow`
  - `x-vercel-enable-rewrite-caching: 1`. Vercel's opt-in for caching external rewrites in projects older than 2026-04-06.
- Issue page metadata of a non-indexable issue: `robots: { follow: false, index: false }`, no `image` passed to `getPageMetadata`.
- Hint copy (German, exact): `Du findest dich in einer älteren Ausgabe wieder und möchtest das nicht? Dann melde dich über unser Kontaktformular.` The word `Kontaktformular` links to `/kontakt`. Shown only when the archive has at least one issue.

**Code style** (as in WEB-352)

- Tabs, single quotes, named exports, types at the end of a file, kebab-case names, JSDoc on every top-level function, export block at the end.
- `sort-keys`, `no-magic-numbers` (0 to 9 free), `max-statements` 10 and `max-params` 3 outside tests.
- Tests:
  - import from `vite-plus/test`
  - assert role, text, `href`, `src` and props, never class names
  - no conditionals inside `it`

## Review Focus

1. **A document without the field.** Every issue that exists today has no `indexable`. It must stay findable: page indexable, CDN links, in the sitemap. Pinned in Task 2 (projection) and Task 4 (page with `indexable: true`).
2. **A file name with spaces or umlauts in `?dl=`.** For example `1980 - TSG Irlich - 3.Echo.pdf`. Through the archive path the download keeps its name and the URL stays valid. Pinned in Task 1.
3. **A URL that is not a Sanity CDN asset.** It is a relative path, another host, or an image URL with extra segments. `toArchiveUrl` returns it unchanged instead of breaking it. Pinned in Task 1.
4. **The environment without project or dataset at config time.** For example a tool that loads `next.config.ts` without `.env.local`. The config builds no rewrite and throws nothing. Pinned in Task 1.
5. **Covers of non-indexable issues on the indexable archive page.** They must come through `/echo-archiv` and skip the image optimizer. `/_next/image` would serve them without the header. Pinned in Task 4.

---

### Task 1: Archive URLs and the rewrite

**Files:**

- Create: `apps/web/src/lib/echo/archive-url.ts`
- Test: `apps/web/src/lib/echo/archive-url.test.ts`
- Modify: `apps/web/next.config.ts`

**Interfaces:**

- Produces:
  - `ARCHIVE_PATH = '/echo-archiv'`
  - `toArchiveUrl(url: string): string`
  - `getArchiveRewrites(target: { dataset?: string; projectId?: string }): ArchiveRewrite[]`
  - `getArchiveHeaders(): ArchiveHeaders[]`
- Consumed by Task 3 (`toArchiveUrl`) and `next.config.ts`

- [ ] **Step 1: Write the failing tests**

`apps/web/src/lib/echo/archive-url.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import { getArchiveHeaders, getArchiveRewrites, toArchiveUrl } from './archive-url';

const IMAGE =
	'https://cdn.sanity.io/images/j4rxwl5m/development/0a1b2c-1414x2000.jpg?w=800&fit=max&q=85';

describe('archive urls', () => {
	it('moves a page image below the archive path and keeps its parameters', () => {
		expect(toArchiveUrl(IMAGE)).toBe('/echo-archiv/images/0a1b2c-1414x2000.jpg?w=800&fit=max&q=85');
	});

	// Review focus 2: an archive file name like "1980 - TSG Irlich - 3.Echo.pdf".
	it('keeps the download name of a pdf, encoded', () => {
		expect(
			toArchiveUrl(
				'https://cdn.sanity.io/files/j4rxwl5m/production/9f8e.pdf?dl=1980 - TSG Irlich - 3.Echo.pdf',
			),
		).toBe('/echo-archiv/files/9f8e.pdf?dl=1980%20-%20TSG%20Irlich%20-%203.Echo.pdf');
	});

	// Review focus 3.
	it.each([
		['a relative path', '/verein/echo'],
		['another host', 'https://example.com/images/p/d/a.jpg'],
		['an unexpected depth', 'https://cdn.sanity.io/images/p/d/extra/a.jpg'],
		['no url at all', '#!'],
	])('leaves %s alone', (_label, url) => {
		expect(toArchiveUrl(url)).toBe(url);
	});
});

describe('the archive rewrite', () => {
	it('proxies both asset kinds to the configured project and dataset', () => {
		expect(getArchiveRewrites({ dataset: 'production', projectId: 'j4rxwl5m' })).toStrictEqual([
			{
				destination: 'https://cdn.sanity.io/:kind/j4rxwl5m/production/:file',
				source: '/echo-archiv/:kind(images|files)/:file',
			},
		]);
	});

	// Review focus 4.
	it.each([
		['without a project', { dataset: 'production' }],
		['without a dataset', { projectId: 'j4rxwl5m' }],
	])('builds nothing %s', (_label, target) => {
		expect(getArchiveRewrites(target)).toStrictEqual([]);
	});

	it('tells search engines to skip everything below the archive path', () => {
		expect(getArchiveHeaders()).toStrictEqual([
			{
				headers: [
					{ key: 'X-Robots-Tag', value: 'noindex, nofollow' },
					{ key: 'x-vercel-enable-rewrite-caching', value: '1' },
				],
				source: '/echo-archiv/:path*',
			},
		]);
	});
});
```

Run: `pnpm --filter web exec vp test run src/lib/echo/archive-url.test.ts` Expected: FAIL, because `./archive-url` does not exist.

- [ ] **Step 2: Implement**

`apps/web/src/lib/echo/archive-url.ts`:

```ts
// Imported by `next.config.ts`, so it uses relative imports only and nothing server-only.

/** The path the website serves Sanity assets under when search engines must not index them. */
const ARCHIVE_PATH = '/echo-archiv';

const SANITY_CDN_HOST = 'cdn.sanity.io';

/** `/<kind>/<project>/<dataset>/<file>` on the Sanity CDN. */
const CDN_ASSET_PATH = /^\/(?<kind>images|files)\/[^/]+\/[^/]+\/(?<file>[^/]+)$/u;

/**
 * Moves a Sanity CDN asset URL below the archive path, where the website serves it with
 * `X-Robots-Tag: noindex`. Anything that is not a CDN asset comes back unchanged.
 *
 * @param url - The asset URL as the image builder or the PDF projection returns it.
 * @returns The same-origin archive URL with the original parameters, or `url` itself.
 */
function toArchiveUrl(url: string): string {
	if (!URL.canParse(url)) {
		return url;
	}
	const parsed = new URL(url);
	const asset = parsed.hostname === SANITY_CDN_HOST ? CDN_ASSET_PATH.exec(parsed.pathname) : null;
	if (!asset?.groups) {
		return url;
	}
	return `${ARCHIVE_PATH}/${asset.groups.kind}/${asset.groups.file}${parsed.search}`;
}

/**
 * The external rewrite that proxies the archive path to the Sanity CDN. On Vercel the CDN does the
 * proxying, so the response size limit of functions does not apply.
 *
 * @param target - The Sanity project and dataset; without either there is nothing to proxy to.
 * @returns The rewrite, or none.
 */
function getArchiveRewrites({ dataset, projectId }: SanityTarget): ArchiveRewrite[] {
	if (!dataset || !projectId) {
		return [];
	}
	return [
		{
			destination: `https://${SANITY_CDN_HOST}/:kind/${projectId}/${dataset}/:file`,
			source: `${ARCHIVE_PATH}/:kind(images|files)/:file`,
		},
	];
}

/**
 * The headers of every archive response. `x-vercel-enable-rewrite-caching` opts projects created
 * before 2026-04-06 into caching external rewrites.
 *
 * @returns The header rule for the archive path.
 */
function getArchiveHeaders(): ArchiveHeaders[] {
	return [
		{
			headers: [
				{ key: 'X-Robots-Tag', value: 'noindex, nofollow' },
				{ key: 'x-vercel-enable-rewrite-caching', value: '1' },
			],
			source: `${ARCHIVE_PATH}/:path*`,
		},
	];
}

interface SanityTarget {
	dataset?: string;
	projectId?: string;
}

interface ArchiveRewrite {
	destination: string;
	source: string;
}

interface ArchiveHeaders {
	headers: { key: string; value: string }[];
	source: string;
}

export { ARCHIVE_PATH, getArchiveHeaders, getArchiveRewrites, toArchiveUrl };
export type { ArchiveHeaders, ArchiveRewrite };
```

The expected value in the first test keeps `fit=max&q=85` in the order of the input. `new URL(...).search` preserves the order and only encodes what needs it. If the space test comes out as `+` instead of `%20`, compare against what `new URL(...).search` produces and adjust the test, since both name the file correctly.

In `apps/web/next.config.ts`, add `import process from 'node:process';` and `import { getArchiveHeaders, getArchiveRewrites } from './src/lib/echo/archive-url';`. Then, inside `nextConfig`, in `sort-keys` order:

```ts
	// Old TSG-Echo issues are served through `/echo-archiv` with `X-Robots-Tag: noindex`.
	headers: () => Promise.resolve(getArchiveHeaders()),
```

```ts
	rewrites: () =>
		Promise.resolve(
			getArchiveRewrites({
				dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
				projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
			}),
		),
```

`next.config.ts` reads `process.env` directly like `src/lib/sanity/api.ts`. The `env()` helper imports `zod` and caches per process, which the config does not need. Next.js loads `.env*` before it evaluates the config.

- [ ] **Step 3: Run the tests and the checks**

Run: `pnpm --filter web exec vp test run src/lib/echo/archive-url.test.ts` Expected: PASS.

Run: `pnpm run typecheck && pnpm run lint` Expected: no errors, 0 warnings.

- [ ] **Step 4: Commit**

`feat(web): serve echo archive files with noindex`.

---

### Task 2: The studio field and the queries

**Files:**

- Modify: `apps/studio/schemas/documents/echo.issue.ts` (field after the intro, before `metaField`)
- Test: `apps/studio/schemas/documents/echo.issue.test.ts`
- Modify: `apps/web/src/lib/sanity/queries/pages/echo.ts` (`echoIssueCard`)
- Modify: `apps/web/src/lib/sanity/queries/sitemap.ts` (`sitemapEchoIssuesQuery`)
- Test: `apps/web/src/lib/sanity/queries/pages/echo.test.ts`
- Modify (generated): `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`
- Modify: `apps/studio/AGENTS.md` (TSG-Echo paragraph)

**Interfaces:**

- Produces: `indexable: boolean` on every entry of `EchoIssuesQueryResult` and on `EchoIssueQueryResult`.

- [ ] **Step 1: Write the failing tests**

In `apps/studio/schemas/documents/echo.issue.test.ts`, inside `describe('echo issue fields', …)`:

```ts
// WEB-367: the import switches it off for old issues; everything that exists today stays on.
it('keeps an issue findable by default', () => {
	expect(field('indexable')).toMatchObject({
		group: 'general',
		initialValue: true,
		title: 'In Suchmaschinen auffindbar',
		type: 'boolean',
	});
});
```

If the file's `field()` helper types `initialValue` or `title` out, widen its interface the way `echo-overview.test.ts` declares `initialValue?: unknown`.

In `apps/web/src/lib/sanity/queries/pages/echo.test.ts`, inside `describe('tsg-echo queries', …)`, import `sitemapEchoIssuesQuery` is already there:

```ts
// Review focus 1: no document has the field yet, and every one of them must stay findable.
it.each([
	['the list', echoIssuesQuery],
	['the issue page', echoIssueQuery],
])('treats a missing field on %s as findable', (_label, query) => {
	expect(query).toContain('"indexable": coalesce(indexable, true)');
});

it('leaves unfindable issues out of the sitemap', () => {
	expect(sitemapEchoIssuesQuery).toContain('indexable != false');
});
```

Run: `pnpm --filter studio exec vp test run schemas/documents/echo.issue.test.ts && pnpm --filter web exec vp test run src/lib/sanity/queries/pages/echo.test.ts` Expected: FAIL in both. The field is missing, and the queries do not contain the projection and the filter.

- [ ] **Step 2: Implement**

In `apps/studio/schemas/documents/echo.issue.ts`, directly after the `intro` field and before `metaField`:

```ts
		defineField({
			description:
				'Aus: Die Ausgabe bleibt auf der Website lesbar, Suchmaschinen finden aber weder die Seite noch ihre Dateien. Gedacht für ältere Ausgaben mit Namen, Kontaktdaten oder Fotos von Kindern.',
			group: 'general',
			initialValue: true,
			name: 'indexable',
			title: 'In Suchmaschinen auffindbar',
			type: 'boolean',
		}),
```

In `apps/web/src/lib/sanity/queries/pages/echo.ts`, add to `echoIssueCard` after `intro,`:

```ts
	"indexable": coalesce(indexable, true),
```

In `apps/web/src/lib/sanity/queries/sitemap.ts`, change the filter of `sitemapEchoIssuesQuery` to `*[${finishedEchoIssue} && indexable != false]`, and extend its JSDoc to say "every finished and findable TSG-Echo issue".

In `apps/studio/AGENTS.md`, add to the "TSG-Echo issues" paragraph:

```markdown
`indexable` ("In Suchmaschinen auffindbar", initially on) decides whether search engines may find an issue. Off, the website marks its page `noindex, nofollow`, leaves it out of the sitemap and serves its files through `/echo-archiv` with `X-Robots-Tag: noindex` (WEB-367). The import of the old issues switches it off.
```

- [ ] **Step 3: Generate**

Run from the repository root: `pnpm run extract-types && pnpm run typegen:sanity && pnpm run format` Expected:

- `schema.json` contains `indexable` on `echo.issue`
- `EchoIssuesQueryResult` and `EchoIssueQueryResult` contain `indexable: boolean`

- [ ] **Step 4: Run the tests and the checks**

Run: `pnpm --filter studio exec vp test run schemas && pnpm --filter web exec vp test run src/lib/sanity src/app/verein/echo` Expected: PASS.

The fixtures of the archive and the issue page in the existing page tests may lack `indexable`. TypeScript then flags them in `pnpm run typecheck`. Add `indexable: true` to those fixtures, which is what the projection returns for today's documents.

Run: `pnpm run typecheck && pnpm run lint` Expected: no errors, 0 warnings.

- [ ] **Step 5: Commit**

`feat: add the indexable switch to echo issues`, including the generated files.

---

### Task 3: Helpers that hide an issue's files

**Files:**

- Modify: `apps/web/src/app/verein/echo/_shared/utils.ts`
- Test: `apps/web/src/app/verein/echo/_shared/utils.test.ts`

**Interfaces:**

- Consumes: `toArchiveUrl` (Task 1).
- Produces, each with a last parameter `indexable = true`:
  - `getCoverUrl(cover, width, indexable?): string | undefined`
  - `getPdfDownload(pdf, indexable?): PdfDownload | undefined`
  - `getFlipbookPages(pages, indexable?): FlipbookPage[]`
  - `getCoverPage(cover, title, indexable?): FlipbookPage | undefined`
- `true` keeps the CDN URLs, `false` returns archive URLs. Every `src` and every entry of `srcSet` is rewritten, and so is the PDF `href`.

- [ ] **Step 1: Write the failing tests**

Add to `apps/web/src/app/verein/echo/_shared/utils.test.ts`, inside `describe('tsg-echo issue helpers', …)`:

```ts
describe('for an issue search engines must not find', () => {
	it('links every width of every page through the archive path', () => {
		const [page] = getFlipbookPages([pageImage('a')], false);

		expect(page.src).toMatch(/^\/echo-archiv\/images\/a-1414x2000\.jpg\?/u);
		expect(page.srcSet.split(', ').every((entry) => entry.startsWith('/echo-archiv/images/'))).toBe(
			true,
		);
	});

	it('links the cover of the flipbook and of the cards through the archive path', () => {
		expect(getCoverPage(pageImage('a'), 'TSG ECHO 1984 Nr. 1', false)?.src).toMatch(
			/^\/echo-archiv\/images\//u,
		);
		expect(getCoverUrl(pageImage('a'), 600, false)).toMatch(/^\/echo-archiv\/images\/.*w=600/u);
	});

	it('offers the pdf through the archive path with its file name', () => {
		expect(
			getPdfDownload(
				{
					originalFilename: 'tsg-echo-1984-1.pdf',
					size: 1_048_576,
					url: 'https://cdn.sanity.io/files/p/d/abc.pdf',
				},
				false,
			),
		).toStrictEqual({ href: '/echo-archiv/files/abc.pdf?dl=tsg-echo-1984-1.pdf', size: '1.00 MB' });
	});
});

// Review focus 1: today's issues, whose projection says `indexable: true`.
it('keeps the cdn urls for an issue search engines may find', () => {
	const [page] = getFlipbookPages([pageImage('a')], true);

	expect(page.src).toMatch(/^https:\/\/cdn\.sanity\.io\/images\//u);
});
```

Run: `pnpm --filter web exec vp test run src/app/verein/echo/_shared/utils.test.ts` Expected: FAIL. The helpers ignore the new argument and return CDN URLs; TypeScript also flags the extra argument.

- [ ] **Step 2: Implement**

In `apps/web/src/app/verein/echo/_shared/utils.ts`:

```ts
import { toArchiveUrl } from '@/lib/echo/archive-url';
```

```ts
/**
 * The URL a visitor gets for an asset: the CDN's own, or the archive path's, which tells search
 * engines to stay away.
 *
 * @param url - The CDN URL.
 * @param indexable - Whether search engines may find the issue.
 * @returns The URL to link.
 */
function linkAsset(url: string, indexable: boolean): string {
	return indexable ? url : toArchiveUrl(url);
}
```

Change the helpers:

- `getPdfDownload(pdf?: EchoPdf | null, indexable = true)` returns `{ href: linkAsset(href, indexable), size: … }`.
- `getCoverUrl(cover, width, indexable = true)` returns `url && linkAsset(url, indexable)`, where `url = urlForImageMax(toSanityImage(cover), width)`.
- `toFlipbookPage(page: PageAsset, leaf: Leaf)` with `interface Leaf { alt: string; id: string; indexable: boolean }`. It builds `src` and every `srcSet` entry through `linkAsset(…, leaf.indexable)`. This keeps the function within three parameters.
- `getFlipbookPages(pages, indexable = true)` and `getCoverPage(cover, title, indexable = true)` pass `indexable` on.

Update the JSDoc of every changed function with `@param indexable - Whether search engines may find the issue; default true.`

- [ ] **Step 3: Run the tests and the checks**

Run: `pnpm --filter web exec vp test run src/app/verein/echo` Expected: PASS. Existing calls without the argument keep CDN URLs.

Run: `pnpm run typecheck && pnpm run lint` Expected: no errors, 0 warnings.

- [ ] **Step 4: Commit**

`feat(web): link files of hidden echo issues privately`.

---

### Task 4: Pages, metadata and the hint

**Files:**

- Modify: `apps/web/src/app/verein/echo/[slug]/page.tsx`
- Test: `apps/web/src/app/verein/echo/[slug]/page.test.ts`
- Modify: `apps/web/src/app/verein/echo/_sections/latest-issue.tsx`, `apps/web/src/app/verein/echo/_sections/issue-grid.tsx`
- Test: `apps/web/src/app/verein/echo/_sections/latest-issue.test.tsx`, `apps/web/src/app/verein/echo/_sections/issue-grid.test.tsx`
- Modify: `apps/web/src/app/verein/echo/page.tsx`
- Test: `apps/web/src/app/verein/echo/page.test.ts`

**Interfaces:**

- Consumes: `issue.indexable` (Task 2) and the helpers of Task 3.

- [ ] **Step 1: Write the failing tests**

In `apps/web/src/app/verein/echo/[slug]/page.test.ts`. `buildIssue` gets `indexable: true` in its defaults if Task 2 did not add it already.

```ts
describe('an issue search engines must not find', () => {
	it('serves its pages and its pdf through the archive path', async () => {
		mockedFetch.mockResolvedValue(buildIssue({ indexable: false }));

		const result = await EchoIssuePage(props());

		expect(findElement(result, FlipbookLazy)?.props.pages[0]?.src).toMatch(/^\/echo-archiv\//u);
		expect(findElement(result, ButtonLink)?.props.href).toMatch(/^\/echo-archiv\/files\//u);
	});

	it('keeps search engines and the cover image out of its metadata', async () => {
		mockedFetch.mockResolvedValue(buildIssue({ indexable: false }));

		const metadata = await generateMetadata(props());

		expect(metadata.robots).toStrictEqual({ follow: false, index: false });
		expect(metadata.openGraph?.images).toStrictEqual([]);
	});
});

// Review focus 1.
it('leaves a findable issue to search engines', async () => {
	mockedFetch.mockResolvedValue(buildIssue({ indexable: true }));

	const metadata = await generateMetadata(props());

	expect(metadata.robots).toBeUndefined();
});
```

If `metadata.openGraph?.images` for a missing image is `undefined` rather than `[]`, assert what `getPageMetadata` returns for `image: undefined` (`getOpenGraphImageOptions(...) ?? []` gives `[]`).

In `latest-issue.test.tsx` (the `ISSUE` fixture gets `indexable: true`):

```ts
	// Review focus 5: /_next/image would serve the cover without the noindex header.
	it('shows the cover of a hidden issue through the archive path', () => {
		const { getByAltText } = renderWithUser(<LatestIssue issue={{ ...ISSUE, indexable: false }} />);

		expect(getByAltText('Titelseite von TSG ECHO 2025').getAttribute('src')).toMatch(
			/^\/echo-archiv\/images\//u,
		);
	});
```

In `issue-grid.test.tsx` (`issue(year)` gets `indexable: true`):

```ts
	it('shows the cover of a hidden issue through the archive path', () => {
		const { getByAltText } = renderWithUser(
			<IssueGrid currentPage={1} issues={[{ ...issue(1984), indexable: false }]} />,
		);

		expect(getByAltText('Titelseite von TSG ECHO 1984').getAttribute('src')).toMatch(
			/^\/echo-archiv\/images\//u,
		);
	});
```

The `next/image` mock in `setup-dom.ts` renders a plain `img` with `src` passed through. If it rewrites `src`, assert on the `src` prop of the found element instead.

In `apps/web/src/app/verein/echo/page.test.ts`:

```ts
it('tells readers how to have themselves removed from an issue', async () => {
	mockArchive({ issues: YEARS.map((year) => issue(year)) });

	const page = await EchoOverviewPage(props());

	expect(findElements(page, Link).map((element) => element.props.href)).toContain('/kontakt');
});
```

In the existing test `'stays a page without any finished issue'`, add:

```ts
expect(findElements(page, Link).map((element) => element.props.href)).not.toContain('/kontakt');
```

`Link` is the default export of `next/link`, imported in the test.

Run: `pnpm --filter web exec vp test run src/app/verein/echo` Expected: FAIL in the new cases.

- [ ] **Step 2: Implement**

`[slug]/page.tsx`, metadata:

```ts
const metadata = getPageMetadata({
	description: issue.intro,
	image: issue.indexable ? toSanityImage(issue.cover) : undefined,
	meta: issue.meta,
	path: getEchoIssuePath(slug),
	title: issue.title,
});

// WEB-353: old issues stay readable but out of search engines, together with their files.
return issue.indexable ? metadata : { ...metadata, robots: { follow: false, index: false } };
```

`[slug]/page.tsx`, page body: pass `issue.indexable` to:

- `getPdfDownload(issue.pdf, issue.indexable)`
- `getCoverPage(issue.cover, issue.title, issue.indexable)`
- `getFlipbookPages(issue.pages, issue.indexable)`

`latest-issue.tsx` and `issue-grid.tsx`:

- `const cover = getCoverUrl(issue.cover, COVER_WIDTH, issue.indexable);`
- `getPdfDownload(issue.pdf, issue.indexable)` in the card
- add `unoptimized={!issue.indexable}` to the `Image`, with the comment `{/* The optimizer would serve a hidden issue's cover without the noindex header. */}`

`unoptimized` makes `next/image` render the archive URL itself. The CDN's `w` parameter already sizes it.

`apps/web/src/app/verein/echo/page.tsx`, after the `IssueGrid` block and inside the section:

```tsx
{
	latest && (
		<p className="mx-auto mt-16 max-w-3xl text-center text-sm md:text-base">
			Du findest dich in einer älteren Ausgabe wieder und möchtest das nicht? Dann melde dich über
			unser{' '}
			<Link className="underline" href="/kontakt">
				Kontaktformular
			</Link>
			.
		</p>
	);
}
```

Import `Link` from `next/link`.

- [ ] **Step 3: Run the tests and the checks**

Run: `pnpm --filter web exec vp test run src/app/verein` Expected: PASS.

Run: `pnpm run typecheck && pnpm run lint` Expected: no errors, 0 warnings.

- [ ] **Step 4: Commit**

`feat(web): keep hidden echo issues out of search`.

---

### Task 5: End to end, fixtures and a manual check

**Files:**

- Modify: `apps/web/e2e/specs/echo.spec.ts`
- Replace (recorded): the fixtures of `echoIssuesQuery`, `echoIssueQuery` and `sitemapEchoIssuesQuery` in `apps/web/e2e/fixtures/sanity/`
- Replace (generated): `apps/web/e2e/__screenshots__/{chromium,mobile-safari}/echo.png`

- [ ] **Step 1: Write the e2e test**

Add to `apps/web/e2e/specs/echo.spec.ts`:

```ts
test.describe('the tsg-echo archive files', () => {
	test.skip(({ isMobile }) => isMobile, 'A request without a page is the same in every project.');

	for (const [kind, path] of [
		['an image', '/echo-archiv/images/0a1b2c-1414x2000.jpg?w=800'],
		['a pdf', '/echo-archiv/files/0a1b2c.pdf?dl=tsg-echo.pdf'],
	] as const) {
		test(`serves ${kind} with noindex`, async ({ request }) => {
			const response = await request.get(path);

			expect(response.status()).toBe(200);
			expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
		});
	}
});
```

The proxied request leaves the Next.js server for `cdn.sanity.io`, where `e2e/mocks/preload.ts` answers every request with a PNG.

- [ ] **Step 2: Re-record the changed fixtures**

The queries changed, and so did the URLs the fixtures are keyed by.

1. Delete the fixtures whose recorded `url` contains `order(releaseDate` (the list), `slug.current+%3D%3D+%24slug` (the issue page) or `%22lastModified%22` together with `echo.issue` (the sitemap). Find them with `grep -l`.
2. Run `pnpm --filter web run e2e:record`. Only reads `development`.
3. Run `pnpm exec vp fmt apps/web/e2e/fixtures`.
4. Discard every modified, not new, fixture with `but discard <id>`, one id per call. As in WEB-352, they differ only in sync tags and timings.
5. Check that every new fixture contains `coalesce(indexable` or `indexable+!%3D+false` and only synthetic content.

Run: `pnpm --filter web run test:e2e` Expected: green, including the two new tests.

If the new tests answer 404 or fail with "Unmocked outbound request", the proxy bypassed MSW. Do not fake a mock to get green. Record a ruling and keep the tests, and pin the header through a unit test of `next.config.ts`'s `headers()` instead. The manual check in step 4 covers the real proxy.

- [ ] **Step 3: Update the archive baseline**

The hint changes the archive page. Run (needs Docker): `pnpm --filter web run test:e2e:visual:update`. Expected: only `echo.png` changes in both projects. Look at both before committing.

- [ ] **Step 4: Manual check against the real CDN**

Start the dev server with the preview tool (`preview_start` with `web`, which reads `development`). Then:

1. Take the asset file name of a synthetic page image from `development`: `*[_type == 'echo.issue'][0].pages[0].asset->url`, read with the Sanity query tool.
2. `curl -sI "http://localhost:3000/echo-archiv/images/<file>?w=800"`. Expected: `200`, `content-type: image/jpeg`, `x-robots-tag: noindex, nofollow`.
3. `curl -s -o /tmp/claude-…/page.jpg "…?w=800"` into the scratchpad, then `sips -g pixelWidth`. Expected: `800`, which proves the query string reaches the CDN.
4. The same `curl -sI` for the synthetic PDF with `?dl=test.pdf`. Expected: `200`, `content-type: application/pdf`, `content-disposition` with `test.pdf`, `x-robots-tag`.

Stop the server afterwards.

- [ ] **Step 5: Commit**

`test(web): cover the echo archive files`, with the spec, the new fixtures, the removed fixtures and the baselines.

---

### Task 6: Documentation, gate and pull request

- [ ] **Step 1: Document**

In `apps/web/AGENTS.md`, section "TSG-Echo pages", add:

```markdown
- An issue with `indexable` off (WEB-367) stays readable but out of search engines. Its page sets `noindex, nofollow` and no cover as open graph image, and the sitemap leaves it out. Its PDF, page images and cover are linked through `/echo-archiv/{images,files}/…` (`toArchiveUrl` in `src/lib/echo/archive-url.ts`). An external rewrite in `next.config.ts` proxies that path to the Sanity CDN of the configured project and dataset and adds `X-Robots-Tag: noindex, nofollow`. On Vercel the CDN proxies it, without a function, so the 4.5 MB response limit does not apply. Covers of such issues skip `next/image`'s optimizer (`unoptimized`), which would serve them without the header. `robots.ts` must not disallow `/echo-archiv`, or crawlers never see the header.
- The archive page ends with a takedown hint that links `/kontakt`.
```

- [ ] **Step 2: Full local gate**

Run from the repository root: `pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test:coverage && pnpm run build && pnpm --filter web run test:e2e` Expected: everything green, thresholds held, 0 warnings.

- [ ] **Step 3: Commit and open the pull request**

Commit: `docs(web): document the echo archive path`.

Open the PR with the `create-pr` skill:

- branch `feat/web-367-echo-archive-unfindable`, base `next`, **ready for review**
- `Closes WEB-367` in the body
- bind it and turn Auto-fix on

- [ ] **Step 4: Tickets**

- WEB-367: the PR link is attached by the integration; set "In Review".
- WEB-353: comment that option B is implemented in WEB-367.
- WEB-354 is next.
