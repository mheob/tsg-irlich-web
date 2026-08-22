# Newsletter-E-Mail-Vorlage (CleverReach) — Design-Spec

Datum: 2026-07-29 Status: umgesetzt (Design + CleverReach-Editable-Tags) Scope: **E-Mail-Design und Editor-Auszeichnung**. Keine Sanity-Anbindung, keine Versand-Logik.

## Ziel

Eine React-Email-Vorlage im Corporate Design der TSG-Irlich-Webseite, die als HTML nach CleverReach übertragen wird. Die Vorlage enthält Header, Titelstory, „Blick voraus", News, einen Sponsor, einen CTA-Block auf eine Zielseite (z.B. Mitgliedschaft) und einen Footer.

## Entschiedene Optionen

| Frage | Entscheidung |
| --- | --- |
| Content-Weg | Hybrid: typisierte Props mit Dummy-Defaults, CleverReach-Systemtags fest verdrahtet |
| News-Layout | 2-Spalten-Karten |
| Header | Indigo Band mit Logo, gelbe Ausgabezeile |
| Sponsor | Helle Karte nach den News |
| Headline-Font | Nur System-Fallback (Impact-Stack), kein Webfont |
| Titelstory | Bild groß oben, darunter Kicker/Headline/Teaser/Button |
| Blick voraus | Termin-Zeilen mit gelbem Datums-Badge |
| CTA | Indigo Band mit gelbem Button |
| Social Media | Gelbe Textlinks (keine Icon-Assets) |
| Anrede | Feste Textzeile „Hallo TSG-Familie!" |
| Platzhalter-Bilder | `placehold.co` in TSG-Farben |
| Editable-Tags | Umgesetzt, ein loopitem = eine News-Zeile mit zwei Karten |
| Template-Umfang | Pro Loop genau ein Element (Termin, News-Zeile, Sponsor); der Editor dupliziert |

## Design-Tokens

Die Webseite definiert ihre Farben in `oklch` (`apps/web/src/app/globals.css`). E-Mail-Clients (Outlook, Gmail-Web) unterstützen `oklch` nicht — deshalb werden alle Tokens in der E-Mail als Hex geführt. Umrechnung aus den bestehenden `@theme`-Werten:

| Rolle                               | Token der Webseite                | Hex       |
| ----------------------------------- | --------------------------------- | --------- |
| Header, CTA-Band, Footer            | `--color-primary`                 | `#332C61` |
| Button, Badge, Akzentlinks          | `--color-secondary`               | `#FFD404` |
| Fließtext-Überschriften             | `--color-foreground`              | `#161616` |
| Sekundärtext                        | `--color-muted-foreground`        | `#424853` |
| Rahmen                              | `--color-border`                  | `#B4B4B4` |
| Helle Flächen (Sponsor-Karte, Body) | `--color-background-low-contrast` | `#F2F2F2` |
| Text auf primary                    | `--color-primary-foreground`      | `#FCFCFC` |

Typografie:

- Headlines: `Impact, 'Arial Narrow Bold', 'Arial Black', sans-serif`, uppercase, `letter-spacing: 0.5px`. Ersatz für Anton, in jedem Client identisch.
- Body: `-apple-system, 'Segoe UI', Roboto, Arial, sans-serif`.
- Größen: H1 (Titelstory) 32px, Karten-Titel 18px, Termin-Titel 16px, Body 15px/24px, Kicker 11px uppercase `letter-spacing: 2px`, Kleintext 12px.
- Radius: 8px (Karten, Bilder), 12px (Sponsor-Karte), 9999px (Buttons). Outlook rendert eckig — akzeptiert.
- Rasterbreite 600px, Sektionsabstand 32px, Spaltenabstand 20px.

Logo: `tsg-irlich-logo.png` bzw. das Motiv aus `packages/shared/src/logos/tsg-logo.tsx`. Das Logo hat einen weißen Außenring, ist also direkt auf dem indigo Band lesbar — kein weißer Hintergrundkasten nötig. Einbindung als PNG über absolute URL (`${baseUrl}/tsg-irlich-logo.png`), nicht als SVG (Outlook rendert kein SVG).

## Dateistruktur

```
packages/email/emails/newsletter.tsx              Komposition, Props, Dummy-Defaults, Default-Export für Preview
packages/email/components/newsletter/
  newsletter-header.tsx                           Indigo Band, Logo, Ausgabezeile
  section-kicker.tsx                              Kicker mit Haarlinien links/rechts
  lead-story.tsx                                  Titelstory
  upcoming-events.tsx                             „Blick voraus" als Loop
  event-date-badge.tsx                            Gelbes Datums-Kästchen eines Termins
  newsletter-event.ts                             Geteilter `NewsletterEvent`-Typ
  news-grid.tsx                                   Reihen-Aufteilung der News
  news-card.tsx                                   Einzelne News-Karte
  sponsor-card.tsx                                Sponsor-Block
  cta-band.tsx                                    Indigo CTA-Band
  newsletter-footer.tsx                           Footer inkl. CleverReach-Systemtags
  email-button.tsx                                Gelber Pill-Button (Tabelle)
packages/email/lib/
  cleverreach-markers.ts                          Marker erzeugen und in CleverReach-Kommentare umschreiben
  cleverreach-tags.tsx                            CrHtml, CrImage, CrLoop, CrLoopItem, TemplateModeProvider
  render-newsletter.ts                            renderNewsletterHtml und renderNewsletterTemplate
packages/email/scripts/build-cleverreach-template.ts   Schreibt die Template-Datei nach dist/
packages/email/emails/index.ts                    Nur ContactForwardEmail; Newsletter über `@tsgi-web/email/newsletter`
packages/email/tailwind-config.ts                 Tokens auf Hex umstellen und ergänzen
```

Konventionen laut `AGENTS.md`: kebab-case Dateinamen, Funktionsdeklarationen statt `const`, Named Exports, TypeScript-Interfaces am Dateiende, Micro-Folder-Struktur.

`components/` liegt bewusst außerhalb von `emails/`, damit der React-Email-Preview-Server die Bausteine nicht als eigenständige Mails listet.

## Blockaufbau (von oben nach unten)

1. **Preheader** — `Preview`-Komponente mit `previewText`-Prop.
2. **Header** — Vollbreites Band `#332C61`, Logo zentriert (Höhe 120px), darunter `issueLabel` in `#FFD404`, 11px, uppercase, `letter-spacing: 2px`.
3. **Anrede + Intro** — Anrede als normaler Text `Hallo TSG-Familie!`, darunter 2–3 Sätze aus `intro`. Kein `{SALUTATION}`-Platzhalter, damit kein Client-seitiger Fallback greifen muss.
4. **Titelstory** — Bild volle Breite 600×315 (`imageUrl`, Alt-Text = Titel), darunter Kicker, Headline 32px, Teaser, gelber Button „Ganze Story lesen".
5. **Blick voraus** — Kicker `BLICK VORAUS`, danach pro Termin eine Zeile: links gelbes 56×68-Badge mit Wochentag (10px uppercase), Tag (20px bold) und Monat (10px uppercase), rechts Titel 16px bold und Meta-Zeile (Ort · Zeit) 13px in `#424853`. Trennlinien `#B4B4B4` zwischen Terminen.
6. **News** — Kicker `AUS DEM VEREIN`, 2-Spalten-Karten. Pro Karte: Bild 256×144 (16:9), Kategorie-Label 11px uppercase `letter-spacing: 1.5px` in `#332C61` (gelber Text auf weiß wäre zu kontrastarm), Titel 18px, Teaser gekürzt, Link „Weiterlesen →". Bei ungerader Anzahl steht die letzte Karte links, die rechte Zelle bleibt leer.
7. **Sponsor** — Karte `#F2F2F2` mit 1px Rahmen `#B4B4B4`, Radius 12px. Kicker `SPONSOR DIESER AUSGABE` in `#424853`, Sponsor-Logo max. 160×60 zentriert, 1–2 Sätze Text, Textlink auf die Sponsorseite.
8. **CTA-Band** — Vollbreites Band `#332C61`: Headline in `#FCFCFC`, ein Satz Nutzen, gelber Button mit `cta.buttonLabel` auf `cta.href`.
9. **Footer** — 4px gelbe Trennlinie oberhalb, damit CTA-Band und Footer trotz gleicher Farbe als zwei Blöcke lesbar bleiben. Darunter Band `#332C61` mit: kleinem Logo, Adresse `Gotenstraße 20 · 56567 Neuwied`, `info@tsg-irlich.de`, Social-Media als gelbe Textlinks, ©-Zeile mit Jahr, sowie `{ONLINE_VERSION}` („Im Browser ansehen") und `{UNSUBSCRIBE}` („Newsletter abbestellen").

## Props-API

Die Termin-Form liegt als `NewsletterEvent` in `components/newsletter/newsletter-event.ts` und wird von den Props, `upcoming-events.tsx` und `event-date-badge.tsx` (per `Pick`) geteilt.

```ts
interface NewsletterEmailProps {
	baseUrl: string;
	cta: { buttonLabel: string; href: string; text: string; title: string };
	events: NewsletterEvent[]; // { day, meta, month, title, weekday }
	intro: string;
	issueLabel: string;
	leadStory: { href: string; imageUrl: string; kicker: string; teaser: string; title: string };
	news: { category: string; href: string; imageUrl: string; teaser: string; title: string }[];
	previewText: string;
	socials: { href: string; label: string }[];
	sponsor: { href: string; logoUrl: string; name: string; text: string };
}
```

Alle Props haben Dummy-Defaults mit realistischen deutschen Vereinsinhalten, damit der Preview-Server (`bun run dev:email`, Port 3001) sofort ein vollständiges Bild zeigt. Platzhalter-Bilder von `placehold.co` in `#332C61`/`#FFD404`. Die Komponente rendert beliebig viele News in Zweierreihen; die Dummy-Daten enthalten genau eine Zeile aus zwei Karten und `events` genau einen Termin, weil die Vorlage pro Loop nur ein Element mitbringt.

## CleverReach-Platzhalter (fest verdrahtet)

| Zweck                  | Syntax             |
| ---------------------- | ------------------ |
| Abmeldelink            | `{UNSUBSCRIBE}`    |
| Browser-/Onlineversion | `{ONLINE_VERSION}` |

Platzhalter müssen in Großbuchstaben und geschweiften Klammern stehen. Quellen: [CleverReach Template Tags](https://eddytor.cleverreach.com/assets/docs/howto-templates.htm), [Personalisierung mit Platzhaltern](https://support.cleverreach.com/hc/de/articles/15790515075602-Newsletter-Personalisierung-mit-Platzhaltern).

## CleverReach-Editable-Tags

Die Vorlage rendert in zwei Modi. `renderNewsletterHtml()` liefert fertiges Mailing-HTML ohne jedes Editor-Markup, `renderNewsletterTemplate()` liefert dasselbe HTML plus CleverReach-Template-Kommentare für den Import als Vorlage. Der Preview-Server zeigt immer die saubere Variante.

`bun run build:cleverreach` schreibt die Template-Variante nach `packages/email/dist/newsletter.cleverreach.html` (`dist` ist gitignored).

| Bereich                      | Tag                                     | Modus      |
| ---------------------------- | --------------------------------------- | ---------- |
| Ausgabezeile im Header       | `html`                                  | `textonly` |
| Anrede                       | `html`                                  | `default`  |
| Intro und Einleitungssätze   | `html`                                  | `default`  |
| Alle Kicker                  | `html`                                  | `textonly` |
| Titelstory-Bild              | `image`                                 | —          |
| Titelstory-Headline/-Teaser  | `html`                                  | `default`  |
| Buttons (Titelstory, CTA)    | `html` um den `<a>`                     | `default`  |
| Termine                      | `loop` mit `loopitem name="Termin"`     | —          |
| Termin-Wochentag/-Tag/-Monat | `html`                                  | `textonly` |
| Termin-Titel/-Meta           | `html`                                  | `default`  |
| News                         | `loop` mit `loopitem name="News-Zeile"` | —          |
| News-Bild                    | `image`                                 | —          |
| News-Kategorie               | `html`                                  | `textonly` |
| News-Titel/-Teaser/-Link     | `html`                                  | `default`  |
| Sponsor                      | `loop` mit `loopitem name="Sponsor"`    | —          |
| Sponsor-Logo                 | `image`                                 | —          |
| Sponsor-Text/-Link           | `html`                                  | `default`  |
| CTA-Headline/-Text           | `html`                                  | `default`  |

Bewusst **nicht** ausgezeichnet: Header-Logo und der komplette Footer. Damit kann die Redaktion Marke und Abmeldelink nicht zerstören.

### Warum ein loopitem eine ganze News-Zeile ist

Die Dokumentation ist eindeutig: „Loops can not be placed between table elements like `<table><tr>`". Jede News-Zeile ist bereits eine eigene Tabelle, ein einzelner Kartenrahmen dagegen nur eine Tabellenzelle. Ein loopitem umschließt deshalb eine komplette Zeile aus zwei Karten — Duplizieren erzeugt zwei Karten. Für einzelne Karten müsste das Raster auf `inline-block`-Karten mit MSO-Ghost-Tables umgebaut werden; das ist bewusst nicht passiert.

### Marker statt Kommentare im JSX

React kann keine HTML-Kommentare rendern. Die `Cr*`-Komponenten in `lib/cleverreach-tags.tsx` geben deshalb Text-Marker der Form `@@CR|html|mode=default@@` aus, die `toCleverReachTemplate()` nach dem Rendern in `<!--#html mode="default"#-->` umschreibt. Die Marker enthalten kein `<`, `>` oder `&`, damit React sie nicht escapt. Der Template-Modus hängt an einem React-Context (`TemplateModeProvider`), der standardmäßig aus ist.

`<!--#unsubscribe#-->` und `<!--#onlineversion#-->` werden **nicht** verwendet: CleverReach ersetzt den Inhalt dieser Tags durch eigenen Standardtext und würde unsere gestalteten Footer-Links überschreiben. Die Platzhalter `{UNSUBSCRIBE}` und `{ONLINE_VERSION}` bleiben direkt in den Links.

### Folge für das Design

Die Trennlinie der Termine sitzt jetzt **über** jedem Termin statt zwischen ihnen, damit alle loopitems identisch sind und ein duplizierter Termin seine Linie mitbringt.

## Client-Härtung

- Keine `oklch`-Farben, keine SVG, keine CSS-Background-Images.
- Buttons als Tabelle mit Hintergrundfarbe auf der Zelle, nicht als gestylter `<a>` allein.
- Alt-Text an jedem Bild; die Kernbotschaft steht immer im Text, nie nur im Bild.
- Zweispaltige Bereiche stacken unter 620px über eine handgeschriebene Media-Query im `<Head>`; Outlook-Desktop bleibt zweispaltig.
- Feste Farben statt Systemfarben, damit erzwungener Dark Mode nicht die Lesbarkeit bricht.
- Feste Pixelwerte über `pixelBasedPreset`.

## Abweichungen aus der Umsetzung

- **Responsives Stacking von Hand.** react-email 6.9 inlined Tailwind-Varianten wie `max-sm:` **ohne** ihre Media-Query, wodurch die Mobile-Regeln in jedem Client gegolten hätten und das Zweispalter-Raster zerstört worden wäre. Stattdessen liegt eine eigene Media-Query im `<Head>` (`.email-container`, `.stack`, `.stack-gap`, `.gutter`, `img`), die per einfacher Klassennamen greift — Tailwind-Utility-Klassen werden inlined und aus dem `class`-Attribut entfernt, eigene Klassen bleiben erhalten.
- **`Tailwind` umschließt `Head`.** Ohne das kann die Komponente ihre nicht inlinebaren Regeln nicht in den `<head>` schreiben.
- **Interfaces stehen über der Komponente**, nicht am Dateiende: `oxlint`s `import/exports-last` verlangt, dass alle Nicht-Export-Statements vor den Exports stehen. Entspricht auch `contact-forward.tsx`.
- **Bildmaße der News-Karten kommen als Props** aus `news-grid.tsx` (`CARD_WIDTH`, `CARD_IMAGE_HEIGHT`), damit keine Magic Numbers in der Karte stehen.
- **Der Newsletter liegt nicht im Haupt-Entry des Pakets.** `lib/cleverreach-tags.tsx` nutzt `createContext`; Next.js bricht den Build ab, sobald so ein Modul über `emails/index.ts` in den Server-Component-Graph der Webseite gerät (die Kontaktformular-Action importiert dieses Entry). Der Newsletter wird deshalb nur über `@tsgi-web/email/newsletter` exportiert.
- **Das Marker-Regex hat keine Capture-Group.** Die Webseite typecheckt das Paket mit `target: ES2017`, das keine benannten Gruppen erlaubt (TS1503), und `oxlint` verlangt für unbenannte Gruppen einen Namen. `toCleverReachTemplate()` schneidet Prefix und Suffix daher per `slice`.
- **`tailwind-config.ts` hat zusätzlich** `background` (war zuvor als `bg-background` in `contact-forward.tsx` genutzt, ohne dass das Token existierte) und `secondary-dark`.

## Abnahmekriterien (Stand der Umsetzung)

- `bun run dev:email` rendert `newsletter.tsx` mit vollständigen Dummy-Daten; die Bausteine unter `components/` tauchen nicht als eigene Mails in der Übersicht auf. ✔ geprüft
- `bun run typecheck` und `bun run lint` sind grün. ✔ geprüft
- Alle neun Blöcke sind vorhanden und verwenden ausschließlich die Hex-Tokens dieser Spec; im gerenderten HTML kommt kein `oklch` vor. ✔ geprüft
- Das gerenderte HTML enthält die drei CleverReach-Platzhalter unverändert. ✔ geprüft
- Bei 5 Artikeln bleibt das Raster intakt: sechs Zellen à 256px, die letzte leer. ✔ geprüft (Chromium-Messung)
- Unter 620px stapeln die Karten und die Bilder skalieren mit. ✔ geprüft (Chromium-Screenshot bei 500px)
- Die Template-Variante enthält 30 `html`-, 4 `image`-, 3 `loop`- und 3 `loopitem`-Regionen (`Termin`, `News-Zeile`, `Sponsor`), keine übrig gebliebenen Marker und keinen Loop zwischen `<table>` und `<tr>`. ✔ geprüft
- Template-HTML ohne seine Kommentare ist zeichengleich mit dem normalen Render — die Tags ändern das Markup nicht. ✔ geprüft
- Preview-Server und `renderNewsletterHtml()` enthalten keine Marker und keine CleverReach-Kommentare. ✔ geprüft

## Nicht enthalten

- Sanity-GROQ-Query und Datenmapping für Newsletter-Inhalte.
- Automatisierter Übertrag nach CleverReach (API, Mailing-Erstellung).
- Einzelne News-Karten als loopitem (bräuchte ein `inline-block`-Raster mit MSO-Ghost-Tables).
- `class="editable"` für Stil-Bearbeitung innerhalb der Loops.
- Plaintext-Variante.
