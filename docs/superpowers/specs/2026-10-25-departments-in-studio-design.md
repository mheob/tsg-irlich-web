# Abteilungen und Gruppen redaktionell pflegbar — Design-Spec

Datum: 2026-10-25 · Status: entschieden, noch nicht umgesetzt · Ticket: [WEB-384](https://linear.app/tsg-irlich/issue/WEB-384/abteilungen-und-gruppen-im-studio-pflegbar) · Folge: [WEB-385](https://linear.app/tsg-irlich/issue/WEB-385/gruppen-kachel-hero-und-open-graph-bild-getrennt-pflegbar) (Bilder der Gruppen) · Verwandt: [WEB-334](https://linear.app/tsg-irlich/issue/WEB-334/geo-faq-bereich-mit-faqpage-json-ld) (FAQ, baut hierauf auf), [WEB-187](https://linear.app/tsg-irlich/issue/WEB-187) (Sortierung der Ansprechpartner), [WEB-324](https://linear.app/tsg-irlich/issue/WEB-324/seo-und-geo-optimierung-strukturierte-daten-json-ld-und-metadaten) (SEO/GEO)

Scope: die Abteilungen werden Sanity-Dokumente, die sechs Gruppentypen werden einer, der Bereich „Administration“ entfällt. Dazu die Migration der Bestandsdaten und alles auf der Website, was heute die Abteilungen aus dem Code liest.

## Warum

Die Redaktion soll ihre Abteilungen selbst pflegen, ohne Entwickler und ohne Deployment. Zuletzt ließ sich ein Bild einer Abteilung nicht im Studio tauschen, und die Redaktion möchte die Stats jeder Abteilung einzeln steuern. Ziel ist, so viel wie möglich redaktionell zu machen: Eine neue Abteilung anzulegen soll ebenso ohne Code gehen wie ein Bildtausch.

Nebeneffekt für SEO und GEO (WEB-324): Heute teilen sich alle sechs Abteilungsseiten Meta-Beschreibung und Texte.

## Ausgangslage

### Abteilungen im Code

Die Abteilungen sind keine Dokumente. Sie stehen an zwei Stellen fest im Code und werden in rund 20 Dateien gelesen:

- `apps/web/src/utils/groups.ts`: `groupSections` mit Typname, Titel, Slug, DOSB-Icon, Kachelbild und Hero-Bild. Die Bilder sind statische Dateien unter `apps/web/src/images/angebot/groups/` (Kachel), `…/groups/hero/` (Hero) und `apps/web/public/og/angebot/groups/` (Open Graph, 1200 × 630).
- `apps/studio/constants/departments.ts`: `DEPARTMENTS` mit Slug, Titel und Typname, zusätzlich `group.admin`.

Leser von `groupSections` bzw. der festen Typlisten auf der Website:

- Seiten und Abschnitte: `app/angebot/[group]/page.tsx`, `app/angebot/[group]/[singleGroup]/page.tsx`, `app/angebot/_sections/groups.tsx`, `app/_home/groups.tsx`, `components/ui/group-card.tsx`
- Sonstiges: `app/sitemap.ts`, `app/llms.txt/route.ts`, `app/api/revalidate/route.ts`, `utils/links.ts`
- Abfragen: `lib/sanity/queries/{sitemap,llms}.ts` und `lib/sanity/queries/shared/groups.ts`. `groupsQuery` dort wird nirgends benutzt. Dazu filtern `lib/sanity/queries/pages/offer-groups.ts` und `offer-groups-group.ts` (einschließlich der News-Abfrage der Gruppenseite) per `_type == $groupType`, und `app/angebot/[group]/_sections/groups.tsx` liest den Typ `GroupSection`.
- Die Kacheln auf `/angebot` zeigen das Kachelbild, die Kacheln der Startseite (`app/_home/group-card.tsx`) nur Icon, Nummer und Titel.

Im Studio: `structure/index.ts`, `schemas/objects/internal-link.ts`, `schemas/documents/person.ts`.

### Gruppen

- Sieben Dokumenttypen aus `getGroupDocument` (`apps/studio/utils/documents/group.tsx`): `group.soccer`, `group.children-gymnastics`, `group.courses`, `group.taekwondo`, `group.dance`, `group.other-sports` und `group.admin` (`isSportGroup: false`).
- Die Abteilung einer Gruppe ergibt sich aus ihrem Typ. Davon leiten sich URL (`/angebot/<abteilung>/<gruppe>`), Revalidierung und `getInternalHref` ab.
- Auf `production` (Stand 25.10.2026): 11 Fußball, 4 Kinderturnen, 4 Kurse, 3 Taekwondo, 4 Tanzen, 6 Weitere Sportarten, 2 Administration (Vorstand, PR-Team), dazu 1 Entwurf.
- Verweise auf Gruppen kommen von `person` (Zuordnung `team`) und von 6 `news.article` (interne Links im Fließtext).

### Abteilungsseiten

- Alle sechs Seiten teilen sich das Dokument `groupsPage`. Daraus kommen:
  - Hero-Titel-Vorsatz „Bereich:“ und Untertitel „Wir bieten dir“
  - eine gemeinsame Meta-Beschreibung
  - die Überschriften der Abschnitte „Gruppen“ und „Ansprechpartner“
  - **gemeinsame Stats**: „Fußball-Teams“, „Breitensportgruppen“, „aktive Kinder / Jugendliche“, „aktive Sportler“
- Die Ansprechpartner findet die Seite über die Rollen-E-Mail der ersten Zuordnung einer Person: `fussball@tsg-irlich.de` für Fußball, `breitensport@tsg-irlich.de` für alle anderen (`apps/web/src/constants/query-fields.ts`).
- Das JSON-LD einer Gruppe ist ein `SportsTeam`, wenn ihr Typ `group.soccer` ist, sonst eine `SportsOrganization`.
- Abteilungs- und Gruppenseiten lesen über `client.fetch` und sind nicht im Presentation-Tool.

### Personen

- Eine Zuordnung (`affiliations[]`) hat drei Pflichtfelder:
  - `department`: String aus `DEPARTMENTS`
  - `team`: Verweis auf eine Gruppe, nach Abteilung gefiltert
  - `role`: Verweis auf `role`
- Die Ansprechpartner-Karten der Website lesen Rollentitel und Rollen-E-Mail aus `affiliations[0]`.
- 8 von 40 Personen haben Administration als erste Zuordnung, 6 davon ausschließlich. Das sind Vorsitz, Finanzen, Verwaltung, PR, Presse und die Abteilungsleitungen Fußball und Breitensport.

## Entscheidungen

Vom Nutzer am 25.10.2026 entschieden:

| Frage | Entscheidung |
| --- | --- |
| Ziel | So viel wie möglich redaktionell. Eine neue Abteilung entsteht im Studio, ohne Code. |
| Gruppen | Ein einziger Typ `group` mit Pflicht-Verweis auf seine Abteilung, statt sechs fester Typen |
| Bilder einer Abteilung | Kachelbild ist Pflicht. Hero-Bild optional, ohne fällt es auf das Kachelbild zurück. Open-Graph-Bild ebenso. |
| Stats | Pro Abteilung eigene |
| Ansprechpartner einer Abteilung | Geordnete Auswahl im Abteilungs-Dokument; der E-Mail-Abgleich entfällt |
| Administration | Entfällt samt ihren Gruppen (Vorstand, PR-Team) |
| Zuordnung einer Person | Abteilung und Gruppe werden optional, die Rolle bleibt Pflicht. Die Vorstandsleute behalten nur ihre Rolle. |
| `groupsPage` | Behält nur, was auf allen Abteilungsseiten gleich ist |
| URLs | Bleiben `/angebot/<abteilung>/<gruppe>`. Eine alte URL nach einer Slug-Änderung leitet dauerhaft weiter; das Studio merkt sich frühere Slugs selbst. |
| Vorschau | Abteilungs- und Gruppenseiten werden im Presentation-Tool vorschaufähig |
| Migration | Bestand aus Code und Datensatz übernehmen, IDs der Gruppen bleiben; erst `development`, dann `production` |
| FAQ | Bleibt WEB-334 und baut auf den Abteilungs-Dokumenten auf |
| Bilder der Gruppen | Aufteilung in Kachel-, Hero- und Open-Graph-Bild ist ein eigenes Ticket |

## Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**

- Titel, Slug, Icon, Reihenfolge, Bilder, Intro, Meta, Stats und Ansprechpartner einer Abteilung sind im Studio pflegbar und erscheinen nach dem Veröffentlichen auf der Website.
- Eine neu angelegte Abteilung mit Gruppen erscheint auf Startseite, `/angebot`, ihrer eigenen Seite, in Sitemap und `llms.txt`, ohne Code.
- Die Redaktion sieht Änderungen an Abteilung und Gruppe vor dem Veröffentlichen in der Vorschau.
- Nach der Migration sieht jede bestehende Seite aus wie vorher (bis auf das, was die Redaktion danach ändert).

**Nicht-Ziele**

- FAQ (WEB-334).
- Kachel-, Hero- und Open-Graph-Bild für Gruppen (eigenes Ticket).
- Sortierung der Ansprechpartner auf den **Gruppen**seiten (WEB-187).
- Neue Gestaltung der Abteilungs- oder Gruppenseiten.
- Seiten für Vorstand oder PR-Team.
- Die Breadcrumb nimmt weiter den aus dem Slug abgeleiteten Namen für die Abteilung („Fussball“).

**Anti-Ziele** (wäre ein Fehlschlag, auch wenn es technisch läuft)

- Eine bisher funktionierende URL liefert 404: eine Abteilung, eine Gruppe, ein interner Link aus einer News.
- `production` zeigt während der Umstellung leere oder kaputte Abteilungsseiten.
- Ein Verweis geht verloren: Person ↔ Gruppe, News-Link ↔ Gruppe, News-Kategorie einer Gruppe.
- Eine Ansprechpartner-Karte zeigt nach der Migration eine andere Rolle oder E-Mail als vorher.
- Die Redaktion kann eine Abteilung oder Gruppe so veröffentlichen, dass sie auf der Website ohne Bild, Icon oder URL erscheint.

## Studio

### Dokumenttyp `department` („Abteilung“)

Datei `apps/studio/schemas/documents/department.ts`. Icon nach Wahl des Umsetzers aus `react-icons/ri`.

| Feld | Typ | Titel | Regeln |
| --- | --- | --- | --- |
| `title` | `string` | Name | Pflicht, wie `title` der Gruppen |
| `slug` | `slug` | Slug | Pflicht, eindeutig unter den Abteilungen, Quelle `title` |
| `previousSlugs` | `array` aus `string` | Frühere Slugs | Wird automatisch gefüllt (siehe „Weiterleitungen“). Sichtbar; die Redaktion darf Einträge löschen und von Hand ergänzen. |
| `icon` | `string` | Icon | Pflicht, Liste aus `DOSB_ICONS` mit der Beschreibung aus `group.tsx` |
| `sortOrder` | `number` | Sortierreihenfolge | Pflicht. Reihenfolge auf Startseite und `/angebot`. |
| `isTeamSport` | `boolean` | Mannschaftssport | `initialValue: false`. Beschreibung: „Gruppen dieser Abteilung sind Mannschaften (im JSON-LD `SportsTeam`).“ |
| `cardImage` | `extendedImage` | Kachelbild | Pflicht. Für die Kacheln auf `/angebot` (die Startseite zeigt kein Bild) und als Rückfall für Hero und Open Graph. |
| `heroImage` | `extendedImage` | Hero-Bild | Optional. Ohne fällt die Seite auf das Kachelbild zurück. |
| `intro` | `text` | Intro | Optional. Ersetzt auf der Abteilungsseite das gemeinsame Intro des Abschnitts „Gruppen“. |
| `meta` | `metaField` | Meta | Wie bei den Gruppen. Das Open-Graph-Bild darin ist das Open-Graph-Bild der Abteilung; ohne gilt das Kachelbild. |
| `stats` | `array` aus `stats` | Stats | Optional. Leer bedeutet: kein Stats-Abschnitt. |
| `contactPersons` | `array` aus Verweis auf `person` | Ansprechpartner | Optional, geordnet, keine Dubletten. |

- Vorschau: Name, Untertitel „Sortierreihenfolge: N“, Medium das Kachelbild.
- Sortierungen wie bei den Gruppen (Name, Sortierreihenfolge).
- Löschen einer Abteilung, auf die noch Gruppen verweisen, verhindert Sanity von selbst (starker Verweis).

### Dokumenttyp `group` („Gruppe“)

Ersetzt alle sieben `group.*`-Typen. Datei `apps/studio/schemas/documents/group.ts`, gebaut aus `getGroupDocument` ohne `isSportGroup` (es gibt nur noch Sportgruppen).

- Neues Pflichtfeld `department` (Verweis auf `department`), ganz oben. Beschreibung: „Unter welcher Abteilung die Gruppe auf der Website erscheint.“
- `slug` eindeutig **innerhalb der Abteilung**: zwei Abteilungen dürfen je eine Gruppe „Herren“ haben.
- `previousPaths` („Frühere Adressen“), `array` aus `string` der Form `<abteilungs-slug>/<gruppen-slug>`. Wie `previousSlugs` der Abteilung, nur mit Pfad: Eine Gruppe kann per Verweis die Abteilung wechseln, und ihre alte URL soll trotzdem weiterleiten. Ein bloßer Slug reicht dafür nicht, weil Gruppen-Slugs nur je Abteilung eindeutig sind.
- Alle übrigen Felder unverändert. Die Bildfelder baut das Gruppen-Bilder-Ticket um.
- Das Sonderfeld-Verhalten „Schiedsrichter“ (Trainingszeiten ausgeblendet) bleibt.

### Personen

In `schemas/documents/person.ts`, `affiliations[]`:

- `department`: Verweis auf `department`, optional.
- `team`: Verweis auf `group`, optional. Gefiltert auf die Gruppen der gewählten Abteilung, ohne Abteilung alle Gruppen.
- `role`: unverändert Pflicht.
- Wählt die Redaktion eine andere Abteilung, passt eine schon gewählte Gruppe evtl. nicht mehr. Eine Validierung warnt dann: „Die Gruppe gehört nicht zur gewählten Abteilung.“

### `groupsPage`

Behält Hero-Titel-Vorsatz und Untertitel, Meta-Beschreibung (als Rückfall für Abteilungen ohne eigene) und die Abschnittsüberschriften „Gruppen“ (Titel, Untertitel, Intro als Rückfall) und „Ansprechpartner“. `content.stats` entfällt.

### Interne Links

`INTERNAL_LINK_TARGETS` in `schemas/objects/internal-link.ts`: die sechs `group.*` durch `department` und `group` ersetzen.

### Desk

- Neuer Eintrag „Abteilungen“: alle `department` nach `sortOrder`.
- „Gruppen“ bleibt, wie auf dem Screenshot vom 25.10.2026: links die Abteilungen, darin deren Gruppen. Die Liste der Abteilungen ist dynamisch (`department`-Dokumente nach `sortOrder`), die Gruppen darin per Filter auf `department._ref`. „Neu“ in einer Abteilung legt die Gruppe mit dieser Abteilung vorbelegt an (Initial-Value-Template).
- Administration und die `group.*`-Einträge verschwinden aus `structure/index.ts` (`getGroupGroups`, `isExcludedDefaultListItem`) und aus `schemas/index.ts`. `plugins/singleton.ts` ruft nur `getGroup` auf und bekommt höchstens den neuen Eintrag „Abteilungen“.
- `apps/studio/constants/departments.ts` entfällt.

### Weiterleitungen (Slug-Historie)

Wird eine veröffentlichte Abteilung mit geändertem Slug erneut veröffentlicht, landet der bisher veröffentlichte Slug in `previousSlugs`. Bei einer Gruppe landet der bisherige Pfad in `previousPaths`, wenn sich ihr Slug oder ihre Abteilung geändert hat. Doppelte Einträge und der aktuelle Wert werden nicht aufgenommen.

- Das übernimmt eine eigene Publish-Aktion, die die Standard-Aktion der beiden Typen umhüllt. Es passiert ohne Zutun der Redaktion.
- Vom Nutzer am 25.10.2026 entschieden: nur über den Button „Veröffentlichen“ im Studio. Wer über einen Release, zeitgesteuert oder per API veröffentlicht, wird nicht erfasst. Dafür darf die Redaktion Einträge in `previousSlugs` bzw. `previousPaths` von Hand ergänzen. Ein serverseitiger Weg (Sanity Function, Webhook mit `before()`/`after()`) ist verworfen.
- Die Beschreibung beider Felder sagt das: „Wird beim Veröffentlichen automatisch gefüllt. Nach einer Veröffentlichung über einen Release hier den alten Wert von Hand eintragen.“

## Website

### Daten

- Alle Stellen, die heute `groupSections`, `DEPARTMENTS`-Typlisten oder `getCurrentDepartment` lesen, lesen `department`- bzw. `group`-Dokumente.
- Entfallen: `utils/groups.ts` (außer dem Rückfallbild der Übersicht, falls noch gebraucht), `constants/query-fields.ts`, `queries/shared/groups.ts`, die statischen Bilder unter `src/images/angebot/groups/` und `public/og/angebot/groups/`.

### Abteilungsseite `/angebot/[group]`

- Lädt die Abteilung per Slug.
- Hero:
  - Bild: `heroImage`, sonst `cardImage`
  - Titel: Vorsatz aus `groupsPage` plus Abteilungsname
- Abschnitt „Gruppen“: die Gruppen mit `department._ref == <id>`, nach `sortOrder`. Intro ist das der Abteilung, sonst das aus `groupsPage`.
- Stats aus der Abteilung, ohne keine.
- Ansprechpartner: `contactPersons` der Abteilung in ihrer Reihenfolge.
  - Rolle und E-Mail kommen wie heute aus `affiliations[0]`, über das bestehende Fragment `contactPersons`. Eine Regel „Zuordnung zu dieser Abteilung zuerst“ würde z. B. bei einer Abteilungsleitung, die auch eine Mannschaft trainiert, die Trainerrolle statt der Leitungsrolle zeigen (Anti-Ziel).
- Metadaten:
  - Titel: `meta.metaTitle`, sonst „`<Name>` bei der TSG Irlich“
  - Beschreibung: `meta.metaDescription`, sonst die aus `groupsPage`
  - Open-Graph-Bild: `meta.openGraphImage`, sonst `cardImage`, je 1200 × 630 über `urlForImage`
- `generateStaticParams` aus den Abteilungen.

### Gruppenseite `/angebot/[group]/[singleGroup]`

- Lädt die Gruppe über Abteilungs-Slug und Gruppen-Slug.
- JSON-LD: `SportsTeam`, wenn die Abteilung `isTeamSport` ist, sonst `SportsOrganization`.
- Ansprechpartner wie heute über die Zuordnung `team`, nur per Verweis statt über den Slug: `affiliations[team._ref == <gruppen-id>]`.
- Sonst unverändert.

### Weiterleitungen

Findet eine der beiden Seiten keinen Treffer unter der aktuellen URL, gilt:

- Abteilungsseite: Abteilung mit dem Slug in `previousSlugs` → `permanentRedirect` auf ihre aktuelle URL.
- Gruppenseite, in dieser Reihenfolge:
  1. Die Abteilung über Slug oder `previousSlugs` finden, darin die Gruppe über ihren aktuellen Slug (nur der Abteilungs-Slug hat sich geändert).
  2. Eine Gruppe, deren `previousPaths` `<abteilung>/<gruppe>` aus der URL enthält (Slug oder Abteilung der Gruppe haben sich geändert).
  3. Wie 2, mit jedem früheren Slug der Abteilung aus der URL statt ihres aktuellen (beides hat sich geändert).
- Ein Treffer führt per `permanentRedirect` auf die aktuelle URL, sonst `notFound()`.

### Übersichten, Links, Sitemap, llms.txt

- Startseite und `/angebot`: Kacheln aus den Abteilungen nach `sortOrder`. `/angebot` zeigt Name, Icon, Kachelbild und Link; die Startseite wie heute ohne Bild.
- `getInternalHref` (`utils/links.ts`):
  - `department` → `/angebot/<slug>`
  - `group` → `/angebot/<abteilungs-slug>/<slug>`
  - `internalLinkTarget` projiziert dafür zusätzlich `"department": department->slug.current`.
- Sitemap: Abteilungen und Gruppen aus Sanity.
- `llms.txt`: Abteilungen aus Sanity, in ihrer Reihenfolge, mit Meta-Beschreibung.

### Vorschau

- Abteilungs- und Gruppenseiten lesen über `sanityFetch` (`apps/web/AGENTS.md`, „Fetching content from Sanity“), mit `stega: false` in `generateMetadata` und `generateStaticParams`.
- In `apps/studio/plugins/presentation.ts`:
  - `mainDocuments`-Routen für `/angebot/:group` und `/angebot/:group/:singleGroup`
  - `locations` für `department` und `group`

### Revalidierung

- `REVALIDATION_MAP`:
  - `department`: Startseite, `/angebot` samt allem darunter, Sitemap, `llms.txt`
  - `group`: `/angebot` samt allem darunter, Sitemap, `llms.txt`
  - `groupsPage`: die Abteilungsseiten (heute fehlt das)
  - Die `group.*`-Handler entfallen.
- Filter **beider** Webhooks (Production und Staging) und die Liste in `docs/SANITY_WEBHOOK_SETUP.md`:
  - `department`, `group` und `groupsPage` hinzufügen
  - die sechs `group.*` entfernen, erst nach der Migration auf `production`
- Die Webhooks liegen in Sanity. Jede Änderung daran braucht vorher das OK des Nutzers.

## Migration

Eine Sanity-Migration (`apps/studio/migrations/<id>/`, `apps/studio/AGENTS.md`, „Content migrations“), idempotent, mit Test ihrer reinen Teile:

1. **Abteilungen anlegen**, je eine aus `groupSections`:
   - Name, Slug, Icon, `sortOrder` in heutiger Reihenfolge, `isTeamSport` nur bei Fußball
   - Bilder aus den Repo-Dateien hochgeladen: Kachel → `cardImage`, Hero → `heroImage`, Open Graph → `meta.openGraphImage`
   - Stats: die heutigen gemeinsamen Stats aus `groupsPage`, in jede Abteilung kopiert. Die Seiten sehen danach aus wie vorher, und die Redaktion passt sie pro Abteilung an.
   - Ansprechpartner: die Personen, die heute per E-Mail-Abgleich erscheinen, in derselben Reihenfolge
2. **Gruppen umstellen:**
   - Jede `group.<x>` (veröffentlicht und Entwurf) wird ein neues `group`-Dokument mit der ID `group-<alte ID>` (Entwurf: `drafts.group-<alte ID>`) und Verweis auf ihre Abteilung. Inhalte und `_createdAt` bleiben.
   - Sanity ändert den `_type` einer ID nie, auch nicht durch Löschen und Neuanlegen in einer Transaktion. Die Probe auf `development` am 25.10.2026 wurde abgelehnt (`immutable attribute "_type" may not be modified`). Deshalb gibt es neue IDs.
   - Jeder Verweis auf eine alte ID wird auf die neue umgeschrieben, in jedem Dokument (Personen, News, alle übrigen, veröffentlicht und Entwurf) und an jeder Stelle des Dokuments. `_weak` und `_key` bleiben, ein ausstehendes `_strengthenOnPublish` nennt danach den Typ `group`. Bei Personen geschieht das im selben Patch wie Schritt 3.
   - Danach werden die alten Dokumente gelöscht, Entwürfe zuerst, sobald nichts mehr auf sie verweist. Eine Version in einem Release, die noch verweist, wird nicht angepasst, sondern gemeldet, und ihr Ziel bleibt stehen.
3. **Personen:**
   - `affiliations[].department` wird ein Verweis auf die Abteilung.
   - Zuordnungen mit `admin` verlieren `department` und `team` und behalten die Rolle.
4. **Administration löschen:** die zwei `group.admin`-Dokumente, erst nach Schritt 3.
5. `groupsPage.content.stats` entfernen.

Reihenfolge und Zeitpunkt:

- Erst `development` (e2e-Fixtures neu aufnehmen), dann `production`.
- Auf `production` darf es keine Phase geben, in der die ausgelieferte Website die Daten nicht lesen kann (Anti-Ziel). Wie Deployment, Migration und Webhooks dafür zusammenspielen, legt der Plan fest, z. B. eine Website-Version, die beide Formen liest, oder eine Migration unmittelbar nach dem Deployment bei pausierten Webhooks.
- Jeder Schreibzugriff auf einen Datensatz braucht vorher das OK des Nutzers.

## Tests

- **Studio:**
  - Vorschau und `Rule.custom`-Prädikate von `department`, `group` und der Personen-Zuordnung
  - Desk-Struktur
  - Slug-Historie (reine Funktion: alter Slug, neuer Slug, bisherige Liste → neue Liste)
  - Migration (reine Teile)
- **Web:**
  - `getInternalHref` für `department` und `group`
  - Weiterleitungsauflösung
  - Bildrückfälle (Hero, Open Graph)
  - Metadaten
  - Seiten-Tests beider Routen, Sitemap, `llms.txt`, Revalidierung
- **e2e:**
  - Fixtures aus `development` neu aufnehmen.
  - Accessibility-Sweep ohne neue Baseline-Einträge.
  - Visual-Regression: Die Kacheln auf `/angebot` und das Hero der Abteilungsseite kommen danach vom Sanity-CDN, das die e2e-Mocks mit transparenten PNGs beantworten. Die Baselines `offers.png` und `department.png` beider Browser-Projekte ändern sich deshalb und werden im Playwright-Container neu erzeugt (`pnpm --filter web run test:e2e:visual:update`), im selben Commit.
  - Eine Spec für eine Weiterleitung nach Slug-Änderung, falls sich das mit Fixtures abbilden lässt.
- Coverage-Schwellen bleiben mindestens, wo sie sind.

## Dokumentation

- `apps/web/AGENTS.md`:
  - „Internal links“ (Pfade für `department`/`group`)
  - „Structured data“ (`isTeamSport`)
  - Vorschau
  - Revalidierung
- `apps/studio/AGENTS.md`: Abteilungen, Gruppen, Slug-Historie, Desk.
- Root-`AGENTS.md`: „Content types“ (Abteilungen).
- `docs/SANITY_WEBHOOK_SETUP.md`: Filterliste.

## Ticket-Schnitt (Vorschlag)

1. **Abteilungen und Gruppen im Studio pflegbar** (dieses Dokument, Vorschau eingeschlossen): Datenmodell, Personen, Administration, Website, Weiterleitungen, Vorschau, Migration. Eine Einheit, weil Schema, Website und Migration nur zusammen ausgeliefert werden können. Die Vorschau gehört dazu, weil beide Seiten ohnehin neu auf die Abteilungs-Dokumente gebaut werden; als eigenes Ticket würden sie, ihre Tests und die Revalidierung zweimal umgebaut (erst `client.fetch`, dann `sanityFetch`). Mehrere PRs sind möglich.
2. **Gruppen: Kachel-, Hero- und Open-Graph-Bild** mit denselben Rückfällen wie bei den Abteilungen. Blockiert durch 1, weil 1 den Gruppentyp neu baut.
3. **WEB-334** (FAQ) wird blockiert durch 1. Die Spec `2026-10-25-web-334-faq-design.md` wird danach auf Verweise auf `department` umgeschrieben.
4. **WEB-187** bekommt einen Kommentar: Für die Abteilungsseiten löst 1 die Sortierung (geordnete Auswahl), offen bleiben die Gruppenseiten.

## Eigene Entscheidungen (zur Prüfung)

- Typnamen `department` / `group`, Feldnamen, `isTeamSport` als Feld der Abteilung statt Ableitung aus dem Typ.
- Intro der Abteilung ersetzt das gemeinsame Intro des Abschnitts „Gruppen“; `groupsPage` bleibt Rückfall für Intro und Meta-Beschreibung.
- Migration kopiert die heutigen gemeinsamen Stats in jede Abteilung.
- Gruppen-Slug eindeutig je Abteilung, nicht global.
- Ansprechpartner-Karte nimmt weiter `affiliations[0]`.
- Gruppen merken sich Pfade (`previousPaths`) statt Slugs.
- Vorschau Teil des Haupttickets.
