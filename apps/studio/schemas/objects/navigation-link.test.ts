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
			// oxlint-disable-next-line unicorn/no-useless-undefined -- a missing parent is the case under test
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
