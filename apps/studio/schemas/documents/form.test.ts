import { describe, expect, it } from 'vite-plus/test';

import { FORM_DEFAULT_TEXTS } from '@tsgi-web/shared';

import form from './form';

interface FormField {
	readonly description?: string;
	readonly group?: string;
	readonly hidden?: (context: { document?: Record<string, unknown> }) => boolean;
	readonly initialValue?: unknown;
	readonly name: string;
	readonly validation?: (rule: FakeRule) => unknown;
}

type Validator = (value: unknown, context: { document?: Record<string, unknown> }) => unknown;

/** The rule methods the form's validations call; `custom` remembers the level it gets. */
interface FakeRule {
	custom: (fn: Validator) => { level: string; validate: Validator } & Record<string, unknown>;
	required: () => FakeRule & { min: () => { error: () => string } };
}

const fakeRule: FakeRule = {
	custom: (validate) => ({
		error: () => ({ level: 'error', validate }),
		level: 'error',
		validate,
		warning: () => ({ level: 'warning', validate }),
	}),
	required: () => ({ ...fakeRule, min: () => ({ error: () => 'required' }) }),
};

const fields = form.fields as unknown as readonly FormField[];

/**
 * Looks a field of the form up by its name.
 *
 * @param name - The name of the field.
 * @returns The field definition.
 */
function getField(name: string): FormField {
	const field = fields.find((candidate) => candidate.name === name);
	if (!field) {
		throw new Error(`Expected the form to declare a "${name}" field.`);
	}
	return field;
}

/**
 * Lists the names of the fields in one tab.
 *
 * @param group - The name of the tab.
 * @returns The field names in order.
 */
function namesIn(group: string): string[] {
	return fields.filter((field) => field.group === group).map((field) => field.name);
}

describe('form document', () => {
	it('lists the tabs in order', () => {
		expect(form.groups.map((group) => group.name)).toStrictEqual([
			'general',
			'content',
			'formFields',
			'registration',
			'mails',
			'texts',
			'meta',
		]);
	});

	it('orders the fields of the first tabs', () => {
		expect(namesIn('general')).toStrictEqual(['formType', 'title', 'slug']);
		expect(namesIn('content')).toStrictEqual(['heroImage', 'intro', 'eventDate', 'location']);
		expect(namesIn('formFields')).toStrictEqual(['fields']);
		expect(namesIn('meta')).toStrictEqual(['meta']);
	});

	it('orders the fields of the registration tab', () => {
		expect(namesIn('registration')).toStrictEqual([
			'registrationStart',
			'registrationEnd',
			'capacity',
			'showRemaining',
			'cleanupAt',
		]);
	});

	it('orders the fields of the mail and text tabs', () => {
		expect(namesIn('mails')).toStrictEqual([
			'notifyOrganizer',
			'receivers',
			'sendConfirmation',
			'confirmationSubject',
			'confirmationText',
			'waitlistConfirmationText',
			'includeAnswersInConfirmation',
		]);
		expect(namesIn('texts')).toStrictEqual([
			'beforeStartText',
			'afterEndText',
			'waitlistNotice',
			'successText',
			'waitlistSuccessText',
		]);
	});

	it('offers the field types in the form', () => {
		const field = getField('fields') as unknown as { of: { type: string }[] };

		expect(field.of.map((member) => member.type)).toStrictEqual([
			'formFieldText',
			'formFieldTextarea',
			'formFieldEmail',
			'formFieldPhone',
			'formFieldNumber',
			'formFieldDate',
			'formFieldChoice',
			'formFieldConsent',
			'formFieldGroup',
			'formFieldNote',
		]);
	});

	it('hides registration settings for other form types', () => {
		const { hidden } = getField('capacity');

		expect(hidden?.({ document: { formType: 'registration' } })).toBe(false);
		expect(hidden?.({ document: { formType: 'survey' } })).toBe(true);
		expect(hidden?.({ document: undefined })).toBe(true);
	});

	it('hides the mail settings for other form types', () => {
		for (const name of namesIn('mails')) {
			expect(getField(name).hidden?.({ document: { formType: 'survey' } })).toBe(true);
		}
	});

	it('defaults the state texts', () => {
		expect(
			[
				'beforeStartText',
				'afterEndText',
				'waitlistNotice',
				'successText',
				'waitlistSuccessText',
			].map((name) => getField(name).initialValue),
		).toStrictEqual([
			FORM_DEFAULT_TEXTS.beforeStart,
			FORM_DEFAULT_TEXTS.afterEnd,
			FORM_DEFAULT_TEXTS.waitlistNotice,
			FORM_DEFAULT_TEXTS.success,
			FORM_DEFAULT_TEXTS.waitlistSuccess,
		]);
	});

	it('defaults the confirmation texts', () => {
		expect(getField('confirmationText').initialValue).toBe(
			'Vielen Dank! Deine Anmeldung ist bei uns eingegangen.',
		);
		expect(getField('waitlistConfirmationText').initialValue).toBe(
			'Vielen Dank! Du stehst auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.',
		);
	});

	it('describes what the clean-up date does', () => {
		expect(getField('cleanupAt').description).toBe(
			'Ab diesem Tag löscht die Bereinigung die als „löschen“ markierten Angaben und kürzt Datumsangaben auf das Jahr. Die Anmeldungen selbst bleiben erhalten.',
		);
	});

	it('warns about a missing or early clean-up date', () => {
		const rule = getField('cleanupAt').validation?.(fakeRule) as {
			level: string;
			validate: Validator;
		};

		expect(rule.level).toBe('warning');
		expect(rule.validate(undefined, { document: { fields: [{ retention: 'delete' }] } })).toBe(
			'Ohne Datum werden die als „löschen“ markierten Angaben nie bereinigt.',
		);
		expect(rule.validate('2027-06-01', { document: { eventDate: '2027-05-14T11:00:00Z' } })).toBe(
			true,
		);
	});

	it('warns when the confirmation recipient is cleaned up', () => {
		const rules = getField('fields').validation?.(fakeRule) as {
			level: string;
			validate: Validator;
		}[];
		const recipientRule = rules.at(-1);
		const cleanedRecipient = [{ isConfirmationRecipient: true, retention: 'delete' }];

		expect(recipientRule?.level).toBe('warning');
		expect(recipientRule?.validate(cleanedRecipient, { document: {} })).toBe(
			'Die Adresse der Bestätigungsmail bleibt im Mailversand gespeichert, auch wenn sie bereinigt wird.',
		);
		expect(rules[1]?.validate(cleanedRecipient, { document: {} })).toBe(true);
	});

	it('hides showRemaining without capacity', () => {
		const { hidden } = getField('showRemaining');

		expect(hidden?.({ document: { capacity: 20, formType: 'registration' } })).toBe(false);
		expect(hidden?.({ document: { formType: 'registration' } })).toBe(true);
		expect(hidden?.({ document: { capacity: 20, formType: 'survey' } })).toBe(true);
	});
});
