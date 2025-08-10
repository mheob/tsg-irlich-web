import type { Metadata } from 'next';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { client } from '@/lib/sanity/client';
import {
	offerGroupsGroupPageContactPersonsQuery,
	offerGroupsGroupPageQuery,
} from '@/lib/sanity/queries/pages/offer-groups-group';
import type { PageProps } from '@/types/common';
import { getOGImage } from '@/utils/groups';

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
	const { singleGroup } = await params;

	const [page, coaches] = await Promise.all([
		client.fetch(offerGroupsGroupPageQuery),
		client.fetch(offerGroupsGroupPageContactPersonsQuery, { slug: singleGroup }),
	]);

	if (!page) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	return (
		<>
			<Hero subTitle={page.subtitle} title={page.title} />
			<ContactPersons {...page.content.contactPersonsSection} contactPersons={coaches} />
			<Newsletter />
		</>
	);
}
