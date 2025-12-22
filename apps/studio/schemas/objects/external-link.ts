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
				Rule.required()
					.custom((url: string) => {
						if (!url) return true;
						const internalPattern = /tsg-irlich\.de/i;
						if (internalPattern.test(url)) {
							return 'Interne URLs sollten stattdessen den Internen Link-Annotation verwenden';
						}
						return true;
					})
					.error('Die URL ist erforderlich'),
		},
	],
});

export default externalLink;
