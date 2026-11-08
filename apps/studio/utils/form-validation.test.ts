import { describe, expect, it } from 'vite-plus/test';

import {
	isCleanupBeforeEvent,
	isCleanupDateMissing,
	isRegistrationForm,
	validateCleanupDate,
	validateFormFields,
	validateRecipientRetention,
} from './form-validation';

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

const MISSING_CLEANUP = 'Ohne Datum werden die als „löschen“ markierten Angaben nie bereinigt.';
const EARLY_CLEANUP =
	'Die Bereinigung liegt vor der Veranstaltung – die Angaben fehlen dann am Veranstaltungstag.';

describe('missing clean-up date', () => {
	it('is missing when a field is deleted or cut to the year', () => {
		expect(isCleanupDateMissing(undefined, { fields: [{ retention: 'delete' }] })).toBe(true);
		expect(isCleanupDateMissing('', { fields: [{ retention: 'year' }] })).toBe(true);
	});

	it('looks into the fields of a group', () => {
		const fields = [
			{ _type: 'formFieldGroup', fields: [{ retention: 'keep' }, { retention: 'year' }] },
		];

		expect(isCleanupDateMissing(undefined, { fields })).toBe(true);
	});

	it('is not missing when every field is kept or a day is set', () => {
		const fields = [
			{ retention: 'keep' },
			{ _type: 'formFieldNote' },
			{ _type: 'formFieldGroup', fields: [{ retention: 'keep' }], retention: 'keep' },
		];

		expect(isCleanupDateMissing(undefined, { fields })).toBe(false);
		expect(isCleanupDateMissing('2027-06-01', { fields: [{ retention: 'delete' }] })).toBe(false);
		// oxlint-disable-next-line unicorn/no-useless-undefined
		expect(isCleanupDateMissing(undefined, undefined)).toBe(false);
	});
});

describe('clean-up before the event', () => {
	const event = { eventDate: '2027-05-14T11:00:00Z', registrationEnd: '2027-04-30T21:59:00Z' };

	it('warns for a day before the event and the event day itself', () => {
		expect(isCleanupBeforeEvent('2027-05-13', event)).toBe(true);
		// The daily run starts at 03:00 UTC, before any event of that day.
		expect(isCleanupBeforeEvent('2027-05-14', event)).toBe(true);
		expect(isCleanupBeforeEvent('2027-05-15', event)).toBe(false);
	});

	it('takes the event day in Berlin', () => {
		// 23:30 UTC on the 14th is already the 15th in Berlin.
		const lateEvent = { eventDate: '2027-05-14T23:30:00Z' };

		expect(isCleanupBeforeEvent('2027-05-15', lateEvent)).toBe(true);
		expect(isCleanupBeforeEvent('2027-05-16', lateEvent)).toBe(false);
	});

	it('falls back to the end of the registration without an event date', () => {
		const withoutEvent = { eventDate: '', registrationEnd: '2027-04-30T21:59:00Z' };

		expect(isCleanupBeforeEvent('2027-04-30', withoutEvent)).toBe(true);
		expect(isCleanupBeforeEvent('2027-05-01', withoutEvent)).toBe(false);
	});

	it('has nothing to compare without a day or a date', () => {
		expect(isCleanupBeforeEvent(undefined, event)).toBe(false);
		expect(isCleanupBeforeEvent('', event)).toBe(false);
		expect(isCleanupBeforeEvent('2027-01-01', {})).toBe(false);
		expect(isCleanupBeforeEvent('2027-01-01', { eventDate: 'kein Datum' })).toBe(false);
	});
});

describe('clean-up date validation', () => {
	it('warns about a missing day first', () => {
		expect(validateCleanupDate(undefined, { fields: [{ retention: 'delete' }] })).toBe(
			MISSING_CLEANUP,
		);
	});

	it('warns about a day before the event', () => {
		expect(validateCleanupDate('2027-05-01', { eventDate: '2027-05-14T11:00:00Z' })).toBe(
			EARLY_CLEANUP,
		);
	});

	it('accepts a day after the event', () => {
		expect(
			validateCleanupDate('2027-06-01', {
				eventDate: '2027-05-14T11:00:00Z',
				fields: [{ retention: 'delete' }],
			}),
		).toBe(true);
	});
});

describe('confirmation recipient retention', () => {
	it('warns when the address of the confirmation is cleaned up', () => {
		expect(
			validateRecipientRetention([
				{ _type: 'formFieldText', retention: 'delete' },
				{ _type: 'formFieldEmail', isConfirmationRecipient: true, retention: 'delete' },
			]),
		).toBe(
			'Die Adresse der Bestätigungsmail bleibt im Mailversand gespeichert, auch wenn sie bereinigt wird.',
		);
	});

	it('accepts a kept address and a form without recipient', () => {
		expect(
			validateRecipientRetention([
				{ _type: 'formFieldEmail', isConfirmationRecipient: true, retention: 'keep' },
				{ _type: 'formFieldText', retention: 'delete' },
			]),
		).toBe(true);
		expect(validateRecipientRetention([{ _type: 'formFieldEmail', retention: 'delete' }])).toBe(
			true,
		);
		// oxlint-disable-next-line unicorn/no-useless-undefined
		expect(validateRecipientRetention(undefined)).toBe(true);
	});
});
