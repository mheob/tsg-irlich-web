# WEB-296 Unit Tests — PR 2 (Pure Logic) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cover every pure-logic module in `packages/shared` and `apps/web` with unit tests, on the infrastructure PR 1 built.

**Architecture:** Tests only — no production code changes except where a test uncovers a real bug, which is reported before it is fixed. Every file gets a co-located `*.test.ts` in the `node` project of its workspace. No React, no jsdom, no HTTP: modules that reach an external service belong to PR 3, components to PR 4.

**Tech Stack:** Vitest 4, `@vitest/coverage-v8`, Zod 4, `@sanity/image-url`, pnpm 11 workspaces, Turbo, GitButler CLI (`but`).

**Spec:** `docs/superpowers/specs/2026-08-25-web-296-unit-tests-design.md` (its "PR 2 — Pure Logik" section)

**Base branch:** `test/web-296-unit-tests` (PR 1, open as #471 against `next`). This work stacks on top of it, because every test here needs PR 1's Vitest setup. New branch: `test/web-296-unit-tests-pure-logic`.

## Global Constraints

- Node `^24.19.0`, pnpm `11.22.0` — `.nvmrc` and `packageManager` untouched.
- Tests live next to their source: `foo.ts` → `foo.test.ts`.
- Explicit imports from `vitest` — `describe`, `expect`, `it`, `vi`, and the hooks. No `globals: true`.
- `describe` titles start lowercase and must never be identical to an imported identifier (oxlint `vitest/prefer-lowercase-title`, `vitest/prefer-describe-function-title`). Use a phrase: `describe('shuffling an array', …)`, not `describe('shuffleArray', …)`.
- `beforeEach`/`afterEach`/`beforeAll`/`afterAll` sit INSIDE a `describe` block (`vitest/require-top-level-describe`).
- Never widen the test-file override in `oxlint.config.ts`. If a file needs a suppression, use a narrow inline comment.
- Every test file added by this PR belongs to the `node` project: it must be a `.test.ts` (never `.test.tsx`) and must not live under `apps/web/src/components/` or `apps/web/src/hooks/`.
- No new dependency. No change to any `vitest.config.ts`, `turbo.json`, CI file or `sonar-project.properties`.
- Commits through the GitButler CLI (`but commit -b test/web-296-unit-tests-pure-logic`), never `git commit`. Conventional Commits, no `Co-Authored-By`, no generator trailer.
- After every task: `pnpm run lint`, `pnpm run format:check`, `pnpm run typecheck` clean, and `pnpm run test` green. Format with `pnpm run format` (oxfmt). One pre-existing oxlint warning in `packages/shared/src/utils/promise.ts` is known and not ours.
- **Expected values are derived from the implementation, never from this plan's prose.** Where a case below states an expected value, verify it against the code first. If they disagree, that is a finding: report it prominently, write the assertion that reflects real behavior, and do not "fix" either side silently.
- **A test that only restates the implementation is worse than no test.** Never build an expected value by calling the same helper or importing the same constant the implementation uses (PR 1 hit exactly this with `GOOGLE_MAPS_URL`). Hard-code the literal.

## Already covered by PR 1 — do not duplicate

`packages/shared/src/utils/date.ts`, `apps/web/src/utils/typography.ts`, `apps/web/src/utils/url.ts` (both `getBaseUrl` and `printGoogleMapsLink`), `apps/web/src/hooks/use-media-query.ts`, `apps/studio/utils/time.ts`, `packages/email/lib/cleverreach-markers.ts`.

## Out of scope (later PRs)

`src/actions/**` and `src/lib/cleverreach.ts` (PR 3); components and hooks (PR 4); studio schemas and email templates (PR 5). Also permanently skipped, per the spec: `packages/shared/src/utils/jsx.ts`, every `index.ts` barrel, `src/lib/sanity/queries/**`, `src/lib/actions/safe-action.ts`, `src/lib/resend.ts`, `src/lib/sanity/client.ts`, `src/lib/sanity/live.ts`.

---

### Task 1: Branch

**Files:** commit this plan.

**Interfaces:**

- Consumes: nothing.
- Produces: branch `test/web-296-unit-tests-pure-logic`, stacked on `test/web-296-unit-tests`.

- [ ] **Step 1: Confirm the base**

Run: `but status` Expected: `test/web-296-unit-tests` applied, working tree clean.

- [ ] **Step 2: Create the stacked branch and commit the plan**

```bash
but commit -b test/web-296-unit-tests-pure-logic \
  -m "docs: add the pure logic test plan for WEB-296" \
  docs/superpowers/plans/2026-08-26-web-296-unit-tests-pr2-pure-logic.md
```

- [ ] **Step 3: Verify the stack**

Run: `but status` Expected: the new branch sits above `test/web-296-unit-tests`, holding one commit.

---

### Task 2: `packages/shared` — array, cn, promise

**Files:**

- Create: `packages/shared/src/utils/array.test.ts`
- Create: `packages/shared/src/utils/cn.test.ts`
- Create: `packages/shared/src/utils/promise.test.ts`

**Interfaces:**

- Consumes: PR 1's `packages/shared/vitest.config.ts` (node environment).
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Write `array.test.ts`**

`shuffleArray` is Fisher-Yates over a copy. Cases: returns a new array (`not.toBe` the input) with the same length; the input is not mutated; every member survives (compare sorted copies); an empty array and a single-element array come back equal; with `Math.random` stubbed to a fixed value the output order is deterministic — assert the exact resulting array, and derive that expectation by reasoning about the algorithm, not by running it and pasting whatever came out.

```ts
import { describe, expect, it, vi } from 'vitest';

import { shuffleArray } from './array';

describe('shuffling an array', () => {
	it('returns a new array', () => {
		const input = [1, 2, 3];
		expect(shuffleArray(input)).not.toBe(input);
	});

	it('leaves the input untouched', () => {
		const input = [1, 2, 3];
		shuffleArray(input);
		expect(input).toEqual([1, 2, 3]);
	});

	it('keeps every member', () => {
		expect([...shuffleArray([1, 2, 3, 4])].sort()).toEqual([1, 2, 3, 4]);
	});

	it('handles an empty array', () => {
		expect(shuffleArray([])).toEqual([]);
	});

	it('handles a single element', () => {
		expect(shuffleArray(['a'])).toEqual(['a']);
	});

	it('is deterministic when Math.random is fixed', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		// With random() === 0 every swap index is 0, so the loop rotates the array.
		expect(shuffleArray([1, 2, 3])).toEqual([3, 1, 2]);
		vi.restoreAllMocks();
	});
});
```

Before committing, verify that last expectation by hand against the loop in `array.ts`; if the real result differs, the comment and the expectation both change to match the code.

- [ ] **Step 2: Write `cn.test.ts`**

`cn` is `twMerge(clsx(inputs))`. Cases: plain strings join; a conditional object includes only truthy keys; `undefined`/`null`/`false` entries are dropped; nested arrays flatten; a later Tailwind class beats an earlier conflicting one (`cn('p-2', 'p-4')` → `'p-4'`); non-conflicting utilities both survive; no arguments → `''`.

- [ ] **Step 3: Write `promise.test.ts`**

`settle` never throws. Cases: a resolved promise gives `{ ok: true, value }`; a rejected promise gives `{ ok: false, error }` with the original error identity (`toBe`); a plain thenable resolves; a non-promise value passed through `Promise.resolve` resolves; rejection with a non-`Error` value (e.g. a string) is preserved as-is; the returned promise itself never rejects (`await expect(settle(Promise.reject(new Error('x')))).resolves.toMatchObject({ ok: false })`).

- [ ] **Step 4: Run the workspace suite**

Run: `pnpm --filter @tsgi-web/shared test` Expected: the three new files green alongside the existing `date.test.ts`.

- [ ] **Step 5: Gates and commit**

```bash
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-pure-logic -m "test(shared): cover the array, class name and promise utils"
```

---

### Task 3: `apps/web/src/utils/links.ts`

**Files:**

- Create: `apps/web/src/utils/links.test.ts`

**Interfaces:**

- Consumes: `getInternalHref(target: InternalLinkTarget | null | undefined): string | undefined`.
- Produces: nothing.

This module is the highest-value file in the PR: every internal link on the site resolves through it, and its branches are silent when wrong (a bad type returns `undefined` and the link disappears).

- [ ] **Step 1: Read the module and enumerate its branches**

Read `apps/web/src/utils/links.ts` and `apps/web/src/utils/groups.ts`. Note that `getGroupHref` resolves through `groupSections`, so a group type with no department page returns `undefined` by design.

- [ ] **Step 2: Write the test**

Cases, each asserting the exact string:

- `{ _type: 'home', slug: 'home' }` → `'/'`
- `{ _type: 'news.article', slug: 'sommerfest', category: 'verein' }` → `'/news/verein/sommerfest'`
- `{ _type: 'news.article', slug: 'sommerfest' }` (no category) → `undefined`
- `{ _type: 'news.category', slug: 'verein' }` → `'/news/verein'`
- a group type that has a department page, e.g. `{ _type: 'group.soccer', slug: 'herren-1' }` → `'/angebot/fussball/herren-1'`
- every one of the six group types in `groupSections` resolves to `'<department slug>/<slug>'` — write this as one `it` looping the array, asserting the prefix comes from that entry's `slug` field
- a `group.*` type that is NOT in `groupSections` (e.g. `{ _type: 'group.administration', slug: 'vorstand' }`) → `undefined`
- an unknown type, e.g. `{ _type: 'membership', slug: 'mitgliedschaft' }` → `'/mitgliedschaft'`
- `undefined` target, `null` target, `{}`, `{ _type: 'home' }` without slug, `{ slug: 'x' }` without type → all `undefined`
- `{ _type: 'news.article', slug: 'x', category: null }` → `undefined` (the `?? undefined` path)

- [ ] **Step 3: Run, gate, commit**

```bash
pnpm --filter web test src/utils/links.test.ts
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-pure-logic -m "test(web): cover the internal link resolution"
```

---

### Task 4: `apps/web/src/utils/groups.ts` and `icon.ts`

**Files:**

- Create: `apps/web/src/utils/groups.test.ts`
- Create: `apps/web/src/utils/icon.test.ts`

**Interfaces:**

- Consumes: `getOGImage`, `getGroupImage`, `getCurrentDepartment`, `groupSections`, `fallbackImage`; `getSocialMediaEntries`.
- Produces: nothing.

`groups.ts` imports `.webp` files — PR 1's `assetStub` plugin in `apps/web/vitest.config.ts` resolves those. If an import error appears, that is an infrastructure finding, not something to work around in the test.

- [ ] **Step 1: Write `groups.test.ts`**

- `getCurrentDepartment('fussball')` returns the entry whose `slug` is `/angebot/fussball`; `getCurrentDepartment('gibtsnicht')` returns `undefined`.
- `getGroupImage` with a slug that matches an entry returns that entry's image; with an unknown slug returns `fallbackImage` (assert `toBe(fallbackImage)`); the `path` parameter prefixes the lookup — cover both the default `''` and an explicit `'/angebot'`.
- `getOGImage('fussball')` returns `{ alt, height: 630, width: 1200, url }` where `url` ends in `/og/angebot/groups/fussball.webp` and `alt` is that group's image alt.
- `getOGImage('gibtsnicht')` falls back: url ends in `/og/angebot.webp` and `alt` is `fallbackImage.alt`.
- `getOGImage` builds its URL on `getBaseUrl()`, which reads the environment — use PR 1's helper, `loadWithEnv` from `apps/web/test-utils/env.ts`, exactly as `src/utils/url.test.ts` does, and import the module under test as `import type` only.
- `groupSections` itself: every entry has a slug starting `/angebot/`, a non-empty `alt`, and a unique `_type` (assert the set size equals the array length).

- [ ] **Step 2: Write `icon.test.ts`**

`getSocialMediaEntries` takes the Sanity `socialFields` object. Cases: `null` and `undefined` → `[]`; `{}` → `[]`; a known platform with a URL yields one entry with `name`, `url` and a defined `icon`; the meta key `_type` is skipped; a known platform whose URL is `undefined` or `''` is skipped; an unknown key is skipped; several platforms yield entries in object-key order. Read `apps/web/src/components/ui/social-media-icon.tsx` for the real keys of `socialMediaMap` rather than guessing them.

- [ ] **Step 3: Run, gate, commit**

```bash
pnpm --filter web test src/utils/groups.test.ts src/utils/icon.test.ts
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-pure-logic -m "test(web): cover the group and social media helpers"
```

---

### Task 5: `apps/web/src/lib/sanity/utils.ts`

**Files:**

- Create: `apps/web/src/lib/sanity/utils.test.ts`

**Interfaces:**

- Consumes: `getDownloadFileUrl`, `getFileSize`, `urlForImage`, `urlForImageMax`.
- Produces: the image-URL expectations Task 6 relies on — `getGalleryImages` mocks these two builders, so the real behavior is pinned here.

The module builds a Sanity image URL builder from `client`, which reads `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` at import time and throws if they are missing. Load the module through `loadWithEnv` with both set to fixed test values, and assert against those values.

- [ ] **Step 1: Write the file-helper cases**

- `getDownloadFileUrl(undefined)`, `(null)`, `({ url: 'x' })` without `originalFilename`, `({ originalFilename: 'x' })` without url → all `'#!'`.
- a complete asset → `'<url>?dl=<originalFilename>'`, asserted as a literal.
- `getFileSize`: `undefined`, `0` and a negative value → `'—'`; `512` → `'512 B'`; `1024` → `'1.0 KB'`; `1_572_864` → `'1.50 MB'`; a gigabyte-scale value → the `GB` unit; a value far beyond `GB` still reports `GB` (the loop stops at the last unit). Verify the decimal count per unit against the `toFixed(index)` in the implementation before writing the literals.

- [ ] **Step 2: Write the image-URL cases**

Assert on the query string, not on a whole URL string built the way the implementation builds it:

- `urlForImage(undefined)` and an image without `asset._ref` → `undefined`.
- height only → the URL carries `w` and `h` equal to that height, `fit=crop`, `q=90`.
- width and height → `w` and `h` as given, `fit=crop`.
- neither → `fit=max`, `q=90`, and no `w`/`h`.
- `urlForImageMax(image, 2560)` → `w=2560`, `fit=max`, no `h`.
- Parse with `new URL(...).searchParams` and assert per parameter; that survives a reordering of the builder's chain.

- [ ] **Step 3: Run, gate, commit**

```bash
pnpm --filter web test src/lib/sanity/utils.test.ts
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-pure-logic -m "test(web): cover the sanity file and image url helpers"
```

---

### Task 6: `apps/web/src/utils/image.ts`

**Files:**

- Create: `apps/web/src/utils/image.test.ts`

**Interfaces:**

- Consumes: `getInitials`, `getGalleryImages`; mocks `@/lib/sanity/utils` (pinned for real in Task 5).
- Produces: nothing.

- [ ] **Step 1: Write `getInitials` cases**

`('John', 'Doe')` → `'JD'`; `('jane', 'doe')` → `'JD'`; `('Jane', '')` → `'J?'`; `('', 'Doe')` → `'?D'`; `('', '')` → `'??'`; whitespace-only inputs → `'??'`; leading whitespace is trimmed before the first letter is taken; a non-ASCII first letter (e.g. `'Örs'`) upper-cases correctly.

- [ ] **Step 2: Write `getGalleryImages` cases**

Mock `@/lib/sanity/utils` with `vi.mock`, so `urlForImage` and `urlForImageMax` return predictable strings:

- `undefined` and `[]` → `[]`.
- one image → one entry carrying `alt`, `caption` from `description`, `key` from `_key`, `src` from `urlForImage` and `srcFull` from `urlForImageMax`.
- an image whose `urlForImage` returns `undefined` is dropped; likewise for `urlForImageMax`; a mixed list keeps only the resolvable entries and preserves their order.
- the `height`/`width` arguments are forwarded to `urlForImage` — assert on the mock's call arguments.
- `urlForImageMax` is always called with `2560` (the module's `FULL_IMAGE_WIDTH`); assert the literal, not the imported constant.
- an image without `description` yields `caption: undefined`.

- [ ] **Step 3: Run, gate, commit**

```bash
pnpm --filter web test src/utils/image.test.ts
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-pure-logic -m "test(web): cover the initials and gallery image helpers"
```

---

### Task 7: `apps/web/src/utils/time.ts` and `apps/web/src/lib/env.ts`

**Files:**

- Create: `apps/web/src/utils/time.test.ts`
- Create: `apps/web/src/lib/env.test.ts`

**Interfaces:**

- Consumes: `getLocaleDate`; `env`. Uses `loadWithEnv` from `apps/web/test-utils/env.ts`.
- Produces: nothing.

- [ ] **Step 1: Write `time.test.ts`**

`getLocaleDate(date, variant = 'long', locale = DEFAULT_LOCALE)` formats through `Intl.DateTimeFormat`.

- a `Date` in the default `'long'` variant → `'1. Januar 2024'` for `new Date('2024-01-01T12:00:00Z')`
- the same date in `'short'` → `'01.01.2024'`
- an ISO string input gives the same result as the equivalent `Date`
- an explicit locale (`'en-US'`) changes the output
- a date whose day is single-digit keeps the `2-digit` padding in `'short'` and no padding in `'long'`

ICU output can contain narrow no-break spaces. Normalize both sides with `.replaceAll(' ', ' ').replaceAll(' ', ' ')` before comparing, so an ICU update does not break the suite. The date fixtures must be timezone-safe: use midday UTC timestamps so no local zone shifts the calendar day.

- [ ] **Step 2: Write `env.test.ts`**

`env(key)` validates one variable at a time through Zod and caches the result in a module-level `Map`. Every case loads the module through `loadWithEnv` so the cache starts empty.

- a valid value comes back unchanged
- a missing required variable throws, and the message contains the key name
- a value failing its schema (e.g. `NEXT_PUBLIC_SANITY_STUDIO_URL` set to `'not-a-url'`) throws
- defaults apply: `NODE_ENV` unset → `'development'`; `NEXT_PUBLIC_SANITY_API_VERSION` unset → its default string
- `SANITY_API_READ_TOKEN` set to `''` → `undefined` (the `preprocess` path), and absent → `undefined`
- the cache holds: read a key, mutate `process.env` for that key afterwards, read again, and assert the first value is returned
- an optional variable that is absent returns `undefined` without throwing

- [ ] **Step 3: Run, gate, commit**

```bash
pnpm --filter web test src/utils/time.test.ts src/lib/env.test.ts
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-pure-logic -m "test(web): cover the date formatting and env access"
```

---

### Task 8: Zod validations

**Files:**

- Create: `apps/web/src/lib/validations/contact-form.test.ts`
- Create: `apps/web/src/lib/validations/feedback.test.ts`

**Interfaces:**

- Consumes: `contactFormSchema`, `contactFormWithReceiverSchema`, `feedbackFormSchema`.
- Produces: nothing.

Assert on `safeParse` results, and on the German messages — those messages are user-facing copy, and pinning them is half the value of these tests. Read each message from the schema rather than retyping it from memory.

- [ ] **Step 1: Write `contact-form.test.ts`**

- a complete valid payload parses, with and without `receiver`
- an invalid email fails with `'Die E-Mail Adresse ist ungültig.'`
- a message of 31 characters fails; exactly 32 passes (test the boundary on both sides)
- a name of 1 character fails; 2 passes
- `privacy: false` fails; `privacy: true` passes
- `receiver` with a bad email fails with the receiver message; `receiver` missing passes in `contactFormSchema`
- `contactFormWithReceiverSchema` rejects the same payload when `receiver` is absent, and accepts it when present — one `it` proving the two schemas differ in exactly that way

- [ ] **Step 2: Write `feedback.test.ts`**

- a minimal valid payload (only the required fields) parses
- `title`: 4 characters fails, 5 passes, 100 passes, 101 fails — with the documented messages
- `description`: 19 fails, 20 passes, 2000 passes, 2001 fails
- `email`: a valid address passes; `''` passes (the `.or(z.literal(''))` path); an invalid address fails; the field absent passes
- each of `browser`, `operationSystem` and `type` rejects an unknown value; `type` missing produces `'Bitte wähle einen Typ aus'`
- `privacy: false` fails
- `screenshotUrls` accepts an empty array, a populated array, and is optional

- [ ] **Step 3: Run, gate, commit**

```bash
pnpm --filter web test src/lib/validations
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-pure-logic -m "test(web): cover the contact and feedback form schemas"
```

---

### Task 9: Close out

**Files:** none.

- [ ] **Step 1: Full verification**

Run: `pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run test && pnpm run build` Expected: all green. Record the new test total.

- [ ] **Step 2: Coverage snapshot**

Run: `pnpm run test:coverage` Expected: green. Note the line coverage for `packages/shared/src/utils` and `apps/web/src/utils` — the PR description quotes it, and it is the number the eventual coverage-threshold ticket will start from.

- [ ] **Step 3: Report**

Summarize for the pull request: the files covered, the new test total, the coverage figures, and every disagreement found between this plan's expected values and real behavior. Pushing the branch, opening the PR against `test/web-296-unit-tests` and commenting on the Linear ticket are the user's call, not this plan's.

---

## Self-Review

**Spec coverage:** every file in the spec's "PR 2 — Pure Logik" section maps to a task — `packages/shared` array/cn/promise (Task 2, `date.ts` done in PR 1), `typography` and `url` already done in PR 1, `links` (3), `groups` and `icon` (4), `sanity/utils` (5), `image` (6), `time` and `env` (7), both validation schemas (8). The spec's skip list is reproduced verbatim under "Out of scope".

**Placeholder scan:** no TBD/TODO. Task 2 carries literal code; Tasks 3-8 carry enumerated cases with their expected values, which is the right grain for files whose assertions are one line each — and every task is bound by the Global Constraint that expected values are verified against the implementation before being written.

**Type consistency:** `loadWithEnv` (Tasks 4, 5, 7) and the `vi.mock` of `@/lib/sanity/utils` (Task 6) match what PR 1 shipped; `FULL_IMAGE_WIDTH` is asserted as the literal `2560` rather than imported, per the anti-tautology constraint.
