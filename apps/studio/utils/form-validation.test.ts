import { describe, expect, it } from 'vite-plus/test';

import { isRegistrationForm, validateFormFields } from './form-validation';

const DORFTURNIER_FIELDS = [
	{ _type: 'formFieldText', isLabel: true },
	{ _type: 'formFieldEmail', isConfirmationRecipient: true },
	{ _type: 'formFieldPhone' },
	{ _type: 'formFieldConsent' },
];

describe('form type check', () => {
	it('recognises a registration form', () => {
		expect(isRegistrationForm({ formType: 'registration' })).toBe(true);
	});

	it('rejects another type and a missing document', () => {
		expect(isRegistrationForm({ formType: 'survey' })).toBe(false);
		// oxlint-disable-next-line unicorn/no-useless-undefined
		expect(isRegistrationForm(undefined)).toBe(false);
	});
});

describe('form fields validation', () => {
	it('accepts the fields of a Dorfturnier registration', () => {
		expect(validateFormFields(DORFTURNIER_FIELDS, { sendConfirmation: true })).toBe(true);
	});

	it('accepts a missing list', () => {
		// oxlint-disable-next-line unicorn/no-useless-undefined
		expect(validateFormFields(undefined, undefined)).toBe(true);
	});

	it('accepts no marked email field without a confirmation', () => {
		expect(validateFormFields([{ _type: 'formFieldEmail' }], { sendConfirmation: false })).toBe(
			true,
		);
	});

	it('allows at most one label field', () => {
		expect(
			validateFormFields(
				[
					{ _type: 'formFieldText', isLabel: true },
					{ _type: 'formFieldText', isLabel: true },
				],
				{},
			),
		).toBe('Höchstens ein Feld darf den Eingang bezeichnen');
	});

	it('allows at most one confirmation recipient', () => {
		expect(
			validateFormFields(
				[
					{ _type: 'formFieldEmail', isConfirmationRecipient: true },
					{ _type: 'formFieldEmail', isConfirmationRecipient: true },
				],
				{},
			),
		).toBe('Höchstens ein E-Mail-Feld darf die Bestätigung empfangen');
	});

	it('asks for a recipient when a confirmation is sent', () => {
		expect(validateFormFields([{ _type: 'formFieldEmail' }], { sendConfirmation: true })).toBe(
			'Für die Bestätigungsmail ein E-Mail-Feld als Empfänger markieren',
		);
	});

	it('checks the labels before the recipients', () => {
		expect(
			validateFormFields(
				[
					{ _type: 'formFieldText', isLabel: true },
					{ _type: 'formFieldText', isLabel: true },
					{ _type: 'formFieldEmail', isConfirmationRecipient: true },
					{ _type: 'formFieldEmail', isConfirmationRecipient: true },
				],
				{ sendConfirmation: true },
			),
		).toBe('Höchstens ein Feld darf den Eingang bezeichnen');
	});
});
