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
