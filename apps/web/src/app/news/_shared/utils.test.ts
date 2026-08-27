import { describe, expect, it } from 'vitest';

import type * as newsUtilsModule from '@/app/news/_shared/utils';
import type { AnyImage } from '@/types/image.types';

import { loadWithEnv } from '../../../../test-utils/env';

type NewsUtilsModule = typeof newsUtilsModule;

const SANITY_ENV = {
	NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
	NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
};

// The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires; an arbitrary
// string throws when the builder resolves the URL.
const ASSET_REF = 'image-abc123def456-800x600-jpg';

function buildImage(overrides: Partial<AnyImage> = {}): AnyImage {
	// The generated image types carry more optional fields than a fixture needs to name.
	return {
		_type: 'image',
		asset: { _ref: ASSET_REF, _type: 'reference' },
		...overrides,
	} as AnyImage;
}

/**
 * Reads the URL out of the open graph image options.
 *
 * Kept out of the test bodies because the options type is a union of several shapes and the
 * narrowing would be a conditional, which `vitest/no-conditional-in-test` flags.
 *
 * @param options - The options returned by `getOpenGraphImageOptions`.
 * @returns The image URL.
 */
function imageUrlOf(options: unknown): string {
	if (typeof options !== 'object' || options === null || !('url' in options)) {
		throw new TypeError('Expected open graph image options with a URL');
	}
	return String(options.url);
}

async function loadUtils(): Promise<NewsUtilsModule> {
	return loadWithEnv<NewsUtilsModule>('@/app/news/_shared/utils', SANITY_ENV);
}

describe('open graph image options', () => {
	it('has no options without an image', async () => {
		const { getOpenGraphImageOptions } = await loadUtils();

		expect(getOpenGraphImageOptions(undefined, 'Sommerfest')).toBeUndefined();
	});

	it('has no options for an image without an asset', async () => {
		const { getOpenGraphImageOptions } = await loadUtils();

		expect(getOpenGraphImageOptions(buildImage({ asset: undefined }))).toBeUndefined();
	});

	it('requests the image in the open graph format', async () => {
		const { getOpenGraphImageOptions } = await loadUtils();

		const options = getOpenGraphImageOptions(buildImage(), 'Sommerfest');

		expect(options).toMatchObject({ height: 630, width: 1200 });
	});

	it('crops the image to those dimensions', async () => {
		const { getOpenGraphImageOptions } = await loadUtils();

		const options = getOpenGraphImageOptions(buildImage(), 'Sommerfest');
		const url = imageUrlOf(options);

		expect(url).toContain('w=1200');
		expect(url).toContain('h=630');
		expect(url).toContain('fit=crop');
	});

	it('prefers the alt text of the image', async () => {
		const { getOpenGraphImageOptions } = await loadUtils();

		const options = getOpenGraphImageOptions(
			buildImage({ alt: 'Das Sommerfest 2026' }),
			'Sommerfest',
		);

		expect(options).toMatchObject({ alt: 'Das Sommerfest 2026' });
	});

	it('falls back to the title when the image has no alt text', async () => {
		const { getOpenGraphImageOptions } = await loadUtils();

		expect(getOpenGraphImageOptions(buildImage(), 'Sommerfest')).toMatchObject({
			alt: 'Sommerfest',
		});
	});

	it('falls back to an empty alt text when neither is given', async () => {
		const { getOpenGraphImageOptions } = await loadUtils();

		expect(getOpenGraphImageOptions(buildImage())).toMatchObject({ alt: '' });
	});
});
