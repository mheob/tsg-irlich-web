import { RiShareLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const meta = defineField({
	title: 'Meta Information',
	name: 'metaFields',
	type: 'object',
	icon: RiShareLine,
	groups: [
		{
			title: 'Open Graph Protocol',
			name: 'opengraph',
		},
	],
	fields: [
		{
			title: 'Meta Title (Overrides to default title)',
			name: 'metaTitle',
			type: 'string',
		},
		{
			title: 'Meta Description',
			name: 'metaDescription',
			type: 'string',
		},
		{
			title: 'Open Graph Image',
			name: 'openGraphImage',
			type: 'image',
			description: 'Ideal size for open graph images is 1200 x 600',
			group: 'opengraph',
			options: {
				hotspot: true,
			},
		},
		{
			title: 'Open Graph Title',
			name: 'openGraphTitle',
			type: 'string',
			group: 'opengraph',
		},
		{
			title: 'Open Graph Description',
			name: 'openGraphDescription',
			type: 'text',
			group: 'opengraph',
		},
	],
});

export default meta;
