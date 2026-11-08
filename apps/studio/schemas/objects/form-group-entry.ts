import { defineArrayMember, defineField, defineType } from 'sanity';

const formGroupEntry = defineType({
	fields: [
		defineField({
			name: 'answers',
			of: [defineArrayMember({ type: 'formGroupAnswer' })],
			title: 'Antworten',
			type: 'array',
		}),
	],
	name: 'formGroupEntry',
	preview: {
		prepare: ({ first }: { first?: string }) => ({ title: first ?? 'Eintrag' }),
		select: { first: 'answers.0.value' },
	},
	title: 'Eintrag',
	type: 'object',
});

export default formGroupEntry;
