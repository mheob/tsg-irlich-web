import { RiShareLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { NamedImageInput } from '@/components/named-image-input';

const meta = defineField({
	title: 'Meta Information',
	name: 'metaFields',
	type: 'object',
	icon: RiShareLine,
	fields: [
		defineField({
			title: 'Meta-Title (überschreibt den Standardtitel)',
			name: 'metaTitle',
			type: 'string',
			validation: Rule =>
				Rule.max(65).warning('Der Titel sollte idealerweise maximal 65 Zeichen lang sein.'),
		}),
		defineField({
			title: 'Meta-Beschreibung (überschreibt die Standardbeschreibung)',
			name: 'metaDescription',
			type: 'text',
			validation: Rule =>
				Rule.min(130)
					.max(160)
					.warning('Die Beschreibung sollte idealerweise von 130 bis 160 Zeichen lang sein.'),
		}),
		defineField({
			title: 'Open-Graph-Bild',
			name: 'openGraphImage',
			type: 'image',
			description:
				'Wird auf den Karten in sozialen Medien und in Suchmaschinenergebnissen angezeigt',
			components: {
				input: NamedImageInput,
			},
			fields: [
				defineField({
					description: 'Wichtig für Barrierefreiheit und SEO.',
					name: 'alt',
					title: 'Alternativer Text',
					type: 'string',
					validation: Rule =>
						Rule.custom((alt, context) => {
							// eslint-disable-next-line ts/no-explicit-any
							const ogImage = context.document?.ogImage as any;
							if (ogImage?.asset?._ref && !alt) return 'Required';
							return true;
						}),
				}),
			],
			options: {
				hotspot: true,
				aiAssist: { imageDescriptionField: 'alt' },
			},
		}),
	],
});

export default meta;
