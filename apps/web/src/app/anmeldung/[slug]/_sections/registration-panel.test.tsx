import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { RegistrationForm } from '@/components/with-logic/registration-form/registration-form';
import type { FormPageQueryResult } from '@/types/sanity.types';

import { DORFTURNIER_FIELDS } from '../../../../../test-utils/form-fields';
import { renderWithUser } from '../../../../../test-utils/render';
import { RegistrationPanel } from './registration-panel';

// The real form posts to a server action that reaches the write client.
vi.mock(import('@/components/with-logic/registration-form/registration-form'), () => ({
	RegistrationForm: vi.fn(() => <form aria-label="Anmeldeformular" />),
}));

const mockedForm = vi.mocked(RegistrationForm);

const FORM = {
	_id: 'form-dorfturnier',
	afterEndText: null,
	beforeStartText: null,
	fields: DORFTURNIER_FIELDS,
	registrationStart: '2027-04-10T08:00:00Z',
	successText: null,
	waitlistSuccessText: null,
} as unknown as NonNullable<FormPageQueryResult>;

describe('registration panel', () => {
	afterEach(() => {
		mockedForm.mockClear();
	});

	it('names the start of an upcoming registration in the default text', () => {
		const { getByText, queryByRole } = renderWithUser(
			<RegistrationPanel form={FORM} state="upcoming" />,
		);

		expect(getByText('Die Anmeldung ist ab Sa., 10.04.2027, 10:00 Uhr möglich.')).not.toBeNull();
		expect(queryByRole('form')).toBeNull();
	});

	it('prefers the text of the editors for an upcoming registration', () => {
		const { getByText } = renderWithUser(
			<RegistrationPanel
				form={{ ...FORM, beforeStartText: 'Es geht ab {start} los!' }}
				state="upcoming"
			/>,
		);

		expect(getByText('Es geht ab Sa., 10.04.2027, 10:00 Uhr los!')).not.toBeNull();
	});

	it('tells that a closed registration is over', () => {
		const { getByText, queryByRole } = renderWithUser(
			<RegistrationPanel form={FORM} state="closed" />,
		);

		expect(getByText('Die Anmeldung ist beendet.')).not.toBeNull();
		expect(queryByRole('form')).toBeNull();
	});

	it('prefers the text of the editors for a closed registration', () => {
		const { getByText } = renderWithUser(
			<RegistrationPanel form={{ ...FORM, afterEndText: 'Leider zu spät.' }} state="closed" />,
		);

		expect(getByText('Leider zu spät.')).not.toBeNull();
	});

	it('shows the form while open, with the default confirmations', () => {
		const { getByRole } = renderWithUser(<RegistrationPanel form={FORM} state="open" />);

		expect(getByRole('form', { name: 'Anmeldeformular' })).not.toBeNull();
		expect(mockedForm.mock.calls[0]?.[0]).toMatchObject({
			fields: DORFTURNIER_FIELDS,
			formId: 'form-dorfturnier',
			isPreview: false,
			isWaitlist: false,
			successText: 'Vielen Dank! Deine Anmeldung ist eingegangen.',
			waitlistSuccessText:
				'Vielen Dank! Du stehst auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.',
		});
	});

	it('passes the confirmations of the editors on', () => {
		renderWithUser(
			<RegistrationPanel
				form={{ ...FORM, successText: 'Danke!', waitlistSuccessText: 'Warte noch.' }}
				state="open"
			/>,
		);

		expect(mockedForm.mock.calls[0]?.[0]).toMatchObject({
			successText: 'Danke!',
			waitlistSuccessText: 'Warte noch.',
		});
	});

	it('marks the form as a waitlist form once the places are gone', () => {
		renderWithUser(<RegistrationPanel form={FORM} state="waitlist" />);

		expect(mockedForm.mock.calls[0]?.[0]).toMatchObject({ isWaitlist: true });
	});

	it('hands the preview flag to the form', () => {
		renderWithUser(<RegistrationPanel form={FORM} isPreview state="open" />);

		expect(mockedForm.mock.calls[0]?.[0]).toMatchObject({ isPreview: true });
	});
});
