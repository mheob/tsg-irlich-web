import type { Metadata } from 'next';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Stats } from '@/components/section/stats';
import { client } from '@/lib/sanity/client';
import { offerPageContactPersonsQuery, offerPageQuery } from '@/lib/sanity/queries/pages/offer';
import { groupsQuery } from '@/lib/sanity/queries/shared/groups';

import gymnasticImage from './_assets/gymnastic.webp';
import Groups from './_sections/groups';

export const metadata: Metadata = {
	description:
		'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas. In 18 verschiedenen Sparten findest du alles, was du benötigst.',
	title: 'Angebot — TSG Irlich',
};

export default async function Offer() {
	const [page, groups, offerPersons] = await Promise.all([
		client.fetch(offerPageQuery),
		client.fetch(groupsQuery),
		client.fetch(offerPageContactPersonsQuery, { department: 'Vorstand' }),
	]);

	if (!page) return null;
	// TODO: remove
	if (!page.content) return null;

	return (
		<>
			<Hero
				image={{
					alt: 'Vier Kinder in blauen Sportuniformen, die Handstände gegen eine Wand machen.',
					src: gymnasticImage,
				}}
				subTitle={page.subtitle}
				title={page.title}
			/>
			<Groups {...page.content.groupsSection} groups={groups} />
			<Stats {...page.content.statsSection} />
			{/* Training Schedules */}
			<ContactPersons {...page.content.contactPersonsSection} contactPersons={offerPersons ?? []} />
		</>
	);
}
