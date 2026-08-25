import Image from 'next/image';

import { cn } from '@tsgi-web/shared';

import type { GalleryImage } from '@/utils/image';

import { LightboxGallery, LightboxTrigger } from './lightbox';

/** Number of images up to which the bespoke layouts are used instead of a uniform grid. */
const MAX_BESPOKE_LAYOUT_IMAGES = 3;

const SIZES = {
	full: '100vw',
	half: '(min-width: 768px) 50vw, 100vw',
	hero: '(min-width: 1024px) 66vw, 100vw',
	third: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
};

// A single thumbnail of a gallery that opens the lightbox.
function GalleryThumbnail({
	hasRoundedCorners,
	image,
	index,
	isPriority = false,
	sizes,
}: Readonly<GalleryThumbnailProps>) {
	return (
		<LightboxTrigger
			className={cn('overflow-hidden', hasRoundedCorners && 'rounded-xl')}
			index={index}
		>
			<Image
				alt={image.alt}
				className="object-cover transition-transform duration-300 hover:scale-105"
				sizes={sizes}
				src={image.src}
				fill
				priority={isPriority}
			/>
		</LightboxTrigger>
	);
}

// Renders a group of images that share one lightbox.
//
// Up to three images keep the bespoke layouts of the group pages (single hero, side by side, hero
// plus two). Everything above that falls back to a uniform responsive grid.
function Gallery({ className, hasRoundedCorners = true, images, title }: Readonly<GalleryProps>) {
	if (images.length === 0) {
		return null;
	}

	const frameClassName = cn(
		'relative aspect-video overflow-hidden',
		hasRoundedCorners && 'rounded-xl',
	);

	return (
		<LightboxGallery images={images}>
			<div className={className}>
				{title && <h2>{title}</h2>}

				<div className="not-prose">
					{images.length === 1 && (
						<div className={frameClassName}>
							<GalleryThumbnail
								hasRoundedCorners={hasRoundedCorners}
								image={images[0]}
								index={0}
								sizes={SIZES.full}
								isPriority
							/>
						</div>
					)}

					{images.length === 2 && (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-10">
							{images.map((image, index) => (
								<div className={frameClassName} key={image.key}>
									<GalleryThumbnail
										hasRoundedCorners={hasRoundedCorners}
										image={image}
										index={index}
										isPriority={index === 0}
										sizes={SIZES.half}
									/>
								</div>
							))}
						</div>
					)}

					{images.length === MAX_BESPOKE_LAYOUT_IMAGES && (
						<div className="grid grid-cols-1 grid-rows-3 gap-4 sm:grid-cols-2 sm:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2 lg:gap-10">
							<div className={cn(frameClassName, 'sm:col-span-2 sm:row-span-2')}>
								<GalleryThumbnail
									hasRoundedCorners={hasRoundedCorners}
									image={images[0]}
									index={0}
									sizes={SIZES.hero}
									isPriority
								/>
							</div>

							{images.slice(1).map((image, index) => (
								<div className={cn(frameClassName, 'lg:aspect-auto lg:size-full')} key={image.key}>
									<GalleryThumbnail
										hasRoundedCorners={hasRoundedCorners}
										image={image}
										index={index + 1}
										sizes={SIZES.third}
									/>
								</div>
							))}
						</div>
					)}

					{images.length > MAX_BESPOKE_LAYOUT_IMAGES && (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
							{images.map((image, index) => (
								<div className={frameClassName} key={image.key}>
									<GalleryThumbnail
										hasRoundedCorners={hasRoundedCorners}
										image={image}
										index={index}
										isPriority={index === 0}
										sizes={SIZES.third}
									/>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</LightboxGallery>
	);
}

interface GalleryProps {
	className?: string;
	/** Whether the thumbnails are rendered with rounded corners. */
	hasRoundedCorners?: boolean;
	images: GalleryImage[];
	title?: string;
}

interface GalleryThumbnailProps {
	hasRoundedCorners: boolean;
	image: GalleryImage;
	index: number;
	isPriority?: boolean;
	sizes: string;
}

export { Gallery };
