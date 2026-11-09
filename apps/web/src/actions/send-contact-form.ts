'use server';

import { returnValidationErrors } from 'next-safe-action';

import { ContactForwardEmail } from '@tsgi-web/email';

import { assertHuman } from '@/lib/actions/bot-protection';
import { actionClient } from '@/lib/actions/safe-action';
import { env } from '@/lib/env';
import { resend } from '@/lib/resend';
import { client } from '@/lib/sanity/client';
import { contactReceiversQuery } from '@/lib/sanity/queries/pages/contact';
import { contactFormSchema } from '@/lib/validations/contact-form';
import type { ContactReceiversQueryResult } from '@/types/sanity.types.generated';
import { getBaseUrl } from '@/utils/url';

/** The revalidation webhook expires this tag whenever the contact page is published. */
const CONTACT_TAG = 'contact';
const RECEIVERS_REVALIDATE_SECONDS = 3600;

type Receiver = NonNullable<ContactReceiversQueryResult>[number];

/**
 * Looks a receiver of the contact page up by its key. The address only ever comes from Sanity:
 * trusting one the client sends would let anyone mail any address through the notification
 * sender (WEB-410).
 *
 * @param key - The `_key` the form submitted.
 * @returns The receiver, or `undefined` when the contact page lists no receiver with that key.
 */
async function findReceiver(key: string): Promise<Receiver | undefined> {
	const receivers = await client.fetch<ContactReceiversQueryResult>(
		contactReceiversQuery,
		{},
		{
			next: { revalidate: RECEIVERS_REVALIDATE_SECONDS, tags: [CONTACT_TAG] },
			perspective: 'published',
		},
	);

	return receivers?.find((receiver) => receiver._key === key);
}

export const sendContactForm = actionClient
	.inputSchema(contactFormSchema)
	.action(async ({ parsedInput: data }) => {
		await assertHuman();
		const { email, message, name, receiver: receiverKey } = data;

		const receiver = receiverKey === undefined ? undefined : await findReceiver(receiverKey);

		if (receiverKey !== undefined && !receiver) {
			returnValidationErrors(contactFormSchema, {
				receiver: { _errors: ['Unbekannter Empfänger.'] },
			});
		}

		const to =
			env('NODE_ENV') === 'production'
				? (receiver?.email ?? 'info@tsg-irlich.de')
				: 'it@tsg-irlich.de';

		const { error } = await resend.emails.send({
			bcc: ['it@tsg-irlich.de'],
			from: 'TSG Irlich - Benachrichtigungen <webseite@notifications.tsg-irlich.de>',
			react: ContactForwardEmail({
				baseUrl: getBaseUrl(),
				contactEmail: email,
				contactMessage: message,
				contactName: name,
				receiver: receiver?.name,
			}),
			replyTo: email,
			subject: `Webseiten-Kontaktformular: Neue Nachricht von ${name}`,
			to,
		});

		if (error) {
			console.error('Resend API error:', error);
			throw new Error('Email could not be sent');
		}
	});
