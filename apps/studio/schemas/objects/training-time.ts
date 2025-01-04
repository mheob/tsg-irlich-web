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
			title: 'Wochentag',
			name: 'weekday',
			type: 'string',
			options: {
				list: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
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
		prepare: ({ weekday, endTime, location, startTime }) => ({
			title: `${weekday}, ${startTime} - ${endTime} | ${location}`,
		}),
		select: {
			endTime: 'endTime',
			location: 'location.title',
			startTime: 'startTime',
			weekday: 'weekday',
		},
	},
});

export default trainingTimeField;
