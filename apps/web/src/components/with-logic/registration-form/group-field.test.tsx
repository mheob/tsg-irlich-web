import { describe, expect, it, vi } from 'vite-plus/test';

import { submitForm } from '@/actions/submit-form';

import { field } from '../../../../test-utils/form-fields';
import { renderWithUser } from '../../../../test-utils/render';
import type { RenderWithUserResult } from '../../../../test-utils/render';
import { RegistrationForm } from './registration-form';

vi.mock(import('@/actions/submit-form'), () => ({ submitForm: vi.fn() }));

const mockedSubmitForm = vi.mocked(submitForm);

function players(overrides: Record<string, unknown> = {}) {
	return field('formFieldGroup', 'players', 'Mitspieler', {
		fields: [
			field('formFieldText', 'last', 'Nachname', { isRequired: true, width: 'half' }),
			field('formFieldText', 'first', 'Vorname', { isRequired: true, width: 'half' }),
			field('formFieldText', 'town', 'Wohnort'),
		],
		isRequired: true,
		itemLabel: 'Spieler',
		...overrides,
	});
}

function renderGroup(overrides: Record<string, unknown> = {}) {
	return renderWithUser(
		<RegistrationForm
			fields={[players(overrides)]}
			formId="form-1"
			isWaitlist={false}
			successText="Danke"
			waitlistSuccessText="Warteliste"
		/>,
	);
}

/**
 * Types into the one open entry: its fields are the only ones on the page.
 *
 * @param rendered - The render result.
 * @param last - The surname.
 * @param first - The first name, left empty when omitted.
 */
async function fillOpenEntry(
	rendered: RenderWithUserResult,
	last: string,
	first?: string,
): Promise<void> {
	await rendered.user.type(rendered.getByRole('textbox', { name: 'Nachname' }), last);
	if (first) {
		await rendered.user.type(rendered.getByRole('textbox', { name: 'Vorname' }), first);
	}
}

describe('the repeatable group', () => {
	it('adds and removes entries', async () => {
		const { getAllByRole, getByRole, queryAllByRole, user } = renderGroup();
		const removeButtons = () => queryAllByRole('button', { name: /^Spieler \d+ entfernen$/u });

		expect(removeButtons()).toHaveLength(1);

		await user.click(getByRole('button', { name: '+ Spieler hinzufügen' }));

		expect(removeButtons()).toHaveLength(2);
		// Only the new entry is open, so its fields are the only ones on the page.
		expect(getAllByRole('textbox', { name: 'Nachname' })).toHaveLength(1);

		await user.click(getByRole('button', { name: 'Spieler 1 entfernen' }));

		expect(removeButtons()).toHaveLength(1);
		expect(getByRole('button', { name: 'Spieler 1 entfernen' })).not.toBeNull();
	});

	// A group may not carry `aria-required`, so its name says it.
	it('names the group by its label and says that it is required', () => {
		const { getByRole } = renderGroup({ helpText: 'Mindestens sechs Spieler' });

		expect(
			getByRole('group', {
				description: 'Mindestens sechs Spieler',
				name: 'Mitspieler (Pflichtfeld)',
			}),
		).not.toBeNull();
		expect(getByRole('group', { name: 'Spieler 1' })).not.toBeNull();
	});

	it('hides the add button at maxItems', async () => {
		const { getByRole, queryByRole, user } = renderGroup({ maxItems: 2 });

		await user.click(getByRole('button', { name: '+ Spieler hinzufügen' }));

		expect(queryByRole('button', { name: '+ Spieler hinzufügen' })).toBeNull();

		await user.click(getByRole('button', { name: 'Spieler 2 entfernen' }));

		expect(getByRole('button', { name: '+ Spieler hinzufügen' })).not.toBeNull();
	});

	it('collapses filled entries to "1 · Müller, Max"', async () => {
		const rendered = renderGroup();

		await fillOpenEntry(rendered, 'Müller', 'Max');
		await rendered.user.click(rendered.getByRole('button', { name: '+ Spieler hinzufügen' }));

		const summary = rendered.getByRole('button', { name: '1 · Müller, Max' });
		expect(summary.getAttribute('aria-expanded')).toBe('false');
		expect((rendered.getByRole('textbox', { name: 'Nachname' }) as HTMLInputElement).value).toBe(
			'',
		);

		await rendered.user.click(summary);

		// The entry opens again with what was typed, and the other one collapses.
		expect((rendered.getByRole('textbox', { name: 'Nachname' }) as HTMLInputElement).value).toBe(
			'Müller',
		);
		expect(
			rendered.getByRole('button', { name: '2 · Spieler' }).getAttribute('aria-expanded'),
		).toBe('false');

		await rendered.user.click(rendered.getByRole('button', { name: 'Spieler 2 entfernen' }));

		// Removing another entry leaves the open one open.
		expect(rendered.getByRole('button', { name: 'Spieler 1' }).getAttribute('aria-expanded')).toBe(
			'true',
		);
	});

	it('opens an entry with errors on submit', async () => {
		const rendered = renderGroup();

		await fillOpenEntry(rendered, 'Müller');
		await rendered.user.click(rendered.getByRole('button', { name: '+ Spieler hinzufügen' }));
		await fillOpenEntry(rendered, 'Schmidt', 'Lea');

		expect(rendered.getByRole('button', { name: '1 · Müller' })).not.toBeNull();

		await rendered.user.click(rendered.getByRole('button', { name: 'Anmelden' }));

		const message = await rendered.findByText('Bitte fülle dieses Feld aus.');
		// The first entry opened with its message and the focus; the valid one collapsed.
		expect(document.activeElement).toBe(
			rendered.getByRole('textbox', { description: message.textContent, name: 'Vorname' }),
		);
		expect((rendered.getByRole('textbox', { name: 'Nachname' }) as HTMLInputElement).value).toBe(
			'Müller',
		);
		expect(
			rendered.getByRole('button', { name: '2 · Schmidt, Lea' }).getAttribute('aria-expanded'),
		).toBe('false');
		expect(mockedSubmitForm).not.toHaveBeenCalled();
	});

	it('leaves the focus on an invalid field ahead of the group', async () => {
		const rendered = renderWithUser(
			<RegistrationForm
				fields={[field('formFieldText', 'team', 'Teamname', { isRequired: true }), players()]}
				formId="form-1"
				isWaitlist={false}
				successText="Danke"
				waitlistSuccessText="Warteliste"
			/>,
		);

		await fillOpenEntry(rendered, 'Müller');
		await rendered.user.click(rendered.getByRole('button', { name: '+ Spieler hinzufügen' }));
		await fillOpenEntry(rendered, 'Schmidt', 'Lea');
		await rendered.user.click(rendered.getByRole('button', { name: 'Anmelden' }));

		await rendered.findAllByText('Bitte fülle dieses Feld aus.');
		expect(rendered.getByRole('button', { name: 'Spieler 1' }).getAttribute('aria-expanded')).toBe(
			'true',
		);
		expect(document.activeElement).toBe(rendered.getByRole('textbox', { name: 'Teamname' }));
	});

	// A draft in the preview skips the Studio's required checks, so a group may have no fields yet.
	it('renders a group without fields', async () => {
		const { getByRole, user } = renderGroup({ fields: null });

		await user.click(getByRole('button', { name: '+ Spieler hinzufügen' }));

		expect(getByRole('button', { name: '1 · Spieler' })).not.toBeNull();
		expect(getByRole('group', { name: 'Spieler 2' })).not.toBeNull();
	});

	it('marks a collapsed entry that still holds an error', async () => {
		const rendered = renderGroup();

		await fillOpenEntry(rendered, 'Müller');
		await rendered.user.click(rendered.getByRole('button', { name: '+ Spieler hinzufügen' }));
		await fillOpenEntry(rendered, 'Schmidt');
		await rendered.user.click(rendered.getByRole('button', { name: 'Anmelden' }));

		await rendered.findByText('Bitte fülle dieses Feld aus.');
		expect(rendered.getByRole('button', { name: '2 · Schmidt (fehlerhaft)' })).not.toBeNull();
	});

	it('names the entries left short of the minimum', async () => {
		const { findByText, getByRole, user } = renderGroup({ isRequired: false, minItems: 1 });

		expect(getByRole('button', { name: '+ Spieler hinzufügen' })).not.toBeNull();

		await user.click(getByRole('button', { name: 'Anmelden' }));

		const message = await findByText('Bitte mindestens 1 Einträge „Spieler“ angeben.');
		expect(
			getByRole('group', { description: message.textContent, name: 'Mitspieler' }),
		).not.toBeNull();
	});
});
