import type { PortableTextBlock } from 'next-sanity';
import Image from 'next/image';

import { PortableText } from '@/components/ui/portable-text';
import { SectionHeader } from '@/components/ui/section-header';
import { urlForImage } from '@/lib/sanity/utils';
import type { GroupDance, SimpleBlockContent } from '@/types/sanity.types';

import styles from './main.module.css';

function getImageSources(images: GroupDance['images']): [GroupDance['images'], string[]] {
	if (!images || images.length === 0) return [images, []];

	const imageSources: string[] = [];

	for (const image of images) {
		const img = urlForImage(image, 600, 1920);
		if (!img) continue;
		imageSources.push(img);
	}

	return [images, imageSources];
}

interface MainProps {
	description: SimpleBlockContent | string;
	gallery: GroupDance['images'];
	title: string;
}

export function Main({ description, gallery, title }: Readonly<MainProps>) {
	const [images, imageSources] = getImageSources(gallery);
	const imagesCount = images?.length ?? 0;

	return (
		<section className={`${styles.bg} bg-background-low-contrast relative z-0`}>
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader
					className={`${styles.description} mb-10`}
					title={title}
					isCentered
					isCenteredOnDesktop
				>
					{typeof description === 'string' ? (
						description
					) : (
						<PortableText value={description.text as PortableTextBlock[]} />
					)}
				</SectionHeader>

				{images && imagesCount === 1 && (
					<div className="relative aspect-video rounded-xl">
						<Image
							alt={images[0].alt}
							className="aspect-video rounded-xl"
							src={imageSources[0]}
							fill
						/>
					</div>
				)}

				{images && imagesCount === 2 && (
					<div className="my-10 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-10">
						{images.map((image, index) => (
							<div className="relative aspect-video rounded-xl" key={image._key}>
								<Image
									alt={image.alt}
									className="aspect-video rounded-xl"
									src={imageSources[index]}
									fill
								/>
							</div>
						))}
					</div>
				)}

				{images && imagesCount === 3 && (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 md:gap-10">
						<div className="relative col-span-2 row-span-2 aspect-video rounded-xl">
							<Image
								alt={images[0].alt}
								className="col-span-2 row-span-2 aspect-video rounded-xl object-cover"
								src={imageSources[0]}
								fill
							/>
						</div>

						{images.slice(-2).map((image, index) => (
							<div className="relative size-full rounded-xl" key={image._key}>
								<Image
									alt={image.alt}
									className="size-full rounded-xl object-cover"
									src={imageSources[index + 1]}
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
