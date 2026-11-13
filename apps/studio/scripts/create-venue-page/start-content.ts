import { BOARD_IDS } from '../shared/board';

const VENUE_PAGE_ID = 'drafts.venuePage';

/**
 * The two home venues, Pappelstadion first: the first one carries the turf box. The only place
 * outside the datasets that names them; the website reads them from the singleton.
 */
const HOME_VENUE_IDS = [
	'2f1440fa-d543-427b-8792-d891e29000d8',
	'968c56f9-7a9c-462f-be2b-8f269075b007',
] as const;

/** The published home venues with their image; the script reads in the `raw` perspective. */
const START_QUERY = `*[_id in $ids && !(_id in path('drafts.**'))] { _id, mainImage }`;

/**
 * Builds the start content of the venue page as a draft: the texts of the prototype (WEB-149),
 * the inquiry presets, Pappelstadion and Pappelstübchen as home venues and the board as contact
 * persons. Equipment and opening hours live on the venues, so the script leaves them alone.
 *
 * @param heroImage - The image of the Pappelstadion, if it has one.
 * @returns The draft document, ready for `client.create`.
 */
function buildStartContent(heroImage?: SanityImageObject): VenuePageDraft {
	return {
		_id: VENUE_PAGE_ID,
		_type: 'venuePage',
		content: {
			contactPersonsSection: {
				contactPersons: BOARD_IDS.map((id) => ({
					_key: id,
					_ref: id,
					_type: 'reference' as const,
				})),
				intro:
					'Fragen zu unseren Sportstätten, zur Nutzung oder eine Idee für den Platz? Der Vorstand ist gern für dich da.',
				subtitle: 'Ansprechpartner',
				title: 'Dein Draht zum Vorstand',
			},
			homeSection: {
				intro:
					'Im Pappelstadion schlägt das Herz der TSG: Hier trainieren und spielen unsere Fußballteams, und gleich nebenan trifft sich der ganze Verein im Pappelstübchen.',
				subtitle: 'Unsere Heimat',
				title: 'Pappelstadion & Pappelstübchen',
				turfBox: {
					linkText: 'Sprich uns an, wenn du helfen willst',
					text: 'Seit vielen Jahren kämpfen wir für einen Kunstrasenplatz im Pappelstadion. Er würde den Spielbetrieb wetterunabhängig machen und unseren Nachwuchs stärken.',
					title: 'Unser Traum: Kunstrasen',
				},
				venues: HOME_VENUE_IDS.map((id) => ({
					_key: id,
					_ref: id,
					_type: 'reference' as const,
				})),
			},
			othersSection: {
				intro:
					'Nicht alle Gruppen passen ins Pappelstadion. Unsere Kurse, die Breitensportgruppen und viele Jugendteams trainieren in Hallen und auf Plätzen in Irlich und der Nachbarschaft.',
				subtitle: 'Alle weiteren Sportanlagen',
				title: 'Hier sind wir außerdem aktiv',
			},
		},
		inquiry: { email: 'info@tsg-irlich.de', subject: 'Frage zu den Sportstätten der TSG Irlich' },
		slug: { _type: 'slug', current: 'sportstaetten' },
		subtitle: 'Hier spielt die TSG',
		title: 'Sportstätten',
		...(heroImage ? { heroImage } : {}),
	};
}

/**
 * Checks that both home venues are published and picks the image of the Pappelstadion as hero
 * image. The draft references them, so it may not go out without them.
 *
 * @param venues - The answer of `START_QUERY`.
 * @returns The hero image, or `undefined` when a home venue is missing.
 */
function resolveStartVenues(
	venues: readonly StartVenue[],
): undefined | { heroImage?: SanityImageObject } {
	const found = new Set(venues.map(({ _id }) => _id));

	if (!HOME_VENUE_IDS.every((id) => found.has(id))) {
		return undefined;
	}

	const stadium = venues.find(({ _id }) => _id === HOME_VENUE_IDS[0]);

	return { heroImage: stadium?.mainImage ?? undefined };
}

/** An image object as Sanity stores it: the asset reference plus alt text, hotspot and crop. */
interface SanityImageObject {
	_type: string;
	alt?: string;
	asset: { _ref: string; _type: 'reference' };
	crop?: { bottom: number; left: number; right: number; top: number };
	hotspot?: { height: number; width: number; x: number; y: number };
}

interface StartVenue {
	_id: string;
	mainImage: null | SanityImageObject;
}

interface SectionHeader {
	intro: string;
	subtitle: string;
	title: string;
}

interface Reference {
	_key: string;
	_ref: string;
	_type: 'reference';
}

interface VenuePageDraft {
	_id: typeof VENUE_PAGE_ID;
	_type: 'venuePage';
	content: {
		contactPersonsSection: SectionHeader & { contactPersons: Reference[] };
		homeSection: SectionHeader & {
			turfBox: { linkText: string; text: string; title: string };
			venues: Reference[];
		};
		othersSection: SectionHeader;
	};
	heroImage?: SanityImageObject;
	inquiry: { email: string; subject: string };
	slug: { _type: 'slug'; current: string };
	subtitle: string;
	title: string;
}

export { buildStartContent, HOME_VENUE_IDS, resolveStartVenues, START_QUERY, VENUE_PAGE_ID };
export type { StartVenue, VenuePageDraft };
