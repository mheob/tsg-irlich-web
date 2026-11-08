import { describe, expect, it } from 'vite-plus/test';

import { buildExportSheets } from './export-sheets';
import type { ExportSubmission, FormAnswer, FormFieldShape } from './types';

const fields: FormFieldShape[] = [
	{ _key: 'team', _type: 'formFieldText', label: 'Teamname' },
	{ _key: 'mail', _type: 'formFieldEmail', label: 'E-Mail' },
	{ _key: 'hint', _type: 'formFieldNote', label: 'Hinweis' },
	{
		_key: 'players',
		_type: 'formFieldGroup',
		fields: [
			{ _key: 'name', _type: 'formFieldText', label: 'Nachname' },
			{ _key: 'birth', _type: 'formFieldDate', label: 'Geburtsdatum' },
		],
		label: 'Mitspieler',
	},
	{ _key: 'privacy', _type: 'formFieldConsent', label: 'Datenschutz' },
];

function text(key: string, label: string, value: string): FormAnswer {
	return { _key: key, _type: 'formAnswer', fieldType: 'formFieldText', key, label, value };
}

const first: ExportSubmission = {
	_id: 's1',
	answers: [
		text('team', 'Teamname', 'Die Ersten'),
		text('mail', 'E-Mail', 'eins@example.com'),
		{
			_key: 'privacy',
			_type: 'formAnswer',
			fieldType: 'formFieldConsent',
			key: 'privacy',
			label: 'Datenschutz',
			values: ['Ja', 'Einverstanden'],
		},
		{
			_key: 'players',
			_type: 'formAnswer',
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
							label: 'Nachname',
							value: 'Muster',
						},
						{
							_key: 'g2',
							_type: 'formGroupAnswer',
							fieldType: 'formFieldDate',
							key: 'birth',
							label: 'Geburtsdatum',
							value: '2008-03-17',
						},
					],
				},
				{ _key: 'e2', _type: 'formGroupEntry', answers: [] },
			],
			fieldType: 'formFieldGroup',
			key: 'players',
			label: 'Mitspieler',
		},
	],
	label: 'Die Ersten',
	status: 'registered',
	submittedAt: '2027-04-02T08:15:00Z',
};

const second: ExportSubmission = {
	_id: 's2',
	answers: [text('team', 'Teamname', 'Die Zweiten')],
	status: 'waitlist',
	submittedAt: '2027-04-03T09:00:00Z',
};

describe('export sheets', () => {
	it('sorts submissions by submittedAt and numbers them from 1', () => {
		const [main] = buildExportSheets(fields, [second, first]);

		expect(main.rows.map((row) => row.slice(0, 2))).toStrictEqual([
			['Nr.', 'Eingang'],
			['1', '02.04.2027 10:15'],
			['2', '03.04.2027 11:00'],
		]);
		expect(main.rows[1][3]).toBe('Die Ersten');
	});

	it('builds the main sheet header', () => {
		const [main] = buildExportSheets(fields, [first]);

		expect(main.rows[0]).toStrictEqual([
			'Nr.',
			'Eingang',
			'Status',
			'Teamname',
			'E-Mail',
			'Datenschutz',
		]);
	});

	it('formats Eingang in Berlin time', () => {
		expect(buildExportSheets(fields, [first])[0]?.rows[1]?.[1]).toBe('02.04.2027 10:15');
	});

	it('writes the status label', () => {
		expect(buildExportSheets(fields, [second])[0]?.rows[1]?.[2]).toBe('Warteliste');
	});

	it('joins multiple values with ", " and leaves missing answers empty', () => {
		const [main] = buildExportSheets(fields, [first, second]);

		expect(main.rows[1][5]).toBe('Ja, Einverstanden');
		expect(main.rows[2].slice(4)).toStrictEqual(['', '']);
	});

	it('builds one sheet per group named after the group', () => {
		const sheets = buildExportSheets(fields, [second, first]);
		const group = sheets[1];

		expect(sheets).toHaveLength(2);
		expect(group.name).toBe('Mitspieler');
		expect(group.rows).toStrictEqual([
			['Nr.', 'Bezeichnung', 'Nachname', 'Geburtsdatum'],
			['1', 'Die Ersten', 'Muster', '2008-03-17'],
			['1', 'Die Ersten', '', ''],
		]);
	});

	it('appends columns for answers whose field no longer exists', () => {
		const old: ExportSubmission = {
			...second,
			answers: [
				...second.answers,
				{ ...text('old', 'Verein', 'TSG'), key: 'old' },
				{ ...text('old2', 'Verein', 'doppelt'), key: 'old' },
			],
		};
		const withOrphanEntry: ExportSubmission = {
			...first,
			answers: [
				{
					_key: 'players',
					_type: 'formAnswer',
					entries: [
						{
							_key: 'e1',
							_type: 'formGroupEntry',
							answers: [
								{
									_key: 'x',
									_type: 'formGroupAnswer',
									fieldType: 'formFieldText',
									key: 'shirt',
									label: 'Trikot',
									value: '7',
								},
							],
						},
					],
					fieldType: 'formFieldGroup',
					key: 'players',
					label: 'Mitspieler',
				},
			],
		};
		const sheets = buildExportSheets(fields, [old, withOrphanEntry]);

		expect(sheets[0]?.rows[0]).toStrictEqual([
			'Nr.',
			'Eingang',
			'Status',
			'Teamname',
			'E-Mail',
			'Datenschutz',
			'Verein',
		]);
		expect(sheets[0]?.rows[2]?.at(-1)).toBe('TSG');
		expect(sheets[1]?.rows[0]).toStrictEqual([
			'Nr.',
			'Bezeichnung',
			'Nachname',
			'Geburtsdatum',
			'Trikot',
		]);
		expect(sheets[1]?.rows[1]?.at(-1)).toBe('7');
	});

	it('sanitises and shortens sheet names', () => {
		const label = 'Spieler/innen [Team] mit einem sehr langen Namen';
		const groups: FormFieldShape[] = [
			{ _key: 'a', _type: 'formFieldGroup', fields: [], label },
			{ _key: 'b', _type: 'formFieldGroup', fields: [], label },
			{ _key: 'c', _type: 'formFieldGroup', label: '/' },
			{ _key: 'd', _type: 'formFieldGroup' },
			{ _key: 'e', _type: 'formFieldGroup', label: 'anmeldungen' },
		];
		const names = buildExportSheets(groups, [second]).map((sheet) => sheet.name);

		expect(names[1]).toBe('Spielerinnen Team mit einem seh');
		expect(names[1]).not.toMatch(/[[\]:*?/\\]/u);
		for (const name of names) {
			expect(name.length).toBeLessThanOrEqual(31);
		}
		expect(names[2]).toMatch(/ \(2\)$/u);
		expect(names.slice(3)).toStrictEqual(['Tabelle', 'Tabelle (2)', 'anmeldungen (2)']);
		expect(new Set(names.map((name) => name.toLowerCase())).size).toBe(names.length);
	});

	it('falls back to empty cells for fields and submissions without a label', () => {
		const bare: FormFieldShape[] = [
			{ _key: 't', _type: 'formFieldText' },
			{
				_key: 'g',
				_type: 'formFieldGroup',
				fields: [{ _key: 'n', _type: 'formFieldText' }],
				label: 'Gruppe',
			},
		];
		const submission: ExportSubmission = {
			...second,
			answers: [
				{
					_key: 'g',
					_type: 'formAnswer',
					entries: [{ _key: 'e', _type: 'formGroupEntry', answers: [] }],
					fieldType: 'formFieldGroup',
					key: 'g',
					label: 'Gruppe',
				},
			],
		};
		const [main, group] = buildExportSheets(bare, [submission]);

		expect(main.rows[0]).toStrictEqual(['Nr.', 'Eingang', 'Status', '']);
		expect(group.rows).toStrictEqual([
			['Nr.', 'Bezeichnung', ''],
			['1', '', ''],
		]);
	});

	it('returns only the main sheet with a header row when there are no submissions', () => {
		expect(buildExportSheets(fields, [])).toStrictEqual([
			{
				name: 'Anmeldungen',
				rows: [['Nr.', 'Eingang', 'Status', 'Teamname', 'E-Mail', 'Datenschutz']],
			},
		]);
	});
});
