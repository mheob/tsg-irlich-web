import { RiBuilding2Line, RiHomeHeartLine, RiSparklingLine } from 'react-icons/ri';
import { defineArrayMember, defineField } from 'sanity';
import type { ValidationContext } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

const HOME_VENUE_COUNT = 2;
const TURF_TITLE_WARNING_LENGTH = 65;
const TURF_TEXT_WARNING_LENGTH = 240;

/**
 * Checks the home venues: exactly two, none of them twice. A missing list is left to the required
 * rule.
 *
 * @param venues - The references of the home venues.
 * @returns `true`, or the error the studio shows.
 */
function checkHomeVenues(venues: unknown): string | true {
	if (!Array.isArray(venues)) {
		return true;
	}

	if (venues.length !== HOME_VENUE_COUNT) {
		return 'Wähle genau zwei Sportstätten.';
	}

	const refs = venues.map((venue: { _ref?: string } | undefined) => venue?._ref);

	return new Set(refs).size === refs.length ? true : 'Jede Sportstätte nur einmal.';
}

/**
 * Tells whether the turf box has a title or a text, which makes the website show it.
 *
 * @param box - The turf box, as the validation context hands it over.
 * @returns Whether the box has a title or a text.
 */
function hasBoxContent(box: unknown): boolean {
	if (typeof box !== 'object' || box === null) {
		return false;
	}

	const hasTitle = 'title' in box && Boolean(box.title);
	const hasText = 'text' in box && Boolean(box.text);

	return hasTitle || hasText;
}

/**
 * Asks for the link text of the turf box once the box has a title or a text, since the website
 * shows the box then and its link needs a name.
 *
 * @param value - The link text.
 * @param context - The validation context, whose `parent` is the turf box.
 * @returns `true`, or the error the studio shows.
 */
function checkTurfLinkText(
	value: unknown,
	context: Pick<ValidationContext, 'parent'>,
): string | true {
	return hasBoxContent(context.parent) && !value
		? 'Der Linktext ist erforderlich, sobald der Kasten einen Titel oder Text hat.'
		: true;
}

const turfBox = defineField({
	description:
		'Der Kasten unter der ersten Heimat-Sportstätte, etwa „Unser Traum: Kunstrasen“. Ohne Titel und Text fehlt er auf der Website. Sein Link öffnet eine E-Mail an die Adresse unter „Anfragen“.',
	fields: [
		defineField({
			name: 'title',
			title: 'Titel',
			type: 'string',
			validation: (Rule) => [
				Rule.max(TURF_TITLE_WARNING_LENGTH).warning(
					'Der Titel sollte nicht länger als 65 Zeichen sein',
				),
			],
		}),
		defineField({
			name: 'text',
			title: 'Text',
			type: 'text',
			validation: (Rule) => [
				Rule.max(TURF_TEXT_WARNING_LENGTH).warning(
					'Der Text sollte nicht länger als 240 Zeichen sein',
				),
			],
		}),
		defineField({
			description: 'Zum Beispiel „Sprich uns an, wenn du helfen willst“.',
			name: 'linkText',
			title: 'Linktext',
			type: 'string',
			validation: (Rule) => [Rule.custom(checkTurfLinkText).error()],
		}),
	],
	icon: RiSparklingLine,
	name: 'turfBox',
	title: 'Kasten',
	type: 'object',
});

const homeSection = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),
		defineField({
			description:
				'Die zwei Sportstätten, die die Seite als Heimat des Vereins groß zeigt. Die erste steht mit Bild links und trägt den Kasten. Alle anderen Sportstätten erscheinen darunter von selbst.',
			name: 'venues',
			of: [defineArrayMember({ to: [{ type: 'venue' }], type: 'reference' })],
			title: 'Heimat-Sportstätten',
			type: 'array',
			validation: (Rule) => [
				Rule.required().error('Die Heimat-Sportstätten sind erforderlich'),
				Rule.custom(checkHomeVenues).error(),
			],
		}),
		turfBox,
	],
	group: 'home',
	icon: RiHomeHeartLine,
	name: 'homeSection',
	title: 'Heimat',
	type: 'object',
});

const othersSection = defineField({
	description:
		'Die Hallen und Plätze unter dem Kopf kommen von selbst: jede Sportstätte, die nicht unter „Heimat“ steht.',
	fields: [...getDefaultPageSectionFieldsWithGroup()],
	group: 'others',
	icon: RiBuilding2Line,
	name: 'othersSection',
	title: 'Weitere Sportanlagen',
	type: 'object',
});

export { homeSection, othersSection };
