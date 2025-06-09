import { cn } from '@tsgi-web/shared';

import { ContactPersons as ContactPersonGroup } from '@/components/ui/contact-persons';
import { SectionHeader } from '@/components/ui/section-header';
import type { ContactPerson, HomePageQueryResult } from '@/types/sanity.types';

import styles from './contact-persons.module.css';

type ContactPersonsFields = NonNullable<HomePageQueryResult>['content']['contactPersonsSection'];
interface ContactPersonsProps extends Omit<ContactPersonsFields, 'contactPersons'> {
	contactPersons: ContactPerson[];
}

export function ContactPersons({
	contactPersons,
	intro,
	subtitle,
	title,
}: Readonly<ContactPersonsProps>) {
	return (
		<section className={cn(styles.bg, 'bg-primary text-primary-foreground relative z-0')}>
			<div className="container mx-auto px-5 pb-24 pt-10 md:pb-40 md:pt-28">
				<SectionHeader
					descriptionClassName="text-primary-foreground"
					subTitle={subtitle}
					title={title}
					isCentered
					isCenteredOnDesktop
				>
					{intro}
				</SectionHeader>

				<div className="mt-10 flex justify-center md:mt-32 md:gap-12">
					<ContactPersonGroup contactPersons={contactPersons} />
				</div>
			</div>
		</section>
	);
}
