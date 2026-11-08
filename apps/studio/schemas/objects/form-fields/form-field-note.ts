import { RiInformationLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

const formFieldNote = defineType({
	fields: [
		defineField({ name: 'title', title: 'Zwischenüberschrift', type: 'string' }),
		defineField({ name: 'text', title: 'Text', type: 'simpleBlockContent' }),
	],
	icon: RiInformationLine,
	name: 'formFieldNote',
	preview: {
		prepare: ({ title }: { title?: string }) => ({
			subtitle: 'Hinweis',
			title: title ?? 'Hinweis',
		}),
		select: { title: 'title' },
	},
	title: 'Hinweis',
	type: 'object',
});

export default formFieldNote;
