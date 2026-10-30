# Website-Suche, Paket 2: „Häufig gesucht“ aus echten Suchen (WEB-204) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** „Häufig gesucht“ fills itself from real searches. Counting is anonymous, only words from page titles and search terms can appear, and the editors' pinned and blocked terms win.

**Architecture:**

- The browser reports a search with a beacon to `POST /api/search/count`. That happens when `/suche` shows the first page of a search, and when a hit in the panel is clicked.
- The route keeps only terms that occur as whole words in a page title or a search term, and adds one to a per-day sorted set in Upstash Redis. One database serves every environment, with the environment as key prefix.
- `getPopularSearches()` from Paket 1 merges the pinned terms with the counts of the last 30 days, filtered again, and is cached for an hour.
- Without Redis credentials (local, end-to-end, an outage) everything falls back to the pinned terms.

**Tech Stack:** Upstash Redis through the Vercel Marketplace (free plan), `@upstash/redis`, Next.js 16 route handlers, Vitest with `createFetchMock` at the REST boundary.

**Spec:** `docs/superpowers/specs/2026-10-30-web-204-site-search-design.md`, sections „Häufig gesucht“, „Speicher für die Zähler“ and „Datenschutz“. **Prerequisite:** Paket 1 (`docs/superpowers/plans/2026-10-30-web-204-site-search.md`) is merged into `next`.

**Branch:** `feat/web-204-popular-searches`.

## Global Constraints

- Every Paket 1 constraint applies.
- **Stored:** the normalized, lowercased term and a counter per day. Never an IP, a cookie, a session id, a user agent or a term that fails `isEligibleTerm`.
- **Keys:** `search:<VERCEL_ENV or 'development'>:day:<YYYY-MM-DD>`, the day in `Europe/Berlin`. Each key expires after 31 days (`2678400` s).
- **Thresholds:**
  - `POPULAR_MIN_COUNT = 3` within `POPULAR_WINDOW_DAYS = 30`
  - at most `POPULAR_SEARCHES_LIMIT = 8` terms in all, pinned ones included
  - the list is cached for 3600 s
- **Counting must never be visible:** `POST /api/search/count` answers `204` in every case, a store error included.
- **Account changes need the user:** Provisioning the integration, changing environment variables in Vercel, writing the privacy text and every Linear write need the user's explicit OK, or the user does them.

## Review Focus

1. **A person's or a child's name, or a news headline word, is searched many times.** It is never stored and never listed. Tests: Task 3 and Task 4.
2. **Redis unreachable, the monthly quota used up, or no credentials.** Search, panel and page keep working, the list shows the pinned terms, and the beacon still gets `204`. Tests: Task 4 and Task 6.
3. **A term that was eligible when counted, but whose page title was renamed or whose search term was removed since.** It drops out of the list at the next refresh. Test: Task 6.
4. **The same term pinned and counted, or counted in different casing** („Tanzen“, „tanzen“). It appears once, pinned first, in the casing of the title. Test: Task 6.
5. **A page reload or a prefetch of `/suche?q=…`.** A prefetch never counts. A reload counts again, which the spec accepts. Test: Task 5.

---

### Task 0: Provision Upstash (runbook, user)

- [ ] **Step 1: Add the integration „Upstash for Redis“.** The user does this, or approves it, in the Vercel dashboard of the team „mheob's projects“: Integrations → Marketplace.
  - Plan „Free“, no payment method.
  - Region Frankfurt (`eu-central-1`) if offered, otherwise the nearest EU region.
  - Connect it to the project `tsg-irlich-web` for Production, Preview and Development.
- [ ] **Step 2: If the dialog offers no free plan, stop here.** The user decides on the Sanity fallback (see the end of this plan).
- [ ] **Step 3: Read the names of the environment variables** the integration created, in the project settings or with `vercel env ls` (names only, never values). Expected: `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Use the actual names in Task 1.
- [ ] **Step 4: The club decides** whether it wants a data processing agreement with Upstash. Note the answer in the PR.

### Task 1: Dependency and environment

**Files:**

- Modify: `apps/web/package.json` and `pnpm-workspace.yaml`: `pnpm --filter web add @upstash/redis` writes the catalog entry.
- Modify: `apps/web/src/lib/env.ts`, `turbo.json` (`globalEnv`), root `AGENTS.md` (variable list)
- Test: `apps/web/src/lib/env.test.ts`

**Interfaces:**

- Produces: `env('KV_REST_API_URL')` and `env('KV_REST_API_TOKEN')` as `string | undefined` (optional URL and string), and `env('VERCEL_ENV')` as `'production' | 'preview' | 'development' | undefined`.

- [ ] **Step 1: Write the failing test.**
  - Unset variables give `undefined` without throwing.
  - `VERCEL_ENV=staging` throws, because it is not one of the three.
- [ ] **Step 2: Run it and verify it fails.** Run `pnpm --filter web exec vp test run src/lib/env`. Expected: FAIL.
- [ ] **Step 3: Add the three schemas.** Register the variables in `globalEnv` and in the root `AGENTS.md`.
- [ ] **Step 4: Run it and verify it passes.** Run the same command, then `pnpm run cve`. Expected: PASS, no new advisory.
- [ ] **Step 5: Commit** `chore(web): add upstash redis`.

### Task 2: Counter store

**Files:**

- Create: `apps/web/src/lib/search/counter-store.ts`
- Test: `apps/web/src/lib/search/counter-store.test.ts`

**Interfaces:**

- Produces:
  - `interface SearchCounterStore { increment(term: string, day: string): Promise<void>; topTerms(days: string[]): Promise<{ count: number; term: string }[]> }`
  - `getSearchCounterStore(): SearchCounterStore | null`: `null` when URL or token is missing.
  - `getBerlinDay(date: Date): string`: `YYYY-MM-DD` in `Europe/Berlin`.
  - `getLastDays(today: Date, count: number): string[]`

Decisions:

- `increment` runs one pipeline: `ZINCRBY <key> 1 <term>`, then `EXPIRE <key> 2678400`.
- `topTerms` runs `ZUNION <n> <keys…> WITHSCORES` and maps the result to sorted pairs. Check the method signature in the installed `@upstash/redis`.

- [ ] **Step 1: Write the failing tests** with `createFetchMock`, asserting the REST bodies Upstash receives:
  - `increment('tanzen', '2026-11-02')` sends the pipeline with key `search:preview:day:2026-11-02` when `VERCEL_ENV=preview`, and `search:development:day:…` when it is unset.
  - `topTerms` over two days sends one `ZUNION` with both keys and returns `[{ term: 'tanzen', count: 5 }]` from a canned response.
  - Missing credentials give `null`.
  - `getBerlinDay(new Date('2026-10-31T23:30:00Z'))` gives `'2026-11-01'`. Berlin is UTC+1 on that date.
  - `getLastDays` gives 30 consecutive days, ending today.
- [ ] **Step 2: Run them and verify they fail.** Run `pnpm --filter web exec vp test run src/lib/search/counter-store`. Expected: FAIL.
- [ ] **Step 3: Implement** with `new Redis({ url, token })` from `@upstash/redis`.
- [ ] **Step 4: Run them and verify they pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): add search counter store`.

### Task 3: Eligible terms

**Files:**

- Create: `apps/web/src/lib/search/vocabulary.ts`
- Modify: `apps/web/src/lib/sanity/queries/search.ts` (new `searchVocabularyQuery`)
- Test: `apps/web/src/lib/search/vocabulary.test.ts`

**Interfaces:**

- Produces:
  - `searchVocabularyQuery`: the titles of `department`, `group` and the ten singletons of `SEARCH_PAGE_TYPES`, plus every `searchTerms[]` of departments and groups, as one flat string array. No news, no persons, no FAQs, no Echo issues.
  - `getSearchVocabulary(): Promise<string[]>`: `client.fetch`, published, tags `department`, `group` and the singleton types.
  - `isEligibleTerm(term: string, vocabulary: string[]): boolean`: true when the words of `term` (`getSearchWords`) occur as consecutive whole words in the words of one vocabulary entry.
  - `toDisplayTerm(term: string, vocabulary: string[]): string`: the matching words in the casing of the first vocabulary entry that contains them.

- [ ] **Step 1: Write the failing tests** with the vocabulary `['Tanzen', 'Magic Diamonds', '1. Mannschaft', 'Erste Mannschaft', 'Mitgliedschaft']`:

  | Call                                  | Expected           |
  | ------------------------------------- | ------------------ |
  | `isEligibleTerm('diamonds', …)`       | true               |
  | `isEligibleTerm('magic diamonds', …)` | true               |
  | `isEligibleTerm('diam', …)`           | false              |
  | `isEligibleTerm('diamonds magic', …)` | false              |
  | `isEligibleTerm('alina kaap', …)`     | false              |
  | `isEligibleTerm('1. mannschaft', …)`  | true               |
  | `isEligibleTerm('', …)`               | false              |
  | `toDisplayTerm('magic diamonds', …)`  | `'Magic Diamonds'` |

  The query test pins that `searchVocabularyQuery` names neither `news.article` nor `person`.

- [ ] **Step 2: Run them and verify they fail.** Run `pnpm --filter web exec vp test run src/lib/search/vocabulary src/lib/sanity/queries/search`. Expected: FAIL.
- [ ] **Step 3: Implement** the query, then run `pnpm run typegen:sanity`, then the functions.
- [ ] **Step 4: Run them and verify they pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): restrict popular searches to page vocabulary`.

### Task 4: `POST /api/search/count`

**Files:**

- Create: `apps/web/src/app/api/search/count/route.ts`
- Test: `apps/web/src/app/api/search/count/route.test.ts`

**Interfaces:**

- Consumes: `normalizeSearchInput`, `getSearchWords`, `getSearchVocabulary`, `isEligibleTerm`, `getSearchCounterStore`, `getBerlinDay`.
- Produces: `POST` with a JSON body `{ "term": string }` answers `204` with no body, always.
  - Bodies over 1 KB are ignored.
  - A non-JSON body is ignored.
  - An eligible term is stored as `getSearchWords(normalized).join(' ')` for today. Await the store with `settle()`, and on failure log one `console.warn` without the term.

- [ ] **Step 1: Write the failing tests** with a fake store:

  | Body                                       | Expected                       |
  | ------------------------------------------ | ------------------------------ |
  | `{"term":"Tanzen"}`                        | `increment('tanzen', <today>)` |
  | `{"term":"Alina Kaap"}`                    | nothing stored                 |
  | `{"term":"a"}`                             | nothing stored                 |
  | `not json`                                 | nothing stored                 |
  | `{"term":"Tanzen"}` while the store throws | still `204`                    |
  | `{"term":"Tanzen"}` with no store          | `204`                          |

- [ ] **Step 2: Run them and verify they fail.** Run `pnpm --filter web exec vp test run src/app/api/search/count`. Expected: FAIL.
- [ ] **Step 3: Implement** the route.
- [ ] **Step 4: Run them and verify they pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): count searches`.

### Task 5: Reporting from the browser

**Files:**

- Create: `apps/web/src/components/with-logic/search/count-search.ts`, `apps/web/src/components/with-logic/search/search-counter.tsx`
- Modify: `apps/web/src/components/with-logic/search/search-panel.tsx`, `apps/web/src/app/suche/page.tsx`
- Test: `count-search.test.ts`, `search-counter.test.tsx`, `search-panel.test.tsx`, `apps/web/src/app/suche/page.test.tsx`

**Interfaces:**

- Produces:
  - `countSearch(term: string): void`: sends `navigator.sendBeacon('/api/search/count', new Blob([JSON.stringify({ term })], { type: 'application/json' }))`, falling back to `fetch(…, { keepalive: true, method: 'POST' })` without `sendBeacon`.
  - `SearchCounter({ term })` (`'use client'`): calls `countSearch` once after mount. A ref guards against the second effect run in development. It renders nothing.

Decisions:

- `/suche` renders `SearchCounter` only when `q` is usable, `typ` is missing and `seite` is missing. So tab changes and paging do not count again, and a prefetch, which mounts nothing, never counts.
- The panel calls `countSearch(input)` when an option is chosen by click or Enter. Enter without an option leads to `/suche`, which counts there.

- [ ] **Step 1: Write the failing tests.**
  - `countSearch` uses `sendBeacon` when present and `fetch` with `keepalive` otherwise.
  - `SearchCounter` sends exactly one beacon across a re-render.
  - The page renders the counter for `?q=Tanzen` and not for `?q=Tanzen&seite=2`, `?q=Tanzen&typ=news` or `?q=a`.
  - Clicking an option in the panel sends one beacon with the input.
- [ ] **Step 2: Run them and verify they fail.** Run `pnpm --filter web exec vp test run src/components/with-logic/search src/app/suche`. Expected: FAIL.
- [ ] **Step 3: Implement** the reporting.
- [ ] **Step 4: Run them and verify they pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): report searches anonymously`.

### Task 6: Popular searches from the counts

**Files:**

- Modify: `apps/web/src/lib/search/popular.ts`, `apps/web/src/lib/search/constants.ts`
- Test: `apps/web/src/lib/search/popular.test.ts`

**Interfaces:**

- `getPopularSearches(): Promise<{ title: string; terms: string[] }>` keeps its signature from Paket 1.

Decisions:

- The order is the pinned terms first (without the blocked ones), then the counted terms. A counted term must pass all of these:
  - count ≥ `POPULAR_MIN_COUNT`
  - still `isEligibleTerm` against today's vocabulary
  - not blocked
  - not already pinned, compared case-insensitively

  Counted terms are sorted by count descending, then alphabetically. Each is shown with `toDisplayTerm`. The list stops at `POPULAR_SEARCHES_LIMIT`.

- The function is wrapped in `unstable_cache` (key `['popular-searches']`, `revalidate: 3600`, tags `['searchPage']`). Check `node_modules/next/dist/docs` for the cache API this Next.js version recommends without `cacheComponents`. `/api/search/popular` keeps its `revalidate = 3600`.
- A missing store or a failed `topTerms` (`settle()`) gives the pinned terms only.

- [ ] **Step 1: Write the failing tests** with a fake store and a mocked vocabulary:
  - The pinned term „Mitgliedschaft“ and the counted terms `tanzen: 5`, `diamonds: 3`, `kaap: 9` give `['Mitgliedschaft', 'Tanzen', 'Diamonds']`. `kaap` is not eligible.
  - `diamonds: 2` is left out.
  - A blocked „Tanzen“ is left out even with count 9.
  - Pinned „Tanzen“ and counted `tanzen: 7` give one „Tanzen“.
  - The vocabulary without „Magic Diamonds“ drops `diamonds`.
  - A failing store gives the pinned terms.
  - Twelve candidates give eight.
- [ ] **Step 2: Run them and verify they fail.** Run `pnpm --filter web exec vp test run src/lib/search/popular`. Expected: FAIL.
- [ ] **Step 3: Implement** `getPopularSearches`.
- [ ] **Step 4: Run them and verify they pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): build popular searches from counts`.

### Task 7: End-to-end and documentation

**Files:**

- Modify: `apps/web/e2e/specs/search.spec.ts`, `apps/web/AGENTS.md`, root `AGENTS.md`

- [ ] **Step 1: Check the end-to-end setup.** `.env.e2e` defines no Redis variables, so nothing reaches Upstash and `preload.ts` needs no new branch.
- [ ] **Step 2: Add a case to the search spec:** submitting a search sends a `POST /api/search/count` that answers `204`. Wait for the request with `page.waitForRequest`.
- [ ] **Step 3: Document the counting in the „Site search“ section of `apps/web/AGENTS.md`:**
  - what is stored, and what never is
  - the key schema and the expiry
  - the vocabulary rule and why it excludes news titles
  - the fallback without Redis
  - that `.env.e2e` deliberately has no credentials
- [ ] **Step 4: Run `pnpm --filter web run test:e2e` and `pnpm run format:check`.** Expected: PASS.
- [ ] **Step 5: Commit** `docs: describe popular searches`.

### Task 8: Privacy, pull request and rollout (runbook)

- [ ] **Step 1: Hand the privacy sentence of the spec to the user.** The editors add it to the singleton „Datenschutz“ in `production` and `development`, or the user approves a write.

  > Wenn du die Suche auf unserer Website nutzt, speichern wir den Suchbegriff ohne Bezug zu deiner Person, also ohne IP-Adresse und ohne Cookie, und zählen, wie oft er gesucht wurde. Daraus entsteht die Liste „Häufig gesucht“. Die Zählungen löschen wir nach etwa einem Monat.

  It goes live no later than the code.

- [ ] **Step 2: Run the full check:** `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:coverage`. Expected: green, thresholds held.
- [ ] **Step 3: Open the PR** through `create-pr`, with `Closes WEB-204`. Bind it and turn on Auto-fix.
- [ ] **Step 4: On staging,** search three times for „Tanzen“. In the Upstash data browser, check that `search:preview:day:<today>` holds `tanzen` with a score of 3, and that a search for a person's name left no entry. The list itself refreshes within the hour.

## Fallback without the free plan: Sanity

Only if Task 0 stops at step 2 and the user chooses Sanity.

Replace Task 2 by `SanitySearchCounterStore`, which implements the same `SearchCounterStore` interface with `getWriteClient()`:

- One document per environment and day: `_id` `searchCounter.<env>.<YYYY-MM-DD>`, `_type` `searchCounter`.
- An array `counts[] { _key, term, count }`. `_key` is a stable hash of the term.
- `increment`:
  1. `createIfNotExists`
  2. `setIfMissing`
  3. `insert` of the term if it is missing
  4. `inc({ 'counts[_key=="<key>"].count': 1 })`

  All four go into one transaction.

- `topTerms` reads the documents of the given days and sums them up.
- Documents older than 31 days are deleted by `getPopularSearches` on its hourly run.
- The type gets a hidden schema in the studio. It stays out of `REVALIDATION_MAP`, the webhook filter, the desk and every `sanityFetch`.

Every other task stays as written. Task 1 then adds no Redis variables.
