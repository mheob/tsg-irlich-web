import { PortableText, type PortableTextValue } from '@/components/ui/portable-text';
import { SectionHeader } from '@/components/ui/section-header';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import { urlForImage } from '@/lib/sanity/utils';
import type { GroupDance, SimpleBlockContent } from '@/types/sanity.types';

import styles from './main.module.css';

interface ImageItem {
	image: NonNullable<GroupDance['images']>[number];
	src: string;
	srcFull: string;
}

function getImageItems(images: GroupDance['images']): Array<ImageItem> {
	if (!images || images.length === 0) return [];
	const items = [];
	for (const image of images) {
		const source = urlForImage(image, 700, 1244);
		const sourceFull = urlForImage(image, 1440, 2560);
		if (!source || !sourceFull) continue;
		items.push({ image, src: source, srcFull: sourceFull });
	}
	return items;
}

interface MainProps {
	description: SimpleBlockContent;
	gallery: GroupDance['images'];
	title: string;
}

export function Main({ description, gallery, title }: Readonly<MainProps>) {
	const items = getImageItems(gallery);
	const imagesCount = items.length;

	return (
		<section className={`${styles.bg} relative z-0`}>
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader className="mb-10" level="h1" title={title} isCentered isCenteredOnDesktop>
					<PortableText value={description.text as PortableTextValue} />
				</SectionHeader>

				{imagesCount === 1 && (
					<div className="relative aspect-video rounded-xl">
						<ZoomableImage
							alt={items[0].image.alt}
							className="aspect-video rounded-xl"
							sizes="100vw"
							src={items[0].src}
							srcFull={items[0].srcFull}
							priority
						/>
					</div>
				)}

				{imagesCount === 2 && (
					<div className="my-10 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-10">
						{items.map(({ image, src, srcFull }) => (
							<div className="relative aspect-video rounded-xl" key={image._key}>
								<ZoomableImage
									alt={image.alt}
									className="aspect-video rounded-xl"
									sizes="(min-width: 768px) 50vw, 100vw"
									src={src}
									srcFull={srcFull}
									fill
									priority
								/>
							</div>
						))}
					</div>
				)}

				{imagesCount === 3 && (
					<div className="grid grid-cols-1 grid-rows-3 gap-4 sm:grid-cols-2 sm:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2 lg:gap-10">
						<div className="relative aspect-video rounded-xl sm:col-span-2 sm:row-span-2">
							<ZoomableImage
								alt={items[0].image.alt}
								className="rounded-xl object-cover"
								src={items[0].src}
								srcFull={items[0].srcFull}
								fill
								priority
							/>
						</div>

						{items.slice(1).map(({ image, src, srcFull }) => (
							<div
								className="relative aspect-video rounded-xl lg:aspect-auto lg:size-full"
								key={image._key}
							>
								<ZoomableImage
									alt={image.alt}
									className="rounded-xl object-cover"
									src={src}
									srcFull={srcFull}
									fill
									priority
								/>
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
