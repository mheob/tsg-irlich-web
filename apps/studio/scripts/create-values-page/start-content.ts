const VALUES_PAGE_ID = 'drafts.valuesPage';

/** The pages the two buttons of the closing section link, in the order they appear. */
const JOIN_TARGETS = [
	{ id: 'membership', title: 'Mitglied werden' },
	{ id: 'volunteerPage', title: 'Ehrenamt entdecken' },
] as const;

/**
 * The published club page, read in the `raw` perspective: its hero image, the first image of its
 * intro and the long vision the values page takes over (WEB-150).
 */
const START_QUERY = `{
	"aboutUs": *[_id == 'aboutUs'][0] {
		heroImage,
		"introImage": content.introSection.images[0],
		"longVision": content.visionSection.longVision.text
	},
	"targets": *[_id in $targets]._id
}`;

/** Icon and core statement of each value, keyed by the heading the long vision gives it. */
const VALUE_DETAILS: Readonly<Partial<Record<string, { icon: string; teaser: string }>>> = {
	Dorfleben: {
		icon: 'party-popper',
		teaser: 'Als mitgliederstärkster Verein im Ort beleben wir die Dorfgemeinschaft.',
	},
	Ehrenamt: {
		icon: 'heart-handshake',
		teaser: 'Engagierte Ehrenamtliche sind das Herzstück unseres Vereins.',
	},
	'Gesellschaftliche Verantwortung': {
		icon: 'graduation-cap',
		teaser: 'Kinder- und Jugendarbeit, die Werte fürs Leben vermittelt.',
	},
	Integration: {
		icon: 'globe',
		teaser: 'Im Verein kommen Nationen, Kulturen und Religionen zusammen.',
	},
	'Sportverein für alle': {
		icon: 'users',
		teaser: 'Sport für die ganze Familie – unabhängig von Alter und Leistungsniveau.',
	},
	Vielfalt: {
		icon: 'heart',
		teaser: 'Eine sportliche Heimat für alle Menschen – eine Kultur der Offenheit.',
	},
};

/** The icon of a value the table above does not know. */
const FALLBACK_ICON = 'star';

/** The quote that follows „Vielfalt“, the first sentence of its text. */
const QUOTES: Readonly<Partial<Record<string, string>>> = {
	Vielfalt: 'Wir glauben an die verbindende Kraft des Sports!',
};

/** The four values the youth work passes on, as the text of „Gesellschaftliche Verantwortung“ names them. */
const HIGHLIGHTS: Readonly<Partial<Record<string, readonly string[]>>> = {
	'Gesellschaftliche Verantwortung': ['Teamgeist', 'Hilfsbereitschaft', 'Respekt', 'Gemeinschaft'],
};

/** The facts the intro of the long vision names. */
const FACTS = [
	{ label: 'gegründet', value: '1882' },
	{ label: 'Mitglieder', value: '~700' },
	{ label: 'Sparten', value: '18' },
	{ label: 'Vereinsfarben', value: 'Blau & Gelb' },
] as const;

const DECORATORS = new Set(['em', 'strong']);

/** `Array.prototype.at` index of the last entry. */
const LAST = -1;

/**
 * The plain text of a block.
 *
 * @param block - A block of the long vision.
 * @returns Its text, or an empty string for anything but a text block.
 */
function getBlockText(block: VisionBlock): string {
	return block._type === 'block'
		? (block.children ?? []).map((child) => child.text ?? '').join('')
		: '';
}

/**
 * Turns a paragraph of the long vision into a block of `simpleBlockContent`, which knows only the
 * normal style and the decorators bold and italic.
 *
 * @param block - A paragraph of the long vision.
 * @returns The block for the value's text.
 */
function toSimpleBlock(block: VisionBlock): SimpleBlock {
	return {
		_key: block._key,
		_type: 'block',
		children: (block.children ?? []).map((child) => ({
			_key: child._key,
			_type: 'span',
			marks: (child.marks ?? []).filter((mark) => DECORATORS.has(mark)),
			text: child.text ?? '',
		})),
		markDefs: [],
		style: 'normal',
	};
}

/**
 * Opens a value at a heading of the long vision, with the icon, core statement, quote and
 * highlights the script knows for its title and an empty text the paragraphs below fill.
 *
 * @param key - The key of the heading, which the value keeps.
 * @param title - The text of the heading.
 * @returns The value.
 */
function toClubValue(key: string, title: string): ClubValue {
	const details = VALUE_DETAILS[title];
	const quote = QUOTES[title];
	const highlights = HIGHLIGHTS[title];

	return {
		_key: key,
		_type: 'clubValue',
		icon: details?.icon ?? FALLBACK_ICON,
		text: { _type: 'simpleBlockContent', text: [] },
		title,
		...(details ? { teaser: details.teaser } : {}),
		...(quote ? { quote } : {}),
		...(highlights ? { highlights: [...highlights] } : {}),
	};
}

/**
 * Splits the long vision at its h3 headings. The paragraphs above the first heading become the
 * intro, every heading opens a value with the paragraphs below it.
 *
 * @param blocks - The text of the long vision.
 * @returns The intro as plain text and the values.
 */
function splitLongVision(blocks: readonly VisionBlock[]): { intro: string; values: ClubValue[] } {
	const intro: string[] = [];
	const values: ClubValue[] = [];

	for (const block of blocks) {
		const text = getBlockText(block);
		const current = values.at(LAST);

		if (block._type === 'block' && block.style === 'h3') {
			values.push(toClubValue(block._key, text));
		} else if (current) {
			current.text.text.push(toSimpleBlock(block));
		} else if (text) {
			intro.push(text);
		}
	}

	return { intro: intro.join('\n\n'), values };
}

/**
 * Drops the `_key` an image carries as a member of an array, since the intro image of the values
 * page is a single field.
 *
 * @param image - The first image of the club page's intro.
 * @returns The same image without its key.
 */
function withoutKey(image: SanityImageObject & { _key?: string }): SanityImageObject {
	const { _key: _ignored, ...rest } = image;
	return rest;
}

/**
 * Builds the start content of the values page as a draft: the long vision of the club page split
 * into the intro and the values, the facts the intro names, the hero image of the club page and
 * the first image of its intro, and a closing section that links the published targets.
 *
 * @param source - The answer of `START_QUERY`.
 * @returns The draft document, or `undefined` when the club page has no long vision to take over.
 */
function buildStartContent(source: StartSource): undefined | ValuesPageDraft {
	const { aboutUs } = source;

	if (!aboutUs?.longVision?.length) {
		return undefined;
	}

	const { heroImage, introImage, longVision } = aboutUs;
	const { intro, values } = splitLongVision(longVision);
	const published = new Set(source.targets);
	const image = introImage ? withoutKey(introImage) : undefined;

	return {
		_id: VALUES_PAGE_ID,
		_type: 'valuesPage',
		content: {
			aboutSection: {
				facts: FACTS.map(({ label, value }, index) => ({
					_key: `fact-${index + 1}`,
					_type: 'valuesFact' as const,
					label,
					value,
				})),
				intro,
				subtitle: 'Wer wir sind',
				title: 'Turn- und Sportgemeinde Irlich 1882 e.V.',
				...(image ? { image } : {}),
			},
			joinSection: {
				links: JOIN_TARGETS.filter(({ id }) => published.has(id)).map(({ id, title }) => ({
					_key: id,
					_type: 'navigationLink' as const,
					link: { _ref: id, _type: 'reference' as const },
					linkType: 'internal' as const,
					title,
				})),
				text: 'Werte entstehen nicht auf dem Papier, sondern auf dem Platz, in der Halle und im Vereinsheim. Mach mit – als Mitglied, im Ehrenamt oder als Teil unserer Gemeinschaft.',
				title: 'Werte leben – mach mit!',
			},
			valuesSection: { tocTitle: 'Inhalt', values },
		},
		slug: { _type: 'slug', current: 'werte' },
		subtitle: 'Unser Leitbild',
		title: 'Unsere Werte',
		...(heroImage ? { heroImage } : {}),
	};
}

/** An image object as Sanity stores it: the asset reference plus alt text, hotspot and crop. */
interface SanityImageObject {
	_type: string;
	alt?: string;
	asset: { _ref: string; _type: 'reference' };
	crop?: { bottom: number; left: number; right: number; top: number };
	hotspot?: { height: number; width: number; x: number; y: number };
}

/** A block of the long vision, as far as the script reads it. */
interface VisionBlock {
	_key: string;
	_type: string;
	children?: { _key: string; _type: string; marks?: string[]; text?: string }[];
	style?: string;
}

interface SimpleBlock {
	_key: string;
	_type: 'block';
	children: { _key: string; _type: 'span'; marks: string[]; text: string }[];
	markDefs: never[];
	style: 'normal';
}

interface ClubValue {
	_key: string;
	_type: 'clubValue';
	highlights?: string[];
	icon: string;
	quote?: string;
	teaser?: string;
	text: { _type: 'simpleBlockContent'; text: SimpleBlock[] };
	title: string;
}

interface StartSource {
	aboutUs: null | {
		heroImage?: null | SanityImageObject;
		introImage?: null | (SanityImageObject & { _key?: string });
		longVision?: null | VisionBlock[];
	};
	targets: string[];
}

interface ValuesPageDraft {
	_id: typeof VALUES_PAGE_ID;
	_type: 'valuesPage';
	content: {
		aboutSection: {
			facts: { _key: string; _type: 'valuesFact'; label: string; value: string }[];
			image?: SanityImageObject;
			intro: string;
			subtitle: string;
			title: string;
		};
		joinSection: {
			links: {
				_key: string;
				_type: 'navigationLink';
				link: { _ref: string; _type: 'reference' };
				linkType: 'internal';
				title: string;
			}[];
			text: string;
			title: string;
		};
		valuesSection: { tocTitle: string; values: ClubValue[] };
	};
	heroImage?: SanityImageObject;
	slug: { _type: 'slug'; current: string };
	subtitle: string;
	title: string;
}

export { buildStartContent, JOIN_TARGETS, START_QUERY, VALUES_PAGE_ID };
export type { StartSource, ValuesPageDraft };
