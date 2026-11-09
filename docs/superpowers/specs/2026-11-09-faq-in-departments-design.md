# FAQ in der Abteilung zuordnen und sortieren — Design-Spec

Datum: 2026-11-09 · Status: Entwurf · Ticket: [WEB-431](https://linear.app/tsg-irlich/issue/WEB-431/faq-in-der-abteilung-zuordnen-und-sortieren) · Baut auf [WEB-334](https://linear.app/tsg-irlich/issue/WEB-334/geo-faq-bereich-mit-faqpage-json-ld) auf (`docs/superpowers/specs/2026-10-25-web-334-faq-design.md`)

Scope: Die Zuordnung der FAQ zu den Abteilungen wandert von der Frage in die Abteilung. Dort ist sie eine sortierbare Liste, deren Reihenfolge nur für diese Abteilung gilt.

## Warum

Der Nutzer wollte in einer Abteilung eine vorhandene Frage dazuholen und sie dort an eine bestimmte Stelle setzen. Beides geht heute nicht:

- Die Zuordnung steht nur an der Frage (Feld „Abteilungen“). In der Abteilung sieht man nicht, welche Fragen sie zeigt.
- Die Reihenfolge ist eine Zahl („Sortierreihenfolge“) an der Frage und gilt auf allen Abteilungsseiten gleich. Eine geteilte Frage wie „Mitgliedsbeitrag“ kann nicht bei Fußball oben und bei Tanzen unten stehen.

Gewünscht ist, die Reihenfolge am Einsatzort festzulegen, ohne Zahlen, per Drag & Drop. Als Vorbild nannte der Nutzer die Statistiken in der Abteilung (Screenshot: Liste mit Griffen „Ziehen, um neu zu ordnen“ und „Element hinzufügen“ darunter). Einsatzort sind derzeit nur die Abteilungsseiten.

## Ausgangslage

- `faq` (`apps/studio/schemas/documents/faq.ts`): `question`, `answer` (Rich Text), `departments` (Verweise auf `department`, mindestens einer, `disableNew`), `sortOrder` (Pflicht). Vorschau: Frage plus die ersten drei Abteilungstitel (`prepareFaqPreview`). Sortierungen nach `sortOrder`.
- `department` (`apps/studio/schemas/documents/department.ts`): Tab „Inhalt“ hält `intro`, `stats` (eingebettete Objekte, sortierbar) und `contactPersons` (Verweise auf `person`, sortierbar, „Die Reihenfolge hier ist die Reihenfolge auf der Abteilungsseite“, `Rule.unique()`). `contactPersons` ist das technische Vorbild für das neue Feld: eine sortierbare Liste von Verweisen auf Dokumente, die woanders gepflegt werden.
- Desk: Eintrag „FAQ“ (`getGroupFaq` in `apps/studio/structure/index.ts`), sortiert nach `sortOrder`.
- Presentation: `LOCATION_QUERIES.faq` in `apps/studio/plugins/presentation.ts` liefert die Seiten der Abteilungen aus `departments`.
- Website:
  - `departmentPageQuery` (`apps/web/src/lib/sanity/queries/departments.ts`) holt `*[_type == 'faq' && ^._id in departments[]._ref] | order(sortOrder asc, question asc)` und berechnet `isMarkedUp` als `departments[0]._ref == ^._id`.
  - `getFaqPageSchema` (`apps/web/src/utils/structured-data.ts`) zeichnet nur Fragen mit `isMarkedUp` aus; `isCompleteFaq` (`apps/web/src/utils/faq.ts`) lässt unvollständige weg.
  - Suche: `searchCandidatesQuery` (`apps/web/src/lib/sanity/queries/search.ts`) gibt einer FAQ `"targets": departments[]-> {…}`; `mergePageHits` (`apps/web/src/lib/search/merge.ts`) macht daraus Treffer auf diesen Abteilungen.
  - Revalidierung: `faq` revalidiert alle Abteilungsseiten, `department` die ganzen Angebotsrouten (`apps/web/src/app/api/revalidate/route.ts`). Daran ändert sich nichts.
- Daten (Stand 2026-11-09):
  - `production`: keine veröffentlichte FAQ. 22 Entwürfe `drafts.faq-*` aus WEB-417, 20 mit je einer Abteilung, `faq-mitgliedsbeitrag` und `faq-mehrere-abteilungen` mit allen sechs. Jede der sechs Abteilungen existiert veröffentlicht und als Entwurf (`drafts.department-<slug>`, ebenfalls WEB-417). Der Nutzer prüft diese Entwürfe gerade und veröffentlicht sie danach; das kann vor oder nach dem Release dieser Änderung passieren.
  - `development`: keine FAQ.
- Die e2e-Fixtures enthalten FAQ-Ergebnisse von `departmentPageQuery` und `searchCandidatesQuery`. Sie sind nach der Abfrage verschlüsselt; eine geänderte Abfrage verwaist ihre Fixture.
- Sanity 6.22 bringt `defineIncomingReferenceDecoration` (`sanity/structure`, `@beta`) mit: eine Anzeige der eingehenden Verweise im Formular eines Dokuments.

## Entscheidungen

Vom Nutzer am 2026-11-09 entschieden:

| Frage | Entscheidung |
| --- | --- |
| Wo wird zugeordnet? | Nur noch in der Abteilung. Die Frage zeigt nur noch an, wo sie verwendet wird. |
| Wo wird sortiert? | In der Abteilung, per Drag & Drop, ohne Zahlen. Die Reihenfolge gilt nur für diese Abteilung. |
| Neue Frage aus der Abteilung anlegen | Ja, über dasselbe Feld. |
| Frage ohne Abteilung | Bekommt eine Warnung, weil sie nirgends erscheint. |
| Gesamtliste „FAQ“ im Desk | Alphabetisch nach Frage. Sie gehört zu keiner Seite und muss nicht von Hand sortierbar sein. |
| Verweisart | Fest (strong), wie bei den Ansprechpartnern. Eine neue Frage wird vor ihrer Abteilung veröffentlicht oder zusammen mit ihr in einem Release. Eine Frage, die noch in einer Abteilung steckt, lässt sich nicht löschen. Ein loser Verweis wurde verworfen, weil eine gelöschte Frage dann ohne Hinweis von der Seite verschwände. |

Als meine Entscheidung festgehalten (die ersten beiden hat der Nutzer gelesen und nicht widersprochen, die Regeln der Migration stehen unten):

- Eine Frage, die in mehreren Abteilungen steckt, wird im `FAQPage`-JSON-LD nur auf **einer** Seite ausgezeichnet: der Abteilung, die unter `/angebot` zuerst kommt (kleinste `sortOrder` der Abteilung). Sichtbar bleibt sie auf allen. Heute entscheidet der erste Eintrag in `faq.departments`; den gibt es nicht mehr. Die Redaktion muss dafür nichts tun.
- Der Untertitel in der FAQ-Liste zeigt den Anfang der Antwort statt der Abteilungen, weil eine Listenvorschau keine eingehenden Verweise lesen kann.

## Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**

- In der Abteilung, Tab „Inhalt“, ein Feld „FAQ“: vorhandene Fragen auswählen, neue anlegen, per Drag & Drop sortieren, entfernen. Die Reihenfolge dort ist die Reihenfolge auf genau dieser Abteilungsseite.
- Die Frage zeigt in ihrem Formular, in welchen Abteilungen sie steckt, mit Link dorthin.
- Eine Frage, die in keiner Abteilung steckt, zeigt eine Warnung.
- Website, Suche, Vorschau und JSON-LD lesen die Zuordnung aus der Abteilung und verhalten sich sonst wie bisher.
- Die 22 FAQ-Entwürfe in `production` landen mit ihrer bisherigen Zuordnung und Reihenfolge in den Abteilungen, ohne dass der Nutzer etwas neu zuordnen muss.

**Nicht-Ziele**

- FAQ an anderen Einsatzorten (Gruppen, `/angebot`, andere Seiten). Das Modell soll das später nicht verbauen, gebaut wird es jetzt nicht.
- Eine von Hand sortierbare Gesamtliste aller Fragen im Desk.
- Änderungen an Abschnitt, Accordion oder Überschrift (`groupsPage.content.faqSection`) der Website.

**Anti-Ziele** (wäre ein Fehlschlag, auch wenn es technisch läuft)

- Zwei Stellen, an denen dieselbe Zuordnung bearbeitet werden kann.
- Eine Zahl, die die Redaktion pflegen muss, um die Reihenfolge festzulegen.
- Eine FAQ-Zuordnung oder -Reihenfolge, die durch die Migration verloren geht oder sich ändert.
- Eine Frage erscheint auf der Live-Website, die vorher nicht dort war, oder verschwindet von ihr, nur weil migriert wurde.
- Dieselbe Frage im `FAQPage`-JSON-LD mehrerer Seiten (wie bisher, siehe WEB-334).
- Eine Frage lässt sich löschen, während eine Abteilung sie noch führt.
- Das Veröffentlichen einer Abteilung scheitert an einer unveröffentlichten Frage, ohne dass die Redaktion vorher im Formular sieht, warum.

## Studio

### `department`

Neues Feld im Tab „Inhalt“, zwischen `stats` und `contactPersons` (die Reihenfolge auf der Seite ist Stats › FAQ › Ansprechpartner):

| Feld | Typ | Titel | Regeln |
| --- | --- | --- | --- |
| `faqs` | `array` aus `reference` auf `faq` | FAQ | Optional. Feste Verweise (kein `weak`). Keine Frage doppelt (`Rule.unique()`). „Neu erstellen“ bleibt erlaubt. |

Beschreibung sinngemäß: „Optional. Die Reihenfolge hier ist die Reihenfolge auf der Abteilungsseite. Eine Frage kann in mehreren Abteilungen stehen und wird nur einmal gepflegt. Eine neue Frage zuerst veröffentlichen, dann die Abteilung.“

Wie das Studio mit einer noch unveröffentlichten Frage umgeht (in Sanity 6.22 nachgesehen): Ein Verweis auf einen reinen Entwurf steht im Entwurf der Abteilung als `_weak: true` mit `_strengthenOnPublish: { type: 'faq' }`. Das Veröffentlichen der **Abteilung** macht ihn fest (`strengthenOnPublish` in der Publish-Operation, `datastores-*.js`) und scheitert, solange die Frage nicht veröffentlicht ist. Das Veröffentlichen der Frage fasst die Abteilung nicht an. Die Redaktion muss im Formular der Abteilung sehen, welche Frage noch unveröffentlicht ist, bevor sie auf „Veröffentlichen“ klickt.

### `faq`

- `departments` und `sortOrder` fallen weg.
- Neu im Formular: „Verwendet in“, die Abteilungen, deren `faqs` die Frage enthalten. Nur Anzeige; zugeordnet wird in der Abteilung. Naheliegend ist `defineIncomingReferenceDecoration` mit `types: [{ type: 'department' }]`, ohne `onLinkDocument` und mit `creationAllowed: false`. Die API ist `@beta`; ob sie trägt oder eine kleine eigene Komponente nötig ist, entscheidet der Builder.
- Warnung, solange keine Abteilung die Frage in `faqs` führt: sinngemäß „Diese Frage steht in keiner Abteilung und erscheint deshalb nirgends auf der Website. Zuordnen lässt sie sich in der Abteilung, Tab „Inhalt“.“ Als Warnung, nicht als Fehler, damit eine Frage auch vor der Zuordnung veröffentlicht werden kann. Ein Entwurf einer Abteilung zählt als Zuordnung.
- Vorschau: Titel die Frage, Untertitel der Anfang der Antwort als Text.
- Sortierungen: nach Frage auf- und absteigend statt nach `sortOrder`.

### Desk und Vorschau

- `getGroupFaq`: Standardsortierung nach `question` aufsteigend; der JSDoc „ordered like on the department pages“ stimmt dann nicht mehr.
- `LOCATION_QUERIES.faq`: die Abteilungen, deren `faqs` die Frage enthalten, mit Slug, nach `sortOrder` der Abteilung.

## Website

- `departmentPageQuery`: `"faqs": faqs[]-> {…}` in der Reihenfolge der Abteilung, mit denselben Feldern wie heute (`_id`, `question`, `answer`, `answerText`, `isMarkedUp`). Ein Verweis, der in der aktuellen Perspektive ins Leere zeigt (die Frage ist noch nicht veröffentlicht), fällt heraus.
- `isMarkedUp`: wahr, wenn diese Abteilung unter allen Abteilungen, deren `faqs` die Frage enthalten, die kleinste `sortOrder` hat (bei Gleichstand entscheidet die `_id`). Muss in der Perspektive der Seite gerechnet werden, damit Vorschau und Live-Seite dieselbe Abteilung wählen wie die jeweils sichtbaren Daten.
- `searchCandidatesQuery`: `targets` einer FAQ sind die Abteilungen, deren `faqs` sie enthalten.
- Der Abschnitt, `getFaqPageSchema`, `isCompleteFaq` und die Revalidierung bleiben, wie sie sind.
- Den Kommentar über `departmentPageQuery` neu schreiben: Der Grund gegen `references()` (eine Antwort, die auf die Abteilung verlinkt) gilt für die Richtung Abteilung → Frage nicht mehr. Für die Gegenrichtung (welche Abteilungen führen diese Frage) wird `faqs[]._ref` geprüft, nicht `references()`, damit nur `faqs` zählt.

## Migration

Neue Migration(en) in `apps/studio/migrations/`, mit Test für die reinen Teile, wie die vorhandenen.

**Regel.** Für jede Abteilung entsteht `faqs` aus den Fragen, deren `departments` sie enthalten, geordnet nach der bisherigen `sortOrder` der Frage, bei Gleichstand nach `question` (wie die heutige Abfrage). Danach verlieren alle FAQ `departments` und `sortOrder`.

**Randbedingungen**

- **Veröffentlichte Abteilung:** Ihre Liste entsteht nur aus veröffentlichten Fragen, mit deren veröffentlichter Zuordnung und `sortOrder`, als feste Verweise. So ändert sich die Live-Website durch die Migration nicht, auch wenn ein Fragen-Entwurf inzwischen anders zugeordnet ist.
- **Entwurf einer Abteilung:** Seine Liste entsteht aus der neuesten Fassung jeder Frage (Entwurf, sonst veröffentlicht). Ein Verweis auf eine Frage ohne veröffentlichte Fassung steht so darin, wie das Studio ihn selbst anlegt: `_weak: true` mit `_strengthenOnPublish: { type: 'faq' }`.
- Ist eine unveröffentlichte Frage oder eine abweichend zugeordnete Frage einer Abteilung zugeordnet, die keinen Entwurf hat, legt die Migration den Entwurf an (veröffentlichte Fassung plus `faqs`). Sonst ginge die Zuordnung verloren. Mit den heutigen Daten kommt das nicht vor, weil jede Abteilung einen Entwurf hat.
- Die Felder der FAQ dürfen erst verschwinden, wenn alle Abteilungen geschrieben sind. Eine Migration, die beides in einem Lauf macht, darf nicht davon abhängen, in welcher Reihenfolge die Dokumente bearbeitet werden. Zwei Migrationen hintereinander sind der einfache Weg.
- Ein zweiter Lauf ändert nichts (eine Abteilung, die schon `faqs` hat, bleibt, wie sie ist).
- Läuft auf `development` (keine FAQ, praktisch ein Leerlauf) und auf `production`. `production` gehört zum Release `next` → `main` und kommt auf dessen Checkliste (work state `release-next-to-main-2026-10`). Hat der Nutzer bis dahin FAQ veröffentlicht, gilt dieselbe Regel; nichts darf von der Live-Website verschwinden.

**Erwartetes Ergebnis auf `production`** mit den heutigen Daten: Die veröffentlichten Abteilungen bleiben ohne FAQ, weil keine Frage veröffentlicht ist. Jeder Abteilungsentwurf führt seine drei oder vier eigenen Fragen in der Reihenfolge ihrer bisherigen `sortOrder`, danach „Mitgliedsbeitrag“ und „Mehrere Abteilungen“. Beide geteilten Fragen werden künftig auf der Fußball-Seite ausgezeichnet; „Mehrere Abteilungen“ wurde bisher bei „Weitere Sportarten“ ausgezeichnet.

**Veröffentlichen der WEB-417-Entwürfe danach:** erst die 22 Fragen, dann die sechs Abteilungen (oder alles in einem Release). Gehört als Hinweis auf die Release-Checkliste.

## Tests und Doku

- Studio: Tests für das neue Feld in `department.test.ts`, die geänderte Vorschau und die Warnung in `faq.test.ts`, die Sortierung in `structure/index.test.ts`, `LOCATION_QUERIES.faq` in `plugins/presentation.test.ts`, die reinen Teile der Migration. Die Coverage-Schwellen bleiben mindestens, wo sie sind.
- Web: Die Tests zu `departmentPageQuery`, Suche und JSON-LD an das neue Feld anpassen. Die e2e-Fixtures der beiden geänderten Abfragen neu verschlüsseln statt neu aufnehmen; ihr Ergebnis hat dieselbe Form. `structured-data.spec.ts` erwartet weiterhin vier ausgezeichnete Fragen auf `/angebot/fussball` (Fixture prüfen, falls sie geteilte Fragen enthält).
- `pnpm run extract-types && pnpm run typegen:sanity`.
- Doku: Abschnitt „FAQ“ in `apps/studio/AGENTS.md` (Zuordnung, Reihenfolge, Warnung, Auszeichnungsregel, Desk), `LOCATION_QUERIES` dort und in `apps/web/AGENTS.md` (`getFaqPageSchema`, Suche).

## Dem Builder überlassen

- Ob „Verwendet in“ über `defineIncomingReferenceDecoration` oder eine eigene Komponente läuft.
- Wie die Warnung die Abteilungen abfragt (`context.getClient` in einer `Rule.custom`), solange Entwürfe mitzählen.
- Ob die Migration als eine oder zwei Migrationen kommt, solange die Randbedingungen oben halten.
- Wie die Redaktion eine unveröffentlichte Frage in der Abteilung erkennt: Reicht die Anzeige, die Sanitys Verweis-Eingabe für einen Entwurf ohne veröffentlichte Fassung schon zeigt, bleibt es dabei, sonst eine Warnung am Feld `faqs`.
- Name und ID der Migration(en), die genaue GROQ-Formulierung.
