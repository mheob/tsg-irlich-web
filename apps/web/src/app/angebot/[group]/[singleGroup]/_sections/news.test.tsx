import { describe, expect, it, vi } from 'vite-plus/test';

import type { OfferGroupsGroupPageNewsQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../../../test-utils/render';
import { News } from './news';

// The featured image goes through `urlForImage`, which reaches `src/lib/sanity/api.ts` — and that
// asserts its project variables at import time. `vi.hoisted` runs before the imports are
// evaluated; `globalThis` because the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

type NewsCategory = NonNullable<OfferGroupsGroupPageNewsQueryResult>;

function buildArticle(id: string, slug: string, title: string): NewsCategory['articles'][number] {
	// The generated result type carries more fields than a fixture needs to name.
	return {
		_id: id,
		author: { firstName: 'Ada', image: null, lastName: 'Lovelace' },
		categories: [{ slug: 'senioren', title: 'Senioren' }],
		excerpt: null,
		featuredImage: null,
		publishedAt: '2026-09-26T13:58:00Z',
		slug,
		title,
	} as unknown as NewsCategory['articles'][number];
}

const CATEGORY: NewsCategory = {
	_type: 'news.category',
	articles: [
		buildArticle('a', 'derbysieg', 'Derbysieg in Irlich'),
		buildArticle('b', 'saisonstart', 'Saisonstart'),
	],
	slug: 'senioren',
	title: 'Senioren',
};

describe('the news section of a group', () => {
	it('names the news category in its heading', () => {
		const { getByRole } = renderWithUser(<News {...CATEGORY} />);

		expect(
			getByRole('heading', { level: 2, name: 'Aktuelles aus dem Bereich Senioren' }),
		).not.toBeNull();
	});

	it('shows a preview of every article it was given', () => {
		const { getByRole } = renderWithUser(<News {...CATEGORY} />);

		expect(getByRole('heading', { name: 'Derbysieg in Irlich' })).not.toBeNull();
		expect(getByRole('heading', { name: 'Saisonstart' })).not.toBeNull();
	});

	it('links to the overview of the news category', () => {
		const { getByRole } = renderWithUser(<News {...CATEGORY} />);

		expect(getByRole('link', { name: 'Alle Neuigkeiten aus Senioren' }).getAttribute('href')).toBe(
			'/news/senioren',
		);
	});
});
