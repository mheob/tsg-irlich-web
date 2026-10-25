import type { Metadata } from 'next';
import { stegaClean } from 'next-sanity';
import { notFound, permanentRedirect } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { JsonLd } from '@/components/ui/json-ld';
import { sanityFetch } from '@/lib/sanity/live';
import {
	groupContactPersonsQuery,
	groupNewsQuery,
	groupPageQuery,
	groupRedirectQuery,
	groupStaticParamsQuery,
	offerGroupsGroupPageQuery,
} from '@/lib/sanity/queries/pages/offer-groups-group';
import { urlForImage } from '@/lib/sanity/utils';
import type { SimpleBlockContent } from '@/types/sanity.types';
import { resolveGroupRedirect } from '@/utils/group-redirect';
import { getPageMetadata } from '@/utils/metadata';
import { getGroupSchema } from '@/utils/structured-data';
import { getBaseUrl } from '@/utils/url';

import { Main } from './_sections/main';
import { News } from './_sections/news';
import { Training } from './_sections/training';

const IMAGE_SIZE = { height: 600, width: 1920 };

/** What the main section shows for a group without description, such as a fresh draft. */
const EMPTY_DESCRIPTION: SimpleBlockContent = { _type: 'simpleBlockContent', text: [] };

export async function generateStaticParams(): Promise<{ group: string; singleGroup: string }[]> {
	const { data: params } = await sanityFetch({
		perspective: 'published',
		query: groupStaticParamsQuery,
		stega: false,
	});

	return params;
}

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/angebot/[group]/[singleGroup]'>>): Promise<Metadata> {
	const { group, singleGroup } = await params;

	const { data: groupData } = await sanityFetch({
		params: { department: group, slug: singleGroup },
		query: groupPageQuery,
		stega: false,
	});

	if (!groupData) {
		return {};
	}

	return getPageMetadata({
		image: groupData.featuredImage,
		meta: groupData.meta,
		path: `/angebot/${group}/${singleGroup}`,
		title: groupData.title,
	});
}

export default async function SingleGroupsPage({
	params,
}: Readonly<PageProps<'/angebot/[group]/[singleGroup]'>>) {
	const { group, singleGroup } = await params;

	const [{ data: page }, { data: groupData }] = await Promise.all([
		sanityFetch({ query: offerGroupsGroupPageQuery }),
		sanityFetch({ params: { department: group, slug: singleGroup }, query: groupPageQuery }),
	]);

	if (!groupData) {
		// A group whose department or own slug changed stays reachable under its old address. Only a
		// path no group uses today gets here, so the group that has a path now never redirects, and
		// the target is always a current path, so it cannot loop.
		const { data: candidates } = await sanityFetch({
			params: { department: group, slug: singleGroup },
			query: groupRedirectQuery,
			stega: false,
		});
		const target = resolveGroupRedirect(candidates);

		if (target) {
			permanentRedirect(target);
		}

		notFound();
	}

	if (!page) {
		notFound();
	}

	const [{ data: coaches }, { data: news }] = await Promise.all([
		sanityFetch({ params: { groupId: groupData._id }, query: groupContactPersonsQuery }),
		sanityFetch({ params: { groupId: groupData._id }, query: groupNewsQuery }),
	]);

	const path = `/angebot/${group}/${singleGroup}`;
	const imageSource = urlForImage(groupData.featuredImage, IMAGE_SIZE.height, IMAGE_SIZE.width);
	// Only the fields the structured data reads, cleaned of the stega encoding draft mode adds, which
	// leaves the rendered group and its click-to-edit overlays alone.
	const groupSchema = getGroupSchema({
		baseUrl: getBaseUrl(),
		group: stegaClean({
			featuredImage: groupData.featuredImage,
			meta: groupData.meta,
			title: groupData.title,
			training: groupData.training,
		}),
		isTeam: groupData.isTeamSport === true,
		path,
	});
	// The persons' phone numbers end up in links and their contact method is compared to literals,
	// so neither may carry stega characters.
	const contactPersons = stegaClean(coaches);

	return (
		<>
			<JsonLd data={groupSchema} />
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
				description={groupData.description ?? EMPTY_DESCRIPTION}
				gallery={groupData.images ?? []}
				title={groupData.title ?? ''}
			/>
			{groupData.training && (
				<Training
					title={page.content.trainingSection.title ?? ''}
					training={{
						...groupData.training,
						// A training time is labelled by looking its season and weekday up and links a route
						// built from the venue address, so none of it may carry stega characters.
						trainingTimes: stegaClean(groupData.training.trainingTimes),
					}}
				/>
			)}
			{news && news.articles.length > 0 && <News {...news} />}
			<ContactPersons {...page.content.contactPersonsSection} contactPersons={contactPersons} />
			<Newsletter />
		</>
	);
}
