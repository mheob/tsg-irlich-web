// oxlint-disable unicorn/max-nested-calls

import { RiHandHeartLine, RiTeamLine, RiVipCrownLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { PAGE_ICONS } from '@tsgi-web/shared/page-icons';

import { PageIconInput } from '@/components/page-icon-input';
import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

const CARD_COUNT = 4;
const TITLE_WARNING_LENGTH = 65;
const TEXT_WARNING_LENGTH = 160;

const iconField = defineField({
	components: { input: PageIconInput },
	description: 'Das Symbol, das über der Karte steht.',
	name: 'icon',
	options: { list: [...PAGE_ICONS] },
	title: 'Icon',
	type: 'string',
	validation: (Rule) => [Rule.required().error('Das Icon ist erforderlich')],
});

const cardTitleField = defineField({
	name: 'title',
	title: 'Titel',
	type: 'string',
	validation: (Rule) => [
		Rule.required().error('Der Titel ist erforderlich'),
		Rule.max(TITLE_WARNING_LENGTH).warning('Der Titel sollte nicht länger als 65 Zeichen sein'),
	],
});

const cardTextField = defineField({
	name: 'text',
	title: 'Text',
	type: 'text',
	validation: (Rule) => [
		Rule.required().error('Der Text ist erforderlich'),
		Rule.max(TEXT_WARNING_LENGTH).warning('Der Text sollte nicht länger als 160 Zeichen sein'),
	],
});

/**
 * Warns, never blocks, while a card array does not fill the four-column grid.
 *
 * @param cards - The value of the array field.
 * @returns `true`, or the warning text.
 */
function validateCardCount(cards: unknown): string | true {
	return !Array.isArray(cards) || cards.length === CARD_COUNT
		? true
		: 'Das Raster ist für 4 Karten gebaut.';
}

const whySection = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),
		defineField({
			description: 'Die Gründe, warum sich ein Sponsoring der TSG lohnt.',
			name: 'reasons',
			of: [
				defineField({
					fields: [cardTitleField, cardTextField, iconField],
					name: 'partnerReason',
					title: 'Grund',
					type: 'object',
				}),
			],
			title: 'Gründe',
			type: 'array',
			validation: (Rule) => [Rule.custom(validateCardCount).warning()],
		}),
	],
	group: 'why',
	icon: RiTeamLine,
	name: 'whySection',
	title: 'Gründe',
	type: 'object',
});

const waysSection = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),
		defineField({
			description: 'Die Möglichkeiten, die TSG zu unterstützen.',
			name: 'ways',
			of: [
				defineField({
					fields: [
						cardTitleField,
						cardTextField,
						defineField({
							name: 'benefits',
							of: [{ type: 'string' }],
							title: 'Leistungen',
							type: 'array',
						}),
						iconField,
					],
					name: 'partnerWay',
					title: 'Möglichkeit',
					type: 'object',
				}),
			],
			title: 'Möglichkeiten',
			type: 'array',
			validation: (Rule) => [Rule.custom(validateCardCount).warning()],
		}),
		defineField({
			description:
				'Zum Beispiel „Du hast eine eigene Idee? …“. Die Zeile erscheint nur, wenn Text und Button ausgefüllt sind.',
			name: 'ideaText',
			title: 'Text für eigene Ideen',
			type: 'string',
		}),
		defineField({
			description:
				'Zum Beispiel „Jetzt Kontakt aufnehmen“. Die Zeile erscheint nur, wenn Text und Button ausgefüllt sind.',
			name: 'ideaCta',
			title: 'Button für eigene Ideen',
			type: 'string',
		}),
	],
	group: 'ways',
	icon: RiHandHeartLine,
	name: 'waysSection',
	title: 'Unterstützung',
	type: 'object',
});

const partnersSection = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),
		defineField({
			description: 'Zum Beispiel „Dein Logo hier?“. Steht in der letzten Kachel der Partner.',
			name: 'ownLogoText',
			title: 'Text der Logo-Kachel',
			type: 'string',
		}),
	],
	group: 'partners',
	icon: RiVipCrownLine,
	name: 'partnersSection',
	title: 'Partner',
	type: 'object',
});

export { partnersSection, waysSection, whySection };
