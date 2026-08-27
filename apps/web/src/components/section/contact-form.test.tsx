import { afterEach, describe, expect, it, vi } from 'vitest';

import { sendContactForm } from '@/actions/send-contact-form';

import { renderWithUser } from '../../../test-utils/render';
import { ContactForm } from './contact-form';

// `contact-form.tsx` imports `sendContactForm` and calls it directly (wrapped in `settle()`), it
// does not go through `next-safe-action`'s `useAction` hook — so the boundary to mock is the
// action module itself, the same way `send-contact-form.test.ts` mocks `@/lib/resend`.
vi.mock(import('@/actions/send-contact-form'), () => ({ sendContactForm: vi.fn() }));

// `vi.mocked` only needs the reference to the mock function object; it is never invoked as a bare,
// unbound `this`-dependent call.
// oxlint-disable-next-line typescript/unbound-method
const mockedSendContactForm = vi.mocked(sendContactForm);

const VALID_MESSAGE = 'Dies ist eine ausführliche Testnachricht für das Kontaktformular.';

function renderForm() {
	return renderWithUser(<ContactForm />);
}

interface Deferred<T> {
	promise: Promise<T>;
	resolve: (value: T) => void;
}

function createDeferred<T>(): Deferred<T> {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

describe('the contact form', () => {
	afterEach(() => {
		mockedSendContactForm.mockReset();
	});

	it('shows the schema validation messages on an empty submission and never calls the action', async () => {
		const { findByText, getByRole, getByText, user } = renderForm();

		await user.click(getByRole('button', { name: 'Kontaktiere uns' }));

		await expect(
			findByText('Der Name muss mindestens 2 Zeichen lang sein.'),
		).resolves.not.toBeNull();
		expect(getByText('Die E-Mail Adresse ist ungültig.')).not.toBeNull();
		expect(getByText('Die Nachricht muss mindestens 32 Zeichen lang sein.')).not.toBeNull();
		expect(getByText('Bitte akzeptiere die Datenschutzbestimmungen')).not.toBeNull();
		expect(mockedSendContactForm).not.toHaveBeenCalled();
	});

	it('calls the action exactly once with the parsed values on a valid submission', async () => {
		mockedSendContactForm.mockResolvedValue({});
		const { findByRole, getByLabelText, getByRole, user } = renderForm();

		await user.type(getByLabelText('Name'), 'Max Mustermann');
		await user.type(getByLabelText('E-Mail'), 'max@mustermann.de');
		await user.type(getByLabelText('Nachricht'), VALID_MESSAGE);
		await user.click(getByLabelText('Datenschutzbestimmungen'));

		await user.click(getByRole('button', { name: 'Kontaktiere uns' }));

		// The success `Alert` (see `error-alert.tsx`/`success-alert.tsx`) carries `role="alert"` but
		// no `aria-labelledby`, so it has no accessible *name* of its own even though its `AlertTitle`
		// is visibly "Vielen Dank!" — querying the heading is what actually resolves.
		await findByRole('heading', { name: 'Vielen Dank!' });

		expect(mockedSendContactForm).toHaveBeenCalledExactlyOnceWith({
			email: 'max@mustermann.de',
			message: VALID_MESSAGE,
			name: 'Max Mustermann',
			privacy: true,
			receiver: undefined,
		});
	});

	it("renders the action's server error to the user", async () => {
		mockedSendContactForm.mockResolvedValue({ serverError: 'Der Server hat ein Problem.' });
		const { findByRole, findByText, getByLabelText, getByRole, user } = renderForm();

		await user.type(getByLabelText('Name'), 'Max Mustermann');
		await user.type(getByLabelText('E-Mail'), 'max@mustermann.de');
		await user.type(getByLabelText('Nachricht'), VALID_MESSAGE);
		await user.click(getByLabelText('Datenschutzbestimmungen'));

		await user.click(getByRole('button', { name: 'Kontaktiere uns' }));

		await findByRole('heading', { name: 'Fehler' });
		await expect(findByText('Der Server hat ein Problem.')).resolves.not.toBeNull();
	});

	it('renders the confirmation and clears the fields on success', async () => {
		mockedSendContactForm.mockResolvedValue({});
		const { findByRole, getByLabelText, getByRole, user } = renderForm();

		await user.type(getByLabelText('Name'), 'Max Mustermann');
		await user.type(getByLabelText('E-Mail'), 'max@mustermann.de');
		await user.type(getByLabelText('Nachricht'), VALID_MESSAGE);
		await user.click(getByLabelText('Datenschutzbestimmungen'));

		await user.click(getByRole('button', { name: 'Kontaktiere uns' }));

		await findByRole('heading', { name: 'Vielen Dank!' });

		await user.click(getByRole('button', { name: 'Erneute Anfrage stellen' }));

		expect((getByLabelText('Name') as HTMLInputElement).value).toBe('');
		expect((getByLabelText('E-Mail') as HTMLInputElement).value).toBe('');
		expect((getByLabelText('Nachricht') as HTMLTextAreaElement).value).toBe('');
		// Base UI's checkbox puts the label's `id` on its hidden native input, so this is that input
		// rather than the `role="checkbox"` element Radix exposed.
		expect((getByLabelText('Datenschutzbestimmungen') as HTMLInputElement).checked).toBe(false);
	});

	it('disables submission while the action is pending', async () => {
		const deferred = createDeferred<Awaited<ReturnType<typeof sendContactForm>>>();
		mockedSendContactForm.mockReturnValue(deferred.promise);
		const { findByRole, getByLabelText, getByRole, user } = renderForm();

		await user.type(getByLabelText('Name'), 'Max Mustermann');
		await user.type(getByLabelText('E-Mail'), 'max@mustermann.de');
		await user.type(getByLabelText('Nachricht'), VALID_MESSAGE);
		await user.click(getByLabelText('Datenschutzbestimmungen'));

		await user.click(getByRole('button', { name: 'Kontaktiere uns' }));

		const pendingButton = await findByRole('button', { name: 'Wird gesendet...' });
		expect(pendingButton.hasAttribute('disabled')).toBe(true);

		// Resolved with a server error rather than success, so the form (and its submit button)
		// stays mounted afterwards instead of being replaced by the success view — the pending state
		// is a property of the form, not of the success confirmation.
		deferred.resolve({ serverError: 'Der Server hat ein Problem.' });

		const enabledButton = await findByRole('button', { name: 'Kontaktiere uns' });
		expect(enabledButton.hasAttribute('disabled')).toBe(false);
	});
});
