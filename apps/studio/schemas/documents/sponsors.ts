// oxlint-disable no-magic-numbers

import { RiHeart2Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

const sponsors = defineType({
	fields: [
		defineField({
			description: 'Der Name des Sponsors.',
			name: 'name',
			title: 'Name',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(3).error('Der Name muss mindestens 3 Zeichen lang sein'),
				Rule.max(64).warning('Der Name sollte nicht länger als 64 Zeichen sein'),
			],
		}),

		defineField({
			description: 'Die Website des Sponsors.',
			name: 'website',
			title: 'Website',
			type: 'url',
			validation: (Rule) => [
				Rule.required().error('Die Website ist erforderlich'),
				Rule.uri({ scheme: ['http', 'https'] }).error('Die Website muss eine gültige URL sein'),
			],
		}),

		defineField({
			description: 'Das Logo des Sponsors.',
			name: 'logo',
			title: 'Logo',
			type: 'image',
			validation: (Rule) => [Rule.required().error('Das Logo ist erforderlich')],
		}),
	],
	icon: RiHeart2Line,
	name: 'sponsors',
	title: 'Sponsoren',
	type: 'document',
});

export default sponsors;
