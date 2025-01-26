'use client';

import { cn } from '@tsgi-web/shared';
import { Quote } from 'lucide-react';
import Image from 'next/image';
import type { HTMLAttributes } from 'react';

import ArrowButtonGroup from '@/components/ui/arrow-button-group';
import { useMediaQuery } from '@/hooks/use-media-query';
import { urlForImage } from '@/lib/sanity/utils';
import type { HomePageTestimonialsQueryResult } from '@/types/sanity.types.generated';
import { getInitials } from '@/utils/image';

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

	const imageSource = urlForImage(image, 96);

	return (
		<article
			className={cn(
				'relative flex flex-col gap-4',
				{
					'bg-primary text-primary-foreground border-primary-foreground rounded-xl': isHighlighted,
				},
				{ 'py-6 pl-5 pr-10': !isHighlighted && isMobile },
				{ '-ml-6 mr-2 py-6 pl-5 pr-10': isHighlighted && isMobile },
				{ 'my-6 -ml-36 -mr-14 py-6 pl-14 pr-36': isHighlighted && !isMobile },
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
						height={isMobile ? 40 : 96}
						src={imageSource}
						width={isMobile ? 40 : 96}
					/>
				) : (
					<div
						className={cn(
							'rounded-full border-2 md:border-4',
							{ 'text-primary border-primary': !isHighlighted },
							{ 'text-primary-foreground border-primary-foreground': isHighlighted },
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
				<div className="absolute bottom-2 end-4 md:bottom-6 md:end-12">
					<Quote className="size-6 md:size-14" strokeWidth="1" />
				</div>
			)}
		</article>
	);
}

interface TestimonialGroupProps extends HTMLAttributes<HTMLDivElement> {
	testimonials: NonNullable<HomePageTestimonialsQueryResult>;
}

export default function TestimonialGroup({ testimonials }: Readonly<TestimonialGroupProps>) {
	return (
		<div>
			<div className="bg-primary-border-primary-foreground ml-6 mt-10 rounded-xl shadow-xl md:ml-0 md:mt-0 md:py-16 md:pl-12 md:pr-28">
				{testimonials.map((props, index) => (
					<TestimonialItem {...props} isHighlighted={index === 1} key={props.lastName} />
				))}
			</div>

			<ArrowButtonGroup className="mt-10 md:mt-24" />
		</div>
	);
}
