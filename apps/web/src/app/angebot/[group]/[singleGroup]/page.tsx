import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { JsonLd } from '@/components/ui/json-ld';
import { client } from '@/lib/sanity/client';
import {
	offerGroupsGroupPageContactPersonsQuery,
	offerGroupsGroupPageGroupsQuery,
	offerGroupsGroupPageNewsQuery,
	offerGroupsGroupPageQuery,
} from '@/lib/sanity/queries/pages/offer-groups-group';
import { urlForImage } from '@/lib/sanity/utils';
import type {
	OfferGroupsGroupPageContactPersonsQueryResult,
	OfferGroupsGroupPageGroupsQueryResult,
	OfferGroupsGroupPageNewsQueryResult,
	OfferGroupsGroupPageQueryResult,
	SimpleBlockContent,
} from '@/types/sanity.types.generated';
import { getCurrentDepartment } from '@/utils/groups';
import { getPageMetadata } from '@/utils/metadata';
import { getGroupSchema } from '@/utils/structured-data';
import { getBaseUrl } from '@/utils/url';

import { Main } from './_sections/main';
import { News } from './_sections/news';
import { Training } from './_sections/training';

const IMAGE_SIZE = { height: 1920, width: 600 };

export async function generateMetadata({
	params,
}: PageProps<'/angebot/[group]/[singleGroup]'>): Promise<Metadata> {
	const { group, singleGroup } = await params;

	const currentDepartment = getCurrentDepartment(group);

	if (!currentDepartment) {
		return {};
	}

	const page = await client.fetch<OfferGroupsGroupPageGroupsQueryResult>(
		offerGroupsGroupPageGroupsQuery,
		{
			groupType: currentDepartment?._type,
			slug: singleGroup,
		},
	);

	if (!page) {
		return {};
	}

	return getPageMetadata({
		image: page.featuredImage,
		meta: page.meta,
		path: `/angebot/${group}/${singleGroup}`,
		title: page.title,
	});
}

export default async function SingleGroupsPage({
	params,
}: PageProps<'/angebot/[group]/[singleGroup]'>) {
	const { group, singleGroup } = await params;

	const currentDepartment = getCurrentDepartment(group);

	if (!currentDepartment) {
		notFound();
	}

	const [page, groupData, coaches, news] = await Promise.all([
		client.fetch<OfferGroupsGroupPageQueryResult>(offerGroupsGroupPageQuery),
		client.fetch<OfferGroupsGroupPageGroupsQueryResult>(offerGroupsGroupPageGroupsQuery, {
			groupType: currentDepartment?._type,
			slug: singleGroup,
		}),
		client.fetch<OfferGroupsGroupPageContactPersonsQueryResult>(
			offerGroupsGroupPageContactPersonsQuery,
			{ slug: singleGroup },
		),
		client.fetch<OfferGroupsGroupPageNewsQueryResult>(offerGroupsGroupPageNewsQuery, {
			groupType: currentDepartment._type,
			slug: singleGroup,
		}),
	]);

	if (!page || !groupData) {
		notFound();
	}

	const imageSource = urlForImage(groupData.featuredImage, IMAGE_SIZE.height, IMAGE_SIZE.width);
	// Only the soccer groups play as teams; a course or a dance group is a group of the club.
	const isTeam = currentDepartment._type === 'group.soccer';

	return (
		<>
			<JsonLd
				data={getGroupSchema({
					baseUrl: getBaseUrl(),
					group: groupData,
					isTeam,
					path: `/angebot/${group}/${singleGroup}`,
				})}
			/>
			<Hero
				image={
					groupData.featuredImage?.alt && imageSource
						? { alt: groupData.featuredImage.alt, src: imageSource }
						: undefined
				}
				subTitle={page.subtitle}
				title={page.title}
			/>
			<Main
				description={
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion
					(groupData.description as SimpleBlockContent) ??
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion
					({ text: [] } as unknown as SimpleBlockContent)
				}
				gallery={groupData.images ?? []}
				title={groupData.title ?? ''}
			/>
			{groupData.training && (
				<Training title={page.content.trainingSection.title ?? ''} training={groupData.training} />
			)}
			{news && news.articles.length > 0 && <News {...news} />}
			<ContactPersons {...page.content.contactPersonsSection} contactPersons={coaches} />
			<Newsletter />
		</>
	);
}
