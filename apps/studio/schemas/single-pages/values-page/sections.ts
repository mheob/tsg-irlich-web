import { RiCompass3Line, RiInformationLine, RiMegaphoneLine } from 'react-icons/ri';
import { defineArrayMember, defineField } from 'sanity';

import { PAGE_ICONS } from '@tsgi-web/shared/page-icons';

import { PageIconInput } from '@/components/page-icon-input';
import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

const FACT_COUNT = 4;
const HIGHLIGHT_COUNT = 4;
const LINK_COUNT = 2;
const FACT_VALUE_WARNING_LENGTH = 12;
const FACT_LABEL_WARNING_LENGTH = 24;
const VALUE_TITLE_WARNING_LENGTH = 40;
const TEASER_WARNING_LENGTH = 120;
const QUOTE_WARNING_LENGTH = 120;
const HIGHLIGHT_WARNING_LENGTH = 20;

/**
 * Builds the check of an array whose layout is made for a fixed number of entries. It warns, never
 * blocks, and leaves a missing or empty array alone: an empty list is simply left out.
 *
 * @param count - The number the layout is made for.
 * @param message - The warning.
 * @returns The check for `Rule.custom`.
 */
function getCountCheck(count: number, message: string): (items: unknown) => string | true {
	return (items) =>
		!Array.isArray(items) || items.length === 0 || items.length === count ? true : message;
}

/**
 * Checks that the closing section links at most two pages, the number of buttons it has room for.
 *
 * @param links - The links of the section.
 * @returns `true`, or the warning the studio shows.
 */
function checkLinkCount(links: unknown): string | true {
	return !Array.isArray(links) || links.length <= LINK_COUNT
		? true
		: 'Der Abschluss zeigt höchstens zwei Buttons.';
}

const factField = defineArrayMember({
	fields: [
		defineField({
			description: 'Die große Zahl oder das Wort, etwa „1882“ oder „Blau & Gelb“.',
			name: 'value',
			title: 'Wert',
			type: 'string',
			validation: (Rule) => [
				Rule.required().error('Der Wert ist erforderlich'),
				Rule.max(FACT_VALUE_WARNING_LENGTH).warning(
					'Der Wert sollte nicht länger als 12 Zeichen sein',
				),
			],
		}),
		defineField({
			description: 'Die Zeile darunter, etwa „gegründet“.',
			name: 'label',
			title: 'Beschriftung',
			type: 'string',
			validation: (Rule) => [
				Rule.required().error('Die Beschriftung ist erforderlich'),
				Rule.max(FACT_LABEL_WARNING_LENGTH).warning(
					'Die Beschriftung sollte nicht länger als 24 Zeichen sein',
				),
			],
		}),
	],
	name: 'valuesFact',
	preview: { select: { subtitle: 'label', title: 'value' } },
	title: 'Fakt',
	type: 'object',
});

const aboutSection = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),
		defineField({
			description: 'Steht ab dem Desktop links neben dem Text, auf dem Handy entfällt es.',
			name: 'image',
			title: 'Bild',
			type: 'extendedImage',
		}),
		defineField({
			description: 'Die Kacheln unter dem Text, etwa Gründungsjahr, Mitglieder und Vereinsfarben.',
			name: 'facts',
			of: [factField],
			title: 'Fakten',
			type: 'array',
			validation: (Rule) => [
				Rule.custom(getCountCheck(FACT_COUNT, 'Die Zeile ist für 4 Kacheln gebaut.')).warning(),
			],
		}),
	],
	group: 'about',
	icon: RiInformationLine,
	name: 'aboutSection',
	title: 'Wer wir sind',
	type: 'object',
});

const valueField = defineArrayMember({
	fields: [
		defineField({
			name: 'title',
			title: 'Titel',
			type: 'string',
			validation: (Rule) => [
				Rule.required().error('Der Titel ist erforderlich'),
				Rule.max(VALUE_TITLE_WARNING_LENGTH).warning(
					'Der Titel sollte nicht länger als 40 Zeichen sein',
				),
			],
		}),
		defineField({
			components: { input: PageIconInput },
			description: 'Das Symbol neben der Nummer des Werts.',
			name: 'icon',
			options: { list: [...PAGE_ICONS] },
			title: 'Icon',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Das Icon ist erforderlich')],
		}),
		defineField({
			description: 'Ein Satz, der den Wert zusammenfasst. Steht hervorgehoben unter dem Titel.',
			name: 'teaser',
			title: 'Kernaussage',
			type: 'string',
			validation: (Rule) => [
				Rule.max(TEASER_WARNING_LENGTH).warning(
					'Die Kernaussage sollte nicht länger als 120 Zeichen sein',
				),
			],
		}),
		defineField({
			name: 'text',
			title: 'Text',
			type: 'simpleBlockContent',
			validation: (Rule) => [Rule.required().error('Der Text ist erforderlich')],
		}),
		defineField({
			description:
				'Optional. Ein Satz, der nach diesem Wert groß auf gelbem Grund steht, etwa „Wir glauben an die verbindende Kraft des Sports!“.',
			name: 'quote',
			title: 'Zitat danach',
			type: 'text',
			validation: (Rule) => [
				Rule.max(QUOTE_WARNING_LENGTH).warning(
					'Das Zitat sollte nicht länger als 120 Zeichen sein',
				),
			],
		}),
		defineField({
			description:
				'Optional. Begriffe, die unter dem Text als Kacheln erscheinen, etwa „Teamgeist“ und „Respekt“.',
			name: 'highlights',
			of: [
				defineArrayMember({
					type: 'string',
					validation: (Rule) => [
						Rule.max(HIGHLIGHT_WARNING_LENGTH).warning(
							'Ein Begriff sollte nicht länger als 20 Zeichen sein',
						),
					],
				}),
			],
			options: { layout: 'tags' },
			title: 'Schlagworte',
			type: 'array',
			validation: (Rule) => [
				Rule.custom(
					getCountCheck(HIGHLIGHT_COUNT, 'Die Kacheln sind für 4 Begriffe gebaut.'),
				).warning(),
			],
		}),
	],
	name: 'clubValue',
	preview: { select: { subtitle: 'teaser', title: 'title' } },
	title: 'Wert',
	type: 'object',
});

const valuesSection = defineField({
	fields: [
		defineField({
			description: 'Die Überschrift der Liste, die am Desktop neben den Werten mitläuft.',
			initialValue: 'Inhalt',
			name: 'tocTitle',
			title: 'Überschrift des Inhaltsverzeichnisses',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Die Überschrift ist erforderlich')],
		}),
		defineField({
			description: 'Die Werte in ihrer Reihenfolge. Die Website nummeriert sie von selbst.',
			name: 'values',
			of: [valueField],
			title: 'Werte',
			type: 'array',
			validation: (Rule) => [Rule.required().min(1).error('Mindestens ein Wert ist erforderlich')],
		}),
	],
	group: 'values',
	icon: RiCompass3Line,
	name: 'valuesSection',
	title: 'Werte',
	type: 'object',
});

const joinSection = defineField({
	fields: [
		defineField({
			name: 'title',
			title: 'Titel',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Der Titel ist erforderlich')],
		}),
		defineField({
			name: 'text',
			title: 'Text',
			type: 'text',
		}),
		defineField({
			description:
				'Höchstens zwei Buttons, etwa zur Mitgliedschaft und zum Ehrenamt. Der erste ist gelb, der zweite umrandet.',
			name: 'links',
			of: [defineArrayMember({ type: 'navigationLink' })],
			title: 'Buttons',
			type: 'array',
			validation: (Rule) => [Rule.custom(checkLinkCount).warning()],
		}),
	],
	group: 'join',
	icon: RiMegaphoneLine,
	name: 'joinSection',
	title: 'Mach mit',
	type: 'object',
});

export { aboutSection, checkLinkCount, getCountCheck, joinSection, valuesSection };
