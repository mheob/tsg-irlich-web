import { Quote } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import { Portrait } from '@/components/ui/portrait';
import { SectionHeader } from '@/components/ui/section-header';

import type { Testimonial, VoicesSection } from '../_shared/types';

import contactStyles from '@/components/section/contact-persons.module.css';

const PORTRAIT_SIZE = 48;
/** With exactly three quotes the middle one stands a little higher on wide screens. */
const RAISED_INDEX = 1;
const RAISED_COUNT = 3;

/**
 * „Stimmen aus dem Verein“ from variant B: volunteers quoted on the blue band.
 *
 * @param props - The section and its quotes.
 * @param props.section - The header from the studio.
 * @param props.testimonials - The quotes that resolved.
 * @returns The section, or nothing without a quote.
 */
function Voices({ section, testimonials }: Readonly<VoicesProps>) {
	if (testimonials.length === 0) {
		return null;
	}

	const { intro, subtitle, title } = section;

	return (
		<section className={cn(contactStyles.bg, 'relative z-0 bg-primary text-primary-foreground')}>
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

				<ul className="mt-12 grid grid-cols-1 gap-6 md:mt-20 md:grid-cols-3 md:gap-8">
					{testimonials.map((testimonial, index) => (
						<li
							className={cn(
								'flex flex-col justify-between gap-6 rounded-xl bg-background p-8 text-foreground shadow-lg',
								testimonials.length === RAISED_COUNT &&
									index === RAISED_INDEX &&
									'md:-translate-y-6',
							)}
							key={testimonial._id}
						>
							<Quote aria-hidden="true" className="size-10 text-secondary-dark" strokeWidth={1} />
							<blockquote className="flex-1 text-lg md:text-xl">„{testimonial.quote}“</blockquote>
							<div className="flex items-center gap-4 border-t pt-4">
								<Portrait
									className="size-12 border-2 border-primary text-lg"
									firstName={testimonial.firstName}
									image={testimonial.image}
									lastName={testimonial.lastName}
									sourceSize={PORTRAIT_SIZE}
								/>
								<p>
									<span className="block font-serif text-xl">
										{testimonial.firstName} {testimonial.lastName}
									</span>
									<span className="block text-sm text-muted-foreground">{testimonial.role}</span>
								</p>
							</div>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

interface VoicesProps {
	section: VoicesSection;
	testimonials: Testimonial[];
}

export { Voices };
