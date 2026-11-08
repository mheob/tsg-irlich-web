import { describe, expect, it } from 'vite-plus/test';

import formFieldDate from './form-field-date';

interface DateField {
	readonly name: string;
	readonly options?: { readonly list?: readonly { readonly value: string }[] };
	readonly validation?: (rule: { custom: (fn: Validator) => Validator }) => Validator;
}

type Validator = (value: unknown, context: { parent?: { minAge?: number } }) => true | string;

function getField(name: string): DateField {
	const field = (formFieldDate as unknown as { fields: readonly DateField[] }).fields.find(
		(candidate) => candidate.name === name,
	);
	if (!field) {
		throw new Error(`Expected a "${name}" field.`);
	}
	return field;
}

describe('form field date', () => {
	it('offers year as retention', () => {
		expect(getField('retention').options?.list?.map((item) => item.value)).toStrictEqual([
			'keep',
			'year',
			'delete',
		]);
	});

	it('requires a reference date when a minimum age is set', () => {
		const { validation } = getField('referenceDate');
		const validate = validation?.({ custom: (fn) => fn });
		expect(validate?.(undefined, { parent: { minAge: 16 } })).toBe('Bitte einen Stichtag angeben');
		expect(validate?.(undefined, { parent: {} })).toBe(true);
		expect(validate?.('2026-01-01', { parent: { minAge: 16 } })).toBe(true);
	});
});
