import Image from 'next/image';

import { cn } from '@tsgi-web/shared';

import { urlForImage } from '@/lib/sanity/utils';

import type { FallbackImage, Venue } from './types';

/**
 * The source the optimizer scales from: a venue image spans the full width of a phone, which takes
 * about 1,100 px on a sharp screen. The optimizer never scales an image up.
 */
const IMAGE_SIZE = { height: 900, width: 1200 };

/**
 * The picture of a venue: its own image, else the fallback image of the site settings, so a venue
 * whose photo is still missing shows a picture instead of an empty box.
 *
 * @param props - The venue, the fallback image and the layout of the box.
 * @param props.className - Extra classes of the box, such as its aspect ratio.
 * @param props.fallbackImage - The image of the site settings.
 * @param props.sizes - The `sizes` of the image, so the browser picks the right file.
 * @param props.venue - The venue with its image and its title.
 * @returns The image box.
 */
function VenueImage({ className, fallbackImage, sizes, venue }: Readonly<VenueImageProps>) {
	const image = urlForImage(venue.mainImage, IMAGE_SIZE.height, IMAGE_SIZE.width)
		? venue.mainImage
		: fallbackImage;
	const src = urlForImage(image, IMAGE_SIZE.height, IMAGE_SIZE.width);

	return (
		<div className={cn('relative overflow-hidden bg-primary', className)}>
			{src && (
				// An empty alt text counts as missing, as it does for a hero image.
				// oxlint-disable-next-line typescript/prefer-nullish-coalescing
				<Image alt={image?.alt || venue.title} sizes={sizes} src={src} fill />
			)}
		</div>
	);
}

interface VenueImageProps {
	className?: string;
	/** The image of the site settings that stands in when the venue has none with a file. */
	fallbackImage?: FallbackImage;
	sizes: string;
	venue: Pick<Venue, 'mainImage' | 'title'>;
}

export { VenueImage };
