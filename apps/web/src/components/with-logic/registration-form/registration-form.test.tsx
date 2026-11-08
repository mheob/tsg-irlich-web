import { setTimeout as delay } from 'node:timers/promises';

import { fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { submitForm } from '@/actions/submit-form';
import type { FormFieldDefinition } from '@/lib/forms/types';

import { blockText, field } from '../../../../test-utils/form-fields';
import { renderWithUser } from '../../../../test-utils/render';
import type { RenderWithUserResult } from '../../../../test-utils/render';
import { hydrate, renderOnServer } from '../../../../test-utils/ssr';
import { RegistrationForm } from './registration-form';

// The form calls the action directly inside `settle()`, like the contact form, so the action
// module is the boundary to mock.
vi.mock(import('@/actions/submit-form'), () => ({ submitForm: vi.fn() }));

const mockedSubmitForm = vi.mocked(submitForm);

type SubmitFormResult = Awaited<ReturnType<typeof submitForm>>;

const SUCCESS_TEXT = 'Deine Anmeldung ist eingegangen.';
const WAITLIST_SUCCESS_TEXT = 'Du stehst auf der Warteliste.';
const SEND_ERROR = 'Die Anmeldung konnte nicht gesendet werden. Bitte versuche es später erneut.';
const UNAVAILABLE_ERROR = 'Die Anmeldung ist gerade nicht möglich. Bitte lade die Seite neu.';

const FIELDS: FormFieldDefinition[] = [
	field('formFieldText', 'team', 'Teamname', { isRequired: true, width: 'half' }),
	field('formFieldEmail', 'mail', 'E-Mail', { isRequired: true, width: 'half' }),
	field('formFieldConsent', 'privacy', 'Datenschutz', {
		isRequired: true,
		text: blockText(
			'Ich habe die ',
			{ href: '/datenschutz', text: 'Datenschutzerklärung' },
			' gelesen.',
		),
	}),
];

function renderForm(props: Partial<Parameters<typeof RegistrationForm>[0]> = {}) {
	return renderWithUser(
		<RegistrationForm
			fields={FIELDS}
			formId="form-1"
			isWaitlist={false}
			successText={SUCCESS_TEXT}
			waitlistSuccessText={WAITLIST_SUCCESS_TEXT}
			{...props}
		/>,
	);
}

async function fillIn({ getByRole, user }: RenderWithUserResult): Promise<void> {
	await user.type(getByRole('textbox', { name: 'Teamname' }), 'FC Irlich');
	await user.type(getByRole('textbox', { name: 'E-Mail' }), 'max@example.com');
	await user.click(getByRole('checkbox', { name: 'Ich habe die Datenschutzerklärung gelesen.' }));
}

describe('the registration form', () => {
	afterEach(() => {
		mockedSubmitForm.mockReset();
	});

	it('shows the messages on an empty submit and does not call the action', async () => {
		const { findAllByText, getByRole, getByText, user } = renderForm();

		await user.click(getByRole('button', { name: 'Anmelden' }));

		// The empty email asks to be filled in, like the empty text, not for a valid address.
		await expect(findAllByText('Bitte fülle dieses Feld aus.')).resolves.toHaveLength(2);
		expect(getByText('Bitte bestätige dies, um fortzufahren.')).not.toBeNull();
		expect(mockedSubmitForm).not.toHaveBeenCalled();
	});

	it('submits formId, values and an empty website', async () => {
		mockedSubmitForm.mockResolvedValue({ data: { status: 'registered' } });
		const rendered = renderForm();

		await fillIn(rendered);
		await rendered.user.click(rendered.getByRole('button', { name: 'Anmelden' }));

		await rendered.findByText(SUCCESS_TEXT);
		expect(mockedSubmitForm).toHaveBeenCalledExactlyOnceWith({
			formId: 'form-1',
			values: { mail: 'max@example.com', privacy: true, team: 'FC Irlich' },
			website: '',
		});
	});

	// A bot fills every input it finds; the action answers it as if it had worked.
	it('passes what was typed into the hidden website field on to the action', async () => {
		mockedSubmitForm.mockResolvedValue({ data: { status: 'registered' } });
		const rendered = renderForm();
		// No role query reaches it: the wrapper hides it from assistive technology, as it should.
		const website = rendered.getByLabelText('Website');

		expect([website.tabIndex, website.getAttribute('autocomplete')]).toStrictEqual([-1, 'off']);
		expect(website.getAttribute('name')).toBe('website');
		expect(website.closest('[aria-hidden="true"]')).not.toBeNull();

		await rendered.user.type(website, 'https://spam.example');
		await fillIn(rendered);
		await rendered.user.click(rendered.getByRole('button', { name: 'Anmelden' }));

		await rendered.findByText(SUCCESS_TEXT);
		expect(mockedSubmitForm).toHaveBeenCalledWith(
			expect.objectContaining({ website: 'https://spam.example' }),
		);
	});

	it('shows the success text', async () => {
		mockedSubmitForm.mockResolvedValue({ data: { status: 'registered' } });
		const rendered = renderForm();

		await fillIn(rendered);
		await rendered.user.click(rendered.getByRole('button', { name: 'Anmelden' }));

		const alert = await rendered.findByRole('alert');
		expect(alert.textContent).toContain(SUCCESS_TEXT);
		expect(rendered.queryByRole('button', { name: 'Anmelden' })).toBeNull();
		expect(rendered.queryByRole('textbox', { name: 'Teamname' })).toBeNull();
	});

	it('shows the waitlist success text', async () => {
		mockedSubmitForm.mockResolvedValue({ data: { status: 'waitlist' } });
		const rendered = renderForm({ isWaitlist: true });

		await fillIn(rendered);
		await rendered.user.click(rendered.getByRole('button', { name: 'Auf die Warteliste' }));

		const alert = await rendered.findByRole('alert');
		expect(alert.textContent).toContain(WAITLIST_SUCCESS_TEXT);
		expect(rendered.queryByText(SUCCESS_TEXT)).toBeNull();
	});

	it('labels the button for the waitlist', () => {
		const { getByRole, queryByRole } = renderForm({ isWaitlist: true });

		expect(getByRole('button', { name: 'Auf die Warteliste' })).not.toBeNull();
		expect(queryByRole('button', { name: 'Anmelden' })).toBeNull();
	});

	it('disables the submit button while the action is pending', async () => {
		const deferred = Promise.withResolvers<SubmitFormResult>();
		mockedSubmitForm.mockReturnValue(deferred.promise);
		const rendered = renderForm();

		await fillIn(rendered);
		await rendered.user.click(rendered.getByRole('button', { name: 'Anmelden' }));

		expect(rendered.getByRole('button', { name: 'Anmelden' }).hasAttribute('disabled')).toBe(true);

		deferred.resolve({ serverError: 'Fehler' });

		await rendered.findByText(SEND_ERROR);
		expect(rendered.getByRole('button', { name: 'Anmelden' }).hasAttribute('disabled')).toBe(false);
	});

	it('shows an error when the action rejects', async () => {
		mockedSubmitForm.mockRejectedValue(new Error('offline'));
		const rendered = renderForm();

		await fillIn(rendered);
		await rendered.user.click(rendered.getByRole('button', { name: 'Anmelden' }));

		await expect(rendered.findByText(SEND_ERROR)).resolves.not.toBeNull();
		expect(rendered.getByRole('textbox', { name: 'Teamname' })).not.toBeNull();
	});

	it('shows an error when the action reports a server error', async () => {
		mockedSubmitForm.mockResolvedValue({ serverError: 'Something went wrong' });
		const rendered = renderForm();

		await fillIn(rendered);
		await rendered.user.click(rendered.getByRole('button', { name: 'Anmelden' }));

		await expect(rendered.findByText(SEND_ERROR)).resolves.not.toBeNull();
		expect(rendered.queryByText('Something went wrong')).toBeNull();
	});

	it.each(['closed', 'upcoming'] as const)(
		'asks to reload the page when the registration is %s',
		async (status) => {
			mockedSubmitForm.mockResolvedValue({ data: { status } });
			const rendered = renderForm();

			await fillIn(rendered);
			await rendered.user.click(rendered.getByRole('button', { name: 'Anmelden' }));

			await expect(rendered.findByText(UNAVAILABLE_ERROR)).resolves.not.toBeNull();
			expect(rendered.queryByText(SUCCESS_TEXT)).toBeNull();
		},
	);

	// Sent ahead of hydration, the browser would post the form itself; `noValidate` lets the schema
	// name what is wrong instead of the browser's own bubbles.
	it('posts the form and leaves the checks to the schema', () => {
		const { getByRole } = renderForm();
		const form = getByRole('button', { name: 'Anmelden' }).closest('form');

		expect(form?.method).toBe('post');
		expect(form?.noValidate).toBe(true);
	});

	it('disables the button before hydration', () => {
		const ui = (
			<RegistrationForm
				fields={FIELDS}
				formId="form-1"
				isWaitlist={false}
				successText={SUCCESS_TEXT}
				waitlistSuccessText={WAITLIST_SUCCESS_TEXT}
			/>
		);
		const container = renderOnServer(ui);
		const submit = () => within(container).getByRole('button', { name: 'Anmelden' });

		expect(submit().hasAttribute('disabled')).toBe(true);

		const root = hydrate(container, ui);

		expect(root.onRecoverableError).not.toHaveBeenCalled();
		expect(submit().hasAttribute('disabled')).toBe(false);

		root.unmount();
	});

	it('never calls the action from the preview, not even on Enter', async () => {
		const rendered = renderForm({ isPreview: true });

		await fillIn(rendered);
		await rendered.user.type(rendered.getByRole('textbox', { name: 'Teamname' }), '{Enter}');
		// A submit event that bypasses the disabled button reaches the handler, which stops it too.
		fireEvent.submit(rendered.getByRole('button', { name: 'Anmelden' }));
		await delay(0);

		expect(mockedSubmitForm).not.toHaveBeenCalled();
	});

	it('disables submitting in the preview', async () => {
		const rendered = renderForm({ isPreview: true });
		const submit = rendered.getByRole('button', {
			description: 'In der Vorschau kann nichts abgesendet werden.',
			name: 'Anmelden',
		});

		expect(submit.hasAttribute('disabled')).toBe(true);

		await fillIn(rendered);
		await rendered.user.click(submit);

		expect(mockedSubmitForm).not.toHaveBeenCalled();
	});
});
