import { describe, expect, it } from 'vitest';

import { groupSections } from '@/utils/groups';
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

	it('resolves a group below the department it belongs to', () => {
		expect(getInternalHref({ _type: 'group.soccer', slug: 'herren-1' })).toBe(
			'/angebot/fussball/herren-1',
		);
	});

	it('resolves every group type in groupSections below its own department slug', () => {
		for (const section of groupSections) {
			expect(getInternalHref({ _type: section._type, slug: 'mitglied-1' })).toBe(
				`${section.slug}/mitglied-1`,
			);
		}
	});

	it('leaves a group type without a department page unresolved', () => {
		expect(getInternalHref({ _type: 'group.administration', slug: 'vorstand' })).toBeUndefined();
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
});
