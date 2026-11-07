import Image from 'next/image';
import Link from 'next/link';

import { DOSBIcon } from '@tsgi-web/shared';

import { ArrowElement } from '@/components/ui/arrow-button';
import { urlForImage } from '@/lib/sanity/utils';
import type { AnyImage } from '@/types/sanity.types';

const getFirstLetter = (title: string) => title.charAt(0).toUpperCase();

/**
 * The source the optimizer scales from: a card spans the full width of a phone, which takes about
 * 1,100 px on a sharp screen. The optimizer never scales an image up, so a smaller source caps every
 * width the browser picks.
 */
const IMAGE_SIZE = { height: 675, width: 1200 };

/** One column, two from `md`, three from `xl`, as the grids of the offer pages lay the cards out. */
const IMAGE_SIZES = '(min-width: 80rem) 33vw, (min-width: 48rem) 50vw, 100vw';

interface GroupCardProps {
	/** The image of the site settings that stands in when the card has none with a file. */
	fallbackImage?: AnyImage | null;
	href: string;
	icon?: string | null;
	image?: AnyImage | null;
	overviewTitle?: string | null;
	title?: string | null;
}

export function GroupCard({
	fallbackImage,
	href,
	icon,
	image,
	overviewTitle,
	title,
}: Readonly<GroupCardProps>) {
	// Sanity may return a group without a title, which cannot be rendered as a card
	if (!title) {
		return null;
	}

	const src =
		urlForImage(image, IMAGE_SIZE.height, IMAGE_SIZE.width) ??
		urlForImage(fallbackImage, IMAGE_SIZE.height, IMAGE_SIZE.width);

	return (
		<article className="relative aspect-video shadow-lg transition-transform duration-200 hover:scale-105">
			<div className="absolute inset-0 z-[-1] rounded-xl bg-black/50" />
			{src && (
				<Image
					alt={title}
					className="absolute inset-0 z-[-2] rounded-xl"
					sizes={IMAGE_SIZES}
					src={src}
					fill
				/>
			)}

			<Link aria-label={`Mehr über "${title}" erfahren`} href={href}>
				<div className="flex h-full flex-row items-end justify-between p-6">
					<div className="flex flex-col justify-end">
						<div className="grid size-12 place-content-center rounded-full bg-secondary text-5xl text-primary md:size-14">
							<DOSBIcon
								className="size-8 w-auto text-current md:size-10"
								icon={icon ?? getFirstLetter(title)}
							/>
						</div>

						<h3 className="mt-6 line-clamp-1 font-serif text-3xl text-primary-foreground uppercase">
							{overviewTitle ?? title}
						</h3>
					</div>

					<ArrowElement
						aria-hidden="true"
						className="self-end hover:bg-secondary"
						direction="up-right"
						size="size-6 md:size-8"
						variant="secondary"
					/>
				</div>
			</Link>
		</article>
	);
}
