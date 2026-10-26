import type { Metadata } from 'next';

import { Hero } from '@/components/section/hero';
import { FeedbackForm } from '@/components/with-logic/feedback/form';
import { client } from '@/lib/sanity/client';
import { contactHeroImageQuery } from '@/lib/sanity/queries/pages/contact';
import type { ContactHeroImageQueryResult } from '@/types/sanity.types';
import { getPageHeroImage } from '@/utils/hero-image';
import { getPageMetadata } from '@/utils/metadata';

const TITLE = 'Feedback abgeben';

export async function generateMetadata(): Promise<Metadata> {
	const heroImage = await client.fetch<ContactHeroImageQueryResult>(contactHeroImageQuery);

	return getPageMetadata({
		description:
			'Fehler gefunden, eine Idee oder eine Frage zur Website? Sag es uns, dein Feedback landet direkt beim Website-Team der TSG Irlich.',
		image: heroImage,
		path: '/kontakt/feedback',
		title: 'Feedback zur Website',
	});
}

export default async function Page() {
	// The page has no document of its own and shows the hero image of the contact page.
	const heroImage = await client.fetch<ContactHeroImageQueryResult>(contactHeroImageQuery);

	return (
		<>
			<Hero image={getPageHeroImage(heroImage, TITLE)} subTitle="Feedback" title={TITLE} />
			<FeedbackForm />
		</>
	);
}
