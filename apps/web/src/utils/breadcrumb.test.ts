import { describe, expect, it } from 'vite-plus/test';

import { getBreadcrumbItems, getBreadcrumbListSchema } from './breadcrumb';

describe('the breadcrumb trail', () => {
	it('starts at the home page and ends at the page, named after its title', () => {
		expect(getBreadcrumbItems('/angebot/weitere-sportarten/wandern', 'Wandern')).toStrictEqual([
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

	it('is only the home page for the home page', () => {
		expect(getBreadcrumbItems('/')).toStrictEqual([{ name: 'Home', path: '/' }]);
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
