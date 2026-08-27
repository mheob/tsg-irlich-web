import { describe, expect, it, vi } from 'vitest';

import type { NewsArticlesQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { NewsArticlePreview } from './news-article-preview';

// The featured image goes through `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that
// asserts its project variables at import time. `vi.hoisted` runs before the imports are
// evaluated; `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const ASSET_REF = 'image-abc123def456-800x600-jpg';

function buildArticle(overrides: Record<string, unknown> = {}): NewsArticlesQueryResult[number] {
	// The generated result type carries more fields than a fixture needs to name.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return {
		author: { firstName: 'Ada', image: null, lastName: 'Lovelace' },
		categories: [{ slug: 'vereinsleben', title: 'Vereinsleben' }],
		excerpt: 'Ein Rückblick auf das Sommerfest.',
		featuredImage: { alt: 'Das Sommerfest', asset: { _ref: ASSET_REF, _type: 'reference' } },
		publishedAt: '2026-07-01T08:00:00Z',
		slug: 'sommerfest',
		title: 'Sommerfest 2026',
		...overrides,
	} as unknown as NewsArticlesQueryResult[number];
}

describe('the news article preview', () => {
	it('links its title and image to the article below its category', () => {
		const { getAllByRole } = renderWithUser(<NewsArticlePreview article={buildArticle()} />);

		const targets = getAllByRole('link').map((link) => link.getAttribute('href'));

		expect(targets).toContain('/news/vereinsleben/sommerfest');
	});

	it('links its category to the category overview', () => {
		const { getByRole } = renderWithUser(<NewsArticlePreview article={buildArticle()} />);

		expect(getByRole('link', { name: 'Vereinsleben' }).getAttribute('href')).toBe(
			'/news/vereinsleben',
		);
	});

	it('shows the excerpt and the publication date', () => {
		const { getByText } = renderWithUser(<NewsArticlePreview article={buildArticle()} />);

		expect(getByText('Ein Rückblick auf das Sommerfest.')).not.toBeNull();
		expect(getByText('1. Juli 2026')).not.toBeNull();
	});

	it('shortens the date in the two-column layout', () => {
		const { getByText } = renderWithUser(
			<NewsArticlePreview article={buildArticle()} columns={2} />,
		);

		expect(getByText('01.07.2026')).not.toBeNull();
	});

	it('leaves the image out when the article has none', () => {
		const { queryByRole } = renderWithUser(
			<NewsArticlePreview article={buildArticle({ featuredImage: null })} />,
		);

		expect(queryByRole('img')).toBeNull();
	});
});
