import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import AccessibilityPage, { generateMetadata } from '@/app/(legal)/barrierefreiheit/page';
import { Hero } from '@/components/section/hero';
import { PortableText } from '@/components/ui/portable-text';
import type { client } from '@/lib/sanity/client';

import { itFollowsTheMetadataContract } from '../../../../test-utils/page-contract';
import { PAGE_HERO_IMAGE } from '../../../../test-utils/page-images';
import { findElement } from '../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../test-utils/sanity-client-mock';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
		fetch: vi.fn(),
	} as unknown as typeof client,
}));

vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

const mockedFetch = clientFetchMock();

function buildPage(meta?: Record<string, unknown>): Record<string, unknown> {
	return {
		content: { text: [{ _key: 'content', _type: 'block' }] },
		meta,
		subtitle: 'Erklärung zur Barrierefreiheit',
		title: 'Barrierefreiheit',
	};
}

describe('accessibility page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		// oxlint-disable-next-line vitest/require-hook -- registers `it` cases, not setup code
		itFollowsTheMetadataContract({
			build: buildPage,
			buildWithHeroImage: (heroImage, meta) => ({ ...buildPage(meta), heroImage }),
			fetchMock: mockedFetch,
			generateMetadata,
			path: '/barrierefreiheit',
			title: 'Barrierefreiheit',
		});
	});

	describe('rendering', () => {
		it('shows the hero image of the page', async () => {
			mockedFetch.mockResolvedValue({ ...buildPage(), heroImage: PAGE_HERO_IMAGE });

			const hero = findElement(await AccessibilityPage(), Hero);

			expect(hero?.props.image?.alt).toBe('Hero der Seite');
			expect(hero?.props.image?.src).toContain('heroimg111');
		});

		it('gives up when the document is missing', async () => {
			mockedFetch.mockResolvedValue(null);

			await expect(AccessibilityPage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('heads the page with its title and subtitle', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const hero = findElement(await AccessibilityPage(), Hero);

			expect(hero?.props).toMatchObject({
				subTitle: 'Erklärung zur Barrierefreiheit',
				title: 'Barrierefreiheit',
			});
		});

		it('renders the statement itself', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const text = findElement(await AccessibilityPage(), PortableText);

			expect(text?.props.value).toStrictEqual([{ _key: 'content', _type: 'block' }]);
		});
	});
});
