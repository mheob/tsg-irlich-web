import { describe, expect, it } from 'vite-plus/test';

import formFieldGroup from './form-field-group';

interface GroupField {
	readonly hidden?: unknown;
	readonly name: string;
	readonly of?: readonly { readonly type: string }[];
	readonly validation: (rule: { custom: (fn: Validator) => Validator }) => readonly [Validator];
}

type Validator = (value: unknown, context: { parent?: { minItems?: number } }) => true | string;

function getField(name: string): GroupField {
	const field = (formFieldGroup as unknown as { fields: readonly GroupField[] }).fields.find(
		(candidate) => candidate.name === name,
	);
	if (!field) {
		throw new Error(`Expected a "${name}" field.`);
	}
	return field;
}

describe('form field group', () => {
	it('accepts every field type except groups', () => {
		expect(getField('fields').of?.map((member) => member.type)).toStrictEqual([
			'formFieldText',
			'formFieldTextarea',
			'formFieldEmail',
			'formFieldPhone',
			'formFieldNumber',
			'formFieldDate',
			'formFieldChoice',
			'formFieldConsent',
			'formFieldNote',
		]);
	});

	it('rejects minItems above maxItems', () => {
		const [validate] = getField('maxItems').validation({ custom: (fn) => fn });
		expect(validate(2, { parent: { minItems: 6 } })).toBe(
			'Das Maximum darf nicht kleiner als das Minimum sein',
		);
		expect(validate(6, { parent: { minItems: 6 } })).toBe(true);
		expect(validate(undefined, { parent: { minItems: 6 } })).toBe(true);
	});

	it('hides the retention', () => {
		expect(getField('retention').hidden).toBe(true);
	});
});
