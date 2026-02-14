import type { Metadata } from 'next';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import { EMAIL_MASS_SPORT_DEPARTMENT, EMAIL_SOCCER_DEPARTMENT } from '@/constants/query-fields';
import { sanityFetch } from '@/lib/sanity/live';
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

	const { data: page } = await sanityFetch({ query: offerGroupsPageQuery });

	if (!page) return {};

	const image = getOGImage(groupParameter);

	return {
		description: page.metaDescription ?? '',
		openGraph: {
			description: page.metaDescription ?? '',
			images: image ?? [],
			title: `${currentDepartment?.title ?? 'Sport'} bei der TSG Irlich`,
		},
		title: `${currentDepartment?.title ?? 'Sport'} bei der TSG Irlich`,
	};
}

export default async function GroupsPage({ params }: PageProps<'/angebot/[group]'>) {
	const { group } = await params;

	const currentDepartment = getCurrentDepartment(group);

	const [{ data: page }, { data: groups }, { data: offerPersons }] = await Promise.all([
		sanityFetch({ query: offerGroupsPageQuery }),
		sanityFetch({
			params: { groupType: currentDepartment?._type },
			query: offerGroupsPageGroupsQuery,
		}),
		sanityFetch({
			params: {
				email: group === 'fussball' ? EMAIL_SOCCER_DEPARTMENT : EMAIL_MASS_SPORT_DEPARTMENT,
			},
			query: offerGroupsPageContactPersonsQuery,
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
