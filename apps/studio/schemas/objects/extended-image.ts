import { defineField } from '@sanity-typed/types';
import { RiImageLine } from 'react-icons/ri';

const extendedImage = defineField({
	title: 'Erweitertes Bild',
	name: 'extendedImage',
	type: 'image',
	description: 'Erweitertes Bild mit erforderlichem Alt-Text.',
	icon: RiImageLine,
	fields: [
		defineField({
			title: 'Alt-Text',
			name: 'alt',
			type: 'string',
			description: 'Beschreibe, was auf dem Bild zu sehen ist (für SEO und Barrierefreiheit).',
			validation: Rule => Rule.required().error('Der "Alt-Text" ist erforderlich.'),
		}),

		defineField({
			title: 'Bildbeschreibung',
			name: 'description',
			type: 'string',
			description: 'Die Bildunterschrift wird unter dem Bild angezeigt.',
		}),
	],
	options: {
		hotspot: true,
	},
	preview: {
		prepare: ({ media, title }) => ({ media, title }),
		select: {
			media: 'asset',
			title: 'alt',
		},
	},
});

export default extendedImage;
