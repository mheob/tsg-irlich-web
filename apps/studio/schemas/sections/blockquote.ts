import { defineField } from '@sanity-typed/types';
import { RiChatQuoteLine } from 'react-icons/ri';

const blockquote = defineField({
	title: 'Zitat-Block',
	name: 'blockquote',
	type: 'object',
	description: 'A blockquote component with the quote and author',
	icon: RiChatQuoteLine,
	fields: [
		defineField({
			title: 'Zitat',
			name: 'quote',
			type: 'text',
		}),
		defineField({
			title: 'Autor',
			name: 'author',
			type: 'string',
		}),
	],
});

export default blockquote;
