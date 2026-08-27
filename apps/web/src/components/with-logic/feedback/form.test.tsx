import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLinearIssue } from '@/actions/create-linear-issue';

import { renderWithUser } from '../../../../test-utils/render';
import { FeedbackForm } from './form';

// `feedback/form.tsx` imports `createLinearIssue` and calls it directly (wrapped in `settle()`),
// the same way `contact-form.tsx` calls `sendContactForm` — so the boundary to mock is the action
// module itself, not `next-safe-action`'s `useAction`.
vi.mock(import('@/actions/create-linear-issue'), () => ({ createLinearIssue: vi.fn() }));

// `vi.mocked` only needs the reference to the mock function object; it is never invoked as a bare,
// unbound `this`-dependent call.
const mockedCreateLinearIssue = vi.mocked(createLinearIssue);

const VALID_TITLE = 'Die Suche funktioniert nicht mehr richtig';
const VALID_DESCRIPTION = 'Beim Klicken auf den Suchbutton passiert überhaupt nichts mehr.';

function renderForm() {
	return renderWithUser(<FeedbackForm />);
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

describe('the feedback form', () => {
	afterEach(() => {
		mockedCreateLinearIssue.mockReset();
	});

	it('shows the schema validation messages on an empty submission and never calls the action', async () => {
		const { findByText, getByRole, getByText, user } = renderForm();

		await user.click(getByRole('button', { name: 'Feedback senden' }));

		await expect(
			findByText('Der Titel muss mindestens 5 Zeichen lang sein'),
		).resolves.not.toBeNull();
		expect(getByText('Die Beschreibung muss mindestens 20 Zeichen lang sein')).not.toBeNull();
		expect(getByText('Bitte akzeptiere die Datenschutzbestimmungen')).not.toBeNull();
		expect(mockedCreateLinearIssue).not.toHaveBeenCalled();
	});

	it('shows the browser, operating system and device fields by default, since the feedback type defaults to a bug report', () => {
		const { getByRole, queryByLabelText } = renderForm();

		// Base UI's toggle group reports its pressed item with `aria-pressed`, not the `aria-checked`
		// of Radix's `type="single"` radio group.
		expect(getByRole('button', { name: 'Fehlermeldung' }).getAttribute('aria-pressed')).toBe(
			'true',
		);
		expect(queryByLabelText('Browser')).not.toBeNull();
		expect(queryByLabelText('Betriebssystem')).not.toBeNull();
		expect(queryByLabelText(/^Gerät/u)).not.toBeNull();
	});

	it('hides the browser, operating system and device fields once the feedback type is switched away from a bug report', async () => {
		const { getByRole, queryByLabelText, user } = renderForm();

		await user.click(getByRole('button', { name: 'Verbesserungsvorschlag' }));

		expect(queryByLabelText('Browser')).toBeNull();
		expect(queryByLabelText('Betriebssystem')).toBeNull();
		expect(queryByLabelText(/^Gerät/u)).toBeNull();
	});

	it('shows the browser, operating system and device fields again once the feedback type is switched back to a bug report', async () => {
		const { getByRole, queryByLabelText, user } = renderForm();

		await user.click(getByRole('button', { name: 'Verbesserungsvorschlag' }));
		await user.click(getByRole('button', { name: 'Fehlermeldung' }));

		expect(queryByLabelText('Browser')).not.toBeNull();
		expect(queryByLabelText('Betriebssystem')).not.toBeNull();
		expect(queryByLabelText(/^Gerät/u)).not.toBeNull();
	});

	it('calls the action exactly once with the whole payload on a valid submission and shows the confirmation', async () => {
		mockedCreateLinearIssue.mockResolvedValue({
			data: { issueId: 'issue-1', issueIdentifier: 'TSG-42' },
		});
		const { findByRole, getByLabelText, getByRole, user } = renderForm();

		await user.type(getByLabelText('Titel'), VALID_TITLE);
		await user.type(getByLabelText('Beschreibung'), VALID_DESCRIPTION);

		await user.click(getByLabelText('Browser'));
		await user.click(await findByRole('option', { name: 'Firefox' }));

		await user.click(getByLabelText('Betriebssystem'));
		await user.click(await findByRole('option', { name: 'macOS' }));

		await user.type(getByLabelText(/^E-Mail/u), 'max@mustermann.de');
		await user.click(getByLabelText('Datenschutzbestimmungen'));

		await user.click(getByRole('button', { name: 'Feedback senden' }));

		await findByRole('heading', { name: 'Vielen Dank!' });
		const alert = getByRole('alert');
		expect(alert.textContent).toContain('Deine Ticketnummer für Nachfragen lautet: TSG-42.');

		expect(mockedCreateLinearIssue).toHaveBeenCalledExactlyOnceWith({
			browser: 'firefox',
			description: VALID_DESCRIPTION,
			device: undefined,
			email: 'max@mustermann.de',
			operationSystem: 'macos',
			privacy: true,
			screenshotUrls: undefined,
			title: VALID_TITLE,
			type: 'bug',
		});
	});

	it("renders the action's server error to the user", async () => {
		mockedCreateLinearIssue.mockResolvedValue({ serverError: 'Der Server hat ein Problem.' });
		const { findByRole, findByText, getByLabelText, getByRole, user } = renderForm();

		await user.type(getByLabelText('Titel'), VALID_TITLE);
		await user.type(getByLabelText('Beschreibung'), VALID_DESCRIPTION);
		await user.click(getByLabelText('Datenschutzbestimmungen'));

		await user.click(getByRole('button', { name: 'Feedback senden' }));

		await findByRole('heading', { name: 'Fehler' });
		await expect(findByText('Der Server hat ein Problem.')).resolves.not.toBeNull();
	});

	it('disables submission while the action is pending', async () => {
		const deferred = createDeferred<Awaited<ReturnType<typeof createLinearIssue>>>();
		mockedCreateLinearIssue.mockReturnValue(deferred.promise);
		const { findByRole, getByLabelText, getByRole, user } = renderForm();

		await user.type(getByLabelText('Titel'), VALID_TITLE);
		await user.type(getByLabelText('Beschreibung'), VALID_DESCRIPTION);
		await user.click(getByLabelText('Datenschutzbestimmungen'));

		await user.click(getByRole('button', { name: 'Feedback senden' }));

		const pendingButton = await findByRole('button', { name: 'Wird gesendet...' });
		expect(pendingButton.hasAttribute('disabled')).toBe(true);

		// Resolved with a server error rather than success, so the form (and its submit button)
		// stays mounted afterwards instead of being replaced by the success view.
		deferred.resolve({ serverError: 'Der Server hat ein Problem.' });

		const enabledButton = await findByRole('button', { name: 'Feedback senden' });
		expect(enabledButton.hasAttribute('disabled')).toBe(false);
	});
});
