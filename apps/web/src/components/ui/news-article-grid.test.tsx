import { describe, expect, it, vi } from 'vite-plus/test';

import type { NewsArticlesQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { NewsArticleGrid } from './news-article-grid';

// The featured image goes through `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that
// asserts its project variables at import time. `vi.hoisted` runs before the imports are
// evaluated; `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

function buildArticle(id: string, slug: string, title: string): NewsArticlesQueryResult[number] {
	// The generated result type carries more fields than a fixture needs to name.
	return {
		_id: id,
		author: { firstName: 'Ada', image: null, lastName: 'Lovelace' },
		categories: [{ slug: 'fussball', title: 'Fußball' }],
		excerpt: null,
		featuredImage: null,
		publishedAt: '2026-07-01T08:00:00Z',
		slug,
		title,
	} as unknown as NewsArticlesQueryResult[number];
}

describe('the news article grid', () => {
	it('shows a preview for every article, in the order given', () => {
		const { getAllByRole } = renderWithUser(
			<NewsArticleGrid
				articles={[
					buildArticle('a', 'pokalsieg', 'Pokalsieg'),
					buildArticle('b', 'saisonstart', 'Saisonstart'),
				]}
			/>,
		);

		const headings = getAllByRole('heading').map((heading) => heading.textContent);

		expect(headings).toStrictEqual(['Pokalsieg', 'Saisonstart']);
	});
});
