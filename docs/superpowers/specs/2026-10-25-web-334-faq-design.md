# FAQ-Bereich mit FAQPage-JSON-LD (WEB-334) — Design-Spec

Datum: 2026-10-25, überarbeitet 2026-10-26 nach [WEB-384](https://linear.app/tsg-irlich/issue/WEB-384/abteilungen-und-gruppen-im-studio-pflegbar) · Status: Entwurf · Ticket: [WEB-334](https://linear.app/tsg-irlich/issue/WEB-334/geo-faq-bereich-mit-faqpage-json-ld) · Teil 5 von [WEB-324](https://linear.app/tsg-irlich/issue/WEB-324/seo-und-geo-optimierung-strukturierte-daten-json-ld-und-metadaten)

Scope: ein neuer Dokumenttyp für häufige Fragen, ihr Abschnitt auf den Abteilungsseiten (`/angebot/[group]`) und das `FAQPage`-JSON-LD dazu.

## Warum

Interessierte fragen den Verein immer wieder dasselbe: Was kostet die Mitgliedschaft, kann ich zum Probetraining kommen, wann und wo wird trainiert? Diese Antworten sollen auf der Website stehen, dort, wo jemand eine Abteilung anschaut. Als `FAQPage` ausgezeichnet, können KI-Antwortdienste (ChatGPT, Perplexity, Googles KI-Übersicht) sie als Frage-Antwort-Paare übernehmen. Google selbst zeigt FAQ-Rich-Results seit 2023 kaum noch an; darum geht es hier nicht.

Die Inhalte liefert der Verein später („eilt nicht“, Kommentar im Ticket vom 11.10.2026). Der Abschnitt erscheint deshalb nur, wenn eine Abteilung Einträge hat. Bis dahin wird mit Platzhaltern auf `development` getestet.

## Ausgangslage (nach WEB-384)

- Die Abteilungen sind Dokumente vom Typ `department` mit den festen IDs `department-<slug>` (`department-fussball`, `department-kurse`, …). Gruppen verweisen über `department` auf sie.
- `apps/web/src/app/angebot/[group]/page.tsx` rendert eine Abteilungsseite: Hero › Gruppen › Stats › Ansprechpartner › Newsletter. Sie liest über `sanityFetch` (`departmentPageQuery` in `apps/web/src/lib/sanity/queries/departments.ts`, dazu `offerGroupsPageQuery`) und ist im Presentation-Tool des Studios vorschaufähig. Eigenes JSON-LD rendert sie nicht; die `BreadcrumbList` kommt über `Hero` (`Breadcrumb`), wie auf jeder Seite mit Hero.
- `groupsPage` hält, was alle Abteilungsseiten teilen: Titel, Untertitel, Meta-Beschreibung und die Abschnittsüberschriften für Gruppen und Ansprechpartner (`schemas/single-pages/groups/`). Stats, Intro und Ansprechpartner stehen inzwischen an der Abteilung.
- Revalidierung: `department`, `group` und `groupsPage` stehen in `REVALIDATION_MAP` (`apps/web/src/app/api/revalidate/route.ts`); `groupsPage` revalidiert `/angebot/[group]`. Der Filter der Webhooks steht in `docs/SANITY_WEBHOOK_SETUP.md`. Staging nutzt ihn schon, Production bekommt ihn beim Rollout von WEB-384.
- `LOCATION_QUERIES` in `apps/studio/plugins/presentation.ts` liefert die „Verwendet auf“-Links für `department`, `group` und die News-Typen, als GROQ über `documentStore.listenQuery`.
- JSON-LD: `JsonLd` (`apps/web/src/components/ui/json-ld.tsx`) rendert typisierte `schema-dts`-Knoten, die Builder stehen in `apps/web/src/utils/structured-data.ts`.
- Ein Accordion gibt es noch nicht. `src/components/ui/collapsible.tsx` wrappt Base UIs `Collapsible`.
- `PortableText` (`src/components/ui/portable-text.tsx`) rendert Absätze, Listen, fett/kursiv sowie `internalLink`- und `externalLink`-Marks. Interne Links brauchen dafür das GROQ-Fragment `markDefsWithLinks` aus `queries/index.ts`.
- Die e2e-Fixtures werden aus `development` aufgenommen. Die e2e-Suite steuert die Abteilungsseite `/angebot/fussball` an (`offers.spec.ts`, `structured-data.spec.ts`); die Accessibility-Sweep und die Visual-Regression decken je eine Abteilungsseite ab.

## Entscheidungen

Vom Nutzer am 25.10.2026 entschieden, die Zuordnung im Ticket nach WEB-384 auf Verweise umgestellt:

| Frage | Entscheidung |
| --- | --- |
| Ort | Die Abteilungsseiten, jede mit ihren eigenen Fragen. Ohne Einträge kein Abschnitt. |
| Pflege | Eigener Dokumenttyp `faq` mit Frage, Antwort, Abteilungen (Verweise auf `department`, Mehrfachauswahl) und Sortierreihenfolge. Eine gemeinsame Frage wie „Mitgliedsbeitrag“ wird einmal gepflegt und mehreren Abteilungen zugeordnet. |
| Antwort | Rich Text mit fett/kursiv, Listen und Links (intern und extern). Das JSON-LD bekommt sie per `pt::text()` als reinen Text. |
| Position | Hero › Gruppen › Stats › **FAQ** › Ansprechpartner › Newsletter |
| Geteilte Fragen im JSON-LD (26.10.2026) | Eine Frage mit mehreren Abteilungen wird nur auf der Seite ihrer ersten zugeordneten Abteilung (erster Eintrag in `departments`) ausgezeichnet; sichtbar bleibt sie auf allen. Google verlangt, dieselbe Frage nur einmal pro Website auszuzeichnen. |

## Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**

- FAQ sind im Studio pflegbar und erscheinen auf den Abteilungsseiten, denen sie zugeordnet sind.
- Jede Abteilungsseite, die für mindestens eine FAQ die erste Abteilung ist, trägt ein gültiges `FAQPage`-JSON-LD (Schema Markup Validator und Googles Rich-Results-Test ohne Fehler). Jede Frage ist auf der ganzen Website höchstens einmal ausgezeichnet.
- Antworten stehen im server-gerenderten HTML, auch zugeklappt. Crawler ohne JavaScript lesen sie dort; die Browsersuche findet und öffnet sie, sobald die Seite hydriert ist.
- Im Presentation-Tool ist eine FAQ auf den Seiten ihrer Abteilungen sichtbar und bearbeitbar.

**Nicht-Ziele**

- FAQ auf `/angebot`, den Gruppenseiten oder anderen Seiten.
- Die FAQ in `llms.txt` aufnehmen (möglicher Folgeschritt, sobald es echte Inhalte gibt).
- Die Inhalte selbst. Die liefert der Verein.

**Anti-Ziele** (wäre ein Fehlschlag, auch wenn es technisch läuft)

- Platzhalter-FAQ erscheinen auf `production`.
- Ein leerer FAQ-Abschnitt oder ein `FAQPage` ohne Fragen auf einer Abteilung ohne Einträge.
- JSON-LD mit einer Frage, die auf der Seite nicht sichtbar ist, oder mit einem Antworttext, der vom sichtbaren abweicht (Google verlangt, dass die Auszeichnung den sichtbaren Inhalt wiedergibt).
- Dieselbe Frage im JSON-LD mehrerer Seiten.
- Antworten, die erst nach dem Aufklappen per JavaScript ins DOM kommen.
- Eine FAQ, die auf einer Abteilungsseite nur deshalb erscheint, weil ihre Antwort auf diese Abteilung verlinkt.

## Studio

### Dokumenttyp `faq`

Datei `apps/studio/schemas/documents/faq.ts`, registriert in `schemas/index.ts`. Titel „FAQ“, Icon `RiQuestionAnswerLine` (`react-icons/ri`).

| Feld | Typ | Titel | Regeln |
| --- | --- | --- | --- |
| `question` | `string` | Frage | Pflicht. Warnung ab 120 Zeichen. |
| `answer` | `array` aus `block` | Antwort | Pflicht. Stile nur `normal`; Listen `bullet` und `number`; Dekoratoren `strong`, `em`; Annotationen `internalLink`, `externalLink` (die Objekte aus `schemas/objects/`). Keine Überschriften und kein Zitat, weil die Antwort in einem Accordion unter der Frage steht. |
| `departments` | `array` aus `reference` auf `department` | Abteilungen | Mindestens eine, keine doppelt (`Rule.min(1).unique()`). `options.disableNew: true`, weil eine Abteilung nicht aus einer FAQ heraus angelegt werden soll. Beschreibung: „Auf welchen Abteilungsseiten die Frage erscheint. Für Suchmaschinen ausgezeichnet wird sie nur auf der Seite der ersten Abteilung.“ |
| `sortOrder` | `number` | Sortierreihenfolge | Pflicht wie bei den Gruppen: kleinere Zahl steht weiter oben. Gilt auf allen Seiten, denen die Frage zugeordnet ist. |

- Vorschau: Titel ist die Frage, Untertitel die Titel der ersten drei Abteilungen, mit „, “ verbunden, bei mehr als drei gefolgt von „ +N“ (`Fußball, Kurse, Tanzen +3`). Ohne Abteilung bleibt der Untertitel leer. `select` liest `departments` (für die Anzahl) und `departments.0.title` bis `departments.2.title`. `prepare` steht als eigene, exportierte Funktion, damit ein Test sie direkt aufrufen kann (wie `prepareDepartmentPreview`).
- Sortierungen im Studio: nach `sortOrder` auf- und absteigend, wie bei den Gruppen.
- `answer` ist ein Array direkt am Dokument, kein `blockContent`-Objekt. `pt::text(answer)` und das Rendern bleiben damit ohne Umweg über `.text`.

### Abschnittsüberschrift in `groupsPage`

`groupsPage.content` bekommt ein Feld `faqSection` (Titel, Untertitel, Intro über `getDefaultPageSectionFieldsWithGroup()` ohne Argument), das selbst in einer neuen Feldgruppe `faq` „FAQ“ aus `schemas/single-pages/groups/_groups.ts` liegt. Datei `schemas/single-pages/groups/faq.ts`, gebaut wie `groups.ts` und `contact-persons.ts`.

### Desk

Ein eigener Eintrag „FAQ“ auf der obersten Ebene, als `S.documentTypeList('faq')` mit Standardsortierung nach `sortOrder` aufsteigend: eine neue Gruppe `faq` in `getGroup` (`structure/index.ts`), eingehängt in den Mittelblock von `plugins/singleton.ts`. Der Block ist nach Titel sortiert, „FAQ“ steht also zwischen „Abteilungen“ und „Gruppen“. `faq` kommt in `isExcludedDefaultListItem`, damit es nicht doppelt erscheint.

### Presentation-Tool

- Die Abteilungsseite liest die FAQ über `sanityFetch` (siehe unten). Im Presentation-Tool erscheinen Entwürfe deshalb live, und ein Klick auf Frage oder Antwort öffnet die FAQ.
- `LOCATION_QUERIES` bekommt einen Eintrag `faq`: die Seiten aller zugeordneten Abteilungen mit Slug (`/angebot/<slug>`, Titel der Abteilung). Eine FAQ ohne Abteilung mit Slug zeigt keinen Ort.

## Website

### Abfrage

`departmentPageQuery` bekommt ein Feld `faqs`:

```groq
"faqs": *[_type == 'faq' && ^._id in departments[]._ref] | order(sortOrder asc, question asc) {
  _id,
  question,
  "answer": coalesce(answer[] { ..., ${markDefsWithLinks} }, []),
  "answerText": pt::text(answer),
  "isMarkedUp": departments[0]._ref == ^._id,
}
```

- `isMarkedUp` ist wahr, wenn diese Abteilung die erste der Frage ist; nur dann kommt die Frage in das JSON-LD dieser Seite.
- Der Filter prüft das Feld `departments`, nicht `references(^._id)`: Eine Antwort, die per `internalLink` auf die Abteilung verlinkt, verweist auch auf sie (Anti-Ziel).
- Die FAQ kommen mit der Abteilung in einer Abfrage, wie deren Gruppen. Damit liest die Seite keine zusätzliche Abfrage, und Abschnitt und JSON-LD lesen garantiert dieselben Daten.

### Seite

`apps/web/src/app/angebot/[group]/page.tsx` rendert zwischen `Stats` und `ContactPersons`:

- den neuen Abschnitt `Faq` (`apps/web/src/app/angebot/[group]/_sections/faq.tsx`) und
- `JsonLd` mit `getFaqPageSchema(...)`,

beides nur, wenn es mindestens eine FAQ gibt (das JSON-LD zusätzlich nur, wenn `getFaqPageSchema` einen Knoten liefert). Das JSON-LD bekommt eine per `stegaClean` bereinigte Kopie der FAQ, der Abschnitt die Daten mit Stega, damit die Klick-zum-Bearbeiten-Overlays bleiben (wie bei `getGroupSchema` auf der Gruppenseite).

### Abschnitt `Faq`

- `SectionHeader` wie in `_sections/groups.tsx`: Titel, dahinter der Abteilungsname in `text-primary`, Untertitel, Intro.
- Fehlt `faqSection` im Dokument (auf `production`, bis die Redaktion es füllt), gelten Titel „Häufige Fragen“ und Untertitel „FAQ“ ohne Intro.
- Darunter ein Accordion, ein Eintrag pro Frage. Die Frage ist der Auslöser und steht in einer Überschrift (`h3`, unter dem `h2` des `SectionHeader`), die Antwort ist das Panel und wird mit `PortableText` gerendert.
- Mehrere Einträge dürfen gleichzeitig offen sein, anfangs ist keiner offen.

### Accordion

Neu: `apps/web/src/components/ui/accordion.tsx`, ein Shadcn-Wrapper um `@base-ui/react/accordion` (`Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`). Startpunkt ist die Komponente aus `shadcn add accordion` (Stil `base-lyra`), deren Klassen auf die Gestaltung dieser Website umgeschrieben werden.

- Das Panel wird mit `hiddenUntilFound` gerendert: Die Antwort steht zugeklappt im HTML. React kennt `hidden` nur als An/Aus, deshalb liefert der Server `hidden=""`, und Base UI setzt nach der Hydration `hidden="until-found"` (`useCollapsiblePanel`, React-Issue 24740). Ab dann klappt die Browsersuche einen Treffer auf. Crawler lesen den Text in beiden Fällen, damit sind Anti-Ziel und Crawler-Anforderung erfüllt. Tests erwarten `until-found` deshalb erst nach der Hydration, nie im Server-HTML. (Eigene Entscheidung: Browsersuche erst nach der Hydration genügt; Base UIs Panel bleibt.)
- Auf- und Zuklappen über `transition-*` mit `data-starting-style:` / `data-ending-style:` (Root-`AGENTS.md`), mit `motion-reduce:` ohne Animation.

### JSON-LD

`getFaqPageSchema` in `apps/web/src/utils/structured-data.ts`:

```ts
getFaqPageSchema({ baseUrl, path, faqs }): WithContext<FAQPage> | undefined
```

- `@type: 'FAQPage'`, `inLanguage: 'de-DE'`, `url: ${baseUrl}${path}`.
- `mainEntity`: pro FAQ ein `Question` mit `name` = Frage und `acceptedAnswer` = `Answer` mit `text` = `answerText`.
- FAQ ohne `isMarkedUp`, ohne Frage oder mit leerem `answerText` fallen heraus. Bleibt keine übrig, liefert die Funktion `undefined`, und die Seite rendert kein `JsonLd`.

Das JSON-LD zeichnet also eine Teilmenge der sichtbaren FAQ aus: die, deren erste Abteilung diese ist. Eine Seite, deren FAQ alle zuerst einer anderen Abteilung gehören, zeigt den Abschnitt ohne `FAQPage`. Eine FAQ ohne Frage oder Antwort (nur als Entwurf möglich, die Felder sind Pflicht) blendet auch der Abschnitt aus, damit die Auszeichnung nie eine Frage enthält, die die Seite nicht zeigt.

### Revalidierung

In `REVALIDATION_MAP`: `faq` revalidiert `/angebot/[group]` (`revalidatePath('/angebot/[group]', 'page')`). Eine Frage kann mehreren Abteilungen gehören, und die frühere Zuordnung steht nicht im Payload. Die Überschrift in `groupsPage` ist schon abgedeckt.

`faq` kommt in die Filterliste in `docs/SANITY_WEBHOOK_SETUP.md` und in den Filter **beider** Webhooks. Staging wird nach dem Merge umgestellt, Production mit dem Rollout von WEB-384, der ohnehin den Filter dieser Liste setzt; geht WEB-334 erst danach live, braucht der Production-Webhook eine eigene Umstellung. Die Webhooks liegen in Sanity, nicht im Repository; jede Änderung daran braucht vorher das OK des Nutzers.

## Testdaten

Auf `development` (nie auf `production`):

- `groupsPage.content.faqSection` mit Titel „Häufige Fragen“, Untertitel „FAQ“ und einem kurzen Intro.
- Vier Platzhalter-FAQ, als Platzhalter erkennbar formuliert: eine allen Abteilungen zugeordnet, `department-fussball` zuerst (Mitgliedsbeitrag, mit internem Link auf die Seite „Mitgliedschaft“), drei nur `department-fussball` (Probetraining, Trainingszeiten mit Liste, Anfahrt mit externem Link).

Damit hat die Abteilungsseite, die die e2e-Suite ansteuert, mehrere FAQ und alle vier im JSON-LD, und jede andere Abteilung zeigt genau eine FAQ ohne `FAQPage`. Das Schreiben in den Datensatz braucht vorher das OK des Nutzers. Vorsicht: `apps/studio/.env` zeigt auf `production` (`SANITY_API_DATASET`), der Zieldatensatz `development` wird deshalb bei jedem Schreiben ausdrücklich angegeben.

## Tests

- **Studio:** `faq.test.ts` (Vorschau: Titel, bis drei Abteilungen, „+N“, keine Abteilung; `departments` verweist nur auf `department`). `structure/index.test.ts` für den neuen Eintrag und `isExcludedDefaultListItem`. `presentation.test.ts` für den Ort einer FAQ.
- **Web, `node`:** `getFaqPageSchema` (vollständiger Knoten, Filter ohne `isMarkedUp` sowie leerer Fragen und Antworten, `undefined` ohne FAQ). Der Revalidierungstest für `faq`. `page.test.ts` der Abteilungsseite: Abschnitt und JSON-LD mit FAQ, keiner von beiden ohne, eine geteilte Frage einer anderen ersten Abteilung sichtbar, aber nicht im JSON-LD, das JSON-LD ohne Stega-Zeichen.
- **Web, `dom`:** `faq.test.tsx` (Überschrift mit Abteilung, Fallback-Überschrift, Fragen als Buttons mit `aria-expanded`, Antwort nach Klick sichtbar, Link in der Antwort). `accordion.test.tsx` für den Wrapper.
- **e2e:** Fixtures aus `development` neu aufnehmen. In `offers.spec.ts` oder einer neuen Spec auf `/angebot/fussball`: Frage aufklappen, Antwort sichtbar. In `structured-data.spec.ts`: unter den JSON-LD-Skripten auf `/angebot/fussball` (dort steht schon die `BreadcrumbList`) eines vom Typ `FAQPage`. Die Accessibility-Sweep muss ohne neuen Baseline-Eintrag grün bleiben. Die Visual-Baseline der Abteilungsseite wird im Playwright-Container neu erzeugt (`pnpm --filter web run test:e2e:visual:update`) und im selben Commit abgelegt.
- Coverage-Schwellen bleiben mindestens, wo sie sind.

## Dokumentation

- `apps/web/AGENTS.md`, Abschnitt „Structured data“: `getFaqPageSchema` und warum die Antworten per `hiddenUntilFound` im HTML stehen. Abschnitt zur Revalidierung: `faq`.
- `apps/studio/AGENTS.md`, Abschnitt „Departments and groups“: der Typ `faq` und seine Zuordnung über `departments`; im Abschnitt zum Presentation-Tool der neue Ort.
- `docs/SANITY_WEBHOOK_SETUP.md`: Filterliste um `faq` ergänzen.

## Eigene Entscheidungen (zur Prüfung)

- Feldnamen, Icon, Zeichenlimit 120 der Frage, Fallback-Überschrift „Häufige Fragen“ / „FAQ“.
- `answer` als Block-Array direkt am Dokument statt `blockContent`/`simpleBlockContent`; ohne Überschriften und Zitat.
- `departments` mit `disableNew` und ohne doppelte Einträge; Vorschau mit drei Abteilungen und „+N“.
- `sortOrder` als Pflichtfeld, eine Reihenfolge für alle Seiten der Frage.
- Desk-Eintrag „FAQ“ auf oberster Ebene, alphabetisch eingereiht wie die übrigen Einträge.
- FAQ als Feld in `departmentPageQuery` statt einer eigenen Abfrage; Filter über `departments` statt `references()`.
- `faq` in `LOCATION_QUERIES`.
- Accordion mit `hiddenUntilFound`, mehrere Einträge gleichzeitig offen; die Browsersuche öffnet Antworten erst nach der Hydration.
- Inhalt und Umfang der Platzhalter-FAQ.
