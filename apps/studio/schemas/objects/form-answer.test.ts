import { describe, expect, it } from 'vite-plus/test';

import formAnswer, { prepareAnswerPreview } from './form-answer';

interface AnswerField {
	readonly hidden?: boolean | ((context: { parent?: Record<string, unknown> }) => boolean);
	readonly name: string;
}

function getHidden(name: string): (context: { parent?: Record<string, unknown> }) => boolean {
	const field = (formAnswer as unknown as { fields: readonly AnswerField[] }).fields.find(
		(candidate) => candidate.name === name,
	);
	if (typeof field?.hidden !== 'function') {
		throw new TypeError(`Expected the "${name}" field to hide itself through a function.`);
	}
	return field.hidden;
}

describe('form answer object', () => {
	it('hides entries unless the answer is a group', () => {
		const hidden = getHidden('entries');

		expect(hidden({ parent: { fieldType: 'formFieldText' } })).toBe(true);
		expect(hidden({ parent: { fieldType: 'formFieldGroup' } })).toBe(false);
	});

	it('hides values unless they exist', () => {
		const hidden = getHidden('values');

		expect(hidden({ parent: {} })).toBe(true);
		expect(hidden({ parent: { values: ['a'] } })).toBe(false);
	});
});

describe('form answer preview', () => {
	it('previews values joined', () => {
		expect(prepareAnswerPreview({ label: 'Status', values: ['a', 'b'] })).toStrictEqual({
			subtitle: 'a, b',
			title: 'Status',
		});
	});

	it('previews a single value', () => {
		expect(prepareAnswerPreview({ label: 'Name', value: 'Anna' })).toStrictEqual({
			subtitle: 'Anna',
			title: 'Name',
		});
	});

	it('leaves the subtitle empty without an answer', () => {
		expect(prepareAnswerPreview({ label: 'Name' }).subtitle).toBe('');
	});
});
