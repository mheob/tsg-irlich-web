import { describe, expect, it } from 'vite-plus/test';

import { DORFTURNIER_FIELDS, field } from '../../../test-utils/form-fields';
import { getConfirmationRecipient, getSubmissionLabel, toAnswers } from './to-answers';

function counter(): () => string {
	let next = 0;
	return () => {
		next += 1;
		return `k${next}`;
	};
}

const VALUES = {
	age: '',
	cat: 'Hobby',
	food: ['Pommes'],
	mail: 'team@example.com',
	phone: ' +49 123 456 ',
	players: [
		{ birth: '2000-01-01', name: 'Max', secret: 'x' },
		{ birth: '2001-02-03', name: 'Eva', secret: '' },
	],
	privacy: true,
	remark: '  ',
	team: 'Die Dorfhelden',
};

describe('answers', () => {
	it('snapshots labels and types', () => {
		expect(
			toAnswers(DORFTURNIER_FIELDS, VALUES, counter()).map(
				({ fieldType, key, label }) => `${key}|${fieldType}|${label}`,
			),
		).toStrictEqual([
			'team|formFieldText|Teamname',
			'mail|formFieldEmail|E-Mail',
			'phone|formFieldPhone|Telefon',
			'age|formFieldNumber|Alter',
			'cat|formFieldChoice|Kategorie',
			'food|formFieldChoice|Essen',
			'privacy|formFieldConsent|Datenschutz',
			'remark|formFieldText|Anmerkung',
			'players|formFieldGroup|Spieler',
		]);
	});

	it('skips notes', () => {
		expect(toAnswers(DORFTURNIER_FIELDS, VALUES).map((answer) => answer.key)).not.toContain('note');
	});

	it('stores empty optional fields as null', () => {
		const answers = toAnswers(DORFTURNIER_FIELDS, VALUES, counter());

		expect(answers.find((answer) => answer.key === 'age')?.value).toBeNull();
		expect(answers.find((answer) => answer.key === 'remark')?.value).toBeNull();
	});

	it('trims stored text', () => {
		const answers = toAnswers(DORFTURNIER_FIELDS, VALUES, counter());

		expect(answers.find((answer) => answer.key === 'phone')?.value).toBe('+49 123 456');
	});

	it('stores a multiple choice as values', () => {
		const answers = toAnswers(DORFTURNIER_FIELDS, VALUES, counter());

		expect(answers.find((answer) => answer.key === 'food')).toMatchObject({ values: ['Pommes'] });
	});

	it('stores an empty multiple choice as null', () => {
		const answers = toAnswers(DORFTURNIER_FIELDS, { ...VALUES, food: [] }, counter());

		expect(answers.find((answer) => answer.key === 'food')?.value).toBeNull();
	});

	it('stores consent as ja', () => {
		const answers = toAnswers(DORFTURNIER_FIELDS, VALUES, counter());

		expect(answers.find((answer) => answer.key === 'privacy')?.value).toBe('ja');
	});

	it('copies only delete and year retention', () => {
		const answers = toAnswers(
			[
				field('formFieldText', 'a', 'A', { retention: 'keep' }),
				field('formFieldText', 'b', 'B', { retention: 'delete' }),
				field('formFieldDate', 'c', 'C', { retention: 'year' }),
				field('formFieldText', 'd', 'D', { retention: null }),
			],
			{ a: '1', b: '2', c: '2000-01-01', d: '4' },
			counter(),
		);

		expect(answers.map((answer) => answer.retention)).toStrictEqual([
			undefined,
			'delete',
			'year',
			undefined,
		]);
		expect(answers[0]).not.toHaveProperty('retention');
	});

	it('builds group entries with keys from createKey', () => {
		const answers = toAnswers(DORFTURNIER_FIELDS.slice(-1), VALUES, counter());

		expect(answers).toStrictEqual([
			{
				_key: 'k1',
				_type: 'formAnswer',
				entries: [
					{
						_key: 'k2',
						_type: 'formGroupEntry',
						answers: [
							{
								_key: 'k3',
								_type: 'formGroupAnswer',
								fieldType: 'formFieldText',
								key: 'name',
								label: 'Name',
								value: 'Max',
							},
							{
								_key: 'k4',
								_type: 'formGroupAnswer',
								fieldType: 'formFieldDate',
								key: 'birth',
								label: 'Geburtsdatum',
								retention: 'year',
								value: '2000-01-01',
							},
							{
								_key: 'k5',
								_type: 'formGroupAnswer',
								fieldType: 'formFieldText',
								key: 'secret',
								label: 'Geheim',
								retention: 'delete',
								value: 'x',
							},
						],
					},
					{
						_key: 'k6',
						_type: 'formGroupEntry',
						answers: [
							{
								_key: 'k7',
								_type: 'formGroupAnswer',
								fieldType: 'formFieldText',
								key: 'name',
								label: 'Name',
								value: 'Eva',
							},
							{
								_key: 'k8',
								_type: 'formGroupAnswer',
								fieldType: 'formFieldDate',
								key: 'birth',
								label: 'Geburtsdatum',
								retention: 'year',
								value: '2001-02-03',
							},
							{
								_key: 'k9',
								_type: 'formGroupAnswer',
								fieldType: 'formFieldText',
								key: 'secret',
								label: 'Geheim',
								retention: 'delete',
								value: null,
							},
						],
					},
				],
				fieldType: 'formFieldGroup',
				key: 'players',
				label: 'Spieler',
			},
		]);
	});

	it('uses a random uuid by default', () => {
		const keys = toAnswers([field('formFieldText', 'a', 'A')], { a: 'x' }).map(
			(answer) => answer._key,
		);

		expect(keys).toStrictEqual([expect.stringMatching(/^[0-9a-f-]{36}$/u)]);
	});

	it('stores a group without entries as an empty list', () => {
		const group = field('formFieldGroup', 'g', 'G', {
			fields: [field('formFieldText', 'n', 'N')],
			itemLabel: 'E',
		});

		expect(toAnswers([group], { g: [] }, counter())[0]?.entries).toStrictEqual([]);
	});
});

describe('submission label and confirmation recipient', () => {
	it('returns the isLabel value', () => {
		expect(getSubmissionLabel(DORFTURNIER_FIELDS, VALUES)).toBe('Die Dorfhelden');
	});

	it('returns null without a label value', () => {
		expect(getSubmissionLabel(DORFTURNIER_FIELDS, { ...VALUES, team: ' ' })).toBeNull();
		expect(getSubmissionLabel([field('formFieldText', 'a', 'A')], { a: 'x' })).toBeNull();
	});

	it('returns the marked email', () => {
		expect(getConfirmationRecipient(DORFTURNIER_FIELDS, VALUES)).toBe('team@example.com');
	});

	it('returns null without a marked or filled email', () => {
		expect(getConfirmationRecipient(DORFTURNIER_FIELDS, { ...VALUES, mail: '' })).toBeNull();
		expect(
			getConfirmationRecipient([field('formFieldEmail', 'm', 'M')], { m: 'a@b.de' }),
		).toBeNull();
	});
});
