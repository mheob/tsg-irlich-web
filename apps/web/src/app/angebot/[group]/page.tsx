import type { Metadata } from 'next';
import { stegaClean } from 'next-sanity';
import { notFound, permanentRedirect } from 'next/navigation';

import { EMPTY_ARRAY } from '@tsgi-web/shared';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import { JsonLd } from '@/components/ui/json-ld';
import { sanityFetch } from '@/lib/sanity/live';
import {
	departmentPageQuery,
	departmentRedirectQuery,
	departmentSlugsQuery,
} from '@/lib/sanity/queries/departments';
import { offerGroupsPageQuery } from '@/lib/sanity/queries/pages/offer-groups';
import { siteImagesQuery } from '@/lib/sanity/queries/shared/site-images';
import { getHeroImage } from '@/utils/hero-image';
import { getPageMetadata } from '@/utils/metadata';
import { getFaqPageSchema } from '@/utils/structured-data';
import { getBaseUrl } from '@/utils/url';

import { Faq } from './_sections/faq';
import { Groups } from './_sections/groups';

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

	const [{ data: department }, { data: groupsPage }, { data: siteImages }] = await Promise.all([
		sanityFetch({ params: { slug: group }, query: departmentPageQuery }),
		sanityFetch({ query: offerGroupsPageQuery }),
		sanityFetch({ query: siteImagesQuery }),
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
	const faqs = department.faqs ?? EMPTY_ARRAY;
	// The structured data gets a copy cleaned of the stega encoding draft mode adds, which leaves
	// the rendered questions and their click-to-edit overlays alone.
	const faqPageSchema = getFaqPageSchema({
		baseUrl: getBaseUrl(),
		faqs: stegaClean(faqs),
		path: `/angebot/${group}`,
	});

	return (
		<>
			{faqPageSchema && <JsonLd data={faqPageSchema} />}
			<Hero
				image={getHeroImage(
					[department.heroImage, department.cardImage, siteImages?.fallbackImage],
					department.title,
				)}
				subTitle={groupsPage.subtitle}
				title={`${groupsPage.title} ${department.title}`}
			/>
			<Groups
				{...groupsPage.content.groupsSection}
				departmentSlug={group}
				departmentTitle={department.title}
				fallbackImage={siteImages?.fallbackImage}
				groups={department.groups}
				intro={department.intro ?? groupsPage.content.groupsSection.intro}
			/>
			{stats.length > 0 && <Stats stats={stats} />}
			{faqs.length > 0 && (
				<Faq {...groupsPage.content.faqSection} departmentTitle={department.title} faqs={faqs} />
			)}
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
