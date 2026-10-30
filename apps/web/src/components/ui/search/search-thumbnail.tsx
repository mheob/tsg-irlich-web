import Image from 'next/image';

import { cn, TSGLogo } from '@tsgi-web/shared';

import type { SearchThumbnail as SearchThumbnailData } from '@/lib/search/types';

/**
 * The image in front of a hit, or the club logo on a plain box when the hit has none. The box has
 * no size of its own, the caller sets it through `className`; the image fills it and is cropped.
 *
 * The image carries no alternative text, the title next to it names the hit.
 *
 * @param props - The thumbnail's props.
 * @param props.className - Size and rounding of the box.
 * @param props.sizes - The widths the box takes, as `next/image` expects them.
 * @param props.thumbnail - The image, already cropped to 16 : 9, or `null` for the logo.
 * @returns The box with the image or the logo.
 */
function SearchThumbnail({ className, sizes, thumbnail }: Readonly<SearchThumbnailProps>) {
	return (
		<div
			className={cn(
				'relative grid shrink-0 place-items-center overflow-hidden bg-background-high-contrast',
				className,
			)}
			data-slot="search-thumbnail"
		>
			{thumbnail ? (
				<Image
					alt=""
					className="object-cover"
					sizes={sizes}
					src={thumbnail.src}
					unoptimized={thumbnail.unoptimized}
					fill
				/>
			) : (
				<TSGLogo aria-hidden="true" className="h-1/2 w-auto opacity-40" />
			)}
		</div>
	);
}

interface SearchThumbnailProps {
	className?: string;
	sizes?: string;
	thumbnail: null | SearchThumbnailData;
}

export { SearchThumbnail };
