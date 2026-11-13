# Ehrenamtsseite — Design-Spec

Datum: 2026-11-13 · Status: Entwurf · Ticket: [WEB-190](https://linear.app/tsg-irlich/issue/WEB-190/ehrenamtsseite-engagiere-dich-im-about-us) · Prototyp: Branch `feat/web-190-volunteer-page-prototype`, Route `/verein/engagiere-dich-prototyp?variant=A|B`

Scope: eine neue Seite `/verein/ehrenamt`, die für das Ehrenamt bei der TSG wirbt und zeigt, wie man sich einbringen kann. Die Texte pflegt die Redaktion in einem neuen Singleton. Die offenen Aufgaben werden ein eigener Dokumenttyp, den die Redaktion selbst anlegt, veröffentlicht und zurückzieht.

## Warum

Der Verein (Philipp Pfeiffer, Vorstand Öffentlichkeitsarbeit, und Sophie Thomé, PR-Team) möchte mehr Menschen für das Ehrenamt gewinnen. Die Seite soll erklären, warum sich Engagement lohnt, welche Bereiche es gibt, welche Aufgaben gerade offen sind und an wen man sich wendet. Vorlagen waren Philipps Entwurf vom 2026-10-01 („TSG Irlich: Gemeinsam engagieren“) und Beispielseiten anderer Vereine. Philipp gefiel bei ATSV das Persönliche und bei TuS Griesheim die aufklappbaren Ausschreibungen. Am 2026-11-07 entstanden daraus zwei Prototypen mit echten Daten aus Sanity. Am 2026-11-09 hat der Verein entschieden:

- aus Variante A nur der erste Abschnitt („Gemeinsam mehr erreichen“),
- alles andere aus Variante B,
- die Zahlen bei „So kannst du dich einbringen“ wie auf der Startseite bei „Unsere Angebote“.

Heute gibt es keine solche Seite, auch nicht auf der alten WordPress-Seite (keine Altadresse in `legacy-redirects.ts`).

## Ausgangslage

- **Prototyp** (`apps/web/src/app/verein/engagiere-dich-prototyp/` auf dem Prototyp-Branch): `page.tsx`, `_shared/data.ts` (GROQ als Strings, ohne TypeGen), `_shared/content.ts` (alle Texte fest im Code), `_variants/variant-a.tsx`, `_variants/variant-b.tsx`. Der Branch wird nicht gemergt; er ist Vorlage für Layout und Startinhalt.
- **Direktes Vorbild ist die Partnerseite** (WEB-326, #787, Spec `2026-11-12-web-326-partner-page-design.md`): Singleton `partnerPage` unter `apps/studio/schemas/single-pages/partner-page/` (`index.ts`, `sections.ts`, `_groups.ts`), Anfrage-Objekt mit E-Mail und Betreff, Icon-Auswahl aus `PARTNER_ICONS` (`packages/shared/src/partner-icons.ts`), Seite `apps/web/src/app/verein/partner/` mit `_sections/` und `_shared/` (`mail.ts`, `partner-icon.tsx`), Startinhalt per `apps/studio/scripts/create-partner-page.ts` nur als Entwurf, 404 ohne veröffentlichtes Dokument. Die Verdrahtung läuft über `SINGLE_PAGES` und `PAGE_LAYOUT` (`apps/studio/structure/pages.ts`), `INTERNAL_LINK_TARGETS`, `PATH_RESOLVERS` (`apps/web/src/utils/links.ts`), `REVALIDATION_MAP`, `SEARCH_PAGE_TYPES` und `contactPersonPageTypeList` (`apps/web/src/lib/sanity/queries/search.ts`), `sitemap.ts`, e2e, Axe und die visuellen Baselines.
- **Vorbild Dokumenttyp im Bereich „Verein“:** `echo.issue` steht im Desk unter „Verein“ → „Inhalte“ (`content: ['echo']` in `PAGE_LAYOUT`, `getGroupEcho` in `apps/studio/structure/index.ts`).
- **Zitate:** Der Dokumenttyp `testimonial` (Vorname, Nachname, Porträt, Rolle, Zitat mit 64–350 Zeichen) speist die Startseite über Referenzen in `home.content.testimonialSection.testimonials`. `testimonial` revalidiert heute nur `/`.
- **Ansprechpartner:** `contactPersonsSectionField` (`apps/studio/shared/sections/contact-persons.ts`) und die Komponente `ContactPersons` (`apps/web/src/components/section/contact-persons.tsx`), der blaue Abschnitt, den alle Seiten nutzen. `person` revalidiert `/verein` als Layout und erreicht damit auch die neue Seite.
- **Zahlen der Startseite:** `GroupCard` (`apps/web/src/app/_home/group-card.tsx`) zeigt zweistellige Ziffern als weiße Schrift mit schwarzer Kontur (Utility `text-stroke` in `globals.css`). Variante B zeigt sie stattdessen gefüllt in Dunkelgelb.
- **Bausteine, die es schon gibt:** `Hero`, `SectionHeader`, `ButtonLink`, `Accordion`, `Badge`, `Portrait`, `Newsletter`, `downloads.module.css` (Hintergrund von „Aktuell gesucht“), `contact-persons.module.css` (blauer Hintergrund).
- **Schon abgedeckt:** BotID schützt `/verein/*`, der Newsletter funktioniert dort also.

## Entscheidungen

Vom Nutzer entschieden (2026-11-09 mit dem Verein, 2026-11-13 im Gespräch):

| Frage | Entscheidung |
| --- | --- |
| Aufbau | Hero → „Gemeinsam mehr erreichen“ (Variante A) → „Stimmen aus dem Verein“ (B) → „So kannst du dich einbringen“ (B) → „Aktuell gesucht“ (B) → Ansprechpartner → Newsletter. |
| Gelbes Band „Ohne Ehrenamt kein Verein – seit 1882.“ aus B | Entfällt. |
| Ansprechpartner | Der übliche blaue Abschnitt `ContactPersons` wie auf den anderen Seiten, nicht die Porträtkarten auf Gelb aus B. |
| Zahlen bei den Bereichen | Wie bei „Unsere Angebote“ auf der Startseite: Ziffern mit Kontur (`text-stroke`), zweistellig (`01`, `02`, …). |
| Adresse | `/verein/ehrenamt` |
| Offene Aufgaben | Eigener Dokumenttyp „Offene Aufgabe“. Die Redaktion legt Aufgaben an, veröffentlicht sie und zieht sie zurück, ohne sie zu löschen. |
| Texte | Alle Texte der Seite pflegt die Redaktion im Studio, wie bei der Partnerseite. |
| Ziel der Meldungen | Ein E-Mail-Feld im Studio, vorbelegt mit `info@tsg-irlich.de` (die Adresse gibt es schon; keine persönliche Adresse in Code und Fixtures). |

Als meine Entscheidung festgehalten:

- **Dokumenttypen:** Singleton `volunteerPage`, Studio-Titel „Ehrenamt“, fester versteckter Slug `ehrenamt`. Im Desk unter „Verein“ → „Unterseiten“ nach der Partnerseite. In `SINGLE_PAGES` ist er eine Unterseite von „Über uns“ mit dem Pfad `/verein/ehrenamt`. Dazu der Dokumenttyp `volunteer.position`, Studio-Titel „Offene Aufgabe“, im Desk unter „Verein“ → „Inhalte“ neben den TSG-Echo-Ausgaben.
- **Welche Aufgaben erscheinen:** jede veröffentlichte Offene Aufgabe, die neueste zuerst (nach `_createdAt`). Das Singleton zählt sie nicht auf. Zurückziehen heißt im Studio „Veröffentlichung zurücknehmen“. Ohne veröffentlichte Aufgabe bleibt der Abschnitt „Aktuell gesucht“ mit Kopf, Schritten und der Karte „Nichts Passendes dabei?“. Das Akkordeon fällt weg, ebenso der Button „Offene Aufgaben ansehen“ im ersten Abschnitt.
- **Stimmen aus dem Verein** sind Referenzen auf `testimonial`-Dokumente, dieselben wie auf der Startseite, nur anders ausgewählt. Ein Name statt „Name folgt“, das Porträt über `Portrait` (Initialen ohne Bild). Ohne Zitat fällt der Abschnitt weg. Bisher hat niemand zugesagt, also startet die Seite ohne ihn.
- **Anfragen:** wie bei der Partnerseite ein Objekt mit E-Mail-Adresse und Betreff, beide Pflicht. Der Button „Jetzt melden“ einer Aufgabe hängt ihren Titel an den Betreff („Ehrenamt bei der TSG Irlich: Schiedsrichter/in“). Die Karte „Nichts Passendes dabei?“ nimmt den Betreff, wie er ist.
- **Keine eigene Adresse pro Aufgabe.** Alle Meldungen gehen an die eine Adresse der Seite.
- **Icons:** `PARTNER_ICONS` wird zu einer allgemeinen Liste der Seiten-Icons (Name zum Beispiel `PAGE_ICONS`, mit passender Web-Komponente). Sie bekommt die Icons des Prototyps dazu: Doktorhut, Glühbirne, Auszeichnung, Hantel, Flagge, Gebäude und Party. Die Partnerseite nutzt dieselbe Liste weiter; ihre gespeicherten Werte bleiben gültig.
- **Keine Vorschau** im Presentation Tool, wie bei `partnerPage`. Die Seite liest über `client.fetch`.
- **Hero-Bild** ist Pflicht. Der Startinhalt nimmt das Hero-Bild von `aboutUs`.
- **Bilder der Bereiche** sind Pflicht. Der Startinhalt nimmt die Gruppenbilder und Seitenbilder des Prototyps (1. Mannschaft, A-Jugend, Fallback-Bild, erstes Visionsbild), bis die Redaktion eigene wählt.
- **Kartenzahlen:** Das Studio warnt im ersten Abschnitt bei einer anderen Zahl als 6 Gründen und bei „Aktuell gesucht“ bei einer anderen Zahl als 3 Schritten. Die Bereiche wechseln links und rechts und funktionieren mit jeder Anzahl, dort gibt es keine Warnung.
- **Suche:** Die Seite ist Teil der Website-Suche. Durchsucht werden die Texte der Seite und die Titel der veröffentlichten Aufgaben, damit „Schiedsrichter“ oder „Übungsleiter“ sie findet. Die Aufgaben sind keine eigenen Treffer.
- **Sitemap:** statischer Eintrag `/verein/ehrenamt`, wie bei der Partnerseite.
- **Newsletter** behält seine Texte im Code. Er ist ein geteilter Abschnitt.
- **Startinhalt in production ohne Aufgaben:** Die vier Aufgaben des Prototyps sind Platzhalter. Das Skript legt sie nur auf ausdrücklichen Wunsch an (Option, für `development`, e2e und Screenshots), in production nicht.

## Aufbau der Seite

1. **Hero**: Titel, Untertitel und Bild aus dem Singleton.
2. **Gemeinsam mehr erreichen** (Variante A, erster Abschnitt): heller Hintergrund (`bg-background-low-contrast`). Links Abschnittskopf, Intro und Button „Offene Aufgaben ansehen“ (Sprung zu `#aktuell-gesucht`). Rechts ein Raster aus Karten mit Icon, Titel und Text, auf breiten Bildschirmen 3 Spalten, dazwischen 2, auf dem Handy 1. Beim Hover wird eine Karte blau.
3. **Stimmen aus dem Verein** (B): blaues Band mit dem Hintergrund der Ansprechpartner, Abschnittskopf und Intro, bis zu drei Zitatkarten mit Name, Rolle und Porträt. Die mittlere Karte steht auf dem Desktop leicht höher. Mehr als drei Zitate laufen in weitere Reihen.
4. **So kannst du dich einbringen** (B): Abschnittskopf und Intro, darunter die Bereiche abwechselnd links und rechts: Bild mit Icon-Plakette, Ziffer mit Kontur, Titel, Text, Beispielaufgaben als Chips.
5. **Aktuell gesucht** (B): Hintergrund wie die Downloads der Mitgliedschaft. Links, auf dem Desktop beim Scrollen stehend, Abschnittskopf, Intro und die nummerierten Schritte. Rechts das Akkordeon der Aufgaben (die erste ist offen) und darunter die gestrichelte Karte „Nichts Passendes dabei?“ als Mail-Link. Eine geöffnete Aufgabe zeigt Bereich und Zeitaufwand als Badges, den Anreißer, die drei Listen „Deine Aufgaben“, „Das bringst du mit“, „Das bieten wir“ und den Button „Jetzt melden“.
6. **Ansprechpartner**: `ContactPersons` wie überall.
7. **Newsletter**.

## Inhalt des Singletons `volunteerPage`

Alle Felder mit deutschen Titeln und Beschreibungen. Die Tabs folgen `apps/studio/AGENTS.md` (Allgemein, Inhalt bzw. eigene Tabs, SEO & Teilen; `schemas/groups.test.ts` prüft sie).

- **Allgemein:** Titel, Untertitel (`defaultHeroFields`), Hero-Bild (`getHeroImageField(LANDSCAPE_HERO_DESCRIPTION)`), versteckter Slug `ehrenamt`.
- **Anfragen:** E-Mail-Adresse (Pflicht, gültige Adresse, vorbelegt `info@tsg-irlich.de`), Betreff (Pflicht, vorbelegt „Ehrenamt bei der TSG Irlich“).
- **Gründe:** Abschnittskopf (`getDefaultPageSectionFieldsWithGroup`), Button-Text „Offene Aufgaben ansehen“, Karten mit Titel, Text und Icon; Warnung bei einer Anzahl ungleich 6.
- **Stimmen:** Abschnittskopf, Referenzen auf `testimonial` (optional).
- **Bereiche:** Abschnittskopf, Bereiche mit Titel, Text, Bild (Pflicht, mit Alt-Text), Icon und Beispielaufgaben (Liste kurzer Texte).
- **Aktuell gesucht:** Abschnittskopf; Schritte mit Titel und Text (Warnung bei einer Anzahl ungleich 3); die drei Listenüberschriften der Aufgaben; Button-Text „Jetzt melden“; Titel und Text der Karte „Nichts Passendes dabei?“.
- **Ansprechpartner:** `contactPersonsSectionField`.
- **SEO & Teilen:** `metaField`.

Welche Felder Pflicht sind, entscheidet der Builder. Der Maßstab ist derselbe wie bei der Partnerseite: Ein vollständig ausgefüllter Startinhalt zeigt nie leere Überschriften oder Buttons, und ein fehlender optionaler Text lässt sein Element weg.

## Inhalt des Dokumenttyps `volunteer.position`

- **Titel** (Pflicht), zum Beispiel „Schiedsrichter/in“.
- **Bereich** (Pflicht, kurzer Text), erscheint als Badge, zum Beispiel „Fußball“ oder „Vereinsorganisation“. Freitext statt Referenz auf `department`, weil nicht jeder Bereich eine Abteilung ist.
- **Zeitaufwand** (optional, kurzer Text), erscheint als Badge mit Uhr, zum Beispiel „wöchentlich, ca. 2 Std.“.
- **Anreißer** (Pflicht, Text).
- **Deine Aufgaben**, **Das bringst du mit**, **Das bieten wir**: je eine Liste kurzer Texte. Eine leere Liste fällt in der Aufgabe weg.
- Vorschau im Desk: Titel und Bereich.
- Sortierung im Desk: neueste zuerst, dazu nach Titel.

## Was sich wo ändert

**Shared**

- `partner-icons.ts` wird zur allgemeinen Icon-Liste mit den zusätzlichen Icons (Datei- und Exportname wählt der Builder), samt Test. Partnerseite und Studio ziehen um.

**Studio**

- Neues Schema `schemas/single-pages/volunteer-page/` (`index.ts`, `sections.ts`, `_groups.ts`, plus Test) nach dem Muster von `partner-page/`, registriert in `schemas/single-pages/index.ts`, mit eigenem Icon.
- Neues Schema `schemas/documents/volunteer.position.ts` (plus Test), registriert wie die anderen Dokumenttypen.
- `structure/pages.ts`: `volunteerPage` in `SINGLE_PAGES` (Elternseite `aboutUs`, Pfad `/verein/ehrenamt`) und in `PAGE_LAYOUT` unter „Verein“ → `pages` nach `partnerPage`. Eine neue Dokumentgruppe für `volunteer.position` in `structure/index.ts`, unter „Verein“ → `content` nach `echo`. Der Typ wird aus der allgemeinen Dokumentliste ausgenommen wie `echo.issue` und `faq`.
- `schemas/objects/internal-link.ts`: `volunteerPage` als Linkziel.
- Skript `scripts/create-volunteer-page.ts` (über `sanity exec`) nach dem Muster von `create-partner-page.ts`. Es schreibt den Startinhalt aus `_shared/content.ts` des Prototyps als Entwurf `drafts.volunteerPage`, mit dem Vorstand (Personen-IDs aus `_shared/data.ts` des Prototyps) als Ansprechpartnern. Es schreibt nichts, wenn die Seite oder ihr Entwurf schon existiert, und veröffentlicht nie. Mit einer Option legt es zusätzlich die vier Platzhalter-Aufgaben als Entwürfe an.

**Website**

- Route `apps/web/src/app/verein/ehrenamt/page.tsx` mit `generateMetadata` über `getPageMetadata` (Pfad `/verein/ehrenamt`, Hero-Bild als Fallback-Bild) und den Abschnitten in `_sections/`. Ohne veröffentlichtes Singleton: `notFound()`.
- GROQ mit `defineQuery` in `src/lib/sanity/queries/pages/volunteer.ts`: Singleton mit aufgelösten Zitaten und Ansprechpartnern, dazu die veröffentlichten Aufgaben. Danach `pnpm run extract-types && pnpm run typegen:sanity`.
- Die Mail-Hilfe der Partnerseite (`_shared/mail.ts`) und die Icon-Komponente (`_shared/partner-icon.tsx`) werden geteilt, statt sie zu kopieren. Wohin sie ziehen, entscheidet der Builder.
- `src/utils/links.ts`: `volunteerPage` → `/verein/ehrenamt` in `PATH_RESOLVERS`.
- `src/app/api/revalidate/route.ts`: `volunteerPage` und `volunteer.position` revalidieren `/verein/ehrenamt`; `testimonial` revalidiert zusätzlich `/verein/ehrenamt`.
- `src/lib/sanity/queries/search.ts`: `volunteerPage` in `SEARCH_PAGE_TYPES`, in beiden GROQ-Listen, im durchsuchten Text (Intros, Karten- und Bereichstexte, Titel der veröffentlichten Aufgaben) und in `contactPersonPageTypeList`.
- `src/app/sitemap.ts`: statischer Eintrag `/verein/ehrenamt`.

**Tests und Doku**

- Unit-Tests für Schemas, Abschnitte, Hilfsfunktionen, Linkziel, Revalidierung, Suche und Sitemap nach den Konventionen der Repo; die Coverage-Schwellen bleiben oder steigen.
- e2e: ein Spec für `/verein/ehrenamt` (Abschnitte, Akkordeon öffnet und schließt, Mail-Links mit Betreff). Die Seite ohne Zitate und ohne Aufgaben prüfen nur die Unit-Tests (`page.test.ts` und die Abschnittstests): Die e2e-Mocks liefern je Abfrage genau eine aufgenommene Antwort, und die Seite wird einmal je Build vorgerendert, also sieht ein e2e-Lauf nur einen Zustand. _(Meine Entscheidung nach dem Builder-Check.)_ Die Route kommt in die Axe-Prüfung und in `STATIC_ROUTES` der visuellen Specs (neues Layout: Zitatkarten, Bereiche im Wechsel, Akkordeon). Baselines beider Browser-Projekte im Playwright-Container. Die Fixtures werden aus `development` aufgenommen, nachdem dort Startinhalt und Platzhalter-Aufgaben veröffentlicht sind; für die Zitate braucht `development` mindestens ein referenziertes `testimonial`.
- `AGENTS.md` (root, web, studio) und `docs/SANITY_WEBHOOK_SETUP.md` (Typfilter beider Webhooks um `volunteerPage` und `volunteer.position`) beschreiben die Seite, den Dokumenttyp und das Skript.

## Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**

- `/verein/ehrenamt` zeigt die Seite im oben beschriebenen Aufbau, auf Desktop und Handy.
- Jeder sichtbare Text der Seite kommt aus dem Singleton oder einer Offenen Aufgabe. Ausnahmen sind nur feste Hinweise für Screenreader.
- Die Redaktion legt eine Aufgabe an, veröffentlicht sie, und sie erscheint auf der Seite. Nimmt sie die Veröffentlichung zurück, verschwindet die Aufgabe, ohne gelöscht zu sein.
- Jede Meldung öffnet eine Mail an die Adresse aus dem Studio mit passendem Betreff.
- Die Seite ist ein internes Linkziel, damit die Redaktion sie ins Menü „Verein“ hängen kann.
- Ändert die Redaktion das Singleton, eine Aufgabe, ein Zitat oder eine Person, aktualisiert sich die Seite über den Webhook.

**Nicht-Ziele**

- Ein Formular statt `mailto:` (der Formular-Baukasten aus WEB-278 bleibt außen vor).
- Ablaufdatum, eigene Ansprechpartner oder eigene Seiten für Aufgaben.
- Die „Digitale Talentkarte“ aus Philipps Kommentar.
- Vorschau im Presentation Tool.
- Der Menüeintrag selbst; den setzt die Redaktion.
- Das gelbe Statement-Band und die Porträtkarten auf Gelb aus Variante B.
- Ein Eintrag in `llms.txt`.

**Anti-Ziele**

- Platzhaltertexte oder erfundene Aufgaben gehen ungeprüft live. Deshalb liegt der Startinhalt in production nur als Entwurf, die Platzhalter-Aufgaben kommen dort gar nicht hin, und die Seite antwortet mit 404, solange kein veröffentlichtes Singleton existiert.
- Ein erfundenes Zitat oder „Name folgt“ steht auf der Seite.
- Ein Button oder Sprunglink führt ins Leere, etwa „Offene Aufgaben ansehen“ ohne Aufgaben.
- Ein Text der Seite steht fest im Code.

## Livegang

1. PR nach `next`. Vorher in `development`: Skript mit Platzhalter-Aufgaben laufen lassen, Entwurf und Aufgaben veröffentlichen, ein Zitat zuordnen, e2e-Fixtures aufnehmen.
2. Webhook-Filter staging um `volunteerPage` und `volunteer.position` ergänzen (liegt in Sanity; vorher OK des Nutzers).
3. Release `next` → `main` im üblichen Ablauf.
4. Webhook-Filter production ebenso ergänzen (vorher OK des Nutzers).
5. Skript gegen production ohne Platzhalter-Aufgaben: Entwurf anlegen. Befehl und Dataset vorher nennen.
6. Redaktion: Texte prüfen, echte Aufgaben anlegen, Zitate zuordnen, Seite veröffentlichen, ins Menü „Verein“ hängen, „SEO & Teilen“ füllen.
7. Linear-Kommentar auf Deutsch mit Screenshots (Desktop und Handy), Ticket nach Freigabe auf Done. Danach kann der Prototyp-Branch weg.

## Dem Builder überlassen

- Schnitt der Abschnitts-Komponenten und Dateinamen unter `_sections/`.
- Welche Felder Pflicht sind (Maßstab oben) und die genauen Grenzen der Textlängen.
- Name und Ort der allgemeinen Icon-Liste und der geteilten Mail- und Icon-Hilfen.
- Wie das Skript die Platzhalter-Aufgaben anbietet (Option, Name).
- Wie die Suche die Titel der Aufgaben in den Suchtext holt.
