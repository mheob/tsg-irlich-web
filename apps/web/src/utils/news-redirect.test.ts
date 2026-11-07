import { describe, expect, it } from 'vite-plus/test';

import { resolveNewsArticleRedirect, resolveNewsCategoryRedirect } from './news-redirect';

describe('news article redirect', () => {
	it('sends a former slug to the article under its first category', () => {
		expect(resolveNewsArticleRedirect({ category: 'verein', slug: 'einladung-jhv-2026' })).toBe(
			'/news/verein/einladung-jhv-2026',
		);
	});

	it('has no target when no article had the slug', () => {
		expect(resolveNewsArticleRedirect(null)).toBeUndefined();
	});

	it('has no target for an article without a category, which has no page', () => {
		expect(
			resolveNewsArticleRedirect({ category: null, slug: 'einladung-jhv-2026' }),
		).toBeUndefined();
	});
});

describe('news category redirect', () => {
	it('sends a former slug to the first page of the category', () => {
		expect(resolveNewsCategoryRedirect('jedermaenner', 1)).toBe('/news/jedermaenner');
	});

	it('keeps a later page under its public address', () => {
		expect(resolveNewsCategoryRedirect('jedermaenner', 2)).toBe('/news/jedermaenner?seite=2');
	});

	it('has no target when no category had the slug', () => {
		expect(resolveNewsCategoryRedirect(null, 1)).toBeUndefined();
	});
});
