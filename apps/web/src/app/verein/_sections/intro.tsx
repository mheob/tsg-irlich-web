import { PortableText, type PortableTextValue } from '@/components/ui/portable-text';
import { SectionHeader } from '@/components/ui/section-header';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import type { AboutUs } from '@/types/sanity.types';
import { getImageItems } from '@/utils/image';

interface IntroProps {
	content: NonNullable<AboutUs['content']['introSection']>;
}

export function Intro({ content }: Readonly<IntroProps>) {
	const mainImage = getImageItems([content.images[0]], 1024, 1024)[0];
	const footerImages = getImageItems(content.images.slice(1), 450, 800);

	return (
		<section className="">
			<div className="py-10 md:container md:grid md:grid-cols-2 md:gap-16 md:py-28">
				<div className="relative">
					<ZoomableImage
						alt={mainImage.image.alt}
						className="rounded-2xl object-cover"
						sizes="100vw"
						src={mainImage.src}
						srcFull={mainImage.srcFull}
						fill
						priority
					/>
				</div>

				<div className="md:flex md:flex-col md:justify-between md:gap-10">
					<SectionHeader
						isCenteredOnDesktop={false}
						subTitle={content.subtitle}
						title={content.title}
						isCentered
					>
						<PortableText value={content.intro.text as PortableTextValue} />
					</SectionHeader>

					<div className="relative md:grid md:grid-cols-2 md:gap-8">
						{footerImages.map(({ image, src, srcFull }) => (
							<div className="relative aspect-video rounded-2xl" key={image._key}>
								<ZoomableImage
									alt={image.alt}
									className="aspect-video rounded-2xl object-cover"
									sizes="100vw"
									src={src}
									srcFull={srcFull}
									fill
									priority
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
