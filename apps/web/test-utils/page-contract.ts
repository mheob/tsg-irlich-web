import type { Metadata } from 'next';
import { expect, it } from 'vitest';
import type { MockedFunction } from 'vitest';

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const CONTRACT_ASSET_REF = 'image-abc123def456-800x600-jpg';

const OPEN_GRAPH_IMAGE = {
	_type: 'image',
	asset: { _ref: CONTRACT_ASSET_REF, _type: 'reference' },
};

interface MetadataContractOptions {
	/** Builds the document the page fetches, with the given `meta` object in place. */
	build: (meta?: Record<string, unknown>) => unknown;
	/** The mocked `client.fetch` the page reads its document through. */
	fetchMock: MockedFunction<(...args: never[]) => unknown>;
	/** The page's `generateMetadata` export. */
	generateMetadata: () => Promise<Metadata>;
	/** What the fetch resolves with when the document does not exist. */
	missingDocument?: unknown;
	/** The canonical path of the page. */
	path: string;
	/** The document title, used when no `metaTitle` is set. */
	title: string;
}

/**
 * Registers the metadata cases every content page shares.
 *
 * All of them read a single document, prefer its `meta` fields over the document title, size the
 * open graph image for social previews, point their canonical URL at themselves and answer an
 * absent document with empty metadata — so the cases are written once and each page test states
 * only how its own document is built.
 *
 * @param options - The page under test and how to build its document.
 * @param options.build - Builds the document the page fetches.
 * @param options.fetchMock - The mocked fetcher the page reads its document through.
 * @param options.generateMetadata - The page's `generateMetadata` export.
 * @param options.missingDocument - What the fetch resolves with when the document is absent.
 * @param options.path - The canonical path of the page.
 * @param options.title - The document title, used when no `metaTitle` is set.
 */
function itFollowsTheMetadataContract({
	build,
	fetchMock,
	generateMetadata,
	missingDocument = null,
	path,
	title,
}: MetadataContractOptions): void {
	it('is empty when the document is missing', async () => {
		fetchMock.mockResolvedValue(missingDocument);

		await expect(generateMetadata()).resolves.toStrictEqual({});
	});

	it('prefers the meta title and description over the document title', async () => {
		fetchMock.mockResolvedValue(
			build({ metaDescription: 'Kurz erklärt', metaTitle: 'Alles auf einen Blick' }),
		);

		await expect(generateMetadata()).resolves.toMatchObject({
			description: 'Kurz erklärt',
			openGraph: { description: 'Kurz erklärt', title: 'Alles auf einen Blick' },
			title: 'Alles auf einen Blick',
		});
	});

	it('falls back to the document title and an empty description', async () => {
		fetchMock.mockResolvedValue(build());

		// The document title itself may name the club and skip the title template, so the open graph
		// title is the one that shows it unchanged.
		await expect(generateMetadata()).resolves.toMatchObject({
			description: '',
			openGraph: { title },
		});
	});

	it('points its canonical URL at the page', async () => {
		fetchMock.mockResolvedValue(build());

		const metadata = await generateMetadata();

		expect(metadata.alternates?.canonical).toBe(path);
		expect(metadata.openGraph).toMatchObject({ siteName: 'TSG Irlich', url: path });
	});

	it('has no open graph image when the document carries none', async () => {
		fetchMock.mockResolvedValue(build());

		const metadata = await generateMetadata();

		expect(metadata.openGraph?.images).toStrictEqual([]);
	});

	it('sizes the open graph image for social previews', async () => {
		fetchMock.mockResolvedValue(build({ openGraphImage: OPEN_GRAPH_IMAGE }));

		const metadata = await generateMetadata();

		expect(metadata.openGraph?.images).toMatchObject({ height: 630, width: 1200 });
	});
}

export { itFollowsTheMetadataContract };
