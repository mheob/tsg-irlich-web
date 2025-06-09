import { cn } from '@tsgi-web/shared';
import Image, { type StaticImageData } from 'next/image';
import type { ComponentPropsWithoutRef } from 'react';

import { SectionHeader } from '../ui/section-header';
import Breadcrumb from '../with-logic/breadcrumb';

interface HeroProps extends ComponentPropsWithoutRef<'section'> {
	image?: { alt: string; src: StaticImageData | string };
	subTitle?: string;
	title: string;
}

export function Hero({ children, image, subTitle, title, ...props }: Readonly<HeroProps>) {
	return (
		<section
			className={cn(
				'relative -mt-40 h-[360px] md:h-[600px]',
				'from-primary/70 to-primary/30 bg-linear-to-r text-white',
			)}
			{...props}
		>
			{image?.alt && image.src && (
				<Image
					alt={image.alt}
					className="absolute inset-0 -z-10 object-cover"
					src={image.src}
					fill
				/>
			)}

			<div className="flex h-full flex-col items-center justify-center pt-40">
				<SectionHeader subTitle={subTitle} title={title} isCentered isCenteredOnDesktop>
					{children}
				</SectionHeader>

				<Breadcrumb currentPage={title} />
			</div>
		</section>
	);
}
