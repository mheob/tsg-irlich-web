import { Quote } from 'lucide-react';
import Image from 'next/image';
import type { ComponentProps, HTMLAttributes } from 'react';

import ArrowButtonGroup from '@/components/ui/arrow-button-group';
import { cn } from '@/utils';
import { getInitials } from '@/utils/image';

interface TestimonialItemProps {
	firstName: string;
	// image: SanityImage;
	imageSrc: string;
	isHighlighted?: boolean;
	lastName: string;
	quote: string;
	role: string;
	showAlways: boolean;
}

function TestimonialItem({
	firstName,
	imageSrc,
	isHighlighted,
	lastName,
	quote,
	role,
}: TestimonialItemProps) {
	return (
		<article
			className={cn('relative flex flex-col gap-4', {
				'bg-primary text-primary-foreground border-primary-foreground my-6 -ml-36 -mr-14 rounded-xl py-6 pl-14 pr-36':
					isHighlighted,
			})}
		>
			<div className="flex items-center gap-5">
				{imageSrc ? (
					<Image
						className={cn(
							'rounded-full border-4',
							{ 'border-primary': !isHighlighted },
							{ 'border-primary-foreground': isHighlighted },
						)}
						// alt={image.alt as string}
						alt={lastName}
						height={96}
						// src={urlFor(image, 96).url()}
						src={imageSrc}
						width={96}
					/>
				) : (
					<div
						className={cn(
							'rounded-full border-4',
							{ 'text-primary border-primary': !isHighlighted },
							{ 'text-primary-foreground border-primary-foreground': isHighlighted },
							'grid h-24 w-24 place-items-center text-4xl font-bold',
						)}
					>
						{getInitials(firstName, lastName)}
					</div>
				)}

				<div className="flex flex-col gap-1">
					<span className="font-serif text-3xl font-bold">
						{firstName} {lastName}
					</span>
					<span
						className={cn(
							'text-xl',
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
					'text-xl',
					{ 'text-foreground/80': !isHighlighted },
					{ 'text-primary-foreground/80': isHighlighted },
				)}
			>
				{quote}
			</p>

			{isHighlighted && (
				<div className="absolute bottom-6 right-12">
					<Quote size="56" strokeWidth="1" />
				</div>
			)}
		</article>
	);
}

interface TestimonialGroupProps extends HTMLAttributes<HTMLDivElement> {
	testimonials: ComponentProps<typeof TestimonialItem>[];
}

export default function TestimonialGroup({ testimonials }: TestimonialGroupProps) {
	return (
		<div>
			<div className="bg-primary-border-primary-foreground w-full rounded-xl py-16 pl-12 pr-28 shadow-xl">
				{testimonials.map((props, index) => (
					<TestimonialItem {...props} isHighlighted={index === 1} key={props.lastName} />
				))}
			</div>

			<ArrowButtonGroup className="mt-24" />
		</div>
	);
}
