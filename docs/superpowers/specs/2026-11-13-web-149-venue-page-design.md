# Sportstättenseite — Design-Spec

Datum: 2026-11-13 · Status: Entwurf · Ticket: [WEB-149](https://linear.app/tsg-irlich/issue/WEB-149/sportstatten-als-eigene-seite) · Prototyp: Branch `feat/web-149-venues-page-prototype`, Route `/verein/sportstaetten-prototyp?variant=A`

Scope: eine neue Seite `/verein/sportstaetten`, die alle Sportstätten der TSG zeigt: das Pappelstadion und das Pappelstübchen als Heimat des Vereins, darunter alle weiteren Hallen und Plätze mit den Gruppen, die dort trainieren. Die Texte der Seite pflegt die Redaktion in einem neuen Singleton. Die Fakten einer Sportstätte (Art, Ausstattung, Öffnungszeiten) bekommt der bestehende Dokumenttyp `venue` als neue Felder.

## Warum

Der Verein (Philipp Pfeiffer, Vorstand Öffentlichkeitsarbeit, und Sophie Thomé, PR-Team) möchte die Sportstätten auf einer eigenen Seite zeigen. Heute stehen sie nur verstreut in den Trainingszeiten der Gruppenseiten. Besucher sollen sehen, wo die TSG zu Hause ist, wo welche Gruppe trainiert und wie man hinkommt. Vorlagen waren ein von ChatGPT erzeugtes Bild (2026-01-26) und Philipps Entwurf vom 2026-10-01. Am 2026-11-08 entstanden daraus zwei Prototypen mit echten Daten aus Sanity. Am 2026-11-12 hat der Verein entschieden:

- komplett Variante A „Vertraut“,
- der Bereich „Pappelstadion & Pappelstübchen“ wird optisch angepasst, damit unter dem Bild kein großer Weißraum bleibt.

Die alte WordPress-Seite hatte keine Sportstättenseite (keine Altadresse in `legacy-redirects.ts`).

## Ausgangslage

- **Prototyp** (`apps/web/src/app/verein/sportstaetten-prototyp/` auf dem Prototyp-Branch): `page.tsx`, `_shared/data.ts` (GROQ als Strings, ohne TypeGen; Pappelstadion und Pappelstübchen über feste IDs), `_shared/content.ts` (alle Texte fest im Code), `_shared/venue-utils.ts` (Typ-Labels, Wochentage, Gruppen-Link, Adresszeilen), `_shared/venue-parts.tsx` (Bild, Adresse, Route-Button, Gruppen-Chips, Wochentage, Ausstattungsliste), `_variants/variant-a.tsx`. Der Branch wird nicht gemergt; er ist Vorlage für Layout und Startinhalt.
- **Direkte Vorbilder** sind die Partnerseite (WEB-326, #787, Spec `2026-11-12-web-326-partner-page-design.md`) und die Ehrenamtsseite (WEB-190, #789, Spec `2026-11-13-web-190-volunteer-page-design.md`): Singleton unter `apps/studio/schemas/single-pages/<name>/` (`index.ts`, `sections.ts`, `_groups.ts`, Tests), Anfrage-Objekt mit E-Mail und Betreff, Seite unter `apps/web/src/app/verein/<pfad>/` mit `_sections/`, Query mit `defineQuery` unter `src/lib/sanity/queries/pages/`, Startinhalt per `apps/studio/scripts/create-<name>.ts` (mit `start-content.ts` und Test) nur als Entwurf, 404 ohne veröffentlichtes Dokument. Die Verdrahtung läuft über `SINGLE_PAGES` und `PAGE_LAYOUT` (`apps/studio/structure/pages.ts`), `internal-link.ts`, `PATH_RESOLVERS` und eine `*_PAGE_PATH`-Konstante (`apps/web/src/utils/links.ts`), `REVALIDATION_MAP` (`apps/web/src/app/api/revalidate/route.ts`), `SEARCH_PAGE_TYPES`, `searchPageTypeList` und `contactPersonPageTypeList` (`apps/web/src/lib/sanity/queries/search.ts`), `sitemap.ts`, e2e, Axe und die visuellen Baselines.
- **Dokumenttyp `venue`** (`apps/studio/schemas/documents/venue.ts`, bisher ohne Test): Name, Beschreibung (`simpleBlockContent`, Pflicht), Art (Liste: Sporthalle mit 1/2/3 Feldern, Aschen-, Hybridrasen-, Kunstrasen-, Rasenplatz), Bild (`extendedImage`), Standort (Name plus `postalAddressFields`). Gruppen verweisen über ihre Trainingszeiten auf eine Sportstätte (`group.training.trainingTimes[].venue`, dazu `weekday` und `season` mit `yearly`/`summer`/`winter`). Im Desk steht `venue` in der allgemeinen Dokumentliste.
- **Wo Sportstätten heute erscheinen:** nur über die Trainingszeiten der Gruppenseiten (`training-card.tsx`: Name und Adresse), in `structured-data.ts` (Name und Adresse) und in `llms.txt` (Name). Die Beschreibung einer Sportstätte erscheint nirgends auf der Website. `venue` revalidiert heute nur `/angebot` und die Gruppenseiten.
- **Daten in production** (10 Sportstätten): Pappelstadion (`2f1440fa-…`, Aschenplatz, 6 Gruppen), Vereinsheim Pappelstübchen (`968c56f9-…`, als „Aschenplatz“ eingetragen, keine Gruppe), 5 Hallen (Gymnastikhalle Grundschule Feldkirchen ohne Gruppe; Turnhalle Niederbieber und Turnhalle Sonnenlandschule ohne Foto), 3 Plätze. Die Beschreibung des Pappelstadions hat drei Absätze, die letzten beiden handeln vom Wunsch nach einem Kunstrasen. Die Beschreibung des Pappelstübchens nennt Feiern und die Pächterin mit Telefonnummer. Die Beschreibung des Sportplatzes Feldkirchen nennt die Schillerstraße, die Adresse ist aber Thomas-Mann-Straße 3.
- **Bausteine, die es schon gibt:** `Hero`, `SectionHeader`, `ButtonLink`, `PortableText`, `ContactPersons` (blauer Abschnitt mit `contactPersonsSectionField`), `Newsletter`, `GoToGoogleMaps` (Dialog „Route planen“, `components/section/go-to-google-maps`), `groups.module.css` der Gruppenübersicht (Hintergrund des Abschnitts mit den Karten), `getInternalHref` für Gruppenlinks, `buildMailtoHref` bzw. die Mail-Hilfe aus `src/utils/mail.ts`, das Fallback-Bild der Website-Einstellungen (`siteImagesQuery`, `fallbackImage`), das die Gruppenkarten für Gruppen ohne Bild nutzen.
- **Schon abgedeckt:** BotID schützt `/verein/*`, der Newsletter funktioniert dort also. `person` und `aboutUs` revalidieren `/verein` als Layout und erreichen damit auch die neue Seite; `site-settings` revalidiert `/` als Layout.

## Entscheidungen

Vom Nutzer entschieden (2026-11-12 mit dem Verein, 2026-11-13 im Gespräch):

| Frage | Entscheidung |
| --- | --- |
| Variante | Komplett Variante A „Vertraut“. |
| Zähler (Sportstätten, Hallen, Plätze, Gruppen) aus A | Entfällt. |
| Welche weiteren Sportstätten erscheinen | Alle automatisch: jede Sportstätte außer den beiden im Heimat-Block. Eine neue Sportstätte erscheint ohne Zutun der Redaktion, auch eine ohne Gruppe (Gymnastikhalle Feldkirchen). |
| Weißraum im Heimat-Block | Mockup-Variante 2 „Details als Leiste darunter“: oben Bild neben Art, Name und Beschreibung, darunter über die volle Breite eine Leiste mit Ausstattung, Adresse mit „Route planen“ und „Hier trainieren“, danach der Kasten. |
| Pappelstübchen mieten | Nach Rücksprache mit dem Verein aktuell nicht möglich. Kein Miet-Text, kein Button, keine Felder für die Pächterin. |
| Bauweise | Wie Partner- und Ehrenamtsseite: Singleton für die Seitentexte, neue Felder an `venue` für die Fakten einer Sportstätte, Startinhalt als Entwurf per Skript, 404 bis zur Veröffentlichung. |

Als meine Entscheidung festgehalten:

- **Adresse:** `/verein/sportstaetten`.
- **Singleton** `venuePage`, Studio-Titel „Sportstätten“, fester versteckter Slug `sportstaetten`. In `SINGLE_PAGES` eine Unterseite von „Über uns“ mit dem Pfad `/verein/sportstaetten`, im Desk unter „Verein“ → „Unterseiten“ nach der Ehrenamtsseite.
- **Heimat-Block:** Das Singleton referenziert die beiden Heimat-Sportstätten (Pflicht, genau zwei, keine doppelt). Die erste steht mit Bild links, die zweite gespiegelt mit Bild rechts. Der Kunstrasen-Kasten gehört zur ersten, der Kasten mit den Öffnungszeiten zur Sportstätte mit Öffnungszeiten (siehe unten). Das ersetzt die festen IDs des Prototyps.
- **Neue Felder an `venue`:**
  - Art bekommt den Wert „Vereinsheim“ (`clubhouse`).
  - **Ausstattung**: Liste kurzer Texte (optional).
  - **Öffnungszeiten**: Liste von Zeilen mit „Tage“ und „Zeit“ (optional), im Studio nur sichtbar, wenn die Art „Vereinsheim“ ist.
- **Beschreibung:** Die Seite zeigt im Heimat-Block die ganze Beschreibung der Sportstätte, nicht nur den ersten Absatz wie der Prototyp. Sie erscheint sonst nirgends, die Redaktion kürzt sie beim Livegang (siehe Livegang). Die Karten der weiteren Sportstätten zeigen keine Beschreibung, wie in Variante A.
- **Kunstrasen-Kasten:** optionales Objekt im Singleton mit Titel, Text und Linktext. Der Link öffnet eine Mail an die Adresse aus dem Anfrage-Objekt mit dessen Betreff. Ohne Titel und Text fällt der Kasten weg. Sein Symbol (Funkeln) steht fest im Code.
- **Öffnungszeiten-Kasten:** erscheint bei einer Heimat-Sportstätte mit mindestens einer Zeile Öffnungszeiten. Ohne Zeilen fällt er weg.
- **Gruppierung der weiteren Sportstätten:** „Hallen“ sind alle Arten `hall-*`, „Plätze“ alle Platzarten (Aschen-, Hybridrasen-, Kunstrasen-, Rasenplatz). Eine Gruppe ohne Sportstätte fällt weg. Ein Vereinsheim, das nicht im Heimat-Block steht, erscheint nicht (es ist weder Halle noch Platz; heute gibt es nur eines). Innerhalb einer Gruppe nach Name sortiert.
- **Gruppen einer Sportstätte:** jede veröffentlichte Gruppe mit Slug, die in einer ihrer Trainingszeiten auf die Sportstätte verweist, nach Titel sortiert, verlinkt auf ihre Gruppenseite. Die Trainingstage (Mo–So) sind alle Wochentage dieser Trainingszeiten über alle Saisons, wie im Prototyp.
- **Fehlendes Foto:** Statt der Plakette „Noch kein Foto“ des Prototyps zeigt eine Sportstätte ohne Bild das Fallback-Bild der Website-Einstellungen, wie die Gruppenkarten.
- **Feste Beschriftungen bleiben im Code:** „Route planen“, „Hier trainieren“, „Das bietet …“ (Leiste), „So findest du hin“, „Öffnungszeiten“, „Hallen“, „Plätze“, „+ n weitere“ und die Typ-Labels der Arten. Sie sind Bedienelemente wie „Route planen“ auf den Gruppenseiten, keine redaktionellen Texte. Alles andere (Hero, Abschnittsköpfe, Intros, Kunstrasen-Kasten, Ansprechpartner) pflegt die Redaktion. Das weicht bewusst von der Ehrenamtsseite ab, deren Listenüberschriften im Singleton stehen.
- **Anfragen:** Objekt mit E-Mail-Adresse (Pflicht, vorbelegt `info@tsg-irlich.de`) und Betreff (Pflicht, vorbelegt „Frage zu den Sportstätten der TSG Irlich“). Heute nutzt es nur der Kunstrasen-Kasten.
- **Desk:** Die Sportstätten-Dokumente ziehen aus der allgemeinen Dokumentliste unter „Verein“ → „Inhalte“, neben TSG-Echo und Offene Aufgaben (`content` in `PAGE_LAYOUT`, eigener Eintrag in `structure/index.ts`, Ausnahme in `isExcludedDefaultListItem`).
- **Keine Vorschau** im Presentation Tool, wie bei `partnerPage` und `volunteerPage`. Die Seite liest über `client.fetch`.
- **Hero-Bild** ist Pflicht. Der Startinhalt nimmt das Bild des Pappelstadions.
- **Suche:** Die Seite ist Teil der Website-Suche. Durchsucht werden die Intros der Seite. Die Namen der Sportstätten führen ebenfalls auf die Seite, damit „Mehrzweckhalle“ oder „Pappelstadion“ sie findet; die Sportstätten sind keine eigenen Treffer (Muster wie `volunteer.position` → `volunteerPage`).
- **Sitemap:** statischer Eintrag `/verein/sportstaetten`, wie bei Partner- und Ehrenamtsseite.
- **Newsletter** behält seine Texte im Code. Er ist ein geteilter Abschnitt.

## Aufbau der Seite

1. **Hero**: Titel, Untertitel und Bild aus dem Singleton.
2. **Unsere Heimat**: Abschnittskopf (Untertitel, Titel, Intro) zentriert. Darunter je Heimat-Sportstätte ein Block:
   - **Oben** zwei Spalten: Bild (Querformat, etwa 16:10, abgerundet, mit Schatten) und daneben, vertikal mittig, die Art als Kicker (zum Beispiel „Aschenplatz“, „Vereinsheim“), der Name als große Überschrift und die Beschreibung. Beim zweiten Block steht das Bild rechts.
   - **Leiste** über die volle Breite, mit Trennlinie oben: „Das bietet …“ mit der Ausstattung als Häkchenliste, „So findest du hin“ mit Adresse und „Route planen“, „Hier trainieren“ mit den Gruppen als Chips. Eine Spalte ohne Inhalt fällt weg, die übrigen teilen sich die Breite.
   - **Kasten** über die volle Breite: beim ersten Block der Kunstrasen-Kasten (blau, mit Link „Sprich uns an …“), beim Vereinsheim der Kasten Öffnungszeiten (Rahmen, Tabelle Tage/Zeit).
   - **Handy**: alles untereinander: Bild, Kicker, Name, Beschreibung, die Spalten der Leiste, der Kasten.
3. **Weitere Sportanlagen**: Hintergrund der Gruppenübersicht. Abschnittskopf zentriert, darunter „Hallen (n)“ und „Plätze (n)“ als Zwischenüberschriften, je ein Raster aus Bildkarten (Desktop 3, Tablet 2, Handy 1 Spalte). Eine Karte: Bild mit Verlauf, darauf Art als gelbe Plakette und Name; darunter Adresse, Trainingstage Mo–So (aktive Tage blau, für Screenreader als Liste der Namen), bis zu 4 Gruppen als Chips und „+ n weitere“, unten „Route planen“. Eine leere Gruppe (keine Hallen bzw. keine Plätze) fällt weg.
4. **Ansprechpartner**: `ContactPersons` wie überall.
5. **Newsletter**.

## Inhalt des Singletons `venuePage`

Alle Felder mit deutschen Titeln und Beschreibungen. Die Tabs folgen `apps/studio/AGENTS.md` (Allgemein, Inhalt bzw. eigene Tabs, SEO & Teilen; `schemas/groups.test.ts` prüft sie).

- **Allgemein:** Titel, Untertitel (`defaultHeroFields`), Hero-Bild (`getHeroImageField(LANDSCAPE_HERO_DESCRIPTION)`), versteckter Slug `sportstaetten`.
- **Heimat:** Abschnittskopf (`getDefaultPageSectionFieldsWithGroup`), Referenzen auf genau zwei Sportstätten, Kunstrasen-Kasten (Titel, Text, Linktext).
- **Weitere Sportanlagen:** Abschnittskopf.
- **Ansprechpartner:** `contactPersonsSectionField`.
- **Anfragen:** E-Mail-Adresse und Betreff (siehe oben).
- **SEO & Teilen:** `metaField`.

Welche Felder Pflicht sind, entscheidet der Builder. Der Maßstab ist derselbe wie bei Partner- und Ehrenamtsseite: Ein vollständig ausgefüllter Startinhalt zeigt nie leere Überschriften oder Buttons, und ein fehlender optionaler Text lässt sein Element weg.

## Was sich wo ändert

**Studio**

- `schemas/documents/venue.ts`: Art „Vereinsheim“, Felder Ausstattung und Öffnungszeiten (Öffnungszeiten versteckt, wenn die Art nicht „Vereinsheim“ ist), dazu ein neuer Test `venue.test.ts`. Die Beschreibung bekommt einen Hinweis, dass sie auf der Sportstättenseite erscheint.
- Neues Schema `schemas/single-pages/venue-page/` (`index.ts`, `sections.ts`, `_groups.ts`, plus Test) nach dem Muster von `volunteer-page/`, registriert in `schemas/single-pages/index.ts`, mit eigenem Icon.
- `structure/pages.ts`: `venuePage` in `SINGLE_PAGES` (Elternseite `aboutUs`, Pfad `/verein/sportstaetten`) und in `PAGE_LAYOUT` unter „Verein“ → `pages` nach `volunteerPage`; `venue` als neuer Inhalt unter „Verein“ → `content`. `structure/index.ts`: Eintrag „Sportstätten“ für die Dokumente, `venue` in `isExcludedDefaultListItem`.
- `schemas/objects/internal-link.ts`: `venuePage` als Linkziel.
- Skript `scripts/create-venue-page.ts` (über `sanity exec`, mit `create-venue-page/start-content.ts` und Test) nach dem Muster von `create-volunteer-page.ts`. Es schreibt den Startinhalt aus `_shared/content.ts` des Prototyps als Entwurf `drafts.venuePage`: Pappelstadion und Pappelstübchen als Heimat-Sportstätten, das Bild des Pappelstadions als Hero-Bild, der Vorstand (wie im Prototyp aus `aboutUs` gefiltert) als Ansprechpartner. Es schreibt nichts, wenn die Seite oder ihr Entwurf schon existiert, veröffentlicht nie und ändert keine Sportstätte. Die Heimat-Sportstätten findet es über ihre IDs aus dem Prototyp; fehlt eine im Ziel-Dataset, bricht es mit einer klaren Meldung ab.
- `pnpm run extract-types && pnpm run typegen:sanity` danach.

**Website**

- Route `apps/web/src/app/verein/sportstaetten/page.tsx` mit `generateMetadata` über `getPageMetadata` (Pfad `/verein/sportstaetten`, Hero-Bild als Fallback-Bild, Intro des Heimat-Blocks als Fallback-Beschreibung) und den Abschnitten in `_sections/`. Ohne veröffentlichtes Singleton: `notFound()`.
- GROQ mit `defineQuery` in `src/lib/sanity/queries/pages/venue.ts`: Singleton mit aufgelösten Heimat-Sportstätten und Ansprechpartnern, dazu alle Sportstätten mit ihren Gruppen und deren Trainingszeiten an genau dieser Sportstätte (Muster aus `_shared/data.ts` des Prototyps) und das Fallback-Bild.
- Die Bausteine des Prototyps (`venue-utils.ts`, `venue-parts.tsx`) ziehen sauber und getestet unter `_shared/` bzw. `_sections/` der Route. Wohin genau, entscheidet der Builder.
- `src/utils/links.ts`: `VENUE_PAGE_PATH = '/verein/sportstaetten'`, `venuePage` in `PATH_RESOLVERS`.
- `src/app/api/revalidate/route.ts`: `venuePage` revalidiert die Seite; `venue` revalidiert sie zusätzlich zu `/angebot`; `group` revalidiert sie zusätzlich zu den Angebotsseiten (Gruppen-Chips und Trainingstage).
- `src/lib/sanity/queries/search.ts`: `venuePage` in `SEARCH_PAGE_TYPES`, in beiden GROQ-Listen, im durchsuchten Text (Intros) und in `contactPersonPageTypeList`; die Namen der Sportstätten als Kandidaten, die auf die Seite führen.
- `src/app/sitemap.ts`: statischer Eintrag `/verein/sportstaetten`.

**Tests und Doku**

- Unit-Tests für Schemas, Abschnitte, Hilfsfunktionen (Gruppierung, Trainingstage, Adresszeilen, Typ-Labels), Linkziel, Revalidierung, Suche und Sitemap nach den Konventionen der Repo; die Coverage-Schwellen bleiben oder steigen.
- e2e: ein Spec für `/verein/sportstaetten` (Abschnitte, „Route planen“ öffnet den Dialog, ein Gruppen-Chip führt auf die Gruppenseite, Mail-Link des Kunstrasen-Kastens mit Betreff). Die Route kommt in die Axe-Prüfung und in `STATIC_ROUTES` der visuellen Specs; Baselines beider Browser-Projekte im Playwright-Container. Die Fixtures werden aus `development` aufgenommen, nachdem dort der Startinhalt veröffentlicht ist und das Pappelstübchen die Art „Vereinsheim“ mit Ausstattung und Öffnungszeiten hat.
- `AGENTS.md` (root, web, studio) und `docs/SANITY_WEBHOOK_SETUP.md` (Typfilter beider Webhooks um `venuePage`; `venue` und `group` stehen schon drin, sonst ergänzen) beschreiben die Seite, die neuen Felder und das Skript.

## Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**

- `/verein/sportstaetten` zeigt die Seite im oben beschriebenen Aufbau, auf Desktop und Handy, ohne großen Weißraum im Heimat-Block.
- Jede Sportstätte, die nicht im Heimat-Block steht, erscheint automatisch als Halle oder Platz.
- Jede Gruppe, die an einer Sportstätte trainiert, steht dort mit Link zu ihrer Gruppenseite; die Trainingstage stimmen mit den Trainingszeiten überein.
- Die Redaktion pflegt Hero, Abschnittsköpfe, Intros, Kunstrasen-Kasten, Ansprechpartner, Ausstattung und Öffnungszeiten im Studio.
- Die Seite ist ein internes Linkziel, damit die Redaktion sie ins Menü „Verein“ hängen kann.
- Ändert die Redaktion das Singleton, eine Sportstätte, eine Gruppe oder eine Person, aktualisiert sich die Seite über den Webhook.

**Nicht-Ziele**

- Die Zähler aus Variante A.
- Vermietung des Pappelstübchens, Felder für die Pächterin.
- Der Abschnitt „Anfahrt“ aus Variante B.
- Eine Karte (bräuchte Koordinaten und eine Einwilligung wegen Datenschutz), Platz- oder Hallenordnung als Download, Infos zur Barrierefreiheit (Ideen aus dem Prototyp-Kommentar, für später).
- Eigene Seiten pro Sportstätte.
- Strukturierte Daten (JSON-LD) für die Sportstätten auf dieser Seite und ein Eintrag in `llms.txt`.
- Vorschau im Presentation Tool.
- Der Menüeintrag selbst; den setzt die Redaktion.
- Inhaltliche Korrekturen an den Sportstätten (Beschreibungen, Fotos, Art des Pappelstübchens) im Code; sie gehören in den Livegang.

**Anti-Ziele**

- Platzhaltertexte gehen ungeprüft live. Deshalb liegt der Startinhalt in production nur als Entwurf, und die Seite antwortet mit 404, solange kein veröffentlichtes Singleton existiert.
- Eine Sportstätte zeigt „Noch kein Foto“ oder ein leeres Bildfeld.
- Ein Button führt ins Leere, etwa „Route planen“ ohne Adresse oder ein Gruppen-Chip ohne Gruppenseite.
- Die Seite bietet das Mieten des Pappelstübchens an.
- Pappelstadion oder Pappelstübchen stehen als feste IDs im Code der Website.
- Name oder Telefonnummer der Pächterin landen in einer committeten e2e-Fixture oder Baseline. Das Repo ist öffentlich, die Git-Historie behält sie dauerhaft. _(Meine Entscheidung nach dem Builder-Check: `development` wird vor der Aufnahme bereinigt, statt Fixtures nachträglich zu bearbeiten oder Bereiche der Baselines zu maskieren.)_

## Livegang

1. PR nach `next`. Vorher in `development`: Schema deployen; beim Pappelstübchen Art „Vereinsheim“ setzen, Ausstattung und Öffnungszeiten füllen und die Beschreibung ohne Feiern, Pächterin und Telefonnummer schreiben; beim Pappelstadion Ausstattung füllen und die Beschreibung auf den ersten Absatz kürzen; Skript laufen lassen, Entwurf veröffentlichen, e2e-Fixtures aufnehmen. Jeder dieser Schreibschritte nur nach OK des Nutzers mit dem gezeigten Text. Die Bereinigung muss vor der Aufnahme passieren, denn Fixtures und Baselines werden in ein öffentliches Repo committet.
2. Webhook-Filter staging um `venuePage` ergänzen (liegt in Sanity; vorher OK des Nutzers).
3. Release `next` → `main` im üblichen Ablauf.
4. Webhook-Filter production ebenso ergänzen (vorher OK des Nutzers).
5. Skript gegen production: Entwurf anlegen. Befehl und Dataset vorher nennen.
6. Redaktion (oder ich mit OK des Nutzers) in production:
   - Pappelstübchen: Art „Vereinsheim“, Öffnungszeiten, Ausstattung; die Beschreibung ohne Feiern und Telefonnummer der Pächterin.
   - Pappelstadion: Ausstattung; die Beschreibung ohne die beiden Kunstrasen-Absätze (die stehen im Kasten).
   - Sportplatz Feldkirchen: Straße in der Beschreibung korrigieren.
   - Fotos für Turnhalle Niederbieber und Turnhalle Sonnenlandschule nachreichen (bis dahin das Fallback-Bild).
   - Texte prüfen, Seite veröffentlichen, ins Menü „Verein“ hängen, „SEO & Teilen“ füllen.
7. Linear-Kommentar auf Deutsch mit Screenshots (Desktop und Handy), Ticket nach Freigabe auf Done. Danach kann der Prototyp-Branch weg.

## Dem Builder überlassen

- Schnitt der Abschnitts-Komponenten und Dateinamen unter `_sections/` und `_shared/`.
- Welche Felder Pflicht sind (Maßstab oben) und die genauen Grenzen der Textlängen.
- Das genaue Seitenverhältnis des Bildes im Heimat-Block und die Spaltenbreiten der Leiste.
- Wie die Suche die Namen der Sportstätten auf die Seite führt.
- Wie die GROQ-Abfrage die Gruppen und Trainingszeiten je Sportstätte holt, solange TypeGen sie typisiert.
