import type { PreviewValue } from 'sanity';
import { describe, expect, it } from 'vitest';

import gallery from './gallery';

interface GallerySelection {
	readonly imageCount?: number;
	readonly media?: PreviewValue['media'];
	readonly title?: string;
}

function prepareGallery(selection: GallerySelection): PreviewValue {
	return (gallery.preview.prepare as unknown as (value: GallerySelection) => PreviewValue)(
		selection,
	);
}

describe('gallery preview', () => {
	it('assembles the plural subtitle and passes the title and media through', () => {
		const media = 'media-asset-abc';

		const result = prepareGallery({ imageCount: 3, media, title: 'Sommerfest' });

		expect(result).toStrictEqual({ media, subtitle: '3 Bilder', title: 'Sommerfest' });
	});

	it('uses the singular subtitle for exactly one image', () => {
		const result = prepareGallery({ imageCount: 1, title: 'Sommerfest' });

		expect(result.subtitle).toBe('1 Bild');
	});

	it('uses the plural subtitle for zero images', () => {
		const result = prepareGallery({ imageCount: 0, title: 'Sommerfest' });

		expect(result.subtitle).toBe('0 Bilder');
	});

	it('falls back to a zero count in the subtitle when the image count is missing', () => {
		const result = prepareGallery({ title: 'Sommerfest' });

		expect(result.subtitle).toBe('0 Bilder');
	});

	it('falls back to the default title when no title is set', () => {
		const result = prepareGallery({ imageCount: 2 });

		expect(result).toStrictEqual({
			media: undefined,
			subtitle: '2 Bilder',
			title: 'Bildergalerie',
		});
	});

	it('passes the selected media through unchanged', () => {
		const media = 'media-asset-xyz';

		const result = prepareGallery({ imageCount: 4, media, title: 'Winterfest' });

		expect(result.media).toBe(media);
	});
});
