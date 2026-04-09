// oxlint-disable no-magic-numbers

import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import TimePicker from '@/components/time-picker';
import { timeFieldRegex } from '@/constants/regex';

const trainingTimeField = defineField({
	fields: [
		defineField({
			name: 'season',
			options: {
				list: [
					{ title: 'Ganzjährig', value: 'yearly' },
					{ title: 'Sommer', value: 'summer' },
					{ title: 'Winter', value: 'winter' },
				],
			},
			title: 'Jahreszeit',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Jahreszeit ist erforderlich')],
		}),

		defineField({
			name: 'weekday',
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
			title: 'Wochentag',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Wochentag ist erforderlich')],
		}),

		defineField({
			components: { input: TimePicker },
			name: 'startTime',
			title: 'Startzeit',
			type: 'string',
			validation: (Rule) => [
				Rule.required().error('Startzeit ist erforderlich'),
				Rule.regex(timeFieldRegex).error('Ungültige Startzeit, HH:mm erwartet'),
			],
		}),

		defineField({
			components: { input: TimePicker },
			name: 'endTime',
			title: 'Endzeit',
			type: 'string',
			validation: (Rule) => [
				Rule.required().error('Endzeit ist erforderlich'),
				Rule.regex(timeFieldRegex).error('Ungültige Endzeit, HH:mm erwartet'),
			],
		}),

		defineField({
			name: 'venue',
			title: 'Trainingsort',
			to: [{ type: 'venue' }],
			type: 'reference',
			validation: (Rule) => [Rule.required().error('Trainingsort ist erforderlich')],
		}),

		defineField({
			name: 'note',
			title: 'Notizen',
			type: 'string',
			validation: (Rule) => [
				Rule.min(2).error('Notiz sollte mindestens 2 Zeichen lang sein'),
				Rule.max(256).warning('Notiz sollte nicht länger als 256 Zeichen sein'),
			],
		}),
	],
	icon: RiLinksLine,
	name: 'trainingTime',
	preview: {
		prepare: ({ weekday, endTime, venue, note, startTime, season }) => ({
			title: `${season ?? '_'} | ${weekday ?? '_'}, ${startTime ?? '_'} - ${endTime ?? '_'} | ${venue ?? '_'} | ${note ?? '_'}`,
		}),
		select: {
			endTime: 'endTime',
			note: 'note',
			season: 'season',
			startTime: 'startTime',
			venue: 'venue.title',
			weekday: 'weekday',
		},
	},
	title: 'Trainingszeiten und -orte',
	type: 'object',
});

export default trainingTimeField;
