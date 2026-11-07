import { describe, expect, it } from 'vite-plus/test';

import { newsArticleRedirectQuery } from './news-article';

describe('news article redirect query', () => {
	// Two articles may list the same former slug, for instance after a copy kept its original's
	// history. The pick has to be the same on every request, so the tie is broken by the id.
	it('picks the most recently updated article and breaks a tie by id', () => {
		expect(newsArticleRedirectQuery).toMatch(/\| order\(_updatedAt desc, _id asc\)\[0\]/u);
	});

	it('finds the article by a former slug, never by a draft', () => {
		expect(newsArticleRedirectQuery).toContain('$slug in previousSlugs');
		expect(newsArticleRedirectQuery).toContain("!(_id in path('drafts.**'))");
	});

	// An article without a slug or a category would win the `[0]` and then be rejected as an
	// incomplete address, which hides a complete one behind it.
	it('only considers an article that has a page', () => {
		expect(newsArticleRedirectQuery).toContain('defined(slug.current)');
		expect(newsArticleRedirectQuery).toContain('defined(categories[0]->slug.current)');
	});

	it('answers with the current slug and the first category', () => {
		expect(newsArticleRedirectQuery).toContain('"category": categories[0]->slug.current');
		expect(newsArticleRedirectQuery).toContain('"slug": slug.current');
	});
});
