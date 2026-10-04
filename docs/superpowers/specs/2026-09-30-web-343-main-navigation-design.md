# Hauptnavigation mit Unterpunkten (WEB-343) — Design-Spec

Datum: 2026-09-30 · Status: entschieden, noch nicht umgesetzt · Ticket: [WEB-343](https://linear.app/tsg-irlich/issue/WEB-343/hauptnavigation-unterpunkte-ermoglichen-und-kontakt-button-auf) (GitHub-Issue [#585](https://github.com/mheob/tsg-irlich-web/issues/585))

Scope: **Grundlage für eine zweite Ebene der Hauptnavigation** (Studio-Schema, Migration, Query, Frontend) und ein **kompakterer Kontakt-Button zwischen `lg` und `xl`**. Die Unterseiten „Chronik“, „Vision“ und „Sportstätten“ unter „Verein“ sowie der neue Hauptpunkt „Partner“ sind eigene Tickets und hier ausdrücklich nicht enthalten.

## Ausgangslage

- `apps/web/src/components/with-logic/navigation.tsx` ist eine Client-Komponente mit etwa 200 Zeilen. Sie rendert eine flache Liste zweimal: als Desktop-Leiste ab `lg` und als Mobil-Menü darunter. Das Mobil-Menü ist eine Disclosure. Im geschlossenen Zustand ist es `inert`, Escape schließt es und gibt den Fokus an den Toggle zurück (WEB-300, WEB-306).
- Die Menü-Einträge in `site-settings.mainNavigation` sind `internalLink`- oder `externalLink`-Objekte. Keiner der beiden Typen deklariert ein Feld `title`. Die Labels („Home“, „Verein“, „Angebot“, „Aktuelles“, „Mitgliedschaft“) stehen trotzdem in den Daten, sie stammen aus einem älteren Schema. Redakteure können sie im Studio deshalb nicht bearbeiten, und die Typgenerierung liefert `title: null`. `navigation.test.tsx` umgeht das mit `title: null` in allen Fixtures und einem langen Kommentar.
- `mainNavigationQuery` projiziert nur `"link": link->`. Ein `externalLink` hat kein Feld `link`, sondern `href`, und fällt im Frontend deshalb stillschweigend weg. Heute nutzt ihn kein Eintrag.
- `internalLink` wird außerdem als Annotation im Fließtext (`block-content.ts`) und als Feld im Impressum verwendet. Felder für die Navigation gehören dort nicht hin.
- Der Kontakt-Button steht ab `lg` als `secondary`-Button in voller Größe neben der Leiste. Mit `KONTAKT AUFNEHMEN` und 2,5 rem Innenabstand links und rechts ist er rund 290 px breit. Bei 1024 px wird die Leiste dadurch eng.
- Im Mobil-Menü ist der Kontakt-Button `sm:hidden`, die Desktop-Variante erscheint erst ab `lg`. Zwischen 640 und 1023 px gibt es deshalb gar keinen Kontakt-Button. Das stammt aus dem Refactor in #316 und war nicht beabsichtigt.
- `@base-ui/react` 1.8.0 bringt `NavigationMenu` und `Collapsible` mit. `NavigationMenu.Link` setzt bei `active` selbst `aria-current="page"`.
- Die E2E-Fixtures werden aus dem Dataset `development` aufgezeichnet (`.env.e2e`).

## Entschiedene Optionen

| Frage | Entscheidung |
| --- | --- |
| Hauptpunkt mit Unterpunkten | Er ist ein Trigger und öffnet das Panel. Der erste Eintrag im Panel ist automatisch „Übersicht“ auf die Seite des Hauptpunkts, danach folgen die Unterpunkte. |
| Kontakt zwischen `lg` und `xl` | `secondary`, Größe `sm`, Label „Kontakt“. Ab `xl` unverändert „Kontakt aufnehmen“. |
| Kontakt zwischen 640 und 1023 px | Im Mobil-Menü unter `lg` immer sichtbar, `sm:hidden` entfällt. |
| Datenmodell | Eigene Typen `navigationLink` und `mainNavigationItem`. Die bestehenden Einträge werden per Migration umgestellt. |
| Externe Links | Bleiben erlaubt, auf beiden Ebenen, und werden korrekt gerendert. |
| Tiefe | Genau eine Unterebene |
| Aufbau im Frontend | Die Navigation wird in einen Ordner mit Hülle, Desktop-Menü, Mobil-Menü und einer reinen Funktion für das Anzeigemodell aufgeteilt. |
| Desktop | Base UI `NavigationMenu`, über `shadcn add navigation-menu` (Stil `base-lyra`) geholt und auf die Klassen der App übertragen |
| Mobil | Bestehendes Mobil-Menü, Gruppen als Base UI `Collapsible` (`shadcn add collapsible`) |

Verworfen wurden `NavigationMenu` auch für das Mobil-Menü (es kollidiert mit der bestehenden Disclosure samt `inert`, Escape und Fokus-Rückgabe) und ein selbst gebautes Dropdown (Hover-Absicht, Pfeiltasten und Fokussteuerung wären nachzubauen).

## Studio

### Objekttypen

Beide liegen in `apps/studio/schemas/objects/` und werden in `schemas/index.ts` registriert.

**`navigationLink`** (`navigation-link.ts`), ein einzelner Menüpunkt:

| Feld | Typ | Titel | Regeln |
| --- | --- | --- | --- |
| `title` | `string` | Bezeichnung | Pflicht. Warnung ab 20 Zeichen, weil längere Labels die Leiste sprengen. |
| `linkType` | `string` | Art des Links | Radio (horizontal): `internal` „Interne Seite“, `external` „Externe URL“. Standard `internal`, Pflicht. |
| `link` | `reference` | Seite | Ziele aus `INTERNAL_LINK_TARGETS`. Ausgeblendet, wenn `linkType === 'external'`, sonst Pflicht. |
| `href` | `url` | URL | Nur `http` und `https`. Nur sichtbar, wenn `linkType === 'external'`, dort Pflicht. |

- Ein fehlendes `linkType` gilt überall als `internal`: im `hidden`-Callback, in der Validierung und im Frontend.
- `INTERNAL_LINK_TARGETS` ist die Zielliste, die heute inline in `internal-link.ts` steht. Sie wird dort als benannte Konstante exportiert und von beiden Typen genutzt, damit neue Seitentypen nur an einer Stelle ergänzt werden.
- Vorschau: Titel ist die Bezeichnung. Untertitel ist bei extern die URL, sonst „Interne Seite“.
- Beim Umschalten von `linkType` bleibt der Wert im ausgeblendeten Feld stehen. Das ist unkritisch, weil das Frontend ausschließlich nach `linkType` entscheidet.

**`mainNavigationItem`** (`main-navigation-item.ts`), ein Eintrag der Hauptebene:

- dieselben vier Felder wie `navigationLink`, aus einem gemeinsam exportierten Feld-Array übernommen,
- dazu `children`, ein optionales Array aus `navigationLink` mit dem Titel „Unterpunkte“ und der Beschreibung „Unterpunkte erscheinen als Aufklappmenü. Die Seite des Hauptpunkts wird dort automatisch als ‚Übersicht‘ verlinkt.“ Ab mehr als 8 Unterpunkten gibt es eine Warnung.
- Vorschau wie bei `navigationLink`. Sind Unterpunkte gepflegt, nennt der Untertitel zusätzlich ihre Anzahl („3 Unterpunkte“).

Beide Typen bekommen Icons aus `react-icons/ri`.

### Site Settings

`mainNavigation` bekommt `of: [{ type: 'mainNavigationItem' }]`. `externalLink` als eigenes Array-Mitglied entfällt, weil externe Links jetzt über `linkType` laufen. Die Pflicht-Validierung des Arrays bleibt.

### Migration `main-navigation-items`

Liegt in `apps/studio/migrations/main-navigation-items/index.ts`, nach dem Muster von `split-site-settings-address`:

- `documentTypes: ['site-settings']`, Handler `migrate.document`. Ein `migrate.object`-Handler scheidet aus, weil er auch die `internalLink`-Objekte im Fließtext und im Impressum träfe.
- Die reine Funktion `toMainNavigationItem(item)` stellt einen Eintrag um und wird exportiert:
  - `mainNavigationItem` bleibt unverändert, dadurch lässt sich die Migration beliebig oft ausführen.
  - `internalLink` wird zu `{ _key, _type: 'mainNavigationItem', linkType: 'internal', link, title }`.
  - `externalLink` wird zu `{ _key, _type: 'mainNavigationItem', linkType: 'external', href, title }`.
  - Ein Eintrag ohne nicht-leeren `title` oder mit unbekanntem `_type` wirft einen Fehler mit deutscher Meldung. So schreibt die Migration nie ein halb umgestelltes Menü.
- Die Migration setzt `mainNavigation` als Ganzes neu (`at('mainNavigation', set(…))`), und nur dann, wenn sich mindestens ein Eintrag geändert hat. Sonst gibt sie `[]` zurück.
- `index.test.ts` prüft `toMainNavigationItem` für alle fünf Fälle.

Ausführung laut `apps/studio/AGENTS.md`: erst ein Probelauf, dann `--no-dry-run`, jeweils mit `--project j4rxwl5m --dataset <dataset>`.

## Query und Typen

`apps/web/src/lib/sanity/queries/main-navigation.ts`:

```groq
*[_type == 'site-settings'][0] {
	mainNavigation[] {
		_key,
		title,
		linkType,
		href,
		"link": link-> { ${internalLinkTarget} },
		"children": coalesce(children[] {
			_key,
			title,
			linkType,
			href,
			"link": link-> { ${internalLinkTarget} }
		}, [])
	}
}
```

Die gemeinsame Projektion der vier Link-Felder wird als lokaler `/* groq */`-String in der Datei gehalten und zweimal eingesetzt. Die Query liest die Felder unabhängig von `_type`, deshalb läuft das Frontend vor und nach der Migration. Vor der Migration liefert sie `linkType: null`, und das gilt wie im Studio als `internal`.

Danach aus dem Root `pnpm run extract-types && pnpm run typegen:sanity`. `title` ist in `MainNavigationQueryResult` dann `string | null` statt `null`.

## Frontend

### Aufbau

`apps/web/src/components/with-logic/navigation/` ersetzt `navigation.tsx` und `navigation.test.tsx`:

| Datei | Aufgabe |
| --- | --- |
| `navigation.tsx` | Hülle (`'use client'`): Scroll- und Mobil-Zustand, Escape-Handler, Logo, `<nav aria-label="Hauptnavigation">`, Kontakt-Buttons. Baut das Anzeigemodell einmal pro Pfad (`useMemo`) und gibt es an beide Menüs weiter. |
| `desktop-navigation.tsx` | Leiste ab `lg` auf `ui/navigation-menu.tsx` |
| `mobile-navigation.tsx` | Inhalt des Mobil-Menüs mit Gruppen auf `ui/collapsible.tsx` |
| `navigation-anchor.tsx` | Rendert einen Link intern als `next/link` oder extern als `ExternalLink` mit Hinweis, und reicht Props und `ref` durch (für Base UIs `render`) |
| `navigation-entries.ts` | Reine Funktion `getNavigationEntries(items, pathname)` |

Die Tests liegen jeweils daneben. `app/layout.tsx` importiert von `@/components/with-logic/navigation/navigation`. Ein `index.ts` gibt es nicht, wie bei `with-logic/feedback/`.

### Anzeigemodell

```ts
interface NavigationLink {
	href: string;
	isActive: boolean;
	isExternal: boolean;
	key: string;
	title: string;
}

type NavigationEntry =
	| { kind: 'link'; link: NavigationLink }
	| { isActive: boolean; key: string; kind: 'group'; links: NavigationLink[]; title: string };
```

`getNavigationEntries` gilt für jeden Eintrag und jeden Unterpunkt:

- **Auflösung:** Bei `linkType === 'external'` kommt der `href` direkt aus den Daten, sonst aus `getInternalHref(link)`. Einträge ohne auflösbaren `href` oder ohne `title` fallen weg.
- **Gruppe oder Link:** Bleibt mindestens ein Unterpunkt übrig, wird der Eintrag zur Gruppe, sonst zum einfachen Link.
- **Übersicht:** In einer Gruppe ist `links[0]` „Übersicht“ mit dem `href` des Hauptpunkts und dem Schlüssel `${key}-overview`, danach folgen die Unterpunkte. Lässt sich der Hauptpunkt selbst nicht auflösen, entfällt „Übersicht“, die Gruppe bleibt.
- **Aktiv, Grundregel:** Ein Pfad passt zu einem `href`, wenn er gleich ist oder mit `href/` beginnt. `/` passt nur exakt, externe Links passen nie. Das ist das heutige `isActivePage`.
- **Aktiv in einer Gruppe:** Unter „Übersicht“ und den Unterpunkten ist nur der Link mit dem längsten passenden `href` aktiv, bei Gleichstand der erste. So trägt auf `/verein/chronik` nur „Chronik“ `aria-current`, nicht auch „Übersicht“.
- **Aktiv, Gruppe als Ganzes:** Die Gruppe gilt als aktiv, sobald einer ihrer Links aktiv ist.

### Desktop

- `ui/navigation-menu.tsx` kommt über `shadcn add navigation-menu`. Wie AGENTS.md verlangt, werden die Klassen danach auf die der App übertragen.
- Das `NavigationMenu`-Root ersetzt den heutigen Container `hidden lg:flex`. Base UI rendert das Root als `<nav>`, deshalb bekommt es `render={<div />}`. Sonst stünde ein zweites, unbenanntes `<nav>` im `<nav aria-label="Hauptnavigation">`.
- Das Popup liegt in einem Portal am Ende von `<body>`, also außerhalb des Landmarks. Tests suchen die Links im Panel deshalb auf Seitenebene.
- **Einfacher Eintrag:** `NavigationMenuLink` mit `render={<NavigationAnchor … />}` und `active`, das Erscheinungsbild wie heute (uppercase, bold, `text-primary`, `h-16`, `px-3`, Hover `bg-secondary/40`). Aktiv (`data-active`) zeigt er die Linie `border-b-2 border-secondary`.
- **Gruppe:** `NavigationMenuTrigger` im selben Stil mit `ChevronDown` (lucide), der sich bei `data-popup-open` um 180° dreht. Eine aktive Gruppe bekommt dieselbe Linie über eine Klasse. `aria-current` gehört nicht auf den Button.
- **Panel:** `NavigationMenuContent` mit einer Liste aus `NavigationMenuLink`, jeweils mit `closeOnClick` und `active`. Die Einträge sind normal geschrieben (keine Großbuchstaben), `text-foreground`, Hover `bg-muted/40`, aktiv `bg-secondary/40`.
- **Popup:** Der Wrapper liefert Portal, Positioner und Popup. Das Popup hat einen weißen Hintergrund (`bg-background`), Schatten, einen kleinen Radius und sitzt linksbündig unter dem Trigger.
- Hover und Tastatur bringt Base UI mit: Enter, Space oder Pfeil nach unten öffnet, Tab führt ins Panel und hinter dem letzten Link wieder hinaus (das Panel schließt dabei), Escape schließt und gibt den Fokus an den Trigger zurück. Die Verzögerungen bleiben auf 50 ms.
- Schrumpft die Leiste beim Scrollen, hängt der Positioner weiter am Trigger und wandert mit.

### Mobil

- Das bestehende Verhalten bleibt unverändert: `inert` im geschlossenen Zustand, Escape mit Fokus-Rückgabe an den Toggle, Schließen beim Folgen eines Links.
- Die Einträge stehen in einer Liste (`<ul>`/`<li>`), heute sind es lose Links.
- **Einfacher Eintrag:** sonst wie heute.
- **Gruppe:** `Collapsible` mit `defaultOpen={group.isActive}`.
  - Der Trigger ist ein Button über die ganze Zeile, im Stil der heutigen Einträge, mit `ChevronDown`, der sich bei `data-panel-open` dreht. `aria-expanded` setzt Base UI.
  - Das Panel enthält die Links der Gruppe eingerückt (`pl-6`). Es bleibt mit `keepMounted` im DOM und ist zugeklappt `hidden`: nicht fokussierbar, aber im server-gerenderten HTML, damit Crawler die Unterseiten finden. Die Desktop-Panels rendert Base UI erst beim Öffnen.
- Der Kontakt-Button am Ende steht ohne `sm:hidden`.

### Externe Links

`NavigationAnchor` rendert externe Links über `ExternalLink` (`target="_blank"`, `rel="noopener noreferrer"`). Hinter die Bezeichnung kommen ein `ArrowUpRight`-Icon (`aria-hidden`, `size-4`) und `<span className="sr-only">(öffnet in neuem Tab)</span>`.

### Kontakt

Die Buttons sitzen im Desktop-Bereich der Hülle, jeweils mit eigenem Wrapper für die Sichtbarkeit:

- `<div className="hidden lg:block xl:hidden">` mit `ButtonLink` secondary, `size="sm"`, „Kontakt“,
- `<div className="hidden xl:block">` mit `ButtonLink` secondary, „Kontakt aufnehmen“, Größe wie heute je nach `isScrolled`.

Die Wrapper sind nötig, weil die Utility `btn` selbst `display: inline-flex` setzt und die Reihenfolge gegenüber `hidden` nicht zuverlässig ist. Es ist immer nur einer der beiden Buttons sichtbar und im Accessibility-Tree.

## Tests

### Unit (Vitest)

- **`navigation-entries.test.ts`** prüft (läuft wie alles unter `src/components/` im Projekt `dom`, braucht aber kein DOM):
  - interne und externe Links, `linkType: null` als intern,
  - dass Einträge und Unterpunkte ohne `href` oder `title` wegfallen,
  - dass eine Gruppe ohne verbleibende Unterpunkte zum Link wird,
  - eine Gruppe ohne auflösbaren Hauptpunkt (dann ohne „Übersicht“),
  - „Übersicht“ an erster Stelle,
  - die Regeln für „aktiv“: längster Treffer gewinnt, `/` nur exakt, extern nie aktiv, Gruppe aktiv über einen Unterpunkt.
- **`navigation.test.tsx`** (Projekt `dom`) zieht in den Ordner um:
  - Die Fixtures bekommen echte Titel, der Umweg samt Kommentar entfällt, Links werden über den zugänglichen Namen gefunden.
  - Alle bisherigen Fälle bleiben erhalten: `aria-current`, Landmark-Name, Toggle-Name, `aria-controls`, `inert` auf und zu, Escape mit Fokus, Schließen beim Folgen eines Links.
  - Neu:
    - Der Desktop-Trigger öffnet das Panel mit „Übersicht“ und den Unterpunkten.
    - Mobil klappt eine Gruppe auf, eine Gruppe mit der aktuellen Seite ist schon offen.
    - Externe Links haben `target`, `rel` und den sr-Text.
    - „Kontakt“ und „Kontakt aufnehmen“ sind vorhanden, mobil auch ohne `sm:hidden`.
  - Macht Base UIs Positioner in jsdom Probleme, wird `test-utils/setup-dom.ts` ergänzt. Die Tastaturbedienung des Desktop-Panels prüft in jedem Fall E2E.
- **Studio:**
  - `navigation-link.test.ts` prüft, dass je nach `linkType` die Referenz oder die URL Pflicht ist, und dass ein fehlendes `linkType` als intern gilt.
  - `migrations/main-navigation-items/index.test.ts` prüft `toMainNavigationItem`.
- Die Coverage-Schwellen müssen halten. Steigen die Werte, werden die Schwellen nach der Ratchet-Regel angehoben.

### E2E (Playwright)

- **Beispieldaten im Dev-Dataset:** „Verein“ bekommt die Unterpunkte „Kontakt“ (intern, Seite `contact`) und „Stadt Neuwied“ (extern, `https://www.neuwied.de`). Beide doppeln keinen Hauptpunkt.
- **`e2e/specs/navigation.spec.ts`:**
  - **Desktop:**
    - „Verein“ öffnet per Klick, „Übersicht“ führt zu `/verein`.
    - Per Tastatur öffnet Enter auf dem Trigger das Panel, Tab erreicht „Übersicht“, Escape schließt es und gibt den Fokus an den Trigger zurück.
    - Tab hinter dem letzten Link im Panel schließt es und landet auf „Angebot“.
    - Der externe Unterpunkt hat `target="_blank"`.
    - Bei 1100 px Breite ist „Kontakt“ sichtbar und „Kontakt aufnehmen“ nicht, bei 1280 px umgekehrt. Bei 800 px steht „Kontakt aufnehmen“ im geöffneten Mobil-Menü.
  - **Mobil:** die Gruppe „Verein“ aufklappen und „Kontakt“ folgen.
  - Der bestehende Rundgang über die Desktop-Leiste bleibt unverändert, er klickt „Verein“ ohnehin nicht an.
  - Der bestehende Mobil-Test nutzt heute den Link „Verein“ (`a[href="/verein"]`), der mobil zum Gruppen-Trigger wird. Er stellt deshalb auf „Angebot“ (`/angebot`) um. Prüfung von `inert`, Fokus und Escape bleibt gleich.
- Danach die Fixtures mit `pnpm run e2e:record` neu aufzeichnen. Der axe-Sweep (14 Routen, beide Projekte) muss ohne neuen Eintrag in `KNOWN_VIOLATIONS` durchlaufen.
- Die visuellen Baselines im Container mit `pnpm --filter web run test:e2e:visual:update` neu erzeugen. Erwartet ist nur der Chevron an „Verein“ auf Desktop (1280 px = `xl`, Kontakt-Button unverändert), mobil ist das Menü zu.

### Weitere Prüfungen

- Lighthouse läuft sonst nur mit einer Vercel-Preview, also mit einem PR. Stattdessen gibt es einen lokalen Lauf gegen `next start`, geprüft werden Accessibility und SEO (Ziel 1). Best Practices liegt lokal bekanntermaßen bei 0,96 und zählt nicht.
- Vor jedem Commit laufen `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:coverage` und im Root `pnpm exec oxfmt --check`, weil `but commit` Lefthook überspringt.

## Ablauf

1. Branch `feat/web-343-main-navigation-submenus` in GitButler.
2. Commits nach logischen Schritten, jeweils über `create-commit`: Studio mit Typen und Migration, Query und Typen, UI-Wrapper, Navigation, E2E mit Fixtures und Baselines.
3. Dev-Dataset: Migration (erst Probelauf, dann echt) und Beispiel-Unterpunkte, erst nach ausdrücklicher Freigabe.
4. Kein Pull Request und kein Push, bis sie freigegeben sind.
5. **Production nach dem Release von `next` auf `main`:** Das Release bringt das neue Studio und das Frontend. Bis zur Migration zeigt das Studio die alten Einträge als unbekannten Typ, das Frontend läuft weiter. Deshalb läuft die Migration auf `production` direkt danach, erst als Probelauf und nach Freigabe echt. Die Aufgabe wird als Memory-Notiz und als Kommentar in WEB-343 festgehalten.

## Risiken

- **jsdom und Base UI:** `NavigationMenu` misst über Floating UI. Reichen die vorhandenen Stubs nicht, werden sie ergänzt. Notfalls prüfen die Unit-Tests nur das Öffnen, die Tastatur deckt E2E ab.
- **Höhe des Mobil-Menüs:** Das Menü hat keine eigene Scroll-Fläche. Mit den Beispiel-Unterpunkten passt es auf einem iPhone SE (667 px). Wachsen die Gruppen später deutlich, braucht das Menü `overflow-y-auto` mit einer Höhe aus `dvh`. Das ist nicht Teil dieses Tickets.
- **Synchronisiertes GitHub-Issue #585:** Nach dem Merge prüfen, ob es geschlossen ist, sonst setzt die Synchronisierung das Ticket von Done zurück.
