'use server';

import { headers } from 'next/headers';
import { treeifyError } from 'zod';

import { subscribe, subscriberSchema } from '@/lib/cleverreach';

// Form state type for useActionState
export type NewsletterFormState =
	| null
	| { error: string; message: string; success: false; title: string }
	| { message: string; success: true; title: string };

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
	const rawData = { email: formData.get('email') };

	// Validate form data against schema (ensures a proper email address is provided)
	const validation = subscriberSchema.safeParse(rawData);

	if (!validation.success) {
		const fieldErrors = treeifyError(validation.error);

		return {
			error: fieldErrors.errors[0],
			message: 'Bitte überprüfen Deine Eingaben.',
			success: false,
			title: 'Fehler',
		};
	}

	// Get request metadata for DOI tracking
	const headersList = await headers();
	const userIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
	const userAgent = headersList.get('user-agent') ?? 'Mozilla/5.0';
	const referer = headersList.get('referer') ?? '';

	// Attempt to subscribe the user via CleverReach integration
	const result = await subscribe(validation.data, { referer, userAgent, userIp });

	if (!result.success) {
		// Map specific CleverReach error codes to user-friendly German messages
		const errorMessages: Record<string, string> = {
			ALREADY_SUBSCRIBED: 'Diese E-Mail-Adresse ist bereits für den Newsletter registriert.',
			INTERNAL_ERROR: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.',
			VALIDATION_ERROR: 'Bitte überprüfe Deine Eingaben.',
		};

		return {
			error: result.error,
			message: errorMessages[result.code ?? ''] ?? result.error,
			success: false,
			title: 'Fehler',
		};
	}

	return {
		message:
			'Bitte bestätige Deine Anmeldung über den Link in der E-Mail, die wir Dir gesendet haben.',
		success: true,
		title: 'Vielen Dank!',
	};
}
