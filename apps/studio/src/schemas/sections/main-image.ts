import { RiImageLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const mainImage = defineField({
	title: 'Image',
	name: 'mainImage',
	type: 'image',
	description: 'Image',
	icon: RiImageLine,
	fields: [
		{
			title: 'Alternative text',
			name: 'alt',
			type: 'string',
			description: 'Important for SEO and accessability.',
			validation: Rule => Rule.error('You have to fill out the alternative text.').required(),
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

export default mainImage;
