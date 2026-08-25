import Image from 'next/image';

import { LightboxGallery, LightboxTrigger } from '@/components/ui/lightbox';
import { PortableText } from '@/components/ui/portable-text';
import { SectionHeader } from '@/components/ui/section-header';
import type { AboutUs } from '@/types/sanity.types';
import { getGalleryImages } from '@/utils/image';

const MAIN_IMAGE_SIZE = { height: 1024, width: 1024 };
const FOOTER_IMAGE_SIZE = { height: 450, width: 800 };

function Intro({ content }: Readonly<IntroProps>) {
	if (!content?.images?.length) {
		return null;
	}

	const [mainImage] = getGalleryImages(
		content.images.slice(0, 1),
		MAIN_IMAGE_SIZE.height,
		MAIN_IMAGE_SIZE.width,
	);
	const footerImages = getGalleryImages(
		content.images.slice(1),
		FOOTER_IMAGE_SIZE.height,
		FOOTER_IMAGE_SIZE.width,
	);

	if (!mainImage) {
		return null;
	}

	// oxlint-disable-next-line react_perf/jsx-no-new-array-as-prop
	const images = [mainImage, ...footerImages];

	return (
		<section>
			<LightboxGallery images={images}>
				<div className="container py-10 lg:grid lg:grid-cols-2 lg:gap-16 lg:py-28">
					<div className="relative hidden lg:block">
						<LightboxTrigger className="overflow-hidden rounded-2xl" index={0}>
							<Image
								alt={mainImage.alt}
								className="object-cover"
								sizes="(min-width: 1024px) 50vw, 100vw"
								src={mainImage.src}
								fill
								priority
							/>
						</LightboxTrigger>
					</div>

					<div className="lg:flex lg:flex-col lg:justify-between lg:gap-10">
						<SectionHeader
							className="[&>p]:mt-6"
							isCenteredOnDesktop={false}
							subTitle={content.subtitle}
							title={content.title}
							isCentered
						>
							<PortableText value={content.intro.text} />
						</SectionHeader>

						<div className="relative mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8 lg:mt-0">
							{footerImages.map((image, index) => (
								<div className="relative aspect-video rounded-2xl" key={image.key}>
									<LightboxTrigger className="overflow-hidden rounded-2xl" index={index + 1}>
										<Image
											alt={image.alt}
											className="object-cover"
											sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
											src={image.src}
											fill
										/>
									</LightboxTrigger>
								</div>
							))}
						</div>
					</div>
				</div>
			</LightboxGallery>
		</section>
	);
}

interface IntroProps {
	content: NonNullable<AboutUs['content']['introSection']>;
}

export { Intro };
