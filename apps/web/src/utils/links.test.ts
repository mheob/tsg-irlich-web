import { describe, expect, it } from 'vite-plus/test';

import { getInternalHref } from '@/utils/links';

describe('resolving internal link targets', () => {
	it('resolves the home page to the site root', () => {
		expect(getInternalHref({ _type: 'home', slug: 'home' })).toBe('/');
	});

	it('resolves a news article below its category', () => {
		expect(getInternalHref({ _type: 'news.article', category: 'verein', slug: 'sommerfest' })).toBe(
			'/news/verein/sommerfest',
		);
	});

	it('leaves a news article without a category unresolved', () => {
		expect(getInternalHref({ _type: 'news.article', slug: 'sommerfest' })).toBeUndefined();
	});

	it('resolves a news category below the news overview', () => {
		expect(getInternalHref({ _type: 'news.category', slug: 'verein' })).toBe('/news/verein');
	});

	it('links a department below the offer page', () => {
		expect(getInternalHref({ _type: 'department', slug: 'tanzen' })).toBe('/angebot/tanzen');
	});

	it('links a group below its department', () => {
		expect(getInternalHref({ _type: 'group', department: 'fussball', slug: 'herren' })).toBe(
			'/angebot/fussball/herren',
		);
	});

	it('gives a group without department slug no link', () => {
		expect(getInternalHref({ _type: 'group', slug: 'herren' })).toBeUndefined();
	});

	it('gives a group with a null department slug no link', () => {
		expect(getInternalHref({ _type: 'group', department: null, slug: 'herren' })).toBeUndefined();
	});

	it('gives a group with an empty department slug no link', () => {
		expect(getInternalHref({ _type: 'group', department: '', slug: 'herren' })).toBeUndefined();
	});

	it('ignores a department slug on a type that is not a group', () => {
		expect(
			getInternalHref({ _type: 'membership', department: 'fussball', slug: 'mitgliedschaft' }),
		).toBe('/mitgliedschaft');
	});

	it('resolves an unknown type to a single page at its slug', () => {
		expect(getInternalHref({ _type: 'membership', slug: 'mitgliedschaft' })).toBe(
			'/mitgliedschaft',
		);
	});

	it('leaves an undefined target unresolved', () => {
		const undefinedTarget: Parameters<typeof getInternalHref>[0] = undefined;

		expect(getInternalHref(undefinedTarget)).toBeUndefined();
	});

	it('leaves a null target unresolved', () => {
		expect(getInternalHref(null)).toBeUndefined();
	});

	it('leaves an empty target unresolved', () => {
		expect(getInternalHref({})).toBeUndefined();
	});

	it('leaves a target without a slug unresolved', () => {
		expect(getInternalHref({ _type: 'home' })).toBeUndefined();
	});

	it('leaves a target without a type unresolved', () => {
		expect(getInternalHref({ slug: 'x' })).toBeUndefined();
	});

	it('leaves a news article with a null category unresolved', () => {
		expect(getInternalHref({ _type: 'news.article', category: null, slug: 'x' })).toBeUndefined();
	});

	it('resolves the TSG-Echo archive below the club page', () => {
		expect(getInternalHref({ _type: 'echoOverview', slug: 'echo' })).toBe('/verein/echo');
	});

	it('resolves a TSG-Echo issue below the archive', () => {
		expect(getInternalHref({ _type: 'echo.issue', slug: 'tsg-echo-2025' })).toBe(
			'/verein/echo/tsg-echo-2025',
		);
	});
});
