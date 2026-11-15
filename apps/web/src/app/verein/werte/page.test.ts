import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import type { client } from '@/lib/sanity/client';

import { itFollowsTheMetadataContract } from '../../../../test-utils/page-contract';
import { PAGE_HERO_IMAGE } from '../../../../test-utils/page-images';
import { findElement } from '../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../test-utils/sanity-client-mock';
import { About } from './_sections/about';
import { Join } from './_sections/join';
import { Values } from './_sections/values';
import ValuesPage, { generateMetadata } from './page';

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

const CONTENT = {
	aboutSection: {
		subtitle: 'Wer wir sind',
		title: 'Turn- und Sportgemeinde Irlich 1882 e.V.',
	},
	joinSection: { links: [], title: 'Werte leben – mach mit!' },
	valuesSection: { tocTitle: 'Inhalt', values: [] },
};

function buildPage(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		content: CONTENT,
		subtitle: 'Unser Leitbild',
		title: 'Unsere Werte',
		...overrides,
	};
}

describe('values page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	describe('metadata', () => {
		// oxlint-disable-next-line vitest/require-hook -- registers `it` cases, not setup code
		itFollowsTheMetadataContract({
			build: (meta) => buildPage({ meta }),
			buildWithHeroImage: (heroImage, meta) => buildPage({ heroImage, meta }),
			fetchMock: mockedFetch,
			generateMetadata,
			missingDocument: null,
			path: '/verein/werte',
			title: 'Unsere Werte',
		});

		it('describes the page with the intro of „Wer wir sind“', async () => {
			mockedFetch.mockResolvedValue(
				buildPage({
					content: {
						...CONTENT,
						aboutSection: {
							...CONTENT.aboutSection,
							intro: 'Die TSG Irlich wurde 1882 gegründet.',
						},
					},
				}),
			);

			await expect(generateMetadata()).resolves.toMatchObject({
				description: 'Die TSG Irlich wurde 1882 gegründet.',
			});
		});
	});

	describe('rendering', () => {
		it('answers 404 without a published page', async () => {
			mockedFetch.mockResolvedValue(null);

			await expect(ValuesPage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('shows the hero image, title and subtitle of the page', async () => {
			mockedFetch.mockResolvedValue(buildPage({ heroImage: PAGE_HERO_IMAGE }));

			const hero = findElement(await ValuesPage(), Hero);

			expect(hero?.props.image?.src).toContain('heroimg111');
			expect(hero?.props).toMatchObject({ subTitle: 'Unser Leitbild', title: 'Unsere Werte' });
		});

		it('renders hero, „Wer wir sind“, the values, the closing call and the newsletter in this order', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const page = (await ValuesPage()) as { props: { children: { type: unknown }[] } };

			expect(page.props.children.map((child) => child.type)).toStrictEqual([
				Hero,
				About,
				Values,
				Join,
				Newsletter,
			]);
		});

		it('hands every section its part of the content', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const page = await ValuesPage();

			expect(findElement(page, About)?.props.section).toBe(CONTENT.aboutSection);
			expect(findElement(page, Values)?.props.section).toBe(CONTENT.valuesSection);
			expect(findElement(page, Join)?.props.section).toBe(CONTENT.joinSection);
		});

		it('leaves out a section the editors have not filled', async () => {
			mockedFetch.mockResolvedValue(buildPage({ content: {} }));

			const page = await ValuesPage();

			expect(findElement(page, Hero)).toBeDefined();
			expect(findElement(page, About)).toBeUndefined();
			expect(findElement(page, Values)).toBeUndefined();
			expect(findElement(page, Join)).toBeUndefined();
			expect(findElement(page, Newsletter)).toBeDefined();
		});
	});
});
