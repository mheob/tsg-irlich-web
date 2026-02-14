import { RiHeart2Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

const sponsors = defineType({
	title: 'Sponsoren',
	name: 'sponsors',
	type: 'document',
	icon: RiHeart2Line,
	fields: [
		defineField({
			title: 'Name',
			name: 'name',
			type: 'string',
			description: 'Der Name des Sponsors.',
			validation: (Rule) => [
				Rule.required().min(3).error('Der Name muss mindestens 3 Zeichen lang sein'),
				Rule.max(64).warning('Der Name sollte nicht länger als 64 Zeichen sein'),
			],
		}),

		defineField({
			title: 'Website',
			name: 'website',
			type: 'url',
			description: 'Die Website des Sponsors.',
			validation: (Rule) => [
				Rule.required().error('Die Website ist erforderlich'),
				Rule.uri({ scheme: ['http', 'https'] }).error('Die Website muss eine gültige URL sein'),
			],
		}),

		defineField({
			title: 'Logo',
			name: 'logo',
			type: 'image',
			description: 'Das Logo des Sponsors.',
			validation: (Rule) => [Rule.required().error('Das Logo ist erforderlich')],
		}),
	],
});

export default sponsors;
