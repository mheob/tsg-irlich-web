# WEB-296 Unit Tests — PR 4 (Components and Hooks) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cover the components that carry real logic with jsdom tests, asserting behaviour a user can observe rather than markup.

**Architecture:** Tests only. Everything lands in `apps/web`'s `dom` Vitest project — `.test.tsx` files, which the extension-based routing sends to jsdom automatically. Rendering goes through Testing Library; interaction through `user-event`. Server actions, `next/image`, `next/navigation` and `motion` are mocked at the module boundary; no `fetch` is involved anywhere in this PR.

**Tech Stack:** Vitest 4, jsdom 30, `@testing-library/react` 16.3, `@testing-library/user-event` 14.6, React 19.2, Radix UI, `motion`, `react-hook-form` + Zod 4, pnpm 11, Turbo, GitButler CLI (`but`).

**Spec:** `docs/superpowers/specs/2026-08-25-web-296-unit-tests-design.md`, section "PR 4 — Komponenten und Hook"

**Base branch:** `next`, which contains PR 1 (#471) and PR 2 (#472). PR 3 (#473) is open and touches only actions and the CleverReach client — no file this PR needs — so this branch starts from `next` and is independent of it. New branch: `test/web-296-unit-tests-components`.

## Global Constraints

- Node `^24.19.0`, pnpm `11.22.0` — `.nvmrc` and `packageManager` untouched.
- Tests live next to their source. **Every file in this PR is a `.test.tsx`**, which is what routes it to the jsdom project; a `.test.ts` under `src/components/` or `src/hooks/` also lands in `dom`, but prefer `.tsx` since these render.
- Explicit imports from `vitest`. No `globals: true`.
- `describe` titles start lowercase and are never identical to an imported identifier. `beforeEach`/`afterEach`/`beforeAll`/`afterAll` sit inside a `describe` block.
- Never widen the test-file override in `oxlint.config.ts`; use a narrow inline comment if a file needs a suppression.
- **A `vi.fn()` created inside a `vi.mock(…)` factory is reset by neither `vi.resetModules()` nor `vi.restoreAllMocks()`** — only `vi.spyOn` registrations are. Every mocked function needs an explicit `.mockReset()` in `afterEach`. This cost PR 3 a debugging round; `apps/web/src/actions/send-contact-form.test.ts` is the worked example and `apps/web/AGENTS.md` records it.
- No new dependency. No change to any `vitest.config.ts`, `turbo.json`, CI file, `sonar-project.properties`, or production source — if a test uncovers a real bug, report it and stop; the controller decides.
- Commits through GitButler with explicit file paths: `but commit -b test/web-296-unit-tests-components -m "…" <paths>`. Conventional Commits, no `Co-Authored-By`, no generator trailer.
- After every task: `pnpm run lint`, `pnpm run format:check`, `pnpm run typecheck` clean and `pnpm run test` green.
- **Expected values are derived from the implementation, never from this plan's prose.** PR 2's plan was wrong four times and PR 3's twice; every implementer caught it by checking. If the code contradicts a value below, that is a finding — report it and write what the code really does.
- **Assert what a user can observe, not the DOM's shape.** Query by role, label, or text; never by class name, never by `data-testid` added for the test's convenience, and never assert a Tailwind class string. A test that pins markup breaks on every redesign and proves nothing about behaviour.
- **Assert the failure, not just that something failed.** PR 2's final review named bare `.toThrow()` and boolean-only checks as its weakest assertions; PR 3 replaced partial-object matches with whole-payload assertions for the same reason.

## Infrastructure this PR consumes and extends

From PR 1, already in `next`:

- `apps/web/vitest.config.ts` — the `dom` project (jsdom) matches `src/**/*.test.tsx` plus `.test.ts` under `src/components/` and `src/hooks/`, and loads `apps/web/test-utils/setup-dom.ts` as its `setupFiles`. The `assetStub` plugin resolves static image imports.
- `apps/web/test-utils/setup-dom.ts` — stubs `window.matchMedia` (one cached `MediaQueryList` per query string, with `matches` updated on dispatch), `ResizeObserver`, `IntersectionObserver`, and the Radix pointer-capture surface (`hasPointerCapture`, `setPointerCapture`, `releasePointerCapture`, `scrollIntoView`). Exports `createMatchMediaStub` and `dispatchMediaQueryChange`.

**What PR 1 deliberately left for this PR:** the spec's DOM-setup paragraph also lists module mocks for `next/image`, `next/navigation` and `motion`. PR 1 shipped only the globals, because a module mock with no consumer is dead code. Task 2 adds them, and every later task builds on them.

---

### Task 1: Branch

**Files:** commit this plan.

**Interfaces:**

- Consumes: nothing.
- Produces: branch `test/web-296-unit-tests-components` off `next`.

- [ ] **Step 1: Confirm the base**

Run: `git fetch origin && git log --oneline -1 origin/next` and `but status` Expected: `next` contains #472's merge commit; the working tree is clean.

- [ ] **Step 2: Create the branch, then commit**

`but commit -b <new-branch>` creates a SIBLING rather than a stacked branch — PR 2 lost time to exactly that. Create it explicitly first:

```bash
but branch new test/web-296-unit-tests-components
but commit -b test/web-296-unit-tests-components \
  -m "docs: add the component test plan for WEB-296" \
  docs/superpowers/plans/2026-08-26-web-296-unit-tests-pr4-components.md
```

- [ ] **Step 3: Verify**

Run: `git log --oneline origin/next..test/web-296-unit-tests-components` Expected: exactly one commit, carrying only the plan file.

---

### Task 2: Shared render helpers and the module mocks

**Files:**

- Create: `apps/web/test-utils/render.tsx`
- Modify: `apps/web/test-utils/setup-dom.ts`
- Create: `apps/web/src/components/ui/badge/badge.test.tsx` (or the nearest trivial component — see Step 4)

**Interfaces:**

- Consumes: PR 1's `setup-dom.ts` and the `dom` project.
- Produces, for every later task:
  - `renderWithUser(ui: ReactElement): { user: UserEvent } & RenderResult` — renders and returns a `user-event` instance set up against the same document.
  - Module mocks for `next/image`, `next/navigation` and `motion`, applied globally through `setupFiles`, each with a documented escape hatch for a test that needs to control them per case.

This is the load-bearing task of the PR: nine later files depend on these mocks behaving well. Get the mocks minimal and honest — a mock that silently swallows behaviour makes every test above it worthless.

- [ ] **Step 1: `next/image`**

The real component demands Next's image config and an optimizer. Mock it to a plain `<img>` that forwards `src`, `alt`, `width`, `height` and `className`, and drops Next-only props (`fill`, `preload`, `quality`, `sizes`, `loader`, `placeholder`, `blurDataURL`) so React does not warn about unknown DOM attributes. A static import resolves to the `assetStub` object, so `src` may be an object — render `src.src` when so. Keep `alt` verbatim: several later tasks query images by their accessible name.

- [ ] **Step 2: `next/navigation`**

Mock `usePathname` and `useRouter`. `usePathname` returns a value a test can set; `useRouter` returns an object whose `push`, `replace`, `back` and `prefetch` are `vi.fn()`s. Export a way for a test to set the current pathname (for example a `setPathname` helper the mock closes over), and document that these mocks need `.mockReset()` in `afterEach` per the global constraint.

- [ ] **Step 3: `motion`**

`motion/react` is imported by `lightbox.tsx` (`AnimatePresence`, `motion`, `useReducedMotion`, and the `PanInfo`/`Transition` types) and `number-ticker.tsx` (`useInView`, `useMotionValue`, `useSpring`). Animations must not make assertions timing-dependent:

- `motion.<tag>` renders the plain tag, forwarding children and standard DOM props while dropping animation props (`initial`, `animate`, `exit`, `transition`, `variants`, `drag`, `onPan*`, `whileTap`, …).
- `AnimatePresence` renders its children directly, so an exiting element leaves the tree immediately.
- `useReducedMotion` returns `true`, which is the branch that skips animation.
- `useInView` returns `true` so the ticker starts; `useMotionValue`/`useSpring` need enough of their real surface (`get`, `set`, `on`/`onChange`) for `number-ticker.tsx` to work — read that file and implement exactly what it uses, no more. Where the real behaviour cannot be faithfully reproduced, say so in the report rather than papering over it: Task 8 depends on knowing whether the ticker's value is really driven or merely stubbed.

- [ ] **Step 4: Prove the setup with one trivial render**

Pick the simplest component in `src/components/ui/` that renders text and takes a variant prop, and write a couple of cases for it: it renders its children, and a variant prop changes something a user can perceive (its accessible role or text, not its class string — if the only observable difference IS the class, say so in the report and assert nothing about styling). The point is to prove the harness renders at all before nine files depend on it.

- [ ] **Step 5: Verify the mocks are actually applied**

Run one case that renders a `next/image` and one that reads `usePathname`, and confirm no React warning about unknown props appears in the output (fail the run on console noise if that is straightforward; otherwise assert on a `console.error` spy). Paste the run.

- [ ] **Step 6: Gates and commit**

```bash
pnpm --filter web test
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-components \
  -m "test(web): add the component render helpers and module mocks" \
  apps/web/test-utils/render.tsx apps/web/test-utils/setup-dom.ts <the trivial component's test file>
```

---

### Task 3: `ui/lightbox.tsx`

**Files:**

- Create: `apps/web/src/components/ui/lightbox.test.tsx`

**Interfaces:**

- Consumes: `renderWithUser`, the `motion` and `next/image` mocks, PR 1's Radix pointer-capture stubs.
- Produces: nothing.

The largest component in the PR (347 lines) and the one with real interaction logic: a Radix dialog, context, keyboard handling, paging and drag-to-dismiss. Read it fully, including how `LightboxGallery`, `LightboxTrigger` and the context fit together, before writing a line.

- [ ] **Step 1: Cases**

- A trigger opens the lightbox showing the image it belongs to — assert by the image's accessible name, not by index.
- Clicking the trigger of the third image opens on that image, not the first.
- The next and previous controls move between images; assert which image is displayed after each.
- Behaviour at both ends: whatever the code does (wrap or clamp), assert it — derive which from the source.
- `Escape` closes. Arrow keys page.
- A caption renders when the image has one and is absent when it does not.
- A single-image gallery hides the paging controls.
- Assert the dialog's accessibility surface: it has a dialog role and an accessible name.

- [ ] **Step 2: Note what you cannot test**

Drag-to-dismiss goes through `motion`'s pan handlers, which the mock drops. Do not fake a pan gesture by calling internals — instead state plainly in the report that the drag path is untested and why. That is honest coverage; a faked gesture is not.

- [ ] **Step 3: Gates and commit**

```bash
pnpm --filter web test src/components/ui/lightbox.test.tsx
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-components \
  -m "test(web): cover the lightbox interaction" \
  apps/web/src/components/ui/lightbox.test.tsx
```

---

### Task 4: `ui/gallery.tsx` and `ui/portable-text.tsx`

**Files:**

- Create: `apps/web/src/components/ui/gallery.test.tsx`
- Create: `apps/web/src/components/ui/portable-text.test.tsx`

**Interfaces:**

- Consumes: Task 2's helpers; `gallery.tsx` renders the lightbox from Task 3's module.
- Produces: nothing.

- [ ] **Step 1: `gallery.test.tsx`**

- One thumbnail per image, each with its alt text as accessible name.
- Clicking thumbnail _n_ opens the lightbox on image _n_ — the integration Task 3 tests from the other side.
- The rounded-corners flag: only assert it if it changes something observable beyond a class; if it does not, say so and skip it rather than asserting a class name.
- Only the first image is preloaded — assert whatever observable difference the code produces, and if the `preload` prop is dropped by the `next/image` mock, report that this is untestable through the mock instead of asserting on the mock's internals.
- An empty image list renders nothing (or whatever the code does).

- [ ] **Step 2: `portable-text.test.tsx`**

`portable-text.tsx` imports `next-sanity`, which only works because PR 2 aligned `@sanity/client` — if you hit an import error here, that is a finding, not something to mock around. Cases: each mark and block type renders its element; an internal link resolves through `getInternalHref` to the right `href`; an external link gets `rel` and `target`; an unknown block type does not crash the render; an image block renders with its alt text. Build the Portable Text fixtures by hand from the types, and keep them minimal.

- [ ] **Step 3: Gates and commit**

```bash
pnpm --filter web test src/components/ui/gallery.test.tsx src/components/ui/portable-text.test.tsx
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-components \
  -m "test(web): cover the gallery and the portable text renderer" \
  apps/web/src/components/ui/gallery.test.tsx apps/web/src/components/ui/portable-text.test.tsx
```

---

### Task 5: `section/contact-form.tsx`

**Files:**

- Create: `apps/web/src/components/section/contact-form.test.tsx`

**Interfaces:**

- Consumes: Task 2's helpers; mocks `@/actions/send-contact-form`.
- Produces: the form-testing pattern Task 6 reuses.

`react-hook-form` with a Zod resolver, wrapped around `next-safe-action`'s `useAction`. Read the component and `apps/web/src/lib/validations/contact-form.ts` first. Remember that validation is asynchronous: await the message appearing rather than asserting immediately after a click.

- [ ] **Step 1: Cases**

- Submitting empty shows the German validation messages from the schema — assert the exact strings, hard-coded, and that the action was NOT called.
- A valid submission calls the action exactly once with the parsed values — assert the whole argument object.
- The action's failure path renders its error to the user.
- Success renders the confirmation and clears the fields.
- Submit is disabled while the action is pending — drive that from the mocked action's pending state rather than by racing a timer.
- Every field's label is associated with its control: query by label throughout, which proves the association as a side effect.

- [ ] **Step 2: Gates and commit**

```bash
pnpm --filter web test src/components/section/contact-form.test.tsx
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-components \
  -m "test(web): cover the contact form" \
  apps/web/src/components/section/contact-form.test.tsx
```

---

### Task 6: The feedback form and its screenshot upload

**Files:**

- Create: `apps/web/src/components/with-logic/feedback/form.test.tsx`
- Create: `apps/web/src/components/with-logic/feedback/screenshot-upload.test.tsx`

**Interfaces:**

- Consumes: Task 5's form pattern; mocks `@/actions/create-linear-issue` and `@/actions/upload-to-linear`.
- Produces: nothing.

- [ ] **Step 1: `form.test.tsx`**

Same shape as Task 5, against `apps/web/src/lib/validations/feedback.ts`: the required fields' messages, the type and browser/OS selects, a valid submission calling the action once with the whole payload, the failure and success paths, and the pending state.

- [ ] **Step 2: `screenshot-upload.test.tsx`**

- Selecting an image file uploads it and shows it in the list. Build the file with `new File([bytes], name, { type })` and hand it over with `user.upload`.
- A wrong file type and an oversize file are each rejected with their message, and the upload action is not called.
- The pending state is visible while the upload runs.
- Removing an entry takes it out of the list and leaves the rest intact.
- An upload failure surfaces an error and does not leave a half-added entry behind.

- [ ] **Step 3: Gates and commit**

```bash
pnpm --filter web test src/components/with-logic/feedback
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-components \
  -m "test(web): cover the feedback form and screenshot upload" \
  apps/web/src/components/with-logic/feedback/form.test.tsx \
  apps/web/src/components/with-logic/feedback/screenshot-upload.test.tsx
```

---

### Task 7: `with-logic/navigation.tsx` and `section/newsletter.tsx`

**Files:**

- Create: `apps/web/src/components/with-logic/navigation.test.tsx`
- Create: `apps/web/src/components/section/newsletter.test.tsx`

**Interfaces:**

- Consumes: Task 2's `next/navigation` mock and PR 1's `matchMedia` stub; mocks `@/actions/subscribe-to-newsletter`.
- Produces: nothing.

- [ ] **Step 1: `navigation.test.tsx`**

Read `isActivePage` and the props from `MainNavigationQueryResult`, and build a fixture from those types.

- Every navigation item renders as a link with the href `getInternalHref` produces.
- The item matching the current pathname is marked active — assert through `aria-current` if the component sets it, and if it only sets a class, say so in the report and assert the closest observable thing instead.
- The desktop and mobile branches: drive them with `createMatchMediaStub(true|false)` from `setup-dom.ts`, and assert what differs for a user.
- Opening and closing the mobile menu, driven by clicking its control and asserting the links' visibility.

- [ ] **Step 2: `newsletter.test.tsx`**

`useActionState` with a plain action, so the mocked action's resolved state drives the render.

- The success state renders its title and message.
- The error state renders its message.
- The email field is submitted as `FormData` — assert the action received the address.
- The pending state disables submission.

- [ ] **Step 3: Gates and commit**

```bash
pnpm --filter web test src/components/with-logic/navigation.test.tsx src/components/section/newsletter.test.tsx
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-components \
  -m "test(web): cover the navigation and the newsletter form" \
  apps/web/src/components/with-logic/navigation.test.tsx \
  apps/web/src/components/section/newsletter.test.tsx
```

---

### Task 8: The remaining with-logic components

**Files:**

- Create: `apps/web/src/components/with-logic/breadcrumb.test.tsx`
- Create: `apps/web/src/components/with-logic/number-ticker.test.tsx`
- Create: `apps/web/src/components/with-logic/contact-link.test.tsx`
- Create: `apps/web/src/components/with-logic/contact-persons.test.tsx`

**Interfaces:**

- Consumes: Task 2's helpers, particularly the `motion` mock for the ticker.
- Produces: nothing.

- [ ] **Step 1: `breadcrumb.test.tsx`**

Segments derived from the pathname (set through the `next/navigation` mock), humanised labels, and the last segment rendered as text rather than a link. Assert via the `navigation` landmark and its links.

- [ ] **Step 2: `number-ticker.test.tsx`**

The ticker's value is driven by `useSpring`, which Task 2 mocked. Read what Task 2 actually implemented: if the mock drives the value, assert the component reaches its target under fake timers and respects its delay; if the mock only stubs the surface, then the value is not really driven and you must say so plainly — assert what is genuinely observable (the initial render, the formatting through `DEFAULT_LOCALE`, the decimal places) and report the gap rather than dressing a stub up as coverage.

- [ ] **Step 3: `contact-link.test.tsx` and `contact-persons.test.tsx`**

`mailto:` and `tel:` hrefs built from the data, the initials fallback when a person has no image, and an empty list rendering nothing. Assert hrefs exactly.

- [ ] **Step 4: Gates and commit**

```bash
pnpm --filter web test src/components/with-logic
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-components \
  -m "test(web): cover the breadcrumb, ticker and contact components" \
  apps/web/src/components/with-logic/breadcrumb.test.tsx \
  apps/web/src/components/with-logic/number-ticker.test.tsx \
  apps/web/src/components/with-logic/contact-link.test.tsx \
  apps/web/src/components/with-logic/contact-persons.test.tsx
```

---

### Task 9: Close out

**Files:** none, unless the accessibility findings warrant a documentation line.

- [ ] **Step 1: Full verification**

Run: `pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run test && pnpm run build` Expected: all green. Record the test total and the per-workspace split.

- [ ] **Step 2: Coverage**

Run: `pnpm run test:coverage` Record the line coverage for `apps/web/src/components`, and note which of the tested components are furthest from covered.

- [ ] **Step 3: Report, in English**

Collect for the pull request: the components covered, the test total, coverage figures, every disagreement found between this plan and real behaviour, every place where the module mocks made something untestable (the drag gesture, the preload prop, any class-only distinction), and any accessibility gap the tests exposed — a control without an accessible name, a label not associated with its input, an active state expressed only by colour. Those are real findings worth surfacing even though fixing them is out of scope here.

---

## Deliberately not covered

Per the spec: the shadcn/Radix wrappers (`select`, `dialog`, `drawer`, `scroll-area`, `card`, `input`, `textarea`, `toggle`, `toggle-group`, `alert`, `badge` beyond Task 2's smoke test, `button`, the breadcrumb primitives) and the presentational cards (`training-card`, `group-card`, `pricing-card`, `news-article-preview*`, `hero`, `vision`, `footer`). They spread props and CVA classes; Radix and typegen already cover that, and asserting their class strings would pin markup rather than behaviour. Interaction on those surfaces belongs to the E2E ticket under epic WEB-294.

`apps/web/src/hooks/use-media-query.ts` was covered by PR 1.

## Self-Review

**Spec coverage:** every component in the spec's PR 4 list maps to a task — lightbox (3), gallery and portable-text (4), contact-form (5), feedback form and screenshot-upload (6), navigation and newsletter (7), breadcrumb, number-ticker, contact-link and contact-persons (8). The spec's skip list is reproduced verbatim above. `use-media-query` is noted as already done.

**Placeholder scan:** no TBD/TODO. Task 2 describes each mock's required surface without dictating an implementation, because the honest shape depends on what the components actually import — and three later tasks are told to report a gap rather than fake coverage if a mock cannot reproduce real behaviour.

**Type consistency:** `renderWithUser` is defined once in Task 2 and consumed by name in Tasks 3-8; `createMatchMediaStub` and `dispatchMediaQueryChange` match what PR 1 shipped; the `next/navigation` pathname setter is introduced in Task 2 and used by Tasks 7 and 8.
