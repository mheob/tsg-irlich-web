# WEB-352 TSG-Echo Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visitors find every finished TSG-Echo issue on `/verein/echo`, the newest one highlighted, and read each issue on its own page as a flipbook or as a PDF.

**Architecture:**

- Two server-rendered routes below `/verein`:
  - the archive `/verein/echo`, built like `/news`
  - the issue page `/verein/echo/[slug]`
- Both read Sanity through `client.fetch`, like `/verein`; neither is previewable in the presentation tool.
- Only issues with `render.status == 'done'` exist for the website. One GROQ fragment holds that rule, so lists, pages and the sitemap cannot disagree.
- The flipbook is a client component in `src/components/with-logic/flipbook/` that wraps `@gullabs/react-flipbook`, so a library change stays local.
  - `FlipbookLazy` renders the cover on the server and loads the library only in the browser, through `React.lazy`.
  - The reserved box has the book's aspect ratio, so the page does not shift when the book replaces the cover.

**Tech Stack:** Next.js 16.4 App Router (server components, `PageProps`, `generateStaticParams`), `next-sanity` 13 (`defineQuery`), `@gullabs/react-flipbook` 3.2, React 19 (`lazy`, `Suspense`, `useSyncExternalStore`), Tailwind CSS 4, Vitest 5 through Vite+ (`node` and `dom` projects), Playwright with `@axe-core/playwright`, GitButler (`but`).

**Spec:**

- Linear [WEB-352](https://linear.app/tsg-irlich/issue/WEB-352/tsg-echo-ubersicht-ausgabenseite-und-flipbook): scope, "Anbindung", acceptance criteria.
- Linear [WEB-58](https://linear.app/tsg-irlich/issue/WEB-58/tsg-echo):
  - concept section "Frontend"
  - spike comment of 2026-10-10, part 3 "Flipbook"
- Carried over from WEB-351:
  - `echoOverview` joins `INTERNAL_LINK_TARGETS` here.
  - The final review of WEB-351 noted that a failed run keeps the pages of the previous PDF, so the website may show pages only when `render.status == 'done'`.

**Branch:** `feat/web-352-echo-frontend`. GitButler creates it on the first `but commit -b`.

## Global Constraints

**Scope and git**

- Commits go through the `create-commit` skill (`but commit -b feat/web-352-echo-frontend -m "…" <ids>`).
  - Conventional Commits, English message, subject at most 50 characters, no `Co-Authored-By` or generator trailer.
  - Never a raw `git` write command.
- Run `pnpm run format:check` from the repository root before every commit, because `but commit` skips lefthook.
- After every task these must be clean:
  - `pnpm run lint`, with 0 warnings; the repository baseline is 0
  - `pnpm run typecheck`
  - the tests of the touched workspaces
- **Kodiak merges a ready pull request into `next` as soon as the checks pass.** Open the PR with `--draft` and leave the switch to "Ready for review" to the user.
- No writes to the Sanity dataset `production`. Writes to `development` need an explicit "yes" from the user in chat right before they happen.
- No real TSG-Echo content in the repository or in fixtures. WEB-353 has not settled data protection yet, so e2e fixtures come from synthetic issues in `development`.
- Out of scope:
  - the optional "Seite vergrößern" lightbox
  - presentation-tool preview for the TSG-Echo routes
  - JSON-LD for issues
  - `noindex` for the archive, which is a WEB-353 decision
  - the "TSG-Echo" menu item in `site-settings`, a production data change after the release (as in WEB-343)

**Values (exact)**

- Archive path `/verein/echo`, issue path `/verein/echo/<slug>`. The spec says `/verein/tsg-echo`; the user shortened it to `/verein/echo` on 2026-10-10, so the fixed slug of the `echoOverview` singleton becomes `echo` too. Neither dataset holds an `echoOverview` document yet, so no migration is needed.
- Archive: the newest issue as a wide card, then a grid of the others, `START_INDEX = 1`, `ITEMS_PER_PAGE = 12`, `?seite=` with `ArrowButtonGroup`.
- Covers in `aspect-[1/1.414]`: the newest one with `preload`, the grid ones lazy.
- Flipbook:
  - `lazyRadius={2}`
  - page images as `<img srcSet>` from Sanity's CDN in `800`, `1200` and `1600` px
  - `respectReducedMotion`, `useKeyboard`, `usePortrait`, `hardCovers`
  - its own previous/next buttons and a page indicator with `aria-live="polite"`
- Issue page:
  - `Hero` with the issue title and the year
  - breadcrumb Home › Verein › TSG-Echo › issue
  - intro, flipbook, download button
- Hero image: the club hero `@/images/verein/hero.webp` as a placeholder until the editors deliver a photo (WEB-353).
- Revalidation:
  - `echo.issue` revalidates `/verein/echo` and the `/verein/echo/[slug]` route
  - `echoOverview` revalidates only `/verein/echo`

**Copy (German, exact)**

- Archive:
  - label above the newest issue `Neueste Ausgabe · <Jahr>`
  - grid heading `Alle Ausgaben`
  - empty state `Noch keine Ausgaben online.`
  - buttons `Durchblättern` and `PDF herunterladen (<Größe>)`
- Cover alt text `Titelseite von <Titel>`.
- Flipbook:
  - name `<Titel> zum Durchblättern`
  - role description `Heft`
  - page alt text `Seite <n> von <m>`
  - buttons `Vorherige Seite` and `Nächste Seite`
  - indicator `Seite <n> von <m>` for one leaf, `Seiten <n>–<k> von <m>` for a spread (en dash)
- Breadcrumb segment `TSG-Echo`.

**Code style**

- Tabs, single quotes, named exports, interfaces and types at the end of a file, kebab-case file names, JSDoc on every top-level function.
- An export block at the end of every library file (`exports-last`). Helpers are defined before use (`no-use-before-define`).
- `sort-keys`, `no-magic-numbers` (0 to 9 are free), `max-statements` 10 and `max-params` 3 apply outside tests.
- `react-perf` flags inline functions, objects and arrays passed as JSX props. Define handlers and style objects as named constants in the component body.
- `'use client'` only below `src/components/with-logic` or a colocated `_sections` folder (`apps/web/AGENTS.md`).
- No `try`/`catch`/`finally` in components or hooks. Await with `settle()` from `@tsgi-web/shared`.
- Tests:
  - import from `vite-plus/test`
  - assert role, label, text, `href` and props, never class names
  - no conditionals inside `it`
  - `.test.tsx` runs in jsdom, `.test.ts` in node

## Review Focus

1. **No finished issue exists yet.** That is production at launch, until WEB-354 imports the archive. The archive must render hero, intro and `Noch keine Ausgaben online.`, without a card, a grid or a crash. The sitemap lists only the archive. Pinned in Task 4 and Task 6.
2. **An issue is pending, failed, unpublished or renamed.** Its old URL answers 404, and lists, sitemap and static params leave it out. The pages of a failed run, which still belong to the previous PDF, never appear. Pinned in Task 2, which checks the shared filter, and Task 5.
3. **`?seite=` is out of range, `0`, negative or text.** It behaves like `/news`: an invalid value means page 1, and a page past the end answers 404. Pinned in Task 4.
4. **The issue has one page, two pages, an odd page count, or the reader is at the cover or the last spread.** The indicator never says `Seiten 1–1`. The buttons are disabled exactly at the ends and turn the book otherwise. Pinned in Task 3.
5. **Data is missing.** This covers an issue without page dimensions, without a PDF URL or size, or without an intro. The page still renders with an A4 fallback, hides the download button and leaves the intro out. Without JavaScript the cover and the PDF download stay visible. Pinned in Task 3 (server render of the lazy wrapper) and Task 5.

---

### Task 1: Routing helpers and the link target

**Files:**

- Create: `apps/web/src/utils/pagination.ts`
- Test: `apps/web/src/utils/pagination.test.ts`
- Modify: `apps/web/src/app/news/_shared/utils.ts` (drop the two moved functions)
- Modify: `apps/web/src/app/news/_shared/utils.test.ts` (drop their two `describe` blocks)
- Modify: `apps/web/src/app/news/page.tsx:23`, `apps/web/src/app/news/[category]/page.tsx:23` (import from `@/utils/pagination`)
- Modify: `apps/web/src/utils/breadcrumb.ts`, Test: `apps/web/src/utils/breadcrumb.test.ts`
- Modify: `apps/web/src/utils/links.ts`, Test: `apps/web/src/utils/links.test.ts`
- Modify: `apps/studio/schemas/objects/internal-link.ts`
- Test: `apps/studio/schemas/objects/internal-link.test.ts`
- Modify: `apps/studio/schemas/single-pages/echo-overview.ts`, Test: `apps/studio/schemas/single-pages/echo-overview.test.ts` (slug `echo`)
- Modify: `apps/studio/AGENTS.md` (the `echoOverview` paragraph)

**Interfaces:**

- Produces:
  - `getPageNumber(page?: string | string[]): number` and `getPaginatedPath(path: string, pageNumber: number): string` from `@/utils/pagination`, with unchanged behaviour
  - `ECHO_OVERVIEW_PATH = '/verein/echo'` and `getEchoIssuePath(slug: string): string` from `@/utils/links`
  - `getInternalHref` resolves `echoOverview` to `/verein/echo` and `echo.issue` to `/verein/echo/<slug>`
  - `getBreadcrumbItems` names the segment `echo` "TSG-Echo"
  - the `echoOverview` singleton's fixed slug is `echo`

- [ ] **Step 1: Move the pagination helpers**

Create `apps/web/src/utils/pagination.ts` with `getPageNumber` and `getPaginatedPath` cut out of `apps/web/src/app/news/_shared/utils.ts`. Keep the code unchanged; only say "a paginated overview" instead of "a paginated news overview" in the JSDoc. End the file with `export { getPageNumber, getPaginatedPath };`, and leave `export { getArticlePath };` in the news file.

Move the `describe('the page number of a news overview', …)` and `describe('the canonical path of a news overview page', …)` blocks from `apps/web/src/app/news/_shared/utils.test.ts` into `apps/web/src/utils/pagination.test.ts`, importing from `./pagination`. Rename them to `'the page number of a paginated overview'` and `'the canonical path of a paginated overview page'`.

In `apps/web/src/app/news/page.tsx` and `apps/web/src/app/news/[category]/page.tsx`, replace the `_shared/utils` import with `import { getPageNumber, getPaginatedPath } from '@/utils/pagination';`.

Run: `pnpm --filter web exec vp test run src/utils/pagination.test.ts src/app/news` Expected: PASS, the same test count as before the move.

- [ ] **Step 2: Write the failing tests for the breadcrumb, the links and the link target**

Add to `apps/web/src/utils/breadcrumb.test.ts`, in `describe('the breadcrumb trail', …)`:

```ts
it('spells the TSG-Echo segment the way the club writes it', () => {
	expect(getBreadcrumbItems('/verein/echo/tsg-echo-2025', 'TSG ECHO 2025')).toStrictEqual([
		{ name: 'Home', path: '/' },
		{ name: 'Verein', path: '/verein' },
		{ name: 'TSG-Echo', path: '/verein/echo' },
		{ name: 'TSG ECHO 2025', path: '/verein/echo/tsg-echo-2025' },
	]);
});
```

Add to `apps/web/src/utils/links.test.ts`, in `describe('resolving internal link targets', …)`:

```ts
it('resolves the TSG-Echo archive below the club page', () => {
	expect(getInternalHref({ _type: 'echoOverview', slug: 'echo' })).toBe('/verein/echo');
});

it('resolves a TSG-Echo issue below the archive', () => {
	expect(getInternalHref({ _type: 'echo.issue', slug: 'tsg-echo-2025' })).toBe(
		'/verein/echo/tsg-echo-2025',
	);
});
```

Create `apps/studio/schemas/objects/internal-link.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import { INTERNAL_LINK_TARGETS } from './internal-link';

describe('internal link targets', () => {
	// Editors link the archive from the "Verein" menu; the issues themselves are reached from there.
	it('offers the TSG-Echo archive', () => {
		expect(INTERNAL_LINK_TARGETS).toContainEqual({ type: 'echoOverview' });
	});
});
```

In `apps/studio/schemas/single-pages/echo-overview.test.ts`, change the slug test to:

```ts
// The archive lives at /verein/echo; editors must not be able to move it.
it('fixes its slug to echo', () => {
	expect(field('slug')).toMatchObject({ initialValue: { current: 'echo' }, readOnly: true });
});
```

- [ ] **Step 3: Run them to see them fail**

Run: `pnpm --filter web exec vp test run src/utils/breadcrumb.test.ts src/utils/links.test.ts && pnpm --filter studio exec vp test run schemas/objects/internal-link.test.ts schemas/single-pages/echo-overview.test.ts` Expected: FAIL, with the overview slug `tsg-echo` instead of `echo`, breadcrumb "Echo" instead of "TSG-Echo", the overview link `/echo` instead of `/verein/echo`, and no `echoOverview` in the targets.

- [ ] **Step 4: Implement**

In `apps/web/src/utils/breadcrumb.ts`, before `getBreadcrumbItems`:

```ts
/** Segments the club writes differently from their humanised slug. */
const SEGMENT_NAMES: Record<string, string> = { echo: 'TSG-Echo' };
```

In the `map` of `getBreadcrumbItems`, use `name: SEGMENT_NAMES[segment] ?? capitalizeWords(segment),`.

In `apps/web/src/utils/links.ts`, after the existing type constants:

```ts
/** The single page of the TSG-Echo archive. Its slug is `echo`, but it lives below the club page. */
const ECHO_OVERVIEW_TYPE = 'echoOverview';

/** The document type of a TSG-Echo issue, which is served below the archive. */
const ECHO_ISSUE_TYPE = 'echo.issue';

/** The path of the TSG-Echo archive. */
const ECHO_OVERVIEW_PATH = '/verein/echo';

/**
 * Builds the path of a TSG-Echo issue.
 *
 * @param slug - The slug of the issue.
 * @returns The path below the archive.
 */
function getEchoIssuePath(slug: string): string {
	return `${ECHO_OVERVIEW_PATH}/${slug}`;
}
```

In `getHrefForType`, before the group branch:

```ts
if (type === ECHO_OVERVIEW_TYPE) {
	return ECHO_OVERVIEW_PATH;
}

if (type === ECHO_ISSUE_TYPE) {
	return getEchoIssuePath(slug);
}
```

Change the export to `export { ECHO_OVERVIEW_PATH, getEchoIssuePath, getInternalHref, type InternalLinkTarget };`.

In `apps/studio/schemas/objects/internal-link.ts`, add `{ type: 'echoOverview' },` directly after `{ type: 'aboutUs' },`. The list order is the order of the studio's picker, and the archive belongs to the club page.

In `apps/studio/schemas/single-pages/echo-overview.ts`, change `getHiddenSlugField('tsg-echo')` to `getHiddenSlugField('echo')`.

In `apps/studio/AGENTS.md`, replace the `echoOverview` paragraph with:

```markdown
`echoOverview` is the singleton behind `/verein/echo`, with the fixed slug `echo`. It is an internal link target, so the "Verein" menu can link the archive; the web app resolves it by type, not by slug (`getHrefForType` in `apps/web/src/utils/links.ts`).
```

- [ ] **Step 5: Run the tests and the checks**

Run: `pnpm --filter web exec vp test run src/utils src/app/news && pnpm --filter studio exec vp test run schemas/objects schemas/single-pages` Expected: PASS.

Run: `pnpm run typecheck && pnpm run lint` Expected: no errors, 0 warnings.

- [ ] **Step 6: Commit**

`feat(web): add tsg-echo routing helpers`, covering the files above.

---

### Task 2: Queries, generated types and issue helpers

**Files:**

- Modify: `apps/web/src/lib/sanity/queries/index.ts` (fragment `finishedEchoIssue`)
- Create: `apps/web/src/lib/sanity/queries/pages/echo.ts`
- Test: `apps/web/src/lib/sanity/queries/pages/echo.test.ts`
- Modify: `apps/web/src/lib/sanity/queries/sitemap.ts` (`sitemapEchoIssuesQuery`)
- Modify (generated): `apps/web/src/types/sanity.types.generated.ts`
- Modify: `apps/web/src/lib/sanity/utils.ts` (`getDownloadFileUrl` accepts a projected asset)
- Create: `apps/web/src/app/verein/echo/_shared/utils.ts`
- Test: `apps/web/src/app/verein/echo/_shared/utils.test.ts`

**Interfaces:**

- Consumes: `meta` from `@/lib/sanity/queries`, `getDownloadFileUrl`, `getFileSize`, `urlForImageMax` from `@/lib/sanity/utils`.
- Produces:
  - Queries and their generated result types:
    - `echoOverviewPageQuery` → `EchoOverviewPageQueryResult` (`title`, `subtitle`, `intro`, `meta`)
    - `echoIssuesTotalQuery` → `EchoIssuesTotalQueryResult` (`number`)
    - `echoIssuesQuery` with `$start` and `$end` (exclusive) → `EchoIssuesQueryResult`; each entry has `_id`, `title`, `slug`, `releaseDate`, `intro`, `cover`, `pdf { originalFilename, size, url }`
    - `echoIssueQuery` with `$slug` → `EchoIssueQueryResult`, the card fields plus `meta`, `pages[] { _key, _type, asset }`, `pageSize { height, width }`
    - `echoIssueSlugsQuery` → `EchoIssueSlugsQueryResult` (`string[]`)
    - `sitemapEchoIssuesQuery` → `SitemapEchoIssuesQueryResult` (`{ slug, lastModified }[]`)
  - Helpers from `@/app/verein/echo/_shared/utils`:
    - `getIssueYear(releaseDate?: string | null): string`
    - `getPdfDownload(pdf?: EchoPdf | null): { href: string; size: string } | undefined`
    - `getFlipbookPages(pages: readonly EchoPageImage[]): FlipbookPage[]`
    - `getCoverPage(cover?: EchoPageImage | null, title?: string | null): FlipbookPage | undefined`
    - `getPageSize(pageSize?: { height?: number | null; width?: number | null } | null): { height: number; width: number }`
  - `FlipbookPage { alt: string; src: string; srcSet: string }`, exported from `@/components/with-logic/flipbook/types` (created here, used by Task 3)

- [ ] **Step 1: Add the shared filter and the queries**

In `apps/web/src/lib/sanity/queries/index.ts`, before the export block:

```ts
/**
 * A TSG-Echo issue the website shows: its pages are rendered and it has a slug. Pending, failed and
 * never-rendered issues stay off the site, which also hides the pages a failed run keeps from the
 * previous PDF.
 */
const finishedEchoIssue = /* groq */ `_type == 'echo.issue' && render.status == 'done' && defined(slug.current) && count(pages) > 0`;
```

Add `finishedEchoIssue` to the export block, in alphabetical position.

`apps/web/src/lib/sanity/queries/pages/echo.ts`:

```ts
import { defineQuery } from 'next-sanity';

import { finishedEchoIssue, meta } from '@/lib/sanity/queries';

/** What a card, the issue page and its download button need of an issue. */
const echoIssueCard = /* groq */ `
	_id,
	title,
	"slug": slug.current,
	releaseDate,
	intro,
	"cover": pages[0] { _type, asset },
	"pdf": pdf.asset-> { originalFilename, size, url }
`;

/** The archive's own page: hero, intro and meta. */
export const echoOverviewPageQuery = defineQuery(`
	*[_type == 'echoOverview'][0] {
		title,
		subtitle,
		intro,
		${meta}
	}
`);

/** How many finished issues there are, for the pagination. */
export const echoIssuesTotalQuery = defineQuery(`count(*[${finishedEchoIssue}])`);

/** A slice of the finished issues, newest first. `$end` is exclusive. */
export const echoIssuesQuery = defineQuery(`
	*[${finishedEchoIssue}] | order(releaseDate desc) [$start...$end] {
		${echoIssueCard}
	}
`);

/** One finished issue with every page, for its own page. */
export const echoIssueQuery = defineQuery(`
	*[${finishedEchoIssue} && slug.current == $slug][0] {
		${echoIssueCard},
		${meta},
		"pages": pages[] { _key, _type, asset },
		"pageSize": pages[0].asset->metadata.dimensions { height, width }
	}
`);

/** The slugs of every finished issue, for `generateStaticParams`. */
export const echoIssueSlugsQuery = defineQuery(`*[${finishedEchoIssue}].slug.current`);
```

In `apps/web/src/lib/sanity/queries/sitemap.ts`, import `finishedEchoIssue` from `@/lib/sanity/queries` and add:

```ts
/**
 * Query to get every finished TSG-Echo issue for the sitemap
 *
 * @returns The slug and the last modification date of every finished issue
 */
const sitemapEchoIssuesQuery = defineQuery(`
	*[${finishedEchoIssue}] {
		"slug": slug.current,
		"lastModified": _updatedAt
	}
`);
```

Add `sitemapEchoIssuesQuery` to its export statement.

- [ ] **Step 2: Pin the shared filter with a test**

The GROQ filter itself only runs in Sanity. The test therefore pins that every query a visitor reaches goes through the one fragment, so no list can show an unfinished issue.

`apps/web/src/lib/sanity/queries/pages/echo.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import { finishedEchoIssue } from '@/lib/sanity/queries';
import { sitemapEchoIssuesQuery } from '@/lib/sanity/queries/sitemap';

import { echoIssueQuery, echoIssueSlugsQuery, echoIssuesQuery, echoIssuesTotalQuery } from './echo';

describe('tsg-echo queries', () => {
	// Review focus 2: a pending or failed issue, whose pages may still belong to the previous PDF,
	// must not reach any list, page or sitemap.
	it('only shows issues whose pages are rendered', () => {
		expect(finishedEchoIssue).toContain("render.status == 'done'");
	});

	it.each([
		['the total', echoIssuesTotalQuery],
		['the list', echoIssuesQuery],
		['the issue page', echoIssueQuery],
		['the static params', echoIssueSlugsQuery],
		['the sitemap', sitemapEchoIssuesQuery],
	])('filters %s through the shared rule', (_label, query) => {
		expect(query).toContain(finishedEchoIssue);
	});
});
```

Run: `pnpm --filter web exec vp test run src/lib/sanity/queries/pages/echo.test.ts` Expected: PASS. The queries exist from Step 1; the test guards the rule against later edits.

- [ ] **Step 3: Generate the types**

Run from the repository root: `pnpm run typegen:sanity && pnpm run format` Expected: `sanity.types.generated.ts` exports:

- `EchoOverviewPageQueryResult`
- `EchoIssuesTotalQueryResult`
- `EchoIssuesQueryResult`
- `EchoIssueQueryResult`
- `EchoIssueSlugsQueryResult`
- `SitemapEchoIssuesQueryResult`

The schema did not change, so `extract-types` is not needed.

- [ ] **Step 4: Let `getDownloadFileUrl` take a projected asset**

The queries project only `url`, `originalFilename` and `size`, while `getDownloadFileUrl` wants a full `SanityFileAsset` although it reads just two fields. In `apps/web/src/lib/sanity/utils.ts`, change its parameter to:

```ts
function getDownloadFileUrl(
	downloadAsset?: null | Pick<SanityFileAsset, 'originalFilename' | 'url'>,
): string {
```

Run: `pnpm --filter web run typecheck` Expected: no errors. The existing callers pass full assets, which still satisfy the `Pick`.

- [ ] **Step 5: Write the failing tests for the issue helpers**

Create `apps/web/src/components/with-logic/flipbook/types.ts`:

```ts
/** One page of a flipbook, with the image widths the Sanity CDN delivers. */
interface FlipbookPage {
	alt: string;
	src: string;
	srcSet: string;
}

export type { FlipbookPage };
```

`apps/web/src/app/verein/echo/_shared/utils.test.ts`:

```ts
import { describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';

import { getCoverPage, getFlipbookPages, getIssueYear, getPageSize, getPdfDownload } from './utils';

// `@sanity/image-url` reads the project and the dataset from the client's config to build a URL.
vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
	} as unknown as typeof client,
}));

function pageImage(hash: string) {
	return {
		_key: hash,
		_type: 'image' as const,
		asset: { _ref: `image-${hash}-1414x2000-jpg`, _type: 'reference' as const },
	};
}

describe('tsg-echo issue helpers', () => {
	it('reads the year from the release date', () => {
		expect(getIssueYear('2025-04-01')).toBe('2025');
	});

	it('has no year without a release date', () => {
		expect(getIssueYear(null)).toBe('');
	});

	it('offers the PDF as a download with its size', () => {
		expect(
			getPdfDownload({
				originalFilename: 'tsg-echo-2025.pdf',
				size: 12_582_912,
				url: 'https://cdn.sanity.io/files/p/d/abc.pdf',
			}),
		).toStrictEqual({
			href: 'https://cdn.sanity.io/files/p/d/abc.pdf?dl=tsg-echo-2025.pdf',
			size: '12.00 MB',
		});
	});

	// Review focus 5: a missing asset hides the button instead of linking to `#!`.
	it.each([
		['no PDF', null],
		['no url', { originalFilename: 'x.pdf', size: 1, url: null }],
		['no file name', { originalFilename: null, size: 1, url: 'https://cdn.sanity.io/x.pdf' }],
	])('offers no download for %s', (_label, pdf) => {
		expect(getPdfDownload(pdf)).toBeUndefined();
	});

	it('names every page after its position', () => {
		const pages = getFlipbookPages([pageImage('a'), pageImage('b'), pageImage('c')]);

		expect(pages.map((page) => page.alt)).toStrictEqual([
			'Seite 1 von 3',
			'Seite 2 von 3',
			'Seite 3 von 3',
		]);
	});

	it('offers every page in three widths and falls back to the largest', () => {
		const [page] = getFlipbookPages([pageImage('a')]);

		expect(page?.srcSet.split(', ').map((entry) => entry.split(' ')[1])).toStrictEqual([
			'800w',
			'1200w',
			'1600w',
		]);
		expect(page?.src).toContain('w=1600');
	});

	it('names the cover after the issue', () => {
		expect(getCoverPage(pageImage('a'), 'TSG ECHO 2025')?.alt).toBe('Titelseite von TSG ECHO 2025');
	});

	it('has no cover without an image', () => {
		expect(getCoverPage(null, 'TSG ECHO 2025')).toBeUndefined();
	});

	it('takes the page size from the first page', () => {
		expect(getPageSize({ height: 2000, width: 1414 })).toStrictEqual({ height: 2000, width: 1414 });
	});

	// Review focus 5: an image without metadata still gets a book of a sensible shape.
	it('falls back to an A4 page without dimensions', () => {
		expect(getPageSize(null)).toStrictEqual({ height: 2000, width: 1414 });
	});
});
```

Run: `pnpm --filter web exec vp test run src/app/verein/echo/_shared/utils.test.ts` Expected: FAIL, because `./utils` does not exist.

- [ ] **Step 6: Implement the helpers**

`apps/web/src/app/verein/echo/_shared/utils.ts`:

```ts
import type { FlipbookPage } from '@/components/with-logic/flipbook/types';
import { getDownloadFileUrl, getFileSize, urlForImageMax } from '@/lib/sanity/utils';
import type { EchoIssueQueryResult } from '@/types/sanity.types';

const YEAR_LENGTH = 4;

/** The widths the Sanity CDN renders a page in; the browser picks one through `srcSet`. */
const PAGE_WIDTHS = [800, 1200, 1600] as const;
const LARGEST_PAGE_WIDTH = 1600;

/** A4 at the render route's 2000 px on the long edge, for an image without metadata. */
const A4_PAGE = { height: 2000, width: 1414 };

/**
 * The year an issue appeared in, for its label.
 *
 * @param releaseDate - The release date as `YYYY-MM-DD`.
 * @returns The year, or an empty string without a date.
 */
function getIssueYear(releaseDate?: string | null): string {
	return releaseDate?.slice(0, YEAR_LENGTH) ?? '';
}

/**
 * The download of an issue's PDF, with its size for the button label.
 *
 * @param pdf - The projected PDF asset.
 * @returns The link and the size, or `undefined` when the asset cannot be downloaded.
 */
function getPdfDownload(pdf?: EchoPdf | null): PdfDownload | undefined {
	if (!pdf?.url || !pdf.originalFilename) {
		return undefined;
	}
	return { href: getDownloadFileUrl(pdf), size: getFileSize(pdf.size ?? undefined) };
}

/**
 * One page image in the three widths the CDN delivers.
 *
 * @param image - The page image.
 * @param alt - Its alternative text.
 * @returns The flipbook page, or `undefined` for an image without an asset.
 */
function toFlipbookPage(image: EchoPageImage, alt: string): FlipbookPage | undefined {
	const src = urlForImageMax(image, LARGEST_PAGE_WIDTH);
	if (!src) {
		return undefined;
	}
	const srcSet = PAGE_WIDTHS.map((width) => `${urlForImageMax(image, width)} ${width}w`).join(', ');
	return { alt, src, srcSet };
}

/**
 * Every page of an issue, named after its position.
 *
 * @param pages - The rendered page images, cover first.
 * @returns The flipbook pages.
 */
function getFlipbookPages(pages: readonly EchoPageImage[]): FlipbookPage[] {
	return pages.flatMap((image, index) => {
		const page = toFlipbookPage(image, `Seite ${index + 1} von ${pages.length}`);
		return page ? [page] : [];
	});
}

/**
 * The cover of an issue, for the server-rendered stand-in of the flipbook.
 *
 * @param cover - The first page image.
 * @param title - The issue's title.
 * @returns The cover, or `undefined` without an image.
 */
function getCoverPage(
	cover?: EchoPageImage | null,
	title?: string | null,
): FlipbookPage | undefined {
	return cover ? toFlipbookPage(cover, `Titelseite von ${title ?? 'TSG-Echo'}`) : undefined;
}

/**
 * The page size the flipbook lays out with, from the first page's metadata.
 *
 * @param pageSize - The dimensions of the first page image.
 * @returns Width and height in pixels.
 */
function getPageSize(pageSize?: { height?: number | null; width?: number | null } | null): {
	height: number;
	width: number;
} {
	return pageSize?.height && pageSize.width
		? { height: pageSize.height, width: pageSize.width }
		: A4_PAGE;
}

type EchoIssue = NonNullable<EchoIssueQueryResult>;
type EchoPageImage = NonNullable<EchoIssue['pages']>[number];
type EchoPdf = NonNullable<EchoIssue['pdf']>;

interface PdfDownload {
	href: string;
	size: string;
}

export { getCoverPage, getFlipbookPages, getIssueYear, getPageSize, getPdfDownload };
export type { EchoPageImage, EchoPdf, PdfDownload };
```

If `urlForImageMax` does not accept `EchoPageImage` because the projected type lacks a field, widen its parameter the same way as in Step 4. Do not cast. Do the same if the test's `pageImage` fixture does not satisfy `EchoPageImage`.

- [ ] **Step 7: Run the tests and the checks**

Run: `pnpm --filter web exec vp test run src/app/verein/echo/_shared src/lib/sanity` Expected: PASS.

Run: `pnpm --filter web run typecheck && pnpm --filter web run lint` Expected: no errors, 0 warnings.

- [ ] **Step 8: Commit**

`feat(web): add tsg-echo queries and issue helpers`, including the generated types.

---

### Task 3: Flipbook

**Files:**

- Modify: `pnpm-workspace.yaml` and `apps/web/package.json` (`@gullabs/react-flipbook`, written by `pnpm add`)
- Create: `apps/web/src/components/with-logic/flipbook/describe-spread.ts`
- Test: `apps/web/src/components/with-logic/flipbook/describe-spread.test.ts`
- Create: `apps/web/src/components/with-logic/flipbook/flipbook.tsx`
- Test: `apps/web/src/components/with-logic/flipbook/flipbook.test.tsx`
- Create: `apps/web/src/components/with-logic/flipbook/flipbook-lazy.tsx`
- Test: `apps/web/src/components/with-logic/flipbook/flipbook-lazy.test.tsx`

The location deviates from the spec's `components/ui/flipbook/`. The component holds state, and `apps/web/AGENTS.md` allows `'use client'` only below `with-logic`. A library swap still stays inside this folder.

**Interfaces:**

- Consumes: `FlipbookPage` (Task 2), `ArrowButton` from `@/components/ui/arrow-button`.
- Produces:
  - `describeSpread(visiblePages: readonly number[], pageCount: number): string`
  - `Flipbook(props: FlipbookProps)` with `FlipbookProps { label: string; pageHeight: number; pageWidth: number; pages: readonly FlipbookPage[] }`
  - `FlipbookLazy(props: FlipbookProps & { cover?: FlipbookPage })`. This is the only one a page imports.

- [ ] **Step 1: Add the dependency**

Run: `pnpm --filter web add @gullabs/react-flipbook@^3.2.2`

Check the result:

- `catalogMode: strict` writes `"@gullabs/react-flipbook": ^3.2.2` into the catalog.
- Move the entry into the `# Next.js app` group of `pnpm-workspace.yaml` in alphabetical order, with double quotes.
- `apps/web/package.json` references `catalog:`.
- `pnpm install --frozen-lockfile --ignore-scripts` passes.
- The package is MIT-licensed; its engine `@gullabs/flipbook-core` is MPL-2.0 and is used unchanged (WEB-58).

- [ ] **Step 2: Write the failing tests for the indicator**

`apps/web/src/components/with-logic/flipbook/describe-spread.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import { describeSpread } from './describe-spread';

describe('the page indicator', () => {
	it('names a single leaf', () => {
		expect(describeSpread([0], 52)).toBe('Seite 1 von 52');
	});

	it('names both leaves of a spread with an en dash', () => {
		expect(describeSpread([1, 2], 52)).toBe('Seiten 2–3 von 52');
	});

	// Review focus 4: a spread the engine reports with one leaf twice is still one page.
	it('never names a range of one page', () => {
		expect(describeSpread([4, 4], 5)).toBe('Seite 5 von 5');
	});

	it('says nothing before the book has loaded', () => {
		expect(describeSpread([], 0)).toBe('');
	});
});
```

Run: `pnpm --filter web exec vp test run src/components/with-logic/flipbook/describe-spread.test.ts` Expected: FAIL, because the module does not exist.

- [ ] **Step 3: Implement the indicator**

`apps/web/src/components/with-logic/flipbook/describe-spread.ts`:

```ts
/**
 * Describes what is on screen, e.g. `Seite 1 von 52` for the cover or `Seiten 2–3 von 52` for a spread.
 *
 * @param visiblePages - The 0-based leaf indices on screen, in reading order.
 * @param pageCount - How many leaves the book has.
 * @returns The text of the indicator, empty before the book has loaded.
 */
function describeSpread(visiblePages: readonly number[], pageCount: number): string {
	const first = visiblePages[0];
	const last = visiblePages.at(-1);
	if (first === undefined || last === undefined || pageCount === 0) {
		return '';
	}
	return first === last
		? `Seite ${first + 1} von ${pageCount}`
		: `Seiten ${first + 1}–${last + 1} von ${pageCount}`;
}

export { describeSpread };
```

Run the test again. Expected: PASS.

- [ ] **Step 4: Write the failing tests for the flipbook**

`apps/web/src/components/with-logic/flipbook/flipbook.test.tsx`:

```tsx
import type { BookSnapshot, FlipBookHandle, HTMLFlipBookProps } from '@gullabs/react-flipbook';
import { act } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { Flipbook } from './flipbook';

const book = vi.hoisted(() => ({
	flipNext: vi.fn(() => true),
	flipPrev: vi.fn(() => true),
	props: {} as Partial<HTMLFlipBookProps>,
}));

// The engine draws on a canvas-like layout jsdom cannot measure. The fake records the props the
// wrapper hands it, renders the leaves, and exposes the two turns the wrapper's buttons call.
vi.mock(import('@gullabs/react-flipbook'), () => {
	const FakeFlipBook = forwardRef<FlipBookHandle | null, HTMLFlipBookProps>(
		function FakeFlipBook(props, ref) {
			book.props = props;
			useImperativeHandle(ref, () => book as unknown as FlipBookHandle);
			return <div>{props.children}</div>;
		},
	);
	return { default: FakeFlipBook } as never;
});

const PAGES = [1, 2, 3].map((n) => ({
	alt: `Seite ${n} von 3`,
	src: `https://cdn.sanity.io/images/p/d/page-${n}.jpg?w=1600`,
	srcSet: `https://cdn.sanity.io/images/p/d/page-${n}.jpg?w=800 800w`,
}));

function snapshot(visiblePages: number[]): BookSnapshot {
	return { orientation: 'landscape', page: visiblePages[0] ?? 0, pageCount: 3, visiblePages };
}

function renderBook() {
	return renderWithUser(
		<Flipbook
			label="TSG ECHO 2025 zum Durchblättern"
			pageHeight={2000}
			pageWidth={1414}
			pages={PAGES}
		/>,
	);
}

describe('the flipbook', () => {
	it('shows every page under its position', () => {
		const { getAllByRole } = renderBook();

		expect(getAllByRole('img').map((image) => image.getAttribute('alt'))).toStrictEqual([
			'Seite 1 von 3',
			'Seite 2 von 3',
			'Seite 3 von 3',
		]);
	});

	it('names the book for assistive technology', () => {
		renderBook();

		expect(book.props).toMatchObject({
			'aria-label': 'TSG ECHO 2025 zum Durchblättern',
			roleDescription: 'Heft',
		});
	});

	it('turns without animation when the reader asked for reduced motion', () => {
		renderBook();

		expect(book.props.respectReducedMotion).toBe(true);
	});

	it('lets the arrow keys turn the page', () => {
		renderBook();

		expect(book.props.useKeyboard).toBe(true);
	});

	it('mounts only the spreads around the current one', () => {
		renderBook();

		expect(book.props.lazyRadius).toBe(2);
	});

	// Review focus 4: at the cover there is no way back, and the indicator names one page.
	it('starts at the cover with the way back blocked', () => {
		const { getByRole, getByText } = renderBook();
		act(() => book.props.onLoaded?.(snapshot([0])));

		expect(getByText('Seite 1 von 3')).toHaveProperty('ariaLive', 'polite');
		expect(getByRole('button', { name: 'Vorherige Seite' })).toHaveProperty('disabled', true);
		expect(getByRole('button', { name: 'Nächste Seite' })).toHaveProperty('disabled', false);
	});

	it('follows the book to the last spread and blocks the way forward', () => {
		const { getByRole, getByText } = renderBook();
		act(() => book.props.onPageChange?.(snapshot([1, 2])));

		expect(getByText('Seiten 2–3 von 3')).toBeDefined();
		expect(getByRole('button', { name: 'Nächste Seite' })).toHaveProperty('disabled', true);
		expect(getByRole('button', { name: 'Vorherige Seite' })).toHaveProperty('disabled', false);
	});

	it('turns the book with its own buttons', async () => {
		const { getByRole, user } = renderBook();
		act(() => book.props.onLoaded?.(snapshot([0])));

		await user.click(getByRole('button', { name: 'Nächste Seite' }));

		expect(book.flipNext).toHaveBeenCalledTimes(1);
	});
});
```

`setup-dom.ts` resets every mock after each case, so the `vi.fn()`s start fresh.

If `getByText(...).ariaLive` is `undefined` in jsdom, assert `getAttribute('aria-live')` instead.

Run: `pnpm --filter web exec vp test run src/components/with-logic/flipbook/flipbook.test.tsx` Expected: FAIL, because `./flipbook` does not exist.

- [ ] **Step 5: Implement the flipbook**

`apps/web/src/components/with-logic/flipbook/flipbook.tsx`:

```tsx
'use client';

import HTMLFlipBook from '@gullabs/react-flipbook';
import type { BookSnapshot, FlipBookHandle } from '@gullabs/react-flipbook';
import { useMemo, useRef, useState } from 'react';

import { ArrowButton } from '@/components/ui/arrow-button';

import { describeSpread } from './describe-spread';
import type { FlipbookPage } from './types';

/** Mount only the spreads around the current one; a 52-page scan would otherwise load every page. */
const LAZY_RADIUS = 2;

/** The narrowest a page gets before the book stops shrinking. */
const MIN_PAGE_WIDTH = 240;

/** A page is half the viewport next to its neighbour, the whole viewport on its own. */
const PAGE_SIZES = '(min-width: 48rem) 50vw, 100vw';

/**
 * A TSG-Echo issue to leaf through: a spread from `md` up, a single page on a phone. The book brings
 * keyboard turning and reduced motion; the buttons and the indicator below it are ours, because a
 * screen reader in browse mode never receives the arrow keys.
 *
 * @param props - The pages, their size and the book's accessible name.
 * @returns The book with its controls.
 */
function Flipbook({ label, pageHeight, pageWidth, pages }: Readonly<FlipbookProps>) {
	const book = useRef<FlipBookHandle | null>(null);
	const [spread, setSpread] = useState<Spread>({ pageCount: pages.length, visiblePages: [0] });

	// The engine tears the book down when its children change identity, so the leaves are built once.
	const leaves = useMemo(
		() =>
			pages.map((page) => (
				<div key={page.src}>
					<div className="size-full bg-white">
						{/* The Sanity CDN delivers every width; the Next.js optimizer would re-encode each page. */}
						{/* oxlint-disable-next-line nextjs/no-img-element -- see above */}
						<img
							alt={page.alt}
							className="size-full object-contain"
							decoding="async"
							loading="lazy"
							sizes={PAGE_SIZES}
							src={page.src}
							srcSet={page.srcSet}
						/>
					</div>
				</div>
			)),
		[pages],
	);

	const syncSpread = (snapshot: BookSnapshot): void => {
		setSpread({ pageCount: snapshot.pageCount, visiblePages: snapshot.visiblePages });
	};
	const showPrevious = (): void => {
		book.current?.flipPrev();
	};
	const showNext = (): void => {
		book.current?.flipNext();
	};

	const first = spread.visiblePages[0] ?? 0;
	const last = spread.visiblePages.at(-1) ?? first;
	const isAtStart = first === 0;
	const isAtEnd = last >= spread.pageCount - 1;

	return (
		<>
			<div className="aspect-(--echo-page) w-full md:aspect-(--echo-spread)">
				<HTMLFlipBook
					aria-label={label}
					autoSize
					controls="none"
					hardCovers
					height={pageHeight}
					lazyRadius={LAZY_RADIUS}
					liveRegion={false}
					maxWidth={pageWidth}
					minWidth={MIN_PAGE_WIDTH}
					onLoaded={syncSpread}
					onPageChange={syncSpread}
					ref={book}
					respectReducedMotion
					roleDescription="Heft"
					sizing="responsive"
					useKeyboard
					usePortrait
					width={pageWidth}
				>
					{leaves}
				</HTMLFlipBook>
			</div>
			<div className="flex h-12 items-center justify-center gap-4">
				<ArrowButton
					aria-label="Vorherige Seite"
					data-disabled={isAtStart}
					direction="left"
					disabled={isAtStart}
					onClick={showPrevious}
					variant="ghost"
				/>
				<p aria-live="polite" className="min-w-40 text-center">
					{describeSpread(spread.visiblePages, spread.pageCount)}
				</p>
				<ArrowButton
					aria-label="Nächste Seite"
					data-disabled={isAtEnd}
					direction="right"
					disabled={isAtEnd}
					onClick={showNext}
					variant="secondary"
				/>
			</div>
		</>
	);
}

interface FlipbookProps {
	/** The book's accessible name, e.g. `TSG ECHO 2025 zum Durchblättern`. */
	label: string;
	pageHeight: number;
	pageWidth: number;
	pages: readonly FlipbookPage[];
}

interface Spread {
	pageCount: number;
	visiblePages: number[];
}

export { Flipbook };
export type { FlipbookProps };
```

If `react-perf` flags the arrow handlers because they are recreated on every render, wrap them in `useCallback`. The React Compiler would memoise them anyway, and the lint stays at 0 warnings.

Run the test again. Expected: PASS.

- [ ] **Step 6: Write the failing tests for the lazy wrapper**

`apps/web/src/components/with-logic/flipbook/flipbook-lazy.test.tsx`:

```tsx
import type { HTMLFlipBookProps } from '@gullabs/react-flipbook';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { FlipbookLazy } from './flipbook-lazy';

vi.mock(
	import('@gullabs/react-flipbook'),
	() =>
		({
			default: (props: HTMLFlipBookProps) => <div>{props.children}</div>,
		}) as never,
);

const COVER = {
	alt: 'Titelseite von TSG ECHO 2025',
	src: 'https://cdn.sanity.io/c.jpg',
	srcSet: '',
};
const PAGES = [{ alt: 'Seite 1 von 1', src: 'https://cdn.sanity.io/p.jpg', srcSet: '' }];

function lazyBook() {
	return (
		<FlipbookLazy
			cover={COVER}
			label="TSG ECHO 2025 zum Durchblättern"
			pageHeight={2000}
			pageWidth={1414}
			pages={PAGES}
		/>
	);
}

describe('the lazily loaded flipbook', () => {
	// Review focus 5: without JavaScript a reader still sees the cover; the PDF sits next to it.
	it('renders only the cover on the server', () => {
		const html = renderToString(lazyBook());

		expect(html).toContain('alt="Titelseite von TSG ECHO 2025"');
		expect(html).not.toContain('Nächste Seite');
	});

	it('replaces the cover with the book in the browser', async () => {
		const { findByRole, queryByAltText } = renderWithUser(lazyBook());

		await findByRole('button', { name: 'Nächste Seite' });

		expect(queryByAltText('Titelseite von TSG ECHO 2025')).toBeNull();
	});

	it('reserves the shape of a page and of a spread before the book loads', () => {
		const { container } = renderWithUser(lazyBook());

		expect(container.firstElementChild?.getAttribute('style')).toContain(
			'--echo-page: 1414 / 2000',
		);
		expect(container.firstElementChild?.getAttribute('style')).toContain(
			'--echo-spread: 2828 / 2000',
		);
	});
});
```

Run: `pnpm --filter web exec vp test run src/components/with-logic/flipbook/flipbook-lazy.test.tsx` Expected: FAIL, because `./flipbook-lazy` does not exist.

- [ ] **Step 7: Implement the lazy wrapper**

`apps/web/src/components/with-logic/flipbook/flipbook-lazy.tsx`:

```tsx
'use client';

import { lazy, Suspense, useMemo, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';

import type { FlipbookProps } from './flipbook';
import type { FlipbookPage } from './types';

// The library only reaches the browser, in its own chunk, on the issue page.
const Flipbook = lazy(async () =>
	import('./flipbook').then((module) => ({ default: module.Flipbook })),
);

/** Nothing ever changes, so there is nothing to subscribe to. */
function subscribe(): () => void {
	return unsubscribe;
}

function unsubscribe(): void {
	// Nothing to undo.
}

function isBrowser(): boolean {
	return true;
}

function isServer(): boolean {
	return false;
}

/**
 * The flipbook, loaded in the browser only. The server and the hydration pass render the cover in
 * the box the book will take, so nothing moves when the book arrives and a reader without
 * JavaScript still sees the issue. `next/dynamic` would do the loading too, but its placeholder
 * cannot receive the cover.
 *
 * @param props - The book's props and its cover.
 * @returns The cover, then the book.
 */
function FlipbookLazy({ cover, ...props }: Readonly<FlipbookLazyProps>) {
	const isClient = useSyncExternalStore(subscribe, isBrowser, isServer);
	const style = useMemo(
		() =>
			({
				'--echo-page': `${props.pageWidth} / ${props.pageHeight}`,
				'--echo-spread': `${props.pageWidth * 2} / ${props.pageHeight}`,
			}) as CSSProperties,
		[props.pageHeight, props.pageWidth],
	);

	const placeholder = (
		<>
			<div className="flex aspect-(--echo-page) w-full justify-center md:aspect-(--echo-spread)">
				{cover && (
					// The same CDN image the book shows first; see `flipbook.tsx` for why it is no `next/image`.
					// oxlint-disable-next-line nextjs/no-img-element -- see above
					<img
						alt={cover.alt}
						className="h-full object-contain"
						src={cover.src}
						srcSet={cover.srcSet}
					/>
				)}
			</div>
			<div className="h-12" />
		</>
	);

	return (
		<div className="flex flex-col gap-6" style={style}>
			{isClient ? (
				<Suspense fallback={placeholder}>
					<Flipbook {...props} />
				</Suspense>
			) : (
				placeholder
			)}
		</div>
	);
}

interface FlipbookLazyProps extends FlipbookProps {
	cover?: FlipbookPage;
}

export { FlipbookLazy };
```

The cast to `CSSProperties` is how React types custom properties. If `typescript/no-unsafe-type-assertion` flags it, type the object as `CSSProperties & Record<'--echo-page' | '--echo-spread', string>` instead of casting.

Run both flipbook tests. Expected: PASS.

- [ ] **Step 8: Run the checks**

Run: `pnpm --filter web exec vp test run src/components/with-logic/flipbook && pnpm --filter web run typecheck && pnpm --filter web run lint` Expected: PASS, no errors, 0 warnings.

- [ ] **Step 9: Commit**

`feat(web): add the tsg-echo flipbook`, including `pnpm-workspace.yaml`, `apps/web/package.json` and `pnpm-lock.yaml`.

---

### Task 4: Archive page

**Files:**

- Create: `apps/web/src/app/verein/echo/_shared/hero.ts`
- Create: `apps/web/src/app/verein/echo/page.tsx`
- Test: `apps/web/src/app/verein/echo/page.test.ts`
- Create: `apps/web/src/app/verein/echo/_sections/latest-issue.tsx`
- Test: `apps/web/src/app/verein/echo/_sections/latest-issue.test.tsx`
- Create: `apps/web/src/app/verein/echo/_sections/issue-grid.tsx`
- Test: `apps/web/src/app/verein/echo/_sections/issue-grid.test.tsx`

**Interfaces:**

- Consumes:
  - Task 1: `getPageNumber`, `getPaginatedPath`, `ECHO_OVERVIEW_PATH`, `getEchoIssuePath`
  - Task 2: `echoOverviewPageQuery`, `echoIssuesTotalQuery`, `echoIssuesQuery` and their result types; `getIssueYear`, `getPdfDownload`
- Produces:
  - route `/verein/echo` (default export `EchoOverviewPage`, plus `generateMetadata`)
  - `LatestIssue({ issue })` and `IssueGrid({ currentPage, hasNextPage, issues })`, with `issue: EchoIssuesQueryResult[number]`
  - `ECHO_HERO_IMAGE` from `./_shared/hero`, used by both TSG-Echo pages

- [ ] **Step 1: Write the failing tests for the sections**

`apps/web/src/app/verein/echo/_sections/latest-issue.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';
import type { EchoIssuesQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../../test-utils/render';
import { LatestIssue } from './latest-issue';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
	} as unknown as typeof client,
}));

const ISSUE = {
	_id: 'echo-2025',
	cover: { _type: 'image', asset: { _ref: 'image-abc-1414x2000-jpg', _type: 'reference' } },
	intro: 'Ein Rückblick auf das Vereinsjahr.',
	pdf: {
		originalFilename: 'tsg-echo-2025.pdf',
		size: 1_048_576,
		url: 'https://cdn.sanity.io/x.pdf',
	},
	releaseDate: '2025-04-01',
	slug: 'tsg-echo-2025',
	title: 'TSG ECHO 2025',
} as unknown as EchoIssuesQueryResult[number];

describe('the newest issue', () => {
	it('names the issue as the newest one with its year', () => {
		const { getByText } = renderWithUser(<LatestIssue issue={ISSUE} />);

		expect(getByText('Neueste Ausgabe · 2025')).toBeDefined();
	});

	it('leads to the issue from its title, its cover and its button', () => {
		const { getAllByRole } = renderWithUser(<LatestIssue issue={ISSUE} />);

		const hrefs = getAllByRole('link').map((link) => link.getAttribute('href'));

		expect(hrefs.filter((href) => href === '/verein/echo/tsg-echo-2025')).toHaveLength(3);
	});

	it('offers the PDF with its size', () => {
		const { getByRole } = renderWithUser(<LatestIssue issue={ISSUE} />);

		expect(getByRole('link', { name: 'PDF herunterladen (1.00 MB)' }).getAttribute('href')).toBe(
			'https://cdn.sanity.io/x.pdf?dl=tsg-echo-2025.pdf',
		);
	});

	it('describes its cover', () => {
		const { getByAltText } = renderWithUser(<LatestIssue issue={ISSUE} />);

		expect(getByAltText('Titelseite von TSG ECHO 2025')).toBeDefined();
	});

	// Review focus 5.
	it('offers no download without a PDF', () => {
		const { queryByRole } = renderWithUser(<LatestIssue issue={{ ...ISSUE, pdf: null }} />);

		expect(queryByRole('link', { name: /PDF herunterladen/u })).toBeNull();
	});
});
```

`apps/web/src/app/verein/echo/_sections/issue-grid.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';
import type { EchoIssuesQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../../test-utils/render';
import { IssueGrid } from './issue-grid';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
	} as unknown as typeof client,
}));

function issue(year: number) {
	return {
		_id: `echo-${year}`,
		cover: { _type: 'image', asset: { _ref: 'image-abc-1414x2000-jpg', _type: 'reference' } },
		intro: null,
		pdf: null,
		releaseDate: `${year}-04-01`,
		slug: `tsg-echo-${year}`,
		title: `TSG ECHO ${year}`,
	} as unknown as EchoIssuesQueryResult[number];
}

describe('the issue grid', () => {
	it('lists every issue with its year, linked to its page', () => {
		const { getByRole, getByText } = renderWithUser(
			<IssueGrid currentPage={1} issues={[issue(2012), issue(2011)]} />,
		);

		expect(getByRole('heading', { name: 'Alle Ausgaben' })).toBeDefined();
		expect(getByRole('link', { name: /TSG ECHO 2012/u }).getAttribute('href')).toBe(
			'/verein/echo/tsg-echo-2012',
		);
		expect(getByText('2011')).toBeDefined();
	});

	it('needs no pagination for a single page', () => {
		const { queryByRole } = renderWithUser(<IssueGrid currentPage={1} issues={[issue(2012)]} />);

		expect(queryByRole('link', { name: 'Weiter' })).toBeNull();
	});

	it('leads to the next page when there is one', () => {
		const { getByRole } = renderWithUser(
			<IssueGrid currentPage={1} hasNextPage issues={[issue(2012)]} />,
		);

		expect(getByRole('link', { name: 'Weiter' }).getAttribute('href')).toBe('?seite=2');
	});
});
```

The arrow links of `ArrowButtonGroup` are named "Zurück" and "Weiter". If the cover link and the title link both match `/TSG ECHO 2012/u`, use `getAllByRole(...)[0]` and assert that every match has the same `href`.

Run: `pnpm --filter web exec vp test run src/app/verein/echo/_sections` Expected: FAIL, because the sections do not exist.

- [ ] **Step 2: Implement the sections**

`apps/web/src/app/verein/echo/_sections/latest-issue.tsx`:

```tsx
import Image from 'next/image';
import Link from 'next/link';

import { ButtonLink } from '@/components/ui/button';
import { urlForImageMax } from '@/lib/sanity/utils';
import type { EchoIssuesQueryResult } from '@/types/sanity.types';
import { getEchoIssuePath } from '@/utils/links';

import { getIssueYear, getPdfDownload } from '../_shared/utils';

const COVER_WIDTH = 800;

/**
 * The newest issue as a wide card: a large cover, its intro, and the ways to read it.
 *
 * @param props - The issue.
 * @returns The card.
 */
function LatestIssue({ issue }: Readonly<LatestIssueProps>) {
	const href = getEchoIssuePath(issue.slug);
	const cover = urlForImageMax(issue.cover, COVER_WIDTH);
	const download = getPdfDownload(issue.pdf);

	return (
		<article className="mt-10 grid gap-6 rounded-xl bg-background md:mt-16 md:grid-cols-[2fr_3fr] md:gap-12">
			{cover && (
				<Link className="relative block aspect-[1/1.414] overflow-hidden rounded-xl" href={href}>
					{/* The LCP element of the page. */}
					<Image
						alt={`Titelseite von ${issue.title}`}
						className="object-cover"
						fill
						preload
						sizes="(min-width: 48rem) 40vw, 100vw"
						src={cover}
					/>
				</Link>
			)}

			<div className="flex flex-col justify-center gap-4">
				<p className="text-sm uppercase md:text-lg">
					Neueste Ausgabe · {getIssueYear(issue.releaseDate)}
				</p>
				<h2 className="text-3xl font-bold md:text-5xl">
					<Link href={href}>{issue.title}</Link>
				</h2>
				{issue.intro && <p className="line-clamp-4 md:text-xl">{issue.intro}</p>}
				<div className="flex flex-wrap gap-4">
					<ButtonLink render={<Link href={href} />}>Durchblättern</ButtonLink>
					{download && (
						<ButtonLink download href={download.href} variant="secondary">
							PDF herunterladen ({download.size})
						</ButtonLink>
					)}
				</div>
			</div>
		</article>
	);
}

interface LatestIssueProps {
	issue: EchoIssuesQueryResult[number];
}

export { LatestIssue };
```

`apps/web/src/app/verein/echo/_sections/issue-grid.tsx`:

```tsx
import Image from 'next/image';
import Link from 'next/link';

import { ArrowButtonGroup } from '@/components/ui/arrow-button';
import { urlForImageMax } from '@/lib/sanity/utils';
import type { EchoIssuesQueryResult } from '@/types/sanity.types';
import { getEchoIssuePath } from '@/utils/links';

import { getIssueYear } from '../_shared/utils';

const COVER_WIDTH = 600;

/**
 * One issue in the grid: its cover, title and year, all of it a link to the issue.
 *
 * @param props - The issue.
 * @returns The card.
 */
function IssueCard({ issue }: Readonly<{ issue: EchoIssue }>) {
	const cover = urlForImageMax(issue.cover, COVER_WIDTH);

	return (
		<Link className="group flex flex-col gap-3" href={getEchoIssuePath(issue.slug)}>
			<div className="relative aspect-[1/1.414] overflow-hidden rounded-xl bg-background">
				{cover && (
					<Image
						alt={`Titelseite von ${issue.title}`}
						className="object-cover duration-500 group-hover:scale-105"
						fill
						sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw"
						src={cover}
					/>
				)}
			</div>
			<h3 className="text-lg font-bold md:text-xl">{issue.title}</h3>
			<p className="text-sm md:text-base">{getIssueYear(issue.releaseDate)}</p>
		</Link>
	);
}

/**
 * Every issue but the newest, as covers in a grid, with the archive's pagination.
 *
 * @param props - The issues of this page and where the page sits.
 * @returns The grid.
 */
function IssueGrid({ currentPage, hasNextPage = false, issues }: Readonly<IssueGridProps>) {
	return (
		<section className="mt-10 md:mt-28">
			<h2 className="pb-8 text-xl md:pb-14 md:text-4xl">Alle Ausgaben</h2>
			<ul className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-10">
				{issues.map((issue) => (
					<li key={issue._id}>
						<IssueCard issue={issue} />
					</li>
				))}
			</ul>

			{(hasNextPage || currentPage > 1) && (
				<div className="mt-8 lg:mt-14">
					<ArrowButtonGroup
						hrefNext={`?seite=${currentPage + 1}`}
						hrefPrev={`?seite=${currentPage - 1}`}
						isDisabledNext={!hasNextPage}
						isDisabledPrevious={currentPage === 1}
						type="link"
					/>
				</div>
			)}
		</section>
	);
}

type EchoIssue = EchoIssuesQueryResult[number];

interface IssueGridProps {
	currentPage: number;
	hasNextPage?: boolean;
	issues: EchoIssuesQueryResult;
}

export { IssueGrid };
```

Run the section tests again. Expected: PASS.

- [ ] **Step 3: Write the failing tests for the page**

`apps/web/src/app/verein/echo/page.test.ts`:

```ts
import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import EchoOverviewPage, { generateMetadata } from '@/app/verein/echo/page';
import { Hero } from '@/components/section/hero';
import type { client } from '@/lib/sanity/client';
import {
	echoIssuesQuery,
	echoIssuesTotalQuery,
	echoOverviewPageQuery,
} from '@/lib/sanity/queries/pages/echo';

import { findElement, findElements } from '../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../test-utils/sanity-client-mock';
import { IssueGrid } from './_sections/issue-grid';
import { LatestIssue } from './_sections/latest-issue';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
		fetch: vi.fn(),
	} as unknown as typeof client,
}));

vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

const mockedFetch = clientFetchMock();

const PAGE = {
	intro: null,
	meta: null,
	subtitle: 'Vereinsgeschichte zum Durchblättern',
	title: 'TSG-Echo',
};

function issue(year: number) {
	return {
		_id: `echo-${year}`,
		releaseDate: `${year}-04-01`,
		slug: `tsg-echo-${year}`,
		title: `TSG ECHO ${year}`,
	};
}

interface Archive {
	issues?: ReturnType<typeof issue>[];
	page?: typeof PAGE | null;
}

/** Answers the page, the total and every slice of the newest-first list from one array. */
function mockArchive({ issues = [], page = PAGE }: Archive): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
		if (query === echoOverviewPageQuery) return page;
		if (query === echoIssuesTotalQuery) return issues.length;
		if (query === echoIssuesQuery) return issues.slice(Number(params?.start), Number(params?.end));
		throw new Error(`unexpected query: ${query}`);
	});
}

function props(seite?: string) {
	return {
		params: Promise.resolve({}),
		searchParams: Promise.resolve(seite ? { seite } : {}),
	} as never;
}

const YEARS = Array.from({ length: 20 }, (_, index) => 2025 - index);

describe('the tsg-echo archive', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	it('gives up without its page document', async () => {
		mockArchive({ page: null });

		await expect(EchoOverviewPage(props())).rejects.toThrow('NEXT_NOT_FOUND');
	});

	it('heads the page with its title and subtitle', async () => {
		mockArchive({});

		const hero = findElement(await EchoOverviewPage(props()), Hero);

		expect(hero?.props).toMatchObject({
			subTitle: 'Vereinsgeschichte zum Durchblättern',
			title: 'TSG-Echo',
		});
	});

	it('shows the newest issue as the wide card', async () => {
		mockArchive({ issues: YEARS.map(issue) });

		const latest = findElement(await EchoOverviewPage(props()), LatestIssue);

		expect(latest?.props.issue).toMatchObject({ title: 'TSG ECHO 2025' });
	});

	it('lists twelve further issues on the first page', async () => {
		mockArchive({ issues: YEARS.map(issue) });

		const grid = findElement(await EchoOverviewPage(props()), IssueGrid);

		expect(grid?.props.issues.map((entry) => entry.title)).toStrictEqual(
			YEARS.slice(1, 13).map((year) => `TSG ECHO ${year}`),
		);
		expect(grid?.props.hasNextPage).toBe(true);
	});

	it('continues with the remaining issues on the second page', async () => {
		mockArchive({ issues: YEARS.map(issue) });

		const grid = findElement(await EchoOverviewPage(props('2')), IssueGrid);

		expect(grid?.props.issues).toHaveLength(7);
		expect(grid?.props).toMatchObject({ currentPage: 2, hasNextPage: false });
	});

	// Review focus 3.
	it.each(['0', '-1', 'zwei'])('treats ?seite=%s as the first page', async (seite) => {
		mockArchive({ issues: YEARS.map(issue) });

		const grid = findElement(await EchoOverviewPage(props(seite)), IssueGrid);

		expect(grid?.props.currentPage).toBe(1);
	});

	it('answers a page past the end with 404', async () => {
		mockArchive({ issues: YEARS.map(issue) });

		await expect(EchoOverviewPage(props('3'))).rejects.toThrow('NEXT_NOT_FOUND');
		expect(vi.mocked(notFound)).toHaveBeenCalledWith();
	});

	// Review focus 1: production until the archive import.
	it('stays a page without any finished issue', async () => {
		mockArchive({ issues: [] });

		const page = await EchoOverviewPage(props());

		expect(findElement(page, LatestIssue)).toBeUndefined();
		expect(findElement(page, IssueGrid)).toBeUndefined();
		expect(findElements(page, 'p').map((element) => element.props.children)).toContain(
			'Noch keine Ausgaben online.',
		);
	});

	it('shows no grid when the newest issue is the only one', async () => {
		mockArchive({ issues: [issue(2025)] });

		expect(findElement(await EchoOverviewPage(props()), IssueGrid)).toBeUndefined();
	});

	describe('metadata', () => {
		it('is empty without its page document', async () => {
			mockArchive({ page: null });

			await expect(generateMetadata(props())).resolves.toStrictEqual({});
		});

		it('points every page of the archive at itself', async () => {
			mockArchive({});

			const metadata = await generateMetadata(props('2'));

			expect(metadata.alternates?.canonical).toBe('/verein/echo?seite=2');
		});
	});
});
```

Run: `pnpm --filter web exec vp test run src/app/verein/echo/page.test.ts` Expected: FAIL, because the page does not exist.

- [ ] **Step 4: Implement the page**

`apps/web/src/app/verein/echo/_shared/hero.ts`:

```ts
import heroImage from '@/images/verein/hero.webp';

/** The club's hero stands in until the editors deliver a photo of the magazine (WEB-353). */
const ECHO_HERO_IMAGE = {
	alt: 'Das Bild zeigt einen modernen Arbeitsplatz mit einem MacBook Pro, einem Festnetztelefon und einer kabellosen Maus auf einem schwarzen Schreibtisch.',
	src: heroImage,
};

export { ECHO_HERO_IMAGE };
```

`apps/web/src/app/verein/echo/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { PortableText } from '@/components/ui/portable-text';
import { client } from '@/lib/sanity/client';
import {
	echoIssuesQuery,
	echoIssuesTotalQuery,
	echoOverviewPageQuery,
} from '@/lib/sanity/queries/pages/echo';
import type {
	EchoIssuesQueryResult,
	EchoIssuesTotalQueryResult,
	EchoOverviewPageQueryResult,
} from '@/types/sanity.types';
import { ECHO_OVERVIEW_PATH } from '@/utils/links';
import { getPageMetadata } from '@/utils/metadata';
import { getPageNumber, getPaginatedPath } from '@/utils/pagination';

import { IssueGrid } from './_sections/issue-grid';
import { LatestIssue } from './_sections/latest-issue';
import { ECHO_HERO_IMAGE } from './_shared/hero';

/** The newest issue has its own card; the grid starts with the second one. */
const START_INDEX = 1;
const ITEMS_PER_PAGE = 12;
```

```tsx
export async function generateMetadata({
	searchParams,
}: Readonly<PageProps<'/verein/echo'>>): Promise<Metadata> {
	const [page, { seite }] = await Promise.all([
		client.fetch<EchoOverviewPageQueryResult>(echoOverviewPageQuery),
		searchParams,
	]);

	if (!page) {
		return {};
	}

	return getPageMetadata({
		meta: page.meta,
		path: getPaginatedPath(ECHO_OVERVIEW_PATH, getPageNumber(seite)),
		title: page.title,
	});
}

export default async function EchoOverviewPage({
	searchParams,
}: Readonly<PageProps<'/verein/echo'>>) {
	const { seite } = await searchParams;
	const currentPage = getPageNumber(seite);
	const start = (currentPage - 1) * ITEMS_PER_PAGE + START_INDEX;

	const [page, total, [latest], issues] = await Promise.all([
		client.fetch<EchoOverviewPageQueryResult>(echoOverviewPageQuery),
		client.fetch<EchoIssuesTotalQueryResult>(echoIssuesTotalQuery),
		client.fetch<EchoIssuesQueryResult>(echoIssuesQuery, { end: START_INDEX, start: 0 }),
		client.fetch<EchoIssuesQueryResult>(echoIssuesQuery, { end: start + ITEMS_PER_PAGE, start }),
	]);

	if (!page) {
		notFound();
	}

	if (currentPage > 1 && start >= total) {
		notFound();
	}

	return (
		<>
			<Hero image={ECHO_HERO_IMAGE} subTitle={page.subtitle} title={page.title} />

			<section className="container mx-auto py-10 md:py-28">
				{page.intro && (
					<div className="mx-auto prose max-w-3xl md:prose-xl">
						<PortableText value={page.intro} />
					</div>
				)}

				{latest ? (
					<LatestIssue issue={latest} />
				) : (
					<p className="mt-10 text-center">Noch keine Ausgaben online.</p>
				)}

				{issues.length > 0 && (
					<IssueGrid
						currentPage={currentPage}
						hasNextPage={start + ITEMS_PER_PAGE < total}
						issues={issues}
					/>
				)}
			</section>

			<Newsletter />
		</>
	);
}
```

Run `pnpm --filter web run typegen:routes` so that `PageProps<'/verein/echo'>` exists. If `PortableText` does not accept `page.intro`, check how `apps/web/src/app/verein/_sections/intro.tsx` passes a `simpleBlockContent` and do the same. The `prose` classes are from `@tailwindcss/typography`, which the other intros use; copy their exact classes.

Run the page and section tests again. Expected: PASS.

- [ ] **Step 5: Run the checks**

Run: `pnpm --filter web exec vp test run src/app/verein && pnpm --filter web run typecheck && pnpm --filter web run lint` Expected: PASS, no errors, 0 warnings.

- [ ] **Step 6: Commit**

`feat(web): add the tsg-echo archive page`.

---

### Task 5: Issue page

**Files:**

- Create: `apps/web/src/app/verein/echo/[slug]/page.tsx`
- Test: `apps/web/src/app/verein/echo/[slug]/page.test.ts`

**Interfaces:**

- Consumes:
  - Task 2: `echoIssueQuery`, `echoIssueSlugsQuery` and their result types; `getCoverPage`, `getFlipbookPages`, `getIssueYear`, `getPageSize`, `getPdfDownload`
  - Task 4: `ECHO_HERO_IMAGE`
  - Task 1: `getEchoIssuePath`
  - Task 3: `FlipbookLazy`
- Produces: route `/verein/echo/[slug]`, with `generateStaticParams`, `generateMetadata` and the default export `EchoIssuePage`.

- [ ] **Step 1: Write the failing tests**

`apps/web/src/app/verein/echo/[slug]/page.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import EchoIssuePage, {
	generateMetadata,
	generateStaticParams,
} from '@/app/verein/echo/[slug]/page';
import { Hero } from '@/components/section/hero';
import { ButtonLink } from '@/components/ui/button';
import { FlipbookLazy } from '@/components/with-logic/flipbook/flipbook-lazy';
import type { client } from '@/lib/sanity/client';

import { findElement, findElements } from '../../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../../test-utils/sanity-client-mock';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
		fetch: vi.fn(),
	} as unknown as typeof client,
}));

vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

const mockedFetch = clientFetchMock();

function page(hash: string) {
	return {
		_key: hash,
		_type: 'image',
		asset: { _ref: `image-${hash}-1414x2000-jpg`, _type: 'reference' },
	};
}

function buildIssue(overrides: Record<string, unknown> = {}) {
	return {
		_id: 'echo-2025',
		cover: page('a'),
		intro: 'Ein Rückblick auf das Vereinsjahr.',
		meta: null,
		pageSize: { height: 2000, width: 1414 },
		pages: [page('a'), page('b'), page('c')],
		pdf: {
			originalFilename: 'tsg-echo-2025.pdf',
			size: 1_048_576,
			url: 'https://cdn.sanity.io/x.pdf',
		},
		releaseDate: '2025-04-01',
		slug: 'tsg-echo-2025',
		title: 'TSG ECHO 2025',
		...overrides,
	};
}

function props(slug = 'tsg-echo-2025') {
	return { params: Promise.resolve({ slug }) } as never;
}

describe('a tsg-echo issue page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	it('pre-renders every finished issue', async () => {
		mockedFetch.mockResolvedValue(['tsg-echo-2025', 'tsg-echo-2024']);

		await expect(generateStaticParams()).resolves.toStrictEqual([
			{ slug: 'tsg-echo-2025' },
			{ slug: 'tsg-echo-2024' },
		]);
	});

	// Review focus 2: unfinished, unpublished or renamed issues are not found by the query.
	it('answers an unknown or unfinished issue with 404', async () => {
		mockedFetch.mockResolvedValue(null);

		await expect(EchoIssuePage(props())).rejects.toThrow('NEXT_NOT_FOUND');
	});

	it('heads the page with the title and the year', async () => {
		mockedFetch.mockResolvedValue(buildIssue());

		const hero = findElement(await EchoIssuePage(props()), Hero);

		expect(hero?.props).toMatchObject({ subTitle: '2025', title: 'TSG ECHO 2025' });
	});

	it('hands the flipbook every page, its cover and its name', async () => {
		mockedFetch.mockResolvedValue(buildIssue());

		const book = findElement(await EchoIssuePage(props()), FlipbookLazy);

		expect(book?.props).toMatchObject({
			cover: { alt: 'Titelseite von TSG ECHO 2025' },
			label: 'TSG ECHO 2025 zum Durchblättern',
			pageHeight: 2000,
			pageWidth: 1414,
		});
		expect(book?.props.pages.map((entry) => entry.alt)).toStrictEqual([
			'Seite 1 von 3',
			'Seite 2 von 3',
			'Seite 3 von 3',
		]);
	});

	it('offers the PDF with its size', async () => {
		mockedFetch.mockResolvedValue(buildIssue());

		const button = findElement(await EchoIssuePage(props()), ButtonLink);

		expect(button?.props).toMatchObject({
			href: 'https://cdn.sanity.io/x.pdf?dl=tsg-echo-2025.pdf',
		});
		expect(button?.props.children).toStrictEqual(['PDF herunterladen (', '1.00 MB', ')']);
	});

	// Review focus 5.
	it('still renders without page size, PDF and intro', async () => {
		mockedFetch.mockResolvedValue(buildIssue({ intro: null, pageSize: null, pdf: null }));

		const result = await EchoIssuePage(props());

		expect(findElement(result, FlipbookLazy)?.props).toMatchObject({
			pageHeight: 2000,
			pageWidth: 1414,
		});
		expect(findElement(result, ButtonLink)).toBeUndefined();
		expect(findElements(result, 'p')).toHaveLength(0);
	});

	describe('metadata', () => {
		it('is empty for an unknown issue', async () => {
			mockedFetch.mockResolvedValue(null);

			await expect(generateMetadata(props())).resolves.toStrictEqual({});
		});

		it('describes the issue by its intro, shows its cover and points at its page', async () => {
			mockedFetch.mockResolvedValue(buildIssue());

			const metadata = await generateMetadata(props());

			expect(metadata).toMatchObject({
				description: 'Ein Rückblick auf das Vereinsjahr.',
				title: 'TSG ECHO 2025',
			});
			expect(metadata.alternates?.canonical).toBe('/verein/echo/tsg-echo-2025');
			expect(metadata.openGraph?.images).toMatchObject({ height: 630, width: 1200 });
		});
	});
});
```

If `ButtonLink`'s children come out as one string, assert `'PDF herunterladen (1.00 MB)'` instead. The intent is that the button names the size.

Run: `pnpm --filter web exec vp test run 'src/app/verein/echo/[slug]'` Expected: FAIL, because the page does not exist.

- [ ] **Step 2: Implement the page**

`apps/web/src/app/verein/echo/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { ButtonLink } from '@/components/ui/button';
import { FlipbookLazy } from '@/components/with-logic/flipbook/flipbook-lazy';
import { client } from '@/lib/sanity/client';
import { echoIssueQuery, echoIssueSlugsQuery } from '@/lib/sanity/queries/pages/echo';
import type { EchoIssueQueryResult, EchoIssueSlugsQueryResult } from '@/types/sanity.types';
import { getEchoIssuePath } from '@/utils/links';
import { getPageMetadata } from '@/utils/metadata';

import { ECHO_HERO_IMAGE } from '../_shared/hero';
import {
	getCoverPage,
	getFlipbookPages,
	getIssueYear,
	getPageSize,
	getPdfDownload,
} from '../_shared/utils';

export async function generateStaticParams(): Promise<{ slug: string }[]> {
	const slugs = await client.fetch<EchoIssueSlugsQueryResult>(echoIssueSlugsQuery);
	return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/verein/echo/[slug]'>>): Promise<Metadata> {
	const { slug } = await params;
	const issue = await client.fetch<EchoIssueQueryResult>(echoIssueQuery, { slug });

	if (!issue) {
		return {};
	}

	return getPageMetadata({
		description: issue.intro,
		image: issue.cover,
		meta: issue.meta,
		path: getEchoIssuePath(slug),
		title: issue.title,
	});
}

export default async function EchoIssuePage({
	params,
}: Readonly<PageProps<'/verein/echo/[slug]'>>) {
	const { slug } = await params;
	const issue = await client.fetch<EchoIssueQueryResult>(echoIssueQuery, { slug });

	if (!issue?.pages?.length) {
		notFound();
	}

	const download = getPdfDownload(issue.pdf);
	const pageSize = getPageSize(issue.pageSize);

	return (
		<>
			<Hero
				image={ECHO_HERO_IMAGE}
				subTitle={getIssueYear(issue.releaseDate)}
				title={issue.title}
			/>

			<section className="container mx-auto flex flex-col items-center gap-10 py-10 md:py-20">
				{issue.intro && <p className="max-w-3xl text-center text-lg md:text-xl">{issue.intro}</p>}

				<FlipbookLazy
					cover={getCoverPage(issue.cover, issue.title)}
					label={`${issue.title} zum Durchblättern`}
					pageHeight={pageSize.height}
					pageWidth={pageSize.width}
					pages={getFlipbookPages(issue.pages)}
				/>

				{download && (
					<ButtonLink download href={download.href} variant="secondary">
						PDF herunterladen ({download.size})
					</ButtonLink>
				)}
			</section>

			<Newsletter />
		</>
	);
}
```

Run `pnpm --filter web run typegen:routes` for `PageProps<'/verein/echo/[slug]'>`.

Run the page tests again. Expected: PASS.

- [ ] **Step 3: Run the checks**

Run: `pnpm --filter web exec vp test run src/app/verein && pnpm --filter web run typecheck && pnpm --filter web run lint` Expected: PASS, no errors, 0 warnings.

- [ ] **Step 4: Commit**

`feat(web): add the tsg-echo issue page`.

---

### Task 6: Revalidation and sitemap

**Files:**

- Modify: `apps/web/src/app/api/revalidate/route.ts` (`REVALIDATION_MAP`)
- Test: `apps/web/src/app/api/revalidate/route.test.ts`
- Modify: `apps/web/src/app/sitemap.ts`
- Test: `apps/web/src/app/sitemap.test.ts`

**Interfaces:**

- Consumes: `sitemapEchoIssuesQuery`, `SitemapEchoIssuesQueryResult` (Task 2), `ECHO_OVERVIEW_PATH`, `getEchoIssuePath` (Task 1).

- [ ] **Step 1: Write the failing tests**

In `apps/web/src/app/api/revalidate/route.test.ts`, add `['echoOverview', ['/verein/echo']],` to the `it.each` table of `'revalidates %s at %j'`, in alphabetical position. Then add:

```ts
it('revalidates the archive and every issue page for a tsg-echo issue', async () => {
	mockedParseBody.mockResolvedValue(
		parsed({ _type: 'echo.issue', slug: { current: 'tsg-echo-2025' } }),
	);

	await POST(REQUEST);

	expect(mockedRevalidatePath.mock.calls).toStrictEqual([
		['/verein/echo'],
		['/verein/echo/[slug]', 'page'],
	]);
});
```

In `apps/web/src/app/sitemap.test.ts`:

- import `sitemapEchoIssuesQuery`
- extend `SanityResults` with `echoIssues?: unknown[]`, and `mockSanity` with `if (query === sitemapEchoIssuesQuery) return echoIssues;`
- add `'http://localhost:3000/verein/echo',` to the static list of `'lists every static page below the base url'`, directly after `/verein`

Then add:

```ts
it('lists a tsg-echo issue below the archive', async () => {
	const entries = await urls({
		echoIssues: [{ lastModified: '2026-10-10T10:00:00Z', slug: 'tsg-echo-2025' }],
	});

	expect(entries).toContain('http://localhost:3000/verein/echo/tsg-echo-2025');
});

// Review focus 1: no finished issue, no entry beyond the archive.
it('lists only the archive without any finished issue', async () => {
	const entries = await urls({ echoIssues: [] });

	expect(entries.filter((url) => url.includes('/verein/echo'))).toStrictEqual([
		'http://localhost:3000/verein/echo',
	]);
});
```

Run: `pnpm --filter web exec vp test run src/app/api/revalidate src/app/sitemap.test.ts` Expected: FAIL. `echoOverview` currently falls back to `/`, and the sitemap knows neither the archive nor the issues.

- [ ] **Step 2: Implement**

In `REVALIDATION_MAP` of `apps/web/src/app/api/revalidate/route.ts`, between `departmentsPage` and `home` (`sort-keys`, natural order):

```ts
	// An issue appears in the archive and has its own page. The slug of an earlier version is not
	// in the payload, so the whole issue route is revalidated.
	'echo.issue': () => {
		revalidatePath(ECHO_OVERVIEW_PATH);
		revalidatePath(`${ECHO_OVERVIEW_PATH}/[slug]`, 'page');
	},
	echoOverview: () => {
		revalidatePath(ECHO_OVERVIEW_PATH);
	},
```

Import `ECHO_OVERVIEW_PATH` from `@/utils/links`.

In `apps/web/src/app/sitemap.ts`:

- fetch `sitemapEchoIssuesQuery` (`SitemapEchoIssuesQueryResult`) in the `Promise.all`
- add a static entry `{ changeFrequency: 'monthly', priority: 0.6, url: `${baseUrl}${ECHO_OVERVIEW_PATH}` }` after `/verein`
- append:

```ts
// TSG-Echo issues (e.g., /verein/echo/tsg-echo-2025)
const echoIssuePages: MetadataRoute.Sitemap = echoIssues
	.filter((echoIssue) => echoIssue.slug)
	.map((echoIssue) => ({
		changeFrequency: 'yearly' as const,
		lastModified: echoIssue.lastModified ? new Date(echoIssue.lastModified) : undefined,
		priority: 0.4,
		url: `${baseUrl}${getEchoIssuePath(echoIssue.slug ?? '')}`,
	}));
```

Spread `...echoIssuePages` at the end of the returned list. If the generated `slug` type is a plain `string`, drop the `filter` and the `?? ''`.

Run the tests again. Expected: PASS.

- [ ] **Step 3: Run the checks and commit**

Run: `pnpm --filter web run test:coverage && pnpm --filter web run typecheck && pnpm --filter web run lint` Expected: PASS, every threshold held, 0 warnings.

Commit: `feat(web): revalidate and list tsg-echo pages`.

---

### Task 7: End-to-end coverage (needs the user)

**Files:**

- Modify: `apps/web/e2e/support/test.ts` (browser-side stub for Sanity images)
- Modify: `apps/web/e2e/support/navigation.ts` (`openNewestEchoIssue`)
- Modify: `apps/web/e2e/specs/accessibility.spec.ts`
- Modify: `apps/web/e2e/specs/visual.spec.ts`
- Create (recorded): `apps/web/e2e/fixtures/sanity/*.json`
- Create (generated): `apps/web/e2e/__screenshots__/{chromium,mobile-safari}/…echo….png`

**Interfaces:**

- Consumes: routes `/verein/echo` and `/verein/echo/[slug]` (Tasks 4 and 5).
- Produces: `openNewestEchoIssue(page: Page): Promise<void>` in `e2e/support/navigation.ts`.

- [ ] **Step 1: Stub the page images in the browser**

The flipbook loads its page images from `cdn.sanity.io` directly in the browser, which the server-side mocks never see. In the shared fixture of `apps/web/e2e/support/test.ts`, next to the analytics routes, answer them with a 1 × 1 PNG:

```ts
/** The smallest valid PNG: one transparent pixel. */
const BLANK_PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
	'base64',
);
```

```ts
// The flipbook loads its pages from the Sanity CDN in the browser, not through the image
// optimizer the server-side mocks answer.
await page.route('https://cdn.sanity.io/images/**', async (route) => {
	await route.fulfill({ body: BLANK_PNG, contentType: 'image/png' });
});
```

Match the file's existing pattern for registering routes (placement, `await`, the fixture's `use`).

- [ ] **Step 2: Add the specs**

In `apps/web/e2e/support/navigation.ts`:

```ts
/**
 * Opens the newest TSG-Echo issue from the archive. Reached by clicking, like every dynamic route,
 * so a re-recorded dataset with other issues still works.
 *
 * @param page - The Playwright page.
 */
async function openNewestEchoIssue(page: Page): Promise<void> {
	await page.goto('/verein/echo');
	await waitForPage(page);
	await page.getByRole('link', { name: 'Durchblättern' }).click();
	await expect(page).toHaveURL(/\/verein\/echo\/[^/]+$/u);
	await waitForPage(page);
}
```

Export it next to the other helpers.

In `apps/web/e2e/specs/accessibility.spec.ts`:

- add `'/verein/echo',` to `STATIC_ROUTES` after `'/verein'`
- add:

```ts
test('meets WCAG 2.1 AA on a tsg-echo issue', async ({ page }, testInfo) => {
	await openNewestEchoIssue(page);
	// The book replaces the server-rendered cover once its chunk has loaded.
	await page.getByRole('button', { name: 'Nächste Seite' }).waitFor();

	await expectNoAxeViolations(page, testInfo, '/verein/echo/[slug]');
});
```

In `apps/web/e2e/specs/visual.spec.ts`, add `{ name: 'echo', route: '/verein/echo' },` after the `club` entry.

- [ ] **Step 3: Synthetic content in `development` (needs an explicit "yes")**

The e2e fixtures are recorded from the dataset `development` (`.env.e2e`). The user has to say "yes" to these writes. Then create, through the Sanity tools:

- the singleton `echoOverview` (`_id: 'echoOverview'`):
  - `title: 'TSG-Echo'`
  - `subtitle: 'Vereinsgeschichte zum Durchblättern'`
  - a one-sentence synthetic `intro`
  - `slug.current: 'echo'`
- two synthetic issues, `title: 'TSG ECHO Testausgabe 2025'` and `'TSG ECHO Testausgabe 2024'`:
  - each with a generated three-page text PDF, made like in the WEB-351 e2e run
  - drafts, rendered by the webhook, then published

The render webhook has to point at a live deployment of the render route: staging, or the WEB-351 preview if it still exists. Check `render.status == 'done'` on both before recording.

Never use a real issue. The recorded fixtures land in a public repository.

- [ ] **Step 4: Record the fixtures**

Run: `pnpm --filter web run e2e:record` Expected: the run finishes. Assertions may fail while recording, but the fixtures are still written.

Then:

- Review the diff: `but status -f`. Keep the new fixture files of the TSG-Echo queries.
- If recording changed existing fixtures because `development` moved on since their recording, discard those changes (`but discard <ids>`). The existing visual baselines were taken against the old fixtures.
- Run `pnpm --filter web run test:e2e` (macOS skips the visual specs). Expected: green, with the new axe tests included.

- [ ] **Step 5: Take the baseline**

Run (needs a running Docker daemon): `pnpm --filter web run test:e2e:visual:update` Expected:

- two new baselines for `echo`, one per browser project
- no other baseline changed; check with `but status -f`

Look at both PNGs before committing them. A baseline update approves a design.

- [ ] **Step 6: Commit**

`test(web): cover the tsg-echo pages end to end`, with the specs, the support files, the new fixtures and the two baselines.

---

### Task 8: Documentation, tickets, pull request

- [ ] **Step 1: Document**

In `apps/web/AGENTS.md`, add a section `## TSG-Echo pages` after "TSG-Echo render route":

```markdown
## TSG-Echo pages

`/verein/echo` lists the issues, `/verein/echo/[slug]` shows one of them. Both read through `client.fetch` and are not previewable.

- Only finished issues exist for the website: `finishedEchoIssue` in `src/lib/sanity/queries/index.ts` (`render.status == 'done'`, a slug, at least one page) filters the total, the list, the issue page, the static params and the sitemap. A failed run keeps the pages of the previous PDF, so nothing may bypass it.
- The archive shows the newest issue as a wide card and the others as a grid of 12 per page (`?seite=`, helpers in `src/utils/pagination.ts`, shared with `/news`). Without a finished issue it shows "Noch keine Ausgaben online.", which is what production shows until the archive import.
- `src/components/with-logic/flipbook/` wraps `@gullabs/react-flipbook`. `FlipbookLazy` renders the cover in the reserved box on the server and loads the library only in the browser through `React.lazy`. `next/dynamic`'s placeholder cannot receive the cover. The box has the aspect ratio of a page (portrait) or a spread (`md` up), so nothing shifts when the book arrives.
- The page images are plain `<img srcSet>` from the Sanity CDN in 800, 1200 and 1600 px. The Next.js image optimizer would bill a transformation for every page of every issue. The covers go through `next/image`.
- The e2e suite stubs `cdn.sanity.io/images/**` in the browser for the flipbook. Its fixtures come from synthetic issues in `development` — never record real issues, the fixtures are public.
```

- [ ] **Step 2: Full local gate**

Run from the repository root: `pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test:coverage && pnpm run build` Expected:

- everything green, thresholds held, 0 warnings
- the build lists `ƒ /verein/echo` and `● /verein/echo/[slug]` (or `ƒ` when no finished issue exists at build time)

Check the acceptance criterion that the library only reaches the issue page:

```bash
grep -rl "stf__block" apps/web/.next/static/chunks | xargs -n1 basename
grep -l "$(grep -rl 'stf__block' apps/web/.next/static/chunks | head -1 | xargs basename)" apps/web/.next/server/app/verein/echo/page_client-reference-manifest.js apps/web/.next/server/app/verein/echo/\[slug\]/page_client-reference-manifest.js
```

Expected:

- the first command names the chunk(s) of the engine, whose CSS class prefix is `stf__`
- the second finds that chunk only in the issue page's manifest, not in the archive's
- if the manifests are named differently in this Next.js version, look the chunk up in `apps/web/.next/server/app/verein/echo/` instead

Then `pnpm run test:e2e`. Expected: green.

- [ ] **Step 3: Commit, then open a draft pull request**

Commit: `docs(web): document the tsg-echo pages`.

Open the PR with the `create-pr` skill:

- branch `feat/web-352-echo-frontend`, base `next`, `--draft`
- `Closes WEB-352` in the body
- bind the PR and turn Auto-fix on

**Leave "Ready for review" to the user**, because Kodiak merges on green.

- [ ] **Step 4: Check the preview**

On the PR's preview, which reads `development` and its synthetic issues, check:

- the archive, a page past the end (404), an issue page on a phone width and on desktop
- turning with the buttons, the keys and touch; the indicator
- the PDF download
- no layout shift when the book replaces the cover, through a Lighthouse or Performance trace on the issue page

- [ ] **Step 5: Tickets and hand-off**

- WEB-352: attach the PR link, then set "In Review" in a separate call.
- Tell the user what is left after the release:
  - the "TSG-Echo" menu item under "Verein" in `site-settings` on production
  - the editors' `echoOverview` text and hero photo (WEB-353)
  - the archive import (WEB-354)
- List the synthetic documents and assets in `development` for the user to delete, unless the e2e fixtures keep needing them. They do not: the fixtures are recorded, so they can go.
