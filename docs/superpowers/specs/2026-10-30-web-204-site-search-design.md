# Website-Suche — Design-Spec

Datum: 2026-10-30 · Status: entschieden, noch nicht umgesetzt · Ticket: [WEB-204](https://linear.app/tsg-irlich/issue/WEB-204) · Verwandt: [WEB-384](https://linear.app/tsg-irlich/issue/WEB-384) (Abteilungen und Gruppen im Studio, Rollout auf `production` steht aus), [WEB-389](https://linear.app/tsg-irlich/issue/WEB-389) (Seitenbilder im Studio, liefert das `heroImage` der Singletons), [WEB-334](https://linear.app/tsg-irlich/issue/WEB-334) (FAQ)

Scope:

- Eine Volltextsuche über die Website: eine Lupe in der Navigation öffnet ein Such-Panel, und eine eigene Suchseite `/suche?q=…` zeigt alle Treffer.
- Dazu kommen ein neues Studio-Feld „Suchbegriffe“ an Abteilung und Gruppe und ein neues Singleton „Suche“ für alle Texte der Suchseite.
- Außerdem gehört dazu eine Liste „Häufig gesucht“, die sich aus echten Suchanfragen speist und von der Redaktion gesteuert werden kann.

Die Arbeit zerfällt in zwei Pakete, die nacheinander umgesetzt werden (siehe [Umsetzung in zwei Paketen](#umsetzung-in-zwei-paketen)).

## Warum

Besucher finden Inhalte heute nur über die Navigation. Gesucht wird typischerweise nach einer Sportart, einer Mannschaft, einem Spielbericht oder einer Ansprechperson. Die Suche soll genau das finden. Sie soll sich anfühlen wie der Rest der Website und ohne Cookie-Banner auskommen.

## Ausgangslage

### Bewertung im Ticket

Die Bewertung vom 30.10.2026 steht als Kommentar in WEB-204: Sanity-GROQ-Volltextsuche statt Algolia, serverseitig ausgeführt. Damit erreicht keine Besucher-IP einen Drittanbieter, und das Gerät speichert nichts. Ein Cookie-Banner ist dafür nicht nötig (TDDDG § 25). Algolia bleibt eine spätere Option, falls die Qualität nicht reicht. Die Suche bekommt deshalb eine Schnittstelle `searchSite(query)`, hinter der sich der Anbieter tauschen lässt.

### Was GROQ kann

Am Dataset `development` ausprobiert:

- `match` und `text::query()` (Phrasen, `-Ausschluss`, `präfix*`, Wörter per Default ODER-verknüpft), `score()` und `boost()` für die Gewichtung.
- Groß- und Kleinschreibung werden gefaltet, diakritische Zeichen nicht: „Fussball“ findet „Fußball“ nicht.
- Keine deutsche Stammformreduktion.
- Treffer, die nur über einen Platzhalter zustande kommen, bekommen alle denselben Score.
- Der News-Text liegt verschachtelt in `body[]`, in Abschnitten vom Typ `blockContent` mit einem Portable-Text-Feld `text`. In `score()` funktioniert der Pfad `body[].text[].children[].text match …`. `pt::text(body[_type == "blockContent"].text[])` funktioniert nur in einer Projektion; `score()` lehnt es ab („score() function received unexpected expression“).
- Mit Textsuche liefert „Gladbach“ 7 Artikel, davon 2 mit „Gladbach“ im Titel. Ohne Titel-Boost landet der Spielbericht nicht oben.

### Inhalte und Adressen

| Inhalt | Typ | Adresse |
| --- | --- | --- |
| News-Artikel | `news.article` | `/news/[category]/[slug]` |
| Abteilung | `department` | `/angebot/[group]` (Slug der Abteilung) |
| Gruppe | `group` | `/angebot/[group]/[singleGroup]` |
| TSG-Echo-Ausgabe | `echo.issue` | `/verein/echo/[slug]` |
| Startseite | `home` | `/` |
| Verein | `aboutUs` | `/verein` |
| Angebot | `departmentsPage` | `/angebot` |
| Mitgliedschaft | `membership` | `/mitgliedschaft` |
| Kontakt | `contact` | `/kontakt` |
| News-Übersicht | `newsOverview` | `/news` |
| Echo-Übersicht | `echoOverview` | `/verein/echo` |
| Impressum, Datenschutz, Barrierefreiheit | `imprint`, `privacy`, `accessibility` | `/impressum`, `/datenschutz`, `/barrierefreiheit` |

### Wo Personen aufgeführt sind

- **Abteilungsseite:** `department.contactPersons[]` (Referenzen).
- **Gruppenseite:** jede Person mit `affiliations[].team` auf die Gruppe (`groupContactPersonsQuery`).
- **Singletons** mit `content.contactPersonsSection.contactPersons[]`: `home`, `aboutUs`, `departmentsPage`, `membership`, `contact`, `newsOverview` (die Echo-Seiten zeigen dieselben Personen wie `newsOverview`), `newsOverviewCategory` (die Kategorieseiten `/news/[category]`).
- Rolle und Aufgabenbeschreibung hängen an der Zugehörigkeit (`affiliations[]`), eine Person kann mehrere haben. Abteilungs- und Singleton-Seiten zeigen die erste Zugehörigkeit (`affiliations[0]`), Gruppenseiten die Zugehörigkeit zu dieser Gruppe.

### Mockups

Die Mockups aus dem Brainstorming liegen als eigenständige HTML-Seiten neben diesem Dokument. Es ist Wegwerf-Code, die Bilder kommen aus dem Dataset `development`.

- [`2026-10-30-web-204-mockups/panel.html`](2026-10-30-web-204-mockups/panel.html): Such-Panel Variante C, Desktop und mobil, mit Vorschaubildern. Die Lupe öffnet es, die Knöpfe wechseln den Suchbegriff.
- [`2026-10-30-web-204-mockups/search-page.html`](2026-10-30-web-204-mockups/search-page.html): Suchseite mit den Zuständen Treffer, Keine Treffer und Ohne Suchbegriff. „Pflegbare Bereiche zeigen“ markiert, was die Redaktion im Studio ändert.

Sie legen Aufbau, Reihenfolge und Anmutung fest. Abstände, Größen und Farben übernimmt die Umsetzung aus den vorhandenen Komponenten und Tokens der Website.

### Weiteres im Code

- **Navigation:** `apps/web/src/components/with-logic/navigation/navigation.tsx` ist eine Client-Komponente.
  - Desktop: Der Kontakt-Button heißt zwischen `lg` und `xl` „Kontakt“, ab `xl` „Kontakt aufnehmen“.
  - Mobil: Burger mit Disclosure-Menü (`inert`, Escape schließt).
- **Seitenaufbau:** Hero (`getPageHeroImage`), `SectionHeader`, `ContactPersons`, `Newsletter`, `getPageMetadata`. `apps/web/src/app/news/page.tsx` ist eine gute Vorlage.
- **Singleton-Schema:** `apps/studio/schemas/single-pages/news-overview.ts` ist die Vorlage (`getHiddenSlugField`, `defaultHeroFields`, `getHeroImageField`, `metaField`, `contactPersonsSectionField`).
- **Schreibzugriff:** `apps/web/src/lib/sanity/write-client.ts` ist ein Schreib-Client mit Robot-Token (Rolle Editor). Bisher schreibt nur die Echo-Render-Route damit.
- **Revalidierung:**
  - `apps/web/src/app/api/revalidate/route.ts` (`REVALIDATION_MAP`).
  - Der Typfilter der Webhooks in Sanity (Staging und Produktion) muss der Map entsprechen, siehe `docs/SANITY_WEBHOOK_SETUP.md`.
- **Noindex-Vorbild:** `app/verein/echo/[slug]/page.tsx` setzt für nicht indexierbare Ausgaben `robots: { index: false, follow: false }`.

## Entscheidungen

Vom Nutzer am 30.10.2026 bestätigt.

### Was gefunden wird

Treffer erscheinen in zwei Gruppen:

- **News:** alle News-Artikel.
- **Seiten:** alles andere, also Abteilungen, Gruppen, Singletons und Echo-Ausgaben.

Durchsucht wird immer der Titel und der eigentliche Seiteninhalt:

| Typ | Durchsuchte Felder | Vorschaubild |
| --- | --- | --- |
| News | Titel, Text (`body`) | `featuredImage` |
| Abteilung | Titel, Suchbegriffe, Intro, FAQs der Abteilung (Frage und Antwort) | `cardImage` |
| Gruppe | Titel, Suchbegriffe, Beschreibung, Trainingstext (`training.trainingDescription`) | `featuredImage` |
| Singletons (siehe Tabelle oben) | Titel, Intro-Texte und Texte der Seite | `heroImage` (WEB-389) |
| Echo-Ausgabe | Titel und `extractedText`; bei `indexable: false` **nur der Titel** | erste Seite (Cover) |
| Person | Vor- und Nachname, Rolle, Aufgabenbeschreibung | — |

- **Personen** haben keine eigene Trefferseite. Eine Person führt zu den Seiten, auf denen sie aufgeführt ist (siehe [Wo Personen aufgeführt sind](#wo-personen-aufgeführt-sind)).
- **Nicht durchsucht** werden Sponsoren, Testimonials, Ehrenmitglieder und Entwürfe.
- **Ebenfalls nicht durchsucht** werden die rechtlichen Seiten Impressum, Datenschutz und Barrierefreiheit (Nutzer, 30.10.2026, nach der ersten Abnahme): Niemand sucht nach ihnen, und ihre langen Texte tauchten bei fast jedem Wort auf.
- Fehlt ein Bild, steht ein neutraler Platzhalter mit dem Vereinslogo.

### Ranking

- Der Titel wiegt am meisten.
- Das neue Feld **Suchbegriffe** wiegt fast so viel wie der Titel. Es löst Synonymfälle wie „Erste Mannschaft“ gegenüber „1. Mannschaft“.
- Bei News entscheidet bei gleichem Score das jüngere Veröffentlichungsdatum (`publishedAt`).

### Abnahme-Beispiele

| Suche | Erwarteter erster Treffer |
| --- | --- |
| „Tanzen“ | Abteilungsseite Tanzen (Diamonds-Gruppen) |
| „Gladbach“ | der News-Artikel zum Spiel gegen Gladbach |
| „Erste Mannschaft“ | Gruppenseite „1. Mannschaft“, sobald die Redaktion dort den Suchbegriff „Erste Mannschaft“ gepflegt hat |

### Such-Panel in der Navigation

- **Lupe:** Desktop vor „Kontakt aufnehmen“, mobil links neben dem Burger.
- **Variante C** aus den Mockups:
  - Ein Panel gleitet unter der Navigation herab, mit einem großen Eingabefeld in der Überschriftenschrift.
  - Desktop: Seiten und News stehen nebeneinander, die Seite darunter ist abgedunkelt.
  - Mobil: Das Panel füllt den Bildschirm, die Gruppen stehen untereinander.
- Jeder Treffer zeigt vor dem Text ein Vorschaubild.
- Pro Gruppe stehen höchstens 3 Treffer, darunter ein Link „Alle … anzeigen“ auf die Suchseite.
- **Bedienung:**
  - Gesucht wird ab 2 Zeichen, etwa 250 ms nach dem letzten Tastendruck, mit einer dezenten Ladeanzeige.
  - Bei leerem Eingabefeld zeigt das Panel „Häufig gesucht“.
- **Tastatur und Fokus:**
  - Beim Öffnen springt der Fokus ins Eingabefeld.
  - ↑/↓ wählt einen Treffer, Enter öffnet ihn. Enter ohne Auswahl führt zu `/suche?q=…`.
  - Esc schließt das Panel, der Fokus geht zurück auf die Lupe. Ein Klick auf die abgedunkelte Fläche schließt ebenfalls.
  - Der Fokus bleibt im offenen Panel gefangen, wie bei einem Dialog.
- **Navigation:** Ein Seitenwechsel schließt das Panel. Mobil schließt die Suche das Menü und umgekehrt.
- **Bewegung reduzieren:** Statt des Herabgleitens wird nur eingeblendet.

### Suchseite `/suche?q=`

- **Aufbau wie die übrigen Seiten:**
  1. Hero
  2. Suchbereich
  3. Ansprechpartner (PR-Team)
  4. Newsletter
- **Suchbereich:**
  - Section-Header und Formular.
  - Tabs „Alle“, „Seiten“ und „News“, jeweils mit Trefferzahl.
  - Seiten als Karten, News als Zeilen mit einem Textausschnitt rund um den Treffer.
  - Blättern in Zehnerschritten.
- Funktioniert ohne JavaScript: Das Formular schickt per GET, der Suchbegriff steht in der URL.
- Die Seite ist `noindex`.
- **Zustände:**
  - Treffer.
  - Keine Treffer: redaktionelle Überschrift, Text und Links.
  - Kein Suchbegriff: „Häufig gesucht“.

### Studio

- **Neues Feld „Suchbegriffe“** an Abteilung und Gruppe. Die Redaktion pflegt es selbst, es ist optional.
- **Neues Singleton „Suche“.** Alle Texte und Bereiche der Suchseite sind redaktionell pflegbar:
  - **Allgemein:** Titel, Untertitel, Hero-Bild.
  - **Meta.**
  - **Suchbereich:** Untertitel, Titel, Intro, Platzhalter des Eingabefelds. Den Platzhalter nutzt auch das Panel.
  - **Keine Treffer:** Überschrift, Text, Links.
  - **Häufig gesucht:** „Immer anzeigen“ und „Nie anzeigen“ (siehe unten).
  - **Ansprechpartner:** `contactPersonsSection`.

### Häufig gesucht

Die Liste entsteht automatisch aus echten Suchanfragen, die Redaktion kann eingreifen.

- **Gezählt** wird nur beim Absenden oder beim Klick auf einen Treffer, nie pro Tastendruck.
- **Gespeichert** werden nur der normalisierte Begriff und ein Zähler. Keine IP-Adresse, kein Cookie, keine Sitzungskennung.
- **In die Liste** kommt ein Begriff nur, wenn beide Bedingungen gelten:
  - Er hatte Treffer.
  - Er kommt als ganzes Wort in einem Seitentitel (Abteilung, Gruppe, Singleton) oder in einem Suchbegriff vor. News-Titel zählen nicht, weil sie oft Namen enthalten, etwa von Torschützen oder Trainern.

  So landen keine Namen von Personen oder Kindern in der Liste. Ohne IP oder Cookie kann auch eine einzelne Person einen Begriff über die Schwelle bringen. Weil nur Wörter aus Seitentiteln und Suchbegriffen in Frage kommen, ist das unschädlich.

- **Mindesthäufigkeit:** Ein Begriff zählt erst ab einer bestimmten Häufigkeit innerhalb der letzten 30 Tage.
- **„Immer anzeigen“** (Studio): Diese Begriffe stehen immer in der Liste. Sie füllen sie auch, solange noch zu wenige Daten da sind.
- **„Nie anzeigen“** (Studio): Diese Begriffe erscheinen nie.
- Die Liste wird stündlich aktualisiert.
- In die Datenschutzerklärung kommt ein Satz über das Zählen (siehe [Datenschutz](#datenschutz)).

### Speicher für die Zähler

Vom Nutzer am 30.10.2026 entschieden: Redis über den Vercel Marketplace, solange es kostenlos geht, sonst ein Sanity-Dokument.

Stand der Prüfung am 30.10.2026:

- Upstash Redis hat im Vercel Marketplace einen Free-Plan ohne Zahlungsmittel. Er umfasst 500.000 Befehle pro Monat, aber nur **eine Datenbank pro Konto**.
- Im Vercel-Team „mheob's projects“ ist Upstash noch nicht installiert. Installiert sind Neon, Supabase, Resend und Sanity.
- Bedarf: Jede gezählte Suche kostet ein bis zwei Befehle, die stündliche Auswertung einen. Selbst bei 1.000 gezählten Suchen am Tag bleibt das deutlich unter 100.000 Befehlen im Monat.

Daraus folgt:

- **Eine Datenbank für alle Umgebungen.** Jeder Schlüssel trägt die Umgebung als Präfix (`production`, `preview`, `development` aus `VERCEL_ENV`). Staging und Produktion zählen so getrennt.
- **Ablageort:** Frankfurt (`eu-central-1`), wenn der Free-Plan ihn anbietet, sonst die nächste EU-Region.
- **Ohne Zugangsdaten** (lokal, in E2E-Tests) wird nicht gezählt, und die Liste zeigt nur „Immer anzeigen“.
- **Fällt Redis aus** oder ist das Monatskontingent erschöpft, sucht die Suche normal weiter. Das Zählen entfällt dann, und die Liste fällt auf „Immer anzeigen“ zurück. Ein Fehler beim Zählen erreicht nie den Besucher.
- **Einrichtung:** Die Integration im Vercel-Team einrichten (`vercel integration add upstash` oder Dashboard) ist eine Änderung am Konto. Das macht der Nutzer selbst oder gibt es ausdrücklich frei. Die neuen Umgebungsvariablen kommen in `apps/web/src/lib/env.ts`, `turbo.json` und die Liste in `AGENTS.md`.
- **Fallback Sanity:** Bietet der Marketplace den Free-Plan beim Einrichten nicht an, etwa weil das Konto schon eine kostenlose Datenbank hat, kommen die Zähler in ein verstecktes Sanity-Dokument und werden über `write-client.ts` geschrieben. Der Typ bleibt dann aus `REVALIDATION_MAP` und dem Webhook-Filter heraus und wird nicht über `sanityFetch` gelesen, damit keine Revalidierung ausgelöst wird.

### Umsetzung in zwei Paketen

1. **Suche:** Panel, Suchseite, Suchbegriffe, Singleton „Suche“, Revalidierung. „Häufig gesucht“ zeigt in diesem Paket nur die Begriffe aus „Immer anzeigen“.
2. **Automatische Liste:** Zählen, Speicher, Filter, stündliche Aktualisierung, Satz in der Datenschutzerklärung.

Beide Pakete hängen am selben Entwurf. Paket 2 baut auf Paket 1 auf und braucht keine Änderung an dessen Oberfläche.

## Ziele

- Die drei Abnahme-Beispiele liefern den erwarteten Treffer an erster Stelle.
- Wer einen Namen einer Ansprechperson sucht, landet auf den Seiten, auf denen sie steht.
- Die Redaktion pflegt Texte, Suchbegriffe und „Häufig gesucht“ ohne Entwickler.
- Die Suchseite funktioniert ohne JavaScript.
- Kein Cookie-Banner, keine Übertragung von Besucherdaten an einen Suchanbieter.

## Nicht-Ziele

- Algolia oder ein anderer externer Suchdienst. Das bleibt eine spätere Option hinter `searchSite`.
- Semantische Suche (`text::semanticSimilarity()`), Tippfehlertoleranz, deutsche Stammformen.
- Gleichsetzen von „ß“ und „ss“ oder von Umlauten und ihren Umschreibungen. Wo das stört, trägt die Redaktion die Variante als Suchbegriff ein.
- Suche in Sponsoren, Testimonials, Ehrenmitgliedern und Entwürfen.
- Eine Auswertung der Suchanfragen für die Redaktion über „Häufig gesucht“ hinaus.
- Ein eigener Suchverlauf pro Besucher.

## Anti-Ziele

Das wäre ein Fehlschlag, auch wenn die Suche technisch funktioniert:

- Ein Personen- oder Kindername taucht in „Häufig gesucht“ auf.
- Der Text einer nicht indexierbaren Echo-Ausgabe wird über die Suche auffindbar, etwa in einem Textausschnitt.
- Ein Entwurf oder unveröffentlichter Inhalt erscheint in den Treffern.
- Die Suche setzt ein Cookie, speichert etwas im Browser oder schickt Besucherdaten an Dritte.
- Das Panel ist mit Tastatur oder Screenreader nicht bedienbar, oder der Accessibility-Score in Lighthouse fällt unter 100.

## Rahmenbedingungen

- Abfragen laufen serverseitig. Der Suchbegriff geht als GROQ-Parameter (`$q`) in die Abfrage, nie per String-Verkettung.
- Gesucht wird nur in veröffentlichten Inhalten (Perspektive `published`), auch im Presentation-Tool.
- Eine veröffentlichte Änderung ist spätestens nach wenigen Minuten in den Treffern.
- Eine Änderung am Singleton „Suche“ aktualisiert die Suchseite und den Platzhalter im Panel. Dafür braucht es einen Eintrag in `REVALIDATION_MAP`, dazu den Typfilter beider Webhooks in Sanity und `docs/SANITY_WEBHOOK_SETUP.md`.
- `/suche` steht nicht in `sitemap.xml` und nicht in `llms.txt`.
- **Produktion:** Die Suche entsteht auf `next` und erreicht Produktion frühestens mit dem Release, das WEB-384 nach `main` bringt. In diesem Release wird auch `production` migriert. Einen Backport auf den heutigen Stand von `main` mit den alten `group.*`-Typen gibt es nicht. Die Suche muss trotzdem ohne `department`-Dokumente fehlerfrei laufen, etwa zwischen Deployment und Migration. Eine Gruppe ohne Abteilungs-Slug hat keine Adresse (`getInternalHref` liefert `undefined`) und fällt aus den Treffern.
- **Tests:**
  - Unit-Tests neben dem Code. Die Coverage-Schwellen dürfen nicht sinken.
  - E2E-Tests für Panel und Suchseite, mit Sanity im Next.js-Prozess gemockt wie die übrigen Specs.
  - `/suche` kommt in den Axe-Lauf.
- **Visuelle Referenzbilder:** Die Lupe ändert die Navigation und damit alle neun Referenzbilder in beiden Browser-Projekten. Sie werden im Playwright-Container neu erzeugt (`pnpm --filter web run test:e2e:visual:update`).
- **Konventionen** aus `AGENTS.md`:
  - Base-UI-Primitive mit `render`-Prop.
  - Kein `try`/`catch` in Komponenten und Hooks (`settle()` statt dessen).
  - `defineQuery`.
  - Deutsche Studio-Titel.
  - Typgenerierung nach Schemaänderungen.

## Meine Festlegungen

Diese Punkte hat der Nutzer nicht ausdrücklich entschieden. Ein Builder kann sie ändern, wenn er gute Gründe hat.

- **Schnittstelle:** `searchSite(query, { type, page })` in `apps/web/src/lib/search/`. Sie liefert typisierte Treffer, Trefferzahlen pro Gruppe und Textausschnitte. Die Suchseite ruft sie direkt in der Server-Komponente auf, das Panel über eine Route `GET /api/search?q=` mit höchstens 3 Treffern pro Gruppe.
- **Präfixsuche:** Das letzte Wort der Eingabe wird als Präfix gesucht (`Tanz` findet „Tanzen“). So kommen im Panel schon beim Tippen Treffer.
- **Gewichte:** Startwerte zum Abstimmen an den Abnahme-Beispielen:

  | Feld | Gewicht |
  | --- | --- |
  | Titel | 10 |
  | Suchbegriffe | 8 |
  | Intro, Beschreibung, FAQ-Frage, Name einer Person | 3 |
  | Text, FAQ-Antwort, Trainingstext, Echo-Text, Rolle und Aufgabenbeschreibung einer Person | 1 |

- **Personentreffer:**
  - Sie erscheinen in der Gruppe „Seiten“ als die Seite, auf der die Person steht.
  - **Treffer im Namen** liefern jede Seite, auf der die Person steht.
  - **Treffer in Rolle oder Aufgabenbeschreibung** liefern nur die Seiten, die genau diese Zugehörigkeit zeigen: die Gruppenseite für eine Zugehörigkeit zu dieser Gruppe, Abteilungs- und Singleton-Seiten nur für `affiliations[0]`. So holt ein allgemeines Wort wie „Trainer“ nicht Kontakt, Verein und Startseite nach oben, nur weil dort irgendeine Trainerin steht.
  - Der Textausschnitt nennt die Person mit der Rolle, die diese Seite zeigt, etwa „Ansprechpartnerin: Alina Kaap, Übungsleiterin“.
  - Findet die Suche dieselbe Seite mehrfach, über ihren eigenen Inhalt oder über mehrere Personen, erscheint sie nur einmal, mit dem höchsten Score.
- **Textausschnitte:** werden serverseitig aus dem Klartext geschnitten, rund um die erste Fundstelle, etwa 160 Zeichen. Der Suchbegriff wird im Titel und im Ausschnitt mit `<mark>` hervorgehoben. Echo-Ausgaben mit `indexable: false` bekommen keinen Ausschnitt.
- **Suchseite:**
  - Tab und Seite stehen in der URL (`/suche?q=…&typ=seiten|news&seite=2`).
  - „Alle“ zeigt bis zu 6 Seiten-Karten und 3 News-Zeilen, jeweils mit einem Link auf den Tab.
  - Die Tabs „Seiten“ und „News“ blättern in Zehnerschritten.
- **Länge der Eingabe:** höchstens 100 Zeichen. Leerzeichen am Rand werden entfernt, mehrfache zusammengefasst.
- **Panel-Code:** wird erst beim ersten Öffnen geladen. Seiten, auf denen niemand sucht, werden nicht schwerer.
- **Vorschaubild der Startseite:** Das Hero-Bild der Startseite ist freigestellt und hochkant und taugt nicht als Thumbnail. Die Startseite bekommt den Logo-Platzhalter.
- **Cover nicht indexierbarer Echo-Ausgaben:** wird gezeigt wie im Archiv auf `/verein/echo`.
- **Häufig gesucht:**
  - Mindesthäufigkeit 3 innerhalb von 30 Tagen, höchstens 8 Begriffe.
  - „Ganzes Wort“ heißt: Der normalisierte Begriff stimmt mit einem oder mehreren aufeinanderfolgenden Wörtern eines Seitentitels oder Suchbegriffs überein, ohne Groß- und Kleinschreibung. „Diamonds“ und „Magic Diamonds“ passen auf „Magic Diamonds“, „Diam“ nicht.
  - Gezählt wird in einem Schlüssel pro Tag mit 31 Tagen Ablaufzeit, die Auswertung fasst die letzten 30 Tage zusammen.

## Dem Builder überlassen

- Wie die GROQ-Abfrage aufgeteilt wird: eine Abfrage für alles oder eine pro Gruppe.
- Welcher Cache-Mechanismus die Aktualitätsgrenze einhält.
- Die genaue Platzierung des Zählens, etwa ein Aufruf beim Absenden und beim Klick, solange er ohne Cookie auskommt.
- Ob `/suche` ein eigenes visuelles Referenzbild bekommt.
- Die Feldnamen im Schema, solange die Studio-Titel deutsch sind wie oben.

## Datenschutz

- Paket 1 speichert nichts. Die Suche läuft über den eigenen Server und Sanity, beide sind schon heute Auftragsverarbeiter.
- Paket 2 speichert bei Upstash nur Suchbegriffe und Zähler, ohne Bezug zu einer Person. Die Anfrage an Upstash stellt der Server, die IP des Besuchers erreicht Upstash nicht. Ob für diese Daten ein Auftragsverarbeitungsvertrag mit Upstash nötig ist, klärt der Verein.
- Mit Paket 2 kommt ein Satz in die Datenschutzerklärung. Die Redaktion pflegt ihn im Singleton `privacy`. Vorschlag:

  > Wenn du die Suche auf unserer Website nutzt, speichern wir den Suchbegriff ohne Bezug zu deiner Person, also ohne IP-Adresse und ohne Cookie, und zählen, wie oft er gesucht wurde. Daraus entsteht die Liste „Häufig gesucht“. Die Zählungen löschen wir nach etwa einem Monat.
