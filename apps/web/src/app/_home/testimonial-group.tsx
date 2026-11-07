import { Quote } from 'lucide-react';
import Image from 'next/image';
import type { HTMLAttributes } from 'react';

import { cn } from '@tsgi-web/shared';

import { urlForImage } from '@/lib/sanity/utils';
import type { HomePageTestimonialsQueryResult } from '@/types/sanity.types';
import { getInitials } from '@/utils/image';

/** The edge of the portrait from the `md` breakpoint up; a phone shows it at 40 px (`size-10`). */
const IMAGE_SIZE = 96;
/** Which width of the portrait the browser fetches, matching `size-10 md:size-24`. */
const IMAGE_SIZES = '(max-width: 767px) 40px, 96px';

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
	const imageSource = urlForImage(image, IMAGE_SIZE);

	return (
		<article
			className={cn(
				'relative flex flex-col gap-4',
				{
					'rounded-xl border-primary-foreground bg-primary text-primary-foreground': isHighlighted,
				},
				// The layout switches with CSS, so the server already renders the one a phone shows and
				// nothing jumps when the page hydrates (WEB-412).
				'py-6 pr-10 pl-5',
				{ 'md:p-0': !isHighlighted },
				{ 'mr-2 -ml-6 md:my-6 md:-mr-14 md:-ml-36 md:pr-36 md:pl-14': isHighlighted },
			)}
		>
			<div className="flex items-center gap-5">
				{imageSource ? (
					<Image
						className={cn(
							'size-10 rounded-full border-2 md:size-24 md:border-4',
							{ 'border-primary': !isHighlighted },
							{ 'border-primary-foreground': isHighlighted },
						)}
						alt={image.alt}
						height={IMAGE_SIZE}
						sizes={IMAGE_SIZES}
						src={imageSource}
						width={IMAGE_SIZE}
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
			<div className="mt-10 ml-6 rounded-xl bg-background shadow-xl md:mt-0 md:ml-0 md:py-16 md:pr-28 md:pl-12">
				{testimonials.map((props, index) => (
					<TestimonialItem {...props} isHighlighted={index === 1} key={props._id} />
				))}
			</div>
		</div>
	);
}
