import { describe, expect, it } from 'vite-plus/test';

import internalLink, { INTERNAL_LINK_TARGETS } from './internal-link';

interface LinkType {
	preview: {
		prepare: (selection: { title?: string }) => unknown;
		select: Record<string, string>;
	};
}

const linkType = internalLink as unknown as LinkType;

describe('internal link targets', () => {
	// Editors link the archive from the "Verein" menu; the issues themselves are reached from there.
	it('offers the TSG-Echo archive', () => {
		expect(INTERNAL_LINK_TARGETS).toContainEqual({ type: 'echoOverview' });
	});

	it('offers departments and groups', () => {
		expect(INTERNAL_LINK_TARGETS).toContainEqual({ type: 'department' });
		expect(INTERNAL_LINK_TARGETS).toContainEqual({ type: 'group' });
	});

	// The seven `group.*` types were merged into `group`; a reference to one of them would not resolve.
	it('no longer offers the former group types', () => {
		expect(INTERNAL_LINK_TARGETS.filter(({ type }) => type.startsWith('group.'))).toStrictEqual([]);
	});
});

// Without a preview the studio lists every entry of the legal menu as "link: {empty}".
describe('internal link preview', () => {
	it('selects the title of the linked page', () => {
		expect(linkType.preview.select).toStrictEqual({ title: 'link.title' });
	});

	it('shows the linked page in lists', () => {
		expect(linkType.preview.prepare({ title: 'Impressum' })).toStrictEqual({
			subtitle: 'Interne Seite',
			title: 'Impressum',
		});
	});

	it('names a missing page', () => {
		expect(linkType.preview.prepare({})).toStrictEqual({
			subtitle: 'Interne Seite',
			title: 'Keine Seite ausgewählt',
		});
	});
});
