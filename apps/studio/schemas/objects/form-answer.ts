import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Builds the preview of one stored answer: the question and the answer itself, a multiple choice
 * answer joined with commas.
 *
 * @param selection - The values selected by the preview.
 * @param selection.label - The question as it was asked.
 * @param selection.value - The single answer.
 * @param selection.values - The answers of a multiple choice.
 * @returns The preview value shown in the answer list.
 */
function prepareAnswerPreview({
	label,
	value,
	values,
}: {
	label?: string;
	value?: string;
	values?: readonly string[];
}): { subtitle: string; title?: string } {
	return { subtitle: values?.length ? values.join(', ') : (value ?? ''), title: label };
}

const formAnswerPreview = {
	prepare: prepareAnswerPreview,
	select: { label: 'label', value: 'value', values: 'values' },
};

const formAnswer = defineType({
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
			of: [defineArrayMember({ type: 'string' })],
			title: 'Werte',
			type: 'array',
		}),
		defineField({
			hidden: ({ parent }: { parent?: { fieldType?: string } }) =>
				parent?.fieldType !== 'formFieldGroup',
			name: 'entries',
			of: [defineArrayMember({ type: 'formGroupEntry' })],
			title: 'Einträge',
			type: 'array',
		}),
	],
	name: 'formAnswer',
	preview: formAnswerPreview,
	title: 'Antwort',
	type: 'object',
});

export { formAnswerPreview, prepareAnswerPreview };
export default formAnswer;
