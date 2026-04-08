'use server';

import { headers } from 'next/headers';
import { treeifyError } from 'zod';

import { subscribe, subscriberSchema } from '@/lib/cleverreach';
import type { DoiMetadata } from '@/lib/cleverreach';

const ERROR_MESSAGES: Record<string, string> = {
	ALREADY_SUBSCRIBED: 'Diese E-Mail-Adresse ist bereits für den Newsletter registriert.',
	INTERNAL_ERROR: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.',
	VALIDATION_ERROR: 'Bitte überprüfe Deine Eingaben.',
};

function validateEmail(formData: FormData): { error: string } | { email: string } {
	const rawData = { email: formData.get('email') };
	const validation = subscriberSchema.safeParse(rawData);

	if (!validation.success) {
		const fieldErrors = treeifyError(validation.error);
		return { error: fieldErrors.errors[0] };
	}

	return { email: validation.data.email };
}

async function getRequestMetadata(): Promise<DoiMetadata> {
	const headersList = await headers();

	return {
		referer: headersList.get('referer') ?? '',
		userAgent: headersList.get('user-agent') ?? 'Mozilla/5.0',
		userIp: headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0',
	};
}

function toErrorState(
	error: string,
	code: string | undefined,
): Extract<NewsletterFormState, { success: false }> {
	return {
		error,
		message: ERROR_MESSAGES[code ?? ''] ?? error,
		success: false,
		title: 'Fehler',
	};
}

const SUCCESS_STATE: Extract<NewsletterFormState, { success: true }> = {
	message:
		'Bitte bestätige Deine Anmeldung über den Link in der E-Mail, die wir Dir gesendet haben.',
	success: true,
	title: 'Vielen Dank!',
};

/**
 * Server action for subscribing a user to the newsletter via CleverReach.
 *
 * This action is intended for use with React's `useActionState`. It accepts a FormData object with an 'email' field,
 * validates the value using `subscriberSchema`, and then attempts to subscribe the user to the CleverReach list.
 *
 * On validation or subscription error, it returns a user-friendly error message and code, suitable for UI feedback.
 * On success, it provides a confirmation message guiding the user to check their email to complete the double-opt-in process.
 *
 * @example
 *   const [state, formAction, isPending] = useActionState(subscribeToNewsletter, null);
 *   <form action={formAction}>...</form>
 *
 * @param _previousState Previous form state (unused; required by useActionState signature)
 * @param formData Incoming form data (expects an 'email' field)
 * @returns NewsletterFormState indicating success or error, with message and optional error code for the UI
 */
export async function subscribeToNewsletter(
	_previousState: NewsletterFormState,
	formData: FormData,
): Promise<NewsletterFormState> {
	const validated = validateEmail(formData);

	if ('error' in validated) {
		return {
			error: validated.error,
			message: 'Bitte überprüfen Deine Eingaben.',
			success: false,
			title: 'Fehler',
		};
	}

	const doiMetadata = await getRequestMetadata();
	const result = await subscribe({ email: validated.email }, doiMetadata);

	if (!result.success) {
		return toErrorState(result.error, result.code);
	}

	return SUCCESS_STATE;
}

// Form state type for useActionState
export type NewsletterFormState =
	| null
	| { error: string; message: string; success: false; title: string }
	| { message: string; success: true; title: string };
