# Form Builder with Dorfturnier Registration (WEB-278) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Editors build registration forms in the Studio. Each form gets a landing page at `/anmeldung/<slug>`. Submissions are stored privately in Sanity, notify the organizer and the submitter by mail, export to Excel, and are cleaned of addresses and birth dates after the event.

**Architecture:**

- **Pure form logic (`packages/shared/src/forms/`).** The shape of stored answers, the clean-up rule, the Excel sheet layout and the default texts live here, because the web app (action, cron) and the Studio (actions, initial values) both need them.
- **Studio (`apps/studio`).**
  - A `form` document whose `fields` array takes ten registered field object types.
  - A live-edited `form.submission` document with a private dot-ID.
  - A desk group "Formulare" with each form's submissions as a child list.
  - Two document actions on `form`: export and clean up.
- **Web app (`apps/web`).**
  - It builds a Zod schema from the field definitions at runtime. The client form and the server action share it.
  - The server action writes submissions with the write client and sends two mails through new templates in `packages/email`.
  - A daily Vercel cron route cleans due submissions.

**Tech Stack:**

- Next.js 16 App Router, react-hook-form (`useFieldArray`), Zod 4, next-safe-action 8
- Sanity Studio 6, `@sanity/ui`, `react-email`, Resend
- `botid` (new, web), `write-excel-file` (new, studio)
- Vitest via `vp test`, Playwright + MSW

**Spec:** `docs/superpowers/specs/2026-11-08-web-278-form-builder-design.md`, approved on 2026-11-08 with working assumption a) for open point 4. Read it before Task 1. This plan only adds the decisions the spec leaves to the builder. Mockups: `docs/superpowers/specs/2026-11-08-web-278-mockups/landing-page.html`.

**Branch:** `feat/web-278-form-builder`. With GitButler: `but branch new feat/web-278-form-builder`.

- Commits go through the `create-commit` skill. Run `pnpm run format:check` at the root before every `but commit`.
- Prefix `PATH` with `~/.local/share/vite-plus/bin` before running `pnpm`, `node` or `vp`.
- After every schema change run `pnpm run extract-types && pnpm run typegen:sanity` at the root and commit the generated files with the change.

## Decisions this plan adds to the spec

- **The technical key of a field is the array item's `_key`.** Sanity generates it, it never changes when the label changes, it is unique within its array, and duplicating the form keeps it. So there is no separate key field and nothing to lock.
- **Single markers instead of pickers.**
  - The "Bezeichnung" field is a boolean `isLabel` on text fields.
  - The confirmation recipient is a boolean `isConfirmationRecipient` on email fields.
  - Document validation allows at most one of each.
- **Choice options are a plain string array.** The stored answer is the chosen label. A single choice renders as `ToggleGroup` (`display: 'buttons'`) or `Select` (`display: 'select'`); a multiple choice renders as checkboxes.
- **Location is a free-text string (`location`), not a `venue` reference.** A ski trip has no venue document.
- **Retention is copied onto every stored answer** (`retention: 'delete' | 'year'`, omitted for "keep"). Clean-up then needs no form definition and is immune to later edits of the form.
- **`form.submission` is `liveEdit: true`.** Editors change status and values without a publish step, and no `drafts.form.submission.*` copies appear. Queries still exclude `drafts.**` defensively.
- **Every submission read and write in the web app uses `getWriteClient()`.** The public `client` has no token and cannot see dot-ID documents. The write client is `server-only`.
- **Group summary when collapsed:** the values of the group's first two text sub-fields, joined with ", " (e.g. `1 · Müller, Max`).
- **A group starts with one empty entry when it is required, otherwise with none.**
- **Mail recipients outside production go to `it@tsg-irlich.de`, like the contact form.** Both mails omit answers that carry a `retention`.
- **The honeypot field is named `website`.** A filled honeypot returns `{ status: 'registered' }` without storing or mailing anything.
- **Breadcrumb:** `getBreadcrumbItems` skips path prefixes that have no page of their own (`/anmeldung`).
- **The visual regression suite gets no new baseline in this plan.** It is Linux-only and regenerated in the container. The axe sweep does cover the new route.

## Global Constraints

- **Language:** every text an editor or visitor reads (Studio titles, descriptions, validation messages, website copy, mails) is German. Code, comments and test names are English.
- **No personal data in a document ID.** Submissions get `_id: 'form.submission.<uuid>'` (`crypto.randomUUID()`).
- **Recipient addresses:** the organizer mail goes only to addresses stored in Sanity. The confirmation goes only to the value of the field marked `isConfirmationRecipient`. No BCC.
- **Dependencies:** every new dependency goes through the catalog (`pnpm --filter <app> add <pkg>` writes `catalog:` because of `catalogMode: strict`).
- **Coverage:** `packages/shared` and `packages/email` stay at 100 %. The thresholds in `apps/web/vitest.config.ts` and `apps/studio/vitest.config.ts` never drop.
- **Tests:** they import from `vite-plus/test`, `describe` titles are lowercase, and tests live next to their source.
- **React:** no `try`/`catch`/`finally` in components or hooks; await with `settle()` from `@tsgi-web/shared`. Components are function declarations, props are `Readonly<…>`, exports are named, interfaces sit at the file end.
- **Web env vars** are read through `env('KEY')` from `@/lib/env`, never `process.env`, and never imported into a client component.
- **Base UI:** compose with the `render` prop, never `asChild`.
- **Sanity API version for Studio clients:** `2026-10-01`.
- **Status values** are `'registered' | 'waitlist' | 'cancelled'`, labelled `angemeldet`, `Warteliste`, `abgemeldet`.

## Review Focus

1. **Double submit.** A slow network plus a second click must not create two submissions. The submit button is disabled while the action runs. Test: Task 10 `disables the submit button while the action is pending`.
2. **Form edited after submissions arrived.** A deleted or renamed field must not drop data from the export. Answers whose key no longer exists in the definition become extra columns under their stored label. Test: Task 2 `appends columns for answers whose field no longer exists`.
3. **Time zones at the deadline.** `registrationEnd` is an instant. A registration at 23:59 Berlin time on the last day is still open, and dates shown on the page are Berlin time. Tests: Task 7 `stays open until the end instant` and `formats the event date in Europe/Berlin`.
4. **Birthday on the reference date and 29 February.** Someone who turns 16 on the tournament day may play. Someone born on 29.02. turns a year older on 01.03. in a non-leap year. Test: Task 7 `getAgeOn` cases.
5. **Whitespace and empty optionals.** A required text of only spaces is rejected. An empty optional field is stored as `value: null`, not as an empty string or a missing answer. Tests: Task 7 `rejects whitespace-only required text` and `stores empty optional fields as null`.

---

### Task 1: `form.submission` schema and the dot-ID check

This task is a gate. If the Studio cannot list and edit dot-ID documents, stop and report to the user before any other task. The fallback (private dataset) is a separate decision.

**Files:**

- Create: `apps/studio/schemas/documents/form.submission.ts`, `apps/studio/schemas/objects/form-answer.ts`, `apps/studio/schemas/objects/form-group-entry.ts`, `apps/studio/schemas/objects/form-group-answer.ts`
- Modify: `apps/studio/schemas/index.ts`
- Test: `apps/studio/schemas/documents/form.submission.test.ts`, `apps/studio/schemas/objects/form-answer.test.ts`

**Interfaces:**

- Produces:
  - Document type `form.submission`, with title "Eingang", icon `RiInboxArchiveLine`, `liveEdit: true` and no tabs. Its fields:
    - `form`: reference to `form`, read-only, title "Formular"
    - `submittedAt`: datetime, read-only, title "Eingegangen am"
    - `status`: string with a radio list `registered|waitlist|cancelled`, titles "angemeldet|Warteliste|abgemeldet", required
    - `label`: string, read-only, title "Bezeichnung"
    - `answers`: array of `formAnswer`, title "Antworten"
    - `cleanedAt`: datetime, read-only, title "Bereinigt am"
  - Object types:
    - `formAnswer` { `key`, `label`, `fieldType`, `retention`, `value`, `values`, `entries` }
    - `formGroupEntry` { `answers`: `formGroupAnswer[]` }
    - `formGroupAnswer` { `key`, `label`, `fieldType`, `retention`, `value`, `values` }
  - Answer fields:
    - `key`, `label`, `fieldType` and `retention` are read-only. `retention` is hidden.
    - `value` (string, title "Wert") is editable.
    - `values` (array of string, "Werte") shows only when `values` is defined.
    - `entries` (array of `formGroupEntry`, "Einträge") shows only when `fieldType === 'formFieldGroup'`.
  - Preview of an answer: title `label`, subtitle the value or the values joined with ", ".
  - Preview of `form.submission`: title `label` (fallback "Ohne Bezeichnung"), subtitle `<status label> · <submittedAt dd.MM.yyyy HH:mm>`.

- [ ] **Step 1: Write the failing tests.** `form.submission.test.ts`:
  - `has the expected fields in order`: `['form', 'submittedAt', 'status', 'label', 'answers', 'cleanedAt']`
  - `is live-edited`: `liveEdit === true`
  - `offers the three statuses` (the list values and the German titles above)
  - `previews label and status` via the exported `prepareSubmissionPreview({ label: 'Chicken Friends', status: 'waitlist', submittedAt: '2027-04-02T08:15:00Z' })` → `{ subtitle: 'Warteliste · 02.04.2027 10:15', title: 'Chicken Friends' }`
  - `falls back to "Ohne Bezeichnung"`

  `form-answer.test.ts`:
  - `hides entries unless the answer is a group`: call the `hidden` callback of `entries` with `{ parent: { fieldType: 'formFieldText' } }` → `true`, and with `'formFieldGroup'` → `false`
  - `hides values unless they exist`
  - `previews values joined`: `prepareAnswerPreview({ label: 'Status', values: ['a', 'b'] })` → `{ subtitle: 'a, b', title: 'Status' }`

- [ ] **Step 2: Run** `pnpm --filter studio exec vp test run schemas/documents/form.submission.test.ts schemas/objects/form-answer.test.ts`. Expected: FAIL (modules missing).
- [ ] **Step 3: Implement the four schema files** and register them in `schemas/index.ts`: the document in the documents block, the objects alphabetically in the objects block.
  - Format `submittedAt` as `dd.MM.yyyy HH:mm` in `Europe/Berlin` with `Intl.DateTimeFormat('de-DE', { day: '2-digit', hour: '2-digit', minute: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin', year: 'numeric' })`, removing the comma between date and time.
  - Status titles come from `SUBMISSION_STATUS_LABELS` once Task 2 exists. Until then use a local constant and switch it over in Task 2.
- [ ] **Step 4: Run the tests again.** Expected: PASS. Then run typegen (root commands above).
- [ ] **Step 5: Dot-ID check against `development`.** Ask the user before writing to the dataset.
  - Write a scratch JSON file in the session scratchpad: `{ "_id": "form.submission.spike-1", "_type": "form.submission", "status": "registered", "label": "Spike", "submittedAt": "2026-11-08T12:00:00Z", "answers": [{ "_key": "a1", "_type": "formAnswer", "key": "k1", "label": "Teamname", "fieldType": "formFieldText", "value": "Spike" }] }`.
  - Create it with `pnpm --filter studio exec sanity documents create <file> --dataset development`.
  - Check that it is not public: `curl -s 'https://j4rxwl5m.api.sanity.io/v2025-02-19/data/query/development?query=*%5B_type%3D%3D%22form.submission%22%5D'` must return `"result":[]`.
  - Run `pnpm --filter studio dev`. In the default list "Eingang", the document must appear. Changing the status must save without a publish button, and changing the answer value must save.
  - Delete the document with `sanity documents delete form.submission.spike-1 --dataset development`.
  - Report the outcome (pass/fail plus observations) to the user and keep it for the PR description. On failure: STOP.
- [ ] **Step 6: Commit:** `feat(studio): add form submission schema`.

### Task 2: Shared form logic

**Files:**

- Create: `packages/shared/src/forms/types.ts`, `packages/shared/src/forms/clean-answers.ts`, `packages/shared/src/forms/export-sheets.ts`, `packages/shared/src/forms/default-texts.ts`, `packages/shared/src/forms/index.ts`
- Modify: `packages/shared/src/index.ts` (add `export * from './forms';`), `apps/studio/schemas/documents/form.submission.ts` (use `SUBMISSION_STATUS_LABELS`)
- Test: `packages/shared/src/forms/clean-answers.test.ts`, `packages/shared/src/forms/export-sheets.test.ts`

**Interfaces:**

- Produces, from `@tsgi-web/shared`:
  ```ts
  type FieldRetention = 'delete' | 'year';
  type SubmissionStatus = 'cancelled' | 'registered' | 'waitlist';
  interface FormGroupAnswer { _key: string; _type: 'formGroupAnswer'; fieldType: string; key: string; label: string; retention?: FieldRetention; value?: string | null; values?: string[] | null }
  interface FormGroupEntry { _key: string; _type: 'formGroupEntry'; answers: FormGroupAnswer[] }
  interface FormAnswer extends Omit<FormGroupAnswer, '_type'> { _type: 'formAnswer'; entries?: FormGroupEntry[] | null }
  interface FormFieldShape { _key: string; _type: string; fields?: FormFieldShape[] | null; label?: string | null }
  interface ExportSubmission { _id: string; answers: readonly FormAnswer[]; label?: string | null; status: SubmissionStatus; submittedAt: string }
  interface ExportSheet { name: string; rows: string[][] }
  const GROUP_FIELD_TYPE = 'formFieldGroup';
  const NOTE_FIELD_TYPE = 'formFieldNote';
  const SUBMISSION_STATUS_LABELS: Readonly<Record<SubmissionStatus, string>>; // abgemeldet, angemeldet, Warteliste
  const FORM_DEFAULT_TEXTS: Readonly<{ afterEnd: string; beforeStart: string; success: string; waitlistNotice: string; waitlistSuccess: string }>;
  function cleanAnswers(answers: readonly FormAnswer[]): FormAnswer[];
  function buildExportSheets(fields: readonly FormFieldShape[], submissions: readonly ExportSubmission[]): ExportSheet[];
  ```
- `FORM_DEFAULT_TEXTS` exact copy:
  - `afterEnd`: `'Die Anmeldung ist beendet.'`
  - `beforeStart`: `'Die Anmeldung ist ab {start} möglich.'`
  - `success`: `'Vielen Dank! Deine Anmeldung ist eingegangen. Eine Bestätigung kommt per E-Mail.'`
  - `waitlistNotice`: `'Alle Plätze sind vergeben. Neue Anmeldungen kommen auf die Warteliste.'`
  - `waitlistSuccess`: `'Vielen Dank! Du stehst auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.'`

- [ ] **Step 1: Write the failing tests.**

  `clean-answers.test.ts`:
  - `deletes value and values of answers marked delete`
  - `cuts a date marked year to its year`: `'2008-03-17'` → `'2008'`
  - `cleans answers inside group entries`
  - `leaves answers without retention untouched`
  - `is idempotent`: cleaning twice equals cleaning once, `'2008'` stays `'2008'`
  - `does not mutate its input` (deep-freeze the input)

  `export-sheets.test.ts`, with a Dorfturnier fixture whose fields are Teamname (text), E-Mail (email), Mitspieler (group: Nachname, Geburtsdatum) and Datenschutz (consent), and two submissions given out of order:
  - `sorts submissions by submittedAt and numbers them from 1`
  - `builds the main sheet header`: `['Nr.', 'Eingang', 'Status', 'Teamname', 'E-Mail', 'Datenschutz']`. Groups and notes are not columns.
  - `formats Eingang in Berlin time`: `'2027-04-02T08:15:00Z'` → `'02.04.2027 10:15'`
  - `writes the status label`: `waitlist` → `'Warteliste'`
  - `joins multiple values with ", "`
  - `builds one sheet per group named after the group`: `name: 'Mitspieler'`, header `['Nr.', 'Bezeichnung', 'Nachname', 'Geburtsdatum']`, one row per entry starting with the submission number and the submission `label`
  - `appends columns for answers whose field no longer exists`: an answer with key `old`, label `'Verein'` → extra header `'Verein'` after the defined columns
  - `sanitises and shortens sheet names`: label `'Spieler/innen [Team] mit einem sehr langen Namen'` → no `[]:*?/\`, at most 31 characters, and a duplicate name gets `' (2)'`
  - `returns only the main sheet with a header row when there are no submissions`

- [ ] **Step 2: Run** `pnpm --filter @tsgi-web/shared exec vp test run src/forms`. Expected: FAIL.
- [ ] **Step 3: Implement the types and functions above.**
  - Format dates with `Intl.DateTimeFormat('de-DE', { day: '2-digit', hour: '2-digit', minute: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin', year: 'numeric' })` and remove the comma between date and time.
  - Switch `form.submission.ts` to `SUBMISSION_STATUS_LABELS`.
- [ ] **Step 4: Run** `pnpm --filter @tsgi-web/shared run test:coverage`. Expected: PASS at 100 %.
- [ ] **Step 5: Commit:** `feat(shared): add form answer clean-up and export layout`.

### Task 3: Form field object types

**Files:**

- Create: `apps/studio/schemas/objects/form-fields/base.ts` (shared field definitions and the preview helper) and one file per type: `form-field-text.ts`, `form-field-textarea.ts`, `form-field-email.ts`, `form-field-phone.ts`, `form-field-number.ts`, `form-field-date.ts`, `form-field-choice.ts`, `form-field-consent.ts`, `form-field-group.ts`, `form-field-note.ts`
- Modify: `apps/studio/schemas/index.ts`
- Test: `apps/studio/schemas/objects/form-fields/base.test.ts`, `apps/studio/schemas/objects/form-fields/form-field-group.test.ts`, `apps/studio/schemas/objects/form-fields/form-field-date.test.ts`

**Interfaces:**

- Produces from `base.ts`:
  - `baseFieldDefinitions`, used by every type except note, in this order:
    - `label`: string, required, "Bezeichnung"
    - `helpText`: text with 2 rows, "Hilfetext"
    - `isRequired`: boolean, "Pflichtfeld", initial `false`
    - `width`: string radio `full|half` "ganze Breite|halbe Breite", "Breite", initial `'full'`
    - `retention`: string radio `keep|delete`, "Nach der Veranstaltung", titles "behalten|löschen", initial `'keep'`
  - `prepareFieldPreview(typeTitle: string)`, returning a `prepare({ isRequired, label })` that produces `{ subtitle: `${typeTitle}${isRequired ? ' · Pflicht' : ''}`, title: label ?? 'Ohne Bezeichnung' }`.
- Type table (name, title, icon from `react-icons/ri`, extra fields after the base fields):

  | Name | Title | Icon | Extra fields |
  | --- | --- | --- | --- |
  | `formFieldText` | Text | `RiText` | `maxLength` number "Maximale Länge"; `isLabel` boolean "Bezeichnet den Eingang" (description: "Der Wert benennt den Eingang im Studio und im Export, z. B. der Teamname.") |
  | `formFieldTextarea` | Text (mehrzeilig) | `RiFileTextLine` | `maxLength` |
  | `formFieldEmail` | E-Mail | `RiMailLine` | `isConfirmationRecipient` boolean "Empfänger der Bestätigung" |
  | `formFieldPhone` | Telefon | `RiPhoneLine` | — |
  | `formFieldNumber` | Zahl | `RiHashtag` | `min` number "Minimum", `max` number "Maximum" |
  | `formFieldDate` | Datum | `RiCalendarLine` | `minAge` number "Mindestalter", `referenceDate` date "Stichtag" (required when `minAge` is set); `retention` list extended by `year` "auf das Jahr kürzen" |
  | `formFieldChoice` | Auswahl | `RiListCheck2` | `options` array of string "Optionen", min 2, unique; `isMultiple` boolean "Mehrfachauswahl"; `display` radio `buttons | select` "Schaltflächen | Liste", hidden when `isMultiple` |
  | `formFieldConsent` | Zustimmung | `RiCheckboxLine` | `text` `simpleBlockContent` "Text", required; `isRequired` hidden with initial `true`; `retention` hidden |
  | `formFieldGroup` | Wiederholbare Gruppe | `RiGroupLine` | `itemLabel` string "Bezeichnung eines Eintrags", required; `minItems`, `maxItems` number; `fields` array of the nine non-group types "Felder", required min 1; `retention` hidden |
  | `formFieldNote` | Hinweis | `RiInformationLine` | only `title` string "Zwischenüberschrift" and `text` `simpleBlockContent` "Text" (no base fields) |

  Verify every icon name exists in the installed `react-icons/ri` and pick the nearest existing one otherwise.

- [ ] **Step 1: Write the failing tests.**

  `base.test.ts`:
  - `orders the base fields`: `['label', 'helpText', 'isRequired', 'width', 'retention']`
  - `previews required fields`: `prepareFieldPreview('Text')({ isRequired: true, label: 'Teamname' })` → `{ subtitle: 'Text · Pflicht', title: 'Teamname' }`

  `form-field-date.test.ts`:
  - `offers year as retention`
  - `requires a reference date when a minimum age is set`: the `Rule.custom` predicate of `referenceDate` with `(undefined, { parent: { minAge: 16 } })` returns `'Bitte einen Stichtag angeben'`, and with `{ parent: {} }` returns `true`

  `form-field-group.test.ts`:
  - `accepts every field type except groups`: the `of` types equal the nine non-group names
  - `rejects minItems above maxItems`: the custom rule on `maxItems` with `(2, { parent: { minItems: 6 } })` returns `'Das Maximum darf nicht kleiner als das Minimum sein'`

- [ ] **Step 2: Run** `pnpm --filter studio exec vp test run schemas/objects/form-fields`. Expected: FAIL.
- [ ] **Step 3: Implement the eleven files** and register the ten types alphabetically in the objects block of `schemas/index.ts`.
- [ ] **Step 4: Run the tests and typegen.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat(studio): add form field types`.

### Task 4: `form` document

**Files:**

- Create: `apps/studio/schemas/documents/form.ts`, `apps/studio/utils/form-validation.ts`
- Modify: `apps/studio/shared/field-groups.ts` (add `formFields` "Felder", `registration` "Anmeldung", `mails` "Mails", `texts` "Texte"), `apps/studio/schemas/index.ts`, `apps/studio/sanity.config.ts` (filter `form.submission` out of `schema.templates`), `apps/studio/plugins/presentation.ts`
- Test: `apps/studio/schemas/documents/form.test.ts`, `apps/studio/utils/form-validation.test.ts`, `apps/studio/plugins/presentation.test.ts`

**Interfaces:**

- Consumes: the field types (Task 3), `FORM_DEFAULT_TEXTS` (Task 2), shared `title`/`slug`/`meta` fields via `getFieldWithGroup`.
- Produces: document type `form`, with title "Formular" and icon `RiSurveyLine`. Groups in order: `general`, `content`, `formFields`, `registration`, `mails`, `texts`, `meta`. Fields:
  - `general`:
    - `formType`: radio list `[{ title: 'Anmeldung', value: 'registration' }]`, initial `'registration'`, required
    - `title`
    - `slug`
  - `content`:
    - `heroImage`: the existing image type used for heroes, "Bild"
    - `intro`: `simpleBlockContent`, "Einleitung"
    - `eventDate`: datetime, "Veranstaltung am"
    - `location`: string, "Ort"
  - `formFields`: `fields`, an array of the ten field types, "Felder", required min 1
  - `registration`:
    - `registrationStart`: datetime, "Anmeldung ab"
    - `registrationEnd`: datetime, "Anmeldeschluss", must be after the start
    - `capacity`: number ≥ 1, "Obergrenze"
    - `showRemaining`: boolean, initial `true`, hidden without a capacity
    - `cleanupAt`: date, "Bereinigen ab"
  - `mails`:
    - `notifyOrganizer`: boolean, initial `true`
    - `receivers`: array of `contactNameMail`, "Empfänger", required when `notifyOrganizer`
    - `sendConfirmation`: boolean, initial `true`
    - `confirmationSubject`: string
    - `confirmationText`: text
    - `waitlistConfirmationText`: text
    - `includeAnswersInConfirmation`: boolean, initial `false`
  - `texts`: `beforeStartText`, `afterEndText`, `waitlistNotice`, `successText`, `waitlistSuccessText`, all `text`, with initial values taken from `FORM_DEFAULT_TEXTS`
  - `meta`
  - Every field in `registration` and `mails` gets `hidden: ({ document }) => !isRegistrationForm(document)`.
- From `utils/form-validation.ts`:
  ```ts
  function isRegistrationForm(document: { formType?: string } | undefined): boolean;
  function validateFormFields(
  	fields:
  		| readonly { _type: string; isLabel?: boolean; isConfirmationRecipient?: boolean }[]
  		| undefined,
  	document: { sendConfirmation?: boolean } | undefined,
  ): true | string;
  ```
  It returns these messages, in this order of checks:
  - `'Höchstens ein Feld darf den Eingang bezeichnen'`
  - `'Höchstens ein E-Mail-Feld darf die Bestätigung empfangen'`
  - `'Für die Bestätigungsmail ein E-Mail-Feld als Empfänger markieren'` (when `sendConfirmation` is set and no email field is marked)
- Presentation:
  - `mainDocuments` gets `{ filter: '_type == "form" && slug.current == $slug', route: '/anmeldung/:slug' }`.
  - `LOCATION_QUERIES.form` gets `href: "/anmeldung/" + slug.current`, `title: coalesce(title, "Ohne Titel")`.

- [ ] **Step 1: Write the failing tests.**

  `form-validation.test.ts`: one case per message, plus `true` for a valid Dorfturnier field list and for `sendConfirmation: false` without a marked field. `isRegistrationForm({ formType: 'registration' })` is `true`, and `undefined` gives `false`.

  `form.test.ts`:
  - field order per group
  - `hides registration settings for other form types` (the `hidden` callback of `capacity`)
  - `defaults the state texts` (the `initialValue` equals `FORM_DEFAULT_TEXTS.*`)
  - `hides showRemaining without capacity`

  `presentation.test.ts`: extend the pinned route list and the `LOCATION_QUERIES` key list with `form`.

- [ ] **Step 2: Run** `pnpm --filter studio exec vp test run schemas/documents/form.test.ts utils/form-validation.test.ts plugins/presentation.test.ts schemas/groups.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement the files above.** `schemas/groups.test.ts` must pass unchanged with the new document: every field is in a tab, no tab is empty, and `meta` comes last.
- [ ] **Step 4: Run the tests and typegen.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat(studio): add form document`.

### Task 5: Desk structure "Formulare"

**Files:**

- Modify: `apps/studio/structure/index.ts`, `apps/studio/plugins/singleton.ts`
- Test: `apps/studio/structure/index.test.ts`

**Interfaces:**

- Produces:

  ```ts
  function getSubmissionsOfFormList(S: StructureBuilder, formId: string): DocumentListBuilder; // exported for tests
  ```
  - A new `DocumentGroup` member `'forms'` with `getGroupForms(S)`. It returns one list item titled "Formulare", `id('form')`, icon `RiSurveyLine`, whose child is `S.documentTypeList('form').title('Formulare')`.
  - That list's `.child((formId) => S.list().title('Formular').items([...]))` has two items:
    - "Formular bearbeiten": `S.document().schemaType('form').documentId(formId)`
    - "Eingänge": `getSubmissionsOfFormList(S, formId)`
  - `getSubmissionsOfFormList`:
    - `.schemaType('form.submission')`
    - `.filter('_type == "form.submission" && form._ref == $formId')`
    - `.params({ formId })`
    - `.defaultOrdering([{ direction: 'asc', field: 'submittedAt' }])`
    - `.initialValueTemplates([])`
  - `isExcludedDefaultListItem` excludes `'form'` and `'form.submission'`.
  - `pageStructure` adds `...getGroup(S, 'forms')` to the middle block.

- [ ] **Step 1: Write the failing tests** with the recording structure builder:
  - `lists forms under Formulare`
  - `opens editor and submissions for a form`: call the child resolver with `'form-dorfturnier'` and assert a `params` call `{ formId: 'form-dorfturnier' }` and a `filter` call with the string above
  - `offers no template for submissions` (an `initialValueTemplates` call with `[]`)
  - `excludes form and form.submission from the default list items`
- [ ] **Step 2: Run** `pnpm --filter studio exec vp test run structure`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the tests.** Expected: PASS. Run `pnpm --filter studio dev` and check the new list by hand.
- [ ] **Step 5: Commit:** `feat(studio): list forms and their submissions`.

### Task 6: Studio actions "Als Excel exportieren" and "Jetzt bereinigen"

**Files:**

- Create: `apps/studio/actions/load-export-data.ts`, `apps/studio/actions/write-workbook.ts`, `apps/studio/actions/export-form-submissions.tsx`, `apps/studio/actions/clean-submissions.ts`, `apps/studio/actions/clean-form-submissions.tsx`
- Modify: `apps/studio/sanity.config.ts`, `apps/studio/package.json` (`write-excel-file` via `pnpm --filter studio add write-excel-file`)
- Test: `apps/studio/actions/load-export-data.test.ts`, `apps/studio/actions/export-form-submissions.test.ts`, `apps/studio/actions/clean-submissions.test.ts`, `apps/studio/actions/clean-form-submissions.test.ts`

**Interfaces:**

- Consumes: `buildExportSheets`, `cleanAnswers`, `ExportSheet`, `ExportSubmission`, `FormFieldShape` (Task 2).
- Produces:
  ```ts
  function loadExportData(
  	client: Pick<SanityClient, 'fetch'>,
  	formId: string,
  ): Promise<{ fields: FormFieldShape[]; slug: string; submissions: ExportSubmission[] }>;
  function writeWorkbook(sheets: readonly ExportSheet[], fileName: string): Promise<void>; // thin wrapper around write-excel-file, the only module that imports it
  function cleanSubmissions(
  	client: Pick<SanityClient, 'fetch' | 'transaction'>,
  	formId: string,
  	now?: Date,
  ): Promise<number>;
  function ExportFormSubmissionsAction(props: DocumentActionProps): DocumentActionDescription; // label 'Als Excel exportieren', icon RiFileExcel2Line
  function CleanFormSubmissionsAction(props: DocumentActionProps): DocumentActionDescription; // label 'Jetzt bereinigen', icon RiEraserLine
  ```
- `loadExportData` runs a single query:
  ```groq
  { "form": *[_id == $id][0]{ "slug": slug.current, fields[]{ _key, _type, label, fields[]{ _key, _type, label } } },
    "submissions": *[_type == "form.submission" && form._ref == $id && !(_id in path("drafts.**"))]{ _id, answers, label, status, submittedAt } }
  ```
- The file name is `${slug}-${YYYY-MM-DD}.xlsx` (today's date in Berlin).
- `cleanSubmissions` patches every submission of the form without `cleanedAt` with `set({ answers: cleanAnswers(answers), cleanedAt: now.toISOString() })`. It uses one transaction with `ifRevisionId(_rev)` per patch and returns the count.
- Both actions are disabled with the tooltip `'Erst veröffentlichen'` when `props.published` is null.
- The clean-up action opens `dialog: { type: 'confirm', message: 'Adressen und Geburtsdaten aller Eingänge dieses Formulars jetzt bereinigen? Das lässt sich nicht rückgängig machen.', onConfirm, onCancel }`.
- Toasts (`useToast` from `@sanity/ui/toast`):
  - `'Noch keine Eingänge'` (info) when the export finds none
  - `'Export fehlgeschlagen'` (error)
  - `` `${n} Eingänge bereinigt` `` (success)
  - `'Bereinigung fehlgeschlagen'` (error)
- Use `settle()` for every await in the action components.
- Registration in `sanity.config.ts`:
  - `form` → `[...input, ExportFormSubmissionsAction, CleanFormSubmissionsAction]`
  - `form.submission` → `input` without `duplicate`

- [ ] **Step 1: Write the failing tests.** Mock `sanity` (`useClient`) and `@sanity/ui/toast` like `publish-with-slug-history.test.ts`, and mock `./write-workbook`.
  - `load-export-data.test.ts`: `passes the form id and maps the result`, `returns empty submissions when none exist`.
  - `export-form-submissions.test.ts`:
    - `is disabled before the first publish`
    - `writes the workbook named after slug and date`: fake timers at `2027-05-20T10:00:00Z` → `'dorfturnier-2027-2027-05-20.xlsx'`
    - `toasts when there are no submissions`
    - `toasts when writing fails`
  - `clean-submissions.test.ts`: `cleans every uncleaned submission in one transaction`, `returns 0 and commits nothing when all are clean`.
  - `clean-form-submissions.test.ts`: `asks for confirmation`, `toasts the cleaned count`, `toasts a failure`.
- [ ] **Step 2: Run** `pnpm --filter studio exec vp test run actions`. Expected: FAIL.
- [ ] **Step 3: Add the dependency** and read its README in `node_modules/write-excel-file` for the browser API with several sheets. Implement.
- [ ] **Step 4: Run** `pnpm --filter studio run test:coverage`. Expected: PASS, thresholds intact. Then check by hand in the local Studio: export a form with the spike data from Task 1 (re-create it, then delete it again afterwards).
- [ ] **Step 5: Commit:** `feat(studio): export and clean up form submissions`.

### Task 7: Web queries and pure form logic

**Files:**

- Create: `apps/web/src/lib/sanity/queries/forms.ts`, `apps/web/src/lib/forms/types.ts`, `apps/web/src/lib/forms/age.ts`, `apps/web/src/lib/forms/registration-state.ts`, `apps/web/src/lib/forms/format.ts`, `apps/web/src/lib/forms/build-form-schema.ts`, `apps/web/src/lib/forms/to-answers.ts`
- Test: one `*.test.ts` next to each file in `src/lib/forms/`

**Interfaces:**

- Queries (`defineQuery`), all sharing one local `formFields` fragment. The fragment projects:
  - every field's `_key`, `_type`, `label`, `helpText`, `isRequired`, `width`, `retention`, `maxLength`, `min`, `max`, `minAge`, `referenceDate`, `options`, `isMultiple`, `display`, `isLabel`, `isConfirmationRecipient`, `itemLabel`, `minItems`, `maxItems`
  - `text[]{ ..., ${markDefsWithLinks} }` and `title`
  - nested `fields[]` with the same projection minus `fields`

  The queries:
  - `formPageQuery($slug)`: the page fields (`_id`, `formType`, `title`, `heroImage`, `intro`, `eventDate`, `location`, `registrationStart`, `registrationEnd`, `capacity`, `showRemaining`, the five texts, `meta`, `fields[]{${formFields}}`). Never `receivers`.
  - `formByIdQuery($id)`: everything the action needs, including `receivers[]{ email, name }`, the mail settings, `slug`, `registrationStart`, `registrationEnd` and `capacity`.
  - `formRegisteredCountQuery($formId)`: `count(*[_type == "form.submission" && form._ref == $formId && status == "registered" && !(_id in path("drafts.**"))])`
  - `dueSubmissionsQuery`: `*[_type == "form.submission" && !defined(cleanedAt) && form->cleanupAt <= now() && !(_id in path("drafts.**"))]{ _id, _rev, answers }`. Check that `form->cleanupAt` (a date) compares correctly with `now()`. If not, compare `dateTime(form->cleanupAt + "T00:00:00Z") <= dateTime(now())`.

  Run typegen.

- `types.ts`: `type FormFieldDefinition = NonNullable<NonNullable<FormByIdQueryResult>['fields']>[number]` and `type FormValues = Record<string, unknown>`.
- Functions:
  ```ts
  function getAgeOn(birthDate: string, referenceDate: string): number; // both 'YYYY-MM-DD', calendar arithmetic, no time zones
  type RegistrationState = 'closed' | 'open' | 'upcoming' | 'waitlist';
  function getRegistrationState(input: {
  	capacity?: number | null;
  	now: Date;
  	registeredCount: number;
  	registrationEnd?: string | null;
  	registrationStart?: string | null;
  }): RegistrationState;
  function getRemainingPlaces(
  	capacity: number | null | undefined,
  	registeredCount: number,
  ): number | null; // never below 0
  function formatEventDate(iso: string): string; // 'Fr., 14.05.2027, 13:00 Uhr', Europe/Berlin
  function formatShortDate(iso: string): string; // '30.04.2027', Europe/Berlin
  function buildFormSchema(
  	fields: readonly FormFieldDefinition[],
  ): z.ZodObject<Record<string, z.ZodType>>;
  function getDefaultValues(fields: readonly FormFieldDefinition[]): FormValues;
  function toAnswers(
  	fields: readonly FormFieldDefinition[],
  	values: FormValues,
  	createKey?: () => string,
  ): FormAnswer[]; // default createKey: crypto.randomUUID
  function getSubmissionLabel(
  	fields: readonly FormFieldDefinition[],
  	values: FormValues,
  ): string | null;
  function getConfirmationRecipient(
  	fields: readonly FormFieldDefinition[],
  	values: FormValues,
  ): string | null;
  ```
- `getRegistrationState` checks in this order: `now < start` → `upcoming`; `end && now >= end` → `closed`; `capacity && registeredCount >= capacity` → `waitlist`; otherwise `open`.
- `buildFormSchema` keys every field by `_key` and skips notes. Exact messages:
  - text/textarea: `.trim()`; required → `'Bitte fülle dieses Feld aus.'`; maxLength → `` `Bitte höchstens ${n} Zeichen eingeben.` ``
  - email: `'Bitte gib eine gültige E-Mail-Adresse ein.'` (optional: `''` allowed)
  - phone: regex `/^\+?[\d\s/()-]{6,20}$/` → `'Bitte gib eine gültige Telefonnummer ein.'`
  - number (string input): `/^-?\d+$/` → `'Bitte gib eine ganze Zahl ein.'`; `` `Bitte mindestens ${min} eingeben.` `` / `` `Bitte höchstens ${max} eingeben.` ``
  - date: `/^\d{4}-\d{2}-\d{2}$/` plus a real calendar date → `'Bitte gib ein gültiges Datum ein.'`; minAge → `` `Das Mindestalter ist ${minAge} Jahre am ${formatShortDate(referenceDate)}.` ``
  - choice single: one of `options` → `'Bitte wähle eine Option.'`; multiple: array of options, required min 1 → `'Bitte wähle mindestens eine Option.'`
  - consent: `true` → `'Bitte bestätige dies, um fortzufahren.'`
  - group: array of an object of the sub-fields; minimum `minItems ?? (isRequired ? 1 : 0)` → `` `Bitte mindestens ${n} Einträge „${itemLabel}“ angeben.` ``; maximum → `` `Bitte höchstens ${n} Einträge „${itemLabel}“ angeben.` ``
- `getDefaultValues`: `''` for text-like fields and single choices, `[]` for multiple choices, `false` for consent, and for a group one entry of sub-field defaults when it is required, otherwise `[]`.
- `toAnswers`:
  - Notes are skipped.
  - An empty value becomes `value: null`.
  - A multiple choice becomes `values`.
  - Consent becomes `value: 'ja'`.
  - A group becomes `entries` of `formGroupEntry` with `formGroupAnswer`s.
  - `retention` is copied only for `delete` and `year`.
  - Every array item gets `_key: createKey()`.

- [ ] **Step 1: Write the failing tests:**
  - `age.test.ts`:
    - `counts a birthday on the reference date`: `getAgeOn('2011-05-14', '2027-05-14')` → 16
    - `stays younger the day before`: `('2011-05-15', '2027-05-14')` → 15
    - `treats 29 February as reached on 1 March in non-leap years`: `('2012-02-29', '2027-02-28')` → 14 and `('2012-02-29', '2027-03-01')` → 15
  - `registration-state.test.ts`: one case per state, plus:
    - `stays open until the end instant`: end `'2027-04-30T21:59:59Z'` with now `'2027-04-30T21:59:58Z'` → `open`, and now equal to end → `closed`
    - `is open without start and end`
    - `getRemainingPlaces` → `null` without capacity, `0` when over capacity
  - `format.test.ts`: `formats the event date in Europe/Berlin`: `'2027-05-14T11:00:00Z'` → `'Fr., 14.05.2027, 13:00 Uhr'` (adjust the literal to the exact ICU output of Node 26 once, then pin it), and `formatShortDate('2027-04-30T22:30:00Z')` → `'01.05.2027'`
  - `build-form-schema.test.ts`, using the Dorfturnier field list from the spec as fixture:
    - one passing and one failing case per type, asserting the exact message
    - `rejects whitespace-only required text`
    - `accepts an empty optional email`
    - `rejects a player younger than 16 on 14.05.2027` with the message `'Das Mindestalter ist 16 Jahre am 14.05.2027.'`
    - `requires at least 6 players`
    - `ignores note fields`
  - `to-answers.test.ts`:
    - `snapshots labels and types`
    - `stores empty optional fields as null`
    - `stores consent as ja`
    - `copies only delete and year retention`
    - `builds group entries with keys from createKey`
    - `getSubmissionLabel` returns the `isLabel` value
    - `getConfirmationRecipient` returns the marked email
- [ ] **Step 2: Run** `pnpm --filter web exec vp test run src/lib/forms`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the tests.** Expected: PASS. Also run `pnpm --filter web run typecheck`.
- [ ] **Step 5: Commit:** `feat(web): add form queries and validation logic`.

### Task 8: Mail templates

**Files:**

- Create: `packages/email/components/form/answer-sections.tsx`, `packages/email/emails/form-submission-notification.tsx`, `packages/email/emails/form-submission-confirmation.tsx`
- Modify: `packages/email/emails/index.ts`
- Test: `packages/email/components/form/answer-sections.test.tsx`, `packages/email/emails/form-submission-notification.test.tsx`, `packages/email/emails/form-submission-confirmation.test.tsx`

**Interfaces:**

- Produces, from `@tsgi-web/email`:
  ```ts
  interface EmailAnswerSection {
  	heading?: string;
  	rows: { label: string; value: string }[];
  } // exported type
  function FormSubmissionNotificationEmail(
  	props: Readonly<{
  		formTitle: string;
  		hasHiddenFields: boolean;
  		sections: EmailAnswerSection[];
  		status: 'registered' | 'waitlist';
  		studioUrl: string;
  	}>,
  ): ReactElement;
  function FormSubmissionConfirmationEmail(
  	props: Readonly<{
  		formTitle: string;
  		hasHiddenFields: boolean;
  		sections?: EmailAnswerSection[];
  		text: string;
  	}>,
  ): ReactElement;
  ```
- Both use `<Html lang="de">`, the `react-email` primitives and `tailwindConfig`, like `contact-forward.tsx`.
- Notification copy:
  - heading `` `Neuer Eingang: ${formTitle}` ``
  - `` `Status: ${status === 'waitlist' ? 'Warteliste' : 'angemeldet'}` ``
  - when `hasHiddenFields`: `'Adressen und Geburtsdaten stehen nur im Studio.'`
  - link text `'Eingang im Studio öffnen'` → `studioUrl`
- Confirmation: `text` split on blank lines into paragraphs. Sections are rendered only when given. When `hasHiddenFields` and sections are given: `'Adressen und Geburtsdaten führen wir hier nicht auf.'`

- [ ] **Step 1: Write the failing tests** with `render()` and `toContain`: the copy above, `lang="de"`, section headings and rows, the waitlist status, no sections, and the paragraph split (two `<p>` for `'A\n\nB'`).
- [ ] **Step 2: Run** `pnpm --filter @tsgi-web/email exec vp test run`. Expected: FAIL.
- [ ] **Step 3: Implement** and export the two components and the type from `emails/index.ts`.
- [ ] **Step 4: Run** `pnpm --filter @tsgi-web/email run test:coverage`. Expected: 100 %.
- [ ] **Step 5: Commit:** `feat(email): add form submission templates`.

### Task 9: Server action `submitForm`

**Files:**

- Create: `apps/web/src/lib/validations/submit-form.ts`, `apps/web/src/lib/forms/registered-count.ts`, `apps/web/src/lib/forms/email-sections.ts`, `apps/web/src/lib/forms/send-submission-mails.ts`, `apps/web/src/actions/submit-form.ts`
- Modify: `apps/web/package.json` (`botid` via `pnpm --filter web add botid`), `apps/web/next.config.ts` (`withBotId`), `apps/web/src/instrumentation-client.ts` (create if missing: `initBotId({ protect: [{ method: 'POST', path: '/anmeldung/*' }] })`)
- Test: `apps/web/src/actions/submit-form.test.ts`, `apps/web/src/lib/forms/email-sections.test.ts`, `apps/web/src/lib/forms/send-submission-mails.test.ts`, `apps/web/src/lib/forms/registered-count.test.ts`

**Interfaces:**

- Consumes: Task 7 queries and functions, the Task 8 templates, `getWriteClient`, `client`, `resend`, `env`.
- Produces:
  ```ts
  const submitFormInputSchema: z.ZodObject<{ formId: z.ZodString; values: z.ZodRecord<z.ZodString, z.ZodUnknown>; website: z.ZodOptional<z.ZodString> }>;
  type SubmitFormStatus = 'closed' | 'registered' | 'upcoming' | 'waitlist';
  const submitForm: /* next-safe-action */ (input: { formId: string; values: FormValues; website?: string }) => Promise<{ data?: { status: SubmitFormStatus }; serverError?: string }>;
  function getRegisteredCount(formId: string): Promise<number>; // getWriteClient().fetch(formRegisteredCountQuery, { formId }, { next: { revalidate: 60, tags: [submissionsTag(formId)] } })
  function submissionsTag(formId: string): string; // `form-submissions:${formId}`
  function toEmailSections(answers: readonly FormAnswer[]): { hasHiddenFields: boolean; sections: EmailAnswerSection[] }; // EmailAnswerSection from @tsgi-web/email (Task 8)
  function sendSubmissionMails(input: { answers: FormAnswer[]; form: NonNullable<FormByIdQueryResult>; status: 'registered' | 'waitlist'; submissionId: string; submitterEmail: string | null }): Promise<void>;
  ```
- `toEmailSections`:
  - The first section (no heading) holds the top-level non-group answers without `retention`.
  - Each group entry becomes a section headed `` `${groupLabel} ${index + 1}` `` with its answers without `retention`.
  - `hasHiddenFields` is true when any answer was dropped.
  - Values are `value ?? values.join(', ') ?? '–'`.
- Action flow:
  1. A non-empty `website` → `{ status: 'registered' }` and nothing else.
  2. `checkBotId()`. `isBot` → `throw new Error('Bot detected')`.
  3. Load the form: `client.fetch<FormByIdQueryResult>(formByIdQuery, { id: formId }, { next: { revalidate: 60, tags: ['form'] }, perspective: 'published' })`. Null → `throw new Error('Unknown form')`.
  4. `getRegistrationState` with `getRegisteredCount`. `upcoming`/`closed` → return the state.
  5. `buildFormSchema(form.fields).safeParse(values)`. On failure → `throw new Error('Invalid submission')`.
  6. `getWriteClient().create({ _id: `form.submission.${randomUUID()}`, _type: 'form.submission', answers, form: { _ref: form._id, _type: 'reference' }, label, status, submittedAt })`, where `status` is `waitlist` when the state was `waitlist`, otherwise `registered`.
  7. `revalidateTag(submissionsTag(form._id), { expire: 0 })`.
  8. `await sendSubmissionMails(...)`. It never throws.
  9. Return `{ status }`.
- `sendSubmissionMails`:
  - Sender: `'TSG Irlich - Benachrichtigungen <webseite@notifications.tsg-irlich.de>'`.
  - Outside `env('NODE_ENV') === 'production'` every `to` is `'it@tsg-irlich.de'`.
  - **Organizer mail** (when `notifyOrganizer` and receivers exist):
    - `to` = the receivers' emails
    - `replyTo` = the submitter email when present
    - subject `` `Neuer Eingang: ${form.title}` `` plus `' (Warteliste)'` for the waitlist
    - `studioUrl` `` `${studioUrl}/intent/edit/id=${submissionId};type=form.submission` `` (`studioUrl` from `@/lib/sanity/api`)
  - **Confirmation** (when `sendConfirmation` and a recipient exist):
    - subject `form.confirmationSubject || `Deine Anmeldung: ${form.title}``
    - text `waitlistConfirmationText` or `confirmationText`, falling back to the matching `FORM_DEFAULT_TEXTS` success text
    - sections only when `includeAnswersInConfirmation`
    - `replyTo` = the first receiver
  - Each send is awaited with `settle`, and a Resend error or rejection is logged with `console.error('Form mail failed:', …)`.
- Before relying on `checkBotId()`, read `node_modules/botid` for its behaviour under `next dev` and `next start` outside Vercel. If it makes outbound calls under `next start`, add the matching handler in Task 14.

- [ ] **Step 1: Write the failing tests.** Mock `@/lib/sanity/client` (`clientFetchMock`), `@/lib/sanity/write-client`, `@/lib/resend`, `@tsgi-web/email`, `botid/server`, `next/cache`. Reset the mocks in `afterEach` as in `send-contact-form.test.ts`.
  - `submit-form.test.ts`:
    - `returns registered for a filled honeypot without writing`
    - `rejects bots`
    - `rejects an unknown form`
    - `returns upcoming before the start` / `returns closed after the end`, both without writing
    - `rejects invalid values`
    - `stores a registered submission with a dot id and the answers`: assert `_id` matches `/^form\.submission\.[0-9a-f-]{36}$/`, `form._ref`, `status: 'registered'` and `label: 'Chicken Friends'`
    - `stores a waitlist submission when capacity is reached`
    - `revalidates the submissions tag`
    - `still succeeds when the mails fail`
  - `send-submission-mails.test.ts`:
    - `mails the organizer without hidden fields and with the studio link`
    - `sends the confirmation to the marked email`
    - `uses the waitlist text for waitlist submissions`
    - `includes answers only when configured`
    - `sends everything to it@ outside production`
    - `skips the organizer mail when disabled`
    - `logs instead of throwing`
  - `registered-count.test.ts`: `queries with the form id and the submissions tag`.
  - `email-sections.test.ts`: `drops answers with retention and reports it`, `heads group entries with label and number`, `joins multiple values`.
- [ ] **Step 2: Run** `pnpm --filter web exec vp test run src/actions/submit-form.test.ts src/lib/forms`. Expected: FAIL.
- [ ] **Step 3: Implement** and add `botid`.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat(web): add form submission action`.

### Task 10: Client form components

**Files:**

- Create in `apps/web/src/components/with-logic/registration-form/`: `registration-form.tsx`, `field-renderer.tsx`, `group-field.tsx`, `choice-field.tsx`, `consent-field.tsx`, `honeypot.tsx`
- Test: `registration-form.test.tsx`, `group-field.test.tsx`, `field-renderer.test.tsx` in the same folder

**Interfaces:**

- Consumes: `buildFormSchema`, `getDefaultValues`, `FormFieldDefinition` (Task 7), `submitForm` (Task 9), the existing `Form*` primitives, `InputWithLabel`, `TextareaWithLabel`, `SelectWithLabel`, `Checkbox`, `ToggleGroup`, `Button`, `SuccessAlert`, `ErrorAlert`, `PortableText`, `useIsHydrated`.
- Produces:
  ```ts
  function RegistrationForm(
  	props: Readonly<{
  		fields: FormFieldDefinition[];
  		formId: string;
  		isPreview?: boolean;
  		isWaitlist: boolean;
  		successText: string;
  		waitlistSuccessText: string;
  	}>,
  ): ReactElement;
  ```
- `isPreview` (draft mode, presentation tool): the submit button stays disabled and the form shows `'In der Vorschau kann nichts abgesendet werden.'` A published form with unpublished changes would otherwise create real submissions from the preview.
- Behaviour:
  - `useForm({ defaultValues: getDefaultValues(fields), resolver: zodResolver(buildFormSchema(fields)) })`, created once with `useMemo` on `fields`.
  - `<form method="post" noValidate>`.
  - Fields with `width: 'half'` sit two per row from `md` up (`md:grid-cols-2` grid, full-width fields span both columns).
  - Required controls carry `aria-required="true"`. Email inputs have `type="email"` and `autoComplete="email"`. Phone inputs have `type="tel"` and `autoComplete="tel"`. Date inputs have `type="date"`.
  - A consent label renders `text` with `PortableText`, so links work. Wire it like `PrivacyField`: `aria-labelledby` on the checkbox.
  - Groups:
    - `useFieldArray` over the group.
    - Each entry is a card. Only the active card is open. The others show `` `${index + 1} · ${summary}` `` with a check mark when they have no error.
    - Buttons: `` `+ ${itemLabel} hinzufügen` `` (hidden at `maxItems`) and an icon button `` `${itemLabel} ${index + 1} entfernen` `` (`aria-label`).
    - A card with errors opens on submit.
  - Submit label: `isWaitlist ? 'Auf die Warteliste' : 'Anmelden'`. Disabled when `!isHydrated || isSubmitting`.
  - The action is called inside `settle(submitForm({ formId, values, website }))`.
  - Results:
    - `registered` → `successText` in a `SuccessAlert`, form hidden
    - `waitlist` → `waitlistSuccessText`
    - `closed`/`upcoming` → `ErrorAlert` `'Die Anmeldung ist gerade nicht möglich. Bitte lade die Seite neu.'`
    - `serverError` or a rejection → `ErrorAlert` `'Die Anmeldung konnte nicht gesendet werden. Bitte versuche es später erneut.'`
  - Honeypot: a `website` text input inside a wrapper positioned off-screen. The wrapper has `aria-hidden="true"`, the input `tabIndex={-1}` and `autoComplete="off"`. The axe sweep in Task 14 must stay clean.

- [ ] **Step 1: Write the failing tests** (`renderWithUser`; mock `@/actions/submit-form`):
  - `field-renderer.test.tsx`: `renders each field type with its label`, `marks required controls with aria-required`, `renders choice as buttons, select or checkboxes`, `renders consent text with its link`, `renders notes as heading and text`.
  - `group-field.test.tsx`: `adds and removes entries`, `hides the add button at maxItems`, `collapses filled entries to "1 · Müller, Max"`, `opens an entry with errors on submit`.
  - `registration-form.test.tsx`:
    - `shows the messages on an empty submit and does not call the action`
    - `submits formId, values and an empty website`
    - `shows the success text`
    - `shows the waitlist success text`
    - `labels the button for the waitlist`
    - `disables the submit button while the action is pending` (an unresolved promise)
    - `shows an error when the action rejects`
    - `disables the button before hydration` (`renderOnServer`/`hydrate` as in `contact-form.test.tsx`)
    - `disables submitting in the preview`
- [ ] **Step 2: Run** `pnpm --filter web exec vp test run src/components/with-logic/registration-form`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat(web): add registration form component`.

### Task 11: Landing page `/anmeldung/[slug]`

**Files:**

- Create: `apps/web/src/app/anmeldung/[slug]/page.tsx`, `apps/web/src/app/anmeldung/[slug]/_sections/registration-info.tsx`, `apps/web/src/app/anmeldung/[slug]/_sections/registration-panel.tsx`
- Modify: `apps/web/src/utils/breadcrumb.ts` (skip `/anmeldung`), `apps/web/src/utils/links.ts` (`form` → `/anmeldung/${slug}`), `apps/web/src/app/sitemap.ts`, `apps/web/src/lib/sanity/queries/sitemap.ts`, `apps/web/src/app/api/revalidate/route.ts`
- Test: `apps/web/src/app/anmeldung/[slug]/page.test.ts`, `.../_sections/registration-info.test.tsx`, `.../_sections/registration-panel.test.tsx`, `apps/web/src/utils/breadcrumb.test.ts`, `apps/web/src/utils/links.test.ts`, `apps/web/src/app/sitemap.test.ts`, `apps/web/src/app/api/revalidate/route.test.ts`

**Interfaces:**

- Consumes: `formPageQuery`, `getRegisteredCount`, `getRegistrationState`, `getRemainingPlaces`, `formatEventDate`, `formatShortDate`, `FORM_DEFAULT_TEXTS`, `RegistrationForm`, `Hero`, `getHeroImage`, `getPageMetadata`, `Collapsible*`, `PortableText`.
- Produces:
  ```ts
  function RegistrationInfo(props: Readonly<{ eventDate?: string | null; heroImage?: …; intro?: …; location?: string | null; notice?: string | null; registrationEnd?: string | null; title: string }>): ReactElement;
  function RegistrationPanel(props: Readonly<{ form: NonNullable<FormPageQueryResult>; state: RegistrationState }>): ReactElement;
  ```
- Page:
  - `generateStaticParams()` returns `[]`.
  - `generateMetadata` → `getPageMetadata({ image: form.heroImage, meta: form.meta, path: `/anmeldung/${slug}`, title: form.title })` with `stega: false`.
  - The page fetches with `sanityFetch({ params: { slug }, query: formPageQuery })`. It calls `notFound()` when the form is missing or `formType !== 'registration'`.
  - `Hero`: `title={form.title}`, `breadcrumb={{ page: form.title }}`, `subTitle="Anmeldung"`.
  - Below it a two-column grid: `lg:grid-cols-[2fr_3fr]`, with the info column on a dark background and the panel in the second column.
- `RegistrationInfo`:
  - Chips: `formatEventDate(eventDate)`, `location`, `` `bis ${formatShortDate(registrationEnd)}` ``.
  - `notice` is the remaining-places or waitlist line.
  - Image and intro sit inside `Collapsible` (trigger `'Mehr zur Veranstaltung'`, visible only below `lg`). From `lg` up the content is always visible and the trigger hidden.
  - The title is repeated only from `lg` up, because the hero shows it on mobile.
- Notice line:
  - `waitlist` → `form.waitlistNotice || FORM_DEFAULT_TEXTS.waitlistNotice`
  - `open` with `showRemaining` and a capacity → `` `Noch ${remaining} von ${capacity} Plätzen frei` ``
  - otherwise none
- `RegistrationPanel`:
  - `upcoming` → `(form.beforeStartText || FORM_DEFAULT_TEXTS.beforeStart).replace('{start}', formatEventDate(registrationStart))`
  - `closed` → `afterEndText` or the default
  - `open`/`waitlist` → `RegistrationForm`, with `isWaitlist` set for `waitlist` and `isPreview` from `(await draftMode()).isEnabled` (the page passes it down)
- `getBreadcrumbItems('/anmeldung/dorfturnier-2027', { page: 'Dorfturnier 2027' })` → `[{ name: 'Home', path: '/' }, { name: 'Dorfturnier 2027', path: '/anmeldung/dorfturnier-2027' }]`.
- Sitemap:
  - `formSitemapQuery`: `*[_type == 'form' && defined(slug.current)] { "slug": slug.current, "lastModified": _updatedAt }`, tag `'form'`
  - entries `changeFrequency: 'weekly'`, `priority: 0.5`, href from `getInternalHref({ _type: 'form', slug })`
- `REVALIDATION_MAP.form = () => { revalidatePath('/anmeldung/[slug]', 'page'); }`.

- [ ] **Step 1: Write the failing tests:**
  - `page.test.ts` (with `sanityFetchMock`, mocked `getRegisteredCount`, `notFound` throwing):
    - `calls notFound for a missing form`
    - `calls notFound for another form type`
    - `renders the form while open`
    - `renders the waitlist notice and the waitlist form at capacity`
    - `renders the before-start text with the start date`
    - `renders the after-end text`
    - `itFollowsTheMetadataContract` with path `'/anmeldung/dorfturnier-2027'`
  - `registration-info.test.tsx`: `shows date, place and deadline chips`, `shows the remaining places`, `puts image and intro behind "Mehr zur Veranstaltung"`.
  - `registration-panel.test.tsx`: one case per state.
  - The breadcrumb, links, sitemap and revalidate tests get one new case each, as specified above.
- [ ] **Step 2: Run** the listed tests. Expected: FAIL.
- [ ] **Step 3: Implement.** Run `pnpm run typegen:routes`.
- [ ] **Step 4: Run** `pnpm --filter web run test:coverage` and `pnpm --filter web run typecheck`. Expected: PASS. Then check the page against the mockup with a local dev server and a test form in `development`: Desktop 1280 px and mobile 375 px. Take Playwright screenshots headless, not the hidden browser pane.
- [ ] **Step 5: Commit:** `feat(web): add registration landing page`.

### Task 12: Clean-up cron route

**Files:**

- Create: `apps/web/src/app/api/forms/cleanup/route.ts`
- Modify: `apps/web/vercel.json` (`"crons": [{ "path": "/api/forms/cleanup", "schedule": "0 3 * * *" }]`), `apps/web/src/lib/env.ts` (`CRON_SECRET: z.string().min(1, 'Missing CRON_SECRET')`), root `turbo.json` (`globalEnv` + `CRON_SECRET`), `apps/web/.env.local.example`
- Test: `apps/web/src/app/api/forms/cleanup/route.test.ts`, `apps/web/src/lib/env.test.ts`

**Interfaces:**

- Consumes: `dueSubmissionsQuery` (Task 7), `cleanAnswers` (Task 2), `getWriteClient`.
- Produces: `GET(request: Request): Promise<Response>`.
  - Without the header `authorization: Bearer ${env('CRON_SECRET')}` → `401`.
  - Otherwise it fetches the due submissions and commits one transaction, patching each with `ifRevisionId(_rev).set({ answers: cleanAnswers(answers), cleanedAt: now })`.
  - It returns `Response.json({ cleaned: n })`. With no due submissions there is no commit.

- [ ] **Step 1: Write the failing tests:** `rejects a missing secret`, `rejects a wrong secret`, `cleans every due submission in one transaction`, `returns 0 without committing when nothing is due`. Plus an env case: `requires CRON_SECRET`.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit:** `feat(web): clean form submissions daily`.

### Task 13: Leave submissions out of `db:sync`

**Files:**

- Create: `scripts/exclude-types-from-export.ts`
- Modify: `scripts/sync-dev-db.ts`

**Interfaces:**

- Produces:
  ```ts
  function excludeTypesFromExport(archivePath: string, types: readonly string[]): Promise<number>; // returns the number of removed documents
  ```
- Approach:
  1. Extract the archive with the system `tar` into a fresh temp dir (`fs.mkdtemp`) through `execFile` with an argument array.
  2. Rewrite `*/data.ndjson`, dropping every line whose `_type` is in `types`.
  3. Re-pack it to the same path with `tar -czf` and remove the temp dir.
- `sync-dev-db.ts` calls `excludeTypesFromExport(BACKUP_FILE, ['form.submission'])` between the export and the import, and logs `` `${n} Eingänge nicht übernommen` ``.

- [ ] **Step 1: Implement.** Root scripts belong to no Vitest project and are excluded from Sonar coverage (WEB-404), so there is no unit test.
- [ ] **Step 2: Verify without touching `development`.**
  - Export `development` read-only to a scratch file: `pnpm --filter studio exec sanity datasets export development <scratch>/dev.tar.gz`.
  - Run the function on it through a scratch script with `types: ['venue']`.
  - Check that the returned count equals the number of `venue` documents and that `tar -tzf` still lists the assets.
  - Do not run `db:sync` itself.
- [ ] **Step 3: Commit:** `build: keep form submissions out of the dev sync`.

### Task 14: End-to-end coverage

**Files:**

- Create: `apps/studio/scripts/create-e2e-form.ts`, `apps/web/e2e/specs/registration-form.spec.ts`
- Modify: `apps/web/e2e/mocks/preload.ts`, `apps/web/.env.e2e` (`SANITY_API_WRITE_TOKEN=e2e-write-token`, `CRON_SECRET=e2e-cron-secret`), `apps/web/e2e/specs/accessibility.spec.ts`, `knip.config.ts` (studio `entry` + the new script), new fixtures in `apps/web/e2e/fixtures/sanity/`

**Interfaces:**

- `create-e2e-form.ts` (`sanity exec --with-user-token`) runs `createOrReplace` for a published form in the current dataset:
  - `_id: 'e2e-anmeldung'`, `formType: 'registration'`, `title: 'E2E-Anmeldung'`, `slug: 'e2e-anmeldung'`
  - `registrationStart: '2026-01-01T00:00:00Z'`, `registrationEnd: '2099-12-31T22:00:00Z'`, `capacity: 8`, `showRemaining: true`
  - `fields`:
    - Teamname: text, required, `isLabel`, half
    - E-Mail: email, required, `isConfirmationRecipient`, half
    - Mitspieler: group, `itemLabel: 'Spieler'`, `minItems: 1`, with the sub-fields Nachname (text, required) and Geburtsdatum (date, required, `minAge: 16`, `referenceDate: '2027-05-14'`, `retention: 'year'`)
    - Datenschutz: consent, text with a link to `/datenschutz`
  - `notifyOrganizer: true`, `receivers: [{ _key: 'r1', _type: 'contactNameMail', email: 'e2e@example.com', name: 'E2E' }]`, `sendConfirmation: true`
- `preload.ts` gets two new branches in `handleSanity`:
  - A path containing `/data/mutate/` → `HttpResponse.json({ results: [{ id: 'form.submission.e2e', operation: 'create' }], transactionId: 'e2e' })`.
  - A `/data/query/` request whose `query` parameter contains `"form.submission"` → `HttpResponse.json({ ms: 1, query: '', result: 0 })`.
  - Add a branch for any BotID host Task 9 found.

- [ ] **Step 1: Seed `development`.** With the user's OK, run `pnpm --filter studio exec sanity exec scripts/create-e2e-form.ts --with-user-token -- --dataset development`. Note in the script header that `db:sync` wipes the form and that it has to be re-run before re-recording.
- [ ] **Step 2: Write the failing spec** `registration-form.spec.ts`, following the hydration gotcha by clicking the group's add button first:
  - `shows the landing page`: h1 `'E2E-Anmeldung'`, `'Noch 8 von 8 Plätzen frei'`
  - `submits a registration`: fill Teamname, E-Mail, Nachname, Geburtsdatum `2000-01-01`, check Datenschutz, click `'Anmelden'` → `FORM_DEFAULT_TEXTS.success` visible
  - `shows errors on an empty submit`: `'Bitte fülle dieses Feld aus.'` visible, no success text
  - `rejects an underage player`: `2015-01-01` → `'Das Mindestalter ist 16 Jahre am 14.05.2027.'`
- [ ] **Step 3: Record and run.** Record the fixtures with `pnpm --filter web run e2e:record` for the new route only. Then run `pnpm --filter web run test:e2e -- registration-form`. Expected: PASS in both browser projects.
- [ ] **Step 4: Extend the axe sweep.**
  - A test for `'/anmeldung/[slug]'` that opens `/anmeldung/e2e-anmeldung` directly.
  - An entry in `FORM_ERROR_STATES` for the empty submit, with button `'Anmelden'` and error `'Bitte fülle dieses Feld aus.'`.
  - Run `pnpm --filter web run test:e2e -- accessibility`. Expected: no new violations, no baseline entry.
- [ ] **Step 5: Commit:** `test(web): cover the registration form end to end`.

### Task 15: Documentation and full check

**Files:**

- Modify:
  - `apps/web/AGENTS.md`: the route, the forms section (dynamic schema, honeypot, BotID, write client for submissions), the e2e notes (mutate stub, e2e form script) and the axe count
  - `apps/studio/AGENTS.md`: form and submission types, `_key` as field key, live edit, the actions
  - root `AGENTS.md`: `CRON_SECRET` in the web env list, `form.submission` excluded from `db:sync`
  - `docs/SANITY_WEBHOOK_SETUP.md`: add `"form"` to the documented filter, with a note that both webhooks still need it
  - the spec's status line: "umgesetzt" plus the PR link

- [ ] **Step 1: Update the documents.**
- [ ] **Step 2: Run at the root:** `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run knip`, `pnpm run test:coverage`. Expected: all green and no threshold lowered. Raise thresholds that the new tests lifted, as the ratchet rule says.
- [ ] **Step 3: Commit:** `docs: document the form builder`.

## Rollout (after merge, each step needs the user's OK)

1. Set `CRON_SECRET` in the Vercel project `tsg-irlich-web` for Production and Preview.
2. Add `"form"` to the type filter of both revalidation webhooks (production and development dataset).
3. Editors add the paragraph about the Sanity version history to the privacy page (Sanity `privacy`), with the retention period of the plan (open point 3 of the spec).
4. Editors create "Dorfturnier 2027" from the spec's field table once the club answered open points 4 and 5.
