# TSG-Echo Text Layer (WEB-402) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local script `ocr:echo` gives the TSG-Echo PDFs without a text layer an invisible OCR text layer, swaps the PDF into the issue's draft in Sanity, and waits until the render webhook has rebuilt pages and `extractedText`.

**Architecture:**

- `@tsgi-web/pdf-pages` gains `readPageTexts()`, which reads the text of every page without rendering it.
- The script lives in `apps/studio/scripts/ocr-echo/`, built like the archive import next to it: every module takes its collaborators as arguments, and only the entry file `scripts/ocr-echo.ts` wires up Sanity, pdf.js, the file system and OCRmyPDF.
- The folder rules of the import move to `scripts/shared/archive-folder.ts`, so both scripts share them.
- The web app, the schema and the render route stay untouched.

**Tech Stack:** Node (`node:child_process` `execFile`, `node:crypto`, `node:fs/promises`), OCRmyPDF + Tesseract (`deu`) from Homebrew, pdf.js through `@tsgi-web/pdf-pages`, `sanity exec` with the CLI client, zod, Vitest via `vp test`.

**Spec:** `docs/superpowers/specs/2026-11-01-web-402-echo-text-layer-design.md`. Read it before Task 1. This plan only adds the decisions the spec leaves to the builder.

**Branch:** `feat/web-402-echo-text-layer`. With GitButler: `but branch new feat/web-402-echo-text-layer`. Commits go through the `create-commit` skill. Run `pnpm run format:check` at the root before every `but commit`. Prefix `PATH` with `~/.local/share/vite-plus/bin` before running `pnpm`, `node` or `vp`.

## Global Constraints

- Everything the script prints (log lines, errors, the summary) is German. Code, comments and test names are English.
- Modules under `scripts/ocr-echo/` and `scripts/shared/` are tested without Sanity, pdf.js, OCRmyPDF, the file system or the network. Script tests start with `// @vitest-environment node` and import from `vite-plus/test`.
- No real issue ever lands in the repository or a test fixture. Tests use synthetic PDFs (`packages/pdf-pages/test-utils`) or plain byte arrays.
- `packages/pdf-pages` stays at 100 % coverage. The thresholds in `apps/studio/vitest.config.ts` do not drop.
- A dry run is the default (`--dry-run`, negated with `--no-dry-run`). A dry run writes into `<folder>/mit-textebene/` but never to Sanity.
- OCRmyPDF runs through `execFile` with an argument array, never through a shell: the file names contain spaces and parentheses.
- The page image must not change: no deskew, clean, rotate, image optimization or PDF/A conversion.
- The script never patches a published document and never touches `render`.
- Sanity API version `2026-10-01`, as in `scripts/import-echo.ts`.
- **Every write to a Sanity dataset and every Linear write needs an explicit OK from the user in chat first.** Show the command or payload and wait for the yes. `development` always comes before `production`.

## Review Focus

1. **Paths with spaces, parentheses and umlauts** (`1980-1989/1984 - TSG Irlich - 1.Echo.pdf`, `ab 2024 (neues ECHO)/…`). They reach OCRmyPDF verbatim as single arguments. Test: Task 4 (`passes paths with spaces as single arguments`).
2. **An OCR run that dies halfway** (Ctrl+C, crash, OCRmyPDF error). It leaves no file under `mit-textebene/`, so the next run does not mistake a broken file for a finished one. Test: Task 4 (`removes the partial output when OCRmyPDF fails`).
3. **An editor saves the draft between the script's read and its swap.** The swap fails with a German message and overwrites nothing. Test: Task 5 (`turns a revision conflict into a German error`).
4. **The render webhook does not fire** (switched off, wrong filter, other dataset). The entry fails after two minutes with a hint at the webhook, instead of waiting fifteen. Test: Task 6 (`gives up when the render does not start within two minutes`).
5. **An issue that exists only as published document, or as a version in a release.** The first gets a new draft and the published document stays as it is. The second is refused with the release's name. Tests: Task 5.

---

### Setup

- [ ] Create the branch: `but branch new feat/web-402-echo-text-layer`.
- [ ] Commit the spec alone: `docs: add the design of the TSG-Echo text layer`.

### Task 1: Check the recognition quality (runbook, no code)

This task gates the rest. It ends in a stop, whatever the result.

- [ ] **Step 1: Install the tools.** `brew install ocrmypdf tesseract-lang`. Check: `ocrmypdf --version` prints a version, and `tesseract --list-langs` lists `deu`.
- [ ] **Step 2: Fix the flags for the installed version.** Read `ocrmypdf --help` and settle the arguments that: recognize German, OCR only pages without text, write a plain PDF (no PDF/A), and leave images alone. Starting point: `--language deu --skip-text --output-type pdf --optimize 0`. Newer releases may name the skip mode differently (`--mode skip`). Write the final list into Task 4, Step 3 (`OCR_ARGS`) before Task 4 starts.
- [ ] **Step 3: Run it on three scans.** The inputs are in `~/dev/customer/tsg/echo-archiv`: `1979 Erste Exemplare/1979_01.pdf`, `1980-1989/1982 - TSG Irlich - 2.Echo - 100 Jahre TSG Irlich.pdf` (52 pages) and `1980-1989/1988 - TSG Irlich - 4.Echo.pdf`. Write the outputs to the session scratchpad, never into the repository, and time each run with `time`.
- [ ] **Step 4: Compare the page images.** Use a throwaway Node script in the scratchpad, run from `packages/pdf-pages`. It renders original and output with `renderPdfPages` and compares the JPEG bytes of every page. Expected: all identical, because invisible text does not change pixels.
- [ ] **Step 5: Collect text samples.** Read the text of each output (pdf.js `getTextContent`, or `readPageTexts` once Task 2 exists) and keep the first 300 characters of three pages per issue.
- [ ] **Step 6: STOP.** Show the user, per scan, the runtime, the image comparison and the samples. The user decides whether to build on, and which scans go into the list. A bad year may stay out. Do not start Task 2 without that answer.

### Task 2: `readPageTexts` in `@tsgi-web/pdf-pages`

**Files:**

- Create: `packages/pdf-pages/src/pdf-document.ts`, `packages/pdf-pages/src/read-page-texts.ts`, `packages/pdf-pages/src/read-page-texts.test.ts`
- Modify: `packages/pdf-pages/src/render-pdf-pages.ts`, `packages/pdf-pages/src/index.ts`, `packages/pdf-pages/README.md`

**Interfaces:**

- Produces: `readPageTexts(bytes: Uint8Array, options?: { dataDir?: string }): Promise<string[]>`, one string per page in page order, empty for a page without text. Exported from the package entry.

- [ ] **Step 1: Write the failing tests** in `read-page-texts.test.ts`:

```ts
it('returns the text of every page, in order', async () => {
	expect(await readPageTexts(await createFixturePdf(['Seite eins', 'Seite zwei']))).toStrictEqual([
		'Seite eins',
		'Seite zwei',
	]);
});
it('returns an empty string for a scan', async () => {
	expect(await readPageTexts(await createScanPdf())).toStrictEqual(['']);
});
it('drops glyphs mapped to U+FFFD', async () => {
	const [text] = await readPageTexts(await createUnmappedTextPdf('XXXX Lesbar XX'));
	expect(text).toContain('Lesbar');
	expect(text).not.toContain('�');
});
it('rejects when the data directory is missing', async () => {
	await expect(
		readPageTexts(await createFixturePdf(['x']), { dataDir: '/nirgends' }),
	).rejects.toThrow('Die Daten von pdf.js fehlen unter /nirgends.');
});
it('rejects bytes that are no PDF', async () => {
	await expect(readPageTexts(new Uint8Array([1, 2, 3]))).rejects.toThrow();
});
```

- [ ] **Step 2: Run them.** `pnpm --filter @tsgi-web/pdf-pages exec vp test run src/read-page-texts.test.ts`. Expected: FAIL, the module does not exist.
- [ ] **Step 3: Move the shared parts into `pdf-document.ts`.** Move `getDefaultDataDir`, `getDataOptions`, `isTextItem`, `extractText`, the static worker import and its comment out of `render-pdf-pages.ts`. Export what both modules need. Add `loadPdf(bytes: Uint8Array, dataDir?: string): Promise<PDFDocumentLoadingTask>`, which validates the data directory and calls `getDocument` with a copy of the bytes. `renderPdfPages` then uses `loadPdf` and keeps its behaviour.
- [ ] **Step 4: Implement `readPageTexts` in `read-page-texts.ts`** with `loadPdf`, page by page with `extractText`, destroying the loading task in `finally` like `renderPdfPages`. Export it and its options type from `index.ts`, and add a short section to `README.md`.
- [ ] **Step 5: Run the package.** `pnpm --filter @tsgi-web/pdf-pages run test:coverage`. Expected: every test passes, coverage stays at 100 %. Also run `pnpm --filter @tsgi-web/pdf-pages run typecheck`.
- [ ] **Step 6: Commit.** `feat(pdf-pages): read the text of every page without rendering`.

### Task 3: Folder rules, options and the list

**Files:**

- Create: `apps/studio/scripts/shared/archive-folder.ts` (+ `.test.ts`), `apps/studio/scripts/ocr-echo/options.ts` (+ `.test.ts`), `apps/studio/scripts/ocr-echo/manifest.ts` (+ `.test.ts`)
- Modify: `apps/studio/scripts/import-echo/options.ts`, `apps/studio/scripts/import-echo/manifest.ts`

**Interfaces:**

- Produces, in `scripts/shared/archive-folder.ts`, moved from the import without changing its messages:
  - `isInside(child: string, parent: string): boolean`
  - `resolveFolder(value: string, place: ArchivePlace): string`
  - `resolveListFile(value: string | undefined, folder: string, defaultName: string): string`. It throws `--manifest muss eine .json-Datei im Ordner sein.` as before.
  - `isPdfInFolder(file: string): boolean`: not absolute, no `..` segment, ends in `.pdf`.
  - `interface ArchivePlace { home: string; repository: string }`
- Produces `parseOcrOptions(argv: readonly string[], place: ArchivePlace): OcrOptions`, with `OcrOptions { dataset: string; dryRun: boolean; folder: string; manifest: string }`.
- Produces `parseOcrManifestText(text: string): OcrEntry[]`, with `OcrEntry { documentId: string; file: string }`.

- [ ] **Step 1: Move the folder rules.** `import-echo/options.ts` imports them, and `ImportPlace` becomes an alias of `ArchivePlace`. `isImportablePdf` in `import-echo/manifest.ts` becomes `isPdfInFolder(file) && toIdPart(file) !== ''`. Run `pnpm --filter studio exec vp test run scripts/import-echo`. Expected: PASS without touching a single import test, which proves the move. Add `archive-folder.test.ts` for `isPdfInFolder` (accepts `1980-1989/1984 - TSG Irlich - 1.Echo.pdf`, rejects `/abs.pdf`, `../x.pdf`, `x.txt`).
- [ ] **Step 2: Write the failing option tests** in `ocr-echo/options.test.ts`, with `place = { home: '/Users/ab', repository: '/Users/ab/dev/customer/tsg/tsg-irlich-web' }`:
  - `--dataset development --folder dev/customer/tsg/echo-archiv` gives `{ dataset: 'development', dryRun: true, folder: '/Users/ab/dev/customer/tsg/echo-archiv', manifest: '/Users/ab/dev/customer/tsg/echo-archiv/ocr-manifest.json' }`.
  - A leading `--` is ignored, and `--no-dry-run` gives `dryRun: false`.
  - A missing `--dataset` throws `--dataset fehlt, z. B. --dataset development.`
  - A missing `--folder` throws `--folder fehlt: der Ordner mit den PDFs und der ocr-manifest.json.`
  - A folder inside the repository throws the import's repository message.
  - `--manifest ../x.json` throws `--manifest muss eine .json-Datei im Ordner sein.`
- [ ] **Step 3: Write the failing list tests** in `ocr-echo/manifest.test.ts`:
  - `[{ "datei": "1979 Erste Exemplare/1979_01.pdf", "dokument": "echo-archiv-1979-01" }]` gives `[{ documentId: 'echo-archiv-1979-01', file: '1979 Erste Exemplare/1979_01.pdf' }]`.
  - `dokument: 'drafts.echo-2024'` and `dokument: 'versions.x.echo-2024'` are invalid. The message starts with `Die ocr-manifest.json ist ungültig:`. The id pattern is `/^[\w-]+$/u`.
  - `datei: '../x.pdf'` is invalid.
  - An empty list is invalid.
  - Two entries with the same file throw `Doppelte Dateien in der ocr-manifest.json: <file>`, and the same document `Doppelte Dokumente in der ocr-manifest.json: <id>`.
  - `'{'` throws `Die ocr-manifest.json ist kein gültiges JSON.` without quoting the text.
- [ ] **Step 4: Run them.** `pnpm --filter studio exec vp test run scripts/ocr-echo scripts/shared`. Expected: FAIL.
- [ ] **Step 5: Implement `options.ts` and `manifest.ts`** after the import's `options.ts` and `manifest.ts`: `parseArgs` with `allowNegative` and `strict`, a zod schema plus `z.prettifyError`, and a duplicate check per key.
- [ ] **Step 6: Run them again.** Same command. Expected: PASS.
- [ ] **Step 7: Commit.** `feat(studio): read the options and the list of the TSG-Echo text layer script`.

### Task 4: OCRmyPDF and the text layer

**Files:**

- Create: `apps/studio/scripts/ocr-echo/ocrmypdf.ts` (+ `.test.ts`), `apps/studio/scripts/ocr-echo/text-layer.ts` (+ `.test.ts`)

**Interfaces:**

- Consumes: `OcrEntry` (Task 3).
- Produces in `ocrmypdf.ts`:
  - `createOcrTools(deps: OcrToolDeps): OcrTools`
  - `interface OcrToolDeps { execFile: (file: string, args: readonly string[]) => Promise<{ stderr: string; stdout: string }>; remove: (path: string) => Promise<void>; rename: (from: string, to: string) => Promise<void> }`
  - `interface OcrTools { assertInstalled: () => Promise<void>; recognize: (input: string, output: string) => Promise<void> }`
- Produces in `text-layer.ts`:
  - `prepareTextLayer(entry: OcrEntry, deps: TextLayerDeps): Promise<PreparedPdf>`
  - `needsRecognition(entry: OcrEntry, deps: TextLayerDeps): Promise<boolean>`
  - `interface TextLayerDeps { exists: (path: string) => Promise<boolean>; folder: string; makeDirectory: (path: string) => Promise<void>; readFile: (path: string) => Promise<Uint8Array>; readPageTexts: (bytes: Uint8Array) => Promise<string[]>; recognize: OcrTools['recognize'] }`
  - `interface PreparedPdf { bytes: Uint8Array; characters: number; pageCount: number; source: 'cached' | 'original' | 'recognized' }`. `characters` counts the non-whitespace characters of all pages of `bytes`.
  - `OUTPUT_FOLDER = 'mit-textebene'`

- [ ] **Step 1: Write the failing `ocrmypdf.test.ts`**, with an `execFile` spy:
  - `assertInstalled` resolves when `ocrmypdf --version` succeeds and `tesseract --list-langs` lists `deu` on its own line, in `stdout` or `stderr`.
  - It rejects with `OCRmyPDF fehlt. Installieren: brew install ocrmypdf tesseract-lang` when `ocrmypdf --version` rejects.
  - It rejects with `Tesseract kennt kein Deutsch (deu). Installieren: brew install tesseract-lang` when `deu` is missing.
  - `recognize('/a/ab 2024 (neues ECHO)/x.pdf', '/a/mit-textebene/ab 2024 (neues ECHO)/x.pdf')` calls `execFile('ocrmypdf', [...OCR_ARGS, input, output + '.tmp'])`. Each path is a single argument (test name: `passes paths with spaces as single arguments`). It then renames `.tmp` to the output.
  - `removes the partial output when OCRmyPDF fails`: `execFile` rejects with `stderr` `"ERROR - boom\n"`, `remove(output + '.tmp')` is called, `rename` is not, and the rejection reads `OCRmyPDF ist gescheitert: ERROR - boom`.
- [ ] **Step 2: Write the failing `text-layer.test.ts`**, with in-memory deps (a `Map` of path to bytes, `readPageTexts` looked up per byte array):
  - A cached output under `<folder>/mit-textebene/<file>` is used as it is: source `cached`, no `recognize`.
  - A PDF with text on every page gives source `original` with the original bytes, and nothing is written.
  - A PDF with one page without text creates `dirname(output)`, calls `recognize(input, output)`, reads the output and gives source `recognized`. `characters` counts the output's text, and `pageCount` is its page count.
  - A PDF without pages rejects with `Die PDF enthält keine Seiten.`
  - `needsRecognition` is `false` for a cached output and for a PDF with text everywhere, and `true` for a scan.
- [ ] **Step 3: Implement both modules.** `OCR_ARGS` is the list from Task 1, Step 2: `['--mode', 'skip', '--language', 'deu', '--output-type', 'pdf', '--optimize', '0']` (OCRmyPDF 17.13.0, Tesseract 5.5.4). `recognize` writes to `<output>.tmp` and renames on success. On failure it removes `.tmp` (a failing remove is ignored) and rethrows with the last non-empty `stderr` line. Await with `settle()` from `@tsgi-web/shared`, like the import. A page counts as having text when its trimmed text is not empty.
- [ ] **Step 4: Run them.** `pnpm --filter studio exec vp test run scripts/ocr-echo`. Expected: PASS.
- [ ] **Step 5: Commit.** `feat(studio): give PDFs without a text layer one through OCRmyPDF`.

### Task 5: The Sanity side

**Files:**

- Create: `apps/studio/scripts/ocr-echo/swap-store.ts` (+ `.test.ts`)

**Interfaces:**

- Produces:
  - `createSwapStore(client: SanityClient): SwapStore`
  - `interface SwapStore { findTarget: (documentId: string) => Promise<SwapTarget>; readRender: (target: SwapTarget) => Promise<RenderState | undefined>; swapPdf: (target: SwapTarget, assetId: string) => Promise<void>; uploadPdf: (bytes: Uint8Array, filename: string) => Promise<string> }`
  - `interface SwapTarget { documentId: string; id: string; kind: 'draft' | 'published'; pdf: { assetId: string; originalFilename: string | undefined; sha1hash: string | undefined }; render: RenderState | undefined; rev: string }`
  - `interface RenderState { error?: string; pdfRef?: string; source?: string; status?: 'done' | 'failed' | 'pending'; textLength: number }`

- [ ] **Step 1: Write the failing tests** with a fake client (`fetch`, `getDocument`, `assets.upload`, `patch` returning a chain of `ifRevisionId` / `set` / `commit`, and `create`). Use the style of `import-echo/archive-store.test.ts`.
  - `findTarget` reads in the raw perspective, with params `{ draftId: 'drafts.echo-2024', id: 'echo-2024', versions: 'versions.*.echo-2024' }`.
  - A draft wins over the published document.
  - Only a published document gives `kind: 'published'`.
  - A version (`versions.tsg-echo-archiv.echo-2024`) rejects with `Die Ausgabe liegt als Version im Release „tsg-echo-archiv“; dort tauscht das Skript nicht.`, even when a draft exists.
  - Nothing at all rejects with `Die Ausgabe echo-2024 gibt es nicht.`
  - A target without a PDF rejects with `Die Ausgabe echo-2024 hat keine PDF.`
  - `swapPdf` on a draft patches `drafts.echo-2024` with `ifRevisionId(rev)` and sets `pdf.asset` to `{ _ref: assetId, _type: 'reference' }`, and nothing else.
  - `swapPdf` on a published target reads it with `getDocument`. If its `_rev` differs from `target.rev`, it rejects with the conflict message. Otherwise it calls `create` with `_id: 'drafts.echo-2024'`, the new `pdf.asset`, every other field copied, and `_rev`, `_createdAt`, `_updatedAt` left out. It never calls `patch` on `echo-2024`.
  - `turns a revision conflict into a German error`: `commit` or `create` rejecting with `statusCode: 409` gives `Die Ausgabe wurde inzwischen geändert; das Skript erneut starten.`, and other errors pass unchanged.
  - `readRender` reads the draft and falls back to the published document (`coalesce`), and maps `render` and `length(extractedText)`.
  - `uploadPdf` uploads a `file` with `contentType: 'application/pdf'` and the given filename, and returns the asset id.
- [ ] **Step 2: Run them.** `pnpm --filter studio exec vp test run scripts/ocr-echo/swap-store.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `swap-store.ts`.**
  - `findTarget` makes one raw query over `[$id, $draftId]` and `path($versions)`. It projects `_id`, `_rev`, `"pdf": pdf.asset->{ _id, sha1hash, originalFilename }`, `render { error, source, status }`, `"pdfRef": pdf.asset._ref` and `"textLength": length(extractedText)`, which is `0` when the text is missing.
  - The release name is the segment between `versions.` and `.<id>`.
- [ ] **Step 4: Run them again.** Same command. Expected: PASS.
- [ ] **Step 5: Commit.** `feat(studio): swap the PDF of a TSG-Echo issue in its draft`.

### Task 6: Waiting for the render, and the run

**Files:**

- Create: `apps/studio/scripts/ocr-echo/wait-for-render.ts` (+ `.test.ts`), `apps/studio/scripts/ocr-echo/run-ocr.ts` (+ `.test.ts`)

**Interfaces:**

- Consumes: `OcrEntry` (Task 3), `OcrTools`, `prepareTextLayer`, `needsRecognition`, `TextLayerDeps` (Task 4), `SwapStore`, `SwapTarget`, `RenderState` (Task 5).
- Produces in `wait-for-render.ts`:
  - `waitForRender(target: SwapTarget, assetId: string, deps: WaitDeps): Promise<RenderResult>`
  - `interface WaitDeps { now: () => number; readRender: SwapStore['readRender']; wait: (ms: number) => Promise<void> }`
  - `type RenderResult = { error: string; ok: false } | { ok: true; textLength: number }`
  - Constants: `POLL_INTERVAL_MS = 5000`, `START_TIMEOUT_MS = 120_000`, `RENDER_TIMEOUT_MS = 900_000`.
- Produces in `run-ocr.ts`:
  - `runOcrSwap(entries: readonly OcrEntry[], deps: OcrDependencies, options: { dryRun: boolean }): Promise<OcrReport>`
  - `isSuccessful(report: OcrReport): boolean`
  - `summarize(report: OcrReport, dryRun: boolean): string[]`
  - `interface OcrDependencies { log: (line: string) => void; now: () => number; sha1: (bytes: Uint8Array) => string; store: SwapStore; textLayer: TextLayerDeps; tools: OcrTools; wait: (ms: number) => Promise<void> }`
  - `interface OcrReport { checked: string[]; failed: { documentId: string; error: string }[]; skipped: string[]; swapped: string[] }`

- [ ] **Step 1: Write the failing `wait-for-render.test.ts`**, with a fake clock that `wait` advances:
  - It resolves `{ ok: true, textLength }` once `render.source` is the new asset and the status is `done`. Before that it polls every 5 s through `pending`.
  - `failed` gives `{ ok: false, error: 'Render gescheitert: <render.error>' }`.
  - `gives up when the render does not start within two minutes`: `render.source` is still the old asset after 120 s, which gives `Der Render-Webhook hat nach 2 Minuten nicht ausgelöst. Den Webhook „TSG-Echo Seiten erzeugen“ des Datasets prüfen.`
  - It stays `pending` past 900 s: `Der Render ist nach 15 Minuten nicht fertig.`
  - `pdfRef` is no longer the new asset: `Die PDF der Ausgabe wurde inzwischen ersetzt.`
  - `readRender` resolves `undefined`: `Die Ausgabe ist verschwunden.`
- [ ] **Step 2: Write the failing `run-ocr.test.ts`**, with fakes for `store`, `tools` and `textLayer`:
  - `assertInstalled` runs once before any entry when at least one entry needs recognition, and not at all otherwise. When it rejects, `runOcrSwap` rejects and no entry is touched.
  - Dry run: an entry whose hash differs is reported `checked`, and the log names `neuer Entwurf` for a published target and `Entwurf` for a draft. No upload or swap happens.
  - A real run uploads the bytes under `target.pdf.originalFilename`, falling back to `<documentId>.pdf`. It swaps, waits and reports `swapped`. The log line carries the length of `extractedText`.
  - Same `sha1hash`, with the render `done` on that PDF, is `skipped` and nothing is uploaded. That is the rerun.
  - Same hash and `pending`: a real run waits and reports `skipped`, a dry run does not wait and reports `checked`.
  - Same hash and `failed`, or `render.source` on another PDF: the entry fails with `Die PDF ist schon getauscht, aber ihr Render ist nicht fertig. Im Studio „Seiten neu erzeugen“ wählen und das Skript erneut starten.`
  - One failing entry (for example `findTarget` rejects) is recorded with its message, and the next entry still runs.
  - `isSuccessful` is `false` with any failure.
  - `summarize` gives `Getauscht: 1, übersprungen: 1, fehlgeschlagen: 1`, or `Probelauf: 2 geprüft, übersprungen: 0, fehlgeschlagen: 0` in a dry run. A line `Fehlgeschlagen: <id> (<error>)` follows per failure.
- [ ] **Step 3: Run them.** `pnpm --filter studio exec vp test run scripts/ocr-echo`. Expected: FAIL.
- [ ] **Step 4: Implement both modules.**
  - Entries run one after the other, with the `no-await-in-loop` disable comment that gives the reason, as in `run-import.ts`.
  - The preflight settles `needsRecognition` for every entry. An entry whose file cannot be read counts as `false` here and fails later with its real error.
  - Per entry, the log line is `<documentId>: <pageCount> Seiten, <mit Textebene | erkannt | schon erkannt>, <characters> Zeichen`, and the outcome follows on its own line.
- [ ] **Step 5: Run them again.** Same command. Expected: PASS.
- [ ] **Step 6: Commit.** `feat(studio): swap the TSG-Echo PDFs and wait for their render`.

### Task 7: Entry script, command and documentation

**Files:**

- Create: `apps/studio/scripts/ocr-echo.ts`
- Modify: `apps/studio/package.json`, `apps/studio/AGENTS.md`, `AGENTS.md` (the studio coverage figures)

**Interfaces:**

- Consumes: everything from Tasks 2 to 6.

- [ ] **Step 1: Write `scripts/ocr-echo.ts`** after `scripts/import-echo.ts`, wiring up:
  - `parseOcrOptions(process.argv.slice(2), { home: os.homedir(), repository })`
  - `getCliClient({ apiVersion: '2026-10-01' }).withConfig({ dataset, useCdn: false })`
  - `promisify(execFile)` with `maxBuffer: 64 * 1024 * 1024`
  - `access`, `mkdir({ recursive: true })`, `readFile`, `rename` and `rm({ force: true })` from `node:fs/promises`
  - `readPageTexts` from `@tsgi-web/pdf-pages`
  - `createHash('sha1')`
  - `setTimeout` from `node:timers/promises`

  It prints `Projekt <id>, Dataset <name>, <Probelauf ohne Schreiben | Austausch>: <n> Ausgaben` first, the summary last, and sets `process.exitCode` from `isSuccessful`.

- [ ] **Step 2: Add the command** `"ocr:echo": "sanity exec scripts/ocr-echo.ts --with-user-token --"` to `apps/studio/package.json`, next to `import:echo`.
- [ ] **Step 3: Smoke-test it without Sanity writes.** Create a scratchpad folder inside the home directory with one synthetic scan PDF and an `ocr-manifest.json` pointing at a non-existent document. Then run `pnpm --filter studio run ocr:echo --dataset development --folder <that folder>`. Expected: the header, an OCR'd file under `mit-textebene/`, then `Fehlgeschlagen: … gibt es nicht.`, and exit code 1. Delete the folder afterwards.
- [ ] **Step 4: Document it** in `apps/studio/AGENTS.md`, as a section `## TSG-Echo text layer` after the archive import, in the import section's style:
  - what it does and why (WEB-402)
  - `brew install ocrmypdf tesseract-lang`
  - the format of `ocr-manifest.json` and the commands for a dry and a real run
  - `mit-textebene/` as cache, and deleting a file there to recognize it again
  - the draft-only rule, and the refusal of release versions
  - waiting for the render, and the "Seiten neu erzeugen" recovery
  - that old PDFs and page images stay as unused assets

  Replace "scanned issues have no text layer, so it has nothing to work with there" in the TSG-Echo issues section with a pointer to the new section. Add `scripts/ocr-echo` to the `scripts` row of the directory map.

- [ ] **Step 5: Run every check.** At the root: `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:coverage`. Expected: all pass, and no threshold drops. Update the studio figures in the root `AGENTS.md` coverage line to what `test:coverage` now reports.
- [ ] **Step 6: Commit.** `feat(studio): add the ocr:echo command`. Then open the PR with the `create-pr` skill against `next` (`Closes WEB-402` only once the rollout in Task 8 is through; until then `Refs WEB-402`).

### Task 8: Rollout (runbook, with the user)

- [ ] **Step 1: Write the list.** Create `~/dev/customer/tsg/echo-archiv/ocr-manifest.json`:
  - the scans the user chose in Task 1, each with `dokument` from `toDocumentId(datei)` of the import (for example `echo-archiv-1984-tsg-irlich-1-echo`)
  - `ab 2024 (neues ECHO)/2024_TSG_Echo_45_Jahre_Web_Text.pdf` → `echo-2024`
  - `ab 2024 (neues ECHO)/2025_TSG_ECHO_Web_Text.pdf` → `echo-2025`

  Check every id against `development` with a raw GROQ query before the first run.

- [ ] **Step 2: Dry run on `development`.** `pnpm --filter studio run ocr:echo --dataset development --folder ~/dev/customer/tsg/echo-archiv`. Expected: every entry `checked`, none failed. Spot-check two files under `mit-textebene/`.
- [ ] **Step 3: Real run on `development`, after the user's OK.** Same command with `--no-dry-run`. Expected: every entry `swapped`, exit code 0.
- [ ] **Step 4: Verify on `development`.**
  - In raw GROQ, every listed draft has `length(extractedText) > 0`, and `render.source == pdf.asset._ref`.
  - `echo-2024` and `echo-2025` mention club topics, not only ads.
  - `*[_type == "echo.issue" && releaseDate < "2013-01-01" && indexable != false]._id` is empty.
  - A page image of a scan looks the same as before (studio or staging).
  - The user triggers „Intro erzeugen“ on `echo-2024` in the studio and confirms a substantive intro.
- [ ] **Step 5: Rerun check.** Run `--no-dry-run` again on `development`. Expected: every entry `skipped`, nothing uploaded.
- [ ] **Step 6: `production`, after the user's OK.** Dry run, then the real run. Verify with the queries from Step 4.
- [ ] **Step 7: Report.** Post a comment on WEB-402 with the outcome, in English, after the user's OK. Switch the PR to `Closes WEB-402`. The intros remain with the editors.
