'use client';

import { Quote } from 'lucide-react';
import Image from 'next/image';
import type { HTMLAttributes } from 'react';

import { cn } from '@tsgi-web/shared';

import { useMediaQuery } from '@/hooks/use-media-query';
import { urlForImage } from '@/lib/sanity/utils';
import type { HomePageTestimonialsQueryResult } from '@/types/sanity.types';
import { getInitials } from '@/utils/image';

const IMAGE_SIZE = { desktop: 96, mobile: 40 };

type Testimonial = NonNullable<HomePageTestimonialsQueryResult>[number];
interface TestimonialItemProps extends Testimonial {
	isHighlighted?: boolean;
	quote: string;
	role: string;
}

function TestimonialItem({
	firstName,
	image,
	isHighlighted,
	lastName,
	quote,
	role,
}: Readonly<TestimonialItemProps>) {
	const isMobile = useMediaQuery('(max-width: 48rem)');

	const imageSource = urlForImage(image, IMAGE_SIZE.desktop);

	return (
		<article
			className={cn(
				'relative flex flex-col gap-4',
				{
					'rounded-xl border-primary-foreground bg-primary text-primary-foreground': isHighlighted,
				},
				{ 'py-6 pr-10 pl-5': !isHighlighted && isMobile },
				{ 'mr-2 -ml-6 py-6 pr-10 pl-5': isHighlighted && isMobile },
				{ 'my-6 -mr-14 -ml-36 py-6 pr-36 pl-14': isHighlighted && !isMobile },
			)}
		>
			<div className="flex items-center gap-5">
				{imageSource ? (
					<Image
						className={cn(
							'rounded-full border-2 md:border-4',
							{ 'border-primary': !isHighlighted },
							{ 'border-primary-foreground': isHighlighted },
						)}
						alt={image.alt}
						height={isMobile ? IMAGE_SIZE.mobile : IMAGE_SIZE.desktop}
						src={imageSource}
						width={isMobile ? IMAGE_SIZE.mobile : IMAGE_SIZE.desktop}
					/>
				) : (
					<div
						className={cn(
							'rounded-full border-2 md:border-4',
							{ 'border-primary text-primary': !isHighlighted },
							{ 'border-primary-foreground text-primary-foreground': isHighlighted },
							'grid size-10 place-items-center text-4xl font-bold md:size-24',
						)}
					>
						{getInitials(firstName, lastName)}
					</div>
				)}

				<div className="flex flex-col gap-1">
					<span className="font-serif font-bold md:text-3xl">
						{firstName} {lastName}
					</span>
					<span
						className={cn(
							'text-sm md:text-xl',
							{ 'text-foreground/80': !isHighlighted },
							{ 'text-primary-foreground/80': isHighlighted },
						)}
					>
						{role}
					</span>
				</div>
			</div>

			<p
				className={cn(
					'text-sm md:text-xl',
					{ 'text-foreground/80': !isHighlighted },
					{ 'text-primary-foreground/80': isHighlighted },
				)}
			>
				{quote}
			</p>

			{isHighlighted && (
				<div className="absolute inset-e-4 bottom-2 md:inset-e-12 md:bottom-6">
					<Quote className="size-6 md:size-14" strokeWidth="1" />
				</div>
			)}
		</article>
	);
}

interface TestimonialGroupProps extends HTMLAttributes<HTMLDivElement> {
	testimonials: NonNullable<HomePageTestimonialsQueryResult>;
}

export function TestimonialGroup({ testimonials }: Readonly<TestimonialGroupProps>) {
	return (
		<div>
			<div className="bg-primary-border-primary-foreground mt-10 ml-6 rounded-xl shadow-xl md:mt-0 md:ml-0 md:py-16 md:pr-28 md:pl-12">
				{testimonials.map((props, index) => (
					<TestimonialItem {...props} isHighlighted={index === 1} key={props._id} />
				))}
			</div>
		</div>
	);
}
