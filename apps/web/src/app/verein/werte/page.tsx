import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Hero } from '@/components/section/hero';
import { client } from '@/lib/sanity/client';
import { valuesPageQuery } from '@/lib/sanity/queries/pages/values';
import type { ValuesPageQueryResult } from '@/types/sanity.types';
import { getPageHeroImage } from '@/utils/hero-image';
import { VALUES_PAGE_PATH } from '@/utils/links';
import { getPageMetadata } from '@/utils/metadata';

import { About } from './_sections/about';
import { Join } from './_sections/join';
import { Values } from './_sections/values';

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch<ValuesPageQueryResult>(valuesPageQuery);

	if (!page) {
		return {};
	}

	return getPageMetadata({
		// Without a meta description of the editors, the intro of „Wer wir sind“ describes the page.
		description: page.content.aboutSection?.intro,
		image: page.heroImage,
		meta: page.meta,
		path: VALUES_PAGE_PATH,
		title: page.title,
	});
}

/**
 * „Unsere Werte“ (WEB-150): the mission statement of the club. No menu lists it; the vision
 * sections of the home and the club page link it.
 *
 * @returns The page.
 */
export default async function ValuesPage() {
	const page = await client.fetch<ValuesPageQueryResult>(valuesPageQuery);

	if (!page) {
		notFound();
	}

	const { aboutSection, joinSection, valuesSection } = page.content;

	return (
		<>
			<Hero
				image={getPageHeroImage(page.heroImage, page.title)}
				subTitle={page.subtitle}
				title={page.title}
			/>
			{aboutSection && <About section={aboutSection} />}
			{valuesSection && <Values section={valuesSection} />}
			{joinSection && <Join section={joinSection} />}
		</>
	);
}
