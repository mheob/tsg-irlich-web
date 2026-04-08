// oxlint-disable no-magic-numbers

import { RiShareLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { NamedImageInput } from '@/components/named-image-input';

const meta = defineField({
	fields: [
		defineField({
			name: 'metaTitle',
			title: 'Meta-Title (überschreibt den Standardtitel)',
			type: 'string',
			validation: (Rule) =>
				Rule.max(65).warning('Der Titel sollte idealerweise maximal 65 Zeichen lang sein.'),
		}),
		defineField({
			name: 'metaDescription',
			title: 'Meta-Beschreibung (überschreibt die Standardbeschreibung)',
			type: 'text',
			validation: (Rule) =>
				Rule.min(130)
					.max(160)
					.warning('Die Beschreibung sollte idealerweise von 130 bis 160 Zeichen lang sein.'),
		}),
		defineField({
			components: {
				input: NamedImageInput,
			},
			description:
				'Wird auf den Karten in sozialen Medien und in Suchmaschinenergebnissen angezeigt',
			fields: [
				defineField({
					description: 'Wichtig für Barrierefreiheit und SEO.',
					name: 'alt',
					title: 'Alternativer Text',
					type: 'string',
					validation: (Rule) =>
						Rule.custom((alt, context) => {
							const parent = context.parent as { asset?: { _ref?: string } };
							if (parent?.asset?._ref && !alt) {
								return 'Alt-Text ist erforderlich wenn ein Bild ausgewählt wurde';
							}
							return true;
						}),
				}),
			],
			name: 'openGraphImage',
			options: {
				hotspot: true,
			},
			title: 'Open-Graph-Bild',
			type: 'image',
		}),
	],
	icon: RiShareLine,
	name: 'metaFields',
	title: 'Meta Information',
	type: 'object',
});

export default meta;
