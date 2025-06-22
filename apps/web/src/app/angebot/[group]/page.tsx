// cspell:word angebot
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
import type { PageProps } from '@/types/common';
import type { Groups as GroupsType } from '@/types/sanity.types';
import { getGroupImage, getOGImage, groupSections } from '@/utils/groups';

import Groups from './_sections/groups';

export async function generateMetadata({
	params,
}: PageProps<{ group: string }>): Promise<Metadata> {
	const { group } = await params;

	// const article = await client.fetch(newsArticleContentQuery, { groups });

	// if (!article) return {};

	const image = getOGImage(group);

	return {
		// description: article.excerpt ?? '',
		openGraph: {
			// description: article.excerpt ?? '',
			images: image ?? [],
			// title: article.title ?? '',
			title: 'Fussball - TSG Irlich',
		},
		// title: article.title ?? '',
		title: 'Fussball - TSG Irlich',
	};
}

export default async function GroupsPage({ params }: PageProps<{ group: string }>) {
	const { group } = await params;

	const currentDepartment = groupSections.find(g => g.slug === `/angebot/${group}`);

	const [page, groups, offerPersons] = await Promise.all([
		client.fetch(offerGroupsPageQuery),
		client.fetch(offerGroupsPageGroupsQuery, { groupType: currentDepartment?._type }),
		client.fetch(offerGroupsPageContactPersonsQuery, {
			email: group === 'fussball' ? EMAIL_SOCCER_DEPARTMENT : EMAIL_MASS_SPORT_DEPARTMENT,
		}),
	]);

	if (!page) return null;

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
