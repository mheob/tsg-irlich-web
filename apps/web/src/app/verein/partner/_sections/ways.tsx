import { CircleCheck } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import { ButtonLink } from '@/components/ui/button';
import { PageIcon } from '@/components/ui/page-icon';
import { SectionHeader } from '@/components/ui/section-header';
import { getMailHref } from '@/utils/mail';

import type { Inquiry, WaysSection } from '../_shared/types';

import pricingStyles from '@/components/section/pricing.module.css';

// „So kannst du uns unterstützen“: the cards on the blue band, like the pricing of the home page.
function Ways({ ideaCta, ideaText, inquiry, intro, subtitle, title, ways }: Readonly<WaysProps>) {
	if (!ways?.length) {
		return null;
	}

	return (
		<section className={cn(pricingStyles.bg, 'relative z-0 bg-primary text-white')}>
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

				<div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-20 xl:grid-cols-4">
					{ways.map((way) => (
						<article
							className={cn(
								'rounded-xl bg-background p-8 text-black shadow-lg',
								'transition-all duration-300 hover:bg-background-high-contrast lg:hover:-translate-y-4',
							)}
							key={way._key}
						>
							<div>
								<header className="flex flex-col items-start gap-4">
									<div className="rounded-2xl bg-primary-light/15 p-4 text-primary">
										<PageIcon aria-hidden="true" icon={way.icon} size={40} strokeWidth={1} />
									</div>
									<h3 className="font-serif text-3xl uppercase md:text-4xl">{way.title}</h3>
								</header>
								<p className="mt-6 md:text-lg">{way.text}</p>
								{way.benefits?.length ? (
									<ul className="mt-6 space-y-2">
										{way.benefits.map((benefit) => (
											<li className="flex items-start gap-2" key={benefit}>
												<CircleCheck
													aria-hidden="true"
													className="mt-0.5 size-5 min-w-6 text-primary-light"
												/>
												{benefit}
											</li>
										))}
									</ul>
								) : null}
							</div>
						</article>
					))}
				</div>

				{ideaText && ideaCta ? (
					<div className="mt-16 flex flex-col items-center gap-6 text-center">
						<p className="text-lg text-primary-foreground md:text-xl">{ideaText}</p>
						<ButtonLink href={getMailHref(inquiry)} variant="secondary">
							{ideaCta}
						</ButtonLink>
					</div>
				) : null}
			</div>
		</section>
	);
}

type WaysProps = WaysSection & { inquiry: Inquiry };

export { Ways };
