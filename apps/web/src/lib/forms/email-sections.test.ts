import { describe, expect, it } from 'vite-plus/test';

import type { FormAnswer } from '@tsgi-web/shared';

import { toEmailSections } from './email-sections';

function answer(key: string, label: string, overrides: Partial<FormAnswer> = {}): FormAnswer {
	return {
		_key: `k-${key}`,
		_type: 'formAnswer',
		fieldType: 'formFieldText',
		key,
		label,
		...overrides,
	};
}

const GROUP_ANSWER: FormAnswer = answer('players', 'Spieler', {
	entries: [
		{
			_key: 'e1',
			_type: 'formGroupEntry',
			answers: [
				{
					_key: 'a1',
					_type: 'formGroupAnswer',
					fieldType: 'formFieldText',
					key: 'name',
					label: 'Name',
					value: 'Max',
				},
				{
					_key: 'a2',
					_type: 'formGroupAnswer',
					fieldType: 'formFieldDate',
					key: 'birth',
					label: 'Geburtsdatum',
					retention: 'year',
					value: '2000-01-01',
				},
			],
		},
		{
			_key: 'e2',
			_type: 'formGroupEntry',
			answers: [
				{
					_key: 'a3',
					_type: 'formGroupAnswer',
					fieldType: 'formFieldText',
					key: 'name',
					label: 'Name',
					value: 'Eva',
				},
			],
		},
	],
	fieldType: 'formFieldGroup',
});

describe('email sections', () => {
	it('drops answers with retention and reports it', () => {
		const result = toEmailSections([
			answer('team', 'Teamname', { value: 'Die Dorfhelden' }),
			answer('address', 'Adresse', { retention: 'delete', value: 'Hauptstr. 1' }),
		]);

		expect(result).toStrictEqual({
			hasHiddenFields: true,
			sections: [{ rows: [{ label: 'Teamname', value: 'Die Dorfhelden' }] }],
		});
	});

	it('reports nothing hidden when every answer is shown', () => {
		expect(toEmailSections([answer('team', 'Teamname', { value: 'A' })]).hasHiddenFields).toBe(
			false,
		);
	});

	it('heads group entries with label and number', () => {
		const { hasHiddenFields, sections } = toEmailSections([
			answer('team', 'Teamname', { value: 'A' }),
			GROUP_ANSWER,
		]);

		expect(sections).toStrictEqual([
			{ rows: [{ label: 'Teamname', value: 'A' }] },
			{ heading: 'Spieler 1', rows: [{ label: 'Name', value: 'Max' }] },
			{ heading: 'Spieler 2', rows: [{ label: 'Name', value: 'Eva' }] },
		]);
		expect(hasHiddenFields).toBe(true);
	});

	it('joins multiple values and shows a dash for empty ones', () => {
		const { sections } = toEmailSections([
			answer('food', 'Essen', { values: ['Bratwurst', 'Pommes'] }),
			answer('remark', 'Anmerkung', { value: null }),
			answer('none', 'Leer', { values: [] }),
		]);

		expect(sections[0].rows).toStrictEqual([
			{ label: 'Essen', value: 'Bratwurst, Pommes' },
			{ label: 'Anmerkung', value: '–' },
			{ label: 'Leer', value: '–' },
		]);
	});
});
