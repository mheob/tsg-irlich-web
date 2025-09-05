import type { PortableTextBlock } from 'next-sanity';
import Image from 'next/image';

import { PortableText } from '@/components/ui/portable-text';
import { SectionHeader } from '@/components/ui/section-header';
import { urlForImage } from '@/lib/sanity/utils';
import type { GroupDance, SimpleBlockContent } from '@/types/sanity.types';

import styles from './main.module.css';

function getImageItems(
	images: GroupDance['images'],
): Array<{ image: NonNullable<GroupDance['images']>[number]; src: string }> {
	if (!images || images.length === 0) return [];
	const items: Array<{ image: NonNullable<GroupDance['images']>[number]; src: string }> = [];
	for (const image of images) {
		const source = urlForImage(image, 600, 1920);
		if (!source) continue;
		items.push({ image, src: source });
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
				<SectionHeader className="mb-10" title={title} isCentered isCenteredOnDesktop>
					<PortableText value={description.text as PortableTextBlock[]} />
				</SectionHeader>

				{imagesCount === 1 && (
					<div className="relative aspect-video rounded-xl">
						<Image
							alt={items[0].image.alt}
							className="aspect-video rounded-xl"
							sizes="100vw"
							src={items[0].src}
							fill
							priority
						/>
					</div>
				)}

				{imagesCount === 2 && (
					<div className="my-10 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-10">
						{items.map(({ image, src }) => (
							<div className="relative aspect-video rounded-xl" key={image._key}>
								<Image
									alt={image.alt}
									className="aspect-video rounded-xl"
									loading="lazy"
									sizes="(min-width: 768px) 50vw, 100vw"
									src={src}
									fill
								/>
							</div>
						))}
					</div>
				)}

				{imagesCount === 3 && (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 md:gap-10">
						<div className="relative col-span-2 row-span-2 aspect-video rounded-xl">
							<Image
								alt={items[0].image.alt}
								className="col-span-2 row-span-2 aspect-video rounded-xl object-cover"
								loading="lazy"
								sizes="(min-width: 1536px) 66vw, (min-width: 1024px) 66vw, 100vw"
								src={items[0].src}
								fill
							/>
						</div>

						{items.slice(1).map(({ image, src }) => (
							<div className="relative size-full rounded-xl" key={image._key}>
								<Image
									alt={image.alt}
									className="size-full rounded-xl object-cover"
									loading="lazy"
									sizes="(min-width: 1536px) 33vw, (min-width: 1024px) 33vw, 100vw"
									src={src}
									fill
								/>
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
