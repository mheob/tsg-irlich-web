import { RiImageLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const extendedImage = defineField({
	title: 'Erweitertes Bild',
	name: 'extendedImage',
	type: 'image',
	description: 'Erweitertes Bild mit erforderlichem Alt-Text.',
	icon: RiImageLine,
	fields: [
		{
			title: 'Alt-Text',
			name: 'alt',
			type: 'string',
			description: 'Beschreibe, was auf dem Bild zu sehen ist (für SEO und Barrierefreiheit).',
			validation: rule => rule.required().error('Du musst den Alt-Text ausfüllen.'),
		},
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
