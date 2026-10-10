import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import EchoIssuePage, {
	generateMetadata,
	generateStaticParams,
} from '@/app/verein/echo/[slug]/page';
import { Hero } from '@/components/section/hero';
import { ButtonLink } from '@/components/ui/button';
import { FlipbookLazy } from '@/components/with-logic/flipbook/flipbook-lazy';
import type { client } from '@/lib/sanity/client';
import type { EchoIssueQueryResult } from '@/types/sanity.types';

import { findElement, findElements } from '../../../../../test-utils/react-tree';
import { clientFetchMock } from '../../../../../test-utils/sanity-client-mock';
import type { EchoPageImage } from '../_shared/utils';

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

/**
 * A rendered page image.
 *
 * @param hash - The asset hash, which also serves as the key.
 * @returns The page image.
 */
function page(hash: string): EchoPageImage {
	return {
		_key: hash,
		_type: 'image',
		asset: { _ref: `image-${hash}-1414x2000-jpg`, _type: 'reference' },
	};
}

/**
 * A finished issue with three pages.
 *
 * @param overrides - Fields to replace.
 * @returns The issue as the query returns it.
 */
function buildIssue(overrides: Partial<EchoIssue> = {}): EchoIssue {
	return {
		_id: 'echo-2025',
		cover: page('a'),
		indexable: true,
		intro: 'Ein Rückblick auf das Vereinsjahr.',
		meta: null,
		pageSize: { height: 2000, width: 1414 },
		pages: [page('a'), page('b'), page('c')],
		pdf: {
			originalFilename: 'tsg-echo-2025.pdf',
			size: 1_048_576,
			url: 'https://cdn.sanity.io/x.pdf',
		},
		releaseDate: '2025-04-01',
		slug: 'tsg-echo-2025',
		title: 'TSG ECHO 2025',
		...overrides,
	};
}

/**
 * The props Next.js hands the issue page.
 *
 * @param slug - The slug segment of the request.
 * @returns The page props.
 */
function props(slug = 'tsg-echo-2025'): PageProps<'/verein/echo/[slug]'> {
	return { params: Promise.resolve({ slug }), searchParams: Promise.resolve({}) };
}

type EchoIssue = NonNullable<EchoIssueQueryResult>;

describe('a tsg-echo issue page', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	it('pre-renders every finished issue', async () => {
		mockedFetch.mockResolvedValue(['tsg-echo-2025', 'tsg-echo-2024']);

		await expect(generateStaticParams()).resolves.toStrictEqual([
			{ slug: 'tsg-echo-2025' },
			{ slug: 'tsg-echo-2024' },
		]);
	});

	// Review focus 2: unfinished, unpublished or renamed issues are not found by the query.
	it('answers an unknown or unfinished issue with 404', async () => {
		mockedFetch.mockResolvedValue(null);

		await expect(EchoIssuePage(props())).rejects.toThrow('NEXT_NOT_FOUND');
	});

	it('heads the page with the title and the year', async () => {
		mockedFetch.mockResolvedValue(buildIssue());

		const hero = findElement(await EchoIssuePage(props()), Hero);

		expect(hero?.props).toMatchObject({ subTitle: '2025', title: 'TSG ECHO 2025' });
	});

	it('hands the flipbook every page, its cover and its name', async () => {
		mockedFetch.mockResolvedValue(buildIssue());

		const book = findElement(await EchoIssuePage(props()), FlipbookLazy);

		expect(book?.props).toMatchObject({
			cover: { alt: 'Titelseite von TSG ECHO 2025' },
			label: 'TSG ECHO 2025 zum Durchblättern',
			pageHeight: 2000,
			pageWidth: 1414,
		});
		expect(book?.props.pages.map((entry) => entry.alt)).toStrictEqual([
			'Seite 1 von 3',
			'Seite 2 von 3',
			'Seite 3 von 3',
		]);
	});

	it('offers the PDF with its size', async () => {
		mockedFetch.mockResolvedValue(buildIssue());

		const button = findElement(await EchoIssuePage(props()), ButtonLink);

		expect(button?.props).toMatchObject({
			href: 'https://cdn.sanity.io/x.pdf?dl=tsg-echo-2025.pdf',
		});
		expect(button?.props.children).toStrictEqual(['PDF herunterladen (', '1.00 MB', ')']);
	});

	// Review focus 5.
	it('still renders without page size, PDF and intro', async () => {
		mockedFetch.mockResolvedValue(buildIssue({ intro: null, pageSize: null, pdf: null }));

		const result = await EchoIssuePage(props());

		expect(findElement(result, FlipbookLazy)?.props).toMatchObject({
			pageHeight: 2000,
			pageWidth: 1414,
		});
		expect(findElement(result, ButtonLink)).toBeUndefined();
		expect(findElements<ComponentProps<'p'>>(result, 'p')).toHaveLength(0);
	});

	describe('an issue search engines must not find', () => {
		it('serves its pages and its pdf through the archive path', async () => {
			mockedFetch.mockResolvedValue(
				buildIssue({
					indexable: false,
					pdf: {
						originalFilename: 'tsg-echo-1984-1.pdf',
						size: 1_048_576,
						url: 'https://cdn.sanity.io/files/p/d/abc.pdf',
					},
				}),
			);

			const result = await EchoIssuePage(props());

			expect(findElement(result, FlipbookLazy)?.props.pages[0]?.src).toMatch(/^\/echo-archiv\//u);
			expect(findElement(result, ButtonLink)?.props.href).toMatch(/^\/echo-archiv\/files\//u);
		});

		it('keeps search engines and the cover image out of its metadata', async () => {
			mockedFetch.mockResolvedValue(buildIssue({ indexable: false }));

			const metadata = await generateMetadata(props());

			expect(metadata.robots).toStrictEqual({ follow: false, index: false });
			expect(metadata.openGraph?.images).toStrictEqual([]);
		});
	});

	// Review focus 1.
	it('leaves a findable issue to search engines', async () => {
		mockedFetch.mockResolvedValue(buildIssue({ indexable: true }));

		const metadata = await generateMetadata(props());

		expect(metadata.robots).toBeUndefined();
	});

	describe('metadata', () => {
		it('is empty for an unknown issue', async () => {
			mockedFetch.mockResolvedValue(null);

			await expect(generateMetadata(props())).resolves.toStrictEqual({});
		});

		it('describes the issue by its intro, shows its cover and points at its page', async () => {
			mockedFetch.mockResolvedValue(buildIssue());

			const metadata = await generateMetadata(props());

			expect(metadata).toMatchObject({
				description: 'Ein Rückblick auf das Vereinsjahr.',
				title: 'TSG ECHO 2025',
			});
			expect(metadata.alternates?.canonical).toBe('/verein/echo/tsg-echo-2025');
			expect(metadata.openGraph?.images).toMatchObject({ height: 630, width: 1200 });
		});
	});
});
