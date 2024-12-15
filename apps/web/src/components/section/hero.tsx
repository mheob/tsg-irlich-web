import Image from 'next/image';
import type { ComponentPropsWithoutRef } from 'react';

import { urlForImage } from '@/lib/sanity/utils';
import type { MainImage } from '@/types/sanity.types';
import { cn } from '@/utils/cn';

import SectionHeader from '../ui/section-header';
import Breadcrumb from '../with-logic/breadcrumb';

interface HeroProps extends ComponentPropsWithoutRef<'section'> {
	image?: MainImage;
	subTitle?: string;
	title: string;
}

export default function Hero({ children, image, subTitle, title, ...props }: Readonly<HeroProps>) {
	const imageSource = urlForImage(image, 600, 1920);

	return (
		<section
			className={cn(
				'relative -mt-40 h-[360px] md:h-[600px]',
				'from-primary/70 to-primary/30 bg-linear-to-r text-white',
			)}
			{...props}
		>
			{image && imageSource && (
				<Image alt={image.alt} className="absolute inset-0 -z-10" src={imageSource} fill />
			)}

			<div className="flex h-full flex-col items-center justify-center pt-40">
				<SectionHeader subTitle={subTitle} title={title} isCentered>
					{children}
				</SectionHeader>

				<Breadcrumb currentPage={title} />
			</div>
		</section>
	);
}
