import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import VereinPage, { generateMetadata } from '@/app/verein/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Stats } from '@/components/section/stats';
import { Vision } from '@/components/section/vision';
import type { client } from '@/lib/sanity/client';
import type { AboutUsPageQueryResult } from '@/types/sanity.types.generated';

import { findElement } from '../../../test-utils/react-tree';
import { clientFetchMock } from '../../../test-utils/sanity-client-mock';
import { Chronicle } from './_sections/chronicle';
// The real client validates `NEXT_PUBLIC_SANITY_*` at import time and would talk to the content
// lake. `config()` is what `@sanity/image-url` reads to build an image URL for the open graph
// image, so the fake answers it with the same shape the real client would.
vi.mock(import('@/lib/sanity/client'), () => ({
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
		fetch: vi.fn(),
	} as unknown as typeof client,
}));

// `notFound()` throws a Next-internal error the framework catches; the mock turns "the page gave
// up" into an assertable call without depending on that internal.
vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

const mockedFetch = clientFetchMock();
const mockedNotFound = vi.mocked(notFound);

const ASSET_REF = 'image-abc123def456-800x600-jpg';

function buildPage(overrides: Record<string, unknown> = {}): AboutUsPageQueryResult {
	// The generated result type describes the full document; a fixture only names what the page
	// itself reads, and every section receives its slice as an opaque prop.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return {
		_type: 'aboutUs',
		content: {
			chronicleSection: { title: 'Chronik' },
			contactPersonsSection: { contactPersons: [] },
			introSection: { title: 'Wer wir sind' },
			stats: [{ label: 'Mitglieder', value: 1200 }],
			visionSection: { title: 'Vision' },
		},
		subtitle: 'Der Verein',
		title: 'Über uns',
		...overrides,
	} as unknown as AboutUsPageQueryResult;
}

describe('about us page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
		mockedNotFound.mockClear();
	});

	describe('metadata', () => {
		it('is empty when the document is missing', async () => {
			mockedFetch.mockResolvedValue(null);

			await expect(generateMetadata()).resolves.toStrictEqual({});
		});

		it('prefers the meta title and description over the page title', async () => {
			mockedFetch.mockResolvedValue(
				buildPage({
					meta: { metaDescription: 'Alles über uns', metaTitle: 'TSG Irlich · Verein' },
				}),
			);

			await expect(generateMetadata()).resolves.toMatchObject({
				description: 'Alles über uns',
				openGraph: { description: 'Alles über uns', title: 'TSG Irlich · Verein' },
				title: 'TSG Irlich · Verein',
			});
		});

		it('falls back to the page title and an empty description', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			await expect(generateMetadata()).resolves.toMatchObject({
				description: '',
				title: 'Über uns',
			});
		});

		it('has no open graph image when the document carries none', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const metadata = await generateMetadata();

			expect(metadata.openGraph?.images).toStrictEqual([]);
		});

		it('sizes the open graph image for social previews', async () => {
			mockedFetch.mockResolvedValue(
				buildPage({
					meta: {
						openGraphImage: { _type: 'image', asset: { _ref: ASSET_REF, _type: 'reference' } },
					},
				}),
			);

			const metadata = await generateMetadata();

			expect(metadata.openGraph?.images).toMatchObject({ height: 630, width: 1200 });
		});
	});

	describe('rendering', () => {
		it('gives up when the document is missing', async () => {
			mockedFetch.mockResolvedValue(null);

			await expect(VereinPage()).rejects.toThrow('NEXT_NOT_FOUND');
			expect(mockedNotFound).toHaveBeenCalledWith();
		});

		it('gives up when the document has no intro section', async () => {
			mockedFetch.mockResolvedValue(buildPage({ content: { introSection: null } }));

			await expect(VereinPage()).rejects.toThrow('NEXT_NOT_FOUND');
		});

		it('heads the page with its title and subtitle', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const hero = findElement(await VereinPage(), Hero);

			expect(hero?.props).toMatchObject({ subTitle: 'Der Verein', title: 'Über uns' });
		});

		it('hands every section the slice of the document it renders', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const page = await VereinPage();

			expect(findElement(page, Chronicle)?.props.content).toMatchObject({ title: 'Chronik' });
			expect(findElement(page, Stats)?.props.stats).toMatchObject([{ label: 'Mitglieder' }]);
			expect(findElement(page, ContactPersons)).toBeDefined();
		});

		it('tells the vision section which document it belongs to', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const vision = findElement(await VereinPage(), Vision);

			expect(vision?.props).toMatchObject({ _type: 'aboutUs', title: 'Vision' });
		});

		it('puts the stats section on a contrasting background', async () => {
			mockedFetch.mockResolvedValue(buildPage());

			const stats = findElement(await VereinPage(), Stats);

			expect(stats?.props.withBackground).toBe(true);
		});
	});
});
