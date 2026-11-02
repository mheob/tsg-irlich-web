# TSG-Echo: Textebene für Bild-PDFs — Design-Spec

Datum: 2026-11-01 · Status: entschieden, noch nicht umgesetzt · Ticket: [WEB-402](https://linear.app/tsg-irlich/issue/WEB-402) · Verwandt: [WEB-368](https://linear.app/tsg-irlich/issue/WEB-368) (Archiv-Import), [WEB-353](https://linear.app/tsg-irlich/issue/WEB-353) und [WEB-367](https://linear.app/tsg-irlich/issue/WEB-367) (Datenschutz, alte Ausgaben nicht auffindbar), [WEB-58](https://linear.app/tsg-irlich/issue/WEB-58) (Epic)

Scope: Ein lokales Skript in `apps/studio/scripts` gibt den TSG-Echo-PDFs ohne Textebene per Texterkennung (OCR) eine unsichtbare Textebene und tauscht die PDF in der Sanity-Ausgabe aus. Der Render-Webhook erzeugt danach Seiten und `extractedText` neu. Der Code der Website bleibt unverändert.

## Warum

Die Render-Route (`apps/web/src/app/api/echo/render`) und der Archiv-Import lesen den Text einer Ausgabe nur aus der Textebene der PDF (`renderPdfPages` in `packages/pdf-pages`). Vielen Ausgaben fehlt sie:

- **26 Scans von 1979 bis 1988** sind reine Bilder, `extractedText` ist leer.
- **TSG ECHO 2024 und 2025** wurden als gerasterte Web-PDFs hochgeladen. Text haben nur die Anzeigen.

Deshalb findet „Intro erzeugen“ (AI Assist, liest `extractedText`) bei 2024 und 2025 nur Werbung und bei den Scans nichts. Die Website-Suche findet 2024 und 2025 nur über Anzeigentexte.

Das Ticket fragte ursprünglich, wo eine OCR laufen soll (Render-Route, Studio-Skript, externer Dienst). Am 01.11.2026 fiel die Entscheidung, das Problem an der Quelle zu lösen: Die PDF selbst bekommt die Textebene. Dann muss keiner der bestehenden Lesewege etwas über OCR wissen.

## Ausgangslage

### Ausgaben in Sanity

Stand 01.11.2026, in `production` und `development` gleich (`development` ist eine Kopie von `production` vom selben Tag):

- Alle 42 `echo.issue` liegen nur als Entwurf vor (`drafts.*`). Sie wurden am 01.11. wegen einer internen Klärung zurückgezogen; wann sie wieder veröffentlicht werden, ist offen.
- Die 26 Scans tragen die IDs aus dem Import, `echo-archiv-<Dateiname>`, etwa `echo-archiv-1984-tsg-irlich-1-echo`. `extractedText` ist leer, `indexable` ist `false`.
- Die 14 digitalen Ausgaben 2008–2012 haben eine vollständige Textebene. Sie sind nicht betroffen.
- `echo-2024` (48 Seiten) und `echo-2025` (72 Seiten) wurden von Hand angelegt. Ihr `extractedText` enthält nur Anzeigen (2.812 bzw. 5.149 Zeichen), `indexable` ist `true`.

### Lokale Dateien

Die PDFs liegen außerhalb des Repositorys in `~/dev/customer/tsg/echo-archiv`:

- `1979 Erste Exemplare/`, `1980-1989/`: die 26 Scans.
- `2000-2012/`: die 14 digitalen Ausgaben.
- `ab 2024 (neues ECHO)/`: `2024_TSG_Echo_45_Jahre_Web_Text.pdf` (48 von 48 Seiten mit Text, 26 MB) und `2025_TSG_ECHO_Web_Text.pdf` (72 von 72 Seiten mit Text, 37 MB). Das sind die neuen Web-PDFs aus dem Satzprogramm, diesmal nicht gerastert. Sie brauchen keine OCR, nur den Austausch.
- `manifest.json`: die Liste des Archiv-Imports (`datei`, `titel`, `erscheinungsdatum`), 40 Einträge, ohne 2024 und 2025.

### Render-Webhook

Der Webhook „TSG-Echo Seiten erzeugen“ löst bei Create und Update aus, auch auf Entwürfen, mit dem Filter `defined(pdf.asset) && (!defined(render.source) || render.source != pdf.asset._ref)` (`docs/SANITY_WEBHOOK_SETUP.md`). Wer `pdf.asset._ref` eines Entwurfs ändert, löst also einen neuen Lauf aus. Die Route ersetzt `pages`, `extractedText`, `pageCount` und `render`. Staging liest `development`, Production liest `production`; beide Datasets haben ihren eigenen Webhook.

### Werkzeuge

Auf dem Rechner ist noch keines installiert: `ocrmypdf`, `tesseract`, `gs`, `qpdf` fehlen. OCRmyPDF bringt Tesseract, Ghostscript und qpdf über Homebrew mit; die deutschen Sprachdaten kommen aus `tesseract-lang`:

```bash
brew install ocrmypdf tesseract-lang
```

## Entscheidungen

Mit dem Nutzer im Gespräch am 01.11.2026 getroffen:

- **Unsichtbarer Text über dem unveränderten Seitenbild** (eine „Sandwich-PDF“), kein Neusatz. Ein Neusatz würde jeden Lesefehler der OCR auf der Seite zeigen, bräuchte ein Korrekturlesen aller Scanseiten und verlöre das Layout mit Fotos, Zeichnungen und Anzeigen. Beim unsichtbaren Text treffen Lesefehler nur die Suche und die Intro-Grundlage.
- **OCR lokal mit OCRmyPDF und Tesseract (Deutsch).** Kein externer Dienst, keine OCR in der Render-Route.
- **Das Skript tauscht die PDF in Sanity selbst aus.** Kein Austausch von Hand im Studio.
- **2024 und 2025 kommen mit**, über die neuen `_Web_Text`-PDFs.
- **Datenschutz ist freigegeben.** Der erkannte Text der Ausgaben vor 2013 darf im Dataset liegen, obwohl beide Datasets `public` sind und ihn jeder über die API lesen kann. Die Website-Suche lässt diese Ausgaben weiter außen vor (`indexable: false`, `select(indexable != false => extractedText)` in der Suchabfrage), das Akzeptanzkriterium aus WEB-353 und WEB-367 bleibt also erfüllt.

## Verhalten des Skripts

### Aufruf

Wie der Archiv-Import über `sanity exec --with-user-token`, mit einem Probelauf als Voreinstellung:

```bash
pnpm --filter studio run ocr:echo --dataset development --folder ~/dev/customer/tsg/echo-archiv
pnpm --filter studio run ocr:echo --dataset development --folder ~/dev/customer/tsg/echo-archiv --no-dry-run
```

- `--dataset` ist Pflicht.
- `--folder` muss im Benutzerordner und außerhalb des Repositorys liegen, mit denselben Regeln wie beim Import (`resolveFolder` in `scripts/import-echo/options.ts`).
- `--manifest <datei>` liest eine andere `.json`-Liste im Ordner; voreingestellt ist `ocr-manifest.json`.

### Die Liste `ocr-manifest.json`

Eine eigene Liste im Ordner, nicht die `manifest.json` des Imports. Jeder Eintrag nennt die Datei und die Ausgabe, deren PDF sie ersetzt:

```json
[
	{ "datei": "1979 Erste Exemplare/1979_01.pdf", "dokument": "echo-archiv-1979-01" },
	{ "datei": "ab 2024 (neues ECHO)/2024_TSG_Echo_45_Jahre_Web_Text.pdf", "dokument": "echo-2024" }
]
```

`dokument` ist die ID ohne `drafts.`. Die IDs stehen explizit drin, weil sich die von 2024 und 2025 nicht aus dem Dateinamen ableiten lassen. Ein Eintrag für 2024 in der Import-Liste würde den Import außerdem eine zweite Ausgabe `echo-archiv-2024_…` anlegen lassen. Die Liste für den ersten Lauf hat 28 Einträge (26 Scans, 2024, 2025) und wird beim Rollout einmal geschrieben; die IDs der Scans ergeben sich aus `toDocumentId` des Imports. Doppelte Dateien oder Dokumente lehnt das Skript ab, bevor es etwas tut.

### Pro Eintrag

Die Einträge laufen nacheinander ab:

1. **Textebene prüfen.** Das Skript liest die PDF und prüft jede Seite auf Text (pdf.js, wie `extractText` in `packages/pdf-pages`, ohne die Seiten als Bild zu rendern).
2. **Erkennen, falls nötig.** Hat jede Seite Text, nimmt es die Datei unverändert. Sonst läuft OCRmyPDF mit Deutsch und nur über die Seiten ohne Text. Seiten mit Text bleiben, wie sie sind. Das Seitenbild darf sich dabei nicht ändern: kein Geraderichten, kein Säubern, kein Drehen, keine Bildoptimierung, keine PDF/A-Umwandlung, die Bilder neu komprimiert. Das Ergebnis landet unter `<Ordner>/mit-textebene/<datei>` (gleicher relativer Pfad). Liegt dort schon eine Datei, nimmt das Skript sie, statt neu zu erkennen. So bleiben Wiederholungen stabil, und das Ergebnis lässt sich nach dem Probelauf ansehen. Wer neu erkennen will, löscht die Datei.
3. **Ziel finden.** Das Skript tauscht nie in einer veröffentlichten Fassung, denn die Website zeigt eine Ausgabe nur, solange `render.status == 'done'` und `render.source` die aktuelle PDF ist. Ein Tausch in der veröffentlichten Fassung würde sie also für die Dauer des Renders von der Website nehmen, und bei einem gescheiterten Render bliebe sie weg.
   - Gibt es `drafts.<dokument>`, ist das das Ziel.
   - Gibt es nur `<dokument>`, legt das Skript `drafts.<dokument>` als Kopie der veröffentlichten Fassung mit der neuen PDF an (`create`, scheitert, falls der Entwurf inzwischen existiert). Die veröffentlichte Fassung bleibt unverändert, bis die Redaktion den Entwurf veröffentlicht.
   - Gibt es eine Version in einem Release (`versions.<release>.<dokument>`), scheitert der Eintrag mit dem Namen des Releases. Ein Tausch nur im Entwurf würde beim Veröffentlichen des Releases wieder überschrieben.
   - Gibt es weder Entwurf noch veröffentlichte Fassung, scheitert der Eintrag.
4. **Schon getauscht?** Hat die aktuelle PDF des Ziels denselben `sha1hash` wie die Datei aus Schritt 2, tauscht das Skript nicht noch einmal, sondern prüft den Render:
   - `render.source` ist diese PDF und `render.status` ist `done`: übersprungen.
   - `render.status` ist `pending`: Das Skript wartet wie in Schritt 6.
   - Sonst (`failed`, oder `render.source` gehört zu einer anderen PDF): Der Eintrag scheitert mit dem Hinweis, im Studio „Seiten neu erzeugen“ zu wählen und das Skript danach erneut zu starten.

   Ein zweiter Lauf tauscht also nichts noch einmal, löst keinen neuen Render aus und meldet einen hängengebliebenen Render trotzdem.

5. **Austauschen** (nur ohne `--dry-run`). Hochladen als Datei-Asset mit dem `originalFilename` der bisherigen PDF (etwa `tsg-echo-1984-nr-1.pdf`), damit der Download-Name gleich bleibt. Danach `pdf.asset._ref` des Entwurfs setzen, gegen die gelesene Revision (`ifRevisionId`), oder den Entwurf wie in Schritt 3 anlegen. Hat jemand das Dokument inzwischen gespeichert, scheitert der Eintrag und kann wiederholt werden. `render` fasst das Skript nicht an: Weil `render.source` nun von der neuen PDF abweicht, löst der Webhook aus.
6. **Auf den Render warten.** Das Skript fragt das Ziel alle paar Sekunden ab, bis `render.source` die neue PDF ist und `render.status` `done` oder `failed` lautet, höchstens 15 Minuten lang (die Route bricht nach 800 s selbst ab). Erst dann kommt der nächste Eintrag. Das hält die Render-Läufe auf Vercel hintereinander, statt 28 gleichzeitig anzustoßen, und liefert die Kontrolle gleich mit.

Pro Eintrag schreibt das Skript eine Zeile: Seiten, davon erkannt, erkannte Zeichen, getauscht oder übersprungen, und nach dem Render den Status und die Länge von `extractedText`. Der Probelauf führt Schritt 1 bis 4 aus. Er erkennt also schon und schreibt die Dateien nach `mit-textebene/`, aber nichts nach Sanity.

### Fehler

- Fehlt `ocrmypdf` oder die Sprache `deu` in `tesseract --list-langs`, bricht das Skript vor dem ersten Eintrag ab und nennt `brew install ocrmypdf tesseract-lang`. Das gilt nur, wenn ein Eintrag OCR braucht.
- Ein gescheiterter Eintrag hält die übrigen nicht auf. Am Ende stehen die gescheiterten Einträge mit Grund in der Zusammenfassung, und das Skript endet mit Exit-Code 1. Ein Render, der mit `failed` endet oder nicht rechtzeitig fertig wird, zählt als gescheitert.
- OCRmyPDF läuft ohne Shell (`execFile` mit Argumentliste), weil die Dateinamen Leerzeichen enthalten.

## Nicht-Ziele

- Keine OCR in der Render-Route, keine Änderung an Web-App, Schema oder Suche.
- Keine Intros. Die schreibt die Redaktion danach im Studio mit „Intro erzeugen“, das dann den erkannten Text liest.
- Kein Löschen der alten PDFs und Seitenbilder. Sie bleiben als unbenutzte Assets im Dataset und unter ihrer CDN-Adresse erreichbar.
- Kein Neusatz, kein Veröffentlichen. Entwürfe bleiben Entwürfe.
- Die digitalen Ausgaben 2008–2012 bleiben unberührt.

## Rollout

1. **Erkennungsqualität prüfen, bevor das Skript entsteht.** Nach `brew install ocrmypdf tesseract-lang` OCRmyPDF von Hand über drei Scans laufen lassen: eine Ausgabe von 1979, die Festschrift 1982 (52 Seiten) und eine von 1988. Festgehalten wird pro Scan: eine Textprobe, ob das Seitenbild unverändert ist (Bilder vor und nach dem Lauf vergleichen) und die Laufzeit. **Hier wird angehalten, auch wenn alles gut aussieht.** Der Nutzer sieht die Ergebnisse und entscheidet, ob weitergebaut wird und welche Scans in die Liste kommen. Fällt ein Jahrgang schlecht aus, kann er auch ganz herausbleiben.
2. Skript mit Tests bauen.
3. `ocr-manifest.json` im Archivordner schreiben, mit den Einträgen aus Schritt 1 (höchstens 28).
4. Probelauf auf `development`, dann echter Lauf auf `development` (Staging-Webhook). Kontrolle: `extractedText` der 28 Ausgaben gefüllt, Seitenbilder unverändert, „Intro erzeugen“ liefert bei 2024 ein inhaltliches Intro.
5. Echter Lauf auf `production`.
6. Die Redaktion erzeugt die Intros im Studio und prüft sie.

## Beim Schreiben entschieden

Diese Punkte kamen im Gespräch nicht vor; der Autor des Dokuments hat sie festgelegt, der Nutzer prüft sie mit der Freigabe:

- Eine eigene Liste `ocr-manifest.json` mit expliziten Dokument-IDs statt der Import-Liste.
- Ausgabeordner `mit-textebene/` als Zwischenspeicher, den der Probelauf schon füllt.
- Nach jedem Austausch auf den Render warten, statt alle Austausche auf einmal anzustoßen.
- Getauscht wird nur im Entwurf; bei einer nur veröffentlichten Ausgabe legt das Skript einen an, bei einer Version in einem Release scheitert der Eintrag.
- Ein schon getauschter Eintrag mit gescheitertem Render zählt als gescheitert und wird über „Seiten neu erzeugen“ wiederholt; das Skript stößt den Render nicht selbst neu an.
- Haltepunkt nach der Qualitätsprüfung, auch bei gutem Ergebnis.

## Was dem Builder überlassen bleibt

- Die genauen OCRmyPDF-Optionen für die installierte Version, solange die Bedingungen aus Schritt 2 gelten.
- Wie die Textprüfung gebaut wird. Bevorzugt eine schlanke Funktion in `@tsgi-web/pdf-pages`, die nur den Text pro Seite liest; dort gilt die Coverage-Schwelle von 100 %.
- Der Zuschnitt der Module unter `scripts/ocr-echo/` nach dem Muster des Imports: Die Module bekommen ihre Abhängigkeiten als Argumente und werden ohne Sanity, pdf.js, OCRmyPDF und Netz getestet. Gemeinsames mit dem Import (Ordnerregeln) wird geteilt, nicht kopiert.
- Abfrageintervall und genaue Wartezeit beim Render.
- Die Doku: ein Abschnitt in `apps/studio/AGENTS.md` neben dem Archiv-Import, das Skript `ocr:echo` in `apps/studio/package.json`.

## Risiken

- **Qualität der alten Scans.** Matrizen- und Schreibmaschinenabzüge von 1979 erkennt Tesseract womöglich schlecht. Darum steht die Prüfung im Rollout ganz vorn.
- **Größe von 2025.** Die neue PDF ist 37 MB groß und hat 72 Seiten. Die gerasterte Fassung lief durch die Render-Route; ob die neue in 750 s passt, zeigt erst der Lauf auf `development`. Scheitert er, bricht das Skript den Eintrag mit dem Fehler aus `render.error` ab, und es braucht eine eigene Lösung.
- **Suche nach 2024 und 2025.** Die Website-Suche liest nur veröffentlichte Ausgaben. Dass 2024 und 2025 über ihre Vereinsthemen gefunden werden, lässt sich vor der Wiederveröffentlichung nur per GROQ auf den Entwürfen prüfen, auf der Website erst danach.
