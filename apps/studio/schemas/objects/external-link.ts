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
			validation: Rule =>
				Rule.uri({
					allowRelative: false,
					scheme: ['http', 'https', 'mailto', 'tel'],
				})
					.min(6)
					.error('Die URL ist ungültig.'),
		},
	],
});

export default externalLink;
