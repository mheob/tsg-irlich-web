import { beforeEach, describe, expect, it, vi } from 'vitest';

import { urlForImage, urlForImageMax } from '@/lib/sanity/utils';
import { getGalleryImages, getInitials } from '@/utils/image';
import type { GalleryImageSource } from '@/utils/image';

// `getGalleryImages` only orchestrates `urlForImage`/`urlForImageMax`; Task 5
// (`src/lib/sanity/utils.test.ts`) already pins their real behavior, so this file mocks both to
// keep the assertions about the orchestration logic independent of the real Sanity image builder.
vi.mock(import('@/lib/sanity/utils'), () => ({
	urlForImage: vi.fn(),
	urlForImageMax: vi.fn(),
}));

const mockedUrlForImage = vi.mocked(urlForImage);
const mockedUrlForImageMax = vi.mocked(urlForImageMax);

const IMAGE_A: GalleryImageSource = {
	_key: 'img-a',
	alt: 'Alt A',
	asset: { _ref: 'image-aaa111-800x600-jpg', _type: 'reference' },
	description: 'Caption A',
};

const IMAGE_B: GalleryImageSource = {
	_key: 'img-b',
	alt: 'Alt B',
	asset: { _ref: 'image-bbb222-800x600-jpg', _type: 'reference' },
};

describe('generating initials from a first and last name', () => {
	it('takes the first letter of each name', () => {
		expect(getInitials('John', 'Doe')).toBe('JD');
	});

	it('upper-cases lower case names', () => {
		expect(getInitials('jane', 'doe')).toBe('JD');
	});

	it('falls back to a question mark for a missing last name', () => {
		expect(getInitials('Jane', '')).toBe('J?');
	});

	it('falls back to a question mark for a missing first name', () => {
		expect(getInitials('', 'Doe')).toBe('?D');
	});

	it('falls back to two question marks when both names are missing', () => {
		expect(getInitials('', '')).toBe('??');
	});

	it('falls back to two question marks when both names are whitespace only', () => {
		expect(getInitials('   ', '   ')).toBe('??');
	});

	it('trims leading whitespace before taking the first letter', () => {
		expect(getInitials('  Max', '')).toBe('M?');
	});

	it('upper-cases a non-ASCII first letter correctly', () => {
		expect(getInitials('örs', '')).toBe('Ö?');
	});
});

describe('building the gallery images a document exposes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns an empty array for undefined images', () => {
		// `images` is a required parameter typed to accept `undefined`, so the argument cannot be
		// omitted without a type error.
		// oxlint-disable-next-line unicorn/no-useless-undefined
		expect(getGalleryImages(undefined)).toStrictEqual([]);
	});

	it('returns an empty array for an empty list', () => {
		expect(getGalleryImages([])).toStrictEqual([]);
	});

	it('builds one entry from a single resolvable image', () => {
		mockedUrlForImage.mockReturnValue('https://cdn.sanity.io/thumb-a.jpg');
		mockedUrlForImageMax.mockReturnValue('https://cdn.sanity.io/full-a.jpg');

		const result = getGalleryImages([IMAGE_A]);

		expect(result).toStrictEqual([
			{
				alt: 'Alt A',
				caption: 'Caption A',
				key: 'img-a',
				src: 'https://cdn.sanity.io/thumb-a.jpg',
				srcFull: 'https://cdn.sanity.io/full-a.jpg',
			},
		]);
	});

	it('drops an image whose thumbnail url cannot be resolved', () => {
		// `mockReturnValue` mirrors `urlForImage`'s own `string | undefined` return type, so the
		// argument cannot be omitted without a type error.
		// oxlint-disable-next-line unicorn/no-useless-undefined
		mockedUrlForImage.mockReturnValue(undefined);
		mockedUrlForImageMax.mockReturnValue('https://cdn.sanity.io/full-a.jpg');

		expect(getGalleryImages([IMAGE_A])).toStrictEqual([]);
	});

	it('drops an image whose full screen url cannot be resolved', () => {
		mockedUrlForImage.mockReturnValue('https://cdn.sanity.io/thumb-a.jpg');
		// oxlint-disable-next-line unicorn/no-useless-undefined
		mockedUrlForImageMax.mockReturnValue(undefined);

		expect(getGalleryImages([IMAGE_A])).toStrictEqual([]);
	});

	it('keeps only the resolvable entries and preserves their order in a mixed list', () => {
		const IMAGE_C: GalleryImageSource = { ...IMAGE_A, _key: 'img-c' };

		// One `mockReturnValueOnce` per call, in call order (A, B, C), instead of branching on the
		// image inside the implementation, keeps the mock free of a conditional.
		mockedUrlForImage
			.mockReturnValueOnce('thumb-img-a')
			// oxlint-disable-next-line unicorn/no-useless-undefined -- mirrors urlForImage's real return type
			.mockReturnValueOnce(undefined)
			.mockReturnValueOnce('thumb-img-c');
		mockedUrlForImageMax
			.mockReturnValueOnce('full-img-a')
			.mockReturnValueOnce('full-img-b')
			.mockReturnValueOnce('full-img-c');

		const result = getGalleryImages([IMAGE_A, IMAGE_B, IMAGE_C]);

		expect(result.map((entry) => entry.key)).toStrictEqual(['img-a', 'img-c']);
	});

	it('forwards the height and width arguments to urlForImage', () => {
		mockedUrlForImage.mockReturnValue('https://cdn.sanity.io/thumb-a.jpg');
		mockedUrlForImageMax.mockReturnValue('https://cdn.sanity.io/full-a.jpg');

		getGalleryImages([IMAGE_A], 700, 1244);

		expect(mockedUrlForImage).toHaveBeenCalledWith(IMAGE_A, 700, 1244);
	});

	it('always calls urlForImageMax with the fixed full screen width', () => {
		mockedUrlForImage.mockReturnValue('https://cdn.sanity.io/thumb-a.jpg');
		mockedUrlForImageMax.mockReturnValue('https://cdn.sanity.io/full-a.jpg');

		getGalleryImages([IMAGE_A], 700, 1244);

		// The literal is asserted on purpose, not the module's private `FULL_IMAGE_WIDTH` constant,
		// so a change to that constant's value is caught here rather than silently agreeing with it.
		expect(mockedUrlForImageMax).toHaveBeenCalledWith(IMAGE_A, 2560);
	});

	it('sets the caption to undefined for an image without a description', () => {
		mockedUrlForImage.mockReturnValue('https://cdn.sanity.io/thumb-b.jpg');
		mockedUrlForImageMax.mockReturnValue('https://cdn.sanity.io/full-b.jpg');

		const [entry] = getGalleryImages([IMAGE_B]);

		expect(entry.caption).toBeUndefined();
	});
});
