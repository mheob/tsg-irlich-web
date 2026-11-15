// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { buildStartContent, JOIN_TARGETS, START_QUERY, VALUES_PAGE_ID } from './start-content';
import type { StartSource } from './start-content';

const HERO_IMAGE = {
	_type: 'image',
	alt: 'Das Pappelstübchen von oben',
	asset: { _ref: 'image-hero-4094x2160-webp', _type: 'reference' as const },
};

const INTRO_IMAGE = {
	_key: 'intro-1',
	_type: 'extendedImage',
	alt: 'Taekwondo Duell',
	asset: { _ref: 'image-intro-3200x4000-jpg', _type: 'reference' as const },
};

function block(key: string, text: string, style = 'normal') {
	return {
		_key: key,
		_type: 'block',
		children: [{ _key: `${key}-span`, _type: 'span', marks: [] as string[], text }],
		markDefs: [],
		style,
	};
}

/** A paragraph with a bold span that also carries the key of a link annotation. */
const MARKED_BLOCK = {
	...block('all-1', 'Ein Verein für die ganze Familie.'),
	children: [
		{
			_key: 'all-1-span',
			_type: 'span',
			marks: ['strong', 'internal-link-key'],
			text: 'Ein Verein für die ganze Familie.',
		},
	],
};

const LONG_VISION = [
	block('intro', 'Die TSG Irlich wurde 1882 gegründet.'),
	block('h-all', 'Sportverein für alle', 'h3'),
	MARKED_BLOCK,
	block('h-diversity', 'Vielfalt', 'h3'),
	block('diversity-1', 'Wir glauben an die verbindende Kraft des Sports!\nDeshalb …'),
	block('h-responsibility', 'Gesellschaftliche Verantwortung', 'h3'),
	block('responsibility-1', 'Kinder- und Jugendarbeit.'),
	block('responsibility-2', 'Persönlichkeit zählt.'),
	block('h-new', 'Neuer Wert', 'h3'),
];

function source(overrides: Partial<StartSource> = {}): StartSource {
	return {
		aboutUs: { heroImage: HERO_IMAGE, introImage: INTRO_IMAGE, longVision: LONG_VISION },
		targets: ['membership', 'volunteerPage'],
		...overrides,
	};
}

function draftOf(overrides: Partial<StartSource> = {}) {
	const draft = buildStartContent(source(overrides));

	if (!draft) {
		throw new Error('Expected a draft');
	}

	return draft;
}

describe('values page start content', () => {
	it('writes the draft of the singleton with its fixed slug and hero texts', () => {
		expect(draftOf()).toMatchObject({
			_id: VALUES_PAGE_ID,
			_type: 'valuesPage',
			heroImage: HERO_IMAGE,
			slug: { _type: 'slug', current: 'werte' },
			subtitle: 'Unser Leitbild',
			title: 'Unsere Werte',
		});
		expect(VALUES_PAGE_ID).toBe('drafts.valuesPage');
	});

	it('takes the paragraphs above the first heading as the intro', () => {
		expect(draftOf().content.aboutSection).toMatchObject({
			intro: 'Die TSG Irlich wurde 1882 gegründet.',
			subtitle: 'Wer wir sind',
			title: 'Turn- und Sportgemeinde Irlich 1882 e.V.',
		});
	});

	it('states today’s 14 departments where the long vision still names another number', () => {
		const draft = draftOf({
			aboutUs: {
				longVision: [
					block('intro', 'Die TSG bietet ein Sportangebot in 18 verschiedenen Sparten.'),
					block('h-all', 'Sportverein für alle', 'h3'),
				],
			},
		});

		expect(draft.content.aboutSection.intro).toBe(
			'Die TSG bietet ein Sportangebot in 14 verschiedenen Sparten.',
		);
	});

	it('uses the first intro image of the club page without its array key', () => {
		expect(draftOf().content.aboutSection.image).toStrictEqual({
			_type: 'extendedImage',
			alt: 'Taekwondo Duell',
			asset: INTRO_IMAGE.asset,
		});
	});

	it('names the four facts of the intro', () => {
		expect(
			draftOf().content.aboutSection.facts.map(({ label, value }) => `${value} ${label}`),
		).toStrictEqual([
			'1882 gegründet',
			'~700 Mitglieder',
			'14 Sparten',
			'Blau & Gelb Vereinsfarben',
		]);
	});

	it('opens a value at every h3 heading, keeping its order', () => {
		expect(draftOf().content.valuesSection.values.map(({ title }) => title)).toStrictEqual([
			'Sportverein für alle',
			'Vielfalt',
			'Gesellschaftliche Verantwortung',
			'Neuer Wert',
		]);
	});

	it('moves the paragraphs below a heading into its value as plain blocks', () => {
		const responsibility = draftOf().content.valuesSection.values.at(2);

		expect(responsibility?.text.text.map(({ children }) => children[0]?.text)).toStrictEqual([
			'Kinder- und Jugendarbeit.',
			'Persönlichkeit zählt.',
		]);
	});

	it('keeps bold and italic but drops every other mark', () => {
		const all = draftOf().content.valuesSection.values.at(0);

		expect(all?.text.text[0]).toStrictEqual({
			_key: 'all-1',
			_type: 'block',
			children: [
				{
					_key: 'all-1-span',
					_type: 'span',
					marks: ['strong'],
					text: 'Ein Verein für die ganze Familie.',
				},
			],
			markDefs: [],
			style: 'normal',
		});
	});

	it('gives a known value its icon and core statement', () => {
		expect(draftOf().content.valuesSection.values[0]).toMatchObject({
			icon: 'users',
			teaser: 'Sport für die ganze Familie – unabhängig von Alter und Leistungsniveau.',
		});
	});

	it('puts the quote after „Vielfalt“ and the four highlights into „Gesellschaftliche Verantwortung“', () => {
		const { values } = draftOf().content.valuesSection;
		const diversity = values.at(1);
		const responsibility = values.at(2);

		expect(diversity?.quote).toBe('Wir glauben an die verbindende Kraft des Sports!');
		expect(responsibility?.highlights).toStrictEqual([
			'Teamgeist',
			'Hilfsbereitschaft',
			'Respekt',
			'Gemeinschaft',
		]);
	});

	it('gives an unknown value the star and neither teaser, quote nor highlights', () => {
		const value = draftOf().content.valuesSection.values.at(-1);

		expect(value).toStrictEqual({
			_key: 'h-new',
			_type: 'clubValue',
			icon: 'star',
			text: { _type: 'simpleBlockContent', text: [] },
			title: 'Neuer Wert',
		});
	});

	it('links membership and volunteering when both are published', () => {
		expect(draftOf().content.joinSection.links).toStrictEqual(
			JOIN_TARGETS.map(({ id, title }) => ({
				_key: id,
				_type: 'navigationLink',
				link: { _ref: id, _type: 'reference' },
				linkType: 'internal',
				title,
			})),
		);
	});

	it('leaves out a button whose page is not published, since the draft may not reference it', () => {
		expect(
			draftOf({ targets: ['membership'] }).content.joinSection.links.map(({ title }) => title),
		).toStrictEqual(['Mitglied werden']);
	});

	it('writes no image when the club page has none', () => {
		const draft = draftOf({
			aboutUs: { heroImage: null, introImage: null, longVision: LONG_VISION },
		});

		expect(draft).not.toHaveProperty('heroImage');
		expect(draft.content.aboutSection).not.toHaveProperty('image');
	});

	it('skips what is no text block and copes with spans without text or marks', () => {
		const draft = draftOf({
			aboutUs: {
				longVision: [
					{ _key: 'image', _type: 'image' },
					block('intro', 'Die TSG Irlich wurde 1882 gegründet.'),
					{ _key: 'h-bare', _type: 'block', style: 'h3' },
					{ _key: 'bare', _type: 'block', children: [{ _key: 'bare-span', _type: 'span' }] },
					{ _key: 'empty', _type: 'block' },
				],
			},
		});
		const value = draft.content.valuesSection.values.at(0);

		expect(draft.content.aboutSection.intro).toBe('Die TSG Irlich wurde 1882 gegründet.');
		expect(value?.title).toBe('');
		expect(value?.text.text).toStrictEqual([
			{
				_key: 'bare',
				_type: 'block',
				children: [{ _key: 'bare-span', _type: 'span', marks: [], text: '' }],
				markDefs: [],
				style: 'normal',
			},
			{ _key: 'empty', _type: 'block', children: [], markDefs: [], style: 'normal' },
		]);
	});

	it.each([
		['no club page', { aboutUs: null }],
		['no long vision', { aboutUs: { longVision: null } }],
		['an empty long vision', { aboutUs: { longVision: [] } }],
	])('builds nothing for %s', (_case, overrides) => {
		expect(buildStartContent(source(overrides))).toBeUndefined();
	});

	it('reads only the published club page and targets', () => {
		expect(START_QUERY).toContain(`*[_id == 'aboutUs'][0]`);
		expect(START_QUERY).toContain('*[_id in $targets]._id');
		// The club page keeps its own intro section; only the values page names it `aboutSection`.
		expect(START_QUERY).toContain('"introImage": content.introSection.images[0]');
		expect(START_QUERY).toContain('"longVision": content.visionSection.longVision.text');
	});
});
