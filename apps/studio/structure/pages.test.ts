import { describe, expect, it, vi } from 'vite-plus/test';

import type { NamedImageInput } from '@/components/named-image-input';
import { singlePages } from '@/schemas/single-pages';

import { PAGE_LAYOUT, SINGLE_PAGES, findSinglePage, getPlacedPages } from './pages';
import type { PageSection, SinglePageType } from './pages';

// The single pages carry `meta`, whose image input pulls in `sanity-plugin-media`, which breaks
// under Vitest (see `schemas/objects/meta.test.ts`).
vi.mock(import('@/components/named-image-input'), () => ({
	NamedImageInput: (() => null) as unknown as typeof NamedImageInput,
}));

const PAGE_TYPES = Object.keys(SINGLE_PAGES) as SinglePageType[];

describe('single pages', () => {
	it('knows the address of every single page schema', () => {
		expect(PAGE_TYPES.toSorted()).toStrictEqual(singlePages.map(({ name }) => name).toSorted());
	});

	it('places every single page in the desk exactly once', () => {
		expect(getPlacedPages().toSorted()).toStrictEqual(PAGE_TYPES.toSorted());
	});

	it('starts every address at the root of the website', () => {
		const addresses = PAGE_TYPES.map((type) => SINGLE_PAGES[type].path);

		expect(addresses.filter((path) => !path.startsWith('/'))).toStrictEqual([]);
	});

	it('nests a sub page in the address of its parent', () => {
		const subPages = PAGE_TYPES.filter((type) => SINGLE_PAGES[type].parent !== undefined).map(
			(type) => ({
				parentPath: findSinglePage(String(SINGLE_PAGES[type].parent))?.path,
				path: SINGLE_PAGES[type].path,
			}),
		);

		expect(subPages).toStrictEqual([
			{ parentPath: '/verein', path: '/verein/echo' },
			{ parentPath: '/verein', path: '/verein/partner' },
			{ parentPath: '/verein', path: '/verein/ehrenamt' },
		]);
	});

	it('tells on every page shared by a kind of page where a single one is edited', () => {
		const sharedPages = PAGE_TYPES.filter((type) => SINGLE_PAGES[type].path.includes('['));

		expect(sharedPages.filter((type) => !SINGLE_PAGES[type].note?.includes(' → '))).toStrictEqual(
			[],
		);
	});
});

describe('finding a single page', () => {
	it('finds the place of the partner page', () => {
		expect(findSinglePage('partnerPage')).toStrictEqual({
			parent: 'aboutUs',
			path: '/verein/partner',
		});
	});

	it('finds the place of the volunteer page', () => {
		expect(findSinglePage('volunteerPage')).toStrictEqual({
			parent: 'aboutUs',
			path: '/verein/ehrenamt',
		});
	});

	it('finds the place of a sub page', () => {
		expect(findSinglePage('echoOverview')).toStrictEqual({
			parent: 'aboutUs',
			path: '/verein/echo',
		});
	});

	it('finds nothing for another document type', () => {
		expect(findSinglePage('news.article')).toBeUndefined();
	});

	it('ignores the names every object inherits', () => {
		expect(findSinglePage('toString')).toBeUndefined();
	});
});

describe('page layout', () => {
	it('follows the areas of the website', () => {
		const sections = PAGE_LAYOUT.filter((entry): entry is PageSection => typeof entry !== 'string');

		expect(sections.map(({ title }) => title)).toStrictEqual([
			'Verein',
			'News',
			'Angebot',
			'Rechtliches',
		]);
	});

	it('keeps the pages of no area on their own', () => {
		expect(PAGE_LAYOUT.filter((entry) => typeof entry === 'string')).toStrictEqual([
			'home',
			'membership',
			'contact',
			'searchPage',
		]);
	});

	it('lists the pages of the club under its main page', () => {
		expect(getPlacedPages().slice(1, 5)).toStrictEqual([
			'aboutUs',
			'echoOverview',
			'partnerPage',
			'volunteerPage',
		]);
	});
});
