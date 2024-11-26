import SectionHeader from '@/components/ui/section-header';
import type { Home, HomePageTestimonialsQueryResult } from '@/types/sanity.types';

import TestimonialGroup from './testimonial-group';

import styles from './testimonials.module.css';

type TestimonialsSectionProps = Omit<Home['content']['testimonialSection'], 'testimonials'>;
interface TestimonialsProps extends TestimonialsSectionProps {
	testimonials: HomePageTestimonialsQueryResult;
}

export default function Testimonials({
	subtitle,
	testimonials,
	title,
}: Readonly<TestimonialsProps>) {
	return (
		<section className={`${styles.bg} bg-background-lowContrast relative z-0`}>
			<div className="container mx-auto grid grid-cols-[40%,60%] px-5 py-32">
				<SectionHeader subTitle={subtitle} title={title} />
				{testimonials && <TestimonialGroup testimonials={testimonials} />}
			</div>
		</section>
	);
}
