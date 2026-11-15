import Image from 'next/image';

import { SectionHeader } from '@/components/ui/section-header';
import { urlForImage } from '@/lib/sanity/utils';

import type { AboutSection } from '../_shared/types';

/**
 * The source the optimizer scales from, in the 4:3 of the box. From 64rem up the image takes half
 * the container, about 640 px on the widest screens and so 1,280 px on a sharp one.
 */
const IMAGE_HEIGHT = 1200;
const IMAGE_WIDTH = 1600;

/**
 * „Wer wir sind“: the club in a few sentences next to a picture, with the facts as tiles below.
 * The picture only shows from the desktop on, so a phone starts with the text.
 *
 * @param props - The section.
 * @param props.section - The texts, the image and the facts from the studio.
 * @returns The section.
 */
function About({ section }: Readonly<{ section: AboutSection }>) {
	const { facts, image, intro, subtitle, title } = section;
	const src = urlForImage(image, IMAGE_HEIGHT, IMAGE_WIDTH);

	return (
		<section className="container py-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
			{image && src && (
				<div className="relative hidden aspect-4/3 overflow-hidden rounded-2xl shadow-lg lg:block">
					<Image
						alt={image.alt}
						className="object-cover"
						sizes="(min-width: 64rem) 50vw, 100vw"
						src={src}
						fill
					/>
				</div>
			)}

			<div className={image && src ? undefined : 'lg:col-span-2'}>
				<SectionHeader isCenteredOnDesktop={false} subTitle={subtitle} title={title} isCentered>
					{intro}
				</SectionHeader>

				{facts?.length ? (
					<dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
						{facts.map((fact) => (
							<div
								className="flex flex-col-reverse rounded-xl bg-background-low-contrast p-4 text-center"
								key={fact._key}
							>
								<dt className="text-sm text-muted-foreground">{fact.label}</dt>
								<dd className="font-serif text-3xl text-primary">{fact.value}</dd>
							</div>
						))}
					</dl>
				) : null}
			</div>
		</section>
	);
}

export { About };
