import type { Metadata } from 'next';

import { getOpenGraphImageOptions } from '@/app/news/_shared/utils';
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
import type {
	OfferGroupsGroupPageContactPersonsQueryResult,
	OfferGroupsGroupPageGroupsQueryResult,
	OfferGroupsGroupPageQueryResult,
	SimpleBlockContent,
} from '@/types/sanity.types.generated';
import { getCurrentDepartment } from '@/utils/groups';

import { Main } from './_sections/main';
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

	if (!page?.meta) {
		return {};
	}

	const description = page.meta?.metaDescription ?? '';
	const image = page.meta?.openGraphImage ?? page.featuredImage;
	const images = image ? getOpenGraphImageOptions(image, page.title ?? '') : [];
	const title = page.meta.metaTitle ?? (page.title ? `${page.title} — TSG Irlich` : '');

	return {
		description,
		openGraph: { description, images, title },
		title,
	};
}

export default async function SingleGroupsPage({
	params,
}: PageProps<'/angebot/[group]/[singleGroup]'>) {
	const { group, singleGroup } = await params;

	const currentDepartment = getCurrentDepartment(group);

	if (!currentDepartment) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	const [page, groupData, coaches] = await Promise.all([
		client.fetch<OfferGroupsGroupPageQueryResult>(offerGroupsGroupPageQuery),
		client.fetch<OfferGroupsGroupPageGroupsQueryResult>(offerGroupsGroupPageGroupsQuery, {
			groupType: currentDepartment?._type,
			slug: singleGroup,
		}),
		client.fetch<OfferGroupsGroupPageContactPersonsQueryResult>(
			offerGroupsGroupPageContactPersonsQuery,
			{ slug: singleGroup },
		),
	]);

	if (!page || !groupData) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	const imageSource = urlForImage(groupData.featuredImage, IMAGE_SIZE.height, IMAGE_SIZE.width);

	return (
		<>
			<Hero
				image={
					groupData.featuredImage?.alt && imageSource
						? // oxlint-disable-next-line react_perf/jsx-no-new-object-as-prop
							{ alt: groupData.featuredImage.alt, src: imageSource }
						: undefined
				}
				subTitle={page.subtitle}
				title={page.title}
			/>
			<Main
				description={
					(groupData.description as SimpleBlockContent) ??
					// oxlint-disable-next-line react_perf/jsx-no-new-object-as-prop
					({ text: [] } as unknown as SimpleBlockContent)
				}
				// oxlint-disable-next-line react_perf/jsx-no-new-array-as-prop
				gallery={groupData.images ?? []}
				title={groupData.title ?? ''}
			/>
			{groupData.training && (
				<Training title={page.content.trainingSection.title ?? ''} training={groupData.training} />
			)}
			<ContactPersons {...page.content.contactPersonsSection} contactPersons={coaches} />
			<Newsletter />
		</>
	);
}
