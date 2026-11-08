import { describe, expect, it } from 'vite-plus/test';

import { getBreadcrumbItems, getBreadcrumbListSchema } from './breadcrumb';

describe('the breadcrumb trail', () => {
	it('starts at the home page and ends at the page, named after its title', () => {
		expect(
			getBreadcrumbItems('/angebot/weitere-sportarten/wandern', { page: 'Wandern' }),
		).toStrictEqual([
			{ name: 'Home', path: '/' },
			{ name: 'Angebot', path: '/angebot' },
			{ name: 'Weitere Sportarten', path: '/angebot/weitere-sportarten' },
			{ name: 'Wandern', path: '/angebot/weitere-sportarten/wandern' },
		]);
	});

	it('names the page after its segment when it has no title', () => {
		expect(getBreadcrumbItems('/verein/vorstand-team').at(-1)).toStrictEqual({
			name: 'Vorstand Team',
			path: '/verein/vorstand-team',
		});
	});

	it('skips the registration segment, which has no page of its own', () => {
		expect(
			getBreadcrumbItems('/anmeldung/dorfturnier-2027', { page: 'Dorfturnier 2027' }),
		).toStrictEqual([
			{ name: 'Home', path: '/' },
			{ name: 'Dorfturnier 2027', path: '/anmeldung/dorfturnier-2027' },
		]);
	});

	it('is only the home page for the home page', () => {
		expect(getBreadcrumbItems('/')).toStrictEqual([{ name: 'Home', path: '/' }]);
	});

	it('spells the TSG-Echo segment the way the club writes it', () => {
		expect(
			getBreadcrumbItems('/verein/echo/tsg-echo-2025', { page: 'TSG ECHO 2025' }),
		).toStrictEqual([
			{ name: 'Home', path: '/' },
			{ name: 'Verein', path: '/verein' },
			{ name: 'TSG-Echo', path: '/verein/echo' },
			{ name: 'TSG ECHO 2025', path: '/verein/echo/tsg-echo-2025' },
		]);
	});

	it('names the pages above it after the titles given for their paths', () => {
		expect(
			getBreadcrumbItems('/angebot/fussball/1-mannschaft', {
				page: '1. Mannschaft',
				parents: { '/angebot/fussball': 'Fußball' },
			}),
		).toStrictEqual([
			{ name: 'Home', path: '/' },
			{ name: 'Angebot', path: '/angebot' },
			{ name: 'Fußball', path: '/angebot/fussball' },
			{ name: '1. Mannschaft', path: '/angebot/fussball/1-mannschaft' },
		]);
	});

	it('matches a title by the whole path, not by a segment that repeats', () => {
		expect(
			getBreadcrumbItems('/news/news/rueckblick', { parents: { '/news/news': 'Vereinsnews' } }),
		).toStrictEqual([
			{ name: 'Home', path: '/' },
			{ name: 'News', path: '/news' },
			{ name: 'Vereinsnews', path: '/news/news' },
			{ name: 'Rueckblick', path: '/news/news/rueckblick' },
		]);
	});

	it('names the page after its own title, not after one given for its path as a parent', () => {
		expect(
			getBreadcrumbItems('/news/pr-team', {
				page: 'PR-Team',
				parents: { '/news/pr-team': 'Pressearbeit' },
			}).at(-1),
		).toStrictEqual({ name: 'PR-Team', path: '/news/pr-team' });
	});

	it.each([
		['missing', undefined],
		['null', null],
		['empty', ''],
		['blank', '   '],
	])('falls back to the humanised segment when a title is %s', (_, title) => {
		expect(
			getBreadcrumbItems('/news/pr-team/sommerfest', {
				page: title,
				parents: { '/news/pr-team': title },
			}),
		).toStrictEqual([
			{ name: 'Home', path: '/' },
			{ name: 'News', path: '/news' },
			{ name: 'Pr Team', path: '/news/pr-team' },
			{ name: 'Sommerfest', path: '/news/pr-team/sommerfest' },
		]);
	});

	it("prefers a given title over the club's spelling of a segment", () => {
		expect(
			getBreadcrumbItems('/verein/echo', { page: 'Unsere Vereinszeitung' }).at(-1),
		).toStrictEqual({ name: 'Unsere Vereinszeitung', path: '/verein/echo' });
	});
});

describe('the breadcrumb structured data', () => {
	it('lists the trail with absolute links, counted from one', () => {
		expect(
			getBreadcrumbListSchema('https://www.tsg-irlich.de', [
				{ name: 'Home', path: '/' },
				{ name: 'Verein', path: '/verein' },
			]),
		).toStrictEqual({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', item: 'https://www.tsg-irlich.de/', name: 'Home', position: 1 },
				{
					'@type': 'ListItem',
					item: 'https://www.tsg-irlich.de/verein',
					name: 'Verein',
					position: 2,
				},
			],
		});
	});
});
