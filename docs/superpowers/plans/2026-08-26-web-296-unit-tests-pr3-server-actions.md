# WEB-296 Unit Tests — PR 3 (Server Actions) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cover the four server actions and the CleverReach client with unit tests, mocking at the HTTP boundary so the response parsing stays under test.

**Architecture:** Tests only. Every external call in this layer goes through `fetch` (CleverReach REST, Linear GraphQL, Linear's S3 PUT); only Resend is an SDK. So `fetch` is stubbed through PR 1's `apps/web/test-utils/fetch-mock.ts`, and just two modules are mocked: `@/lib/resend` and `next/headers`. The actions are wrapped by `next-safe-action`, so tests assert its envelope rather than a bare return value. `'use server'` is inert under Vitest.

**Tech Stack:** Vitest 4, Zod 4, `next-safe-action` 8, pnpm 11 workspaces, Turbo, GitButler CLI (`but`).

**Spec:** `docs/superpowers/specs/2026-08-25-web-296-unit-tests-design.md`, section "PR 3 — Server Actions und CleverReach"

**Base branch:** `next`, which now contains PR 1 (#471, merged). PR 2 (#472) is open and touches none of the files here, so this branch starts from `next`. New branch: `test/web-296-unit-tests-server-actions`.

## Global Constraints

- Node `^24.19.0`, pnpm `11.22.0` — `.nvmrc` and `packageManager` untouched.
- Tests live next to their source; `.test.ts` only, so everything lands in the `node` project.
- Explicit imports from `vitest`. No `globals: true`.
- `describe` titles start lowercase and are never identical to an imported identifier. `beforeEach`/`afterEach`/`beforeAll`/`afterAll` sit inside a `describe` block.
- Never widen the test-file override in `oxlint.config.ts`; use a narrow inline comment if a file needs a suppression.
- No new dependency. No change to any `vitest.config.ts`, `turbo.json`, CI file, `sonar-project.properties`, or production source — if a test uncovers a real bug, report it and stop; the controller decides.
- Commits through GitButler with explicit file paths: `but commit -b test/web-296-unit-tests-server-actions -m "…" <paths>`. Conventional Commits, no `Co-Authored-By`, no generator trailer.
- After every task: `pnpm run lint`, `pnpm run format:check`, `pnpm run typecheck` clean and `pnpm run test` green.
- **Expected values are derived from the implementation, never from this plan's prose.** PR 2's plan was wrong four times; the implementers caught it because they checked. If the code contradicts a value below, that is a finding: report it and write what the code really does.
- **No assertion may build its expected value by calling the function under test or importing a constant the implementation also imports.** Hard-code literals — including URLs, error messages and the `409` status.
- **Assert the failure, not just that something failed.** PR 2's final review named bare `.toThrow()` and boolean-only `success` checks as its weakest assertions. Here, assert the error message or the returned `code`, and for `next-safe-action` results assert which key is populated.

## Infrastructure this PR consumes (all from PR 1)

- `apps/web/test-utils/fetch-mock.ts` — `createFetchMock()` returns `{ calls, enqueue, enqueueJson, restore, unqueued }`. Responses are handed out FIFO in enqueue order, not routed by URL. `calls` records `{ body, bodyBytes, headers, method, url }` for every request; **recorded header names are lowercased**, because the mock normalizes through `Headers` as real `fetch` does — assert `authorization`, not `Authorization`. `body` captures a `string` request body as-is and a `URLSearchParams` body (the CleverReach token request) through `String(...)`; `bodyBytes` captures an `ArrayBuffer`/`ArrayBufferView` body (the Linear upload's file bytes) as a `Uint8Array` instead, leaving `body` `undefined`. Any other body type — a `Blob`, a `FormData`, a stream — leaves both fields `undefined`.
- `unqueued` exists for this PR specifically: `subscribe()` in `cleverreach.ts` wraps its flow in a `try`/`catch` that returns `INTERNAL_ERROR`, so a short mock queue looks exactly like a genuine failure. **Every test whose subject swallows errors must assert `expect(mock.unqueued).toEqual([])`.**
- `apps/web/test-utils/env.ts` — `loadWithEnv(specifier, vars)` resets the module registry and stubs env vars. Required here for two reasons: these modules read env at call time, and `cleverreach.ts` holds a module-level `tokenCache` that must not leak between cases. Import the module under test as `import type` only.

---

### Task 1: Branch

**Files:** commit this plan.

**Interfaces:**

- Consumes: nothing.
- Produces: branch `test/web-296-unit-tests-server-actions` off `next`.

- [ ] **Step 1: Confirm the base**

Run: `git log --oneline -1 origin/next` and `but status` Expected: `next` contains PR 1's merge commit; the working tree is clean.

- [ ] **Step 2: Create the branch and commit the plan**

`but branch new` does NOT stack by default and `but commit -b` creates a sibling — PR 2 hit exactly that. Create the branch explicitly, then commit:

```bash
but branch new test/web-296-unit-tests-server-actions
but commit -b test/web-296-unit-tests-server-actions \
  -m "docs: add the server action test plan for WEB-296" \
  docs/superpowers/plans/2026-08-26-web-296-unit-tests-pr3-server-actions.md
```

- [ ] **Step 3: Verify**

Run: `but status` and `git log --oneline origin/next..test/web-296-unit-tests-server-actions` Expected: exactly one commit, carrying only the plan file.

---

### Task 2: `lib/cleverreach.ts` — the access token

**Files:**

- Create: `apps/web/src/lib/cleverreach.test.ts`

**Interfaces:**

- Consumes: `createFetchMock`, `loadWithEnv`.
- Produces: the file Task 3 extends. Task 3 appends `describe` blocks to it rather than creating a second file.

`getAccessToken` is not exported. Reach it through `subscribe`, which calls it first, and assert on `mock.calls[0]` — the request to `/oauth/token.php`. This is the subtlest test in the PR: the token lives in a module-level `tokenCache`, and the module also computes a five-minute expiry buffer from `timeSpanInMilliSeconds('minute')`.

- [ ] **Step 1: Set up the file**

Load the module through `loadWithEnv` in every case with all four CleverReach variables set to fixed values, so the token cache starts empty each time. Use fake timers where expiry matters, and remember to restore them in an `afterEach` inside the `describe`.

- [ ] **Step 2: Cases**

- A successful flow requests the token first: `mock.calls[0].url` is `'https://rest.cleverreach.com/oauth/token.php'`, `method` is `'POST'`, the `content-type` header is `'application/x-www-form-urlencoded'`, and the body contains `grant_type=client_credentials` plus the client id and secret from the stubbed env.
- The token is reused: drive two `subscribe` calls in one module instance and assert the token endpoint was hit exactly once (count entries in `calls` whose url ends `oauth/token.php`).
- A token near expiry is refetched: with fake timers, advance beyond `expires_in` minus the five-minute buffer, drive a second `subscribe`, and assert a second token request happened. Derive the buffer from the code, not from this sentence.
- A non-ok token response makes `subscribe` return `INTERNAL_ERROR` — assert the returned `code`, and assert the thrown message reached `console.error` (spy on it) so the failure is attributed, not merely counted.
- A token payload that fails `accessTokenSchema` (for example `expires_in` as a string) also yields `INTERNAL_ERROR`.
- Every case asserts `mock.unqueued` is empty.

- [ ] **Step 3: Run, gate, commit**

```bash
pnpm --filter web test src/lib/cleverreach.test.ts
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-server-actions \
  -m "test(web): cover the cleverreach access token handling" \
  apps/web/src/lib/cleverreach.test.ts
```

---

### Task 3: `lib/cleverreach.ts` — subscription flow

**Files:**

- Modify: `apps/web/src/lib/cleverreach.test.ts`

**Interfaces:**

- Consumes: the file and its helpers from Task 2.
- Produces: nothing.

- [ ] **Step 1: `addReceiver` cases (through `subscribe`)**

- Happy path: after the token, the second call is a POST to `/v3/groups.json/<listId>/receivers` with a bearer `authorization` header (lowercase key) and a JSON body carrying `email`, `activated: 0`, `source` and a `registered` unix timestamp. Pin the timestamp with fake timers rather than asserting loosely.
- A `409` response returns `{ code: 'ALREADY_SUBSCRIBED', success: false }` — assert both the code and the German-free error string the module produces.
- Another error status whose body parses as `{ error: { code, message } }` passes that code and message through — assert both.
- An error body that is not JSON falls back to `'Failed to add subscriber'`.
- A failed `addReceiver` means the DOI mail is never requested: assert the call count.

- [ ] **Step 2: `sendDoiEmail` and `resolveDoiMetadata`**

- Happy path: the third call is a POST to `/v3/forms.json/<formId>/send/activate` whose body carries `email`, `groups_ids` and a `doidata` object with `referer`, `user_agent`, `user_ip`.
- A failing DOI request does NOT fail the subscription: the result is still successful, and `console.error` was called. This is the one case where a swallowed error is the documented behavior.
- Explicit metadata wins over the defaults.
- With no metadata, `referer` derives from `VERCEL_PROJECT_PRODUCTION_URL`, `userAgent` falls back to `'Mozilla/5.0'` and `userIp` to `'0.0.0.0'`; with that variable unset, `referer` is `''`.

- [ ] **Step 3: `subscribe` itself**

- An invalid email returns `code: 'VALIDATION_ERROR'` and makes NO fetch at all — assert `calls` is empty.
- A thrown error anywhere inside yields `INTERNAL_ERROR` with the module's message.
- The happy path returns the confirmation message and hit all three endpoints in order — assert the order from `calls`.

- [ ] **Step 4: Run, gate, commit**

```bash
pnpm --filter web test src/lib/cleverreach.test.ts
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-server-actions \
  -m "test(web): cover the cleverreach subscription flow" \
  apps/web/src/lib/cleverreach.test.ts
```

---

### Task 4: `actions/subscribe-to-newsletter.ts`

**Files:**

- Create: `apps/web/src/actions/subscribe-to-newsletter.test.ts`

**Interfaces:**

- Consumes: `createFetchMock`, `loadWithEnv`, and a mock of `next/headers`.
- Produces: the `next/headers` mocking pattern the later action tests reuse.

This action is a plain `useActionState` function, not a `next-safe-action` client, so it returns `NewsletterFormState` directly. It reads request headers through `await headers()`, so `next/headers` must be mocked. Build the `FormData` by hand.

- [ ] **Step 1: Cases**

- Missing `email` in the `FormData` returns the error state with `'Bitte überprüfe Deine Eingaben.'` — assert the exact string, and that no fetch happened.
- An invalid email does the same.
- `x-forwarded-for` with several IPs takes the first and trims it; assert the value that reached the DOI request body.
- Missing headers fall back to `''` referer, `'Mozilla/5.0'` user agent and `'0.0.0.0'` IP.
- Each `result.code` maps to its German message: `ALREADY_SUBSCRIBED`, `INTERNAL_ERROR`, `VALIDATION_ERROR` — drive each by shaping the CleverReach responses, and assert the message.
- An unknown code falls back to the raw error string.
- The success state carries its title and message.

- [ ] **Step 2: Run, gate, commit**

```bash
pnpm --filter web test src/actions/subscribe-to-newsletter.test.ts
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-server-actions \
  -m "test(web): cover the newsletter subscription action" \
  apps/web/src/actions/subscribe-to-newsletter.test.ts
```

---

### Task 5: `actions/create-linear-issue.ts`

**Files:**

- Create: `apps/web/src/actions/create-linear-issue.test.ts`

**Interfaces:**

- Consumes: `createFetchMock`, `loadWithEnv`.
- Produces: the `next-safe-action` envelope assertions Task 6 and Task 7 reuse.

Wrapped by `next-safe-action`, so the result is an envelope. Determine the real shape by calling the action once and inspecting it — do not assume `data`/`serverError`/`validationErrors` key names from this plan; write down what the installed version actually returns and use that.

- [ ] **Step 1: `buildDescription` cases (through the action)**

Assert on the GraphQL request body:

- The screenshot block appears only when `screenshotUrls` is non-empty, and renders one markdown image per URL.
- Metadata lines skip falsy fields, and `privacy: true` renders.
- The `Source` line is always last.
- The title is `[TYPE] <title>` with the type upper-cased.
- The variables carry `teamId`, `assigneeId` and `labelIds` from the stubbed env.

- [ ] **Step 2: Failure paths**

- A non-ok HTTP response surfaces `HTTP error: <status>` — assert the message, not merely that it failed.
- A GraphQL body with `errors` surfaces `Failed to create issue`, and `console.error` saw the errors.
- `issueCreate.success: false`, and separately a missing `issue`, both surface `Issue creation failed`.
- A payload that fails `linearResponseSchema` surfaces a Zod error rather than a silent success.
- An input failing `feedbackFormSchema` never reaches fetch — assert `calls` is empty and the envelope reports a validation failure.

- [ ] **Step 3: Happy path**

The envelope carries `issueId` and `issueIdentifier`; the request went to `'https://api.linear.app/graphql'` with the api key in the lowercase `authorization` header.

- [ ] **Step 4: Run, gate, commit**

```bash
pnpm --filter web test src/actions/create-linear-issue.test.ts
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-server-actions \
  -m "test(web): cover the linear issue creation action" \
  apps/web/src/actions/create-linear-issue.test.ts
```

---

### Task 6: `actions/upload-to-linear.ts`

**Files:**

- Create: `apps/web/src/actions/upload-to-linear.test.ts`

**Interfaces:**

- Consumes: `createFetchMock`, `loadWithEnv`, the envelope shape from Task 5.
- Produces: nothing.

Node 24 has `File` and `Blob` globally, so build fixtures with `new File([bytes], name, { type })`.

- [ ] **Step 1: Schema cases**

- A non-image type is rejected with `'Invalid file type. Only images are allowed.'`; assert the message from the envelope's validation errors, and that no fetch happened.
- A file over 10 MB is rejected with `'File too large. Maximum size is 10MB.'`. Construct the oversize file without allocating 10 MB of real data if you can (a sparse `File` whose `size` exceeds the limit); if that is not possible, say so and allocate.
- Each allowed type in `ALLOWED_TYPES` passes the schema.

- [ ] **Step 2: Flow cases**

- Happy path: two requests — a GraphQL `fileUpload` mutation, then a PUT to the returned `uploadUrl` whose headers merge Linear's headers over `Content-Type` (assert lowercase keys) and whose body is the file's bytes. The envelope carries `assetUrl`.
- `data.fileUpload.uploadFile` missing surfaces `Failed to get upload URL: <status> - <payload>`; assert the status appears.
- A GraphQL body with `errors` does the same, and `console.error` saw them.
- A failing PUT surfaces `Failed to upload file: <status>`.
- `buildUploadHeaders` behavior is observable through the PUT request's headers: a Linear header named `content-type` overrides the file's type.

- [ ] **Step 3: Run, gate, commit**

```bash
pnpm --filter web test src/actions/upload-to-linear.test.ts
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-server-actions \
  -m "test(web): cover the linear file upload action" \
  apps/web/src/actions/upload-to-linear.test.ts
```

---

### Task 7: `actions/send-contact-form.ts`

**Files:**

- Create: `apps/web/src/actions/send-contact-form.test.ts`

**Interfaces:**

- Consumes: `loadWithEnv`, a mock of `@/lib/resend`, the envelope shape from Task 5.
- Produces: nothing.

The only SDK mock in this PR. Mock `@/lib/resend` so `resend.emails.send` is a `vi.fn()` whose resolved value each case controls, and assert on its arguments. No `fetch` involved.

- [ ] **Step 1: Cases**

- With `NODE_ENV` production and a receiver, `to` is the receiver's email.
- Production without a receiver falls back to `'info@tsg-irlich.de'`.
- Outside production, `to` is forced to `'it@tsg-irlich.de'` even when a receiver is given.
- `bcc` is `['it@tsg-irlich.de']`, `replyTo` is the sender's email, and the subject is `` `Webseiten-Kontaktformular: Neue Nachricht von ${name}` `` — assert the exact string.
- `react` receives the props the action builds; assert the ones that come from input (`contactEmail`, `contactMessage`, `contactName`, `receiver`) and that `baseUrl` is present.
- Resend returning `{ error }` surfaces `'Email could not be sent'`, and `console.error` saw the Resend error.
- An input failing `contactFormSchema` never calls `send` — assert the mock was not called and the envelope reports a validation failure.

- [ ] **Step 2: Run, gate, commit**

```bash
pnpm --filter web test src/actions/send-contact-form.test.ts
pnpm run lint && pnpm run format:check && pnpm run typecheck
but commit -b test/web-296-unit-tests-server-actions \
  -m "test(web): cover the contact form action" \
  apps/web/src/actions/send-contact-form.test.ts
```

---

### Task 8: Close out

**Files:** none.

- [ ] **Step 1: Full verification**

Run: `pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run test && pnpm run build` Expected: all green. Record the new test total and the per-workspace split.

- [ ] **Step 2: Coverage**

Run: `pnpm run test:coverage` Note the line coverage for `apps/web/src/actions` and `apps/web/src/lib/cleverreach.ts`.

- [ ] **Step 3: Report**

Summarize for the pull request, in English: files covered, the test total, coverage figures, every disagreement found between this plan and real behavior, and any production bug found. Pushing the branch, opening the PR against `next` and commenting on Linear are the user's call.

---

## Self-Review

**Spec coverage:** every item in the spec's PR 3 section maps to a task — `cleverreach.ts` split across Tasks 2 and 3 because the token cache and the subscription flow are independently tricky, then one task per action (4, 5, 6, 7).

**Placeholder scan:** no TBD/TODO. The plan deliberately does NOT state the `next-safe-action` envelope's key names, and Task 5 Step 1 requires the implementer to determine them from the installed version — inventing them here is exactly the kind of prose error PR 2 caught four times.

**Type consistency:** `createFetchMock`'s `{ calls, enqueue, enqueueJson, restore, unqueued }` and `loadWithEnv(specifier, vars)` match what PR 1 shipped and PR 2 used; the lowercased-header behavior is stated once, at the top, and every task that asserts a header depends on it.
