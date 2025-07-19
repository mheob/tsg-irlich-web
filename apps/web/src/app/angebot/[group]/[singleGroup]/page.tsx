import type { Metadata } from 'next';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { EMAIL_MASS_SPORT_DEPARTMENT, EMAIL_SOCCER_DEPARTMENT } from '@/constants/query-fields';
import { client } from '@/lib/sanity/client';
import {
	offerGroupsGroupPageContactPersonsQuery,
	offerGroupsGroupPageQuery,
} from '@/lib/sanity/queries/pages/offer-groups-group';
import type { PageProps } from '@/types/common';
import { getGroupImage, getOGImage, groupSections } from '@/utils/groups';

export async function generateMetadata({
	params,
}: PageProps<{ singleGroup: string }>): Promise<Metadata> {
	const { singleGroup } = await params;

	// const article = await client.fetch(newsArticleContentQuery, { groups });

	// if (!article) return {};

	const image = getOGImage(singleGroup);

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

export default async function GroupsPage({
	params,
}: PageProps<{ group: string; singleGroup: string }>) {
	const { group, singleGroup } = await params;

	const [page, offerPersons] = await Promise.all([
		client.fetch(offerGroupsGroupPageQuery),
		client.fetch(offerGroupsGroupPageContactPersonsQuery, {
			email: singleGroup === 'd-jugend' ? EMAIL_SOCCER_DEPARTMENT : EMAIL_MASS_SPORT_DEPARTMENT,
		}),
	]);

	console.log({ page });

	if (!page) return null;

	return (
		<>
			<Hero subTitle={page.subtitle} title={page.title} />
			<ContactPersons contactPersons={offerPersons ?? []} subtitle="" title="" />
			<Newsletter />
		</>
	);
}
