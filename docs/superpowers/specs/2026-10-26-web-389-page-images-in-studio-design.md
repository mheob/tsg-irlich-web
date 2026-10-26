# Seitenbilder redaktionell pflegbar — Design-Spec

Datum: 2026-10-26 · Status: entschieden, noch nicht umgesetzt · Ticket: [WEB-389](https://linear.app/tsg-irlich/issue/WEB-389/seitenbilder-redaktionell-im-studio-pflegbar) · Verwandt: [WEB-384](https://linear.app/tsg-irlich/issue/WEB-384/abteilungen-und-gruppen-im-studio-pflegbar) / #671 (Abteilungsbilder ins Studio, hat die Abteilungsdateien unter `public/og/angebot/groups/` entfernt; sein Rollout auf `production` steht noch aus), [WEB-353](https://linear.app/tsg-irlich/issue/WEB-353) (Echo-Hero)

Scope:

- Alle Inhaltsbilder, die heute als Datei in der Website liegen, werden im Studio gepflegt oder gelöscht. Das sind `apps/web/src/images`, `apps/web/public/og` sowie die Hero-Bilder von News (`app/news/_assets`) und den Rechtsseiten (`app/(legal)/_shared`).
- Dazu kommen die Migration der heutigen Bilder in beide Datasets, alles auf der Website, was diese Dateien heute importiert, und das Hero-Bild als Ersatz-Vorschaubild für Seiten ohne eigenes Open-Graph-Bild.

## Warum

Die Bilder der Website sollen in gewissen Abständen ausgetauscht werden, etwa weil eine abgebildete Person nicht mehr zum Verein gehört. Heute geht das nur mit Entwickler und Deployment. Die Redaktion soll ein Bild im Studio ersetzen und veröffentlichen können, und die Seite zeigt danach das neue Bild mit seinem Alt-Text.

## Ausgangslage

### Bilder im Code

Alle Dateien sind WebP und werden statisch importiert (`StaticImageData`). Die Pfade unter `src/images` sind relativ zu `apps/web/src/images`, die übrigen relativ zu `apps/web/src`.

| Datei | Größe | Verwendet in | Zeigt |
| --- | --- | --- | --- |
| `home/hero.webp` | 1394 × 2000, freigestellt | `app/_home/hero.tsx` | Taekwondo-Sportlerin, Tänzerin und Fußballer (Ausschnitt ohne Hintergrund) |
| `angebot/hero.webp` | 4094 × 2160 | `app/angebot/page.tsx`, außerdem `utils/fallback-image.ts` | Sporthalle mit Taekwondo-, Gymnastik- und Fußballgruppe |
| `verein/hero.webp` | 4094 × 2160 | `app/verein/page.tsx`, `app/verein/echo/_shared/hero.ts` (Echo-Übersicht und jede Ausgabe) | Luftaufnahme des Vereinsheims „Pappelstübchen“ mit Terrasse, dahinter der Sportplatz |
| `mitgliedschaft/hero.webp` | 4094 × 2160 | `app/mitgliedschaft/page.tsx` | Handschlag über einem Schreibtisch mit Klemmbrett |
| `kontakt/hero.webp` | 4094 × 2160 | `app/kontakt/page.tsx`, `app/kontakt/feedback/page.tsx` | MacBook, das das Kontaktformular der Website zeigt, daneben Telefon und Maus |
| `vision/vision-{1,2,3}.webp` | je 600 × 600 | `components/section/vision.tsx` (auf Home und Verein) | rund beschnitten, drei Größen |
| `contact/contact-{1,2,3}.webp` | je 600 × 600 | `components/section/contact-form.tsx` (auf Home und Kontakt, erst ab `lg` sichtbar) | rund beschnitten, drei Größen |
| `app/news/_assets/news-overview.webp` | 4096 × 2160 | `app/news/page.tsx`, `app/news/[category]/page.tsx` | Smartphone und Kugelschreiber auf einer Zeitung |
| `app/(legal)/_shared/hero.webp` | 4094 × 2160, byte-gleich mit `kontakt/hero.webp` | Impressum, Datenschutz, Barrierefreiheit | wie Kontakt |

Die Alt-Texte stehen im Code neben den Imports, und mehrere passen nicht zum Bild:

- Verein, Mitgliedschaft, Echo und die drei Rechtsseiten tragen den Alt-Text des Kontakt-Bildes („modernen Arbeitsplatz … MacBook Pro …“).
- Der Kontakt-Text selbst spricht von einem „ausgeschalteten Bildschirm“, auf dem Bildschirm ist aber das Kontaktformular zu sehen.
- `app/angebot/page.tsx` beschreibt ein „Schiedsrichter-Trikot“. Den passenden Text zum selben Bild hat `utils/fallback-image.ts`.

`utils/fallback-image.ts` (`OFFER_FALLBACK_IMAGE`) ist das Bild, das einspringt, wenn eine Abteilung oder Gruppe kein eigenes Bild hat. Es wird an zwei Stellen gelesen:

- `utils/hero-image.ts` (`getHeroImage`) für die Heros von `/angebot/[group]` und `/angebot/[group]/[singleGroup]`
- `components/ui/group-card.tsx` für die Kacheln auf `/angebot` und `/angebot/[group]`

### Ungenutzt

`public/og/angebot.webp`, `src/images/100x100.svg` und `src/images/yoga-tsg-irlich.de.webp` werden nirgends referenziert. #671 hat die übrigen Dateien unter `public/og` entfernt und dabei diese übersehen.

### Open Graph

Open-Graph-Bilder pflegt die Redaktion bereits über `meta.openGraphImage` an jedem Seiten-Dokument (`getPageMetadata` in `apps/web/src/utils/metadata.ts`). Die Singleton-Seiten übergeben kein Ersatzbild (`image`). Ohne gepflegtes OG-Bild hat eine solche Seite also keine Vorschau (`images: []`).

### Was es im Studio schon gibt

- Singletons pro Seite: `home`, `departmentsPage` (Angebot), `aboutUs` (Verein), `membership`, `contact`, `echoOverview`, `newsOverview`, `imprint`, `privacy`, `accessibility`, dazu `site-settings`. Ihre Seiten-Queries holen das Dokument mit `...`, neue Felder kommen also ohne Query-Änderung mit.
- `extendedImage` (`apps/studio/schemas/objects/extended-image.ts`): Bild mit Hotspot und Pflicht-Alt-Text. Abteilung und Gruppe nutzen es für `cardImage` und `heroImage`, Pflichtbilder mit `Rule.required().assetRequired().error(…)`.

### Revalidierung

`apps/web/src/app/api/revalidate/route.ts` kennt alle betroffenen Typen bis auf `accessibility`. Eine Änderung an der Barrierefreiheitsseite revalidiert deshalb nur `/`, und `accessibility` fehlt auch im Typfilter der Webhooks (`docs/SANITY_WEBHOOK_SETUP.md`). `site-settings` revalidiert das Root-Layout und damit jede Seite.

Staging (`next.tsg-irlich.de`, Branch `next`) liest das Dataset `development`, Produktion (`main`) liest `production`. `main` liegt hinter `next`, unter anderem fehlt #671. Dessen Migration auf `production` und die Umstellung des Produktions-Webhooks stehen noch aus.

## Entscheidungen

Vom Nutzer am 26.10.2026 bestätigt:

1. **Hero-Bilder** bekommen je ein Feld im vorhandenen Seiten-Dokument: Home, Angebot, Verein, Mitgliedschaft, Kontakt.
2. **Echo** zeigt weiter das Hero-Bild von Verein, **Feedback** das von Kontakt.
3. **Vision-Bilder (3)**, **Kontaktformular-Bilder (3)** und das **Ersatzbild** für Abteilungen und Gruppen werden einmal zentral gepflegt, nicht pro Seite.
4. **Alt-Texte** wandern mit ins Studio.
5. `src/images` und `public/og` entfallen komplett, die ungenutzten Dateien eingeschlossen.
6. Die heutigen Bilder werden **einmalig per Migration** hochgeladen, damit nach dem Umstieg keine Seite ohne Bild dasteht.
7. Die neuen Bildfelder sind **Pflichtfelder**.
8. Die Hero-Bilder von **News** und den drei **Rechtsseiten** ziehen ebenfalls ins Studio.
9. **Rollout:** `development` wird vor dem Merge nach `next` migriert. `production` wird direkt vor dem nächsten Release `next` → `main` migriert, zusammen mit der ausstehenden WEB-384-Migration.
10. **Open Graph:** Eine Seite ohne eigenes OG-Bild zeigt ihr Hero-Bild als Vorschau. Home ist ausgenommen, weil das freigestellte Hochformat als Vorschau nicht taugt.

## Ziele

- Jedes Inhaltsbild, das heute als Datei in der Website liegt, lässt sich im Studio tauschen, ohne Deployment.
- Nach dem Umstieg sieht die Website aus wie vorher, mit korrekten Alt-Texten.
- Ein getauschtes Bild erscheint nach dem Veröffentlichen auf allen Seiten, die es zeigen.

## Nicht-Ziele

- Ein eigenes Hero-Bild für die Echo-Seiten (WEB-353 bleibt offen).
- Favicon, Apple-Icon und `icon.svg` in `src/app`: Das ist Markenzeichen, kein redaktioneller Inhalt.
- Eine Mediathek oder ein Bildpool, aus dem die Redaktion wählt.
- Den Server-Zuschnitt der Abteilungs- und Gruppen-Heros (`getHeroImage`, 1920 × 600) ändern.

## Anti-Ziele

- Eine Seite bricht oder zeigt ein kaputtes `<img>`, weil ein Bild fehlt.
- Home und Verein zeigen unterschiedliche Vision-Bilder, weil die Redaktion nur eine Stelle gepflegt hat.
- Eine Redakteurin veröffentlicht einen älteren Entwurf und löscht damit unbemerkt das migrierte Bild.
- Das Produktions-Studio zeigt migrierte Bilder als unbekannte Felder an, und ein Klick auf „Entfernen“ löscht sie.

## Design

### Studio

**Hero-Bild pro Seite.** `home`, `departmentsPage`, `aboutUs`, `membership`, `contact`, `newsOverview`, `imprint`, `privacy` und `accessibility` bekommen ein Feld `heroImage` vom Typ `extendedImage`, Pflicht mit `assetRequired`, in der Feldgruppe `general` direkt hinter Titel und Untertitel. Der Name folgt `department.heroImage` und `group.heroImage`. Die Beschreibung sagt, wo das Bild erscheint:

- `home`: freigestelltes Bild mit transparentem Hintergrund (PNG oder WebP), unten bündig, im Hochformat
- `aboutUs`: wird auch auf den Echo-Seiten gezeigt
- `contact`: wird auch auf der Feedback-Seite gezeigt
- `newsOverview`: wird auch auf den Kategorieseiten gezeigt
- alle außer `home`: Querformat. Das Banner zeigt je nach Bildschirm nur einen Teil des Bildes, der Hotspot bestimmt, welcher Teil sichtbar bleibt. Ohne eigenes Open-Graph-Bild dient es auch als Vorschaubild beim Teilen.

**Zentrale Bilder.** `site-settings` bekommt eine neue Feldgruppe „Bilder“ mit drei Feldern:

- `visionImages`: Array aus `extendedImage`, genau 3. Die Reihenfolge ist die Position: groß, mittel, klein. Erscheint in der Vision-Sektion auf Home und Verein.
- `contactFormImages`: Array aus `extendedImage`, genau 3, gleiche Logik. Erscheint neben dem Kontaktformular auf Home und Kontakt, nur auf großen Bildschirmen.
- `fallbackImage`: `extendedImage`, Pflicht. Springt ein, wenn eine Abteilung oder Gruppe weder Hero- noch Kachelbild hat.

Die Vision- und Kontaktbilder werden rund beschnitten. Die Beschreibung weist auf den Hotspot hin.

Es gibt keine neuen Dokumenttypen.

### Website

- **Hero:** Die Seiten lesen `heroImage` aus ihrem Dokument. Die URL kommt ungeschnitten aus `urlForImageMax`, mit einer Breite, die für volle Bildschirmbreite reicht. Den Zuschnitt macht wie heute `object-cover` im Browser.
  - Die Abteilungs- und Gruppenseiten schneiden dagegen auf dem Server auf 1920 × 600 zu (`getHeroImage`). Das hätte hier den sichtbaren Ausschnitt verkleinert, auf dem Handy auf etwa ein Fünftel der Bildfläche statt gut die Hälfte, und beim Verein-Bild wäre der Sportplatz weggefallen.
  - Damit der Hotspot trotzdem wirkt, setzt `Hero` die `object-position` aus `hotspot.x` und `hotspot.y`. Ohne Hotspot bleibt die Mitte, also der heutige Ausschnitt.
  - Das Home-Hero ist ein freigestellter Ausschnitt mit `object-contain` und wird ebenfalls nicht beschnitten.
  - _Festgelegt beim Schreiben, nicht vom Nutzer: Zuschnitt im Browser statt auf dem Server, weil die Website aussehen soll wie vorher._
- **Geteilte Heros:**
  - Feedback holt das Hero-Bild aus `contact`.
  - Echo-Übersicht und Echo-Ausgabe holen es aus `aboutUs`.
  - Die News-Kategorieseiten holen es aus `newsOverview`.
  - `ECHO_HERO_IMAGE` und die Konstanten `HERO_IMAGE` aller Seiten entfallen.
- **Vision** (Server-Komponente) bekommt die drei Bilder als Prop. Die beiden Seiten holen sie aus `site-settings`.
- **ContactForm** ist eine Client-Komponente. Die Server-Seite übergibt die drei Bilder fertig aufgelöst (URL und Alt-Text) als Prop.
- **Ersatzbild:** `getHeroImage` und `GroupCard` bekommen das Ersatzbild aus `site-settings` übergeben. `utils/fallback-image.ts` entfällt. Weil `GroupCard` an mehreren Stellen gerendert wird, muss das Ersatzbild durch die Abschnitte hindurchgereicht werden.
- **Open Graph:** Alle Seiten mit Hero-Feld außer Home übergeben ihr Hero-Bild als `image` an `getPageMetadata`, auch die Seiten mit geteiltem Hero (Feedback, Echo-Übersicht, News-Kategorien). Ein gepflegtes `meta.openGraphImage` gewinnt weiterhin. Die Echo-Ausgabe behält ihre heutige Logik mit dem Cover.
- **Fehlendes Bild:** Ein leeres Feld oder ein Bild ohne Asset (Entwurf, Altbestand, Fehler in der Migration) darf nichts kaputtmachen. Die Seite rendert dann ohne dieses Bild.
  - `Hero` kann das schon, Vision und ContactForm lassen eine fehlende Position aus.
  - Ein fehlender Alt-Text fällt wie in `getHeroImage` auf den Seitentitel zurück.
- **Revalidierung** in `REVALIDATION_MAP`:
  - `contact` revalidiert `/kontakt` als Layout, wegen `/kontakt/feedback`.
  - `aboutUs` revalidiert `/verein` als Layout, wegen der Echo-Seiten.
  - `newsOverview` revalidiert zusätzlich `/news/[category]`.
  - `accessibility` kommt neu dazu und revalidiert `/barrierefreiheit`.
  - `site-settings` deckt mit `/` als Layout schon alles ab.
- **Webhooks:** `accessibility` kommt in den Typfilter beider Webhooks und in die Liste in `docs/SANITY_WEBHOOK_SETUP.md`. Die Webhooks liegen in Sanity, nicht im Repository. Staging wird beim Merge nach `next` umgestellt, Produktion beim Release zusammen mit der WEB-384-Umstellung. Beides ist ein Schreibzugriff und braucht vorher das OK des Nutzers.
- **Aufräumen:** `src/images`, `public/og`, `app/news/_assets` und `app/(legal)/_shared/hero.webp` werden gelöscht. Danach importiert die Website keine Rasterbilder mehr. Das `assetStub`-Plugin in `vitest.config.ts` entfällt dann, sofern es nichts anderes mehr braucht.

### Migration der heutigen Bilder

Ein einmaliges Skript `apps/studio/scripts/migrate-page-images.ts`, aufgebaut wie `scripts/migrate-departments.ts`:

- Lauf über `sanity exec --with-user-token`, ohne `--no-dry-run` nur ein Probelauf, der nichts schreibt.
- Die Bilder liegen als Kopie unter `scripts/migrate-page-images/images/`, die Alt-Texte stehen im Skript.
- Es lädt jedes Bild hoch (Sanity dedupliziert per Inhalts-Hash) und setzt die Felder nur dort, wo sie noch leer sind. Ein zweiter Lauf ändert nichts.
- Es setzt keine Hotspots. Ohne Hotspot bleibt die Bildmitte sichtbar, und das ist der heutige Ausschnitt.
- Es schreibt das veröffentlichte Dokument **und** einen vorhandenen Entwurf. Sonst würde das Veröffentlichen eines älteren Entwurfs das Bild wieder entfernen.
- Die Module nehmen den Store als Argument und werden gegen `test-utils/fake-store.ts` getestet, wie bei den Abteilungen.

Alt-Texte für die Migration. Wo der heutige Text falsch ist, ist er hier korrigiert:

| Ziel | Datei | Alt-Text |
| --- | --- | --- |
| `home.heroImage` | `home/hero.webp` | heutiger Text aus `app/_home/hero.tsx` |
| `departmentsPage.heroImage` | `angebot/hero.webp` | heutiger Text aus `utils/fallback-image.ts` |
| `aboutUs.heroImage` | `verein/hero.webp` | neu: Luftaufnahme des Vereinsheims „Pappelstübchen“ der TSG Irlich mit Terrasse, Tischen und Sonnenschirmen, dahinter Bäume und der Sportplatz |
| `membership.heroImage` | `mitgliedschaft/hero.webp` | neu: Zwei Personen geben sich über einem Schreibtisch mit Klemmbrett und Kugelschreiber die Hand |
| `contact.heroImage`, `imprint.heroImage`, `privacy.heroImage`, `accessibility.heroImage` | `kontakt/hero.webp` | neu: Ein MacBook auf einem Schreibtisch zeigt das Kontaktformular der TSG Irlich, daneben ein Festnetztelefon und eine kabellose Maus, im Hintergrund ein unscharfes Büro |
| `newsOverview.heroImage` | `news-overview.webp` | heutiger Text aus `app/news/page.tsx` |
| `site-settings.visionImages[0..2]` | `vision/vision-{1,2,3}.webp` | heutige Texte aus `components/section/vision.tsx` |
| `site-settings.contactFormImages[0..2]` | `contact/contact-{1,2,3}.webp` | heutige Texte aus `components/section/contact-form.tsx` |
| `site-settings.fallbackImage` | `angebot/hero.webp` | wie `departmentsPage.heroImage` |

Die Rechtsseiten bekommen das Kontakt-Bild, weil ihre Datei byte-gleich ist.

**Reihenfolge:**

1. **`development`, vor dem Merge nach `next`:**
   1. Dataset exportieren (`pnpm exec sanity dataset export development …`).
   2. Skript als Probelauf, dann echt. Der echte Lauf braucht vorher das OK des Nutzers.
   3. Den Pull Request erst danach öffnen. Kodiak merged ihn bei grünen Checks sofort, dann findet Staging die Bilder schon beim ersten Deploy. Bis zum Merge zeigt das Staging-Studio die neuen Felder kurz als unbekannt an. Das ist hinnehmbar, weil nur `development` betroffen ist.
   4. Nach dem Merge den Typfilter des Staging-Webhooks um `accessibility` ergänzen, mit OK des Nutzers.
2. **`production`, direkt vor dem Release `next` → `main`:**
   1. Gebündelt mit der WEB-384-Migration: ein Export und eine Pause des Produktions-Webhooks für beide Migrationen.
   2. Danach den Release mergen und den Produktions-Webhook mit der vollständigen Typliste (inklusive `faq` und `accessibility`) wieder einschalten.
   3. Jeder Schreibschritt braucht vorher das OK des Nutzers.

Der Content Lake hat kein Schema. Die Felder dürfen also vor dem Studio-Deploy existieren, solange das Studio mit dem neuen Schema bald folgt.

Ein Folge-Pull-Request löscht Skript, Bildkopien und den Abschnitt in `apps/studio/AGENTS.md`, sobald `production` migriert ist.

### Tests

- **Web (Vitest):**
  - Die Tests der betroffenen Seiten, `hero`, `hero-image`, `group-card`, `vision`, `contact-form`, `metadata` und der Revalidierungsroute arbeiten mit Sanity-Bildern statt statischer Imports.
  - Neu getestet werden die `object-position` aus dem Hotspot, das OG-Ersatzbild und die neuen Revalidierungspfade.
  - Die Coverage-Schwellen von `apps/web` dürfen nicht sinken.
- **Studio:** Schema-Tests für die neuen Pflichtfelder und die Anzahl 3, nach dem Muster `recordValidationChain` in `department.test.ts`. Dazu Tests der Migrationsmodule.
- **E2E:**
  - Die Fixtures werden nach der Migration von `development` neu aufgenommen (`pnpm run e2e:record`), weil sich die Antworten geändert haben. Das von Hand gepflegte Menü-Fixture wird danach aus Git wiederhergestellt.
  - Die betroffenen Bilder kommen danach aus dem Sanity-Mock (transparentes PNG in der richtigen Proportion). Die Screenshot-Baselines der betroffenen Routen ändern sich dadurch und werden im Container neu erzeugt (`test:e2e:visual:update`), im selben Commit.

### Dokumentation

- `apps/studio/AGENTS.md`: Abschnitt zu den neuen Feldern und zur Migration.
- `apps/web/AGENTS.md`:
  - welche Bilder woher kommen
  - der Zuschnitt der Seiten-Heros im Browser
  - das OG-Ersatzbild
  - die geänderte Revalidierung
  - der Wegfall von `assetStub`
- `docs/SANITY_WEBHOOK_SETUP.md`: `accessibility` in der Typliste.

## Dem Builder überlassen

- Namen der Felder in `site-settings` und der Feldgruppe
- Form der Query für die zentralen Bilder und wie sie zu den Seiten kommt
- Breite der Hero-URL sowie die Bildgrößen für Vision und ContactForm (heute 600 × 600, dargestellt bis 320 px)
- Aufbau des Migrationsskripts im Rahmen des Musters oben
