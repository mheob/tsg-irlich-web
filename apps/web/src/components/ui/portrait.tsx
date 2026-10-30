import Image from 'next/image';
import type { ComponentProps } from 'react';

import { cn } from '@tsgi-web/shared';

import { urlForImage } from '@/lib/sanity/utils';
import type { SanityImageReference } from '@/types/sanity.types';
import { getInitials } from '@/utils/image';

/**
 * The round portrait of a person, with the initials standing in when there is no image file.
 *
 * @param props - The portrait's props. Every prop the interface does not name goes to the circle.
 * @param props.className - Size, border and font size of the initials. The image fills the circle.
 * @param props.firstName - First name, for the initials.
 * @param props.image - The Sanity image of the person.
 * @param props.lastName - Last name, for the initials.
 * @param props.sizes - The widths the circle takes, as `next/image` expects them.
 * @param props.sourceSize - The largest of those widths in pixels, the crop requested from Sanity.
 * @returns The circle with the image or the initials.
 */
function Portrait({
	className,
	firstName,
	image,
	lastName,
	sizes,
	sourceSize,
	...props
}: Readonly<PortraitProps>) {
	const src = urlForImage(image, sourceSize);

	return (
		<div
			className={cn(
				'relative grid shrink-0 place-items-center overflow-hidden rounded-full',
				className,
			)}
			data-slot="portrait"
			{...props}
		>
			{src && image ? (
				<Image alt={image.alt} sizes={sizes ?? `${sourceSize}px`} src={src} fill />
			) : (
				// The name always stands beside the portrait, so the initials would only repeat it.
				<span
					aria-hidden="true"
					className="grid size-full place-items-center bg-secondary font-bold text-primary"
				>
					{getInitials(firstName, lastName)}
				</span>
			)}
		</div>
	);
}

interface PortraitProps extends Omit<ComponentProps<'div'>, 'children'> {
	firstName: string;
	image?: null | SanityImageReference;
	lastName: string;
	/** The `sizes` of the image. Defaults to `sourceSize` in pixels, for a portrait of one size. */
	sizes?: string;
	/** Edge length in pixels of the square crop requested from Sanity. */
	sourceSize: number;
}

export { Portrait };
