# Unit-Tests (WEB-296) — Design-Spec

Datum: 2026-08-25 · Status: entschieden, noch nicht umgesetzt · Ticket: [WEB-296](https://linear.app/tsg-irlich/issue/WEB-296/unittests) (Epic: WEB-294 „Automatiertes Testing")

Scope: **Unit-Tests für alle vier Workspaces** (`apps/web`, `apps/studio`, `packages/shared`, `packages/email`) inklusive Test-Infrastruktur, CI-Anbindung und Coverage-Report. E2E-Tests sind ein eigenes Ticket unter demselben Epic und hier ausdrücklich nicht enthalten.

## Ausgangslage

Das Repository hat heute keine Test-Infrastruktur: kein Test-Runner, kein `test`-Script, keine `test`-Task in `turbo.json`, keinen CI-Schritt. Die einzigen `*.spec.*`-Dateien liegen unter `packages/email/.react-email/` — ein generiertes, per `.gitignore` ausgeschlossenes Verzeichnis, das von den Tests nicht erfasst werden darf.

`sonar-project.properties` schaltet Coverage aktuell komplett ab (`sonar.coverage.exclusions=**/*`).

## Entschiedene Optionen

| Frage | Entscheidung |
| --- | --- |
| Umfang | Alles: pure Logik, Server Actions, Komponenten, Studio, E-Mail-Templates |
| Runner | Vitest, eine Config pro Workspace, `test`-Task über Turbo |
| Enforcement | CI-Schritt in `check.yml` (blockt PRs) + Coverage-Report an Sonar, **keine** Mindest-Quote |
| Lieferung | Infra-PR zuerst, danach ein PR pro Ebene (5 PRs) |
| Test-Globals | Explizite Imports aus `vitest`, kein `globals: true` |
| Dateiablage | Tests liegen neben der Quelldatei (`foo.ts` → `foo.test.ts`) |
| Mock-Grenze bei externen Diensten | HTTP-Ebene (`fetch`) statt Modul-Mocks; nur Resend wird als SDK gemockt |
| Auswahlkriterium | Nur Code mit eigener Logik. Keine Tests, die ausschließlich Typen oder Literale wiederholen |

## Lieferung in fünf PRs

Jeder PR ist eigenständig grün. Nach PR 1 ist die CI-Kette vollständig, alle weiteren PRs fügen nur Tests hinzu.

### PR 1 — Infrastruktur

**Dependencies** (Root-devDependencies, damit die Version einheitlich bleibt): `vitest@^4.1.11`, `@vitest/coverage-v8@^4.1.11`. Pro Workspace zusätzlich, wo benötigt: `jsdom@^30`, `@testing-library/react@^16.3`, `@testing-library/user-event@^14.6`, `@vitejs/plugin-react@^6.1`, `vite-tsconfig-paths@^6.1`, `@react-email/render@^2.1` (nur `packages/email`).

**Configs** — je eine `vitest.config.ts` pro Workspace, jeweils mit `vite-tsconfig-paths`, damit `@/*` aus der jeweiligen `tsconfig.json` auflöst (`apps/web` → `./src/*`, `apps/studio` → `./*`, `packages/shared` → `./src/*`):

- `apps/web`: zwei `test.projects` in derselben Config — `node` (Default) und `dom` (jsdom) über das Glob `src/{components,hooks}/**`. Vitest 4 hat `environmentMatchGlobs` entfernt, `projects` ist der Ersatz.
- `apps/studio`: jsdom, React-Plugin (die Schemas sind reine Objekte, einzelne `components/` rendern aber).
- `packages/shared`: node, plus jsdom-Project für die beiden Icon-/Logo-Komponenten.
- `packages/email`: node, React-Plugin, `exclude: ['.react-email/**']`.

**Asset-Stub**: `apps/web/src/utils/groups.ts` importiert `.webp`-Dateien. Die Web-Config erhält ein kleines Inline-Plugin, das `\.(webp|png|jpe?g|svg)$` auf ein Stub-Modul in der Form `{ src, width, height }` auflöst — dieselbe Form, die Next.js injiziert.

**DOM-Setup** (`apps/web/test-utils/setup-dom.ts`, vom `dom`-Project geladen): Stubs für `window.matchMedia`, `ResizeObserver` und `IntersectionObserver`; Modul-Mocks für `next/image` → einfaches `<img>`, `next/navigation` (`usePathname`, `useRouter`) und `motion` → einfache Elemente, damit Animationen die Assertions nicht flaky machen.

**Env-Helper** (`apps/web/test-utils/env.ts`): `lib/env.ts` cached validierte Werte in einer Modul-`Map`, `getBaseUrl()` liest darüber. Der Helper (`loadWithEnv(path, vars)`) kapselt `vi.resetModules()` + `vi.stubEnv()`, statt diese Kombination in jedem Test zu wiederholen.

**Fetch-Helper** (`apps/web/test-utils/fetch-mock.ts`): `vi.stubGlobal('fetch', …)` mit einer kleinen Queue, die Responses pro URL-Muster liefert.

**Scripts**: `test`, `test:watch`, `test:coverage` pro Workspace; im Root `test` und `test:affected` über Turbo. `turbo.json` erhält die Tasks `test` und `test:coverage` (letztere mit `outputs: ["coverage/**"]`). Unit-Tests brauchen keinen Build, deshalb kein `dependsOn: ["^build"]`.

**CI** (`.github/workflows/check.yml`): neuer `test`-Schritt nach dem Lint- und vor dem Build-Schritt. Er läuft nach dem bereits vorhandenen `typegen:routes`-Schritt und braucht dieselben beiden Secrets (`NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_PROJECT_ID`).

**Coverage/Sonar**: `sonar.coverage.exclusions=**/*` entfällt, stattdessen `sonar.javascript.lcov.reportPaths` mit den vier `coverage/lcov.info`-Pfaden und `sonar.test.inclusions=**/*.test.*`. `sonar.yml` führt heute nur Checkout und Scan aus und bekommt deshalb pnpm-/Node-Setup, Install und `pnpm run test:coverage` vor dem Scan-Schritt. (Alternative wäre ein Artefakt-Transport aus `check.yml`; verworfen, weil er mehr bewegliche Teile hat.)

**Zwei Bugfixes in diesem PR**, weil beide durch Tests festgeschrieben werden:

1. `packages/shared/src/utils/date.ts`: `hour: 360` → `3600`, `day: 8640` → `86_400`. `week` (`604_800`) und `month` (`2_592_000`, 30 Tage) sind korrekt. Verhaltensneutral, weil im Repository nur `second` (`number-ticker.tsx`) und `minute` (`cleverreach.ts`) verwendet werden. Der neue `date.test.ts` prüft jede Zeitspanne gegen ihre arithmetische Definition.
2. `apps/web/src/actions/subscribe-to-newsletter.ts`: `'Bitte überprüfen Deine Eingaben.'` → `'Bitte überprüfe Deine Eingaben.'`, damit derselbe Zustand nicht zwei Grammatiken hat (`ERROR_MESSAGES.VALIDATION_ERROR` ist schon korrekt).

### PR 2 — Pure Logik

`packages/shared`

- `array.ts` — `shuffleArray`: Länge und Elemente bleiben erhalten, Eingabe wird nicht mutiert, deterministische Reihenfolge bei gestubbtem `Math.random`.
- `cn.ts` — bedingte Objekte, spätere Tailwind-Klasse gewinnt bei Konflikt.
- `date.ts` — jede Zeitspanne gegen ihre arithmetische Definition (Regressionsschutz für den Bugfix).
- `promise.ts` — `settle` bei Resolve, bei Reject und mit einem Thenable; wirft nie.
- Ausgelassen: `jsx.ts` (drei leere Konstanten), alle `index.ts`-Barrels.

`apps/web/src/utils`

- `typography.ts` — leerer String, ein Zeichen, eigener Separator, gemischte Groß-/Kleinschreibung in `capitalizeWords`.
- `links.ts` — Home, News-Artikel mit und ohne Kategorie, News-Kategorie, Gruppe mit Abteilungsseite, Gruppe ohne Abteilungsseite (z. B. Verwaltung → `undefined`), unbekannter Typ fällt auf `/${slug}`, fehlender Typ oder Slug → `undefined`.
- `groups.ts` — `getCurrentDepartment` Treffer und Fehlschlag, `getGroupImage`-Fallback, `getOGImage` für bekannte Gruppe vs. Fallback-Pfad inklusive 1200×630.
- `icon.ts` — bekannte Plattform, Meta-Key `_type` wird übersprungen, Plattform ohne URL wird übersprungen, `null` → `[]`.
- `image.ts` — `getInitials` (beide Namen, einer fehlt, beide leer, Kleinschreibung), `getGalleryImages` mit `undefined`/`[]` und mit Bildern, deren URL-Builder `undefined` liefert (werden verworfen). Die URL-Builder sind hier gemockt und werden in `sanity/utils` echt getestet.
- `time.ts` — `getLocaleDate` lang und kurz, String- und `Date`-Eingabe, explizites Locale. Die Assertions normalisieren `U+202F` und `U+00A0`, damit ein ICU-Update die Suite nicht bricht.
- `url.ts` — `getBaseUrl` in allen drei Zweigen über den Env-Helper; `printGoogleMapsLink` mit vollständiger Adresse, ohne Name, ohne PLZ und mit korrektem Percent-Encoding.

`apps/web/src/lib`

- `sanity/utils.ts` — `getDownloadFileUrl` (`#!` bei fehlender URL oder fehlendem Dateinamen), `getFileSize` (`0`/`undefined` → `—`, B, KB, MB, GB, Grenze bei genau 1024, Dezimalstellen pro Einheit), `urlForImage` (ohne `asset._ref` → `undefined`, nur Höhe = quadratischer Crop, Breite und Höhe, ohne Maße `fit=max`, `q=90`), `urlForImageMax` (`w`, `fit=max`, kein Crop).
- `env.ts` — gültiger Wert, fehlender Pflichtwert wirft mit dem Key in der Meldung, Defaults greifen (`NODE_ENV`, Sanity-API-Version), `''` wird für `SANITY_API_READ_TOKEN` zu `undefined` vorverarbeitet, zweiter Aufruf kommt aus dem Cache (eine Änderung an `process.env` nach dem ersten Lesen bleibt wirkungslos).
- `validations/contact-form.ts` — gültige Eingabe, ungültige E-Mail, Nachricht unter 32 Zeichen, Name unter 2 Zeichen, `privacy: false` abgelehnt, `receiver` optional im Basis-Schema und Pflicht in `contactFormWithReceiverSchema`, deutsche Meldungen werden geprüft.
- `validations/feedback.ts` — Min-/Max-Grenzen für Titel und Beschreibung, E-Mail gültig / leerer String erlaubt / ungültig, jedes Enum lehnt einen unbekannten Wert ab, Meldung bei fehlendem `type`.
- Ausgelassen: `sanity/queries/**` (GROQ-String-Konstanten ohne Logik, deren Form bereits von TypeGen abgesichert wird), `lib/actions/safe-action.ts` (einzeilige Factory), `lib/resend.ts`, `sanity/client.ts`, `sanity/live.ts` (nur SDK-Konstruktion).

### PR 3 — Server Actions und CleverReach

Alle externen Aufrufe dieser Ebene laufen über `fetch` (CleverReach REST, Linear GraphQL, Linear-S3-PUT); nur Resend ist ein SDK. Deshalb wird auf HTTP-Ebene gemockt (`test-utils/fetch-mock.ts`), plus `vi.mock('@/lib/resend')` und `vi.mock('next/headers')` für `subscribe-to-newsletter`. So bleibt das Zod-Parsing der Antworten unter Test, statt weggemockt zu werden — dort liegen die realistischen Fehler.

Die Actions sind in `next-safe-action` gewickelt. Die Tests rufen die exportierte Action auf und prüfen deren `{ data }` / `{ validationErrors }` / `{ serverError }`-Hülle, nicht einen nackten Rückgabewert. Die `'use server'`-Direktive ist unter Vitest wirkungslos.

`lib/cleverreach.ts` (umfangreichste Datei dieser Ebene)

- `getAccessToken` — einmal `fetch`, zweiter Aufruf aus dem Modul-Cache (genau ein `fetch`); Token innerhalb des 5-Minuten-Puffers löst einen neuen Request aus; nicht-ok-Response wirft mit dem Body-Text; fehlerhaftes Payload scheitert am `accessTokenSchema`. Braucht `vi.resetModules()` pro Fall (Modul-State `tokenCache`) und Fake Timers für das Ablauf-Fenster.
- `addReceiver` — 200 → Erfolg; 409 → `code: 'ALREADY_SUBSCRIBED'`; anderer Fehler mit parsebarem `{ error: { code, message } }` → Code und Meldung werden durchgereicht; nicht-JSON-Fehlerbody → Fallback `'Failed to add subscriber'`.
- `sendDoiEmail` — Fehlschlag loggt nur und lässt das Abo erfolgreich (`console.error` geprüft, Ergebnis weiterhin erfolgreich).
- `resolveDoiMetadata` — explizite Metadaten gewinnen; Defaults leiten den Referer aus `VERCEL_PROJECT_PRODUCTION_URL` ab und sind leer, wenn die Variable fehlt.
- `subscribe` — ungültige E-Mail → `VALIDATION_ERROR` ohne einen einzigen `fetch`; ein geworfener Fehler an beliebiger Stelle → `INTERNAL_ERROR`; Happy Path liefert die Bestätigungsmeldung und hat beide Endpunkte aufgerufen.

`actions/subscribe-to-newsletter.ts` — fehlende/ungültige `email` in der `FormData` → Fehlerzustand; Header-Auswertung (`x-forwarded-for` mit mehreren IPs nimmt die erste und trimmt, fehlende Header fallen auf `0.0.0.0` / `Mozilla/5.0` zurück); jeder `result.code` mappt auf seine deutsche Meldung, unbekannter Code fällt auf den Rohfehler zurück; Erfolgszustand.

`actions/create-linear-issue.ts` — `buildDescription` (Screenshot-Block nur bei vorhandenen URLs, Metadaten-Zeilen überspringen falsy Felder, `privacy: true` wird gerendert, `Source`-Zeile immer am Ende), Titel je Typ in Großbuchstaben, Mutation-Variablen tragen `teamId`/`assigneeId`/`labelIds`; nicht-ok-HTTP → `HTTP error: <status>`; GraphQL-`errors` → `Failed to create issue`; `success: false` oder fehlendes Issue → `Issue creation failed`; Happy Path liefert `issueId` und `issueIdentifier`.

`actions/upload-to-linear.ts` — Schema lehnt einen Nicht-Bild-Typ und eine Datei über 10 MB ab (Meldungen erscheinen als `validationErrors`); `buildUploadHeaders` legt die Linear-Header über den Content-Type; fehlendes `uploadFile` wirft mit Status und Payload; PUT-Fehlschlag wirft mit seinem Status; Happy Path liefert `assetUrl` und hat die Datei-Bytes per PUT gesendet.

`actions/send-contact-form.ts` — Empfänger-Adresse in Produktion, außerhalb erzwungenes `it@tsg-irlich.de`, `bcc`/`replyTo`/Subject aus der Eingabe gebaut, fehlender Empfänger fällt auf `info@tsg-irlich.de` zurück, `{ error }` von Resend wirft `Email could not be sent`.

### PR 4 — Komponenten und Hook

Getestet werden nur Komponenten mit eigener Logik. Server Actions werden auf Modulpfad-Ebene gemockt, hier läuft kein `fetch`.

- `ui/lightbox.tsx` — Öffnen an einem gegebenen Index, Blättern vor und zurück, Verhalten an beiden Enden, `Escape` schließt, Pfeiltasten blättern, Klick auf das Backdrop schließt, Klick auf den Inhalt nicht, Caption nur wenn vorhanden, Einzelbild-Fall ohne Pager.
- `ui/gallery.tsx` — ein Tile pro Bild, Klick auf Tile _n_ öffnet die Lightbox bei _n_, Flag für die abgerundeten Ecken, nur das erste Bild ist `preload`.
- `with-logic/feedback/screenshot-upload.tsx` — akzeptiert ein Bild, lehnt falschen Typ und zu große Datei mit der jeweiligen Meldung ab, zeigt den Pending-Zustand, Entfernen löscht den Eintrag, Fehler der Upload-Action erscheint und lässt die Dateiliste konsistent.
- `section/contact-form.tsx` und `with-logic/feedback/form.tsx` — leeres Absenden zeigt die Zod-Meldungen, gültiges Absenden ruft die Action genau einmal mit den geparsten Werten, `serverError` rendert den Fehler-Alert, Erfolg rendert die Bestätigung und setzt das Formular zurück, Submit ist während des Pendings deaktiviert.
- `with-logic/navigation.tsx` — Mobile- vs. Desktop-Zweig über das gestubbte `matchMedia`, aktiver Eintrag aus `usePathname`, Öffnen und Schließen des Mobile-Menüs.
- `section/newsletter.tsx` — Erfolgs- und Fehlerzustand aus `useActionState` mit gemockter Action.
- `ui/portable-text.tsx` — jede Mark und jeder Blocktyp mappt auf sein Element, interne Links laufen über `getInternalHref`, externe Links bekommen `rel`/`target`, unbekannte Typen führen nicht zum Absturz.
- `with-logic/breadcrumb.tsx` — Segmente aus dem Pfad, aufbereitete Labels, letztes Segment ist kein Link.
- `with-logic/number-ticker.tsx` — erreicht den Zielwert unter Fake Timers, respektiert das Delay.
- `with-logic/contact-link.tsx`, `contact-persons.tsx` — `mailto`/`tel`-Aufbau, Initialen-Fallback ohne Bild, leere Liste rendert nichts.
- `hooks/use-media-query.ts` — initialer Match, Aktualisierung auf ein `change`-Event, Listener wird beim Unmount entfernt, `false` wenn `matchMedia` fehlt.

Ausgelassen: die shadcn-/Radix-Wrapper (`select`, `dialog`, `drawer`, `scroll-area`, `card`, `input`, `textarea`, `toggle`, `toggle-group`, `alert`, `badge`, `button`, Breadcrumb-Primitives) und die rein darstellenden Karten (`training-card`, `group-card`, `pricing-card`, `news-article-preview*`, `hero`, `vision`, `footer`) — sie reichen nur Props und CVA-Klassen weiter. Interaktion auf diesen Flächen gehört in das E2E-Ticket des Epics.

### PR 5 — Studio und E-Mail

`apps/studio` (Tests liegen neben der Quelldatei, dieser Workspace hat kein `src`)

- `utils/strings.ts` — `slugify`: das Beispiel aus dem JSDoc, Umlaut-Transliteration (`für` → `fuer`), Satzzeichen entfallen, Füllwörter (`und`, `der`, `die`, …) entfallen, eine Eingabe aus ausschließlich Füllwörtern → `''`, bereits geslugte Eingabe ist idempotent.
- `utils/time.ts` — `formatDate` für `Date` und ISO-String sowie das UTC-Verhalten an einer Zeitzonengrenze (`toISOString` macht das zeitzonenabhängig, der Test fixiert `TZ` über `vi.stubEnv`).
- `utils/fields.ts` — `getFieldWithGroup` liefert eine Kopie mit gesetzter Gruppe und mutiert die Quelle nicht; `getFieldWithoutGroup` entfernt sie.
- `structure/index.ts` — `getGroup` und `isExcludedDefaultListItem` für eingeschlossene und ausgeschlossene Typen.
- `plugins/singleton.ts` — `document.actions` entfernt `duplicate` für einen Singleton-Typ und lässt andere Typen unberührt; `newDocumentOptions` filtert Singleton-Templates im `global`-Kontext und behält sie sonst.
- `preview.prepare`-Funktionen der Schemas, die tatsächlich rechnen (`schemas/sections/gallery.ts`, `objects/training-time.ts`, `objects/extended-image.ts`, `documents/testimonial.ts`, `schemas/sections/grid.ts`, `spacer.ts`): Titel-Fallbacks bei fehlenden Feldern, Zusammensetzung des Untertitels, Durchreichen von `media`. Aufgerufen direkt auf dem exportierten Definitionsobjekt, ohne Sanity-Runtime.
- Eigene `validation`-Regeln derselben Schemas, als reine Funktionen aufgerufen und auf ihr `true`/Meldungs-Ergebnis geprüft.
- Ausgelassen: die Feld- und Section-Literale selbst (`shared/fields/*`, `shared/sections/*`, reine `defineField`-Formen) — `extract-types` und TypeGen sichern die schon ab, und ein Test darauf wiederholt nur das Literal. Ebenfalls ausgelassen: `plugins/assist.ts` (270 Zeilen Prompt-Daten) und `plugins/index.ts` (Plugin-Verdrahtung).

`packages/email`

- `lib/cleverreach-markers.ts` — wertvollste Datei des Pakets, reine String-Verarbeitung: `marker()` ohne Attribute, mit mehreren Attributen und mit einem `undefined`-Attribut (wird verworfen); `toCleverReachTemplate` wandelt einen und mehrere Marker, entfernt Reacts `<!-- -->`-Separatoren und lässt unmarkiertes HTML unberührt; `stripCleverReachMarkers` entfernt jeden Marker und nichts sonst; ein Marker mit `|` im Wert verhält sich wie in der dokumentierten Einschränkung beschrieben.
- `lib/render-newsletter.ts` — `renderNewsletterHtml` liefert HTML ohne Marker und ohne `#html#`-Kommentare; `renderNewsletterTemplate` liefert die CleverReach-Kommentare; beide reichen `isTemplate` korrekt durch.
- `emails/*` und `components/newsletter/*` — gezielte Assertions auf die logiktragenden Teile: `news-grid` und `upcoming-events` rendern einen Eintrag pro Element und nichts bei leerer Liste, `event-date-badge` rendert Wochentag/Tag/Monat aus einem `NewsletterEvent`, `email-button` Href und Label, `sponsor-card` den Zweig ohne Bild, `contact-forward.tsx` die Empfängerzeile nur mit übergebenem Empfänger. Dazu genau zwei Full-Render-Snapshots (Newsletter als Template und als Mailing) als struktureller Regressionsschutz.
- Ausgelassen: die rein gestaltenden Wrapper (`section-kicker`, `cta-band`, Markup von `newsletter-header`/`newsletter-footer`) über ihr Vorkommen in den beiden Snapshots hinaus.

## Erwarteter Umfang

Grob 240–300 Testfälle in etwa 45 Testdateien über alle fünf PRs.

## Offene Punkte

Keine. Coverage-Schwelle bleibt bewusst offen und kann in einem Folgeticket gesetzt werden, wenn die Quote nach PR 5 bekannt ist.
