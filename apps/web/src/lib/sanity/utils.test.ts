import { describe, expect, it } from 'vitest';

import type * as utilsModule from '@/lib/sanity/utils';
import type { SanityFileAsset, SanityImage } from '@/types/sanity.types';

import { loadWithEnv } from '../../../test-utils/env';

type UtilsModule = typeof utilsModule;

const SANITY_ENV = {
	NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
	NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
};

// A valid `image-<id>-<width>x<height>-<format>` reference, the shape `parseAssetId` in
// `@sanity/image-url` requires — an arbitrary string throws when the builder resolves the URL.
const ASSET_REF = 'image-abc123def456-800x600-jpg';

function buildImage(): SanityImage {
	return {
		_type: 'image',
		asset: { _ref: ASSET_REF, _type: 'reference' },
	};
}

/**
 * Narrows a possibly-undefined URL to a string, failing the test with a clear message otherwise.
 *
 * Avoids both a `!` assertion (forbidden by `typescript/no-non-null-assertion`) and an `as string`
 * cast (flagged by `typescript/non-nullable-type-assertion-style`, which then wants the `!` that
 * is forbidden) when constructing a `URL` from `urlForImage`/`urlForImageMax`'s return value.
 *
 * @param url - The value to narrow.
 * @returns The same value, typed as a definite `string`.
 */
function assertUrlDefined(url: string | undefined): string {
	if (url === undefined) {
		throw new Error('Expected a url, got undefined.');
	}
	return url;
}

describe('building a download link for a file asset', () => {
	it('falls back to a placeholder when the asset is undefined', async () => {
		const { getDownloadFileUrl } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		expect(getDownloadFileUrl()).toBe('#!');
	});

	it('falls back to a placeholder when the asset is null', async () => {
		const { getDownloadFileUrl } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		expect(getDownloadFileUrl(null)).toBe('#!');
	});

	it('falls back to a placeholder when the original filename is missing', async () => {
		const { getDownloadFileUrl } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		const asset = { url: 'https://cdn.sanity.io/files/x/y/z.pdf' } as SanityFileAsset;

		expect(getDownloadFileUrl(asset)).toBe('#!');
	});

	it('falls back to a placeholder when the url is missing', async () => {
		const { getDownloadFileUrl } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		const asset = { originalFilename: 'broschuere.pdf' } as SanityFileAsset;

		expect(getDownloadFileUrl(asset)).toBe('#!');
	});

	it('appends the original filename as a download parameter for a complete asset', async () => {
		const { getDownloadFileUrl } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		const asset = {
			originalFilename: 'Broschüre.pdf',
			url: 'https://cdn.sanity.io/files/test-project/test-dataset/abc123.pdf',
		} as SanityFileAsset;

		expect(getDownloadFileUrl(asset)).toBe(
			'https://cdn.sanity.io/files/test-project/test-dataset/abc123.pdf?dl=Broschüre.pdf',
		);
	});
});

describe('converting a byte count to a human readable size', () => {
	it('shows a dash for an undefined size', async () => {
		const { getFileSize } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		expect(getFileSize()).toBe('—');
	});

	it('shows a dash for a zero size', async () => {
		const { getFileSize } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		expect(getFileSize(0)).toBe('—');
	});

	it('shows a dash for a negative size', async () => {
		const { getFileSize } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		expect(getFileSize(-5)).toBe('—');
	});

	it('reports whole bytes without a decimal', async () => {
		const { getFileSize } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		// index stays 0 (the "B" unit), and `toFixed(0)` drops the decimal point entirely.
		expect(getFileSize(512)).toBe('512 B');
	});

	it('reports kilobytes with one decimal', async () => {
		const { getFileSize } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		// 1024 crosses into the "KB" unit once (index 1), so `toFixed(1)` keeps one decimal.
		expect(getFileSize(1024)).toBe('1.0 KB');
	});

	it('reports megabytes with two decimals', async () => {
		const { getFileSize } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		// 1,572,864 = 1.5 * 1024 * 1024 crosses into "MB" (index 2), so `toFixed(2)` keeps two decimals.
		expect(getFileSize(1_572_864)).toBe('1.50 MB');
	});

	it('reports gigabytes with three decimals', async () => {
		const { getFileSize } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		// 2 * 1024^3 crosses into "GB" (index 3), so `toFixed(3)` keeps three decimals.
		expect(getFileSize(2 * 1024 ** 3)).toBe('2.000 GB');
	});

	it('caps at the gigabyte unit for a value far beyond it', async () => {
		const { getFileSize } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		// The loop stops once index reaches the last unit (GB, index 3), so a value equivalent to
		// 3 TB is reported as an oversized "GB" figure rather than continuing to a "TB" unit that
		// does not exist in the implementation's `units` array.
		expect(getFileSize(3 * 1024 ** 4)).toBe('3072.000 GB');
	});
});

describe('generating a sanity image url', () => {
	it('returns undefined for an undefined image', async () => {
		const { urlForImage } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		// `image` is a required parameter typed to accept `undefined`, so the argument cannot be
		// omitted without a type error.
		// oxlint-disable-next-line unicorn/no-useless-undefined
		expect(urlForImage(undefined)).toBeUndefined();
	});

	it('returns undefined when the asset reference is missing', async () => {
		const { urlForImage } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		expect(urlForImage({ _type: 'image' })).toBeUndefined();
	});

	it('builds a cropped square url from a height only', async () => {
		const { urlForImage } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		const url = urlForImage(buildImage(), 300);

		const params = new URL(assertUrlDefined(url)).searchParams;
		expect(params.get('w')).toBe('300');
		expect(params.get('h')).toBe('300');
		expect(params.get('fit')).toBe('crop');
		expect(params.get('q')).toBe('90');
	});

	it('builds on the fixed test project and dataset from loadWithEnv', async () => {
		const { urlForImage } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		const url = urlForImage(buildImage(), 300);

		expect(new URL(assertUrlDefined(url)).pathname).toContain('/images/test-project/test-dataset/');
	});

	it('builds a cropped url from an explicit width and height', async () => {
		const { urlForImage } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		const url = urlForImage(buildImage(), 300, 400);

		const params = new URL(assertUrlDefined(url)).searchParams;
		expect(params.get('w')).toBe('400');
		expect(params.get('h')).toBe('300');
		expect(params.get('fit')).toBe('crop');
	});

	it('builds an uncropped url when neither dimension is given', async () => {
		const { urlForImage } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		const url = urlForImage(buildImage());

		const params = new URL(assertUrlDefined(url)).searchParams;
		expect(params.get('fit')).toBe('max');
		expect(params.get('q')).toBe('90');
		expect(params.has('w')).toBe(false);
		expect(params.has('h')).toBe(false);
	});
});

describe('generating a scaled down sanity image url', () => {
	it('returns undefined when the asset reference is missing', async () => {
		const { urlForImageMax } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		expect(urlForImageMax({ _type: 'image' }, 2560)).toBeUndefined();
	});

	it('builds an uncropped url capped at the given width', async () => {
		const { urlForImageMax } = await loadWithEnv<UtilsModule>('@/lib/sanity/utils', SANITY_ENV);

		const url = urlForImageMax(buildImage(), 2560);

		const params = new URL(assertUrlDefined(url)).searchParams;
		expect(params.get('w')).toBe('2560');
		expect(params.get('fit')).toBe('max');
		expect(params.has('h')).toBe(false);
	});
});
