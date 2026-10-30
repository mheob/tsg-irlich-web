# Website-Suche, Paket 1 (WEB-204) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A search icon in the navigation opens a search panel, and `/suche?q=` lists every hit. Both are fed by a server-side GROQ full-text search over news, departments, groups, single pages, TSG-Echo issues, FAQs and contact persons. Editors maintain the search page in a new singleton and synonyms in a new „Suchbegriffe“ field.

**Architecture:**

- Studio first: the `searchTerms` field, the `searchPage` singleton, then one typegen.
- The web app gets a pure search core in `src/lib/search/`: input normalization, highlighting, thumbnails and the merge of person and FAQ hits into their pages. `searchSite()` runs two GROQ queries, one for the "Seiten" candidates and one for news, plus one query for the snippet texts of the hits it returns.
- `/suche` calls `searchSite()` in a server component. The panel calls it through `GET /api/search`.
- The panel is a lazily loaded Base UI `Dialog` with a listbox for keyboard navigation.
- Runbook tasks at the end cover the content in `development`, the webhook filter, the end-to-end fixtures and the screenshots.

**Tech Stack:** Sanity Studio (`defineField`), Next.js 16 App Router, next-sanity (`defineQuery`, `client.fetch`), GROQ `text::query`/`score`/`boost`, Base UI `Dialog`, Vitest via `vp test`, Playwright with axe.

**Spec:** `docs/superpowers/specs/2026-10-30-web-204-site-search-design.md`, with the mockups in `docs/superpowers/specs/2026-10-30-web-204-mockups/`. Read both before Task 1. This plan only adds the decisions the spec leaves open. Paket 2 (automatic „Häufig gesucht“) is `docs/superpowers/plans/2026-10-30-web-204-popular-searches.md` and starts after this plan is merged.

**Branch:** `feat/web-204-site-search`. With GitButler: `but branch new feat/web-204-site-search`. Commits go through the `create-commit` skill. Run `pnpm run format:check` at the root before every `but commit`.

## Global Constraints

- Every studio `title` and `description` and every visible string on the website is German. Code, comments and test names are English.
- Schemas use `defineType` / `defineField` / `defineArrayMember` from `sanity`.
- Web components are function declarations with named exports. Wrap props in `Readonly<…>`. No `try`/`catch`/`finally` in components or hooks; await with `settle()` from `@tsgi-web/shared`.
- `'use client'` only in `src/components/with-logic/**` and colocated `_sections`.
- Tests import from `vite-plus/test` and assert what a user observes (role, accessible name, text, href), never class names or `data-testid`.
- After a schema or query change, run from the root: `pnpm run extract-types && pnpm run typegen:sanity`. After adding a route: `pnpm --filter web run typegen:routes`.
- Coverage thresholds in every `vitest.config.ts` stay where they are or go up.
- **Every write to a Sanity dataset, every webhook change and every Linear write needs an explicit OK from the user in chat first.** Show the command or payload and wait for the yes.
- The search term reaches GROQ only as the parameter `$q`, never through string concatenation.
- Search reads only published content: `perspective: 'published'` on every search fetch, also while draft mode is on.
- A hit without an href (`getInternalHref` returns `undefined`) is dropped, never rendered.
- Numbers fixed by the spec (`src/lib/search/constants.ts`):

  | Constant                 | Value |
  | ------------------------ | ----- |
  | `SEARCH_MIN_LENGTH`      | 2     |
  | `SEARCH_MAX_LENGTH`      | 100   |
  | `SEARCH_DEBOUNCE_MS`     | 250   |
  | `PANEL_HITS_PER_GROUP`   | 3     |
  | `ALL_TAB_PAGE_HITS`      | 6     |
  | `ALL_TAB_NEWS_HITS`      | 3     |
  | `HITS_PER_PAGE`          | 10    |
  | `SNIPPET_LENGTH`         | 160   |
  | `CANDIDATE_LIMIT`        | 100   |
  | `POPULAR_SEARCHES_LIMIT` | 8     |

- Weights (`WEIGHTS` in the same file):

  | Weight        | Value | Fields                                                        |
  | ------------- | ----- | ------------------------------------------------------------- |
  | `title`       | 10    |                                                               |
  | `searchTerms` | 8     |                                                               |
  | `lead`        | 3     | intro, subtitle, group description, FAQ question, person name |
  | `body`        | 1     | everything else, including person role and task description   |

- Copy fixed by this plan:

  | Where          | Text                                                             |
  | -------------- | ---------------------------------------------------------------- |
  | Lupe           | `aria-label` „Suche öffnen“                                      |
  | Panel          | dialog title (visually hidden) „Website durchsuchen“             |
  | Panel          | input label (visually hidden) „Suchbegriff“                      |
  | Panel          | close button „Suche schließen“                                   |
  | Panel and page | group headings „Seiten“ and „News“                               |
  | Panel          | more links „Alle {n} Seiten anzeigen“ / „Alle {n} News anzeigen“ |
  | Panel          | loading (live region) „Suche läuft …“                            |
  | Panel          | no hit „Keine Treffer für „{q}“.“                                |
  | Page           | submit button „Suchen“                                           |
  | Page           | summary „{n} Treffer für „{q}““                                  |
  | Page           | tabs „Alle“, „Seiten“, „News“, each with its count               |
  | Page           | tabs `nav` label „Trefferart“                                    |
  | Page           | link under the news of „Alle“: „Alle {n} News-Treffer anzeigen“  |
  | Hit meta       | department „Abteilung“                                           |
  | Hit meta       | group „Gruppe · {Abteilung}“                                     |
  | Hit meta       | single page „Seite“                                              |
  | Hit meta       | Echo „TSG-Echo“                                                  |
  | Hit meta       | news „{TT.MM.JJJJ} · {Kategorie}“                                |
  | Person snippet | „Ansprechperson: {Vorname Nachname}, {Rolle}“                    |
  | FAQ snippet    | „Frage: {Frage}“                                                 |

  Fallbacks while the singleton is missing:
  - placeholder „Wonach suchst du?“
  - popular heading „Häufig gesucht“
  - page title „Suche“

## Review Focus

1. **Input that is nothing but operators, punctuation or whitespace** (`-`, `"`, `*`, `  `, `a`). No query reaches Sanity. The panel shows „Häufig gesucht“, the page shows its empty state. Tests: Task 3 (`toTextQuery`), Task 6 (route answers without fetching).
2. **A group whose department has no slug, or `production` before the WEB-384 migration** (no `department` documents, groups with a string department). Such hits are dropped silently, never a crash or a link to `undefined`. Test: Task 5.
3. **A non-indexable TSG-Echo issue** whose text, but not title, contains the term. It is not a hit. Matching by title, it is a hit without a snippet. Tests: Task 4 (verification against `development`), Task 5.
4. **Typing fast, with responses arriving out of order.** An older response never replaces the results of a newer input. Test: Task 9.
5. **`/suche?q=…&seite=` beyond the last page, or a `typ` that does not exist.** A page beyond the last answers 404 like `/news`, an unknown `typ` falls back to „Alle“. Test: Task 8.

---

### Task 0: Branch (runbook)

- [ ] Create the branch: `but branch new feat/web-204-site-search`.
- [ ] Move WEB-204 to „In Progress“ only after the user's OK.

### Task 1: Studio — „Suchbegriffe“ on department and group

**Files:**

- Create: `apps/studio/shared/fields/search-terms.ts`
- Modify: `apps/studio/schemas/documents/department.ts`, `apps/studio/schemas/documents/group.ts`
- Test: `apps/studio/schemas/documents/department.test.ts`, `apps/studio/schemas/documents/group.test.ts`

**Interfaces:**

- Produces: the field `searchTerms: string[]` on `department` and `group`.

- [ ] **Step 1: Write the failing tests.**
  - In both test files, `it('offers search terms right after the title')`:
    - The field name after `title` is `searchTerms`.
    - The field is `{ type: 'array', title: 'Suchbegriffe', options: { layout: 'tags' } }` with `of[0].type === 'string'`.
  - Update the field-name list in `group.test.ts` („keeps the former sport group fields …“) to contain `searchTerms` after `title`.
- [ ] **Step 2: Run the tests and verify they fail.** Run `pnpm --filter studio exec vp test run schemas/documents`. Expected: the new cases FAIL.
- [ ] **Step 3: Implement `searchTermsField` and place it after `title` in both schemas.** Description, verbatim:

  > Weitere Begriffe, unter denen die Website-Suche diese Seite findet, etwa „Erste Mannschaft“ für „1. Mannschaft“ oder „Fussball“ für „Fußball“. Sie erscheinen nicht auf der Website.

  No group, no validation.

- [ ] **Step 4: Run the tests and verify they pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(studio): add search terms to departments and groups`.

### Task 2: Studio — singleton `searchPage`, then typegen

**Files:**

- Create: `apps/studio/schemas/single-pages/search-page.ts`, `apps/studio/schemas/single-pages/search-page.test.ts`. Not `search.ts`: `search.test.ts` already exists and tests the studio's link search.
- Modify: `apps/studio/schemas/index.ts`, `apps/studio/plugins/index.ts` (both lists, `pageStructure` and `singletonPlugin`)
- Generated: `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`

**Interfaces:**

- Produces: document type `searchPage` with these fields:
  - `slug`, fixed to `suche`
  - `title`, `subtitle`, `heroImage`, `meta`
  - `content.searchSection { title, subtitle, intro, placeholder }`
  - `content.noResults { title, text, links[] }`
  - `content.popularSearches { title, pinnedTerms[], blockedTerms[] }`
  - `content.contactPersonsSection`

- [ ] **Step 1: Write the failing test `search-page.test.ts`**, in the style of `echo-overview.test.ts`:
  - fixes its slug to `suche` (`initialValue: { current: 'suche' }`, `readOnly: true`)
  - top-level field names are `['slug', 'title', 'subtitle', 'heroImage', 'meta', 'content']`
  - the content fields are `['searchSection', 'noResults', 'popularSearches', 'contactPersonsSection']`
  - `searchSection` holds `placeholder` (`type: 'string'`)
  - `noResults.links` is an array of `navigationLink`
  - `popularSearches.pinnedTerms` and `blockedTerms` are string arrays with `layout: 'tags'`
  - `preview.prepare()` returns `{ title: 'Suche' }`
  - Stub `NamedImageInput` as `apps/studio/AGENTS.md` describes, because `metaField` pulls it in.
- [ ] **Step 2: Run the test and verify it fails.** Run `pnpm --filter studio exec vp test run schemas/single-pages/search-page`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `searchPage`** after `news-overview.ts` and `membership.ts`:
  - `getHiddenSlugField('suche')`, `...defaultHeroFields`, `getHeroImageField(LANDSCAPE_HERO_DESCRIPTION)`, `metaField`.
  - `content` (group `content`, required, icon `RiLinksLine`) with sub-groups `searchSection` „Suchbereich“, `noResults` „Keine Treffer“, `popularSearches` „Häufig gesucht“, `contactPersons` „Ansprechpartner“.
  - Document icon `RiSearchLine`, `title: 'Suche'`, `preview: getSinglePagePreview('Suche')`.

  Fields:

  | Field | Title | Notes |
  | --- | --- | --- |
  | `searchSection` | Suchbereich | `getDefaultPageSectionFieldsWithGroup()` as in `membership.ts`, plus `placeholder` (see below) |
  | `searchSection.placeholder` | Platzhalter im Suchfeld | string, required, max 60. Description: „Erscheint im Suchfeld der Suchseite und des Such-Panels in der Navigation.“ |
  | `noResults.title` | Überschrift | string, required |
  | `noResults.text` | Text | `simpleBlockContent` |
  | `noResults.links` | Links | array of `navigationLink`, max 6 |
  | `popularSearches.title` | Überschrift | string, `initialValue: 'Häufig gesucht'` |
  | `popularSearches.pinnedTerms` | Immer anzeigen | string array, tags. Description below |
  | `popularSearches.blockedTerms` | Nie anzeigen | string array, tags. Description below |
  | `contactPersonsSection` |  | `contactPersonsSectionField` |

  Description of `pinnedTerms`, verbatim:

  > Diese Begriffe stehen immer in der Liste „Häufig gesucht“, vor den automatisch ermittelten. Solange noch zu wenige Suchen gezählt sind, füllen sie die Liste allein.

  Description of `blockedTerms`, verbatim:

  > Diese Begriffe erscheinen nie in „Häufig gesucht“, auch wenn sie oft gesucht werden.

- [ ] **Step 4: Register the type.**
  - Add `searchPage` to `schemaTypes`.
  - Add it to both lists in `plugins/index.ts`, after `newsOverviewCategoryPage`.
- [ ] **Step 5: Run the test and the typegen.**
  - Run `pnpm --filter studio exec vp test run schemas/single-pages`. Expected: PASS.
  - Then run `pnpm run extract-types && pnpm run typegen:sanity`. Expected: `SearchPage` appears in `sanity.types.generated.ts`, and `Department` and `Group` carry `searchTerms?: Array<string>`.
- [ ] **Step 6: Commit** `feat(studio): add search page singleton`.

### Task 3: Web — input normalization and highlighting

**Files:**

- Create: `apps/web/src/lib/search/constants.ts`, `apps/web/src/lib/search/query.ts`, `apps/web/src/lib/search/highlight.ts`
- Test: `apps/web/src/lib/search/query.test.ts`, `apps/web/src/lib/search/highlight.test.ts`

**Interfaces:**

- Produces:
  - `normalizeSearchInput(input: string | string[] | undefined): string`: trims, collapses whitespace (newlines included) to one space, cuts to `SEARCH_MAX_LENGTH`. An array takes its first entry, `undefined` gives `''`.
  - `getSearchWords(normalized: string): string[]`: the words without operator characters, lowercased, empty ones dropped.
  - `toTextQuery(normalized: string): string | undefined`: the words joined by spaces, the last one with `*` appended. Returns `undefined` when the joined words are shorter than `SEARCH_MIN_LENGTH`.
  - `getSnippet(text: string, words: string[], length = SNIPPET_LENGTH): string | undefined`
  - `splitHighlights(text: string, words: string[]): HighlightPart[]`
  - `interface HighlightPart { isMatch: boolean; text: string }`

- [ ] **Step 1: Write the failing tests.**

  | Test | Expectation |
  | --- | --- |
  | `normalizeSearchInput('  Erste \n Mannschaft ')` | `'Erste Mannschaft'` |
  | a 150-character input | 100 characters |
  | `normalizeSearchInput(['a', 'b'])` | `'a'` |
  | `normalizeSearchInput(undefined)` | `''` |
  | `getSearchWords('"Magic" -Diamonds* (Tanz)')` | `['magic', 'diamonds', 'tanz']` |
  | `getSearchWords('1. Mannschaft')` | `['1.', 'mannschaft']`. The dot stays, it is no operator. |
  | `toTextQuery('Tanz')` | `'tanz*'` |
  | `toTextQuery('Erste Mannschaft')` | `'erste mannschaft*'` |
  | `toTextQuery('a')`, `toTextQuery('-')`, `toTextQuery('"*"')` | `undefined` |
  | `getSnippet` with a match in the middle of a 600-character text | at most 160 characters plus the two ellipses, contains the match, starts and ends with `…` |
  | `getSnippet` with no match | the first 160 characters |
  | `getSnippet('', …)` | `undefined` |
  | `splitHighlights('Tanzen bei den Diamonds', ['tanz', 'diamonds'])` | `[{ isMatch: true, text: 'Tanz' }, { isMatch: false, text: 'en bei den ' }, { isMatch: true, text: 'Diamonds' }]`. Prefix match at the start of a word, case-insensitive. |
  | `splitHighlights` with a word inside another word | no match: `tanz` does not mark `Distanz` |

- [ ] **Step 2: Run the tests and verify they fail.** Run `pnpm --filter web exec vp test run src/lib/search`. Expected: FAIL.
- [ ] **Step 3: Implement the functions.** Operator characters are `" * - ( ) | ~ ^`. Escape the words before building the highlight regex. A snippet cuts at word boundaries.
- [ ] **Step 4: Run the tests and verify they pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): add search input and highlight helpers`.

### Task 4: Web — GROQ queries and their verification

**Files:**

- Create: `apps/web/src/lib/sanity/queries/search.ts`
- Test: `apps/web/src/lib/sanity/queries/search.test.ts`

**Interfaces:**

- Produces (all `defineQuery`):

  | Query | Parameters | Returns |
  | --- | --- | --- |
  | `searchCandidatesQuery` | `$q`, `$limit` | the scored candidates for „Seiten“ |
  | `searchNewsQuery` | `$q`, `$start`, `$end` | one page of news hits |
  | `searchNewsCountQuery` | `$q` | `number` |
  | `searchTextsQuery` | `$ids` | `{ _id, text }[]` |
  | `searchPageQuery` | — | the singleton with its contact persons, as `newsOverviewPageQuery` does |
  | `searchPlaceholderQuery` | — | `content.searchSection.placeholder` of the singleton |
  | `searchPopularSettingsQuery` | — | `content.popularSearches { title, pinnedTerms, blockedTerms }` |

- A GROQ fragment `searchTarget` projects what every hit needs:
  - `_id`, `_type`, `title`, `"slug": slug.current`
  - `"department": department->{ title, "slug": slug.current }`
  - `"category": categories[0]->{ title, "slug": slug.current }`
  - `publishedAt`, `indexable`
  - `"image": select(_type == "department" => cardImage, _type in ["group", "news.article"] => featuredImage, _type == "echo.issue" => pages[0], _type == "home" => null, heroImage)`

Decisions for `searchCandidatesQuery`:

- **Types:** `department`, `group`, `echo.issue`, `faq`, `person`, and the singletons `home`, `aboutUs`, `departmentsPage`, `membership`, `contact`, `newsOverview`, `echoOverview`, `imprint`, `privacy`, `accessibility`. Export the list as `SEARCH_PAGE_TYPES`; Task 6 reuses it as cache tags.
- **Shape:** `*[_type in [...]] | score(…) | order(_score desc)`, then keep `_score > 0`, then slice `[0...$limit]`. If Content Lake rejects a filter after `score()`, repeat the disjunction of the score terms as the filter instead.
- **Score terms.** Each line is `boost(<path> match text::query($q), <weight>)`:

  | Weight | Paths |
  | --- | --- |
  | `title` | `title` |
  | `searchTerms` | `searchTerms[]` |
  | `lead` | `subtitle`, `intro` (department, plain text), `intro.text[].children[].text` (membership, echoOverview), `introText.text[].children[].text` (privacy), `content.introSection.intro.text[].children[].text` (aboutUs), `description.text[].children[].text` (group), `question` (faq), `firstName \|\| lastName` (person) |
  | `body` | `answer[].children[].text` (faq), `training.trainingDescription.text[].children[].text` (group), `content.text[].children[].text` (privacy, accessibility), `content.visionSection.longVision.text[].children[].text` (aboutUs), `affiliations[].role->title`, `affiliations[].taskDescription` (person), and `indexable != false && extractedText match …` (echo) |

- **Projection:** `searchTarget`, `_score`, plus:
  - `_type == "faq" => { question, "targets": departments[]->{ ${searchTarget} } }`
  - `_type == "person" => { firstName, lastName, "nameMatches": …, "affiliations": affiliations[]{ "role": role->title, "roleMatches": …, "team": team->{ ${searchTarget} } }, "listedOn": *[_type in ["department", "home", "aboutUs", "departmentsPage", "membership", "contact", "newsOverview", "newsOverviewCategory"] && references(^._id)]{ ${searchTarget} } }`
  - `"roleMatches"` covers `role->title` and `taskDescription` of that one affiliation.

Decisions for the news queries:

- **Filter:** `_type == "news.article" && (title match text::query($q) || body[].text[].children[].text match text::query($q))`.
- **Score:** `boost(title …, 10)` and the body term.
- **Order:** `order(_score desc, publishedAt desc)`. The count uses the same filter.

`searchTextsQuery` projects `text` per type:

| Type                     | `text`                                           |
| ------------------------ | ------------------------------------------------ |
| news                     | `pt::text(body[_type == "blockContent"].text[])` |
| department               | `intro`                                          |
| group                    | description and training text                    |
| membership, echoOverview | `pt::text(intro.text)`                           |
| privacy                  | `introText` and `content`                        |
| accessibility            | `content`                                        |
| aboutUs                  | intro and vision                                 |
| echo                     | `extractedText` only when `indexable != false`   |
| every other type         | `subtitle`                                       |

Join two parts with `coalesce(…, "")`, because a `null` part makes the whole string `null`.

- [ ] **Step 1: Write a failing test** that pins the security-relevant shape of the query strings:
  - `searchCandidatesQuery` contains `indexable != false && extractedText match text::query($q)`.
  - None of the queries contains the substring `extractedText match` without that guard.
  - `searchTextsQuery` reads `extractedText` only inside `select(… indexable != false …)`.
  - Every search query contains `text::query($q)` and no `${` left over.
- [ ] **Step 2: Run it and verify it fails.** Run `pnpm --filter web exec vp test run src/lib/sanity/queries/search`. Expected: FAIL.
- [ ] **Step 3: Write the queries.** Then run `pnpm run typegen:sanity` at the root.
- [ ] **Step 4: Run the test and verify it passes.** Run the same command. Expected: PASS.
- [ ] **Step 5: Verify against `development`.** This is a read only, so no OK is needed. Run each query in Vision or through the Sanity MCP `query_documents` (project `j4rxwl5m`, dataset `development`, perspective `published`):

  | `$q` | Expected |
  | --- | --- |
  | `tanzen*` | first candidate `department-tanzen`, score 10 |
  | `kaap*` | three persons with `nameMatches: true` and a group `team` each |
  | `gladbach*` (news) | a title hit first. The count is 7 or more. |
  | the title word of an issue with `indexable: false`, and a word only in its `extractedText` | the first finds it, the second does not |

  Note the measured response time of `searchCandidatesQuery` in the PR. It should stay well under one second.

- [ ] **Step 6: Commit** `feat(web): add search queries`.

### Task 5: Web — `searchSite`

**Files:**

- Create: `apps/web/src/lib/search/types.ts`, `apps/web/src/lib/search/thumbnail.ts`, `apps/web/src/lib/search/merge.ts`, `apps/web/src/lib/search/search-site.ts`
- Modify: move `linkAsset` from `apps/web/src/app/verein/echo/_shared/utils.ts` into `apps/web/src/lib/echo/archive-url.ts` and import it from there in the echo sections.
- Test: `thumbnail.test.ts`, `merge.test.ts`, `search-site.test.ts` next to their files

**Interfaces:**

- Consumes: Task 3 helpers, Task 4 queries and `SEARCH_PAGE_TYPES`, `getInternalHref`, `urlForImage`, `linkAsset`.
- Produces (`types.ts`):
  - `type SearchHitKind = 'department' | 'group' | 'page' | 'echo' | 'news'`
  - `interface SearchThumbnail { src: string; unoptimized: boolean }`
  - `interface SearchHit { id: string; kind: SearchHitKind; title: string; href: string; meta: string; snippet?: string; thumbnail: SearchThumbnail | null; score: number }`
  - `type SearchTab = 'alle' | 'seiten' | 'news'`
  - `interface SearchResult { query: string; words: string[]; pages: SearchHit[]; news: SearchHit[]; totals: { pages: number; news: number } }`
- Produces (functions):
  - `getSearchThumbnail(image, kind, indexable?: boolean | null): SearchThumbnail | null`
    - `urlForImage(image, 270, 480)`.
    - An Echo issue with `indexable === false` gets `src` through `linkAsset(url, false)` and `unoptimized: true`.
    - No asset gives `null`.
  - `mergePageHits(candidates: SearchCandidate[]): SearchHit[]`
    - Expands FAQs into their departments. The snippet is „Frage: …“.
    - Expands persons:
      - A name match counts on every page in `listedOn` and on the group of every affiliation, with weight `lead`.
      - A role match counts only where the page shows that affiliation: the `team` group of that affiliation, and the `listedOn` pages only for `affiliations[0]`. Weight `body`.
      - The snippet is the person line with the role that page shows.
    - Merges by `id`, keeping the highest score, with that source's snippet.
    - Sorts by score descending, then title (`localeCompare('de')`).
    - Drops every hit without href.
  - `searchSite(input: string, options?: { tab?: SearchTab; page?: number; perGroup?: number }): Promise<SearchResult | undefined>`
    - Returns `undefined` when `toTextQuery` gives `undefined`.

Decisions:

- **Fetches:** `client.fetch(query, params, { perspective: 'published', next: { revalidate: 3600, tags: [...SEARCH_PAGE_TYPES, 'news.article', 'news.category'] } })`. The revalidation webhook expires every one of these tags when a document of that type changes (`revalidateTag(body._type)` in `api/revalidate/route.ts`). Check `node_modules/next/dist/docs` to confirm that `next.revalidate` on a fetch inside a dynamic route still caches in this Next.js version.
- **Slicing:**

  | Call | `pages` | `news` |
  | --- | --- | --- |
  | `perGroup` set (panel) | first `perGroup` | first `perGroup` |
  | `tab: 'alle'` | `ALL_TAB_PAGE_HITS` | `ALL_TAB_NEWS_HITS` |
  | `tab: 'seiten'` | `HITS_PER_PAGE`, page `page` | none, total only |
  | `tab: 'news'` | none, total only | `HITS_PER_PAGE` through `$start`/`$end` |

- **Snippets:** One `searchTextsQuery` for the ids that are returned and have no snippet yet. `getSnippet(text, words)`. An Echo issue with `indexable === false` never gets a snippet.
- **Meta lines:** as fixed in Global Constraints. The date uses the formatter the news previews use.

- [ ] **Step 1: Write the failing tests.**

  `thumbnail.test.ts`:
  - a department image gives a 480×270 crop URL
  - an Echo cover with `indexable: false` gives an `/echo-archiv/images/…` URL with `unoptimized: true`
  - no asset gives `null`

  `merge.test.ts`:
  - two persons on the same group and the group's own title hit give one hit, with the title score
  - a person name match on `contact` gives a „Seite“ hit `/kontakt` with „Ansprechperson: Alina Kaap, Übungsleiterin“
  - a role match on `affiliations[1]` does not surface `contact`, but does surface the group of that affiliation
  - a FAQ hit becomes its department with „Frage: …“
  - a group without a department slug is dropped
  - a production-like dataset without `department` documents and with a group whose `department` is a string returns the remaining hits and does not throw
  - the trailing space in `firstName: 'Meike '` does not reach the snippet

  `search-site.test.ts` (mock `@/lib/sanity/client` as `sitemap.test.ts` does):
  - `searchSite('a')` returns `undefined` and calls no fetch
  - every fetch passes `perspective: 'published'` and `$q`
  - `tab: 'news', page: 2` asks for `$start: 10, $end: 20`
  - `perGroup: 3` returns at most three per group, with the full totals
  - an Echo hit with `indexable: false` has no `snippet`

- [ ] **Step 2: Run the tests and verify they fail.** Run `pnpm --filter web exec vp test run src/lib/search`. Expected: FAIL.
- [ ] **Step 3: Implement** `thumbnail.ts`, `merge.ts` and `search-site.ts`, and move `linkAsset`. The echo tests must stay green.
- [ ] **Step 4: Run the tests and verify they pass.** Run `pnpm --filter web exec vp test run src/lib src/app/verein`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): add search core`.

### Task 6: Web — routes `GET /api/search` and `GET /api/search/popular`

**Files:**

- Create: `apps/web/src/app/api/search/route.ts`, `apps/web/src/app/api/search/popular/route.ts`, `apps/web/src/lib/search/popular.ts`
- Test: `route.test.ts` next to each route, `apps/web/src/lib/search/popular.test.ts`

**Interfaces:**

- Consumes: `searchSite` (Task 5), `searchPopularSettingsQuery` (Task 4).
- Produces:
  - `GET /api/search?q=<input>`:
    - with a query, `200` and `SearchResult` as JSON, `perGroup: PANEL_HITS_PER_GROUP`
    - without a usable query, `200` and `null`
  - `getPopularSearches(): Promise<{ title: string; terms: string[] }>`. Paket 1 returns `pinnedTerms`, deduplicated case-insensitively, without `blockedTerms`, at most `POPULAR_SEARCHES_LIMIT`. The title falls back to „Häufig gesucht“. The fetch is tagged `searchPage`.
  - `GET /api/search/popular` answers `getPopularSearches()` as JSON, with `export const revalidate = 3600`.

- [ ] **Step 1: Write the failing tests.**
  - `?q=-` answers `null` without calling `searchSite`'s fetch.
  - `?q=Tanzen` answers the JSON of the mocked result.
  - A blocked pinned term is left out.
  - Ten pinned terms give eight.
  - `Tanzen` and `tanzen` give one.
  - A missing singleton gives `{ title: 'Häufig gesucht', terms: [] }`.
- [ ] **Step 2: Run the tests and verify they fail.** Run `pnpm --filter web exec vp test run src/app/api/search src/lib/search/popular`. Expected: FAIL.
- [ ] **Step 3: Implement** both routes and `popular.ts`, then run `pnpm --filter web run typegen:routes`.
- [ ] **Step 4: Run the tests and verify they pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Run the acceptance checks against `development`.**
  - Run `pnpm --filter web run dev`.
  - `curl -s 'http://localhost:3000/api/search?q=Tanzen' | jq '.pages[0].title'` gives `"Tanzen"`.
  - `curl -s 'http://localhost:3000/api/search?q=Gladbach' | jq '.news[0].title'` gives the match report against Gladbach.
  - „Erste Mannschaft“ is checked in Task 12, after the search term is in the dataset.
- [ ] **Step 6: Commit** `feat(web): add search api routes`.

### Task 7: Web — hit components

**Files:**

- Create in `apps/web/src/components/ui/search/`: `highlighted.tsx`, `search-thumbnail.tsx`, `search-hit-card.tsx`, `search-hit-row.tsx`, `index.ts`
- Test: `highlighted.test.tsx`, `search-hit-card.test.tsx`, `search-hit-row.test.tsx`

**Interfaces:**

- Consumes: `splitHighlights` (Task 3), `SearchHit` (Task 5).
- Produces (all server-safe, no `'use client'`):
  - `Highlighted({ text, words })` renders matches in `<mark>`.
  - `SearchThumbnail({ thumbnail, className })`:
    - a `next/image` with `alt=""`, because the title next to it names the hit
    - `TSGLogo` on a muted box when `thumbnail` is `null`
  - `SearchHitCard({ hit, words })`: the card of the „Seiten“ grid. Thumbnail on top, highlighted title as the link, meta, then the snippet clamped to two lines when present.
  - `SearchHitRow({ hit, words, compact? })`:
    - the row of the news list: thumbnail on the left, then meta, highlighted title as the link and snippet
    - `compact` drops the snippet for the panel

  Layout follows `search-page.html` and `panel.html` in the mockups, with the existing tokens and type scale.

- [ ] **Step 1: Write the failing tests.**
  - The title text is split into a `mark` for the matched prefix.
  - The card's link has the accessible name of the title and the hit's `href`.
  - A hit without a thumbnail shows no `img` with a `src` and still renders.
  - The row with `compact` renders no snippet.
  - The snippet text is present in the full row.
- [ ] **Step 2: Run the tests and verify they fail.** Run `pnpm --filter web exec vp test run src/components/ui/search`. Expected: FAIL.
- [ ] **Step 3: Implement** the components.
- [ ] **Step 4: Run the tests and verify they pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): add search hit components`.

### Task 8: Web — search page `/suche`

**Files:**

- Create: `apps/web/src/app/suche/page.tsx`, plus these in `apps/web/src/app/suche/_sections/`: `search-form.tsx`, `search-tabs.tsx`, `search-results.tsx`, `no-results.tsx`, `popular-searches.tsx`
- Modify: `apps/web/src/utils/pagination.ts` (`getPaginatedPath`)
- Test: `apps/web/src/app/suche/page.test.tsx`, one test per section, `apps/web/src/utils/pagination.test.ts`

**Interfaces:**

- Consumes: `searchSite`, `getPopularSearches`, `searchPageQuery`, the Task 7 components, `Hero`, `SectionHeader`, `ContactPersons`, `Newsletter`, `OverviewPagination`, `getPageMetadata`, `getPageHeroImage`.
- Produces:
  - `getPaginatedPath('/suche?q=x', 2)` gives `'/suche?q=x&seite=2'`. Paths without a query keep `?seite=`.
  - URL contract:
    - `q`: the search input
    - `typ`: `seiten` or `news`, missing for „Alle“
    - `seite`: the page number, from 2 on

Decisions:

- **Page layout:** Hero (`page.title`, `subtitle`, hero image), the search section, `ContactPersons` from `content.contactPersonsSection`, `Newsletter`. The texts come from `searchPageQuery` through `client.fetch` with tag `searchPage`.
- **Search section:**
  - `SectionHeader` with `searchSection.subtitle` and `title`, then `intro`.
  - A `<form method="get" action="/suche" role="search">`: an input `name="q"` (label „Suchbegriff“, placeholder from the singleton), the submit „Suchen“, and the current `typ` as a hidden input when set.
- **Branching:**
  - With hits: the summary, the tabs (links with `aria-current="page"` on the active one, each with its count), then the results:
    - „Alle“: cards, then news rows, each with its more link to its tab.
    - „Seiten“ or „News“: its list plus `OverviewPagination` with `basePath` `/suche?q=…&typ=…`.
  - With `q` but no hit: `NoResults` (`noResults.title`, `text`, `links` resolved like the navigation links), then `PopularSearches`.
  - Without a usable `q`: `PopularSearches` only.
  - `PopularSearches` renders each term as a link to `/suche?q=<term>`.
- **Unknown values:** An unknown `typ` counts as „Alle“. A `seite` beyond the last page calls `notFound()`.
- **Metadata:** `getPageMetadata({ image: page.heroImage, meta: page.meta, path: '/suche', title: page.title })` plus `robots: { follow: true, index: false }`.
- **Sitemap and llms.txt:** stay untouched, `/suche` is in neither.

- [ ] **Step 1: Write the failing tests.**
  - `getPaginatedPath` with and without a query string.
  - The page with mocked `searchSite`:
    - `?q=Tanzen` shows the summary „30 Treffer für „Tanzen““, a link „Tanzen“ to `/angebot/tanzen`, and tabs whose active link has `aria-current="page"`.
    - `?q=xyz` without a hit shows the `noResults` heading and its links.
    - Without `q`, it shows the popular terms as links to `/suche?q=…`.
    - `?q=Tanzen&typ=foo` renders „Alle“.
    - `?q=Tanzen&typ=news&seite=9` with 26 news hits calls `notFound`.
    - `generateMetadata` sets `robots.index` to `false`.
- [ ] **Step 2: Run the tests and verify they fail.** Run `pnpm --filter web exec vp test run src/app/suche src/utils/pagination`. Expected: FAIL.
- [ ] **Step 3: Implement** the page and its sections, then run `pnpm --filter web run typegen:routes`.
- [ ] **Step 4: Run the tests and verify they pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Check without JavaScript.** Open `http://localhost:3000/suche` with JavaScript off and submit „Tanzen“. The URL becomes `/suche?q=Tanzen` and the hits render.
- [ ] **Step 6: Commit** `feat(web): add search page`.

### Task 9: Web — panel hooks

**Files:**

- Create: `apps/web/src/components/with-logic/search/use-search-results.ts`, `apps/web/src/components/with-logic/search/use-listbox-navigation.ts`
- Test: `use-search-results.test.ts`, `use-listbox-navigation.test.ts`

**Interfaces:**

- Produces:
  - `useSearchResults(input: string): { status: 'idle' | 'loading' | 'done' | 'error'; result: SearchResult | null }`:
    - `idle` below `SEARCH_MIN_LENGTH`
    - otherwise waits `SEARCH_DEBOUNCE_MS`, fetches `/api/search?q=` with an `AbortController`, aborts the previous request, and awaits with `settle()`
  - `useListboxNavigation(optionIds: string[]): { activeId: string | null; onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void; reset: () => void }`:
    - ↓ and ↑ move through `optionIds` and wrap at the ends
    - Home and End are left to the input
    - the ids changing resets to `null`

- [ ] **Step 1: Write the failing tests** (fake timers, `createFetchMock`).
  - Typing `T`, then `Ta` fetches once, after 250 ms, with `q=Ta`.
  - A slow response for `Ta` arriving after the response for `Tan` leaves the `Tan` result in place.
  - A failed fetch gives `status: 'error'` and keeps the last result.
  - ↓ from `null` gives the first id, ↑ from the first gives the last.
  - New ids reset `activeId` to `null`.
- [ ] **Step 2: Run the tests and verify they fail.** Run `pnpm --filter web exec vp test run src/components/with-logic/search`. Expected: FAIL.
- [ ] **Step 3: Implement** both hooks.
- [ ] **Step 4: Run the tests and verify they pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): add search panel hooks`.

### Task 10: Web — search panel and the lupe in the navigation

**Files:**

- Create: `apps/web/src/components/with-logic/search/search-panel.tsx`, `apps/web/src/components/with-logic/search/search-button.tsx`
- Modify: `apps/web/src/components/with-logic/navigation/navigation.tsx`, `apps/web/src/app/layout.tsx`
- Test: `search-panel.test.tsx`, `search-button.test.tsx`, `navigation.test.tsx`, `apps/web/src/app/layout.test.ts`

**Interfaces:**

- Consumes: Task 9 hooks, `SearchHitRow` (Task 7), `Dialog` parts from `src/components/ui/dialog.tsx`, `GET /api/search/popular`.
- Produces:
  - `SearchPanel({ open, onOpenChange, placeholder, finalFocus })`, a named export. `React.lazy` maps it with `.then((module) => ({ default: module.SearchPanel }))`.
  - `SearchButton({ onOpen, className, ref })`: a button with `aria-label` „Suche öffnen“, `aria-haspopup="dialog"` and a `Search` icon from `lucide-react`.
  - `Navigation` gets a new prop `searchPlaceholder?: string | null`.

Decisions:

- **Navigation:**
  - It holds `isSearchOpen` and `hasOpenedSearch`.
  - The panel is the lazily imported `SearchPanel` inside `Suspense` with a `null` fallback, rendered once `hasOpenedSearch` is true. Before the first click no panel code is loaded.
  - The desktop lupe sits before both contact buttons. The mobile lupe sits in the `lg:hidden` row, left of the burger.
  - Opening the search closes the mobile menu, and opening the menu closes the search.
  - A `pathname` change closes the search.
  - The ref of the lupe that opened it goes to `finalFocus`.
- **Panel:**
  - A controlled Base UI `Dialog` (modal) whose popup sits fixed below the navigation and slides down. Below `lg` it fills the screen under the bar. The backdrop dims the page.
  - The slide uses `motion-safe:` variants; `motion-reduce` keeps only the opacity transition.
  - `initialFocus` is the input.
- **Input:**
  - `role="combobox"`, `aria-expanded`, `aria-controls` on the listbox, `aria-activedescendant` from `useListboxNavigation`, `aria-autocomplete="list"`.
  - Enter with an active option navigates to its href (`router.push`) and closes the panel. Enter without one goes to `/suche?q=<input>`.
- **Results:**
  - One `role="listbox"` holding two `role="group"` blocks labelled „Seiten“ and „News“. Side by side from `lg`, stacked below.
  - Each option is a `next/link` with `role="option"`, `aria-selected`, `tabIndex={-1}` and the `id` that `aria-activedescendant` points at. Clicking it navigates and closes.
  - The more links („Alle {n} … anzeigen“) sit outside the listbox as normal links to `/suche?q=…&typ=seiten|news`.
- **States:**
  - With `status === 'loading'`, „Suche läuft …“ goes into a polite live region.
  - With fewer than 2 characters, the panel shows „Häufig gesucht“ from `GET /api/search/popular`, fetched once per page load, as links to `/suche?q=…`.
  - With no hits, it shows „Keine Treffer für „{q}“.“ and a link to `/suche?q=…`.
- **Layout:** fetches `searchPlaceholderQuery` with tag `searchPage` in its existing `Promise.all`, with `.catch(() => null)` like the others, and passes the value down.

- [ ] **Step 1: Write the failing tests.**
  - `navigation.test.tsx`:
    - The bar shows a button „Suche öffnen“ on desktop and in the mobile row.
    - Clicking it opens a dialog „Website durchsuchen“ whose input has the focus.
    - Opening the menu while the search is open closes the dialog.
  - `search-panel.test.tsx` (mock `fetch`):
    - Typing „Tanzen“ shows an option „Tanzen“ in the group „Seiten“.
    - ↓ marks it as `aria-selected="true"` and Enter navigates to its href.
    - Enter without a selection pushes `/suche?q=Tanzen`.
    - Escape closes the panel and the focus goes back to the lupe.
    - An empty input shows the popular terms.
    - No hits shows the no-hit text with its link.
  - `layout.test.ts`: the placeholder from the mocked fetch reaches `Navigation`.
- [ ] **Step 2: Run the tests and verify they fail.** Run `pnpm --filter web exec vp test run src/components/with-logic src/app/layout`. Expected: FAIL.
- [ ] **Step 3: Implement** the panel, the button and the wiring.
- [ ] **Step 4: Run the tests and verify they pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Check by eye in the dev server**, desktop and at 375 px wide.
  - The panel opens below the bar and closes with Esc, the backdrop and a route change.
  - With `prefers-reduced-motion: reduce` emulated (DevTools → Rendering, or `page.emulateMedia({ reducedMotion: 'reduce' })` in a quick Playwright check), there is no slide.
  - Take one screenshot of each for the PR.
- [ ] **Step 6: Commit** `feat(web): add search panel to the navigation`.

### Task 11: Revalidation and webhook documentation

**Files:**

- Modify: `apps/web/src/app/api/revalidate/route.ts`, `docs/SANITY_WEBHOOK_SETUP.md`
- Test: `apps/web/src/app/api/revalidate/route.test.ts`

- [ ] **Step 1: Write the failing test** `it('revalidates the whole layout for the search page, whose placeholder the navigation shows')`. It expects `[['/', 'layout']]`.
- [ ] **Step 2: Run it and verify it fails.** Run `pnpm --filter web exec vp test run src/app/api/revalidate`. Expected: FAIL.
- [ ] **Step 3: Add `searchPage`** to `REVALIDATION_MAP` with `revalidatePath('/', 'layout')` and a comment naming the navigation. The tags of the search fetches already expire through `revalidateTag(body._type)`.
- [ ] **Step 4: Run the test and verify it passes.** Run the same command. Expected: PASS.
- [ ] **Step 5: Add `searchPage`** to the type filter in `docs/SANITY_WEBHOOK_SETUP.md`.
- [ ] **Step 6: Commit** `feat(web): revalidate the search page`.

### Task 12: Content in `development` and acceptance (runbook)

- [ ] **Step 1: With the user's OK, create the singleton „Suche“ in `development`** (Studio → Einzelseiten → Suche). Suggested copy from the mockup:

  | Field | Copy |
  | --- | --- |
  | Titel | Suche |
  | Untertitel | Finden |
  | Hero-Bild | chosen by the user |
  | Suchbereich: Untertitel | Suchergebnisse |
  | Suchbereich: Titel | Was suchst du? |
  | Suchbereich: Intro | Durchsuche alle Seiten und News der TSG Irlich – von Abteilungen und Gruppen über Trainingszeiten bis zu Spielberichten und Ansprechpartnern. |
  | Platzhalter | Wonach suchst du? |
  | Keine Treffer: Überschrift | Leider nichts gefunden |
  | Keine Treffer: Text | Versuch es mit einem anderen Begriff oder schau dich in unserem Angebot um. |
  | Keine Treffer: Links | Angebot, News, Kontakt |
  | Immer anzeigen | Fußball, Tanzen, Kinderturnen, Mitgliedschaft, Trainingszeiten |
  | Ansprechpartner | das PR-Team, chosen by the user |

- [ ] **Step 2: With the user's OK, add the search term „Erste Mannschaft“** to the group „1. Mannschaft“ in `development`.
- [ ] **Step 3: Check the three examples of the spec** with the dev server. They must be the first hit:
  - `/api/search?q=Tanzen` gives „Tanzen“
  - `/api/search?q=Gladbach` gives the match report against Gladbach
  - `/api/search?q=Erste%20Mannschaft` gives „1. Mannschaft“

  Adjust only the `WEIGHTS` if one fails, and note the change in the PR.

### Task 13: End-to-end, accessibility and screenshots

**Files:**

- Create: `apps/web/e2e/specs/search.spec.ts`
- Modify: `apps/web/e2e/specs/accessibility.spec.ts` (`STATIC_ROUTES` gains `/suche`), the fixtures in `apps/web/e2e/fixtures/sanity/`, `apps/web/e2e/__screenshots__/**`

- [ ] **Step 1: Write `search.spec.ts`.**
  - Desktop:
    - Open the lupe and wait until the input answers. Type in `expect(…).toPass()` as `news.spec.ts` does, because of hydration.
    - Type „Tanzen“. ArrowDown and Enter lead to a URL starting with `/angebot/`.
    - Escape closes the panel and the focus is back on „Suche öffnen“.
  - Mobile (`isMobile`):
    - The lupe is next to „Menü“.
    - Opening the menu, then the lupe, leaves the menu closed.
  - Page:
    - `/suche?q=Tanzen` shows the tabs with counts and a link „Tanzen“.
    - `/suche` shows „Häufig gesucht“.
    - In a context with `javaScriptEnabled: false`, filling the form and pressing Enter lands on `/suche?q=…`.
- [ ] **Step 2: Add `/suche` and `/suche?q=Tanzen` to the axe sweep.** Add the second as its own case after the static routes, keyed `/suche` in the baseline.
- [ ] **Step 3: Record the fixtures:** `pnpm --filter web run e2e:record`. This needs `.env.local` with the development read token, and the Task 12 content. Restore the hand-maintained main-menu fixture from git afterwards, as `apps/web/AGENTS.md` describes.
- [ ] **Step 4: Run the suite:** `pnpm --filter web run test:e2e`. Expected: PASS, axe without violations.
- [ ] **Step 5: Update the baselines:** `pnpm --filter web run test:e2e:visual:update`, with Docker running. The lupe changes the bar on all nine routes in both projects. Review the diff: only the navigation may change.
- [ ] **Step 6: Commit** `test(web): cover the site search end to end`, including the fixtures and the baselines.

### Task 14: Documentation

**Files:**

- Modify: `apps/web/AGENTS.md`, `apps/studio/AGENTS.md`, root `AGENTS.md`

- [ ] **Step 1: In `apps/web/AGENTS.md`, add a section „Site search“** covering:
  - `src/lib/search/` and the seam `searchSite`
  - the weights, and why persons and FAQs are expanded into pages
  - the cache tags, and the published-only rule
  - the Echo `indexable` guard
  - the URL contract of `/suche`
  - the panel's lazy loading and its listbox pattern
  - Also extend the axe paragraph (sixteen to eighteen routes) and the revalidation paragraph (`searchPage`).
- [ ] **Step 2: In `apps/studio/AGENTS.md`,** describe the `searchTerms` field, and `searchPage` with its groups.
- [ ] **Step 3: In the root `AGENTS.md`,** mention the site search under Content types.
- [ ] **Step 4: Run `pnpm run format:check`** and commit `docs: describe the site search`.

### Task 15: Full check, pull request and staging (runbook)

- [ ] **Step 1: Run the full check from the root:** `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:coverage`. Expected: all green, thresholds held.
- [ ] **Step 2: Open the PR** through the `create-pr` skill, in English, with `Refs WEB-204`. Paket 2's PR closes the ticket. Bind it and turn on Auto-fix.
- [ ] **Step 3: With the user's OK, add `searchPage`** to the type filter of the staging webhook (`development`). Never print secret or headers.
- [ ] **Step 4: On staging,** check the three examples and the panel on a phone.

### Task 16: Production (runbook, with the WEB-384 release)

The search reaches production with the release that brings WEB-384 to `main`. Before `next` is merged into `main`, and each step only with the user's OK:

1. Create the singleton „Suche“ in `production` with the copy agreed for `development`.
2. Add „Erste Mannschaft“ to the group „1. Mannschaft“ in `production`, after the WEB-384 migration.
3. Add `searchPage` to the type filter of the production webhook.

After the release, check the three examples on `tsg-irlich.de`.
