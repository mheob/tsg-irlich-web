# Hauptmenü: Link oder Menü auf der ersten Ebene (WEB-371) — Design-Spec

Datum: 2026-10-10 · Status: entschieden, noch nicht umgesetzt · Ticket: [WEB-371](https://linear.app/tsg-irlich/issue/WEB-371/hauptmenu-link-oder-menu-auf-der-ersten-ebene) · Folge zu [WEB-343](https://linear.app/tsg-irlich/issue/WEB-343/hauptnavigation-unterpunkte-ermoglichen-und-kontakt-button-auf) (Spec `2026-09-30-web-343-main-navigation-design.md`)

Scope: das Datenmodell der ersten Ebene des Hauptmenüs, seine Migration und die Abfrage und das Anzeigemodell der Website. Desktop- und Mobilmenü behalten ihren Aufbau.

## Ausgangslage

- `site-settings.mainNavigation` besteht aus `mainNavigationItem`-Einträgen (`apps/studio/schemas/objects/main-navigation-item.ts`).
  - Ein Eintrag hat Bezeichnung, Art des Links, Seite oder URL und optional `children` (`navigationLink`).
  - Mit Unterpunkten kommen die Felder des Aufklappmenüs dazu: `overviewTitle`, `overviewDescription` und `hasTwoColumns`.
- Auf der Website (`getNavigationEntries`, `apps/web/src/components/with-logic/navigation/navigation-entries.ts`) wird ein Eintrag mit Unterpunkten zu einer Gruppe.
  - Die Gruppe beginnt mit einem automatischen Link „Übersicht“ auf das eigene Ziel des Eintrags.
  - Titel und Beschreibung dieses Links stammen aus `overviewTitle` und `overviewDescription`.
  - Der Eintrag selbst ist nur der Auslöser des Aufklappmenüs.
- Die Redaktion hat dieses Modell nicht verstanden: Ein „Link“ mit Unterpunkten, dessen Ziel an erster Stelle im Aufklappmenü auftaucht.
- **Daten am 10.10.2026:**
  - Auf `production` hat kein Eintrag Unterpunkte: Home, Verein, Angebot, Aktuelles, Mitgliedschaft.
  - Auf `development` hat „Verein“ den Unterpunkt „TSG Echo“, dazu `overviewTitle` „Über uns“ und `overviewDescription` „Wer wir sind und wofür wir stehen“.
- Die heutige Website kommt mit einem Eintrag ohne eigenes Ziel zurecht. `toLink` liefert dann `undefined`, und die Gruppe entsteht ohne „Übersicht“.

## Entschiedene Optionen

| Frage | Entscheidung |
| --- | --- |
| Modell der ersten Ebene | Entweder **Link** (Ziel, keine Unterpunkte) oder **Menü** (Unterpunkte, kein Ziel) |
| Wahl der Art | Beim Hinzufügen: zwei Typen im Array, „Hinzufügen“ bietet „Link“ und „Menü“ an. Ein Schalter im Eintrag ist verworfen, weil ausgeblendete Werte stehen blieben und das Modell wieder vermischten. |
| Menü ohne Unterpunkte | Fehler, das Veröffentlichen ist blockiert |
| Übersicht | Entfällt samt `overviewTitle` und `overviewDescription` |
| Migration eines Eintrags mit Unterpunkten | Wird ein Menü. Sein bisheriges Ziel wird der erste Unterpunkt, mit `overviewTitle` (sonst „Übersicht“) und `overviewDescription`. |
| Beschreibung der Unterpunkte, „Zweispaltig“ | Bleiben |
| Desktop- und Mobilmenü | Unverändert |

## Studio

### Objekttypen

Beide liegen in `apps/studio/schemas/objects/` und werden in `schemas/index.ts` registriert. `mainNavigationItem` und seine Datei entfallen.

**`mainNavigationLink`** (`main-navigation-link.ts`), Titel „Link“, Icon `RiLinkM`:

- Felder: genau `navigationLinkFields` aus `navigation-link.ts`, also `title`, `linkType`, `link` und `href` mit ihren bisherigen Regeln.
- Keine `description`: Die Beschreibung erscheint nur unter einem Eintrag im Aufklappmenü.
- Vorschau: `prepareNavigationLink` mit `href`, `linkType` und `title`. Der Untertitel ist bei extern die URL, sonst „Interne Seite“.

**`mainNavigationMenu`** (`main-navigation-menu.ts`), Titel „Menü“, Icon `RiMenuLine`:

| Feld | Typ | Titel | Regeln |
| --- | --- | --- | --- |
| `title` | `string` | Bezeichnung | Das Feld `title` aus `navigationLinkFields`: Pflicht, Warnung ab 20 Zeichen |
| `children` | `array` aus `navigationLink` | Unterpunkte | Mindestens einer, über `Rule.custom(validateMenuChildren)`. Sonst Fehler „Ein Menü braucht mindestens einen Unterpunkt“. Die Regel ist ein `Rule.custom`, damit ein Test sie direkt aufrufen kann. Warnung ab mehr als 8 Unterpunkten wie bisher. |
| `hasTwoColumns` | `boolean` | Zweispaltig | `initialValue: false`. Beschreibung wie bisher: „Stellt das Aufklappmenü auf dem Desktop in zwei Spalten dar.“ |

- Die Beschreibung von `children` lautet: „Die Einträge des Aufklappmenüs. Ein Menü führt selbst nirgendwohin, die Seite gehört als Unterpunkt hinein.“
- Vorschau: Titel ist die Bezeichnung, Untertitel „Menü · 1 Unterpunkt“ bzw. „Menü · N Unterpunkte“.
- `navigationLink` (die Unterpunkte) bleibt, wie er ist.

### Site Settings

`mainNavigation` bekommt `of: [{ type: 'mainNavigationLink' }, { type: 'mainNavigationMenu' }]`, in dieser Reihenfolge. Die Pflicht-Validierung des Arrays bleibt.

### Alte Migration `main-navigation-items`

- Sie hat `internalLink` und `externalLink` in `mainNavigationItem` umgestellt und ist auf beiden Datasets gelaufen.
- Ihr Zieltyp entfällt, und auf den neuen Typen würde sie mit „unbekannter Typ“ abbrechen.
- Sie wird deshalb samt Test gelöscht. Die Git-Historie behält sie.

## Migration `main-navigation-menus`

Liegt in `apps/studio/migrations/main-navigation-menus/index.ts`, nach dem Muster von `main-navigation-items`:

- `documentTypes: ['site-settings']`, Handler `migrate.document`.
- Die reine, exportierte Funktion `toMenuOrLink(item)` stellt einen Eintrag um:
  - **`mainNavigationLink` oder `mainNavigationMenu`** bleibt unverändert. Die Migration lässt sich also beliebig oft ausführen.
  - **`mainNavigationItem` ohne Unterpunkte** (fehlend oder leer) wird zu `{ _key, _type: 'mainNavigationLink', title, linkType, link, href }`. Felder ohne Wert werden nicht geschrieben.
  - **`mainNavigationItem` mit Unterpunkten** wird zu `{ _key, _type: 'mainNavigationMenu', title, hasTwoColumns, children }`.
    - `children` beginnt mit dem bisherigen Ziel: `{ _key: '<_key>-overview', _type: 'navigationLink', title: overviewTitle (getrimmt, sonst „Übersicht“), linkType, link, href, description: overviewDescription }`.
    - Das gilt nur, wenn der Eintrag ein Ziel hatte: eine Referenz bei intern, eine `href` bei extern.
    - Danach folgen die bisherigen Unterpunkte unverändert.
  - Ein Eintrag ohne nicht-leeren `title` oder mit unbekanntem `_type` wirft einen Fehler mit deutscher Meldung. So schreibt die Migration nie ein halb umgestelltes Menü.
- Die Migration setzt `mainNavigation` als Ganzes neu (`at('mainNavigation', set(…))`), und nur, wenn sich mindestens ein Eintrag geändert hat.
- Erwartetes Ergebnis auf `development`:
  - „Verein“ wird ein Menü mit „Über uns“ (`aboutUs`, mit Beschreibung) und „TSG Echo“.
  - Die übrigen vier Einträge werden Links.
  - Das Aufklappmenü der Website sieht danach genauso aus wie vorher.
- Erwartetes Ergebnis auf `production`: fünf Links.

Ausführung laut `apps/studio/AGENTS.md`: erst ein Probelauf, dann `--no-dry-run --no-confirm`, jeweils mit `--project j4rxwl5m --dataset <dataset>`.

## Website

### Abfrage

`mainNavigationQuery` (`apps/web/src/lib/sanity/queries/main-navigation.ts`) projiziert pro Eintrag `_type`, `navigationLinkFields`, `hasTwoColumns` und `"children": coalesce(children[] { navigationLinkFields, description }, [])`. `overviewTitle` und `overviewDescription` entfallen. Danach `pnpm run extract-types && pnpm run typegen:sanity`.

### Anzeigemodell

`getNavigationEntries` entscheidet nach `_type`:

- **`mainNavigationMenu`** wird eine Gruppe aus seinen gültigen Unterpunkten.
  - Es gibt keine „Übersicht“ mehr. `OVERVIEW_TITLE` und der Overview-Zweig entfallen.
  - Aktiv ist wie bisher nur der Unterpunkt mit dem längsten passenden Pfad.
  - Ein Menü ohne gültigen Unterpunkt erscheint nicht.
- **Jeder andere Typ** wird ein Link, auch ein noch nicht migrierter `mainNavigationItem`. Dessen Unterpunkte fehlen dann bis zur Migration. Ein Link ohne gültiges Ziel erscheint nicht.
- `NavigationItemData` bekommt `_type` und verliert `overviewTitle` und `overviewDescription`.

Desktop- (`desktop-navigation.tsx`) und Mobilmenü (`mobile-navigation.tsx`) rendern die Einträge wie bisher. An ihnen ändert sich nur, was ihre Tests als Daten hineingeben.

## Tests

- **Studio:**
  - `main-navigation-link.test.ts` prüft die Felder und die Vorschau.
  - `main-navigation-menu.test.ts` prüft die Felder, `validateMenuChildren` für fehlende, leere und befüllte Unterpunkte und die Vorschau mit 1 und mit 2 Unterpunkten.
  - Die Tests von `navigation-link.test.ts`, die sich auf `mainNavigationItem` beziehen, wandern dorthin.
- **Migration:** `index.test.ts` prüft `toMenuOrLink` für:
  - beide neuen Typen (unverändert)
  - Link intern und extern
  - Menü mit internem und mit externem Ziel
  - Menü mit leerem `overviewTitle`
  - Menü ohne eigenes Ziel
  - fehlenden Titel und unbekannten Typ
- **Website:**
  - `navigation-entries.test.ts`: Menü ohne Übersicht, aktiver Unterpunkt, Menü ohne gültige Unterpunkte, Link, alter `mainNavigationItem` als Link.
  - Desktop- und Mobil-Tests bekommen Fixtures im neuen Format.
- **E2E:** Die Fixtures werden nach der Migration von `development` neu aufgenommen, weil sich der Abfragetext ändert. Die visuellen Baselines sollten unverändert bleiben. Falls nicht, werden sie im Container neu erzeugt und geprüft.

## Ablauf

1. Umsetzung auf dem Branch, alle Tests grün.
2. Migration auf `development`: Probelauf, dann der echte Lauf, nach einem Ja direkt vorher. Das Staging-Studio zeigt die neuen Typen bis zum Merge als unbekannt an. Die Staging-Website stellt sie schon richtig dar.
3. E2E-Fixtures neu aufnehmen, Baselines prüfen, dann der PR.
4. Nach dem Merge ist Staging vollständig.
5. Beim Release nach `main` führt der Betreiber die Migration auf `production` aus. Bis dahin kennt das Production-Studio die neuen Typen nicht, und die Daten bleiben im alten Format, das die neue Website als Links darstellt.

## Doku

- `apps/web/AGENTS.md`, Abschnitt „Main navigation“: die beiden Typen, keine Übersicht, die Entscheidung nach `_type`.
- `apps/studio/AGENTS.md`: ein Absatz zum Hauptmenü mit den beiden Arten und der Migration `main-navigation-menus`.

## Nicht enthalten

- Eine dritte Ebene oder Menüs in Unterpunkten
- Eine Umstellung eines bestehenden Links in ein Menü per Klick
- Änderungen an Aussehen und Verhalten von Desktop- und Mobilmenü
