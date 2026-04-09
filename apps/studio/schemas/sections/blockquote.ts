import { RiChatQuoteLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const blockquote = defineField({
	description: 'A blockquote component with the quote and author',
	fields: [
		defineField({
			name: 'quote',
			title: 'Zitat',
			type: 'text',
		}),
		defineField({
			name: 'author',
			title: 'Autor',
			type: 'string',
		}),
	],
	icon: RiChatQuoteLine,
	name: 'blockquote',
	title: 'Zitat-Block',
	type: 'object',
});

export default blockquote;
