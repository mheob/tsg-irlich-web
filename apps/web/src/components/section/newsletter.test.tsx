import { afterEach, describe, expect, it, vi } from 'vitest';

import { subscribeToNewsletter } from '@/actions/subscribe-to-newsletter';
import type { NewsletterFormState } from '@/actions/subscribe-to-newsletter';

import { renderWithUser } from '../../../test-utils/render';
import { Newsletter } from './newsletter';

// `newsletter.tsx` drives `useActionState` straight off `subscribeToNewsletter`, so — like
// `contact-form.test.tsx` mocks `sendContactForm` — the boundary to mock is the action module
// itself.
vi.mock(import('@/actions/subscribe-to-newsletter'), () => ({ subscribeToNewsletter: vi.fn() }));

const mockedSubscribeToNewsletter = vi.mocked(subscribeToNewsletter);

const SUCCESS_STATE: NewsletterFormState = {
	message:
		'Bitte bestätige Deine Anmeldung über den Link in der E-Mail, die wir Dir gesendet haben.',
	success: true,
	title: 'Vielen Dank!',
};

const ERROR_STATE: NewsletterFormState = {
	error: 'ALREADY_SUBSCRIBED',
	message: 'Diese E-Mail-Adresse ist bereits für den Newsletter registriert.',
	success: false,
	title: 'Fehler',
};

function renderNewsletter() {
	return renderWithUser(<Newsletter />);
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

describe('newsletter', () => {
	afterEach(() => {
		mockedSubscribeToNewsletter.mockReset();
	});

	it('renders the title and message of the success state the action resolved with', async () => {
		mockedSubscribeToNewsletter.mockResolvedValue(SUCCESS_STATE);
		const { findByRole, findByText, getByRole, user } = renderNewsletter();

		await user.type(getByRole('textbox', { name: 'E-Mail' }), 'max@mustermann.de');
		await user.click(getByRole('button', { name: 'Abonnieren' }));

		await findByRole('heading', { name: 'Vielen Dank!' });
		await expect(findByText(SUCCESS_STATE.message)).resolves.not.toBeNull();
	});

	it('renders the message of the error state the action resolved with', async () => {
		mockedSubscribeToNewsletter.mockResolvedValue(ERROR_STATE);
		const { findByRole, findByText, getByRole, user } = renderNewsletter();

		await user.type(getByRole('textbox', { name: 'E-Mail' }), 'max@mustermann.de');
		await user.click(getByRole('button', { name: 'Abonnieren' }));

		await findByRole('heading', { name: 'Fehler' });
		await expect(findByText(ERROR_STATE.message)).resolves.not.toBeNull();
	});

	it('submits the address the user typed as the FormData the action receives', async () => {
		mockedSubscribeToNewsletter.mockResolvedValue(SUCCESS_STATE);
		const { findByRole, getByRole, user } = renderNewsletter();

		await user.type(getByRole('textbox', { name: 'E-Mail' }), 'max@mustermann.de');
		await user.click(getByRole('button', { name: 'Abonnieren' }));

		await findByRole('heading', { name: 'Vielen Dank!' });

		expect(mockedSubscribeToNewsletter).toHaveBeenCalledOnce();
		const [, formData] = mockedSubscribeToNewsletter.mock.calls[0];
		expect(formData.get('email')).toBe('max@mustermann.de');
	});

	it('disables the email field and the submit button while the action is pending', async () => {
		const deferred = createDeferred<NewsletterFormState>();
		mockedSubscribeToNewsletter.mockReturnValue(deferred.promise);
		const { findByRole, getByRole, user } = renderNewsletter();

		await user.type(getByRole('textbox', { name: 'E-Mail' }), 'max@mustermann.de');
		await user.click(getByRole('button', { name: 'Abonnieren' }));

		const pendingButton = await findByRole('button', { name: 'Wird angemeldet …' });

		expect(pendingButton.hasAttribute('disabled')).toBe(true);
		expect(getByRole('textbox', { name: 'E-Mail' }).hasAttribute('disabled')).toBe(true);

		deferred.resolve(SUCCESS_STATE);

		await findByRole('heading', { name: 'Vielen Dank!' });
		const enabledButton = await findByRole('button', { name: 'Abonnieren' });
		expect(enabledButton.hasAttribute('disabled')).toBe(false);
	});
});
