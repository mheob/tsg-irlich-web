import { shuffleArray } from '@tsgi-web/shared';

import { SectionHeader } from '@/components/ui/section-header';
import type { Home, HomePageTestimonialsQueryResult } from '@/types/sanity.types';

import { TestimonialGroup } from './testimonial-group';

import styles from './testimonials.module.css';

type TestimonialsSectionProps = Omit<Home['content']['testimonialSection'], 'testimonials'>;
interface TestimonialsProps extends TestimonialsSectionProps {
	testimonials: HomePageTestimonialsQueryResult;
}

export function Testimonials({ subtitle, testimonials, title }: Readonly<TestimonialsProps>) {
	const shuffledTestimonials = testimonials ? shuffleArray(testimonials).slice(0, 3) : [];

	return (
		<section className={`${styles.bg} bg-background-low-contrast relative z-0`}>
			<div className="container mx-auto px-5 py-10 md:grid md:grid-cols-[40%_60%] md:py-32">
				<SectionHeader isCenteredOnDesktop={false} subTitle={subtitle} title={title} isCentered />
				<TestimonialGroup testimonials={shuffledTestimonials} />
			</div>
		</section>
	);
}
