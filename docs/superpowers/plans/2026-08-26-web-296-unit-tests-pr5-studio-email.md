# WEB-296 Unit Tests — PR 5 (Studio and E-Mail) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cover the Sanity Studio's own logic and the React Email templates, and close the one gap PR 1 deferred — the two components in `packages/shared`.

**Architecture:** Tests only. Three workspaces, three independent Vitest configs, and no shared harness between them: `apps/studio` runs jsdom, `packages/email` runs node with the React plugin, `packages/shared` runs node and gains a jsdom project in this PR. Nothing here imports `next/image`, `next/navigation` or `motion`, so `apps/web`'s `setup-dom.ts` is irrelevant — do not reach for it.

**Tech Stack:** Vitest 4, jsdom 30, React 19.2, Sanity 6, `@react-email/render` 2, `@testing-library/react` 16.3, pnpm 11, Turbo, GitButler CLI (`but`).

**Spec:** `docs/superpowers/specs/2026-08-25-web-296-unit-tests-design.md`, section "PR 5 — Studio und E-Mail"

**Base branch:** `next`, which now contains PRs 1-4 (#471, #472, #473, #474, all merged). New branch: `test/web-296-unit-tests-studio-email`.

## Global Constraints

- Node `^24.19.0`, pnpm `11.22.0` — `.nvmrc` and `packageManager` untouched.
- Tests live next to their source. `apps/studio` has no `src/` directory, so its tests sit beside the files they cover.
- Explicit imports from `vitest`. No `globals: true`.
- `describe` titles start lowercase and are never identical to an imported identifier. `beforeEach`/`afterEach`/`beforeAll`/`afterAll` sit inside a `describe` block.
- Never widen the test-file override in `oxlint.config.ts`; use a narrow inline comment if a file needs a suppression.
- No new dependency. **One config change is authorised and only one:** adding a jsdom project to `packages/shared/vitest.config.ts` in Task 6. No other `vitest.config.ts`, no `turbo.json`, no CI file, no `sonar-project.properties`.
- No production source change. If a test uncovers a real bug or an accessibility gap, report it and stop — the controller decides. PR 4 found twelve such findings this way; that inventory is a deliverable, not a side effect.
- Commits through GitButler with explicit file paths: `but commit -b test/web-296-unit-tests-studio-email -m "…" <paths>`. Conventional Commits, no `Co-Authored-By`, no generator trailer.
- After every task: `pnpm run lint`, `pnpm run format:check`, `pnpm run typecheck` clean and `pnpm run test` green. `packages/email`'s `build` script is `tsc --noEmit`, so run `pnpm run build` too when touching that workspace.
- **Expected values are derived from the implementation, never from this plan's prose.** Across PRs 2-4 the plans were wrong at least seven times and the implementers caught every one by checking. If the code contradicts a value below, that is a finding — report it and write what the code really does.
- **No assertion may build its expected value by calling the function under test or importing a constant the implementation also imports.** Hard-code literals.
- **Assert behaviour, not shape.** For the schemas that means calling `preview.prepare` and `validation` as plain functions and asserting their return values — never asserting that a `defineField` literal has the fields it obviously has. For the e-mail components it means asserting rendered output, not prop plumbing.

## Already covered — do not duplicate

`apps/studio/utils/time.ts` and `packages/email/lib/cleverreach-markers.ts` were both covered by PR 1.

## Deliberately not covered, per the spec

The field and section definition literals (`shared/fields/*`, `shared/sections/*`, plain `defineField` shapes) — `extract-types` and typegen already guard those, and a test asserting a literal only restates it. Also `plugins/assist.ts` (270 lines of prompt data) and `plugins/index.ts` (plugin wiring). In `packages/email`, the purely presentational wrappers (`section-kicker`, `cta-band`, and the markup of `newsletter-header`/`newsletter-footer`) beyond their appearance in the two snapshots.

---

### Task 1: Branch

**Files:** commit this plan.

- [ ] **Step 1: Confirm the base**

Run: `git fetch origin && git log --oneline -1 origin/next` and `but status` Expected: `next` contains #474's merge commit; the working tree is clean.

- [ ] **Step 2: Create the branch, then commit**

`but commit -b <new-branch>` creates a SIBLING, which cost PR 2 real time. Create it explicitly first:

```bash
but branch new test/web-296-unit-tests-studio-email
but commit -b test/web-296-unit-tests-studio-email \
  -m "docs: add the studio and email test plan for WEB-296" \
  docs/superpowers/plans/2026-08-26-web-296-unit-tests-pr5-studio-email.md
```

- [ ] **Step 3: Verify**

Run: `git log --oneline origin/next..test/web-296-unit-tests-studio-email` Expected: exactly one commit, carrying only the plan file.

---

### Task 2: Studio utilities

**Files:**

- Create: `apps/studio/utils/strings.test.ts`
- Create: `apps/studio/utils/fields.test.ts`

**Interfaces:**

- Consumes: the studio's existing jsdom Vitest config.
- Produces: nothing.

- [ ] **Step 1: `strings.test.ts`**

`slugify` runs `slugify` from the `slugify` package with the German locale, then drops filler words from a set. Read the function and its `unneededWords` set first. Cases: the example from its own JSDoc; umlaut transliteration (`für` → `fuer` — verify, do not assume); punctuation removed; filler words dropped; a string made only of filler words; an already-slugged input is idempotent; a single word survives untouched. Hard-code every expected slug as a literal.

- [ ] **Step 2: `fields.test.ts`**

`getFieldWithGroup` and `getFieldWithoutGroup` copy a `defineField` result. Cases: the group is set on the copy; the source object is NOT mutated (assert the original still lacks the group, and that the return is a different object); `getFieldWithoutGroup` clears an existing group; both preserve every other property. This is the one place where asserting on a field literal is right, because the functions' whole job is copying one.

- [ ] **Step 3: Gates and commit**

```bash
pnpm --filter studio test
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-studio-email \
  -m "test(studio): cover the slug and field helpers" \
  apps/studio/utils/strings.test.ts apps/studio/utils/fields.test.ts
```

---

### Task 3: Studio structure and the singleton plugin

**Files:**

- Create: `apps/studio/structure/index.test.ts`
- Create: `apps/studio/plugins/singleton.test.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: nothing.

- [ ] **Step 1: `structure/index.test.ts`**

Read `structure/index.ts` and test what it actually exports — the spec names `getGroup` and `isExcludedDefaultListItem`, but verify the real names and signatures before writing. Cover an included type and an excluded one for the predicate, and the group resolution for a known and an unknown input.

- [ ] **Step 2: `plugins/singleton.test.ts`**

`singletonPlugin` is a `definePlugin` factory taking a list of type names. Reach its behaviour through the returned plugin object's `document.actions` and `document.newDocumentOptions`:

- `actions` strips the `duplicate` action for a listed type and leaves the list untouched for an unlisted one. Build the `previous` array as plain objects with an `action` property — read the code to see what shape it expects.
- `newDocumentOptions` filters listed template items when `creationContext.type` is `'global'`, and returns the list unchanged for any other context. Assert the returned arrays, not the plugin's internals.

- [ ] **Step 3: Gates and commit**

```bash
pnpm --filter studio test
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-studio-email \
  -m "test(studio): cover the desk structure and the singleton plugin" \
  apps/studio/structure/index.test.ts apps/studio/plugins/singleton.test.ts
```

---

### Task 4: Schema preview and validation functions

**Files:**

- Create one `*.test.ts` beside each schema you cover, under `apps/studio/schemas/`.

**Interfaces:**

- Consumes: nothing.
- Produces: nothing.

These are the schemas with real computation. `grep` found `prepare` in `sections/gallery.ts`, `sections/spacer.ts`, `sections/block-content.ts`, `sections/grid.ts`, `singletons/site-settings.tsx`, `objects/training-time.ts`, `objects/extended-image.ts` and `documents/news.article.ts`; and custom `validation` in `sections/gallery.ts`, `singletons/site-settings.tsx`, `objects/internal-link.ts`, `objects/meta.tsx`, `objects/stats.ts` and `objects/training-time.ts`.

- [ ] **Step 1: Decide what is worth testing, and say why**

Read each of those functions. Cover the ones that COMPUTE — a title assembled from several fields, a subtitle with a fallback, a count, a conditional media pick. Skip the ones that merely return a field verbatim, and list what you skipped and why in your report. A test asserting `prepare({title: 'x'})` returns `{title: 'x'}` is worthless; do not write it.

- [ ] **Step 2: Test each covered `prepare`**

Call it as a plain function on the exported definition object — no Sanity runtime, no rendering. Cover: all fields present; each optional field missing in turn; the fallback title when the primary is absent; and the shape of the returned object (whatever keys the real function returns, `media` included where it passes one through).

- [ ] **Step 3: Test each custom `validation` rule**

A Sanity validation function receives a value and a context and returns `true` or a message string. Call it directly. Cover the passing case and every failing case, asserting the exact German message as a literal. If a rule needs a `Rule` builder object rather than being a plain function, read how it is written and adapt — report if the shape makes it untestable without a Sanity runtime, rather than faking one.

- [ ] **Step 4: Gates and commit**

```bash
pnpm --filter studio test
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-studio-email \
  -m "test(studio): cover the schema previews and validation rules" \
  <the files you created>
```

---

### Task 5: E-mail templates

**Files:**

- Create: `packages/email/lib/render-newsletter.test.ts`
- Create: `*.test.tsx` beside the newsletter components you cover
- Create: `packages/email/emails/contact-forward.test.tsx`

**Interfaces:**

- Consumes: `packages/email`'s node-environment config with the React plugin.
- Produces: nothing.

`packages/email` runs in `node`, not jsdom. Render with `render()` from `react-email` (as `lib/render-newsletter.ts` itself does) and assert on the returned HTML string, or use `@testing-library/react`'s `render` only if that workspace genuinely supports it — check what is installed there before choosing, and say which you used and why.

- [ ] **Step 1: `render-newsletter.test.ts`**

`renderNewsletterHtml` produces HTML with no CleverReach markers and no `#html#` comments; `renderNewsletterTemplate` produces the comments. Assert both, and assert that `isTemplate` is what makes the difference — the two outputs must differ in exactly that respect. Do not import `toCleverReachTemplate` to build an expectation; PR 1 already tests it, and using it here would be circular.

- [ ] **Step 2: The components that carry logic**

Cover, deriving every expectation from the source: `news-grid` and `upcoming-events` render one entry per item and nothing for an empty list; `event-date-badge` renders the weekday, day and month from a `NewsletterEvent`; `email-button` renders its href and label; `sponsor-card`'s branch when no image is given. Skip the presentational wrappers named in the spec.

- [ ] **Step 3: `contact-forward.test.tsx`**

The receiver line renders only when a receiver was passed. Cover both, plus that the contact's name, e-mail and message reach the output.

- [ ] **Step 4: Two snapshots, and only two**

One full render of the newsletter as a template, one as a mailing. These are a structural regression net, nothing more — do not add snapshots for individual components, and do not let a snapshot stand in for an assertion that should be explicit. Note in your report how large they are, so a reviewer can judge whether they will be maintained or blindly re-recorded.

- [ ] **Step 5: Gates and commit**

```bash
pnpm --filter @tsgi-web/email test
pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run build
but commit -b test/web-296-unit-tests-studio-email \
  -m "test(email): cover the newsletter rendering and its components" \
  <the files you created>
```

---

### Task 6: Close PR 1's deferred gap — `packages/shared`'s components

**Files:**

- Modify: `packages/shared/vitest.config.ts`
- Create: `packages/shared/src/icons/dosb.test.tsx`
- Create: `packages/shared/src/logos/tsg-logo.test.tsx`

**Interfaces:**

- Consumes: nothing.
- Produces: the jsdom project that workspace has been missing since PR 1.

The spec's PR 1 section says `packages/shared` gets "node, plus a jsdom project for the two icon/logo components". PR 1 shipped node only and deferred the jsdom project to "the PR that adds the first icon test", because an inline project whose `include` matches nothing fails the run. No later PR picked it up, so `tsg-logo.tsx` and `dosb.tsx` are the only components in the repo with no test at all. This task closes that loop, and it is the one authorised config change in this PR.

- [ ] **Step 1: Add the jsdom project**

Follow `apps/web/vitest.config.ts`'s shape: keep the existing node project for `src/utils/**`, add a second project with `environment: 'jsdom'` and the React plugin, scoped to the `.test.tsx` files you are about to add. Read `packages/shared/package.json` first — if `jsdom` or `@vitejs/plugin-react` is not a devDependency there, install it into that workspace at the version the other workspaces already use, and say so in your report (this is the one place a dependency addition is expected).

- [ ] **Step 2: Test the two components**

Read both first. They take props (a `DosbIconName`, sizing, class names). Cover what a consumer depends on: the component renders, an accessible name or `role` if it sets one, and — for `dosb.tsx` — that a given icon name selects a different rendering than another name. If either component is purely decorative with `aria-hidden` and no accessible name, assert THAT, and note whether being unlabelled is correct for its usage or an accessibility gap worth reporting.

Do not assert class strings, and do not snapshot an SVG path — a path-data snapshot is unmaintainable and breaks on any icon-set update. If the only distinguishing feature between two icons is path data, say so and assert something narrower instead.

- [ ] **Step 3: Gates and commit**

```bash
pnpm --filter @tsgi-web/shared test
pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run test
but commit -b test/web-296-unit-tests-studio-email \
  -m "test(shared): cover the icon and logo components" \
  packages/shared/vitest.config.ts packages/shared/src/icons/dosb.test.tsx \
  packages/shared/src/logos/tsg-logo.test.tsx
```

---

### Task 7: Close out the whole effort

**Files:** possibly `AGENTS.md` and/or `apps/studio/AGENTS.md`.

- [ ] **Step 1: Full verification**

Run: `pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run test && pnpm run build` Record the test total and the per-workspace split.

- [ ] **Step 2: Coverage across all five PRs**

Run `pnpm run test:coverage` and record line coverage per workspace. This is the number the deferred coverage-threshold ticket will start from, so state it plainly and say which workspace is weakest and why.

- [ ] **Step 3: Documentation**

Add anything a future author needs that is not yet written down — in particular the studio convention (call `preview.prepare` and `validation` as plain functions on the exported definition; no Sanity runtime) and the email convention (render to an HTML string in a node environment; only two snapshots, deliberately). Keep it brief; `AGENTS.md` loads into every session. Verify each claim against the code before writing it. Commit only if you changed something.

- [ ] **Step 4: Report, in English**

This is the last PR of five, so the report should serve as the closing summary of the whole effort: the total test count and per-workspace coverage, what this PR covers, everything deliberately not covered and why, and — collected from this PR's own tasks — any new production bug or accessibility finding, with file, line and what a user experiences.

---

## Self-Review

**Spec coverage:** every item in the spec's PR 5 section maps to a task — studio utilities (2), structure and the singleton plugin (3), schema previews and validation (4), the e-mail templates and the two snapshots (5). Task 6 covers a spec item from PR 1 that PR 1 explicitly deferred and no later PR picked up. The spec's skip list is reproduced above.

**Placeholder scan:** no TBD/TODO. Task 4 deliberately does not enumerate which schemas to cover, because the honest answer depends on which `prepare` functions actually compute something — it requires the implementer to read them and justify both the coverage and the skips. That is the same judgement PR 4's tasks were asked for and it worked.

**Type consistency:** no cross-task interfaces exist in this PR — the three workspaces are independent, which is why the tasks can be dispatched in almost any order. Task 6 is the only one touching a config, and it touches only its own workspace's.
