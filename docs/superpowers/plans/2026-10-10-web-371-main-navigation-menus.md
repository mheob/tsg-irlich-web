# WEB-371 Main Menu Links and Menus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The first level of the main menu is either a **Link** (a target, no children) or a **Menu** (children, no target), chosen when an entry is added. The automatic "Übersicht" entry goes away.

**Architecture:**

- The studio replaces `mainNavigationItem` with two array member types, `mainNavigationLink` and `mainNavigationMenu`.
- A migration turns existing entries into one or the other. An entry that had children becomes a menu, and its former target becomes the first child.
- The website's query projects `_type`, and `getNavigationEntries` turns a menu into a group of its children and everything else into a link. Desktop and mobile menus render entries as before.

**Tech Stack:** Sanity Studio 6 (`defineType`, `defineField`, `Rule.custom`, `sanity/migrate`), GROQ with `defineQuery`, Next.js 16 (App Router), Vitest through Vite+, Playwright with recorded fixtures, GitButler (`but`).

**Spec:** `docs/superpowers/specs/2026-10-10-web-371-main-navigation-menus-design.md` (approved 2026-10-10). Ticket [WEB-371](https://linear.app/tsg-irlich/issue/WEB-371/hauptmenu-link-oder-menu-auf-der-ersten-ebene).

**Branch:** `feat/web-371-main-navigation-menus`. It exists already and carries the spec commit.

## Global Constraints

**Scope and git**

- Commits go through the `create-commit` skill (`but commit -b feat/web-371-main-navigation-menus -m "…" <ids>`).
  - Conventional Commits, English, subject at most 50 characters, no `Co-Authored-By` or generator trailer.
  - Never a raw `git` write command.
- Run `pnpm run format:check` at the root before every commit, because `but commit` skips lefthook.
- After every task these must be clean:
  - `pnpm run lint` **at the root**, 0 warnings. The per-workspace `pnpm --filter … run lint` has been seen to print nothing while the root run reports warnings, so read the root run.
  - `pnpm run typecheck`
  - the tests of the touched workspaces
- The PR is opened **ready for review** through the `create-pr` skill, with "Closes WEB-371". Kodiak merges on green, so Task 4 (migration on `development`) and Task 5 (fixtures) happen before the PR.

**Data**

- No writes to the Sanity dataset `production`. The production migration is the operator's step at the release.
- The write to `development` happens only in Task 4, after the user's explicit yes immediately before.

**Values (exact)**

- Types and titles:
  - `mainNavigationLink`, title `Link`, icon `RiLinkM`
  - `mainNavigationMenu`, title `Menü`, icon `RiMenuLine`
  - `site-settings.mainNavigation`: `of: [{ type: 'mainNavigationLink' }, { type: 'mainNavigationMenu' }]`
- Menu fields:
  - `title`, the shared title field
  - `children`, an array of `navigationLink`, with the description `Die Einträge des Aufklappmenüs. Ein Menü führt selbst nirgendwohin, die Seite gehört als Unterpunkt hinein.` and the error `Ein Menü braucht mindestens einen Unterpunkt`
  - more than 8 children: the warning `Mehr als 8 Unterpunkte machen das Aufklappmenü unübersichtlich`
  - `hasTwoColumns`: title `Zweispaltig`, `initialValue: false`, description `Stellt das Aufklappmenü auf dem Desktop in zwei Spalten dar.`
- Menu preview subtitle: `Menü · 1 Unterpunkt` or `Menü · N Unterpunkte`.
- Migration:
  - id `main-navigation-menus`
  - overview child `_key: '<item _key>-overview'`, `_type: 'navigationLink'`
  - fallback title `Übersicht`
- Code style as in WEB-367 and WEB-354:
  - tabs, single quotes, named exports, types at the end of a file, JSDoc on every top-level function, export block at the end
  - `sort-keys`, `no-magic-numbers` (0 to 9 free), `max-statements` 10, `max-params` 3
  - in the studio there is no `noUncheckedIndexedAccess`: no `?.` after an index or destructuring
  - German messages for editors

## Review Focus

1. **Old data meets the new website.** Production keeps `mainNavigationItem` entries until the operator migrates at the release. The new website must render such an entry as a link, also one that still has children, and must never crash or drop the whole menu. Pinned in Task 3.
2. **A menu whose children cannot be resolved.** For example every child points at a page without a slug. The menu disappears instead of turning into a link without a target. Pinned in Task 3.
3. **A legacy entry with an odd target.** For example an external target, no target at all, or a blank `overviewTitle`. The migration keeps exactly what was reachable before: external targets stay external, a missing target adds no child, and a blank title becomes "Übersicht". Pinned in Task 2.
4. **A second migration run.** Entries already migrated stay byte for byte the same, and the document gets no patch. Pinned in Task 2.
5. **A new menu saved empty.** The studio calls the children rule with `undefined` for a field never touched. The rule must still report the error. Pinned in Task 1.

---

### Task 1: Studio types `mainNavigationLink` and `mainNavigationMenu`

**Files:**

- Create: `apps/studio/schemas/objects/main-navigation-link.ts`
- Create: `apps/studio/schemas/objects/main-navigation-menu.ts`
- Test: `apps/studio/schemas/objects/main-navigation-link.test.ts`
- Test: `apps/studio/schemas/objects/main-navigation-menu.test.ts`
- Modify: `apps/studio/schemas/objects/navigation-link.ts`
  - export the title field as `navigationTitleField`
  - drop the child count from `prepareNavigationLink`
- Modify: `apps/studio/schemas/objects/navigation-link.test.ts`
  - drop the `mainNavigationItem` cases
- Modify: `apps/studio/schemas/singletons/site-settings.tsx:117` (`of`)
- Modify: `apps/studio/schemas/index.ts:27,88` (registration)
- Delete: `apps/studio/schemas/objects/main-navigation-item.ts`

**Interfaces:**

- Produces:
  - `navigationTitleField` (the `title` field definition), exported from `navigation-link.ts`
  - `prepareNavigationLink(selection: { href?: string; linkType?: string; title?: string })`
  - `validateMenuChildren(value: unknown): true | string`
  - `prepareMainNavigationMenu(selection: { children?: unknown; title?: string })`
  - default exports `mainNavigationLink` and `mainNavigationMenu`
- Consumed by Task 2 (the type names) and Task 3 (the type names in the data)

- [ ] **Step 1: Write the failing tests**

`apps/studio/schemas/objects/main-navigation-link.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import mainNavigationLink from './main-navigation-link';

interface LinkType {
	fields: { name: string }[];
	name: string;
	preview: {
		prepare: (selection: { href?: string; linkType?: string; title?: string }) => unknown;
		select: Record<string, string>;
	};
	title: string;
}

const linkType = mainNavigationLink as unknown as LinkType;

describe('main navigation link', () => {
	it('is offered as "Link" when an entry is added', () => {
		expect([linkType.name, linkType.title]).toStrictEqual(['mainNavigationLink', 'Link']);
	});

	// A link of the first level has a target and nothing else: no children, no dropdown text.
	it('has a title, a link type, a page and a url, and no children', () => {
		expect(linkType.fields.map((field) => field.name)).toStrictEqual([
			'title',
			'linkType',
			'link',
			'href',
		]);
	});

	it('shows its target in lists', () => {
		expect(linkType.preview.prepare({ linkType: 'internal', title: 'Home' })).toStrictEqual({
			subtitle: 'Interne Seite',
			title: 'Home',
		});
		expect(
			linkType.preview.prepare({
				href: 'https://www.neuwied.de',
				linkType: 'external',
				title: 'Stadt Neuwied',
			}),
		).toStrictEqual({ subtitle: 'https://www.neuwied.de', title: 'Stadt Neuwied' });
	});
});
```

`apps/studio/schemas/objects/main-navigation-menu.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import mainNavigationMenu, {
	prepareMainNavigationMenu,
	validateMenuChildren,
} from './main-navigation-menu';

interface MenuField {
	description?: string;
	initialValue?: unknown;
	name: string;
	of?: { type: string }[];
	title?: string;
	type: string;
}

const menuType = mainNavigationMenu as unknown as {
	fields: MenuField[];
	name: string;
	title: string;
};

function field(name: string): MenuField | undefined {
	return menuType.fields.find((candidate) => candidate.name === name);
}

describe('main navigation menu', () => {
	it('is offered as "Menü" when an entry is added', () => {
		expect([menuType.name, menuType.title]).toStrictEqual(['mainNavigationMenu', 'Menü']);
	});

	// A menu has no target of its own: the page belongs into it as a child.
	it('has a title, children and the columns switch, and no target', () => {
		expect(menuType.fields.map((candidate) => candidate.name)).toStrictEqual([
			'title',
			'children',
			'hasTwoColumns',
		]);
	});

	it('takes navigation links as children and tells editors where the page goes', () => {
		expect(field('children')).toMatchObject({
			description:
				'Die Einträge des Aufklappmenüs. Ein Menü führt selbst nirgendwohin, die Seite gehört als Unterpunkt hinein.',
			of: [{ type: 'navigationLink' }],
			title: 'Unterpunkte',
			type: 'array',
		});
	});

	it('starts in one column', () => {
		expect(field('hasTwoColumns')).toMatchObject({
			description: 'Stellt das Aufklappmenü auf dem Desktop in zwei Spalten dar.',
			initialValue: false,
			title: 'Zweispaltig',
			type: 'boolean',
		});
	});
});

describe('menu children validation', () => {
	// Review focus 5: the studio hands an untouched field over as `undefined`.
	it.each([
		['missing', undefined],
		['empty', []],
	])('refuses %s children', (_label, value) => {
		expect(validateMenuChildren(value)).toBe('Ein Menü braucht mindestens einen Unterpunkt');
	});

	it('passes with one child', () => {
		expect(validateMenuChildren([{ _key: 'chronik' }])).toBe(true);
	});
});

describe('menu preview', () => {
	it('counts its children in singular and plural', () => {
		expect(prepareMainNavigationMenu({ children: [{}], title: 'Verein' })).toStrictEqual({
			subtitle: 'Menü · 1 Unterpunkt',
			title: 'Verein',
		});
		expect(prepareMainNavigationMenu({ children: [{}, {}], title: 'Verein' })).toStrictEqual({
			subtitle: 'Menü · 2 Unterpunkte',
			title: 'Verein',
		});
	});

	it('counts no children for a menu without any', () => {
		expect(prepareMainNavigationMenu({ title: 'Neu' })).toStrictEqual({
			subtitle: 'Menü · 0 Unterpunkte',
			title: 'Neu',
		});
	});
});
```

- [ ] **Step 2: Run them**

Run: `pnpm --filter studio exec vp test run schemas/objects/main-navigation-link.test.ts schemas/objects/main-navigation-menu.test.ts` Expected: FAIL with "Failed to resolve import "./main-navigation-link"" (and the same for the menu).

- [ ] **Step 3: Export the title field and simplify the link preview**

In `apps/studio/schemas/objects/navigation-link.ts`:

1. Pull the first entry of `navigationLinkFields` out into its own constant and use it there:

```ts
const navigationTitleField = defineField({
	name: 'title',
	title: 'Bezeichnung',
	type: 'string',
	validation: (Rule) => [
		Rule.required().error('Die Bezeichnung ist erforderlich'),
		Rule.max(MAX_TITLE_LENGTH).warning(
			`Die Bezeichnung sollte nicht länger als ${MAX_TITLE_LENGTH} Zeichen sein`,
		),
	],
});

const navigationLinkFields = [
	navigationTitleField,
	// … the linkType, link and href fields stay exactly as they are
];
```

2. Replace `prepareNavigationLink` with the version without the child count:

```ts
/**
 * Builds the list preview of a navigation link.
 *
 * @param selection - The selected fields.
 * @returns The title and a subtitle naming the target.
 */
function prepareNavigationLink(selection: NavigationLinkSelection): NavigationLinkPreview {
	const { href, linkType, title } = selection;
	return { subtitle: linkType === EXTERNAL_LINK_TYPE ? href : 'Interne Seite', title };
}
```

3. Remove `childCount` from `interface NavigationLinkSelection`, and add `navigationTitleField` to the export block.

In `apps/studio/schemas/objects/navigation-link.test.ts`, delete:

- the import of `main-navigation-item`
- `mainNavigationFields()`
- the two preview cases `counts the children of a main navigation item in singular and plural` and `leaves the child count out when a main navigation item has none`
- the field cases `adds the children and the dropdown settings to a main navigation item`, `groups the children and the dropdown settings in one fieldset` and `hides %s until the item has children`

Every other case stays.

- [ ] **Step 4: Write `main-navigation-link.ts`**

```ts
import { RiLinkM } from 'react-icons/ri';
import { defineType } from 'sanity';

import { navigationLinkFields, prepareNavigationLink } from './navigation-link';

/** A first-level entry that leads somewhere: a page or an external URL, without children. */
const mainNavigationLink = defineType({
	fields: navigationLinkFields,
	icon: RiLinkM,
	name: 'mainNavigationLink',
	preview: {
		prepare: prepareNavigationLink,
		select: { href: 'href', linkType: 'linkType', title: 'title' },
	},
	title: 'Link',
	type: 'object',
});

export default mainNavigationLink;
```

- [ ] **Step 5: Write `main-navigation-menu.ts`**

```ts
import { RiMenuLine } from 'react-icons/ri';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { navigationTitleField } from './navigation-link';
import type { NavigationLinkPreview } from './navigation-link';

/** More children than this make the dropdown hard to scan. */
const MAX_CHILDREN = 8;

/**
 * Requires at least one child. The studio calls the rule with `undefined` for a field never
 * touched, so a missing array counts as empty.
 *
 * @param value - The children.
 * @returns `true`, or the error shown to the editor.
 */
function validateMenuChildren(value: unknown): true | string {
	return Array.isArray(value) && value.length > 0
		? true
		: 'Ein Menü braucht mindestens einen Unterpunkt';
}

/**
 * Builds the list preview of a menu, counting its children.
 *
 * @param selection - The title and the `children` array.
 * @returns The title and a subtitle like `Menü · 2 Unterpunkte`.
 */
function prepareMainNavigationMenu(selection: MainNavigationMenuSelection): NavigationLinkPreview {
	const count = Array.isArray(selection.children) ? selection.children.length : 0;
	const children = count === 1 ? '1 Unterpunkt' : `${count} Unterpunkte`;
	return { subtitle: `Menü · ${children}`, title: selection.title };
}

/** A first-level entry that only opens a dropdown; the pages are its children. */
const mainNavigationMenu = defineType({
	fields: [
		navigationTitleField,
		defineField({
			description:
				'Die Einträge des Aufklappmenüs. Ein Menü führt selbst nirgendwohin, die Seite gehört als Unterpunkt hinein.',
			name: 'children',
			of: [defineArrayMember({ type: 'navigationLink' })],
			title: 'Unterpunkte',
			type: 'array',
			validation: (Rule) => [
				Rule.custom(validateMenuChildren),
				Rule.max(MAX_CHILDREN).warning(
					`Mehr als ${MAX_CHILDREN} Unterpunkte machen das Aufklappmenü unübersichtlich`,
				),
			],
		}),
		defineField({
			description: 'Stellt das Aufklappmenü auf dem Desktop in zwei Spalten dar.',
			initialValue: false,
			name: 'hasTwoColumns',
			title: 'Zweispaltig',
			type: 'boolean',
		}),
	],
	icon: RiMenuLine,
	name: 'mainNavigationMenu',
	preview: {
		prepare: prepareMainNavigationMenu,
		select: { children: 'children', title: 'title' },
	},
	title: 'Menü',
	type: 'object',
});

interface MainNavigationMenuSelection {
	children?: unknown;
	title?: string;
}

export default mainNavigationMenu;
export { prepareMainNavigationMenu, validateMenuChildren };
```

- [ ] **Step 6: Register the types and switch the menu over**

1. In `apps/studio/schemas/index.ts`, replace the import of `./objects/main-navigation-item` with imports of `./objects/main-navigation-link` and `./objects/main-navigation-menu`. In the "Objects" list, replace `mainNavigationItem` with `mainNavigationLink` and `mainNavigationMenu`, keeping the list sorted.
2. In `apps/studio/schemas/singletons/site-settings.tsx`, set `of: [{ type: 'mainNavigationLink' }, { type: 'mainNavigationMenu' }]` on `mainNavigation`.
3. Delete `apps/studio/schemas/objects/main-navigation-item.ts`.

Run `pnpm run extract-types` at the root, then `pnpm exec vp fmt apps/studio/schema.json`.

Do **not** run `typegen:sanity` yet. The web app still projects the old fields until Task 3, and regenerating now would break its test fixtures. Task 3 regenerates the types together with the new query.

- [ ] **Step 7: Run the studio suite**

Run: `pnpm --filter studio exec vp test run` Expected: PASS. The old migration `main-navigation-items` works on plain strings, not on the schema, so its tests still pass until Task 2 deletes it.

- [ ] **Step 8: Commit**

```bash
pnpm run lint && pnpm run typecheck && pnpm run format:check
but diff
but commit -b feat/web-371-main-navigation-menus -m "feat(studio): split menu entries into links and menus" <ids>
```

---

### Task 2: Migration `main-navigation-menus`

**Files:**

- Create: `apps/studio/migrations/main-navigation-menus/index.ts`
- Test: `apps/studio/migrations/main-navigation-menus/index.test.ts`
- Delete: `apps/studio/migrations/main-navigation-items/` (both files)
- Modify: `apps/studio/AGENTS.md` (a paragraph on the main menu, after the "TSG-Echo archive import" section)

**Interfaces:**

- Consumes: the type names `mainNavigationLink`, `mainNavigationMenu` and `navigationLink` (Task 1)
- Produces: default export `migration`, named export `toMenuOrLink(item: NavigationItem): NavigationItem`

- [ ] **Step 1: Write the failing tests**

`apps/studio/migrations/main-navigation-menus/index.test.ts`:

```ts
import { at, set } from 'sanity/migrate';
import type { SanityDocument } from 'sanity/migrate';
import { describe, expect, it } from 'vite-plus/test';

import migration, { toMenuOrLink } from './index';

type DocumentMigration = (document: SanityDocument) => unknown;

function migrate(mainNavigation?: unknown): unknown {
	const { document } = migration.migrate as { document: DocumentMigration };

	return document({
		_createdAt: '2026-01-01T00:00:00Z',
		_id: 'site-settings',
		_rev: 'rev',
		_type: 'site-settings',
		_updatedAt: '2026-01-01T00:00:00Z',
		mainNavigation,
	} as SanityDocument);
}

const ABOUT_US = { _ref: 'aboutUs', _type: 'reference' };
const ECHO = { _ref: 'echoOverview', _type: 'reference' };
const ECHO_CHILD = {
	_key: 'echo',
	_type: 'navigationLink',
	link: ECHO,
	linkType: 'internal',
	title: 'TSG Echo',
};

const LEGACY_HOME = {
	_key: 'home',
	_type: 'mainNavigationItem',
	link: { _ref: 'home', _type: 'reference' },
	linkType: 'internal',
	title: 'Home',
};

// The "Verein" entry of `development` on 2026-10-10.
const LEGACY_VEREIN = {
	_key: 'verein',
	_type: 'mainNavigationItem',
	children: [ECHO_CHILD],
	hasTwoColumns: false,
	link: ABOUT_US,
	linkType: 'internal',
	overviewDescription: 'Wer wir sind und wofür wir stehen',
	overviewTitle: 'Über uns',
	title: 'Verein',
};

describe('moving the main menu to links and menus', () => {
	// Review focus 4.
	it.each([
		{
			_key: 'home',
			_type: 'mainNavigationLink',
			link: LEGACY_HOME.link,
			linkType: 'internal',
			title: 'Home',
		},
		{ _key: 'verein', _type: 'mainNavigationMenu', children: [ECHO_CHILD], title: 'Verein' },
	])('leaves a $_type unchanged', (item) => {
		expect(toMenuOrLink(item)).toBe(item);
	});

	it('turns an entry without children into a link and drops the dropdown fields', () => {
		expect(
			toMenuOrLink({ ...LEGACY_HOME, children: [], hasTwoColumns: false, overviewTitle: 'x' }),
		).toStrictEqual({
			_key: 'home',
			_type: 'mainNavigationLink',
			link: LEGACY_HOME.link,
			linkType: 'internal',
			title: 'Home',
		});
	});

	it('keeps an external entry external', () => {
		expect(
			toMenuOrLink({
				_key: 'stadt',
				_type: 'mainNavigationItem',
				href: 'https://www.neuwied.de',
				linkType: 'external',
				title: 'Stadt',
			}),
		).toStrictEqual({
			_key: 'stadt',
			_type: 'mainNavigationLink',
			href: 'https://www.neuwied.de',
			linkType: 'external',
			title: 'Stadt',
		});
	});

	it('turns an entry with children into a menu led by its former target', () => {
		expect(toMenuOrLink(LEGACY_VEREIN)).toStrictEqual({
			_key: 'verein',
			_type: 'mainNavigationMenu',
			children: [
				{
					_key: 'verein-overview',
					_type: 'navigationLink',
					description: 'Wer wir sind und wofür wir stehen',
					link: ABOUT_US,
					linkType: 'internal',
					title: 'Über uns',
				},
				ECHO_CHILD,
			],
			hasTwoColumns: false,
			title: 'Verein',
		});
	});

	// Review focus 3.
	it.each([undefined, null, '', '   '])(
		'titles the former target "Übersicht" when the overview title is %j',
		(overviewTitle) => {
			const menu = toMenuOrLink({
				...LEGACY_VEREIN,
				overviewDescription: undefined,
				overviewTitle,
			});

			expect((menu.children as unknown[])[0]).toStrictEqual({
				_key: 'verein-overview',
				_type: 'navigationLink',
				link: ABOUT_US,
				linkType: 'internal',
				title: 'Übersicht',
			});
		},
	);

	it('keeps an external former target external', () => {
		const menu = toMenuOrLink({
			...LEGACY_VEREIN,
			href: 'https://www.tsg-irlich.de',
			link: undefined,
			linkType: 'external',
			overviewDescription: undefined,
		});

		expect((menu.children as unknown[])[0]).toStrictEqual({
			_key: 'verein-overview',
			_type: 'navigationLink',
			href: 'https://www.tsg-irlich.de',
			linkType: 'external',
			title: 'Über uns',
		});
	});

	it('adds no child for an entry that had no target', () => {
		expect(toMenuOrLink({ ...LEGACY_VEREIN, link: undefined }).children).toStrictEqual([
			ECHO_CHILD,
		]);
	});

	it('refuses an entry without a title', () => {
		expect(() => toMenuOrLink({ ...LEGACY_HOME, title: ' ' })).toThrow(
			'Der Menüpunkt "home" hat keine Bezeichnung.',
		);
	});

	it('refuses an unknown type', () => {
		expect(() => toMenuOrLink({ _key: 'x', _type: 'internalLink', title: 'X' })).toThrow(
			'Der Menüpunkt "x" hat den unbekannten Typ "internalLink".',
		);
	});
});

describe('the document migration', () => {
	it('rewrites the whole menu when an entry changed', () => {
		expect(migrate([LEGACY_HOME, LEGACY_VEREIN])).toStrictEqual([
			at('mainNavigation', set([toMenuOrLink(LEGACY_HOME), toMenuOrLink(LEGACY_VEREIN)])),
		]);
	});

	// Review focus 4: a second run writes nothing.
	it('leaves a migrated menu alone', () => {
		expect(migrate([toMenuOrLink(LEGACY_HOME), toMenuOrLink(LEGACY_VEREIN)])).toStrictEqual([]);
	});

	it('leaves a document without a menu alone', () => {
		expect(migrate()).toStrictEqual([]);
	});

	it('refuses a menu that is not a list of entries', () => {
		expect(() => migrate([{ title: 'ohne Schlüssel' }])).toThrow(
			'Das Hauptmenü hat nicht die erwartete Form.',
		);
	});
});
```

Format the file with `pnpm exec vp fmt` before running it. The long literal lines above are wrapped by the formatter.

- [ ] **Step 2: Run them**

Run: `pnpm --filter studio exec vp test run migrations/main-navigation-menus` Expected: FAIL with "Failed to resolve import "./index"".

- [ ] **Step 3: Write the migration**

`apps/studio/migrations/main-navigation-menus/index.ts`:

```ts
import { at, defineMigration, set } from 'sanity/migrate';

const LINK_TYPE = 'mainNavigationLink';
const MENU_TYPE = 'mainNavigationMenu';
const LEGACY_TYPE = 'mainNavigationItem';
const CHILD_TYPE = 'navigationLink';
const EXTERNAL_LINK_TYPE = 'external';
const OVERVIEW_TITLE = 'Übersicht';

/**
 * Whether a value has the minimum shape of an array member: a string `_key` and `_type`.
 *
 * @param value - One entry of `mainNavigation`.
 * @returns `true` if the migration can read the entry.
 */
function isNavigationItem(value: unknown): value is NavigationItem {
	return (
		typeof value === 'object' &&
		value !== null &&
		'_key' in value &&
		typeof value._key === 'string' &&
		'_type' in value &&
		typeof value._type === 'string'
	);
}

/**
 * The target fields of an entry, leaving out the ones without a value.
 *
 * @param item - A legacy entry.
 * @returns `linkType`, `link` and `href`, as far as they are set.
 */
function toTarget(item: NavigationItem): Pick<NavigationItem, 'href' | 'link' | 'linkType'> {
	return {
		...(item.href ? { href: item.href } : {}),
		...(item.link ? { link: item.link } : {}),
		...(item.linkType ? { linkType: item.linkType } : {}),
	};
}

/**
 * Whether a legacy entry led anywhere. A missing `linkType` counts as internal, as everywhere else.
 *
 * @param item - A legacy entry.
 * @returns `true` for a page reference, or a URL on an external entry.
 */
function hasTarget(item: NavigationItem): boolean {
	return item.linkType === EXTERNAL_LINK_TYPE ? Boolean(item.href) : Boolean(item.link);
}

/**
 * The former target of an entry with children, as the first child of its menu. It carries the
 * title and sub-text the "Übersicht" link showed.
 *
 * @param item - A legacy entry with children.
 * @returns The child.
 */
function toOverviewChild(item: NavigationItem): NavigationItem {
	const title = item.overviewTitle?.trim();
	const description = item.overviewDescription?.trim();
	return {
		_key: `${item._key}-overview`,
		_type: CHILD_TYPE,
		...(description ? { description } : {}),
		...toTarget(item),
		title: title ? title : OVERVIEW_TITLE,
	};
}

/**
 * Turns one entry of the main menu into a link or a menu. An entry with children becomes a menu
 * led by its former target, so no page drops out of the navigation.
 *
 * @param item - An entry of `mainNavigation`.
 * @returns The migrated entry, or the very same object if it is migrated already.
 * @throws {Error} For an entry without a title or of an unknown type, so the migration never writes
 *   a half-converted menu.
 */
function toMenuOrLink(item: NavigationItem): NavigationItem {
	if (item._type === LINK_TYPE || item._type === MENU_TYPE) {
		return item;
	}
	if (item._type !== LEGACY_TYPE) {
		throw new Error(`Der Menüpunkt "${item._key}" hat den unbekannten Typ "${item._type}".`);
	}
	if (!item.title?.trim()) {
		throw new Error(`Der Menüpunkt "${item._key}" hat keine Bezeichnung.`);
	}
	const children = item.children ?? [];
	if (children.length === 0) {
		return { _key: item._key, _type: LINK_TYPE, ...toTarget(item), title: item.title };
	}
	return {
		_key: item._key,
		_type: MENU_TYPE,
		children: [...(hasTarget(item) ? [toOverviewChild(item)] : []), ...children],
		hasTwoColumns: item.hasTwoColumns === true,
		title: item.title,
	};
}

const migration = defineMigration({
	documentTypes: ['site-settings'],
	migrate: {
		document({ mainNavigation }) {
			if (mainNavigation === undefined) {
				return [];
			}
			if (
				!Array.isArray(mainNavigation) ||
				!mainNavigation.every((value) => isNavigationItem(value))
			) {
				throw new Error('Das Hauptmenü hat nicht die erwartete Form.');
			}
			const migrated = mainNavigation.map((item) => toMenuOrLink(item));
			// Everything is migrated already: nothing to patch.
			if (migrated.every((item, index) => item === mainNavigation[index])) {
				return [];
			}
			return [at('mainNavigation', set(migrated))];
		},
	},
	title: 'Das Hauptmenü auf Links und Menüs umstellen',
});

interface NavigationItem {
	_key: string;
	_type: string;
	children?: unknown[];
	description?: string;
	hasTwoColumns?: boolean;
	href?: string;
	link?: { _ref: string; _type: string };
	linkType?: string;
	overviewDescription?: null | string;
	overviewTitle?: null | string;
	title?: string;
}

export default migration;
export { toMenuOrLink };
```

The "turns an entry with children into a menu" test expects `hasTwoColumns: false` for `LEGACY_VEREIN`, which has it set to `false`. An entry without the field also becomes `false`, which is the field's initial value.

- [ ] **Step 4: Run the tests and delete the old migration**

Run: `pnpm --filter studio exec vp test run migrations/main-navigation-menus` Expected: PASS.

Delete `apps/studio/migrations/main-navigation-items/index.ts` and `index.test.ts`.

Run: `pnpm --filter studio run test:coverage` Expected: PASS, thresholds met.

- [ ] **Step 5: Document the main menu in `apps/studio/AGENTS.md`**

Add after the "TSG-Echo archive import" section:

```markdown
## Main menu

`site-settings.mainNavigation` holds two kinds of first-level entries, which "Hinzufügen" offers by name (WEB-371):

- `mainNavigationLink` ("Link"): a title and a target, a page or an external URL, with no children.
- `mainNavigationMenu` ("Menü"): a title, at least one child (`navigationLink`, with an optional sub-text for the desktop dropdown) and "Zweispaltig". A menu has no target of its own; the page belongs into it as a child.

The migration `main-navigation-menus` turned the earlier `mainNavigationItem` entries into these. An entry with children became a menu, and its former target became the first child, titled like the old "Übersicht" link. It is idempotent and runs like every migration here, `development` first.
```

- [ ] **Step 6: Commit**

```bash
pnpm run lint && pnpm run typecheck && pnpm run format:check
but diff
but commit -b feat/web-371-main-navigation-menus -m "feat(studio): migrate menu entries to links and menus" <ids incl. the two deletions>
```

---

### Task 3: Website query and view model

**Files:**

- Modify: `apps/web/src/lib/sanity/queries/main-navigation.ts`
- Modify: `apps/web/src/components/with-logic/navigation/navigation-entries.ts`
- Test: `apps/web/src/components/with-logic/navigation/navigation-entries.test.ts`
- Modify: `apps/web/src/components/with-logic/navigation/navigation.test.tsx` (fixtures)
- Modify (generated): `apps/web/src/types/sanity.types.generated.ts`
- Modify: `apps/web/AGENTS.md`, section "Main navigation"

**Interfaces:**

- Consumes: the type names from Task 1
- Produces: `NavigationItemData` with `_type: string` and without `overviewTitle` and `overviewDescription`. `getNavigationEntries` keeps its signature. `OVERVIEW_TITLE` is no longer exported.

- [ ] **Step 1: Rewrite the view model tests**

In `navigation-entries.test.ts`, replace the helper `item` with two helpers:

```ts
function link(data: NavigationLinkData): NavigationItemData {
	return { ...data, _type: 'mainNavigationLink', children: [] };
}

function menu(
	key: string,
	title: string | null,
	children: NavigationLinkData[],
): NavigationItemData {
	return {
		_key: key,
		_type: 'mainNavigationMenu',
		children,
		href: null,
		link: null,
		linkType: null,
		title,
	};
}
```

Then replace every `item(X)` without children with `link(X)`. That covers the blocks "plain links" and "active state", which call `item` with one argument only.

Replace the blocks "dropdown texts and columns" and "groups" with:

```ts
describe('dropdown texts and columns', () => {
	it('passes the description of a child through', () => {
		const entry = asGroup(
			getNavigationEntries(
				[menu('verein', 'Verein', [VEREIN, { ...KONTAKT, description: 'So erreichst du uns' }])],
				'/',
			)[0],
		);

		expect(entry.links.map((entryLink) => entryLink.description)).toStrictEqual([
			null,
			'So erreichst du uns',
		]);
	});

	it('renders a menu in one column unless it asks for two', () => {
		const [oneColumn, twoColumns] = getNavigationEntries(
			[
				menu('verein', 'Verein', [KONTAKT]),
				{ ...menu('news', 'Aktuelles', [FUSSBALL]), hasTwoColumns: true },
			],
			'/',
		);

		expect(asGroup(oneColumn).hasTwoColumns).toBe(false);
		expect(asGroup(twoColumns).hasTwoColumns).toBe(true);
	});
});

describe('menus', () => {
	// WEB-371: a menu has no target of its own, so nothing is added in front of its children.
	it('lists exactly its children, in their order', () => {
		const [entry] = getNavigationEntries(
			[menu('verein', 'Verein', [VEREIN, KONTAKT, NEUWIED])],
			'/',
		);

		expect(entry).toStrictEqual({
			hasTwoColumns: false,
			isActive: false,
			key: 'verein',
			kind: 'group',
			links: [
				{
					description: null,
					href: '/verein',
					isActive: false,
					isExternal: false,
					key: 'verein',
					title: 'Verein',
				},
				{
					description: null,
					href: '/kontakt',
					isActive: false,
					isExternal: false,
					key: 'kontakt',
					title: 'Kontakt',
				},
				{
					description: null,
					href: 'https://www.neuwied.de',
					isActive: false,
					isExternal: true,
					key: 'neuwied',
					title: 'Stadt Neuwied',
				},
			],
			title: 'Verein',
		});
	});

	// Review focus 2.
	it('drops a menu none of whose children can be resolved', () => {
		expect(
			getNavigationEntries(
				[menu('verein', 'Verein', [internal('broken', 'Kaputt', { slug: null, type: 'contact' })])],
				'/',
			),
		).toStrictEqual([]);
	});

	it('drops a menu without a title, since its trigger would have no label', () => {
		expect(getNavigationEntries([menu('verein', null, [KONTAKT])], '/')).toStrictEqual([]);
	});

	it('marks only the longest matching child active', () => {
		const [entry] = getNavigationEntries(
			[menu('news', 'Aktuelles', [NEWS, FUSSBALL])],
			'/news/fussball',
		);

		expect(asGroup(entry).isActive).toBe(true);
		expect(
			asGroup(entry).links.map((entryLink) => [entryLink.title, entryLink.isActive]),
		).toStrictEqual([
			['Aktuelles', false],
			['Fußball', true],
		]);
	});

	it('marks the menu active through any of its children', () => {
		const [entry] = getNavigationEntries([menu('verein', 'Verein', [KONTAKT])], '/kontakt');

		expect(asGroup(entry).isActive).toBe(true);
	});

	it('leaves the menu inactive when none of its children matches', () => {
		const [entry] = getNavigationEntries([menu('verein', 'Verein', [KONTAKT])], '/angebot');

		expect(asGroup(entry).isActive).toBe(false);
	});
});

// Review focus 1: production keeps the old type until the operator migrates at the release.
describe('entries not migrated yet', () => {
	it('renders an old entry as a link, also when it still has children', () => {
		const [entry] = getNavigationEntries(
			[{ ...VEREIN, _type: 'mainNavigationItem', children: [KONTAKT] }],
			'/',
		);

		expect(asLink(entry)).toMatchObject({ href: '/verein', title: 'Verein' });
	});
});
```

`menu` and `link` shadow nothing in the file. If oxlint reports `no-shadow` for the `link` parameter of the `.map` callbacks, the callbacks above already use `entryLink`.

- [ ] **Step 2: Run them**

Run: `pnpm --filter web exec vp test run src/components/with-logic/navigation/navigation-entries.test.ts` Expected: FAIL. Typecheck errors on `_type` count too. The cases that must fail are:

- `lists exactly its children` (an "Übersicht" link is still added)
- `drops a menu none of whose children can be resolved` (it falls back to a link today)
- `renders an old entry as a link` (it becomes a group today)

- [ ] **Step 3: Change the query**

In `apps/web/src/lib/sanity/queries/main-navigation.ts`:

```ts
export const mainNavigationQuery = defineQuery(`
	*[_type == 'site-settings'][0] {
		mainNavigation[] {
			_type,
			${navigationLinkFields},
			hasTwoColumns,
			"children": coalesce(children[] { ${navigationLinkFields}, description }, [])
		}
	}
`);
```

Run `pnpm run extract-types && pnpm run typegen:sanity` at the root, then `pnpm exec vp fmt apps/studio/schema.json apps/web/src/types`.

- [ ] **Step 4: Change the view model**

In `navigation-entries.ts`:

1. Delete `OVERVIEW_TITLE` and remove it from the export block.
2. Add `const MENU_TYPE = 'mainNavigationMenu';`.
3. Replace `toEntry` with `toGroup` and a new `toEntry`:

```ts
/**
 * Turns a menu into a group of its children. A menu has no target of its own (WEB-371).
 *
 * @param item - The menu, with its title already checked.
 * @param pathname - The current path.
 * @returns The group, or `undefined` when none of its children can be rendered.
 */
function toGroup(
	item: NavigationItemData & { title: string },
	pathname: string,
): NavigationEntry | undefined {
	const links = markLongestMatch(
		item.children
			.map((child) => toLink(child))
			.filter((entryLink): entryLink is NavigationLink => entryLink !== undefined),
		pathname,
	);
	if (links.length === 0) {
		return undefined;
	}
	return {
		hasTwoColumns: item.hasTwoColumns === true,
		isActive: links.some((entryLink) => entryLink.isActive),
		key: item._key,
		kind: 'group',
		links,
		title: item.title,
	};
}

/**
 * Turns one entry of the main menu into what both menus render. A menu becomes a group, anything
 * else a link, including an old `mainNavigationItem` that was not migrated yet.
 *
 * @param item - The entry from `mainNavigationQuery`.
 * @param pathname - The current path.
 * @returns The entry, or `undefined` when it cannot be rendered.
 */
function toEntry(item: NavigationItemData, pathname: string): NavigationEntry | undefined {
	if (!item.title) {
		return undefined;
	}
	if (item._type === MENU_TYPE) {
		return toGroup({ ...item, title: item.title }, pathname);
	}
	const target = toLink(item);
	return target
		? { kind: 'link', link: { ...target, isActive: isCurrent(target, pathname) } }
		: undefined;
}
```

4. Update the doc comment of `getNavigationEntries`. Its description becomes: "Turns the main navigation from Sanity into what both menus render: resolved hrefs, the active state, and a group for every menu."
5. Change `interface NavigationItemData`:

```ts
interface NavigationItemData extends NavigationLinkData {
	_type: string;
	children: readonly NavigationLinkData[];
	hasTwoColumns?: boolean | null;
}
```

- [ ] **Step 5: Update the shell test fixtures**

In `navigation.test.tsx`, `NavItem` is the generated query type. Rebuild the three fixtures in its new shape:

- `VEREIN` becomes a menu: `_type: 'mainNavigationMenu'`, `href: null`, `link: null`, `linkType: null`, `hasTwoColumns: false`, and `children` with a first child `{ _key: 'ueber-uns', description: null, href: null, link: { _type: 'aboutUs', category: null, slug: 'verein' }, linkType: 'internal', title: 'Über uns' }` in front of the existing `kontakt` child.
- `ANGEBOT` and `UNRESOLVABLE` get `_type: 'mainNavigationLink'`, lose `overviewTitle` and `overviewDescription`, and keep `children: []` and `hasTwoColumns: null`.

The click on `'Übersicht'` in the last mobile case becomes a click on `'Über uns'`.

If the generated union differs from these shapes (for example `children` typed as `never[]` on a link, or `hasTwoColumns` missing), follow the generated type exactly and write a ruling.

Run: `pnpm --filter web exec vp test run src/components/with-logic/navigation` Expected: PASS. `desktop-navigation.test.tsx` and `mobile-navigation.test.tsx` build `NavigationEntry` objects directly and need no change. Their "Übersicht" is just a link title there.

- [ ] **Step 6: Update `apps/web/AGENTS.md`**

Replace the opening paragraph and the first bullet of "Main navigation" with:

```markdown
`site-settings.mainNavigation` holds two kinds of first-level entries (WEB-371):

- a `mainNavigationLink` (title, `linkType`, a page `link` or an external `href`), and
- a `mainNavigationMenu` (title, `children` of type `navigationLink` with an optional `description`, and `hasTwoColumns`).

`mainNavigationQuery` reads them with their `_type`. `src/components/with-logic/navigation/` renders them:

- `getNavigationEntries` (`navigation-entries.ts`) is the only place that resolves hrefs and the active state.
  - A menu becomes a group of exactly its children. There is no automatic "Übersicht" entry; the page belongs into the menu as a child.
  - A menu none of whose children resolves is dropped. Every other type becomes a link, including a `mainNavigationItem` from before the migration.
  - Inside a group only the link with the longest matching href is active. A missing `linkType` counts as internal.
```

Also fix the `internalLinkTarget` bullet under "Internal links": "the `link` of every `mainNavigationItem` and `navigationLink`" becomes "the `link` of every `mainNavigationLink` and `navigationLink`".

- [ ] **Step 7: Run the web suite and commit**

Run: `pnpm --filter web run test:coverage` Expected: PASS, thresholds met.

```bash
pnpm run lint && pnpm run typecheck && pnpm run format:check
but diff
but commit -b feat/web-371-main-navigation-menus -m "feat(web): render menus without an overview link" <ids>
```

---

### Task 4: Migration on `development`

This task writes to Sanity `development`. **Ask the user for an explicit yes immediately before Step 2.** Name the dataset and the change: the five menu entries become four links and the menu "Verein" with "Über uns" and "TSG Echo".

**Files:** none in the repository.

- [ ] **Step 1: Dry run**

Run (in `apps/studio`): `pnpm exec sanity migration run main-navigation-menus --project j4rxwl5m --dataset development` Expected: one patch on `site-settings` that sets `mainNavigation` to four `mainNavigationLink` entries and one `mainNavigationMenu` "Verein".

- [ ] **Step 2: Real run, after the yes**

Run: `pnpm exec sanity migration run main-navigation-menus --project j4rxwl5m --dataset development --no-dry-run --no-confirm` Expected: one document migrated.

- [ ] **Step 3: Check the result**

Run this through the Sanity MCP `query_documents` (project `j4rxwl5m`, dataset `development`, perspective `raw`):

```groq
*[_type == "site-settings"]{_id, "items": mainNavigation[]{_type, title, "children": children[]{title, "to": link->_type}}}
```

Expected:

- one published and, if one exists, one draft document
- in each: `Home`, `Angebot`, `Aktuelles` and `Mitgliedschaft` as `mainNavigationLink`
- `Verein` as `mainNavigationMenu`, with the children `Über uns` (`aboutUs`) and `TSG Echo` (`echoOverview`)

A draft of `site-settings` is migrated as well, since the migration runs over drafts too. If the draft still has `mainNavigationItem`, run Step 2 again; it is idempotent.

- [ ] **Step 4: Run it once more**

Run the dry run again. Expected: no patch.

---

### Task 5: End-to-end fixture of the main menu

The fixtures are keyed by the request URL. The new query text gives the menu a new fixture file, and the old one is no longer requested. The e2e specs (`e2e/specs/navigation.spec.ts`) rely on the test menu recorded for WEB-343:

- "Verein" with "Kontakt" and the external "Stadt Neuwied"
- an "Übersicht" link

Today's `development` holds a different "Verein". So the new fixture keeps the old test menu in the new shape, instead of what `development` holds now.

**Files:**

- Create: `apps/web/e2e/fixtures/sanity/<new hash>.json`
- Delete: `apps/web/e2e/fixtures/sanity/38146dff9ed85ee8.json` (the old menu fixture)

- [ ] **Step 1: Record the navigation spec to learn the new key**

Run: `cd apps/web && E2E_RECORD=1 pnpm exec playwright test e2e/specs/navigation.spec.ts --project=chromium` Expected: assertions may fail, since recording uses the real `development` menu. Exactly one new fixture file contains `"mainNavigation"`. Find it with `grep -l '"mainNavigation"' e2e/fixtures/sanity/*.json`.

- [ ] **Step 2: Keep only the new menu fixture**

Recording rewrote other fixtures with today's `development` content. Discard every modification under `e2e/fixtures/sanity/`. Pass each id to `but discard`, one per call, since zsh does not split a variable into ids. Keep only the new menu file as an addition.

- [ ] **Step 3: Write the old test menu into the new fixture**

Replace the `body.result.mainNavigation` of the new file with the one of `38146dff9ed85ee8.json`, converted to the new projection. Do it with a scratchpad script, not by hand:

- every entry gets `_type`
- `overviewTitle` and `overviewDescription` are removed
- "Verein" (it has children) becomes `_type: 'mainNavigationMenu'`, with `href`, `link` and `linkType` set to `null`
  - its `children` start with `{ _key: 'verein-overview', description: null, href: null, link: <the old Verein link>, linkType: 'internal', title: 'Übersicht' }`
  - followed by the old children
- the other entries become `_type: 'mainNavigationLink'` with `children: []`

Keep the file's `url` as recorded. Then delete `38146dff9ed85ee8.json`.

- [ ] **Step 4: Run the mocked suite**

Run: `pnpm --filter web run test:e2e` Expected: PASS, all specs. `navigation.spec.ts` still finds "Übersicht", "Kontakt" and "Stadt Neuwied", which now come from the menu's children. The visual specs skip themselves on macOS. CI compares the baselines in the container, and the closed menu bar looks the same as before.

- [ ] **Step 5: Commit**

```bash
pnpm run format:check
but diff
but commit -b feat/web-371-main-navigation-menus -m "test(web): carry the e2e menu over to links and menus" <ids>
```

The commit body says that the fixture keeps the WEB-343 test menu converted to the new shape, and is not a recording of today's `development`.

---

## After the plan

- Final whole-branch review (`superpowers:executing-plans`), then the PR through `create-pr`:
  - ready for review
  - "Closes WEB-371"
  - the production step in the body
- Bind the PR and turn on Auto-fix. WEB-371 moves to In Review.
- **Production, by the operator at the release to `main`:**

  ```bash
  pnpm exec sanity migration run main-navigation-menus --project j4rxwl5m --dataset production
  ```

  This is the dry run. Then the same with `--no-dry-run --no-confirm`.
