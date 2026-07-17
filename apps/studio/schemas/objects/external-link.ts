import { EarthGlobeIcon } from '@sanity/icons/EarthGlobe';
import { defineField } from 'sanity';

const externalLink = defineField({
	fields: [
		{
			description: 'Externen Link hinzufügen',
			name: 'href',
			title: 'URL',
			type: 'url',
			validation: (Rule) =>
				Rule.uri({
					allowRelative: false,
					scheme: ['http', 'https', 'mailto', 'tel'],
				})
					.min(6)
					.error('Die URL ist ungültig.'),
		},
	],
	icon: EarthGlobeIcon,
	name: 'externalLink',
	title: 'External Link',
	type: 'object',
});

export default externalLink;
