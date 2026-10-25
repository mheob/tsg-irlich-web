# FAQ-Bereich mit FAQPage-JSON-LD (WEB-334) — Design-Spec

Datum: 2026-10-25 · Status: zurückgestellt, wird nach [WEB-384](https://linear.app/tsg-irlich/issue/WEB-384/abteilungen-und-gruppen-im-studio-pflegbar) auf Verweise auf `department` umgeschrieben (Spec `2026-10-25-departments-in-studio-design.md`) · Ticket: [WEB-334](https://linear.app/tsg-irlich/issue/WEB-334/geo-faq-bereich-mit-faqpage-json-ld) · Teil 5 von [WEB-324](https://linear.app/tsg-irlich/issue/WEB-324/seo-und-geo-optimierung-strukturierte-daten-json-ld-und-metadaten)

Scope: ein neuer Dokumenttyp für häufige Fragen, ihr Abschnitt auf den sechs Abteilungsseiten (`/angebot/[group]`) und das `FAQPage`-JSON-LD dazu.

## Warum

Interessierte fragen den Verein immer wieder dasselbe: Was kostet die Mitgliedschaft, kann ich zum Probetraining kommen, wann und wo wird trainiert? Diese Antworten sollen auf der Website stehen, dort, wo jemand eine Abteilung anschaut. Als `FAQPage` ausgezeichnet, können KI-Antwortdienste (ChatGPT, Perplexity, Googles KI-Übersicht) sie als Frage-Antwort-Paare übernehmen. Google selbst zeigt FAQ-Rich-Results seit 2023 kaum noch an; darum geht es hier nicht.

Die Inhalte liefert der Verein später („eilt nicht“, Kommentar im Ticket vom 11.10.2026). Der Abschnitt erscheint deshalb nur, wenn eine Abteilung Einträge hat. Bis dahin wird mit Platzhaltern auf `development` getestet.

## Ausgangslage

- Die sechs Abteilungsseiten rendert `apps/web/src/app/angebot/[group]/page.tsx`: Hero › Gruppen › Stats › Ansprechpartner › Newsletter.
- Die Abteilungen sind keine Sanity-Dokumente. Die Website kennt sie aus `groupSections` (`apps/web/src/utils/groups.ts`), das Studio aus `DEPARTMENTS` (`apps/studio/constants/departments.ts`). Beide verbinden sie über den Typnamen der Gruppen (`group.soccer`, `group.children-gymnastics`, …). `DEPARTMENTS` enthält zusätzlich `group.admin`, das keine Abteilungsseite hat.
- Alle sechs Seiten teilen sich ein Dokument `groupsPage` (Titel, Untertitel, Meta-Beschreibung, Abschnittsüberschriften für Gruppen und Ansprechpartner, Stats).
- Die Seiten lesen über `client.fetch` und sind nicht in der Vorschau des Studios.
- `groupsPage` steht weder in `REVALIDATION_MAP` (`apps/web/src/app/api/revalidate/route.ts`) noch im Filter der beiden Webhooks. Eine Änderung daran fällt heute auf den Standard-Handler (`revalidatePath('/')`) und erreicht die Abteilungsseiten nicht.
- JSON-LD: `JsonLd` (`apps/web/src/components/ui/json-ld.tsx`) rendert typisierte `schema-dts`-Knoten, die Builder stehen in `apps/web/src/utils/structured-data.ts` (Teil 2 von WEB-324).
- Ein Accordion gibt es noch nicht. `src/components/ui/collapsible.tsx` wrappt Base UIs `Collapsible`.
- `PortableText` (`src/components/ui/portable-text.tsx`) rendert Absätze, Listen, fett/kursiv sowie `internalLink`- und `externalLink`-Marks. Interne Links brauchen dafür das GROQ-Fragment `markDefsWithLinks`.
- Die e2e-Fixtures werden aus `development` aufgenommen. Die Accessibility-Sweep und die Visual-Regression decken je eine Abteilungsseite ab.

## Entscheidungen

Vom Nutzer am 25.10.2026 entschieden:

| Frage | Entscheidung |
| --- | --- |
| Ort | Die sechs Abteilungsseiten, jede mit ihren eigenen Fragen. Ohne Einträge kein Abschnitt. |
| Pflege | Eigener Dokumenttyp `faq` mit Frage, Antwort, Abteilungen (Mehrfachauswahl) und Sortierreihenfolge. Eine gemeinsame Frage wie „Mitgliedsbeitrag“ wird einmal gepflegt und mehreren Abteilungen zugeordnet. |
| Antwort | Rich Text mit fett/kursiv, Listen und Links (intern und extern). Das JSON-LD bekommt sie per `pt::text()` als reinen Text. |
| Position | Hero › Gruppen › Stats › **FAQ** › Ansprechpartner › Newsletter |

## Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**

- FAQ sind im Studio pflegbar und erscheinen auf den Abteilungsseiten, denen sie zugeordnet sind.
- Jede Abteilungsseite mit mindestens einer FAQ trägt ein gültiges `FAQPage`-JSON-LD (Schema Markup Validator und Googles Rich-Results-Test ohne Fehler).
- Antworten stehen im server-gerenderten HTML, auch zugeklappt. Crawler ohne JavaScript und die Browsersuche finden sie.

**Nicht-Ziele**

- FAQ auf `/angebot`, den Gruppenseiten oder anderen Seiten.
- Vorschau im Presentation-Tool: Die Abteilungsseiten sind heute nicht vorschaufähig, und das bleibt so.
- Die FAQ in `llms.txt` aufnehmen (möglicher Folgeschritt, sobald es echte Inhalte gibt).
- Die Inhalte selbst. Die liefert der Verein.

**Anti-Ziele** (wäre ein Fehlschlag, auch wenn es technisch läuft)

- Platzhalter-FAQ erscheinen auf `production`.
- Ein leerer FAQ-Abschnitt oder ein `FAQPage` ohne Fragen auf einer Abteilung ohne Einträge.
- JSON-LD, dessen Antworttext vom sichtbaren Text abweicht (Google verlangt, dass die Auszeichnung den sichtbaren Inhalt wiedergibt).
- Antworten, die erst nach dem Aufklappen per JavaScript ins DOM kommen.

## Studio

### Dokumenttyp `faq`

Datei `apps/studio/schemas/documents/faq.ts`, registriert in `schemas/index.ts`. Titel „FAQ“, Icon `RiQuestionAnswerLine` (`react-icons/ri`).

| Feld | Typ | Titel | Regeln |
| --- | --- | --- | --- |
| `question` | `string` | Frage | Pflicht. Warnung ab 120 Zeichen. |
| `answer` | `array` aus `block` | Antwort | Pflicht. Stile nur `normal`; Listen `bullet` und `number`; Dekoratoren `strong`, `em`; Annotationen `internalLink`, `externalLink` (die Objekte aus `schemas/objects/`). Keine Überschriften und kein Zitat, weil die Antwort in einem Accordion unter der Frage steht. |
| `departments` | `array` aus `string` | Abteilungen | Mindestens eine. `options.list` aus `DEPARTMENTS` ohne `group.admin` (Wert `type`, Titel `title`), `layout: 'grid'`. Beschreibung: „Auf welchen Abteilungsseiten die Frage erscheint.“ |
| `sortOrder` | `number` | Sortierreihenfolge | Wie bei den Gruppen (`apps/studio/utils/documents/group.tsx`): kleinere Zahl steht weiter oben. |

- Vorschau: Titel ist die Frage, Untertitel die Titel der Abteilungen, mit „, “ verbunden (aus den Werten über `DEPARTMENTS` aufgelöst). Die Funktion steht als eigenes `prepare`, damit ein Test sie direkt aufrufen kann.
- Sortierungen im Studio: nach `sortOrder` auf- und absteigend, wie bei den Gruppen.
- `answer` ist ein Array direkt am Dokument, kein `blockContent`-Objekt. `pt::text(answer)` und das Rendern bleiben damit ohne Umweg über `.text`.

### Abschnittsüberschrift in `groupsPage`

`groupsPage.content` bekommt ein viertes Feld `faqSection` (Titel, Untertitel, Intro über `getDefaultPageSectionFieldsWithGroup()` ohne Argument), das selbst in einer neuen Feldgruppe `faq` „FAQ“ aus `schemas/single-pages/groups/_groups.ts` liegt. Datei `schemas/single-pages/groups/faq.ts`, gebaut wie `groups.ts` und `contact-persons.ts`.

### Desk

Ein eigener Eintrag „FAQ“ auf der obersten Ebene, als `S.documentTypeList('faq')` mit Standardsortierung nach `sortOrder` aufsteigend: eine neue Gruppe `faq` in `getGroup` (`structure/index.ts`), eingehängt im alphabetisch sortierten Mittelblock von `plugins/singleton.ts`. `faq` kommt in `isExcludedDefaultListItem`, damit es nicht doppelt erscheint.

## Website

### Abfrage

In `apps/web/src/lib/sanity/queries/pages/offer-groups.ts` eine neue Abfrage `offerGroupsPageFaqsQuery`:

```groq
*[_type == 'faq' && $department in departments] | order(sortOrder asc, question asc) {
  _id,
  question,
  "answer": coalesce(answer[] { ..., ${markDefsWithLinks} }, []),
  "answerText": pt::text(answer),
}
```

`markDefsWithLinks` ist aus `queries/index.ts` bereits exportiert. `$department` ist `currentDepartment._type`.

### Seite

`apps/web/src/app/angebot/[group]/page.tsx` holt die FAQ im bestehenden `Promise.all` und rendert zwischen `Stats` und `ContactPersons`:

- den neuen Abschnitt `Faq` (`apps/web/src/app/angebot/[group]/_sections/faq.tsx`) und
- `JsonLd` mit `getFaqPageSchema(...)`,

beides nur, wenn es mindestens eine FAQ gibt.

### Abschnitt `Faq`

- `SectionHeader` wie in `_sections/groups.tsx`: Titel, dahinter der Abteilungsname in `text-primary`, Untertitel, Intro.
- Fehlt `faqSection` im Dokument (auf `production`, bis die Redaktion es füllt), gelten Titel „Häufige Fragen“ und Untertitel „FAQ“ ohne Intro.
- Darunter ein Accordion, ein Eintrag pro Frage. Die Frage ist der Auslöser und steht in einer Überschrift (`h3`, unter dem `h2` des `SectionHeader`), die Antwort ist das Panel und wird mit `PortableText` gerendert.
- Mehrere Einträge dürfen gleichzeitig offen sein, anfangs ist keiner offen.

### Accordion

Neu: `apps/web/src/components/ui/accordion.tsx`, ein Shadcn-Wrapper um `@base-ui/react/accordion` (`Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`). Startpunkt ist die Komponente aus `shadcn add accordion` (Stil `base-lyra`), deren Klassen auf die Gestaltung dieser Website umgeschrieben werden.

- Das Panel wird mit `hiddenUntilFound` gerendert: Die Antwort steht im HTML, ist zugeklappt per `hidden="until-found"` verborgen, und die Browsersuche klappt sie auf. Damit sind Anti-Ziel und Crawler-Anforderung erfüllt.
- Auf- und Zuklappen über `transition-*` mit `data-starting-style:` / `data-ending-style:` (Root-`AGENTS.md`), mit `motion-reduce:` ohne Animation.

### JSON-LD

`getFaqPageSchema` in `apps/web/src/utils/structured-data.ts`:

```ts
getFaqPageSchema({ baseUrl, path, faqs }): WithContext<FAQPage> | undefined
```

- `@type: 'FAQPage'`, `inLanguage: 'de-DE'`, `url: ${baseUrl}${path}`.
- `mainEntity`: pro FAQ ein `Question` mit `name` = Frage und `acceptedAnswer` = `Answer` mit `text` = `answerText`.
- FAQ ohne Frage oder mit leerem `answerText` fallen heraus. Bleibt keine übrig, liefert die Funktion `undefined`, und die Seite rendert kein `JsonLd`.

Der Abschnitt und das JSON-LD lesen dieselben Daten, damit die Auszeichnung nie mehr oder andere Fragen enthält als die Seite zeigt.

### Revalidierung

In `REVALIDATION_MAP`:

- `faq`: `revalidatePath('/angebot/[group]', 'page')`. Eine Frage kann mehreren Abteilungen gehören, und die frühere Zuordnung steht nicht im Payload.
- `groupsPage`: dasselbe. Behebt nebenbei die Lücke aus der Ausgangslage, und die FAQ-Überschrift liegt dort.

Beide Typen kommen in den Filter **beider** Webhooks (Production und Staging) und in die Liste in `docs/SANITY_WEBHOOK_SETUP.md`. Die Webhooks liegen in Sanity, nicht im Repository; die Änderung daran braucht vorher das OK des Nutzers.

## Testdaten

Auf `development` (nie auf `production`):

- `groupsPage.content.faqSection` mit Titel „Häufige Fragen“, Untertitel „FAQ“ und einem kurzen Intro.
- Vier Platzhalter-FAQ, als Platzhalter erkennbar formuliert: eine allen sechs Abteilungen zugeordnet (Mitgliedsbeitrag, mit internem Link auf `/mitgliedschaft`), drei nur Fußball (Probetraining, Trainingszeiten mit Liste, Anfahrt mit externem Link).

Damit hat die Abteilungsseite, die die e2e-Suite ansteuert, FAQ, und jede andere Abteilung genau eine. Das Schreiben in den Datensatz braucht vorher das OK des Nutzers.

## Tests

- **Studio:** `faq.test.ts` für die Vorschau (Titel der Abteilungen auflösen, unbekannter Wert, keine Abteilung). `structure/index.test.ts` für den neuen Eintrag und `isExcludedDefaultListItem`.
- **Web, `node`:** `getFaqPageSchema` (vollständiger Knoten, Filter leerer Antworten, `undefined` ohne FAQ). Der Revalidierungstest für `faq` und `groupsPage`. `page.test.ts` der Abteilungsseite für die neue Abfrage und das Ein- und Ausblenden.
- **Web, `dom`:** `faq.test.tsx` (Überschrift mit Abteilung, Fallback-Überschrift, Fragen als Buttons mit `aria-expanded`, Antwort nach Klick sichtbar, Link in der Antwort). `accordion.test.tsx` für den Wrapper.
- **e2e:** Fixtures aus `development` neu aufnehmen. In einer bestehenden Abteilungs-Spec: Frage aufklappen, Antwort sichtbar, ein `FAQPage`-Skript auf der Seite. Die Accessibility-Sweep muss ohne neuen Baseline-Eintrag grün bleiben. Die Visual-Baseline der Abteilungsseite wird im Playwright-Container neu erzeugt (`pnpm --filter web run test:e2e:visual:update`) und im selben Commit abgelegt.
- Coverage-Schwellen bleiben mindestens, wo sie sind.

## Dokumentation

- `apps/web/AGENTS.md`, Abschnitt „Structured data“: `getFaqPageSchema` und warum die Antworten per `hiddenUntilFound` im HTML stehen.
- `apps/studio/AGENTS.md`: ein kurzer Abschnitt zum Typ `faq` (Zuordnung über Typnamen der Abteilungen, `group.admin` ausgenommen).
- `docs/SANITY_WEBHOOK_SETUP.md`: Filterliste um `faq` und `groupsPage` ergänzen.

## Eigene Entscheidungen (zur Prüfung)

- Feldnamen, Icon, Zeichenlimit 120 der Frage, Fallback-Überschrift „Häufige Fragen“ / „FAQ“.
- `answer` als Block-Array direkt am Dokument statt `blockContent`/`simpleBlockContent`; ohne Überschriften und Zitat.
- Desk-Eintrag „FAQ“ auf oberster Ebene statt unter „Gruppen“.
- Accordion mit `hiddenUntilFound`, mehrere Einträge gleichzeitig offen.
- `groupsPage` zusätzlich in Revalidierung und Webhook-Filter.
- Inhalt und Umfang der Platzhalter-FAQ.
