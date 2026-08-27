import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PrivacyPage, { generateMetadata } from '@/app/(legal)/datenschutz/page';
import { Hero } from '@/components/section/hero';
import { PortableText } from '@/components/ui/portable-text';
import type { client } from '@/lib/sanity/client';

import { itFollowsTheMetadataContract } from '../../../../test-utils/page-contract';
import { findElements } from '../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../test-utils/sanity-client-mock';
// The real client validates `NEXT_PUBLIC_SANITY_*` at import time and would talk to the content
// lake; `config()` is what `@sanity/image-url` reads to build the open graph image URL.
vi.mock(import('@/lib/sanity/client'), () => ({
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
		fetch: vi.fn(),
	} as unknown as typeof client,
}));

// `notFound()` throws a Next-internal error the framework catches; the mock makes "the page gave
// up" assertable without depending on that internal.
vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

const mockedFetch = clientFetchMock();

function buildPage(meta?: Record<string, unknown>): Record<string, unknown> {
	return {
		content: { text: [{ _key: 'content', _type: 'block' }] },
		introText: { text: [{ _key: 'intro', _type: 'block' }] },
		meta,
		subtitle: 'Wie wir mit deinen Daten umgehen',
		title: 'Datenschutz',
	};
}

describe('privacy page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		// oxlint-disable-next-line vitest/require-hook -- registers `it` cases, not setup code
		itFollowsTheMetadataContract({
			build: buildPage,
			fetchMock: mockedFetch,
			generateMetadata,
			title: 'Datenschutz',
		});
	});

	describe('rendering', () => {
		it('gives up when the document is missing', async () => {
			mockedFetch.mockResolvedValue(null);

			await expect(PrivacyPage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('heads the page with its title and subtitle', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const page = await PrivacyPage();
			const [hero] = findElements(page, Hero);

			expect(hero.props).toMatchObject({
				subTitle: 'Wie wir mit deinen Daten umgehen',
				title: 'Datenschutz',
			});
		});

		it('renders the introduction beside the privacy statement', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const texts = findElements(await PrivacyPage(), PortableText);

			expect(texts.map((text) => text.props.value)).toStrictEqual([
				[{ _key: 'intro', _type: 'block' }],
				[{ _key: 'content', _type: 'block' }],
			]);
		});
	});
});
