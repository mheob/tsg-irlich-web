/** A file of the image folder and the alt text it gets in the studio. */
interface ImageFile {
	alt: string;
	fileName: string;
}

/** An image field the migration fills, with the files it puts there. */
interface PageImageTarget {
	documentType: string;
	field: string;
	images: readonly ImageFile[];
	/** A list of images (`visionImages`, `contactFormImages`) rather than a single one. */
	isList: boolean;
}

const OFFER_IMAGE: ImageFile = {
	alt: 'Sporthalle mit drei verschiedenen Trainingsgruppen: Links üben Kinder und ein Trainer in weißen Taekwondo-Anzügen mit schwarzem Gürtel synchrone Kicks, in der Mitte zeigen Mädchen in türkis-blauen Gymnastik-Trikots mit bunten Federn eine Beinübung, und rechts spielen Kinder unter Anleitung von Trainern in dunkelblauen Shirts Fußball auf einer grünen Kunstrasenfläche. Im Hintergrund sind bunte Gymnastikbälle und Sportgeräte zu sehen.',
	fileName: 'angebot-hero.webp',
};

// The legal pages showed the same file as the contact page.
const CONTACT_IMAGE: ImageFile = {
	alt: 'Ein MacBook auf einem Schreibtisch zeigt das Kontaktformular der TSG Irlich, daneben ein Festnetztelefon und eine kabellose Maus, im Hintergrund ein unscharfes Büro',
	fileName: 'kontakt-hero.webp',
};

/**
 * Hero image of a single page.
 *
 * @param documentType - The type of the page document.
 * @param image - The file and its alt text.
 * @returns The target.
 */
function heroImage(documentType: string, image: ImageFile): PageImageTarget {
	return { documentType, field: 'heroImage', images: [image], isList: false };
}

/**
 * The images that lived in the web app until WEB-389, with the alt texts from its code. Where that
 * text described another picture (the heroes of the club, membership and contact pages), it is
 * replaced by one that describes the file.
 */
const PAGE_IMAGE_TARGETS: readonly PageImageTarget[] = [
	heroImage('home', {
		alt: 'Eine Taekwondo-Sportlerin, eine Tänzerin und ein Fußballer der TSG Irlich',
		fileName: 'home-hero.webp',
	}),
	heroImage('departmentsPage', OFFER_IMAGE),
	heroImage('aboutUs', {
		alt: 'Luftaufnahme des Vereinsheims „Pappelstübchen“ der TSG Irlich mit Terrasse, Tischen und Sonnenschirmen, dahinter Bäume und der Sportplatz',
		fileName: 'verein-hero.webp',
	}),
	heroImage('membership', {
		alt: 'Zwei Personen geben sich über einem Schreibtisch mit Klemmbrett und Kugelschreiber die Hand',
		fileName: 'mitgliedschaft-hero.webp',
	}),
	heroImage('contact', CONTACT_IMAGE),
	heroImage('imprint', CONTACT_IMAGE),
	heroImage('privacy', CONTACT_IMAGE),
	heroImage('accessibility', CONTACT_IMAGE),
	heroImage('newsOverview', {
		alt: 'Ein Handy und ein Kugelschreiber auf einer Zeitung sollen eine Nachrichtenübersicht darstellen.',
		fileName: 'news-hero.webp',
	}),
	{
		documentType: 'site-settings',
		field: 'visionImages',
		images: [
			{
				alt: 'Scheck-Übergabe: TSG Irlich überreicht 250 Euro Spende zum Wiederaufbau des Engerser Lockschuppens.',
				fileName: 'vision-1.webp',
			},
			{
				alt: "Tanzgruppe 'Funky Diamonds' der TSG Irlich präsentiert eine Choreografie in rot-weißen Kostümen auf der Bühne",
				fileName: 'vision-2.webp',
			},
			{
				alt: 'Jugend-Fußballmannschaft der TSG Irlich in gelb-blauen Trikots steht Arm in Arm auf dem Sportplatz',
				fileName: 'vision-3.webp',
			},
		],
		isList: true,
	},
	{
		documentType: 'site-settings',
		field: 'contactFormImages',
		images: [
			{
				alt: "'FUNKY DIAMONDS'-Spielerin mit geflochtener Frisur und Pferdeschwanz in schwarzem Trikot und Rückennummer 6, telefoniert während eines Spiels.",
				fileName: 'contact-form-1.webp',
			},
			{
				alt: 'Gruppe der TSG Irlich in blauen Trikots posiert für ein Mannschaftsfoto auf dem Spielfeld, während eine Fotografin in schwarzem Kleid mit Kamera auf Stativ das Foto macht.',
				fileName: 'contact-form-2.webp',
			},
			{
				alt: 'PR-Team-Mitglied der TSG Irlich in blau-weißem Vereinstrikot mit Kamera auf Stativ bei der Arbeit im Freien.',
				fileName: 'contact-form-3.webp',
			},
		],
		isList: true,
	},
	{ documentType: 'site-settings', field: 'fallbackImage', images: [OFFER_IMAGE], isList: false },
];

export { PAGE_IMAGE_TARGETS };
export type { ImageFile, PageImageTarget };
