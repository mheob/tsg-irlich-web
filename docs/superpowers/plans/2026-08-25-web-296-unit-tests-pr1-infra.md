# WEB-296 Unit Tests — PR 1 (Infrastructure) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the monorepo a working Vitest setup in all four workspaces, wired into Turbo, CI and SonarQube coverage, plus the two bugfixes the spec pins with tests.

**Architecture:** One `vitest.config.ts` per workspace, each resolving `@/*` through `vite-tsconfig-paths`. `apps/web` splits into two inline Vitest projects (`node` default, `dom` for jsdom) because Vitest 4 removed `environmentMatchGlobs`. Shared test helpers live in `apps/web/test-utils/`. Turbo gets `test` and `test:coverage` tasks; `check.yml` runs the tests, `sonar.yml` produces and uploads coverage.

**Tech Stack:** Vitest 4, `@vitest/coverage-v8`, jsdom 30, Testing Library (React 16.3 / user-event 14.6), `@vitejs/plugin-react` 6, `vite-tsconfig-paths` 6, `@react-email/render` 2, Turbo 2, pnpm 11, GitButler CLI (`but`) for commits.

**Spec:** `docs/superpowers/specs/2026-08-25-web-296-unit-tests-design.md`

## Global Constraints

- Node `^24.19.0`, pnpm `11.22.0` — do not change `.nvmrc` or `packageManager`.
- Test files live next to their source: `foo.ts` → `foo.test.ts`.
- No `globals: true`. Every test file imports `describe`, `expect`, `it`, `vi` from `vitest` explicitly.
- Exact dependency floors: `vitest@^4.1.11`, `@vitest/coverage-v8@^4.1.11`, `jsdom@^30.0.1`, `@testing-library/react@^16.3.2`, `@testing-library/user-event@^14.6.6`, `@vitejs/plugin-react@^6.1.0`, `vite-tsconfig-paths@^6.1.1`, `@react-email/render@^2.1.0`.
- `packages/email/.react-email/**` is generated and gitignored — it must never be picked up by a test run.
- Object literals must be written with alphabetically sorted keys; the repo's `oxlint` config has `sort-keys` active.
- Commits go through the GitButler CLI (`but commit`), never `git commit`. Branch name: `test/web-296-unit-tests`.
- Conventional Commits, no `Co-Authored-By` and no generator trailer in any commit message.
- After every task: `pnpm run lint` and `pnpm run format:check` must stay clean.

## Deviations from the spec (deliberate, agreed at plan time)

1. **`packages/shared` gets only its `node` project in this PR.** The spec also lists a jsdom project for the icon/logo components. An inline Vitest project whose `include` matches no file fails the run, and no icon test exists until PR 5 — so the jsdom project is added by the PR that adds the first icon test.
2. **Three test files land earlier than their spec PR**, because each is the cheapest honest proof that a piece of infrastructure works: `apps/web/src/utils/typography.test.ts` (node project, PR 2 in the spec), `apps/web/src/hooks/use-media-query.test.ts` (dom project + `matchMedia` stub, PR 4), `apps/web/src/utils/url.test.ts` (env helper, PR 2) and `apps/studio/utils/time.test.ts` + `packages/email/lib/cleverreach-markers.test.ts` (PR 5). The later PRs drop those files from their scope; everything else in them stays as specced.
3. **The `überprüfe` grammar fix ships without a test in this PR** (its guard is the action test in PR 3). It is a one-word copy fix and blocking it on PR 3's mock setup would leave two spellings in `main` for no gain.

---

### Task 1: Branch and land the spec

**Files:**

- Commit (already written): `docs/superpowers/specs/2026-08-25-web-296-unit-tests-design.md`

**Interfaces:**

- Consumes: nothing.
- Produces: branch `test/web-296-unit-tests` holding every later commit of this plan.

- [ ] **Step 1: Check the workspace state**

Run: `but status` Expected: the spec file and this plan file show as uncommitted changes.

- [ ] **Step 2: Commit spec and plan onto a new branch**

```bash
but commit -b test/web-296-unit-tests \
  -m "docs(web): add the unit test design and infra plan for WEB-296" \
  docs/superpowers/specs/2026-08-25-web-296-unit-tests-design.md \
  docs/superpowers/plans/2026-08-25-web-296-unit-tests-pr1-infra.md
```

- [ ] **Step 3: Verify the branch exists and holds one commit**

Run: `but branch show test/web-296-unit-tests` Expected: one commit, the two docs files.

---

### Task 2: Vitest in `packages/shared` and the `date.ts` fix

The smallest workspace goes first: it proves the runner, the coverage provider and the lint override before any framework glue is involved. The `date.ts` bug is fixed here because its test is the regression guard.

**Files:**

- Modify: `package.json` (root devDependencies)
- Modify: `oxlint.config.ts` (test-file override)
- Create: `packages/shared/vitest.config.ts`
- Modify: `packages/shared/package.json` (scripts)
- Create: `packages/shared/src/utils/date.test.ts`
- Modify: `packages/shared/src/utils/date.ts:6-7`

**Interfaces:**

- Consumes: nothing.
- Produces: the pattern every other workspace config copies — `defineConfig` from `vitest/config`, `tsconfigPaths()` plugin, `include: ['**/*.test.{ts,tsx}']`, workspace scripts `test`, `test:watch`, `test:coverage`.

- [ ] **Step 1: Install the runner at the root**

```bash
pnpm add -Dw vitest@^4.1.11 @vitest/coverage-v8@^4.1.11
```

- [ ] **Step 2: Add the test-file lint override**

In `oxlint.config.ts`, add this object as the **first** entry of the existing `overrides` array (before the `**/*.tsx` entry):

```ts
		{
			files: ['**/*.test.ts', '**/*.test.tsx', '**/test-utils/**', '**/vitest.config.ts'],
			rules: {
				'max-lines': 'off',
				'max-lines-per-function': 'off',
				'no-magic-numbers': 'off',
				'sort-keys': 'off',
			},
		},
```

Rationale: test suites are long by nature, are full of literal numbers, and `describe` bodies are one big function. Without this every test file would need a disable comment header.

- [ ] **Step 3: Create the shared workspace config**

Create `packages/shared/vitest.config.ts`:

```ts
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: 'node',
		include: ['src/**/*.test.{ts,tsx}'],
		name: 'shared',
	},
});
```

- [ ] **Step 4: Add the workspace dependency and scripts**

```bash
pnpm --filter @tsgi-web/shared add -D vite-tsconfig-paths@^6.1.1
```

Then add to `packages/shared/package.json` `scripts` (keep the keys alphabetically sorted with the existing ones):

```json
		"test": "vitest run",
		"test:coverage": "vitest run --coverage",
		"test:watch": "vitest"
```

- [ ] **Step 5: Write the failing test**

Create `packages/shared/src/utils/date.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { MS_PER_SECOND, TIME_SPAN_IN_SECONDS, timeSpanInMilliSeconds } from './date';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

describe('TIME_SPAN_IN_SECONDS', () => {
	it('holds one second', () => {
		expect(TIME_SPAN_IN_SECONDS.second).toBe(1);
	});

	it('holds a minute in seconds', () => {
		expect(TIME_SPAN_IN_SECONDS.minute).toBe(SECONDS_PER_MINUTE);
	});

	it('holds an hour in seconds', () => {
		expect(TIME_SPAN_IN_SECONDS.hour).toBe(SECONDS_PER_MINUTE * MINUTES_PER_HOUR);
	});

	it('holds a day in seconds', () => {
		expect(TIME_SPAN_IN_SECONDS.day).toBe(SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY);
	});

	it('holds a week as seven days', () => {
		expect(TIME_SPAN_IN_SECONDS.week).toBe(TIME_SPAN_IN_SECONDS.day * DAYS_PER_WEEK);
	});

	it('holds a month as thirty days', () => {
		expect(TIME_SPAN_IN_SECONDS.month).toBe(TIME_SPAN_IN_SECONDS.day * DAYS_PER_MONTH);
	});

	it('holds a year as 365 days', () => {
		expect(TIME_SPAN_IN_SECONDS.year).toBe(TIME_SPAN_IN_SECONDS.day * DAYS_PER_YEAR);
	});
});

describe('timeSpanInMilliSeconds', () => {
	it('converts a span to milliseconds', () => {
		expect(timeSpanInMilliSeconds('minute')).toBe(SECONDS_PER_MINUTE * MS_PER_SECOND);
	});

	it('converts the smallest span', () => {
		expect(timeSpanInMilliSeconds('second')).toBe(MS_PER_SECOND);
	});
});
```

- [ ] **Step 6: Run it and watch the two wrong constants fail**

Run: `pnpm --filter @tsgi-web/shared test` Expected: FAIL — `hour` expected `3600` received `360`, `day` expected `86400` received `8640`, plus the `week`/`month`/`year` cases that are derived from `day`. Every other case passes.

- [ ] **Step 7: Fix the constants**

In `packages/shared/src/utils/date.ts`, change the two wrong values:

```ts
	hour: 3600,
	day: 86_400,
```

Leave `week: 604_800`, `month: 2_592_000` and `year: 31_536_000` untouched — they are already the 7-, 30- and 365-day values.

- [ ] **Step 8: Run the test again**

Run: `pnpm --filter @tsgi-web/shared test` Expected: PASS, 9 tests.

- [ ] **Step 9: Verify coverage works**

Run: `pnpm --filter @tsgi-web/shared test:coverage` Expected: PASS plus a coverage table, and `packages/shared/coverage/lcov.info` exists.

- [ ] **Step 10: Verify nothing else broke**

Run: `pnpm run lint && pnpm run format:check && pnpm run typecheck` Expected: all clean. `date.ts` is consumed only by `number-ticker.tsx` (`second`) and `cleverreach.ts` (`minute`), so the corrected values change no behavior.

- [ ] **Step 11: Commit**

```bash
but commit -b test/web-296-unit-tests \
  -m "test(shared): set up vitest and cover the time span constants" \
  -m "The hour and day spans were off by a factor of ten. Only second and minute are used today, so the correction is behavior neutral."
```

---

### Task 3: The `node` project in `apps/web`

**Files:**

- Create: `apps/web/vitest.config.ts`
- Modify: `apps/web/package.json` (devDependencies, scripts)
- Create: `apps/web/src/utils/typography.test.ts`

**Interfaces:**

- Consumes: the config pattern from Task 2.
- Produces: `apps/web/vitest.config.ts` with an `assetStub` plugin and a `node` project; Task 4 adds the `dom` project to the same file.

- [ ] **Step 1: Add the web devDependencies**

```bash
pnpm --filter web add -D vite-tsconfig-paths@^6.1.1
```

- [ ] **Step 2: Create the web config with the asset stub**

Create `apps/web/vitest.config.ts`. The `assetStub` plugin exists because `src/utils/groups.ts` imports `.webp` files, which Vite cannot resolve into a module on its own; the stub mirrors the object Next.js injects for a static image import.

```ts
import type { Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const ASSET_PATTERN = /\.(?:avif|gif|jpe?g|png|svg|webp)$/u;

/**
 * Resolves static image imports to the object Next.js injects for them, so modules that import
 * an image (for example `src/utils/groups.ts`) can be loaded in a test run.
 */
function assetStub(): Plugin {
	return {
		enforce: 'pre',
		load(id) {
			if (!ASSET_PATTERN.test(id)) {
				return null;
			}
			return `export default { blurDataURL: '', blurWidth: 0, height: 1, src: '${id}', width: 1 };`;
		},
		name: 'tsgi:asset-stub',
		resolveId(source) {
			return ASSET_PATTERN.test(source) ? source : null;
		},
	};
}

export default defineConfig({
	plugins: [assetStub(), tsconfigPaths()],
	test: {
		projects: [
			{
				extends: true,
				test: {
					environment: 'node',
					exclude: ['src/components/**', 'src/hooks/**', 'node_modules/**'],
					include: ['src/**/*.test.{ts,tsx}'],
					name: { color: 'green', label: 'node' },
				},
			},
		],
	},
});
```

- [ ] **Step 3: Add the web scripts**

Add to `apps/web/package.json` `scripts`, keeping alphabetical order with the existing keys:

```json
		"test": "vitest run",
		"test:coverage": "vitest run --coverage",
		"test:watch": "vitest"
```

- [ ] **Step 4: Write the failing test**

Create `apps/web/src/utils/typography.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { capitalizeString, capitalizeWords } from './typography';

describe('capitalizeString', () => {
	it('capitalizes the first letter', () => {
		expect(capitalizeString('fußball')).toBe('Fußball');
	});

	it('leaves an already capitalized string alone', () => {
		expect(capitalizeString('Fußball')).toBe('Fußball');
	});

	it('returns an empty string for an empty input', () => {
		expect(capitalizeString('')).toBe('');
	});

	it('handles a single character', () => {
		expect(capitalizeString('a')).toBe('A');
	});

	it('keeps the rest of the string untouched', () => {
		expect(capitalizeString('kinderTURNEN')).toBe('KinderTURNEN');
	});
});

describe('capitalizeWords', () => {
	it('capitalizes every hyphen separated word', () => {
		expect(capitalizeWords('weitere-sportarten')).toBe('Weitere Sportarten');
	});

	it('lowercases the remainder of each word', () => {
		expect(capitalizeWords('WEITERE-SPORTARTEN')).toBe('Weitere Sportarten');
	});

	it('accepts a custom separator', () => {
		expect(capitalizeWords('weitere sportarten', ' ')).toBe('Weitere Sportarten');
	});

	it('returns an empty string for an empty input', () => {
		expect(capitalizeWords('')).toBe('');
	});

	it('handles a single word', () => {
		expect(capitalizeWords('taekwondo')).toBe('Taekwondo');
	});
});
```

- [ ] **Step 5: Run it**

Run: `pnpm --filter web test` Expected: PASS, 10 tests, reported under the `node` project label. If it fails to resolve `./typography`, the `tsconfigPaths()` plugin is missing from the config.

- [ ] **Step 6: Prove the asset stub works**

Run: `pnpm --filter web exec vitest run --project node src/utils/typography.test.ts` Expected: PASS. Then, as a throwaway check that image imports load, run:

```bash
pnpm --filter web exec vitest run --project node --reporter=dot \
  --testNamePattern='nothing' src/utils
```

Expected: no test matches, but **no import error** — which is the point: `groups.ts` and its `.webp` imports were collected without failing. If you see `Failed to load url ... hero.webp`, the `assetStub` plugin is not being applied.

- [ ] **Step 7: Lint, format, typecheck**

Run: `pnpm run lint && pnpm run format:check && pnpm run typecheck` Expected: clean.

- [ ] **Step 8: Commit**

```bash
but commit -b test/web-296-unit-tests \
  -m "test(web): add the vitest node project and cover typography"
```

---

### Task 4: The `dom` project in `apps/web`

**Files:**

- Modify: `apps/web/vitest.config.ts` (second project)
- Create: `apps/web/test-utils/setup-dom.ts`
- Modify: `apps/web/package.json` (devDependencies)
- Create: `apps/web/src/hooks/use-media-query.test.ts`

**Interfaces:**

- Consumes: `apps/web/vitest.config.ts` from Task 3.
- Produces: `apps/web/test-utils/setup-dom.ts`, which exports `createMatchMediaStub(matches: boolean): (query: string) => MediaQueryList` and registers `window.matchMedia`, `ResizeObserver` and `IntersectionObserver`. PR 4's component tests rely on both.

- [ ] **Step 1: Add the DOM dependencies**

```bash
pnpm --filter web add -D jsdom@^30.0.1 @testing-library/react@^16.3.2 \
  @testing-library/user-event@^14.6.6 @vitejs/plugin-react@^6.1.0
```

- [ ] **Step 2: Write the DOM setup file**

Create `apps/web/test-utils/setup-dom.ts`:

```ts
import { vi } from 'vitest';

type MediaQueryListener = (event: MediaQueryListEvent) => void;

/**
 * Builds a `matchMedia` implementation whose `matches` value is fixed and whose listeners can be
 * triggered from a test through `dispatchMediaQueryChange`.
 */
function createMatchMediaStub(matches: boolean): (query: string) => MediaQueryList {
	return (query: string) => {
		const listeners = new Set<MediaQueryListener>();

		const list = {
			addEventListener: (_type: string, listener: MediaQueryListener) => {
				listeners.add(listener);
			},
			dispatchEvent: () => true,
			listeners,
			matches,
			media: query,
			onchange: null,
			removeEventListener: (_type: string, listener: MediaQueryListener) => {
				listeners.delete(listener);
			},
		};

		return list as unknown as MediaQueryList;
	};
}

/** Fires a `change` event on every listener registered for the given media query list. */
function dispatchMediaQueryChange(list: MediaQueryList, matches: boolean): void {
	const { listeners } = list as unknown as { listeners: Set<MediaQueryListener> };
	for (const listener of listeners) {
		listener({ matches } as MediaQueryListEvent);
	}
}

class ObserverStub {
	disconnect(): void {
		// no-op
	}

	observe(): void {
		// no-op
	}

	unobserve(): void {
		// no-op
	}
}

vi.stubGlobal('matchMedia', createMatchMediaStub(false));
vi.stubGlobal('ResizeObserver', ObserverStub);
vi.stubGlobal('IntersectionObserver', ObserverStub);

export { createMatchMediaStub, dispatchMediaQueryChange };
```

- [ ] **Step 3: Add the `dom` project to the web config**

In `apps/web/vitest.config.ts`, import the React plugin and append the second project after the `node` one:

```ts
import react from '@vitejs/plugin-react';
```

```ts
			{
				extends: true,
				plugins: [react()],
				test: {
					environment: 'jsdom',
					include: ['src/{components,hooks}/**/*.test.{ts,tsx}'],
					name: { color: 'magenta', label: 'dom' },
					setupFiles: ['./test-utils/setup-dom.ts'],
				},
			},
```

- [ ] **Step 4: Write the failing test**

Create `apps/web/src/hooks/use-media-query.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMatchMediaStub, dispatchMediaQueryChange } from '../../test-utils/setup-dom';
import { useMediaQuery } from './use-media-query';

const QUERY = '(max-width: 48rem)';

afterEach(() => {
	vi.stubGlobal('matchMedia', createMatchMediaStub(false));
});

describe('useMediaQuery', () => {
	it('returns false when the query does not match', () => {
		const { result } = renderHook(() => useMediaQuery(QUERY));
		expect(result.current).toBe(false);
	});

	it('returns true when the query matches on mount', () => {
		vi.stubGlobal('matchMedia', createMatchMediaStub(true));
		const { result } = renderHook(() => useMediaQuery(QUERY));
		expect(result.current).toBe(true);
	});

	it('updates when the media query changes', () => {
		const { result } = renderHook(() => useMediaQuery(QUERY));
		const list = window.matchMedia(QUERY);

		act(() => {
			dispatchMediaQueryChange(list, true);
		});

		expect(result.current).toBe(true);
	});

	it('removes its listener on unmount', () => {
		const { unmount } = renderHook(() => useMediaQuery(QUERY));
		const list = window.matchMedia(QUERY);
		const { listeners } = list as unknown as { listeners: Set<unknown> };

		unmount();

		expect(listeners.size).toBe(0);
	});
});
```

Note on the third and fourth case: the hook registers its listener on the `MediaQueryList` it created itself, so the test asks `window.matchMedia` for a list and drives that one. The stub returns a fresh list per call but shares the listener set per call — if the assertion fails because the sets differ, make `createMatchMediaStub` cache one list per query string in a `Map` and return the cached instance.

- [ ] **Step 5: Run it**

Run: `pnpm --filter web test` Expected: 10 node tests plus 4 dom tests PASS. `matchMedia is not a function` means `setupFiles` is not wired; `document is not defined` means the file was matched by the `node` project instead — check the `exclude` in Task 3 Step 2.

- [ ] **Step 6: Lint, format, typecheck**

Run: `pnpm run lint && pnpm run format:check && pnpm run typecheck` Expected: clean.

- [ ] **Step 7: Commit**

```bash
but commit -b test/web-296-unit-tests \
  -m "test(web): add the jsdom project and cover the media query hook"
```

---

### Task 5: Test helpers for env and fetch

**Files:**

- Create: `apps/web/test-utils/env.ts`
- Create: `apps/web/test-utils/fetch-mock.ts`
- Create: `apps/web/src/utils/url.test.ts`

**Interfaces:**

- Consumes: the `node` project from Task 3.
- Produces:
  - `loadWithEnv<T>(specifier: string, vars: Record<string, string | undefined>): Promise<T>` — resets the module registry, stubs the given variables, then imports the module fresh. Needed because `src/lib/env.ts` caches validated values in a module-level `Map`.
  - `createFetchMock(): { calls: FetchCall[]; enqueue(response: MockResponse): void; enqueueJson(body: unknown, init?: { status?: number }): void; restore(): void }` where `FetchCall = { body: string | undefined; headers: Record<string, string>; method: string; url: string }`. PR 3 builds all action and CleverReach tests on this.

- [ ] **Step 1: Write the env helper**

Create `apps/web/test-utils/env.ts`:

```ts
import { vi } from 'vitest';

/**
 * Imports a module with a fresh module registry and the given environment variables in place.
 *
 * `src/lib/env.ts` caches every validated value in a module level `Map`, so a test that needs a
 * different value has to reset the registry before importing the consumer.
 */
async function loadWithEnv<T>(
	specifier: string,
	vars: Record<string, string | undefined>,
): Promise<T> {
	vi.resetModules();
	vi.unstubAllEnvs();

	for (const [key, value] of Object.entries(vars)) {
		vi.stubEnv(key, value);
	}

	return (await import(specifier)) as T;
}

export { loadWithEnv };
```

- [ ] **Step 2: Write the fetch helper**

Create `apps/web/test-utils/fetch-mock.ts`:

```ts
import { vi } from 'vitest';

interface FetchCall {
	body: string | undefined;
	headers: Record<string, string>;
	method: string;
	url: string;
}

interface MockResponse {
	body: string;
	status: number;
}

/**
 * Replaces the global `fetch` with a queue of canned responses and records every request.
 *
 * Responses are handed out in the order they were enqueued, which keeps the tests of the multi
 * request flows (token, then receiver, then DOI mail) readable.
 */
function createFetchMock(): {
	calls: FetchCall[];
	enqueue: (response: MockResponse) => void;
	enqueueJson: (body: unknown, init?: { status?: number }) => void;
	restore: () => void;
} {
	const calls: FetchCall[] = [];
	const queue: MockResponse[] = [];

	const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
		calls.push({
			body: typeof init?.body === 'string' ? init.body : undefined,
			headers: { ...(init?.headers as Record<string, string> | undefined) },
			method: init?.method ?? 'GET',
			url: String(input),
		});

		const next = queue.shift();

		if (!next) {
			throw new Error(`No mock response queued for ${String(input)}`);
		}

		return Promise.resolve(new Response(next.body, { status: next.status }));
	});

	vi.stubGlobal('fetch', fetchMock);

	return {
		calls,
		enqueue: (response: MockResponse) => {
			queue.push(response);
		},
		enqueueJson: (body: unknown, init?: { status?: number }) => {
			queue.push({ body: JSON.stringify(body), status: init?.status ?? 200 });
		},
		restore: () => {
			vi.unstubAllGlobals();
		},
	};
}

export { createFetchMock, type FetchCall, type MockResponse };
```

- [ ] **Step 3: Write the failing test that exercises the env helper**

Create `apps/web/src/utils/url.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { loadWithEnv } from '../../test-utils/env';

type UrlModule = typeof import('./url');

const GOOGLE_MAPS_PREFIX = 'https://www.google.com/maps/search/?api=1&query=';

const VENUE = {
	city: 'Neuwied',
	houseNumber: '12',
	name: 'Sporthalle Irlich',
	street: 'Pappelweg',
	zipCode: '56567',
};

describe('getBaseUrl', () => {
	it('prefers the Vercel production URL', async () => {
		const { getBaseUrl } = await loadWithEnv<UrlModule>('./url', {
			NODE_ENV: 'production',
			VERCEL_PROJECT_PRODUCTION_URL: 'tsg-irlich.vercel.app',
		});

		expect(getBaseUrl()).toBe('https://tsg-irlich.vercel.app');
	});

	it('falls back to the live domain in production', async () => {
		const { getBaseUrl } = await loadWithEnv<UrlModule>('./url', {
			NODE_ENV: 'production',
			VERCEL_PROJECT_PRODUCTION_URL: undefined,
		});

		expect(getBaseUrl()).toBe('https://www.tsg-irlich.de');
	});

	it('falls back to localhost outside production', async () => {
		const { getBaseUrl } = await loadWithEnv<UrlModule>('./url', {
			NODE_ENV: 'development',
			VERCEL_PROJECT_PRODUCTION_URL: undefined,
		});

		expect(getBaseUrl()).toBe('http://localhost:3000');
	});
});

describe('printGoogleMapsLink', () => {
	it('builds a search URL from the full address', async () => {
		const { printGoogleMapsLink } = await loadWithEnv<UrlModule>('./url', {});

		expect(printGoogleMapsLink(VENUE)).toBe(
			`${GOOGLE_MAPS_PREFIX}${encodeURIComponent('Sporthalle Irlich, Pappelweg 12, 56567 Neuwied')}`,
		);
	});

	it('skips an empty venue name', async () => {
		const { printGoogleMapsLink } = await loadWithEnv<UrlModule>('./url', {});

		expect(printGoogleMapsLink({ ...VENUE, name: '' })).toBe(
			`${GOOGLE_MAPS_PREFIX}${encodeURIComponent('Pappelweg 12, 56567 Neuwied')}`,
		);
	});

	it('skips an empty zip code', async () => {
		const { printGoogleMapsLink } = await loadWithEnv<UrlModule>('./url', {});

		expect(printGoogleMapsLink({ ...VENUE, zipCode: '' })).toBe(
			`${GOOGLE_MAPS_PREFIX}${encodeURIComponent('Sporthalle Irlich, Pappelweg 12, Neuwied')}`,
		);
	});
});
```

Before running, open `apps/web/src/constants/urls.ts` and confirm `GOOGLE_MAPS_URL` equals the `GOOGLE_MAPS_PREFIX` above. If it differs, import the constant instead of duplicating it.

- [ ] **Step 4: Run it**

Run: `pnpm --filter web test src/utils/url.test.ts` Expected: PASS, 6 tests. A thrown `Invalid environment variable …` means `loadWithEnv` was called without the variable that branch needs.

- [ ] **Step 5: Prove the fetch helper compiles and behaves**

Run: `pnpm run typecheck` Expected: clean — this is the only check the fetch helper gets in this PR; PR 3 is its first consumer.

- [ ] **Step 6: Lint and format**

Run: `pnpm run lint && pnpm run format:check` Expected: clean.

- [ ] **Step 7: Commit**

```bash
but commit -b test/web-296-unit-tests \
  -m "test(web): add env and fetch test helpers and cover the url utils"
```

---

### Task 6: Vitest in `apps/studio`

**Files:**

- Create: `apps/studio/vitest.config.ts`
- Modify: `apps/studio/package.json` (devDependencies, scripts)
- Create: `apps/studio/utils/time.test.ts`

**Interfaces:**

- Consumes: the config pattern from Task 2.
- Produces: a jsdom-based studio project; PR 5 adds schema and plugin tests to it.

- [ ] **Step 1: Add the dependencies**

```bash
pnpm --filter studio add -D jsdom@^30.0.1 @vitejs/plugin-react@^6.1.0 \
  vite-tsconfig-paths@^6.1.1
```

- [ ] **Step 2: Create the config**

Create `apps/studio/vitest.config.ts`. Note the studio's `@/*` alias points at the package root, not `src`, and its `exclude` has to keep `dist` and the Sanity caches out.

```ts
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		environment: 'jsdom',
		exclude: ['dist/**', 'node_modules/**', '.sanity/**'],
		include: ['**/*.test.{ts,tsx}'],
		name: 'studio',
	},
});
```

- [ ] **Step 3: Add the scripts**

Add to `apps/studio/package.json` `scripts`, alphabetically:

```json
		"test": "vitest run",
		"test:coverage": "vitest run --coverage",
		"test:watch": "vitest"
```

- [ ] **Step 4: Write the failing test**

Create `apps/studio/utils/time.test.ts`. `formatDate` calls `toISOString`, so the expectations are timezone dependent — the suite pins `TZ` to `UTC` and adds one case that documents the behavior for a late evening local time.

```ts
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { formatDate } from './time';

beforeAll(() => {
	vi.stubEnv('TZ', 'UTC');
});

afterAll(() => {
	vi.unstubAllEnvs();
});

describe('formatDate', () => {
	it('formats a Date as a two digit year date', () => {
		expect(formatDate(new Date('2026-08-25T10:00:00.000Z'))).toBe('26-08-25');
	});

	it('formats an ISO string', () => {
		expect(formatDate('2026-01-01T00:00:00.000Z')).toBe('26-01-01');
	});

	it('formats a plain date string', () => {
		expect(formatDate('2026-12-31')).toBe('26-12-31');
	});

	it('uses UTC, so a UTC timestamp keeps its calendar day', () => {
		expect(formatDate('2026-08-25T23:30:00.000Z')).toBe('26-08-25');
	});
});
```

- [ ] **Step 5: Run it**

Run: `pnpm --filter studio test` Expected: PASS, 4 tests. If the last case reports `26-08-26`, the process timezone is not UTC — set it in the config instead (`test.env: { TZ: 'UTC' }`) and drop the `stubEnv` calls, because `vi.stubEnv('TZ', …)` does not re-initialize Node's already-resolved timezone.

- [ ] **Step 6: Lint, format, typecheck**

Run: `pnpm run lint && pnpm run format:check && pnpm run typecheck` Expected: clean.

- [ ] **Step 7: Commit**

```bash
but commit -b test/web-296-unit-tests \
  -m "test(studio): set up vitest and cover the date formatting"
```

---

### Task 7: Vitest in `packages/email`

**Files:**

- Create: `packages/email/vitest.config.ts`
- Modify: `packages/email/package.json` (devDependencies, scripts)
- Create: `packages/email/lib/cleverreach-markers.test.ts`

**Interfaces:**

- Consumes: the config pattern from Task 2.
- Produces: an email project whose `exclude` keeps the generated `.react-email` specs out; PR 5 adds the template tests to it.

- [ ] **Step 1: Add the dependencies**

```bash
pnpm --filter @tsgi-web/email add -D @react-email/render@^2.1.0 \
  @vitejs/plugin-react@^6.1.0
```

- [ ] **Step 2: Create the config**

Create `packages/email/vitest.config.ts`. The `exclude` entry for `.react-email` is mandatory: that generated directory ships its own `*.spec.*` files.

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'node',
		exclude: ['.react-email/**', 'node_modules/**'],
		include: ['{components,emails,lib,scripts}/**/*.test.{ts,tsx}'],
		name: 'email',
	},
});
```

- [ ] **Step 3: Add the scripts**

Add to `packages/email/package.json` `scripts`, alphabetically:

```json
		"test": "vitest run",
		"test:coverage": "vitest run --coverage",
		"test:watch": "vitest"
```

- [ ] **Step 4: Write the failing test**

Create `packages/email/lib/cleverreach-markers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { marker, stripCleverReachMarkers, toCleverReachTemplate } from './cleverreach-markers';

describe('marker', () => {
	it('builds a marker without attributes', () => {
		expect(marker('html')).toBe('@@CR|html@@');
	});

	it('appends every attribute', () => {
		expect(marker('img', { name: 'hero', src: 'logo.png' })).toBe(
			'@@CR|img|name=hero|src=logo.png@@',
		);
	});

	it('drops attributes that are undefined', () => {
		expect(marker('img', { name: 'hero', src: undefined })).toBe('@@CR|img|name=hero@@');
	});
});

describe('toCleverReachTemplate', () => {
	it('turns a marker into a CleverReach comment', () => {
		expect(toCleverReachTemplate('<p>@@CR|html@@</p>')).toBe('<p><!--#html#--></p>');
	});

	it('renders attributes as HTML attributes', () => {
		expect(toCleverReachTemplate('@@CR|img|name=hero@@')).toBe('<!--#img name="hero"#-->');
	});

	it('converts every marker in the document', () => {
		expect(toCleverReachTemplate('@@CR|html@@ and @@CR|loopitem@@')).toBe(
			'<!--#html#--> and <!--#loopitem#-->',
		);
	});

	it('removes the separators React inserts between children', () => {
		expect(toCleverReachTemplate('a<!-- -->b')).toBe('ab');
	});

	it('leaves HTML without markers untouched', () => {
		expect(toCleverReachTemplate('<p>Hallo TSG-Familie!</p>')).toBe('<p>Hallo TSG-Familie!</p>');
	});
});

describe('stripCleverReachMarkers', () => {
	it('removes a marker and keeps the surrounding HTML', () => {
		expect(stripCleverReachMarkers('<p>@@CR|html@@Text</p>')).toBe('<p>Text</p>');
	});

	it('removes every marker', () => {
		expect(stripCleverReachMarkers('@@CR|html@@a@@CR|img|name=hero@@b')).toBe('ab');
	});

	it('leaves HTML without markers untouched', () => {
		expect(stripCleverReachMarkers('<p>Text</p>')).toBe('<p>Text</p>');
	});
});
```

- [ ] **Step 5: Run it**

Run: `pnpm --filter @tsgi-web/email test` Expected: PASS, 11 tests.

- [ ] **Step 6: Confirm the generated specs stayed out**

Run: `pnpm --filter @tsgi-web/email test --reporter=verbose` Expected: only `lib/cleverreach-markers.test.ts` in the file list. Any `.react-email/...spec.ts` entry means the `exclude` is wrong.

- [ ] **Step 7: Lint, format, typecheck**

Run: `pnpm run lint && pnpm run format:check && pnpm run typecheck` Expected: clean. `packages/email`'s `build` script is `tsc --noEmit`, so the new test file is type-checked by it too.

- [ ] **Step 8: Commit**

```bash
but commit -b test/web-296-unit-tests \
  -m "test(email): set up vitest and cover the cleverreach markers"
```

---

### Task 8: Fix the newsletter error copy

**Files:**

- Modify: `apps/web/src/actions/subscribe-to-newsletter.ts:82`

**Interfaces:**

- Consumes: nothing.
- Produces: a single German copy string that PR 3's action test asserts.

- [ ] **Step 1: Find both spellings**

Run: `grep -rn "überprüf" apps/web/src` Expected: two hits — `ERROR_MESSAGES.VALIDATION_ERROR` with `'Bitte überprüfe Deine Eingaben.'` and the validation branch of `subscribeToNewsletter` with `'Bitte überprüfen Deine Eingaben.'`.

- [ ] **Step 2: Fix the wrong one**

In the validation branch of `subscribeToNewsletter`, change:

```ts
			message: 'Bitte überprüfen Deine Eingaben.',
```

to:

```ts
			message: 'Bitte überprüfe Deine Eingaben.',
```

- [ ] **Step 3: Verify only one spelling remains**

Run: `grep -rn "überprüfen Deine" apps/web/src` Expected: no output.

- [ ] **Step 4: Lint, format, typecheck**

Run: `pnpm run lint && pnpm run format:check && pnpm run typecheck` Expected: clean.

- [ ] **Step 5: Commit**

```bash
but commit -b test/web-296-unit-tests \
  -m "fix(web): use the informal imperative in the newsletter error message"
```

---

### Task 9: Turbo tasks, root scripts and coverage output

**Files:**

- Modify: `turbo.json` (tasks)
- Modify: `package.json` (root scripts)
- Modify: `.gitignore`
- Modify: `packages/shared/vitest.config.ts`, `apps/web/vitest.config.ts`, `apps/studio/vitest.config.ts`, `packages/email/vitest.config.ts` (coverage block)

**Interfaces:**

- Consumes: the four workspace configs and their `test` scripts.
- Produces: `pnpm run test`, `pnpm run test:affected`, `pnpm run test:coverage` at the root, and one `coverage/lcov.info` per workspace.

- [ ] **Step 1: Add the coverage block to every config**

Add this to the `test` object of all four `vitest.config.ts` files (for `apps/web`, put it in the outer `test` object, not inside a project, so both projects report into one directory):

```ts
		coverage: {
			exclude: ['**/*.test.{ts,tsx}', '**/test-utils/**', '**/*.config.ts', '**/*.generated.ts'],
			provider: 'v8',
			reporter: ['text', 'lcov'],
			reportsDirectory: './coverage',
		},
```

- [ ] **Step 2: Add the Turbo tasks**

In `turbo.json`, add to `tasks` (keys stay alphabetically sorted, so `test` and `test:coverage` go after `studio#build` and before `typecheck`):

```json
		"test": {},
		"test:coverage": {
			"outputs": ["coverage/**"]
		},
```

No `dependsOn` — unit tests need no build output.

- [ ] **Step 3: Add the root scripts**

In the root `package.json` `scripts`, alphabetically after `prepare`:

```json
		"test": "turbo test",
		"test:affected": "turbo test --affected",
		"test:coverage": "turbo test:coverage",
```

- [ ] **Step 4: Ignore the coverage output**

Add to `.gitignore`:

```
# test coverage
coverage
```

- [ ] **Step 5: Run the whole suite through Turbo**

Run: `pnpm run test` Expected: four successful tasks (`web`, `studio`, `@tsgi-web/shared`, `@tsgi-web/email`), 44 tests total (10 typography + 4 media query + 6 url + 9 date + 4 formatDate + 11 markers). Confirm the number against the actual output and use it in the PR description.

- [ ] **Step 6: Run coverage through Turbo**

Run: `pnpm run test:coverage` Expected: four `coverage/lcov.info` files exist:

```bash
ls apps/web/coverage/lcov.info apps/studio/coverage/lcov.info \
  packages/shared/coverage/lcov.info packages/email/coverage/lcov.info
```

- [ ] **Step 7: Confirm caching works**

Run: `pnpm run test` twice in a row. Expected: the second run reports `FULL TURBO`.

- [ ] **Step 8: Confirm coverage is not committed**

Run: `but status` Expected: no `coverage/` entries.

- [ ] **Step 9: Lint, format**

Run: `pnpm run lint && pnpm run format:check` Expected: clean.

- [ ] **Step 10: Commit**

```bash
but commit -b test/web-296-unit-tests \
  -m "build: run the test suites through turbo and collect coverage"
```

---

### Task 10: Run the tests in CI

**Files:**

- Modify: `.github/workflows/check.yml`

**Interfaces:**

- Consumes: the root `test` script from Task 9.
- Produces: a PR-blocking test step.

- [ ] **Step 1: Add the test step**

In `.github/workflows/check.yml`, insert between the `Lint files` and `Build files` steps:

```yaml
- name: Run tests
  run: pnpm run test:affected
  env:
    NEXT_PUBLIC_SANITY_DATASET: ${{ secrets.SANITY_DATASET }}
    NEXT_PUBLIC_SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
```

`test:affected` mirrors the existing `lint:affected` / `build:affected` steps. The two Sanity variables are needed because `src/lib/sanity/client.ts` reads them at module load, and the web tests import modules that pull it in.

- [ ] **Step 2: Verify the file parses**

Run: `pnpm exec oxlint .github/workflows/check.yml --no-error-on-unmatched-pattern; python3 -c "import sys,yaml;yaml.safe_load(open('.github/workflows/check.yml'))" && echo "yaml ok"` Expected: `yaml ok`.

- [ ] **Step 3: Reproduce the CI command locally**

Run: `pnpm run test:affected` Expected: PASS. If the web tests fail with `Invalid environment variable NEXT_PUBLIC_SANITY_…`, note the failing module in the PR description — the fix belongs here, either by adding the variable to the CI env block or by adding a `test.env` default to `apps/web/vitest.config.ts`.

- [ ] **Step 4: Commit**

```bash
but commit -b test/web-296-unit-tests \
  -m "ci: run the unit tests on every pull request"
```

---

### Task 11: Report coverage to SonarQube

**Files:**

- Modify: `sonar-project.properties`
- Modify: `.github/workflows/sonar.yml`

**Interfaces:**

- Consumes: the four `coverage/lcov.info` files from Task 9.
- Produces: coverage visible in SonarQube, with no minimum threshold.

- [ ] **Step 1: Rewrite the coverage settings**

In `sonar-project.properties`, replace the `sonar.coverage.exclusions=**/*` line with:

```properties
# Coverage settings
sonar.javascript.lcov.reportPaths=apps/web/coverage/lcov.info,apps/studio/coverage/lcov.info,packages/shared/coverage/lcov.info,packages/email/coverage/lcov.info
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx
sonar.coverage.exclusions=**/*.config.ts,**/test-utils/**,**/*.generated.ts
```

Keep the existing `sonar.exclusions=**/sanity.types.generated.ts` line as it is. No `sonar.qualitygate` or coverage threshold — that is a follow-up ticket per the spec.

- [ ] **Step 2: Generate coverage before the scan**

In `.github/workflows/sonar.yml`, insert these steps between the `checkout` step and the `SonarQube Scan` step:

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10

- name: Setup Node
  uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7
  with:
    cache: pnpm
    node-version-file: .nvmrc

- name: Install Dependencies
  run: pnpm install --frozen-lockfile --ignore-scripts

- name: Collect Coverage
  run: pnpm run test:coverage
  env:
    NEXT_PUBLIC_SANITY_DATASET: ${{ secrets.SANITY_DATASET }}
    NEXT_PUBLIC_SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
```

Reuse the exact pinned action SHAs from `check.yml` (copied above) so both workflows stay on one version.

- [ ] **Step 3: Verify the YAML parses**

Run: `python3 -c "import yaml;yaml.safe_load(open('.github/workflows/sonar.yml'))" && echo "yaml ok"` Expected: `yaml ok`.

- [ ] **Step 4: Verify the lcov paths exist**

Run: `pnpm run test:coverage && wc -l apps/web/coverage/lcov.info apps/studio/coverage/lcov.info packages/shared/coverage/lcov.info packages/email/coverage/lcov.info` Expected: four non-empty files, matching the paths in `sonar-project.properties` exactly.

- [ ] **Step 5: Commit**

```bash
but commit -b test/web-296-unit-tests \
  -m "ci: report unit test coverage to sonarqube"
```

---

### Task 12: Document the setup

**Files:**

- Modify: `AGENTS.md` (Development Commands, Code Quality Tools)
- Modify: `apps/web/AGENTS.md`
- Modify: `apps/studio/AGENTS.md`

**Interfaces:**

- Consumes: every script added in this PR.
- Produces: the conventions later PRs and other agents follow.

- [ ] **Step 1: Read the two app guides first**

Run: `sed -n 1,60p apps/web/AGENTS.md; sed -n 1,60p apps/studio/AGENTS.md` Match their existing heading style and tone when adding to them.

- [ ] **Step 2: Add a Testing block to the root guide**

In `AGENTS.md`, inside the fenced command block under **Development Commands**, after the Linting section:

```bash
# Testing
pnpm run test                        # Run every unit test suite
pnpm run test:affected               # Only the affected packages
pnpm run test:coverage               # Run with coverage (lcov per workspace)
```

Then add this bullet list under **Code Quality Tools**:

```markdown
- **Vitest** for unit tests, one `vitest.config.ts` per workspace
  - Tests live next to their source (`foo.ts` → `foo.test.ts`)
  - Import `describe`/`it`/`expect`/`vi` explicitly — `globals` is off on purpose
  - `apps/web` splits into a `node` and a `dom` (jsdom) project; component and hook tests land in `dom`
  - Shared helpers: `apps/web/test-utils/env.ts` (module cache + env vars), `apps/web/test-utils/fetch-mock.ts` (HTTP), `apps/web/test-utils/setup-dom.ts` (matchMedia and observer stubs)
  - External services are mocked at the `fetch` boundary, not at the module boundary; Resend is the one SDK mock
```

- [ ] **Step 3: Add the per-app notes**

In `apps/web/AGENTS.md`, add a `## Testing` section describing the two projects, the asset stub for image imports, and the three helpers. In `apps/studio/AGENTS.md`, add a `## Testing` section noting that schema tests call `preview.prepare` and `validation` functions directly on the exported definition objects, with no Sanity runtime.

- [ ] **Step 4: Verify the documented commands actually run**

Run: `pnpm run test && pnpm run test:affected && pnpm run test:coverage` Expected: all three succeed exactly as documented.

- [ ] **Step 5: Format and commit**

```bash
pnpm run format
but commit -b test/web-296-unit-tests \
  -m "docs: document the unit test setup and conventions"
```

---

### Task 13: Open the pull request

**Files:** none.

**Interfaces:**

- Consumes: every commit on `test/web-296-unit-tests`.
- Produces: a PR that closes the infra part of WEB-296.

- [ ] **Step 1: Final full verification**

Run: `pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run test && pnpm run build` Expected: everything green. Record the real test count from the output.

- [ ] **Step 2: Review the branch**

Run: `but branch show test/web-296-unit-tests` Expected: twelve commits (docs, shared, web node, web dom, helpers, studio, email, copy fix, turbo, ci, sonar, docs — count from the actual output).

- [ ] **Step 3: Push and open the PR**

Run: `but push` then open the PR against `next` with a body that lists: the four workspace setups, the two bugfixes with their reasoning, the test count, and a note that PRs 2–5 add the actual test coverage per the spec.

- [ ] **Step 4: Update the Linear ticket**

Add a comment on WEB-296 linking the PR and stating that this is PR 1 of 5.

---

## Self-Review

**Spec coverage:**

| Spec item (PR 1 section) | Task |
| --- | --- |
| Dependencies and versions | 2, 4, 6, 7 |
| Four workspace configs, `vite-tsconfig-paths`, project split | 2, 3, 4, 6, 7 |
| Asset stub for `.webp` imports | 3 |
| DOM setup (matchMedia, observers, next/image, next/navigation, motion mocks) | 4 — **partial**: only matchMedia and the observers ship here, because the module mocks have no consumer until PR 4's component tests. PR 4 owns them; noted in its plan. |
| Env helper | 5 |
| Fetch helper | 5 |
| Scripts, Turbo tasks | 9 |
| CI step | 10 |
| Coverage + Sonar rewiring | 9, 11 |
| Bugfix `date.ts` | 2 |
| Bugfix `überprüfe` | 8 |

Also covered beyond the spec: the `oxlint` test-file override (Task 2) and the AGENTS.md documentation (Task 12) — both required for the repo's own gates to stay green.

**Placeholder scan:** no `TBD`/`TODO`; every code step carries the actual code; the only "figure it out" steps are the two recorded numbers (test count) and two named fallbacks (the `matchMedia` per-query cache in Task 4 Step 4, the `TZ` handling in Task 6 Step 5), each with the concrete alternative spelled out.

**Type consistency:** `loadWithEnv` / `createFetchMock` / `createMatchMediaStub` / `dispatchMediaQueryChange` are used in Tasks 4 and 5 with the exact signatures their Interfaces blocks declare; `FetchCall` and `MockResponse` are exported from the same file that defines them.
