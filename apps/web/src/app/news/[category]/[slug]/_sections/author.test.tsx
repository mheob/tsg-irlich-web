import { describe, expect, it, vi } from 'vitest';

import type { NewsArticleContentQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../../../test-utils/render';
import { Author } from './author';

// The portrait goes through `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that asserts
// its project variables at import time. `vi.hoisted` runs before the imports are evaluated;
// `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const ASSET_REF = 'image-abc123def456-800x600-jpg';

type ArticleAuthor = Pick<NonNullable<NewsArticleContentQueryResult>, 'author' | 'publishedAt'>;

const PORTRAIT = { alt: 'Ada Lovelace', asset: { _ref: ASSET_REF } };

function buildArticle(image: unknown = PORTRAIT): ArticleAuthor {
	// The generated result type carries more fields than a fixture needs to name.
	return {
		author: {
			email: 'ada@tsg-irlich.de',
			firstName: 'Ada',
			image,
			lastName: 'Lovelace',
		},
		publishedAt: '2026-07-01T08:00:00Z',
	} as unknown as ArticleAuthor;
}

describe('the author beside an article', () => {
	it('names the author and the publication date', () => {
		const { getByRole, getByText } = renderWithUser(<Author article={buildArticle()} />);

		expect(getByRole('heading', { name: 'Autor' })).not.toBeNull();
		expect(getByText('Ada Lovelace')).not.toBeNull();
		expect(getByText('1. Juli 2026')).not.toBeNull();
	});

	it('shows the portrait of an author who has one', () => {
		const { getByRole } = renderWithUser(<Author article={buildArticle()} />);

		expect(getByRole('img', { name: 'Ada Lovelace' })).not.toBeNull();
	});

	it('leaves the portrait out when the author has none', () => {
		const { queryByRole } = renderWithUser(<Author article={buildArticle(null)} />);

		expect(queryByRole('img')).toBeNull();
	});

	// The link renders as a `ContactLink`, which hides its target until the visitor interacts with it
	// and reports a generic name until then — see `src/components/with-logic/contact-link.test.tsx`.
	it('reveals the author address once the visitor interacts with the link', async () => {
		const { getByRole, user } = renderWithUser(<Author article={buildArticle()} />);

		const link = getByRole('button', { name: 'Kontaktlink - tippen zum Anzeigen' });
		await user.hover(link);

		expect(link.getAttribute('href')).toBe('mailto:ada@tsg-irlich.de');
	});
});
