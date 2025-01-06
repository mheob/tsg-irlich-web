/* cSpell:words monday tuesday wednesday thursday friday saturday sunday */

import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import TimePicker from '@/components/time-picker';
import { timeFieldRegex } from '@/constants/regex';

const trainingTimeField = defineField({
	title: 'Trainingszeiten und -orte',
	name: 'trainingTime',
	type: 'object',
	icon: RiLinksLine,
	fields: [
		defineField({
			title: 'Jahreszeit',
			name: 'season',
			type: 'string',
			options: {
				list: [
					{ title: 'Ganzjährig', value: 'yearly' },
					{ title: 'Sommer', value: 'summer' },
					{ title: 'Winter', value: 'winter' },
				],
			},
			validation: Rule => [Rule.required().error('Jahreszeit ist erforderlich')],
		}),

		defineField({
			title: 'Wochentag',
			name: 'weekday',
			type: 'string',
			options: {
				list: [
					{ title: 'Montag', value: 'monday' },
					{ title: 'Dienstag', value: 'tuesday' },
					{ title: 'Mittwoch', value: 'wednesday' },
					{ title: 'Donnerstag', value: 'thursday' },
					{ title: 'Freitag', value: 'friday' },
					{ title: 'Samstag', value: 'saturday' },
					{ title: 'Sonntag', value: 'sunday' },
				],
			},
			validation: Rule => [Rule.required().error('Wochentag ist erforderlich')],
		}),

		defineField({
			title: 'Startzeit',
			name: 'startTime',
			type: 'string',
			components: { input: TimePicker },
			validation: Rule => [
				Rule.required().error('Startzeit ist erforderlich'),
				Rule.regex(timeFieldRegex).error('Ungültige Startzeit, HH:mm erwartet'),
			],
		}),

		defineField({
			title: 'Endzeit',
			name: 'endTime',
			type: 'string',
			components: { input: TimePicker },
			validation: Rule => [
				Rule.required().error('Endzeit ist erforderlich'),
				Rule.regex(timeFieldRegex).error('Ungültige Endzeit, HH:mm erwartet'),
			],
		}),

		defineField({
			title: 'Trainingsort',
			name: 'location',
			type: 'reference',
			to: [{ type: 'venue' }],
			validation: Rule => [Rule.required().error('Trainingsort ist erforderlich')],
		}),
	],
	preview: {
		prepare: ({ weekday, endTime, location, startTime, season }) => ({
			title: `${season} | ${weekday}, ${startTime} - ${endTime} | ${location}`,
		}),
		select: {
			endTime: 'endTime',
			location: 'location.title',
			season: 'season',
			startTime: 'startTime',
			weekday: 'weekday',
		},
	},
});

export default trainingTimeField;
