import { within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { submitForm } from '@/actions/submit-form';
import type { FormFieldDefinition } from '@/lib/forms/types';

import { blockText, field } from '../../../../test-utils/form-fields';
import { renderWithUser } from '../../../../test-utils/render';
import { RegistrationForm } from './registration-form';

// The fields only exist inside the form, which imports the action.
vi.mock(import('@/actions/submit-form'), () => ({ submitForm: vi.fn() }));

const mockedSubmitForm = vi.mocked(submitForm);

const CHOICES: FormFieldDefinition[] = [
	field('formFieldChoice', 'cat', 'Kategorie', {
		display: 'buttons',
		helpText: 'Aktiv heißt: mindestens ein Einsatz',
		options: ['Hobby', 'Aktive'],
	}),
	field('formFieldChoice', 'size', 'Größe', {
		display: 'select',
		helpText: 'Wie im Shop',
		options: ['S', 'M'],
	}),
	field('formFieldChoice', 'food', 'Essen', { isMultiple: true, options: ['Bratwurst', 'Pommes'] }),
];

function attributesOf(element: HTMLElement) {
	return {
		autocomplete: element.getAttribute('autocomplete'),
		inputmode: element.getAttribute('inputmode'),
		tag: element.tagName,
		type: element.getAttribute('type'),
	};
}

function renderFields(fields: FormFieldDefinition[]) {
	return renderWithUser(
		<RegistrationForm
			fields={fields}
			formId="form-1"
			isWaitlist={false}
			successText="Danke"
			waitlistSuccessText="Warteliste"
		/>,
	);
}

describe('the field renderer', () => {
	afterEach(() => {
		mockedSubmitForm.mockReset();
	});

	it('renders each field type with its label', () => {
		const { getByLabelText, getByRole } = renderFields([
			field('formFieldText', 'team', 'Teamname', { helpText: 'So steht es im Spielplan' }),
			field('formFieldTextarea', 'remark', 'Anmerkung', {
				helpText: 'Alles, was wir wissen sollten',
			}),
			field('formFieldEmail', 'mail', 'E-Mail'),
			field('formFieldPhone', 'phone', 'Telefon'),
			field('formFieldNumber', 'age', 'Alter'),
			field('formFieldDate', 'birth', 'Geburtsdatum'),
		]);

		expect(
			attributesOf(
				getByRole('textbox', { description: 'So steht es im Spielplan', name: 'Teamname' }),
			),
		).toStrictEqual({ autocomplete: null, inputmode: null, tag: 'INPUT', type: 'text' });
		expect(
			getByRole('textbox', { description: 'Alles, was wir wissen sollten', name: 'Anmerkung' })
				.tagName,
		).toBe('TEXTAREA');
		expect(
			[getByRole('textbox', { name: 'E-Mail' }), getByRole('textbox', { name: 'Telefon' })].map(
				(element) => attributesOf(element),
			),
		).toStrictEqual([
			{ autocomplete: 'email', inputmode: null, tag: 'INPUT', type: 'email' },
			{ autocomplete: 'tel', inputmode: null, tag: 'INPUT', type: 'tel' },
		]);
		expect(attributesOf(getByRole('textbox', { name: 'Alter' }))).toStrictEqual({
			autocomplete: null,
			inputmode: 'numeric',
			tag: 'INPUT',
			type: 'text',
		});
		// A date input has no role of its own.
		expect(getByLabelText(/^Geburtsdatum/u).getAttribute('type')).toBe('date');
	});

	it('marks required controls with aria-required', () => {
		const { getByLabelText, getByRole } = renderFields([
			field('formFieldText', 'team', 'Teamname', { isRequired: true }),
			field('formFieldTextarea', 'remark', 'Anmerkung'),
			field('formFieldEmail', 'mail', 'E-Mail', { isRequired: true }),
			field('formFieldPhone', 'phone', 'Telefon', { isRequired: true }),
			field('formFieldDate', 'birth', 'Geburtsdatum', { isRequired: true }),
			field('formFieldChoice', 'size', 'Größe', {
				display: 'select',
				isRequired: true,
				options: ['S', 'M'],
			}),
			field('formFieldTextarea', 'wish', 'Wunsch', { isRequired: true }),
			field('formFieldConsent', 'privacy', 'Datenschutz', {
				helpText: 'Ohne Zustimmung keine Teilnahme',
				text: blockText('Ich stimme zu.'),
			}),
		]);

		const required = [
			getByRole('textbox', { name: 'Teamname' }),
			getByRole('textbox', { name: 'E-Mail' }),
			getByRole('textbox', { name: 'Telefon' }),
			getByLabelText(/^Geburtsdatum/u),
			getByRole('combobox', { name: 'Größe' }),
			getByRole('textbox', { name: 'Wunsch' }),
			getByRole('checkbox', {
				description: 'Ohne Zustimmung keine Teilnahme',
				name: 'Ich stimme zu.',
			}),
		];

		expect(required.map((control) => control.getAttribute('aria-required'))).toStrictEqual(
			Array.from({ length: required.length }, () => 'true'),
		);
		expect(getByRole('textbox', { name: 'Anmerkung' }).getAttribute('aria-required')).toBeNull();
	});

	it('renders choice as buttons, select or checkboxes', async () => {
		const { getByRole, user } = renderFields(CHOICES);

		await user.click(getByRole('button', { name: 'Hobby' }));
		await user.click(getByRole('combobox', { name: 'Größe' }));
		await user.click(getByRole('option', { name: 'M' }));
		await user.click(getByRole('checkbox', { name: 'Pommes' }));

		const category = within(
			getByRole('group', { description: 'Aktiv heißt: mindestens ein Einsatz', name: 'Kategorie' }),
		);
		expect(
			['Hobby', 'Aktive'].map((name) =>
				category.getByRole('button', { name }).getAttribute('aria-pressed'),
			),
		).toStrictEqual(['true', 'false']);
		expect(
			getByRole('combobox', { description: 'Wie im Shop', name: 'Größe' }).textContent,
		).toContain('M');
		const food = within(getByRole('group', { name: 'Essen' }));
		expect(
			['Bratwurst', 'Pommes'].map((name) =>
				food.getByRole('checkbox', { name }).getAttribute('aria-checked'),
			),
		).toStrictEqual(['false', 'true']);
	});

	it('hands the chosen options to the action', async () => {
		mockedSubmitForm.mockResolvedValue({ data: { status: 'registered' } });
		const { findByText, getByRole, user } = renderFields(CHOICES);

		await user.click(getByRole('button', { name: 'Aktive' }));
		await user.click(getByRole('button', { name: 'Hobby' }));
		await user.click(getByRole('button', { name: 'Hobby' }));
		await user.click(getByRole('checkbox', { name: 'Bratwurst' }));
		await user.click(getByRole('checkbox', { name: 'Pommes' }));
		await user.click(getByRole('button', { name: 'Anmelden' }));

		await findByText('Danke');
		// Pressing the pressed button again takes the choice back.
		expect(mockedSubmitForm).toHaveBeenCalledWith(
			expect.objectContaining({ values: { cat: '', food: ['Bratwurst', 'Pommes'], size: '' } }),
		);
	});

	// A group may not carry `aria-required`, so its name says it; its first option takes the focus.
	it('describes a required choice left empty with its message', async () => {
		const { findByText, getByRole, user } = renderFields([
			field('formFieldChoice', 'food', 'Essen', {
				isMultiple: true,
				isRequired: true,
				options: ['Bratwurst', 'Pommes'],
			}),
			field('formFieldChoice', 'cat', 'Kategorie', { isRequired: true, options: ['Hobby'] }),
		]);

		await user.click(getByRole('button', { name: 'Anmelden' }));
		await findByText('Bitte wähle mindestens eine Option.');

		expect(
			getByRole('group', {
				description: 'Bitte wähle mindestens eine Option.',
				name: 'Essen (Pflichtfeld)',
			}).getAttribute('aria-invalid'),
		).toBe('true');
		expect(
			getByRole('group', {
				description: 'Bitte wähle eine Option.',
				name: 'Kategorie (Pflichtfeld)',
			}).getAttribute('aria-invalid'),
		).toBe('true');
		expect(document.activeElement).toBe(getByRole('checkbox', { name: 'Bratwurst' }));
	});

	it('renders consent text with its link', () => {
		const { getByRole } = renderFields([
			field('formFieldConsent', 'privacy', 'Datenschutz', {
				text: blockText(
					'Ich habe die ',
					{ href: '/datenschutz', text: 'Datenschutzerklärung' },
					' gelesen.',
				),
			}),
		]);

		expect(
			getByRole('checkbox', { name: 'Ich habe die Datenschutzerklärung gelesen.' }),
		).not.toBeNull();
		expect(getByRole('link', { name: 'Datenschutzerklärung' }).getAttribute('href')).toBe(
			'/datenschutz',
		);
	});

	// A draft in the preview skips the Studio's required checks: no text, no options yet.
	it('names a consent without text by its label', () => {
		const { getByRole } = renderFields([
			field('formFieldConsent', 'rules', 'Regeln anerkannt', { text: null }),
		]);

		expect(getByRole('checkbox', { name: 'Regeln anerkannt' })).not.toBeNull();
	});

	it('renders a choice without options', () => {
		const { getByRole, queryAllByRole } = renderFields([
			field('formFieldChoice', 'cat', 'Kategorie', { display: 'buttons', options: null }),
			field('formFieldChoice', 'size', 'Größe', { display: 'select', options: null }),
			field('formFieldChoice', 'food', 'Essen', { isMultiple: true, options: null }),
		]);

		expect(
			[getByRole('group', { name: 'Kategorie' }), getByRole('group', { name: 'Essen' })].map(
				(group) => within(group).queryAllByRole('button').length,
			),
		).toStrictEqual([0, 0]);
		expect(getByRole('combobox', { name: 'Größe' })).not.toBeNull();
		expect(queryAllByRole('checkbox')).toHaveLength(0);
	});

	it('renders notes as heading and text', () => {
		const { getByRole, getByText } = renderFields([
			field('formFieldNote', 'note', 'Hinweis', {
				label: null,
				text: blockText('Bitte alle Spieler eintragen.'),
				title: 'Spielerliste',
				width: null,
			}),
		]);

		expect(getByRole('heading', { level: 2, name: 'Spielerliste' })).not.toBeNull();
		expect(getByText('Bitte alle Spieler eintragen.')).not.toBeNull();
	});
});
