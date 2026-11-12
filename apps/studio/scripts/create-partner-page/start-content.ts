import { parseArgs } from 'node:util';

const SEPARATOR = '--';

const PARTNER_PAGE_ID = 'drafts.partnerPage';

/** The people of the PR team, in the order the page lists them. */
const CONTACT_PERSON_IDS = [
	'b9c684aa-f914-4c32-8619-fde519d41315',
	'62de97e4-4c14-4336-89f0-615645b28053',
	'7ba77a4c-f4f1-45ca-9b7a-bd8eac97b9e1',
] as const;

/**
 * Builds the start content of the partner page as a draft: the texts of the sponsor page
 * prototype (WEB-326), the inquiry presets and the PR team as contact persons. The hero image is
 * the one of `aboutUs`, handed in so the page looks finished before an editor opens it.
 *
 * @param heroImage - The image object to copy, or `undefined` to leave the field empty.
 * @returns The draft document, ready for `client.create`.
 */
function buildStartContent(heroImage: SanityImageObject | undefined): PartnerPageDraft {
	return {
		_id: PARTNER_PAGE_ID,
		_type: 'partnerPage',
		content: {
			contactPersonsSection: {
				contactPersons: CONTACT_PERSON_IDS.map((id) => ({
					_key: id,
					_ref: id,
					_type: 'reference' as const,
				})),
				intro:
					'Fragen zum Sponsoring oder eine eigene Idee? Unser PR-Team meldet sich persönlich bei dir.',
				subtitle: 'Ansprechpartner',
				title: 'Dein Draht zum PR-Team',
			},
			partnersSection: {
				intro: 'Danke an alle Unternehmen, die unsere Vereinsarbeit möglich machen.',
				ownLogoText: 'Dein Logo hier?',
				subtitle: 'Unsere Partner und Sponsoren',
				title: 'Stark an unserer Seite',
			},
			waysSection: {
				ideaCta: 'Jetzt Kontakt aufnehmen',
				ideaText: 'Du hast eine eigene Idee? Wir schnüren gern ein individuelles Paket.',
				intro:
					'Ob kleiner Betrieb oder großes Unternehmen: Jede Unterstützung hilft. Gemeinsam finden wir die Form, die zu dir passt.',
				subtitle: 'So kannst du uns unterstützen',
				title: 'Viele Wege, ein Ziel',
				ways: [
					{
						_key: 'trikotwerbung',
						_type: 'partnerWay',
						benefits: [
							'Logo auf einem Trikotsatz',
							'Mannschaftsfoto für deine Kanäle',
							'Nennung auf der Website',
						],
						cta: 'Anfragen',
						icon: 'shirt',
						text: 'Dein Logo auf den Trikots einer Mannschaft, sichtbar bei jedem Spiel und jedem Turnier.',
						title: 'Trikotwerbung',
					},
					{
						_key: 'bandenwerbung',
						_type: 'partnerWay',
						benefits: [
							'Bande in bester Sichtlage',
							'Präsenz bei jedem Heimspiel',
							'Nennung auf der Website',
						],
						cta: 'Anfragen',
						icon: 'fence',
						text: 'Eine Werbebande an unserem Sportplatz, bei jedem Heimspiel und jedem Training im Blick.',
						title: 'Bandenwerbung',
					},
					{
						_key: 'online-partner',
						_type: 'partnerWay',
						benefits: [
							'Logo mit Link auf dieser Seite',
							'Erwähnung im Newsletter',
							'Beitrag auf Social Media',
						],
						cta: 'Anfragen',
						icon: 'globe',
						text: 'Dein Logo mit Link auf unserer Website und im Newsletter, das ganze Jahr über.',
						title: 'Online-Partner',
					},
					{
						_key: 'sachspenden',
						_type: 'partnerWay',
						benefits: [
							'Bälle und Trainingsmaterial',
							'Ausrüstung für Teams und Kurse',
							'Verpflegung bei Festen',
						],
						cta: 'Anfragen',
						icon: 'gift',
						text: 'Material, Ausrüstung oder Verpflegung für unsere Veranstaltungen. Jede Hilfe zählt.',
						title: 'Sachspenden',
					},
				],
			},
			whySection: {
				intro:
					'Mit deinem Engagement unterstützt du nicht nur einen Verein. Du förderst Sport, Gemeinschaft und die Zukunft von Kindern und Jugendlichen in Irlich und Neuwied.',
				reasons: [
					{
						_key: 'regionale-sichtbarkeit',
						_type: 'partnerReason',
						icon: 'map-pin',
						text: 'Dein Unternehmen ist dort präsent, wo sich Irlich trifft: am Spielfeldrand, auf den Trikots und bei unseren Festen.',
						title: 'Regionale Sichtbarkeit',
					},
					{
						_key: 'reichweite-online',
						_type: 'partnerReason',
						icon: 'trending-up',
						text: 'Über 100.000 Aufrufe im Monat auf Social Media, dazu Website und Newsletter. Das erreicht mehr Menschen als eine Bande allein.',
						title: 'Reichweite online',
					},
					{
						_key: 'positives-image',
						_type: 'partnerReason',
						icon: 'heart-handshake',
						text: 'Dein Beitrag fließt direkt in Training, Material und Nachwuchsarbeit. So zeigst du Verantwortung für die Region.',
						title: 'Positives Image',
					},
					{
						_key: 'langfristige-partnerschaft',
						_type: 'partnerReason',
						icon: 'handshake',
						text: 'Wir setzen auf Verlässlichkeit statt Einmal-Aktionen und finden gemeinsam das Paket, das zu dir passt.',
						title: 'Langfristige Partnerschaft',
					},
				],
				subtitle: 'Warum Sponsor bei der TSG werden?',
				title: 'Mehr als nur ein Logo',
			},
		},
		inquiry: { email: 'partner@tsg-irlich.de', subject: 'Sponsoring bei der TSG Irlich' },
		slug: { _type: 'slug', current: 'partner' },
		subtitle: 'Gemeinsam stark',
		title: 'Sponsoren & Partner',
		...(heroImage ? { heroImage } : {}),
	};
}

/**
 * Reads the dataset the start content is written to. It has to be named, since the studio's `.env`
 * points the CLI at `production`.
 *
 * @param argv - The arguments after the script path, with or without the leading `--`.
 * @returns The dataset.
 * @throws {Error} For a missing dataset or an unknown option.
 */
function readDataset(argv: readonly string[]): string {
	const { values } = parseArgs({
		args: argv[0] === SEPARATOR ? argv.slice(1) : [...argv],
		options: { dataset: { type: 'string' } },
		strict: true,
	});
	if (!values.dataset) {
		throw new Error('--dataset fehlt, z. B. --dataset development.');
	}
	return values.dataset;
}

/** The image object of `aboutUs.heroImage`: the asset reference plus hotspot and crop if set. */
interface SanityImageObject {
	_type: string;
	asset: { _ref: string; _type: 'reference' };
	crop?: { bottom: number; left: number; right: number; top: number };
	hotspot?: { height: number; width: number; x: number; y: number };
}

interface PartnerCard {
	_key: string;
	icon: string;
	text: string;
	title: string;
}

interface PartnerSectionHeader {
	intro: string;
	subtitle: string;
	title: string;
}

interface PartnerPageDraft {
	_id: typeof PARTNER_PAGE_ID;
	_type: 'partnerPage';
	content: {
		contactPersonsSection: PartnerSectionHeader & {
			contactPersons: { _key: string; _ref: string; _type: 'reference' }[];
		};
		partnersSection: PartnerSectionHeader & { ownLogoText: string };
		waysSection: PartnerSectionHeader & {
			ideaCta: string;
			ideaText: string;
			ways: (PartnerCard & { _type: 'partnerWay'; benefits: string[]; cta: string })[];
		};
		whySection: PartnerSectionHeader & {
			reasons: (PartnerCard & { _type: 'partnerReason' })[];
		};
	};
	heroImage?: SanityImageObject;
	inquiry: { email: string; subject: string };
	slug: { _type: 'slug'; current: string };
	subtitle: string;
	title: string;
}

export { buildStartContent, PARTNER_PAGE_ID, readDataset };
export type { PartnerPageDraft, SanityImageObject };
