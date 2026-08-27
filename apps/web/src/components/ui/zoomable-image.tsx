import Image from 'next/image';
import type { ComponentProps } from 'react';

import type { GalleryImage } from '@/utils/image';

import { LightboxGallery, LightboxTrigger } from './lightbox';

// A single image that opens in the lightbox.
//
// Use `Gallery` or `LightboxGallery` directly whenever several images belong together and should be
// pageable.
function ZoomableImage({ className, image, ...props }: Readonly<ZoomableImageProps>) {
	const images = [image];

	return (
		<LightboxGallery images={images}>
			<LightboxTrigger index={0}>
				<Image alt={image.alt} className={className} src={image.src} {...props} />
			</LightboxTrigger>
		</LightboxGallery>
	);
}

interface ZoomableImageProps extends Omit<ComponentProps<typeof Image>, 'alt' | 'src'> {
	image: GalleryImage;
}

export { ZoomableImage };
