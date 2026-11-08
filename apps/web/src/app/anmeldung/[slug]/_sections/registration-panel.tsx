import type { ReactElement } from 'react';

import { FORM_DEFAULT_TEXTS } from '@tsgi-web/shared';

import { RegistrationForm } from '@/components/with-logic/registration-form/registration-form';
import { formatEventDate } from '@/lib/forms/format';
import type { RegistrationState } from '@/lib/forms/registration-state';
import type { FormPageQueryResult } from '@/types/sanity.types';

/**
 * The form without its type: the page has checked it, and a string fetched with stega characters is
 * not the literal the generated type names.
 */
type Form = Omit<NonNullable<FormPageQueryResult>, 'formType'>;

/**
 * Picks the text the editors wrote, or the default when they left it empty.
 *
 * @param text - The text of the editors, if any.
 * @param fallback - The default text.
 * @returns The text to show.
 */
function pickText(text: null | string | undefined, fallback: string): string {
	// An empty text counts as missing, which `??` would keep.
	// oxlint-disable-next-line typescript/prefer-nullish-coalescing
	return text || fallback;
}

function StateText({ children }: Readonly<{ children: string }>) {
	return (
		<p className="rounded-lg border bg-background-low-contrast p-6 text-lg whitespace-pre-line">
			{children}
		</p>
	);
}

function getContent({ form, isPreview, state }: Readonly<RegistrationPanelProps>): ReactElement {
	if (state === 'upcoming') {
		return (
			<StateText>
				{pickText(form.beforeStartText, FORM_DEFAULT_TEXTS.beforeStart).replace(
					'{start}',
					form.registrationStart ? formatEventDate(form.registrationStart) : '',
				)}
			</StateText>
		);
	}

	if (state === 'closed') {
		return <StateText>{pickText(form.afterEndText, FORM_DEFAULT_TEXTS.afterEnd)}</StateText>;
	}

	return (
		<RegistrationForm
			fields={form.fields ?? []}
			formId={form._id}
			isPreview={isPreview}
			isWaitlist={state === 'waitlist'}
			successText={pickText(form.successText, FORM_DEFAULT_TEXTS.success)}
			waitlistSuccessText={pickText(form.waitlistSuccessText, FORM_DEFAULT_TEXTS.waitlistSuccess)}
		/>
	);
}

/**
 * What the visitor can do about the registration right now: fill in the form while it is open or
 * full, and read why they cannot before it begins and after it ended.
 *
 * @param props - The panel's props.
 * @param props.form - The form document.
 * @param props.isPreview - Whether the page is shown in draft mode, where nothing may be submitted.
 * @param props.state - Where the registration stands.
 * @returns The form or the text of the state.
 */
function RegistrationPanel({
	form,
	isPreview = false,
	state,
}: Readonly<RegistrationPanelProps>): ReactElement {
	return (
		<section aria-label="Anmeldung" className="px-4 py-8 sm:px-6 lg:px-10 lg:py-16">
			<div className="mx-auto max-w-4xl lg:ml-0">{getContent({ form, isPreview, state })}</div>
		</section>
	);
}

interface RegistrationPanelProps {
	form: Form;
	isPreview?: boolean;
	state: RegistrationState;
}

export { RegistrationPanel };
