// PROTOTYPE (WEB-190) — plain GROQ strings on purpose, so TypeGen does not pick them up. The real
// page gets `defineQuery` queries in `src/lib/sanity/queries/` once a variant has won.

import { client } from '@/lib/sanity/client';
import { contactPersons as contactPersonsFragment } from '@/lib/sanity/queries';
import { aboutUsHeroImageQuery } from '@/lib/sanity/queries/pages/about-us';
import { siteImagesQuery } from '@/lib/sanity/queries/shared/site-images';
import { urlForImage } from '@/lib/sanity/utils';
import type { AnyImage, ResolvedImage, SanityImageReference } from '@/types/image.types';
import type { AboutUsHeroImageQueryResult, ContactPerson } from '@/types/sanity.types';
import type { SiteImagesQueryResult } from '@/types/sanity.types.generated';

interface GroupImage {
	featuredImage?: null | (SanityImageReference & { alt?: null | string });
	slug: string;
	title: string;
}

interface VolunteerPageData {
	board: ContactPerson[];
	heroImage: AboutUsHeroImageQueryResult;
	images: Record<string, ResolvedImage | undefined>;
}

// Alexander Hof (Vorsitzender), René Linn (Finanzen), Melina Dinter (Verwaltung), Philipp Pfeiffer
// (Öffentlichkeitsarbeit) — in the order the board is usually listed.
const BOARD_IDS = [
	'2e62c3c7-6d23-4799-9701-a08256d0c1b2',
	'429f8069-7868-4fef-96ca-cfb9d88f68a3',
	'51dfa04b-7577-48d0-9434-a096e0b3ff42',
	'b9c684aa-f914-4c32-8619-fde519d41315',
];

// The group pictures the areas and open positions borrow until they get pictures of their own.
const GROUP_SLUGS = ['1-mannschaft', 'a-jugend', 'f-jugend', 'kinderturnen-ab-3', 'schiedsrichter'];

const IMAGE_SIZE = { height: 900, width: 1200 };

const boardQuery = /* groq */ `
	*[_type == 'person' && _id in $ids] { ${contactPersonsFragment} }
`;

const groupImagesQuery = /* groq */ `
	*[_type == 'group' && slug.current in $slugs] { "slug": slug.current, title, featuredImage }
`;

function resolveImage(
	image: AnyImage | GroupImage['featuredImage'] | undefined,
	fallbackAlt: string,
): ResolvedImage | undefined {
	const src = urlForImage(image, IMAGE_SIZE.height, IMAGE_SIZE.width);
	// oxlint-disable-next-line typescript/prefer-nullish-coalescing -- an empty alt counts as missing
	return image && src ? { alt: image.alt || fallbackAlt, src } : undefined;
}

async function getVolunteerPageData(): Promise<VolunteerPageData> {
	const [persons, heroImage, siteImages, groups] = await Promise.all([
		client.fetch<ContactPerson[]>(boardQuery, { ids: BOARD_IDS }),
		client.fetch<AboutUsHeroImageQueryResult>(aboutUsHeroImageQuery),
		client.fetch<SiteImagesQueryResult>(siteImagesQuery),
		client.fetch<GroupImage[]>(groupImagesQuery, { slugs: GROUP_SLUGS }),
	]);

	const board = BOARD_IDS.map((id) => persons.find((person) => person._id === id)).filter(
		(person): person is ContactPerson => Boolean(person),
	);

	const images: VolunteerPageData['images'] = Object.fromEntries(
		groups.map((group) => [group.slug, resolveImage(group.featuredImage, group.title)]),
	);
	images.fallback = resolveImage(siteImages?.fallbackImage, 'TSG Irlich');
	images.vision = resolveImage(siteImages?.visionImages[0], 'TSG Irlich');

	return { board, heroImage, images };
}

function getMailHref(board: ContactPerson[], subject: string): string {
	const email = board.find((person) => person.email)?.email;
	return email ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : '/kontakt';
}

export { getMailHref, getVolunteerPageData };
export type { VolunteerPageData };
