import { describe, expect, it } from 'vite-plus/test';

import { newsCategoryRedirectQuery } from './news';

describe('news category redirect query', () => {
	it('picks the most recently updated category and breaks a tie by id', () => {
		expect(newsCategoryRedirectQuery).toMatch(/\| order\(_updatedAt desc, _id asc\)\[0\]/u);
	});

	it('finds the category by a former slug, never by a draft', () => {
		expect(newsCategoryRedirectQuery).toContain('$slug in previousSlugs');
		expect(newsCategoryRedirectQuery).toContain("!(_id in path('drafts.**'))");
		expect(newsCategoryRedirectQuery).toContain('defined(slug.current)');
	});

	it('answers with the current slug of the category', () => {
		expect(newsCategoryRedirectQuery).toContain('[0].slug.current');
	});
});
