import { describe, expect, it } from 'vite-plus/test';

import { slugify } from '@/utils/strings';

import { formattedSlugField, slugField, validateSlugFormat } from './general';

const SLUG_FORMAT_MESSAGE =
	'Der Slug darf nur Kleinbuchstaben, Ziffern und einzelne Bindestriche enthalten, z. B. heimsieg-gegen-engers. „Generieren“ erzeugt ihn passend aus dem Titel.';

interface RecordingRule {
	custom: (fn: unknown) => RecordingRule;
	error: (message: string) => RecordingRule;
	required: () => RecordingRule;
}

interface SlugFieldDefinition {
	readonly validation?: (rule: RecordingRule) => unknown;
}

/**
 * Runs the validation of a slug field against a rule that writes down the calls it receives, and
 * hands back the function of a `Rule.custom`, so it can be called as well.
 *
 * @param definition - The slug field.
 * @returns The calls in order, and the custom validator if the field declares one.
 */
function recordValidation(definition: unknown): { calls: string[]; custom?: unknown } {
	const field = definition as SlugFieldDefinition;
	if (!field.validation) {
		throw new Error('Expected the slug field to declare a validation.');
	}

	const calls: string[] = [];
	let custom: unknown;
	const rule: RecordingRule = {
		custom: (fn) => {
			calls.push('custom');
			custom = fn;
			return rule;
		},
		error: (message) => {
			calls.push(`error: ${message}`);
			return rule;
		},
		required: () => {
			calls.push('required');
			return rule;
		},
	};
	field.validation(rule);
	return { calls, custom };
}

describe('slug format', () => {
	it('accepts lowercase words and digits joined by single hyphens', () => {
		expect(validateSlugFormat({ current: 'heimsieg-weissenthurm-ii' })).toBe(true);
		expect(validateSlugFormat({ current: '4-advent' })).toBe(true);
		expect(validateSlugFormat({ current: 'magics-motto2027' })).toBe(true);
	});

	it('leaves a missing slug to the required rule', () => {
		expect(validateSlugFormat()).toBe(true);
		expect(validateSlugFormat({})).toBe(true);
		expect(validateSlugFormat({ current: '' })).toBe(true);
	});

	it('rejects capitals, which made an address that only worked as typed', () => {
		expect(validateSlugFormat({ current: 'Einladung-JHV-2026' })).toBe(SLUG_FORMAT_MESSAGE);
		expect(validateSlugFormat({ current: 'niederlage-heimbach-II' })).toBe(SLUG_FORMAT_MESSAGE);
	});

	it('rejects umlauts, spaces, underscores and slashes', () => {
		for (const current of ['fußball', 'heimsieg engers', 'heimsieg_engers', 'fussball/heimsieg']) {
			expect(validateSlugFormat({ current })).toBe(SLUG_FORMAT_MESSAGE);
		}
	});

	it('rejects a hyphen at either end and two in a row', () => {
		for (const current of ['-heimsieg', 'heimsieg-', 'heimsieg--engers']) {
			expect(validateSlugFormat({ current })).toBe(SLUG_FORMAT_MESSAGE);
		}
	});

	it('accepts what „Generieren“ makes of a title', () => {
		const slug = slugify('Niederlage in Heimbach II – Einladung zur JHV 2026!');

		expect(validateSlugFormat({ current: slug })).toBe(true);
	});
});

describe('formatted slug field', () => {
	it('keeps name, title, source and slugify of the plain slug field', () => {
		expect(formattedSlugField.name).toBe(slugField.name);
		expect(formattedSlugField.title).toBe(slugField.title);
		expect(formattedSlugField.options).toBe(slugField.options);
	});

	it('requires a slug and checks its format', () => {
		const { calls, custom } = recordValidation(formattedSlugField);

		expect(calls).toStrictEqual(['required', 'error: Die Slug ist erforderlich', 'custom']);
		expect(custom).toBe(validateSlugFormat);
	});
});
