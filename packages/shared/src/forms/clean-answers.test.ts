import { describe, expect, it } from 'vite-plus/test';

import { cleanAnswers } from './clean-answers';
import type { FormAnswer } from './types';

function deepFreeze<T>(value: T): T {
	if (typeof value === 'object' && value !== null) {
		for (const child of Object.values(value)) {
			deepFreeze(child);
		}
		Object.freeze(value);
	}
	return value;
}

function answer(overrides: Partial<FormAnswer>): FormAnswer {
	return {
		_key: 'a1',
		_type: 'formAnswer',
		fieldType: 'formFieldText',
		key: 'f1',
		label: 'Feld',
		...overrides,
	};
}

describe('answer clean-up', () => {
	it('deletes value and values of answers marked delete', () => {
		const [single, multi] = cleanAnswers([
			answer({ retention: 'delete', value: 'geheim' }),
			answer({ retention: 'delete', values: ['a', 'b'] }),
		]);

		expect(single).not.toHaveProperty('value');
		expect(multi).not.toHaveProperty('values');
		expect(single.label).toBe('Feld');
	});

	it('cuts a date marked year to its year', () => {
		expect(cleanAnswers([answer({ retention: 'year', value: '2008-03-17' })])[0]?.value).toBe(
			'2008',
		);
	});

	it('keeps a year answer without a value as it is', () => {
		const empty = answer({ retention: 'year' });

		expect(cleanAnswers([empty])).toStrictEqual([empty]);
	});

	it('cleans answers inside group entries', () => {
		const [group] = cleanAnswers([
			answer({
				entries: [
					{
						_key: 'e1',
						_type: 'formGroupEntry',
						answers: [
							{
								_key: 'g1',
								_type: 'formGroupAnswer',
								fieldType: 'formFieldDate',
								key: 'birth',
								label: 'Geburtsdatum',
								retention: 'year',
								value: '2008-03-17',
							},
							{
								_key: 'g2',
								_type: 'formGroupAnswer',
								fieldType: 'formFieldText',
								key: 'name',
								label: 'Name',
								retention: 'delete',
								value: 'Muster',
							},
							{
								_key: 'g3',
								_type: 'formGroupAnswer',
								fieldType: 'formFieldText',
								key: 'club',
								label: 'Verein',
								value: 'TSG',
							},
						],
					},
				],
			}),
		]);

		const answers = group.entries?.flatMap((entry) => entry.answers);

		expect(answers?.map((groupAnswer) => groupAnswer.value)).toStrictEqual([
			'2008',
			undefined,
			'TSG',
		]);
		expect(answers?.map((groupAnswer) => 'value' in groupAnswer)).toStrictEqual([
			true,
			false,
			true,
		]);
	});

	it('leaves answers without retention untouched', () => {
		const plain = answer({ value: 'bleibt' });

		expect(cleanAnswers([plain])).toStrictEqual([plain]);
	});

	it('is idempotent', () => {
		const input = [
			answer({ retention: 'year', value: '2008-03-17' }),
			answer({ retention: 'delete', value: 'x' }),
		];
		const once = cleanAnswers(input);

		expect(cleanAnswers(once)).toStrictEqual(once);
		expect(cleanAnswers(once)[0]?.value).toBe('2008');
	});

	it('does not mutate its input', () => {
		const input = deepFreeze([
			answer({ retention: 'year', value: '2008-03-17' }),
			answer({
				entries: [
					{
						_key: 'e1',
						_type: 'formGroupEntry',
						answers: [
							{
								_key: 'g1',
								_type: 'formGroupAnswer',
								fieldType: 'formFieldText',
								key: 'name',
								label: 'Name',
								retention: 'delete',
								value: 'Muster',
							},
						],
					},
				],
			}),
		]);

		expect(() => cleanAnswers(input)).not.toThrow();
		expect(input[0]?.value).toBe('2008-03-17');
	});
});
