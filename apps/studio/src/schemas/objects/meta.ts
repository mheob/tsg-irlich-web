import { RiShareLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const meta = defineField({
	title: 'Meta Information',
	name: 'metaFields',
	type: 'object',
	icon: RiShareLine,
	groups: [
		{
			title: 'Open Graph Protokoll',
			name: 'opengraph',
		},
	],
	fields: [
		{
			title: 'Meta Title (überschreibt den Standardtitel)',
			name: 'metaTitle',
			type: 'string',
			validation: rule => [
				rule
					.min(55)
					.max(65)
					.warning('Der Titel sollte idealerweise von 55 bis 65 Zeichen lang sein.'),
			],
		},
		{
			title: 'Meta Beschreibung',
			name: 'metaDescription',
			type: 'string',
			validation: rule => [
				rule
					.min(130)
					.max(160)
					.warning('Die Beschreibung sollte idealerweise von 130 bis 160 Zeichen lang sein.'),
			],
		},
		{
			title: 'Open-Graph-Bild',
			name: 'openGraphImage',
			type: 'image',
			description: 'Die ideale Größe für Open-Graph-Bilder ist 1200 x 630',
			group: 'opengraph',
			options: {
				hotspot: true,
			},
		},
		{
			title: 'Open-Graph-Titel',
			name: 'openGraphTitle',
			type: 'string',
			group: 'opengraph',
			validation: rule => [
				rule
					.min(55)
					.max(70)
					.warning('Der OG-Titel sollte idealerweise von 55 bis 70 Zeichen lang sein.'),
			],
		},
		{
			title: 'Open-Graph-Description',
			name: 'openGraphDescription',
			type: 'text',
			group: 'opengraph',
			validation: rule => [
				rule
					.min(50)
					.max(160)
					.warning('Die OG-Beschreibung sollte idealerweise von 50 bis 160 Zeichen lang sein.'),
			],
		},
	],
});

export default meta;
