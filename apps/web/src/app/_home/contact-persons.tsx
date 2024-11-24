import ContactPersonGroup from '@/components/ui/contact-persons';
import SectionHeader from '@/components/ui/section-header';
import type { GetHomePageContactPersonsResult, Home } from '@/types/sanity.types';

import styles from './contact-persons.module.css';

type ContactPersonsFields = NonNullable<Home['content']['contactPersonsSection']>;
interface ContactPersonsProps extends Omit<ContactPersonsFields, 'contactPersons'> {
	contactPersons: NonNullable<NonNullable<GetHomePageContactPersonsResult>['values']>;
}

export default function ContactPersons({
	contactPersons,
	intro,
	subtitle,
	title,
}: Readonly<ContactPersonsProps>) {
	return (
		<section className={`${styles.bg} bg-primary text-primary-foreground relative z-0`}>
			<div className="container mx-auto px-5 pb-40 pt-28">
				<SectionHeader
					descriptionClassName="text-primary-foreground"
					subTitle={subtitle}
					title={title}
					isCentered
				>
					{intro}
				</SectionHeader>

				<div className="mt-32 flex justify-center gap-12">
					<ContactPersonGroup contactPersons={contactPersons} />
				</div>
			</div>
		</section>
	);
}
