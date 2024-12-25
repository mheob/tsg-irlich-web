import { defineField } from '@sanity-typed/types';

const link = defineField({
	title: 'URL',
	name: 'link',
	type: 'object',
	hidden: true,
	fields: [
		defineField({
			title: 'URL',
			name: 'href',
			type: 'url',
			validation: Rule =>
				Rule.uri({
					allowRelative: true,
					scheme: ['https', 'http', 'mailto', 'tel'],
				}),
		}),
	],
});

export default link;
