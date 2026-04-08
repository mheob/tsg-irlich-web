import { Crown, Gem, Rocket } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import { PricingCard } from '@/components/ui/pricing-card';
import { SectionHeader } from '@/components/ui/section-header';
import type { Home } from '@/types/sanity.types';

import styles from './pricing.module.css';

type PricingProps = Home['content']['pricingSection'];

export function Pricing({
	intro,
	pricingAdult,
	pricingFamily,
	pricingYouth,
	subtitle,
	title,
}: Readonly<PricingProps>) {
	return (
		<section className={cn(styles.bg, 'relative z-0 bg-primary text-white')}>
			<div className="container py-10 md:py-28">
				<SectionHeader
					descriptionClassName="text-primary-foreground"
					subTitle={subtitle}
					title={title}
					isCentered
					isCenteredOnDesktop
				>
					{intro}
				</SectionHeader>

				<div className="mt-10 flex flex-col gap-6 lg:mt-32 lg:flex-row lg:justify-center lg:gap-12">
					<PricingCard {...pricingYouth}>
						<Rocket size="40" stroke="currentColor" strokeWidth="1" />
					</PricingCard>

					<PricingCard {...pricingAdult} isHighlighted>
						<Gem size="40" stroke="currentColor" strokeWidth="1" />
					</PricingCard>

					<PricingCard {...pricingFamily}>
						<Crown size="40" stroke="currentColor" strokeWidth="1" />
					</PricingCard>
				</div>
			</div>
		</section>
	);
}
