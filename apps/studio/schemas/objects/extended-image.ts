import { RiImageLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { NamedImageInput } from '@/components/named-image-input';

const extendedImage = defineField({
	components: {
		input: NamedImageInput,
	},
	description: 'Erweitertes Bild mit erforderlichem Alt-Text.',
	fields: [
		defineField({
			description: 'Beschreibe, was auf dem Bild zu sehen ist (für SEO und Barrierefreiheit).',
			name: 'alt',
			title: 'Alt-Text',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Der "Alt-Text" ist erforderlich')],
		}),
		defineField({
			description: 'Die Bildunterschrift wird unter dem Bild angezeigt.',
			name: 'description',
			title: 'Bildbeschreibung',
			type: 'string',
		}),
	],
	icon: RiImageLine,
	name: 'extendedImage',
	options: {
		hotspot: true,
	},
	preview: {
		// oxlint-disable-next-line typescript/no-unsafe-assignment
		prepare: ({ media, title }) => ({ media, title }),
		select: {
			media: 'asset',
			title: 'alt',
		},
	},
	title: 'Erweitertes Bild',
	type: 'image',
});

export default extendedImage;
