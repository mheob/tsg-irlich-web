import { describe, expect, it } from 'vite-plus/test';

import faq, { prepareFaqPreview } from './faq';

interface FaqField {
	readonly name: string;
	readonly of?: readonly Record<string, unknown>[];
	readonly type: string;
}

function getField(name: string): FaqField {
	const field = (faq as unknown as { fields: readonly FaqField[] }).fields.find(
		(candidate) => candidate.name === name,
	);
	if (!field) {
		throw new Error(`Expected the FAQ to declare a "${name}" field.`);
	}
	return field;
}

describe('faq document', () => {
	it('names its type faq and titles it "FAQ"', () => {
		expect(faq).toMatchObject({ name: 'faq', title: 'FAQ' });
	});

	it('declares question, answer, departments and sort order', () => {
		expect(faq.fields.map((field) => field.name)).toStrictEqual([
			'question',
			'answer',
			'departments',
			'sortOrder',
		]);
	});

	it('assigns departments only, without creating one from the FAQ', () => {
		expect(getField('departments')).toMatchObject({
			of: [{ options: { disableNew: true }, to: [{ type: 'department' }], type: 'reference' }],
			type: 'array',
		});
	});

	it('allows paragraphs, lists, bold, italic and both link types in the answer', () => {
		expect(getField('answer').of?.[0]).toMatchObject({
			lists: [{ value: 'bullet' }, { value: 'number' }],
			marks: {
				annotations: [{ name: 'internalLink' }, { name: 'externalLink' }],
				decorators: [{ value: 'strong' }, { value: 'em' }],
			},
			styles: [{ value: 'normal' }],
			type: 'block',
		});
	});
});

describe('faq preview', () => {
	it('names up to three departments', () => {
		expect(
			prepareFaqPreview({
				department0: 'Fußball',
				department1: 'Kurse',
				departments: [{}, {}],
				title: 'Was kostet es?',
			}),
		).toStrictEqual({ subtitle: 'Fußball, Kurse', title: 'Was kostet es?' });
	});

	it('counts the departments beyond the third', () => {
		expect(
			prepareFaqPreview({
				department0: 'Fußball',
				department1: 'Kinderturnen',
				department2: 'Kurse',
				departments: [{}, {}, {}, {}, {}, {}],
				title: 'Was kostet es?',
			}).subtitle,
		).toBe('Fußball, Kinderturnen, Kurse +3');
	});

	it('leaves the subtitle empty without a department', () => {
		expect(prepareFaqPreview({ title: 'Was kostet es?' }).subtitle).toBe('');
	});

	it('skips a department whose title cannot be read', () => {
		expect(prepareFaqPreview({ department1: 'Kurse', departments: [{}, {}] }).subtitle).toBe(
			'Kurse',
		);
	});
});
