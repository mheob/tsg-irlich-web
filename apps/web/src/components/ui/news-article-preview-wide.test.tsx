import { describe, expect, it, vi } from 'vitest';

import type { NewsArticlesQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { NewsArticlePreviewWide } from './news-article-preview-wide';

// The images go through `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that asserts its
// project variables at import time. `vi.hoisted` runs before the imports are evaluated;
// `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const ASSET_REF = 'image-abc123def456-800x600-jpg';

function image(alt: string) {
	return { alt, asset: { _ref: ASSET_REF, _type: 'reference' } };
}

function buildArticle(overrides: Record<string, unknown> = {}): NewsArticlesQueryResult[number] {
	// The generated result type carries more fields than a fixture needs to name.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return {
		author: { firstName: 'Ada', image: image('Ada Lovelace'), lastName: 'Lovelace' },
		categories: [{ slug: 'vereinsleben', title: 'Vereinsleben' }],
		excerpt: 'Ein Rückblick auf das Sommerfest.',
		featuredImage: image('Das Sommerfest'),
		slug: 'sommerfest',
		title: 'Sommerfest 2026',
		...overrides,
	} as unknown as NewsArticlesQueryResult[number];
}

describe('the wide news article preview', () => {
	it('links its title to the article below its category', () => {
		const { getByRole } = renderWithUser(<NewsArticlePreviewWide {...buildArticle()} />);

		expect(getByRole('link', { name: 'Sommerfest 2026' }).getAttribute('href')).toBe(
			'/news/vereinsleben/sommerfest',
		);
	});

	it('links every category to its overview', () => {
		const { getByRole } = renderWithUser(<NewsArticlePreviewWide {...buildArticle()} />);

		expect(getByRole('link', { name: 'Vereinsleben' }).getAttribute('href')).toBe(
			'/news/vereinsleben',
		);
	});

	it('shows the excerpt and the author', () => {
		const { getByText } = renderWithUser(<NewsArticlePreviewWide {...buildArticle()} />);

		expect(getByText('Ein Rückblick auf das Sommerfest.')).not.toBeNull();
		expect(getByText('Ada Lovelace')).not.toBeNull();
	});

	it('shows the featured image and the author portrait', () => {
		const { getByRole } = renderWithUser(<NewsArticlePreviewWide {...buildArticle()} />);

		expect(getByRole('img', { name: 'Das Sommerfest' })).not.toBeNull();
		expect(getByRole('img', { name: 'Ada Lovelace' })).not.toBeNull();
	});

	it('leaves the featured image out when the article has none', () => {
		const { queryByRole } = renderWithUser(
			<NewsArticlePreviewWide {...buildArticle({ featuredImage: null })} />,
		);

		expect(queryByRole('img', { name: 'Das Sommerfest' })).toBeNull();
	});

	it('leaves the portrait out when the author has none', () => {
		const { queryByRole } = renderWithUser(
			<NewsArticlePreviewWide
				{...buildArticle({ author: { firstName: 'Ada', image: null, lastName: 'Lovelace' } })}
			/>,
		);

		expect(queryByRole('img', { name: 'Ada Lovelace' })).toBeNull();
	});
});
