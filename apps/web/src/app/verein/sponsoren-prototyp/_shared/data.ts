// PROTOTYPE (WEB-326) — plain GROQ strings on purpose, so TypeGen does not pick them up. The real
// page gets `defineQuery` queries in `src/lib/sanity/queries/` once a variant has won.

import { client } from '@/lib/sanity/client';
import { contactPersons as contactPersonsFragment } from '@/lib/sanity/queries';
import { aboutUsHeroImageQuery } from '@/lib/sanity/queries/pages/about-us';
import type { SanityImageReference } from '@/types/image.types';
import type { AboutUsHeroImageQueryResult, ContactPerson, Stats } from '@/types/sanity.types';

interface Sponsor {
	_id: string;
	logo?: null | SanityImageReference;
	name: string;
	website?: null | string;
}

interface SponsorPageData {
	contactPersons: ContactPerson[];
	heroImage: AboutUsHeroImageQueryResult;
	sponsors: Sponsor[];
	stats: (Stats & { _key: string })[];
}

// Philipp Pfeiffer (Vorstand Öffentlichkeitsarbeit), Louisa Krechel and Sophie Thomé (PR-Team).
const PR_TEAM_IDS = [
	'b9c684aa-f914-4c32-8619-fde519d41315',
	'62de97e4-4c14-4336-89f0-615645b28053',
	'7ba77a4c-f4f1-45ca-9b7a-bd8eac97b9e1',
];

const sponsorsWithWebsiteQuery = /* groq */ `
	*[_type == 'sponsors'] { _id, name, website, logo } | order(name asc)
`;

const prTeamQuery = /* groq */ `
	*[_type == 'person' && _id in $ids] { ${contactPersonsFragment} }
`;

const aboutUsStatsQuery = /* groq */ `*[_type == 'aboutUs'][0].content.stats`;

async function getSponsorPageData(): Promise<SponsorPageData> {
	const [sponsors, persons, heroImage, stats] = await Promise.all([
		client.fetch<Sponsor[]>(sponsorsWithWebsiteQuery),
		client.fetch<ContactPerson[]>(prTeamQuery, { ids: PR_TEAM_IDS }),
		client.fetch<AboutUsHeroImageQueryResult>(aboutUsHeroImageQuery),
		client.fetch<SponsorPageData['stats'] | null>(aboutUsStatsQuery),
	]);

	const contactPersons = PR_TEAM_IDS.map((id) =>
		persons.find((person) => person._id === id),
	).filter((person): person is ContactPerson => Boolean(person));

	return { contactPersons, heroImage, sponsors, stats: stats ?? [] };
}

function getMailHref(contactPersons: ContactPerson[], subject: string): string {
	const email = contactPersons.find((person) => person.email)?.email;
	return email ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : '/kontakt';
}

function getHostname(url?: null | string): string | undefined {
	if (!url) {
		return undefined;
	}
	return URL.canParse(url) ? new URL(url).hostname.replace(/^www\./u, '') : undefined;
}

export { getHostname, getMailHref, getSponsorPageData };
export type { Sponsor, SponsorPageData };
