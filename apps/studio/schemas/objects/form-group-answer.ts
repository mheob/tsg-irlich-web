import { defineField, defineType } from 'sanity';

import { formAnswerPreview } from './form-answer';

const formGroupAnswer = defineType({
	fields: [
		defineField({ name: 'key', readOnly: true, title: 'Schlüssel', type: 'string' }),
		defineField({ name: 'label', readOnly: true, title: 'Frage', type: 'string' }),
		defineField({ name: 'fieldType', readOnly: true, title: 'Feldtyp', type: 'string' }),
		defineField({
			hidden: true,
			name: 'retention',
			readOnly: true,
			title: 'Aufbewahrung',
			type: 'string',
		}),
		defineField({ name: 'value', title: 'Wert', type: 'string' }),
		defineField({
			hidden: ({ parent }: { parent?: { values?: unknown } }) => parent?.values === undefined,
			name: 'values',
			of: [{ type: 'string' }],
			title: 'Werte',
			type: 'array',
		}),
	],
	name: 'formGroupAnswer',
	preview: formAnswerPreview,
	title: 'Antwort',
	type: 'object',
});

export default formGroupAnswer;
