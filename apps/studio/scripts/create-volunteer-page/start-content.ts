import { BOARD_IDS } from '../shared/board';
import { hasFlag } from '../shared/read-dataset';

const VOLUNTEER_PAGE_ID = 'drafts.volunteerPage';

/** The flag that also writes the four placeholder positions of the prototype. */
const PLACEHOLDER_FLAG = 'with-placeholder-positions';

/** The six reasons of the prototype (WEB-190, `_shared/content.ts`). */
const REASONS = [
	{
		icon: 'users',
		text: 'Du lernst Menschen aus allen Abteilungen kennen und wirst Teil eines Teams, das zusammenhält.',
		title: 'Gemeinschaft',
	},
	{
		icon: 'graduation-cap',
		text: 'Du sammelst Erfahrung, übernimmst Verantwortung und kannst Lizenzen und Fortbildungen machen.',
		title: 'Persönliche Entwicklung',
	},
	{
		icon: 'heart',
		text: 'Du tust etwas Gutes – für Kinder und Jugendliche, für den Verein und für Irlich.',
		title: 'Sinn stiften',
	},
	{
		icon: 'trophy',
		text: 'Du machst Training, Spiele und Kurse erst möglich und begleitest unsere Sportler auf ihrem Weg.',
		title: 'Sport fördern',
	},
	{
		icon: 'lightbulb',
		text: 'Du gestaltest mit, bringst neue Impulse ein und entwickelst den Verein aktiv weiter.',
		title: 'Ideen einbringen',
	},
	{
		icon: 'award',
		text: 'Dein Einsatz wird gesehen und macht einen echten Unterschied – im Verein und in der Region.',
		title: 'Wertschätzung',
	},
] as const;

/** The four areas of the prototype, in the order of the images the script hands in. */
const AREAS = [
	{
		icon: 'dumbbell',
		tasks: ['Training leiten oder unterstützen', 'Mannschaften begleiten', 'Kurse betreuen'],
		text: 'Als Trainer, Übungsleiterin oder Betreuer begleitest du eine Mannschaft oder Gruppe – vom Kinderturnen bis zu den Alten Herren.',
		title: 'Sport & Mannschaften',
	},
	{
		icon: 'flag',
		tasks: ['Spiele leiten', 'Spieltage organisieren', 'Platz und Material betreuen'],
		text: 'Ohne Schiedsrichter kein Spiel. Du pfeifst selbst, hilfst am Spieltag oder kümmerst dich um Platz und Organisation.',
		title: 'Schiedsrichter & Spielbetrieb',
	},
	{
		icon: 'building-2',
		tasks: ['Mitglieder und Finanzen', 'Social Media und TSG-Echo', 'Sponsoring'],
		text: 'Hinter jedem Training steckt Organisation. Du unterstützt den Vorstand bei Verwaltung, Finanzen oder Öffentlichkeitsarbeit.',
		title: 'Verein & Organisation',
	},
	{
		icon: 'party-popper',
		tasks: ['Auf- und Abbau', 'Verpflegung und Kasse', 'Orga-Team'],
		text: 'Ob Sportfest, Turnier oder Weihnachtsfeier – bei unseren Veranstaltungen zählt jede helfende Hand, auch nur für ein paar Stunden.',
		title: 'Veranstaltungen & Helfer',
	},
] as const;

const STEPS = [
	{
		text: 'Per E-Mail, Telefon oder direkt beim Training. Sag uns kurz, was dich interessiert.',
		title: 'Melde dich',
	},
	{
		text: 'Wir treffen uns unverbindlich und finden gemeinsam die Aufgabe, die zu dir passt.',
		title: 'Lerne uns kennen',
	},
	{
		text: 'Du startest in deinem Tempo – mit festen Ansprechpartnern an deiner Seite.',
		title: 'Leg los',
	},
] as const;

/** The four open positions of the prototype. They are placeholders and never go to production. */
const PLACEHOLDER_POSITIONS = [
	{
		area: 'Kinderturnen',
		effort: 'wöchentlich, ca. 2 Std.',
		offer: [
			'Unterstützung bei Lizenz und Fortbildung',
			'Ein herzliches Team',
			'Raum für eigene Ideen',
		],
		profile: ['Freude an der Arbeit mit Kindern', 'Zuverlässigkeit', 'Turnerfahrung ist kein Muss'],
		tasks: [
			'Turnstunden mitgestalten',
			'Geräte auf- und abbauen',
			'Die Übungsleiterin unterstützen',
		],
		teaser:
			'Für unser Kinderturnen suchen wir Unterstützung bei der Gestaltung und Durchführung der Turnstunden für Kinder von 3 bis 6 Jahren.',
		title: 'Übungsleiter/in Kinderturnen',
	},
	{
		area: 'Fußball',
		effort: '2× pro Woche + Spieltage',
		offer: ['Einstieg ins Trainerteam', 'Trainerlehrgänge', 'Teamkleidung'],
		profile: ['Spaß am Fußball', 'Geduld mit Kindern', 'Zeit am Wochenende'],
		tasks: ['Training mitgestalten', 'Kinder zu Spielen begleiten', 'Eltern als Ansprechpartner'],
		teaser:
			'Unsere F-Jugend wächst. Du unterstützt das Trainerteam im Training und begleitest die Kinder zu ihren Spielen am Wochenende.',
		title: 'Co-Trainer/in F-Jugend',
	},
	{
		area: 'Fußball',
		effort: 'nach Absprache',
		offer: ['Neulingslehrgang', 'Pate für die ersten Spiele', 'Aufwandsentschädigung'],
		profile: ['Interesse am Fußball', 'Mut zu Entscheidungen', 'Fairness'],
		tasks: ['Spiele im Kreis leiten', 'Regelkunde auffrischen', 'Den Verein vertreten'],
		teaser:
			'Jeder Verein muss Schiedsrichter stellen. Wir begleiten dich durch den Lehrgang und bei deinen ersten Spielen – Jugendliche und Erwachsene sind willkommen.',
		title: 'Schiedsrichter/in',
	},
	{
		area: 'Vereinsorganisation',
		effort: 'nach Absprache',
		offer: [
			'Einblick in die Vereinsarbeit',
			'Flexible Zeiteinteilung',
			'Ein offenes Vorstandsteam',
		],
		profile: ['Organisationstalent', 'Lust auf Verantwortung', 'Teamgeist'],
		tasks: ['Verwaltung und Finanzen', 'Öffentlichkeitsarbeit', 'Projekte im Verein'],
		teaser:
			'Du möchtest nicht auf dem Platz stehen, sondern den Verein organisatorisch voranbringen? Im Vereinsmanagement gibt es viele Möglichkeiten.',
		title: 'Unterstützung im Vorstand',
	},
] as const;

/**
 * Turns an image of a group or of the site settings into the image of an area, with the area
 * title as alt text until an editor writes a better one.
 *
 * @param source - The image to copy.
 * @param alt - The alt text.
 * @returns The image object of the area.
 */
function toAreaImage(source: SanityImageObject, alt: string): SanityImageObject & { alt: string } {
	return { ...source, _type: 'extendedImage', alt };
}

/**
 * Builds the start content of the volunteer page as a draft: the texts of the prototype (WEB-190),
 * the inquiry presets and the board as contact persons. The images are handed in, so the page
 * looks finished before an editor opens it. No voices: nobody has agreed to be quoted yet.
 *
 * @param images - The hero image and the images of the four areas, in their order.
 * @returns The draft document, ready for `client.create`.
 */
function buildStartContent(images: StartImages): VolunteerPageDraft {
	const { areaImages, heroImage } = images;

	return {
		_id: VOLUNTEER_PAGE_ID,
		_type: 'volunteerPage',
		content: {
			areasSection: {
				areas: AREAS.map((area, index) => {
					const source = areaImages[index];
					const draft: VolunteerAreaDraft = {
						_key: `area-${index + 1}`,
						_type: 'volunteerArea',
						icon: area.icon,
						tasks: [...area.tasks],
						text: area.text,
						title: area.title,
					};
					if (source) {
						draft.image = toAreaImage(source, area.title);
					}
					return draft;
				}),
				intro:
					'Ehrenamt bei der TSG ist vielfältig. Ob regelmäßig oder nur ab und zu, auf dem Platz oder im Hintergrund – jeder Beitrag zählt.',
				subtitle: 'Viele Aufgaben – ein Ziel',
				title: 'So kannst du dich einbringen',
			},
			contactPersonsSection: {
				contactPersons: BOARD_IDS.map((id) => ({
					_key: id,
					_ref: id,
					_type: 'reference' as const,
				})),
				intro:
					'Du hast Fragen zum Ehrenamt oder möchtest direkt loslegen? Unser Vorstand freut sich auf dich.',
				subtitle: 'Ansprechpartner',
				title: 'Dein Vorstand',
			},
			positionsSection: {
				cta: 'Jetzt melden',
				intro:
					'Für einige Bereiche freuen wir uns aktuell besonders über Unterstützung. Vielleicht ist ja genau die richtige Aufgabe für dich dabei?',
				offerHeading: 'Das bieten wir',
				otherText: 'Erzähl uns, was du dir vorstellen kannst – wir finden etwas für dich.',
				otherTitle: 'Nichts Passendes dabei?',
				profileHeading: 'Das bringst du mit',
				steps: STEPS.map(({ text, title }, index) => ({
					_key: `step-${index + 1}`,
					_type: 'volunteerStep' as const,
					text,
					title,
				})),
				subtitle: 'Aktuell gesucht',
				tasksHeading: 'Deine Aufgaben',
				title: 'Wir suchen Verstärkung',
			},
			voicesSection: {
				intro: 'Warum wir uns bei der TSG engagieren – in unseren eigenen Worten.',
				subtitle: 'Stimmen aus dem Verein',
				title: 'Darum machen wir mit',
			},
			whySection: {
				cta: 'Offene Aufgaben ansehen',
				intro:
					'Ehrenamt bedeutet nicht nur, Aufgaben zu übernehmen. Du wirst Teil einer starken Gemeinschaft, entwickelst dich weiter und hältst unseren Verein lebendig – auf und neben dem Platz.',
				reasons: REASONS.map(({ icon, text, title }, index) => ({
					_key: `reason-${index + 1}`,
					_type: 'volunteerReason' as const,
					icon,
					text,
					title,
				})),
				subtitle: 'Warum engagieren?',
				title: 'Gemeinsam mehr erreichen',
			},
		},
		inquiry: { email: 'info@tsg-irlich.de', subject: 'Ehrenamt bei der TSG Irlich' },
		slug: { _type: 'slug', current: 'ehrenamt' },
		subtitle: 'Ehrenamt bei der TSG',
		title: 'Engagiere dich',
		...(heroImage ? { heroImage } : {}),
	};
}

/**
 * Builds the four open positions of the prototype as drafts. They are placeholders for
 * `development`, the e2e fixtures and screenshots, and never go to production.
 *
 * @returns The drafts, ready for `client.createIfNotExists`.
 */
function buildPlaceholderPositions(): VolunteerPositionDraft[] {
	return PLACEHOLDER_POSITIONS.map((position, index) => ({
		_id: `drafts.volunteer-position-placeholder-${index + 1}`,
		_type: 'volunteer.position',
		area: position.area,
		effort: position.effort,
		offer: [...position.offer],
		profile: [...position.profile],
		tasks: [...position.tasks],
		teaser: position.teaser,
		title: position.title,
	}));
}

/** The groups whose card images stand in for the first two areas, in the order of the areas. */
const AREA_GROUP_SLUGS = ['1-mannschaft', 'a-jugend'] as const;

/**
 * What the script reads for the images of the start content: the hero image of `aboutUs`, the card
 * images of the groups in `AREA_GROUP_SLUGS` and two images of the site settings. `$slugs` takes
 * `AREA_GROUP_SLUGS`. Drafts are left out, so a draft image never reaches the page.
 */
const START_IMAGES_QUERY = `{
	"heroImage": *[_id == 'aboutUs'][0].heroImage,
	"groups": *[_type == 'group' && !(_id in path('drafts.**')) && slug.current in $slugs] {
		"slug": slug.current,
		featuredImage
	},
	"site": *[_type == 'site-settings' && !(_id in path('drafts.**'))][0] {
		fallbackImage,
		"vision": visionImages[0]
	}
}`;

/**
 * Puts the images the script read into the order of the areas: the two group images, the fallback
 * image, the first vision image. A missing image leaves its place empty.
 *
 * @param result - The answer to `START_IMAGES_QUERY`.
 * @returns The images for `buildStartContent`.
 */
function toStartImages(result: StartImagesResult): StartImages {
	const groupImage = (slug: string): SanityImageObject | undefined =>
		result.groups.find((group) => group.slug === slug)?.featuredImage ?? undefined;

	return {
		areaImages: [
			...AREA_GROUP_SLUGS.map((slug) => groupImage(slug)),
			result.site?.fallbackImage ?? undefined,
			result.site?.vision ?? undefined,
		],
		...(result.heroImage ? { heroImage: result.heroImage } : {}),
	};
}

/**
 * Stops the script before it writes anything when placeholder positions are asked for production.
 *
 * @param dataset - The dataset the script writes to.
 * @param withPlaceholders - Whether `--with-placeholder-positions` is given.
 * @throws {Error} For placeholders in production.
 */
function assertPlaceholdersAllowed(dataset: string, withPlaceholders: boolean): void {
	if (withPlaceholders && dataset === 'production') {
		throw new Error('Platzhalter-Aufgaben gehören nicht nach production.');
	}
}

/**
 * Tells whether the script should also write the placeholder positions.
 *
 * @param argv - The arguments after the script path, with or without the leading `--`.
 * @returns `true` with `--with-placeholder-positions`.
 */
function hasPlaceholderFlag(argv: readonly string[]): boolean {
	return hasFlag(argv, PLACEHOLDER_FLAG);
}

/** An image object as Sanity stores it: the asset reference plus hotspot and crop if set. */
interface SanityImageObject {
	_type: string;
	asset: { _ref: string; _type: 'reference' };
	crop?: { bottom: number; left: number; right: number; top: number };
	hotspot?: { height: number; width: number; x: number; y: number };
}

interface StartImagesResult {
	groups: { featuredImage: null | SanityImageObject; slug: string }[];
	heroImage: null | SanityImageObject;
	site: null | { fallbackImage: null | SanityImageObject; vision: null | SanityImageObject };
}

interface StartImages {
	areaImages: readonly (SanityImageObject | undefined)[];
	heroImage?: SanityImageObject;
}

interface SectionHeader {
	intro: string;
	subtitle: string;
	title: string;
}

interface VolunteerAreaDraft {
	_key: string;
	_type: 'volunteerArea';
	icon: string;
	image?: SanityImageObject & { alt: string };
	tasks: string[];
	text: string;
	title: string;
}

interface VolunteerPageDraft {
	_id: typeof VOLUNTEER_PAGE_ID;
	_type: 'volunteerPage';
	content: {
		areasSection: SectionHeader & { areas: VolunteerAreaDraft[] };
		contactPersonsSection: SectionHeader & {
			contactPersons: { _key: string; _ref: string; _type: 'reference' }[];
		};
		positionsSection: SectionHeader & {
			cta: string;
			offerHeading: string;
			otherText: string;
			otherTitle: string;
			profileHeading: string;
			steps: { _key: string; _type: 'volunteerStep'; text: string; title: string }[];
			tasksHeading: string;
		};
		voicesSection: SectionHeader;
		whySection: SectionHeader & {
			cta: string;
			reasons: {
				_key: string;
				_type: 'volunteerReason';
				icon: string;
				text: string;
				title: string;
			}[];
		};
	};
	heroImage?: SanityImageObject;
	inquiry: { email: string; subject: string };
	slug: { _type: 'slug'; current: string };
	subtitle: string;
	title: string;
}

interface VolunteerPositionDraft {
	_id: string;
	_type: 'volunteer.position';
	area: string;
	effort: string;
	offer: string[];
	profile: string[];
	tasks: string[];
	teaser: string;
	title: string;
}

export {
	AREA_GROUP_SLUGS,
	assertPlaceholdersAllowed,
	buildPlaceholderPositions,
	buildStartContent,
	hasPlaceholderFlag,
	PLACEHOLDER_FLAG,
	START_IMAGES_QUERY,
	toStartImages,
	VOLUNTEER_PAGE_ID,
};
export type { StartImagesResult, VolunteerPageDraft, VolunteerPositionDraft };
