import { describe, expect, it } from 'vite-plus/test';

import { DORFTURNIER_FIELDS, field } from '../../../test-utils/form-fields';
import { buildFormSchema, getDefaultValues } from './build-form-schema';
import type { FormFieldDefinition } from './types';

type Values = Record<string, unknown>;

function validPlayer(overrides: Values = {}): Values {
	return { birth: '2000-01-01', name: 'Max', secret: '', ...overrides };
}

function validPlayers(count: number): Values[] {
	return Array.from({ length: count }, () => validPlayer());
}

function validValues(overrides: Values = {}): Values {
	return {
		age: '12',
		cat: 'Hobby',
		food: [],
		mail: 'team@example.com',
		phone: '+49 123 456789',
		players: validPlayers(6),
		privacy: true,
		remark: '',
		team: 'Die Dorfhelden',
		...overrides,
	};
}

// The values with five valid players and a sixth that carries the overrides.
function withPlayers(count: number): Values {
	return validValues({ players: validPlayers(count) });
}

function withLastPlayer(overrides: Values): Values {
	return validValues({ players: [...validPlayers(5), validPlayer(overrides)] });
}

function messagesOf(
	values: Values,
	fields: readonly FormFieldDefinition[] = DORFTURNIER_FIELDS,
): string[] {
	const result = buildFormSchema(fields).safeParse(values);
	return result.success
		? []
		: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

describe('form schema', () => {
	it('accepts a complete submission', () => {
		expect(messagesOf(validValues())).toStrictEqual([]);
	});

	it('ignores note fields', () => {
		const keys = Object.keys(buildFormSchema(DORFTURNIER_FIELDS).shape);

		expect(keys).not.toContain('note');
	});

	it('rejects whitespace-only required text', () => {
		expect(messagesOf(validValues({ team: '   ' }))).toStrictEqual([
			'team: Bitte fülle dieses Feld aus.',
		]);
	});

	it('trims text', () => {
		const result = buildFormSchema(DORFTURNIER_FIELDS).parse(validValues({ team: '  Dorf  ' }));

		expect(result).toMatchObject({ team: 'Dorf' });
	});

	it('rejects text over the maximum length', () => {
		const tooLong = validValues({ remark: 'x'.repeat(11) });

		expect(messagesOf(tooLong)).toStrictEqual(['remark: Bitte höchstens 10 Zeichen eingeben.']);
	});

	it('accepts an empty optional text', () => {
		expect(messagesOf(validValues({ remark: '' }))).toStrictEqual([]);
	});

	it('rejects an invalid email', () => {
		expect(messagesOf(validValues({ mail: 'nope' }))).toStrictEqual([
			'mail: Bitte gib eine gültige E-Mail-Adresse ein.',
		]);
	});

	it('accepts an empty optional email', () => {
		const schema = buildFormSchema([field('formFieldEmail', 'mail', 'E-Mail')]);

		expect(schema.safeParse({ mail: '' }).success).toBe(true);
		expect(schema.safeParse({ mail: 'x' }).success).toBe(false);
	});

	it('rejects an empty required email', () => {
		expect(messagesOf(validValues({ mail: '' }))).toStrictEqual([
			'mail: Bitte gib eine gültige E-Mail-Adresse ein.',
		]);
	});

	it('rejects an invalid phone number', () => {
		expect(messagesOf(validValues({ phone: 'abc' }))).toStrictEqual([
			'phone: Bitte gib eine gültige Telefonnummer ein.',
		]);
	});

	it('accepts phone numbers with separators', () => {
		expect(messagesOf(validValues({ phone: '(07123) 45-678' }))).toStrictEqual([]);
	});

	it('rejects a number that is not an integer', () => {
		expect(messagesOf(validValues({ age: '1.5' }))).toStrictEqual([
			'age: Bitte gib eine ganze Zahl ein.',
		]);
	});

	it('rejects a number below the minimum and above the maximum', () => {
		expect(messagesOf(validValues({ age: '4' }))).toStrictEqual([
			'age: Bitte mindestens 5 eingeben.',
		]);
		expect(messagesOf(validValues({ age: '100' }))).toStrictEqual([
			'age: Bitte höchstens 99 eingeben.',
		]);
	});

	it('accepts an empty optional number', () => {
		expect(messagesOf(validValues({ age: '' }))).toStrictEqual([]);
	});

	it('rejects a choice outside the options', () => {
		expect(messagesOf(validValues({ cat: 'Profi' }))).toStrictEqual([
			'cat: Bitte wähle eine Option.',
		]);
		expect(messagesOf(validValues({ cat: '' }))).toStrictEqual(['cat: Bitte wähle eine Option.']);
	});

	it('rejects a multiple choice outside the options', () => {
		expect(messagesOf(validValues({ food: ['Sushi'] }))).toStrictEqual([
			'food.0: Bitte wähle eine Option.',
		]);
	});

	it('accepts a multiple choice within the options', () => {
		expect(messagesOf(validValues({ food: ['Pommes', 'Salat'] }))).toStrictEqual([]);
	});

	it('requires one option of a required multiple choice', () => {
		const required = field('formFieldChoice', 'food', 'Essen', {
			isMultiple: true,
			isRequired: true,
			options: ['a'],
		});

		expect(messagesOf({ food: [] }, [required])).toStrictEqual([
			'food: Bitte wähle mindestens eine Option.',
		]);
	});

	it('requires consent', () => {
		expect(messagesOf(validValues({ privacy: false }))).toStrictEqual([
			'privacy: Bitte bestätige dies, um fortzufahren.',
		]);
	});

	it('rejects a date that is no calendar date', () => {
		expect(messagesOf(withLastPlayer({ birth: '2000-02-30' }))).toStrictEqual([
			'players.5.birth: Bitte gib ein gültiges Datum ein.',
		]);
		expect(messagesOf(withLastPlayer({ birth: '01.01.2000' }))).toStrictEqual([
			'players.5.birth: Bitte gib ein gültiges Datum ein.',
		]);
	});

	it('rejects a player younger than 16 on 14.05.2027', () => {
		expect(messagesOf(withLastPlayer({ birth: '2011-05-15' }))).toStrictEqual([
			'players.5.birth: Das Mindestalter ist 16 Jahre am 14.05.2027.',
		]);
	});

	it('accepts a player who turns 16 on the reference date', () => {
		expect(messagesOf(withLastPlayer({ birth: '2011-05-14' }))).toStrictEqual([]);
	});

	it('requires at least 6 players', () => {
		expect(messagesOf(withPlayers(5))).toStrictEqual([
			'players: Bitte mindestens 6 Einträge „Spieler“ angeben.',
		]);
	});

	it('allows at most 8 players', () => {
		expect(messagesOf(withPlayers(9))).toStrictEqual([
			'players: Bitte höchstens 8 Einträge „Spieler“ angeben.',
		]);
	});

	it('requires one entry of a required group without minimum', () => {
		const group = field('formFieldGroup', 'g', 'G', {
			fields: [field('formFieldText', 'n', 'N')],
			isRequired: true,
			itemLabel: 'Eintrag',
		});

		expect(buildFormSchema([group]).safeParse({ g: [] }).success).toBe(false);
		const optional = field('formFieldGroup', 'g', 'G', {
			fields: [field('formFieldText', 'n', 'N')],
			itemLabel: 'Eintrag',
		});

		expect(buildFormSchema([optional]).safeParse({ g: [] }).success).toBe(true);
	});

	it('validates the fields of every entry', () => {
		expect(messagesOf(withLastPlayer({ name: ' ' }))).toStrictEqual([
			'players.5.name: Bitte fülle dieses Feld aus.',
		]);
	});

	it('requires consent even when the field is not marked required', () => {
		const unmarked = field('formFieldConsent', 'c', 'C', { isRequired: null });
		const optional = field('formFieldConsent', 'd', 'D', { isRequired: false });

		expect(messagesOf({ c: false }, [unmarked])).toStrictEqual([
			'c: Bitte bestätige dies, um fortzufahren.',
		]);
		expect(messagesOf({ d: false }, [optional])).toStrictEqual([
			'd: Bitte bestätige dies, um fortzufahren.',
		]);
		expect(messagesOf({ d: true }, [optional])).toStrictEqual([]);
	});
});

function manyEntries(count: number): { n: string }[] {
	return Array.from({ length: count }, () => ({ n: 'x' }));
}

describe('input caps', () => {
	it('caps text without maxLength at 500 characters', () => {
		const text = field('formFieldText', 't', 'T');

		expect(messagesOf({ t: 'x'.repeat(500) }, [text])).toStrictEqual([]);
		expect(messagesOf({ t: 'x'.repeat(501) }, [text])).toStrictEqual([
			't: Bitte höchstens 500 Zeichen eingeben.',
		]);
	});

	it('caps a textarea without maxLength at 5000 characters', () => {
		const area = field('formFieldTextarea', 't', 'T');

		expect(messagesOf({ t: 'x'.repeat(5000) }, [area])).toStrictEqual([]);
		expect(messagesOf({ t: 'x'.repeat(5001) }, [area])).toStrictEqual([
			't: Bitte höchstens 5000 Zeichen eingeben.',
		]);
	});

	it('caps an email at 254 characters', () => {
		const mail = field('formFieldEmail', 'm', 'M');
		const longest = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.de`;

		expect(longest.length).toBeGreaterThan(254);
		expect(messagesOf({ m: longest }, [mail])).toStrictEqual([
			'm: Bitte gib eine gültige E-Mail-Adresse ein.',
		]);
	});

	it('caps a number at 15 characters', () => {
		const number = field('formFieldNumber', 'n', 'N');

		expect(messagesOf({ n: '1'.repeat(15) }, [number])).toStrictEqual([]);
		expect(messagesOf({ n: '1'.repeat(16) }, [number])).toStrictEqual([
			'n: Bitte gib eine ganze Zahl ein.',
		]);
	});

	it('rejects duplicate options of a multiple choice', () => {
		const choice = field('formFieldChoice', 'c', 'C', { isMultiple: true, options: ['a', 'b'] });

		expect(messagesOf({ c: ['a', 'a'] }, [choice])).toStrictEqual(['c: Bitte wähle eine Option.']);
	});

	it('rejects more entries than a multiple choice has options', () => {
		const choice = field('formFieldChoice', 'c', 'C', { isMultiple: true, options: ['a'] });

		expect(messagesOf({ c: ['a', 'b'] }, [choice])).toStrictEqual([
			'c.1: Bitte wähle eine Option.',
			'c: Bitte wähle eine Option.',
		]);
	});

	it('caps a group without maxItems at 100 entries', () => {
		const group = field('formFieldGroup', 'g', 'G', {
			fields: [field('formFieldText', 'n', 'N')],
			itemLabel: 'Eintrag',
		});
		expect(messagesOf({ g: manyEntries(100) }, [group])).toStrictEqual([]);
		expect(messagesOf({ g: manyEntries(101) }, [group])).toStrictEqual([
			'g: Bitte höchstens 100 Einträge „Eintrag“ angeben.',
		]);
	});
});

describe('default values', () => {
	it('derives a default per field type', () => {
		expect(getDefaultValues(DORFTURNIER_FIELDS)).toStrictEqual({
			age: '',
			cat: '',
			food: [],
			mail: '',
			phone: '',
			players: [{ birth: '', name: '', secret: '' }],
			privacy: false,
			remark: '',
			team: '',
		});
	});

	it('starts an optional group empty', () => {
		const group = field('formFieldGroup', 'g', 'G', {
			fields: [field('formFieldText', 'n', 'N')],
			itemLabel: 'Eintrag',
		});

		expect(getDefaultValues([group])).toStrictEqual({ g: [] });
	});
});
