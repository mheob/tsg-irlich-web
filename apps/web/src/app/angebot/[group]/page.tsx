import type { Metadata } from 'next';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import { EMAIL_MASS_SPORT_DEPARTMENT, EMAIL_SOCCER_DEPARTMENT } from '@/constants/query-fields';
import { client } from '@/lib/sanity/client';
import {
	offerGroupsPageContactPersonsQuery,
	offerGroupsPageGroupsQuery,
	offerGroupsPageQuery,
} from '@/lib/sanity/queries/pages/offer-groups';
import type { Groups as GroupsType } from '@/types/sanity.types';
import { getCurrentDepartment, getGroupImage, getOGImage } from '@/utils/groups';

import { Groups } from './_sections/groups';

export async function generateMetadata({
	params,
}: PageProps<'/angebot/[group]'>): Promise<Metadata> {
	const { group: groupParameter } = await params;

	const currentDepartment = getCurrentDepartment(groupParameter);

	const page = await client.fetch(offerGroupsPageQuery);

	if (!page) return {};

	const image = getOGImage(groupParameter);

	return {
		description: page.subtitle ?? '',
		openGraph: {
			description: page.subtitle ?? '',
			images: image ?? [],
			title: `${currentDepartment?.title ?? ''} — TSG Irlich`,
		},
		title: `${currentDepartment?.title ?? ''} — TSG Irlich`,
	};
}

export default async function GroupsPage({ params }: PageProps<'/angebot/[group]'>) {
	const { group } = await params;

	const currentDepartment = getCurrentDepartment(group);

	const [page, groups, offerPersons] = await Promise.all([
		client.fetch(offerGroupsPageQuery),
		client.fetch(offerGroupsPageGroupsQuery, { groupType: currentDepartment?._type }),
		client.fetch(offerGroupsPageContactPersonsQuery, {
			email: group === 'fussball' ? EMAIL_SOCCER_DEPARTMENT : EMAIL_MASS_SPORT_DEPARTMENT,
		}),
	]);

	if (!page) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	return (
		<>
			<Hero
				image={getGroupImage(group, '/angebot')}
				subTitle={page.subtitle}
				title={`${page.title} ${currentDepartment?.title ?? ''}`.trim()}
			/>
			<Groups
				{...page.content.groupsSection}
				currentDepartment={currentDepartment}
				groups={groups as GroupsType['groups']}
			/>
			<Stats stats={page.content.stats} />
			<ContactPersons {...page.content.contactPersonsSection} contactPersons={offerPersons ?? []} />
			<Newsletter />
		</>
	);
}
