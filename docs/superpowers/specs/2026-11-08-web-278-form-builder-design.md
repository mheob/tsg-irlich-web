# Formular-Baukasten mit Anmeldung zum Dorfturnier — Design-Spec

Datum: 2026-11-08 · Status: entschieden, noch nicht umgesetzt · Ticket: [WEB-278](https://linear.app/tsg-irlich/issue/WEB-278)

Scope: Die Redaktion baut Formulare selbst im Studio. Jedes Formular hat eine eigene Landingpage auf der Website, speichert die Eingänge in Sanity, verschickt Mails an den Veranstalter und an den Absender und lässt sich als Excel-Datei exportieren. Die erste Version liefert nur den Formulartyp **Anmeldung**. Das erste echte Formular ist die Anmeldung zum Dorfturnier 2027.

## Warum

Heute verteilt ein News-Artikel einen Link auf ein MS-Forms-Formular. Die Antworten werden in Excel ausgewertet, und die Teams bekommen alles Weitere von Hand. Mit dem Baukasten sollen sich drei Dinge ändern:

- **Ein Ort für die Außenkommunikation.** Texte, Formular und Ergebnisse liegen in Sanity statt verteilt auf Website und Microsoft Forms.
- **Die Besucher bleiben auf der Website** und verlassen sie nicht für ein externes Formular.
- **Eine Historie in Sanity.** Auch in ein paar Jahren soll das Studio zeigen, welche Teams sich wann angemeldet haben.

Ein festes Anmeldeformular nur für das Dorfturnier wurde verworfen. Der Verein plant weitere Anmeldungen (Skitour) und später vielleicht Feedback und Umfragen. Deshalb fiel die Wahl auf einen Baukasten.

## Ausgangslage

### Das heutige Dorfturnier-Formular (MS Forms)

1. Teamname, Pflicht
2. Name des Ansprechpartners, Pflicht
3. E-Mail des Ansprechpartners, Pflicht
4. Telefonnummer des Ansprechpartners, Pflicht
5. Mitspieler als Freitext, ein Spieler pro Zeile nach dem Muster „Nachname, Vorname, Straße, Wohnort, Geb.-Datum, aktiv/inaktiv“, Pflicht. Laut Formular sind Name, Adresse und Geburtsdatum „aus versicherungstechnischen Gründen erforderlich“.
6. Datenschutzerklärung gelesen (ja / nein, keine Teilnahme möglich), Pflicht
7. Regeln des Dorfturniers anerkannt (ja / nein), mit Link auf den News-Artikel, Pflicht

### Regeln aus dem News-Artikel, die das Formular berühren

Quelle: `/news/veranstaltungen/anmeldung-dorfturnier`.

- Höchstens 8 Teams.
- Mindestalter 16 Jahre.
- Auf dem Platz stehen 5 Feldspieler und 1 Torwart, Auswechselspieler beliebig viele. Daraus folgen mindestens 6 gemeldete Spieler ohne Obergrenze (abgeleitet, nicht ausdrücklich vom Verein).
- Höchstens 2 aktive Fußballer gleichzeitig auf dem Platz. „Aktiv“ heißt mindestens 1 Einsatz in der laufenden Saison. Das betrifft die Aufstellung, nicht die Anmeldung. Das Formular zählt Aktive deshalb nicht.

### Wozu der Verein die Daten braucht

- Aus den Teamnamen entstehen die Spielpläne.
- Die Spielerliste dient bei Haftungs- und Versicherungsfällen und zur Regelprüfung während des Turniers.

### Was es im Code schon gibt

- **Formulare:** react-hook-form, Zod aus `src/lib/validations`, Server Actions mit `actionClient` (`apps/web/AGENTS.md`, Abschnitt „Forms and server actions“). Dazu das Muster aus [`send-contact-form.ts`](../../../apps/web/src/actions/send-contact-form.ts): Empfängeradressen kommen nur aus Sanity, nie vom Client (WEB-410). Der Absenden-Knopf ist bis zur Hydration gesperrt (WEB-418).
- **Schreiben in Sanity:** [`write-client.ts`](../../../apps/web/src/lib/sanity/write-client.ts), nur serverseitig, mit `SANITY_API_WRITE_TOKEN`.
- **Mails:** Resend und `packages/email`.
- **Empfänger:** das Objekt `contactNameMail` (Name + E-Mail) in `apps/studio/schemas/objects/contact-to.ts`.
- **Studio:** eigene Document Actions in `apps/studio/actions/`, darunter „Duplizieren ohne Slug-Historie“, sowie eine Presentation-Anbindung für News, Abteilungen und Gruppen.

### Sanity-Datasets sind öffentlich

`production` und `development` haben `aclMode: public`. Jedes normale Dokument kann jeder ohne Token lesen. Laut Sanity-Doku ([IDs and paths](https://www.sanity.io/docs/content-lake/ids)) gilt dagegen: Dokumente, deren `_id` einen Punkt enthält, sind nur mit Login oder Token lesbar, so wie `drafts.*`. Außerdem behält Sanity jede jemals geschriebene ID bis zur Löschung des Datasets. Personendaten gehören deshalb nie in eine ID.

## Ziele

1. Die Redaktion baut ein Formular im Studio ohne Code: Felder, Landingpage, Zeitraum, Obergrenze, Mails, Bereinigung.
2. Das Dorfturnier 2027 läuft komplett über den Baukasten. Das ist der Abnahmetest.
3. Eingänge liegen in Sanity, für die Öffentlichkeit nicht lesbar.
4. Der Export ist für jedes Formular ohne Code-Änderung brauchbar.
5. Adressen und Geburtsdaten (außer dem Jahr) werden kurz nach der Veranstaltung automatisch gelöscht. Der Rest bleibt als Historie.
6. Der Typ `Anmeldung` ist so allgemein, dass die Skitour voraussichtlich ohne Umbau darüber läuft. Ihre Anforderungen sind noch offen, siehe [Offene Punkte](#offene-punkte).

## Nicht-Ziele (erste Version)

- Die Formulartypen **Feedback** und **Umfrage**. Das Typ-Feld gibt es aber von Anfang an, damit sie später ohne Migration dazukommen.
- Online-Zahlung. Startgeld oder Reisekosten stehen höchstens als Text in der Bestätigungsmail.
- Bearbeiten oder Stornieren durch den Absender. Absagen laufen per Mail an den Veranstalter, der den Status im Studio setzt.
- Rundmails an alle Angemeldeten aus dem Studio. Die Adressen stehen im Export.
- Bedingte Felder („zeige X nur, wenn Y“), verschachtelte Gruppen und Datei-Uploads.
- Login oder Konten für Absender sowie Dublettenerkennung.

## Anti-Ziele

Diese Dinge würden das Projekt scheitern lassen, auch wenn es technisch funktioniert:

- Eingänge, insbesondere Adressen und Geburtsdaten Dritter, sind über die öffentliche Sanity-API abrufbar.
- Die Website schickt Mails mit Inhalten, die ein Angreifer bestimmt, an Adressen, die er bestimmt.
- Für ein neues Formular muss jemand Code anfassen.
- Der Export muss pro Formular angepasst werden.

## Entscheidungen

### Formulartypen

Der Formulartyp steuert, welche Einstellungen das Studio anbietet und welche Vorgaben gelten. Export und Feldtypen bleiben für alle Typen gleich. Die erste Version liefert nur `Anmeldung`. Feedback und Umfrage sind skizziert, damit das Modell zu ihnen passt:

| Typ | Einstellungen, die nur er hat | Export-Zusatz |
| --- | --- | --- |
| Anmeldung (v1) | Anmeldezeitraum, Obergrenze mit Warteliste, Status pro Eingang, Bestätigungsmail, Bereinigung nach der Veranstaltung | Statusspalte |
| Feedback (später) | läuft ohne Ende, Mail nur an den Veranstalter, Angaben zur Person optional, auf Wunsch anonym, Status offen / erledigt | Statusspalte |
| Umfrage (später) | anonym, Enddatum, vor allem Auswahl- und Bewertungsfragen | Blatt mit der Auszählung pro Antwort |

### Feldtypen und Regeln

Im Code stehen nur die verfügbaren Feldtypen und die Arten von Prüfungen. Welche Prüfung mit welchem Wert gilt, stellt die Redaktion pro Feld ein.

Jedes Feld hat:

- eine Bezeichnung und einen optionalen Hilfetext
- „Pflicht“ ja/nein
- eine Breite (ganz / halb; halb heißt auf dem Desktop zwei Felder nebeneinander)
- eine Einstellung zur Bereinigung (siehe unten)
- einen stabilen technischen Schlüssel. Er wird aus der Bezeichnung erzeugt und darf sich nicht mehr ändern, sobald Eingänge existieren, sonst passen gespeicherte Antworten und Exportspalten nicht mehr zusammen.

| Feldtyp | Zusätzliche Einstellungen |
| --- | --- |
| Text (einzeilig) | maximale Länge |
| Text (mehrzeilig) | maximale Länge |
| E-Mail | — (Format wird immer geprüft) |
| Telefon | — |
| Zahl | Minimum, Maximum |
| Datum | Mindestalter an einem Stichtag (z. B. 16 Jahre am 14.05.2027) |
| Auswahl | Optionen; eine oder mehrere; Darstellung als Optionsfelder, Liste oder Checkboxen |
| Zustimmung | Pflicht-Checkbox, deren Text Links enthalten darf (Datenschutz, Regeln) |
| Wiederholbare Gruppe | eigene Felder aus den Typen oben (ohne Gruppe); Bezeichnung eines Eintrags (z. B. „Spieler“); Mindest- und Höchstzahl an Einträgen |
| Hinweis (kein Eingabefeld) | Zwischenüberschrift und Text im Formular |

Das Dorfturnier 2027 im Baukasten:

| Feld | Typ | Einstellungen |
| --- | --- | --- |
| Teamname | Text | Pflicht, halb, als „Bezeichnung“ des Eingangs markiert |
| Ansprechpartner | Text | Pflicht, halb |
| E-Mail | E-Mail | Pflicht, halb, Empfänger der Bestätigung |
| Telefon | Telefon | Pflicht, halb |
| Mitspieler | Wiederholbare Gruppe „Spieler“ | Pflicht, mindestens 6 Einträge |
| ↳ Nachname, Vorname | Text | Pflicht, halb |
| ↳ Straße, Wohnort | Text | Pflicht, halb, nach der Veranstaltung löschen |
| ↳ Geburtsdatum | Datum | Pflicht, Mindestalter 16 am 14.05.2027, nach der Veranstaltung auf das Jahr kürzen |
| ↳ Status | Auswahl aktiv / inaktiv | Pflicht, Hilfetext „aktiv = mindestens 1 Einsatz in der Saison 2026/2027“ |
| Datenschutz | Zustimmung | Link auf `/datenschutz` |
| Regeln | Zustimmung | Link auf den Regel-Artikel |

### Einstellungen eines Formulars (Typ Anmeldung)

- **Typ, Titel, Slug.**
- **Landingpage:** Hero-Bild, Einleitungstext (Rich Text), Eckdaten (Veranstaltungsdatum mit Uhrzeit, Ort; den Typ `venue` gibt es schon).
- **Anmeldezeitraum:** Start und Schluss.
- **Obergrenze** (optional) und ob „Noch X von Y Plätzen frei“ angezeigt wird. Ist die Obergrenze erreicht, bleibt das Formular offen. Es zeigt dann einen Hinweis auf die Warteliste, und weitere Eingänge bekommen den Status „Warteliste“.
- **Bezeichnung:** welches Feld einen Eingang im Studio und im Export benennt (beim Dorfturnier der Teamname).
- **Veranstalter-Mail:** ein oder mehrere Empfänger (`contactNameMail`), abschaltbar.
- **Bestätigungsmail:** an welches E-Mail-Feld sie geht, Betreff, Text, eigener Text für die Warteliste, optional eine Kopie der Antworten. Abschaltbar.
- **Texte der Zustände:** vor dem Start, nach dem Schluss, Hinweis auf die Warteliste, Erfolgsmeldung für eine Anmeldung, Erfolgsmeldung für die Warteliste. Alle bekommen Vorgabetexte.
- **Bereinigen ab:** ein Datum, z. B. eine Woche nach der Veranstaltung.

Für das nächste Jahr dupliziert die Redaktion das Formular und passt Daten und Texte an.

### Landingpage

Mockups:

- [`2026-11-08-web-278-mockups/landing-page.html`](2026-11-08-web-278-mockups/landing-page.html): die entschiedene Fassung, Desktop und Handy.
- [`2026-11-08-web-278-mockups/landing-options.html`](2026-11-08-web-278-mockups/landing-options.html): die verworfenen Varianten A und B neben C.
- [`2026-11-08-web-278-mockups/mobile-options.html`](2026-11-08-web-278-mockups/mobile-options.html): C auf dem Handy, Varianten M1 bis M3. M2 wurde gewählt, mit dem Hero darüber.

- **Adresse:** `/anmeldung/<slug>`, z. B. `/anmeldung/dorfturnier-2027`. Den Link kann man in News-Artikel setzen, per Messenger verschicken oder als QR-Code aushängen.
- **Oben der Hero** wie auf den anderen Unterseiten: Bild, Kicker „Anmeldung“, Titel, Breadcrumb. Auf dem Handy etwas niedriger.
- **Breadcrumb ohne Zwischenstufe:** „Home » Dorfturnier 2027“, anders als im Mockup. Unter `/anmeldung` selbst gibt es in der ersten Version keine Seite, und eine Stufe dorthin wäre ein Link auf eine 404-Seite, auch im BreadcrumbList-JSON-LD. Eine Übersicht offener Anmeldungen kann später kommen. _(Festgelegt nach dem Review.)_
- **Desktop (Layout C):**
  - Links auf dunklem Grund: Bild, Titel, Eckdaten als Chips (Datum, Ort, Anmeldeschluss), Einleitungstext mit Links und der Hinweis auf freie Plätze oder die Warteliste.
  - Rechts das Formular. Felder mit halber Breite stehen zu zweit nebeneinander.
- **Handy (M2):**
  - Unter dem Hero nur die Chips und der Hinweis auf freie Plätze oder die Warteliste. Der Titel wird nicht wiederholt, er steht schon im Hero.
  - Bild und Einleitungstext klappen unter „Mehr zur Veranstaltung ▾“ auf, direkt danach beginnt das Formular.
- **Wiederholbare Gruppen:** Jeder Eintrag ist eine Karte. Ausgefüllte Karten klappen zu einer Zeile zusammen, etwa „1 · Müller, Max ✓“. Die Karte, die gerade bearbeitet wird, ist offen. Mit „+ Spieler hinzufügen“ kommt ein Eintrag dazu, jede Karte lässt sich entfernen.
- **Zustände:** vor dem Start (Hinweistext statt Formular), offen, Obergrenze erreicht (Hinweis auf die Warteliste, Knopf „Auf die Warteliste“), nach dem Schluss (Hinweistext). Nach dem Absenden erscheint die Erfolgsmeldung an derselben Stelle.

### Speicherung

- Ein Eingang ist ein eigenes Dokument (Arbeitsname `form.submission`). Es trägt:
  - eine Referenz auf das Formular und die Eingangszeit
  - den Status (angemeldet / Warteliste / abgemeldet)
  - die Antworten
  - wann es bereinigt wurde
- **Private ID:** Die Server Action legt es mit einer ID an, die einen Punkt enthält (z. B. `form.submission.<uuid>`). So bleibt es trotz des öffentlichen Datasets privat. Die ID enthält nie Personendaten.
- **Antworten:** Jede Antwort speichert den technischen Schlüssel, eine Kopie der Feldbezeichnung zum Zeitpunkt des Eingangs, den Feldtyp und den Wert. Gruppen speichern eine Liste von Einträgen mit denselben Bestandteilen. Die Antworten müssen im Studio lesbar sein und sich feldweise bereinigen lassen. Die genaue Form der Werte entscheidet der Umsetzer.
- **Im Studio bearbeitbar sind der Status und die Werte der Antworten.** Schlüssel, Bezeichnung und Feldtyp jeder Antwort sind schreibgeschützt. Einen Spieler fügt die Redaktion hinzu, indem sie einen Eintrag der Gruppe dupliziert und die Werte ändert. Das ist die Arbeitsannahme a) aus [Offener Punkt 4](#offene-punkte), bis der Verein antwortet.
- **`db:sync`** kopiert `production` nach `development`. Eingänge lässt es aus: Der Cron-Job läuft nur auf Production, die Kopien würden also nie bereinigt. _(Festgelegt nach dem Review.)_

### Absenden (Server Action)

1. Die Action lädt das veröffentlichte Formular über seine ID. Ein unveröffentlichtes Formular oder ein Formular außerhalb des Anmeldezeitraums weist sie ab.
2. Sie baut aus der Felddefinition ein Zod-Schema und prüft damit die Eingabe. Dieselbe Funktion erzeugt im Browser den Resolver für react-hook-form. Der Server traut nie einem Schema, das der Client mitschickt.
3. Sie prüft den Bot-Schutz.
4. Sie zählt die Eingänge mit dem Status „angemeldet“. Ist die Obergrenze erreicht, bekommt der neue Eingang den Status „Warteliste“. Gehen zwei Anmeldungen gleichzeitig ein, kann die Obergrenze um eins überschritten werden. Das wird hingenommen, der Veranstalter sieht es im Studio.
5. Sie schreibt den Eingang mit dem Write-Client.
6. Sie schickt die Veranstalter-Mail und die Bestätigungsmail.
   - **Veranstalter-Mail:** alle Antworten außer den Feldern, die bereinigt werden. Statt Adressen und Geburtsdaten steht dort ein Link auf den Eingang im Studio. `replyTo` ist der Absender, und es gibt keine BCC an `it@tsg-irlich.de` wie beim Kontaktformular. Kopien in Postfächern und in den Logs von Resend erreicht die Bereinigung nie. _(Festgelegt nach dem Review, nicht vom Verein.)_
   - Die Empfänger der Veranstalter-Mail kommen nur aus Sanity.
   - Die Bestätigung geht an das E-Mail-Feld, das im Formular festgelegt ist.
7. Ein Fehler beim Mailversand macht den gespeicherten Eingang nicht ungültig. Er wird geloggt, und die Erfolgsmeldung erscheint trotzdem.

### Bot-Schutz und Missbrauch

- **Honeypot-Feld und Vercel BotID** (`botid`, GA). Eine Rate-Limit-Regel in der Vercel Firewall kann dazukommen.
- **Hydration:** Der Absenden-Knopf ist bis zur Hydration gesperrt, wie bei Kontakt- und Feedbackformular (WEB-418).
- **Kopie der Antworten:** Die Bestätigung geht an eine Adresse, die der Absender eingibt. Deshalb ist die Kopie der Antworten darin standardmäßig aus. Freitext eines Angreifers soll nicht ungefragt über die Vereinsdomain an fremde Adressen gehen.

### Anzeige der freien Plätze

Die Landingpage zählt die Eingänge serverseitig mit dem Read-Token, nur als Zahl. Der Wert darf kurz veraltet sein: Er wird nach jedem Absenden über ein Cache-Tag erneuert und sonst nach kurzer Zeit (Größenordnung eine Minute). Statusänderungen im Studio müssen deshalb keinen Webhook auslösen.

### Bereinigung

- **Pro Feld einstellbar:** behalten (Standard), löschen, oder bei einem Datumsfeld auf das Jahr kürzen.
- **Ab „Bereinigen ab“** bereinigt ein täglicher Vercel-Cron-Job alle noch nicht bereinigten Eingänge des Formulars und setzt das Bereinigungsdatum. Die Route ist mit `CRON_SECRET` geschützt, und die neue Variable wird in `turbo.json` eingetragen.
- **Im Studio** gibt es zusätzlich am Formular die Action „Jetzt bereinigen“.
- **Grenze:** Sanity hebt frühere Fassungen in der Versionshistorie auf. Bereinigte Werte sind deshalb bis zum Ende der Aufbewahrungsfrist des Sanity-Tarifs noch dort abrufbar. Das muss in die Datenschutzerklärung (die Seite wird in Sanity gepflegt).
- **Heruntergeladene Excel-Dateien** erfasst die Bereinigung nicht. Die muss der Verein selbst löschen.

### Studio

- **Neue Liste „Formulare“.** Unter jedem Formular hängt eine Liste seiner Eingänge, benannt nach dem Bezeichnungsfeld und mit dem Status.
- **Feldtypen in der Felderliste** (Array). Typabhängige Einstellungen werden ein- und ausgeblendet. Titel und Beschreibungen sind auf Deutsch, wie im übrigen Studio.
- **Validierung im Studio:**
  - Schlüssel sind pro Formular eindeutig.
  - Für die Bestätigungsmail ist ein E-Mail-Feld gewählt.
  - Das Bezeichnungsfeld existiert.
  - Bei Gruppen ist das Minimum nicht größer als das Maximum.
- **Document Actions am Formular:** „Als Excel exportieren“ und „Jetzt bereinigen“.
- **Presentation:** Die Landingpage ist wie News und Abteilungen in der Vorschau sichtbar (`/anmeldung/:slug`). In der Vorschau lässt sich nichts absenden.

### Excel-Export

- **Absichtlich dumm und für alle Formulare gleich.** Die Datei (.xlsx) entsteht im Browser aus den Eingängen, mit dem Login der Studio-Nutzer. Es gibt keinen Server-Endpunkt.
- **Hauptblatt:** eine Zeile pro Eingang mit Nummer, Eingangszeit und Status, danach ein Feld pro Spalte. Die Spaltenköpfe sind die Feldbezeichnungen.
- **Ein Blatt pro wiederholbarer Gruppe:** eine Zeile pro Eintrag, vorne die Nummer des Eingangs und der Wert des Bezeichnungsfeldes, dahinter die Felder der Gruppe.
- **Bereinigte Werte** bleiben leer, beziehungsweise steht nur das Jahr da.
- Später kann ein Formulartyp eine Spalte oder ein Blatt hinzufügen (Umfrage: Auszählung). Der Kern ändert sich dabei nicht.

### Website-Anbindung

- **Revalidierung:** Das Formular-Dokument kommt in die Revalidierung (`REVALIDATION_MAP` in `apps/web/src/app/api/revalidate/route.ts`). Der Filter der Webhooks in beiden Datasets muss mitgezogen werden (`docs/SANITY_WEBHOOK_SETUP.md`).
- **Sitemap:** Veröffentlichte Landingpages kommen in die Sitemap. Die Website-Suche bleibt in der ersten Version außen vor.
- **Tests:**
  - Unit-Tests für den Schema-Builder (jede Prüfungsart), die Action, die Bereinigung und den Export.
  - Die e2e-Suite mockt die Schreibzugriffe auf Sanity per MSW.
  - Die Landingpage kommt in den axe-Sweep, einmal leer und einmal nach einem leeren Absenden.
  - Die Coverage-Schwellen bleiben, wie sie sind (Ratchet).

## Was der Umsetzer entscheidet

- Die Namen der Dokument- und Objekttypen (Arbeitsnamen: `form`, `form.submission`) und die Ordnerstruktur, nach den Konventionen in `apps/studio/AGENTS.md`.
- Die genaue Form der gespeicherten Werte.
- Die Bibliothek für die .xlsx-Erzeugung im Studio.
- Wie der technische Schlüssel erzeugt und gegen Änderungen gesperrt wird.
- Ob die Rate-Limit-Regel in der Firewall nötig ist.
- Die Gestaltung der beiden Mail-Vorlagen in `packages/email`. Sie sind generisch und zeigen eine Tabelle der Antworten.

## Offene Punkte

1. **Skitour:** Der Verein klärt noch, wie die Anmeldung abläuft und was sie abfragt. Wahrscheinlichste Lücke: Die Obergrenze zählt beim Dorfturnier Anmeldungen. Bei der Skitour könnten Personen zählen, also Einträge einer Gruppe (Plätze im Bus). Das wäre eine Erweiterung der Obergrenze, kein Umbau.
2. **Dokumente mit Punkt-ID im Studio:** Ob das Studio Dokumente wie `form.submission.<uuid>` in seinen Listen sauber anzeigt, ist ungeprüft. Das ist der erste Schritt der Umsetzung. Klappt es nicht, wäre die Rückfallebene, das Dataset auf privat zu stellen. Das ist ein eigener, größerer Eingriff: Die Website liest dann nur noch mit Token.
3. **Aufbewahrungsfrist der Sanity-Versionshistorie** im Tarif des Vereins, für den Satz in der Datenschutzerklärung.
4. **Spielerliste nachträglich ändern:** Teams tauschen oder ergänzen vor dem Turnier oft noch Spieler, und am Turniertag muss die Liste stimmen. Drei Wege sind möglich:
   - **a)** Die Redaktion darf Antworten im Studio bearbeiten. Das Team meldet die Änderung per Mail. _Mein Vorschlag._
   - **b)** Eine neue Anmeldung ersetzt die alte. Dafür bräuchte es eine Dublettenerkennung, und die ist ein Nicht-Ziel.
   - **c)** Änderungen bleiben außerhalb von Sanity. Dann ist die Historie bewusst unvollständig.

   Bei a) brauchen die Antworten im Studio Eingabefelder statt einer reinen Anzeige. Bis der Verein antwortet, gilt a) als Arbeitsannahme (freigegeben am 08.11.2026), in der einfachen Form aus dem Abschnitt [Speicherung](#speicherung).

5. **Ab wann die Anmeldung zum Dorfturnier 2027 online sein muss.** 2026 erschien der Artikel am 25.04. Steht der Termin früh im Jahr, wird in Scheiben ausgeliefert: zuerst Landingpage, Absenden und Mails, dann der Export, zuletzt die Bereinigung.
