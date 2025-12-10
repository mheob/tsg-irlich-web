import { PortableText, type PortableTextValue } from '@/components/ui/portable-text';
import { SectionHeader } from '@/components/ui/section-header';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import type { AboutUs } from '@/types/sanity.types';
import { getImageItems } from '@/utils/image';

interface IntroProps {
	content: NonNullable<AboutUs['content']['introSection']>;
}

export function Intro({ content }: Readonly<IntroProps>) {
	if (!content?.images?.length) {
		return null;
	}

	const mainImage = getImageItems([content.images[0]], 1024, 1024)[0];
	const footerImages = getImageItems(content.images.slice(1), 450, 800);

	return (
		<section>
			<div className="container py-10 lg:grid lg:grid-cols-2 lg:gap-16 lg:py-28">
				<div className="relative hidden lg:block">
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

				<div className="lg:flex lg:flex-col lg:justify-between lg:gap-10">
					<SectionHeader
						className="[&>p]:mt-6"
						isCenteredOnDesktop={false}
						subTitle={content.subtitle}
						title={content.title}
						isCentered
					>
						<PortableText value={content.intro.text as PortableTextValue} />
					</SectionHeader>

					<div className="relative mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8 lg:mt-0">
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
