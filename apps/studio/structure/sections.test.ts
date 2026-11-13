import type { DocumentDefinition } from 'sanity';
import { describe, expect, it } from 'vite-plus/test';

import { createFakeStructureBuilder, getItemTitles } from '@/test-utils/fake-structure-builder';
import type { FakeBuilder } from '@/test-utils/fake-structure-builder';

import { SINGLE_PAGES } from './pages';
import { getPageListItems } from './sections';

/** Every single page, titled with its type name so the lists below read like the layout. */
const ALL_PAGES = Object.keys(SINGLE_PAGES).map((name) => ({ name, title: name }));

/**
 * Builds the upper block of the desk with a fake structure builder.
 *
 * @param definitions - The single page definitions the studio passes in.
 * @returns The list items, as the fake reads them back.
 */
function buildPageListItems(
	definitions: readonly { name: string; title?: string }[] = ALL_PAGES,
): FakeBuilder[] {
	return getPageListItems(
		createFakeStructureBuilder(),
		definitions as DocumentDefinition[],
	) as unknown as FakeBuilder[];
}

/**
 * Finds a list item of the upper block by its id.
 *
 * @param id - The id of the list item.
 * @returns The list item.
 */
function findListItem(id: string): FakeBuilder | undefined {
	return buildPageListItems().find((item) => item.getId() === id);
}

describe('page list items', () => {
	it('lists the areas of the website between the single pages', () => {
		expect(buildPageListItems().map((item) => item.getTitle())).toStrictEqual([
			'home',
			'Verein',
			'News',
			'Angebot',
			'membership',
			'contact',
			'searchPage',
			'Rechtliches',
		]);
	});

	it('opens a single page as the one document of its type', () => {
		const home = findListItem('home')?.getChild();

		expect(home?.kind).toBe('document');
		expect(home?.getSchemaType()).toBe('home');
		expect(home?.getDocumentId()).toBe('home');
	});

	it('lists the club page above its sub pages and the issues of the TSG-Echo', () => {
		expect(getItemTitles(findListItem('club')?.getChild())).toStrictEqual([
			'aboutUs',
			'Unterseiten',
			'echoOverview',
			'partnerPage',
			'volunteerPage',
			'Inhalte',
			'TSG-Echo Ausgaben',
			'Offene Aufgaben',
		]);
	});

	it('lists the news pages above the articles and categories', () => {
		expect(getItemTitles(findListItem('news')?.getChild())).toStrictEqual([
			'newsOverview',
			'Unterseiten',
			'newsOverviewCategory',
			'news-article-page',
			'Inhalte',
			'news.article',
			'news.category',
		]);
	});

	it('lists the offer pages above the departments, groups and questions', () => {
		expect(getItemTitles(findListItem('offer')?.getChild())).toStrictEqual([
			'departmentsPage',
			'Unterseiten',
			'groupsPage',
			'singleGroupPage',
			'Inhalte',
			'Abteilungen',
			'Gruppen',
			'FAQ',
		]);
	});

	it('lists the legal pages side by side, without a main page', () => {
		expect(getItemTitles(findListItem('legal')?.getChild())).toStrictEqual([
			'imprint',
			'privacy',
			'accessibility',
		]);
	});

	it('falls back to the type name of a page without a title', () => {
		const items = buildPageListItems([{ name: 'home' }]);

		expect(items.map((item) => item.getTitle())).toContain('home');
	});
});

describe('pages missing from the layout', () => {
	it('collects a single page the layout does not place under Weitere Seiten', () => {
		const items = buildPageListItems([...ALL_PAGES, { name: 'volunteering', title: 'Ehrenamt' }]);
		const otherPages = items.at(-1);

		expect(otherPages?.getTitle()).toBe('Weitere Seiten');
		expect(getItemTitles(otherPages?.getChild())).toStrictEqual(['Ehrenamt']);
	});

	it('leaves the site settings to the settings group', () => {
		const items = buildPageListItems([...ALL_PAGES, { name: 'site-settings', title: 'Settings' }]);

		expect(items.map((item) => item.getTitle())).not.toContain('Weitere Seiten');
	});

	it('skips a page whose schema is not passed in', () => {
		const items = buildPageListItems(ALL_PAGES.filter(({ name }) => name !== 'echoOverview'));

		expect(getItemTitles(items.find((item) => item.getId() === 'club')?.getChild())).toStrictEqual([
			'aboutUs',
			'Unterseiten',
			'partnerPage',
			'volunteerPage',
			'Inhalte',
			'TSG-Echo Ausgaben',
			'Offene Aufgaben',
		]);
	});

	it('leaves out an area with neither pages nor documents', () => {
		const items = buildPageListItems(ALL_PAGES.filter(({ name }) => name !== 'privacy'));
		const withoutLegal = buildPageListItems(
			ALL_PAGES.filter(({ name }) => !['accessibility', 'imprint', 'privacy'].includes(name)),
		);

		expect(items.map((item) => item.getId())).toContain('legal');
		expect(withoutLegal.map((item) => item.getId())).not.toContain('legal');
	});
});
