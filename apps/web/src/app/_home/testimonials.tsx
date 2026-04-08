import { cn, EMPTY_ARRAY } from '@tsgi-web/shared';

import { SectionHeader } from '@/components/ui/section-header';
import type { Home, HomePageTestimonialsQueryResult } from '@/types/sanity.types';

import { TestimonialGroup } from './testimonial-group';

import styles from './testimonials.module.css';

type TestimonialsSectionProps = Omit<Home['content']['testimonialSection'], 'testimonials'>;
interface TestimonialsProps extends TestimonialsSectionProps {
	testimonials: HomePageTestimonialsQueryResult;
}

export function Testimonials({ subtitle, testimonials, title }: Readonly<TestimonialsProps>) {
	return (
		<section className={cn(styles.bg, 'relative z-0 bg-background-low-contrast')}>
			<div className="container mx-auto px-5 py-10 md:grid md:grid-cols-[40%_60%] md:py-32">
				<SectionHeader isCenteredOnDesktop={false} subTitle={subtitle} title={title} isCentered />
				<TestimonialGroup testimonials={testimonials ?? EMPTY_ARRAY} />
			</div>
		</section>
	);
}
