import type { Metadata } from 'next';

import { urlForImage } from '@/lib/sanity/utils';
import type { AnyImage } from '@/types/image.types';

type OpenGraph = Metadata['openGraph'];
type OGImage = NonNullable<OpenGraph>['images'];

export function getOpenGraphImageOptions(image?: AnyImage, title?: string): OGImage {
	if (!image) return;

	return {
		alt: image.alt ?? title ?? '',
		height: 630,
		url: urlForImage(image, 630, 1200) ?? '',
		width: 1200,
	};
}
