import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { HTMLAttributes } from 'react';

import type { Home } from '@/types/sanity.types';
import { cn } from '@/utils/cn';

import { Button } from './button';

type PricingProps = Home['content']['pricingSection']['pricingAdult'];

interface PricingCardProps extends PricingProps {
	children: HTMLAttributes<HTMLDivElement>['children'];
	cta: string;
	isHighlighted?: boolean;
}

export default function PricingCard({
	benefits,
	benefitsTitle,
	children,
	cta,
	intro,
	isHighlighted = false,
	price,
	subtitle,
	title,
}: Readonly<PricingCardProps>) {
	return (
		<article
			className={cn(
				'flex flex-col justify-between overflow-hidden rounded-xl shadow-lg md:w-1/4',
				'hover:bg-gray-light bg-white p-8 text-black',
				'transition-all duration-300',
				{ 'md:-translate-y-16 md:hover:-translate-y-8': isHighlighted },
				{ 'md:hover:-translate-y-8': !isHighlighted },
			)}
		>
			{isHighlighted && (
				<div
					className={cn(
						'bg-secondary flex h-10 items-center justify-center text-xs font-bold',
						'origin-center translate-x-[calc(50%-1rem)] translate-y-[calc(50%-1.5rem)] rotate-45',
					)}
				>
					Beliebt
				</div>
			)}

			<div className={cn({ 'md:-mt-10': isHighlighted })}>
				<header className="flex items-center gap-4">
					<div className="bg-primary-light/15 text-primary rounded-2xl p-4">{children}</div>

					<div>
						<p className="text-lg">{subtitle}</p>
						<h2 className="font-serif text-2xl uppercase">{title}</h2>
					</div>
				</header>

				<div className="mt-6">
					<p className="md:text-lg">{intro}</p>
					<div className="my-6 text-center text-5xl font-bold">
						{price} € <span className="text-sm">/monatlich</span>
					</div>
					<h3 className="font-sans text-lg font-bold">{benefitsTitle}</h3>
					<ul className="mt-4 md:text-lg">
						{benefits.map(benefit => (
							<li className="flex items-start gap-2" key={benefit}>
								<CheckCircle className="text-primary-light mt-1 h-5 w-5 min-w-6" /> {benefit}
							</li>
						))}
					</ul>
				</div>
			</div>

			<footer className="mt-8">
				<Button variant={isHighlighted ? 'secondary' : 'primary'} asChild fullWidth>
					<Link href="/kontakt">{cta}</Link>
				</Button>
			</footer>
		</article>
	);
}
