import { parseArgs } from 'node:util';

const SEPARATOR = '--';

/** The dataset the form must never reach: the site's live content. */
const PRODUCTION_DATASET = 'production';

/**
 * The published registration form the end-to-end suite renders at `/anmeldung/e2e-anmeldung`. It
 * has every kind of field the suite needs: a label and a confirmation recipient, an optional choice
 * (a group of buttons), a group with a minimum age and a consent with a link. The registration is
 * open until 2099, so the recorded fixtures stay valid.
 */
const E2E_FORM = {
	_id: 'e2e-anmeldung',
	_type: 'form',
	capacity: 8,
	fields: [
		{
			_key: 'teamname',
			_type: 'formFieldText',
			isLabel: true,
			isRequired: true,
			label: 'Teamname',
			retention: 'keep',
			width: 'half',
		},
		{
			_key: 'email',
			_type: 'formFieldEmail',
			isConfirmationRecipient: true,
			isRequired: true,
			label: 'E-Mail',
			retention: 'keep',
			width: 'half',
		},
		{
			_key: 'spielklasse',
			_type: 'formFieldChoice',
			display: 'buttons',
			isMultiple: false,
			isRequired: false,
			label: 'Spielklasse',
			options: ['Freizeit', 'Leistung'],
			retention: 'keep',
			width: 'full',
		},
		{
			_key: 'mitspieler',
			_type: 'formFieldGroup',
			fields: [
				{
					_key: 'nachname',
					_type: 'formFieldText',
					isRequired: true,
					label: 'Nachname',
					retention: 'keep',
					width: 'half',
				},
				{
					_key: 'geburtsdatum',
					_type: 'formFieldDate',
					isRequired: true,
					label: 'Geburtsdatum',
					minAge: 16,
					referenceDate: '2027-05-14',
					retention: 'year',
					width: 'half',
				},
			],
			isRequired: false,
			itemLabel: 'Spieler',
			label: 'Mitspieler',
			minItems: 1,
			width: 'full',
		},
		{
			_key: 'datenschutz',
			_type: 'formFieldConsent',
			isRequired: true,
			label: 'Datenschutz',
			text: {
				_type: 'simpleBlockContent',
				text: [
					{
						_key: 'zustimmung',
						_type: 'block',
						children: [
							{ _key: 'vorher', _type: 'span', marks: [], text: 'Ich habe die ' },
							{
								_key: 'link',
								_type: 'span',
								marks: ['datenschutz-link'],
								text: 'Datenschutzerklärung',
							},
							{
								_key: 'nachher',
								_type: 'span',
								marks: [],
								text: ' gelesen und stimme der Verarbeitung meiner Angaben zu.',
							},
						],
						markDefs: [{ _key: 'datenschutz-link', _type: 'link', href: '/datenschutz' }],
						style: 'normal',
					},
				],
			},
			width: 'full',
		},
	],
	formType: 'registration',
	notifyOrganizer: true,
	receivers: [{ _key: 'r1', _type: 'contactNameMail', email: 'e2e@example.com', name: 'E2E' }],
	registrationEnd: '2099-12-31T22:00:00Z',
	registrationStart: '2026-01-01T00:00:00Z',
	sendConfirmation: true,
	showRemaining: true,
	slug: { _type: 'slug', current: 'e2e-anmeldung' },
	title: 'E2E-Anmeldung',
};

/**
 * Reads the dataset the form is written to. It has to be named, since the studio's `.env` points
 * the CLI at `production`, and `production` itself is refused.
 *
 * @param argv - The arguments after the script path, with or without the leading `--`.
 * @returns The dataset.
 * @throws {Error} For a missing dataset, `production`, or an unknown option.
 */
function readDataset(argv: readonly string[]): string {
	const { values } = parseArgs({
		args: argv[0] === SEPARATOR ? argv.slice(1) : [...argv],
		options: { dataset: { type: 'string' } },
		strict: true,
	});
	if (!values.dataset) {
		throw new Error('--dataset fehlt, z. B. --dataset development.');
	}
	if (values.dataset === PRODUCTION_DATASET) {
		throw new Error('Das E2E-Formular gehört nicht nach production.');
	}
	return values.dataset;
}

export { E2E_FORM, readDataset };
