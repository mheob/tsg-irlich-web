import type { Metadata } from 'next';

import { urlForImage } from '@/lib/sanity/utils';
import type { AnyImage } from '@/types/image.types';

type OpenGraph = Metadata['openGraph'];
type OGImage = NonNullable<OpenGraph>['images'];

const DEFAULT_OG_IMAGE_SIZE = { height: 630, width: 1200 };

export function getOpenGraphImageOptions(image?: AnyImage, title?: string): OGImage {
	if (!image) {
		return undefined;
	}

	const imageUrl = urlForImage(image, DEFAULT_OG_IMAGE_SIZE.height, DEFAULT_OG_IMAGE_SIZE.width);

	if (!imageUrl) {
		return undefined;
	}

	return {
		alt: image.alt ?? title ?? '',
		height: DEFAULT_OG_IMAGE_SIZE.height,
		url: imageUrl,
		width: DEFAULT_OG_IMAGE_SIZE.width,
	};
}
