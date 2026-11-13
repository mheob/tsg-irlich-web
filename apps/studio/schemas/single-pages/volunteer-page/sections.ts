// oxlint-disable unicorn/max-nested-calls

import { RiChatQuoteLine, RiCompass3Line, RiHeartLine, RiMegaphoneLine } from 'react-icons/ri';
import { defineArrayMember, defineField } from 'sanity';

import { PAGE_ICONS } from '@tsgi-web/shared/page-icons';

import { PageIconInput } from '@/components/page-icon-input';
import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

const REASON_COUNT = 6;
const STEP_COUNT = 3;
const TITLE_WARNING_LENGTH = 65;
const TEXT_WARNING_LENGTH = 160;

const iconField = defineField({
	components: { input: PageIconInput },
	description: 'Das Symbol, das zur Karte gehört.',
	name: 'icon',
	options: { list: [...PAGE_ICONS] },
	title: 'Icon',
	type: 'string',
	validation: (Rule) => [Rule.required().error('Das Icon ist erforderlich')],
});

const titleField = defineField({
	name: 'title',
	title: 'Titel',
	type: 'string',
	validation: (Rule) => [
		Rule.required().error('Der Titel ist erforderlich'),
		Rule.max(TITLE_WARNING_LENGTH).warning('Der Titel sollte nicht länger als 65 Zeichen sein'),
	],
});

const textField = defineField({
	name: 'text',
	title: 'Text',
	type: 'text',
	validation: (Rule) => [
		Rule.required().error('Der Text ist erforderlich'),
		Rule.max(TEXT_WARNING_LENGTH).warning('Der Text sollte nicht länger als 160 Zeichen sein'),
	],
});

/**
 * Builds the check of an array whose layout is made for a fixed number of entries. It warns, never
 * blocks, and leaves a missing array to the required rules.
 *
 * @param count - The number the layout is made for.
 * @param message - The warning.
 * @returns The check for `Rule.custom`.
 */
function getCountCheck(count: number, message: string): (items: unknown) => string | true {
	return (items) => (!Array.isArray(items) || items.length === count ? true : message);
}

/**
 * A text of the section „Aktuell gesucht“ that every open position shows, such as the heading of
 * one of its lists.
 *
 * @param name - The field name.
 * @param title - The German title.
 * @param initialValue - The text a new page starts with.
 * @returns The field definition.
 */
function getPositionTextField(
	name: string,
	title: string,
	initialValue: string,
): ReturnType<typeof defineField> {
	return defineField({
		description: 'Gilt für jede offene Aufgabe.',
		initialValue,
		name,
		title,
		type: 'string',
		validation: (Rule) => [Rule.required().error(`„${title}“ ist erforderlich`)],
	});
}

const whySection = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),
		defineField({
			description:
				'Zum Beispiel „Offene Aufgaben ansehen“. Der Button springt zu „Aktuell gesucht“ und erscheint nur, solange eine offene Aufgabe veröffentlicht ist.',
			name: 'cta',
			title: 'Button',
			type: 'string',
		}),
		defineField({
			description: 'Die Gründe, sich bei der TSG zu engagieren.',
			name: 'reasons',
			of: [
				defineArrayMember({
					fields: [titleField, textField, iconField],
					name: 'volunteerReason',
					title: 'Grund',
					type: 'object',
				}),
			],
			title: 'Gründe',
			type: 'array',
			validation: (Rule) => [
				Rule.custom(getCountCheck(REASON_COUNT, 'Das Raster ist für 6 Karten gebaut.')).warning(),
			],
		}),
	],
	group: 'why',
	icon: RiHeartLine,
	name: 'whySection',
	title: 'Gründe',
	type: 'object',
});

const voicesSection = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),
		defineField({
			description:
				'Zitate von Ehrenamtlichen, gepflegt unter „Zeugnis / Referenz“. Ohne Zitat fehlt der Abschnitt auf der Website.',
			name: 'testimonials',
			of: [defineArrayMember({ to: [{ type: 'testimonial' }], type: 'reference' })],
			title: 'Zitate',
			type: 'array',
		}),
	],
	group: 'voices',
	icon: RiChatQuoteLine,
	name: 'voicesSection',
	title: 'Stimmen',
	type: 'object',
});

const areasSection = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),
		defineField({
			description:
				'Die Bereiche, in denen man sich einbringen kann. Sie stehen abwechselnd links und rechts.',
			name: 'areas',
			of: [
				defineArrayMember({
					fields: [
						titleField,
						textField,
						defineField({
							name: 'image',
							title: 'Bild',
							type: 'extendedImage',
							validation: (Rule) => [
								Rule.required().assetRequired().error('Das Bild ist erforderlich'),
							],
						}),
						iconField,
						defineField({
							description: 'Kurze Beispiele, zum Beispiel „Training leiten“.',
							name: 'tasks',
							of: [defineArrayMember({ type: 'string' })],
							title: 'Beispielaufgaben',
							type: 'array',
						}),
					],
					name: 'volunteerArea',
					title: 'Bereich',
					type: 'object',
				}),
			],
			title: 'Bereiche',
			type: 'array',
		}),
	],
	group: 'areas',
	icon: RiCompass3Line,
	name: 'areasSection',
	title: 'Bereiche',
	type: 'object',
});

const positionsSection = defineField({
	description: 'Die offenen Aufgaben selbst stehen unter „Verein“ → „Inhalte“ → „Offene Aufgaben“.',
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),
		defineField({
			description: 'Wie man vom Interesse zur Aufgabe kommt.',
			name: 'steps',
			of: [
				defineArrayMember({
					fields: [titleField, textField],
					name: 'volunteerStep',
					title: 'Schritt',
					type: 'object',
				}),
			],
			title: 'Schritte',
			type: 'array',
			validation: (Rule) => [
				Rule.custom(getCountCheck(STEP_COUNT, 'Der Ablauf ist für 3 Schritte gebaut.')).warning(),
			],
		}),
		getPositionTextField('tasksHeading', 'Überschrift der Aufgaben', 'Deine Aufgaben'),
		getPositionTextField('profileHeading', 'Überschrift des Profils', 'Das bringst du mit'),
		getPositionTextField('offerHeading', 'Überschrift des Angebots', 'Das bieten wir'),
		getPositionTextField('cta', 'Button', 'Jetzt melden'),
		defineField({
			description:
				'Zum Beispiel „Nichts Passendes dabei?“. Die Karte unter den Aufgaben erscheint nur mit diesem Titel.',
			name: 'otherTitle',
			title: 'Titel der Karte für eigene Ideen',
			type: 'string',
		}),
		defineField({
			description: 'Der Satz unter dem Titel der Karte.',
			name: 'otherText',
			title: 'Text der Karte für eigene Ideen',
			type: 'string',
		}),
	],
	group: 'positions',
	icon: RiMegaphoneLine,
	name: 'positionsSection',
	title: 'Aktuell gesucht',
	type: 'object',
});

export { areasSection, positionsSection, voicesSection, whySection };
