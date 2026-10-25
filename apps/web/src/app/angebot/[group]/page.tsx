import type { Metadata } from 'next';
import { stegaClean } from 'next-sanity';
import { notFound, permanentRedirect } from 'next/navigation';
import type { ComponentProps } from 'react';

import { EMPTY_ARRAY } from '@tsgi-web/shared';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import { sanityFetch } from '@/lib/sanity/live';
import {
	departmentPageQuery,
	departmentRedirectQuery,
	departmentSlugsQuery,
} from '@/lib/sanity/queries/departments';
import { offerGroupsPageQuery } from '@/lib/sanity/queries/pages/offer-groups';
import { urlForImage } from '@/lib/sanity/utils';
import type { DepartmentPageQueryResult } from '@/types/sanity.types';
import { OFFER_FALLBACK_IMAGE } from '@/utils/fallback-image';
import { getPageMetadata } from '@/utils/metadata';

import { Groups } from './_sections/groups';

const HERO_IMAGE_SIZE = { height: 600, width: 1920 };

type HeroSource = Pick<NonNullable<DepartmentPageQueryResult>, 'cardImage' | 'heroImage' | 'title'>;
type HeroImage = NonNullable<ComponentProps<typeof Hero>['image']>;

/**
 * Picks the picture the hero shows: the hero image of the department, else its card image, else the
 * offer image that stands in everywhere. An image without an asset counts as missing, so a hero
 * image the editors emptied does not hide a card image that is still there.
 *
 * @param department - The department the page shows.
 * @returns The image of the hero with its alt text, which is the department title when the image
 * has none.
 */
function getHeroImage(department: HeroSource): HeroImage {
	for (const image of [department.heroImage, department.cardImage]) {
		const src = urlForImage(image, HERO_IMAGE_SIZE.height, HERO_IMAGE_SIZE.width);

		if (image && src) {
			// An empty alt text counts as missing too: the hero shows no image without one
			return { alt: image.alt || department.title, src };
		}
	}

	return OFFER_FALLBACK_IMAGE;
}

export async function generateStaticParams(): Promise<{ group: string }[]> {
	const { data: slugs } = await sanityFetch({
		perspective: 'published',
		query: departmentSlugsQuery,
		stega: false,
	});

	return slugs.map((group) => ({ group }));
}

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/angebot/[group]'>>): Promise<Metadata> {
	const { group } = await params;

	const [{ data: department }, { data: groupsPage }] = await Promise.all([
		sanityFetch({ params: { slug: group }, query: departmentPageQuery, stega: false }),
		sanityFetch({ query: offerGroupsPageQuery, stega: false }),
	]);

	if (!department || !groupsPage) {
		return {};
	}

	return getPageMetadata({
		description: groupsPage.metaDescription,
		image: department.cardImage,
		meta: department.meta,
		path: `/angebot/${group}`,
		title: `${department.title} bei der TSG Irlich`,
	});
}

export default async function DepartmentPage({ params }: Readonly<PageProps<'/angebot/[group]'>>) {
	const { group } = await params;

	const [{ data: department }, { data: groupsPage }] = await Promise.all([
		sanityFetch({ params: { slug: group }, query: departmentPageQuery }),
		sanityFetch({ query: offerGroupsPageQuery }),
	]);

	if (!department) {
		// A department that changed its slug stays reachable under the old address. Only a slug no
		// department uses today gets here, so the current owner of a slug never redirects.
		const { data: currentSlug } = await sanityFetch({
			params: { slug: group },
			query: departmentRedirectQuery,
			stega: false,
		});

		if (currentSlug) {
			permanentRedirect(`/angebot/${currentSlug}`);
		}

		notFound();
	}

	if (!groupsPage) {
		notFound();
	}

	const stats = department.stats ?? EMPTY_ARRAY;
	// The persons' phone numbers end up in links and their contact method is compared to literals,
	// so neither may carry stega characters.
	const contactPersons = stegaClean(department.contactPersons ?? EMPTY_ARRAY);

	return (
		<>
			<Hero
				image={getHeroImage(department)}
				subTitle={groupsPage.subtitle}
				title={`${groupsPage.title} ${department.title}`}
			/>
			<Groups
				{...groupsPage.content.groupsSection}
				departmentSlug={group}
				departmentTitle={department.title}
				groups={department.groups}
				intro={department.intro ?? groupsPage.content.groupsSection.intro}
			/>
			{stats.length > 0 && <Stats stats={stats} />}
			{contactPersons.length > 0 && (
				<ContactPersons
					{...groupsPage.content.contactPersonsSection}
					contactPersons={contactPersons}
				/>
			)}
			<Newsletter />
		</>
	);
}
