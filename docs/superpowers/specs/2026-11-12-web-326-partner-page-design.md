# Sponsoren- und Partnerseite — Design-Spec

Datum: 2026-11-12 · Status: Entwurf · Ticket: [WEB-326](https://linear.app/tsg-irlich/issue/WEB-326/sponsoren-partner-seite) · Prototyp: Branch `feat/web-326-sponsor-page-prototype`, Route `/verein/sponsoren-prototyp?variant=A|B`

Scope: Eine neue Seite `/verein/partner`, die neue Sponsoren gewinnt und den bestehenden dankt. Alle Texte pflegt die Redaktion in einem neuen Singleton im Studio. Ein Sponsor darf künftig ohne Website eingetragen werden.

## Warum

Der Verein (Philipp Pfeiffer, Vorstand Öffentlichkeitsarbeit, und Sophie Thomé, PR-Team) möchte eine Seite, die erklärt, warum sich Sponsoring bei der TSG lohnt, welche Möglichkeiten es gibt, wer schon dabei ist und an wen man sich wendet. Philipp hat am 2026-10-01 einen Entwurf geschickt (Linear-Kommentar „TSG Irlich: Gemeinsam stark als Partner“). Daraus entstanden am 2026-11-07 zwei Prototypen mit echten Daten aus Sanity. Am 2026-11-09 hat der Verein entschieden:

- Variante A („Vertraut“)
- Sponsorenlogos mit URL, ähnlich wie in Variante B
- Ein Sponsor geht auch ohne URL (Beispiel: Bestattungen Ingo Jann)

Heute gibt es keine solche Seite. Die Sponsoren erscheinen nur als Logo-Leiste auf der Startseite und in der Seitenleiste der Artikel.

## Ausgangslage

- **Prototyp** (`apps/web/src/app/verein/sponsoren-prototyp/` auf dem Prototyp-Branch): `page.tsx`, `_shared/data.ts` (GROQ als Strings, ohne TypeGen), `_shared/content.ts` (alle Texte fest im Code), `_shared/sponsor-logo.tsx`, `_variants/variant-a.tsx`, `_variants/variant-b.tsx`. Variante A ist die Vorlage für den Aufbau, der Abschnitt „Unsere Partner und Sponsoren“ in Variante B die Vorlage für die Partner-Kacheln. Der Branch wird nicht gemergt.
- **Sponsor-Dokument** `sponsors` (`apps/studio/schemas/documents/sponsors.ts`): `name` (Pflicht, 3–64 Zeichen), `website` (Pflicht, URL mit http/https), `logo` (Pflicht, Bild). Die Website ist heute Pflicht.
- **Sponsoren auf der Website:** `sponsorsQuery` (`apps/web/src/lib/sanity/queries/shared/sponsors.ts`, nach Name sortiert) speist die Startseite (`apps/web/src/app/_home/sponsors.tsx`) und die Artikel (`apps/web/src/app/news/[category]/[slug]/_sections/sponsors.tsx`). Beide verlinken über `SponsorLink` (`apps/web/src/components/ui/sponsor-link.tsx`), das ohne Website schon das Logo ohne Link zeigt und den Link mit `rel="sponsored"` auszeichnet.
- **Vorbild Single Page:** `membership` (`apps/studio/schemas/single-pages/membership.ts`, Seite `apps/web/src/app/mitgliedschaft/page.tsx`): versteckter fester Slug, `defaultHeroFields`, `getHeroImageField`, `metaField`, `contactPersonsSectionField`; die Seite liest über `client.fetch`, ist nicht in der Vorschau, antwortet mit 404 ohne Dokument und wird über `REVALIDATION_MAP` revalidiert.
- **Vorbild Unterseite von „Verein“:** `echoOverview` ist Unterseite von `aboutUs` im Desk (`SINGLE_PAGES`, `PAGE_LAYOUT` in `apps/studio/structure/pages.ts`), internes Linkziel (`INTERNAL_LINK_TARGETS` in `apps/studio/schemas/objects/internal-link.ts`) und hat einen eigenen Pfad in `PATH_RESOLVERS` (`apps/web/src/utils/links.ts`), weil sein Slug nicht der ganze Pfad ist.
- **Icons auf der Startseite:** Die Merkmale tragen den Namen eines Lucide-Icons als Freitext; `FeatureCard` kennt nur vier Namen und zeigt sonst ein Fragezeichen.
- **Schon abgedeckt:** BotID schützt `/verein/*` (`apps/web/src/instrumentation-client.ts`), der Newsletter-Abschnitt funktioniert dort also. `person` und `aboutUs` revalidieren `/verein` als Layout und erreichen damit auch die neue Seite.
- **Daten in production** (Stand 2026-11-07): vier Sponsoren (Abbas, „Ingo Jahn“, Rewe Müller, SWN). Beim Sponsor „Ingo Jahn“ zeigt das Logo „Ingo Jann“, und die Website führt auf gelbeseiten.de.

## Entscheidungen

Vom Nutzer entschieden (2026-11-09 mit dem Verein, 2026-11-12 im Gespräch):

| Frage | Entscheidung |
| --- | --- |
| Aufbau | Variante A des Prototyps: Hero → „Warum Sponsor bei der TSG werden?“ (Karten mit Icon) → „So kannst du uns unterstützen“ (Karten auf blauem Band mit Vorteilen und Button, darunter Satz und Button für eine eigene Idee) → „Unsere Partner und Sponsoren“ → Ansprechpartner → Newsletter. |
| Partner-Kacheln | Wie Variante B: Logo oben, darunter Name, Domain (ohne `www.`) und ein Icon für externen Link. Dahinter die Kachel „Dein Logo hier?“ aus Variante A. |
| Logo-Farbe | Grau im Normalzustand, farbig beim Hover (wie Variante A). Meine Ergänzung: auch bei Tastaturfokus farbig, und auch eine Kachel ohne Website wird beim Hover farbig. Auf dem Handy gibt es kein Hover, dort bleiben die Logos grau. |
| Sponsor ohne Website | Erlaubt. Die Kachel zeigt Logo und Name, ohne Link, ohne Domain, ohne Icon. |
| Texte | Alle Texte der Seite pflegt die Redaktion im Studio. |
| Preise | Keine. |
| Adresse | `/verein/partner` |
| Ziel der Anfrage-Buttons | Ein E-Mail-Feld im Studio, vorbelegt mit `partner@tsg-irlich.de`. |
| Icons | Die Redaktion wählt sie aus einer festen Liste. |
| Anzahl der Karten | Je Abschnitt für 4 Karten gebaut. Das Studio warnt bei einer anderen Zahl, verbietet sie aber nicht. |
| Startinhalt | Die Texte des Prototyps (`_shared/content.ts`). |
| Reihenfolge der Sponsoren | Alphabetisch nach Name. |
| Alte Partner-Adresse | `/verein/unsere-starken-partner` der alten WordPress-Seite leitet heute auf `/` (`OLD_CLUB_PAGES` in `apps/web/src/lib/redirects/legacy-redirects.ts`). Sie zeigt erst auf `/verein/partner`, wenn die Redaktion die Seite veröffentlicht hat, in einem eigenen kleinen PR. Dieser PR lässt sie unverändert. |
| Livegang | Nach dem Release legt der Entwickler in production einen **Entwurf** mit dem Startinhalt an. Die Redaktion prüft und veröffentlicht ihn und nimmt die Seite ins Menü „Verein“ auf. Den Sponsor „Ingo Jahn“ korrigiert die Redaktion auf „Jann“ und löscht seine gelbeseiten-URL. |

Als meine Entscheidung festgehalten:

- **Betreff** der Anfrage-Mail ist ebenfalls ein Feld, vorbelegt mit „Sponsoring bei der TSG Irlich“. Der Button einer Karte unter „So kannst du uns unterstützen“ hängt den Titel der Karte an („Sponsoring bei der TSG Irlich: Trikotwerbung“), alle anderen Buttons nehmen den Betreff, wie er ist.
- **Dokumenttyp** `partnerPage`, Studio-Titel „Sponsoren & Partner“, fester versteckter Slug `partner`. Im Desk unter „Verein“ → „Unterseiten“ nach der TSG-Echo-Übersicht, Adresse in `SINGLE_PAGES`: Unterseite von „Über uns“, `/verein/partner`.
- **Keine Vorschau** im Presentation Tool, wie bei `membership` und `echoOverview`. Die Seite liest über `client.fetch`.
- **Suche:** Die Seite ist Teil der Website-Suche, damit „Sponsor“ oder „Partner“ sie findet.
- **Sitemap:** Die Seite steht als statische Seite in `sitemap.ts`. `llms.txt` bleibt unverändert.
- **Partner-Kacheln** stehen im hellen Abschnitt von A, nicht auf dem blauen Band von B. Eine Kachel mit Website hebt sich beim Hover leicht an.
- **Hero-Bild** ist Pflicht wie auf den anderen Seiten. Der Startinhalt nimmt das Hero-Bild von `aboutUs` (dasselbe Asset), bis die Redaktion ein eigenes wählt.
- **Ansprechpartner** im Startinhalt: Philipp Pfeiffer, Louisa Krechel, Sophie Thomé (die Personen-IDs stehen in `_shared/data.ts` des Prototyps).
- **Links der Partner-Kacheln** tragen `rel="sponsored"` wie `SponsorLink`. Eine Kachel ohne Website hebt sich beim Hover nicht an, weil der Effekt einen Link verspricht.
- **Icon-Feld** ist eine einfache Auswahlliste mit deutschen Bezeichnungen, kein grafischer Picker.
- **Suche** durchsucht nur die Texte der Seite, nicht die Namen der Sponsoren.
- **Desk:** `sponsors` bleibt im Block der geteilten Dokumente, weil Startseite und Artikel sie ebenfalls zeigen.
- **Newsletter** behält seine Texte im Code; er ist ein geteilter Abschnitt, kein Text dieser Seite.
- **Icon-Liste:** die acht Icons des Prototyps (`MapPin`, `TrendingUp`, `HeartHandshake`, `Handshake`, `Shirt`, `Fence`, `Globe`, `Gift`) mit deutschen Bezeichnungen im Studio, ergänzt um ein paar naheliegende für Sponsoring (zum Beispiel Pokal, Megafon, Gruppe, Herz, Stern). Die Startseiten-Merkmale bleiben beim Freitext; das Umstellen ist nicht Teil dieses Tickets.

## Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**

- `/verein/partner` zeigt die Seite nach Variante A mit den Partner-Kacheln nach Variante B, auf Desktop und Handy.
- Jeder sichtbare Text der Seite kommt aus dem Singleton `partnerPage`: Hero, alle Abschnittsköpfe, die Karten beider Abschnitte mit ihren Vorteilen und Button-Texten, Satz und Button für die eigene Idee, der Text der Kachel „Dein Logo hier?“, E-Mail-Adresse und Betreff. Ausnahmen sind nur feste Hinweise für Screenreader wie „(öffnet in neuem Fenster)“.
- Ein Sponsor lässt sich ohne Website speichern und veröffentlichen. Startseite, Artikel und die neue Seite zeigen ihn ohne Link.
- Die Seite ist ein internes Linkziel, damit die Redaktion sie ins Menü „Verein“ hängen kann.
- Ändert die Redaktion das Singleton, einen Sponsor oder eine Person, aktualisiert sich die Seite über den Webhook.

**Nicht-Ziele**

- Preise oder Pakete mit Beträgen.
- Vorschau im Presentation Tool.
- Sponsoren-Stufen, Kategorien oder eine eigene Reihenfolge.
- Änderungen an der Logo-Leiste der Startseite und der Artikel über das Weglassen der Pflicht-URL hinaus.
- Ein Eintrag in `llms.txt`.
- Der Menüeintrag selbst: den setzt die Redaktion in den Website-Einstellungen.
- Die Startseiten-Merkmale auf die Icon-Liste umstellen.
- Die alte Partner-Adresse umleiten (folgt nach der Veröffentlichung, siehe Livegang).

**Anti-Ziele**

- Platzhaltertexte gehen ungeprüft live. Deshalb landet der Startinhalt in production nur als Entwurf, und die Seite antwortet mit 404, solange kein veröffentlichtes Singleton existiert.
- Ein Sponsor ohne Website erzeugt einen leeren oder toten Link, eine leere Domainzeile oder ein Link-Icon ohne Ziel.
- Ein Text der Seite steht fest im Code.
- Die Seite erscheint im Menü oder in der Sitemap, bevor die Redaktion sie veröffentlicht hat. Die Sitemap darf die Adresse ab dem Release listen; sie antwortet bis zur Veröffentlichung mit 404. _(Der Builder darf das verhindern, wenn es ohne großen Aufwand geht, zum Beispiel indem der Sitemap-Eintrag vom Vorhandensein des Dokuments abhängt.)_

## Inhalt des Singletons

Alle Felder mit deutschen Titeln und Beschreibungen. Die Tabs folgen den Regeln aus `apps/studio/AGENTS.md` (Allgemein, Inhalt bzw. eigene Tabs, SEO & Teilen; `schemas/groups.test.ts` prüft sie).

- **Allgemein:** Titel, Untertitel (`defaultHeroFields`), Hero-Bild (`getHeroImageField(LANDSCAPE_HERO_DESCRIPTION)`), versteckter Slug `partner`.
- **Anfragen:** E-Mail-Adresse (Pflicht, gültige Adresse, vorbelegt `partner@tsg-irlich.de`), Betreff (Pflicht, vorbelegt „Sponsoring bei der TSG Irlich“).
- **Warum Sponsor werden:** Abschnittskopf (`getDefaultPageSectionFieldsWithGroup`), Karten mit Titel, Text und Icon; Warnung bei einer Anzahl ungleich 4.
- **Unterstützung:** Abschnittskopf, Karten mit Titel, Text, Vorteilen (Liste von Texten), Icon und Button-Text; Warnung bei einer Anzahl ungleich 4. Dazu der Satz zur eigenen Idee und dessen Button-Text.
- **Partner:** Abschnittskopf und der Text der Kachel „Dein Logo hier?“.
- **Ansprechpartner:** `contactPersonsSectionField`.
- **SEO & Teilen:** `metaField`.

Welche Felder Pflicht sind, entscheidet der Builder. Maßstab: Die Seite darf mit einem vollständig ausgefüllten Startinhalt nie leere Überschriften oder Buttons zeigen, und ein fehlender optionaler Text lässt sein Element weg.

## Was sich wo ändert

**Studio**

- Neues Schema `schemas/single-pages/partner-page.ts` (plus Test), registriert in `schemas/single-pages/index.ts`, mit eigenem Icon.
- `structure/pages.ts`: Eintrag in `SINGLE_PAGES` und in `PAGE_LAYOUT` unter „Verein“ → `pages`.
- `schemas/objects/internal-link.ts`: `partnerPage` als Linkziel.
- `schemas/documents/sponsors.ts`: `website` ohne Pflicht, URL-Prüfung bleibt; Beschreibung sagt, dass ein Sponsor ohne Website ohne Link erscheint. `sponsors.ts` hat bisher keinen Test.
- Ein Skript unter `scripts/` (über `sanity exec`), das den Startinhalt anlegt: Es schreibt nur, wenn es weder ein veröffentlichtes Dokument noch einen Entwurf gibt, legt immer nur den Entwurf `drafts.partnerPage` an und überschreibt nie etwas. In `development` veröffentlicht der Entwickler den Entwurf danach im Studio, in production die Redaktion.

**Website**

- Route `apps/web/src/app/verein/partner/page.tsx` mit `generateMetadata` über `getPageMetadata` (Pfad `/verein/partner`, Hero-Bild als Fallback-Bild) und den Abschnitten in `_sections/`. Die Bausteine des Prototyps (`Hero`, `SectionHeader`, `Card`, `ButtonLink`, `ExternalLink`, `ContactPersons`, `Newsletter`, `pricing.module.css`) werden wiederverwendet. `SponsorLogo` und `getHostname` ziehen aus dem Prototyp mit ein.
- GROQ mit `defineQuery` in `src/lib/sanity/queries/pages/partner.ts`, danach `pnpm run extract-types && pnpm run typegen:sanity`. Die Sponsoren kommen aus `sponsorsQuery` oder einer Abfrage mit derselben Sortierung.
- Ohne veröffentlichtes Singleton: `notFound()`.
- `src/utils/links.ts`: `partnerPage` → `/verein/partner` in `PATH_RESOLVERS`.
- `src/app/api/revalidate/route.ts`: `partnerPage` revalidiert `/verein/partner`; `sponsors` revalidiert zusätzlich `/verein/partner`.
- `src/lib/sanity/queries/search.ts`: `partnerPage` in `SEARCH_PAGE_TYPES`, in beiden GROQ-Listen und im Text, den die Suche durchsucht (die Intros und Kartentexte). Die Ansprechpartner-Liste der Suche (`contactPersonPageTypeList`) bekommt die Seite ebenfalls. Bestehender Test hält beide Schreibweisen gleich.
- `src/app/sitemap.ts`: statischer Eintrag `/verein/partner`.
- `SponsorLink`: Doc-Kommentar „where it is a required field“ anpassen.
- Die Icon-Zuordnung (Wert im Studio → Lucide-Komponente) liegt an einer Stelle im Web; ein unbekannter Wert zeigt kein Icon statt eines Fragezeichens.

**Tests und Doku**

- Unit-Tests für Schema, Abschnitte, Hilfsfunktionen, Linkziel, Revalidierung, Suche und Sitemap nach den Konventionen der Repo; die Coverage-Schwellen bleiben oder steigen.
- Visuelle Regression: `/verein/partner` kommt in `STATIC_ROUTES` von `apps/web/e2e/specs/visual.spec.ts`. Die Liste hält eine Baseline je Layout der Website, und die Seite bringt ein neues (Karten auf dem blauen Band, Partner-Kacheln). Die Baselines beider Browser-Projekte entstehen mit `pnpm --filter web run test:e2e:visual:update` im Playwright-Container (Docker ist lokal vorhanden).
- e2e: `/verein/partner` in die Axe-Prüfung (`apps/web/e2e/specs/accessibility.spec.ts`) und ein Spec, der Abschnitte, Kacheln mit und ohne Website sowie die Mail-Links prüft. Die Fixtures werden aus `development` aufgenommen, nachdem dort der Startinhalt veröffentlicht ist. Kein echter Sponsor ohne Website in `development` → der Spec braucht einen; wie (Fixture anpassen oder Testdokument in `development`) entscheidet der Builder.
- `apps/studio/AGENTS.md`, `apps/web/AGENTS.md` und `docs/SANITY_WEBHOOK_SETUP.md` (Typfilter beider Webhooks) beschreiben die neue Seite.

## Livegang

1. PR nach `next`. Vorher in `development`: Skript laufen lassen, Entwurf veröffentlichen, e2e-Fixtures aufnehmen.
2. Webhook-Filter staging um `partnerPage` ergänzen (liegt in Sanity, nicht in der Repo; vorher OK des Nutzers).
3. Release `next` → `main` im üblichen Ablauf.
4. Webhook-Filter production um `partnerPage` ergänzen (vorher OK des Nutzers).
5. Skript gegen production: Entwurf mit Startinhalt anlegen. Der Nutzer hat dem zugestimmt; der Entwickler nennt vor dem Lauf trotzdem Befehl und Dataset.
6. Redaktion: Entwurf prüfen und veröffentlichen, Seite ins Menü „Verein“ hängen, Sponsor „Ingo Jahn“ → „Jann“ und gelbeseiten-URL löschen.
7. Eigener kleiner PR: `/verein/unsere-starken-partner` → `/verein/partner` in `OLD_CLUB_PAGES`, Test in `legacy-redirects.test.ts` anpassen.
8. Linear-Kommentar auf Deutsch mit Screenshots (Desktop und Handy), Ticket nach Freigabe auf Done. Danach kann der Prototyp-Branch weg.

## Dem Builder überlassen

- Schnitt der Abschnitts-Komponenten und Dateinamen unter `_sections/`.
- Welche Felder Pflicht sind (Maßstab oben) und die genauen Grenzen der Textlängen.
- Die endgültige Icon-Liste über die acht des Prototyps hinaus.
- Ob die Seite eine eigene Sponsoren-Abfrage bekommt oder `sponsorsQuery` mitnutzt.
- Wie der e2e-Spec einen Sponsor ohne Website bekommt.
- Ob der Sitemap-Eintrag vom Vorhandensein des Dokuments abhängt.
