import { LinkIcon } from '@sanity/icons';
import { defineField } from 'sanity';

const link = defineField({
	title: 'External link',
	name: 'link',
	type: 'object',
	icon: LinkIcon,
	fields: [
		{
			name: 'href',
			type: 'url',
			title: 'URL',
			validation: Rule =>
				Rule.uri({
					allowRelative: true,
					scheme: ['https', 'http', 'mailto', 'tel'],
				}),
		},
	],
});

export default link;
