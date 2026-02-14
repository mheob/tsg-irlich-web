import type { Metadata } from 'next';

import { getOpenGraphImageOptions } from '@/app/news/_shared/utils';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { sanityFetch } from '@/lib/sanity/live';
import {
	offerGroupsGroupPageContactPersonsQuery,
	offerGroupsGroupPageGroupsQuery,
	offerGroupsGroupPageQuery,
} from '@/lib/sanity/queries/pages/offer-groups-group';
import { urlForImage } from '@/lib/sanity/utils';
import type { SimpleBlockContent } from '@/types/sanity.types.generated';
import { getCurrentDepartment } from '@/utils/groups';

import { Main } from './_sections/main';
import { Training } from './_sections/training';

export async function generateMetadata({
	params,
}: PageProps<'/angebot/[group]/[singleGroup]'>): Promise<Metadata> {
	const { group, singleGroup } = await params;

	const currentDepartment = getCurrentDepartment(group);

	if (!currentDepartment) return {};

	const { data: page } = await sanityFetch({
		params: { groupType: currentDepartment?._type, slug: singleGroup },
		query: offerGroupsGroupPageGroupsQuery,
	});

	if (!page?.meta) return {};

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

	const [{ data: page }, { data: groupData }, { data: coaches }] = await Promise.all([
		sanityFetch({ query: offerGroupsGroupPageQuery }),
		sanityFetch({
			params: { groupType: currentDepartment?._type, slug: singleGroup },
			query: offerGroupsGroupPageGroupsQuery,
		}),
		sanityFetch({
			params: { slug: singleGroup },
			query: offerGroupsGroupPageContactPersonsQuery,
		}),
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
				description={
					(groupData.description as SimpleBlockContent) ??
					({ text: [] } as unknown as SimpleBlockContent)
				}
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
