# WEB-343 Main Navigation Submenus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the main navigation a second level (desktop panel, mobile disclosure) backed by dedicated Sanity types with a migration, render external links correctly, and shrink the contact button between `lg` and `xl`.

**Architecture:**

- The studio gets two object types, `navigationLink` and `mainNavigationItem` (title, internal/external link, optional children), plus a migration that turns the existing `internalLink`/`externalLink` entries into `mainNavigationItem`.
- On the web side, a pure function turns the query result into a view model (`NavigationEntry[]`). `navigation.tsx` becomes a folder with four parts:
  - a shell holding scroll state, mobile state and the contact buttons,
  - a desktop bar on Base UI `NavigationMenu`,
  - a mobile list on Base UI `Collapsible`,
  - a shared anchor that renders internal links through `next/link` and external ones through `ExternalLink`.

**Tech Stack:** Next.js 16 App Router, React 19, `@base-ui/react` 1.8.0 (`NavigationMenu`, `Collapsible`), Tailwind CSS 4, `lucide-react`, Sanity Studio (`defineType`, `sanity/migrate`), Vitest 4 + Testing Library, Playwright 1.63 with `@axe-core/playwright`, GitButler (`but`).

**Spec:** `docs/superpowers/specs/2026-09-30-web-343-main-navigation-design.md`

**Branch:** `feat/web-343-main-navigation-submenus` (already created in GitButler, holds the spec commit).

## Global Constraints

**Scope and git**

- **No pull request and no push.** Everything stays local until the user releases it.
- Commits through the `create-commit` skill, which resolves to `but commit -b feat/web-343-main-navigation-submenus -m "…" <ids>`. Conventional Commits, English message, no `Co-Authored-By` and no generator trailer. Never a raw `git` write command.
- Before every commit run `pnpm exec oxfmt --check` from the repository root. `but commit` skips lefthook, and generated files (`apps/studio/schema.json`, `sanity.types.generated.ts`, e2e fixtures) come out unformatted. Format with `pnpm exec oxfmt <paths>`. Leave `.claude/launch.json` out of every commit.
- After every task these must be clean: `pnpm run lint`, `pnpm run typecheck` and `pnpm --filter <workspace> run test`.
- **Writes to the Sanity dataset `development` (migration, sample data) need an explicit "yes" from the user in chat right before they happen.** Never write to `production`.

**Copy**

- User-facing strings are German and exact: `Übersicht`, `Kontakt`, `Kontakt aufnehmen`, `(öffnet in neuem Tab)`, `Hauptnavigation`, `Menü`.
- Studio titles and descriptions are German.

**Code style**

- Tabs, single quotes, function declarations for components, named exports, interfaces and types at the end of the file, kebab-case file names.
- Outside test files `sort-keys` and `no-magic-numbers` are active: keep object keys sorted and name numeric constants.
- No `try`/`catch`/`finally` in components or hooks.
- Composition goes through Base UI's `render` prop, never `asChild`.

**Tests**

- Explicit imports from `vitest`.
- `describe` titles are lowercase and never equal an imported identifier. Hooks sit inside a `describe`.
- No `@testing-library/jest-dom`: use `.toBeNull()`, `.not.toBeNull()` and plain attribute checks.
- Assert role, accessible name, text and href. Never class names, never a `data-testid`.
- Expected values come from the implementation, not from this plan's prose. If the code contradicts a value below, that is a finding: report it and assert what the code really does.

## Review Focus

1. An editor adds a child that points at the same page as its parent. Expected: both links show, and only "Übersicht" carries `aria-current`. Pinned in Task 3.
2. An editor switches an item from internal to external. The hidden `link` value stays in the data, and the frontend must follow `href` and never mark the item active. Pinned in Task 3.
3. Between 1024 and 1279 px only "Kontakt" is visible. From 1280 px only "Kontakt aufnehmen". Below 1024 px the opened mobile menu holds "Kontakt aufnehmen", at 640–1023 px too. Pinned in Task 10 (E2E, because jsdom has no CSS).
4. Clicking a link inside the open desktop panel closes the panel (`closeOnClick`). Pinned in Task 6.
5. Tabbing past the last link of an open desktop panel closes it and moves on to the next top-level item. Pinned in Task 10.

---

### Task 1: Studio navigation types

**Files:**

- Modify: `apps/studio/schemas/objects/internal-link.ts`
- Create: `apps/studio/schemas/objects/navigation-link.ts`
- Create: `apps/studio/schemas/objects/main-navigation-item.ts`
- Create: `apps/studio/schemas/objects/navigation-link.test.ts`
- Modify: `apps/studio/schemas/index.ts` (imports and `schemaTypes` objects block)
- Modify: `apps/studio/schemas/singletons/site-settings.tsx:112-123` (`mainNavigation` field)
- Regenerate: `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`

**Interfaces:**

- Produces:
  - `INTERNAL_LINK_TARGETS: { type: string }[]` (named export of `internal-link.ts`)
  - from `navigation-link.ts`: `navigationLinkFields`, `isExternalLink(parent: unknown): boolean`, `validatePageReference(value: unknown, context: ValidationContext): true | string`, `validateExternalUrl(value: unknown, context: ValidationContext): true | string`, `prepareNavigationLink(selection: NavigationLinkSelection): { subtitle?: string; title?: string }`
  - `prepareMainNavigationItem(selection: MainNavigationItemSelection)` from `main-navigation-item.ts`
  - the schema types `navigationLink` and `mainNavigationItem`

- [ ] **Step 1: Write the failing test**

`apps/studio/schemas/objects/navigation-link.test.ts`:

```ts
import type { ValidationContext } from 'sanity';
import { describe, expect, it } from 'vitest';

import mainNavigationItem, { prepareMainNavigationItem } from './main-navigation-item';
import navigationLink, {
	isExternalLink,
	prepareNavigationLink,
	validateExternalUrl,
	validatePageReference,
} from './navigation-link';

function withParent(parent?: Record<string, unknown>): ValidationContext {
	return { parent } as unknown as ValidationContext;
}

function fieldNames(type: unknown): string[] {
	return (type as { fields: { name: string }[] }).fields.map((field) => field.name);
}

describe('navigation link types', () => {
	describe('link type', () => {
		it('treats only "external" as an external link', () => {
			expect(isExternalLink({ linkType: 'external' })).toBe(true);
			expect(isExternalLink({ linkType: 'internal' })).toBe(false);
		});

		// Entries written before the migration carry no `linkType` and are internal links.
		it('treats a missing link type or a missing parent as internal', () => {
			expect(isExternalLink({})).toBe(false);
			expect(isExternalLink(undefined)).toBe(false);
		});
	});

	describe('page reference validation', () => {
		it('requires a page for an internal link', () => {
			expect(validatePageReference(undefined, withParent({ linkType: 'internal' }))).toBe(
				'Bitte eine Seite auswählen',
			);
		});

		it('requires a page when the link type is missing', () => {
			expect(validatePageReference(undefined, withParent({}))).toBe('Bitte eine Seite auswählen');
		});

		it('passes once a page is selected', () => {
			expect(
				validatePageReference(
					{ _ref: 'aboutUs', _type: 'reference' },
					withParent({ linkType: 'internal' }),
				),
			).toBe(true);
		});

		it('does not ask for a page on an external link', () => {
			expect(validatePageReference(undefined, withParent({ linkType: 'external' }))).toBe(true);
		});
	});

	describe('external url validation', () => {
		it('requires a url for an external link', () => {
			expect(validateExternalUrl(undefined, withParent({ linkType: 'external' }))).toBe(
				'Bitte eine URL angeben',
			);
		});

		it('passes once a url is set', () => {
			expect(
				validateExternalUrl('https://www.neuwied.de', withParent({ linkType: 'external' })),
			).toBe(true);
		});

		it('does not ask for a url on an internal link', () => {
			expect(validateExternalUrl(undefined, withParent({ linkType: 'internal' }))).toBe(true);
		});
	});

	describe('preview', () => {
		it('labels an internal link as such', () => {
			expect(prepareNavigationLink({ linkType: 'internal', title: 'Verein' })).toStrictEqual({
				subtitle: 'Interne Seite',
				title: 'Verein',
			});
		});

		it('shows the url of an external link', () => {
			expect(
				prepareNavigationLink({
					href: 'https://www.neuwied.de',
					linkType: 'external',
					title: 'Stadt Neuwied',
				}),
			).toStrictEqual({ subtitle: 'https://www.neuwied.de', title: 'Stadt Neuwied' });
		});

		it('counts the children of a main navigation item in singular and plural', () => {
			expect(
				prepareMainNavigationItem({ children: [{}], linkType: 'internal', title: 'Verein' }),
			).toStrictEqual({ subtitle: 'Interne Seite · 1 Unterpunkt', title: 'Verein' });
			expect(
				prepareMainNavigationItem({
					children: [{}, {}, {}],
					linkType: 'internal',
					title: 'Verein',
				}),
			).toStrictEqual({ subtitle: 'Interne Seite · 3 Unterpunkte', title: 'Verein' });
		});

		it('leaves the child count out when a main navigation item has none', () => {
			expect(prepareMainNavigationItem({ linkType: 'internal', title: 'Home' })).toStrictEqual({
				subtitle: 'Interne Seite',
				title: 'Home',
			});
		});
	});

	describe('fields', () => {
		it('gives a navigation link a title, a link type, a page and a url', () => {
			expect(fieldNames(navigationLink)).toStrictEqual(['title', 'linkType', 'link', 'href']);
		});

		it('adds the children to a main navigation item', () => {
			expect(fieldNames(mainNavigationItem)).toStrictEqual([
				'title',
				'linkType',
				'link',
				'href',
				'children',
			]);
		});
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter studio exec vitest run schemas/objects/navigation-link.test.ts` Expected: FAIL, `Failed to resolve import "./main-navigation-item"`.

- [ ] **Step 3: Export the internal link targets**

In `apps/studio/schemas/objects/internal-link.ts`, move the inline `to` array into a named constant and export it:

```ts
import { LinkIcon } from '@sanity/icons/Link';
import { defineField } from 'sanity';

/** Every document type a link inside the website may point to. */
const INTERNAL_LINK_TARGETS: { type: string }[] = [
	{ type: 'home' },
	{ type: 'aboutUs' },
	{ type: 'contact' },
	{ type: 'departmentsPage' },
	{ type: 'group.children-gymnastics' },
	{ type: 'group.courses' },
	{ type: 'group.dance' },
	{ type: 'group.other-sports' },
	{ type: 'group.soccer' },
	{ type: 'group.taekwondo' },
	{ type: 'membership' },
	{ type: 'news.article' },
	{ type: 'news.category' },
	{ type: 'newsOverview' },
	{ type: 'accessibility' },
	{ type: 'privacy' },
	{ type: 'imprint' },
];

const internalLink = defineField({
	fields: [
		{
			description: 'Internen Link hinzufügen',
			name: 'link',
			title: 'Link',
			to: INTERNAL_LINK_TARGETS,
			type: 'reference',
			validation: (Rule) => Rule.required().error('Der Link ist erforderlich'),
		},
	],
	icon: LinkIcon,
	name: 'internalLink',
	title: 'Internal Link',
	type: 'object',
});

export default internalLink;
export { INTERNAL_LINK_TARGETS };
```

- [ ] **Step 4: Create `navigation-link.ts`**

```ts
import { RiLinkM } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';
import type { ValidationContext } from 'sanity';

import { INTERNAL_LINK_TARGETS } from './internal-link';

/** Longest label that still fits the desktop bar next to its neighbours. */
const MAX_TITLE_LENGTH = 20;

const EXTERNAL_LINK_TYPE = 'external';
const INTERNAL_LINK_TYPE = 'internal';

/**
 * Whether a navigation link points outside the website. An entry without `linkType` (written before
 * the `main-navigation-items` migration) is an internal link.
 *
 * @param parent - The object holding the `linkType` field.
 * @returns `true` only for `linkType: 'external'`.
 */
function isExternalLink(parent: unknown): boolean {
	return (
		typeof parent === 'object' &&
		parent !== null &&
		'linkType' in parent &&
		parent.linkType === EXTERNAL_LINK_TYPE
	);
}

/**
 * Requires a page for an internal link.
 *
 * @param value - The reference.
 * @param context - The validation context, whose `parent` is the navigation link.
 * @returns `true`, or the error shown to the editor.
 */
function validatePageReference(value: unknown, context: ValidationContext): true | string {
	return isExternalLink(context.parent) || value ? true : 'Bitte eine Seite auswählen';
}

/**
 * Requires a URL for an external link.
 *
 * @param value - The URL.
 * @param context - The validation context, whose `parent` is the navigation link.
 * @returns `true`, or the error shown to the editor.
 */
function validateExternalUrl(value: unknown, context: ValidationContext): true | string {
	return !isExternalLink(context.parent) || value ? true : 'Bitte eine URL angeben';
}

/**
 * Builds the list preview of a navigation link.
 *
 * @param selection - The selected fields, plus the number of children of a main navigation item.
 * @returns The title and a subtitle naming the target and, if there are any, the children.
 */
function prepareNavigationLink({ childCount = 0, href, linkType, title }: NavigationLinkSelection) {
	const target = linkType === EXTERNAL_LINK_TYPE ? href : 'Interne Seite';

	if (childCount === 0) {
		return { subtitle: target, title };
	}

	const children = childCount === 1 ? '1 Unterpunkt' : `${childCount} Unterpunkte`;
	return { subtitle: target ? `${target} · ${children}` : children, title };
}

const navigationLinkFields = [
	defineField({
		name: 'title',
		title: 'Bezeichnung',
		type: 'string',
		validation: (Rule) => [
			Rule.required().error('Die Bezeichnung ist erforderlich'),
			Rule.max(MAX_TITLE_LENGTH).warning(
				`Die Bezeichnung sollte nicht länger als ${MAX_TITLE_LENGTH} Zeichen sein`,
			),
		],
	}),
	defineField({
		initialValue: INTERNAL_LINK_TYPE,
		name: 'linkType',
		options: {
			direction: 'horizontal',
			layout: 'radio',
			list: [
				{ title: 'Interne Seite', value: INTERNAL_LINK_TYPE },
				{ title: 'Externe URL', value: EXTERNAL_LINK_TYPE },
			],
		},
		title: 'Art des Links',
		type: 'string',
		validation: (Rule) => Rule.required().error('Die Art des Links ist erforderlich'),
	}),
	defineField({
		hidden: ({ parent }) => isExternalLink(parent),
		name: 'link',
		title: 'Seite',
		to: INTERNAL_LINK_TARGETS,
		type: 'reference',
		validation: (Rule) => Rule.custom(validatePageReference),
	}),
	defineField({
		hidden: ({ parent }) => !isExternalLink(parent),
		name: 'href',
		title: 'URL',
		type: 'url',
		validation: (Rule) => [
			Rule.uri({ allowRelative: false, scheme: ['http', 'https'] }).error('Die URL ist ungültig.'),
			Rule.custom(validateExternalUrl),
		],
	}),
];

const navigationLink = defineType({
	fields: navigationLinkFields,
	icon: RiLinkM,
	name: 'navigationLink',
	preview: {
		prepare: prepareNavigationLink,
		select: { href: 'href', linkType: 'linkType', title: 'title' },
	},
	title: 'Menüpunkt',
	type: 'object',
});

export default navigationLink;
export {
	isExternalLink,
	navigationLinkFields,
	prepareNavigationLink,
	validateExternalUrl,
	validatePageReference,
};

interface NavigationLinkSelection {
	childCount?: number;
	href?: string;
	linkType?: string;
	title?: string;
}

export type { NavigationLinkSelection };
```

- [ ] **Step 5: Create `main-navigation-item.ts`**

```ts
import { RiMenuLine } from 'react-icons/ri';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { navigationLinkFields, prepareNavigationLink } from './navigation-link';
import type { NavigationLinkSelection } from './navigation-link';

/** More children than this make the dropdown hard to scan. */
const MAX_CHILDREN = 8;

/**
 * Builds the list preview of a main navigation item, counting its children.
 *
 * @param selection - The selected fields, including the `children` array.
 * @returns The preview of `prepareNavigationLink`.
 */
function prepareMainNavigationItem({ children, ...selection }: MainNavigationItemSelection) {
	return prepareNavigationLink({
		...selection,
		childCount: Array.isArray(children) ? children.length : 0,
	});
}

const mainNavigationItem = defineType({
	fields: [
		...navigationLinkFields,
		defineField({
			description:
				'Unterpunkte erscheinen als Aufklappmenü. Die Seite des Hauptpunkts wird dort automatisch als „Übersicht“ verlinkt.',
			name: 'children',
			of: [defineArrayMember({ type: 'navigationLink' })],
			title: 'Unterpunkte',
			type: 'array',
			validation: (Rule) =>
				Rule.max(MAX_CHILDREN).warning(
					`Mehr als ${MAX_CHILDREN} Unterpunkte machen das Aufklappmenü unübersichtlich`,
				),
		}),
	],
	icon: RiMenuLine,
	name: 'mainNavigationItem',
	preview: {
		prepare: prepareMainNavigationItem,
		select: { children: 'children', href: 'href', linkType: 'linkType', title: 'title' },
	},
	title: 'Hauptmenüpunkt',
	type: 'object',
});

export default mainNavigationItem;
export { prepareMainNavigationItem };

interface MainNavigationItemSelection extends Omit<NavigationLinkSelection, 'childCount'> {
	children?: unknown;
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter studio exec vitest run schemas/objects/navigation-link.test.ts` Expected: PASS, 15 tests.

- [ ] **Step 7: Register the types and switch the site settings over**

In `apps/studio/schemas/index.ts`, add the two imports in alphabetical position:

```ts
import mainNavigationItem from './objects/main-navigation-item';
import metFields from './objects/meta';
import navigationLink from './objects/navigation-link';
```

Then extend the `// Objects` block:

```ts
	// Objects
	columns,
	contactTo,
	documentDownload,
	extendedImage,
	externalLink,
	imageCard,
	internalLink,
	mainNavigationItem,
	metFields,
	navigationLink,
	simpleBlockContent,
	socialFields,
	stats,
	trainingTime,
```

In `apps/studio/schemas/singletons/site-settings.tsx`, replace the `of` of `mainNavigation`. `externalLink` stays registered, because the block content annotations use it:

```tsx
		defineField({
			description: 'Seiten und/oder Links für die Hauptnavigation hinzufügen',
			group: 'navigation',
			name: 'mainNavigation',
			of: [{ type: 'mainNavigationItem' }],
			title: 'Hauptmenü',
			type: 'array',
			validation: (Rule) => Rule.required().error('Das Hauptmenü ist erforderlich'),
		}),
```

- [ ] **Step 8: Regenerate the schema and the web types**

Run from the repository root: `pnpm run extract-types && pnpm run typegen:sanity`

Expected: `apps/studio/schema.json` gains `navigationLink` and `mainNavigationItem`. In `apps/web/src/types/sanity.types.generated.ts`, `MainNavigationQueryResult` types `title` as `string | null`. The query is unchanged until Task 8, so it still projects only `_key`, `link` and `title`.

Then run `pnpm exec oxfmt apps/studio/schema.json apps/web/src/types/sanity.types.generated.ts`.

- [ ] **Step 9: Gates**

Run: `pnpm --filter studio run test && pnpm --filter web run test && pnpm run lint && pnpm run typecheck && pnpm exec oxfmt --check` Expected: all green. The existing web navigation fixtures use `title: null`, and `null` is still assignable to `string | null`.

- [ ] **Step 10: Commit**

Through `create-commit`, suggested message `feat(studio): add navigation link types with children`. Files: the six studio files, `apps/studio/schema.json`, `apps/web/src/types/sanity.types.generated.ts`.

---

### Task 2: Migration `main-navigation-items`

**Files:**

- Create: `apps/studio/migrations/main-navigation-items/index.ts`
- Create: `apps/studio/migrations/main-navigation-items/index.test.ts`

**Interfaces:**

- Consumes: the `mainNavigationItem` shape from Task 1 (field names `title`, `linkType`, `link`, `href`, `children`).
- Produces: the default export `defineMigration(…)` (run in Task 9) and `toMainNavigationItem(item: NavigationItem): NavigationItem`.

- [ ] **Step 1: Write the failing test**

`apps/studio/migrations/main-navigation-items/index.test.ts`:

```ts
import { at, set } from 'sanity/migrate';
import type { SanityDocument } from 'sanity/migrate';
import { describe, expect, it } from 'vitest';

import migration, { toMainNavigationItem } from './index';

type DocumentMigration = (document: SanityDocument) => unknown;

function migrate(mainNavigation?: unknown): unknown {
	const { document } = migration.migrate as { document: DocumentMigration };

	// `SanityDocument` names only the system fields; a real document carries its own on top.
	return document({
		_createdAt: '2026-01-01T00:00:00Z',
		_id: 'site-settings',
		_rev: 'rev',
		_type: 'site-settings',
		_updatedAt: '2026-01-01T00:00:00Z',
		mainNavigation,
	} as SanityDocument);
}

const VEREIN_REFERENCE = { _ref: 'aboutUs', _type: 'reference' };

const LEGACY_INTERNAL = {
	_key: '3ec68f9c2d7e',
	_type: 'internalLink',
	link: VEREIN_REFERENCE,
	title: 'Verein',
};

const MIGRATED_INTERNAL = {
	_key: '3ec68f9c2d7e',
	_type: 'mainNavigationItem',
	link: VEREIN_REFERENCE,
	linkType: 'internal',
	title: 'Verein',
};

describe('moving the main navigation to its own item type', () => {
	it('turns an internal link into an internal main navigation item', () => {
		expect(toMainNavigationItem(LEGACY_INTERNAL)).toStrictEqual(MIGRATED_INTERNAL);
	});

	it('turns an external link into an external main navigation item', () => {
		expect(
			toMainNavigationItem({
				_key: 'neuwied',
				_type: 'externalLink',
				href: 'https://www.neuwied.de',
				title: 'Stadt Neuwied',
			}),
		).toStrictEqual({
			_key: 'neuwied',
			_type: 'mainNavigationItem',
			href: 'https://www.neuwied.de',
			linkType: 'external',
			title: 'Stadt Neuwied',
		});
	});

	it('leaves an item that is already migrated untouched, children included', () => {
		const item = { ...MIGRATED_INTERNAL, children: [{ _key: 'child', _type: 'navigationLink' }] };

		expect(toMainNavigationItem(item)).toBe(item);
	});

	it.each([undefined, '', '   '])('refuses an entry whose title is %j', (title) => {
		expect(() => toMainNavigationItem({ ...LEGACY_INTERNAL, title })).toThrow(
			'Der Menüpunkt "3ec68f9c2d7e" hat keine Bezeichnung.',
		);
	});

	it('refuses an entry of an unknown type', () => {
		expect(() => toMainNavigationItem({ ...LEGACY_INTERNAL, _type: 'button' })).toThrow(
			'Der Menüpunkt "3ec68f9c2d7e" hat den unbekannten Typ "button".',
		);
	});

	it('rewrites the whole menu when at least one entry is still a legacy link', () => {
		expect(migrate([LEGACY_INTERNAL])).toStrictEqual([
			at('mainNavigation', set([MIGRATED_INTERNAL])),
		]);
	});

	it('patches nothing once every entry is migrated, so it can run again safely', () => {
		expect(migrate([MIGRATED_INTERNAL])).toStrictEqual([]);
	});

	it('patches nothing when the document has no main navigation', () => {
		expect(migrate()).toStrictEqual([]);
	});

	it('refuses a main navigation that is not a list of entries', () => {
		expect(() => migrate([{ title: 'kein Schlüssel' }])).toThrow(
			'Das Hauptmenü hat nicht die erwartete Form.',
		);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter studio exec vitest run migrations/main-navigation-items/index.test.ts` Expected: FAIL, `Failed to resolve import "./index"`.

- [ ] **Step 3: Implement the migration**

`apps/studio/migrations/main-navigation-items/index.ts`:

```ts
import { at, defineMigration, set } from 'sanity/migrate';

const MAIN_NAVIGATION_ITEM_TYPE = 'mainNavigationItem';

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
 * Turns one entry of the old main navigation into a `mainNavigationItem`. The field names stay the
 * same, so only `_type` changes and `linkType` is added.
 *
 * @param item - An `internalLink`, `externalLink` or already migrated `mainNavigationItem`.
 * @returns The migrated entry, or the very same object if it is migrated already.
 * @throws {Error} When the entry has no title or an unknown type, so the migration never writes a
 *   half-converted menu.
 */
function toMainNavigationItem(item: NavigationItem): NavigationItem {
	if (item._type === MAIN_NAVIGATION_ITEM_TYPE) {
		return item;
	}

	if (!item.title?.trim()) {
		throw new Error(`Der Menüpunkt "${item._key}" hat keine Bezeichnung.`);
	}

	if (item._type === 'internalLink') {
		return {
			_key: item._key,
			_type: MAIN_NAVIGATION_ITEM_TYPE,
			link: item.link,
			linkType: 'internal',
			title: item.title,
		};
	}

	if (item._type === 'externalLink') {
		return {
			_key: item._key,
			_type: MAIN_NAVIGATION_ITEM_TYPE,
			href: item.href,
			linkType: 'external',
			title: item.title,
		};
	}

	throw new Error(`Der Menüpunkt "${item._key}" hat den unbekannten Typ "${item._type}".`);
}

export default defineMigration({
	documentTypes: ['site-settings'],
	migrate: {
		document({ mainNavigation }) {
			if (mainNavigation === undefined) {
				return [];
			}

			if (!Array.isArray(mainNavigation) || !mainNavigation.every(isNavigationItem)) {
				throw new Error('Das Hauptmenü hat nicht die erwartete Form.');
			}

			const migrated = mainNavigation.map((item) => toMainNavigationItem(item));

			// Everything is migrated already: nothing to patch.
			if (migrated.every((item, index) => item === mainNavigation[index])) {
				return [];
			}

			return [at('mainNavigation', set(migrated))];
		},
	},
	title: 'Die Einträge des Hauptmenüs auf den Typ mainNavigationItem umstellen',
});

export { toMainNavigationItem };

interface NavigationItem {
	_key: string;
	_type: string;
	children?: unknown[];
	href?: string;
	link?: { _ref: string; _type: string };
	linkType?: string;
	title?: string;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter studio exec vitest run migrations/main-navigation-items/index.test.ts` Expected: PASS, 11 tests.

If `toStrictEqual` fails for the patch because `link: undefined` or `href: undefined` show up as own keys: the patch in the test carries no such key, so build the objects without the missing key rather than loosening the assertion.

- [ ] **Step 5: Gates and commit**

Run: `pnpm --filter studio run test && pnpm run lint && pnpm run typecheck && pnpm exec oxfmt --check`

Commit through `create-commit`, suggested message `feat(studio): migrate main navigation entries`.

---

### Task 3: View model `getNavigationEntries`

**Files:**

- Create: `apps/web/src/components/with-logic/navigation/navigation-entries.ts`
- Create: `apps/web/src/components/with-logic/navigation/navigation-entries.test.ts` (runs in the `dom` project because it sits under `src/components/`, but needs no DOM)

**Interfaces:**

- Consumes: `getInternalHref`, `InternalLinkTarget` from `@/utils/links`.
- Produces:

```ts
function getNavigationEntries(
	items: readonly NavigationItemData[],
	pathname: string,
): NavigationEntry[];
const OVERVIEW_TITLE = 'Übersicht';
interface NavigationLinkData {
	_key: string;
	href: string | null;
	link: InternalLinkTarget | null;
	linkType: string | null;
	title: string | null;
}
interface NavigationItemData extends NavigationLinkData {
	children: readonly NavigationLinkData[];
}
interface NavigationLink {
	href: string;
	isActive: boolean;
	isExternal: boolean;
	key: string;
	title: string;
}
interface NavigationLinkEntry {
	kind: 'link';
	link: NavigationLink;
}
interface NavigationGroupEntry {
	isActive: boolean;
	key: string;
	kind: 'group';
	links: NavigationLink[];
	title: string;
}
type NavigationEntry = NavigationGroupEntry | NavigationLinkEntry;
```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { getNavigationEntries } from './navigation-entries';
import type { NavigationItemData, NavigationLinkData } from './navigation-entries';

function internal(key: string, title: string | null, type: string, slug: string | null) {
	return {
		_key: key,
		href: null,
		link: { _type: type, category: null, slug },
		linkType: 'internal',
		title,
	} satisfies NavigationLinkData;
}

function external(key: string, title: string, href: string | null) {
	return { _key: key, href, link: null, linkType: 'external', title } satisfies NavigationLinkData;
}

function item(data: NavigationLinkData, children: NavigationLinkData[] = []): NavigationItemData {
	return { ...data, children };
}

const HOME = internal('home', 'Home', 'home', 'home');
const VEREIN = internal('verein', 'Verein', 'aboutUs', 'verein');
const ANGEBOT = internal('angebot', 'Angebot', 'departmentsPage', 'angebot');
const NEWS = internal('news', 'Aktuelles', 'newsOverview', 'news');
const FUSSBALL = internal('fussball', 'Fußball', 'news.category', 'fussball');
const KONTAKT = internal('kontakt', 'Kontakt', 'contact', 'kontakt');
const NEUWIED = external('neuwied', 'Stadt Neuwied', 'https://www.neuwied.de');

describe('navigation entries', () => {
	describe('plain links', () => {
		it('resolves an internal item through getInternalHref', () => {
			expect(getNavigationEntries([item(VEREIN)], '/')).toStrictEqual([
				{
					kind: 'link',
					link: {
						href: '/verein',
						isActive: false,
						isExternal: false,
						key: 'verein',
						title: 'Verein',
					},
				},
			]);
		});

		it('takes the href of an external item from the data and never marks it active', () => {
			expect(getNavigationEntries([item(NEUWIED)], 'https://www.neuwied.de')).toStrictEqual([
				{
					kind: 'link',
					link: {
						href: 'https://www.neuwied.de',
						isActive: false,
						isExternal: true,
						key: 'neuwied',
						title: 'Stadt Neuwied',
					},
				},
			]);
		});

		// Before the `main-navigation-items` migration no entry carries a `linkType`.
		it('treats an item without link type as internal', () => {
			const [entry] = getNavigationEntries([item({ ...VEREIN, linkType: null })], '/');

			expect(entry).toStrictEqual({
				kind: 'link',
				link: {
					href: '/verein',
					isActive: false,
					isExternal: false,
					key: 'verein',
					title: 'Verein',
				},
			});
		});

		// Switching an entry to external in the studio leaves the hidden page reference behind.
		it('follows the href of an external item even when a stale page reference is left over', () => {
			const [entry] = getNavigationEntries([item({ ...NEUWIED, link: VEREIN.link })], '/verein');

			expect(entry).toStrictEqual({
				kind: 'link',
				link: {
					href: 'https://www.neuwied.de',
					isActive: false,
					isExternal: true,
					key: 'neuwied',
					title: 'Stadt Neuwied',
				},
			});
		});

		it('drops items without a resolvable href or without a title', () => {
			const entries = getNavigationEntries(
				[
					item(internal('no-slug', 'Kontakt', 'contact', null)),
					item({ ...VEREIN, _key: 'no-link', link: null }),
					item(external('no-href', 'Leer', null)),
					item({ ...VEREIN, _key: 'no-title', title: null }),
					item(ANGEBOT),
				],
				'/',
			);

			expect(
				entries.map((entry) => (entry.kind === 'link' ? entry.link.key : entry.key)),
			).toStrictEqual(['angebot']);
		});
	});

	describe('active state', () => {
		it('matches the home page only exactly', () => {
			const [onHome] = getNavigationEntries([item(HOME)], '/');
			const [elsewhere] = getNavigationEntries([item(HOME)], '/verein');

			expect(onHome?.kind === 'link' && onHome.link.isActive).toBe(true);
			expect(elsewhere?.kind === 'link' && elsewhere.link.isActive).toBe(false);
		});

		it('marks an item active on a page below it', () => {
			const [entry] = getNavigationEntries([item(ANGEBOT)], '/angebot/fussball');

			expect(entry?.kind === 'link' && entry.link.isActive).toBe(true);
		});

		it('does not match a page that merely starts with the same letters', () => {
			const [entry] = getNavigationEntries([item(NEWS)], '/newsletter');

			expect(entry?.kind === 'link' && entry.link.isActive).toBe(false);
		});
	});

	describe('groups', () => {
		it('puts "Übersicht" for the parent page first, then the children in their order', () => {
			const [entry] = getNavigationEntries([item(VEREIN, [KONTAKT, NEUWIED])], '/');

			expect(entry).toStrictEqual({
				isActive: false,
				key: 'verein',
				kind: 'group',
				links: [
					{
						href: '/verein',
						isActive: false,
						isExternal: false,
						key: 'verein-overview',
						title: 'Übersicht',
					},
					{
						href: '/kontakt',
						isActive: false,
						isExternal: false,
						key: 'kontakt',
						title: 'Kontakt',
					},
					{
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

		it('keeps the children but leaves out "Übersicht" when the parent page cannot be resolved', () => {
			const [entry] = getNavigationEntries([item({ ...VEREIN, link: null }, [KONTAKT])], '/');

			expect(entry?.kind === 'group' && entry.links.map((link) => link.title)).toStrictEqual([
				'Kontakt',
			]);
		});

		it('falls back to a plain link when none of the children can be resolved', () => {
			const [entry] = getNavigationEntries(
				[item(VEREIN, [internal('broken', 'Kaputt', 'contact', null)])],
				'/',
			);

			expect(entry?.kind).toBe('link');
		});

		it('drops a group without a title, since its trigger would have no label', () => {
			expect(
				getNavigationEntries([item({ ...VEREIN, title: null }, [KONTAKT])], '/'),
			).toStrictEqual([]);
		});

		it('marks only the longest matching link active, so a child beats "Übersicht"', () => {
			const [entry] = getNavigationEntries([item(NEWS, [FUSSBALL])], '/news/fussball');

			expect(entry?.kind === 'group' && entry.isActive).toBe(true);
			expect(
				entry?.kind === 'group' && entry.links.map((link) => [link.title, link.isActive]),
			).toStrictEqual([
				['Übersicht', false],
				['Fußball', true],
			]);
		});

		it('marks "Übersicht" active on the parent page itself', () => {
			const [entry] = getNavigationEntries([item(NEWS, [FUSSBALL])], '/news');

			expect(
				entry?.kind === 'group' && entry.links.map((link) => [link.title, link.isActive]),
			).toStrictEqual([
				['Übersicht', true],
				['Fußball', false],
			]);
		});

		it('marks the group active through a child that lives elsewhere', () => {
			const [entry] = getNavigationEntries([item(VEREIN, [KONTAKT])], '/kontakt');

			expect(entry?.kind === 'group' && entry.isActive).toBe(true);
		});

		it('gives exactly one link aria-current when a child points at the parent page', () => {
			const [entry] = getNavigationEntries(
				[item(VEREIN, [{ ...VEREIN, _key: 'verein-copy', title: 'Über uns' }])],
				'/verein',
			);

			expect(
				entry?.kind === 'group' && entry.links.map((link) => [link.title, link.isActive]),
			).toStrictEqual([
				['Übersicht', true],
				['Über uns', false],
			]);
		});

		it('leaves the group inactive when none of its links matches', () => {
			const [entry] = getNavigationEntries([item(VEREIN, [KONTAKT])], '/angebot');

			expect(entry?.kind === 'group' && entry.isActive).toBe(false);
		});
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web exec vitest run src/components/with-logic/navigation/navigation-entries.test.ts` Expected: FAIL, `Failed to resolve import "./navigation-entries"`.

- [ ] **Step 3: Implement**

`apps/web/src/components/with-logic/navigation/navigation-entries.ts`:

```ts
import { getInternalHref, type InternalLinkTarget } from '@/utils/links';

/** Label of the link a group adds for its own page, ahead of its children. */
const OVERVIEW_TITLE = 'Übersicht';

const EXTERNAL_LINK_TYPE = 'external';
const ROOT_PATH = '/';

/**
 * Whether `pathname` is the page `href` points at or a page below it. The home page only matches
 * itself, otherwise it would match everything.
 *
 * @param pathname - The current path.
 * @param href - The path of the link.
 * @returns `true` on a match.
 */
function matchesPath(pathname: string, href: string): boolean {
	return pathname === href || (href !== ROOT_PATH && pathname.startsWith(`${href}/`));
}

/**
 * Whether a link points at the current page. External links never do.
 *
 * @param link - The resolved link.
 * @param pathname - The current path.
 * @returns `true` on a match.
 */
function isCurrent(link: NavigationLink, pathname: string): boolean {
	return !link.isExternal && matchesPath(pathname, link.href);
}

/**
 * Resolves a link from the query result. An entry without `linkType` (written before the migration)
 * is internal, and an external entry follows `href` even if a stale page reference is left over.
 *
 * @param data - One entry or sub-entry of the query result.
 * @returns The link, still inactive, or `undefined` if it has no title or no resolvable target.
 */
function toLink(data: NavigationLinkData): NavigationLink | undefined {
	const isExternal = data.linkType === EXTERNAL_LINK_TYPE;
	const href = isExternal ? data.href : getInternalHref(data.link);

	if (!href || !data.title) {
		return undefined;
	}

	return { href, isActive: false, isExternal, key: data._key, title: data.title };
}

/**
 * Marks the link with the longest matching href active and every other one inactive, so that on
 * `/verein/chronik` only "Chronik" is active and not "Übersicht" as well. A tie goes to the first.
 *
 * @param links - The links of one group.
 * @param pathname - The current path.
 * @returns The same links with `isActive` set.
 */
function markLongestMatch(links: NavigationLink[], pathname: string): NavigationLink[] {
	const active = links.reduce<NavigationLink | undefined>(
		(best, link) =>
			isCurrent(link, pathname) && (!best || link.href.length > best.href.length) ? link : best,
		undefined,
	);

	return links.map((link) => ({ ...link, isActive: link === active }));
}

/**
 * Builds the entry for one item of the main navigation.
 *
 * @param item - One item of the query result.
 * @param pathname - The current path.
 * @returns A group if at least one child resolves, a plain link otherwise, or `undefined` if the
 *   item can be neither.
 */
function toEntry(item: NavigationItemData, pathname: string): NavigationEntry | undefined {
	if (!item.title) {
		return undefined;
	}

	const parent = toLink(item);
	const children = item.children
		.map((child) => toLink(child))
		.filter((link): link is NavigationLink => link !== undefined);

	if (children.length === 0) {
		return parent
			? { kind: 'link', link: { ...parent, isActive: isCurrent(parent, pathname) } }
			: undefined;
	}

	const overview = parent
		? [{ ...parent, key: `${parent.key}-overview`, title: OVERVIEW_TITLE }]
		: [];
	const links = markLongestMatch([...overview, ...children], pathname);

	return {
		isActive: links.some((link) => link.isActive),
		key: item._key,
		kind: 'group',
		links,
		title: item.title,
	};
}

/**
 * Turns the main navigation from Sanity into what both menus render: resolved hrefs, the active
 * state, and a group with its "Übersicht" link wherever an item has children.
 *
 * @param items - `mainNavigation` from `mainNavigationQuery`.
 * @param pathname - The current path from `usePathname()`.
 * @returns The entries in their original order, without the ones that cannot be rendered.
 */
function getNavigationEntries(
	items: readonly NavigationItemData[],
	pathname: string,
): NavigationEntry[] {
	return items
		.map((item) => toEntry(item, pathname))
		.filter((entry): entry is NavigationEntry => entry !== undefined);
}

export { getNavigationEntries, OVERVIEW_TITLE };

interface NavigationLinkData {
	_key: string;
	href: string | null;
	link: InternalLinkTarget | null;
	linkType: string | null;
	title: string | null;
}

interface NavigationItemData extends NavigationLinkData {
	children: readonly NavigationLinkData[];
}

interface NavigationLink {
	href: string;
	isActive: boolean;
	isExternal: boolean;
	key: string;
	title: string;
}

interface NavigationLinkEntry {
	kind: 'link';
	link: NavigationLink;
}

interface NavigationGroupEntry {
	isActive: boolean;
	key: string;
	kind: 'group';
	links: NavigationLink[];
	title: string;
}

type NavigationEntry = NavigationGroupEntry | NavigationLinkEntry;

export type {
	NavigationEntry,
	NavigationGroupEntry,
	NavigationItemData,
	NavigationLink,
	NavigationLinkData,
	NavigationLinkEntry,
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter web exec vitest run src/components/with-logic/navigation/navigation-entries.test.ts` Expected: PASS, 17 tests.

- [ ] **Step 5: Gates and commit**

Run: `pnpm run lint && pnpm run typecheck && pnpm exec oxfmt --check`

Commit through `create-commit`, suggested message `feat(web): derive navigation entries with groups`.

---

### Task 4: `NavigationAnchor`

**Files:**

- Create: `apps/web/src/components/with-logic/navigation/navigation-anchor.tsx`
- Create: `apps/web/src/components/with-logic/navigation/navigation-anchor.test.tsx`

**Interfaces:**

- Consumes: `NavigationLink` (Task 3), `ExternalLink` from `@/components/ui/external-link`.
- Produces: `NavigationAnchor(props: { link: NavigationLink } & Omit<ComponentProps<'a'>, 'children' | 'href'>)`, which forwards every other prop (including `ref`, `className`, `aria-current`, `onClick`) to the anchor. This is what makes it usable as Base UI's `render` element.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi } from 'vitest';

import { renderWithUser } from '../../../../test-utils/render';
import { NavigationAnchor } from './navigation-anchor';
import type { NavigationLink } from './navigation-entries';

const INTERNAL: NavigationLink = {
	href: '/verein',
	isActive: false,
	isExternal: false,
	key: 'verein',
	title: 'Verein',
};

const EXTERNAL: NavigationLink = {
	href: 'https://www.neuwied.de',
	isActive: false,
	isExternal: true,
	key: 'neuwied',
	title: 'Stadt Neuwied',
};

describe('navigation anchor', () => {
	it('renders an internal link in the same tab', () => {
		const { getByRole } = renderWithUser(<NavigationAnchor link={INTERNAL} />);

		const link = getByRole('link', { name: 'Verein' });

		expect(link.getAttribute('href')).toBe('/verein');
		expect(link.getAttribute('target')).toBeNull();
	});

	it('opens an external link in a new tab and says so to screen readers', () => {
		const { getByRole } = renderWithUser(<NavigationAnchor link={EXTERNAL} />);

		const link = getByRole('link', { name: 'Stadt Neuwied (öffnet in neuem Tab)' });

		expect(link.getAttribute('href')).toBe('https://www.neuwied.de');
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('forwards the props Base UI merges into its render element', async () => {
		const onClick = vi.fn();
		const { getByRole, user } = renderWithUser(
			<NavigationAnchor aria-current="page" link={INTERNAL} onClick={onClick} />,
		);

		const link = getByRole('link', { name: 'Verein' });
		await user.click(link);

		expect(link.getAttribute('aria-current')).toBe('page');
		expect(onClick).toHaveBeenCalledOnce();
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web exec vitest run src/components/with-logic/navigation/navigation-anchor.test.tsx` Expected: FAIL, `Failed to resolve import "./navigation-anchor"`.

- [ ] **Step 3: Implement**

```tsx
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps } from 'react';

import { ExternalLink } from '@/components/ui/external-link';

import type { NavigationLink } from './navigation-entries';

/** Tells a screen reader user, right after the label, that the link leaves the current tab. */
const NEW_TAB_HINT = '(öffnet in neuem Tab)';

/**
 * The anchor both menus render for a navigation link: `next/link` inside the website,
 * `ExternalLink` with a visible icon and a screen reader hint outside of it. Every other prop goes
 * to the anchor, so Base UI can use it as a `render` element.
 */
export function NavigationAnchor({ link, ...props }: Readonly<NavigationAnchorProps>) {
	if (link.isExternal) {
		return (
			<ExternalLink href={link.href} {...props}>
				{link.title}
				<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
				{/* The leading space keeps the accessible name "Stadt Neuwied (öffnet …)" apart. */}
				<span className="sr-only">{` ${NEW_TAB_HINT}`}</span>
			</ExternalLink>
		);
	}

	return (
		<Link href={link.href} {...props}>
			{link.title}
		</Link>
	);
}

interface NavigationAnchorProps extends Omit<ComponentProps<'a'>, 'children' | 'href'> {
	link: NavigationLink;
}
```

The accessible name is built from the text content. Inline elements add no space of their own, which is why the sr-only span starts with one.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter web exec vitest run src/components/with-logic/navigation/navigation-anchor.test.tsx` Expected: PASS, 3 tests.

- [ ] **Step 5: Gates and commit**

Run: `pnpm run lint && pnpm run typecheck && pnpm exec oxfmt --check`

Commit through `create-commit`, suggested message `feat(web): add navigation anchor for internal and external links`.

---

### Task 5: `ui/navigation-menu.tsx`

**Files:**

- Create: `apps/web/src/components/ui/navigation-menu.tsx`

This file is derived from the shadcn `base-lyra` registry item `navigation-menu`, fetched 2026-09-30 from `https://ui.shadcn.com/r/styles/base-lyra/navigation-menu.json`. Its content is given here in full, so no `shadcn add` is needed. The registry version imports an `IconPlaceholder` that only exists in shadcn's own site and uses `tw-animate` classes this app does not install. Both are replaced below by `lucide-react` and plain `transition-*` with `data-starting-style`/`data-ending-style`, as the root `AGENTS.md` asks. `NavigationMenuIndicator` is dropped because nothing uses it.

**Interfaces:**

- Produces: `NavigationMenu` (Root plus its own Portal/Positioner/Popup/Viewport, prop `align` default `'start'`), `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger` (appends a rotating `ChevronDown`), `NavigationMenuContent`, `NavigationMenuLink`. Every part takes the props of its Base UI primitive, including `render`.

- [ ] **Step 1: Create the wrapper**

```tsx
'use client';

import { NavigationMenu as NavigationMenuPrimitive } from '@base-ui/react/navigation-menu';
import { ChevronDown } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

function NavigationMenu({ align = 'start', children, className, ...props }: NavigationMenuProps) {
	return (
		<NavigationMenuPrimitive.Root
			className={cn('relative flex items-center', className)}
			data-slot="navigation-menu"
			{...props}
		>
			{children}
			<NavigationMenuPositioner align={align} />
		</NavigationMenuPrimitive.Root>
	);
}

function NavigationMenuList({ className, ...props }: NavigationMenuPrimitive.List.Props) {
	return (
		<NavigationMenuPrimitive.List
			className={cn('flex list-none items-center', className)}
			data-slot="navigation-menu-list"
			{...props}
		/>
	);
}

function NavigationMenuItem({ className, ...props }: NavigationMenuPrimitive.Item.Props) {
	return (
		<NavigationMenuPrimitive.Item
			className={cn('relative', className)}
			data-slot="navigation-menu-item"
			{...props}
		/>
	);
}

function NavigationMenuTrigger({
	children,
	className,
	...props
}: NavigationMenuPrimitive.Trigger.Props) {
	return (
		<NavigationMenuPrimitive.Trigger
			className={cn(
				'group/navigation-menu-trigger inline-flex cursor-pointer items-center gap-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
				className,
			)}
			data-slot="navigation-menu-trigger"
			{...props}
		>
			{children}
			<ChevronDown
				aria-hidden="true"
				className="size-4 transition-transform duration-300 group-data-popup-open/navigation-menu-trigger:rotate-180"
			/>
		</NavigationMenuPrimitive.Trigger>
	);
}

function NavigationMenuContent({ className, ...props }: NavigationMenuPrimitive.Content.Props) {
	return (
		<NavigationMenuPrimitive.Content
			className={cn(
				'p-2 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0',
				className,
			)}
			data-slot="navigation-menu-content"
			{...props}
		/>
	);
}

function NavigationMenuPositioner({
	align = 'start',
	className,
	side = 'bottom',
	sideOffset = POPUP_OFFSET,
	...props
}: NavigationMenuPrimitive.Positioner.Props) {
	return (
		<NavigationMenuPrimitive.Portal>
			<NavigationMenuPrimitive.Positioner
				align={align}
				className={cn(
					'isolate z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-300 data-instant:transition-none',
					className,
				)}
				side={side}
				sideOffset={sideOffset}
				{...props}
			>
				<NavigationMenuPrimitive.Popup className="relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) rounded-md bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 transition-[opacity,transform,width,height,scale] duration-300 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
					<NavigationMenuPrimitive.Viewport className="relative size-full overflow-hidden" />
				</NavigationMenuPrimitive.Popup>
			</NavigationMenuPrimitive.Positioner>
		</NavigationMenuPrimitive.Portal>
	);
}

function NavigationMenuLink({ className, ...props }: NavigationMenuPrimitive.Link.Props) {
	return (
		<NavigationMenuPrimitive.Link
			className={cn(
				'transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
				className,
			)}
			data-slot="navigation-menu-link"
			{...props}
		/>
	);
}

/** Gap in pixels between a trigger and the popup below it. */
const POPUP_OFFSET = 8;

type NavigationMenuProps = NavigationMenuPrimitive.Root.Props &
	Pick<NavigationMenuPrimitive.Positioner.Props, 'align'>;

export {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
};
```

`POPUP_OFFSET` is used as a default parameter above its declaration. If lint reports `no-use-before-define`, move the constant above `NavigationMenu`.

- [ ] **Step 2: Gates**

Run: `pnpm run lint && pnpm run typecheck` Expected: clean. The wrapper is exercised by Task 6's tests, and nothing commits until Task 6.

---

### Task 6: `DesktopNavigation`

**Files:**

- Create: `apps/web/src/components/with-logic/navigation/desktop-navigation.tsx`
- Create: `apps/web/src/components/with-logic/navigation/desktop-navigation.test.tsx`
- Includes: `apps/web/src/components/ui/navigation-menu.tsx` from Task 5 (same commit)

**Interfaces:**

- Consumes: `NavigationEntry`, `NavigationGroupEntry`, `NavigationLink` (Task 3), `NavigationAnchor` (Task 4), the `ui/navigation-menu` parts (Task 5).
- Produces: `DesktopNavigation({ entries }: { entries: readonly NavigationEntry[] })`. It renders a `<div>` root that is `hidden lg:flex` and contains no `<nav>` of its own.

- [ ] **Step 1: Write the failing test**

```tsx
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithUser } from '../../../../test-utils/render';
import { DesktopNavigation } from './desktop-navigation';
import type { NavigationEntry } from './navigation-entries';

const ANGEBOT: NavigationEntry = {
	kind: 'link',
	link: { href: '/angebot', isActive: true, isExternal: false, key: 'angebot', title: 'Angebot' },
};

const HOME: NavigationEntry = {
	kind: 'link',
	link: { href: '/', isActive: false, isExternal: false, key: 'home', title: 'Home' },
};

const VEREIN: NavigationEntry = {
	isActive: true,
	key: 'verein',
	kind: 'group',
	links: [
		{
			href: '/verein',
			isActive: false,
			isExternal: false,
			key: 'verein-overview',
			title: 'Übersicht',
		},
		{ href: '/kontakt', isActive: true, isExternal: false, key: 'kontakt', title: 'Kontakt' },
		{
			href: 'https://www.neuwied.de',
			isActive: false,
			isExternal: true,
			key: 'neuwied',
			title: 'Stadt Neuwied',
		},
	],
	title: 'Verein',
};

function renderDesktop(entries: NavigationEntry[] = [HOME, VEREIN, ANGEBOT]) {
	return renderWithUser(<DesktopNavigation entries={entries} />);
}

describe('desktop navigation', () => {
	it('renders plain entries as links and marks the active one with aria-current', () => {
		const { getByRole } = renderDesktop();

		const angebot = getByRole('link', { name: 'Angebot' });
		const home = getByRole('link', { name: 'Home' });

		expect(angebot.getAttribute('href')).toBe('/angebot');
		expect(angebot.getAttribute('aria-current')).toBe('page');
		expect(home.getAttribute('aria-current')).toBeNull();
	});

	// The shell already renders `<nav aria-label="Hauptnavigation">`; Base UI's root would add a
	// second, unnamed navigation landmark inside it.
	it('adds no navigation landmark of its own', () => {
		const { queryAllByRole } = renderDesktop();

		expect(queryAllByRole('navigation')).toHaveLength(0);
	});

	it('renders a group as a collapsed button whose panel is not rendered yet', () => {
		const { getByRole, queryByRole } = renderDesktop();

		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('false');
		expect(queryByRole('link', { name: 'Übersicht' })).toBeNull();
	});

	it('opens the panel with "Übersicht" first and marks the active child', async () => {
		const { getAllByRole, getByRole, user } = renderDesktop();

		const trigger = getByRole('button', { name: 'Verein' });
		await user.click(trigger);

		expect(trigger.getAttribute('aria-expanded')).toBe('true');

		const overview = getByRole('link', { name: 'Übersicht' });
		const kontakt = getByRole('link', { name: 'Kontakt' });

		expect(overview.getAttribute('href')).toBe('/verein');
		expect(overview.getAttribute('aria-current')).toBeNull();
		expect(kontakt.getAttribute('aria-current')).toBe('page');
		expect(
			getByRole('link', { name: 'Stadt Neuwied (öffnet in neuem Tab)' }).getAttribute('target'),
		).toBe('_blank');
		expect(
			getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page'),
		).toHaveLength(2);
	});

	it('closes the panel when one of its links is followed', async () => {
		const { getByRole, queryByRole, user } = renderDesktop();

		await user.click(getByRole('button', { name: 'Verein' }));
		await user.click(getByRole('link', { name: 'Kontakt' }));

		await waitFor(() => {
			expect(queryByRole('link', { name: 'Übersicht' })).toBeNull();
		});
		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('false');
	});
});
```

The last assertion of the "opens the panel" case counts two `aria-current` links: `Angebot` in the bar and `Kontakt` in the panel. That is only because the fixture marks both active to test each place. The view model from Task 3 never produces that.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web exec vitest run src/components/with-logic/navigation/desktop-navigation.test.tsx` Expected: FAIL, `Failed to resolve import "./desktop-navigation"`.

- [ ] **Step 3: Implement**

```tsx
'use client';

import { cn } from '@tsgi-web/shared';

import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

import { NavigationAnchor } from './navigation-anchor';
import type { NavigationEntry, NavigationGroupEntry, NavigationLink } from './navigation-entries';

/** Shared by the bar's links and triggers, so a group looks like any other item until it opens. */
const TOP_LEVEL_CLASS_NAME =
	'flex h-16 items-center px-3 py-2 font-bold text-primary uppercase transition-colors hover:bg-secondary/40';

/**
 * The bar from the `lg` breakpoint on. Plain entries are links; an entry with children opens a
 * panel with "Übersicht" and the children, by hover, click or keyboard.
 */
export function DesktopNavigation({ entries }: Readonly<DesktopNavigationProps>) {
	return (
		// Base UI renders the root as `<nav>`, and the shell already is the navigation landmark.
		<NavigationMenu className="hidden lg:flex" render={<div />}>
			<NavigationMenuList className="space-x-3">
				{entries.map((entry) =>
					entry.kind === 'group' ? (
						<DesktopGroup group={entry} key={entry.key} />
					) : (
						<DesktopLink key={entry.link.key} link={entry.link} />
					),
				)}
			</NavigationMenuList>
		</NavigationMenu>
	);
}

function DesktopLink({ link }: Readonly<DesktopLinkProps>) {
	return (
		<NavigationMenuItem>
			<NavigationMenuLink
				active={link.isActive}
				className={cn(TOP_LEVEL_CLASS_NAME, 'data-active:border-b-2 data-active:border-secondary')}
				render={<NavigationAnchor link={link} />}
			/>
		</NavigationMenuItem>
	);
}

function DesktopGroup({ group }: Readonly<DesktopGroupProps>) {
	return (
		<NavigationMenuItem>
			<NavigationMenuTrigger
				className={cn(TOP_LEVEL_CLASS_NAME, 'data-popup-open:bg-secondary/40', {
					'border-b-2 border-secondary': group.isActive,
				})}
			>
				{group.title}
			</NavigationMenuTrigger>
			<NavigationMenuContent>
				<ul className="flex min-w-56 flex-col">
					{group.links.map((link) => (
						<li key={link.key}>
							<NavigationMenuLink
								active={link.isActive}
								className="flex items-center gap-1 rounded-sm px-3 py-2 text-foreground hover:bg-muted/40 data-active:bg-secondary/40"
								closeOnClick
								render={<NavigationAnchor link={link} />}
							/>
						</li>
					))}
				</ul>
			</NavigationMenuContent>
		</NavigationMenuItem>
	);
}

interface DesktopNavigationProps {
	entries: readonly NavigationEntry[];
}

interface DesktopLinkProps {
	link: NavigationLink;
}

interface DesktopGroupProps {
	group: NavigationGroupEntry;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter web exec vitest run src/components/with-logic/navigation/desktop-navigation.test.tsx` Expected: PASS, 5 tests.

If the popup never opens in jsdom:

- First check the console for a missing browser API that Floating UI calls: `getBoundingClientRect` works in jsdom, `DOMRect` and `ResizeObserver` are stubbed already. Add the missing stub to `apps/web/test-utils/setup-dom.ts`, next to the existing ones, with a comment naming Base UI's `NavigationMenu` as the consumer.
- If it still does not open, the popup assertions move to Task 10 (E2E). Here, assert only that `aria-expanded` flips after the click. Report that as a finding.

- [ ] **Step 5: Gates and commit**

Run: `pnpm --filter web run test && pnpm run lint && pnpm run typecheck && pnpm exec oxfmt --check`

Commit through `create-commit` with `ui/navigation-menu.tsx`, suggested message `feat(web): add desktop navigation with dropdown panels`.

---

### Task 7: `MobileNavigation`

**Files:**

- Create: `apps/web/src/components/ui/collapsible.tsx`
- Create: `apps/web/src/components/with-logic/navigation/mobile-navigation.tsx`
- Create: `apps/web/src/components/with-logic/navigation/mobile-navigation.test.tsx`

**Interfaces:**

- Consumes: `NavigationEntry`, `NavigationGroupEntry`, `NavigationLink` (Task 3), `NavigationAnchor` (Task 4).
- Produces:
  - `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from `@/components/ui/collapsible`
  - `MobileNavigation({ entries, onNavigate }: { entries: readonly NavigationEntry[]; onNavigate: () => void })`, which renders a `<ul>`. `onNavigate` fires on every link click.

- [ ] **Step 1: Write the failing test**

```tsx
import { within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithUser } from '../../../../test-utils/render';
import { MobileNavigation } from './mobile-navigation';
import type { NavigationEntry, NavigationGroupEntry } from './navigation-entries';

const ANGEBOT: NavigationEntry = {
	kind: 'link',
	link: { href: '/angebot', isActive: true, isExternal: false, key: 'angebot', title: 'Angebot' },
};

const VEREIN: NavigationGroupEntry = {
	isActive: false,
	key: 'verein',
	kind: 'group',
	links: [
		{
			href: '/verein',
			isActive: false,
			isExternal: false,
			key: 'verein-overview',
			title: 'Übersicht',
		},
		{ href: '/kontakt', isActive: false, isExternal: false, key: 'kontakt', title: 'Kontakt' },
	],
	title: 'Verein',
};

function renderMobile(entries: NavigationEntry[] = [VEREIN, ANGEBOT], onNavigate = vi.fn()) {
	return {
		onNavigate,
		...renderWithUser(<MobileNavigation entries={entries} onNavigate={onNavigate} />),
	};
}

describe('mobile navigation', () => {
	it('lists the entries and marks the active link with aria-current', () => {
		const { getByRole } = renderMobile();

		const angebot = getByRole('link', { name: 'Angebot' });

		// The group's own list sits in its collapsed, `hidden` panel, so only the outer list counts.
		expect(within(getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
		expect(angebot.getAttribute('href')).toBe('/angebot');
		expect(angebot.getAttribute('aria-current')).toBe('page');
	});

	// The collapsed panel stays in the markup (`keepMounted`) so crawlers find the pages behind it,
	// but it is `hidden`, which takes its links out of the accessibility tree and the tab order.
	it('keeps a collapsed group in the markup but out of reach', () => {
		const { getByRole, queryByRole } = renderMobile();

		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('false');
		expect(queryByRole('link', { name: 'Übersicht' })).toBeNull();
		expect(getByRole('link', { hidden: true, name: 'Übersicht' }).getAttribute('href')).toBe(
			'/verein',
		);
	});

	it('expands a group on click', async () => {
		const { getByRole, user } = renderMobile();

		const trigger = getByRole('button', { name: 'Verein' });
		await user.click(trigger);

		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(getByRole('link', { name: 'Kontakt' }).getAttribute('href')).toBe('/kontakt');
	});

	it('starts with the group of the current page expanded', () => {
		const { getByRole } = renderMobile([{ ...VEREIN, isActive: true }]);

		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('true');
		expect(getByRole('link', { name: 'Übersicht' })).not.toBeNull();
	});

	it('reports every followed link, inside a group or not', async () => {
		const { getByRole, onNavigate, user } = renderMobile();

		await user.click(getByRole('link', { name: 'Angebot' }));
		await user.click(getByRole('button', { name: 'Verein' }));
		await user.click(getByRole('link', { name: 'Kontakt' }));

		expect(onNavigate).toHaveBeenCalledTimes(2);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web exec vitest run src/components/with-logic/navigation/mobile-navigation.test.tsx` Expected: FAIL, `Failed to resolve import "./mobile-navigation"`.

- [ ] **Step 3: Create `ui/collapsible.tsx`**

Derived from the shadcn `base-lyra` registry item `collapsible`, which has no styles of its own:

```tsx
'use client';

import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';

function Collapsible(props: CollapsiblePrimitive.Root.Props) {
	return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger(props: CollapsiblePrimitive.Trigger.Props) {
	return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />;
}

function CollapsibleContent(props: CollapsiblePrimitive.Panel.Props) {
	return <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />;
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
```

- [ ] **Step 4: Create `mobile-navigation.tsx`**

```tsx
'use client';

import { ChevronDown } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { NavigationAnchor } from './navigation-anchor';
import type { NavigationEntry, NavigationGroupEntry, NavigationLink } from './navigation-entries';

/** Shared by links and group triggers, so a group reads like a link until it expands. */
const ITEM_CLASS_NAME =
	'flex w-full items-center gap-1 rounded-md px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/40';

/**
 * The entries of the mobile menu. A group expands in place; its panel stays in the markup so the
 * pages behind it are part of the server-rendered HTML.
 */
export function MobileNavigation({ entries, onNavigate }: Readonly<MobileNavigationProps>) {
	return (
		<ul className="space-y-2">
			{entries.map((entry) =>
				entry.kind === 'group' ? (
					<li key={entry.key}>
						<MobileGroup group={entry} onNavigate={onNavigate} />
					</li>
				) : (
					<li key={entry.link.key}>
						<MobileLink link={entry.link} onNavigate={onNavigate} />
					</li>
				),
			)}
		</ul>
	);
}

function MobileLink({ link, onNavigate }: Readonly<MobileLinkProps>) {
	return (
		<NavigationAnchor
			aria-current={link.isActive ? 'page' : undefined}
			className={cn(ITEM_CLASS_NAME, { 'bg-secondary/40': link.isActive })}
			link={link}
			onClick={onNavigate}
		/>
	);
}

function MobileGroup({ group, onNavigate }: Readonly<MobileGroupProps>) {
	return (
		<Collapsible defaultOpen={group.isActive}>
			<CollapsibleTrigger className={cn(ITEM_CLASS_NAME, 'group/mobile-group justify-between')}>
				{group.title}
				<ChevronDown
					aria-hidden="true"
					className="size-5 transition-transform group-data-panel-open/mobile-group:rotate-180"
				/>
			</CollapsibleTrigger>
			<CollapsibleContent keepMounted>
				<ul className="mt-2 space-y-2 pl-6">
					{group.links.map((link) => (
						<li key={link.key}>
							<MobileLink link={link} onNavigate={onNavigate} />
						</li>
					))}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	);
}

interface MobileNavigationProps {
	entries: readonly NavigationEntry[];
	onNavigate: () => void;
}

interface MobileLinkProps {
	link: NavigationLink;
	onNavigate: () => void;
}

interface MobileGroupProps {
	group: NavigationGroupEntry;
	onNavigate: () => void;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter web exec vitest run src/components/with-logic/navigation/mobile-navigation.test.tsx` Expected: PASS, 5 tests.

- [ ] **Step 6: Gates and commit**

Run: `pnpm --filter web run test && pnpm run lint && pnpm run typecheck && pnpm exec oxfmt --check`

Commit through `create-commit`, suggested message `feat(web): add mobile navigation with expandable groups`.

---

### Task 8: Shell, query and wiring

**Files:**

- Modify: `apps/web/src/lib/sanity/queries/main-navigation.ts`
- Regenerate: `apps/web/src/types/sanity.types.generated.ts`
- Create: `apps/web/src/components/with-logic/navigation/navigation.tsx`
- Create: `apps/web/src/components/with-logic/navigation/navigation.test.tsx`
- Delete: `apps/web/src/components/with-logic/navigation.tsx`, `apps/web/src/components/with-logic/navigation.test.tsx`
- Modify: `apps/web/src/app/layout.tsx:13`, `apps/web/src/app/layout.test.ts:10`

**Interfaces:**

- Consumes: `getNavigationEntries` (Task 3), `DesktopNavigation` (Task 6), `MobileNavigation` (Task 7).
- Produces: `Navigation({ navItems }: { navItems: NavItem[] })`, where `NavItem = NonNullable<MainNavigationQueryResult>['mainNavigation'][number]`. The import path becomes `@/components/with-logic/navigation/navigation`.

- [ ] **Step 1: Extend the query and regenerate the types**

`apps/web/src/lib/sanity/queries/main-navigation.ts`:

```ts
import { defineQuery } from 'next-sanity';

import { internalLinkTarget } from '@/lib/sanity/queries';

/** The fields a main navigation item and each of its children share. */
const navigationLinkFields = /* groq */ `
	_key,
	title,
	linkType,
	href,
	"link": link-> { ${internalLinkTarget} }
`;

export const mainNavigationQuery = defineQuery(`
	*[_type == 'site-settings'][0] {
		mainNavigation[] {
			${navigationLinkFields},
			"children": coalesce(children[] { ${navigationLinkFields} }, [])
		}
	}
`);
```

Then run from the root: `pnpm run typegen:sanity && pnpm exec oxfmt apps/web/src/types/sanity.types.generated.ts`

Expected: every member of `MainNavigationQueryResult['mainNavigation']` carries `_key`, `title`, `linkType`, `href`, `link` and `children` (an array, never `null`, thanks to `coalesce`). Check that the generated type is assignable to `NavigationItemData` from Task 3. Step 4's typecheck proves it.

- [ ] **Step 2: Write the failing shell test**

`apps/web/src/components/with-logic/navigation/navigation.test.tsx`. It replaces the old `with-logic/navigation.test.tsx`: every old case is carried over, and links are now found by accessible name because the fixtures have real titles.

```tsx
import { within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { MainNavigationQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../test-utils/render';
import { setPathname } from '../../../../test-utils/setup-dom';
import { Navigation } from './navigation';

type NavItem = NonNullable<MainNavigationQueryResult>['mainNavigation'][number];

const VEREIN: NavItem = {
	_key: 'verein',
	children: [
		{
			_key: 'kontakt',
			href: null,
			link: { _type: 'contact', category: null, slug: 'kontakt' },
			linkType: 'internal',
			title: 'Kontakt',
		},
	],
	href: null,
	link: { _type: 'aboutUs', category: null, slug: 'verein' },
	linkType: 'internal',
	title: 'Verein',
};

const ANGEBOT: NavItem = {
	_key: 'angebot',
	children: [],
	href: null,
	link: { _type: 'departmentsPage', category: null, slug: 'angebot' },
	linkType: 'internal',
	title: 'Angebot',
};

// `getInternalHref` returns `undefined` for a target without slug; the entry is dropped.
const UNRESOLVABLE: NavItem = {
	_key: 'unresolvable',
	children: [],
	href: null,
	link: { _type: 'contact', category: null, slug: null },
	linkType: 'internal',
	title: 'Kaputt',
};

const NAV_ITEMS: NavItem[] = [VEREIN, ANGEBOT, UNRESOLVABLE];

function renderNavigation(navItems: NavItem[] = NAV_ITEMS) {
	return renderWithUser(<Navigation navItems={navItems} />);
}

/**
 * The mobile menu container, located through the `aria-controls` of the toggle button, so the
 * lookup fails as soon as that wiring breaks.
 *
 * @param container - The element to search within.
 * @returns The element the mobile menu toggle controls.
 * @throws {Error} If no element matches the toggle's `aria-controls`.
 */
function mobileMenu(container: HTMLElement): HTMLElement {
	const menuId = container.querySelector('button[aria-controls]')?.getAttribute('aria-controls');
	const menu = menuId ? container.querySelector(`#${menuId}`) : null;

	if (!(menu instanceof HTMLElement)) {
		throw new Error("no element matches the mobile menu toggle's aria-controls");
	}

	return menu;
}

describe('navigation', () => {
	it("names the navigation landmark, so it can be told apart from the page's other ones", () => {
		const { getByRole } = renderNavigation();

		expect(getByRole('navigation', { name: 'Hauptnavigation' })).not.toBeNull();
	});

	it('renders every resolvable entry in the desktop bar and in the mobile menu, and drops the rest', () => {
		const { container, getAllByRole, queryAllByRole } = renderNavigation();

		expect(getAllByRole('link', { name: 'Angebot' })).toHaveLength(2);
		expect(getAllByRole('button', { name: 'Verein' })).toHaveLength(2);
		expect(queryAllByRole('link', { name: 'Kaputt' })).toHaveLength(0);
		expect(within(mobileMenu(container)).getByRole('link', { name: 'Angebot' })).not.toBeNull();
	});

	it('marks the entry matching the current pathname with aria-current in both menus', () => {
		setPathname('/angebot/fussball');
		const { getAllByRole } = renderNavigation();

		for (const link of getAllByRole('link', { name: 'Angebot' })) {
			expect(link.getAttribute('aria-current')).toBe('page');
		}
	});

	it('offers the short contact link for the lg range, the long one from xl and in the mobile menu', () => {
		const { container, getAllByRole, getByRole } = renderNavigation();

		expect(getByRole('link', { name: 'Kontakt' }).getAttribute('href')).toBe('/kontakt');
		expect(getAllByRole('link', { name: 'Kontakt aufnehmen' })).toHaveLength(2);
		// The mobile copy used to be `sm:hidden`, which left 640–1023 px without any contact button.
		expect(
			within(mobileMenu(container))
				.getByRole('link', { name: 'Kontakt aufnehmen' })
				.getAttribute('href'),
		).toBe('/kontakt');
	});

	// The button's name stays the same in both states on purpose: `aria-expanded` already carries
	// open/closed, and a name that changes with the state gets announced on top of it.
	it('names the mobile menu toggle in German, and keeps that name when the menu opens', async () => {
		const { getByRole, user } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);

		expect(getByRole('button', { name: 'Menü' })).toBe(toggle);
	});

	it('wires the mobile menu toggle to the menu it controls and reports the collapsed state', () => {
		const { container, getByRole } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		const menuId = toggle.getAttribute('aria-controls');

		expect(menuId).not.toBeNull();
		expect(container.querySelector(`#${menuId}`)).not.toBeNull();
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
	});

	// jsdom does not implement `inert`'s behaviour, so the attribute is all this test can check; the
	// browser-level consequence is asserted in `e2e/specs/navigation.spec.ts`.
	it('marks the collapsed mobile menu inert so its links leave the accessibility tree and the tab order', () => {
		const { container } = renderNavigation();

		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
	});

	it('drops inert and flips aria-expanded when the toggle opens the mobile menu', async () => {
		const { container, getByRole, user } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);

		expect(toggle.getAttribute('aria-expanded')).toBe('true');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(false);
	});

	it('restores inert and aria-expanded=false when the toggle closes the mobile menu again', async () => {
		const { container, getByRole, user } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);
		await user.click(toggle);

		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
	});

	it('closes the mobile menu on Escape and moves the focus back to the toggle', async () => {
		const { container, getByRole, user } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);

		// With the focus inside the menu, collapsing it would otherwise strand the focus: the
		// container becomes `inert`, so the browser drops the focus to `<body>`.
		const mobileLink = within(mobileMenu(container)).getByRole('link', { name: 'Angebot' });
		mobileLink.focus();
		expect(document.activeElement).toBe(mobileLink);

		await user.keyboard('{Escape}');

		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
		expect(document.activeElement).toBe(toggle);
	});

	it('leaves the focus where it is when Escape is pressed while the mobile menu is closed', async () => {
		const { getByRole, user } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		const logo = getByRole('link', { name: 'Logo der TSG Irlich 1882 e. V.' });
		logo.focus();

		await user.keyboard('{Escape}');

		expect(document.activeElement).toBe(logo);
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
	});

	it('collapses the mobile menu again when one of its links is followed, inside a group too', async () => {
		const { container, getByRole, user } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		const menu = within(mobileMenu(container));

		await user.click(toggle);
		await user.click(menu.getByRole('link', { name: 'Angebot' }));
		expect(toggle.getAttribute('aria-expanded')).toBe('false');

		await user.click(toggle);
		await user.click(menu.getByRole('button', { name: 'Verein' }));
		await user.click(menu.getByRole('link', { name: 'Übersicht' }));
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
	});
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter web exec vitest run src/components/with-logic/navigation/navigation.test.tsx` Expected: FAIL, `Failed to resolve import "./navigation"`.

- [ ] **Step 4: Create the shell and remove the old component**

`apps/web/src/components/with-logic/navigation/navigation.tsx`, carrying over the old file's scroll, Escape and mobile logic unchanged:

```tsx
'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn, TSGLogo } from '@tsgi-web/shared';

import { ButtonLink } from '@/components/ui/button';
import type { MainNavigationQueryResult } from '@/types/sanity.types';

import { DesktopNavigation } from './desktop-navigation';
import { MobileNavigation } from './mobile-navigation';
import { getNavigationEntries } from './navigation-entries';

/** Ties the mobile menu toggle's `aria-controls` to the menu container it opens. */
const MOBILE_MENU_ID = 'mobile-navigation';

const CONTACT_HREF = '/kontakt';

type NavItem = NonNullable<MainNavigationQueryResult>['mainNavigation'][number];

export function Navigation({ navItems }: Readonly<NavigationProps>) {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileOpen, setIsMobileOpen] = useState(false);

	const toggleRef = useRef<HTMLButtonElement>(null);
	const pathname = usePathname();

	const entries = useMemo(() => getNavigationEntries(navItems, pathname), [navItems, pathname]);

	const closeMobileMenu = () => {
		setIsMobileOpen(false);
	};

	// The menu is a disclosure, not a dialog, so it deliberately does not trap the focus (the ARIA
	// APG does not ask for one here and the page behind stays usable). What it does need is Escape
	// and a defined place for the focus to go: the collapsed container is `inert`, so a focus left
	// inside it would be dropped to `<body>`.
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!isMobileOpen || event.key !== 'Escape') return;

			setIsMobileOpen(false);
			toggleRef.current?.focus();
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isMobileOpen]);

	useEffect(() => {
		const handleScroll = () => {
			const SCROLL_PADDING = 10;
			setIsScrolled(window.scrollY > SCROLL_PADDING);
		};

		window.addEventListener('scroll', handleScroll);
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	return (
		<nav
			aria-label="Hauptnavigation"
			className={cn('fixed inset-x-0 top-0 z-50 bg-background/70 transition-all duration-300', {
				'bg-background': isMobileOpen,
				'shadow-sm backdrop-blur-md': isScrolled,
			})}
		>
			<div className="container mx-auto">
				<div
					className={cn('relative flex items-center justify-between lg:h-32', {
						'lg:h-16': isScrolled,
					})}
				>
					{/* Logo */}
					<div className="h-full w-40">
						<Link
							aria-label="Logo der TSG Irlich 1882 e. V."
							className="absolute top-2 left-0 block"
							href="/"
						>
							<TSGLogo
								className={cn('h-16 drop-shadow-xl transition-all duration-300 lg:h-28', {
									'lg:h-20': isScrolled,
								})}
							/>
						</Link>
					</div>

					<DesktopNavigation entries={entries} />

					{/* Contact Button (Desktop). Compact between lg and xl, where the bar is tight; the wrappers
					    carry the visibility because `btn` sets its own `display`. */}
					<div className="hidden lg:block xl:hidden">
						<ButtonLink
							className="uppercase"
							render={<Link href={CONTACT_HREF} />}
							size="sm"
							variant="secondary"
						>
							Kontakt
						</ButtonLink>
					</div>
					<div className="hidden xl:block">
						<ButtonLink
							className="uppercase"
							render={<Link href={CONTACT_HREF} />}
							size={isScrolled ? 'sm' : 'default'}
							variant="secondary"
						>
							Kontakt aufnehmen
						</ButtonLink>
					</div>

					{/* Mobile Menu Button */}
					<div className="flex items-center gap-2 lg:hidden">
						<button
							aria-controls={MOBILE_MENU_ID}
							aria-expanded={isMobileOpen}
							aria-label="Menü"
							className="my-2 inline-flex items-center justify-center rounded-md p-2 text-foreground transition-colors hover:bg-muted/40"
							onClick={() => {
								setIsMobileOpen(!isMobileOpen);
							}}
							ref={toggleRef}
							type="button"
						>
							{isMobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
						</button>
					</div>
				</div>

				{/* Mobile Navigation */}
				<div
					className={cn('overflow-hidden transition-all duration-300 ease-in-out lg:hidden', {
						'max-h-0 opacity-0': !isMobileOpen,
						'max-h-full pt-12 opacity-100': isMobileOpen,
					})}
					id={MOBILE_MENU_ID}
					// The collapsed menu is only hidden visually so the transition has something to
					// animate, which leaves its links in the accessibility tree and in the tab order.
					// `inert` removes them from both for as long as the menu is closed.
					inert={!isMobileOpen}
				>
					<MobileNavigation entries={entries} onNavigate={closeMobileMenu} />

					<div className="px-3 py-6">
						<ButtonLink
							className="uppercase"
							fullWidth
							onClick={closeMobileMenu}
							render={<Link href={CONTACT_HREF} />}
							variant="secondary"
						>
							Kontakt aufnehmen
						</ButtonLink>
					</div>
				</div>
			</div>
		</nav>
	);
}

interface NavigationProps {
	navItems: NavItem[];
}
```

Delete `apps/web/src/components/with-logic/navigation.tsx` and `apps/web/src/components/with-logic/navigation.test.tsx` with `rm`. GitButler records the deletion; no `git rm`.

In `apps/web/src/app/layout.tsx:13` and `apps/web/src/app/layout.test.ts:10`, change the import to:

```ts
import { Navigation } from '@/components/with-logic/navigation/navigation';
```

`layout.test.ts` hands the component `{ _key: 'news', title: 'News' }` as a plain value and never renders it, so its assertions stay unchanged.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter web exec vitest run src/components/with-logic/navigation src/app/layout.test.ts` Expected: PASS for all five navigation test files and the layout test.

- [ ] **Step 6: Look at it in the browser**

Start the dev server with the preview tool (`preview_start` with `{ name: "web" }` from `.claude/launch.json`). It reads the `development` dataset from `.env.local`. Before Task 9 no item has children, so the bar must look as before except for the contact button.

- Resize to 1100×800 and check that the bar holds "KONTAKT" as a small secondary button.
- Resize to 1280×800 and check "KONTAKT AUFNEHMEN".
- Resize to 800×1000, open the menu and check that "KONTAKT AUFNEHMEN" sits at its end.
- Check the console for errors.
- Take a screenshot of the 1100 px state for the user.
- Reset the viewport with the `desktop` preset.

- [ ] **Step 7: Gates and commit**

Run: `pnpm --filter web run test && pnpm run lint && pnpm run typecheck && pnpm exec oxfmt --check`

Commit through `create-commit`, suggested message `feat(web): wire the main navigation to groups and compact contact button`. Files: the query, the generated types, the new shell and its test, the deletions, and both layout files.

---

### Task 9: Development dataset (needs the user's "yes")

**Files:** none. This task only changes the Sanity dataset `development` of project `j4rxwl5m`.

**Interfaces:**

- Consumes: the migration from Task 2 and the types from Task 1.
- Produces the dataset state Task 10 records:
  - five `mainNavigationItem` entries,
  - "Verein" (`_key` `3ec68f9c2d7e`) with the children "Kontakt" (internal, `contact`) and "Stadt Neuwied" (external, `https://www.neuwied.de`).

- [ ] **Step 1: Dry run**

Run from `apps/studio`: `pnpm exec sanity migration run main-navigation-items --project j4rxwl5m --dataset development`

Expected: one document (`site-settings`) with a `set` on `mainNavigation` whose five entries are `mainNavigationItem` with `linkType: 'internal'`. Titles and keys are unchanged: `e67d3415723b` Home, `3ec68f9c2d7e` Verein, `908f94712108` Angebot, `e7ad8bed787c` Aktuelles, `0f273d2b52be` Mitgliedschaft.

- [ ] **Step 2: STOP — ask the user**

Show the dry-run summary and ask for an explicit "yes" to run it for real on `development`, and to add the two sample children afterwards. Do not continue without it.

- [ ] **Step 3: Run the migration**

Run from `apps/studio`: `pnpm exec sanity migration run main-navigation-items --project j4rxwl5m --dataset development --no-dry-run`

- [ ] **Step 4: Add the sample children and publish**

Use the Sanity MCP tool `patch_documents` (project `j4rxwl5m`, dataset `development`) on document `site-settings`. It writes to the draft `drafts.site-settings`:

```json
{
	"site-settings": {
		"patches": [
			{
				"set": {
					"mainNavigation[_key==\"3ec68f9c2d7e\"].children": [
						{
							"_key": "verein-kontakt",
							"_type": "navigationLink",
							"link": { "_ref": "contact", "_type": "reference" },
							"linkType": "internal",
							"title": "Kontakt"
						},
						{
							"_key": "verein-neuwied",
							"_type": "navigationLink",
							"href": "https://www.neuwied.de",
							"linkType": "external",
							"title": "Stadt Neuwied"
						}
					]
				}
			}
		]
	}
}
```

Then publish `site-settings` with `publish_documents`.

- [ ] **Step 5: Verify**

Run with `query_documents` (perspective `raw`):

```groq
*[_id in ['site-settings', 'drafts.site-settings']]{ _id, "items": mainNavigation[]{ _key, _type, linkType, title, "children": children[]{ _type, linkType, title } } }
```

Expected:

- only the published `site-settings` (no draft left),
- five `mainNavigationItem` entries with `linkType: 'internal'`,
- "Verein" with two `navigationLink` children.

---

### Task 10: End-to-end suite, fixtures and baselines

**Files:**

- Modify: `apps/web/e2e/specs/navigation.spec.ts`
- Regenerate: `apps/web/e2e/fixtures/sanity/*.json`, `apps/web/e2e/__screenshots__/**`

**Interfaces:**

- Consumes: the dataset state from Task 9 and `waitForPage` from `e2e/support/navigation.ts`.

- [ ] **Step 1: Adapt the existing mobile test**

In `keeps the collapsed mobile menu out of reach, then opens it and navigates from it`, "Verein" is now a group trigger in the mobile menu. Switch the test to "Angebot":

- `menu.locator('a[href="/verein"]')` becomes `menu.locator('a[href="/angebot"]')`,
- `menu.getByRole('link', { name: 'Verein', exact: true })` becomes `menu.getByRole('link', { name: 'Angebot', exact: true })`,
- the final `await expect(page).toHaveURL('/verein');` becomes `await expect(page).toHaveURL('/angebot');`.

The comments stay as they are.

- [ ] **Step 2: Add the new cases**

Insert inside `test.describe('navigation', …)`, after the mobile test:

```ts
test('opens the club group on desktop and leads to its overview', async ({ isMobile, page }) => {
	test.skip(isMobile, 'the desktop bar only exists from the lg breakpoint');

	await page.goto('/');
	await waitForPage(page);

	const trigger = page
		.getByRole('navigation', { name: 'Hauptnavigation' })
		.getByRole('button', { name: 'Verein', exact: true });

	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await trigger.click();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');

	// The panel is portalled to the end of `<body>`, outside the navigation landmark.
	const overview = page.getByRole('link', { name: 'Übersicht', exact: true });

	await expect(overview).toBeVisible();
	await expect(page.getByRole('link', { name: /^Stadt Neuwied/u })).toHaveAttribute(
		'target',
		'_blank',
	);

	await overview.click();
	await expect(page).toHaveURL('/verein');
	await expect(overview).toBeHidden();
});

test('operates the club group by keyboard on desktop', async ({ isMobile, page }) => {
	test.skip(isMobile, 'the desktop bar only exists from the lg breakpoint');

	await page.goto('/');
	await waitForPage(page);

	const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
	const trigger = navigation.getByRole('button', { name: 'Verein', exact: true });

	await trigger.focus();
	await page.keyboard.press('Enter');
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');

	await page.keyboard.press('Tab');
	await expect(page.getByRole('link', { name: 'Übersicht', exact: true })).toBeFocused();

	// Escape closes the panel from inside it and hands the focus back to the trigger.
	await page.keyboard.press('Escape');
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await expect(trigger).toBeFocused();

	// Tabbing past the last link leaves the panel, closes it and moves on through the bar.
	await page.keyboard.press('Enter');
	await page.keyboard.press('Tab');
	await page.keyboard.press('Tab');
	await page.keyboard.press('Tab');
	await expect(page.getByRole('link', { name: /^Stadt Neuwied/u })).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(navigation.getByRole('link', { name: 'Angebot', exact: true })).toBeFocused();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('expands the club group in the mobile menu and follows a sub-entry', async ({
	isMobile,
	page,
}) => {
	test.skip(!isMobile, 'the mobile menu only exists below the desktop breakpoint');

	await page.goto('/');
	await waitForPage(page);

	const toggle = page.getByRole('button', { name: 'Menü' });
	const menu = page.locator('#mobile-navigation');
	const group = menu.getByRole('button', { name: 'Verein', exact: true });

	await toggle.click();
	await expect(group).toHaveAttribute('aria-expanded', 'false');
	await expect(menu.getByRole('link', { name: 'Übersicht', exact: true })).toBeHidden();

	await group.click();
	await expect(group).toHaveAttribute('aria-expanded', 'true');

	await menu.getByRole('link', { name: 'Kontakt', exact: true }).click();
	await expect(page).toHaveURL('/kontakt');
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('fits the contact button to the width of the bar', async ({ isMobile, page }) => {
	test.skip(isMobile, 'the viewport is set by hand here; one browser project covers it');

	const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
	const short = navigation.getByRole('link', { name: 'Kontakt', exact: true });
	const long = navigation.getByRole('link', { name: 'Kontakt aufnehmen', exact: true });

	// Between lg and xl the bar is tight, so the button shrinks to its short label.
	await page.setViewportSize({ height: 800, width: 1100 });
	await page.goto('/');
	await waitForPage(page);
	await expect(short).toBeVisible();
	await expect(long).toBeHidden();

	await page.setViewportSize({ height: 800, width: 1280 });
	await expect(short).toBeHidden();
	await expect(long).toBeVisible();

	// Below lg it lives in the mobile menu, which used to hide it from 640 px on.
	await page.setViewportSize({ height: 1000, width: 800 });
	await page.getByRole('button', { name: 'Menü' }).click();
	await expect(
		page
			.locator('#mobile-navigation')
			.getByRole('link', { name: 'Kontakt aufnehmen', exact: true }),
	).toBeVisible();
});
```

- [ ] **Step 3: Record the fixtures**

The query changed and so did the dataset, so the fixtures have to be recorded again. Delete every fixture first, as `apps/web/AGENTS.md` recommends, so that stale ones go away too:

```bash
rm apps/web/e2e/fixtures/sanity/*.json
pnpm --filter web run e2e:record
pnpm exec oxfmt apps/web/e2e/fixtures/sanity
```

Assertions may fail during the recording; the fixtures are still written. Expected: the fixture holding `mainNavigation` contains the two children of "Verein".

- [ ] **Step 4: Run the mocked suite**

Run: `pnpm --filter web run test:e2e`

Expected on macOS:

- all specs pass in both projects, the visual specs skip themselves,
- `accessibility.spec.ts` reports no violation outside `KNOWN_VIOLATIONS` (which is empty).

If the click case of "opens the club group on desktop" fails because the hover triggered by moving the pointer opened the panel and the click then closed it:

- replace `trigger.click()` with `trigger.hover()` for the opening,
- keep the keyboard case as the proof for Enter,
- report it.

- [ ] **Step 5: Regenerate the visual baselines**

Run: `pnpm --filter web run test:e2e:visual:update` (needs a running Docker daemon, emulated amd64 on Apple Silicon, so allow time).

Expected changes in `apps/web/e2e/__screenshots__/chromium/`:

- the header shows a chevron next to "VEREIN" on every route,
- on the `/kontakt` shot "VEREIN" also carries the active underline, because the sample child "Kontakt" is active there.

The `mobile-safari` shots have the menu closed and must not change. Any other difference is a finding: look at it before committing.

- [ ] **Step 6: Gates and commit**

Run: `pnpm run lint && pnpm exec oxfmt --check`

Commit through `create-commit`, suggested message `test(web): cover navigation groups end to end`. Files: the spec, the fixtures (new, changed, deleted) and the baselines.

---

### Task 11: Final checks and hand-over

**Files:**

- Possibly modify: `apps/web/vitest.config.ts` (`coverage.thresholds`), `apps/studio/vitest.config.ts` (`coverage.thresholds`), root `AGENTS.md` (the coverage figures)

- [ ] **Step 1: Coverage ratchet**

Run: `pnpm run test:coverage`

Expected: green in every workspace.

- `apps/web`: note lines, statements, functions and branches. If a figure rose above its threshold by a full point or more, raise that threshold to the new integer floor. Update the sentence in the root `AGENTS.md`, currently "it reaches 93.1% / 85.9% / 85.2%", with the new numbers.
- `apps/studio`: same rule for its thresholds.
- Never lower a threshold.

- [ ] **Step 2: Local Lighthouse**

1. `pnpm --filter web run build`.
2. Add a local-only entry to `.claude/launch.json` (never committed): `{ "name": "web-start", "runtimeExecutable": "pnpm", "runtimeArgs": ["--filter", "web", "exec", "next", "start", "-p", "3000"], "port": 3000 }`.
3. Stop the dev server from Task 8 if it still runs (`preview_stop`), then start `web-start` with `preview_start`.
4. Run `LHCI_BASE_URL=http://localhost:3000 pnpm --filter web run test:lighthouse`.

Expected: accessibility 1 and SEO 1 on all five routes. Best practices around 0.96 locally, because of the CORS failure of the live stream and the missing `/_vercel/*` scripts; that is not a finding. Stop the server afterwards.

- [ ] **Step 3: Full gates**

Run: `pnpm run lint && pnpm run typecheck && pnpm run test && pnpm exec oxfmt --check` Expected: all green.

- [ ] **Step 4: Commit the ratchet (if anything changed)**

Commit through `create-commit`, suggested message `test: raise coverage thresholds`.

- [ ] **Step 5: Record the production follow-up**

- Add a comment to WEB-343 in English. It says that the `development` dataset is migrated and holds sample children on "Verein". It also lists the production steps:
  - after `next` is released to `main`, run `pnpm exec sanity migration run main-navigation-items --project j4rxwl5m --dataset production`, first as a dry run, then with `--no-dry-run` after the user's approval,
  - do **not** copy the sample children to production,
  - check the synced GitHub issue #585 after the merge.
- Save a project memory `web-343-production-migration-pending` with the same content. Add its pointer line to `MEMORY.md` and link it to `[[web-270-production-patch-pending]]`.

- [ ] **Step 6: Report**

Tell the user:

- which commits are on `feat/web-343-main-navigation-submenus`,
- the test, coverage and Lighthouse results,
- the screenshot from Task 8,
- the baseline changes from Task 10,
- anything that went differently than planned.

No push, no PR.
