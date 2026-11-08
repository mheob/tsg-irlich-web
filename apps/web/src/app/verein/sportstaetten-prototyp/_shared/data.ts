// PROTOTYPE (WEB-149) — plain GROQ strings on purpose, so TypeGen does not pick them up. The real
// page gets `defineQuery` queries in `src/lib/sanity/queries/` once a variant has won.

import { client } from '@/lib/sanity/client';
import { contactPersons as contactPersonsFragment } from '@/lib/sanity/queries';
import type { AnyImage } from '@/types/image.types';
import type { ContactPerson, SimpleBlockContent, TrainingTime } from '@/types/sanity.types';

type VenueType = 'artificial-turf' | 'cinder' | 'grass' | 'hall-1' | 'hall-2' | 'hall-3' | 'hybrid';

interface VenueLocation {
	city: string;
	houseNumber: string;
	name: string;
	street: string;
	zipCode?: string;
}

interface VenueGroup {
	_id: string;
	department?: null | string;
	departmentTitle?: null | string;
	slug: string;
	times: Pick<TrainingTime, 'endTime' | 'season' | 'startTime' | 'weekday'>[];
	title: string;
}

interface Venue {
	_id: string;
	description?: null | SimpleBlockContent['text'];
	groups: VenueGroup[];
	location?: null | VenueLocation;
	mainImage?: AnyImage | null;
	title: string;
	type: VenueType;
}

interface VenuePageData {
	boardMembers: ContactPerson[];
	fields: Venue[];
	halls: Venue[];
	stadium?: Venue;
	clubhouse?: Venue;
}

// Every group that trains at a venue, with only the training times it spends there. `^` is the
// group inside the filter of its training times, `^.^` the venue.
const venuesQuery = /* groq */ `
	*[_type == 'venue'] | order(title asc) {
		_id,
		title,
		type,
		mainImage,
		location,
		"description": description.text,
		"groups": *[_type == 'group' && references(^._id) && defined(slug.current)] | order(title asc) {
			_id,
			title,
			"slug": slug.current,
			"department": department->slug.current,
			"departmentTitle": department->title,
			"times": training.trainingTimes[venue._ref == ^.^._id] { weekday, startTime, endTime, season }
		}
	}
`;

// The board as the club page lists it, without the department heads.
const boardQuery = /* groq */ `
	*[_type == 'aboutUs'][0].content.contactPersonsSection.contactPersons[]-> { ${contactPersonsFragment} }
`;

const STADIUM_ID = '2f1440fa-d543-427b-8792-d891e29000d8';
const CLUBHOUSE_ID = '968c56f9-7a9c-462f-be2b-8f269075b007';

function isBoardRole(role?: null | string): boolean {
	return role === 'Vorsitzender' || Boolean(role?.startsWith('Vorstand'));
}

async function getVenuePageData(): Promise<VenuePageData> {
	const [venues, persons] = await Promise.all([
		client.fetch<Venue[]>(venuesQuery),
		client.fetch<ContactPerson[] | null>(boardQuery),
	]);

	const others = venues.filter((venue) => venue._id !== STADIUM_ID && venue._id !== CLUBHOUSE_ID);

	return {
		boardMembers: (persons ?? []).filter((person) => isBoardRole(person.role)),
		clubhouse: venues.find((venue) => venue._id === CLUBHOUSE_ID),
		fields: others.filter((venue) => !venue.type.startsWith('hall')),
		halls: others.filter((venue) => venue.type.startsWith('hall')),
		stadium: venues.find((venue) => venue._id === STADIUM_ID),
	};
}

function getBoardMailHref(boardMembers: ContactPerson[], subject: string): string {
	const email = boardMembers.find((person) => person.email)?.email;
	return email ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : '/kontakt';
}

export { getBoardMailHref, getVenuePageData };
export type { Venue, VenueGroup, VenueLocation, VenuePageData };
