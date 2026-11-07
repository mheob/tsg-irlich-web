import { describe, expect, it } from 'vite-plus/test';

import role from '@/schemas/documents/role';
import { validateLineSpacing, validateTextSpacing } from '@/utils/whitespace';

import { excerptField } from './excerpt';
import { subTitleField, titleField } from './general';
import { firstNameField, lastNameField } from './personal';

interface ChainRule {
	custom: (fn: unknown) => ChainRule;
	error: (message?: string) => ChainRule;
	max: (length: number) => ChainRule;
	min: (length: number) => ChainRule;
	required: () => ChainRule;
	warning: (message?: string) => ChainRule;
}

interface FieldDefinition {
	readonly name?: string;
	readonly validation?: (rule: ChainRule) => unknown;
}

/**
 * Runs the validation of a field against a rule that accepts every builder call and collects the
 * functions handed to `Rule.custom`.
 *
 * @param definition - The field.
 * @returns The custom validators the field declares.
 */
function collectCustomValidators(definition: unknown): unknown[] {
	const field = definition as FieldDefinition;
	if (!field.validation) {
		throw new Error('Expected the field to declare a validation.');
	}

	const customs: unknown[] = [];
	const rule: ChainRule = {
		custom: (fn) => {
			customs.push(fn);
			return rule;
		},
		error: () => rule,
		max: () => rule,
		min: () => rule,
		required: () => rule,
		warning: () => rule,
	};
	field.validation(rule);
	return customs;
}

const roleTitleField = (role.fields as readonly FieldDefinition[]).find(
	(field) => field.name === 'title',
);

describe('whitespace rules on the text fields (WEB-425)', () => {
	it.each([
		['title', titleField],
		['subtitle', subTitleField],
		['first name', firstNameField],
		['last name', lastNameField],
		['role name', roleTitleField],
	])('checks the %s as a single line', (_name, field) => {
		expect(collectCustomValidators(field)).toContain(validateLineSpacing);
	});

	it('checks the excerpt as a text with line breaks', () => {
		expect(collectCustomValidators(excerptField)).toContain(validateTextSpacing);
	});
});
