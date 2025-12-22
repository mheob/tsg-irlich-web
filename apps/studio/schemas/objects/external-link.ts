import { EarthGlobeIcon } from '@sanity/icons';
import { defineField } from 'sanity';

const externalLink = defineField({
	title: 'External Link',
	name: 'externalLink',
	type: 'object',
	icon: EarthGlobeIcon,
	fields: [
		{
			title: 'URL',
			name: 'href',
			type: 'url',
			description: 'Externen Link hinzufügen',
			validation: Rule => Rule.required().error('Die URL ist erforderlich'),
		},
	],
});

export default externalLink;
