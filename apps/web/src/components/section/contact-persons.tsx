import { cn } from '@tsgi-web/shared';

import { SectionHeader } from '@/components/ui/section-header';
import { ContactPersons as ContactPersonGroup } from '@/components/with-logic/contact-persons';
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
			<div className="container pt-10 pb-24 md:pt-28 md:pb-40">
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
					<ContactPersonGroup contactPersons={contactPersons ?? []} />
				</div>
			</div>
		</section>
	);
}
