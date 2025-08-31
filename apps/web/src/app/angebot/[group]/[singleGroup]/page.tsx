import type { Metadata } from 'next';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { client } from '@/lib/sanity/client';
import {
	offerGroupsGroupPageContactPersonsQuery,
	offerGroupsGroupPageGroupsQuery,
	offerGroupsGroupPageQuery,
} from '@/lib/sanity/queries/pages/offer-groups-group';
import { urlForImage } from '@/lib/sanity/utils';
import type { PageProps } from '@/types/common';
import type { SimpleBlockContent } from '@/types/sanity.types.generated';
import { getCurrentDepartment, getOGImage } from '@/utils/groups';

import { Main } from './_sections/main';
import { Training } from './_sections/training';

export async function generateMetadata({
	params,
}: PageProps<{ singleGroup: string }>): Promise<Metadata> {
	const { singleGroup: singleGroupParameter } = await params;

	const page = await client.fetch(offerGroupsGroupPageQuery);

	if (!page) return {};

	const image = getOGImage(singleGroupParameter);

	return {
		description: page.subtitle ?? '',
		openGraph: {
			description: page.subtitle ?? '',
			images: image ?? [],
			title: `${page.title ?? ''} — TSG Irlich`,
		},
		title: `${page.title ?? ''} — TSG Irlich`,
	};
}

export default async function SingleGroupsPage({
	params,
}: PageProps<{ group: string; singleGroup: string }>) {
	const { group, singleGroup } = await params;

	const currentDepartment = getCurrentDepartment(group);

	const [page, groupData, coaches] = await Promise.all([
		client.fetch(offerGroupsGroupPageQuery),
		client.fetch(offerGroupsGroupPageGroupsQuery, {
			groupType: currentDepartment?._type,
			slug: singleGroup,
		}),
		client.fetch(offerGroupsGroupPageContactPersonsQuery, { slug: singleGroup }),
	]);

	if (!page || !groupData) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	const imageSource = urlForImage(groupData.featuredImage, 600, 1920);

	return (
		<>
			<Hero
				image={{ alt: groupData.featuredImage?.alt ?? '', src: imageSource ?? '' }}
				subTitle={page.subtitle}
				title={page.title}
			/>
			<Main
				description={(groupData.description as SimpleBlockContent) ?? ''}
				gallery={groupData.images ?? []}
				title={groupData.title ?? ''}
			/>
			<Training title={page.content.trainingSection.title ?? ''} training={groupData.training} />
			<ContactPersons {...page.content.contactPersonsSection} contactPersons={coaches} />
			<Newsletter />
		</>
	);
}
